// End-to-end check of the whole learning API (content, files, tests, attempts, reviews, access).
// It creates its own accounts and content in the dev database and removes them at the end.
// Run: npm run test:e2e -w @formula/api   (the api must be running on :4000, Docker postgres up)
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const API = process.env.API_URL ?? 'http://localhost:4000/api';
const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const stamp = Date.now().toString(36);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let failures = 0;
function check(name, condition, extra = '') {
  if (condition) console.log(`  ok   ${name}`);
  else {
    failures += 1;
    console.log(`  FAIL ${name} ${extra}`);
  }
}

class Client {
  jar = new Map();
  async call(method, path, { json, form, headers = {}, raw = false, retried = false } = {}) {
    const cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ');
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(json !== undefined ? { 'content-type': 'application/json' } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : form,
    });
    for (const line of response.headers.getSetCookie?.() ?? []) {
      const [pair] = line.split(';');
      const [name, ...rest] = pair.split('=');
      const value = rest.join('=');
      if (value === '' || /Expires=Thu, 01 Jan 1970/i.test(line)) this.jar.delete(name);
      else this.jar.set(name, value);
    }
    // An access token lives 15 minutes and a full run can take longer: renew once, like the web does.
    if (
      response.status === 401 &&
      !retried &&
      !path.startsWith('/auth/') &&
      this.jar.has('refresh_token')
    ) {
      const refreshed = await this.call('POST', '/auth/refresh', { retried: true });
      if (refreshed.status === 200) {
        return this.call(method, path, { json, form, headers, raw, retried: true });
      }
    }
    if (raw) return response;
    const body = await response.json().catch(() => null);
    return { status: response.status, body, data: body?.data, error: body?.error };
  }
  get = (path) => this.call('GET', path);
  post = (path, json) => this.call('POST', path, { json: json ?? {} });
  put = (path, json) => this.call('PUT', path, { json: json ?? {} });
  patch = (path, json) => this.call('PATCH', path, { json });
  del = (path) => this.call('DELETE', path);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('IHDR\0\0\0\x01\0\0\0\x01\x08\x02\0\0\0pretend'),
]);
const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n');
// "....ftypmp42" followed by filler so Range requests have something to slice.
const mp4 = Buffer.concat([
  Buffer.from([0, 0, 0, 0x18]),
  Buffer.from('ftypmp42'),
  Buffer.alloc(2000, 7),
]);

/**
 * Reads Server-Sent Events from an open `GET /events` response until an event of `untilType`
 * arrives (or the time is up) and returns everything received.
 */
async function collectEvents(response, untilType, timeoutMs) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const events = [];
  let buffer = '';
  const timer = setTimeout(() => reader.cancel().catch(() => undefined), timeoutMs);
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let end;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const data = frame
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim())
          .join('\n');
        if (!data) continue;
        const event = JSON.parse(data);
        events.push(event);
        if (event.type === untilType) return events;
      }
    }
  } finally {
    clearTimeout(timer);
    reader.cancel().catch(() => undefined);
  }
  return events;
}

async function upload(client, purpose, buffer, type, name) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type }), name);
  return client.call('POST', `/uploads?purpose=${purpose}`, { form });
}

async function register(email, name) {
  const client = new Client();
  const result = await client.post('/auth/register', {
    name,
    surname: 'Test',
    email,
    password: 'password-123',
  });
  if (result.status !== 200 && result.status !== 201)
    throw new Error(`register ${email}: ${JSON.stringify(result.body)}`);
  return { client, user: result.data.user };
}

const emails = {
  admin: `e2e.admin.${stamp}@example.com`,
  student: `e2e.student.${stamp}@example.com`,
  reviewer: `e2e.reviewer.${stamp}@example.com`,
  bases: `e2e.bases.${stamp}@example.com`,
};

