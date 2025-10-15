# Plan implementacji wspólnych komponentów aplikacji

## 1. Przegląd

Wspólne komponenty stanowią fundament aplikacji AI SciSum, zapewniając spójną nawigację, informacje zwrotne dla użytkownika oraz zarządzanie stanem aplikacji. Obejmują one:

- **Sidebar** (desktop) - lewy panel nawigacyjny z logo, menu, licznikiem AI i menu użytkownika
- **Header** (mobile) - górny pasek z menu hamburgerowym, logo, licznikiem AI i awatarem
- **AIUsageCounter** - wizualny licznik zużycia AI (format "3/5" z paskiem postępu)
- **UserMenu** - menu użytkownika z awatarem i opcjami (Profil, Ustawienia, Wyloguj)
- **ToastNotification** - system powiadomień dla informacji zwrotnych
- **LoadingSpinner** - wskaźnik ładowania
- **ErrorMessage** - komponent do wyświetlania błędów

Komponenty te będą współdzielone między wszystkimi widokami aplikacji i muszą być responsywne, dostępne oraz łatwe w utrzymaniu.

## 2. Routing widoku

Wspólne komponenty nie mają dedykowanego routingu - są wykorzystywane jako część layoutu aplikacji we wszystkich widokach:

- **Sidebar**: Widoczny na wszystkich stronach dla rozdzielczości desktop (≥1024px)
- **Header**: Widoczny na wszystkich stronach dla rozdzielczości mobile (<1024px)
- **Pozostałe komponenty**: Dostępne globalnie przez kontekst lub bezpośrednie importy

## 3. Struktura komponentów

```
Layout Component (Astro)
├── Sidebar (React, desktop only)
│   ├── Logo
│   ├── NavigationMenu
│   │   └── NewSummaryDropdown
│   │       ├── "Generuj z AI" option
│   │       └── "Stwórz ręcznie" option
│   ├── AIUsageCounter
│   └── UserMenu
│       └── DropdownMenu
│           ├── Profile option
│           ├── Settings option
│           └── Logout option
│
├── Header (React, mobile only)
│   ├── HamburgerButton
│   ├── Logo
│   ├── AIUsageCounter (compact)
│   └── UserMenu (avatar only)
│   └── MobileDrawer
│       ├── NewSummaryOptions
│       ├── AIUsageDetails
│       ├── Settings link
│       └── Logout option
│
└── Global Providers (React Context)
    ├── UserProfileProvider
    ├── ToastProvider
    └── NavigationProvider

Utility Components (React)
├── ToastNotification
├── LoadingSpinner
└── ErrorMessage

Dialogs (React)
└── DeleteAccountDialog (used in Settings)
```

## 4. Szczegóły komponentów

### Sidebar

- **Opis**: Lewy panel nawigacyjny widoczny na desktopie, zawiera logo aplikacji, menu "Nowe podsumowanie" z dropdown, licznik AI oraz menu użytkownika.
- **Główne elementy**:
  - `<aside>` jako główny kontener z fixed positioning
  - Logo (link do dashboard)
  - `<Button>` z dropdown dla "Nowe podsumowanie"
  - `<AIUsageCounter>` komponent
  - `<UserMenu>` komponent z awatarem
- **Obsługiwane interakcje**:
  - Kliknięcie logo → nawigacja do dashboard
  - Kliknięcie "Nowe" → otwarcie dropdown z opcjami AI/Manual
  - Kliknięcie opcji w dropdown → nawigacja do odpowiedniego widoku
  - Interakcje z AIUsageCounter i UserMenu (patrz ich sekcje)
- **Obsługiwana walidacja**: Brak (komponent tylko do wyświetlania i nawigacji)
- **Typy**: `UserProfileDTO`, `NavigationItem[]`
- **Propsy**:
  ```typescript
  interface SidebarProps {
    className?: string;
  }
  ```

### Header

- **Opis**: Górny pasek nawigacyjny widoczny na mobile, zawiera menu hamburgerowe, logo, kompaktowy licznik AI oraz awatar użytkownika.
- **Główne elementy**:
  - `<header>` jako główny kontener z fixed positioning
  - Button hamburgerowy (otwiera drawer)
  - Logo (link do dashboard)
  - `<AIUsageCounter>` w wersji kompaktowej
  - `<UserMenu>` tylko avatar
  - `<Sheet>` (Shadcn) dla mobile drawer
- **Obsługiwane interakcje**:
  - Kliknięcie hamburger → otwarcie/zamknięcie drawer
  - Kliknięcie logo → nawigacja do dashboard
  - Kliknięcie poza drawer → zamknięcie drawer
  - Wybór opcji w drawer → nawigacja i zamknięcie drawer
- **Obsługiwana walidacja**: Brak
- **Typy**: `UserProfileDTO`, `NavigationItem[]`
- **Propsy**:
  ```typescript
  interface HeaderProps {
    className?: string;
  }
  ```

### AIUsageCounter

