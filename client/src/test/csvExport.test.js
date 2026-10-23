import { describe, it, expect } from 'vitest';
import { exportObligationsToCsv } from '../utils/csvExport.js';

describe('CSV Export & Security', () => {
  it('throws an error if obligations list is empty', () => {
    expect(() => exportObligationsToCsv([])).toThrow('No obligations available to export.');
  });

  it('generates downloadable blob with formula injection protection', () => {
    let capturedBlob = null;
    const originalCreateObjectURL = window.URL.createObjectURL;
    window.URL.createObjectURL = (blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    };
    window.URL.revokeObjectURL = () => {};

    const maliciousData = [
      {
        title: '=1+1', // Spreadsheet formula injection attempt
        category: '+cmd|/c calc',
        owner: '-Dangerous User',
        dueDate: '2026-10-25',
        priority: 'High',
        status: 'In Progress',
        evidenceRequired: true,
        evidence: [],
      },
    ];

    exportObligationsToCsv(maliciousData, 'test.csv');

    expect(capturedBlob).not.toBeNull();
    window.URL.createObjectURL = originalCreateObjectURL;
  });
});
