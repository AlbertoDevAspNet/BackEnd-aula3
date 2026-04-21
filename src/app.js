
// src/app.js
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const configurarSockets = require('./sockets/noteSocket');

// Inicializar Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// ═══════════════════════════
// MIDDLEWARES
// ═══════════════════════════
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Log de requisições (simples, sem morgan)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ═══════════════════════════
// ROTAS
// ═══════════════════════════
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Handler de erros global
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(err.status || 500).json({
    erro: err.message || 'Erro interno do servidor'
  });
});

// ═══════════════════════════
// SOCKETS
// ═══════════════════════════
configurarSockets(io);

// Tornar io acessível nas rotas (opcional)
app.set('io', io);

// ═══════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════
const PORT = process.env.PORT || 3000;

const iniciar = async () => {
  // Conectar ao MongoDB
  await connectDB();

  server.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║  🚀 Servidor rodando na porta ${PORT}     ║
    ║  📡 WebSocket ativo                   ║
    ║  🗄️  MongoDB conectado                ║
    ╚═══════════════════════════════════════╝
    `);
  });
};

iniciar();