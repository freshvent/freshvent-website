/* ============================================================
   FreshVent v2 — technician dashboard (DEMO, front-end only)
   The tech profile comes from the join form (partners.html),
   saved in localStorage under 'freshvent:tech'. Accepted /
   done jobs and earnings live in 'freshvent:jobs_state'.
   TODO: replace with real accounts + job API when the
   backend goes live. No login in this demo by design.
   ============================================================ */
(function () {
  var root = document.getElementById('dashboardRoot');
  if (!root) return;

  var TECH_KEY = 'freshvent:tech';
  var STATE_KEY = 'freshvent:jobs_state';

  function load(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v || fallback; }
    catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  var tech = load(TECH_KEY, null);
  var isDemo = false;
  if (!tech || !tech.name) {
    tech = { name: 'Alex R.', city: 'Richmond Hill', trade: 'Gas Technician 2 (G2)', years: '5–10 years' };
    isDemo = true;
  }
  var homeCity = FV_CITY_KM[tech.city] ? tech.city : 'Toronto';

  var state = load(STATE_KEY, { jobs: {} }); /* jobs: { id: {status:'accepted'|'done', price} } */
  if (!state.jobs) state.jobs = {};

  function money(n) { return '$' + Number(n || 0).toFixed(2).replace(/\.00$/, ''); }
  function initials(name) {
    return name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
  }
  function earnings() {
    var sum = 0;
    Object.keys(state.jobs).forEach(function (id) {
      if (state.jobs[id].status === 'done') sum += state.jobs[id].price;
    });
    return sum;
  }

  function jobCard(job, mode) {
    var p = fvJobPrice(job, homeCity);
    var price = (mode !== 'near' && state.jobs[job.id]) ? state.jobs[job.id].price : p.price;
    var btn = '';
    if (mode === 'near') {
      btn = '<button type="button" class="btn" data-accept="' + job.id + '">Accept job</button>';
    } else if (mode === 'mine') {
      btn = '<button type="button" class="btn dark" data-done="' + job.id + '">Mark done</button>';
    } else {
      btn = '<span class="job-done-tag">Done ✓ · +' + money(price) + '</span>';
    }
    return '<article class="job-card">' +
      '<div class="job-main"><h3>' + job.service + '</h3>' +
      '<p class="job-meta">' + job.area + ' · ' + job.city + ' — ' + p.distanceKm.toFixed(1) + ' km away</p>' +
      '<p class="job-meta">' + job.window + '</p></div>' +
      '<div class="job-side"><div class="job-price">' + money(price) + '</div>' + btn + '</div></article>';
  }

  function render() {
    var near = FV_JOBS.filter(function (j) { return !state.jobs[j.id]; })
      .sort(function (a, b) { return fvJobDistance(a, homeCity) - fvJobDistance(b, homeCity); });
    var mine = FV_JOBS.filter(function (j) { return state.jobs[j.id] && state.jobs[j.id].status === 'accepted'; });
    var done = FV_JOBS.filter(function (j) { return state.jobs[j.id] && state.jobs[j.id].status === 'done'; });

    document.getElementById('dashGreeting').textContent = 'Hi, ' + tech.name;
    document.getElementById('dashSub').textContent =
      'Based in ' + tech.city + (tech.trade ? ' · ' + tech.trade : '') +
      (isDemo ? ' · Demo profile — join from the Partners page to use your own details.' : '');
    document.getElementById('statNear').textContent = near.length;
    document.getElementById('statMine').textContent = mine.length;
    document.getElementById('statEarn').textContent = money(earnings());

    document.getElementById('jobList').innerHTML = near.length
      ? near.map(function (j) { return jobCard(j, 'near'); }).join('')
      : '<div class="card center"><h3>No new jobs right now</h3><p>You have accepted everything near you. New jobs appear here as customers book.</p></div>';

    var mineHtml = mine.map(function (j) { return jobCard(j, 'mine'); }).join('');
    var doneHtml = done.map(function (j) { return jobCard(j, 'done'); }).join('');
    document.getElementById('myJobList').innerHTML = (mineHtml + doneHtml) ||
      '<div class="card center"><h3>No jobs yet</h3><p>Accept a job from the list above and it will show up here.</p></div>';

    root.querySelectorAll('[data-accept]').forEach(function (b) {
      b.addEventListener('click', function () {
        var job = fvJobById(b.getAttribute('data-accept'));
        if (!job) return;
        state.jobs[job.id] = { status: 'accepted', price: fvJobPrice(job, homeCity).price };
        save(STATE_KEY, state);
        fvToast('Job accepted — see it under My jobs');
        render();
      });
    });
    root.querySelectorAll('[data-done]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-done');
        if (state.jobs[id]) {
          state.jobs[id].status = 'done';
          save(STATE_KEY, state);
          fvToast('Nice work — ' + money(state.jobs[id].price) + ' added to your earnings');
          render();
        }
      });
    });
  }

  render();
})();
