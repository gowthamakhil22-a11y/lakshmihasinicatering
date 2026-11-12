/**
 * Interface text in English and Telugu.
 * Dish names come from the sheet (item_name / item_name_te), not from here.
 * The WhatsApp message to the caterer is always sent in English.
 */
const en = {
  'cover.kicker': 'The Menu of',
  'cover.explore': 'Explore the Menu',
  'cover.preparing': 'Preparing the menu…',
  'cover.error': 'We couldn’t load the menu.',
  'cover.retry': 'Try again',

  'intro.kicker': 'Welcome',
  'intro.title': 'Plan your menu with us',
  'intro.text':
    'Turn the pages and tick the dishes you would like served. Tell us the date and the number of guests, and send your list on WhatsApp. We will call you to talk it through and share a quote.',
  'intro.contents': 'Contents',
  'intro.show': 'Show',
  'filter.all': 'All dishes',
  'filter.veg': 'Pure veg',
  'legend.veg': 'Vegetarian',
  'legend.nonveg': 'Non-vegetarian',

  'specials.kicker': 'House favourites',
  'specials.title': 'Chef’s Specials',
  contd: 'continued',
  'meta.from': (n) => `From ${n} guests`,
  'section.packages': 'Set Menus',
  'section.packagesDesc': 'A ready menu, tailored to your occasion',

  'hint.tick': 'Tap a dish to add it',
  'hint.swipe': 'Drag or swipe to turn the page',
  'plate.caption': 'Cooked fresh,\nserved with care.',

  'final.kicker': 'Your Order Slip',
  'final.none': 'Nothing ticked yet',
  'final.count': (n) => `${n} ${n === 1 ? 'dish' : 'dishes'} chosen`,
  'final.noneText':
    'Turn back and tick what you like, or simply send your date and guest count and we will suggest a menu.',
  'final.cta': 'Add date & guests, then send on WhatsApp',
  'final.small': 'Prices are shared over a call, once we know your event.',
  'final.share': 'Share with family to decide together',
  'final.thanks': 'Thank you',

  'dock.send': 'Send enquiry',
  'dock.prev': 'Previous page',
  'dock.next': 'Next page',
  'dock.contents': 'Contents',

  'panel.title': 'Contents & Settings',
  'panel.menu': 'Menu',
  'panel.language': 'Language',
  'panel.sound': 'Page sound',
  'panel.on': 'On',
  'panel.off': 'Off',
  'panel.close': 'Close',
  'panel.share': 'Share this menu with family',

  'share.message':
    'Here is the catering menu I am planning for our event. Open it to see my choices, and add or change dishes:',
  'shared.note': (n) => (n ? `Opened a shared menu · ${n} ${n === 1 ? 'dish' : 'dishes'} ticked` : 'Opened a shared menu'),

  'slip.title': 'Enquiry Slip',
  'slip.close': 'Close',
  'slip.dishes': 'Dishes chosen',
  'slip.none': 'None yet. You can send the slip as it is and we will suggest a menu, or',
  'slip.back': 'return to the menu',
  'slip.remove': 'remove',
  'slip.event': 'Your event',
  'slip.guests': 'Number of guests',
  'slip.guestsPh': 'e.g. 150',
  'slip.date': 'Date of the event',
  'slip.occasion': 'Occasion',
  'slip.occasionHint': '(circle one, optional)',
  'slip.name': 'Your name',
  'slip.namePh': 'So we know whom to call',
  'slip.optional': '(optional)',
  'slip.notes': 'Anything else',
  'slip.notesHint': '(venue, timing, spice level…)',
  'slip.send': 'Send this slip on WhatsApp',
  'slip.foot': 'No payment now. We will call you to discuss the menu and price.',
  'slip.noNumber': 'The WhatsApp number has not been set up yet.',
  'slip.call': 'Prefer to talk? Call',
  'err.guests': 'Please write how many guests you expect.',
  'err.guestsNum': 'A whole number, please.',
  'err.guestsHigh': 'That looks too high. Please check.',
  'err.date': 'Please choose the date of your event.',
  'err.datePast': 'That date has already passed.',
};

