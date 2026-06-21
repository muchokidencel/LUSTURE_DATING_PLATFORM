// Reads `err.response.data.message` off whatever was thrown, without requiring
// it to be a real AxiosError instance -- callers (and some test mocks) throw
// plain objects shaped like one, so we match the original `any`-typed
// behavior structurally instead of with axios's isAxiosError instance check.
//
// Also handles the validate() middleware's Zod shape (server/src/middleware/validate.ts):
// { status: 'error', errors: [{ path, message }] } -- there's no top-level
// `message` in that response, so without this, validation failures (e.g. an
// empty display name) would silently show only the generic fallback text.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as {
      response?: { data?: { message?: unknown; errors?: { message?: unknown }[] } };
    }).response;
    const message = response?.data?.message;
    if (typeof message === 'string') return message;

    const firstZodMessage = response?.data?.errors?.[0]?.message;
    if (typeof firstZodMessage === 'string') return firstZodMessage;
  }
  return fallback;
}
