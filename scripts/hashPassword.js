// أداة لإنشاء كلمة مرور مشفّرة (hash) لحساب الأدمن
// الاستخدام: npm run hash-password -- "كلمة_المرور_هنا"
const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.log("الاستخدام: npm run hash-password -- \"كلمة_المرور\"");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nضع هذا السطر في ملف .env أو في إعدادات البيئة على الاستضافة:\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
