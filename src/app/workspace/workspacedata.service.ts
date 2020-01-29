import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { ServerError } from 'iqb-components';

@Injectable({
  providedIn: "root"
})

export class WorkspaceDataService {
  public workspaceId$ = new BehaviorSubject<number>(-1);
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null);

  public get ws() : number {
    return this.workspaceId$.getValue();
  }
  private _wsRole = '';
  public get wsRole() : string {
    return this._wsRole;
  }
  private _wsName = '';
  public get wsName() : string {
    return this._wsName;
  }
  public navLinks = [];

  // .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. ..
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

  setNewErrorMsg(err: ServerError = null) {
    this.globalErrorMsg$.next(err);
  }

  setWorkspace(newId: number, newRole: string, newName: string) {
    this._wsName = newName;
    this._wsRole = newRole;
    switch (newRole.toUpperCase()) {
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
