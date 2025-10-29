import React from 'react'

function App() {
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
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

      {/* Bem-vindo */}
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
          Este é o sistema completo para gerenciar as finanças da igreja de forma 
          transparente e organizada. Controle dízimos, ofertas, despesas e gere 
          relatórios detalhados!
        </p>
      </section>

      {/* Funcionalidades */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '1.8rem' }}>
          📋 Funcionalidades Planejadas
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {/* Card 1 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ color: '#1976d2', marginBottom: '10px' }}>
              💰 Entradas
            </h3>
            <ul style={{ lineHeight: '2', color: '#555' }}>
              <li>✅ Dízimos</li>
              <li>✅ Ofertas Comuns</li>
              <li>✅ Ofertas Santa Ceia</li>
              <li>✅ Rateio 60/40</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ color: '#d32f2f', marginBottom: '10px' }}>
              📤 Saídas
            </h3>
            <ul style={{ lineHeight: '2', color: '#555' }}>
              <li>✅ Despesas Fixas</li>
              <li>✅ Contas a Pagar</li>
              <li>✅ Parcelas</li>
              <li>✅ Histórico</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ color: '#7b1fa2', marginBottom: '10px' }}>
              💳 Saldos
            </h3>
            <ul style={{ lineHeight: '2', color: '#555' }}>
              <li>✅ Saldo Local (40%)</li>
              <li>✅ Saldo Missões (100%)</li>
              <li>✅ Saldo Central (60%)</li>
              <li>✅ PIX vs Dinheiro</li>
            </ul>
          </div>

          {/* Card 4 */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ color: '#f57c00', marginBottom: '10px' }}>
              📊 Relatórios
            </h3>
            <ul style={{ lineHeight: '2', color: '#555' }}>
              <li>✅ Dashboard Geral</li>
              <li>✅ Relatório Mensal</li>
              <li>✅ Gráficos</li>
              <li>✅ Exportação PDF</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Status */}
      <section style={{ 
        backgroundColor: '#fff3e0', 
        padding: '25px', 
        borderRadius: '8px',
        border: '2px solid #ff9800',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#e65100', marginBottom: '15px' }}>
          🚀 Status do Projeto
        </h3>
        <p style={{ fontSize: '1.1rem', color: '#424242', marginBottom: '10px' }}>
          ✅ <strong>Estrutura inicial criada com sucesso!</strong>
        </p>
        <p style={{ fontSize: '1rem', color: '#666' }}>
          📌 Próximos passos:
        </p>
        <ol style={{ marginTop: '10px', lineHeight: '2', color: '#555' }}>
          <li>Configurar Firebase</li>
          <li>Criar sistema de autenticação</li>
          <li>Desenvolver telas de entrada</li>
          <li>Implementar controle de saldos</li>
        </ol>
      </section>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '20px',
        borderTop: '2px solid #e0e0e0',
        color: '#888',
        marginTop: '40px'
      }}>
        <p>Desenvolvido com ❤️ para a Igreja</p>
        <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>
          v0.1.0 - 2025
        </p>
      </footer>
    </div>
  )
}

export default App