# GuardianLink Full-Stack Application Makefile

.PHONY: install install-client install-server dev dev-client dev-server build clean help

# Default target
help:
	@echo "Available commands:"
	@echo "  install       - Install dependencies for both client and server"
	@echo "  install-client - Install client dependencies only"
	@echo "  install-server - Install server dependencies only"
	@echo "  dev           - Start both client and server in development mode"
	@echo "  dev-client    - Start client development server only"
	@echo "  dev-server    - Start server only"
	@echo "  build         - Build client for production"
	@echo "  clean         - Clean node_modules and build artifacts"
	@echo "  help          - Show this help message"

# Install dependencies
install: install-client install-server

install-client:
	@echo "Installing client dependencies..."
	cd client && npm install

install-server:
	@echo "Installing server dependencies..."
	cd server && npm install

# Development commands
dev:
	@echo "Starting full-stack development environment..."
	@echo "Client will be available at http://localhost:5173"
	@echo "Server will be available at http://localhost:3000 (or your configured port)"
	@echo "Press Ctrl+C to stop both services"
	@trap 'kill %1; kill %2' SIGINT; \
	cd server && npm start & \
	cd client && npm run dev & \
	wait

dev-client:
	@echo "Starting client development server..."
	cd client && npm run dev

dev-server:
	@echo "Starting server..."
	cd server && npm start

# Build for production
build:
	@echo "Building client for production..."
	cd client && npm run build

# Cleanup
clean:
	@echo "Cleaning up..."
	rm -rf client/node_modules
	rm -rf server/node_modules
	rm -rf client/dist
	@echo "Cleanup complete"
