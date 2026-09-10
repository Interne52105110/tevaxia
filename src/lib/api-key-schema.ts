/** Recognize only an explicitly absent optional api_keys column. Never retry other failures. */
export function missingApiKeyColumn(error: unknown, columns: string[]): boolean {
 if (!error || typeof error !== 'object') return false;
 const { code, message } = error as { code?: unknown; message?: unknown };
 if ((code !== '42703' && code !== 'PGRST204') || typeof message !== 'string') return false;
 return columns.some(column => message.includes(`column api_keys.${column} does not exist`) || message.includes(`'${column}' column of 'api_keys'`));
}
