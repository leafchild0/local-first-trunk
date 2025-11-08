import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { NotesModule } from '../notes/notes.module';

@Module({
  imports: [NotesModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
