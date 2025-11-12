import React from 'react';
import Dashboard from './Dashboard';

/**
 * 🏠 Componente Home - Página principal do sistema
 * Redireciona para o Dashboard por ser a página inicial
 */
function Home({ onNavigate }) {
  return <Dashboard onNavigate={onNavigate} />;
}

export default Home;