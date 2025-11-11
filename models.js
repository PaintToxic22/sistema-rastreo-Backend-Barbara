// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  nombre: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['admin', 'operador', 'chofer', 'usuario'],
    default: 'usuario',
    required: true
  },
  telefono: {
    type: String,
    sparse: true
  },
  rut: {
    type: String,
    sparse: true,
    unique: true
  },
  activo: {
    type: Boolean,
    default: true
  },
  foto: String,
  empresa: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash de contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.compararPassword = async function(passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model('User', userSchema);


// models/Encomienda.js
const mongoose = require('mongoose');

const encomiendaSchema = new mongoose.Schema({
  codigoSeguimiento: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  remitente: {
    nombre: String,
    telefono: String,
    direccion: String,
    ciudad: String,
    rut: String
  },
  destinatario: {
    nombre: String,
    telefono: String,
    direccion: String,
    ciudad: String,
    rut: String
  },
  descripcion: String,
  peso: Number, // kg
  valor: {
    type: Number,
    required: true
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
    default: Date.now
  },
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
}, { timestamps: true });

module.exports = mongoose.model('Encomienda', encomiendaSchema);


// models/Tracking.js
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
    required: true
  },
  ubicacion: {
    tipo: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      sparse: true
    }
  },
  descripcion: String,
  chofer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  firmaRecibidor: String, // Base64
  nombreRecibidor: String,
  rutRecibidor: String,
  fotoEntrega: String,
  notas: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

trackingSchema.index({ 'ubicacion': '2dsphere' });

module.exports = mongoose.model('Tracking', trackingSchema);


// models/Auditoria.js
const mongoose = require('mongoose');

const auditoriaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accion: String,
  entidad: String,
  entidadId: mongoose.Schema.Types.ObjectId,
  cambiosAnteriores: mongoose.Schema.Types.Mixed,
  cambiosNuevos: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Auditoria', auditoriaSchema);


// models/Notificacion.js
const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipo: {
    type: String,
    enum: ['encomienda_creada', 'encomienda_asignada', 'entrega_realizada', 'sistema'],
    required: true
  },
  titulo: String,
  mensaje: String,
  encomienda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encomienda',
    sparse: true
  },
  leida: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Notificacion', notificacionSchema);


// models/Config.js
const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  nombreEmpresa: {
    type: String,
    default: 'LonquiExpress'
  },
  logo: String,
  email: String,
  telefono: String,
  direccion: String,
  ciudad: String,
  emailNotiicaciones: {
    remitente: String,
    template: {
      asunto: String,
      cuerpo: String
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Config', configSchema);