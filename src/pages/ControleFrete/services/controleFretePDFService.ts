import { Frete } from '../../../services/freteService';
import { Caminhao } from '../../../services/caminhaoService';
import { Motorista } from '../../../services/motoristaService';
import { Reboque } from '../../../services/reboqueService';
import { formatDisplayDate } from '../../../services/dateUtils';
import { FreteCaminhao } from '../../../services/freteCaminhaoService';
import { FreteMotorista } from '../../../services/freteMotoristaService';

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

export interface PDFDataAcerto {
  fretesAcerto: Frete[];
  clienteSelecionado: string;
  dataInicioAcerto: string;
  dataFimAcerto: string;
  caminhoes: Caminhao[];
  reboques: Reboque[];
  vinculosCaminhoes: { [freteId: number]: FreteCaminhao[] };
}

class ControleFretePDFService {
  private formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private formatDate(dateString: string) {
    return formatDisplayDate(dateString);
  }

  public calcularValoresPorCaminhao(
    freteId: number,
    vinculosCaminhoes: { [freteId: number]: FreteCaminhao[] },
    reboques: Reboque[]
  ) {
    const vinculos = vinculosCaminhoes[freteId];
    if (!vinculos || vinculos.length === 0) {
      return { valoresIndividuais: [], total: 0 };
    }

    const valoresIndividuais = vinculos.map(vinculo => {
      const configuracao = vinculo.configuracao;
      const reboqueId = vinculo.reboque_id;

      const descricaoConfiguracao = configuracao === 'Truck'
        ? 'Truck'
        : `${configuracao}${reboqueId ? ` (${reboques.find(r => r.id === reboqueId)?.placa || ''})` : ''}`;

      return {
        valor: vinculo.valor_frete || 0,
        descricao: descricaoConfiguracao
      };
    });

    const total = valoresIndividuais.reduce((sum, item) => sum + item.valor, 0);

    return { valoresIndividuais, total };
  }

  private async addLogo(doc: any, x: number, y: number, width: number, height: number): Promise<void> {
    try {
      const response = await fetch('/assets/images/logo.png');
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();

        return new Promise((resolve) => {
          reader.onload = function (e) {
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

  async gerarPDFControleFrentes(data: PDFDataControle) {
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

      await this.addLogo(doc, 15, 8, 25, 25);

      doc.setFontSize(18);
      doc.setTextColor(139, 0, 0);
      doc.text('VALE DO BOI', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(139, 0, 0);
      doc.text('Transporte de Bovinos', pageWidth / 2, 22, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Relatório de Controle de Fretes', pageWidth / 2, 30, { align: 'center' });

      doc.setLineWidth(0.5);
      doc.setDrawColor(139, 0, 0);
      doc.line(15, 35, pageWidth - 15, 35);

      let yPos = 42;
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
            this.formatDate(frete.data_emissao),
            frete.numero_minuta || '-',
            frete.numero_cb || '-',
            (frete.pecuarista || '-').substring(0, 14),
            (frete.cliente || '-').substring(0, 14),
            (frete.origem || '-').substring(0, 18),
            (frete.destino || '-').substring(0, 17),
            '', 
            '', 
            '', 
            this.formatCurrency(frete.valor_frete),
            (frete.tipo_pagamento || '-').substring(0, 10),
            frete.data_pagamento ? this.formatDate(frete.data_pagamento) : '-',
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

              doc.text(cell, textX, currentY + (dynamicRowHeight / 2) + 1, { align });
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
      doc.text(`TOTAL GERAL: ${this.formatCurrency(totalGeral)}`, pageWidth - 15, resumoY, { align: 'right' });

      const dataAtual = new Date().toISOString().split('T')[0];
      doc.save(`relatorio-fretes-${dataAtual}.pdf`);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    }
  }

  async gerarPDFAcerto(data: PDFDataAcerto) {
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

      await this.addLogo(doc, 20, 10, 30, 30);

      doc.setFontSize(20);
      doc.setTextColor(139, 0, 0);
      doc.text('VALE DO BOI', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('Transporte de Bovinos', pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Relatório de Acerto de Frete', pageWidth / 2, 38, { align: 'center' });

      doc.setLineWidth(0.5);
      doc.setDrawColor(139, 0, 0);
      doc.line(20, 43, pageWidth - 20, 43);

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
        ['Valor Total dos Fretes', this.formatCurrency(total)]
      ];

      resumoData.forEach((row, index) => {
        const bgColor = index % 2 === 1 ? [245, 245, 245] : [255, 255, 255];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(20, yPos, 100, 8, 'F');
        doc.rect(120, yPos, 60, 8, 'F');

        doc.setDrawColor(200, 200, 200);
        doc.rect(20, yPos, 100, 8);
        doc.rect(120, yPos, 60, 8);

        doc.text(row[0], 22, yPos + 6);
        doc.setFont('helvetica', 'bold');
        doc.text(row[1], 178, yPos + 6, { align: 'right' });
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

          const { valoresIndividuais, total } = this.calcularValoresPorCaminhao(frete.id!, vinculosCaminhoes, reboques);

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
              const texto = `${this.formatCurrency(item.valor)}`;
              valDetalhesLines.push(...doc.splitTextToSize(texto, colWidths[6] - 2));
            });
            if (valoresIndividuais.length > 1) {
              valDetalhesLines.push('---');
              valDetalhesLines.push(...doc.splitTextToSize(`Total: ${this.formatCurrency(total)}`, colWidths[6] - 2));
            }
          } else {
            valDetalhesLines.push('N/A');
          }

          const dataLine = [formatDisplayDate(frete.data_emissao).substring(0, 5)];
          const kmLine = [frete.total_km ? frete.total_km.toString() : '-'];
          const valorFreteLine = doc.splitTextToSize(this.formatCurrency(frete.valor_frete), colWidths[5] - 2);

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
      doc.text('VALE DO BOI CARNES LTDA', 25, yPos + 32);

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
  }
}

export const controleFretePDFService = new ControleFretePDFService();
