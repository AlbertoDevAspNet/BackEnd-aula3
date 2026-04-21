
// src/sockets/noteSocket.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Note = require('../models/Note');

// Armazenar usuários ativos por nota
const usuariosAtivos = new Map();
// Map: noteId -> Set of { socketId, userId, nome }

const configurarSockets = (io) => {

  // Middleware: Autenticar conexões WebSocket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Token não fornecido'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await User.findById(decoded.id);

      if (!usuario) {
        return next(new Error('Usuário não encontrado'));
      }

      // Anexar dados do usuário ao socket
      socket.usuario = {
        id: usuario._id.toString(),
        nome: usuario.nome,
        email: usuario.email
      };

      next();
    } catch (error) {
      next(new Error('Autenticação falhou'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.usuario.nome} conectou`);

    // ══════════════════════════════════════
    // ENTRAR EM UMA NOTA (join room)
    // ══════════════════════════════════════
    socket.on('entrar-nota', async ({ noteId }) => {
      try {
        const nota = await Note.findById(noteId);

        if (!nota || !nota.temAcesso(socket.usuario.id)) {
          socket.emit('erro', { mensagem: 'Sem acesso a esta nota' });
          return;
        }

        // Entrar na sala da nota
        socket.join(`note:${noteId}`);

        // Registrar usuário ativo
        if (!usuariosAtivos.has(noteId)) {
          usuariosAtivos.set(noteId, new Set());
        }

        const infoUsuario = {
          socketId: socket.id,
          userId: socket.usuario.id,
          nome: socket.usuario.nome
        };

        usuariosAtivos.get(noteId).add(infoUsuario);

        // Notificar outros na sala
        socket.to(`note:${noteId}`).emit('usuario-entrou', {
          usuario: socket.usuario,
          usuariosAtivos: Array.from(usuariosAtivos.get(noteId))
        });

        // Enviar lista de usuários ativos para quem entrou
        socket.emit('usuarios-na-nota', {
          usuariosAtivos: Array.from(usuariosAtivos.get(noteId))
        });

        console.log(`📝 ${socket.usuario.nome} entrou na nota ${noteId}`);

      } catch (error) {
        socket.emit('erro', { mensagem: 'Erro ao entrar na nota' });
      }
    });

    // ══════════════════════════════════════
    // EDITAR NOTA EM TEMPO REAL
    // ══════════════════════════════════════
    socket.on('editar-nota', async ({ noteId, conteudo, titulo }) => {
      try {
        const nota = await Note.findById(noteId);

        if (!nota || !nota.podeEditar(socket.usuario.id)) {
          socket.emit('erro', { mensagem: 'Sem permissão de edição' });
          return;
        }

        // Atualizar no banco de dados
        const atualizacao = { ultimaEdicaoPor: socket.usuario.id };
        if (conteudo !== undefined) atualizacao.conteudo = conteudo;
        if (titulo !== undefined) atualizacao.titulo = titulo;

        const notaAtualizada = await Note.findByIdAndUpdate(
          noteId,
          atualizacao,
          { new: true }
        ).populate('autor', 'nome email')
         .populate('ultimaEdicaoPor', 'nome');

        // Broadcast para TODOS na sala (exceto quem enviou)
        socket.to(`note:${noteId}`).emit('nota-atualizada', {
          nota: notaAtualizada,
          editadoPor: socket.usuario
        });

      } catch (error) {
        socket.emit('erro', { mensagem: 'Erro ao atualizar nota' });
      }
    });

    // ══════════════════════════════════════
    // INDICADOR "DIGITANDO..."
    // ══════════════════════════════════════
    socket.on('digitando', ({ noteId }) => {
      socket.to(`note:${noteId}`).emit('usuario-digitando', {
        usuario: socket.usuario
      });
    });

    socket.on('parou-digitar', ({ noteId }) => {
      socket.to(`note:${noteId}`).emit('usuario-parou-digitar', {
        usuario: socket.usuario
      });
    });

    // ══════════════════════════════════════
    // SAIR DE UMA NOTA (leave room)
    // ══════════════════════════════════════
    socket.on('sair-nota', ({ noteId }) => {
      socket.leave(`note:${noteId}`);
      removerUsuarioAtivo(noteId, socket);
    });

    // ══════════════════════════════════════
    // DESCONEXÃO
    // ══════════════════════════════════════
    socket.on('disconnect', () => {
      // Remover de todas as salas ativas
      for (const [noteId, usuarios] of usuariosAtivos) {
        removerUsuarioAtivo(noteId, socket);
      }
      console.log(`🔌 ${socket.usuario.nome} desconectou`);
    });
  });

  // Função auxiliar
  function removerUsuarioAtivo(noteId, socket) {
    const usuarios = usuariosAtivos.get(noteId);
    if (!usuarios) return;

    for (const u of usuarios) {
      if (u.socketId === socket.id) {
        usuarios.delete(u);
        break;
      }
    }

    // Notificar a sala
    socket.to(`note:${noteId}`).emit('usuario-saiu', {
      usuario: socket.usuario,
      usuariosAtivos: Array.from(usuarios)
    });

    // Limpar a sala se vazia
    if (usuarios.size === 0) {
      usuariosAtivos.delete(noteId);
    }
  }
};

module.exports = configurarSockets;