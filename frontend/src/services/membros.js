import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// 🚀 OTIMIZAÇÃO: Cache local de membros para evitar leituras repetidas
let cacheMembros = null;
let cacheTimestamp = null;
const CACHE_DURACAO = 5 * 60 * 1000; // 5 minutos

/**
 * Adiciona um novo membro
 */
export const adicionarMembro = async (dados, usuarioEmail) => {
  try {
    const membrosRef = collection(db, 'membros');
    
    const documento = {
      nome: dados.nome,
      telefone: dados.telefone || '',
      email: dados.email || '',
      funcao: dados.funcao || 'Membro',
      ativo: true,
      criadoPor: usuarioEmail,
      criadoEm: Timestamp.now()
    };
    
    const docRef = await addDoc(membrosRef, documento);
    
    // 🚀 OTIMIZAÇÃO: Invalidar cache após criação
    cacheMembros = null;
    
    console.log('✅ Membro adicionado:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Erro ao adicionar membro:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🚀 OTIMIZAÇÃO: Escutar membros em tempo real (onSnapshot)
 * Reduz leituras ao usar cache local e atualizar apenas quando há mudanças
 */
export const escutarMembros = (callback) => {
  try {
    const membrosRef = collection(db, 'membros');
    const q = query(membrosRef, orderBy('nome', 'asc'));
    
    const unsubscribe = onSnapshot(q, 
      { includeMetadataChanges: true },
      (snapshot) => {
        // ✅ Só processa se houver mudanças reais (não apenas metadata)
        if (!snapshot.metadata.hasPendingWrites && !snapshot.metadata.fromCache) {
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
          
          // Atualizar cache
          cacheMembros = membros;
          cacheTimestamp = Date.now();
          
          callback({ success: true, membros });
          console.log(`✅ Membros atualizados (tempo real): ${membros.length}`);
        }
      },
      (error) => {
        console.error('❌ Erro ao escutar membros:', error);
        callback({ success: false, error: error.message });
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Erro ao configurar listener:', error);
    return () => {};
  }
};

/**
 * Busca todos os membros ativos (com cache)
 * 🚀 OTIMIZAÇÃO: Retorna cache se ainda válido, evita leitura desnecessária
 */
export const buscarMembros = async () => {
  try {
    // ✅ Retornar cache se ainda válido
    if (cacheMembros && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURACAO)) {
      console.log('✅ Membros retornados do cache (0 leituras)');
      return { success: true, membros: cacheMembros };
    }
    
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
    
    // Atualizar cache
    cacheMembros = membros;
    cacheTimestamp = Date.now();
    
    console.log(`✅ Membros carregados: ${membros.length} (${snapshot.size} leituras)`);
    return { success: true, membros };
  } catch (error) {
    console.error('❌ Erro ao buscar membros:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Atualiza um membro
 * 🚀 OTIMIZAÇÃO: Invalidar cache após atualização
 */
export const atualizarMembro = async (id, dados, usuarioEmail) => {
  try {
    const membroRef = doc(db, 'membros', id);
    
    const dadosAtualizados = {
      nome: dados.nome,
      telefone: dados.telefone || '',
      email: dados.email || '',
      funcao: dados.funcao || 'Membro',
      editadoPor: usuarioEmail,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(membroRef, dadosAtualizados);
    
    // 🚀 OTIMIZAÇÃO: Invalidar cache
    cacheMembros = null;
    
    console.log('✅ Membro atualizado:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao atualizar membro:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exclui um membro
 * 🚀 OTIMIZAÇÃO: Invalidar cache após exclusão
 */
export const excluirMembro = async (id) => {
  try {
    const membroRef = doc(db, 'membros', id);
    await deleteDoc(membroRef);
    
    // 🚀 OTIMIZAÇÃO: Invalidar cache
    cacheMembros = null;
    
    console.log('✅ Membro excluído:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao excluir membro:', error);
    return { success: false, error: error.message };
  }
};