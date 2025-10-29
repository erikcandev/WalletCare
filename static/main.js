// WalletCare - Main JavaScript
class WalletCare {
    constructor() {
        this.currentTab = 'dashboard';
        this.config = {};
        this.gastos = [];
        this.charts = {};
        this.recognition = null;
        this.isRecording = false;
        this.deviceId = this.getOrCreateDeviceId();
        
        this.init();
    }
    
    getOrCreateDeviceId() {
        // Verifica se já existe um ID para este dispositivo
        let deviceId = localStorage.getItem('walletcare_device_id');
        
        if (!deviceId) {
            // Gera um ID único baseado em timestamp + random
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('walletcare_device_id', deviceId);
        }
        
        console.log('Device ID:', deviceId);
        return deviceId;
    }
    
    async init() {
        await this.loadConfig();
        
        // Verifica se é o primeiro acesso
        if (this.config.primeiro_acesso) {
            this.showModal('modalCadastro');
        }
        
        this.setupEventListeners();
        this.setupTabs();
        this.setupTheme();
        this.setupSpeechRecognition();
        this.updateCurrentMonth();
        
        // Aguarda Chart.js carregar se necessário
        await this.waitForChart();
        
        // Carrega dados iniciais
        await this.loadDashboard();
        
        console.log('WalletCare inicializado com sucesso!');
    }
    
    async waitForChart() {
        // Aguarda até 3 segundos para Chart.js carregar
        let attempts = 0;
        while (typeof Chart === 'undefined' && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js não carregou, gráficos não estarão disponíveis');
        } else {
            console.log('Chart.js carregado com sucesso');
        }
    }
    
    // Configuração e dados
    async loadConfig() {
        try {
            const response = await fetch(`/api/config?device_id=${this.deviceId}`);
            this.config = await response.json();
        } catch (error) {
            console.error('Erro ao carregar configuração:', error);
            this.config = { primeiro_acesso: false, tema: 'claro', renda_mensal: 0 };
        }
    }
    
