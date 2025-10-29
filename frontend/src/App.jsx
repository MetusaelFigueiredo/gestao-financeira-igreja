import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import { logout, observarAutenticacao } from './services/auth';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Observa mudanças no estado de autenticação
  useEffect(() => {
    const unsubscribe = observarAutenticacao((user) => {
      setUsuario(user);
      setCarregando(false);
      
      if (user) {
        console.log('✅ Usuário logado:', user.email);
      } else {
        console.log('❌ Usuário não logado');
      }
    });

    // Cleanup: para de observar quando componente desmonta
    return () => unsubscribe();
  }, []);

  // Função de logout
  const handleLogout = async () => {
    await logout();
  };

  // Enquanto verifica autenticação, mostra loading
  if (carregando) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <h2>⏳ Carregando...</h2>
      </div>
    );
  }

  // Se não está logado, mostra tela de login
  if (!usuario) {
    return <Login onLoginSuccess={setUsuario} />;
  }

  // Se está logado, mostra o sistema
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Cabeçalho com botão de logout */}
      <header style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        borderBottom: '3px solid #4CAF50',
        paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '5px' }}>
            🏦 Gestão Financeira
          </h1>
          <p style={{ fontSize: '1rem', color: '#7f8c8d' }}>
            👤 Olá, {usuario.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          🚪 Sair
        </button>
      </header>

      {/* Conteúdo principal */}
      <section style={{ 
        backgroundColor: '#e8f5e9', 
        padding: '30px', 
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#2e7d32', marginBottom: '15px' }}>
          ✅ Login Realizado com Sucesso!
        </h2>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#424242' }}>
          Sistema de autenticação funcionando! Agora você pode começar a desenvolver
          as funcionalidades de entrada, despesas e relatórios.
        </p>
      </section>

      {/* Cards de funcionalidades */}
      <section>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
          📋 Próximas Funcionalidades
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#1976d2' }}>💰 Entradas</h3>
            <p>Dízimos, Ofertas e Santa Ceia</p>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#d32f2f' }}>📤 Despesas</h3>
            <p>Contas a pagar e parcelas</p>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#7b1fa2' }}>💳 Saldos</h3>
            <p>Local, Missões e Central</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;