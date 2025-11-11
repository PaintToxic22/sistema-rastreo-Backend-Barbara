// services/emailService.js
const nodemailer = require('nodemailer');

// Configurar transportador
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Template HTML para encomienda creada
const templateEncomiendaCreada = (encomienda, codigoSeguimiento) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { background-color: white; margin: 20px auto; padding: 20px; width: 80%; max-width: 600px; border-radius: 8px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px; }
        .tracking { background-color: #eff6ff; padding: 15px; border-left: 4px solid #1e40af; margin: 15px 0; }
        .tracking-code { font-size: 24px; font-weight: bold; color: #1e40af; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #333; }
        .footer { background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>LonquiExpress</h1>
          <p>Tu encomienda ha sido registrada</p>
        </div>
        <div class="content">
          <p>¡Hola ${encomienda.remitente.nombre}!</p>
          <p>Tu encomienda ha sido registrada exitosamente en nuestro sistema.</p>
          
          <div class="tracking">
            <p>Tu código de seguimiento:</p>
            <div class="tracking-code">${codigoSeguimiento}</div>
            <p style="margin-top: 10px;">Guarda este código para rastrear tu encomienda en todo momento.</p>
          </div>

          <h3>Detalles de la encomienda:</h3>
          <div class="info-row">
            <span class="label">De:</span> ${encomienda.remitente.nombre} - ${encomienda.remitente.ciudad}
          </div>
          <div class="info-row">
            <span class="label">Para:</span> ${encomienda.destinatario.nombre} - ${encomienda.destinatario.ciudad}
          </div>
          <div class="info-row">
            <span class="label">Descripción:</span> ${encomienda.descripcion}
          </div>
          <div class="info-row">
            <span class="label">Valor:</span> $${encomienda.valor.toLocaleString('es-CL')}
          </div>
          <div class="info-row">
            <span class="label">Estado:</span> <span style="background-color: #fef3c7; padding: 2px 8px; border-radius: 4px;">Pendiente</span>
          </div>

          <p style="margin-top: 20px;">Puedes rastrear tu encomienda en: <a href="https://lonquiexpress.cl/tracking">https://lonquiexpress.cl/tracking</a></p>
        </div>
        <div class="footer">
          <p>LonquiExpress - Sistema de Gestión de Encomiendas</p>
          <p>© 2024 Todos los derechos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template HTML para encomienda entregada
const templateEncomiendaEntregada = (encomienda, nombreRecibidor) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { background-color: white; margin: 20px auto; padding: 20px; width: 80%; max-width: 600px; border-radius: 8px; }
        .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px; }
        .success { background-color: #d1fae5; padding: 15px; border-left: 4px solid #059669; margin: 15px 0; }
        .tracking-code { font-size: 20px; font-weight: bold; color: #059669; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Entrega Realizada</h1>
        </div>
        <div class="content">
          <p>¡Hola ${encomienda.remitente.nombre}!</p>
          <p>Tu encomienda ha sido entregada exitosamente.</p>
          
          <div class="success">
            <p><strong>Código de seguimiento:</strong></p>
            <div class="tracking-code">${encomienda.codigoSeguimiento}</div>
            <p><strong>Recibido por:</strong> ${nombreRecibidor}</p>
            <p><strong>Fecha de entrega:</strong> ${new Date().toLocaleDateString('es-CL')}</p>
          </div>

          <p>Gracias por usar LonquiExpress.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Enviar email de encomienda creada
const enviarEmailEncomiendaCreada = async (email, encomienda, codigoSeguimiento) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Encomienda registrada - ${codigoSeguimiento}`,
      html: templateEncomiendaCreada(encomienda, codigoSeguimiento)
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email enviado a ${email}`);
  } catch (error) {
    console.error('Error al enviar email:', error);
  }
};

// Enviar email de encomienda entregada
const enviarEmailEncomiendaEntregada = async (email, encomienda, nombreRecibidor) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `¡Encomienda entregada! - ${encomienda.codigoSeguimiento}`,
      html: templateEncomiendaEntregada(encomienda, nombreRecibidor)
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de entrega enviado a ${email}`);
  } catch (error) {
    console.error('Error al enviar email:', error);
  }
};

module.exports = {
  enviarEmailEncomiendaCreada,
  enviarEmailEncomiendaEntregada
};