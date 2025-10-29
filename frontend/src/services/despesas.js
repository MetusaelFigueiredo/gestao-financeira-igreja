import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Categorias de despesas disponíveis
 */
export const categoriasDespesas = {
  'utilidades': {
    nome: '💡 Utilidades',
    subcategorias: ['Luz', 'Água', 'Internet', 'Telefone']
  },
  'pessoal': {
    nome: '👷 Pessoal',
    subcategorias: ['Zelador(a)', 'INSS']
  },
  'material': {
    nome: '📚 Material',
    subcategorias: ['Papel', 'Material de Escritório']
  },
  'cantina': {
    nome: '🍔 Cantina',
    subcategorias: ['Gás', 'Estoque', 'Equipamentos']
  },
  'transporte': {
    nome: '🚗 Transporte',
    subcategorias: ['Combustível', 'Manutenção Veículo']
  },
  'outros': {
    nome: '📦 Outros',
    subcategorias: ['Outros']
  }
};

/**
 * Adiciona uma nova despesa
 */
export const adicionarDespesa = async (dados) => {
  try {
    const despesasRef = collection(db, 'despesas');
    
    const documento = {
      descricao: dados.descricao,
      valor: parseFloat(dados.valor),
      dataVencimento: Timestamp.fromDate(new Date(dados.dataVencimento)),
      categoria: dados.categoria,
      subcategoria: dados.subcategoria,
      
      status: 'a_pagar',
      dataPagamento: null,
      formaPagamento: dados.formaPagamento,
      
      conta: 'local', // Sempre local conforme definido
      
      parcelado: dados.parcelado || false,
      numeroParcelas: dados.numeroParcelas || 0,
      parcelaAtual: dados.parcelaAtual || 0,
      despesaPaiId: dados.despesaPaiId || null,
      
      comprovante: dados.comprovante || null,
      
      fornecedor: dados.fornecedor || '',
      numeroDocumento: dados.numeroDocumento || '',
      observacoes: dados.observacoes || '',
      
      recorrente: dados.recorrente || false,
      frequencia: dados.frequencia || null,
      
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
      criadoPor: dados.criadoPor || ''
    };
    
    const docRef = await addDoc(despesasRef, documento);
    
    console.log('✅ Despesa adicionada:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Erro ao adicionar despesa:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Adiciona despesa parcelada (cria o pai e todas as parcelas)
 */
export const adicionarDespesaParcelada = async (dados) => {
  try {
    // 1. Criar despesa principal (PAI)
    const despesaPai = {
      ...dados,
      parcelado: true,
      numeroParcelas: dados.numeroParcelas,
      parcelaAtual: 0,
      status: 'parcialmente_pago',
      observacoes: `${dados.observacoes} - Parcelado em ${dados.numeroParcelas}x`
    };
    
    const resultadoPai = await adicionarDespesa(despesaPai);
    
    if (!resultadoPai.success) {
      return resultadoPai;
    }
    
    const despesaPaiId = resultadoPai.id;
    const valorParcela = parseFloat(dados.valor) / parseInt(dados.numeroParcelas);
    const dataBase = new Date(dados.dataVencimento);
    
    // 2. Criar todas as parcelas
    const parcelas = [];
    
    for (let i = 1; i <= dados.numeroParcelas; i++) {
      const dataVencimentoParcela = new Date(dataBase);
      dataVencimentoParcela.setMonth(dataBase.getMonth() + (i - 1));
      
      const parcela = {
        descricao: `${dados.descricao} - Parcela ${i}/${dados.numeroParcelas}`,
        valor: valorParcela,
        dataVencimento: dataVencimentoParcela.toISOString().split('T')[0],
        categoria: dados.categoria,
        subcategoria: dados.subcategoria,
        formaPagamento: dados.formaPagamento,
        parcelado: true,
        numeroParcelas: dados.numeroParcelas,
        parcelaAtual: i,
        despesaPaiId: despesaPaiId,
        fornecedor: dados.fornecedor,
        observacoes: `Parcela ${i} de ${dados.numeroParcelas}`,
        criadoPor: dados.criadoPor
      };
      
      const resultadoParcela = await adicionarDespesa(parcela);
      parcelas.push(resultadoParcela);
    }
    
    console.log('✅ Despesa parcelada criada com sucesso!');
    return { 
      success: true, 
      despesaPaiId, 
      parcelas: parcelas.length 
    };
    
  } catch (error) {
    console.error('❌ Erro ao criar despesa parcelada:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Busca todas as despesas
 */
export const buscarDespesas = async () => {
  try {
    const despesasRef = collection(db, 'despesas');
    const q = query(despesasRef, orderBy('dataVencimento', 'desc'));
    const snapshot = await getDocs(q);
    
    const despesas = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      despesas.push({
        id: doc.id,
        ...data,
        dataVencimento: data.dataVencimento.toDate(),
        dataPagamento: data.dataPagamento ? data.dataPagamento.toDate() : null
      });
    });
    
    return { success: true, despesas };
  } catch (error) {
    console.error('❌ Erro ao buscar despesas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Busca despesas do mês atual
 */
export const buscarDespesasMesAtual = async () => {
  try {
    const agora = new Date();
    const primeiroDiaMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const ultimoDiaMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
    
    const despesasRef = collection(db, 'despesas');
    const q = query(
      despesasRef,
      where('dataVencimento', '>=', Timestamp.fromDate(primeiroDiaMes)),
      where('dataVencimento', '<=', Timestamp.fromDate(ultimoDiaMes)),
      orderBy('dataVencimento', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    const despesas = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      despesas.push({
        id: doc.id,
        ...data,
        dataVencimento: data.dataVencimento.toDate(),
        dataPagamento: data.dataPagamento ? data.dataPagamento.toDate() : null
      });
    });
    
    return { success: true, despesas };
  } catch (error) {
    console.error('❌ Erro ao buscar despesas do mês:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Marca despesa como paga
 */
export const marcarComoPago = async (despesaId, formaPagamento) => {
  try {
    const despesaRef = doc(db, 'despesas', despesaId);
    
    await updateDoc(despesaRef, {
      status: 'pago',
      dataPagamento: Timestamp.now(),
      formaPagamento: formaPagamento,
      atualizadoEm: Timestamp.now()
    });
    
    console.log('✅ Despesa marcada como paga');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao marcar como pago:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Atualiza status de despesas vencidas
 */
export const atualizarStatusVencidas = async () => {
  try {
    const resultado = await buscarDespesas();
    
    if (!resultado.success) {
      return resultado;
    }
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const despesasVencidas = resultado.despesas.filter(d => {
      return d.status === 'a_pagar' && d.dataVencimento < hoje;
    });
    
    for (const despesa of despesasVencidas) {
      const despesaRef = doc(db, 'despesas', despesa.id);
      await updateDoc(despesaRef, {
        status: 'vencido',
        atualizadoEm: Timestamp.now()
      });
    }
    
    console.log(`✅ ${despesasVencidas.length} despesa(s) marcada(s) como vencida(s)`);
    return { success: true, atualizadas: despesasVencidas.length };
    
  } catch (error) {
    console.error('❌ Erro ao atualizar despesas vencidas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calcula resumo de despesas
 */
export const calcularResumoDespesas = async () => {
  try {
    const resultado = await buscarDespesasMesAtual();
    
    if (!resultado.success) {
      return resultado;
    }
    
    const despesas = resultado.despesas;
    
    const resumo = {
      total: 0,
      pagas: 0,
      pendentes: 0,
      vencidas: 0,
      quantidadeTotal: despesas.length,
      quantidadePagas: 0,
      quantidadePendentes: 0,
      quantidadeVencidas: 0
    };
    
    despesas.forEach(d => {
      resumo.total += d.valor;
      
      if (d.status === 'pago') {
        resumo.pagas += d.valor;
        resumo.quantidadePagas++;
      } else if (d.status === 'vencido') {
        resumo.vencidas += d.valor;
        resumo.quantidadeVencidas++;
      } else if (d.status === 'a_pagar') {
        resumo.pendentes += d.valor;
        resumo.quantidadePendentes++;
      }
    });
    
    return { success: true, resumo };
    
  } catch (error) {
    console.error('❌ Erro ao calcular resumo:', error);
    return { success: false, error: error.message };
  }
};