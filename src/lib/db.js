// Data layer for KGEC TNP Hub.
//
// Uses Node's built-in `node:sqlite` (stable-enough as of Node 22.5+, marked
// experimental by Node itself) so the project runs with zero external
// services or native-binary downloads — clone, `npm install`, `npm run dev`.
//
// For a real multi-instance deployment, swap this file for Prisma + Postgres
// (see prisma-schema-reference.prisma alongside this file for the equivalent
// schema) and keep the exported function names the same; nothing outside
// this file talks to SQLite directly.

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DB_FILE = process.env.DATABASE_FILE || './data.db';
const DB_PATH = path.isAbsolute(DB_FILE) ? DB_FILE : path.join(/*turbopackIgnore: true*/ process.cwd(), DB_FILE);

function getDb() {
  if (!globalThis.__tnpDb) {
    const db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA foreign_keys = ON;');
    createSchema(db);
    globalThis.__tnpDb = db;
    if (isEmpty(db)) seed(db);
  }
  return globalThis.__tnpDb;
}

function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      roll TEXT UNIQUE NOT NULL,
      batch TEXT NOT NULL,
      branch TEXT NOT NULL,
      cgpa REAL NOT NULL,
      tenth REAL NOT NULL,
      twelfth REAL NOT NULL,
      backlog INTEGER NOT NULL DEFAULT 0,
      isDemo INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL REFERENCES companies(id),
      role TEXT NOT NULL,
      type TEXT NOT NULL,
      batch TEXT NOT NULL,
      branches TEXT NOT NULL,
      minCgpa REAL NOT NULL,
      min10 REAL NOT NULL,
      min12 REAL NOT NULL,
      backlogAllowed INTEGER NOT NULL DEFAULT 0,
      package TEXT NOT NULL,
      location TEXT NOT NULL,
      deadline TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      version INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rounds (
      id TEXT PRIMARY KEY,
      jobId TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      date TEXT,
      venue TEXT,
      "order" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      jobId TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      uploadedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS changelogs (
      id TEXT PRIMARY KEY,
      jobId TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL REFERENCES students(id),
      jobId TEXT NOT NULL REFERENCES jobs(id),
      status TEXT NOT NULL DEFAULT 'APPLIED',
      note TEXT,
      updatedAt TEXT NOT NULL,
      UNIQUE(studentId, jobId)
    );

    CREATE TABLE IF NOT EXISTS notice_drafts (
      id TEXT PRIMARY KEY,
      rawText TEXT NOT NULL,
      parsed TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL
    );
  `);
}

function isEmpty(db) {
  const row = db.prepare('SELECT COUNT(*) as n FROM students').get();
  return row.n === 0;
}

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'Civil'];
const BRANCH_WEIGHTS = [0.28, 0.18, 0.16, 0.12, 0.16, 0.1];
function pickBranch() {
  let r = Math.random();
  let acc = 0;
  for (let i = 0; i < BRANCHES.length; i++) {
    acc += BRANCH_WEIGHTS[i];
    if (r <= acc) return BRANCHES[i];
  }
  return BRANCHES[0];
}
function round1(n) {
  return Math.round(n * 10) / 10;
}

function seed(db) {
  const now = new Date().toISOString();

  const insStudent = db.prepare(
    `INSERT INTO students (id, name, roll, batch, branch, cgpa, tenth, twelfth, backlog, isDemo, createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  );
  insStudent.run(randomUUID(), 'Pritam Sarkar', '21CS0142', '2027', 'CSE', 7.8, 82, 78, 0, 1, now);
  const demoId = db.prepare('SELECT id FROM students WHERE roll = ?').get('21CS0142').id;

  const roster = [];
  for (let i = 0; i < 120; i++) {
    const branch = pickBranch();
    roster.push({
      id: randomUUID(),
      name: `Student ${i + 1}`,
      roll: `2027${branch.slice(0, 2).toUpperCase()}${String(1000 + i)}`,
      batch: '2027',
      branch,
      cgpa: round1(5.5 + Math.random() * 4),
      tenth: Math.round(55 + Math.random() * 40),
      twelfth: Math.round(55 + Math.random() * 40),
      backlog: Math.random() < 0.12 ? 1 : 0
    });
  }
  for (const s of roster) {
    insStudent.run(s.id, s.name, s.roll, s.batch, s.branch, s.cgpa, s.tenth, s.twelfth, s.backlog, 0, now);
  }

  const insCompany = db.prepare('INSERT INTO companies (id, name) VALUES (?,?)');
  const insJob = db.prepare(`
    INSERT INTO jobs (id, companyId, role, type, batch, branches, minCgpa, min10, min12, backlogAllowed, package, location, deadline, status, version, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insRound = db.prepare('INSERT INTO rounds (id, jobId, name, date, venue, "order") VALUES (?,?,?,?,?,?)');
  const insChangelog = db.prepare('INSERT INTO changelogs (id, jobId, text, date) VALUES (?,?,?,?)');
  const insApplication = db.prepare(
    `INSERT OR IGNORE INTO applications (id, studentId, jobId, status, note, updatedAt) VALUES (?,?,?,?,?,?)`
  );

  const jobsData = [
    {
      company: 'Kreeti Technology', role: 'Junior Software Engineer', type: 'Placement',
      batch: '2027', branches: 'CSE,IT,ECE,EE', minCgpa: 7.0, min10: 70, min12: 70, backlogAllowed: 0,
      package: '₹6 LPA', location: 'Kolkata', deadline: '2026-09-18T16:00:00',
      rounds: [
        ['Aptitude Test', '2026-09-28T10:00:00', 'Govt. College of Leather Technology'],
        ['Coding Test', null, null], ['Advanced Coding', null, null], ['Group Discussion', null, null],
        ['HR Round', null, null], ['Technical Round', null, null], ['Final Selection', null, null]
      ],
      changelog: []
    },
    {
      company: 'Tismo Technology', role: 'Software Trainee', type: 'Placement',
      batch: '2027', branches: 'CSE,IT', minCgpa: 6.5, min10: 60, min12: 60, backlogAllowed: 1,
      package: '₹4.5 LPA', location: 'Kolkata', deadline: '2026-08-20T16:00:00',
      rounds: [
        ['Assessment', '2026-08-20T10:00:00', 'Campus Lab 2'],
        ['Interview', '2026-08-25T11:00:00', 'Seminar Hall'],
        ['Selection', '2026-08-27T00:00:00', null]
      ],
      changelog: ['Revised shortlist published — 6 additional candidates added.'],
      demoApplication: { status: 'SELECTED', note: 'Submit joining date by 20 Sep' }
    },
    {
      company: 'TCS', role: 'NQT — Ninja', type: 'Placement',
      batch: '2027', branches: 'CSE,IT,ECE,EE,ME', minCgpa: 6.0, min10: 65, min12: 65, backlogAllowed: 0,
      package: '₹3.6 LPA', location: 'Pan India', deadline: '2026-08-15T16:00:00',
      rounds: [
        ['NQT Test', '2026-08-15T09:00:00', 'Online'],
        ['Interview', '2026-09-18T09:30:00', 'AAB Building']
      ],
      changelog: [],
      demoApplication: { status: 'INTERVIEW', note: 'Attend interview — 18 Sep, 9:30 AM, AAB Building' }
    },
    {
      company: 'APPSeCONNECT', role: 'Associate Software Engineer', type: 'Placement',
      batch: '2027', branches: 'CSE,IT,ECE', minCgpa: 6.5, min10: 60, min12: 60, backlogAllowed: 1,
      package: '₹4 LPA', location: 'Kolkata', deadline: '2026-09-07T16:00:00',
      rounds: [
        ['Round 1 — Screening', '2026-09-07T10:00:00', 'Online'],
        ['Round 2 — Communication', '2026-09-20T10:00:00', 'Online'],
        ['Technical Round', null, null], ['Final Selection', null, null]
      ],
      changelog: [],
      demoApplication: { status: 'ASSESSMENT', note: 'Attend Round 2 (Communication) — 20 Sep, 10:00 AM, online' }
    },
    {
      company: 'CodeHood', role: 'Frontend Developer Intern', type: 'Internship',
      batch: '2027', branches: 'CSE,IT', minCgpa: 6.5, min10: 60, min12: 60, backlogAllowed: 1,
      package: '₹25,000/mo', location: 'Remote', deadline: '2026-08-05T16:00:00',
      rounds: [
        ['Portfolio Review', '2026-08-05T00:00:00', null],
        ['Interview', '2026-08-10T15:00:00', 'Online'],
        ['Selection', '2026-08-12T00:00:00', null]
      ],
      changelog: [],
      demoApplication: { status: 'SELECTED', note: 'Submit joining date' }
    },
    {
      company: 'Gateway Group', role: 'Graduate Engineer Trainee', type: 'Placement',
      batch: '2027', branches: 'ME,EE', minCgpa: 7.0, min10: 70, min12: 70, backlogAllowed: 0,
      package: '₹5.2 LPA', location: 'Durgapur', deadline: '2026-09-25T16:00:00',
      rounds: [
        ['Group Discussion', '2026-09-30T11:00:00', 'Conference Room B'],
        ['Technical Interview', null, null]
      ],
      changelog: []
    },
    {
      company: 'M.N. Dastur & Co.', role: 'Graduate Engineer Trainee', type: 'Placement',
      batch: '2027', branches: 'CSE,IT,Civil', minCgpa: 6.5, min10: 60, min12: 60, backlogAllowed: 1,
      package: '₹5.5 LPA', location: 'Kolkata', deadline: '2026-09-22T16:00:00',
      rounds: [
        ['Aptitude Test', '2026-09-26T10:00:00', 'Online'],
        ['Technical Interview', null, null]
      ],
      changelog: ['Classification corrected: this drive will be counted as On-Campus, not Off-Campus.']
    }
  ];

  const allStudents = [{ id: demoId, isDemo: true }, ...roster];
  const stages = ['APPLIED', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'REJECTED'];

  for (const jd of jobsData) {
    const companyId = randomUUID();
    insCompany.run(companyId, jd.company);
    const jobId = randomUUID();
    insJob.run(
      jobId, companyId, jd.role, jd.type, jd.batch, jd.branches,
      jd.minCgpa, jd.min10, jd.min12, jd.backlogAllowed, jd.package, jd.location,
      jd.deadline, 'open', jd.changelog.length ? 2 : 1, now
    );
    jd.rounds.forEach(([name, date, venue], i) => insRound.run(randomUUID(), jobId, name, date, venue, i));
    jd.changelog.forEach((text) => insChangelog.run(randomUUID(), jobId, text, now));

    if (jd.demoApplication) {
      insApplication.run(randomUUID(), demoId, jobId, jd.demoApplication.status, jd.demoApplication.note, now);
    }

    const branchList = jd.branches.split(',');
    const eligiblePool = roster.filter(
      (s) =>
        s.batch === jd.batch &&
        branchList.includes(s.branch) &&
        s.cgpa >= jd.minCgpa &&
        s.tenth >= jd.min10 &&
        s.twelfth >= jd.min12 &&
        (jd.backlogAllowed || !s.backlog)
    );
    const applicantPool = eligiblePool
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(eligiblePool.length * (0.4 + Math.random() * 0.4)));
    for (const s of applicantPool) {
      const stage = stages[Math.floor(Math.random() * stages.length)];
      insApplication.run(randomUUID(), s.id, jobId, stage, null, now);
    }
  }
}

/* =========================================================
   node:sqlite returns rows with a null prototype, which Next.js refuses to
   serialize when a Server Component passes them as props to a Client
   Component ("Only plain objects... can be passed"). Every row that leaves
   this file goes through one of these first to become an ordinary object.
========================================================= */
function plain(row) {
  return row ? { ...row } : row;
}
function plainAll(rows) {
  return rows.map(plain);
}

/* =========================================================
   Query helpers — everything outside this file goes through these.
========================================================= */

export function getStudentByRoll(roll) {
  return plain(getDb().prepare('SELECT * FROM students WHERE roll = ?').get(roll)) || null;
}
export function getStudentById(id) {
  return plain(getDb().prepare('SELECT * FROM students WHERE id = ?').get(id)) || null;
}
export function createStudent(data) {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO students (id, name, roll, batch, branch, cgpa, tenth, twelfth, backlog, isDemo, createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,0,?)`
  ).run(id, data.name, data.roll, data.batch, data.branch, data.cgpa, data.tenth, data.twelfth, data.backlog ? 1 : 0, new Date().toISOString());
  return getStudentById(id);
}
export function updateStudent(id, fields) {
  const db = getDb();
  const cols = Object.keys(fields);
  if (!cols.length) return getStudentById(id);
  const setSql = cols.map((c) => `${c} = ?`).join(', ');
  const vals = cols.map((c) => (c === 'backlog' ? (fields[c] ? 1 : 0) : fields[c]));
  db.prepare(`UPDATE students SET ${setSql} WHERE id = ?`).run(...vals, id);
  return getStudentById(id);
}
export function getAllStudents() {
  return plainAll(getDb().prepare('SELECT * FROM students ORDER BY isDemo DESC, roll ASC').all());
}

