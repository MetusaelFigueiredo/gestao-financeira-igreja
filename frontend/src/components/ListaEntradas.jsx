import React, { useState, useEffect } from 'react';
import { buscarEntradas } from '../services/entradas';
import { formatarMoeda, formatarData } from '../utils/formatacao';

function ListaEntradas({ atualizar }) {
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarEntradas();
  }, [atualizar]);

  const carregarEntradas = async () => {
    setCarregando(true);
    const resultado = await buscarEntradas();
    
    if (resultado.success) {
      setEntradas(resultado.entradas);
    }
    
    setCarregando(false);
  };

  // Função para mostrar nome do tipo
  const getNomeTipo = (tipo) => {
    const tipos = {
      dizimo: '💰 Dízimo',
      oferta: '🎁 Oferta',
      santa_ceia: '🍞 Santa Ceia',
      cantina: '🍔 Cantina',
      promocao: '🎉 Promoção',
      outros: '📦 Outros'
    };
    return tipos[tipo] || tipo;
  };

  if (carregando) {
    return (
      <div style={{ 
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center' 
      }}>
        ⏳ Carregando entradas...
      </div>
    );
  }

  if (entradas.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center',
        color: '#7f8c8d'
      }}>
        📋 Nenhuma entrada lançada ainda
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
        📋 Histórico de Entradas ({entradas.length})
      </h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '0.95rem'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Data</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Tipo</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Valor</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Forma</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Rateio</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {entradas.map((entrada) => (
              <tr key={entrada.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '12px' }}>
                  {formatarData(entrada.data)}
                </td>
                <td style={{ padding: '12px' }}>
                  {getNomeTipo(entrada.tipo)}
                </td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'right', 
                  fontWeight: 'bold', 
                  color: '#4CAF50' 
                }}>
                  {formatarMoeda(entrada.valor)}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {entrada.formaRecebimento === 'pix' ? '📱 PIX' : '💵 Dinheiro'}
                </td>
                <td style={{ padding: '12px', fontSize: '0.85rem', color: '#666' }}>
                  {entrada.rateio.central > 0 && (
                    <div>🏛️ Central: {formatarMoeda(entrada.rateio.central)}</div>
                  )}
                  {entrada.rateio.local > 0 && (
                    <div>🏠 Local: {formatarMoeda(entrada.rateio.local)}</div>
                  )}
                  {entrada.rateio.missoes > 0 && (
                    <div>✝️ Missões: {formatarMoeda(entrada.rateio.missoes)}</div>
                  )}
                </td>
                <td style={{ padding: '12px', color: '#7f8c8d' }}>
                  {entrada.descricao || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListaEntradas;