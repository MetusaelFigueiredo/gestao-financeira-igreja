import React, { useState } from 'react';
import { adicionarMembro } from '../services/membros';

function FormMembro({ onSucesso }) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    
    if (!nome || nome.trim().length < 3) {
      setErro('Digite o nome completo (mínimo 3 caracteres)');
      return;
    }
    
    setCarregando(true);
    
    const resultado = await adicionarMembro({
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim()
    });
    
    setCarregando(false);
    
    if (resultado.success) {
      setSucesso(`✅ Membro ${nome} cadastrado com sucesso!`);
      
      setNome('');
      setTelefone('');
      setEmail('');
      
      if (onSucesso) onSucesso();
      
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro('Erro ao cadastrar: ' + resultado.error);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
        👤 Cadastrar Novo Membro
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            📝 Nome Completo *
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: João da Silva"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            📱 Telefone (opcional)
          </label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 99999-9999"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            📧 Email (opcional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="joao@email.com"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        {erro && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            ❌ {erro}
          </div>
        )}
        
        {sucesso && (
          <div style={{
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {sucesso}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: carregando ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: carregando ? 'not-allowed' : 'pointer'
          }}
        >
          {carregando ? '⏳ Cadastrando...' : '💾 Cadastrar Membro'}
        </button>
      </form>
    </div>
  );
}

export default FormMembro;