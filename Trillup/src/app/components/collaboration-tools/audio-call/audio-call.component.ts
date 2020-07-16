import { Component, OnInit } from '@angular/core';
import { AudiocallService} from '../../../services/audiocall.service'
import { Router } from '@angular/router';

@Component({
  selector: 'app-audio-call',
  templateUrl: './audio-call.component.html',
  styleUrls: ['./audio-call.component.css']
})
export class AudioCallComponent implements OnInit {

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
