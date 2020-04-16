import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from "@angular/router";
import {MainDataService} from "./maindata.service";
import {Observable} from "rxjs";
import {AuthAccessKeyType, AuthFlagType} from "./app.interfaces";

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

    const authData = MainDataService.getAuthDataFromLocalStorage();
    if (authData) {
      if (authData.token) {
        if (authData.access[AuthAccessKeyType.WORKSPACE_ADMIN] || authData.access[AuthAccessKeyType.SUPER_ADMIN]) {
          this.router.navigate(['/r/admin-starter']);
        } else if (authData.flags.indexOf(AuthFlagType.CODE_REQUIRED) >= 0) {
          this.router.navigate(['/r/code-input']);
        } else if (authData.access[AuthAccessKeyType.TEST]) {
          this.router.navigate(['/r/test-starter']);
        } else {
          this.router.navigate(['/r/login', '']);
        }
      } else {
        this.router.navigate(['/r/login', '']);
      }
    } else {
      this.router.navigate(['/r/login', '']);
    }

    return false;
  }
}

