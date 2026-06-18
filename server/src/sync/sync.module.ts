import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { FeedController } from './feed.controller';
import { NotesModule } from '../notes/notes.module';

@Module({
  imports: [NotesModule],
  controllers: [SyncController, FeedController],
  providers: [SyncService],
})
export class SyncModule {}
