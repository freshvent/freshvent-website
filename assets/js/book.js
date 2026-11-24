/* ============================================================
   FreshVent v2 — SMART repair booking in THREE steps
   1 · Appliance FIRST → the problem list adapts to it, and the
       estimate gets smarter: visit price by appliance + a
       likely-repair RANGE by problem. Photo stays OPTIONAL.
   2 · Postal code FIRST → city auto-fills from the FSA and one
       short street field follows; then a calendar showing the
       assigned (nearest) technician's real availability.
   3 · Name + phone → confirmation with the full estimate.
   Submission is FRONT-END ONLY for now.
   TODO: POST the booking (+ photo) to the production endpoint
         (Web3Forms / FormSubmit) + CRM webhook; replace the
         demo assignment + availability with the real dispatch
         engine; replace the FSA city table below with Google
         Places address autocomplete.
   ============================================================ */

/* ---- appliance → problems + smart pricing table ----
   visit = diagnostic visit price for that appliance (CAD).
   Each problem: range = typical TOTAL repair range (CAD), or
   null when it can only be priced on site; note = the likely
   cause / parts, shown to the customer as an estimate. */
var FV_APPLIANCES = {
  'Furnace / Boiler': { visit: 99, problems: {
    'No heat':              { range: [180, 320], note: 'Often an ignitor or flame sensor.' },
    'Strange noise':        { range: [220, 480], note: 'Often the blower motor or a worn bearing.' },
    'Keeps turning on/off': { range: [190, 420], note: 'Often a sensor or the control board.' },
    'Weak airflow':         { range: [120, 300], note: 'Often the blower or a clogged filter.' }
  }},
  'Water Heater': { visit: 89, problems: {
    'No hot water':   { range: [160, 380], note: 'Often a heating element, thermocouple or gas valve.' },
    'Leaking':        { range: [150, 450], note: 'Often a valve or fitting — if the tank itself has failed, replacement is quoted on site.' },
    'Lukewarm water': { range: [150, 320], note: 'Often a heating element or dip tube.' },
    'Strange noise':  { range: [120, 220], note: 'Usually sediment in the tank — often fixed with a flush.' }
  }},
  'Air Conditioner': { visit: 99, problems: {
    'Not cooling':   { range: [180, 450], note: 'Often a capacitor or low refrigerant.' },
    'Leaking':       { range: [150, 380], note: 'Often a blocked drain line or the coil.' },
    'Ice on unit':   { range: [170, 400], note: 'Often airflow or refrigerant related.' },
    'Strange noise': { range: [220, 520], note: 'Often the fan motor or a loose panel.' }
  }},
  'Heat Pump': { visit: 109, problems: {
    'Not heating': { range: [220, 520], note: 'Often the reversing valve or defrost cycle.' },
    'Not cooling': { range: [180, 450], note: 'Often a capacitor or low refrigerant.' },
    'Icing up':    { range: [190, 420], note: 'Often the defrost board or a sensor.' }
  }},
  'Thermostat': { visit: 79, problems: {
    'Blank screen':      { range: [120, 260], note: 'Often wiring or power — or a new thermostat.' },
    'Wrong temperature': { range: [110, 240], note: 'Often the sensor or calibration.' },
    "Won't turn on":     { range: [120, 280], note: 'Often a fuse or wiring issue.' }
  }},
  'Something else': { visit: 99, problems: null } /* free text instead of a list */
};

/* Icon per problem label (keys of FV_ICON_PATHS in main.js) */
var FV_PROBLEM_ICONS = {
  'No heat': 'flame', 'Not heating': 'flame', 'No hot water': 'flame',
  'Not cooling': 'snow', 'Ice on unit': 'snow', 'Icing up': 'snow',
  'Strange noise': 'bolt', "Won't turn on": 'bolt',
  'Leaking': 'service', 'Keeps turning on/off': 'clock',
  'Weak airflow': 'air', 'Lukewarm water': 'thermostat',
  'Blank screen': 'thermostat', 'Wrong temperature': 'thermostat'
};

