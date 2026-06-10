import { Frete } from '../../../services/freteService';
import { Caminhao } from '../../../services/caminhaoService';
import { Motorista } from '../../../services/motoristaService';
import { Reboque } from '../../../services/reboqueService';
import { FreteCaminhao } from '../../../services/freteCaminhaoService';
import { FreteMotorista } from '../../../services/freteMotoristaService';
import { formatCurrency, formatDate, addLogo } from './pdfUtils';
import { formatDisplayDate } from '../../../services/dateUtils';

export interface PDFDataControle {
  fretesFiltrados: Frete[];
  filtroDataInicio: string;
  filtroDataFim: string;
  filtroCliente: string;
  filtroSituacao: string;
  caminhoes: Caminhao[];
  motoristas: Motorista[];
  reboques: Reboque[];
  vinculosCaminhoes: { [freteId: number]: FreteCaminhao[] };
  vinculosMotoristas: { [freteId: number]: FreteMotorista[] };
}

export const gerarPDFControleFrentes = async (data: PDFDataControle) => {
  const {
    fretesFiltrados, filtroDataInicio, filtroDataFim, filtroCliente, filtroSituacao,
    caminhoes, motoristas, vinculosCaminhoes, vinculosMotoristas
  } = data;

  if (fretesFiltrados.length === 0) {
    alert('Nenhum frete para gerar o relatório');
    return;
  }

  try {
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = 297;
    const pageHeight = 210;

    doc.setFont('helvetica');

    await addLogo(doc, 15, 8, 25, 25);

    doc.setFontSize(16);
    doc.setTextColor(139, 0, 0);
    doc.text('VALE DO BOI TRANSPORTE', pageWidth / 2, 13, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(139, 0, 0);
    doc.text('Transporte de Bovinos', pageWidth / 2, 19, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Rua XV de novembro, 1016 - Centro - Barra do Garças - MT - CEP 78600-000 | CNPJ: 27.244.973/0001-22', pageWidth / 2, 24, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Controle de Fretes', pageWidth / 2, 32, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.setDrawColor(139, 0, 0);
    doc.line(15, 37, pageWidth - 15, 37);

    let yPos = 44;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    let infoText = `Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}  |  `;
    infoText += `Total de Fretes: ${fretesFiltrados.length}  |  `;

    if (filtroDataInicio && filtroDataFim) {
      infoText += `Período: ${formatDisplayDate(filtroDataInicio)} a ${formatDisplayDate(filtroDataFim)}`;
    } else if (filtroDataInicio) {
      infoText += `A partir de: ${formatDisplayDate(filtroDataInicio)}`;
    } else if (filtroDataFim) {
      infoText += `Até: ${formatDisplayDate(filtroDataFim)}`;
    }

    doc.text(infoText, pageWidth / 2, yPos, { align: 'center' });

    if (filtroCliente) {
      yPos += 5;
      doc.text(`Cliente: ${filtroCliente}`, pageWidth / 2, yPos, { align: 'center' });
    }

    if (filtroSituacao) {
      yPos += 5;
      doc.text(`Situação: ${filtroSituacao}`, pageWidth / 2, yPos, { align: 'center' });
    }

    const drawFretesTable = (startY: number) => {
      const headers = ['Sit.', 'Data', 'Min.', 'CB', 'Pecuarista', 'Cliente', 'Origem', 'Destino', 'Motorista', 'Caminhão', 'Conf.', 'Valor', 'T.Pag', 'D.Pag', 'Faixa', 'KM'];
      const colWidths = [14, 18, 14, 11, 20, 20, 25, 23, 24, 20, 16, 20, 14, 18, 12, 11];
      const totalWidth = colWidths.reduce((a, b) => a + b, 0);
      const startX = (pageWidth - totalWidth) / 2;
      const rowHeight = 8;
      let currentY = startY;
      let pageNum = 1;

      const drawHeader = () => {
        doc.setFillColor(139, 0, 0);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');

        let currentX = startX;
        headers.forEach((header, i) => {
          doc.setFillColor(139, 0, 0);
          doc.rect(currentX, currentY, colWidths[i], rowHeight, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text(header, currentX + colWidths[i] / 2, currentY + 6, { align: 'center' });
          currentX += colWidths[i];
        });

        currentY += rowHeight;
      };

      drawHeader();

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);

      fretesFiltrados.forEach((frete, index) => {
        const vincCaminhoes = vinculosCaminhoes[frete.id!] || [];
        const vincMotoristas = vinculosMotoristas[frete.id!] || [];

        const placasArray = vincCaminhoes
          .map(v => caminhoes.find(c => c.id === v.caminhao_id)?.placa)
          .filter(p => p);

        const configuracoesArray = vincCaminhoes
          .map(v => v.configuracao)
          .filter(c => c);

        const motoristasArray = vincMotoristas
          .map(v => motoristas.find(m => m.id === v.motorista_id)?.nome)
          .filter(n => n);

        const maxItens = Math.max(
          placasArray.length || 1,
          motoristasArray.length || 1,
          configuracoesArray.length || 1
        );
        const dynamicRowHeight = Math.max(rowHeight, maxItens * 5 + 3);

        if (currentY + dynamicRowHeight > pageHeight - 25) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

          doc.addPage();
          pageNum++;
          currentY = 20;

          drawHeader();

          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
        }

        const rowDataSimple = [
          frete.situacao || '-',
          formatDate(frete.data_emissao),
          frete.numero_minuta || '-',
          frete.numero_cb || '-',
          (frete.pecuarista || '-').substring(0, 14),
          ((frete as any).clienteData?.razao_social || frete.cliente || '-').substring(0, 14),
          (frete.origem || '-').substring(0, 18),
          (frete.destino || '-').substring(0, 17),
          '', 
          '', 
          '', 
          formatCurrency(frete.valor_frete),
          (frete.tipo_pagamento || '-').substring(0, 10),
          frete.data_pagamento ? formatDate(frete.data_pagamento) : '-',
          frete.faixa || '-',
          frete.total_km ? `${frete.total_km}` : '-'
        ];

        const bgColor = index % 2 === 0 ? [255, 255, 255] : [245, 245, 245];

        let currentX = startX;
        rowDataSimple.forEach((cell, i) => {
          doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          doc.rect(currentX, currentY, colWidths[i], dynamicRowHeight, 'F');

          doc.setDrawColor(200, 200, 200);
          doc.rect(currentX, currentY, colWidths[i], dynamicRowHeight);

          if (i !== 8 && i !== 9 && i !== 10) { 
            doc.setTextColor(0, 0, 0);
            let align: 'left' | 'center' | 'right' = 'center';
            if ([4, 5, 6, 7].includes(i)) align = 'left';
            if (i === 11) align = 'right';

            const textX = align === 'center' ? currentX + colWidths[i] / 2 :
              align === 'right' ? currentX + colWidths[i] - 2 : currentX + 2;

            doc.text(cell as string, textX, currentY + (dynamicRowHeight / 2) + 1, { align });
          }

          currentX += colWidths[i];
        });

        // Motoristas (coluna 8)
        const motoristaX = startX + colWidths.slice(0, 8).reduce((a, b) => a + b, 0);
        let motoristaY = currentY + 4;
        motoristasArray.forEach((nome) => {
          doc.setTextColor(0, 0, 0);
          doc.text((nome || '-').substring(0, 18), motoristaX + colWidths[8] / 2, motoristaY, { align: 'center' });
          motoristaY += 5;
        });
        if (motoristasArray.length === 0) {
          doc.text('-', motoristaX + colWidths[8] / 2, currentY + (dynamicRowHeight / 2) + 1, { align: 'center' });
        }

        // Caminhões (coluna 9)
        const caminhaoX = startX + colWidths.slice(0, 9).reduce((a, b) => a + b, 0);
        let caminhaoY = currentY + 4;
        placasArray.forEach((placa) => {
          doc.setTextColor(0, 0, 0);
          doc.text(placa || '-', caminhaoX + colWidths[9] / 2, caminhaoY, { align: 'center' });
          caminhaoY += 5;
        });
        if (placasArray.length === 0) {
          doc.text('-', caminhaoX + colWidths[9] / 2, currentY + (dynamicRowHeight / 2) + 1, { align: 'center' });
        }

        // Configurações (coluna 10)
        const configX = startX + colWidths.slice(0, 10).reduce((a, b) => a + b, 0);
        let configY = currentY + 4;
        configuracoesArray.forEach((config) => {
          doc.setTextColor(0, 0, 0);
          doc.text((config || '-').substring(0, 12), configX + colWidths[10] / 2, configY, { align: 'center' });
          configY += 5;
        });
        if (configuracoesArray.length === 0) {
          doc.text('-', configX + colWidths[10] / 2, currentY + (dynamicRowHeight / 2) + 1, { align: 'center' });
        }

        currentY += dynamicRowHeight;
      });

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      return currentY;
    };

    const tableEndY = drawFretesTable(yPos + 8);

    const totalGeral = fretesFiltrados.reduce((sum, f) => sum + f.valor_frete, 0);
    const resumoY = tableEndY + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.text(`TOTAL GERAL: ${formatCurrency(totalGeral)}`, pageWidth - 15, resumoY, { align: 'right' });

    const dataAtual = new Date().toISOString().split('T')[0];
    doc.save(`relatorio-fretes-${dataAtual}.pdf`);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
  }
};
