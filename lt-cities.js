/* ══ LT-CITIES.JS — bendras Lietuvos miestų/savivaldybių sąrašas ══
   Naudojamas keliuose failuose (automeistrai-login.html, automeistrai-dashboard.html,
   mano-paskyra.html), kad sąrašas nebūtų dubliuojamas — žr. car-data.js dėl to paties
   principo automobilių duomenims. Naudojamas TIEK "Miestas" (city), TIEK "Savivaldybė/
   rajonas" (municipality) laukams atskirai — žr. santrauka.md "Struktūrizuotas adresas"
   (senoji "rajono" varnelė, koduodavusi tai kaip city priesagą, PAŠALINTA — dabar tam
   yra tikra municipality kolona backend'e). */

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
