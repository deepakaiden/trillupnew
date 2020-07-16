import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

// Other modules
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { JwtModule } from "@auth0/angular-jwt";
import { ToastrModule } from 'ng6-toastr-notifications';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DropzoneModule } from 'ngx-dropzone-wrapper';
import { DROPZONE_CONFIG } from 'ngx-dropzone-wrapper';
import { DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { environment } from 'src/environments/environment';
import { NgxPaginationModule } from 'ngx-pagination';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AngularFireModule } from '@angular/fire';
import { AngularFireMessagingModule } from '@angular/fire/messaging';

// Components
import { AppComponent } from './app.component';
import { LoginComponent } from './components/user/login/login.component';
import { RegisterComponent } from './components/user/register/register.component';
import { ForgotPasswordComponent } from './components/user/forgot-password/forgot-password.component';
import { RecoveryPasswordComponent } from './components/user/recovery-password/recovery-password.component';
import { HomeComponent } from './components/layout/home/home.component';
import { WebinarComponent } from './components/layout/webinar/webinar.component';
import { NavLinksComponent } from './components/layout/common/nav-links.component';
import { MeetingScheduleComponent } from './components/webinar/meeting-schedule/meeting-schedule.component';
import { AudioCallComponent } from './components/collaboration-tools/audio-call/audio-call.component';
import { VideoCallComponent } from './components/collaboration-tools/video-call/video-call.component';
import { CollaborationComponent } from './components/layout/collaboration-tools/collaboration.component';
import { WebinarHomeComponent } from './components/webinar/webinar-home/webinar-home.component';
import { NewsfeedComponent } from './components/layout/newsfeed/newsfeed.component';
import { TeamChannelComponent } from './components/layout/team-channel/team-channel.component';
import { DocumentCollaborationComponent } from './components/layout/document-collaboration/document-collaboration.component';

export function tokenGetter() {
  return localStorage.getItem('access_token');
}

const DEFAULT_DROPZONE_CONFIG: DropzoneConfigInterface = {
  // Change this to your upload POST address:
  url: environment.backendFileUploadURL || 'http://localhost:3000/teamChannel/uploadFile',
  maxFilesize: 50,
  // acceptedFiles: 'image/*,application/pdf,.psd'
};

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    RecoveryPasswordComponent,
    HomeComponent,
    WebinarComponent,
    NavLinksComponent,
    MeetingScheduleComponent,
    AudioCallComponent,
    VideoCallComponent,
    CollaborationComponent,
    WebinarHomeComponent,
    NewsfeedComponent,
    TeamChannelComponent,
    DocumentCollaborationComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        whitelistedDomains: [

        ],
        blacklistedRoutes: [
          "http://localhost:3000/user/register",
          "http://localhost:3000/user/login",
          "http://localhost:3000/user/request-reset-password",
          "http://localhost:3000/user/valid-password-token",
          "http://localhost:3000/user/new-password"
        ]
      }
    }),
    ToastrModule.forRoot(),
    BrowserAnimationsModule,
    NgxPaginationModule,
    InfiniteScrollModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireMessagingModule,
    DropzoneModule,
  ],
  providers: [
    {
      provide: DROPZONE_CONFIG,
      useValue: DEFAULT_DROPZONE_CONFIG
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
