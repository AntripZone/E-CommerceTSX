export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const resp = (
      err as {
        response?: {
          data?: { message?: string; msg?: string; error_description?: string };
        };
      }
    ).response;
    const msg =
      resp?.data?.message ?? resp?.data?.msg ?? resp?.data?.error_description;
    if (msg) return msg;
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}
