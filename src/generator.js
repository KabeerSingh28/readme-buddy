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
  list,
  link
} = require('./utils/markdown');

/**
 * Builds standard Shields.io badges based strictly on present package metadata.
 * Does not fabricate badges for missing values.
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
 * Builds the Features section only when reasonably established from keywords or options.
 * If no keywords or custom features exist, returns an empty string (omits section).
 *
 * @param {object} metadata - Normalized package metadata
 * @param {object} [options={}] - Custom options
 * @param {string[]} [options.features] - Optional explicit features list
 * @returns {string} Features Markdown section or empty string
 */
function buildFeatures(metadata, options = {}) {
  // 1. Explicit features passed via options
  if (Array.isArray(options.features) && options.features.length > 0) {
    const lines = [heading('Features', 2), ''];
    lines.push(list(options.features));
    return lines.join('\n');
  }

  // 2. Inferred capabilities from keywords if available
  if (Array.isArray(metadata.keywords) && metadata.keywords.length > 0) {
    const lines = [
      heading('Features', 2),
      '',
      'Key focus areas and capabilities of this project:',
      '',
      list(metadata.keywords.map((kw) => `**${kw}**: Core topic and functionality`))
    ];
    return lines.join('\n');
  }

  // No verifiable features to display without fabrication
  return '';
}

/**
 * Builds the Installation section based on package properties (CLI vs library).
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
    lines.push('Or run directly without permanent installation via npx:');
    lines.push('');
    lines.push(codeBlock(`npx ${metadata.binName}`, 'bash'));
  } else if (metadata.hasExplicitName) {
    lines.push('Install as a dependency in your project:');
    lines.push('');
    lines.push(codeBlock(`npm install ${metadata.name}`, 'bash'));
  } else {
    lines.push('Install project dependencies locally:');
    lines.push('');
    lines.push(codeBlock('npm install', 'bash'));
  }

  return lines.join('\n');
}

/**
 * Infers a human-friendly description for standard npm script names.
 * @param {string} scriptName - Name of the npm script
 * @returns {string} Human-friendly description
 */
function describeScript(scriptName) {
  const descriptions = {
    test: 'Runs the automated test suite',
    start: 'Starts the application or service',
    build: 'Compiles or bundles project source assets',
    lint: 'Checks source code style and formatting',
    format: 'Auto-formats code files according to rules',
    dev: 'Starts local development server or watcher',
    prepare: 'Prepares package assets before publishing',
    clean: 'Cleans build artifacts and caches'
  };

  return descriptions[scriptName] || `Executes the ${scriptName} script command`;
}

/**
 * Builds the Available Scripts table or displays a neutral message if no scripts exist.
 * @param {object} scripts - package.json scripts object
 * @returns {string} Scripts table Markdown section
 */
