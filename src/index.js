/**
 * Public programmatic API for readme-buddy.
 */

const fs = require('node:fs');
const path = require('node:path');
const {
  readPackageJson,
  extractMetadata,
  validateMetadata
} = require('./parser');
const {
  generateReadmeContent
} = require('./generator');

/**
 * Builds a README Markdown string directly from a package.json object.
 * Pure function: does not perform any disk read or write operations.
 *
 * @param {object} pkgData - Raw or partial package.json object
 * @param {object} [options={}] - Generation options
 * @param {boolean} [options.badges=true] - Whether to generate Shields.io badges
 * @returns {string} Generated Markdown content
 */
function buildMarkdown(pkgData, options = {}) {
  const metadata = extractMetadata(pkgData);
  return generateReadmeContent(metadata, options);
}

/**
 * Reads project package.json, generates documentation, and writes README.md to disk.
 *
 * @param {object} [options={}] - Options object
 * @param {string} [options.projectDir=process.cwd()] - Project root containing package.json
 * @param {string} [options.outputPath='README.md'] - Target output filename or path
 * @param {boolean} [options.overwrite=false] - Whether to overwrite an existing README file
 * @param {boolean} [options.dryRun=false] - If true, returns content without writing to disk
 * @param {boolean} [options.badges=true] - Whether to include Shields.io status badges
 * @returns {object} Result object containing status, content, path, and metadata
 */
function generateReadme(options = {}) {
  const projectDir = path.resolve(options.projectDir || process.cwd());
  const rawPkg = readPackageJson(projectDir);
  const metadata = extractMetadata(rawPkg);
  const validation = validateMetadata(metadata);

  const markdown = generateReadmeContent(metadata, {
    badges: options.badges !== false
  });

  if (options.dryRun) {
    return {
      success: true,
      dryRun: true,
      content: markdown,
      outputPath: null,
      metadata,
      warnings: validation.warnings
    };
  }

  const targetFilename = options.outputPath || 'README.md';
  const resolvedOutputPath = path.isAbsolute(targetFilename)
    ? targetFilename
    : path.join(projectDir, targetFilename);

  if (fs.existsSync(resolvedOutputPath) && !options.overwrite) {
    throw new Error(
      `Target file already exists: ${resolvedOutputPath}. Pass { overwrite: true } or use --force to overwrite.`
    );
  }

  fs.writeFileSync(resolvedOutputPath, markdown, 'utf8');

  return {
    success: true,
    dryRun: false,
    content: markdown,
    outputPath: resolvedOutputPath,
    metadata,
    warnings: validation.warnings
  };
}

module.exports = {
  generateReadme,
  buildMarkdown,
  readPackageJson,
  extractMetadata,
  validateMetadata,
  generateReadmeContent
};
