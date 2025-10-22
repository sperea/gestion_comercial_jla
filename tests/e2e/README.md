# 🌐 Tests End-to-End (E2E)

Esta carpeta está destinada para tests end-to-end que prueban flujos completos de usuario en el navegador.

## 📋 Planificación

### Flujos a testear
- [ ] Flujo completo de login
- [ ] Flujo de recuperación de contraseña
- [ ] Actualización de perfil con imagen
- [ ] Navegación entre páginas protegidas
- [ ] Sistema de roles y permisos
- [ ] Logout y limpieza de sesión

## 🛠️ Herramientas Planificadas

### Playwright (Recomendado)
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Cypress (Alternativa)
```bash
npm install --save-dev cypress
npx cypress open
```

## 📝 Ejemplo de Test E2E

```typescript
import { test, expect } from '@playwright/test'

test('login flow', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  
  await page.fill('[data-testid="email"]', 'sperea@jlaasociados.es')
  await page.fill('[data-testid="password"]', 'jla')
  await page.click('[data-testid="login-button"]')
  
  await expect(page).toHaveURL('http://localhost:3000/dashboard')
  await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
})
```

## 🚀 Configuración Futura

### playwright.config.ts
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```