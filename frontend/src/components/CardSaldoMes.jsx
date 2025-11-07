import React from 'react';

const CardSaldoMes = ({ resumo, formatarMoeda }) => {
  const isPositivo = (resumo?.saldoMes || 0) >= 0;
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    }}>
      
      {/* Card 1: SALDO DO MÊS */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8eaed',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            fontSize: '0.75rem',
            color: '#5f6368',
            fontWeight: '600',
            marginBottom: '12px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            💰 SALDO DO MÊS {isPositivo ? '✅' : '⚠️'}
          </div>
          
          <div style={{
            fontSize: '2.25rem',
            fontWeight: '700',
            color: isPositivo ? '#34a853' : '#ea4335',
            marginBottom: '12px',
            letterSpacing: '-1px',
            lineHeight: '1'
          }}>
            {formatarMoeda(resumo?.saldoMes || 0)}
          </div>
        </div>
        
        <div style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          fontWeight: '500',
          paddingTop: '12px',
          borderTop: '1px solid #e8eaed'
        }}>
          {isPositivo ? '✨ Positivo' : '📉 Negativo'} - Saldo real após despesas
        </div>
      </div>

      {/* Card 2: COMPOSIÇÃO DO SALDO */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8eaed'
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: '#5f6368',
          fontWeight: '700',
          marginBottom: '16px',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          📊 COMPOSIÇÃO DO SALDO
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontSize: '0.875rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#5f6368', fontWeight: '500' }}>
              💵 Local atual
            </span>
            <span style={{ fontWeight: '700', color: '#202124' }}>
              {formatarMoeda(resumo?.totalLocal || 0)}
            </span>
          </div>
          
          {(resumo?.saldoRotativo || 0) > 0 ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#5f6368', fontWeight: '500' }}>
                🔄 Saldo anterior
              </span>
              <span style={{ fontWeight: '700', color: '#202124' }}>
                {formatarMoeda(resumo?.saldoRotativo || 0)}
              </span>
            </div>
          ) : null}
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#5f6368', fontWeight: '500' }}>
              💸 Despesas pagas
            </span>
            <span style={{ fontWeight: '700', color: '#ea4335' }}>
              -{formatarMoeda(resumo?.totalDespesasPagas || 0)}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            marginTop: '4px',
            borderTop: '2px solid #e8eaed',
            fontSize: '0.95rem'
          }}>
            <span style={{ fontWeight: '700', color: '#202124' }}>
              💰 SALDO FINAL
            </span>
            <span style={{ 
              fontWeight: '700',
              fontSize: '1.1rem',
              color: isPositivo ? '#34a853' : '#ea4335'
            }}>
              {formatarMoeda(resumo?.saldoMes || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: ENTRADA TOTAL DO MÊS */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8eaed'
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: '#5f6368',
          fontWeight: '700',
          marginBottom: '16px',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          � ENTRADA TOTAL DO MÊS
        </div>
        
        {/* Valor principal destacado */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#34a853',
            marginBottom: '4px',
            letterSpacing: '-1px'
          }}>
            {formatarMoeda((resumo?.totalCentral || 0) + (resumo?.totalLocal || 0) + (resumo?.totalMissoes || 0))}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368',
            fontWeight: '500'
          }}>
            Arrecadação consolidada
          </div>
        </div>
        
        {/* Breakdown das entradas */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontSize: '0.875rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#5f6368', fontWeight: '500' }}>
              💳 PIX:
            </span>
            <span style={{ fontWeight: '700', color: '#1a73e8' }}>
              {formatarMoeda(resumo?.totalPix || 0)}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#5f6368', fontWeight: '500' }}>
              💵 Dinheiro:
            </span>
            <span style={{ fontWeight: '700', color: '#f9ab00' }}>
              {formatarMoeda(resumo?.totalDinheiro || 0)}
            </span>
          </div>

          <div style={{
            marginTop: '8px',
            paddingTop: '12px',
            borderTop: '1px solid #e8eaed'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368',
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              Resumo do mês
            </div>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#e6f4ea',
              color: '#137333',
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              � Ofertas e dízimos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSaldoMes;