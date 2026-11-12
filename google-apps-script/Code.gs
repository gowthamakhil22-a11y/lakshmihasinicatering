/**
 * Lakshmi Hasini Catering – public menu API (Google Apps Script)
 *
 * Deploy: Extensions → Apps Script → paste this file → Deploy → New deployment
 *         → type "Web app" → Execute as "Me" → Who has access "Anyone".
 * Copy the /exec URL into VITE_MENU_API_URL.
 *
 * GET  <exec-url>                 → JSON
 * GET  <exec-url>?callback=fn     → JSONP (fn({...}))
 * GET  <exec-url>?nocache=1       → bypass the 5 minute cache
 *
 * Response: { ok: true, version, updatedAt, data: { categories, items, packages, settings }, warnings }
 *       or: { ok: false, error }
 *
 * Only menu data is read. No customer information is stored or exposed:
 * enquiries go directly from the customer's phone to WhatsApp.
 *
 * Admin (website /admin page):
 * POST <exec-url>  body (text/plain JSON): { action, ... }
 *   login  { password }                       → { ok, token, expiresAt }
 *   list   { token }                          → { ok, data } (all rows, including hidden)
 *   save   { token, table, row }              → add or update one row by its ID
 *   delete { token, table, id }               → delete one row
 * The password is set from the sheet: Catering Menu → Set admin password.
 * It is stored only as a salted hash in Script Properties, never in website code.
 */

var SHEETS = {
  categories: {
    name: 'Categories',
    columns: ['category_id', 'category_name', 'category_description', 'category_image', 'display_order', 'status', 'category_name_te', 'category_description_te'],
    required: ['category_id', 'category_name'],
  },
  items: {
    name: 'Food Items',
    columns: ['item_id', 'item_name', 'category_id', 'description', 'price', 'price_unit', 'image_url', 'featured', 'display_order', 'status', 'food_type', 'item_name_te', 'description_te'],
    required: ['item_id', 'item_name', 'category_id'],
  },
  packages: {
    name: 'Catering Packages',
    columns: ['package_id', 'package_name', 'description', 'image_url', 'price_per_person', 'minimum_guests', 'status', 'display_order', 'inclusions', 'package_name_te'],
    required: ['package_id', 'package_name'],
  },
  settings: {
    name: 'Business Settings',
    columns: ['setting_key', 'setting_value'],
    required: ['setting_key'],
  },
};

// Only these settings are published. Anything else in the sheet stays private.
var PUBLIC_SETTINGS = [
  'business_name', 'whatsapp_number', 'phone_number', 'email', 'location',
  'maps_url', 'tagline', 'business_description',
  'trust_line', 'testimonial', 'testimonial_by', 'qr_target',
];

var ACTIVE_VALUES = ['active', 'yes', 'true', '1', 'live', 'available', ''];
var CACHE_KEY = 'menu-v2';
var CACHE_SECONDS = 300;
var API_VERSION = 1;

function doGet(e) {
  var params = (e && e.parameter) || {};
  var payload;
  try {
    payload = getMenuPayload_(params.nocache === '1');
  } catch (err) {
    payload = { ok: false, error: 'The menu could not be loaded. Please try again shortly.' };
    console.error(err && err.stack ? err.stack : err);
  }
  return respond_(payload, params.callback);
}

