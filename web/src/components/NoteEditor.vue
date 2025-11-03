<template>
  <div class="p-4">
    <input v-model="local.title" @input="markDirty" class="w-full p-2 border rounded mb-2" />
    <textarea v-model="local.content" @input="markDirty" rows="12" class="w-full p-2 border rounded"></textarea>
    <div class="mt-2 flex gap-2">
      <button class="btn" @click="save">Save</button>
      <button class="btn" @click="discard" v-if="dirty">Discard</button>
    </div>

    <div class="mt-4">
      <h3 class="font-semibold mb-1">Preview</h3>
      <div v-html="rendered" class="prose max-w-none"></div>
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

watch(() => props.noteId, async (id) => {
  if (!id) { local.value = { title: '', content: '' }; return; }
  const n = store.notes.find(x => x.id === id);
  if (n) local.value = { ...n };
  dirty.value = false;
});

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
