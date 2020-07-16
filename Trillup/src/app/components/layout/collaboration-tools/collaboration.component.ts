import { Component, OnInit } from '@angular/core';
import { AudiocallService } from '../../../services/audiocall.service'
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-collaboration',
  templateUrl: './collaboration.component.html',
  styleUrls: ['./collaboration.component.css']
})
export class CollaborationComponent implements OnInit {
  registerForm: FormGroup;
  submitted = false;
  registerform: any = {}
  registerUsers;
  currentUserResult;
  emailPattern = "^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$";
  mobilePattern = "^((\\+91-?)|0)?[0-9]{10}$";
  constructor(private api: AudiocallService, private router: Router, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.getRegisterUsers();
    this.currentUser(this.api.currentUserEmail);
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      username: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(this.mobilePattern)]],
      id: [''],
      profile: ['']
    });
  }
  get f() { return this.registerForm.controls; }
  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.registerform.invalid) {
      return;
    }
    // this.api.updateUser(this.registerForm.value).subscribe(data=>{
    //     console.log(data)
    // })
    this.registerForm.get('profile').updateValueAndValidity()
    let formData: any = new FormData();
    formData.append("email", this.registerForm.get('email').value);
    formData.append("username", this.registerForm.get('username').value);
    formData.append("mobile", this.registerForm.get('mobile').value);
    formData.append("profile", this.registerForm.get('profile').value);

    formData.append("id", this.registerForm.get('id').value);
    this.api.updateUser(formData).subscribe(data => {
      console.log(data)
    })
  }
  getRegisterUsers() {
    this.api.getRegisterUsers(this.registerform).subscribe(data => {
      this.registerUsers = data;
    })
  }
  currentUser(userEmail) {
    this.api.getCurrentUser(userEmail).subscribe(data => {
      this.currentUserResult = data;
      this.registerForm.controls.email.setValue(this.currentUserResult.email);
      this.registerForm.controls.username.setValue(this.currentUserResult.username);

      this.registerForm.controls.mobile.setValue(this.currentUserResult.mobile);
      this.registerForm.controls.id.setValue(this.currentUserResult.id)
    })
  }
  uploadFile(event) {
    // debugger;
    console.log(event);


    const file = (event.target as HTMLInputElement).files[0];
    // console.log(file);
    this.registerForm.patchValue({
      profile: file
    });
    this.registerForm.get('profile').updateValueAndValidity();
  }
  
}
