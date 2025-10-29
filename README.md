# WalletCare - Controle Financeiro PWA

## Descrição
WalletCare é um aplicativo Progressive Web App (PWA) para controle financeiro pessoal, desenvolvido com Python Flask e tecnologias web modernas. O app funciona 100% offline e oferece recursos avançados como chat inteligente, análise de gastos e geração de relatórios.

## Funcionalidades

### 🏠 Dashboard
- Resumo financeiro mensal
- Gráficos interativos (pizza e linha)
- Cards com totais e economia potencial
- Lista de gastos recentes

### 💬 Chat Financeiro
- Interface estilo WhatsApp
- Reconhecimento de voz (Web Speech API)
- Processamento inteligente de mensagens
- Registro automático de gastos via chat

### 📊 Relatórios
- Tabela detalhada de todos os gastos
- Filtros por mês e categoria
- Estatísticas resumidas
- Geração de PDF para exportação

### 💰 Investimentos
- Cálculo de capacidade de investimento
- Dicas personalizadas de economia
- Simulador de investimentos
- Análise de sobra mensal

## Tecnologias Utilizadas

### Backend
- **Python 3.8+**
- **Flask** - Framework web
- **ReportLab** - Geração de PDFs
- **JSON** - Banco de dados local

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização moderna
- **JavaScript ES6+** - Interatividade
- **Chart.js** - Gráficos
- **Font Awesome** - Ícones

### PWA
- **Service Worker** - Cache offline
- **Web App Manifest** - Instalação
- **Web Speech API** - Reconhecimento de voz

## Instalação e Execução

### 1. Pré-requisitos
```bash
Python 3.8 ou superior
pip (gerenciador de pacotes Python)
```

### 2. Instalação
```bash
# Clone ou baixe o projeto
cd WalletCare

# Instale as dependências
pip install -r requirements.txt
```

### 3. Execução
```bash
# Execute o servidor Flask
python app.py

# Acesse no navegador
http://localhost:5000
```

### 4. Instalação como PWA
1. Abra o app no navegador mobile
2. Toque no menu do navegador
3. Selecione "Adicionar à tela inicial"
4. O app será instalado como aplicativo nativo


## Uso do Aplicativo

### Primeiro Acesso
1. Defina sua renda mensal (opcional)
2. O app funcionará normalmente mesmo sem renda definida

### Registrando Gastos
**Via Chat:**
- "Acabei de comprar um lanche, R$ 25"
- "Gastei 50 reais no cinema"
- "Comprei um jogo por R$ 80"

**Via Formulário:**
- Clique em "Adicionar Gasto"
- Preencha valor, categoria e descrição
- Marque se foi um gasto impulsivo

### Categorias Disponíveis
- **Alimentação** - Comidas, restaurantes, mercado
- **Jogos** - Games, aplicativos, entretenimento digital
- **Bebidas** - Bebidas alcoólicas e não alcoólicas
- **Entretenimento** - Cinema, shows, streaming
- **Outros** - Roupas, remédios, transporte
- **Não Essencial** - Gastos impulsivos ou desnecessários

### Análise Inteligente
O app identifica automaticamente:
- Gastos impulsivos baseado em palavras-chave
- Categorias através do contexto da mensagem
- Padrões de consumo e oportunidades de economia

## Recursos Offline

### Armazenamento Local
- Todos os dados salvos em arquivos JSON
- Funciona sem conexão com internet
- Sincronização automática quando online

### Cache Inteligente
- Service Worker cacheia recursos essenciais
- Carregamento instantâneo após primeira visita
- Atualizações automáticas quando disponíveis

## Personalização

### Temas
- **Claro** - Interface clara e moderna
- **Escuro** - Ideal para uso noturno
- Alternância automática via botão no header

### Configurações
- Renda mensal personalizável
- Metas de gastos (futuro)
- Preferências de notificação (futuro)

## Relatórios e Exportação

### Relatório PDF
- Resumo financeiro completo
- Gráficos e tabelas detalhadas
- Insights e recomendações
- Download direto pelo navegador

### Estatísticas Incluídas
- Total de gastos por período
- Gastos por categoria
- Identificação de gastos impulsivos
- Potencial de economia
- Sugestões de investimento

## Compatibilidade

### Navegadores Suportados
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Dispositivos
- **Mobile** - iOS 13+, Android 8+
- **Desktop** - Windows, macOS, Linux
- **Tablet** - iPadOS, Android tablets

### Recursos Opcionais
- **Reconhecimento de Voz** - Disponível em navegadores compatíveis
- **Instalação PWA** - Suportado na maioria dos navegadores modernos

### Dados Locais
- Todos os dados ficam no dispositivo
- Nenhuma informação enviada para servidores externos
- Controle total sobre seus dados financeiros

### Estrutura de Desenvolvimento
- **Backend** - Flask com APIs RESTful
- **Frontend** - Vanilla JavaScript (sem frameworks)
- **Dados** - JSON para simplicidade e portabilidade

## Roadmap Futuro

### Versão 2.0
- [ ] Sincronização em nuvem opcional
- [ ] Metas de gastos personalizáveis
- [ ] Notificações push
- [ ] Mais tipos de gráficos
- [ ] Exportação para Excel
- [ ] Categorias personalizáveis

### Melhorias Técnicas
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] API documentation