- **Opis**: Komponent wyświetlający aktualny stan wykorzystania limitu AI w formacie "3/5" z wizualnym paskiem postępu. Posiada tooltip z dodatkowymi informacjami.
- **Główne elementy**:
  - `<div>` kontener z Tailwind classes
  - `<Progress>` (Shadcn) pokazujący procent wykorzystania
  - `<span>` z tekstem "Wykorzystano w tym miesiącu: X/Y"
  - `<Tooltip>` (Shadcn) z dodatkowymi informacjami
- **Obsługiwane interakcje**:
  - Hover → wyświetlenie tooltip z datą resetu i pozostałymi generacjami
  - (Opcjonalnie) Click → nawigacja do szczegółów użycia
- **Obsługiwana walidacja**:
  - Sprawdzenie czy `usage_count >= 0` i `monthly_limit > 0`
  - Wyświetlenie disabled state gdy `can_generate === false`
  - Obliczenie procentu: `(usage_count / monthly_limit) * 100`
- **Typy**: `AIUsageViewModel`, `UserAiUsageDTO`
- **Propsy**:
  ```typescript
  interface AIUsageCounterProps {
    variant?: 'full' | 'compact'; // full dla sidebar, compact dla mobile
    className?: string;
  }
  ```

### UserMenu

- **Opis**: Menu użytkownika wyświetlające awatar i dropdown z opcjami: Profil, Ustawienia, Wyloguj.
- **Główne elementy**:
  - `<DropdownMenu>` (Shadcn) jako główny kontener
  - `<Avatar>` (Shadcn) jako trigger
  - `<DropdownMenuContent>` z listą opcji
  - `<DropdownMenuItem>` dla każdej opcji menu
- **Obsługiwane interakcje**:
  - Kliknięcie avatar → otwarcie/zamknięcie dropdown
  - Kliknięcie "Profil" → nawigacja do /profile
  - Kliknięcie "Ustawienia" → nawigacja do /settings
  - Kliknięcie "Wyloguj" → wywołanie funkcji logout, przekierowanie do landing page
- **Obsługiwana walidacja**: Brak
- **Typy**: `UserProfileDTO`, `UserMenuItem[]`
- **Propsy**:
  ```typescript
  interface UserMenuProps {
    variant?: 'full' | 'avatar-only'; // full dla sidebar, avatar-only dla mobile
    className?: string;
  }
  ```

### ToastNotification

- **Opis**: System powiadomień wyświetlający tymczasowe komunikaty (sukces, błąd, info, ostrzeżenie) w prawym górnym rogu ekranu.
- **Główne elementy**:
  - `<Toaster>` (Shadcn) jako kontener
  - `<Toast>` (Shadcn) dla każdego powiadomienia
  - Ikony odpowiadające typowi komunikatu
  - Przycisk zamknięcia
- **Obsługiwane interakcje**:
  - Auto-dismiss po określonym czasie (domyślnie 5s)
  - Kliknięcie X → natychmiastowe zamknięcie
  - Hover → zatrzymanie timera auto-dismiss
- **Obsługiwana walidacja**: Brak
- **Typy**: `ToastMessage`
- **Propsy**: Zarządzane przez `useToast()` hook z Shadcn

### LoadingSpinner

- **Opis**: Uniwersalny komponent wskaźnika ładowania, może być używany inline lub jako overlay pełnoekranowy.
- **Główne elementy**:
  - SVG spinner lub `<Loader2>` icon z Lucide
  - Opcjonalny tekst "Ładowanie..."
  - Opcjonalny overlay background
- **Obsługiwane interakcje**: Brak (tylko wyświetlanie)
- **Obsługiwana walidacja**: Brak
- **Typy**: `LoadingState`
- **Propsy**:
  ```typescript
  interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
    overlay?: boolean; // pełnoekranowy overlay
    className?: string;
  }
  ```

### ErrorMessage

- **Opis**: Komponent do wyświetlania komunikatów błędów z opcjonalnym przyciskiem do ponawiania akcji.
- **Główne elementy**:
  - `<Alert>` (Shadcn) z variant="destructive"
  - Ikona błędu
  - Tytuł i treść komunikatu
  - Opcjonalny przycisk "Spróbuj ponownie"
- **Obsługiwane interakcje**:
  - Kliknięcie "Spróbuj ponownie" → wywołanie callback funkcji
  - Kliknięcie X → zamknięcie komunikatu (opcjonalne)
- **Obsługiwana walidacja**: Brak
- **Typy**: `ApiErrorDTO`, `string`
- **Propsy**:
  ```typescript
  interface ErrorMessageProps {
    error: ApiErrorDTO | string;
    onRetry?: () => void;
    onDismiss?: () => void;
    className?: string;
  }
  ```

### DeleteAccountDialog

- **Opis**: Modal potwierdzenia usunięcia konta, wymaga wpisania "DELETE" dla bezpieczeństwa. Używany w widoku Settings.
- **Główne elementy**:
  - `<Dialog>` (Shadcn) jako kontener
  - `<DialogHeader>` z tytułem i ostrzeżeniem
  - `<Input>` dla potwierdzenia (wymaga "DELETE")
  - `<DialogFooter>` z przyciskami Anuluj/Potwierdź
  - Komunikat o nieodwracalności akcji
