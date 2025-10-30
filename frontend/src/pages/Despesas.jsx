import React, { useState, useEffect } from 'react';
import FormDespesa from '../components/FormDespesa';
import { 
  buscarDespesas, 
  buscarDespesasMesAtual,
  calcularResumoDespesas,
  marcarComoPago,
  atualizarStatusVencidas,
  deletarDespesa
} from '../services/despesas';
import { formatarMoeda } from '../utils/formatacao';

function Despesas({ usuarioEmail }) {
  const [despesas, setDespesas] = useState([]);
  const [todasDespesas, setTodasDespesas] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [despesaEditando, setDespesaEditando] = useState(null);
  const [filtroAtivo, setFiltroAtivo] = useState('mes-atual'); // 'mes-atual', 'futuras', 'todas'

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    
    try {
      await atualizarStatusVencidas();
      
      const [despesasMesAtual, todasAsDespesas, resumoCarregado] = await Promise.all([
        buscarDespesasMesAtual(),
        buscarDespesas(),
        calcularResumoDespesas()
      ]);
      
      console.log('✅ Despesas do mês carregadas:', despesasMesAtual.length);
      console.log('✅ Todas as despesas carregadas:', todasAsDespesas.length);
      
      setDespesas(despesasMesAtual || []);
      setTodasDespesas(todasAsDespesas || []);
      setResumo(resumoCarregado || null);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setDespesas([]);
      setTodasDespesas([]);
      setResumo(null);
    } finally {
      setCarregando(false);
    }
  };

  const handleMarcarPago = async (despesaId, formaPagamento) => {
    const resultado = await marcarComoPago(despesaId, formaPagamento);
    
    if (resultado.success) {
      alert('✅ Despesa marcada como paga!');
      carregarDados();
    } else {
      alert('❌ Erro ao marcar como paga!');
    }
  };

  const handleEditarDespesa = (despesa) => {
    console.log('📝 Editando despesa:', despesa);
    setDespesaEditando(despesa);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluirDespesa = async (despesaId, descricao) => {
    const confirmar = window.confirm(
      `⚠️ Tem certeza que deseja excluir a despesa:\n\n"${descricao}"?\n\nEsta ação não pode ser desfeita!`
    );

    if (confirmar) {
      try {
        await deletarDespesa(despesaId);
        alert('✅ Despesa excluída com sucesso!');
        carregarDados();
      } catch (error) {
        console.error('❌ Erro ao excluir despesa:', error);
        alert('❌ Erro ao excluir despesa: ' + error.message);
      }
    }
  };

  const handleFecharFormulario = () => {
    setMostrarFormulario(false);
    setDespesaEditando(null);
  };

  const handleSucessoFormulario = () => {
    carregarDados();
    handleFecharFormulario();
  };

  const obterCorStatus = (status) => {
    const cores = {
      'Pendente': '#fbbc04',
      'Paga': '#34a853',
      'Vencida': '#ea4335',
      'Cancelado': '#5f6368'
    };
    return cores[status] || '#5f6368';
  };

  const obterIconeFormaPagamento = (forma) => {
    const icones = {
      'PIX': '💳',
      'Dinheiro': '💵',
      'Crédito': '💳',
      'Débito': '💳',
      'Boleto': '📄',
      'Transferência': '🏦'
    };
    return icones[forma] || '💰';
  };

  // Filtrar despesas conforme aba ativa
  const getDespesasFiltradas = () => {
    const agora = new Date();
    const primeiroDiaMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const ultimoDiaMesAtual = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

    if (filtroAtivo === 'mes-atual') {
      return despesas;
    } else if (filtroAtivo === 'futuras') {
      return todasDespesas.filter(d => {
        const dataVenc = new Date(d.vencimento);
        return dataVenc > ultimoDiaMesAtual;
      });
    } else {
      return todasDespesas;
    }
  };

  const despesasFiltradas = getDespesasFiltradas();

  // Próximos vencimentos
  const proximosVencimentos = despesas
    .filter(d => d.status === 'Pendente' || d.status === 'Vencida')
    .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento))
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
            onClick={() => {
              setDespesaEditando(null);
              setMostrarFormulario(!mostrarFormulario);
            }}
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
            onSuccess={handleSucessoFormulario}
            onCancel={handleFecharFormulario}
            despesaParaEditar={despesaEditando}
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
                backgroundColor: despesa.status === 'Vencida' ? '#fce8e6' : '#fef7e0',
                borderRadius: '8px',
                border: `2px solid ${despesa.status === 'Vencida' ? '#ea4335' : '#fbbc04'}`
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
                    Vence em: {new Date(despesa.vencimento).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: despesa.status === 'Vencida' ? '#ea4335' : '#fbbc04'
                }}>
                  {formatarMoeda(despesa.valor)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABAS DE FILTRO */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        border: '2px solid #e8eaed'
      }}>
        {/* Abas */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid #e8eaed',
          paddingBottom: '12px'
        }}>
          <button
            onClick={() => setFiltroAtivo('mes-atual')}
            style={{
              padding: '10px 20px',
              backgroundColor: filtroAtivo === 'mes-atual' ? '#ea4335' : 'transparent',
              color: filtroAtivo === 'mes-atual' ? '#ffffff' : '#5f6368',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📅 Mês Atual ({despesas.length})
          </button>
          
          <button
            onClick={() => setFiltroAtivo('futuras')}
            style={{
              padding: '10px 20px',
              backgroundColor: filtroAtivo === 'futuras' ? '#ea4335' : 'transparent',
              color: filtroAtivo === 'futuras' ? '#ffffff' : '#5f6368',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🔮 Próximos Meses ({todasDespesas.filter(d => {
              const dataVenc = new Date(d.vencimento);
              const ultimoDiaMesAtual = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
              return dataVenc > ultimoDiaMesAtual;
            }).length})
          </button>

          <button
            onClick={() => setFiltroAtivo('todas')}
            style={{
              padding: '10px 20px',
              backgroundColor: filtroAtivo === 'todas' ? '#ea4335' : 'transparent',
              color: filtroAtivo === 'todas' ? '#ffffff' : '#5f6368',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📋 Todas ({todasDespesas.length})
          </button>
        </div>

        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#202124',
          marginBottom: '24px'
        }}>
          {filtroAtivo === 'mes-atual' && '📋 Despesas do Mês Atual'}
          {filtroAtivo === 'futuras' && '🔮 Despesas Futuras'}
          {filtroAtivo === 'todas' && '📋 Todas as Despesas'}
        </h2>

        {despesasFiltradas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#5f6368'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              Nenhuma despesa encontrada
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {despesasFiltradas.map(despesa => (
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
                        {despesa.status}
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
                          {despesa.parcelaAtual || 1}/{despesa.numeroParcelas}
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
                        📅 Venc: {new Date(despesa.vencimento).toLocaleDateString('pt-BR')}
                      </span>
                      <span>
                        {obterIconeFormaPagamento(despesa.formaPagamento)} {despesa.formaPagamento}
                      </span>
                      {despesa.categoria && (
                        <span>
                          🏷️ {despesa.categoria}
                        </span>
                      )}
                    </div>

                    {despesa.observacoes && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '0.8125rem',
                        color: '#5f6368',
                        fontStyle: 'italic'
                      }}>
                        📝 {despesa.observacoes}
                      </div>
                    )}

                    {despesa.comprovanteURL && (
                      <a
                        href={despesa.comprovanteURL}
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
                      color: despesa.status === 'Paga' ? '#34a853' : '#202124'
                    }}>
                      {formatarMoeda(despesa.valor)}
                    </div>

                    {/* Botões de Ação */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end'
                    }}>
                      {despesa.status !== 'Paga' && despesa.status !== 'Cancelado' && (
                        <button
                          onClick={() => handleMarcarPago(despesa.id, despesa.formaPagamento)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#34a853',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          ✓ Pagar
                        </button>
                      )}

                      <button
                        onClick={() => handleEditarDespesa(despesa)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#1a73e8',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ✏️ Editar
                      </button>

                      <button
                        onClick={() => handleExcluirDespesa(despesa.id, despesa.descricao)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ea4335',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        🗑️ Excluir
                      </button>
                    </div>

                    {/* Data de Pagamento */}
                    {despesa.status === 'Paga' && despesa.dataPagamento && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#34a853',
                        fontWeight: '500'
                      }}>
                        Pago em: {despesa.dataPagamento?.toLocaleDateString?.('pt-BR') || 'Data inválida'}
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