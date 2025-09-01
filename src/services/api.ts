import axios from 'axios'
import nookies from 'nookies'

// URL base da api que estamos construindo
const url: string = 'http://localhost:8080/v1'

// Configuração inicial do nosso cliente URL BASE, HEADERS (por padrão deixei json)
const api = axios.create({
  baseURL: url,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptador: usar o axios permite interceptar requisições e adicionar um token de permissão no cabeçalho
// Por padrão deixei somente o token, mas é possível adicionar outras informações
api.interceptors.request.use(
  (config) => {
    const cookies = nookies.get()
    const token = cookies.TK

    // se o token existir, é adicionado, lembrando que antes de fazer login não existe token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api