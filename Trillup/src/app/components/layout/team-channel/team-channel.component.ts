import { Component, OnInit, ViewChild } from '@angular/core';
import { DropzoneConfigInterface, DropzoneComponent, DropzoneDirective } from 'ngx-dropzone-wrapper';
import { environment } from 'src/environments/environment';
import { TokenService } from 'src/app/services/token.service';
import { TeamChannelService } from 'src/app/services/teamChannel.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrManager } from 'ng6-toastr-notifications';
import { ChatSocketService } from 'src/app/services/ChatSocket.service';
import { FirebasePushNotificationService } from 'src/app/services/FirebasePushNotification.service';
import { PeerjsService } from 'src/app/services/Peerjs.service';
import { NgForm } from '@angular/forms';
declare var Peer: any;

@Component({
  selector: 'app-team-channel',
  templateUrl: './team-channel.component.html',
  styleUrls: ['./team-channel.component.css']
})
export class TeamChannelComponent implements OnInit {
  public type: string = 'component';

  public disabled: boolean = false;
  p;

  public config: DropzoneConfigInterface = {
    clickable: true,
    maxFiles: 1,
    autoReset: null,
    errorReset: null,
    cancelReset: null,
    url: environment.backendFileUploadURL
  };

  @ViewChild(DropzoneComponent, { static: false }) componentRef?: DropzoneComponent;
  @ViewChild(DropzoneDirective, { static: false }) directiveRef?: DropzoneDirective;

