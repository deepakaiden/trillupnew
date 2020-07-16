import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class PeerjsService {

  backendURL = environment.backendURL || 'https://localhost:3000/';
  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  getPeerIdByUserId(uId) {
    return this.http.get(`${this.backendURL}peerjsUser/getPeerIdByUserId/${uId}`, this.tokenService.getToken());
  }

  getPeerIdByTeamId(cId, currentUid) {
    return this.http.get(`${this.backendURL}peerjsUser/getPeerIdByTeamId/${cId}/${currentUid}`, this.tokenService.getToken());
  }

  getSenderPeerIdByTeamChannelId(cId) {
    return this.http.get(`${this.backendURL}peerjsUser/getSenderPeerIdByTeamChannelId/${cId}`, this.tokenService.getToken());
  }

}
