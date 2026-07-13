# Užduotis Claude Code: Kalendorius, Statistika, Paslaugos, Profilis

Automeistrai-dashboard.html šoniniame meniu šie 4 punktai kol kas tik alert() — noriu, kad jie realiai veiktų su backend'u. Prašau padaryti po vieną, patikrinant kiekvieną prieš pereinant prie kito.

## 1. Profilis (paprasčiausia, pradėk nuo šito)
- Naujas puslapis/tab'as, kuriame servisas mato ir gali redaguoti: pavadinimą, adresą, telefoną, el. paštą, darbo valandas, kategorijas, kuriose dirba
- Reikės PATCH /api/services/me endpoint'o (jei dar nėra)
- Pakeitimai turi realiai išsisaugoti DB ir atsispindėti servisucentras-pagrindinis.html sąraše

## 2. Statistika
- Rodyti: viso užsakymų (pagal statusą), šio mėnesio pajamos (po komisinio), vidutinis įvertinimas, populiariausios kategorijos
- Skaičiuoti iš jau esančių orders duomenų (nereikia naujos lentelės, tik agregavimo query)
- Paprastas grafikas (savaitės/mėnesio užsakymų kiekis) — gali naudoti tą patį stilių, kaip esamas "savaitės apkrovos" barų grafikas dashboard'e

## 3. Paslaugos
- Sąrašas kategorijų/paslaugų, kurias servisas siūlo, su galimybe įjungti/išjungti kiekvieną ir nurodyti orientacinę kainą
- Reikės naujos lentelės (service_categories arba panašiai: service_id, category_id, price_from, active)
- Šis sąrašas turi atitikti tai, ką klientas mato pagrindiniame puslapyje ieškodamas pagal kategoriją

## 4. Kalendorius
- Sudėtingiausia — orders lentelėje nėra scheduled_time lauko
- Pridėti scheduled_time lauką prie orders (kada suplanuotas darbas)
- Rodyti mėnesio/savaitės vaizdą su suplanuotais darbais
- Šis punktas gali palaukti, jei laiko trūksta — svarbiausi 1-3

Po kiekvieno punkto trumpai parašyk, ką patikrinai gyvai (ne tik "code compiles").
