# Quick Reference Guide

## Framework Portability Assessment

| Component | Current State | Portability | Effort to Migrate |
|-----------|--------------|-------------|-------------------|
| **lib/** (Utils) | Pure TypeScript | ✅ 100% portable | No change needed |
| **types/** | TypeScript interfaces | ✅ 100% portable | No change needed |
| **hooks/** | React hooks | 🟡 80% portable | Medium - Convert to composables/stores |
| **context/** | React Context | 🟡 70% portable | Medium - Adapt state management |
| **components/** | React + Tailwind | 🔴 30% portable | High - Rewrite UI layer |
| **app/** | Next.js App Router | 🔴 10% portable | Very High - Framework-specific |

### Migration Difficulty by Framework

| Target Framework | Difficulty | Estimated Effort | Notes |
|-----------------|------------|------------------|-------|
| **Remix** | 🟢 Low | 2-3 weeks | Similar React patterns, different routing |
| **Gatsby** | 🟢 Low | 2-3 weeks | React-based, GraphQL layer needed |
| **Vue 3** | 🟡 Medium | 4-6 weeks | Composables API similar to hooks |
| **SvelteKit** | 🟡 Medium | 4-6 weeks | Different reactivity model |
| **Angular** | 🔴 High | 8-12 weeks | Complete architectural shift |
| **React Native** | 🟡 Medium | 6-8 weeks | Share business logic, rewrite UI |

## Testing Coverage Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Jest + Testing Library
- [ ] Configure Firebase emulator
- [ ] Write tests for `lib/*` utilities (target: 90%+)
- [ ] Mock Firebase and Gemini APIs

**Priority files to test:**
```
src/lib/image.ts      → 95% coverage (critical for data quality)
src/lib/date.ts       → 100% coverage (simple, easy wins)
src/lib/gemini.ts     → 85% coverage (mock API responses)
src/lib/firebase.ts   → 80% coverage (test with emulator)
```

### Phase 2: Business Logic (Week 3-4)
- [ ] Test hooks (`useFoodItems`)
- [ ] Test context (`FoodContext`)
- [ ] Integration tests with Firestore emulator
- [ ] API route tests

**Target coverage:**
```
src/hooks/            → 85%+
src/context/          → 80%+
src/app/api/          → 90%+
```

### Phase 3: Components (Week 5-6)
- [ ] Camera components
- [ ] Modal components
- [ ] Inventory components
- [ ] Visual regression tests (optional)

**Target coverage:**
```
src/components/       → 70%+
```

### Phase 4: E2E (Week 7)
- [ ] Set up Playwright
- [ ] Critical user flows (5-10 tests)
- [ ] Mobile viewport tests
- [ ] Performance benchmarks

**Critical flows to test:**
1. Photo capture → AI recognition → Save
2. View inventory → Delete item
3. Offline mode → Online sync
4. Edit item details
5. Error handling (API failure, network issues)

## Current Coupling Points

### High Coupling 🔴 (Hard to replace)

```typescript
// Next.js specific
'use client'
import Image from 'next/image'
import Link from 'next/link'

// Tailwind in JSX
<div className="bg-red-50 border-2 border-red-400">
```

### Medium Coupling 🟡 (Adaptable)

```typescript
// React-specific but patterns exist in other frameworks
const { items } = useFoodContext()
const { addFoodItem } = useFoodItems()
```

### Low Coupling ✅ (Already portable)

```typescript
// Pure TypeScript - works anywhere
export function calculateDaysUntilExpiry(date: string): number
export async function compressImage(file: File): Promise<Blob>
export class FoodItemService { ... }
```

## Recommended Actions

### For Framework Independence (Priority: Medium)

**If planning migration in 6-12 months:**
1. ✅ Extract services layer (1-2 weeks)
2. ✅ Create repository interfaces (3-5 days)
3. ✅ Set up dependency injection (2-3 days)
4. 🟡 Abstract UI primitives (1-2 weeks)

**If staying with Next.js:**
1. ⏸️ Keep current architecture
2. ✅ Add service layer gradually for testability
3. ✅ Document coupling points for future reference

### For Test Coverage (Priority: High)

**Immediate (This Sprint):**
1. ✅ Set up Jest + Testing Library
2. ✅ Test `lib/image.ts` and `lib/date.ts`
3. ✅ Add pre-commit hook for tests

**Short-term (Next 2 Sprints):**
1. ✅ Achieve 80% overall coverage
2. ✅ Set up Firebase emulator tests
3. ✅ Add CI/CD pipeline with coverage reports

**Long-term (Next Quarter):**
1. ✅ E2E test suite
2. ✅ Performance monitoring
3. ✅ Visual regression tests

## Cost-Benefit Analysis

### Service Layer Extraction

| Pros | Cons |
|------|------|
| ✅ Better testability | ❌ More boilerplate |
| ✅ Framework independence | ❌ Learning curve |
| ✅ Clearer architecture | ❌ Initial time investment |
| ✅ Easier to scale | ❌ May be over-engineering |

**Verdict:** ✅ Recommended if team > 3 or planning multi-platform

### Comprehensive Testing

| Pros | Cons |
|------|------|
| ✅ Catch bugs early | ❌ Slower initial development |
| ✅ Confident refactoring | ❌ Test maintenance overhead |
| ✅ Better documentation | ❌ Requires discipline |
| ✅ Easier onboarding | ❌ Tooling setup complexity |

**Verdict:** ✅✅ Strongly recommended for production apps

## Decision Tree

```
Are you planning to migrate frameworks?
├─ Yes (within 12 months)
│  └─ Priority: Extract services FIRST, then add tests
│
└─ No (staying with Next.js)
   ├─ Team size > 5?
   │  ├─ Yes → Extract services + Full testing
   │  └─ No → Add tests only, keep simple architecture
   │
   └─ Is this a prototype or production app?
      ├─ Prototype → Minimal testing (critical paths only)
      └─ Production → Full test suite (80%+ coverage)
```

## Next Steps

### Option A: Test-First Approach (Recommended)
1. Set up testing infrastructure (1 day)
2. Write tests for existing code (1 week)
3. Refactor with confidence (ongoing)

### Option B: Refactor-First Approach
1. Extract services layer (1 week)
2. Add tests to new services (1 week)
3. Migrate existing code gradually (2-3 weeks)

### Option C: Hybrid Approach (Best for most teams)
1. Set up testing infrastructure (1 day)
2. Test utility functions first (2-3 days)
3. Extract services for new features only (ongoing)
4. Add integration tests as you go (ongoing)

## Resources

- 📄 [ARCHITECTURE_REFACTOR.md](./ARCHITECTURE_REFACTOR.md) - Detailed refactoring guide
- 📄 [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Complete testing guide
- 📄 [PROJECT_PLAN.md](./PROJECT_PLAN.md) - Original project roadmap
