import api from './api';

export const companyService = {
  // Get all companies
  getCompanies: async () => {
    const response = await api.get('/companies');
    return response.data;
  },

  // Get single company
  getCompany: async (id) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  // Create company
  createCompany: async (companyData) => {
    const response = await api.post('/companies', companyData);
    return response.data;
  },

  // Update company
  updateCompany: async (id, companyData) => {
    const response = await api.put(`/companies/${id}`, companyData);
    return response.data;
  },

  // Delete company
  deleteCompany: async (id) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },

  // Add user to company
  addUserToCompany: async (companyId, userData) => {
    const response = await api.post(`/companies/${companyId}/users`, userData);
    return response.data;
  },

  // Remove user from company
  removeUserFromCompany: async (companyId, userId) => {
    const response = await api.delete(`/companies/${companyId}/users/${userId}`);
    return response.data;
  },
};
