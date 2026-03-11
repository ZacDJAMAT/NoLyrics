import { useState, useMemo } from 'react';
import { Search, ArrowLeft, CheckCircle2, XCircle, TrendingUp, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Word } from '../types';

interface StatsDashboardProps {
    lyricsData: Word[][] | null;
    globalStats?: {
        wordStats: Record<string, { successRate: number }>;
    } | null;
    onClose: () => void;
}

type SortOption = 'global-desc' | 'global-asc' | 'personal' | 'alpha-asc';

// Définition de nos options de tri pour le menu
const SORT_OPTIONS = [
    { value: 'personal', label: 'Mes erreurs en premier' },
    { value: 'global-asc', label: 'Plus difficiles globaux' },
    { value: 'global-desc', label: 'Plus faciles globaux' },
    { value: 'alpha-asc', label: 'Alphabétique (A-Z)' },
];

export default function StatsDashboard({ lyricsData, globalStats, onClose }: StatsDashboardProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('personal');
    // NOUVEAU : État pour ouvrir/fermer notre menu déroulant personnalisé
    const [isSortOpen, setIsSortOpen] = useState(false);

    const uniqueWords = useMemo(() => {
        if (!lyricsData) return [];

        const wordsMap = new Map<string, Word & { globalSuccess: number }>();

        lyricsData.flat().forEach((word) => {
            if (!word.normalized || word.normalized.trim() === '') return;

            if (wordsMap.has(word.normalized)) {
                if (word.isFound) {
                    wordsMap.get(word.normalized)!.isFound = true;
                }
            } else {
                const globalSuccess = globalStats?.wordStats?.[word.normalized]?.successRate ?? 100;

                wordsMap.set(word.normalized, {
                    ...word,
                    globalSuccess: globalSuccess
                });
            }
        });

        return Array.from(wordsMap.values());
    }, [lyricsData, globalStats]);

    const filteredAndSortedWords = useMemo(() => {
        let result = [...uniqueWords];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(w =>
                w.normalized.includes(query) || w.original.toLowerCase().includes(query)
            );
        }

        result.sort((a, b) => {
            switch (sortBy) {
                case 'global-desc':
                    return b.globalSuccess - a.globalSuccess;
                case 'global-asc':
                    return a.globalSuccess - b.globalSuccess;
                case 'personal':
                    if (a.isFound === b.isFound) return a.normalized.localeCompare(b.normalized);
                    return a.isFound ? 1 : -1;
                case 'alpha-asc':
                    return a.normalized.localeCompare(b.normalized);
                default:
                    return 0;
            }
        });

        return result;
    }, [uniqueWords, searchQuery, sortBy]);

    return (
        <div className="w-full h-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">

            {/* HEADER ET BARRE D'OUTILS */}
            <div className="glass-panel p-4 md:p-6 flex flex-col gap-4 sticky top-0 z-20">
                <div className="flex items-center justify-between">
                    <h2 className="titre-neon-secondary text-2xl md:text-3xl flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-secondary" strokeWidth={2.5} />
                        Statistiques Détaillées
                    </h2>
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl border-white/10 hover:bg-white/10">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Recherche */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un mot..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-12 rounded-xl bg-black/40 border-white/10 focus-visible:ring-secondary font-texte"
                        />
                    </div>

                    {/* MENU DE TRI PERSONNALISÉ (Glassmorphism) */}
                    <div className="relative w-full sm:w-64">
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            /* SUPPRESSION DU ONBLUR ICI */
                            className="w-full h-12 rounded-xl bg-black/40 border border-white/10 text-foreground px-4 py-2 font-texte flex items-center justify-between hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        >
                            <span className="truncate">
                                {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* La liste déroulante flottante */}
                        {isSortOpen && (
                            <>
                                {/* NOUVEAU : Overlay invisible pour capter le clic en dehors sans bloquer les clics internes */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsSortOpen(false)}
                                />

                                <div className="absolute top-full left-0 right-0 mt-2 p-1 glass-panel bg-popover/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {SORT_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSortBy(option.value as SortOption);
                                                setIsSortOpen(false); // On ferme le menu manuellement après le tri
                                            }}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg font-texte text-sm transition-all flex items-center justify-between relative z-50
                                                ${sortBy === option.value
                                                ? 'bg-secondary/20 text-secondary font-bold'
                                                : 'text-foreground hover:bg-white/10'
                                            }
                                            `}
                                        >
                                            {option.label}
                                            {sortBy === option.value && <CheckCircle2 className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* GRILLE DES MOTS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 pb-20">
                {filteredAndSortedWords.map((wordData, index) => {
                    const isPerfect = wordData.globalSuccess === 100;
                    const isHard = wordData.globalSuccess < 50;

                    return (
                        <div
                            key={`${wordData.normalized}-${index}`}
                            className={`relative p-4 rounded-2xl flex flex-col justify-between gap-3 overflow-hidden border backdrop-blur-md transition-all hover:scale-105
                                ${wordData.isFound
                                ? 'bg-secondary/5 border-secondary/20 hover:border-secondary/50 hover:shadow-[0_0_15px_rgba(64,201,255,0.2)]'
                                : 'bg-destructive/10 border-destructive/30 hover:border-destructive/50 hover:shadow-[0_0_15px_rgba(255,42,95,0.2)]'
                            }
                            `}
                        >
                            <div className="flex justify-between items-start gap-2">
                                <span className={`font-titre text-lg truncate ${wordData.isFound ? 'text-foreground' : 'text-destructive drop-shadow-[0_0_5px_rgba(255,42,95,0.5)]'}`}>
                                    {wordData.original}
                                </span>
                                {wordData.isFound ? (
                                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-destructive shrink-0" />
                                )}
                            </div>

                            <div className="flex flex-col gap-1 mt-2">
                                <div className="flex justify-between items-center text-xs font-texte text-muted-foreground">
                                    <span>Réussite</span>
                                    <span className="font-bold text-foreground">{wordData.globalSuccess}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            isHard ? 'bg-destructive shadow-[0_0_10px_rgba(255,42,95,0.8)]' :
                                                isPerfect ? 'bg-secondary shadow-[0_0_10px_rgba(64,201,255,0.8)]' :
                                                    'bg-primary shadow-[0_0_10px_rgba(232,28,255,0.8)]'
                                        }`}
                                        style={{ width: `${wordData.globalSuccess}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredAndSortedWords.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground font-texte text-lg glass-panel">
                        Aucun mot trouvé pour cette recherche.
                    </div>
                )}
            </div>
        </div>
    );
}