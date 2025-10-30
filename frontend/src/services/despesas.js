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
  Timestamp 
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
export const adicionarDespesa = async (despesaData) => {
  try {
    console.log('📝 Dados recebidos:', despesaData);

    const dadosParaSalvar = {
      descricao: despesaData.descricao,
      valor: parseFloat(despesaData.valor),
      vencimento: Timestamp.fromDate(new Date(despesaData.vencimento)),
      categoria: despesaData.categoria || 'Outros',
      formaPagamento: despesaData.formaPagamento || 'Dinheiro',
      status: despesaData.status || 'Pendente',
      observacoes: despesaData.observacoes || '',
      parcelado: despesaData.parcelado || false,
      numeroParcelas: despesaData.parcelado ? parseInt(despesaData.numeroParcelas) : 1,
      comprovanteURL: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    console.log('💾 Salvando no Firestore:', dadosParaSalvar);

    const docRef = await addDoc(collection(db, 'despesas'), dadosParaSalvar);
    console.log('✅ Despesa salva com ID:', docRef.id);

    if (despesaData.comprovante && despesaData.comprovante instanceof File) {
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

    return docRef.id;
    
  } catch (error) {
    console.error('❌ Erro ao adicionar despesa:', error);
    throw error;
  }
};

/**
 * Busca todas as despesas
 */
export const buscarDespesas = async () => {
  try {
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
        vencimento: data.vencimento?.toDate().toISOString().split('T')[0],
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dataPagamento: data.dataPagamento?.toDate()
      };
    });
    
    console.log('✅ Despesas carregadas:', despesas.length);
    return despesas;
    
  } catch (error) {
    console.error('❌ Erro ao buscar despesas:', error);
    throw error;
  }
};

/**
 * Busca despesas do mês atual
 */
export const buscarDespesasMesAtual = async () => {
  try {
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
        vencimento: data.vencimento?.toDate().toISOString().split('T')[0],
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dataPagamento: data.dataPagamento?.toDate()
      };
    });
    
    console.log('✅ Despesas do mês carregadas:', despesas.length);
    return despesas;
    
  } catch (error) {
    console.error('❌ Erro ao buscar despesas do mês:', error);
    throw error;
  }
};

/**
 * Atualizar despesa
 */
export const atualizarDespesa = async (id, dados, novoComprovante = null) => {
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
      updatedAt: Timestamp.now()
    };

    if (dados.vencimento) {
      dadosAtualizados.vencimento = Timestamp.fromDate(new Date(dados.vencimento));
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
    console.log('✅ Despesa atualizada:', id);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar despesa:', error);
    throw error;
  }
};

/**
 * Deletar despesa
 */
export const deletarDespesa = async (id) => {
  try {
    await deleteDoc(doc(db, 'despesas', id));
    console.log('✅ Despesa deletada:', id);
    
  } catch (error) {
    console.error('❌ Erro ao deletar despesa:', error);
    throw error;
  }
};

/**
 * Atualizar status da despesa
 */
export const atualizarStatusDespesa = async (id, novoStatus) => {
  try {
    await updateDoc(doc(db, 'despesas', id), {
      status: novoStatus,
      updatedAt: Timestamp.now()
    });
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
export const calcularResumoDespesas = async () => {
  try {
    const despesas = await buscarDespesasMesAtual();
    
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