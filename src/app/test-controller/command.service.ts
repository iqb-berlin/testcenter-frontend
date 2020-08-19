import {Inject, Injectable, OnDestroy} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {Command, commandKeywords, isKnownCommand, TestStatus} from './test-controller.interfaces';
import {TestControllerService} from './test-controller.service';
import {distinctUntilChanged} from 'rxjs/operators';
import {Uuid} from '../shared/uuid';
import {WebsocketBackendService} from '../shared/websocket-backend.service';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class CommandService extends WebsocketBackendService<Command[]> implements OnDestroy {
    public command$: Subject<Command> = new Subject<Command>();
    private commandSubscription: Subscription;
    initialData: [{id: 'primary', keyword: 'debug', arguments: ['on']}];
    pollingEndpoint = 'will_be_set';
    pollingInterval = 5000;
    wsChannelName = 'commands';
    private commandHistory: string[] = [];

    constructor (
        @Inject('IS_PRODUCTION_MODE') public isProductionMode,
        private tcs: TestControllerService,
        @Inject('SERVER_URL') serverUrl: string,
        http: HttpClient
    ) {
        super(serverUrl, http);

        if (!this.isProductionMode) {

            this.setUpGlobalCommandsForDebug();
        }
        this.subscribeCommands();

        this.tcs.testStatus$
            .pipe(distinctUntilChanged())
            .subscribe((testStatus: TestStatus) => {
                const newPollingEndpoint = `test/${this.tcs.testId}/commands`;
                if ((testStatus === TestStatus.RUNNING) && (newPollingEndpoint !== this.pollingEndpoint)) {
                    this.pollingEndpoint = newPollingEndpoint;
                    this.observeEndpointAndChannel().subscribe(
                        (commands: Command[]) => {
                            console.log('COMMANDS', commands);
                            if (commands) {
                                commands.forEach((command: Command) => {
                                    this.command$.next(command);
                                });
                            }
                        }
                    );
                }
            });

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

                if (this.commandHistory.indexOf(command.id) >= 0) {
                    console.warn('command already executed', command);
                }

                this.commandHistory.push(command.id);
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
                        break;
                    default:
                        console.warn(`command '${command.keyword}' is unknown`);
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
