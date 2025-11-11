// routes/encomiendaRoutes.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Encomienda = require('../models/Encomienda');
const Tracking = require('../models/Tracking');
const User = require('../models/User');
const { verificarToken, verificarRol, registrarAuditoria, enviarNotificacion } = require('../middleware/auth');
const { enviarEmailEncomiendaCreada } = require('../services/emailService');

const router = express.Router();

// OPERADOR: Crear encomienda
router.post('/', verificarToken, verificarRol('admin', 'operador'), async (req, res) => {
  try {
    const { remitente, destinatario, descripcion, peso, valor } = req.body;

    // Validaciones
    if (!remitente || !destinatario || !valor) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan datos requeridos' 
      });
    }

    // Generar código de seguimiento
    const codigoSeguimiento = `LQ-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Crear encomienda
    const nuevaEncomienda = new Encomienda({
      codigoSeguimiento,
      remitente,
      destinatario,
      descripcion,
      peso,
      valor,
      operador: req.usuario.id,
      estado: 'pendiente'
    });

    await nuevaEncomienda.save();

    // Registrar en tracking
    await Tracking.create({
      encomienda: nuevaEncomienda._id,
      estado: 'pendiente',
      descripcion: 'Encomienda registrada en el sistema',
      chofer: null
    });

    // Registrar auditoría
    await registrarAuditoria(
      req.usuario.id,
      'CREAR',
      'Encomienda',
      nuevaEncomienda._id,
      null,
      { codigoSeguimiento, remitente, destinatario, valor }
    );

    // Enviar notificación al usuario si existe
    if (remitente.email) {
      await enviarEmailEncomiendaCreada(remitente.email, nuevaEncomienda, codigoSeguimiento);
    }

    // Notificar al operador
    await enviarNotificacion(
      req.usuario.id,
      'encomienda_creada',
      'Encomienda Creada',
      `Se ha registrado la encomienda ${codigoSeguimiento}`,
      nuevaEncomienda._id
    );

    res.status(201).json({
      success: true,
      message: 'Encomienda creada exitosamente',
      encomienda: nuevaEncomienda,
      codigoSeguimiento
    });
  } catch (error) {
    console.error('Error al crear encomienda:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear encomienda',
      error: error.message 
    });
  }
});

// ADMIN/OPERADOR: Obtener todas las encomiendas
router.get('/', verificarToken, verificarRol('admin', 'operador', 'chofer'), async (req, res) => {
  try {
    const { estado, codigoSeguimiento, pagina = 1, limite = 10 } = req.query;
    const skip = (pagina - 1) * limite;

    let filtro = {};

    if (estado) filtro.estado = estado;
    if (codigoSeguimiento) filtro.codigoSeguimiento = { $regex: codigoSeguimiento, $options: 'i' };

    // Si es chofer, solo ve sus encomiendas asignadas
    if (req.usuario.rol === 'chofer') {
      filtro.choferAsignado = req.usuario.id;
    }

    const encomiendas = await Encomienda.find(filtro)
      .populate('operador', 'nombre email')
      .populate('choferAsignado', 'nombre telefono')
      .skip(skip)
      .limit(parseInt(limite))
      .sort({ createdAt: -1 });

    const total = await Encomienda.countDocuments(filtro);

    res.json({
      success: true,
      total,
      pagina: parseInt(pagina),
      limite: parseInt(limite),
      encomiendas
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener encomiendas',
      error: error.message 
    });
  }
});

// OPERADOR/ADMIN: Obtener encomienda por ID o código
router.get('/:identificador', verificarToken, async (req, res) => {
  try {
    const { identificador } = req.params;

    let encomienda = await Encomienda.findById(identificador)
      .populate('operador', 'nombre email')
      .populate('choferAsignado', 'nombre telefono')
      .populate('usuario', 'nombre email');

    if (!encomienda) {
      encomienda = await Encomienda.findOne({ codigoSeguimiento: identificador })
        .populate('operador', 'nombre email')
        .populate('choferAsignado', 'nombre telefono')
        .populate('usuario', 'nombre email');
    }

    if (!encomienda) {
      return res.status(404).json({ 
        success: false, 
        message: 'Encomienda no encontrada' 
      });
    }

    // Obtener historial de tracking
    const historial = await Tracking.find({ encomienda: encomienda._id })
      .populate('chofer', 'nombre')
      .sort({ timestamp: 1 });

    res.json({
      success: true,
      encomienda,
      historial
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener encomienda',
      error: error.message 
    });
  }
});

// OPERADOR: Asignar encomienda a chofer
router.post('/:id/asignar-chofer', verificarToken, verificarRol('admin', 'operador'), async (req, res) => {
  try {
    const { id } = req.params;
    const { choferAsignado } = req.body;

    if (!choferAsignado) {
      return res.status(400).json({ 
        success: false, 
        message: 'Chofer no especificado' 
      });
    }

    const encomienda = await Encomienda.findById(id);
    if (!encomienda) {
      return res.status(404).json({ 
        success: false, 
        message: 'Encomienda no encontrada' 
      });
    }

    // Verificar que el chofer existe
    const chofer = await User.findById(choferAsignado);
    if (!chofer || chofer.rol !== 'chofer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Chofer no encontrado' 
      });
    }

    encomienda.choferAsignado = choferAsignado;
    encomienda.estado = 'asignado';
    await encomienda.save();

    // Registrar tracking
    await Tracking.create({
      encomienda: encomienda._id,
      estado: 'asignado',
      descripcion: `Asignado a chofer ${chofer.nombre}`,
      chofer: choferAsignado
    });

    // Notificar al chofer
    await enviarNotificacion(
      choferAsignado,
      'encomienda_asignada',
      'Nueva Encomienda Asignada',
      `Se te ha asignado la encomienda ${encomienda.codigoSeguimiento}`,
      encomienda._id
    );

    // Registrar auditoría
    await registrarAuditoria(
      req.usuario.id,
      'ASIGNAR_CHOFER',
      'Encomienda',
      encomienda._id,
      { choferAsignado: encomienda.choferAsignado },
      { choferAsignado }
    );

    res.json({
      success: true,
      message: 'Encomienda asignada al chofer',
      encomienda
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al asignar encomienda',
      error: error.message 
    });
  }
});

// CHOFER: Actualizar estado a en tránsito
router.post('/:id/en-transito', verificarToken, verificarRol('chofer'), async (req, res) => {
  try {
    const { id } = req.params;

    const encomienda = await Encomienda.findById(id);
    if (!encomienda) {
      return res.status(404).json({ 
        success: false, 
        message: 'Encomienda no encontrada' 
      });
    }

    if (encomienda.choferAsignado.toString() !== req.usuario.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso sobre esta encomienda' 
      });
    }

    encomienda.estado = 'en_transito';
    await encomienda.save();

    // Registrar tracking
    await Tracking.create({
      encomienda: encomienda._id,
      estado: 'en_transito',
      descripcion: 'Encomienda en tránsito',
      chofer: req.usuario.id
    });

    res.json({
      success: true,
      message: 'Estado actualizado a en tránsito',
      encomienda
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar estado',
      error: error.message 
    });
  }
});

// CHOFER: Marcar como entregada
router.post('/:id/entregar', verificarToken, verificarRol('chofer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreRecibidor, rutRecibidor, notas, fotoBase64 } = req.body;

    if (!nombreRecibidor) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre del recibidor es requerido' 
      });
    }

    const encomienda = await Encomienda.findById(id);
    if (!encomienda) {
      return res.status(404).json({ 
        success: false, 
        message: 'Encomienda no encontrada' 
      });
    }

    if (encomienda.choferAsignado.toString() !== req.usuario.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso sobre esta encomienda' 
      });
    }

    encomienda.estado = 'entregado';
    encomienda.fechaEntrega = new Date();
    encomienda.observaciones = notas;
    await encomienda.save();

    // Registrar tracking
    const tracking = await Tracking.create({
      encomienda: encomienda._id,
      estado: 'entregado',
      descripcion: 'Encomienda entregada',
      chofer: req.usuario.id,
      nombreRecibidor,
      rutRecibidor: rutRecibidor || null,
      fotoEntrega: fotoBase64 || null,
      notas
    });

    // Registrar auditoría
    await registrarAuditoria(
      req.usuario.id,
      'ENTREGAR',
      'Encomienda',
      encomienda._id,
      { estado: 'asignado' },
      { estado: 'entregado', nombreRecibidor, rutRecibidor }
    );

    // Notificar al operador
    if (encomienda.operador) {
      await enviarNotificacion(
        encomienda.operador,
        'encomienda_entregada',
        'Encomienda Entregada',
        `La encomienda ${encomienda.codigoSeguimiento} ha sido entregada`,
        encomienda._id
      );
    }

    res.json({
      success: true,
      message: 'Encomienda marcada como entregada',
      encomienda,
      tracking
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al entregar encomienda',
      error: error.message 
    });
  }
});

module.exports = router;