import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusCardComponent } from './status-card.component';
import { MainDataService } from '../../maindata.service';

describe('StatusCardComponent', () => {
  let component: StatusCardComponent;
  let fixture: ComponentFixture<StatusCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StatusCardComponent],
      providers: [
        MainDataService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
