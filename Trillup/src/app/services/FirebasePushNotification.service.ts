import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { TokenService } from './token.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { ChatSocketService } from './ChatSocket.service';

@Injectable({
  providedIn: 'root'
})
export class FirebasePushNotificationService {


  backendURL = environment.backendURL || 'https://localhost:3000/';
  messaging;
  notificationToken;
  constructor(
    private afm: AngularFireMessaging,
    private tokenService: TokenService,
    private http: HttpClient,
    private chatSocketService: ChatSocketService
  ) { }

  requestPermission(uId) {
    this.afm.requestPermission
      .toPromise()
      .then(() => {
        this.afm.getToken
          .toPromise()
          .then(token => {
            this.notificationToken = token;
            this.chatSocketService.sendTokenViaSocket(token, uId);
          })
      }).catch(() => {
        // console.error("User has block the request");
      })

    // this.afm.onMessage(payLoad => {
    //   // console.log(payLoad, "message");
    // })
  }



}
