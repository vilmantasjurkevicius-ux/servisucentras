/* ══ AUTOMOBILIO KASKADINIS PASIRINKIMAS (Markė→Modelis→Metai, nebūtinas Kėbulo tipas) ══
   Bendras duomenų failas — įtraukiamas <script src="car-data.js"> abiejuose failuose,
   kur reikia automobilio pasirinkimo (servisucentras-pagrindinis.html ir mano-paskyra.html),
   kad duomenys ir kaskados logika nebūtų dubliuojami dviejose vietose (anksčiau buvo).
   Statinis, supaprastintas rinkinys — ~30 Lietuvos rinkoje dažniausių markių su
   pagrindiniais modeliais, ne visas pasaulio automobilių katalogas. */

const CAR_MAKES_MODELS = {
  'Audi': ['A1','A3','A4','A5','A6','A7','A8','Q2','Q3','Q5','Q7','Q8','TT'],
  'BMW': ['1 serija','2 serija','3 serija','4 serija','5 serija','6 serija','7 serija','X1','X3','X5','X6','Z4'],
  'Chevrolet': ['Aveo','Captiva','Cruze','Lacetti','Malibu','Spark'],
  'Citroën': ['Berlingo','C1','C2','C3','C4','C5','Jumpy','Xsara'],
  'Dacia': ['Dokker','Duster','Logan','Sandero'],
  'Fiat': ['500','Doblo','Ducato','Panda','Punto','Tipo'],
  'Ford': ['C-Max','EcoSport','Fiesta','Focus','Galaxy','Kuga','Mondeo','Puma','S-Max','Transit'],
  'Honda': ['Accord','Civic','CR-V','HR-V','Jazz'],
  'Hyundai': ['i10','i20','i30','i40','ix35','Kona','Santa Fe','Tucson'],
  'Jeep': ['Cherokee','Compass','Grand Cherokee','Renegade'],
  'Kia': ['Ceed','Optima','Picanto','Rio','Sorento','Sportage'],
  'Lada': ['Granta','Niva','Vesta'],
  'Land Rover': ['Defender','Discovery','Freelander','Range Rover'],
  'Lexus': ['CT','ES','IS','NX','RX'],
  'Mazda': ['2','3','5','6','CX-3','CX-5','CX-7'],
  'Mercedes-Benz': ['A klasė','B klasė','C klasė','E klasė','S klasė','CLA','GLA','GLC','GLE','ML','Sprinter','Viano','Vito'],
  'Mini': ['Clubman','Cooper','Countryman'],
  'Mitsubishi': ['ASX','Colt','Lancer','Outlander','Pajero'],
  'Nissan': ['Almera','Juke','Micra','Note','Primera','Qashqai','X-Trail'],
  'Opel': ['Antara','Astra','Corsa','Insignia','Meriva','Mokka','Vectra','Zafira'],
  'Peugeot': ['107','206','207','208','2008','3008','307','308','407','508','Partner'],
  'Porsche': ['911','Cayenne','Macan','Panamera'],
  'Renault': ['Captur','Clio','Kadjar','Laguna','Megane','Scenic','Trafic','Twingo'],
  'Seat': ['Altea','Ateca','Ibiza','Leon','Toledo'],
  'Škoda': ['Fabia','Karoq','Kodiaq','Octavia','Rapid','Roomster','Superb','Yeti'],
  'Subaru': ['Forester','Impreza','Legacy','Outback','XV'],
  'Suzuki': ['Grand Vitara','Jimny','SX4','Swift','Vitara'],
  'Toyota': ['Auris','Avensis','Camry','Corolla','Hilux','Land Cruiser','Prius','RAV4','Yaris'],
  'Volkswagen': ['Caddy','Golf','Jetta','Passat','Polo','Sharan','Tiguan','Touareg','Touran','Transporter','Up!'],
  'Volvo': ['S40','S60','S80','V40','V50','V60','V70','XC60','XC90'],
};

// Kiek metų atgal siūlyti pagal nutylėjimą, kai modeliui nėra tikslesnio įrašo žemiau —
// dauguma "klasikinių" modelių Lietuvos naudotų automobilių rinkoje siekia maždaug šitiek.
const DEFAULT_MIN_YEAR = 1997;

// Modeliai, kurie realiai neegzistavo nuo 1997 m. (naujesnės nišos/kėbulo tipo modeliai) —
// be šito sąrašo tokiems modeliams (pvz. Škoda Kodiaq) būtų galima pasirinkti metus iš
// prieš jų sukūrimą. Apytiksliai, pagal modelio pristatymo Europos rinkai metus.
const CAR_MODEL_MIN_YEAR = {
  'Audi': { 'Q2': 2016, 'Q3': 2011, 'Q5': 2008, 'Q7': 2005, 'Q8': 2018 },
  'BMW': { 'X1': 2009, 'X6': 2008 },
  'Citroën': { 'C4': 2004 },
  'Dacia': { 'Dokker': 2012, 'Duster': 2010 },
  'Ford': { 'EcoSport': 2013, 'Kuga': 2008, 'Puma': 2019 },
  'Hyundai': { 'ix35': 2010, 'Kona': 2017, 'Tucson': 2004 },
  'Jeep': { 'Renegade': 2014 },
  'Kia': { 'Ceed': 2006 },
  'Land Rover': { 'Freelander': 1997 },
  'Lexus': { 'CT': 2010, 'NX': 2014 },
  'Mazda': { 'CX-3': 2015, 'CX-5': 2012 },
  'Mercedes-Benz': { 'CLA': 2013, 'GLA': 2013, 'GLC': 2015 },
  'Mini': { 'Countryman': 2010 },
  'Nissan': { 'Juke': 2010, 'Qashqai': 2007 },
  'Peugeot': { '2008': 2013, '3008': 2008 },
  'Porsche': { 'Macan': 2014, 'Panamera': 2009 },
  'Renault': { 'Captur': 2013, 'Kadjar': 2015 },
  'Škoda': { 'Karoq': 2017, 'Kodiaq': 2016, 'Rapid': 2012 },
  'Subaru': { 'XV': 2011 },
  'Volkswagen': { 'Tiguan': 2007 },
  'Volvo': { 'XC60': 2008, 'XC90': 2002 },
};

