import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './database/typeorm.config';
import { NotesModule } from './notes/notes.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), NotesModule, SyncModule],
})
export class AppModule {}
