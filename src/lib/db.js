import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getStudentByRoll(roll) {
  return prisma.student.findUnique({ where: { roll } });
}
export async function getStudentById(id) {
  return prisma.student.findUnique({ where: { id } });
}
export async function createStudent(data) {
  return prisma.student.create({
    data: {
      email: data.email,
      name: data.name,
      roll: data.roll,
      batch: data.batch,
      branch: data.branch,
      course: data.course || 'BTECH',
      mobile: data.mobile || '',
      cgpa: data.cgpa,
      tenth: data.tenth,
      twelfth: data.twelfth,
      backlog: data.backlog ? true : false,
      isDemo: false
    }
  });
}
export async function updateStudent(id, fields) {
  if (fields.backlog !== undefined) {
    fields.backlog = fields.backlog ? true : false;
  }
  return prisma.student.update({
    where: { id },
    data: fields
  });
}
export async function getAllStudents() {
  return prisma.student.findMany({
    orderBy: [
      { isDemo: 'desc' },
      { roll: 'asc' }
    ]
  });
}

function mapJob(j) {
  if (!j) return null;
  return {
    ...j,
    companyName: j.company?.name,
    company: j.company?.name,
    branchList: j.branches.split(',')
  };
}

export async function getJobs() {
  const jobs = await prisma.job.findMany({
    include: {
      company: true,
      rounds: { orderBy: { order: 'asc' } },
      documents: { orderBy: { uploadedAt: 'desc' } },
      changelogs: { orderBy: { date: 'asc' } }
    },
    orderBy: { deadline: 'asc' }
  });
  return jobs.map(mapJob);
}

export async function getJobById(id) {
  if (!id) return null;
  const j = await prisma.job.findUnique({
    where: { id },
    include: {
      company: true,
      rounds: { orderBy: { order: 'asc' } },
      documents: { orderBy: { uploadedAt: 'desc' } },
      changelogs: { orderBy: { date: 'asc' } }
    }
  });
  return mapJob(j);
}

export async function createJob(data) {
  let company = await prisma.company.findUnique({ where: { name: data.company } });
  if (!company) {
    company = await prisma.company.create({ data: { name: data.company } });
  }
  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      role: data.role,
      type: data.type,
      batch: data.batch,
      branches: data.branches.join(','),
      minCgpa: data.minCgpa,
      min10: data.min10,
      min12: data.min12,
      backlogAllowed: data.backlogAllowed ? true : false,
      package: data.package,
      location: data.location,
      deadline: data.deadline,
      status: 'open',
      version: 1,
      rounds: {
        create: (data.rounds || []).map((r, i) => ({
          name: r.name,
          date: r.date || null,
          venue: r.venue || null,
          order: i
        }))
      }
    }
  });
  return getJobById(job.id);
}

export async function updateJob(id, data) {
  let companyId = undefined;
  if (data.company) {
    let company = await prisma.company.findUnique({ where: { name: data.company } });
    if (!company) {
      company = await prisma.company.create({ data: { name: data.company } });
    }
    companyId = company.id;
  }
  
  await prisma.job.update({
    where: { id },
    data: {
      ...(companyId ? { companyId } : {}),
      role: data.role,
      type: data.type,
      batch: data.batch,
      branches: data.branches ? data.branches.join(',') : undefined,
      minCgpa: data.minCgpa,
      min10: data.min10,
      min12: data.min12,
      backlogAllowed: data.backlogAllowed !== undefined ? !!data.backlogAllowed : undefined,
      package: data.package,
      location: data.location,
      deadline: data.deadline,
      version: { increment: 1 }
    }
  });

  if (data.rounds) {
    await prisma.round.deleteMany({ where: { jobId: id } });
    if (data.rounds.length > 0) {
      await prisma.round.createMany({
        data: data.rounds.map((r, i) => ({
          jobId: id,
          name: r.name,
          date: r.date || null,
          venue: r.venue || null,
          order: i
        }))
      });
    }
  }

  await prisma.changelog.create({
    data: {
      jobId: id,
      text: 'Drive details were updated by TNP Office.'
    }
  });

  return getJobById(id);
}

export async function addRound(jobId, round) {
  const lastRound = await prisma.round.findFirst({
    where: { jobId },
    orderBy: { order: 'desc' }
  });
  const order = (lastRound?.order ?? -1) + 1;
  await prisma.round.create({
    data: {
      jobId,
      name: round.name,
      date: round.date || null,
      venue: round.venue || null,
      order
    }
  });
  return getJobById(jobId);
}

