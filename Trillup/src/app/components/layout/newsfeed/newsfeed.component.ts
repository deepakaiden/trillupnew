import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NewsfeedService } from '../../../services/newsfeed.service';
import { from, Observable } from 'rxjs';
@Component({
  selector: 'app-newsfeed',
  templateUrl: './newsfeed.component.html',
  styleUrls: ['./newsfeed.component.css']
})
export class NewsfeedComponent implements OnInit {
  registerForm: FormGroup;
  submitted = false;
  shownList = null;
  images;
  collapsed: boolean = true;
  visibleIndex = -1;
  constructor(private formBuilder: FormBuilder, private api: NewsfeedService) { }

  ngOnInit() {
    this.getUploadfiles();
    // this.uploadFile(event);
    this.registerForm = this.formBuilder.group({
      message: [''],
      image: ['']
    })
  }
  
  get f() { return this.registerForm.controls; }

  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }
    this.registerForm.get('image').updateValueAndValidity()

    let formData: any = new FormData();
    formData.append("message", this.registerForm.get("message").value)
    formData.append("image", this.registerForm.get("image").value)
    this.api.uploadFiles(formData).subscribe(data => {
      console.log('files', data)
    })

  }
  uploadFile(event) {
    // debugger;
    // console.log(event);


    const file = (event.target as HTMLInputElement).files[0];
    // console.log(file);
    this.registerForm.patchValue({
      image: file
    });
    this.registerForm.get('image').updateValueAndValidity();
  }
  getUploadfiles(){
    this.api.getUploadfiles(this.registerForm).subscribe((data)=>{
         this.images=data;
         console.log('files',this.images)
    })
  }
  showhide(){
    this.collapsed=false;
    // this.collapsed=true;
  }
  showSubItem(ind) {
    if (this.visibleIndex === ind) {
      this.visibleIndex = -1;
    } else {
      this.visibleIndex = ind;
    }
  }
}
