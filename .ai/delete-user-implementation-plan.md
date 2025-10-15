# API Endpoint Implementation Plan: DELETE /api/users/me

## 1. Przegląd punktu końcowego

Endpoint `DELETE /api/users/me` umożliwia uwierzytelnionemu użytkownikowi permanentne usunięcie swojego konta oraz wszystkich powiązanych danych (summaries, statystyki użycia AI). Jest to akcja nieodwracalna wymagająca jawnego potwierdzenia poprzez przekazanie specjalnego stringa w ciele żądania.

**Cel główny**: Zapewnienie użytkownikom możliwości pełnej kontroli nad swoimi danymi zgodnie z zasadami GDPR i prawa do bycia zapomnianym.

**Mechanizm usuwania**: Wykorzystuje kaskadowe usuwanie w bazie danych PostgreSQL - usunięcie rekordu z `auth.users` automatycznie usuwa powiązane dane z tabel `users` i `summaries` dzięki `ON DELETE CASCADE`.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/users/me`
- **Uwierzytelnienie**: Wymagane (JWT Bearer token w nagłówku Authorization)

### Parametry:

#### Wymagane:
- **Request Body** (JSON):
  - `confirmation` (string): Musi mieć dokładną wartość `"DELETE"` (case-sensitive)

#### Opcjonalne:
- Brak

### Request Body Schema:

```json
{
  "confirmation": "DELETE"
}
```

**Przykład żądania:**
```bash
DELETE /api/users/me HTTP/1.1
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "confirmation": "DELETE"
}
```

## 3. Wykorzystywane typy

Wszystkie wymagane typy już istnieją w `src/types.ts`:

### Command Models:
```typescript
interface DeleteUserCommand {
  confirmation: string;
}
```

### Response DTOs:
```typescript
interface DeleteUserResponseDTO {
  message: string;
}

interface ApiErrorDTO {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}

type ApiErrorCode = 
  | "UNAUTHORIZED"
  | "INVALID_CONFIRMATION"
  | "INTERNAL_ERROR"
  | "DATABASE_ERROR";
```

### Nowy schemat walidacji Zod:

Należy utworzyć nowy plik `src/lib/services/schemas/user.schema.ts`:

```typescript
import { z } from "zod";

export const DeleteUserSchema = z.object({
  confirmation: z.literal("DELETE", {
    errorMap: () => ({ message: "Confirmation must be exactly 'DELETE'" })
  })
});

export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK):

```json
{
  "message": "Account successfully deleted"
}
```

### Error Responses:

#### 400 Bad Request - Invalid Confirmation:
```json
{
  "error": {
    "code": "INVALID_CONFIRMATION",
    "message": "Please provide correct confirmation to delete account"
  }
}
```

#### 401 Unauthorized - Missing Authentication:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 500 Internal Server Error:
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to delete user account"
  }
}
```

### Kody statusu HTTP:

- `200 OK` - Konto zostało pomyślnie usunięte
- `400 Bad Request` - Nieprawidłowe lub brakujące potwierdzenie
- `401 Unauthorized` - Brak lub nieprawidłowy token uwierzytelniający
- `500 Internal Server Error` - Błąd po stronie serwera podczas usuwania konta

## 5. Przepływ danych

### Architektura wielowarstwowa:

```
Client Request
    ↓
Astro Middleware (Authentication check)
    ↓
API Endpoint Handler (/api/users/me.ts)
    ↓
Input Validation (Zod Schema)
    ↓
UserService.deleteUserAccount()
    ↓
Supabase Admin API (auth.admin.deleteUser)
    ↓
PostgreSQL Database
    ↓
Cascade Delete (users table + summaries table)
    ↓
