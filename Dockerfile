FROM semtech/mu-javascript-template:1.9.0
RUN apt update && apt install -y wget build-essential
LABEL maintainer="karel kremer <karel.kremer@redpencil.io>"

# see https://github.com/mu-semtech/mu-javascript-template for more info
