import React, { useState, useEffect, useMemo } from 'react';
import { buscarEntradas } from '../services/entradas';
import { formatarMoeda } from '../utils/formatacao';

function RelatorioComprovantes() {
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [imagensComErro, setImagensComErro] = useState({});

  useEffect(() => {
    carregarEntradas();
  }, []);

  const carregarEntradas = async () => {
    setCarregando(true);
    const resultado = await buscarEntradas();

    if (resultado.success) {
      // Filtrar apenas entradas com comprovante
      const comComprovante = resultado.entradas.filter(
        e => e.comprovanteUrl || e.comprovante?.url
      );
      setEntradas(comComprovante);
    }

    setCarregando(false);
  };

  // Obter URL do comprovante
  const getComprovanteUrl = (entrada) => {
    const url = entrada.comprovanteUrl || entrada.comprovante?.url;
    // Se for um base64, verificar se tem o prefixo correto
    if (url && url.startsWith('data:') && !url.includes('base64')) {
      return null;
    }
    return url;
  };

  // Handler de erro de imagem
  const handleImageError = (entradaId) => {
    setImagensComErro(prev => ({ ...prev, [entradaId]: true }));
  };

  // Filtrar por mês/ano
  const entradasFiltradas = useMemo(() => {
    return entradas.filter(entrada => {
      if (!entrada.data) return false;
      
      const dataEntrada = entrada.data instanceof Date ? entrada.data : new Date(entrada.data);
      const mes = dataEntrada.getMonth() + 1;
      const ano = dataEntrada.getFullYear();

      if (filtroAno && ano !== parseInt(filtroAno)) return false;
      if (filtroMes && mes !== parseInt(filtroMes)) return false;

      return true;
    });
  }, [entradas, filtroMes, filtroAno]);

  // Calcular totais
  const totais = useMemo(() => {
    return entradasFiltradas.reduce((acc, e) => ({
      total: acc.total + (e.valor || 0),
      count: acc.count + 1
    }), { total: 0, count: 0 });
  }, [entradasFiltradas]);

  // Formatar data
  const formatarData = (data) => {
    if (!data) return '-';
    const d = data instanceof Date ? data : new Date(data);
    return d.toLocaleDateString('pt-BR');
  };

  // Obter nome do tipo
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

  // Anos disponíveis para filtro
  const anosDisponiveis = useMemo(() => {
    const anos = new Set();
    entradas.forEach(e => {
      if (e.data) {
        const d = e.data instanceof Date ? e.data : new Date(e.data);
        anos.add(d.getFullYear());
      }
    });
    return Array.from(anos).sort((a, b) => b - a);
  }, [entradas]);

  // Gerar PDF para impressão - 2 comprovantes por página (75% da página)
  const gerarPDF = () => {
    setGerandoPDF(true);

    // Filtrar apenas entradas SEM erro de imagem
    const entradasValidas = entradasFiltradas.filter(e => !imagensComErro[e.id]);
    
    if (entradasValidas.length === 0) {
      alert('Nenhum comprovante válido para gerar o relatório. Todos os comprovantes apresentaram erro ao carregar.');
      setGerandoPDF(false);
      return;
    }

    // Criar janela de impressão
    const printWindow = window.open('', '_blank');
    
    const mesNome = filtroMes ? new Date(2000, parseInt(filtroMes) - 1).toLocaleString('pt-BR', { month: 'long' }) : 'Todos os meses';
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Comprovantes - ${mesNome} ${filtroAno}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { 
            height: 100%;
            font-family: Arial, sans-serif; 
            color: #333;
          }
          
          .pagina {
            height: 100vh;
            display: flex;
            flex-direction: column;
            page-break-after: always;
            padding: 10px;
          }
          .pagina:last-child {
            page-break-after: auto;
          }
          
          .header {
            text-align: center;
            padding: 8px 0 12px;
            border-bottom: 2px solid #333;
            flex-shrink: 0;
          }
          .header h1 { font-size: 18px; margin-bottom: 3px; }
          .header p { color: #666; font-size: 11px; }
          
          .resumo {
            display: flex;
            justify-content: center;
            gap: 40px;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 4px;
            margin: 8px 0;
            flex-shrink: 0;
          }
          .resumo-item { text-align: center; }
          .resumo-item .label { font-size: 10px; color: #666; }
          .resumo-item .valor { font-size: 14px; font-weight: bold; }
          
          /* Grid de 2 colunas ocupando ~75% da altura */
          .grid-comprovantes {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            flex: 1;
            min-height: 0;
          }
          
          .comprovante-container {
            border: 1px solid #ccc;
            border-radius: 6px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          
          .comprovante-header {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 8px 10px;
            border-bottom: 1px solid #ddd;
            flex-shrink: 0;
          }
          .comprovante-header h3 { 
            font-size: 12px; 
            margin-bottom: 3px;
            color: #333;
          }
          .comprovante-info { 
            font-size: 10px; 
            color: #666;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          
          .comprovante-image {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fafafa;
            padding: 8px;
            min-height: 0;
          }
          .comprovante-image img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          
          .no-image {
            color: #999;
            font-style: italic;
            font-size: 12px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .no-image .icon { font-size: 32px; }
          
          .footer {
            padding: 8px 0 0;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 9px;
            color: #888;
            flex-shrink: 0;
          }
          
          @media print {
            .pagina {
              height: 100vh;
              page-break-after: always;
            }
            .pagina:last-child {
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
    `;

    // Dividir em páginas de 2 comprovantes
    const paginas = [];
    for (let i = 0; i < entradasValidas.length; i += 2) {
      paginas.push(entradasValidas.slice(i, i + 2));
    }

    // Calcular totais apenas das entradas válidas
    const totaisValidos = entradasValidas.reduce((acc, e) => acc + (e.valor || 0), 0);
    
    // Calcular valor dos excluídos
    const entradasExcluidas = entradasFiltradas.filter(e => imagensComErro[e.id]);
    const valorExcluidos = entradasExcluidas.reduce((acc, e) => acc + (e.valor || 0), 0);

    paginas.forEach((paginaEntradas, paginaIndex) => {
      html += `
        <div class="pagina">
          <div class="header">
            <h1>📎 Relatório de Comprovantes</h1>
            <p>${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)} de ${filtroAno} | Página ${paginaIndex + 1} de ${paginas.length}</p>
          </div>

          ${paginaIndex === 0 ? `
          <div class="resumo">
            <div class="resumo-item">
              <div class="label">Comprovantes</div>
              <div class="valor">${entradasValidas.length}</div>
            </div>
            <div class="resumo-item">
              <div class="label">Valor no Relatório</div>
              <div class="valor" style="color: #34a853;">${formatarMoeda(totaisValidos)}</div>
            </div>
            ${entradasExcluidas.length > 0 ? `
            <div class="resumo-item">
              <div class="label" style="color: #e65100;">Excluídos (${entradasExcluidas.length})</div>
              <div class="valor" style="color: #e65100;">${formatarMoeda(valorExcluidos)}</div>
            </div>
            <div class="resumo-item">
              <div class="label" style="font-weight: bold;">TOTAL GERAL</div>
              <div class="valor" style="color: #1a73e8; font-weight: bold;">${formatarMoeda(totaisValidos + valorExcluidos)}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="grid-comprovantes">
      `;

      paginaEntradas.forEach((entrada, idx) => {
        const index = paginaIndex * 2 + idx;
        const url = getComprovanteUrl(entrada);
        
        html += `
          <div class="comprovante-container">
            <div class="comprovante-header">
              <h3>${index + 1}. ${obterNomeTipo(entrada.tipo)} - ${formatarMoeda(entrada.valor)}</h3>
              <div class="comprovante-info">
                <span>📅 ${formatarData(entrada.data)}</span>
                ${entrada.membroNome ? `<span>👤 ${entrada.membroNome}</span>` : ''}
                <span>💳 ${entrada.formaRecebimento === 'pix' ? 'PIX' : 'Dinheiro'}</span>
              </div>
            </div>
            <div class="comprovante-image">
              ${url 
                ? `<img src="${url}" alt="Comprovante ${index + 1}" />` 
                : `<div class="no-image"><span class="icon">🖼️</span><span>Sem comprovante</span></div>`}
            </div>
          </div>
        `;
      });

      // Se houver apenas 1 comprovante na página, adicionar espaço vazio
      if (paginaEntradas.length === 1) {
        html += `<div></div>`;
      }

      html += `
          </div>
          <div class="footer">
            Gerado em ${new Date().toLocaleString('pt-BR')} | Gestão Financeira Igreja
          </div>
        </div>
      `;
    });

    html += `
        <script>
          // Aguardar imagens carregarem antes de abrir diálogo de impressão
          let imagens = document.querySelectorAll('img');
          let carregadas = 0;
          let total = imagens.length;
          
          function verificar() {
            if (carregadas >= total) {
              setTimeout(() => window.print(), 500);
            }
          }
          
          if (total === 0) {
            setTimeout(() => window.print(), 300);
          } else {
            imagens.forEach(img => {
              if (img.complete && img.naturalHeight !== 0) {
                carregadas++;
              } else {
                img.onload = () => { carregadas++; verificar(); };
                img.onerror = () => { carregadas++; verificar(); };
              }
            });
            verificar();
            
            // Fallback: imprimir após 5 segundos mesmo se não carregar
            setTimeout(() => window.print(), 5000);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    setGerandoPDF(false);
  };

  if (carregando) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center',
        margin: '20px'
      }}>
        ⏳ Carregando comprovantes...
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Cabeçalho */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: '#202124', margin: 0 }}>
              📎 Relatório de Comprovantes
            </h1>
            <p style={{ color: '#5f6368', margin: '5px 0 0', fontSize: '0.9rem' }}>
              Visualize e imprima todos os comprovantes em um PDF
            </p>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <option value="">Todos os meses</option>
              <option value="1">Janeiro</option>
              <option value="2">Fevereiro</option>
              <option value="3">Março</option>
              <option value="4">Abril</option>
              <option value="5">Maio</option>
              <option value="6">Junho</option>
              <option value="7">Julho</option>
              <option value="8">Agosto</option>
              <option value="9">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>

            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              {anosDisponiveis.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>

            <button
              onClick={gerarPDF}
              disabled={(entradasFiltradas.length - Object.keys(imagensComErro).length) === 0 || gerandoPDF}
              style={{
                padding: '10px 20px',
                backgroundColor: (entradasFiltradas.length - Object.keys(imagensComErro).length) === 0 ? '#e0e0e0' : '#1a73e8',
                color: (entradasFiltradas.length - Object.keys(imagensComErro).length) === 0 ? '#999' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (entradasFiltradas.length - Object.keys(imagensComErro).length) === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🖨️ {gerandoPDF ? 'Gerando...' : `Imprimir PDF (${entradasFiltradas.length - Object.keys(imagensComErro).filter(id => entradasFiltradas.some(e => e.id === id)).length})`}
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div style={{
          display: 'flex',
          gap: '24px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e8eaed',
          flexWrap: 'wrap'
        }}>
          <div>
            <span style={{ color: '#5f6368', fontSize: '0.85rem' }}>Comprovantes encontrados:</span>
            <strong style={{ marginLeft: '8px', fontSize: '1.1rem' }}>{entradasFiltradas.length}</strong>
          </div>
          <div>
            <span style={{ color: '#5f6368', fontSize: '0.85rem' }}>Valor total:</span>
            <strong style={{ marginLeft: '8px', fontSize: '1.1rem', color: '#34a853' }}>{formatarMoeda(totais.total)}</strong>
          </div>
          {Object.keys(imagensComErro).length > 0 && (() => {
            const errosNoFiltro = entradasFiltradas.filter(e => imagensComErro[e.id]);
            const valorErros = errosNoFiltro.reduce((acc, e) => acc + (e.valor || 0), 0);
            return (
              <div style={{ 
                backgroundColor: '#fff3e0', 
                padding: '8px 12px', 
                borderRadius: '6px',
                border: '1px solid #ffcc80'
              }}>
                <span style={{ color: '#e65100', fontSize: '0.85rem' }}>⚠️ Com erro:</span>
                <strong style={{ marginLeft: '8px', fontSize: '1.1rem', color: '#e65100' }}>
                  {errosNoFiltro.length}
                </strong>
                <span style={{ marginLeft: '12px', color: '#e65100', fontSize: '0.85rem' }}>
                  ({formatarMoeda(valorErros)})
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Grid de Comprovantes */}
      {entradasFiltradas.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '60px',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#5f6368'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
          <h3 style={{ margin: '0 0 8px' }}>Nenhum comprovante encontrado</h3>
          <p style={{ margin: 0 }}>Não há comprovantes para o período selecionado</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {entradasFiltradas.map((entrada, index) => (
            <div
              key={entrada.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              {/* Header do Card */}
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e8eaed',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      backgroundColor: '#e8f0fe',
                      color: '#1a73e8',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      marginBottom: '8px'
                    }}>
                      {obterNomeTipo(entrada.tipo)}
                    </span>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#34a853' }}>
                      {formatarMoeda(entrada.valor)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#5f6368' }}>
                    <div>📅 {formatarData(entrada.data)}</div>
                    {entrada.membroNome && <div>👤 {entrada.membroNome}</div>}
                  </div>
                </div>
              </div>

              {/* Imagem do Comprovante */}
              <div style={{
                height: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa',
                padding: '10px'
              }}>
                {imagensComErro[entrada.id] || !getComprovanteUrl(entrada) ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#999'
                  }}>
                    <div style={{ fontSize: '3rem' }}>🖼️</div>
                    <span style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                      Imagem não disponível
                    </span>
                    {getComprovanteUrl(entrada) && (
                      <button
                        onClick={() => window.open(getComprovanteUrl(entrada), '_blank')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f0f0f0',
                          color: '#666',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        🔗 Abrir link original
                      </button>
                    )}
                  </div>
                ) : (
                  <img
                    src={getComprovanteUrl(entrada)}
                    alt={`Comprovante ${index + 1}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(getComprovanteUrl(entrada), '_blank')}
                    onError={() => handleImageError(entrada.id)}
                  />
                )}
              </div>

              {/* Footer do Card */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #e8eaed',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: entrada.formaRecebimento === 'pix' ? '#e3f2fd' : '#fff3e0',
                  color: entrada.formaRecebimento === 'pix' ? '#1565c0' : '#e65100',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {entrada.formaRecebimento === 'pix' ? '📱 PIX' : '💵 Dinheiro'}
                </span>
                {getComprovanteUrl(entrada) && (
                  <button
                    onClick={() => window.open(getComprovanteUrl(entrada), '_blank')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: imagensComErro[entrada.id] ? '#ff9800' : '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    {imagensComErro[entrada.id] ? '🔗 Ver Link' : '🔍 Ampliar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RelatorioComprovantes;
