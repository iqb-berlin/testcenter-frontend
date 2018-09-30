import { ServerError } from './../backend.service';
import { BackendService, BookletData } from './backend.service';

import { LogindataService } from './../logindata.service';
import { TestControllerService, UnitDef, BookletDef } from './test-controller.service';
import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: './test-controller.component.html',
  styleUrls: ['./test-controller.component.css']
})
export class TestControllerComponent implements OnInit {
  private showUnitComponent = false;
  private allUnits: UnitDef[] = [];
  private statusMsg = '';
  private dataLoading = false;
  private myLastAuthString = ''; // to avoid double load

  constructor (
    private tcs: TestControllerService,
    private bs: BackendService,
    private lds: LogindataService
  ) {
    this.tcs.booklet$.subscribe(b => {
      if (b === null) {
        this.allUnits = [];
      } else {
        this.allUnits = b.units;
      }
      this.updateStatus();
    });
    this.tcs.currentUnitPos$.subscribe(u => this.updateStatus());
  }

  ngOnInit() {
    this.loadBooklet('init');
    this.lds.authorisation$.subscribe(authori => {
      this.loadBooklet('subsc');
    });
  }

  private loadBooklet(s: string) {
    const auth = this.lds.authorisation$.getValue();
    if (auth == null) {
      this.resetBookletData();
      this.myLastAuthString = '';
    } else {
      if (this.myLastAuthString === auth.toAuthString()) {
        console.log('not doubling');
      } else {
        this.myLastAuthString = auth.toAuthString();

        console.log('load booklet ' + auth.toAuthString() + ' ' + s);
        this.dataLoading = true;
        this.bs.getBookletData(auth).subscribe(myData => {
          if (myData instanceof ServerError) {
            const e = myData as ServerError;
            this.lds.globalErrorMsg$.next(e);
            this.tcs.booklet$.next(null);
            this.tcs.currentUnitPos$.next(-1);
          } else {
            this.lds.globalErrorMsg$.next(null);
            const myBookletData = myData as BookletData;
            const myBookletDef = new BookletDef(myBookletData);
            myBookletDef.loadUnits(this.bs, this.tcs, auth).subscribe(okList => {
              this.dataLoading = false;
              this.tcs.booklet$.next(myBookletDef);
              this.tcs.showNaviButtons$.next(myBookletDef.unlockedUnitCount() > 1);
              this.tcs.currentUnitPos$.next(-1);
              this.tcs.goToUnitByPosition(myBookletData.u);
            });
          }
        });
      }
    }
  }

  private resetBookletData() {
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
  }

  private updateStatus() {
    const cu = this.tcs.currentUnitPos$.getValue();
    if (cu >= 0) {
      this.statusMsg = '';
    } else {
      // this.tcs.pageTitle$.next('IQB-Testcenter');

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
}
