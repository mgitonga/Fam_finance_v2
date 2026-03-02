import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth';

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const validData = {
    name: 'John Doe',
    email: 'john@example.com',
    householdName: 'The Doe Family',
    password: 'MyPass1!',
    confirmPassword: 'MyPass1!',
  };

  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validData, name: 'J' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects household name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validData, householdName: 'X' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'Ab1!',
      confirmPassword: 'Ab1!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without a number', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'MyPasswd!',
      confirmPassword: 'MyPasswd!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without a special character', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'MyPasswd1',
      confirmPassword: 'MyPasswd1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: 'DifferentPass1!',
    });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'test@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-valid' });
    expect(result.success).toBe(false);
  });

  it('rejects empty email', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects password without number', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NoNumbers!',
      confirmPassword: 'NoNumbers!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without special character', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NoSpecial1',
      confirmPassword: 'NoSpecial1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'ValidPass1!',
      confirmPassword: 'MismatchPass1!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Ab1!',
      confirmPassword: 'Ab1!',
    });
    expect(result.success).toBe(false);
  });
});
