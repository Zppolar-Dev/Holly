require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

<<<<<<< HEAD
// Configurações OAuth2 com fallbacks para desenvolvimento
=======
// Configurações OAuth2
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = process.env.FRONTEND_URL || BASE_URL;
const REDIRECT_URI = `${BASE_URL}/auth/discord/callback`;
<<<<<<< HEAD
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

// Verificação das variáveis de ambiente críticas
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERRO: Variáveis de ambiente DISCORD_CLIENT_ID e DISCORD_CLIENT_SECRET são obrigatórias');
  process.exit(1);
}

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(helmet());

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const token = req.cookies.holly_token || req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Não autorizado - Token não fornecido' });
  }

  try {
    // Verificação básica do token (em produção use jsonwebtoken)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    if (payload.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: 'Token expirado' });
    }

=======
const FRONTEND_URL = process.env.FRONTEND_URL;

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

>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
    req.user = payload;
    next();
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
}

<<<<<<< HEAD
// Rota de autenticação com Discord
=======
// Rota de autenticação (mantida original)
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
app.get('/auth/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
<<<<<<< HEAD
    scope: 'identify guilds',
    prompt: 'none'
=======
    scope: 'identify guilds'
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

<<<<<<< HEAD
// Rota de callback do Discord
=======
// Rota de callback melhorada
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
app.get('/auth/discord/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    if (error) {
<<<<<<< HEAD
      console.error(`Erro do Discord: ${error} - ${error_description}`);
=======
      console.error('Erro do Discord:', error);
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
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

<<<<<<< HEAD
    // Configura o cookie seguro
=======
    // Configura o cookie seguro com opções melhoradas
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
    res.cookie('holly_token', tokenResponse.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenResponse.data.expires_in * 1000,
      path: '/',
<<<<<<< HEAD
      domain: COOKIE_DOMAIN
=======
      domain: process.env.COOKIE_DOMAIN || undefined
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
    });

    res.redirect(`${FRONTEND_URL}/dashboard.html`);

  } catch (error) {
    console.error('ERRO NO CALLBACK:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/dashboard.html?error=auth_failed`);
  }
});

<<<<<<< HEAD
// Rota de logout
=======
// Nova rota de logout
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
app.post('/auth/logout', (req, res) => {
  res.clearCookie('holly_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
<<<<<<< HEAD
    domain: COOKIE_DOMAIN
=======
    domain: process.env.COOKIE_DOMAIN || undefined
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
  });
  res.status(200).json({ message: 'Logout realizado com sucesso' });
});

<<<<<<< HEAD
// API - Dados do usuário
=======
// Rota para dados do usuário (mantida com melhor tratamento de erro)
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { 'Authorization': `Bearer ${req.token}` }
    });
    
    res.json({
      ...userRes.data,
<<<<<<< HEAD
      plan: 'free' // Adicione dados adicionais do usuário aqui
=======
      plan: 'free'
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
<<<<<<< HEAD
      error: 'Erro ao buscar dados do usuário',
=======
      error: 'Erro ao buscar usuário',
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
      details: error.response?.data || error.message
    });
  }
});

<<<<<<< HEAD
// API - Servidores do usuário
=======
// Rota para servidores do usuário (mantida com melhor tratamento de erro)
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
app.get('/api/user/guilds', authenticateToken, async (req, res) => {
  try {
    const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { 'Authorization': `Bearer ${req.token}` }
    });
    
<<<<<<< HEAD
    // Filtra apenas servidores com permissão de gerenciamento
    const manageableGuilds = guildsRes.data.filter(guild => guild.permissions & 0x20);
    
    res.json(manageableGuilds);
=======
    res.json(guildsRes.data);
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
  } catch (error) {
    console.error('Erro ao buscar servidores:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar servidores',
      details: error.response?.data || error.message
    });
  }
});

<<<<<<< HEAD
// API - Estatísticas do bot
app.get('/api/stats', async (req, res) => {
  try {
    // Dados simulados - substitua por dados reais do seu bot
    const stats = {
      commands_24h: Math.floor(Math.random() * 2000) + 500,
      unique_users: Math.floor(Math.random() * 5000) + 1000,
=======
// Rota para estatísticas do bot (mantida com melhor tratamento de erro)
app.get('/api/stats', async (req, res) => {
  try {
    res.json({
      commands_24h: 1250,
      unique_users: 842,
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
      uptime: 99.8,
      commands_by_hour: Array(24).fill().map(() => Math.floor(Math.random() * 100)),
      command_categories: {
        moderation: 35,
        fun: 25,
        utility: 20,
        music: 15,
        other: 5
<<<<<<< HEAD
      },
      timestamp: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao gerar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar estatísticas',
=======
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
      details: error.message
    });
  }
});

<<<<<<< HEAD
// Rotas estáticas
=======
// Rotas estáticas (mantidas originais)
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

<<<<<<< HEAD
// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
=======
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
>>>>>>> 6fe292a72a3659c478687664efb55fd0716d74fe
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno no servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`
  =============================================
  🚀 Servidor Holly iniciado na porta ${PORT}
  =============================================
  Modo: ${process.env.NODE_ENV || 'development'}
  Client ID: ${CLIENT_ID}
  Base URL: ${BASE_URL}
  Frontend URL: ${FRONTEND_URL}
  =============================================
  Rotas disponíveis:
  - GET /              -> Página inicial
  - GET /dashboard.html -> Painel de controle
  - GET /auth/discord  -> Iniciar autenticação
  - GET /api/user      -> Dados do usuário
  - GET /api/stats     -> Estatísticas do bot
  =============================================
  `);
});

// Tratamento de erros globais
process.on('unhandledRejection', (err) => {
  console.error('Rejeição não tratada:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Exceção não capturada:', err);
  process.exit(1);
});