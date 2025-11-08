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
    return this.repo.findOne({ where: { id } });
  }

  save(note: Partial<NoteEntity>) {
    return this.repo.save(note);
  }

  async updateIfNewer(incoming: NoteEntity) {
    const existing = await this.getById(incoming.id);

    if (!existing || incoming.updatedAt > existing.updatedAt) {
      return this.save(incoming);
    }

    return existing;
  }
}
