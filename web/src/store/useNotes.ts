import { ref } from 'vue';
import { defineStore } from 'pinia';
import { db } from '@/data';
import type { Note } from '@lft/shared';
import { nanoid } from 'nanoid';
import { incrementVector } from "@/sync/versionVector.ts";
import { useSyncNotes } from "@/sync/syncNotes.ts";
import { liveQuery } from 'dexie';

export const useNotes = defineStore('notes', () => {
  const notes = ref<Note[]>([]);
  const loading = ref(true);
  const { getDeviceId, pushNotes } = useSyncNotes();

  const deviceId = getDeviceId();

  function nextVersionVector(old: Record<string, number> | undefined) {
    return incrementVector(old, deviceId);
  }

  // Subscribe to database changes reactively across all tabs
  liveQuery(() => db.notes.toArray()).subscribe({
    next: (allNotes) => {
      notes.value = allNotes
        .filter((n: Note) => !n.deleted)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      loading.value = false;
    },
    error: (err) => {
      console.error('[db] liveQuery subscription error', err);
      loading.value = false;
    }
  });

  async function loadAll() {
    // liveQuery automatically handles loading. This function is kept for backwards compatibility.
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
      version: nextVersionVector({})
    };
    await db.notes.add(note);
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
    const updated = {
      ...note,
      ...patch,
      updatedAt: Date.now(),
      version: nextVersionVector(note.version)
    };
    await db.notes.put(updated);

    try {
      await pushNotes([updated]);
    } catch (err) {
      console.warn('[sync] push failed, will retry later', err);
    }

    return updated;
  }

  async function deleteNote(id: string) {
    const note = await db.notes.get(id);
    if (!note) return;
    const updated = {
      ...note,
      deleted: true,
      updatedAt: Date.now(),
      version: nextVersionVector(note.version)
    };
    await db.notes.put(updated);

    try {
      await pushNotes([updated]);
    } catch (err) {
      console.warn('[sync] push deletion failed, will retry later', err);
    }
  }

  return { notes, loading, loadAll, createNote, updateNote, deleteNote, exportAll };
});
