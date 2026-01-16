import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1. Configuramos el transportador de forma explícita
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true para puerto 465, false para otros
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Añadimos configuración de TLS para entornos de nube como Render
    tls: {
      rejectUnauthorized: false 
    },
    connectionTimeout: 10000, // 10 segundos de espera
  });

  const mailOptions = {
    from: `"FutStore" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // 2. Enviamos el correo
  await transporter.sendMail(mailOptions);
};

export default sendEmail;