- **Obsługiwane interakcje**:
  - Wpisywanie w input → walidacja w czasie rzeczywistym
  - Kliknięcie "Potwierdź" → wywołanie DELETE /api/users/me
  - Kliknięcie "Anuluj" → zamknięcie dialogu
  - Kliknięcie poza dialog → zamknięcie dialogu
- **Obsługiwana walidacja**:
  - Input musi zawierać dokładnie "DELETE" (case-sensitive)
  - Przycisk "Potwierdź" disabled dopóki walidacja nie przejdzie
  - Frontend: `confirmation.trim() === "DELETE"`
  - Backend: weryfikacja w API endpoint
- **Typy**: `DeleteUserCommand`, `DeleteUserResponseDTO`, `ApiErrorDTO`
- **Propsy**:
  ```typescript
  interface DeleteAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void; // callback po pomyślnym usunięciu
  }
  ```

## 5. Typy

### Typy z API (już zdefiniowane w `src/types.ts`):

```typescript
// Profil użytkownika z statystykami AI
interface UserProfileDTO {
  id: string;
  ai_usage_count: number;
  usage_period_start: string;
  monthly_limit: number;
  remaining_generations: number;
}

// Szczegółowe informacje o użyciu AI
interface UserAiUsageDTO {
  can_generate: boolean;
  usage_count: number;
  monthly_limit: number;
  remaining_generations: number;
  period_start: string;
  period_end: string;
}

// Komenda usunięcia konta
interface DeleteUserCommand {
  confirmation: string; // musi być "DELETE"
}

// Odpowiedź po usunięciu konta
interface DeleteUserResponseDTO {
  message: string;
}

// Standardowa struktura błędów API
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
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "AI_LIMIT_EXCEEDED"
  | "INVALID_CONFIRMATION"
  | "INVALID_PARAMETER"
  | "INTERNAL_ERROR"
  | "DATABASE_ERROR";
```

### Nowe typy ViewModel (do utworzenia):

```typescript
// ViewModel dla AIUsageCounter - przetworzone dane do wyświetlenia
interface AIUsageViewModel {
  current: number; // aktualne użycie (np. 3)
  limit: number; // miesięczny limit (np. 5)
  percentage: number; // procent wykorzystania (60)
  canGenerate: boolean; // czy można generować więcej
  resetDate: string; // data resetu limitu (ISO format)
  remainingDays: number; // ile dni do resetu
}

// Typ dla powiadomień toast
interface ToastMessage {
  id: string; // unikalny identyfikator
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string; // opcjonalny tytuł
  message: string; // treść komunikatu
  duration?: number; // czas wyświetlania w ms (domyślnie 5000)
}

// Typ dla elementów nawigacji
interface NavigationItem {
  id: string;
  label: string; // wyświetlana nazwa
  path: string; // ścieżka routingu
  icon?: React.ComponentType; // opcjonalna ikona (Lucide)
}

// Typ dla elementów menu użytkownika
interface UserMenuItem {
  id: string;
  label: string; // wyświetlana nazwa
  action: 'navigate' | 'logout' | 'custom'; // typ akcji
  path?: string; // ścieżka dla action='navigate'
  icon?: React.ComponentType; // ikona (Lucide)
  variant?: 'default' | 'destructive'; // styl elementu
  onClick?: () => void; // custom handler dla action='custom'
}

// Stan ładowania
interface LoadingState {
  isLoading: boolean;
  message?: string; // opcjonalny komunikat "Ładowanie..."
}

// Stan menu mobile
interface NavigationState {
  isMenuOpen: boolean;
  activeItem?: string;
}
```

## 6. Zarządzanie stanem

### Konteksty React:

#### UserProfileContext
Udostępnia dane profilu użytkownika i funkcje do ich aktualizacji dla całej aplikacji.

```typescript
interface UserProfileContextValue {
  profile: UserProfileDTO | null;
  aiUsage: UserAiUsageDTO | null;
  isLoading: boolean;
  error: ApiErrorDTO | null;
  refetchProfile: () => Promise<void>;
  refetchAiUsage: () => Promise<void>;
  logout: () => Promise<void>;
}
```

#### ToastContext
Zarządza globalnym systemem powiadomień toast.

```typescript
interface ToastContextValue {
  showToast: (message: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  toasts: ToastMessage[];
}
```

#### NavigationContext (opcjonalny)
Zarządza stanem nawigacji mobilnej.

```typescript
interface NavigationContextValue {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}
```

### Custom Hooks:

#### useUserProfile()
Hook do pobierania i zarządzania danymi profilu użytkownika.

```typescript
function useUserProfile() {
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiErrorDTO | null>(null);

  const fetchProfile = async () => {
    // GET /api/users/me
  };

  const refetch = async () => {
    // Re-fetch profile
  };

  return { profile, isLoading, error, refetch };
}
```

#### useAIUsage()
Hook do pobierania i zarządzania danymi o użyciu AI.

```typescript
function useAIUsage() {
  const [aiUsage, setAiUsage] = useState<UserAiUsageDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiErrorDTO | null>(null);

  const fetchAiUsage = async () => {
    // GET /api/users/ai-usage
  };

  const refetch = async () => {
    // Re-fetch AI usage
  };

  return { aiUsage, isLoading, error, refetch };
}
```

