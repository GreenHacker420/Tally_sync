'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { companyService } from '@/services/companyService';
import { Company } from '@/types';

interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  loading: boolean;
  error: string | null;
}

type CompanyAction =
  | { type: 'COMPANIES_START' }
  | { type: 'COMPANIES_SUCCESS'; payload: Company[] }
  | { type: 'COMPANIES_FAILURE'; payload: string }
  | { type: 'SET_CURRENT_COMPANY'; payload: Company | null }
  | { type: 'ADD_COMPANY'; payload: Company }
  | { type: 'UPDATE_COMPANY'; payload: Company }
  | { type: 'REMOVE_COMPANY'; payload: string }
  | { type: 'CLEAR_ERROR' };

interface CompanyContextType extends CompanyState {
  fetchCompanies: () => Promise<void>;
  setCurrentCompany: (company: Company | null) => void;
  createCompany: (companyData: Partial<Company>) => Promise<Company>;
  updateCompany: (id: string, companyData: Partial<Company>) => Promise<Company>;
  deleteCompany: (id: string) => Promise<void>;
  clearError: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const initialState: CompanyState = {
  companies: [],
  currentCompany: null,
  loading: false,
  error: null,
};

const companyReducer = (state: CompanyState, action: CompanyAction): CompanyState => {
  switch (action.type) {
    case 'COMPANIES_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'COMPANIES_SUCCESS':
      return {
        ...state,
        companies: action.payload,
        loading: false,
        error: null,
      };
    case 'COMPANIES_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'SET_CURRENT_COMPANY':
      return {
        ...state,
        currentCompany: action.payload,
      };
    case 'ADD_COMPANY':
      return {
        ...state,
        companies: [...state.companies, action.payload],
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
      };
    case 'REMOVE_COMPANY':
      return {
        ...state,
        companies: state.companies.filter(company => company._id !== action.payload),
        currentCompany: state.currentCompany?._id === action.payload 
          ? null 
          : state.currentCompany,
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

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(companyReducer, initialState);

  // Load companies and current company from localStorage on mount
  useEffect(() => {
    const loadStoredData = () => {
      if (typeof window !== 'undefined') {
        try {
          const storedCurrentCompany = localStorage.getItem('currentCompany');
          if (storedCurrentCompany) {
            const company = JSON.parse(storedCurrentCompany);
            dispatch({ type: 'SET_CURRENT_COMPANY', payload: company });
          }
        } catch (error) {
          console.error('Error loading stored company data:', error);
        }
      }
    };

    loadStoredData();
  }, []);

  // Store current company in localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (state.currentCompany) {
        localStorage.setItem('currentCompany', JSON.stringify(state.currentCompany));
      } else {
        localStorage.removeItem('currentCompany');
      }
    }
  }, [state.currentCompany]);

  const fetchCompanies = async () => {
    try {
      dispatch({ type: 'COMPANIES_START' });
      const response = await companyService.getCompanies();
      dispatch({ type: 'COMPANIES_SUCCESS', payload: response.data });
      
      // If no current company is set and companies exist, set the first one
      if (!state.currentCompany && response.data.length > 0) {
        dispatch({ type: 'SET_CURRENT_COMPANY', payload: response.data[0] });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch companies';
      dispatch({ type: 'COMPANIES_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const setCurrentCompany = (company: Company | null) => {
    dispatch({ type: 'SET_CURRENT_COMPANY', payload: company });
  };

  const createCompany = async (companyData: Partial<Company>): Promise<Company> => {
    try {
      const response = await companyService.createCompany(companyData);
      const newCompany = response.data!;
      
      dispatch({ type: 'ADD_COMPANY', payload: newCompany });
      
      // Set as current company if it's the first one
      if (state.companies.length === 0) {
        dispatch({ type: 'SET_CURRENT_COMPANY', payload: newCompany });
      }
      
      toast.success('Company created successfully!');
      return newCompany;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create company';
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateCompany = async (id: string, companyData: Partial<Company>): Promise<Company> => {
    try {
      const response = await companyService.updateCompany(id, companyData);
      const updatedCompany = response.data!;
      
      dispatch({ type: 'UPDATE_COMPANY', payload: updatedCompany });
      toast.success('Company updated successfully!');
      return updatedCompany;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update company';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteCompany = async (id: string): Promise<void> => {
    try {
      await companyService.deleteCompany(id);
      dispatch({ type: 'REMOVE_COMPANY', payload: id });
      toast.success('Company deleted successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete company';
      toast.error(errorMessage);
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: CompanyContextType = {
    companies: state.companies,
    currentCompany: state.currentCompany,
    loading: state.loading,
    error: state.error,
    fetchCompanies,
    setCurrentCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    clearError,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
