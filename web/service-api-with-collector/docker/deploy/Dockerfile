FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    git \
    sshpass \
    openssh-client \
    make \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    ansible \
    ansible-lint \
    jmespath

WORKDIR /ansible