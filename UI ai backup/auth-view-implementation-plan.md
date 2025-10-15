# Plan implementacji widoku Autentykacji

## 1. Przegląd

Widok autentykacji odpowiada za obsługę rejestracji, logowania i resetowania hasła użytkowników. Będzie zaimplementowany jako zestaw modalnych okien dialogowych opartych na komponentach Shadcn/ui. Widok zapewnia pełną walidację formularzy, obsługę błędów oraz stany ładowania podczas komunikacji z Supabase Auth API. Po pomyślnej autentykacji użytkownik jest automatycznie przekierowywany do panelu głównego aplikacji.

## 2. Routing widoku

Widok autentykacji nie ma dedykowanej ścieżki routingu, ponieważ jest implementowany jako zestaw modali. Modalne okna będą wyświetlane na podstawie stanu aplikacji:
- Niezalogowany użytkownik na stronie głównej (`/`) - automatyczne wyświetlenie modalu logowania
- Parametr URL `?mode=register` - otwarcie modalu rejestracji
- Parametr URL `?mode=reset-password` - otwarcie modalu resetowania hasła
- Kliknięcie przycisków "Zaloguj się" / "Zarejestruj się" w aplikacji - programowe otwarcie odpowiedniego modalu

Po pomyślnej autentykacji:
- Logowanie: przekierowanie do `/dashboard`
- Rejestracja: przekierowanie do `/dashboard` z onboarding message
- Reset hasła: przekierowanie do strony ustawienia nowego hasła (obsługiwane przez Supabase)

## 3. Struktura komponentów

```
AuthModal (Dialog Shadcn)
├── LoginForm
│   ├── Input (email)
│   ├── Input (password)
│   ├── Button (Zaloguj się)
│   ├── Button (Zapomniałem hasła - link)
│   └── Button (Nie masz konta? - link)
├── RegisterForm
│   ├── Input (email)
│   ├── Input (password)
│   ├── Input (confirmPassword)
│   ├── Button (Zarejestruj się)
│   └── Button (Masz już konto? - link)
└── ResetPasswordForm
    ├── Input (email)
    ├── Button (Wyślij link)
    └── Button (Powrót do logowania - link)
```

**Komponenty pomocnicze:**
- `FormField` (Shadcn) - wrapper dla pól formularza z etykietami i komunikatami błędów
- `Alert` (Shadcn) - wyświetlanie komunikatów sukcesu/błędu
- `Spinner` - wskaźnik ładowania

## 4. Szczegóły komponentów

### AuthModal

**Opis:** Główny komponent modalny zarządzający wyświetlaniem różnych formularzy autentykacji. Oparty na komponencie Dialog z Shadcn/ui.

**Główne elementy:**
- `Dialog` (Shadcn) - kontener modalny
- `DialogContent` - zawartość modalu
- `DialogHeader` - nagłówek z tytułem
- `DialogDescription` - opcjonalny opis
- Jeden z formularzy: `LoginForm`, `RegisterForm`, lub `ResetPasswordForm`

**Obsługiwane zdarzenia:**
- `onOpenChange(open: boolean)` - zmiana stanu otwarcia/zamknięcia modalu
- `onModeChange(mode: AuthMode)` - przełączanie między trybami (login/register/reset)

**Warunki walidacji:**
- Brak specyficznych warunków - walidacja odbywa się w podkomponentach formularzy

**Typy:**
- `AuthModalProps` - props komponentu
- `AuthMode` - typ trybu autentykacji ('login' | 'register' | 'reset-password')

**Propsy:**
```typescript
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
}
```

### LoginForm

**Opis:** Formularz logowania użytkownika z walidacją pól email i hasło.

**Główne elementy:**
- `form` - element HTML formularza
- 2x `FormField` (email, password)
- `Input` (Shadcn) - pola wprowadzania danych
- `Button` (Shadcn) - przycisk submit "Zaloguj się"
- `Button` (variant: link) - link "Zapomniałem hasła"
- `Button` (variant: link) - link "Nie masz konta? Zarejestruj się"
- `Alert` - komunikaty błędów

**Obsługiwane zdarzenia:**
- `onSubmit` - wysłanie formularza logowania
- `onForgotPasswordClick` - przełączenie na formularz resetowania hasła
- `onRegisterClick` - przełączenie na formularz rejestracji

