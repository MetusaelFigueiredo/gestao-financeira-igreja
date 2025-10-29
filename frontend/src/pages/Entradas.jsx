import React, { useState } from 'react';
import FormEntrada from '../components/FormEntrada';
import ListaEntradas from '../components/ListaEntradas';

function Entradas() {
  const [atualizar, setAtualizar] = useState(0);

  const handleNovaEntrada = () => {
    // Força atualização da lista
    setAtualizar(prev => prev + 1);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '30px' }}>
        💰 Entradas Financeiras
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gap: '30px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'
      }}>
        <FormEntrada onSucesso={handleNovaEntrada} />
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <ListaEntradas atualizar={atualizar} />
      </div>
    </div>
  );
}

export default Entradas;