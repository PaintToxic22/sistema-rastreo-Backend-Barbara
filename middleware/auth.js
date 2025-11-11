// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verificar JWT
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token no proporcionado' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
};

// Verificar rol
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado' 
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        success: false, 
        message: `Acceso denegado. Rol requerido: ${rolesPermitidos.join(', ')}` 
      });
    }

    next();
  };
};

// Registrar acción en auditoría
const registrarAuditoria = async (usuario, accion, entidad, entidadId, cambiosAnteriores, cambiosNuevos) => {
  try {
    const Auditoria = require('../models/Auditoria');
    await Auditoria.create({
      usuario,
      accion,
      entidad,
      entidadId,
      cambiosAnteriores,
      cambiosNuevos,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};

// Enviar notificación
const enviarNotificacion = async (usuarioId, tipo, titulo, mensaje, encomiendaId = null) => {
  try {
    const Notificacion = require('../models/Notificacion');
    await Notificacion.create({
      usuario: usuarioId,
      tipo,
      titulo,
      mensaje,
      encomienda: encomiendaId
    });
  } catch (error) {
    console.error('Error al enviar notificación:', error);
  }
};

module.exports = {
  verificarToken,
  verificarRol,
  registrarAuditoria,
  enviarNotificacion
};