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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '30px' }}>
        👥 Gerenciar Membros
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gap: '30px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'
      }}>
        <FormMembro onSucesso={carregarMembros} />
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
            📋 Membros Cadastrados ({membros.length})
          </h2>
          
          {carregando ? (
            <p>⏳ Carregando...</p>
          ) : membros.length === 0 ? (
            <p style={{ color: '#7f8c8d' }}>Nenhum membro cadastrado ainda.</p>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '15px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
            }}>
              {membros.map(membro => (
                <div key={membro.id} style={{
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  borderLeft: '4px solid #2196F3'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    👤 {membro.nome}
                  </div>
                  {membro.telefone && (
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      📱 {membro.telefone}
                    </div>
                  )}
                  {membro.email && (
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      📧 {membro.email}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Membros;