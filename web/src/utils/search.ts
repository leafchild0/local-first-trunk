import MiniSearch from 'minisearch';
import type { Note } from '@lft/shared';

export const mini = new MiniSearch({
  fields: ['title', 'content', 'tags'],
  storeFields: ['id', 'title', 'updatedAt']
});

export function rebuild(notes: Note[]) {
  mini.addAll(notes);
}

export function search(q: string) {
  return mini.search(q, { prefix: true }).map(r => r);
}