function respond_(payload, callback) {
  var json = JSON.stringify(payload);
  // Allow only safe JavaScript identifiers as JSONP callbacks.
  if (callback && /^[A-Za-z_$][\w$]{0,63}(\.[A-Za-z_$][\w$]{0,63})*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function getMenuPayload_(skipCache) {
  var cache = CacheService.getScriptCache();
  if (!skipCache) {
    var cached = cache.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var warnings = [];

  var categories = readSheet_(ss, SHEETS.categories, warnings).filter(isActive_).map(function (r) {
    return pick_(r, SHEETS.categories.columns);
  });
  var activeCategoryIds = {};
  categories.forEach(function (c) { activeCategoryIds[c.category_id] = true; });

  var items = readSheet_(ss, SHEETS.items, warnings).filter(isActive_).filter(function (r) {
    if (!activeCategoryIds[r.category_id]) {
      warnings.push('Item "' + r.item_id + '" skipped: category "' + r.category_id + '" is missing or inactive.');
      return false;
    }
    if (r.price != null && r.price !== '' && !isFinite(toNumber_(r.price))) {
      warnings.push('Item "' + r.item_id + '": price "' + r.price + '" is not a number, shown as price on request.');
      r.price = '';
    }
    return true;
  }).map(function (r) { return pick_(r, SHEETS.items.columns); });

  var packages = readSheet_(ss, SHEETS.packages, warnings).filter(isActive_).map(function (r) {
    if (r.price_per_person != null && r.price_per_person !== '' && !isFinite(toNumber_(r.price_per_person))) r.price_per_person = '';
    return pick_(r, SHEETS.packages.columns);
  });

  var settings = {};
  readSheet_(ss, SHEETS.settings, warnings).forEach(function (r) {
    var key = String(r.setting_key).trim();
    if (PUBLIC_SETTINGS.indexOf(key) !== -1) settings[key] = String(r.setting_value).trim();
  });

  sortByOrder_(categories);
  sortByOrder_(items);
  sortByOrder_(packages);

  var payload = {
    ok: true,
    version: API_VERSION,
    updatedAt: new Date().toISOString(),
    data: { categories: categories, items: items, packages: packages, settings: settings },
    warnings: warnings,
  };
  try {
    cache.put(CACHE_KEY, JSON.stringify(payload), CACHE_SECONDS);
  } catch (err) {
    // Payload larger than 100 KB cannot be cached. Serve it uncached.
  }
  return payload;
}

/** Read a sheet into objects keyed by header. Missing sheet → [] with a warning. */
function readSheet_(ss, def, warnings) {
  var sheet = ss.getSheetByName(def.name);
  if (!sheet) {
    warnings.push('Sheet "' + def.name + '" was not found.');
    return [];
  }
  var values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) {
    return String(h).trim().toLowerCase().replace(/\s+/g, '_');
  });
  def.required.forEach(function (col) {
    if (headers.indexOf(col) === -1) warnings.push('Sheet "' + def.name + '" is missing the "' + col + '" column.');
  });
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    var empty = true;
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      var v = String(values[i][c] == null ? '' : values[i][c]).trim();
      if (v) empty = false;
      row[headers[c]] = v;
    }
    if (empty) continue;
    var missing = def.required.filter(function (col) { return !row[col]; });
    if (missing.length) {
      warnings.push('Sheet "' + def.name + '" row ' + (i + 1) + ' skipped: missing ' + missing.join(', ') + '.');
      continue;
    }
    rows.push(row);
  }
  return rows;
}

function isActive_(row) {
  return ACTIVE_VALUES.indexOf(String(row.status == null ? '' : row.status).trim().toLowerCase()) !== -1;
}

function pick_(row, columns) {
  var out = {};
  columns.forEach(function (c) { out[c] = row[c] == null ? '' : row[c]; });
  return out;
}

function toNumber_(v) {
  return Number(String(v).replace(/[₹,\s]/g, ''));
}

function sortByOrder_(list) {
  list.sort(function (a, b) {
    var x = Number(a.display_order), y = Number(b.display_order);
    return (isFinite(x) ? x : 9999) - (isFinite(y) ? y : 9999);
  });
}

/** Clear the cache straight after editing the sheet (also runs on every edit). */
function clearMenuCache() {
  CacheService.getScriptCache().remove(CACHE_KEY);
}

function onEdit() {
  clearMenuCache();
}

/** Adds a "Menu" menu to the spreadsheet with helper actions. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Catering Menu')
    .addItem('Create template sheets', 'setupTemplate')
    .addItem('Refresh website menu now', 'clearMenuCache')
    .addSeparator()
    .addItem('Set admin password (for website /admin)', 'setAdminPassword')
    .addToUi();
}

/**
 * One time setup: creates the four sheets with headers, demo rows,
 * dropdown validation and formatting. Existing sheets are left untouched.
 */
