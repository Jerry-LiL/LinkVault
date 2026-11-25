export const FORM_ERRORS: Record<string, string> = {
  invalid: "Check the form and try again.",
  slug_taken: "That slug is already in use.",
  reserved: "That slug is reserved.",
  rate_limited: "You have created too many links in this window. Try again shortly.",
  credentials: "Invalid email or password.",
  email_taken: "An account with that email already exists.",
};

export function formError(code: string | undefined): string | null {
  if (!code) return null;
  return FORM_ERRORS[code] ?? "Something went wrong. Try again.";
}
