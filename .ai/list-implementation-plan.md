# API Endpoint Implementation Plan: List and Get Summaries

## 1. Przegląd punktu końcowego

Implementacja dwóch powiązanych endpointów:
1. `GET /api/summaries` - zwraca paginowaną listę podsumowań dla zalogowanego użytkownika
2. `GET /api/summaries/:id` - zwraca szczegółowe informacje o konkretnym podsumowaniu

Oba endpointy wymagają uwierzytelnienia i zapewniają dostęp tylko do podsumowań należących do zalogowanego użytkownika.

## 2. Szczegóły żądania

### List Endpoint

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/summaries`
- **Parametry zapytania:**
  - `page` (integer, opcjonalny, domyślnie: 1) - Numer strony
  - `limit` (integer, opcjonalny, domyślnie: 20, max: 100) - Elementów na stronę
  - `sort` (string, opcjonalny, domyślnie: "created_at") - Pole sortowania
  - `order` (string, opcjonalny, domyślnie: "desc") - Kierunek sortowania
  - `creation_type` (string, opcjonalny) - Filtr typu utworzenia
- **Request Body:** Brak

### Detail Endpoint

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/summaries/:id`
- **Parametry ścieżki:**
  - `id` (UUID, wymagany) - Identyfikator podsumowania
- **Parametry zapytania:** Brak
- **Request Body:** Brak

## 3. Wykorzystywane typy

### Typy wejściowe

```typescript
// Istniejące typy z src/types.ts
interface SummaryListQueryParams {
  page?: number;
  limit?: number;
  sort?: "created_at" | "updated_at" | "title";
  order?: "asc" | "desc";
  creation_type?: Enums<"summary_creation_type">;
}
```

### Typy wyjściowe

```typescript
// Istniejące typy z src/types.ts
interface SummaryListResponseDTO {
  summaries: SummaryListItemDTO[];
  pagination: PaginationDTO;
}

interface SummaryDetailDTO {
  id: string;
  title: string;
  content: SummaryContentDTO;
  creation_type: Enums<"summary_creation_type">;
  ai_model_name: string | null;
  created_at: string;
  updated_at: string;
}
```

## 4. Przepływ danych

### List Endpoint

1. **Uwierzytelnianie użytkownika**
   - Sprawdzenie tokenu JWT i odczytanie ID użytkownika z locals

2. **Walidacja parametrów zapytania**
   - Konwersja i walidacja parametrów numerycznych
   - Sprawdzenie dozwolonych wartości dla sort i order
   - Walidacja creation_type

3. **Pobieranie danych**
   - Obliczenie offsetu na podstawie page i limit
   - Pobranie paginowanych danych z odpowiednimi filtrami
   - Pobranie całkowitej liczby elementów dla paginacji

4. **Przygotowanie odpowiedzi**
   - Mapowanie wyników do SummaryListItemDTO
   - Obliczenie metadanych paginacji
   - Formatowanie odpowiedzi zgodnie z SummaryListResponseDTO

### Detail Endpoint

1. **Uwierzytelnianie użytkownika**
   - Sprawdzenie tokenu JWT i odczytanie ID użytkownika

2. **Walidacja ID**
   - Sprawdzenie formatu UUID
   - Walidacja istnienia podsumowania
   - Weryfikacja własności (user_id)

3. **Pobieranie danych**
   - Pobranie pełnych szczegółów podsumowania
   - Sprawdzenie uprawnień dostępu

4. **Przygotowanie odpowiedzi**
   - Mapowanie do SummaryDetailDTO
   - Zwrócenie odpowiedzi

## 5. Względy bezpieczeństwa

1. **Uwierzytelnianie**
   - Wymagany token JWT Bearer
   - Wykorzystanie lokalsów Astro do weryfikacji tokenu
   - Spójne komunikaty o błędach uwierzytelniania

2. **Autoryzacja**
   - Filtrowanie wyników tylko dla zalogowanego użytkownika
   - Wykorzystanie Row Level Security Supabase
   - Weryfikacja własności przy dostępie do szczegółów

