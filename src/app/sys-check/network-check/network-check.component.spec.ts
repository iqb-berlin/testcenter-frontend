import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { NetworkCheckComponent } from './network-check.component';
import { BackendService } from '../backend.service';
import { TcSpeedChartComponent } from './tc-speed-chart.component';

describe('NetworkCheckComponent', () => {
  let component: NetworkCheckComponent;
  let fixture: ComponentFixture<NetworkCheckComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        NetworkCheckComponent,
        TcSpeedChartComponent
      ],
      imports: [
        HttpClientModule,
        MatCardModule
      ],
      providers: [
        BackendService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
