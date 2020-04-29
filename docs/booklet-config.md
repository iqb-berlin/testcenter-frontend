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

#### `log_mode`
Erfassen und Speichern von Log-Daten
  * "OFF": Ausgeschaltet
  * "LEAN": Nur wichtige Meldungen
  * "RICH" (default): Alles

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
  * "OFF": Ausgeschaltet
  * "ENABLED_ONLY" (default): Eingeschaltet - nur die Aufgaben anzeigen, die noch freigegeben sind
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
