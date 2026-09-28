'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_LABELS, ROLES } from '@/lib/roles';
import type { UserDto } from '@/lib/users';
import { emailField, nameField, passwordField } from '@/lib/validation/users';

function formSchema(editing: boolean) {
  return z.object({
    email: emailField,
    name: nameField,
    role: z.enum(ROLES),
    // When editing, an empty password keeps the current one.
    password: editing ? z.union([z.literal(''), passwordField]) : passwordField,
  });
}
type FormInput = z.input<ReturnType<typeof formSchema>>;
type FormOutput = z.output<ReturnType<typeof formSchema>>;

/** Create a user, or edit `user` when given. Sends JSON to the API and opens the user after. */
export function UserForm({ user }: { user?: UserDto }) {
  const router = useRouter();
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema(user !== undefined)),
    defaultValues: {
      email: user?.email ?? '',
      name: user?.name ?? '',
      role: user?.role ?? 'MEMBER',
      password: '',
    },
  });

  async function onSubmit({ password, ...values }: FormOutput) {
    const res = await fetch(user ? `/api/users/${user.id}` : '/api/users', {
      method: user ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(password ? { ...values, password } : values),
    });
    const body = (await res.json().catch(() => ({}))) as { user?: UserDto; error?: string };
    if (res.status === 409) {
      form.setError('email', { message: body.error ?? 'Email already in use' });
      return;
    }
    if (!res.ok || !body.user) {
      toast.error(body.error ?? 'Could not save the user');
      return;
    }
    toast.success(user ? 'User updated' : 'User created');
    router.push(`/users/${body.user.id}`);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" className="h-11 text-base" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" className="h-11 text-base" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{user ? 'New password' : 'Password'}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  className="h-11 text-base"
                  {...field}
                />
              </FormControl>
              {user && <FormDescription>Leave empty to keep the current password.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving…' : user ? 'Save changes' : 'Create user'}
          </Button>
          <Button type="button" variant="outline" className="h-11" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
