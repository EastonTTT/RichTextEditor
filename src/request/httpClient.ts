import axios,{AxiosInstance, AxiosRequestConfig } from "axios";
const baseURL = import.meta.env.VITE_DEV_API_BASE_URL

const httpClient: AxiosInstance = axios.create({
  baseURL:baseURL,
  timeout: 10000,
})

export function request(config: AxiosRequestConfig){
  return httpClient.request(config)
}

export default httpClient


