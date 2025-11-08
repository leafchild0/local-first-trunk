import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteEntity } from './note.entity';
import { NoteChangeEntity } from './note-change.entity';
import { NotesRepository } from './notes.repository';
import { NoteChangeRepository } from './note-change.repository';

@Module({
  imports: [TypeOrmModule.forFeature([NoteEntity, NoteChangeEntity])],
  providers: [NotesRepository, NoteChangeRepository],
  exports: [NotesRepository, NoteChangeRepository],
})
export class NotesModule {}
