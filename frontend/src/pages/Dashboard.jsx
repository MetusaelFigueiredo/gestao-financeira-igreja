import React, { useState, useEffect } from 'react';
import { buscarResumoFinanceiro, buscarDespesasPendentes, buscarMetaMissoes, atualizarMetaMissoes } from '../services/dashboard';
import { buscarEntradas } from '../services/entradas';
import { marcarComoPago } from '../services/despesas';
import { formatarMoeda } from '../utils/formatacao';
import CardSaldoMes from '../components/CardSaldoMes';
import CardResumoFinanceiro from '../components/CardResumoFinanceiro';
import DespesasPendentes from '../components/DespesasPendentes';
import ReconciliacaoFinanceira from '../components/ReconciliacaoFinanceira';
import MetaMissoes from '../components/MetaMissoes';

function Dashboard({ onNavigate }) {
  const [resumo, setResumo] = useState(null);
  const [despesas, setDespesas] = useState(null);
  const [missoes, setMissoes] = useState(null);
  const [entradas, setEntradas] = useState(null);
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
      const [resultadoResumo, resultadoDespesas, resultadoMissoes, resultadoEntradas] = await Promise.all([
        buscarResumoFinanceiro(anoSelecionado, mesSelecionado),
        buscarDespesasPendentes(), // 🎯 SEMPRE próximos 15 dias
        buscarMetaMissoes(anoSelecionado, mesSelecionado),
        buscarEntradas() // 🔍 Para reconciliação financeira
      ]);
      
      console.log('📊 Resultado resumo:', resultadoResumo);
      console.log('💸 Resultado despesas:', resultadoDespesas);
      console.log('🎯 Resultado missões:', resultadoMissoes);
      console.log('📋 Resultado entradas:', resultadoEntradas);
      
      if (resultadoResumo.success) {
        const resumoCompleto = resultadoResumo.resumo;
        
        // 📻 Calcular 1% da Igreja Local para Rádio Nazareno
        resumoCompleto.radioNazareno = Math.round((resumoCompleto.totalLocal || 0) * 0.01 * 100) / 100;
        
        // 📊 Calcular totais para o novo card
        resumoCompleto.totalEntradas = (resumoCompleto.totalCentral || 0) + (resumoCompleto.totalLocal || 0) + (resumoCompleto.totalMissoes || 0);
        resumoCompleto.totalDespesasPendentes = 0; // Será calculado quando buscarmos as despesas
        resumoCompleto.percentualGasto = resumoCompleto.totalEntradas > 0 
          ? (resumoCompleto.totalDespesasPagas / resumoCompleto.totalEntradas) * 100 
          : 0;
        
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
        
        // 📊 Atualizar total de despesas pendentes no resumo
        if (resumo) {
          const totalPendentes = resultadoDespesas.despesas?.totais?.geral || 0;
          setResumo(prevResumo => ({
            ...prevResumo,
            totalDespesasPendentes: totalPendentes
          }));
        }
        
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
      
      if (resultadoEntradas.success) {
        setEntradas(resultadoEntradas.entradas);
        console.log('✅ Entradas carregadas com sucesso para reconciliação');
      } else {
        console.error('❌ Erro ao carregar entradas:', resultadoEntradas.error);
        setEntradas([]);
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
      setEntradas([]);
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

      {/* Card SALDO DO MÊS em Destaque - NOVO COMPONENTE */}
      <CardSaldoMes 
        resumo={resumo} 
        formatarMoeda={formatarMoeda}
      />

      {/* Cards de Resumo Financeiro - NOVO COMPONENTE */}
      <CardResumoFinanceiro 
        resumo={resumo} 
        formatarMoeda={formatarMoeda}
      />

      {/* Reconciliação Financeira - NOVO COMPONENTE */}
      <ReconciliacaoFinanceira 
        entradas={entradas}
        formatarMoeda={formatarMoeda}
      />

      {/* Despesas Pendentes - NOVO COMPONENTE */}
      <DespesasPendentes 
        resumo={resumo}
        despesas={despesas}
        formatarMoeda={formatarMoeda}
        onPagarDespesa={handlePagarDespesa}
      />
      {/* Meta de Missões - NOVO COMPONENTE */}
      <MetaMissoes 
        missoes={missoes}
        formatarMoeda={formatarMoeda}
        modoEdicaoMeta={modoEdicaoMeta}
        setModoEdicaoMeta={setModoEdicaoMeta}
        novaMeta={novaMeta}
        setNovaMeta={setNovaMeta}
        onAtualizarMeta={handleAtualizarMeta}
      />
    </div>
  );
}

export default Dashboard;