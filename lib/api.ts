import axios, { AxiosRequestConfig, AxiosInstance } from 'axios'

// Создаем интерфейс для параметров запроса
interface ApiHelperOptions {
  baseURL: string;
  token: string | null;
}

class ApiHelper {
  private axiosInstance: AxiosInstance

  constructor(options: ApiHelperOptions) {
    this.axiosInstance = axios.create({
      baseURL: options.baseURL,
      withCredentials: true,
    })
  }

  // Метод GET
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config)
    return response.data
  }

  // Метод POST
  public async post<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config)
    return response.data
  }

  // Метод PUT
  public async put<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config)
    return response.data
  }

  // Метод PATCH
  public async patch<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config)
    return response.data
  }

  // Метод DELETE
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config)
    return response.data
  }
}

const token = localStorage.getItem('token')
const api = new ApiHelper({ baseURL: 'http://localhost:8080/api/', token })

export default api