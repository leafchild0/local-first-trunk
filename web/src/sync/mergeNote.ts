import type { Note } from '@lft/shared';
import { compareVectors } from './versionVector';
import { autoMergeContent } from './textMerge';

export function mergeNotes(local: Note | undefined, remote: Note): Note {
  if (!local) return remote;

  const cmp = compareVectors(local.version ?? {}, remote.version ?? {});

  switch (cmp) {
    case "remote-dominates":
      return remote;

    case "local-dominates":
      return local;

    case "equal":
      // identical; remote wins silently
      return remote;

    case "concurrent":
      return mergeConcurrent(local, remote);

    default:
      return remote;
  }
}

function mergeConcurrent(local: Note, remote: Note): Note {
  const mergedContent = autoMergeContent(local.content, remote.content);

  const mergedVersion = { ...local.version };
  for (const d in remote.version) {
    mergedVersion[d] = Math.max(mergedVersion[d] ?? 0, remote.version[d] ?? 0);
  }

  return {
    ...local,
    content: mergedContent,
    title: local.title === remote.title ? local.title : local.title + " / " + remote.title,
    tags: Array.from(new Set([...local.tags, ...remote.tags])),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
    version: mergedVersion
  };
}