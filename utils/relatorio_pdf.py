from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.linecharts import HorizontalLineChart
import os
from datetime import datetime
import tempfile

class GeradorRelatorio:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.titulo_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#2E7D32')
        )
        
    def criar_grafico_pizza(self, dados_categoria):
        """Cria gráfico de pizza para gastos por categoria"""
        if not dados_categoria:
            return None
            
        drawing = Drawing(400, 200)
        pie = Pie()
        pie.x = 50
        pie.y = 50
        pie.width = 150
        pie.height = 150
        
        # Dados do gráfico
        categorias = list(dados_categoria.keys())
        valores = list(dados_categoria.values())
        
        pie.data = valores
        pie.labels = [f"{cat}\nR$ {val:.2f}" for cat, val in zip(categorias, valores)]
        
        # Cores para cada categoria
        cores = [
            colors.HexColor('#4CAF50'),  # Verde
            colors.HexColor('#2196F3'),  # Azul
            colors.HexColor('#FF9800'),  # Laranja
            colors.HexColor('#9C27B0'),  # Roxo
            colors.HexColor('#F44336'),  # Vermelho
            colors.HexColor('#607D8B')   # Cinza azulado
        ]
        
        pie.slices.strokeColor = colors.white
        pie.slices.strokeWidth = 2
        
        for i, cor in enumerate(cores[:len(valores)]):
            pie.slices[i].fillColor = cor
            
        drawing.add(pie)
        return drawing
    
    def criar_tabela_gastos(self, gastos):
        """Cria tabela com todos os gastos"""
        if not gastos:
            return Table([["Nenhum gasto registrado"]])
        
        # Cabeçalho da tabela
        dados_tabela = [['Data', 'Descrição', 'Categoria', 'Valor']]
        
        # Ordena gastos por data (mais recente primeiro)
        gastos_ordenados = sorted(gastos, key=lambda x: x.get('data', ''), reverse=True)
        
        for gasto in gastos_ordenados:
            data = datetime.fromisoformat(gasto.get('data', '')).strftime('%d/%m/%Y')
            descricao = gasto.get('descricao', '')[:50] + ('...' if len(gasto.get('descricao', '')) > 50 else '')
            categoria = gasto.get('categoria', 'outros').replace('_', ' ').title()
            valor = f"R$ {float(gasto.get('valor', 0)):.2f}"
            
            dados_tabela.append([data, descricao, categoria, valor])
        
        tabela = Table(dados_tabela, colWidths=[1.2*inch, 3*inch, 1.5*inch, 1*inch])
        
        # Estilo da tabela
        estilo_tabela = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4CAF50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (3, 1), (3, -1), 'RIGHT'),  # Alinha valores à direita
        ])
        
        tabela.setStyle(estilo_tabela)
        return tabela
    
    def calcular_estatisticas(self, gastos, config):
        """Calcula estatísticas dos gastos"""
        if not gastos:
            return {}
        
        total_gastos = sum(float(g.get('valor', 0)) for g in gastos)
        
        # Gastos por categoria
        categorias = {}
        gastos_impulsivos = 0
        
        for gasto in gastos:
            categoria = gasto.get('categoria', 'outros')
            valor = float(gasto.get('valor', 0))
            
            if categoria not in categorias:
                categorias[categoria] = 0
            categorias[categoria] += valor
            
            if gasto.get('eh_impulsivo', False) or categoria == 'nao_essencial':
                gastos_impulsivos += valor
        
        renda = config.get('renda_mensal', 0)
        economia_potencial = gastos_impulsivos
        sobra = renda - total_gastos if renda > 0 else 0
        
        return {
            'total_gastos': total_gastos,
            'categorias': categorias,
            'gastos_impulsivos': gastos_impulsivos,
            'economia_potencial': economia_potencial,
            'renda_mensal': renda,
            'sobra_mensal': sobra,
            'num_gastos': len(gastos)
        }
    
    def gerar_relatorio_completo(self, dados, config):
        """Gera relatório completo em PDF"""
        # Cria arquivo temporário
        arquivo_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        nome_arquivo = arquivo_temp.name
        arquivo_temp.close()
        
        # Cria documento PDF
        doc = SimpleDocTemplate(
            nome_arquivo,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Lista para armazenar elementos do PDF
        elementos = []
        
        # Título
        titulo = Paragraph("WalletCare - Relatório Financeiro", self.titulo_style)
        elementos.append(titulo)
        elementos.append(Spacer(1, 20))
        
        # Data do relatório
        data_relatorio = Paragraph(
            f"<b>Data do Relatório:</b> {datetime.now().strftime('%d/%m/%Y às %H:%M')}",
            self.styles['Normal']
        )
        elementos.append(data_relatorio)
        elementos.append(Spacer(1, 20))
        
        # Calcula estatísticas
        stats = self.calcular_estatisticas(dados['gastos'], config)
        
        if stats:
            # Resumo financeiro
            resumo_titulo = Paragraph("<b>Resumo Financeiro</b>", self.styles['Heading2'])
            elementos.append(resumo_titulo)
            elementos.append(Spacer(1, 12))
            
            resumo_dados = [
                ['Renda Mensal:', f"R$ {stats['renda_mensal']:.2f}"],
                ['Total de Gastos:', f"R$ {stats['total_gastos']:.2f}"],
                ['Gastos Impulsivos:', f"R$ {stats['gastos_impulsivos']:.2f}"],
                ['Economia Potencial:', f"R$ {stats['economia_potencial']:.2f}"],
                ['Sobra do Mês:', f"R$ {stats['sobra_mensal']:.2f}"],
                ['Número de Gastos:', str(stats['num_gastos'])]
            ]
            
            tabela_resumo = Table(resumo_dados, colWidths=[2.5*inch, 1.5*inch])
            tabela_resumo.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E8F5E8')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ]))
            
            elementos.append(tabela_resumo)
            elementos.append(Spacer(1, 30))
            
            # Gráfico de gastos por categoria
            if stats['categorias']:
                grafico_titulo = Paragraph("<b>Gastos por Categoria</b>", self.styles['Heading2'])
                elementos.append(grafico_titulo)
                elementos.append(Spacer(1, 12))
                
                grafico = self.criar_grafico_pizza(stats['categorias'])
                if grafico:
                    elementos.append(grafico)
                    elementos.append(Spacer(1, 30))
        
        # Tabela detalhada de gastos
        gastos_titulo = Paragraph("<b>Detalhamento de Gastos</b>", self.styles['Heading2'])
        elementos.append(gastos_titulo)
        elementos.append(Spacer(1, 12))
        
        tabela_gastos = self.criar_tabela_gastos(dados['gastos'])
        elementos.append(tabela_gastos)
        elementos.append(Spacer(1, 30))
        
        # Insights e recomendações
        insights_titulo = Paragraph("<b>Insights e Recomendações</b>", self.styles['Heading2'])
        elementos.append(insights_titulo)
        elementos.append(Spacer(1, 12))
        
        if stats and stats['gastos_impulsivos'] > 0:
            percentual_impulsivo = (stats['gastos_impulsivos'] / stats['total_gastos']) * 100
            insight1 = Paragraph(
                f"• <b>{percentual_impulsivo:.1f}%</b> dos seus gastos foram impulsivos ou desnecessários.",
                self.styles['Normal']
            )
            elementos.append(insight1)
        
        if stats and stats['sobra_mensal'] > 0:
            insight2 = Paragraph(
                f"• Você tem uma <b>sobra mensal de R$ {stats['sobra_mensal']:.2f}</b>. Considere investir 70% deste valor.",
                self.styles['Normal']
            )
            elementos.append(insight2)
        elif stats and stats['sobra_mensal'] < 0:
            insight2 = Paragraph(
                f"• <b>Atenção!</b> Seus gastos excederam a renda em R$ {abs(stats['sobra_mensal']):.2f}.",
                self.styles['Normal']
            )
            elementos.append(insight2)
        
        insight3 = Paragraph(
            "• Revise regularmente seus gastos para identificar oportunidades de economia.",
            self.styles['Normal']
        )
        elementos.append(insight3)
        
        insight4 = Paragraph(
            "• Mantenha o controle diário dos gastos para melhores resultados financeiros.",
            self.styles['Normal']
        )
        elementos.append(insight4)
        
        # Rodapé
        elementos.append(Spacer(1, 50))
        rodape = Paragraph(
            "<i>Relatório gerado pelo WalletCare - Seu assistente financeiro pessoal</i>",
            self.styles['Normal']
        )
        elementos.append(rodape)
        
        # Constrói o PDF
        doc.build(elementos)
        
        return nome_arquivo