function setupTemplate() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var demo = {
    "Categories": [
      [
        "category_id",
        "category_name",
        "category_description",
        "category_image",
        "display_order",
        "status"
      ],
      [
        "breakfast",
        "Breakfast",
        "Tiffins served hot with chutneys and sambar",
        "",
        1,
        "active"
      ],
      [
        "lunch",
        "Lunch",
        "Rice, curries and complete meals",
        "",
        2,
        "active"
      ],
      [
        "dinner",
        "Dinner",
        "Rich gravies, biryanis and breads",
        "",
        3,
        "active"
      ],
      [
        "snacks",
        "Snacks",
        "Evening bites and chaat",
        "",
        4,
        "active"
      ],
      [
        "sweets",
        "Sweets",
        "Traditional sweets for every celebration",
        "",
        5,
        "active"
      ],
      [
        "beverages",
        "Beverages",
        "Hot and cool drinks",
        "",
        6,
        "active"
      ],
      [
        "starters",
        "Starters",
        "To begin the celebration",
        "",
        7,
        "active"
      ],
      [
        "desserts",
        "Desserts",
        "A sweet finish",
        "",
        8,
        "active"
      ]
    ],
    "Food Items": [
      [
        "item_id",
        "item_name",
        "category_id",
        "description",
        "price",
        "price_unit",
        "image_url",
        "featured",
        "display_order",
        "status",
        "food_type"
      ],
      [
        "BF01",
        "Idli with Sambar and Chutney",
        "breakfast",
        "Soft steamed idlis with coconut chutney, tomato chutney and hot sambar.",
        40,
        "per plate",
        "",
        "yes",
        1,
        "active",
        "veg"
      ],
      [
        "BF02",
        "Masala Dosa",
        "breakfast",
        "Crisp dosa filled with spiced potato masala, served with chutneys and sambar.",
        60,
        "per plate",
        "",
        "yes",
        2,
        "active",
        "veg"
      ],
      [
        "BF03",
        "Pesarattu Upma",
        "breakfast",
        "Andhra style green gram dosa folded over soft upma, with ginger chutney.",
        65,
        "per plate",
        "",
        "",
        3,
        "active",
        "veg"
      ],
      [
        "BF04",
        "Poori with Potato Curry",
        "breakfast",
        "Fluffy pooris served with a mild potato and onion curry.",
        55,
        "per plate",
        "",
        "",
        4,
        "active",
        "veg"
      ],
      [
        "BF05",
        "Vada with Sambar",
        "breakfast",
        "Golden medu vadas soaked in sambar, with coconut chutney.",
        45,
        "per plate",
        "",
        "",
        5,
        "active",
        "veg"
      ],
      [
        "LU01",
        "Andhra Veg Meals",
        "lunch",
        "Rice, pappu, two curries, sambar, rasam, curd, pickle, papad and a sweet on banana leaf.",
        180,
        "per plate",
        "",
        "yes",
        1,
        "active",
        "veg"
      ],
      [
        "LU02",
        "Pulihora",
        "lunch",
        "Tangy tamarind rice tempered with peanuts, curry leaves and chillies.",
        60,
        "per plate",
        "",
        "",
        2,
        "active",
        "veg"
      ],
      [
        "LU03",
        "Tomato Pappu",
        "lunch",
        "Toor dal cooked with tomatoes and finished with a ghee tadka.",
        50,
        "per plate",
        "",
        "",
        3,
        "active",
        "veg"
      ],
      [
        "LU04",
        "Gongura Chicken Curry",
        "lunch",
        "Chicken cooked in a spicy, sour gongura leaf masala.",
        160,
        "per plate",
        "",
        "",
        4,
        "active",
        "non-veg"
      ],
      [
        "LU05",
        "Curd Rice",
        "lunch",
        "Creamy curd rice tempered with mustard, curry leaves and pomegranate.",
        45,
        "per plate",
        "",
        "",
        5,
        "active",
        "veg"
      ],
      [
        "DI01",
        "Hyderabadi Veg Dum Biryani",
        "dinner",
        "Long grain basmati layered with vegetables and slow cooked on dum. Served with raita and salan.",
        150,
        "per plate",
        "",
        "yes",
        1,
        "active",
        "veg"
      ],
      [
        "DI02",
        "Chicken Dum Biryani",
        "dinner",
        "Marinated chicken and fragrant basmati cooked on dum, with raita and mirchi ka salan.",
        200,
        "per plate",
        "",
        "yes",
        2,
        "active",
        "non-veg"
      ],
      [
        "DI03",
        "Mutton Biryani",
        "dinner",
        "Tender mutton pieces layered with saffron rice and cooked on dum.",
        "",
        "per plate",
        "",
        "",
        3,
        "active",
        "non-veg"
      ],
      [
        "DI04",
        "Paneer Butter Masala",
        "dinner",
        "Paneer cubes in a smooth tomato and cashew gravy finished with butter.",
        140,
        "per plate",
        "",
        "",
        4,
        "active",
        "veg"
      ],
      [
        "DI05",
        "Butter Naan",
        "dinner",
        "Soft tandoor baked naan brushed with butter.",
        35,
        "per piece",
        "",
        "",
        5,
        "active",
        "veg"
      ],
      [
        "SN01",
        "Samosa",
        "snacks",
        "Crisp pastry stuffed with spiced potato and peas, with mint chutney.",
        20,
        "per piece",
        "",
        "",
        1,
        "active",
        "veg"
      ],
      [
        "SN02",
        "Mirchi Bajji",
        "snacks",
        "Long green chillies dipped in gram flour batter and fried, topped with onion.",
        25,
        "per piece",
        "",
        "yes",
        2,
        "active",
        "veg"
      ],
      [
        "SN03",
        "Pav Bhaji",
        "snacks",
        "Buttery mixed vegetable bhaji with toasted pav, onion and lemon.",
        80,
        "per plate",
        "",
        "",
        3,
        "active",
        "veg"
      ],
      [
        "SN04",
        "Papdi Chaat",
        "snacks",
        "Crisp papdi with potato, curd, sweet and green chutneys and sev.",
        60,
        "per plate",
        "",
        "",
        4,
        "active",
        "veg"
      ],
      [
        "SW01",
        "Double ka Meetha",
        "sweets",
        "Hyderabadi bread pudding soaked in saffron milk and topped with dry fruits.",
        50,
        "per plate",
        "",
        "yes",
        1,
        "active",
        "veg"
      ],
      [
        "SW02",
        "Gulab Jamun",
        "sweets",
        "Soft khoya dumplings soaked in rose cardamom syrup.",
        20,
        "per piece",
        "",
        "",
        2,
        "active",
        "veg"
      ],
      [
        "SW03",
        "Pootharekulu",
        "sweets",
        "Paper thin rice sheets layered with ghee, sugar and dry fruits. A Godavari speciality.",
        40,
        "per piece",
        "",
        "yes",
        3,
        "active",
        "veg"
      ],
      [
        "SW04",
        "Bobbatlu",
        "sweets",
        "Sweet flatbread filled with chana dal and jaggery, served with ghee.",
        35,
        "per piece",
        "",
        "",
        4,
        "active",
        "veg"
      ],
      [
        "BV01",
        "Filter Coffee",
        "beverages",
        "Strong South Indian decoction coffee with frothy milk.",
        25,
        "per cup",
        "",
        "",
        1,
        "active",
        "veg"
      ],
      [
        "BV02",
        "Masala Chai",
        "beverages",
        "Tea brewed with milk, ginger and cardamom.",
        20,
        "per cup",
        "",
        "",
        2,
        "active",
        "veg"
      ],
      [
        "BV03",
        "Buttermilk",
        "beverages",
        "Spiced majjiga with ginger, green chilli and coriander.",
        20,
        "per glass",
        "",
        "",
        3,
        "active",
        "veg"
      ],
      [
        "BV04",
        "Mango Lassi",
        "beverages",
        "Thick yoghurt drink blended with ripe mango.",
        50,
        "per glass",
        "",
        "",
        4,
        "active",
        "veg"
      ],
      [
        "ST01",
        "Paneer Tikka",
        "starters",
        "Paneer and peppers marinated in spiced yoghurt and grilled.",
        120,
        "per plate",
        "",
        "yes",
        1,
        "active",
        "veg"
      ],
      [
        "ST02",
        "Gobi Manchurian",
        "starters",
        "Crispy cauliflower tossed in a tangy Indo Chinese sauce.",
        90,
        "per plate",
        "",
        "",
        2,
        "active",
        "veg"
      ],
      [
        "ST03",
        "Chicken 65",
        "starters",
        "Spicy deep fried chicken tossed with curry leaves and green chillies.",
        150,
        "per plate",
        "",
        "",
        3,
        "active",
        "non-veg"
      ],
      [
        "ST04",
        "Apollo Fish",
        "starters",
        "Boneless fish fried and tossed in a spicy yoghurt masala.",
        "",
        "per plate",
        "",
        "",
        4,
        "active",
        "non-veg"
      ],
      [
        "DS01",
        "Qubani ka Meetha",
        "desserts",
        "Stewed apricot dessert served with fresh cream.",
        70,
        "per bowl",
        "",
        "",
        1,
        "active",
        "veg"
      ],
      [
        "DS02",
        "Vanilla Ice Cream",
        "desserts",
        "Classic vanilla ice cream scoop.",
        30,
        "per scoop",
        "",
        "",
        2,
        "active",
        "veg"
      ],
      [
        "DS03",
        "Semiya Payasam",
        "desserts",
        "Vermicelli cooked in milk with cardamom, cashews and raisins.",
        40,
        "per bowl",
        "",
        "",
        3,
        "active",
        "veg"
      ]
    ],
    "Catering Packages": [
      [
        "package_id",
        "package_name",
        "description",
        "image_url",
        "price_per_person",
        "minimum_guests",
        "status",
        "display_order",
        "inclusions"
      ],
      [
        "PK01",
        "Classic Catering",
        "Everyday favourites for family functions and small gatherings. A balanced South Indian vegetarian menu.",
        "images/curry-spread.webp",
        250,
        50,
        "active",
        1,
        "Welcome drink|One sweet|Two curries and dal|Rice, sambar and rasam|Curd and pickle|Buffet setup and serving staff"
      ],
      [
        "PK02",
        "Premium Catering",
        "A richer spread with starters, a biryani and more choices for larger celebrations.",
        "images/tandoori-naan-platter.webp",
        450,
        100,
        "active",
        2,
        "Welcome drink and two starters|Veg biryani with raita|Three curries and dal|Breads and rice|Two sweets and ice cream|Live counter on request"
      ],
      [
        "PK03",
        "Wedding Catering",
        "Traditional banana leaf meals or a grand buffet, planned around your wedding rituals and guests.",
        "images/festive-spread.webp",
        "",
        300,
        "active",
        3,
        "Menu planning with the family|Traditional banana leaf service|Sweets and savouries for rituals|Breakfast, lunch and dinner options|Full service team"
      ],
      [
        "PK04",
        "Corporate Catering",
        "Reliable, on time meals for office events, meetings and conferences.",
        "images/south-indian-spread.webp",
        220,
        30,
        "active",
        4,
        "Breakfast, lunch or high tea|Packed or buffet service|Veg and non veg options|Disposable or steel cutlery"
      ]
    ],
    "Business Settings": [
      [
        "setting_key",
        "setting_value"
      ],
      [
        "business_name",
        "Lakshmi Hasini Catering"
      ],
      [
        "whatsapp_number",
        "919876543210"
      ],
      [
        "phone_number",
        "+91 98765 43210"
      ],
      [
        "email",
        "lakshmihasinicatering@gmail.com"
      ],
      [
        "location",
        "Main Road, Danavaipeta, Rajahmundry, Andhra Pradesh 533101"
      ],
      [
        "tagline",
        "Delicious Food for Every Occasion"
      ],
      [
        "business_description",
        "Thoughtfully prepared catering for weddings, family celebrations, corporate events and special gatherings."
      ]
    ]
  };
  Object.keys(demo).forEach(function (name) {
    if (ss.getSheetByName(name)) return;
    var sheet = ss.insertSheet(name);
    var rows = demo[name];
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, rows[0].length)
      .setFontWeight('bold').setBackground('#0F4A2E').setFontColor('#FBF6EA');
    sheet.autoResizeColumns(1, rows[0].length);

    var headers = rows[0];
    var statusCol = headers.indexOf('status') + 1;
    if (statusCol > 0) {
      sheet.getRange(2, statusCol, 500, 1).setDataValidation(
        SpreadsheetApp.newDataValidation().requireValueInList(['active', 'inactive'], true).build()
      );
    }
    var featuredCol = headers.indexOf('featured') + 1;
    if (featuredCol > 0) {
      sheet.getRange(2, featuredCol, 500, 1).setDataValidation(
        SpreadsheetApp.newDataValidation().requireValueInList(['yes', ''], true).setAllowInvalid(true).build()
      );
    }
    var foodTypeCol = headers.indexOf('food_type') + 1;
    if (foodTypeCol > 0) {
      sheet.getRange(2, foodTypeCol, 500, 1).setDataValidation(
        SpreadsheetApp.newDataValidation().requireValueInList(['veg', 'non-veg', 'egg'], true).setAllowInvalid(true).build()
      );
    }
    var catCol = name === 'Food Items' ? headers.indexOf('category_id') + 1 : 0;
    if (catCol > 0) {
      var catSheet = ss.getSheetByName('Categories');
      if (catSheet) {
        sheet.getRange(2, catCol, 500, 1).setDataValidation(
          SpreadsheetApp.newDataValidation().requireValueInRange(catSheet.getRange('A2:A200'), true).build()
        );
      }
    }
  });
  var blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
  clearMenuCache();
}