/* ---- FSA → city table for the zones we serve ----
   DEMO behaviour: a valid postal code auto-fills the city from
   its FSA and we then ask for ONE short street field (with the
   neighbourhood as helper text) instead of a long address form.
   TODO (production): replace with Google Places autocomplete
   for a true full-address lookup. */
var FV_FSA_CITY = {
  'L3P': 'Markham', 'L3S': 'Markham', 'L3X': 'Markham', 'L3Y': 'Markham',
  'L6B': 'Markham', 'L6C': 'Markham', 'L6E': 'Markham', 'L6G': 'Markham',
  'L3T': 'Richmond Hill', 'L4B': 'Richmond Hill', 'L4C': 'Richmond Hill',
  'L4E': 'Richmond Hill', 'L4S': 'Richmond Hill', 'L6H': 'Richmond Hill', 'L6J': 'Richmond Hill',
  'L4J': 'Vaughan', 'L4K': 'Vaughan', 'L4L': 'Vaughan', 'L6A': 'Vaughan', 'L4H': 'Vaughan',
  'L4A': 'Other', 'L4G': 'Other', 'L7B': 'Other'
};
function fvCityForPostal(norm) {
  if (!norm || !norm.valid) return '';
  if (FV_FSA_CITY[norm.fsa]) return FV_FSA_CITY[norm.fsa];
  if (norm.fsa.charAt(0) === 'M') {
    var two = norm.fsa.slice(0, 2);
    if (two === 'M1') return 'Scarborough';
    if (two === 'M2' || two === 'M3') return 'North York';
    return 'Toronto';
  }
  return '';
}

