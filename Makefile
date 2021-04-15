run:
	docker-compose -f docker/docker-compose.yml up

run-detached:
	docker-compose -f docker/docker-compose.yml up -d

stop:
	docker-compose -f docker/docker-compose.yml stop

down:
	docker-compose -f docker/docker-compose.yml down

build:
	docker-compose -f docker/docker-compose.yml build

test-unit:
	docker-compose -f docker/docker-compose.yml exec -T testcenter-frontend-dev ng test --watch=false

test-e2e:
	docker-compose -f docker/docker-compose.yml exec -T testcenter-frontend-dev ng e2e --webdriver-update=false --port 4202

init-dev-config:
	cp src/environments/environment.dev.ts src/environments/environment.ts

tag-major:
	scripts/new_version.py major

tag-minor:
	scripts/new_version.py minor

tag-patch:
	scripts/new_version.py patch
