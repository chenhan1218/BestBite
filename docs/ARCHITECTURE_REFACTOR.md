# Architecture Refactoring Guide

## Goal: Framework-Agnostic Design

### Current Issues
- UI components tightly coupled with Next.js
- Business logic mixed with presentation
- Direct Firebase calls in hooks
- Tailwind classes embedded in JSX

### Proposed Layer Structure

```
┌─────────────────────────────────────┐
│   UI Framework Layer (Replaceable)  │
│   React / Vue / Svelte / Angular    │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│   Presentation Adapters             │
│   (Hooks / Composables / Stores)    │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│   Core Business Logic (Pure TS)     │
│   Services / Use Cases              │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│   Data Access Layer                 │
│   Repositories / Adapters           │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│   External Services                 │
│   Firebase / Gemini / IndexedDB     │
└─────────────────────────────────────┘
```

## Step 1: Extract Services

### Before (Current)
```typescript
// hooks/useFoodItems.ts
export function useFoodItems() {
  const addFoodItem = async (...) => {
    // Direct Firebase calls
    const docRef = await addDoc(collection(db, 'food_items'), {...})
  }
}
```

### After (Refactored)
```typescript
// services/FoodItemService.ts
export class FoodItemService {
  constructor(
    private repository: IFoodItemRepository,
    private imageStorage: IImageStorage
  ) {}

  async addFoodItem(data: CreateFoodItemDTO): Promise<FoodItem> {
    const imageUrl = await this.imageStorage.upload(data.image)
    return this.repository.create({
      ...data,
      image_url: imageUrl,
    })
  }
}

// repositories/FoodItemRepository.ts
export interface IFoodItemRepository {
  create(data: FoodItemData): Promise<FoodItem>
  findAll(): Promise<FoodItem[]>
  delete(id: string): Promise<boolean>
}

export class FirestoreFoodItemRepository implements IFoodItemRepository {
  async create(data: FoodItemData): Promise<FoodItem> {
    const docRef = await addDoc(collection(db, 'food_items'), data)
    return { id: docRef.id, ...data }
  }
}

// hooks/useFoodItems.ts (becomes thin adapter)
export function useFoodItems() {
  const service = useFoodItemService() // DI container

  const addFoodItem = useCallback(async (...args) => {
    return service.addFoodItem(...args)
  }, [service])

  return { addFoodItem }
}
```

## Step 2: UI Component Abstraction

### Before
```typescript
// Component directly uses Tailwind + Next.js
import Image from 'next/image'

export default function FoodItemCard({ item }) {
  return (
    <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
      <Image src={item.image_url} alt={item.product_name} fill />
    </div>
  )
}
```

### After
```typescript
// ui/primitives/Card.tsx (framework-agnostic definition)
export interface CardProps {
  variant: 'red' | 'yellow' | 'green'
  children: React.ReactNode
}

// ui/react/Card.tsx (React implementation)
export function Card({ variant, children }: CardProps) {
  const styles = cardStyles[variant] // From design system
  return <div className={styles}>{children}</div>
}

// ui/vue/Card.vue (Vue implementation - future)
// <template>
//   <div :class="cardStyles[variant]">
//     <slot />
//   </div>
// </template>

// components/Inventory/FoodItemCard.tsx (uses abstraction)
import { Card, Image } from '@/ui' // Can swap implementation

export default function FoodItemCard({ item }) {
  return (
    <Card variant={item.status}>
      <Image src={item.image_url} alt={item.product_name} />
    </Card>
  )
}
```

## Step 3: Design System Tokens

```typescript
// design-system/tokens.ts
export const tokens = {
  colors: {
    status: {
      red: { bg: '#FEE', border: '#F44', text: '#900' },
      yellow: { bg: '#FFE', border: '#FA0', text: '#840' },
      green: { bg: '#EFE', border: '#4A4', text: '#060' },
    }
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
  },
  fontSize: {
    body: '18px',
    heading: '24px',
  }
}

// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        'status-red-bg': tokens.colors.status.red.bg,
        // ... map all tokens
      }
    }
  }
}
```

## Step 4: Dependency Injection

```typescript
// di/container.ts
export class Container {
  private services = new Map()

  register<T>(key: string, factory: () => T) {
    this.services.set(key, factory)
  }

  resolve<T>(key: string): T {
    const factory = this.services.get(key)
    if (!factory) throw new Error(`Service ${key} not registered`)
    return factory()
  }
}

// di/setup.ts
export function setupContainer() {
  const container = new Container()

  // Register repositories
  container.register('FoodItemRepository', () =>
    new FirestoreFoodItemRepository(db)
  )

  container.register('ImageStorage', () =>
    new FirebaseImageStorage(storage)
  )

  // Register services
  container.register('FoodItemService', () =>
    new FoodItemService(
      container.resolve('FoodItemRepository'),
      container.resolve('ImageStorage')
    )
  )

  return container
}

// app/layout.tsx
const container = setupContainer()

export default function RootLayout({ children }) {
  return (
    <ContainerProvider value={container}>
      {children}
    </ContainerProvider>
  )
}
```

## Migration Path

### Phase 1: Extract Services (No UI changes)
1. Create `services/` directory
2. Move business logic from hooks to services
3. Create repository interfaces
4. Update hooks to use services

### Phase 2: Create UI Primitives
1. Create `ui/primitives/` directory
2. Define component interfaces
3. Implement React versions
4. Replace direct Tailwind usage

### Phase 3: Dependency Injection
1. Set up DI container
2. Register all services
3. Update components to use DI

### Phase 4: Framework Migration (if needed)
1. Implement UI primitives in new framework
2. Adapt presentation layer (hooks → composables)
3. Keep services/repositories unchanged
4. Migrate page by page

## Benefits

✅ **Framework Independence**: Services are pure TypeScript
✅ **Testability**: Easy to mock dependencies
✅ **Maintainability**: Clear separation of concerns
✅ **Scalability**: Add features without coupling
✅ **Team Collaboration**: Frontend/Backend can work independently

## Trade-offs

⚠️ **Initial Complexity**: More files and abstractions
⚠️ **Learning Curve**: Team needs to understand architecture
⚠️ **Over-engineering Risk**: May be overkill for small projects

## Recommendation

For BestBite's current scope, implement **Phase 1** (Services extraction) first. This provides 80% of benefits with 20% of effort. Consider Phase 2-3 only if:
- Planning to support multiple platforms (Web + Mobile)
- Team is growing beyond 3-5 developers
- Considering framework migration in next 6-12 months
