require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações OAuth2
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REDIRECT_URI = `${BASE_URL}/auth/discord/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(helmet());

// Verificação das variáveis de ambiente
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERRO: DISCORD_CLIENT_ID ou DISCORD_CLIENT_SECRET não definidos');
  process.exit(1);
}

// Middleware de autenticação melhorado
function authenticateToken(req, res, next) {
  const token = req.cookies.holly_token || req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    // Verificação básica do token (em produção, use jsonwebtoken)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    if (payload.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: 'Token expirado' });
    }

    req.user = payload;
    next();
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
}

// Rota de autenticação (mantida original)
app.get('/auth/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds'
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// Rota de callback melhorada
app.get('/auth/discord/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('Erro do Discord:', error);
      return res.redirect(`${FRONTEND_URL}/dashboard.html?error=auth_failed`);
    }

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/dashboard.html?error=no_code`);
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

    // Configura o cookie seguro com opções melhoradas
    res.cookie('holly_token', tokenResponse.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenResponse.data.expires_in * 1000,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.redirect(`${FRONTEND_URL}/dashboard.html`);

  } catch (error) {
    console.error('ERRO NO CALLBACK:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/dashboard.html?error=auth_failed`);
  }
});

// Nova rota de logout
app.post('/auth/logout', (req, res) => {
  res.clearCookie('holly_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  });
  res.status(200).json({ message: 'Logout realizado com sucesso' });
});

// Rota para dados do usuário (mantida com melhor tratamento de erro)
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { 'Authorization': `Bearer ${req.token}` }
    });
    
    res.json({
      ...userRes.data,
      plan: 'free'
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar usuário',
      details: error.response?.data || error.message
    });
  }
});

// Rota para servidores do usuário (mantida com melhor tratamento de erro)
app.get('/api/user/guilds', authenticateToken, async (req, res) => {
  try {
    const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { 'Authorization': `Bearer ${req.token}` }
    });
    
    res.json(guildsRes.data);
  } catch (error) {
    console.error('Erro ao buscar servidores:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar servidores',
      details: error.response?.data || error.message
    });
  }
});

// Rota para estatísticas do bot (mantida com melhor tratamento de erro)
app.get('/api/stats', async (req, res) => {
  try {
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
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      details: error.message
    });
  }
});

// Rotas estáticas (mantidas originais)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Inicia o servidor (mantido original com mensagem melhorada)
app.listen(PORT, () => {
  console.log(`
  ======================================
  🚀 Servidor rodando na porta ${PORT}
  ======================================
  Configurações:
  - Modo: ${process.env.NODE_ENV || 'development'}
  - Client ID: ${CLIENT_ID}
  - Redirect URI: ${REDIRECT_URI}
  - Base URL: ${BASE_URL}
  - Frontend URL: ${FRONTEND_URL}
  ======================================
  `);
});

// Tratamento de erros global melhorado
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Exceção não capturada:', err);
});
