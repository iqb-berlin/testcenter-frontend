import {Component, Input, OnInit} from '@angular/core';
import {Booklet} from '../booklet.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {Testlet, TestletContentElement, UnitDef} from '../../test-controller/test-controller.classes';
import {StatusUpdate} from '../group-monitor.interfaces';
import {map} from 'rxjs/operators';

@Component({
  selector: 'test-view',
  templateUrl: './test-view.component.html',
  styleUrls: ['./test-view.component.css']
})
export class TestViewComponent implements OnInit {

  @Input() booklet$: BehaviorSubject<Booklet|boolean>;
  @Input() testStatus$: BehaviorSubject<StatusUpdate>;

  public firstLevelChildren$: Observable<TestletContentElement[]>;

  constructor() { }

  ngOnInit(): void {

      this.firstLevelChildren$ = this.booklet$
          .pipe(map((booklet: Booklet|boolean) => {
              console.log("RUNNIGN THROUGH A PIPE")
              if ((booklet !== true) && (booklet !== false)) {
                  return TestViewComponent.getChildrenFromTestlet(booklet.testlet);
              }
              return [];
          })); // TODO unsubscribe later
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

        if ((booklet !== true) && (booklet !== false)) {
            return TestViewComponent.getChildrenFromTestlet(booklet.testlet);
        }
        return [];
    }


  filterUnit(testlet: TestletContentElement): UnitDef|null {

      return (testlet instanceof UnitDef) ? testlet : null;
  }
}
