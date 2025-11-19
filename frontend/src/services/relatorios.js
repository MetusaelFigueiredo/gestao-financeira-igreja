import { buscarEntradas } from './entradas';
import { buscarDespesas } from './despesas';

// 🚀 OTIMIZAÇÃO: Cache para relatórios
let cacheRelatorios = {};
const CACHE_DURACAO = 5 * 60 * 1000; // 5 minutos

/**
 * Gerar chave de cache para período
 */
const gerarChaveCache = (dataInicio, dataFim) => {
  return `${dataInicio.getTime()}-${dataFim.getTime()}`;
};

/**
 * Busca dados para relatório de um período específico
 * 🚀 OTIMIZAÇÃO: Usa cache de entradas/despesas já carregados
 * @param {Date} dataInicio 
 * @param {Date} dataFim 
 */
export const buscarDadosRelatorio = async (dataInicio, dataFim) => {
  try {
    // 🚀 Verificar cache de relatório
    const chaveCache = gerarChaveCache(dataInicio, dataFim);
    const cache = cacheRelatorios[chaveCache];
    
    if (cache && (Date.now() - cache.timestamp < CACHE_DURACAO)) {
      console.log('✅ Relatório retornado do cache (0 leituras)');
      return cache.relatorio;
    }
    
    // 🚀 OTIMIZAÇÃO: Busca entradas e despesas em paralelo (não sequencial)
    // Além disso, essas funções já usam cache interno, evitando leituras redundantes
    const [resultadoEntradas, despesas] = await Promise.all([
      buscarEntradas(),
      buscarDespesas()
    ]);
    
    if (!resultadoEntradas.success) {
      return { success: false, error: resultadoEntradas.error };
    }

    console.log(`✅ Dados carregados para relatório (podem ter vindo do cache)`);

    // Filtra entradas do período
    const entradasPeriodo = resultadoEntradas.entradas.filter(entrada => {
      const dataEntrada = entrada.data instanceof Date ? entrada.data : new Date(entrada.data);
      dataEntrada.setHours(0, 0, 0, 0);
      return dataEntrada >= dataInicio && dataEntrada <= dataFim;
    });

    // Filtra despesas PAGAS no período
    const despesasPeriodo = despesas.filter(despesa => {
      if (despesa.status !== 'Paga' || !despesa.dataPagamento) return false;
      const dataPagamento = despesa.dataPagamento instanceof Date ? 
        despesa.dataPagamento : new Date(despesa.dataPagamento);
      dataPagamento.setHours(0, 0, 0, 0);
      return dataPagamento >= dataInicio && dataPagamento <= dataFim;
    });

    // Calcula totais de entradas por tipo
    let totalDizimos = 0;
    let totalOfertas = 0;
    let totalSantaCeia = 0;
    let totalOutros = 0;

    entradasPeriodo.forEach(entrada => {
      if (entrada.tipo === 'dizimo') {
        totalDizimos += entrada.valor;
      } else if (entrada.tipo === 'oferta') {
        totalOfertas += entrada.valor;
      } else if (entrada.tipo === 'santa_ceia') {
        totalSantaCeia += entrada.valor;
      } else {
        totalOutros += entrada.valor;
      }
    });

    const totalEntradas = totalDizimos + totalOfertas + totalSantaCeia + totalOutros;

    // Calcula rateios
    let totalCentral = 0;
    let totalLocal = 0;
    let totalMissoes = 0;
    let pixCentral = 0;
    let dinheiroCentral = 0;
    let pixLocal = 0;
    let dinheiroLocal = 0;

    entradasPeriodo.forEach(entrada => {
      if (entrada.rateio) {
        const forma = entrada.formaRecebimento || 'pix';
        
        totalCentral += entrada.rateio.central || 0;
        totalLocal += entrada.rateio.local || 0;
        totalMissoes += entrada.rateio.missoes || 0;

        // PIX/Dinheiro Central
        if (entrada.rateio.central > 0) {
          if (forma === 'pix') {
            pixCentral += entrada.rateio.central;
          } else {
            dinheiroCentral += entrada.rateio.central;
          }
        }

        // PIX/Dinheiro Local
        if (entrada.rateio.local > 0) {
          if (forma === 'pix') {
            pixLocal += entrada.rateio.local;
          } else {
            dinheiroLocal += entrada.rateio.local;
          }
        }
      }
    });

    // Calcula totais de despesas por categoria
    const despesasPorCategoria = {};
    let totalDespesas = 0;

    despesasPeriodo.forEach(despesa => {
      const categoria = despesa.categoria || 'Sem categoria';
      if (!despesasPorCategoria[categoria]) {
        despesasPorCategoria[categoria] = 0;
      }
      despesasPorCategoria[categoria] += despesa.valor;
      totalDespesas += despesa.valor;
    });

    // Calcula saldo
    const saldoMes = totalLocal - totalDespesas;

    const relatorio = {
      success: true,
      relatorio: {
        periodo: {
          inicio: dataInicio,
          fim: dataFim
        },
        entradas: {
          lista: entradasPeriodo,
          porTipo: {
            dizimos: totalDizimos,
            ofertas: totalOfertas,
            santaCeia: totalSantaCeia,
            outros: totalOutros
          },
          total: totalEntradas
        },
        rateio: {
          central: {
            total: totalCentral,
            pix: pixCentral,
            dinheiro: dinheiroCentral
          },
          local: {
            total: totalLocal,
            pix: pixLocal,
            dinheiro: dinheiroLocal
          },
          missoes: totalMissoes
        },
        despesas: {
          lista: despesasPeriodo,
          porCategoria: despesasPorCategoria,
          total: totalDespesas
        },
        resumo: {
          totalEntradas,
          totalDespesas,
          saldoMes
        }
      }
    };
    
    // 🚀 Armazenar no cache
    cacheRelatorios[chaveCache] = {
      relatorio,
      timestamp: Date.now()
    };
    
    return relatorio;
  } catch (error) {
    console.error('Erro ao buscar dados do relatório:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gera relatório do mês específico
 * @param {number} mes - Mês (0-11)
 * @param {number} ano - Ano
 */
export const gerarRelatorioMes = async (mes, ano) => {
  const dataInicio = new Date(ano, mes, 1);
  const dataFim = new Date(ano, mes + 1, 0); // Último dia do mês
  dataInicio.setHours(0, 0, 0, 0);
  dataFim.setHours(23, 59, 59, 999);
  
  return await buscarDadosRelatorio(dataInicio, dataFim);
};

/**
 * Formata dados do relatório para exportação
 */
export const formatarRelatorioParaExcel = (relatorio) => {
  // Aba 1: Resumo
  const resumo = [
    ['RELATÓRIO DE FECHAMENTO MENSAL'],
    [''],
    ['Período:', `${relatorio.periodo.inicio.toLocaleDateString('pt-BR')} até ${relatorio.periodo.fim.toLocaleDateString('pt-BR')}`],
    [''],
    ['ENTRADAS DO MÊS'],
    ['Dízimos', relatorio.entradas.porTipo.dizimos],
    ['Ofertas', relatorio.entradas.porTipo.ofertas],
    ['Santa Ceia', relatorio.entradas.porTipo.santaCeia],
    ['Outras Entradas', relatorio.entradas.porTipo.outros],
    ['TOTAL DE ENTRADAS', relatorio.entradas.total],
    [''],
    ['RATEIO DAS ENTRADAS'],
    ['Para Central (60%)', relatorio.rateio.central.total],
    ['  • PIX', relatorio.rateio.central.pix],
    ['  • Dinheiro', relatorio.rateio.central.dinheiro],
    ['Fica Local (40%)', relatorio.rateio.local.total],
    ['  • PIX', relatorio.rateio.local.pix],
    ['  • Dinheiro', relatorio.rateio.local.dinheiro],
    ['Missões', relatorio.rateio.missoes],
    [''],
    ['DESPESAS DO MÊS'],
    ...Object.entries(relatorio.despesas.porCategoria).map(([cat, valor]) => [cat, valor]),
    ['TOTAL DE DESPESAS', relatorio.despesas.total],
    [''],
    ['RESUMO FINANCEIRO'],
    ['Entrada Local', relatorio.rateio.local.total],
    ['(-) Despesas', relatorio.despesas.total],
    ['SALDO DO MÊS', relatorio.resumo.saldoMes]
  ];

  // Aba 2: Entradas Detalhadas
  const entradasDetalhadas = [
    ['Data', 'Tipo', 'Membro', 'Forma de Recebimento', 'Valor', 'Central', 'Local', 'Missões'],
    ...relatorio.entradas.lista.map(e => [
      e.data instanceof Date ? e.data.toLocaleDateString('pt-BR') : new Date(e.data).toLocaleDateString('pt-BR'),
      e.tipo,
      e.membro?.nome || '-',
      e.formaRecebimento || 'pix',
      e.valor,
      e.rateio?.central || 0,
      e.rateio?.local || 0,
      e.rateio?.missoes || 0
    ])
  ];

  // Aba 3: Despesas Detalhadas
  const despesasDetalhadas = [
    ['Data Pagamento', 'Descrição', 'Categoria', 'Forma de Pagamento', 'Valor'],
    ...relatorio.despesas.lista.map(d => [
      d.dataPagamento instanceof Date ? d.dataPagamento.toLocaleDateString('pt-BR') : new Date(d.dataPagamento).toLocaleDateString('pt-BR'),
      d.descricao,
      d.categoria || 'Sem categoria',
      d.formaPagamento || '-',
      d.valor
    ])
  ];

  return {
    resumo,
    entradasDetalhadas,
    despesasDetalhadas
  };
};  