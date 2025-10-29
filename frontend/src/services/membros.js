import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Adiciona um novo membro
 */
export const adicionarMembro = async (dados) => {
  try {
    const membrosRef = collection(db, 'membros');
    
    const documento = {
      nome: dados.nome,
      telefone: dados.telefone || '',
      email: dados.email || '',
      ativo: true,
      criadoEm: Timestamp.now()
    };
    
    const docRef = await addDoc(membrosRef, documento);
    
    console.log('✅ Membro adicionado:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Erro ao adicionar membro:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Busca todos os membros ativos
 */
export const buscarMembros = async () => {
  try {
    const membrosRef = collection(db, 'membros');
    const q = query(membrosRef, orderBy('nome', 'asc'));
    const snapshot = await getDocs(q);
    
    const membros = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.ativo !== false) {
        membros.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return { success: true, membros };
  } catch (error) {
    console.error('❌ Erro ao buscar membros:', error);
    return { success: false, error: error.message };
  }
};