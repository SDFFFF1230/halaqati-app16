# حزمة بناء أندرويد لتطبيق حلقتي (Codemagic)

ارفع محتويات هذه الحزمة إلى **جذر** المستودع نفسه الذي فيه index.html و app.js (لا تغيّر شيئاً):
- codemagic.yaml
- package.json
- capacitor.config.json
- .gitignore
- scripts/build-web.js
- assets/ (أيقونات وشاشة البداية)

ثم في Codemagic اضغط "Check for configuration files" واختر workflow: android-apk ثم Start new build.
بعد انتهاء البناء (10–20 دقيقة) حمّل ملف app-debug.apk من قسم Artifacts وثبّته على الهاتف.
