const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['admin', 'operador', 'chofer', 'usuario'],
    default: 'usuario'
  },
  telefono: {
    type: String,
    default: ''
  },
  rut: {
    type: String,
    default: ''
  },
  activo: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);