**Warunki walidacji:**
- Email:
  - Pole wymagane (nie może być puste)
  - Poprawny format adresu email (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Password:
  - Pole wymagane (nie może być puste)
  - Minimum 6 znaków

**Typy:**
- `LoginFormData` - dane formularza
- `LoginFormProps` - props komponentu

**Propsy:**
```typescript
interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
}
```

### RegisterForm

**Opis:** Formularz rejestracji nowego użytkownika z walidacją email, hasła i potwierdzenia hasła.

**Główne elementy:**
- `form` - element HTML formularza
- 3x `FormField` (email, password, confirmPassword)
- `Input` (Shadcn) - pola wprowadzania danych
- `Button` (Shadcn) - przycisk submit "Zarejestruj się"
- `Button` (variant: link) - link "Masz już konto? Zaloguj się"
- `Alert` - komunikaty błędów/sukcesu

**Obsługiwane zdarzenia:**
- `onSubmit` - wysłanie formularza rejestracji
- `onLoginClick` - przełączenie na formularz logowania

**Warunki walidacji:**
- Email:
  - Pole wymagane (nie może być puste)
  - Poprawny format adresu email (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
  - Unikalność (weryfikowana przez Supabase)
- Password:
  - Pole wymagane (nie może być puste)
  - Minimum 8 znaków
  - Zawiera przynajmniej jedną wielką literę
  - Zawiera przynajmniej jedną cyfrę
- Confirm Password:
  - Pole wymagane (nie może być puste)
  - Musi być identyczne z polem Password

**Typy:**
- `RegisterFormData` - dane formularza
- `RegisterFormProps` - props komponentu

**Propsy:**
```typescript
interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}
```

### ResetPasswordForm

**Opis:** Formularz resetowania hasła - wysyła email z linkiem do zmiany hasła.

**Główne elementy:**
- `form` - element HTML formularza
- `FormField` (email)
- `Input` (Shadcn) - pole email
- `Button` (Shadcn) - przycisk submit "Wyślij link resetujący"
- `Button` (variant: link) - link "Powrót do logowania"
- `Alert` - komunikaty sukcesu/błędu

**Obsługiwane zdarzenia:**
- `onSubmit` - wysłanie żądania resetu hasła
- `onBackToLoginClick` - powrót do formularza logowania

**Warunki walidacji:**
- Email:
  - Pole wymagane (nie może być puste)
  - Poprawny format adresu email (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)

**Typy:**
- `ResetPasswordFormData` - dane formularza
- `ResetPasswordFormProps` - props komponentu

**Propsy:**
```typescript
interface ResetPasswordFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}
```

## 5. Typy

### AuthMode
```typescript
type AuthMode = 'login' | 'register' | 'reset-password';
```

### AuthModalProps
```typescript
interface AuthModalProps {
  isOpen: boolean;                    // Stan otwarcia modalu
  onClose: () => void;                // Callback zamknięcia modalu
  initialMode?: AuthMode;             // Początkowy tryb (domyślnie 'login')
  onModeChange?: (mode: AuthMode) => void; // Callback zmiany trybu
}
```

### LoginFormData
```typescript
interface LoginFormData {
  email: string;                      // Adres email użytkownika
  password: string;                   // Hasło użytkownika
}
```

### LoginFormProps
```typescript
interface LoginFormProps {
  onSuccess: () => void;              // Callback po pomyślnym logowaniu
  onSwitchToRegister: () => void;     // Przełączenie na formularz rejestracji
  onSwitchToReset: () => void;        // Przełączenie na reset hasła
}
```

### RegisterFormData
```typescript
interface RegisterFormData {
  email: string;                      // Adres email użytkownika
  password: string;                   // Hasło użytkownika
  confirmPassword: string;            // Potwierdzenie hasła
}
```

### RegisterFormProps
```typescript
interface RegisterFormProps {
  onSuccess: () => void;              // Callback po pomyślnej rejestracji
  onSwitchToLogin: () => void;        // Przełączenie na formularz logowania
}
```

### ResetPasswordFormData
```typescript
interface ResetPasswordFormData {
  email: string;                      // Adres email do resetu hasła
}
```

### ResetPasswordFormProps
```typescript
interface ResetPasswordFormProps {
  onSuccess: () => void;              // Callback po wysłaniu linku
  onSwitchToLogin: () => void;        // Powrót do logowania
}
```

### AuthError
```typescript
interface AuthError {
  message: string;                    // Komunikat błędu dla użytkownika
  code?: string;                      // Kod błędu z Supabase
  field?: 'email' | 'password' | 'confirmPassword'; // Pole z błędem
}
```

### FormState
```typescript
interface FormState {
  isSubmitting: boolean;              // Stan wysyłania formularza
  error: AuthError | null;            // Aktualny błąd
  success: boolean;                   // Stan sukcesu
}
```

## 6. Zarządzanie stanem

### Stan lokalny komponentów

Każdy formularz zarządza własnym stanem przy użyciu React Hook Form lub prostych useState hooks:

**LoginForm:**
```typescript
const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
const [formState, setFormState] = useState<FormState>({
  isSubmitting: false,
  error: null,
  success: false
});
```

**RegisterForm:**
```typescript
const [formData, setFormData] = useState<RegisterFormData>({
  email: '',
  password: '',
  confirmPassword: ''
});
const [formState, setFormState] = useState<FormState>({
  isSubmitting: false,
  error: null,
  success: false
});
```

**ResetPasswordForm:**
```typescript
const [formData, setFormData] = useState<ResetPasswordFormData>({ email: '' });
const [formState, setFormState] = useState<FormState>({
  isSubmitting: false,
  error: null,
  success: false
});
```

### Custom Hook: useAuth

Rekomendowane jest stworzenie custom hooka `useAuth` do centralizacji logiki autentykacji:

```typescript
interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

function useAuth(): UseAuthReturn {
  // Implementacja z wykorzystaniem Supabase Auth
}
```

### Stan globalny aplikacji

Wymaga kontekstu autentykacji (`AuthContext`) do udostępnienia stanu zalogowania w całej aplikacji:

```typescript
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

## 7. Integracja API

### Supabase Auth SDK

Wszystkie operacje autentykacji wykorzystują Supabase Auth SDK dostępny w `src/db/supabase.client.ts`.

### Logowanie użytkownika

**Metoda:** `supabase.auth.signInWithPassword()`

**Request:**
```typescript
{
  email: string;    // Adres email użytkownika
  password: string; // Hasło użytkownika
}
```

**Response (sukces):**
```typescript
{
  data: {
    user: User;
    session: Session;
  };
  error: null;
}
```

**Response (błąd):**
```typescript
{
  data: {
    user: null;
    session: null;
  };
  error: AuthError;
}
```

**Przykład użycia:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: formData.email,
  password: formData.password
});

if (error) {
  setFormState({ 
    isSubmitting: false, 
    error: { message: 'Nieprawidłowy email lub hasło', code: error.code },
    success: false 
  });
  return;
}

// Przekierowanie do dashboard
navigate('/dashboard');
```

### Rejestracja użytkownika

**Metoda:** `supabase.auth.signUp()`

**Request:**
```typescript
{
  email: string;    // Adres email użytkownika
  password: string; // Hasło użytkownika
}
```

**Response (sukces):**
```typescript
{
  data: {
    user: User;
    session: Session;
  };
  error: null;
}
```

**Response (błąd - email zajęty):**
```typescript
{
  data: {
    user: null;
    session: null;
  };
  error: {
    message: "User already registered";
    code: "user_already_exists";
  }
}
```

**Przykład użycia:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password
});