Response to Client
```

### Szczegółowy przepływ:

1. **Request Reception**:
   - Client wysyła DELETE request z JWT token w nagłówku Authorization
   - Body zawiera `{"confirmation": "DELETE"}`

2. **Authentication Layer** (`src/middleware/index.ts`):
   - Middleware weryfikuje JWT token
   - Ustawia `context.locals.user` i `context.locals.supabase`
   - Jeśli brak auth, middleware przekierowuje do endpoint, który zwraca 401

3. **API Endpoint Handler** (`src/pages/api/users/me.ts`):
   - Sprawdza obecność `context.locals.user` (guard clause)
   - Parsuje request body jako JSON
   - Waliduje body używając `DeleteUserSchema` (Zod)
   - W przypadku błędu walidacji zwraca 400 z kodem `INVALID_CONFIRMATION`

4. **Service Layer** (`src/lib/services/user.service.ts`):
   - Wywołuje `userService.deleteUserAccount(supabase, userId)`
   - Service używa Supabase Admin Client do wykonania `auth.admin.deleteUser(userId)`
   - Admin API pozwala na usunięcie własnego konta pomimo RLS policies

5. **Database Layer** (PostgreSQL):
   - Supabase usuwa rekord z `auth.users` WHERE id = userId
   - Trigger CASCADE DELETE automatycznie usuwa:
     - Rekord z tabeli `users` (ON DELETE CASCADE z auth.users)
     - Wszystkie rekordy z tabeli `summaries` (ON DELETE CASCADE z users)

6. **Response**:
   - Success: Zwraca 200 z `DeleteUserResponseDTO`
   - Error: Zwraca odpowiedni kod błędu (400, 401, 500) z `ApiErrorDTO`

### Interakcje z zewnętrznymi serwisami:

- **Supabase Auth API**: Usuwanie użytkownika z systemu uwierzytelniania
- **Supabase Database**: Operacje CASCADE DELETE na tabelach users i summaries
- **Logging Service** (opcjonalnie): Audit trail akcji usunięcia konta

## 6. Względy bezpieczeństwa

### Uwierzytelnianie:
- **Wymaganie**: JWT Bearer token w nagłówku Authorization
- **Implementacja**: Weryfikacja przez Astro middleware (`src/middleware/index.ts`)
- **Fail-safe**: Jeśli `context.locals.user` nie istnieje, zwróć 401 UNAUTHORIZED

### Autoryzacja:
- **Zasada**: Użytkownik może usunąć tylko własne konto
- **Implementacja**: Używamy `context.locals.user.id` do identyfikacji użytkownika
- **RLS Bypass**: Supabase Admin API jest potrzebne, ponieważ RLS może blokować usunięcie własnego rekordu w auth.users

### Potwierdzenie akcji:
- **Mechanizm**: Wymaganie przekazania dokładnego stringa `"DELETE"` w body
- **Cel**: Zapobieganie przypadkowemu usunięciu konta (typo, omyłkowe kliknięcie)
- **Walidacja**: Case-sensitive comparison używając Zod schema z `z.literal("DELETE")`

### CSRF Protection:
- **Astro built-in**: Automatyczne sprawdzanie origin dla metod POST/PUT/DELETE/PATCH
- **Same-origin policy**: Żądania z innych domen są blokowane

### Session Invalidation:
- **Automatyczne**: Supabase automatycznie invaliduje wszystkie sesje po usunięciu użytkownika z auth.users
- **Client-side**: Frontend powinien obsłużyć błąd 401 i wylogować użytkownika

### Data Privacy:
- **GDPR Compliance**: Pełne usunięcie wszystkich danych osobowych użytkownika
- **No soft delete**: Hard delete bez możliwości odzyskania (zgodnie z wymaganiami)
- **Cascade cleanup**: Automatyczne usunięcie wszystkich powiązanych danych

## 7. Obsługa błędów

### Scenariusze błędów i odpowiedzi:

#### 1. Brak uwierzytelnienia (401 UNAUTHORIZED)
**Warunek**: `context.locals.user` jest null lub undefined
```typescript
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
**Status**: 401

#### 2. Nieprawidłowe potwierdzenie (400 BAD REQUEST)
**Warunki**:
- Brak pola `confirmation` w body
- Wartość `confirmation` nie jest równa `"DELETE"`
- Body nie jest poprawnym JSON

```typescript
{
  "error": {
    "code": "INVALID_CONFIRMATION",
    "message": "Please provide correct confirmation to delete account"
  }
}
```
**Status**: 400

#### 3. Błąd Supabase Admin API (500 INTERNAL ERROR)
**Warunek**: `auth.admin.deleteUser()` rzuca wyjątek
```typescript
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to delete user account"
  }
}
```
**Status**: 500
**Logowanie**: Pełny stack trace i error message do console/logging service

