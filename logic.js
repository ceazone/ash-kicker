/* Ash Kicker — pure logic: dates, the workout queue, progression. No DOM. */
(function (root) {
  const P = root.AK_PROGRAM || (typeof require !== 'undefined' ? require('./program.js') : null);
  const { EX, WORKOUTS, ROTATIONS } = P;

  const EASE_IN_SESSIONS = 4; // first four workouts use 2 sets per lift

  // Local-time dates only. new Date("YYYY-MM-DD") parses as UTC and shifts the day.
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const parse = s => { const [a, b, c] = s.split('-').map(Number); return new Date(a, b - 1, c); };
  const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
  const monday = d => addDays(d, -((d.getDay() + 6) % 7));

  function defaultState() {
    return {
      v: 1,
      days: [1, 2, 4, 5],          // weekdays she plans to train, Sunday = 0
      weekOk: null,                // Monday (ISO) of the last week she confirmed days for
      ptr: { full2: 0, full3: 0, ul4: 0, ul5: 0 },
      cur: null,                   // workout in progress
      sessions: [],                // finished workouts, oldest first
      swap: {},                    // remembered swaps: { "FA:1": "goblet" }
      bw: [],                      // optional body-weight entries
      settings: { theme: 'auto', rest: 75, bw: false }
    };
  }

  const splitFor = n => (n <= 2 ? 'full2' : n === 3 ? 'full3' : n === 4 ? 'ul4' : 'ul5');

  function nextWorkout(S, offset) {
    const sp = splitFor(S.days.length), r = ROTATIONS[sp];
    return r[((S.ptr[sp] || 0) + (offset || 0)) % r.length];
  }

  const mainSets = S => (S.sessions.length < EASE_IN_SESSIONS ? 2 : 3);

  /* Most recent finished entry for an exercise that has at least one done set. */
  function lastEntry(S, exId) {
    for (let i = S.sessions.length - 1; i >= 0; i--) {
      const e = S.sessions[i].ex.find(x => x.id === exId && x.sets.some(s => s.done));
      if (e) return e;
    }
    return null;
  }

  /* What to load today, from what happened last time.
     Returns { dir: 'new'|'up'|'same'|'down', w, reps:[...per set], secs, note } */
  function suggest(exId, last, nSets) {
    const ex = EX[exId];
    const fill = v => Array.from({ length: nSets }, () => v);
    const done = last ? last.sets.filter(s => s.done) : [];

    if (ex.type === 't') {
      if (!done.length) return { dir: 'new', secs: ex.secs, note: '' };
      const prev = Math.max(...done.map(s => s.r || ex.secs));
      if (ex.max && last.feel && last.feel !== 'hard' && prev < ex.max)
        return { dir: 'up', secs: Math.min(ex.max, prev + 5), note: 'Five seconds longer than last time.' };
      return { dir: 'same', secs: prev, note: '' };
    }

    if (!done.length) {
      return {
        dir: 'new', w: null, reps: fill(ex.lo),
        note: ex.type === 'w' ? 'First time: pick a weight you could lift ' + (ex.hi + 2) + ' times, and stop at ' + ex.lo + '–' + ex.hi + '.' : ''
      };
    }
    const allTop = done.length >= Math.min(2, nSets) && done.every(s => s.r >= ex.hi);
    const anyLow = done.some(s => s.r < ex.lo);
    const w = ex.type === 'w' ? done[0].w : null;
    const prevReps = i => (last.sets[i] && last.sets[i].done ? last.sets[i].r : done[done.length - 1].r);

    if (ex.type === 'bw') {
      if (allTop && last.feel !== 'hard') return { dir: 'same', w: null, reps: fill(ex.hi), note: 'You own this one. Slow it down or try the harder version in the how-to.' };
      return { dir: 'same', w: null, reps: Array.from({ length: nSets }, (_, i) => prevReps(i)), note: 'Aim for one more rep than last time.' };
    }
    if (w == null) return { dir: 'new', w: null, reps: fill(ex.lo), note: '' };
    if (allTop && last.feel !== 'hard')
      return { dir: 'up', w: w + ex.inc, reps: fill(ex.lo), note: 'Going up from ' + w + ' lb. You hit ' + ex.hi + ' on every set last time.' };
    if (anyLow && last.feel === 'hard')
      return { dir: 'down', w: Math.max(0, w - ex.inc), reps: fill(ex.lo), note: 'Backing off from ' + w + ' lb. Last time was a grind, and that is fine.' };
    return { dir: 'same', w, reps: Array.from({ length: nSets }, (_, i) => prevReps(i)), note: 'Same weight. Aim for one more rep.' };
  }

  function buildEntry(S, wk, slotIdx) {
    const slot = WORKOUTS[wk].slots[slotIdx];
    const id = S.swap[wk + ':' + slotIdx] || slot[0];
    const ex = EX[id];
    const n = slot[1] || mainSets(S);
    const sug = suggest(id, lastEntry(S, id), n);
    const sets = Array.from({ length: n }, (_, i) => ({
      w: ex.type === 'w' ? sug.w : null,
      r: ex.type === 't' ? sug.secs : sug.reps[i],
      done: false
    }));
    return { slot: slotIdx, id, sets, feel: null, dir: sug.dir, note: sug.note };
  }

  function buildSession(S, today, wk) {
    const split = splitFor(S.days.length);
    wk = wk || nextWorkout(S);
    return {
      date: iso(today), wk, split, startedAt: Date.now(),
      ex: WORKOUTS[wk].slots.map((_, i) => buildEntry(S, wk, i)),
      note: ''
    };
  }

  const anyDone = ses => !!ses && ses.ex.some(e => e.sets.some(s => s.done));
  const setsDone = ses => ses.ex.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
  const setsTotal = ses => ses.ex.reduce((n, e) => n + e.sets.length, 0);

  function volume(ses) {
    let v = 0;
    for (const e of ses.ex) {
      const ex = EX[e.id];
      if (ex.type !== 'w') continue;
      for (const s of e.sets) if (s.done && s.w) v += s.w * s.r * (ex.pair ? 2 : 1);
    }
    return Math.round(v);
  }

  const bestWeight = e => Math.max(0, ...e.sets.filter(s => s.done && s.w).map(s => s.w));

  /* Exercises where today's top weight beats every earlier session. */
  function personalBests(S, ses) {
    const out = [];
    for (const e of ses.ex) {
      if (EX[e.id].type !== 'w') continue;
      const top = bestWeight(e);
      if (!top) continue;
      let prev = 0, seen = false;
      for (const old of S.sessions) for (const oe of old.ex) if (oe.id === e.id) { const b = bestWeight(oe); if (b) { seen = true; prev = Math.max(prev, b); } }
      if (seen && top > prev) out.push({ id: e.id, w: top });
    }
    return out;
  }

  /* Move the in-progress workout into history and advance the queue. */
  function finish(S) {
    const ses = S.cur;
    if (!ses) return null;
    ses.pbs = personalBests(S, ses);
    ses.finishedAt = Date.now();
    S.sessions.push(ses);
    const r = ROTATIONS[ses.split];
    if (r[(S.ptr[ses.split] || 0) % r.length] === ses.wk) S.ptr[ses.split] = ((S.ptr[ses.split] || 0) + 1) % r.length;
    S.cur = null;
    return ses;
  }

  /* On launch: a workout left open from an earlier day counts if anything was done. */
  function settleStale(S, today) {
    if (!S.cur || S.cur.date === iso(today)) return;
    if (anyDone(S.cur)) finish(S); else S.cur = null;
  }

  const sessionsOn = (S, dateIso) => S.sessions.filter(s => s.date === dateIso);
  function weekCount(S, today, weeksAgo) {
    const a = iso(addDays(monday(today), -7 * (weeksAgo || 0))), b = iso(addDays(parse(a), 7));
    return S.sessions.filter(s => s.date >= a && s.date < b);
  }

  /* Seven days, Monday first, with what is done and what the queue would hand out. */
  function weekPreview(S, today) {
    const m = monday(today), t = iso(today);
    let off = 0;
    const curToday = S.cur && S.cur.date === t;
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(m, i), di = iso(d);
      const done = sessionsOn(S, di);
      const planned = S.days.includes(d.getDay());
      let wk = null;
      if (done.length) wk = done[done.length - 1].wk;
      else if (di === t && curToday) { wk = S.cur.wk; off++; }
      else if (planned && di >= t) wk = nextWorkout(S, off++);
      return { date: di, d, planned, done: done.length > 0, wk, isToday: di === t, past: di < t };
    });
  }

  const L = {
    iso, parse, addDays, monday, defaultState, splitFor, nextWorkout, mainSets, lastEntry, suggest,
    buildEntry, buildSession, anyDone, setsDone, setsTotal, volume, bestWeight, personalBests,
    finish, settleStale, sessionsOn, weekCount, weekPreview, EASE_IN_SESSIONS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  root.AK_LOGIC = L;
})(typeof window !== 'undefined' ? window : globalThis);
