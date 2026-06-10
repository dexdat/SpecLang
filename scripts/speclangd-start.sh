#!/bin/bash
cd "$(dirname "$0")/.."
npx tsx .speclang/daemon.spec.ts specs/
