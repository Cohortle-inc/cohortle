# Seed Roles and Permissions in Production
# This script should be run on the production server

Write-Host "Seeding roles and permissions..." -ForegroundColor Cyan
npx sequelize-cli db:seed --seed 20260304000000-seed-roles-and-permissions.js

Write-Host "Done! Roles and permissions have been seeded." -ForegroundColor Green
