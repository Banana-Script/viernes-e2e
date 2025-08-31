# Viernes E2E Testing

Proyecto de pruebas E2E para Viernes usando Cypress con configuración multi-ambiente.

## Instalación

```bash
npm install
```

## Configuración

El proyecto está configurado para ejecutar pruebas en múltiples ambientes:

- **Development**: `http://localhost:3000`
- **Staging**: `https://staging.viernes.app`
- **Production**: `https://viernes.app`

### Archivos de configuración

- `cypress/fixtures/viernes/development/routes.json` - URLs para desarrollo
- `cypress/fixtures/viernes/staging/routes.json` - URLs para staging
- `cypress/fixtures/viernes/production/routes.json` - URLs para producción
- `cypress/fixtures/viernes/development/users.json` - Usuarios de prueba

## Ejecución de pruebas

### Modo headless

```bash
# Desarrollo
npm run viernes-development

# Staging
npm run viernes-staging

# Producción
npm run viernes-production
```

### Modo interactivo

```bash
npm run viernes-development-open
```

## Estructura de pruebas

```
cypress/
├── e2e/
│   └── viernes/
│       └── sample.cy.ts     # Pruebas de ejemplo
├── fixtures/
│   └── viernes/
│       ├── development/
│       ├── staging/
│       └── production/
└── support/                 # Comandos personalizados
```

## Reportes

El proyecto incluye reportes con Mochawesome y Allure:

### Mochawesome
```bash
npm run mocha.combine-reports
npm run mocha.generate-report
```

### Allure
```bash
npm run allure.report
npm run allure.start
```

## Comandos útiles

```bash
# Limpiar reportes
npm run mocha.clear
npm run allure.clear

# Limpiar assets
npm run assets.clear

# Formatear código
npm run prettify
```