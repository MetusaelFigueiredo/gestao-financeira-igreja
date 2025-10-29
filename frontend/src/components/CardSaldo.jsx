import React from 'react';
import { formatarMoeda } from '../utils/formatacao';

function CardSaldo({ titulo, valor, icone, cor }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e8eaed',
      transition: 'all 0.2s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <span style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          fontWeight: '500',
          letterSpacing: '0.5px'
        }}>
          {titulo}
        </span>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: `${cor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem'
        }}>
          {icone}
        </div>
      </div>
      
      <div style={{
        fontSize: '1.875rem',
        fontWeight: '600',
        color: '#202124',
        letterSpacing: '-0.5px'
      }}>
        {formatarMoeda(valor)}
      </div>
    </div>
  );
}

export default CardSaldo;