// KARTOS (generacijos) su konkrečiais metų intervalais — TIK dažniausiai Lietuvoje
// sutinkamoms markėms (Volkswagen, Audi, BMW, Toyota, Škoda), kad pasirinkimas rodytų
// modelį IR metų intervalą VIENAME sąrašo punkte (pvz. "Golf · Mk7 (2012–2019)"),
// panašiai kaip specializuotų automobilių svetainių (pvz. chiptuning'o failų) sąrašai.
// Modeliams/markėms, kurių čia NĖRA, naudojamas SENAS elgesys — laisvai bet kurie metai
// (carYearOptionsHtml() su CAR_MODEL_MIN_YEAR/DEFAULT_MIN_YEAR) — DUOMENŲ TRŪKUMAS
// niekada nesulaužo pasirinkimo, tik praleidžia kartos patogumą tam modeliui.
// endYear: null reiškia "iki dabar" (modelis vis dar gaminamas/naujausia karta).
const CAR_MODEL_GENERATIONS = {
  'Volkswagen': {
    'Caddy': [
      { code:'Mk3', startYear:2004, endYear:2015 },
      { code:'Mk4', startYear:2015, endYear:2020 },
      { code:'Mk5', startYear:2020, endYear:null },
    ],
    'Golf': [
      { code:'Mk3', startYear:1991, endYear:1997 },
      { code:'Mk4', startYear:1997, endYear:2003 },
      { code:'Mk5', startYear:2003, endYear:2008 },
      { code:'Mk6', startYear:2008, endYear:2012 },
      { code:'Mk7', startYear:2012, endYear:2019 },
      { code:'Mk8', startYear:2019, endYear:null },
    ],
    'Jetta': [
      { code:'Mk4', startYear:1999, endYear:2005 },
      { code:'Mk5', startYear:2005, endYear:2010 },
      { code:'Mk6', startYear:2010, endYear:2018 },
      { code:'Mk7', startYear:2018, endYear:null },
    ],
    'Passat': [
      { code:'B4', startYear:1993, endYear:1996 },
      { code:'B5', startYear:1996, endYear:2005 },
      { code:'B6', startYear:2005, endYear:2010 },
      { code:'B7', startYear:2010, endYear:2014 },
      { code:'B8', startYear:2014, endYear:null },
    ],
    'Polo': [
      { code:'Mk3', startYear:1994, endYear:2001 },
      { code:'Mk4', startYear:2001, endYear:2009 },
      { code:'Mk5', startYear:2009, endYear:2017 },
      { code:'Mk6', startYear:2017, endYear:null },
    ],
    'Sharan': [
      { code:'Mk1', startYear:1995, endYear:2010 },
      { code:'Mk2', startYear:2010, endYear:null },
    ],
    'Tiguan': [
      { code:'Mk1', startYear:2007, endYear:2016 },
      { code:'Mk2', startYear:2016, endYear:null },
    ],
    'Touareg': [
      { code:'Mk1', startYear:2002, endYear:2010 },
      { code:'Mk2', startYear:2010, endYear:2018 },
      { code:'Mk3', startYear:2018, endYear:null },
    ],
    'Touran': [
      { code:'Mk1', startYear:2003, endYear:2015 },
      { code:'Mk2', startYear:2015, endYear:null },
    ],
    'Transporter': [
      { code:'T4', startYear:1990, endYear:2003 },
      { code:'T5', startYear:2003, endYear:2015 },
      { code:'T6', startYear:2015, endYear:2021 },
      { code:'T7', startYear:2021, endYear:null },
    ],
  },
  'Audi': {
    'A1': [
      { code:'8X', startYear:2010, endYear:2018 },
      { code:'GB', startYear:2018, endYear:null },
    ],
    'A3': [
      { code:'8L', startYear:1996, endYear:2003 },
      { code:'8P', startYear:2003, endYear:2012 },
      { code:'8V', startYear:2012, endYear:2020 },
      { code:'8Y', startYear:2020, endYear:null },
    ],
    'A4': [
      { code:'B5', startYear:1994, endYear:2001 },
      { code:'B6', startYear:2001, endYear:2004 },
      { code:'B7', startYear:2004, endYear:2008 },
      { code:'B8', startYear:2008, endYear:2015 },
      { code:'B9', startYear:2015, endYear:null },
    ],
    'A5': [
      { code:'8T', startYear:2007, endYear:2016 },
      { code:'F5', startYear:2016, endYear:null },
    ],
    'A6': [
      { code:'C4', startYear:1994, endYear:1997 },
      { code:'C5', startYear:1997, endYear:2004 },
      { code:'C6', startYear:2004, endYear:2011 },
      { code:'C7', startYear:2011, endYear:2018 },
      { code:'C8', startYear:2018, endYear:null },
    ],
    'A7': [
      { code:'4G', startYear:2010, endYear:2018 },
      { code:'4K', startYear:2018, endYear:null },
    ],
    'A8': [
      { code:'D2', startYear:1994, endYear:2002 },
      { code:'D3', startYear:2002, endYear:2010 },
      { code:'D4', startYear:2010, endYear:2017 },
      { code:'D5', startYear:2017, endYear:null },
    ],
    'Q3': [
      { code:'8U', startYear:2011, endYear:2018 },
      { code:'F3', startYear:2018, endYear:null },
    ],
    'Q5': [
      { code:'8R', startYear:2008, endYear:2017 },
      { code:'FY', startYear:2017, endYear:null },
    ],
    'Q7': [
      { code:'4L', startYear:2005, endYear:2015 },
      { code:'4M', startYear:2015, endYear:null },
    ],
    'TT': [
      { code:'8N', startYear:1998, endYear:2006 },
      { code:'8J', startYear:2006, endYear:2014 },
      { code:'8S', startYear:2014, endYear:null },
    ],
  },
  'BMW': {
    '1 serija': [
      { code:'E87', startYear:2004, endYear:2011 },
      { code:'F20/F21', startYear:2011, endYear:2019 },
      { code:'F40', startYear:2019, endYear:null },
    ],
    '2 serija': [
      { code:'F22/F23', startYear:2014, endYear:2021 },
      { code:'G42/G22', startYear:2021, endYear:null },
    ],
    '3 serija': [
      { code:'E36', startYear:1990, endYear:2000 },
      { code:'E46', startYear:1998, endYear:2006 },
      { code:'E90/E91/E92/E93', startYear:2005, endYear:2013 },
      { code:'F30/F31', startYear:2011, endYear:2019 },
      { code:'G20/G21', startYear:2018, endYear:null },
    ],
    '4 serija': [
      { code:'F32/F33/F36', startYear:2013, endYear:2020 },
      { code:'G22/G23', startYear:2020, endYear:null },
    ],
    '5 serija': [
      { code:'E34', startYear:1988, endYear:1996 },
      { code:'E39', startYear:1995, endYear:2004 },
      { code:'E60/E61', startYear:2003, endYear:2010 },
      { code:'F10/F11', startYear:2010, endYear:2017 },
      { code:'G30/G31', startYear:2016, endYear:2023 },
      { code:'G60', startYear:2023, endYear:null },
    ],
    '6 serija': [
      { code:'E63/E64', startYear:2003, endYear:2010 },
      { code:'F06/F12/F13', startYear:2011, endYear:2018 },
    ],
    '7 serija': [
      { code:'E38', startYear:1994, endYear:2001 },
      { code:'E65/E66', startYear:2001, endYear:2008 },
      { code:'F01/F02', startYear:2008, endYear:2015 },
      { code:'G11/G12', startYear:2015, endYear:2022 },
      { code:'G70', startYear:2022, endYear:null },
    ],
    'X1': [
      { code:'E84', startYear:2009, endYear:2015 },
      { code:'F48', startYear:2015, endYear:2022 },
      { code:'U11', startYear:2022, endYear:null },
    ],
    'X3': [
      { code:'E83', startYear:2003, endYear:2010 },
      { code:'F25', startYear:2010, endYear:2017 },
      { code:'G01', startYear:2017, endYear:null },
    ],
    'X5': [
      { code:'E53', startYear:1999, endYear:2006 },
      { code:'E70', startYear:2006, endYear:2013 },
      { code:'F15', startYear:2013, endYear:2018 },
      { code:'G05', startYear:2018, endYear:null },
    ],
    'X6': [
      { code:'E71', startYear:2008, endYear:2014 },
      { code:'F16', startYear:2014, endYear:2019 },
      { code:'G06', startYear:2019, endYear:null },
    ],
    'Z4': [
      { code:'E85/E86', startYear:2002, endYear:2008 },
      { code:'E89', startYear:2009, endYear:2016 },
      { code:'G29', startYear:2018, endYear:null },
    ],
  },
  'Toyota': {
    'Auris': [
      { code:'E150', startYear:2006, endYear:2012 },
      { code:'E180', startYear:2012, endYear:2018 },
    ],
    'Avensis': [
      { code:'T220', startYear:1997, endYear:2003 },
      { code:'T250', startYear:2003, endYear:2008 },
      { code:'T270', startYear:2008, endYear:2018 },
    ],
    'Camry': [
      { code:'XV50', startYear:2011, endYear:2017 },
      { code:'XV70', startYear:2017, endYear:null },
    ],
    'Corolla': [
      { code:'E110', startYear:1997, endYear:2002 },
      { code:'E120', startYear:2001, endYear:2007 },
      { code:'E150', startYear:2007, endYear:2013 },
      { code:'E160/E170', startYear:2013, endYear:2019 },
      { code:'E210', startYear:2019, endYear:null },
    ],
    'Hilux': [
      { code:'N140/N150', startYear:1997, endYear:2005 },
      { code:'N70', startYear:2005, endYear:2015 },
      { code:'N80', startYear:2015, endYear:null },
    ],
    'Land Cruiser': [
      { code:'J100', startYear:1998, endYear:2007 },
      { code:'J200', startYear:2007, endYear:2021 },
      { code:'J300', startYear:2021, endYear:null },
    ],
    'Prius': [
      { code:'NHW11', startYear:1997, endYear:2003 },
      { code:'NHW20', startYear:2003, endYear:2009 },
      { code:'ZVW30', startYear:2009, endYear:2015 },
      { code:'ZVW50', startYear:2015, endYear:2022 },
      { code:'ZVW60', startYear:2022, endYear:null },
    ],
    'RAV4': [
      { code:'XA20', startYear:2000, endYear:2005 },
      { code:'XA30', startYear:2005, endYear:2012 },
      { code:'XA40', startYear:2012, endYear:2018 },
      { code:'XA50', startYear:2018, endYear:null },
    ],
    'Yaris': [
      { code:'XP10', startYear:1999, endYear:2005 },
      { code:'XP90', startYear:2005, endYear:2011 },
      { code:'XP130', startYear:2011, endYear:2020 },
      { code:'XP210', startYear:2020, endYear:null },
    ],
  },
  'Škoda': {
    'Fabia': [
      { code:'Mk1', startYear:1999, endYear:2007 },
      { code:'Mk2', startYear:2007, endYear:2014 },
      { code:'Mk3', startYear:2014, endYear:2021 },
      { code:'Mk4', startYear:2021, endYear:null },
    ],
    'Octavia': [
      { code:'Mk1', startYear:1996, endYear:2010 },
      { code:'Mk2', startYear:2004, endYear:2013 },
      { code:'Mk3', startYear:2012, endYear:2020 },
      { code:'Mk4', startYear:2019, endYear:null },
    ],
    'Rapid': [
      { code:'NH', startYear:2012, endYear:2019 },
    ],
    'Roomster': [
      { code:'5J', startYear:2006, endYear:2015 },
    ],
    'Superb': [
      { code:'Mk1', startYear:2001, endYear:2008 },
      { code:'Mk2', startYear:2008, endYear:2015 },
      { code:'Mk3', startYear:2015, endYear:null },
    ],
    'Yeti': [
      { code:'5L', startYear:2009, endYear:2017 },
    ],
  },
};