if (error) {
  const message = error.code === 'user_already_exists' 
    ? 'Użytkownik o podanym adresie email już istnieje'
    : 'Wystąpił błąd podczas rejestracji';
  
  setFormState({ 
    isSubmitting: false, 
    error: { message, code: error.code, field: 'email' },
    success: false 
  });
  return;
}

// Auto-login i przekierowanie
navigate('/dashboard');
```

### Resetowanie hasła

**Metoda:** `supabase.auth.resetPasswordForEmail()`

**Request:**
```typescript
{
  email: string;           // Adres email użytkownika
  redirectTo?: string;     // URL przekierowania po kliknięciu w link
}
```

**Response (sukces):**
```typescript
{
  data: {};
  error: null;
}
```

**Response (błąd):**
```typescript
{
  data: null;
  error: AuthError;
}
```

**Przykład użycia:**
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
  redirectTo: `${window.location.origin}/update-password`
});

if (error) {
  setFormState({ 
    isSubmitting: false, 
    error: { message: 'Nie udało się wysłać linku resetującego', code: error.code },
    success: false 
  });
  return;
}

setFormState({ 
  isSubmitting: false, 
  error: null,
  success: true 
});

// Wyświetlenie komunikatu sukcesu
```

## 8. Interakcje użytkownika

