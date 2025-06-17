// Utilitário para manipulação de datas em fuso horário brasileiro
// Evita problemas de conversão UTC que podem alterar o dia

/**
 * Converte uma string de data (YYYY-MM-DD) para uma data no fuso horário local brasileiro
 * Evita problemas de conversão UTC
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formata uma data para string no formato YYYY-MM-DD sem conversão UTC
 * Mantém a data no fuso horário local
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extrai o período (MM/YYYY) de uma data sem problemas de fuso horário
 */
export function extractPeriod(dateString: string): string {
  const date = parseLocalDate(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
}

/**
 * Converte uma string de data para o formato de input HTML date
 * Garante que a data não seja alterada por fuso horário
 */
export function toInputDate(dateString: string): string {
  // Se já está no formato correto, retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Se está em outro formato, tenta converter
  const date = new Date(dateString);
  return formatLocalDate(date);
}

/**
 * Obtém a data atual no formato YYYY-MM-DD sem problemas de fuso horário
 */
export function getCurrentDate(): string {
  return formatLocalDate(new Date());
}

/**
 * Formata uma data para exibição (DD/MM/YYYY)
 */
export function formatDisplayDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Define a data atual no input date (para forms)
 */
export function getDefaultInputDate(): string {
  return getCurrentDate();
}

/**
 * Debug: Mostra como a data está sendo processada
 */
export function debugDate(dateString: string, context: string): void {
  console.log(`[DEBUG DATE] ${context}:`);
  console.log(`  Input: ${dateString}`);
  console.log(`  Parsed: ${parseLocalDate(dateString)}`);
  console.log(`  Period: ${extractPeriod(dateString)}`);
  console.log(`  Display: ${formatDisplayDate(dateString)}`);
} 