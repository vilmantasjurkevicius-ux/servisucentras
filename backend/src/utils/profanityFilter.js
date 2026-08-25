// Paprastas lietuviškų (ir dažnų pasiskolintų) keiksmažodžių filtras atsiliepimų
// komentarams — TIK aptikimas/atmetimas paraše (POST /orders/:id/review), niekas
// nesaugoma cenzūruota, tiesiog užklausa atmetama su aiškia klaida.
const BANNED_WORDS = [
  'blet', 'blett', 'blyat', 'kurva', 'šūdas', 'sudas', 'šikna', 'sikna',
  'šikti', 'sikti', 'pisti', 'pisdiais', 'pizdec', 'pyzdec', 'pizda', 'pyzda',
  'chuj', 'huinia', 'jebti', 'jebt', 'bybis', 'bybys',
];

// \b neveikia teisingai prieš lietuviškas raides su diakritikais (š, ū...), nes JS \w
// jų nepripažįsta "žodžio" simboliais — vietoj to neigiamas lookbehind su \p{L}/\p{N}
// (bet kokia UNICODE raidė/skaičius), veikiantis su bet kuria kalba.
const BANNED_REGEX = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${BANNED_WORDS.join('|')})[\\p{L}\\p{N}]*`,
  'iu'
);

function containsProfanity(text) {
  if (!text) return false;
  return BANNED_REGEX.test(text);
}

module.exports = { containsProfanity };
