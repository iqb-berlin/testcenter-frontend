import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChange} from '@angular/core';
import {BookletService} from '../booklet.service';
import {combineLatest, Observable, Subject} from 'rxjs';
import {Booklet, StatusUpdate, Testlet, Unit} from '../group-monitor.interfaces';
import {map} from 'rxjs/operators';


function isUnit(testletOrUnit: Testlet|Unit): testletOrUnit is Unit {

    return (('id' in testletOrUnit) && ('label' in testletOrUnit));
}

@Component({
  selector: 'test-view',
  templateUrl: './test-view.component.html',
  styleUrls: ['./test-view.component.css']
})
export class TestViewComponent implements OnInit, OnDestroy, OnChanges {

    @Input() testStatus: StatusUpdate;
    // set testStatus(sessionState: StatusUpdate) {
    //
    //     if (!this.testStatus$) {
    //         this.testStatus$ = new BehaviorSubject<StatusUpdate>(sessionState);
    //     } else {
    //         this.testStatus$.next(sessionState);
    //     }
    //
    // }
    // get testStatus(): StatusUpdate {
    //
    //     return this.testStatus$.getValue();
    // }

    private testStatus$: Subject<StatusUpdate>;

    public booklet$: Observable<boolean|Booklet>;
    public featuredUnit$: Observable<Unit|null>;
    public units: (Testlet|Unit)[];
    public session: Observable<StatusUpdate>;

    private childrenSubscription;

    private id;

    constructor(
        private bookletsService: BookletService,
    ) {
        this.testStatus$ = new Subject<StatusUpdate>();
    }


    ngOnInit() {

        this.id = this.testStatus.personId;

        console.log('NEW:' + this.id + ' |  ' + this.testStatus.testId, this.testStatus.bookletName);

        this.booklet$ = this.bookletsService.getBooklet(this.testStatus.bookletName || "");

        this.childrenSubscription = this.booklet$.subscribe((booklet: Booklet|boolean) => {

            if ((booklet !== null) && (booklet !== true) && (booklet !== false)) {
                this.units = booklet.units.children;
            }
        });

        this.featuredUnit$ = combineLatest<[Booklet|null, StatusUpdate]>([this.booklet$, this.testStatus$])
            .pipe(map((bookletAndStatus: [Booklet|boolean, StatusUpdate]) => {

                const booklet: Booklet|boolean = bookletAndStatus[0];

                if ((booklet === true) || (booklet === false)) {
                    return null;
                }

                if (this.testStatus.unitName) {
                    return this.findUnitByName(booklet.units, this.testStatus.unitName);
                }
            }));
    }


    ngOnDestroy(): void {

        this.childrenSubscription.unsubscribe();
    }


    getTestletType(testletOrUnit: Unit|Testlet): 'testlet'|'unit' {

        return isUnit(testletOrUnit) ? 'unit': 'testlet';
    }


    hasState(stateObject: object, key: string, value: any): boolean {

        return ((typeof stateObject[key] !== "undefined") && (stateObject[key] === value));
    }


    trackUnits(index: number, testlet: Testlet|Unit): string {

        return testlet['id'] || index.toString();
    }


    findUnitByName(testlet: Testlet, unitName: String): Unit|null {

        for (let i = 0; i < testlet.children.length; i++) {

            const testletOrUnit = testlet.children[i];
            if (isUnit(testletOrUnit)) {
                if (testletOrUnit.id === unitName) {
                    return testletOrUnit
                }
            } else {
                return this.findUnitByName(testletOrUnit, unitName);
            }
        }
        return null;
    }


    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {

        this.testStatus$.next(this.testStatus);
    }
}
