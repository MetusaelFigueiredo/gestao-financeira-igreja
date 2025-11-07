import React from 'react';

const CardResumoFinanceiro = ({ resumo, formatarMoeda }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      
      {/* Central */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e8eaed',
        borderLeft: '4px solid #1a73e8'
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: '#1a73e8',
          fontWeight: '700',
          marginBottom: '8px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          🏛️ CENTRAL
        </div>
        <div style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#1a73e8',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          {formatarMoeda(resumo?.totalCentral || 0)}
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          fontWeight: '500',
          marginBottom: '12px'
        }}>
          60% de dízimos e ofertas
        </div>
        
        <div style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>💳 PIX:</span>
            <span style={{ fontWeight: '600' }}>{formatarMoeda(resumo?.centralPix || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>💵 Dinheiro:</span>
            <span style={{ fontWeight: '600' }}>{formatarMoeda(resumo?.centralDinheiro || 0)}</span>
          </div>
        </div>
      </div>

      {/* Local */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e8eaed',
        borderLeft: '4px solid #34a853'
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: '#34a853',
          fontWeight: '700',
          marginBottom: '8px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          🏠 LOCAL
        </div>
        <div style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#34a853',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          {formatarMoeda(resumo?.totalLocal || 0)}
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          marginBottom: '12px',
          fontWeight: '500'
        }}>
          40% de dízimos e ofertas + outros
        </div>
        
        <div style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>💳 PIX:</span>
            <span style={{ fontWeight: '600' }}>{formatarMoeda(resumo?.localPix || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>💵 Dinheiro:</span>
            <span style={{ fontWeight: '600' }}>{formatarMoeda(resumo?.localDinheiro || 0)}</span>
          </div>
        </div>
      </div>

      {/* Missões */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e8eaed',
        borderLeft: '4px solid #fbbc04'
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: '#f9ab00',
          fontWeight: '700',
          marginBottom: '8px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          ⛪ MISSÕES
        </div>
        <div style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#f9ab00',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          {formatarMoeda(resumo?.totalMissoes || 0)}
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          fontWeight: '500'
        }}>
          100% santa ceia
        </div>
      </div>

      {/* Despesas Pagas */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e8eaed',
        borderLeft: '4px solid #ea4335'
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: '#ea4335',
          fontWeight: '700',
          marginBottom: '8px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          💸 DESPESAS PAGAS
        </div>
        <div style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#ea4335',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          {formatarMoeda(resumo?.totalDespesasPagas || 0)}
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          fontWeight: '500'
        }}>
          Despesas pagas no período selecionado
        </div>
      </div>

      {/* Rádio Nazareno */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e8eaed',
        borderLeft: '4px solid #9c27b0'
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: '#9c27b0',
          fontWeight: '700',
          marginBottom: '8px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          📻 RÁDIO NAZARENO
        </div>
        <div style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#9c27b0',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          {formatarMoeda(resumo?.radioNazareno || 0)}
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          fontWeight: '500'
        }}>
          1% do valor local
        </div>
      </div>
    </div>
  );
};

export default CardResumoFinanceiro;