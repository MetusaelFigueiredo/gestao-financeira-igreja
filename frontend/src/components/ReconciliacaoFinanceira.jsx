import React from 'react';

const ReconciliacaoFinanceira = ({ entradas, formatarMoeda }) => {
  // Cálculos da reconciliação baseados na lógica correta
  let totalPix = 0;
  let totalDinheiro = 0;
  let centralPix = 0;
  let centralDinheiro = 0;
  let localPix = 0;
  let localDinheiro = 0;

  // Filtrar apenas Dízimo e Oferta para reconciliação
  const entradasReconciliacao = (entradas || []).filter(entrada => {
    const tipo = entrada.tipo?.toLowerCase() || '';
    return tipo === 'dizimo' || tipo === 'oferta';
  });

  // Calcular valores por forma de recebimento
  entradasReconciliacao.forEach(entrada => {
    const valor = parseFloat(entrada.valor) || 0;
    const rateio = entrada.rateio || {};

    if (entrada.formaRecebimento === 'pix') {
      totalPix += valor;
      centralPix += (rateio.central || 0);
      localPix += (rateio.local || 0);
    } else if (entrada.formaRecebimento === 'dinheiro') {
      totalDinheiro += valor;
      centralDinheiro += (rateio.central || 0);
      localDinheiro += (rateio.local || 0);
    }
  });

  // Cálculos da reconciliação
  const centralDeveDevolver = Math.round(totalPix * 0.40 * 100) / 100;
  const localDeveRepassar = Math.round(totalDinheiro * 0.60 * 100) / 100;
  const saldoFinal = Math.round((centralDeveDevolver - localDeveRepassar) * 100) / 100;
  const favorecido = saldoFinal >= 0 ? 'local' : 'central';

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '28px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #e8eaed'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#202124',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        ⚖️ Reconciliação Financeira
      </h2>
      
      <p style={{
        fontSize: '0.875rem',
        color: '#6b7280',
        marginBottom: '24px',
        lineHeight: '1.5'
      }}>
        Comparação PIX vs Dinheiro • Rateio 60% Central / 40% Local • Apenas Dízimo e Oferta
      </p>

      {/* Cards Principais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        
        {/* PIX Total */}
        <div style={{
          backgroundColor: '#e3f2fd',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #2196f3',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#1565c0',
            fontWeight: '600',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            💳 Total PIX
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1565c0',
            marginBottom: '8px'
          }}>
            {formatarMoeda(totalPix)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#1565c0',
            lineHeight: '1.4'
          }}>
            Central: {formatarMoeda(centralPix)}
            <br />
            Local: {formatarMoeda(localPix)}
          </div>
        </div>

        {/* Dinheiro Total */}
        <div style={{
          backgroundColor: '#e8f5e8',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #4caf50',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#2e7d32',
            fontWeight: '600',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            💵 Total Dinheiro
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#2e7d32',
            marginBottom: '8px'
          }}>
            {formatarMoeda(totalDinheiro)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#2e7d32',
            lineHeight: '1.4'
          }}>
            Central: {formatarMoeda(centralDinheiro)}
            <br />
            Local: {formatarMoeda(localDinheiro)}
          </div>
        </div>

        {/* Central Deve Devolver */}
        <div style={{
          backgroundColor: '#fff3e0',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #ff9800',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#e65100',
            fontWeight: '600',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            ↩️ Central Deve Devolver
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#e65100',
            marginBottom: '8px'
          }}>
            {formatarMoeda(centralDeveDevolver)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#e65100'
          }}>
            40% dos PIX
          </div>
        </div>

        {/* Local Deve Repassar */}
        <div style={{
          backgroundColor: '#fce4ec',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #e91e63',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#c2185b',
            fontWeight: '600',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            ↪️ Local Deve Repassar
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#c2185b',
            marginBottom: '8px'
          }}>
            {formatarMoeda(localDeveRepassar)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#c2185b'
          }}>
            60% do dinheiro
          </div>
        </div>
      </div>

      {/* Resultado Final */}
      <div style={{
        backgroundColor: favorecido === 'local' ? '#e8f5e8' : '#fff3e0',
        borderRadius: '12px',
        padding: '24px',
        border: `3px solid ${favorecido === 'local' ? '#4caf50' : '#ff9800'}`,
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: favorecido === 'local' ? '#2e7d32' : '#e65100',
          marginBottom: '8px'
        }}>
          {favorecido === 'local' ? '✅ RESULTADO FINAL' : '⚠️ RESULTADO FINAL'}
        </div>
        <div style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: favorecido === 'local' ? '#2e7d32' : '#e65100',
          marginBottom: '8px'
        }}>
          {formatarMoeda(Math.abs(saldoFinal))}
        </div>
        <div style={{
          fontSize: '1rem',
          color: favorecido === 'local' ? '#2e7d32' : '#e65100',
          fontWeight: '500'
        }}>
          {saldoFinal >= 0 
            ? `Local tem a receber R$ ${Math.abs(saldoFinal).toFixed(2)}`
            : `Local deve devolver R$ ${Math.abs(saldoFinal).toFixed(2)}`
          }
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          marginTop: '12px'
        }}>
          Baseado em {entradasReconciliacao.length} entrada(s) de Dízimo/Oferta
        </div>
      </div>

      {/* Resumo Detalhado */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          color: '#374151',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📊 Resumo da Reconciliação
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              📋 Entradas Consideradas
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#374151'
            }}>
              {entradasReconciliacao.length}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              Apenas Dízimo e Oferta
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              💰 Total Geral
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#374151'
            }}>
              {formatarMoeda(totalPix + totalDinheiro)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              PIX + Dinheiro
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🏛️ Total Central
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#374151'
            }}>
              {formatarMoeda(centralPix + centralDinheiro)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              60% do total
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🏠 Total Local
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#374151'
            }}>
              {formatarMoeda(localPix + localDinheiro)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              40% do total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReconciliacaoFinanceira;