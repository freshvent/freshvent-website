/* ============================================================
   FreshVent v2 — shared site behaviour
   (nav, icons, shop grid, postal checker, FAQ, forms)
   ============================================================ */

/* Inline SVG line icons (cyan stroke, no external images) */
var FV_ICON_PATHS = {
  filter: '<rect x="4" y="4" width="40" height="40" rx="4"/><path d="M4 14h40M4 24h40M4 34h40"/>',
  thermostat: '<circle cx="24" cy="24" r="17"/><path d="M24 33V19"/><circle cx="24" cy="34" r="3.4"/><path d="M33 12l3-3"/>',
  part: '<path d="M30 6a10 10 0 1 0 8 15L46 13l-4-4 3-5-6-2-2 4-5-1-3 4z" transform="scale(0.92) translate(2 2)"/><circle cx="15" cy="33" r="4"/>',
  service: '<circle cx="24" cy="24" r="18"/><path d="M24 14v10l7 5"/>',
  air: '<path d="M6 18h22a6 6 0 1 0-6-6M6 27h30a6 6 0 1 1-6 6M6 36h16a5 5 0 1 1-5 5"/>',
  flame: '<path d="M24 4s12 12 12 24a12 12 0 0 1-24 0c0-5 2-9 5-13 1 3 3 5 5 6-1-6 0-12 2-17z"/>',
  snow: '<path d="M24 4v40M8 12l32 24M40 12L8 36M24 4l-5 6M24 4l5 6M24 44l-5-6M24 44l5-6"/>',
  phone: '<path d="M8 6h10l3 12-6 4a28 28 0 0 0 11 11l4-6 12 3v10a3 3 0 0 1-3 3C21 42 6 27 5 9a3 3 0 0 1 3-3z"/>',
  shield: '<path d="M24 4l16 6v12c0 10-7 17-16 22C15 39 8 32 8 22V10z"/><path d="M16 24l6 6 11-12"/>',
  clock: '<circle cx="24" cy="24" r="19"/><path d="M24 13v11l8 5"/>',
  pin: '<path d="M24 44S8 29 8 18a16 16 0 0 1 32 0c0 11-16 26-16 26z"/><circle cx="24" cy="18" r="6"/>',
  check: '<path d="M8 25l11 11L40 13"/>',
  bolt: '<path d="M27 3L8 28h12l-2 17 19-25H25z"/>',
  calendar: '<rect x="6" y="9" width="36" height="34" rx="4"/><path d="M6 19h36M16 4v9M32 4v9"/>',
  card: '<rect x="4" y="10" width="40" height="28" rx="4"/><path d="M4 19h40M9 31h10"/>',
  wrench: '<path d="M31 5a9.5 9.5 0 0 0-6.4 16.4L7 39a4.24 4.24 0 1 0 6 6l17.6-17.6A9.5 9.5 0 0 0 43 21l-6.5 6.5-6-2-2-6z"/>',
  home: '<path d="M6 22L24 6l18 16M11 19v21h26V19"/>',
  hardhat: '<path d="M13 33v-6.5C13 19 17.5 13.5 24 12.5V6h0v6.5C30.5 13.5 35 19 35 26.5V33M6 33h36v7H6z"/>'
};
function fvIconSvg(key) {
  var p = FV_ICON_PATHS[key] || FV_ICON_PATHS.part;
  return '<svg viewBox="0 0 48 48" fill="none" stroke="#1B9BD1" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
}

