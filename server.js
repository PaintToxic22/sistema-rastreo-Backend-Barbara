const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Conectar a MongoDB
const conectarMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error MongoDB:', error.message);
    process.exit(1);
  }
};

conectarMongoDB();

// ✅ RUTAS - TODAS REGISTRADAS
const authRoutes = require('./routes/authRoutes');
const encomiendaRoutes = require('./routes/encomiendaRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/encomiendas', encomiendaRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    mongodb: 'connected',
    timestamp: new Date()
  });
});

// Ruta para listar todas las rutas disponibles (útil para debugging)
app.get('/api/routes', (req, res) => {
  res.json({
    routes: [
      'POST /api/auth/login',
      'POST /api/auth/registro',
      'GET /api/auth/me',
      'PUT /api/auth/perfil',
      'POST /api/auth/cambiar-password',
      'GET /api/encomiendas',
      'POST /api/encomiendas',
      'GET /api/encomiendas/:id',
      'POST /api/encomiendas/:id/asignar-chofer',
      'POST /api/encomiendas/:id/en-transito',
      'POST /api/encomiendas/:id/entregar',
      'GET /api/tracking/:codigoSeguimiento',
      'GET /api/usuarios'
    ]
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   LONQUIEXPRESS - BACKEND              ║`);
  console.log(`║   Puerto: ${PORT}                             ║`);
  console.log(`║   Ambiente: ${process.env.NODE_ENV}          ║`);
  console.log(`║   ✅ Rutas registradas correctamente   ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});

module.exports = app;