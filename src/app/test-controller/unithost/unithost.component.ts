/* eslint-disable no-console */
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import {
  Component, HostListener, OnInit, OnDestroy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  TestStateKey,
  WindowFocusState,
  PendingUnitData,
  StateReportEntry,
  UnitStateKey,
  UnitPlayerState, LoadingProgress, UnitNavigationTarget
} from '../test-controller.interfaces';
import { BackendService } from '../backend.service';
import { TestControllerService } from '../test-controller.service';
import { MainDataService } from '../../maindata.service';
import { VeronaNavigationDeniedReason, VeronaNavigationTarget, VeronaPlayerConfig } from '../verona.interfaces';
import { UnitControllerData } from '../test-controller.classes';

declare let srcDoc;

@Component({
  templateUrl: './unithost.component.html',
  styleUrls: ['./unithost.component.css']
})

export class UnithostComponent implements OnInit, OnDestroy {
  private iFrameHostElement: HTMLElement;
  private iFrameItemplayer: HTMLIFrameElement;
  private subscriptions: { [tag: string ]: Subscription } = {};
  leaveWarning = false;

  unitScreenHeader = '';
  showPageNav = false;

  currentUnitSequenceId = -1;

  private itemplayerSessionId = '';
  private postMessageTarget: Window = null;
  private pendingUnitData: PendingUnitData = null;

  knownPages: { id: string; label: string }[];
  unitsLoading$: BehaviorSubject<LoadingProgress[]> = new BehaviorSubject<LoadingProgress[]>([]);
  unitsToLoadLabels: string[];

  currentUnit: UnitControllerData;
  currentPageIndex: number;
  unitNavigationTarget = UnitNavigationTarget;

  constructor(
    public tcs: TestControllerService,
    private mds: MainDataService,
    private bs: BackendService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.iFrameHostElement = <HTMLElement>document.querySelector('#iFrameHost');
    this.iFrameItemplayer = null;
    this.leaveWarning = false;
    setTimeout(() => {
      this.subscriptions.postMessage = this.mds.postMessage$
        .subscribe(messageEvent => this.handleIncomingMessage(messageEvent));
      this.subscriptions.routing = this.route.params
        .subscribe(params => this.open(Number(params.u)));
      this.subscriptions.navigationDenial = this.tcs.navigationDenial
        .subscribe(navigationDenial => this.handleNavigationDenial(navigationDenial));
    });
  }

  ngOnDestroy(): void {
    Object.values(this.subscriptions).forEach(subscription => subscription.unsubscribe());
  }

  private handleIncomingMessage(messageEvent: MessageEvent): void {
    const msgData = messageEvent.data;
    const msgType = msgData.type;
    let msgPlayerId = msgData.sessionId;
    if ((msgPlayerId === undefined) || (msgPlayerId === null)) {
      msgPlayerId = this.itemplayerSessionId;
    }

    switch (msgType) {
      case 'vopReadyNotification':
        // TODO add apiVersion check
        if (!this.pendingUnitData || this.pendingUnitData.playerId !== msgPlayerId) {
          this.pendingUnitData = {
            unitDefinition: '',
            unitDataParts: '',
            playerId: '',
            currentPage: null
          };
        }
        if (this.tcs.testMode.saveResponses) {
          this.bs.updateUnitState(this.tcs.testId, this.currentUnit.unitDef.alias, [<StateReportEntry>{
            key: UnitStateKey.PLAYER, timeStamp: Date.now(), content: UnitPlayerState.RUNNING
          }]);
        }
        this.postMessageTarget = messageEvent.source as Window;

        this.postMessageTarget.postMessage({
          type: 'vopStartCommand',
          sessionId: this.itemplayerSessionId,
          unitDefinition: this.pendingUnitData.unitDefinition,
          unitState: {
            dataParts: { all: this.pendingUnitData.unitDataParts }
          },
          playerConfig: this.getPlayerConfig()
        }, '*');

        // TODO maybe clean up memory?

        break;

      case 'vopStateChangedNotification':
        if (msgPlayerId === this.itemplayerSessionId) {
          if (msgData.playerState) {
            const { playerState } = msgData;

            this.knownPages = Object.keys(playerState.validPages)
              .map(id => ({ id, label: playerState.validPages[id] }));
            this.currentPageIndex = this.knownPages.findIndex(page => page.id === playerState.currentPage);

            if (typeof playerState.currentPage !== 'undefined') {
              const pageId = playerState.currentPage;
              const pageNr = this.knownPages.indexOf(playerState.currentPage) + 1;
              const pageCount = this.knownPages.length;
              if (this.knownPages.length > 1 && this.knownPages.indexOf(playerState.currentPage) >= 0) {
                this.tcs.newUnitStateCurrentPage(
                  this.currentUnit.unitDef.alias,
                  this.currentUnitSequenceId,
                  pageNr,
                  pageId,
                  pageCount
                );
              }
            }
          }
          const unitDbKey = this.currentUnit.unitDef.alias;
          if (msgData.unitState) {
            const { unitState } = msgData;
            const { presentationProgress, responseProgress } = unitState;

            if (presentationProgress) {
              this.tcs.updateUnitStatePresentationProgress(unitDbKey, this.currentUnitSequenceId, presentationProgress);
            }

            if (responseProgress) {
              this.tcs.newUnitStateResponseProgress(unitDbKey, this.currentUnitSequenceId, responseProgress);
            }

            const unitDataPartsAll = unitState?.dataParts?.all;
            if (unitDataPartsAll) {
              this.tcs.newUnitStateData(unitDbKey, this.currentUnitSequenceId,
                unitDataPartsAll, unitState.unitStateDataType);
            }
          }
          if (msgData.log) {
            this.bs.addUnitLog(this.tcs.testId, unitDbKey, msgData.log);
          }
        }
        break;

      case 'vopUnitNavigationRequestedNotification':
        if (msgPlayerId === this.itemplayerSessionId) {
          // support Verona2 and Verona3 version
          const target = msgData.target ? `#${msgData.target}` : msgData.targetRelative;
          this.tcs.setUnitNavigationRequest(target);
        }
        break;

      case 'vopWindowFocusChangedNotification':
        if (msgData.hasFocus) {
          this.tcs.windowFocusState$.next(WindowFocusState.PLAYER);
        } else if (document.hasFocus()) {
          this.tcs.windowFocusState$.next(WindowFocusState.HOST);
        } else {
          this.tcs.windowFocusState$.next(WindowFocusState.UNKNOWN);
        }
        break;

      default:
        console.log(`processMessagePost ignored message: ${msgType}`);
        break;
    }
  }

