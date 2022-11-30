
build:
	anchor build && npm run build
.PHONY: build

test:
	make build && anchor test
.PHONY: test

test-skip:
	anchor test --skip-local-validator
.PHONY: skip



test-devnet:
	make build && anchor test --provider.cluster devnet
.PHONY: test

deploy:
	make build && anchor deploy --provider.cluster devnet
.PHONY: deploy-dev
