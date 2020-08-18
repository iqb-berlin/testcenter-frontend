run:
	docker-compose -f docker/docker-compose.yml up

run-detached:
	docker-compose -f docker/docker-compose.yml up -d

stop:
	docker-compose -f docker/docker-compose.yml stop

down:
	docker-compose -f docker/docker-compose.yml down

# TODO does not wait for server to start and fails
# test: run-detached test-unit test-e2e stop

test-unit:
	docker-compose -f docker/docker-compose.yml exec testcenter-frontend-dev ng test --watch=false

# TODO fails for yet unknown reason
# test-e2e:
# 	docker-compose -f docker/docker-compose.yml exec testcenter-frontend-dev ng e2e --webdriver-update=false --port 4202

init-dev-config:
	cp src/environments/environment.dev.ts src/environments/environment.ts

init-prod-docker-config:
	cp src/environments/environment.prod.docker.ts src/environments/environment.ts
