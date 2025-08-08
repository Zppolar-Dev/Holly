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
app.get('/auth/discord', (req, res) => {
  const scope = 'identify guilds';
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
  res.redirect(authUrl);
});

// Callback do Discord
app.get('/auth/discord/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('Erro do Discord:', error);
      return res.redirect('/dashboard.html?error=auth_failed');
    }

    if (!code) {
      return res.redirect('/dashboard.html?error=no_code');
    }

    // Troca do code por token
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', 'identify guilds');

    const response = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // Redireciona com o token
    res.redirect(`/dashboard.html?token=${response.data.access_token}`);

  } catch (error) {
    console.error('Erro no callback:', error.response?.data || error.message);
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
