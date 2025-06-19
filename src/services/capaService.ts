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

export class CapaService {
  // Buscar transportes por data de embarque
  async getTransportesByData(dataEmbarque: string): Promise<TransporteParaCapa[]> {
    const { data, error } = await supabase
      .from('fretes')
      .select(`
        id,
        data_emissao,
        origem,
        destino,
        cliente,
        valor_frete,
        motorista:motoristas(nome),
        caminhao:caminhoes(placa, tipo)
      `)
      .eq('data_emissao', dataEmbarque)
      .order('origem', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar transportes: ${error.message}`);
    }

    return (data || []).map(item => ({
      id: item.id,
      data_emissao: item.data_emissao,
      origem: item.origem,
      destino: item.destino,
      cliente: item.cliente,
      motorista: (item.motorista as any)?.nome || 'N/A',
      caminhao_placa: (item.caminhao as any)?.placa || 'N/A',
      caminhao_tipo: (item.caminhao as any)?.tipo || 'N/A',
      valor_frete: item.valor_frete
    }));
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
      
      // Origem → Destino (em uma linha)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const rota = `${transporte.origem.substring(0, 8)} → ${transporte.destino.substring(0, 8)}`;
      doc.text(rota, currentColumn + 8, yPos);
      
      yPos += 3;
      
      // Cliente
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(`Cliente: ${transporte.cliente.substring(0, 15)}`, currentColumn + 2, yPos);
      
      yPos += 2.5;
      
      // Motorista
      doc.text(`Motorista: ${transporte.motorista.substring(0, 15)}`, currentColumn + 2, yPos);
      
      yPos += 2.5;
      
      // Caminhão
      doc.text(`Caminhão: ${transporte.caminhao_placa} (${transporte.caminhao_tipo.substring(0, 6)})`, currentColumn + 2, yPos);
      
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

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}

export const capaService = new CapaService(); 