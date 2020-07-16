import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service'
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  registerForm: FormGroup;
  submitted = false;
  errormsg: string;
  errormsg1;
  constructor(private formBuilder: FormBuilder,
    private api: AuthService, private router: Router, ) { }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      emailormobile: ['', Validators.required],
      password: ['', Validators.required]
    })
  }
  get f() { return this.registerForm.controls; }

  onSubmit() {
    this.submitted = true;

    if (this.registerForm.invalid) {
      return;
    }
    this.api.signin(this.registerForm.value).subscribe(data => {
      localStorage.setItem('access_token', data.token);
      this.errormsg = data.msg;
      this.errormsg1 = data.msg1;
      if (data.isLoggedIn === true) {
        this.router.navigate(['collaboration-tools'])
      }
    })
  }

}
