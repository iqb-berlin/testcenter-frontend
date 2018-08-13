import { Component } from '@angular/core';

@Component({
  template: `<router-outlet></router-outlet>`,
  styles: ['#testcontroller-main > ng-component:last-child { width: 100%;}']
})
export class TestControllerComponent { }
