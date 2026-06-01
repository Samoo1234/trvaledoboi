import { PDFDataControle, gerarPDFControleFrentes } from './pdfControleFretes';
import { PDFDataAcerto, gerarPDFAcerto } from './pdfAcertoFretes';
import { calcularValoresPorCaminhao } from './pdfUtils';
import { gerarPDFReciboConsolidado } from './pdfReciboFrete';
import { Frete } from '../../../services/freteService';

class ControleFretePDFService {
  public calcularValoresPorCaminhao = calcularValoresPorCaminhao;

  async gerarPDFControleFrentes(data: PDFDataControle) {
    return gerarPDFControleFrentes(data);
  }

  async gerarPDFAcerto(data: PDFDataAcerto) {
    return gerarPDFAcerto(data);
  }

  async gerarPDFReciboConsolidado(clienteNome: string, clienteCpfCnpj: string | undefined, fretes: Frete[]) {
    return gerarPDFReciboConsolidado(clienteNome, clienteCpfCnpj, fretes);
  }
}

export const controleFretePDFService = new ControleFretePDFService();
export type { PDFDataControle, PDFDataAcerto };

