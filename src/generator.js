/**
 * README content generator.
 * Builds structured, professional Markdown documentation from normalized package metadata.
 */

const {
  heading,
  badge,
  codeBlock,
  inlineCode,
  table,
  list
} = require('./utils/markdown');

/**
 * Builds standard Shields.io badges based on package metadata.
 * @param {object} metadata - Normalized package metadata
 * @returns {string} Badges row in Markdown
 */
function buildBadges(metadata) {
  const badges = [];

  if (metadata.version) {
    badges.push(badge('npm version', metadata.version, 'blue'));
  }
  if (metadata.license) {
    badges.push(badge('license', metadata.license, 'green'));
  }
  if (metadata.engines && metadata.engines.node) {
    badges.push(badge('node', metadata.engines.node, 'brightgreen'));
  }

  return badges.join(' ');
}

/**
 * Builds the Prerequisites section.
 * @param {object} metadata - Normalized package metadata
 * @returns {string} Prerequisites Markdown section
 */
function buildPrerequisites(metadata) {
  const lines = [heading('Prerequisites', 2), ''];

  const nodeReq = metadata.engines && metadata.engines.node
    ? `Node.js (${metadata.engines.node})`
    : 'Node.js (version 18 or higher recommended)';

  lines.push(list([nodeReq, 'npm (or yarn / pnpm)']));
  return lines.join('\n');
}

/**
 * Builds the Installation section.
 * @param {object} metadata - Normalized package metadata
 * @returns {string} Installation Markdown section
 */
function buildInstallation(metadata) {
  const lines = [heading('Installation', 2), ''];

  if (metadata.binName) {
    lines.push('Install globally via npm:');
    lines.push('');
    lines.push(codeBlock(`npm install -g ${metadata.name}`, 'bash'));
    lines.push('');
    lines.push('Or run directly without installation via npx:');
    lines.push('');
    lines.push(codeBlock(`npx ${metadata.binName}`, 'bash'));
  } else {
    lines.push('Install as a dependency:');
    lines.push('');
    lines.push(codeBlock(`npm install ${metadata.name}`, 'bash'));
  }

  return lines.join('\n');
}

/**
 * Builds the Usage section tailored for CLI or programmatic library use.
 * @param {object} metadata - Normalized package metadata
 * @returns {string} Usage Markdown section
 */
function buildUsage(metadata) {
  const lines = [heading('Usage', 2), ''];

  if (metadata.binName) {
    lines.push(heading('Command Line Interface', 3), '');
    lines.push('Execute the CLI command in your project terminal:');
    lines.push('');
    lines.push(codeBlock(`${metadata.binName} --help`, 'bash'));
  }

  if (metadata.main) {
    const subTitle = metadata.binName ? heading('Programmatic API', 3) : '';
    if (subTitle) {
      lines.push('');
      lines.push(subTitle, '');
    }
    lines.push('Import and use within your JavaScript application:');
    lines.push('');
    const sampleImport = `const ${camelCase(metadata.name)} = require('${metadata.name}');\n\n// Example usage\nconsole.log(${camelCase(metadata.name)});`;
    lines.push(codeBlock(sampleImport, 'javascript'));
  }

  return lines.join('\n');
}

/**
 * Infers a readable description for standard npm script names.
 * @param {string} scriptName - Name of the npm script
 * @returns {string} Human-friendly description
 */
function describeScript(scriptName) {
  const descriptions = {
    test: 'Runs the test suite',
    start: 'Starts the application or service',
    build: 'Builds assets or compiles project source',
    lint: 'Checks code style and formatting',
    format: 'Formats code according to project rules',
    dev: 'Starts development mode with live reloading',
    prepare: 'Prepares package before publishing'
  };

  return descriptions[scriptName] || `Executes the ${scriptName} task`;
}

/**
 * Builds the Available Scripts table.
 * @param {object} scripts - package.json scripts object
 * @returns {string} Scripts table Markdown section
 */
function buildScriptsTable(scripts) {
  if (!scripts || typeof scripts !== 'object') {
    return '';
  }

  const scriptKeys = Object.keys(scripts);
  if (scriptKeys.length === 0) {
    return '';
  }

  const lines = [heading('Available Scripts', 2), ''];
  lines.push('In the project directory, you can run:');
  lines.push('');

  const headers = ['Command', 'Description', 'Script'];
  const rows = scriptKeys.map((name) => [
    inlineCode(`npm run ${name}`),
    describeScript(name),
    inlineCode(scripts[name])
  ]);

  lines.push(table(headers, rows));
  return lines.join('\n');
}

/**
 * Builds the Contributing section.
 * @param {object} metadata - Normalized package metadata
 * @returns {string} Contributing Markdown section
 */
function buildContributing(metadata) {
  const lines = [
    heading('Contributing', 2),
    '',
    'Contributions, issues, and feature requests are welcome!'
  ];

  if (metadata.repository) {
    lines.push(`Feel free to check the [issues page](${metadata.repository}/issues).`);
  }

  return lines.join('\n');
}

/**
 * Builds the License and Author section.
 * @param {object} metadata - Normalized package metadata
 * @returns {string} License Markdown section
 */
function buildLicense(metadata) {
  const lines = [heading('License', 2), ''];

  const authorText = metadata.author ? ` by ${metadata.author}` : '';
  lines.push(`This project is licensed under the ${metadata.license} License${authorText}.`);

  return lines.join('\n');
}

/**
 * Helper to convert package name to valid camelCase variable name.
 * @param {string} str - Package name
 * @returns {string} camelCase identifier
 */
function camelCase(str) {
  return str
    .replace(/^@[^/]+\//, '') // Strip npm organization scope
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase()) || 'app';
}

/**
 * Main generator function that unites all sections into a complete README Markdown.
 * @param {object} metadata - Normalized package metadata
 * @param {object} [options={}] - Custom formatting options
 * @param {boolean} [options.badges=true] - Whether to include Shields.io badges
 * @returns {string} Full Markdown document
 */
function generateReadmeContent(metadata, options = {}) {
  const includeBadges = options.badges !== false;
  const sections = [];

  // Title & Header
  sections.push(heading(metadata.name, 1));

  // Badges
  if (includeBadges) {
    const badgesContent = buildBadges(metadata);
    if (badgesContent) {
      sections.push(badgesContent);
    }
  }

  // Description
  if (metadata.description) {
    sections.push(metadata.description);
  } else {
    sections.push(`> A modern Node.js project: ${metadata.name}`);
  }

  // Prerequisites
  sections.push(buildPrerequisites(metadata));

  // Installation
  sections.push(buildInstallation(metadata));

  // Usage
  sections.push(buildUsage(metadata));

  // Available Scripts
  const scriptsSection = buildScriptsTable(metadata.scripts);
  if (scriptsSection) {
    sections.push(scriptsSection);
  }

  // Contributing
  sections.push(buildContributing(metadata));

  // License
  sections.push(buildLicense(metadata));

  // Join sections with double newlines
  return `${sections.join('\n\n').trim()}\n`;
}

module.exports = {
  buildBadges,
  buildPrerequisites,
  buildInstallation,
  buildUsage,
  buildScriptsTable,
  buildContributing,
  buildLicense,
  generateReadmeContent
};
