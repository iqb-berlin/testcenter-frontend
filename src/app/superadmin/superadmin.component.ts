import { Component } from '@angular/core';


@Component({
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperadminComponent {
  public navLinks = [
    {path: 'users', label: 'Users'},
    {path: 'workspaces', label: 'Arbeitsbereiche'}
  ];


  constructor() { }
}
