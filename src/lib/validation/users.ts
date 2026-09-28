import { z } from 'zod';
import { ROLES } from '@/lib/roles';

// Shared by the API routes and the forms, so both reject the same input.

export const emailField = z
  .email('Enter a valid email')
  .max(200)
  .transform((e) => e.toLowerCase());
export const nameField = z.string().trim().min(1, 'Enter a name').max(100);
export const passwordField = z.string().min(8, 'At least 8 characters').max(200);

export const CreateUserBody = z.object({
  email: emailField,
  name: nameField,
  role: z.enum(ROLES),
  password: passwordField,
});
export type CreateUserBody = z.infer<typeof CreateUserBody>;

/** Every field optional; a password only when it changes. */
export const UpdateUserBody = CreateUserBody.partial();
export type UpdateUserBody = z.infer<typeof UpdateUserBody>;
