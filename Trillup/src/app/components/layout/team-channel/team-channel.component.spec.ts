import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamChannelComponent } from './team-channel.component';

describe('TeamChannelComponent', () => {
  let component: TeamChannelComponent;
  let fixture: ComponentFixture<TeamChannelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TeamChannelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
