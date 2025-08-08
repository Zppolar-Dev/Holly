const path = require('path');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configurações OAuth2
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'https://holly-j4a7.onrender.com';
const REDIRECT_URI = `${BASE_URL}/auth/discord/callback`;

// Validação das variáveis de ambiente
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Erro: DISCORD_CLIENT_ID ou DISCORD_CLIENT_SECRET não configurados');
  process.exit(1);
}

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Rota de autenticação
app.get('/auth/discord/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect('/dashboard.html?error=no_code');
    }

    // Configuração CORRETA para obter o token
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', 'identify guilds'); // Adicione isso!

    const response = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Verifique se o token está vindo corretamente
    console.log('Resposta do Discord:', response.data);
    
    if (!response.data.access_token) {
      throw new Error('Token não recebido');
    }

    // Redirecione COM o token real
    res.redirect(`/dashboard.html?token=${response.data.access_token}`);
    
  } catch (error) {
    console.error('ERRO NO CALLBACK:', error.response?.data || error.message);
    res.redirect('/dashboard.html?error=auth_failed');
  }
});

// Rotas estáticas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em ${BASE_URL}`);
});

// Tratamento de erros
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});
