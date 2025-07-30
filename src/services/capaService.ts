import { supabase } from './supabaseClient';
import jsPDF from 'jspdf';
import { formatDisplayDate } from './dateUtils';

export interface TransporteParaCapa {
  id: number;
  data_emissao: string;
  origem: string;
  destino: string;
  cliente: string;
  motorista: string;
  caminhao_placa: string;
  caminhao_tipo: string;
  valor_frete: number;
}

export interface TransporteAgrupado {
  rota: string;
  origem: string;
  destino: string;
  cliente: string;
  valorTotal: number;
  transportes: TransporteParaCapa[];
}

export class CapaService {
  // Buscar transportes por data de embarque
  async getTransportesByData(dataEmbarque: string): Promise<TransporteParaCapa[]> {
    // Buscar fretes da data
    const { data: fretes, error: fretesError } = await supabase
      .from('fretes')
      .select(`
        id,
        data_emissao,
        origem,
        destino,
        cliente,
        valor_frete
      `)
      .eq('data_emissao', dataEmbarque)
      .order('origem', { ascending: true });

    if (fretesError) {
      throw new Error(`Erro ao buscar transportes: ${fretesError.message}`);
    }

    if (!fretes || fretes.length === 0) {
      return [];
    }

    const freteIds = fretes.map(f => f.id);

    // Buscar vínculos de motoristas
    const { data: vinculosMotoristas, error: motoristasError } = await supabase
      .from('frete_motorista')
      .select(`
        frete_id,
        motorista:motoristas(id, nome)
      `)
      .in('frete_id', freteIds);

    if (motoristasError) {
      console.error('Erro ao buscar vínculos de motoristas:', motoristasError);
    }

    // Buscar vínculos de caminhões
    const { data: vinculosCaminhoes, error: caminhoesError } = await supabase
      .from('frete_caminhao')
      .select(`
        frete_id,
        caminhao:caminhoes(id, placa, tipo)
      `)
      .in('frete_id', freteIds);

    if (caminhoesError) {
      console.error('Erro ao buscar vínculos de caminhões:', caminhoesError);
    }

    // Organizar dados por frete_id
    const motoristasPorFrete: { [freteId: number]: string[] } = {};
    const caminhoesPorFrete: { [freteId: number]: { placa: string, tipo: string }[] } = {};

    // Processar motoristas
    if (vinculosMotoristas) {
      vinculosMotoristas.forEach(vinc => {
        const freteId = vinc.frete_id;
        const motorista = vinc.motorista as any;
        if (motorista && motorista.nome) {
          if (!motoristasPorFrete[freteId]) {
            motoristasPorFrete[freteId] = [];
          }
          motoristasPorFrete[freteId].push(motorista.nome);
        }
      });
    }

    // Processar caminhões
    if (vinculosCaminhoes) {
      vinculosCaminhoes.forEach(vinc => {
        const freteId = vinc.frete_id;
        const caminhao = vinc.caminhao as any;
        if (caminhao && caminhao.placa) {
          if (!caminhoesPorFrete[freteId]) {
            caminhoesPorFrete[freteId] = [];
          }
          caminhoesPorFrete[freteId].push({
            placa: caminhao.placa,
            tipo: caminhao.tipo || 'N/A'
          });
        }
      });
    }



    // Criar um transporte para cada combinação única de frete + motorista + caminhão
    const result: TransporteParaCapa[] = [];

    fretes.forEach(frete => {
      const motoristas = motoristasPorFrete[frete.id] || [];
      const caminhoes = caminhoesPorFrete[frete.id] || [];

      // Se não há motoristas ou caminhões, criar um registro com N/A
      if (motoristas.length === 0 && caminhoes.length === 0) {
        result.push({
          id: frete.id,
          data_emissao: frete.data_emissao,
          origem: frete.origem,
          destino: frete.destino,
          cliente: frete.cliente,
          motorista: 'N/A',
          caminhao_placa: 'N/A',
          caminhao_tipo: 'N/A',
          valor_frete: frete.valor_frete
        });
        return;
      }

      // Se há motoristas mas não caminhões, criar um registro por motorista
      if (motoristas.length > 0 && caminhoes.length === 0) {
        motoristas.forEach(motorista => {
          result.push({
            id: frete.id,
            data_emissao: frete.data_emissao,
            origem: frete.origem,
            destino: frete.destino,
            cliente: frete.cliente,
            motorista: motorista,
            caminhao_placa: 'N/A',
            caminhao_tipo: 'N/A',
            valor_frete: frete.valor_frete
          });
        });
        return;
      }

      // Se há caminhões mas não motoristas, criar um registro por caminhão
      if (caminhoes.length > 0 && motoristas.length === 0) {
        caminhoes.forEach(caminhao => {
          result.push({
            id: frete.id,
            data_emissao: frete.data_emissao,
            origem: frete.origem,
            destino: frete.destino,
            cliente: frete.cliente,
            motorista: 'N/A',
            caminhao_placa: caminhao.placa,
            caminhao_tipo: caminhao.tipo,
            valor_frete: frete.valor_frete
          });
        });
        return;
      }

      // Se há ambos, criar registros únicos baseados no número máximo
      // Usar o número maior entre motoristas e caminhões para evitar duplicação
      const maxCount = Math.max(motoristas.length, caminhoes.length);
      
      for (let i = 0; i < maxCount; i++) {
        const motorista = motoristas[i] || motoristas[0] || 'N/A';
        const caminhao = caminhoes[i] || caminhoes[0];
        
        result.push({
          id: frete.id,
          data_emissao: frete.data_emissao,
          origem: frete.origem,
          destino: frete.destino,
          cliente: frete.cliente,
          motorista: motorista,
          caminhao_placa: caminhao ? caminhao.placa : 'N/A',
          caminhao_tipo: caminhao ? caminhao.tipo : 'N/A',
          valor_frete: frete.valor_frete
        });
      }
    });

    return result;
  }

