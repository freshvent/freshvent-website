/* ============================================================
   FreshVent v2 — demo marketplace jobs + pricing rule
   A job's price = base price for the service
                 + $2.50 per km for every km beyond 10 km away.
   So the same job pays differently depending on how far the
   technician is — prices visibly vary by distance.
   Distances: city-to-city table (km between city centres)
   plus each job's localKm (distance inside its own city).
   ============================================================ */
var FV_CITY_KM = {
  'Richmond Hill': { 'Richmond Hill': 0, 'Markham': 8,  'Vaughan': 14, 'North York': 16, 'Scarborough': 20, 'Toronto': 28 },
  'Markham':       { 'Markham': 0, 'Richmond Hill': 8,  'Scarborough': 14, 'North York': 15, 'Vaughan': 20, 'Toronto': 30 },
  'Toronto':       { 'Toronto': 0, 'North York': 14, 'Scarborough': 18, 'Richmond Hill': 28, 'Markham': 30, 'Vaughan': 32 },
  'Vaughan':       { 'Vaughan': 0, 'Richmond Hill': 14, 'North York': 18, 'Markham': 20, 'Toronto': 32, 'Scarborough': 34 },
  'Scarborough':   { 'Scarborough': 0, 'Markham': 14, 'North York': 16, 'Toronto': 18, 'Richmond Hill': 20, 'Vaughan': 34 },
  'North York':    { 'North York': 0, 'Toronto': 14, 'Markham': 15, 'Richmond Hill': 16, 'Scarborough': 16, 'Vaughan': 18 }
};

var FV_JOB_BASE = {
  'Furnace — no heat': 165,
  'AC — not cooling': 155,
  'AC — strange noise': 145,
  'Furnace tune-up': 119,
  'Thermostat install': 129,
  'Water heater — no hot water': 175,
  'Humidifier install': 139,
  'Duct cleaning': 249
};
var FV_JOB_PER_KM_BEYOND_10 = 2.50;

var FV_JOBS = [
  { id: 'job-01', service: 'Furnace — no heat',            city: 'Richmond Hill', area: 'Bayview Hill',  localKm: 3.2, window: 'Today · ASAP' },
  { id: 'job-02', service: 'AC — not cooling',             city: 'Markham',       area: 'Unionville',    localKm: 4.1, window: 'Today · 12–4 pm' },
  { id: 'job-03', service: 'Furnace tune-up',              city: 'Toronto',       area: 'Leaside',       localKm: 5.6, window: 'Tomorrow · 8 am–12 pm' },
  { id: 'job-04', service: 'Thermostat install',           city: 'Vaughan',       area: 'Woodbridge',    localKm: 6.3, window: 'Today · 4–8 pm' },
  { id: 'job-05', service: 'AC — strange noise',           city: 'Scarborough',   area: 'Agincourt',     localKm: 2.8, window: 'Tomorrow · 12–4 pm' },
  { id: 'job-06', service: 'Water heater — no hot water',  city: 'North York',    area: 'Willowdale',    localKm: 3.9, window: 'Today · ASAP' },
  { id: 'job-07', service: 'Furnace — no heat',            city: 'Markham',       area: 'Cornell',       localKm: 6.8, window: 'Tomorrow · 8 am–12 pm' },
  { id: 'job-08', service: 'Duct cleaning',                city: 'Toronto',       area: 'Etobicoke',     localKm: 7.4, window: 'Friday · 8 am–12 pm' },
  { id: 'job-09', service: 'Humidifier install',           city: 'Richmond Hill', area: 'Oak Ridges',    localKm: 5.2, window: 'Saturday · 8 am–12 pm' }
];

/* Distance in km from a technician's home city to a job */
function fvJobDistance(job, fromCity) {
  var row = FV_CITY_KM[fromCity] || FV_CITY_KM['Toronto'];
  var base = (row && typeof row[job.city] === 'number') ? row[job.city] : 20;
  return Math.round((base + job.localKm) * 10) / 10;
}

/* What the job pays a technician based in fromCity */
function fvJobPrice(job, fromCity) {
  var d = fvJobDistance(job, fromCity);
  var base = FV_JOB_BASE[job.service] || 150;
  var extra = Math.max(0, d - 10) * FV_JOB_PER_KM_BEYOND_10;
  return { distanceKm: d, price: Math.round(base + extra) };
}

