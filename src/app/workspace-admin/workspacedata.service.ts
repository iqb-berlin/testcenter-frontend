import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

@Injectable()
export class WorkspaceDataService {
  public wsId: string;
  public wsRole = 'RW';
  public wsName = '';
}
