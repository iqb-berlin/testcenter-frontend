import { BackendService, BookletlistResponseData, ServerError, RegisteredTestTakersResponseData, TotalBookletsResponseData, TotalUnitsResponseData, DetailedTestTakersResponseData, DetailedBookletsResponseData, DetailedUnitsResponseData } from './../backend/backend.service';
import { MainDatastoreService } from './../maindatastore.service';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatSnackBar, MatSort, MatButtonModule } from '@angular/material';

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
  private loginNames: string[];
  private bookletNames: string;
  private unitNames: string;
  private unitIds: string;
  showHide: boolean;


  @ViewChild(MatSort) sort: MatSort;

  // Methods
  constructor(@Inject('SERVER_URL') private serverUrl: string,
    private bs: BackendService,
    private mds: MainDatastoreService,
    public snackBar: MatSnackBar
  ) {
    this.showHide = false;
//   this.booklets = [];
    this.mds.isAdmin$.subscribe(
      i => this.isAdmin = i);
  }

  ngOnInit() {
    
    this.showTestTakers();
    this.showBooklets();
    this.showUnits();
    this.detailedTestTakers();
    this.detailedBooklets();
    this.detailedUnits();

  }

  changeShowStatus(e){
    this.showHide = !this.showHide;
  }

  showTestTakers() {
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
  }

  showBooklets() {
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
  }

  showUnits() {
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

  detailedTestTakers() {
    this.mds.workspaceId$.subscribe(ws => {
      
      let adminToken = this.mds.adminToken$.getValue();
      let workspaceId = this.mds.workspaceId$.getValue();

      let observableResponse = this.bs.getDetailedTestTakers(adminToken, workspaceId);
      observableResponse.subscribe(
        
        (dataresponse: DetailedTestTakersResponseData)=> {
          
          this.loginNames = dataresponse.loginNames;
        },
        
        (err: ServerError) => {
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        } 
      );
    });
  }

  detailedBooklets() {
    this.mds.workspaceId$.subscribe(ws => {
      
      let adminToken = this.mds.adminToken$.getValue();
      let workspaceId = this.mds.workspaceId$.getValue();

      let observableResponse = this.bs.getDetailedBooklets(adminToken, workspaceId);
      observableResponse.subscribe(
        
        (dataresponse: DetailedBookletsResponseData)=> {
          
          this.bookletNames = dataresponse.bookletNames;
        },
        
        (err: ServerError) => {
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        } 
      );
    });
  }

  detailedUnits() {
    this.mds.workspaceId$.subscribe(ws => {
      
      let adminToken = this.mds.adminToken$.getValue();
      let workspaceId = this.mds.workspaceId$.getValue();

      let observableResponse = this.bs.getDetailedTestTakers(adminToken, workspaceId);
      observableResponse.subscribe(
        
        (dataresponse: DetailedUnitsResponseData)=> {
          
          this.unitNames = dataresponse.unitNames;
          this.unitIds = dataresponse.unitIds;
        },
        
        (err: ServerError) => {
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        } 
      );
    });
  }
}
