import { CustomTextDefs } from "iqb-components";

export const appconfig = {
  customtexts: <CustomTextDefs>{
    'app_title': {
      defaultvalue: 'IQB-Testcenter',
      description: 'Titel der Hauptanwendung, z. B. Homepage'
    },
    'app_intro1': {
      defaultvalue: 'betreibt auf diesen Seiten eine Pilotanwendung für das computerbasierte Leistungstesten von ' +
        'Schülerinnen und Schülern. Der Zugang zu einem Test ist nur möglich, wenn Sie von Testverantwortlichen ' +
        'Zugangsdaten erhalten haben, die Sie bitte links eingeben. Es sind keine weiteren Seiten öffentlich verfügbar.',
      description: 'Begrüßungstext auf der Startseite'
    },
    'login_testRunningText': {
      defaultvalue: 'Ein Testheft ist gestartet',
      description: 'Nachricht, dass ein Test (Booklet) gestartet ist'
    },
    'login_testRunningLongText': {
      defaultvalue: 'Es wird gerade ein Test ausgeführt. Bitte durch Klicken auf eine der beiden Schaltflächen ' +
        'links wählen, ob der Test fortgesetzt oder beendet werden soll!',
      description: 'Nachricht, dass ein Test (Booklet) gestartet ist, mit Aufforderung zum Klicken'
    },
    'login_testEndButtonText': {
      defaultvalue: 'Test beenden',
      description: 'Schalterbeschriftung für "Test beenden"'
    },
    'login_testReturnButtonText': {
      defaultvalue: 'Zum Test zurückkehren',
      description: 'Schalterbeschriftung für "Zurück zum Test"'
    },
    'login_bookletSelectPromptNull': {
      defaultvalue: 'Beendet. Es können keine weiteren Testhefte gestartet werden.',
      description: 'Nachricht für den Fall, dass Booklet(s) beendet wurden und keine weiteren zur Verfügung stehen'
    },
    'login_bookletSelectPromptOne': {
      defaultvalue: 'Bitte klicke auf die Schaltfläche auf der linken Seite, um den Test zu starten!',
      description: 'Aufforderung, aus einer Schalterliste einen Test auszusuchen'
    },
    'login_bookletSelectPromptMany': {
      defaultvalue: 'Bitte klicke auf eine der Schaltflächen auf der linken Seite, um einen Test zu starten!',
      description: ''
    },
    'login_codeInputPrompt': {
      defaultvalue: 'Bitte Log-in eingeben, der auf dem Zettel steht!',
      description: ''
    },
    'login_codeInputTitle': {
      defaultvalue: 'Log-in eingeben',
      description: ''
    },
    'booklet_msgPresentationNotCompleteTitleNext': {
      defaultvalue: 'Weiterblättern nicht möglich!',
      description: ''
    },
    'booklet_msgPresentationNotCompleteTextNext': {
        defaultvalue: 'Du kannst erst weiterblättern, wenn Audio-Dateien vollständig abgespielt wurden '
          + 'und wenn du in allen Fenstern bis ganz nach unten gescrollt hast.',
      description: ''
    },
    'booklet_msgPresentationNotCompleteTitlePrev': {
      defaultvalue: 'Zurückblättern - Warnung',
      description: ''
    },
    'booklet_msgPresentationNotCompleteTextPrev': {
        defaultvalue: 'Eine Audio-Datei ist noch nicht bis zu Ende abgespielt oder Seiten wurden noch nicht vollständig gezeigt. '
          + 'Wenn du jetzt zurückblätterst, kannst Du später Audio-Dateien nicht nocheinmal starten.',
      description: ''
    },
    'booklet_codeToEnterTitle': {
      defaultvalue: 'Freigabewort',
      description: ''
    },
    'booklet_codeToEnterPrompt': {
      defaultvalue: 'Bitte gib das Freigabewort ein, das angesagt wurde!',
      description: ''
    },
    'booklet_msgSoonTimeOver5Minutes': {
      defaultvalue: 'Du hast noch 5 Minuten Zeit für die Bearbeitung der Aufgaben in diesem Abschnitt.',
      description: ''
    },
    'booklet_msgSoonTimeOver1Minute': {
      defaultvalue: 'Du hast noch 1 Minute Zeit für die Bearbeitung der Aufgaben in diesem Abschnitt.',
      description: ''
    },
    'booklet_msgTimerStarted': {
      defaultvalue: 'Die Bearbeitungszeit für diesen Abschnitt hat begonnen: ',
      description: ''
    },
    'booklet_msgTimerCancelled': {
      defaultvalue: 'Die Bearbeitung des Abschnittes wurde abgebrochen.',
      description: ''
    },
    'booklet_msgTimeOver': {
      defaultvalue: 'Die Bearbeitung des Abschnittes ist beendet.',
      description: ''
    },
    'booklet_warningLeaveTimerBlockTitle': {
      defaultvalue: 'Aufgabenabschnitt verlassen?',
      description: ''
    },
    'booklet_warningLeaveTimerBlockPrompt': {
      defaultvalue: 'Wenn du jetzt weiterblätterst, beendest ' +
        'du vorzeitig die Bearbeitung dieses Aufgabenabschnitts und du kannst nicht mehr zurück.',
      description: ''
    },
    'login_trialmodeText': {
      defaultvalue: 'Ausführungsmodus "trial": Navigationsbeschränkungen sowie Zeit-Beschränkungen, ' +
        'die eventuell für das Testheft oder bestimmte Aufgaben festgelegt wurden, gelten nicht.',
      description: ''
    },
    'login_reviewmodeText': {
      defaultvalue: 'Ausführungsmodus "review": Beschränkungen für Zeit und Navigation sind nicht wirksam. Antworten werden ' +
        'nicht gespeichert. Sie können Kommentare über das Menü oben rechts speichern.',
      description: ''
    }
  }
};
