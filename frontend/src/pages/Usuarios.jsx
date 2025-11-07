import React from 'react';
import GerenciarUsuarios from '../components/GerenciarUsuarios';
import { podeGerenciarUsuarios } from '../services/usuarios';

function Usuarios({ usuarioPerfil }) {
  if (!podeGerenciarUsuarios(usuarioPerfil?.perfil)) {
    return (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 24px',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#fef7e0',
          borderRadius: '12px',
          padding: '40px',
          border: '1px solid #fbbc04'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#fbbc04',
            marginBottom: '16px'
          }}>
            🔒 Acesso Restrito
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#5f6368',
            margin: 0
          }}>
            Apenas usuários MASTER podem acessar o gerenciamento de usuários.
          </p>
        </div>
      </div>
    );
  }

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
          Gerenciar Usuários
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          margin: 0
        }}>
          Gerencie perfis e permissões dos usuários do sistema
        </p>
      </div>

      {/* Cards de Resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* Seu Perfil */}
        <div style={{
          border: '2px solid #9334e6',
          borderRadius: '8px',
          padding: '18px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#9334e6', fontWeight: '600' }}>
            👑 SEU PERFIL
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '8px', color: '#9334e6' }}>
            Pastor
          </div>
          <div style={{ fontSize: '0.875rem', color: '#9aa0a6', marginTop: '6px' }}>
            {usuarioPerfil?.perfil?.nome || usuarioPerfil?.perfil?.email}
          </div>
        </div>

        {/* Permissões */}
        <div style={{
          border: '2px solid #34a853',
          borderRadius: '8px',
          padding: '18px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#34a853', fontWeight: '600' }}>
            ✅ SUAS PERMISSÕES
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '600', marginTop: '8px', color: '#34a853' }}>
            Total
          </div>
          <div style={{ fontSize: '0.875rem', color: '#9aa0a6', marginTop: '6px' }}>
            Gerenciar usuários e aprovar eventos
          </div>
        </div>

        {/* Informação */}
        <div style={{
          border: '2px solid #1a73e8',
          borderRadius: '8px',
          padding: '18px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#1a73e8', fontWeight: '600' }}>
            💡 DICA
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: '600', marginTop: '8px', color: '#1a73e8' }}>
            Cuidado ao alterar perfis
          </div>
          <div style={{ fontSize: '0.875rem', color: '#9aa0a6', marginTop: '6px' }}>
            Mudanças afetam permissões imediatamente
          </div>
        </div>
      </div>

      {/* Componente de Gerenciamento */}
      <GerenciarUsuarios usuarioPerfil={usuarioPerfil} />
    </div>
  );
}

export default Usuarios;