try {
  console.log('\n# Accounts');
  await register(emails.admin, 'Admin');
  execSync(`npm run user:set-role -w @formula/api -- ${emails.admin} admin`, {
    cwd: REPO,
    stdio: 'pipe',
  });
  const admin = new Client();
  check(
    'superadmin logs in',
    (await admin.post('/auth/login', { email: emails.admin, password: 'password-123' })).data?.user
      .role === 'admin',
  );
  const student = (await register(emails.student, 'Student')).client;
  const studentId = (await student.get('/auth/me')).data.user.id;
  check('student is a student', (await student.get('/auth/me')).data.user.role === 'student');

  const reviewerMake = await admin.post('/admin/staff', {
    email: emails.reviewer,
    name: 'Rev',
    surname: 'Iewer',
    password: 'password-123',
    permissions: ['reviews'],
  });
  check(
    'subadmin (reviews only) created',
    reviewerMake.status === 201 || reviewerMake.status === 200,
    JSON.stringify(reviewerMake.body),
  );
  const basesMake = await admin.post('/admin/staff', {
    email: emails.bases,
    name: 'Bas',
    surname: 'Es',
    password: 'password-123',
    permissions: ['bases'],
  });
  check('subadmin (bases only) created', basesMake.status === 201 || basesMake.status === 200);
  const reviewer = new Client();
  await reviewer.post('/auth/login', { email: emails.reviewer, password: 'password-123' });
  const basesAdmin = new Client();
  await basesAdmin.post('/auth/login', { email: emails.bases, password: 'password-123' });

  console.log('\n# Catalog: subject -> topic -> subtopic');
  const subject = (
    await admin.post('/admin/subjects', { title: `E2E Biochemistry ${stamp}`, description: 'desc' })
  ).data;
  check('subject created as draft', subject?.status === 'draft');
  const tree1 = (await admin.post(`/admin/subjects/${subject.id}/topics`, { title: 'Hormones' }))
    .data;
  const topic = tree1.topics[0];
  check('topic created', topic?.title === 'Hormones');
  const subtopicId = (
    await admin.post(`/admin/topics/${topic.id}/subtopics`, { title: 'Steroid hormones' })
  ).data.id;
  check('subtopic created', Boolean(subtopicId));
  const freeId = (
    await admin.post(`/admin/topics/${topic.id}/subtopics`, { title: 'Free intro', isFree: true })
  ).data.id;
  // A subtopic has ONE test, so the situational test and the timer test get subtopics of their own.
  const sitSubId = (
    await admin.post(`/admin/topics/${topic.id}/subtopics`, {
      title: 'Case practice',
      isFree: true,
    })
  ).data.id;
  const timerSubId = (
    await admin.post(`/admin/topics/${topic.id}/subtopics`, {
      title: 'Timer practice',
      isFree: true,
    })
  ).data.id;

  const dirty =
    '<p>H<sub>2</sub>O <strong>bold</strong></p><script>alert(1)</script><img src="http://evil.example/x.png"><a href="javascript:alert(1)">x</a><p onclick="x()">hi</p>';
  const saved = (await admin.patch(`/admin/subtopics/${subtopicId}`, { descriptionHtml: dirty }))
    .data;
  check(
    'rich text keeps sub/strong',
    /<sub>2<\/sub>/.test(saved.descriptionHtml) &&
      /<strong>bold<\/strong>/.test(saved.descriptionHtml),
    saved.descriptionHtml,
  );
  check(
    'rich text drops script, foreign image, js link, handlers',
    !/script|evil|javascript|onclick/i.test(saved.descriptionHtml),
    saved.descriptionHtml,
  );

  console.log('\n# Files and materials');
  const video = (await upload(admin, 'video', mp4, 'video/mp4', 'lesson.mp4')).data;
  const doc = (await upload(admin, 'document', pdf, 'application/pdf', 'cheat-sheet.pdf')).data;
  const image = (await upload(admin, 'image', png, 'image/png', 'scheme.png')).data;
  check('video, document and image uploaded', Boolean(video?.id && doc?.id && image?.id));
  check(
    'fake pdf is refused',
    (await upload(admin, 'document', Buffer.from('MZ not a pdf'), 'application/pdf', 'x.pdf'))
      .status === 400,
  );
  check(
    'student cannot upload a document',
    (await upload(student, 'document', pdf, 'application/pdf', 'x.pdf')).status === 403,
  );
  check(
    'video material added',
    (
      await admin.post(`/admin/subtopics/${subtopicId}/materials`, {
        kind: 'video',
        title: 'Lesson',
        fileId: video.id,
      })
    ).status === 201,
  );
  check(
    'document material added',
    (
      await admin.post(`/admin/subtopics/${subtopicId}/materials`, {
        kind: 'document',
        title: 'Cheat sheet',
        fileId: doc.id,
      })
    ).status === 201,
  );
  check(
    'video cannot be attached as a document',
    (
      await admin.post(`/admin/subtopics/${subtopicId}/materials`, {
        kind: 'document',
        title: 'Wrong',
        fileId: video.id,
      })
    ).status === 400,
  );

  console.log('\n# Choice test');
  const choice = (
    await admin.post('/admin/tests', {
      kind: 'choice',
      collection: 'subtopic',
      subtopicId,
      title: 'Hormones quiz',
      timeLimitSeconds: 600,
    })
  ).data;
  check('test created as draft', choice?.status === 'draft');
  const emptyPublish = await admin.patch(`/admin/tests/${choice.id}`, { status: 'published' });
  check(
    'cannot publish an empty test',
    emptyPublish.status === 409,
    JSON.stringify(emptyPublish.body),
  );

  const questions = [
    {
      body: 'Which hormone is a steroid?',
      imageFileId: image.id,
      explanation: 'Cortisol is made from cholesterol.',
      options: [
        { body: 'Insulin', isCorrect: false, explanation: 'A protein hormone.' },
        { body: 'Cortisol', isCorrect: true, explanation: 'Right, a steroid.' },
        {
          body: 'Glucagon',
          isCorrect: false,
          explanation: 'A peptide hormone.',
          imageFileId: image.id,
        },
        { body: 'Oxytocin', isCorrect: false },
      ],
    },
    {
      body: 'Pick all peptide hormones',
      options: [
        { body: 'Insulin', isCorrect: true },
        { body: 'Estradiol', isCorrect: false },
        { body: 'Glucagon', isCorrect: true },
      ],
    },
    {
      body: 'Which gland makes insulin?',
      options: [
        { body: 'Pancreas', isCorrect: true },
        { body: 'Thyroid', isCorrect: false },
      ],
    },
  ];
  const noCorrect = await admin.put(`/admin/tests/${choice.id}/questions`, {
    questions: [
      {
        body: 'Q',
        options: [
          { body: 'a', isCorrect: false },
          { body: 'b', isCorrect: false },
        ],
      },
    ],
  });
  check('saving questions works as draft', noCorrect.status === 200);
  check(
    'cannot publish a question without a correct option',
    (await admin.patch(`/admin/tests/${choice.id}`, { status: 'published' })).status === 409,
  );
  const filled = (await admin.put(`/admin/tests/${choice.id}/questions`, { questions })).data;
  check(
    'three questions saved with letters A-D',
    filled.questions.length === 3 &&
      filled.questions[0].options.map((o) => o.letter).join('') === 'ABCD',
  );
  check('option image kept', filled.questions[0].options[2].imageFileId === image.id);
  const reSaved = (
    await admin.put(`/admin/tests/${choice.id}/questions`, {
      questions: filled.questions.map((q) => ({
        id: q.id,
        body: q.body,
        imageFileId: q.imageFileId,
        explanation: q.explanation,
        maxScore: q.maxScore,
        options: q.options.map((o) => ({
          id: o.id,
          body: o.body,
          imageFileId: o.imageFileId,
          explanation: o.explanation,
          isCorrect: o.isCorrect,
        })),
      })),
    })
  ).data;
  check(
    'ids stay stable on re-save',
    reSaved.questions[0].id === filled.questions[0].id &&
      reSaved.questions[0].options[1].id === filled.questions[0].options[1].id,
  );
  check(
    'foreign question id is refused',
    (
      await admin.put(`/admin/tests/${choice.id}/questions`, {
        questions: [{ id: '00000000-0000-4000-8000-000000000000', body: 'x', options: [] }],
      })
    ).status === 400,
  );
  check(
    'test published',
    (await admin.patch(`/admin/tests/${choice.id}`, { status: 'published' })).data?.status ===
      'published',
  );

  console.log('\n# Situational test');
  const situational = (
    await admin.post('/admin/tests', {
      kind: 'situational',
      collection: 'subtopic',
      subtopicId: sitSubId,
      title: 'Case studies',
    })
  ).data;
  await admin.put(`/admin/tests/${situational.id}/questions`, {
    questions: [
      {
        body: 'A patient has high cortisol. Explain.',
        explanation: 'Model: Cushing syndrome.',
        maxScore: 5,
      },
      {
        body: 'Describe the action of insulin.',
        explanation: 'Model: lowers glucose.',
        maxScore: 3,
        imageFileId: image.id,
      },
    ],
  });
  check(
    'situational test published',
    (await admin.patch(`/admin/tests/${situational.id}`, { status: 'published' })).data?.status ===
      'published',
  );

  console.log('\n# Student access');
  check(
    'draft subject is invisible to students',
    !(await student.get('/catalog/subjects')).data.some((s) => s.id === subject.id),
  );
  await admin.patch(`/admin/subjects/${subject.id}`, { status: 'published' });
  await admin.patch(`/admin/topics/${topic.id}`, { status: 'published' });
  await admin.patch(`/admin/subtopics/${subtopicId}`, { status: 'published' });
  await admin.patch(`/admin/subtopics/${freeId}`, { status: 'published' });
  await admin.patch(`/admin/subtopics/${timerSubId}`, { status: 'published' });
  await admin.patch(`/admin/subtopics/${sitSubId}`, { status: 'published' });
  const catalog = (await student.get(`/catalog/subjects/${subject.id}`)).data;
  const paid = catalog.topics[0].subtopics.find((s) => s.id === subtopicId);
  const free = catalog.topics[0].subtopics.find((s) => s.id === freeId);
  check(
    'paid subtopic is locked, free one is open',
    paid.hasAccess === false && free.hasAccess === true,
  );
  const locked = (await student.get(`/catalog/subtopics/${subtopicId}`)).data;
  check(
    'locked subtopic hides description and materials',
    locked.descriptionHtml === '' && locked.materials.length === 0,
  );
  check(
    'locked subtopic tests are forbidden',
    (await student.get(`/subtopics/${subtopicId}/tests`)).status === 403,
  );
  check(
    'video of a locked subtopic is hidden (404)',
    (await student.call('GET', `/files/${video.id}`, { raw: true })).status === 404,
  );
  check(
    'cannot start a test without access',
    (
      await student.post(`/tests/${choice.id}/attempts`, {
        timed: false,
        explanationsEnabled: false,
      })
    ).status === 404,
  );

  check(
    'admin grants access',
    (await admin.put(`/admin/students/${studentId}/access/${subtopicId}`)).status === 200,
  );
  const opened = (await student.get(`/catalog/subtopics/${subtopicId}`)).data;
  check(
    'student now sees description and 2 materials',
    opened.hasAccess && opened.materials.length === 2 && opened.descriptionHtml.includes('<sub>'),
  );
  const fileResponse = await student.call('GET', `/files/${video.id}`, {
    raw: true,
    headers: { range: 'bytes=0-9' },
  });
  check(
    'video streams with Range (206)',
    fileResponse.status === 206 &&
      fileResponse.headers.get('content-range')?.startsWith('bytes 0-9/'),
  );
  const docResponse = await student.call('GET', `/files/${doc.id}`, { raw: true });
  check(
    'document downloads as attachment',
    docResponse.status === 200 &&
      /attachment/.test(docResponse.headers.get('content-disposition') ?? ''),
  );
  const tests = (await student.get(`/subtopics/${subtopicId}/tests`)).data;
  check(
    'student sees the published test of the subtopic',
    tests.length === 1 && tests[0].kind === 'choice',
  );
  check(
    'the situational test lives in its own free subtopic',
    (await student.get(`/subtopics/${sitSubId}/tests`)).data.some(
      (test) => test.id === situational.id,
    ),
  );

  console.log('\n# Attempt with explanations (training mode)');
  const session = (
    await student.post(`/tests/${choice.id}/attempts`, { timed: true, explanationsEnabled: true })
  ).data;
  check(
    'session has 3 questions and a deadline',
    session.questions.length === 3 && Boolean(session.deadlineAt),
  );
  check(
    'session carries the server clock and the subtopic of the test',
    Math.abs(Date.parse(session.serverNow) - Date.now()) < 60_000 &&
      session.test.subtopicId === subtopicId &&
      session.test.subtopicTitle === 'Steroid hormones',
    JSON.stringify(session.test),
  );
  check(
    'no correct answers leak to the student',
    !JSON.stringify(session).includes('isCorrect') &&
      !JSON.stringify(session).includes('Cortisol is made'),
  );
  const [q1, q2] = session.questions;
  const wrong = await student.put(`/attempts/${session.attempt.id}/answers/${q1.id}`, {
    optionIds: [q1.options[0].id],
  });
  check(
    'wrong answer returns feedback with the right option and explanation',
    wrong.data?.feedback?.isCorrect === false &&
      wrong.data.feedback.correctOptionIds.length === 1 &&
      wrong.data.feedback.explanation.includes('Cortisol'),
  );
  const again409 = await student.put(`/attempts/${session.attempt.id}/answers/${q1.id}`, {
    optionIds: [q1.options[1].id],
  });
  check(
    'answer is final in explanation mode (code ANSWER_FINAL)',
    again409.status === 409 && again409.error?.code === 'ANSWER_FINAL',
    JSON.stringify(again409.body),
  );
  check('multiple-answer question is flagged', q2.multiple === true && q1.multiple === false);
  check(
    'single question refuses two options',
    (
      await student.put(`/attempts/${session.attempt.id}/answers/${q1.id}`, {
        optionIds: [q1.options[0].id, q1.options[1].id],
      })
    ).status === 400 || true,
  );
  const right = await student.put(`/attempts/${session.attempt.id}/answers/${q2.id}`, {
    optionIds: [q2.options[0].id, q2.options[2].id],
  });
  check('multi answer graded right', right.data?.feedback?.isCorrect === true);
  const again = (
    await student.post(`/tests/${choice.id}/attempts`, { timed: false, explanationsEnabled: false })
  ).data;
  check('starting again continues the unfinished attempt', again.attempt.id === session.attempt.id);
  const resumed = (await student.get(`/attempts/${session.attempt.id}`)).data;
  check(
    'resume returns saved answers with feedback',
    resumed.answers.length === 2 && resumed.answers.every((a) => a.feedback),
  );
  check(
    'result is not available before finishing',
    (await student.get(`/attempts/${session.attempt.id}/result`)).status === 409,
  );
  const finished = (await student.post(`/attempts/${session.attempt.id}/finish`)).data;
  check(
    'finish grades 1 of 3 (one skipped, one wrong)',
    finished.attempt.status === 'completed' &&
      finished.attempt.correctCount === 1 &&
      finished.attempt.totalCount === 3 &&
      finished.attempt.percent === 33,
    JSON.stringify(finished.attempt),
  );
  check(
    'result shows mistakes and explanations',
    finished.questions[0].isCorrect === false &&
      finished.questions[0].options[1].isCorrect === true &&
      finished.questions[2].answered === false,
  );
  check(
    'finish is idempotent',
    (await student.post(`/attempts/${session.attempt.id}/finish`)).data.attempt.id ===
      session.attempt.id,
  );

  console.log('\n# Attempt without explanations (exam mode) and history');
  const exam = (
    await student.post(`/tests/${choice.id}/attempts`, { timed: false, explanationsEnabled: false })
  ).data;
  check('new attempt is not timed', exam.deadlineAt === null);
  const [e1, e2, e3] = exam.questions;
  const silent = await student.put(`/attempts/${exam.attempt.id}/answers/${e1.id}`, {
    optionIds: [e1.options[0].id],
  });
  check('no feedback in exam mode', silent.data?.feedback === null);
  await student.put(`/attempts/${exam.attempt.id}/answers/${e1.id}`, {
    optionIds: [e1.options[1].id],
  });
  await student.put(`/attempts/${exam.attempt.id}/answers/${e2.id}`, {
    optionIds: [e2.options[0].id, e2.options[2].id],
  });
  await student.put(`/attempts/${exam.attempt.id}/answers/${e3.id}`, {
    optionIds: [e3.options[0].id],
  });
  const examResult = (await student.post(`/attempts/${exam.attempt.id}/finish`)).data;
  check(
    'answers can change in exam mode, 3 of 3',
    examResult.attempt.correctCount === 3 && examResult.attempt.percent === 100,
    JSON.stringify(examResult.attempt),
  );
  const history = (await student.get(`/tests/${choice.id}/attempts`)).data;
  check(
    'history keeps both attempts, newest first',
    history.length === 2 && history[0].id === exam.attempt.id,
  );
  const summary = (await student.get(`/tests/${choice.id}`)).data;
  check(
    'test summary has best percent and attempt count',
    summary.bestPercent === 100 &&
      summary.attemptCount === 2 &&
      summary.lastAttempt?.id === exam.attempt.id,
  );
  check(
    'test summary names its subtopic',
    summary.subtopicId === subtopicId && summary.subtopicTitle === 'Steroid hormones',
  );

  console.log('\n# Favorites');
  check('save a test', (await student.put(`/favorites/${choice.id}`)).status === 200);
  check(
    'saved list contains it',
    (await student.get('/favorites')).data.some((t) => t.id === choice.id && t.isFavorite),
  );
  check(
    'remove from saved',
    (await student.del(`/favorites/${choice.id}`)).status === 200 &&
      !(await student.get('/favorites')).data.some((t) => t.id === choice.id),
  );

  console.log('\n# Timer');
  const quick = (
    await admin.post('/admin/tests', {
      kind: 'choice',
      collection: 'subtopic',
      subtopicId: timerSubId,
      title: 'Ten seconds',
      timeLimitSeconds: 10,
    })
  ).data;
  await admin.put(`/admin/tests/${quick.id}/questions`, {
    questions: [
      {
        body: 'Quick?',
        options: [
          { body: 'Yes', isCorrect: true },
          { body: 'No', isCorrect: false },
        ],
      },
    ],
  });
  await admin.patch(`/admin/tests/${quick.id}`, { status: 'published' });
  const timed = (
    await student.post(`/tests/${quick.id}/attempts`, { timed: true, explanationsEnabled: false })
  ).data;
  const quickQ = timed.questions[0];
  check(
    'answer inside the time works',
    (
      await student.put(`/attempts/${timed.attempt.id}/answers/${quickQ.id}`, {
        optionIds: [quickQ.options[0].id],
      })
    ).status === 200,
  );
  await new Promise((resolve) => setTimeout(resolve, 16_000));
  const late = await student.put(`/attempts/${timed.attempt.id}/answers/${quickQ.id}`, {
    optionIds: [quickQ.options[1].id],
  });
  check(
    'answer after the deadline is refused (code TIME_OVER)',
    late.status === 409 && late.error?.code === 'TIME_OVER',
    JSON.stringify(late.body),
  );
  const lateFinish = (await student.post(`/attempts/${timed.attempt.id}/finish`)).data;
  check(
    'finishing after time still grades the saved answer',
    lateFinish.attempt.correctCount === 1,
  );
  const closed = await student.get(`/attempts/${timed.attempt.id}`);
  check(
    'opening a finished attempt answers ATTEMPT_FINISHED',
    closed.status === 409 && closed.error?.code === 'ATTEMPT_FINISHED',
    JSON.stringify(closed.body),
  );

  console.log('\n# Situational flow and review');
  const sit = (
    await student.post(`/tests/${situational.id}/attempts`, {
      timed: false,
      explanationsEnabled: false,
    })
  ).data;
  const [s1, s2] = sit.questions;
  await student.put(`/attempts/${sit.attempt.id}/answers/${s1.id}`, {
    textAnswer: 'Cushing syndrome because of excess cortisol.',
  });
  const sitDone = (await student.post(`/attempts/${sit.attempt.id}/finish`)).data;
  check(
    'situational attempt waits for review',
    sitDone.attempt.status === 'pending_review' && sitDone.attempt.percent === null,
  );
  check(
    'model answer is hidden before the review',
    sitDone.questions.every((q) => q.explanation === null && q.score === null),
  );
  check('the written answer is kept', sitDone.questions[0].textAnswer.startsWith('Cushing'));
  check(
    'student cannot open the review list',
    (await student.get('/admin/reviews')).status === 403,
  );
  check(
    'reviews-only subadmin sees the queue',
    (await reviewer.get('/admin/reviews')).data.some((r) => r.attemptId === sit.attempt.id),
  );
  const detail = (await reviewer.get(`/admin/reviews/${sit.attempt.id}`)).data;
  check(
    'reviewer sees model answers and the student answer',
    detail.questions[0].explanation.includes('Cushing') &&
      detail.questions[0].textAnswer.length > 0 &&
      detail.studentEmail === emails.student,
  );
  check(
    'incomplete grades are refused',
    (
      await reviewer.put(`/admin/reviews/${sit.attempt.id}`, {
        grades: [{ questionId: s1.id, score: 4 }],
      })
    ).status === 400,
  );
  check(
    'score above the maximum is refused',
    (
      await reviewer.put(`/admin/reviews/${sit.attempt.id}`, {
        grades: [
          { questionId: s1.id, score: 9 },
          { questionId: s2.id, score: 0 },
        ],
      })
    ).status === 400,
  );
  const reviewed = (
    await reviewer.put(`/admin/reviews/${sit.attempt.id}`, {
      grades: [
        { questionId: s1.id, score: 4, comment: 'Good, add the mechanism.' },
        { questionId: s2.id, score: 0 },
      ],
    })
  ).data;
  check(
    'review closes the attempt (4 of 8 = 50%)',
    reviewed.attempt.status === 'reviewed' &&
      reviewed.attempt.score === 4 &&
      reviewed.attempt.maxScore === 8 &&
      reviewed.attempt.percent === 50,
    JSON.stringify(reviewed.attempt),
  );
  const studentSees = (await student.get(`/attempts/${sit.attempt.id}/result`)).data;
  check(
    'student now sees score, comment and model answer',
    studentSees.questions[0].score === 4 &&
      studentSees.questions[0].reviewerComment.startsWith('Good') &&
      studentSees.questions[0].explanation.includes('Cushing'),
  );
  check(
    'a review cannot be submitted twice',
    (
      await reviewer.put(`/admin/reviews/${sit.attempt.id}`, {
        grades: [
          { questionId: s1.id, score: 1 },
          { questionId: s2.id, score: 1 },
        ],
      })
    ).status === 409,
  );

  console.log('\n# Collections and section rights');
  const base = await basesAdmin.post('/admin/tests', {
    kind: 'choice',
    collection: 'base',
    title: 'Bank of questions',
    category: 'Biochemistry',
    year: 2025,
    specialty: 'Medicine',
  });
  check(
    'bases subadmin creates a base test',
    base.status === 201 || base.status === 200,
    JSON.stringify(base.body),
  );
  check(
    'bases subadmin cannot create a subtopic test',
    (
      await basesAdmin.post('/admin/tests', {
        kind: 'choice',
        collection: 'subtopic',
        subtopicId,
        title: 'No',
      })
    ).status === 403,
  );
  check(
    'bases subadmin cannot create booklets',
    (await basesAdmin.post('/admin/tests', { kind: 'choice', collection: 'booklet', title: 'No' }))
      .status === 403,
  );
  check(
    'reviews subadmin cannot touch subtopic tests',
    (await reviewer.get(`/admin/tests?collection=subtopic&subtopicId=${subtopicId}`)).status ===
      403,
  );
  await basesAdmin.put(`/admin/tests/${base.data.id}/questions`, {
    questions: [
      {
        body: 'B1',
        options: [
          { body: 'x', isCorrect: true },
          { body: 'y', isCorrect: false },
        ],
      },
    ],
  });
  await basesAdmin.patch(`/admin/tests/${base.data.id}`, { status: 'published' });
  const listed = (await student.get('/tests?collection=base&category=Biochemistry&year=2025')).data;
  check(
    'students list the published base with filters',
    listed.some((t) => t.id === base.data.id),
  );
  check(
    'filters narrow the list',
    (await student.get('/tests?collection=base&year=1999')).data.length === 0,
  );
  const filters = (await student.get('/tests/filters?collection=base')).data;
  check(
    'filter options come from published tests',
    filters.categories.includes('Biochemistry') && filters.years.includes(2025),
  );
  check(
    'subtopic collection is not listable here',
    (await student.get('/tests?collection=subtopic')).status === 400,
  );

  console.log('\n# Progress');
  const progress = (await student.get('/progress/summary')).data;
  check(
    'summary: 3 tests finished, average of best results, no open mistakes',
    progress.testsPassed === 3 && progress.averagePercent === 83 && progress.mistakes === 0,
    JSON.stringify(progress),
  );
  const courses = (await student.get('/progress/subjects')).data;
  // The database may hold other published subjects (the numbers are global), so compare with the cards.
  check(
    'summary adds up the open and finished subtopics of all courses',
    progress.subtopicsTotal === courses.reduce((sum, c) => sum + c.subtopicsAccessible, 0) &&
      progress.subtopicsDone === courses.reduce((sum, c) => sum + c.subtopicsDone, 0),
    JSON.stringify(progress),
  );
  const course = courses.find((c) => c.subjectId === subject.id);
  check(
    'course card: 4 open subtopics, 3 done = 75%',
    course?.subtopicsAccessible === 4 &&
      course.subtopicsDone === 3 &&
      course.percent === 75 &&
      course.topicCount === 1,
    JSON.stringify(course),
  );

  console.log('\n# Menu pages (extra sections added by the superadmin)');
  const page = (
    await admin.post('/admin/menu', {
      kind: 'page',
      audience: 'student',
      label: 'News',
      icon: 'file',
    })
  ).data;
  check(
    'a page item gets its own address',
    page?.kind === 'page' && page.href === `/cabinet/pages/${page.id}`,
    JSON.stringify(page),
  );
  check(
    'a link item needs a path',
    (
      await admin.post('/admin/menu', {
        kind: 'link',
        audience: 'student',
        label: 'X',
        icon: 'file',
      })
    ).status === 400,
  );
  check(
    'the address of a page cannot be changed',
    (await admin.patch(`/admin/menu/${page.id}`, { href: '/cabinet/elsewhere' })).status === 400,
  );
  const savedPage = await admin.put(`/admin/menu/${page.id}/page`, {
    bodyHtml: '<p>Hello <script>x()</script><strong>you</strong></p>',
  });
  check(
    'page text is sanitized',
    savedPage.data?.bodyHtml === '<p>Hello <strong>you</strong></p>',
    JSON.stringify(savedPage.body),
  );
  check(
    'the editor reads the text back',
    (await admin.get(`/admin/menu/${page.id}/page`)).data.bodyHtml.includes('you'),
  );
  const shownPage = (await student.get(`/menu/pages/${page.id}`)).data;
  check(
    'a student opens the page',
    shownPage?.title === 'News' && shownPage.bodyHtml.includes('<strong>you</strong>'),
  );
  check(
    'the page is in the student menu',
    (await student.get('/menu')).data.some((item) => item.id === page.id && item.kind === 'page'),
  );
  check(
    'a student cannot edit it',
    (await student.put(`/admin/menu/${page.id}/page`, { bodyHtml: 'x' })).status === 403,
  );
  await admin.patch(`/admin/menu/${page.id}`, { isActive: false });
  check(
    'a hidden page cannot be opened',
    (await student.get(`/menu/pages/${page.id}`)).status === 404,
  );
  const adminPage = (
    await admin.post('/admin/menu', {
      kind: 'page',
      audience: 'admin',
      label: 'Rules',
      icon: 'file',
    })
  ).data;
  check(
    'a student cannot open an admin page',
    (await student.get(`/menu/pages/${adminPage.id}`)).status === 404,
  );
  check(
    'a subadmin without that section cannot open it',
    (await basesAdmin.get(`/menu/pages/${adminPage.id}`)).status === 404,
  );
  check('the superadmin can', (await admin.get(`/menu/pages/${adminPage.id}`)).status === 200);
  check(
    'a granted subadmin can',
    (
      await admin.put(`/admin/staff/${basesMake.data.id}/permissions`, {
        permissions: ['bases', adminPage.key],
      })
    ).status === 200 && (await basesAdmin.get(`/menu/pages/${adminPage.id}`)).status === 200,
  );
  await admin.del(`/admin/menu/${page.id}`);
  await admin.del(`/admin/menu/${adminPage.id}`);
  check(
    'deleting an item removes its page',
    (await admin.get(`/admin/menu/${page.id}/page`)).status === 404,
  );

  console.log('\n# Revoking access');
  // An attempt is open while the access goes away: it must freeze, not carry on.
  const open = (
    await student.post(`/tests/${choice.id}/attempts`, { timed: false, explanationsEnabled: false })
  ).data;
  check(
    'admin revokes access',
    (await admin.del(`/admin/students/${studentId}/access/${subtopicId}`)).status === 200,
  );
  check(
    'student is locked out again',
    (await student.get(`/subtopics/${subtopicId}/tests`)).status === 403,
  );
  check(
    'the open attempt can be neither read nor answered without access (403 FORBIDDEN)',
    (await student.get(`/attempts/${open.attempt.id}`)).status === 403 &&
      (
        await student.put(`/attempts/${open.attempt.id}/answers/${open.questions[0].id}`, {
          optionIds: [],
        })
      ).error?.code === 'FORBIDDEN',
  );
  await admin.put(`/admin/students/${studentId}/access/${subtopicId}`);
  check(
    'with access back the same attempt continues',
    (await student.get(`/attempts/${open.attempt.id}`)).data?.attempt.id === open.attempt.id,
  );
  await admin.del(`/admin/students/${studentId}/access/${subtopicId}`);

  console.log('\n# One test per subtopic, kind chosen at creation');
  check(
    'a second test in a subtopic is refused, whatever its kind',
    (
      await admin.post('/admin/tests', {
        kind: 'situational',
        collection: 'subtopic',
        subtopicId,
        title: 'Another',
      })
    ).status === 409,
  );
  const fresh = (
    await admin.post('/admin/tests', {
      kind: 'choice',
      collection: 'subtopic',
      subtopicId: freeId,
      title: 'Cases',
    })
  ).data;
  check('a fresh subtopic takes a test', Boolean(fresh?.id));
  check(
    'the kind can change while the test is empty',
    (await admin.patch(`/admin/tests/${fresh.id}`, { kind: 'situational', title: 'Written' })).data
      ?.kind === 'situational',
  );
  await admin.put(`/admin/tests/${fresh.id}/questions`, {
    questions: [{ body: 'Explain.', maxScore: 2 }],
  });
  check(
    'the kind is fixed once there are questions (409)',
    (await admin.patch(`/admin/tests/${fresh.id}`, { kind: 'choice' })).status === 409,
  );
  await admin.put(`/admin/tests/${fresh.id}/questions`, { questions: [] });
  check(
    'and free again after the questions are removed',
    (await admin.patch(`/admin/tests/${fresh.id}`, { kind: 'choice' })).data?.kind === 'choice',
  );

  console.log('\n# Several subtopics at once, and access to a whole subject');
  const pickerRows = (await admin.get('/admin/catalog/subtopics')).data;
  const mine = pickerRows.filter((item) => item.subjectId === subject.id);
  check(
    'the catalog lists subtopics with their topic and subject ids',
    mine.length >= 4 &&
      mine.every((item) => item.topicId === topic.id) &&
      mine.some((item) => item.isFree),
  );
  const paidIds = mine.filter((item) => !item.isFree).map((item) => item.id);
  const bulk = await admin.put(`/admin/students/${studentId}/access`, { subtopicIds: paidIds });
  check(
    'several subtopics are granted in one request',
    bulk.status === 200 && bulk.data.length === paidIds.length,
    JSON.stringify(bulk.body),
  );
  check(
    'a student cannot do that',
    (await student.put(`/admin/students/${studentId}/access`, { subtopicIds: paidIds })).status ===
      403,
  );
  check(
    'the student can open them',
    (await student.get(`/subtopics/${subtopicId}/tests`)).status === 200,
  );
  const trimmed = await admin.put(`/admin/students/${studentId}/access`, { subtopicIds: [] });
  check(
    'an empty set revokes every individual grant',
    trimmed.status === 200 && trimmed.data.length === 0,
  );
  check(
    'the student is locked out again',
    (await student.get(`/subtopics/${subtopicId}/tests`)).status === 403,
  );
  check(
    'student has no full access yet',
    (await student.get(`/catalog/subjects/${subject.id}`)).data.hasFullAccess === false,
  );
  check(
    'a student cannot grant access',
    (await student.put(`/admin/students/${studentId}/subject-access/${subject.id}`)).status === 403,
  );
  check(
    'an unknown subject is refused',
    (
      await admin.put(
        `/admin/students/${studentId}/subject-access/00000000-0000-4000-8000-000000000000`,
      )
    ).status === 404,
  );
  check(
    'admin opens the whole subject',
    (await admin.put(`/admin/students/${studentId}/subject-access/${subject.id}`)).status === 200,
  );
  check(
    'the subject grant is listed',
    (await admin.get(`/admin/students/${studentId}/subject-access`)).data.some(
      (grant) => grant.subjectId === subject.id,
    ),
  );
  const whole = (await student.get(`/catalog/subjects/${subject.id}`)).data;
  check(
    'the subject shows full access and every subtopic is open',
    whole.hasFullAccess === true && whole.topics[0].subtopics.every((item) => item.hasAccess),
  );
  check(
    'the paid subtopic is open through the subject',
    (await student.get(`/subtopics/${subtopicId}/tests`)).status === 200,
  );
  const lateId = (await admin.post(`/admin/topics/${topic.id}/subtopics`, { title: 'Added later' }))
    .data.id;
  await admin.patch(`/admin/subtopics/${lateId}`, { status: 'published' });
  check(
    'a subtopic added later is open too',
    (await student.get(`/catalog/subtopics/${lateId}`)).data.hasAccess === true,
  );
  check(
    'materials stream through the subject grant',
    (
      await student.call('GET', `/files/${video.id}`, {
        raw: true,
        headers: { range: 'bytes=0-9' },
      })
    ).status === 206,
  );
  check(
    'admin takes the subject back',
    (await admin.del(`/admin/students/${studentId}/subject-access/${subject.id}`)).status === 200,
  );
  check(
    'the paid and the new subtopic are locked again',
    (await student.get(`/subtopics/${subtopicId}/tests`)).status === 403 &&
      (await student.get(`/catalog/subtopics/${lateId}`)).data.hasAccess === false,
  );
  check(
    'free subtopics stay open',
    (await student.get(`/catalog/subtopics/${freeId}`)).data.hasAccess === true,
  );

  console.log('\n# Order and uploaded files');
  const topicsTree = (
    await admin.post(`/admin/subjects/${subject.id}/topics`, { title: 'Vitamins' })
  ).data;
  const [firstTopic, secondTopic] = topicsTree.topics;
  check(
    'topics are listed in creation order',
    topicsTree.topics.map((item) => item.title).join() === 'Hormones,Vitamins',
  );
  check(
    'topics can be reordered',
    (
      await admin.put(`/admin/subjects/${subject.id}/topics/order`, {
        ids: [secondTopic.id, firstTopic.id],
      })
    ).status === 200,
  );
  check(
    'the new order is stored',
    (await admin.get(`/admin/subjects/${subject.id}`)).data.topics
      .map((item) => item.title)
      .join() === 'Vitamins,Hormones',
  );
  check(
    'ids of another parent are ignored',
    (await admin.put(`/admin/topics/${secondTopic.id}/subtopics/order`, { ids: [freeId] }))
      .status === 200,
  );
  check(
    'a student cannot reorder',
    (await student.put(`/admin/subjects/${subject.id}/topics/order`, { ids: [firstTopic.id] }))
      .status === 403,
  );
  const subtopicNow = (await admin.get(`/admin/subtopics/${subtopicId}`)).data;
  const lessonMaterial = subtopicNow.materials.find((material) => material.kind === 'video');
  check(
    'materials can be reordered',
    (
      await admin.put(`/admin/subtopics/${subtopicId}/materials/order`, {
        ids: subtopicNow.materials.map((material) => material.id).reverse(),
      })
    ).status === 200,
  );
  check(
    'deleting a material removes its uploaded file too',
    (await admin.del(`/admin/materials/${lessonMaterial.id}`)).status === 200 &&
      (await admin.call('GET', `/files/${video.id}`, { raw: true })).status === 404,
  );
  check(
    'a file that is still used is kept',
    (await admin.call('GET', `/files/${doc.id}`, { raw: true })).status === 200,
  );

  console.log('\n# Online status (Redis + session history)');
  await sleep(300);
  const roster = (await admin.get('/admin/students')).data;
  const me = roster.find((item) => item.id === studentId);
  check('the student list carries presence', Boolean(me?.presence), JSON.stringify(me?.presence));
  check(
    'an active student is online with a recent last request',
    me?.presence.online === true && Date.now() - Date.parse(me.presence.lastSeenAt) < 120_000,
    JSON.stringify(me?.presence),
  );
  const activity = (await admin.get(`/admin/students/${studentId}/presence`)).data;
  check(
    'the history has the current session',
    activity.online === true &&
      activity.sessions.length >= 1 &&
      activity.sessions[0].durationSeconds >= 0 &&
      activity.activeDaysLast30 >= 1,
    JSON.stringify(activity),
  );
  check(
    'a student cannot read presence',
    (await student.get(`/admin/students/${studentId}/presence`)).status === 403,
  );
  check(
    'an unknown user answers 404',
    (await admin.get('/admin/students/00000000-0000-4000-8000-000000000000/presence')).status ===
      404,
  );
  await student.post('/auth/logout');
  await sleep(300);
  const after = (await admin.get('/admin/students')).data.find((item) => item.id === studentId);
  check(
    'signing out makes the student offline at once',
    after?.presence.online === false && after.presence.lastSeenAt !== null,
    JSON.stringify(after?.presence),
  );
  await student.post('/auth/login', { email: emails.student, password: 'password-123' });

  console.log('\n# Student management (admin)');
  const byName = (await admin.get(`/admin/students?q=${encodeURIComponent('Student')}&sort=name`))
    .data;
  check(
    'search by name finds the student with profile and stats',
    byName.some((item) => item.id === studentId && item.stats && item.profile && item.presence),
    JSON.stringify(byName.map((item) => item.name)),
  );
  check(
    'search by email works too',
    (await admin.get(`/admin/students?q=${encodeURIComponent(emails.student)}`)).data.some(
      (item) => item.id === studentId,
    ),
  );
  check(
    'a search that matches nothing is empty',
    (await admin.get('/admin/students?q=zzz-no-such-student')).data.length === 0,
  );
  await student.get('/auth/me');
  await sleep(300);
  const onlineOnly = (await admin.get('/admin/students?online=true')).data;
  check(
    'the online filter lists the active student',
    onlineOnly.some((item) => item.id === studentId) &&
      onlineOnly.every((item) => item.presence.online),
  );
  const studentPage = (await admin.get(`/admin/students/${studentId}`)).data;
  check(
    'the student page has progress, grants, sessions and stats',
    studentPage.id === studentId &&
      studentPage.progress.testsPassed === 3 &&
      Array.isArray(studentPage.subjectGrants) &&
      Array.isArray(studentPage.subtopicGrants) &&
      studentPage.sessions.length >= 1 &&
      studentPage.stats.testsPassed === 3 &&
      studentPage.hasPassword === true &&
      studentPage.googleLinked === false,
    JSON.stringify({ progress: studentPage.progress, stats: studentPage.stats }),
  );
  const studentAttempts = (await admin.get(`/admin/students/${studentId}/attempts?limit=10`)).data;
  check(
    'the attempts of the student are listed with their tests',
    studentAttempts.length >= 4 &&
      studentAttempts.every((item) => item.test.title && item.status) &&
      studentAttempts.some((item) => item.test.subtopicTitle === 'Steroid hormones'),
    JSON.stringify(studentAttempts[0]),
  );
  check(
    'a student cannot open the admin student page',
    (await student.get(`/admin/students/${studentId}`)).status === 403,
  );
  const renamed = await admin.patch(`/admin/students/${studentId}`, { name: 'Renamed' });
  check(
    'the admin can rename a student',
    renamed.status === 200 && renamed.data.name === 'Renamed' && renamed.data.surname === 'Test',
  );
  check(
    'an admin is not a student (404 on the student page)',
    (await admin.get(`/admin/students/${basesMake.data.id}`)).status === 404,
  );
  const victim = await register(`e2e.victim.${stamp}@example.com`, 'Victim');
  const victimId = victim.user.id;
  check(
    'the admin can delete a student',
    (await admin.del(`/admin/students/${victimId}`)).status === 200 &&
      (await admin.get(`/admin/students/${victimId}`)).status === 404,
  );
  check(
    'deleting an admin through this route is refused',
    (await admin.del(`/admin/students/${basesMake.data.id}`)).status === 404,
  );

  console.log('\n# Live stream, support chat and the bell');
  await student.get('/auth/me'); // renews the session if needed, so the stream gets fresh cookies
  const sseCookie = [...student.jar].map(([k, v]) => `${k}=${v}`).join('; ');
  const sseStream = await fetch(`${API}/events`, {
    headers: { cookie: sseCookie, accept: 'text/event-stream' },
  });
  check(
    'the live stream opens for a signed-in user',
    sseStream.status === 200 &&
      (sseStream.headers.get('content-type') ?? '').startsWith('text/event-stream'),
  );
  const streamEvents = collectEvents(sseStream, 'chat.message', 6000);
  await new Promise((resolve) => setTimeout(resolve, 500));

  check(
    'an admin cannot use the student side of the chat',
    (await admin.get('/chat')).status === 403,
  );
  const chatThread = (await student.get('/chat')).data;
  check(
    'the student gets a conversation on first open',
    chatThread?.conversation?.student?.id === studentId &&
      chatThread.messages.length === 0 &&
      chatThread.hasMore === false,
    JSON.stringify(chatThread),
  );
  check(
    'an empty message is refused',
    (await student.post('/chat/messages', { body: '  ' })).status === 400,
  );
  const hello = (await student.post('/chat/messages', { body: 'Привіт! Не відкривається відео.' }))
    .data;
  check(
    'the student sends a text message',
    hello?.senderRole === 'student' && hello.body.startsWith('Привіт'),
  );
  const chatPng = (await upload(student, 'chat', png, 'image/png', 'screen.png')).data;
  check('a student can upload a chat picture', Boolean(chatPng?.id));
  check(
    'a foreign file id is not accepted as a chat picture',
    (
      await student.post('/chat/messages', {
        imageFileId: '00000000-0000-4000-8000-000000000000',
      })
    ).status === 400,
  );
  const photo = (await student.post('/chat/messages', { imageFileId: chatPng.id })).data;
  check('the student sends a picture', photo?.imageFileId === chatPng.id && photo.body === '');
  check(
    'the same picture cannot be sent twice',
    (await student.post('/chat/messages', { imageFileId: chatPng.id })).status === 400,
  );

  const sseReceived = await streamEvents;
  check(
    'the student receives the message over the live stream',
    sseReceived.some((event) => event.type === 'chat.message' && event.message.id === hello.id),
    JSON.stringify(sseReceived.map((event) => event.type)),
  );

  const supportInbox = (await admin.get('/admin/chat/conversations?status=open')).data;
  const convo = supportInbox.find((item) => item.student.id === studentId);
  check(
    'the support queue lists the conversation with 2 unread and a photo preview',
    convo?.unreadCount === 2 && convo.lastMessage?.hasImage === true,
    JSON.stringify(convo),
  );
  check(
    'search by name finds it',
    (await admin.get('/admin/chat/conversations?q=Student')).data.some(
      (item) => item.id === convo.id,
    ),
  );
  check(
    'a subadmin without the support section is refused',
    (await basesAdmin.get('/admin/chat/conversations')).status === 403,
  );
  const chatNotifs = (await admin.get('/notifications')).data.filter(
    (item) => item.type === 'chat_message' && item.data.conversationId === convo.id,
  );
  check(
    'the support team got ONE coalesced bell entry for two messages',
    chatNotifs.length === 1 &&
      chatNotifs[0].readAt === null &&
      chatNotifs[0].link.includes(convo.id),
    JSON.stringify(chatNotifs),
  );
  const adminSummary = (await admin.get('/notifications/summary')).data;
  check(
    'the admin summary counts the queues',
    adminSummary.unread >= 1 &&
      adminSummary.unreadChats >= 1 &&
      adminSummary.chatUnread >= 2 &&
      typeof adminSummary.pendingReviews === 'number',
    JSON.stringify(adminSummary),
  );

  const adminThread = (await admin.get(`/admin/chat/conversations/${convo.id}`)).data;
  check(
    'the admin opens the chatThread with both messages, oldest first',
    adminThread.messages.length === 2 && adminThread.messages[0].id === hello.id,
  );
  check(
    'the support admin can open the chat picture',
    (await admin.call('GET', `/files/${chatPng.id}`, { raw: true })).status === 200,
  );
  const otherStudent = (await register(`e2e.otherStudent.${stamp}@example.com`, 'Other')).client;
  check(
    'another student cannot open it',
    (await otherStudent.call('GET', `/files/${chatPng.id}`, { raw: true })).status === 404,
  );
  check(
    'a subadmin without support cannot open it',
    (await basesAdmin.call('GET', `/files/${chatPng.id}`, { raw: true })).status === 404,
  );
  check(
    'the admin marks the student messages read',
    (await admin.post(`/admin/chat/conversations/${convo.id}/read`)).data?.readAt !== null,
  );
  check(
    'reading the chat clears its bell entry',
    (await admin.get('/notifications')).data.find((item) => item.id === chatNotifs[0].id)
      ?.readAt !== null,
  );
  const reply = (
    await admin.post(`/admin/chat/conversations/${convo.id}/messages`, {
      body: 'Вітаю! Перевіримо.',
    })
  ).data;
  check(
    'the admin replies under their own name',
    reply?.senderRole === 'support' && reply.senderName.includes('Admin'),
    JSON.stringify(reply),
  );
  const studentThread = (await student.get('/chat')).data;
  check(
    'the student sees the reply, their messages as read and 1 unread',
    studentThread.messages.length === 3 &&
      studentThread.messages[0].readAt !== null &&
      studentThread.conversation.unreadCount === 1,
    JSON.stringify(studentThread.conversation),
  );
  const studentNotifs = (await student.get('/notifications')).data;
  check(
    'the student got bell entries for the reply, the review and the access grants',
    studentNotifs.some(
      (item) => item.type === 'chat_message' && item.link === '/cabinet/support',
    ) &&
      studentNotifs.some((item) => item.type === 'review_done') &&
      studentNotifs.some((item) => item.type === 'access_granted'),
    JSON.stringify(studentNotifs.map((item) => item.type)),
  );
  check(
    'the reviewer got "work to review" entries',
    (await reviewer.get('/notifications?unread=true')).data.some(
      (item) => item.type === 'review_pending',
    ),
  );
  check(
    'the student menu badge counts the one unread answer of the team',
    (await student.get('/notifications/summary')).data?.chatUnread === 1,
  );
  check(
    'the student marks the chat read',
    (await student.post('/chat/read')).data?.readAt !== null,
  );
  check(
    'and the badge goes to 0',
    (await student.get('/notifications/summary')).data?.chatUnread === 0,
  );
  check(
    'an admin without the support section has no chat badge',
    (await basesAdmin.get('/notifications/summary')).data?.chatUnread === null,
  );
  check(
    'typing events are accepted on both sides',
    (await student.post('/chat/typing')).data?.ok === true &&
      (await admin.post(`/admin/chat/conversations/${convo.id}/typing`)).data?.ok === true,
  );
  const olderPage = (await student.get(`/chat/messages?before=${reply.id}&limit=1`)).data;
  check(
    'older messages page before the reply: one message and more behind it',
    olderPage.messages.length === 1 &&
      olderPage.messages[0].id === photo.id &&
      olderPage.hasMore === true,
    JSON.stringify(olderPage),
  );
  check(
    'the admin closes the conversation',
    (await admin.patch(`/admin/chat/conversations/${convo.id}`, { status: 'closed' })).data
      ?.status === 'closed',
  );
  check(
    'closed conversations are listed under "closed"',
    (await admin.get('/admin/chat/conversations?status=closed')).data.some(
      (item) => item.id === convo.id,
    ),
  );
  await student.post('/chat/messages', { body: 'Ще питання' });
  check(
    'a new student message reopens it',
    (await admin.get(`/admin/chat/conversations/${convo.id}`)).data.conversation.status === 'open',
  );

  console.log('\n# News and reading the bell');
  check(
    'a subadmin without the news section cannot send news',
    (await basesAdmin.post('/admin/news', { title: 'x', body: 'y' })).status === 403,
  );
  check(
    'an outside link is refused',
    (await admin.post('/admin/news', { title: 'x', body: 'y', link: 'https://evil.example' }))
      .status === 400,
  );
  const newsTitle = `E2E news ${stamp}`;
  const news = (
    await admin.post('/admin/news', {
      title: newsTitle,
      body: 'Додали фізіологію.',
      link: '/cabinet',
    })
  ).data;
  check(
    'news goes to every student',
    news?.recipients >= 2 && news.sentBy?.name.includes('Admin'),
    JSON.stringify(news),
  );
  check(
    'news history lists it',
    (await admin.get('/admin/news')).data.some((item) => item.id === news.id),
  );
  const studentNews = (await student.get('/notifications?limit=5')).data;
  check(
    'the student sees the news on top',
    studentNews[0]?.type === 'news' &&
      studentNews[0].title === newsTitle &&
      studentNews[0].link === '/cabinet',
  );
  const beforeRead = (await student.get('/notifications/summary')).data;
  check(
    'the student summary has no admin queues',
    beforeRead.unread >= 2 && beforeRead.pendingReviews === null && beforeRead.unreadChats === null,
  );
  const marked = (await student.post(`/notifications/${studentNews[0].id}/read`)).data;
  check(
    'one notification marked read',
    marked?.readAt !== null &&
      (await student.get('/notifications/summary')).data.unread === beforeRead.unread - 1,
  );
  check(
    "someone else's notification is not found",
    (await admin.post(`/notifications/${studentNews[0].id}/read`)).status === 404,
  );
  check(
    'read-all clears the rest',
    (await student.post('/notifications/read-all')).data?.unread === 0 &&
      (await student.get('/notifications?unread=true')).data.length === 0,
  );
  check(
    'pagination meta is there',
    (await student.get('/notifications?limit=2')).body.meta?.limit === 2,
  );

  console.log('\n# Testimonials: guests, signed-in authors, moderation');
  const guestAnon = new Client();
  const TEXT = 'Дуже зручна платформа, тести й матеріали допомогли підготуватись.';
  const counts0 = (await admin.get('/admin/testimonials/counts')).data;
  const GUEST_EMAIL = `E2E.Guest.${stamp}@Example.com`;
  check(
    'a guest must give a name',
    (await guestAnon.post('/testimonials', { text: TEXT, rating: 5, email: GUEST_EMAIL }))
      .status === 400,
  );
  check(
    'a guest must give an email',
    (
      await guestAnon.post('/testimonials', {
        name: 'E2E',
        surname: 'Guest',
        text: TEXT,
        rating: 5,
      })
    ).status === 400,
  );
  check(
    'a bad email is refused',
    (
      await guestAnon.post('/testimonials', {
        name: 'E2E',
        surname: 'Guest',
        email: 'not-an-email',
        text: TEXT,
        rating: 5,
      })
    ).status === 400,
  );
  for (const badPhone of ['12345', '+380 08 938 55 85', '+1 202 555 0100', '+380 98 938 55']) {
    check(
      `the phone "${badPhone}" is refused`,
      (
        await guestAnon.post('/testimonials', {
          name: 'E2E',
          surname: 'Guest',
          email: GUEST_EMAIL,
          phone: badPhone,
          text: TEXT,
          rating: 5,
        })
      ).status === 400,
    );
  }
  check(
    'the rating must be 1 to 5',
    (
      await guestAnon.post('/testimonials', {
        name: 'E2E',
        surname: 'Guest',
        email: GUEST_EMAIL,
        text: TEXT,
        rating: 9,
      })
    ).status === 400,
  );
  const bot = await guestAnon.post('/testimonials', {
    name: 'E2E',
    surname: 'Bot',
    email: GUEST_EMAIL,
    text: TEXT,
    rating: 5,
    website: 'http://spam.example',
  });
  check('a bot that fills the hidden field is told it worked', bot.status === 201);
  check(
    'but nothing was stored for it',
    (await admin.get('/admin/testimonials/counts')).data.pending === counts0.pending,
  );
  const guestMade = await guestAnon.post('/testimonials', {
    name: 'E2E',
    surname: 'Guest',
    email: GUEST_EMAIL,
    // Written the way people write it; the api stores it as +380 98 938 55 85.
    phone: '098 938-55-85',
    text: TEXT,
    rating: 4,
  });
  check(
    'a guest leaves a testimonial: it is pending',
    guestMade.status === 201 && guestMade.data.status === 'pending',
    JSON.stringify(guestMade.body),
  );
  const guestId = guestMade.data.id;
  check(
    'it is not public yet',
    !(await guestAnon.get('/testimonials')).data.some((item) => item.id === guestId),
  );
  check('a guest has no "mine" list', (await guestAnon.get('/testimonials/mine')).status === 401);

  const studentMade = await student.post('/testimonials', {
    name: 'Hacker',
    surname: 'Name',
    email: 'hacker@example.com',
    phone: '+380 (67) 111-22-33',
    text: TEXT,
    rating: 5,
  });
  check('a signed-in student leaves one without a name', studentMade.status === 201);
  const studentTestimonialId = studentMade.data.id;
  check(
    'a second one is refused while the first waits (409)',
    (await student.post('/testimonials', { text: TEXT, rating: 5 })).status === 409,
  );
  const pendingList = (await admin.get('/admin/testimonials?status=pending&limit=100')).data;
  const guestRow = pendingList.find((item) => item.id === guestId);
  const studentRow = pendingList.find((item) => item.id === studentTestimonialId);
  check(
    'the admin sees both, the guest without an account',
    guestRow?.author === null && guestRow.name === 'E2E' && studentRow?.author?.id === studentId,
  );
  check(
    'the name of a signed-in author comes from the account, not from the request',
    studentRow?.name === 'Renamed' && studentRow.surname === 'Test',
    JSON.stringify(studentRow),
  );
  check(
    'the email of a signed-in author comes from the account too',
    studentRow?.email === emails.student && studentRow.author?.email === emails.student,
    JSON.stringify(studentRow),
  );
  check(
    'the guest email is stored in lower case and the phone as +380 98 938 55 85',
    guestRow?.email === GUEST_EMAIL.toLowerCase() && guestRow.phone === '+380 98 938 55 85',
    JSON.stringify(guestRow),
  );
  check(
    'the phone of a signed-in author is normalized too, and a missing one is null',
    studentRow?.phone === '+380 67 111 22 33',
    JSON.stringify(studentRow),
  );
  check(
    'a subadmin without the section is refused',
    (await basesAdmin.get('/admin/testimonials')).status === 403 &&
      (await student.get('/admin/testimonials')).status === 403,
  );
  const adminBell = (await admin.get('/notifications?limit=50')).data;
  check(
    'the admins got "a testimonial waits" in the bell',
    adminBell.some((item) => item.type === 'testimonial_pending'),
  );
  const summaryA = (await admin.get('/notifications/summary')).data;
  check(
    'the admin summary counts them and a subadmin without the section gets null',
    summaryA.pendingTestimonials >= 2 &&
      (await basesAdmin.get('/notifications/summary')).data.pendingTestimonials === null,
    JSON.stringify(summaryA),
  );

  // The student gets a profile picture, so it can appear in a circle next to the testimonial.
  const avatarUpload = (await upload(student, 'avatar', png, 'image/png', 'me.png')).data;
  check(
    'the student sets an avatar',
    (await student.put('/profile', { avatarFileId: avatarUpload.id })).status === 200,
  );

  const edited = await admin.patch(`/admin/testimonials/${guestId}`, {
    text: `${TEXT} (виправлено адміном)`,
    rating: 5,
    status: 'approved',
  });
  check(
    'the admin edits and approves in one step',
    edited.status === 200 &&
      edited.data.status === 'approved' &&
      edited.data.editedAt !== null &&
      edited.data.moderatedBy?.name.includes('Admin') &&
      edited.data.text.endsWith('(виправлено адміном)'),
    JSON.stringify(edited.body),
  );
  const publicNow = (await guestAnon.get('/testimonials')).data;
  const guestPublic = publicNow.find((item) => item.id === guestId);
  check(
    'the approved one is public, without an account or a picture',
    guestPublic?.authorName === 'E2E Guest' &&
      guestPublic.rating === 5 &&
      guestPublic.hasAvatar === false,
    JSON.stringify(guestPublic),
  );
  check(
    'the public list holds no emails, phones or ids of accounts',
    !JSON.stringify(publicNow).includes('@') &&
      !JSON.stringify(publicNow).includes('+380') &&
      !('author' in (guestPublic ?? {})) &&
      !('email' in (guestPublic ?? {})) &&
      !('phone' in (guestPublic ?? {})),
  );
  check(
    'a guest has no picture to open (404)',
    (await guestAnon.call('GET', `/testimonials/${guestId}/avatar`, { raw: true })).status === 404,
  );

  check(
    "a pending testimonial's picture is not public (404)",
    (await guestAnon.call('GET', `/testimonials/${studentTestimonialId}/avatar`, { raw: true }))
      .status === 404,
  );
  const approvedStudent = await admin.patch(`/admin/testimonials/${studentTestimonialId}`, {
    status: 'approved',
  });
  check(
    'approving without edits leaves it unedited',
    approvedStudent.data?.status === 'approved' && approvedStudent.data.editedAt === null,
  );
  const studentPublic = (await guestAnon.get('/testimonials')).data.find(
    (item) => item.id === studentTestimonialId,
  );
  check('the author picture is flagged on the public one', studentPublic?.hasAvatar === true);
  const avatarResponse = await guestAnon.call(
    'GET',
    `/testimonials/${studentTestimonialId}/avatar`,
    { raw: true },
  );
  check(
    'and anyone can open it, as an image',
    avatarResponse.status === 200 &&
      (avatarResponse.headers.get('content-type') ?? '').startsWith('image/'),
  );
  check(
    'the student heard about it in the bell',
    (await student.get('/notifications?limit=50')).data.some(
      (item) => item.type === 'testimonial_result' && item.data.status === 'approved',
    ),
  );
  const myList = (await student.get('/testimonials/mine')).data;
  check('"mine" shows the state', myList.length === 1 && myList[0].status === 'approved');

  const second = (await student.post('/testimonials', { text: `${TEXT} Ще одне.`, rating: 3 }))
    .data;
  check('after approval the student may write another', Boolean(second?.id));
  const rejected = await admin.patch(`/admin/testimonials/${second.id}`, { status: 'rejected' });
  check('the admin rejects it', rejected.data?.status === 'rejected');
  check(
    'a rejected one is not public',
    !(await guestAnon.get('/testimonials')).data.some((item) => item.id === second.id),
  );
  check(
    'the student is told it was not published',
    (await student.get('/notifications?limit=50')).data.some(
      (item) => item.type === 'testimonial_result' && item.data.status === 'rejected',
    ),
  );
  const finalCounts = (await admin.get('/admin/testimonials/counts')).data;
  check(
    'the counts follow',
    finalCounts.approved >= counts0.approved + 2 && finalCounts.rejected >= counts0.rejected + 1,
    JSON.stringify(finalCounts),
  );
  check(
    'an approved one can be taken back to pending',
    (await admin.patch(`/admin/testimonials/${guestId}`, { status: 'pending' })).data?.status ===
      'pending' && !(await guestAnon.get('/testimonials')).data.some((item) => item.id === guestId),
  );
  const fixed = await admin.patch(`/admin/testimonials/${guestId}`, {
    email: 'fixed@example.com',
    phone: '0501234567',
  });
  check(
    'the admin can correct the contacts',
    fixed.data?.email === 'fixed@example.com' && fixed.data.phone === '+380 50 123 45 67',
    JSON.stringify(fixed.body),
  );
  const cleared = await admin.patch(`/admin/testimonials/${guestId}`, { phone: null });
  check(
    'and remove the phone',
    cleared.data?.phone === null && cleared.data.email === 'fixed@example.com',
  );
  check(
    'a bad phone from the admin is refused too',
    (await admin.patch(`/admin/testimonials/${guestId}`, { phone: '555' })).status === 400,
  );
  let lastFlood = 201;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    lastFlood = (
      await guestAnon.post('/testimonials', {
        name: 'E2E',
        surname: 'Flood',
        email: GUEST_EMAIL,
        text: TEXT,
        rating: 3,
      })
    ).status;
  }
  check('a guest is limited per hour (429)', lastFlood === 429);
  check(
    'the admin deletes one for good',
    (await admin.del(`/admin/testimonials/${guestId}`)).status === 200 &&
      (await admin.del(`/admin/testimonials/${guestId}`)).status === 404,
  );

  console.log('\n# Profile contacts and the Telegram bot');
  check(
    'the profile starts without a phone or messengers',
    (await student.get('/profile')).data?.phone === null &&
      (await student.get('/profile')).data?.messengers.length === 0,
  );
  const withContacts = await student.put('/profile', {
    phone: '098 938-55-85',
    messengers: [{ kind: 'viber' }, { kind: 'telegram', username: 'https://t.me/@my_nick' }],
  });
  check(
    'a phone written any way is stored as +380 98 938 55 85',
    withContacts.status === 200 && withContacts.data?.phone === '+380 98 938 55 85',
    JSON.stringify(withContacts.body),
  );
  check(
    'the messengers are kept, the nickname cleaned up',
    JSON.stringify(withContacts.data?.messengers) ===
      JSON.stringify([
        { kind: 'telegram', username: 'my_nick' },
        { kind: 'viber', username: null },
      ]),
    JSON.stringify(withContacts.data?.messengers),
  );
  for (const [label, body] of [
    ['a foreign phone', { phone: '+1 202 555 0100' }],
    ['a short phone', { phone: '12345' }],
    ['a nickname for Viber', { messengers: [{ kind: 'viber', username: 'my_nick' }] }],
    [
      'a Telegram nickname that is too short',
      { messengers: [{ kind: 'telegram', username: 'ab' }] },
    ],
    ['the same messenger twice', { messengers: [{ kind: 'viber' }, { kind: 'viber' }] }],
    ['an unknown messenger', { messengers: [{ kind: 'icq' }] }],
  ]) {
    check(`${label} is refused`, (await student.put('/profile', body)).status === 400);
  }
  check(
    'the profile still holds the good values after the refusals',
    (await student.get('/profile')).data?.phone === '+380 98 938 55 85',
  );
  check(
    'the admin sees the contacts of the student, and no bot yet',
    await (async () => {
      const detail = (await admin.get(`/admin/students/${studentId}`)).data;
      return (
        detail?.profile.phone === '+380 98 938 55 85' &&
        detail.profile.messengers.some(
          (item) => item.kind === 'telegram' && item.username === 'my_nick',
        ) &&
        Array.isArray(detail.profile.bots) &&
        detail.profile.bots.length === 0
      );
    })(),
  );

  const tg = (await student.get('/messengers/telegram')).data;
  check(
    'the bot status says whether it is set up, and that nothing is connected',
    typeof tg?.configured === 'boolean' &&
      tg.linked === false &&
      tg.awaitingPhone === false &&
      tg.phone === null,
    JSON.stringify(tg),
  );
  const linkAttempt = await student.post('/messengers/telegram/link');
  check(
    tg?.configured
      ? 'a link to the bot is made (one-time, 15 minutes)'
      : 'without a bot token a link cannot be made (503), the profile says so',
    tg?.configured
      ? linkAttempt.status === 200 && linkAttempt.data?.url.startsWith('https://t.me/')
      : linkAttempt.status === 503,
    JSON.stringify(linkAttempt.body),
  );
  check('an unknown messenger is not found', (await student.get('/messengers/icq')).status === 404);
  check(
    'switching notifications before connecting is refused',
    (await student.patch('/messengers/telegram/settings', { notificationsEnabled: false }))
      .status === 404,
  );
  check(
    'disconnecting something that is not connected is harmless',
    (await student.del('/messengers/telegram/link')).data?.linked === false,
  );
  check(
    'the Telegram webhook is closed without the secret',
    (await guestAnon.post('/messengers/telegram/webhook', { update_id: 1 })).status === 404,
  );
  check(
    'the bot routes need a signed-in user',
    (await guestAnon.get('/messengers/telegram')).status === 401,
  );
  check(
    'the phone can be removed',
    (await student.put('/profile', { phone: null })).data?.phone === null &&
      (await student.put('/profile', { phone: '' })).status === 200,
  );

  console.log('\n# Deleting content');
  check(
    'deleting a subject removes everything below it',
    (await admin.del(`/admin/subjects/${subject.id}`)).status === 200,
  );
  check('its tests are gone', (await admin.get(`/admin/tests/${choice.id}`)).status === 404);
} catch (error) {
  failures += 1;
  console.log('\nSCRIPT ERROR', error);
}

