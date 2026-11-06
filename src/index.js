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
 * @param {string[]} [options.features] - Optional explicit features list
 * @returns {string} Generated Markdown content
 */
function buildMarkdown(pkgData, options = {}) {
  const metadata = extractMetadata(pkgData);
  const { content } = generateReadmeContent(metadata, options);
  return content;
}

/**
 * Reads project package.json, generates documentation, and writes README.md to disk.
 *
 * @param {object} [options={}] - Options configuration
 * @param {string} [options.projectDir=process.cwd()] - Project directory containing package.json
 * @param {string} [options.outputPath='README.md'] - Target output filename or path
 * @param {boolean} [options.overwrite=false] - Whether to overwrite an existing README file
 * @param {boolean} [options.dryRun=false] - If true, returns content without writing to disk
 * @param {boolean} [options.badges=true] - Whether to include Shields.io status badges
 * @param {string[]} [options.features] - Optional explicit features list
 * @returns {object} Useful result describing the generated file
 * @throws {Error} If package.json is missing, invalid, or target file exists without overwrite permission
 */
function generateReadme(options = {}) {
  // 1. Resolve and validate project directory
  const projectDir = path.resolve(options.projectDir || process.cwd());

  // 2 & 3. Locate, read, and parse package.json
  const rawPkg = readPackageJson(projectDir);

  // 4. Extract and normalize available project metadata
  const metadata = extractMetadata(rawPkg, projectDir);
  const validation = validateMetadata(metadata);

  // 5. Generate structured Markdown content
  const { content, sectionsGenerated } = generateReadmeContent(metadata, {
    badges: options.badges !== false,
    features: options.features
  });

  // Handle dry-run mode (no disk write)
  if (options.dryRun) {
    return {
      success: true,
      dryRun: true,
      outputPath: null,
      filename: null,
      bytesWritten: 0,
      content,
      sectionsGenerated,
      metadata,
      warnings: validation.warnings
    };
  }

  // 6. Resolve output file path and enforce overwrite safety
  const targetFilename = options.outputPath || 'README.md';
  const resolvedOutputPath = path.isAbsolute(targetFilename)
    ? targetFilename
    : path.join(projectDir, targetFilename);

  if (fs.existsSync(resolvedOutputPath) && !options.overwrite) {
    throw new Error(
      `Target file already exists: ${resolvedOutputPath}. Pass { overwrite: true } or use --force to overwrite.`
    );
  }

  // Ensure target directory exists (if nested output path given)
  const targetDir = path.dirname(resolvedOutputPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Write content to disk
  fs.writeFileSync(resolvedOutputPath, content, 'utf8');

  // 7. Return useful result describing the generated file
  return {
    success: true,
    dryRun: false,
    outputPath: resolvedOutputPath,
    filename: path.basename(resolvedOutputPath),
    bytesWritten: Buffer.byteLength(content, 'utf8'),
    content,
    sectionsGenerated,
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