#### useDeleteAccount()
Hook do obsługi usuwania konta użytkownika.

```typescript
function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<ApiErrorDTO | null>(null);

  const deleteAccount = async (confirmation: string): Promise<boolean> => {
    // DELETE /api/users/me
    // Returns true on success, false on error
  };

  return { deleteAccount, isDeleting, error };
}
```

#### useToast()
Hook do wyświetlania powiadomień toast (może być dostarczony przez Shadcn).

```typescript
function useToast() {
  const { showToast, dismissToast } = useContext(ToastContext);
  
  return {
    toast: showToast,
    dismiss: dismissToast,
  };
}
```

#### useNavigation()
Hook do zarządzania stanem nawigacji mobilnej.

```typescript
function useNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const closeMenu = () => setIsMenuOpen(false);
  const openMenu = () => setIsMenuOpen(true);

  return { isMenuOpen, toggleMenu, closeMenu, openMenu };
}
```

## 7. Integracja API

### GET /api/users/me

**Cel**: Pobranie profilu użytkownika wraz ze statystykami użycia AI.

**Kiedy wywoływane**:
- Przy inicjalizacji aplikacji (app mount)
- Po zalogowaniu użytkownika
- Po odświeżeniu strony (jeśli sesja aktywna)

**Typ żądania**: Brak body, autoryzacja przez cookies (Supabase session)

**Typ odpowiedzi**:
```typescript
// Success (200)
UserProfileDTO {
  id: string;
  ai_usage_count: number;
  usage_period_start: string;
  monthly_limit: number;
  remaining_generations: number;
}

// Error (401, 500)
ApiErrorDTO {
  error: {
    code: "UNAUTHORIZED" | "INTERNAL_ERROR";
    message: string;
  }
}
```

**Obsługa w komponencie**:
```typescript
const { profile, isLoading, error, refetch } = useUserProfile();

// W UserMenu: wyświetl email/avatar
// W AIUsageCounter: użyj ai_usage_count i monthly_limit
```

### GET /api/users/ai-usage

**Cel**: Pobranie szczegółowych informacji o użyciu AI z flagą `can_generate`.

**Kiedy wywoływane**:
- Przy inicjalizacji aplikacji
- Po wygenerowaniu podsumowania AI
- Przed próbą generowania AI (sprawdzenie dostępności)

**Typ żądania**: Brak body, autoryzacja przez cookies

**Typ odpowiedzi**:
```typescript
// Success (200)
UserAiUsageDTO {
  can_generate: boolean;
  usage_count: number;
  monthly_limit: number;
  remaining_generations: number;
  period_start: string; // ISO datetime
  period_end: string; // ISO datetime
}

// Error (401, 500)
ApiErrorDTO
```

**Obsługa w komponencie**:
```typescript
const { aiUsage, isLoading, error } = useAIUsage();

// W AIUsageCounter:
// - Wyświetl usage_count / monthly_limit
// - Disabled state jeśli can_generate === false
// - Tooltip z period_end jako data resetu
```

### DELETE /api/users/me

**Cel**: Trwałe usunięcie konta użytkownika i wszystkich powiązanych danych.

**Kiedy wywoływane**:
- Po potwierdzeniu w DeleteAccountDialog (Settings view)

**Typ żądania**:
```typescript
DeleteUserCommand {
  confirmation: string; // musi być "DELETE"
}
```

**Typ odpowiedzi**:
```typescript
// Success (200)
DeleteUserResponseDTO {
  message: string; // "Account successfully deleted"
}

// Error (400, 401, 500)
ApiErrorDTO {
  error: {
    code: "INVALID_CONFIRMATION" | "UNAUTHORIZED" | "INTERNAL_ERROR";
    message: string;
  }
}
```

**Obsługa w komponencie**:
```typescript
const { deleteAccount, isDeleting, error } = useDeleteAccount();

// W DeleteAccountDialog:
const handleConfirm = async () => {
  const success = await deleteAccount(confirmationInput);
  if (success) {
    toast({ type: 'success', message: 'Konto zostało usunięte' });
    await logout(); // Wyloguj użytkownika
    navigate('/'); // Przekieruj na landing page
  } else {
    toast({ type: 'error', message: error.error.message });
  }
};
```

## 8. Interakcje użytkownika

### Nawigacja główna (Sidebar/Header)

**Interakcja**: Kliknięcie logo
- **Akcja**: Nawigacja do dashboard (`/dashboard`)
- **Rezultat**: Przekierowanie, zamknięcie mobile drawer (jeśli otwarty)

**Interakcja**: Kliknięcie "Nowe podsumowanie" dropdown
- **Akcja**: Otwarcie listy opcji (Generuj z AI / Stwórz ręcznie)
- **Rezultat**: Wyświetlenie dropdown menu

**Interakcja**: Wybór "Generuj z AI"
- **Akcja**: Nawigacja do `/summaries/generate-ai`
- **Rezultat**: Przekierowanie do widoku generowania AI, zamknięcie dropdown/drawer

**Interakcja**: Wybór "Stwórz ręcznie"
- **Akcja**: Nawigacja do `/summaries/new` (pusty edytor)
- **Rezultat**: Przekierowanie do edytora, zamknięcie dropdown/drawer

