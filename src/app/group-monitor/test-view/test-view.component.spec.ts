import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TestViewComponent } from './test-view.component';
import { TestViewDisplayOptions } from '../group-monitor.interfaces';
import { exampleSession } from '../test-session.service.spec';

describe('TestViewComponent', () => {
  let component: TestViewComponent;
  let fixture: ComponentFixture<TestViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TestViewComponent],
      imports: [MatIconModule, MatTooltipModule, MatCheckboxModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestViewComponent);
    component = fixture.componentInstance;
    component.testSession = exampleSession;
    component.displayOptions = <TestViewDisplayOptions>{
      bookletColumn: undefined,
      groupColumn: undefined,
      blockColumn: undefined,
      unitColumn: undefined,
      view: undefined,
      highlightSpecies: false
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
