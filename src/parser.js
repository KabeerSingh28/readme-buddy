/**
 * package.json reader and metadata parser.
 * Handles reading, validating, and extracting clean metadata from project configuration.
 */

const fs = require('node:fs');
const path = require('node:path');

/**
 * Reads and parses a package.json file from a target directory.
 * @param {string} [projectDir=process.cwd()] - Path to directory containing package.json
 * @returns {object} Parsed package.json content
 * @throws {Error} If file is missing or contains invalid JSON
 */
function readPackageJson(projectDir = process.cwd()) {
  const resolvedDir = path.resolve(projectDir);
  const packageJsonPath = path.join(resolvedDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`No package.json file found at: ${packageJsonPath}`);
  }

  let rawContent;
  try {
    rawContent = fs.readFileSync(packageJsonPath, 'utf8');
  } catch (err) {
    throw new Error(`Unable to read package.json at ${packageJsonPath}: ${err.message}`);
  }

  try {
    const parsed = JSON.parse(rawContent);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('package.json content must be a valid JSON object');
    }
    return parsed;
  } catch (err) {
    throw new Error(`Invalid JSON syntax in package.json at ${packageJsonPath}: ${err.message}`);
  }
}

/**
 * Normalizes author data into a readable string.
 * @param {string|object} author - Author field from package.json
 * @returns {string} Clean author string
 */
function normalizeAuthor(author) {
  if (!author) return '';
  if (typeof author === 'string') return author.trim();
  if (typeof author === 'object') {
    const parts = [];
    if (author.name) parts.push(author.name.trim());
    if (author.email) parts.push(`<${author.email.trim()}>`);
    if (author.url) parts.push(`(${author.url.trim()})`);
    return parts.join(' ');
  }
  return '';
}

/**
 * Normalizes repository data into a web URL.
 * @param {string|object} repository - Repository field from package.json
 * @returns {string} Web-accessible repository URL
 */
function normalizeRepository(repository) {
  if (!repository) return '';

  let rawUrl = '';
  if (typeof repository === 'string') {
    rawUrl = repository.trim();
  } else if (typeof repository === 'object' && repository.url) {
    rawUrl = repository.url.trim();
  }

  // Strip git+ prefix and .git suffix for a clean browser URL
  let cleanUrl = rawUrl.replace(/^git\+/, '').replace(/\.git$/, '');

  // Handle GitHub shorthand e.g. "github:user/repo" or "user/repo"
  if (cleanUrl.startsWith('github:')) {
    cleanUrl = `https://github.com/${cleanUrl.replace('github:', '')}`;
  } else if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(cleanUrl)) {
    cleanUrl = `https://github.com/${cleanUrl}`;
  }

  return cleanUrl;
}

/**
 * Extracts and normalizes relevant metadata for README generation.
 * @param {object} pkg - Raw package.json object
 * @returns {object} Normalized metadata object
 */
function extractMetadata(pkg = {}) {
  const name = typeof pkg.name === 'string' && pkg.name.trim() ? pkg.name.trim() : 'my-project';
  const description = typeof pkg.description === 'string' ? pkg.description.trim() : '';
  const version = typeof pkg.version === 'string' && pkg.version.trim() ? pkg.version.trim() : '0.1.0';
  const license = typeof pkg.license === 'string' && pkg.license.trim() ? pkg.license.trim() : 'MIT';
  const author = normalizeAuthor(pkg.author);
  const repository = normalizeRepository(pkg.repository);
  const homepage = typeof pkg.homepage === 'string' ? pkg.homepage.trim() : '';
  const scripts = pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {};
  const engines = pkg.engines && typeof pkg.engines === 'object' ? pkg.engines : {};
  const keywords = Array.isArray(pkg.keywords) ? pkg.keywords.filter((k) => typeof k === 'string') : [];
  const dependencies = pkg.dependencies && typeof pkg.dependencies === 'object' ? Object.keys(pkg.dependencies) : [];
  const devDependencies = pkg.devDependencies && typeof pkg.devDependencies === 'object' ? Object.keys(pkg.devDependencies) : [];

  // Determine CLI binary name if configured
  let binName = '';
  if (typeof pkg.bin === 'string') {
    binName = name;
  } else if (pkg.bin && typeof pkg.bin === 'object') {
    const binKeys = Object.keys(pkg.bin);
    if (binKeys.length > 0) {
      binName = binKeys[0];
    }
  }

  return {
    name,
    description,
    version,
    license,
    author,
    repository,
    homepage,
    scripts,
    engines,
    keywords,
    dependencies,
    devDependencies,
    binName,
    main: typeof pkg.main === 'string' ? pkg.main : 'index.js'
  };
}

/**
 * Validates extracted metadata and generates helpful warning messages.
 * @param {object} metadata - Normalized metadata object
 * @returns {{ valid: boolean, warnings: string[] }} Validation status and warnings
 */
function validateMetadata(metadata) {
  const warnings = [];

  if (!metadata.name || metadata.name === 'my-project') {
    warnings.push('Project "name" is missing or using default fallback.');
  }
  if (!metadata.description) {
    warnings.push('Project "description" is empty in package.json.');
  }
  if (!metadata.license) {
    warnings.push('Project "license" is not specified.');
  }
  if (!metadata.repository) {
    warnings.push('Project "repository" URL is not specified.');
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}

module.exports = {
  readPackageJson,
  normalizeAuthor,
  normalizeRepository,
  extractMetadata,
  validateMetadata
};
