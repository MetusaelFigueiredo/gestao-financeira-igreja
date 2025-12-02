import React, { useState, useEffect, useMemo, useCallback } from 'react';
import FormEntrada from '../components/FormEntrada';
import { buscarEntradas } from '../services/entradas';
import { formatarMoeda } from '../utils/formatacao';

function EntradasNew({ usuarioEmail }) {
  console.log('🟢 ARQUIVO: EntradasNew.jsx - VERSÃO TABELA SIMPLES');
  
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Estados para paginação e busca
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const itensPorPagina = 15;

  // Carregar entradas ao montar
  useEffect(() => {
    carregarEntradas();
  }, []);

  const carregarEntradas = async () => {
    setCarregando(true);
    const resultado = await buscarEntradas();

    if (resultado.success) {
      console.log('✅ Entradas carregadas:', resultado.entradas.length);
      setEntradas(resultado.entradas);
    } else {
      console.error('❌ Erro ao carregar entradas:', resultado.error);
    }

    setCarregando(false);
  };

  // Obter nome do tipo de entrada
  const obterNomeTipo = (tipo) => {
    const tipos = {
      dizimo: 'Dízimo',
      oferta: 'Oferta',
      santa_ceia: 'Santa Ceia',
      cantina: 'Cantina',
      promocao: 'Promoção',
      outros: 'Outros'
    };
    return tipos[tipo] || tipo;
  };

  // Obter cor do tipo
  const obterCorTipo = (tipo) => {
    const cores = {
      dizimo: '#1a73e8',
      oferta: '#34a853',
      santa_ceia: '#fbbc04',
      cantina: '#ea4335',
      promocao: '#9334e6',
      outros: '#5f6368'
    };
    return cores[tipo] || '#5f6368';
  };

  // Formatar data
  const formatarData = (data) => {
    if (!data) return '-';
    try {
      const dataObj = data instanceof Date ? data : new Date(data);
      if (isNaN(dataObj.getTime())) return '-';
      return dataObj.toLocaleDateString('pt-BR');
    } catch (error) {
      return '-';
    }
  };

  // Filtrar entradas por busca
  const entradasFiltradas = useMemo(() => {
    if (!termoBusca.trim()) return entradas;

    const termo = termoBusca.toLowerCase();
    return entradas.filter(entrada =>
      entrada.membroNome?.toLowerCase().includes(termo) ||
      entrada.descricao?.toLowerCase().includes(termo) ||
      entrada.tipo?.toLowerCase().includes(termo)
    );
  }, [entradas, termoBusca]);

  // Calcular paginação
  const entradasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return entradasFiltradas.slice(inicio, fim);
  }, [entradasFiltradas, paginaAtual]);

  const totalPaginas = Math.ceil(entradasFiltradas.length / itensPorPagina);

  // Resetar página ao buscar
  useEffect(() => {
    setPaginaAtual(1);
  }, [termoBusca]);

  // Callback após adicionar entrada
  const handleEntradaAdicionada = useCallback(async () => {
    await carregarEntradas();
  }, []);

  // Calcular totais
  const totais = useMemo(() => {
    return entradasFiltradas.reduce((acc, entrada) => ({
      total: acc.total + (entrada.valor || 0),
      count: acc.count + 1
    }), { total: 0, count: 0 });
  }, [entradasFiltradas]);

  if (carregando) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center',
        margin: '20px'
      }}>
        ⏳ Carregando entradas...
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Formulário de Nova Entrada */}
      <div style={{ marginBottom: '30px' }}>
        <FormEntrada
          usuarioEmail={usuarioEmail}
          onEntradaAdicionada={handleEntradaAdicionada}
        />
      </div>

      {/* Tabela de Entradas */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Cabeçalho com busca e totais */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h2 style={{ color: '#2c3e50', margin: 0 }}>
              💵 Histórico de Entradas
            </h2>
            <p style={{ margin: '5px 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
              {totais.count} lançamento(s) • Total: <strong style={{ color: '#34a853' }}>{formatarMoeda(totais.total)}</strong>
            </p>
          </div>

          <input
            type="text"
            placeholder="🔍 Buscar por membro, tipo..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '0.95rem',
              width: '280px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        {entradasPaginadas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#7f8c8d'
          }}>
            {termoBusca ? '🔍 Nenhuma entrada encontrada' : '📋 Nenhuma entrada cadastrada'}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#5f6368', borderBottom: '2px solid #e8eaed' }}>Data</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#5f6368', borderBottom: '2px solid #e8eaed' }}>Tipo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#5f6368', borderBottom: '2px solid #e8eaed' }}>Membro</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#5f6368', borderBottom: '2px solid #e8eaed' }}>Descrição</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#5f6368', borderBottom: '2px solid #e8eaed' }}>Forma</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#5f6368', borderBottom: '2px solid #e8eaed' }}>Valor</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#5f6368', borderBottom: '2px solid #e8eaed' }}>Comprovante</th>
                  </tr>
                </thead>
                <tbody>
                  {entradasPaginadas.map((entrada, index) => (
                    <tr 
                      key={entrada.id} 
                      style={{ 
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafafa'}
                    >
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed', whiteSpace: 'nowrap' }}>
                        {formatarData(entrada.data)}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: `${obterCorTipo(entrada.tipo)}15`,
                          color: obterCorTipo(entrada.tipo),
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>
                          {obterNomeTipo(entrada.tipo)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed', color: '#202124' }}>
                        {entrada.membroNome || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed', color: '#5f6368', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entrada.descricao || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: entrada.formaPagamento === 'pix' || entrada.formaRecebimento === 'pix' ? '#e3f2fd' : '#fff3e0',
                          color: entrada.formaPagamento === 'pix' || entrada.formaRecebimento === 'pix' ? '#1565c0' : '#e65100',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          textTransform: 'uppercase'
                        }}>
                          {entrada.formaPagamento || entrada.formaRecebimento || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed', textAlign: 'right', fontWeight: '600', color: '#34a853', whiteSpace: 'nowrap' }}>
                        {formatarMoeda(entrada.valor)}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed', textAlign: 'center' }}>
                        {(entrada.comprovanteUrl || entrada.comprovante?.url) ? (
                          <button
                            onClick={() => window.open(entrada.comprovanteUrl || entrada.comprovante?.url, '_blank')}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Ver Comprovante"
                          >
                            📎 Ver
                          </button>
                        ) : (
                          <span style={{ color: '#bbb', fontSize: '0.8rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: paginaAtual === 1 ? '#e0e0e0' : '#4CAF50',
                    color: paginaAtual === 1 ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ← Anterior
                </button>

                <span style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}>
                  Página {paginaAtual} de {totalPaginas}
                </span>

                <button
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: paginaAtual === totalPaginas ? '#e0e0e0' : '#4CAF50',
                    color: paginaAtual === totalPaginas ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EntradasNew;
