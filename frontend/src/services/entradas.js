import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs,
  where,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { atualizarEstatisticasEvento } from './eventos';

/**
 * Atualizar estatísticas do evento baseado nas entradas vinculadas
 */
const atualizarEstatisticasDoEvento = async (eventoId) => {
  try {
    // Buscar todas as entradas do evento
    const q = query(
      collection(db, 'entradas'),
      where('eventoId', '==', eventoId)
    );
    
    const querySnapshot = await getDocs(q);
    
    let totalEntradas = 0;
    let valorTotal = 0;
    
    querySnapshot.forEach((doc) => {
      const entrada = doc.data();
      totalEntradas++;
      valorTotal += entrada.valor || 0;
    });
    
    // Atualizar o evento com as estatísticas
    await atualizarEstatisticasEvento(eventoId, totalEntradas, valorTotal);
    
    console.log(`📊 Estatísticas do evento ${eventoId} atualizadas: ${totalEntradas} entradas, R$ ${valorTotal}`);
  } catch (error) {
    console.error('Erro ao atualizar estatísticas do evento:', error);
    throw error;
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
    // 🔧 CORREÇÃO: Usar Math.round para evitar problemas de ponto flutuante
    const central = Math.round(valorNum * 0.60 * 100) / 100;
    const local = Math.round(valorNum * 0.40 * 100) / 100;
    return {
      central: central,
      local: local,
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
 * Adiciona uma nova entrada
 * Observação: por definição atual, entradas lançadas via FormEntrada são consideradas recebidas.
 * Por isso gravamos pago: true e pagoEm: now.
 */
export const adicionarEntrada = async (dados, usuarioEmail) => {
  try {
    // ✅ VALIDAÇÃO: Toda entrada DEVE ter um evento vinculado
    if (!dados.eventoId) {
      throw new Error('Entrada deve estar vinculada a um evento');
    }

    const entradasRef = collection(db, 'entradas');
    
    const rateio = dados.rateio || calcularRateio(dados.tipo, dados.valor);
    
    const valorNum = parseFloat(dados.valor);

    // CORREÇÃO: Criar data corretamente para evitar problema de timezone
    const [ano, mes, dia] = dados.data.split('-').map(Number);
    const dataCorreta = new Date(ano, mes - 1, dia, 12, 0, 0); // Meio-dia para evitar problemas de timezone
    
    const documento = {
      tipo: dados.tipo,
      descricao: dados.descricao || '',
      valor: valorNum,
      data: Timestamp.fromDate(dataCorreta),
      formaRecebimento: dados.formaRecebimento,
      rateio: rateio, // SEMPRE vai ter rateio calculado
      
      // Vincular ao evento se fornecido
      ...(dados.eventoId && { eventoId: dados.eventoId }),
      
      // Se for dízimo, guarda o membro
      ...(dados.tipo === 'dizimo' && dados.membroId && {
        membroId: dados.membroId,
        membroNome: dados.membroNome
      }),
      
      // Se tiver comprovante PIX, salva os dados
      ...(dados.comprovante && {
        comprovanteUrl: dados.comprovante.url,
        comprovante: {
          url: dados.comprovante.url,
          nome: dados.comprovante.nome,
          tipo: dados.comprovante.tipo,
          tamanho: dados.comprovante.tamanho
        }
      }),
      
      // Marcar como recebido por padrão (o formulário atual registra recebimento)
      pago: dados.pago === undefined ? true : !!dados.pago,
      pagoEm: dados.pago === undefined ? Timestamp.now() : (dados.pago ? (dados.pagoEm ? Timestamp.fromDate(new Date(dados.pagoEm)) : Timestamp.now()) : null),

      criadoPor: usuarioEmail,
      criadoEm: Timestamp.now()
    };
    
    const docRef = await addDoc(entradasRef, documento);
    
    // Atualizar estatísticas do evento se vinculado
    if (dados.eventoId) {
      try {
        await atualizarEstatisticasDoEvento(dados.eventoId);
      } catch (error) {
        console.warn('⚠️ Erro ao atualizar estatísticas do evento:', error);
        // Não falha a operação principal se houver erro nas estatísticas
      }
    }
    
    console.log('✅ Entrada adicionada:', docRef.id);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Erro ao adicionar entrada:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Busca todas as entradas ordenadas por data
 */
export const buscarEntradas = async () => {
  try {
    console.log('🔍 Iniciando busca de entradas no Firebase...');
    console.log('🔥 Objeto db:', db);
    console.log('👤 Usuário autenticado:', auth.currentUser);
    
    if (!auth.currentUser) {
      throw new Error('Usuário não está autenticado');
    }
    
    const entradasRef = collection(db, 'entradas');
    console.log('📁 Referência da coleção:', entradasRef);
    
    const q = query(entradasRef, orderBy('data', 'desc'));
    console.log('🔍 Query criada:', q);
    
    const snapshot = await getDocs(q);
    console.log('📸 Snapshot obtido:', snapshot);
    console.log('📊 Número de documentos:', snapshot.size);
    
    const entradas = [];
    snapshot.forEach((doc) => {
      const dataDoc = doc.data();
      entradas.push({
        id: doc.id,
        ...dataDoc,
        // converter timestamp para Date no frontend com verificação de tipo
        data: dataDoc.data ? (
          typeof dataDoc.data.toDate === 'function' 
            ? dataDoc.data.toDate() 
            : new Date(dataDoc.data)
        ) : null,
        vencimento: dataDoc.vencimento ? (
          typeof dataDoc.vencimento.toDate === 'function' 
            ? dataDoc.vencimento.toDate() 
            : new Date(dataDoc.vencimento)
        ) : null,
        pagoEm: dataDoc.pagoEm ? (
          typeof dataDoc.pagoEm.toDate === 'function' 
            ? dataDoc.pagoEm.toDate() 
            : new Date(dataDoc.pagoEm)
        ) : null
      });
    });
    
    console.log('✅ Entradas processadas:', entradas.length, 'documentos');
    console.log('📋 Primeiras 3 entradas:', entradas.slice(0, 3));
    
    return { success: true, entradas };
  } catch (error) {
    console.error('❌ Erro detalhado ao buscar entradas:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Firebase Auth:', auth.currentUser);
    return { success: false, error: error.message, errorDetails: error };
  }
};

/**
 * Busca entradas de um membro específico
 */
export const buscarEntradasPorMembro = async (membroId) => {
  try {
    const entradasRef = collection(db, 'entradas');
    const q = query(
      entradasRef, 
      where('membroId', '==', membroId),
      orderBy('data', 'desc')
    );
    const snapshot = await getDocs(q);
    
    const entradas = [];
    snapshot.forEach((doc) => {
      const dataDoc = doc.data();
      entradas.push({
        id: doc.id,
        ...dataDoc,
        data: dataDoc.data ? (
          typeof dataDoc.data.toDate === 'function' 
            ? dataDoc.data.toDate() 
            : new Date(dataDoc.data)
        ) : null,
        vencimento: dataDoc.vencimento ? (
          typeof dataDoc.vencimento.toDate === 'function' 
            ? dataDoc.vencimento.toDate() 
            : new Date(dataDoc.vencimento)
        ) : null,
        pagoEm: dataDoc.pagoEm ? (
          typeof dataDoc.pagoEm.toDate === 'function' 
            ? dataDoc.pagoEm.toDate() 
            : new Date(dataDoc.pagoEm)
        ) : null
      });
    });
    
    return { success: true, entradas };
  } catch (error) {
    console.error('❌ Erro ao buscar entradas do membro:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Atualiza uma entrada
 */
export const atualizarEntrada = async (id, dados, usuarioEmail) => {
  try {
    // ✅ VALIDAÇÃO: Toda entrada DEVE ter um evento vinculado
    if (!dados.eventoId) {
      throw new Error('Entrada deve estar vinculada a um evento');
    }

    const entradaRef = doc(db, 'entradas', id);
    
    const rateio = dados.rateio || calcularRateio(dados.tipo, dados.valor);

    // CORREÇÃO: Criar data corretamente para evitar problema de timezone
    const [ano, mes, dia] = dados.data.split('-').map(Number);
    const dataCorreta = new Date(ano, mes - 1, dia, 12, 0, 0);
    
    const dadosAtualizados = {
      tipo: dados.tipo,
      descricao: dados.descricao || '',
      valor: parseFloat(dados.valor),
      data: Timestamp.fromDate(dataCorreta),
      formaRecebimento: dados.formaRecebimento,
      rateio: rateio,
      eventoId: dados.eventoId, // ✅ Sempre inclui o evento
      
      // Se for dízimo, guarda o membro
      ...(dados.tipo === 'dizimo' && dados.membroId && {
        membroId: dados.membroId,
        membroNome: dados.membroNome
      }),
      
      // Se tiver comprovante PIX, salva os dados
      ...(dados.comprovante && {
        comprovanteUrl: dados.comprovante.url,
        comprovante: {
          url: dados.comprovante.url,
          nome: dados.comprovante.nome,
          tipo: dados.comprovante.tipo,
          tamanho: dados.comprovante.tamanho
        }
      }),
      
      // Atualiza pagamento quando informado
      ...(typeof dados.pago !== 'undefined' && {
        pago: !!dados.pago,
        pagoEm: dados.pago ? (dados.pagoEm ? Timestamp.fromDate(new Date(dados.pagoEm)) : Timestamp.now()) : null
      }),

      editadoPor: usuarioEmail,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(entradaRef, dadosAtualizados);
    
    console.log('✅ Entrada atualizada:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao atualizar entrada:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualiza apenas campos de controle de uma entrada (para divergências)
 */
export const atualizarCamposControle = async (id, dados) => {
  try {
    const entradaRef = doc(db, 'entradas', id);
    
    const dadosAtualizados = {
      ...dados,
      atualizadoEm: new Date()
    };

    await updateDoc(entradaRef, dadosAtualizados);
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar campos de controle:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Exclui uma entrada do Firestore
 */
export const excluirEntrada = async (entradaId) => {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const entradaRef = doc(db, 'entradas', entradaId);
    await deleteDoc(entradaRef);
    
    console.log('✅ Entrada excluída:', entradaId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao excluir entrada:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Escuta mudanças nas entradas em tempo real
 * Retorna uma função para cancelar o listener
 */
export const escutarEntradas = (callback) => {
  try {
    const entradasRef = collection(db, 'entradas');
    const q = query(entradasRef, orderBy('data', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entradas = [];
      snapshot.forEach((doc) => {
        entradas.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('🔄 Entradas atualizadas em tempo real:', entradas.length);
      callback({ success: true, entradas });
    }, (error) => {
      console.error('❌ Erro no listener de entradas:', error);
      callback({ success: false, error: error.message });
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Erro ao configurar listener de entradas:', error);
    return null;
  }
};