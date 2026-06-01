import jsPDF from 'jspdf';
import { Frete } from '../../../services/freteService';
import { formatCurrency, formatDate, addLogo } from './pdfUtils';

/**
 * Converte um valor numérico em reais para representação por extenso em português.
 * Suporta valores até R$ 9.999.999,99 com centavos.
 */
export function escreverValorPorExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezenas10_19 = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const formatarGrupo = (n: number, isMil: boolean = false): string => {
    if (n === 0) return '';
    if (n === 100) return 'cem';

    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    const parts: string[] = [];

    if (c > 0) parts.push(centenas[c]);

    if (d === 1) {
      parts.push(dezenas10_19[u]);
    } else {
      if (d > 1) parts.push(dezenas[d]);
      if (u > 0) {
        if (isMil && u === 1 && c === 0 && d === 0) {
          parts.push('um');
        } else {
          parts.push(unidades[u]);
        }
      }
    }

    return parts.join(' e ');
  };

  // Separar parte inteira (reais) e decimal (centavos)
  const partesValor = valor.toFixed(2).split('.');
  const inteiros = parseInt(partesValor[0]);
  const centavos = parseInt(partesValor[1]);

  let textoReais = '';

  if (inteiros > 0) {
    const milhoes = Math.floor(inteiros / 1000000);
    const milhares = Math.floor((inteiros % 1000000) / 1000);
    const resto = inteiros % 1000;

    console.log(`[PDF RECIBO DEBUG] Valor original: ${valor}, inteiros: ${inteiros}, resto: ${resto}`);

    const parts: string[] = [];

    if (milhoes > 0) {
      parts.push(formatarGrupo(milhoes) + (milhoes === 1 ? ' milhão' : ' milhões'));
    }

    if (milhares > 0) {
      // Ajuste comum em português: "mil" sozinho ou "um mil"
      if (milhares === 1 && milhoes === 0) {
        parts.push('mil');
      } else {
        parts.push(formatarGrupo(milhares, true) + ' mil');
      }
    }

    if (resto > 0) {
      const grupoRestoFormatted = formatarGrupo(resto);
      console.log(`[PDF RECIBO DEBUG] Grupo resto formatado: "${grupoRestoFormatted}"`);
      parts.push(grupoRestoFormatted);
    }

    // Regra gramatical: conectar grupos de milhares com "e" se forem simples (sem centenas ou dezenas no grupo posterior)
    // Para simplificar e garantir correção geral, juntamos com "e"
    textoReais = parts.join(' e ').replace(/ e mil/g, ' mil').replace(/, e/g, ' e');
    textoReais += inteiros === 1 ? ' real' : ' reais';
  }

  let textoCentavos = '';
  if (centavos > 0) {
    textoCentavos = formatarGrupo(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  }

  if (textoReais && textoCentavos) {
    return textoReais + ' e ' + textoCentavos;
  }
  return textoReais || textoCentavos || 'zero reais';
}

