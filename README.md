# Это репозиторий тестового задания на позицию Middle Backend Dev в HypeTrain
- Ниже документация по структуре репозитория
- Задание находится в TASK.md
- Подробные требования к кандидату находятся в REQUIREMENTS.md

# !Процесс выполнения и сдачи задания!
1. Сделать fork репозитория
2. Выполнить задание в уже созданной кодовой базе
3. Написать в тг @dimatatatarin

# Node Authentication Service

This project is a Node.js authentication service built using NestJS framework with TypeScript, following Domain-Driven Design (DDD) and CQRS principles.

## Project Structure

```
.
├── src/
│   ├── application/       # Application layer (use cases, commands, queries)
│   ├── domain/           # Domain layer (business logic, models)
│   ├── infrastructure/   # Infrastructure layer (implementations)
│   └── web-api/         # HTTP interface and controllers
├── libs/                # Shared libraries and utilities
├── scripts/            # Utility scripts
└── logs/              # Application logs
```

## Technology Stack

- Node.js
- NestJS
- TypeScript
- Docker
- PostgreSQL
- JWT for authentication

### Authentication Flow
1. User registration
2. User login with JWT tokens
3. Profile management
4. Role-based access control

## Architecture

The project follows Clean Architecture principles with distinct layers:

### Domain Layer (`src/domain/`)
- Core business logic and entities
- Business rules and domain models

### Application Layer (`src/application/`)
- Commands: Write operations (registration, login)
- Queries: Read operations
- Events: Domain events and handlers
- Services: Application services

### Infrastructure Layer (`src/infrastructure/`)
- Database repositories
- External service integrations
- Framework implementations

### Web API Layer (`src/web-api/`)
- REST endpoints
- Request/Response handling
- Route configurations

## Design Patterns

1. **CQRS Pattern**
   - Separate command and query operations
   - Event-driven architecture

2. **Repository Pattern**
   - Clean data access abstraction
   - Transaction management

3. **Event-Driven Architecture**
   - Async processing of side effects
   - Separate handlers for different concerns

## Setup and Configuration

1. Copy `.env.example` to `.env` and configure variables
2. Run with Docker: `docker-compose up`
