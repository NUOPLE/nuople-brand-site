export async function getLarkUserInfo(): Promise<{ code: number; msg: string; data: Record<string, unknown> }> {
  return { code: 1, msg: 'not available in standalone mode', data: {} };
}

export default { getLarkUserInfo };
