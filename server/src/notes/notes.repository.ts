import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoteEntity } from './note.entity';

@Injectable()
export class NotesRepository {
  constructor(
    @InjectRepository(NoteEntity)
    private readonly repo: Repository<NoteEntity>,
  ) {}

  getAll() {
    return this.repo.find();
  }

  getById(id: string) {
    return this.repo
      .findOne({
        where: { id },
      })
      .then((n) =>
        n ? { ...n, version: JSON.parse(n.version || '{}') } : null,
      );
  }

  save(note: Partial<NoteEntity>) {
    return this.repo.save(note);
  }

  async updateIfNewer(incoming: NoteEntity) {
    const existing = await this.getById(incoming.id);

    if (!existing || incoming.updatedAt > existing.updatedAt) {
      // Version vector passed as JSON string from client
      return this.save({
        ...incoming,
        version: JSON.stringify(incoming.version ?? {}),
      });
    }

    // incoming is older → ignore, return existing
    return existing;
  }
}