function attachJobRelations(db, job) {
  if (!job) return job;
  job = plain(job);
  job.rounds = plainAll(db.prepare('SELECT * FROM rounds WHERE jobId = ? ORDER BY "order" ASC').all(job.id));
  job.documents = plainAll(db.prepare('SELECT * FROM documents WHERE jobId = ? ORDER BY uploadedAt DESC').all(job.id));
  job.changelogs = plainAll(db.prepare('SELECT * FROM changelogs WHERE jobId = ? ORDER BY date ASC').all(job.id));
  job.branchList = job.branches.split(',');
  return job;
}

export function getJobs() {
  const db = getDb();
  const jobs = db
    .prepare(
      `SELECT jobs.*, companies.name as company FROM jobs
       JOIN companies ON companies.id = jobs.companyId
       ORDER BY jobs.deadline ASC`
    )
    .all();
  return plainAll(jobs).map((j) => attachJobRelations(db, j));
}

export function getJobById(id) {
  const db = getDb();
  const job = db
    .prepare(
      `SELECT jobs.*, companies.name as company FROM jobs
       JOIN companies ON companies.id = jobs.companyId
       WHERE jobs.id = ?`
    )
    .get(id);
  return attachJobRelations(db, plain(job));
}

export function createJob(data) {
  const db = getDb();
  let company = db.prepare('SELECT * FROM companies WHERE name = ?').get(data.company);
  if (!company) {
    const companyId = randomUUID();
    db.prepare('INSERT INTO companies (id, name) VALUES (?,?)').run(companyId, data.company);
    company = { id: companyId, name: data.company };
  }
  const jobId = randomUUID();
  db.prepare(
    `INSERT INTO jobs (id, companyId, role, type, batch, branches, minCgpa, min10, min12, backlogAllowed, package, location, deadline, status, version, createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`
  ).run(
    jobId, company.id, data.role, data.type, data.batch, data.branches.join(','),
    data.minCgpa, data.min10, data.min12, data.backlogAllowed ? 1 : 0,
    data.package, data.location, data.deadline, 'open', new Date().toISOString()
  );
  (data.rounds || []).forEach((r, i) => {
    db.prepare('INSERT INTO rounds (id, jobId, name, date, venue, "order") VALUES (?,?,?,?,?,?)').run(
      randomUUID(), jobId, r.name, r.date || null, r.venue || null, i
    );
  });
  return getJobById(jobId);
}

