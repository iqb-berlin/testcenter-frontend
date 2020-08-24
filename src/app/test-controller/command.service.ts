import {Inject, Injectable, OnDestroy} from '@angular/core';
import {Observable, of, Subject, Subscription, timer} from 'rxjs';
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
    switchMap, tap
} from 'rxjs/operators';
import {WebsocketBackendService} from '../shared/websocket-backend.service';
import {HttpClient} from '@angular/common/http';

type TestStartedOrStopped = 'started' | 'terminated' | '';

@Injectable()
export class CommandService extends WebsocketBackendService<Command[]> implements OnDestroy {

    public command$: Observable<Command>;

    protected initialData = [];
    protected pollingEndpoint = '';
    protected pollingInterval = 5000;
    protected wsChannelName = 'commands';

    private commandReceived$: Subject<Command> = new Subject<Command>();
    private commandSubscription: Subscription;
    private testStartedSubscription: Subscription;
    private executedCommandIds: number[] = [];

    constructor (
        @Inject('IS_PRODUCTION_MODE') public isProductionMode,
        private tcs: TestControllerService,
        @Inject('SERVER_URL') serverUrl: string,
        protected http: HttpClient
    ) {
        super(serverUrl, http);

        if (!this.isProductionMode) {
            this.setUpGlobalCommandsForDebug();
        }

        this.command$ = this.commandReceived$
            .pipe(
                filter((command: Command) => (this.executedCommandIds.indexOf(command.id) < 0)),
                concatMap((command: Command) => timer(1000).pipe(ignoreElements(), startWith(command))), // min delay between items
                mergeMap((command: Command) => {
                    console.log('try to execute' + CommandService.commandToString(command));
                    return this.http.patch(`${this.serverUrl}test/${this.tcs.testId}/command/${command.id}/executed`, {})
                        .pipe(
                            map(() => command),
                            tap(cmd => this.executedCommandIds.push(cmd.id))
                        );
                })
            );

        this.subscribeCommands();
        this.subscribeTestStarted();
    }

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
            ).subscribe(this.commandReceived$);
    }

    // TODO move to testcontroller maybe
    private subscribeCommands() {
        this.commandSubscription = this.command$.subscribe(
            (command: Command) => {
                console.log(Date.now() + '---- execute command: ' + CommandService.commandToString(command));
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
            }, error => console.warn('error for command', error));
    }

    private setUpGlobalCommandsForDebug() {
        window['tc'] = {};
        commandKeywords.forEach((keyword: string) => {

            window['tc'][keyword] = (args) => {this.commandFromTerminal(keyword, args); };
        });
    }

    private commandFromTerminal(keyword: string, args: string[]): void {

        if (this.isProductionMode) {
            return;
        }
        args = (typeof args === 'undefined') ? [] : args;
        const id = Math.round(Math.random() * -10000000);
        const command = {keyword, arguments: args, id, timestamp: Date.now()};
        if (!isKnownCommand(keyword)) {
            console.warn(`Unknown command: ` + CommandService.commandToString(command));
            return;
        }

        this.commandReceived$.next(command);
    }
}