### AIUsageCounter

**Interakcja**: Hover nad licznikiem
- **Akcja**: Wyświetlenie tooltip
- **Rezultat**: Tooltip z informacjami:
  - "Pozostało generacji: X"
  - "Reset limitu: DD.MM.YYYY"
  - Komunikat o limicie jeśli 5/5

**Interakcja**: Stan limitu wyczerpany (5/5)
- **Akcja**: Wyświetlenie czerwonego paska postępu, komunikat w tooltip
- **Rezultat**: Użytkownik widzi, że limit wyczerpany i kiedy zostanie odnowiony

### UserMenu

**Interakcja**: Kliknięcie avatara
- **Akcja**: Otwarcie dropdown menu
- **Rezultat**: Wyświetlenie opcji: Profil, Ustawienia, Wyloguj

**Interakcja**: Wybór "Profil"
- **Akcja**: Nawigacja do `/profile`
- **Rezultat**: Przekierowanie do widoku profilu

**Interakcja**: Wybór "Ustawienia"
- **Akcja**: Nawigacja do `/settings`
- **Rezultat**: Przekierowanie do widoku ustawień

**Interakcja**: Wybór "Wyloguj"
- **Akcja**: Wywołanie funkcji logout (czyszczenie sesji Supabase)
- **Rezultat**: Wylogowanie, przekierowanie na landing page `/`

### Mobile Navigation

**Interakcja**: Kliknięcie hamburger menu
- **Akcja**: Otwarcie/zamknięcie drawer
- **Rezultat**: Animowane otwarcie bocznego panelu z menu

**Interakcja**: Kliknięcie poza drawer
- **Akcja**: Zamknięcie drawer
- **Rezultat**: Drawer znika, powrót do głównego widoku

**Interakcja**: Wybór opcji w drawer
- **Akcja**: Nawigacja + zamknięcie drawer
- **Rezultat**: Przekierowanie, drawer znika

### DeleteAccountDialog

**Interakcja**: Wpisywanie w pole potwierdzenia
- **Akcja**: Walidacja w czasie rzeczywistym
- **Rezultat**: Przycisk "Potwierdź" aktywny/nieaktywny w zależności od walidacji

**Interakcja**: Kliknięcie "Potwierdź" (gdy walidacja OK)
- **Akcja**: Wywołanie DELETE /api/users/me, wyświetlenie loadera
- **Rezultat**: 
  - Sukces: Toast success, logout, przekierowanie na `/`
  - Błąd: Toast error z komunikatem, pozostanie w dialogu

**Interakcja**: Kliknięcie "Anuluj"
- **Akcja**: Zamknięcie dialogu bez akcji
- **Rezultat**: Dialog znika, użytkownik pozostaje w ustawieniach

## 9. Warunki i walidacja

### AIUsageCounter

**Warunki wyświetlania**:
- `aiUsage !== null` - dane muszą być załadowane
- `aiUsage.usage_count >= 0` - prawidłowa liczba użyć
- `aiUsage.monthly_limit > 0` - prawidłowy limit

**Warunki stanu**:
- **Normalny**: `usage_count < monthly_limit && can_generate === true`
  - Progress bar: kolor primary (niebieski/zielony)
  - Tooltip: "Pozostało generacji: X"
  
- **Limit wyczerpany**: `usage_count >= monthly_limit || can_generate === false`
  - Progress bar: kolor destructive (czerwony)
  - Tooltip: "Limit wyczerpany. Reset: DD.MM.YYYY"
  - Przycisk "Generuj AI" disabled w innych widokach

**Obliczenia**:
- Procent: `(usage_count / monthly_limit) * 100`
- Data resetu: formatowanie `period_end` do DD.MM.YYYY
- Pozostałe dni: obliczenie różnicy między `period_end` a dzisiaj

**Komponenty dotknięte**:
- `AIUsageCounter` (Sidebar, Header)
- Przycisk "Generuj AI" w widoku generowania (disabled gdy `can_generate === false`)

### DeleteAccountDialog

**Warunki walidacji inputu**:
- Input nie może być pusty
- Input musi zawierać dokładnie "DELETE" (case-sensitive)
- Walidacja: `confirmationInput.trim() === "DELETE"`

**Warunki przycisku "Potwierdź"**:
- **Disabled**: 
  - `confirmationInput !== "DELETE"`
  - `isDeleting === true` (w trakcie usuwania)
- **Enabled**: 
  - `confirmationInput === "DELETE"`
  - `isDeleting === false`

**Walidacja API**:
- Backend dodatkowo weryfikuje `confirmation` field w request body
- Błąd 400 jeśli `confirmation !== "DELETE"`
- Frontend wyświetla odpowiedni komunikat błędu

**Komponenty dotknięte**:
- `DeleteAccountDialog` (używany w Settings view)

### Autoryzacja

**Warunki dostępu**:
- Wszystkie komponenty wymagają zalogowanego użytkownika
- Sprawdzenie: `Astro.locals.supabase.auth.getUser()` w middleware
- Jeśli brak sesji: przekierowanie na `/login`

