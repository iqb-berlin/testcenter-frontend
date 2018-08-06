import { BackendService, BookletlistResponseData, ServerError, RegisteredTestTakersResponseData, TotalBookletsResponseData, TotalUnitsResponseData } from './../backend/backend.service';
import { MainDatastoreService } from './../maindatastore.service';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatSnackBar, MatSort } from '@angular/material';

@Component({
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.css']
})
export class MonitorComponent implements OnInit {
  private isAdmin = false;
  private currentlyRegisteredTestTakers = 0;
  private numberofBooklets = 0;
  private numberofUnits = 0;
  private booklets:  BookletlistResponseData[];


  @ViewChild(MatSort) sort: MatSort;

  // Methods
  constructor(@Inject('SERVER_URL') private serverUrl: string,
    private bs: BackendService,
    private mds: MainDatastoreService,
    public snackBar: MatSnackBar
  ) {
    this.booklets = [];
    this.mds.isAdmin$.subscribe(
      i => this.isAdmin = i);
  }

  ngOnInit() {
    this.mds.workspaceId$.subscribe(ws => {
      
      let adminToken = this.mds.adminToken$.getValue();
      let workspaceId = this.mds.workspaceId$.getValue();

      let observableResponse = this.bs.getRegisteredTestTakers(adminToken, workspaceId);
      observableResponse.subscribe(
        
        (dataresponse: RegisteredTestTakersResponseData)=> {
          
          this.currentlyRegisteredTestTakers = dataresponse.howManyUsers;
        
        },
        
        (err: ServerError) => {
        
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        
        } 
      );
    });

    this.mds.workspaceId$.subscribe(ws => {
      
      let adminToken = this.mds.adminToken$.getValue();
      let workspaceId = this.mds.workspaceId$.getValue();

      let observableResponse = this.bs.getTotalBooklets(adminToken, workspaceId);
      observableResponse.subscribe(
        
        (dataresponse: TotalBookletsResponseData)=> {
          
          this.numberofBooklets = dataresponse.howManyBooklets;
        
        },
        
        (err: ServerError) => {
        
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        
        } 
      );
    });

    this.mds.workspaceId$.subscribe(ws => {
      
      let adminToken = this.mds.adminToken$.getValue();
      let workspaceId = this.mds.workspaceId$.getValue();

      let observableResponse = this.bs.getTotalUnits(adminToken, workspaceId);
      observableResponse.subscribe(
        
        (dataresponse: TotalUnitsResponseData)=> {
          
          this.numberofUnits = dataresponse.howManyUnits;
        
        },
        
        (err: ServerError) => {
        
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        
        } 
      );
    });
    
  }

  // ***********************************************************************************
  // updateBookletList() {
  //   if (this.isAdmin) {
  //     const myWorkspaceId = this.mds.workspaceId$.getValue();
  //     if (myWorkspaceId < 0) {
  //       this.booklets = [];
  //     } else {
  //       this.bs.getBookletlist(this.mds.adminToken$.getValue(), myWorkspaceId).subscribe(
  //         (dataresponse: BookletlistResponseData[]) => {
  //           this.booklets = dataresponse;
  //         }, (err: ServerError) => {
  //           this.mds.updateAdminStatus('', '', [], false, err.label);
  //         }
  //       );
  //     }
  //   } else {
  //     this.booklets = [];
  //   }
  // }

}
