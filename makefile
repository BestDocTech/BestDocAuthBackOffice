start-backend:
	cd backoffice/backend && npm install && npm run dev

start-demo:
	cd demo && docker compose up -d

start-backoffice:
	cd backoffice && npx -y http-server -p 8000

start:
	make start-backend
	make start-demo
	make start-backoffice