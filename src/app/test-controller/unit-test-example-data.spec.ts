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
      <DenyNavigation force_presentation_complete="OFF" force_response_complete="ON"/>
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
         <DenyNavigation force_presentation_complete="ON" force_response_complete="OFF"/>
       </Restrictions>
       <Unit id="u3" label="l" />
     </Testlet>
     <Unit id="u4" label="l" />
    </Testlet>
    <Unit id="u5" label="l" />
  </Units>
</Booklet>`;

export const testBookletJSON = {
  sequenceId: 0,
  id: 'BookletId',
  title: 'Label',
  canEnter: 'y',
  canLeave: 'y',
  tryEnterMessage: '',
  tryLeaveMessage: '',
  children: [
    {
      sequenceId: 1,
      id: 'u1',
      title: 'l',
      canEnter: 'y',
      canLeave: 'y',
      tryEnterMessage: '',
      tryLeaveMessage: '',
      children: [],
      locked: false,
      ignoreCompleted: false,
      alias: 'u1',
      naviButtonLabel: null,
      statusResponses: 'no',
      statusPresentation: 'no',
      navigationLeaveRestrictions: {
        presentationComplete: 'OFF',
        responseComplete: 'ON'
      }
    },
    {
      sequenceId: 0,
      id: 't1',
      title: '',
      canEnter: 'y',
      canLeave: 'y',
      tryEnterMessage: '',
      tryLeaveMessage: '',
      children: [
        {
          sequenceId: 2,
          id: 'u2',
          title: 'l',
          canEnter: 'y',
          canLeave: 'y',
          tryEnterMessage: '',
          tryLeaveMessage: '',
          children: [],
          locked: false,
          ignoreCompleted: false,
          alias: 'u2',
          naviButtonLabel: null,
          statusResponses: 'no',
          statusPresentation: 'no',
          navigationLeaveRestrictions: {
            presentationComplete: 'OFF',
            responseComplete: 'ON'
          }
        },
        {
          sequenceId: 0,
          id: 't2',
          title: '',
          canEnter: 'y',
          canLeave: 'y',
          tryEnterMessage: '',
          tryLeaveMessage: '',
          children: [
            {
              sequenceId: 3,
              id: 'u3',
              title: 'l',
              canEnter: 'y',
              canLeave: 'y',
              tryEnterMessage: '',
              tryLeaveMessage: '',
              children: [],
              locked: false,
              ignoreCompleted: false,
              alias: 'u3',
              naviButtonLabel: null,
              statusResponses: 'no',
              statusPresentation: 'no',
              navigationLeaveRestrictions: {
                presentationComplete: 'ON',
                responseComplete: 'OFF'
              }
            }
          ],
          codeToEnter: 'D',
          codePrompt: '',
          maxTimeLeft: 3
        },
        {
          sequenceId: 4,
          id: 'u4',
          title: 'l',
          canEnter: 'y',
          canLeave: 'y',
          tryEnterMessage: '',
          tryLeaveMessage: '',
          children: [],
          locked: false,
          ignoreCompleted: false,
          alias: 'u4',
          naviButtonLabel: null,
          statusResponses: 'no',
          statusPresentation: 'no',
          navigationLeaveRestrictions: {
            presentationComplete: 'OFF',
            responseComplete: 'ON'
          }
        }
      ],
      codeToEnter: 'D',
      codePrompt: '',
      maxTimeLeft: 5
    },
    {
      sequenceId: 5,
      id: 'u5',
      title: 'l',
      canEnter: 'y',
      canLeave: 'y',
      tryEnterMessage: '',
      tryLeaveMessage: '',
      children: [],
      locked: false,
      ignoreCompleted: false,
      alias: 'u5',
      naviButtonLabel: null,
      statusResponses: 'no',
      statusPresentation: 'no',
      navigationLeaveRestrictions: {
        presentationComplete: 'OFF',
        responseComplete: 'ON'
      }
    }
  ],
  codeToEnter: '',
  codePrompt: '',
  maxTimeLeft: 10
};
