const mongoose = require('mongoose');

const auditoriaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  accion: {
    type: String,
    enum: ['CREAR', 'ACTUALIZAR', 'ELIMINAR', 'ASIGNAR_CHOFER', 'ENTREGAR', 'ACTIVAR', 'DESACTIVAR'],
    required: true,
    index: true
  },
  entidad: {
    type: String,
    enum: ['Encomienda', 'Usuario', 'Config'],
    required: true,
    index: true
  },
  entidadId: mongoose.Schema.Types.ObjectId,
  cambiosAnteriores: mongoose.Schema.Types.Mixed,
  cambiosNuevos: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  resultado: {
    type: String,
    enum: ['exitoso', 'error'],
    default: 'exitoso'
  },
  detalleError: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { 
  timestamps: true,
  collection: 'auditorias'
});

auditoriaSchema.index({ usuario: 1, timestamp: -1 });
auditoriaSchema.index({ entidad: 1, timestamp: -1 });
auditoriaSchema.index({ accion: 1, timestamp: -1 });

const Auditoria = mongoose.model('Auditoria', auditoriaSchema);
module.exports = Auditoria;