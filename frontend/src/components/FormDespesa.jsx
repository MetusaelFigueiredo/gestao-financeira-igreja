import React, { useState } from 'react';
import { adicionarDespesa, adicionarDespesaParcelada, categoriasDespesas } from '../services/despesas';
import { formatarMoeda, dataParaString } from '../utils/formatacao';
import UploadComprovante from './UploadComprovante';

function FormDespesa({ onSucesso, usuarioEmail }) {
  const hoje = dataParaString(new Date());
  
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState(hoje);
  const [categoria, setCategoria] = useState('utilidades');
  const [subcategoria, setSubcategoria] = useState('Luz');
  const [formaPagamento, setFormaPagamento] = useState('pix');
  
  const [fornecedor, setFornecedor] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  const [parcelado, setParcelado] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState(2);
  
  const [comprovante, setComprovante] = useState(null);
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleCategoriaChange = (e) => {
    const novaCategoria = e.target.value;
    setCategoria(novaCategoria);
    setSubcategoria(categoriasDespesas[novaCategoria].subcategorias[0]);
  };

  const handleUploadComplete = (comprovanteData) => {
    setComprovante(comprovanteData);
    console.log('✅ Comprovante anexado:', comprovanteData.nome);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    
    if (!descricao || descricao.trim().length < 3) {
      setErro('Descrição muito curta (mínimo 3 caracteres)');
      return;
    }
    
    const valorNum = parseFloat(valor);
    if (!valor || valorNum <= 0) {
      setErro('Digite um valor válido');
      return;
    }

    if (!dataVencimento) {
      setErro('Selecione a data de vencimento');
      return;
    }
    
    if (parcelado && (numeroParcelas < 2 || numeroParcelas > 99)) {
      setErro('Número de parcelas inválido (entre 2 e 99)');
      return;
    }
    
    setCarregando(true);
    
    const dadosDespesa = {
      descricao: descricao.trim(),
      valor: valorNum,
      dataVencimento,
      categoria,
      subcategoria,
      formaPagamento,
      fornecedor: fornecedor.trim(),
      numeroDocumento: numeroDocumento.trim(),
      observacoes: observacoes.trim(),
      comprovante,
      criadoPor: usuarioEmail
    };

    let resultado;
    
    if (parcelado) {
      dadosDespesa.numeroParcelas = parseInt(numeroParcelas);
      resultado = await adicionarDespesaParcelada(dadosDespesa);
    } else {
      resultado = await adicionarDespesa(dadosDespesa);
    }
    
    setCarregando(false);
    
    if (resultado.success) {
      const mensagem = parcelado 
        ? `Despesa parcelada em ${numeroParcelas}x criada com sucesso!`
        : `Despesa de ${formatarMoeda(valorNum)} cadastrada com sucesso!`;
      
      setSucesso(mensagem);
      
      // Limpar formulário
      setDescricao('');
      setValor('');
      setDataVencimento(hoje);
      setCategoria('utilidades');
      setSubcategoria('Luz');
      setFormaPagamento('pix');
      setFornecedor('');
      setNumeroDocumento('');
      setObservacoes('');
      setParcelado(false);
      setNumeroParcelas(2);
      setComprovante(null);
      
      if (onSucesso) onSucesso();
      
      setTimeout(() => setSucesso(''), 4000);
    } else {
      setErro('Erro ao salvar: ' + resultado.error);
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      border: '2px solid #e8eaed'
    }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#202124',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        💸 Nova Despesa
      </h2>
      
      <form onSubmit={handleSubmit}>
        {/* Linha 1: Descrição e Valor */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#5f6368'
            }}>
              Descrição *
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Conta de Luz - Novembro/2025"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #dadce0',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                color: '#202124',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
              onBlur={(e) => e.target.style.borderColor = '#dadce0'}
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
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
                padding: '12px',
                border: '2px solid #dadce0',
                borderRadius: '8px',
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

        {/* Linha 2: Vencimento, Categoria e Subcategoria */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#5f6368'
            }}>
              Vencimento *
            </label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #dadce0',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                color: '#202124',
                outline: 'none'
              }}
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#5f6368'
            }}>
              Categoria *
            </label>
            <select
              value={categoria}
              onChange={handleCategoriaChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #dadce0',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                color: '#202124',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {Object.keys(categoriasDespesas).map(key => (
                <option key={key} value={key}>
                  {categoriasDespesas[key].nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#5f6368'
            }}>
              Subcategoria *
            </label>
            <select
              value={subcategoria}
              onChange={(e) => setSubcategoria(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #dadce0',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                color: '#202124',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {categoriasDespesas[categoria].subcategorias.map(sub => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha 3: Forma de Pagamento */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#5f6368'
          }}>
            Forma de Pagamento *
          </label>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {[
              { valor: 'pix', label: '💳 PIX', cor: '#1a73e8' },
              { valor: 'dinheiro', label: '💵 Dinheiro', cor: '#34a853' },
              { valor: 'cartao_credito', label: '💳 Cartão Crédito', cor: '#fbbc04' }
            ].map(forma => (
              <label key={forma.valor} style={{
                flex: '1',
                minWidth: '140px',
                padding: '14px',
                border: formaPagamento === forma.valor ? `3px solid ${forma.cor}` : '2px solid #dadce0',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: formaPagamento === forma.valor ? forma.cor : '#5f6368',
                backgroundColor: formaPagamento === forma.valor ? `${forma.cor}10` : '#ffffff',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <input
                  type="radio"
                  value={forma.valor}
                  checked={formaPagamento === forma.valor}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  style={{ display: 'none' }}
                />
                {forma.label}
              </label>
            ))}
          </div>
        </div>

        {/* Parcelamento */}
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: parcelado ? '#e8f0fe' : '#f8f9fa',
          borderRadius: '8px',
          border: parcelado ? '2px solid #1a73e8' : '2px solid #e8eaed'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            fontWeight: '600',
            color: '#202124',
            marginBottom: parcelado ? '16px' : '0'
          }}>
            <input
              type="checkbox"
              checked={parcelado}
              onChange={(e) => setParcelado(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            🔄 Parcelar esta despesa
          </label>

          {parcelado && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: '16px',
              marginTop: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: '#5f6368'
                }}>
                  Nº de Parcelas
                </label>
                <input
                  type="number"
                  min="2"
                  max="99"
                  value={numeroParcelas}
                  onChange={(e) => setNumeroParcelas(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #1a73e8',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    color: '#202124',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '2px solid #1a73e8'
              }}>
                <div style={{
                  fontSize: '0.8125rem',
                  color: '#5f6368'
                }}>
                  <strong style={{ color: '#1a73e8', fontSize: '1rem' }}>
                    {numeroParcelas}x
                  </strong>
                  {' de '}
                  <strong style={{ color: '#202124', fontSize: '1rem' }}>
                    {valor ? formatarMoeda(parseFloat(valor) / parseInt(numeroParcelas)) : 'R$ 0,00'}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Campos Opcionais */}
        <details style={{ marginBottom: '24px' }}>
          <summary style={{
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#5f6368',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e8eaed'
          }}>
            📋 Campos Adicionais (opcional)
          </summary>

          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: '#5f6368'
                }}>
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  placeholder="Ex: CEMIG"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dadce0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#202124',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: '#5f6368'
                }}>
                  Nº Documento
                </label>
                <input
                  type="text"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  placeholder="Ex: 123456789"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dadce0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#202124',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: '#5f6368'
              }}>
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações adicionais..."
                rows="2"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dadce0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#202124',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </details>

        {/* Upload de Comprovante */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#5f6368'
          }}>
            📎 Comprovante (opcional)
          </label>
          
          {!comprovante ? (
            <UploadComprovante onUploadComplete={handleUploadComplete} />
          ) : (
            <div style={{
              padding: '16px',
              backgroundColor: '#e6f4ea',
              borderRadius: '8px',
              border: '2px solid #34a853',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  fontSize: '1.5rem'
                }}>
                  {comprovante.tipo === 'application/pdf' ? '📄' : '🖼️'}
                </div>
                <div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#137333'
                  }}>
                    ✅ Arquivo anexado
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#5f6368'
                  }}>
                    {comprovante.nome} • {(comprovante.tamanho / 1024).toFixed(0)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setComprovante(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffffff',
                  color: '#ea4335',
                  border: '1px solid #ea4335',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Remover
              </button>
            </div>
          )}
        </div>

        {/* Mensagens */}
        {erro && (
          <div style={{
            backgroundColor: '#fce8e6',
            color: '#c5221f',
            padding: '14px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            border: '2px solid #f5c6cb',
            fontWeight: '500'
          }}>
            ❌ {erro}
          </div>
        )}
        
        {sucesso && (
          <div style={{
            backgroundColor: '#e6f4ea',
            color: '#137333',
            padding: '14px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            border: '2px solid #c6e1c6',
            fontWeight: '500'
          }}>
            ✅ {sucesso}
          </div>
        )}

        {/* Botões */}
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={() => {
              setDescricao('');
              setValor('');
              setDataVencimento(hoje);
              setCategoria('utilidades');
              setSubcategoria('Luz');
              setFormaPagamento('pix');
              setFornecedor('');
              setNumeroDocumento('');
              setObservacoes('');
              setParcelado(false);
              setNumeroParcelas(2);
              setComprovante(null);
              setErro('');
              setSucesso('');
            }}
            style={{
              flex: '1',
              padding: '14px',
              backgroundColor: '#ffffff',
              color: '#5f6368',
              border: '2px solid #dadce0',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Limpar
          </button>

          <button
            type="submit"
            disabled={carregando}
            style={{
              flex: '2',
              padding: '14px',
              backgroundColor: carregando ? '#dadce0' : '#ea4335',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: carregando ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!carregando) e.currentTarget.style.backgroundColor = '#d33828';
            }}
            onMouseLeave={(e) => {
              if (!carregando) e.currentTarget.style.backgroundColor = '#ea4335';
            }}
          >
            {carregando ? 'Salvando...' : '💾 Cadastrar Despesa'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormDespesa;