import { Link } from 'react-router-dom';
import { Music, Mic, Sparkles } from 'lucide-react';
import UserMenuButton from '../../components/UserMenuButton.tsx';

export default function HubScreen() {
    return (
        <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 font-sans md:p-6">
            {/* Bouton Profil en haut à droite */}
            <div className="absolute top-4 right-4 z-20 md:top-6 md:right-6">
                <UserMenuButton />
            </div>

            {/* Effets de lumière en arrière-plan */}
            <div className="bg-primary/20 pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 rounded-full blur-[120px]" />
            <div className="bg-secondary/20 pointer-events-none absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full blur-[120px]" />

            <div className="animate-in fade-in slide-in-from-bottom-8 relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center duration-700">
                <h1 className="font-titre titre-neon-primary mb-4 text-6xl tracking-widest drop-shadow-[0_0_20px_rgba(232,28,255,0.4)] sm:text-7xl md:text-9xl">
                    NOLYRICS
                </h1>
                <p className="text-muted-foreground font-texte mb-16 flex items-center gap-2 text-xl md:text-2xl">
                    <Sparkles className="text-secondary h-6 w-6" />
                    Choisis ton mode de jeu
                </p>

                <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
                    {/* CARTE 1 : ALLyrics (Active) */}
                    <Link
                        to="/mode/allyrics"
                        className="group hover:border-primary/50 relative flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-[0_0_40px_rgba(232,28,255,0.3)] md:p-12"
                    >
                        <div className="from-primary/10 absolute inset-0 rounded-3xl bg-gradient-to-b to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <Music
                            className="text-primary mb-6 h-20 w-20 drop-shadow-[0_0_15px_rgba(232,28,255,0.5)] transition-transform duration-500 group-hover:scale-110 md:h-28 md:w-28"
                            strokeWidth={1.5}
                        />
                        <h2 className="font-titre mb-3 text-3xl text-white md:text-4xl">
                            ALLyrics
                        </h2>
                        <p className="text-muted-foreground font-texte text-lg transition-colors group-hover:text-white/90">
                            Retrouve toutes les paroles le plus vite possible.
                        </p>
                    </Link>

                    {/* CARTE 2 : Terminer les paroles (Désactivée) */}
                    <div className="group relative flex cursor-not-allowed flex-col items-center rounded-3xl border border-white/5 bg-white/5 p-8 opacity-60 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md md:p-12">
                        <div className="font-texte absolute top-4 right-4 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wider text-white/70">
                            BIENTÔT
                        </div>
                        <Mic
                            className="text-muted-foreground mb-6 h-20 w-20 md:h-28 md:w-28"
                            strokeWidth={1.5}
                        />
                        <h2 className="font-titre mb-3 text-3xl text-white/50 md:text-4xl">
                            Terminer les paroles
                        </h2>
                        <p className="text-muted-foreground/50 font-texte text-lg">
                            N'oublie pas les paroles quand la musique s'arrête.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
