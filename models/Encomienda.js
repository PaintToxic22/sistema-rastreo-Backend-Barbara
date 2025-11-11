const mongoose = require('mongoose');

const encomiendaSchema = new mongoose.Schema({
  codigoSeguimiento: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  remitente: {
    nombre: { type: String, required: true },
    telefono: String,
    email: String,
    direccion: { type: String, required: true },
    ciudad: { type: String, required: true },
    rut: String
  },
  destinatario: {
    nombre: { type: String, required: true },
    telefono: String,
    email: String,
    direccion: { type: String, required: true },
    ciudad: { type: String, required: true },
    rut: String
  },
  descripcion: {
    type: String,
    required: true
  },
  peso: {
    type: Number,
    min: 0
  },
  valor: {
    type: Number,
    required: true,
    min: 0
  },
  estado: {
    type: String,
    enum: ['pendiente', 'asignado', 'en_transito', 'entregado', 'no_entregado', 'cancelado'],
    default: 'pendiente',
    index: true
  },
  choferAsignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  operador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
    index: true
  },
  fechaAsignacion: Date,
  fechaPartida: Date,
  fechaEntrega: Date,
  observaciones: String,
  archivoAdjunto: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'encomiendas'
});


encomiendaSchema.index({ estado: 1, createdAt: -1 });
encomiendaSchema.index({ choferAsignado: 1, estado: 1 });

const Encomienda = mongoose.model('Encomienda', encomiendaSchema);
module.exports = Encomienda;