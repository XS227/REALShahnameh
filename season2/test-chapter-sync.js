/* End-to-end harness for season2 sync.js chapter progress.
   Usage: node test-sync-harness.js <phase>
     phase1 — fresh device plays two chapters locally, sync migrates to server
     phase2 — cleared storage: server restores everything locally
     phase3 — stale device with partial old progress: union, no regression
   Runs the REAL sync.js against the LIVE API as telegram user qa-e2e-77. */
const fs = require('fs');
const phase = process.argv[2];
const TID = 'qa-e2e-77';

/* ── browser shims ── */
const store = new Map();
global.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  key: i => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
const events = [];
global.window = {
  addEventListener: () => {},
  dispatchEvent: (e) => { events.push(e.type); return true; },
  Telegram: { WebApp: { initDataUnsafe: { user: { id: TID, first_name: 'QA', username: 'qa_e2e' } } } },
};
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  visibilityState: 'visible',
  getElementById: () => null,
  createElement: () => ({ querySelector: () => ({ addEventListener: () => {} }), remove: () => {}, set innerHTML(_) {} }),
  body: { appendChild: () => {} },
};
global.CustomEvent = class { constructor(type, opts) { this.type = type; this.detail = opts && opts.detail; } };
const fetch_real = globalThis.fetch.bind(globalThis);
global.fetch = (url, opts) => fetch_real('https://shahnameh.setaei.com' + url, opts);
global.setInterval = () => 0; // no periodic balance sync in tests

/* chapter snapshot exactly as chapter.js would have written it locally */
const playChapter = (slug, { done }) => {
  store.set(`real_chapter_progress_${slug}`, JSON.stringify({
    scenes: [`${slug}-s1`, `${slug}-s2`],
    codex: [`${slug}-cx1`],
    quiz: {
      easy:   { idx: 3, correct: ['q1', 'q2', 'q3'], wrong: [], done: true, locked: false, passed: true },
      medium: { idx: 2, correct: ['m1', 'm2'], wrong: [], done: true, locked: false, passed: true },
      hard:   { idx: 0, correct: [], wrong: [], done: false, locked: false },
    },
    fragments: 2,
    desk_read: true,
  }));
  if (done) {
    store.set(`real_chapter_done_${slug}`, '1');
    store.set(`real_chapter_rewards_done_${slug}`, '1');
  }
  store.set(`real_scene_xp_granted_${slug}_${slug}-s1`, '1');
  store.set(`real_quiz_farr_granted_${slug}_medium`, '1');
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else console.log('PASS:', msg); };

(async () => {
  if (phase === 'phase1') {
    playChapter('keyumars', { done: true });
    playChapter('hushang',  { done: true });
    store.set('real_items_v1', JSON.stringify({ 'fire-rune': true }));
    store.set('real_skin_unlocked_v1', JSON.stringify(['keyumars']));
    require('/var/www/shahnameh/season2/sync.js');           // boots, migrates
    await sleep(4000);
    assert(events.includes('real:chapters:synced'), 'sync event fired');
    const res = await fetch_real('https://shahnameh.setaei.com/api/season2/user/chapter-progress/get', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: TID }),
    }).then(r => r.json());
    assert(res.chapters.keyumars && res.chapters.keyumars.done === true, 'keyumars migrated to server as done');
    assert(res.chapters.hushang && res.chapters.hushang.scenes.length === 2, 'hushang scenes migrated');
    assert(res.chapters.keyumars.farr_grants.includes('medium'), 'farr grant migrated');
    assert(res.items['fire-rune'] === true, 'item migrated');
    assert(res.skins.includes('keyumars'), 'skin migrated');
  }

  if (phase === 'phase2') {
    // storage is completely empty — Telegram wiped it
    require('/var/www/shahnameh/season2/sync.js');
    await sleep(4000);
    assert(events.includes('real:chapters:synced'), 'sync event fired');
    assert(store.get('real_chapter_done_keyumars') === '1', 'chapter-done flag restored');
    assert(store.get('real_chapter_rewards_done_keyumars') === '1', 'rewards-done flag restored (no duplicate rewards)');
    const p = JSON.parse(store.get('real_chapter_progress_hushang') || '{}');
    assert((p.scenes || []).length === 2, 'scene list restored');
    assert(p.quiz && p.quiz.medium && p.quiz.medium.done === true, 'quiz tier state restored');
    assert(p.desk_read === true, 'desk_read restored');
    assert(store.get('real_scene_xp_granted_keyumars_keyumars-s1') === '1', 'scene XP grant key restored');
    assert(store.get('real_quiz_farr_granted_keyumars_medium') === '1', 'farr grant key restored');
    assert(JSON.parse(store.get('real_items_v1') || '{}')['fire-rune'] === true, 'items restored');
    assert(JSON.parse(store.get('real_skin_unlocked_v1') || '[]').includes('keyumars'), 'skins restored');
  }

  if (phase === 'phase3') {
    // stale device: knows only part of keyumars, plus a chapter the server lacks
    store.set('real_chapter_progress_keyumars', JSON.stringify({
      scenes: ['keyumars-s1'], codex: [], quiz: { easy: { idx: 1, correct: ['q1'], wrong: [], done: false } },
      fragments: 0, desk_read: false,
    }));
    playChapter('tahmuras', { done: true });                 // local-only chapter
    require('/var/www/shahnameh/season2/sync.js');
    await sleep(4000);
    const p = JSON.parse(store.get('real_chapter_progress_keyumars') || '{}');
    assert(p.scenes.includes('keyumars-s2'), 'stale device gained server scenes (union)');
    assert(p.quiz.easy.done === true, 'stale quiz state upgraded, not downgraded');
    assert(store.get('real_chapter_done_keyumars') === '1', 'done flag not lost to stale device');
    await sleep(2000);                                       // migration push settles
    const res = await fetch_real('https://shahnameh.setaei.com/api/season2/user/chapter-progress/get', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: TID }),
    }).then(r => r.json());
    assert(res.chapters.tahmuras && res.chapters.tahmuras.done === true, 'local-only chapter pushed to server');
    assert(res.chapters.keyumars.scenes.length === 2, 'server kept full scene set after stale push');
  }

  console.log(`\n${phase} finished${process.exitCode ? ' WITH FAILURES' : ' — all green'}`);
})();