**Obsługa błędów 401**:
- Wykrycie w catch block wywołań API
- Automatyczne wylogowanie i przekierowanie
- Toast: "Sesja wygasła. Zaloguj się ponownie."

## 10. Obsługa błędów

### Błędy API (Network/Server)

**Scenariusz**: Błąd sieci lub serwera przy pobieraniu profilu/AI usage
- **Wykrycie**: `catch` block w `useUserProfile` / `useAIUsage`
- **Akcja**: 
  - Ustawienie `error` state
  - Wyświetlenie `<ErrorMessage>` w miejscu komponentu
  - Opcja "Spróbuj ponownie" → ponowne wywołanie fetch
- **Komunikat**: "Nie udało się załadować danych. Spróbuj ponownie."

**Scenariusz**: Błąd 401 Unauthorized
- **Wykrycie**: Status code === 401 w odpowiedzi
- **Akcja**:
  - Wywołanie `logout()`
  - Toast: "Sesja wygasła. Zaloguj się ponownie."
  - Przekierowanie na `/login`

**Scenariusz**: Błąd 500 Server Error
- **Wykrycie**: Status code === 500
- **Akcja**:
  - Wyświetlenie ErrorMessage
  - Opcja retry z exponential backoff
- **Komunikat**: "Wystąpił problem z serwerem. Spróbuj za chwilę."

### Błędy usuwania konta

**Scenariusz**: Nieprawidłowe potwierdzenie (frontend validation)
- **Wykrycie**: `confirmationInput !== "DELETE"`
- **Akcja**: Przycisk "Potwierdź" pozostaje disabled
- **Komunikat**: Inline pod inputem: "Wpisz DELETE aby potwierdzić"

**Scenariusz**: Błąd API - INVALID_CONFIRMATION (backend validation)
- **Wykrycie**: Response code === 400, error.code === "INVALID_CONFIRMATION"
- **Akcja**: 
  - Toast error z komunikatem z API
  - Pozostanie w dialogu, możliwość poprawy
- **Komunikat**: Z API: "Invalid confirmation string"

**Scenariusz**: Błąd podczas usuwania (database error)
- **Wykrycie**: Response code === 500
- **Akcja**:
  - Toast error: "Nie udało się usunąć konta. Spróbuj ponownie."
  - Możliwość retry
  - Opcja kontaktu z supportem (jeśli problem się powtarza)

### Błędy ładowania danych

**Scenariusz**: Brak danych użytkownika (profile === null)
- **Wykrycie**: Po zakończeniu ładowania, `profile === null && !isLoading`
- **Akcja**:
  - Wyświetlenie ErrorMessage w Sidebar/Header
  - Opcja "Odśwież" → ponowne pobranie
  - Fallback: ukrycie niektórych elementów (np. AIUsageCounter)

**Scenariusz**: Timeout request
- **Wykrycie**: Brak odpowiedzi w określonym czasie (np. 30s)
- **Akcja**:
  - Przerwanie request
  - Wyświetlenie komunikatu o timeout
  - Opcja retry
- **Komunikat**: "Ładowanie trwa zbyt długo. Sprawdź połączenie internetowe."

### Loading states

**Podczas ładowania profilu/AI usage**:
- Wyświetlenie `<LoadingSpinner>` w miejscu danych
- Skeleton loader dla Sidebar/Header
- Disabled state dla interaktywnych elementów

**Podczas usuwania konta**:
- Spinner na przycisku "Potwierdź"
- Disabled wszystkie elementy dialogu
- Komunikat: "Usuwanie konta..."

### Edge cases

**Scenariusz**: Offline / brak internetu
- **Wykrycie**: `navigator.onLine === false` lub network error
- **Akcja**:
  - Toast warning: "Brak połączenia z internetem"
  - Wyświetlenie cached data (jeśli dostępne)
  - Disable funkcji wymagających API

**Scenariusz**: Sesja wygasła podczas pracy
- **Wykrycie**: 401 error podczas aktywności użytkownika
- **Akcja**:
  - Automatyczne wylogowanie
  - Toast: "Sesja wygasła"
  - Przekierowanie na `/login` z `redirect` query param
  - Po zalogowaniu: powrót do poprzedniego widoku

**Scenariusz**: Race condition (np. usunięcie konta w dwóch tabach)
- **Wykrycie**: 404 Not Found na user endpoint
- **Akcja**:
  - Wylogowanie w obu tabach
  - Clear local storage
  - Przekierowanie na landing page

## 11. Kroki implementacji

### Krok 1: Przygotowanie typu i hooków bazowych

**1.1. Utworzenie nowych typów ViewModel**
- Plik: `src/components/common/types.ts`
- Dodać typy: `AIUsageViewModel`, `ToastMessage`, `NavigationItem`, `UserMenuItem`, `LoadingState`, `NavigationState`

**1.2. Utworzenie custom hooks**
- Plik: `src/components/common/hooks/useUserProfile.ts`
  - Implementacja fetch GET /api/users/me
  - State management dla profilu
  - Error handling i retry logic

- Plik: `src/components/common/hooks/useAIUsage.ts`
  - Implementacja fetch GET /api/users/ai-usage
  - Obliczenie AIUsageViewModel z UserAiUsageDTO
  - State management

