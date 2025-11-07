import React, { useState, useEffect } from 'react';
import { buscarEntradasDoEvento, aprovarEvento, reprovarEvento } from '../services/eventos';
import { formatarMoeda } from '../utils/formatacao';

function ConferenciaEvento({ evento, usuarioPerfil, onClose, onAcaoCompleta }) {
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  useEffect(() => {
    if (evento) {
      carregarEntradasDoEvento();
    }
  }, [evento]);

  const carregarEntradasDoEvento = async () => {
    setCarregando(true);
    const resultado = await buscarEntradasDoEvento(evento.id);
    
    if (resultado.success) {
      setEntradas(resultado.entradas);
    }
    
    setCarregando(false);
  };

  const handleAprovar = async () => {
    const confirmacao = window.confirm(
      `✅ APROVAR o evento "${evento.nomeEvento}"?\n\n` +
      `O evento será fechado e não poderá mais ser editado.\n` +
      `Total de entradas: ${entradas.length}\n` +
      `Valor total: ${formatarMoeda(calcularTotalEntradas())}`
    );

    if (confirmacao) {
      setProcessandoAcao(true);
      
      try {
        const resultado = await aprovarEvento(evento.id, usuarioPerfil?.uid);
        
        if (resultado.success) {
          alert('✅ Evento aprovado com sucesso!');
          onAcaoCompleta();
        } else {
          alert('❌ Erro ao aprovar evento: ' + resultado.error);
        }
      } catch (error) {
        console.error('Erro ao aprovar evento:', error);
        alert('❌ Erro inesperado ao aprovar evento');
      } finally {
        setProcessandoAcao(false);
      }
    }
  };

  const handleReprovar = async () => {
    const motivo = prompt(
      `❌ REPROVAR o evento "${evento.nomeEvento}"?\n\n` +
      `O evento voltará a aceitar lançamentos.\n\n` +
      `Digite o motivo da reprovação (opcional):`
    );

    if (motivo !== null) { // null = cancelou
      setProcessandoAcao(true);
      
      try {
        const resultado = await reprovarEvento(evento.id, usuarioPerfil?.uid, motivo);
        
        if (resultado.success) {
          alert('✅ Evento reprovado e reaberto para edição!');
          onAcaoCompleta();
        } else {
          alert('❌ Erro ao reprovar evento: ' + resultado.error);
        }
      } catch (error) {
        console.error('Erro ao reprovar evento:', error);
        alert('❌ Erro inesperado ao reprovar evento');
      } finally {
        setProcessandoAcao(false);
      }
    }
  };

  const calcularTotalEntradas = () => {
    return entradas.reduce((total, entrada) => total + (entrada.valor || 0), 0);
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return '-';
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleDateString('pt-BR');
  };

  if (!evento) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: '1px solid #e8eaed',
          paddingBottom: '16px'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#202124',
              margin: 0,
              marginBottom: '4px'
            }}>
              🔍 Conferência do Evento
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#5f6368',
              margin: 0
            }}>
              <strong>{evento.nomeEvento}</strong> • {formatarData(evento.dataEvento)}
            </p>
          </div>
          <button
            onClick={onClose}
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

        {/* Resumo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#137333', marginBottom: '4px' }}>
              Total de Entradas
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#137333' }}>
              {entradas.length}
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
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1565c0' }}>
              {formatarMoeda(calcularTotalEntradas())}
            </div>
          </div>
        </div>

        {/* Lista de Entradas */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#5f6368' }}>
            Carregando entradas...
          </div>
        ) : entradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#5f6368' }}>
            Nenhuma entrada encontrada para este evento.
          </div>
        ) : (
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#202124',
              marginBottom: '16px',
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
              maxHeight: '350px',
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
                        case 'dizimo': return '💝 DÍZIMO';
                        case 'oferta': return '🎁 OFERTA';
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
                              >
                                📎
                              </button>
                            )}
                            
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

        {/* Botões de Ação */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          borderTop: '1px solid #e8eaed',
          paddingTop: '20px'
        }}>
          <button
            onClick={handleReprovar}
            disabled={processandoAcao}
            style={{
              padding: '12px 24px',
              backgroundColor: processandoAcao ? '#9aa0a6' : '#ea4335',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: processandoAcao ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {processandoAcao ? '⏳' : '❌'} Reprovar
          </button>
          
          <button
            onClick={handleAprovar}
            disabled={processandoAcao}
            style={{
              padding: '12px 24px',
              backgroundColor: processandoAcao ? '#9aa0a6' : '#137333',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: processandoAcao ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {processandoAcao ? '⏳' : '✅'} Aprovar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConferenciaEvento;