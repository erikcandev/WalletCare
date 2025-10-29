from flask import Flask, render_template, request, jsonify, send_file
import json
import os
from datetime import datetime, date
from utils.analisador import AnalisadorFinanceiro
from utils.relatorio_pdf import GeradorRelatorio

app = Flask(__name__)

# Configuração para dados offline
DATA_DIR = 'data'
FINANCAS_FILE = os.path.join(DATA_DIR, 'financas.json')
CONFIG_FILE = os.path.join(DATA_DIR, 'config.json')

def get_device_files(device_id):
    """Retorna os caminhos dos arquivos específicos do dispositivo"""
    device_dir = os.path.join(DATA_DIR, device_id)
    if not os.path.exists(device_dir):
        os.makedirs(device_dir)
    
    financas_file = os.path.join(device_dir, 'financas.json')
    config_file = os.path.join(device_dir, 'config.json')
    
    return financas_file, config_file

def inicializar_dados_dispositivo(device_id):
    """Inicializa os arquivos de dados para um dispositivo específico"""
    financas_file, config_file = get_device_files(device_id)
    
    if not os.path.exists(financas_file):
        dados_iniciais = {
            "gastos": [],
            "categorias": ["alimentacao", "jogos", "bebidas", "entretenimento", "outros", "nao_essencial"]
        }
        with open(financas_file, 'w', encoding='utf-8') as f:
            json.dump(dados_iniciais, f, ensure_ascii=False, indent=2)
    
    if not os.path.exists(config_file):
        config_inicial = {
            "renda_mensal": 0,
            "primeiro_acesso": True,
            "tema": "claro",
            "meta_mensal": 0
        }
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config_inicial, f, ensure_ascii=False, indent=2)

