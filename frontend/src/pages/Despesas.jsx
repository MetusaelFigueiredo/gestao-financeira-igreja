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
import { exportarParaCalendario } from '../services/calendario';

function Despesas({ usuarioEmail }) {
  const [despesas, setDespesas] = useState([]);
  const [todasDespesas, setTodasDespesas] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [despesaEditando, setDespesaEditando] = useState(null);
  
  // Estados para filtros de data (removendo filtroAtivo)
  const dataAtual = new Date();
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth());

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

  // Filtrar despesas pelo mês/ano selecionado
  const despesasFiltradas = todasDespesas.filter(despesa => {
    if (!despesa.vencimento) return false;
    const dataVencimento = new Date(despesa.vencimento);
    return dataVencimento.getMonth() === mesSelecionado && 
           dataVencimento.getFullYear() === anoSelecionado;
  });

  // Calcular resumo baseado no período filtrado
  const calcularResumoFiltrado = () => {
    const total = despesasFiltradas.reduce((sum, d) => sum + d.valor, 0);
    const pagas = despesasFiltradas.filter(d => d.status === 'Paga');
    const totalPagas = pagas.reduce((sum, d) => sum + d.valor, 0);
    const pendentes = despesasFiltradas.filter(d => d.status === 'Pendente');
    const totalPendentes = pendentes.reduce((sum, d) => sum + d.valor, 0);
    const vencidas = despesasFiltradas.filter(d => d.status === 'Vencida');
    const totalVencidas = vencidas.reduce((sum, d) => sum + d.valor, 0);

    return {
      total,
      totalPagas,
      totalPendentes,
      totalVencidas,
      quantidadePagas: pagas.length,
      quantidadePendentes: pendentes.length,
      quantidadeVencidas: vencidas.length,
      quantidadeTotal: despesasFiltradas.length
    };
  };

  const resumoFiltrado = calcularResumoFiltrado();

  // Arrays para os seletores
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const anosDisponiveis = [];
  for (let ano = 2020; ano <= new Date().getFullYear() + 1; ano++) {
    anosDisponiveis.push(ano);
  }

  // Nome do período atual
  const dataFiltro = new Date(anoSelecionado, mesSelecionado, 1);
  const nomePeriodo = dataFiltro.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const nomePeriodoCapitalizado = nomePeriodo.charAt(0).toUpperCase() + nomePeriodo.slice(1);

  // Ordenar despesas filtradas por data de vencimento
  const despesasOrdenadas = despesasFiltradas.sort((a, b) => {
    const dataA = new Date(a.vencimento);
    const dataB = new Date(b.vencimento);
    return dataB.getTime() - dataA.getTime(); // Mais recente primeiro
  });

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
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
              borderRadius: '2px'
            }} />
          </div>
          
          {/* Filtros de Data */}
          <div className="filters-container" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.875rem', color: '#5f6368', fontWeight: '500' }}>
              📅 Filtros:
            </label>
            
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#202124',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {meses.map((mes, index) => (
                <option key={index} value={index}>{mes}</option>
              ))}
            </select>
            
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#202124',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
            
            <button
              onClick={() => {
                const hoje = new Date();
                setAnoSelecionado(hoje.getFullYear());
                setMesSelecionado(hoje.getMonth());
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: '#1a73e8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              📅 Hoje
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{
            fontSize: '0.9375rem',
            color: '#5f6368',
            fontWeight: '500',
            textTransform: 'capitalize',
            margin: 0
          }}>
            Período: {nomePeriodoCapitalizado}
          </p>
          
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
            {formatarMoeda(resumoFiltrado.total)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#5f6368'
          }}>
            {resumoFiltrado.quantidadeTotal} lançamento(s)
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
            {formatarMoeda(resumoFiltrado.totalPagas)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#5f6368'
          }}>
            {resumoFiltrado.quantidadePagas} paga(s)
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
            {formatarMoeda(resumoFiltrado.totalPendentes)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#5f6368'
          }}>
            {resumoFiltrado.quantidadePendentes} pendente(s)
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
            {formatarMoeda(resumoFiltrado.totalVencidas)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#5f6368'
          }}>
            {resumoFiltrado.quantidadeVencidas} vencida(s)
          </div>
        </div>
      </div>



      {/* Lista de Despesas */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e8eaed'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '500',
            color: '#202124',
            margin: 0
          }}>
            Histórico de Despesas
          </h2>
          <span style={{
            fontSize: '0.875rem',
            color: '#5f6368',
            backgroundColor: '#f1f3f4',
            padding: '4px 12px',
            borderRadius: '12px',
            fontWeight: '500'
          }}>
            {despesasOrdenadas.length} {despesasOrdenadas.length === 1 ? 'despesa' : 'despesas'}
          </span>
        </div>

        {despesasOrdenadas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#5f6368'
          }}>
            {todasDespesas.length === 0 
              ? 'Nenhuma despesa cadastrada ainda.' 
              : `Nenhuma despesa encontrada para ${nomePeriodoCapitalizado}.`
            }
          </div>
        ) : (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            border: '1px solid #e8eaed'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#202124',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📋 TODAS AS DESPESAS
              <span style={{
                fontSize: '0.875rem',
                color: '#5f6368',
                fontWeight: '400'
              }}>
                ({despesasOrdenadas.length} despesa{despesasOrdenadas.length !== 1 ? 's' : ''})
              </span>
            </h3>
            
            <div style={{
              overflowX: 'auto',
              border: '1px solid #e8eaed',
              borderRadius: '8px'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      📅 Vencimento
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      📝 Descrição
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      🏷️ Status
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      💳 Forma
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      💰 Valor
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      ⚙️ Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {despesasOrdenadas.map((despesa, index) => (
                    <tr key={despesa.id} style={{
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                    }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed' }}>
                        {new Date(despesa.vencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed', maxWidth: '250px' }}>
                        <div style={{ 
                          fontWeight: '500',
                          color: '#202124',
                          marginBottom: '2px'
                        }}>
                          {despesa.descricao}
                        </div>
                        {despesa.categoria && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#5f6368',
                            marginBottom: '2px'
                          }}>
                            📂 {despesa.categoria}
                          </div>
                        )}
                        {despesa.observacoes && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#5f6368',
                            fontStyle: 'italic'
                          }}>
                            {despesa.observacoes}
                          </div>
                        )}
                        {despesa.parcelado && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#1a73e8',
                            fontWeight: '500'
                          }}>
                            📊 Parcela {despesa.parcelaAtual || 1}/{despesa.numeroParcelas}
                          </div>
                        )}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        borderBottom: '1px solid #e8eaed',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: despesa.status === 'Paga' ? '#e8f5e8' : despesa.status === 'Vencida' ? '#fce8e6' : '#fff3cd',
                          color: despesa.status === 'Paga' ? '#34a853' : despesa.status === 'Vencida' ? '#ea4335' : '#f9ab00'
                        }}>
                          {despesa.status}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        borderBottom: '1px solid #e8eaed',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f1f3f4',
                          color: '#5f6368'
                        }}>
                          {despesa.formaPagamento}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        borderBottom: '1px solid #e8eaed',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: despesa.status === 'Paga' ? '#34a853' : '#ea4335',
                        fontSize: '1rem'
                      }}>
                        {formatarMoeda(despesa.valor)}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        borderBottom: '1px solid #e8eaed',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          {/* Botão Pagar */}
                          {despesa.status !== 'Paga' && despesa.status !== 'Cancelado' && (
                            <button
                              onClick={() => handleMarcarPago(despesa.id, despesa.formaPagamento)}
                              title="Marcar como Paga"
                              style={{
                                padding: '6px 8px',
                                backgroundColor: '#34a853',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#2d8f3f'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#34a853'}
                            >
                              ✓
                            </button>
                          )}
                          
                          {/* Botão Editar */}
                          <button
                            onClick={() => handleEditarDespesa(despesa)}
                            title="Editar"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: '#1a73e8',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#1557b0'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#1a73e8'}
                          >
                            ✏️
                          </button>
                          
                          {/* Botão Excluir */}
                          <button
                            onClick={() => handleExcluirDespesa(despesa.id, despesa.descricao)}
                            title="Excluir"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: '#ea4335',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#d33b2c'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#ea4335'}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Despesas;