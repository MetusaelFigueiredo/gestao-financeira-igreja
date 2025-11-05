import React, { useState, useEffect } from 'react';
import { buscarResumoFinanceiro, buscarDespesasPendentes, buscarMetaMissoes, atualizarMetaMissoes } from '../services/dashboard';
import { marcarComoPago } from '../services/despesas';
import { formatarMoeda } from '../utils/formatacao';

function Dashboard({ onNavigate }) {
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
      // 🎯 USAR FUNÇÃO CORRETA COM SALDO ROTATIVO
      const [resultadoResumo, resultadoDespesas, resultadoMissoes] = await Promise.all([
        buscarResumoFinanceiro(anoSelecionado, mesSelecionado),
        buscarDespesasPendentes(), // 🎯 SEMPRE próximos 15 dias
        buscarMetaMissoes(anoSelecionado, mesSelecionado)
      ]);
      
      console.log('📊 Resultado resumo:', resultadoResumo);
      console.log('💸 Resultado despesas:', resultadoDespesas);
      console.log('🎯 Resultado missões:', resultadoMissoes);
      
      if (resultadoResumo.success) {
        const resumoCompleto = resultadoResumo.resumo;
        
        // 📻 Calcular 1% da Igreja Local para Rádio Nazareno
        resumoCompleto.radioNazareno = Math.round((resumoCompleto.totalLocal || 0) * 0.01 * 100) / 100;
        
        // 🎯 SALDO ROTATIVO JÁ INCLUÍDO nos cálculos!
        console.log('🔄 Saldo rotativo:', resumoCompleto.saldoRotativo);
        console.log('💰 Saldo do mês COM rotativo:', resumoCompleto.saldoMes);
        console.log('💵 Saldo do mês SEM rotativo:', resumoCompleto.saldoMesSemRotativo);
        console.log('💸 Despesas pagas:', resumoCompleto.totalDespesasPagas);
        console.log('📻 Rádio Nazareno (1% local):', resumoCompleto.radioNazareno);
        
        setResumo(resumoCompleto);
        console.log('✅ Resumo carregado com saldo rotativo:', resumoCompleto);
      } else {
        console.error('❌ Erro ao carregar resumo:', resultadoResumo.error);
        setResumo({ 
          totalCentral: 0, totalLocal: 0, totalMissoes: 0,
          saldoMes: 0, saldoRotativo: 0, saldoMesSemRotativo: 0,
          totalDespesasPagas: 0, radioNazareno: 0
        });
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
      setResumo({ 
        totalCentral: 0, totalLocal: 0, totalMissoes: 0,
        saldoMes: 0, saldoRotativo: 0, saldoMesSemRotativo: 0,
        totalDespesasPagas: 0, radioNazareno: 0
      });
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
    return (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 24px',
        backgroundColor: '#fafafa',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '60px 40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
        }}>
          <h2 style={{ color: '#ea4335', marginBottom: '16px' }}>
            ⚠️ Erro ao Carregar Dados
          </h2>
          <p style={{ color: '#5f6368', marginBottom: '24px' }}>
            Não foi possível carregar os dados do dashboard.
          </p>
          <button
            onClick={carregarDados}
            style={{
              backgroundColor: '#1a73e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px 16px',
      backgroundColor: '#fafafa'
    }}>
      {/* Header com Filtros */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#202124',
          margin: '0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📊 Dashboard Financeiro
        </h1>
        
        {/* Filtros de Data */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#5f6368',
              marginBottom: '2px'
            }}>
              Ano
            </label>
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
              style={{
                padding: '6px 8px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                minWidth: '70px'
              }}
            >
              {[2023, 2024, 2025, 2026].map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#5f6368',
              marginBottom: '2px'
            }}>
              Mês
            </label>
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
              style={{
                padding: '6px 8px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                minWidth: '100px'
              }}
            >
              {[
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
              ].map((mes, index) => (
                <option key={index} value={index}>{mes}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={carregarDados}
            style={{
              backgroundColor: '#34a853',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 12px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Card SALDO DO MÊS em Destaque */}
      <div style={{
        backgroundColor: 'linear-gradient(135deg, #34a853 0%, #4caf50 100%)',
        background: `linear-gradient(135deg, ${(resumo?.saldoMes || 0) >= 0 ? 'rgba(52, 168, 83, 0.95)' : 'rgba(234, 67, 53, 0.95)'} 0%, ${(resumo?.saldoMes || 0) >= 0 ? 'rgba(76, 175, 80, 0.95)' : 'rgba(244, 81, 67, 0.95)'} 100%)`,
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: `0 6px 24px ${(resumo?.saldoMes || 0) >= 0 ? 'rgba(52, 168, 83, 0.25)' : 'rgba(234, 67, 53, 0.25)'}`,
        border: `2px solid ${(resumo?.saldoMes || 0) >= 0 ? '#34a853' : '#ea4335'}`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          zIndex: 1
        }}></div>
        
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '24px',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              fontSize: '0.875rem',
              color: '#ffffff',
              fontWeight: '600',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💰 SALDO DO MÊS {(resumo?.saldoMes || 0) >= 0 ? '✅' : '⚠️'}
            </div>
            
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '12px',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {formatarMoeda(resumo?.saldoMes || 0)}
            </div>
            
            <div style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '16px'
            }}>
              {(resumo?.saldoMes || 0) >= 0 ? 'Positivo' : 'Negativo'} - Saldo real após despesas
            </div>
          </div>
          
          {/* Composição Detalhada */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            minWidth: '280px'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#ffffff',
              fontWeight: '600',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              📊 COMPOSIÇÃO DO SALDO
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.875rem',
              color: '#ffffff'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <span>💵 Local atual:</span>
                <span style={{ fontWeight: '700' }}>{formatarMoeda(resumo?.totalLocal || 0)}</span>
              </div>
              
              {resumo?.saldoRotativo > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <span>🔄 Saldo anterior:</span>
                  <span style={{ fontWeight: '700' }}>{formatarMoeda(resumo?.saldoRotativo || 0)}</span>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <span>💸 Despesas pagas:</span>
                <span style={{ fontWeight: '700' }}>-{formatarMoeda(resumo?.totalDespesasPagas || 0)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0 8px 0',
                fontSize: '1rem',
                fontWeight: '700',
                borderTop: '2px solid rgba(255, 255, 255, 0.3)',
                marginTop: '8px'
              }}>
                <span>💰 SALDO FINAL:</span>
                <span>{formatarMoeda(resumo?.saldoMes || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        
        {/* Entrada Total do Mês */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
          border: '2px solid #4285f4'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#4285f4',
            fontWeight: '600',
            marginBottom: '6px',
            letterSpacing: '0.3px'
          }}>
            💰 ENTRADA TOTAL DO MÊS
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#4285f4',
            marginBottom: '6px'
          }}>
            {formatarMoeda((resumo?.totalCentral || 0) + (resumo?.totalLocal || 0) + (resumo?.totalMissoes || 0))}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <div>💳 PIX: {formatarMoeda(resumo?.totalPix || 0)}</div>
            <div>💵 Dinheiro: {formatarMoeda(resumo?.totalDinheiro || 0)}</div>
          </div>
        </div>
        
        {/* Central */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
          border: '2px solid #1a73e8'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#1a73e8',
            fontWeight: '600',
            marginBottom: '6px',
            letterSpacing: '0.3px'
          }}>
            🏛️ CENTRAL
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1a73e8',
            marginBottom: '6px'
          }}>
            {formatarMoeda(resumo?.totalCentral || 0)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368'
          }}>
            60% dízimo + 40% oferta
          </div>
        </div>



        {/* Despesas Pagas */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
          border: '2px solid #ea4335'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#ea4335',
            fontWeight: '600',
            marginBottom: '6px',
            letterSpacing: '0.3px'
          }}>
            💸 DESPESAS PAGAS
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#ea4335',
            marginBottom: '6px'
          }}>
            {formatarMoeda(resumo?.totalDespesasPagas || 0)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368'
          }}>
            Despesas pagas no período selecionado
          </div>
        </div>

        {/* Local */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
          border: '2px solid #34a853'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#34a853',
            fontWeight: '600',
            marginBottom: '6px',
            letterSpacing: '0.3px'
          }}>
            🏠 LOCAL
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#34a853',
            marginBottom: '6px'
          }}>
            {formatarMoeda(resumo?.totalLocal || 0)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368',
            marginBottom: '8px'
          }}>
            40% dízimo + 60% oferta + outros
          </div>
          {/* 🔄 COMPOSIÇÃO COM SALDO ROTATIVO */}
          {resumo?.saldoRotativo > 0 && (
            <div style={{
              fontSize: '0.75rem',
              color: '#666',
              backgroundColor: '#f8f9fa',
              padding: '8px',
              borderRadius: '6px',
              marginTop: '8px'
            }}>
              <div>💵 Local atual: {formatarMoeda(resumo?.totalLocal || 0)}</div>
              <div>🔄 Saldo anterior: {formatarMoeda(resumo?.saldoRotativo || 0)}</div>
              <div>  Total disponível: {formatarMoeda((resumo?.totalLocal || 0) + (resumo?.saldoRotativo || 0))}</div>
            </div>
          )}
        </div>

        {/* Missões */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
          border: '2px solid #fbbc04'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#f9ab00',
            fontWeight: '600',
            marginBottom: '6px',
            letterSpacing: '0.3px'
          }}>
            ⛪ MISSÕES
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#f9ab00',
            marginBottom: '6px'
          }}>
            {formatarMoeda(resumo?.totalMissoes || 0)}
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
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
          border: '2px solid #9c27b0'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#9c27b0',
            fontWeight: '600',
            marginBottom: '6px',
            letterSpacing: '0.3px'
          }}>
            📻 RÁDIO NAZARENO
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#9c27b0',
            marginBottom: '6px'
          }}>
            {formatarMoeda(resumo?.radioNazareno || 0)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368'
          }}>
            1% do valor local
          </div>
        </div>
      </div>

      {/* Seção de Despesas Pendentes */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
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
          ⏰ Despesas Pendentes (Próximos 15 Dias)
        </h2>

        {/* Análise de Saldo vs Despesas */}
        <div style={{
          backgroundColor: (resumo?.saldoMes || 0) >= (despesas?.totais?.geral || 0) ? '#e8f5e8' : '#fce8e6',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: `2px solid ${(resumo?.saldoMes || 0) >= (despesas?.totais?.geral || 0) ? '#34a853' : '#ea4335'}`
        }}>
          <div style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#202124',
            marginBottom: '12px'
          }}>
            💰 SALDO DISPONÍVEL
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: (resumo?.saldoMes || 0) >= (despesas?.totais?.geral || 0) ? '#34a853' : '#ea4335',
            marginBottom: '16px'
          }}>
            {formatarMoeda(resumo?.saldoMes || 0)}
          </div>
          
          {(resumo?.saldoMes || 0) >= (despesas?.totais?.geral || 0) ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              borderLeft: '4px solid #34a853'
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#34a853',
                marginBottom: '8px'
              }}>
                ✅ SALDO APÓS PAGAR: {formatarMoeda((resumo?.saldoMes || 0) - (despesas?.totais?.geral || 0))}
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
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              borderLeft: '4px solid #ea4335'
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#ea4335',
                marginBottom: '8px'
              }}>
                ⚠️ FALTAM: {formatarMoeda((despesas?.totais?.geral || 0) - (resumo?.saldoMes || 0))}
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

        {/* Grid de Despesas por Período */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          
          {/* Vencidas */}
          <div style={{
            backgroundColor: '#fce8e6',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #ea4335'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#ea4335',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🚨 Vencidas ({despesas?.vencidas?.length || 0})
            </h3>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#ea4335',
              marginBottom: '16px'
            }}>
              {formatarMoeda(despesas?.totais?.vencidas || 0)}
            </div>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {despesas?.vencidas?.length > 0 ? (
                despesas.vencidas.map(despesa => (
                  <div key={despesa.id} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px',
                    borderLeft: '4px solid #ea4335'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#202124',
                      marginBottom: '4px'
                    }}>
                      {despesa.descricao}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#5f6368',
                      marginBottom: '8px'
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
                        color: '#ea4335'
                      }}>
                        {formatarMoeda(despesa.valor)}
                      </span>
                      <button
                        onClick={() => handlePagarDespesa(despesa.id)}
                        style={{
                          backgroundColor: '#34a853',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        ✅ Pagar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  color: '#5f6368',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  Nenhuma despesa vencida
                </div>
              )}
            </div>
          </div>

          {/* Próximos 7 Dias */}
          <div style={{
            backgroundColor: '#fff3cd',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #fbbc04'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#f9ab00',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ Próximos 7 Dias ({despesas?.proximos7Dias?.length || 0})
            </h3>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#f9ab00',
              marginBottom: '16px'
            }}>
              {formatarMoeda(despesas?.totais?.proximos7 || 0)}
            </div>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {despesas?.proximos7Dias?.length > 0 ? (
                despesas.proximos7Dias.map(despesa => (
                  <div key={despesa.id} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px',
                    borderLeft: '4px solid #fbbc04'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#202124',
                      marginBottom: '4px'
                    }}>
                      {despesa.descricao}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#5f6368',
                      marginBottom: '8px'
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
                        color: '#f9ab00'
                      }}>
                        {formatarMoeda(despesa.valor)}
                      </span>
                      <button
                        onClick={() => handlePagarDespesa(despesa.id)}
                        style={{
                          backgroundColor: '#34a853',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        ✅ Pagar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  color: '#5f6368',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  Nenhuma despesa nos próximos 7 dias
                </div>
              )}
            </div>
          </div>

          {/* 8 a 15 Dias */}
          <div style={{
            backgroundColor: '#e3f2fd',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #1a73e8'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#1a73e8',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📅 8 a 15 Dias ({despesas?.de8a15Dias?.length || 0})
            </h3>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#1a73e8',
              marginBottom: '16px'
            }}>
              {formatarMoeda(despesas?.totais?.de8a15 || 0)}
            </div>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {despesas?.de8a15Dias?.length > 0 ? (
                despesas.de8a15Dias.map(despesa => (
                  <div key={despesa.id} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px',
                    borderLeft: '4px solid #1a73e8'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#202124',
                      marginBottom: '4px'
                    }}>
                      {despesa.descricao}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#5f6368',
                      marginBottom: '8px'
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
                        color: '#1a73e8'
                      }}>
                        {formatarMoeda(despesa.valor)}
                      </span>
                      <button
                        onClick={() => handlePagarDespesa(despesa.id)}
                        style={{
                          backgroundColor: '#34a853',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        ✅ Pagar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  color: '#5f6368',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  Nenhuma despesa de 8 a 15 dias
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumo Total das Despesas */}
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '24px',
          border: '2px solid #dadce0'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#202124',
            marginBottom: '16px'
          }}>
            📊 Resumo Total
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#ea4335',
                marginBottom: '4px'
              }}>
                {formatarMoeda(despesas?.totais?.vencidas || 0)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#5f6368' }}>
                Vencidas
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#f9ab00',
                marginBottom: '4px'
              }}>
                {formatarMoeda(despesas?.totais?.proximos7 || 0)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#5f6368' }}>
                Próximos 7 dias
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1a73e8',
                marginBottom: '4px'
              }}>
                {formatarMoeda(despesas?.totais?.de8a15 || 0)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#5f6368' }}>
                8 a 15 dias
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#202124',
                marginBottom: '4px'
              }}>
                {formatarMoeda(despesas?.totais?.geral || 0)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#5f6368' }}>
                Total Geral
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Missões */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
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
          ⛪ Meta de Missões
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: '#e8f5e8',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #34a853'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#34a853',
              marginBottom: '8px'
            }}>
              💰 Arrecadado
            </h3>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#34a853'
            }}>
              {formatarMoeda(missoes?.arrecadado || 0)}
            </div>
          </div>

          <div style={{
            backgroundColor: '#e3f2fd',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #1a73e8'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#1a73e8',
              marginBottom: '8px'
            }}>
              🎯 Meta
            </h3>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1a73e8',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {formatarMoeda(missoes?.meta || 0)}
              {!modoEdicaoMeta && (
                <button
                  onClick={() => setModoEdicaoMeta(true)}
                  style={{
                    backgroundColor: '#1a73e8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ✏️ Editar
                </button>
              )}
            </div>
          </div>

          <div style={{
            backgroundColor: (missoes?.progresso || 0) >= 100 ? '#e8f5e8' : '#fff3cd',
            borderRadius: '12px',
            padding: '20px',
            border: `2px solid ${(missoes?.progresso || 0) >= 100 ? '#34a853' : '#fbbc04'}`
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: (missoes?.progresso || 0) >= 100 ? '#34a853' : '#f9ab00',
              marginBottom: '8px'
            }}>
              📊 Progresso
            </h3>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: (missoes?.progresso || 0) >= 100 ? '#34a853' : '#f9ab00'
            }}>
              {(parseFloat(missoes?.progresso) || 0).toFixed(1)}%
            </div>
          </div>

          <div style={{
            backgroundColor: (missoes?.falta || 0) <= 0 ? '#e8f5e8' : '#fce8e6',
            borderRadius: '12px',
            padding: '20px',
            border: `2px solid ${(missoes?.falta || 0) <= 0 ? '#34a853' : '#ea4335'}`
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: (missoes?.falta || 0) <= 0 ? '#34a853' : '#ea4335',
              marginBottom: '8px'
            }}>
              {(missoes?.falta || 0) <= 0 ? '🎉 Meta Alcançada!' : '📈 Falta'}
            </h3>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: (missoes?.falta || 0) <= 0 ? '#34a853' : '#ea4335'
            }}>
              {(missoes?.falta || 0) <= 0 ? '✅ Concluída' : formatarMoeda(missoes?.falta || 0)}
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div style={{
          backgroundColor: '#f1f3f4',
          borderRadius: '8px',
          height: '20px',
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          <div style={{
            backgroundColor: (missoes?.progresso || 0) >= 100 ? '#34a853' : '#1a73e8',
            height: '100%',
            width: `${Math.min(missoes?.progresso || 0, 100)}%`,
            transition: 'width 0.3s ease',
            borderRadius: '8px'
          }}></div>
        </div>

        {/* Edição de Meta */}
        {modoEdicaoMeta && (
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #dadce0'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#202124',
              marginBottom: '16px'
            }}>
              ✏️ Editar Meta de Missões
            </h3>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <input
                type="number"
                value={novaMeta}
                onChange={(e) => setNovaMeta(e.target.value)}
                placeholder="Nova meta (R$)"
                style={{
                  padding: '12px',
                  border: '2px solid #dadce0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  flex: '1',
                  minWidth: '200px'
                }}
              />
              <button
                onClick={handleAtualizarMeta}
                style={{
                  backgroundColor: '#34a853',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ✅ Salvar
              </button>
              <button
                onClick={() => {
                  setModoEdicaoMeta(false);
                  setNovaMeta(missoes?.meta || 0);
                }}
                style={{
                  backgroundColor: '#5f6368',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;