import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Calcula o rateio baseado no tipo de entrada
 */
const calcularRateio = (tipo, valor) => {
  const valorNum = parseFloat(valor) || 0;
  
  if (tipo === 'santa_ceia') {
    return {
      central: 0,
      local: 0,
      missoes: valorNum
    };
  } else if (tipo === 'dizimo' || tipo === 'oferta') {
    return {
      central: valorNum * 0.60,
      local: valorNum * 0.40,
      missoes: 0
    };
  } else {
    return {
      central: 0,
      local: valorNum,
      missoes: 0
    };
  }
};

/**
 * Migra entradas que não têm rateio calculado
 */
export const migrarEntradasSemRateio = async () => {
  try {
    console.log('🔄 Iniciando migração de entradas sem rateio...');
    
    const entradasRef = collection(db, 'entradas');
    const snapshot = await getDocs(entradasRef);
    
    const entradasParaMigrar = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Verifica se a entrada não tem rateio ou se o rateio está incompleto
      if (!data.rateio || 
          (typeof data.rateio.central === 'undefined') ||
          (typeof data.rateio.local === 'undefined') ||
          (typeof data.rateio.missoes === 'undefined')) {
        
        entradasParaMigrar.push({
          id: docSnap.id,
          data: data
        });
      }
    });
    
    console.log(`📊 Found ${entradasParaMigrar.length} entradas para migrar`);
    
    if (entradasParaMigrar.length === 0) {
      return {
        success: true,
        message: '✅ Todas as entradas já têm rateio calculado!',
        migradas: 0
      };
    }
    
    let contador = 0;
    for (const entrada of entradasParaMigrar) {
      try {
        const rateio = calcularRateio(entrada.data.tipo, entrada.data.valor);
        
        const entradaRef = doc(db, 'entradas', entrada.id);
        await updateDoc(entradaRef, {
          rateio: rateio,
          migradoEm: new Date()
        });
        
        contador++;
        console.log(`✅ Entrada ${entrada.id} migrada:`, rateio);
        
      } catch (error) {
        console.error(`❌ Erro ao migrar entrada ${entrada.id}:`, error);
      }
    }
    
    return {
      success: true,
      message: `✅ Migração concluída! ${contador} entradas foram atualizadas.`,
      migradas: contador
    };
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verifica quantas entradas precisam de migração (sem executar)
 */
export const verificarEntradasSemRateio = async () => {
  try {
    const entradasRef = collection(db, 'entradas');
    const snapshot = await getDocs(entradasRef);
    
    let semRateio = 0;
    let comRateio = 0;
    const amostras = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      if (!data.rateio || 
          (typeof data.rateio.central === 'undefined') ||
          (typeof data.rateio.local === 'undefined') ||
          (typeof data.rateio.missoes === 'undefined')) {
        
        semRateio++;
        if (amostras.length < 3) {
          amostras.push({
            id: docSnap.id,
            tipo: data.tipo,
            valor: data.valor,
            rateio: data.rateio || null
          });
        }
      } else {
        comRateio++;
      }
    });
    
    return {
      success: true,
      resultado: {
        total: snapshot.size,
        comRateio,
        semRateio,
        amostras
      }
    };
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return {
      success: false,
      error: error.message
    };
  }
};