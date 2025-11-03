// packages/web/src/stores/useNotes.ts
import { ref } from 'vue';
import { defineStore } from 'pinia';
import { db } from '@/data';
import type { Note } from '@lft/shared';
import { nanoid } from 'nanoid';

export const useNotes = defineStore('notes', () => {
  const notes = ref<Note[]>([]);
  const loading = ref(true);

  async function loadAll() {
    loading.value = true;
    notes.value = await db.notes.toArray();
    loading.value = false;
  }

  async function createNote(payload?: Partial<Note>) {
	const now = Date.now();
    const note: Note = {
      id: nanoid(),
      title: payload?.title ?? 'Untitled',
      content: payload?.content ?? '',
      tags: payload?.tags ?? [],
      createdAt: now,
      updatedAt: now,
	};
    await db.notes.add(note);
    notes.value.unshift(note);
    return note;
  }

	async function exportAll() {
    const notes = (await db.notes.toArray()).map(({ id, title, content, updatedAt }) => ({
      id, title, content, updatedAt,
    }));

	  const blob = new Blob([JSON.stringify(notes, null, 2)], {
			type: 'application/json',
		});

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `notes-backup-${new Date().toISOString()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

  async function updateNote(id: string, patch: Partial<Note>) {
    const note = await db.notes.get(id);
    if (!note) throw new Error('not found');
    const updated = { ...note, ...patch, updatedAt: Date.now() };
    await db.notes.put(updated);
    const idx = notes.value.findIndex((n: Note) => n.id === id);
    if (idx >= 0) notes.value[idx] = updated;
    return updated;
  }

  async function deleteNote(id: string) {
    await db.notes.update(id, { deleted: true, updatedAt: Date.now() });
	  notes.value = notes.value.filter((n: Note) => n.id !== id);
  }

  return { notes, loading, loadAll, createNote, updateNote, deleteNote, exportAll };
});
