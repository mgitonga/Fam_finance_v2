import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const changeRoleSchema = z.object({
  role: z.enum(['admin', 'contributor']),
});

export const acceptInviteSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
