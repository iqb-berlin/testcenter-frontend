import { NavigationLeaveRestrictions, Testlet, UnitDef } from './test-controller.classes';
import { StateReportEntry, TestStateKey, UnitData } from './test-controller.interfaces';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../config/booklet-config';

// helper functions to construct testdata
type NonFunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T];
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

const testlet = (params: NonFunctionProperties<Testlet>) => {
  const testletInstance = new Testlet(params.sequenceId, params.id, params.title);
  testletInstance.codeToEnter = params.codeToEnter;
  testletInstance.codePrompt = params.codePrompt;
  testletInstance.maxTimeLeft = params.maxTimeLeft;
  testletInstance.children = params.children;
  return testletInstance;
};

const unit = (params: NonFunctionProperties<UnitDef>) => {
  const unitInstance = new UnitDef(
    params.sequenceId,
    params.id,
    params.title,
    params.alias,
    params.naviButtonLabel,
    params.navigationLeaveRestrictions
  );
  unitInstance.locked = params.locked;
  unitInstance.playerId = params.playerId;
  return unitInstance;
};

const perSequenceId = (agg: { [index: number]: string }, stuff: string, index) => {
  agg[index + 1] = stuff;
  return agg;
};

// the data
export const TestBookletXML = `<Booklet>
  <Metadata>
    <Id>BookletId</Id>
    <Label>Label</Label>
  </Metadata>

  <BookletConfig>
    <Config key="force_presentation_complete">ON</Config>
    <Config key="force_response_complete">OFF</Config>
    <Config key="loading_mode">LAZY</Config>
  </BookletConfig>

  <Units>
    <Restrictions>
      <DenyNavigationOnIncomplete presentation="OFF" response="ON"/>
      <TimeMax minutes="10" />
    </Restrictions>
    <Unit id="u1" label="l" />
    <Testlet id="t1">
     <Restrictions>
       <CodeToEnter code="d" />
       <TimeMax minutes="5" />
     </Restrictions>
     <Unit id="u2" label="l" />
     <Testlet id="t2">
       <Restrictions>
         <CodeToEnter code="d" />
         <TimeMax minutes="3" />
         <DenyNavigationOnIncomplete presentation="ON" response="OFF"/>
       </Restrictions>
       <Unit id="u3" label="l" />
     </Testlet>
     <Unit id="u4" label="l" />
    </Testlet>
    <Unit id="u5" label="l" />
  </Units>
</Booklet>`;

export const TestBookletXmlVariants = {
  original: TestBookletXML,
  withLoadingModeEager: TestBookletXML.replace('key="loading_mode">LAZY', 'key="loading_mode">EAGER')
};

export const TestUnits: { [unitId: string]: UnitData } = {
  u1: {
    data: '{"all": "data from a previous session"}',
    state: {},
    playerId: 'a-player',
    definition: 'the unit (1) definition itself'
  },
  u2: {
    data: '{"all": "data from a previous session"}',
    state: {
      PRESENTATION_PROGRESS: 'some',
      CURRENT_PAGE_ID: '1',
      CURRENT_PAGE_NR: '1'
    },
    playerId: 'another-player',
    definitionRef: 'test-unit-content-u2'
  },
  u3: {
    data: '{"all": "data from a previous session"}',
    state: {
      RESPONSE_PROGRESS: 'complete'
    },
    playerId: 'a-player-but-version-2',
    definitionRef: 'test-unit-content-u3'
  },
  u4: {
    data: '{"all": "data from a previous session"}',
    state: {
      CURRENT_PAGE_ID: '2'
    },
    playerId: 'a-player',
    definition: 'the unit (4) definition itself'
  },
  u5: {
    data: '{"all": "data from a previous session"}',
    state: {},
    playerId: 'a-player',
    definition: 'the unit (5) definition itself'
  }
};

export const TestPlayers = {
  'A-PLAYER.HTML': 'a player',
  'ANOTHER-PLAYER.HTML': 'another player',
  'A-PLAYER-BUT-VERSION-2.HTML': 'a player, but version 2'
};

