const path = require('path');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000; // IMPORTANTÃO: Render injeta essa variável PORT, usa ela

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://holly-j4a7.onrender.com/auth/discord/callback';

// Verifica se as variáveis tão lá, se não, para o app na hora
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Variáveis de ambiente não configuradas, tu tá lascado');
  process.exit(1);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/auth/discord', (req, res) => {
  const scope = 'identify guilds';
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
  console.log('Redirecionando para:', authUrl);
  res.redirect(authUrl);
});

app.get('/auth/discord/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('Erro do Discord:', error);
      return res.redirect('/dashboard.html?error=discord_' + error);
    }

    if (!code) {
      console.error('Código de autorização ausente');
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
    console.log('Autenticação bem-sucedida!');

    res.redirect(`/dashboard.html?token=${access_token}`);
  } catch (error) {
    console.error('Erro durante autenticação:', error.response?.data || error.message);
    res.redirect('/dashboard.html?error=auth_failed');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

// Pra pegar erros inesperados
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});
