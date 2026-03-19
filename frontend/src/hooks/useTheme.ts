import { useState, useEffect, useCallback } from 'react';

export interface ThemeDefinition {
    id: string;
    name: string;
    color: string;
    gradient: string;
    description: string;
}

export const THEMES: ThemeDefinition[] = [
    {
        id: 'dark-profissional',
        name: 'DARK PROFISSIONAL',
        color: '#6366f1',
        gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        description: 'Tema escuro elegante com acentos indigo',
    },
    {
        id: 'azul-sereno',
        name: 'AZUL SERENO',
        color: '#38bdf8',
        gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
        description: 'Tons azuis calmos e serenos',
    },
    {
        id: 'acolhedor',
        name: 'ACOLHEDOR',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        description: 'Tons quentes e aconchegantes',
    },
];

const THEME_STORAGE_KEY = 'app-theme';
const DEFAULT_THEME = 'dark-profissional';

export function applyThemeToDOM(themeId: string) {
    const root = document.documentElement;

    // Remove all theme classes
    THEMES.forEach(t => {
        root.classList.remove(`theme-${t.id}`);
    });

    // Add the new theme class
    root.classList.add(`theme-${themeId}`);
}

export function getStoredTheme(): string {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
}

export function useTheme() {
    const [selectedTheme, setSelectedTheme] = useState<string>(getStoredTheme);

    // Apply theme on mount and when it changes
    useEffect(() => {
        applyThemeToDOM(selectedTheme);
    }, [selectedTheme]);

    const changeTheme = useCallback((themeId: string) => {
        setSelectedTheme(themeId);
        localStorage.setItem(THEME_STORAGE_KEY, themeId);
        applyThemeToDOM(themeId);
    }, []);

    return {
        selectedTheme,
        changeTheme,
        themes: THEMES,
    };
}
