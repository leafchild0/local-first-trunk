import { Injectable } from '@nestjs/common';
import { NotesRepository } from '../notes/notes.repository';
import { NoteChangeRepository } from '../notes/note-change.repository';
import { NoteEntity } from '../notes/note.entity';

@Injectable()
export class SyncService {
  constructor(
    private readonly notesRepo: NotesRepository,
    private readonly changesRepo: NoteChangeRepository,
  ) {}

  async pushChanges(userId: string, notes: NoteEntity[]) {
    for (const note of notes) {
      await this.notesRepo.updateIfNewer(note);

      await this.changesRepo.logChange({
        noteId: note.id,
        userId,
        version: note.version,
        updatedAt: note.updatedAt,
        payload: JSON.stringify(note),
      });
    }

    return { ok: true };
  }

  async pullChanges(userId: string, since: number) {
    const changes = await this.changesRepo.getChangesSince(userId, since);

    const notes: NoteEntity[] = changes.map((ch) => JSON.parse(ch.payload));

    return {
      notes,
      serverTime: Date.now(),
    };
  }
}
