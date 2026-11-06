/**
 * Unit tests for README generation, Markdown templating, and the generateReadme API.
 * Uses native Node.js test runner (`node:test`).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const {
  buildBadges,
  buildFeatures,
  buildInstallation,
  buildUsage,
  buildScriptsTable,
  buildProjectInformation,
  buildLicense,
  generateReadmeContent
} = require('../src/generator');

const {
  generateReadme,
  buildMarkdown
} = require('../src/index');

describe('generator: buildBadges', () => {
  it('generates shields badges only for present metadata fields', () => {
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

  it('omits badges when metadata fields are empty', () => {
    const metadata = {
      version: '',
      license: '',
      engines: {}
    };

    const result = buildBadges(metadata);
    assert.strictEqual(result, '');
  });
});

describe('generator: buildFeatures', () => {
  it('builds features from explicit options list', () => {
    const metadata = { keywords: [] };
    const result = buildFeatures(metadata, { features: ['Zero dependencies', 'CLI and API support'] });

    assert(result.includes('## Features'));
    assert(result.includes('- Zero dependencies'));
    assert(result.includes('- CLI and API support'));
  });

  it('infers features from project keywords when available', () => {
    const metadata = { keywords: ['markdown', 'automation'] };
    const result = buildFeatures(metadata);

    assert(result.includes('## Features'));
    assert(result.includes('**markdown**'));
    assert(result.includes('**automation**'));
  });

  it('omits features section entirely if no keywords or options are provided', () => {
    const metadata = { keywords: [] };
    const result = buildFeatures(metadata);

    assert.strictEqual(result, '');
  });
});

describe('generator: buildInstallation & buildUsage', () => {
  it('generates CLI installation and npx command when binName exists', () => {
    const metadata = {
      name: 'cli-helper',
      hasExplicitName: true,
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
      hasExplicitName: true,
      binName: '',
      main: 'index.js'
    };

    const installSection = buildInstallation(metadata);
    assert(installSection.includes('npm install pure-lib'));
    assert(!installSection.includes('npm install -g'));
  });

  it('generates generic npm install when package has no explicit name', () => {
    const metadata = {
      name: 'Unnamed Project',
      hasExplicitName: false,
      binName: '',
      main: ''
    };

    const installSection = buildInstallation(metadata);
    assert(installSection.includes('npm install'));
    assert(!installSection.includes('npm install Unnamed Project'));
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
    assert(tableOutput.includes('Runs the automated test suite'));
    assert(tableOutput.includes('`npm run lint`'));
  });

  it('escapes pipe characters inside script commands to protect table syntax', () => {
    const scripts = {
      pipeTest: 'echo "hello" | cat'
    };

    const tableOutput = buildScriptsTable(scripts);
    assert(tableOutput.includes('\\|'));
  });

  it('displays neutral message when no scripts are present', () => {
    const emptyResult = buildScriptsTable({});
    assert(emptyResult.includes('No custom npm scripts are defined in package.json.'));

    const nullResult = buildScriptsTable(null);
    assert(nullResult.includes('No custom npm scripts are defined in package.json.'));
  });
});

describe('generator: buildProjectInformation & buildLicense', () => {
  it('renders project metadata table including dependency counts', () => {
    const metadata = {
      name: 'demo-app',
      version: '1.0.0',
      license: 'MIT',
      author: 'Tester',
      repository: 'https://github.com/tester/demo-app',
      dependencies: ['react', 'lodash'],
      devDependencies: ['eslint'],
      keywords: ['web']
    };

    const info = buildProjectInformation(metadata);
    assert(info.includes('## Project Information'));
    assert(info.includes('demo-app'));
    assert(info.includes('Production Dependencies'));
    assert(info.includes('| 2 |'));
    assert(info.includes('Development Dependencies'));
    assert(info.includes('| 1 |'));
  });

  it('renders neutral message when license is not specified', () => {
    const metadata = { license: '', author: '' };
    const licenseSection = buildLicense(metadata);

    assert(licenseSection.includes('No license has been specified for this project in package.json.'));
  });
});

describe('generator: generateReadmeContent', () => {
  it('assembles all 8 sections into a complete markdown document', () => {
    const metadata = {
      name: 'super-package',
      hasExplicitName: true,
      description: 'A stellar utility for modern web development.',
      version: '0.1.0',
      license: 'MIT',
      author: 'Jane Doe',
      repository: 'https://github.com/janedoe/super-package',
      engines: { node: '>=18.0.0' },
      binName: 'super-pkg',
      main: 'index.js',
      scripts: { test: 'node --test' },
      dependencies: ['express'],
      devDependencies: [],
      keywords: ['tool']
    };

    const { content, sectionsGenerated } = generateReadmeContent(metadata);

    assert(content.includes('# super-package'));
    assert(content.includes('A stellar utility for modern web development.'));
    assert(content.includes('## Features'));
    assert(content.includes('## Installation'));
    assert(content.includes('## Available Scripts'));
    assert(content.includes('## Usage'));
    assert(content.includes('## Project Information'));
    assert(content.includes('## License'));

    assert.deepStrictEqual(sectionsGenerated, [
      'Project Title',
      'Description',
      'Features',
      'Installation',
      'Available Scripts',
      'Usage',
      'Project Information',
      'License'
    ]);
  });

  it('provides neutral description message when description is empty', () => {
    const metadata = {
      name: 'no-desc-pkg',
      hasExplicitName: true,
      description: '',
      scripts: {}
    };

    const { content } = generateReadmeContent(metadata);
    assert(content.includes('No project description provided in package.json.'));
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

  it('generateReadme returns detailed execution description', () => {
    const fixtureDir = path.resolve(__dirname, '../examples/sample-project');
    const result = generateReadme({
      projectDir: fixtureDir,
      dryRun: true
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.dryRun, true);
    assert.strictEqual(result.outputPath, null);
    assert(result.content.includes('# weather-cli'));
    assert(Array.isArray(result.sectionsGenerated));
    assert(result.sectionsGenerated.includes('Project Title'));
    assert(result.sectionsGenerated.includes('Available Scripts'));
    assert(result.sectionsGenerated.includes('Project Information'));
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
      // First generation should succeed and return file metadata
      const firstRun = generateReadme({
        projectDir: tempDir,
        outputPath: 'README.md'
      });

      assert.strictEqual(firstRun.success, true);
      assert.strictEqual(firstRun.filename, 'README.md');
      assert(firstRun.bytesWritten > 0);
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

  it('throws descriptive error if package.json is missing in projectDir', () => {
    const nonExistentDir = path.join(os.tmpdir(), `non-existent-${Date.now()}`);

    assert.throws(
      () => generateReadme({ projectDir: nonExistentDir }),
      /No package\.json file found at/
    );
  });
});
