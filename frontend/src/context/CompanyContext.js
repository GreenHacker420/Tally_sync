import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { companyService } from '../services/companyService';
import toast from 'react-hot-toast';

const CompanyContext = createContext();

const initialState = {
  companies: [],
  currentCompany: null,
  loading: false,
  error: null,
};

const companyReducer = (state, action) => {
  switch (action.type) {
    case 'COMPANY_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FETCH_COMPANIES_SUCCESS':
      return {
        ...state,
        companies: action.payload,
        loading: false,
        error: null,
      };
    case 'SET_CURRENT_COMPANY':
      return {
        ...state,
        currentCompany: action.payload,
        loading: false,
        error: null,
      };
    case 'ADD_COMPANY':
      return {
        ...state,
        companies: [...state.companies, action.payload],
        loading: false,
        error: null,
      };
    case 'UPDATE_COMPANY':
      return {
        ...state,
        companies: state.companies.map(company =>
          company._id === action.payload._id ? action.payload : company
        ),
        currentCompany: state.currentCompany?._id === action.payload._id 
          ? action.payload 
          : state.currentCompany,
        loading: false,
        error: null,
      };
    case 'DELETE_COMPANY':
      return {
        ...state,
        companies: state.companies.filter(company => company._id !== action.payload),
        currentCompany: state.currentCompany?._id === action.payload 
          ? null 
          : state.currentCompany,
        loading: false,
        error: null,
      };
    case 'COMPANY_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const CompanyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(companyReducer, initialState);
  const { user } = useAuth();

  // Fetch companies when user is available
  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  // Set current company from localStorage or first company
  useEffect(() => {
    if (state.companies.length > 0 && !state.currentCompany) {
      const savedCompanyId = localStorage.getItem('currentCompanyId');
      const company = savedCompanyId 
        ? state.companies.find(c => c._id === savedCompanyId)
        : state.companies[0];
      
      if (company) {
        setCurrentCompany(company);
      }
    }
  }, [state.companies, state.currentCompany]);

  const fetchCompanies = async () => {
    try {
      dispatch({ type: 'COMPANY_START' });
      const response = await companyService.getCompanies();
      dispatch({
        type: 'FETCH_COMPANIES_SUCCESS',
        payload: response.data.companies,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch companies';
      dispatch({ type: 'COMPANY_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const createCompany = async (companyData) => {
    try {
      dispatch({ type: 'COMPANY_START' });
      const response = await companyService.createCompany(companyData);
      dispatch({
        type: 'ADD_COMPANY',
        payload: response.data.company,
      });
      toast.success('Company created successfully!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create company';
      dispatch({ type: 'COMPANY_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateCompany = async (companyId, companyData) => {
    try {
      dispatch({ type: 'COMPANY_START' });
      const response = await companyService.updateCompany(companyId, companyData);
      dispatch({
        type: 'UPDATE_COMPANY',
        payload: response.data.company,
      });
      toast.success('Company updated successfully!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update company';
      dispatch({ type: 'COMPANY_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteCompany = async (companyId) => {
    try {
      dispatch({ type: 'COMPANY_START' });
      await companyService.deleteCompany(companyId);
      dispatch({
        type: 'DELETE_COMPANY',
        payload: companyId,
      });
      toast.success('Company deleted successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete company';
      dispatch({ type: 'COMPANY_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const setCurrentCompany = (company) => {
    dispatch({
      type: 'SET_CURRENT_COMPANY',
      payload: company,
    });
    localStorage.setItem('currentCompanyId', company._id);
  };

  const addUserToCompany = async (companyId, userData) => {
    try {
      dispatch({ type: 'COMPANY_START' });
      const response = await companyService.addUserToCompany(companyId, userData);
      // Refresh company data
      await fetchCompanies();
      toast.success('User added to company successfully!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add user to company';
      dispatch({ type: 'COMPANY_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const removeUserFromCompany = async (companyId, userId) => {
    try {
      dispatch({ type: 'COMPANY_START' });
      await companyService.removeUserFromCompany(companyId, userId);
      // Refresh company data
      await fetchCompanies();
      toast.success('User removed from company successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove user from company';
      dispatch({ type: 'COMPANY_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    companies: state.companies,
    currentCompany: state.currentCompany,
    loading: state.loading,
    error: state.error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    setCurrentCompany,
    addUserToCompany,
    removeUserFromCompany,
    clearError,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
