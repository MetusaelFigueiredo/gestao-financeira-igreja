import React, { useState } from 'react';
import { formatarMoeda } from '../utils/formatacao';

function AlertaDivergencia({ entrada, onAceitarComprovante, onManterOriginal, onFechar }) {
  const [carregando, setCarregando] = useState(false);

  const handleAceitarComprovante = async () => {
    setCarregando(true);
    try {
      await onAceitarComprovante(entrada);
    } finally {
      setCarregando(false);
    }
  };

  const handleManterOriginal = async () => {
    setCarregando(true);
    try {
      await onManterOriginal(entrada);
    } finally {
      setCarregando(false);
    }
  };

  // Mostrar se há divergências OU se há dados do comprovante para mostrar
  if (!entrada.processadoPorGeminiAI || !entrada.dadosComprovante) {
    return null;
  }

  const temDivergencias = entrada.divergenciasDetectadas && entrada.divergencias && entrada.divergencias.length > 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '2rem',
            marginRight: '12px'
          }}>
            ⚠️
          </div>
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: temDivergencias ? '#ea4335' : '#34a853',
              margin: 0,
              marginBottom: '4px'
            }}>
              {temDivergencias ? 'Divergências Detectadas' : 'Comprovante Processado'}
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              margin: 0
            }}>
              {temDivergencias 
                ? 'Os dados lançados não coincidem com o comprovante'
                : 'Dados extraídos do comprovante PIX pela IA'
              }
            </p>
          </div>
        </div>

        {/* Seção: Dados Extraídos do Comprovante */}
        <div style={{
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #34a853'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#137333',
            margin: 0,
            marginBottom: '12px'
          }}>
            🤖 Dados Extraídos pela IA
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            fontSize: '0.875rem'
          }}>
            {entrada.dadosComprovante.valor && (
              <div>
                <div style={{ color: '#5f6368', marginBottom: '4px' }}>💰 Valor:</div>
                <div style={{ fontWeight: '600', color: '#137333' }}>
                  {formatarMoeda(entrada.dadosComprovante.valor)}
                </div>
              </div>
            )}
            
            {entrada.dadosComprovante.nome && (
              <div>
                <div style={{ color: '#5f6368', marginBottom: '4px' }}>👤 Nome:</div>
                <div style={{ fontWeight: '600', color: '#137333' }}>
                  {entrada.dadosComprovante.nome}
                </div>
              </div>
            )}
            
            {entrada.dadosComprovante.data && (
              <div>
                <div style={{ color: '#5f6368', marginBottom: '4px' }}>📅 Data:</div>
                <div style={{ fontWeight: '600', color: '#137333' }}>
                  {entrada.dadosComprovante.data}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seção: Comparação (só se houver divergências) */}
        {temDivergencias && (
          <div style={{
            backgroundColor: '#fef7e0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid #fbbc04'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#f9ab00',
              margin: 0,
              marginBottom: '12px'
            }}>
              ⚠️ Divergências Encontradas
            </h3>
            
            {entrada.divergencias.map((div, index) => (
            <div key={index} style={{
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '8px',
              border: '1px solid #e8eaed'
            }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#202124',
                marginBottom: '8px',
                textTransform: 'capitalize'
              }}>
                {div.campo === 'valor' ? '💰 Valor' : 
                 div.campo === 'data' ? '📅 Data' : 
                 div.campo === 'descricao' ? '👤 Nome/Descrição' : div.campo}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '0.875rem'
              }}>
                <div>
                  <div style={{ color: '#5f6368', marginBottom: '4px' }}>
                    Dados Lançados:
                  </div>
                  <div style={{ 
                    color: '#ea4335', 
                    fontWeight: '600',
                    backgroundColor: '#fce8e6',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {div.campo === 'valor' ? formatarMoeda(div.lançado) : div.lançado}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: '#5f6368', marginBottom: '4px' }}>
                    No Comprovante:
                  </div>
                  <div style={{ 
                    color: '#34a853', 
                    fontWeight: '600',
                    backgroundColor: '#e8f5e8',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {div.campo === 'valor' ? formatarMoeda(div.comprovante) : div.comprovante}
                  </div>
                </div>
              </div>
              
              {div.diferenca && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '0.75rem',
                  color: '#5f6368',
                  fontStyle: 'italic'
                }}>
                  Diferença: {div.campo === 'valor' && typeof div.diferenca === 'number' ? 
                    formatarMoeda(div.diferenca) : div.diferenca}
                </div>
              )}
            </div>
          ))}
        </div>
        )}

        {/* Seção: Ações (sempre visível) */}
        <div style={{
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #34a853'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#137333',
            margin: 0,
            marginBottom: '8px'
          }}>
            🤖 O que fazer?
          </h4>
          <p style={{
            fontSize: '0.875rem',
            color: '#5f6368',
            margin: 0,
            lineHeight: '1.4'
          }}>
            Você pode <strong>aceitar os dados do comprovante</strong> (processados por IA) ou 
            <strong> manter os dados originais</strong> que você lançou manualmente.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onFechar}
            disabled={carregando}
            style={{
              padding: '12px 20px',
              backgroundColor: '#f8f9fa',
              color: '#5f6368',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: carregando ? 'not-allowed' : 'pointer',
              opacity: carregando ? 0.6 : 1
            }}
          >
            ❌ Fechar
          </button>
          
          <button
            onClick={handleManterOriginal}
            disabled={carregando}
            style={{
              padding: '12px 20px',
              backgroundColor: '#ea4335',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: carregando ? 'not-allowed' : 'pointer',
              opacity: carregando ? 0.6 : 1
            }}
          >
            🚫 Manter Original
          </button>
          
          <button
            onClick={handleAceitarComprovante}
            disabled={carregando}
            style={{
              padding: '12px 20px',
              backgroundColor: '#34a853',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: carregando ? 'not-allowed' : 'pointer',
              opacity: carregando ? 0.6 : 1
            }}
          >
            {carregando ? '⏳ Processando...' : '✅ Aceitar Comprovante'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertaDivergencia;