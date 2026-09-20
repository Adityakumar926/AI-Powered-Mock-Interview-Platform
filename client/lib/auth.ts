const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export interface StoredUser {
    id: string;
    _id?: string;
    name: string;
    email: string;
    role?: "Student" | "Mentor" | "Administrator";
}


// ── Token ─────────────────────────────────────────────────
export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
};

// ── User ──────────────────────────────────────────────────
export const getStoredUser = (): StoredUser | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const setStoredUser = (user: StoredUser): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = (): void => {
    localStorage.removeItem(USER_KEY);
};

// ── Combined ──────────────────────────────────────────────
export const clearAuth = (): void => {
    removeToken();
    removeStoredUser();
};

export const isAuthenticated = (): boolean => !!getToken();