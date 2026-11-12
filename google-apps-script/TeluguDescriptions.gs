/**
 * ONE-TIME: fills the Telugu description (Description TE) for every dish.
 *
 * How to use:
 *   Apps Script → Files → + → Script → name it TeluguDescriptions → paste this → Save
 *   Pick "fillTeluguDescriptions" in the function list → Run.
 * Only empty cells are filled, so your own edits are never overwritten.
 * You can delete this file afterwards. No new deployment is needed.
 */
var TELUGU_DESCRIPTIONS = {
  BF01: "మెత్తని ఆవిరి ఇడ్లీలు, కొబ్బరి చట్నీ, టమాటా చట్నీ మరియు వేడి సాంబార్‌తో.",
  BF02: "కరకరలాడే దోసెలో మసాలా ఆలూ కూర, చట్నీలు మరియు సాంబార్‌తో.",
  BF03: "ఉప్మా నింపిన ఆంధ్ర స్టైల్ పెసరట్టు, అల్లం చట్నీతో.",
  BF04: "మెత్తటి పూరీలు, ఉల్లిపాయ ఆలూ కూరతో.",
  BF05: "సాంబార్‌లో నానబెట్టిన బంగారు రంగు గారెలు, కొబ్బరి చట్నీతో.",
  LU01: "అరిటాకుపై అన్నం, పప్పు, రెండు కూరలు, సాంబార్, రసం, పెరుగు, పచ్చడి, అప్పడం మరియు స్వీట్.",
  LU02: "వేరుశనగ, కరివేపాకు, మిరపకాయల తాలింపుతో పుల్లని చింతపండు పులిహోర.",
  LU03: "టమాటాలతో వండిన కందిపప్పు, నెయ్యి తాలింపుతో.",
  LU04: "కారంగా, పుల్లగా ఉండే గోంగూర మసాలాలో వండిన చికెన్.",
  LU05: "ఆవాలు, కరివేపాకు తాలింపు మరియు దానిమ్మ గింజలతో మెత్తని పెరుగన్నం.",
  DI01: "కూరగాయలతో పొరలుగా దమ్‌పై వండిన బాస్మతి బిర్యానీ, రైతా మరియు సాలన్‌తో.",
  DI02: "మసాలా పట్టించిన చికెన్, సువాసన బాస్మతితో దమ్ బిర్యానీ, రైతా మరియు మిర్చి కా సాలన్‌తో.",
  DI03: "మెత్తటి మటన్ ముక్కలు కుంకుమపువ్వు అన్నంతో పొరలుగా దమ్‌పై వండినది.",
  DI04: "టమాటా, జీడిపప్పు గ్రేవీలో పనీర్ ముక్కలు, వెన్నతో.",
  DI05: "తందూర్‌లో కాల్చి వెన్న పూసిన మెత్తని నాన్.",
  SN01: "మసాలా ఆలూ, బఠాణీ నింపిన కరకరలాడే సమోసా, పుదీనా చట్నీతో.",
  SN02: "శనగపిండిలో ముంచి వేయించిన పొడవాటి పచ్చిమిర్చి, పైన ఉల్లిపాయలతో.",
  SN03: "వెన్నతో కూరగాయల భాజీ, కాల్చిన పావ్, ఉల్లిపాయ మరియు నిమ్మకాయతో.",
  SN04: "కరకరలాడే పాప్డీపై ఆలూ, పెరుగు, తీపి మరియు పచ్చి చట్నీలు, సేవ్.",
  SW01: "కుంకుమపువ్వు పాలలో నానబెట్టిన హైదరాబాదీ బ్రెడ్ స్వీట్, డ్రై ఫ్రూట్స్‌తో.",
  SW02: "గులాబీ, యాలకుల పాకంలో నానిన మెత్తని కోవా జామూన్లు.",
  SW03: "నెయ్యి, చక్కెర, డ్రై ఫ్రూట్స్‌తో చుట్టిన పలుచని పూతరేకులు. గోదావరి ప్రత్యేకత.",
  SW04: "శనగపప్పు, బెల్లం పూర్ణం నింపిన తీపి బొబ్బట్లు, నెయ్యితో.",
  BV01: "నురుగు పాలతో చిక్కని దక్షిణ భారత డికాక్షన్ కాఫీ.",
  BV02: "అల్లం, యాలకులతో పాలలో మరిగించిన టీ.",
  BV03: "అల్లం, పచ్చిమిర్చి, కొత్తిమీరతో మసాలా మజ్జిగ.",
  BV04: "పండిన మామిడితో చిలికిన చిక్కని పెరుగు పానీయం.",
  ST01: "మసాలా పెరుగులో నానబెట్టి కాల్చిన పనీర్ మరియు క్యాప్సికం.",
  ST02: "పుల్లని ఇండో-చైనీస్ సాస్‌లో వేయించిన కరకరలాడే క్యాలీఫ్లవర్.",
  ST03: "కరివేపాకు, పచ్చిమిర్చితో వేయించిన కారమైన చికెన్.",
  ST04: "ముళ్ళు లేని చేప ముక్కలు వేయించి కారమైన పెరుగు మసాలాలో కలిపినవి.",
  DS01: "ఉడికించిన ఆప్రికాట్ స్వీట్, తాజా క్రీమ్‌తో.",
  DS02: "క్లాసిక్ వెనిల్లా ఐస్ క్రీమ్ స్కూప్.",
  DS03: "యాలకులు, జీడిపప్పు, కిస్మిస్‌తో పాలలో వండిన సేమియా పాయసం."
};

function fillTeluguDescriptions() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Food Items');
  if (!sheet) throw new Error('The "Food Items" tab was not found.');
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function (h) {
    return String(h).trim().toLowerCase().replace(/\s+/g, '_');
  });
  var idCol = headers.indexOf('item_id') + 1;
  if (idCol < 1) throw new Error('The "Item ID" column was not found.');
  var teCol = headers.indexOf('description_te') + 1;
  if (teCol < 1) {
    teCol = lastCol + 1;
    sheet.getRange(1, teCol).setValue('Description TE');
  }
  var n = sheet.getLastRow() - 1;
  if (n < 1) return;
  var ids = sheet.getRange(2, idCol, n, 1).getDisplayValues();
  var te = sheet.getRange(2, teCol, n, 1).getValues();
  var filled = 0;
  for (var i = 0; i < n; i++) {
    var id = String(ids[i][0]).trim();
    if (!String(te[i][0]).trim() && TELUGU_DESCRIPTIONS[id]) {
      te[i][0] = TELUGU_DESCRIPTIONS[id];
      filled++;
    }
  }
  sheet.getRange(2, teCol, n, 1).setValues(te);
  CacheService.getScriptCache().remove('menu-v2');
  console.log('Telugu descriptions filled: ' + filled);
}