#### 4. Błąd bazy danych (500 DATABASE ERROR)
**Warunek**: Problemy z cascade delete w PostgreSQL
```typescript
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Database operation failed during account deletion"
  }
}
```
**Status**: 500
**Logowanie**: Database error details, user ID, timestamp

### Strategia logowania błędów:

```typescript
// Development
console.error("Delete user failed:", {
  userId: userId,
  error: error.message,
  stack: error.stack
});

// Production (use proper logging service)
logger.error("Delete user failed", {
  userId: userId,
  errorMessage: error.message,
  timestamp: new Date().toISOString(),
  // NIE logować danych osobowych
});
```

### Error Recovery:

- **Transakcyjność**: Operacja usunięcia jest atomowa (Supabase Admin API + CASCADE DELETE)
- **Rollback**: W przypadku błędu, żadne dane nie są usuwane (all-or-nothing)
- **Retry logic**: NIE implementować auto-retry dla delete operations ze względów bezpieczeństwa
- **User feedback**: Zawsze zwracać jasny komunikat błędu do użytkownika


## 9. Kroki implementacji

### Krok 1: Utworzenie schematu walidacji Zod

**Plik**: `src/lib/services/schemas/user.schema.ts`

**Zadania**:
- Utworzyć nowy plik dla schematów walidacji użytkownika
- Zdefiniować `DeleteUserSchema` z `z.literal("DELETE")`
- Wyeksportować typ `DeleteUserInput` dla type safety
- Dodać custom error message dla walidacji

**Kod**:
```typescript
import { z } from "zod";

export const DeleteUserSchema = z.object({
  confirmation: z.literal("DELETE", {
    errorMap: () => ({ 
      message: "Confirmation must be exactly 'DELETE'" 
    })
  })
});

export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
```

**Weryfikacja**: TypeScript compilation bez błędów

---

### Krok 2: Rozszerzenie UserService o metodę deleteUserAccount

**Plik**: `src/lib/services/user.service.ts`

**Zadania**:
- Dodać metodę `deleteUserAccount(supabase: SupabaseClient, userId: string)`
- Użyć Supabase Admin API: `supabase.auth.admin.deleteUser(userId)`
- Implementować proper error handling z try-catch
- Dodać JSDoc documentation dla metody
- Logować błędy do console (development) lub logging service (production)

**Kod**:
```typescript
/**
 * Permanently deletes a user account and all associated data
 * Uses Supabase Admin API to delete from auth.users, which triggers
 * cascade delete for users table and all summaries
 *
 * @param supabase - Authenticated Supabase client with admin privileges
 * @param userId - User's unique identifier to delete
 * @throws Error if deletion fails
 */
async deleteUserAccount(
  supabase: SupabaseClient, 
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      throw new Error(
        `Failed to delete user from auth: ${error.message}`
      );
    }
    
    // Success - cascade delete handles users table and summaries
  } catch (error) {
    // Log error for monitoring
    console.error("User account deletion failed:", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
}
```

**Weryfikacja**: 
- TypeScript compilation
- Method signature matches usage pattern
- Error handling comprehensive

---

### Krok 3: Implementacja DELETE handler w API endpoint

**Plik**: `src/pages/api/users/me.ts`

**Zadania**:
- Dodać `export const DELETE: APIRoute` handler
- Zaimplementować authentication check (guard clause)
- Parsować request body jako JSON
- Walidować body używając `DeleteUserSchema.safeParse()`
- Wywołać `userService.deleteUserAccount()`
- Zwrócić odpowiednie response (200 success lub error)
- Obsłużyć wszystkie scenariusze błędów (401, 400, 500)