/* =====================================================================
   ADMIN: edit the menu from the website's /admin page.
   ===================================================================== */

var TABLES = {
  categories: { def: SHEETS.categories, idKey: 'category_id' },
  items: { def: SHEETS.items, idKey: 'item_id' },
  packages: { def: SHEETS.packages, idKey: 'package_id' },
  settings: { def: SHEETS.settings, idKey: 'setting_key' },
};
var TOKEN_HOURS = 12;
var MAX_FAILED_LOGINS = 8;

function doPost(e) {
  var out;
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    out = handleAdmin_(body);
  } catch (err) {
    out = { ok: false, error: err && err.userMessage ? err.userMessage : 'Something went wrong. Please try again.', code: err && err.code };
    if (!(err && err.userMessage)) console.error(err && err.stack ? err.stack : err);
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function fail_(message, code) {
  var err = new Error(message);
  err.userMessage = message;
  err.code = code || 'invalid';
  return err;
}

function handleAdmin_(body) {
  var action = String(body.action || '');
  if (action === 'login') return login_(String(body.password || ''));
  verifyToken_(body.token);
  if (action === 'list') return { ok: true, data: listAll_() };
  if (action === 'save') {
    withLock_(function () { saveRow_(String(body.table || ''), body.row || {}); });
    clearMenuCache();
    return { ok: true, data: listAll_() };
  }
  if (action === 'delete') {
    withLock_(function () { deleteRow_(String(body.table || ''), String(body.id || '')); });
    clearMenuCache();
    return { ok: true, data: listAll_() };
  }
  throw fail_('Unknown action.');
}

/* ---------- password + tokens ---------- */

function props_() {
  return PropertiesService.getScriptProperties();
}

function hash_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(bytes);
}

