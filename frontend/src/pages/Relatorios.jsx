import React, { useState } from 'react';
import { gerarRelatorioMes, buscarDadosRelatorio, formatarRelatorioParaExcel } from '../services/relatorios';
import { exportarParaPDF, exportarParaExcel, imprimirRelatorio, exportarPDFCompilado, exportarPDFDetalhado } from '../utils/exportacao';
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
      return `${meses[mes].toUpperCase()} ${ano}`;
    } else {
      return `${new Date(dataInicio).toLocaleDateString('pt-BR')} - ${new Date(dataFim).toLocaleDateString('pt-BR')}`;
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        
        {/* Configurar Relatório */}
        <div className="no-print configurar-relatorio" style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '2px solid #e8eaed'
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
            📊 Configurar Relatório
          </h2>

          {/* Tipo de Período */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#202124',
              marginBottom: '12px'
            }}>
              Tipo de Período
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: tipoPeriodo === 'mes' ? '#e8f0fe' : '#f8f9fa',
                border: `2px solid ${tipoPeriodo === 'mes' ? '#1a73e8' : '#e8eaed'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                <input
                  type="radio"
                  value="mes"
                  checked={tipoPeriodo === 'mes'}
                  onChange={(e) => setTipoPeriodo(e.target.value)}
                />
                📅 Por Mês
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: tipoPeriodo === 'customizado' ? '#e8f0fe' : '#f8f9fa',
                border: `2px solid ${tipoPeriodo === 'customizado' ? '#1a73e8' : '#e8eaed'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                <input
                  type="radio"
                  value="customizado"
                  checked={tipoPeriodo === 'customizado'}
                  onChange={(e) => setTipoPeriodo(e.target.value)}
                />
                📊 Período Customizado
              </label>
            </div>
          </div>

          {/* Seleção por Mês */}
          {tipoPeriodo === 'mes' && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#202124',
                  marginBottom: '8px'
                }}>
                  Mês
                </label>
                <select
                  value={mes}
                  onChange={(e) => setMes(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e8eaed',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  {meses.map((mesNome, index) => (
                    <option key={index} value={index}>{mesNome}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#202124',
                  marginBottom: '8px'
                }}>
                  Ano
                </label>
                <input
                  type="number"
                  value={ano}
                  onChange={(e) => setAno(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e8eaed',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                />
              </div>
            </div>
          )}

          {/* Seleção por Período Customizado */}
          {tipoPeriodo === 'customizado' && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#202124',
                  marginBottom: '8px'
                }}>
                  Data de Início
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e8eaed',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#202124',
                  marginBottom: '8px'
                }}>
                  Data de Fim
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e8eaed',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                />
              </div>
            </div>
          )}

          {/* Botão Gerar Relatório */}
          <button
            onClick={handleGerarRelatorio}
            disabled={carregando}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: carregando ? '#dadce0' : '#1a73e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: carregando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {carregando ? '⏳ Gerando Relatório...' : '📊 Gerar Relatório'}
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
              onClick={() => window.print()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ea4335',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#d93025'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ea4335'}
            >
              📄 Exportar PDF
            </button>
            <button
              onClick={handleExportarExcel}
              style={{
                padding: '12px 24px',
                backgroundColor: '#34a853',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2d8e47'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#34a853'}
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
            <div className="titulo-relatorio" style={{
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
                📊 RELATÓRIO FINANCEIRO - {formatarPeriodo()}
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: '#5f6368'
              }}>
                Relatório gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>

            {/* RELATÓRIO UNIFICADO */}
            <div className="resumos-container" style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
              
              {/* SEÇÃO 1: TOTAL DE ENTRADAS */}
              <div className="resumo-coluna" style={{ flex: 1 }}>
                <div className="titulo-secao" style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#333',
                  marginBottom: '15px',
                  padding: '12px',
                  backgroundColor: '#F0F8FF',
                  borderLeft: '4px solid #4285f4',
                  borderRadius: '4px'
                }}>
                  📥 TOTAL DE ENTRADAS
                </div>
                <div style={{ paddingLeft: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <strong>Total:</strong>
                    <strong className="valor-monetario" style={{ color: '#34a853' }}>{formatarMoeda(relatorio.entradas.total)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>PIX:</span>
                    <span className="valor-monetario">{formatarMoeda((relatorio.rateio?.central?.pix || 0) + (relatorio.rateio?.local?.pix || 0))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>Dinheiro:</span>
                    <span className="valor-monetario">{formatarMoeda((relatorio.rateio?.central?.dinheiro || 0) + (relatorio.rateio?.local?.dinheiro || 0))}</span>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: DEMONSTRATIVO DE SALDOS E RATEIO */}
              <div className="resumo-coluna" style={{ flex: 1 }}>
                <div className="titulo-secao" style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#333',
                  marginBottom: '15px',
                  padding: '12px',
                  backgroundColor: '#F0F8FF',
                  borderLeft: '4px solid #4285f4',
                  borderRadius: '4px'
                }}>
                  📊 DEMONSTRATIVO DE SALDOS E RATEIO
                </div>
                <div style={{ paddingLeft: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 'bold' }}>
                    <span>Para Central:</span>
                    <span className="valor-monetario" style={{ color: '#1a73e8' }}>{formatarMoeda(relatorio.rateio?.central?.total || 0)}</span>
                  </div>
                  <div style={{ paddingLeft: '15px', fontSize: '0.9rem', color: '#666' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>• PIX Central:</span>
                      <span className="valor-monetario">{formatarMoeda(relatorio.rateio?.central?.pix || 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>• Dinheiro Central:</span>
                      <span className="valor-monetario">{formatarMoeda(relatorio.rateio?.central?.dinheiro || 0)}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 'bold', marginTop: '8px' }}>
                    <span>Fica Local:</span>
                    <span className="valor-monetario" style={{ color: '#34a853' }}>{formatarMoeda(relatorio.rateio?.local?.total || 0)}</span>
                  </div>
                  <div style={{ paddingLeft: '15px', fontSize: '0.9rem', color: '#666' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>• PIX Local:</span>
                      <span className="valor-monetario">{formatarMoeda(relatorio.rateio?.local?.pix || 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>• Dinheiro Local:</span>
                      <span className="valor-monetario">{formatarMoeda(relatorio.rateio?.local?.dinheiro || 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>• Despesas Pagas:</span>
                      <span className="valor-monetario" style={{ color: '#ea4335' }}>({formatarMoeda(relatorio.despesas?.total || 0)})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 'bold', borderTop: '1px solid #eee', marginTop: '4px', paddingTop: '8px' }}>
                      <span>• Saldo Local (Líquido):</span>
                      <span className="valor-monetario" style={{ color: (relatorio.rateio?.local?.total || 0) - (relatorio.despesas?.total || 0) >= 0 ? '#34a853' : '#ea4335' }}>
                        {formatarMoeda((relatorio.rateio?.local?.total || 0) - (relatorio.despesas?.total || 0))}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 'bold', marginTop: '8px' }}>
                    <span>Para Missões:</span>
                    <span className="valor-monetario" style={{ color: '#fbbc04' }}>{formatarMoeda(relatorio.rateio?.missoes || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TABELAS DETALHADAS LADO A LADO */}
            <div className="tabelas-detalhes" style={{ display: 'flex', gap: '30px', marginTop: '40px' }}>
              
              {/* TABELA DE ENTRADAS */}
              <div className="tabela-detalhes-coluna" style={{ flex: 1 }}>
                <div className="titulo-secao" style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#333',
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: '#F0F8FF',
                  borderLeft: '4px solid #4285f4',
                  borderRadius: '4px'
                }}>
                  📥 ENTRADAS DETALHADAS ({formatarPeriodo()})
                </div>
                
                <table className="tabela-relatorio" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#EBF5FB' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Data</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Tipo</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Descrição / Membro</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Forma</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', color: '#333' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.entradas?.lista?.map((entrada, index) => (
                      <tr key={entrada.id || index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#F9F9F9' }}>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', color: '#333' }}>
                          {entrada.data ? new Date(entrada.data).toLocaleDateString('pt-BR') : 'N/A'}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', color: '#333' }}>
                          {entrada.tipo ? entrada.tipo.replace('_', ' ').toUpperCase() : 'N/A'}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', color: '#333' }}>
                          {entrada.tipo === 'dizimo' 
                            ? (entrada.membroNome || 'Membro não identificado')
                            : (entrada.descricao || 'Sem descrição')
                          }
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', color: '#333' }}>
                          {entrada.formaRecebimento || 'PIX'}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', color: '#333', textAlign: 'right', fontWeight: '500' }}>
                          {formatarMoeda(entrada.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#F0F8FF', fontWeight: 'bold' }}>
                      <td colSpan="4" style={{ padding: '8px', border: '1px solid #ddd', color: '#333', textAlign: 'right' }}>
                        Valor Total das Entradas:
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', color: '#34a853', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatarMoeda(relatorio.entradas?.total || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* TABELA DE DESPESAS */}
              <div className="tabela-detalhes-coluna" style={{ flex: 1 }}>
                <div className="titulo-secao" style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#333',
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: '#F0F8FF',
                  borderLeft: '4px solid #4285f4',
                  borderRadius: '4px'
                }}>
                  📤 DESPESAS DETALHADAS ({formatarPeriodo()})
                </div>
                
                <table className="tabela-relatorio" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#EBF5FB' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Data</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Categoria</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Descrição</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Forma</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', color: '#333' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.despesas?.lista?.map((despesa, index) => (
                      <tr key={despesa.id || index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#F9F9F9' }}>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', color: '#333' }}>
                          {despesa.dataPagamento ? new Date(despesa.dataPagamento).toLocaleDateString('pt-BR') : 
                           (despesa.vencimento ? new Date(despesa.vencimento).toLocaleDateString('pt-BR') : 'N/A')}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', color: '#333' }}>
                          {despesa.categoria || 'Outros'}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', color: '#333' }}>
                          {despesa.descricao || 'Sem descrição'}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', color: '#333' }}>
                          {despesa.formaPagamento || 'Dinheiro'}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', color: '#333', textAlign: 'right', fontWeight: '500' }}>
                          {formatarMoeda(despesa.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#FFF5F5', fontWeight: 'bold' }}>
                      <td colSpan="4" style={{ padding: '8px', border: '1px solid #ddd', color: '#333', textAlign: 'right' }}>
                        Valor Total das Saídas:
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', color: '#ea4335', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatarMoeda(relatorio.despesas?.total || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Relatorios;