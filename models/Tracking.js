const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
  encomienda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encomienda',
    required: true,
    index: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'asignado', 'en_transito', 'entregado', 'no_entregado', 'cancelado'],
    required: true,
    index: true
  },
  ubicacion: {
    tipo: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      sparse: true
    }
  },
  descripcion: {
    type: String,
    required: true
  },
  chofer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  firmaRecibidor: String,
  nombreRecibidor: String,
  rutRecibidor: {
    type: String,
    sparse: true
  },
  fotoEntrega: String,
  notas: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { 
  timestamps: true,
  collection: 'trackings'
});

trackingSchema.index({ 'ubicacion': '2dsphere' });
trackingSchema.index({ encomienda: 1, timestamp: -1 });

const Tracking = mongoose.model('Tracking', trackingSchema);
module.exports = Tracking;