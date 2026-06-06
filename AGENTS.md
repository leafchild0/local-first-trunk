# Agent Developer Guide (AGENTS.md)

Welcome! This file provides a technical overview, design conventions, and architectural details to help AI agents and developers understand and contribute to the **local-first-trunk** project.

---

## 1. Project Overview & Monorepo Architecture

This project is a prototype of a **local-first note-taking application**. 
- **Local-First Core**: The authoritative copy of the data resides on the client's local database (IndexedDB). User modifications are immediate and offline-resilient. Synchronization and conflicts are resolved asynchronously.
- **Monorepo Layout**: The repository uses `pnpm` workspaces:
  - [`@lft/shared`](./shared): Contain types and data structures shared between the client and server.
  - [`web`](./web): Vue 3 client app using Vite, Pinia, Dexie (IndexedDB), and Tailwind CSS.
  - [`server`](./server): NestJS server relay using SQLite and TypeORM, acting as a centralized audit log.

```mermaid
graph TD
    subgraph Client (web)
        UI[Vue 3 Components] <--> Store[Pinia Store]
        Store <--> DB[(IndexedDB / Dexie)]
        SyncEngine[Sync Engine] <--> DB
    end
    
    subgraph Server (server)
        Controller[Sync Controller] <--> Service[Sync Service]
        Service <--> Repos[Repositories]
        Repos <--> SQLite[(SQLite / kb-sync.db)]
    end

    SyncEngine <-->|HTTP Post/Get| Controller
    
    Shared[shared] -.->|Types| Client
    Shared[shared] -.->|Types| Server
```

---

## 2. Shared Data Models (`@lft/shared`)

All data schemas are declared in the shared package.
- **Path**: [`shared/src/index.ts`](./shared/src/index.ts)
- **Core Model (`Note`)**:
  ```typescript
  export type ID = string;

  export interface Note {
    id: ID;
    title: string;
    content: string;                 // Markdown formatted content
    tags: string[];
    createdAt: number;               // Epoch timestamp (ms)
    updatedAt: number;               // Epoch timestamp (ms)
    deleted?: boolean;               // Soft delete flag
    version: Record<string, number>  // Version Vector (deviceId -> logical counter)
  }
  ```

---

## 3. Package Breakdown & Key Entrypoints

### A. Frontend Client (`web`)
- **Main Entrypoint**: [`web/src/App.vue`](./web/src/App.vue) (orchestrates initial DB load and sync pull).
- **Local Database**: [`web/src/data/index.ts`](./web/src/data/index.ts) initializing Dexie (`local_first_trunk`).
- **State Store**: [`web/src/store/useNotes.ts`](./web/src/store/useNotes.ts). Pinia store that:
  - Generates note updates.
  - Increments local version vectors using the client's `deviceId`.
  - Pushes changes immediately to the server (with fallback warning if offline).
- **Components**:
  - [`NoteList.vue`](./web/src/components/NoteList.vue): Handles listing, filtering, backup exporting, and triggering note creation.
  - [`NoteEditor.vue`](./web/src/components/NoteEditor.vue): Contains markdown rendering (via `markdown-it`) and debounced autosave logic (1000ms delay).
- **Sync Architecture** ([`web/src/sync`](./web/src/sync)):
  - [`versionVector.ts`](./web/src/sync/versionVector.ts): Contains functions `incrementVector` and `compareVectors` (returns `"local-dominates" | "remote-dominates" | "concurrent" | "equal"`).
  - [`mergeNote.ts`](./web/src/sync/mergeNote.ts): Core conflict resolution logic (merging titles, tags, and version vectors). **(Currently Unused - see Gaps below)**
  - [`textMerge.ts`](./web/src/sync/textMerge.ts): Line-based auto-merge of note contents.
  - [`syncNotes.ts`](./web/src/sync/syncNotes.ts): Orchestrates `pullNotes` and `pushNotes` using browser `fetch`.

