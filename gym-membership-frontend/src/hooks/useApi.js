import { useState, useEffect, useCallback } from "react";
import { getErrorMessage } from "../utils/formatters";

/**
 * Generic hook for async API calls with loading/error/data state management.
 *
 * @param {Function} apiCall - The API function to invoke (must return an Axios promise)
 * @param {Array} [deps=[]] - Dependencies to re-trigger the call
 * @param {boolean} [immediate=true] - Whether to call immediately on mount
 * @returns {{ data, loading, error, refetch }}
 */
export const useApi = (apiCall, deps = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      setData(response.data?.data ?? response.data);
      return response.data;
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {});
    }
  }, [execute, immediate]);

  return { data, loading, error, refetch: execute };
};

export default useApi;
