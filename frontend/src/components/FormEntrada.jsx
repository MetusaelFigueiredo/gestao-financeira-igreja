import React, { useState, useEffect } from 'react';
import { adicionarEntrada, atualizarEntrada } from '../services/entradas';
import { buscarMembros } from '../services/membros';
import { buscarEventosAbertos } from '../services/eventos';
import { formatarMoeda, dataParaString } from '../utils/formatacao';
import UploadComprovante from './UploadComprovante';

function FormEntrada({ onSucesso, usuarioEmail, entradaParaEdicao = null }) {
  const hoje = dataParaString(new Date());
  
  // Calcular data máxima (30 dias no futuro)
  const dataMaxima = new Date();
  dataMaxima.setDate(dataMaxima.getDate() + 30);
  const dataMaximaString = dataParaString(dataMaxima);
  
  const [tipo, setTipo] = useState('dizimo');
  const [data, setData] = useState(hoje);
  const [valor, setValor] = useState('');
  const [formaRecebimento, setFormaRecebimento] = useState('pix');
  const [descricao, setDescricao] = useState('');
  
  const [membroId, setMembroId] = useState('');
  const [membros, setMembros] = useState([]);
  
  // Estados para eventos
  const [eventoId, setEventoId] = useState('');
  const [eventos, setEventos] = useState([]);
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  
  // Estados para comprovante PIX
  const [comprovante, setComprovante] = useState(null);
  const [uploadandoComprovante, setUploadandoComprovante] = useState(false);
  
  // Estados para modo de edição
  const [modoEdicao, setModoEdicao] = useState(false);
  const [entradaId, setEntradaId] = useState(null);

  useEffect(() => {
    carregarMembros();
    carregarEventos();
  }, []);

  const carregarEventos = async () => {
    const resultado = await buscarEventosAbertos();
    if (resultado.success) {
      setEventos(resultado.eventos);
      // Se há apenas um evento aberto, selecioná-lo automaticamente
      if (resultado.eventos.length === 1 && !eventoId) {
        setEventoId(resultado.eventos[0].id);
      }
    }
  };

  // Preencher formulário quando há entrada para edição
  useEffect(() => {
    if (entradaParaEdicao) {
      setModoEdicao(true);
      setEntradaId(entradaParaEdicao.id);
      setTipo(entradaParaEdicao.tipo || 'dizimo');
      setData(entradaParaEdicao.data ? dataParaString(new Date(entradaParaEdicao.data)) : hoje);
      setValor(entradaParaEdicao.valor?.toString() || '');
      setFormaRecebimento(entradaParaEdicao.formaRecebimento || 'pix');
      setDescricao(entradaParaEdicao.descricao || '');
      setMembroId(entradaParaEdicao.membroId || '');
      setEventoId(entradaParaEdicao.eventoId || '');
    }
  }, [entradaParaEdicao]);

  const carregarMembros = async () => {
    const resultado = await buscarMembros();
    if (resultado.success) {
      setMembros(resultado.membros);
    }
  };

  const valorNum = parseFloat(valor) || 0;
  let rateioPreview = { central: 0, local: 0, missoes: 0 };
  
  if (tipo === 'santa_ceia') {
    rateioPreview = { central: 0, local: 0, missoes: valorNum };
  } else if (tipo === 'dizimo' || tipo === 'oferta') {
    // 🔧 CORREÇÃO: Usar Math.round para evitar problemas de ponto flutuante
    const central = Math.round(valorNum * 0.60 * 100) / 100;
    const local = Math.round(valorNum * 0.40 * 100) / 100;
    rateioPreview = { central: central, local: local, missoes: 0 };
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

    // ⚠️ SEMPRE exige evento - toda entrada deve estar vinculada a um evento
    if (!eventoId) {
      if (eventos.length === 0) {
        setErro('Nenhum evento aberto encontrado. Crie um evento primeiro para registrar entradas.');
      } else {
        setErro('Selecione o evento para esta entrada');
      }
      return;
    }
    
    setCarregando(true);
    
    const dadosEntrada = {
      tipo,
      data,
      valor: valorNum,
      formaRecebimento,
      descricao,
      eventoId: eventoId || null
    };

    // Adicionar comprovante se for PIX e houver comprovante
    if (formaRecebimento === 'pix' && comprovante) {
      dadosEntrada.comprovante = comprovante;
    }

    if (tipo === 'dizimo' && membroId) {
      const membro = membros.find(m => m.id === membroId);
      dadosEntrada.membroId = membroId;
      dadosEntrada.membroNome = membro?.nome;
    }
    
    let resultado;
    if (modoEdicao && entradaId) {
      resultado = await atualizarEntrada(entradaId, dadosEntrada, usuarioEmail);
    } else {
      resultado = await adicionarEntrada(dadosEntrada, usuarioEmail);
    }
    
    setCarregando(false);
    
    if (resultado.success) {
      const tipoNome = tipo === 'dizimo' ? 'Dízimo' :
                       tipo === 'oferta' ? 'Oferta' :
                       tipo === 'santa_ceia' ? 'Oferta Santa Ceia' : 'Entrada';
      
      const acao = modoEdicao ? 'atualizado' : 'lançado';
      setSucesso(`${tipoNome} de ${formatarMoeda(valorNum)} ${acao} com sucesso!`);
      
      // Limpar formulário após sucesso
      if (!modoEdicao) {
        setValor('');
        setDescricao('');
        setMembroId('');
        setData(hoje);
        setComprovante(null);
      }
      
      if (onSucesso) onSucesso();
      
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro('Erro ao salvar: ' + resultado.error);
    }
  };

  const handleUploadComprovante = (comprovanteData) => {
    setComprovante(comprovanteData);
    console.log('✅ Comprovante carregado:', comprovanteData);
  };

  const cancelarEdicao = () => {
    setModoEdicao(false);
    setEntradaId(null);
    setTipo('dizimo');
    setData(hoje);
    setValor('');
    setFormaRecebimento('pix');
    setDescricao('');
    setMembroId('');
    setEventoId('');
    setComprovante(null);
    setErro('');
    setSucesso('');
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e8eaed'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: '500',
          color: '#202124',
          margin: 0
        }}>
          {modoEdicao ? '✏️ Editar Entrada' : 'Nova Entrada'}
        </h2>
        
        {modoEdicao && (
          <button
            type="button"
            onClick={cancelarEdicao}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f1f3f4',
              color: '#5f6368',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ✖️ Cancelar
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* Tipo */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#5f6368'
            }}>
              Tipo de Entrada *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                color: '#202124',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="dizimo">Dízimo</option>
              <option value="oferta">Oferta Comum</option>
              <option value="santa_ceia">Santa Ceia</option>
              <option value="cantina">Cantina</option>
              <option value="promocao">Promoção/Evento</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          {/* Evento */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#5f6368'
            }}>
              🎯 Evento *
            </label>
            <select
              value={eventoId}
              onChange={(e) => setEventoId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                color: eventoId ? '#202124' : '#9aa0a6',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Selecione o evento</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.nomeEvento} - {evento.dataEvento?.toLocaleDateString('pt-BR')}
                </option>
              ))}
            </select>
            {eventos.length === 0 && (
              <div style={{
                fontSize: '0.75rem',
                color: '#ea4335',
                marginTop: '4px'
              }}>
                ⚠️ Nenhum evento aberto. Crie um evento primeiro.
              </div>
            )}
          </div>

          {/* Data */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#5f6368'
            }}>
              Data *
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              max={dataMaximaString}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                color: '#202124',
                outline: 'none'
              }}
              required
            />
          </div>

          {/* Valor */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#5f6368'
            }}>
              Valor (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                color: '#202124',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
              onBlur={(e) => e.target.style.borderColor = '#dadce0'}
              required
            />
          </div>
        </div>

        {/* Membro (se for dízimo) */}
        {tipo === 'dizimo' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#5f6368'
            }}>
              Membro Dizimista *
            </label>
            <select
              value={membroId}
              onChange={(e) => setMembroId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                color: '#202124',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer'
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
                marginTop: '8px', 
                fontSize: '0.8125rem', 
                color: '#ea4335'
              }}>
                Nenhum membro cadastrado. Cadastre membros primeiro!
              </p>
            )}
          </div>
        )}

        {/* Preview do Rateio */}
        {valorNum > 0 && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e8eaed'
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#5f6368',
              marginBottom: '12px'
            }}>
              Distribuição Automática:
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px'
            }}>
              {rateioPreview.central > 0 && (
                <div style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: '#5f6368' }}>Central:</span>{' '}
                  <strong style={{ color: '#202124' }}>{formatarMoeda(rateioPreview.central)}</strong>
                </div>
              )}
              {rateioPreview.local > 0 && (
                <div style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: '#5f6368' }}>Local:</span>{' '}
                  <strong style={{ color: '#202124' }}>{formatarMoeda(rateioPreview.local)}</strong>
                </div>
              )}
              {rateioPreview.missoes > 0 && (
                <div style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: '#5f6368' }}>Missões:</span>{' '}
                  <strong style={{ color: '#202124' }}>{formatarMoeda(rateioPreview.missoes)}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forma de Recebimento */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#5f6368'
          }}>
            Forma de Recebimento *
          </label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: '#5f6368'
            }}>
              <input
                type="radio"
                value="pix"
                checked={formaRecebimento === 'pix'}
                onChange={(e) => setFormaRecebimento(e.target.value)}
                style={{ marginRight: '6px' }}
              />
              PIX/Transferência
            </label>
            <label style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: '#5f6368'
            }}>
              <input
                type="radio"
                value="dinheiro"
                checked={formaRecebimento === 'dinheiro'}
                onChange={(e) => setFormaRecebimento(e.target.value)}
                style={{ marginRight: '6px' }}
              />
              Dinheiro
            </label>
          </div>
        </div>

        {/* Upload de Comprovante PIX */}
        {formaRecebimento === 'pix' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#5f6368'
            }}>
              Comprovante PIX (opcional)
            </label>
            <UploadComprovante onUploadComplete={handleUploadComprovante} />
            {comprovante && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#2e7d32'
              }}>
                ✅ Comprovante carregado: {comprovante.nome}
              </div>
            )}
          </div>
        )}

        {/* Descrição */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#5f6368'
          }}>
            Descrição (opcional)
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Dízimo referente ao mês de Janeiro"
            rows="2"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              fontSize: '0.9375rem',
              color: '#202124',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
            onBlur={(e) => e.target.style.borderColor = '#dadce0'}
          />
        </div>

        {/* Mensagens */}
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

        {/* Botão */}
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
          {carregando ? 'Salvando...' : 'Salvar Entrada'}
        </button>
      </form>
    </div>
  );
}

export default FormEntrada;