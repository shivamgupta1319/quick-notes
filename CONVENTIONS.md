# Conventions

How code is laid out and written in this app. Every change follows these rules; the `users`
resource is the worked example of each one.

## Stack and checks

Next.js (App Router) in TypeScript, Prisma on PostgreSQL, shadcn/ui on Tailwind CSS, zod, vitest.

| Check | Command | Must pass before a change is done |
|---|---|---|
| Lint and format | `pnpm lint` (Biome; `pnpm lint:fix` fixes most issues) | yes |
| Types | `pnpm typecheck` | yes |
| Tests | `pnpm test` (needs `DATABASE_URL` for a database named `*_test`) | yes |
| Build | `pnpm build` | yes |

## Layout

```text
prisma/schema.prisma            one model per entity
prisma/migrations/<ts>_<name>/  one migration per schema change
src/app/(app)/<resource>/       pages that need a signed-in user
src/app/api/<resource>/         REST route handlers (+ their tests)
src/components/ui/              shadcn/ui components (do not edit)
src/components/<resource>/      forms and widgets for one resource
src/config/nav.ts               top navigation entries
src/lib/validation/<resource>.ts zod schemas shared by API and forms
src/lib/<resource>.ts           Prisma `select` and DTO type for the resource
src/lib/{api,auth,session,db}.ts  platform helpers (do not change their behaviour)
test/helpers.ts                 resetDb, createUser, request, params
```

## Adding a resource (for example `projects`)

1. **Model.** Add the model to `prisma/schema.prisma` with `id String @id @default(cuid())`,
   `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`. Relations to `User`
   use `onDelete` explicitly.
2. **Migration.** Add `prisma/migrations/<yyyymmddhhmmss>_<name>/migration.sql` with the SQL for
   the change. The `migrations match prisma/schema.prisma` test fails until the SQL is right, and
   its failure message prints the missing SQL. Never edit a migration that already exists.
3. **Validation.** `src/lib/validation/projects.ts`: `CreateProjectBody` and
   `UpdateProjectBody = CreateProjectBody.partial()`, with user-facing messages.
4. **Select and DTO.** `src/lib/projects.ts`: `PROJECT_SELECT` (only fields the client may see)
   and `type ProjectDto`.
5. **API.** `src/app/api/projects/route.ts` (`GET` list, `POST` create) and
   `src/app/api/projects/[id]/route.ts` (`GET`, `PATCH`, `DELETE`):
   - wrap every handler in `withUser(handler, { roles })`; there are no public routes except
     health and auth;
   - read the body with `parseBody(req, Schema)`; throw `ApiError(404 | 409 | 400, message)`;
   - lists are paginated with `parsePage` + `pageArgs` and return `Page<Dto>`;
   - always `select` with the resource's select, never return the raw row;
   - scope rows to the user when the resource is personal (`where: { ownerId: user.id }`), and
     answer 404, not 403, for someone else's row;
   - dynamic routes type the context as `RouteContext<'/api/projects/[id]'>`.
6. **Pages.** Under `src/app/(app)/projects/`: `page.tsx` (list), `new/page.tsx`,
   `[id]/page.tsx` (detail), `[id]/edit/page.tsx`.
   - Server components read with `db()` directly after `requireUser()` / `requireRole(...)`.
   - Changes go through the API from a client component (`fetch` + JSON), then `toast` and
     `router.push` + `router.refresh()`.
   - Forms use `Form` + react-hook-form + `zodResolver` with the shared schema (see
     `components/users/user-form.tsx`). Deletes confirm in a `Dialog`.
7. **Navigation.** Add `{ href: '/projects', label: 'Projects', roles? }` to `NAV_ITEMS`.
8. **Tests.** `src/app/api/projects/projects.test.ts` next to the routes: call the exported
   handlers with `request(path, { method, body, user })` and `params({ id })`, after
   `beforeEach(resetDb)`. Cover signed out (401), wrong role (403), invalid input (400), not
   found (404), the happy path, and every rule in the handler.

## UI rules

- Every screen works from 360 px phones to desktops, with no horizontal page scroll.
  - Lists are a `Table` from `md` up and stacked cards below `md` (see `users/page.tsx`).
  - Grids collapse to one column on phones; long text wraps (`break-words`, `truncate`,
    `min-w-0`).
- Tap targets are at least 44 px: buttons and inputs in forms use `h-11`, inputs `text-base`.
- Use the components in `src/components/ui` (Alert, Avatar, Badge, Button, Calendar, Card,
  Checkbox, DatePicker, Dialog, DropdownMenu, Form, Input, Label, Pagination, Popover, Select,
  Separator, Sheet, Skeleton, Switch, Table, Tabs, Textarea, Toaster via `toast()`, Tooltip).
  Colours come from the theme tokens in `globals.css`; no hard-coded colours.
- Page titles go through `PageHeader` (title, description, actions); set `metadata.title`.

## Never

- Return `passwordHash`, or change sign-in, sessions or `withUser` behaviour.
- Edit `pnpm-lock.yaml`, `.env*` or `src/components/ui/*` by hand; new packages need approval.
- Use `any`, `@ts-ignore` or `eslint-disable`/`biome-ignore` to get a check through.
- Weaken or delete a test to make it pass.
