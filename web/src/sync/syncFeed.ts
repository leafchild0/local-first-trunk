import type { Note } from '@lft/shared';
import { API_BASE } from './syncConfig';
import { LAST_SYNC_KEY, mergeRemoteNotes, useSyncNotes } from './syncNotes';

type FeedPayload = {
  notes?: Note[];
  serverTime?: number;
};

export function connectSyncFeed(): EventSource {
  const { getDeviceId } = useSyncNotes();
  const deviceId = getDeviceId();
  const lastSync = Number(localStorage.getItem(LAST_SYNC_KEY) || 0);
  const url = new URL(`${API_BASE}/feed`);

  url.searchParams.set('deviceId', deviceId);
  url.searchParams.set('since', String(lastSync));

  const eventSource = new EventSource(url.toString());

  eventSource.addEventListener('notes', (event) => {
    void handleNotesEvent(event);
  });

  eventSource.addEventListener('heartbeat', (event) => {
    const payload = parsePayload(event);
    if (payload?.serverTime) {
      console.debug('[feed] heartbeat', payload.serverTime);
    }
  });

  eventSource.onerror = (event) => {
    console.warn('[feed] connection error', event);
  };

  return eventSource;
}

async function handleNotesEvent(event: MessageEvent<string>) {
  const payload = parsePayload(event);
  const notes = payload?.notes ?? [];

  if (notes.length === 0) {
    return;
  }

  await mergeRemoteNotes(notes);

  if (payload?.serverTime) {
    localStorage.setItem(LAST_SYNC_KEY, String(payload.serverTime));
  }
}

function parsePayload(event: MessageEvent<string>): FeedPayload | null {
  try {
    return JSON.parse(event.data) as FeedPayload;
  } catch (error) {
    console.warn('[feed] invalid event payload', error);
    return null;
  }
}
