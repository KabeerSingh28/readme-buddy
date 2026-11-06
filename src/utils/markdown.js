/**
 * Markdown formatting and helper utilities.
 * Provides reusable functions for constructing clean, consistent Markdown elements.
 */

/**
 * Creates a Markdown heading with the specified level.
 * @param {string} text - Heading text
 * @param {number} [level=1] - Heading level (1 to 6)
 * @returns {string} Formatted Markdown heading
 */
function heading(text, level = 1) {
  const safeLevel = Math.min(Math.max(Number(level) || 1, 1), 6);
  return `${'#'.repeat(safeLevel)} ${text.trim()}`;
}

/**
 * Generates a Shields.io badge image Markdown string.
 * @param {string} label - Badge label (left side)
 * @param {string} message - Badge message (right side)
 * @param {string} [color='blue'] - Badge color name or hex code
 * @param {string} [style='flat'] - Badge style ('flat', 'flat-square', etc.)
 * @returns {string} Formatted Markdown badge
 */
function badge(label, message, color = 'blue', style = 'flat') {
  // Shields.io path requires dashes to be escaped with double dashes
  const encodePart = (str) =>
    encodeURIComponent(String(str).trim().replace(/-/g, '--').replace(/_/g, '__'));

  const url = `https://img.shields.io/badge/${encodePart(label)}-${encodePart(message)}-${encodeURIComponent(color)}?style=${encodeURIComponent(style)}`;
  return `![${label}: ${message}](${url})`;
}

/**
 * Formats a block of text as a fenced code block.
 * @param {string} code - Code block contents
 * @param {string} [language=''] - Programming language identifier (e.g., 'bash', 'js')
 * @returns {string} Formatted code block
 */
function codeBlock(code, language = '') {
  return `\`\`\`${language}\n${String(code).trim()}\n\`\`\``;
}

/**
 * Wraps text in inline code backticks.
 * @param {string} text - Code or command
 * @returns {string} Inline code formatted string
 */
function inlineCode(text) {
  return `\`${String(text).trim()}\``;
}

/**
 * Creates a Markdown link.
 * @param {string} text - Link text
 * @param {string} url - Target URL
 * @returns {string} Formatted Markdown link
 */
function link(text, url) {
  return `[${text.trim()}](${url.trim()})`;
}

/**
 * Formats data into a Markdown table.
 * @param {string[]} headers - Table header titles
 * @param {string[][]} rows - 2D array of row cells
 * @returns {string} Formatted Markdown table
 */
function table(headers, rows) {
  if (!Array.isArray(headers) || headers.length === 0) {
    return '';
  }

  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = (rows || []).map((row) => `| ${row.join(' | ')} |`);

  return [headerRow, separatorRow, ...dataRows].join('\n');
}

/**
 * Formats an array of items as a Markdown list.
 * @param {string[]} items - List items
 * @param {boolean} [ordered=false] - Whether to create an ordered list (1. 2.)
 * @returns {string} Formatted Markdown list
 */
function list(items, ordered = false) {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }

  return items
    .map((item, index) => {
      const prefix = ordered ? `${index + 1}.` : '-';
      return `${prefix} ${String(item).trim()}`;
    })
    .join('\n');
}

module.exports = {
  heading,
  badge,
  codeBlock,
  inlineCode,
  link,
  table,
  list
};
