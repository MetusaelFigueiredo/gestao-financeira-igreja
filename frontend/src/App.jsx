import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Entradas from './pages/Entradas';
import Membros from './pages/Membros';
import { logout, observarAutenticacao } from './services/auth';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState('home');

  useEffect(() => {
    const unsubscribe = observarAutenticacao((user) => {
      setUsuario(user);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    setPaginaAtual('home');
  };

  if (carregando) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h2>⏳ Carregando...</h2>
      </div>
    );
  }

  if (!usuario) {
    return <Login onLoginSuccess={setUsuario} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{
        backgroundColor: 'white',
        borderBottom: '2px solid #e0e0e0',
        padding: '15px 20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <h1 style={{ fontSize: '1.5rem', color: '#2c3e50', margin: 0 }}>
            🏦 Gestão Financeira - Igreja
          </h1>
          
          <nav style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setPaginaAtual('home')}
              style={{
                padding: '8px 16px',
                backgroundColor: paginaAtual === 'home' ? '#4CAF50' : 'transparent',
                color: paginaAtual === 'home' ? 'white' : '#2c3e50',
                border: '2px solid #4CAF50',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              🏠 Início
            </button>
            
            <button
              onClick={() => setPaginaAtual('membros')}
              style={{
                padding: '8px 16px',
                backgroundColor: paginaAtual === 'membros' ? '#4CAF50' : 'transparent',
                color: paginaAtual === 'membros' ? 'white' : '#2c3e50',
                border: '2px solid #4CAF50',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              👥 Membros
            </button>
            
            <button
              onClick={() => setPaginaAtual('entradas')}
              style={{
                padding: '8px 16px',
                backgroundColor: paginaAtual === 'entradas' ? '#4CAF50' : 'transparent',
                color: paginaAtual === 'entradas' ? 'white' : '#2c3e50',
                border: '2px solid #4CAF50',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              💰 Entradas
            </button>
            
            <span style={{ color: '#7f8c8d', fontSize: '0.9rem', marginLeft: '10px' }}>
              👤 {usuario.email}
            </span>
            
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🚪 Sair
            </button>
          </nav>
        </div>
      </header>

      <main>
        {paginaAtual === 'home' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <section style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              marginBottom: '30px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ color: '#2e7d32', marginBottom: '15px' }}>
                ✅ Sistema Funcionando!
              </h2>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#424242' }}>
                Sistema de autenticação e entradas completo! <br/>
                - Cadastre <strong>👥 Membros</strong><br/>
                - Lance <strong>💰 Entradas</strong> (dízimos, ofertas, etc.)
              </p>
            </section>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>📊 Regras de Rateio</h2>
            <div style={{ 
              display: 'grid', 
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#1976d2', marginBottom: '10px' }}>💰 Dízimos e Ofertas</h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
                  <div>🏛️ Central: <strong>60%</strong></div>
                  <div>🏠 Local: <strong>40%</strong></div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#7b1fa2', marginBottom: '10px' }}>🍞 Santa Ceia</h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
                  <div>✝️ Missões: <strong>100%</strong></div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#388e3c', marginBottom: '10px' }}>🍔 Cantina/Promoções</h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
                  <div>🏠 Local: <strong>100%</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {paginaAtual === 'membros' && <Membros />}
        {paginaAtual === 'entradas' && <Entradas />}
      </main>
    </div>
  );
}

export default App;