  private open(currentUnitSequenceId: number): void {
    this.currentUnitSequenceId = currentUnitSequenceId;
    this.tcs.currentUnitSequenceId = this.currentUnitSequenceId;
    this.mds.appSubTitle$.next(`Aufgabe ${this.currentUnitSequenceId}`);

    while (this.iFrameHostElement.hasChildNodes()) {
      this.iFrameHostElement.removeChild(this.iFrameHostElement.lastChild);
    }

    this.setUnitScreenHeader();

    this.currentUnit = this.tcs.rootTestlet.getUnitAt(this.currentUnitSequenceId);

    if (this.subscriptions.loading) {
      this.subscriptions.loading.unsubscribe();
    }

    const unitsToLoadIds = this.currentUnit.maxTimerRequiringTestlet ?
      this.tcs.rootTestlet.getAllUnitSequenceIds(this.currentUnit.maxTimerRequiringTestlet?.id) :
      [currentUnitSequenceId];

    const unitsToLoad = unitsToLoadIds
      .map(unitSequenceId => this.tcs.getUnitLoadProgress$(unitSequenceId));

    this.unitsToLoadLabels = unitsToLoadIds
      .map(unitSequenceId => this.tcs.rootTestlet.getUnitAt(unitSequenceId).unitDef.title);

    this.subscriptions.loading = combineLatest<LoadingProgress[]>(
      unitsToLoad
    )
      .subscribe({
        next: value => {
          this.unitsLoading$.next(value);
        },
        error: err => {
          this.mds.appError$.next({
            label: `Unit konnte nicht geladen werden. ${err.info}`, // TODO which item failed?
            description: (err.info) ? err.info : err,
            category: 'PROBLEM'
          });
        },
        complete: () => this.runUnit()
      });
  }

  private setUnitScreenHeader(): void {
    switch (this.tcs.bookletConfig.unit_screenheader) {
      case 'WITH_UNIT_TITLE':
        this.unitScreenHeader = this.tcs.rootTestlet.getUnitAt(this.currentUnitSequenceId).unitDef.title;
        break;
      case 'WITH_BOOKLET_TITLE':
        this.unitScreenHeader = this.tcs.rootTestlet.title;
        break;
      case 'WITH_BLOCK_TITLE':
        this.unitScreenHeader = this.tcs.rootTestlet.getUnitAt(this.currentUnitSequenceId).testletLabel;
        break;
      default:
        this.unitScreenHeader = '';
    }
  }

