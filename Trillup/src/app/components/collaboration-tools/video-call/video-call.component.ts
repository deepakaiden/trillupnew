import { Component, OnInit } from '@angular/core';
import { AudiocallService} from '../../../services/audiocall.service'
import { Router } from '@angular/router';
@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements OnInit {
  registerform:any={}
  registerUsers;

  constructor(private api:AudiocallService,private router:Router) { }

  ngOnInit() {
    this.getRegisterUsers();
  }
  getRegisterUsers(){
    this.api.getRegisterUsers(this.registerform).subscribe(data=>{
    this.registerUsers=data;
    })
  }
}
