import React from 'react';
import { formatarMoeda } from '../utils/formatacao';

function ModalDetalhesEvento({ evento, entradas, onFechar }) {
  if (!evento) return null;

  const totalEntradas = entradas?.length || 0;
  const valorTotal = entradas?.reduce((total, entrada) => total + (entrada.valor || 0), 0) || 0;

  const formatarData = (timestamp) => {
    if (!timestamp) return 'Data inválida';
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleDateString('pt-BR');
  };

  const formatarDataHora = (timestamp) => {
    if (!timestamp) return 'Data inválida';
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleString('pt-BR');
  };

  const obterStatusColor = (status) => {
    switch (status) {
      case 'aberto': return '#34a853';
      case 'analise': return '#fbbc04';
      case 'fechado': return '#ea4335';
      default: return '#5f6368';
    }
  };

  const obterStatusTexto = (status) => {
    switch (status) {
      case 'aberto': return '🟢 Aberto';
      case 'analise': return '🟡 Em Análise';
      case 'fechado': return '🔴 Fechado';
      default: return status;
    }
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
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '3px solid #1a73e8'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          borderBottom: '2px solid #e8eaed',
          paddingBottom: '16px'
        }}>
          <div>
            <div style={{
              fontSize: '2rem',
              marginBottom: '8px'
            }}>
              🔍
            </div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '600',
              color: '#202124',
              margin: 0,
              marginBottom: '8px'
            }}>
              Detalhes do Evento
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#1a73e8',
              margin: 0,
              fontWeight: '600'
            }}>
              {evento.nomeEvento}
            </p>
          </div>
          <button
            onClick={onFechar}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f3f4'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Informações do Evento */}
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #e8eaed'
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
            📅 Informações Gerais do Evento
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e8eaed'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#5f6368', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📅 Data do Evento
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#202124' }}>
                {formatarData(evento.dataEvento)}
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e8eaed'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#5f6368', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🔄 Status Atual
              </div>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: obterStatusColor(evento.status)
              }}>
                {obterStatusTexto(evento.status)}
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e8eaed'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#5f6368', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📝 Criado em
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#202124' }}>
                {formatarDataHora(evento.criadoEm)}
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e8eaed'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#5f6368', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                👤 Criado por
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#202124' }}>
                {evento.criadoPor || 'N/A'}
              </div>
            </div>

            {evento.enviadoParaAnaliseEm && (
              <div style={{
                backgroundColor: '#fff8e1',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ffcc02'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#e65100', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📤 Enviado para Análise
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#e65100' }}>
                  {formatarDataHora(evento.enviadoParaAnaliseEm)}
                </div>
              </div>
            )}

            {evento.reprovadoEm && (
              <div style={{
                backgroundColor: '#ffebee',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #f44336'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#c62828', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ❌ Reprovado em
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#c62828' }}>
                  {formatarDataHora(evento.reprovadoEm)}
                </div>
                {evento.motivoReprovacao && (
                  <div style={{ fontSize: '0.875rem', color: '#c62828', marginTop: '4px', fontStyle: 'italic' }}>
                    Motivo: {evento.motivoReprovacao}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: '#e8f5e8',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#137333', marginBottom: '8px' }}>
              Total de Lançamentos
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#137333' }}>
              {totalEntradas}
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#e3f2fd',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#1565c0', marginBottom: '8px' }}>
              Valor Total Arrecadado
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1565c0' }}>
              {formatarMoeda(valorTotal)}
            </div>
          </div>
        </div>

        {/* Lista Completa de Lançamentos */}
        {totalEntradas === 0 ? (
          <div style={{
            backgroundColor: '#fff3cd',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
            <h3 style={{ fontSize: '1.25rem', color: '#856404', margin: '0 0 8px 0' }}>
              Nenhum Lançamento Encontrado
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#856404',
              margin: '0 0 16px 0'
            }}>
              Este evento ainda não possui lançamentos financeiros vinculados.
            </p>
            <div style={{
              fontSize: '0.875rem',
              color: '#856404',
              backgroundColor: '#fcf4dd',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <strong>Informações de Debug:</strong><br/>
              • ID do Evento: {evento.id}<br/>
              • Nome do Evento: {evento.nomeEvento}<br/>
              • Verifique no console (F12) se há lançamentos no sistema<br/>
              • Lançamentos devem ter o campo 'eventoId' igual ao ID acima
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#202124',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💰 Histórico Completo de Lançamentos
              </h3>
              <div style={{
                fontSize: '0.875rem',
                color: '#5f6368',
                backgroundColor: '#e8f0fe',
                padding: '4px 12px',
                borderRadius: '20px',
                fontWeight: '500'
              }}>
                {totalEntradas} {totalEntradas === 1 ? 'lançamento' : 'lançamentos'}
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e8eaed', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                      📅 Data
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                      👤 Membro/Descrição
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>
                      🏷️ Tipo
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>
                      💳 Forma
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'right', fontWeight: '600', fontSize: '0.875rem' }}>
                      💰 Valor
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>
                      ⚙️ Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entradas?.map((entrada, index) => {
                    const obterIconeForma = (forma) => {
                      switch (forma?.toLowerCase()) {
                        case 'pix': return '📱';
                        case 'dinheiro': return '💵';
                        case 'cartao': return '💳';
                        case 'transferencia': return '🏦';
                        default: return '💳';
                      }
                    };

                    const obterIconeTipo = (tipo) => {
                      switch (tipo?.toLowerCase()) {
                        case 'dizimo': return '';
                        case 'oferta': return '';
                        case 'missoes': return '🌍';
                        case 'construcao': return '🏗️';
                        default: return '💰';
                      }
                    };

                    return (
                      <tr key={entrada.id || index} style={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                        borderBottom: '1px solid #e8eaed'
                      }}>
                        <td style={{ 
                          padding: '16px 12px', 
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {formatarData(entrada.data)}
                        </td>
                        
                        <td style={{ 
                          padding: '16px 12px', 
                          fontSize: '0.875rem'
                        }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: '#202124',
                            marginBottom: '4px'
                          }}>
                            {entrada.tipo === 'dizimo' && entrada.membroNome 
                              ? entrada.membroNome
                              : entrada.descricao || 'Sem descrição'
                            }
                          </div>
                          {entrada.tipo === 'dizimo' && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#5f6368',
                              fontStyle: 'italic'
                            }}>
                              Dízimo
                            </div>
                          )}
                          {entrada.observacao && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#5f6368', 
                              marginTop: '2px',
                              fontStyle: 'italic'
                            }}>
                              {entrada.observacao}
                            </div>
                          )}
                        </td>

                        <td style={{ 
                          padding: '16px 12px', 
                          textAlign: 'center',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: entrada.tipo === 'dizimo' ? '#e8f5e8' : 
                                            entrada.tipo === 'oferta' ? '#e3f2fd' : 
                                            entrada.tipo === 'missoes' ? '#fff3e0' : '#f3e5f5',
                            color: entrada.tipo === 'dizimo' ? '#137333' : 
                                  entrada.tipo === 'oferta' ? '#1565c0' : 
                                  entrada.tipo === 'missoes' ? '#e65100' : '#7b1fa2',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {obterIconeTipo(entrada.tipo)}
                            {entrada.tipo || 'N/A'}
                          </div>
                        </td>

                        <td style={{ 
                          padding: '16px 12px', 
                          textAlign: 'center',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#f1f3f4',
                            color: '#5f6368',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {obterIconeForma(entrada.formaRecebimento)}
                            {entrada.formaRecebimento || 'N/A'}
                          </div>
                        </td>

                        <td style={{ 
                          padding: '16px 12px', 
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#137333',
                          fontSize: '1rem'
                        }}>
                          {formatarMoeda(entrada.valor || 0)}
                        </td>

                        <td style={{ 
                          padding: '16px 12px', 
                          textAlign: 'center',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            justifyContent: 'center'
                          }}>
                            <button
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#e3f2fd',
                                border: '1px solid #1976d2',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                color: '#1976d2'
                              }}
                              title="Ver detalhes"
                            >
                              👁️
                            </button>
                            {entrada.comprovanteUrl && (
                              <button
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#e8f5e8',
                                  border: '1px solid #2e7d32',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  color: '#2e7d32'
                                }}
                                title="Ver comprovante"
                                onClick={() => window.open(entrada.comprovanteUrl, '_blank')}
                              >
                                📄
                              </button>
                            )}
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

        {/* Botão Fechar */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          borderTop: '1px solid #e8eaed',
          paddingTop: '20px'
        }}>
          <button
            onClick={onFechar}
            style={{
              padding: '12px 32px',
              backgroundColor: '#1a73e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalDetalhesEvento;