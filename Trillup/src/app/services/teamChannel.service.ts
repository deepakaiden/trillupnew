import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class TeamChannelService {

  backendURL = environment.backendURL || 'https://localhost:3000/';
  readonly ChannelFileUploadPath = `${environment.backendURL}upload/userfile/`;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  getTeamChannelUser(cId) {
    return this.http.get(`${this.backendURL}teamChannel/getTeamChannelUser/${cId}`, this.tokenService.getToken());
  }

  getChannelById(cId, uId) {
    return this.http.get(`${this.backendURL}teamChannel/getChannelById/${cId}/${uId}`, this.tokenService.getToken());
  }

  getResgiterUserForTeamUserListing(cId) {
    return this.http.get(`${this.backendURL}teamChannel/getResgiterUserForTeamUserListing/${cId}`, this.tokenService.getToken());
  }

  getCurrentUserTeamChannelDetail(cId, uId) {
    return this.http.get(`${this.backendURL}teamChannel/getCurrentUserTeamChannelDetail/${cId}/${uId}`, this.tokenService.getToken());
  }

  addUserIntoTeamChannel(data) {
    return this.http.post(`${this.backendURL}teamChannel/addUserIntoTeamChannel`, data, this.tokenService.getToken());
  }

  sendUserRequest(data) {
    return this.http.post(`${this.backendURL}teamChannel/sendUserRequest`, data, this.tokenService.getToken());
  }

  sendGuestUserRequest(data) {
    return this.http.post(`${this.backendURL}teamChannel/sendGuestUserRequest`, data, this.tokenService.getToken());
  }

  deleteUserIntoTeamChannel(data) {
    return this.http.post(`${this.backendURL}teamChannel/deleteUserIntoTeamChannel`, data, this.tokenService.getToken());
  }

  changeUserType(data) {
    return this.http.post(`${this.backendURL}teamChannel/changeUserType`, data, this.tokenService.getToken());
  }

  getChannelMessages(data) {
    return this.http.post(`${this.backendURL}teamChannel/getChannelMessages`, data, this.tokenService.getToken());
  }

  sendChannelMessage(data) {
    return this.http.post(`${this.backendURL}teamChannel/sendChannelMessage`, data, this.tokenService.getToken());
  }

  onUploadFile(data) {
    return this.http.post(`${this.backendURL}teamChannel/uploadFile`, data, this.tokenService.getToken());
  }

  updateChannel(data) {
    return this.http.post(`${this.backendURL}teamChannel/updateChannel`, data, this.tokenService.getToken());
  }

  downloadFile(dbFileName, fileName) {
    saveAs(`${this.ChannelFileUploadPath}${dbFileName}`, fileName);
  }

  acceptRejectUserRequest(data) {
    return this.http.post(`${this.backendURL}teamChannel/acceptRejectUserRequest`, data, this.tokenService.getToken());
  }

  getAllUnreadFileNotification(data) {
    return this.http.post(`${this.backendURL}teamChannel/getAllUnreadFileNotification`, data, this.tokenService.getToken());
  }

  checkGuestEmail(email): Promise<any> {
    return this.http.get(`${this.backendURL}teamChannel/checkGuestEmail/${email}`, this.tokenService.getToken()).toPromise();
  }

  deleteTeamChannel(cId): Promise<any> {
    return this.http.get(`${this.backendURL}teamChannel/deleteTeamChannel/${cId}`, this.tokenService.getToken()).toPromise();
  }
}
