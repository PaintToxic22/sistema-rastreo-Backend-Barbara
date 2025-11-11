const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  nombreEmpresa: {
    type: String,
    default: 'LonquiExpress'
  },
  logo: String,
  email: {
    type: String,
    match: /.+\@.+\..+/
  },
  telefono: String,
  direccion: String,
  ciudad: String,
  pais: {
    type: String,
    default: 'Chile'
  },
  emailNotificaciones: {
    remitente: String,
    plantilla: {
      asunto: String,
      cuerpo: String
    }
  },
  limites: {
    maxEncomiendas: {
      type: Number,
      default: 10000
    },
    maxPeso: {
      type: Number,
      default: 30
    },
    tasaEntregaMinima: {
      type: Number,
      default: 95
    }
  },
  maintenance: {
    activo: {
      type: Boolean,
      default: false
    },
    mensaje: String
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'configs'
});

const Config = mongoose.model('Config', configSchema);
module.exports = Config;