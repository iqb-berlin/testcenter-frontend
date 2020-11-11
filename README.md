[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Travis (.com)](https://img.shields.io/travis/com/iqb-berlin/testcenter-frontend?style=flat-square)](https://travis-ci.com/iqb-berlin/verona-player-testbed)
![GitHub package.json version](https://img.shields.io/github/package-json/v/iqb-berlin/testcenter-frontend?style=flat-square)

# Testcenter Frontend

Diese Angular-Programmierung ist die clientseitige Web-Anwendung für das Online-Testen des IQB. Über diesen Weg wird die Programmierung allen Interessierten zur Verfügung gestellt. Eine Anleitung zum Installieren und Konfigurieren wird schrittweise an dieser Stelle folgen.

***

This is the frontend of the IQB Testcenter application. It's written in Typescript using Angular 9.

You can find the backend [here](https://github.com/iqb-berlin/testcenter-backend).

The repository for a complete setup of the application can be found [here](https://github.com/iqb-berlin/testcenter-setup).


## Installation

### With Docker (recommended)

All the necessary commands for running the application and starting the tests
can be found in the Makefile on the root directory.

###### Start and Stop the server
```
make run
make stop
```
###### Run tests
```
make test
```
###### The 2 types of tests can also be run separately.
```
make test-unit
make test-e2e
```

There is also a Dockerfile for producing a production ready container
using nginx as base, under `docker/Dockerfile-prod`.

### Manual Compilation
#### Prerequisites
* node 12+

#### Compilation Steps

```
npm install
ng build --prod
```

Find the compiled app in src folder and open in Browser or serve with `ng serve`.


## Development
### Coding Standards
We are using ESLint with the [airbnb](https://github.com/iqb-berlin/testcenter-setup) coding standard as base.

## Bug Reports

File bug reports, feature requests etc. [here](https://github.com/iqb-berlin/testcenter-frontend/issues).
