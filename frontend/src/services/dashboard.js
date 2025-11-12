import { buscarEntradas, escutarEntradas } from './entradas';
import { buscarDespesas, buscarDespesasPorPeriodo } from './despesas';
import { db } from './firebase';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, collection, query, orderBy } from 'firebase/firestore';

// Configuração da meta de missões (pode ser alterada conforme necessário)
const META_MISSOES = 5000;

/**
 * 🔄 SALDO ROTATIVO: Calcula o saldo TOTAL disponível do mês anterior
 * Regra: (Saldo TOTAL do Mês Anterior) - esse é o dinheiro físico disponível
 * CORREÇÃO: Transfere o saldo COMPLETO, não apenas o líquido local
 */
export const calcularSaldoRotativo = async (ano, mes) => {
  try {
    // Calcular mês anterior (considerando virada de ano)
    let anoAnterior = ano;
    let mesAnterior = mes - 1;
    
    if (mesAnterior < 0) {
      mesAnterior = 11; // Dezembro do ano anterior
      anoAnterior = ano - 1;
    }

    console.log(`🔄 Calculando saldo TOTAL disponível de ${mesAnterior + 1}/${anoAnterior} para ${mes + 1}/${ano}`);

    // 🚨 PROBLEMA IDENTIFICADO: Estamos buscando o mês anterior SEM saldo rotativo!
    // Isso significa que estamos pegando apenas o saldo LOCAL de novembro (1.370)
    // ao invés do saldo TOTAL de novembro (que deveria incluir os 4.000 de outubro)
    
    // 🔧 SOLUÇÃO: Buscar o saldo COM rotativo do mês anterior (incluirSaldoRotativo = true)
    console.log(`🔍 BUSCANDO saldo TOTAL do mês anterior (${mesAnterior + 1}/${anoAnterior}) COM saldo rotativo...`);
    const resumoMesAnterior = await buscarResumoFinanceiro(anoAnterior, mesAnterior, true); // true = COM saldo rotativo
    
    console.log(`🔍 Resumo do mês anterior (${mesAnterior + 1}/${anoAnterior}):`, resumoMesAnterior.success ? 'SUCESSO' : 'ERRO');
    
    if (!resumoMesAnterior.success) {
      console.log(`❌ Não foi possível obter resumo de ${mesAnterior + 1}/${anoAnterior}:`, resumoMesAnterior.error);
      return {
        saldoRotativo: 0,
        detalhes: {
          anoAnterior,
          mesAnterior: mesAnterior + 1,
          erro: 'Resumo do mês anterior não encontrado'
        }
      };
    }

    // O saldo rotativo é o saldo TOTAL do mês anterior (com rotativo incluído)
    // Isso garante que transferimos TODA a quantia física disponível
    const saldoRotativo = resumoMesAnterior.resumo.saldoMes || 0;

    console.log(`💰 ===== DADOS DO MÊS ANTERIOR (${mesAnterior + 1}/${anoAnterior}) =====`);
    console.log(`   💵 Entradas locais: R$ ${resumoMesAnterior.resumo.totalLocal || 0}`);
    console.log(`   🔄 Saldo anterior recebido: R$ ${resumoMesAnterior.resumo.saldoRotativo || 0}`);
    console.log(`   💸 Despesas pagas: R$ ${resumoMesAnterior.resumo.totalDespesasPagas || 0}`);
    console.log(`   💰 SALDO TOTAL: R$ ${saldoRotativo.toFixed(2)} ⭐ (Este valor será transferido)`);
    console.log(`   📋 Fórmula: Local + Anterior - Despesas = ${resumoMesAnterior.resumo.totalLocal || 0} + ${resumoMesAnterior.resumo.saldoRotativo || 0} - ${resumoMesAnterior.resumo.totalDespesasPagas || 0} = ${saldoRotativo.toFixed(2)}`);
    console.log(`============================================`);

    return {
      saldoRotativo,
      detalhes: {
        anoAnterior,
        mesAnterior: mesAnterior + 1,
        saldoTotalAnterior: saldoRotativo,
        observacao: 'Saldo total transferido (dinheiro físico real)'
      }
    };
    
  } catch (error) {
    console.error('❌ Erro ao calcular saldo rotativo:', error);
    return {
      saldoRotativo: 0,
      detalhes: null
    };
  }
};

