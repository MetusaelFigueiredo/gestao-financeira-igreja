import React, { useState, useEffect } from 'react';
import { buscarEntradas } from '../services/entradas';
import { formatarMoeda } from '../utils/formatacao';

function Reconciliacao() {
  const [carregando, setCarregando] = useState(true);
  const [entradas, setEntradas] = useState([]);
  const [filtros, setFiltros] = useState({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth(),
    tipoFiltro: 'mensal' // 'mensal' ou 'personalizado'
  });
  const [periodo, setPeriodo] = useState({
    dataInicio: '',
    dataFim: ''
  });
  const [reconciliacaoAtual, setReconciliacaoAtual] = useState(null);
  const [historico, setHistorico] = useState([]);

  // Opções para os selects
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const anos = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const resultado = await buscarEntradas();
      if (resultado.success) {
        const entradasFiltradas = filtrarEntradas(resultado.entradas);
        setEntradas(entradasFiltradas);
        calcularReconciliacao(entradasFiltradas);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setCarregando(false);
  };

  const filtrarEntradas = (todasEntradas) => {
    return todasEntradas.filter(entrada => {
      const dataEntrada = new Date(entrada.data);
      
      if (filtros.tipoFiltro === 'mensal') {
        return dataEntrada.getFullYear() === filtros.ano && 
               dataEntrada.getMonth() === filtros.mes;
      } else {
        const inicio = new Date(periodo.dataInicio);
        const fim = new Date(periodo.dataFim);
        return dataEntrada >= inicio && dataEntrada <= fim;
      }
    });
  };

  const calcularReconciliacao = (entradas) => {
    let totalPix = 0;
    let totalDinheiro = 0;
    let centralPix = 0;
    let centralDinheiro = 0;
    let localPix = 0;
    let localDinheiro = 0;

    // 🔍 DEBUG: Verificar estrutura das entradas
    console.log('🔍 Estrutura das entradas para reconciliação:', entradas.slice(0, 2));

    entradas.forEach(entrada => {
      const valor = parseFloat(entrada.valor) || 0;
      const tipo = entrada.tipo?.toLowerCase() || '';
      const rateio = entrada.rateio || {};

      // Apenas Dízimo e Oferta participam da reconciliação
      if (tipo === 'dizimo' || tipo === 'oferta') {
        if (entrada.formaRecebimento === 'pix') {
          totalPix += valor;
          centralPix += (rateio.central || 0);
          localPix += (rateio.local || 0);
        } else if (entrada.formaRecebimento === 'dinheiro') {
          totalDinheiro += valor;
          centralDinheiro += (rateio.central || 0);
          localDinheiro += (rateio.local || 0);
        }
      }
    });

    const centralDeveDevolver = Math.round(totalPix * 0.40 * 100) / 100;
    const localDeveRepassar = Math.round(totalDinheiro * 0.60 * 100) / 100;
    const saldoFinal = Math.round((centralDeveDevolver - localDeveRepassar) * 100) / 100;

    const reconciliacao = {
      periodo: filtros.tipoFiltro === 'mensal' 
        ? `${meses[filtros.mes]}/${filtros.ano}`
        : `${periodo.dataInicio} à ${periodo.dataFim}`,
      totalPix: Math.round(totalPix * 100) / 100,
      totalDinheiro: Math.round(totalDinheiro * 100) / 100,
      central: {
        pix: Math.round(centralPix * 100) / 100,
        dinheiro: Math.round(centralDinheiro * 100) / 100,
        total: Math.round((centralPix + centralDinheiro) * 100) / 100
      },
      local: {
        pix: Math.round(localPix * 100) / 100,
        dinheiro: Math.round(localDinheiro * 100) / 100,
        total: Math.round((localPix + localDinheiro) * 100) / 100
      },
      centralDeveDevolver,
      localDeveRepassar,
      saldoFinal: Math.abs(saldoFinal),
      favorecido: saldoFinal >= 0 ? 'local' : 'central',
      descricao: saldoFinal >= 0 
        ? `Local tem a receber R$ ${Math.abs(saldoFinal).toFixed(2)}`
        : `Local deve devolver R$ ${Math.abs(saldoFinal).toFixed(2)}`,
      quantidadeEntradas: entradas.filter(e => e.tipo?.toLowerCase() === 'dizimo' || e.tipo?.toLowerCase() === 'oferta').length,
      dataCalculo: new Date(),
      conciliado: false
    };

    setReconciliacaoAtual(reconciliacao);
  };

  const salvarReconciliacao = () => {
    if (!reconciliacaoAtual) return;
    
    const novaReconciliacao = {
      ...reconciliacaoAtual,
      id: Date.now(),
      conciliado: true,
      dataConciliacao: new Date()
    };
    
    setHistorico(prev => [novaReconciliacao, ...prev]);
    alert('✅ Reconciliação salva com sucesso!');
  };

  const exportarPDF = () => {
    alert('🔄 Funcionalidade de exportação PDF será implementada em breve!');
  };

  if (carregando) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>🔄 Carregando dados...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Cabeçalho */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#ff6f00',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          ⚖️ RECONCILIAÇÃO FINANCEIRA
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#666',
          margin: 0,
          lineHeight: '1.5'
        }}>
          Compare os valores físicos (PIX/Dinheiro) com os registros contábeis.
          <br />
          <strong>Escopo:</strong> Apenas Dízimo e Oferta (rateio 60% Central / 40% Local)
        </p>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#202124',
          margin: '0 0 20px 0'
        }}>
          📅 Filtros de Período
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <input
              type="radio"
              value="mensal"
              checked={filtros.tipoFiltro === 'mensal'}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipoFiltro: e.target.value }))}
            />
            <span style={{ fontWeight: '500' }}>Filtro Mensal</span>
          </label>
          
          {filtros.tipoFiltro === 'mensal' && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: '28px' }}>
              <select
                value={filtros.mes}
                onChange={(e) => setFiltros(prev => ({ ...prev, mes: parseInt(e.target.value) }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '0.875rem'
                }}
              >
                {meses.map((mes, index) => (
                  <option key={index} value={index}>{mes}</option>
                ))}
              </select>
              
              <select
                value={filtros.ano}
                onChange={(e) => setFiltros(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '0.875rem'
                }}
              >
                {anos.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <input
              type="radio"
              value="personalizado"
              checked={filtros.tipoFiltro === 'personalizado'}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipoFiltro: e.target.value }))}
            />
            <span style={{ fontWeight: '500' }}>Período Personalizado</span>
          </label>
          
          {filtros.tipoFiltro === 'personalizado' && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: '28px' }}>
              <input
                type="date"
                value={periodo.dataInicio}
                onChange={(e) => setPeriodo(prev => ({ ...prev, dataInicio: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '0.875rem'
                }}
              />
              <span>até</span>
              <input
                type="date"
                value={periodo.dataFim}
                onChange={(e) => setPeriodo(prev => ({ ...prev, dataFim: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Resultados da Reconciliação */}
      {reconciliacaoAtual && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: `3px solid ${reconciliacaoAtual.favorecido === 'local' ? '#4caf50' : '#ff9800'}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: reconciliacaoAtual.favorecido === 'local' ? '#2e7d32' : '#e65100',
              margin: 0
            }}>
              📊 RESULTADO - {reconciliacaoAtual.periodo}
            </h2>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={salvarReconciliacao}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#4caf50',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                💾 Salvar Reconciliação
              </button>
              
              <button
                onClick={exportarPDF}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#1a73e8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                📄 Exportar PDF
              </button>
            </div>
          </div>

          {/* Cards de Valores */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* PIX Total */}
            <div style={{
              padding: '20px',
              backgroundColor: '#e3f2fd',
              borderRadius: '12px',
              border: '2px solid #2196f3'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#1565c0', fontWeight: '600', marginBottom: '8px' }}>
                💳 TOTAL PIX
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1565c0' }}>
                {formatarMoeda(reconciliacaoAtual.totalPix)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#1565c0', marginTop: '4px' }}>
                Central: {formatarMoeda(reconciliacaoAtual.central.pix)}
                <br />
                Local: {formatarMoeda(reconciliacaoAtual.local.pix)}
              </div>
            </div>

            {/* Dinheiro Total */}
            <div style={{
              padding: '20px',
              backgroundColor: '#e8f5e8',
              borderRadius: '12px',
              border: '2px solid #4caf50'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#2e7d32', fontWeight: '600', marginBottom: '8px' }}>
                💵 TOTAL DINHEIRO
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2e7d32' }}>
                {formatarMoeda(reconciliacaoAtual.totalDinheiro)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#2e7d32', marginTop: '4px' }}>
                Central: {formatarMoeda(reconciliacaoAtual.central.dinheiro)}
                <br />
                Local: {formatarMoeda(reconciliacaoAtual.local.dinheiro)}
              </div>
            </div>

            {/* Central Deve Devolver */}
            <div style={{
              padding: '20px',
              backgroundColor: '#fff3e0',
              borderRadius: '12px',
              border: '2px solid #ff9800'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#e65100', fontWeight: '600', marginBottom: '8px' }}>
                ↩️ CENTRAL DEVE DEVOLVER
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#e65100' }}>
                {formatarMoeda(reconciliacaoAtual.centralDeveDevolver)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#e65100', marginTop: '4px' }}>
                40% dos PIX
              </div>
            </div>

            {/* Local Deve Repassar */}
            <div style={{
              padding: '20px',
              backgroundColor: '#fce4ec',
              borderRadius: '12px',
              border: '2px solid #e91e63'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#c2185b', fontWeight: '600', marginBottom: '8px' }}>
                ↪️ LOCAL DEVE REPASSAR
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#c2185b' }}>
                {formatarMoeda(reconciliacaoAtual.localDeveRepassar)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#c2185b', marginTop: '4px' }}>
                60% do dinheiro
              </div>
            </div>
          </div>

          {/* Resultado Final */}
          <div style={{
            padding: '24px',
            backgroundColor: reconciliacaoAtual.favorecido === 'local' ? '#e8f5e8' : '#fff3e0',
            borderRadius: '12px',
            border: `2px solid ${reconciliacaoAtual.favorecido === 'local' ? '#4caf50' : '#ff9800'}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: reconciliacaoAtual.favorecido === 'local' ? '#2e7d32' : '#e65100',
              marginBottom: '8px'
            }}>
              {reconciliacaoAtual.favorecido === 'local' ? '✅ RESULTADO FINAL' : '⚠️ RESULTADO FINAL'}
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: reconciliacaoAtual.favorecido === 'local' ? '#2e7d32' : '#e65100',
              marginBottom: '8px'
            }}>
              {formatarMoeda(reconciliacaoAtual.saldoFinal)}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: reconciliacaoAtual.favorecido === 'local' ? '#2e7d32' : '#e65100'
            }}>
              {reconciliacaoAtual.descricao}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#666',
              marginTop: '8px'
            }}>
              Baseado em {reconciliacaoAtual.quantidadeEntradas} entrada(s) de Dízimo/Oferta
            </div>
          </div>
        </div>
      )}

      {/* Detalhamento dos Lançamentos */}
      {reconciliacaoAtual && entradas.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#202124',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 LANÇAMENTOS QUE COMPÕEM A RECONCILIAÇÃO
            <span style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              fontWeight: '400'
            }}>
              ({entradas.filter(e => e.tipo?.toLowerCase() === 'dizimo' || e.tipo?.toLowerCase() === 'oferta').length} entradas)
            </span>
          </h2>
          
          <div style={{
            fontSize: '0.875rem',
            color: '#666',
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e8eaed'
          }}>
            ℹ️ <strong>Critério:</strong> Apenas entradas do tipo <strong>Dízimo</strong> e <strong>Oferta</strong> participam da reconciliação (rateio 60% Central / 40% Local).
            <br />
            ❌ <strong>Excluídas:</strong> Missão, Cantina, Outros (não seguem o rateio padrão).
          </div>

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
                    📅 Data
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                    👤 Membro
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                    🏷️ Tipo
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                    💳 Forma
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                    💰 Valor
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                    🏛️ Central (60%)
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                    🏠 Local (40%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {entradas
                  .filter(entrada => entrada.tipo?.toLowerCase() === 'dizimo' || entrada.tipo?.toLowerCase() === 'oferta')
                  .sort((a, b) => new Date(b.data) - new Date(a.data))
                  .map((entrada, index) => {
                    const rateio = entrada.rateio || {};
                    const isPixPayment = entrada.formaRecebimento === 'pix';
                    
                    return (
                      <tr key={entrada.id || index} style={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                      }}>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed' }}>
                          {new Date(entrada.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed' }}>
                          {entrada.membroNome || 'Não informado'}
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
                            backgroundColor: entrada.tipo?.toLowerCase() === 'dizimo' ? '#e3f2fd' : '#e8f5e8',
                            color: entrada.tipo?.toLowerCase() === 'dizimo' ? '#1565c0' : '#2e7d32'
                          }}>
                            {entrada.tipo?.toUpperCase() || 'N/A'}
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
                            backgroundColor: isPixPayment ? '#e3f2fd' : '#e8f5e8',
                            color: isPixPayment ? '#1565c0' : '#2e7d32'
                          }}>
                            {isPixPayment ? '💳 PIX' : '💵 DINHEIRO'}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          borderBottom: '1px solid #e8eaed',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: '#202124'
                        }}>
                          {formatarMoeda(parseFloat(entrada.valor) || 0)}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          borderBottom: '1px solid #e8eaed',
                          textAlign: 'right',
                          color: '#1565c0',
                          fontWeight: '500'
                        }}>
                          {formatarMoeda(rateio.central || 0)}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          borderBottom: '1px solid #e8eaed',
                          textAlign: 'right',
                          color: '#2e7d32',
                          fontWeight: '500'
                        }}>
                          {formatarMoeda(rateio.local || 0)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f1f3f4' }}>
                  <td colSpan="4" style={{ 
                    padding: '16px', 
                    fontWeight: '600',
                    borderTop: '2px solid #e8eaed'
                  }}>
                    🧮 TOTAIS DA RECONCILIAÇÃO
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    textAlign: 'right',
                    fontWeight: '700',
                    fontSize: '1rem',
                    color: '#202124',
                    borderTop: '2px solid #e8eaed'
                  }}>
                    {formatarMoeda((reconciliacaoAtual.totalPix || 0) + (reconciliacaoAtual.totalDinheiro || 0))}
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    textAlign: 'right',
                    fontWeight: '700',
                    fontSize: '1rem',
                    color: '#1565c0',
                    borderTop: '2px solid #e8eaed'
                  }}>
                    {formatarMoeda(reconciliacaoAtual.central?.total || 0)}
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    textAlign: 'right',
                    fontWeight: '700',
                    fontSize: '1rem',
                    color: '#2e7d32',
                    borderTop: '2px solid #e8eaed'
                  }}>
                    {formatarMoeda(reconciliacaoAtual.local?.total || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Resumo por Forma de Pagamento */}
          <div style={{
            marginTop: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              padding: '16px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              border: '1px solid #2196f3'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#1565c0', fontWeight: '600', marginBottom: '8px' }}>
                💳 RESUMO PIX
              </div>
              <div style={{ fontSize: '0.75rem', color: '#1565c0', lineHeight: '1.5' }}>
                Total: <strong>{formatarMoeda(reconciliacaoAtual.totalPix)}</strong><br />
                Central: {formatarMoeda(reconciliacaoAtual.central?.pix || 0)}<br />
                Local: {formatarMoeda(reconciliacaoAtual.local?.pix || 0)}
              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #4caf50'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#2e7d32', fontWeight: '600', marginBottom: '8px' }}>
                💵 RESUMO DINHEIRO
              </div>
              <div style={{ fontSize: '0.75rem', color: '#2e7d32', lineHeight: '1.5' }}>
                Total: <strong>{formatarMoeda(reconciliacaoAtual.totalDinheiro)}</strong><br />
                Central: {formatarMoeda(reconciliacaoAtual.central?.dinheiro || 0)}<br />
                Local: {formatarMoeda(reconciliacaoAtual.local?.dinheiro || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#202124',
            margin: '0 0 20px 0'
          }}>
            📋 Histórico de Reconciliações
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historico.map((item, index) => (
              <div key={item.id} style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e8eaed',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '500', color: '#202124' }}>
                    {item.periodo}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#5f6368' }}>
                    {item.descricao} • {item.quantidadeEntradas} entradas
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontWeight: '600', 
                    color: item.favorecido === 'local' ? '#2e7d32' : '#e65100' 
                  }}>
                    {formatarMoeda(item.saldoFinal)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#5f6368' }}>
                    {new Date(item.dataConciliacao).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Reconciliacao;