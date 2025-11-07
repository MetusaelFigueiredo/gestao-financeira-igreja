const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {GoogleGenerativeAI} = require('@google/generative-ai');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const pdfParse = require('pdf-parse');
const fetch = require('node-fetch');

// Inicializar Firebase Admin
admin.initializeApp();

/**
 * Cloud Function acionada quando um arquivo é salvo na pasta comprovantes/
 * Usa Gemini AI para processar PDFs e imagens de comprovantes PIX
 */
exports.processarComprovantePIX = functions.storage.object().onFinalize(async (object) => {
  const fileBucket = object.bucket;
  const filePath = object.name;
  const fileName = filePath.split('/').pop();

  console.log('📄 Novo arquivo detectado:', filePath);

  // 1. Verificar se é um arquivo da pasta comprovantes/
  if (!filePath.startsWith('comprovantes/')) {
    console.log('❌ Arquivo não está na pasta comprovantes/, ignorando...');
    return null;
  }

  // 2. Verificar se é um PDF (voltando para PDFs apenas)
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    console.log('❌ Arquivo não é PDF, ignorando...');
    return null;
  }

  try {
    console.log('🤖 Iniciando processamento com Gemini AI:', fileName);

    // 3. Acessar chave da API do Gemini
    const geminiApiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({model: 'gemini-2.0-flash-exp'});

    // 4. Baixar o arquivo do Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    const [fileBuffer] = await file.download();
    
    console.log('✅ Arquivo baixado, tamanho:', fileBuffer.length, 'bytes');

    // 5. Extrair texto do PDF usando pdf-parse
    const pdfData = await pdfParse(fileBuffer);
    const textoCompleto = pdfData.text;
    
    console.log('📝 Texto extraído do PDF:');
    console.log('---INÍCIO DO TEXTO---');
    console.log(textoCompleto);
    console.log('---FIM DO TEXTO---');

    // 6. Prompt aprimorado para extração mais precisa
    const prompt = `Você é um expert em análise de comprovantes PIX. Analise este texto de comprovante PIX brasileiro:

TEXTO DO COMPROVANTE:
${textoCompleto}

EXTRAIA com máxima precisão:

1. VALOR: Procure por valores monetários (R$, reais, valor transferido)
2. DATA: Procure por datas do pagamento/transferência (DD/MM/YYYY, DD/MM/AA, ou similar)
3. NOME: Procure pelo nome do PAGADOR/REMETENTE (quem enviou o PIX)

LOCALIZE especificamente:
- Valor: linhas com "Valor", "R$", "Total", "Transferência"
- Data: linhas com "Data", "Realizada em", "Processado em", datas no formato brasileiro
- Nome: linhas com "Pagador", "De:", "Remetente", "Enviado por", nomes próprios

RESPONDA apenas com JSON válido:
{"valor": 125.50, "data": "03/11/2025", "nome": "Maria Santos Silva"}

REGRAS:
- valor: número decimal (sem R$, vírgulas viram pontos)
- data: formato DD/MM/YYYY
- nome: nome completo (primeira letra maiúscula)
- Se não encontrar, use null

EXEMPLOS DE CONVERSÃO:
- "R$ 2.850,75" → valor: 2850.75
- "Realizada em 15/10/2024" → data: "15/10/2024"
- "JOÃO PEDRO SILVA" → nome: "João Pedro Silva"

JSON APENAS:`;

    console.log('🔍 Enviando texto para Gemini AI...');

    // 7. Enviar para Gemini AI (apenas texto)
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📄 Resposta do Gemini:', text);

    // 8. Parse do JSON retornado
    const dadosExtraidos = parseGeminiResponse(text);
    console.log('🎯 Dados extraídos:', dadosExtraidos);

    if (!dadosExtraidos) {
      console.log('❌ Falha ao extrair dados do comprovante');
      return null;
    }

    // 9. Buscar documento no Firestore
    const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${fileBucket}/o/${encodeURIComponent(filePath)}`;
    console.log('🔍 Procurando documento com comprovanteUrl:', baseUrl);

    const db = admin.firestore();
    const entradasRef = db.collection('entradas');
    
    // Buscar documentos que contenham o path do arquivo no comprovanteUrl
    const querySnapshot = await entradasRef.where('comprovanteUrl', '>=', baseUrl)
                                           .where('comprovanteUrl', '<=', baseUrl + '\uf8ff')
                                           .get();

    if (querySnapshot.empty) {
      console.log('❌ Nenhum documento encontrado com este comprovanteUrl');
      return null;
    }

    // 10. 🆕 NOVA LÓGICA: Comparar e alertar sobre divergências (não sobrescrever)
    const promises = [];
    querySnapshot.forEach((doc) => {
      console.log('� Analisando documento:', doc.id);
      
      // Pegar dados atuais do documento
      const dadosAtuais = doc.data();
      
      // Verificar divergências
      const divergencias = [];
      
      // Comparar valor
      if (dadosExtraidos.valor && Math.abs(dadosAtuais.valor - dadosExtraidos.valor) > 0.01) {
        divergencias.push({
          campo: 'valor',
          lançado: dadosAtuais.valor,
          comprovante: dadosExtraidos.valor,
          diferenca: dadosExtraidos.valor - dadosAtuais.valor
        });
      }
      
      // Comparar data (com conversão correta)
      if (dadosExtraidos.data && dadosAtuais.data) {
        const dataLancamento = new Date(dadosAtuais.data.toDate());
        
        // Converter data do comprovante (formato DD/MM/YYYY)
        let dataComprovante = null;
        if (dadosExtraidos.data.includes('/')) {
          const [dia, mes, ano] = dadosExtraidos.data.split('/');
          dataComprovante = new Date(ano, mes - 1, dia); // mes é 0-indexed
        } else {
          dataComprovante = new Date(dadosExtraidos.data);
        }
        
        const diffDias = Math.abs(dataComprovante - dataLancamento) / (1000 * 60 * 60 * 24);
        
        if (diffDias > 1) { // Mais de 1 dia de diferença
          divergencias.push({
            campo: 'data',
            lançado: dataLancamento.toLocaleDateString('pt-BR'),
            comprovante: dataComprovante.toLocaleDateString('pt-BR'),
            diferenca: `${Math.round(diffDias)} dia(s)`
          });
        }
      }
      
      // Comparar nome (com membro selecionado)
      if (dadosExtraidos.nome) {
        const membroSelecionado = dadosAtuais.membro || '';
        const nomeComprovante = dadosExtraidos.nome.toLowerCase().trim();
        const membroNormalizado = membroSelecionado.toLowerCase().trim();
        
        // Função para calcular similaridade entre nomes
        const calcularSimilaridade = (str1, str2) => {
          if (!str1 || !str2) return 0;
          
          // Remover acentos e normalizar
          const normalizar = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const nome1 = normalizar(str1);
          const nome2 = normalizar(str2);
          
          // Verificar se um nome contém o outro (pelo menos 50% do nome menor)
          const menorNome = nome1.length < nome2.length ? nome1 : nome2;
          const maiorNome = nome1.length >= nome2.length ? nome1 : nome2;
          
          if (menorNome.length >= 5 && maiorNome.includes(menorNome)) {
            return 1.0; // 100% similar
          }
          
          // Verificar palavras em comum (sobrenomes)
          const palavras1 = nome1.split(' ').filter(p => p.length >= 3);
          const palavras2 = nome2.split(' ').filter(p => p.length >= 3);
          
          if (palavras1.length === 0 || palavras2.length === 0) return 0;
          
          const palavrasComuns = palavras1.filter(p1 => 
            palavras2.some(p2 => p1 === p2 || p1.includes(p2) || p2.includes(p1))
          );
          
          return palavrasComuns.length / Math.min(palavras1.length, palavras2.length);
        };
        
        const similaridade = calcularSimilaridade(nomeComprovante, membroNormalizado);
        const nomesCoincidentes = similaridade >= 0.6; // 60% de similaridade mínima
        
        if (!nomesCoincidentes && membroSelecionado) {
          divergencias.push({
            campo: 'membro',
            lançado: membroSelecionado,
            comprovante: dadosExtraidos.nome,
            diferenca: `Similaridade: ${Math.round(similaridade * 100)}%`
          });
        }
      }
      
      const updateData = {
        // Metadata do processamento
        processadoPorGeminiAI: true,
        processamentoEm: admin.firestore.Timestamp.now(),
        respostaGemini: text.substring(0, 500), // Para debug
        
        // 🆕 NOVA FUNCIONALIDADE: Salvar dados do comprovante para comparação
        dadosComprovante: {
          valor: dadosExtraidos.valor || null,
          nome: dadosExtraidos.nome || null,
          data: dadosExtraidos.data || null,
          processadoEm: admin.firestore.Timestamp.now()
        },
        
        // 🆕 ALERTA DE DIVERGÊNCIAS
        divergenciasDetectadas: divergencias.length > 0,
        divergencias: divergencias.length > 0 ? divergencias : null,
        
        // 🆕 STATUS DE VALIDAÇÃO
        statusValidacao: divergencias.length > 0 ? 'DIVERGENTE' : 'VALIDADO'
      };

      console.log(`📊 Análise completa - ${divergencias.length > 0 ? '⚠️ DIVERGÊNCIAS ENCONTRADAS' : '✅ DADOS VALIDADOS'}:`);
      if (divergencias.length > 0) {
        console.log('🔍 Divergências detectadas:', divergencias);
      }
      
      // 🚨 CORREÇÃO v2: Só atualizar dados principais se NÃO houver divergências
      if (divergencias.length === 0 && dadosExtraidos.data) {
        const dataTimestamp = converterDataParaTimestamp(dadosExtraidos.data);
        if (dataTimestamp) {
          updateData.data = dataTimestamp;
          console.log('📅 Atualizando data (sem divergências):', dadosExtraidos.data, '→', dataTimestamp.toDate());
        }
      } else if (divergencias.length > 0) {
        console.log('⚠️ Dados principais preservados devido a divergências detectadas - v2');
      }

      promises.push(doc.ref.update(updateData));
    });

    await Promise.all(promises);
    console.log('✅ Processamento Gemini AI concluído com sucesso!');
    
    return null;

  } catch (error) {
    console.error('❌ Erro ao processar com Gemini AI:', error);
    return null;
  }
});

/**
 * Acessa a chave da API do Gemini (via config do Firebase Functions)
 */
async function getGeminiApiKey() {
  // Tentar pegar da configuração do Firebase Functions primeiro
  const config = functions.config();
  if (config.gemini && config.gemini.api_key) {
    console.log('✅ API Key recuperada da config do Firebase');
    return config.gemini.api_key;
  }
  
  // Fallback: tentar Secret Manager
  try {
    const projectId = 'gestao-financeira-igreja';
    const client = new SecretManagerServiceClient();
    const name = `projects/${projectId}/secrets/GEMINI_API_KEY/versions/latest`;
    
    const [version] = await client.accessSecretVersion({name});
    const payload = version.payload.data.toString();
    console.log('✅ API Key recuperada do Secret Manager');
    return payload;
  } catch (error) {
    console.error('❌ Erro ao acessar API key:', error);
    throw new Error('API key do Gemini não configurada');
  }
}

/**
 * Determina o MIME type baseado na extensão do arquivo
 */
function getMimeType(extensao) {
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png'
  };
  
  return mimeTypes[extensao] || 'application/octet-stream';
}

/**
 * Faz parse da resposta do Gemini AI
 */
function parseGeminiResponse(responseText) {
  try {
    // Remover possíveis markdown ou texto extra
    const cleanText = responseText.replace(/```json|```/g, '').trim();
    
    // Tentar fazer parse do JSON
    const parsed = JSON.parse(cleanText);
    
    // Validar se tem as propriedades esperadas
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        valor: parsed.valor || null,
        data: parsed.data || null,
        nome: parsed.nome || null
      };
    }
    
    console.log('❌ Resposta do Gemini não é um objeto válido');
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao fazer parse da resposta do Gemini:', error);
    console.log('Resposta original:', responseText);
    
    // Fallback: tentar extrair dados com regex básica
    return extractDataWithRegex(responseText);
  }
}

/**
 * Fallback para extrair dados quando JSON parsing falha
 */
function extractDataWithRegex(text) {
  const dados = { valor: null, data: null, nome: null };
  
  console.log('🔍 Tentando extrair dados com regex do texto:', text);
  
  // Buscar valor - padrões mais robustos
  const valorMatches = [
    /["']?valor["']?\s*:\s*(\d+\.?\d*)/i,
    /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/,
    /(\d+[,\.]\d{2})/
  ];
  
  for (const pattern of valorMatches) {
    const match = text.match(pattern);
    if (match) {
      let valor = match[1].replace(/\./g, '').replace(',', '.');
      dados.valor = parseFloat(valor);
      console.log('💰 Valor extraído:', dados.valor);
      break;
    }
  }
  
  // Buscar data - padrões mais robustos
  const dataMatches = [
    /["']?data["']?\s*:\s*["']?(\d{2}\/\d{2}\/\d{4})["']?/i,
    /(\d{2}\/\d{2}\/\d{4})/,
    /(\d{2}-\d{2}-\d{4})/
  ];
  
  for (const pattern of dataMatches) {
    const match = text.match(pattern);
    if (match) {
      dados.data = match[1].replace(/-/g, '/');
      console.log('📅 Data extraída:', dados.data);
      break;
    }
  }
  
  // Buscar nome - padrões mais robustos
  const nomeMatches = [
    /["']?nome["']?\s*:\s*["']([^"']+)["']/i,
    /nome["']?\s*:\s*([A-Za-zÀ-ÿ\s]+)/i,
    /pagador[:\s]+([A-Za-zÀ-ÿ\s]+)/i,
    /de:\s*([A-Za-zÀ-ÿ\s]+)/i
  ];
  
  for (const pattern of nomeMatches) {
    const match = text.match(pattern);
    if (match) {
      dados.nome = match[1].trim();
      console.log('👤 Nome extraído:', dados.nome);
      break;
    }
  }
  
  console.log('🎯 Dados finais extraídos via regex:', dados);
  return dados;
}

/**
 * Converte data em formato DD/MM/YYYY para Timestamp do Firebase
 */
function converterDataParaTimestamp(dataTexto) {
  try {
    // Verificar se está no formato DD/MM/YYYY
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dataTexto.match(regex);
    
    if (!match) {
      console.log('⚠️ Formato de data inválido:', dataTexto);
      return null;
    }
    
    const [, dia, mes, ano] = match;
    
    // Criar objeto Date (mes - 1 porque Date usa 0-11 para meses)
    const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    
    // Verificar se a data é válida
    if (isNaN(data.getTime())) {
      console.log('⚠️ Data inválida:', dataTexto);
      return null;
    }
    
    // Converter para Timestamp do Firebase
    const timestamp = admin.firestore.Timestamp.fromDate(data);
    console.log('✅ Data convertida:', dataTexto, '→', data.toDateString());
    
    return timestamp;
    
  } catch (error) {
    console.error('❌ Erro ao converter data:', dataTexto, error);
    return null;
  }
}

/**
 * Calcula o rateio baseado no valor e tipo de entrada
 * Replica a mesma lógica de negócio do frontend
 */
function calcularRateio(valor, tipo) {
  const valorNumerico = parseFloat(valor);
  
  if (isNaN(valorNumerico) || valorNumerico <= 0) {
    console.log('⚠️ Valor inválido para rateio:', valor);
    return {};
  }
  
  let rateio = {};
  
  // Regras de negócio baseadas no tipo
  switch (tipo) {
    case 'dizimo':
    case 'oferta':
      // 60% Igreja Central, 40% Igreja Local
      rateio = {
        'Igreja Central': Math.round(valorNumerico * 0.6 * 100) / 100,
        'Igreja Local': Math.round(valorNumerico * 0.4 * 100) / 100
      };
      break;
      
    case 'construcao':
      // 100% Igreja Local para construção
      rateio = {
        'Igreja Local': valorNumerico
      };
      break;
      
    case 'missoes':
      // 100% Missões
      rateio = {
        'Missões': valorNumerico
      };
      break;
      
    case 'evento':
      // 100% Igreja Local para eventos
      rateio = {
        'Igreja Local': valorNumerico
      };
      break;
      
    default:
      // Fallback: mesmo que dízimo/oferta
      rateio = {
        'Igreja Central': Math.round(valorNumerico * 0.6 * 100) / 100,
        'Igreja Local': Math.round(valorNumerico * 0.4 * 100) / 100
      };
      break;
  }
  
  console.log('📊 Rateio calculado para', tipo, ':', rateio);
  return rateio;
}

/**
 * Função para listar modelos disponíveis (chamada via HTTP)
 */
exports.listarModelos = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const geminiApiKey = await getGeminiApiKey();
    
    // Usar node-fetch para compatibilidade
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
    const data = await response.json();
    
    res.json({
      sucesso: true,
      modelos: data.models && data.models.map(m => ({
        name: m.name,
        displayName: m.displayName,
        supportedGenerationMethods: m.supportedGenerationMethods
      })) || [],
      total: data.models && data.models.length || 0
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar modelos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Função para teste manual do Gemini AI (pode ser chamada via HTTP)
 */
exports.testarProcessamentoGemini = functions.https.onRequest(async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Parâmetro filePath é obrigatório' });
    }

    console.log('🧪 Teste manual Gemini AI para arquivo:', filePath);

    // Simular o processamento Gemini
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    
    const [fileBuffer] = await file.download();
    const fileName = filePath.split('/').pop();
    const extensao = fileName.toLowerCase();
    
    // Preparar para Gemini
    const geminiApiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({model: 'gemini-2.0-flash-exp'});
    
    const mimeType = getMimeType(extensao);
    const fileData = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    const prompt = `Analise este comprovante PIX brasileiro e extraia: valor, data e nome do pagador. Responda em JSON: {"valor": 123.45, "data": "01/01/2024", "nome": "João Silva"}`;
    
    const result = await model.generateContent([prompt, fileData]);
    const response = await result.response;
    const text = response.text();
    
    const dadosExtraidos = parseGeminiResponse(text);

    res.json({
      sucesso: true,
      arquivo: filePath,
      tipoArquivo: mimeType,
      dadosExtraidos,
      respostaGemini: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no teste Gemini:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

