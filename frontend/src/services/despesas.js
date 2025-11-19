import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import imageCompression from 'browser-image-compression';

/**
 * Categorias de despesas disponíveis
 */
export const categoriasDespesas = {
  'Utilidades': ['Luz', 'Água', 'Internet', 'Telefone'],
  'Salários': ['Zelador(a)', 'INSS', 'Pastor', 'Secretária'],
  'Material': ['Papel', 'Material de Escritório', 'Limpeza'],
  'Manutenção': ['Reparos', 'Conservação', 'Pintura'],
  'Eventos': ['Cultos Especiais', 'Conferências', 'Eventos'],
  'Outros': ['Diversos']
};

// 🚀 OTIMIZAÇÃO: Cache local para despesas
let cacheDespesas = null;
let cacheDespesasMesAtual = null;
let cacheTimestamp = null;
const CACHE_DURACAO = 2 * 60 * 1000; // 2 minutos (despesas mudam frequentemente)

/**
 * Invalidar cache de despesas
 */
const invalidarCacheDespesas = () => {
  cacheDespesas = null;
  cacheDespesasMesAtual = null;
  cacheTimestamp = null;
};

/**
 * Upload de comprovante com compressão
 */
export const uploadComprovante = async (file, despesaId) => {
  try {
    if (!file) {
      console.warn('⚠️ Nenhum arquivo fornecido para upload');
      return null;
    }

    let fileToUpload = file;

    if (file.type && file.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      
      fileToUpload = await imageCompression(file, options);
      console.log('✅ Imagem comprimida:', {
        original: (file.size / 1024).toFixed(2) + ' KB',
        comprimida: (fileToUpload.size / 1024).toFixed(2) + ' KB'
      });
    }

    const timestamp = Date.now();
    const fileName = `${despesaId}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `comprovantes/${fileName}`);
    
    await uploadBytes(storageRef, fileToUpload);
    const url = await getDownloadURL(storageRef);
    
    console.log('✅ Upload concluído:', url);
    return url;
    
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw error;
  }
};

/**
 * Adiciona uma nova despesa
 */
export const adicionarDespesa = async (despesaData, usuarioEmail) => {
  try {
    console.log('📝 Dados recebidos:', despesaData);

    const numeroParcelas = despesaData.parcelado ? parseInt(despesaData.numeroParcelas) : 1;
    const valorTotal = parseFloat(despesaData.valor);
    const valorParcela = numeroParcelas > 1 ? valorTotal / numeroParcelas : valorTotal;
    const dataVencimento = stringParaDataLocal(despesaData.vencimento);

    console.log(`💰 Valor total: R$ ${valorTotal.toFixed(2)}, Parcelas: ${numeroParcelas}, Valor por parcela: R$ ${valorParcela.toFixed(2)}`);

    const documentosIds = [];

    // Loop para criar cada parcela
    for (let i = 0; i < numeroParcelas; i++) {
      // Calcular data de vencimento da parcela (primeira parcela = data original, demais +1 mês cada)
      const dataVencimentoParcela = new Date(dataVencimento);
      dataVencimentoParcela.setMonth(dataVencimentoParcela.getMonth() + i);

      // Atualizar descrição com número da parcela (se parcelado)
      const descricaoParcela = numeroParcelas > 1 
        ? `${despesaData.descricao} (Parcela ${i + 1}/${numeroParcelas})`
        : despesaData.descricao;

      const dadosParaSalvar = {
        descricao: descricaoParcela,
        valor: valorParcela,
        vencimento: Timestamp.fromDate(dataVencimentoParcela),
        categoria: despesaData.categoria || 'Outros',
        formaPagamento: despesaData.formaPagamento || 'Dinheiro',
        status: despesaData.status || 'Pendente',
        observacoes: despesaData.observacoes || '',
        parcelado: despesaData.parcelado || false,
        numeroParcelas: numeroParcelas,
        parcelaAtual: i + 1, // Número da parcela atual
        valorTotal: valorTotal, // Valor total original (para referência)
        comprovanteURL: despesaData.comprovanteURL || null,
        criadoPor: usuarioEmail,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      console.log(`💾 Salvando parcela ${i + 1}/${numeroParcelas}:`, dadosParaSalvar);

      const docRef = await addDoc(collection(db, 'despesas'), dadosParaSalvar);
      documentosIds.push(docRef.id);
      console.log(`✅ Parcela ${i + 1} salva com ID: ${docRef.id}`);

      // Upload do comprovante apenas na primeira parcela (para evitar duplicatas)
      if (i === 0) {
        // Se já tem URL do comprovante (upload direto), não precisa fazer upload novamente
        if (despesaData.comprovanteURL) {
          console.log('✅ Comprovante já foi enviado:', despesaData.comprovanteURL);
        } else if (despesaData.comprovante && despesaData.comprovante instanceof File) {
          console.log('📎 Fazendo upload do comprovante...');
          const comprovanteURL = await uploadComprovante(despesaData.comprovante, docRef.id);
          
          if (comprovanteURL) {
            await updateDoc(doc(db, 'despesas', docRef.id), {
              comprovanteURL,
              updatedAt: Timestamp.now()
            });
            console.log('✅ Comprovante anexado!');
          }
        }
      }
    }

    console.log(`🎯 ${numeroParcelas} parcela(s) criada(s) com sucesso!`);
    
    // 🚀 OTIMIZAÇÃO: Invalidar cache após adição
    invalidarCacheDespesas();
    
    return documentosIds; // Retorna array com IDs de todas as parcelas criadas
    
  } catch (error) {
    console.error('❌ Erro ao adicionar despesa:', error);
    throw error;
  }
};

/**
 * Busca todas as despesas
 */
/**
 * Converte string de data (YYYY-MM-DD) para Date local sem problemas de timezone
 */
const stringParaDataLocal = (dataString) => {
  if (!dataString) return new Date();
  
  // Dividir a string "2025-12-05" em partes
  const [ano, mes, dia] = dataString.split('-').map(Number);
  
  // Criar Date no fuso horário local (mês é 0-indexed)
  return new Date(ano, mes - 1, dia);
};

/**
 * Converte Timestamp do Firebase para string de data local (YYYY-MM-DD)
 * sem problemas de fuso horário
 */
const timestampParaDataLocal = (timestamp) => {
  if (!timestamp) return null;
  
  const data = timestamp.toDate();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  
  return `${ano}-${mes}-${dia}`;
};

/**
 * 🚀 OTIMIZAÇÃO: Escutar despesas em tempo real (onSnapshot)
 */
export const escutarDespesas = (callback) => {
  try {
    const q = query(
      collection(db, 'despesas'),
      orderBy('vencimento', 'desc')
    );
    
    const unsubscribe = onSnapshot(q,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!snapshot.metadata.hasPendingWrites && !snapshot.metadata.fromCache) {
          const despesas = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              vencimento: timestampParaDataLocal(data.vencimento),
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
              dataPagamento: data.dataPagamento?.toDate()
            };
          });
          
          cacheDespesas = despesas;
          cacheTimestamp = Date.now();
          
          callback(despesas);
          console.log(`✅ Despesas atualizadas (tempo real): ${despesas.length}`);
        }
      },
      (error) => {
        console.error('❌ Erro ao escutar despesas:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Erro ao configurar listener:', error);
    return () => {};
  }
};

export const buscarDespesas = async () => {
  try {
    // 🚀 OTIMIZAÇÃO: Retornar cache se válido
    if (cacheDespesas && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURACAO)) {
      console.log('✅ Despesas retornadas do cache (0 leituras)');
      return cacheDespesas;
    }
    
    const q = query(
      collection(db, 'despesas'),
      orderBy('vencimento', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    const despesas = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        vencimento: timestampParaDataLocal(data.vencimento),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dataPagamento: data.dataPagamento?.toDate()
      };
    });
    
    cacheDespesas = despesas;
    cacheTimestamp = Date.now();
    
    console.log(`✅ Despesas carregadas: ${despesas.length} (${snapshot.size} leituras)`);
    return despesas;
    
  } catch (error) {
    console.error('❌ Erro ao buscar despesas:', error);
    throw error;
  }
};

/**
 * Busca despesas por período específico
 */
export const buscarDespesasPorPeriodo = async (ano, mes) => {
  try {
    const primeiroDiaMes = new Date(ano, mes, 1);
    const ultimoDiaMes = new Date(ano, mes + 1, 0);
    
    const q = query(
      collection(db, 'despesas'),
      where('vencimento', '>=', Timestamp.fromDate(primeiroDiaMes)),
      where('vencimento', '<=', Timestamp.fromDate(ultimoDiaMes)),
      orderBy('vencimento', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    const despesas = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        vencimento: timestampParaDataLocal(data.vencimento),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dataPagamento: data.dataPagamento?.toDate()
      };
    });
    
    console.log(`✅ Despesas de ${mes+1}/${ano} carregadas:`, despesas.length);
    return despesas;
    
  } catch (error) {
    console.error('❌ Erro ao buscar despesas do período:', error);
    throw error;
  }
};

/**
 * Busca despesas do mês atual (com cache)
 * 🚀 OTIMIZAÇÃO: Cache dedicado para mês atual
 */
export const buscarDespesasMesAtual = async () => {
  try {
    // 🚀 Retornar cache se válido
    if (cacheDespesasMesAtual && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURACAO)) {
      console.log('✅ Despesas do mês retornadas do cache (0 leituras)');
      return cacheDespesasMesAtual;
    }
    
    const agora = new Date();
    const primeiroDiaMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const ultimoDiaMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
    
    const q = query(
      collection(db, 'despesas'),
      where('vencimento', '>=', Timestamp.fromDate(primeiroDiaMes)),
      where('vencimento', '<=', Timestamp.fromDate(ultimoDiaMes)),
      orderBy('vencimento', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    const despesas = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        vencimento: timestampParaDataLocal(data.vencimento),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dataPagamento: data.dataPagamento?.toDate()
      };
    });
    
    cacheDespesasMesAtual = despesas;
    cacheTimestamp = Date.now();
    
    console.log(`✅ Despesas do mês carregadas: ${despesas.length} (${snapshot.size} leituras)`);
    return despesas;
    
  } catch (error) {
    console.error('❌ Erro ao buscar despesas do mês:', error);
    throw error;
  }
};

/**
 * Atualizar despesa
 * 🚀 OTIMIZAÇÃO: Invalidar cache após atualização
 */
export const atualizarDespesa = async (id, dados, novoComprovante = null, usuarioEmail) => {
  try {
    console.log('🔄 Atualizando despesa:', id, dados);

    const dadosAtualizados = {
      descricao: dados.descricao,
      valor: parseFloat(dados.valor),
      categoria: dados.categoria,
      formaPagamento: dados.formaPagamento,
      status: dados.status,
      observacoes: dados.observacoes || '',
      parcelado: dados.parcelado || false,
      numeroParcelas: dados.parcelado ? parseInt(dados.numeroParcelas) : 1,
      editadoPor: usuarioEmail,
      updatedAt: Timestamp.now()
    };

    if (dados.vencimento) {
      dadosAtualizados.vencimento = Timestamp.fromDate(stringParaDataLocal(dados.vencimento));
    }

    // Upload de novo comprovante se existir
    if (novoComprovante && novoComprovante instanceof File) {
      console.log('📎 Fazendo upload de novo comprovante...');
      const comprovanteURL = await uploadComprovante(novoComprovante, id);
      if (comprovanteURL) {
        dadosAtualizados.comprovanteURL = comprovanteURL;
      }
    }

    await updateDoc(doc(db, 'despesas', id), dadosAtualizados);
    
    // 🚀 Invalidar cache
    invalidarCacheDespesas();
    
    console.log('✅ Despesa atualizada:', id);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar despesa:', error);
    throw error;
  }
};

/**
 * Deletar despesa
 * 🚀 OTIMIZAÇÃO: Invalidar cache após deleção
 */
export const deletarDespesa = async (id) => {
  try {
    await deleteDoc(doc(db, 'despesas', id));
    
    // 🚀 Invalidar cache
    invalidarCacheDespesas();
    
    console.log('✅ Despesa deletada:', id);
    
  } catch (error) {
    console.error('❌ Erro ao deletar despesa:', error);
    throw error;
  }
};

/**
 * Atualizar status da despesa
 * 🚀 OTIMIZAÇÃO: Invalidar cache após atualização
 */
export const atualizarStatusDespesa = async (id, novoStatus) => {
  try {
    await updateDoc(doc(db, 'despesas', id), {
      status: novoStatus,
      updatedAt: Timestamp.now()
    });
    
    // 🚀 Invalidar cache
    invalidarCacheDespesas();
    
    console.log('✅ Status atualizado:', id, novoStatus);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    throw error;
  }
};

/**
 * Atualizar status de despesas vencidas automaticamente
 */
export const atualizarStatusVencidas = async () => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeTimestamp = Timestamp.fromDate(hoje);

    const q = query(
      collection(db, 'despesas'),
      where('status', '==', 'Pendente'),
      where('vencimento', '<', hojeTimestamp)
    );
    
    const snapshot = await getDocs(q);
    
    const atualizacoes = snapshot.docs.map(docSnapshot => 
      updateDoc(doc(db, 'despesas', docSnapshot.id), {
        status: 'Vencida',
        updatedAt: Timestamp.now()
      })
    );
    
    await Promise.all(atualizacoes);
    
    console.log(`✅ ${atualizacoes.length} despesa(s) marcada(s) como vencida(s)`);
    return atualizacoes.length;
    
  } catch (error) {
    console.error('❌ Erro ao atualizar despesas vencidas:', error);
    throw error;
  }
};

/**
 * Calcula resumo de despesas
 */
export const calcularResumoDespesas = async (ano = null, mes = null) => {
  try {
    const despesas = ano !== null && mes !== null 
      ? await buscarDespesasPorPeriodo(ano, mes)
      : await buscarDespesasMesAtual();
    
    const resumo = {
      total: 0,
      pagas: 0,
      pendentes: 0,
      vencidas: 0,
      quantidadeTotal: despesas.length,
      quantidadePagas: 0,
      quantidadePendentes: 0,
      quantidadeVencidas: 0
    };
    
    despesas.forEach(d => {
      resumo.total += d.valor;
      
      if (d.status === 'Paga') {
        resumo.pagas += d.valor;
        resumo.quantidadePagas++;
      } else if (d.status === 'Vencida') {
        resumo.vencidas += d.valor;
        resumo.quantidadeVencidas++;
      } else if (d.status === 'Pendente') {
        resumo.pendentes += d.valor;
        resumo.quantidadePendentes++;
      }
    });
    
    return resumo;
    
  } catch (error) {
    console.error('❌ Erro ao calcular resumo:', error);
    throw error;
  }
};

/**
 * Marca despesa como paga
 */
export const marcarComoPago = async (despesaId, formaPagamento) => {
  try {
    const despesaRef = doc(db, 'despesas', despesaId);
    
    await updateDoc(despesaRef, {
      status: 'Paga',
      dataPagamento: Timestamp.now(),
      formaPagamento: formaPagamento,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Despesa marcada como paga');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao marcar como pago:', error);
    return { success: false, error: error.message };
  }
};