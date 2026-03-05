import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

export default function LoginScreen() {
    const { loginWithGoogle, continueAsGuest } = useAuth();

    return (
        <div className="min-h-screen bg-background text-foreground font-texte flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-primary-foreground">
            <div className="bg-card p-8 md:p-12 rounded-3xl shadow-[0_0_40px_rgba(232,28,255,0.1)] max-w-md w-full border border-border text-center animate-fade-in-up">

                <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary shadow-inner">
                    <svg className="w-10 h-10 drop-shadow-[0_0_8px_rgba(232,28,255,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                </div>

                <h1 className="text-5xl font-titre mb-4 tracking-widest text-primary drop-shadow-[0_0_15px_rgba(232,28,255,0.4)]">
                    NOLYRICS
                </h1>
                <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
                    Connecte-toi pour sauvegarder tes scores, débloquer ton historique et te comparer aux autres joueurs !
                </p>

                <div className="flex flex-col gap-4">
                    <Button
                        onClick={loginWithGoogle}
                        className="flex items-center justify-center gap-3 bg-white text-black hover:bg-neutral-200 h-14 rounded-2xl font-texte text-xl shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continuer avec Google
                    </Button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-titre uppercase tracking-wider">ou</span>
                        <div className="flex-grow border-t border-border"></div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={continueAsGuest}
                        className="h-14 border-border text-foreground hover:bg-muted rounded-2xl font-texte text-xl transition-all"
                    >
                        Jouer en tant qu'invité
                    </Button>
                </div>
            </div>
        </div>
    );
}