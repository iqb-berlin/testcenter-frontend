import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {
  Testlet, Unit, TestViewDisplayOptions,
  isUnit, Selected, TestSession, TestSessionSuperState
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
export class TestViewComponent {
  @Input() testSession: TestSession;
  @Input() displayOptions: TestViewDisplayOptions;
  @Input() markedElement: Testlet|Unit|null = null;
  @Input() selected: Selected = {
    element: undefined,
    spreading: false
  };

  @Input() checked: boolean;
  @Output() markedElement$ = new EventEmitter<Testlet>();
  @Output() selectedElement$ = new EventEmitter<Selected>();
  @Output() checked$ = new EventEmitter<boolean>();

  superStateIcons: {[key in TestSessionSuperState]: IconData} = {
    monitor_group: { tooltip: 'Testleiter', icon: 'supervisor_account' },
    demo: { tooltip: 'Testleiter', icon: 'preview' },
    pending: { tooltip: 'Test noch nicht gestartet', icon: 'person_outline' },
    locked: { tooltip: 'Test gesperrt', icon: 'lock' },
    error: { tooltip: 'Es ist ein Fehler aufgetreten!', icon: 'error', class: 'danger' },
    controller_terminated: {
      tooltip: 'Testausführung wurde beendet und kann wieder aufgenommen werden. ' +
        'Der Browser des Teilnehmers ist nicht verbunden und muss neu geladen werden!',
      icon: 'announcement',
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

  stateString = TestSessionService.stateString;

  hasState = TestSessionService.hasState;

  getTestletType = (testletOrUnit: Unit|Testlet): 'testlet'|'unit' => (isUnit(testletOrUnit) ? 'unit' : 'testlet');

  trackUnits = (index: number, testlet: Testlet|Unit): string => testlet.id || index.toString();

  blockName = (blockNumber: number): string => `Block ${String.fromCodePoint(64 + blockNumber)}`;

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
