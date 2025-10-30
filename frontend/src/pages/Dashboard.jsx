import React, { useState, useEffect } from 'react';
import { buscarResumoFinanceiro, buscarDespesasPendentes, buscarMetaMissoes, atualizarMetaMissoes } from '../services/dashboard';
import { marcarComoPago } from '../services/despesas';
import { formatarMoeda } from '../utils/formatacao';
import '../styles/Dashboard.css';

function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [despesas, setDespesas] = useState(null);
  const [missoes, setMissoes] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [modoEdicaoMeta, setModoEdicaoMeta] = useState(false);
  const [novaMeta, setNovaMeta] = useState('');

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
      setNovaMeta(resultadoMissoes.missoes.meta);
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
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner" />
          Carregando dados financeiros...
        </div>
      </div>
    );
  }

  if (!resumo || !despesas || !missoes) {
    return null;
  }

  const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="dashboard-container">
      {/* Cabeçalho */}
      <div className="dashboard-header">
        <h1>💰 FLUXO DE CAIXA COMPLETO</h1>
        <div className="dashboard-header-divider" />
        <p>Período: {mesNome}</p>
      </div>

      {/* GRID 2 COLUNAS - DESPESAS E RECEITAS */}
      <div className="dashboard-grid">
        {/* COLUNA ESQUERDA - DESPESAS */}
        <div className="coluna-despesas">
          <h2 className="coluna-titulo">💸 DESPESAS</h2>
          
          {/* Card Despesas Pagas */}
          <div className="dashboard-card card-despesa-paga">
            <h3>💰 DESPESAS PAGAS</h3>
            <div className="valor">{formatarMoeda(resumo.totalDespesasPagas)}</div>
            <div className="subtitulo">Despesas já pagas no mês</div>
          </div>

          {/* Card Despesas Pendentes */}
          <div className="dashboard-card card-despesa-pendente">
            <h3>⏰ DESPESAS PENDENTES</h3>
            <div className="valor">{formatarMoeda(despesas.totais.geral)}</div>
            <div className="subtitulo">A vencer nos próximos 15 dias</div>
          </div>

          {/* Alertas */}
          <div className="alertas-container">
            {despesas.vencidas.length > 0 && (
              <div className="alerta vencidas">
                ⚠️ VENCIDAS: {despesas.vencidas.length}
              </div>
            )}
            {despesas.proximos7Dias.length > 0 && (
              <div className="alerta proximas">
                🔔 VENCE EM 7 DIAS: {despesas.proximos7Dias.length}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA - RECEITAS */}
        <div className="coluna-receitas">
          <h2 className="coluna-titulo">💰 RECEITAS</h2>
          
          {/* Card Entrada Local */}
          <div className="dashboard-card card-receita-entrada">
            <h3>💵 ENTRADA LOCAL</h3>
            <div className="valor">{formatarMoeda(resumo.totalLocal)}</div>
            <div className="subtitulo">40% dízimo + 60% ofertas</div>
          </div>

          {/* Card Fina Central */}
          <div className="dashboard-card card-receita-fina">
            <h3>💰 FINA CENTRAL</h3>
            <div className="valor">{formatarMoeda(resumo.totalCentral)}</div>
            <div className="subtitulo">Dízimo + Ofertas enviadas</div>
          </div>

          {/* Card Missões */}
          <div className="dashboard-card card-missoes">
            <h3>🎯 MISSÕES</h3>
            <div className="valor">{formatarMoeda(resumo.totalMissoes)}</div>
            <div className="subtitulo">{missoes.progresso >= 100 ? 'Meta atingida! 🎉' : 'Meta não atingida'}</div>
          </div>
        </div>
      </div>

      {/* SEÇÃO: Resumo Financeiro */}
      <div className="card-detalhamento">
        <h2>💵 RESUMO FINANCEIRO</h2>
        <div className="resumo-financeiro">
          <div className="resumo-titulo">💰 Total de Receitas</div>
          <div className="resumo-saldo">R$ {formatarMoeda(resumo.totalLocal + resumo.totalCentral + resumo.totalMissoes)}</div>
          <div className="resumo-titulo">💸 Total de Despesas Pagas</div>
          <div className="resumo-saldo">{formatarMoeda(resumo.totalDespesasPagas)}</div>
          <div className="resumo-divider" />
          <div className={`resumo-resultado ${resumo.saldoMes >= 0 ? 'positivo' : 'negativo'}`}>
            <div className="resumo-resultado-titulo">
              ✅ Saldo do Mês: {formatarMoeda(resumo.saldoMes)}
            </div>
            <div className="resumo-resultado-subtitulo">
              {resumo.saldoMes >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
            </div>
          </div>
          {despesas.totais.geral > 0 && (
            <div className={`resumo-resultado ${resumo.totalLocal >= despesas.totais.geral ? 'positivo' : 'negativo'}`} style={{ marginTop: '12px' }}>
              <div className="resumo-resultado-titulo">
                {resumo.totalLocal >= despesas.totais.geral ? '✅' : '⚠️'} Saldo Após Pagar Pendentes: {formatarMoeda(resumo.totalLocal - despesas.totais.geral)}
              </div>
              <div className="resumo-resultado-subtitulo">
                {resumo.totalLocal >= despesas.totais.geral 
                  ? 'Saldo suficiente para cobrir despesas pendentes' 
                  : `Faltam ${formatarMoeda(despesas.totais.geral - resumo.totalLocal)} para cobrir despesas`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO: Detalhamento de Entradas */}
      <div className="card-detalhamento">
        <h2>📊 DETALHAMENTO DAS ENTRADAS</h2>
        <div className="detalhamento-grid">
          {/* Para Central */}
          <div className="detalhamento-item azul">
            <div style={{ fontSize: '0.875rem', color: '#5f6368', fontWeight: '600', marginBottom: '8px' }}>
              🏛️ PARA CENTRAL
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a73e8', marginBottom: '12px' }}>
              {formatarMoeda(resumo.totalCentral)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#5f6368', marginBottom: '12px' }}>
              60% dízimos/ofertas
            </div>
            <div className="detalhamento-subgrid">
              <div className="detalhamento-subitem">
                <div style={{ fontSize: '0.7rem', color: '#5f6368', marginBottom: '4px' }}>💳 PIX</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a73e8' }}>
                  {formatarMoeda(resumo.totalPixCentral)}
                </div>
              </div>
              <div className="detalhamento-subitem">
                <div style={{ fontSize: '0.7rem', color: '#5f6368', marginBottom: '4px' }}>💵 Dinheiro</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a73e8' }}>
                  {formatarMoeda(resumo.totalDinheiroCentral)}
                </div>
              </div>
            </div>
          </div>

          {/* Fica Local */}
          <div className="detalhamento-item verde">
            <div style={{ fontSize: '0.875rem', color: '#5f6368', fontWeight: '600', marginBottom: '8px' }}>
              🏠 FICA LOCAL
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#34a853', marginBottom: '12px' }}>
              {formatarMoeda(resumo.totalLocal)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#5f6368', marginBottom: '12px' }}>
              40% dízimos + outros
            </div>
            <div className="detalhamento-subgrid">
              <div className="detalhamento-subitem">
                <div style={{ fontSize: '0.7rem', color: '#5f6368', marginBottom: '4px' }}>💳 PIX</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#34a853' }}>
                  {formatarMoeda(resumo.totalPixLocal)}
                </div>
              </div>
              <div className="detalhamento-subitem">
                <div style={{ fontSize: '0.7rem', color: '#5f6368', marginBottom: '4px' }}>💵 Dinheiro</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#34a853' }}>
                  {formatarMoeda(resumo.totalDinheiroLocal)}
                </div>
              </div>
            </div>
          </div>

          {/* Missões */}
          <div className="detalhamento-item amarelo">
            <div style={{ fontSize: '0.875rem', color: '#5f6368', fontWeight: '600', marginBottom: '8px' }}>
              ⛪ MISSÕES
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fbbc04' }}>
              {formatarMoeda(resumo.totalMissoes)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#5f6368', marginTop: '4px' }}>
              100% santa ceia
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO: Meta de Missões */}
      <div className="meta-missoes">
        <div className="meta-header">
          <h2>🎯 META DE MISSÕES - {mesNome.toUpperCase()}</h2>
          <button
            onClick={() => setModoEdicaoMeta(!modoEdicaoMeta)}
            className={`meta-btn ${modoEdicaoMeta ? 'cancelar' : 'editar'}`}
          >
            {modoEdicaoMeta ? '✖️ Cancelar' : '✏️ Editar Meta'}
          </button>
        </div>

        {modoEdicaoMeta && (
          <div className="meta-editor">
            <label>Nova Meta (R$):</label>
            <input
              type="number"
              value={novaMeta}
              onChange={(e) => setNovaMeta(e.target.value)}
            />
            <button onClick={handleSalvarNovaMeta} className="meta-btn salvar">
              💾 Salvar
            </button>
          </div>
        )}

        <div className="meta-grid">
          <div>
            <div className="meta-item">Arrecadado</div>
            <div className="meta-valor verde">{formatarMoeda(missoes.arrecadado)}</div>
          </div>
          <div>
            <div className="meta-item">Meta</div>
            <div className="meta-valor azul">{formatarMoeda(missoes.meta)}</div>
          </div>
          <div>
            <div className="meta-item">Falta</div>
            <div className={`meta-valor ${missoes.falta > 0 ? 'vermelho' : 'verde'}`}>
              {formatarMoeda(missoes.falta)}
            </div>
          </div>
        </div>

        <div className="meta-progresso">
          <div 
            className={`meta-progresso-barra ${parseFloat(missoes.progresso) >= 100 ? 'completo' : 'incompleto'}`}
            style={{ width: `${missoes.progresso}%` }}
          />
          <div className={`meta-progresso-texto ${parseFloat(missoes.progresso) > 50 ? 'claro' : 'escuro'}`}>
            {missoes.progresso}%
          </div>
        </div>
      </div>

      {/* SEÇÃO: Despesas Pendentes */}
      <div className="despesas-pendentes">
        <h2>⚠️ DESPESAS PENDENTES - PRÓXIMOS 15 DIAS</h2>

        {/* Grupo: Vencidas */}
        {despesas.vencidas.length > 0 && (
          <div className="despesa-grupo vencidas">
            <h3>🔴 VENCIDAS ({despesas.vencidas.length})</h3>
            {despesas.vencidas.map(d => (
              <div key={d.id} className="despesa-item vencidas">
                <div className="despesa-info">
                  <div className="despesa-descricao">{d.descricao}</div>
                  <div className="despesa-vencimento">
                    Vencimento: {new Date(d.vencimento).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="despesa-valor vencidas">{formatarMoeda(d.valor)}</div>
                <button onClick={() => handlePagarDespesa(d.id)} className="despesa-btn">
                  Pagar
                </button>
              </div>
            ))}
            <div className="despesa-total vencidas">
              Total: {formatarMoeda(despesas.totais.vencidas)}
            </div>
          </div>
        )}

        {/* Grupo: Próximos 7 Dias */}
        {despesas.proximos7Dias.length > 0 && (
          <div className="despesa-grupo proximas">
            <h3>🟡 VENCE EM 7 DIAS ({despesas.proximos7Dias.length})</h3>
            {despesas.proximos7Dias.map(d => (
              <div key={d.id} className="despesa-item proximas">
                <div className="despesa-info">
                  <div className="despesa-descricao">{d.descricao}</div>
                  <div className="despesa-vencimento">
                    Vencimento: {new Date(d.vencimento).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="despesa-valor proximas">{formatarMoeda(d.valor)}</div>
                <button onClick={() => handlePagarDespesa(d.id)} className="despesa-btn">
                  Pagar
                </button>
              </div>
            ))}
            <div className="despesa-total proximas">
              Total: {formatarMoeda(despesas.totais.proximos7)}
            </div>
          </div>
        )}

        {/* Grupo: 8-15 Dias */}
        {despesas.de8a15Dias.length > 0 && (
          <div className="despesa-grupo futuras">
            <h3>🟢 VENCE EM 8-15 DIAS ({despesas.de8a15Dias.length})</h3>
            {despesas.de8a15Dias.map(d => (
              <div key={d.id} className="despesa-item futuras">
                <div className="despesa-info">
                  <div className="despesa-descricao">{d.descricao}</div>
                  <div className="despesa-vencimento">
                    Vencimento: {new Date(d.vencimento).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="despesa-valor futuras">{formatarMoeda(d.valor)}</div>
                <button onClick={() => handlePagarDespesa(d.id)} className="despesa-btn">
                  Pagar
                </button>
              </div>
            ))}
            <div className="despesa-total futuras">
              Total: {formatarMoeda(despesas.totais.de8a15)}
            </div>
          </div>
        )}

        {/* Totais e Saldo */}
        <div className="resumo-financeiro">
          <div className="resumo-titulo">
            💰 TOTAL A PAGAR: {formatarMoeda(despesas.totais.geral)}
          </div>
          <div className="resumo-saldo">
            💵 SALDO DISPONÍVEL: {formatarMoeda(resumo.totalLocal)}
          </div>
          <div className="resumo-divider" />
          
          {resumo.totalLocal >= despesas.totais.geral ? (
            <div className="resumo-resultado positivo">
              <div className="resumo-resultado-titulo">
                ✅ SALDO APÓS PAGAR: {formatarMoeda(resumo.totalLocal - despesas.totais.geral)}
              </div>
              <div className="resumo-resultado-subtitulo">
                Saldo suficiente para cobrir todas as despesas pendentes
              </div>
            </div>
          ) : (
            <div className="resumo-resultado negativo">
              <div className="resumo-resultado-titulo">
                ⚠️ FALTAM: {formatarMoeda(despesas.totais.geral - resumo.totalLocal)}
              </div>
              <div className="resumo-resultado-subtitulo">
                Saldo insuficiente para cobrir todas as despesas pendentes
              </div>
            </div>
          )}

          {despesas.vencidas.length === 0 && despesas.proximos7Dias.length === 0 && despesas.de8a15Dias.length === 0 && (
            <div className="resumo-vazio">
              <div className="resumo-vazio-texto">
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