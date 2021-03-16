import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {
  Testlet, Unit, TestViewDisplayOptions,
  isUnit, Selection, TestSession, TestSessionSuperState
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
  @Input() selected: Selection = {
    element: undefined,
    spreading: false
  };

  @Output() markedElement$ = new EventEmitter<Testlet>();
  @Output() selectedElement$ = new EventEmitter<Selection>();
  @Output() checked$ = new EventEmitter<boolean>();

  superStateIcons: {[key in TestSessionSuperState]: IconData} = superStates;

  stateString = TestSessionService.stateString;

  hasState = TestSessionService.hasState;

  getTestletType = (testletOrUnit: Unit|Testlet): 'testlet'|'unit' => (isUnit(testletOrUnit) ? 'unit' : 'testlet');

  trackUnits = (index: number, testlet: Testlet|Unit): string => testlet.id || index.toString();

  blockName = (blockNumber: number): string => `Block ${String.fromCodePoint(64 + blockNumber)}`;

  mark(testletOrNull: Testlet|null = null): void {
    if (testletOrNull == null) {
      this.markedElement = null;
      this.markedElement$.emit(null);
    } else {
      this.markedElement$.emit(testletOrNull);
      this.markedElement = testletOrNull;
    }
  }

  select($event: Event, testlet: Testlet|null): void {
    $event.stopPropagation();
    console.log("select called");
    this.applySelection(testlet);
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

  private applySelection(testletOrNull: Testlet|null = null, inversion = false) {
    this.selected = {
      element: testletOrNull,
      session: this.testSession,
      spreading: (this.selected?.element?.blockId === testletOrNull?.blockId) &&
        !inversion ? !this.selected?.spreading : true,
      inversion
    };
    this.selectedElement$.emit(this.selected);
  }

  check($event: MatCheckboxChange): void {
    this.checked$.emit($event.checked);
  }
}
