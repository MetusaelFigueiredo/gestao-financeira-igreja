import React, { useState } from 'react';
import { gerarRelatorioMes, buscarDadosRelatorio, formatarRelatorioParaExcel } from '../services/relatorios';
import { exportarParaPDF, exportarParaExcel, imprimirRelatorio } from '../utils/exportacao';
import { formatarMoeda } from '../utils/formatacao';
import '../styles/print.css';

function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState('compilado'); // 'compilado' ou 'detalhado'
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoPeriodo, setTipoPeriodo] = useState('mes'); // 'mes' ou 'customizado'
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleGerarRelatorio = async () => {
    setCarregando(true);
    
    let resultado;
    
    if (tipoPeriodo === 'mes') {
      resultado = await gerarRelatorioMes(parseInt(mes), parseInt(ano));
    } else {
      if (!dataInicio || !dataFim) {
        alert('❌ Selecione as datas de início e fim!');
        setCarregando(false);
        return;
      }
      
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      inicio.setHours(0, 0, 0, 0);
      fim.setHours(23, 59, 59, 999);
      
      resultado = await buscarDadosRelatorio(inicio, fim);
    }
    
    if (resultado.success) {
      setRelatorio(resultado.relatorio);
    } else {
      alert('❌ Erro ao gerar relatório: ' + resultado.error);
    }
    
    setCarregando(false);
  };

  const handleExportarPDF = async () => {
    const nomeArquivo = `Relatorio_${tipoPeriodo === 'mes' ? meses[mes] : 'Periodo'}_${ano}.pdf`;
    const resultado = await exportarParaPDF('relatorio-content', nomeArquivo);
    
    if (resultado.success) {
      alert('✅ PDF exportado com sucesso!');
    } else {
      alert('❌ Erro ao exportar PDF: ' + resultado.error);
    }
  };

  const handleExportarExcel = () => {
    if (!relatorio) return;
    
    const dadosFormatados = formatarRelatorioParaExcel(relatorio);
    const nomeArquivo = `Relatorio_${tipoPeriodo === 'mes' ? meses[mes] : 'Periodo'}_${ano}.xlsx`;
    const resultado = exportarParaExcel(dadosFormatados, nomeArquivo);
    
    if (resultado.success) {
      alert('✅ Excel exportado com sucesso!');
    } else {
      alert('❌ Erro ao exportar Excel: ' + resultado.error);
    }
  };

  const formatarPeriodo = () => {
    if (tipoPeriodo === 'mes') {
      return `${meses[mes]}/${ano}`;
    } else {
      return `${new Date(dataInicio).toLocaleDateString('pt-BR')} até ${new Date(dataFim).toLocaleDateString('pt-BR')}`;
    }
  };

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
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#202124',
          marginBottom: '8px'
        }}>
          📊 RELATÓRIOS FINANCEIROS
        </h1>
        <div style={{
          height: '3px',
          width: '120px',
          background: 'linear-gradient(90deg, #1a73e8 0%, #34a853 100%)',
          borderRadius: '2px'
        }} />
      </div>

      {/* Filtros */}
      <div className="no-print" style={{
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
          ⚙️ CONFIGURAR RELATÓRIO
        </h2>

        {/* Tipo de Período */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#5f6368',
            marginBottom: '8px'
          }}>
            Período:
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setTipoPeriodo('mes')}
              style={{
                padding: '10px 20px',
                backgroundColor: tipoPeriodo === 'mes' ? '#1a73e8' : '#f1f3f4',
                color: tipoPeriodo === 'mes' ? '#ffffff' : '#5f6368',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📅 Por Mês
            </button>
            <button
              onClick={() => setTipoPeriodo('customizado')}
              style={{
                padding: '10px 20px',
                backgroundColor: tipoPeriodo === 'customizado' ? '#1a73e8' : '#f1f3f4',
                color: tipoPeriodo === 'customizado' ? '#ffffff' : '#5f6368',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📆 Período Customizado
            </button>
          </div>
        </div>

        {/* Filtro por Mês */}
        {tipoPeriodo === 'mes' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#5f6368',
                marginBottom: '8px'
              }}>
                Mês:
              </label>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '1rem',
                  border: '2px solid #e8eaed',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff'
                }}
              >
                {meses.map((nomeMes, index) => (
                  <option key={index} value={index}>{nomeMes}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#5f6368',
                marginBottom: '8px'
              }}>
                Ano:
              </label>
              <input
                type="number"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '1rem',
                  border: '2px solid #e8eaed',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        )}

        {/* Filtro por Período Customizado */}
        {tipoPeriodo === 'customizado' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#5f6368',
                marginBottom: '8px'
              }}>
                Data Início:
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '1rem',
                  border: '2px solid #e8eaed',
                  borderRadius: '8px'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#5f6368',
                marginBottom: '8px'
              }}>
                Data Fim:
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '1rem',
                  border: '2px solid #e8eaed',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        )}

        {/* Tipo de Relatório */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#5f6368',
            marginBottom: '8px'
          }}>
            Tipo de Relatório:
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setTipoRelatorio('compilado')}
              style={{
                padding: '10px 20px',
                backgroundColor: tipoRelatorio === 'compilado' ? '#34a853' : '#f1f3f4',
                color: tipoRelatorio === 'compilado' ? '#ffffff' : '#5f6368',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📊 Compilado (Resumido)
            </button>
            <button
              onClick={() => setTipoRelatorio('detalhado')}
              style={{
                padding: '10px 20px',
                backgroundColor: tipoRelatorio === 'detalhado' ? '#34a853' : '#f1f3f4',
                color: tipoRelatorio === 'detalhado' ? '#ffffff' : '#5f6368',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📋 Detalhado (Completo)
            </button>
          </div>
        </div>

        {/* Botão Gerar */}
        <button
          onClick={handleGerarRelatorio}
          disabled={carregando}
          style={{
            padding: '12px 32px',
            backgroundColor: '#1a73e8',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: carregando ? 'not-allowed' : 'pointer',
            opacity: carregando ? 0.6 : 1
          }}
        >
          {carregando ? '⏳ Gerando...' : '🔍 Gerar Relatório'}
        </button>
      </div>

      {/* Ações (Imprimir, PDF, Excel) */}
      {relatorio && (
        <div className="no-print acoes-relatorio" style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '2px solid #e8eaed',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          
          <button
            onClick={handleExportarPDF}
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
            📄 Exportar PDF
          </button>
          <button
            onClick={handleExportarExcel}
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
            📊 Exportar Excel
          </button>
        </div>
      )}

      {/* Conteúdo do Relatório */}
      {relatorio && (
        <div id="relatorio-content" className="relatorio-container" style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '2px solid #e8eaed'
        }}>
          {/* Cabeçalho do Relatório */}
          <div style={{
            textAlign: 'center',
            borderBottom: '3px solid #1a73e8',
            paddingBottom: '20px',
            marginBottom: '30px'
          }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#202124',
              marginBottom: '8px'
            }}>
              {tipoRelatorio === 'compilado' ? '📊 RELATÓRIO COMPILADO' : '📋 RELATÓRIO DETALHADO'}
            </h1>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#5f6368',
              marginBottom: '8px'
            }}>
              {formatarPeriodo()}
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#5f6368'
            }}>
              Relatório gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>

          {/* RELATÓRIO COMPILADO */}
          {tipoRelatorio === 'compilado' && (
            <>
              {/* Entradas */}
              <div className="secao-relatorio" style={{ marginBottom: '30px' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#202124',
                  borderBottom: '2px solid #34a853',
                  paddingBottom: '8px',
                  marginBottom: '16px'
                }}>
                  📥 ENTRADAS DO MÊS
                </h3>
                <div style={{ paddingLeft: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>Dízimos</span>
                    <strong>{formatarMoeda(relatorio.entradas.porTipo.dizimos)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>Ofertas</span>
                    <strong>{formatarMoeda(relatorio.entradas.porTipo.ofertas)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>Santa Ceia</span>
                    <strong>{formatarMoeda(relatorio.entradas.porTipo.santaCeia)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>Outras Entradas</span>
                    <strong>{formatarMoeda(relatorio.entradas.porTipo.outros)}</strong>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderTop: '2px solid #e8eaed',
                    marginTop: '8px',
                    fontSize: '1.125rem'
                  }}>
                    <strong>TOTAL DE ENTRADAS</strong>
                    <strong style={{ color: '#34a853' }}>{formatarMoeda(relatorio.entradas.total)}</strong>
                  </div>
                </div>
              </div>

              {/* Rateio */}
              <div className="secao-relatorio" style={{ marginBottom: '30px' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#202124',
                  borderBottom: '2px solid #1a73e8',
                  paddingBottom: '8px',
                  marginBottom: '16px'
                }}>
                  📊 RATEIO DAS ENTRADAS
                </h3>
                <div style={{ paddingLeft: '20px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <strong>Para Central (60%)</strong>
                      <strong style={{ color: '#1a73e8' }}>{formatarMoeda(relatorio.rateio.central.total)}</strong>
                    </div>
                    <div style={{ paddingLeft: '20px', fontSize: '0.875rem', color: '#5f6368' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>• PIX</span>
                        <span>{formatarMoeda(relatorio.rateio.central.pix)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>• Dinheiro</span>
                        <span>{formatarMoeda(relatorio.rateio.central.dinheiro)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <strong>Fica Local (40%)</strong>
                      <strong style={{ color: '#34a853' }}>{formatarMoeda(relatorio.rateio.local.total)}</strong>
                    </div>
                    <div style={{ paddingLeft: '20px', fontSize: '0.875rem', color: '#5f6368' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>• PIX</span>
                        <span>{formatarMoeda(relatorio.rateio.local.pix)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>• Dinheiro</span>
                        <span>{formatarMoeda(relatorio.rateio.local.dinheiro)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <strong>Missões (Santa Ceia)</strong>
                    <strong style={{ color: '#fbbc04' }}>{formatarMoeda(relatorio.rateio.missoes)}</strong>
                  </div>
                </div>
              </div>

              {/* Despesas */}
              <div className="secao-relatorio" style={{ marginBottom: '30px' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#202124',
                  borderBottom: '2px solid #ea4335',
                  paddingBottom: '8px',
                  marginBottom: '16px'
                }}>
                  📤 DESPESAS DO MÊS
                </h3>
                <div style={{ paddingLeft: '20px' }}>
                  {Object.entries(relatorio.despesas.porCategoria).map(([categoria, valor]) => (
                    <div key={categoria} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span>{categoria}</span>
                      <strong>{formatarMoeda(valor)}</strong>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderTop: '2px solid #e8eaed',
                    marginTop: '8px',
                    fontSize: '1.125rem'
                  }}>
                    <strong>TOTAL DE DESPESAS</strong>
                    <strong style={{ color: '#ea4335' }}>{formatarMoeda(relatorio.despesas.total)}</strong>
                  </div>
                </div>
              </div>

              {/* Resumo Final */}
              <div className="secao-relatorio" style={{
                backgroundColor: '#f1f3f4',
                borderRadius: '12px',
                padding: '20px',
                border: '2px solid #e8eaed'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#202124',
                  marginBottom: '16px'
                }}>
                  💰 RESUMO FINANCEIRO
                </h3>
                <div style={{ paddingLeft: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '1.125rem' }}>
                    <span>Entrada Local</span>
                    <strong style={{ color: '#34a853' }}>{formatarMoeda(relatorio.rateio.local.total)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '1.125rem' }}>
                    <span>(-) Despesas</span>
                    <strong style={{ color: '#ea4335' }}>{formatarMoeda(relatorio.despesas.total)}</strong>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '16px 0',
                    borderTop: '3px solid #202124',
                    marginTop: '12px',
                    fontSize: '1.5rem'
                  }}>
                    <strong>SALDO DO MÊS</strong>
                    <strong style={{ color: relatorio.resumo.saldoMes >= 0 ? '#34a853' : '#ea4335' }}>
                      {formatarMoeda(relatorio.resumo.saldoMes)} {relatorio.resumo.saldoMes >= 0 ? '✅' : '⚠️'}
                    </strong>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* RELATÓRIO DETALHADO */}
          {tipoRelatorio === 'detalhado' && (
            <>
              {/* Entradas Detalhadas */}
              <div className="secao-relatorio" style={{ marginBottom: '30px' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#202124',
                  borderBottom: '2px solid #34a853',
                  paddingBottom: '8px',
                  marginBottom: '16px'
                }}>
                  📥 ENTRADAS DO MÊS (Lista Completa)
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f3f4' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e8eaed' }}>Data</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e8eaed' }}>Tipo</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e8eaed' }}>Membro</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e8eaed' }}>Forma</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e8eaed' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
  {relatorio.entradas.lista && relatorio.entradas.lista.length > 0 ? (
    relatorio.entradas.lista.map((entrada, index) => (
      <tr key={index} style={{ borderBottom: '1px solid #e8eaed' }}>
        <td style={{ padding: '12px' }}>
          {entrada.data instanceof Date ? 
            entrada.data.toLocaleDateString('pt-BR') : 
            new Date(entrada.data).toLocaleDateString('pt-BR')}
        </td>
        <td style={{ padding: '12px', textTransform: 'capitalize' }}>
          {entrada.tipo || '-'}
        </td>
        <td style={{ padding: '12px' }}>
  {entrada.membroNome || entrada.membro?.nome || entrada.membro || '-'}
</td>
        <td style={{ padding: '12px', textTransform: 'capitalize' }}>
          {entrada.formaRecebimento || 'PIX'}
        </td>
        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
          {formatarMoeda(entrada.valor)}
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#5f6368' }}>
        Nenhuma entrada encontrada no período
      </td>
    </tr>
  )}
                      <tr style={{ backgroundColor: '#f1f3f4', fontWeight: '700' }}>
                        <td colSpan="4" style={{ padding: '12px', textAlign: 'right' }}>TOTAL:</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#34a853' }}>
                          {formatarMoeda(relatorio.entradas.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Despesas Detalhadas */}
              <div className="secao-relatorio" style={{ marginBottom: '30px' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#202124',
                  borderBottom: '2px solid #ea4335',
                  paddingBottom: '8px',
                  marginBottom: '16px'
                }}>
                  📤 DESPESAS DO MÊS (Lista Completa)
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f3f4' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e8eaed' }}>Data Pagamento</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e8eaed' }}>Descrição</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e8eaed' }}>Categoria</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e8eaed' }}>Forma Pagto</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e8eaed' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorio.despesas.lista.map((despesa, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e8eaed' }}>
                          <td style={{ padding: '12px' }}>
                            {despesa.dataPagamento instanceof Date ? 
                              despesa.dataPagamento.toLocaleDateString('pt-BR') : 
                              new Date(despesa.dataPagamento).toLocaleDateString('pt-BR')}
                          </td>
                          <td style={{ padding: '12px' }}>{despesa.descricao}</td>
                          <td style={{ padding: '12px' }}>{despesa.categoria || 'Sem categoria'}</td>
                          <td style={{ padding: '12px' }}>{despesa.formaPagamento || '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                            {formatarMoeda(despesa.valor)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#f1f3f4', fontWeight: '700' }}>
                        <td colSpan="4" style={{ padding: '12px', textAlign: 'right' }}>TOTAL:</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#ea4335' }}>
                          {formatarMoeda(relatorio.despesas.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumo Final */}
              <div className="secao-relatorio" style={{
                backgroundColor: '#f1f3f4',
                borderRadius: '12px',
                padding: '20px',
                border: '2px solid #e8eaed'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#202124',
                  marginBottom: '16px'
                }}>
                  💰 RESUMO FINAL
                </h3>
                <div style={{ paddingLeft: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '1.125rem' }}>
                    <span>Total de Entradas</span>
                    <strong style={{ color: '#34a853' }}>{formatarMoeda(relatorio.entradas.total)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '1.125rem' }}>
                    <span>Total de Despesas</span>
                    <strong style={{ color: '#ea4335' }}>{formatarMoeda(relatorio.despesas.total)}</strong>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '16px 0',
                    borderTop: '3px solid #202124',
                    marginTop: '12px',
                    fontSize: '1.5rem'
                  }}>
                    <strong>Saldo do Mês</strong>
                    <strong style={{ color: relatorio.resumo.saldoMes >= 0 ? '#34a853' : '#ea4335' }}>
                      {formatarMoeda(relatorio.resumo.saldoMes)} {relatorio.resumo.saldoMes >= 0 ? '✅' : '⚠️'}
                    </strong>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Relatorios;