// Modelio <select> parinkties reikšmę užkoduoja/iškoduoja kartos duomenis — žr.
// carModelOptionsHtml()/onCarModelSelectChange() žemiau. Skirtukas "||" pasirinktas,
// nes modelio pavadinimuose (pvz. "1 serija") niekada nepasitaiko.
function encodeModelGenValue(model, gen){
  return `${model}||${gen.code}||${gen.startYear}||${gen.endYear!=null?gen.endYear:''}`;
}
function parseModelOptionValue(raw){
  if(!raw || raw.indexOf('||') === -1) return { model: raw || '', startYear: null, endYear: null };
  const [model, code, startYear, endYear] = raw.split('||');
  return { model, code, startYear: Number(startYear), endYear: endYear ? Number(endYear) : null };
}
// Randa kartos įrašą, kuriam priklauso duoti metai — naudojama IR pažymint teisingą
// parinktį carModelOptionsHtml() sąraše, IR redaguojant jau įrašytą automobilį (žr.
// mano-paskyra.html), kad Metų sąrašas iškart būtų susiaurintas be papildomo paspaudimo.
function findMatchingGeneration(make, model, year){
  const gens = CAR_MODEL_GENERATIONS[make] && CAR_MODEL_GENERATIONS[make][model];
  const y = year ? Number(year) : null;
  if(!gens || !y) return null;
  return gens.find(g => y>=g.startYear && (g.endYear==null || y<=g.endYear)) || null;
}

