import { NavigationLeaveRestrictions, Testlet, UnitDef } from './test-controller.classes';

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
  // unitInstance.playerId = params.playerId;
  return unitInstance;
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
      playerId: ''
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
          playerId: ''
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
              playerId: ''
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
          playerId: ''
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
      playerId: ''
    })
  ]
});
