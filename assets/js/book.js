/* ============================================================
   FreshVent v2 — repair booking in THREE steps
   1 · What's the problem? (big cards + appliance + optional photo)
   2 · Where & when (city, postal, date, time) + live estimate
   3 · Your details → confirmation with assigned technician
   Submission is FRONT-END ONLY for now.
   TODO: POST the booking (+ photo) to the production endpoint
         (Web3Forms / FormSubmit) and the CRM webhook, and
         replace the demo technician assignment with the real
         dispatch engine.
   ============================================================ */
(function () {
  var form = document.getElementById('bookForm');
  if (!form) return;

  var DIAGNOSTIC = 89.00; /* flat diagnostic visit, matches the shop price */
  var TOTAL = 3;
  var current = 1;
  var steps = form.querySelectorAll('.book-step');
  var fill = document.getElementById('bookProgressFill');
  var labels = document.querySelectorAll('.progress-labels span');
  var photoDataUrl = '';

  /* Demo technician pool for the confirmation assignment */
  var TECHS = [
    { name: 'Alex R.',   city: 'Richmond Hill', rating: '4.9', jobs: 312 },
    { name: 'Sam K.',    city: 'Markham',       rating: '4.8', jobs: 268 },
    { name: 'Jordan M.', city: 'Toronto',       rating: '4.9', jobs: 401 },
    { name: 'Priya D.',  city: 'Vaughan',       rating: '5.0', jobs: 187 }
  ];
  var TECH_KM = { /* rough km from each tech's base to the booking city */
    'Richmond Hill': { 'Richmond Hill': 3, 'Markham': 9, 'Vaughan': 15, 'North York': 17, 'Scarborough': 21, 'Toronto': 29, 'Other': 22 },
    'Markham':       { 'Markham': 3, 'Richmond Hill': 9, 'Scarborough': 15, 'North York': 16, 'Vaughan': 21, 'Toronto': 31, 'Other': 24 },
    'Toronto':       { 'Toronto': 4, 'North York': 15, 'Scarborough': 19, 'Vaughan': 33, 'Markham': 31, 'Richmond Hill': 29, 'Other': 26 },
    'Vaughan':       { 'Vaughan': 4, 'Richmond Hill': 15, 'North York': 19, 'Markham': 21, 'Toronto': 33, 'Scarborough': 35, 'Other': 27 }
  };

  function showStep(n) {
    current = n;
    steps.forEach(function (s) { s.classList.toggle('active', Number(s.getAttribute('data-step')) === n); });
    if (fill) fill.style.width = (n / TOTAL * 100) + '%';
    labels.forEach(function (l, i) { l.classList.toggle('on', i < n); });
    if (n === 2) updateEstimate();
    window.scrollTo({ top: form.offsetTop - 90, behavior: 'smooth' });
  }

  /* ---------- pick cards & chips (single-select groups) ---------- */
  function pickGroup(name) {
    var cards = form.querySelectorAll('[data-pick="' + name + '"]');
    cards.forEach(function (c) {
      c.addEventListener('click', function () {
        cards.forEach(function (x) { x.classList.remove('sel'); });
        c.classList.add('sel');
        if (name === 'problem') {
          var err = document.getElementById('problemError');
          if (err) err.style.display = 'none';
        }
      });
    });
  }
  pickGroup('problem');
  pickGroup('appliance');
  pickGroup('time');
  function picked(name) {
    var el = form.querySelector('[data-pick="' + name + '"].sel');
    return el ? el.getAttribute('data-value') : '';
  }

  /* ---------- optional nameplate photo ---------- */
  var photoInput = document.getElementById('nameplatePhoto');
  if (photoInput) {
    photoInput.addEventListener('change', function () {
      var file = photoInput.files && photoInput.files[0];
      var preview = document.getElementById('photoPreview');
      var img = document.getElementById('photoPreviewImg');
      var name = document.getElementById('photoName');
      if (!file) { if (preview) preview.style.display = 'none'; photoDataUrl = ''; return; }
      var reader = new FileReader();
      reader.onload = function (ev) {
        photoDataUrl = ev.target.result;
        if (img) img.src = photoDataUrl;
        if (name) name.textContent = file.name;
        if (preview) preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- live estimate (step 2) ---------- */
  function estimate() {
    var postalEl = document.getElementById('bkPostal');
    var check = fvCheckPostal(postalEl ? postalEl.value : '');
    var fee = check.valid && !check.inZone ? check.fee : 0;
    var subtotal = DIAGNOSTIC + fee;
    var hst = subtotal * FV_HST_RATE;
    return { check: check, fee: fee, subtotal: subtotal, hst: hst, total: subtotal + hst };
  }
  function updateEstimate() {
    var est = estimate();
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('estDiag', fvMoney(DIAGNOSTIC));
    var feeEl = document.getElementById('estFee');
    if (feeEl) {
      if (!est.check.valid) feeEl.textContent = 'Enter postal code';
      else if (est.check.inZone) feeEl.textContent = 'FREE';
      else feeEl.textContent = fvMoney(est.fee);
      feeEl.className = (est.check.valid && est.check.inZone) ? 'free' : '';
    }
    set('estHst', fvMoney(est.hst));
    set('estTotal', fvMoney(est.total));
    var note = document.getElementById('estNote');
    if (note) {
      if (!est.check.valid) note.textContent = 'Add your postal code and the distance fee (if any) appears here — no surprises later.';
      else if (est.check.inZone) note.textContent = est.check.pretty + ' is in the free zone — no distance fee.';
      else note.textContent = est.check.pretty + ' is outside the free zone, so the $17.00 distance fee is included above.';
    }
  }
  ['bkPostal', 'bkCity'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.addEventListener('input', updateEstimate); el.addEventListener('change', updateEstimate); }
  });

  /* ---------- validation ---------- */
  function markInvalid(input, bad) {
    var field = input && input.closest('.field');
    if (field) field.classList.toggle('invalid', bad);
    return !bad;
  }
  function requireValue(id) {
    var el = document.getElementById(id);
    if (!el) return true;
    return markInvalid(el, !el.value || !el.value.trim());
  }
  function validateStep(n) {
    var ok = true;
    if (n === 1) {
      var has = !!picked('problem');
      var err = document.getElementById('problemError');
      if (err) err.style.display = has ? 'none' : 'block';
      ok = has;
    }
    if (n === 2) {
      ok = requireValue('bkCity') && ok;
      var postal = document.getElementById('bkPostal');
      ok = markInvalid(postal, !fvNormalizePostal(postal.value).valid) && ok;
      ok = requireValue('bkDate') && ok;
      var hasTime = !!picked('time');
      var terr = document.getElementById('timeError');
      if (terr) terr.style.display = hasTime ? 'none' : 'block';
      ok = hasTime && ok;
    }
    if (n === 3) {
      ok = requireValue('bkName') && ok;
      var phone = document.getElementById('bkPhone');
      ok = markInvalid(phone, phone.value.replace(/\D/g, '').length < 10) && ok;
      ok = requireValue('bkAddress') && ok;
    }
    return ok;
  }

  /* ---------- nav buttons ---------- */
  form.querySelectorAll('[data-next]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (validateStep(current) && current < TOTAL) showStep(current + 1);
    });
  });
  form.querySelectorAll('[data-back]').forEach(function (b) {
    b.addEventListener('click', function () { if (current > 1) showStep(current - 1); });
  });

  /* ---------- submit (front-end only) → confirmation ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(3)) return;
    var city = document.getElementById('bkCity').value;
    var payload = {
      problem: picked('problem'),
      appliance: picked('appliance') || 'Not specified',
      nameplatePhotoAttached: !!photoDataUrl,
      city: city,
      postal: document.getElementById('bkPostal').value,
      date: document.getElementById('bkDate').value,
      time: picked('time'),
      name: document.getElementById('bkName').value,
      phone: document.getElementById('bkPhone').value,
      address: document.getElementById('bkAddress').value,
      estimate: estimate()
    };
    if (window.console) console.log('FreshVent booking v2 (demo submit):', payload);

    /* Demo assignment: nearest technician to the booking city */
    var best = TECHS[0], bestKm = Infinity;
    TECHS.forEach(function (t) {
      var km = (TECH_KM[t.city] && TECH_KM[t.city][city]) || 25;
      if (km < bestKm) { bestKm = km; best = t; }
    });

    var ref = 'FV-' + Date.now().toString(36).toUpperCase().slice(-6);
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('bookingRef', ref);
    set('confirmSummary', payload.problem + ' · ' + payload.date + ' · ' + payload.time);
    set('techName', best.name);
    set('techMeta', '★ ' + best.rating + ' · ' + best.jobs + ' jobs done · ' + bestKm + ' km away');
    set('techWindow', 'Arriving ' + payload.date + ' · ' + payload.time);
    var av = document.getElementById('techAvatar');
    if (av) av.textContent = best.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
    set('confirmTotal', fvMoney(payload.estimate.total));

    steps.forEach(function (s) { s.classList.remove('active'); });
    var success = document.getElementById('bookSuccess');
    if (success) { success.style.display = 'block'; success.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (fill) fill.style.width = '100%';
    labels.forEach(function (l) { l.classList.add('on'); });
  });

  showStep(1);
  updateEstimate();
})();
