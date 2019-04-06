import { BehaviorSubject } from 'rxjs';
import { LoginData } from './app.interfaces';
import { Injectable } from '@angular/core';
import { ServerError } from './backend.service';

@Injectable({
  providedIn: 'root'
})
export class MainDataService {
  private static defaultLoginData: LoginData = {
    admintoken: '',
    name: '',
    workspaces: [],
    is_superadmin: false
  };

  public get adminToken() : string {
    const myLoginData = this.loginData$.getValue();
    if (myLoginData) {
      return myLoginData.admintoken;
    } else {
      return '';
    }
  }


  public loginData$ = new BehaviorSubject<LoginData>(MainDataService.defaultLoginData);
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null);


  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  setNewLoginData(logindata?: LoginData) {
    const myLoginData: LoginData = {
      admintoken: MainDataService.defaultLoginData.admintoken,
      name: MainDataService.defaultLoginData.name,
      workspaces: MainDataService.defaultLoginData.workspaces,
      is_superadmin: MainDataService.defaultLoginData.is_superadmin
    };

    if (logindata) {
      if (
        (logindata.admintoken.length > 0) &&
        (logindata.name.length > 0) &&
        (logindata.workspaces.length > 0)) {
          myLoginData.admintoken = logindata.admintoken;
          myLoginData.name = logindata.name;
          myLoginData.workspaces = logindata.workspaces;
          myLoginData.is_superadmin = logindata.is_superadmin;
      }
    }
    this.loginData$.next(myLoginData);
    localStorage.setItem('at', myLoginData.admintoken);
  }

  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  setNewErrorMsg(err: ServerError = null) {
    this.globalErrorMsg$.next(err);
  }

  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  getWorkspaceName(ws: number): string {
    let myreturn = '';
    const myLoginData = this.loginData$.getValue();
    if ((myLoginData !== null) && (myLoginData.workspaces.length > 0)) {
      for (let i = 0; i < myLoginData.workspaces.length; i++) {
        if (myLoginData.workspaces[i].id == ws) {
          myreturn = myLoginData.workspaces[i].name;
          break;
        }
      }
    }
    return myreturn;
  }

  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  getWorkspaceRole(ws: number): string {
    let myreturn = '';
    const myLoginData = this.loginData$.getValue();
    if ((myLoginData !== null) && (myLoginData.workspaces.length > 0)) {
      for (let i = 0; i < myLoginData.workspaces.length; i++) {
        if (myLoginData.workspaces[i].id == ws) {
          myreturn = myLoginData.workspaces[i].role;
          break;
        }
      }
    }
    return myreturn;
  }
}
