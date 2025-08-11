/**
 * Dashboard Holly - Gerenciamento de Bot Discord
 * Versão: 2.5.0
 * Autor: Daniel Afonso
 * Data: 2023
 * Melhorias: Segurança, Tratamento de Erros, Performance
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Configurações atualizadas
    const CONFIG = {
        CLIENT_ID: '1069819161057968218',
        API_BASE_URL: window.location.origin, // Usa a origem atual
        DEFAULT_AVATAR: 'https://cdn.discordapp.com/embed/avatars/0.png',
        THEME_KEY: 'holly_theme',
        TOKEN_EXPIRATION_CHECK: true
    };

    // Elementos da UI (atualizado com novos seletores)
    const UI = {
        loginBtn: document.getElementById('login-btn'),
        userDropdown: document.getElementById('userDropdown'),
        navUserAvatar: document.getElementById('nav-user-avatar'),
        navUsername: document.getElementById('nav-username'),
        userAvatar: document.getElementById('user-avatar'),
        username: document.getElementById('username'),
        userDiscriminator: document.getElementById('user-discriminator'),
        statusDot: document.querySelector('.user-status .status-dot'),
        statusText: document.querySelector('.user-status .status-text'),
        userPlan: document.querySelector('.user-plan .plan-badge'),
        serversGrid: document.getElementById('serversGrid'),
        serverCount: document.getElementById('server-count'),
        commandCount: document.getElementById('command-count'),
        userCount: document.getElementById('user-count'),
        uptimePercent: document.getElementById('uptime-percent'),
        hamburger: document.getElementById('hamburger'),
        navbarMenu: document.getElementById('navbarMenu'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        closeSidebar: document.getElementById('closeSidebar'),
        dashboardSidebar: document.getElementById('dashboardSidebar'),
        dashboardContent: document.getElementById('dashboardContent'),
        themeToggle: document.querySelector('.theme-toggle'),
        themeIcon: document.getElementById('themeIcon'),
        feedbackBtn: document.getElementById('feedbackBtn'),
        feedbackModal: document.getElementById('feedbackModal'),
        closeModal: document.querySelector('.close-modal'),
        feedbackForm: document.getElementById('feedbackForm'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        currentTime: document.getElementById('current-time'),
        overlay: document.getElementById('overlay') || document.createElement('div') // Fallback seguro
    };

    // Estado da aplicação (atualizado)
    const STATE = {
        user: null,
        guilds: [],
        stats: null,
        theme: localStorage.getItem(CONFIG.THEME_KEY) || 'light',
        isSidebarOpen: false,
        isMobileMenuOpen: false,
        isOverlayVisible: false,
        lastScrollPosition: 0,
        charts: {
            activity: null,
            commands: null
        }
    };

    // Inicialização (atualizada com tratamento de erro)
    async function init() {
        try {
            setupEventListeners();
            setupOverlay();
            initSidebarState();
            applyTheme();
            updateActiveLink();
            
            showLoading(true);
            await checkAuth();
            
            if (STATE.user) {
                await Promise.all([
                    initCharts(),
                    updateClock()
                ]);
                setInterval(updateClock, 60000);
            }
        } catch (error) {
            console.error('Initialization error:', error);
            showNotification('Erro ao carregar dashboard. Tente recarregar a página.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // Configurar estado inicial da sidebar (melhorado)
    function initSidebarState() {
        const isMobile = window.innerWidth <= 768;
        STATE.isSidebarOpen = !isMobile;
        
        if (UI.dashboardSidebar) {
            UI.dashboardSidebar.classList.toggle('active', STATE.isSidebarOpen);
        }
        
        if (UI.dashboardContent) {
            UI.dashboardContent.classList.toggle('sidebar-active', STATE.isSidebarOpen);
            UI.dashboardContent.classList.toggle('sidebar-closed', !STATE.isSidebarOpen && window.innerWidth > 768);
        }
        
        if (UI.overlay) {
            UI.overlay.style.display = 'none';
            UI.overlay.style.opacity = '0';
        }
        
        updateSidebarControls();
    }

    // Atualizar controles da sidebar (melhorado)
    function updateSidebarControls() {
        if (UI.sidebarToggle) {
            UI.sidebarToggle.classList.toggle('active', STATE.isSidebarOpen);
            UI.sidebarToggle.setAttribute('aria-expanded', STATE.isSidebarOpen);
            UI.sidebarToggle.style.zIndex = STATE.isSidebarOpen ? '1002' : 'auto';
        }
        
        if (UI.closeSidebar) {
            UI.closeSidebar.style.display = STATE.isSidebarOpen ? 'block' : 'none';
        }
    }

    // Configurar overlay (melhorado)
    function setupOverlay() {
        if (!UI.overlay) return;
        
        UI.overlay.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
        UI.overlay.style.display = 'none';
    }

    // Alternar sidebar (melhorado com acessibilidade)
    function toggleSidebar() {
        STATE.isSidebarOpen = !STATE.isSidebarOpen;
        STATE.isOverlayVisible = STATE.isSidebarOpen && window.innerWidth <= 768;
        
        if (UI.dashboardSidebar) {
            UI.dashboardSidebar.classList.toggle('active', STATE.isSidebarOpen);
        }
        
        if (UI.dashboardContent) {
            UI.dashboardContent.classList.toggle('sidebar-active', STATE.isSidebarOpen);
            
            if (window.innerWidth > 768) {
                UI.dashboardContent.classList.toggle('sidebar-closed', !STATE.isSidebarOpen);
            }
        }
        
        if (UI.overlay) {
            if (window.innerWidth <= 768) {
                UI.overlay.style.display = STATE.isOverlayVisible ? 'block' : 'none';
                setTimeout(() => {
                    UI.overlay.style.opacity = STATE.isOverlayVisible ? '1' : '0';
                }, 10);
            } else {
                UI.overlay.style.display = 'none';
            }
        }
        
        if (window.innerWidth <= 768) {
            document.body.style.overflow = STATE.isSidebarOpen ? 'hidden' : '';
        }
        
        updateSidebarControls();
    }

    // Configurar event listeners (melhorado)
    function setupEventListeners() {
        // Autenticação
        if (UI.loginBtn) {
            UI.loginBtn.addEventListener('click', handleAuthClick);
            UI.loginBtn.setAttribute('aria-label', 'Login com Discord');
        }

        // Dropdown do usuário
        if (UI.userDropdown) {
            const dropdownToggle = UI.userDropdown.querySelector('.dropdown-toggle');
            if (dropdownToggle) {
                dropdownToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    UI.userDropdown.classList.toggle('active');
                    dropdownToggle.setAttribute('aria-expanded', 
                        UI.userDropdown.classList.contains('active'));
                });
                dropdownToggle.setAttribute('aria-haspopup', 'true');
            }
        }

        // Navegação mobile
        if (UI.hamburger && UI.navbarMenu) {
            UI.hamburger.addEventListener('click', toggleMobileMenu);
            UI.hamburger.setAttribute('aria-label', 'Alternar menu');
        }

        // Sidebar
        if (UI.sidebarToggle) {
            UI.sidebarToggle.addEventListener('click', toggleSidebar);
            UI.sidebarToggle.setAttribute('aria-label', 'Alternar sidebar');
        }

        if (UI.closeSidebar) {
            UI.closeSidebar.addEventListener('click', toggleSidebar);
            UI.closeSidebar.setAttribute('aria-label', 'Fechar sidebar');
        }

        // Tema
        if (UI.themeToggle) {
            UI.themeToggle.addEventListener('click', toggleTheme);
            UI.themeToggle.setAttribute('aria-label', 
                `Alternar para tema ${STATE.theme === 'light' ? 'escuro' : 'claro'}`);
        }

        // Modal
        if (UI.feedbackBtn) {
            UI.feedbackBtn.addEventListener('click', () => toggleModal(true));
            UI.feedbackBtn.setAttribute('aria-label', 'Abrir feedback');
        }

        if (UI.closeModal) {
            UI.closeModal.addEventListener('click', () => toggleModal(false));
            UI.closeModal.setAttribute('aria-label', 'Fechar modal');
        }

        if (UI.feedbackForm) {
            UI.feedbackForm.addEventListener('submit', handleFeedbackSubmit);
        }

        // Fechar dropdown/modal quando clicar fora
        document.addEventListener('click', function(e) {
            if (UI.userDropdown && !UI.userDropdown.contains(e.target)) {
                UI.userDropdown.classList.remove('active');
                const dropdownToggle = UI.userDropdown.querySelector('.dropdown-toggle');
                if (dropdownToggle) dropdownToggle.setAttribute('aria-expanded', 'false');
            }
            
            if (UI.feedbackModal && e.target === UI.feedbackModal) {
                toggleModal(false);
            }
        });

        // Fechar com ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (UI.userDropdown && UI.userDropdown.classList.contains('active')) {
                    UI.userDropdown.classList.remove('active');
                    const dropdownToggle = UI.userDropdown.querySelector('.dropdown-toggle');
                    if (dropdownToggle) dropdownToggle.setAttribute('aria-expanded', 'false');
                }
                
                if (UI.feedbackModal && UI.feedbackModal.classList.contains('active')) {
                    toggleModal(false);
                }
                
                if (STATE.isSidebarOpen) {
                    toggleSidebar();
                }
            }
        });

        // Redimensionamento da janela
        window.addEventListener('resize', function() {
            const isMobile = window.innerWidth <= 768;
            if (STATE.isOverlayVisible !== isMobile) {
                initSidebarState();
            }
        });

        // Scroll
        window.addEventListener('scroll', handleScroll);
    }

    // Mostrar/Ocultar loading (melhorado)
    function showLoading(show) {
        if (!UI.loadingOverlay) return;
        
        if (show) {
            UI.loadingOverlay.style.display = 'flex';
            setTimeout(() => {
                UI.loadingOverlay.style.opacity = '1';
            }, 10);
        } else {
            UI.loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                UI.loadingOverlay.style.display = 'none';
            }, 300);
        }
    }

    // Atualizar link ativo (melhorado)
    function updateActiveLink() {
        const links = document.querySelectorAll('.navbar-links a, .sidebar-menu a');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        links.forEach(link => {
            if (!link.getAttribute('href')) return;
            
            const linkPage = link.getAttribute('href').split('/').pop();
            const isActive = currentPage === linkPage || 
                (currentPage === 'index.html' && linkPage === '') ||
                (currentPage === '' && linkPage === 'index.html');
            
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : null);
        });
    }

    // Gerenciamento de autenticação (totalmente atualizado)
    async function checkAuth() {
        try {
            const [userRes, guildsRes, statsRes] = await Promise.all([
                fetch(`${CONFIG.API_BASE_URL}/api/user`, { credentials: 'include' }),
                fetch(`${CONFIG.API_BASE_URL}/api/user/guilds`, { credentials: 'include' }),
                fetch(`${CONFIG.API_BASE_URL}/api/stats`, { credentials: 'include' })
            ]);

            if (!userRes.ok) {
                if (userRes.status === 401) {
                    throw new Error('Não autorizado');
                }
                throw new Error(`HTTP error! status: ${userRes.status}`);
            }

            const userData = await userRes.json();
            const guildsData = await guildsRes.json();
            const statsData = await statsRes.json();

            STATE.user = userData;
            STATE.guilds = guildsData.filter(guild => guild.permissions & 0x20);
            STATE.stats = statsData;

            updateUserUI();
            updateServersUI();
            updateStatsUI();

            return true;
        } catch (error) {
            console.error('Authentication check failed:', error);
            showUnauthenticatedUI();
            
            if (error.message !== 'Não autorizado') {
                showNotification('Erro ao verificar autenticação. Tente novamente.', 'error');
            }
            
            return false;
        }
    }

    // Atualizar UI com dados do usuário (melhorado)
    function updateUserUI() {
        if (!STATE.user) return;

        const { id, username, discriminator, avatar, plan } = STATE.user;
        const avatarUrl = avatar 
            ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=256`
            : CONFIG.DEFAULT_AVATAR;

        // Atualizar avatar e nome
        if (UI.userAvatar) {
            UI.userAvatar.src = avatarUrl;
            UI.userAvatar.alt = `Avatar de ${username}`;
        }
        if (UI.navUserAvatar) {
            UI.navUserAvatar.src = avatarUrl;
            UI.navUserAvatar.alt = `Avatar de ${username}`;
        }
        if (UI.username) UI.username.textContent = username;
        if (UI.navUsername) UI.navUsername.textContent = username;
        if (UI.userDiscriminator) {
            UI.userDiscriminator.textContent = discriminator ? `#${discriminator}` : '';
        }

        // Atualizar plano
        if (UI.userPlan) {
            UI.userPlan.textContent = plan === 'premium' ? 'Premium' : 'Free';
            UI.userPlan.className = `plan-badge ${plan}`;
        }

        // Atualizar status
        updateUserStatus('online');

        // Atualizar botão de login
        if (UI.loginBtn) {
            UI.loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair';
            UI.loginBtn.onclick = logout;
            UI.loginBtn.setAttribute('aria-label', 'Sair da conta');
        }
    }

    // Atualizar status do usuário (mantido)
    function updateUserStatus(status) {
        const statusMap = {
            online: { color: 'var(--online-color)', text: 'Online' },
            idle: { color: 'var(--idle-color)', text: 'Ausente' },
            dnd: { color: 'var(--dnd-color)', text: 'Ocupado' },
            offline: { color: 'var(--offline-color)', text: 'Offline' }
        };

        const currentStatus = statusMap[status] || statusMap.offline;

        if (UI.statusDot) {
            UI.statusDot.style.backgroundColor = currentStatus.color;
            UI.statusDot.className = 'status-dot ' + status;
            UI.statusDot.setAttribute('aria-label', `Status: ${currentStatus.text}`);
        }
        if (UI.statusText) UI.statusText.textContent = currentStatus.text;
    }

    // Atualizar UI dos servidores (melhorado)
    function updateServersUI() {
        if (!UI.serversGrid) return;

        UI.serversGrid.innerHTML = '';
        
        if (!STATE.guilds || STATE.guilds.length === 0) {
            UI.serversGrid.innerHTML = `
                <div class="server-card placeholder">
                    <div class="server-icon" aria-hidden="true">
                        <i class="fas fa-server"></i>
                    </div>
                    <h3>Nenhum servidor encontrado</h3>
                    <p>Você não possui servidores ou não tem permissão para gerenciá-los</p>
                </div>
            `;
            return;
        }

        if (UI.serverCount) {
            animateCounter(UI.serverCount, 0, STATE.guilds.length, 1000);
        }

        STATE.guilds.forEach(guild => {
            const serverCard = document.createElement('div');
            serverCard.className = 'server-card';
            serverCard.dataset.guildId = guild.id;
            serverCard.setAttribute('role', 'button');
            serverCard.setAttribute('aria-label', `Gerenciar servidor ${guild.name}`);
            
            const icon = guild.icon 
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
                : guild.name.charAt(0);
            
            serverCard.innerHTML = `
                <div class="server-icon" style="${!guild.icon ? 'background-color: var(--primary-dark); color: white; font-size: 1.5rem;' : ''}">
                    ${guild.icon ? `<img src="${icon}" alt="${guild.name}" loading="lazy">` : icon}
                </div>
                <h3>${guild.name}</h3>
                <p>${guild.permissions & 0x20 ? 'Gerenciável' : 'Sem permissões'}</p>
                <button class="btn secondary-btn small-btn manage-btn" aria-label="Gerenciar ${guild.name}">
                    <i class="fas fa-cog"></i> Gerenciar
                </button>
            `;
            
            UI.serversGrid.appendChild(serverCard);

            const manageBtn = serverCard.querySelector('.manage-btn');
            if (manageBtn) {
                manageBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    manageServer(guild.id);
                });
            }

            serverCard.addEventListener('click', () => {
                viewServerDetails(guild.id);
            });
        });
    }

    // Atualizar estatísticas na UI (melhorado)
    function updateStatsUI() {
        if (!STATE.stats) return;

        if (UI.commandCount) {
            animateCounter(UI.commandCount, 0, STATE.stats.commands_24h, 1500);
        }

        if (UI.userCount) {
            animateCounter(UI.userCount, 0, STATE.stats.unique_users, 1500);
        }

        if (UI.uptimePercent) {
            UI.uptimePercent.textContent = STATE.stats.uptime + '%';
        }

        updateCharts();
    }

    // Animação de contador (mantido)
    function animateCounter(element, start, end, duration) {
        if (!element) return;
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value.toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Inicializar gráficos (melhorado)
    function initCharts() {
        const activityCtx = document.getElementById('activityChart')?.getContext('2d');
        const commandsCtx = document.getElementById('commandsChart')?.getContext('2d');

        if (activityCtx) {
            STATE.charts.activity = new Chart(activityCtx, {
                type: 'line',
                data: {
                    labels: Array(24).fill().map((_, i) => `${i}h`),
                    datasets: [{
                        label: 'Comandos por hora',
                        data: Array(24).fill().map(() => Math.floor(Math.random() * 1000)),
                        borderColor: 'var(--primary-color)',
                        backgroundColor: 'rgba(138, 79, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: getChartOptions('Atividade nas últimas 24 horas')
            });
        }

        if (commandsCtx) {
            STATE.charts.commands = new Chart(commandsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Moderação', 'Diversão', 'Utilitários', 'Música', 'Outros'],
                    datasets: [{
                        data: [35, 25, 20, 15, 5],
                        backgroundColor: [
                            'var(--primary-color)',
                            'var(--secondary-color)',
                            'var(--accent-color)',
                            'var(--primary-dark)',
                            'var(--border-color)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: getChartOptions('Distribuição de comandos')
            });
        }
    }

    // Atualizar gráficos com dados reais (melhorado)
    function updateCharts() {
        if (!STATE.stats) return;

        if (STATE.charts.activity) {
            STATE.charts.activity.data.datasets[0].data = STATE.stats.commands_by_hour || 
                Array(24).fill().map((_, i) => Math.floor(Math.random() * 1000));
            STATE.charts.activity.update();
        }

        if (STATE.charts.commands) {
            STATE.charts.commands.data.datasets[0].data = [
                STATE.stats.command_categories?.moderation || 35,
                STATE.stats.command_categories?.fun || 25,
                STATE.stats.command_categories?.utility || 20,
                STATE.stats.command_categories?.music || 15,
                STATE.stats.command_categories?.other || 5
            ];
            STATE.charts.commands.update();
        }
    }

    // Opções padrão para gráficos (mantido)
    function getChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                    }
                },
                title: {
                    display: !!title,
                    text: title,
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                    font: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light')
                    }
                },
                x: {
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light')
                    }
                }
            }
        };
    }

    // Mostrar UI para usuários não autenticados (melhorado)
    function showUnauthenticatedUI() {
        if (UI.userAvatar) {
            UI.userAvatar.src = CONFIG.DEFAULT_AVATAR;
            UI.userAvatar.alt = 'Avatar padrão';
        }
        if (UI.navUserAvatar) {
            UI.navUserAvatar.src = CONFIG.DEFAULT_AVATAR;
            UI.navUserAvatar.alt = 'Avatar padrão';
        }
        if (UI.username) UI.username.textContent = 'Não Logado';
        if (UI.navUsername) UI.navUsername.textContent = 'Entrar';
        if (UI.userDiscriminator) UI.userDiscriminator.textContent = '#0000';
        updateUserStatus('offline');
        if (UI.userPlan) {
            UI.userPlan.textContent = 'Free';
            UI.userPlan.className = 'plan-badge free';
        }

        if (UI.loginBtn) {
            UI.loginBtn.innerHTML = '<i class="fab fa-discord"></i> Login com Discord';
            UI.loginBtn.onclick = handleAuthClick;
            UI.loginBtn.setAttribute('aria-label', 'Login com Discord');
        }

        if (UI.serversGrid) {
            UI.serversGrid.innerHTML = `
                <div class="server-card placeholder">
                    <div class="server-icon" aria-hidden="true">
                        <i class="fas fa-sign-in-alt"></i>
                    </div>
                    <h3>Faça login</h3>
                    <p>Conecte-se com Discord para gerenciar seus servidores</p>
                    <button class="btn primary-btn small-btn" id="grid-login-btn" aria-label="Login com Discord">
                        <i class="fab fa-discord"></i> Login com Discord
                    </button>
                </div>
            `;

            const gridLoginBtn = document.getElementById('grid-login-btn');
            if (gridLoginBtn) {
                gridLoginBtn.addEventListener('click', handleAuthClick);
            }
        }

        if (UI.serverCount) UI.serverCount.textContent = '0';
        if (UI.commandCount) UI.commandCount.textContent = '0';
        if (UI.userCount) UI.userCount.textContent = '0';
    }

    // Manipulador de autenticação (melhorado)
    function handleAuthClick() {
        if (STATE.user) {
            logout();
        } else {
            window.location.href = `${CONFIG.API_BASE_URL}/auth/discord`;
        }
    }

    // Logout (melhorado)
    async function logout() {
        try {
            await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            STATE.user = null;
            STATE.guilds = [];
            STATE.stats = null;
            
            if (STATE.charts.activity) STATE.charts.activity.destroy();
            if (STATE.charts.commands) STATE.charts.commands.destroy();
            
            showUnauthenticatedUI();
            showNotification('Você saiu da sua conta', 'info');
            
            // Redireciona apenas se não estiver na página inicial
            if (!window.location.pathname.endsWith('index.html')) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('Erro ao sair. Tente novamente.', 'error');
        }
    }

    // Alternar menu mobile (melhorado)
    function toggleMobileMenu() {
        STATE.isMobileMenuOpen = !STATE.isMobileMenuOpen;
        
        if (UI.navbarMenu) {
            UI.navbarMenu.classList.toggle('active');
        }
        
        if (UI.hamburger) {
            UI.hamburger.classList.toggle('active');
            UI.hamburger.setAttribute('aria-expanded', STATE.isMobileMenuOpen);
            
            const icon = UI.hamburger.querySelector('i');
            if (icon) {
                icon.className = STATE.isMobileMenuOpen ? 'fas fa-times' : 'fas fa-bars';
            }
        }
        
        document.body.style.overflow = STATE.isMobileMenuOpen ? 'hidden' : '';
    }

    // Alternar modal (melhorado)
    function toggleModal(show) {
        if (!UI.feedbackModal) return;
        
        if (show) {
            UI.feedbackModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            UI.feedbackModal.setAttribute('aria-hidden', 'false');
        } else {
            UI.feedbackModal.classList.remove('active');
            document.body.style.overflow = '';
            UI.feedbackModal.setAttribute('aria-hidden', 'true');
        }
    }

    // Enviar feedback (melhorado)
    async function handleFeedbackSubmit(e) {
        e.preventDefault();
        
        const formData = {
            type: document.getElementById('feedbackType').value,
            message: document.getElementById('feedbackMessage').value.trim()
        };

        if (!formData.message) {
            showNotification('Por favor, insira uma mensagem de feedback', 'error');
            document.getElementById('feedbackMessage').focus();
            return;
        }

        showLoading(true);
        
        try {
            // Simulação de envio (substitua por chamada real à API)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            toggleModal(false);
            showNotification('Feedback enviado com sucesso! Obrigado.', 'success');
            UI.feedbackForm.reset();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showNotification('Erro ao enviar feedback. Tente novamente.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // Atualizar relógio (mantido)
    function updateClock() {
        if (!UI.currentTime) return;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
        
        const dateString = now.toLocaleDateString('pt-BR', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        }).replace('.', '');
        
        UI.currentTime.textContent = `${dateString} • ${timeString}`;
        UI.currentTime.setAttribute('aria-label', `Data e hora atual: ${dateString} às ${timeString}`);
    }

    // Alternar tema (melhorado)
    function toggleTheme() {
        STATE.theme = STATE.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem(CONFIG.THEME_KEY, STATE.theme);
        applyTheme();
    }

    // Aplicar tema (melhorado)
    function applyTheme() {
        document.documentElement.setAttribute('data-theme', STATE.theme);
        
        if (UI.themeIcon) {
            UI.themeIcon.className = STATE.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            UI.themeIcon.setAttribute('aria-label', 
                `Tema ${STATE.theme === 'light' ? 'claro' : 'escuro'}`);
        }

        showNotification(`Tema ${STATE.theme === 'light' ? 'claro' : 'escuro'} ativado`);
    }

    // Mostrar notificação (melhorado)
    function showNotification(message, type = 'info') {
        const types = {
            success: { icon: 'check-circle', color: '#2ecc71' },
            error: { icon: 'exclamation-triangle', color: '#e74c3c' },
            info: { icon: 'info-circle', color: '#3498db' },
            warning: { icon: 'exclamation-circle', color: '#f39c12' }
        };

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        notification.innerHTML = `
            <i class="fas fa-${types[type]?.icon || 'info-circle'}" aria-hidden="true"></i>
            <span>${message}</span>
        `;
        notification.style.backgroundColor = types[type]?.color || '#3498db';

        document.body.appendChild(notification);

        // Animação de entrada
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remover após 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    // Lidar com scroll da página (melhorado)
    function handleScroll() {
        const currentScrollPosition = window.pageYOffset;

        // Mostrar/ocultar botão "voltar ao topo"
        if (UI.backToTop) {
            if (currentScrollPosition > 300) {
                UI.backToTop.classList.add('visible');
            } else {
                UI.backToTop.classList.remove('visible');
            }
        }

        STATE.lastScrollPosition = currentScrollPosition;
    }

    // Gerenciar servidor (mock - mantido)
    function manageServer(guildId) {
        showNotification(`Redirecionando para gerenciamento do servidor ${guildId}`, 'info');
        console.log(`Gerenciando servidor ${guildId}`);
    }

    // Visualizar detalhes do servidor (mock - mantido)
    function viewServerDetails(guildId) {
        console.log(`Visualizando servidor ${guildId}`);
    }

    // Inicializar a aplicação
    init();
});
