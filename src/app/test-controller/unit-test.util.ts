/* eslint-disable no-console */
import { Observable, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export function json(ob: unknown): unknown {
  return JSON.parse(JSON.stringify(ob));
}

export interface WatcherLogEntry {
  name: string,
  value: unknown,
  error?: string
}

export class Watcher {
  eventLog: WatcherLogEntry[] = [];
  private watcherNames: string[] = [];

  private registerWatcher(watcherName: string): void {
    if (this.watcherNames.includes(watcherName)) {
      throw new Error(`Watcher ${watcherName} was already defined.`);
    }
    this.watcherNames.push(watcherName);
  }

  watchObservable(watcherName: string, observable: Observable<unknown>): void {
    this.registerWatcher(watcherName);
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
    this.registerWatcher(watcherName);
    const watch$ = new Subject();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const propertyShadow = `__________${propertyName}`;
    object[propertyShadow] = object[propertyName];
    Object.defineProperty(object, propertyName, {
      set(value) {
        self.eventLog.push({ name: watcherName, value });
        watch$.next(value);
        this[propertyShadow] = value;
      },
      get() {
        return this[propertyShadow];
      }
    });
    return watch$;
  }

  watchMethod(
    objectName: string, object: unknown, methodName: string,
    filterArgumentsForLogger: (value, index: number) => boolean = () => true
  ): Observable<unknown> {
    const watcherName = `${objectName}.${methodName}`;
    const methodShadow = `__________${methodName}`;
    this.registerWatcher(watcherName);
    const watch$ = new Subject();
    object[methodShadow] = object[methodName];
    object[methodName] = (...args) => {
      // eslint-disable-next-line prefer-rest-params
      this.eventLog.push({
        name: watcherName,
        value: args.filter(filterArgumentsForLogger)
      });
      watch$.next(args);
      object[methodShadow](...args);
    };
    return watch$;
  }

  watchPromise<T>(watcherName: string, promiseToWatch: Promise<T>): Promise<T> {
    this.registerWatcher(watcherName);
    return promiseToWatch
      .then(value => {
        this.eventLog.push({ name: watcherName, value });
        return value;
      })
      .catch(
        error => {
          this.eventLog.push({ name: watcherName, value: '', error });
          return error;
        }
      );
  }
}
