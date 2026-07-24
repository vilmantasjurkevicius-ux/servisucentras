const { Resend } = require('resend');

// Kol nėra patvirtinto domeno (žr. santrauka.md), siunčiama iš Resend numatytojo
// testinio adreso — jis veikia be jokio papildomo nustatymo, bet gavėjas matys
// "onboarding@resend.dev" kaip siuntėją. Patvirtinus savo domeną Resend'e, pakeisti
// FROM į pvz. "ServisuCentras <pranesimai@servisucentras.lt>".
const FROM = 'ServisuCentras <onboarding@resend.dev>';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Bendras laiško siuntimo apvalkalas — NIEKADA nemeta klaidos aukštyn. El. pašto
// pranešimai yra papildoma funkcija, jų nepavykimas neturi sugriauti registracijos/
// užklausos kūrimo. Klaida tik užloguojama serverio pusėje.
async function sendEmail({ to, subject, html }) {
  if (!to) return; // pvz. svečias be el. pašto — tyliai praleidžiama
  if (!resend) {
    console.error(`RESEND_API_KEY nenustatytas — laiškas "${subject}" į ${to} nesiųstas.`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error(`Nepavyko išsiųsti laiško "${subject}" į ${to}:`, err.message);
  }
}

function layout(title, bodyHtml) {
  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:28px 24px;background:#0E0F10;color:#F0EDE5;">
  <div style="font-family:Arial,sans-serif;font-weight:700;font-size:18px;letter-spacing:0.03em;margin-bottom:24px;">
    SERVISU<span style="color:#F5C400;">CENTRAS</span>
  </div>
  <h2 style="font-size:18px;margin:0 0 14px;color:#F0EDE5;">${title}</h2>
  <div style="font-size:14px;line-height:1.6;color:#F0EDE5;">${bodyHtml}</div>
  <p style="margin-top:32px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);font-size:11px;color:#7A8088;">
    ServisuCentras.lt — automatinis pranešimas, į šį laišką atsakyti nereikia.
  </p>
</div>`;
}

async function sendServiceRegistrationEmail(service) {
  await sendEmail({
    to: service.email,
    subject: 'Sveiki prisijungę prie ServisuCentras.lt',
    html: layout('Registracija sėkminga!', `
      <p>Sveiki, ${service.name}!</p>
      <p>Jūsų servisas sėkmingai užregistruotas <b>ServisuCentras.lt</b> platformoje ir jau matomas klientams.</p>
      <p>Prisijunkite prie savo valdymo skydelio, kad galėtumėte matyti ir atsakyti į gaunamas užklausas.</p>
    `),
  });
}

async function sendNewOrderEmail(service, order) {
  await sendEmail({
    to: service.email,
    subject: `Nauja užklausa — ${order.city}`,
    html: layout('Gauta nauja užklausa', `
      <p>Sveiki, ${service.name}!</p>
      <p><b>Miestas:</b> ${order.city}</p>
      <p><b>Aprašymas:</b> ${order.description}</p>
      <p>Prisijunkite prie savo valdymo skydelio ir atsakykite klientui kuo greičiau — greitas atsakymas dažnai lemia, ar klientas pasirinks jus.</p>
    `),
  });
}

async function sendQuoteEmail(client, price) {
  await sendEmail({
    to: client.email,
    subject: 'Gautas naujas kainos pasiūlymas',
    html: layout('Servisas pasiūlė kainą', `
      <p>Sveiki, ${client.first_name || ''}!</p>
      <p>Jūsų užklausai gautas naujas pasiūlymas: <b style="color:#F5C400;">${price}€</b></p>
      <p>Peržiūrėkite ir palyginkite visus pasiūlymus savo pokalbyje ServisuCentras.lt svetainėje.</p>
    `),
  });
}

module.exports = { sendServiceRegistrationEmail, sendNewOrderEmail, sendQuoteEmail };
