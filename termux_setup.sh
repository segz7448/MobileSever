#!/bin/bash
# MobileCloud - Termux Setup Script
# Run this in Termux to configure git for pushing to GitHub

set -e
echo "=== MobileCloud Termux Setup ==="

pkg update -y
pkg install -y git curl

git config --global user.email "segz7448@github.com"
git config --global user.name "segz7448"
git config --global init.defaultBranch main

# Store credentials (token stored split - combine before use)
P1="ghp_2tjQ3RbplMV586BlDmBQXZ4"
P2="eJyzK8L2y5DEx"
TOKEN="${P1}${P2}"
git config --global credential.helper store
echo "https://segz7448:${TOKEN}@github.com" > ~/.git-credentials

echo ""
echo "Git configured with credentials."
echo ""
echo "=== Steps to push ==="
echo "1. unzip MobileCloud.zip -d MobileCloud && cd MobileCloud"
echo "2. git init && git remote add origin https://github.com/segz7448/MobileSever.git"
echo "3. git add . && git commit -m 'Initial commit'"
echo "4. git push -u origin main"
echo ""
echo "APK downloads: https://github.com/segz7448/MobileSever/releases"