def inicializar_dados():
    """Inicializa o diretório de dados"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def carregar_dados(device_id):
    """Carrega dados do arquivo JSON do dispositivo"""
    financas_file, _ = get_device_files(device_id)
    with open(financas_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def salvar_dados(dados, device_id):
    """Salva dados no arquivo JSON do dispositivo"""
    financas_file, _ = get_device_files(device_id)
    with open(financas_file, 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

def carregar_config(device_id):
    """Carrega configurações do dispositivo"""
    _, config_file = get_device_files(device_id)
    with open(config_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def salvar_config(config, device_id):
    """Salva configurações do dispositivo"""
    _, config_file = get_device_files(device_id)
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    """Página principal do aplicativo"""
    inicializar_dados()
    return render_template('index.html')

@app.route('/api/config', methods=['GET', 'POST'])
def api_config():
    """API para gerenciar configurações"""
    if request.method == 'GET':
        device_id = request.args.get('device_id')
        if not device_id:
            return jsonify({"error": "device_id required"}), 400
        
        inicializar_dados_dispositivo(device_id)
        return jsonify(carregar_config(device_id))
    
    elif request.method == 'POST':
        dados = request.json
        device_id = dados.get('device_id')
        
        if not device_id:
            return jsonify({"error": "device_id required"}), 400
        
        inicializar_dados_dispositivo(device_id)
        config = carregar_config(device_id)
        
        if 'renda_mensal' in dados:
            config['renda_mensal'] = float(dados['renda_mensal'])
        if 'primeiro_acesso' in dados:
            config['primeiro_acesso'] = dados['primeiro_acesso']
        if 'tema' in dados:
            config['tema'] = dados['tema']
        if 'meta_mensal' in dados:
            config['meta_mensal'] = float(dados['meta_mensal'])
        
        salvar_config(config, device_id)
        return jsonify({"status": "success", "config": config})

@app.route('/api/gastos', methods=['GET', 'POST'])
def api_gastos():
    """API para gerenciar gastos"""
    if request.method == 'GET':
        device_id = request.args.get('device_id')
        if not device_id:
            return jsonify({"error": "device_id required"}), 400
        
        inicializar_dados_dispositivo(device_id)
        dados = carregar_dados(device_id)
        return jsonify(dados['gastos'])
    
    elif request.method == 'POST':
        novo_gasto = request.json
        device_id = novo_gasto.get('device_id')
        
        if not device_id:
            return jsonify({"error": "device_id required"}), 400
        
        inicializar_dados_dispositivo(device_id)
        dados = carregar_dados(device_id)
        
        # Remove device_id do gasto antes de salvar
        novo_gasto.pop('device_id', None)
        
        # Adiciona timestamp se não existir
        if 'data' not in novo_gasto:
            novo_gasto['data'] = datetime.now().isoformat()
        
        # Adiciona ID único
        novo_gasto['id'] = len(dados['gastos']) + 1
        
        dados['gastos'].append(novo_gasto)
        salvar_dados(dados, device_id)
        
        return jsonify({"status": "success", "gasto": novo_gasto})

@app.route('/api/chat', methods=['POST'])
def api_chat():
    """API para processar mensagens do chat"""
    dados_chat = request.json
    mensagem = dados_chat.get('mensagem', '')
    
    analisador = AnalisadorFinanceiro()
    resposta = analisador.processar_mensagem(mensagem)
    
    # Se a mensagem contém um gasto, salva automaticamente
    if resposta.get('gasto_detectado'):
        dados = carregar_dados()
        gasto = resposta['gasto']
        gasto['id'] = len(dados['gastos']) + 1
        gasto['data'] = datetime.now().isoformat()
        dados['gastos'].append(gasto)
        salvar_dados(dados)
    
    return jsonify(resposta)

@app.route('/api/dashboard')
def api_dashboard():
    """API para dados do dashboard"""
    dados = carregar_dados()
    config = carregar_config()
    
    # Filtrar gastos do mês atual
    mes_atual = datetime.now().month
    ano_atual = datetime.now().year
    
    gastos_mes = []
    for gasto in dados['gastos']:
        data_gasto = datetime.fromisoformat(gasto['data'])
        if data_gasto.month == mes_atual and data_gasto.year == ano_atual:
            gastos_mes.append(gasto)
    
    # Calcular totais por categoria
    totais_categoria = {}
    total_gasto = 0
    gastos_nao_essenciais = 0
    
    for gasto in gastos_mes:
        categoria = gasto.get('categoria', 'outros')
        valor = float(gasto.get('valor', 0))
        
        if categoria not in totais_categoria:
            totais_categoria[categoria] = 0
        totais_categoria[categoria] += valor
        total_gasto += valor
        
        if categoria == 'nao_essencial':
            gastos_nao_essenciais += valor
    
    # Calcular potencial de economia
    economia_potencial = gastos_nao_essenciais
    
    # Dados para gráficos
    dashboard_data = {
        "total_gasto": total_gasto,
        "gastos_categoria": totais_categoria,
        "economia_potencial": economia_potencial,
        "gastos_mes": gastos_mes,
        "renda_mensal": config.get('renda_mensal', 0)
    }
    
    return jsonify(dashboard_data)

@app.route('/api/investimentos')
def api_investimentos():
    """API para sugestões de investimento"""
    dados = carregar_dados()
    config = carregar_config()
    
    # Calcular gastos do mês
    mes_atual = datetime.now().month
    ano_atual = datetime.now().year
    
    total_gastos = 0
    for gasto in dados['gastos']:
        data_gasto = datetime.fromisoformat(gasto['data'])
        if data_gasto.month == mes_atual and data_gasto.year == ano_atual:
            total_gastos += float(gasto.get('valor', 0))
    
    renda = config.get('renda_mensal', 0)
    sobra = renda - total_gastos
    
    # Sugestão conservadora: 70% da sobra para investimento
    sugestao_investimento = max(0, sobra * 0.7)
    
    investimentos_data = {
        "renda_mensal": renda,
        "gastos_totais": total_gastos,
        "sobra_mensal": sobra,
        "sugestao_investimento": sugestao_investimento,
        "dicas": [
            "Revise gastos não essenciais para aumentar sua capacidade de investimento",
            "Considere investimentos de baixo risco como Tesouro Direto",
            "Mantenha uma reserva de emergência antes de investir",
            "Diversifique seus investimentos para reduzir riscos"
        ]
    }
    
    return jsonify(investimentos_data)

@app.route('/api/relatorio/pdf')
def gerar_relatorio_pdf():
    """Gera relatório em PDF"""
    dados = carregar_dados()
    config = carregar_config()
    
    gerador = GeradorRelatorio()
    arquivo_pdf = gerador.gerar_relatorio_completo(dados, config)
    
    return send_file(arquivo_pdf, as_attachment=True, download_name='relatorio_walletcare.pdf')

@app.route('/api/reset-gastos', methods=['POST'])
def reset_gastos():
    """Reseta todos os gastos"""
    try:
        dados = request.json
        device_id = dados.get('device_id')
        
        if not device_id:
            return jsonify({"error": "device_id required"}), 400
        
        # Reinicializa o arquivo de gastos do dispositivo
        dados_iniciais = {
            "gastos": [],
            "categorias": ["alimentacao", "jogos", "bebidas", "entretenimento", "outros", "nao_essencial"]
        }
        salvar_dados(dados_iniciais, device_id)
        
        return jsonify({"status": "success", "message": "Gastos resetados com sucesso"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/manifest.json')
def manifest():
    """Manifest do PWA"""
    return {
        "name": "WalletCare",
        "short_name": "WalletCare",
        "description": "Aplicativo de controle financeiro pessoal",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#4CAF50",
        "icons": [
            {
                "src": "/static/icon-192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "/static/icon-512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    }

if __name__ == '__main__':
    inicializar_dados()
    # Configuração para aceitar conexões de qualquer IP na rede local
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