export async function addChangeLog(jobId, text) {
  await prisma.changelog.create({
    data: {
      jobId,
      text
    }
  });
  await prisma.job.update({
    where: { id: jobId },
    data: { version: { increment: 1 } }
  });
  return getJobById(jobId);
}

export async function addDocument(jobId, doc) {
  await prisma.document.create({
    data: {
      jobId,
      filename: doc.filename,
      url: doc.url
    }
  });
  return getJobById(jobId);
}

export async function deleteDocument(jobId, docId) {
  await prisma.document.deleteMany({
    where: { id: docId, jobId }
  });
  return getJobById(jobId);
}

export async function getApplicationsByStudent(studentId) {
  const apps = await prisma.application.findMany({
    where: { studentId },
    include: {
      job: {
        include: {
          company: true,
          rounds: { orderBy: { order: 'asc' } },
          documents: { orderBy: { uploadedAt: 'desc' } },
          changelogs: { orderBy: { date: 'asc' } }
        }
      }
    }
  });
  return apps.map(app => ({
    application: { id: app.id, status: app.status, note: app.note, updatedAt: app.updatedAt },
    job: mapJob(app.job)
  }));
}

export async function getApplication(studentId, jobId) {
  return prisma.application.findUnique({
    where: { studentId_jobId: { studentId, jobId } }
  });
}

export async function createApplication(studentId, jobId) {
  const existing = await getApplication(studentId, jobId);
  if (existing) return existing;
  return prisma.application.create({
    data: {
      studentId,
      jobId,
      status: 'APPLIED',
      note: 'Application submitted — await next update'
    }
  });
}

export async function updateApplicationStatus(studentId, jobId, status, note) {
  await prisma.application.update({
    where: { studentId_jobId: { studentId, jobId } },
    data: { status, note: note || null, updatedAt: new Date() }
  });
  return getApplication(studentId, jobId);
}

export async function getApplicantsForJob(jobId) {
  const apps = await prisma.application.findMany({
    where: { jobId },
    include: { student: true },
    orderBy: [
      { student: { isDemo: 'desc' } },
      { student: { roll: 'asc' } }
    ]
  });
  return apps.map(app => ({
    applicationId: app.id,
    status: app.status,
    note: app.note,
    updatedAt: app.updatedAt,
    studentId: app.student.id,
    name: app.student.name,
    roll: app.student.roll,
    branch: app.student.branch,
    isDemo: app.student.isDemo
  }));
}

export async function updateApplicationById(applicationId, status, note) {
  return prisma.application.update({
    where: { id: applicationId },
    data: { status, note: note || null, updatedAt: new Date() }
  });
}

export async function getApplicationStatsForJob(jobId) {
  const groups = await prisma.application.groupBy({
    by: ['status'],
    where: { jobId },
    _count: { _all: true }
  });
  const counts = { registered: 0, shortlisted: 0, interviewed: 0, selected: 0 };
  groups.forEach(g => {
    const n = g._count._all;
    counts.registered += n;
    if (['SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'JOINING'].includes(g.status)) counts.shortlisted += n;
    if (['INTERVIEW', 'SELECTED', 'JOINING'].includes(g.status)) counts.interviewed += n;
    if (['SELECTED', 'JOINING'].includes(g.status)) counts.selected += n;
  });
  return counts;
}

export async function getEligibleCountForJob(job) {
  const branchList = job.branches.split(',');
  const eligibleStudents = await prisma.student.findMany({
    where: {
      isDemo: false,
      batch: job.batch,
      branch: { in: branchList },
      cgpa: { gte: job.minCgpa },
      tenth: { gte: job.min10 },
      twelfth: { gte: job.min12 },
      ...(job.backlogAllowed ? {} : { backlog: false })
    }
  });
  
  const byBranch = {};
  eligibleStudents.forEach(s => {
    byBranch[s.branch] = (byBranch[s.branch] || 0) + 1;
  });
  return { total: eligibleStudents.length, byBranch };
}

export async function createNoticeDraft(rawText, parsed) {
  const draft = await prisma.noticeDraft.create({
    data: {
      rawText,
      parsed: JSON.stringify(parsed),
      status: 'PENDING'
    }
  });
  return { id: draft.id, rawText, parsed, status: 'PENDING' };
}

export async function setNoticeDraftStatus(id, status) {
  return prisma.noticeDraft.update({
    where: { id },
    data: { status }
  });
}

export default prisma;
