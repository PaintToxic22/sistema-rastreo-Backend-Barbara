// backend/seed.js - Script para insertar datos iniciales
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const usuarios = [
  {
    email: 'admin@lonquiexpress.cl',
    password: 'admin123',
    nombre: 'Administrador LonquiExpress',
    rol: 'admin',
    telefono: '+56912345678',
    rut: '12345678-9',
    activo: true
  },
  {
    email: 'operador@lonquiexpress.cl',
    password: 'admin123',
    nombre: 'Juan Operador',
    rol: 'operador',
    telefono: '+56912345679',
    rut: '12345678-0',
    activo: true
  },
  {
    email: 'chofer@lonquiexpress.cl',
    password: 'admin123',
    nombre: 'Carlos Chofer',
    rol: 'chofer',
    telefono: '+56912345680',
    rut: '12345678-1',
    activo: true
  },
  {
    email: 'usuario@lonquiexpress.cl',
    password: 'admin123',
    nombre: 'Pedro Usuario',
    rol: 'usuario',
    telefono: '+56912345681',
    rut: '12345678-2',
    activo: true
  }
];

async function seed() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Conectado a MongoDB');

    // Limpiar usuarios existentes (opcional)
    await User.deleteMany({});
    console.log('🧹 Base de datos limpiada');

    // Insertar nuevos usuarios
    for (let usuario of usuarios) {
      const nuevoUsuario = new User(usuario);
      await nuevoUsuario.save();
      console.log(`✓ Usuario creado: ${usuario.email}`);
    }

    console.log(`
    ✅ SEED COMPLETADO
    ════════════════════
    Se han creado 4 usuarios de prueba.
    
    Usuarios disponibles:
    - admin@lonquiexpress.cl (Admin)
    - operador@lonquiexpress.cl (Operador)
    - chofer@lonquiexpress.cl (Chofer)
    - usuario@lonquiexpress.cl (Usuario)
    
    Contraseña: admin123
    ════════════════════
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();