import React, { useState, useEffect } from 'react';
import { adicionarEntrada } from '../services/entradas';
import { buscarMembros } from '../services/membros';
import { formatarMoeda, dataParaString } from '../utils/formatacao';

function FormEntrada({ onSucesso }) {
  const hoje = dataParaString(new Date());
  
  const [tipo, setTipo] = useState('dizimo');
  const [data, setData] = useState(hoje);
  const [valor, setValor] = useState('');
  const [formaRecebimento, setFormaRecebimento] = useState('pix');
  const [descricao, setDescricao] = useState('');
  
  const [membroId, setMembroId] = useState('');
  const [membros, setMembros] = useState([]);
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    carregarMembros();
  }, []);

  const carregarMembros = async () => {
    const resultado = await buscarMembros();
    if (resultado.success) {
      setMembros(resultado.membros);
      console.log('👥 Membros carregados:', resultado.membros.length, resultado.membros);
    }
  };

  const valorNum = parseFloat(valor) || 0;
  let rateioPreview = { central: 0, local: 0, missoes: 0 };
  
  if (tipo === 'santa_ceia') {
    rateioPreview = { central: 0, local: 0, missoes: valorNum };
  } else if (tipo === 'dizimo' || tipo === 'oferta') {
    rateioPreview = { central: valorNum * 0.60, local: valorNum * 0.40, missoes: 0 };
  } else {
    rateioPreview = { central: 0, local: valorNum, missoes: 0 };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    
    if (!data) {
      setErro('Selecione a data');
      return;
    }
    
    if (!valor || valorNum <= 0) {
      setErro('Digite um valor válido');
      return;
    }

    if (tipo === 'dizimo' && !membroId) {
      setErro('Selecione o membro que dizimou');
      return;
    }
    
    setCarregando(true);
    
    const dadosEntrada = {
      tipo,
      data,
      valor: valorNum,
      formaRecebimento,
      descricao
    };

    if (tipo === 'dizimo' && membroId) {
      const membro = membros.find(m => m.id === membroId);
      dadosEntrada.membroId = membroId;
      dadosEntrada.membroNome = membro.nome;
    }
    
    const resultado = await adicionarEntrada(dadosEntrada);
    
    setCarregando(false);
    
    if (resultado.success) {
      const tipoNome = tipo === 'dizimo' ? 'Dízimo' :
                       tipo === 'oferta' ? 'Oferta' :
                       tipo === 'santa_ceia' ? 'Oferta Santa Ceia' : 'Entrada';
      
      setSucesso(`✅ ${tipoNome} de ${formatarMoeda(valorNum)} lançado com sucesso!`);
      
      setValor('');
      setDescricao('');
      setMembroId('');
      setData(hoje);
      
      if (onSucesso) onSucesso();
      
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro('Erro ao salvar: ' + resultado.error);
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
        💰 Nova Entrada
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            📋 Tipo de Entrada *
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            <option value="dizimo">💰 Dízimo (60% Central / 40% Local)</option>
            <option value="oferta">🎁 Oferta Comum (60% Central / 40% Local)</option>
            <option value="santa_ceia">🍞 Oferta Santa Ceia (100% Missões)</option>
            <option value="cantina">🍔 Cantina (100% Local)</option>
            <option value="promocao">🎉 Promoção/Evento (100% Local)</option>
            <option value="outros">📦 Outros (100% Local)</option>
          </select>
        </div>

        {tipo === 'dizimo' && (
          <div style={{ 
            marginBottom: '20px',
            backgroundColor: '#e3f2fd',
            padding: '15px',
            borderRadius: '8px',
            border: '2px solid #2196f3'
          }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              👤 Membro Dizimista *
            </label>
            <select
              value={membroId}
              onChange={(e) => setMembroId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #2196f3',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              required={tipo === 'dizimo'}
            >
              <option value="">Selecione o membro...</option>
              {membros.map(membro => (
                <option key={membro.id} value={membro.id}>
                  {membro.nome}
                </option>
              ))}
            </select>
            
            {membros.length === 0 && (
              <p style={{ 
                marginTop: '10px', 
                fontSize: '0.9rem', 
                color: '#f57c00',
                fontWeight: '500'
              }}>
                ⚠️ Nenhum membro cadastrado. Cadastre membros primeiro!
              </p>
            )}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            📅 Data *
          </label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            max={hoje}
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
            💵 Valor (R$) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="1000.00"
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

        {valorNum > 0 && (
          <div style={{
            backgroundColor: tipo === 'santa_ceia' ? '#f3e5f5' : 
                           (tipo === 'dizimo' || tipo === 'oferta') ? '#e3f2fd' : '#e8f5e9',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <strong>📊 Rateio Automático:</strong>
            <div style={{ marginTop: '10px' }}>
              {rateioPreview.central > 0 && (
                <div>🏛️ Central (60%): <strong>{formatarMoeda(rateioPreview.central)}</strong></div>
              )}
              {rateioPreview.local > 0 && (
                <div>🏠 Local ({tipo === 'dizimo' || tipo === 'oferta' ? '40%' : '100%'}): <strong>{formatarMoeda(rateioPreview.local)}</strong></div>
              )}
              {rateioPreview.missoes > 0 && (
                <div>✝️ Missões (100%): <strong>{formatarMoeda(rateioPreview.missoes)}</strong></div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            💳 Forma de Recebimento *
          </label>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <input
                type="radio"
                value="pix"
                checked={formaRecebimento === 'pix'}
                onChange={(e) => setFormaRecebimento(e.target.value)}
                style={{ marginRight: '8px' }}
              />
              📱 PIX / Transferência
            </label>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <input
                type="radio"
                value="dinheiro"
                checked={formaRecebimento === 'dinheiro'}
                onChange={(e) => setFormaRecebimento(e.target.value)}
                style={{ marginRight: '8px' }}
              />
              💵 Dinheiro
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            📝 Descrição (opcional)
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Dízimo referente ao mês de Janeiro"
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical'
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
            backgroundColor: carregando ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: carregando ? 'not-allowed' : 'pointer'
          }}
        >
          {carregando ? '⏳ Salvando...' : '💾 Salvar Entrada'}
        </button>
      </form>
    </div>
  );
}

export default FormEntrada;