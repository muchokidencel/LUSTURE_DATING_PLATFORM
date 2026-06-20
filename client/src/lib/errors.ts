// Reads `err.response.data.message` off whatever was thrown, without requiring
// it to be a real AxiosError instance -- callers (and some test mocks) throw
// plain objects shaped like one, so we match the original `any`-typed
// behavior structurally instead of with axios's isAxiosError instance check.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string') return message;
  }
  return fallback;
}
