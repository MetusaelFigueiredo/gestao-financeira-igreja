import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Entradas from './pages/Entradas';
import Membros from './pages/Membros';
import { logout, observarAutenticacao } from './services/auth';
import Dashboard from './pages/Dashboard';
import Despesas from './pages/Despesas';
import Relatorios from './pages/Relatorios';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState('dashboard');

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
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e8eaed',
        padding: '16px 24px',
        marginBottom: '0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#202124',
            margin: 0,
            letterSpacing: '-0.3px'
          }}>
            Gestão Financeira
          </h1>
          
          <nav style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setPaginaAtual('dashboard')}
              style={{
                padding: '8px 16px',
                backgroundColor: paginaAtual === 'dashboard' ? '#1a73e8' : 'transparent',
                color: paginaAtual === 'dashboard' ? '#ffffff' : '#5f6368',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (paginaAtual !== 'dashboard') {
                  e.currentTarget.style.backgroundColor = '#f1f3f4';
                }
              }}
              onMouseLeave={(e) => {
                if (paginaAtual !== 'dashboard') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Dashboard
            </button>
            
            <button
              onClick={() => setPaginaAtual('membros')}
              style={{
                padding: '8px 16px',
                backgroundColor: paginaAtual === 'membros' ? '#1a73e8' : 'transparent',
                color: paginaAtual === 'membros' ? '#ffffff' : '#5f6368',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (paginaAtual !== 'membros') {
                  e.currentTarget.style.backgroundColor = '#f1f3f4';
                }
              }}
              onMouseLeave={(e) => {
                if (paginaAtual !== 'membros') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Membros
            </button>
            
            <button
              onClick={() => setPaginaAtual('entradas')}
              style={{
                padding: '8px 16px',
                backgroundColor: paginaAtual === 'entradas' ? '#1a73e8' : 'transparent',
                color: paginaAtual === 'entradas' ? '#ffffff' : '#5f6368',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (paginaAtual !== 'entradas') {
                  e.currentTarget.style.backgroundColor = '#f1f3f4';
                }
              }}
              onMouseLeave={(e) => {
                if (paginaAtual !== 'entradas') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Entradas
            </button>
            
            <button
              onClick={() => setPaginaAtual('despesas')}
              style={{
                padding: '8px 16px',
                backgroundColor: paginaAtual === 'despesas' ? '#1a73e8' : 'transparent',
                color: paginaAtual === 'despesas' ? '#ffffff' : '#5f6368',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (paginaAtual !== 'despesas') {
                  e.currentTarget.style.backgroundColor = '#f1f3f4';
                }
              }}
              onMouseLeave={(e) => {
                if (paginaAtual !== 'despesas') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Despesas
            </button>

            {/* ✨ NOVO BOTÃO RELATÓRIOS */}
            <button
              onClick={() => setPaginaAtual('relatorios')}
              style={{
                padding: '8px 16px',
                backgroundColor: paginaAtual === 'relatorios' ? '#1a73e8' : 'transparent',
                color: paginaAtual === 'relatorios' ? '#ffffff' : '#5f6368',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (paginaAtual !== 'relatorios') {
                  e.currentTarget.style.backgroundColor = '#f1f3f4';
                }
              }}
              onMouseLeave={(e) => {
                if (paginaAtual !== 'relatorios') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              📊 Relatórios
            </button>

            <div style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#e8eaed',
              margin: '0 8px'
            }} />
            
            <span style={{
              color: '#5f6368',
              fontSize: '0.875rem',
              padding: '0 8px'
            }}>
              {usuario.email}
            </span>
            
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#ea4335',
                border: '1px solid #ea4335',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ea4335';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#ea4335';
              }}
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main>
        {paginaAtual === 'dashboard' && <Dashboard />}
        {paginaAtual === 'membros' && <Membros />}
        {paginaAtual === 'entradas' && <Entradas />}
        {paginaAtual === 'despesas' && <Despesas usuarioEmail={usuario.email} />}
        {/* ✨ NOVA PÁGINA RELATÓRIOS */}
        {paginaAtual === 'relatorios' && <Relatorios />}
      </main>
    </div>
  );
}

export default App;