**Kod**:
```typescript
/**
 * DELETE /api/users/me
 *
 * Permanently deletes the authenticated user's account and all associated data.
 * Requires explicit confirmation in request body.
 *
 * @requires Authentication via JWT Bearer token
 * @requires Request body with {"confirmation": "DELETE"}
 * @returns {DeleteUserResponseDTO} 200 - Account deleted successfully
 * @returns {ApiErrorDTO} 400 - Invalid confirmation
 * @returns {ApiErrorDTO} 401 - Authentication required
 * @returns {ApiErrorDTO} 500 - Internal server error
 */
export const DELETE: APIRoute = async (context) => {
  // Guard: Check authentication
  if (!context.locals.user) {
    const errorResponse: ApiErrorDTO = {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = context.locals.user.id;
  const supabase = context.locals.supabase;

  try {
    // Parse and validate request body
    const body = await context.request.json();
    const validation = DeleteUserSchema.safeParse(body);

    if (!validation.success) {
      const errorResponse: ApiErrorDTO = {
        error: {
          code: "INVALID_CONFIRMATION",
          message: "Please provide correct confirmation to delete account",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete user account (cascade delete handles related data)
    await userService.deleteUserAccount(supabase, userId);

    // Success response
    const successResponse: DeleteUserResponseDTO = {
      message: "Account successfully deleted",
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for monitoring
    console.error("Failed to delete user account:", error);

    const errorResponse: ApiErrorDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete user account",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Weryfikacja**:
- TypeScript compilation bez błędów
- Wszystkie ścieżki kodu zwracają Response
- Error handling dla JSON parsing errors
- Proper HTTP status codes

---

### Krok 4: Import i konfiguracja zależności

**Plik**: `src/pages/api/users/me.ts`

**Zadania**:
- Dodać import dla `DeleteUserSchema` z `schemas/user.schema.ts`
- Dodać import dla typów `DeleteUserResponseDTO`, `DeleteUserCommand` z `types.ts`
- Upewnić się że `userService` jest już zaimportowany (z kroku GET)
- Dodać `export const prerender = false` (jeśli nie istnieje)

**Kod** (top of file):
```typescript
import type { APIRoute } from "astro";

import { userService } from "../../../lib/services/user.service";
import { DeleteUserSchema } from "../../../lib/services/schemas/user.schema";
import type { 
  ApiErrorDTO, 
  DeleteUserResponseDTO,
  UserProfileDTO 
} from "../../../types";

export const prerender = false;
```

**Weryfikacja**: All imports resolve correctly

---

### Krok 5: Testowanie endpoint (manual smoke test)

**Narzędzia**: Postman, curl, lub Thunder Client (VS Code extension)

**Test Case 1: Success scenario**
```bash
DELETE /api/users/me
Authorization: Bearer <valid_jwt_token>
Content-Type: application/json

Body:
{
  "confirmation": "DELETE"
}

Expected: 200 OK
{
  "message": "Account successfully deleted"
}
```

**Test Case 2: Invalid confirmation**
```bash
DELETE /api/users/me
Authorization: Bearer <valid_jwt_token>
Content-Type: application/json

Body:
{
  "confirmation": "delete"  // lowercase
}

Expected: 400 Bad Request
{
  "error": {
    "code": "INVALID_CONFIRMATION",
    "message": "Please provide correct confirmation to delete account"
  }
}
```

**Test Case 3: Missing confirmation**
```bash
DELETE /api/users/me
Authorization: Bearer <valid_jwt_token>
Content-Type: application/json

Body:
{}

Expected: 400 Bad Request
```

**Test Case 4: No authentication**
```bash
DELETE /api/users/me
Content-Type: application/json

Body:
{
  "confirmation": "DELETE"
}

Expected: 401 Unauthorized
```

**Weryfikacja w bazie danych**:
```sql
-- Przed usunięciem
SELECT * FROM auth.users WHERE id = '<user_id>';
SELECT * FROM users WHERE id = '<user_id>';
SELECT * FROM summaries WHERE user_id = '<user_id>';

-- Po pomyślnym usunięciu
-- Wszystkie powyższe query powinny zwrócić 0 rows
```

---

### Krok 6: Dokumentacja API

**Plik**: `docs/api/users/delete-account.md` (nowy plik)

**Zadania**:
- Utworzyć dokumentację markdown dla endpoint
- Opisać authentication requirements
- Pokazać przykłady request/response
- Wymienić wszystkie error codes i scenariusze
- Dodać security considerations
- Opisać cascade delete behavior

**Struktura**:
```markdown
# DELETE /api/users/me - Delete User Account

## Overview
[Opis funkcjonalności]

## Authentication
[Wymagania auth]

## Request
[Format żądania]

## Response
[Możliwe odpowiedzi]

## Error Codes
[Lista kodów błędów]

## Examples
[Przykłady użycia]

