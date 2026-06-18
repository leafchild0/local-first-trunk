<template>
  <div class="p-4">
    <input
      v-model="local.title"
      class="w-full p-2 border rounded mb-2"
      @input="markDirty"
    >
    <textarea
      v-model="local.content"
      rows="12"
      class="w-full p-2 border rounded"
      @input="markDirty"
    />
    <div class="mt-2 flex gap-2">
      <button
        class="btn"
        @click="save"
      >
        Save
      </button>
      <button
        v-if="dirty"
        class="btn"
        @click="discard"
      >
        Discard
      </button>
    </div>

    <div class="mt-4">
      <h3 class="font-semibold mb-1">
        Preview
      </h3>
      <div
        class="prose max-w-none"
        v-html="rendered"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch, computed } from 'vue';
  import MarkdownIt from 'markdown-it';
  import { useNotes } from '@/store/useNotes';
  import type { Note } from '@lft/shared';
  import { debounce } from 'lodash-es';

  const props = defineProps<{ noteId: string | null }>();
  const emit = defineEmits(['saved']);
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  });
  const store = useNotes();

  const local = ref<Partial<Note>>({ title: '', content: '' });
  const dirty = ref(false);
  const lastLoadedId = ref<string | null>(null);

  const activeNote = computed(() => {
    if (!props.noteId) return null;
    return store.notes.find(x => x.id === props.noteId) || null;
  });

  watch(activeNote, (newNote) => {
    if (!newNote) {
      local.value = { title: '', content: '' };
      dirty.value = false;
      lastLoadedId.value = null;
      return;
    }

    const idChanged = newNote.id !== lastLoadedId.value;

    // Update the local state if the user switched notes, OR
    // if the note was updated externally and there are no unsaved local changes.
    if (idChanged || !dirty.value) {
      local.value = { ...newNote };
      dirty.value = false;
      lastLoadedId.value = newNote.id;
    }
  }, { deep: true, immediate: true });

  function markDirty() { dirty.value = true; }

  async function save() {
    if (!props.noteId) return;
    await store.updateNote(props.noteId, {
      title: local.value.title || '',
      content: local.value.content || ''
    });
    dirty.value = false;
    emit('saved');
  }

  const autosave = debounce(async () => {
    if (!props.noteId) return;
    await store.updateNote(props.noteId, {
      title: local.value.title!,
      content: local.value.content!,
    });
    dirty.value = false;
  }, 1000);

  watch(() => local.value.content, autosave);

  function discard() {
    const n = store.notes.find(x => x.id === props.noteId);
    if (n) local.value = { ...n };
    dirty.value = false;
  }

  const rendered = computed(() => md.render(local.value.content || ''));
</script>

<style scoped>
@reference "../style.css";
.btn { @apply px-3 py-1 bg-slate-700 text-white rounded; }
.prose { @apply bg-white p-4 border rounded; }
</style>
