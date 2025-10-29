import re
import json
from datetime import datetime

class AnalisadorFinanceiro:
    def __init__(self):
        self.categorias = {
            'alimentacao': ['lanche', 'comida', 'restaurante', 'pizza', 'hamburguer', 'almoço', 'jantar', 'café', 'padaria', 'mercado', 'supermercado'],
            'jogos': ['jogo', 'game', 'steam', 'playstation', 'xbox', 'nintendo', 'mobile', 'app'],
            'bebidas': ['cerveja', 'refrigerante', 'suco', 'água', 'bebida', 'bar', 'drink', 'whisky', 'vodka'],
            'entretenimento': ['cinema', 'filme', 'show', 'teatro', 'netflix', 'spotify', 'youtube', 'streaming'],
            'outros': ['roupa', 'sapato', 'remedio', 'farmacia', 'transporte', 'uber', 'gasolina', 'conta'],
            'nao_essencial': ['impulso', 'desnecessario', 'besteira', 'bobagem', 'capricho']
        }
        
        self.padroes_valor = [
            r'r\$\s*(\d+(?:,\d{2})?)',  # R$ 25,00 ou R$ 25
            r'(\d+(?:,\d{2})?)\s*reais?',  # 25 reais
            r'(\d+(?:,\d{2})?)\s*r\$',  # 25 R$
            r'gastei\s+(\d+(?:,\d{2})?)',  # gastei 25
            r'comprei.*?(\d+(?:,\d{2})?)',  # comprei por 25
        ]
    
    def extrair_valor(self, texto):
        """Extrai valor monetário do texto"""
        texto = texto.lower()
        
        for padrao in self.padroes_valor:
            match = re.search(padrao, texto)
            if match:
                valor_str = match.group(1)
                # Converte vírgula para ponto
                valor_str = valor_str.replace(',', '.')
                try:
                    return float(valor_str)
                except ValueError:
                    continue
        
        return None
    
    def identificar_categoria(self, texto):
        """Identifica a categoria do gasto baseado no texto"""
        texto = texto.lower()
        
        # Verifica palavras-chave para cada categoria
        for categoria, palavras in self.categorias.items():
            for palavra in palavras:
                if palavra in texto:
                    return categoria
        
        # Se não encontrou categoria específica, retorna 'outros'
        return 'outros'
    
    def detectar_gasto_impulsivo(self, texto):
        """Detecta se o gasto pode ser impulsivo/desnecessário"""
        texto = texto.lower()
        
        palavras_impulsivas = [
            'impulso', 'vontade', 'desejo', 'capricho', 'besteira',
            'desnecessario', 'bobagem', 'sem precisar', 'por impulso'
        ]
        
        for palavra in palavras_impulsivas:
            if palavra in texto:
                return True
        
        return False
    
    def processar_mensagem(self, mensagem):
        """Processa mensagem do chat e extrai informações financeiras"""
        valor = self.extrair_valor(mensagem)
        
        if valor is None:
            return {
                "gasto_detectado": False,
                "resposta": "Não consegui identificar um valor na sua mensagem. Pode repetir com o valor? Ex: 'Gastei R$ 25 com lanche'"
            }
        
        categoria = self.identificar_categoria(mensagem)
        eh_impulsivo = self.detectar_gasto_impulsivo(mensagem)
        
        # Se detectou como impulsivo, muda categoria
        if eh_impulsivo:
            categoria = 'nao_essencial'
        
        gasto = {
            "valor": valor,
            "categoria": categoria,
            "descricao": mensagem.strip(),
            "eh_impulsivo": eh_impulsivo
        }
        
        # Gera resposta motivacional
        resposta = self.gerar_resposta_motivacional(gasto)
        
        return {
            "gasto_detectado": True,
            "gasto": gasto,
            "resposta": resposta
        }
    
    def gerar_resposta_motivacional(self, gasto):
        """Gera resposta motivacional baseada no gasto"""
        valor = gasto['valor']
        categoria = gasto['categoria']
        eh_impulsivo = gasto['eh_impulsivo']
        
        if eh_impulsivo or categoria == 'nao_essencial':
            return f"💸 Gasto de R$ {valor:.2f} registrado como não essencial. Que tal pensar duas vezes na próxima? Pequenas economias fazem grande diferença! 💪"
        
        elif categoria == 'alimentacao':
            if valor > 30:
                return f"🍽️ R$ {valor:.2f} em alimentação registrado! Valor um pouco alto - que tal cozinhar mais em casa para economizar? 👨‍🍳"
            else:
                return f"🍽️ R$ {valor:.2f} em alimentação registrado! Gasto controlado, parabéns! 👏"
        
        elif categoria == 'entretenimento':
            return f"🎬 R$ {valor:.2f} em entretenimento registrado! É importante se divertir, mas sempre com moderação! 😊"
        
        elif categoria == 'jogos':
            if valor > 50:
                return f"🎮 R$ {valor:.2f} em jogos registrado! Valor alto - lembre-se de equilibrar diversão e economia! ⚖️"
            else:
                return f"🎮 R$ {valor:.2f} em jogos registrado! Diversão controlada! 🎯"
        
        else:
            return f"💰 Gasto de R$ {valor:.2f} registrado na categoria {categoria}. Continue acompanhando seus gastos! 📊"
    
    def analisar_padrao_gastos(self, gastos):
        """Analisa padrão de gastos e gera insights"""
        if not gastos:
            return {"insights": ["Ainda não há gastos para analisar"]}
        
        total = sum(float(g.get('valor', 0)) for g in gastos)
        gastos_impulsivos = [g for g in gastos if g.get('eh_impulsivo', False)]
        total_impulsivo = sum(float(g.get('valor', 0)) for g in gastos_impulsivos)
        
        insights = []
        
        if total_impulsivo > 0:
            percentual = (total_impulsivo / total) * 100
            insights.append(f"🚨 {percentual:.1f}% dos seus gastos foram impulsivos (R$ {total_impulsivo:.2f})")
        
        # Análise por categoria
        categorias = {}
        for gasto in gastos:
            cat = gasto.get('categoria', 'outros')
            if cat not in categorias:
                categorias[cat] = 0
            categorias[cat] += float(gasto.get('valor', 0))
        
        categoria_maior = max(categorias.items(), key=lambda x: x[1])
        insights.append(f"📊 Sua maior categoria de gastos é {categoria_maior[0]} (R$ {categoria_maior[1]:.2f})")
        
        if total > 1000:
            insights.append("⚠️ Gastos altos este mês. Considere revisar seu orçamento!")
        elif total < 500:
            insights.append("✅ Gastos controlados este mês. Parabéns!")
        
        return {"insights": insights}
