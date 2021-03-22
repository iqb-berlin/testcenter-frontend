exports.superStates = {
  monitor_group: {
    tooltip: 'Testleiter',
    icon: 'supervisor_account'
  },
  demo: {
    tooltip: 'Vorschau-Modus',
    icon: 'preview'
  },
  pending: {
    tooltip: 'Test noch nicht gestartet',
    icon: 'person_outline'
  },
  locked: {
    tooltip: 'Test gesperrt',
    icon: 'lock',
    description: 'State is reached if Testtaker pressed "Quit"-Button or Supervisor hit the "Quit all"-Button'
  },
  error: {
    tooltip: 'Es ist ein Fehler aufgetreten!',
    icon: 'error',
    class: 'danger',
    description: 'Bei Teilnehmer-Rechner ist ein Fehler aufgetreten. Wahrscheinlich ein Netzwerkfehler oder ' +
      'ähnliches, kann aber auch auf Bugs hindeuten und sollte nach Möglichkeit untersucht werden. ' +
      'Der Teilnehmer sollte seinen Browser neu laden und probieren ob das Problem dann immer noch besteht.'
  },
  controller_terminated: {
    tooltip: 'Testausführung wurde beendet und kann wieder aufgenommen werden. ' +
      'Der Browser des Teilnehmers ist nicht verbunden und muss neu geladen werden!',
    icon: 'sync_problem',
    class: 'danger',
    description: 'Zustand kommt zustande, wenn der "Entsperren"-Knopf im gruppen-Monitor verwendet wurde.'
  },
  connection_lost: {
    tooltip: 'Seite wurde verlassen oder Browserfenster geschlossen!',
    icon: 'error',
    class: 'danger',
    description: 'Die Verbindung zum Teilnehmer-Browser ist abgerissen. Er könnte das Fenster geschlossen haben oder ' +
      'die Netzwerkverbindung ist abgerissen'
  },
  paused: {
    tooltip: 'Test pausiert',
    icon: 'pause'
  },
  focus_lost: {
    tooltip: 'Fenster/Tab wurde verlassen!',
    icon: 'warning',
    class: 'danger',
    description: 'Ein anderes Fenster oder ein anderer Tab wurde angewählt, dei Seite ist jedoch immer noch offen ' +
      'und verbunden.'
  },
  idle: {
    tooltip: 'Test ist 5 Minuten oder länger inaktiv!',
    icon: 'hourglass_full'
  },
  connection_websocket: {
    tooltip: 'Test läuft, Verbindung ist live',
    icon: 'play_circle_filled',
    class: 'success',
    description: 'Test läuft und Teilnehmer ist im Live-Modus (= Websocket) verbunden.'
  },
  connection_polling: {
    tooltip: 'Test läuft',
    icon: 'play_circle_outline',
    class: 'success',
    description: 'Test läuft und Teilnehmer ist im Polling-Modus Verbindung verbunden.'
  },
  ok: {
    tooltip: 'Test läuft',
    icon: 'play_circle_filled',
    description: 'Test läuft, Verbindungstyp is unbekannt.'
  }
};
