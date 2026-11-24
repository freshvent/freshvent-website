/* ============================================================
   FreshVent — multi-step booking / consultation form
   Steps: 1 service type · 2 equipment · 3 nameplate photo ·
          4 contact & timing · 5 review & submit
   Submission is FRONT-END ONLY for now.
   TODO: POST the collected data (and photo) to the production
         form endpoint (Web3Forms / FormSubmit) + CRM webhook.
   ============================================================ */
(function () {
  var form = document.getElementById('bookForm');
  if (!form) return;

  var current = 1;
  var TOTAL = 5;
  var steps = form.querySelectorAll('.book-step');
  var fill = document.getElementById('bookProgressFill');
  var labels = document.querySelectorAll('.progress-labels span');
  var photoDataUrl = '';

  function showStep(n) {
    current = n;
    steps.forEach(function (s) { s.classList.toggle('active', Number(s.getAttribute('data-step')) === n); });
    if (fill) fill.style.width = (n / TOTAL * 100) + '%';
    labels.forEach(function (l, i) { l.classList.toggle('on', i < n); });
    if (n === 5) buildReview();
    window.scrollTo({ top: form.offsetTop - 90, behavior: 'smooth' });
  }

  /* ---------- validation helpers ---------- */
  function markInvalid(input, bad) {
    var field = input.closest('.field') || input.closest('.radio-cards');
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
      var picked = form.querySelector('input[name="serviceType"]:checked');
      var wrap = document.getElementById('serviceTypeWrap');
      if (wrap) wrap.classList.toggle('invalid', !picked);
      var err = document.getElementById('serviceTypeError');
      if (err) err.style.display = picked ? 'none' : 'block';
      ok = !!picked;
    }
    if (n === 2) {
      ok = requireValue('eqType') && ok;
      ok = requireValue('eqBrand') && ok;
      ok = requireValue('eqAge') && ok;
    }
    if (n === 4) {
      ok = requireValue('ctName') && ok;
      var email = document.getElementById('ctEmail');
      var emailOk = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
      ok = markInvalid(email, !emailOk) && ok;
      var phone = document.getElementById('ctPhone');
      var phoneOk = phone && phone.value.replace(/\D/g, '').length >= 10;
      ok = markInvalid(phone, !phoneOk) && ok;
      ok = requireValue('ctAddress') && ok;
      ok = requireValue('ctCity') && ok;
      ok = requireValue('ctPostal') && ok;
      var postal = document.getElementById('ctPostal');
      ok = markInvalid(postal, !fvNormalizePostal(postal.value).valid) && ok;
      ok = requireValue('ctDate') && ok;
      ok = requireValue('ctTime') && ok;
    }
    return ok;
  }

  /* ---------- radio card highlight ---------- */
  form.querySelectorAll('.radio-card input').forEach(function (r) {
    r.addEventListener('change', function () {
      form.querySelectorAll('.radio-card').forEach(function (c) { c.classList.remove('sel'); });
      r.closest('.radio-card').classList.add('sel');
      var err = document.getElementById('serviceTypeError');
      if (err) err.style.display = 'none';
    });
  });

  /* ---------- nameplate photo ---------- */
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

  /* ---------- review ---------- */
  function val(id) { var el = document.getElementById(id); return el ? (el.value || '—') : '—'; }
  function buildReview() {
    var svc = form.querySelector('input[name="serviceType"]:checked');
    var rows = [
      ['Service requested', svc ? svc.value : '—'],
      ['Equipment type', val('eqType')],
      ['Brand', val('eqBrand')],
      ['Model', val('eqModel')],
      ['Serial number', val('eqSerial')],
      ['Equipment age', val('eqAge')],
      ['Nameplate photo', photoDataUrl ? 'Attached ✓' : 'Not attached'],
      ['Name', val('ctName')],
      ['Email', val('ctEmail')],
      ['Phone', val('ctPhone')],
      ['Address', val('ctAddress') + ', ' + val('ctCity') + ' ' + val('ctPostal')],
      ['Preferred visit', val('ctDate') + ' · ' + val('ctTime')],
      ['Notes', val('ctNotes')]
    ];
    var dl = document.getElementById('reviewList');
    if (dl) {
      dl.innerHTML = rows.map(function (r) {
        return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>';
      }).join('');
    }
    var img = document.getElementById('reviewPhoto');
    if (img) {
      img.src = photoDataUrl || '';
      img.style.display = photoDataUrl ? 'block' : 'none';
    }
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
  form.querySelectorAll('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () { showStep(Number(b.getAttribute('data-goto'))); });
  });

  /* ---------- submit (front-end only) ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    /* TODO: send `payload` + photo to the production endpoint/CRM. */
    var payload = {
      serviceType: (form.querySelector('input[name="serviceType"]:checked') || {}).value || '',
      equipment: { type: val('eqType'), brand: val('eqBrand'), model: val('eqModel'), serial: val('eqSerial'), age: val('eqAge') },
      nameplatePhotoAttached: !!photoDataUrl,
      contact: { name: val('ctName'), email: val('ctEmail'), phone: val('ctPhone'), address: val('ctAddress'), city: val('ctCity'), postal: val('ctPostal') },
      preferred: { date: val('ctDate'), time: val('ctTime') },
      notes: val('ctNotes')
    };
    if (window.console) console.log('FreshVent booking (demo submit):', payload);

    var ref = 'FV-' + Date.now().toString(36).toUpperCase().slice(-6);
    var refEl = document.getElementById('bookingRef');
    if (refEl) refEl.textContent = ref;
    var sumEl = document.getElementById('bookingSuccessSummary');
    if (sumEl) {
      sumEl.textContent = payload.serviceType + ' · ' + payload.contact.name + ' · ' +
        payload.preferred.date + ' (' + payload.preferred.time + ')';
    }
    steps.forEach(function (s) { s.classList.remove('active'); });
    var success = document.getElementById('bookSuccess');
    if (success) { success.style.display = 'block'; success.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (fill) fill.style.width = '100%';
    labels.forEach(function (l) { l.classList.add('on'); });
  });

  showStep(1);
})();
