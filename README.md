# readme-buddy

> A developer productivity tool that automatically generates clean, professional, and comprehensive `README.md` documentation for Node.js projects directly from `package.json` metadata.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Why readme-buddy is Useful](#why-readme-buddy-is-useful)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Usage](#cli-usage)
- [Programmatic API Usage](#programmatic-api-usage)
- [API Documentation](#api-documentation)
  - [Function Signature](#function-signature)
  - [Function Parameters](#function-parameters)
  - [Return Values](#return-values)
  - [Error Handling](#error-handling)
- [Examples](#examples)
  - [1. Running the CLI](#1-running-the-cli)
  - [2. Generating Programmatically](#2-generating-programmatically)
  - [3. Using a Custom Output Path](#3-using-a-custom-output-path)
  - [4. Overwriting an Existing README](#4-overwriting-an-existing-readme)
- [Project Structure](#project-structure)
- [Testing Instructions](#testing-instructions)
- [Limitations](#limitations)
- [Contributing Guidelines](#contributing-guidelines)
- [License](#license)

---

## Problem Statement

Every software project needs clear, structured documentation. However, writing and maintaining a `README.md` file from scratch involves considerable manual friction:
- Developers frequently copy-paste templates from older projects, leaving behind outdated repository URLs, wrong package names, or mismatched license text.
- Metadata already declared in `package.json` (such as `scripts`, `version`, `engines`, `dependencies`, and `license`) must be manually retyped into Markdown tables and installation guides.
- New packages often ship with empty or missing documentation, reducing adoption and clarity for collaborators and evaluators.

---

## Why readme-buddy is Useful

**readme-buddy** eliminates boilerplate documentation work by treating `package.json` as the single source of truth:
- **Instant Documentation**: Inspects project configuration and produces a complete, ready-to-commit `README.md` in milliseconds.
- **Context-Aware Sections**: Detects whether your project is a command-line tool (with a `bin` entry) or a library, automatically formatting appropriate `npx` commands or `npm install` instructions.
- **Accurate Scripts Reference**: Parses npm scripts (`test`, `start`, `lint`, `build`) and generates an organized command table with human-friendly descriptions.
- **Zero Hallucination / Fabrication**: Does not invent non-existent APIs or fabricate features. If metadata is missing, it provides neutral placeholders or omits optional sections gracefully.
- **Zero Runtime Dependencies**: Written entirely using native Node.js standard library modules (`node:fs`, `node:path`, `node:util.parseArgs`), keeping it lightweight, fast, and secure.

---

## Features

- 🚀 **Zero External Runtime Dependencies**: Uses Node.js native standard library exclusively.
- 💻 **Dual Interface**: Use as an immediate CLI command (`npx readme-buddy`) or import as a JavaScript function in build scripts.
- 🛡️ **Dynamic Badges**: Generates Shields.io status badges for version, license, and Node.js engine compatibility when declared.
- 📋 **Automated Scripts Table**: Detects npm scripts and formats a clean Markdown table with recognized script descriptions.
- 🔒 **Collision Protection**: Never silently overwrites an existing `README.md` unless explicitly granted permission via `--force` or `{ overwrite: true }`.
- 👁️ **Dry-Run Preview**: Inspect formatted Markdown directly in your terminal before writing to disk.
- 🎯 **8 Core Documentation Sections**: Assembles Title, Description, Features, Installation, Available Scripts, Usage, Project Information, and License.

---

## Installation

### Run without Installation (Recommended via NPX)

Execute directly in any project folder without installing locally or globally:

```bash
npx readme-buddy
```

### Install Globally via NPM

To have the command permanently available across your machine:

```bash
npm install -g readme-buddy
```

### Install as a Project Development Dependency

To incorporate `readme-buddy` into your project's npm scripts or build pipeline:

```bash
npm install --save-dev readme-buddy
```

---

## Quick Start

1. Open your terminal in any Node.js project directory containing a `package.json`:
   ```bash
   cd path/to/my-project
   ```

2. Run `readme-buddy`:
   ```bash
   npx readme-buddy
   ```

3. A professional `README.md` will be created in your directory immediately!

---

## CLI Usage

The command-line interface provides flexible options to configure the target directory, output file, and overwrite behavior:

```bash
npx readme-buddy [options]
# or if installed globally:
readme-buddy [options]
```

### Available CLI Flags

| Flag | Short | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `--cwd <path>` | `-c` | string | `process.cwd()` | Target directory containing the project's `package.json`. |
| `--dir <path>` | `-d` | string | `process.cwd()` | Alias for `--cwd`. |
| `--output <file>` | `-o` | string | `README.md` | Target output filename or path. |
| `--force` | `-f` | boolean | `false` | Overwrite existing output file without prompting or throwing an error. |
| `--dry-run` | | boolean | `false` | Print generated Markdown to stdout without writing to disk. |
| `--no-badges` | | boolean | `false` | Suppress Shields.io badges in the generated header. |
| `--version` | `-v` | boolean | `false` | Display the installed version of `readme-buddy`. |
| `--help` | `-h` | boolean | `false` | Display command usage and available options. |

---

## Programmatic API Usage

In addition to the CLI, `readme-buddy` exports clean, synchronous JavaScript functions for integration into project generators, scaffolding CLIs (like `create-*` tools), or build workflows.

```javascript
const { generateReadme, buildMarkdown } = require('readme-buddy');
```

---

## API Documentation

### Function Signature

```javascript
generateReadme(options)
```

### Function Parameters

The `generateReadme` function accepts a single options configuration object:

| Parameter Name | Data Type | Optional? | Default Value | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `projectDir` | `string` | Optional | `process.cwd()` | Absolute or relative path to the project root directory containing `package.json`. |
| `outputPath` | `string` | Optional | `'README.md'` | Filename or path where the generated Markdown will be written. Relative paths are resolved against `projectDir`. Missing parent directories are created automatically. |
| `overwrite` | `boolean` | Optional | `false` | When set to `true`, permits replacing an existing file. When `false` (default), throws an error if the target file already exists. |
| `dryRun` | `boolean` | Optional | `false` | When set to `true`, generates and returns the Markdown content without writing any file to disk. |
| `badges` | `boolean` | Optional | `true` | When set to `false`, suppresses generation of Shields.io status badges. |
| `features` | `string[]` | Optional | `undefined` | An optional array of explicit feature bullet points to render in the Features section. |

#### Helper Function: `buildMarkdown(pkgData, options)`
For in-memory generation where a `package.json` object is already in memory and no file system access is desired:
- **`pkgData`** (`object`, Required): Raw or partial `package.json` object.
- **`options`** (`object`, Optional): Accepts `{ badges, features }`.
- **Returns**: Formatted Markdown `string`.

---

### Return Values

`generateReadme()` returns a structured descriptor object detailing the generated document:

```javascript
{
  success: true,                     // boolean: Indicates successful execution
  dryRun: false,                     // boolean: Whether dryRun mode was active
  outputPath: '/full/path/README.md',// string|null: Absolute path of written file (null in dryRun)
  filename: 'README.md',             // string|null: Filename of written file
  bytesWritten: 1920,                // number: Total bytes written to disk (0 in dryRun)
  content: '# my-app\n\n...',        // string: Complete Markdown document text
  sectionsGenerated: [               // string[]: List of sections included in the document
    'Project Title',
    'Description',
    'Features',
    'Installation',
    'Available Scripts',
    'Usage',
    'Project Information',
    'License'
  ],
  metadata: {                        // object: Normalized metadata extracted from package.json
    name: 'my-app',
    version: '1.0.0',
    description: '...',
    license: 'MIT',
    author: '...',
    repository: '...',
    scripts: { ... },
    dependencies: [ ... ],
    devDependencies: [ ... ],
    keywords: [ ... ],
    binName: '...'
  },
  warnings: []                       // string[]: Non-fatal quality suggestions for package.json
}
```

---

### Error Handling

`generateReadme()` throws standard, descriptive JavaScript `Error` instances for abnormal conditions:

1. **Missing `package.json`**:
   - Condition: Target directory does not contain a `package.json` file.
   - Error: `Error: No package.json file found at: /path/to/project/package.json`
2. **Invalid JSON Syntax**:
   - Condition: `package.json` contains malformed JSON (missing comma, bad quotation).
   - Error: `Error: Invalid JSON syntax in package.json at /path/to/project/package.json: <details>`
3. **Invalid Root JSON Value**:
   - Condition: `package.json` contains an array or primitive instead of a JSON object.
   - Error: `Error: package.json content must be a valid JSON object`
4. **Collision Protection (Existing Output File)**:
   - Condition: The target output file already exists on disk and `overwrite` is `false`.
   - Error: `Error: Target file already exists: /path/to/README.md. Pass { overwrite: true } or use --force to overwrite.`

---

## Examples

### 1. Running the CLI

```bash
# Basic run in current folder
npx readme-buddy

# Target a subproject folder
npx readme-buddy --cwd ./packages/my-service

# Preview generated markdown in terminal without saving
npx readme-buddy --dry-run
```

### 2. Generating Programmatically

```javascript
const { generateReadme } = require('readme-buddy');

const result = generateReadme({
  projectDir: './my-app'
});

console.log(`Created ${result.filename} (${result.bytesWritten} bytes)`);
```

### 3. Using a Custom Output Path

```javascript
const { generateReadme } = require('readme-buddy');

// Writes to docs/PROJECT_GUIDE.md; missing parent directories are created automatically
const result = generateReadme({
  projectDir: './my-app',
  outputPath: 'docs/PROJECT_GUIDE.md',
  overwrite: true
});

console.log('Saved documentation to:', result.outputPath);
```

### 4. Overwriting an Existing README

```javascript
const { generateReadme } = require('readme-buddy');

try {
  // Overwrites existing README.md safely when explicitly requested
  const result = generateReadme({
    projectDir: './my-app',
    outputPath: 'README.md',
    overwrite: true
  });
  console.log('Successfully updated README.md');
} catch (err) {
  console.error('Generation failed:', err.message);
}
```

---

## Project Structure

The codebase is organized into small, decoupled modules following single-responsibility principles:

```
readme-buddy/
├── bin/
│   └── readme-buddy.js          # CLI executable binary (node:util.parseArgs)
├── src/
│   ├── index.js                 # Public programmatic API (generateReadme, buildMarkdown)
│   ├── generator.js             # Markdown section builder & template orchestrator
│   ├── parser.js                # package.json reader, normalizer, and validator
│   └── utils/
│       └── markdown.js          # Reusable formatting primitives (tables, badges, code)
├── test/
│   ├── cli.test.js              # Integration tests for CLI commands and flags
│   ├── generator.test.js        # Unit and integration tests for Markdown generation & API
│   └── parser.test.js           # Unit tests for package.json parsing & validation
├── examples/
│   ├── basic-usage.js           # Runnable JavaScript example demonstrating the API
│   └── sample-project/          # Realistic fixture project with generated sample README
├── .gitignore                   # Git exclusion rules
├── LICENSE                      # MIT License
├── package.json                 # Package metadata, bin registration, and npm scripts
└── README.md                    # Official package documentation
```

---

## Testing Instructions

`readme-buddy` uses the native Node.js test runner (`node:test`) and assertion library (`node:assert`). **No third-party testing frameworks are required.**

### Run the Complete Test Suite

```bash
npm test
```

The test runner will execute all 64 automated tests covering:
- Parsing valid, invalid, empty, and missing `package.json` files.
- Metadata normalization (authors, repositories, dependencies, scripts).
- Table generation and Markdown character escaping.
- Section composition and badge generation.
- CLI execution, argument parsing, error codes, and overwrite protection.
- Isolated filesystem operations in temporary directories.

---

## Limitations

To remain honest and transparent about current boundaries:
1. **Node.js Ecosystem Only**: Specifically designed for Node.js projects with a `package.json`. It does not parse project manifests from other languages (e.g., `Cargo.toml`, `pyproject.toml`, `pom.xml`).
2. **Text Encoding**: Expects standard UTF-8 encoded `package.json` files.
3. **Synchronous File Operations**: File reads and writes are synchronous, which is ideal for single-run CLI operations and build scripts.
4. **Keyword-Based Features**: Feature bullet points are inferred from `keywords` in `package.json` or explicit options; domain-specific feature lists cannot be automatically guessed from source code without explicit configuration.

---

## Contributing Guidelines

Contributions, suggestions, and issue reports are very welcome!

1. **Fork the Repository**: Create a personal fork on GitHub.
2. **Clone and Branch**:
   ```bash
   git clone https://github.com/KabeerSingh28/readme-buddy.git
   cd readme-buddy
   git checkout -b feature/my-new-feature
   ```
3. **Make Changes**: Keep functions modular and add explanatory comments where appropriate.
4. **Run Tests**: Ensure all existing and new tests pass:
   ```bash
   npm test
   ```
5. **Commit**: Use Conventional Commits formatting (e.g., `feat: ...`, `fix: ...`, `test: ...`).
6. **Submit a Pull Request**: Push your branch and open a PR against the `main` branch.

---

## License

This project is open source and available under the [MIT License](LICENSE) &copy; 2026 [Kabeer Singh](https://github.com/KabeerSingh28).
