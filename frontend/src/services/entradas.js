import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs,
  where,
  Timestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

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
 * Adiciona uma nova entrada
 * Observação: por definição atual, entradas lançadas via FormEntrada são consideradas recebidas.
 * Por isso gravamos pago: true e pagoEm: now.
 */
export const adicionarEntrada = async (dados, usuarioEmail) => {
  try {
    const entradasRef = collection(db, 'entradas');
    
    const rateio = dados.rateio || calcularRateio(dados.tipo, dados.valor);
    
    const valorNum = parseFloat(dados.valor);

    const documento = {
      tipo: dados.tipo,
      descricao: dados.descricao || '',
      valor: valorNum,
      data: Timestamp.fromDate(new Date(dados.data)),
      formaRecebimento: dados.formaRecebimento,
      rateio: rateio,
      
      // Se for dízimo, guarda o membro
      ...(dados.tipo === 'dizimo' && dados.membroId && {
        membroId: dados.membroId,
        membroNome: dados.membroNome
      }),
      
      // Marcar como recebido por padrão (o formulário atual registra recebimento)
      pago: dados.pago === undefined ? true : !!dados.pago,
      pagoEm: dados.pago === undefined ? Timestamp.now() : (dados.pago ? (dados.pagoEm ? Timestamp.fromDate(new Date(dados.pagoEm)) : Timestamp.now()) : null),

      criadoPor: usuarioEmail,
      criadoEm: Timestamp.now()
    };
    
    const docRef = await addDoc(entradasRef, documento);
    
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
    const entradasRef = collection(db, 'entradas');
    const q = query(entradasRef, orderBy('data', 'desc'));
    const snapshot = await getDocs(q);
    
    const entradas = [];
    snapshot.forEach((doc) => {
      const dataDoc = doc.data();
      entradas.push({
        id: doc.id,
        ...dataDoc,
        // converter timestamp para Date no frontend
        data: dataDoc.data ? dataDoc.data.toDate() : null,
        vencimento: dataDoc.vencimento ? dataDoc.vencimento.toDate() : null,
        pagoEm: dataDoc.pagoEm ? dataDoc.pagoEm.toDate() : null
      });
    });
    
    return { success: true, entradas };
  } catch (error) {
    console.error('❌ Erro ao buscar entradas:', error);
    return { success: false, error: error.message };
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
        data: dataDoc.data ? dataDoc.data.toDate() : null,
        vencimento: dataDoc.vencimento ? dataDoc.vencimento.toDate() : null,
        pagoEm: dataDoc.pagoEm ? dataDoc.pagoEm.toDate() : null
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
    const entradaRef = doc(db, 'entradas', id);
    
    const rateio = dados.rateio || calcularRateio(dados.tipo, dados.valor);

    const dadosAtualizados = {
      tipo: dados.tipo,
      descricao: dados.descricao || '',
      valor: parseFloat(dados.valor),
      data: Timestamp.fromDate(new Date(dados.data)),
      formaRecebimento: dados.formaRecebimento,
      rateio: rateio,
      
      // Se for dízimo, guarda o membro
      ...(dados.tipo === 'dizimo' && dados.membroId && {
        membroId: dados.membroId,
        membroNome: dados.membroNome
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
};