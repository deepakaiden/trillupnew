import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Components
import { HomeComponent } from './components/layout/home/home.component';
import { LoginComponent } from './components/user/login/login.component';
import { RegisterComponent } from './components/user/register/register.component';
import { ForgotPasswordComponent } from './components/user/forgot-password/forgot-password.component';
import { RecoveryPasswordComponent } from './components/user/recovery-password/recovery-password.component';
import { WebinarComponent } from './components/layout/webinar/webinar.component';
import { NavLinksComponent } from './components/layout/common/nav-links.component';
import { MeetingScheduleComponent } from './components/webinar/meeting-schedule/meeting-schedule.component';
import { AudioCallComponent } from './components/collaboration-tools/audio-call/audio-call.component';
import { CollaborationComponent } from './components/layout/collaboration-tools/collaboration.component'
import { AuthGuard } from './guards/auth.guard';
import { WebinarHomeComponent } from './components/webinar/webinar-home/webinar-home.component';
import { VideoCallComponent } from './components/collaboration-tools/video-call/video-call.component';
import { NewsfeedComponent } from './components/layout/newsfeed/newsfeed.component';
import { TeamChannelComponent } from './components/layout/team-channel/team-channel.component';
import { DocumentCollaborationComponent } from './components/layout/document-collaboration/document-collaboration.component';

const routes: Routes = [
  {
    path: "",
    redirectTo: "/home/login",
    pathMatch: "full"
  },
  {
    path: "home",
    component: HomeComponent,
    children: [
      // { path: "", redirectTo: "/home/login", pathMatch: "full" },
      { path: "login", component: LoginComponent },
      { path: "register", component: RegisterComponent },
      { path: "forgot-password", component: ForgotPasswordComponent },
      { path: "recovery-password", component: RecoveryPasswordComponent }
    ]
  },
  
  

  {
    path:"collaboration-tools",
    component:CollaborationComponent,
    canActivate: [
      AuthGuard
    ],
    children:[
      {path:"collaboration-tools",redirectTo:"  ",pathMatch:"full"},
      {path:"audiocall",component:AudioCallComponent},
      {path:"videocall",component:VideoCallComponent}
    ]
  },
  
  {
   path:"newsfeed",
   component:NewsfeedComponent,
   
  },
  {
  path:"webinar",
  component: WebinarComponent,
  children: [
    { path: "webinar-home", component:WebinarHomeComponent },
    { path:'meeting-schedule',component:MeetingScheduleComponent}
  ] 
},
  {
    path:"teamchannel",
    component:TeamChannelComponent
  },
  {
    path:"document-collaboration",
    component:DocumentCollaborationComponent
  },
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
