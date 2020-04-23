import {Component} from '@angular/core';

@Component({
  template: `<div class="root-frame">
                <router-outlet></router-outlet>
              </div>
              `,
  styleUrls: ['./app-root.component.css']
})
export class AppRootComponent {
}
