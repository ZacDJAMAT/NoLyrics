import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import LogoutConfirmModal from '../../components/modals/LogoutConfirmModal';
import { Button } from '../../components/ui/button';
import { ArrowLeft, User as UserIcon, Star, BarChart3, Disc3, Mic2, Flame } from 'lucide-react';

interface ProfileScreenProps {
    onClose?: () => void;
}

interface UserStats {
    allMusicPlayed: number;
    allMusicAvg: number;
    fillyricsPlayed: number;
    fillyricsPoints: number;
}

interface FavoriteArtist {
    id: string;
    item_id: string;
    item_name: string;
    image_url: string;
}

export default function ProfileScreen({ onClose }: ProfileScreenProps) {
    const { user, isGuest, logout, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [username, setUsername] = useState<string>('Joueur Inconnu');
    const [stats, setStats] = useState<UserStats>({
        allMusicPlayed: 0,
        allMusicAvg: 0,
        fillyricsPlayed: 0,
        fillyricsPoints: 0,
    });
    const [favorites, setFavorites] = useState<FavoriteArtist[]>([]);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user) return;
            setIsLoading(true);

            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single();

                if (profileData?.username) setUsername(profileData.username);

                const { data: allMusicData } = await supabase
                    .from('game_history')
                    .select('score_percentage')
                    .eq('user_id', user.id);

                const { data: fillyricsData } = await supabase
                    .from('history_fillyrics')
                    .select('points, session_id')
                    .eq('user_id', user.id);

                const { data: favsData } = await supabase
                    .from('user_favorites')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('item_type', 'artist');

                let avgScore = 0;
                if (allMusicData && allMusicData.length > 0) {
                    const totalScore = allMusicData.reduce(
                        (acc, curr) => acc + (curr.score_percentage || 0),
                        0
                    );
                    avgScore = Math.round(totalScore / allMusicData.length);
                }

                let totalPoints = 0;
                let uniqueSessionsCount = 0;

                if (fillyricsData && fillyricsData.length > 0) {
                    totalPoints = fillyricsData.reduce((acc, curr) => acc + (curr.points || 0), 0);
                    const uniqueSessions = new Set(fillyricsData.map((row) => row.session_id));
                    uniqueSessionsCount = uniqueSessions.size;
                }

                setStats({
                    allMusicPlayed: allMusicData?.length || 0,
                    allMusicAvg: avgScore,
                    fillyricsPlayed: uniqueSessionsCount,
                    fillyricsPoints: totalPoints,
                });

                if (favsData) setFavorites(favsData);
            } catch (error) {
                console.error('Erreur lors de la récupération du profil:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleBack = () => {
        if (onClose) onClose();
        else navigate(-1);
    };

    return (
        <div
            className={`bg-background text-foreground font-texte selection:bg-secondary selection:text-secondary-foreground animate-fade-in-up relative min-h-screen p-4 md:p-6 ${onClose ? 'fixed inset-0 z-[100] overflow-y-auto' : ''}`}
        >
            {showLogoutModal && (
                <LogoutConfirmModal
                    onConfirm={handleLogout}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}

            <header className="mx-auto mb-6 flex max-w-4xl items-center md:mb-8">
                <Button
                    variant="back"
                    onClick={handleBack}
                    className="font-texte h-9 px-2 text-base md:h-10 md:px-3 md:text-lg"
                >
                    <ArrowLeft className="h-5 w-5" /> Retour
                </Button>
            </header>

            <main className="mx-auto flex max-w-4xl flex-col gap-6">
                {/* 1. EN-TÊTE DU PROFIL (Pseudo + Avatar + Bouton Google) */}
                <div className="glass-panel relative flex flex-col items-center gap-6 overflow-hidden p-6 sm:flex-row sm:p-8">
                    <div className="absolute -top-10 -right-10 opacity-5">
                        <UserIcon className="h-64 w-64" />
                    </div>

                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/10 bg-black/50 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <UserIcon className="h-10 w-10 text-white/50" />
                        {isGuest && (
                            <div className="bg-primary/20 border-primary text-primary absolute -bottom-2 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
                                Invité
                            </div>
                        )}
                    </div>

                    <div className="z-10 flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
                        {isLoading ? (
                            <div className="mb-2 h-8 w-48 animate-pulse rounded-lg bg-white/10" />
                        ) : (
                            <h1 className="font-titre titre-neon-secondary text-4xl tracking-widest md:text-5xl">
                                {username}
                            </h1>
                        )}
                        <p className="font-texte mt-1 mb-4 text-sm tracking-wider text-white/40 uppercase">
                            Membre NoLyrics
                        </p>

                        {/* 👉 BOUTON GOOGLE DÉPLACÉ ET RÉDUIT */}
                        {isGuest && (
                            <Button
                                variant="outline"
                                onClick={loginWithGoogle}
                                className="font-titre border-secondary text-secondary hover:bg-secondary/10 w-auto rounded-lg px-4 py-2 text-sm tracking-widest uppercase transition-all"
                            >
                                Associer mon compte Google
                            </Button>
                        )}
                    </div>
                </div>

                {/* 2. GRILLE DE STATISTIQUES */}
                <div>
                    <h3 className="font-titre mb-4 flex items-center gap-2 px-2 text-xl text-white/80">
                        <BarChart3 className="text-secondary h-5 w-5" /> Statistiques de jeu
                    </h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="glass-panel border-t-primary/50 flex flex-col items-center justify-center border-t-2 p-4 text-center transition-colors hover:bg-white/5">
                            <Disc3 className="text-primary mb-2 h-6 w-6 opacity-80" />
                            <span className="font-titre text-3xl text-white">
                                {isLoading ? '-' : stats.allMusicPlayed}
                            </span>
                            <span className="text-[10px] tracking-wider text-white/50 uppercase">
                                Parties AllMusic
                            </span>
                        </div>
                        <div className="glass-panel border-t-primary/50 flex flex-col items-center justify-center border-t-2 p-4 text-center transition-colors hover:bg-white/5">
                            <Star className="text-primary mb-2 h-6 w-6 opacity-80" />
                            <span className="font-titre text-3xl text-white">
                                {isLoading ? '-' : `${stats.allMusicAvg}%`}
                            </span>
                            <span className="text-[10px] tracking-wider text-white/50 uppercase">
                                Score Moyen
                            </span>
                        </div>
                        <div className="glass-panel border-t-secondary/50 flex flex-col items-center justify-center border-t-2 p-4 text-center transition-colors hover:bg-white/5">
                            <Mic2 className="text-secondary mb-2 h-6 w-6 opacity-80" />
                            <span className="font-titre text-3xl text-white">
                                {isLoading ? '-' : stats.fillyricsPlayed}
                            </span>
                            <span className="text-[10px] tracking-wider text-white/50 uppercase">
                                Contrats Fillyrics
                            </span>
                        </div>
                        <div className="glass-panel border-t-secondary/50 relative flex flex-col items-center justify-center overflow-hidden border-t-2 p-4 text-center transition-colors hover:bg-white/5">
                            <div className="bg-secondary/5 absolute inset-0" />
                            <Flame className="text-secondary mb-2 h-6 w-6 drop-shadow-[0_0_8px_rgba(64,201,255,0.8)]" />
                            <span className="font-titre text-secondary text-3xl drop-shadow-[0_0_10px_rgba(64,201,255,0.5)]">
                                {isLoading ? '-' : stats.fillyricsPoints.toLocaleString()}
                            </span>
                            <span className="text-[10px] tracking-wider text-white/70 uppercase">
                                Points Totaux
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. ARTISTES FAVORIS */}
                <div>
                    <h3 className="font-titre mt-4 mb-4 flex items-center gap-2 px-2 text-xl text-white/80">
                        <Star className="h-5 w-5 text-yellow-400" /> Artistes Favoris
                    </h3>
                    <div className="glass-panel min-h-[150px] p-6">
                        {isLoading ? (
                            <div className="flex gap-4 overflow-hidden">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-white/10"
                                    />
                                ))}
                            </div>
                        ) : favorites.length > 0 ? (
                            <div className="scrollbar-hide flex gap-6 overflow-x-auto pb-4">
                                {favorites.map((fav) => (
                                    <div
                                        key={fav.id}
                                        className="group flex shrink-0 cursor-pointer flex-col items-center gap-2 transition-transform hover:scale-105"
                                    >
                                        <img
                                            src={fav.image_url}
                                            alt={fav.item_name}
                                            className="h-24 w-24 rounded-full border-2 border-white/10 object-cover shadow-lg group-hover:border-yellow-400/50"
                                        />
                                        <span className="font-titre max-w-[96px] truncate text-center text-sm text-white/80 group-hover:text-white">
                                            {fav.item_name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                                <p className="font-texte text-white/40 italic">
                                    Aucun artiste en favori pour le moment.
                                </p>
                                <p className="mt-1 text-xs text-white/30">
                                    Clique sur l'étoile à côté d'un artiste pour l'ajouter ici !
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. ACTIONS */}
                {/* 👉 LE BOUTON DE DÉCONNEXION N'APPARAÎT QUE POUR LES VRAIS COMPTES */}
                {!isGuest && (
                    <div className="mt-4 flex justify-center border-t border-white/10 pt-6 sm:justify-end">
                        <Button
                            variant="destructive"
                            onClick={() => setShowLogoutModal(true)}
                            className="font-titre hover:bg-destructive w-full rounded-xl px-6 py-5 text-base tracking-widest uppercase shadow-[0_0_15px_rgba(255,77,79,0.3)] transition-all hover:scale-105 sm:w-auto"
                        >
                            Se déconnecter
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
