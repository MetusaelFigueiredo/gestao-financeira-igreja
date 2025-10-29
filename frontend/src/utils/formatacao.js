/**
 * Formata valor para moeda brasileira (R$)
 */
export const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

/**
 * Formata data para padrão brasileiro
 */
export const formatarData = (data) => {
  return new Intl.DateTimeFormat('pt-BR').format(data);
};

/**
 * Converte Date para string no formato do input (YYYY-MM-DD)
 */
export const dataParaString = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};