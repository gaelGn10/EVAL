import { useEffect, useState, useCallback } from "react";

const getAuthHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  return headers;
};

export const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, { signal, headers: getAuthHeaders(),  });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);

    return () => controller.abort();
  }, [fetchData]);

  const refetch = () => {
    const controller = new AbortController();
    fetchData(controller.signal);
  };

  return { data, loading, error, refetch };
};

export const useMutation = (url, method = "POST") => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const mutate = async (body) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
        
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      setResponse(json);
      return json;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error, response };
};

export const useLazyFetch = (baseUrl) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (params = {}) => {
      const controller = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${baseUrl}?${query}` : baseUrl;

        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: getAuthHeaders(),
          
        });

        if (!res.ok) {
          throw new Error(`Erreur ${res.status}`);
        }

        const json = await res.json();
        setData(json);
        return json;
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err);
          throw err;
        }
      } finally {
        setLoading(false);
      }
    },
    [baseUrl],
  );

  return { data, loading, error, fetchData };
};
