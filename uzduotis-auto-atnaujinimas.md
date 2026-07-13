# Užduotis Claude Code: Automatinis dashboard atnaujinimas (polling)

Šiuo metu servisas dashboard'e mato naujas užklausas tik atsinaujinęs puslapį (F5). Noriu paprasto sprendimo — automatinio atsinaujinimo, ne pilno WebSocket.

## Ką padaryti

1. `automeistrai-dashboard.html` — kas 10-15 sek. automatiškai iš naujo užklausti GET /api/orders (ar kas ten dabar naudojama), ir jei atsirado naujų užsakymų palyginus su tuo, kas jau rodoma — atnaujinti sąrašą be viso puslapio perkrovimo (tik duomenis, ne visą page reload).

2. Kai atsiranda naujas užsakymas "Naujos" skiltyje, kurio anksčiau nebuvo:
   - Trumpas vizualinis dėmesio atkreipimas (pvz. švelnus paryškinimas/animacija ant naujo įrašo, arba skaičiuko ant "Naujos" tab pasikeitimas su spalva)
   - Neprivaloma, bet būtų gerai: garso signalas arba naršyklės notification (jei paprasta padaryti — jei sudėtinga, praleisk)

3. Svarbu: polling turi sustoti/nesitęsti, kai naršyklės tab'as neaktyvus arba puslapis uždarytas (kad nesikrautų serveris be reikalo). Naudok document.visibilityState arba panašiai.

4. Patikrink gyvai: atidaryk dashboard vienoje naršyklės kortelėje, per kitą (ar per pagrindinį puslapį) sukurk naują užklausą kaip klientas, palauk iki 15 sek. ir patvirtink, kad ji pati atsirado dashboard'e be F5.

Nereikia WebSocket, nereikia "klientas rašo..." indikatoriaus — tik šis paprastas polling sprendimas.
