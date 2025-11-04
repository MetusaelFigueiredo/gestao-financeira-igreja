// utils para agregar entradas e gerar os valores para os cards (total, central, local, missoes)
// calcula também subtotais por forma de recebimento (pix / dinheiro)

export const inicioDoMes = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0,0,0,0);
  return d;
};

export const fimDoMes = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23,59,59,999);
  return d;
};

const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  return new Date(val);
};

/**
 * Filtra entradas pelo período (mês/ano da referência)
 * entradas: array de objetos com campo data (Date ou string)
 * referencia: Date (ex: new Date())
 */
export const filtrarPorMes = (entradas, referencia = new Date()) => {
  const inicio = inicioDoMes(referencia);
  const fim = fimDoMes(referencia);
  return (entradas || []).filter(e => {
    const d = toDate(e.data);
    if (!d) return false;
    return d >= inicio && d <= fim;
  });
};

/**
 * Normaliza forma de recebimento para chaves: pix, dinheiro, outro
 */
const formaKey = (forma) => {
  if (!forma) return 'outro';
  const f = String(forma).toLowerCase();
  if (f === 'pix' || f === 'transferencia' || f === 'transferência') return 'pix';
  if (f === 'dinheiro' || f === 'cash' || f === 'money') return 'dinheiro';
  return 'outro';
};

/**
 * Calcula resumo para os 4 cards:
 * - Entrada Total (valor total + subtotais por forma)
 * - Igreja Central (soma rateio.central + subtotais por forma sobre central)
 * - Igreja Local (soma rateio.local + subtotais por forma sobre local)
 * - Missões (soma rateio.missoes + subtotais por forma sobre missoes)
 *
 * Também retorna contagens (totalCount, centralCount, localCount, missoesCount)
 *
 * entradas: array com objetos { valor:Number, rateio:{central,local,missoes}, formaRecebimento, data }
 * referencia: Date para mês (default new Date())
 */
export const calcularResumoMes = (entradas = [], referencia = new Date()) => {
  const entradasDoMes = filtrarPorMes(entradas, referencia);

  const resumo = {
    // Entrada Total
    total: 0,
    totalCount: 0,
    totalByForma: { pix: 0, dinheiro: 0, outro: 0 },

    // Central
    central: 0,
    centralCount: 0,
    centralByForma: { pix: 0, dinheiro: 0, outro: 0 },

    // Local
    local: 0,
    localCount: 0,
    localByForma: { pix: 0, dinheiro: 0, outro: 0 },

    // Missoes
    missoes: 0,
    missoesCount: 0,
    missoesByForma: { pix: 0, dinheiro: 0, outro: 0 }
  };

  entradasDoMes.forEach(e => {
    const valor = Number(e.valor) || 0;
    const fKey = formaKey(e.formaRecebimento);

    // Total
    resumo.total += valor;
    resumo.totalCount += 1;
    resumo.totalByForma[fKey] = (resumo.totalByForma[fKey] || 0) + valor;

    // Central - suporta tanto formato antigo quanto novo
    const centralVal = e.rateio && (Number(e.rateio.central) || Number(e.rateio['Igreja Central'])) ? 
                      (Number(e.rateio.central) || Number(e.rateio['Igreja Central'])) : 0;
    if (centralVal > 0) {
      resumo.central += centralVal;
      resumo.centralCount += 1;
      resumo.centralByForma[fKey] = (resumo.centralByForma[fKey] || 0) + centralVal;
    }

    // Local - suporta tanto formato antigo quanto novo
    const localVal = e.rateio && (Number(e.rateio.local) || Number(e.rateio['Igreja Local'])) ? 
                    (Number(e.rateio.local) || Number(e.rateio['Igreja Local'])) : 0;
    if (localVal > 0) {
      resumo.local += localVal;
      resumo.localCount += 1;
      resumo.localByForma[fKey] = (resumo.localByForma[fKey] || 0) + localVal;
    }

    // Missoes - suporta tanto formato antigo quanto novo
    const missoesVal = e.rateio && (Number(e.rateio.missoes) || Number(e.rateio['Missões'])) ? 
                      (Number(e.rateio.missoes) || Number(e.rateio['Missões'])) : 0;
    if (missoesVal > 0) {
      resumo.missoes += missoesVal;
      resumo.missoesCount += 1;
      resumo.missoesByForma[fKey] = (resumo.missoesByForma[fKey] || 0) + missoesVal;
    }
  });

  const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

  return {
    // Total
    total: round2(resumo.total),
    totalCount: resumo.totalCount,
    totalByForma: {
      pix: round2(resumo.totalByForma.pix || 0),
      dinheiro: round2(resumo.totalByForma.dinheiro || 0),
      outro: round2(resumo.totalByForma.outro || 0)
    },

    // Central
    central: round2(resumo.central),
    centralCount: resumo.centralCount,
    centralByForma: {
      pix: round2(resumo.centralByForma.pix || 0),
      dinheiro: round2(resumo.centralByForma.dinheiro || 0),
      outro: round2(resumo.centralByForma.outro || 0)
    },

    // Local
    local: round2(resumo.local),
    localCount: resumo.localCount,
    localByForma: {
      pix: round2(resumo.localByForma.pix || 0),
      dinheiro: round2(resumo.localByForma.dinheiro || 0),
      outro: round2(resumo.localByForma.outro || 0)
    },

    // Missoes
    missoes: round2(resumo.missoes),
    missoesCount: resumo.missoesCount,
    missoesByForma: {
      pix: round2(resumo.missoesByForma.pix || 0),
      dinheiro: round2(resumo.missoesByForma.dinheiro || 0),
      outro: round2(resumo.missoesByForma.outro || 0)
    }
  };
};