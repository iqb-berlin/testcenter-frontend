import {Component} from '@angular/core';

@Component({
  template: `<div class="root-frame" fxLayout="row wrap" fxLayoutAlign="center stretch">
                <router-outlet></router-outlet>
              </div>
              `,
  styles: ['.root-frame {padding: 80px;}']
})
export class AppRootComponent {
/*
  constructor(
    public mds: MainDataService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const loginData = this.mds.loginData$.getValue();
    if (loginData.adminToken.length > 0) {
      this.router.navigate(['./admin-starter'], {relativeTo: this.route});
    } else if (loginData.loginToken.length > 0) {
      this.router.navigate(['./code-input'], {relativeTo: this.route});
    } else if (loginData.personToken.length > 0) {
      this.router.navigate(['./test-starter'], {relativeTo: this.route});
    } else {
      this.router.navigate(['./login'], {relativeTo: this.route});
    }
  } */
}
