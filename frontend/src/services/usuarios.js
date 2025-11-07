import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Tipos de perfil disponíveis
export const PERFIS = {
  MASTER: 'master',     // Super admin - pode alterar perfis
  PASTOR: 'pastor',     // Pastor - pode aprovar eventos
  USUARIO: 'usuario'    // Usuário comum
};

/**
 * Criar perfil de usuário (executado no primeiro login)
 */
export const criarPerfilUsuario = async (uid, dadosUsuario) => {
  try {
    const usuarioRef = doc(db, 'usuarios', uid);
    
    // Verificar se é o primeiro usuário (deve ser master)
    const todosUsuarios = await getDocs(collection(db, 'usuarios'));
    const ehPrimeiroUsuario = todosUsuarios.empty;
    
    const perfil = {
      uid,
      email: dadosUsuario.email,
      nome: dadosUsuario.nome || dadosUsuario.email.split('@')[0],
      perfil: ehPrimeiroUsuario ? PERFIS.MASTER : PERFIS.USUARIO, // Primeiro usuário vira master
      ativo: true,
      criadoEm: Timestamp.now(),
      ultimoLogin: Timestamp.now()
    };

    await setDoc(usuarioRef, perfil);
    
    console.log(`✅ Perfil criado: ${uid} - ${ehPrimeiroUsuario ? 'MASTER' : 'USUARIO'}`);
    
    return {
      success: true,
      perfil
    };
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Buscar perfil do usuário
 */
export const buscarPerfilUsuario = async (uid) => {
  try {
    const usuarioRef = doc(db, 'usuarios', uid);
    const usuarioDoc = await getDoc(usuarioRef);
    
    if (usuarioDoc.exists()) {
      // Atualizar último login
      await updateDoc(usuarioRef, {
        ultimoLogin: Timestamp.now()
      });
      
      return {
        success: true,
        perfil: {
          id: usuarioDoc.id,
          ...usuarioDoc.data()
        }
      };
    }
    
    return {
      success: false,
      error: 'Perfil não encontrado'
    };
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verificar se usuário é master (pode alterar perfis)
 */
export const ehMaster = (perfil) => {
  return perfil && perfil.perfil === PERFIS.MASTER;
};

/**
 * Verificar se usuário é pastor ou master (pode aprovar eventos)
 */
export const ehPastor = (perfil) => {
  return perfil && (perfil.perfil === PERFIS.PASTOR || perfil.perfil === PERFIS.MASTER);
};

/**
 * Verificar se usuário pode gerenciar outros usuários (apenas master)
 */
export const podeGerenciarUsuarios = (perfil) => {
  return ehMaster(perfil);
};

/**
 * Buscar todos os usuários (apenas para pastores)
 */
export const buscarTodosUsuarios = async () => {
  try {
    const q = query(collection(db, 'usuarios'));
    const querySnapshot = await getDocs(q);
    
    const usuarios = [];
    querySnapshot.forEach((doc) => {
      usuarios.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      usuarios
    };
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return {
      success: false,
      error: error.message,
      usuarios: []
    };
  }
};

/**
 * Alterar perfil de usuário (apenas pastores podem fazer)
 */
export const alterarPerfilUsuario = async (uid, novoPerfil) => {
  try {
    const usuarioRef = doc(db, 'usuarios', uid);
    
    await updateDoc(usuarioRef, {
      perfil: novoPerfil,
      atualizadoEm: Timestamp.now()
    });
    
    console.log('✅ Perfil alterado:', uid, 'para', novoPerfil);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Erro ao alterar perfil:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Buscar pastores ativos
 */
export const buscarPastores = async () => {
  try {
    const q = query(
      collection(db, 'usuarios'),
      where('perfil', '==', PERFIS.PASTOR),
      where('ativo', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    const pastores = [];
    querySnapshot.forEach((doc) => {
      pastores.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      pastores
    };
  } catch (error) {
    console.error('Erro ao buscar pastores:', error);
    return {
      success: false,
      error: error.message,
      pastores: []
    };
  }
};