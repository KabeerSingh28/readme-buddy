# readme-buddy

![npm version: 0.1.0](https://img.shields.io/badge/npm%20version-0.1.0-blue?style=flat) ![license: MIT](https://img.shields.io/badge/license-MIT-green?style=flat) ![node: >=18.0.0](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat)

> A friendly developer productivity tool that automatically generates clean, professional `README.md` files directly from `package.json` metadata.

---

## Overview

Writing documentation from scratch is often repetitive and error-prone. **readme-buddy** inspects your Node.js project's `package.json` and automatically formats a production-grade `README.md` containing dynamic badges, installation instructions, usage guidelines, available script tables, licensing, and author credits.

It is built with **zero external runtime dependencies**, leveraging modern Node.js native capabilities (`node:util.parseArgs`, `node:fs`, `node:path`, and `node:test`).

---

## Features

- 🚀 **Zero Runtime Dependencies**: Ultra-lightweight, lightning-fast execution, and zero security vulnerability risk.
- 🛠️ **Dual Interface**: Use instantly as a CLI tool (`npx readme-buddy`) or import into JavaScript workflows as a programmatic API.
- 🛡️ **Shields.io Badges**: Automatically generates version, license, and Node.js engine badges.
- 📋 **Automated Scripts Table**: Detects scripts declared in `package.json` and generates an organized reference table.
- 🔒 **Safe File Writing**: Prevents accidental overwrites unless explicitly instructed via `--force`.
- 👁️ **Dry-Run Mode**: Inspect generated Markdown directly in the terminal before saving to disk.

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v8.0.0` or higher (or `pnpm` / `yarn`)

---

## Installation

### Run directly with NPX (No installation required)

```bash
npx readme-buddy
```

### Install globally

```bash
npm install -g readme-buddy
```

### Install as a project dependency

```bash
npm install --save-dev readme-buddy
```

---

## Usage

### 1. Command-Line Interface (CLI)

Run `readme-buddy` in any directory containing a `package.json`:

```bash
# Generate README.md in current directory
npx readme-buddy

# Target a different project directory
npx readme-buddy --dir ./path/to/my-project

# Preview output in console without creating a file (Dry Run)
npx readme-buddy --dry-run

# Overwrite existing README.md without prompt
npx readme-buddy --force

# Save with a custom filename
npx readme-buddy --output DOCUMENTATION.md

# Disable Shields.io badges
npx readme-buddy --no-badges

# View CLI options
npx readme-buddy --help
```

#### CLI Options Reference

| Option | Short | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `--dir` | `-d` | string | `process.cwd()` | Project root containing `package.json` |
| `--output` | `-o` | string | `README.md` | Target output file path |
| `--force` | `-f` | boolean | `false` | Overwrite existing output file |
| `--dry-run` | | boolean | `false` | Print Markdown to terminal instead of writing |
| `--no-badges` | | boolean | `false` | Suppress Shields.io badges in header |
| `--version` | `-v` | boolean | `false` | Print version number |
| `--help` | `-h` | boolean | `false` | Display help guide |

---

### 2. Programmatic JavaScript API

Import `readme-buddy` into your build scripts, scaffolding tools, or Node.js applications:

```javascript
const { generateReadme, buildMarkdown } = require('readme-buddy');

// Example 1: Full workflow (reads package.json, writes README.md to disk)
async function run() {
  const result = generateReadme({
    projectDir: './my-app',      // Target directory
    outputPath: 'README.md',     // Output filename
    overwrite: true,             // Overwrite if file exists
    badges: true                 // Include badges
  });

  console.log('Success:', result.success);
  console.log('Generated at:', result.outputPath);
}

run();

// Example 2: In-memory generation (pure function, no disk I/O)
const markdownString = buildMarkdown({
  name: 'custom-package',
  version: '1.0.0',
  description: 'In-memory generated documentation',
  scripts: {
    start: 'node index.js',
    test: 'node --test'
  },
  license: 'MIT'
});

console.log(markdownString);
```

---

## Architecture & Codebase Design

The codebase follows a modular separation of concerns designed for clarity and easy viva explanation:

```
readme-buddy/
├── src/
│   ├── index.js          # Public API export layer (generateReadme, buildMarkdown)
│   ├── generator.js      # Markdown template builder & section assembler
│   ├── parser.js         # package.json reader, metadata normalizer & validator
│   └── utils/
│       └── markdown.js   # Reusable Markdown formatting primitives (headings, tables, badges)
├── bin/
│   └── readme-buddy.js   # Executable CLI interface using node:util.parseArgs
├── test/
│   ├── generator.test.js # Unit & integration tests for generator and API
│   └── parser.test.js    # Unit tests for package.json reader and validator
├── examples/
│   └── sample-project/   # Sample package.json fixture for testing and demonstrations
├── .gitignore            # Git exclusion rules
├── LICENSE               # MIT License
├── package.json          # Package manifest and metadata
└── README.md             # Project documentation
```

### Key Modules:
- **`src/parser.js`**: Safely reads and validates `package.json`, extracting normalized metadata while tolerating missing fields.
- **`src/generator.js`**: Pure functional generator creating structured Markdown sections.
- **`src/utils/markdown.js`**: Low-level helpers for Markdown strings (headings, tables, badges, lists, codeblocks).
- **`src/index.js`**: Orchestrator bridging file I/O, validation, and generation.
- **`bin/readme-buddy.js`**: CLI wrapper with flags, formatted help, and clear error reporting.

---

## Available Scripts

In the project root, you can run:

| Command | Description | Script |
| --- | --- | --- |
| `npm run test` | Runs the test suite | `node --test test/**/*.test.js` |
| `npm run start` | Runs the CLI command | `node bin/readme-buddy.js` |

---

## Testing

The project uses the native Node.js test runner (`node:test`) and assertion library (`node:assert`):

```bash
npm test
```

All 23 unit and integration tests execute with zero external test frameworks, validating parsing edge cases, CLI parameters, markdown generation, and collision protection.

---

## Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/KabeerSingh28/readme-buddy/issues).

---

## License

This project is licensed under the MIT License by [Kabeer Singh](https://github.com/KabeerSingh28).