## Security Notes
[Uwagi bezpieczeństwa]

## Database Behavior
[Opis cascade delete]
```

**Weryfikacja**: Dokumentacja jest kompletna i zrozumiała

---

### Krok 7: Update OpenAPI specification

**Plik**: `docs/api/openapi.yaml`

**Zadania**:
- Dodać definition dla `DELETE /api/users/me` endpoint
- Zdefiniować request body schema z confirmation field
- Dodać wszystkie response codes (200, 400, 401, 500)
- Dodać security requirement (bearerAuth)
- Zdefiniować response schemas używając existing components

**OpenAPI snippet**:
```yaml
/api/users/me:
  delete:
    summary: Delete user account
    description: Permanently deletes the authenticated user's account and all associated data. This action is irreversible.
    tags:
      - Users
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - confirmation
            properties:
              confirmation:
                type: string
                enum: [DELETE]
                description: Must be exactly "DELETE" to confirm account deletion
    responses:
      '200':
        description: Account successfully deleted
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DeleteUserResponse'
      '400':
        description: Invalid confirmation
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApiError'
      '401':
        description: Authentication required
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApiError'
      '500':
        description: Internal server error
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApiError'
```

**Weryfikacja**: OpenAPI validator passes (swagger-cli validate)

---

### Krok 8: Code review checklist

**Przed merge do main:**

- [ ] TypeScript compilation bez błędów (`npm run build`)
- [ ] ESLint passes bez warnings (`npm run lint`)
- [ ] Wszystkie importy są poprawne
- [ ] Error handling dla wszystkich edge cases
- [ ] Proper HTTP status codes użyte
- [ ] Authentication check jest pierwszą guard clause
- [ ] Request body validation używa Zod schema
- [ ] UserService metoda ma proper error handling
- [ ] Cascade delete działa poprawnie (sprawdzone w bazie)
- [ ] Wszystkie response types są zgodne z `types.ts`
- [ ] Dokumentacja API jest kompletna
- [ ] OpenAPI spec jest updated
- [ ] Manual testing przeprowadzony dla wszystkich scenariuszy
- [ ] Security considerations są addressed
- [ ] Logging jest implementowane dla błędów
- [ ] No sensitive data w logs
- [ ] Code follows project style guide (copilot-instructions.md)

---



### Podsumowanie implementacji

### Pliki do modyfikacji:
1. **Nowy**: `src/lib/services/schemas/user.schema.ts` - Zod validation schema
2. **Modyfikacja**: `src/lib/services/user.service.ts` - Dodanie metody deleteUserAccount
3. **Modyfikacja**: `src/pages/api/users/me.ts` - Dodanie DELETE handler
4. **Nowy**: `docs/api/users/delete-account.md` - API documentation
5. **Modyfikacja**: `docs/api/openapi.yaml` - OpenAPI specification update

### Zależności:
- **Istniejące typy**: `DeleteUserCommand`, `DeleteUserResponseDTO`, `ApiErrorDTO` (src/types.ts)
- **Istniejący service**: `UserService` (rozszerzony o nową metodę)
- **Middleware**: Authentication middleware (src/middleware/index.ts) - bez zmian
- **Database**: CASCADE DELETE relationships - bez zmian

### Timeline oszacowany:
- Krok 1-4 (Implementation): ~2-3 godziny
- Krok 5 (Testing): ~1 godzina
- Krok 6-7 (Documentation): ~1 godzina
- Krok 8 (Code review): ~30 minut
- **Total**: ~4-5 godzin dla pełnej implementacji

### Krytyczne punkty uwagi:
1. **Supabase Admin API**: Upewnić się że client ma uprawnienia admin
2. **Cascade Delete**: Zweryfikować że działa poprawnie w development environment
3. **Session Invalidation**: Testować że po deletion user jest wylogowany
4. **Error Messages**: Nie ujawniać wrażliwych informacji w error messages
5. **Confirmation String**: Case-sensitive validation ("DELETE" nie "delete")

### Post-implementation tasks:
- [ ] Add rate limiting middleware (future enhancement)
- [ ] Implement audit trail logging (future enhancement)
- [ ] Add monitoring and alerting (production requirement)
- [ ] Create frontend component for account deletion UI
- [ ] Write integration tests (future enhancement)
