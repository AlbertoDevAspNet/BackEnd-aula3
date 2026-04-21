# BackEnd-aula3
Contexto:

Você foi encarregado de desenvolver o back-end de uma aplicação colaborativa de notas em tempo real, em que múltiplos usuários podem criar, editar e visualizar notas simultaneamente. A aplicação precisa de um sistema de autenticação para gerenciar o acesso dos usuários, persistência de dados para armazenar as notas no banco de dados, e comunicação em tempo real para garantir que as alterações feitas por um usuário sejam imediatamente refletidas para os outros usuários conectados.

# Criacao do projeto
# npm init -y
# irá criar arquivo de configuração inicial package.json  
// Estrutura de pastas do projeto
collaborative-notes/
├── src/
│   ├── config/
│   │   └── database.js        # Conexão com MongoDB
│   ├── middleware/
│   │   └── auth.js            # Middleware de autenticação
│   ├── models/
│   │   ├── User.js            # Model do usuário
│   │   └── Note.js            # Model da nota
│   ├── routes/
│   │   ├── auth.js            # Rotas de autenticação
│   │   └── notes.js           # Rotas CRUD de notas
│   ├── sockets/
│   │   └── noteSocket.js      # Eventos em tempo real
│   └── app.js                 # Servidor principal
├── .env                       # Variáveis de ambiente
├── package.json
└── README.md