### Otwieranie modalu autentykacji

**Trigger:** 
- Wejście na stronę główną bez sesji
- Kliknięcie przycisku "Zaloguj się" / "Zarejestruj się"
- Parametr URL `?mode=register` lub `?mode=reset-password`

**Akcja:**
- Otwarcie `AuthModal` z odpowiednim trybem
- Focus automatycznie ustawiony na pierwsze pole formularza

### Logowanie

**Interakcje:**
1. Użytkownik wpisuje email i hasło
2. Walidacja w czasie rzeczywistym po opuszczeniu pola (onBlur)
3. Kliknięcie "Zaloguj się"
4. Wyświetlenie spinnera i zablokowanie formularza
5. Wywołanie API

**Wyniki:**
- **Sukces:** Przekierowanie do `/dashboard`, zamknięcie modalu, wyświetlenie toast "Zalogowano pomyślnie"
- **Błąd:** Wyświetlenie komunikatu błędu pod formularzem, odblokowanie formularza, focus na polu z błędem

### Przełączanie na rejestrację

**Trigger:** Kliknięcie "Nie masz konta? Zarejestruj się"

**Akcja:**
- Zmiana trybu modalu na 'register'
- Wyczyszczenie formularza logowania
- Otwarcie formularza rejestracji
- Focus na polu email

### Rejestracja

**Interakcje:**
1. Użytkownik wpisuje email, hasło i potwierdzenie hasła
2. Walidacja w czasie rzeczywistym:
   - Email: format po onBlur
   - Hasło: siła hasła podczas wpisywania (wskaźnik)
   - Potwierdzenie: zgodność z hasłem po onBlur
3. Kliknięcie "Zarejestruj się"
4. Wyświetlenie spinnera i zablokowanie formularza
5. Wywołanie API

**Wyniki:**
- **Sukces:** Przekierowanie do `/dashboard` z onboarding message, zamknięcie modalu
- **Błąd (email zajęty):** Komunikat "Użytkownik o podanym adresie email już istnieje" przy polu email
- **Błąd (inny):** Komunikat ogólny pod formularzem

### Przełączanie na logowanie

**Trigger:** Kliknięcie "Masz już konto? Zaloguj się"

**Akcja:**
- Zmiana trybu modalu na 'login'
- Wyczyszczenie formularza rejestracji
- Otwarcie formularza logowania

### Reset hasła

**Interakcje:**
1. Kliknięcie "Zapomniałem hasła" w formularzu logowania
2. Zmiana trybu na 'reset-password'
3. Użytkownik wpisuje email
4. Walidacja formatu email po onBlur
5. Kliknięcie "Wyślij link resetujący"
6. Wyświetlenie spinnera
7. Wywołanie API

**Wyniki:**
- **Sukces:** Wyświetlenie komunikatu "Link resetujący został wysłany na podany adres email", przycisk "Powrót do logowania"
- **Błąd:** Komunikat "Nie udało się wysłać linku resetującego. Spróbuj ponownie."

### Zamykanie modalu

**Trigger:** 
- Kliknięcie X w rogu modalu
- Kliknięcie poza modalem (backdrop)
- Naciśnięcie ESC

**Akcja:**
- Zamknięcie modalu
- Wyczyszczenie wszystkich formularzy
- Reset stanów błędów i ładowania

## 9. Warunki i walidacja

### Walidacja pola Email (wszystkie formularze)

**Warunki:**
- **Pole wymagane:** Email nie może być pusty
- **Format:** Musi spełniać regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Weryfikacja:**
- Komponenty: `LoginForm`, `RegisterForm`, `ResetPasswordForm`
- Moment: onBlur (po opuszczeniu pola)
- Wpływ na UI:
  - Błąd: czerwona ramka pola, komunikat "Podaj poprawny adres email" pod polem
  - OK: zielona ramka (opcjonalnie), brak komunikatu
  - Przycisk submit disabled dopóki wszystkie pola nie są poprawne

### Walidacja hasła (LoginForm)

**Warunki:**
- **Pole wymagane:** Hasło nie może być puste
- **Minimalna długość:** 6 znaków

**Weryfikacja:**
- Komponent: `LoginForm`
- Moment: onBlur
- Wpływ na UI:
  - Błąd: czerwona ramka, komunikat "Hasło musi mieć minimum 6 znaków"
  - Przycisk submit disabled dopóki pole nie jest poprawne

