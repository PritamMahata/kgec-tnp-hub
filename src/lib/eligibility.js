export function checkEligibility(job, student) {
  const branches = job.branchList || job.branches.split(',');
  return [
    { label: 'Batch', pass: job.batch === student.batch },
    { label: 'Branch', pass: branches.includes(student.branch) },
    { label: `CGPA ≥ ${job.minCgpa}`, pass: student.cgpa >= job.minCgpa },
    { label: `10th ≥ ${job.min10}%`, pass: student.tenth >= job.min10 },
    { label: `12th ≥ ${job.min12}%`, pass: student.twelfth >= job.min12 },
    { label: 'No active backlog', pass: !!job.backlogAllowed || !student.backlog }
  ];
}

export function isEligible(job, student) {
  return checkEligibility(job, student).every((c) => c.pass);
}

export const PIPELINE_STAGES = ['APPLIED', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'JOINING'];

export function statusLabel(status) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function urgencyOf(deadline, now = new Date()) {
  const hours = (new Date(deadline) - now) / 36e5;
  if (hours < 0) return 'expired';
  if (hours <= 48) return 'urgent';
  if (hours <= 168) return 'upcoming';
  return 'later';
}
