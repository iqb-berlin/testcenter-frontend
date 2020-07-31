import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChange} from '@angular/core';
import {BookletService} from '../booklet.service';
import {combineLatest, Observable, Subject, Subscription} from 'rxjs';
import {Booklet, TestSession, Testlet, Unit, TestViewDisplayOptions, BookletError} from '../group-monitor.interfaces';
import {map} from 'rxjs/operators';
import {TestMode} from '../../config/test-mode';

// TODO find good place for this typeguard
function isUnit(testletOrUnit: Testlet|Unit): testletOrUnit is Unit {
    return !('children' in testletOrUnit);
}


interface UnitContext {
    unit?: Unit;
    parent?: Testlet;
    ancestor?: Testlet;
    unitCount: number;
    unitCountGlobal: number;
    indexGlobal: number;
    indexLocal: number;
    indexAncestor: number;
    unitCountAncestor: number;
}

@Component({
  selector: 'tc-test-view',
  templateUrl: './test-view.component.html',
  styleUrls: ['./test-view.component.css', './test-view-table.css']
})
export class TestViewComponent implements OnInit, OnChanges, OnDestroy {
    @Input() testSession: TestSession;
    @Input() displayOptions: TestViewDisplayOptions;
    @Output() bookletId$ = new EventEmitter<string>();

    public testSession$: Subject<TestSession> = new Subject<TestSession>();
    public booklet$: Observable<Booklet|BookletError>;
    public featuredUnit$: Observable<UnitContext|null>;

    public maxTimeLeft: object|null; // TODO make observable maybe

    private bookletSubscription: Subscription;

    constructor(
        private bookletsService: BookletService,
    ) {
    }

    ngOnInit() {
        console.log('NEW test-view component:' + this.testSession.personId, this.testSession.bookletName);

        this.booklet$ = this.bookletsService.getBooklet(this.testSession.bookletName || '');

        this.bookletSubscription = this.booklet$.subscribe((booklet: Booklet|BookletError) => {
            this.bookletId$.emit(this.isBooklet(booklet) ? booklet.metadata.id : '');
        });

        this.featuredUnit$ = combineLatest<[Booklet|BookletError, TestSession]>([this.booklet$, this.testSession$])
            .pipe(map((bookletAndSession: [Booklet|BookletError, TestSession]): UnitContext|null => {
                const booklet: Booklet|BookletError = bookletAndSession[0];

                if (!this.isBooklet(booklet)) {
                    return null;
                }

                if (this.testSession.unitName) {
                    return this.getUnitContext(booklet.units, this.testSession.unitName);
                }
            }));

        // use setTimeout to put this event at the end of js task queue, so testSession$-initialization happens
        // after (!) subscription from async-pipe
        setTimeout(() => {
            this.testSession$.next(this.testSession);
        });
    }

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        this.testSession$.next(this.testSession);
        this.maxTimeLeft = this.parseJsonState(this.testSession.testState, 'MAXTIMELEFT');
    }

    ngOnDestroy() {
        this.bookletSubscription.unsubscribe();
    }

    isBooklet(bookletOrBookletError: Booklet|BookletError): bookletOrBookletError is Booklet {
        return !('error' in bookletOrBookletError);
    }

    getTestletType(testletOrUnit: Unit|Testlet): 'testlet'|'unit' {
        return isUnit(testletOrUnit) ? 'unit' : 'testlet';
    }

    hasState(stateObject: object, key: string, value: any = null): boolean {
        return ((typeof stateObject[key] !== 'undefined') && ((value !== null) ? (stateObject[key] === value) : true));
    }

    parseJsonState(testStateObject: object, key: string): object|null {
        if (typeof testStateObject[key] === 'undefined') {
            return null;
        }

        const stateValueString = testStateObject[key];

        try {
            return JSON.parse(stateValueString);
        } catch (error) {
            console.warn(`state ${key} is no valid JSON`, stateValueString, error);
            return null;
        }
    }

    getMode(modeString: string): {modeId: string, modeLabel: string} {
        const untranslatedModes = ['monitor-group', 'monitor-workspace', 'monitor-study'];

        if (untranslatedModes.indexOf(modeString) > -1) {

            return {
                modeId: modeString,
                modeLabel: 'Testleiter'
            };
        }

        const testMode = new TestMode(modeString);
        return {
            modeId: testMode.modeId,
            modeLabel: testMode.modeLabel
        };
    }

    trackUnits(index: number, testlet: Testlet|Unit): string {
        return testlet['id'] || index.toString();
    }

    getUnitContext(testlet: Testlet, unitName: String, level: number = 0, countGlobal = 0,
                   countAncestor = 0, ancestor: Testlet = null): UnitContext {

        let result: UnitContext = {
            unit: null,
            parent: null,
            ancestor: (level <= 1) ? testlet : ancestor,
            unitCount: 0,
            unitCountGlobal: countGlobal,
            unitCountAncestor: countAncestor,
            indexGlobal: -1,
            indexLocal: -1,
            indexAncestor: -1,
        };

        let i = -1;

        while (i++ < testlet.children.length - 1) {

            const testletOrUnit = testlet.children[i];

            if (isUnit(testletOrUnit)) {

                if (testletOrUnit.id === unitName) {

                    result.indexGlobal = result.unitCountGlobal;
                    result.indexLocal = result.unitCount;
                    result.indexAncestor = result.unitCountAncestor;
                    result.unit = testletOrUnit;
                    result.parent = testlet;
                }

                result.unitCount++;
                result.unitCountGlobal++;
                result.unitCountAncestor++;

            } else {

                const subResult = this.getUnitContext(testletOrUnit, unitName, level + 1, result.unitCountGlobal,
                    (level < 1) ? 0 : result.unitCountAncestor, result.ancestor);
                result.unitCountGlobal = subResult.unitCountGlobal;
                result.unitCountAncestor = (level < 1) ? result.unitCountAncestor : subResult.unitCountAncestor;

                if (subResult.indexLocal >= 0) {
                    result = subResult;
                }
            }
        }

        return result;
    }
}
