/** Keep the submit action available only for usable email/password input. */
export function isLoginFormReady(email: string, password: string): boolean {
  const normalizedEmail = email.trim();
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) && password.length > 0
  );
}
