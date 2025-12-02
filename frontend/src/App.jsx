import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Entradas from './pages/Entradas';
import Membros from './pages/Membros';
import { logout, observarAutenticacao } from './services/auth';
import { ehPastor, podeGerenciarUsuarios } from './services/usuarios';
import Dashboard from './pages/Dashboard';
import Despesas from './pages/Despesas';
import Relatorios from './pages/Relatorios';
import RelatorioComprovantes from './pages/RelatorioComprovantes'; //  COMPROVANTES
import Backup from './pages/Backup';
import Reconciliacao from './pages/Reconciliacao'; // ✅ IMPLEMENTADA - FASE 3
import Eventos from './pages/Eventos'; // 🎯 NOVA FUNCIONALIDADE
import Usuarios from './pages/Usuarios'; // 👥 GERENCIAR USUÁRIOS
import DiagnosticoFirebase from './components/DiagnosticoFirebase'; // 🔍 Diagnóstico
import './styles/responsive.css'; // 📱 CSS Responsivo

// 🚀 Componente principal da aplicação com rotas
function AppContent() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = observarAutenticacao((user) => {
      setUsuario(user);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Obter página atual baseada na rota
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    return path.substring(1); // Remove a barra inicial
  };

  const paginaAtual = getCurrentPage();

  // Menu items dinâmico baseado no perfil
  const getMenuItems = () => {
    const baseItems = [
      { id: 'entradas', label: 'Entradas', icon: '💰', path: '/entradas' },
      { id: 'eventos', label: 'Eventos', icon: '🎯', path: '/eventos' },
      { id: 'despesas', label: 'Despesas', icon: '💸', path: '/despesas' },
      { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/' },
      { id: 'membros', label: 'Membros', icon: '👥', path: '/membros' },
      { id: 'reconciliacao', label: 'Reconciliação', icon: '⚖️', path: '/reconciliacao' },
      { id: 'backup', label: 'Backup', icon: '🗓️', path: '/backup' },
      { id: 'relatorios', label: 'Relatórios', icon: '', path: '/relatorios' },
      { id: 'comprovantes', label: 'Comprovantes', icon: '', path: '/comprovantes' }
    ];

    // Adicionar item de usuários apenas para MASTER
    if (usuario?.perfil && podeGerenciarUsuarios(usuario.perfil)) {
      baseItems.push({ id: 'usuarios', label: 'Usuários', icon: '👤', path: '/usuarios' });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleMenuClick = (pagina) => {
    // Navegar usando React Router
    if (pagina === 'dashboard') {
      navigate('/');
    } else {
      navigate(`/${pagina}`);
    }
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
        <Routes>
          {/* 🏠 Rota principal - Dashboard */}
          <Route path="/" element={<Dashboard onNavigate={(pagina) => {
            if (pagina === 'dashboard') {
              navigate('/');
            } else {
              navigate(`/${pagina}`);
            }
          }} />} />
          
          {/* 💰 Rotas principais */}
          <Route path="/entradas" element={<Entradas usuarioEmail={usuario.email} />} />
          <Route path="/eventos" element={<Eventos usuarioEmail={usuario.email} usuarioPerfil={usuario} />} />
          <Route path="/despesas" element={<Despesas usuarioEmail={usuario.email} />} />
          <Route path="/membros" element={<Membros usuarioEmail={usuario.email} />} />
          <Route path="/reconciliacao" element={<Reconciliacao />} />
          <Route path="/backup" element={<Backup />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/comprovantes" element={<RelatorioComprovantes />} />
          
          {/* 👤 Rota de usuários (apenas para MASTER) */}
          {usuario?.perfil && podeGerenciarUsuarios(usuario.perfil) && (
            <Route path="/usuarios" element={<Usuarios usuarioPerfil={usuario} />} />
          )}
          
          {/* 🔍 Rota de diagnóstico (desenvolvimento) */}
          <Route path="/diagnostico" element={<DiagnosticoFirebase />} />
          
          {/* 🚀 Redirecionamento para rotas não encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// 🌍 Wrapper principal com BrowserRouter
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

