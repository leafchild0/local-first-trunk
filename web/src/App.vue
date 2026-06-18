<template>
  <div class="h-screen grid grid-cols-3">
    <aside class="col-span-1 border-r">
      <NoteList @select="select" />
    </aside>
    <main class="col-span-2">
      <NoteEditor
        :note-id="selectedId"
        @saved="onSaved"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import NoteList from './components/NoteList.vue';
  import NoteEditor from './components/NoteEditor.vue';
  import { useSyncNotes } from "@/sync/syncNotes.ts";
  import { connectSyncFeed } from "@/sync/syncFeed.ts";
  import { SYNC_TRANSPORT } from "@/sync/syncConfig.ts";

  const selectedId = ref<string | null>(null);
  const { pullNotes } = useSyncNotes();

  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let syncFeed: EventSource | null = null;
  const POLL_INTERVAL_MS = 5000;

  function select(id: string) { selectedId.value = id; }
  function onSaved() {
    console.log('saved for testing')
  }

  async function syncNotesCoordinated() {
    const lastAttempt = Number(localStorage.getItem('last_poll_attempt') || 0);
    const now = Date.now();

    // Coordinated check: if another tab pulled recently, skip.
    if (now - lastAttempt < POLL_INTERVAL_MS - 500) { // Add 500ms grace buffer for timing jitter
      return;
    }

    // Set timestamp to flag other tabs
    localStorage.setItem('last_poll_attempt', String(now));

    try {
      await pullNotes();
    } catch (err) {
      console.warn('[sync] coordinated pull failed', err);
    }
  }

  onMounted(async () => {
    await syncNotesCoordinated();

    if (SYNC_TRANSPORT === 'sse') {
      syncFeed = connectSyncFeed();
      return;
    }

    pollInterval = setInterval(syncNotesCoordinated, POLL_INTERVAL_MS);
  });

  onUnmounted(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    if (syncFeed) {
      syncFeed.close();
    }
  });
</script>
