#!/usr/bin/env node

/**
 * Command-line interface for readme-buddy.
 * Zero-dependency CLI implementation using native Node.js utilities.
 */

const path = require('node:path');
const { parseArgs } = require('node:util');
const { generateReadme } = require('../src/index');

// Read own package version for --version output
const ownPackage = require('../package.json');

const CLI_OPTIONS = {
  dir: {
    type: 'string',
    short: 'd',
    default: process.cwd()
  },
  output: {
    type: 'string',
    short: 'o',
    default: 'README.md'
  },
  force: {
    type: 'boolean',
    short: 'f',
    default: false
  },
  'dry-run': {
    type: 'boolean',
    default: false
  },
  badges: {
    type: 'boolean',
    default: true
  },
  help: {
    type: 'boolean',
    short: 'h',
    default: false
  },
  version: {
    type: 'boolean',
    short: 'v',
    default: false
  }
};

function printHelp() {
  console.log(`
readme-buddy v${ownPackage.version}
${ownPackage.description}

Usage:
  npx readme-buddy [options]
  readme-buddy [options]

Options:
  -d, --dir <path>     Directory containing package.json (default: current directory)
  -o, --output <file>  Target output filename or path (default: README.md)
  -f, --force          Overwrite existing README file without prompting
      --dry-run        Print generated Markdown to terminal without writing to disk
      --no-badges      Disable Shields.io badges in the generated README
  -v, --version        Display readme-buddy version
  -h, --help           Show this help message

Examples:
  npx readme-buddy
  npx readme-buddy --dir ./my-project --force
  npx readme-buddy --dry-run
`);
}

function run() {
  try {
    const { values } = parseArgs({
      options: CLI_OPTIONS,
      allowPositionals: false,
      strict: true
    });

    if (values.help) {
      printHelp();
      process.exit(0);
    }

    if (values.version) {
      console.log(`v${ownPackage.version}`);
      process.exit(0);
    }

    const result = generateReadme({
      projectDir: values.dir,
      outputPath: values.output,
      overwrite: values.force,
      dryRun: values['dry-run'],
      badges: values.badges
    });

    if (result.dryRun) {
      console.log('\n--- Generated README Preview (Dry Run) ---\n');
      console.log(result.content);
      console.log('--- End of Preview ---\n');
    } else {
      console.log(`\n✨ Successfully generated README.md at:\n   ${result.outputPath}\n`);
    }

    if (result.warnings && result.warnings.length > 0) {
      console.log('⚠️  Suggestions to improve your package.json:');
      for (const warning of result.warnings) {
        console.log(`   - ${warning}`);
      }
      console.log('');
    }

    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    if (err.message.includes('Target file already exists')) {
      console.error('Tip: Use --force or -f flag to overwrite the existing file.\n');
    }
    process.exit(1);
  }
}

run();
