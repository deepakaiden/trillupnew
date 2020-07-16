import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as jwt_decode from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor(
    private http: HttpClient
  ) { }

  getToken() {
    let token = sessionStorage.getItem("token");
    if (!token) token = localStorage.getItem('access_token');
    let headerToken = new HttpHeaders().set("Authorization", "Bearer " + token);
    const headerObj = { headers: headerToken };
    // console.log('ff',headerObj);
    return headerObj;
  }

  public currentUserId(): string {
    let token = sessionStorage.getItem("token");
    if (!token) token = localStorage.getItem('access_token');
    if (token) {
      let tokenInfo = jwt_decode(token);
      // console.log(tokenInfo);
      return tokenInfo.userId || tokenInfo.uId || null;
    }
    return null;
  }

  public currentUserCompanyId(): string {
    let token = sessionStorage.getItem("token");
    if (!token) token = localStorage.getItem('access_token');
    if (token) {
      let tokenInfo = jwt_decode(token);
      // console.log(tokenInfo);
      return tokenInfo.companyId || null;
    }
    return null;
  }

}
