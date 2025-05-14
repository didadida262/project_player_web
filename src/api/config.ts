export const getApiConfig = () => {
  const isDev = import.meta.env.MODE === "development"; // 或者
  return {
    baseURL: isDev
      ? import.meta.env.VITE_API_DEV
      : import.meta.env.VITE_API_PROD,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
    // withCredentials: true,
  };
};