  selectedChannel: any;
  teamUserList = [];
  registerUserList = [];
  defaultRegisterUserList = [];
  cId;
  currentUid;
  currentUserChannelData;
  searchTeamListAddUser;
  regUserPage;
  channelMessage: string;
  channelMessageList = [];
  channelFileMessageList = [];
  selectedFile: File = null;
  scrollLimit: number = 10;
  scrollSkip: number = 0;
  defaultScrollSkip: number = 0;
  scrollFileLimit: number = 3;
  scrollFileSkip: number = 0;
  defaultScrollFileSkip: number = 0;
  teamUserStatus = [];
  fileUpload: boolean = false;
  contentPattern = new RegExp("^.{0}[#]");
  emailPattern = new RegExp(/^([!#-\'*+\/-9=?A-Z^-~\\\\-]{1,64}(\.[!#-\'*+\/-9=?A-Z^-~\\\\-]{1,64})*|"([\]!#-[^-~\ \t\@\\\\]|(\\[\t\ -~]))+")@([0-9A-Z]([0-9A-Z-]{0,61}[0-9A-Za-z])?(\.[0-9A-Z]([0-9A-Z-]{0,61}[0-9A-Za-z])?))+$/i);
  guestInviteEmail: string;
  chnType: string;
  permissionType: boolean = true;
  peer;
  peerId;
  isStartScreenSharingOn: boolean = true;
  isStopScreenSharingOn: boolean = false;
  isJoinScreenSharingOn: boolean = false;
  isStopJoinScreenSharingOn: boolean = false;
  isUserJoinedScreenSharing: boolean = false;
  receiverPeerIdArr: any = [];
  senderMediaStream;
  recieverMediaStream;
  mediaConnectionArr = [];

  constructor(
    private tokenService: TokenService,
    public teamChannelService: TeamChannelService,
    private activatedRoute: ActivatedRoute,
    private toaster: ToastrManager,
    private chatSocketService: ChatSocketService,
    private firebasePushNotificationService: FirebasePushNotificationService,
    private router: Router,
    private peerjsService: PeerjsService
  ) {
    this.regUserPage = 1;
  }

  ngOnDestroy(): void {
    this.peer ? this.peer.disconnect() : '';
  }

  ngOnInit() {
    // this.activatedRoute.params.subscribe(async (param) => {
    //   // console.log(param);
    //   try {
    this.cId = 3;
    this.currentUid = this.tokenService.currentUserId();

    // firebase fcm push notification permission
    this.firebasePushNotificationService.requestPermission(this.currentUid);

    this.getChannelById();
    this.getUserList();
    this.getResgiterUserForTeamUserListing();
    this.getChannelMessages();
    this.getChannelFileMessages();
    this.chatSocketService.checkNewMessages()
      .subscribe((message) => {
        console.log(message);
        if (message.type == 'file') {
          this.getSingleChannelFileMessages();
        } else {
          this.getSingleChannelMessages();
        }
      })
    this.chatSocketService.getAnySocketMessage('change_team_channel_screen_sharing_status')
      .subscribe((message: any) => {
        if (message.status == 0) {
          this.isJoinScreenSharingOn = false;
          this.isStartScreenSharingOn = true;
          this.isUserJoinedScreenSharing = false;
          this.isStopJoinScreenSharingOn = false;
          this.clearMediaStream(this.recieverMediaStream);
        }
      })
    // } catch (error) {
    //   // console.error("Error Catch here")
    // }
    // })

  }

  ngAfterViewInit(): void {
    this.initializePeerConnection();
  }

  initializePeerConnection() {
    this.currentUid = this.tokenService.currentUserId();

    this.peerjsService.getPeerIdByUserId(this.currentUid)
      .subscribe((userIdResult: Array<any>) => {
        // console.log(userIdResult, "userId result");
        if (userIdResult.length > 0) {
          this.createPeerConnection(userIdResult[0].peerId)
        } else {
          this.createPeerConnection('')
        }
      })
  }

  createPeerConnection(peerId) {
    let peerConfig: any = {};
    peerConfig.host = environment.host;
    environment.host == 'localhost' ? peerConfig.port = '3000' : ''
    peerConfig.path = '/peerjs';
    peerConfig.debug = false;
    this.peer = new Peer(peerId, peerConfig);
    this.peer.on('open', (id) => {
      this.peerId = id;
      this.chatSocketService.sendAnySocketMessage('upsert_peerjs_id', {
        uId: this.currentUid,
        peerId: this.peerId
      })
      // console.log(this.peerId);
    })
    this.peer.on('error', function (err) {
      // console.error('' + err)
    })

    this.peer.on('call', async (call) => {
      this.isStartScreenSharingOn = false;
      this.isJoinScreenSharingOn = true;
      this.chatSocketService.getAnySocketMessage('accept_team_channel_call')
        .subscribe((data: any) => {
          // console.log(data, "after rejoin the screen sharing");
          if (data.uId == this.currentUid && data.accept) {
            navigator.getUserMedia({ video: false, audio: true }, (stream) => {
              this.recieverMediaStream = stream;
              call.answer(stream);
              call.on('stream', (remoteStream) => {
                let newWindow = window.open(`/screen-sharing-video`, '_blank');
                newWindow.onload = function () {
                  setTimeout(() => {
                    let videoEle: any = newWindow.document.getElementById('screen-sharing-team');
                    videoEle.srcObject = remoteStream;
                    videoEle.load();
                    videoEle.play();
                  }, 1000);
                }
                if (window.focus) {
                  newWindow.focus();
                }
              })
            }, (err) => {
              // console.log(err);
            });
          }
        })
    })
  }

  async onStartShareScreen() {
    try {
      this.receiverPeerIdArr = await this.getPeerIdForTeamUser();
      if (this.receiverPeerIdArr.length > 0) {
        const mediaDevices = navigator.mediaDevices as any;
        this.senderMediaStream = await mediaDevices.getDisplayMedia({ video: true, audio: true });

        this.senderMediaStream.oninactive = () => { // Click on browser UI stop sharing button
          // console.log("click on stop sharing button")
          this.onStopShareScreen();
        };

        this.chatSocketService.sendAnySocketMessage('change_team_channel_screen_sharing_status', {
          uId: this.currentUid,
          status: '1'
        });
        this.isStartScreenSharingOn = false;
        this.isStopScreenSharingOn = true;
        this.receiverPeerIdArr.forEach(peerIdObj => {
          // console.log(peerIdObj.peerId, "peer id");
          let mediaConnection = this.peer.call(peerIdObj.peerId, this.senderMediaStream);
          this.mediaConnectionArr.push(mediaConnection);
        });
        this.peer.on('disconnected', () => {
          this.chatSocketService.sendAnySocketMessage('change_team_channel_screen_sharing_status', {
            uId: this.currentUid,
            status: '0'
          });
        })
      } else {
        console.log("no one is sharing the screen");
      }
    } catch (error) {
      // console.error(error);
    }
  }

  async onStopShareScreen() {
    // console.log(this.senderMediaStream, "media connection arr");
    this.clearMediaStream(this.senderMediaStream);
    this.peer ? this.peer.disconnect() : '';
    this.initializePeerConnection();
    this.isStartScreenSharingOn = true;
    this.isStopScreenSharingOn = false;
    this.isStopJoinScreenSharingOn = false;
    this.chatSocketService.sendAnySocketMessage('change_team_channel_screen_sharing_status', {
      uId: this.currentUid,
      status: '0'
    });
    // console.log(this.mediaConnectionArr, "media connection arr");
  }

  clearMediaStream(mediaStrem) {
    mediaStrem ? mediaStrem.getTracks().forEach(track => {
      track.stop();
    }) : '';
  }

  getPeerIdForTeamUser() {
    return this.peerjsService.getPeerIdByTeamId(this.cId, this.currentUid)
      .toPromise();
  }

  async onJoinShareScreen() {
    this.isUserJoinedScreenSharing = true;
    this.isJoinScreenSharingOn = false;
    this.isStopJoinScreenSharingOn = true;
    this.chatSocketService.sendAnySocketMessage('accept_team_channel_call', {
      uId: this.currentUid,
      accept: true
    })
  }

  async onStopJoinShareScreen() {
    this.isUserJoinedScreenSharing = false;
    this.isJoinScreenSharingOn = true;
    this.isStopJoinScreenSharingOn = false;
    this.chatSocketService.sendAnySocketMessage('accept_team_channel_call', {
      uId: this.currentUid,
      accept: false
    });
    this.clearMediaStream(this.recieverMediaStream);
  }

  checkValidContentName(formData) {
    if (this.selectedChannel.content != '') {
      if (!this.contentPattern.test(this.selectedChannel.content)) {
        formData.form.controls.content.setErrors({ pattern: true });
      } else {
        formData.form.controls.content.setErrors(null);
      }
    }
  }

  //on File selected event get
  public toggleAutoReset(): void {
    this.config.autoReset = this.config.autoReset ? null : 5000;
    this.config.errorReset = this.config.errorReset ? null : 5000;
    this.config.cancelReset = this.config.cancelReset ? null : 5000;
  }

  public toggleClickAction(): void {
    this.config.clickable = !this.config.clickable;
  }

  public resetDropzoneUploads(): void {
    this.componentRef.directiveRef.reset();
    this.selectedFile = null;
  }

  public onUploadInit(args: any): void {
    // console.log('onUploadInit:', args);
  }

  public onUploadError(args: any): void {
    // console.log('onUploadError:', args);
  }

  public onUploadSuccess(args: any): void {
    // console.log('onUploadSuccess:', args);
    this.fileUpload = false;
    this.selectedFile = args[0];
  }

  //SIMPLE FILE UPLOAD
  // onFileSelected(event) {
  //   this.selectedFile = <File>event.target.files[0];
  // }

  //File on upload
  onUpload() {
    if (this.selectedFile == null) {
      this.fileUpload = true;
    } else {
      const fd = new FormData();
      const otherData = {
        "uId": this.currentUid,
        "cId": this.cId
      }
      fd.append('userFile', this.selectedFile, this.selectedFile.name);
      fd.append("otherData", JSON.stringify(otherData));

      this.teamChannelService.onUploadFile(fd)
        .subscribe(
          data => {
            // console.log(data)
            this.toaster.successToastr('File is uploaded successfully');
            document.getElementById("fileUpload").click();
            // this.getSingleChannelMessages();
            this.chatSocketService.sendMessage({
              message: this.selectedFile.name,
              sender: this.currentUid,
              channelId: this.cId,
              type: 'file'
            })
            this.componentRef.directiveRef.reset();
          }, error => {
            if (error) {
              // console.error(error);
              this.toaster.errorToastr('something went wrong to upload file');
            }
          })
    }

  }

  getChannelMessages() {
    let temp = {
      cId: this.cId,
      skip: this.scrollSkip,
      limit: this.scrollLimit,
      messageType: '0'
    }
    this.teamChannelService.getChannelMessages(temp)
      .subscribe((data: any) => {
        // console.log(data, "channel message data");
        this.channelMessageList = this.channelMessageList.concat(data);
        // this.channelMessageList = this.channelMessageList.reverse();
      })
  }

  getChannelFileMessages() {
    let temp = {
      cId: this.cId,
      skip: this.scrollFileSkip,
      limit: this.scrollFileLimit,
      messageType: '1'
    }
    this.teamChannelService.getChannelMessages(temp)
      .subscribe((data: any) => {
        // console.log(data, "channel message data");
        this.channelFileMessageList = this.channelFileMessageList.concat(data);
        // this.channelMessageList = this.channelMessageList.reverse();
      })
  }

  getSingleChannelMessages() {
    let temp = {
      cId: this.cId,
      skip: 0,
      limit: 1,
      messageType: '0'
    }
    this.teamChannelService.getChannelMessages(temp)
      .subscribe((data: any) => {
        // console.log(data, "channel single message data");
        this.channelMessageList = this.channelMessageList.concat(data);
        // this.channelMessageList = this.channelMessageList.reverse();
      })
  }

  getSingleChannelFileMessages() {
    let temp = {
      cId: this.cId,
      skip: 0,
      limit: 1,
      messageType: '1'
    }
    this.teamChannelService.getChannelMessages(temp)
      .subscribe((data: any) => {
        // console.log(data, "channel single message data");
        this.channelFileMessageList = this.channelFileMessageList.concat(data);
        // this.channelMessageList = this.channelMessageList.reverse();
      })
  }

  getCurrentUserTeamChannelDetail() {
    this.teamChannelService.getCurrentUserTeamChannelDetail(this.cId, this.currentUid)
      .subscribe((data: any) => {
        // console.log(data);
        this.currentUserChannelData = data[0];
      })
  }

  getResgiterUserForTeamUserListing() {
    this.teamChannelService.getResgiterUserForTeamUserListing(this.cId)
      .subscribe((data: any) => {
        // console.log(data, "register user");
        this.registerUserList = data;
        this.defaultRegisterUserList = data;
      })
  }

  getChannelById() {
    this.teamChannelService.getChannelById(this.cId, this.currentUid)
      .subscribe((data: any) => {
        // console.log("jay ",data);
        this.chnType = (data[0].type == "0") ? "Private" : "Public";
        this.permissionType = (data[0].type == "0") ? true : false;
        this.selectedChannel = data[0];
        if (!this.selectedChannel) {
          this.router.navigate(['/teams']);
        }
      })

  }

  getUserList() {
    this.teamChannelService.getTeamChannelUser(this.cId)
      .subscribe((data: any) => {
        this.teamUserList = data;
        this.currentUserChannelData = data.filter(u => u.uId == this.currentUid)[0];

        this.chatSocketService.setOnlineStatus('online_user', this.currentUid);
        //online users status
        this.chatSocketService.checkOnlineUser('online_user')
          .subscribe(onlineUserArr => {
            // console.log("get online users:", onlineUserArr);
            data.forEach(element => {
              if (onlineUserArr.includes(element.uId)) {
                element["status_color"] = "#008000";
                element["status"] = "Online";
              } else {
                element["status_color"] = "#FF0000";
                element["status"] = "Offline";
              }

              this.teamUserStatus = data;
            });
          })
      })
  }

  filterTeamUserList() {
    if (this.searchTeamListAddUser) {
      this.regUserPage = 1;
      const regexp = new RegExp(this.searchTeamListAddUser, 'i');
      this.registerUserList = this.defaultRegisterUserList.filter(x => regexp.test(x.username));
    } else {
      this.registerUserList = this.defaultRegisterUserList;
    }
  }

  addUserIntoTeamChannel(uId) {
    let temp = {
      cId: this.cId,
      uId,
      type: 'normal'
    }
    this.teamChannelService.addUserIntoTeamChannel(temp)
      .subscribe((data: any) => {
        this.getUserList();
        this.getResgiterUserForTeamUserListing();
      })
  }

  deleteUserIntoTeamChannel(uId) {
    let temp = {
      cId: this.cId,
      uId
    }
    this.teamChannelService.deleteUserIntoTeamChannel(temp)
      .subscribe((data: any) => {
        this.getUserList();
        this.getResgiterUserForTeamUserListing();
      })
  }

  changeUserType(uId, type) {
    let temp = {
      cId: this.cId,
      uId,
      type
    }
    this.teamChannelService.changeUserType(temp)
      .subscribe((data: any) => {
        this.getUserList();
        this.getResgiterUserForTeamUserListing();
      })
  }

  sendChannelMessage(event) {
    if (event.keyCode != 13) {
      return false;
    }

    let temp = {
      cId: this.cId,
      uId: this.currentUid,
      message: this.channelMessage,
      type: '0'
    }
    // console.log(temp)
    this.teamChannelService.sendChannelMessage(temp)
      .subscribe((data: any) => {
        this.chatSocketService.sendMessage({
          message: this.channelMessage,
          sender: this.currentUid,
          channelId: this.cId,
          type: 'message'
        })
        this.channelMessage = '';
        // messageForm.resetForm();
      })
  }

  channelUpd(form: NgForm) {
    // console.log(form.value.content)
    let data = {
      cId: this.cId,
      content: form.value.content,
      description: form.value.description
    }
    this.teamChannelService.updateChannel(data)
      .subscribe((data: any) => {
        this.toaster.successToastr('Channel info is updated successfully');
        document.getElementById("contentUpd").click();
      }, error => {
        if (error) {
          // console.error(error);
          this.toaster.errorToastr('something went wrong to updated Channel info');
        }
      })
  }

  onChannelMessageScroll() {
    this.scrollSkip += 10;
    this.defaultScrollSkip = this.scrollSkip;
    this.getChannelMessages();
  }

  onChannelFileScroll() {
    this.scrollFileSkip += 3;
    this.defaultScrollFileSkip = this.scrollFileSkip;
    this.getChannelFileMessages();

  }

  downloadFile(event, dbFileName, fileName) {
    event.preventDefault();
    this.teamChannelService.downloadFile(dbFileName, fileName);
  }

  //send mail request
  sendRequest(uId, email) {
    let data = {
      cId: this.cId,
      uId,
      email,
      type: 'normal'
    }
    this.teamChannelService.sendUserRequest(data)
      .subscribe((data: any) => {
        this.toaster.successToastr('Send Request successfully..');

        this.getUserList();
        this.getResgiterUserForTeamUserListing();
      }, error => {
        if (error) {
          // console.error(error);
          this.toaster.errorToastr('something went wrong to send Request');
        }
      })
  }

  sendGuestRequestUser(form: NgForm) {
    console.log(form.value.email)
    let data = {
      cId: this.cId,
      uId: this.currentUid,
      email: form.value.email,
    }
    this.teamChannelService.sendGuestUserRequest(data)
      .subscribe((data: any) => {
        this.toaster.successToastr('Send Request successfully..');
        document.getElementById("inviteGuestUser").click();
      }, error => {
        if (error) {
          // console.error(error);
          this.toaster.errorToastr('something went wrong to send Request');
        }
      })
  }

  async checkValidEmail(guestUserForm) {
    guestUserForm.form.controls.email.setErrors({ error: true });
    if (!this.guestInviteEmail.match(this.emailPattern)) {
      guestUserForm.form.controls.email.setErrors({ isEmailInvalid: true });
    } else if (
      await (async () => {
        let result = await this.teamChannelService.checkGuestEmail(this.guestInviteEmail)
        return result.isRegistered;
      })()) {
      guestUserForm.form.controls.email.setErrors({ isEmailAlreadyReg: true });
    } else {
      guestUserForm.form.controls.email.setErrors(null);
    }
  }

}

// token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImNvbXBhbnlJZCI6NSwiaWF0IjoxNTkzNDI1ODk3fQ.PouPq9-hMT__TAymPSCkWaz_Bq-oFRRc8KvJjKqzfp4
