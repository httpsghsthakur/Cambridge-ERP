const nodemailer = require('nodemailer');

/**
 * Sends login credentials to a user via email.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - Recipient's name
 * @param {string} options.loginId - User's login ID (email)
 * @param {string} options.password - Plain text password
 * @param {string} options.role - User's role
 * @returns {Promise<boolean>} - Returns true if email sent successfully, false otherwise
 */
const sendCredentialsEmail = async ({ to, name, loginId, password, role }) => {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || 'School ERP <info@kishtwareduhub.com>';

  if (!host || !user || !pass) {
    console.warn('[Mail Service] ⚠️ Email environment variables are not configured. Email will not be sent.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false // Defensive setting for shared hosting/transports
      }
    });

    const mailOptions = {
      from,
      to,
      subject: 'School ERP Login Credentials',
      text: `Hello ${name},

Your School ERP login credentials have been created/updated.

Login URL:
https://erp.kishtwareduhub.com

Your Login ID:
${loginId}

Your Password:
${password}

Role:
${role}

Please log in to your account.
Dont reply to this email.

For any queries contact the school administration or mail us at [kidzeeinternational1142@gmail.com]

Regards,
School ERP Administration`,
      html: `<p>Hello <strong>${name}</strong>,</p>
<p>Your School ERP login credentials have been created/updated.</p>
<p><strong>Login URL:</strong><br>
<a href="https://erp.kishtwareduhub.com" target="_blank">https://erp.kishtwareduhub.com</a></p>
<p><strong>Your Login ID:</strong><br>
<code>${loginId}</code></p>
<p><strong>Your Password:</strong><br>
<code>${password}</code></p>
<p><strong>Role:</strong><br>
<code>${role}</code></p>
<br>
<p>Please log in and change your password after first login.</p>
<br>
<p>Regards,<br>
School ERP Administration</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mail Service] 📧 Email sent successfully to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Mail Service] ❌ Failed to send email:', error);
    return false;
  }
};

module.exports = {
  sendCredentialsEmail
};
