<template>
  <div class="h-screen grid grid-cols-3">
    <aside class="col-span-1 border-r">
      <NoteList @select="select" />
    </aside>
    <main class="col-span-2">
      <NoteEditor :noteId="selectedId" @saved="onSaved" />
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import NoteList from './components/NoteList.vue';
  import NoteEditor from './components/NoteEditor.vue';

  const selectedId = ref<string | null>(null);
  function select(id: string) { selectedId.value = id; }
function onSaved() {
console.log('saved')
}
</script>
