import { db } from '@/data';
import type { Note } from '@lft/shared';
import { mergeNotes } from './mergeNote';
import { API_BASE } from './syncConfig';

const PUSH_URL = `${API_BASE}/sync/push`;
const PULL_URL = `${API_BASE}/sync/pull`;

const DEVICE_KEY = 'device_id';
export const LAST_SYNC_KEY = 'last_sync';

export async function mergeRemoteNotes(notes: Note[]): Promise<number> {
  for (const remoteNote of notes) {
    const existing = await db.notes.get(remoteNote.id);
    const merged = mergeNotes(existing, remoteNote);
    await db.notes.put(merged);
  }

  return notes.length;
}

export const useSyncNotes = () => {

  const getDeviceId = (): string => {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(DEVICE_KEY, id);
      console.log('[sync] created deviceId', id);
    }
    return id;
  }

  const pullNotes = async (): Promise<{ pulled: number }> => {
    const deviceId = getDeviceId();
    const lastSync = Number(localStorage.getItem(LAST_SYNC_KEY) || 0);
    const url = new URL(PULL_URL);
    url.searchParams.set('deviceId', deviceId);
    url.searchParams.set('since', String(lastSync));

    const res = await fetch(url.toString(), {method: 'GET'});
    if (!res.ok) throw new Error(`pull failed: ${res.statusText}`);
    const payload = await res.json();
    const {notes = [], serverTime = Date.now()} = payload;

    await mergeRemoteNotes(notes);

    localStorage.setItem(LAST_SYNC_KEY, String(serverTime));
    return {pulled: notes.length};
  }

  const pushNotes = async (changedNotes: Note[]): Promise<{ pushed: number }> => {
    const deviceId = getDeviceId();
    const payload = {
      deviceId,
      notes: changedNotes,
    };

    const res = await fetch(PUSH_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[sync] push failed', res.status, text);
      throw new Error('push failed');
    }

    const body = await res.json();
    return {pushed: body.received || 0};
  }

  return {
    pushNotes,
    pullNotes,
    getDeviceId
  }
}
