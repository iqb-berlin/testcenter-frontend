# Booklet config
There are some configuration parameters for adjusting the behaviour during the test.This 
document describes the ways to bring the parameters to the application and lists
all possible keys.
 
### Configuration file on the server
There is one file on the server where the application looks for booklet definitions:
```
/config/bookletDefintions.json
``` 
This configuration is loaded at (re)start of the application and is applied for 
all booklets, if no other configuration is found. This is a simple JSON file with 
key value pairs. Example:
```
{
    "force_responses_complete": "OFF",
    "unit_navibuttons": "ARROWS_ONLY",
...
}
```
The adminstrator of the server can upload this file. We aim at providing an 
administration feature of the super-admin section of the application to manage 
this configuration.

### Configuration via booklet XML
The configuration can be set for every single booklet. You need to add one XML-Element 
into the booklet-file. Example:
```
...
</Metadata>
<BookletConfig>
    <Config key="force_responses_complete">OFF</CustomText>
    <Config key="unit_navibuttons">ARROWS_ONLY</CustomText>
...
</BookletConfig>
```

### List of parameters

#### `loading_mode`
Ladeverhalten beim Start
  * "LAZY" (default): Start sobald wie möglich, Laden im Hintergrund fortsetzen
  * "EAGER": Testheft erst dann starten, wenn alle Inhalte geladen sind

#### `logPolicy`
Erfassen und Speichern von Log-Daten
  * "disabled": Ausgeschaltet
  * "lean": Nur wichtige Meldungen
  * "rich" (default): Alles außer debug-informationen
  * "debug": Auch debug-informationen

#### `pagingMode`
pagingMode (https://verona-interfaces.github.io/player/#operation-publish-vopStartCommand)
  * "separate" (default): pages are separated
  * "concat-scroll": concat-scroll
  * "concat-scroll-snap": concat-scroll-snap

#### `stateReportPolicy`
stateReportPolicy (https://verona-interfaces.github.io/player/#operation-publish-vopStartCommand)
  * "none": pages are separated
  * "eager" (default): concat-scroll
  * "on-demand": concat-scroll-snap

#### `page_navibuttons`
Navigationsbuttons für die Seitennavigation (innerhalb einer Aufgabe)
  * "OFF": Keine Seitennavigation unterstützen (übernimmt ggf. die Aufgabe selbst)
  * "MERGED": Die Seitennavigation wird durch die Aufgabennavigation mit übernommen
  * "SEPARATE_TOP": Seitennavigation über getrennte Button-Leiste - oben
  * "SEPARATE_BOTTOM" (default): Seitennavigation über getrennte Button-Leiste - unten

#### `unit_navibuttons`
Navigationsbuttons für die Navigation zwischen den Aufgaben
  * "OFF": Keine Buttons für Aufgabennavigation anzeigen (übernimmt ggf. die Aufgabe selbst)
  * "ARROWS_ONLY": Nur die Buttons für 'Weiter' und 'Zurück' anzeigen
  * "FULL" (default): Buttons für 'Weiter' und 'Zurück' und dazwischen kleine Buttons für jede Aufgabe anzeigen

#### `unit_menu`
Extra-Seite mit großen Buttons für Aufgaben zum direkten Springen
  * "OFF" (default): Ausgeschaltet
  * "ENABLED_ONLY": Eingeschaltet - nur die Aufgaben anzeigen, die noch freigegeben sind
  * "FULL": Eingeschaltet - auch die Aufgaben anzeigen, die nicht mehr freigegeben sind (gegraut)

#### `force_presentation_complete`
Verhalten, wenn noch nicht alle Elemente der Aufgabe angezeigt wurden
  * "OFF" (default): Ignorieren - Weiterblättern möglich
  * "ON": Weiterblättern verhindern, bis Anzeige vollständig

#### `force_responses_complete`
Verhalten, wenn noch nicht alle Antworten der Aufgabe vollständig gegeben wurden
  * "OFF" (default): Ignorieren - Weiterblättern möglich
  * "SOME": Weiterblättern erst möglich, wenn einige Antworten gegeben wurden
  * "COMPLETE": Weiterblättern erst möglich, wenn alle Antworten gegeben wurden
  * "COMPLETE_AND_VALID": Weiterblättern erst möglich, wenn alle Antworten gegeben wurden und als gültig eingeschätzt wurden

#### `unit_screenheader`
Legt fest, ob im obersten Seitenbereich Platz für Logo, Navigations-Buttons u. ä. gelassen wird.
  * "OFF": Kein Seitenkopf. Achtung: Logo bleibt sichtbar (überlappt).
  * "WITH_UNIT_TITLE": Seitenkopf wird angezeigt mit Titel der Unit (s. Booklet-XML)
  * "WITH_BOOKLET_TITLE": Seitenkopf wird angezeigt mit Titel des Booklets (s. Booklet-XML)
  * "EMPTY" (default): Seitenkopf wird angezeigt (leer)

#### `unit_title`
Festlegung, ob oberhalb des Unitbereiches eine Zeile mit dem Unit-Titel gezeigt werden soll
  * "OFF": Keine Titelzeile
  * "ON" (default): Eine Zeile wird eingeblendet mit dem Unit-Titel (s. Booklet-XML).

#### `unit_show_time_left`
Festlegung, ob im obersten Seitenbereich bei einer festgelegten Maximalzeit für einen Testbereich die verbleibende Zeit angezeigt wird.
  * "OFF" (default): Die verbleibende Zeit wird nicht angezeigt.
  * "ON": Die verbleibende Zeit wird angezeigt.

#### `show_end_button_in_player`
Manche Player können einen Test-Beenden anzeigen, wenn es es ihnen vom Testcenter erlaubt wird. Diese Einstellung legt fest, wann das der Fall ist.
  * "OFF" (default): Den Test-Beenden-Button im Player nie anzeigen.
  * "ALWAYS": Den Test-Beenden-Button im Player immer anzeigen.
  * "ONLY_LAST_UNIT": Den Test-Beenden-Button im Player nur in der letzten Unit anzeigen.

#### `restore_current_page_on_return`
Legt fest, ob, wenn (z. B.) nach einem Neuladen eine Unit wieder geöffnet wird, zur letzten geöffneten Seite gesprungen werden soll.
  * "OFF" (default): Beim Zurückkehren zur Unit auf Seite 1 beginnen.
  * "ON": Beim Zurückkehren zur Unit auf der letzten gesehenen Seite beginnen.
