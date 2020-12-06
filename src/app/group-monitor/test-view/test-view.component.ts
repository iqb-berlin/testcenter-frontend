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
import { TestSessionService } from '../test-session.service';

interface IconData {
  icon: string,
  tooltip: string,
  class?: string
}

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

  public testletsTimeleft: Record<string, unknown>|null; // TODO make observable maybe
  public testletsClearedCode: Record<string, unknown> | null;

  public superStateIcons: {[key: string]: IconData} = {
    monitor_group: { tooltip: 'Testleiter', icon: 'supervisor_account' },
    demo: { tooltip: 'Testleiter', icon: 'preview' },
    pending: { tooltip: 'Test noch nicht gestartet', icon: 'person_outline' },
    locked: { tooltip: 'Test gesperrt', icon: 'lock' },
    error: { tooltip: 'Es ist ein Fehler aufgetreten!', icon: 'error', class: 'danger' },
    controller_terminated: {
      tooltip: 'Testausführung wurde beendet und kann wieder aufgenommen werden. ' +
        'Der Browser des Teilnehmers muss ggf. neu geladen werden!',
      icon: 'warning',
      class: 'danger'
    },
    connection_lost: {
      tooltip: 'Seite wurde verlassen oder Browserfenster geschlossen!',
      icon: 'error',
      class: 'danger'
    },
    paused: { tooltip: 'Test pausiert', icon: 'pause' },
    focus_lost: { tooltip: 'Fenster/Tab wurde verlassen!', icon: 'warning', class: 'danger' },
    idle: { tooltip: 'Test ist 5 Minuten oder länger inaktiv!', icon: 'hourglass_full', class: 'danger' },
    connection_websocket: { tooltip: 'Test läuft, Verbindung ist live', icon: 'play_circle_filled', class: 'success' },
    connection_polling: { tooltip: 'Test läuft', icon: 'play_circle_outline', class: 'success' },
    ok: { tooltip: 'Test läuft', icon: 'play_circle_filled' }
  };

  private bookletSubscription: Subscription;

  constructor(
    private bookletsService: BookletService
  ) {
  }

  ngOnInit(): void {
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

        return null;
      }));

    // use setTimeout to put this event at the end of js task queue, so testSession$-initialization happens
    // after (!) subscription from async-pipe
    setTimeout(() => {
      this.testSession$.next(this.testSession);
    });
  }

  ngOnChanges(changes: {[propertyName: string]: SimpleChange}): void {
    if (typeof changes.testSession !== 'undefined') {
      this.testSession$.next(this.testSession);
      this.testletsTimeleft = TestSessionService.parseJsonState(this.testSession.testState, 'TESTLETS_TIMELEFT');
      this.testletsClearedCode = TestSessionService.parseJsonState(this.testSession.testState, 'TESTLETS_CLEARED_CODE');
    }
  }

  ngOnDestroy(): void {
    this.bookletSubscription.unsubscribe();
  }

  getSuperState = TestSessionService.getSuperState;

  stateString = TestSessionService.stateString;

  hasState = TestSessionService.hasState;

  isBooklet = (bookletOrError: Booklet|BookletError): bookletOrError is Booklet => !('error' in bookletOrError);

  getTestletType = (testletOrUnit: Unit|Testlet): 'testlet'|'unit' => (isUnit(testletOrUnit) ? 'unit' : 'testlet');

  trackUnits = (index: number, testlet: Testlet|Unit): string => testlet.id || index.toString();

  blockName = (blockNumber: number): string => `Block ${String.fromCodePoint(64 + blockNumber)}`;

  getUnitContext(testlet: Testlet, unitName: string, level = 0, countGlobal = 0,
                 countAncestor = 0, ancestor: Testlet = null, testletCount = 0): UnitContext {
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
      testletCountGlobal: testletCount,
      parentIndexGlobal: -1
    };

    let i = -1;
    // eslint-disable-next-line no-plusplus
    while (i++ < testlet.children.length - 1) {
      const testletOrUnit = testlet.children[i];

      if (isUnit(testletOrUnit)) {
        if (testletOrUnit.id === unitName) {
          result.indexGlobal = result.unitCountGlobal;
          result.indexLocal = result.unitCount;
          result.indexAncestor = result.unitCountAncestor;
          result.unit = testletOrUnit;
          result.parent = testlet;
          result.parentIndexGlobal = result.testletCountGlobal;
        }

        result.unitCount += 1;
        result.unitCountGlobal += 1;
        result.unitCountAncestor += 1;
      } else {
        const subResult = this.getUnitContext(
          testletOrUnit,
          unitName,
          level + 1,
          result.unitCountGlobal,
          (level < 1) ? 0 : result.unitCountAncestor,
          result.ancestor,
          result.testletCountGlobal + 1
        );
        result.unitCountGlobal = subResult.unitCountGlobal;
        result.unitCountAncestor = (level < 1) ? result.unitCountAncestor : subResult.unitCountAncestor;
        result.testletCountGlobal = subResult.testletCountGlobal;

        if (subResult.indexLocal >= 0) {
          result = subResult;
        }
      }
    }
    return result;
  }

  mark(testletOrUnit: Testlet|Unit|null = null): void {
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

  select($event: Event, testletOrUnit: Testlet|Unit|null): void {
    if ((isUnit(testletOrUnit) ? 'unit' : 'block') !== this.displayOptions.selectionMode) {
      return;
    }

    $event.stopPropagation();
    this.applySelection(testletOrUnit);
  }

  deselect($event: MouseEvent|null): void {
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

  private applySelection(testletOrUnit: Testlet|Unit|null = null, inversion = false) {
    this.selected = {
      element: testletOrUnit,
      session: this.testSession,
      spreading: (this.selected?.element?.id === testletOrUnit?.id) && !inversion ? !this.selected?.spreading : true,
      inversion
    };
    this.selectedElement$.emit(this.selected);
  }

  check($event: MatCheckboxChange): void {
    this.checked$.emit($event.checked);
  }
}
