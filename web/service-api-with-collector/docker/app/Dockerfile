ARG GO_VERSION=1.25.6-alpine

FROM golang:${GO_VERSION} AS builder

ARG GO_OS=linux
ARG GO_ARCH=amd64
ARG GO_PROXY=https://goproxy.io,direct

WORKDIR /app

COPY src/go.mod src/go.sum ./

RUN go env -w GOPROXY=${GO_PROXY} && go mod download

COPY src/ .

RUN CGO_ENABLED=0 GOOS=${GO_OS} GOARCH=${GO_ARCH} go build -a -o app-server ./cmd/server/

FROM alpine:latest

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app/

COPY --from=builder --chown=appuser:appgroup /app/app-server .
COPY --from=builder --chown=appuser:appgroup /app/.env .
COPY --from=builder --chown=appuser:appgroup /app/templates ./templates

RUN chmod +x /app/app-server

USER appuser

CMD ["./app-server"]



