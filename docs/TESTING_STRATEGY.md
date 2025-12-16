# Testing Strategy & Coverage Guide

## Testing Pyramid

```
        ┌─────────────┐
        │   E2E Tests │  10%  (Critical user flows)
        └─────────────┘
       ┌───────────────┐
       │Integration Tests│  20%  (Component + API)
       └───────────────┘
      ┌─────────────────┐
      │   Unit Tests    │  70%  (Logic + Utils)
      └─────────────────┘
```

## Coverage Goals

- **Overall**: 80%+ coverage
- **Critical paths**: 100% (payment, data loss prevention)
- **Utility functions**: 90%+ (`lib/*`)
- **Business logic**: 85%+ (`services/*`, `hooks/*`)
- **UI components**: 70%+ (focus on behavior, not styling)

## Setup Instructions

### 1. Install Testing Dependencies

```bash
npm install -D \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @testing-library/react-hooks \
  jest \
  jest-environment-jsdom \
  @types/jest \
  firebase-tools \
  @google-cloud/vertexai
```

### 2. Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/app/layout.tsx', // Exclude boilerplate
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/lib/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom'

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  // ... other mocks
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}))
```

### 3. Update package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:e2e": "playwright test",
    "test:firebase": "firebase emulators:exec --only firestore,storage 'npm test'"
  }
}
```

## Test Structure

```
src/
├── lib/
│   ├── image.ts
│   └── __tests__/
│       └── image.test.ts          # Unit tests
├── hooks/
│   ├── useFoodItems.ts
│   └── __tests__/
│       └── useFoodItems.test.tsx  # Hook tests
├── components/
│   ├── Camera/
│   │   ├── CameraButton.tsx
│   │   └── __tests__/
│   │       └── CameraButton.test.tsx  # Component tests
└── app/
    └── api/
        └── gemini/
            ├── route.ts
            └── __tests__/
                └── route.test.ts      # API tests
```

## Test Examples

### 1. Unit Tests (lib/*)

```typescript
// src/lib/__tests__/image.test.ts
import { compressImage, validateImage, fileToBase64 } from '../image'

describe('Image Utilities', () => {
  describe('validateImage', () => {
    it('should accept valid JPEG file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const result = validateImage(file)
      expect(result.valid).toBe(true)
    })

    it('should reject files over 10MB', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })
      const result = validateImage(largeFile)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('10MB')
    })

    it('should reject invalid file types', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })
      const result = validateImage(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('JPEG, PNG, WebP')
    })
  })

  describe('compressImage', () => {
    it('should compress image below target size', async () => {
      // Create mock canvas
      const mockCanvas = document.createElement('canvas')
      mockCanvas.toBlob = jest.fn((callback) => {
        callback(new Blob(['compressed'], { type: 'image/jpeg' }))
      })

      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      })

      const compressed = await compressImage(file, 2)
      expect(compressed.size).toBeLessThanOrEqual(2 * 1024 * 1024)
    })
  })

  describe('fileToBase64', () => {
    it('should convert file to base64 string', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const base64 = await fileToBase64(file)

      expect(base64).toMatch(/^data:text\/plain;base64,/)
      expect(base64.length).toBeGreaterThan(0)
    })
  })
})
```

### 2. Hook Tests

```typescript
// src/hooks/__tests__/useFoodItems.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { useFoodItems } from '../useFoodItems'
import * as firebase from '@/lib/firebase'

jest.mock('@/lib/firebase')

describe('useFoodItems', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should add food item successfully', async () => {
    const mockUploadImage = jest.spyOn(firebase, 'uploadImage')
      .mockResolvedValue('https://example.com/image.jpg')

    const { result } = renderHook(() => useFoodItems())

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const newItem = await result.current.addFoodItem(
      'Apple',
      '2025-12-31',
      file,
      0.95
    )

    await waitFor(() => {
      expect(newItem).toMatchObject({
        product_name: 'Apple',
        expiry_date: '2025-12-31',
        confidence: 0.95,
      })
      expect(mockUploadImage).toHaveBeenCalledWith(file, expect.any(String))
    })
  })

  it('should handle add failure gracefully', async () => {
    jest.spyOn(firebase, 'uploadImage').mockRejectedValue(new Error('Upload failed'))

    const { result } = renderHook(() => useFoodItems())

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const newItem = await result.current.addFoodItem('Apple', '2025-12-31', file, 0.95)

    expect(newItem).toBeNull()
  })
})
```

### 3. Component Tests

```typescript
// src/components/Camera/__tests__/CameraButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import CameraButton from '../CameraButton'

describe('CameraButton', () => {
  it('should render camera button', () => {
    render(<CameraButton onClick={jest.fn()} />)
    const button = screen.getByRole('button', { name: /camera/i })
    expect(button).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<CameraButton onClick={handleClick} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<CameraButton onClick={jest.fn()} disabled />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should show loading spinner when loading', () => {
    render(<CameraButton onClick={jest.fn()} loading />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should have correct touch area size (56x56px minimum)', () => {
    render(<CameraButton onClick={jest.fn()} />)
    const button = screen.getByRole('button')
    const styles = window.getComputedStyle(button)

    expect(parseInt(styles.width)).toBeGreaterThanOrEqual(56)
    expect(parseInt(styles.height)).toBeGreaterThanOrEqual(56)
  })
})
```

