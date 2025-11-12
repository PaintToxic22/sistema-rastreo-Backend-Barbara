const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// ✅ NUEVO: Pre-save para hashear automáticamente
userSchema.pre('save', async function(next) {
  // Si la contraseña no fue modificada, continuar
  if (!this.isModified('password')) return next();
  
  try {
    // Generar salt
    const salt = await bcrypt.genSalt(10);
    
    // Hashear contraseña
    this.password = await bcrypt.hash(this.password, salt);
    
    console.log(`✅ Contraseña hasheada para: ${this.email}`);
    next();
  } catch (error) {
    console.error('❌ Error al hashear contraseña:', error);
    next(error);
  }
});

// ✅ NUEVO: Método para comparar contraseñas
userSchema.methods.compararPassword = async function(passwordIngresada) {
  try {
    const coincide = await bcrypt.compare(passwordIngresada, this.password);
    console.log(`🔍 Comparación de contraseña para ${this.email}: ${coincide ? '✅ Correcta' : '❌ Incorrecta'}`);
    return coincide;
  } catch (error) {
    console.error('❌ Error al comparar contraseña:', error);
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);