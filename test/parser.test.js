/**
 * Unit tests for package.json parsing and metadata extraction.
 * Uses native Node.js test runner (`node:test`).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const {
  readPackageJson,
  normalizeAuthor,
  normalizeRepository,
  extractMetadata,
  validateMetadata
} = require('../src/parser');

describe('parser: readPackageJson', () => {
  it('reads and parses existing package.json correctly', () => {
    const fixtureDir = path.resolve(__dirname, '../examples/sample-project');
    const pkg = readPackageJson(fixtureDir);

    assert.strictEqual(pkg.name, 'weather-cli');
    assert.strictEqual(pkg.version, '1.2.0');
    assert.strictEqual(pkg.license, 'MIT');
  });

  it('throws descriptive error if package.json does not exist', () => {
    const nonExistentDir = path.join(os.tmpdir(), `test-missing-${Date.now()}`);

    assert.throws(
      () => readPackageJson(nonExistentDir),
      /No package\.json file found at/
    );
  });

  it('throws descriptive error if package.json contains invalid JSON syntax', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-invalid-json-'));
    const invalidJsonPath = path.join(tempDir, 'package.json');
    fs.writeFileSync(invalidJsonPath, '{ invalid json here: missing quotes }', 'utf8');

    try {
      assert.throws(
        () => readPackageJson(tempDir),
        /Invalid JSON syntax in package\.json/
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('throws error if package.json content is an array or null', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-non-object-'));
    const nonObjectPath = path.join(tempDir, 'package.json');
    fs.writeFileSync(nonObjectPath, '["not", "an", "object"]', 'utf8');

    try {
      assert.throws(
        () => readPackageJson(tempDir),
        /package\.json content must be a valid JSON object/
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('parser: normalizeAuthor', () => {
  it('handles string authors', () => {
    assert.strictEqual(normalizeAuthor('Alice Dev'), 'Alice Dev');
  });

  it('handles object authors with name, email, and url', () => {
    const authorObj = {
      name: 'Bob Smith',
      email: 'bob@example.com',
      url: 'https://bob.dev'
    };
    assert.strictEqual(normalizeAuthor(authorObj), 'Bob Smith <bob@example.com> (https://bob.dev)');
  });

  it('returns empty string for missing author', () => {
    assert.strictEqual(normalizeAuthor(null), '');
    assert.strictEqual(normalizeAuthor(undefined), '');
  });
});

describe('parser: normalizeRepository', () => {
  it('strips git+ prefix and .git suffix', () => {
    const input = 'git+https://github.com/user/project.git';
    assert.strictEqual(normalizeRepository(input), 'https://github.com/user/project');
  });

  it('handles git:// protocols', () => {
    const input = 'git://github.com/user/project.git';
    assert.strictEqual(normalizeRepository(input), 'https://github.com/user/project');
  });

  it('handles object with url property', () => {
    const input = { type: 'git', url: 'https://github.com/user/project.git' };
    assert.strictEqual(normalizeRepository(input), 'https://github.com/user/project');
  });

  it('converts shorthand user/repo to full github URL', () => {
    assert.strictEqual(normalizeRepository('owner/repo'), 'https://github.com/owner/repo');
  });

  it('returns empty string when repository is missing', () => {
    assert.strictEqual(normalizeRepository(null), '');
    assert.strictEqual(normalizeRepository(undefined), '');
  });
});

describe('parser: extractMetadata & validateMetadata', () => {
  it('extracts complete metadata correctly', () => {
    const sample = {
      name: 'cool-tool',
      version: '2.0.0',
      description: 'A cool CLI utility',
      scripts: { test: 'node --test' },
      dependencies: { lodash: '^4.17.21' },
      devDependencies: { mocha: '^10.0.0' },
      keywords: ['cli', 'utility'],
      bin: { 'cool': './bin/cli.js' },
      license: 'Apache-2.0'
    };

    const metadata = extractMetadata(sample);
    assert.strictEqual(metadata.name, 'cool-tool');
    assert.strictEqual(metadata.hasExplicitName, true);
    assert.strictEqual(metadata.version, '2.0.0');
    assert.strictEqual(metadata.binName, 'cool');
    assert.strictEqual(metadata.license, 'Apache-2.0');
    assert.deepStrictEqual(metadata.dependencies, ['lodash']);
    assert.deepStrictEqual(metadata.devDependencies, ['mocha']);
    assert.deepStrictEqual(metadata.keywords, ['cli', 'utility']);
  });

  it('infers project name from fallback directory when name is omitted', () => {
    const emptyPkg = {};
    const metadata = extractMetadata(emptyPkg, '/Users/test/workspace/my-awesome-lib');

    assert.strictEqual(metadata.name, 'my-awesome-lib');
    assert.strictEqual(metadata.hasExplicitName, false);
    assert.strictEqual(metadata.version, '');
    assert.strictEqual(metadata.license, '');
    assert.deepStrictEqual(metadata.scripts, {});
  });

  it('uses Unnamed Project if neither name nor directory is available', () => {
    const emptyPkg = {};
    const metadata = extractMetadata(emptyPkg);

    assert.strictEqual(metadata.name, 'Unnamed Project');
    assert.strictEqual(metadata.hasExplicitName, false);
  });

  it('flags warnings for incomplete package.json files', () => {
    const incomplete = extractMetadata({});
    const validation = validateMetadata(incomplete);

    assert.strictEqual(validation.valid, false);
    assert(validation.warnings.includes('Project "name" is missing in package.json.'));
    assert(validation.warnings.includes('Project "description" is empty in package.json.'));
    assert(validation.warnings.includes('Project "version" is not defined.'));
    assert(validation.warnings.includes('Project "license" is not specified.'));
    assert(validation.warnings.includes('Project "repository" URL is not specified.'));
    assert(validation.warnings.includes('No npm "scripts" are defined in package.json.'));
  });
});
