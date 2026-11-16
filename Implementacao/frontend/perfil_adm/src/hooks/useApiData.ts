import { useCallback, useEffect, useState } from "react";

// Carrega dados da API. Sem cache local: o que a tela mostra é sempre o que o servidor devolve.
// `loader` é executado de novo quando `deps` ou a chamada de `reload` mudam.
export function useApiData<T>(loader: () => Promise<T>, initial: T, deps: unknown[] = []) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loader()
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || "Não foi possível carregar os dados.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // `loader` é recriado a cada render; o efeito depende só de `deps` e de `version`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, loading, error, reload };
}
