import { formError } from "@/lib/messages";

export function ErrorNote({ code }: { code?: string }) {
  const message = formError(code);
  if (!message) return null;
  return (
    <p className="error" role="alert">
      {message}
    </p>
  );
}
