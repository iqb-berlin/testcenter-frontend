import {
  Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChange
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {
  combineLatest, Observable, Subject, Subscription
} from 'rxjs';
import { map } from 'rxjs/operators';

import { BookletService } from '../booklet.service';
import {
  Booklet, TestSession, Testlet, Unit, TestViewDisplayOptions,
  BookletError, UnitContext, isUnit, Selected
} from '../group-monitor.interfaces';
import { TestMode } from '../../config/test-mode';

@Component({
  selector: 'tc-test-view',
  templateUrl: './test-view.component.html',
  styleUrls: ['./test-view.component.css', './test-view-table.css']
})
export class TestViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() testSession: TestSession;
  @Input() displayOptions: TestViewDisplayOptions;
  @Input() markedElement: Testlet|Unit|null = null;
  @Input() selected: Selected = {
    element: undefined,
    spreading: false
  };
  @Input() checked: boolean;

  @Output() bookletId$ = new EventEmitter<string>();
  @Output() markedElement$ = new EventEmitter<Testlet>();
  @Output() selectedElement$ = new EventEmitter<Selected>();
  @Output() checked$ = new EventEmitter<boolean>();

  public testSession$: Subject<TestSession> = new Subject<TestSession>();
  public booklet$: Observable<Booklet|BookletError>;
  public featuredUnit$: Observable<UnitContext|null>;

  public testletsTimeleft: object|null; // TODO make observable maybe
  public testletsClearedCode: object | null;

  private bookletSubscription: Subscription;

  constructor(
      private bookletsService: BookletService,
  ) {
  }

  ngOnInit() {
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
    if (typeof changes['testSession'] !== 'undefined') {
      this.testSession$.next(this.testSession);
      this.testletsTimeleft = this.parseJsonState(this.testSession.testState, 'TESTLETS_TIMELEFT');
      this.testletsClearedCode = this.parseJsonState(this.testSession.testState, 'TESTLETS_CLEARED_CODE');
    }
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

  hasState(state: object, key: string, value: any = null): boolean {
    return ((typeof state[key] !== 'undefined') && ((value !== null) ? (state[key] === value) : true));
  }

  stateString(state: object, keys: string[], glue: string = ''): string {
    return keys
      .map((key: string) => this.hasState(state, key) ? state[key] : null)
      .filter((value: string) => value !== null)
      .join(glue);
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

  mark(testletOrUnit: Testlet|Unit|null = null) {
    if (testletOrUnit == null) {
      this.markedElement = null;
      this.markedElement$.emit(null);
    } else if (isUnit(testletOrUnit) && this.displayOptions.selectionMode === 'unit') {
      this.markedElement = testletOrUnit;
    } else if (!isUnit(testletOrUnit) && this.displayOptions.selectionMode === 'block') {
      this.markedElement$.emit(testletOrUnit);
      this.markedElement = testletOrUnit;
    }
  }

  select($event: Event, testletOrUnit: Testlet|Unit|null) {
    if ((isUnit(testletOrUnit) ? 'unit' : 'block') !== this.displayOptions.selectionMode) {
      return;
    }

    $event.stopPropagation();
    this.applySelection(testletOrUnit);
  }

  deselect($event: MouseEvent|null) {
    if ($event && ($event.currentTarget === $event.target)) {
      this.applySelection();
    }
  }

  deselectForce($event: Event): boolean {
    this.applySelection();
    $event.stopImmediatePropagation();
    $event.stopPropagation();
    $event.preventDefault();
    return false;
  }

  invertSelectionTestheftWide(): boolean {
    this.applySelection(this.selected.element, true);
    return false;
  }

  private applySelection(testletOrUnit: Testlet|Unit|null = null, inversion: boolean = false) {
    this.selected = {
      element: testletOrUnit,
      session: this.testSession,
      spreading: (this.selected?.element?.id === testletOrUnit?.id) && !inversion ? !this.selected?.spreading : true,
      inversion
    };
    this.selectedElement$.emit(this.selected);
  }

  check($event: MatCheckboxChange) {
    this.checked$.emit($event.checked);
  }
}
