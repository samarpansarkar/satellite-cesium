import { useState, useCallback } from "react";

interface UseApiOptions {
  baseUrl?: string;
  headers?: HeadersInit;
}

export function useApi(options?: UseApiOptions) {
  const baseUrl = options?.baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL;
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const request = useCallback(
    async <T = any>(endpoint: string, method: string = "GET", body?: any): Promise<T> => {
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
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  const get = useCallback(<T = any>(endpoint: string) => request<T>(endpoint, "GET"), [request]);
  const post = useCallback(<T = any>(endpoint: string, body: any) => request<T>(endpoint, "POST", body), [request]);
  const put = useCallback(<T = any>(endpoint: string, body: any) => request<T>(endpoint, "PUT", body), [request]);
  const patch = useCallback(<T = any>(endpoint: string, body: any) => request<T>(endpoint, "PATCH", body), [request]);
  const del = useCallback(<T = any>(endpoint: string) => request<T>(endpoint, "DELETE"), [request]);

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
