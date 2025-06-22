import { apiClient } from '../../src/services/apiClient';
import MockAdapter from 'axios-mock-adapter';

describe('ApiClient', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(apiClient['client']);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('HTTP Methods', () => {
    it('should make GET requests successfully', async () => {
      const responseData = { data: 'test' };
      mockAxios.onGet('/test').reply(200, responseData);

      const response = await apiClient.get('/test');
      expect(response.data).toEqual(responseData);
    });

    it('should make POST requests successfully', async () => {
      const requestData = { name: 'test' };
      const responseData = { id: 1, ...requestData };
      mockAxios.onPost('/test', requestData).reply(201, responseData);

      const response = await apiClient.post('/test', requestData);
      expect(response.data).toEqual(responseData);
    });

    it('should make PUT requests successfully', async () => {
      const requestData = { name: 'updated' };
      const responseData = { id: 1, ...requestData };
      mockAxios.onPut('/test/1', requestData).reply(200, responseData);

      const response = await apiClient.put('/test/1', requestData);
      expect(response.data).toEqual(responseData);
    });

    it('should make DELETE requests successfully', async () => {
      mockAxios.onDelete('/test/1').reply(204);

      const response = await apiClient.delete('/test/1');
      expect(response.status).toBe(204);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockAxios.onGet('/test').networkError();

      try {
        await apiClient.get('/test');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.isNetworkError).toBe(true);
        expect(error.message).toContain('Network error');
      }
    });

    it('should handle timeout errors', async () => {
      mockAxios.onGet('/test').timeout();

      try {
        await apiClient.get('/test');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.isTimeoutError).toBe(true);
        expect(error.message).toContain('timed out');
      }
    });

    it('should handle 401 unauthorized errors', async () => {
      mockAxios.onGet('/test').reply(401, { message: 'Unauthorized' });

      try {
        await apiClient.get('/test');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(401);
        expect(error.message).toBe('Unauthorized');
      }
    });

    it('should handle 500 server errors', async () => {
      mockAxios.onGet('/test').reply(500, { message: 'Internal Server Error' });

      try {
        await apiClient.get('/test');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(500);
        expect(error.message).toBe('Internal Server Error');
      }
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      mockAxios
        .onGet('/test')
        .replyOnce(500)
        .onGet('/test')
        .replyOnce(500)
        .onGet('/test')
        .reply(200, { data: 'success' });

      const response = await apiClient.get('/test', {
        retry: { retries: 3, retryDelay: 100 }
      });

      expect(response.data).toEqual({ data: 'success' });
    });

    it('should not retry on 4xx errors', async () => {
      mockAxios.onGet('/test').reply(400, { message: 'Bad Request' });

      try {
        await apiClient.get('/test', {
          retry: { retries: 3 }
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(400);
      }
    });
  });

  describe('Request Cancellation', () => {
    it('should create and manage cancel tokens', () => {
      const controller = apiClient.createCancelToken('test-request');
      expect(controller).toBeInstanceOf(AbortController);
    });

    it('should cancel specific requests', () => {
      const controller = apiClient.createCancelToken('test-request');
      const abortSpy = jest.spyOn(controller, 'abort');

      apiClient.cancelRequest('test-request');
      expect(abortSpy).toHaveBeenCalled();
    });

    it('should cancel all requests', () => {
      const controller1 = apiClient.createCancelToken('request-1');
      const controller2 = apiClient.createCancelToken('request-2');
      
      const abort1Spy = jest.spyOn(controller1, 'abort');
      const abort2Spy = jest.spyOn(controller2, 'abort');

      apiClient.cancelAllRequests();
      
      expect(abort1Spy).toHaveBeenCalled();
      expect(abort2Spy).toHaveBeenCalled();
    });
  });

  describe('Health Check', () => {
    it('should return true for successful health check', async () => {
      mockAxios.onGet('/health').reply(200);

      const isHealthy = await apiClient.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false for failed health check', async () => {
      mockAxios.onGet('/health').reply(500);

      const isHealthy = await apiClient.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('Error Details', () => {
    it('should provide detailed error information', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: { field: 'name is required' }
          }
        }
      };

      const errorDetails = apiClient.getErrorDetails(axiosError);

      expect(errorDetails).toEqual({
        message: 'Validation failed',
        status: 422,
        code: 'VALIDATION_ERROR',
        isNetworkError: false,
        isTimeoutError: false
      });
    });

    it('should handle non-axios errors', () => {
      const regularError = new Error('Regular error');

      const errorDetails = apiClient.getErrorDetails(regularError);

      expect(errorDetails).toEqual({
        message: 'Regular error',
        isNetworkError: false,
        isTimeoutError: false
      });
    });
  });
});
