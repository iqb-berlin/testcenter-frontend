import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

// work in progress: read more info @ https://github.com/iqb-berlin/testcenter-frontend/issues/179

export type FocusTarget =
    'window'
    | 'host'
    | 'player'
    | 'outside';


@Injectable()
export class FocusService {
    public focus$: Subject<FocusTarget> = new Subject<FocusTarget>();

    constructor(
    ) {
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
            // navigator.sendBeacon('/log', analyticsData); // TODO use sendBacon to send tell BE page was left
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

        document.addEventListener(visibilityChange, (event: Event) => {
            // returned from other tab, when document[hidden]
            // we *could* assume, it must be the player that has focus now
            // but, but it could also be an alert or so
            this.focus$.next(document[hidden] ? 'outside' : 'window');
        }, false);
    }
}
