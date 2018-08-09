import { BackendService, BookletlistResponseData, ServerError, RegisteredTestTakersResponseData, TotalBookletsResponseData, TotalUnitsResponseData, DetailedTestTakerResponseData, DetailedBookletResponseData, InnerBookletInfo, InnerUnitInfo } from './../backend/backend.service';
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
  private testTakerData: string[] = [];
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
    

    // 'this' means something here
    let doSomething = (newValue: any) => {
      // 'this' means the same thing here
      console.log('Either token or workspace has a new value');
      console.log('latest value of admin token' + this.mds.adminToken$.getValue());
      console.log('latest value of workspace id' + this.mds.workspaceId$.getValue());
      if (this.mds.adminToken$.getValue() != '' && this.mds.workspaceId$.getValue()>0 ) {
        // the last values of admintoken and workspace id are both available to use here        

        this.showTestTakersRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());
        
        this.showBookletsRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());

        this.showUnitsRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());

        this.detailedTestTakersRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());

        this.detailedBookletsRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());

        this.detailedUnitsRequest(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue());

      }
      
    }
      this.mds.workspaceId$.subscribe(doSomething);
      this.mds.adminToken$.subscribe(doSomething);

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
          this.testTakerData = dataresponse.loginNames;
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
          console.log(dataresponse);
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
