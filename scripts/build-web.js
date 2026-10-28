/* يجهّز مجلد www للتطبيق: ينسخ ملفات الموقع، ثم يحمّل المكتبات والخطوط ويضعها داخل التطبيق
   حتى يعمل التطبيق بدون إنترنت من أول فتحة. أي فشل بالتحميل يوقف البناء عمداً (أفضل من تطبيق معطوب). */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'vendor', 'fonts'), { recursive: true });

// ملف service-worker لا يُنسخ عمداً: التطبيق المغلّف يحتفظ بملفاته بنفسه
for (const f of ['app.js', 'manifest.json']) fs.copyFileSync(path.join(root, f), path.join(out, f));
fs.cpSync(path.join(root, 'icons'), path.join(out, 'icons'), { recursive: true });

const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
async function get(url, asText) {
  const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('فشل تحميل ' + url + ' (' + r.status + ')');
  return asText ? await r.text() : Buffer.from(await r.arrayBuffer());
}

const LIBS = [
  ['https://unpkg.com/react@18.2.0/umd/react.production.min.js', 'vendor/react.production.min.js'],
  ['https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js', 'vendor/react-dom.production.min.js'],
  ['https://unpkg.com/lucide@0.292.0', 'vendor/lucide.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'vendor/html2canvas.min.js'],
  ['https://cdn.tailwindcss.com', 'vendor/tailwind.js'],
];
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap';

(async () => {
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  for (const [url, rel] of LIBS) {
    if (!html.includes(url)) throw new Error('الرابط غير موجود في index.html: ' + url);
    const data = await get(url, false);
    if (data.length < 1000) throw new Error('ملف صغير بشكل مريب: ' + url);
    fs.writeFileSync(path.join(out, rel), data);
    html = html.split(url).join(rel);
    console.log('تم:', rel, Math.round(data.length / 1024) + 'KB');
  }

  if (!html.includes(FONT_CSS)) throw new Error('رابط الخطوط غير موجود في index.html');
  let css = await get(FONT_CSS, true);
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
  if (!urls.length) throw new Error('لم يتم العثور على ملفات الخطوط');
  let i = 0;
  for (const u of urls) {
    const name = 'f' + i++ + '.woff2';
    fs.writeFileSync(path.join(out, 'vendor', 'fonts', name), await get(u, false));
    css = css.split(u).join('fonts/' + name);
  }
  fs.writeFileSync(path.join(out, 'vendor', 'fonts.css'), css);
  html = html.split(FONT_CSS).join('vendor/fonts.css');
  console.log('تم: الخطوط (' + urls.length + ' ملف)');

  if (/https:\/\/(unpkg\.com|cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com)/.test(html)) {
    throw new Error('ما زال في index.html رابط خارجي لم يُستبدل');
  }
  fs.writeFileSync(path.join(out, 'index.html'), html);
  console.log('اكتمل تجهيز www');
})().catch((e) => { console.error('خطأ:', e.message); process.exit(1); });
