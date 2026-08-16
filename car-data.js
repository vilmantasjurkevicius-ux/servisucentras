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

const CAR_BODY_TYPES = ['Sedanas','Universalas','Hečbekas','Visureigis/SUV','Kupė','Kabrioletas','Vienatūris','Pikapas','Mikroautobusas'];

function carMakeOptionsHtml(selected){
  const makes = Object.keys(CAR_MAKES_MODELS).sort((a,b)=>a.localeCompare(b,'lt'));
  const known = selected && CAR_MAKES_MODELS[selected];
  return '<option value="">— pasirinkite markę —</option>'
    + makes.map(m=>`<option value="${m}"${selected===m?' selected':''}>${m}</option>`).join('')
    + `<option value="__other__"${selected && !known ? ' selected':''}>Kita markė...</option>`;
}
function carModelOptionsHtml(make, selected){
  const models = CAR_MAKES_MODELS[make] || [];
  const known = selected && models.includes(selected);
  return '<option value="">— pasirinkite modelį —</option>'
    + models.map(m=>`<option value="${m}"${selected===m?' selected':''}>${m}</option>`).join('')
    + `<option value="__other__"${selected && !known ? ' selected':''}>Kitas modelis...</option>`;
}
function carYearOptionsHtml(make, model, selected){
  const currentYear = new Date().getFullYear();
  const minYear = (CAR_MODEL_MIN_YEAR[make] && CAR_MODEL_MIN_YEAR[make][model]) || DEFAULT_MIN_YEAR;
  const years = [];
  for(let y = currentYear; y >= minYear; y--) years.push(y);
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
    const model = modelSel && modelSel.value !== '__other__' ? modelSel.value : '';
    yearSel.innerHTML = carYearOptionsHtml(make, model, '');
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
    : modelSel.value;
  const yearSel = document.getElementById(`${prefix}-year`);
  const year = yearSel && yearSel.value ? Number(yearSel.value) : null;
  const bodyTypeSel = document.getElementById(`${prefix}-bodytype`);
  const bodyType = bodyTypeSel && bodyTypeSel.value ? bodyTypeSel.value : null;
  return { make, model, year, bodyType };
}
