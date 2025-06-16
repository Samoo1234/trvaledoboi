import jsPDF from 'jspdf';
import { FechamentoDetalhado } from './fechamentoService';

export class PDFService {
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  private async addLogo(doc: jsPDF, x: number, y: number, width: number, height: number): Promise<void> {
    try {
      // Tentar carregar a logo
      const response = await fetch('/assets/images/logo.png');
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        
        return new Promise((resolve) => {
          reader.onload = function(e) {
            if (e.target?.result) {
              try {
                doc.addImage(e.target.result as string, 'PNG', x, y, width, height);
              } catch (error) {
                console.log('Erro ao adicionar logo no PDF:', error);
              }
            }
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.log('Logo não encontrada, continuando sem logo:', error);
    }
  }

  private drawTable(doc: jsPDF, startY: number, headers: string[], data: string[][], colWidths: number[]): number {
    const startX = 20;
    let currentY = startY;
    const rowHeight = 8;
    const headerHeight = 10;

    // Desenhar cabeçalho
    doc.setFillColor(139, 0, 0); // Cor vermelha
    doc.setTextColor(255, 255, 255); // Texto branco
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    let currentX = startX;
    for (let i = 0; i < headers.length; i++) {
      doc.rect(currentX, currentY, colWidths[i], headerHeight, 'F');
      doc.text(headers[i], currentX + 2, currentY + 7);
      currentX += colWidths[i];
    }

    currentY += headerHeight;

    // Desenhar dados
    doc.setTextColor(0, 0, 0); // Texto preto
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    for (let row = 0; row < data.length; row++) {
      currentX = startX;
      
      // Alternar cor de fundo das linhas
      if (row % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
      }

      for (let col = 0; col < data[row].length; col++) {
        // Desenhar borda da célula
        doc.setDrawColor(200, 200, 200);
        doc.rect(currentX, currentY, colWidths[col], rowHeight);
        
        // Adicionar texto
        const text = data[row][col] || '';
        // Alinhar valores monetários à direita
        if (text.includes('R$')) {
          doc.text(text, currentX + colWidths[col] - 5, currentY + 6, { align: 'right' });
        } else {
          doc.text(text, currentX + 2, currentY + 6);
        }
        
        currentX += colWidths[col];
      }
      currentY += rowHeight;
    }

    return currentY;
  }

  async gerarRelatorioFechamento(fechamento: FechamentoDetalhado): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Configurar fonte
    doc.setFont('helvetica');
    
    // Adicionar logo (se existir)
    await this.addLogo(doc, 20, 10, 30, 30);
    
    // Cabeçalho da empresa
    doc.setFontSize(20);
    doc.setTextColor(139, 0, 0); // Cor vermelha
    doc.text('SISTEMA LOGÍSTICA', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Fechamento - Motorista', pageWidth / 2, 30, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(139, 0, 0);
    doc.line(20, 35, pageWidth - 20, 35);
    
    // Informações do motorista
    let yPos = 50;
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('DADOS DO MOTORISTA', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Nome: ${fechamento.motorista?.nome || 'N/A'}`, 20, yPos);
    yPos += 8;
    doc.text(`Tipo: ${fechamento.motorista?.tipo_motorista || 'N/A'}`, 20, yPos);
    yPos += 8;
    doc.text(`Período: ${fechamento.periodo}`, 20, yPos);
    yPos += 8;
    doc.text(`Data do Fechamento: ${this.formatDate(fechamento.data_fechamento || new Date().toISOString())}`, 20, yPos);
    
    // Resumo financeiro
    yPos += 20;
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('RESUMO FINANCEIRO', 20, yPos);
    
    yPos += 15;
    
    // Tabela resumo
    const resumoData = [
      ['Total de Fretes', fechamento.total_fretes.toString()],
      ['Valor Bruto Total', this.formatCurrency(fechamento.valor_bruto)],
      ['Percentual de Comissão', fechamento.motorista?.tipo_motorista === 'Terceiro' ? '90%' : '10%'],
      ['Valor da Comissão', this.formatCurrency(fechamento.valor_comissao)],
      ['Descontos', this.formatCurrency(fechamento.descontos)],
      ['Valor Líquido a Receber', this.formatCurrency(fechamento.valor_liquido)],
      ['Status', fechamento.status]
    ];
    
    const finalYResumo = this.drawTable(
      doc, 
      yPos, 
      ['Descrição', 'Valor'], 
      resumoData, 
      [100, 80]
    );
    
    // Detalhamento dos fretes
    let finalYFretes = finalYResumo;
    if (fechamento.fretes && fechamento.fretes.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('DETALHAMENTO DOS FRETES', 20, finalYResumo + 20);
      
      const fretesData = fechamento.fretes.map(frete => [
        this.formatDate(frete.data_emissao),
        frete.origem,
        frete.destino,
        this.formatCurrency(frete.valor_frete),
        this.formatCurrency(frete.valor_comissao)
      ]);
      
      finalYFretes = this.drawTable(
        doc,
        finalYResumo + 30,
        ['Data', 'Origem', 'Destino', 'Valor Frete', 'Comissão'],
        fretesData,
        [25, 45, 45, 30, 30]
      );
    }
    
    // Rodapé
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Relatório gerado automaticamente pelo Sistema Logística', pageWidth / 2, pageHeight - 20, { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Observações se houver
    if (fechamento.observacoes) {
      const observacoesY = finalYFretes + 20;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Observações:', 20, observacoesY);
      doc.text(fechamento.observacoes, 20, observacoesY + 10);
    }
    
    // Nome do arquivo
    const nomeArquivo = `fechamento_${fechamento.motorista?.nome.replace(/\s+/g, '_')}_${fechamento.periodo.replace('/', '_')}.pdf`;
    
    // Download do PDF
    doc.save(nomeArquivo);
  }

  async gerarRelatorioConsolidado(fechamentos: any[], periodo: string): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Cabeçalho
    doc.setFont('helvetica');
    
    // Adicionar logo (se existir)
    await this.addLogo(doc, 20, 10, 30, 30);
    
    doc.setFontSize(20);
    doc.setTextColor(139, 0, 0);
    doc.text('SISTEMA LOGÍSTICA', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Relatório Consolidado - ${periodo}`, pageWidth / 2, 30, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(139, 0, 0);
    doc.line(20, 35, pageWidth - 20, 35);
    
    // Resumo geral
    const totalMotoristas = fechamentos.length;
    const totalFretes = fechamentos.reduce((sum, f) => sum + f.total_fretes, 0);
    const valorBrutoTotal = fechamentos.reduce((sum, f) => sum + f.valor_bruto, 0);
    const totalComissoes = fechamentos.reduce((sum, f) => sum + f.valor_comissao, 0);
    
    let yPos = 50;
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('RESUMO GERAL', 20, yPos);
    
    yPos += 15;
    const resumoGeral = [
      ['Total de Motoristas', totalMotoristas.toString()],
      ['Total de Fretes', totalFretes.toString()],
      ['Valor Bruto Total', this.formatCurrency(valorBrutoTotal)],
      ['Total de Comissões', this.formatCurrency(totalComissoes)]
    ];
    
    const finalYResumoGeral = this.drawTable(
      doc,
      yPos,
      ['Descrição', 'Valor'],
      resumoGeral,
      [100, 80]
    );
    
    // Detalhamento por motorista
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('DETALHAMENTO POR MOTORISTA', 20, finalYResumoGeral + 20);
    
    const motoristasData = fechamentos.map(fechamento => [
      fechamento.motorista?.nome || 'N/A',
      fechamento.motorista?.tipo_motorista || 'N/A',
      fechamento.total_fretes.toString(),
      this.formatCurrency(fechamento.valor_bruto),
      this.formatCurrency(fechamento.valor_comissao),
      this.formatCurrency(fechamento.valor_liquido),
      fechamento.status
    ]);
    
    this.drawTable(
      doc,
      finalYResumoGeral + 30,
      ['Motorista', 'Tipo', 'Fretes', 'Valor Bruto', 'Comissão', 'Líquido', 'Status'],
      motoristasData,
      [40, 20, 15, 25, 25, 25, 20]
    );
    
    // Rodapé
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Relatório gerado automaticamente pelo Sistema Logística', pageWidth / 2, pageHeight - 20, { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Nome do arquivo
    const nomeArquivo = `relatorio_consolidado_${periodo.replace('/', '_')}.pdf`;
    
    // Download do PDF
    doc.save(nomeArquivo);
  }
}

export const pdfService = new PDFService(); 