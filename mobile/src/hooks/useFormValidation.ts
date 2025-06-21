import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  number?: boolean;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface FieldConfig {
  [fieldName: string]: ValidationRule;
}

export interface FormErrors {
  [fieldName: string]: string;
}

export interface FormTouched {
  [fieldName: string]: boolean;
}

const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationConfig: FieldConfig
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((
    fieldName: string,
    value: any,
    config: ValidationRule
  ): string | null => {
    // Required validation
    if (config.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return config.message || `${fieldName} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    const stringValue = String(value);

    // Email validation
    if (config.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return config.message || 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (config.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(stringValue.replace(/[\s\-\(\)]/g, ''))) {
        return config.message || 'Please enter a valid phone number';
      }
    }

    // Number validation
    if (config.number) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return config.message || 'Please enter a valid number';
      }

      if (config.min !== undefined && numValue < config.min) {
        return config.message || `Value must be at least ${config.min}`;
      }

      if (config.max !== undefined && numValue > config.max) {
        return config.message || `Value must be at most ${config.max}`;
      }
    }

    // String length validation
    if (typeof value === 'string') {
      if (config.minLength && stringValue.length < config.minLength) {
        return config.message || `Must be at least ${config.minLength} characters`;
      }

      if (config.maxLength && stringValue.length > config.maxLength) {
        return config.message || `Must be at most ${config.maxLength} characters`;
      }
    }

    // Pattern validation
    if (config.pattern && !config.pattern.test(stringValue)) {
      return config.message || 'Invalid format';
    }

    // Custom validation
    if (config.custom) {
      return config.custom(value);
    }

    return null;
  }, []);

  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    Object.keys(validationConfig).forEach(fieldName => {
      const fieldValue = values[fieldName];
      const fieldConfig = validationConfig[fieldName];
      const error = validateField(fieldName, fieldValue, fieldConfig);
      
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    return newErrors;
  }, [values, validationConfig, validateField]);

  const setValue = useCallback((fieldName: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));

    // Validate field if it has been touched
    if (touched[fieldName as string]) {
      const fieldConfig = validationConfig[fieldName as string];
      if (fieldConfig) {
        const error = validateField(fieldName as string, value, fieldConfig);
        setErrors(prev => ({
          ...prev,
          [fieldName]: error || '',
        }));
      }
    }
  }, [touched, validationConfig, validateField]);

  const setFieldTouched = useCallback((fieldName: keyof T, isTouched = true) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: isTouched,
    }));

    // Validate field when touched
    if (isTouched) {
      const fieldValue = values[fieldName];
      const fieldConfig = validationConfig[fieldName as string];
      if (fieldConfig) {
        const error = validateField(fieldName as string, fieldValue, fieldConfig);
        setErrors(prev => ({
          ...prev,
          [fieldName]: error || '',
        }));
      }
    }
  }, [values, validationConfig, validateField]);

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void> | void
  ) => {
    setIsSubmitting(true);

    // Mark all fields as touched
    const allTouched: FormTouched = {};
    Object.keys(validationConfig).forEach(fieldName => {
      allTouched[fieldName] = true;
    });
    setTouched(allTouched);

    // Validate form
    const formErrors = validateForm();
    setErrors(formErrors);

    // Check if form is valid
    const hasErrors = Object.values(formErrors).some(error => error);

    if (!hasErrors) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        throw error;
      }
    }

    setIsSubmitting(false);
    return !hasErrors;
  }, [values, validationConfig, validateForm]);

  const reset = useCallback((newValues?: Partial<T>) => {
    setValues(newValues ? { ...initialValues, ...newValues } : initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldError = useCallback((fieldName: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }));
  }, []);

  const clearFieldError = useCallback((fieldName: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName as string];
      return newErrors;
    });
  }, []);

  const isValid = useMemo(() => {
    const formErrors = validateForm();
    return Object.values(formErrors).every(error => !error);
  }, [validateForm]);

  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => 
      values[key] !== initialValues[key]
    );
  }, [values, initialValues]);

  const getFieldProps = useCallback((fieldName: keyof T) => ({
    value: values[fieldName] || '',
    onChangeText: (value: any) => setValue(fieldName, value),
    onBlur: () => setFieldTouched(fieldName),
    error: touched[fieldName as string] && errors[fieldName as string],
  }), [values, setValue, setFieldTouched, touched, errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    setValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    handleSubmit,
    reset,
    validateForm,
    getFieldProps,
  };
};

// Predefined validation rules
export const validationRules = {
  required: { required: true },
  email: { email: true },
  phone: { phone: true },
  password: { 
    required: true, 
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
  },
  name: { 
    required: true, 
    minLength: 2, 
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Name must contain only letters and spaces'
  },
  amount: {
    required: true,
    number: true,
    min: 0,
    message: 'Amount must be a positive number'
  },
  percentage: {
    number: true,
    min: 0,
    max: 100,
    message: 'Percentage must be between 0 and 100'
  },
};

export default useFormValidation;
