import { useState, useCallback } from "react";

interface UseFetchOptions {
  baseUrl?: string;
  headers?: HeadersInit;
}

export function useFetch(options?: UseFetchOptions) {
  const baseUrl = options?.baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL;
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const request = useCallback(
    async <T = unknown>(endpoint: string, method: string = "GET", body?: unknown): Promise<T> => {
      setIsLoading(true);
      setError(null);
      try {
        const config: RequestInit = {
          method,
          headers: defaultHeaders,
        };

        if (body) {
          config.body = JSON.stringify(body);
        }

        const response = await fetch(`${baseUrl}${endpoint}`, config);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        // Handle empty responses for DELETE or 204 No Content
        if (response.status === 204) return {} as T;

        const data = await response.json();
        return data as T;
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  const get = useCallback(<T = unknown>(endpoint: string) => request<T>(endpoint, "GET"), [request]);
  const post = useCallback(<T = unknown>(endpoint: string, body: unknown) => request<T>(endpoint, "POST", body), [request]);
  const put = useCallback(<T = unknown>(endpoint: string, body: unknown) => request<T>(endpoint, "PUT", body), [request]);
  const patch = useCallback(<T = unknown>(endpoint: string, body: unknown) => request<T>(endpoint, "PATCH", body), [request]);
  const del = useCallback(<T = unknown>(endpoint: string) => request<T>(endpoint, "DELETE"), [request]);

  return {
    get,
    post,
    put,
    patch,
    del,
    isLoading,
    error,
  };
}
