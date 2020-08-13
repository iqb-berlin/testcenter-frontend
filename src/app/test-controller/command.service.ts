import {Inject, Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {Command, commandKeywords, isKnownCommand, TestStatus} from './test-controller.interfaces';
import {TestControllerService} from './test-controller.service';

@Injectable()
export class CommandService {
    public command$: Subject<Command> = new Subject<Command>();

    constructor (
        @Inject('IS_PRODUCTION_MODE') public isProductionMode,
        private tcs: TestControllerService
    ) {
        if (!this.isProductionMode) {
            this.setUpGlobalCommandsForDebug();
        }
        this.subscribeCommands();
    }

    private subscribeCommands() {
        this.command$.subscribe((command: Command) => {
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
            }
        });
    }

    private setUpGlobalCommandsForDebug() {
        window['tc'] = {};
        commandKeywords.forEach((keyword: string) => {
            window['tc'][keyword] = (args) => {this.command(keyword, args); };
        });
    }

    private command(command: string, args: string[]): void {
        if (!isKnownCommand(command)) {
            console.warn(`Unknown command: ${command}`);
            return;
        }

        if (!this.isProductionMode) {
            console.log(`Command received: ${command}`);
        }

        this.command$.next({
            keyword: command,
            arguments: args
        });
    }
}
