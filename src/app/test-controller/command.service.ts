import {Inject, Injectable, OnDestroy} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {Command, commandKeywords, isKnownCommand, TestStatus} from './test-controller.interfaces';
import {TestControllerService} from './test-controller.service';
import {distinctUntilChanged} from 'rxjs/operators';
import {Uuid} from '../util/uuid';

@Injectable()
export class CommandService implements OnDestroy {
    public command$: Subject<Command> = new Subject<Command>();
    private commandSubscription: Subscription;

    constructor (
        @Inject('IS_PRODUCTION_MODE') public isProductionMode,
        private tcs: TestControllerService
    ) {
        if (!this.isProductionMode) {

            this.setUpGlobalCommandsForDebug();
        }
        this.subscribeCommands();
    }

    ngOnDestroy() {
        this.commandSubscription.unsubscribe();
    }

    private subscribeCommands() {
        this.commandSubscription = this.command$
            .pipe(
                distinctUntilChanged((command1: Command, command2: Command): boolean => (command1.id === command2.id))
            )
            .subscribe((command: Command) => {
                switch (command.keyword) {
                    case 'pause':
                        this.tcs.testStatus$.next(TestStatus.PAUSED);
                        break;
                    case 'resume':
                        this.tcs.testStatus$.next(TestStatus.RUNNING);
                        break;
                    case 'terminate':
                        this.tcs.terminateTest();
                        break;
                    case 'goto':
                        this.tcs.setUnitNavigationRequest(command.arguments[0]);
                        break;
                    case 'debug':
                        this.tcs.debugPane = command.arguments[0] !== 'off';
                }
        });
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
