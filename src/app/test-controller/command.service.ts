import {Inject, Injectable, OnDestroy} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {Command, commandKeywords, isKnownCommand} from './test-controller.interfaces';
import {Uuid} from '../util/uuid';

@Injectable()
export class CommandService implements OnDestroy {
    public command$: Subject<Command> = new Subject<Command>();
    private commandSubscription: Subscription;

    constructor (
        @Inject('IS_PRODUCTION_MODE') public isProductionMode
    ) {
        if (!this.isProductionMode) {

            this.setUpGlobalCommandsForDebug();
        }
    }

    ngOnDestroy() {
        this.commandSubscription.unsubscribe();
    }

    private setUpGlobalCommandsForDebug() {
        window['tc'] = {};
        commandKeywords.forEach((keyword: string) => {
            window['tc'][keyword] = (args) => {this.command(keyword, args, Uuid.create()); };
        });
    }

    private command(keyword: string, args: string[], id: string): void {
        if (!isKnownCommand(keyword)) {
            console.warn(`Unknown command: ${keyword}`);
            return;
        }

        if (!this.isProductionMode) {
            console.log(`Command received: ${keyword}`);
        }
        args = (typeof args === 'undefined') ? [] : args;
        this.command$.next({keyword, arguments: args, id});
    }
}
