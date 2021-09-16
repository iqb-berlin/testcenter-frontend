/* eslint-disable no-console */
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import {
  Component, HostListener, OnInit, OnDestroy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  PageData,
  TestStateKey,
  WindowFocusState,
  PendingUnitData,
  StateReportEntry,
  UnitStateKey,
  UnitPlayerState, LoadingProgress
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

  unitTitle = '';
  showPageNav = false;

  currentUnitSequenceId = -1;
  private myUnitDbKey = '';

  private itemplayerSessionId = '';
  private postMessageTarget: Window = null;
  private pendingUnitData: PendingUnitData = null;

  pageList: PageData[] = [];
  private knownPages: string[];
  unitsLoading$: BehaviorSubject<LoadingProgress[]> = new BehaviorSubject<LoadingProgress[]>([]);
  unitsToLoadLabels: string[];

  isNaN = Number.isNaN;

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
          this.bs.updateUnitState(this.tcs.testId, this.myUnitDbKey, [<StateReportEntry>{
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
            this.setPageList(Object.keys(playerState.validPages), playerState.currentPage);
            if (typeof playerState.currentPage !== 'undefined') {
              const pageId = playerState.currentPage;
              const pageNr = this.knownPages.indexOf(playerState.currentPage) + 1;
              const pageCount = this.knownPages.length;
              if (this.knownPages.length > 1 && this.knownPages.indexOf(playerState.currentPage) >= 0) {
                this.tcs.newUnitStateCurrentPage(
                  this.myUnitDbKey,
                  this.currentUnitSequenceId,
                  pageNr,
                  pageId,
                  pageCount
                );
              }
            }
          }
          if (msgData.unitState) {
            const { unitState } = msgData;
            const { presentationProgress, responseProgress } = unitState;

            if (presentationProgress) {
              this.tcs.updateUnitStatePresentationProgress(this.myUnitDbKey,
                this.currentUnitSequenceId, presentationProgress);
            }

            if (responseProgress) {
              this.tcs.newUnitStateResponseProgress(this.myUnitDbKey, this.currentUnitSequenceId, responseProgress);
            }

            const unitDataPartsAll = unitState?.dataParts?.all;
            if (unitDataPartsAll) {
              this.tcs.newUnitStateData(this.myUnitDbKey, this.currentUnitSequenceId,
                unitDataPartsAll, unitState.unitStateDataType);
            }
          }
          if (msgData.log) {
            this.bs.addUnitLog(this.tcs.testId, this.myUnitDbKey, msgData.log);
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
    this.mds.appSubTitle$.next(`Seite ${this.currentUnitSequenceId}`); // TODO this should show the UNIT?!

    while (this.iFrameHostElement.hasChildNodes()) {
      this.iFrameHostElement.removeChild(this.iFrameHostElement.lastChild);
    }

    const currentUnit = this.tcs.rootTestlet.getUnitAt(this.currentUnitSequenceId);
    this.unitTitle = currentUnit.unitDef.title;
    this.myUnitDbKey = currentUnit.unitDef.alias;

    if (this.subscriptions.loading) {
      this.subscriptions.loading.unsubscribe();
    }

    const unitsToLoadIds = currentUnit.maxTimerRequiringTestlet ?
      this.tcs.rootTestlet.getAllUnitSequenceIds(currentUnit.maxTimerRequiringTestlet?.id) :
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
          console.log('[next]', value);
        },
        error: err => {
          this.mds.appError$.next({
            label: `Unit konnte nicht geladen werden. ${err.info}`, // TODO which item failed?
            description: (err.info) ? err.info : err,
            category: 'PROBLEM'
          });
        },
        complete: () => this.runUnit(currentUnit)
      });
  }

  private runUnit(currentUnit: UnitControllerData): void {
    this.unitsLoading$.next([]);
    console.log(`[run] ${this.currentUnitSequenceId}`);
    if (this.tcs.testMode.saveResponses) {
      this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
        key: TestStateKey.CURRENT_UNIT_ID, timeStamp: Date.now(), content: this.myUnitDbKey
      }]);
      this.bs.updateUnitState(this.tcs.testId, this.myUnitDbKey, [<StateReportEntry>{
        key: UnitStateKey.PLAYER, timeStamp: Date.now(), content: UnitPlayerState.LOADING
      }]);
    }
    this.tcs.currentUnitDbKey = this.myUnitDbKey;
    this.tcs.currentUnitTitle = this.unitTitle;
    this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();

    this.setPageList([], '');

    this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
    // this.iFrameItemplayer.setAttribute('srcdoc', this.tcs.getPlayer(currentUnit.unitDef.playerId));
    this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
    this.iFrameItemplayer.setAttribute('class', 'unitHost');
    this.iFrameItemplayer.setAttribute('height', String(this.iFrameHostElement.clientHeight - 5));

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
    this.iFrameHostElement.appendChild(this.iFrameItemplayer);
    srcDoc.set(this.iFrameItemplayer, this.tcs.getPlayer(currentUnit.unitDef.playerId));
  }

  // TODO find better places for the following 2 functions, maybe tcs
  private getPlayerConfig(): VeronaPlayerConfig {
    const playerConfig: VeronaPlayerConfig = {
      enabledNavigationTargets: UnithostComponent.getEnabledNavigationTargets(
        this.currentUnitSequenceId,
        this.tcs.minUnitSequenceId,
        this.tcs.maxUnitSequenceId,
        this.tcs.bookletConfig.allow_player_to_terminate_test
      ),
      logPolicy: this.tcs.bookletConfig.logPolicy,
      pagingMode: this.tcs.bookletConfig.pagingMode,
      stateReportPolicy: this.tcs.bookletConfig.stateReportPolicy,
      unitNumber: this.currentUnitSequenceId,
      unitTitle: this.unitTitle,
      unitId: this.myUnitDbKey
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

  setPageList(validPages: string[], currentPage: string): void {
    if ((validPages instanceof Array)) {
      this.knownPages = validPages.length ? validPages : [];
      const newPageList: PageData[] = [];
      if (validPages.length > 1) {
        for (let i = 0; i < validPages.length; i++) {
          if (i === 0) {
            newPageList.push({
              index: -1,
              id: '#previous',
              disabled: validPages[i] === currentPage,
              type: '#previous'
            });
          }

          newPageList.push({
            index: i + 1,
            id: validPages[i],
            disabled: validPages[i] === currentPage,
            type: '#goto'
          });

          if (i === validPages.length - 1) {
            newPageList.push({
              index: -1,
              id: '#next',
              disabled: validPages[i] === currentPage,
              type: '#next'
            });
          }
        }
      }
      this.pageList = newPageList;
    } else if ((this.pageList.length > 1) && (currentPage !== undefined)) {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if (this.pageList[i].type === '#goto') {
          if (this.pageList[i].id === currentPage) {
            this.pageList[i].disabled = true;
            currentPageIndex = i;
          } else {
            this.pageList[i].disabled = false;
          }
        }
      }
      if (currentPageIndex === 1) {
        this.pageList[0].disabled = true;
        this.pageList[this.pageList.length - 1].disabled = false;
      } else {
        this.pageList[0].disabled = false;
        this.pageList[this.pageList.length - 1].disabled = currentPageIndex === this.pageList.length - 2;
      }
    }
    this.showPageNav = this.pageList.length > 0;
  }

  gotoPage(action: string, index = 0): void {
    let nextPageId = '';
    // currentpage is detected by disabled-attribute of page
    if (action === '#next') {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if ((this.pageList[i].index > 0) && (this.pageList[i].disabled)) {
          currentPageIndex = i;
          break;
        }
      }
      if ((currentPageIndex > 0) && (currentPageIndex < this.pageList.length - 2)) {
        nextPageId = this.pageList[currentPageIndex + 1].id;
      }
    } else if (action === '#previous') {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if ((this.pageList[i].index > 0) && (this.pageList[i].disabled)) {
          currentPageIndex = i;
          break;
        }
      }
      if (currentPageIndex > 1) {
        nextPageId = this.pageList[currentPageIndex - 1].id;
      }
    } else if (action === '#goto') {
      if ((index > 0) && (index < this.pageList.length - 1)) {
        nextPageId = this.pageList[index].id;
      }
    } else if (index === 0) {
      // call from player
      nextPageId = action;
    }

    if (nextPageId.length > 0 && typeof this.postMessageTarget !== 'undefined') {
      this.postMessageTarget.postMessage({
        type: 'vopPageNavigationCommand',
        sessionId: this.itemplayerSessionId,
        target: nextPageId
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
