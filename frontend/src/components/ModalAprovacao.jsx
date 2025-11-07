import React from 'react';
import { formatarMoeda } from '../utils/formatacao';

function ModalAprovacao({ 
  evento, 
  entradas, 
  tipo, // 'aprovar' ou 'reprovar'
  onConfirmar, 
  onCancelar, 
  carregando 
}) {
  if (!evento) return null;

  const totalEntradas = entradas?.length || 0;
  const valorTotal = entradas?.reduce((total, entrada) => total + (entrada.valor || 0), 0) || 0;

  const formatarData = (timestamp) => {
    if (!timestamp) return 'Data inválida';
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: `3px solid ${tipo === 'aprovar' ? '#137333' : '#ea4335'}`
      }}>
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '8px'
          }}>
            {tipo === 'aprovar' ? '✅' : '❌'}
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#202124',
            margin: 0,
            marginBottom: '8px'
          }}>
            {tipo === 'aprovar' ? 'Aprovar Evento' : 'Reprovar Evento'}
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#5f6368',
            margin: 0,
            fontWeight: '500'
          }}>
            "{evento.nomeEvento}"
          </p>
        </div>

        {/* Resumo */}
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#202124',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 Resumo Financeiro
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#137333', marginBottom: '4px' }}>
                Total de Lançamentos
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#137333' }}>
                {totalEntradas}
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#1565c0', marginBottom: '4px' }}>
                Valor Total
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1565c0' }}>
                {formatarMoeda(valorTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* Lançamentos */}
        {totalEntradas === 0 ? (
          <div style={{
            backgroundColor: '#fff3cd',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'center',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
            <p style={{
              fontSize: '1rem',
              color: '#856404',
              margin: 0,
              fontWeight: '500'
            }}>
              Nenhum lançamento encontrado para este evento
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#202124',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📋 TODAS AS ENTRADAS
              <span style={{
                fontSize: '0.875rem',
                color: '#5f6368',
                fontWeight: '400'
              }}>
                ({entradas.length} entrada{entradas.length !== 1 ? 's' : ''})
              </span>
            </h3>
            
            <div style={{
              overflowX: 'auto',
              border: '1px solid #e8eaed',
              borderRadius: '8px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      📅 Data
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      👤 Membro/Descrição
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
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      ⚙️ Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entradas.map((entrada, index) => {
                    const obterCorTipo = (tipo) => {
                      switch (tipo?.toLowerCase()) {
                        case 'dizimo': return '#2e7d32';
                        case 'oferta': return '#1565c0';
                        case 'missoes': return '#e65100';
                        case 'construcao': return '#7b1fa2';
                        default: return '#5f6368';
                      }
                    };

                    const obterNomeTipo = (tipo) => {
                      switch (tipo?.toLowerCase()) {
                        case 'dizimo': return ' DÍZIMO';
                        case 'oferta': return ' OFERTA';
                        case 'missoes': return '🌍 MISSÕES';
                        case 'construcao': return '🏗️ CONSTRUÇÃO';
                        default: return tipo?.toUpperCase() || 'N/A';
                      }
                    };

                    const obterIconeForma = (forma) => {
                      switch (forma?.toLowerCase()) {
                        case 'pix': return '📱 PIX';
                        case 'dinheiro': return '💵 DINHEIRO';
                        case 'cartao': return '💳 CARTÃO';
                        case 'transferencia': return '🏦 TRANSFERÊNCIA';
                        default: return '💳 ' + (forma?.toUpperCase() || 'N/A');
                      }
                    };

                    const verComprovante = (url) => {
                      if (url) {
                        window.open(url, '_blank');
                      }
                    };

                    return (
                      <tr key={entrada.id} style={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                      }}>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed' }}>
                          {formatarData(entrada.data)}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed', maxWidth: '200px' }}>
                          <div style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {entrada.tipo?.toLowerCase() === 'dizimo' 
                              ? (entrada.membroNome || 'Membro não informado')
                              : (entrada.descricao || 'Descrição não informada')
                            }
                          </div>
                          {/* Mostrar descrição adicional apenas para dízimos que têm membro E descrição */}
                          {entrada.tipo?.toLowerCase() === 'dizimo' && entrada.membroNome && entrada.descricao && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#5f6368',
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap',
                              marginTop: '2px'
                            }}>
                              {entrada.descricao}
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
                            backgroundColor: `${obterCorTipo(entrada.tipo)}15`,
                            color: obterCorTipo(entrada.tipo)
                          }}>
                            {obterNomeTipo(entrada.tipo)}
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
                            backgroundColor: entrada.formaRecebimento?.toLowerCase() === 'pix' ? '#e3f2fd' : '#e8f5e8',
                            color: entrada.formaRecebimento?.toLowerCase() === 'pix' ? '#1565c0' : '#2e7d32'
                          }}>
                            {obterIconeForma(entrada.formaRecebimento)}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          borderBottom: '1px solid #e8eaed',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: '#34a853',
                          fontSize: '1rem'
                        }}>
                          {formatarMoeda(entrada.valor)}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          borderBottom: '1px solid #e8eaed',
                          textAlign: 'center'
                        }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            {/* Botão Ver Comprovante */}
                            {entrada.comprovanteUrl && (
                              <button
                                onClick={() => verComprovante(entrada.comprovanteUrl)}
                                title="Ver Comprovante"
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
                                📎
                              </button>
                            )}
                            
                            {/* Botão Ver Detalhes */}
                            <button
                              title="Ver Detalhes"
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
                              👁️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aviso */}
        <div style={{
          backgroundColor: tipo === 'aprovar' ? '#e8f5e8' : '#fce8e6',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          border: `1px solid ${tipo === 'aprovar' ? '#137333' : '#ea4335'}`
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: tipo === 'aprovar' ? '#137333' : '#d93025',
            margin: 0,
            fontWeight: '500',
            textAlign: 'center'
          }}>
            {tipo === 'aprovar' 
              ? '⚠️ O evento será fechado permanentemente e não poderá mais ser editado'
              : '⚠️ O evento voltará a aceitar novos lançamentos'
            }
          </p>
        </div>

        {/* Botões */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={onCancelar}
            disabled={carregando}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f1f3f4',
              color: '#5f6368',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: carregando ? 'not-allowed' : 'pointer',
              minWidth: '120px'
            }}
          >
            Cancelar
          </button>
          
          <button
            onClick={onConfirmar}
            disabled={carregando}
            style={{
              padding: '12px 24px',
              backgroundColor: carregando ? '#9aa0a6' : (tipo === 'aprovar' ? '#137333' : '#ea4335'),
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: carregando ? 'not-allowed' : 'pointer',
              minWidth: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {carregando ? (
              <>⏳ Processando...</>
            ) : (
              <>
                {tipo === 'aprovar' ? '✅ Aprovar' : '❌ Reprovar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalAprovacao;