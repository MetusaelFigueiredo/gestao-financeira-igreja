import React, { useState, useEffect } from 'react';
import FormEvento from '../components/FormEvento';
import ListaEventos from '../components/ListaEventos';
import ConferenciaEvento from '../components/ConferenciaEvento';
import { buscarEventosAbertos, buscarEventosEmAnalise } from '../services/eventos';
import { ehPastor } from '../services/usuarios';

// Função helper para formatar datas sem problemas de timezone
const formatarDataEvento = (dataEvento) => {
  if (!dataEvento) return '';
  
  try {
    let data;
    
    // Se for Timestamp do Firebase
    if (dataEvento && typeof dataEvento.toDate === 'function') {
      data = dataEvento.toDate();
    } 
    // Se for string no formato ISO ou timestamp
    else if (typeof dataEvento === 'string' || typeof dataEvento === 'number') {
      data = new Date(dataEvento);
    }
    // Se já for Date
    else if (dataEvento instanceof Date) {
      data = dataEvento;
    } else {
      return '';
    }
    
    // Verificar se a data é válida
    if (isNaN(data.getTime())) {
      return '';
    }
    
    // Formatação local (não UTC) para exibir a data correta
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  } catch (error) {
    console.error('Erro ao formatar data do evento:', error);
    return '';
  }
};

