const nodemailer = require('nodemailer');

let transporter = null;
let isConfigured = false;

const initTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    isConfigured = true;
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT == 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
};

/**
 * Sends an email to a single recipient or multiple BCC recipients.
 * @param {string|string[]} to - Recipient email(s). If array, they are sent as BCC.
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 */
const sendEmail = async (to, subject, text) => {
  try {
    // Lazy init
    if (!isConfigured) initTransporter();

    const isArray = Array.isArray(to);
    const bccList = isArray ? to.filter(Boolean).join(',') : '';
    
    // Safer default: send to self if bulk BCC, to avoid spam filters or bounces
    const fallbackTo = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@school-erp.com';
    const toAddr = isArray ? fallbackTo : to;

    if (!transporter) {
      console.log('=====================================================');
      console.log('📬 [EMAIL SERVICE MOCK] SMTP not configured.');
      console.log(`TO: ${toAddr}`);
      if (isArray && bccList) console.log(`BCC: ${bccList}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY:\n${text}`);
      console.log('=====================================================');
      return true;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '"School ERP" <noreply@school-erp.com>',
      to: toAddr,
      subject,
      text,
    };

    if (isArray && bccList) {
      mailOptions.bcc = bccList;
    }

    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error('Email sending failed:', err);
    return false;
  }
};

module.exports = {
  sendEmail,
};
