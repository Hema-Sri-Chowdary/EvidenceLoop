/**
 * Fictional compliance seed dataset with dynamic relative dates.
 * Ensures seed action resets/upserts cleanly without duplicating infinitely.
 */

export function generateSeedObligations() {
  const today = new Date();
  const formatOffset = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      title: 'SOC 2 Annual User Access Review & Privilege Deprovisioning',
      description: 'Quarterly audit of active user directories, privilege escalation logs, and verification of terminated employee access revocation.',
      category: 'Access Management',
      owner: 'Sarah Jenkins (IT SecOps)',
      dueDate: formatOffset(-4), // Overdue
      priority: 'Critical',
      status: 'In Progress',
      evidenceRequired: true,
      evidence: [],
    },
    {
      title: 'Quarterly Infrastructure Penetration Testing & Remediation',
      description: 'External third-party penetration test report and verified engineering tickets remediating high/critical vulnerabilities.',
      category: 'Vulnerability Management',
      owner: 'Marcus Vance (DevSecOps)',
      dueDate: formatOffset(-2), // Overdue + Completed BUT missing required evidence -> GAP!
      priority: 'High',
      status: 'Completed',
      evidenceRequired: true,
      evidence: [],
    },
    {
      title: 'GDPR / CCPA Data Processing Agreement (DPA) Vendor Audits',
      description: 'Ensure executed DPAs with Standard Contractual Clauses (SCCs) are on file for all sub-processors handling EU customer data.',
      category: 'Data Privacy',
      owner: 'Elena Rostova (Legal & Privacy)',
      dueDate: formatOffset(3), // Due in 3 days
      priority: 'High',
      status: 'In Progress',
      evidenceRequired: true,
      evidence: [
        {
          label: 'AWS & Cloudflare Executed DPAs (Drive Folder)',
          url: 'https://drive.google.com/drive/folders/audit-dpa-records-2026',
          addedAt: new Date(),
        },
      ],
    },
    {
      title: 'Disaster Recovery & Database Failover Simulation',
      description: 'Conduct annual read-replica promotion and recovery point objective (RPO) / recovery time objective (RTO) benchmark test.',
      category: 'Business Continuity',
      owner: 'David Kim (Platform Ops)',
      dueDate: formatOffset(5), // Due in 5 days
      priority: 'Medium',
      status: 'Open',
      evidenceRequired: true,
      evidence: [],
    },
    {
      title: 'Annual Security Awareness & Anti-Phishing Training Completion',
      description: 'Document 100% staff completion of mandatory security compliance training courses and simulated phishing defense drill.',
      category: 'Human Resources',
      owner: 'Rachel Adams (People Ops)',
      dueDate: formatOffset(-10),
      priority: 'Medium',
      status: 'Completed',
      evidenceRequired: true,
      evidence: [
        {
          label: 'LMS 100% Completion Export & Certificate Manifest',
          url: 'https://compliance-records.internal/exports/2026-training-summary.pdf',
          addedAt: new Date(),
        },
      ],
    },
    {
      title: 'Internal Ops Policy Bi-Annual Style Guide Review',
      description: 'Internal documentation housekeeping review. General formatting and wording updates for operations team wiki.',
      category: 'Operations',
      owner: 'Tyler Brooks (Operations)',
      dueDate: formatOffset(20),
      priority: 'Low',
      status: 'In Progress',
      evidenceRequired: false, // Optional evidence
      evidence: [],
    },
  ];
}
