import type { Prisma } from '@prisma/client';

export const NOTE_SELECT = {
  id: true,
  title: true,
  body: true,
  color: true,
  isArchived: true,
  isTitleBold: true,
  isBodyBulleted: true,
  bodyTextColor: true,
  positionX: true,
  positionY: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  tags: {
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  },
  reminders: {
    select: {
      id: true,
      reminderTime: true,
      isNotified: true,
      createdAt: true,
    },
  },
} satisfies Prisma.NoteSelect;

export type NoteDto = Prisma.NoteGetPayload<{ select: typeof NOTE_SELECT }>;
