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

# TODO does not wait for server to start and fails
# test: run-detached test-unit test-e2e stop

test-unit:
	docker-compose -f docker/docker-compose.yml exec testcenter-frontend-dev ng test --watch=false

test-e2e:
	docker-compose -f docker/docker-compose.yml exec testcenter-frontend-dev ng e2e --webdriver-update=false --port 4202

build-image:
	docker build --target prod -t iqbberlin/testcenter-frontend -f docker/Dockerfile .

push-image:
	docker push iqbberlin/testcenter-frontend:latest

tag-major:
	scripts/new_version.py major

tag-minor:
	scripts/new_version.py minor

tag-patch:
	scripts/new_version.py patch
