import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DatastoreService {
  public pageTitle$ = new BehaviorSubject('Verwaltung');
  public isSuperadmin$ = new BehaviorSubject(false);

  constructor() { }

  updatePageTitle(newTitle: string) {
    this.pageTitle$.next(newTitle);
  }

  updateIsSuperadmin(newStatus: boolean) {
    this.isSuperadmin$.next(newStatus);
  }
}
