import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post('push')
  push(@Body() body: any) {
    return this.sync.pushChanges(body.userId, body.notes);
  }

  @Get('pull')
  pull(@Query('userId') userId: string, @Query('since') since: string) {
    return this.sync.pullChanges(userId, Number(since));
  }
}
