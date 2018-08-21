import { BackendService, BookletlistResponseData, ServerError, RegisteredTestTakersResponseData, TotalBookletsResponseData, TotalUnitsResponseData, DetailedTestTakerResponseData, DetailedBookletResponseData, InnerBookletInfo, InnerUnitInfo, GroupResponse } from './../backend/backend.service';
import { MainDatastoreService } from './../maindatastore.service';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatSnackBar, MatSort, MatTableDataSource, MatSortModule } from '@angular/material';


@Component({
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.css']
})
export class MonitorComponent implements OnInit {
  displayedColumns: string[] = ['name', 'testsTotal', 'testsStarted', 'responsesGiven'];
  private groupStats = new MatTableDataSource<GroupResponse>([]);
  private isAdmin = false;
  private currentlyRegisteredTestTakers = 0;
  private numberofBooklets = 0;
  private numberofUnits = 0;
  private booklets:  BookletlistResponseData[];
  private testTakerData: DetailedTestTakerResponseData = {"loginNames": []};
  private bookletData: InnerBookletInfo[] = [];
  private unitData: InnerUnitInfo[] = [];
  showHide1: boolean;
  showHide2: boolean;
  showHide3: boolean;


  @ViewChild(MatSort) sort: MatSort;

  // Methods
  constructor(@Inject('SERVER_URL') private serverUrl: string,
    private bs: BackendService,
    private mds: MainDatastoreService,
    public snackBar: MatSnackBar
  ) {
    this.showHide1 = false;
    this.showHide2 = false;
    this.showHide3 = false;
//   this.booklets = [];
    this.mds.isAdmin$.subscribe(
      i => this.isAdmin = i);
  }

  ngOnInit() {
    this.mds.adminToken$.subscribe(at => this.updateStats());
    this.mds.workspaceId$.subscribe(ws => this.updateStats());
/*
    // 'this' means something here
    let doSomething = (newValue: any) => {
      // 'this' means the same thing here
      if (this.mds.adminToken$.getValue() != '' && this.mds.workspaceId$.getValue()>0 ) {
        // the last values of admintoken and workspace id are both available to use here        

        this.showTestTakersRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());
        this.showBookletsRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());
        this.showUnitsRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());
        this.detailedTestTakersRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());
        this.detailedBookletsRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());
        this.detailedUnitsRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());
        
        this.showStats(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue()); // this is done by me
      }
      
    }
      this.mds.workspaceId$.subscribe(doSomething);
      this.mds.adminToken$.subscribe(doSomething);
*/
  }

  updateStats() {
    this.bs.showStats(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue()).subscribe(
      (responseData: GroupResponse[]) => {
        this.groupStats = new MatTableDataSource<GroupResponse>(responseData);
        this.groupStats.sort = this.sort;
      }
    )

  }

  showTestTakersRequest(adminToken: string, workspaceId: number) {
            let observableResponse = this.bs.getRegisteredTestTakers(adminToken, workspaceId);
        observableResponse.subscribe(
          
          (dataresponse: RegisteredTestTakersResponseData)=> {
            
            this.currentlyRegisteredTestTakers = dataresponse.howManyUsers;
          
          },
          
          (err: ServerError) => {
            // this.mds.updateAdminStatus('', '', [], false, err.label);
          } 
        ); 
  }



  showBookletsRequest(adminToken: string, workspaceId: number) {


      let observableResponse = this.bs.getTotalBooklets(adminToken, workspaceId);
      observableResponse.subscribe(
        
        (dataresponse: TotalBookletsResponseData)=> {
          
          this.numberofBooklets = dataresponse.howManyBooklets;
        
        },
        
        (err: ServerError) => {
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        } 
      );
  }

  showUnitsRequest(adminToken: string, workspaceId: number) {


      let observableResponse = this.bs.getTotalUnits(adminToken, workspaceId);
      observableResponse.subscribe(
        
        (dataresponse: TotalUnitsResponseData)=> {
          
          this.numberofUnits = dataresponse.howManyUnits;
        
        },
        
        (err: ServerError) => {
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        } 
      );
  }

  detailedTestTakersRequest(adminToken: string, workspaceId: number) {
   

      let observableResponse = this.bs.getDetailedTestTakers(adminToken, workspaceId);
      observableResponse.subscribe(
        
        (dataresponse: DetailedTestTakerResponseData)=> {
          this.testTakerData = dataresponse;
        },
        
        (err: ServerError) => {
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        } 
      );

  }

  detailedBookletsRequest(adminToken: string, workspaceId: number) {


      let observableResponse = this.bs.getDetailedBooklets(adminToken, workspaceId);
      observableResponse.subscribe(
        
        (dataresponse: DetailedBookletResponseData)=> {
          this.bookletData = dataresponse.bookletNames;
        },
        
        (err: ServerError) => {
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        } 
      );

  }

  detailedUnitsRequest(adminToken: string, workspaceId: number) {


      let observableResponse = this.bs.getDetailedUnits(adminToken, workspaceId);
      observableResponse.subscribe(
        
        (dataresponse: InnerUnitInfo[])=> {

          this.unitData = dataresponse;

          
        },
        
        (err: ServerError) => {
          // this.mds.updateAdminStatus('', '', [], false, err.label);
        } 
      );

  }

 
}
