/* ============================================================
   FreshVent — shop catalog data
   To edit the catalog: add/remove items below.
   Fields: id, name, category, price (CAD), blurb, icon
   (icon keys: filter, thermostat, part, service, air)
   All prices are under $750 — parts & small services only.
   ============================================================ */
var FV_PRODUCTS = [
  { id: 'flt-merv11-4pk', name: 'MERV 11 Furnace Filter — 16×25×1 (4-Pack)', category: 'Filters', price: 49.99, icon: 'filter',
    blurb: 'Electrostatic pleated filters that trap dust, pollen and pet dander. Fits most standard furnace and AC units.' },
  { id: 'flt-merv13-20', name: 'MERV 13 High-Efficiency Filter — 20×25×4', category: 'Filters', price: 39.99, icon: 'filter',
    blurb: 'Deep-pleat 4-inch filter for finer particle capture and cleaner indoor air. Replace every 6–9 months.' },
  { id: 'flt-washable', name: 'Washable Electrostatic Filter — 20×25×1', category: 'Filters', price: 89.99, icon: 'filter',
    blurb: 'Reusable aluminum-frame filter. Rinse, dry and reinstall — no more disposable filters to buy.' },
  { id: 'tstat-wifi', name: 'Smart Wi-Fi Thermostat', category: 'Thermostats', price: 249.99, icon: 'thermostat',
    blurb: 'Control heating and cooling from your phone, set schedules and get energy reports. Works with most 24V systems.' },
  { id: 'tstat-prog', name: '7-Day Programmable Thermostat', category: 'Thermostats', price: 129.99, icon: 'thermostat',
    blurb: 'Easy 7-day programming with a large backlit display. A simple, reliable upgrade from a manual dial.' },
  { id: 'tstat-sensor', name: 'Smart Thermostat with Room Sensor', category: 'Thermostats', price: 329.99, icon: 'thermostat',
    blurb: 'Includes a wireless room sensor to balance hot and cold spots across your home. Learns your routine.' },
  { id: 'part-igniter', name: 'Universal Hot Surface Igniter', category: 'Parts', price: 59.99, icon: 'part',
    blurb: 'Silicon carbide igniter compatible with most major furnace brands. A common fix for no-heat calls.' },
  { id: 'part-flame-sensor', name: 'Furnace Flame Sensor', category: 'Parts', price: 34.99, icon: 'part',
    blurb: 'Replacement flame sensor for furnaces that start then shut off after a few seconds.' },
  { id: 'part-condensate-pump', name: 'Condensate Pump with Safety Switch', category: 'Parts', price: 119.99, icon: 'part',
    blurb: 'Automatically drains condensate from high-efficiency furnaces and AC units. 1/30 HP, quiet operation.' },
  { id: 'part-uv-lamp', name: 'UV Air Purifier Lamp — Coil Mount', category: 'Parts', price: 189.99, icon: 'air',
    blurb: 'UV-C lamp that mounts on the evaporator coil to help keep mold and bacteria from growing in the system.' },
  { id: 'svc-furnace-tuneup', name: 'Furnace Tune-Up & Safety Inspection', category: 'Services', price: 119.00, icon: 'service',
    blurb: '21-point inspection, burner cleaning, safety checks and a written report. Booked within 48 hours in-zone.' },
  { id: 'svc-ac-tuneup', name: 'Air Conditioner Tune-Up', category: 'Services', price: 129.00, icon: 'service',
    blurb: 'Coil cleaning, refrigerant check, electrical inspection and performance test before the summer heat.' },
  { id: 'svc-diagnostic', name: 'HVAC Diagnostic Visit', category: 'Services', price: 89.00, icon: 'service',
    blurb: 'A licensed technician finds the problem and gives you a flat, written quote before any repair work starts.' },
  { id: 'svc-duct-clean', name: 'Duct Cleaning — Up to 10 Vents', category: 'Services', price: 299.00, icon: 'air',
    blurb: 'Full supply and return duct cleaning with a high-powered vacuum system. Additional vents $15 each.' }
];

/* ---- Appliance protection plans (see plans.html) ----
   Adding a plan to the cart charges the FIRST MONTH only;
   the plan then renews monthly and can be cancelled anytime. */
FV_PRODUCTS.push(
  { id: 'plan-essential', name: 'Protection Plan — Essential (first month)', category: 'Plans', price: 19.99, icon: 'shield',
    blurb: 'Furnace + AC breakdown protection. Renews at $19.99/mo after the first month — cancel anytime.' },
  { id: 'plan-plus', name: 'Protection Plan — Plus (first month)', category: 'Plans', price: 29.99, icon: 'shield',
    blurb: 'HVAC + major appliances (fridge, washer, dryer, stove). Renews at $29.99/mo — cancel anytime.' },
  { id: 'plan-whole-home', name: 'Protection Plan — Whole Home (first month)', category: 'Plans', price: 44.99, icon: 'shield',
    blurb: 'Everything in Plus + plumbing and electrical basics. Renews at $44.99/mo — cancel anytime.' }
);
