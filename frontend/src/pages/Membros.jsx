import React, { useState, useEffect } from 'react';
import FormMembro from '../components/FormMembro';
import { buscarMembros, excluirMembro } from '../services/membros';

function Membros({ usuarioEmail }) {
  const [membros, setMembros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [membroEditando, setMembroEditando] = useState(null);

  useEffect(() => {
    carregarMembros();
  }, []);

  const carregarMembros = async () => {
    setCarregando(true);
    const resultado = await buscarMembros();
    
    if (resultado.success) {
      setMembros(resultado.membros);
    }
    
    setCarregando(false);
  };

  const handleEditar = (membro) => {
    setMembroEditando(membro);
  };

  const handleExcluir = async (membro) => {
    if (window.confirm(`Tem certeza que deseja excluir o membro "${membro.nome}"?`)) {
      const resultado = await excluirMembro(membro.id);
      if (resultado.success) {
        await carregarMembros();
        alert('Membro excluído com sucesso!');
      } else {
        alert('Erro ao excluir membro: ' + resultado.error);
      }
    }
  };

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
            carregarMembros();
            setMembroEditando(null);
          }} 
          usuarioEmail={usuarioEmail}
          membroEditando={membroEditando}
          onCancelarEdicao={() => setMembroEditando(null)}
        />
      </div>
      
      {/* Lista de Membros */}
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
            {membros.length} {membros.length === 1 ? 'membro' : 'membros'}
          </span>
        </div>
        
        {carregando ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#5f6368'
          }}>
            Carregando membros...
          </div>
        ) : membros.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#5f6368'
          }}>
            Nenhum membro cadastrado ainda.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '12px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
          }}>
            {membros.map(membro => (
              <div key={membro.id} style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e8eaed',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontWeight: '500',
                    color: '#202124',
                    fontSize: '0.9375rem'
                  }}>
                    {membro.nome}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleEditar(membro)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#1976d2'
                      }}
                      title="Editar membro"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleExcluir(membro)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#d32f2f'
                      }}
                      title="Excluir membro"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {membro.funcao && (
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#1976d2',
                    marginBottom: '6px',
                    fontWeight: '500',
                    backgroundColor: '#e3f2fd',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-block'
                  }}>
                    👤 {membro.funcao}
                  </div>
                )}
                
                {membro.telefone && (
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#5f6368',
                    marginBottom: '4px'
                  }}>
                    📱 {membro.telefone}
                  </div>
                )}
                {membro.email && (
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#5f6368',
                    marginBottom: '4px'
                  }}>
                    📧 {membro.email}
                  </div>
                )}

                {/* Informações de Auditoria */}
                {(membro.criadoPor || membro.criadoEm || membro.editadoPor || membro.updatedAt) && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e8eaed',
                    fontSize: '0.7rem',
                    color: '#5f6368'
                  }}>
                    {membro.criadoPor && membro.criadoEm && (
                      <div style={{ marginBottom: '4px' }}>
                        ℹ️ Criado por: <strong>{membro.criadoPor}</strong>
                        <br />
                        {membro.criadoEm?.toDate?.()?.toLocaleDateString?.('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) || 'Data não disponível'}
                      </div>
                    )}

                    {membro.editadoPor && membro.updatedAt && (
                      <div>
                        Editado por: <strong>{membro.editadoPor}</strong>
                        <br />
                        {membro.updatedAt?.toDate?.()?.toLocaleDateString?.('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) || 'Data não disponível'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Membros;