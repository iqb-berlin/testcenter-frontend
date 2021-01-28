import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {
  Testlet, Unit, TestViewDisplayOptions,
  isUnit, Selected, TestSession, TestSessionSuperState
} from '../group-monitor.interfaces';
import { TestSessionService } from '../test-session.service';
import { superStates } from './super-states';

interface IconData {
  icon: string,
  tooltip: string,
  class?: string,
  description?: string
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
  @Input() checked: boolean;
  @Input() selected: Selected = {
    element: undefined,
    spreading: false
  };

  @Output() markedElement$ = new EventEmitter<Testlet>();
  @Output() selectedElement$ = new EventEmitter<Selected>();
  @Output() checked$ = new EventEmitter<boolean>();

  superStateIcons: {[key in TestSessionSuperState]: IconData} = superStates;

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
