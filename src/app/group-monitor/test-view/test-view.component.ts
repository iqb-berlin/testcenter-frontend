import {Component, Input} from '@angular/core';
import {Booklet} from '../booklet.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {Testlet, TestletContentElement, UnitDef} from '../../test-controller/test-controller.classes';
import {StatusUpdate} from '../group-monitor.interfaces';


@Component({
  selector: 'test-view',
  templateUrl: './test-view.component.html',
  styleUrls: ['./test-view.component.css']
})
export class TestViewComponent {

  @Input() booklet$: BehaviorSubject<Booklet|boolean>;
  @Input() testStatus$: StatusUpdate;

  public firstLevelChildren$: Observable<TestletContentElement[]>;

  constructor() { }


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