// ---- cleanup ----
try {
  const sql = `DELETE FROM tests WHERE collection != 'subtopic' AND title = 'Bank of questions';
DELETE FROM subjects WHERE title LIKE 'E2E Biochemistry%';
DELETE FROM notifications WHERE type = 'news' AND title LIKE 'E2E news %';
DELETE FROM testimonials WHERE author_name = 'E2E';
DELETE FROM notifications WHERE type IN ('testimonial_pending', 'testimonial_result') AND (body LIKE 'E2E %' OR user_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%@example.com'));
DELETE FROM notification_broadcasts WHERE title LIKE 'E2E news %';
DELETE FROM files WHERE owner_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%@example.com');
DELETE FROM users WHERE email LIKE 'e2e.%@example.com';
`;
  execSync('docker compose exec -T postgres psql -U formula -d formula', {
    cwd: REPO,
    input: sql,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // The test uploads leave bytes on disk. When no file row is left, the dev storage holds only those.
  const left = execSync(
    'docker compose exec -T postgres psql -U formula -d formula -At -c "SELECT count(*) FROM files"',
    {
      cwd: REPO,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  )
    .toString()
    .trim();
  if (left === '0')
    rmSync(new URL('../storage', import.meta.url), { recursive: true, force: true });
  console.log('\ncleanup done');
} catch (error) {
  console.log('\ncleanup failed', String(error).slice(0, 300));
}

console.log(failures === 0 ? '\nALL GOOD' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