/** Run from the sheet menu: Catering Menu → Set admin password. */
function setAdminPassword() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('Admin password', 'Choose a password for the website /admin page (at least 8 characters).', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var pw = res.getResponseText();
  if (pw.length < 8) {
    ui.alert('Please use at least 8 characters.');
    return;
  }
  var salt = Utilities.getUuid();
  props_().setProperties({
    ADMIN_SALT: salt,
    ADMIN_HASH: hash_(salt + pw),
    TOKEN_SECRET: Utilities.getUuid() + Utilities.getUuid(), // new secret signs everyone out
  });
  ui.alert('Admin password saved. Anyone signed in before has been signed out.');
}

function login_(password) {
  var p = props_().getProperties();
  if (!p.ADMIN_HASH) throw fail_('No admin password yet. In the Google Sheet use Catering Menu → Set admin password.', 'setup');
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('admin-fails') || 0);
  if (fails >= MAX_FAILED_LOGINS) throw fail_('Too many wrong attempts. Please wait 15 minutes and try again.', 'locked');
  if (hash_(p.ADMIN_SALT + password) !== p.ADMIN_HASH) {
    cache.put('admin-fails', String(fails + 1), 900);
    Utilities.sleep(700);
    throw fail_('That password is not right.', 'password');
  }
  cache.remove('admin-fails');
  var exp = Date.now() + TOKEN_HOURS * 3600 * 1000;
  return { ok: true, token: sign_(String(exp)), expiresAt: exp };
}