### B. Backend Relay Server (`server`)
- **Main Entrypoint**: [`server/src/main.ts`](./server/src/main.ts) (runs CORS on port `3000` supporting dev client origin `http://localhost:8000`).
- **Database Config**: [`server/src/database/typeorm.config.ts`](./server/src/database/typeorm.config.ts) using `sqlite` connecting to `kb-sync.db`.
- **Entities**:
  - [`note.entity.ts`](./server/src/notes/note.entity.ts): Representation of a note, storing `version` vector as serialized JSON string.
  - [`note-change.entity.ts`](./server/src/notes/note-change.entity.ts): Audit log recording client changes for delta synchronization.
- **Sync Controllers & Services** ([`server/src/sync/`](./server/src/sync/)):
  - `sync.controller.ts`: Handles requests on endpoints `/sync/push` and `/sync/pull`.
  - `sync.service.ts`: Commits pushed changes to database repositories and fetches changes for pull.

---

## 4. Key Gaps & Known Implementation Bugs

When working on this repository, watch out for the following unfinished or broken parts:

### ⚠️ Bug: Client Sync Pull Queries Client's Own Changes
- **File**: [`server/src/notes/note-change.repository.ts`](./server/src/notes/note-change.repository.ts)
- **Detail**: The method `getChangesSince` is implemented as:
  ```typescript
  getChangesSince(deviceId: string, since: number) {
    return this.repo.find({
      where: { deviceId, updatedAt: MoreThan(since) },
    });
  }
  ```
  This returns only changes generated by the *requesting* `deviceId`. This means clients will pull their *own* changes instead of downloading changes made by *other* devices.
- **Fix**: It should query changes where the `deviceId` does **not** equal the requester's `deviceId` (or query all changes globally since `since` and filter out the requester's deviceId).

### ⚠️ Gap: Vector Clock Merging is Not Integrated
- **Files**: [`web/src/sync/mergeNote.ts`](./web/src/sync/mergeNote.ts) & [`web/src/sync/syncNotes.ts`](./web/src/sync/syncNotes.ts)
- **Detail**: `mergeNotes` is defined in `mergeNote.ts` but is **never imported or called** elsewhere in the project.
- **Current Behavior**: In `syncNotes.ts#pullNotes`, the client performs a naive overwrite of local notes if the remote note has a newer `updatedAt` timestamp:
  ```typescript
  if ((s.updatedAt || 0) > (existing.updatedAt || 0)) {
    await db.notes.put(s);
  }
  ```
- **Fix**: Integrate `mergeNotes` from `./web/src/sync/mergeNote.ts` to perform vector clock comparisons and merge concurrent modifications correctly instead of performing naive timestamps overwrites.

### ⚠️ Gap: MiniSearch is Unused
- **Files**: [`web/src/utils/search.ts`](./web/src/utils/search.ts) & [`web/src/components/NoteList.vue`](./web/src/components/NoteList.vue)
- **Detail**: `MiniSearch` is initialized but not imported or called in `NoteList.vue`. The note list currently performs simple JavaScript substring searches (`title.includes(q) || content.includes(q)`).

---

## 5. Development Workflows & Commands

### Setup
Ensure you are at the monorepo root:
```bash
pnpm install
```

### Run Client
Starts the Vite dev server on port `8000`:
```bash
# From root
pnpm --filter web dev

# Or directly
cd web && pnpm dev
```

### Run Server
Starts the NestJS Nest application on port `3000`:
```bash
# From root
pnpm --filter server start:dev

# Or directly
cd server && pnpm start:dev
```

### Run Tests
```bash
# From root
pnpm --filter server test      # Unit tests
pnpm --filter server test:e2e  # End-to-end tests
```

---

## 6. Actionable Tasks for Agents

If you are assigned to improve this repository, here is the suggested roadmap:
1. **Fix the Server Pull Bug**: Update `NoteChangeRepository.getChangesSince` to fetch other devices' changes.
2. **Integrate Version Vector Merging**: Connect the `mergeNotes` function inside `syncNotes.ts#pullNotes`.
3. **Handle Deletions in Sync**: Soft delete status (`deleted: true`) needs to be cleaned up or correctly propagated/merged.
4. **Integrate MiniSearch**: Swap the simple search logic in `NoteList.vue` with `MiniSearch` indexing and querying from `search.ts`.
5. **Real-time WebSockets Sync**: Optional upgrade from HTTP pull/push polling to a subscription-based socket setup.
