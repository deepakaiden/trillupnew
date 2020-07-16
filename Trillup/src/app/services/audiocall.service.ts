import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

const url="http://localhost:3000/audiocall/";

@Injectable({
  providedIn: 'root'
})
export class AudiocallService {

  constructor(
    private http: HttpClient,
    private _jwtHelperService: JwtHelperService
  ) { }
 
  getRegisterUsers(registerform):Observable<any>{
    return this.http.get(url + 'get-Register-users');
  }
  getCurrentUser(userEmail):Observable<any>{
    console.log(userEmail);
    return this.http.post(url + 'get-single-user-details',  { userEmail });
  }
 
  updateUser(registerform):Observable<any>{
    console.log(registerform);
    return this.http.post(url +'update-User', registerform)
  }
  

  public get currentUserEmail(): string {
    try {
      // get token from local storage or state management
      const token = localStorage.getItem("access_token");

      // decode token to read the payload details
      const decodeToken = this._jwtHelperService.decodeToken(token);
      return decodeToken.userEmail;
    } catch(error){
      console.log(error);
    }
  }
}