function sign_(payload) {
  var secret = props_().getProperty('TOKEN_SECRET');
  var sig = Utilities.computeHmacSha256Signature(payload, secret);
  return payload + '.' + Utilities.base64EncodeWebSafe(sig);
}

function verifyToken_(token) {
  var t = String(token || '');
  var i = t.indexOf('.');
  if (i < 1 || !props_().getProperty('TOKEN_SECRET')) throw fail_('Please sign in again.', 'auth');
  var payload = t.slice(0, i);
  if (sign_(payload) !== t || Number(payload) < Date.now()) throw fail_('Please sign in again.', 'auth');
}

/* ---------- reading and writing rows ---------- */

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    fn();
  } finally {
    lock.releaseLock();
  }
}

function sheetFor_(table) {
  var t = TABLES[table];
  if (!t) throw fail_('Unknown table.');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(t.def.name);
  if (!sheet) throw fail_('The "' + t.def.name + '" tab is missing in the sheet.');
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function (h) {
    return String(h).trim().toLowerCase().replace(/\s+/g, '_');
  });
  return { t: t, sheet: sheet, headers: headers };
}

function listAll_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = {};
  Object.keys(TABLES).forEach(function (key) {
    var def = TABLES[key].def;
    var sheet = ss.getSheetByName(def.name);
    if (!sheet || sheet.getLastRow() < 2) {
      out[key] = [];
      return;
    }
    var values = sheet.getDataRange().getDisplayValues();
    var headers = values[0].map(function (h) { return String(h).trim().toLowerCase().replace(/\s+/g, '_'); });
    out[key] = values.slice(1).map(function (r) {
      var row = {};
      headers.forEach(function (h, c) { if (h) row[h] = String(r[c] == null ? '' : r[c]).trim(); });
      return row;
    }).filter(function (row) { return row[TABLES[key].idKey]; });
  });
  return out;
}

