import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { NoteEntity } from '../notes/note.entity';
import { NoteChangeEntity } from '../notes/note-change.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: 'kb-sync.db',
  entities: [NoteEntity, NoteChangeEntity],
  synchronize: true, // Dev only
  logging: false,
};