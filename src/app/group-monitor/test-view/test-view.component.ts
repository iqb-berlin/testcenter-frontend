import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BookletService} from '../booklet.service';
import {Observable} from 'rxjs';
import {Booklet, StatusUpdate, Testlet, Unit} from '../group-monitor.interfaces';


@Component({
  selector: 'test-view',
  templateUrl: './test-view.component.html',
  styleUrls: ['./test-view.component.css']
})
export class TestViewComponent implements OnInit, OnDestroy {

    @Input() testStatus: StatusUpdate;

    public booklet$: Observable<boolean|Booklet>;
    public units: (Testlet|Unit)[];
    public session: Observable<StatusUpdate>;

    private childrenSubscription;

    constructor(
        private bookletsService: BookletService,
    ) {

    }


    ngOnInit() {

        console.log('NEW:' + this.testStatus.testId, this.testStatus.bookletName);

        this.booklet$ = this.bookletsService.getBooklet(this.testStatus.bookletName || "");

        this.childrenSubscription = this.booklet$.subscribe((booklet: Booklet|boolean) => {
            this.units = this.getChildren(booklet);
        });
    }


    ngOnDestroy(): void {

        this.childrenSubscription.unsubscribe();
    }



    getChildren(booklet: Booklet|boolean): (Testlet|Unit)[] {

        if ((booklet !== null) && (booklet !== true) && (booklet !== false)) {
            return booklet.units.children;
        }

        return [];
    }


    // filterUnits(testletOrUnit: Testlet|Unit): Unit|null|Testlet { // TODO tmp.
    //
    //     return (typeof testletOrUnit['children'] === "undefined") ? testletOrUnit : null;
    // }
    //
    //
    // filterUnit(testletOrUnit: Testlet|Unit, unitId: string): Unit|null|Testlet { // TODO tmp.
    //
    //     return (isUnit(testletOrUnit) && (testletOrUnit['id'] === unitId)) ? testletOrUnit : null;
    // }


    getTestletType(testletOrUnit: Testlet): 'testletOrUnit' | 'unit' {

        if (('id' in testletOrUnit) && ('label' in testletOrUnit)) {
            return 'unit';
        }

        if ('children' in testletOrUnit) {
            return 'testletOrUnit';
        }
    }

    // isUnit(testletOrUnit: Testlet|Unit): boolean {
    //
    //     return (typeof testletOrUnit['children'] === "undefined");
    // }


    hasState(stateObject: object, key: string, value: any): boolean {

        return ((typeof stateObject[key] !== "undefined") && (stateObject[key] === value));
    }


    public trackUnits(index: number, testlet: Testlet|Unit): string {

        return testlet['id'] || index.toString();
    }
}
