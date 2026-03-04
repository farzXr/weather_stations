#!/bin/bash

ssh-keygen -t rsa -b 4096 -f ssh/root_id_rsa -C "root@bootstrap" -N ""
echo "Ключ для root создан"

ssh-keygen -t ed25519 -f ssh/ansible_id_rsa -C "ansible@production" -N ""
echo "Ключ для ansible создан"

echo "Ключи сгенерированы и положены в папку ssh"