import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
    // On récupère directement nos actions depuis le cerveau
    const { loginWithGoogle, continueAsGuest } = useAuth();

    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans flex flex-col items-center justify-center p-6 selection:bg-pink-500 selection:text-white">
            <div className="bg-neutral-800 p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full border border-neutral-700 text-center animate-fade-in-up">

                <div className="w-20 h-20 bg-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-pink-500">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                </div>

                <h1 className="text-3xl font-title mb-3 tracking-tight">NoLyrics</h1>
                <p className="text-neutral-400 mb-10 leading-relaxed">
                    Connecte-toi pour sauvegarder tes scores, débloquer ton historique et te comparer aux autres joueurs !
                </p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={loginWithGoogle}
                        className="group flex items-center justify-center gap-3 bg-white text-neutral-900 px-6 py-4 rounded-2xl font-bold transition-all hover:bg-neutral-200 active:scale-95 shadow-lg"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continuer avec Google
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-neutral-700"></div>
                        <span className="flex-shrink-0 mx-4 text-neutral-500 text-sm font-medium uppercase tracking-wider">ou</span>
                        <div className="flex-grow border-t border-neutral-700"></div>
                    </div>

                    <button
                        onClick={continueAsGuest}
                        className="bg-neutral-800 text-neutral-300 border border-neutral-700 px-6 py-4 rounded-2xl font-bold transition-all hover:bg-neutral-700 hover:text-white active:scale-95"
                    >
                        Jouer en tant qu'invité
                    </button>
                </div>
            </div>
        </div>
    );
}