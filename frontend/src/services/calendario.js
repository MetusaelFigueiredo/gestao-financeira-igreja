/**
 * Gera arquivo .ics (iCalendar) para adicionar ao calendário
 * @param {Object} despesa - Objeto da despesa
 * @returns {void} - Faz download do arquivo .ics
 */
export const exportarParaCalendario = (despesa) => {
  try {
    // Validar se existe vencimento
    if (!despesa.vencimento) {
      alert('⚠️ Esta despesa não possui data de vencimento!');
      return;
    }

    // Converter data de vencimento para formato iCalendar
    const dataVencimento = new Date(despesa.vencimento);
    
    // Formatar data no formato iCalendar (YYYYMMDD)
    const formatarDataICS = (data) => {
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      return `${ano}${mes}${dia}`;
    };

    // Formatar data e hora atual no formato iCalendar (YYYYMMDDTHHmmssZ)
    const formatarDataHoraICS = (data) => {
      const ano = data.getUTCFullYear();
      const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(data.getUTCDate()).padStart(2, '0');
      const hora = String(data.getUTCHours()).padStart(2, '0');
      const min = String(data.getUTCMinutes()).padStart(2, '0');
      const seg = String(data.getUTCSeconds()).padStart(2, '0');
      return `${ano}${mes}${dia}T${hora}${min}${seg}Z`;
    };

    const dtstart = formatarDataICS(dataVencimento);
    const dtstamp = formatarDataHoraICS(new Date());

    // Criar descrição com informações da despesa
    const descricao = `Valor: R$ ${despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\\n` +
                     `Categoria: ${despesa.categoria || 'Sem categoria'}\\n` +
                     `Forma de Pagamento: ${despesa.formaPagamento || 'Não informado'}\\n` +
                     (despesa.observacoes ? `Observações: ${despesa.observacoes}` : '');

    // Criar conteúdo do arquivo .ics
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gestão Financeira Igreja//BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${despesa.id}@gestao-financeira-igreja`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtstart}`,
      `SUMMARY:Vencimento: ${despesa.descricao}`,
      `DESCRIPTION:${descricao}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Lembrete: ${despesa.descricao} vence amanhã`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    // Criar blob e fazer download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    
    // Criar link de download
    const link = document.createElement('a');
    link.href = url;
    
    // Nome do arquivo: vencimento-{descricao}-{data}.ics
    const nomeArquivo = `vencimento-${despesa.descricao.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${dtstart}.ics`;
    link.download = nomeArquivo;
    
    // Fazer download
    document.body.appendChild(link);
    link.click();
    
    // Limpar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Arquivo .ics criado:', nomeArquivo);
    alert('✅ Arquivo de calendário baixado! Abra o arquivo para adicionar ao seu calendário.');
    
  } catch (error) {
    console.error('❌ Erro ao exportar para calendário:', error);
    alert('❌ Erro ao exportar para calendário: ' + error.message);
  }
};
