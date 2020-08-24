import {Inject, Injectable, OnDestroy} from '@angular/core';
import {of, Subject, Subscription, timer} from 'rxjs';
import {Command, commandKeywords, isKnownCommand, TestStatus} from './test-controller.interfaces';
import {TestControllerService} from './test-controller.service';
import {
    concatMap,
    distinctUntilChanged,
    filter,
    ignoreElements,
    map,
    mergeMap,
    startWith,
    switchMap
} from 'rxjs/operators';
import {WebsocketBackendService} from '../shared/websocket-backend.service';
import {HttpClient} from '@angular/common/http';

type TestStartedOrStopped = 'started' | 'terminated' | '';

@Injectable()
export class CommandService extends WebsocketBackendService<Command[]> implements OnDestroy {

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
        this.subscribeTestStarted();
    }

    public command$: Subject<Command> = new Subject<Command>();
    private commandSubscription: Subscription;
    initialData = [];
    pollingEndpoint = '';
    pollingInterval = 20000;
    wsChannelName = 'commands';
    private commandHistory: number[] = [];
    private testStartedSubscription: Subscription;

    private static commandToString(command: Command): string {
        return `[${command.id}] ${command.keyword} ` + command.arguments.join(' ');
    }

    private static testStartedOrStopped(testStatus: TestStatus): TestStartedOrStopped {
        if ((testStatus === TestStatus.RUNNING) || (testStatus === TestStatus.PAUSED)) {
            return 'started';
        }
        if ((testStatus === TestStatus.TERMINATED) || (testStatus === TestStatus.ERROR)) {
            return 'terminated';
        }
        return '';
    }

    ngOnDestroy() {
        this.commandSubscription.unsubscribe();
        this.testStartedSubscription.unsubscribe();
    }

    private subscribeTestStarted() {
        if (typeof this.testStartedSubscription !== 'undefined') {
            this.testStartedSubscription.unsubscribe();
        }

        this.testStartedSubscription = this.tcs.testStatus$
            .pipe(
                distinctUntilChanged(),
                map(CommandService.testStartedOrStopped),
                filter(testStartedOrStopped => testStartedOrStopped !== ''),
                map(testStartedOrStopped => testStartedOrStopped ? `test/${this.tcs.testId}/commands` : ''),
                filter(newPollingEndpoint => newPollingEndpoint !== this.pollingEndpoint),
                switchMap((pollingEndpoint: string) => {
                    this.pollingEndpoint = pollingEndpoint;
                    if (this.pollingEndpoint) {
                        return this.observeEndpointAndChannel();
                    } else {
                        this.cutConnection();
                        return of([]);
                    }
                }),
                switchMap(commands => of(...commands))
            ).subscribe(this.command$);
    }

    private subscribeCommands() {
        this.commandSubscription = this.command$
            .pipe(
                concatMap(item => timer(300).pipe(ignoreElements(), startWith(item))), // min delay between items
                mergeMap((command: Command) => {
                    console.log('try to execute' + CommandService.commandToString(command));
                    return this.http.patch(`${this.serverUrl}test/${this.tcs.testId}/command/${command.id}/executed`, {})
                        .pipe(map(() => command));
                })
            )
            .subscribe((command: Command) => {
                this.executeCommand(command);
            }, error => console.warn('error for command', error));
    }

    private executeCommand(command: Command) {

        console.log(Date.now() + '---- execute command: ' + CommandService.commandToString(command));

        if (this.commandHistory.indexOf(command.id) >= 0) {
            console.warn('command already executed' + CommandService.commandToString(command));
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
                console.warn(`Unknown command: ` + CommandService.commandToString(command));
        }
    }

    private setUpGlobalCommandsForDebug() {
        window['tc'] = {};
        commandKeywords.forEach((keyword: string) => {
            const randomNumber = Math.round(Math.random() * -10000000);
            window['tc'][keyword] = (args) => {this.commandFromTerminal(keyword, args, randomNumber); };
        });
    }

    private commandFromTerminal(keyword: string, args: string[], id: number): void {

        if (this.isProductionMode) {
            return;
        }
        args = (typeof args === 'undefined') ? [] : args;
        const command = {keyword, arguments: args, id, timestamp: Date.now()};
        if (!isKnownCommand(keyword)) {
            console.warn(`Unknown command: ` + CommandService.commandToString(command));
            return;
        }

        this.executeCommand(command);
    }
}
