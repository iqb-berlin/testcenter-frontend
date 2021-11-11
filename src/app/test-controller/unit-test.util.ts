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
    argumentsMapForLogger: { [argNr: number]: null|((unknown) => unknown) } = {}
  ): Observable<unknown> {
    const watcherName = `${objectName}.${methodName}`;
    const methodShadow = `__________${methodName}`;
    this.registerWatcher(watcherName);
    const watch$ = new Subject();

    object[methodShadow] = object[methodName];
    object[methodName] = (...args) => {
      const mappedArguments = args
        .map((arg, argNr) => (argumentsMapForLogger[argNr] ? argumentsMapForLogger[argNr](arg) : arg))
        .filter((_, argNr) => argumentsMapForLogger[argNr] !== null);
      this.eventLog.push({
        name: watcherName,
        value: mappedArguments
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
