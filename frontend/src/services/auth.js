import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './firebase';
import { buscarPerfilUsuario, criarPerfilUsuario } from './usuarios';

/**
 * Faz login com email e senha
 */
export const login = async (email, senha) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;
    
    console.log('✅ Login realizado:', user.email);
    return { success: true, user };
  } catch (error) {
    console.error('❌ Erro no login:', error.code, error.message);
    
    // Traduz erros para português
    let mensagemErro = 'Erro ao fazer login';
    
    if (error.code === 'auth/user-not-found') {
      mensagemErro = 'Usuário não encontrado';
    } else if (error.code === 'auth/wrong-password') {
      mensagemErro = 'Senha incorreta';
    } else if (error.code === 'auth/invalid-email') {
      mensagemErro = 'Email inválido';
    } else if (error.code === 'auth/invalid-credential') {
      mensagemErro = 'Email ou senha incorretos';
    }
    
    return { success: false, error: mensagemErro };
  }
};

/**
 * Faz logout do usuário
 */
export const logout = async () => {
  try {
    await signOut(auth);
    console.log('✅ Logout realizado');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Observa mudanças no estado de autenticação e carrega perfil
 */
export const observarAutenticacao = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Usuario logado - buscar/criar perfil
      try {
        let resultado = await buscarPerfilUsuario(user.uid);
        
        if (!resultado.success) {
          // Perfil não existe - criar um novo
          console.log('🆕 Criando perfil para novo usuário:', user.email);
          resultado = await criarPerfilUsuario(user.uid, {
            email: user.email,
            nome: user.displayName || user.email.split('@')[0]
          });
        }
        
        if (resultado.success) {
          // Retornar user com perfil integrado
          const userComPerfil = {
            ...user,
            perfil: resultado.perfil
          };
          callback(userComPerfil);
        } else {
          console.error('Erro ao carregar perfil:', resultado.error);
          callback(user); // Retorna sem perfil em caso de erro
        }
      } catch (error) {
        console.error('Erro ao processar perfil:', error);
        callback(user); // Retorna sem perfil em caso de erro
      }
    } else {
      // Usuario não logado
      callback(null);
    }
  });
};