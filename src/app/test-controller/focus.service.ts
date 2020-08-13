import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {TestControllerService} from './test-controller.service';
import {BackendService} from './backend.service';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {LastStateKey, TestStatus} from './test-controller.interfaces';

// work in progress: read more info @ https://github.com/iqb-berlin/testcenter-frontend/issues/179

export type FocusTarget =
    'window'
    | 'host'
    | 'player'
    | 'outside'
    | 'void';


@Injectable()
export class FocusService {
    public focus$: Subject<FocusTarget> = new Subject<FocusTarget>();

    constructor(
        private tcs: TestControllerService,
        private bs: BackendService
    ) {
        this.registerListeners();
        this.registerReactions();
    }

    private registerReactions() {
        this.focus$
            .pipe(
                map(
                    (focus: FocusTarget) => ['window', 'host', 'player'].indexOf(focus) !== -1 ? 'window' : focus
                ),
                distinctUntilChanged()
            )
            .subscribe((focus: FocusTarget) => {
                switch (focus) {
                    case 'void':
                        // TODO use navigator.sendBeacon to send tell BE page was left
                        break;
                    case 'outside':
                        this.bs.addBookletLog(this.tcs.testId, Date.now(), 'FOCUS_LOST')
                            .add(() => {
                                this.tcs.setBookletState(LastStateKey.FOCUS, 'LOST');
                                this.tcs.testStatus$.next(TestStatus.PAUSED);
                            });
                        break;
                    case 'window':
                        this.bs.addBookletLog(this.tcs.testId, Date.now(), 'FOCUS_GAINED')
                            .add(() => {
                                this.tcs.setBookletState(LastStateKey.FOCUS, 'GAINED');
                            });
                        break;
                }
            });
    }

    private registerListeners(): void {
        window.addEventListener('blur', () => {
            if (!document.hasFocus()) {
                this.focus$.next('outside');
            } else if (document.activeElement.tagName.toLowerCase() === 'iframe') {
                // this works in chrome, not FF
                // maybe it could be deployed for FF as well somehow
                // BUT we still needed the player to talk about the focus with the host,
                // since we have to detect a change from player to a completely other window
                this.focus$.next('player');
            }
        });

        window.addEventListener('focus', () => {
            this.focus$.next('host');
        });

        window.addEventListener('unload', () => {
            this.focus$.next('void');
        });

        // Set the name of the hidden property and the change event for visibility according to browser
        let hidden, visibilityChange;
        if (typeof document.hidden !== 'undefined') {
            hidden = 'hidden';
            visibilityChange = 'visibilitychange';
        } else if (typeof document['msHidden'] !== 'undefined') {
            hidden = 'msHidden';
            visibilityChange = 'msvisibilitychange';
        } else if (typeof document['mozHidden'] !== 'undefined') {
            hidden = 'mozHidden';
            visibilityChange = 'mozHidden';
        } else if (typeof document['webkitHidden'] !== 'undefined') {
            hidden = 'webkitHidden';
            visibilityChange = 'webkitvisibilitychange';
        } else {
            console.warn('visibilityChange not supported by browser');
            return;
        }

        document.addEventListener(visibilityChange, () => {
            // returned from other tab, when document[hidden]
            // we *could* assume, it must be the player that has focus now
            // but, but it could also be an alert or so
            this.focus$.next(document[hidden] ? 'outside' : 'window');
        }, false);
    }
}
