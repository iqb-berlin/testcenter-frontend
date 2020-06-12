import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChange} from '@angular/core';
import {BookletService} from '../booklet.service';
import {combineLatest, Observable, Subject} from 'rxjs';
import {Booklet, TestSession, Testlet, Unit} from '../group-monitor.interfaces';
import {map} from 'rxjs/operators';
import {TestMode} from '../../config/test-mode';


function isUnit(testletOrUnit: Testlet|Unit): testletOrUnit is Unit {

    return !('children' in testletOrUnit);
}

@Component({
  selector: 'test-view',
  templateUrl: './test-view.component.html',
  styleUrls: ['./test-view.component.css', './test-view-table.css']
})
export class TestViewComponent implements OnInit, OnDestroy, OnChanges {

    @Input() testStatus: TestSession;

    private testStatus$: Subject<TestSession>;
    public booklet$: Observable<boolean|Booklet>;
    public featuredUnit$: Observable<{
        unit: Unit,
        parent: Testlet
    }|null>;

    private childrenSubscription;

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
                    return this.findUnitByName(booklet.units, this.testStatus.unitName);
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


    findUnitByName(testlet: Testlet, unitName: String): {unit: Unit|null, parent: Testlet} {

        for (let i = 0; i < testlet.children.length; i++) {

            const testletOrUnit = testlet.children[i];

            if (isUnit(testletOrUnit)) {

                if (testletOrUnit.id === unitName) {
                    return {
                        parent: testlet,
                        unit: testletOrUnit
                    }
                }

            } else {

                const findInChildren = this.findUnitByName(testletOrUnit, unitName);

                if (findInChildren !== null) {
                    return findInChildren;
                }
            }
        }
        return null;
    }
}
