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
    
    // ✨ SOLUÇÃO DEFINITIVA: Recarregar a cada 30 segundos
    const interval = setInterval(carregarDados, 30000);
    
    return () => clearInterval(interval);
  }, [anoSelecionado, mesSelecionado]);

  const carregarDados = async () => {
    console.log('🔄 Iniciando carregamento dos dados do Dashboard...');
    console.log('📅 Filtros:', { ano: anoSelecionado, mes: mesSelecionado });
    setCarregando(true);
    
    try {
      // Usar o mesmo método que a página Entradas
      const { buscarEntradas } = await import('../services/entradas');
      const { calcularResumoSemFiltro } = await import('../utils/entradasUtils');
      
      const [resultadoEntradas, resultadoDespesas, resultadoMissoes, resumoDespesas] = await Promise.all([
        buscarEntradas(),
        buscarDespesasPendentes(anoSelecionado, mesSelecionado),
        buscarMetaMissoes(anoSelecionado, mesSelecionado),
        import('../services/despesas').then(module => module.calcularResumoDespesas(anoSelecionado, mesSelecionado))
      ]);
      
      console.log('📊 Resultado entradas:', resultadoEntradas);
      console.log('💸 Resultado despesas:', resultadoDespesas);
      console.log('🎯 Resultado missões:', resultadoMissoes);
      
      if (resultadoEntradas.success) {
        // Filtrar entradas do período selecionado
        const entradasFiltradas = resultadoEntradas.entradas.filter(entrada => {
          const dataEntrada = new Date(entrada.data);
          return dataEntrada.getMonth() === mesSelecionado && 
                 dataEntrada.getFullYear() === anoSelecionado;
        });
        
        // Calcular resumo sem aplicar filtro novamente (entradas já filtradas)
        const resumoCalculado = calcularResumoSemFiltro(entradasFiltradas);
        
        console.log('📊 Entradas filtradas para o período:', entradasFiltradas.length);
        console.log('📊 Primeira entrada (exemplo):', entradasFiltradas[0]);
        
        // Debug detalhado das entradas
        entradasFiltradas.forEach((entrada, index) => {
          console.log(`📊 Entrada ${index + 1}:`, {
            id: entrada.id,
            descricao: entrada.descricao,
            valor: entrada.valor,
            data: entrada.data,
            tipo: entrada.tipo,
            rateio: entrada.rateio
          });
        });
        
        // Adicionar informações adicionais
        resumoCalculado.quantidadeEntradas = resumoCalculado.totalCount || 0;
        resumoCalculado.despesasPagas = resumoDespesas && resumoDespesas.pagas ? resumoDespesas.pagas : 0;
        
        // 📻 Calcular 1% da Igreja Local para Rádio Nazareno
        resumoCalculado.radioNazareno = Math.round((resumoCalculado.local || 0) * 0.01 * 100) / 100;
        
        console.log('💸 Despesas pagas:', resumoCalculado.despesasPagas);
        console.log('📻 Rádio Nazareno (1% local):', resumoCalculado.radioNazareno);
        
        setResumo(resumoCalculado);
        console.log('✅ Resumo calculado:', resumoCalculado);
      } else {
        console.error('❌ Erro ao carregar entradas:', resultadoEntradas.error);
        setResumo({ total: 0, central: 0, local: 0, missoes: 0, radioNazareno: 0 });
      }
      
      if (resultadoDespesas.success) {
        setDespesas(resultadoDespesas.despesas);
        console.log('✅ Despesas carregadas com sucesso');
      } else {
        console.error('❌ Erro ao carregar despesas:', resultadoDespesas.error);
        setDespesas({ vencidas: [], proximos7Dias: [], de8a15Dias: [], totais: { geral: 0 } });
      }
      
      if (resultadoMissoes.success) {
        setMissoes(resultadoMissoes.missoes);
        setNovaMeta(resultadoMissoes.missoes.meta);
        console.log('✅ Missões carregadas com sucesso');
      } else {
        console.error('❌ Erro ao carregar missões:', resultadoMissoes.error);
        setMissoes({ arrecadado: 0, meta: 0, falta: 0, progresso: 0 });
      }
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error);
      // Definir valores padrão em caso de erro
      setResumo({ total: 0, central: 0, local: 0, missoes: 0, radioNazareno: 0 });
      setDespesas({ vencidas: [], proximos7Dias: [], de8a15Dias: [], totais: { geral: 0 } });
      setMissoes({ arrecadado: 0, meta: 0, falta: 0, progresso: 0 });
    }
    
    setCarregando(false);
    console.log('✅ Carregamento finalizado');
  };

  const handlePagarDespesa = async (despesaId, formaPagamento = 'Dinheiro') => {
    if (!window.confirm('Confirma o pagamento desta despesa?')) {
      return;
    }

    try {
      const resultado = await marcarComoPago(despesaId, formaPagamento);
      
      if (resultado.success) {
        alert('✅ Despesa marcada como paga!');
        // Recarregar despesas
        const resultadoDespesas = await buscarDespesasPendentes();
        if (resultadoDespesas.success) {
          setDespesas(resultadoDespesas.despesas);
        }
      } else {
        alert('❌ Erro ao marcar despesa como paga: ' + resultado.error);
      }
    } catch (error) {
      console.error('❌ Erro ao marcar despesa como paga:', error);
      alert('❌ Erro ao marcar despesa como paga');
    }
  };

  const handleAtualizarMeta = async () => {
    if (!novaMeta || parseFloat(novaMeta) <= 0) {
      alert('❌ Digite uma meta válida');
      return;
    }

    try {
      const resultado = await atualizarMetaMissoes(anoSelecionado, mesSelecionado, parseFloat(novaMeta));
      
      if (resultado.success) {
        alert('✅ Meta atualizada com sucesso!');
        setModoEdicaoMeta(false);
        
        // Recarregar dados das missões
        const resultadoMissoes = await buscarMetaMissoes(anoSelecionado, mesSelecionado);
        if (resultadoMissoes.success) {
          setMissoes(resultadoMissoes.missoes);
        }
      } else {
        alert('❌ Erro ao atualizar meta: ' + resultado.error);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar meta:', error);
      alert('❌ Erro ao atualizar meta');
    }
  };

  if (carregando) {
    return (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 24px',
        backgroundColor: '#fafafa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #1a73e8',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{
            fontSize: '1.125rem',
            color: '#5f6368',
            margin: '0'
          }}>
            Carregando dados do dashboard...
          </p>
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
            {formatarMoeda(resumo?.total || 0)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368'
          }}>
            {resumo?.quantidadeEntradas || 0} entrada{(resumo?.quantidadeEntradas || 0) !== 1 ? 's' : ''} registrada{(resumo?.quantidadeEntradas || 0) !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Igreja Central */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: '3px solid #1a73e8'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#1a73e8',
            fontWeight: '700',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            🏛️ PARA CENTRAL
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1a73e8',
            marginBottom: '8px'
          }}>
            {formatarMoeda(resumo?.central || 0)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368'
          }}>
            60% dízimos/ofertas
          </div>
        </div>

        {/* Entrada Local */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: '3px solid #34a853'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#34a853',
            fontWeight: '700',
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
            {formatarMoeda(resumo?.local || 0)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368'
          }}>
            40% dízimos/ofertas + outras entradas
          </div>
        </div>

        {/* Despesas Pagas */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: '3px solid #ea4335'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#ea4335',
            fontWeight: '700',
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
            {formatarMoeda(resumo?.despesasPagas || 0)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368'
          }}>
            Despesas pagas no período selecionado
          </div>
        </div>

        {/* Saldo do Mês */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: `3px solid ${(resumo?.local || 0) - (resumo?.despesasPagas || 0) >= 0 ? '#34a853' : '#ea4335'}`
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: (resumo?.local || 0) - (resumo?.despesasPagas || 0) >= 0 ? '#34a853' : '#ea4335',
            fontWeight: '700',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            💰 SALDO DO MÊS {(resumo?.local || 0) - (resumo?.despesasPagas || 0) >= 0 ? '✅' : '⚠️'}
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: (resumo?.local || 0) - (resumo?.despesasPagas || 0) >= 0 ? '#34a853' : '#ea4335',
            marginBottom: '8px'
          }}>
            {formatarMoeda((resumo?.local || 0) - (resumo?.despesasPagas || 0))}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368'
          }}>
            {(resumo?.local || 0) - (resumo?.despesasPagas || 0) >= 0 ? 'Positivo' : 'Negativo'}
          </div>
        </div>

        {/* Missões */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: '3px solid #fbbc04'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#f9ab00',
            fontWeight: '700',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            ⛪ MISSÕES
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#f9ab00',
            marginBottom: '8px'
          }}>
            {formatarMoeda(resumo?.missoes || 0)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368'
          }}>
            100% santa ceia
          </div>
        </div>

        {/* Rádio Nazareno */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: '3px solid #9c27b0'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#9c27b0',
            fontWeight: '700',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            📻 RÁDIO NAZARENO
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#9c27b0',
            marginBottom: '8px'
          }}>
            {formatarMoeda(resumo?.radioNazareno || 0)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368'
          }}>
            1% da Igreja Local
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: Meta de Missões */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '2px solid #fbbc04'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#f9ab00',
          marginBottom: '24px'
        }}>
          🎯 META DE MISSÕES - {mesNome.toUpperCase()}
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
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
              {formatarMoeda(missoes?.arrecadado || 0)}
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
              {formatarMoeda(missoes?.meta || 0)}
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
              color: (missoes?.falta || 0) > 0 ? '#ea4335' : '#34a853'
            }}>
              {formatarMoeda(missoes?.falta || 0)}
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
            width: `${missoes?.progresso || 0}%`,
            backgroundColor: parseFloat(missoes?.progresso || 0) >= 100 ? '#34a853' : '#fbbc04',
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
            color: '#202124'
          }}>
            {missoes?.progresso || 0}%
          </div>
        </div>

        {/* Botão Editar Meta */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          {!modoEdicaoMeta ? (
            <button
              onClick={() => setModoEdicaoMeta(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#fbbc04',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✏️ Editar Meta
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Nova meta"
                value={novaMeta}
                onChange={(e) => setNovaMeta(e.target.value)}
                style={{
                  padding: '12px',
                  border: '1px solid #dadce0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  width: '150px'
                }}
              />
              <button
                onClick={handleAtualizarMeta}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#34a853',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                ✅ Salvar
              </button>
              <button
                onClick={() => setModoEdicaoMeta(false)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#ea4335',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 3: Despesas Pendentes */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '2px solid #ea4335'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#ea4335',
          marginBottom: '24px'
        }}>
          ⚠️ DESPESAS PENDENTES - PRÓXIMOS 15 DIAS
        </h2>

        {/* Resumo das Despesas */}
        <div style={{
          backgroundColor: (resumo?.local || 0) >= (despesas?.totais?.geral || 0) ? '#e8f5e8' : '#fce8e6',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: `2px solid ${(resumo?.local || 0) >= (despesas?.totais?.geral || 0) ? '#34a853' : '#ea4335'}`
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#5f6368', marginBottom: '4px' }}>
                � SALDO DISPONÍVEL
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#34a853' }}>
                {formatarMoeda((resumo?.local || 0) - (resumo?.despesasPagas || 0))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#5f6368', marginBottom: '4px' }}>
                💸 TOTAL A PAGAR
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ea4335' }}>
                {formatarMoeda(despesas?.totais?.geral || 0)}
              </div>
            </div>
          </div>
          
          {((resumo?.local || 0) - (resumo?.despesasPagas || 0)) >= (despesas?.totais?.geral || 0) ? (
            <div style={{
              backgroundColor: '#d1e7dd',
              borderRadius: '8px',
              padding: '16px',
              border: '2px solid #34a853'
            }}>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#0f5132',
                marginBottom: '4px'
              }}>
                ✅ SALDO APÓS PAGAR: {formatarMoeda(((resumo?.local || 0) - (resumo?.despesasPagas || 0)) - (despesas?.totais?.geral || 0))}
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
                ⚠️ FALTAM: {formatarMoeda((despesas?.totais?.geral || 0) - ((resumo?.local || 0) - (resumo?.despesasPagas || 0)))}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#5f6368'
              }}>
                Saldo insuficiente para cobrir todas as despesas pendentes
              </div>
            </div>
          )}
        </div>

        {/* Lista de Despesas por Categoria */}
        {/* Grupo: Vencidas */}
        {(despesas?.vencidas?.length || 0) > 0 && (
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
              🔴 VENCIDAS ({despesas?.vencidas?.length || 0})
            </h3>
            {(despesas?.vencidas || []).map(d => (
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
                    backgroundColor: '#ea4335',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  💸 Pagar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Grupo: Próximos 7 dias */}
        {(despesas?.proximos7Dias?.length || 0) > 0 && (
          <div style={{
            marginBottom: '24px',
            backgroundColor: '#fff3cd',
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
              🟡 VENCE EM 7 DIAS ({despesas?.proximos7Dias?.length || 0})
            </h3>
            {(despesas?.proximos7Dias || []).map(d => (
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
                    cursor: 'pointer'
                  }}
                >
                  💸 Pagar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Grupo: 8-15 dias */}
        {(despesas?.de8a15Dias?.length || 0) > 0 && (
          <div style={{
            marginBottom: '24px',
            backgroundColor: '#d1e7dd',
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
              🟢 VENCE EM 8-15 DIAS ({despesas?.de8a15Dias?.length || 0})
            </h3>
            {(despesas?.de8a15Dias || []).map(d => (
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
                    cursor: 'pointer'
                  }}
                >
                  💸 Pagar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mensagem quando não há despesas */}
        {(despesas?.vencidas?.length || 0) === 0 && (despesas?.proximos7Dias?.length || 0) === 0 && (despesas?.de8a15Dias?.length || 0) === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#5f6368'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              ✅ Nenhuma despesa pendente nos próximos 15 dias
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              Todas as contas estão em dia!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;