  // Adicionar logo no PDF
  private async addLogo(doc: jsPDF, x: number, y: number, width: number, height: number): Promise<void> {
    try {
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

  // Gerar PDF da capa de transporte
  async gerarCapaPDF(transportes: TransporteParaCapa[], dataEmbarque: string): Promise<void> {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxY = pageHeight / 2 - 10; // Usar apenas metade da página
    
    // Configurar fonte
    doc.setFont('helvetica');
    
    // Adicionar logo menor
    await this.addLogo(doc, 15, 5, 20, 20);
    
    // Cabeçalho da empresa - fontes menores
    doc.setFontSize(14);
    doc.setTextColor(139, 0, 0); // Cor vermelha
    doc.text('VALE DO BOI', pageWidth / 2, 12, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(139, 0, 0);
    doc.text('Transporte de Bovinos', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('CAPA DE TRANSPORTE', pageWidth / 2, 26, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(139, 0, 0);
    doc.text(`Data de Embarque: ${formatDisplayDate(dataEmbarque)}`, pageWidth / 2, 32, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.3);
    doc.setDrawColor(139, 0, 0);
    doc.line(15, 35, pageWidth - 15, 35);
    
    // Lista de transportes - layout mais compacto
    let yPos = 40;
    const leftColumn = 15;
    const rightColumn = pageWidth / 2 + 5;
    let currentColumn = leftColumn;
    let isLeftColumn = true;
    
    transportes.forEach((transporte, index) => {
      // Verificar se precisa mudar de coluna
      if (yPos + 15 > maxY) {
        if (isLeftColumn) {
          // Mudar para coluna direita
          currentColumn = rightColumn;
          isLeftColumn = false;
          yPos = 40;
        } else {
          // Se já está na coluna direita e não cabe, adicionar nova página
          doc.addPage();
          yPos = 40;
          currentColumn = leftColumn;
          isLeftColumn = true;
        }
      }
      
      // Número do transporte
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${index + 1}.`, currentColumn, yPos);
      
              // Origem - Destino (em uma linha)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
              const rota = `${transporte.origem.length > 12 ? transporte.origem.substring(0, 12) + '...' : transporte.origem} - ${transporte.destino.length > 12 ? transporte.destino.substring(0, 12) + '...' : transporte.destino}`;
      doc.text(rota, currentColumn + 4, yPos);
      
      yPos += 3;
      
      // Cliente
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(`Cliente: ${transporte.cliente.substring(0, 15)}`, currentColumn + 1, yPos);
      
      yPos += 2.5;
      
      // Motorista
      doc.text(`Motorista: ${transporte.motorista.substring(0, 15)}`, currentColumn + 1, yPos);
      
      yPos += 2.5;
      
      // Caminhão
      doc.text(`Caminhão: ${transporte.caminhao_placa} (${transporte.caminhao_tipo.substring(0, 6)})`, currentColumn + 1, yPos);
      
      yPos += 5; // Espaço entre transportes
    });
    

    
    // Rodapé - no final da metade da página
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text('Capa gerada automaticamente pelo Sistema Logística', pageWidth / 2, maxY - 5, { align: 'center' });
    
    const agora = new Date();
    const dataHora = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()} ${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
    doc.text(`Gerado em: ${dataHora}`, pageWidth / 2, maxY - 2, { align: 'center' });
    
    // Nome do arquivo
    const dataFormatada = dataEmbarque.split('-').reverse().join('_');
    const nomeArquivo = `capa_transporte_${dataFormatada}.pdf`;
    
    // Download do PDF
    doc.save(nomeArquivo);
  }

  // Gerar PDF da capa de transporte individual com cores
  async gerarCapaPDFColorido(transportes: TransporteParaCapa[], dataEmbarque: string): Promise<void> {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = 15;
    const contentWidth = pageWidth - marginLeft - marginRight;
    
    // Configurar fonte
    doc.setFont('helvetica');
    
    // Adicionar logo
    await this.addLogo(doc, marginLeft, 10, 25, 25);
    
    // Cabeçalho da empresa
    doc.setFontSize(18);
    doc.setTextColor(139, 0, 0); // Cor vermelha
    doc.text('VALE DO BOI', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(139, 0, 0);
    doc.text('Transporte de Bovinos', pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('CAPA DE TRANSPORTE', pageWidth / 2, 38, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(139, 0, 0);
    doc.text(`Data de Embarque: ${formatDisplayDate(dataEmbarque)}`, pageWidth / 2, 46, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(139, 0, 0);
    doc.line(marginLeft, 50, pageWidth - marginRight, 50);
    
    let yPos = 60;
    let transporteCounter = 1;
    
    transportes.forEach((transporte) => {
      // Verificar se precisa de nova página
      if (yPos + 20 > pageHeight - 30) {
        doc.addPage();
        yPos = 30;
      }
      
      // Definir cor do fundo baseado no cliente
      const isBarraAlimentos = transporte.cliente.toUpperCase().includes('BARRA ALIMENTOS');
      
      // Desenhar fundo do transporte
      if (isBarraAlimentos) {
        doc.setFillColor(93, 173, 226); // Azul para Barra Alimentos
      } else {
        doc.setFillColor(130, 224, 170); // Verde para outros clientes
      }
      
      doc.rect(marginLeft, yPos, contentWidth, 12, 'F');
      
      // Cabeçalho do transporte
      doc.setTextColor(0, 0, 0); // Texto preto para melhor contraste
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
              doc.text(`${transporteCounter}. ${transporte.origem} - ${transporte.destino}`, marginLeft + 3, yPos + 4);
      
      // Cliente na mesma linha
      doc.setFontSize(9);
      doc.text(`Cliente: ${transporte.cliente}`, marginLeft + 3, yPos + 8);
      
      yPos += 15;
      
      // Fundo claro para os dados do transporte
      if (isBarraAlimentos) {
        doc.setFillColor(235, 245, 251); // Azul muito claro
      } else {
        doc.setFillColor(234, 250, 241); // Verde muito claro
      }
      
      doc.rect(marginLeft, yPos, contentWidth, 8, 'F');
      
      yPos += 3;
      
      // Dados do transporte
      doc.setTextColor(0, 0, 0); // Texto preto
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const textoTransporte = `- ${transporte.motorista} - ${transporte.caminhao_placa} (${transporte.caminhao_tipo})`;
      doc.text(textoTransporte, marginLeft + 5, yPos);
      
      yPos += 10; // Espaço entre transportes
      transporteCounter++;
    });
    
    // Rodapé
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Capa gerada automaticamente pelo Sistema Logística', pageWidth / 2, footerY, { align: 'center' });
    
    const agora = new Date();
    const dataHora = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()} ${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
    doc.text(`Gerado em: ${dataHora}`, pageWidth / 2, footerY + 5, { align: 'center' });
    
    // Nome do arquivo
    const dataFormatada = dataEmbarque.split('-').reverse().join('_');
    const nomeArquivo = `capa_transporte_${dataFormatada}.pdf`;
    
    // Download do PDF
    doc.save(nomeArquivo);
  }

  // Gerar PDF da capa de transporte agrupado
  async gerarCapaPDFAgrupado(grupos: TransporteAgrupado[], dataEmbarque: string): Promise<void> {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = 15;
    const contentWidth = pageWidth - marginLeft - marginRight;
    
    // Configurar fonte
    doc.setFont('helvetica');
    
    // Adicionar logo
    await this.addLogo(doc, marginLeft, 10, 25, 25);
    
    // Cabeçalho da empresa
    doc.setFontSize(18);
    doc.setTextColor(139, 0, 0); // Cor vermelha
    doc.text('VALE DO BOI', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(139, 0, 0);
    doc.text('Transporte de Bovinos', pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('CAPA DE TRANSPORTE - AGRUPADO', pageWidth / 2, 38, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(139, 0, 0);
    doc.text(`Data de Embarque: ${formatDisplayDate(dataEmbarque)}`, pageWidth / 2, 46, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(139, 0, 0);
    doc.line(marginLeft, 50, pageWidth - marginRight, 50);
    
    let yPos = 60;
    let grupoCounter = 1;
    
    grupos.forEach((grupo) => {
      // Verificar se precisa de nova página
      const alturaGrupoEstimada = 20 + (grupo.transportes.length * 6);
      if (yPos + alturaGrupoEstimada > pageHeight - 30) {
        doc.addPage();
        yPos = 30;
      }
      
      // Definir cor do fundo baseado no cliente
      const isBarraAlimentos = grupo.cliente.toUpperCase().includes('BARRA ALIMENTOS');
      
      // Desenhar fundo do cabeçalho do grupo
      if (isBarraAlimentos) {
        doc.setFillColor(93, 173, 226); // Azul para Barra Alimentos
      } else {
        doc.setFillColor(130, 224, 170); // Verde para outros clientes
      }
      
      doc.rect(marginLeft, yPos, contentWidth, 12, 'F');
      
      // Cabeçalho do grupo
      doc.setTextColor(0, 0, 0); // Texto preto para melhor contraste
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${grupoCounter}. ${grupo.rota}`, marginLeft + 3, yPos + 4);
      
      // Cliente na mesma linha
      doc.setFontSize(9);
      doc.text(`Cliente: ${grupo.cliente}`, marginLeft + 3, yPos + 8);
      
      yPos += 15;
      
      // Lista de transportes com fundo claro
      if (isBarraAlimentos) {
        doc.setFillColor(235, 245, 251); // Azul muito claro
      } else {
        doc.setFillColor(234, 250, 241); // Verde muito claro
      }
      
      const alturaTransportes = grupo.transportes.length * 6 + 2;
      doc.rect(marginLeft, yPos, contentWidth, alturaTransportes, 'F');
      
      yPos += 3;
      
      // Lista de transportes
      doc.setTextColor(0, 0, 0); // Texto preto
      doc.setFont('helvetica', 'normal');
      
      grupo.transportes.forEach((transporte, index) => {
        // Motorista e caminhão na mesma linha
        doc.setFontSize(8);
        const textoTransporte = `- ${transporte.motorista} - ${transporte.caminhao_placa} (${transporte.caminhao_tipo})`;
        doc.text(textoTransporte, marginLeft + 5, yPos);
        
        yPos += 6;
      });
      
      yPos += 8; // Espaço entre grupos
      grupoCounter++;
    });
    
    // Rodapé
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Capa Agrupada gerada automaticamente pelo Sistema Logística', pageWidth / 2, footerY, { align: 'center' });
    
    const agora = new Date();
    const dataHora = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()} ${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
    doc.text(`Gerado em: ${dataHora}`, pageWidth / 2, footerY + 5, { align: 'center' });
    
    // Nome do arquivo
    const dataFormatada = dataEmbarque.split('-').reverse().join('_');
    const nomeArquivo = `capa_transporte_agrupado_${dataFormatada}.pdf`;
    
    // Download do PDF
    doc.save(nomeArquivo);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}

export const capaService = new CapaService(); 