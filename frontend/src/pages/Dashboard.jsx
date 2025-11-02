import React, { useState, useEffect } from 'react';
import { buscarResumoFinanceiro, buscarDespesasPendentes, buscarMetaMissoes, atualizarMetaMissoes } from '../services/dashboard';
import { marcarComoPago } from '../services/despesas';
import { formatarMoeda } from '../utils/formatacao';

function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [despesas, setDespesas] = useState(null);
  const [missoes, setMissoes] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [modoEdicaoMeta, setModoEdicaoMeta] = useState(false);
  const [novaMeta, setNovaMeta] = useState('');
  
  // Estados para filtros de data
  const dataAtual = new Date();
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth());

  useEffect(() => {
    carregarDados();
  }, [anoSelecionado, mesSelecionado]); // Recarrega quando filtros mudarem

  const carregarDados = async () => {
    console.log('🔄 Iniciando carregamento dos dados do Dashboard...');
    console.log('📅 Filtros:', { ano: anoSelecionado, mes: mesSelecionado });
    setCarregando(true);
    
    try {
      const [resultadoResumo, resultadoDespesas, resultadoMissoes] = await Promise.all([
        buscarResumoFinanceiro(anoSelecionado, mesSelecionado),
        buscarDespesasPendentes(),
        buscarMetaMissoes(anoSelecionado, mesSelecionado)
      ]);
      
      console.log('📊 Resultado resumo:', resultadoResumo);
      console.log('💸 Resultado despesas:', resultadoDespesas);
      console.log('🎯 Resultado missões:', resultadoMissoes);
      
      if (resultadoResumo.success) {
        setResumo(resultadoResumo.resumo);
        console.log('✅ Resumo carregado com sucesso');
      } else {
        console.error('❌ Erro ao carregar resumo:', resultadoResumo.error);
      }
      
      if (resultadoDespesas.success) {
        setDespesas(resultadoDespesas.despesas);
        console.log('✅ Despesas carregadas com sucesso');
      } else {
        console.error('❌ Erro ao carregar despesas:', resultadoDespesas.error);
      }
      
      if (resultadoMissoes.success) {
        setMissoes(resultadoMissoes.missoes);
        setNovaMeta(resultadoMissoes.missoes.meta);
        console.log('✅ Missões carregadas com sucesso');
      } else {
        console.error('❌ Erro ao carregar missões:', resultadoMissoes.error);
      }
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error);
    }
    
    setCarregando(false);
    console.log('✅ Carregamento finalizado');
  };

  const handlePagarDespesa = async (despesaId, formaPagamento = 'Dinheiro') => {
    if (!window.confirm('Confirma o pagamento desta despesa?')) {
      return;
    }

    const resultado = await marcarComoPago(despesaId, formaPagamento);
    
    if (resultado.success) {
      alert('✅ Despesa marcada como paga!');
      carregarDados();
    } else {
      alert('❌ Erro ao marcar despesa como paga: ' + resultado.error);
    }
  };

  const handleSalvarNovaMeta = async () => {
    if (!novaMeta || novaMeta <= 0) {
      alert('❌ Meta inválida!');
      return;
    }

    const resultado = await atualizarMetaMissoes(novaMeta);
    
    if (resultado.success) {
      alert('✅ Meta atualizada com sucesso!');
      setModoEdicaoMeta(false);
      carregarDados();
    } else {
      alert('❌ Erro ao atualizar meta: ' + resultado.error);
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

  if (!resumo || !despesas || !missoes) {
    return null;
  }

  // Gerar nome do período baseado nos filtros
  const dataFiltro = new Date(anoSelecionado, mesSelecionado, 1);
  const mesNome = dataFiltro.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  // Arrays para os seletores
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const anosDisponiveis = [];
  for (let ano = 2020; ano <= new Date().getFullYear() + 1; ano++) {
    anosDisponiveis.push(ano);
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
        border: '2px solid #e8eaed'
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
              💰 FLUXO DE CAIXA COMPLETO
            </h1>
            <div style={{
              height: '3px',
              width: '120px',
              background: 'linear-gradient(90deg, #1a73e8 0%, #34a853 100%)',
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
        
        <p style={{
          fontSize: '0.9375rem',
          color: '#5f6368',
          fontWeight: '500',
          textTransform: 'capitalize',
          marginTop: '12px'
        }}>
          Período: {mesNome}
        </p>
      </div>

      {/* SEÇÃO 1: Resumo Financeiro (4 cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Card Entrada Total do Mês */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: '3px solid #1a73e8',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#1a73e8',
            fontWeight: '700',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            💎 ENTRADA TOTAL DO MÊS
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1a73e8',
            marginBottom: '8px'
          }}>
            {formatarMoeda(resumo.totalCentral + resumo.totalLocal + resumo.totalMissoes)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#5f6368'
          }}>
            {resumo.quantidadeEntradas} {resumo.quantidadeEntradas === 1 ? 'entrada' : 'entradas'} registradas
          </div>
        </div>

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
            Despesas pagas no período selecionado
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

      {/* SEÇÃO 2: Detalhamento de Entradas (3 cards - SEM PIX E DINHEIRO SEPARADOS) */}
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
          📊 DETALHAMENTO DOS RATEIOS
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          {/* Para Central COM cards PIX/Dinheiro DENTRO */}
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
              color: '#1a73e8',
              marginBottom: '12px'
            }}>
              {formatarMoeda(resumo.totalCentral)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368',
              marginBottom: '12px'
            }}>
              60% dízimos/ofertas
            </div>

            {/* Cards menores PIX/Dinheiro DENTRO */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginTop: '12px'
            }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: '6px',
                padding: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#5f6368', marginBottom: '4px' }}>💳 PIX</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a73e8' }}>
                  {formatarMoeda(resumo.totalPixCentral)}
                </div>
              </div>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: '6px',
                padding: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#5f6368', marginBottom: '4px' }}>💵 Dinheiro</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a73e8' }}>
                  {formatarMoeda(resumo.totalDinheiroCentral)}
                </div>
              </div>
            </div>
          </div>

          {/* Fica Local COM cards PIX/Dinheiro DENTRO */}
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
              color: '#34a853',
              marginBottom: '12px'
            }}>
              {formatarMoeda(resumo.totalLocal)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#5f6368',
              marginBottom: '12px'
            }}>
              40% dízimos + outros
            </div>

            {/* Cards menores PIX/Dinheiro DENTRO */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginTop: '12px'
            }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: '6px',
                padding: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#5f6368', marginBottom: '4px' }}>💳 PIX</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#34a853' }}>
                  {formatarMoeda(resumo.totalPixLocal)}
                </div>
              </div>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: '6px',
                padding: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#5f6368', marginBottom: '4px' }}>💵 Dinheiro</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#34a853' }}>
                  {formatarMoeda(resumo.totalDinheiroLocal)}
                </div>
              </div>
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
        </div>
      </div>

      {/* SEÇÃO 3: Meta de Missões COM EDIÇÃO */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '2px solid #fbbc04'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#202124',
            margin: 0
          }}>
            🎯 META DE MISSÕES - {mesNome.toUpperCase()}
          </h2>
          <button
            onClick={() => setModoEdicaoMeta(!modoEdicaoMeta)}
            style={{
              padding: '8px 16px',
              backgroundColor: modoEdicaoMeta ? '#ea4335' : '#1a73e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {modoEdicaoMeta ? '✖️ Cancelar' : '✏️ Editar Meta'}
          </button>
        </div>

        {modoEdicaoMeta && (
          <div style={{
            backgroundColor: '#f1f3f4',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#202124' }}>
              Nova Meta (R$):
            </label>
            <input
              type="number"
              value={novaMeta}
              onChange={(e) => setNovaMeta(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: '1rem',
                border: '2px solid #e8eaed',
                borderRadius: '6px',
                width: '150px'
              }}
            />
            <button
              onClick={handleSalvarNovaMeta}
              style={{
                padding: '8px 20px',
                backgroundColor: '#34a853',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              💾 Salvar
            </button>
          </div>
        )}

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

      {/* SEÇÃO 4: Despesas Pendentes COM SALDO APÓS PAGAR */}
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

        {/* Totais e SALDO APÓS PAGAR */}
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
            marginBottom: '8px'
          }}>
            💰 TOTAL A PAGAR: {formatarMoeda(despesas.totais.geral)}
          </div>
          
          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#5f6368',
            marginBottom: '12px'
          }}>
            💵 SALDO DISPONÍVEL: {formatarMoeda(resumo.totalLocal)}
          </div>

          <div style={{
            height: '2px',
            backgroundColor: '#e8eaed',
            margin: '12px 0'
          }} />
          
          {resumo.totalLocal >= despesas.totais.geral ? (
            <div style={{
              backgroundColor: '#e6f4ea',
              borderRadius: '8px',
              padding: '16px',
              border: '2px solid #34a853'
            }}>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#137333',
                marginBottom: '4px'
              }}>
                ✅ SALDO APÓS PAGAR: {formatarMoeda(resumo.totalLocal - despesas.totais.geral)}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#5f6368'
              }}>
                Saldo suficiente para cobrir todas as despesas pendentes
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#fce8e6',
              borderRadius: '8px',
              padding: '16px',
              border: '2px solid #ea4335'
            }}>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#c5221f',
                marginBottom: '4px'
              }}>
                ⚠️ FALTAM: {formatarMoeda(despesas.totais.geral - resumo.totalLocal)}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#5f6368'
              }}>
                Saldo insuficiente para cobrir todas as despesas pendentes
              </div>
            </div>
          )}

          {despesas.vencidas.length === 0 && despesas.proximos7Dias.length === 0 && despesas.de8a15Dias.length === 0 && (
            <div style={{
              backgroundColor: '#e6f4ea',
              borderRadius: '8px',
              padding: '16px',
              border: '2px solid #34a853',
              textAlign: 'center',
              marginTop: '12px'
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