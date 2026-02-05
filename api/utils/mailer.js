import nodemailer from 'nodemailer';

// 1. Configuración del Transporte (Tus credenciales)
const transporter = nodemailer.createTransport({
  service: 'gmail', // O usa 'host' y 'port' si tienes un dominio propio
  auth: {
    user: process.env.EMAIL_USER, // Tu correo (ej: ventas@tutienda.com)
    pass: process.env.EMAIL_PASS, // Tu contraseña de aplicación (NO la normal)
  },
});

// 2. Función para Enviar el Correo
export const enviarCorreoConfirmacion = async (orden) => {
  try {
    // Generamos la lista de productos HTML
    const listaProductos = orden.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.name}</strong> <br/>
          <span style="color: #777; font-size: 12px;">Talla: ${item.size}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ₡${item.price.toLocaleString()}
        </td>
      </tr>
    `).join('');

    // Diseño del Correo
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">¡Gracias por tu Compra!</h1>
          <p style="margin: 5px 0 0; opacity: 0.8;">Orden #${orden.orderId}</p>
        </div>

        <div style="padding: 20px;">
          <p>Hola <strong>${orden.customer.name}</strong>,</p>
          <p>Tu pedido ha sido confirmado y estamos preparándolo. Aquí tienes los detalles:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f9f9f9; text-align: left;">
                <th style="padding: 10px;">Producto</th>
                <th style="padding: 10px; text-align: center;">Cant.</th>
                <th style="padding: 10px; text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${listaProductos}
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: right;">
            <p style="font-size: 18px; font-weight: bold;">Total Pagado: ₡${orden.total.toLocaleString()}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-weight: bold; margin-bottom: 5px;">Dirección de envío:</p>
            <p style="margin: 0; color: #555;">${orden.customer.address}</p>
          </div>
        </div>

        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
          <p>Si tienes dudas, contáctanos respondiendo a este correo.</p>
          <p>&copy; ${new Date().getFullYear()} FutStore. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    // Opciones del envío
    const mailOptions = {
      from: `"FutStore Ventas" <${process.env.EMAIL_USER}>`,
      to: orden.customer.email,
      subject: `✅ Confirmación de Pedido #${orden.orderId}`,
      html: htmlContent,
    };

    // Enviar
    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Correo enviado ID:", info.messageId);
    return info;

  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error; // Lanzamos el error para que el controlador sepa que falló
  }
};