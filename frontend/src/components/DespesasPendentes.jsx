import React from 'react';

const DespesasPendentes = ({ resumo, despesas, formatarMoeda, onPagarDespesa }) => {
  const saldoSuficiente = (resumo?.saldoMes || 0) >= (resumo?.totalDespesasPendentes || 0);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '28px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #e8eaed'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#202124',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        ⏰ Gestão de Despesas
      </h2>

      {/* 📊 ANÁLISE FINANCEIRA - Dados do período filtrado */}
      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        border: '1px solid #e8eaed'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#5f6368',
          margin: '0 0 8px 0',
          textAlign: 'center'
        }}>
          📊 ANÁLISE DO PERÍODO SELECIONADO
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          margin: 0,
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Dados baseados no filtro de mês/ano do Dashboard
        </p>
      </div>

      {/* Análise de Saldo vs Despesas */}
      <div style={{
        backgroundColor: saldoSuficiente ? '#f0f9ff' : '#fef2f2',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: `3px solid ${saldoSuficiente ? '#3b82f6' : '#ef4444'}`
      }}>
        <div style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#202124',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          💰 ANÁLISE FINANCEIRA DO PERÍODO
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e8eaed'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#5f6368', marginBottom: '4px' }}>
              Saldo Disponível
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: saldoSuficiente ? '#34a853' : '#ea4335'
            }}>
              {formatarMoeda(resumo?.saldoMes || 0)}
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e8eaed'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#5f6368', marginBottom: '4px' }}>
              Total Despesas
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#f9ab00'
            }}>
              {formatarMoeda(resumo?.totalDespesasPendentes || 0)}
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e8eaed'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#5f6368', marginBottom: '4px' }}>
              {saldoSuficiente ? 'Saldo Após Pagar' : 'Valor em Falta'}
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: saldoSuficiente ? '#34a853' : '#ea4335'
            }}>
              {saldoSuficiente 
                ? formatarMoeda((resumo?.saldoMes || 0) - (resumo?.totalDespesasPendentes || 0))
                : formatarMoeda((resumo?.totalDespesasPendentes || 0) - (resumo?.saldoMes || 0))
              }
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 DESPESAS URGENTES - Dados do mês vigente (próximos 15 dias) */}
      <div style={{
        backgroundColor: '#fef9e7',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        border: '1px solid #facc15'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#92400e',
          margin: '0 0 8px 0',
          textAlign: 'center'
        }}>
          🚨 DESPESAS URGENTES (MÊS VIGENTE)
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: '#92400e',
          margin: 0,
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Vencimentos dos próximos 15 dias (independente do filtro)
        </p>
      </div>

      {/* Grid de Despesas por Período */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        
        {/* Vencidas */}
        <div style={{
          backgroundColor: '#fef2f2',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #ef4444'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#dc2626',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🚨 Vencidas ({despesas?.vencidas?.length || 0})
          </h3>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#dc2626',
            marginBottom: '16px'
          }}>
            {formatarMoeda(despesas?.totais?.vencidas || 0)}
          </div>
          
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {despesas?.vencidas?.length > 0 ? (
              despesas.vencidas.map(despesa => (
                <div key={despesa.id} style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '10px',
                  borderLeft: '4px solid #dc2626',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#202124',
                    marginBottom: '6px'
                  }}>
                    {despesa.descricao}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#5f6368',
                    marginBottom: '10px'
                  }}>
                    Vencimento: {new Date(despesa.vencimento).toLocaleDateString('pt-BR')}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#dc2626'
                    }}>
                      {formatarMoeda(despesa.valor)}
                    </span>
                    <button
                      onClick={() => onPagarDespesa(despesa.id)}
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#15803d'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#16a34a'}
                    >
                      ✅ Pagar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                color: '#6b7280',
                fontStyle: 'italic',
                textAlign: 'center',
                padding: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '8px'
              }}>
                ✅ Nenhuma despesa vencida
              </div>
            )}
          </div>
        </div>

        {/* Próximos 7 Dias */}
        <div style={{
          backgroundColor: '#fffbeb',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #f59e0b'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#d97706',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ Próximos 7 Dias ({despesas?.proximos7Dias?.length || 0})
          </h3>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#d97706',
            marginBottom: '16px'
          }}>
            {formatarMoeda(despesas?.totais?.proximos7 || 0)}
          </div>
          
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {despesas?.proximos7Dias?.length > 0 ? (
              despesas.proximos7Dias.map(despesa => (
                <div key={despesa.id} style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '10px',
                  borderLeft: '4px solid #f59e0b',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#202124',
                    marginBottom: '6px'
                  }}>
                    {despesa.descricao}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#5f6368',
                    marginBottom: '10px'
                  }}>
                    Vencimento: {new Date(despesa.vencimento).toLocaleDateString('pt-BR')}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#d97706'
                    }}>
                      {formatarMoeda(despesa.valor)}
                    </span>
                    <button
                      onClick={() => onPagarDespesa(despesa.id)}
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#15803d'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#16a34a'}
                    >
                      ✅ Pagar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                color: '#6b7280',
                fontStyle: 'italic',
                textAlign: 'center',
                padding: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '8px'
              }}>
                ✅ Nenhuma despesa nos próximos 7 dias
              </div>
            )}
          </div>
        </div>

        {/* 8 a 15 Dias */}
        <div style={{
          backgroundColor: '#eff6ff',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #3b82f6'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#2563eb',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📅 8 a 30 Dias ({despesas?.de8a15Dias?.length || 0})
          </h3>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#2563eb',
            marginBottom: '16px'
          }}>
            {formatarMoeda(despesas?.totais?.de8a15 || 0)}
          </div>
          
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {despesas?.de8a15Dias?.length > 0 ? (
              despesas.de8a15Dias.map(despesa => (
                <div key={despesa.id} style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '10px',
                  borderLeft: '4px solid #3b82f6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#202124',
                    marginBottom: '6px'
                  }}>
                    {despesa.descricao}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#5f6368',
                    marginBottom: '10px'
                  }}>
                    Vencimento: {new Date(despesa.vencimento).toLocaleDateString('pt-BR')}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#2563eb'
                    }}>
                      {formatarMoeda(despesa.valor)}
                    </span>
                    <button
                      onClick={() => onPagarDespesa(despesa.id)}
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#15803d'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#16a34a'}
                    >
                      ✅ Pagar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                color: '#6b7280',
                fontStyle: 'italic',
                textAlign: 'center',
                padding: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '8px'
              }}>
                ✅ Nenhuma despesa de 8 a 30 dias
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📊 RESUMO CONSOLIDADO - Dados do mês vigente */}
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        border: '1px solid #3b82f6'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1d4ed8',
          margin: '0 0 8px 0',
          textAlign: 'center'
        }}>
          📊 CONSOLIDADO URGÊNCIAS
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: '#1d4ed8',
          margin: 0,
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Totais das despesas urgentes acima
        </p>
      </div>

      {/* Resumo Total das Despesas */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          color: '#202124',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📊 Resumo das Urgências
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ 
            textAlign: 'center',
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#dc2626',
              marginBottom: '4px'
            }}>
              {formatarMoeda(despesas?.totais?.vencidas || 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Vencidas
            </div>
          </div>
          <div style={{ 
            textAlign: 'center',
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#d97706',
              marginBottom: '4px'
            }}>
              {formatarMoeda(despesas?.totais?.proximos7 || 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Próximos 7 dias
            </div>
          </div>
          <div style={{ 
            textAlign: 'center',
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#2563eb',
              marginBottom: '4px'
            }}>
              {formatarMoeda(despesas?.totais?.de8a15 || 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              8 a 15 dias
            </div>
          </div>
          <div style={{ 
            textAlign: 'center',
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            border: '2px solid #374151'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '4px'
            }}>
              {formatarMoeda(despesas?.totais?.geral || 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
              TOTAL GERAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DespesasPendentes;