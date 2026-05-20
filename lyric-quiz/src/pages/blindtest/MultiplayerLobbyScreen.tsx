import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { subscribeToMatch, joinMatch } from '@/lib/multiplayer';
import { MultiplayerMatch } from '@/types';
import { Button } from '@/components/ui/button';
import { Copy, Check, Loader2, Users, ArrowLeft } from 'lucide-react';

export default function MultiplayerLobbyScreen() {
    const { matchId } = useParams<{ matchId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [match, setMatch] = useState<MultiplayerMatch | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [copied, setCopied] = useState(false);

    // 1. Charger les données initiales du match
    useEffect(() => {
        const fetchMatch = async () => {
            if (!matchId) return;

            const { data, error } = await supabase
                .from('multiplayer_matches')
                .select('*')
                .eq('id', matchId)
                .single();

            if (error || !data) {
                alert("Ce duel n'existe pas ou est terminé.");
                navigate('/mode/blindtest');
                return;
            }

            setMatch(data as MultiplayerMatch);
            setIsLoading(false);

            // Si le match est déjà en cours, on téléporte directement dans le jeu
            if (data.status === 'playing') {
                navigate(`/mode/blindtest/multi/${matchId}/play`);
            }
        };

        fetchMatch();
    }, [matchId, navigate]);

    // 2. ⚡ Écouter les changements en Temps Réel
    useEffect(() => {
        if (!matchId) return;

        const unsubscribe = subscribeToMatch(matchId, (updatedMatch) => {
            setMatch(updatedMatch);

            // Si l'invité a rejoint, le statut passe à 'playing', on lance le jeu !
            if (updatedMatch.status === 'playing') {
                navigate(`/mode/blindtest/multi/${matchId}/play`);
            }
        });

        // Nettoyage de l'écouteur quand on quitte la page
        return () => {
            unsubscribe();
        };
    }, [matchId, navigate]);

    // Action : Copier le lien
    const handleCopyLink = () => {
        const inviteLink = window.location.href;
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Action : L'invité clique sur Rejoindre
    const handleJoin = async () => {
        if (!user || !matchId) return;
        setIsJoining(true);

        const success = await joinMatch(matchId, user.id);
        if (!success) {
            alert('Impossible de rejoindre ce duel.');
            setIsJoining(false);
        }
        // Pas besoin de navigate ici : la mise à jour de la DB va déclencher
        // le useEffect (Realtime) juste au-dessus pour les DEUX joueurs !
    };

    if (isLoading || !match) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-white/30" />
            </div>
        );
    }

    const isHost = user?.id === match.host_id;

    return (
        <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center p-6">
            <Button
                variant="ghost"
                onClick={() => navigate('/mode/blindtest')}
                className="font-texte absolute top-6 left-6"
            >
                <ArrowLeft className="mr-2 h-5 w-5" /> Quitter
            </Button>

            <div className="animate-in zoom-in-95 flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-md">
                <Users className="text-secondary mb-6 h-20 w-20 drop-shadow-[0_0_15px_rgba(64,201,255,0.5)]" />

                <h1 className="font-titre mb-2 text-center text-4xl text-white">DUEL EN LIGNE</h1>

                {isHost ? (
                    // VUE DE L'HÔTE
                    <div className="mt-6 flex w-full flex-col items-center">
                        <p className="font-texte mb-6 text-center text-white/70">
                            Partage ce lien à ton adversaire. La partie se lancera automatiquement
                            dès qu'il rejoindra.
                        </p>

                        <div className="mb-6 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
                            <span className="flex-1 truncate pl-2 font-mono text-sm text-white/50">
                                {window.location.href}
                            </span>
                            <Button
                                onClick={handleCopyLink}
                                variant={copied ? 'default' : 'secondary'}
                                className={`shrink-0 ${copied ? 'bg-green-500 hover:bg-green-600' : ''}`}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        <div className="text-secondary flex animate-pulse items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="font-texte text-sm tracking-widest uppercase">
                                En attente de l'adversaire...
                            </span>
                        </div>
                    </div>
                ) : (
                    // VUE DE L'INVITÉ
                    <div className="mt-6 flex w-full flex-col items-center">
                        <p className="font-texte mb-8 text-center text-white/70">
                            Tu as été invité(e) à participer à un Blind Test Extrême. Prépare-toi !
                        </p>

                        <Button
                            onClick={handleJoin}
                            disabled={isJoining}
                            className="font-titre bg-secondary hover:bg-secondary/80 text-secondary-foreground w-full rounded-full px-8 py-6 text-xl shadow-[0_0_30px_rgba(64,201,255,0.5)] transition-all hover:scale-105"
                        >
                            {isJoining ? (
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-6 w-6" />
                            )}
                            REJOINDRE LE DUEL
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