function fvJobById(id) {
  for (var i = 0; i < FV_JOBS.length; i++) if (FV_JOBS[i].id === id) return FV_JOBS[i];
  return null;
}

/* ============================================================
   Demo technician availability — used by the booking calendar.
   Keyed by technician name (same names as the booking pool),
   then by weekday (0 = Sunday … 6 = Saturday).
   A day is either 'full' (fully booked — no slots at all) or
   a list of slots; a slot with taken:true is already booked.
   TODO: replace with live availability from the dispatch
   engine / technician calendars when the backend goes live.
   ============================================================ */
function fvSlot(label, taken) { return { label: label, taken: !!taken }; }

var FV_AVAILABILITY = {
  'Alex R.': {
    0: 'full',
    1: [fvSlot('8–10 am'), fvSlot('10 am–12 pm', true), fvSlot('12–2 pm'), fvSlot('2–4 pm', true), fvSlot('4–6 pm')],
    2: 'full',
    3: [fvSlot('8–10 am'), fvSlot('10 am–12 pm'), fvSlot('12–2 pm', true), fvSlot('2–4 pm'), fvSlot('4–6 pm', true), fvSlot('6–8 pm')],
    4: [fvSlot('8–10 am', true), fvSlot('10 am–12 pm'), fvSlot('2–4 pm'), fvSlot('4–6 pm')],
    5: 'full',
    6: [fvSlot('8–10 am'), fvSlot('10 am–12 pm', true), fvSlot('12–2 pm'), fvSlot('2–4 pm')]
  },
  'Sam K.': {
    0: [fvSlot('10 am–12 pm'), fvSlot('12–2 pm')],
    1: 'full',
    2: [fvSlot('8–10 am'), fvSlot('10 am–12 pm', true), fvSlot('2–4 pm'), fvSlot('4–6 pm')],
    3: [fvSlot('8–10 am', true), fvSlot('10 am–12 pm'), fvSlot('12–2 pm')],
    4: 'full',
    5: [fvSlot('8–10 am'), fvSlot('10 am–12 pm'), fvSlot('12–2 pm', true), fvSlot('2–4 pm'), fvSlot('6–8 pm')],
    6: 'full'
  },
  'Jordan M.': {
    0: [fvSlot('8–10 am'), fvSlot('2–4 pm')],
    1: [fvSlot('8–10 am'), fvSlot('10 am–12 pm', true), fvSlot('12–2 pm'), fvSlot('4–6 pm')],
    2: [fvSlot('10 am–12 pm'), fvSlot('12–2 pm', true), fvSlot('2–4 pm')],
    3: 'full',
    4: [fvSlot('8–10 am', true), fvSlot('10 am–12 pm'), fvSlot('2–4 pm'), fvSlot('6–8 pm')],
    5: [fvSlot('8–10 am'), fvSlot('10 am–12 pm'), fvSlot('12–2 pm')],
    6: [fvSlot('10 am–12 pm', true), fvSlot('12–2 pm'), fvSlot('4–6 pm')]
  },
  'Priya D.': {
    0: 'full',
    1: [fvSlot('10 am–12 pm'), fvSlot('2–4 pm'), fvSlot('4–6 pm', true)],
    2: [fvSlot('8–10 am'), fvSlot('10 am–12 pm'), fvSlot('12–2 pm')],
    3: [fvSlot('8–10 am'), fvSlot('12–2 pm', true), fvSlot('4–6 pm')],
    4: 'full',
    5: [fvSlot('8–10 am', true), fvSlot('10 am–12 pm'), fvSlot('2–4 pm')],
    6: [fvSlot('8–10 am'), fvSlot('12–2 pm')]
  }
};

/* Availability for one technician on one weekday:
   returns { full:true, slots:[] } when the day is fully booked,
   otherwise { full:false, slots:[{label, taken}, …] }. */
function fvTechDay(techName, weekday) {
  var map = FV_AVAILABILITY[techName];
  var day = map ? map[weekday] : null;
  if (!day || day === 'full' || !day.length) return { full: true, slots: [] };
  return { full: false, slots: day };
}

/* Just the still-bookable slots for a technician/weekday */
function fvFreeSlots(techName, weekday) {
  return fvTechDay(techName, weekday).slots.filter(function (s) { return !s.taken; });
}
