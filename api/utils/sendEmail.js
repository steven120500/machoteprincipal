import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // ⚠️ Importante: false para puerto 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // ✅ Forzamos IPv4 para evitar que Render intente conectar por IPv6 y falle
    family: 4, 
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"FutStore" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;