import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// API client
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Accounts
export const accountsAPI = {
  getAll: () => api.get('/accounts'),
  getOne: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
};

// Transactions
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Investments
export const investmentsAPI = {
  getAll: () => api.get('/investments'),
  create: (data) => api.post('/investments', data),
  update: (id, data) => api.put(`/investments/${id}`, data),
  addOperation: (id, operation) => api.post(`/investments/${id}/operations`, operation),
  delete: (id) => api.delete(`/investments/${id}`),
};

// Goals
export const goalsAPI = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

// Debts
export const debtsAPI = {
  getAll: () => api.get('/debts'),
  create: (data) => api.post('/debts', data),
  update: (id, data) => api.put(`/debts/${id}`, data),
  delete: (id) => api.delete(`/debts/${id}`),
};

// Receivables
export const receivablesAPI = {
  getAll: () => api.get('/receivables'),
  create: (data) => api.post('/receivables', data),
  update: (id, data) => api.put(`/receivables/${id}`, data),
  delete: (id) => api.delete(`/receivables/${id}`),
};

// Products
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  recordPurchase: (id, location, price) => 
    api.post(`/products/${id}/purchase`, null, { params: { location, price } }),
};

// Shopping Lists
export const shoppingListsAPI = {
  getAll: () => api.get('/shopping-lists'),
  getOne: (id) => api.get(`/shopping-lists/${id}`),
  create: (data) => api.post('/shopping-lists', data),
  update: (id, data) => api.put(`/shopping-lists/${id}`, data),
  delete: (id) => api.delete(`/shopping-lists/${id}`),
  download: (id) => api.get(`/shopping-lists/${id}/download`),
};

// Bank Connections
export const bankConnectionsAPI = {
  getAll: () => api.get('/bank-connections'),
  create: (data) => api.post('/bank-connections', data),
  sync: (id) => api.post(`/bank-connections/${id}/sync`),
  delete: (id) => api.delete(`/bank-connections/${id}`),
};

// Dashboard
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
};

// Data Export/Import
export const dataAPI = {
  exportAll: () => api.get('/export/all'),
  importAll: (data) => api.post('/import/all', data),
};

// External APIs
export const externalAPI = {
  getExchangeRates: async (base = 'EUR') => {
    try {
      const response = await axios.get(`https://api.frankfurter.app/latest?from=${base}`);
      return response.data.rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return {};
    }
  },
  
  getCryptoPrice: async (symbol) => {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=eur`
      );
      return response.data[symbol]?.eur || 0;
    } catch (error) {
      console.error('Error fetching crypto price:', error);
      return 0;
    }
  },
};

export default api;
