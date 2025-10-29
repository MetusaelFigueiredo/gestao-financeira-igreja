import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Calcula o rateio baseado no tipo de entrada
 */
const calcularRateio = (tipo, valor) => {
  const valorNum = parseFloat(valor);
  
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
 */
export const adicionarEntrada = async (dados) => {
  try {
    const entradasRef = collection(db, 'entradas');
    
    const rateio = calcularRateio(dados.tipo, dados.valor);
    
    const documento = {
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
      entradas.push({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data.toDate()
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
      entradas.push({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data.toDate()
      });
    });
    
    return { success: true, entradas };
  } catch (error) {
    console.error('❌ Erro ao buscar entradas do membro:', error);
    return { success: false, error: error.message };
  }
};