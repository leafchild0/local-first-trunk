import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoteChangeEntity } from './note-change.entity';
import { MoreThan } from 'typeorm';

@Injectable()
export class NoteChangeRepository {
  constructor(
    @InjectRepository(NoteChangeEntity)
    private readonly repo: Repository<NoteChangeEntity>,
  ) {}

  logChange(change: Partial<NoteChangeEntity>) {
    return this.repo.save(change);
  }

  getChangesSince(userId: string, since: number) {
    return this.repo.find({
      where: { userId, updatedAt: MoreThan(since) },
    });
  }
}
