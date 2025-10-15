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
  updateOperation: (id, operationIndex, operation) => api.put(`/investments/${id}/operations/${operationIndex}`, operation),
  deleteOperation: (id, operationIndex) => api.delete(`/investments/${id}/operations/${operationIndex}`),
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
  addPayment: (id, payment) => api.post(`/debts/${id}/payments`, payment),
  updatePayment: (id, paymentIndex, payment) => api.put(`/debts/${id}/payments/${paymentIndex}`, payment),
  deletePayment: (id, paymentIndex) => api.delete(`/debts/${id}/payments/${paymentIndex}`),
  delete: (id) => api.delete(`/debts/${id}`),
};

// Receivables (Créances)
export const receivablesAPI = {
  getAll: () => api.get('/receivables'),
  create: (data) => api.post('/receivables', data),
  update: (id, data) => api.put(`/receivables/${id}`, data),
  addPayment: (id, payment) => api.post(`/receivables/${id}/payments`, payment),
  updatePayment: (id, paymentIndex, payment) => api.put(`/receivables/${id}/payments/${paymentIndex}`, payment),
  deletePayment: (id, paymentIndex) => api.delete(`/receivables/${id}/payments/${paymentIndex}`),
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
  addItem: (listId, productId, quantity = 1) => api.post(`/shopping-lists/${listId}/items`, null, { params: { product_id: productId, quantity } }),
  removeItem: (listId, productId) => api.delete(`/shopping-lists/${listId}/items/${productId}`),
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

// Categories
export const categoriesAPI = {
  getAll: (type) => api.get('/categories', { params: { type } }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Search
export const searchAPI = {
  search: (query) => api.get('/search', { params: { q: query } }),
};

// Tasks (Eisenhower Matrix)
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  toggleComplete: (id) => api.patch(`/tasks/${id}/complete`),
  moveQuadrant: (id, quadrant) => api.patch(`/tasks/${id}/move`, null, { params: { quadrant } }),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Payees/Locations
export const payeesAPI = {
  getAll: () => api.get('/payees'),
  create: (data) => api.post('/payees', data),
  update: (id, data) => api.put(`/payees/${id}`, data),
  delete: (id) => api.delete(`/payees/${id}`),
};

// Preferences
export const preferencesAPI = {
  get: () => api.get('/preferences'),
  update: (data) => api.put('/preferences', data),
};

// Currency
export const currencyAPI = {
  getRates: (base) => api.get('/currency/rates', { params: { base } }),
};

// Transfers
export const transfersAPI = {
  transfer: (fromId, toId, amount, description) =>
    api.post('/accounts/transfer', null, {
      params: { from_account_id: fromId, to_account_id: toId, amount, description }
    }),
};

// Data Export/Import
export const dataAPI = {
  exportAll: () => api.get('/export/all'),
  importAll: (data) => api.post('/import/all', data),
  deleteAllUserData: () => api.delete('/user/data/all'),
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