### Walidacja hasła (RegisterForm)

**Warunki:**
- **Pole wymagane:** Hasło nie może być puste
- **Minimalna długość:** 8 znaków
- **Wielka litera:** Przynajmniej jedna wielka litera (A-Z)
- **Cyfra:** Przynajmniej jedna cyfra (0-9)

**Weryfikacja:**
- Komponent: `RegisterForm`
- Moment: onChange (na bieżąco) + onBlur
- Wpływ na UI:
  - Wskaźnik siły hasła (słabe/średnie/silne) pod polem
  - Lista wymagań z checkmarkami (✓ minimum 8 znaków, ✓ wielka litera, ✓ cyfra)
  - Czerwona/żółta/zielona ramka w zależności od spełnienia warunków
  - Przycisk submit disabled dopóki wszystkie warunki nie są spełnione

### Walidacja potwierdzenia hasła (RegisterForm)

**Warunki:**
- **Pole wymagane:** Potwierdzenie nie może być puste
- **Zgodność:** Musi być identyczne z polem Password

**Weryfikacja:**
- Komponent: `RegisterForm`
- Moment: onChange (po zmianie hasła) + onBlur (po opuszczeniu pola potwierdzenia)
- Wpływ na UI:
  - Błąd: czerwona ramka, komunikat "Hasła nie są zgodne"
  - OK: zielona ramka, komunikat "Hasła są zgodne" lub checkmark
  - Przycisk submit disabled dopóki hasła nie są zgodne

### Walidacja po stronie backendu

**Email zajęty (RegisterForm):**
- Weryfikacja: Supabase Auth podczas wywołania `signUp()`
- Błąd: `user_already_exists`
- Wpływ na UI: Czerwona ramka przy polu email, komunikat "Użytkownik o podanym adresie email już istnieje"

**Nieprawidłowe dane logowania (LoginForm):**
- Weryfikacja: Supabase Auth podczas wywołania `signInWithPassword()`
- Błąd: `invalid_credentials`
- Wpływ na UI: Alert pod formularzem "Nieprawidłowy email lub hasło"

### Ogólne zasady walidacji

- Wszystkie pola są wymagane
- Walidacja odbywa się onBlur dla lepszego UX
- Przycisk submit jest disabled dopóki formularz nie jest poprawny
- Błędy są wyświetlane pod konkretnymi polami (inline validation)
- Błędy API są wyświetlane jako Alert na górze formularza
- Po pomyślnej walidacji wszystkich pól przycisk submit staje się aktywny

## 10. Obsługa błędów

### Błędy walidacji formularza

**Typ:** Client-side validation errors

**Scenariusze:**
- Puste pole wymagane
- Nieprawidłowy format email
- Hasło za krótkie
- Hasło nie spełnia wymogów bezpieczeństwa
- Hasła nie są zgodne

**Obsługa:**
- Wyświetlenie komunikatu błędu pod konkretnym polem
- Czerwona ramka wokół pola z błędem
- Zablokowanie przycisku submit
- Focus na pierwszym polu z błędem po próbie wysłania formularza

### Błędy API - Autentykacja

**Email już istnieje (rejestracja):**
```typescript
error.code === 'user_already_exists'
```
**Obsługa:** Wyświetlenie komunikatu "Użytkownik o podanym adresie email już istnieje" przy polu email, zasugerowanie logowania

**Nieprawidłowe dane logowania:**
```typescript
error.code === 'invalid_credentials'
```
**Obsługa:** Alert "Nieprawidłowy email lub hasło", zasugerowanie resetu hasła

**Email nie istnieje (reset hasła):**
```typescript
error.code === 'user_not_found'
```
**Obsługa:** Ze względów bezpieczeństwa wyświetlić ten sam komunikat sukcesu co przy poprawnym emailu

### Błędy sieciowe

**Scenariusz:** Brak połączenia z internetem, timeout, błąd serwera

**Obsługa:**
- Wychwycenie błędu w bloku try-catch
- Wyświetlenie Alertu: "Wystąpił problem z połączeniem. Sprawdź połączenie internetowe i spróbuj ponownie."
- Przycisk "Spróbuj ponownie" do powtórzenia operacji
- Logowanie błędu do konsoli dla debugowania

