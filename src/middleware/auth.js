// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // 1. Extrair o token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        erro: 'Acesso negado. Token não fornecido.'
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Buscar o usuário no banco
    const usuario = await User.findById(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({
        erro: 'Usuário não encontrado.'
      });
    }

    // 4. Adicionar o usuário à requisição
    req.usuario = usuario;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        erro: 'Token expirado. Faça login novamente.'
      });
    }
    
    return res.status(401).json({
      erro: 'Token inválido.'
    });
  }
};

module.exports = auth;
