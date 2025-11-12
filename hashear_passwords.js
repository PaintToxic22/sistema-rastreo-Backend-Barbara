// backend/hashear_passwords.js
// Este script hashea TODAS las contraseñas en plain text a bcrypt

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function hashearTodasLasContraseñas() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado');

    // Obtener todos los usuarios
    const usuarios = await User.find({});
    console.log(`\n📊 Total de usuarios: ${usuarios.length}\n`);

    if (usuarios.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      process.exit(0);
    }

    // Hashear cada contraseña
    let hasheadas = 0;
    let yaHasheadas = 0;

    for (let usuario of usuarios) {
      try {
        // Detectar si ya está hasheada (comienza con $2a$ o $2b$ de bcrypt)
        if (usuario.password.startsWith('$2a$') || usuario.password.startsWith('$2b$')) {
          console.log(`⏭️  ${usuario.email} - Ya está hasheada`);
          yaHasheadas++;
          continue;
        }

        // Si no está hasheada, hashearla
        const salt = await bcrypt.genSalt(10);
        const passwordHasheada = await bcrypt.hash(usuario.password, salt);

        // Actualizar en la base de datos
        usuario.password = passwordHasheada;
        await usuario.save();

        console.log(`✅ ${usuario.email} - Contraseña hasheada`);
        hasheadas++;
      } catch (error) {
        console.error(`❌ Error con ${usuario.email}:`, error.message);
      }
    }

    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║        RESUMEN DE HASHEO               ║`);
    console.log(`╠════════════════════════════════════════╣`);
    console.log(`║ ✅ Hasheadas:     ${String(hasheadas).padEnd(25)} ║`);
    console.log(`║ ⏭️  Ya hasheadas: ${String(yaHasheadas).padEnd(25)} ║`);
    console.log(`║ 📊 Total:         ${String(usuarios.length).padEnd(25)} ║`);
    console.log(`╚════════════════════════════════════════╝\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

hashearTodasLasContraseñas();