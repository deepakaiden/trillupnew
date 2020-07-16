import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service'
import { HttpClient } from '@angular/common/http';
import { ToastrManager } from 'ng6-toastr-notifications';
import { Router } from '@angular/router';
import { MustMatch } from './mustMatchHelper';

// import { MustMatch } from './_helpers/must-match.validator';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  submitted = false;
  errormsg;
  errormsg1;
  pwdPattern = '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&].{8,}';
  emailPattern = "^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$";
  mobilePattern = "^((\\+91-?)|0)?[0-9]{10}$";
  constructor(private formBuilder: FormBuilder,
    private api: AuthService,
    private Toaster: ToastrManager,
    private router: Router
  ) { }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      username: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(this.mobilePattern)]],
      password: ['', [Validators.required, Validators.pattern(this.pwdPattern)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: MustMatch('password', 'confirmPassword')
    });
  }
  get f() { return this.registerForm.controls; }

  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }
    this.api.register(this.registerForm.value).subscribe(data => {
      console.log('hai', data);
      this.errormsg = data.msg;
      this.errormsg1 = data.msg1;
      console.log('error', this.errormsg)
      if (data.msg === true) {
        this.Toaster.successToastr('your registration is successfull')
        this.router.navigate(['home/login'])
      }
      error => {
        this.errormsg = data.msg
        console.log('error', this.errormsg)
      }

    })
  }

}
