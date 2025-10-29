import { buscarEntradas } from './entradas';

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