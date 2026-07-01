#!/bin/bash

# Seed Roles and Permissions in Production
# This script should be run on the production server

echo "Seeding roles and permissions..."
npx sequelize-cli db:seed --seed 20260304000000-seed-roles-and-permissions.js

echo "Done! Roles and permissions have been seeded."
