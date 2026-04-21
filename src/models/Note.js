
// src/models/Note.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'O título é obrigatório'],
    trim: true,
    maxlength: [200, 'O título pode ter no máximo 200 caracteres']
  },
  conteudo: {
    type: String,
    default: ''
  },
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  colaboradores: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissao: {
      type: String,
      enum: ['leitura', 'escrita'],
      default: 'leitura'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  cor: {
    type: String,
    default: '#ffffff'
  },
  ultimaEdicaoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índice composto para buscas eficientes
noteSchema.index({ autor: 1, updatedAt: -1 });
noteSchema.index({ 'colaboradores.usuario': 1 });

// Método: Verificar se um usuário tem acesso à nota
noteSchema.methods.temAcesso = function(userId) {
  // O autor sempre tem acesso
  if (this.autor.toString() === userId.toString()) return true;
  
  // Verificar se é colaborador
  return this.colaboradores.some(
    col => col.usuario.toString() === userId.toString()
  );
};

// Método: Verificar permissão de escrita
noteSchema.methods.podeEditar = function(userId) {
  if (this.autor.toString() === userId.toString()) return true;
  
  const colaborador = this.colaboradores.find(
    col => col.usuario.toString() === userId.toString()
  );
  
  return colaborador?.permissao === 'escrita';
};

module.exports = mongoose.model('Note', noteSchema);