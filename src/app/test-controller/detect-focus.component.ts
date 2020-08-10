import {Component} from '@angular/core';
import {Subject} from 'rxjs';
import {FocusStatus} from './focus.service';



@Component({
    selector: 'tc-detect-focus',
    template: '<div style="color:white">{{status$ | async}}</div>'
})
export class DetectFocusComponent {
    public status$: Subject<FocusStatus> = new Subject<FocusStatus>(); // TODO use debounce

    constructor() {
        // Set the name of the hidden property and the change event for visibility
        let hidden, visibilityChange;
        if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
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
        }

        document.addEventListener(visibilityChange, (event: Event) => {
            console.log('visibilityChange event', event, document[hidden]);
            this.status$.next(document[hidden] ? 'outside' : 'tab');
        }, false);


        window.addEventListener('blur', (event: FocusEvent) => {

            console.log('BLUR event', document.activeElement.tagName, event.target, document.hasFocus(), event.relatedTarget);
            if (!document.hasFocus()) {
                this.status$.next('outside');
            } else if (document.activeElement.tagName.toLowerCase() === 'iframe') {
                this.status$.next('player');
            }
        });

        window.addEventListener('focus', (event: FocusEvent) => {
            console.log('FOCUS event', document.activeElement.tagName, event.target, document.hasFocus());
            this.status$.next('host');
        });

        window.addEventListener('unload', (event) => {
            console.log('UNLOAD event', event);
            // navigator.sendBeacon('/log', analyticsData);
            this.status$.next('closed_window');
        });

        this.status$.subscribe((s) => console.log('STATUS: ' + s));
    }
}