function buildScriptsTable(scripts) {
  const lines = [heading('Available Scripts', 2), ''];

  if (!scripts || typeof scripts !== 'object' || Array.isArray(scripts)) {
    lines.push('No custom npm scripts are defined in package.json.');
    return lines.join('\n');
  }

  const scriptKeys = Object.keys(scripts);
  if (scriptKeys.length === 0) {
    lines.push('No custom npm scripts are defined in package.json.');
    return lines.join('\n');
  }

  lines.push('In the project directory, you can execute:');
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
 * Builds the Usage section tailored for CLI or programmatic library use.
 * @param {object} metadata - Normalized package metadata
 * @returns {string} Usage Markdown section
 */
function buildUsage(metadata) {
  const lines = [heading('Usage', 2), ''];

  if (metadata.binName) {
    lines.push(heading('Command Line Interface', 3), '');
    lines.push('Run the CLI command in your terminal:');
    lines.push('');
    lines.push(codeBlock(`${metadata.binName} --help`, 'bash'));
  }

  if (metadata.main) {
    if (metadata.binName) {
      lines.push('');
      lines.push(heading('Programmatic API', 3), '');
    }
    lines.push('Import the package in your Node.js application:');
    lines.push('');
    const varName = camelCase(metadata.name);
    const sampleImport = `const ${varName} = require('${metadata.name}');\n\n// Refer to package exports for available methods`;
    lines.push(codeBlock(sampleImport, 'javascript'));
  } else if (!metadata.binName) {
    if (metadata.scripts && metadata.scripts.start) {
      lines.push('Launch the project using:');
      lines.push('');
      lines.push(codeBlock('npm start', 'bash'));
    } else {
      lines.push('Refer to project scripts and documentation for usage details.');
    }
  }

  return lines.join('\n');
}

/**
 * Builds the Project Information summary section.
 * Contains structured metadata: version, license, author, dependencies count, repository.
 * @param {object} metadata - Normalized package metadata
 * @returns {string} Project Information Markdown section
 */
function buildProjectInformation(metadata) {
  const lines = [heading('Project Information', 2), ''];

  const rows = [];
  rows.push(['Name', inlineCode(metadata.name)]);
  rows.push(['Version', metadata.version ? inlineCode(metadata.version) : 'Not specified']);
  rows.push(['License', metadata.license ? inlineCode(metadata.license) : 'Not specified']);

  if (metadata.author) {
    rows.push(['Author', metadata.author]);
  }

  if (metadata.repository) {
    rows.push(['Repository', link(metadata.repository, metadata.repository)]);
  }

  if (metadata.engines && metadata.engines.node) {
    rows.push(['Node.js Requirement', inlineCode(metadata.engines.node)]);
  }

  const depCount = Array.isArray(metadata.dependencies) ? metadata.dependencies.length : 0;
  const devDepCount = Array.isArray(metadata.devDependencies) ? metadata.devDependencies.length : 0;

  rows.push(['Production Dependencies', String(depCount)]);
  rows.push(['Development Dependencies', String(devDepCount)]);

  if (metadata.keywords && metadata.keywords.length > 0) {
    rows.push(['Keywords', metadata.keywords.map((k) => inlineCode(k)).join(', ')]);
  }

  lines.push(table(['Property', 'Value'], rows));
  return lines.join('\n');
}

/**
 * Builds the License section.
 * @param {object} metadata - Normalized package metadata
 * @returns {string} License Markdown section
 */
function buildLicense(metadata) {
  const lines = [heading('License', 2), ''];

  if (metadata.license) {
    const authorText = metadata.author ? ` by ${metadata.author}` : '';
    lines.push(`This project is licensed under the ${metadata.license} License${authorText}.`);
  } else {
    lines.push('No license has been specified for this project in package.json.');
  }

  return lines.join('\n');
}

/**
 * Helper to convert package name to valid camelCase variable name.
 * @param {string} str - Package name
 * @returns {string} camelCase identifier
 */
function camelCase(str) {
  return str
    .replace(/^@[^/]+\//, '') // Strip npm scope (@org/)
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase()) || 'app';
}

/**
 * Main generator function that unites all sections into a complete README Markdown.
 *
 * @param {object} metadata - Normalized package metadata
 * @param {object} [options={}] - Custom formatting options
 * @param {boolean} [options.badges=true] - Whether to include Shields.io badges
 * @param {string[]} [options.features] - Optional explicit features list
 * @returns {{ content: string, sectionsGenerated: string[] }} Generated markdown & section list
 */
function generateReadmeContent(metadata, options = {}) {
  const includeBadges = options.badges !== false;
  const sections = [];
  const sectionsGenerated = [];

  // 1. Project Title & Badges
  const titleBlock = [];
  titleBlock.push(heading(metadata.name, 1));
  if (includeBadges) {
    const badgesContent = buildBadges(metadata);
    if (badgesContent) {
      titleBlock.push('', badgesContent);
    }
  }
  sections.push(titleBlock.join('\n'));
  sectionsGenerated.push('Project Title');

  // 2. Description
  const descriptionContent = metadata.description
    ? metadata.description
    : 'No project description provided in package.json.';
  sections.push(descriptionContent);
  sectionsGenerated.push('Description');

  // 3. Features (only when reasonably established or supplied)
  const featuresSection = buildFeatures(metadata, options);
  if (featuresSection) {
    sections.push(featuresSection);
    sectionsGenerated.push('Features');
  }

  // 4. Installation
  sections.push(buildInstallation(metadata));
  sectionsGenerated.push('Installation');

  // 5. Available Scripts
  sections.push(buildScriptsTable(metadata.scripts));
  sectionsGenerated.push('Available Scripts');

  // 6. Usage
  sections.push(buildUsage(metadata));
  sectionsGenerated.push('Usage');

  // 7. Project Information
  sections.push(buildProjectInformation(metadata));
  sectionsGenerated.push('Project Information');

  // 8. License
  sections.push(buildLicense(metadata));
  sectionsGenerated.push('License');

  return {
    content: `${sections.join('\n\n').trim()}\n`,
    sectionsGenerated
  };
}

module.exports = {
  buildBadges,
  buildFeatures,
  buildInstallation,
  buildScriptsTable,
  buildUsage,
  buildProjectInformation,
  buildLicense,
  generateReadmeContent
};
