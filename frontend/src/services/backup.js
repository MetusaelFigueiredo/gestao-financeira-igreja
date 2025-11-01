import { collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject, getMetadata } from 'firebase/storage';
import { db, storage } from './firebase';

/**
 * Exporta todos os dados do Firestore
 */
export const exportarDados = async () => {
  try {
    console.log('📦 Iniciando exportação de dados...');

    // Buscar todas as coleções do Firestore
    const [membrosSnap, entradasSnap, despesasSnap] = await Promise.all([
      getDocs(collection(db, 'membros')),
      getDocs(collection(db, 'entradas')),
      getDocs(collection(db, 'despesas'))
    ]);

    // Converter Firestore docs para arrays
    const membros = membrosSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString()
    }));

    const entradas = entradasSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data?.toDate().toISOString(),
      createdAt: doc.data().createdAt?.toDate().toISOString()
    }));

    const despesas = despesasSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      vencimento: doc.data().vencimento,
      dataPagamento: doc.data().dataPagamento || null,
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString()
    }));

    // Montar objeto de backup
    const backup = {
      versao: '1.0.0',
      sistema: 'Gestão Financeira Igreja',
      dataExportacao: new Date().toISOString(),
      totais: {
        membros: membros.length,
        entradas: entradas.length,
        despesas: despesas.length
      },
      dados: {
        membros,
        entradas,
        despesas
      }
    };

    console.log('✅ Exportação concluída:', backup.totais);
    return backup;

  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error);
    throw new Error('Erro ao exportar dados: ' + error.message);
  }
};

/**
 * Salva backup no Firebase Storage (nuvem)
 */
export const salvarBackupNuvem = async () => {
  try {
    console.log('☁️ Salvando backup na nuvem...');

    // Gerar backup
    const backup = await exportarDados();

    // Criar nome do arquivo com data/hora
    const dataHora = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const nomeArquivo = `backup-${dataHora}-${hora}.json`;

    // Converter para Blob
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });

    // Upload para Firebase Storage
    const storageRef = ref(storage, `backups/${nomeArquivo}`);
    await uploadBytes(storageRef, blob);

    // Pegar URL de download
    const url = await getDownloadURL(storageRef);

    console.log('✅ Backup salvo na nuvem:', nomeArquivo);

    return {
      sucesso: true,
      nomeArquivo,
      url,
      tamanho: blob.size,
      totais: backup.totais
    };

  } catch (error) {
    console.error('❌ Erro ao salvar backup na nuvem:', error);
    throw new Error('Erro ao salvar backup na nuvem: ' + error.message);
  }
};

/**
 * Lista todos os backups salvos no Firebase Storage
 */
export const listarBackupsNuvem = async () => {
  try {
    console.log('📋 Listando backups da nuvem...');

    const backupsRef = ref(storage, 'backups/');
    const resultado = await listAll(backupsRef);

    const backups = await Promise.all(
      resultado.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);

        return {
          nome: itemRef.name,
          url,
          tamanho: metadata.size,
          dataUpload: metadata.timeCreated,
          tipo: 'Nuvem (Firebase Storage)'
        };
      })
    );

    // Ordenar por data (mais recente primeiro)
    backups.sort((a, b) => new Date(b.dataUpload) - new Date(a.dataUpload));

    console.log('✅ Backups encontrados:', backups.length);
    return backups;

  } catch (error) {
    console.error('❌ Erro ao listar backups:', error);
    throw new Error('Erro ao listar backups: ' + error.message);
  }
};

/**
 * Baixa backup do Firebase Storage
 */
export const baixarBackupNuvem = async (url, nomeArquivo) => {
  try {
    console.log('⬇️ Baixando backup:', nomeArquivo);

    // Fazer download do arquivo
    const response = await fetch(url);
    const blob = await response.blob();

    // Criar link de download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    console.log('✅ Backup baixado com sucesso!');
    return true;

  } catch (error) {
    console.error('❌ Erro ao baixar backup:', error);
    throw new Error('Erro ao baixar backup: ' + error.message);
  }
};

/**
 * Deleta backup do Firebase Storage
 */
export const deletarBackupNuvem = async (nomeArquivo) => {
  try {
    console.log('🗑️ Deletando backup:', nomeArquivo);

    const storageRef = ref(storage, `backups/${nomeArquivo}`);
    await deleteObject(storageRef);

    console.log('✅ Backup deletado com sucesso!');
    return true;

  } catch (error) {
    console.error('❌ Erro ao deletar backup:', error);
    throw new Error('Erro ao deletar backup: ' + error.message);
  }
};

/**
 * Faz download direto do backup (sem salvar na nuvem)
 */
export const baixarBackupLocal = async () => {
  try {
    console.log('💾 Gerando backup para download...');

    const backup = await exportarDados();

    // Criar blob JSON
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });

    // Criar URL temporária
    const url = URL.createObjectURL(blob);

    // Criar link de download
    const link = document.createElement('a');
    const dataHora = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `backup-local-${dataHora}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ Backup baixado com sucesso!');
    return true;

  } catch (error) {
    console.error('❌ Erro ao baixar backup:', error);
    throw error;
  }
};

/**
 * Salva backup no localStorage do navegador
 */
export const salvarBackupNavegador = async () => {
  try {
    console.log('💻 Salvando backup no navegador...');

    const backup = await exportarDados();

    // Salvar no localStorage
    localStorage.setItem('backup_igreja', JSON.stringify(backup));
    localStorage.setItem('backup_igreja_data', new Date().toISOString());

    console.log('✅ Backup salvo no navegador!');
    return true;

  } catch (error) {
    console.error('❌ Erro ao salvar no navegador:', error);
    throw new Error('Erro ao salvar no navegador: ' + error.message);
  }
};

/**
 * Recupera backup do localStorage
 */
export const getBackupNavegador = () => {
  try {
    const backup = localStorage.getItem('backup_igreja');
    const data = localStorage.getItem('backup_igreja_data');

    if (!backup || !data) return null;

    return {
      backup: JSON.parse(backup),
      data: new Date(data)
    };

  } catch (error) {
    console.error('❌ Erro ao recuperar backup do navegador:', error);
    return null;
  }
};

/**
 * Remove backup do localStorage
 */
export const limparBackupNavegador = () => {
  try {
    localStorage.removeItem('backup_igreja');
    localStorage.removeItem('backup_igreja_data');
    console.log('✅ Backup do navegador removido');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar backup:', error);
    return false;
  }
};

/**
 * Formata tamanho de arquivo
 */
export const formatarTamanho = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Formata data
 */
export const formatarData = (data) => {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};  