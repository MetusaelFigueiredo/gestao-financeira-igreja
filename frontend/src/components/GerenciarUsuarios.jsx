import React, { useState, useEffect } from 'react';
import { buscarTodosUsuarios, alterarPerfilUsuario, PERFIS, podeGerenciarUsuarios } from '../services/usuarios';

function GerenciarUsuarios({ usuarioPerfil }) {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [alterandoPerfil, setAlterandoPerfil] = useState(null);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    setCarregando(true);
    const resultado = await buscarTodosUsuarios();
    
    if (resultado.success) {
      setUsuarios(resultado.usuarios);
    }
    
    setCarregando(false);
  };

  const confirmarAlteracaoPerfil = async (usuario, novoPerfil) => {
    let acao = '';
    switch (novoPerfil) {
      case PERFIS.MASTER: acao = 'promover a Master'; break;
      case PERFIS.PASTOR: acao = 'promover a Pastor'; break;
      case PERFIS.USUARIO: acao = 'rebaixar para Usuário'; break;
    }
    
    const confirmacao = window.confirm(
      `Tem certeza que deseja ${acao} o usuário "${usuario.nome}"?\n\n` +
      `Esta ação irá alterar as permissões do usuário no sistema.`
    );

    if (confirmacao) {
      setAlterandoPerfil(usuario.id);
      
      try {
        const resultado = await alterarPerfilUsuario(usuario.id, novoPerfil);
        
        if (resultado.success) {
          alert(`✅ Perfil alterado com sucesso!`);
          carregarUsuarios();
        } else {
          alert('❌ Erro ao alterar perfil: ' + resultado.error);
        }
      } catch (error) {
        console.error('Erro ao alterar perfil:', error);
        alert('❌ Erro inesperado ao alterar perfil');
      } finally {
        setAlterandoPerfil(null);
      }
    }
  };

  const obterCorPerfil = (perfil) => {
    switch (perfil) {
      case PERFIS.MASTER: return '#dc2626'; // Vermelho para master
      case PERFIS.PASTOR: return '#9334e6'; // Roxo para pastor
      default: return '#1a73e8';           // Azul para usuário
    }
  };

  const obterTextoPerfil = (perfil) => {
    switch (perfil) {
      case PERFIS.MASTER: return '⭐ Master';
      case PERFIS.PASTOR: return '👑 Pastor';
      default: return '👤 Usuário';
    }
  };

  if (carregando) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#5f6368'
      }}>
        Carregando usuários...
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
          👥 Gerenciar Usuários
        </h3>
        <span style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          backgroundColor: '#f1f3f4',
          padding: '4px 12px',
          borderRadius: '12px',
          fontWeight: '500'
        }}>
          {usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}
        </span>
      </div>

      {usuarios.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#5f6368'
        }}>
          Nenhum usuário encontrado.
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
                  👤 Nome
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                  📧 E-mail
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                  🏷️ Perfil
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                  📅 Último Login
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                  ⚙️ Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario, index) => (
                <tr key={usuario.id} style={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                }}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed' }}>
                    <div style={{ fontWeight: '500' }}>
                      {usuario.nome}
                    </div>
                    {!usuario.ativo && (
                      <div style={{ fontSize: '0.75rem', color: '#ea4335' }}>
                        Inativo
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed' }}>
                    {usuario.email}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: `${obterCorPerfil(usuario.perfil)}15`,
                      color: obterCorPerfil(usuario.perfil)
                    }}>
                      {obterTextoPerfil(usuario.perfil)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed', textAlign: 'center' }}>
                    {usuario.ultimoLogin 
                      ? new Date(usuario.ultimoLogin.toDate()).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed', textAlign: 'center' }}>
                    {usuario.id !== usuarioPerfil.uid && (
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* Botão Master */}
                        {usuario.perfil !== PERFIS.MASTER && (
                          <button
                            onClick={() => confirmarAlteracaoPerfil(usuario, PERFIS.MASTER)}
                            disabled={alterandoPerfil === usuario.id}
                            title="Promover a Master"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: alterandoPerfil === usuario.id ? '#9aa0a6' : '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: alterandoPerfil === usuario.id ? 'not-allowed' : 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {alterandoPerfil === usuario.id ? '⏳' : '⭐'}
                          </button>
                        )}
                        
                        {/* Botão Pastor */}
                        {usuario.perfil !== PERFIS.PASTOR && (
                          <button
                            onClick={() => confirmarAlteracaoPerfil(usuario, PERFIS.PASTOR)}
                            disabled={alterandoPerfil === usuario.id}
                            title="Promover a Pastor"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: alterandoPerfil === usuario.id ? '#9aa0a6' : '#9334e6',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: alterandoPerfil === usuario.id ? 'not-allowed' : 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {alterandoPerfil === usuario.id ? '⏳' : '👑'}
                          </button>
                        )}
                        
                        {/* Botão Usuário */}
                        {usuario.perfil !== PERFIS.USUARIO && (
                          <button
                            onClick={() => confirmarAlteracaoPerfil(usuario, PERFIS.USUARIO)}
                            disabled={alterandoPerfil === usuario.id}
                            title="Rebaixar para Usuário"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: alterandoPerfil === usuario.id ? '#9aa0a6' : '#1a73e8',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: alterandoPerfil === usuario.id ? 'not-allowed' : 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {alterandoPerfil === usuario.id ? '⏳' : '👤'}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#e8f0fe',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#1a73e8'
      }}>
        <strong>💡 Informações importantes:</strong>
        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
          <li><strong>⭐ Master:</strong> Pode gerenciar usuários e aprovar eventos</li>
          <li><strong>👑 Pastor:</strong> Pode aprovar/rejeitar eventos</li>
          <li><strong>👤 Usuário:</strong> Pode criar eventos e registrar entradas</li>
          <li>Você não pode alterar seu próprio perfil</li>
          <li><strong>Apenas Masters</strong> podem acessar esta página</li>
        </ul>
      </div>
    </div>
  );
}

export default GerenciarUsuarios;