export function addRound(jobId, round) {
  const db = getDb();
  const maxOrder = db.prepare('SELECT MAX("order") as m FROM rounds WHERE jobId = ?').get(jobId).m;
  db.prepare('INSERT INTO rounds (id, jobId, name, date, venue, "order") VALUES (?,?,?,?,?,?)').run(
    randomUUID(), jobId, round.name, round.date || null, round.venue || null, (maxOrder ?? -1) + 1
  );
  return getJobById(jobId);
}

export function addChangeLog(jobId, text) {
  const db = getDb();
  db.prepare('INSERT INTO changelogs (id, jobId, text, date) VALUES (?,?,?,?)').run(
    randomUUID(), jobId, text, new Date().toISOString()
  );
  db.prepare('UPDATE jobs SET version = version + 1 WHERE id = ?').run(jobId);
  return getJobById(jobId);
}

export function addDocument(jobId, doc) {
  const db = getDb();
  db.prepare('INSERT INTO documents (id, jobId, filename, url, uploadedAt) VALUES (?,?,?,?,?)').run(
    randomUUID(), jobId, doc.filename, doc.url, new Date().toISOString()
  );
  return getJobById(jobId);
}

export function getApplicationsByStudent(studentId) {
  const db = getDb();
  const apps = db
    .prepare(
      `SELECT applications.*, jobs.*, companies.name as company, applications.id as applicationId, applications.status as appStatus
       FROM applications
       JOIN jobs ON jobs.id = applications.jobId
       JOIN companies ON companies.id = jobs.companyId
       WHERE applications.studentId = ?`
    )
    .all(studentId);
  return plainAll(apps).map((row) => ({
    application: { id: row.applicationId, status: row.appStatus, note: row.note, updatedAt: row.updatedAt },
    job: getJobById(row.jobId)
  }));
}

