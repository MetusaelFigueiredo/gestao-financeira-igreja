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
  
  const dataAtual = new Date();
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth());

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 30000);
    return () => clearInterval(interval);
  }, [anoSelecionado, mesSelecionado]);

  const carregarDados = async () => {
    console.log('🔄 Iniciando carregamento dos dados do Dashboard...');
    setCarregando(true);
    
    try {
      const [resultadoResumo, resultadoDespesas, resultadoMissoes] = await Promise.all([
        buscarResumoFinanceiro(anoSelecionado, mesSelecionado),
        buscarDespesasPendentes(),
        buscarMetaMissoes(anoSelecionado, mesSelecionado)
      ]);
      
      if (resultadoResumo.success) {
        const resumoCompleto = resultadoResumo.resumo;
        resumoCompleto.radioNazareno = Math.round((resumoCompleto.totalLocal || 0) * 0.01 * 100) / 100;
        setResumo(resumoCompleto);
      } else {
        setResumo({ 
          totalCentral: 0, totalLocal: 0, totalMissoes: 0,
          saldoMes: 0, saldoRotativo: 0, saldoMesSemRotativo: 0,
          totalDespesasPagas: 0, radioNazareno: 0
        });
      }
      
      if (resultadoDespesas.success) {
        setDespesas(resultadoDespesas.despesas);
      } else {
        setDespesas({ vencidas: [], proximos7Dias: [], de8a15Dias: [], totais: { geral: 0 } });
      }
      
      if (resultadoMissoes.success) {
        setMissoes(resultadoMissoes.missoes);
        setNovaMeta(resultadoMissoes.missoes.meta);
      } else {
        setMissoes({ arrecadado: 0, meta: 0, falta: 0, progresso: 0 });
      }
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error);
      setResumo({ 
        totalCentral: 0, totalLocal: 0, totalMissoes: 0,
        saldoMes: 0, saldoRotativo: 0, saldoMesSemRotativo: 0,
        totalDespesasPagas: 0, radioNazareno: 0
      });
      setDespesas({ vencidas: [], proximos7Dias: [], de8a15Dias: [], totais: { geral: 0 } });
      setMissoes({ arrecadado: 0, meta: 0, falta: 0, progresso: 0 });
    }
    
    setCarregando(false);
  };

  const handlePagarDespesa = async (despesaId, formaPagamento = 'Dinheiro') => {
    if (!window.confirm('Confirma o pagamento desta despesa?')) return;

    try {
      const resultado = await marcarComoPago(despesaId, formaPagamento);
      
      if (resultado.success) {
        alert('✅ Despesa marcada como paga!');
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
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '6px solid #667eea',
            borderTop: '6px solid transparent',
            borderRadius: '50%',
            margin: '0 auto 24px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{
            fontSize: '1.25rem',
            color: '#333',
            margin: '0',
            fontWeight: '600'
          }}>
            Carregando dashboard...
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
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '60px 40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#ea4335', marginBottom: '16px', fontSize: '1.5rem' }}>
            Erro ao Carregar Dados
          </h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Não foi possível carregar os dados do dashboard.
          </p>
          <button
            onClick={carregarDados}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const saldoPositivo = (resumo?.saldoMes || 0) >= 0;
  const saldoSuficiente = (resumo?.saldoMes || 0) >= (despesas?.totais?.geral || 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Efeito de partículas de fundo */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float${i % 3} ${3 + Math.random() * 4}s ease-in-out infinite`
            }}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes float0 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        @keyframes float1 {
          0%, 100% { transform: translateX(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateX(20px) rotate(180deg); opacity: 0.8; }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); opacity: 0.4; }
          33% { transform: translate(15px, -15px) rotate(120deg); opacity: 0.9; }
          66% { transform: translate(-15px, 15px) rotate(240deg); opacity: 0.6; }
        }
      `}</style>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Header com Filtros - Modernizado */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '24px 32px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📊 Dashboard Financeiro
          </h1>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
              style={{
                padding: '10px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '0.95rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontWeight: '600',
                color: '#333',
                transition: 'all 0.3s ease'
              }}
            >
              {[2023, 2024, 2025, 2026].map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
            
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
              style={{
                padding: '10px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '0.95rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontWeight: '600',
                color: '#333',
                transition: 'all 0.3s ease'
              }}
            >
              {[
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
              ].map((mes, index) => (
                <option key={index} value={index}>{mes}</option>
              ))}
            </select>
            
            <button
              onClick={carregarDados}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '0.95rem',
                cursor: 'pointer',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              🔄 Atualizar
            </button>
            
            {/* Indicador de Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(17, 153, 142, 0.1)',
              borderRadius: '12px',
              border: '2px solid rgba(17, 153, 142, 0.3)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#11998e',
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite'
              }}></div>
              <span style={{
                fontSize: '0.8rem',
                color: '#11998e',
                fontWeight: '600'
              }}>
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Card SALDO DO MÊS - Ultra Modernizado */}
        <div style={{
          background: saldoPositivo 
            ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
            : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: `0 12px 40px ${saldoPositivo ? 'rgba(17, 153, 142, 0.4)' : 'rgba(235, 51, 73, 0.4)'}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Efeito de fundo animado */}
          <div style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '300px',
            height: '300px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            animation: 'pulse 3s ease-in-out infinite'
          }}></div>
          
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 0.3; }
            }
          `}</style>
          
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '32px',
            alignItems: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '700',
                marginBottom: '12px',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                💰 SALDO DO MÊS {saldoPositivo ? '✅' : '⚠️'}
              </div>
              
              <div style={{
                fontSize: '3rem',
                fontWeight: '900',
                color: '#ffffff',
                marginBottom: '16px',
                textShadow: '0 4px 12px rgba(0,0,0,0.2)',
                letterSpacing: '-1px'
              }}>
                {formatarMoeda(resumo?.saldoMes || 0)}
              </div>
              
              <div style={{
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: '600',
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                display: 'inline-block',
                backdropFilter: 'blur(10px)'
              }}>
                {saldoPositivo ? '✨ Positivo' : '⚠️ Negativo'} - Saldo real após despesas
              </div>
            </div>
            
            {/* Composição Detalhada Melhorada */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '28px',
              backdropFilter: 'blur(20px)',
              minWidth: '320px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                fontSize: '1rem',
                color: '#ffffff',
                fontWeight: '700',
                marginBottom: '20px',
                textAlign: 'center',
                letterSpacing: '0.5px'
              }}>
                📊 COMPOSIÇÃO DO SALDO
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '0.95rem',
                color: '#ffffff'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <span style={{ fontWeight: '600' }}>💵 Local atual:</span>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{formatarMoeda(resumo?.totalLocal || 0)}</span>
                </div>
                
                {resumo?.saldoRotativo > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <span style={{ fontWeight: '600' }}>🔄 Saldo anterior:</span>
                    <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{formatarMoeda(resumo?.saldoRotativo || 0)}</span>
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <span style={{ fontWeight: '600' }}>💸 Despesas pagas:</span>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>-{formatarMoeda(resumo?.totalDespesasPagas || 0)}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0 12px 0',
                  fontSize: '1.1rem',
                  fontWeight: '900',
                  borderTop: '3px solid rgba(255, 255, 255, 0.4)',
                  marginTop: '12px'
                }}>
                  <span>💰 SALDO FINAL:</span>
                  <span>{formatarMoeda(resumo?.saldoMes || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Resumo - Grid Modernizado */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          
          {/* Entrada Total */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
            color: '#fff',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
          }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              marginBottom: '12px',
              letterSpacing: '1px',
              opacity: 0.9
            }}>
              💰 ENTRADA TOTAL
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: '900',
              marginBottom: '12px'
            }}>
              {formatarMoeda((resumo?.totalCentral || 0) + (resumo?.totalLocal || 0) + (resumo?.totalMissoes || 0))}
            </div>
            <div style={{
              fontSize: '0.9rem',
              opacity: 0.9,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '12px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div>💳 PIX: {formatarMoeda(resumo?.totalPix || 0)}</div>
              <div>💵 Dinheiro: {formatarMoeda(resumo?.totalDinheiro || 0)}</div>
            </div>
          </div>
          
          {/* Central */}
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)',
            color: '#fff',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(79, 172, 254, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 172, 254, 0.3)';
          }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              marginBottom: '12px',
              letterSpacing: '1px',
              opacity: 0.9
            }}>
              🏛️ CENTRAL
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: '900',
              marginBottom: '12px'
            }}>
              {formatarMoeda(resumo?.totalCentral || 0)}
            </div>
            <div style={{
              fontSize: '0.9rem',
              opacity: 0.9,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '8px 12px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              60% dízimo + 40% oferta
            </div>
          </div>

          {/* Despesas Pagas */}
          <div style={{
            background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(235, 51, 73, 0.3)',
            color: '#fff',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(235, 51, 73, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(235, 51, 73, 0.3)';
          }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              marginBottom: '12px',
              letterSpacing: '1px',
              opacity: 0.9
            }}>
              💸 DESPESAS PAGAS
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: '900',
              marginBottom: '12px'
            }}>
              {formatarMoeda(resumo?.totalDespesasPagas || 0)}
            </div>
            <div style={{
              fontSize: '0.9rem',
              opacity: 0.9,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '8px 12px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              Despesas do período
            </div>
          </div>

          {/* Local */}
          <div style={{
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(17, 153, 142, 0.3)',
            color: '#fff',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(17, 153, 142, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(17, 153, 142, 0.3)';
          }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              marginBottom: '12px',
              letterSpacing: '1px',
              opacity: 0.9
            }}>
              🏠 LOCAL
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: '900',
              marginBottom: '12px'
            }}>
              {formatarMoeda(resumo?.totalLocal || 0)}
            </div>
            <div style={{
              fontSize: '0.9rem',
              opacity: 0.9,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '8px 12px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              marginBottom: '8px'
            }}>
              40% dízimo + 60% oferta
            </div>
            {resumo?.saldoRotativo > 0 && (
              <div style={{
                fontSize: '0.8rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '10px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <div>💵 Local: {formatarMoeda(resumo?.totalLocal || 0)}</div>
                <div>🔄 Anterior: {formatarMoeda(resumo?.saldoRotativo || 0)}</div>
              </div>
            )}
          </div>

          {/* Missões */}
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)',
            color: '#fff',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(240, 147, 251, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(240, 147, 251, 0.3)';
          }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              marginBottom: '12px',
              letterSpacing: '1px',
              opacity: 0.9
            }}>
              ⛪ MISSÕES
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: '900',
              marginBottom: '12px'
            }}>
              {formatarMoeda(resumo?.totalMissoes || 0)}
            </div>
            <div style={{
              fontSize: '0.9rem',
              opacity: 0.9,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '8px 12px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              100% santa ceia
            </div>
          </div>

          {/* Rádio Nazareno */}
          <div style={{
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(168, 237, 234, 0.3)',
            color: '#333',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(168, 237, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(168, 237, 234, 0.3)';
          }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              marginBottom: '12px',
              letterSpacing: '1px',
              opacity: 0.8
            }}>
              📻 RÁDIO NAZARENO
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: '900',
              marginBottom: '12px'
            }}>
              {formatarMoeda(resumo?.radioNazareno || 0)}
            </div>
            <div style={{
              fontSize: '0.9rem',
              opacity: 0.8,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: '8px 12px',
              borderRadius: '12px'
            }}>
              1% do valor local
            </div>
          </div>
        </div>

        {/* Seção de Despesas Pendentes - Ultra Modernizada */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            ⏰ Despesas Pendentes (15 Dias)
          </h2>

          {/* Análise de Saldo - Modernizada */}
          <div style={{
            background: saldoSuficiente 
              ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
              : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '28px',
            border: `3px solid ${saldoSuficiente ? '#4caf50' : '#f44336'}`,
            boxShadow: `0 8px 24px ${saldoSuficiente ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`
          }}>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              color: '#333',
              marginBottom: '16px'
            }}>
              💰 SALDO DISPONÍVEL
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '900',
              color: saldoSuficiente ? '#2e7d32' : '#c62828',
              marginBottom: '20px'
            }}>
              {formatarMoeda(resumo?.saldoMes || 0)}
            </div>
            
            {saldoSuficiente ? (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                borderLeft: '6px solid #4caf50',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: '#2e7d32',
                  marginBottom: '10px'
                }}>
                  ✅ SALDO APÓS PAGAR: {formatarMoeda((resumo?.saldoMes || 0) - (despesas?.totais?.geral || 0))}
                </div>
                <div style={{
                  fontSize: '1rem',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  Saldo suficiente para cobrir todas as despesas pendentes
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                borderLeft: '6px solid #f44336',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: '#c62828',
                  marginBottom: '10px'
                }}>
                  ⚠️ FALTAM: {formatarMoeda((despesas?.totais?.geral || 0) - (resumo?.saldoMes || 0))}
                </div>
                <div style={{
                  fontSize: '1rem',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  Saldo insuficiente para cobrir todas as despesas pendentes
                </div>
              </div>
            )}
          </div>

          {/* Grid de Despesas por Período - Melhorado */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            
            {/* Vencidas */}
            <div style={{
              background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
              borderRadius: '20px',
              padding: '24px',
              border: '3px solid #f44336',
              boxShadow: '0 8px 24px rgba(244, 67, 54, 0.2)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: '#c62828',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🚨 Vencidas ({despesas?.vencidas?.length || 0})
              </h3>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '900',
                color: '#c62828',
                marginBottom: '20px'
              }}>
                {formatarMoeda(despesas?.totais?.vencidas || 0)}
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {despesas?.vencidas?.length > 0 ? (
                  despesas.vencidas.map(despesa => (
                    <div key={despesa.id} style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      padding: '16px',
                      marginBottom: '12px',
                      borderLeft: '6px solid #f44336',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: '#333',
                        marginBottom: '6px'
                      }}>
                        {despesa.descricao}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#666',
                        marginBottom: '12px'
                      }}>
                        Vencimento: {new Date(despesa.vencimento).toLocaleDateString('pt-BR')}
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: '1.1rem',
                          fontWeight: '800',
                          color: '#c62828'
                        }}>
                          {formatarMoeda(despesa.valor)}
                        </span>
                        <button
                          onClick={() => handlePagarDespesa(despesa.id)}
                          style={{
                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '8px 16px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: '700',
                            boxShadow: '0 4px 12px rgba(17, 153, 142, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 6px 16px rgba(17, 153, 142, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 4px 12px rgba(17, 153, 142, 0.3)';
                          }}
                        >
                          ✅ Pagar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    color: '#999',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '40px 20px',
                    fontSize: '1rem'
                  }}>
                    Nenhuma despesa vencida
                  </div>
                )}
              </div>
            </div>

            {/* Próximos 7 Dias */}
            <div style={{
              background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
              borderRadius: '20px',
              padding: '24px',
              border: '3px solid #ffa726',
              boxShadow: '0 8px 24px rgba(255, 167, 38, 0.2)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: '#ef6c00',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚠️ Próximos 7 Dias ({despesas?.proximos7Dias?.length || 0})
              </h3>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '900',
                color: '#ef6c00',
                marginBottom: '20px'
              }}>
                {formatarMoeda(despesas?.totais?.proximos7 || 0)}
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {despesas?.proximos7Dias?.length > 0 ? (
                  despesas.proximos7Dias.map(despesa => (
                    <div key={despesa.id} style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      padding: '16px',
                      marginBottom: '12px',
                      borderLeft: '6px solid #ffa726',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: '#333',
                        marginBottom: '6px'
                      }}>
                        {despesa.descricao}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#666',
                        marginBottom: '12px'
                      }}>
                        Vencimento: {new Date(despesa.vencimento).toLocaleDateString('pt-BR')}
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: '1.1rem',
                          fontWeight: '800',
                          color: '#ef6c00'
                        }}>
                          {formatarMoeda(despesa.valor)}
                        </span>
                        <button
                          onClick={() => handlePagarDespesa(despesa.id)}
                          style={{
                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '8px 16px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: '700',
                            boxShadow: '0 4px 12px rgba(17, 153, 142, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 6px 16px rgba(17, 153, 142, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 4px 12px rgba(17, 153, 142, 0.3)';
                          }}
                        >
                          ✅ Pagar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    color: '#999',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '40px 20px',
                    fontSize: '1rem'
                  }}>
                    Nenhuma despesa nos próximos 7 dias
                  </div>
                )}
              </div>
            </div>

            {/* 8 a 15 Dias */}
            <div style={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderRadius: '20px',
              padding: '24px',
              border: '3px solid #42a5f5',
              boxShadow: '0 8px 24px rgba(66, 165, 245, 0.2)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: '#1565c0',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📅 8 a 15 Dias ({despesas?.de8a15Dias?.length || 0})
              </h3>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '900',
                color: '#1565c0',
                marginBottom: '20px'
              }}>
                {formatarMoeda(despesas?.totais?.de8a15 || 0)}
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {despesas?.de8a15Dias?.length > 0 ? (
                  despesas.de8a15Dias.map(despesa => (
                    <div key={despesa.id} style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      padding: '16px',
                      marginBottom: '12px',
                      borderLeft: '6px solid #42a5f5',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: '#333',
                        marginBottom: '6px'
                      }}>
                        {despesa.descricao}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#666',
                        marginBottom: '12px'
                      }}>
                        Vencimento: {new Date(despesa.vencimento).toLocaleDateString('pt-BR')}
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: '1.1rem',
                          fontWeight: '800',
                          color: '#1565c0'
                        }}>
                          {formatarMoeda(despesa.valor)}
                        </span>
                        <button
                          onClick={() => handlePagarDespesa(despesa.id)}
                          style={{
                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '8px 16px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: '700',
                            boxShadow: '0 4px 12px rgba(17, 153, 142, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 6px 16px rgba(17, 153, 142, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 4px 12px rgba(17, 153, 142, 0.3)';
                          }}
                        >
                          ✅ Pagar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    color: '#999',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '40px 20px',
                    fontSize: '1rem'
                  }}>
                    Nenhuma despesa de 8 a 15 dias
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumo Total - Modernizado */}
          <div style={{
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: '20px',
            padding: '28px',
            marginTop: '28px',
            border: '3px solid #90a4ae',
            boxShadow: '0 8px 24px rgba(144, 164, 174, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              color: '#37474f',
              marginBottom: '20px'
            }}>
              📊 Resumo Total das Despesas
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              <div style={{ 
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '900',
                  color: '#c62828',
                  marginBottom: '8px'
                }}>
                  {formatarMoeda(despesas?.totais?.vencidas || 0)}
                </div>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: '#666',
                  fontWeight: '600'
                }}>
                  Vencidas
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '900',
                  color: '#ef6c00',
                  marginBottom: '8px'
                }}>
                  {formatarMoeda(despesas?.totais?.proximos7 || 0)}
                </div>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: '#666',
                  fontWeight: '600'
                }}>
                  Próximos 7 dias
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '900',
                  color: '#1565c0',
                  marginBottom: '8px'
                }}>
                  {formatarMoeda(despesas?.totais?.de8a15 || 0)}
                </div>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: '#666',
                  fontWeight: '600'
                }}>
                  8 a 15 dias
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '2px solid #37474f'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '900',
                  color: '#37474f',
                  marginBottom: '8px'
                }}>
                  {formatarMoeda(despesas?.totais?.geral || 0)}
                </div>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: '#37474f',
                  fontWeight: '700'
                }}>
                  Total Geral
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Missões - Ultra Modernizada */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
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
            gap: '20px',
            marginBottom: '28px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(17, 153, 142, 0.3)',
              color: '#fff',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(17, 153, 142, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(17, 153, 142, 0.3)';
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '700',
                marginBottom: '12px',
                opacity: 0.9,
                letterSpacing: '0.5px'
              }}>
                🎯 Meta
              </h3>
              <div style={{
                fontSize: '2rem',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {formatarMoeda(missoes?.meta || 0)}
                {!modoEdicaoMeta && (
                  <button
                    onClick={() => setModoEdicaoMeta(true)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontWeight: '700',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.4)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                  >
                    ✏️ Editar
                  </button>
                )}
              </div>
            </div>

            <div style={{
              background: (missoes?.progresso || 0) >= 100 
                ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: `0 8px 24px ${(missoes?.progresso || 0) >= 100 ? 'rgba(17, 153, 142, 0.3)' : 'rgba(240, 147, 251, 0.3)'}`,
              color: '#fff',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = `0 12px 32px ${(missoes?.progresso || 0) >= 100 ? 'rgba(17, 153, 142, 0.4)' : 'rgba(240, 147, 251, 0.4)'}`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${(missoes?.progresso || 0) >= 100 ? 'rgba(17, 153, 142, 0.3)' : 'rgba(240, 147, 251, 0.3)'}`;
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '700',
                marginBottom: '12px',
                opacity: 0.9,
                letterSpacing: '0.5px'
              }}>
                📊 Progresso
              </h3>
              <div style={{
                fontSize: '2rem',
                fontWeight: '900'
              }}>
                {(parseFloat(missoes?.progresso) || 0).toFixed(1)}%
              </div>
            </div>

            <div style={{
              background: (missoes?.falta || 0) <= 0 
                ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: `0 8px 24px ${(missoes?.falta || 0) <= 0 ? 'rgba(17, 153, 142, 0.3)' : 'rgba(235, 51, 73, 0.3)'}`,
              color: '#fff',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = `0 12px 32px ${(missoes?.falta || 0) <= 0 ? 'rgba(17, 153, 142, 0.4)' : 'rgba(235, 51, 73, 0.4)'}`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${(missoes?.falta || 0) <= 0 ? 'rgba(17, 153, 142, 0.3)' : 'rgba(235, 51, 73, 0.3)'}`;
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '700',
                marginBottom: '12px',
                opacity: 0.9,
                letterSpacing: '0.5px'
              }}>
                {(missoes?.falta || 0) <= 0 ? '🎉 Meta Alcançada!' : '📈 Falta'}
              </h3>
              <div style={{
                fontSize: '2rem',
                fontWeight: '900'
              }}>
                {(missoes?.falta || 0) <= 0 ? '✅ Concluída' : formatarMoeda(missoes?.falta || 0)}
              </div>
            </div>
          </div>

          {/* Barra de Progresso - Modernizada */}
          <div style={{
            backgroundColor: '#e0e0e0',
            borderRadius: '20px',
            height: '32px',
            overflow: 'hidden',
            marginBottom: '20px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            <div style={{
              background: (missoes?.progresso || 0) >= 100 
                ? 'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)'
                : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              height: '100%',
              width: `${Math.min(missoes?.progresso || 0, 100)}%`,
              transition: 'width 0.5s ease',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '800',
              fontSize: '0.9rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              {(missoes?.progresso || 0) > 10 && `${(parseFloat(missoes?.progresso) || 0).toFixed(1)}%`}
            </div>
            {(missoes?.progresso || 0) <= 10 && (
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#666',
                fontWeight: '800',
                fontSize: '0.9rem'
              }}>
                {(parseFloat(missoes?.progresso) || 0).toFixed(1)}%
              </div>
            )}
          </div>

          {/* Edição de Meta - Modernizada */}
          {modoEdicaoMeta && (
            <div style={{
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: '20px',
              padding: '28px',
              border: '3px solid #90a4ae',
              boxShadow: '0 8px 24px rgba(144, 164, 174, 0.2)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: '#37474f',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
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
                    padding: '14px 20px',
                    border: '3px solid #dadce0',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    flex: '1',
                    minWidth: '200px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#dadce0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={handleAtualizarMeta}
                  style={{
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '700',
                    boxShadow: '0 4px 15px rgba(17, 153, 142, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(17, 153, 142, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(17, 153, 142, 0.3)';
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
                    background: 'linear-gradient(135deg, #757575 0%, #616161 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '700',
                    boxShadow: '0 4px 15px rgba(117, 117, 117, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(117, 117, 117, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(117, 117, 117, 0.3)';
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Moderno */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '24px 32px',
          marginTop: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '3px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '2px'
            }}></div>
            <span style={{
              fontSize: '1rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🏛️ Sistema de Gestão Financeira da Igreja
            </span>
            <div style={{
              width: '40px',
              height: '3px',
              background: 'linear-gradient(90deg, #764ba2 0%, #667eea 100%)',
              borderRadius: '2px'
            }}></div>
          </div>
          <p style={{
            fontSize: '0.9rem',
            color: '#666',
            margin: '0',
            opacity: 0.8
          }}>
            Dashboard atualizado automaticamente a cada 30 segundos
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;