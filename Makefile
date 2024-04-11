help: ## Display this help screen
	@grep -h \
		-E '^[a-zA-Z_0-9-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

login_db: ## if need use pswd: notsecurepassword
	@psql -h localhost -U postgres -p 5433

start_local: ## run explorer with local db
	@docker compose -f docker-compose-local.yaml up -d

start: ## run explorer with external db
	@docker compose -f docker-compose.yaml up -d


clear: ## clear docker
	docker compose down --volumes
	docker compose pull


.PHONY: clippy fmt test
