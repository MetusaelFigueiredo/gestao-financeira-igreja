import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './firebase';

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
 * Observa mudanças no estado de autenticação
 */
export const observarAutenticacao = (callback) => {
  return onAuthStateChanged(auth, callback);
};