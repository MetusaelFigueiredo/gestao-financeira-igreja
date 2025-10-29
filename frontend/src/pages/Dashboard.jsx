import React, { useState, useEffect } from 'react';
import { calcularSaldos, calcularEstatisticasMes } from '../services/dashboard';
import { formatarMoeda } from '../utils/formatacao';

function Dashboard() {
 const [saldos, setSaldos] = useState({
  central: 0, centralPix: 0, centralDinheiro: 0,
  local: 0, localPix: 0, localDinheiro: 0,
  missoes: 0, missoesPix: 0, missoesDinheiro: 0,
  total: 0
});
  const [estatisticas, setEstatisticas] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    
    const [resultadoSaldos, resultadoEstatisticas] = await Promise.all([
      calcularSaldos(),
      calcularEstatisticasMes()
    ]);
    
    if (resultadoSaldos.success) {
      setSaldos(resultadoSaldos.saldos);
    }
    
    if (resultadoEstatisticas.success) {
      setEstatisticas(resultadoEstatisticas.estatisticas);
    }
    
    setCarregando(false);
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

  const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '40px 24px',
      backgroundColor: '#fafafa'
    }}>
      {/* Cabeçalho Premium */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '2px solid #e8eaed',
        background: 'linear-gradient(to right, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#202124',
              marginBottom: '8px',
              letterSpacing: '-0.5px'
            }}>
              💰 DASHBOARD FINANCEIRO
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
              textTransform: 'capitalize',
              letterSpacing: '0.3px'
            }}>
              Período de referência: {mesNome}
            </p>
          </div>
          
          <div style={{
            padding: '16px 24px',
            backgroundColor: '#f1f3f4',
            borderRadius: '12px',
            border: '2px solid #e8eaed'
          }}>
            <div style={{
              fontSize: '0.8125rem',
              color: '#5f6368',
              fontWeight: '600',
              marginBottom: '4px',
              letterSpacing: '0.5px'
            }}>
              SALDO TOTAL
            </div>
            <div style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#1a73e8',
              letterSpacing: '-0.5px'
            }}>
              {formatarMoeda(saldos.total)}
            </div>
          </div>
        </div>
      </div>

            {/* Cards de Saldos - Estilo Executivo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Card Central */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
          border: '3px solid #1a73e8',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(26, 115, 232, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.15)';
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            backgroundColor: '#1a73e8',
            opacity: 0.05,
            borderRadius: '50%'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#e8f0fe',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              border: '2px solid #1a73e8'
            }}>
              🏛️
            </div>
            <div>
              <div style={{
                fontSize: '0.8125rem',
                color: '#5f6368',
                fontWeight: '600',
                letterSpacing: '1px',
                marginBottom: '4px'
              }}>
                CONTA CENTRAL
              </div>
              <div style={{
                height: '2px',
                width: '60px',
                backgroundColor: '#1a73e8'
              }} />
            </div>
          </div>
          
          <div style={{
            fontSize: '2.25rem',
            fontWeight: '700',
            color: '#202124',
            marginBottom: '20px',
            letterSpacing: '-1px'
          }}>
            {formatarMoeda(saldos.central)}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '2px solid #f1f3f4',
            marginBottom: '16px'
          }}>
            <div style={{
              backgroundColor: '#e8f0fe',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #1a73e8'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#5f6368',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                💳 PIX
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#1a73e8'
              }}>
                {formatarMoeda(saldos.centralPix)}
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#e8f0fe',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #1a73e8'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#5f6368',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                💵 Dinheiro
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#1a73e8'
              }}>
                {formatarMoeda(saldos.centralDinheiro)}
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '0.8125rem',
            color: '#5f6368',
            fontWeight: '500'
          }}>
            60% dos Dízimos e Ofertas
          </div>
        </div>

        {/* Card Local */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
          border: '3px solid #34a853',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(52, 168, 83, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.15)';
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            backgroundColor: '#34a853',
            opacity: 0.05,
            borderRadius: '50%'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#e6f4ea',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              border: '2px solid #34a853'
            }}>
              🏠
            </div>
            <div>
              <div style={{
                fontSize: '0.8125rem',
                color: '#5f6368',
                fontWeight: '600',
                letterSpacing: '1px',
                marginBottom: '4px'
              }}>
                CONTA LOCAL
              </div>
              <div style={{
                height: '2px',
                width: '60px',
                backgroundColor: '#34a853'
              }} />
            </div>
          </div>
          
          <div style={{
            fontSize: '2.25rem',
            fontWeight: '700',
            color: '#202124',
            marginBottom: '20px',
            letterSpacing: '-1px'
          }}>
            {formatarMoeda(saldos.local)}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '2px solid #f1f3f4',
            marginBottom: '16px'
          }}>
            <div style={{
              backgroundColor: '#e6f4ea',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #34a853'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#5f6368',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                💳 PIX
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#34a853'
              }}>
                {formatarMoeda(saldos.localPix)}
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#e6f4ea',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #34a853'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#5f6368',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                💵 Dinheiro
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#34a853'
              }}>
                {formatarMoeda(saldos.localDinheiro)}
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '0.8125rem',
            color: '#5f6368',
            fontWeight: '500'
          }}>
            40% Dízimos + Cantina/Eventos
          </div>
        </div>

        {/* Card Missões */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
          border: '3px solid #fbbc04',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(251, 188, 4, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.15)';
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            backgroundColor: '#fbbc04',
            opacity: 0.05,
            borderRadius: '50%'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#fef7e0',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              border: '2px solid #fbbc04'
            }}>
              🌍
            </div>
            <div>
              <div style={{
                fontSize: '0.8125rem',
                color: '#5f6368',
                fontWeight: '600',
                letterSpacing: '1px',
                marginBottom: '4px'
              }}>
                MISSÕES
              </div>
              <div style={{
                height: '2px',
                width: '60px',
                backgroundColor: '#fbbc04'
              }} />
            </div>
          </div>
          
          <div style={{
            fontSize: '2.25rem',
            fontWeight: '700',
            color: '#202124',
            marginBottom: '20px',
            letterSpacing: '-1px'
          }}>
            {formatarMoeda(saldos.missoes)}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '2px solid #f1f3f4',
            marginBottom: '16px'
          }}>
            <div style={{
              backgroundColor: '#fef7e0',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #fbbc04'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#5f6368',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                💳 PIX
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#fbbc04'
              }}>
                {formatarMoeda(saldos.missoesPix)}
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#fef7e0',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #fbbc04'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#5f6368',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                💵 Dinheiro
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#fbbc04'
              }}>
                {formatarMoeda(saldos.missoesDinheiro)}
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '0.8125rem',
            color: '#5f6368',
            fontWeight: '500'
          }}>
            100% Ofertas Santa Ceia
          </div>
        </div>
      </div>

      {/* Análise Detalhada */}
      {estatisticas && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {/* Card Resumo do Mês */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
            border: '2px solid #e8eaed'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                📊
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#202124',
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  RESUMO DO MÊS
                </h3>
                <div style={{
                  height: '2px',
                  width: '80px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                }} />
              </div>
            </div>
            
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#202124',
              marginBottom: '20px',
              letterSpacing: '-0.5px'
            }}>
              {formatarMoeda(estatisticas.totalMesAtual)}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: estatisticas.variacao >= 0 ? '#e6f4ea' : '#fce8e6',
                border: `2px solid ${estatisticas.variacao >= 0 ? '#34a853' : '#ea4335'}`,
                fontWeight: '700',
                fontSize: '0.9375rem',
                color: estatisticas.variacao >= 0 ? '#137333' : '#c5221f'
              }}>
                {estatisticas.variacao >= 0 ? '▲' : '▼'} {Math.abs(estatisticas.variacao).toFixed(1)}%
              </div>
              <span style={{
                color: '#5f6368',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                vs mês anterior
              </span>
            </div>

            <div style={{
              paddingTop: '20px',
              borderTop: '3px solid #f1f3f4',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              <div>
                <div style={{
                  fontSize: '0.8125rem',
                  color: '#5f6368',
                  fontWeight: '600',
                  marginBottom: '4px',
                  letterSpacing: '0.5px'
                }}>
                  LANÇAMENTOS
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#202124'
                }}>
                  {estatisticas.quantidadeEntradas}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '0.8125rem',
                  color: '#5f6368',
                  fontWeight: '600',
                  marginBottom: '4px',
                  letterSpacing: '0.5px'
                }}>
                  MÊS ANTERIOR
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#5f6368'
                }}>
                  {formatarMoeda(estatisticas.totalMesAnterior)}
                </div>
              </div>
            </div>
          </div>

          {/* Card Distribuição por Tipo */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
            border: '2px solid #e8eaed'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '28px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)'
              }}>
                📈
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#202124',
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  ANÁLISE DETALHADA
                </h3>
                <div style={{
                  height: '2px',
                  width: '80px',
                  background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Dízimos */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#e8f0fe',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #1a73e8'
                    }}>
                      💰
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#5f6368',
                      fontWeight: '600'
                    }}>
                      Dízimos
                    </span>
                  </div>
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#1a73e8'
                  }}>
                    {formatarMoeda(estatisticas.porTipo.dizimo)}
                  </span>
                </div>
                <div style={{
                  height: '10px',
                  backgroundColor: '#f1f3f4',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #e8eaed'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(estatisticas.porTipo.dizimo / estatisticas.totalMesAtual) * 100}%`,
                    backgroundColor: '#1a73e8',
                    borderRadius: '6px',
                    transition: 'width 1s ease'
                  }} />
                </div>
              </div>

              {/* Ofertas */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#e6f4ea',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #34a853'
                    }}>
                      🎁
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#5f6368',
                      fontWeight: '600'
                    }}>
                      Ofertas
                    </span>
                  </div>
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#34a853'
                  }}>
                    {formatarMoeda(estatisticas.porTipo.oferta)}
                  </span>
                </div>
                <div style={{
                  height: '10px',
                  backgroundColor: '#f1f3f4',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #e8eaed'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(estatisticas.porTipo.oferta / estatisticas.totalMesAtual) * 100}%`,
                    backgroundColor: '#34a853',
                    borderRadius: '6px',
                    transition: 'width 1s ease'
                  }} />
                </div>
              </div>

              {/* Santa Ceia */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#fef7e0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #fbbc04'
                    }}>
                      🍞
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#5f6368',
                      fontWeight: '600'
                    }}>
                      Santa Ceia
                    </span>
                  </div>
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#fbbc04'
                  }}>
                    {formatarMoeda(estatisticas.porTipo.santa_ceia)}
                  </span>
                </div>
                <div style={{
                  height: '10px',
                  backgroundColor: '#f1f3f4',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #e8eaed'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(estatisticas.porTipo.santa_ceia / estatisticas.totalMesAtual) * 100}%`,
                    backgroundColor: '#fbbc04',
                    borderRadius: '6px',
                    transition: 'width 1s ease'
                  }} />
                </div>
              </div>

              {/* Outros */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#f3e5f5',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #9334e6'
                    }}>
                      📦
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#5f6368',
                      fontWeight: '600'
                    }}>
                      Outros
                    </span>
                  </div>
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#9334e6'
                  }}>
                    {formatarMoeda(estatisticas.porTipo.outros)}
                  </span>
                </div>
                <div style={{
                  height: '10px',
                  backgroundColor: '#f1f3f4',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #e8eaed'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(estatisticas.porTipo.outros / estatisticas.totalMesAtual) * 100}%`,
                    backgroundColor: '#9334e6',
                    borderRadius: '6px',
                    transition: 'width 1s ease'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;