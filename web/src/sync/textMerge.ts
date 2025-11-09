// Cheap line-based merge for concurrent edits.
// Good enough for PKB; not a CRDT yet; just safe & simple.

export function autoMergeContent(local: string, remote: string): string {
  if (local === remote) return local;

  const localLines = local.split('\n');
  const remoteLines = remote.split('\n');

  // Fast path: one version appended lines
  if (remote.startsWith(local)) return remote;
  if (local.startsWith(remote)) return local;

  // Simple union + dedupe
  const merged = new Set([...localLines, ...remoteLines]);
  return Array.from(merged).join('\n');
}
