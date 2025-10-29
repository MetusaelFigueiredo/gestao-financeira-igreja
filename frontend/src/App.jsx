import React, { useEffect, useState } from 'react'
import { auth, db } from './services/firebase'

function App() {
  const [conexaoOk, setConexaoOk] = useState(false);

  useEffect(() => {
    // Testa se Firebase está configurado
    if (auth && db) {
      setConexaoOk(true);
      console.log('✅ Firebase conectado com sucesso!');
    }
  }, []);

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Status da Conexão Firebase */}
      <div style={{ 
        backgroundColor: conexaoOk ? '#e8f5e9' : '#ffebee',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: `2px solid ${conexaoOk ? '#4caf50' : '#f44336'}`
      }}>
        <h2 style={{ color: conexaoOk ? '#2e7d32' : '#c62828' }}>
          {conexaoOk ? '✅ Firebase Conectado!' : '❌ Firebase Não Conectado'}
        </h2>
        <p>
          {conexaoOk 
            ? 'Tudo pronto para começar a desenvolver!' 
            : 'Verifique o arquivo .env e as credenciais do Firebase'}
        </p>
      </div>

      {/* Cabeçalho */}
      <header style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        borderBottom: '3px solid #4CAF50',
        paddingBottom: '20px'
      }}>
        <h1 style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '10px' }}>
          🏦 Sistema de Gestão Financeira
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
          Controle de Fluxo de Caixa da Igreja
        </p>
      </header>

      <section style={{ 
        backgroundColor: '#e8f5e9', 
        padding: '30px', 
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#2e7d32', marginBottom: '15px' }}>
          👋 Bem-vindo ao Sistema!
        </h2>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#424242' }}>
          Firebase configurado! Agora podemos começar a desenvolver as funcionalidades.
        </p>
      </section>
    </div>
  )
}

export default App