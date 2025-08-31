# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cypress E2E testing project based on the [OptimumQA Cypress Boilerplate](https://github.com/optimumqa/cypress-boilerplate). It provides a pre-configured, multi-product and multi-environment testing framework for the Viernes application with comprehensive reporting capabilities.

## Boilerplate Architecture

This project follows the OptimumQA boilerplate conventions:

- **Product-based organization**: Tests are organized by "products" (viernes in this case)
- **Environment-agnostic design**: Same test suite runs across multiple environments
- **Configuration-driven**: Environment-specific settings via fixtures and configs
- **Command naming pattern**: `{product}-{environment}` (e.g., `viernes-staging`)

## Environment Configuration

The project supports three environments:

- **Development**: `http://localhost:3000`
- **Staging**: `https://staging.viernes.app`
- **Production**: `https://viernes.app`

Environment-specific configuration is managed through fixtures in `cypress/fixtures/viernes/{environment}/` directories.

## Common Commands

### Running Tests

```bash
# Development environment (headless)
npm run viernes-development

# Staging environment (headless)
npm run viernes-staging

# Production environment (headless)
npm run viernes-production

# Development environment (interactive)
npm run viernes-development-open
```

### Reporting

```bash
# Generate Mochawesome reports
npm run mocha.combine-reports
npm run mocha.generate-report

# Generate Allure reports
npm run allure.report
npm run allure.start

# Clear reports and assets
npm run mocha.clear
npm run allure.clear
npm run assets.clear
```

### Code Quality

```bash
# Format code with Prettier
npm run prettify

# Add new project/product (uses hygen templates)
npm run add-project
```

### Development Workflow

When adding new tests or products:

1. Use `npm run add-project` to generate boilerplate structure
2. Configure routes in `cypress/fixtures/{product}/{env}/routes.json`
3. Set up users in `cypress/fixtures/{product}/{env}/users.json`
4. Add test scripts following the pattern: `{product}-{environment}`

## Architecture

### Key Dependencies (OptimumQA Ecosystem)

- **@optimumqa/cypress-setup-utilities**: Core Cypress configuration and utilities
- **@optimumqa/cypress-store**: State management and data persistence for tests
- **@shelex/cypress-allure-plugin**: Allure reporting integration
- **cypress-plugin-steps**: Step-based test reporting
- **hygen**: Template-based code generation for new projects

### Directory Structure

- `cypress/e2e/viernes/`: Test specifications
- `cypress/fixtures/viernes/{env}/`: Environment-specific data (routes.json, users.json)
- `cypress/support/`: Custom commands and helpers
- `cypress/plugins/`: Plugin configuration
- `_templates/`: Hygen templates for code generation

### Helper System (Boilerplate Utilities)

The `cypress/support/helpers.ts` provides boilerplate utilities:

- `getFixture(fileName)`: Loads environment-specific fixture data with fallback support
- `getUrl(name)`: Resolves URLs from routes configuration (baseUrl + paths)
- `routes`: Current environment routes from fixtures
- `users`: Environment-specific user credentials with local override support
- Environment variables can override fixture data (PRIMARY_USER, SECONDARY_USER, etc.)

### Configuration Patterns (OptimumQA Standard)

The project follows OptimumQA configuration conventions:

- **Fixtures structure**: `cypress/fixtures/{product}/{environment}/{dataType}.json`
- **Environment variables**: `PRODUCT`, `ENV` set by test commands
- **User overrides**: `users.local.json` for local development credentials
- **Routes configuration**: Shared `commonPaths` + environment-specific paths

### Configuration System

- Base URL and environment are set via Cypress environment variables
- TypeScript paths are configured for `@support/*` and `@fixtures/*` aliases
- Multi-reporter setup combines Mochawesome and Allure reporting
- Viewport set to 1920x1080 with 30-second timeouts
- Chrome web security disabled for testing flexibility

### Plugin Architecture

Plugins are configured in `cypress/plugins/index.ts` and integrate:

- OptimumQA utilities for enhanced Cypress functionality
- Allure reporting writer
- Custom store management for test data persistence

## Boilerplate Best Practices

### Adding New Products

When extending this project for additional products:

1. Run `npm run add-project` and follow the prompts
2. Update package.json scripts with new `{product}-{environment}` commands
3. Configure environment-specific fixtures in the generated structure

### Environment Management

- Use `users.local.json` for local development to avoid committing credentials
- Environment variables (PRIMARY_USER, etc.) override fixture data
- Routes support both common paths and environment-specific overrides

### Test Organization

- Follow the product-based directory structure
- Use the helper utilities for consistent environment handling
- Leverage the boilerplate's multi-reporter system for comprehensive test results