export async function gerarPDFReciboConsolidado(
  clienteNome: string,
  clienteCpfCnpj: string | undefined,
  fretesSelecionados: Frete[]
): Promise<void> {
  if (fretesSelecionados.length === 0) {
    throw new Error('Nenhum frete selecionado para gerar recibo');
  }

  // Garantir que todos estejam pagos
  const fretesNaoPagos = fretesSelecionados.filter(f => f.situacao !== 'Pago');
  if (fretesNaoPagos.length > 0) {
    throw new Error('Somente é possível gerar recibo de fretes com status "Pago".');
  }

  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Margens
  const marginX = 20;

  // Carregar cabeçalho e logo
  await addLogo(doc, marginX, 15, 25, 25);

  // Nome da Empresa - Alinhado à esquerda para evitar colisão com a caixa de destaque do recibo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(139, 0, 0); // Vermelho Vale do Boi
  doc.text('VALE DO BOI', 50, 23, { align: 'left' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Transporte de Bovinos', 50, 29, { align: 'left' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Barra do Garças - MT | E-mail: financeiro@valedoboi.com.br', 50, 35, { align: 'left' });

  // Linha separadora vermelha
  doc.setLineWidth(0.6);
  doc.setDrawColor(139, 0, 0);
  doc.line(marginX, 45, pageWidth - marginX, 45);

  // Título do documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('RECIBO DE PAGAMENTO DE FRETE', pageWidth / 2, 57, { align: 'center' });

  // Calcular totais
  const valorTotal = fretesSelecionados.reduce((sum, f) => sum + (f.valor_frete || 0), 0);
  const dataHojeStr = new Date().toLocaleDateString('pt-BR');

  // Caixa de destaque superior (Nº Recibo e Valor)
  const boxX = 140;
  const boxY = 15;
  const boxW = 50;
  const boxH = 24;
  
  doc.setLineWidth(0.3);
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 248);
  doc.rect(boxX, boxY, boxW, boxH, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('RECIBO Nº', boxX + 5, boxY + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  // Usar ID do primeiro frete ou timestamp se consolidado
  const numRecibo = fretesSelecionados.length === 1 
    ? (fretesSelecionados[0].numero_minuta || fretesSelecionados[0].id?.toString() || '0000')
    : `C-${fretesSelecionados[0].id}`;
  doc.text(numRecibo, boxX + 5, boxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('VALOR TOTAL', boxX + 5, boxY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(139, 0, 0); // Vermelho
  doc.text(formatCurrency(valorTotal), boxX + 5, boxY + 22);

  // Texto da quitação do recibo
  let currentY = 70;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const valorExtenso = escreverValorPorExtenso(valorTotal);
  const infoDocumento = clienteCpfCnpj 
    ? `, portador do CPF/CNPJ nº ${clienteCpfCnpj}`
    : '';
  
  const textoDeclarativo = `Recebemos de ${clienteNome}${infoDocumento}, a importância de ${formatCurrency(valorTotal)} (${valorExtenso}), referente à quitação do frete para o transporte de bovinos listados abaixo, não restando mais nenhuma pendência financeira relativa a estes fretes.`;

  // Quebrar texto e desenhar
  const textLines = doc.splitTextToSize(textoDeclarativo, pageWidth - (marginX * 2));
  doc.text(textLines, marginX, currentY, { align: 'left', lineHeightFactor: 1.4 });

  // Atualizar Y com base na quantidade de linhas
  currentY += textLines.length * 6 + 10;

  // Mini Tabela de Referência
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(139, 0, 0);
  doc.text('RELAÇÃO DE FRETES QUITADOS', marginX, currentY);
  currentY += 6;

  // Cabeçalho da Tabela
  const headers = ['Data Emissão', 'Minuta / CB', 'Meio Pagamento', 'Data Pagamento', 'Valor'];
  const colWidths = [30, 45, 35, 30, 30]; // Total = 170 mm
  let startX = marginX;

  doc.setFillColor(139, 0, 0);
  doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);

  headers.forEach((header, i) => {
    doc.text(header, startX + colWidths[i] / 2, currentY + 5.5, { align: 'center' });
    startX += colWidths[i];
  });

  currentY += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  // Desenhar cada linha da tabela
  fretesSelecionados.forEach((frete, index) => {
    // Quebra de página automática caso a tabela cresça muito
    if (currentY + 12 > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
      
      // Redesenhar cabeçalho na nova página
      startX = marginX;
      doc.setFillColor(139, 0, 0);
      doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), 8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      headers.forEach((header, i) => {
        doc.text(header, startX + colWidths[i] / 2, currentY + 5.5, { align: 'center' });
        startX += colWidths[i];
      });
      
      currentY += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }

    // Alternar cor das linhas
    if (index % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(marginX, currentY, colWidths.reduce((a, b) => a + b, 0), 7, 'F');
    }

    const rowData = [
      formatDate(frete.data_emissao),
      frete.numero_minuta || frete.numero_cb || `F-${frete.id}`,
      frete.tipo_pagamento || '-',
      frete.data_pagamento ? formatDate(frete.data_pagamento) : '-',
      formatCurrency(frete.valor_frete)
    ];

    startX = marginX;
    rowData.forEach((val, i) => {
      doc.setDrawColor(220, 220, 220);
      doc.rect(startX, currentY, colWidths[i], 7);
      
      // Centralizar texto em todas as colunas
      doc.text(val, startX + colWidths[i] / 2, currentY + 4.5, { align: 'center' });
      startX += colWidths[i];
    });

    currentY += 7;
  });

  // Linha de total na tabela
  doc.setDrawColor(139, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Valor Total Recebido: ${formatCurrency(valorTotal)}`, pageWidth - marginX - 5, currentY, { align: 'right' });
  currentY += 15;

  // Local e data da quitação
  const localidade = `Barra do Garças - MT, ${dataHojeStr}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(localidade, marginX, currentY);
  currentY += 20;

  // Verificar se a assinatura cabe na página, senão joga pro final da página seguinte
  if (currentY + 50 > pageHeight) {
    doc.addPage();
    currentY = 40;
  }

  // Linha de assinatura centralizada da Vale do Boi
  const lineW = 80;
  const lineX = (pageWidth - lineW) / 2;
  const sigY = pageHeight - 50;

  // Carregar e desenhar a assinatura digitalizada em cima da linha
  try {
    const sigW = 60;
    const sigH = 35;
    const sigX = (pageWidth - sigW) / 2;
    const sigYPos = sigY - sigH - 1; // 1mm acima da linha
    
    // Helper local para carregar a assinatura do assets público
    const addSignature = async (pdfDoc: any, xPos: number, yPos: number, w: number, h: number): Promise<void> => {
      try {
        const response = await fetch('/assets/images/assintaura tr.png');
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          return new Promise((resolve) => {
            reader.onload = function (e) {
              if (e.target?.result) {
                try {
                  pdfDoc.addImage(e.target.result as string, 'PNG', xPos, yPos, w, h);
                  console.log('[PDF RECIBO] Assinatura adicionada com sucesso');
                } catch (error) {
                  console.warn('[PDF RECIBO] Erro ao desenhar assinatura no PDF:', error);
                }
              }
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        }
      } catch (error) {
        console.warn('[PDF RECIBO] Assinatura digitalizada não encontrada no caminho especificado:', error);
      }
    };

    await addSignature(doc, sigX, sigYPos, sigW, sigH);
  } catch (err) {
    console.warn('[PDF RECIBO] Erro geral ao processar assinatura:', err);
  }
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(lineX, sigY, lineX + lineW, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('VALE DO BOI - TRANSPORTE DE BOVINOS', pageWidth / 2, sigY + 5, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Emitente / Credor Recebedor', pageWidth / 2, sigY + 9, { align: 'center' });

  // Rodapé estético
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Este documento é um comprovante digital de quitação financeira de fretes.', pageWidth / 2, pageHeight - 15, { align: 'center' });

  // Baixar arquivo
  const filename = `recibo_frete_${clienteNome.replace(/\s+/g, '_')}_${dataHojeStr.replace(/\//g, '_')}.pdf`;
  doc.save(filename);
}
