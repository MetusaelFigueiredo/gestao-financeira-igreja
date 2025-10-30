import { buscarEntradas } from './entradas';
import { buscarDespesas } from './despesas';
import { db } from './firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

// Configuração da meta de missões (pode ser alterada conforme necessário)
const META_MISSOES = 5000;

/**
 * Busca a meta de missões configurada no Firestore
 */
export const buscarMetaMissoesConfig = async () => {
  try {
    const configRef = doc(db, 'configuracoes', 'config-geral');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists() && configDoc.data().metaMissoes) {
      return configDoc.data().metaMissoes;
    }
    
    return META_MISSOES; // valor padrão
  } catch (error) {
    console.error('Erro ao buscar meta de missões:', error);
    return META_MISSOES;
  }
};

/**
 * Atualiza a meta de missões no Firestore
 */
export const atualizarMetaMissoes = async (novaMeta) => {
  try {
    const configRef = doc(db, 'configuracoes', 'config-geral');
    
    await setDoc(configRef, {
      metaMissoes: parseFloat(novaMeta),
      atualizadoEm: Timestamp.now()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar meta de missões:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calcula os saldos totais de todas as contas separando por forma de recebimento
 */
export const calcularSaldos = async () => {
  try {
    const resultado = await buscarEntradas();
    
    if (!resultado.success) {
      return { success: false, error: resultado.error };
    }

    const entradas = resultado.entradas;

    // Inicializa saldos
    const saldos = {
      central: 0,
      centralPix: 0,
      centralDinheiro: 0,
      local: 0,
      localPix: 0,
      localDinheiro: 0,
      missoes: 0,
      missoesPix: 0,
      missoesDinheiro: 0,
      total: 0
    };

    // Soma os rateios de cada entrada separando por forma de recebimento
    entradas.forEach(entrada => {
      if (entrada.rateio) {
        const formaRecebimento = entrada.formaRecebimento || 'pix';
        
        // Central
        if (entrada.rateio.central > 0) {
          saldos.central += entrada.rateio.central;
          if (formaRecebimento === 'pix') {
            saldos.centralPix += entrada.rateio.central;
          } else {
            saldos.centralDinheiro += entrada.rateio.central;
          }
        }
        
        // Local
        if (entrada.rateio.local > 0) {
          saldos.local += entrada.rateio.local;
          if (formaRecebimento === 'pix') {
            saldos.localPix += entrada.rateio.local;
          } else {
            saldos.localDinheiro += entrada.rateio.local;
          }
        }
        
        // Missões
        if (entrada.rateio.missoes > 0) {
          saldos.missoes += entrada.rateio.missoes;
          if (formaRecebimento === 'pix') {
            saldos.missoesPix += entrada.rateio.missoes;
          } else {
            saldos.missoesDinheiro += entrada.rateio.missoes;
          }
        }
      }
    });

    saldos.total = saldos.central + saldos.local + saldos.missoes;

    return { success: true, saldos };
  } catch (error) {
    console.error('Erro ao calcular saldos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calcula estatísticas do mês atual
 */
export const calcularEstatisticasMes = async () => {
  try {
    const resultado = await buscarEntradas();
    
    if (!resultado.success) {
      return { success: false, error: resultado.error };
    }

    const entradas = resultado.entradas;
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    // Filtra entradas do mês atual
    const entradasMesAtual = entradas.filter(entrada => {
      const dataEntrada = entrada.data;
      return dataEntrada.getMonth() === mesAtual && 
             dataEntrada.getFullYear() === anoAtual;
    });

    // Filtra entradas do mês anterior
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    
    const entradasMesAnterior = entradas.filter(entrada => {
      const dataEntrada = entrada.data;
      return dataEntrada.getMonth() === mesAnterior && 
             dataEntrada.getFullYear() === anoAnterior;
    });

    // Calcula totais
    const totalMesAtual = entradasMesAtual.reduce((sum, e) => sum + e.valor, 0);
    const totalMesAnterior = entradasMesAnterior.reduce((sum, e) => sum + e.valor, 0);

    // Calcula variação percentual
    let variacao = 0;
    if (totalMesAnterior > 0) {
      variacao = ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100;
    }

    // Conta por tipo
    const porTipo = {
      dizimo: 0,
      oferta: 0,
      santa_ceia: 0,
      outros: 0
    };

    entradasMesAtual.forEach(entrada => {
      if (entrada.tipo === 'dizimo') {
        porTipo.dizimo += entrada.valor;
      } else if (entrada.tipo === 'oferta') {
        porTipo.oferta += entrada.valor;
      } else if (entrada.tipo === 'santa_ceia') {
        porTipo.santa_ceia += entrada.valor;
      } else {
        porTipo.outros += entrada.valor;
      }
    });

    return {
      success: true,
      estatisticas: {
        totalMesAtual,
        totalMesAnterior,
        variacao,
        quantidadeEntradas: entradasMesAtual.length,
        porTipo
      }
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Busca e calcula o resumo financeiro do mês atual
 * Retorna: entrada local, despesas pagas, saldo do mês, detalhamento de entradas (central, local, missões, PIX, dinheiro)
 */
export const buscarResumoFinanceiro = async () => {
  try {
    const resultado = await buscarEntradas();
    
    if (!resultado.success) {
      return { success: false, error: resultado.error };
    }

    const entradas = resultado.entradas;
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    // Filtra entradas do mês atual
    const entradasMesAtual = entradas.filter(entrada => {
      const dataEntrada = entrada.data instanceof Date ? entrada.data : new Date(entrada.data);
      return dataEntrada.getMonth() === mesAtual && 
             dataEntrada.getFullYear() === anoAtual;
    });

    // Inicializa totais
    let totalCentral = 0;
    let totalLocal = 0;
    let totalMissoes = 0;
    let totalPixLocal = 0;
    let totalDinheiroLocal = 0;
    let totalPixCentral = 0;
    let totalDinheiroCentral = 0;

    // Calcula rateios e formas de pagamento
    entradasMesAtual.forEach(entrada => {
      if (entrada.rateio) {
        const formaRecebimento = entrada.formaRecebimento || 'pix';
        
        // Soma rateios
        totalCentral += entrada.rateio.central || 0;
        totalLocal += entrada.rateio.local || 0;
        totalMissoes += entrada.rateio.missoes || 0;

        // PIX e Dinheiro para CENTRAL
        if (entrada.rateio.central > 0) {
          if (formaRecebimento === 'pix') {
            totalPixCentral += entrada.rateio.central;
          } else if (formaRecebimento === 'dinheiro') {
            totalDinheiroCentral += entrada.rateio.central;
          }
        }

        // PIX e Dinheiro para LOCAL
        if (entrada.rateio.local > 0) {
          if (formaRecebimento === 'pix') {
            totalPixLocal += entrada.rateio.local;
          } else if (formaRecebimento === 'dinheiro') {
            totalDinheiroLocal += entrada.rateio.local;
          }
        }
      }
    });

    // Busca despesas pagas do mês
    const despesas = await buscarDespesas();
    const despesasPagasMes = despesas.filter(d => {
      if (d.status !== 'Paga' || !d.dataPagamento) return false;
      const dataPagamento = d.dataPagamento instanceof Date ? d.dataPagamento : new Date(d.dataPagamento);
      return dataPagamento.getMonth() === mesAtual && 
             dataPagamento.getFullYear() === anoAtual;
    });

    const totalDespesasPagas = despesasPagasMes.reduce((sum, d) => sum + d.valor, 0);

    // Calcula saldo do mês (APENAS LOCAL - DESPESAS)
    const saldoMes = totalLocal - totalDespesasPagas;

    // Calcula percentuais de PIX e Dinheiro LOCAL
    const totalLocalRecebido = totalPixLocal + totalDinheiroLocal;
    const percentualPixLocal = totalLocalRecebido > 0 ? (totalPixLocal / totalLocalRecebido) * 100 : 0;
    const percentualDinheiroLocal = totalLocalRecebido > 0 ? (totalDinheiroLocal / totalLocalRecebido) * 100 : 0;

    // Calcula percentuais de PIX e Dinheiro CENTRAL
    const totalCentralRecebido = totalPixCentral + totalDinheiroCentral;
    const percentualPixCentral = totalCentralRecebido > 0 ? (totalPixCentral / totalCentralRecebido) * 100 : 0;
    const percentualDinheiroCentral = totalCentralRecebido > 0 ? (totalDinheiroCentral / totalCentralRecebido) * 100 : 0;

    return {
      success: true,
      resumo: {
        totalCentral,
        totalLocal,
        totalMissoes,
        totalPix: totalPixLocal,
        totalDinheiro: totalDinheiroLocal,
        percentualPix: percentualPixLocal.toFixed(1),
        percentualDinheiro: percentualDinheiroLocal.toFixed(1),
        totalPixCentral,
        totalDinheiroCentral,
        percentualPixCentral: percentualPixCentral.toFixed(1),
        percentualDinheiroCentral: percentualDinheiroCentral.toFixed(1),
        totalPixLocal,
        totalDinheiroLocal,
        percentualPixLocal: percentualPixLocal.toFixed(1),
        percentualDinheiroLocal: percentualDinheiroLocal.toFixed(1),
        totalDespesasPagas,
        saldoMes
      }
    };
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Busca despesas pendentes dos próximos 15 dias agrupadas por urgência
 * Grupos: vencidas, próximos 7 dias, 8-15 dias
 */
export const buscarDespesasPendentes = async () => {
  try {
    const despesas = await buscarDespesas();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const data15Dias = new Date(hoje);
    data15Dias.setDate(data15Dias.getDate() + 15);

    const data7Dias = new Date(hoje);
    data7Dias.setDate(data7Dias.getDate() + 7);

    // Filtra apenas despesas pendentes ou vencidas até 15 dias
    const despesasPendentes = despesas.filter(d => {
      if (d.status === 'Paga') return false;
      
      const vencimento = new Date(d.vencimento);
      vencimento.setHours(0, 0, 0, 0);
      
      return vencimento <= data15Dias;
    });

    // Agrupa por urgência
    const vencidas = [];
    const proximos7Dias = [];
    const de8a15Dias = [];

    despesasPendentes.forEach(d => {
      const vencimento = new Date(d.vencimento);
      vencimento.setHours(0, 0, 0, 0);

      if (vencimento < hoje || d.status === 'Vencida') {
        vencidas.push(d);
      } else if (vencimento <= data7Dias) {
        proximos7Dias.push(d);
      } else if (vencimento <= data15Dias) {
        de8a15Dias.push(d);
      }
    });

    // Calcula totais
    const totalVencidas = vencidas.reduce((sum, d) => sum + d.valor, 0);
    const totalProximos7 = proximos7Dias.reduce((sum, d) => sum + d.valor, 0);
    const totalDe8a15 = de8a15Dias.reduce((sum, d) => sum + d.valor, 0);
    const totalGeral = totalVencidas + totalProximos7 + totalDe8a15;

    return {
      success: true,
      despesas: {
        vencidas,
        proximos7Dias,
        de8a15Dias,
        totais: {
          vencidas: totalVencidas,
          proximos7: totalProximos7,
          de8a15: totalDe8a15,
          geral: totalGeral
        }
      }
    };
  } catch (error) {
    console.error('Erro ao buscar despesas pendentes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Busca e calcula progresso da meta de missões
 */
export const buscarMetaMissoes = async () => {
  try {
    const metaConfig = await buscarMetaMissoesConfig();
    const resultado = await buscarEntradas();
    
    if (!resultado.success) {
      return { success: false, error: resultado.error };
    }

    const entradas = resultado.entradas;
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    // Filtra entradas do mês atual
    const entradasMesAtual = entradas.filter(entrada => {
      const dataEntrada = entrada.data instanceof Date ? entrada.data : new Date(entrada.data);
      return dataEntrada.getMonth() === mesAtual && 
             dataEntrada.getFullYear() === anoAtual;
    });

    // Soma rateio de missões
    let totalMissoes = 0;
    entradasMesAtual.forEach(entrada => {
      if (entrada.rateio && entrada.rateio.missoes) {
        totalMissoes += entrada.rateio.missoes;
      }
    });

    const progresso = (totalMissoes / metaConfig) * 100;
    const falta = Math.max(0, metaConfig - totalMissoes);

    return {
      success: true,
      missoes: {
        arrecadado: totalMissoes,
        meta: metaConfig,
        progresso: Math.min(100, progresso).toFixed(1),
        falta
      }
    };
  } catch (error) {
    console.error('Erro ao buscar meta de missões:', error);
    return { success: false, error: error.message };
  }
};