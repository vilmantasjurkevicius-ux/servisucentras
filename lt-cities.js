/* ══ LT-CITIES.JS — bendras Lietuvos miestų/rajonų sąrašas (visos savivaldybės) ══
   Naudojamas keliuose failuose (automeistrai-login.html, automeistrai-dashboard.html,
   mano-paskyra.html), kad sąrašas nebūtų dubliuojamas — žr. car-data.js dėl to paties
   principo automobilių duomenims. Miesto laukas VISADA turi būti tiksliai iš šio
   sąrašo (galimai su composeCityWithRajonas() priesaga) — laisvo teksto variantas
   TYČIA pašalintas (žr. santrauka.md "Kaimo/rajono servisai"), nes visos paieškos
   pagal miestą ieško tiksliu sutapimu. */

const LT_CITIES = [
  'Akmenė','Alytus','Anykščiai','Birštonas','Biržai','Druskininkai','Elektrėnai',
  'Ignalina','Jonava','Joniškis','Jurbarkas','Kaišiadorys','Kalvarija','Kaunas',
  'Kazlų Rūda','Kėdainiai','Kelmė','Klaipėda','Kretinga','Kupiškis','Lazdijai',
  'Marijampolė','Mažeikiai','Molėtai','Neringa','Pagėgiai','Pakruojis','Palanga',
  'Panevėžys','Pasvalys','Plungė','Prienai','Radviliškis','Raseiniai','Rietavas',
  'Rokiškis','Skuodas','Šakiai','Šalčininkai','Šiauliai','Šilalė','Šilutė',
  'Širvintos','Švenčionys','Tauragė','Telšiai','Trakai','Ukmergė','Utena',
  'Varėna','Vilkaviškis','Vilnius','Visaginas','Zarasai',
];

// "Rajonas" varnelė (registracijos/Nustatymų miesto laukas) — servisas pažymi, kad yra
// rajone, ne pačiame mieste (pvz. kaimas šalia Ukmergės). Naudojamas TEKSTINIS priesagas
// " (rajonas)" (ne gramatinis linksniavimas — "Vilniaus raj." reikalautų atskiro
// linksniavimo žodyno visiems 55 pavadinimams) — tikslas čia atskiras, tiksliai
// paieškoje randamas string, ne gramatinis tikslumas.
const RAJONAS_SUFFIX = ' (rajonas)';
function composeCityWithRajonas(baseCity, isRajonas){
  return baseCity && isRajonas ? baseCity + RAJONAS_SUFFIX : (baseCity || '');
}
function decomposeCityRajonas(fullCity){
  if(fullCity && fullCity.endsWith(RAJONAS_SUFFIX)){
    return { baseCity: fullCity.slice(0, -RAJONAS_SUFFIX.length), isRajonas: true };
  }
  return { baseCity: fullCity || '', isRajonas: false };
}
