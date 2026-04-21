
// src/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Função auxiliar para gerar o JWT
const gerarToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// POST /api/auth/registro - Criar nova conta
router.post('/registro', async (req, res) => {
  const { nome, email, senha } = req.body;

  // Verificar se o email já está em uso
  const emailExistente = await User.findOne({ email });
  if (emailExistente) {
    return res.status(400).json({
      erro: 'Este email já está cadastrado.'
    });
  }

  // Criar o usuário (a senha é hasheada automaticamente pelo middleware do Mongoose)
  const usuario = await User.create({ nome, email, senha });

  // Gerar token e responder
  const token = gerarToken(usuario._id);

  res.status(201).json({
    mensagem: 'Conta criada com sucesso!',
    token,
    usuario: {
      id: usuario._id,
      nome: usuario.nome,
      email: usuario.email
    }
  });
});

// POST /api/auth/login - Fazer login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  // Buscar usuário com a senha (select: false por padrão)
  const usuario = await User.findOne({ email }).select('+senha');

  if (!usuario) {
    return res.status(401).json({
      erro: 'Email ou senha incorretos.'
    });
  }

  // Comparar a senha
  const senhaCorreta = await usuario.compararSenha(senha);

  if (!senhaCorreta) {
    return res.status(401).json({
      erro: 'Email ou senha incorretos.'
    });
  }

  // Gerar token e responder
  const token = gerarToken(usuario._id);

  res.json({
    mensagem: 'Login realizado com sucesso!',
    token,
    usuario: {
      id: usuario._id,
      nome: usuario.nome,
      email: usuario.email
    }
  });
});

// GET /api/auth/me - Obter dados do usuário logado
router.get('/me', auth, async (req, res) => {
  res.json({
    usuario: {
      id: req.usuario._id,
      nome: req.usuario.nome,
      email: req.usuario.email,
      criadoEm: req.usuario.createdAt
    }
  });
});

module.exports = router;