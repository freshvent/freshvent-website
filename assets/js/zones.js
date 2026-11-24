/* ============================================================
   FreshVent — service zones & distance-fee logic
   In-zone (Richmond Hill & Markham FSAs) = FREE service call.
   Out-of-zone = $17.00/hr distance fee, added in the cart.
   To edit the zone: add/remove FSA prefixes in FV_IN_ZONE_FSAS.
   ============================================================ */
var FV_IN_ZONE_FSAS = [
  'L3P', 'L3S', 'L3T', 'L3X', 'L3Y',
  'L4B', 'L4C', 'L4E', 'L4J', 'L4K', 'L4L', 'L4S',
  'L6A', 'L6B', 'L6C', 'L6E', 'L6G', 'L6H', 'L6J'
];

var FV_DISTANCE_FEE_PER_HOUR = 17.00; /* CAD, first hour applied in cart */
var FV_HST_RATE = 0.13;               /* Ontario HST */

/* Normalize a Canadian postal code: returns {valid, fsa, pretty} */
function fvNormalizePostal(raw) {
  if (!raw) return { valid: false, fsa: '', pretty: '' };
  var clean = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(clean)) {
    return { valid: false, fsa: '', pretty: '' };
  }
  return {
    valid: true,
    fsa: clean.slice(0, 3),
    pretty: clean.slice(0, 3) + ' ' + clean.slice(3)
  };
}

/* Check a postal code against the free service zone */
function fvCheckPostal(raw) {
  var n = fvNormalizePostal(raw);
  if (!n.valid) return { valid: false, inZone: false, fsa: '', pretty: '', fee: 0 };
  var inZone = FV_IN_ZONE_FSAS.indexOf(n.fsa) !== -1;
  return {
    valid: true,
    inZone: inZone,
    fsa: n.fsa,
    pretty: n.pretty,
    fee: inZone ? 0 : FV_DISTANCE_FEE_PER_HOUR
  };
}
