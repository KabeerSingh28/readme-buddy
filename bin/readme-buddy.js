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
  cwd: {
    type: 'string',
    short: 'c'
  },
  dir: {
    type: 'string',
    short: 'd'
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

/**
 * Displays usage instructions and available options.
 */
function printHelp() {
  console.log(`
readme-buddy v${ownPackage.version}
${ownPackage.description}

Usage:
  npx readme-buddy [options]
  readme-buddy [options]

Options:
  -c, --cwd <path>     Target project directory containing package.json (default: current directory)
  -d, --dir <path>     Alias for --cwd
  -o, --output <file>  Target output filename or path (default: README.md)
  -f, --force          Overwrite existing README file without prompting
      --dry-run        Print generated Markdown to terminal without writing to disk
      --no-badges      Disable Shields.io badges in the generated README
  -v, --version        Display readme-buddy version
  -h, --help           Show this help message

Examples:
  npx readme-buddy
  npx readme-buddy --cwd ./my-project
  npx readme-buddy --cwd ./my-project --force
  npx readme-buddy --output CUSTOM.md
  npx readme-buddy --dry-run
`);
}

/**
 * Main CLI execution entry point.
 * @param {string[]} [customArgs] - Optional argument array for programmatic testing
 */
function run(customArgs) {
  try {
    const { values } = parseArgs({
      args: customArgs || process.argv.slice(2),
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

    // Resolve target project directory from --cwd or --dir
    const projectDir = values.cwd || values.dir || process.cwd();

    // Validate output path
    if (typeof values.output !== 'string' || values.output.trim() === '') {
      throw new Error('Output path cannot be empty.');
    }

    // Delegate generation directly to core generator API
    const result = generateReadme({
      projectDir,
      outputPath: values.output.trim(),
      overwrite: values.force,
      dryRun: values['dry-run'],
      badges: values.badges
    });

    if (result.dryRun) {
      console.log('\n--- Generated README Preview (Dry Run) ---\n');
      console.log(result.content);
      console.log('--- End of Preview ---\n');
    } else {
      console.log(
        `\n✨ Successfully generated ${result.filename} at:\n   ${result.outputPath} (${result.bytesWritten} bytes)\n`
      );
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
    if (err.code && err.code.startsWith('ERR_PARSE_ARGS_')) {
      console.error(`\n❌ Error: ${err.message}`);
      console.error('Run "readme-buddy --help" to view all available options.\n');
    } else {
      console.error(`\n❌ Error: ${err.message}\n`);
      if (err.message.includes('Target file already exists')) {
        console.error('Tip: Use --force or -f to overwrite the existing file.\n');
      }
    }
    process.exit(1);
  }
}

// Execute when invoked directly from command line
if (require.main === module) {
  run();
}

module.exports = {
  run,
  printHelp,
  CLI_OPTIONS
};