export function getApplication(studentId, jobId) {
  return plain(getDb().prepare('SELECT * FROM applications WHERE studentId = ? AND jobId = ?').get(studentId, jobId)) || null;
}

export function createApplication(studentId, jobId) {
  const db = getDb();
  const existing = getApplication(studentId, jobId);
  if (existing) return existing;
  const id = randomUUID();
  db.prepare(
    `INSERT INTO applications (id, studentId, jobId, status, note, updatedAt) VALUES (?,?,?, 'APPLIED', ?, ?)`
  ).run(id, studentId, jobId, 'Application submitted — await next update', new Date().toISOString());
  return getApplication(studentId, jobId);
}

export function updateApplicationStatus(studentId, jobId, status, note) {
  const db = getDb();
  db.prepare('UPDATE applications SET status = ?, note = ?, updatedAt = ? WHERE studentId = ? AND jobId = ?').run(
    status, note ?? null, new Date().toISOString(), studentId, jobId
  );
  return getApplication(studentId, jobId);
}

export function getApplicantsForJob(jobId) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT applications.id as applicationId, applications.status, applications.note, applications.updatedAt,
              students.id as studentId, students.name, students.roll, students.branch, students.isDemo
       FROM applications
       JOIN students ON students.id = applications.studentId
       WHERE applications.jobId = ?
       ORDER BY students.isDemo DESC, students.roll ASC`
    )
    .all(jobId);
  return plainAll(rows);
}

export function updateApplicationById(applicationId, status, note) {
  const db = getDb();
  db.prepare('UPDATE applications SET status = ?, note = ?, updatedAt = ? WHERE id = ?').run(
    status, note ?? null, new Date().toISOString(), applicationId
  );
  return plain(db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId));
}

export function getApplicationStatsForJob(jobId) {
  const db = getDb();
  const rows = db.prepare('SELECT status, COUNT(*) as n FROM applications WHERE jobId = ? GROUP BY status').all(jobId);
  const counts = { registered: 0, shortlisted: 0, interviewed: 0, selected: 0 };
  rows.forEach((r) => {
    counts.registered += r.n;
    if (['SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'JOINING'].includes(r.status)) counts.shortlisted += r.n;
    if (['INTERVIEW', 'SELECTED', 'JOINING'].includes(r.status)) counts.interviewed += r.n;
    if (['SELECTED', 'JOINING'].includes(r.status)) counts.selected += r.n;
  });
  return counts;
}

export function getEligibleCountForJob(job) {
  const db = getDb();
  const students = plainAll(db.prepare('SELECT * FROM students WHERE isDemo = 0').all());
  const branchList = job.branches.split(',');
  const eligible = students.filter(
    (s) =>
      s.batch === job.batch &&
      branchList.includes(s.branch) &&
      s.cgpa >= job.minCgpa &&
      s.tenth >= job.min10 &&
      s.twelfth >= job.min12 &&
      (job.backlogAllowed || !s.backlog)
  );
  const byBranch = {};
  eligible.forEach((s) => (byBranch[s.branch] = (byBranch[s.branch] || 0) + 1));
  return { total: eligible.length, byBranch };
}

export function createNoticeDraft(rawText, parsed) {
  const db = getDb();
  const id = randomUUID();
  db.prepare('INSERT INTO notice_drafts (id, rawText, parsed, status, createdAt) VALUES (?,?,?,\'PENDING\',?)').run(
    id, rawText, JSON.stringify(parsed), new Date().toISOString()
  );
  return { id, rawText, parsed, status: 'PENDING' };
}
export function setNoticeDraftStatus(id, status) {
  getDb().prepare('UPDATE notice_drafts SET status = ? WHERE id = ?').run(status, id);
}

export default getDb;
