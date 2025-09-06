import jsPDF from 'jspdf';
import { FechamentoDetalhado } from './fechamentoService';
import { formatDisplayDate } from './dateUtils';
import { valeService } from './valeService';
import { supabase } from './supabaseClient';

interface FreteParaPDF {
  id: number;
  data_emissao: string;
  origem: string;
  destino: string;
  valor_frete: number;
  valor_individual_motorista?: number;
  total_km?: number;
  pecuarista?: string;
  caminhao?: {
    placa: string;
    tipo: string;
  };
}

interface ValeParaPDF {
  id: number;
  data_vale: string;
  valor: number;
  descricao: string;
  motorista?: {
    nome: string;
  };
}


interface AbastecimentoParaPDF {
  id: number;
  data_abastecimento: string;
  posto_tanque: string;
  combustivel: string;
  quantidade_litros: number;
  preco_total: number;
}

interface FechamentoParaPDF {
  id?: number;
  motorista_id: number;
  periodo: string;
  valor_bruto: number;
  valor_comissao: number;
  descontos: number;
  bonus: number;
  valor_liquido: number;
  total_fretes?: number;
  status?: string;
  motorista?: {
    nome: string;
    tipo_motorista: string;
  };
}

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

  private drawFretesTableLikeAcerto(doc: jsPDF, startY: number, fretes: FreteParaPDF[], pageHeight: number): number {
    const headers = ['Data', 'Cliente', 'Origem', 'Destino', 'KM', 'Valor'];
    const colWidths = [22, 35, 40, 40, 17, 34]; // Total: 188mm - 6 colunas redistribuídas
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const pageWidth = 210; // Largura do papel A4
    const startX = (pageWidth - totalWidth) / 2; // Centralizar na página = 11mm
    console.log(`[PDF DEBUG] Nova tabela de fretes: 6 colunas [Data|Cliente|Origem|Destino|KM|Valor]`);
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
      // Removida a lógica de quebra de página interna - a tabela será movida completamente
      
      // Alternar cor de fundo
      if (index % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(startX, currentY, totalWidth, 8, 'F');
      }
      
      // Usar sempre o valor individual do motorista (correto para viagens com múltiplos veículos)
      let valorIndividualFrete = frete.valor_individual_motorista || frete.valor_frete;
      
      // CORREÇÃO: Garantir que o valor individual seja usado corretamente
      // Se valor_individual_motorista não existir ou for inválido, usar valor_frete
      if (!valorIndividualFrete || valorIndividualFrete <= 0) {
        valorIndividualFrete = frete.valor_frete;
        console.warn(`[PDF DEBUG] Frete ${frete.id}: valor individual inválido (${frete.valor_individual_motorista}), usando valor total R$ ${frete.valor_frete}`);
      }
      
      // Validação adicional para valores suspeitos
      if (valorIndividualFrete > frete.valor_frete) {
        console.warn(`[PDF DEBUG] Frete ${frete.id}: valor individual (${valorIndividualFrete}) maior que valor total (${frete.valor_frete}), usando valor total`);
        valorIndividualFrete = frete.valor_frete;
      }
      
      console.log(`[PDF DEBUG] Frete ${frete.id}: valor individual R$ ${valorIndividualFrete} (valor total: R$ ${frete.valor_frete})`);
      
      const rowData = [
        this.formatDate(frete.data_emissao).substring(0, 5), // Apenas DD/MM
        frete.pecuarista && frete.pecuarista.length > 20 ? frete.pecuarista.substring(0, 20) + '...' : frete.pecuarista || 'N/A', // Cliente
        frete.origem.length > 22 ? frete.origem.substring(0, 22) + '...' : frete.origem,
        frete.destino.length > 22 ? frete.destino.substring(0, 22) + '...' : frete.destino,
        frete.total_km ? frete.total_km.toString() : '-',
        this.formatCurrency(valorIndividualFrete)
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

  private drawValesTable(doc: jsPDF, startY: number, vales: ValeParaPDF[], pageHeight: number): number {
    const headers = ['Data', 'Descrição', 'Valor'];
    const colWidths = [30, 100, 50]; // Total: 180mm
    const rowHeight = 8;

    const drawHeader = (yPosition: number, incluirTitulo: boolean = false): number => {
      let currentY = yPosition;
      
      // Se for quebra de página, incluir o título da seção
      if (incluirTitulo) {
        doc.setFontSize(14);
        doc.setTextColor(139, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALHAMENTO VALE/DESPESAS', 20, currentY);
        currentY += 15;
      }
      
      let currentX = 20;

      // Desenhar cabeçalho da tabela
      doc.setFillColor(139, 0, 0);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);

      for (let i = 0; i < headers.length; i++) {
        doc.rect(currentX, currentY, colWidths[i], rowHeight, 'F');
        doc.text(headers[i], currentX + colWidths[i] / 2, currentY + 5, { align: 'center' });
        currentX += colWidths[i];
      }

      currentY += rowHeight;
      return currentY;
    };

    let currentY = drawHeader(startY, false); // NÃO incluir título (já foi escrito na função principal)

    // Preparar dados dos vales
    const valesData = vales.map(vale => [
      this.formatDate(vale.data_vale),
      vale.descricao || '-',
      this.formatCurrency(vale.valor)
    ]);

    console.log(`[PDF DEBUG] Iniciando tabela de vales. ${valesData.length} linhas para processar`);

    // Desenhar linhas de dados
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    for (let row = 0; row < valesData.length; row++) {
      // Verificar se precisa de nova página
      if (currentY + rowHeight > pageHeight - 30) {
        console.log(`[PDF DEBUG] Quebra de página na linha ${row + 1} da tabela de vales`);
        doc.addPage();
        currentY = 20;
        currentY = drawHeader(currentY, true); // Incluir título na nova página
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      }

      let currentX = 20;
      
      // Alternar cor de fundo das linhas (zebrado)
      if (row % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(currentX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
      }

      // Desenhar cada célula da linha
      for (let col = 0; col < valesData[row].length; col++) {
        doc.setDrawColor(200, 200, 200);
        doc.rect(currentX, currentY, colWidths[col], rowHeight);
        
        const text = valesData[row][col] || '';
        if (text.includes('R$')) {
          doc.text(text, currentX + colWidths[col] - 5, currentY + 6, { align: 'right' });
        } else {
          doc.text(text, currentX + 2, currentY + 6);
        }
        
        currentX += colWidths[col];
      }
      
      currentY += rowHeight;
    }

    console.log(`[PDF DEBUG] Tabela de vales finalizada. ${valesData.length} linhas processadas`);
    return currentY;
  }

  private drawAbastecimentosTable(doc: jsPDF, startY: number, abastecimentos: AbastecimentoParaPDF[], pageHeight: number): number {
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
        
        return new Promise((resolve, reject) => {
          reader.onload = function(e) {
            try {
              if (e.target?.result) {
                doc.addImage(e.target.result as string, 'PNG', x, y, width, height);
                console.log('[PDF DEBUG] Logo adicionada com sucesso');
              }
              resolve();
            } catch (error) {
              console.warn('[PDF DEBUG] Erro ao adicionar logo no PDF:', error);
              resolve(); // Continuar sem logo em caso de erro
            }
          };
          
          reader.onerror = function() {
            console.warn('[PDF DEBUG] Erro ao ler arquivo de logo');
            resolve(); // Continuar sem logo em caso de erro
          };
          
          reader.readAsDataURL(blob);
        });
      } else {
        console.warn('[PDF DEBUG] Logo não encontrada (status:', response.status, ')');
      }
    } catch (error) {
      console.warn('[PDF DEBUG] Erro ao carregar logo, continuando sem logo:', error);
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
    try {
      console.log('[PDF DEBUG] Iniciando geração do PDF...');
      console.log('[PDF DEBUG] Fechamento recebido:', fechamento);
      console.log('[PDF DEBUG] Fretes:', fechamento.fretes);
      
      // Validar dados essenciais
      if (!fechamento) {
        throw new Error('Dados do fechamento não fornecidos');
      }
      
      if (!fechamento.motorista) {
        throw new Error('Dados do motorista não encontrados');
      }
      
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
    // Formatar período para exibição no relatório de fechamento
    let periodoExibicaoFechamento = fechamento.periodo;
    if (fechamento.periodo && fechamento.periodo.includes(' a ')) {
      const [inicio, fim] = fechamento.periodo.split(' a ');
      const dataInicioFormatada = new Date(inicio + 'T00:00:00').toLocaleDateString('pt-BR');
      const dataFimFormatada = new Date(fim + 'T00:00:00').toLocaleDateString('pt-BR');
      periodoExibicaoFechamento = `${dataInicioFormatada} a ${dataFimFormatada}`;
    }
    doc.text(`Período: ${periodoExibicaoFechamento}`, 20, yPos);
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
    
    // Calcular valor líquido a receber corretamente
    let valorLiquidoReceber = fechamento.valor_liquido;
    
    if (fechamento.motorista?.tipo_motorista === 'Terceiro') {
      // Para terceiros: comissão - abastecimentos - vales + bonus
      valorLiquidoReceber = fechamento.valor_comissao - fechamento.descontos - totalValesPeriodo + (fechamento.bonus || 0);
      console.log(`[PDF DEBUG] === CÁLCULO VALOR LÍQUIDO A RECEBER (TERCEIRO) ===`);
      console.log(`[PDF DEBUG] Comissão: ${fechamento.valor_comissao}`);
      console.log(`[PDF DEBUG] Abastecimentos: ${fechamento.descontos}`);
      console.log(`[PDF DEBUG] Vales: ${totalValesPeriodo}`);
      console.log(`[PDF DEBUG] Bônus: ${fechamento.bonus || 0}`);
      console.log(`[PDF DEBUG] Fórmula: ${fechamento.valor_comissao} - ${fechamento.descontos} - ${totalValesPeriodo} + ${fechamento.bonus || 0}`);
      console.log(`[PDF DEBUG] Resultado: ${valorLiquidoReceber}`);
    } else {
      // Para funcionários: usar valor já calculado (comissão - vales + bonus)
      console.log(`[PDF DEBUG] === VALOR LÍQUIDO A RECEBER (FUNCIONÁRIO) ===`);
      console.log(`[PDF DEBUG] Usando valor já calculado: ${valorLiquidoReceber}`);
    }
    
    resumoData.push([
      'Valor Líquido a Receber',
      this.formatCurrency(valorLiquidoReceber)
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
      
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Calcular espaço necessário para toda a tabela
      const tituloHeight = 20; // altura do título
      const headerHeight = 10; // altura do cabeçalho
      const rowHeight = 8; // altura de cada linha
      const totalTableHeight = tituloHeight + headerHeight + (fechamento.fretes.length * rowHeight);
      
      // Verificar se há espaço suficiente para a tabela COMPLETA
      let finalYResumoAjustado = finalYResumo;
      if (finalYResumoAjustado + totalTableHeight > pageHeight - 40) {
        console.log(`[PDF DEBUG] Não há espaço para tabela completa, movendo para nova página`);
        doc.addPage();
        finalYResumoAjustado = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('DETALHAMENTO DOS FRETES', 20, finalYResumoAjustado + 20);
      
      // Implementar tabela igual ao relatório de acerto (sem quebra interna)
      finalYFretes = this.drawFretesTableLikeAcerto(
        doc,
        finalYResumoAjustado + 30,
        fechamento.fretes,
        pageHeight
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

    // Detalhamento dos vales/despesas (para todos os tipos de motorista)
    let finalYVales = finalYAbastecimentos;
    if (fechamento.motorista_id) {
      try {
        // Buscar vales detalhados do período
        const valesDetalhados = await valeService.getByMotoristaAndPeriodo(fechamento.motorista_id, fechamento.periodo);
        
        if (valesDetalhados && valesDetalhados.length > 0) {
          console.log(`[PDF DEBUG] Processando ${valesDetalhados.length} vales para o PDF`);
          
          const pageHeight = doc.internal.pageSize.getHeight();
          
          // Verificar se há espaço suficiente para o título + cabeçalho + pelo menos uma linha
          if (finalYAbastecimentos + 50 > pageHeight - 40) {
            console.log(`[PDF DEBUG] Não há espaço para seção de vales, indo para nova página`);
            doc.addPage();
            finalYAbastecimentos = 20;
          }
          
          doc.setFontSize(14);
          doc.setTextColor(139, 0, 0);
          doc.text('DETALHAMENTO VALE/DESPESAS', 20, finalYAbastecimentos + 20);
          
          finalYVales = this.drawValesTable(
            doc,
            finalYAbastecimentos + 30,
            valesDetalhados.map((vale: any) => ({
              id: vale.id || 0,
              data_vale: vale.data_vale,
              valor: vale.valor,
              descricao: vale.descricao || '',
              motorista: vale.motorista ? { nome: vale.motorista.nome } : undefined
            })),
            pageHeight
          );
        }
      } catch (error) {
        console.warn('[PDF DEBUG] Erro ao buscar vales detalhados:', error);
      }
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
      const observacoesY = finalYVales + 20;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Observações:', 20, observacoesY);
      doc.text(fechamento.observacoes, 20, observacoesY + 10);
    }
    
    // Nome do arquivo
    const nomeArquivo = `fechamento_${fechamento.motorista?.nome.replace(/\s+/g, '_')}_${fechamento.periodo.replace('/', '_')}.pdf`;
    
    // Download do PDF
    doc.save(nomeArquivo);
    console.log('[PDF DEBUG] PDF gerado com sucesso!');
  } catch (error) {
    console.error('[PDF DEBUG] Erro detalhado ao gerar PDF:', error);
    
    // Verificar se é um erro específico do jsPDF
    if (error instanceof Error) {
      if (error.message.includes('Invalid coordinates')) {
        throw new Error('Erro de coordenadas inválidas no PDF. Verifique os dados do fechamento.');
      } else if (error.message.includes('Invalid image')) {
        throw new Error('Erro ao processar imagem no PDF. Verifique o arquivo de logo.');
      } else if (error.message.includes('Invalid font')) {
        throw new Error('Erro de fonte no PDF. Verifique a configuração de fontes.');
      } else {
        throw new Error(`Erro na geração do PDF: ${error.message}`);
      }
    } else {
      throw new Error('Erro desconhecido na geração do PDF');
    }
  }
  }

  async gerarRelatorioConsolidado(fechamentos: FechamentoParaPDF[], periodo: string): Promise<void> {
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
    const totalFretes = fechamentos.reduce((sum, f) => sum + (f.total_fretes || 0), 0);
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
    
    const motoristasData = fechamentos.map(fechamento => {
      // Calcular valor líquido corretamente para cada motorista na tabela
      let valorLiquidoFinal = fechamento.valor_liquido;
      
      if (fechamento.motorista?.tipo_motorista === 'Terceiro') {
        // Para terceiros: valor_liquido já está calculado corretamente (comissão - abastecimentos - vales + bonus)
        // Não precisa recalcular aqui pois já foi feito no fechamentoService
        valorLiquidoFinal = fechamento.valor_liquido;
      }
      
      return [
        fechamento.motorista?.nome || 'N/A',
        fechamento.motorista?.tipo_motorista || 'N/A',
        (fechamento.total_fretes || 0).toString(),
        this.formatCurrency(fechamento.valor_bruto),
        this.formatCurrency(fechamento.valor_comissao),
        this.formatCurrency(valorLiquidoFinal),
        fechamento.status || 'N/A'
      ];
    });
    
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

  // Novo método para gerar relatório consolidado por motorista específico
  async gerarRelatorioConsolidadoPorMotorista(fechamento: FechamentoDetalhado): Promise<void> {
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
    
    // Determinar título baseado no período
    let titulo = 'Relatório Consolidado - Motorista';
    if (fechamento.periodo && fechamento.periodo !== 'Histórico Completo') {
      // Se é um período específico (formato "YYYY-MM-DD a YYYY-MM-DD")
      if (fechamento.periodo.includes(' a ')) {
        const [inicio, fim] = fechamento.periodo.split(' a ');
        const dataInicioFormatada = new Date(inicio + 'T00:00:00').toLocaleDateString('pt-BR');
        const dataFimFormatada = new Date(fim + 'T00:00:00').toLocaleDateString('pt-BR');
        titulo = `Relatório Consolidado - Motorista (${dataInicioFormatada} a ${dataFimFormatada})`;
      } else {
        titulo = `Relatório Consolidado - Motorista (${fechamento.periodo})`;
      }
    } else {
      titulo = 'Relatório Consolidado - Motorista (Histórico Completo)';
    }
    
    doc.text(titulo, pageWidth / 2, 38, { align: 'center' });
    
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
    // Formatar período para exibição no relatório consolidado
    let periodoExibicaoConsolidado = fechamento.periodo;
    if (fechamento.periodo && fechamento.periodo.includes(' a ')) {
      const [inicio, fim] = fechamento.periodo.split(' a ');
      const dataInicioFormatada = new Date(inicio + 'T00:00:00').toLocaleDateString('pt-BR');
      const dataFimFormatada = new Date(fim + 'T00:00:00').toLocaleDateString('pt-BR');
      periodoExibicaoConsolidado = `${dataInicioFormatada} a ${dataFimFormatada}`;
    }
    doc.text(`Período: ${periodoExibicaoConsolidado}`, 20, yPos);
    yPos += 8;
    // Sempre usar a data atual real para a data do fechamento no PDF
    const dataAtualFechamento = new Date();
    const dataFechamentoFormatada = `${dataAtualFechamento.getDate().toString().padStart(2, '0')}/${(dataAtualFechamento.getMonth() + 1).toString().padStart(2, '0')}/${dataAtualFechamento.getFullYear()}`;
    console.log(`[PDF DEBUG] Data do fechamento consolidado: ${dataFechamentoFormatada} (data real atual)`);
    doc.text(`Data do Fechamento: ${dataFechamentoFormatada}`, 20, yPos);
    
    // Resumo financeiro
    yPos += 20;
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('RESUMO FINANCEIRO', 20, yPos);
    
    yPos += 15;
    
    // Buscar total de vales usando valeService para motoristas terceiros
    let totalValesHistorico = 0;
    if (fechamento.motorista?.tipo_motorista === 'Terceiro' && fechamento.motorista_id) {
      try {
        console.log(`[PDF DEBUG] === BUSCANDO VALES PARA TERCEIROS ===`);
        console.log(`[PDF DEBUG] Motorista: ${fechamento.motorista?.nome}`);
        console.log(`[PDF DEBUG] Período: ${fechamento.periodo}`);
        
        if (fechamento.periodo === 'Histórico Completo') {
          // Para histórico completo, buscar todos os vales (não implementado no valeService)
          // Por enquanto, usar 0 ou buscar direto no supabase
          totalValesHistorico = 0;
          console.log(`[PDF DEBUG] Histórico completo - usando vales do service: 0`);
        } else if (fechamento.periodo.includes(' a ')) {
          // Período específico (YYYY-MM-DD a YYYY-MM-DD) - buscar direto no supabase
          const [dataInicio, dataFim] = fechamento.periodo.split(' a ');
          console.log(`[PDF DEBUG] === DETALHES DA BUSCA DE VALES ===`);
          console.log(`[PDF DEBUG] Motorista ID: ${fechamento.motorista_id}`);
          console.log(`[PDF DEBUG] Data início: "${dataInicio}"`);
          console.log(`[PDF DEBUG] Data fim: "${dataFim}"`);
          console.log(`[PDF DEBUG] Período original: "${fechamento.periodo}"`);
          
          // Primeiro, vamos verificar se existem vales para este motorista (sem filtro de data)
          const { data: todosVales, error: todosValesError } = await supabase
            .from('vales_motoristas')
            .select('*')
            .eq('motorista_id', fechamento.motorista_id);
          
          console.log(`[PDF DEBUG] === TODOS OS VALES DO MOTORISTA ===`);
          if (todosValesError) {
            console.log(`[PDF DEBUG] Erro ao buscar todos os vales:`, todosValesError);
          } else {
            console.log(`[PDF DEBUG] Total de vales encontrados (sem filtro): ${todosVales?.length || 0}`);
            todosVales?.forEach((vale, index) => {
              console.log(`[PDF DEBUG] Vale ${index + 1}: ID=${vale.id}, Data=${vale.data_vale}, Valor=${vale.valor}, Descrição=${vale.descricao}`);
            });
          }
          
          // Agora buscar com filtro de data
          const { data: vales, error: valesError } = await supabase
            .from('vales_motoristas')
            .select('valor, data_vale, descricao')
            .eq('motorista_id', fechamento.motorista_id)
            .gte('data_vale', dataInicio)
            .lte('data_vale', dataFim);
          
          console.log(`[PDF DEBUG] === VALES COM FILTRO DE DATA ===`);
          if (valesError) {
            console.warn('[PDF DEBUG] Erro ao buscar vales por período específico:', valesError);
            totalValesHistorico = 0;
          } else {
            console.log(`[PDF DEBUG] Vales encontrados com filtro de data: ${vales?.length || 0}`);
            vales?.forEach((vale, index) => {
              console.log(`[PDF DEBUG] Vale filtrado ${index + 1}: Data=${vale.data_vale}, Valor=${vale.valor}, Descrição=${vale.descricao}`);
            });
            totalValesHistorico = vales?.reduce((sum, vale) => sum + (parseFloat(vale.valor) || 0), 0) || 0;
            console.log(`[PDF DEBUG] Total calculado dos vales filtrados: R$ ${totalValesHistorico}`);
          }
        } else {
          // Período formato MM/YYYY - usar valeService
          totalValesHistorico = await valeService.getTotalByMotoristaAndPeriodo(fechamento.motorista_id, fechamento.periodo);
          console.log(`[PDF DEBUG] Vales período ${fechamento.periodo}: R$ ${totalValesHistorico}`);
        }
      } catch (error) {
        console.warn('[PDF DEBUG] Erro ao buscar vales:', error);
        totalValesHistorico = 0;
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
      resumoData.push(['Desconto vale / despesas', this.formatCurrency(totalValesHistorico)]);
    }
    
    if (fechamento.bonus && fechamento.bonus > 0) {
      resumoData.push(['Bonificação', this.formatCurrency(fechamento.bonus)]);
    }
    
    // Calcular valor líquido a receber corretamente para relatório consolidado
    let valorLiquidoReceber = fechamento.valor_liquido;
    
    if (fechamento.motorista?.tipo_motorista === 'Terceiro') {
      // Para terceiros: comissão - abastecimentos - vales + bonus
      valorLiquidoReceber = fechamento.valor_comissao - fechamento.descontos - totalValesHistorico + (fechamento.bonus || 0);
      console.log(`[PDF DEBUG] === CÁLCULO VALOR LÍQUIDO A RECEBER - CONSOLIDADO (TERCEIRO) ===`);
      console.log(`[PDF DEBUG] Comissão: ${fechamento.valor_comissao}`);
      console.log(`[PDF DEBUG] Abastecimentos: ${fechamento.descontos}`);
      console.log(`[PDF DEBUG] Vales históricos: ${totalValesHistorico}`);
      console.log(`[PDF DEBUG] Bônus: ${fechamento.bonus || 0}`);
      console.log(`[PDF DEBUG] Resultado: ${valorLiquidoReceber}`);
    } else {
      // Para funcionários: usar valor já calculado (comissão - vales + bonus)
      console.log(`[PDF DEBUG] === VALOR LÍQUIDO A RECEBER - CONSOLIDADO (FUNCIONÁRIO) ===`);
      console.log(`[PDF DEBUG] Usando valor já calculado: ${valorLiquidoReceber}`);
    }
    
    resumoData.push([
      'Valor Líquido a Receber',
      this.formatCurrency(valorLiquidoReceber)
    ]);
    
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
      console.log(`[PDF DEBUG] Processando ${fechamento.fretes.length} fretes históricos para o PDF`);
      
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
      console.log(`[PDF DEBUG] Nenhum frete histórico encontrado para exibir`);
    }

    // Detalhamento dos abastecimentos (apenas para terceiros)
    let finalYAbastecimentos = finalYFretes;
    if (fechamento.motorista?.tipo_motorista === 'Terceiro' && fechamento.abastecimentos && fechamento.abastecimentos.length > 0) {
      console.log(`[PDF DEBUG] Processando ${fechamento.abastecimentos.length} abastecimentos históricos para o PDF`);
      
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

    // Detalhamento dos vales/despesas históricos (para todos os tipos de motorista)
    let finalYVales = finalYAbastecimentos;
    if (fechamento.motorista_id) {
      try {
        // Buscar vales detalhados respeitando o filtro de data do período
        let valesQuery = supabase
          .from('vales_motoristas')
          .select('id, data_vale, valor, descricao')
          .eq('motorista_id', fechamento.motorista_id);
        
        // Aplicar filtros de data se for período específico
        if (fechamento.periodo && fechamento.periodo.includes(' a ')) {
          const [dataInicio, dataFim] = fechamento.periodo.split(' a ');
          valesQuery = valesQuery.gte('data_vale', dataInicio).lte('data_vale', dataFim);
          console.log(`[PDF DEBUG] Buscando vales detalhados de ${dataInicio} a ${dataFim}`);
        }
        
        const { data: valesDetalhados, error: valesError } = await valesQuery.order('data_vale', { ascending: true });
        
        if (valesError) {
          console.warn('[PDF DEBUG] Erro ao buscar vales históricos detalhados:', valesError);
        } else if (valesDetalhados && valesDetalhados.length > 0) {
          console.log(`[PDF DEBUG] Processando ${valesDetalhados.length} vales históricos para o PDF`);
          
          const pageHeight = doc.internal.pageSize.getHeight();
          
          // Verificar se há espaço suficiente para o título + cabeçalho + pelo menos uma linha
          if (finalYAbastecimentos + 50 > pageHeight - 40) {
            console.log(`[PDF DEBUG] Não há espaço para seção de vales históricos, indo para nova página`);
            doc.addPage();
            finalYAbastecimentos = 20;
          }
          
          doc.setFontSize(14);
          doc.setTextColor(139, 0, 0);
          doc.text('DETALHAMENTO VALE/DESPESAS', 20, finalYAbastecimentos + 20);
          
          finalYVales = this.drawValesTable(
            doc,
            finalYAbastecimentos + 30,
            valesDetalhados.map((vale: any) => ({
              id: vale.id || 0,
              data_vale: vale.data_vale,
              valor: vale.valor,
              descricao: vale.descricao || '',
              motorista: vale.motorista ? { nome: vale.motorista.nome } : undefined
            })),
            pageHeight
          );
        }
      } catch (error) {
        console.warn('[PDF DEBUG] Erro ao buscar vales históricos detalhados:', error);
      }
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
      const observacoesY = finalYVales + 20;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Observações:', 20, observacoesY);
      doc.text(fechamento.observacoes, 20, observacoesY + 10);
    }
    
    // Nome do arquivo
    const nomeArquivo = `relatorio_consolidado_${fechamento.motorista?.nome.replace(/\s+/g, '_')}_historico_completo.pdf`;
    
    // Download do PDF
    doc.save(nomeArquivo);
  }
}

export const pdfService = new PDFService(); 