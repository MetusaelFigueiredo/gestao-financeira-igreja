import React, { useState, useEffect } from 'react';
import { 
  buscarEventos, 
  atualizarStatusEvento, 
  enviarParaAnalise,
  aprovarEvento,
  reprovarEvento,
  buscarEntradasDoEvento,
  STATUS_EVENTO 
} from '../services/eventos';
import { buscarEntradas } from '../services/entradas';
import { formatarMoeda } from '../utils/formatacao';
import { ehPastor, ehMaster } from '../services/usuarios';
import ModalAprovacao from './ModalAprovacao';
import ModalDetalhesEvento from './ModalDetalhesEvento';

function ListaEventos({ onEventoSelecionado, eventoSelecionado, usuarioPerfil }) {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoAcao, setProcessandoAcao] = useState(null);
  
  // Estados para o modal de aprovação
  const [modalAprovacao, setModalAprovacao] = useState(null);
  const [entradasModal, setEntradasModal] = useState([]);
  const [carregandoModal, setCarregandoModal] = useState(false);
  
  // Estados para modal de detalhes
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [entradasDetalhes, setEntradasDetalhes] = useState([]);

  useEffect(() => {
    carregarEventos();
  }, []);

  const carregarEventos = async () => {
    setCarregando(true);
    const resultado = await buscarEventos();
    
    if (resultado.success) {
      setEventos(resultado.eventos);
    }
    

    
    setCarregando(false);
  };

  const obterCorStatus = (status) => {
    const cores = {
      [STATUS_EVENTO.ABERTO]: '#34a853',       // Verde
      [STATUS_EVENTO.EM_ANALISE]: '#fbbc04',   // Amarelo
      [STATUS_EVENTO.FECHADO]: '#ea4335'       // Vermelho
    };
    return cores[status] || '#5f6368';
  };

  const obterTextoStatus = (status) => {
    const textos = {
      [STATUS_EVENTO.ABERTO]: '🟢 Aberto',
      [STATUS_EVENTO.EM_ANALISE]: '🟡 Em Análise',
      [STATUS_EVENTO.FECHADO]: '🔴 Fechado'
    };
    return textos[status] || status;
  };

  const confirmarEnvioParaAnalise = async (evento) => {
    const confirmacao = window.confirm(
      `Deseja enviar o evento "${evento.nomeEvento}" para análise?\n\n` +
      `⚠️ O evento será bloqueado para novos lançamentos até a aprovação do pastor.`
    );

    if (confirmacao) {
      setProcessandoAcao(evento.id);
      
      try {
        const resultado = await enviarParaAnalise(evento.id, usuarioPerfil?.uid);
        
        if (resultado.success) {
          alert('✅ Evento enviado para análise!\n🔍 O pastor receberá a solicitação para aprovação.');
          carregarEventos();
        } else {
          alert('❌ Erro ao enviar para análise: ' + resultado.error);
        }
      } catch (error) {
        console.error('Erro ao enviar para análise:', error);
        alert('❌ Erro inesperado ao enviar para análise');
      } finally {
        setProcessandoAcao(null);
      }
    }
  };

  const confirmarAprovacao = async (evento) => {
    setProcessandoAcao(evento.id);
    
    try {
      // Buscar lançamentos do evento
      const resultadoEntradas = await buscarEntradasDoEvento(evento.id);
      const entradas = resultadoEntradas.success ? resultadoEntradas.entradas : [];
      
      // Abrir modal
      setEntradasModal(entradas);
      setModalAprovacao({ evento, tipo: 'aprovar' });
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
      alert('❌ Erro ao carregar dados do evento');
    } finally {
      setProcessandoAcao(null);
    }
  };

  const confirmarReprovacao = async (evento) => {
    setProcessandoAcao(evento.id);
    
    try {
      // Buscar lançamentos do evento
      const resultadoEntradas = await buscarEntradasDoEvento(evento.id);
      const entradas = resultadoEntradas.success ? resultadoEntradas.entradas : [];
      
      // Abrir modal
      setEntradasModal(entradas);
      setModalAprovacao({ evento, tipo: 'reprovar' });
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
      alert('❌ Erro ao carregar dados do evento');
    } finally {
      setProcessandoAcao(null);
    }
  };

  const reabrirEvento = async (evento) => {
    const confirmacao = window.confirm(
      `🔐 MASTER: Deseja reabrir o evento "${evento.nomeEvento}"?\n\n` +
      `✅ O evento voltará a aceitar novas entradas.\n` +
      `⚠️ Esta ação deve ser usada apenas em casos excepcionais.`
    );

    if (confirmacao) {
      setProcessandoAcao(evento.id);
      
      try {
        const resultado = await atualizarStatusEvento(evento.id, STATUS_EVENTO.ABERTO);
        
        if (resultado.success) {
          alert('✅ Evento reaberto com sucesso!');
          carregarEventos();
        } else {
          alert('❌ Erro ao reabrir evento: ' + resultado.error);
        }
      } catch (error) {
        console.error('Erro ao reabrir evento:', error);
        alert('❌ Erro inesperado ao reabrir evento');
      } finally {
        setProcessandoAcao(null);
      }
    }
  };

  const handleConfirmarModal = async () => {
    if (!modalAprovacao) return;
    
    setCarregandoModal(true);
    
    try {
      if (modalAprovacao.tipo === 'aprovar') {
        const resultado = await aprovarEvento(modalAprovacao.evento.id, usuarioPerfil?.uid);
        
        if (resultado.success) {
          alert('✅ Evento aprovado e fechado com sucesso!');
          carregarEventos();
          setModalAprovacao(null);
        } else {
          alert('❌ Erro ao aprovar evento: ' + resultado.error);
        }
      } else {
        // Para reprovação, pedir motivo
        const motivo = prompt('Digite o motivo da reprovação (opcional):');
        
        if (motivo !== null) {
          const resultado = await reprovarEvento(modalAprovacao.evento.id, usuarioPerfil?.uid, motivo);
          
          if (resultado.success) {
            alert('✅ Evento reprovado e reaberto para edição!');
            carregarEventos();
            setModalAprovacao(null);
          } else {
            alert('❌ Erro ao reprovar evento: ' + resultado.error);
          }
        }
      }
    } catch (error) {
      console.error('Erro na ação do modal:', error);
      alert('❌ Erro inesperado');
    } finally {
      setCarregandoModal(false);
    }
  };

  const handleCancelarModal = () => {
    setModalAprovacao(null);
    setEntradasModal([]);
  };

  const abrirDetalhesEvento = async (evento) => {
    console.log('🔍 Abrindo detalhes para o evento:', {
      id: evento.id,
      nome: evento.nomeEvento,
      objetoCompleto: evento
    });
    
    try {
      // Buscar lançamentos do evento usando o ID
      const resultadoEntradas = await buscarEntradasDoEvento(evento.id);
      
      console.log('📋 Resultado da busca de entradas:', resultadoEntradas);
      
      const entradas = resultadoEntradas.success ? resultadoEntradas.entradas : [];
      
      console.log('💰 Detalhes das entradas encontradas:', {
        total: entradas.length,
        entradas: entradas,
        eventoId: evento.id
      });
      
      // Se não encontrou entradas, vamos tentar buscar todas as entradas para debug
      if (entradas.length === 0) {
        console.warn('⚠️ Nenhuma entrada encontrada. Fazendo busca de debug...');
        // Importar e usar buscarEntradas para ver todas as entradas
        import('../services/entradas').then(async (entradasService) => {
          const todasEntradas = await entradasService.buscarEntradas();
          console.log('🔍 Todas as entradas no sistema:', todasEntradas);
          
          if (todasEntradas.success) {
            const entradasComEvento = todasEntradas.entradas.filter(e => e.eventoId);
            console.log('📊 Entradas que têm eventoId:', entradasComEvento);
          }
        });
      }
      
      // Definir estados específicos para o modal de detalhes
      setEntradasDetalhes(entradas);
      setModalDetalhes(evento);
      
    } catch (error) {
      console.error('❌ Erro ao buscar entradas para detalhes:', error);
      alert('❌ Erro ao carregar lançamentos do evento');
    }
  };

  const fecharDetalhes = () => {
    setModalDetalhes(null);
    setEntradasDetalhes([]);
  };

  if (carregando) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#5f6368'
      }}>
        Carregando eventos...
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e8eaed'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
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
          📋 Eventos Criados
        </h3>
        <span style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          backgroundColor: '#f1f3f4',
          padding: '4px 12px',
          borderRadius: '12px',
          fontWeight: '500'
        }}>
          {eventos.length} evento{eventos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {eventos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#5f6368'
        }}>
          Nenhum evento criado ainda.
        </div>
      ) : (
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
                  🎯 Nome do Evento
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                  📊 Status
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                  📈 Entradas
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                  💰 Total
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                  ⚙️ Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento, index) => (
                <tr 
                  key={evento.id} 
                  style={{
                    backgroundColor: eventoSelecionado?.id === evento.id ? '#e8f0fe' : (index % 2 === 0 ? '#ffffff' : '#f8f9fa'),
                    cursor: 'pointer'
                  }}
                  onClick={() => onEventoSelecionado && onEventoSelecionado(evento)}
                >
                  <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed' }}>
                    {evento.dataEvento ? evento.dataEvento.toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed' }}>
                    <div style={{ fontWeight: '500' }}>
                      {evento.nomeEvento}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#5f6368', marginTop: '2px' }}>
                      Criado em {evento.criadoEm ? evento.criadoEm.toLocaleDateString('pt-BR') : '-'}
                    </div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: `${obterCorStatus(evento.status)}15`,
                      color: obterCorStatus(evento.status)
                    }}>
                      {obterTextoStatus(evento.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed', textAlign: 'center' }}>
                    {evento.totalEntradas || 0}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    borderBottom: '1px solid #e8eaed',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#34a853'
                  }}>
                    {formatarMoeda(evento.valorTotal || 0)}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      
                      {/* Botão: Enviar para Análise - Para eventos ABERTOS */}
                      {evento.status === STATUS_EVENTO.ABERTO && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmarEnvioParaAnalise(evento);
                          }}
                          disabled={processandoAcao === evento.id}
                          title="Enviar para Análise"
                          style={{
                            padding: '6px 8px',
                            backgroundColor: processandoAcao === evento.id ? '#9aa0a6' : '#fbbc04',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: processandoAcao === evento.id ? 'not-allowed' : 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          {processandoAcao === evento.id ? '⏳' : '📋'}
                        </button>
                      )}

                      {/* Botões para Pastores/Masters: Detalhes, Aprovar, Reprovar eventos EM ANÁLISE */}
                      {evento.status === STATUS_EVENTO.EM_ANALISE && ehPastor(usuarioPerfil?.perfil) && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirDetalhesEvento(evento);
                            }}
                            disabled={processandoAcao === evento.id}
                            title="Ver Detalhes do Evento"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: processandoAcao === evento.id ? '#9aa0a6' : '#1a73e8',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: processandoAcao === evento.id ? 'not-allowed' : 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {processandoAcao === evento.id ? '⏳' : '🔍'}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmarAprovacao(evento);
                            }}
                            disabled={processandoAcao === evento.id}
                            title="Aprovar Evento"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: processandoAcao === evento.id ? '#9aa0a6' : '#34a853',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: processandoAcao === evento.id ? 'not-allowed' : 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {processandoAcao === evento.id ? '⏳' : '✅'}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmarReprovacao(evento);
                            }}
                            disabled={processandoAcao === evento.id}
                            title="Reprovar Evento"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: processandoAcao === evento.id ? '#9aa0a6' : '#ea4335',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: processandoAcao === evento.id ? 'not-allowed' : 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {processandoAcao === evento.id ? '⏳' : '❌'}
                          </button>
                        </>
                      )}

                      {/* Botão Master: Reabrir eventos FECHADOS */}
                      {evento.status === STATUS_EVENTO.FECHADO && ehMaster(usuarioPerfil?.perfil) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            reabrirEvento(evento);
                          }}
                          disabled={processandoAcao === evento.id}
                          title="Reabrir Evento (Master)"
                          style={{
                            padding: '6px 8px',
                            backgroundColor: processandoAcao === evento.id ? '#9aa0a6' : '#9334e6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: processandoAcao === evento.id ? 'not-allowed' : 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          {processandoAcao === evento.id ? '⏳' : '🔓'}
                        </button>
                      )}

                      {/* Mostrar apenas status para eventos sem ações disponíveis */}
                      {(evento.status === STATUS_EVENTO.EM_ANALISE && !ehPastor(usuarioPerfil?.perfil)) ||
                       (evento.status === STATUS_EVENTO.FECHADO && !ehMaster(usuarioPerfil?.perfil)) ? (
                        <span style={{
                          padding: '6px 8px',
                          fontSize: '0.75rem',
                          color: '#5f6368',
                          fontStyle: 'italic'
                        }}>
                          {evento.status === STATUS_EVENTO.EM_ANALISE ? 'Aguardando Pastor' : 'Finalizado'}
                        </span>
                      ) : null}
                      
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Aprovação Profissional */}
      {modalAprovacao && (
        <ModalAprovacao
          evento={modalAprovacao.evento}
          entradas={entradasModal}
          tipo={modalAprovacao.tipo}
          onConfirmar={handleConfirmarModal}
          onCancelar={handleCancelarModal}
          carregando={carregandoModal}
        />
      )}

      {modalDetalhes && (
        <ModalDetalhesEvento
          evento={modalDetalhes}
          entradas={entradasDetalhes}
          onFechar={fecharDetalhes}
        />
      )}
    </div>
  );
}

export default ListaEventos;