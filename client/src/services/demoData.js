/**
 * Fictional compliance seed data representing realistic audit readiness scenarios
 * Demonstrates:
 * 1. Completed with missing required evidence (CRITICAL GAP)
 * 2. Overdue obligation
 * 3. Due soon obligation (< 7 days)
 * 4. Ready for review (Completed with evidence)
 * 5. In-progress with optional evidence
 */

// Generate dynamic relative dates so the demo is always fresh
const today = new Date();

const formatDateOffset = (offsetDays) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_DEMO_OBLIGATIONS = [
  {
    _id: 'demo-obl-001',
    title: 'SOC 2 Annual User Access Review & Privilege Deprovisioning',
    description: 'Quarterly audit of active user directories, privilege escalation logs, and verification of terminated employee access revocation.',
    category: 'Access Management',
    owner: 'Sarah Jenkins (IT SecOps)',
    dueDate: formatDateOffset(-4), // 4 days overdue
    priority: 'Critical',
    status: 'In Progress',
    evidenceRequired: true,
    evidence: [],
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    _id: 'demo-obl-002',
    title: 'Quarterly Infrastructure Penetration Testing & Remediation',
    description: 'External third-party penetration test report and verified engineering tickets remediating high/critical vulnerabilities.',
    category: 'Vulnerability Management',
    owner: 'Marcus Vance (DevSecOps)',
    dueDate: formatDateOffset(-2), // 2 days overdue
    priority: 'High',
    status: 'Completed',
    evidenceRequired: true,
    evidence: [], // Completed BUT missing required evidence -> CRITICAL GAP!
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    _id: 'demo-obl-003',
    title: 'GDPR / CCPA Data Processing Agreement (DPA) Vendor Audits',
    description: 'Ensure executed DPAs with Standard Contractual Clauses (SCCs) are on file for all sub-processors handling EU customer data.',
    category: 'Data Privacy',
    owner: 'Elena Rostova (Legal & Privacy)',
    dueDate: formatDateOffset(3), // Due in 3 days (Due soon)
    priority: 'High',
    status: 'In Progress',
    evidenceRequired: true,
    evidence: [
      {
        _id: 'ev-001',
        label: 'AWS & Cloudflare Executed DPAs (Drive Folder)',
        url: 'https://drive.google.com/drive/folders/audit-dpa-records-2026',
        addedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    _id: 'demo-obl-004',
    title: 'Disaster Recovery & Database Failover Simulation',
    description: 'Conduct annual read-replica promotion and recovery point objective (RPO) / recovery time objective (RTO) benchmark test.',
    category: 'Business Continuity',
    owner: 'David Kim (Platform Ops)',
    dueDate: formatDateOffset(5), // Due in 5 days (Due soon)
    priority: 'Medium',
    status: 'Open',
    evidenceRequired: true,
    evidence: [],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    _id: 'demo-obl-005',
    title: 'Annual Security Awareness & Anti-Phishing Training Completion',
    description: 'Document 100% staff completion of mandatory security compliance training courses and simulated phishing defense drill.',
    category: 'Human Resources',
    owner: 'Rachel Adams (People Ops)',
    dueDate: formatDateOffset(-10),
    priority: 'Medium',
    status: 'Completed',
    evidenceRequired: true,
    evidence: [
      {
        _id: 'ev-002',
        label: 'LMS 100% Completion Export & Certificate Manifest',
        url: 'https://compliance-records.internal/exports/2026-training-summary.pdf',
        addedAt: new Date(Date.now() - 11 * 86400000).toISOString(),
      },
      {
        _id: 'ev-003',
        label: 'Phishing Campaign Simulation Metrics Dashboard',
        url: 'https://security.knowbe4.com/reports/campaign-q3-results',
        addedAt: new Date(Date.now() - 11 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    _id: 'demo-obl-006',
    title: 'Internal Ops Policy Bi-Annual Style Guide Review',
    description: 'Internal documentation housekeeping review. General formatting and wording updates for operations team wiki.',
    category: 'Operations',
    owner: 'Tyler Brooks (Operations)',
    dueDate: formatDateOffset(20), // Due in 20 days
    priority: 'Low',
    status: 'In Progress',
    evidenceRequired: false, // Optional evidence
    evidence: [],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];
