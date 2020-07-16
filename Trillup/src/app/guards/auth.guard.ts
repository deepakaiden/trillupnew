import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private _router: Router,
    private _jwtHelperService: JwtHelperService,
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      // get token from local storage or state management
      const token = localStorage.getItem("access_token");

      if (token) {
        // decode token to read the payload details
        const decodeToken = this._jwtHelperService.decodeToken(token);
      
        // check if it was decoded successfully, if not the token is not valid, deny access
        if (!decodeToken) {
          console.log("Inavlid Token");
          return false;
        }

        return true;
      }

      this._router.navigate(["home/login"]);
      return false;
  }
}
