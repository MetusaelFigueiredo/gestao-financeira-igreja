import React, { useState, useEffect } from 'react';
import { buscarResumoFinanceiro, buscarDespesasPendentes, buscarMetaMissoes } from '../services/dashboard';
import { marcarComoPago } from '../services/despesas';
import { formatarMoeda } from '../utils/formatacao';

function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [despesas, setDespesas] = useState(null);
  const [missoes, setMissoes] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    
    const [resultadoResumo, resultadoDespesas, resultadoMissoes] = await Promise.all([
      buscarResumoFinanceiro(),
      buscarDespesasPendentes(),
      buscarMetaMissoes()
    ]);
    
    if (resultadoResumo.success) {
      setResumo(resultadoResumo.resumo);
    }
    
    if (resultadoDespesas.success) {
      setDespesas(resultadoDespesas.despesas);
    }
    
    if (resultadoMissoes.success) {
      setMissoes(resultadoMissoes.missoes);
    }
    
    setCarregando(false);
  };

  const handlePagarDespesa = async (despesaId, formaPagamento = 'Dinheiro') => {
    if (!window.confirm('Confirma o pagamento desta despesa?')) {
      return;
    }

    const resultado = await marcarComoPago(despesaId, formaPagamento);
    
    if (resultado.success) {
      alert('✅ Despesa marcada como paga!');
      carregarDados(); // Recarrega o dashboard
    } else {
      alert('❌ Erro ao marcar despesa como paga: ' + resultado.error);
    }
  };

  if (carregando) {
    return (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          fontSize: '1.125rem',
          color: '#5f6368',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: '500'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #1a73e8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Carregando dados financeiros...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Se ainda não carregou os dados, não renderiza nada
  if (!resumo || !despesas || !missoes) {
    return null;
  }

  const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '40px 24px',
      backgroundColor: '#fafafa'
    }}>
      {/* Cabeçalho */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '2px solid #e8eaed'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#202124',
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          💰 FLUXO DE CAIXA COMPLETO
        </h1>
        <div style={{
          height: '3px',
          width: '120px',
          background: 'linear-gradient(90deg, #1a73e8 0%, #34a853 100%)',
          borderRadius: '2px',
          marginBottom: '12px'
        }} />
        <p style={{
          fontSize: '0.9375rem',
          color: '#5f6368',
          fontWeight: '500',
          textTransform: 'capitalize'
        }}>
          Período: {mesNome}
        </p>
      </div>

      {/* SEÇÃO 1: Resumo Financeiro (3 cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Card Entrada Local */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '2px solid #34a853'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368',
            fontWeight: '600',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            💵 ENTRADA LOCAL
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#34a853',
            marginBottom: '8px'
          }}>
            {formatarMoeda(resumo.totalLocal)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#5f6368'
          }}>
            40% dízimos/ofertas + outras entradas
          </div>
        </div>

        {/* Card Despesas Pagas */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '2px solid #ea4335'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368',
            fontWeight: '600',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            💸 DESPESAS PAGAS
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#ea4335',
            marginBottom: '8px'
          }}>
            {formatarMoeda(resumo.totalDespesasPagas)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#5f6368'
          }}>
            Despesas pagas no mês atual
          </div>
        </div>

        {/* Card Saldo do Mês */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: `2px solid ${resumo.saldoMes >= 0 ? '#34a853' : '#ea4335'}`
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368',
            fontWeight: '600',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            💰 SALDO DO MÊS {resumo.saldoMes >= 0 ? '✅' : '⚠️'}
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: resumo.saldoMes >= 0 ? '#34a853' : '#ea4335',
            marginBottom: '8px'
          }}>
            {formatarMoeda(resumo.saldoMes)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#5f6368'
          }}>
            {resumo.saldoMes >= 0 ? 'Positivo' : 'Negativo'}
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: Detalhamento de Entradas (5 cards) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '2px solid #e8eaed'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: '#202124',
          marginBottom: '20px'
        }}>
          📊 DETALHAMENTO DAS ENTRADAS
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {/* Para Central */}
          <div style={{
            backgroundColor: '#e8f0fe',
            borderRadius: '10px',
            padding: '20px',
            border: '2px solid #1a73e8'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🏛️ PARA CENTRAL
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1a73e8'
            }}>
              {formatarMoeda(resumo.totalCentral)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368',
              marginTop: '4px'
            }}>
              60% dízimos/ofertas
            </div>
          </div>

          {/* Fica Local */}
          <div style={{
            backgroundColor: '#e6f4ea',
            borderRadius: '10px',
            padding: '20px',
            border: '2px solid #34a853'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🏠 FICA LOCAL
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#34a853'
            }}>
              {formatarMoeda(resumo.totalLocal)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368',
              marginTop: '4px'
            }}>
              40% dízimos + outros
            </div>
          </div>

          {/* Missões */}
          <div style={{
            backgroundColor: '#fef7e0',
            borderRadius: '10px',
            padding: '20px',
            border: '2px solid #fbbc04'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              ⛪ MISSÕES
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#fbbc04'
            }}>
              {formatarMoeda(resumo.totalMissoes)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368',
              marginTop: '4px'
            }}>
              100% santa ceia
            </div>
          </div>

          {/* PIX */}
          <div style={{
            backgroundColor: '#f1f3f4',
            borderRadius: '10px',
            padding: '20px',
            border: '2px solid #5f6368'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              💳 PIX
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#202124'
            }}>
              {formatarMoeda(resumo.totalPix)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368',
              marginTop: '4px'
            }}>
              {resumo.percentualPix}% do total local
            </div>
          </div>

          {/* Dinheiro */}
          <div style={{
            backgroundColor: '#f1f3f4',
            borderRadius: '10px',
            padding: '20px',
            border: '2px solid #5f6368'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              💵 DINHEIRO
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#202124'
            }}>
              {formatarMoeda(resumo.totalDinheiro)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368',
              marginTop: '4px'
            }}>
              {resumo.percentualDinheiro}% do total local
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: Meta de Missões */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '2px solid #fbbc04'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: '#202124',
          marginBottom: '16px'
        }}>
          🎯 META DE MISSÕES - {mesNome.toUpperCase()}
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              marginBottom: '4px'
            }}>
              Arrecadado
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#34a853'
            }}>
              {formatarMoeda(missoes.arrecadado)}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              marginBottom: '4px'
            }}>
              Meta
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1a73e8'
            }}>
              {formatarMoeda(missoes.meta)}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              marginBottom: '4px'
            }}>
              Falta
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: missoes.falta > 0 ? '#ea4335' : '#34a853'
            }}>
              {formatarMoeda(missoes.falta)}
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div style={{
          backgroundColor: '#f1f3f4',
          borderRadius: '12px',
          height: '24px',
          overflow: 'hidden',
          position: 'relative',
          border: '2px solid #e8eaed'
        }}>
          <div style={{
            height: '100%',
            width: `${missoes.progresso}%`,
            backgroundColor: parseFloat(missoes.progresso) >= 100 ? '#34a853' : '#fbbc04',
            transition: 'width 1s ease',
            borderRadius: '10px'
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '0.875rem',
            fontWeight: '700',
            color: parseFloat(missoes.progresso) > 50 ? '#ffffff' : '#202124'
          }}>
            {missoes.progresso}%
          </div>
        </div>
      </div>

      {/* SEÇÃO 4: Despesas Pendentes */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '2px solid #e8eaed'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: '#202124',
          marginBottom: '20px'
        }}>
          ⚠️ DESPESAS PENDENTES - PRÓXIMOS 15 DIAS
        </h2>

        {/* Grupo: Vencidas */}
        {despesas.vencidas.length > 0 && (
          <div style={{
            marginBottom: '24px',
            backgroundColor: '#fce8e6',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #ea4335'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#c5221f',
              marginBottom: '16px'
            }}>
              🔴 VENCIDAS ({despesas.vencidas.length})
            </h3>
            {despesas.vencidas.map(d => (
              <div key={d.id} style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                border: '1px solid #ea4335'
              }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#202124',
                    marginBottom: '4px'
                  }}>
                    {d.descricao}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#5f6368'
                  }}>
                    Vencimento: {new Date(d.vencimento).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#ea4335'
                }}>
                  {formatarMoeda(d.valor)}
                </div>
                <button
                  onClick={() => handlePagarDespesa(d.id)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#34a853',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2d8e47'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#34a853'}
                >
                  Pagar
                </button>
              </div>
            ))}
            <div style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#c5221f',
              marginTop: '12px',
              textAlign: 'right'
            }}>
              Total: {formatarMoeda(despesas.totais.vencidas)}
            </div>
          </div>
        )}

        {/* Grupo: Próximos 7 Dias */}
        {despesas.proximos7Dias.length > 0 && (
          <div style={{
            marginBottom: '24px',
            backgroundColor: '#fef7e0',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #fbbc04'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#f9ab00',
              marginBottom: '16px'
            }}>
              🟡 VENCE EM 7 DIAS ({despesas.proximos7Dias.length})
            </h3>
            {despesas.proximos7Dias.map(d => (
              <div key={d.id} style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                border: '1px solid #fbbc04'
              }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#202124',
                    marginBottom: '4px'
                  }}>
                    {d.descricao}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#5f6368'
                  }}>
                    Vencimento: {new Date(d.vencimento).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#f9ab00'
                }}>
                  {formatarMoeda(d.valor)}
                </div>
                <button
                  onClick={() => handlePagarDespesa(d.id)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#34a853',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2d8e47'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#34a853'}
                >
                  Pagar
                </button>
              </div>
            ))}
            <div style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#f9ab00',
              marginTop: '12px',
              textAlign: 'right'
            }}>
              Total: {formatarMoeda(despesas.totais.proximos7)}
            </div>
          </div>
        )}

        {/* Grupo: 8-15 Dias */}
        {despesas.de8a15Dias.length > 0 && (
          <div style={{
            marginBottom: '24px',
            backgroundColor: '#e6f4ea',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #34a853'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#137333',
              marginBottom: '16px'
            }}>
              🟢 VENCE EM 8-15 DIAS ({despesas.de8a15Dias.length})
            </h3>
            {despesas.de8a15Dias.map(d => (
              <div key={d.id} style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                border: '1px solid #34a853'
              }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#202124',
                    marginBottom: '4px'
                  }}>
                    {d.descricao}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#5f6368'
                  }}>
                    Vencimento: {new Date(d.vencimento).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#137333'
                }}>
                  {formatarMoeda(d.valor)}
                </div>
                <button
                  onClick={() => handlePagarDespesa(d.id)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#34a853',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2d8e47'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#34a853'}
                >
                  Pagar
                </button>
              </div>
            ))}
            <div style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#137333',
              marginTop: '12px',
              textAlign: 'right'
            }}>
              Total: {formatarMoeda(despesas.totais.de8a15)}
            </div>
          </div>
        )}

        {/* Totais e Alerta */}
        <div style={{
          backgroundColor: '#f1f3f4',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #e8eaed'
        }}>
          <div style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#202124',
            marginBottom: '12px'
          }}>
            💰 TOTAL A PAGAR: {formatarMoeda(despesas.totais.geral)}
          </div>
          
          {resumo.totalLocal < despesas.totais.geral && (
            <div style={{
              backgroundColor: '#fce8e6',
              borderRadius: '8px',
              padding: '16px',
              border: '2px solid #ea4335'
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#c5221f',
                marginBottom: '8px'
              }}>
                ⚠️ ATENÇÃO: Saldo disponível não cobre todas as contas!
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#5f6368'
              }}>
                Faltam: {formatarMoeda(despesas.totais.geral - resumo.totalLocal)}
              </div>
            </div>
          )}

          {despesas.vencidas.length === 0 && despesas.proximos7Dias.length === 0 && despesas.de8a15Dias.length === 0 && (
            <div style={{
              backgroundColor: '#e6f4ea',
              borderRadius: '8px',
              padding: '16px',
              border: '2px solid #34a853',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#137333'
              }}>
                ✅ Nenhuma despesa pendente nos próximos 15 dias
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;