  private runUnit(): void {
    this.unitsLoading$.next([]);
    this.tcs.currentUnitDbKey = this.currentUnit.unitDef.alias;
    this.tcs.currentUnitTitle = this.unitScreenHeader;

    if (this.tcs.testMode.saveResponses) {
      this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
        key: TestStateKey.CURRENT_UNIT_ID, timeStamp: Date.now(), content: this.currentUnit.unitDef.alias
      }]);
      this.bs.updateUnitState(this.tcs.testId, this.currentUnit.unitDef.alias, [<StateReportEntry>{
        key: UnitStateKey.PLAYER, timeStamp: Date.now(), content: UnitPlayerState.LOADING
      }]);
    }

    if (this.currentUnit.unitDef.locked) {
      return;
    }

    this.startTimerIfNecessary();

    this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();

    this.currentPageIndex = undefined;
    this.knownPages = [];

    this.pendingUnitData = {
      playerId: this.itemplayerSessionId,
      unitDefinition: this.tcs.hasUnitDefinition(this.currentUnitSequenceId) ?
        this.tcs.getUnitDefinition(this.currentUnitSequenceId) :
        null,
      unitDataParts: this.tcs.hasUnitStateDataParts(this.currentUnitSequenceId) ?
        this.tcs.getUnitStateDataParts(this.currentUnitSequenceId) :
        null,
      currentPage: this.tcs.hasUnitStateCurrentPage(this.currentUnitSequenceId) ?
        this.tcs.getUnitStateCurrentPage(this.currentUnitSequenceId) :
        null
    };
    this.leaveWarning = false;

    this.prepareIframe();
  }

  private startTimerIfNecessary(): void {
    if (this.currentUnit.maxTimerRequiringTestlet === null) {
      console.log('[MT] no timer');
      return;
    }
    if (this.tcs.currentMaxTimerTestletId &&
      (this.currentUnit.maxTimerRequiringTestlet.id === this.tcs.currentMaxTimerTestletId)
    ) {
      console.log('[MT] same block');
      return;
    }
    console.log('[MT] start');
    this.tcs.startMaxTimer(
      this.currentUnit.maxTimerRequiringTestlet.id,
      this.currentUnit.maxTimerRequiringTestlet.maxTimeLeft
    );
  }

  private prepareIframe(): void {
    this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
    this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
    this.iFrameItemplayer.setAttribute('class', 'unitHost');
    this.iFrameItemplayer.setAttribute('height', String(this.iFrameHostElement.clientHeight - 5));
    this.iFrameHostElement.appendChild(this.iFrameItemplayer);
    srcDoc.set(this.iFrameItemplayer, this.tcs.getPlayer(this.currentUnit.unitDef.playerId));
  }

  // TODO find better places for the following 2 functions, maybe tcs
  private getPlayerConfig(): VeronaPlayerConfig {
    const playerConfig: VeronaPlayerConfig = {
      enabledNavigationTargets: UnithostComponent.getEnabledNavigationTargets(
        this.currentUnitSequenceId,
        1,
        this.tcs.allUnitIds.length,
        this.tcs.bookletConfig.allow_player_to_terminate_test
      ),
      logPolicy: this.tcs.bookletConfig.logPolicy,
      pagingMode: this.tcs.bookletConfig.pagingMode,
      stateReportPolicy: this.tcs.bookletConfig.stateReportPolicy,
      unitNumber: this.currentUnitSequenceId,
      unitTitle: this.unitScreenHeader,
      unitId: this.currentUnit.unitDef.alias
    };
    if (this.pendingUnitData.currentPage && (this.tcs.bookletConfig.restore_current_page_on_return === 'ON')) {
      playerConfig.startPage = this.pendingUnitData.currentPage;
    }
    return playerConfig;
  }

  private static getEnabledNavigationTargets(
    nr: number, min: number, max: number,
    terminationAllowed: 'ON' | 'OFF' | 'LAST_UNIT' = 'ON'
  ): VeronaNavigationTarget[] {
    const navigationTargets = [];
    if (nr < max) {
      navigationTargets.push('next');
    }
    if (nr > min) {
      navigationTargets.push('previous');
    }
    if (nr !== min) {
      navigationTargets.push('first');
    }
    if (nr !== max) {
      navigationTargets.push('last');
    }
    if (terminationAllowed === 'ON') {
      navigationTargets.push('end');
    }
    if ((terminationAllowed === 'LAST_UNIT') && (nr === max)) {
      navigationTargets.push('end');
    }

    return navigationTargets;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.iFrameItemplayer && this.iFrameHostElement) {
      const divHeight = this.iFrameHostElement.clientHeight;
      this.iFrameItemplayer.setAttribute('height', String(divHeight - 5));
      // TODO: Why minus 5px?
    }
  }

  gotoPage(navigationTarget: string): void {
    if (typeof this.postMessageTarget !== 'undefined') {
      this.postMessageTarget.postMessage({
        type: 'vopPageNavigationCommand',
        sessionId: this.itemplayerSessionId,
        target: navigationTarget
      }, '*');
    }
  }

  private handleNavigationDenial(
    navigationDenial: { sourceUnitSequenceId: number; reason: VeronaNavigationDeniedReason[] }
  ): void {
    if (navigationDenial.sourceUnitSequenceId !== this.currentUnitSequenceId) {
      return;
    }

    this.postMessageTarget.postMessage({
      type: 'vopNavigationDeniedNotification',
      sessionId: this.itemplayerSessionId,
      reason: navigationDenial.reason
    }, '*');
  }
}
