import { Controller, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable, interval, from, of } from 'rxjs';
import { catchError, concatMap, filter, finalize, map } from 'rxjs/operators';
import { SyncService } from './sync.service';

const FEED_INTERVAL_MS = 5000;
const HEARTBEAT_EVERY_TICKS = 6;

@Controller()
export class FeedController {
  constructor(private readonly sync: SyncService) {}

  @Sse('feed')
  feed(
    @Query('since') since: string,
    @Query('deviceId') deviceId: string,
  ): Observable<MessageEvent> {
    let cursor = Number(since || 0);
    let ticks = 0;

    return interval(FEED_INTERVAL_MS).pipe(
      concatMap(() =>
        from(this.sync.pullChanges(deviceId, cursor)).pipe(
          map((result): MessageEvent | null => {
            ticks += 1;

            if (result.notes.length === 0) {
              if (ticks % HEARTBEAT_EVERY_TICKS === 0) {
                return {
                  type: 'heartbeat',
                  data: { serverTime: Date.now() },
                };
              }

              return null;
            }

            cursor = result.serverTime;
            return {
              type: 'notes',
              data: {
                notes: result.notes,
                serverTime: result.serverTime,
              },
            };
          }),
          catchError((error) =>
            of({
              type: 'error',
              data: {
                message:
                  error instanceof Error ? error.message : 'feed pull failed',
              },
            }),
          ),
        ),
      ),
      filter((event): event is MessageEvent => event !== null),
      finalize(() => {
        console.log(`[feed] client disconnected: ${deviceId || 'unknown'}`);
      }),
    );
  }
}
