run:
	docker-compose -f docker/docker-compose.yml up

run-detached:
	docker-compose -f docker/docker-compose.yml up -d

stop:
	docker-compose -f docker/docker-compose.yml stop

down:
	docker-compose -f docker/docker-compose.yml down

test: run-detached test-units test-e2e stop

test-unit:
	docker-compose -f docker/docker-compose.yml exec testcenter-frontend-dev ng test --watch=false

test-e2e:
	docker-compose -f docker/docker-compose.yml exec testcenter-frontend-dev ng e2e --webdriver-update=false --port 4202
