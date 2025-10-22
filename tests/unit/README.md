# 🧪 Tests Unitarios

Esta carpeta está destinada para tests unitarios de componentes React y funciones individuales.

## 📋 Planificación

### Componentes a testear
- [ ] `components/ui/Button.tsx`
- [ ] `components/ui/Input.tsx`
- [ ] `components/ui/Card.tsx`
- [ ] `components/ui/Toast.tsx`

### Context a testear
- [ ] `AuthContext.tsx`
- [ ] `RoleContext.tsx`

### Utilidades a testear
- [ ] `lib/api.ts`
- [ ] `lib/config.ts`

## 🛠️ Setup Futuro

### Dependencias necesarias
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

### Configuración Jest
Archivo `jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

## 📝 Ejemplo de Test

```typescript
import { render, screen } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button', () => {
  it('renders a button', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })
})
```