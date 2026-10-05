const webpush = require('web-push');
const nodemailer = require('nodemailer');

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

let transporter = null;

const initEmailTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
};

const initWebPush = () => {
  if (vapidKeys.publicKey && vapidKeys.privateKey) {
    webpush.setVapidDetails(
      'mailto:admin@lifelink.ai',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }
};

initEmailTransporter();
initWebPush();

const sendWebPush = async (subscription, payload) => {
  if (!vapidKeys.publicKey) {
    console.warn('VAPID keys not configured, skipping web push');
    return { success: false, reason: 'VAPID not configured' };
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    if (error.statusCode === 410) {
      return { success: false, reason: 'subscription_expired' };
    }
    console.error('Web push error:', error);
    return { success: false, reason: error.message };
  }
};

const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.warn('Email transporter not configured, skipping email');
    return { success: false, reason: 'Email not configured' };
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"LifeLink AI" <noreply@lifelink.ai>',
      to,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, reason: error.message };
  }
};

const sendSMS = async (phone, message) => {
  console.log(`[SMS Simulation] To: ${phone} - ${message}`);
  return { success: true, simulated: true };
};

const notifyPatient = async (emergency, notification) => {
  const results = [];

  if (emergency.pushSubscription) {
    results.push(await sendWebPush(emergency.pushSubscription, {
      title: 'LifeLink Emergency Update',
      body: notification.message,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: `emergency-${emergency._id}`,
      data: {
        emergencyId: emergency._id,
        type: notification.type,
        url: `/emergency-case/${emergency._id}`
      }
    }));
  }

  if (emergency.patient?.email) {
    results.push(await sendEmail(
      emergency.patient.email,
      `Emergency Update: ${notification.message}`,
      `<p>${notification.message}</p><p><a href="${process.env.CLIENT_URL}/emergency-case/${emergency._id}">View Case</a></p>`
    ));
  }

  if (emergency.contactPerson?.phone) {
    results.push(await sendSMS(emergency.contactPerson.phone, `LifeLink: ${notification.message}`));
  }

  return results;
};

const notifyHospital = async (hospital, notification) => {
  const results = [];

  if (hospital.pushSubscription) {
    results.push(await sendWebPush(hospital.pushSubscription, {
      title: 'Hospital Alert',
      body: notification.message,
      icon: '/icons/icon-192.png',
      tag: `hospital-${hospital._id}`,
      data: notification.data
    }));
  }

  if (hospital.contact?.email) {
    results.push(await sendEmail(
      hospital.contact.email,
      `Hospital Alert: ${notification.message}`,
      `<p>${notification.message}</p>`
    ));
  }

  return results;
};

const notifyAmbulance = async (ambulance, notification) => {
  const results = [];

  if (ambulance.pushSubscription) {
    results.push(await sendWebPush(ambulance.pushSubscription, {
      title: 'Ambulance Dispatch',
      body: notification.message,
      icon: '/icons/icon-192.png',
      tag: `ambulance-${ambulance._id}`,
      data: notification.data
    }));
  }

  if (ambulance.crew?.driver?.phone) {
    results.push(await sendSMS(ambulance.crew.driver.phone, `Dispatch: ${notification.message}`));
  }

  return results;
};

const notifyAdmin = async (admins, notification) => {
  const results = [];
  for (const admin of admins) {
    if (admin.pushSubscription) {
      results.push(await sendWebPush(admin.pushSubscription, {
        title: 'Admin Alert',
        body: notification.message,
        icon: '/icons/icon-192.png',
        tag: `admin-${admin._id}`,
        data: notification.data
      }));
    }
    if (admin.email) {
      results.push(await sendEmail(admin.email, `Admin Alert: ${notification.message}`, `<p>${notification.message}</p>`));
    }
  }
  return results;
};

module.exports = {
  notifyPatient,
  notifyHospital,
  notifyAmbulance,
  notifyAdmin,
  sendWebPush,
  sendEmail,
  sendSMS,
  vapidKeys
};