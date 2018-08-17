import { BackendService, BookletlistResponseData, ServerError, RegisteredTestTakersResponseData, TotalBookletsResponseData, TotalUnitsResponseData, DetailedTestTakerResponseData, DetailedBookletResponseData, InnerBookletInfo, InnerUnitInfo } from './../backend/backend.service';
import { MainDatastoreService } from './../maindatastore.service';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatSnackBar, MatSort } from '@angular/material';

export interface GroupItem {
  name: string;
  number_of_testtakers: number;
  logins: number;
  responses: number;
}

const GROUP_DATA: GroupItem[] = [
  {name: 'Group Hydrogen', number_of_testtakers: 12, logins: 20, responses: 30},
  {name: 'Group Helium', number_of_testtakers: 42, logins:  20, responses: 30},
  {name: 'Group Lithium', number_of_testtakers: 2, logins:  20, responses: 30},
  {name: 'Group Beryllium', number_of_testtakers: 92, logins:  20, responses: 30},
  {name: 'Group Boron', number_of_testtakers: 12, logins: 20, responses: 30},
  {name: 'Group Carbon', number_of_testtakers: 122, logins: 20, responses: 30},
  {name: 'Group Nitrogen', number_of_testtakers: 142, logins: 20, responses: 30},
  {name: 'Group Oxygen', number_of_testtakers: 152, logins: 20, responses: 30},
  {name: 'Group Fluorine', number_of_testtakers: 182, logins: 20, responses: 30},
  {name: 'Group Neon', number_of_testtakers: 202, logins:  20, responses: 30},
];

@Component({
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.css']
})
export class MonitorComponent implements OnInit {
  displayedColumns: string[] = ['name', 'number_of_testtakers', 'logins', 'responses'];
  dataSource = GROUP_DATA;
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
