import jsPDF from 'jspdf';
import { FechamentoDetalhado } from './fechamentoService';
import { formatDisplayDate } from './dateUtils';
import { valeService } from './valeService';

export class PDFService {
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private formatDate(dateString: string): string {
    // Usar função do dateUtils para evitar problemas de fuso horário
    return formatDisplayDate(dateString);
  }

  private drawFretesTableLikeAcerto(doc: jsPDF, startY: number, fretes: any[], pageHeight: number): number {
    const headers = ['Data', 'Tipo Veículo', 'Placa', 'Origem', 'Destino', 'KM', 'Valor'];
    const colWidths = [22, 25, 20, 38, 38, 17, 28]; // Total: 188mm - melhor distribuição
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const pageWidth = 210; // Largura do papel A4
    const startX = (pageWidth - totalWidth) / 2; // Centralizar na página = 11mm
    console.log(`[PDF DEBUG] Centralizando tabela: startX=${startX}, totalWidth=${totalWidth}`);
    let currentY = startY;
    
    // Cabeçalho da tabela
    doc.setFillColor(139, 0, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    let currentX = startX;
    headers.forEach((header, i) => {
      // Garantir que a cor de fundo está sendo aplicada
      doc.setFillColor(139, 0, 0);
      doc.rect(currentX, currentY, colWidths[i], 10, 'F');
      
      // Garantir que a cor do texto está branca
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      
      doc.text(header, currentX + colWidths[i]/2, currentY + 7, { align: 'center' });
      currentX += colWidths[i];
    });
    
    currentY += 10;
    
    // Dados dos fretes
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    fretes.forEach((frete, index) => {
      // Verificar quebra de página (com mais margem de segurança)
      if (currentY + 20 > pageHeight - 40) {
        doc.addPage();
        currentY = 20;
        
        // Redesenhar cabeçalho na nova página
        doc.setFillColor(139, 0, 0);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        currentX = startX;
        headers.forEach((header, i) => {
          // Garantir que a cor de fundo está sendo aplicada
          doc.setFillColor(139, 0, 0);
          doc.rect(currentX, currentY, colWidths[i], 10, 'F');
          
          // Garantir que a cor do texto está branca
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          
          doc.text(header, currentX + colWidths[i]/2, currentY + 7, { align: 'center' });
          currentX += colWidths[i];
        });
        
        currentY += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }
      
      // Alternar cor de fundo
      if (index % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(startX, currentY, totalWidth, 8, 'F');
      }
      
      const rowData = [
        this.formatDate(frete.data_emissao).substring(0, 5), // Apenas DD/MM
        frete.caminhao?.tipo || 'N/A', // Tipo veículo do caminhão
        frete.caminhao?.placa || 'N/A', // Placa do caminhão
        frete.origem.length > 17 ? frete.origem.substring(0, 17) + '...' : frete.origem,
        frete.destino.length > 17 ? frete.destino.substring(0, 17) + '...' : frete.destino,
        frete.total_km ? frete.total_km.toString() : '-',
        this.formatCurrency(frete.valor_frete)
      ];
      
      currentX = startX;
      rowData.forEach((data, i) => {
        // Desenhar borda da célula
        doc.setDrawColor(200, 200, 200);
        doc.rect(currentX, currentY, colWidths[i], 8);
        
        // Texto - todos centralizados
        doc.text(data, currentX + colWidths[i]/2, currentY + 6, { align: 'center' });
        
        currentX += colWidths[i];
      });
      
      currentY += 8;
    });
    
    return currentY;
  }

  private drawAbastecimentosTable(doc: jsPDF, startY: number, abastecimentos: any[], pageHeight: number): number {
    const headers = ['Data', 'Posto', 'Combust.', 'Qt Litros', 'Valor'];
    const colWidths = [25, 45, 25, 25, 35];
    let currentY = startY;

    // Função para desenhar cabeçalho em uma posição específica
    const drawHeader = (yPosition: number): number => {
      let currentX = 20;
      doc.setFillColor(139, 0, 0);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      headers.forEach((header, i) => {
        // Garantir que a cor de fundo está sendo aplicada
        doc.setFillColor(139, 0, 0);
        doc.rect(currentX, yPosition, colWidths[i], 10, 'F');
        
        // Garantir que a cor do texto está branca
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        
        doc.text(header, currentX + colWidths[i]/2, yPosition + 7, { align: 'center' });
        currentX += colWidths[i];
      });
      return yPosition + 10; // Retorna a nova posição Y
    };

    // Verificar se há espaço suficiente para cabeçalho + pelo menos uma linha
    if (currentY + 30 > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    // Desenhar cabeçalho inicial
    currentY = drawHeader(currentY);
    
    // Dados dos abastecimentos
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    abastecimentos.forEach((abastecimento, index) => {
      // Verificar quebra de página ANTES de desenhar a linha
      if (currentY + 8 + 20 > pageHeight - 40) {
        doc.addPage();
        currentY = 20;
        
        // Redesenhar cabeçalho na nova página
        currentY = drawHeader(currentY);
        
        // Reconfigurar fonte para dados após redesenhar cabeçalho
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }
      
      // Alternar cor de fundo
      if (index % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, currentY, colWidths.reduce((a, b) => a + b, 0), 8, 'F');
      }
      
      const rowData = [
        this.formatDate(abastecimento.data_abastecimento).substring(0, 5), // Apenas DD/MM
        (abastecimento.posto_tanque || '').substring(0, 12),
        abastecimento.combustivel.substring(0, 8),
        abastecimento.quantidade_litros ? abastecimento.quantidade_litros.toFixed(0) + 'L' : '-',
        abastecimento.preco_total ? this.formatCurrency(abastecimento.preco_total) : '-'
      ];
      
      let currentX = 20;
      rowData.forEach((data, i) => {
        // Desenhar borda da célula
        doc.setDrawColor(200, 200, 200);
        doc.rect(currentX, currentY, colWidths[i], 8);
        
        // Texto - todos centralizados
        doc.text(data, currentX + colWidths[i]/2, currentY + 6, { align: 'center' });
        
        currentX += colWidths[i];
      });
      
      currentY += 8;
    });
    
    return currentY;
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
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 30;
    
    console.log(`[PDF DEBUG] Iniciando tabela com ${data.length} linhas`);

    // Função para desenhar cabeçalho em uma posição específica
    const drawHeader = (yPosition: number): number => {
      let currentX = startX;
      doc.setFillColor(139, 0, 0); // Cor vermelha
      doc.setTextColor(255, 255, 255); // Texto branco
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      for (let i = 0; i < headers.length; i++) {
        doc.rect(currentX, yPosition, colWidths[i], headerHeight, 'F');
        doc.text(headers[i], currentX + 2, yPosition + 7);
        currentX += colWidths[i];
      }
      return yPosition + headerHeight; // Retorna a nova posição Y
    };

    // Desenhar cabeçalho inicial
    currentY = drawHeader(currentY);

    // Configurar para desenhar dados
    doc.setTextColor(0, 0, 0); // Texto preto
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Desenhar cada linha de dados
    for (let row = 0; row < data.length; row++) {
      console.log(`[PDF DEBUG] Processando linha ${row + 1} de ${data.length} - Y atual: ${currentY}`);
      
      // Verificar se precisa quebrar página ANTES de desenhar a linha
      if (currentY + rowHeight + marginBottom > pageHeight) {
        console.log(`[PDF DEBUG] Quebra de página na linha ${row + 1}`);
        doc.addPage();
        currentY = 20; // Reset para topo da nova página
        currentY = drawHeader(currentY); // Redesenhar cabeçalho e atualizar Y
        console.log(`[PDF DEBUG] Nova página criada, cabeçalho redesenhado - novo Y: ${currentY}`);
        
        // Reconfigurar fonte para dados após redesenhar cabeçalho
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      }

      let currentX = startX;
      
      // Alternar cor de fundo das linhas (zebrado)
      if (row % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
      }

      // Desenhar cada célula da linha
      for (let col = 0; col < data[row].length; col++) {
        // Desenhar borda da célula
        doc.setDrawColor(200, 200, 200);
        doc.rect(currentX, currentY, colWidths[col], rowHeight);
        
        // Adicionar texto na célula
        const text = data[row][col] || '';
        if (text.includes('R$')) {
          // Alinhar valores monetários à direita
          doc.text(text, currentX + colWidths[col] - 5, currentY + 6, { align: 'right' });
        } else {
          // Alinhar texto à esquerda
          doc.text(text, currentX + 2, currentY + 6);
        }
        
        currentX += colWidths[col];
      }
      
      // Avançar para próxima linha
      currentY += rowHeight;
      console.log(`[PDF DEBUG] Linha ${row + 1} desenhada - próximo Y: ${currentY}`);
    }

    console.log(`[PDF DEBUG] Tabela finalizada. ${data.length} linhas processadas`);
    return currentY;
  }

  async gerarRelatorioFechamento(fechamento: FechamentoDetalhado): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Configurar fonte
    doc.setFont('helvetica');
    
    // Adicionar logo
    await this.addLogo(doc, 20, 10, 30, 30);
    
    // Cabeçalho da empresa
    doc.setFontSize(20);
    doc.setTextColor(139, 0, 0); // Cor vermelha
    doc.text('VALE DO BOI', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('Transporte de Bovinos', pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Fechamento - Motorista', pageWidth / 2, 38, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(139, 0, 0);
    doc.line(20, 43, pageWidth - 20, 43);
    
    // Informações do motorista
    let yPos = 58;
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
    // Sempre usar a data atual real para a data do fechamento no PDF
    const dataAtualFechamento = new Date();
    const dataFechamentoFormatada = `${dataAtualFechamento.getDate().toString().padStart(2, '0')}/${(dataAtualFechamento.getMonth() + 1).toString().padStart(2, '0')}/${dataAtualFechamento.getFullYear()}`;
    console.log(`[PDF DEBUG] Data do fechamento: ${dataFechamentoFormatada} (data real atual)`);
    doc.text(`Data do Fechamento: ${dataFechamentoFormatada}`, 20, yPos);
    
    // Resumo financeiro
    yPos += 20;
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('RESUMO FINANCEIRO', 20, yPos);
    
    yPos += 15;
    
    // Buscar vales do período para motoristas terceiros
    let totalValesPeriodo = 0;
    if (fechamento.motorista?.tipo_motorista === 'Terceiro' && fechamento.motorista_id) {
      try {
        // Usar o período do fechamento (formato MM/YYYY)
        totalValesPeriodo = await valeService.getTotalByMotoristaAndPeriodo(fechamento.motorista_id, fechamento.periodo);
        console.log(`[PDF DEBUG] === COMPARAÇÃO DE VALORES PARA TERCEIROS ===`);
        console.log(`[PDF DEBUG] Motorista: ${fechamento.motorista?.nome}`);
        console.log(`[PDF DEBUG] Período: ${fechamento.periodo}`);
        console.log(`[PDF DEBUG] Descontos/Abastecimentos (fechamento.descontos): ${fechamento.descontos}`);
        console.log(`[PDF DEBUG] Vales do período (totalValesPeriodo): ${totalValesPeriodo}`);
        console.log(`[PDF DEBUG] Agora são diferentes? ${fechamento.descontos !== totalValesPeriodo}`);
      } catch (error) {
        console.warn('[PDF DEBUG] Erro ao buscar vales do período:', error);
        totalValesPeriodo = 0;
      }
    }
    
    // Montar dados do resumo financeiro
    const resumoData = [
      ['Total de Fretes', fechamento.total_fretes.toString()],
      ['Valor Bruto Total', this.formatCurrency(fechamento.valor_bruto)],
      [fechamento.motorista?.tipo_motorista === 'Terceiro' ? 'Percentual de Comissão Transportadora' : 'Percentual de Comissão',
        fechamento.motorista?.porcentagem_comissao
          ? (fechamento.motorista?.tipo_motorista === 'Terceiro' 
              ? `${100 - fechamento.motorista.porcentagem_comissao}%` 
              : `${fechamento.motorista.porcentagem_comissao}%`)
          : (fechamento.motorista?.tipo_motorista === 'Terceiro' ? '10%' : '10%')
      ],
      ['Valor Líquido Total', this.formatCurrency(fechamento.valor_comissao)],
      [fechamento.motorista?.tipo_motorista === 'Terceiro' ? 'Descontos/Abastecimentos' : 'Vales/Adiantamentos', 
       this.formatCurrency(fechamento.descontos)]
    ];
    
    // Adicionar linha de vales apenas para motoristas terceiros
    if (fechamento.motorista?.tipo_motorista === 'Terceiro') {
      resumoData.push(['Desconto vale / despesas', this.formatCurrency(totalValesPeriodo)]);
    }
    
    if (fechamento.bonus && fechamento.bonus > 0) {
      resumoData.push(['Bonificação', this.formatCurrency(fechamento.bonus)]);
    }
    resumoData.push([
      'Valor Líquido a Receber',
      this.formatCurrency(fechamento.valor_liquido)
    ]);
    // Remover linha de Status conforme solicitado
    
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
      console.log(`[PDF DEBUG] Processando ${fechamento.fretes.length} fretes para o PDF`);
      
      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('DETALHAMENTO DOS FRETES', 20, finalYResumo + 20);
      
      // Implementar tabela igual ao relatório de acerto
      finalYFretes = this.drawFretesTableLikeAcerto(
        doc,
        finalYResumo + 30,
        fechamento.fretes,
        doc.internal.pageSize.getHeight()
      );
    } else {
      console.log(`[PDF DEBUG] Nenhum frete encontrado para exibir`);
    }

    // Detalhamento dos abastecimentos (apenas para terceiros)
    let finalYAbastecimentos = finalYFretes;
    if (fechamento.motorista?.tipo_motorista === 'Terceiro' && fechamento.abastecimentos && fechamento.abastecimentos.length > 0) {
      console.log(`[PDF DEBUG] Processando ${fechamento.abastecimentos.length} abastecimentos para o PDF`);
      
      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('DETALHAMENTO DE ABASTECIMENTO', 20, finalYFretes + 20);
      
      finalYAbastecimentos = this.drawAbastecimentosTable(
        doc,
        finalYFretes + 30,
        fechamento.abastecimentos,
        doc.internal.pageSize.getHeight()
      );
    }
    
    // Rodapé
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Relatório gerado automaticamente pelo Sistema Logística', pageWidth / 2, pageHeight - 20, { align: 'center' });
    // Usar formatação manual para evitar problemas de fuso horário
    const agora = new Date();
    const dataHora = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()} ${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
    doc.text(`Gerado em: ${dataHora}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Observações se houver
    if (fechamento.observacoes) {
      const observacoesY = finalYAbastecimentos + 20;
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
    
    // Adicionar logo
    await this.addLogo(doc, 20, 10, 30, 30);
    
    doc.setFontSize(20);
    doc.setTextColor(139, 0, 0);
    doc.text('VALE DO BOI', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('Transporte de Bovinos', pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Relatório Consolidado - ${periodo}`, pageWidth / 2, 38, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(139, 0, 0);
    doc.line(20, 43, pageWidth - 20, 43);
    
    // Resumo geral
    const totalMotoristas = fechamentos.length;
    const totalFretes = fechamentos.reduce((sum, f) => sum + f.total_fretes, 0);
    const valorBrutoTotal = fechamentos.reduce((sum, f) => sum + f.valor_bruto, 0);
    const totalComissoes = fechamentos.reduce((sum, f) => sum + f.valor_comissao, 0);
    
    let yPos = 58;
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
    // Usar formatação manual para evitar problemas de fuso horário
    const agoraConsolidado = new Date();
    const dataHoraConsolidado = `${agoraConsolidado.getDate().toString().padStart(2, '0')}/${(agoraConsolidado.getMonth() + 1).toString().padStart(2, '0')}/${agoraConsolidado.getFullYear()} ${agoraConsolidado.getHours().toString().padStart(2, '0')}:${agoraConsolidado.getMinutes().toString().padStart(2, '0')}`;
    doc.text(`Gerado em: ${dataHoraConsolidado}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Nome do arquivo
    const nomeArquivo = `relatorio_consolidado_${periodo.replace('/', '_')}.pdf`;
    
    // Download do PDF
    doc.save(nomeArquivo);
  }
}

export const pdfService = new PDFService(); 