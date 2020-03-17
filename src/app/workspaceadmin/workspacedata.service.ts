import { BehaviorSubject } from 'rxjs';
import { Injectable} from '@angular/core';
import { ServerError } from 'iqb-components';
import {MainDataService} from "../maindata.service";

@Injectable({
  providedIn: 'root'
})

@Injectable()
export class WorkspaceDataService {
  public workspaceId$ = new BehaviorSubject<number>(-1);
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null);

  public get ws(): number {
    return this.workspaceId$.getValue();
  }
  private _wsRole = '';
  public get wsRole(): string {
    return this._wsRole;
  }
  private _wsName = '';
  public get wsName(): string {
    return this._wsName;
  }
  public navLinks = [];


  private navLinksRW = [
    {path: 'files', label: 'Dateien'},
    {path: 'syscheck', label: 'System-Check Berichte'},
    {path: 'monitor', label: 'Monitor'},
    {path: 'results', label: 'Ergebnisse'}
  ];
  private navLinksRO = [
    {path: 'files', label: 'Dateien'},
    {path: 'syscheck', label: 'System-Check Berichte'},
    {path: 'monitor', label: 'Monitor'},
    {path: 'results', label: 'Ergebnisse'}
  ];
  private navLinksMO = [
    {path: 'monitor', label: 'Monitor'}
  ];

  constructor(private mds: MainDataService) {}

  setNewErrorMsg(err: ServerError = null) {
    this.globalErrorMsg$.next(err);
  }

  setWorkspace(newId: number) {
    this._wsName = '';
    this._wsRole = '';
    if (newId > 0) {
      const myLoginData = this.mds.loginData$.getValue();
      if ((myLoginData !== null) && (myLoginData.workspaces.length > 0)) {
        for (let i = 0; i < myLoginData.workspaces.length; i++) {
          if (myLoginData.workspaces[i].id == newId) {
            this._wsName = myLoginData.workspaces[i].name;
            this._wsRole = myLoginData.workspaces[i].role;
            break;
          }
        }
      }
    }
    switch (this._wsRole.toUpperCase()) {
      case 'RW': {
        this.navLinks = this.navLinksRW;
        break;
      }
      case 'RO': {
        this.navLinks = this.navLinksRO;
        break;
      }
      case 'MO': {
        this.navLinks = this.navLinksMO;
        break;
      }
      default: {
        this.navLinks = [];
        break;
      }
    }
    this.workspaceId$.next(newId);
  }
}
