// Aptinka telefono numerius ir el. paštus laisvame žinutės tekste, kad klientas
// negalėtų apeiti platformos parašydamas kontaktą tiesiog chat žinutėje.
// Filtruojama TIK atvaizdavimo metu (GET /:id/messages) — DB laikoma pilna,
// nefiltruota žinutė, kad priėmus (client_accepted_at) būtų galima ją parodyti pilną.
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+370|8)[\s-]*\d(?:[\s-]*\d){7}/g;
const REDACTED = '[kontaktas paslėptas iki priėmimo]';

function redactContacts(text) {
  if (!text) return text;
  return text.replace(EMAIL_REGEX, REDACTED).replace(PHONE_REGEX, REDACTED);
}

module.exports = { redactContacts };
