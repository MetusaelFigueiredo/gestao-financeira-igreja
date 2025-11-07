import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  where,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Estados possíveis do evento
export const STATUS_EVENTO = {
  ABERTO: 'aberto',
  EM_ANALISE: 'analise', 
  FECHADO: 'fechado'
};

/**
 * Criar novo evento
 */
export const criarEvento = async (dadosEvento) => {
  try {
    const evento = {
      nomeEvento: dadosEvento.nomeEvento,
      dataEvento: Timestamp.fromDate(new Date(dadosEvento.dataEvento)),
      status: STATUS_EVENTO.ABERTO,
      criadoEm: Timestamp.now(),
      criadoPor: dadosEvento.usuarioEmail,
      totalEntradas: 0,
      valorTotal: 0
    };

    const docRef = await addDoc(collection(db, 'eventos'), evento);
    
    return {
      success: true,
      eventoId: docRef.id,
      evento: { ...evento, id: docRef.id }
    };
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Buscar todos os eventos
 */
export const buscarEventos = async () => {
  try {
    const q = query(
      collection(db, 'eventos'),
      orderBy('dataEvento', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const eventos = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      eventos.push({
        id: doc.id,
        ...data,
        dataEvento: data.dataEvento?.toDate(),
        criadoEm: data.criadoEm?.toDate()
      });
    });
    
    return {
      success: true,
      eventos
    };
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return {
      success: false,
      error: error.message,
      eventos: []
    };
  }
};

/**
 * Buscar eventos abertos (que podem receber entradas)
 */
export const buscarEventosAbertos = async () => {
  try {
    const q = query(
      collection(db, 'eventos'),
      where('status', '==', STATUS_EVENTO.ABERTO)
      // orderBy('dataEvento', 'desc') // Temporariamente removido até índice ser construído
    );
    
    const querySnapshot = await getDocs(q);
    const eventos = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      eventos.push({
        id: doc.id,
        ...data,
        dataEvento: data.dataEvento?.toDate(),
        criadoEm: data.criadoEm?.toDate()
      });
    });
    
    return {
      success: true,
      eventos
    };
  } catch (error) {
    console.error('Erro ao buscar eventos abertos:', error);
    return {
      success: false,
      error: error.message,
      eventos: []
    };
  }
};

/**
 * Buscar evento por ID
 */