    async saveConfig(newConfig) {
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newConfig, device_id: this.deviceId })
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                this.config = result.config;
                this.showToast('Configuração salva com sucesso!', 'success');
                return true;
            }
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            this.showToast('Erro ao salvar configuração', 'error');
        }
        return false;
    }
    
    async loadGastos() {
        try {
            const response = await fetch(`/api/gastos?device_id=${this.deviceId}`);
            this.gastos = await response.json();
            return this.gastos;
        } catch (error) {
            console.error('Erro ao carregar gastos:', error);
            return [];
        }
    }
    
    async saveGasto(gasto) {
        try {
            const response = await fetch('/api/gastos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...gasto, device_id: this.deviceId })
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                this.gastos.push(result.gasto);
                this.showToast('Gasto registrado com sucesso!', 'success');
                await this.loadDashboard();
                return true;
            }
        } catch (error) {
            console.error('Erro ao salvar gasto:', error);
            this.showToast('Erro ao salvar gasto', 'error');
        }
        return false;
    }
    
    // Event Listeners
    setupEventListeners() {
        // Cadastro inicial
        document.getElementById('formCadastro').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCadastroInicial();
        });
        
        document.getElementById('btnPular').addEventListener('click', () => {
            this.handleCadastroInicial(true);
        });
        
        // Tema
        document.getElementById('btnTema').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Modal de gasto
        document.getElementById('btnAdicionarGasto').addEventListener('click', () => {
            this.showModal('modalGasto');
        });
        
        document.getElementById('formGasto').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdicionarGasto();
        });
        
        // Chat
        document.getElementById('btnEnviarChat').addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        
        document.getElementById('btnGravarAudio').addEventListener('click', () => {
            this.toggleAudioRecording();
        });
        
        // Relatórios
        document.getElementById('btnGerarPDF').addEventListener('click', () => {
            this.generatePDFReport();
        });
        
        document.getElementById('filtroMes').addEventListener('change', () => {
            this.updateReportsTable();
        });
        
        document.getElementById('filtroCategoria').addEventListener('change', () => {
            this.updateReportsTable();
        });
        
        // Investimentos
        document.getElementById('btnSimular').addEventListener('click', () => {
            this.simulateInvestment();
        });
        
        // Configurações
        document.getElementById('btnSalvarRenda').addEventListener('click', () => {
            this.salvarRendaMensal();
        });
        
        document.getElementById('btnResetarGastos').addEventListener('click', () => {
            this.showModal('modalConfirmReset');
        });
        
        document.getElementById('btnConfirmarReset').addEventListener('click', () => {
            this.resetarGastos();
        });
        
        document.getElementById('confirmText').addEventListener('input', (e) => {
            this.validarConfirmacao(e.target.value);
        });
        
        document.getElementById('btnTemaClaro').addEventListener('click', () => {
            this.alterarTema('claro');
        });
        
        document.getElementById('btnTemaEscuro').addEventListener('click', () => {
            this.alterarTema('dark');
        });
        
        // Modais
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.hideModal(modal.id);
            });
        });
        
        // Fechar modal clicando fora
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }
    
    setupTabs() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }
    
    switchTab(tabName) {
        // Remove active das tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Ativa nova tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        this.currentTab = tabName;
        
        // Carrega dados específicos da tab
        this.loadTabData(tabName);
    }
    
    async loadTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'relatorios':
                await this.loadReports();
                break;
            case 'investimentos':
                await this.loadInvestments();
                break;
            case 'configuracoes':
                await this.loadSettings();
                break;
        }
    }
    
    // Tema
    setupTheme() {
        const savedTheme = this.config.tema || 'claro';
        this.applyTheme(savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'claro' : 'dark';
        
        this.applyTheme(newTheme);
        this.saveConfig({ tema: newTheme });
    }
    
    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('btnTema').innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.getElementById('btnTema').innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    // Cadastro inicial
    async handleCadastroInicial(pular = false) {
        const rendaMensal = pular ? 0 : parseFloat(document.getElementById('rendaMensal').value) || 0;
        
        const success = await this.saveConfig({
            renda_mensal: rendaMensal,
            primeiro_acesso: false
        });
        
        if (success) {
            this.hideModal('modalCadastro');
            await this.loadDashboard();
        }
    }
    
    // Dashboard
    async loadDashboard() {
        this.showLoading();
        
        try {
            const response = await fetch('/api/dashboard');
            const data = await response.json();
            
            this.updateDashboardCards(data);
            this.updateCharts(data);
            this.updateRecentExpenses(data.gastos_mes);
            
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            this.showToast('Erro ao carregar dados do dashboard', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    updateDashboardCards(data) {
        document.getElementById('totalGasto').textContent = this.formatCurrency(data.total_gasto);
        document.getElementById('economiaPotencial').textContent = this.formatCurrency(data.economia_potencial);
        document.getElementById('rendaMensalCard').textContent = this.formatCurrency(data.renda_mensal);
    }
    
    updateCharts(data) {
        this.updateCategoryChart(data.gastos_categoria);
        this.updateEvolutionChart(data.gastos_mes);
    }
    
    updateCategoryChart(gastos_categoria) {
        // Verifica se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            this.createFallbackCategoryChart(gastos_categoria);
            return;
        }

        const ctx = document.getElementById('graficoCategoria').getContext('2d');
        
        if (this.charts.categoria) {
            this.charts.categoria.destroy();
        }
        
        // Se não há dados, mostra mensagem
        if (!gastos_categoria || Object.keys(gastos_categoria).length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhum gasto registrado', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }
        
        const labels = Object.keys(gastos_categoria).map(cat => this.formatCategoryName(cat));
        const values = Object.values(gastos_categoria);
        const colors = [
            '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#607D8B'
        ];
        
        // Define tamanho do canvas
        ctx.canvas.width = 300;
        ctx.canvas.height = 300;
        
        try {
            this.charts.categoria = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1,
                layout: {
                    padding: 10
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label;
                                const value = this.formatCurrency(context.raw);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('Erro ao criar gráfico de categoria:', error);
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Erro ao carregar gráfico', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
    }
    
    updateEvolutionChart(gastos_mes) {
        // Verifica se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            this.createFallbackEvolutionChart(gastos_mes);
            return;
        }
        const ctx = document.getElementById('graficoEvolucao').getContext('2d');
        
        if (this.charts.evolucao) {
            this.charts.evolucao.destroy();
        }
        
        // Se não há dados, mostra mensagem
        if (!gastos_mes || gastos_mes.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhum gasto registrado', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }
        
        // Agrupa gastos por dia
        const gastosPorDia = {};
        gastos_mes.forEach(gasto => {
            const data = new Date(gasto.data).toLocaleDateString('pt-BR');
            if (!gastosPorDia[data]) {
                gastosPorDia[data] = 0;
            }
            gastosPorDia[data] += parseFloat(gasto.valor);
        });
        
        const labels = Object.keys(gastosPorDia).sort();
        const values = labels.map(label => gastosPorDia[label]);
        
        // Define tamanho do canvas
        ctx.canvas.width = 400;
        ctx.canvas.height = 200;
        
        try {
            this.charts.evolucao = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Gastos Diários',
                    data: values,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2,
                layout: {
                    padding: 10
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Gastos: ${this.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: (value) => this.formatCurrency(value),
                            maxTicksLimit: 5
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('Erro ao criar gráfico de evolução:', error);
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Erro ao carregar gráfico', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
    }
    
    updateRecentExpenses(gastos) {
        const container = document.getElementById('listaGastosRecentes');
        container.innerHTML = '';
        
        if (!gastos || gastos.length === 0) {
            container.innerHTML = '<p class="text-center">Nenhum gasto registrado ainda.</p>';
            return;
        }
        
        const gastosRecentes = gastos.slice(-5).reverse();
        
        gastosRecentes.forEach(gasto => {
            const item = document.createElement('div');
            item.className = 'expense-item';
            
            const data = new Date(gasto.data).toLocaleDateString('pt-BR');
            const categoria = this.formatCategoryName(gasto.categoria);
            
            item.innerHTML = `
                <div class="expense-info">
                    <div class="expense-description">${gasto.descricao}</div>
                    <div class="expense-category">${categoria}</div>
                </div>
                <div class="expense-details">
                    <div class="expense-value">${this.formatCurrency(gasto.valor)}</div>
                    <div class="expense-date">${data}</div>
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    // Adicionar gasto
    async handleAdicionarGasto() {
        const valor = parseFloat(document.getElementById('valorGasto').value);
        const categoria = document.getElementById('categoriaGasto').value;
        const descricao = document.getElementById('descricaoGasto').value;
        const ehImpulsivo = document.getElementById('gastoImpulsivo').checked;
        
        if (!valor || !categoria || !descricao) {
            this.showToast('Preencha todos os campos obrigatórios', 'warning');
            return;
        }
        
        const gasto = {
            valor: valor,
            categoria: ehImpulsivo ? 'nao_essencial' : categoria,
            descricao: descricao,
            eh_impulsivo: ehImpulsivo
        };
        
        const success = await this.saveGasto(gasto);
        if (success) {
            this.hideModal('modalGasto');
            document.getElementById('formGasto').reset();
        }
    }
    
    // Chat
    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.lang = 'pt-BR';
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('chatInput').value = transcript;
                this.sendChatMessage();
            };
            
            this.recognition.onerror = (event) => {
                console.error('Erro no reconhecimento de voz:', event.error);
                this.showToast('Erro no reconhecimento de voz', 'error');
                this.stopRecording();
            };
            
            this.recognition.onend = () => {
                this.stopRecording();
            };
        }
    }
    
    toggleAudioRecording() {
        if (!this.recognition) {
            this.showToast('Reconhecimento de voz não suportado', 'warning');
            return;
        }
        
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    startRecording() {
        this.isRecording = true;
        document.getElementById('btnGravarAudio').classList.add('recording');
        this.recognition.start();
        this.showToast('Gravando... Fale agora!', 'success');
    }
    
    stopRecording() {
        this.isRecording = false;
        document.getElementById('btnGravarAudio').classList.remove('recording');
        if (this.recognition) {
            this.recognition.stop();
        }
    }
    
    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Adiciona mensagem do usuário
        this.addChatMessage(message, 'user');
        input.value = '';
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensagem: message })
            });
            
            const result = await response.json();
            
            // Adiciona resposta do bot
            this.addChatMessage(result.resposta, 'bot');
            
            // Se um gasto foi detectado, atualiza o dashboard
            if (result.gasto_detectado) {
                await this.loadDashboard();
            }
            
        } catch (error) {
            console.error('Erro no chat:', error);
            this.addChatMessage('Desculpe, ocorreu um erro. Tente novamente.', 'bot');
        }
    }
    
    addChatMessage(message, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Relatórios
    async loadReports() {
        await this.loadGastos();
        this.updateReportsTable();
        this.updateReportsStats();
    }
    
    updateReportsTable() {
        const tbody = document.getElementById('corpoTabelaGastos');
        tbody.innerHTML = '';
        
        let gastosFiltrados = [...this.gastos];
        
        // Filtro por mês
        const filtroMes = document.getElementById('filtroMes').value;
        if (filtroMes !== 'todos') {
            const hoje = new Date();
            const mesAtual = hoje.getMonth();
            const anoAtual = hoje.getFullYear();
            
            gastosFiltrados = gastosFiltrados.filter(gasto => {
                const dataGasto = new Date(gasto.data);
                if (filtroMes === 'atual') {
                    return dataGasto.getMonth() === mesAtual && dataGasto.getFullYear() === anoAtual;
                } else if (filtroMes === 'anterior') {
                    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
                    const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
                    return dataGasto.getMonth() === mesAnterior && dataGasto.getFullYear() === anoAnterior;
                }
            });
        }
        
        // Filtro por categoria
        const filtroCategoria = document.getElementById('filtroCategoria').value;
        if (filtroCategoria !== 'todas') {
            gastosFiltrados = gastosFiltrados.filter(gasto => gasto.categoria === filtroCategoria);
        }
        
        // Ordena por data (mais recente primeiro)
        gastosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        gastosFiltrados.forEach(gasto => {
            const row = document.createElement('tr');
            const data = new Date(gasto.data).toLocaleDateString('pt-BR');
            const categoria = this.formatCategoryName(gasto.categoria);
            const tipo = gasto.eh_impulsivo ? 'Impulsivo' : 'Normal';
            
            row.innerHTML = `
                <td>${data}</td>
                <td>${gasto.descricao}</td>
                <td><span class="category-badge category-${gasto.categoria}">${categoria}</span></td>
                <td>${this.formatCurrency(gasto.valor)}</td>
                <td>${tipo}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        if (gastosFiltrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum gasto encontrado</td></tr>';
        }
    }
    
    updateReportsStats() {
        const total = this.gastos.reduce((sum, gasto) => sum + parseFloat(gasto.valor), 0);
        const impulsivos = this.gastos.filter(g => g.eh_impulsivo).reduce((sum, gasto) => sum + parseFloat(gasto.valor), 0);
        const media = this.gastos.length > 0 ? total / this.gastos.length : 0;
        
        // Categoria principal
        const categorias = {};
        this.gastos.forEach(gasto => {
            const cat = gasto.categoria;
            if (!categorias[cat]) categorias[cat] = 0;
            categorias[cat] += parseFloat(gasto.valor);
        });
        
        const categoriaPrincipal = Object.keys(categorias).reduce((a, b) => 
            categorias[a] > categorias[b] ? a : b, 'Nenhuma'
        );
        
        document.getElementById('statTotalGastos').textContent = this.formatCurrency(total);
        document.getElementById('statGastosImpulsivos').textContent = this.formatCurrency(impulsivos);
        document.getElementById('statMediaGasto').textContent = this.formatCurrency(media);
        document.getElementById('statCategoriaPrincipal').textContent = this.formatCategoryName(categoriaPrincipal);
    }
    
    async generatePDFReport() {
        this.showLoading();
        
        try {
            const response = await fetch('/api/relatorio/pdf');
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'relatorio_walletcare.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showToast('Relatório PDF gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.showToast('Erro ao gerar relatório PDF', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // Investimentos
    async loadInvestments() {
        this.showLoading();
        
        try {
            const response = await fetch('/api/investimentos');
            const data = await response.json();
            
            document.getElementById('capacidadeInvestimento').textContent = 
                this.formatCurrency(data.sugestao_investimento);
            document.getElementById('sobraMensal').textContent = 
                this.formatCurrency(data.sobra_mensal);
            
            this.updateInvestmentTips(data.dicas);
            
        } catch (error) {
            console.error('Erro ao carregar investimentos:', error);
            this.showToast('Erro ao carregar dados de investimento', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    updateInvestmentTips(dicas) {
        const container = document.getElementById('dicasEconomia');
        container.innerHTML = '';
        
        dicas.forEach(dica => {
            const item = document.createElement('div');
            item.className = 'tip-item';
            item.textContent = dica;
            container.appendChild(item);
        });
    }
    
    simulateInvestment() {
        const valor = parseFloat(document.getElementById('valorInvestir').value);
        const periodo = parseInt(document.getElementById('periodoInvestimento').value);
        const taxa = parseFloat(document.getElementById('taxaJuros').value) / 100;
        
        if (!valor || !periodo || !taxa) {
            this.showToast('Preencha todos os campos da simulação', 'warning');
            return;
        }
        
        // Cálculo de juros compostos
        const valorFinal = valor * Math.pow(1 + taxa, periodo);
        const rendimento = valorFinal - valor;
        
        document.getElementById('valorFinal').textContent = this.formatCurrency(valorFinal);
        document.getElementById('rendimento').textContent = this.formatCurrency(rendimento);
        document.getElementById('resultadoSimulacao').style.display = 'block';
    }
    
    // Utilitários
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }
    
    formatCategoryName(category) {
        const names = {
            'alimentacao': 'Alimentação',
            'jogos': 'Jogos',
            'bebidas': 'Bebidas',
            'entretenimento': 'Entretenimento',
            'outros': 'Outros',
            'nao_essencial': 'Não Essencial'
        };
        return names[category] || category;
    }
    
    updateCurrentMonth() {
        const now = new Date();
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        const currentMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        document.getElementById('mesAtual').textContent = currentMonth;
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }
    
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
    
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Gráficos de fallback (CSS puro)
    createFallbackCategoryChart(gastos_categoria) {
        const container = document.getElementById('graficoCategoria').parentElement.parentElement;
        
        if (!gastos_categoria || Object.keys(gastos_categoria).length === 0) {
            container.innerHTML = '<h3>Gastos por Categoria</h3><p style="text-align: center; padding: 40px; color: #666;">Nenhum gasto registrado ainda</p>';
            return;
        }
        
        const total = Object.values(gastos_categoria).reduce((a, b) => a + b, 0);
        const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#607D8B'];
        
        let html = '<h3>Gastos por Categoria</h3><div style="padding: 20px;">';
        
        Object.entries(gastos_categoria).forEach(([categoria, valor], index) => {
            const percentage = ((valor / total) * 100).toFixed(1);
            const categoryName = this.formatCategoryName(categoria);
            const color = colors[index % colors.length];
            
            html += `
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-weight: 500;">${categoryName}</span>
                        <span style="font-weight: 600; color: ${color};">${this.formatCurrency(valor)} (${percentage}%)</span>
                    </div>
                    <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    createFallbackEvolutionChart(gastos_mes) {
        const container = document.getElementById('graficoEvolucao').parentElement.parentElement;
        
        if (!gastos_mes || gastos_mes.length === 0) {
            container.innerHTML = '<h3>Evolução Diária</h3><p style="text-align: center; padding: 40px; color: #666;">Nenhum gasto registrado ainda</p>';
            return;
        }
        
        // Agrupa gastos por dia
        const gastosPorDia = {};
        gastos_mes.forEach(gasto => {
            const data = new Date(gasto.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (!gastosPorDia[data]) {
                gastosPorDia[data] = 0;
            }
            gastosPorDia[data] += parseFloat(gasto.valor);
        });
        
        const maxValue = Math.max(...Object.values(gastosPorDia));
        
        let html = '<h3>Evolução Diária</h3><div style="padding: 20px;">';
        
        Object.entries(gastosPorDia).slice(-7).forEach(([data, valor]) => {
            const height = (valor / maxValue) * 100;
            
            html += `
                <div style="display: inline-block; width: 12%; margin-right: 2%; text-align: center; vertical-align: bottom;">
                    <div style="height: 150px; display: flex; align-items: end; justify-content: center;">
                        <div style="background: #4CAF50; width: 100%; height: ${height}%; min-height: 5px; border-radius: 4px 4px 0 0; transition: height 0.3s ease;"></div>
                    </div>
                    <div style="font-size: 0.8rem; margin-top: 5px; color: #666;">${data}</div>
                    <div style="font-size: 0.9rem; font-weight: 600; color: #4CAF50;">${this.formatCurrency(valor)}</div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    // Configurações
    async loadSettings() {
        await this.loadConfig();
        await this.loadGastos();
        
        // Atualiza renda atual
        document.getElementById('rendaAtual').textContent = this.formatCurrency(this.config.renda_mensal);
        
        // Atualiza estatísticas
        this.updateSettingsStats();
        
        // Atualiza tema ativo
        this.updateThemeButtons();
    }
    
    updateSettingsStats() {
        const totalGastos = this.gastos.length;
        document.getElementById('totalGastosRegistrados').textContent = totalGastos;
        
        if (totalGastos > 0) {
            // Primeiro registro
            const primeiro = this.gastos.reduce((prev, curr) => 
                new Date(prev.data) < new Date(curr.data) ? prev : curr
            );
            document.getElementById('primeiroRegistro').textContent = 
                new Date(primeiro.data).toLocaleDateString('pt-BR');
            
            // Último registro
            const ultimo = this.gastos.reduce((prev, curr) => 
                new Date(prev.data) > new Date(curr.data) ? prev : curr
            );
            document.getElementById('ultimoRegistro').textContent = 
                new Date(ultimo.data).toLocaleDateString('pt-BR');
        } else {
            document.getElementById('primeiroRegistro').textContent = '-';
            document.getElementById('ultimoRegistro').textContent = '-';
        }
    }
    
    updateThemeButtons() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const isLight = !currentTheme || currentTheme !== 'dark';
        
        document.getElementById('btnTemaClaro').classList.toggle('active', isLight);
        document.getElementById('btnTemaEscuro').classList.toggle('active', !isLight);
    }
    
    async salvarRendaMensal() {
        const novaRenda = parseFloat(document.getElementById('novaRendaMensal').value);
        
        if (isNaN(novaRenda) || novaRenda < 0) {
            this.showToast('Digite um valor válido para a renda', 'warning');
            return;
        }
        
        const success = await this.saveConfig({ renda_mensal: novaRenda });
        if (success) {
            document.getElementById('rendaAtual').textContent = this.formatCurrency(novaRenda);
            document.getElementById('novaRendaMensal').value = '';
            this.showToast('Renda mensal atualizada com sucesso!', 'success');
        }
    }
    
    validarConfirmacao(texto) {
        const btnConfirmar = document.getElementById('btnConfirmarReset');
        const isValid = texto.toUpperCase() === 'RESETAR';
        btnConfirmar.disabled = !isValid;
        
        if (isValid) {
            btnConfirmar.classList.add('btn-danger');
        } else {
            btnConfirmar.classList.remove('btn-danger');
        }
    }
    
    async resetarGastos() {
        this.showLoading();
        
        try {
            const response = await fetch('/api/reset-gastos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_id: this.deviceId })
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                this.gastos = [];
                this.hideModal('modalConfirmReset');
                document.getElementById('confirmText').value = '';
                document.getElementById('btnConfirmarReset').disabled = true;
                
                this.showToast('Todos os gastos foram resetados!', 'success');
                
                // Atualiza todas as telas
                await this.loadDashboard();
                this.updateSettingsStats();
            } else {
                this.showToast('Erro ao resetar gastos: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao resetar gastos:', error);
            this.showToast('Erro ao resetar gastos', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async alterarTema(novoTema) {
        this.applyTheme(novoTema);
        await this.saveConfig({ tema: novoTema });
        this.updateThemeButtons();
        this.showToast(`Tema ${novoTema === 'dark' ? 'escuro' : 'claro'} aplicado!`, 'success');
    }
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.walletCare = new WalletCare();
});