### 4. Integration Tests (with Firebase Emulator)

```typescript
// src/context/__tests__/FoodContext.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { FoodProvider, useFoodContext } from '../FoodContext'
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'

let testEnv: RulesTestEnvironment

describe('FoodContext Integration', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        host: 'localhost',
        port: 8080,
      },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  it('should sync with Firestore in real-time', async () => {
    const TestComponent = () => {
      const { items } = useFoodContext()
      return <div>{items.length} items</div>
    }

    render(
      <FoodProvider>
        <TestComponent />
      </FoodProvider>
    )

    // Add item to Firestore
    const db = testEnv.authenticatedContext('user1').firestore()
    await db.collection('food_items').add({
      product_name: 'Apple',
      expiry_date: '2025-12-31',
      created_at: new Date(),
    })

    // Wait for real-time update
    await waitFor(() => {
      expect(screen.getByText('1 items')).toBeInTheDocument()
    })
  })
})
```

### 5. API Route Tests

```typescript
// src/app/api/gemini/__tests__/route.test.ts
import { POST } from '../route'
import { NextRequest } from 'next/server'
import * as gemini from '@/lib/gemini'

jest.mock('@/lib/gemini')

describe('Gemini API Route', () => {
  it('should return recognition result', async () => {
    const mockRecognize = jest.spyOn(gemini, 'recognizeFood').mockResolvedValue({
      product_name: 'Apple',
      expiry_date: '2025-12-31',
      confidence: 0.95,
    })

    const request = new NextRequest('http://localhost:3000/api/gemini', {
      method: 'POST',
      body: JSON.stringify({
        image: 'base64string',
        mimeType: 'image/jpeg',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.product_name).toBe('Apple')
    expect(mockRecognize).toHaveBeenCalled()
  })

  it('should return 400 for missing image', async () => {
    const request = new NextRequest('http://localhost:3000/api/gemini', {
      method: 'POST',
      body: JSON.stringify({ mimeType: 'image/jpeg' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

### 6. E2E Tests (Playwright)

```typescript
// e2e/food-recognition.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Food Recognition Flow', () => {
  test('should complete full capture and save flow', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Click camera button
    await page.click('[aria-label="Camera"]')

    // Upload image
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/apple.jpg')

    // Wait for AI recognition
    await expect(page.locator('text=Loading')).toBeVisible()
    await expect(page.locator('text=Confirm')).toBeVisible({ timeout: 10000 })

    // Edit product name
    await page.fill('input[name="productName"]', 'Red Apple')

    // Confirm
    await page.click('button:has-text("Confirm")')

    // Verify saved
    await expect(page.locator('text=Product saved successfully')).toBeVisible()

    // Navigate to inventory
    await page.click('a:has-text("Inventory")')

    // Verify item appears
    await expect(page.locator('text=Red Apple')).toBeVisible()
  })
})
```

## Running Tests

```bash
# Unit + Integration tests
npm test

# Watch mode (development)
npm run test:watch

# With coverage report
npm run test:coverage

# CI environment
npm run test:ci

# E2E tests
npm run test:e2e

# With Firebase emulator
npm run test:firebase
```

## Coverage Report

After running `npm run test:coverage`, open `coverage/lcov-report/index.html` to see detailed coverage:

```
File                          % Stmts  % Branch  % Funcs  % Lines
----------------------------------|---------|---------|---------|---------|
All files                         85.3    82.1     88.7    85.9
  lib/                            92.5    90.2     95.0    93.1
    image.ts                      94.2    91.5     100     94.8
    gemini.ts                     88.9    85.0     87.5    89.2
    date.ts                       100     100      100     100
  hooks/                          87.3    85.6     90.2    88.1
    useFoodItems.ts               87.3    85.6     90.2    88.1
  components/                     78.5    75.3     82.1    79.2
    Camera/CameraButton.tsx       85.2    80.0     88.9    86.1
```

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npx tsc --noEmit

      - name: Run tests with coverage
        run: npm run test:ci

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Start Firebase Emulator
        run: |
          npm install -g firebase-tools
          firebase emulators:start --only firestore,storage &

      - name: Run E2E tests
        run: npm run test:e2e
```

## Best Practices

1. **Write tests first** (TDD) for critical features
2. **Test behavior, not implementation** - Avoid testing internal state
3. **Use meaningful test descriptions** - "should X when Y"
4. **Mock external dependencies** - Don't call real APIs in tests
5. **Keep tests fast** - Unit tests < 50ms, Integration < 500ms
6. **Test edge cases** - Empty states, errors, boundary values
7. **Maintain test data fixtures** - Reusable mock data
8. **Review coverage reports** - Focus on uncovered branches

## Resources

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)
- [Playwright](https://playwright.dev/)
