import React from 'react';

const MetaMissoes = ({ 
  missoes, 
  formatarMoeda, 
  modoEdicaoMeta, 
  setModoEdicaoMeta, 
  novaMeta, 
  setNovaMeta, 
  onAtualizarMeta 
}) => {
  const progressoAtual = parseFloat(missoes?.progresso) || 0;
  const metaAlcancada = progressoAtual >= 100;
  const faltaParaMeta = missoes?.falta || 0;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #e8eaed'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#202124',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        ⛪ Meta de Missões
      </h2>

      {/* Cards Principais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        
        {/* Arrecadado */}
        <div style={{
          backgroundColor: '#f0fdf4',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #22c55e',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: '#15803d',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            💰 Arrecadado
          </h3>
          <div style={{
            fontSize: '2.25rem',
            fontWeight: '700',
            color: '#15803d',
            marginBottom: '8px',
            letterSpacing: '-1px'
          }}>
            {formatarMoeda(missoes?.arrecadado || 0)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            Valor consolidado do mês
          </div>
        </div>

        {/* Meta */}
        <div style={{
          backgroundColor: '#eff6ff',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #3b82f6',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: '#1d4ed8',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            🎯 Meta Estabelecida
          </h3>
          <div style={{
            fontSize: '2.25rem',
            fontWeight: '700',
            color: '#1d4ed8',
            marginBottom: '8px',
            letterSpacing: '-1px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            {formatarMoeda(missoes?.meta || 0)}
            {!modoEdicaoMeta && (
              <button
                onClick={() => setModoEdicaoMeta(true)}
                style={{
                  backgroundColor: '#1d4ed8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1e40af'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              >
                ✏️ Editar
              </button>
            )}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            Objetivo mensal definido
          </div>
        </div>

        {/* Progresso */}
        <div style={{
          backgroundColor: metaAlcancada ? '#f0fdf4' : '#fffbeb',
          borderRadius: '12px',
          padding: '20px',
          border: `2px solid ${metaAlcancada ? '#22c55e' : '#f59e0b'}`,
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: metaAlcancada ? '#15803d' : '#d97706',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📊 Progresso Atual
          </h3>
          <div style={{
            fontSize: '2.25rem',
            fontWeight: '700',
            color: metaAlcancada ? '#15803d' : '#d97706',
            marginBottom: '8px',
            letterSpacing: '-1px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {progressoAtual.toFixed(1)}%
            {metaAlcancada && <span style={{ fontSize: '1.5rem' }}>🎉</span>}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            {metaAlcancada ? 'Meta alcançada!' : 'Da meta estabelecida'}
          </div>
        </div>

        {/* Falta/Excedente */}
        <div style={{
          backgroundColor: faltaParaMeta <= 0 ? '#f0fdf4' : '#fef2f2',
          borderRadius: '12px',
          padding: '20px',
          border: `2px solid ${faltaParaMeta <= 0 ? '#22c55e' : '#ef4444'}`,
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: faltaParaMeta <= 0 ? '#15803d' : '#dc2626',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {faltaParaMeta <= 0 ? '🎉 Excedente' : '📈 Restante'}
          </h3>
          <div style={{
            fontSize: '2.25rem',
            fontWeight: '700',
            color: faltaParaMeta <= 0 ? '#15803d' : '#dc2626',
            marginBottom: '8px',
            letterSpacing: '-1px'
          }}>
            {faltaParaMeta <= 0 ? formatarMoeda(Math.abs(faltaParaMeta)) : formatarMoeda(faltaParaMeta)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            {faltaParaMeta <= 0 ? 'Valor acima da meta' : 'Para atingir o objetivo'}
          </div>
        </div>
      </div>

      {/* Barra de Progresso Visual */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            📈 Progresso Visual
          </span>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: metaAlcancada ? '#15803d' : '#6b7280'
          }}>
            {progressoAtual.toFixed(1)}% concluído
          </span>
        </div>
        
        <div style={{
          backgroundColor: '#e5e7eb',
          borderRadius: '10px',
          height: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            backgroundColor: metaAlcancada ? '#22c55e' : progressoAtual > 80 ? '#f59e0b' : '#3b82f6',
            height: '100%',
            width: `${Math.min(progressoAtual, 100)}%`,
            borderRadius: '10px',
            transition: 'width 0.5s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: progressoAtual > 15 ? '8px' : '0'
          }}>
            {progressoAtual > 15 && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#ffffff'
              }}>
                {progressoAtual.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px'
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            R$ 0
          </span>
          <span style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            {formatarMoeda(missoes?.meta || 0)}
          </span>
        </div>
      </div>

      {/* Edição de Meta */}
      {modoEdicaoMeta && (
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #3b82f6',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#1d4ed8',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ✏️ Editar Meta de Missões
          </h3>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <input
              type="number"
              value={novaMeta}
              onChange={(e) => setNovaMeta(e.target.value)}
              placeholder="Nova meta (R$)"
              style={{
                padding: '12px 16px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                flex: '1',
                minWidth: '200px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <button
              onClick={onAtualizarMeta}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#15803d'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#16a34a'}
            >
              ✅ Salvar Meta
            </button>
            <button
              onClick={() => {
                setModoEdicaoMeta(false);
                setNovaMeta(missoes?.meta || 0);
              }}
              style={{
                backgroundColor: '#6b7280',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaMissoes;