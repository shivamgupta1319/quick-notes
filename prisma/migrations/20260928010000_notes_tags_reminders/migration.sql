CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "color" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isTitleBold" BOOLEAN NOT NULL DEFAULT false,
    "isBodyBulleted" BOOLEAN NOT NULL DEFAULT false,
    "bodyTextColor" TEXT,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "reminderTime" TIMESTAMP(3) NOT NULL,
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "noteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Note_userId_idx" ON "Note"("userId");

CREATE INDEX "Tag_noteId_idx" ON "Tag"("noteId");

CREATE INDEX "Reminder_noteId_idx" ON "Reminder"("noteId");

ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Tag" ADD CONSTRAINT "Tag_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
