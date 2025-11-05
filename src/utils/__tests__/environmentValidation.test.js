import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  validateEnvironmentVariables, 
  canApplicationStart, 
  getEnvVar, 
  getSupabaseConfig,
  generateEnvErrorMessage 
} from '../environmentValidation';

// Mock import.meta.env
const mockEnv = {};

vi.mock('import.meta', () => ({
  env: mockEnv
}));

describe('Environment Validation', () => {
  beforeEach(() => {
    // Clear mock environment before each test
    Object.keys(mockEnv).forEach(key => delete mockEnv[key]);
  });

  describe('validateEnvironmentVariables', () => {
    it('should return valid when all required variables are present', () => {
      mockEnv.VITE_SUPABASE_URL = 'https://test.supabase.co';
      mockEnv.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key-that-is-long-enough-to-pass-validation';

      const result = validateEnvironmentVariables();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.missingRequired).toHaveLength(0);
    });

    it('should return invalid when required variables are missing', () => {
      const result = validateEnvironmentVariables();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.missingRequired).toContain('VITE_SUPABASE_URL');
      expect(result.missingRequired).toContain('VITE_SUPABASE_ANON_KEY');
    });

    it('should validate Supabase URL format', () => {
      mockEnv.VITE_SUPABASE_URL = 'invalid-url';
      mockEnv.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key-that-is-long-enough-to-pass-validation';

      const result = validateEnvironmentVariables();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.variable === 'VITE_SUPABASE_URL')).toBe(true);
    });

    it('should validate Supabase key length', () => {
      mockEnv.VITE_SUPABASE_URL = 'https://test.supabase.co';
      mockEnv.VITE_SUPABASE_ANON_KEY = 'short-key';

      const result = validateEnvironmentVariables();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.variable === 'VITE_SUPABASE_ANON_KEY')).toBe(true);
    });
  });

  describe('canApplicationStart', () => {
    it('should return true when environment is valid', () => {
      mockEnv.VITE_SUPABASE_URL = 'https://test.supabase.co';
      mockEnv.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key-that-is-long-enough-to-pass-validation';

      expect(canApplicationStart()).toBe(true);
    });

    it('should return false when environment is invalid', () => {
      expect(canApplicationStart()).toBe(false);
    });
  });

  describe('getEnvVar', () => {
    it('should return environment variable value', () => {
      mockEnv.TEST_VAR = 'test-value';

      expect(getEnvVar('TEST_VAR')).toBe('test-value');
    });

    it('should return fallback when variable is missing', () => {
      expect(getEnvVar('MISSING_VAR', 'fallback')).toBe('fallback');
    });

    it('should return empty string as default fallback', () => {
      expect(getEnvVar('MISSING_VAR')).toBe('');
    });
  });

  describe('getSupabaseConfig', () => {
    it('should return config when valid variables are present', () => {
      mockEnv.VITE_SUPABASE_URL = 'https://test.supabase.co';
      mockEnv.VITE_SUPABASE_ANON_KEY = 'test-key';

      const config = getSupabaseConfig();

      expect(config).toEqual({
        url: 'https://test.supabase.co',
        anonKey: 'test-key'
      });
    });

    it('should return null when variables are missing', () => {
      expect(getSupabaseConfig()).toBeNull();
    });

    it('should return null when URL is invalid', () => {
      mockEnv.VITE_SUPABASE_URL = 'invalid-url';
      mockEnv.VITE_SUPABASE_ANON_KEY = 'test-key';

      expect(getSupabaseConfig()).toBeNull();
    });
  });

  describe('generateEnvErrorMessage', () => {
    it('should return empty string for no missing variables', () => {
      expect(generateEnvErrorMessage([])).toBe('');
    });

    it('should generate formatted error message for missing variables', () => {
      const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
      const message = generateEnvErrorMessage(missing);

      expect(message).toContain('Missing required environment variables:');
      expect(message).toContain('- VITE_SUPABASE_URL');
      expect(message).toContain('- VITE_SUPABASE_ANON_KEY');
    });
  });
});