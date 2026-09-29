'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { NoteDto } from '@/lib/notes';
import { CreateNoteBody } from '@/lib/validation/notes';

const PRESET_COLORS = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Orange', value: '#fed7aa' },
];

const TEXT_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Dark', value: '#1f2937' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Purple', value: '#9333ea' },
];

type FormInput = z.input<typeof CreateNoteBody>;
type FormOutput = z.output<typeof CreateNoteBody>;

export function NoteForm({ note, onSaved }: { note?: NoteDto; onSaved?: () => void }) {
  const router = useRouter();
  const [tagInput, setTagInput] = useState(
    note?.tags ? note.tags.map((t) => t.name).join(', ') : '',
  );
  const [reminderInput, setReminderInput] = useState(
    note?.reminders && note.reminders.length > 0 && note.reminders[0]?.reminderTime
      ? new Date(note.reminders[0].reminderTime).toISOString().slice(0, 16)
      : '',
  );

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(CreateNoteBody),
    defaultValues: {
      title: note?.title ?? '',
      body: note?.body ?? '',
      color: note?.color ?? '#fef08a',
      isTitleBold: note?.isTitleBold ?? false,
      isBodyBulleted: note?.isBodyBulleted ?? false,
      bodyTextColor: note?.bodyTextColor ?? '',
      isArchived: note?.isArchived ?? false,
      positionX: note?.positionX ?? 20,
      positionY: note?.positionY ?? 20,
    },
  });

  async function onSubmit(values: FormOutput) {
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const reminders = reminderInput ? [new Date(reminderInput).toISOString()] : [];

    const payload = {
      ...values,
      tags,
      reminders,
    };

    const res = await fetch(note ? `/api/notes/${note.id}` : '/api/notes', {
      method: note ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = (await res.json().catch(() => ({}))) as { note?: NoteDto; error?: string };
    if (!res.ok || !body.note) {
      toast.error(body.error ?? 'Could not save the note');
      return;
    }

    toast.success(note ? 'Note updated' : 'Note created');
    if (onSaved) {
      onSaved();
    } else {
      router.push('/notes');
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  className="h-11 text-base"
                  placeholder="Note title..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isTitleBold"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Bold Title</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[120px] text-base"
                  placeholder="Write your note here..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap items-center gap-4">
          <FormField
            control={form.control}
            name="isBodyBulleted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">Bullet Points Style</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bodyTextColor"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-xs">Text Color</FormLabel>
                <FormControl>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  >
                    {TEXT_COLORS.map((c) => (
                      <option key={c.name} value={c.value}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note Background Color</FormLabel>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${
                      field.value === c.value
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => field.onChange(c.value)}
                    title={c.name}
                  />
                ))}
                <Input
                  type="color"
                  className="h-8 w-12 cursor-pointer p-1"
                  value={field.value ?? '#fef08a'}
                  onChange={field.onChange}
                  title="Custom Color"
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2">
          <FormLabel>Tags (comma separated)</FormLabel>
          <Input
            className="h-11 text-base"
            placeholder="work, personal, urgent"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <FormLabel>Reminder Time</FormLabel>
          <Input
            type="datetime-local"
            className="h-11 text-base"
            value={reminderInput}
            onChange={(e) => setReminderInput(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving…' : note ? 'Save Changes' : 'Create Note'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
