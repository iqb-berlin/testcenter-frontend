import {Component} from '@angular/core';

@Component({
  template: `<div class="root-frame" fxLayout="row wrap" fxLayoutAlign="center stretch">
                <router-outlet></router-outlet>
              </div>
              `,
  styles: ['.root-frame {padding: 80px;}']
})
export class AppRootComponent {
}
