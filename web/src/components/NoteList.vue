<template>
  <div class="p-4">
    <button
      class="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
      @click="exportAll"
    >
      Export All
    </button>
    <div class="flex items-center mb-4">
      <button
        class="btn"
        @click="newNote"
      >
        + New
      </button>
      <input
        v-model="q"
        placeholder="search..."
        class="ml-4 p-2 border rounded"
      >
    </div>

    <ul>
      <li
        v-for="note in filtered"
        :key="note.id"
        class="py-2 border-b"
      >
        <a
          href="#"
          class="block"
          @click.prevent="$emit('select', note.id)"
        >
          <div class="font-semibold">{{ note.title }}</div>
          <div class="text-xs text-slate-500">{{ formatDate(note.updatedAt) }}</div>
        </a>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, watch } from 'vue';
  import { useNotes } from '@/store/useNotes';
  import { rebuild, search } from '@/utils/search';
  import type { Note } from '@lft/shared';

  const emit = defineEmits(['select']);
  const q = ref('');
  const store = useNotes();

  store.loadAll();

  // Rebuild the search index whenever store notes are updated
  watch(() => store.notes, (newNotes) => {
    rebuild(newNotes);
  }, { deep: true, immediate: true });

  const newNote = async () => {
    const n = await store.createNote({ title: 'New note' });
    emit('select', n.id);
  };

  const filtered = computed(() => {
    if (!q.value) return store.notes;
    const results = search(q.value);
    return results
      .map(r => store.notes.find(n => n.id === r.id))
      .filter((n): n is Note => !!n);
  });

  const exportAll = async () => {
    store.exportAll();
  }

  const formatDate = (ts: number) => new Date(ts).toLocaleString();
</script>

<style scoped>
@reference "../style.css";
.btn { @apply px-3 py-1 bg-slate-700 text-white rounded; }
</style>
