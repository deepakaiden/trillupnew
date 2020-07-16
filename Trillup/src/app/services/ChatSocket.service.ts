import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { SocketMessage } from '../dto/socketMessage';
import { Subject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class ChatSocketService {

  subject = new Subject<SocketMessage>();
  private url = environment.backendURL;
  private socket;
  constructor(
    private tokenService: TokenService,
  ) {
    this.socket = io(this.url, { query: "userId=" + this.tokenService.currentUserId() });
  }

  public sendMessage(msg: SocketMessage) {
    this.socket.emit('check-message', msg);
  }

  checkNewMessages(): Observable<SocketMessage> {
    return Observable.create((observer) => {
      this.socket.on('check-message', (message) => {
        observer.next(message);
      });
    })
  }

  public setOnlineStatus(socketId, uId) {
    this.socket.emit(socketId, uId);
  }

  public setOfflineStatus(socketId, uId) {
    this.socket.emit(socketId, uId);
  }

  checkOnlineUser(socketId): Observable<Array<string>> {
    return Observable.create((observer) => {
      this.socket.on(socketId, (message) => {
        observer.next(message);
      });
    })
  }

  public sendTokenViaSocket(token, uId) {
    this.socket.emit('push_notification', { token, uId });
  }

  public sendAnySocketMessage(socketId, message) {
    this.socket.emit(socketId, message)
  }

  getAnySocketMessage(socketId): Observable<Array<any>> {
    return Observable.create((observer) => {
      this.socket.on(socketId, (message) => {
        observer.next(message);
      });
    })
  }



}
