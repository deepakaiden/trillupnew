import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentCollaborationComponent } from './document-collaboration.component';

describe('DocumentCollaborationComponent', () => {
  let component: DocumentCollaborationComponent;
  let fixture: ComponentFixture<DocumentCollaborationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentCollaborationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentCollaborationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
