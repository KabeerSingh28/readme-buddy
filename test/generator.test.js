/**
 * Unit tests for README generation and Markdown templating.
 * Uses native Node.js test runner (`node:test`).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  buildBadges,
  buildPrerequisites,
  buildInstallation,
  buildUsage,
  buildScriptsTable,
  buildLicense,
  generateReadmeContent
} = require('../src/generator');

const {
  generateReadme,
  buildMarkdown
} = require('../src/index');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

describe('generator: buildBadges', () => {
  it('generates shields badges for version, license and node engine', () => {
    const metadata = {
      version: '1.0.0',
      license: 'MIT',
      engines: { node: '>=18.0.0' }
    };

    const result = buildBadges(metadata);
    assert(result.includes('https://img.shields.io/badge/npm%20version-1.0.0-blue'));
    assert(result.includes('https://img.shields.io/badge/license-MIT-green'));
    assert(result.includes('https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen'));
  });
});

describe('generator: buildInstallation & buildUsage', () => {
  it('generates CLI installation and npx command when binName exists', () => {
    const metadata = {
      name: 'cli-helper',
      binName: 'cli-helper',
      main: 'index.js'
    };

    const installSection = buildInstallation(metadata);
    assert(installSection.includes('npm install -g cli-helper'));
    assert(installSection.includes('npx cli-helper'));

    const usageSection = buildUsage(metadata);
    assert(usageSection.includes('cli-helper --help'));
    assert(usageSection.includes("const cliHelper = require('cli-helper');"));
  });

  it('generates standard dependency install when no bin is present', () => {
    const metadata = {
      name: 'pure-lib',
      binName: '',
      main: 'index.js'
    };

    const installSection = buildInstallation(metadata);
    assert(installSection.includes('npm install pure-lib'));
    assert(!installSection.includes('npm install -g'));
  });
});

describe('generator: buildScriptsTable', () => {
  it('renders a Markdown table with recognized script descriptions', () => {
    const scripts = {
      test: 'node --test',
      lint: 'eslint .'
    };

    const tableOutput = buildScriptsTable(scripts);
    assert(tableOutput.includes('| Command | Description | Script |'));
    assert(tableOutput.includes('`npm run test`'));
    assert(tableOutput.includes('Runs the test suite'));
    assert(tableOutput.includes('`npm run lint`'));
  });

  it('returns empty string when no scripts exist', () => {
    assert.strictEqual(buildScriptsTable({}), '');
    assert.strictEqual(buildScriptsTable(null), '');
  });
});

describe('generator: generateReadmeContent', () => {
  it('assembles a complete, well-formed markdown document', () => {
    const metadata = {
      name: 'super-package',
      description: 'A stellar utility for modern web development.',
      version: '0.1.0',
      license: 'MIT',
      author: 'Jane Doe',
      repository: 'https://github.com/janedoe/super-package',
      engines: { node: '>=18' },
      binName: 'super-pkg',
      main: 'index.js',
      scripts: { test: 'node --test' }
    };

    const markdown = generateReadmeContent(metadata);

    assert(markdown.includes('# super-package'));
    assert(markdown.includes('A stellar utility for modern web development.'));
    assert(markdown.includes('## Prerequisites'));
    assert(markdown.includes('## Installation'));
    assert(markdown.includes('## Usage'));
    assert(markdown.includes('## Available Scripts'));
    assert(markdown.includes('## Contributing'));
    assert(markdown.includes('## License'));
    assert(markdown.includes('Jane Doe'));
  });

  it('honors option to suppress badges', () => {
    const metadata = {
      name: 'no-badge-app',
      version: '1.0.0',
      license: 'MIT'
    };

    const markdown = generateReadmeContent(metadata, { badges: false });
    assert(!markdown.includes('img.shields.io'));
  });
});

describe('api: buildMarkdown & generateReadme', () => {
  it('buildMarkdown converts package object directly without disk access', () => {
    const markdown = buildMarkdown({
      name: 'in-memory-pkg',
      version: '3.0.0',
      description: 'Built purely in memory'
    });

    assert(markdown.includes('# in-memory-pkg'));
    assert(markdown.includes('Built purely in memory'));
  });

  it('generateReadme performs dry-run without writing to disk', () => {
    const fixtureDir = path.resolve(__dirname, '../examples/sample-project');
    const result = generateReadme({
      projectDir: fixtureDir,
      dryRun: true
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.dryRun, true);
    assert.strictEqual(result.outputPath, null);
    assert(result.content.includes('# weather-cli'));
  });

  it('generateReadme writes file to disk and protects against accidental overwrite', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-api-write-'));
    const dummyPkgPath = path.join(tempDir, 'package.json');
    fs.writeFileSync(
      dummyPkgPath,
      JSON.stringify({ name: 'temp-app', version: '1.0.0', description: 'Testing write' }),
      'utf8'
    );

    try {
      // First generation should succeed
      const firstRun = generateReadme({
        projectDir: tempDir,
        outputPath: 'README.md'
      });

      assert.strictEqual(firstRun.success, true);
      assert.strictEqual(fs.existsSync(firstRun.outputPath), true);

      // Second generation without overwrite flag must throw
      assert.throws(
        () => generateReadme({ projectDir: tempDir, outputPath: 'README.md', overwrite: false }),
        /Target file already exists/
      );

      // Third generation with overwrite: true must succeed
      const overwriteRun = generateReadme({
        projectDir: tempDir,
        outputPath: 'README.md',
        overwrite: true
      });
      assert.strictEqual(overwriteRun.success, true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
