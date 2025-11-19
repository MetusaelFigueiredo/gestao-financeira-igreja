import React, { useState, useEffect, useMemo } from 'react';
import FormMembro from '../components/FormMembro';
import { escutarMembros, excluirMembro } from '../services/membros';

function Membros({ usuarioEmail }) {
  const [membros, setMembros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [membroEditando, setMembroEditando] = useState(null);
  
  // 🔍 Estados para busca e paginação
  const [termoBusca, setTermoBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;

  // 🚀 OTIMIZAÇÃO: Usar listener em tempo real ao invés de polling
  useEffect(() => {
    setCarregando(true);
    
    // Configurar listener
    const unsubscribe = escutarMembros((resultado) => {
      if (resultado.success) {
        setMembros(resultado.membros);
        setCarregando(false);
      } else {
        console.error('Erro ao escutar membros:', resultado.error);
        setCarregando(false);
      }
    });
    
    // Cleanup: remover listener quando componente desmontar
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // ✅ Executa apenas uma vez ao montar

  const handleEditar = (membro) => {
    setMembroEditando(membro);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluir = async (membro) => {
    if (window.confirm(`Tem certeza que deseja excluir o membro "${membro.nome}"?`)) {
      const resultado = await excluirMembro(membro.id);
      if (resultado.success) {
        // ✅ Não precisa recarregar - listener atualiza automaticamente
        alert('Membro excluído com sucesso!');
      } else {
        alert('Erro ao excluir membro: ' + resultado.error);
      }
    }
  };

  // 🚀 OTIMIZAÇÃO: Filtro de busca local (0 leituras no Firestore)
  const membrosFiltrados = useMemo(() => {
    if (!termoBusca.trim()) {
      return membros;
    }
    
    const termo = termoBusca.toLowerCase();
    return membros.filter(membro => 
      membro.nome?.toLowerCase().includes(termo) ||
      membro.email?.toLowerCase().includes(termo) ||
      membro.telefone?.includes(termo) ||
      membro.funcao?.toLowerCase().includes(termo)
    );
  }, [membros, termoBusca]);

  // 🚀 OTIMIZAÇÃO: Paginação local (0 leituras no Firestore)
  const { membrosPaginados, totalPaginas } = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    
    return {
      membrosPaginados: membrosFiltrados.slice(inicio, fim),
      totalPaginas: Math.ceil(membrosFiltrados.length / ITENS_POR_PAGINA)
    };
  }, [membrosFiltrados, paginaAtual]);

  // Resetar para página 1 quando buscar
  useEffect(() => {
    setPaginaAtual(1);
  }, [termoBusca]);

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '32px 24px'
    }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: '600',
          color: '#202124',
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          Membros
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: '#5f6368'
        }}>
          Gerencie o cadastro de membros da igreja
        </p>
      </div>
      
      {/* Formulário de Cadastro/Edição */}
      <div style={{ marginBottom: '32px' }}>
        <FormMembro 
          onSucesso={() => {
            // ✅ Não precisa recarregar - listener atualiza automaticamente
            setMembroEditando(null);
          }} 
          usuarioEmail={usuarioEmail}
          membroEditando={membroEditando}
          onCancelarEdicao={() => setMembroEditando(null)}
        />
      </div>
      
      {/* Lista de Membros - TABELA */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e8eaed'
      }}>
        {/* Cabeçalho com busca */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: '500',
              color: '#202124',
              margin: 0
            }}>
              Membros Cadastrados
            </h2>
            <span style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              backgroundColor: '#f1f3f4',
              padding: '4px 12px',
              borderRadius: '12px',
              fontWeight: '500'
            }}>
              {membrosFiltrados.length} {membrosFiltrados.length === 1 ? 'membro' : 'membros'}
              {termoBusca && ` (filtrado${membrosFiltrados.length !== membros.length ? ` de ${membros.length}` : ''})`}
            </span>
          </div>
          
          {/* Campo de busca */}
          <div style={{ position: 'relative', minWidth: '280px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nome, email, telefone ou função..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #dadce0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1976d2';
                e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dadce0';
                e.target.style.boxShadow = 'none';
              }}
            />
            {termoBusca && (
              <button
                onClick={() => setTermoBusca('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#5f6368',
                  fontSize: '18px',
                  padding: '4px'
                }}
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {carregando ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#5f6368'
          }}>
            Carregando membros...
          </div>
        ) : membrosFiltrados.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#5f6368'
          }}>
            {termoBusca 
              ? `Nenhum membro encontrado para "${termoBusca}"`
              : 'Nenhum membro cadastrado ainda.'
            }
          </div>
        ) : (
          <>
            {/* Tabela de membros */}
            <div style={{ 
              overflowX: 'auto',
              marginBottom: '20px'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #e8eaed'
                  }}>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#202124',
                      whiteSpace: 'nowrap'
                    }}>Nome</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#202124',
                      whiteSpace: 'nowrap'
                    }}>Função</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#202124',
                      whiteSpace: 'nowrap'
                    }}>Telefone</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#202124'
                    }}>Email</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#202124',
                      width: '100px'
                    }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {membrosPaginados.map((membro, index) => (
                    <tr key={membro.id} style={{
                      borderBottom: '1px solid #e8eaed',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafafa'}
                    >
                      <td style={{
                        padding: '12px 16px',
                        fontWeight: '500',
                        color: '#202124'
                      }}>
                        {membro.nome}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        color: '#5f6368'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          fontSize: '0.8125rem',
                          fontWeight: '500'
                        }}>
                          {membro.funcao || 'Membro'}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        color: '#5f6368',
                        whiteSpace: 'nowrap'
                      }}>
                        {membro.telefone || '-'}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        color: '#5f6368',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={membro.email}>
                        {membro.email || '-'}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditar(membro)}
                            style={{
                              background: '#e3f2fd',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              color: '#1976d2',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#1976d2';
                              e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#e3f2fd';
                              e.target.style.color = '#1976d2';
                            }}
                            title="Editar membro"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleExcluir(membro)}
                            style={{
                              background: '#ffebee',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              color: '#d32f2f',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#d32f2f';
                              e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#ffebee';
                              e.target.style.color = '#d32f2f';
                            }}
                            title="Excluir membro"
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid #e8eaed',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#5f6368'
                }}>
                  Mostrando {((paginaAtual - 1) * ITENS_POR_PAGINA) + 1} a {Math.min(paginaAtual * ITENS_POR_PAGINA, membrosFiltrados.length)} de {membrosFiltrados.length} membros
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #dadce0',
                      borderRadius: '6px',
                      backgroundColor: paginaAtual === 1 ? '#f1f3f4' : '#ffffff',
                      color: paginaAtual === 1 ? '#9aa0a6' : '#202124',
                      cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (paginaAtual !== 1) {
                        e.target.style.backgroundColor = '#f1f3f4';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (paginaAtual !== 1) {
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    ← Anterior
                  </button>
                  
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#202124',
                    fontWeight: '500',
                    padding: '0 12px'
                  }}>
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  
                  <button
                    onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaAtual === totalPaginas}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #dadce0',
                      borderRadius: '6px',
                      backgroundColor: paginaAtual === totalPaginas ? '#f1f3f4' : '#ffffff',
                      color: paginaAtual === totalPaginas ? '#9aa0a6' : '#202124',
                      cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (paginaAtual !== totalPaginas) {
                        e.target.style.backgroundColor = '#f1f3f4';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (paginaAtual !== totalPaginas) {
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Membros;