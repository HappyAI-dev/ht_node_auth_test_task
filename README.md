# Это репозиторий тестового задания на позицию Middle Backend Dev в HypeTrain
- Ниже документация по структуре репозитория
- Задание находится в TASK.md
- Подробные требования к кандидату находятся в REQUIREMENTS.md

Обратите внимание, что текущий репозиторий  тестовый/демонстрационный каркас (с CQRS, DDD-слоями и Event-driven логикой). В production очевидно используются более строгие настройки, полноценные миграции, логи через централизованный сервис, транзакционность и т.д. Здесь мы даём вам основу, чтобы вы могли продемонстрировать владение архитектурными паттернами NestJS и умение дорабатывать функционал. Все шероховатости (как synchronize: true, отсутствие тестов) сделаны намеренно для упрощения теста.


# ⚠️ Процесс выполнения и сдачи задания
1. Сделать fork репозитория
2. Выполнить задание в отфорканном репозитории в уже созданной кодовой базе
3. Кинуть PR на основной репозиторий
4. Написать в тг @dimatatatarin

# HypeTrain Backend Authentication Service

This repository contains a Node.js authentication service built with NestJS, TypeORM, and PostgreSQL, featuring a referral system with levels and streaks.

## Project Overview

The project implements a modern authentication system with the following features:

- JWT-based authentication and authorization
- PostgreSQL database integration with TypeORM
- Referral system with levels and bonuses
- Streak system for encouraging daily referrals
- Domain-Driven Design (DDD) and CQRS architecture

## Project Structure

```
.
├── src/
│   ├── application/      # Application layer (use cases, services)
│   │   ├── auth/         # Authentication module with services and handlers
│   │   └── user/         # User-related functionality
│   ├── domain/           # Domain layer (business logic, models)
│   │   └── models/       # Domain models
│   ├── infrastructure/   # Infrastructure layer (implementations)
│   │   ├── database/     # Database configuration
│   │   └── stores/       # Data access repositories
│   └── web-api/          # HTTP interface and controllers
│       ├── controllers/  # API controllers
│       └── modules/      # API modules
├── test/                 # Integration tests
└── scripts/              # Utility scripts
```

## Technology Stack

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Docker
- JWT Authentication

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Node.js 16+ for local development

### Running with Docker

1. Clone the repository
2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
3. Start the application with Docker Compose:
   ```bash
   docker-compose up -d
   ```

The API will be available at http://localhost:3000

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Ensure a PostgreSQL database is running
3. Update environment variables in `.env`
4. Run the application:
   ```bash
   npm run start:dev
   ```

## Testing

The project contains various test suites to ensure functionality works correctly:

### Running All Tests

Use the custom test script that correctly resolves module aliases:

```bash
npm run test:custom
```

### Running Specific Tests

To run only the referral controller tests:

```bash
npm run test:referral
```

To run any specific test file:

```bash
npx jest --config jest.config.js path/to/test-file.spec.ts
```

### Test Coverage

Run tests with coverage:

```bash
npm run test:cov
```

## Referral System

The referral system is a key feature of the application:

### Components

1. **Referral Codes**
   - Each user receives a unique referral code upon registration
   - Users can share their code to invite others

2. **Referral Levels**
   - Level 1 (default): Awards 100 credits + streak bonus per referral
   - Level 2 (after 3 successful referrals): Awards 150 credits + streak bonus per referral

3. **Streak System**
   - Sequential referrals on consecutive days increase the "streak" counter
   - Missing a day resets the streak back to 1
   - Current streak value adds to the referral bonus

4. **Credits**
   - Internal currency awarded for referrals
   - Referred users always receive 100 credits
   - Referrers receive bonuses based on their level and streak

### Test Suites

Various test suites cover the referral system functionality:

1. **Unit Tests**
   - `user.model.spec.ts` - Tests for user model and bonus calculation
   - `referral.service.spec.ts` - Tests for referral service
   - `referral-levels.service.spec.ts` - Tests for referral level logic
   - `referral-streak.service.spec.ts` - Tests for streak logic

2. **API Tests**
   - `referral.controller.spec.ts` - Tests for referral API endpoints

## Architecture

The project follows Clean Architecture principles with distinct layers:

1. **Domain Layer** - Core business logic and entities
2. **Application Layer** - Commands, queries, and services
3. **Infrastructure Layer** - Database repositories and external integrations
4. **Web API Layer** - REST endpoints and controllers

The separation of concerns allows for better maintainability and testability.
