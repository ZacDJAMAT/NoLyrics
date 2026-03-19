import { useState, useMemo } from 'react';
import { Search, ArrowLeft, CheckCircle2, XCircle, TrendingUp, ChevronDown } from 'lucide-react';
import { Input } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Word } from '../../types.ts';

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
                    globalSuccess: globalSuccess,
                });
            }
        });

        return Array.from(wordsMap.values());
    }, [lyricsData, globalStats]);

    const filteredAndSortedWords = useMemo(() => {
        let result = [...uniqueWords];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (w) => w.normalized.includes(query) || w.original.toLowerCase().includes(query)
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
        <div className="animate-in fade-in zoom-in-95 flex h-full w-full flex-col gap-6 duration-500">
            {/* HEADER ET BARRE D'OUTILS */}
            <div className="glass-panel sticky top-0 z-20 flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h2 className="titre-neon-secondary flex items-center gap-3 text-2xl md:text-3xl">
                        <TrendingUp
                            className="text-secondary h-6 w-6 md:h-8 md:w-8"
                            strokeWidth={2.5}
                        />
                        Statistiques Détaillées
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="rounded-xl border-white/10 hover:bg-white/10"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    {/* Recherche */}
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Rechercher un mot..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="focus-visible:ring-secondary font-texte h-12 rounded-xl border-white/10 bg-black/40 pl-9"
                        />
                    </div>

                    {/* MENU DE TRI PERSONNALISÉ (Glassmorphism) */}
                    <div className="relative w-full sm:w-64">
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            /* SUPPRESSION DU ONBLUR ICI */
                            className="text-foreground font-texte focus:ring-secondary/50 flex h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-2 transition-colors hover:bg-white/5 focus:ring-2 focus:outline-none"
                        >
                            <span className="truncate">
                                {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
                            </span>
                            <ChevronDown
                                className={`text-muted-foreground h-4 w-4 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* La liste déroulante flottante */}
                        {isSortOpen && (
                            <>
                                {/* NOUVEAU : Overlay invisible pour capter le clic en dehors sans bloquer les clics internes */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsSortOpen(false)}
                                />

                                <div className="glass-panel bg-popover/95 animate-in fade-in slide-in-from-top-2 absolute top-full right-0 left-0 z-50 mt-2 rounded-xl border border-white/10 p-1 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl duration-200">
                                    {SORT_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSortBy(option.value as SortOption);
                                                setIsSortOpen(false); // On ferme le menu manuellement après le tri
                                            }}
                                            className={`font-texte relative z-50 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                                                sortBy === option.value
                                                    ? 'bg-secondary/20 text-secondary font-bold'
                                                    : 'text-foreground hover:bg-white/10'
                                            } `}
                                        >
                                            {option.label}
                                            {sortBy === option.value && (
                                                <CheckCircle2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* GRILLE DES MOTS */}
            <div className="grid grid-cols-2 gap-3 pb-20 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
                {filteredAndSortedWords.map((wordData, index) => {
                    const isPerfect = wordData.globalSuccess === 100;
                    const isHard = wordData.globalSuccess < 50;

                    return (
                        <div
                            key={`${wordData.normalized}-${index}`}
                            className={`relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border p-4 backdrop-blur-md transition-all hover:scale-105 ${
                                wordData.isFound
                                    ? 'bg-secondary/5 border-secondary/20 hover:border-secondary/50 hover:shadow-[0_0_15px_rgba(64,201,255,0.2)]'
                                    : 'bg-destructive/10 border-destructive/30 hover:border-destructive/50 hover:shadow-[0_0_15px_rgba(255,42,95,0.2)]'
                            } `}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span
                                    className={`font-titre truncate text-lg ${wordData.isFound ? 'text-foreground' : 'text-destructive drop-shadow-[0_0_5px_rgba(255,42,95,0.5)]'}`}
                                >
                                    {wordData.original}
                                </span>
                                {wordData.isFound ? (
                                    <CheckCircle2 className="text-secondary h-5 w-5 shrink-0" />
                                ) : (
                                    <XCircle className="text-destructive h-5 w-5 shrink-0" />
                                )}
                            </div>

                            <div className="mt-2 flex flex-col gap-1">
                                <div className="font-texte text-muted-foreground flex items-center justify-between text-xs">
                                    <span>Réussite</span>
                                    <span className="text-foreground font-bold">
                                        {wordData.globalSuccess}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/50">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            isHard
                                                ? 'bg-destructive shadow-[0_0_10px_rgba(255,42,95,0.8)]'
                                                : isPerfect
                                                  ? 'bg-secondary shadow-[0_0_10px_rgba(64,201,255,0.8)]'
                                                  : 'bg-primary shadow-[0_0_10px_rgba(232,28,255,0.8)]'
                                        }`}
                                        style={{ width: `${wordData.globalSuccess}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredAndSortedWords.length === 0 && (
                    <div className="text-muted-foreground font-texte glass-panel col-span-full py-12 text-center text-lg">
                        Aucun mot trouvé pour cette recherche.
                    </div>
                )}
            </div>
        </div>
    );
}