const te = {
  'cover.kicker': 'మా మెనూ',
  'cover.explore': 'మెనూ చూడండి',
  'cover.preparing': 'మెనూ సిద్ధమవుతోంది…',
  'cover.error': 'మెనూ లోడ్ కాలేదు.',
  'cover.retry': 'మళ్ళీ ప్రయత్నించండి',

  'intro.kicker': 'స్వాగతం',
  'intro.title': 'మీ మెనూ మాతో కలిసి ఎంచుకోండి',
  'intro.text':
    'పేజీలు తిప్పి, మీకు కావలసిన వంటకాలను టిక్ చేయండి. కార్యక్రమం తేదీ, అతిథుల సంఖ్య తెలిపి, మీ జాబితాను వాట్సాప్‌లో పంపండి. మేము మీకు ఫోన్ చేసి, మెనూ గురించి మాట్లాడి ధర తెలియజేస్తాము.',
  'intro.contents': 'విషయ సూచిక',
  'intro.show': 'చూపించు',
  'filter.all': 'అన్ని వంటకాలు',
  'filter.veg': 'శాకాహారం మాత్రమే',
  'legend.veg': 'శాకాహారం',
  'legend.nonveg': 'మాంసాహారం',

  'specials.kicker': 'మా ప్రత్యేకతలు',
  'specials.title': 'చెఫ్ స్పెషల్స్',
  contd: 'కొనసాగింపు',
  'meta.from': (n) => `కనీసం ${n} మంది అతిథులు`,
  'section.packages': 'సెట్ మెనూలు',
  'section.packagesDesc': 'మీ వేడుకకు తగినట్టు సిద్ధం చేసిన మెనూ',

  'hint.tick': 'ఎంచుకోవడానికి తాకండి',
  'hint.swipe': 'పేజీ తిప్పడానికి స్వైప్ చేయండి',
  'plate.caption': 'తాజాగా వండి,\nప్రేమగా వడ్డిస్తాం.',

  'final.kicker': 'మీ ఆర్డర్ జాబితా',
  'final.none': 'ఇంకా ఏమీ ఎంచుకోలేదు',
  'final.count': (n) => `${n} వంటకాలు ఎంచుకున్నారు`,
  'final.noneText':
    'వెనక్కి వెళ్ళి మీకు నచ్చినవి టిక్ చేయండి, లేదా తేదీ, అతిథుల సంఖ్య మాత్రమే పంపండి. మేము మెనూ సూచిస్తాము.',
  'final.cta': 'తేదీ, అతిథులు చేర్చి వాట్సాప్‌లో పంపండి',
  'final.small': 'మీ కార్యక్రమం వివరాలు తెలిశాక ఫోన్‌లో ధర తెలియజేస్తాము.',
  'final.share': 'కుటుంబంతో పంచుకుని కలిసి నిర్ణయించండి',
  'final.thanks': 'ధన్యవాదాలు',

  'dock.send': 'ఎంక్వైరీ పంపండి',
  'dock.prev': 'ముందు పేజీ',
  'dock.next': 'తర్వాతి పేజీ',
  'dock.contents': 'విషయ సూచిక',

  'panel.title': 'విషయ సూచిక & సెట్టింగ్స్',
  'panel.menu': 'మెనూ',
  'panel.language': 'భాష',
  'panel.sound': 'పేజీ శబ్దం',
  'panel.on': 'ఆన్',
  'panel.off': 'ఆఫ్',
  'panel.close': 'మూసివేయి',
  'panel.share': 'ఈ మెనూను కుటుంబంతో పంచుకోండి',

  'share.message': 'మన కార్యక్రమం కోసం నేను ఎంచుకుంటున్న మెనూ ఇది. తెరిచి చూడండి, కావాలంటే వంటకాలు మార్చండి:',
  'shared.note': (n) => (n ? `పంచుకున్న మెనూ తెరిచారు · ${n} వంటకాలు టిక్ అయ్యాయి` : 'పంచుకున్న మెనూ తెరిచారు'),

  'slip.title': 'ఎంక్వైరీ స్లిప్',
  'slip.close': 'మూసివేయి',
  'slip.dishes': 'ఎంచుకున్న వంటకాలు',
  'slip.none': 'ఇంకా ఏమీ లేవు. ఇలాగే పంపితే మేము మెనూ సూచిస్తాము, లేదా',
  'slip.back': 'మెనూకి తిరిగి వెళ్ళండి',
  'slip.remove': 'తీసివేయి',
  'slip.event': 'మీ కార్యక్రమం',
  'slip.guests': 'అతిథుల సంఖ్య',
  'slip.guestsPh': 'ఉదా. 150',
  'slip.date': 'కార్యక్రమం తేదీ',
  'slip.occasion': 'సందర్భం',
  'slip.occasionHint': '(ఒకటి ఎంచుకోండి, ఐచ్ఛికం)',
  'slip.name': 'మీ పేరు',
  'slip.namePh': 'మేము ఎవరికి ఫోన్ చేయాలి',
  'slip.optional': '(ఐచ్ఛికం)',
  'slip.notes': 'ఇంకేమైనా',
  'slip.notesHint': '(వేదిక, సమయం, కారం స్థాయి…)',
  'slip.send': 'ఈ స్లిప్ వాట్సాప్‌లో పంపండి',
  'slip.foot': 'ఇప్పుడు ఎలాంటి చెల్లింపు అవసరం లేదు. మెనూ, ధర గురించి మేము ఫోన్ చేస్తాము.',
  'slip.noNumber': 'వాట్సాప్ నంబర్ ఇంకా సెట్ చేయలేదు.',
  'slip.call': 'మాట్లాడాలనుకుంటున్నారా? కాల్ చేయండి',
  'err.guests': 'ఎంత మంది అతిథులు వస్తారో రాయండి.',
  'err.guestsNum': 'దయచేసి పూర్ణ సంఖ్య రాయండి.',
  'err.guestsHigh': 'ఈ సంఖ్య చాలా ఎక్కువగా ఉంది. ఒకసారి చూడండి.',
  'err.date': 'కార్యక్రమం తేదీ ఎంచుకోండి.',
  'err.datePast': 'ఆ తేదీ ఇప్పటికే గడిచిపోయింది.',
};

const STRINGS = { en, te };

/** Occasion labels shown in Telugu; the value sent stays English. */
export const OCCASION_TE = {
  Wedding: 'పెళ్ళి',
  Birthday: 'పుట్టినరోజు',
  Engagement: 'నిశ్చితార్థం',
  Housewarming: 'గృహప్రవేశం',
  'Corporate Event': 'కార్పొరేట్ ఈవెంట్',
  'Family Function': 'కుటుంబ వేడుక',
  Other: 'ఇతర',
};

export function makeT(lang) {
  const dict = STRINGS[lang] || en;
  return (key, ...args) => {
    const v = dict[key] ?? en[key] ?? key;
    return typeof v === 'function' ? v(...args) : v;
  };
}

/** Pick the Telugu text when the Telugu view is on and a translation exists. */
export function pick(lang, english, telugu) {
  return lang === 'te' && telugu ? telugu : english;
}
