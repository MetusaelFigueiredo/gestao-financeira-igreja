import React, { useState } from 'react';
import { login } from '../services/auth';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    // Validações básicas
    if (!email || !senha) {
      setErro('Preencha email e senha');
      setCarregando(false);
      return;
    }

    // Tenta fazer login
    const resultado = await login(email, senha);
    
    setCarregando(false);

    if (resultado.success) {
      // Login bem-sucedido!
      onLoginSuccess(resultado.user);
    } else {
      // Mostra erro
      setErro(resultado.error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '10px' }}>
            🏦 Gestão Financeira
          </h1>
          <p style={{ color: '#7f8c8d' }}>Igreja</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              color: '#2c3e50',
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Senha */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              color: '#2c3e50',
              fontWeight: '500'
            }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #ef5350'
            }}>
              ❌ {erro}
            </div>
          )}

          {/* Botão de Login */}
          <button
            type="submit"
            disabled={carregando}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: carregando ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: carregando ? 'not-allowed' : 'pointer'
            }}
          >
            {carregando ? '⏳ Entrando...' : '🔐 Entrar'}
          </button>
        </form>

        {/* Informação para testes */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#e65100'
        }}>
          <strong>💡 Para testar:</strong><br />
          Email: tesoureiro@igreja.com<br />
          Senha: teste123
        </div>
      </div>
    </div>
  );
}

export default Login;