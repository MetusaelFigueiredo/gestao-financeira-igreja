import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Entradas from './pages/Entradas';
import Membros from './pages/Membros';
import { logout, observarAutenticacao } from './services/auth';
import Dashboard from './pages/Dashboard';
import Despesas from './pages/Despesas';
import Relatorios from './pages/Relatorios';
import Backup from './pages/Backup';
// import Reconciliacao from './pages/Reconciliacao'; // 🔄 SERÁ CRIADA EM BREVE
import DiagnosticoFirebase from './components/DiagnosticoFirebase'; // 🔍 Diagnóstico
import './styles/responsive.css'; // 📱 CSS Responsivo

function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState('dashboard');
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

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

  const menuItems = [
    { id: 'entradas', label: 'Entradas', icon: '�' },
    { id: 'despesas', label: 'Despesas', icon: '�' },
    { id: 'dashboard', label: 'Dashboard', icon: '�' },
    { id: 'membros', label: 'Membros', icon: '�' },
    { id: 'reconciliacao', label: 'Reconciliação', icon: '⚖️' },
    { id: 'backup', label: 'Backup', icon: '🗓️' },
    { id: 'relatorios', label: 'Relatórios', icon: '📊' }
    // { id: 'diagnostico', label: 'Diagnóstico', icon: '🔍' } // 🔍 Mantido no código mas oculto da UI
  ];

  const handleMenuClick = (pagina) => {
    setPaginaAtual(pagina);
    setMenuMobileAberto(false); // Fecha o menu mobile ao selecionar
  };

  // Efeito para controlar o scroll do body quando menu mobile está aberto
  useEffect(() => {
    if (menuMobileAberto) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    
    // Cleanup - remove a classe quando o componente desmonta
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [menuMobileAberto]);

  const MenuButton = ({ item, isMobile = false }) => (
    <button
      onClick={() => handleMenuClick(item.id)}
      style={{
        padding: isMobile ? '12px 20px' : '8px 16px',
        backgroundColor: paginaAtual === item.id ? '#1a73e8' : 'transparent',
        color: paginaAtual === item.id ? '#ffffff' : '#5f6368',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: isMobile ? '1rem' : '0.875rem',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: isMobile ? '100%' : 'auto',
        textAlign: 'left',
        ...(item.id === 'diagnostico' && paginaAtual === 'diagnostico' && {
          backgroundColor: '#ea4335'
        })
      }}
      onMouseEnter={(e) => {
        if (paginaAtual !== item.id) {
          e.currentTarget.style.backgroundColor = '#f1f3f4';
        }
      }}
      onMouseLeave={(e) => {
        if (paginaAtual !== item.id) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <span>{item.icon}</span>
      <span>{item.label}</span>
    </button>
  );

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
        <div className="header-container" style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h1 className="logo-title" style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#202124',
            margin: 0,
            letterSpacing: '-0.3px'
          }}>
            Gestão Financeira
          </h1>
          
          {/* Menu Desktop */}
          <nav className="desktop-menu" style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {menuItems.map(item => (
              <MenuButton key={item.id} item={item} />
            ))}

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

          {/* Botão Hamburger Mobile */}
          <button
            className="mobile-menu-button"
            onClick={() => setMenuMobileAberto(!menuMobileAberto)}
            style={{
              display: 'none',
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1.5rem',
              color: '#5f6368',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f3f4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ☰
          </button>
        </div>
      </header>

      {/* Menu Mobile Slide-out */}
      <div 
        className="mobile-menu-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1001,
          display: menuMobileAberto ? 'block' : 'none',
          opacity: menuMobileAberto ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        onClick={() => setMenuMobileAberto(false)}
      >
        <nav
          className="mobile-menu"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: '280px',
            backgroundColor: '#ffffff',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
            transform: menuMobileAberto ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            gap: '12px',
            zIndex: 1002
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho do Menu Mobile */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e8eaed',
            paddingBottom: '16px',
            marginBottom: '16px'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              color: '#202124',
              margin: 0
            }}>
              Menu
            </h2>
            <button
              onClick={() => setMenuMobileAberto(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#5f6368',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Itens do Menu Mobile */}
          {menuItems.map(item => (
            <MenuButton key={item.id} item={item} isMobile={true} />
          ))}

          {/* Separador */}
          <div style={{
            height: '1px',
            backgroundColor: '#e8eaed',
            margin: '16px 0'
          }} />

          {/* Informações do Usuário */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <p style={{
              margin: 0,
              fontSize: '0.875rem',
              color: '#5f6368'
            }}>
              Logado como:
            </p>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#202124'
            }}>
              {usuario.email}
            </p>
          </div>

          {/* Botão Sair */}
          <button
            onClick={() => {
              handleLogout();
              setMenuMobileAberto(false);
            }}
            style={{
              padding: '12px 20px',
              backgroundColor: '#ea4335',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              marginTop: 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d93025';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ea4335';
            }}
          >
            🚪 Sair
          </button>
        </nav>
      </div>

      <main>
        {paginaAtual === 'entradas' && <Entradas usuarioEmail={usuario.email} />}
        {paginaAtual === 'despesas' && <Despesas usuarioEmail={usuario.email} />}
        {paginaAtual === 'dashboard' && <Dashboard />}
        {paginaAtual === 'membros' && <Membros usuarioEmail={usuario.email} />}
        {paginaAtual === 'reconciliacao' && (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', margin: '20px', borderRadius: '8px' }}>
            <h2>⚖️ Página de Reconciliação</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Esta página será implementada na Fase 3 com:</p>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto', color: '#555' }}>
              <li>📅 Filtros avançados por período</li>
              <li>📊 Histórico completo de reconciliações</li>
              <li>💾 Funcionalidade de salvar reconciliações</li>
              <li>📄 Exportação para PDF</li>
              <li>📈 Gráficos de evolução</li>
            </ul>
            <p style={{ marginTop: '30px', fontSize: '0.9rem', color: '#888' }}>
              Por enquanto, use o widget de reconciliação no Dashboard.
            </p>
          </div>
        )}
        {paginaAtual === 'backup' && <Backup />}
        {paginaAtual === 'relatorios' && <Relatorios />}
        {paginaAtual === 'diagnostico' && <DiagnosticoFirebase />}
      </main>
    </div>
  );
}

export default App;