const CAR_BODY_TYPES = ['Sedanas','Universalas','Hečbekas','Visureigis/SUV','Kupė','Kabrioletas','Vienatūris','Pikapas','Mikroautobusas'];

function carMakeOptionsHtml(selected){
  const makes = Object.keys(CAR_MAKES_MODELS).sort((a,b)=>a.localeCompare(b,'lt'));
  const known = selected && CAR_MAKES_MODELS[selected];
  return '<option value="">— pasirinkite markę —</option>'
    + makes.map(m=>`<option value="${m}"${selected===m?' selected':''}>${m}</option>`).join('')
    + `<option value="__other__"${selected && !known ? ' selected':''}>Kita markė...</option>`;
}
function carModelOptionsHtml(make, selected, selectedYear){
  const models = CAR_MAKES_MODELS[make] || [];
  const known = selected && models.includes(selected);
  const selYearNum = selectedYear ? Number(selectedYear) : null;
  const optionsHtml = models.map(m=>{
    const gens = CAR_MODEL_GENERATIONS[make] && CAR_MODEL_GENERATIONS[make][m];
    if(!gens) return `<option value="${m}"${selected===m?' selected':''}>${m}</option>`;
    // Modelis su žinomomis kartomis — kiekviena karta SAVA parinktis, iškart rodanti
    // metų intervalą (žr. failo viršuje esantį komentarą apie CAR_MODEL_GENERATIONS).
    return gens.map(g=>{
      const isSelected = selected===m && selYearNum!=null && selYearNum>=g.startYear && (g.endYear==null || selYearNum<=g.endYear);
      const yearLabel = g.endYear ? `${g.startYear}–${g.endYear}` : `${g.startYear}→`;
      return `<option value="${encodeModelGenValue(m,g)}"${isSelected?' selected':''}>${m} · ${g.code} (${yearLabel})</option>`;
    }).join('');
  }).join('');
  return '<option value="">— pasirinkite modelį —</option>'
    + optionsHtml
    + `<option value="__other__"${selected && !known ? ' selected':''}>Kitas modelis...</option>`;
}
function carYearOptionsHtml(make, model, selected, overrideMinYear, overrideMaxYear){
  const currentYear = new Date().getFullYear();
  const minYear = overrideMinYear || (CAR_MODEL_MIN_YEAR[make] && CAR_MODEL_MIN_YEAR[make][model]) || DEFAULT_MIN_YEAR;
  const maxYear = overrideMaxYear || currentYear;
  const years = [];
  for(let y = maxYear; y >= minYear; y--) years.push(y);
  // Jei redaguojamo/jau įrašyto automobilio metai už standartinio diapazono ribų (senesnis
  // įrašas ar nežinoma markė/modelis) — vis tiek įtraukiame, kad pasirinkta reikšmė nedingtų.
  const selNum = selected ? Number(selected) : null;
  if(selNum && !years.includes(selNum)){ years.push(selNum); years.sort((a,b)=>b-a); }
  return '<option value="">— pasirinkite metus —</option>'
    + years.map(y=>`<option value="${y}" ${selNum===y?'selected':''}>${y}</option>`).join('');
}
function carBodyTypeOptionsHtml(selected){
  return '<option value="">— nepasirinkta —</option>'
    + CAR_BODY_TYPES.map(b=>`<option value="${b}" ${selected===b?'selected':''}>${b}</option>`).join('');
}

