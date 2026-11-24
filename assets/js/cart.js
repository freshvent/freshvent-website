/* ============================================================
   FreshVent — cart (localStorage, shared across all pages)
   Totals: subtotal + distance fee (if out-of-zone postal code)
           + 13% HST. Checkout is a DEMO (test mode).
   TODO: connect checkout to a real payment provider (Stripe)
         and an order endpoint when the backend goes live.
   ============================================================ */
var FV_CART_KEY = 'freshvent_cart_v1';
var FV_POSTAL_KEY = 'freshvent_postal_v1';

function fvMoney(n) {
  return '$' + Number(n || 0).toFixed(2);
}

function fvCartGet() {
  try {
    var raw = localStorage.getItem(FV_CART_KEY);
    var items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch (e) { return []; }
}

function fvCartSet(items) {
  try { localStorage.setItem(FV_CART_KEY, JSON.stringify(items)); } catch (e) {}
  fvCartRenderBadges();
}

function fvCartCount() {
  return fvCartGet().reduce(function (sum, it) { return sum + it.qty; }, 0);
}

function fvCartAdd(productId) {
  var product = null;
  for (var i = 0; i < FV_PRODUCTS.length; i++) {
    if (FV_PRODUCTS[i].id === productId) { product = FV_PRODUCTS[i]; break; }
  }
  if (!product) return;
  var items = fvCartGet();
  var found = false;
  items.forEach(function (it) {
    if (it.id === productId) { it.qty += 1; found = true; }
  });
  if (!found) {
    items.push({ id: product.id, name: product.name, price: product.price, icon: product.icon, qty: 1 });
  }
  fvCartSet(items);
  fvToast(product.name + ' added to cart');
}

function fvCartSetQty(productId, qty) {
  var items = fvCartGet().filter(function (it) {
    if (it.id === productId) it.qty = qty;
    return it.qty > 0;
  });
  fvCartSet(items);
  fvCartRenderPage();
}

function fvCartRemove(productId) {
  fvCartSet(fvCartGet().filter(function (it) { return it.id !== productId; }));
  fvCartRenderPage();
}

function fvSavedPostal() {
  try { return localStorage.getItem(FV_POSTAL_KEY) || ''; } catch (e) { return ''; }
}
function fvSavePostal(code) {
  try { localStorage.setItem(FV_POSTAL_KEY, code || ''); } catch (e) {}
}

/* Totals for the current cart + saved postal code */
function fvCartTotals() {
  var items = fvCartGet();
  var subtotal = items.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
  var check = fvCheckPostal(fvSavedPostal());
  var fee = (items.length && check.valid && !check.inZone) ? check.fee : 0;
  var taxable = subtotal + fee;
  var hst = taxable * FV_HST_RATE;
  return { subtotal: subtotal, fee: fee, hst: hst, total: taxable + hst, check: check, count: items.length };
}

function fvCartRenderBadges() {
  var n = fvCartCount();
  document.querySelectorAll('.cart-count').forEach(function (el) {
    el.textContent = n;
    el.style.display = n > 0 ? 'flex' : 'none';
  });
}

function fvToast(msg) {
  var t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
}

/* ---- Cart page rendering (only runs when #cartItems exists) ---- */
function fvCartRenderPage() {
  var wrap = document.getElementById('cartItems');
  if (!wrap) { fvCartRenderBadges(); return; }
  var items = fvCartGet();
  var totals = fvCartTotals();

  if (!items.length) {
    wrap.innerHTML = '<div class="card center"><h3>Your cart is empty</h3>' +
      '<p>Browse parts and small services in the shop — everything is under $750.</p>' +
      '<a class="btn" href="shop.html">Go to the Shop</a></div>';
  } else {
    wrap.innerHTML = items.map(function (it) {
      return '<div class="cart-item">' +
        '<div class="thumb">' + fvIconSvg(it.icon) + '</div>' +
        '<div class="info"><b>' + it.name + '</b><span>' + fvMoney(it.price) + ' each</span></div>' +
        '<div class="qty"><button type="button" data-dec="' + it.id + '" aria-label="Decrease">−</button>' +
        '<input type="text" value="' + it.qty + '" readonly aria-label="Quantity">' +
        '<button type="button" data-inc="' + it.id + '" aria-label="Increase">+</button></div>' +
        '<div style="min-width:76px;text-align:right"><b>' + fvMoney(it.price * it.qty) + '</b><br>' +
        '<button type="button" class="remove-btn" data-remove="' + it.id + '">Remove</button></div></div>';
    }).join('');
  }

  wrap.querySelectorAll('[data-inc]').forEach(function (b) {
    b.addEventListener('click', function () {
      var it = fvCartGet().filter(function (x) { return x.id === b.getAttribute('data-inc'); })[0];
      if (it) fvCartSetQty(it.id, it.qty + 1);
    });
  });
  wrap.querySelectorAll('[data-dec]').forEach(function (b) {
    b.addEventListener('click', function () {
      var it = fvCartGet().filter(function (x) { return x.id === b.getAttribute('data-dec'); })[0];
      if (it) fvCartSetQty(it.id, it.qty - 1);
    });
  });
  wrap.querySelectorAll('[data-remove]').forEach(function (b) {
    b.addEventListener('click', function () { fvCartRemove(b.getAttribute('data-remove')); });
  });

  var set = function (id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  set('sumSubtotal', fvMoney(totals.subtotal));
  set('sumFee', totals.fee > 0 ? fvMoney(totals.fee) : (totals.check.valid ? 'FREE' : '—'));
  set('sumHst', fvMoney(totals.hst));
  set('sumTotal', fvMoney(totals.total));
  var feeEl = document.getElementById('sumFee');
  if (feeEl) feeEl.className = totals.fee > 0 ? '' : 'free';

  var co = document.getElementById('checkoutSummary');
  if (co) {
    co.innerHTML = items.length
      ? items.map(function (it) {
          return '<div class="summary-row"><span>' + it.name + ' × ' + it.qty + '</span><span>' + fvMoney(it.price * it.qty) + '</span></div>';
        }).join('')
      : '<p style="color:var(--muted)">Nothing to check out yet.</p>';
  }
  var payBtn = document.getElementById('payBtn');
  if (payBtn) payBtn.disabled = !items.length;
  fvCartRenderBadges();
}

document.addEventListener('DOMContentLoaded', function () {
  fvCartRenderBadges();
  fvCartRenderPage();
});
