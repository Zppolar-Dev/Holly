const path = require('path');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT;

// VARIÁVEIS DO RENDER - obrigatórias
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL;
const REDIRECT_URI = `${BASE_URL}/auth/discord/callback`;

// Checagem básica
if (!CLIENT_ID || !CLIENT_SECRET || !BASE_URL) {
  console.error('Variáveis de ambiente faltando (CLIENT_ID, CLIENT_SECRET ou BASE_URL)');
  process.exit(1);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Favicon silencioso
app.get('/favicon.ico', (req, res) => res.status(204).end());

// INÍCIO da autenticação com Discord
app.get('/auth/discord', (req, res) => {
  const scope = 'identify guilds';
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
  res.redirect(authUrl);
});

// CALLBACK do Discord depois do login
app.get('/auth/discord/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect('/dashboard.html?error=discord_' + error);
    }

    if (!code) {
      return res.redirect('/dashboard.html?error=no_code');
    }

    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', 'identify guilds');

    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenResponse.data;

    res.redirect(`/dashboard.html?token=${access_token}`);
  } catch (error) {
    console.error('Erro durante autenticação:', error.response?.data || error.message);
    res.redirect('/dashboard.html?error=auth_failed');
  }
});

// Home padrão
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start do servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

// Erros não tratados
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});