(function () {
  var form = document.getElementById('bookForm');
  if (!form) return;

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

  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }

  function showStep(n) {
    current = n;
    steps.forEach(function (s) { s.classList.toggle('active', Number(s.getAttribute('data-step')) === n); });
    if (fill) fill.style.width = (n / TOTAL * 100) + '%';
    labels.forEach(function (l, i) { l.classList.toggle('on', i < n); });
    if (n === 2) { renderCalendar(); updateEstimate(); }
    window.scrollTo({ top: form.offsetTop - 90, behavior: 'smooth' });
  }

  /* ================= STEP 1 — appliance → problems ================= */
  var selAppliance = '';
  var selProblem = '';

  function pickedApplianceData() { return selAppliance ? FV_APPLIANCES[selAppliance] : null; }

  function renderProblems() {
    var data = pickedApplianceData();
    var section = $('problemSection');
    var grid = $('problemGrid');
    var otherWrap = $('problemOtherWrap');
    selProblem = '';
    if (grid) grid.innerHTML = '';
    if (!data) {
      if (section) section.style.display = 'none';
      if (otherWrap) otherWrap.style.display = 'none';
      return;
    }
    if (data.problems) {
      if (section) section.style.display = 'block';
      if (otherWrap) otherWrap.style.display = 'none';
      Object.keys(data.problems).forEach(function (label) {
        var p = data.problems[label];
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pick-card';
        b.setAttribute('data-problem', label);
        b.innerHTML = '<span class="picon">' + fvIconSvg(FV_PROBLEM_ICONS[label] || 'wrench') +
          '</span><span><b>' + label + '</b><span>' + p.note + '</span></span>';
        b.addEventListener('click', function () {
          grid.querySelectorAll('.pick-card').forEach(function (x) { x.classList.remove('sel'); });
          b.classList.add('sel');
          selProblem = label;
          var err = $('problemError');
          if (err) err.style.display = 'none';
          updateEstimate();
        });
        grid.appendChild(b);
      });
    } else {
      /* "Something else" → free text instead of a list */
      if (section) section.style.display = 'none';
      if (otherWrap) otherWrap.style.display = 'block';
    }
  }

  form.querySelectorAll('[data-pick="appliance"]').forEach(function (c) {
    c.addEventListener('click', function () {
      form.querySelectorAll('[data-pick="appliance"]').forEach(function (x) { x.classList.remove('sel'); });
      c.classList.add('sel');
      selAppliance = c.getAttribute('data-value');
      var err = $('applianceError');
      if (err) err.style.display = 'none';
      renderProblems();
      updateEstimate();
    });
  });

  function problemLabel() {
    if (selAppliance === 'Something else') {
      var t = $('bkProblemOther');
      return t ? t.value.trim() : '';
    }
    return selProblem;
  }
  function problemData() {
    var data = pickedApplianceData();
    if (!data || !data.problems || !selProblem) return null;
    return data.problems[selProblem] || null;
  }

  /* ---------- optional nameplate photo ---------- */
  var photoInput = $('nameplatePhoto');
  if (photoInput) {
    photoInput.addEventListener('change', function () {
      var file = photoInput.files && photoInput.files[0];
      var preview = $('photoPreview');
      var img = $('photoPreviewImg');
      var name = $('photoName');
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

  /* ================= STEP 2 — postal, address, calendar ================= */
  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var selDateISO = '';
  var selSlot = '';

  function nextDays() {
    var out = [];
    var t = new Date();
    for (var i = 0; i < 7; i++) out.push(new Date(t.getFullYear(), t.getMonth(), t.getDate() + i));
    return out;
  }
  function isoOf(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function dayLabel(d) { return DAY_NAMES[d.getDay()] + ', ' + MON_NAMES[d.getMonth()] + ' ' + d.getDate(); }

  /* Demo assignment: nearest technician to the booking city */
  function assignedTech() {
    var city = $('bkCity') ? $('bkCity').value : '';
    var best = TECHS[0], bestKm = 25;
    TECHS.forEach(function (t) {
      var km = (TECH_KM[t.city] && TECH_KM[t.city][city]) || 25;
      if (km < bestKm) { bestKm = km; best = t; }
    });
    return { tech: best, km: bestKm };
  }

  function renderCalendar() {
    var strip = $('dayStrip');
    var row = $('slotRow');
    if (!strip || !row) return;
    var asg = assignedTech();
    var withEl = $('bookWith');
    if (withEl) {
      withEl.textContent = $('bkCity').value
        ? 'Book with ' + asg.tech.name + ' — nearest available · ' + asg.km + ' km away'
        : 'Book with the nearest available technician — enter your postal code to see live times.';
    }
    var keepISO = selDateISO;
    var keepSlot = selSlot;
    var days = nextDays();
    strip.innerHTML = '';
    var firstFree = -1;
    var selDay = null;
    days.forEach(function (d, idx) {
      var info = fvTechDay(asg.tech.name, d.getDay());
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'day-card';
      b.setAttribute('data-date', isoOf(d));
      b.innerHTML = '<b>' + DAY_NAMES[d.getDay()] + '</b><span>' + MON_NAMES[d.getMonth()] + ' ' + d.getDate() + '</span>' +
        (info.full ? '<small>Fully booked</small>' : '');
      if (info.full) {
        b.disabled = true;
      } else {
        if (firstFree < 0) firstFree = idx;
        if (isoOf(d) === keepISO) selDay = d;
        b.addEventListener('click', function () {
          selDateISO = isoOf(d);
          selSlot = '';
          renderCalendar();
        });
      }
      strip.appendChild(b);
    });
    if (!selDay && firstFree >= 0) { selDay = days[firstFree]; selDateISO = isoOf(selDay); keepSlot = ''; }
    if (!selDay) { selDateISO = ''; }
    strip.querySelectorAll('.day-card').forEach(function (b) {
      b.classList.toggle('sel', b.getAttribute('data-date') === selDateISO);
    });
    /* slots for the selected day — taken slots render disabled */
    row.innerHTML = '';
    selSlot = '';
    if (selDay) {
      fvTechDay(asg.tech.name, selDay.getDay()).slots.forEach(function (s) {
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'chip';
        c.textContent = s.label;
        if (s.taken) {
          c.disabled = true;
        } else {
          c.addEventListener('click', function () {
            row.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('sel'); });
            c.classList.add('sel');
            selSlot = s.label;
            var err = $('slotError');
            if (err) err.style.display = 'none';
          });
          if (s.label === keepSlot) { c.classList.add('sel'); selSlot = s.label; }
        }
        row.appendChild(c);
      });
    }
  }

  function updateAddressHint() {
    var hint = $('addressHint');
    if (!hint) return;
    var city = $('bkCity').value;
    var area = '';
    if (city && typeof FV_JOBS !== 'undefined') {
      for (var i = 0; i < FV_JOBS.length; i++) {
        if (FV_JOBS[i].city === city) { area = FV_JOBS[i].area; break; }
      }
    }
    hint.textContent = city
      ? city + (area ? ' — ' + area + ' area' : '') + '. Just your street number and name.'
      : 'Your city fills in from the postal code — we just need your street.';
  }

  /* Postal code FIRST: valid code → city auto-fill + area line,
     then focus moves to the one short street field. */
  var postalWasValid = false;
  function onPostal() {
    var postalEl = $('bkPostal');
    var n = fvNormalizePostal(postalEl.value);
    var check = fvCheckPostal(postalEl.value);
    if (n.valid) {
      var city = fvCityForPostal(n);
      if (city && $('bkCity').value !== city) $('bkCity').value = city;
      if (!postalWasValid && !$('bkAddress').value) $('bkAddress').focus();
      postalWasValid = true;
    } else {
      postalWasValid = false;
    }
    updateAddressHint();
    renderCalendar();
    updateEstimate();
  }

  /* ---------- smart live estimate ---------- */
  function estimate() {
    var data = pickedApplianceData();
    var visit = data ? data.visit : 99;
    var pdata = problemData();
    var postalEl = $('bkPostal');
    var check = fvCheckPostal(postalEl ? postalEl.value : '');
    var fee = check.valid && !check.inZone ? check.fee : 0;
    var subtotal = visit + fee;
    var hst = subtotal * FV_HST_RATE;
    return {
      check: check, visit: visit, fee: fee,
      range: pdata ? pdata.range : null,
      partsNote: pdata ? pdata.note : '',
      subtotal: subtotal, hst: hst, total: subtotal + hst
    };
  }
  function rangeText(range) { return range ? ('$' + range[0] + '–$' + range[1]) : ''; }
  function updateEstimate() {
    var est = estimate();
    setText('estDiagName', 'Diagnostic visit' + (selAppliance ? ' — ' + selAppliance : ''));
    setText('estDiag', fvMoney(est.visit));
    var repairEl = $('estRepair');
    if (repairEl) {
      if (est.range) repairEl.textContent = rangeText(est.range);
      else if (selAppliance && problemLabel()) repairEl.textContent = 'Priced on site';
      else repairEl.textContent = 'Pick appliance & problem';
    }
    var feeEl = $('estFee');
    if (feeEl) {
      if (!est.check.valid) feeEl.textContent = 'Enter postal code';
      else if (est.check.inZone) feeEl.textContent = 'FREE';
      else feeEl.textContent = fvMoney(est.fee);
      feeEl.className = (est.check.valid && est.check.inZone) ? 'free' : '';
    }
    setText('estHst', fvMoney(est.hst));
    setText('estTotal', fvMoney(est.total));
    var parts = $('estParts');
    if (parts) {
      parts.textContent = est.partsNote
        ? 'Likely cause: ' + est.partsNote + ' The range above is an estimate.'
        : '';
    }
    var note = $('estNote');
    if (note) {
      if (!est.check.valid) note.textContent = 'Add your postal code and the distance fee (if any) appears here — no surprises later.';
      else if (est.check.inZone) note.textContent = est.check.pretty + ' is in the free zone — no distance fee.';
      else note.textContent = est.check.pretty + ' is outside the free zone, so the $17.00 distance fee is included above.';
    }
  }
  var postalEl = $('bkPostal');
  if (postalEl) {
    postalEl.addEventListener('input', onPostal);
    postalEl.addEventListener('change', onPostal);
  }
  var cityEl = $('bkCity');
  if (cityEl) cityEl.addEventListener('change', function () {
    updateAddressHint();
    renderCalendar();
    updateEstimate();
  });

  /* ---------- validation ---------- */
  function markInvalid(input, bad) {
    var field = input && input.closest('.field');
    if (field) field.classList.toggle('invalid', bad);
    return !bad;
  }
  function requireValue(id) {
    var el = $(id);
    if (!el) return true;
    return markInvalid(el, !el.value || !el.value.trim());
  }
  function validateStep(n) {
    var ok = true;
    if (n === 1) {
      var hasApp = !!selAppliance;
      var aerr = $('applianceError');
      if (aerr) aerr.style.display = hasApp ? 'none' : 'block';
      ok = hasApp;
      if (hasApp) {
        if (selAppliance === 'Something else') {
          ok = requireValue('bkProblemOther') && ok;
        } else {
          var hasProb = !!selProblem;
          var perr = $('problemError');
          if (perr) perr.style.display = hasProb ? 'none' : 'block';
          ok = hasProb && ok;
        }
      }
    }
    if (n === 2) {
      var postal = $('bkPostal');
      ok = markInvalid(postal, !fvNormalizePostal(postal.value).valid) && ok;
      ok = requireValue('bkCity') && ok;
      ok = requireValue('bkAddress') && ok;
      var hasSlot = !!selSlot && !!selDateISO;
      var serr = $('slotError');
      if (serr) serr.style.display = hasSlot ? 'none' : 'block';
      ok = hasSlot && ok;
    }
    if (n === 3) {
      ok = requireValue('bkName') && ok;
      var phone = $('bkPhone');
      ok = markInvalid(phone, phone.value.replace(/\D/g, '').length < 10) && ok;
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
    var city = $('bkCity').value;
    var est = estimate();
    var asg = assignedTech();
    var days = nextDays();
    var chosen = null;
    days.forEach(function (d) { if (isoOf(d) === selDateISO) chosen = d; });
    var whenLabel = chosen ? dayLabel(chosen) : selDateISO;
    var payload = {
      appliance: selAppliance,
      problem: problemLabel(),
      nameplatePhotoAttached: !!photoDataUrl,
      city: city,
      postal: $('bkPostal').value,
      address: $('bkAddress').value,
      date: selDateISO,
      time: selSlot,
      name: $('bkName').value,
      phone: $('bkPhone').value,
      technician: asg.tech.name,
      estimate: {
        visit: est.visit, likelyRepairRange: est.range,
        distanceFee: est.fee, hst: est.hst, totalDueAtVisit: est.total
      }
    };
    if (window.console) console.log('FreshVent booking v3 (demo submit):', payload);

    var ref = 'FV-' + Date.now().toString(36).toUpperCase().slice(-6);
    setText('bookingRef', ref);
    setText('confirmSummary', payload.appliance + ' · ' + payload.problem);
    setText('confirmAddress', payload.address + ', ' + city + ' ' + fvNormalizePostal(payload.postal).pretty);
    setText('confirmWhen', whenLabel + ' · ' + selSlot);
    setText('techName', asg.tech.name);
    setText('techMeta', '★ ' + asg.tech.rating + ' · ' + asg.tech.jobs + ' jobs done · ' + asg.km + ' km away');
    setText('techWindow', 'Arriving ' + whenLabel + ' · ' + selSlot);
    var av = $('techAvatar');
    if (av) av.textContent = asg.tech.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
    setText('cVisit', fvMoney(est.visit));
    setText('cRepair', est.range ? rangeText(est.range) : 'Priced on site after diagnosis');
    var cFee = $('cFee');
    if (cFee) {
      cFee.textContent = est.fee ? fvMoney(est.fee) : 'FREE';
      cFee.className = est.fee ? '' : 'free';
    }
    setText('cParts', est.partsNote ? 'Likely cause: ' + est.partsNote : '');
    setText('confirmTotal', fvMoney(est.total));

    steps.forEach(function (s) { s.classList.remove('active'); });
    var success = $('bookSuccess');
    if (success) { success.style.display = 'block'; success.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (fill) fill.style.width = '100%';
    labels.forEach(function (l) { l.classList.add('on'); });
  });

  showStep(1);
  renderCalendar();
  updateEstimate();
})();
