'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { NoteDto } from '@/lib/notes';
import { NoteForm } from './note-form';

export function NoteCard({ note }: { note: NoteDto }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState({
    x: note.positionX ?? 20,
    y: note.positionY ?? 20,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  function handleMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, [role="button"]')) {
      return;
    }
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    const newX = Math.max(0, e.clientX - dragOffset.x);
    const newY = Math.max(0, e.clientY - dragOffset.y);
    setPosition({ x: newX, y: newY });
  }

  async function handleMouseUp() {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ positionX: position.x, positionY: position.y }),
      });
      router.refresh();
    } catch {
      // ignore
    }
  }

  async function handleArchive() {
    const res = await fetch(`/api/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isArchived: !note.isArchived }),
    });
    if (res.ok) {
      toast.success(note.isArchived ? 'Note restored' : 'Note archived');
      router.refresh();
    } else {
      toast.error('Could not update note');
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/notes/${note.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      toast.success('Note deleted');
      router.refresh();
    } else {
      toast.error('Could not delete note');
    }
  }

  return (
    <section
      aria-label={note.title}
      className="absolute w-72 rounded-xl border shadow-lg transition-shadow hover:shadow-xl cursor-grab active:cursor-grabbing p-4 flex flex-col gap-3 select-none"
      style={{
        backgroundColor: note.color,
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging ? 50 : 10,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`text-base leading-snug break-words ${
            note.isTitleBold ? 'font-bold' : 'font-semibold'
          }`}
        >
          {note.title}
        </h3>
        <div className="flex items-center gap-1">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                ✎
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Note</DialogTitle>
              </DialogHeader>
              <NoteForm
                note={note}
                onSaved={() => {
                  setIsEditing(false);
                  router.refresh();
                }}
              />
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleArchive}
            title="Archive"
          >
            📥
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
            onClick={handleDelete}
            title="Delete"
          >
            ✕
          </Button>
        </div>
      </div>

      {note.body && (
        <div
          className={`text-sm break-words whitespace-pre-wrap ${
            note.isBodyBulleted ? 'list-disc pl-4' : ''
          }`}
          style={{ color: note.bodyTextColor ?? undefined }}
        >
          {note.body}
        </div>
      )}

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.map((t) => (
            <Badge key={t.id} variant="secondary" className="text-xs">
              {t.name}
            </Badge>
          ))}
        </div>
      )}

      {note.reminders &&
        note.reminders.length > 0 &&
        note.reminders[0]?.reminderTime &&
        (() => {
          const reminderTime = new Date(note.reminders[0].reminderTime);
          const isOverdue = reminderTime.getTime() <= Date.now();
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
          }
          if ('Notification' in window && Notification.permission === 'granted' && isOverdue) {
            new Notification('Reminder Due', { body: note.title });
          }
          return (
            <div
              className={`text-xs px-2 py-1 rounded border ${isOverdue ? 'border-destructive text-destructive bg-destructive/10 font-medium' : 'text-muted-foreground border-transparent'}`}
            >
              ⏰ Reminder: {reminderTime.toLocaleString()}
            </div>
          );
        })()}
    </section>
  );
}
