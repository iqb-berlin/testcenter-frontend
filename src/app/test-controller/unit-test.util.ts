/* eslint-disable no-console */
import { Observable, of, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export function json(ob: unknown): unknown {
  return JSON.parse(JSON.stringify(ob));
}

interface LogEntry {
  name: string,
  value: unknown
}

export class Watcher {
  eventLog: LogEntry[] = [];
  private watcherNames: string[] = [];

  watchObservable(watcherName: string, observable: Observable<unknown>): void {
    if (this.watcherNames.includes(watcherName)) {
      console.warn(`Watcher ${watcherName} was allready defined`);
      return;
    }
    this.watcherNames.push(watcherName);
    observable
      .pipe(shareReplay())
      .subscribe({
        next: value => this.eventLog.push({
          value,
          name: watcherName
        })
      });
  }

  watchProperty(objectName: string, object: unknown, propertyName: string): Observable<unknown> {
    const watcherName = `${objectName}.${propertyName}`;
    if (this.watcherNames.includes(objectName)) {
      console.warn(`Watcher ${objectName} was allready defined`);
      return of();
    }
    this.watcherNames.push(watcherName);
    const watch$ = new Subject();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    Object.defineProperty(object, propertyName, {
      set(value) {
        self.eventLog.push({ name: watcherName, value });
        watch$.next(value);
        this[`__________${propertyName}`] = value;
      },
      get() {
        return this[`__________${propertyName}`];
      }
    });
    return watch$;
  }
}
