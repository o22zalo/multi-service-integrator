#!/bin/sh
# Path: /scripts/generate-encryption-key.sh
# Module: Key Generator
# Depends on: openssl
# Description: Generates ENCRYPTION_KEY and ENCRYPTION_IV_SALT values for .env.

echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "ENCRYPTION_IV_SALT=$(openssl rand -hex 16)"
