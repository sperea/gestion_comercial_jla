# 🔗 Tests de Integración

Esta carpeta está destinada para tests de integración que prueban la interacción entre múltiples componentes y servicios.

## 📋 Planificación

### Integraciones a testear
- [ ] Frontend ↔ Backend API
- [ ] Context Providers ↔ Components
- [ ] Authentication ↔ Protected Routes
- [ ] Form Components ↔ API Calls
- [ ] Toast System ↔ User Actions

## 🛠️ Enfoque

### API Integration Tests
Tests que verifican la correcta comunicación entre frontend y backend:
- Manejo de errores de red
- Transformación de datos
- Estados de loading
- Cache y actualización de datos

### Component Integration Tests  
Tests que verifican cómo interactúan múltiples componentes:
- Context providers con componentes hijos
- Forms con validación y envío
- Navigation entre rutas protegidas
- State management across components

## 📝 Ejemplo de Test de Integración

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/context/AuthContext'
import LoginPage from '@/app/login/page'

// Mock del API
jest.mock('@/lib/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}))

describe('Login Integration', () => {
  it('should login user and redirect to dashboard', async () => {
    const mockLogin = jest.mocked(authAPI.login)
    mockLogin.mockResolvedValue({
      user: { id: 1, username: 'testuser' },
      access_token: 'fake-token'
    })

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password')
    })
  })
})
```

## 🚀 Setup Futuro

### Dependencias
```bash
npm install --save-dev @testing-library/react @testing-library/user-event msw
```

### Mock Service Worker (MSW)
Para simular APIs en tests:
```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({ user: { id: 1 }, access_token: 'token' }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```