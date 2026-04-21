import { PDFDataControle, gerarPDFControleFrentes } from './pdfControleFretes';
import { PDFDataAcerto, gerarPDFAcerto } from './pdfAcertoFretes';
import { calcularValoresPorCaminhao } from './pdfUtils';

class ControleFretePDFService {
  public calcularValoresPorCaminhao = calcularValoresPorCaminhao;

  async gerarPDFControleFrentes(data: PDFDataControle) {
    return gerarPDFControleFrentes(data);
  }

  async gerarPDFAcerto(data: PDFDataAcerto) {
    return gerarPDFAcerto(data);
  }
}

export const controleFretePDFService = new ControleFretePDFService();
export type { PDFDataControle, PDFDataAcerto };
