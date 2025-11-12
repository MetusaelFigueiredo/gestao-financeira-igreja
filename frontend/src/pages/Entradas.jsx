import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import FormEntrada from '../components/FormEntrada';
import AlertaDivergencia from '../components/AlertaDivergencia';
import { escutarEntradas, excluirEntrada, atualizarCamposControle } from '../services/entradas';
import { buscarEventoPorId } from '../services/eventos';
import { formatarMoeda } from '../utils/formatacao';
import { calcularResumoMes } from '../utils/entradasUtils';
import { calcularRateio } from '../utils/migracaoRateio';
import { Timestamp } from 'firebase/firestore';

function Entradas({ usuarioEmail }) {
  // 🕒 Helper para formatação de data sem problemas de timezone (memoizado)
  const formatarDataEntrada = useCallback((dataEntrada) => {
    if (!dataEntrada) return '-';
    
    try {
      let data;
      
      if (dataEntrada && typeof dataEntrada.toDate === 'function') {
        data = dataEntrada.toDate();
      } else if (typeof dataEntrada === 'string' || typeof dataEntrada === 'number') {
        data = new Date(dataEntrada);
      } else if (dataEntrada instanceof Date) {
        data = dataEntrada;
      } else {
        return '-';
      }
      
      if (isNaN(data.getTime())) return '-';
      
      const dia = data.getDate().toString().padStart(2, '0');
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const ano = data.getFullYear();
      
      return `${dia}/${mes}/${ano}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  }, []);

  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [entradaParaEdicao, setEntradaParaEdicao] = useState(null);
  const [entradaComDivergencia, setEntradaComDivergencia] = useState(null);
  const [processandoIA, setProcessandoIA] = useState(false);
  const [entradaProcessando, setEntradaProcessando] = useState(null);
  
  // Estados para filtros de data
  const dataAtual = new Date();
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth());

  // 🆕 Ref para controlar listener único
  const unsubscribeRef = useRef(null);
  const isInitializedRef = useRef(false);

  // 🆕 useEffect para escutar entradas em real-time (APENAS UMA VEZ)
  useEffect(() => {
    // Evitar múltiplas inicializações
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('🎯 Iniciando listener real-time de entradas...');
    setCarregando(true);

    // Configurar listener do Firestore
    unsubscribeRef.current = escutarEntradas((resultado) => {
      if (resultado.success) {
        console.log(`✅ Entradas atualizadas: ${resultado.entradas.length} documento(s)${resultado.metadata?.fromCache ? ' (cache)' : ''}`);
        setEntradas(resultado.entradas);

        // 🆕 Processar divergências de forma assíncrona (não bloqueante)
        processarDivergenciasAsync(resultado.entradas);
      } else {
        console.error('❌ Erro ao escutar entradas:', resultado.error);
      }
      setCarregando(false);
    });

    // Cleanup: desinscrever quando componente desmontar
    return () => {
      console.log('🧹 Limpando listener de entradas...');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []); // ⚠️ Array vazio = executa APENAS na montagem

  // 🆕 Processar divergências de forma assíncrona (não bloqueia UI)
  const processarDivergenciasAsync = useCallback((entradasAtualizadas) => {
    // Executar em microtask para não bloquear render
    Promise.resolve().then(() => {
      // 🔧 CORREÇÃO: Verificar divergências primeiro (prioridade)
      const entradaComDivergenciaNaoResolvida = entradasAtualizadas.find(entrada => 
        entrada.divergenciasDetectadas && 
        entrada.statusValidacao === 'DIVERGENTE' &&
        !entrada.divergenciaResolvida
      );
      
      if (entradaComDivergenciaNaoResolvida) {
        console.log('⚠️ Divergência detectada:', entradaComDivergenciaNaoResolvida.id);
        setProcessandoIA(false);
        setEntradaProcessando(null);
        setEntradaComDivergencia(entradaComDivergenciaNaoResolvida);
        return; // 🚨 PARA AQUI - não continua processamento
      }
      
      // 🔧 CORREÇÃO: Só verifica processamento se não há divergência
      const entradaEmProcessamento = entradasAtualizadas.find(entrada => 
        entrada.comprovanteUrl && 
        !entrada.processadoPorGeminiAI &&
        !entrada.divergenciasDetectadas &&
        entrada.statusValidacao !== 'VALIDADO' // 🔥 NOVA CONDIÇÃO
      );
      
      // 🔧 CORREÇÃO: Só inicia processamento se mudou de entrada
      if (entradaEmProcessamento && !processandoIA && 
          (!entradaProcessando || entradaProcessando.id !== entradaEmProcessamento.id)) {
        console.log('🤖 Detectada entrada em processamento:', entradaEmProcessamento.id);
        setProcessandoIA(true);
        setEntradaProcessando(entradaEmProcessamento);
      }
      
      // 🔧 CORREÇÃO: Parar loading se processamento foi concluído ou há erro
      if (processandoIA && entradaProcessando) {
        const entradaAtualizada = entradasAtualizadas.find(e => e.id === entradaProcessando.id);
        if (entradaAtualizada && 
           (entradaAtualizada.processadoPorGeminiAI || 
            entradaAtualizada.statusValidacao === 'VALIDADO' ||
            entradaAtualizada.divergenciasDetectadas)) {
          console.log('✅ Processamento concluído para:', entradaProcessando.id);
          setProcessandoIA(false);
          setEntradaProcessando(null);
        }
      }
      
      // 🔧 TIMEOUT DE SEGURANÇA: Se está processando há mais de 2 minutos, para
      if (processandoIA && entradaProcessando) {
        const agora = Date.now();
        const tempoProcessamento = agora - (entradaProcessando._iniciadoEm || agora);
        if (tempoProcessamento > 120000) { // 2 minutos
          console.warn('⏰ Timeout de processamento - parando loading');
          setProcessandoIA(false);
          setEntradaProcessando(null);
        }
      }
    });
  }, [processandoIA, entradaProcessando]);

  // 🆕 Memoizar funções auxiliares
  const obterNomeTipo = useCallback((tipo) => {
    const tipos = {
      dizimo: 'Dízimo',
      oferta: 'Oferta',
      santa_ceia: 'Santa Ceia',
      cantina: 'Cantina',
      promocao: 'Promoção',
      outros: 'Outros'
    };
    return tipos[tipo] || tipo;
  }, []);

  const obterCorTipo = useCallback((tipo) => {
    const cores = {
      dizimo: '#1a73e8',
      oferta: '#34a853',
      santa_ceia: '#fbbc04',
      cantina: '#ea4335',
      promocao: '#9334e6',
      outros: '#5f6368'
    };
    return cores[tipo] || '#5f6368';
  }, []);

  // 🆕 Memoizar entradas filtradas (evita recalcular a cada render)
  const entradasFiltradas = useMemo(() => {
    return entradas.filter(entrada => {
      if (!entrada.data) return false;
      const dataEntrada = new Date(entrada.data);
      return dataEntrada.getMonth() === mesSelecionado && 
             dataEntrada.getFullYear() === anoSelecionado;
    });
  }, [entradas, mesSelecionado, anoSelecionado]);

  // 🆕 Memoizar resumo (cálculo pesado)
  const resumo = useMemo(() => {
    const dataFiltro = new Date(anoSelecionado, mesSelecionado, 1);
    return calcularResumoMes(entradasFiltradas, dataFiltro);
  }, [entradasFiltradas, anoSelecionado, mesSelecionado]);

  // 🆕 Memoizar entradas ordenadas
  const entradasOrdenadas = useMemo(() => {
    return [...entradasFiltradas].sort((a, b) => {
      const dataA = new Date(a.data);
      const dataB = new Date(b.data);
      return dataB.getTime() - dataA.getTime();
    });
  }, [entradasFiltradas]);

  // Memoizar arrays estáticos
  const meses = useMemo(() => [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ], []);
  
  const anosDisponiveis = useMemo(() => {
    const anos = [];
    for (let ano = 2020; ano <= new Date().getFullYear() + 1; ano++) {
      anos.push(ano);
    }
    return anos;
  }, []);

  // Memoizar nome do período
  const nomePeriodoCapitalizado = useMemo(() => {
    const dataFiltro = new Date(anoSelecionado, mesSelecionado, 1);
    const nomePeriodo = dataFiltro.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return nomePeriodo.charAt(0).toUpperCase() + nomePeriodo.slice(1);
  }, [anoSelecionado, mesSelecionado]);

  // 🔒 Verificação de status do evento (memoizada)
  const verificarStatusEvento = useCallback(async (eventoId) => {
    if (!eventoId) return true;
    
    try {
      const resultado = await buscarEventoPorId(eventoId);
      if (resultado.success) {
        const status = resultado.evento.status;
        return status === 'aberto' || status === 'analise';
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar status do evento:', error);
      return false;
    }
  }, []);

  const editarEntrada = useCallback(async (entrada) => {
    const podeEditar = await verificarStatusEvento(entrada.eventoId);
    if (!podeEditar) {
      alert("❌ Não é possível editar uma entrada de um evento encerrado.");
      return;
    }
    
    setEntradaParaEdicao(entrada);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [verificarStatusEvento]);

  const verComprovante = useCallback((comprovanteUrl) => {
    if (comprovanteUrl) {
      window.open(comprovanteUrl, '_blank');
    }
  }, []);

  const confirmarExclusao = useCallback(async (entradaId, valorEntrada, eventoId) => {
    const podeExcluir = await verificarStatusEvento(eventoId);
    if (!podeExcluir) {
      alert("❌ Não é possível excluir uma entrada de um evento encerrado.");
      return;
    }
    
    const confirmacao = window.confirm(
      `Você tem certeza que deseja excluir este lançamento de ${formatarMoeda(valorEntrada)}?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (confirmacao) {
      const resultado = await excluirEntrada(entradaId);
      
      if (!resultado.success) {
        alert('Erro ao excluir entrada: ' + resultado.error);
      }
      // ✅ Não precisa recarregar - onSnapshot já atualiza automaticamente
    }
  }, [verificarStatusEvento]);

  // 🆕 Função para aceitar dados do comprovante (otimizada)
  const aceitarDadosComprovante = useCallback(async (entrada) => {
    try {
      if (!entrada.tipo) {
        throw new Error('Tipo da entrada não encontrado');
      }

      const novoValor = entrada.dadosComprovante.valor || entrada.valor;
      
      let dataProcessada = entrada.data;
      if (entrada.dadosComprovante.data) {
        const dataString = entrada.dadosComprovante.data;
        console.log('📅 Processando data do comprovante:', dataString);
        
        if (dataString.includes('/')) {
          const [dia, mes, ano] = dataString.split('/');
          const dataDate = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 12, 0, 0);
          dataProcessada = Timestamp.fromDate(dataDate);
          
          console.log('📅 Timestamp gerado:', dataProcessada.toDate().toLocaleDateString('pt-BR'));
        }
      }
      
      const dadosAtualizados = {
        valor: novoValor,
        descricao: entrada.dadosComprovante.nome || entrada.descricao,
        data: dataProcessada,
        rateio: calcularRateio(entrada.tipo, novoValor),
        divergenciaResolvida: true,
        resolucaoEm: Timestamp.now(),
        resolucaoTipo: 'ACEITAR_COMPROVANTE',
        statusValidacao: 'VALIDADO'
      };

      const dadosLimpos = Object.fromEntries(
        Object.entries(dadosAtualizados).filter(([_, v]) => v !== undefined)
      );

      const resultado = await atualizarCamposControle(entrada.id, dadosLimpos);
      
      if (resultado.success) {
        setEntradaComDivergencia(null);
        alert('✅ Dados do comprovante aceitos com sucesso!');
      } else {
        alert('❌ Erro ao atualizar entrada: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro ao aceitar comprovante:', error);
      alert('❌ Erro ao processar solicitação');
    }
  }, []);

  // 🆕 Função para manter dados originais (otimizada)
  const manterDadosOriginais = useCallback(async (entrada) => {
    try {
      const dadosAtualizados = {
        divergenciaResolvida: true,
        resolucaoEm: Timestamp.now(),
        resolucaoTipo: 'MANTER_ORIGINAL',
        statusValidacao: 'MANUAL'
      };

      const resultado = await atualizarCamposControle(entrada.id, dadosAtualizados);
      
      if (resultado.success) {
        setEntradaComDivergencia(null);
        alert('✅ Dados originais mantidos!');
      } else {
        alert('❌ Erro ao atualizar entrada: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro ao manter dados originais:', error);
      alert('❌ Erro ao processar solicitação');
    }
  }, []);

  // 🆕 Callback otimizado para sucesso do form
  const handleFormSucesso = useCallback(() => {
    setEntradaParaEdicao(null);
    // ✅ Não precisa recarregar - onSnapshot já atualiza automaticamente
  }, []);

  // 🆕 Callback otimizado para reset de filtros
  const resetarFiltros = useCallback(() => {
    const hoje = new Date();
    setAnoSelecionado(hoje.getFullYear());
    setMesSelecionado(hoje.getMonth());
  }, []);

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '32px 24px'
    }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '600',
              color: '#202124',
              marginBottom: '8px',
              letterSpacing: '-0.5px'
            }}>
              Entradas
            </h1>
          </div>
          
          {/* Filtros de Data */}
          <div className="filters-container" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.875rem', color: '#5f6368', fontWeight: '500' }}>
              📅 Filtros:
            </label>
            
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#202124',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {meses.map((mes, index) => (
                <option key={index} value={index}>{mes}</option>
              ))}
            </select>
            
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#202124',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
            
            <button
              onClick={resetarFiltros}
              style={{
                padding: '8px 12px',
                backgroundColor: '#1a73e8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              📅 Hoje
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#5f6368',
            margin: 0
          }}>
            Registre dízimos, ofertas e outras entradas financeiras
          </p>
          
          <p style={{
            fontSize: '0.875rem',
            color: '#1a73e8',
            fontWeight: '500',
            margin: 0
          }}>
            Período: {nomePeriodoCapitalizado}
          </p>
        </div>
      </div>
      
      {/* Formulário de Lançamento */}
      <div style={{ marginBottom: '32px' }}>
        <FormEntrada 
          onSucesso={handleFormSucesso}
          usuarioEmail={usuarioEmail}
          entradaParaEdicao={entradaParaEdicao}
        />
      </div>

      {/* Cards de Resumo (Entrada Total / Igreja Central / Igreja Local / Missões) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Entrada Total */}
        <div style={{
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          padding: '18px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#5f6368' }}>ENTRADA TOTAL</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '8px' }}>
            {formatarMoeda(resumo.total)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#9aa0a6', marginTop: '6px' }}>
            {resumo.totalCount} lançamento(s)
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#5f6368' }}>
            <div>PIX: <strong>{formatarMoeda(resumo.totalByForma.pix)}</strong></div>
            <div>Dinheiro: <strong>{formatarMoeda(resumo.totalByForma.dinheiro)}</strong></div>
          </div>
        </div>

        {/* Igreja Central */}
        <div style={{
          border: '2px solid #1a73e8',
          borderRadius: '8px',
          padding: '18px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#1a73e8' }}>IGREJA CENTRAL</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '8px', color: '#1a73e8' }}>
            {formatarMoeda(resumo.central)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#9aa0a6', marginTop: '6px' }}>
            {resumo.centralCount} lançamento(s)
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#5f6368' }}>
            <div>PIX: <strong>{formatarMoeda(resumo.centralByForma.pix)}</strong></div>
            <div>Dinheiro: <strong>{formatarMoeda(resumo.centralByForma.dinheiro)}</strong></div>
          </div>
        </div>

        {/* Igreja Local */}
        <div style={{
          border: '2px solid #34a853',
          borderRadius: '8px',
          padding: '18px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#34a853' }}>IGREJA LOCAL</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '8px', color: '#34a853' }}>
            {formatarMoeda(resumo.local)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#9aa0a6', marginTop: '6px' }}>
            {resumo.localCount} lançamento(s)
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#5f6368' }}>
            <div>PIX: <strong>{formatarMoeda(resumo.localByForma.pix)}</strong></div>
            <div>Dinheiro: <strong>{formatarMoeda(resumo.localByForma.dinheiro)}</strong></div>
          </div>
        </div>

        {/* Missões */}
        <div style={{
          border: '2px solid #9334e6',
          borderRadius: '8px',
          padding: '18px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#9334e6' }}>MISSÕES</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '8px', color: '#9334e6' }}>
            {formatarMoeda(resumo.missoes)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#9aa0a6', marginTop: '6px' }}>
            {resumo.missoesCount} lançamento(s)
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#5f6368' }}>
            <div>PIX: <strong>{formatarMoeda(resumo.missoesByForma.pix)}</strong></div>
            <div>Dinheiro: <strong>{formatarMoeda(resumo.missoesByForma.dinheiro)}</strong></div>
          </div>
        </div>
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
            {entradasFiltradas.length} {entradasFiltradas.length === 1 ? 'lançamento' : 'lançamentos'}
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
        ) : entradasFiltradas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#5f6368'
          }}>
            {entradas.length === 0 
              ? 'Nenhuma entrada lançada ainda.' 
              : `Nenhuma entrada encontrada para ${nomePeriodoCapitalizado}.`
            }
          </div>
        ) : (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            border: '1px solid #e8eaed'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#202124',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📋 TODAS AS ENTRADAS
              <span style={{
                fontSize: '0.875rem',
                color: '#5f6368',
                fontWeight: '400'
              }}>
                ({entradasOrdenadas.length} entrada{entradasOrdenadas.length !== 1 ? 's' : ''})
              </span>
            </h3>
            
            <div style={{
              overflowX: 'auto',
              border: '1px solid #e8eaed',
              borderRadius: '8px'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      📅 Data
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      👤 Membro/Descrição
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      🏷️ Tipo
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      💳 Forma
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      💰 Valor
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8eaed', fontWeight: '600' }}>
                      ⚙️ Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entradasOrdenadas.map((entrada, index) => (
                    <tr key={entrada.id} style={{
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                    }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed' }}>
                        {formatarDataEntrada(entrada.data)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e8eaed', maxWidth: '200px' }}>
                        <div style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          fontSize: '0.875rem'
                        }}>
                          {entrada.tipo?.toLowerCase() === 'dizimo' 
                            ? (entrada.membroNome || 'Membro não informado')
                            : (entrada.descricao || 'Descrição não informada')
                          }
                        </div>
                        {/* Mostrar descrição adicional apenas para dízimos que têm membro E descrição */}
                        {entrada.tipo?.toLowerCase() === 'dizimo' && entrada.membroNome && entrada.descricao && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#5f6368',
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            marginTop: '2px'
                          }}>
                            {entrada.descricao}
                          </div>
                        )}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        borderBottom: '1px solid #e8eaed',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: `${obterCorTipo(entrada.tipo)}15`,
                          color: obterCorTipo(entrada.tipo)
                        }}>
                          {obterNomeTipo(entrada.tipo)}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        borderBottom: '1px solid #e8eaed',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: entrada.formaRecebimento === 'pix' ? '#e3f2fd' : '#e8f5e8',
                          color: entrada.formaRecebimento === 'pix' ? '#1565c0' : '#2e7d32'
                        }}>
                          {entrada.formaRecebimento === 'pix' ? '💳 PIX' : '💵 DINHEIRO'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        borderBottom: '1px solid #e8eaed',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#34a853',
                        fontSize: '1rem'
                      }}>
                        {formatarMoeda(entrada.valor)}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        borderBottom: '1px solid #e8eaed',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          {/* Botão Ver Comprovante */}
                          {entrada.comprovanteUrl && (
                            <button
                              onClick={() => verComprovante(entrada.comprovanteUrl)}
                              title="Ver Comprovante"
                              style={{
                                padding: '6px 8px',
                                backgroundColor: '#34a853',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#2d8f3f'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#34a853'}
                            >
                              📎
                            </button>
                          )}
                          
                          {/* Botão Editar */}
                          <button
                            onClick={() => editarEntrada(entrada)}
                            title="Editar"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: '#1a73e8',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#1557b0'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#1a73e8'}
                          >
                            ✏️
                          </button>
                          
                          {/* Botão Excluir */}
                          <button
                            onClick={() => confirmarExclusao(entrada.id, entrada.valor, entrada.eventoId)}
                            title="Excluir"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: '#ea4335',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#d33b2c'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#ea4335'}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 🆕 LOADING DE PROCESSAMENTO IA */}
      {processandoIA && entradaProcessando && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Animação de loading */}
            <div style={{
              width: '80px',
              height: '80px',
              border: '4px solid #e3f2fd',
              borderTop: '4px solid #1a73e8',
              borderRadius: '50%',
              margin: '0 auto 24px',
              animation: 'spin 1s linear infinite'
            }}></div>
            
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#202124',
              margin: '0 0 12px 0'
            }}>
              🤖 Processando Comprovante
            </h3>
            
            <p style={{
              fontSize: '0.875rem',
              color: '#5f6368',
              margin: '0 0 16px 0',
              lineHeight: '1.4'
            }}>
              Nossa IA está analisando o comprovante PIX e validando os dados...
            </p>
            
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.75rem',
              color: '#5f6368',
              marginBottom: '20px'
            }}>
              📄 <strong>{entradaProcessando.descricao}</strong><br/>
              💰 <strong>{formatarMoeda(entradaProcessando.valor)}</strong>
            </div>
            
            {/* 🚨 BOTÃO DE EMERGÊNCIA */}
            <button
              onClick={() => {
                console.log('🚨 EMERGÊNCIA: Forçando saída do modal');
                setProcessandoIA(false);
                setEntradaProcessando(null);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ea4335',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d33b2c'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea4335'}
            >
              🚨 Fechar (Emergência)
            </button>
            
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* 🆕 ALERTA DE DIVERGÊNCIA */}
      {entradaComDivergencia && (
        <AlertaDivergencia
          entrada={entradaComDivergencia}
          onAceitarComprovante={aceitarDadosComprovante}
          onManterOriginal={manterDadosOriginais}
          onFechar={() => setEntradaComDivergencia(null)}
        />
      )}
    </div>
  );
}

export default Entradas;