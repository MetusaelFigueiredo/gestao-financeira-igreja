import { useState, useEffect } from 'react';
import {
  salvarBackupNuvem,
  listarBackupsNuvem,
  baixarBackupNuvem,
  deletarBackupNuvem,
  baixarBackupLocal,
  salvarBackupNavegador,
  getBackupNavegador,
  limparBackupNavegador,
  formatarTamanho,
  formatarData
} from '../services/backup';
import '../styles/Backup.css';

const Backup = () => {
  const [loading, setLoading] = useState(false);
  const [backupsNuvem, setBackupsNuvem] = useState([]);
  const [backupNavegador, setBackupNavegador] = useState(null);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    carregarBackups();
  }, []);

  const mostrarMensagem = (tipo, texto) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem({ tipo: '', texto: '' }), 5000);
  };

  const carregarBackups = async () => {
    try {
      // Listar backups da nuvem
      const backups = await listarBackupsNuvem();
      setBackupsNuvem(backups);

      // Verificar backup do navegador
      const backupLocal = getBackupNavegador();
      setBackupNavegador(backupLocal);

    } catch (error) {
      console.error('Erro ao carregar backups:', error);
    }
  };

  const handleSalvarNuvem = async () => {
    if (!window.confirm('📤 Fazer backup na nuvem agora?')) return;

    setLoading(true);
    try {
      const resultado = await salvarBackupNuvem();
      mostrarMensagem('sucesso', `✅ Backup salvo na nuvem! ${resultado.nomeArquivo}`);
      carregarBackups();
    } catch (error) {
      mostrarMensagem('erro', '❌ Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarLocal = async () => {
    setLoading(true);
    try {
      await baixarBackupLocal();
      mostrarMensagem('sucesso', '✅ Backup baixado com sucesso!');
    } catch (error) {
      mostrarMensagem('erro', '❌ Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarNavegador = async () => {
    setLoading(true);
    try {
      await salvarBackupNavegador();
      carregarBackups();
      mostrarMensagem('sucesso', '✅ Backup salvo no navegador!');
    } catch (error) {
      mostrarMensagem('erro', '❌ Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarNuvem = async (backup) => {
    setLoading(true);
    try {
      await baixarBackupNuvem(backup.url, backup.nome);
      mostrarMensagem('sucesso', '✅ Backup baixado!');
    } catch (error) {
      mostrarMensagem('erro', '❌ Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletarNuvem = async (backup) => {
    if (!window.confirm(`🗑️ Deletar backup "${backup.nome}"?`)) return;

    setLoading(true);
    try {
      await deletarBackupNuvem(backup.nome);
      mostrarMensagem('sucesso', '✅ Backup deletado!');
      carregarBackups();
    } catch (error) {
      mostrarMensagem('erro', '❌ Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLimparNavegador = () => {
    if (!window.confirm('🗑️ Remover backup do navegador?')) return;

    limparBackupNavegador();
    carregarBackups();
    mostrarMensagem('sucesso', '✅ Backup do navegador removido!');
  };

  return (
    <div className="backup-container">
      <div className="backup-header">
        <h1>🗓️ Backup e Restauração</h1>
        <p>Proteja seus dados com backups regulares</p>
      </div>

      {mensagem.texto && (
        <div className={`mensagem ${mensagem.tipo}`}>
          {mensagem.texto}
        </div>
      )}

      {/* Ações Rápidas */}
      <div className="backup-acoes">
        <div className="acao-card">
          <div className="acao-icone">☁️</div>
          <h3>Backup na Nuvem</h3>
          <p>Salva no Firebase Storage (acessível por todos)</p>
          <button
            onClick={handleSalvarNuvem}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '⏳ Salvando...' : '☁️ Salvar na Nuvem'}
          </button>
        </div>

        <div className="acao-card">
          <div className="acao-icone">💾</div>
          <h3>Download Local</h3>
          <p>Baixa arquivo JSON direto no seu computador</p>
          <button
            onClick={handleBaixarLocal}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? '⏳ Gerando...' : '⬇️ Baixar Agora'}
          </button>
        </div>

        <div className="acao-card">
          <div className="acao-icone">💻</div>
          <h3>Salvar no Navegador</h3>
          <p>Cópia offline no localStorage (até 10MB)</p>
          <button
            onClick={handleSalvarNavegador}
            disabled={loading}
            className="btn-tertiary"
          >
            {loading ? '⏳ Salvando...' : '💾 Salvar Offline'}
          </button>
        </div>
      </div>

      {/* Backups da Nuvem */}
      <div className="backups-secao">
        <h2>☁️ Backups na Nuvem ({backupsNuvem.length})</h2>

        {backupsNuvem.length === 0 ? (
          <div className="sem-backups">
            <div className="sem-backups-icone">📂</div>
            <p>Nenhum backup na nuvem</p>
            <small>Clique em "Salvar na Nuvem" para criar o primeiro backup</small>
          </div>
        ) : (
          <div className="backups-lista">
            {backupsNuvem.map((backup, index) => (
              <div key={index} className="backup-item">
                <div className="backup-info">
                  <div className="backup-nome">📄 {backup.nome}</div>
                  <div className="backup-detalhes">
                    <span>📅 {formatarData(backup.dataUpload)}</span>
                    <span>📦 {formatarTamanho(backup.tamanho)}</span>
                    <span>☁️ {backup.tipo}</span>
                  </div>
                </div>
                <div className="backup-acoes-item">
                  <button
                    onClick={() => handleBaixarNuvem(backup)}
                    disabled={loading}
                    className="btn-small btn-download"
                  >
                    ⬇️ Baixar
                  </button>
                  <button
                    onClick={() => handleDeletarNuvem(backup)}
                    disabled={loading}
                    className="btn-small btn-delete"
                  >
                    🗑️ Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup do Navegador */}
      <div className="backups-secao">
        <h2>💻 Backup Offline (Navegador)</h2>

        {!backupNavegador ? (
          <div className="sem-backups">
            <div className="sem-backups-icone">💾</div>
            <p>Nenhum backup offline</p>
            <small>Clique em "Salvar Offline" para criar uma cópia local</small>
          </div>
        ) : (
          <div className="backup-item">
            <div className="backup-info">
              <div className="backup-nome">💾 Backup Local</div>
              <div className="backup-detalhes">
                <span>📅 {formatarData(backupNavegador.data)}</span>
                <span>👥 {backupNavegador.backup.totais.membros} membros</span>
                <span>💰 {backupNavegador.backup.totais.entradas} entradas</span>
                <span>💸 {backupNavegador.backup.totais.despesas} despesas</span>
              </div>
            </div>
            <div className="backup-acoes-item">
              <button
                onClick={handleLimparNavegador}
                className="btn-small btn-delete"
              >
                🗑️ Remover
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="backup-info-box">
        <h3>ℹ️ Informações Importantes</h3>
        <ul>
          <li>✅ Backups incluem: Membros, Entradas e Despesas</li>
          <li>☁️ Backups na nuvem ficam no Firebase Storage (acessível por todos)</li>
          <li>💾 Backup offline fica salvo no navegador (funciona sem internet)</li>
          <li>⚠️ Comprovantes (anexos) NÃO são incluídos nos backups</li>
          <li>📅 Recomendamos fazer backup semanal</li>
          <li>🔒 Mantenha sempre uma cópia local de segurança</li>
        </ul>
      </div>
    </div>
  );
};

export default Backup;