/**
 * Integration tests for the command-line interface (CLI).
 * Tests bin/readme-buddy.js across different flag combinations and error states.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const binPath = path.resolve(__dirname, '../bin/readme-buddy.js');
const sampleProjectPath = path.resolve(__dirname, '../examples/sample-project');

/**
 * Helper to run bin/readme-buddy.js and capture stdout, stderr, and exit code.
 * @param {string[]} args - CLI arguments
 * @param {object} [options={}] - Options for execFileSync
 * @returns {{ stdout: string, stderr: string, status: number }}
 */
function runCli(args, options = {}) {
  try {
    const stdout = execFileSync(process.execPath, [binPath, ...args], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env }
    });
    return { stdout, stderr: '', status: 0 };
  } catch (err) {
    return {
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : '',
      status: err.status || 1
    };
  }
}

describe('CLI: --help and --version', () => {
  it('displays usage instructions when --help is passed', () => {
    const { stdout, status } = runCli(['--help']);
    assert.strictEqual(status, 0);
    assert(stdout.includes('Usage:'));
    assert(stdout.includes('npx readme-buddy [options]'));
    assert(stdout.includes('--cwd'));
    assert(stdout.includes('--output'));
    assert(stdout.includes('--force'));
  });

  it('displays usage instructions with short flag -h', () => {
    const { stdout, status } = runCli(['-h']);
    assert.strictEqual(status, 0);
    assert(stdout.includes('Usage:'));
  });

  it('displays version when --version is passed', () => {
    const { stdout, status } = runCli(['--version']);
    assert.strictEqual(status, 0);
    assert(stdout.trim().startsWith('v0.1.0'));
  });

  it('displays version with short flag -v', () => {
    const { stdout, status } = runCli(['-v']);
    assert.strictEqual(status, 0);
    assert(stdout.trim().startsWith('v0.1.0'));
  });
});

describe('CLI: Project generation & flags', () => {
  it('generates README.md in directory specified by --cwd', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-test-cwd-'));
    const tempPkg = path.join(tempDir, 'package.json');
    fs.writeFileSync(
      tempPkg,
      JSON.stringify({ name: 'cwd-test-app', version: '1.0.0', description: 'Testing cwd flag' }),
      'utf8'
    );

    try {
      const { stdout, status } = runCli(['--cwd', tempDir]);
      assert.strictEqual(status, 0);
      assert(stdout.includes('Successfully generated README.md'));

      const createdReadme = path.join(tempDir, 'README.md');
      assert.strictEqual(fs.existsSync(createdReadme), true);
      const content = fs.readFileSync(createdReadme, 'utf8');
      assert(content.includes('# cwd-test-app'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('generates README at a custom output path with --output', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-test-output-'));
    const tempPkg = path.join(tempDir, 'package.json');
    fs.writeFileSync(
      tempPkg,
      JSON.stringify({ name: 'custom-output-app', version: '1.0.0' }),
      'utf8'
    );

    try {
      const { stdout, status } = runCli(['--cwd', tempDir, '--output', 'CUSTOM.md']);
      assert.strictEqual(status, 0);
      assert(stdout.includes('Successfully generated CUSTOM.md'));

      const customFile = path.join(tempDir, 'CUSTOM.md');
      assert.strictEqual(fs.existsSync(customFile), true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('prevents accidental overwrite and succeeds with --force', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-test-force-'));
    const tempPkg = path.join(tempDir, 'package.json');
    fs.writeFileSync(
      tempPkg,
      JSON.stringify({ name: 'force-test-app', version: '1.0.0' }),
      'utf8'
    );

    try {
      // First generation
      const firstRun = runCli(['--cwd', tempDir]);
      assert.strictEqual(firstRun.status, 0);

      // Second generation without --force must fail
      const secondRun = runCli(['--cwd', tempDir]);
      assert.strictEqual(secondRun.status, 1);
      assert(secondRun.stderr.includes('Target file already exists'));
      assert(secondRun.stderr.includes('Tip: Use --force or -f'));

      // Third generation with --force must succeed
      const thirdRun = runCli(['--cwd', tempDir, '--force']);
      assert.strictEqual(thirdRun.status, 0);
      assert(thirdRun.stdout.includes('Successfully generated README.md'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('supports --dry-run to print preview without touching disk', () => {
    const { stdout, status } = runCli(['--cwd', sampleProjectPath, '--dry-run']);
    assert.strictEqual(status, 0);
    assert(stdout.includes('Generated README Preview (Dry Run)'));
    assert(stdout.includes('# weather-cli'));
  });
});

describe('CLI: Error handling & validation', () => {
  it('exits with code 1 when unknown argument is provided', () => {
    const { stderr, status } = runCli(['--unknown-flag']);
    assert.strictEqual(status, 1);
    assert(stderr.includes('Unknown option'));
    assert(stderr.includes('Run "readme-buddy --help"'));
  });

  it('exits with code 1 when positional arguments are provided', () => {
    const { stderr, status } = runCli(['unexpected-arg']);
    assert.strictEqual(status, 1);
    assert(stderr.includes('Unexpected'));
  });

  it('exits with code 1 when package.json is missing in target directory', () => {
    const emptyTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-test-missing-'));
    try {
      const { stderr, status } = runCli(['--cwd', emptyTempDir]);
      assert.strictEqual(status, 1);
      assert(stderr.includes('No package.json file found at'));
    } finally {
      fs.rmSync(emptyTempDir, { recursive: true, force: true });
    }
  });
});
