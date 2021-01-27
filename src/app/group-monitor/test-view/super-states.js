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
    icon: 'lock'
  },
  error: {
    tooltip: 'Es ist ein Fehler aufgetreten!',
    icon: 'error',
    class: 'danger'
  },
  controller_terminated: {
    tooltip: 'Testausführung wurde beendet und kann wieder aufgenommen werden. ' +
    'Der Browser des Teilnehmers ist nicht verbunden und muss neu geladen werden!',
    icon: 'sync_problem',
    class: 'danger'
  },
  connection_lost: {
    tooltip: 'Seite wurde verlassen oder Browserfenster geschlossen!',
    icon: 'error',
    class: 'danger'
  },
  paused: {
    tooltip: 'Test pausiert',
    icon: 'pause'
  },
  focus_lost: {
    tooltip: 'Fenster/Tab wurde verlassen!',
    icon: 'warning',
    class: 'danger'
  },
  idle: {
    tooltip: 'Test ist 5 Minuten oder länger inaktiv!',
    icon: 'hourglass_full',
    class: 'danger'
  },
  connection_websocket: {
    tooltip: 'Test läuft, Verbindung ist live',
    icon: 'play_circle_filled',
    class: 'success'
  },
  connection_polling: {
    tooltip: 'Test läuft',
    icon: 'play_circle_outline',
    class: 'success'
  },
  ok: {
    tooltip: 'Test läuft',
    icon: 'play_circle_filled'
  }
};
