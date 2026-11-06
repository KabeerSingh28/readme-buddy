/**
 * Markdown formatting and helper utilities.
 * Provides reusable functions for constructing clean, consistent Markdown elements.
 */

/**
 * Escapes characters that interfere with Markdown table cell layout.
 * Specifically escapes pipe characters and collapses internal newlines.
 * @param {string|number} cellValue - Value to sanitize
 * @returns {string} Sanitized string safe for table cell
 */
function escapeTableCell(cellValue) {
  if (cellValue === null || cellValue === undefined) {
    return '';
  }
  return String(cellValue)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

/**
 * Creates a Markdown heading with the specified level.
 * @param {string} text - Heading text
 * @param {number} [level=1] - Heading level (1 to 6)
 * @returns {string} Formatted Markdown heading
 */
function heading(text, level = 1) {
  const safeLevel = Math.min(Math.max(Number(level) || 1, 1), 6);
  const cleanText = String(text || '').trim();
  return `${'#'.repeat(safeLevel)} ${cleanText}`;
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

  const cleanLabel = String(label || '').trim();
  const cleanMsg = String(message || '').trim();
  const url = `https://img.shields.io/badge/${encodePart(cleanLabel)}-${encodePart(cleanMsg)}-${encodeURIComponent(color)}?style=${encodeURIComponent(style)}`;
  return `![${cleanLabel}: ${cleanMsg}](${url})`;
}

/**
 * Formats a block of text as a fenced code block.
 * @param {string} code - Code block contents
 * @param {string} [language=''] - Programming language identifier (e.g., 'bash', 'js')
 * @returns {string} Formatted code block
 */
function codeBlock(code, language = '') {
  const cleanCode = String(code || '').trim();
  return `\`\`\`${language}\n${cleanCode}\n\`\`\``;
}

/**
 * Wraps text in inline code backticks.
 * Escapes backticks inside if present.
 * @param {string} text - Code or command
 * @returns {string} Inline code formatted string
 */
function inlineCode(text) {
  const cleanText = String(text || '').replace(/`/g, '\\`').trim();
  return `\`${cleanText}\``;
}

/**
 * Creates a Markdown link.
 * @param {string} text - Link text
 * @param {string} url - Target URL
 * @returns {string} Formatted Markdown link
 */
function link(text, url) {
  const cleanText = String(text || '').trim();
  const cleanUrl = String(url || '').trim();
  return `[${cleanText}](${cleanUrl})`;
}

/**
 * Formats data into a Markdown table with safe cell escaping.
 * @param {string[]} headers - Table header titles
 * @param {string[][]} rows - 2D array of row cells
 * @returns {string} Formatted Markdown table
 */
function table(headers, rows) {
  if (!Array.isArray(headers) || headers.length === 0) {
    return '';
  }

  const safeHeaders = headers.map(escapeTableCell);
  const headerRow = `| ${safeHeaders.join(' | ')} |`;
  const separatorRow = `| ${safeHeaders.map(() => '---').join(' | ')} |`;

  const safeRows = (rows || []).map((row) => {
    if (!Array.isArray(row)) return '';
    const safeCells = row.map(escapeTableCell);
    return `| ${safeCells.join(' | ')} |`;
  }).filter(Boolean);

  return [headerRow, separatorRow, ...safeRows].join('\n');
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
    .filter((item) => item !== null && item !== undefined && String(item).trim() !== '')
    .map((item, index) => {
      const prefix = ordered ? `${index + 1}.` : '-';
      return `${prefix} ${String(item).trim()}`;
    })
    .join('\n');
}

module.exports = {
  escapeTableCell,
  heading,
  badge,
  codeBlock,
  inlineCode,
  link,
  table,
  list
};
