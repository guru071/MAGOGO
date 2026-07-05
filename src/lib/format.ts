export function formatAI(tool: string | string[] | null | undefined): string {
  if (!tool) return 'General';
  if (Array.isArray(tool)) return tool[0] || 'General';
  try {
    const parsed = JSON.parse(tool);
    if (Array.isArray(parsed)) return parsed[0] || 'General';
    return String(parsed);
  } catch { return tool; }
}
