import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { MatSidenav } from '@angular/material/sidenav';
import { Observable, Subscription } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from 'iqb-components';
import { BackendService } from './backend.service';
import {
  GroupData,
  TestViewDisplayOptions,
  TestViewDisplayOptionKey, Selection, TestSession, TestSessionSetStats
} from './group-monitor.interfaces';
import { ConnectionStatus } from '../shared/websocket-backend.service';
import { TestSessionService } from './test-session.service';
import { GroupMonitorService } from './group-monitor.service';

@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit, OnDestroy {
  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private bs: BackendService,
    public gms: GroupMonitorService,
    private router: Router
  ) {}

  ownGroup$: Observable<GroupData>;
  private ownGroupName = '';

  connectionStatus$: Observable<ConnectionStatus>;

  selectedElement: Selection;
  markedElement: Selection;

  displayOptions: TestViewDisplayOptions = {
    view: 'medium',
    groupColumn: 'hide',
    bookletColumn: 'show',
    blockColumn: 'show',
    unitColumn: 'hide',
    highlightSpecies: false
  };

  isScrollable = false;
  isClosing = false;

  warnings: { [key: string]: { text: string, timeout: number } } = {};

  private routingSubscription: Subscription = null;

  @ViewChild('adminbackground') mainElem:ElementRef;
  @ViewChild('sidenav', { static: true }) sidenav: MatSidenav;

  ngOnInit(): void {
    this.routingSubscription = this.route.params.subscribe(params => {
      this.ownGroup$ = this.bs.getGroupData(params['group-name']);
      this.ownGroupName = params['group-name'];
      this.gms.connect(params['group-name']);
    });
    this.gms.allSessionsInfo$.subscribe(stats => {
      this.onSessionsUpdate(stats);
    });
    this.gms.allSessionsInfo$.subscribe(stats => {
      this.onCheckedChange(stats);
    });
    this.connectionStatus$ = this.bs.connectionStatus$;
  }

  ngOnDestroy(): void {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    this.gms.disconnect();
  }

  private onSessionsUpdate(stats: TestSessionSetStats): void {
    this.displayOptions.highlightSpecies = (stats.numberOfDifferentBookletSpecies > 1);
  }

  private onCheckedChange(stats: TestSessionSetStats): void {
    if (stats.numberOfDifferentBookletSpecies > 1) {
      this.selectedElement = null;
    }
  }

  trackSession = (index: number, session: TestSession): number => session.id;

  setTableSorting(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      return;
    }
    this.gms.sortBy$.next(sort);
  }

  setDisplayOption(option: string, value: TestViewDisplayOptions[TestViewDisplayOptionKey]): void {
    this.displayOptions[option] = value;
  }

  ngAfterViewChecked(): void {
    this.isScrollable = this.mainElem.nativeElement.clientHeight < this.mainElem.nativeElement.scrollHeight;
  }

  scrollDown(): void {
    this.mainElem.nativeElement.scrollTo(0, this.mainElem.nativeElement.scrollHeight);
  }

  updateScrollHint(): void {
    const elem = this.mainElem.nativeElement;
    const reachedBottom = (elem.scrollTop + elem.clientHeight === elem.scrollHeight);
    elem.classList[reachedBottom ? 'add' : 'remove']('hide-scroll-hint');
  }

  getClusterColor(session: TestSession): string {
    if (!this.displayOptions.highlightSpecies) {
      return 'white';
    }
    const species = session.booklet.species;
    const q1 = species.length / 4;
    const q2 = species.length / 2;
    const q3 = 3 * (species.length / 4);
    const end = species.length - 1;
    const cnn = species.length * (species.charCodeAt(0) + species.charCodeAt(q1) +
      species.charCodeAt(q2) + species.charCodeAt(q3) + species.charCodeAt(end));
    const rgb = [255, 255, 255];
    rgb[species.charCodeAt(end) % 3] = (cnn % 150);
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]}, 0.07)`;
  }

  markElement(marking: Selection): void {
    this.markedElement = marking;
  }

  selectElement(selected: Selection): void {
    this.gms.checkSessionsBySelection(selected);
    this.selectedElement = selected;
  }

  isPauseAllowed(): boolean {
    const activeSessions = this.gms.sessions.length && this.gms.sessions
      .filter(session => TestSessionService.hasState(session.data.testState, 'status', 'running'));
    return activeSessions.length && activeSessions
      .filter(session => TestSessionService.hasState(session.data.testState, 'status', 'running'))
      .filter(session => TestSessionService.hasState(session.data.testState, 'CONTROLLER', 'PAUSED'))
      .length === 0;
  }

  isResumeAllowed(): boolean {
    const activeSessions = this.gms.sessions
      .filter(session => TestSessionService.hasState(session.data.testState, 'status', 'running'));
    return activeSessions.length && activeSessions
      .filter(session => !TestSessionService.hasState(session.data.testState, 'CONTROLLER', 'PAUSED'))
      .length === 0;
  }

  isUnlockAllowed(): boolean {
    const lockedSessions = this.gms.sessions
      .filter(session => TestSessionService.hasState(session.data.testState, 'status', 'locked'));
    return lockedSessions.length && (lockedSessions.length === Object.values(this.gms.checkedSessions).length);
  }

  isGotoAllowed(): boolean {
    return !!(this.selectedElement?.element) && (this.gms.checkedSessionsInfo.numberOfDifferentBookletSpecies === 1);
  }

  finishEverythingCommand(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: 'auto',
      data: <ConfirmDialogData>{
        title: 'Testdurchführung Beenden',
        content: 'Achtung! Diese Aktion sperrt und beendet sämtliche Tests dieser Sitzung.',
        confirmbuttonlabel: 'Ja, ich möchte die Testdurchführung Beenden',
        showcancel: true
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isClosing = true;
        this.gms.finishEverything()
          .add(() => {
            setTimeout(() => { this.router.navigateByUrl('/r/login'); }, 5000); // go away
          });
      }
    });
  }

  testCommandGoto(): void {
    this.gms.testCommandGoto(this.selectedElement);
  }

  unlockCommand(): void {
    this.gms.testCommandUnlock().add(() => {
      const plural = this.gms.sessions.length > 1;
      this.addWarning('reload-some-clients',
        `${plural ? this.gms.sessions.length : 'Ein'} Test${plural ? 's' : ''} 
        wurde${plural ? 'n' : ''} entsperrt. ${plural ? 'Die' : 'Der'} Teilnehmer 
        ${plural ? 'müssen' : 'muss'} die Webseite aufrufen bzw. neuladen, 
        damit ${plural ? 'die' : 'der'} Test${plural ? 's' : ''} wieder aufgenommen werden kann!`);
    });
  }

  toggleChecked(checked: boolean, session: TestSession): void {
    if (!this.gms.isChecked(session)) {
      this.gms.checkSession(session);
    } else {
      this.gms.uncheckSession(session);
    }
    this.gms.onCheckedChanged();
  }

  private addWarning(key, text): void {
    if (typeof this.warnings[key] !== 'undefined') {
      window.clearTimeout(this.warnings[key].timeout);
    }
    this.warnings[key] = {
      text,
      timeout: window.setTimeout(() => delete this.warnings[key], 30000)
    };
  }
}
