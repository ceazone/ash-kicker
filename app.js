/* Ash Kicker — screens, events, storage. Logic lives in logic.js, the program in program.js. */
(function () {
  'use strict';
  const { EX, WORKOUTS, ROTATIONS, SPLIT_NAMES } = window.AK_PROGRAM;
  const L = window.AK_LOGIC;
  const KEY = 'ashkicker:v1';
  const VERSION = '1.0';
  const $ = s => document.querySelector(s);
  const view = $('#view');

  /* ---------- storage ---------- */
  let S = L.defaultState();
  const mem = {};
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
    if (!raw) raw = mem[KEY] || null;
    if (raw) {
      try {
        const d = L.defaultState(), p = JSON.parse(raw);
        S = Object.assign(d, p, { ptr: Object.assign(d.ptr, p.ptr), settings: Object.assign(d.settings, p.settings) });
      } catch (e) { /* corrupt: start clean */ }
    }
  }
  function save() {
    const v = JSON.stringify(S); mem[KEY] = v;
    try { localStorage.setItem(KEY, v); } catch (e) { /* keep in memory */ }
  }
  let saveT = 0;
  const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 250); };

  /* ---------- helpers ---------- */
  const now = () => new Date();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fmtDate = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtShort = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fmtSecs = s => (s >= 60 ? [Math.round(s / 60), 'min'] : [s, 'sec']);
  const num = n => Number(n).toLocaleString('en-US');
  const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

  function target(e) {
    const ex = EX[e.id], n = e.sets.length;
    if (ex.type === 't') { const [v, u] = fmtSecs(e.sets[0].r); return (n > 1 ? n + ' × ' : '') + v + ' ' + u + (ex.side ? ' each side' : ''); }
    return n + ' × ' + ex.lo + '–' + ex.hi + (ex.side ? ' each side' : '');
  }
  function lastLine(id) {
    const le = L.lastEntry(S, id); if (!le) return '';
    const ex = EX[id], done = le.sets.filter(s => s.done);
    if (ex.type === 't') return '';
    const reps = done.map(s => s.r).join(', ');
    return 'Last time: ' + (ex.type === 'w' ? done[0].w + ' lb × ' : '') + reps + (ex.type === 'bw' ? ' reps' : '');
  }
  function nextPlanned(from) {
    for (let i = 1; i <= 7; i++) { const d = L.addDays(from, i); if (S.days.includes(d.getDay())) return d; }
    return null;
  }

  /* ---------- UI state (not saved) ---------- */
  let tab = 'today';
  const ui = { how: {}, open: {} };

  /* ---------- Today ---------- */
  function topBar(label) {
    return `<header class="top"><img src="logo/peach-color.svg" alt="" width="44" height="44">
      <div><div class="ak-label-overline">${esc(label)}</div><div class="ak-body-m-strong">Ash Kicker</div></div></header>`;
  }

  function dayChips() {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return `<div class="days">${order.map(d => `<button class="chip ${S.days.includes(d) ? 'on' : ''}" data-act="day" data-d="${d}" aria-pressed="${S.days.includes(d)}" aria-label="${DOW_LONG[d]}">${DOW[d][0]}</button>`).join('')}</div>`;
  }
  const splitLine = () => `${plural(S.days.length, 'day')} · ${SPLIT_NAMES[L.splitFor(S.days.length)]}`;

  function weekCard(first) {
    return `<section class="card stack">
      <h2 class="ak-h1">${first ? 'When can you go?' : 'New week. Which days?'}</h2>
      <p class="ak-body-m">${first ? 'Tap the days you can get to the gym this week. One to five. You can change it any time.' : 'Same as last week, or tap to change. Anything from one to five works.'}</p>
      ${dayChips()}
      <p class="ak-body-m-strong">${splitLine()}</p>
      <button class="btn btn-primary block" data-act="weekok">${first ? "Let's go" : 'Lock it in'}</button>
    </section>`;
  }

  function setRow(e, ei, si) {
    const ex = EX[e.id], s = e.sets[si];
    let mid;
    if (ex.type === 'w') {
      mid = `<input class="w" type="number" inputmode="decimal" step="any" min="0" value="${s.w == null ? '' : s.w}" placeholder="0" data-k="w" data-e="${ei}" data-s="${si}" aria-label="Weight in pounds, set ${si + 1}">
        <span class="ak-body-s unit">lb${ex.pair ? ' each' : ''}</span><span class="x">×</span>
        <input type="number" inputmode="numeric" min="0" value="${s.r == null ? '' : s.r}" placeholder="0" data-k="r" data-e="${ei}" data-s="${si}" aria-label="Reps, set ${si + 1}">`;
    } else if (ex.type === 'bw') {
      mid = `<span class="x">×</span><input type="number" inputmode="numeric" min="0" value="${s.r == null ? '' : s.r}" placeholder="0" data-k="r" data-e="${ei}" data-s="${si}" aria-label="Reps, set ${si + 1}">
        <span class="ak-body-s unit">reps</span>`;
    } else {
      const [v, u] = fmtSecs(s.r);
      mid = `<span class="fixed">${v}</span><span class="ak-body-s unit">${u}${ex.side ? ' each side' : ''}</span>`;
    }
    return `<div class="set ${s.done ? 'done' : ''}">
      <span class="ak-label-overline">${e.sets.length > 1 ? 'Set ' + (si + 1) : 'Go'}</span>${mid}
      <button class="check" data-act="check" data-e="${ei}" data-s="${si}" aria-pressed="${s.done}" aria-label="${s.done ? 'Undo set ' : 'Mark set '}${si + 1} done">✓</button>
    </div>`;
  }

  function exBlock(e, ei) {
    const ex = EX[e.id];
    const allDone = e.sets.every(s => s.done);
    const settled = allDone && (e.feel || ex.noFeel);
    if (settled && !ui.open[ei]) {
      const sum = ex.type === 'w' ? e.sets[0].w + ' lb × ' + e.sets.map(s => s.r).join(', ')
        : ex.type === 'bw' ? e.sets.map(s => s.r).join(', ') + ' reps' : 'Done';
      return `<button class="done-line" data-act="open" data-e="${ei}"><span class="dot">✓</span>
        <span class="grow"><span class="ak-body-m-strong">${esc(ex.name)}</span><br><span class="ak-body-s muted">${esc(sum)}</span></span>
        <span class="ak-caption muted">Edit</span></button>`;
    }
    const started = e.sets.some(s => s.done);
    const last = lastLine(e.id);
    const tagTxt = { up: 'Level up', down: 'Ease off', new: 'New' }[e.dir];
    const how = ui.how[ei] ? `<div class="how">
        <p class="ak-body-m">${esc(ex.how)}</p>
        ${ex.cue ? `<p class="ak-body-m cue">${esc(ex.cue)}</p>` : ''}
        <p class="ak-body-s muted">You need: ${esc(ex.equip)}</p>
        ${(ex.swaps || []).length && !started ? `<div class="stack-s"><div class="ak-label-overline">Machine taken? Not feeling it?</div>
          <div class="chips">${ex.swaps.map(id => `<button class="chip" data-act="swap" data-e="${ei}" data-id="${id}">Swap for ${esc(EX[id].name)}</button>`).join('')}</div></div>` : ''}
      </div>` : '';
    const feel = allDone && !ex.noFeel ? `<div class="feel"><div class="ak-body-m-strong">How did that feel?</div>
        <div class="chips">${[['easy', 'Easy'], ['right', 'About right'], ['hard', 'Hard']].map(([k, t]) => `<button class="chip ${e.feel === k ? 'on' : ''}" data-act="feel" data-e="${ei}" data-f="${k}">${t}</button>`).join('')}</div></div>` : '';
    return `<section class="ex" id="ex${ei}">
      <div class="ex-head">
        <div class="grow"><div class="ak-label-overline">${esc(ex.muscle)}</div><h3 class="ak-h3">${esc(ex.name)}</h3>
          <div class="ak-body-s ex-meta">${esc(target(e))}${last ? ' · ' + esc(last) : ''}</div></div>
        <a class="icon-btn" href="${yt(ex.q)}" target="_blank" rel="noopener" aria-label="Watch a video of ${esc(ex.name)}"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.500z"/></svg></a>
        <button class="icon-btn ${ui.how[ei] ? 'on' : ''}" data-act="how" data-e="${ei}" aria-expanded="${!!ui.how[ei]}" aria-label="How to do ${esc(ex.name)}">?</button>
      </div>
      ${e.note ? `<div class="note-line">${tagTxt ? `<span class="tag ${e.dir === 'up' ? '' : 'soft'}">${tagTxt}</span>` : ''}<span class="ak-body-s muted">${esc(e.note)}</span></div>` : ''}
      ${how}
      ${e.sets.map((_, si) => setRow(e, ei, si)).join('')}
      ${feel}
    </section>`;
  }

  function workoutView(t) {
    const c = S.cur, w = WORKOUTS[c.wk];
    const done = L.setsDone(c), total = L.setsTotal(c);
    const easing = S.sessions.length < L.EASE_IN_SESSIONS && c.wk !== 'CC';
    return `<section class="hero">
        <div class="ak-label-overline">Today · ${esc(fmtDate(t))}</div>
        <h1 class="ak-display-m title">${esc(w.name)}</h1>
        <div class="pills"><span class="pill">${easing ? '35' : '45'} min</span><span class="pill">${esc(w.tag)}</span>${easing ? '<span class="pill">Ease-in</span>' : ''}</div>
        <div><div class="bar-label"><span class="ak-body-s">${done === 0 ? 'Ready when you are' : done === total ? 'Every set done' : 'Keep going'}</span><span class="ak-body-m-strong">${done} / ${total}</span></div>
          <div class="bar"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div></div>
        ${easing ? `<p class="ak-body-s">First few workouts are two sets each, on purpose. Workout ${S.sessions.length + 1} of ${L.EASE_IN_SESSIONS} before it goes to three.</p>` : ''}
      </section>
      ${c.ex.map(exBlock).join('')}
      <section class="stack">
        <button class="btn btn-primary block" data-act="finish" ${done ? '' : 'disabled'}>Finish workout</button>
        <p class="ak-body-s muted" style="text-align:center">${done ? 'Out of time? Finish anyway. Whatever you did counts.' : 'Tick off a set and this wakes up.'}</p>
        ${done ? '' : '<button class="btn btn-tertiary small" data-act="skip">Not today</button>'}
      </section>`;
  }

  function doneView(t, ses) {
    const mins = ses.finishedAt && ses.startedAt ? Math.max(1, Math.round((ses.finishedAt - ses.startedAt) / 60000)) : null;
    const vol = L.volume(ses), n = S.sessions.length, nx = nextPlanned(t);
    const msg = n === 1 ? 'First one down. That was the hardest one.' : n < 4 ? 'You came back. That is the whole trick.' : n < 12 ? 'This is turning into a habit.' : n < 30 ? 'Regular. Officially.' : 'You are someone who lifts now.';
    return `<section class="hero done">
        <div class="ak-label-overline">${esc(fmtDate(t))} · ${esc(WORKOUTS[ses.wk].name)}</div>
        <h1 class="ak-display-l big">Ash kicked.</h1>
        <div class="pills"><span class="pill">${plural(L.setsDone(ses), 'set')}</span>${vol ? `<span class="pill">${num(vol)} lb lifted</span>` : ''}${mins && mins < 180 ? `<span class="pill">${mins} min</span>` : ''}<span class="pill">Workout #${n}</span></div>
        <p class="ak-body-l">${msg}</p>
      </section>
      ${ses.pbs && ses.pbs.length ? `<section class="stack"><h2 class="ak-h1">Personal bests</h2>
        <div class="chips">${ses.pbs.map(p => `<span class="tag pb">${esc(EX[p.id].name)} · ${p.w} lb</span>`).join('')}</div></section>` : ''}
      <section class="stack-s"><label class="ak-body-m-strong" for="note">Anything to remember? <span class="muted">Optional.</span></label>
        <textarea id="note" rows="3" data-act="note" placeholder="Felt strong. Baby slept. Left knee was cranky.">${esc(ses.note)}</textarea></section>
      <section class="card stack"><div class="ak-label-overline muted">Next up</div>
        <h2 class="ak-h2">${esc(WORKOUTS[L.nextWorkout(S)].name)}${nx ? ' · ' + DOW_LONG[nx.getDay()] : ''}</h2>
        <p class="ak-body-s muted">If that day falls through, it waits for you. Nothing gets skipped.</p></section>
      <button class="btn btn-tertiary small" data-act="start">Do another workout</button>`;
  }

  function restView(t) {
    const nx = nextPlanned(t), nw = WORKOUTS[L.nextWorkout(S)];
    return `<section class="hero rest-day">
        <div class="ak-label-overline muted">Today · ${esc(fmtDate(t))}</div>
        <h1 class="ak-display-m title">Rest day</h1>
        <p class="ak-body-l">Nothing on the schedule. Muscles grow on days like this.</p>
        <div class="pills"><span class="pill">Next: ${esc(nw.name)}${nx ? ' · ' + DOW[nx.getDay()] : ''}</span></div>
      </section>
      <section class="stack">
        <button class="btn btn-secondary block" data-act="start">Work out anyway</button>
        <p class="ak-body-s muted" style="text-align:center">Got an unexpected free hour? Take it. Your next workout is ready.</p>
      </section>
      <section class="card peach stack-s"><h2 class="ak-h3">Optional</h2>
        <p class="ak-body-m">A walk with the stroller is real recovery. So is a nap.</p></section>`;
  }

  function viewToday() {
    const t = now(), ti = L.iso(t);
    const first = !S.weekOk && !S.sessions.length;
    const needWeek = S.weekOk !== L.iso(L.monday(t));
    const doneToday = L.sessionsOn(S, ti);
    if (!S.cur && !needWeek && !doneToday.length && S.days.includes(t.getDay()) && S.skip !== ti) { S.cur = L.buildSession(S, t); save(); }
    let body;
    if (first) body = `<section class="hero"><h1 class="ak-display-l big">Kick some ash.</h1><p class="ak-body-l">Tell it when you can go. It tells you what to do. That is the whole app.</p></section>`;
    else if (S.cur) body = workoutView(t);
    else if (doneToday.length) body = doneView(t, doneToday[doneToday.length - 1]);
    else body = restView(t);
    return topBar(fmtDate(t)) + (first ? body + weekCard(true) : (needWeek ? weekCard(false) : '') + body);
  }

  /* ---------- Week ---------- */
  function viewWeek() {
    const t = now(), wp = L.weekPreview(S, t);
    const done = L.weekCount(S, t).length, goal = S.days.length;
    return `${topBar('This week')}
      <h1 class="ak-display-m title">This week</h1>
      <section><div class="bar-label"><span class="ak-body-s muted">${done >= goal ? 'Week complete. Anything more is a bonus.' : 'Workouts this week'}</span><span class="ak-body-m-strong">${done} / ${goal}</span></div>
        <div class="bar"><i style="width:${Math.min(100, (done / goal) * 100)}%"></i></div></section>
      <section class="card stack"><h2 class="ak-h1">Your days</h2>
        <p class="ak-body-m">Tap the days you can make it. One to five. Change it whenever life does.</p>
        ${dayChips()}<p class="ak-body-m-strong">${splitLine()}</p></section>
      <section>${wp.map(r => `<div class="wk-row ${r.done ? 'is-done' : ''} ${r.isToday ? 'is-today' : ''} ${!r.wk ? 'off' : ''}">
          <div class="dow"><div class="ak-label-overline">${r.isToday ? 'Today' : DOW[r.d.getDay()]}</div><div class="ak-body-s">${r.d.getDate()}</div></div>
          <div class="grow"><div class="ak-body-m-strong">${r.wk ? esc(WORKOUTS[r.wk].name) : r.planned && r.past ? 'Missed. No big deal.' : 'Rest'}</div>
            ${r.wk ? `<div class="ak-body-s muted">${esc(WORKOUTS[r.wk].tag)}</div>` : ''}</div>
          <span class="dot">✓</span></div>`).join('')}</section>
      <section class="card stack"><h2 class="ak-h1">How it works</h2>
        <div class="prose ak-body-m">
          <p>Your workouts sit in a queue. Whenever you show up, you get the next one. Miss Thursday and Thursday's workout is simply waiting on Friday. Nothing to make up, nothing skipped.</p>
          <p>The number of days you pick decides the plan:</p>
          <div class="table"><b>1–2</b><span>Full body each time</span><b>3</b><span>Full body, three different sessions</span><b>4</b><span>Upper body / lower body, twice each</span><b>5</b><span>The four above, plus a lighter cardio and core day</span></div>
          <p>Two a week still builds muscle. More is a bonus, not a debt.</p>
        </div></section>`;
  }

  /* ---------- Progress ---------- */
  function spark(vals) {
    if (vals.length < 2) return '';
    const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
    const pts = vals.map((v, i) => [(i / (vals.length - 1)) * 296 + 2, 66 - ((v - lo) / span) * 60]);
    return `<svg class="spark" viewBox="0 0 300 72" preserveAspectRatio="none" aria-hidden="true"><path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')}"/></svg>`;
  }

  function viewProgress() {
    const t = now(), n = S.sessions.length;
    const wk = L.weekCount(S, t), prev = L.weekCount(S, t, 1);
    const vol = wk.reduce((a, s) => a + L.volume(s), 0), pvol = prev.reduce((a, s) => a + L.volume(s), 0);
    const delta = pvol ? Math.round(((vol - pvol) / pvol) * 100) : null;
    const msg = n === 0 ? 'Finish a workout and this starts counting.' : n < 3 ? 'Started. Honestly the hardest part.' : n < 9 ? 'A routine is forming. Strength shows up around here.' : n < 20 ? 'Everyday things start feeling lighter about now.' : 'Look at that number. That is all you.';

    const pbs = [];
    for (let i = S.sessions.length - 1; i >= 0 && pbs.length < 6; i--) for (const p of S.sessions[i].pbs || []) if (pbs.length < 6) pbs.push({ ...p, date: S.sessions[i].date });

    const lifts = {};
    S.sessions.forEach(s => s.ex.forEach(e => {
      if (EX[e.id].type !== 'w') return; const b = L.bestWeight(e); if (!b) return;
      (lifts[e.id] = lifts[e.id] || []).push({ date: s.date, w: e.sets.find(x => x.done).w, reps: e.sets.filter(x => x.done).map(x => x.r), best: b });
    }));
    const liftIds = Object.keys(lifts).sort((a, b) => EX[a].name.localeCompare(EX[b].name));

    const bw = S.settings.bw ? `<section class="card stack"><h2 class="ak-h1">Body weight</h2>
        <p class="ak-body-s muted">Watch the trend over months, not the number from this morning.</p>
        ${spark(S.bw.map(x => x.w))}
        ${S.bw.length ? `<p class="ak-body-m-strong">Latest: ${S.bw[S.bw.length - 1].w} lb · ${esc(fmtShort(L.parse(S.bw[S.bw.length - 1].date)))}</p>` : ''}
        <div class="row"><input class="field grow" id="bwIn" type="number" inputmode="decimal" step="any" placeholder="Today's weight, lb" aria-label="Body weight in pounds"><button class="btn btn-secondary small" data-act="bwadd">Save</button></div>
      </section>` : '';

    return `${topBar('Progress')}
      <section class="badge-wrap"><div class="badge ${n > 99 ? 'wide' : ''}">${n}</div>
        <div><div class="ak-label-overline">${n === 1 ? 'Workout done' : 'Workouts done'}</div><p class="ak-body-m">${msg}</p></div></section>
      <section><div class="bar-label"><span class="ak-body-s muted">This week</span><span class="ak-body-m-strong">${wk.length} / ${S.days.length}</span></div>
        <div class="bar"><i style="width:${Math.min(100, (wk.length / S.days.length) * 100)}%"></i></div></section>
      <section class="card stat"><div class="ak-label-overline">Lifted this week</div>
        <div class="ak-numeric-xl">${num(vol)}</div>
        <div class="ak-body-s muted">lb${delta != null && delta > 0 ? ' · +' + delta + '% vs last week' : ''}</div></section>
      ${pbs.length ? `<section class="stack"><h2 class="ak-h1">Personal bests</h2><div>${pbs.map(p => `<div class="list-row"><span class="grow ak-body-m-strong">${esc(EX[p.id].name)}</span><span class="ak-body-s muted">${esc(fmtShort(L.parse(p.date)))}</span><span class="tag pb">${p.w} lb</span></div>`).join('')}</div></section>` : ''}
      ${liftIds.length ? `<section class="stack"><h2 class="ak-h1">Your lifts</h2><div>${liftIds.map(id => {
        const h = lifts[id], best = Math.max(...h.map(x => x.best)), up = h.length > 1 ? h[h.length - 1].best - h[0].best : 0;
        return `<details class="list-row" style="display:block"><summary class="row"><span class="grow ak-body-m-strong">${esc(EX[id].name)}</span>
            ${up > 0 ? `<span class="ak-body-s" style="color:var(--ak-status-success-text)">+${up} lb</span>` : ''}<span class="num">${best} lb</span></summary>
          <div class="stack-s" style="padding-top:12px">${h.slice(-6).reverse().map(x => `<div class="row ak-body-s"><span class="muted" style="width:64px">${esc(fmtShort(L.parse(x.date)))}</span><span>${x.w} lb × ${x.reps.join(', ')}</span></div>`).join('')}</div></details>`;
      }).join('')}</div></section>` : ''}
      ${bw}
      ${n ? `<section class="stack"><h2 class="ak-h1">History</h2><div>${S.sessions.slice(-20).reverse().map(s => `<div class="list-row" style="align-items:flex-start"><div class="grow">
          <div class="ak-body-m-strong">${esc(WORKOUTS[s.wk].name)}</div>
          <div class="ak-body-s muted">${esc(fmtDate(L.parse(s.date)))} · ${plural(L.setsDone(s), 'set')}</div>
          ${s.note ? `<div class="ak-body-s" style="margin-top:4px">“${esc(s.note)}”</div>` : ''}</div>
          <button class="ak-caption muted" data-act="del" data-at="${s.finishedAt}" style="padding:8px">Delete</button></div>`).join('')}</div></section>` : ''}`;
  }

  /* ---------- Guide ---------- */
  function viewGuide() {
    const st = S.settings;
    const opt = (key, val, label) => `<button class="chip ${st[key] === val ? 'on' : ''}" data-act="set" data-k="${key}" data-v="${val}">${label}</button>`;
    return `${topBar('Guide')}
      <h1 class="ak-display-m title">Know-how</h1>
      <section class="card stack"><h2 class="ak-h1">Breathe out on the hard part</h2>
        <div class="prose ak-body-m"><p>The one rule for every lift here: breathe out as you push, pull or stand up. Breathe in on the easy part.</p>
        <p>Holding your breath and bearing down pushes pressure onto your pelvic floor. Breathing out takes it off. That single habit lets you lift properly while everything keeps rebuilding.</p></div></section>
      <section class="card stop stack"><h2 class="ak-h1">Ease off if you notice</h2>
        <div class="prose ak-body-m"><ul><li>Leaking during a lift</li><li>Heaviness, dragging or bulging down below</li><li>Your belly doming or coning along the middle</li><li>Sharp or pinching pain, anywhere</li></ul>
        <p>None of these are failure. They mean that exercise is a bit too much today. Drop the weight, shorten the movement, or use the swap.</p>
        <p>If any of them keep showing up, book a pelvic floor physical therapist. One visit can sort out what no app can see.</p></div></section>
      <section class="card stack"><h2 class="ak-h1">Your lower back</h2>
        <div class="prose ak-body-m"><p>Every workout ends with a few minutes for your core and back. It looks easy. It is the most important part of the plan, so do not skip it when you are short on time. Cut a main lift instead.</p>
        <p>On deadlifts and back extensions, a working, tired feeling in the muscles is the goal. A sharp or pinching feeling is your cue to stop and go lighter.</p></div></section>
      <section class="card stack"><h2 class="ak-h1">Sore vs. hurt</h2>
        <div class="prose ak-body-m"><p><b>Sore:</b> a dull ache in the muscle, a day or two later, that eases as you move. Normal. Welcome back.</p>
        <p><b>Hurt:</b> sharp, in a joint, or worse the next day. Skip that exercise and tell your doctor if it lingers.</p></div></section>
      <section class="card stack"><h2 class="ak-h1">How the weights go up</h2>
        <div class="prose ak-body-m"><p>Each lift has a rep range, like 8–12. Stay at the same weight until you hit the top number on every set. Then the app bumps the weight and you start again from the bottom of the range.</p>
        <p>Tell it how each lift felt. “Hard” holds the weight where it is. You never have to work out the next step yourself.</p></div></section>
      <section class="card stack"><h2 class="ak-h1">Missed a day?</h2>
        <div class="prose ak-body-m"><p>Then you missed a day. The workout waits. No streaks here, on purpose: with a baby in the house, the plan has to bend.</p></div></section>

      <section class="stack"><h2 class="ak-h1">Settings</h2><div>
        <div class="setting"><span class="ak-body-m-strong">Look</span><div class="chips">${opt('theme', 'auto', 'Auto')}${opt('theme', 'light', 'Light')}${opt('theme', 'dark', 'Dark')}</div></div>
        <div class="setting"><span class="ak-body-m-strong">Rest timer</span><div class="chips">${opt('rest', 60, '1:00')}${opt('rest', 75, '1:15')}${opt('rest', 90, '1:30')}${opt('rest', 0, 'Off')}</div></div>
        <div class="setting"><span><span class="ak-body-m-strong">Track body weight</span><br><span class="ak-body-s muted">Off unless you want it.</span></span><div class="chips">${opt('bw', false, 'Off')}${opt('bw', true, 'On')}</div></div>
      </div></section>
      <section class="stack"><h2 class="ak-h1">Your data</h2>
        <p class="ak-body-s muted">Everything is saved on this phone only. Download a backup now and then, especially before changing phones.</p>
        <div class="row wrap"><button class="btn btn-secondary small" data-act="export">Download backup</button><button class="btn btn-tertiary small" data-act="import">Restore</button></div>
        <input type="file" id="importFile" accept="application/json,.json" hidden>
        <button class="btn btn-tertiary small" data-act="reset" style="align-self:flex-start">Erase everything</button></section>
      <p class="ak-caption foot">General fitness guidance, not medical advice. You know your body: when in doubt, ask your doctor or a pelvic floor physical therapist.<br>Ash Kicker ${VERSION}</p>`;
  }

  /* ---------- render ---------- */
  function applyTheme() {
    const th = S.settings.theme;
    if (th === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = th;
  }
  function render(keepScroll) {
    const y = window.scrollY;
    view.innerHTML = ({ today: viewToday, week: viewWeek, progress: viewProgress, guide: viewGuide })[tab]();
    document.querySelectorAll('#tabs button').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    window.scrollTo(0, keepScroll ? y : 0);
  }

  /* ---------- rest timer ---------- */
  const restEl = $('#rest'), restTime = $('#restTime'), restFill = $('#restFill');
  let restEnd = 0, restLen = 0, restInt = 0, restHide = 0;
  function restStop() { clearInterval(restInt); clearTimeout(restHide); restEl.hidden = true; restEl.classList.remove('over'); }
  function restTick() {
    const left = Math.max(0, Math.ceil((restEnd - Date.now()) / 1000));
    restTime.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    restFill.style.width = (100 - (left / restLen) * 100) + '%';
    if (left <= 0) {
      clearInterval(restInt);
      restEl.classList.add('over'); restTime.textContent = 'Go';
      try { navigator.vibrate && navigator.vibrate([90, 70, 90]); } catch (e) { /* unsupported */ }
      restHide = setTimeout(restStop, 5000);
    }
  }
  function restStart(secs) {
    if (!secs) return;
    restStop(); restLen = secs; restEnd = Date.now() + secs * 1000;
    restEl.hidden = false; restTick(); restInt = setInterval(restTick, 250);
  }
  restEl.addEventListener('click', restStop);

  /* ---------- finish celebration ---------- */
  const party = $('#party'), fx = $('#partyFx');
  let partyRaf = 0, partyT = 0;
  const CHEERS = ['Ash kicked.', 'Peachy.', 'Nailed it.', 'Boom.', 'Crushed.', 'Done & dusted.'];
  const LINES = ['That one is in the books.', 'Future you says thanks.', 'Stronger than last week.', 'You showed up. That is the whole trick.', 'Go enjoy being smug about it.'];

  function partyClose() {
    if (party.hidden || party.classList.contains('out')) return;
    clearTimeout(partyT); party.classList.add('out');
    setTimeout(() => { cancelAnimationFrame(partyRaf); party.hidden = true; party.classList.remove('out'); }, 300);
  }
  party.addEventListener('click', partyClose);

  function confetti() {
    const css = getComputedStyle(document.documentElement);
    const colors = ['--ak-accent-energy', '--ak-accent-streak', '--ak-accent-peach', '--ak-status-success', '--ak-text-on-brand', '--ak-brand-tint']
      .map(v => css.getPropertyValue(v).trim()).filter(Boolean);
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    fx.width = W * dpr; fx.height = H * dpr;
    const g = fx.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const bits = [];
    const burst = (n, x, y, spread, power) => {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + rnd(-spread, spread), v = rnd(power * .45, power);
        bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: rnd(7, 15), r: rnd(0, 6.3), vr: rnd(-.3, .3), c: colors[i % colors.length], round: i % 4 === 0, wob: rnd(0, 6.3) });
      }
    };
    burst(90, W / 2, H * .95, .75, H * .034);          // the big one, from the bottom
    setTimeout(() => burst(45, W * .12, H * .7, .5, H * .026), 350);   // left cannon
    setTimeout(() => burst(45, W * .88, H * .7, .5, H * .026), 550);   // right cannon
    const t0 = performance.now();
    (function frame(t) {
      g.clearRect(0, 0, W, H);
      for (const b of bits) {
        b.vy += .32; b.vx *= .99; b.vy *= .99; b.wob += .12;
        b.x += b.vx + Math.sin(b.wob) * .8; b.y += b.vy; b.r += b.vr;
        g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.fillStyle = b.c;
        if (b.round) { g.beginPath(); g.arc(0, 0, b.s / 2, 0, 6.3); g.fill(); }
        else g.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2 * (.4 + Math.abs(Math.cos(b.wob))));
        g.restore();
      }
      if (t - t0 < 5200 && !party.hidden) partyRaf = requestAnimationFrame(frame); else g.clearRect(0, 0, W, H);
    })(t0);
  }

  function celebrate(ses) {
    const n = S.sessions.length, pb = ses.pbs && ses.pbs.length;
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('#partySub').textContent = WORKOUTS[ses.wk].name + ' · Workout #' + n;
    $('#partyTitle').textContent = n === 1 ? 'First one!' : pb ? 'New best!' : CHEERS[n % CHEERS.length];
    $('#partyLine').textContent = pb ? ses.pbs.map(p => EX[p.id].name + ' at ' + p.w + ' lb').join(' · ')
      : n === 1 ? 'That was the hardest one. It is all downhill from here.' : LINES[n % LINES.length];
    cancelAnimationFrame(partyRaf); clearTimeout(partyT);
    party.classList.remove('out'); party.hidden = false;
    if (!still) confetti();
    try { navigator.vibrate && navigator.vibrate([60, 50, 60, 50, 180]); } catch (e) { /* unsupported */ }
    partyT = setTimeout(partyClose, 5500);
  }

  /* ---------- actions ---------- */
  function toggleDay(d) {
    const i = S.days.indexOf(d);
    if (i >= 0) { if (S.days.length === 1) return; S.days.splice(i, 1); }
    else { if (S.days.length === 5) return; S.days.push(d); S.days.sort(); }
    if (S.cur && !L.anyDone(S.cur)) S.cur = null; // rebuild for the new split
  }

  const actions = {
    day(el) { toggleDay(+el.dataset.d); save(); render(true); },
    weekok() { S.weekOk = L.iso(L.monday(now())); save(); render(); },
    start() { S.skip = null; S.cur = L.buildSession(S, now()); ui.how = {}; ui.open = {}; save(); render(); },
    skip() { S.skip = L.iso(now()); S.cur = null; save(); render(); },
    how(el) { const i = +el.dataset.e; ui.how[i] = !ui.how[i]; render(true); },
    open(el) { ui.open[+el.dataset.e] = true; render(true); },
    swap(el) {
      const i = +el.dataset.e, c = S.cur, key = c.wk + ':' + c.ex[i].slot, id = el.dataset.id;
      if (id === WORKOUTS[c.wk].slots[c.ex[i].slot][0]) delete S.swap[key]; else S.swap[key] = id;
      c.ex[i] = L.buildEntry(S, c.wk, c.ex[i].slot);
      save(); render(true);
    },
    check(el) {
      const ei = +el.dataset.e, si = +el.dataset.s, e = S.cur.ex[ei], ex = EX[e.id], s = e.sets[si];
      if (!s.done) {
        const miss = ex.type === 'w' && s.w == null ? 'w' : ex.type !== 't' && !s.r ? 'r' : null;
        if (miss) { const inp = view.querySelector(`input[data-k="${miss}"][data-e="${ei}"][data-s="${si}"]`); if (inp) inp.focus(); return; }
      }
      s.done = !s.done;
      if (!s.done) { e.feel = null; ui.open[ei] = false; }
      save(); render(true);
      if (s.done) {
        const more = L.setsDone(S.cur) < L.setsTotal(S.cur);
        if (more && !ex.noFeel) restStart(WORKOUTS[S.cur.wk].slots[e.slot][1] ? Math.min(45, S.settings.rest) : S.settings.rest);
      } else restStop();
    },
    feel(el) { const ei = +el.dataset.e; S.cur.ex[ei].feel = el.dataset.f; ui.open[ei] = false; ui.how[ei] = false; save(); render(true); },
    finish() { restStop(); const ses = L.finish(S); ui.how = {}; ui.open = {}; save(); render(); if (ses) celebrate(ses); },
    set(el) {
      const k = el.dataset.k, raw = el.dataset.v;
      S.settings[k] = k === 'theme' ? raw : k === 'bw' ? raw === 'true' : +raw;
      applyTheme(); save(); render(true);
    },
    bwadd() {
      const v = parseFloat($('#bwIn').value); if (!(v > 0)) return;
      const d = L.iso(now()); S.bw = S.bw.filter(x => x.date !== d); S.bw.push({ date: d, w: v }); save(); render(true);
    },
    del(el) {
      if (!confirm('Delete this workout from your history? This cannot be undone.')) return;
      S.sessions = S.sessions.filter(s => String(s.finishedAt) !== el.dataset.at); save(); render(true);
    },
    export() {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }));
      a.download = 'ash-kicker-backup-' + L.iso(now()) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
    import() { $('#importFile').click(); },
    reset() {
      if (!confirm('Erase every workout and setting on this phone? This cannot be undone.')) return;
      S = L.defaultState(); save(); applyTheme(); tab = 'today'; render();
    }
  };

  view.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (el && actions[el.dataset.act] && el.tagName !== 'TEXTAREA') actions[el.dataset.act](el);
  });

  view.addEventListener('input', ev => {
    const el = ev.target;
    if (el.id === 'note') { const t = L.sessionsOn(S, L.iso(now())); if (t.length) { t[t.length - 1].note = el.value; saveSoon(); } return; }
    if (!el.dataset.k || !S.cur) return;
    const ei = +el.dataset.e, si = +el.dataset.s, e = S.cur.ex[ei];
    const v = el.value === '' ? null : Math.max(0, parseFloat(el.value));
    const val = v == null || isNaN(v) ? null : v;
    e.sets[si][el.dataset.k] = val;
    if (el.dataset.k === 'w') { // same weight for the sets still to come
      for (let j = si + 1; j < e.sets.length; j++) if (!e.sets[j].done) {
        e.sets[j].w = val;
        const o = view.querySelector(`input[data-k="w"][data-e="${ei}"][data-s="${j}"]`); if (o) o.value = val == null ? '' : val;
      }
    }
    saveSoon();
  });
  view.addEventListener('focusin', ev => { if (ev.target.matches('.set input')) ev.target.select(); });

  view.addEventListener('change', ev => {
    if (ev.target.id !== 'importFile' || !ev.target.files[0]) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const p = JSON.parse(fr.result);
        if (!p || !Array.isArray(p.sessions) || !Array.isArray(p.days)) throw new Error('bad');
        if (!confirm('Replace everything on this phone with this backup (' + plural(p.sessions.length, 'workout') + ')?')) return;
        const d = L.defaultState();
        S = Object.assign(d, p, { ptr: Object.assign(d.ptr, p.ptr), settings: Object.assign(d.settings, p.settings) });
        save(); applyTheme(); render();
      } catch (e) { alert('That file is not an Ash Kicker backup.'); }
    };
    fr.readAsText(ev.target.files[0]);
  });

  $('#tabs').addEventListener('click', ev => {
    const b = ev.target.closest('button[data-tab]'); if (!b) return;
    tab = b.dataset.tab; render();
  });

  // Coming back to the app on a new day: settle yesterday and show today.
  let shownDay = '';
  function refreshDay() {
    const ti = L.iso(now());
    if (ti === shownDay) return;
    shownDay = ti; L.settleStale(S, now()); save(); render();
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDay(); });

  /* ---------- boot ---------- */
  load(); applyTheme(); refreshDay();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
