import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { TestViewComponent } from './test-view.component';
import { Booklet, BookletError, TestSessionData, TestViewDisplayOptions } from '../group-monitor.interfaces';
import { BookletService } from '../booklet.service';

const exampleBooklet: Booklet = { // labels are: {global index}-{ancestor index}-{local index}
  config: undefined,
  metadata: undefined,
  units: {
    id: 'root',
    label: 'Root',
    descendantCount: 10,
    children: [
      { id: 'unit-1', label: '0-0-0', labelShort: 'unit' },
      {
        id: 'zara',
        label: 'Testlet-0',
        children: [],
        descendantCount: 6
      },
      { id: 'unit-2', label: '1-1-1', labelShort: 'unit' },
      {
        id: 'alf',
        label: 'Testlet-1',
        descendantCount: 4,
        children: [
          { id: 'unit-3', label: '2-0-0', labelShort: 'unit' },
          {
            id: 'ben',
            label: 'Testlet-2',
            descendantCount: 3,
            children: [
              { id: 'unit-4', label: '3-1-0', labelShort: 'unit' },
              {
                id: 'cara',
                label: 'Testlet-3',
                descendantCount: 2,
                children: []
              },
              { id: 'unit-5', label: '4-2-1', labelShort: 'unit' },
              {
                id: 'dolf',
                label: 'Testlet-4',
                descendantCount: 1,
                children: [
                  { id: 'unit-6', label: '5-3-0', labelShort: 'unit' }
                ]
              }
            ]
          },
          { id: 'unit-7', label: '6-4-1', labelShort: 'unit' }
        ]
      },
      { id: 'unit-8', label: '7-2-2', labelShort: 'unit' },
      {
        id: 'ellie',
        label: 'Testlet-5',
        descendantCount: 2,
        children: [
          { id: 'unit-9', label: '8-0-0', labelShort: 'unit' },
          {
            id: 'fred',
            label: 'Testlet-6',
            descendantCount: 1,
            children: [
              { id: 'unit-10', label: '9-1-0', labelShort: 'unit' }
            ]
          }
        ]
      }
    ]
  }
};

const exampleSession: TestSessionData = {
  personId: 0,
  testState: {},
  timestamp: 0,
  unitState: {}
};

class MockBookletService {
  public booklets: Observable<Booklet>[] = [of(exampleBooklet)];

  public getBooklet = (bookletName: string): Observable<Booklet | BookletError> => {
    if (!bookletName) {
      return of({ error: 'general' });
    }

    if (bookletName === 'test') {
      return of(exampleBooklet);
    }

    return of({ error: 'missing-file' });
  };
}

describe('TestViewComponent', () => {
  let component: TestViewComponent;
  let fixture: ComponentFixture<TestViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TestViewComponent],
      providers: [
        {
          provide: BookletService,
          useValue: new MockBookletService()
        }
      ],
      imports: [MatIconModule, MatTooltipModule]
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
      selectionMode: undefined,
      selectionSpreading: 'all'
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('hasState()', () => {
    it('should check correctly if state is in state-object', () => {
      const stateObject = {
        first_key: 'first_value',
        second_key: null
      };

      let result = component.hasState(stateObject, 'first_key', 'first_value');
      expect(result).withContext('key exists and has value').toBeTrue();

      result = component.hasState(stateObject, 'first_key', 'something_else');
      expect(result).withContext('key exists and not has value').toBeFalse();

      result = component.hasState(stateObject, 'first_key');
      expect(result).withContext('key exists').toBeTrue();

      result = component.hasState(stateObject, 'non_existing_key');
      expect(result).withContext('key exists not').toBeFalse();
    });
  });

  describe('stateString()', () => {
    it('should merge state object values if available', () => {
      const stateObject = {
        first_key: 'first_value',
        second_key: 'second_value'
      };

      let result = component.stateString(stateObject, ['first_key'], '|');
      let expectation = 'first_value';
      expect(result).withContext('one existing value').toEqual(expectation);

      result = component.stateString(stateObject, ['first_key', 'second_key'], '|');
      expectation = 'first_value|second_value';
      expect(result).withContext('two existing values').toEqual(expectation);

      result = component.stateString(stateObject, ['first_key', 'second_key', 'not_existing'], '|');
      expectation = 'first_value|second_value';
      expect(result).withContext('two existing values and one not existing').toEqual(expectation);
    });
  });

  describe('parseJsonState()', () => {
    xit('should parse an string containing a state-object', () => {
      // TOOD implement unit-test
    });
  });

  describe('getMode()', () => {
    xit('should transform mode-string into label', () => {
      // TOOD implement unit-test
    });
  });

  describe('getUnitContext()', () => {
    it('should find correct indices, unit and parent', () => {
      const expectations = {
        'unit-0': { global: -1, ancestor: -1, local: -1 },
        'unit-1': { global: 0, ancestor: 0, local: 0, parentName: 'root', ancestorName: 'root' },
        'unit-2': { global: 1, ancestor: 1, local: 1, parentName: 'root', ancestorName: 'root' },
        'unit-3': { global: 2, ancestor: 0, local: 0, parentName: 'alf', ancestorName: 'alf' },
        'unit-4': { global: 3, ancestor: 1, local: 0, parentName: 'ben', ancestorName: 'alf' },
        'unit-5': { global: 4, ancestor: 2, local: 1, parentName: 'ben', ancestorName: 'alf' },
        'unit-6': { global: 5, ancestor: 3, local: 0, parentName: 'dolf', ancestorName: 'alf' },
        'unit-7': { global: 6, ancestor: 4, local: 1, parentName: 'alf', ancestorName: 'alf' },
        'unit-8': { global: 7, ancestor: 2, local: 2, parentName: 'root', ancestorName: 'root' },
        'unit-9': { global: 8, ancestor: 0, local: 0, parentName: 'ellie', ancestorName: 'ellie' },
        'unit-10': { global: 9, ancestor: 1, local: 0, parentName: 'fred', ancestorName: 'ellie' }
      };

      for (let i = 0; i < 11; i++) {
        const result = component.getUnitContext(exampleBooklet.units, `unit-${i}`);
        const expectation = expectations[`unit-${i}`];

        expect(result.indexGlobal).withContext(`global index of unit-${i}`).toEqual(expectation.global);
        expect(result.indexAncestor).withContext(`ancestor-index of unit-${i}`).toEqual(expectation.ancestor);
        expect(result.indexLocal).withContext(`local index of unit-${i}`).toEqual(expectation.local);

        if ('parentName' in expectation) {
          expect(result.unit.id).withContext(`featured unit of unit-${i}`).toEqual(`unit-${i}`);
          expect(result.parent.id).withContext(`parent of unit-${i}`).toEqual(expectation.parentName);
          expect(result.ancestor.id).withContext(`ancestor of unit-${i}`).toEqual(expectation.ancestorName);
        } else {
          expect(result.unit).withContext(`not found unit-${i}`).toBeNull();
          expect(result.parent).withContext(`no parent of unit-${i}`).toBeNull();
        }
      }
    });
  });
});
