import { CustomTextDefs } from 'iqb-components';

export interface CustomTextsDefList {
  keyPrefix: string;
  description: string;
  defList: CustomTextDefs;
}

export const customtextKeySeparator = '_';

export const appconfig = {
  customtextsApp: <CustomTextsDefList>{
    keyPrefix: 'app',
    description: 'Textanpassungen, die vor der Anmeldung am System vorgenommen werden sollen',
    defList: {
      'title': {
        defaultvalue: 'IQB-Testcenter',
        description: 'Titel der Hauptanwendung, z. B. Homepage'
      },
      'intro1': {
        defaultvalue: 'betreibt auf diesen Seiten eine Pilotanwendung für das computerbasierte Leistungstesten von ' +
          'Schülerinnen und Schülern. Der Zugang zu einem Test ist nur möglich, wenn Sie von Testverantwortlichen ' +
          'Zugangsdaten erhalten haben, die Sie bitte links eingeben. Es sind keine weiteren Seiten öffentlich verfügbar.',
        description: 'Begrüßungstext auf der Startseite'
      }
    }
  },

  customtextsLogin: <CustomTextsDefList>{
    keyPrefix: 'login',
    description: 'Für Textanpassungen unmittelbar nach dem Login bzw. der Eingabe des Personencodes',
    defList: {
      'testRunningText': {
        defaultvalue: 'Ein Testheft ist gestartet',
        description: 'Nachricht, dass ein Test (Booklet) gestartet ist'
      },
      'testRunningLongText': {
        defaultvalue: 'Es wird gerade ein Test ausgeführt. Bitte durch Klicken auf eine der beiden Schaltflächen ' +
          'links wählen, ob der Test fortgesetzt oder beendet werden soll!',
        description: 'Nachricht, dass ein Test (Booklet) gestartet ist, mit Aufforderung zum Klicken'
      },
      'testEndButtonText': {
        defaultvalue: 'Test beenden',
        description: 'Schalterbeschriftung für "Test beenden"'
      },
      'testReturnButtonText': {
        defaultvalue: 'Zum Test zurückkehren',
        description: 'Schalterbeschriftung für "Zurück zum Test"'
      },
      'bookletSelectPromptNull': {
        defaultvalue: 'Beendet. Es können keine weiteren Testhefte gestartet werden.',
        description: 'Nachricht für den Fall, dass Booklet(s) beendet wurden und keine weiteren zur Verfügung stehen'
      },
      'bookletSelectPromptOne': {
        defaultvalue: 'Bitte klicke auf die Schaltfläche auf der linken Seite, um den Test zu starten!',
        description: 'Aufforderung, aus einer Schalterliste einen Test auszusuchen'
      },
      'bookletSelectPromptMany': {
        defaultvalue: 'Bitte klicke auf eine der Schaltflächen auf der linken Seite, um einen Test zu starten!',
        description: ''
      },
      'codeInputPrompt': {
        defaultvalue: 'Bitte Log-in eingeben, der auf dem Zettel steht!',
        description: ''
      },
      'trialmodeText': {
        defaultvalue: 'Ausführungsmodus "trial": Navigationsbeschränkungen sowie Zeit-Beschränkungen, ' +
          'die eventuell für das Testheft oder bestimmte Aufgaben festgelegt wurden, gelten nicht.',
        description: ''
      },
      'reviewmodeText': {
        defaultvalue: 'Ausführungsmodus "review": Beschränkungen für Zeit und Navigation sind nicht wirksam. Antworten werden ' +
          'nicht gespeichert. Sie können Kommentare über das Menü oben rechts speichern.',
        description: ''
      },
      'codeInputTitle': {
        defaultvalue: 'Log-in eingeben',
        description: ''
      }
    }
  },
  customtextsBooklet: <CustomTextsDefList>{
    keyPrefix: 'booklet',
    description: 'Für Textanpassungen nach dem Laden des Testheftes, also während der Durchführung des Tests bzw. der Befragung',
    defList: {
      'msgPresentationNotCompleteTitleNext': {
        defaultvalue: 'Weiterblättern nicht möglich!',
        description: ''
      },
      'msgPresentationNotCompleteTextNext': {
        defaultvalue: 'Du kannst erst weiterblättern, wenn Audio-Dateien vollständig abgespielt wurden '
          + 'und wenn du in allen Fenstern bis ganz nach unten gescrollt hast.',
        description: ''
      },
      'msgPresentationNotCompleteTitlePrev': {
        defaultvalue: 'Zurückblättern - Warnung',
        description: ''
      },
      'msgPresentationNotCompleteTextPrev': {
        defaultvalue: 'Eine Audio-Datei ist noch nicht bis zu Ende abgespielt oder Seiten wurden noch nicht vollständig gezeigt. '
          + 'Wenn du jetzt zurückblätterst, kannst Du später Audio-Dateien nicht nocheinmal starten.',
        description: ''
      },
      'codeToEnterTitle': {
        defaultvalue: 'Freigabewort',
        description: ''
      },
      'codeToEnterPrompt': {
        defaultvalue: 'Bitte gib das Freigabewort ein, das angesagt wurde!',
        description: ''
      },
      'msgSoonTimeOver5Minutes': {
        defaultvalue: 'Du hast noch 5 Minuten Zeit für die Bearbeitung der Aufgaben in diesem Abschnitt.',
        description: ''
      },
      'msgSoonTimeOver1Minute': {
        defaultvalue: 'Du hast noch 1 Minute Zeit für die Bearbeitung der Aufgaben in diesem Abschnitt.',
        description: ''
      },
      'msgTimerStarted': {
        defaultvalue: 'Die Bearbeitungszeit für diesen Abschnitt hat begonnen: ',
        description: ''
      },
      'msgTimerCancelled': {
        defaultvalue: 'Die Bearbeitung des Abschnittes wurde abgebrochen.',
        description: ''
      },
      'msgTimeOver': {
        defaultvalue: 'Die Bearbeitung des Abschnittes ist beendet.',
        description: ''
      },
      'warningLeaveTimerBlockTitle': {
        defaultvalue: 'Aufgabenabschnitt verlassen?',
        description: ''
      },
      'warningLeaveTimerBlockPrompt': {
        defaultvalue: 'Wenn du jetzt weiterblätterst, beendest ' +
          'du vorzeitig die Bearbeitung dieses Aufgabenabschnitts und du kannst nicht mehr zurück.',
        description: ''
      }
    }
  }
};
