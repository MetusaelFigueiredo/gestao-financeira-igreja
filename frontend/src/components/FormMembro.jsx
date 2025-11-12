import React, { useState, useEffect } from 'react';
import { adicionarMembro, atualizarMembro } from '../services/membros';

function FormMembro({ onSucesso, usuarioEmail, membroEditando, onCancelarEdicao }) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [funcao, setFuncao] = useState('Membro'); // 🆕 Campo função
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Preencher o formulário quando estiver editando
  useEffect(() => {
    if (membroEditando) {
      setNome(membroEditando.nome || '');
      setTelefone(membroEditando.telefone || '');
      setEmail(membroEditando.email || '');
      setFuncao(membroEditando.funcao || 'Membro');
    } else {
      // Limpar formulário quando não estiver editando
      setNome('');
      setTelefone('');
      setEmail('');
      setFuncao('Membro');
    }
  }, [membroEditando]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    
    if (!nome || nome.trim().length < 3) {
      setErro('Digite o nome completo (mínimo 3 caracteres)');
      return;
    }
    
    setCarregando(true);
    
    let resultado;
    if (membroEditando) {
      // Modo edição
      resultado = await atualizarMembro(membroEditando.id, {
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        funcao: funcao
      }, usuarioEmail);
    } else {
      // Modo criação
      resultado = await adicionarMembro({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        funcao: funcao
      }, usuarioEmail);
    }
    
    setCarregando(false);
    
    if (resultado.success) {
      const acao = membroEditando ? 'atualizado' : 'cadastrado';
      setSucesso(`Membro ${nome} ${acao} com sucesso!`);
      
      setNome('');
      setTelefone('');
      setEmail('');
      setFuncao('Membro');
      
      if (onSucesso) onSucesso();
      
      setTimeout(() => setSucesso(''), 3000);
    } else {
      const acao = membroEditando ? 'atualizar' : 'cadastrar';
      setErro(`Erro ao ${acao}: ` + resultado.error);
    }
  };

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
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: '500',
          color: '#202124',
          margin: 0
        }}>
          {membroEditando ? `Editar Membro: ${membroEditando.nome}` : 'Cadastrar Novo Membro'}
        </h2>
        {membroEditando && (
          <button
            type="button"
            onClick={onCancelarEdicao}
            style={{
              background: 'none',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.875rem',
              color: '#5f6368',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#5f6368'
          }}>
            Nome Completo *
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: João da Silva"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              fontSize: '0.9375rem',
              color: '#202124',
              transition: 'border-color 0.2s ease',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
            onBlur={(e) => e.target.style.borderColor = '#dadce0'}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#5f6368'
          }}>
            Telefone (opcional)
          </label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 99999-9999"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              fontSize: '0.9375rem',
              color: '#202124',
              transition: 'border-color 0.2s ease',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
            onBlur={(e) => e.target.style.borderColor = '#dadce0'}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#5f6368'
          }}>
            Email (opcional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="joao@email.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              fontSize: '0.9375rem',
              color: '#202124',
              transition: 'border-color 0.2s ease',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
            onBlur={(e) => e.target.style.borderColor = '#dadce0'}
          />
        </div>

        {/* 🆕 Campo Função */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#5f6368'
          }}>
            Função na Igreja
          </label>
          <select
            value={funcao}
            onChange={(e) => setFuncao(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              fontSize: '0.9375rem',
              color: '#202124',
              backgroundColor: '#ffffff',
              transition: 'border-color 0.2s ease',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
            onBlur={(e) => e.target.style.borderColor = '#dadce0'}
          >
            <option value="Membro">Membro</option>
            <option value="Cooperador">Cooperador</option>
            <option value="Diácono">Diácono</option>
            <option value="Presbítero">Presbítero</option>
            <option value="Pastor">Pastor</option>
            <option value="Evangelista">Evangelista</option>
          </select>
        </div>

        {erro && (
          <div style={{
            backgroundColor: '#fce8e6',
            color: '#c5221f',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            border: '1px solid #f5c6cb'
          }}>
            {erro}
          </div>
        )}
        
        {sucesso && (
          <div style={{
            backgroundColor: '#e6f4ea',
            color: '#137333',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            border: '1px solid #c6e1c6'
          }}>
            ✓ {sucesso}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: carregando ? '#dadce0' : '#1a73e8',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.9375rem',
            fontWeight: '500',
            cursor: carregando ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!carregando) e.currentTarget.style.backgroundColor = '#1765cc';
          }}
          onMouseLeave={(e) => {
            if (!carregando) e.currentTarget.style.backgroundColor = '#1a73e8';
          }}
        >
          {carregando 
            ? (membroEditando ? 'Atualizando...' : 'Cadastrando...') 
            : (membroEditando ? 'Atualizar Membro' : 'Cadastrar Membro')
          }
        </button>
      </form>
    </div>
  );
}

export default FormMembro;