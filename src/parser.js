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
 * Supports string format ("Name <email>") and object format ({ name, email, url }).
 * @param {string|object} author - Author field from package.json
 * @returns {string} Clean author string
 */
function normalizeAuthor(author) {
  if (!author) return '';
  if (typeof author === 'string') return author.trim();
  if (typeof author === 'object' && !Array.isArray(author)) {
    const parts = [];
    if (author.name && typeof author.name === 'string') parts.push(author.name.trim());
    if (author.email && typeof author.email === 'string') parts.push(`<${author.email.trim()}>`);
    if (author.url && typeof author.url === 'string') parts.push(`(${author.url.trim()})`);
    return parts.join(' ');
  }
  return '';
}

/**
 * Normalizes repository data into a clean, browser-accessible URL.
 * Strips git protocol wrappers (git+, .git) and converts GitHub shorthands.
 * @param {string|object} repository - Repository field from package.json
 * @returns {string} Web-accessible repository URL
 */
function normalizeRepository(repository) {
  if (!repository) return '';

  let rawUrl = '';
  if (typeof repository === 'string') {
    rawUrl = repository.trim();
  } else if (typeof repository === 'object' && repository.url) {
    rawUrl = String(repository.url).trim();
  }

  // Strip git+ and git:// prefixes and .git suffix for a clean browser URL
  let cleanUrl = rawUrl
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/\.git$/, '');

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
 * Handles missing fields gracefully with sensible fallbacks.
 *
 * @param {object} [pkg={}] - Raw package.json object
 * @param {string} [fallbackDir=''] - Optional directory to infer project name if missing
 * @returns {object} Normalized metadata object
 */
function extractMetadata(pkg = {}, fallbackDir = '') {
  // Infer fallback name from directory if name is missing or empty
  let inferredName = '';
  if (fallbackDir && typeof fallbackDir === 'string') {
    inferredName = path.basename(path.resolve(fallbackDir));
  }

  const name = typeof pkg.name === 'string' && pkg.name.trim()
    ? pkg.name.trim()
    : (inferredName || 'Unnamed Project');

  const description = typeof pkg.description === 'string' ? pkg.description.trim() : '';
  const version = typeof pkg.version === 'string' && pkg.version.trim() ? pkg.version.trim() : '';
  const license = typeof pkg.license === 'string' && pkg.license.trim() ? pkg.license.trim() : '';
  const author = normalizeAuthor(pkg.author);
  const repository = normalizeRepository(pkg.repository);
  const homepage = typeof pkg.homepage === 'string' ? pkg.homepage.trim() : '';
  const scripts = pkg.scripts && typeof pkg.scripts === 'object' && !Array.isArray(pkg.scripts) ? pkg.scripts : {};
  const engines = pkg.engines && typeof pkg.engines === 'object' && !Array.isArray(pkg.engines) ? pkg.engines : {};
  const keywords = Array.isArray(pkg.keywords)
    ? pkg.keywords.filter((k) => typeof k === 'string' && k.trim()).map((k) => k.trim())
    : [];

  const dependencies = pkg.dependencies && typeof pkg.dependencies === 'object' && !Array.isArray(pkg.dependencies)
    ? Object.keys(pkg.dependencies)
    : [];

  const devDependencies = pkg.devDependencies && typeof pkg.devDependencies === 'object' && !Array.isArray(pkg.devDependencies)
    ? Object.keys(pkg.devDependencies)
    : [];

  // Determine CLI binary name if configured
  let binName = '';
  if (typeof pkg.bin === 'string') {
    binName = name;
  } else if (pkg.bin && typeof pkg.bin === 'object' && !Array.isArray(pkg.bin)) {
    const binKeys = Object.keys(pkg.bin);
    if (binKeys.length > 0) {
      binName = binKeys[0];
    }
  }

  return {
    name,
    hasExplicitName: Boolean(pkg.name && typeof pkg.name === 'string' && pkg.name.trim()),
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
    main: typeof pkg.main === 'string' ? pkg.main : ''
  };
}

/**
 * Validates extracted metadata and generates helpful warning messages.
 * @param {object} metadata - Normalized metadata object
 * @returns {{ valid: boolean, warnings: string[] }} Validation status and warnings
 */
function validateMetadata(metadata) {
  const warnings = [];

  if (!metadata.hasExplicitName) {
    warnings.push('Project "name" is missing in package.json.');
  }
  if (!metadata.description) {
    warnings.push('Project "description" is empty in package.json.');
  }
  if (!metadata.version) {
    warnings.push('Project "version" is not defined.');
  }
  if (!metadata.license) {
    warnings.push('Project "license" is not specified.');
  }
  if (!metadata.repository) {
    warnings.push('Project "repository" URL is not specified.');
  }
  if (!metadata.scripts || Object.keys(metadata.scripts).length === 0) {
    warnings.push('No npm "scripts" are defined in package.json.');
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
