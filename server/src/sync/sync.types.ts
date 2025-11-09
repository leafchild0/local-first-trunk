import type { Note } from '@lft/shared';

export type PushBody = {
  notes: Note[];
  deviceId: string;
};
