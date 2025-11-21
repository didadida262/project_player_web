const DEFAULT_API_BASE = "http://127.0.0.1:3001";

export const getApiConfig = () => {
  const envBase =
    import.meta.env.VITE_API_DEV || import.meta.env.VITE_API_PROD || DEFAULT_API_BASE;

  return {
    baseURL: envBase,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
    // withCredentials: true,
  };
};
