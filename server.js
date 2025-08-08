require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações OAuth2
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'https://holly-j4a7.onrender.com';
const REDIRECT_URI = `${BASE_URL}/auth/discord/callback`;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Verificação das variáveis de ambiente
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERRO: DISCORD_CLIENT_ID ou DISCORD_CLIENT_SECRET não definidos');
  process.exit(1);
}

// Rota de autenticação
app.get('/auth/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds'
  });

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  console.log(`Redirecionando para: ${discordAuthUrl}`);
  res.redirect(discordAuthUrl);
});

// Rota de callback
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

    console.log('Code recebido:', code);

    // Troca o code por access_token
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', 'identify guilds');

    const response = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('Resposta do Discord:', {
      status: response.status,
      data: { 
        access_token: response.data.access_token ? '***RECEBIDO***' : null,
        expires_in: response.data.expires_in
      }
    });

    if (!response.data.access_token) {
      throw new Error('Access token não recebido');
    }

    // Redireciona com o token
    res.redirect(`/dashboard.html?token=${response.data.access_token}`);

  } catch (error) {
    console.error('ERRO NO CALLBACK:', {
      message: error.message,
      response: error.response?.data
    });
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
app.listen(PORT, () => {
  console.log(`
  ======================================
  🚀 Servidor rodando na porta ${PORT}
  ======================================
  Configurações OAuth2:
  - Client ID: ${CLIENT_ID}
  - Redirect URI: ${REDIRECT_URI}
  - Base URL: ${BASE_URL}
  ======================================
  `);
});

// Tratamento de erros
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});
