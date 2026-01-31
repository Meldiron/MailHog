#
# MailHog Dockerfile
#

FROM golang:1.18-alpine AS builder

# Install git for go build
RUN apk --no-cache add --virtual build-dependencies git

# Set working directory
WORKDIR /go/src/github.com/mailhog/MailHog

# Copy source code
COPY . .

# Build MailHog using vendored dependencies
ENV GO111MODULE=off
RUN go build -v -o MailHog -ldflags "-X main.version=dev" .

FROM alpine:3

# Add mailhog user/group with uid/gid 1000.
# This is a workaround for boot2docker issue #581, see
# https://github.com/boot2docker/boot2docker/issues/581
RUN adduser -D -u 1000 mailhog

# Copy the binary from builder
COPY --from=builder /go/src/github.com/mailhog/MailHog/MailHog /usr/local/bin/

USER mailhog

WORKDIR /home/mailhog

ENTRYPOINT ["MailHog"]

# Expose the SMTP and HTTP ports:
EXPOSE 1025 8025