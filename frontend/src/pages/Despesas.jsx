import React, { useState, useEffect } from 'react';
import FormDespesa from '../components/FormDespesa';
import { 
  buscarDespesas, 
  buscarDespesasMesAtual,
  calcularResumoDespesas,
  marcarComoPago,
  atualizarStatusVencidas
} from '../services/despesas';
import { formatarMoeda } from '../utils/formatacao';

function Despesas({ usuarioEmail }) {
  const [despesas, setDespesas] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    
    // Atualizar status de vencidas primeiro
    await atualizarStatusVencidas();
    
    const [resultadoDespesas, resultadoResumo] = await Promise.all([
      buscarDespesasMesAtual(),
      calcularResumoDespesas()
    ]);
    
    if (resultadoDespesas.success) {
      setDespesas(resultadoDespesas.despesas);
    }
    
    if (resultadoResumo.success) {
      setResumo(resultadoResumo.resumo);
    }
    
    setCarregando(false);
  };

  const handleMarcarPago = async (despesaId, formaPagamento) => {
    const resultado = await marcarComoPago(despesaId, formaPagamento);
    
    if (resultado.success) {
      carregarDados();
    }
  };

  const obterCorStatus = (status) => {
    const cores = {
      'a_pagar': '#fbbc04',
      'pago': '#34a853',
      'vencido': '#ea4335',
      'cancelado': '#5f6368',
      'parcialmente_pago': '#1a73e8'
    };
    return cores[status] || '#5f6368';
  };

  const obterTextoStatus = (status) => {
    const textos = {
      'a_pagar': 'A Pagar',
      'pago': 'Pago',
      'vencido': 'Vencido',
      'cancelado': 'Cancelado',
      'parcialmente_pago': 'Parc. Pago'
    };
    return textos[status] || status;
  };

  const obterIconeFormaPagamento = (forma) => {
    const icones = {
      'pix': '💳',
      'dinheiro': '💵',
      'cartao_credito': '💳',
      'boleto': '📄',
      'transferencia': '🏦'
    };
    return icones[forma] || '💰';
  };

  // Filtrar próximos vencimentos (próximos 7 dias, não pagos)
  const proximosVencimentos = despesas
    .filter(d => d.status === 'a_pagar' || d.status === 'vencido')
    .sort((a, b) => a.dataVencimento - b.dataVencimento)
    .slice(0, 5);

  const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

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
            borderTop: '4px solid #ea4335',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Carregando despesas...
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
              💸 DESPESAS
            </h1>
            <div style={{
              height: '3px',
              width: '100px',
              background: 'linear-gradient(90deg, #ea4335 0%, #fbbc04 100%)',
              borderRadius: '2px',
              marginBottom: '12px'
            }} />
            <p style={{
              fontSize: '0.9375rem',
              color: '#5f6368',
              fontWeight: '500',
              textTransform: 'capitalize'
            }}>
              Período de referência: {mesNome}
            </p>
          </div>
          
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            style={{
              padding: '14px 28px',
              backgroundColor: mostrarFormulario ? '#5f6368' : '#ea4335',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(234, 67, 53, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(234, 67, 53, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 67, 53, 0.3)';
            }}
          >
            {mostrarFormulario ? '✕ Fechar' : '＋ Nova Despesa'}
          </button>
        </div>
      </div>

      {/* Formulário */}
      {mostrarFormulario && (
        <div style={{ marginBottom: '32px' }}>
          <FormDespesa 
            onSucesso={() => {
              carregarDados();
              setMostrarFormulario(false);
            }}
            usuarioEmail={usuarioEmail}
          />
        </div>
      )}

      {/* Cards de Resumo */}
      {resumo && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Total do Mês */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '3px solid #5f6368'
          }}>
            <div style={{
              fontSize: '0.8125rem',
              color: '#5f6368',
              fontWeight: '600',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              TOTAL DO MÊS
            </div>
            <div style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#202124',
              marginBottom: '4px'
            }}>
              {formatarMoeda(resumo.total)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368'
            }}>
              {resumo.quantidadeTotal} lançamento(s)
            </div>
          </div>

          {/* Pagas */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '3px solid #34a853'
          }}>
            <div style={{
              fontSize: '0.8125rem',
              color: '#5f6368',
              fontWeight: '600',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              ✅ PAGAS
            </div>
            <div style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#34a853',
              marginBottom: '4px'
            }}>
              {formatarMoeda(resumo.pagas)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368'
            }}>
              {resumo.quantidadePagas} paga(s)
            </div>
          </div>

          {/* Pendentes */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '3px solid #fbbc04'
          }}>
            <div style={{
              fontSize: '0.8125rem',
              color: '#5f6368',
              fontWeight: '600',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              ⏳ PENDENTES
            </div>
            <div style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#fbbc04',
              marginBottom: '4px'
            }}>
              {formatarMoeda(resumo.pendentes)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368'
            }}>
              {resumo.quantidadePendentes} pendente(s)
            </div>
          </div>

          {/* Vencidas */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '3px solid #ea4335'
          }}>
            <div style={{
              fontSize: '0.8125rem',
              color: '#5f6368',
              fontWeight: '600',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              ⚠️ VENCIDAS
            </div>
            <div style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#ea4335',
              marginBottom: '4px'
            }}>
              {formatarMoeda(resumo.vencidas)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368'
            }}>
              {resumo.quantidadeVencidas} vencida(s)
            </div>
          </div>
        </div>
      )}

      {/* Próximos Vencimentos */}
      {proximosVencimentos.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '32px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '2px solid #fbbc04'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#202124',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ Próximos Vencimentos
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {proximosVencimentos.map(despesa => (
              <div key={despesa.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: despesa.status === 'vencido' ? '#fce8e6' : '#fef7e0',
                borderRadius: '8px',
                border: `2px solid ${despesa.status === 'vencido' ? '#ea4335' : '#fbbc04'}`
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    color: '#202124',
                    marginBottom: '4px'
                  }}>
                    {despesa.descricao}
                  </div>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#5f6368'
                  }}>
                    Vence em: {despesa.dataVencimento.toLocaleDateString('pt-BR')}
                  </div>
                </div>
                
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: despesa.status === 'vencido' ? '#ea4335' : '#fbbc04'
                }}>
                  {formatarMoeda(despesa.valor)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Despesas */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        border: '2px solid #e8eaed'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#202124',
          marginBottom: '24px'
        }}>
          📋 Todas as Despesas do Mês
        </h2>

        {despesas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#5f6368'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              Nenhuma despesa cadastrada neste mês
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {despesas.map(despesa => (
              <div key={despesa.id} style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                border: `2px solid ${obterCorStatus(despesa.status)}`,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  {/* Info Principal */}
                  <div style={{ flex: '1', minWidth: '250px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: `${obterCorStatus(despesa.status)}20`,
                        color: obterCorStatus(despesa.status),
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        border: `2px solid ${obterCorStatus(despesa.status)}`
                      }}>
                        {obterTextoStatus(despesa.status)}
                      </div>

                      {despesa.parcelado && (
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#e8f0fe',
                          color: '#1a73e8',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          border: '1px solid #1a73e8'
                        }}>
                          {despesa.parcelaAtual}/{despesa.numeroParcelas}
                        </div>
                      )}
                    </div>

                    <div style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#202124',
                      marginBottom: '8px'
                    }}>
                      {despesa.descricao}
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '0.8125rem',
                      color: '#5f6368',
                      flexWrap: 'wrap'
                    }}>
                      <span>
                        📅 Venc: {despesa.dataVencimento.toLocaleDateString('pt-BR')}
                      </span>
                      <span>
                        {obterIconeFormaPagamento(despesa.formaPagamento)} {despesa.formaPagamento.replace('_', ' ')}
                      </span>
                      {despesa.fornecedor && (
                        <span>
                          🏢 {despesa.fornecedor}
                        </span>
                      )}
                    </div>

                    {despesa.comprovante && (
                      <a
                        href={despesa.comprovante.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          marginTop: '8px',
                          padding: '6px 12px',
                          backgroundColor: '#e6f4ea',
                          color: '#137333',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          textDecoration: 'none',
                          fontWeight: '500',
                          border: '1px solid #34a853'
                        }}
                      >
                        📎 Ver Comprovante
                      </a>
                    )}
                  </div>

                  {/* Valor e Ações */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '12px'
                  }}>
                    <div style={{
                      fontSize: '1.75rem',
                      fontWeight: '700',
                      color: despesa.status === 'pago' ? '#34a853' : '#202124'
                    }}>
                      {formatarMoeda(despesa.valor)}
                    </div>

                    {despesa.status !== 'pago' && despesa.status !== 'cancelado' && (
                      <button
                        onClick={() => handleMarcarPago(despesa.id, despesa.formaPagamento)}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#34a853',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ✓ Marcar como Pago
                      </button>
                    )}

                    {despesa.status === 'pago' && despesa.dataPagamento && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#34a853',
                        fontWeight: '500'
                      }}>
                        Pago em: {despesa.dataPagamento.toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Despesas;