**Przykład:**
```typescript
try {
  const { data, error } = await supabase.auth.signInWithPassword({...});
  // ...
} catch (err) {
  console.error('Network error:', err);
  setFormState({
    isSubmitting: false,
    error: {
      message: 'Wystąpił problem z połączeniem. Sprawdź połączenie internetowe i spróbuj ponownie.'
    },
    success: false
  });
}
```

### Błędy ogólne (nieznane)

**Scenariusz:** Nieoczekiwany błąd, błąd w kodzie, niezidentyfikowany błąd API

**Obsługa:**
- Wyświetlenie ogólnego komunikatu: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
- Logowanie pełnego błędu do konsoli
- W przyszłości: integracja z systemem monitorowania błędów (Sentry)

### Sesje użytkownika

**Scenariusz:** Wygaśnięcie sesji podczas korzystania z aplikacji

**Obsługa:**
- Listener na zdarzenia Supabase Auth (`onAuthStateChange`)
- Automatyczne wylogowanie i przekierowanie do strony logowania
- Wyświetlenie komunikatu: "Twoja sesja wygasła. Zaloguj się ponownie."

### Rate limiting

**Scenariusz:** Za dużo prób logowania/rejestracji w krótkim czasie

**Obsługa:**
- Wykrycie błędu `rate_limit_exceeded`
- Wyświetlenie komunikatu: "Zbyt wiele prób. Spróbuj ponownie za kilka minut."
- Opcjonalnie: timer odliczający do możliwości ponownej próby

### Przywracanie po błędzie

Wszystkie błędy powinny pozwalać użytkownikowi na kontynuację:
- Formularze pozostają wypełnione po błędzie
- Użytkownik może skorygować dane i spróbować ponownie
- Przycisk submit jest odblokowany po naprawieniu błędu
- Komunikaty błędów znikają po ponownym wypełnieniu pola

## 11. Kroki implementacji

### Krok 1: Przygotowanie środowiska i typów

1. Zainstaluj wymagane zależności Shadcn/ui:
   ```bash
   npx shadcn-ui@latest add dialog
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add alert
   npx shadcn-ui@latest add form
   ```

2. Utwórz plik z typami: `src/types/auth.types.ts`
   - Zdefiniuj wszystkie typy opisane w sekcji 5 (AuthMode, FormData, Props, itp.)

3. Skonfiguruj Supabase client w `src/db/supabase.client.ts` (jeśli nie istnieje)

### Krok 2: Implementacja custom hooka useAuth

1. Utwórz plik: `src/components/hooks/useAuth.ts`
2. Zaimplementuj funkcje:
   - `signIn(email, password)`
   - `signUp(email, password)`
   - `signOut()`
   - `resetPassword(email)`
3. Dodaj obsługę stanu ładowania i błędów
4. Zintegruj z Supabase Auth SDK

### Krok 3: Implementacja AuthContext

1. Utwórz plik: `src/contexts/AuthContext.tsx`
2. Utwórz Context i Provider z wartościami:
   - `user`, `session`, `isAuthenticated`, `isLoading`
3. Dodaj listener na `onAuthStateChange` do synchronizacji stanu
4. Obuduj aplikację w `AuthProvider` w głównym layoucie

### Krok 4: Implementacja komponentu LoginForm

1. Utwórz plik: `src/components/auth/LoginForm.tsx`
2. Zaimplementuj strukturę formularza z Shadcn/ui
3. Dodaj useState dla `formData` i `formState`
4. Zaimplementuj walidację:
   - Email: regex, pole wymagane
   - Password: minimalna długość
5. Dodaj funkcję `handleSubmit`:
   - Wywołanie `useAuth().signIn()`
   - Obsługa błędów
   - Przekierowanie po sukcesie
6. Dodaj przyciski przełączania na Register i ResetPassword
7. Dodaj stany ładowania (spinner w przycisku submit)

### Krok 5: Implementacja komponentu RegisterForm

1. Utwórz plik: `src/components/auth/RegisterForm.tsx`
2. Zaimplementuj strukturę formularza (3 pola)
3. Dodaj useState dla `formData` i `formState`
4. Zaimplementuj walidację:
   - Email: regex, pole wymagane
   - Password: długość, wielka litera, cyfra
   - ConfirmPassword: zgodność z password
5. Dodaj wskaźnik siły hasła (komponent PasswordStrength)
6. Dodaj funkcję `handleSubmit`:
   - Wywołanie `useAuth().signUp()`
   - Obsługa błędów (szczególnie `user_already_exists`)
   - Przekierowanie do dashboard po sukcesie
