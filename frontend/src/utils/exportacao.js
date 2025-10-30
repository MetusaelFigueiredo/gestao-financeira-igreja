import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/**
 * Exporta elemento HTML para PDF
 */
export const exportarParaPDF = async (elementId, nomeArquivo = 'relatorio.pdf') => {
  try {
    const elemento = document.getElementById(elementId);
    
    if (!elemento) {
      throw new Error('Elemento não encontrado');
    }

    // Captura o elemento como imagem
    const canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Cria o PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Adiciona primeira página
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Adiciona páginas extras se necessário
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Salva o PDF
    pdf.save(nomeArquivo);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exporta dados para Excel
 */
export const exportarParaExcel = (dados, nomeArquivo = 'relatorio.xlsx') => {
  try {
    const wb = XLSX.utils.book_new();

    // Adiciona aba de Resumo
    if (dados.resumo) {
      const wsResumo = XLSX.utils.aoa_to_sheet(dados.resumo);
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    }

    // Adiciona aba de Entradas Detalhadas
    if (dados.entradasDetalhadas) {
      const wsEntradas = XLSX.utils.aoa_to_sheet(dados.entradasDetalhadas);
      XLSX.utils.book_append_sheet(wb, wsEntradas, 'Entradas');
    }

    // Adiciona aba de Despesas Detalhadas
    if (dados.despesasDetalhadas) {
      const wsDespesas = XLSX.utils.aoa_to_sheet(dados.despesasDetalhadas);
      XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas');
    }

    // Salva o arquivo
    XLSX.writeFile(wb, nomeArquivo);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prepara página para impressão
 */
export const imprimirRelatorio = () => {
  window.print();
};