require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações OAuth2
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'https://holly-j4a7.onrender.com';
const REDIRECT_URI = `${BASE_URL}/auth/discord/callback`;

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Verificação das variáveis de ambiente
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERRO: DISCORD_CLIENT_ID ou DISCORD_CLIENT_SECRET não definidos');
  process.exit(1);
}

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const token = req.cookies.holly_token || req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  req.token = token;
  next();
}

// Rota de autenticação
app.get('/auth/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds'
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
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

    // Troca o code por access_token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      scope: 'identify guilds'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Configura o cookie seguro
    res.cookie('holly_token', tokenResponse.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokenResponse.data.expires_in * 1000
    });

    res.redirect('/dashboard.html');

  } catch (error) {
    console.error('ERRO NO CALLBACK:', error.response?.data || error.message);
    res.redirect('/dashboard.html?error=auth_failed');
  }
});

// Rota para dados do usuário
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { 'Authorization': `Bearer ${req.token}` }
    });
    
    res.json({
      ...userRes.data,
      plan: 'free' // Adicione seus próprios dados do usuário aqui
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Rota para servidores do usuário
app.get('/api/user/guilds', authenticateToken, async (req, res) => {
  try {
    const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { 'Authorization': `Bearer ${req.token}` }
    });
    
    res.json(guildsRes.data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar servidores' });
  }
});

// Rota para estatísticas do bot
app.get('/api/stats', async (req, res) => {
  try {
    // Dados fictícios - substitua por seus dados reais
    res.json({
      commands_24h: 1250,
      unique_users: 842,
      uptime: 99.8,
      commands_by_hour: Array(24).fill().map(() => Math.floor(Math.random() * 100)),
      command_categories: {
        moderation: 35,
        fun: 25,
        utility: 20,
        music: 15,
        other: 5
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
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
