import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from "@angular/router";
import {MainDataService} from "./maindata.service";
import {Observable} from "rxjs";

@Injectable()
export class RouteDispatcherActivateGuard implements CanActivate {
  constructor(
    private mds: MainDataService,
    private router: Router
  ) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    if (this.mds.adminToken.length > 0) {
      console.log('as');
      this.router.navigate(['/r/admin-starter']);
    } else if (this.mds.personToken.length > 0) {
      console.log('ts');
      this.router.navigate(['/r/test-starter']);
    } else if (this.mds.loginToken.length > 0) {
      console.log('ci');
      this.router.navigate(['/r/code-input']);
    } else {
      console.log('login');
      this.router.navigate(['/r/login', '']);
    }
    return false;
  }
}

