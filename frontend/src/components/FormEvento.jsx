import React, { useState } from 'react';
import { criarEvento } from '../services/eventos';

function FormEvento({ onSucesso, usuarioEmail }) {
  const [nomeEvento, setNomeEvento] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nomeEvento.trim() || !dataEvento) {
      alert('❌ Preencha todos os campos obrigatórios');
      return;
    }

    setSalvando(true);
    
    try {
      const resultado = await criarEvento({
        nomeEvento: nomeEvento.trim(),
        dataEvento,
        usuarioEmail
      });

      if (resultado.success) {
        alert('✅ Evento criado com sucesso!');
        setNomeEvento('');
        setDataEvento('');
        
        if (onSucesso) {
          onSucesso(resultado.evento);
        }
      } else {
        alert('❌ Erro ao criar evento: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      alert('❌ Erro inesperado ao criar evento');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e8eaed',
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
        🎯 Criar Novo Evento
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 200px',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Nome do Evento */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#5f6368',
              marginBottom: '6px'
            }}>
              📝 Nome do Evento *
            </label>
            <input
              type="text"
              value={nomeEvento}
              onChange={(e) => setNomeEvento(e.target.value)}
              placeholder="Ex: Culto de Ensino, EBD, Reunião de Oração"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
              onBlur={(e) => e.target.style.borderColor = '#dadce0'}
            />
          </div>

          {/* Data do Evento */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#5f6368',
              marginBottom: '6px'
            }}>
              📅 Data do Evento *
            </label>
            <input
              type="date"
              value={dataEvento}
              onChange={(e) => setDataEvento(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
              onBlur={(e) => e.target.style.borderColor = '#dadce0'}
            />
          </div>
        </div>

        {/* Botão Criar Evento */}
        <div style={{ textAlign: 'right' }}>
          <button
            type="submit"
            disabled={salvando}
            style={{
              padding: '12px 24px',
              backgroundColor: salvando ? '#9aa0a6' : '#1a73e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: salvando ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!salvando) e.target.style.backgroundColor = '#1557b0';
            }}
            onMouseLeave={(e) => {
              if (!salvando) e.target.style.backgroundColor = '#1a73e8';
            }}
          >
            {salvando ? '⏳ Criando...' : '✅ Criar Evento'}
          </button>
        </div>
      </form>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#e8f0fe',
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: '#1a73e8'
      }}>
        💡 <strong>Dica:</strong> Após criar o evento, ele ficará aberto para receber entradas. 
        Você poderá fechá-lo quando terminar de registrar todas as entradas.
      </div>
    </div>
  );
}

export default FormEvento;