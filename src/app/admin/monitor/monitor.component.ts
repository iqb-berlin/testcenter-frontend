import { BackendService, BookletlistResponseData, ServerError, RegisteredTestTakersResponseData, TotalBookletsResponseData, TotalUnitsResponseData, DetailedTestTakerResponseData, DetailedBookletResponseData, DetailedUnitResponseData } from './../backend/backend.service';
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
  private testTakerData: DetailedTestTakerResponseData[];
  private bookletData: DetailedBookletResponseData[];
  private unitData: DetailedUnitResponseData[];
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

      let observableResponse = this.bs.getTotalBooklets(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());
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

      let observableResponse = this.bs.getDetailedTestTakers(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());
      observableResponse.subscribe(
        
        (dataresponse: DetailedTestTakerResponseData[])=> {
          
          this.testTakerData = dataresponse;
        },
        
        (err: ServerError) => {
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        } 
      );
    });
  }

  detailedBooklets() {
    this.mds.workspaceId$.subscribe(ws => {

      let observableResponse = this.bs.getDetailedBooklets(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());
      observableResponse.subscribe(
        
        (dataresponse: DetailedBookletResponseData[])=> {
          
          this.bookletData = dataresponse;
        },
        
        (err: ServerError) => {
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        } 
      );
    });
  }

  detailedUnits() {
    this.mds.workspaceId$.subscribe(ws => {

      let observableResponse = this.bs.getDetailedUnits(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());
      observableResponse.subscribe(
        
        (dataresponse: DetailedUnitResponseData[])=> {
          
          this.unitData = dataresponse;
        },
        
        (err: ServerError) => {
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        } 
      );
    });
  }
}
