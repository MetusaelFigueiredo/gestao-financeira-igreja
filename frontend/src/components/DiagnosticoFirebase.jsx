import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { verificarEntradasSemRateio, migrarEntradasSemRateio } from '../utils/migracaoRateio';

function DiagnosticoFirebase() {
  const [diagnostico, setDiagnostico] = useState({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    executarDiagnostico();
  }, []);

  const executarDiagnostico = async () => {
    setCarregando(true);
    const resultado = {};

    try {
      // 1. Verificar autenticação
      resultado.auth = {
        usuario: auth.currentUser ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName
        } : null,
        status: auth.currentUser ? '✅ Autenticado' : '❌ Não autenticado'
      };

      // 2. Verificar conexão com Firestore
      try {
        const testRef = collection(db, 'teste-conexao');
        resultado.firestore = {
          status: '✅ Conectado',
          database: db.app.options.projectId
        };
      } catch (error) {
        resultado.firestore = {
          status: '❌ Erro de conexão',
          erro: error.message
        };
      }

      // 3. Tentar buscar entradas
      try {
        const entradasRef = collection(db, 'entradas');
        const snapshot = await getDocs(entradasRef);
        
        resultado.entradas = {
          status: '✅ Busca bem-sucedida',
          total: snapshot.size,
          amostra: []
        };

        // Pegar uma amostra de 3 documentos
        let contador = 0;
        snapshot.forEach((doc) => {
          if (contador < 3) {
            resultado.entradas.amostra.push({
              id: doc.id,
              dados: doc.data()
            });
            contador++;
          }
        });

      } catch (error) {
        resultado.entradas = {
          status: '❌ Erro ao buscar',
          erro: error.message,
          codigo: error.code
        };
      }

      // 4. Tentar buscar despesas
      try {
        const despesasRef = collection(db, 'despesas');
        const snapshot = await getDocs(despesasRef);
        
        resultado.despesas = {
          status: '✅ Busca bem-sucedida',
          total: snapshot.size
        };
      } catch (error) {
        resultado.despesas = {
          status: '❌ Erro ao buscar',
          erro: error.message,
          codigo: error.code
        };
      }

      // 5. Verificar configurações
      try {
        const configRef = collection(db, 'configuracoes');
        const snapshot = await getDocs(configRef);
        
        resultado.configuracoes = {
          status: '✅ Busca bem-sucedida',
          total: snapshot.size
        };
      } catch (error) {
        resultado.configuracoes = {
          status: '❌ Erro ao buscar',
          erro: error.message
        };
      }

    } catch (error) {
      resultado.erro_geral = {
        status: '❌ Erro geral',
        erro: error.message
      };
    }

    setDiagnostico(resultado);
    setCarregando(false);
  };

  const criarEntradaTeste = async () => {
    try {
      const entradasRef = collection(db, 'entradas');
      
      const entradaTeste = {
        tipo: 'oferta',
        descricao: 'Teste de conectividade',
        valor: 10.00,
        data: Timestamp.now(),
        formaRecebimento: 'pix',
        rateio: {
          central: 6.00,
          local: 4.00,
          missoes: 0
        },
        pago: true,
        pagoEm: Timestamp.now(),
        criadoPor: auth.currentUser?.email || 'teste',
        criadoEm: Timestamp.now()
      };

      const docRef = await addDoc(entradasRef, entradaTeste);
      alert('✅ Entrada de teste criada com ID: ' + docRef.id);
      executarDiagnostico(); // Reexecutar diagnóstico
    } catch (error) {
      alert('❌ Erro ao criar entrada de teste: ' + error.message);
      console.error('Erro detalhado:', error);
    }
  };

  const verificarMigracao = async () => {
    const resultado = await verificarEntradasSemRateio();
    if (resultado.success) {
      alert(`📊 VERIFICAÇÃO DE RATEIO:\n\n` +
            `Total de entradas: ${resultado.resultado.total}\n` +
            `Com rateio: ${resultado.resultado.comRateio}\n` +
            `Sem rateio: ${resultado.resultado.semRateio}\n\n` +
            `Amostras de entradas sem rateio:\n` +
            resultado.resultado.amostras.map(a => `- ${a.tipo}: R$ ${a.valor}`).join('\n'));
    } else {
      alert('❌ Erro ao verificar: ' + resultado.error);
    }
  };

  const executarMigracao = async () => {
    if (!window.confirm('⚠️ ATENÇÃO!\n\nEsta operação vai atualizar todas as entradas que não têm rateio calculado.\n\nDeseja continuar?')) {
      return;
    }

    const resultado = await migrarEntradasSemRateio();
    if (resultado.success) {
      alert(resultado.message);
      executarDiagnostico(); // Reexecutar diagnóstico
    } else {
      alert('❌ Erro na migração: ' + resultado.error);
    }
  };

  if (carregando) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🔍 Executando Diagnóstico Firebase...</h2>
        <div>Por favor, aguarde...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5'
    }}>
      <h1>🔍 Diagnóstico Firebase</h1>
      
      <button 
        onClick={executarDiagnostico}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          backgroundColor: '#1a73e8',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔄 Executar Novamente
      </button>

      <button 
        onClick={criarEntradaTeste}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          marginLeft: '10px',
          backgroundColor: '#34a853',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        ➕ Criar Entrada Teste
      </button>

      <button 
        onClick={verificarMigracao}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          marginLeft: '10px',
          backgroundColor: '#ff9800',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔍 Verificar Rateio
      </button>

      <button 
        onClick={executarMigracao}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          marginLeft: '10px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🚀 Migrar Entradas
      </button>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
          {JSON.stringify(diagnostico, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default DiagnosticoFirebase;