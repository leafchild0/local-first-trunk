// packages/web/src/db/index.ts
import Dexie, { type Table } from 'dexie';
import type { Note } from '@lft/shared';

export class LftDB extends Dexie {
  notes!: Table<Note, string>;

  constructor() {
    super('local_first_trunk');
    this.version(1).stores({
      notes: 'id, title, updatedAt, createdAt, tags'
    });
  }
}

export const db = new LftDB();
