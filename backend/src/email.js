const { Resend } = require('resend');

const FROM = 'ServisuCentras <info@servisucentras.lt>';

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
    SERVISŲ<span style="color:#E63946;">CENTRAS</span>
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

async function sendServiceDeclinedEmail(client, service, reason) {
  await sendEmail({
    to: client.email,
    subject: 'Servisas atsisakė jūsų užklausos',
    html: layout('Servisas atsisakė darbo', `
      <p>Sveiki, ${client.first_name || ''}!</p>
      <p><b>${service.name}</b> atsisakė jūsų užklausos.</p>
      <p><b>Nurodyta priežastis:</b> ${reason}</p>
      <p>Jūsų užklausa automatiškai grąžinta kitiems tinkamiems servisams — netrukus galite sulaukti naujų pasiūlymų.</p>
    `),
  });
}

async function sendOrderReopenedEmail(service, order) {
  await sendEmail({
    to: service.email,
    subject: `Vėl laisva užklausa — ${order.city}`,
    html: layout('Užklausa vėl laisva', `
      <p>Sveiki, ${service.name}!</p>
      <p>Ankstesnis servisas atsisakė šios užklausos — ji vėl laukia atsakymo.</p>
      <p><b>Miestas:</b> ${order.city}</p>
      <p><b>Aprašymas:</b> ${order.description}</p>
      <p>Prisijunkite prie savo valdymo skydelio ir atsakykite klientui, jei galite padėti.</p>
    `),
  });
}

async function sendInvitationEmail({ to, subject, paragraphs }) {
  await sendEmail({
    to,
    subject,
    html: layout(subject, paragraphs.map((p) => `<p>${p}</p>`).join('')),
  });
}

async function sendPasswordResetEmail({ to, resetLink }) {
  await sendEmail({
    to,
    subject: 'Slaptažodžio atstatymas — ServisuCentras.lt',
    html: layout('Slaptažodžio atstatymas', `
      <p>Gavome prašymą atstatyti jūsų paskyros slaptažodį.</p>
      <p><a href="${resetLink}" style="color:#E63946;">Spauskite čia, kad nustatytumėte naują slaptažodį</a></p>
      <p>Nuoroda galioja 1 valandą. Jei šio prašymo nesiuntėte, laišką galite ignoruoti — jūsų slaptažodis nepasikeis.</p>
    `),
  });
}

module.exports = {
  sendServiceRegistrationEmail, sendNewOrderEmail, sendQuoteEmail,
  sendServiceDeclinedEmail, sendOrderReopenedEmail, sendInvitationEmail,
  sendPasswordResetEmail,
};
