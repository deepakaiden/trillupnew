import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebinarHomeComponent } from './webinar-home.component';

describe('WebinarHomeComponent', () => {
  let component: WebinarHomeComponent;
  let fixture: ComponentFixture<WebinarHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebinarHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebinarHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
