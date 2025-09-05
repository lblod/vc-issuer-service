FROM local-js-template
RUN apt update && apt install -y wget build-essential
LABEL maintainer="karel kremer <karel.kremer@redpencil.io>"

# see https://github.com/mu-semtech/mu-javascript-template for more info