export const buscarEventoPorId = async (eventoId) => {
  try {
    const docRef = doc(db, 'eventos', eventoId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        success: true,
        evento: {
          id: docSnap.id,
          ...data,
          dataEvento: data.dataEvento?.toDate(),
          criadoEm: data.criadoEm?.toDate()
        }
      };
    } else {
      return {
        success: false,
        error: 'Evento não encontrado'
      };
    }
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Atualizar status do evento
 */
export const atualizarStatusEvento = async (eventoId, novoStatus, dadosAdicionais = {}) => {
  try {
    const docRef = doc(db, 'eventos', eventoId);
    
    const dadosAtualizacao = {
      status: novoStatus,
      atualizadoEm: Timestamp.now(),
      ...dadosAdicionais
    };

    // Adicionar campos específicos por status
    if (novoStatus === STATUS_EVENTO.FECHADO) {
      dadosAtualizacao.fechadoEm = Timestamp.now();
    } else if (novoStatus === STATUS_EVENTO.FINALIZADO) {
      dadosAtualizacao.finalizadoEm = Timestamp.now();
    }
    
    await updateDoc(docRef, dadosAtualizacao);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Erro ao atualizar status do evento:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Fechar evento
 */
export const fecharEvento = async (eventoId) => {
  try {
    const resultado = await atualizarStatusEvento(eventoId, STATUS_EVENTO.FECHADO);
    
    if (resultado.success) {
      return {
        success: true,
        message: 'Evento fechado com sucesso. Aguardando aprovação do pastor.'
      };
    }
    
    return resultado;
  } catch (error) {
    console.error('Erro ao fechar evento:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Atualizar estatísticas do evento (chamado quando entradas são adicionadas/removidas)
 */
export const atualizarEstatisticasEvento = async (eventoId, totalEntradas, valorTotal) => {
  try {
    const docRef = doc(db, 'eventos', eventoId);
    
    await updateDoc(docRef, {
      totalEntradas,
      valorTotal,
      atualizadoEm: Timestamp.now()
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Erro ao atualizar estatísticas do evento:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enviar evento para análise
 */
export const enviarParaAnalise = async (eventoId, usuarioId) => {
  try {
    const docRef = doc(db, 'eventos', eventoId);
    
    await updateDoc(docRef, {
      status: STATUS_EVENTO.EM_ANALISE,
      enviadoParaAnaliseEm: Timestamp.now(),
      enviadoParaAnalisePor: usuarioId,
      atualizadoEm: Timestamp.now()
    });
    
    console.log('✅ Evento enviado para análise:', eventoId);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Erro ao enviar evento para análise:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Aprovar evento (Pastor)
 */
export const aprovarEvento = async (eventoId, usuarioId) => {
  try {
    const docRef = doc(db, 'eventos', eventoId);
    
    await updateDoc(docRef, {
      status: STATUS_EVENTO.FECHADO,
      aprovadoEm: Timestamp.now(),
      aprovadoPor: usuarioId,
      atualizadoEm: Timestamp.now()
    });
    
    console.log('✅ Evento aprovado:', eventoId);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Erro ao aprovar evento:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Reprovar evento (Pastor) - volta para ABERTO
 */
export const reprovarEvento = async (eventoId, usuarioId, motivo = '') => {
  try {
    const docRef = doc(db, 'eventos', eventoId);
    
    await updateDoc(docRef, {
      status: STATUS_EVENTO.ABERTO,
      reprovadoEm: Timestamp.now(),
      reprovadoPor: usuarioId,
      motivoReprovacao: motivo,
      atualizadoEm: Timestamp.now()
    });
    
    console.log('✅ Evento reprovado e reaberto:', eventoId);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Erro ao reprovar evento:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Buscar eventos em análise (para pastores)
 */
export const buscarEventosEmAnalise = async () => {
  try {
    // Query sem orderBy para funcionar sem índice (temporário)
    const q = query(
      collection(db, 'eventos'),
      where('status', '==', STATUS_EVENTO.EM_ANALISE)
    );
    
    const querySnapshot = await getDocs(q);
    const eventos = [];
    
    querySnapshot.forEach((doc) => {
      eventos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Ordenar manualmente por data de envio para análise (mais recente primeiro)
    eventos.sort((a, b) => {
      const dataA = a.enviadoParaAnaliseEm?.toDate ? a.enviadoParaAnaliseEm.toDate() : new Date(a.enviadoParaAnaliseEm);
      const dataB = b.enviadoParaAnaliseEm?.toDate ? b.enviadoParaAnaliseEm.toDate() : new Date(b.enviadoParaAnaliseEm);
      return dataB - dataA;
    });
    
    return {
      success: true,
      eventos
    };
  } catch (error) {
    console.error('Erro ao buscar eventos em análise:', error);
    return {
      success: false,
      error: error.message,
      eventos: []
    };
  }
};

/**
 * Buscar entradas de um evento específico (para conferência)
 */
export const buscarEntradasDoEvento = async (eventoId) => {
  try {
    console.log('🔍 Buscando entradas para o evento:', eventoId);
    
    // Query sem orderBy para funcionar sem índice (temporário)
    const q = query(
      collection(db, 'entradas'),
      where('eventoId', '==', eventoId)
    );
    
    const querySnapshot = await getDocs(q);
    const entradas = [];
    
    querySnapshot.forEach((doc) => {
      const dados = doc.data();
      console.log('📄 Entrada encontrada:', { id: doc.id, ...dados });
      entradas.push({
        id: doc.id,
        ...dados
      });
    });
    
    // Ordenar manualmente por data (mais recente primeiro)
    entradas.sort((a, b) => {
      const dataA = a.data?.toDate ? a.data.toDate() : new Date(a.data);
      const dataB = b.data?.toDate ? b.data.toDate() : new Date(b.data);
      return dataB - dataA;
    });
    
    console.log('✅ Total de entradas encontradas:', entradas.length);
    
    return {
      success: true,
      entradas
    };
  } catch (error) {
    console.error('❌ Erro ao buscar entradas do evento:', error);
    return {
      success: false,
      error: error.message,
      entradas: []
    };
  }
};