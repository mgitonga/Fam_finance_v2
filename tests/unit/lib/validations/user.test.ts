import { describe, it, expect } from 'vitest';
import { updateProfileSchema, inviteUserSchema, changeRoleSchema } from '@/lib/validations/user';

describe('updateProfileSchema', () => {
  it('accepts valid name', () => {
    const result = updateProfileSchema.safeParse({ name: 'John Doe' });
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 characters', () => {
    const result = updateProfileSchema.safeParse({ name: 'J' });
    expect(result.success).toBe(false);
  });

  it('rejects name over 100 characters', () => {
    const result = updateProfileSchema.safeParse({ name: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('inviteUserSchema', () => {
  it('accepts valid invite data', () => {
    const result = inviteUserSchema.safeParse({
      email: 'jane@example.com',
      name: 'Jane Doe',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = inviteUserSchema.safeParse({
      email: 'not-valid',
      name: 'Jane Doe',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short name', () => {
    const result = inviteUserSchema.safeParse({
      email: 'jane@example.com',
      name: 'J',
    });
    expect(result.success).toBe(false);
  });
});

describe('changeRoleSchema', () => {
  it('accepts admin role', () => {
    const result = changeRoleSchema.safeParse({ role: 'admin' });
    expect(result.success).toBe(true);
  });

  it('accepts contributor role', () => {
    const result = changeRoleSchema.safeParse({ role: 'contributor' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = changeRoleSchema.safeParse({ role: 'viewer' });
    expect(result.success).toBe(false);
  });

  it('rejects empty role', () => {
    const result = changeRoleSchema.safeParse({ role: '' });
    expect(result.success).toBe(false);
  });
});
