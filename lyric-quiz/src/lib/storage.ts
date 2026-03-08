// src/lib/storage.ts
// C'est notre adaptateur central. Si un jour on passe sur React Native,
// on modifiera uniquement CE fichier (ex: en remplaçant localStorage par AsyncStorage).

export const Storage = {
    // ---- MÉTHODES GÉNÉRIQUES ----
    setItem: (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("Le stockage local n'est pas disponible.");
        }
    },

    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    },

    removeItem: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn("Le stockage local n'est pas disponible.");
        }
    },

    // ---- MÉTHODES SPÉCIFIQUES (Pour simplifier le code ailleurs) ----

    // Gérer le statut d'invité
    setGuestStatus: (isGuest: boolean): void => {
        if (isGuest) {
            Storage.setItem('isGuest', 'true');
        } else {
            Storage.removeItem('isGuest');
        }
    },

    getGuestStatus: (): boolean => {
        return Storage.getItem('isGuest') === 'true';
    },

    // Gérer l'historique des invités
    getGuestHistory: (): any[] => {
        const history = Storage.getItem('guest_history');
        return history ? JSON.parse(history) : [];
    },

    addGuestHistory: (historyData: any): void => {
        const currentHistory = Storage.getGuestHistory();
        currentHistory.push(historyData);
        Storage.setItem('guest_history', JSON.stringify(currentHistory));
    }
};