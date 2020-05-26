import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Booklet, BookletService} from '../booklet.service';
import {Observable} from 'rxjs';
import {Testlet, TestletContentElement, UnitDef} from '../../test-controller/test-controller.classes';
import {StatusUpdate} from '../group-monitor.interfaces';


@Component({
  selector: 'test-view',
  templateUrl: './test-view.component.html',
  styleUrls: ['./test-view.component.css']
})
export class TestViewComponent implements OnInit, OnDestroy {

    @Input() testStatus: StatusUpdate;

    public booklet$: Observable<boolean|Booklet>;
    public units$: Observable<TestletContentElement[]>;
    public units: TestletContentElement[];
    public session: Observable<StatusUpdate>;

    private childrenSubscription;

    constructor(
        private bookletsService: BookletService,
    ) {

    }


    ngOnInit() {

        console.log('NEW:' + this.testStatus.testId, this.testStatus.bookletName);

        this.booklet$ = this.getBookletInfo(this.testStatus);

        this.childrenSubscription = this.booklet$.subscribe((booklet: Booklet|boolean) => {
            this.units = this.getChildren(booklet);
        });
    }


    ngOnDestroy(): void {

        this.childrenSubscription.unsubscribe();
    }


    // TODO put on better place

    static getChildrenFromTestlet(testlet: Testlet): TestletContentElement[] {

      return testlet.children
          .sort((element: TestletContentElement): number => {
              if (element.sequenceId == element.sequenceId) return 0;
              if (element.sequenceId > element.sequenceId) return 1;
              if (element.sequenceId > element.sequenceId) return -1;
          });
    }


    getChildren(booklet: Booklet|boolean): TestletContentElement[] {

        if ((booklet === null)) {
            console.log("NULL");
        }

        if ((booklet !== null) && (booklet !== true) && (booklet !== false)) {
            return TestViewComponent.getChildrenFromTestlet(booklet.testlet);
        }

        return [];
    }


    filterUnits(testlet: TestletContentElement): UnitDef|null {

        return (testlet instanceof UnitDef) ? testlet : null;
    }


    filterUnit(testlet: TestletContentElement, unitId: string): UnitDef|null {

        return ((testlet instanceof UnitDef) && (testlet.id === unitId)) ? testlet : null;
    }


    hasState(stateObject: object, key: string, value: any): boolean {

        return ((typeof stateObject[key] !== "undefined") && (stateObject[key] === value));
    }


    public trackUnits(index: number, testlet: TestletContentElement) {

        return testlet.id;
    }


    getBookletInfo(status: StatusUpdate): Observable<Booklet|boolean> {

        // if ((typeof status.testState["status"] !== "undefined") && (status.testState["status"] === "locked")) {
        //   console.log('no need to load locked booklet', status.testId);
        //   return false;
        // }

        return this.bookletsService.getBooklet(status.bookletName || "");
    }


}
