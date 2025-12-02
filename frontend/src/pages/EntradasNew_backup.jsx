import React, { useState, useEffect, useMemo, useCallback } from 'react';
import FormEntrada from '../components/FormEntrada';
import { 
  buscarLancamentosDoEvento,
  excluirEntrada,
  invalidarCacheEventosEntradas,
  invalidarCacheLancamentosEvento
} from '../services/entradas';
import { buscarEventos } from '../services/eventos';
import { formatarMoeda } from '../utils/formatacao';

function EntradasNew({ usuarioEmail }) {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [eventoExpandido, setEventoExpandido] = useState(null);
  const [lancamentos, setLancamentos] = useState({});
  const [carregandoLancamentos, setCarregandoLancamentos] = useState({});
  
  // Estados para paginaÃ§Ã£o e busca
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const itensPorPagina = 10;

  // Carregar eventos ao montar
  useEffect(() => {
    carregarEventos();
  }, []);

  const carregarEventos = async () => {
    setCarregando(true);
    const resultado = await buscarEventos();
    
    if (resultado.success) {
      console.log('âœ… Eventos carregados:', resultado.eventos.length);
      
      // Buscar lanÃ§amentos de cada evento para calcular totalizadores
      const eventosComTotais = await Promise.all(
        resultado.eventos.map(async (evento) => {
          const resultadoLancamentos = await buscarLancamentosDoEvento(evento.id);
          const entradas = resultadoLancamentos.success ? resultadoLancamentos.entradas : [];
          
          return {
            ...evento,
            totalEntradas: entradas.length,
            valorTotal: entradas.reduce((sum, e) => sum + (e.valor || 0), 0)
          };
        })
      );
      
      setEventos(eventosComTotais);
    } else {
      console.error('âŒ Erro ao carregar eventos:', resultado.error);
    }
    
    setCarregando(false);
  };

  // FunÃ§Ã£o para expandir/recolher detalhes de um evento
  const toggleDetalhesEvento = async (eventoId) => {
    // Se estÃ¡ expandido, recolhe
    if (eventoExpandido === eventoId) {
      setEventoExpandido(null);
      return;
    }

    // Se nÃ£o tem lanÃ§amentos carregados, busca
    if (!lancamentos[eventoId]) {
      setCarregandoLancamentos(prev => ({ ...prev, [eventoId]: true }));
      
      const resultado = await buscarLancamentosDoEvento(eventoId);
      
      if (resultado.success) {
        setLancamentos(prev => ({
          ...prev,
          [eventoId]: resultado.entradas
        }));
      }
      
      setCarregandoLancamentos(prev => ({ ...prev, [eventoId]: false }));
    }

    setEventoExpandido(eventoId);
  };

  // FunÃ§Ã£o para excluir lanÃ§amento
  const handleExcluirLancamento = async (lancamentoId, eventoId) => {
    if (!window.confirm('âš ï¸ Deseja realmente excluir este lanÃ§amento?')) {
      return;
    }

    const resultado = await excluirEntrada(lancamentoId);
    
    if (resultado.success) {
      // Invalidar caches
      invalidarCacheEventosEntradas();
      invalidarCacheLancamentosEvento(eventoId);
      
      // Recarregar dados
      await carregarEventos();
      
      // Recarregar lanÃ§amentos do evento se estiver expandido
      if (eventoExpandido === eventoId) {
        const resultadoLancamentos = await buscarLancamentosDoEvento(eventoId);
        if (resultadoLancamentos.success) {
          setLancamentos(prev => ({
            ...prev,
            [eventoId]: resultadoLancamentos.entradas
          }));
        }
      }
    }
  };

  // Formatar data
  const formatarData = useCallback((data) => {
    if (!data) return '-';
    
    try {
      const dataObj = data instanceof Date ? data : new Date(data);
      if (isNaN(dataObj.getTime())) return '-';
      
      const dia = dataObj.getDate().toString().padStart(2, '0');
      const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
      const ano = dataObj.getFullYear();
      
      return `${dia}/${mes}/${ano}`;
    } catch (error) {
      return '-';
    }
  }, []);

  // Obter nome do tipo de entrada
  const obterNomeTipo = useCallback((tipo) => {
    const tipos = {
      dizimo: 'ðŸ’° DÃ­zimo',
      oferta: 'ðŸŽ Oferta',
      santa_ceia: 'ðŸž Santa Ceia',
      cantina: 'ðŸ” Cantina',
      promocao: 'ðŸŽ‰ PromoÃ§Ã£o',
      outros: 'ðŸ“¦ Outros'
    };
    return tipos[tipo] || tipo;
  }, []);

  // Obter emoji de status
  const obterStatusEmoji = useCallback((status) => {
    const statusMap = {
      'aberto': 'ðŸŸ¢',
      'fechado': 'ðŸ”´',
      'analise': 'ðŸŸ¡',
      'concluido': 'âœ…'
    };
    return statusMap[status] || 'âšª';
  }, []);

  // Filtrar eventos por busca
  const eventosFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return eventos;
    
    const termo = termoBusca.toLowerCase();
    return eventos.filter(evento => 
      evento.nomeEvento?.toLowerCase().includes(termo) ||
      evento.nome?.toLowerCase().includes(termo) ||
      evento.tipo?.toLowerCase().includes(termo)
    );
  }, [eventos, termoBusca]);

  // Calcular paginaÃ§Ã£o
  const eventosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return eventosFiltrados.slice(inicio, fim);
  }, [eventosFiltrados, paginaAtual]);

  const totalPaginas = Math.ceil(eventosFiltrados.length / itensPorPagina);

  // Resetar pÃ¡gina ao buscar
  useEffect(() => {
    setPaginaAtual(1);
  }, [termoBusca]);

  // Callback apÃ³s adicionar entrada
  const handleEntradaAdicionada = useCallback(async () => {
    // Invalidar caches
    invalidarCacheEventosEntradas();
    
    // Recarregar eventos
    await carregarEventos();
    
    // Se hÃ¡ um evento expandido, recarregar seus lanÃ§amentos
    if (eventoExpandido) {
      invalidarCacheLancamentosEvento(eventoExpandido);
      const resultado = await buscarLancamentosDoEvento(eventoExpandido);
      if (resultado.success) {
        setLancamentos(prev => ({
          ...prev,
          [eventoExpandido]: resultado.entradas
        }));
      }
    }
  }, [eventoExpandido]);

  if (carregando) {
    return (
      <div style={{ 
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center',
        margin: '20px'
      }}>
        â³ Carregando entradas...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* FormulÃ¡rio de Nova Entrada */}
      <div style={{ marginBottom: '30px' }}>
        <FormEntrada 
          usuarioEmail={usuarioEmail}
          onEntradaAdicionada={handleEntradaAdicionada}
        />
      </div>

      {/* Tabela de Eventos com Entradas */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>
            ðŸ’µ Entradas por Evento ({eventosFiltrados.length})
          </h2>
          
          <input
            type="text"
            placeholder="ðŸ” Buscar evento..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '0.95rem',
              width: '280px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        {eventosPaginados.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#7f8c8d'
          }}>
            {termoBusca ? 'ðŸ” Nenhum evento encontrado com esse termo' : 'ðŸ“‹ Nenhum evento cadastrado'}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.95rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Evento</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Tipo</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Data</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>LanÃ§amentos</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Valor Total</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>AÃ§Ãµes</th>
                  </tr>
                </thead>
                <tbody>
                  {eventosPaginados.map((evento) => (
                    <React.Fragment key={evento.id}>
                      {/* Linha Principal do Evento */}
                      <tr style={{ 
                        borderBottom: '1px solid #e0e0e0',
                        backgroundColor: eventoExpandido === evento.id ? '#f9f9f9' : 'white'
                      }}>
                        <td style={{ padding: '12px', fontWeight: '500' }}>
                          {evento.nomeEvento || evento.nome}
                        </td>
                        <td style={{ padding: '12px', fontSize: '0.9rem', color: '#666' }}>
                          {evento.tipo}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {formatarData(evento.data)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.2rem' }}>
                            {obterStatusEmoji(evento.status)}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                          {evento.totalEntradas || 0}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: '#4CAF50'
                        }}>
                          {formatarMoeda(evento.valorTotal || 0)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => toggleDetalhesEvento(evento.id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: eventoExpandido === evento.id ? '#f44336' : '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = eventoExpandido === evento.id ? '#d32f2f' : '#1976D2';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = eventoExpandido === evento.id ? '#f44336' : '#2196F3';
                            }}
                          >
                            {eventoExpandido === evento.id ? 'ðŸ”¼ Ocultar' : 'ðŸ”½ Ver Detalhes'}
                          </button>
                        </td>
                      </tr>

                      {/* Linha Expandida com Detalhes dos LanÃ§amentos */}
                      {eventoExpandido === evento.id && (
                        <tr>
                          <td colSpan="7" style={{ 
                            padding: '20px',
                            backgroundColor: '#fafafa',
                            borderBottom: '2px solid #e0e0e0'
                          }}>
                            {carregandoLancamentos[evento.id] ? (
                              <div style={{ textAlign: 'center', padding: '20px' }}>
                                â³ Carregando lanÃ§amentos...
                              </div>
                            ) : lancamentos[evento.id]?.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                                ðŸ“‹ Nenhum lanÃ§amento neste evento
                              </div>
                            ) : (
                              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50' }}>
                                  ðŸ“Š LanÃ§amentos do Evento
                                </h4>
                                <table style={{ 
                                  width: '100%', 
                                  borderCollapse: 'collapse',
                                  fontSize: '0.9rem'
                                }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#e8f5e9' }}>
                                      <th style={{ padding: '10px', textAlign: 'left' }}>Data</th>
                                      <th style={{ padding: '10px', textAlign: 'left' }}>Tipo</th>
                                      <th style={{ padding: '10px', textAlign: 'left' }}>DescriÃ§Ã£o</th>
                                      <th style={{ padding: '10px', textAlign: 'left' }}>Membro</th>
                                      <th style={{ padding: '10px', textAlign: 'center' }}>Forma</th>
                                      <th style={{ padding: '10px', textAlign: 'right' }}>Valor</th>
                                      <th style={{ padding: '10px', textAlign: 'center' }}>AÃ§Ãµes</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lancamentos[evento.id]?.map((lancamento) => (
                                      <tr key={lancamento.id} style={{ 
                                        borderBottom: '1px solid #e0e0e0',
                                        backgroundColor: 'white'
                                      }}>
                                        <td style={{ padding: '10px' }}>
                                          {formatarData(lancamento.data)}
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                          {obterNomeTipo(lancamento.tipo)}
                                        </td>
                                        <td style={{ padding: '10px', color: '#666' }}>
                                          {lancamento.descricao || '-'}
                                        </td>
                                        <td style={{ padding: '10px', color: '#666' }}>
                                          {lancamento.membroNome || '-'}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                          {lancamento.formaRecebimento === 'pix' ? 'ðŸ“± PIX' : 'ðŸ’µ Dinheiro'}
                                        </td>
                                        <td style={{ 
                                          padding: '10px', 
                                          textAlign: 'right',
                                          fontWeight: 'bold',
                                          color: '#4CAF50'
                                        }}>
                                          {formatarMoeda(lancamento.valor)}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                          <button
                                            onClick={() => handleExcluirLancamento(lancamento.id, evento.id)}
                                            style={{
                                              padding: '6px 12px',
                                              backgroundColor: '#f44336',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              fontSize: '0.85rem'
                                            }}
                                            title="Excluir lanÃ§amento"
                                          >
                                            ðŸ—‘ï¸
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PaginaÃ§Ã£o */}
            {totalPaginas > 1 && (
              <div style={{ 
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: paginaAtual === 1 ? '#e0e0e0' : '#4CAF50',
                    color: paginaAtual === 1 ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  â† Anterior
                </button>
                
                <span style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}>
                  PÃ¡gina {paginaAtual} de {totalPaginas}
                </span>
                
                <button
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: paginaAtual === totalPaginas ? '#e0e0e0' : '#4CAF50',
                    color: paginaAtual === totalPaginas ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  PrÃ³xima â†’
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EntradasNew;