7. Dodaj przycisk przełączania na Login
8. Dodaj stany ładowania

### Krok 6: Implementacja komponentu ResetPasswordForm

1. Utwórz plik: `src/components/auth/ResetPasswordForm.tsx`
2. Zaimplementuj strukturę formularza (1 pole)
3. Dodaj useState dla `formData` i `formState`
4. Zaimplementuj walidację email
5. Dodaj funkcję `handleSubmit`:
   - Wywołanie `useAuth().resetPassword()`
   - Obsługa błędów
   - Wyświetlenie komunikatu sukcesu
6. Dodaj przycisk powrotu do Login
7. Dodaj stan sukcesu (wyświetlenie komunikatu zamiast formularza)

### Krok 7: Implementacja komponentu AuthModal

1. Utwórz plik: `src/components/auth/AuthModal.tsx`
2. Zaimplementuj Dialog z Shadcn/ui
3. Dodaj useState dla aktualnego trybu (`AuthMode`)
4. Zaimplementuj conditional rendering:
   - `mode === 'login'` → `<LoginForm />`
   - `mode === 'register'` → `<RegisterForm />`
   - `mode === 'reset-password'` → `<ResetPasswordForm />`
5. Dodaj funkcje przełączania między trybami
6. Przekaż odpowiednie propsy do formularzy:
   - `onSuccess` - zamknięcie modalu
   - `onSwitchTo*` - zmiana trybu
7. Dodaj obsługę parametrów URL (`?mode=register`)
8. Zaimplementuj wyczyszczenie formularzy przy zamknięciu modalu

### Krok 8: Integracja z routing i layoutem

1. W głównym layoucie (`src/layouts/Layout.astro`):
   - Dodaj `AuthProvider`
   - Dodaj logikę wyświetlania `AuthModal` dla niezalogowanych użytkowników
2. Dodaj middleware autentykacji (`src/middleware/index.ts`):
   - Weryfikacja sesji Supabase
   - Przekierowanie niezalogowanych użytkowników na stronę główną z modalem
3. Zaimplementuj guard dla chronionych stron

### Krok 9: Implementacja pomocniczych komponentów

1. `PasswordStrengthIndicator.tsx`:
   - Wizualizacja siły hasła (weak/medium/strong)
   - Lista wymagań z checkmarkami
2. `FormErrorMessage.tsx`:
   - Komponent do wyświetlania błędów walidacji
3. `LoadingButton.tsx`:
   - Button ze spinnerem podczas ładowania

### Krok 10: Stylowanie i responsywność

1. Dostosuj style Dialog dla mobile (full screen na małych ekranach)
2. Przetestuj responsive design dla wszystkich formularzy
3. Dodaj animacje przejść między trybami (fade in/out)
4. Dostosuj kolory błędów/sukcesu zgodnie z design system

### Krok 11: Obsługa błędów i edge cases

1. Dodaj try-catch we wszystkich wywołaniach API
2. Zaimplementuj obsługę błędów sieciowych
3. Dodaj ostrzeżenie przed zamknięciem modalu podczas submitu
4. Dodaj timeout dla wywołań API
5. Przetestuj wszystkie scenariusze błędów opisane w sekcji 10

### Krok 12: Testowanie i walidacja

1. Przetestuj wszystkie user stories:
   - US-001: Rejestracja
   - US-002: Logowanie
   - US-003: Reset hasła
2. Sprawdź walidację formularzy (wszystkie przypadki)
3. Przetestuj przełączanie między trybami
4. Sprawdź responsywność na różnych urządzeniach
5. Przetestuj obsługę błędów
6. Zweryfikuj dostępność (ARIA labels, keyboard navigation)

### Krok 13: Optymalizacja i finalizacja

1. Dodaj lazy loading dla komponentów formularzy
2. Zoptymalizuj re-rendery (React.memo gdzie potrzeba)
3. Dodaj prefetch dla Supabase Auth
4. Dodaj analytics events (opcjonalnie)
5. Przeprowadź code review
6. Aktualizuj dokumentację

### Krok 14: Deployment

1. Przetestuj na środowisku staging
2. Skonfiguruj email templates w Supabase (dla reset hasła)
3. Ustaw prawidłowe redirect URLs w Supabase Dashboard
4. Wdróż na produkcję
5. Monitoruj błędy w pierwszych dniach
