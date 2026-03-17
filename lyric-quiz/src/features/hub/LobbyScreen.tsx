import { Link, useParams, useNavigate } from 'react-router-dom';
import { User, Globe, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button.tsx';
import UserMenuButton from '../../components/UserMenuButton.tsx';

export default function LobbyScreen() {
    const { modeId } = useParams();
    const navigate = useNavigate();

    // Petit formatage du nom pour l'affichage
    const displayModeName = modeId === 'allyrics' ? 'ALLyrics' : 'Mode Inconnu';

    return (
        <div className="bg-background text-foreground selection:bg-secondary selection:text-secondary-foreground relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 font-sans md:p-6">
            <div className="absolute top-4 right-4 z-20 md:top-6 md:right-6">
                <UserMenuButton />
            </div>

            <div className="absolute top-4 left-4 z-20 md:top-6 md:left-6">
                <Button variant="back" onClick={() => navigate('/')} className="text-lg">
                    <ArrowLeft className="h-5 w-5" />
                    Retour
                </Button>
            </div>

            {/* Effet de lumière cyan */}
            <div className="bg-secondary/10 pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px]" />

            <div className="animate-in fade-in zoom-in-95 relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center duration-500">
                <h2 className="font-texte text-muted-foreground mb-2 text-2xl tracking-[0.2em] uppercase md:text-3xl">
                    Lobby
                </h2>
                <h1 className="font-titre text-secondary mb-16 text-5xl drop-shadow-[0_0_15px_rgba(64,201,255,0.4)] md:text-7xl">
                    {displayModeName}
                </h1>

                <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                    {/* CARTE SOLO */}
                    <Link
                        to={`/mode/${modeId}/solo/search`}
                        className="group hover:bg-secondary/10 hover:border-secondary/50 relative flex items-center rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(64,201,255,0.2)] md:p-8"
                    >
                        <div className="bg-secondary/20 group-hover:bg-secondary/30 border-secondary/30 mr-6 flex h-16 w-16 items-center justify-center rounded-full border transition-all duration-300 group-hover:scale-110 md:h-20 md:w-20">
                            <User className="text-secondary h-8 w-8 drop-shadow-[0_0_8px_rgba(64,201,255,0.6)] md:h-10 md:w-10" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-titre mb-1 text-2xl text-white md:text-3xl">
                                Jouer en Solo
                            </h3>
                            <p className="text-muted-foreground font-texte text-base">
                                Entraîne-toi et bats tes records.
                            </p>
                        </div>
                    </Link>

                    {/* CARTE MULTIJOUEUR */}
                    <div className="group relative flex cursor-not-allowed items-center overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 opacity-50 shadow-lg backdrop-blur-md md:p-8">
                        <div className="absolute inset-0 z-10 bg-black/40" />{' '}
                        {/* Filtre sombre additionnel */}
                        <div className="font-texte absolute top-3 right-4 z-20 rounded bg-white/10 px-2 py-1 text-xs font-bold tracking-wider text-white/60">
                            EN DÉVELOPPEMENT
                        </div>
                        <div className="relative z-0 mr-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 md:h-20 md:w-20">
                            <Globe className="text-muted-foreground h-8 w-8 md:h-10 md:w-10" />
                        </div>
                        <div className="relative z-0 text-left">
                            <h3 className="font-titre mb-1 text-2xl text-white/50 md:text-3xl">
                                Jouer en Ligne
                            </h3>
                            <p className="text-muted-foreground/60 font-texte text-base">
                                Affronte d'autres joueurs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