- Plik: `src/components/common/hooks/useDeleteAccount.ts`
  - Implementacja DELETE /api/users/me
  - Walidacja confirmation string
  - Error handling

- Plik: `src/components/common/hooks/useNavigation.ts`
  - State dla mobile menu (open/closed)
  - Toggle, open, close functions

### Krok 2: Utworzenie kontekstów React

**2.1. UserProfileContext**
- Plik: `src/components/common/contexts/UserProfileContext.tsx`
- Provider wykorzystujący `useUserProfile` i `useAIUsage`
- Eksport `UserProfileProvider` i `useUserProfileContext` hook

**2.2. ToastContext (opcjonalnie, jeśli nie używamy Shadcn toast)**
- Plik: `src/components/common/contexts/ToastContext.tsx`
- Provider z queue management dla toast messages
- Eksport `ToastProvider` i `useToast` hook

### Krok 3: Implementacja utility components

**3.1. LoadingSpinner**
- Plik: `src/components/common/LoadingSpinner.tsx`
- Props: `size`, `message`, `overlay`, `className`
- Wykorzystanie Lucide `Loader2` icon z animacją
- Warianty: inline spinner, overlay spinner

**3.2. ErrorMessage**
- Plik: `src/components/common/ErrorMessage.tsx`
- Props: `error`, `onRetry`, `onDismiss`, `className`
- Wykorzystanie Shadcn `Alert` component
- Obsługa ApiErrorDTO i string messages

**3.3. ToastNotification**
- Plik: `src/components/common/ToastNotification.tsx`
- Wykorzystanie Shadcn `Toaster` i `Toast`
- Konfiguracja pozycji (top-right), auto-dismiss
- Typy: success, error, info, warning z odpowiednimi ikonami

### Krok 4: Implementacja AIUsageCounter

**4.1. Komponent AIUsageCounter**
- Plik: `src/components/common/AIUsageCounter.tsx`
- Props: `variant` ('full' | 'compact'), `className`
- Wykorzystanie hooka `useUserProfileContext` dla danych AI usage
- Obliczenie procentu wykorzystania
- Shadcn `Progress` component dla paska postępu
- Shadcn `Tooltip` z dodatkowymi informacjami
- Conditional rendering na podstawie `variant`
  - 'full': tekst "Wykorzystano w tym miesiącu: X/Y" + progress bar
  - 'compact': tylko "X/Y" + mały progress indicator

**4.2. Formatowanie daty resetu**
- Utility function: `formatResetDate(isoDate: string): string`
- Format: "DD.MM.YYYY" lub "za X dni"

### Krok 5: Implementacja UserMenu

**5.1. Przygotowanie menu items**
- Plik: `src/components/common/UserMenu.tsx`
- Definicja `USER_MENU_ITEMS: UserMenuItem[]`
  - Profil → navigate `/profile`
  - Ustawienia → navigate `/settings`
  - Wyloguj → logout action

**5.2. Komponent UserMenu**
- Props: `variant` ('full' | 'avatar-only'), `className`
- Wykorzystanie `useUserProfileContext` dla danych użytkownika
- Shadcn `DropdownMenu` jako główny kontener
- Shadcn `Avatar` jako trigger
- Generowanie menu items z ikonami (Lucide)
- Handler dla logout: wywołanie logout z context, przekierowanie
- Conditional rendering na podstawie `variant`

### Krok 6: Implementacja DeleteAccountDialog

**6.1. Komponent DeleteAccountDialog**
- Plik: `src/components/common/DeleteAccountDialog.tsx`
- Props: `open`, `onOpenChange`, `onSuccess`
- Wykorzystanie hooka `useDeleteAccount`
- Shadcn `Dialog` component
- State dla confirmation input
- Real-time validation: `isValid = confirmationInput === "DELETE"`
- Handler dla potwierdzenia:
  ```typescript
  const handleConfirm = async () => {
    const success = await deleteAccount(confirmationInput);
    if (success) {
      onSuccess();
      toast({ type: 'success', message: 'Konto zostało usunięte' });
    }
  };
  ```
- Disabled button logic
- Error display (jeśli API zwróci błąd)

### Krok 7: Implementacja Sidebar (Desktop)

**7.1. Komponent Sidebar**
- Plik: `src/components/common/Sidebar.tsx`
- Props: `className`
- Struktura HTML:
  - `<aside>` z fixed positioning, Tailwind: `hidden lg:flex`
  - Logo link do `/dashboard`
  - Dropdown "Nowe podsumowanie" (Shadcn DropdownMenu)
  - `<AIUsageCounter variant="full" />`
  - `<UserMenu variant="full" />`
- Shadcn `DropdownMenu` dla "Nowe podsumowanie":
  - Trigger: Button "Nowe"
  - Items: "Generuj z AI", "Stwórz ręcznie"
  - Icons: odpowiednie Lucide icons
- Navigation handlers (Astro navigate lub Next router)

### Krok 8: Implementacja Header (Mobile)

