import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/**
 * Exporta relatório COMPILADO (Resumido) para PDF
 */
export const exportarPDFCompilado = async (relatorio, nomeArquivo = 'relatorio-compilado.pdf') => {
  try {
    return await gerarPDFCompilado(relatorio, nomeArquivo);
  } catch (error) {
    console.error('Erro ao exportar PDF Compilado:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exporta relatório DETALHADO (Completo) para PDF
 */
export const exportarPDFDetalhado = async (relatorio, nomeArquivo = 'relatorio-detalhado.pdf') => {
  try {
    return await gerarPDFDetalhado(relatorio, nomeArquivo);
  } catch (error) {
    console.error('Erro ao exportar PDF Detalhado:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exporta relatório para PDF (função original - mantida para compatibilidade)
 */
export const exportarParaPDF = async (elementId, nomeArquivo = 'relatorio.pdf', relatorio = null) => {
  try {
    if (relatorio) {
      // Por padrão, usa o PDF detalhado
      return await gerarPDFDetalhado(relatorio, nomeArquivo);
    }
    
    // Fallback para método original (html2canvas)
    return await exportarHTMLParaPDF(elementId, nomeArquivo);
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gera PDF COMPILADO (Resumido) - Layout Portrait com visual elegante
 */
const gerarPDFCompilado = async (relatorio, nomeArquivo) => {
  try {
    // Cria PDF em modo retrato
    const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' = portrait
    const pageWidth = 210; // A4 portrait width
    const pageHeight = 297; // A4 portrait height
    const margin = 20;
    let yPos = 30;

    // Formatar período
    const periodoTexto = relatorio.periodo
      ? relatorio.periodo.toUpperCase()
      : (relatorio.periodo && relatorio.periodo.inicio ? `${new Date(relatorio.periodo.inicio).toLocaleDateString('pt-BR')} - ${new Date(relatorio.periodo.fim).toLocaleDateString('pt-BR')}`.toUpperCase() : '');

    // CABEÇALHO ELEGANTE
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 51, 51); // #333333
    const titulo = `RELATÓRIO FINANCEIRO COMPILADO - ${periodoTexto}`;
    const tituloWidth = pdf.getTextWidth(titulo);
    pdf.text(titulo, (pageWidth - tituloWidth) / 2, yPos);
   
    // Linha decorativa sob o título
    pdf.setDrawColor(52, 152, 219); // Azul elegante
    pdf.setLineWidth(0.8);
    pdf.line(margin, yPos + 5, pageWidth - margin, yPos + 5);
    
    // Data de geração
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102);
    const dataGeracao = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
    const dataWidth = pdf.getTextWidth(dataGeracao);
    pdf.text(dataGeracao, pageWidth - margin - dataWidth, yPos + 15);
    
    yPos = 60;

    // SEÇÃO 1: TOTAL DE ENTRADAS
    const criarSecaoElegante = (titulo, dados, y) => {
      let currentY = y;
      
      // Título da seção com fundo
      pdf.setFillColor(240, 248, 255); // Azul muito claro
      pdf.rect(margin, currentY - 5, pageWidth - 2 * margin, 12, 'F');
      pdf.setDrawColor(52, 152, 219);
      pdf.rect(margin, currentY - 5, pageWidth - 2 * margin, 12, 'S');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(52, 152, 219); // Azul elegante
      pdf.text(titulo, margin + 5, currentY + 2);
      currentY += 20;
      
      // Dados da seção
      pdf.setFontSize(10);
      pdf.setTextColor(51, 51, 51);
      
      dados.forEach(item => {
        pdf.setFont('helvetica', item.destaque ? 'bold' : 'normal');
        
        // Label
        pdf.text(item.label, margin + 10, currentY);
        
        // Valor alinhado à direita
        const valorTexto = typeof item.value === 'number' ? 
          item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 
          String(item.value);
        const textWidth = pdf.getTextWidth(valorTexto);
        pdf.text(valorTexto, pageWidth - margin - textWidth - 10, currentY);
        
        currentY += 8;
      });
      
      return currentY + 10;
    };

    // Extrair dados do relatório
    const totalEntradas = relatorio.entradas?.total || 0;
    const pixEntradas = (relatorio.rateio?.central?.pix || 0) + (relatorio.rateio?.local?.pix || 0);
    const dinheiroEntradas = (relatorio.rateio?.central?.dinheiro || 0) + (relatorio.rateio?.local?.dinheiro || 0);
    
    const dadosEntradas = [
      { label: 'Total:', value: totalEntradas, destaque: true },
      { label: 'PIX:', value: pixEntradas },
      { label: 'Dinheiro:', value: dinheiroEntradas }
    ];

    yPos = criarSecaoElegante('TOTAL DE ENTRADAS', dadosEntradas, yPos);

    // SEÇÃO 2: DEMONSTRATIVO DE SALDOS E RATEIO
    const centralTotal = relatorio.rateio?.central?.total || 0;
    const centralPix = relatorio.rateio?.central?.pix || 0;
    const centralDinheiro = relatorio.rateio?.central?.dinheiro || 0;
    
    const localTotal = relatorio.rateio?.local?.total || 0;
    const localPix = relatorio.rateio?.local?.pix || 0;
    const localDinheiro = relatorio.rateio?.local?.dinheiro || 0;
    
    const despesasPagas = relatorio.despesas?.total || 0;
    const saldoLocalLiquido = localTotal - despesasPagas;
    
    const missoesTotal = relatorio.rateio?.missoes || 0;

    const dadosRateio = [
      { label: 'Para Central:', value: centralTotal, destaque: true },
      { label: '• PIX Central:', value: centralPix },
      { label: '• Dinheiro Central:', value: centralDinheiro },
      { label: '', value: '' }, // Espaço
      { label: 'Fica Local:', value: localTotal, destaque: true },
      { label: '• PIX Local:', value: localPix },
      { label: '• Dinheiro Local:', value: localDinheiro },
      { label: '• Despesas Pagas:', value: -despesasPagas },
      { label: '• Saldo Local (Líquido):', value: saldoLocalLiquido, destaque: true },
      { label: '', value: '' }, // Espaço
      { label: 'Para Missões:', value: missoesTotal, destaque: true }
    ];

    yPos = criarSecaoElegante('DEMONSTRATIVO DE SALDOS E RATEIO', dadosRateio, yPos);

    // RODAPÉ ELEGANTE
    const rodapeY = pageHeight - 25;
    pdf.setDrawColor(52, 152, 219);
    pdf.setLineWidth(0.5);
    pdf.line(margin, rodapeY - 5, pageWidth - margin, rodapeY - 5);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102);
    
    // Informações do rodapé
    pdf.text('Sistema de Gestão Financeira - Igreja', margin, rodapeY);
    const paginaTexto = 'Página 1 de 1';
    const paginaWidth = pdf.getTextWidth(paginaTexto);
    pdf.text(paginaTexto, pageWidth - margin - paginaWidth, rodapeY);

    // Salvar PDF
    pdf.save(nomeArquivo);
    return { success: true };

  } catch (error) {
    console.error('Erro ao gerar PDF Compilado:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gera PDF DETALHADO (Completo) em modo paisagem - UMA ÚNICA PÁGINA
 */
const gerarPDFDetalhado = async (relatorio, nomeArquivo) => {
  try {
    // Cria PDF em modo paisagem
    const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' = landscape
    const pageWidth = 297; // A4 landscape width
    const pageHeight = 210; // A4 landscape height
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);
    const columnWidth = (contentWidth - 8) / 2; // 2 colunas com espaço menor
    
    let yPos = margin;

    // Preparar texto do período
    const periodoTexto = relatorio.periodo && typeof relatorio.periodo === 'string'
      ? relatorio.periodo.toUpperCase()
      : (relatorio.periodo && relatorio.periodo.inicio ? `${new Date(relatorio.periodo.inicio).toLocaleDateString('pt-BR')} - ${new Date(relatorio.periodo.fim).toLocaleDateString('pt-BR')}`.toUpperCase() : '');

    // CABEÇALHO ELEGANTE COM GRADIENTE VISUAL
    // Fundo decorativo sutil
    pdf.setFillColor(248, 251, 255); // Azul muito claro
    pdf.rect(0, 0, pageWidth, 32, 'F');
    
    // Linha decorativa superior
    pdf.setDrawColor(52, 152, 219); // Azul elegante
    pdf.setLineWidth(1.5);
    pdf.line(0, 32, pageWidth, 32);
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(41, 128, 185); // Azul escuro elegante
    const titulo = `RELATÓRIO FINANCEIRO DETALHADO - ${periodoTexto}`;
    const tituloWidth = pdf.getTextWidth(titulo);
    pdf.text(titulo, (pageWidth - tituloWidth) / 2, 20);
    
    // Data de geração com ícone
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102);
    const dataGeracao = `🕒 Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
    const dataWidth = pdf.getTextWidth(dataGeracao);
    pdf.text(dataGeracao, pageWidth - margin - dataWidth, 28);
    
    yPos = 35;

    // Função auxiliar para criar tabela simples de resumo
    const criarTabelaResumo = (dados, x, y, largura, titulo) => {
      const alturaLinha = 6;
      let currentY = y;
      
      // Título da tabela
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(51, 51, 51); // #333333 - cinza escuro suave para títulos
      pdf.text(titulo, x, currentY);
      currentY += 8;
      
      // Dados
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 51, 51); // #333333 - cinza escuro suave para texto
      dados.forEach(item => {
        // Label em negrito para títulos importantes
        if (item.label.includes('Total') || item.label.includes('Saldo') || item.label.includes('Rateio -')) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }
        pdf.text(item.label, x + 2, currentY);
        
        // Valor alinhado à direita
        const valorTexto = typeof item.value === 'number' ? 
          item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 
          String(item.value);
        const textWidth = pdf.getTextWidth(valorTexto);
        pdf.text(valorTexto, x + largura - textWidth - 2, currentY);
        currentY += alturaLinha;
      });
      
      return currentY + 5;
    };

    // Extrair dados corretos do relatório seguindo a lógica de negócios
    const totalEntradas = relatorio.entradas?.total || 0;
    const totalDespesas = relatorio.despesas?.total || 0;
    
    const centralTotal = relatorio.rateio?.central?.total || 0;
    const localTotal = relatorio.rateio?.local?.total || 0;
    const saldoLocalLiquido = localTotal - totalDespesas;

    // LINHA 1: RESUMOS LADO A LADO - Usando a lógica correta de rateio
    const resumoA = [
      { label: 'TOTAL DE ENTRADAS', value: totalEntradas },
      { label: 'PIX:', value: (relatorio.rateio?.central?.pix || 0) + (relatorio.rateio?.local?.pix || 0) },
      { label: 'Dinheiro:', value: (relatorio.rateio?.central?.dinheiro || 0) + (relatorio.rateio?.local?.dinheiro || 0) }
    ];

    const resumoB = [
      { label: 'DEMONSTRATIVO DE SALDOS', value: '' },
      { label: 'Para Central:', value: centralTotal },
      { label: 'Fica Local:', value: localTotal },
      { label: 'Despesas Pagas:', value: -totalDespesas },
      { label: 'Saldo Local (Líquido):', value: saldoLocalLiquido },
      { label: 'Para Missões:', value: relatorio.rateio?.missoes || 0 }
    ];

    const leftX = margin;
    const rightX = margin + columnWidth + 8;
    const leftEndY = criarTabelaResumo(resumoA, leftX, yPos, columnWidth, `Resumo Financeiro (Compilado) - ${periodoTexto}`);
    const rightEndY = criarTabelaResumo(resumoB, rightX, yPos, columnWidth, `Demonstrativo de Saldos e Rateio - ${periodoTexto}`);

    yPos = Math.max(leftEndY, rightEndY) + 8;

    // Função para criar tabela de detalhes com zebra striping
    const criarTabelaDetalhes = (dados, colunas, x, y, largura, titulo) => {
      const alturaHeader = 8;
      const alturaLinha = 6;
      let currentY = y;
      
      // Título
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(51, 51, 51); // #333333 - cinza escuro suave
      pdf.text(titulo, x, currentY);
      currentY += 10;
      
      // Header - fundo azul claro suave
      pdf.setFillColor(235, 245, 251); // #EBF5FB - azul claro suave
      pdf.rect(x, currentY, largura, alturaHeader, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(x, currentY, largura, alturaHeader);
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(51, 51, 51); // #333333 - cinza escuro suave para cabeçalhos
      
      const larguraColunas = colunas.map(col => col.width * largura);
      let currentX = x;
      
      colunas.forEach((col, index) => {
        pdf.text(col.titulo, currentX + 1, currentY + 5);
        if (index > 0) {
          pdf.line(currentX, currentY, currentX, currentY + alturaHeader);
        }
        currentX += larguraColunas[index];
      });
      
      currentY += alturaHeader;
      
      // Dados (limitar a 10 itens para caber na página)
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      pdf.setTextColor(51, 51, 51); // #333333 - cinza escuro suave para texto
      
      const dadosLimitados = dados.slice(0, 10);
      
      dadosLimitados.forEach((item, index) => {
        // Zebra striping - cinza bem claro
        if (index % 2 === 0) {
          pdf.setFillColor(249, 249, 249); // #F9F9F9 - cinza bem claro
          pdf.rect(x, currentY, largura, alturaLinha, 'F');
        }
        
        pdf.setDrawColor(230, 230, 230);
        pdf.rect(x, currentY, largura, alturaLinha);
        
        currentX = x;
        colunas.forEach((col, colIndex) => {
          const valor = col.campo ? item[col.campo] : col.valor(item);
          let valorTexto = valor ? valor.toString() : '';
          
          // Truncar texto se muito longo
          const maxWidth = larguraColunas[colIndex] - 2;
          while (pdf.getTextWidth(valorTexto) > maxWidth && valorTexto.length > 0) {
            valorTexto = valorTexto.slice(0, -1);
          }
          
          if (col.align === 'right') {
            const textWidth = pdf.getTextWidth(valorTexto);
            pdf.text(valorTexto, currentX + larguraColunas[colIndex] - textWidth - 1, currentY + 4);
          } else {
            pdf.text(valorTexto, currentX + 1, currentY + 4);
          }
          
          if (colIndex > 0) {
            pdf.line(currentX, currentY, currentX, currentY + alturaLinha);
          }
          
          currentX += larguraColunas[colIndex];
        });
        
        currentY += alturaLinha;
      });
      
      if (dados.length > 10) {
        currentY += 3;
        pdf.setFontSize(6);
        pdf.setTextColor(102, 102, 102); // cinza médio para textos informativos
        pdf.text(`... e mais ${dados.length - 10} ${dados.length === 1 ? 'item' : 'itens'}`, x, currentY);
        pdf.setTextColor(51, 51, 51); // voltar ao cinza escuro suave
        currentY += 5;
      }
      
      return currentY + 5;
    };

    // LINHA 2: DETALHES LADO A LADO
    const colunasEntradas = [
      { titulo: 'Data', campo: 'data', width: 0.15 },
      { titulo: 'Tipo', campo: 'tipo', width: 0.18 },
      { titulo: 'Membro', campo: 'membroNome', width: 0.32 },  // CORRIGIDO: usar membroNome
      { titulo: 'Forma', campo: 'formaRecebimento', width: 0.13 },
      { titulo: 'Valor', valor: (item) => (typeof item.valor === 'number' ? item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : item.valor), width: 0.22, align: 'right' }
    ];

    const colunasDespesas = [
      { titulo: 'Data', campo: 'vencimento', width: 0.15 },
      { titulo: 'Categoria', campo: 'categoria', width: 0.20 },
      { titulo: 'Descrição', campo: 'descricao', width: 0.35 },
      { titulo: 'Forma', campo: 'formaPagamento', width: 0.08 },
      { titulo: 'Valor', valor: (item) => (typeof item.valor === 'number' ? item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : item.valor), width: 0.22, align: 'right' }
    ];

    // Formatar dados das entradas
    const listaEntradas = relatorio.entradas?.lista || [];
    const entradasFormatadas = listaEntradas.map(entrada => ({
      ...entrada,
      data: entrada.data ? (entrada.data instanceof Date ? entrada.data : new Date(entrada.data)).toLocaleDateString('pt-BR') : 'N/A',
      tipo: entrada.tipo ? entrada.tipo.replace('_', ' ').toUpperCase() : 'N/A',
      membroNome: entrada.membroNome || '', // CORRIGIDO: usar membroNome direto do Firebase
      formaRecebimento: entrada.formaRecebimento || 'PIX'
    }));

    // Formatar dados das despesas
    const listaDespesas = relatorio.despesas?.lista || [];
    const despesasFormatadas = listaDespesas.map(despesa => {
      let dataFormatada = 'N/A';
      if (despesa.vencimento) {
        try {
          dataFormatada = new Date(despesa.vencimento).toLocaleDateString('pt-BR');
        } catch (e) {
          console.warn('Erro ao formatar data:', e);
        }
      } else if (despesa.dataPagamento) {
        try {
          const data = despesa.dataPagamento instanceof Date ? despesa.dataPagamento : new Date(despesa.dataPagamento);
          dataFormatada = data.toLocaleDateString('pt-BR');
        } catch (e) {
          console.warn('Erro ao formatar data:', e);
        }
      }
      
      return {
        ...despesa,
        vencimento: dataFormatada,
        categoria: despesa.categoria || 'Outros',
        formaPagamento: despesa.formaPagamento || 'Dinheiro',
        descricao: despesa.descricao || 'Sem descrição'
      };
    });

    // Criar tabelas de detalhes
    const finalYEntradas = criarTabelaDetalhes(entradasFormatadas, colunasEntradas, leftX, yPos, columnWidth, `ENTRADAS DETALHADAS (${periodoTexto})`);
    const finalYDespesas = criarTabelaDetalhes(despesasFormatadas, colunasDespesas, rightX, yPos, columnWidth, `DESPESAS DETALHADAS (${periodoTexto})`);

    // Adicionar totais nas tabelas
    const maxY = Math.max(finalYEntradas, finalYDespesas);
    
    // Total das Entradas
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(52, 152, 219); // Azul elegante
    const totalEntradasTexto = `Valor Total das Entradas: ${totalEntradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    const totalEntradasWidth = pdf.getTextWidth(totalEntradasTexto);
    pdf.text(totalEntradasTexto, leftX + columnWidth - totalEntradasWidth, maxY + 5);
    
    // Total das Despesas
    const totalDespesasTexto = `Valor Total das Saídas: ${totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    const totalDespesasWidth = pdf.getTextWidth(totalDespesasTexto);
    pdf.text(totalDespesasTexto, rightX + columnWidth - totalDespesasWidth, maxY + 5);

    // RODAPÉ ELEGANTE COM VISUAL PROFISSIONAL
    const rodapeY = pageHeight - 15;
    
    // Fundo decorativo do rodapé
    pdf.setFillColor(248, 251, 255); // Azul muito claro
    pdf.rect(0, rodapeY - 10, pageWidth, 25, 'F');
    
    // Linha decorativa superior
    pdf.setDrawColor(52, 152, 219);
    pdf.setLineWidth(0.8);
    pdf.line(margin, rodapeY - 8, pageWidth - margin, rodapeY - 8);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102);
    
    // Informações do sistema à esquerda
    pdf.text('💼 Sistema de Gestão Financeira - Igreja', margin, rodapeY);
    
    // Número da página no centro
    const paginaTexto = '📄 Página 1 de 1 - Relatório Detalhado';
    const paginaWidth = pdf.getTextWidth(paginaTexto);
    pdf.text(paginaTexto, (pageWidth - paginaWidth) / 2, rodapeY);
    
    // Status à direita
    pdf.setTextColor(34, 139, 34); // Verde para "sucesso"
    const statusTexto = '✅ Dados Verificados';
    const statusWidth = pdf.getTextWidth(statusTexto);
    pdf.text(statusTexto, pageWidth - margin - statusWidth, rodapeY);

    // Salvar PDF
    pdf.save(nomeArquivo);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao gerar PDF profissional:', error);
    throw error;
  }
};/**
 * Método original de exportação (fallback)
 */
const exportarHTMLParaPDF = async (elementId, nomeArquivo) => {
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