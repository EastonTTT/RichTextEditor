import axios from "axios";
import type {AxiosInstance, AxiosRequestConfig } from 'axios'
const baseURL = import.meta.env.VITE_DEV_API_BASE_URL

const httpClient: AxiosInstance = axios.create({
  baseURL:baseURL,
  timeout: 10000,
})

export async function request(config: AxiosRequestConfig){
  return httpClient.request(config)
}

export default httpClient


