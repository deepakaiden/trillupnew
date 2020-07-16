import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const url="http://localhost:3000/user/";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  register(formdata):Observable<any>{
    return this.http.post(url + 'register', formdata);
  }
  signin(formdata){
    return this.http.post<any>(url + 'login',formdata);
  }
  
}
