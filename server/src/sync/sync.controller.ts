import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { SyncService } from './sync.service';
import type { PushBody } from './sync.types';
import { NoteEntity } from '../notes/note.entity';

@Controller('sync')
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post('push')
  async push(@Body() body: PushBody) {
    const { deviceId, notes } = body;

    const converted: NoteEntity[] = notes.map((note) => {
      return {
        ...note,
        version: JSON.stringify(note.version || '{}'),
        deleted: note.deleted ?? false,
      };
    });

    const res = await this.sync.pushChanges(deviceId, converted);
    return { ...res, ok: true };
  }

  @Get('pull')
  async pull(
    @Query('since') since: string,
    @Query('deviceId') deviceId: string,
  ) {
    const result = await this.sync.pullChanges(deviceId, Number(since));

    // Ensure version vectors are parsed JSON
    result.notes = result.notes.map((n) => ({
      ...n,
      version:
        typeof n.version === 'string' ? JSON.parse(n.version) : n.version,
    }));

    return { ...result, ok: true };
  }
}
