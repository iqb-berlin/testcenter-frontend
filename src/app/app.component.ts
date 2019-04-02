import { LoginData } from './app.interfaces';
import { BackendService, ServerError } from './backend.service';
import { Component, OnInit } from '@angular/core';
import { MainDataService } from './maindata.service';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit {

  constructor (
    private mds: MainDataService,
    private bs: BackendService) { }

  ngOnInit() {
    const adminToken = localStorage.getItem('at');
    if (adminToken !== null) {
      if (adminToken.length > 0) {
        this.bs.getLoginData(adminToken).subscribe(
          (admindata: LoginData) => {
            this.mds.setNewLoginData(admindata);
          }, (err: ServerError) => {
            this.mds.setNewLoginData();
            console.log(err);
            this.mds.globalErrorMsg$.next(err);
          }
        );
      } else {
        this.mds.setNewLoginData();
      }
    } else {
      this.mds.setNewLoginData();
    }
  }
}
