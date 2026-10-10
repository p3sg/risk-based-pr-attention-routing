export class ApiError extends Error {
  readonly status: number;
  constructor(status: number) { super('Dashboard data is unavailable. Check your connection or server configuration.'); this.status = status; }
}
export async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', signal, cache: 'no-store' });
  if (!response.ok) throw new ApiError(response.status);
  return response.json() as Promise<T>;
}
