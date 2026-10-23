/**
 * CSV Export Utility for EvidenceLoop
 * Includes RFC 4180 escaping and CSV Formula Injection Protection (CWE-1236).
 */
import { formatDate } from './dateUtils.js';
import { calculateReadiness } from './readinessEngine.js';

/**
 * Sanitize cell to prevent formula injection in Excel / Sheets.
 * If text starts with =, +, -, @, or tab/return, prefix with single quote.
 */
function sanitizeForCsvFormula(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${value}`;
  }
  return value;
}

/**
 * Escapes a cell according to standard RFC 4180 rules
 */
function escapeCsvCell(cell) {
  if (cell === null || cell === undefined) return '""';
  let str = String(cell);
  str = sanitizeForCsvFormula(str);
  // If string contains quotes, commas, or newlines, escape internal quotes by doubling them and wrap in quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Export obligations list to CSV and trigger browser download
 * 
 * @param {Array} obligations - Filtered obligation records
 * @param {string} [filename] - Optional custom filename
 */
export function exportObligationsToCsv(obligations = [], filename = 'evidenceloop-obligations.csv') {
  if (!Array.isArray(obligations) || obligations.length === 0) {
    throw new Error('No obligations available to export.');
  }

  const headers = [
    'Title',
    'Category',
    'Owner',
    'Due Date',
    'Priority',
    'Work Status',
    'Evidence Requirement',
    'Evidence Status',
    'Readiness Issues',
    'Suggested Next Action',
  ];

  const rows = obligations.map((item) => {
    const readiness = item.readiness || calculateReadiness(item);
    const evidenceCount = Array.isArray(item.evidence) ? item.evidence.length : 0;
    const evidenceStatus = !item.evidenceRequired
      ? 'Not Required'
      : evidenceCount > 0
      ? `Attached (${evidenceCount} link${evidenceCount === 1 ? '' : 's'})`
      : 'Missing Evidence';

    const issues = readiness.reasons && readiness.reasons.length > 0
      ? readiness.reasons.join('; ')
      : 'None';

    return [
      escapeCsvCell(item.title),
      escapeCsvCell(item.category),
      escapeCsvCell(item.owner),
      escapeCsvCell(formatDate(item.dueDate)),
      escapeCsvCell(item.priority),
      escapeCsvCell(item.status),
      escapeCsvCell(item.evidenceRequired ? 'Required' : 'Optional'),
      escapeCsvCell(evidenceStatus),
      escapeCsvCell(issues),
      escapeCsvCell(readiness.nextAction || 'None'),
    ].join(',');
  });

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');

  // Create UTF-8 BOM so Excel opens special characters correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
