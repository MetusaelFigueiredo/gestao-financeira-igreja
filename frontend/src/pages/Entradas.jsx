import React, { useState, useEffect } from 'react';
import FormEntrada from '../components/FormEntrada';
import { buscarEntradas } from '../services/entradas';
import { formatarMoeda } from '../utils/formatacao';

function Entradas({ usuarioEmail }) {
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarEntradas();
  }, []);

  const carregarEntradas = async () => {
    setCarregando(true);
    const resultado = await buscarEntradas();
    
    if (resultado.success) {
      setEntradas(resultado.entradas);
    }
    
    setCarregando(false);
  };

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
          Entradas
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: '#5f6368'
        }}>
          Registre dízimos, ofertas e outras entradas financeiras
        </p>
      </div>
      
      {/* Formulário de Lançamento */}
      <div style={{ marginBottom: '32px' }}>
        <FormEntrada onSucesso={carregarEntradas} usuarioEmail={usuarioEmail} />
      </div>
      
      {/* Histórico de Entradas */}
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
            Histórico de Lançamentos
          </h2>
          <span style={{
            fontSize: '0.875rem',
            color: '#5f6368',
            backgroundColor: '#f1f3f4',
            padding: '4px 12px',
            borderRadius: '12px',
            fontWeight: '500'
          }}>
            {entradas.length} {entradas.length === 1 ? 'lançamento' : 'lançamentos'}
          </span>
        </div>
        
        {carregando ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#5f6368'
          }}>
            Carregando entradas...
          </div>
        ) : entradas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#5f6368'
          }}>
            Nenhuma entrada lançada ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {entradas.map(entrada => (
              <div key={entrada.id} style={{
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
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  {/* Badge do Tipo */}
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: `${obterCorTipo(entrada.tipo)}15`,
                    color: obterCorTipo(entrada.tipo),
                    fontSize: '0.8125rem',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>
                    {obterNomeTipo(entrada.tipo)}
                  </div>

                  {/* Informações Principais */}
                  <div>
                    <div style={{
                      fontSize: '0.9375rem',
                      fontWeight: '500',
                      color: '#202124',
                      marginBottom: '4px'
                    }}>
                      {entrada.membroNome && (
                        <span>{entrada.membroNome} • </span>
                      )}
                      <span style={{ color: '#5f6368', fontSize: '0.875rem' }}>
                        {entrada.data.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    {entrada.descricao && (
                      <div style={{
                        fontSize: '0.8125rem',
                        color: '#5f6368',
                        marginBottom: '6px'
                      }}>
                        {entrada.descricao}
                      </div>
                    )}

                    {/* Rateio */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '0.75rem',
                      color: '#5f6368',
                      marginTop: '6px'
                    }}>
                      {entrada.rateio.central > 0 && (
                        <span>Central: {formatarMoeda(entrada.rateio.central)}</span>
                      )}
                      {entrada.rateio.local > 0 && (
                        <span>Local: {formatarMoeda(entrada.rateio.local)}</span>
                      )}
                      {entrada.rateio.missoes > 0 && (
                        <span>Missões: {formatarMoeda(entrada.rateio.missoes)}</span>
                      )}
                    </div>
                  </div>

                  {/* Valor */}
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#34a853',
                    textAlign: 'right',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatarMoeda(entrada.valor)}
                  </div>
                </div>

                {/* Informações de Auditoria */}
                {(entrada.criadoPor || entrada.criadoEm || entrada.editadoPor || entrada.updatedAt) && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e8eaed'
                  }}>
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#5f6368',
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      {entrada.criadoPor && entrada.criadoEm && (
                        <span>
                          ℹ️ Criado por: <strong>{entrada.criadoPor}</strong>
                          {' - '}
                          {entrada.criadoEm?.toDate?.()?.toLocaleDateString?.('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) || 'Data não disponível'}
                        </span>
                      )}

                      {entrada.editadoPor && entrada.updatedAt && (
                        <span>
                          | Editado por: <strong>{entrada.editadoPor}</strong>
                          {' - '}
                          {entrada.updatedAt?.toDate?.()?.toLocaleDateString?.('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) || 'Data não disponível'}
                        </span>
                      )}
                    </div>
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

export default Entradas;