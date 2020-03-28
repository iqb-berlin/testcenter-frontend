import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

@Injectable()
export class WorkspaceDataService {
  public wsId = '';
  public wsRole = 'RW';
  public wsName = '';

  public navLinks = [
    {path: 'files', label: 'Dateien'},
    {path: 'syscheck', label: 'System-Check Berichte'},
    {path: 'results', label: 'Ergebnisse/Antworten'}
  ];
}