**8.1. Komponent Header**
- Plik: `src/components/common/Header.tsx`
- Props: `className`
- Wykorzystanie hooka `useNavigation` dla drawer state
- Struktura HTML:
  - `<header>` z fixed positioning, Tailwind: `lg:hidden`
  - Hamburger button (onClick → toggleMenu)
  - Logo link
  - `<AIUsageCounter variant="compact" />`
  - `<UserMenu variant="avatar-only" />`
- Shadcn `Sheet` dla mobile drawer:
  - Trigger: hamburger button
  - Side: left
  - Content: menu navigation items, AI usage details, settings, logout

**8.2. Mobile Drawer content**
- Lista opcji nawigacji
- Sekcja "Nowe podsumowanie" (expanded)
- `<AIUsageCounter variant="full" />` (pełne info)
- Link do Settings
- Przycisk Wyloguj
- Handler: po kliknięciu opcji → navigate + closeMenu

### Krok 9: Integracja z Layout Astro

**9.1. Utworzenie Layout component**
- Plik: `src/layouts/AppLayout.astro`
- Import komponentów: Sidebar, Header
- Struktura:
  ```astro
  <UserProfileProvider client:load>
    <Sidebar client:load />
    <Header client:load />
    <main class="lg:ml-64 pt-16 lg:pt-0">
      <slot />
    </main>
    <Toaster client:load />
  </UserProfileProvider>
  ```
- Responsive margins/padding dla main content
- Global error boundary (opcjonalnie)

**9.2. Middleware dla autoryzacji**
- Sprawdzenie w `src/middleware/index.ts`
- Dla ścieżek wymagających autoryzacji:
  - Check `Astro.locals.supabase.auth.getUser()`
  - Jeśli brak sesji: redirect `/login`

### Krok 10: Styling i responsywność

**10.1. Tailwind konfiguracja**
- Upewnić się, że breakpointy są zgodne (lg: 1024px)
- Dodać custom kolory dla AI usage states (jeśli potrzebne)
- Konfiguracja animacji dla drawer, tooltips

**10.2. Component styling**
- Sidebar: fixed left, height 100vh, z-index odpowiedni
- Header: fixed top, full width, z-index wyższy niż content
- Main content: margin-left na desktop (sidebar width), padding-top na mobile (header height)
- Mobile drawer: animacja slide-in z lewej

**10.3. Accessibility**
- ARIA labels dla przycisków (hamburger, avatar)
- Keyboard navigation dla dropdown/drawer
- Focus management (trap focus w dialog)
- Screen reader announcements dla toast

### Krok 11: Testy i walidacja

**11.1. Unit testy dla hooks**
- Test `useUserProfile`: mock fetch, sprawdzenie loading/error/success states
- Test `useAIUsage`: sprawdzenie obliczeń AIUsageViewModel
- Test `useDeleteAccount`: mock API call, sprawdzenie validation

**11.2. Component testy**
- Test AIUsageCounter: różne stany (normal, limit exceeded)
- Test DeleteAccountDialog: validation logic, API call
- Test UserMenu: dropdown interactions, logout flow

**11.3. Integration testy**
- Test całego flow: load app → wyświetlenie danych użytkownika
- Test usuwania konta: end-to-end flow
- Test responsywności: desktop ↔ mobile transitions

**11.4. Manual testing checklist**
- [ ] Sidebar wyświetla się poprawnie na desktop
- [ ] Header wyświetla się poprawnie na mobile
- [ ] AIUsageCounter pokazuje prawidłowe dane
- [ ] Tooltip wyświetla się po hover
- [ ] UserMenu dropdown działa poprawnie
- [ ] Logout funkcjonuje i przekierowuje
- [ ] Mobile drawer otwiera/zamyka się poprawnie
- [ ] DeleteAccountDialog waliduje input
- [ ] Usuwanie konta działa i wylogowuje użytkownika
- [ ] Toast notifications wyświetlają się poprawnie
- [ ] Error states wyświetlają się dla błędów API
- [ ] Loading states podczas fetch danych

### Krok 12: Dokumentacja

**12.1. Storybook (opcjonalnie)**
- Stories dla każdego komponentu
- Różne states: loading, error, success
- Interactive controls dla props

**12.2. README dla komponentów**
- Plik: `src/components/common/README.md`
- Opis każdego komponentu
- Przykłady użycia
- Props documentation
- Zależności (hooks, contexts)

**12.3. Code comments**
- JSDoc dla funkcji i komponentów
- Inline comments dla skomplikowanej logiki
- Type annotations (TypeScript)

### Krok 13: Optymalizacja i finalizacja

**13.1. Performance optimization**
- React.memo dla komponentów, które nie muszą się często re-renderować
- useMemo dla obliczenia AIUsageViewModel
- useCallback dla event handlers przekazywanych do dzieci
- Code splitting jeśli komponenty są duże

**13.2. Error monitoring**
- Integracja z narzędziem do monitoringu błędów (Sentry, LogRocket)
- Logging błędów API calls
- User analytics dla usage patterns

**13.3. Final review**
- Code review z zespołem
- Sprawdzenie accessibility (WCAG 2.1 AA)
- Sprawdzenie performance (Lighthouse)
- Sprawdzenie zgodności z design system
- Sprawdzenie zgodności z PRD i User Stories

---

**Koniec planu implementacji**
