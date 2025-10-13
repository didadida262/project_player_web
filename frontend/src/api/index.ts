import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { getApiConfig } from "./config";

// 定义响应数据类型
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
  success: boolean;
}

// 创建axios实例
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create(getApiConfig());

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 可在此添加token等全局headers
      // const token = localStorage.getItem('token');
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: any) => {
      // 统一处理业务错误码
      //   if (!response.data.success) {
      //     // 可根据不同code做不同处理
      //     return Promise.reject(response.data);
      //   }
      return response.data;
    },
    (error) => {
      // 处理HTTP错误状态码
      if (error.response) {
        switch (error.response.status) {
          case 401:
            // 处理未授权
            break;
          case 404:
            // 处理未找到
            break;
          // 其他状态码...
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

export const api = createAxiosInstance();

// 封装常用方法
export const get = <T>(url: string, config?: AxiosRequestConfig) => {
  return api.get<ApiResponse<T>>(url, config);
};

export const post = <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
) => {
  return api.post<ApiResponse<T>>(url, data, config);
};

export const put = <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
) => {
  return api.put<ApiResponse<T>>(url, data, config);
};

export const del = <T>(url: string, config?: AxiosRequestConfig) => {
  return api.delete<ApiResponse<T>>(url, config);
};

// 导出原始实例以备特殊需求
export default api;
