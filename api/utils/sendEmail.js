import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1. Crear el transportador (el que envía el correo)
  const transporter = nodemailer.createTransport({
    // Si usas Gmail, esta es la configuración:
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER, // Tu correo de Gmail
      pass: process.env.EMAIL_PASS  // Tu "Contraseña de aplicación" de Google
    },
  });

  // 2. Definir las opciones del correo
  const mailOptions = {
    from: 'FutStore <no-reply@futstore.com>',
    to: options.email,
    subject: options.subject,
    html: options.message, // Usamos HTML para que el diseño se vea profesional
  };

  // 3. Enviar el correo
  await transporter.sendMail(mailOptions);
};

export default sendEmail;