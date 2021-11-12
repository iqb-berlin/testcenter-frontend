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

/**
 * A helper to watch property-changes, functions calls, observables etc. on different object to test the correct order
 * of those events.
 *
 * Writing my's own watcher class might be a little bit naïve approach, but I did not find a way to test the correct
 * order of different types of events like property changes, observable events and promise resolving wie the
 * SpyOn-technique. This surely reflects the incoherence of the coding style in the whole test-controller module, which
 * I could not entirely wipe out by now. The module might one day be more slimlined and therefore more straightforward
 * to test.
 */
export class Watcher {
  log: WatcherLogEntry[] = [];
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
        next: value => this.log.push({
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
        self.log.push({ name: watcherName, value });
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
    this.registerWatcher(watcherName);
    const watch$ = new Subject();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const methodShadow = `__________${methodName}`;
    object[methodShadow] = object[methodName];
    Object.defineProperty(object, methodName, {
      get() {
        return (...args) => {
          const mappedArguments = args
            .map((arg, argNr) => (argumentsMapForLogger[argNr] ? argumentsMapForLogger[argNr](arg) : arg))
            .filter((_, argNr) => argumentsMapForLogger[argNr] !== null);
          self.log.push({
            name: watcherName,
            value: mappedArguments
          });
          watch$.next(args);
          return object[methodShadow](...args);
        };
      }
    });
    return watch$;
  }

  watchPromise<T>(watcherName: string, promiseToWatch: Promise<T>): Promise<T> {
    this.registerWatcher(watcherName);
    return promiseToWatch
      .then(value => {
        this.log.push({ name: watcherName, value });
        return value;
      })
      .catch(
        error => {
          this.log.push({ name: watcherName, value: '', error });
          return error;
        }
      );
  }

  dump(): void {
    this.log.forEach(logEntry => {
      console.log(logEntry.name, logEntry.value);
    });
  }
}
