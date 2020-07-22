import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChange} from '@angular/core';
import {BookletService} from '../booklet.service';
import {combineLatest, Observable, Subject, Subscription} from 'rxjs';
import {Booklet, TestSession, Testlet, Unit, TestViewDisplayOptions} from '../group-monitor.interfaces';
import {map} from 'rxjs/operators';
import {TestMode} from '../../config/test-mode';


function isUnit(testletOrUnit: Testlet|Unit): testletOrUnit is Unit {

    return !('children' in testletOrUnit);
}

interface UnitContext {
    unit?: Unit,
    parent?: Testlet,
    ancestor?: Testlet,
    unitCount: number,
    unitCountGlobal: number,
    indexGlobal: number,
    indexLocal: number,
    indexAncestor: number,
    unitCountAncestor: number,
}

@Component({
  selector: 'test-view',
  templateUrl: './test-view.component.html',
  styleUrls: ['./test-view.component.css', './test-view-table.css']
})
export class TestViewComponent implements OnInit, OnDestroy, OnChanges {

    @Input() testStatus: TestSession;
    @Input() displayOptions: TestViewDisplayOptions;

    private testStatus$: Subject<TestSession>;
    public booklet$: Observable<boolean|Booklet>;
    public featuredUnit$: Observable<UnitContext|null>;

    private childrenSubscription: Subscription;

    public units: (Testlet|Unit)[];
    public maxTimeLeft: object|null;

    constructor(
        private bookletsService: BookletService,
    ) {
        this.testStatus$ = new Subject<TestSession>();
    }


    ngOnInit() {

        console.log('NEW:' + this.testStatus.personId, this.testStatus.bookletName);

        this.booklet$ = this.bookletsService.getBooklet(this.testStatus.bookletName || "");

        this.childrenSubscription = this.booklet$.subscribe((booklet: Booklet|boolean) => {

            if ((booklet !== null) && (booklet !== true) && (booklet !== false)) {
                this.units = booklet.units.children;
            }
        });

        this.featuredUnit$ = combineLatest<[Booklet|null, TestSession]>([this.booklet$, this.testStatus$])
            .pipe(map((bookletAndStatus: [Booklet|boolean, TestSession]) => {

                console.log("MAP");

                const booklet: Booklet|boolean = bookletAndStatus[0];

                if ((booklet === true) || (booklet === false)) {
                    return null;
                }

                if (this.testStatus.unitName) {
                    return this.getUnitContext(booklet.units, this.testStatus.unitName);
                }
            }));
    }


    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {

        this.testStatus$.next(this.testStatus);
        this.maxTimeLeft = this.parseJsonState(this.testStatus.testState, 'MAXTIMELEFT');
    }


    ngOnDestroy(): void {

        this.childrenSubscription.unsubscribe();
    }


    getTestletType(testletOrUnit: Unit|Testlet): 'testlet'|'unit' {

        return isUnit(testletOrUnit) ? 'unit': 'testlet';
    }


    hasState(stateObject: object, key: string, value: any = null): boolean {

        return ((typeof stateObject[key] !== "undefined") && ((value !== null) ? (stateObject[key] === value) : true));
    }


    parseJsonState(testStateObject: object, key: string): object|null {

        if (typeof testStateObject[key] === "undefined") {
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
            }
        }

        let testMode = new TestMode(modeString);
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
        }

        let i = -1;

        while (i++ < testlet.children.length - 1) {

            const testletOrUnit = testlet.children[i];

            if (isUnit(testletOrUnit)) {

                if (testletOrUnit.id == unitName) {

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
