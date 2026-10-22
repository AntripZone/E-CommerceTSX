import { useState, useEffect } from "react";

interface UseApiResult<T> {
  data: T | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

export function useApi<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = [],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contador, setContador] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);

    fetchFn()
      .then((result) => {
        if (!cancelado) {
          setData(result);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setError(
            err instanceof Error ? err.message : "Error al cargar los datos",
          );
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [contador, ...deps]);

  return { data, cargando, error, recargar: () => setContador((c) => c + 1) };
}
