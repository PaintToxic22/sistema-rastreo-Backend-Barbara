const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tipo: {
    type: String,
    enum: ['encomienda_creada', 'encomienda_asignada', 'entrega_realizada', 'sistema', 'alerta'],
    required: true,
    index: true
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  encomienda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encomienda',
    sparse: true
  },
  leida: {
    type: Boolean,
    default: false,
    index: true
  },
  fechaLectura: Date,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { 
  timestamps: true,
  collection: 'notificaciones'
});

notificacionSchema.index({ usuario: 1, leida: 1, timestamp: -1 });

const Notificacion = mongoose.model('Notificacion', notificacionSchema);
module.exports = Notificacion;