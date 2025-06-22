import { configureStore } from '@reduxjs/toolkit';
import companyReducer, {
  fetchCompanies,
  fetchCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  clearError,
  setSelectedCompany,
} from '../../../src/store/slices/companySlice';
import { Company } from '../../../src/types';

// Mock the company service
jest.mock('../../../src/services/companyService', () => ({
  companyService: {
    getCompanies: jest.fn(),
    getCompanyById: jest.fn(),
    createCompany: jest.fn(),
    updateCompany: jest.fn(),
    deleteCompany: jest.fn(),
  },
}));

const mockCompany: Company = {
  id: '1',
  name: 'Test Company',
  email: 'test@company.com',
  phone: '1234567890',
  address: '123 Test St',
  gstNumber: 'GST123',
  panNumber: 'PAN123',
  isActive: true,
  settings: {},
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('companySlice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        company: companyReducer,
      },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().company;
      expect(state).toEqual({
        companies: [],
        selectedCompany: null,
        isLoading: false,
        error: null,
        stats: null,
        settings: null,
        users: [],
        usersLoading: false,
      });
    });
  });

  describe('reducers', () => {
    it('should clear error', () => {
      // Set an error first
      store.dispatch({ type: 'company/fetchCompanies/rejected', payload: 'Test error' });
      expect(store.getState().company.error).toBe('Test error');

      // Clear the error
      store.dispatch(clearError());
      expect(store.getState().company.error).toBeNull();
    });

    it('should set selected company', () => {
      store.dispatch(setSelectedCompany(mockCompany));
      expect(store.getState().company.selectedCompany).toEqual(mockCompany);
    });

    it('should clear selected company', () => {
      store.dispatch(setSelectedCompany(mockCompany));
      store.dispatch(setSelectedCompany(null));
      expect(store.getState().company.selectedCompany).toBeNull();
    });
  });

  describe('async thunks', () => {
    const { companyService } = require('../../../src/services/companyService');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('fetchCompanies', () => {
      it('should handle successful fetch', async () => {
        const companies = [mockCompany];
        companyService.getCompanies.mockResolvedValue({ data: companies });

        await store.dispatch(fetchCompanies());

        const state = store.getState().company;
        expect(state.isLoading).toBe(false);
        expect(state.companies).toEqual(companies);
        expect(state.error).toBeNull();
      });

      it('should handle fetch error', async () => {
        const errorMessage = 'Failed to fetch companies';
        companyService.getCompanies.mockRejectedValue(new Error(errorMessage));

        await store.dispatch(fetchCompanies());

        const state = store.getState().company;
        expect(state.isLoading).toBe(false);
        expect(state.companies).toEqual([]);
        expect(state.error).toBe(errorMessage);
      });

      it('should set loading state during fetch', () => {
        companyService.getCompanies.mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
        );

        store.dispatch(fetchCompanies());

        const state = store.getState().company;
        expect(state.isLoading).toBe(true);
      });
    });

    describe('fetchCompanyById', () => {
      it('should fetch and set selected company', async () => {
        companyService.getCompanyById.mockResolvedValue({ data: mockCompany });

        await store.dispatch(fetchCompanyById(mockCompany.id));

        const state = store.getState().company;
        expect(state.selectedCompany).toEqual(mockCompany);
      });

      it('should update company in list if it exists', async () => {
        // Add company to list first
        store.dispatch({ 
          type: 'company/fetchCompanies/fulfilled', 
          payload: [mockCompany] 
        });

        const updatedCompany = { ...mockCompany, name: 'Updated Company' };
        companyService.getCompanyById.mockResolvedValue({ data: updatedCompany });

        await store.dispatch(fetchCompanyById(mockCompany.id));

        const state = store.getState().company;
        expect(state.companies[0]).toEqual(updatedCompany);
        expect(state.selectedCompany).toEqual(updatedCompany);
      });
    });

    describe('createCompany', () => {
      it('should add new company to list', async () => {
        const newCompany = { ...mockCompany, id: '2', name: 'New Company' };
        companyService.createCompany.mockResolvedValue({ data: newCompany });

        await store.dispatch(createCompany({
          name: 'New Company',
          email: 'new@company.com',
          phone: '1234567890',
          address: '456 New St',
        }));

        const state = store.getState().company;
        expect(state.companies).toContain(newCompany);
        expect(state.companies[0]).toEqual(newCompany); // Should be at the beginning
      });
    });

    describe('updateCompany', () => {
      it('should update company in list and selected company', async () => {
        // Add company to list and select it
        store.dispatch({ 
          type: 'company/fetchCompanies/fulfilled', 
          payload: [mockCompany] 
        });
        store.dispatch(setSelectedCompany(mockCompany));

        const updatedCompany = { ...mockCompany, name: 'Updated Company' };
        companyService.updateCompany.mockResolvedValue({ data: updatedCompany });

        await store.dispatch(updateCompany({
          id: mockCompany.id,
          data: { name: 'Updated Company' }
        }));

        const state = store.getState().company;
        expect(state.companies[0]).toEqual(updatedCompany);
        expect(state.selectedCompany).toEqual(updatedCompany);
      });
    });

    describe('deleteCompany', () => {
      it('should remove company from list', async () => {
        // Add company to list
        store.dispatch({ 
          type: 'company/fetchCompanies/fulfilled', 
          payload: [mockCompany] 
        });

        companyService.deleteCompany.mockResolvedValue({});

        await store.dispatch(deleteCompany(mockCompany.id));

        const state = store.getState().company;
        expect(state.companies).toHaveLength(0);
      });

      it('should clear selected company if it was deleted', async () => {
        // Add company to list and select it
        store.dispatch({ 
          type: 'company/fetchCompanies/fulfilled', 
          payload: [mockCompany] 
        });
        store.dispatch(setSelectedCompany(mockCompany));

        companyService.deleteCompany.mockResolvedValue({});

        await store.dispatch(deleteCompany(mockCompany.id));

        const state = store.getState().company;
        expect(state.selectedCompany).toBeNull();
      });
    });
  });

  describe('error handling', () => {
    const { companyService } = require('../../../src/services/companyService');

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      companyService.getCompanies.mockRejectedValue(networkError);

      await store.dispatch(fetchCompanies());

      const state = store.getState().company;
      expect(state.error).toBe('Network error');
    });

    it('should handle API errors with custom messages', async () => {
      const apiError = {
        message: 'Custom API error',
        status: 422,
        code: 'VALIDATION_ERROR'
      };
      companyService.getCompanies.mockRejectedValue(apiError);

      await store.dispatch(fetchCompanies());

      const state = store.getState().company;
      expect(state.error).toBe('Custom API error');
    });
  });

  describe('loading states', () => {
    const { companyService } = require('../../../src/services/companyService');

    it('should manage loading state correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      companyService.getCompanies.mockReturnValue(promise);

      // Start the async action
      const action = store.dispatch(fetchCompanies());

      // Should be loading
      expect(store.getState().company.isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!({ data: [mockCompany] });
      await action;

      // Should not be loading anymore
      expect(store.getState().company.isLoading).toBe(false);
    });
  });
});
