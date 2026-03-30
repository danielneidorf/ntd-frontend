/**
 * Paysera PIS redirect handler.
 * Frontend only handles the redirect — all API logic is on the backend.
 */

export function redirectToPaysera(redirectUrl: string): void {
  window.location.href = redirectUrl;
}
