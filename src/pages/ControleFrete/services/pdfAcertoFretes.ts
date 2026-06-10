import { Frete } from '../../../services/freteService';
import { Caminhao } from '../../../services/caminhaoService';
import { Reboque } from '../../../services/reboqueService';
import { FreteCaminhao } from '../../../services/freteCaminhaoService';
import { formatCurrency, addLogo, calcularValoresPorCaminhao } from './pdfUtils';
import { formatDisplayDate } from '../../../services/dateUtils';

export interface PDFDataAcerto {
  fretesAcerto: Frete[];
  clienteSelecionado: string;
  dataInicioAcerto: string;
  dataFimAcerto: string;
  caminhoes: Caminhao[];
  reboques: Reboque[];
  vinculosCaminhoes: { [freteId: number]: FreteCaminhao[] };
}

export const gerarPDFAcerto = async (data: PDFDataAcerto) => {
  const { 
    fretesAcerto, clienteSelecionado, dataInicioAcerto, dataFimAcerto,
    reboques, vinculosCaminhoes
  } = data;

  if (fretesAcerto.length === 0) {
    alert('Nenhum frete encontrado para o acerto');
    return;
  }

  try {
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF('portrait', 'mm', 'a4');

    const pageWidth = 210;
    const pageHeight = 297;

    doc.setFont('helvetica');

    await addLogo(doc, 20, 10, 30, 30);

    doc.setFontSize(18);
    doc.setTextColor(139, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('VALE DO BOI TRANSPORTE', 55, 18);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text('Transporte de Bovinos', 55, 24);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Rua XV de novembro, 1016 - Centro - Barra do Garças - MT - CEP 78600-000 | CNPJ: 27.244.973/0001-22', 55, 30);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Acerto de Frete', pageWidth / 2, 39, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.setDrawColor(139, 0, 0);
    doc.line(20, 44, pageWidth - 20, 44);

    let yPos = 58;
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('DADOS DO CLIENTE', 20, yPos);

    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cliente: ${clienteSelecionado.toUpperCase()}`, 20, yPos);
    yPos += 8;

    if (dataInicioAcerto && dataFimAcerto) {
      doc.text(`Período: ${formatDisplayDate(dataInicioAcerto)} a ${formatDisplayDate(dataFimAcerto)}`, 20, yPos);
      yPos += 8;
    }

    doc.text(`Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPos);
    yPos += 8;
    doc.text(`Total de Fretes: ${fretesAcerto.length}`, 20, yPos);

    const total = fretesAcerto.reduce((sum, f) => sum + f.valor_frete, 0);
    yPos += 20;
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('RESUMO FINANCEIRO', 20, yPos);

    yPos += 15;
    doc.setFillColor(139, 0, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    doc.rect(20, yPos, 100, 10, 'F');
    doc.text('Descrição', 22, yPos + 7);
    doc.rect(120, yPos, 60, 10, 'F');
    doc.text('Valor', 150, yPos + 7, { align: 'center' });

    yPos += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const resumoData = [
      ['Valor Total dos Fretes', formatCurrency(total)]
    ];

    resumoData.forEach((row, index) => {
      const bgColor = index % 2 === 1 ? [245, 245, 245] : [255, 255, 255];
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(20, yPos, 100, 8, 'F');
      doc.rect(120, yPos, 60, 8, 'F');

      doc.setDrawColor(200, 200, 200);
      doc.rect(20, yPos, 100, 8);
      doc.rect(120, yPos, 60, 8);

      doc.text(row[0] as string, 22, yPos + 6);
      doc.setFont('helvetica', 'bold');
      doc.text(row[1] as string, 178, yPos + 6, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 8;
    });

    const drawFretesTable = (startY: number) => {
      const headers = ['Data', 'Tipo Veículo', 'Origem', 'Destino', 'KM', 'Valor', 'Valores Detalhados'];
      const colWidths = [21, 28, 31, 31, 15, 25, 38]; 
      const totalWidth = colWidths.reduce((a, b) => a + b, 0);
      const startX = (pageWidth - totalWidth) / 2; 
      let currentY = startY;

      doc.setFillColor(139, 0, 0);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');

      let currentX = startX;
      headers.forEach((header, i) => {
        doc.setFillColor(139, 0, 0);
        doc.rect(currentX, currentY, colWidths[i], 12, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);

        doc.text(header, currentX + colWidths[i] / 2, currentY + 8, { align: 'center' });
        currentX += colWidths[i];
      });

      currentY += 12;

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      fretesAcerto.forEach((frete, index) => {
        if (currentY + 20 > pageHeight - 40) {
          doc.addPage();
          currentY = 20;

          doc.setFillColor(139, 0, 0);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');

          currentX = startX;
          headers.forEach((header, i) => {
            doc.setFillColor(139, 0, 0);
            doc.rect(currentX, currentY, colWidths[i], 12, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text(header, currentX + colWidths[i] / 2, currentY + 8, { align: 'center' });
            currentX += colWidths[i];
          });

          currentY += 12;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5); // Slightly smaller font for better fit in portrait
        } else {
          doc.setFontSize(7.5);
        }

        const vinculosCaminhao = vinculosCaminhoes[frete.id!];
        const descricoesConfiguracao: string[] = [];

        if (vinculosCaminhao && vinculosCaminhao.length > 0) {
          vinculosCaminhao.forEach(vinculo => {
            const configuracao = vinculo.configuracao;
            const reboqueId = vinculo.reboque_id;
            const descricaoConfiguracao = configuracao === 'Truck'
              ? 'Truck'
              : `${configuracao}${reboqueId ? ` (${reboques.find(r => r.id === reboqueId)?.placa || ''})` : ''}`;
            descricoesConfiguracao.push(descricaoConfiguracao);
          });
        } else {
          if (frete.caminhao) {
            const descricaoConfiguracao = frete.configuracao === 'Truck'
              ? 'Truck'
              : `${frete.configuracao || 'N/A'}`;
            descricoesConfiguracao.push(descricaoConfiguracao);
          } else {
            descricoesConfiguracao.push('N/A');
          }
        }

        const { valoresIndividuais, total: valTotal } = calcularValoresPorCaminhao(frete.id!, vinculosCaminhoes, reboques);

        // Word Wrap: Split long text into proper lines for columns
        const origemLines: string[] = doc.splitTextToSize(frete.origem || '-', colWidths[2] - 2);
        const destinoLines: string[] = doc.splitTextToSize(frete.destino || '-', colWidths[3] - 2);

        const descVeiculoLines: string[] = [];
        if (descricoesConfiguracao.length > 0) {
          descricoesConfiguracao.forEach(desc => {
            descVeiculoLines.push(...doc.splitTextToSize(desc, colWidths[1] - 2));
          });
        } else {
          descVeiculoLines.push('N/A');
        }

        const valDetalhesLines: string[] = [];
        if (valoresIndividuais.length > 0) {
          valoresIndividuais.forEach(item => {
            const texto = `${formatCurrency(item.valor)}`;
            valDetalhesLines.push(...doc.splitTextToSize(texto, colWidths[6] - 2));
          });
          if (valoresIndividuais.length > 1) {
            valDetalhesLines.push('---');
            valDetalhesLines.push(...doc.splitTextToSize(`Total: ${formatCurrency(valTotal)}`, colWidths[6] - 2));
          }
        } else {
          valDetalhesLines.push('N/A');
        }

        const dataLine = [formatDisplayDate(frete.data_emissao).substring(0, 5)];
        const kmLine = [frete.total_km ? frete.total_km.toString() : '-'];
        const valorFreteLine = doc.splitTextToSize(formatCurrency(frete.valor_frete), colWidths[5] - 2);

        const itemLines = [
          dataLine,
          descVeiculoLines,
          origemLines,
          destinoLines,
          kmLine,
          valorFreteLine,
          valDetalhesLines
        ];

        const maxLines = Math.max(...itemLines.map(arr => arr.length));
        const lineHeight = 3.5;
        const cellHeight = Math.max(10, (maxLines * lineHeight) + 4); // minimum 10px, or contents + padding

        if (index % 2 === 1) {
          doc.setFillColor(245, 245, 245);
          doc.rect(startX, currentY, totalWidth, cellHeight, 'F');
        }

        currentX = startX;
        
        itemLines.forEach((linesArr, i) => {
          doc.setDrawColor(200, 200, 200);
          doc.rect(currentX, currentY, colWidths[i], cellHeight);

          // Calculate vertical center block
          const blockHeight = linesArr.length * lineHeight;
          let startTextY = currentY + (cellHeight - blockHeight) / 2 + (lineHeight - 1); 

          linesArr.forEach((lineText: string) => {
            doc.text(lineText, currentX + colWidths[i] / 2, startTextY, { align: 'center' });
            startTextY += lineHeight;
          });

          currentX += colWidths[i];
        });

        currentY += cellHeight;
      });

      return currentY;
    };

    yPos += 20;
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('DADOS BANCÁRIOS', 20, yPos);

    yPos += 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos, 120, 35, 'F');
    doc.setDrawColor(139, 0, 0);
    doc.rect(20, yPos, 120, 35);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('BANCO: 756 SICOOB', 25, yPos + 8);
    doc.text('AGÊNCIA: 4349  CONTA CORRENTE: 141.105-5', 25, yPos + 16);
    doc.text('PIX-CNPJ: 27.244.973/0001-22', 25, yPos + 24);
    doc.text('VALE DO BOI TRANSPORTE', 25, yPos + 32);

    if (yPos + 120 > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 25;
    }

    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0);
    doc.text('DETALHAMENTO DOS FRETES', 20, yPos);

    yPos += 15;

    drawFretesTable(yPos);

    const rodapeY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Relatório gerado automaticamente pelo Vale do Boi', pageWidth / 2, rodapeY - 5, { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, rodapeY, { align: 'center' });

    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '_');
    const nomeArquivo = `acerto_frete_${clienteSelecionado.replace(/\s+/g, '_')}_${dataAtual}.pdf`;
    doc.save(nomeArquivo);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Tente novamente.');
  }
};