document.addEventListener('DOMContentLoaded', function () {
  /* footer year */
  document.querySelectorAll('.js-year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* mobile nav */
  var toggle = document.querySelector('.nav-toggle');
  var mnav = document.querySelector('.mobile-nav');
  if (toggle && mnav) {
    toggle.addEventListener('click', function () {
      var open = mnav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* hydrate [data-icon] placeholders */
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    el.innerHTML = fvIconSvg(el.getAttribute('data-icon'));
  });

  /* ---------- shop grid ---------- */
  var grid = document.getElementById('productGrid');
  if (grid && typeof FV_PRODUCTS !== 'undefined') {
    var searchInput = document.getElementById('shopSearch');
    var activeCat = 'All';
    function renderShop() {
      var q = (searchInput && searchInput.value || '').toLowerCase();
      var list = FV_PRODUCTS.filter(function (p) {
        var catOk = activeCat === 'All' || p.category === activeCat;
        var qOk = !q || (p.name + ' ' + p.blurb + ' ' + p.category).toLowerCase().indexOf(q) !== -1;
        return catOk && qOk;
      });
      grid.innerHTML = list.length ? list.map(function (p) {
        return '<article class="card product-card">' +
          '<div class="product-art">' + fvIconSvg(p.icon) +
          (p.img ? '<img class="product-photo" src="' + p.img + '" alt="" loading="lazy" onerror="this.remove()">' : '') +
          '</div>' +
          '<div class="product-cat">' + p.category + '</div>' +
          '<h3>' + p.name + '</h3><p>' + p.blurb + '</p>' +
          '<div class="product-price">' + fvMoney(p.price) + ' <small style="font-size:.8rem;color:var(--muted);font-weight:600">CAD</small></div>' +
          '<button type="button" class="btn" data-add="' + p.id + '">Add to Cart</button></article>';
      }).join('') : '<div class="empty-note">No products match your search. Try a different term or category.</div>';
      grid.querySelectorAll('[data-add]').forEach(function (b) {
        b.addEventListener('click', function () { fvCartAdd(b.getAttribute('data-add')); });
      });
    }
    document.querySelectorAll('[data-cat]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('[data-cat]').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        activeCat = chip.getAttribute('data-cat');
        renderShop();
      });
    });
    if (searchInput) searchInput.addEventListener('input', renderShop);
    renderShop();
  }

  /* ---------- postal-code checker widgets ----------
     data-zone-form="cart" → saves the postal code + cart fee (v1 behaviour).
     Any other value → three-state message: free / fee / not-yet (waitlist). */
  document.querySelectorAll('[data-zone-form]').forEach(function (form) {
    var input = form.querySelector('[data-zone-input]');
    var result = form.parentElement.querySelector('[data-zone-result]');
    var isCart = form.getAttribute('data-zone-form') === 'cart';
    if (isCart && input && fvSavedPostal()) input.value = fvSavedPostal();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!input || !result) return;
      result.className = 'zone-result';
      if (isCart) {
        var check = fvCheckPostal(input.value);
        fvSavePostal(check.valid ? check.pretty : '');
        if (typeof fvCartRenderPage === 'function') fvCartRenderPage();
        if (!check.valid) {
          result.classList.add('bad');
          result.textContent = 'Please enter a valid Canadian postal code (e.g., L4C 1A1).';
        } else if (check.inZone) {
          result.classList.add('ok');
          result.textContent = 'Good news — ' + check.pretty + ' is inside our free service zone (Richmond Hill / Markham / Toronto). No distance fee applies.';
        } else {
          result.classList.add('fee');
          result.textContent = check.pretty + ' is outside the free zone. A distance fee may apply in the wider GTA — we will confirm your exact final quote by phone.';
        }
        return;
      }
      var st = fvZoneStatus(input.value);
      if (!st.valid) {
        result.classList.add('bad');
        result.textContent = 'Please enter a valid Canadian postal code (e.g., L4C 1A1).';
      } else if (st.status === 'free') {
        result.classList.add('ok');
        result.textContent = 'Good news — ' + st.pretty + ' is in our free zone. No distance fee, ever.';
      } else if (st.status === 'fee') {
        result.classList.add('fee');
        result.textContent = 'We serve ' + st.pretty + ' — a distance fee may apply in the wider GTA, and your exact final quote is given privately by phone.';
      } else {
        result.classList.add('fee');
        result.innerHTML = 'We don\'t serve ' + st.pretty + ' yet — we\'re expanding city by city. ' +
          '<a href="service-area.html#waitlist"><b>Join the waitlist</b></a> and we\'ll tell you the moment we arrive.';
      }
    });
  });

  /* ---------- plans page: Choose-plan buttons add the first month to the cart ---------- */
  document.querySelectorAll('[data-plan-add]').forEach(function (b) {
    b.addEventListener('click', function () { fvCartAdd(b.getAttribute('data-plan-add')); });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.parentElement.classList.toggle('open');
    });
  });

  /* ---------- demo checkout ---------- */
  var payBtn = document.getElementById('payBtn');
  if (payBtn) {
    payBtn.addEventListener('click', function () {
      var done = document.getElementById('checkoutDone');
      var totals = fvCartTotals();
      if (done) {
        done.classList.add('ok');
        done.style.display = 'block';
        done.querySelector('[data-order-total]').textContent = fvMoney(totals.total);
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      fvCartSet([]);
      fvCartRenderPage();
    });
  }

  /* ---------- generic front-end-only forms with a success box ---------- */
  function demoForm(formId, successId) {
    var f = document.getElementById(formId);
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      /* TODO: wire this form to the production endpoint (Web3Forms/FormSubmit) + CRM. */
      var ok = document.getElementById(successId);
      if (ok) { ok.classList.add('ok'); ok.style.display = 'block'; ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      f.reset();
    });
  }
  demoForm('contactForm', 'contactSuccess');
  demoForm('waitlistForm', 'waitlistSuccess');
  demoForm('branchForm', 'branchSuccess');

  /* ---------- technician join form (partners.html) ----------
     No account, no password: save the profile locally and go
     straight to the technician dashboard.
     TODO: POST the profile to the production endpoint + CRM. */
  var join = document.getElementById('joinForm');
  if (join) {
    join.addEventListener('submit', function (e) {
      e.preventDefault();
      var get = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var bad = function (id, isBad) {
        var el = document.getElementById(id);
        var field = el && el.closest('.field');
        if (field) field.classList.toggle('invalid', isBad);
        return !isBad;
      };
      var ok = true;
      ok = bad('pfName', !get('pfName')) && ok;
      ok = bad('pfPhone', get('pfPhone').replace(/\D/g, '').length < 10) && ok;
      ok = bad('pfCity', !get('pfCity')) && ok;
      ok = bad('pfTrade', !get('pfTrade')) && ok;
      if (!ok) return;
      var profile = {
        name: get('pfName'),
        phone: get('pfPhone'),
        city: get('pfCity'),
        trade: get('pfTrade'),
        years: get('pfYears'),
        joined: new Date().toISOString()
      };
      try { localStorage.setItem('freshvent:tech', JSON.stringify(profile)); } catch (err) {}
      window.location.href = 'dashboard.html';
    });
  }
});