function onCarMakeSelectChange(prefix){
  const makeSel = document.getElementById(`${prefix}-make`);
  const makeOther = document.getElementById(`${prefix}-make-other`);
  const isOther = makeSel.value === '__other__';
  if(makeOther) makeOther.style.display = isOther ? 'block' : 'none';
  const modelSel = document.getElementById(`${prefix}-model`);
  if(modelSel) modelSel.innerHTML = carModelOptionsHtml(isOther ? '' : makeSel.value, '');
  onCarModelSelectChange(prefix);
}
function onCarModelSelectChange(prefix){
  const modelSel = document.getElementById(`${prefix}-model`);
  const modelOther = document.getElementById(`${prefix}-model-other`);
  if(modelSel && modelOther) modelOther.style.display = modelSel.value === '__other__' ? 'block' : 'none';
  const yearSel = document.getElementById(`${prefix}-year`);
  if(yearSel){
    const makeSel = document.getElementById(`${prefix}-make`);
    const make = makeSel && makeSel.value !== '__other__' ? makeSel.value : '';
    const rawModelValue = modelSel && modelSel.value !== '__other__' ? modelSel.value : '';
    const parsed = parseModelOptionValue(rawModelValue);
    // Karta jau žinoma (pasirinkta iš CAR_MODEL_GENERATIONS parinkties) — Metų sąrašas
    // susiaurinamas TIK iki tos kartos intervalo, atskiro "Karta" žingsnio nereikia.
    yearSel.innerHTML = carYearOptionsHtml(make, parsed.model, '', parsed.startYear, parsed.endYear);
  }
}
function readCarSelection(prefix){
  const makeSel = document.getElementById(`${prefix}-make`);
  const modelSel = document.getElementById(`${prefix}-model`);
  const make = makeSel.value === '__other__'
    ? (document.getElementById(`${prefix}-make-other`).value || '').trim()
    : makeSel.value;
  const model = modelSel.value === '__other__'
    ? (document.getElementById(`${prefix}-model-other`).value || '').trim()
    : parseModelOptionValue(modelSel.value).model; // karta (jei buvo) NESAUGOMA atskirai — žr. failo viršų
  const yearSel = document.getElementById(`${prefix}-year`);
  const year = yearSel && yearSel.value ? Number(yearSel.value) : null;
  const bodyTypeSel = document.getElementById(`${prefix}-bodytype`);
  const bodyType = bodyTypeSel && bodyTypeSel.value ? bodyTypeSel.value : null;
  return { make, model, year, bodyType };
}
