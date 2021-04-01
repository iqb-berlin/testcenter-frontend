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
  @Input() marked: Selection;
  @Input() selected: Selection;
  @Input() checked: boolean;

  @Output() markedElement$ = new EventEmitter<Selection>();
  @Output() selectedElement$ = new EventEmitter<Selection>();
  @Output() checked$ = new EventEmitter<boolean>();

  superStateIcons: { [key in TestSessionSuperState]: IconData } = superStates;

  stateString = TestSessionService.stateString;

  hasState = TestSessionService.hasState;

  getTestletType = (testletOrUnit: Unit|Testlet): 'testlet'|'unit' => (isUnit(testletOrUnit) ? 'unit' : 'testlet');

  trackUnits = (index: number, testlet: Testlet|Unit): string => testlet.id || index.toString();

  blockName = (blockNumber: number): string => `Block ${String.fromCodePoint(64 + blockNumber)}`;

  mark(testletOrNull: Testlet|null = null): void {
    this.marked = this.asSelectionObject(testletOrNull);
    this.markedElement$.emit(this.marked);
  }

  isSelected(testletOrNull: Testlet|null = null): boolean {
    return testletOrNull &&
      (this.selected?.element?.blockId === testletOrNull.blockId) &&
      (this.selected?.originSession.booklet.species === this.testSession.booklet.species);
  }

  isMarked(testletOrNull: Testlet|null = null): boolean {
    return testletOrNull &&
      (this.marked?.element?.blockId === testletOrNull.blockId) &&
      (this.marked?.originSession.booklet.species === this.testSession.booklet.species);
  }

  select($event: Event, testlet: Testlet|null): void {
    $event.stopPropagation();
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

  invertSelection(): boolean {
    this.applySelection(this.selected?.element, true);
    return false;
  }

  check($event: MatCheckboxChange): void {
    this.checked$.emit($event.checked);
  }

  private applySelection(testletOrNull: Testlet|null = null, inversion = false): void {
    this.selected = this.asSelectionObject(testletOrNull, inversion);
    this.selectedElement$.emit(this.selected);
  }

  private asSelectionObject(testletOrNull: Testlet|null = null, inversion = false): Selection {
    return {
      element: testletOrNull,
      originSession: this.testSession,
      spreading: this.isSelected(testletOrNull) ? !(this.selected?.spreading) : !!testletOrNull,
      inversion
    };
  }
}