function Eventos({ usuarioEmail, usuarioPerfil }) {
  const [eventosAbertos, setEventosAbertos] = useState([]);
  const [eventosEmAnalise, setEventosEmAnalise] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [eventoConferencia, setEventoConferencia] = useState(null);
  const [carregandoAbertos, setCarregandoAbertos] = useState(true);
  const [carregandoAnalise, setCarregandoAnalise] = useState(false);
  
  // 🔄 Contador para forçar recarregamento da lista de eventos
  const [recarregarContador, setRecarregarContador] = useState(0);

  useEffect(() => {
    carregarEventosAbertos();
    if (ehPastor(usuarioPerfil?.perfil)) {
      carregarEventosEmAnalise();
    }
  }, [usuarioPerfil]);

  const carregarEventosAbertos = async () => {
    setCarregandoAbertos(true);
    const resultado = await buscarEventosAbertos();
    
    if (resultado.success) {
      setEventosAbertos(resultado.eventos);
    }
    
    setCarregandoAbertos(false);
  };

  const carregarEventosEmAnalise = async () => {
    setCarregandoAnalise(true);
    const resultado = await buscarEventosEmAnalise();
    
    if (resultado.success) {
      setEventosEmAnalise(resultado.eventos);
    }
    
    setCarregandoAnalise(false);
  };

  const handleEventoCriado = (novoEvento) => {
    carregarEventosAbertos();
    // 🔄 Incrementa contador para forçar recarregamento da lista completa
    setRecarregarContador(prev => prev + 1);
  };

  const handleEventoSelecionado = (evento) => {
    setEventoSelecionado(evento);
  };

  const handleAbrirConferencia = (evento) => {
    setEventoConferencia(evento);
  };

  const handleFecharConferencia = () => {
    setEventoConferencia(null);
  };

  const handleAcaoCompleta = () => {
    carregarEventosAbertos();
    carregarEventosEmAnalise();
    setEventoConferencia(null);
    // 🔄 Incrementa contador para forçar recarregamento da lista completa
    setRecarregarContador(prev => prev + 1);
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
          Controle de Eventos
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: '#5f6368',
          margin: 0
        }}>
          Crie eventos para organizar as entradas financeiras por culto, reunião ou atividade
        </p>
      </div>

      {/* Cards de Resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* Eventos Abertos */}
        <div style={{
          border: '2px solid #34a853',
          borderRadius: '8px',
          padding: '18px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#34a853', fontWeight: '600' }}>
            🟢 EVENTOS ABERTOS
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '8px', color: '#34a853' }}>
            {carregandoAbertos ? '...' : eventosAbertos.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#9aa0a6', marginTop: '6px' }}>
            Podem receber entradas
          </div>
        </div>

        {/* Evento Selecionado */}
        <div style={{
          border: '2px solid #1a73e8',
          borderRadius: '8px',
          padding: '18px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#1a73e8', fontWeight: '600' }}>
            🎯 EVENTO SELECIONADO
          </div>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginTop: '8px', 
            color: '#1a73e8',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {eventoSelecionado ? eventoSelecionado.nomeEvento : 'Nenhum'}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#9aa0a6', marginTop: '6px' }}>
            {eventoSelecionado 
              ? formatarDataEvento(eventoSelecionado.dataEvento)
              : 'Selecione um evento'
            }
          </div>
        </div>

        {/* Estatísticas do Evento Selecionado */}
        {eventoSelecionado && (
          <>
            <div style={{
              border: '2px solid #fbbc04',
              borderRadius: '8px',
              padding: '18px',
              backgroundColor: '#fff'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#fbbc04', fontWeight: '600' }}>
                📊 ENTRADAS
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '8px', color: '#fbbc04' }}>
                {eventoSelecionado.totalEntradas || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#9aa0a6', marginTop: '6px' }}>
                Lançamentos
              </div>
            </div>

            <div style={{
              border: '2px solid #9334e6',
              borderRadius: '8px',
              padding: '18px',
              backgroundColor: '#fff'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#9334e6', fontWeight: '600' }}>
                💰 VALOR TOTAL
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '8px', color: '#9334e6' }}>
                R$ {(eventoSelecionado.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#9aa0a6', marginTop: '6px' }}>
                Status: {eventoSelecionado.status}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Formulário de Criação */}
      <FormEvento 
        onSucesso={handleEventoCriado}
        usuarioEmail={usuarioEmail}
      />

      {/* Eventos em Análise - Apenas para Pastores */}
      {ehPastor(usuarioPerfil?.perfil) && (
        <div style={{
          backgroundColor: '#fff3cd',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid #ffeaa7'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#856404',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔍 Eventos Aguardando Análise
            </h3>
            <span style={{
              fontSize: '0.875rem',
              color: '#856404',
              backgroundColor: '#fff',
              padding: '4px 8px',
              borderRadius: '12px',
              fontWeight: '500'
            }}>
              {carregandoAnalise ? '...' : eventosEmAnalise.length}
            </span>
          </div>

          {carregandoAnalise ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#856404' }}>
              Carregando eventos...
            </div>
          ) : eventosEmAnalise.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#856404',
              fontStyle: 'italic'
            }}>
              Não há eventos aguardando análise
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {eventosEmAnalise.map((evento) => (
                <div
                  key={evento.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #ffeaa7',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: '#202124' }}>
                      {evento.nomeEvento}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#5f6368' }}>
                      {formatarDataEvento(evento.dataEvento)} • 
                      {evento.totalEntradas || 0} entradas • 
                      R$ {(evento.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAbrirConferencia(evento)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#fbbc04',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    🔍 Conferir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lista de Eventos */}
      <ListaEventos 
        onEventoSelecionado={handleEventoSelecionado}
        eventoSelecionado={eventoSelecionado}
        usuarioPerfil={usuarioPerfil}
        recarregarEventos={recarregarContador}
      />

      {/* Informações sobre o fluxo */}
      <div style={{
        marginTop: '32px',
        backgroundColor: '#e8f0fe',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #1a73e8'
      }}>
        <h4 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1a73e8',
          margin: '0 0 12px 0'
        }}>
          🔄 Como Funciona o Controle de Eventos
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          fontSize: '0.875rem',
          color: '#1a73e8'
        }}>
          <div>
            <strong>1. 🎯 Criar Evento</strong><br/>
            Defina nome e data do evento. Ele ficará aberto para receber entradas.
          </div>
          
          <div>
            <strong>2. 💰 Registrar Entradas</strong><br/>
            Vá para a página de Entradas e vincule as entradas ao evento ativo.
          </div>
          
          <div>
            <strong>3. � Enviar para Análise</strong><br/>
            Quando terminar os lançamentos, envie o evento para análise.
          </div>
          
          <div>
            <strong>4. 🔍 Pastor Confere</strong><br/>
            O pastor visualiza todos os lançamentos e aprova ou reprova.
          </div>
          
          <div>
            <strong>5. ✅ Aprovação Final</strong><br/>
            Após aprovação, o evento é fechado definitivamente.
          </div>
        </div>
      </div>

      {/* Modal de Conferência */}
      {eventoConferencia && (
        <ConferenciaEvento
          evento={eventoConferencia}
          usuarioPerfil={usuarioPerfil}
          onClose={handleFecharConferencia}
          onAcaoCompleta={handleAcaoCompleta}
        />
      )}
    </div>
  );
}

export default Eventos;