/**
 * Calcula o rateio baseado no tipo de entrada
 */
const calcularRateio = (tipo, valor) => {
  const valorNum = parseFloat(valor) || 0;
  
  if (tipo === 'santa_ceia') {
    return {
      central: 0,
      local: 0,
      missoes: valorNum
    };
  } else if (tipo === 'dizimo' || tipo === 'oferta') {
    return {
      central: valorNum * 0.60,
      local: valorNum * 0.40,
      missoes: 0
    };
  } else {
    return {
      central: 0,
      local: valorNum,
      missoes: 0
    };
  }
};

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
 * Busca e calcula o resumo financeiro do mês especificado
 * Retorna: entrada local, despesas pagas, saldo do mês, detalhamento de entradas (central, local, missões, PIX, dinheiro)
 * @param {number} ano - Ano para filtrar (null = ano atual)
 * @param {number} mes - Mês para filtrar (null = mês atual)  
 * @param {boolean} incluirSaldoRotativo - Se deve incluir saldo rotativo (evitar recursão)
 */
export const buscarResumoFinanceiro = async (ano = null, mes = null, incluirSaldoRotativo = true) => {
  try {
    const resultado = await buscarEntradas();
    
    if (!resultado.success) {
      return { success: false, error: resultado.error };
    }

    const entradas = resultado.entradas;
    
    // Usar filtros fornecidos ou data atual como padrão
    const agora = new Date();
    const mesAlvo = mes !== null ? mes : agora.getMonth();
    const anoAlvo = ano !== null ? ano : agora.getFullYear();

    // Filtra entradas do mês/ano especificado
    const entradasMesAtual = entradas.filter(entrada => {
      const dataEntrada = entrada.data instanceof Date ? entrada.data : new Date(entrada.data);
      return dataEntrada.getMonth() === mesAlvo && 
             dataEntrada.getFullYear() === anoAlvo;
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
      // CORREÇÃO: Calcular rateio se não existir
      let rateio = entrada.rateio;
      if (!rateio) {
        rateio = calcularRateio(entrada.tipo, entrada.valor);
        console.log(`🔧 DEBUG - Rateio calculado para entrada ${entrada.id}:`, rateio);
      }
      
      const formaRecebimento = entrada.formaRecebimento || 'pix';
      
      // Soma rateios
      totalCentral += rateio.central || 0;
      totalLocal += rateio.local || 0;
      totalMissoes += rateio.missoes || 0;

      // PIX e Dinheiro para CENTRAL
      if (rateio.central > 0) {
        if (formaRecebimento === 'pix') {
          totalPixCentral += rateio.central;
        } else if (formaRecebimento === 'dinheiro') {
          totalDinheiroCentral += rateio.central;
        }
      }

      // PIX e Dinheiro para LOCAL
      if (rateio.local > 0) {
        if (formaRecebimento === 'pix') {
          totalPixLocal += rateio.local;
        } else if (formaRecebimento === 'dinheiro') {
          totalDinheiroLocal += rateio.local;
        }
      }
    });

    // Busca despesas pagas do mês/ano especificado
    // Observação: algumas despesas podem ter status 'Paga' mas não ter o campo dataPagamento
    // (por exemplo: lançadas já como pagas manualmente). Para ser resiliente, consideramos
    // uma despesa como paga para o período quando:
    // - tem dataPagamento no mês/ano selecionado OR
    // - tem status 'Paga' e não tem dataPagamento, mas seu vencimento cai no mês/ano selecionado
    const despesas = await buscarDespesas();
    
    console.log(`🔍 DEBUG - Total de despesas carregadas: ${despesas.length}`);
    console.log(`🔍 DEBUG - Filtrando para mês ${mesAlvo + 1}/${anoAlvo}`);
    
    const despesasPagasMes = despesas.filter(d => {
      if (d.status !== 'Paga') return false;

      const dataPagamento = d.dataPagamento ? (d.dataPagamento instanceof Date ? d.dataPagamento : new Date(d.dataPagamento)) : null;
      const vencimento = d.vencimento ? (new Date(d.vencimento)) : null;

      // Se houver dataPagamento, use-a
      if (dataPagamento) {
        return dataPagamento.getMonth() === mesAlvo && dataPagamento.getFullYear() === anoAlvo;
      }

      // Caso não haja dataPagamento, mas esteja marcado como Paga, considerar vencimento
      if (vencimento) {
        return vencimento.getMonth() === mesAlvo && vencimento.getFullYear() === anoAlvo;
      }

      return false;
    });

    const totalDespesasPagas = despesasPagasMes.reduce((sum, d) => sum + (d.valor || 0), 0);

    // 🎯 CÁLCULO DE DESPESAS PENDENTES: Buscar despesas pendentes do mês/ano especificado
    const despesasPendentesMes = despesas.filter(d => {
      // Filtrar despesas com status 'Pendente' ou 'Vencida'
      if (d.status !== 'Pendente' && d.status !== 'Vencida') return false;

      const vencimento = d.vencimento ? new Date(d.vencimento) : null;
      
      // Filtrar por vencimento no mês/ano especificado
      if (vencimento) {
        const venceNoMes = vencimento.getMonth() === mesAlvo && vencimento.getFullYear() === anoAlvo;
        
        // 🔍 Debug detalhado para cada despesa
        if (d.status === 'Pendente' || d.status === 'Vencida') {
          console.log(`🔍 DEBUG - Despesa: ${d.descricao}, Status: ${d.status}, Vencimento: ${vencimento.toLocaleDateString()}, Inclui: ${venceNoMes}`);
        }
        
        return venceNoMes;
      }

      return false;
    });

    const totalDespesasPendentes = despesasPendentesMes.reduce((sum, d) => sum + (d.valor || 0), 0);

    console.log(`💰 DESPESAS PENDENTES PARA ${mesAlvo + 1}/${anoAlvo}:`);
    console.log(`   📊 Total de despesas pendentes: ${despesasPendentesMes.length}`);
    console.log(`   💸 Valor total pendente: R$ ${totalDespesasPendentes.toFixed(2)}`);
    console.log(`   📋 Lista de despesas pendentes:`, despesasPendentesMes.map(d => ({ descricao: d.descricao, valor: d.valor, status: d.status })));

    // 🔄 SALDO ROTATIVO: Buscar saldo do mês anterior (se não for mês atual)
    let saldoRotativo = 0;
    let detalhesSaldoRotativo = null;
    
    // Só calcular saldo rotativo se solicitado e não for o primeiro mês que temos dados
    // 🚨 CORREÇÃO: Evitar recursão infinita - calcular diretamente aqui
    if (incluirSaldoRotativo && ano !== null && mes !== null) {
      // Calcular o mês anterior
      let anoAnterior = anoAlvo;
      let mesAnterior = mesAlvo - 1;
      
      if (mesAnterior < 0) {
        mesAnterior = 11;
        anoAnterior = anoAlvo - 1;
      }
      
      console.log(`� Calculando saldo rotativo: buscando ${mesAnterior + 1}/${anoAnterior} para transferir para ${mesAlvo + 1}/${anoAlvo}`);
      
      // Buscar o resumo do mês anterior SEM saldo rotativo para evitar recursão
      const resumoMesAnterior = await buscarResumoFinanceiro(anoAnterior, mesAnterior, false);
      
      if (resumoMesAnterior.success) {
        // O saldo rotativo é o saldo TOTAL do mês anterior
        // Precisamos buscar também o saldo rotativo DELE para ter o valor correto
        let saldoRotativoDoAnterior = 0;
        let mesAntAnterior = 0; // Definir variável aqui
        let anoAntAnterior = anoAnterior;
        
        // Se não for o primeiro mês, buscar o saldo rotativo do mês anterior
        if (mesAnterior > 0 || anoAnterior > 2024) {
          anoAntAnterior = anoAnterior;
          mesAntAnterior = mesAnterior - 1;
          
          if (mesAntAnterior < 0) {
            mesAntAnterior = 11;
            anoAntAnterior = anoAnterior - 1;
          }
          
          const resumoAntAnterior = await buscarResumoFinanceiro(anoAntAnterior, mesAntAnterior, false);
          if (resumoAntAnterior.success) {
            saldoRotativoDoAnterior = resumoAntAnterior.resumo.saldoMesSemRotativo || 0;
          }
        }
        
        // Saldo total do mês anterior = local + rotativo - despesas
        const totalLocalAnterior = resumoMesAnterior.resumo.totalLocal || 0;
        const despesasAnterior = resumoMesAnterior.resumo.totalDespesasPagas || 0;
        
        saldoRotativo = totalLocalAnterior + saldoRotativoDoAnterior - despesasAnterior;
        
        console.log(`💰 CÁLCULO SALDO ROTATIVO PARA ${mesAlvo + 1}/${anoAlvo}:`);
        console.log(`   📈 Local de ${mesAnterior + 1}/${anoAnterior}: R$ ${totalLocalAnterior.toFixed(2)}`);
        console.log(`   🔄 Rotativo de ${mesAntAnterior + 1}/${anoAntAnterior}: R$ ${saldoRotativoDoAnterior.toFixed(2)}`);
        console.log(`   📉 Despesas de ${mesAnterior + 1}/${anoAnterior}: R$ ${despesasAnterior.toFixed(2)}`);
        console.log(`   💰 TOTAL TRANSFERIDO: R$ ${saldoRotativo.toFixed(2)}`);
        
        detalhesSaldoRotativo = {
          anoAnterior,
          mesAnterior: mesAnterior + 1,
          totalLocalAnterior,
          saldoRotativoDoAnterior,
          despesasAnterior,
          saldoCalculado: saldoRotativo
        };
      } else {
        console.log(`❌ Não foi possível calcular saldo rotativo: ${resumoMesAnterior.error}`);
      }
    }

    // 🎯 NOVO CÁLCULO: Saldo do mês COM saldo rotativo
    // Fórmula: (Entrada Local Atual) + (Saldo Anterior) - (Despesas Atuais)
    const saldoMesSemRotativo = totalLocal - totalDespesasPagas; // Cálculo original
    const saldoMesComRotativo = incluirSaldoRotativo ? (totalLocal + saldoRotativo - totalDespesasPagas) : saldoMesSemRotativo; // Novo cálculo
    
    if (incluirSaldoRotativo) {
      console.log(`📊 CÁLCULO DO SALDO PARA ${mesAlvo + 1}/${anoAlvo}:`);
      console.log(`   💵 Entradas locais do mês: R$ ${totalLocal.toFixed(2)}`);
      console.log(`   🔄 Saldo rotativo (TOTAL anterior): R$ ${saldoRotativo.toFixed(2)}`);
      console.log(`   💸 Despesas pagas no mês: R$ ${totalDespesasPagas.toFixed(2)}`);
      console.log(`   💰 SALDO FINAL: R$ ${totalLocal.toFixed(2)} + R$ ${saldoRotativo.toFixed(2)} - R$ ${totalDespesasPagas.toFixed(2)} = R$ ${saldoMesComRotativo.toFixed(2)}`);
    } else {
      console.log(`📊 CÁLCULO SEM ROTATIVO PARA ${mesAlvo + 1}/${anoAlvo}: R$ ${saldoMesSemRotativo.toFixed(2)}`);
    }

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
        // 🔧 CORREÇÃO: Adicionar aliases para compatibilidade com CardResumoFinanceiro
        centralPix: totalPixCentral,
        centralDinheiro: totalDinheiroCentral,
        localPix: totalPixLocal,
        localDinheiro: totalDinheiroLocal,
        totalDespesasPagas,
        totalDespesasPendentes, // 🎯 NOVO CAMPO: Total de despesas pendentes do mês
        // 🔄 NOVOS CAMPOS: Saldo rotativo
        saldoMes: saldoMesComRotativo, // Novo saldo (com rotativo se solicitado)
        saldoMesSemRotativo: saldoMesSemRotativo, // Saldo original (sem rotativo)
        saldoRotativo, // Saldo transferido do mês anterior
        detalhesSaldoRotativo, // Detalhes do cálculo do saldo anterior
        // Totais ajustados
        totalLocalComRotativo: totalLocal + saldoRotativo, // Local + saldo anterior
        quantidadeEntradas: entradasMesAtual.length
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
export const buscarDespesasPendentes = async (ano = null, mes = null) => {
  try {
    // Se ano e mês foram especificados, buscar apenas do período
    const despesas = ano !== null && mes !== null 
      ? await buscarDespesasPorPeriodo(ano, mes)
      : await buscarDespesas();
    
    // 🕐 CORREÇÃO: Usar fuso horário de Cuiabá-MT (UTC-4)
    const agora = new Date();
    const hoje = new Date(agora.toLocaleString("en-US", {timeZone: "America/Cuiaba"}));
    hoje.setHours(0, 0, 0, 0);

    // 🎯 CORREÇÃO DO BUG: Se tem filtro de mês/ano, mostrar TODAS as despesas pendentes do período
    if (ano !== null && mes !== null) {
      console.log(`🔍 Filtrando despesas pendentes para ${mes + 1}/${ano}`);
      console.log('📊 Total de despesas recebidas:', despesas.length);
      
      // Filtrar apenas por status (não por data, pois já está filtrado na consulta)
      const despesasPendentes = despesas.filter(d => {
        return d.status !== 'Paga';
      });

      // 🎯 LÓGICA SIMPLIFICADA PARA FILTRO: Apenas "Vencidas" vs "Pendentes do Mês"
      const vencidas = [];
      const pendentesDoMes = [];

      despesasPendentes.forEach(d => {
        const vencimentoOriginal = new Date(d.vencimento);
        const vencimento = new Date(vencimentoOriginal.toLocaleString("en-US", {timeZone: "America/Cuiaba"}));
        vencimento.setHours(0, 0, 0, 0);

        // Se está vencida em relação à data atual (hoje real)
        if (vencimento < hoje || d.status === 'Vencida') {
          vencidas.push(d);
        } else {
          // Todas as outras são "pendentes do mês"
          pendentesDoMes.push(d);
        }
      });

      // Calcular totais do período
      const totalVencidas = vencidas.reduce((sum, d) => sum + d.valor, 0);
      const totalPendentes = pendentesDoMes.reduce((sum, d) => sum + d.valor, 0);

      console.log(`✅ Dashboard filtrado ${mes + 1}/${ano}:`);
      console.log(`   Vencidas: ${vencidas.length} (R$ ${totalVencidas.toFixed(2)})`);
      console.log(`   Pendentes do mês: ${pendentesDoMes.length} (R$ ${totalPendentes.toFixed(2)})`);

      return {
        success: true,
        despesas: {
          vencidas,
          proximos7Dias: pendentesDoMes, // Todas as pendentes ficam em "próximos 7 dias" para compatibilidade com UI
          de8a15Dias: [],
          totais: {
            vencidas: totalVencidas,
            proximos7: totalPendentes,
            de8a15: 0,
            geral: totalVencidas + totalPendentes
          }
        }
      };
    }

    // 📅 Lógica ORIGINAL: Para visualização geral (sem filtro), usar regra dos 15 dias
    const data15Dias = new Date(hoje);
    data15Dias.setDate(data15Dias.getDate() + 15);

    const data7Dias = new Date(hoje);
    data7Dias.setDate(data7Dias.getDate() + 7);

    // Filtra apenas despesas pendentes ou vencidas até 15 dias
    const despesasPendentes = despesas.filter(d => {
      if (d.status === 'Paga') return false;
      
      const vencimentoOriginal = new Date(d.vencimento);
      const vencimento = new Date(vencimentoOriginal.toLocaleString("en-US", {timeZone: "America/Cuiaba"}));
      vencimento.setHours(0, 0, 0, 0);
      
      return vencimento <= data15Dias;
    });

    // Agrupa por urgência
    const vencidas = [];
    const proximos7Dias = [];
    const de8a15Dias = [];

    despesasPendentes.forEach(d => {
      const vencimentoOriginal = new Date(d.vencimento);
      const vencimento = new Date(vencimentoOriginal.toLocaleString("en-US", {timeZone: "America/Cuiaba"}));
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
export const buscarMetaMissoes = async (ano = null, mes = null) => {
  try {
    const metaConfig = await buscarMetaMissoesConfig();
    const resultado = await buscarEntradas();
    
    if (!resultado.success) {
      return { success: false, error: resultado.error };
    }

    const entradas = resultado.entradas;
    
    // Usar filtros fornecidos ou data atual como padrão
    const agora = new Date();
    const mesAlvo = mes !== null ? mes : agora.getMonth();
    const anoAlvo = ano !== null ? ano : agora.getFullYear();

    // Filtra entradas do mês/ano especificado
    const entradasMesAtual = entradas.filter(entrada => {
      const dataEntrada = entrada.data instanceof Date ? entrada.data : new Date(entrada.data);
      return dataEntrada.getMonth() === mesAlvo && 
             dataEntrada.getFullYear() === anoAlvo;
    });

    // Soma rateio de missões
    let totalMissoes = 0;
    entradasMesAtual.forEach(entrada => {
      // CORREÇÃO: Calcular rateio se não existir
      let rateio = entrada.rateio;
      if (!rateio) {
        rateio = calcularRateio(entrada.tipo, entrada.valor);
      }
      
      if (rateio && rateio.missoes) {
        totalMissoes += rateio.missoes;
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

/**
 * Escuta mudanças nos dados em tempo real para o Dashboard
 * Recalcula o resumo financeiro automaticamente quando entradas mudam
 */
export const escutarResumoFinanceiro = (ano, mes, callback) => {
  try {
    console.log('🔄 Configurando listener do resumo financeiro...');
    
    // Escutar mudanças nas entradas
    const unsubscribe = escutarEntradas((resultado) => {
      if (resultado.success) {
        console.log('🔄 Recalculando resumo financeiro...');
        
        // Recalcular o resumo com os novos dados
        calcularResumoComEntradas(resultado.entradas, ano, mes)
          .then(resumo => {
            callback({ success: true, resumo });
          })
          .catch(error => {
            console.error('❌ Erro ao recalcular resumo:', error);
            callback({ success: false, error: error.message });
          });
      } else {
        callback(resultado);
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Erro ao configurar listener do resumo:', error);
    return null;
  }
};

/**
 * Calcula o resumo financeiro com dados de entradas já obtidos
 */
const calcularResumoComEntradas = async (entradas, ano, mes) => {
  try {
    console.log('📊 Calculando resumo para:', { ano, mes });
    
    // Filtrar entradas do período
    const entradasPeriodo = entradas.filter(entrada => {
      if (!entrada.data) return false;
      const dataEntrada = new Date(entrada.data);
      return dataEntrada.getMonth() === mes && dataEntrada.getFullYear() === ano;
    });
    
    console.log('📊 Entradas do período:', entradasPeriodo.length);
    
    // Calcular totais usando o rateio atual de cada entrada
    let totalGeral = 0;
    let totalCentral = 0;
    let totalLocal = 0;
    let totalMissoes = 0;
    
    entradasPeriodo.forEach(entrada => {
      const valor = parseFloat(entrada.valor) || 0;
      totalGeral += valor;
      
      // Usar rateio salvo na entrada (já calculado pela Cloud Function ou frontend)
      if (entrada.rateio) {
        totalCentral += parseFloat(entrada.rateio['Igreja Central'] || 0);
        totalLocal += parseFloat(entrada.rateio['Igreja Local'] || 0);
        totalMissoes += parseFloat(entrada.rateio['Missões'] || 0);
      } else {
        // Fallback: calcular rateio baseado no tipo
        const rateio = calcularRateio(entrada.tipo, valor);
        totalCentral += rateio.central;
        totalLocal += rateio.local;
        totalMissoes += rateio.missoes;
      }
    });
    
    return {
      total: totalGeral,
      central: totalCentral,
      local: totalLocal,
      missoes: totalMissoes,
      periodo: `${mes + 1}/${ano}`
    };
  } catch (error) {
    console.error('❌ Erro ao calcular resumo:', error);
    throw error;
  }
};