export const TestExternalUnitContents = {
  'test-unit-content-u2': 'the unit (2) definition',
  'test-unit-content-u3': 'the unit (3) definition'
};

export const TestResources = {
  ...TestPlayers,
  ...TestExternalUnitContents
};

export const TestUnitDefinitionsPerSequenceId = Object.values(TestUnits)
  .map(unitDef => (unitDef.definitionRef ? TestExternalUnitContents[unitDef.definitionRef] : unitDef.definition))
  .reduce(perSequenceId, {});

export const TestUnitStateDataParts = Object.values(TestUnits)
  .map(unitDef => JSON.parse(unitDef.data))
  .reduce(perSequenceId, {});

export const TestUnitPresentationProgressStates = Object.values(TestUnits)
  .map(unitDef => unitDef.state.PRESENTATION_PROGRESS)
  .reduce(perSequenceId, {});

export const TestUnitResponseProgressStates = Object.values(TestUnits)
  .map(unitDef => unitDef.state.RESPONSE_PROGRESS)
  .reduce(perSequenceId, {});

export const TestUnitStateCurrentPages = Object.values(TestUnits)
  .map(unitDef => unitDef.state.CURRENT_PAGE_ID)
  .reduce(perSequenceId, {});

export const TestTestState: StateReportEntry[] = [
  {
    key: TestStateKey.CURRENT_UNIT_ID,
    content: 'u3',
    timeStamp: 0
  }
];

export const TestBooklet = testlet({
  sequenceId: 0,
  id: 'BookletId',
  title: 'Label',
  codeToEnter: '',
  codePrompt: '',
  maxTimeLeft: 10,
  children: [
    unit({
      sequenceId: 1,
      id: 'u1',
      title: 'l',
      children: [],
      locked: false,
      alias: 'u1',
      naviButtonLabel: null,
      navigationLeaveRestrictions: new NavigationLeaveRestrictions('OFF', 'ON'),
      playerId: 'a-player'
    }),
    testlet({
      sequenceId: 0,
      id: 't1',
      title: '',
      codeToEnter: 'D',
      codePrompt: '',
      maxTimeLeft: 5,
      children: [
        unit({
          sequenceId: 2,
          id: 'u2',
          title: 'l',
          children: [],
          locked: false,
          alias: 'u2',
          naviButtonLabel: null,
          navigationLeaveRestrictions: new NavigationLeaveRestrictions('OFF', 'ON'),
          playerId: 'another-player'
        }),
        testlet({
          sequenceId: 0,
          id: 't2',
          title: '',
          codeToEnter: 'D',
          codePrompt: '',
          maxTimeLeft: 3,
          children: [
            unit({
              sequenceId: 3,
              id: 'u3',
              title: 'l',
              children: [],
              locked: false,
              alias: 'u3',
              naviButtonLabel: null,
              navigationLeaveRestrictions: new NavigationLeaveRestrictions('ON', 'OFF'),
              playerId: 'a-player-but-version-2'
            })
          ]
        }),
        unit({
          sequenceId: 4,
          id: 'u4',
          title: 'l',
          children: [],
          locked: false,
          alias: 'u4',
          naviButtonLabel: null,
          navigationLeaveRestrictions: new NavigationLeaveRestrictions('OFF', 'ON'),
          playerId: 'a-player'
        })
      ]
    }),
    unit({
      sequenceId: 5,
      id: 'u5',
      title: 'l',
      children: [],
      locked: false,
      alias: 'u5',
      naviButtonLabel: null,
      navigationLeaveRestrictions: new NavigationLeaveRestrictions('OFF', 'ON'),
      playerId: 'a-player'
    })
  ]
});

export const TestBookletConfig = new BookletConfig();
TestBookletConfig.force_presentation_complete = 'ON';
TestBookletConfig.force_response_complete = 'OFF';
TestBookletConfig.loading_mode = 'LAZY';
