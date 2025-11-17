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
  import { ref, onMounted } from 'vue';
  import NoteList from './components/NoteList.vue';
  import NoteEditor from './components/NoteEditor.vue';
  import { useNotes } from "@/store/useNotes.ts";
  import { useSyncNotes } from "@/sync/syncNotes.ts";

  const selectedId = ref<string | null>(null);
  const notesStore = useNotes();
  const { pullNotes } = useSyncNotes();

  function select(id: string) { selectedId.value = id; }
  function onSaved() {
    console.log('saved for testing')
  }

  onMounted(async () => {
    try {
      // load local DB first
      await notesStore.loadAll();

      // then pull from server and merge
      await pullNotes();

      // reload store from db to show pulled notes
      await notesStore.loadAll();
    } catch (err) {
      console.warn('[sync] pull failed', err);
    }
  });
</script>
