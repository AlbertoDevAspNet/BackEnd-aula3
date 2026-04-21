// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'O nome é obrigatorio'],
    trim: true,
    minlength: [2, 'O nome deve ter pelo menos 2 caracteres']
  },
  email: {
    type: String,
    required: [true, 'O email é obrigatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalido']
  },
  senha: {
    type: String,
    required: [true, 'A senha é obrigatoria'],
    minlength: [6, 'A senha deve ter pelo menos 6 caracteres'],
    select: false  // Não retorna a senha nas queries por padrão
  }
}, {
  timestamps: true  // Adiciona createdAt e updatedAt automaticamente
});

// Middleware: Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  // Só faz hash se a senha foi modificada
  if (!this.isModified('senha')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

// Método: Comparar senha fornecida com a hash armazenada
userSchema.methods.compararSenha = async function(senhaCandidata) {
  return await bcrypt.compare(senhaCandidata, this.senha);
};

module.exports = mongoose.model('User', userSchema);