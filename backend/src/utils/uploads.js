// Serviso profilio nuotraukos apdorojimas ir saugojimas — TIESIOG tame pačiame Railway
// Volume, kur laikoma DB (žr. db.js DB_PATH), kad nereikėtų atskiro išorinio saugojimo
// (Cloudinary ir pan.) vienai nuotraukai vienam servisui.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'servisucentras.db');
const UPLOADS_DIR = path.join(path.dirname(DB_PATH), 'uploads', 'services');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB — originalaus (dar nesuspausto) failo riba
const MAX_DIMENSION = 800; // suspaudimo/sumažinimo riba, taupo vietą Volume ir kraunasi greičiau

// PNG su permatomumu (pvz. logotipas) paliekamas PNG, kad neprarastų skaidrumo; kitaip —
// suspaudžiamas kaip JPEG (mažesnis failas nuotraukoms, kur permatomumas nesvarbus).
async function saveServicePhoto(serviceId, buffer) {
  const metadata = await sharp(buffer).metadata();
  const hasAlpha = !!metadata.hasAlpha;
  const ext = hasAlpha ? 'png' : 'jpg';
  const filename = `service-${serviceId}-${Date.now()}.${ext}`;
  const outPath = path.join(UPLOADS_DIR, filename);

  const resized = sharp(buffer)
    .rotate() // auto-orientacija pagal EXIF (dažna problema su telefonu darytomis nuotraukomis)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true });

  if (hasAlpha) {
    await resized.png({ compressionLevel: 9, quality: 85 }).toFile(outPath);
  } else {
    await resized.jpeg({ quality: 82 }).toFile(outPath);
  }
  return filename;
}

function deleteServicePhoto(filename) {
  if (!filename) return;
  try { fs.unlinkSync(path.join(UPLOADS_DIR, filename)); } catch { /* jau ištrinta arba nebuvo sukurta */ }
}

module.exports = { UPLOADS_DIR, MAX_UPLOAD_BYTES, saveServicePhoto, deleteServicePhoto };
