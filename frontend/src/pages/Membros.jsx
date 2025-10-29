import React, { useState, useEffect } from 'react';
import FormMembro from '../components/FormMembro';
import { buscarMembros } from '../services/membros';

function Membros() {
  const [membros, setMembros] = useState([]);
  const [carregando, setCarregando] = useState(true);

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
      
      {/* Formulário de Cadastro */}
      <div style={{ marginBottom: '32px' }}>
        <FormMembro onSucesso={carregarMembros} />
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
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: '#202124',
                  fontSize: '0.9375rem'
                }}>
                  {membro.nome}
                </div>
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
                    color: '#5f6368'
                  }}>
                    📧 {membro.email}
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