function findRow_(sheet, idCol, id) {
  if (sheet.getLastRow() < 2) return -1;
  var ids = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === id) return i + 2;
  return -1;
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max || 1000);
}

function validate_(table, row) {
  var t = TABLES[table];
  var id = clean_(row[t.idKey], 60);
  if (table === 'settings') {
    if (PUBLIC_SETTINGS.indexOf(id) === -1) throw fail_('That setting cannot be changed here.');
    return;
  }
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) throw fail_('The ID can only use letters, numbers, - and _ (no spaces).');
  t.def.required.forEach(function (k) {
    if (!clean_(row[k])) throw fail_('Please fill in ' + k.replace(/_/g, ' ') + '.');
  });
  if (row.status && ['active', 'inactive'].indexOf(row.status) === -1) throw fail_('Status must be active or inactive.');
  if (row.food_type && ['veg', 'non-veg', 'egg'].indexOf(row.food_type) === -1) throw fail_('Food type must be veg, non-veg or egg.');
  if (row.featured && row.featured !== 'yes') throw fail_('Featured must be yes or empty.');
  ['display_order', 'minimum_guests'].forEach(function (k) {
    if (row[k] && !/^\d{1,6}$/.test(String(row[k]))) throw fail_(k.replace(/_/g, ' ') + ' must be a whole number.');
  });
  if (table === 'items') {
    var cats = listAll_().categories.map(function (c) { return c.category_id; });
    if (cats.indexOf(row.category_id) === -1) throw fail_('Pick a section that exists.');
  }
}

function saveRow_(table, input) {
  var s = sheetFor_(table);
  var idKey = s.t.idKey;
  var row = {};
  // Only columns this table knows about; everything else is ignored.
  s.t.def.columns.forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(input, k)) row[k] = clean_(input[k], k === 'setting_value' || k.indexOf('description') === 0 || k === 'inclusions' ? 1000 : 200);
  });
  validate_(table, row);
  var idCol = s.headers.indexOf(idKey) + 1;
  if (idCol < 1) throw fail_('The ID column is missing in the sheet.');
  var r = findRow_(s.sheet, idCol, row[idKey]);
  var isNew = r === -1;
  if (isNew && input.isNew === false) throw fail_('That row no longer exists. Refresh and try again.');
  if (!isNew && input.isNew === true) throw fail_('That ID is already used. Pick another one.');
  if (isNew) r = Math.max(s.sheet.getLastRow(), 1) + 1;
  Object.keys(row).forEach(function (k) {
    var c = s.headers.indexOf(k) + 1;
    if (c < 1) return; // column not in this sheet: skip quietly
    var v = row[k];
    if (/^[=+@]/.test(v)) v = "'" + v; // never let typed text become a formula
    s.sheet.getRange(r, c).setNumberFormat('@').setValue(v);
  });
}

function deleteRow_(table, id) {
  if (table === 'settings') throw fail_('Settings cannot be deleted, only cleared.');
  var s = sheetFor_(table);
  if (table === 'categories') {
    var used = listAll_().items.some(function (i) { return i.category_id === id; });
    if (used) throw fail_('This section still has dishes. Move or delete them first.');
  }
  var r = findRow_(s.sheet, s.headers.indexOf(s.t.idKey) + 1, id);
  if (r === -1) throw fail_('That row was not found.');
  s.sheet.deleteRow(r);
}
