curl -X POST http://localhost:3000/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJmNGVmNTJlOC0wOGNhLTQ0ZGYtODdlNi0xZTY5MTJlNGQyNWQiLCJleHAiOjE3OTAwMTc5ODV9.33grjYt_oqA3BLhi9KYIS2-2hDpC4XFhlVm6344ug9k" \
  -d '{"name": "Obsidian Plugin"}'