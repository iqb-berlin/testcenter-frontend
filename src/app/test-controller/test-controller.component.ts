import { MainDataService } from './../maindata.service';
import { ServerError } from '../backend.service';
import { BackendService } from './backend.service';

import { TestControllerService } from './test-controller.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UnitDef, BookletDef } from './test-controller.classes';
import { BookletData } from './test-controller.interfaces';
import { Subscription } from 'rxjs';

@Component({
  templateUrl: './test-controller.component.html',
  styleUrls: ['./test-controller.component.css']
})
export class TestControllerComponent implements OnInit, OnDestroy {
  private loginDataSubscription: Subscription = null;
  private unitPosSubsription: Subscription = null;

  private showUnitComponent = false;
  private allUnits: UnitDef[] = [];
  private statusMsg = '';
  private dataLoading = false;

  constructor (
    private tcs: TestControllerService,
    private bs: BackendService,
    private mds: MainDataService
  ) {
    this.unitPosSubsription = this.tcs.currentUnitPos$.subscribe(u => this.updateStatus());
  }

  ngOnInit() {
    this.loginDataSubscription = this.mds.loginData$.subscribe(loginData => {
      this.tcs.booklet$.next(null);
      this.tcs.currentUnitPos$.next(-1);
      this.tcs.showNaviButtons$.next(false);
      this.tcs.itemplayerValidPages$.next([]);
      this.tcs.itemplayerCurrentPage$.next('');
      this.tcs.nextUnit$.next(-1);
      this.tcs.prevUnit$.next(-1);
      this.tcs.unitRequest$.next(-1);
      this.tcs.canLeaveTest$.next(false);
      this.tcs.itemplayerPageRequest$.next('');
      this.tcs.mode = '';

      if (loginData !== null) {
        this.tcs.mode = loginData.mode;
        if (loginData.booklet > 0) {
          this.dataLoading = true;
          this.bs.getBookletData().subscribe(myData => {
            if (myData instanceof ServerError) {
              const e = myData as ServerError;
              this.mds.globalErrorMsg$.next(e);
              this.tcs.booklet$.next(null);
              this.tcs.currentUnitPos$.next(-1);
            } else {
              this.mds.globalErrorMsg$.next(null);
              const myBookletData = myData as BookletData;
              const myBookletDef = new BookletDef(myBookletData);
              myBookletDef.loadUnits(this.bs, this.tcs, loginData.persontoken, loginData.booklet).subscribe(okList => {
                this.dataLoading = false;
                this.tcs.booklet$.next(myBookletDef);
                this.tcs.showNaviButtons$.next(myBookletDef.unlockedUnitCount() > 1);
                this.tcs.currentUnitPos$.next(myBookletData.u);
                this.tcs.goToUnitByPosition(myBookletData.u);
              });
            }
          });
        }
      }
    });
  }

  private updateStatus() {
    const cu = this.tcs.currentUnitPos$.getValue();
    if (cu >= 0) {
      this.statusMsg = '';
    } else {
      if (this.allUnits.length === 0) {
        this.statusMsg = 'Es stehen keine Informationen über ein gewähltes Testheft zur Verfügung.';
      } else {
        let allLocked = true;
        for (let i = 0; i < this.allUnits.length; i++) {
          if (!this.allUnits[i].locked) {
            allLocked = false;
            break;
          }
        }
        if (allLocked) {
          this.statusMsg = 'Alle Aufgaben sind für die Bearbeitung gesperrt. Der Test kann nicht fortgesetzt werden.';
        } else {
          this.statusMsg = 'Bitte wählen Sie links eine Aufgabe!';
        }
      }
    }
    this.showUnitComponent = this.statusMsg.length === 0;
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.unitPosSubsription !== null) {
      this.unitPosSubsription.unsubscribe();
    }
    if (this.loginDataSubscription !== null) {
      this.loginDataSubscription.unsubscribe();
    }
  }
}
