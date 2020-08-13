import {Component} from '@angular/core';
import {FocusService} from './focus.service';


// work in progress: read more info @ https://github.com/iqb-berlin/testcenter-frontend/issues/179

@Component({
    selector: 'tc-detect-focus',
    template: '<span style="color:white"></span>'
})
export class DetectFocusComponent {
    constructor(
        private focusService: FocusService
    ) {
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
            this.focusService.focus$.next(document[hidden] ? 'outside' : 'tab');
        }, false);


        window.addEventListener('blur', () => {
            if (!document.hasFocus()) {
                this.focusService.focus$.next('outside');
            } else if (document.activeElement.tagName.toLowerCase() === 'iframe') { // works in chrome, not FF
                this.focusService.focus$.next('player');
            }
        });

        window.addEventListener('focus', () => {
            this.focusService.focus$.next('host');
        });

        window.addEventListener('unload', () => {
            // navigator.sendBeacon('/log', analyticsData); // TODO use sendBacon to send tell BE page was left
        });
    }
}