3. **Walidacja danych**
   - Sanityzacja parametrów zapytania
   - Weryfikacja zakresów liczbowych
   - Sprawdzanie dozwolonych wartości enum

4. **Zapobieganie atakom**
   - Limitowanie rozmiaru odpowiedzi
   - Paginacja dużych zbiorów danych
   - Wykorzystanie parametryzowanych zapytań

## 6. Obsługa błędów

| Scenariusz                        | Kod statusu | Kod błędu          | Komunikat                                     |
|----------------------------------|-------------|--------------------|--------------------------------------------|
| Brak tokenu uwierzytelniania     | 401         | UNAUTHORIZED       | Authentication required                     |
| Nieprawidłowy token              | 401         | UNAUTHORIZED       | Invalid authentication token                |
| Podsumowanie nie istnieje        | 404         | NOT_FOUND          | Summary not found                           |
| Brak dostępu do podsumowania     | 403         | FORBIDDEN          | Access to this summary is forbidden         |
| Nieprawidłowy parametr page      | 400         | INVALID_PARAMETER  | Page must be a positive integer            |
| Nieprawidłowy parametr limit     | 400         | INVALID_PARAMETER  | Limit must be between 1 and 100            |
| Nieprawidłowy parametr sort      | 400         | INVALID_PARAMETER  | Invalid sort field                         |
| Nieprawidłowy parametr order     | 400         | INVALID_PARAMETER  | Order must be 'asc' or 'desc'              |
| Nieprawidłowy creation_type      | 400         | INVALID_PARAMETER  | Invalid creation type                       |
| Błąd bazy danych                 | 500         | DATABASE_ERROR     | Failed to fetch summaries                   |
| Nieznany błąd                    | 500         | INTERNAL_ERROR     | An unexpected error occurred                |

## 7. Rozważania dotyczące wydajności

1. **Optymalizacja zapytań**
   - Wykorzystanie indeksów na user_id i creation_type
   - Ograniczenie zwracanych kolumn dla listy
   - Efektywne sortowanie przez indeksy

2. **Paginacja**
   - Limit maksymalnej liczby elementów na stronie
   - Wykorzystanie offset/limit w bazie danych
   - Zwracanie tylko niezbędnych pól w liście

3. **Pamięć podręczna**
   - Cache-Control headers dla odpowiedzi GET
   - Możliwość implementacji Redis/Memcached w przyszłości
   - ETags dla optymalizacji transferu

4. **Monitorowanie**
   - Śledzenie czasów odpowiedzi
   - Monitorowanie wykorzystania zasobów
   - Alerting dla długich zapytań

## 8. Etapy wdrożenia

1. **Rozszerzenie serwisu SummaryService**
   - Implementacja metody `listSummaries`
   - Implementacja metody `getSummaryById`
   - Dodanie walidacji dostępu i własności
   - Obsługa sortowania i filtrowania

2. **Implementacja walidacji**
   - Utworzenie schematów Zod dla parametrów
   - Implementacja walidatorów UUID
   - Walidacja zakresów i wartości enum

3. **Implementacja handlera listy**
   - Utworzenie `src/pages/api/summaries/index.ts`
   - Implementacja obsługi query params
   - Integracja z SummaryService
   - Implementacja paginacji

4. **Implementacja handlera szczegółów**
   - Utworzenie `src/pages/api/summaries/[id].ts`
   - Implementacja walidacji ID
   - Integracja z SummaryService
   - Obsługa błędu 404

5. **Implementacja obsługi błędów**
   - Implementacja ErrorHandler
   - Dodanie monitorowania błędów
   - Spójne komunikaty błędów
   - Integracja z systemem monitorowania

6. **Optymalizacja i monitoring**
   - Dodanie Cache-Control headers
   - Implementacja monitoringu wydajności
   - Optymalizacja zapytań

7. **Dokumentacja**
   - Aktualizacja OpenAPI/Swagger
   - Dokumentacja typów i walidacji
   - Przykłady użycia dla frontendowych deweloperów
   - Instrukcje testowania