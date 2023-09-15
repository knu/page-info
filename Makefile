.PHONY: all zip

NAME?=		$(shell jq -r .name package.json)
VERSION?=	$(shell jq -r .version manifest.json)
ZIP_FILE?=	$(NAME)-$(VERSION).zip

all:
	npm run build

zip: all
	@rm -rf $(ZIP_FILE)
	@rsync -a --delete dist/ $(NAME)/
	zip -r $(ZIP_FILE) $(NAME)
	@rm -rf $(NAME)
