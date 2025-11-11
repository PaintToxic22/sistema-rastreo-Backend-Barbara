// routes/trackingRoutes.js
const express = require('express');
const Encomienda = require('../models/Encomienda');
const Tracking = require('../models/Tracking');
const { verificarToken, verificarRol } = require('../middleware/auth');

const router = express.Router();

// Usuario: Rastrear encomienda por código
router.get('/:codigoSeguimiento', async (req, res) => {
  try {
    const { codigoSeguimiento } = req.params;

    const encomienda = await Encomienda.findOne({ codigoSeguimiento })
      .populate('choferAsignado', 'nombre telefono')
      .populate('operador', 'nombre email');

    if (!encomienda) {
      return res.status(404).json({ 
        success: false, 
        message: 'Encomienda no encontrada' 
      });
    }

    // Obtener historial completo de tracking
    const historial = await Tracking.find({ encomienda: encomienda._id })
      .populate('chofer', 'nombre telefono')
      .sort({ timestamp: 1 });

    // Calcular tiempo en tránsito
    const tiempoTransito = encomienda.fechaEntrega 
      ? Math.floor((encomienda.fechaEntrega - encomienda.createdAt) / (1000 * 60 * 60))
      : null;

    res.json({
      success: true,
      encomienda: {
        codigoSeguimiento: encomienda.codigoSeguimiento,
        estado: encomienda.estado,
        remitente: encomienda.remitente,
        destinatario: encomienda.destinatario,
        descripcion: encomienda.descripcion,
        peso: encomienda.peso,
        valor: encomienda.valor,
        chofer: encomienda.choferAsignado,
        fechaCreacion: encomienda.createdAt,
        fechaEntrega: encomienda.fechaEntrega,
        tiempoEnTransito: tiempoTransito,
        porcentajeEntrega: encomienda.estado === 'entregado' ? 100 : 
                          encomienda.estado === 'en_transito' ? 66 : 
                          encomienda.estado === 'asignado' ? 33 : 0
      },
      historial: historial.map(t => ({
        fecha: t.timestamp,
        estado: t.estado,
        descripcion: t.descripcion,
        chofer: t.chofer?.nombre || 'Sistema',
        ubicacion: t.ubicacion,
        nombreRecibidor: t.nombreRecibidor,
        notas: t.notas
      })),
      estadoActual: encomienda.estado
    });
  } catch (error) {
    console.error('Error al rastrear:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al rastrear encomienda',
      error: error.message 
    });
  }
});

// Usuario autenticado: Ver sus encomiendas
router.get('/usuario/mis-encomiendas', verificarToken, async (req, res) => {
  try {
    const encomiendas = await Encomienda.find({ usuario: req.usuario.id })
      .populate('choferAsignado', 'nombre telefono')
      .sort({ createdAt: -1 });

    const encomiendaConTracking = await Promise.all(
      encomiendas.map(async (enc) => {
        const historial = await Tracking.find({ encomienda: enc._id }).countDocuments();
        return {
          ...enc.toObject(),
          actualizaciones: historial
        };
      })
    );

    res.json({
      success: true,
      total: encomiendas.length,
      encomiendas: encomiendaConTracking
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener encomiendas',
      error: error.message 
    });
  }
});

// Usuario: Obtener detalles del tracking con historial completo
router.get('/detalles/:codigoSeguimiento', async (req, res) => {
  try {
    const { codigoSeguimiento } = req.params;

    const encomienda = await Encomienda.findOne({ codigoSeguimiento });
    if (!encomienda) {
      return res.status(404).json({ 
        success: false, 
        message: 'Encomienda no encontrada' 
      });
    }

    const historial = await Tracking.find({ encomienda: encomienda._id })
      .populate('chofer', 'nombre telefono rut')
      .sort({ timestamp: 1 });

    res.json({
      success: true,
      historial
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener tracking',
      error: error.message 
    });
  }
});

// Estadísticas de entrega
router.get('/stats/globales', verificarToken, verificarRol('admin', 'operador'), async (req, res) => {
  try {
    const totalEncomiendas = await Encomienda.countDocuments();
    const entregadas = await Encomienda.countDocuments({ estado: 'entregado' });
    const enTransito = await Encomienda.countDocuments({ estado: 'en_transito' });
    const pendientes = await Encomienda.countDocuments({ estado: 'pendiente' });
    const noEntregadas = await Encomienda.countDocuments({ estado: 'no_entregado' });

    const tasa = (entregadas / totalEncomiendas * 100).toFixed(2);

    res.json({
      success: true,
      stats: {
        totalEncomiendas,
        entregadas,
        enTransito,
        pendientes,
        noEntregadas,
        tasaEntrega: `${tasa}%`
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
});

module.exports = router;