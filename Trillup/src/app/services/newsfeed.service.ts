import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const url="http://localhost:3000/newsfeed/";

@Injectable({
  providedIn: 'root'
})
export class NewsfeedService {

    constructor(private http:HttpClient) { }
  
  uploadFiles(model):Observable<any>{
    console.log(model)
    return this.http.post(url+'file-upload',model)
  }
  getUploadfiles(registerform):Observable<any>{
    return this.http.get(url +'uploadfiles')
  }
}
