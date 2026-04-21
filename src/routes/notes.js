
// src/routes/notes.js
const express = require('express');
const Note = require('../models/Note');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de notas requerem autenticação
router.use(auth);

// POST /api/notes - Criar nova nota
router.post('/', async (req, res) => {
  const { titulo, conteudo, tags, cor } = req.body;

  const nota = await Note.create({
    titulo,
    conteudo,
    tags,
    cor,
    autor: req.usuario._id,
    ultimaEdicaoPor: req.usuario._id
  });

  // Popular os dados do autor antes de retornar
  await nota.populate('autor', 'nome email');

  res.status(201).json({
    mensagem: 'Nota criada com sucesso!',
    nota
  });
});

// GET /api/notes - Listar notas do usuário
router.get('/', async (req, res) => {
  const { pagina = 1, limite = 20, busca } = req.query;

  // Buscar notas onde o usuário é autor OU colaborador
  const filtro = {
    $or: [
      { autor: req.usuario._id },
      { 'colaboradores.usuario': req.usuario._id }
    ]
  };

  // Filtro de busca por título (opcional)
  if (busca) {
    filtro.titulo = { $regex: busca, $options: 'i' };
  }

  const notas = await Note.find(filtro)
    .populate('autor', 'nome email')
    .populate('colaboradores.usuario', 'nome email')
    .populate('ultimaEdicaoPor', 'nome')
    .sort({ updatedAt: -1 })
    .skip((pagina - 1) * limite)
    .limit(parseInt(limite));

  const total = await Note.countDocuments(filtro);

  res.json({
    notas,
    paginacao: {
      total,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total / limite)
    }
  });
});

// GET /api/notes/:id - Obter nota específica
router.get('/:id', async (req, res) => {
  const nota = await Note.findById(req.params.id)
    .populate('autor', 'nome email')
    .populate('colaboradores.usuario', 'nome email')
    .populate('ultimaEdicaoPor', 'nome');

  if (!nota) {
    return res.status(404).json({ erro: 'Nota não encontrada.' });
  }

  // Verificar se o usuário tem acesso
  if (!nota.temAcesso(req.usuario._id)) {
    return res.status(403).json({
      erro: 'Você não tem permissão para acessar esta nota.'
    });
  }

  res.json({ nota });
});

// PUT /api/notes/:id - Atualizar nota
router.put('/:id', async (req, res) => {
  const nota = await Note.findById(req.params.id);

  if (!nota) {
    return res.status(404).json({ erro: 'Nota não encontrada.' });
  }

  // Verificar permissão de escrita
  if (!nota.podeEditar(req.usuario._id)) {
    return res.status(403).json({
      erro: 'Você não tem permissão para editar esta nota.'
    });
  }

  const { titulo, conteudo, tags, cor } = req.body;

  const notaAtualizada = await Note.findByIdAndUpdate(
    req.params.id,
    {
      titulo,
      conteudo,
      tags,
      cor,
      ultimaEdicaoPor: req.usuario._id
    },
    { new: true, runValidators: true }
  )
    .populate('autor', 'nome email')
    .populate('colaboradores.usuario', 'nome email');

  res.json({
    mensagem: 'Nota atualizada com sucesso!',
    nota: notaAtualizada
  });
});

// DELETE /api/notes/:id - Deletar nota
router.delete('/:id', async (req, res) => {
  const nota = await Note.findById(req.params.id);

  if (!nota) {
    return res.status(404).json({ erro: 'Nota não encontrada.' });
  }

  // Apenas o autor pode deletar
  if (nota.autor.toString() !== req.usuario._id.toString()) {
    return res.status(403).json({
      erro: 'Apenas o autor pode deletar a nota.'
    });
  }

  await Note.findByIdAndDelete(req.params.id);

  res.json({ mensagem: 'Nota deletada com sucesso!' });
});