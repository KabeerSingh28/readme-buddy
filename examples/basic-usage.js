/**
 * Basic usage example demonstrating programmatic usage of readme-buddy.
 * Run this file with: node examples/basic-usage.js
 */

const path = require('node:path');
// When installed as an npm package, use: const { generateReadme, buildMarkdown } = require('readme-buddy');
const { generateReadme, buildMarkdown } = require('../src/index');

console.log('====================================================');
console.log('1. In-memory generation using buildMarkdown()');
console.log('====================================================\n');

const markdownString = buildMarkdown({
  name: 'my-microservice',
  version: '1.0.0',
  description: 'A resilient event-driven microservice built on Node.js.',
  license: 'MIT',
  author: 'Kabeer Singh <kabeer@example.com>',
  scripts: {
    start: 'node server.js',
    test: 'node --test'
  },
  keywords: ['microservice', 'events', 'api']
});

console.log(markdownString);

console.log('====================================================');
console.log('2. File generation using generateReadme() (Dry Run)');
console.log('====================================================\n');

const sampleDir = path.join(__dirname, 'sample-project');

const result = generateReadme({
  projectDir: sampleDir,
  dryRun: true
});

console.log('Status:', result.success ? 'Success' : 'Failed');
console.log('Target package:', result.metadata.name);
console.log('Sections generated:', result.sectionsGenerated.join(', '));
console.log('Dry run preview length:', result.content.length, 'characters\n');

console.log('====================================================');
console.log('3. Writing to custom output file with overwrite protection');
console.log('====================================================\n');

const writeResult = generateReadme({
  projectDir: sampleDir,
  outputPath: 'README.md',
  overwrite: true
});

console.log('Successfully written to:', writeResult.outputPath);
console.log('File size:', writeResult.bytesWritten, 'bytes');
console.log('Ready!');
