import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ApiResponse, api } from "./index";
// 封装常用方法

export const getFiles = <T>(params: any) => {
  return api.get<ApiResponse<T>>("/getFiles", { params });
};
