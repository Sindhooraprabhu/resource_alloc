const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys Generated:');
console.log('=====================');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\nAdd these to your .env file');
console.log('For email (Gmail example):');
console.log('EMAIL_HOST=smtp.gmail.com');
console.log('EMAIL_PORT=587');
console.log('EMAIL_USER=your-email@gmail.com');
console.log('EMAIL_PASS=your-app-password');
console.log('EMAIL_FROM="LifeLink AI <noreply@lifelink.ai>"');
console.log('CLIENT_URL=http://localhost:3000');