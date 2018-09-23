import { BackendService, Authorisation, ServerError, BookletData } from './backend.service';
import { LogindataService } from './../logindata.service';
import { TestControllerService, UnitDef, BookletDef } from './test-controller.service';
import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: './test-controller.component.html',
  styleUrls: ['./test-controller.component.css']
})
export class TestControllerComponent implements OnInit {
  private showUnitComponent = true;
  private allUnits: UnitDef[] = [];
  private currentUnit: UnitDef = null;
  private errorMsg = '';
  private dataLoading = false;

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
    });
    this.lds.globalErrorMsg$.subscribe(m => this.errorMsg = m);
    this.tcs.currentUnit$.subscribe(u => this.currentUnit = u);
  }

  ngOnInit() {
    // both for start and reload situation
    // const auth = this.tcs.authorisation$.getValue();
    this.tcs.authorisation$.subscribe(authori => {
      if (authori !== null) {
        this.loadBooklet(authori);
      }
    });
    // if (auth !== null) {
      // this.loadBooklet(auth);
    // }
  }

  private loadBooklet(auth: Authorisation) {
    this.dataLoading = true;
    this.bs.getBookletData(auth).subscribe(myData => {
      if (myData instanceof ServerError) {
        const e = myData as ServerError;
        this.lds.globalErrorMsg$.next(e.code.toString() + ': ' + e.label);
        this.tcs.booklet$.next(null);
      } else {
        this.lds.globalErrorMsg$.next('');
        const myBookletData = myData as BookletData;
        const myBookletDef = new BookletDef(myBookletData);
        myBookletDef.loadUnits(this.bs, auth).subscribe(okList => {
          this.dataLoading = false;
          this.tcs.booklet$.next(myBookletDef);
          this.tcs.goToUnitByPosition(myBookletData.u);
        });
      }
    });
  }
}
