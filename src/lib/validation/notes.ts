import { z } from 'zod';

export const CreateTagBody = z.object({
  name: z.string().trim().min(1, 'Tag name cannot be empty').max(50, 'Tag name is too long'),
});

export const CreateReminderBody = z.object({
  reminderTime: z.string().datetime({ message: 'Invalid reminder time format' }),
});

export const UpdateReminderBody = z.object({
  reminderTime: z.string().datetime({ message: 'Invalid reminder time format' }).optional(),
  isNotified: z.boolean().optional(),
});

export const CreateNoteBody = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(200, 'Title is too long'),
  body: z.string().max(5000, 'Body is too long').optional().nullable(),
  color: z.string().min(1, 'Select a color'),
  isArchived: z.boolean().optional(),
  isTitleBold: z.boolean().optional(),
  isBodyBulleted: z.boolean().optional(),
  bodyTextColor: z.string().optional().nullable(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  reminders: z.array(z.string().datetime()).optional(),
});

export type CreateNoteBody = z.infer<typeof CreateNoteBody>;
export type UpdateNoteBody = z.infer<typeof CreateNoteBody.partial>;
