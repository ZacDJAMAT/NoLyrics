import { useState, useEffect } from 'react'

function App() {
    // --- ÉTATS : RECHERCHE ---
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalResults, setTotalResults] = useState(0)
    const limit = 12

    // --- ÉTATS : JEU ---
    const [selectedSong, setSelectedSong] = useState(null)
    const [lyricsData, setLyricsData] = useState(null)
    const [totalWords, setTotalWords] = useState(0)
    const [isFetchingLyrics, setIsFetchingLyrics] = useState(false)
    const [currentInput, setCurrentInput] = useState('')
    const [foundWordsCount, setFoundWordsCount] = useState(0)

    // NOUVEAUX ÉTATS POUR LE CHRONO ET LA FIN DE PARTIE
    const [timeLeft, setTimeLeft] = useState(300); // 300 secondes = 5 minutes
    const [gameStatus, setGameStatus] = useState('idle'); // 'idle', 'playing', 'won', 'lost'

    // ==========================================
    // GESTION DU CHRONOMÈTRE
    // ==========================================
    useEffect(() => {
        let timer;
        // Si le jeu est en cours et qu'il reste du temps
        if (gameStatus === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        // Si le temps tombe à zéro
        else if (timeLeft === 0 && gameStatus === 'playing') {
            setGameStatus('lost');
        }

        // Nettoyage du chrono pour éviter les bugs
        return () => clearInterval(timer);
    }, [gameStatus, timeLeft]);

    // Fonction pour afficher le temps en format MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ==========================================
    // LOGIQUE DE RECHERCHE (DEEZER)
    // ==========================================
    const fetchResults = async (searchQuery, pageNumber) => {
        if (!searchQuery) return;
        setIsLoading(true);
        try {
            const index = (pageNumber - 1) * limit;
            const response = await fetch(`/api/deezer/search?q=${encodeURIComponent(searchQuery)}&limit=${limit}&index=${index}`);
            const data = await response.json();
            if (data.data) {
                setResults(data.data);
                setTotalResults(data.total);
            }
        } catch (error) {
            console.error("Erreur de recherche :", error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchResults(query, 1);
    }

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchResults(query, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================================
    // LOGIQUE DES PAROLES ET INITIALISATION DU JEU
    // ==========================================
    const handleSelectSong = async (song) => {
        setSelectedSong(song);
        setIsFetchingLyrics(true);
        setLyricsData(null);
        setFoundWordsCount(0);
        setCurrentInput('');
        setGameStatus('idle'); // On remet le statut à zéro

        try {
            const searchQuery = `${song.artist.name} ${song.title}`;
            const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            const trackWithLyrics = data.find(track => track.plainLyrics && track.plainLyrics.trim() !== '');

            if (!trackWithLyrics) {
                alert("Mince, les paroles de cette musique ne sont pas encore disponibles ! Essaie une autre chanson.");
                setSelectedSong(null);
                return;
            }

            const rawLyrics = trackWithLyrics.plainLyrics;
            const cleanRaw = rawLyrics.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');

            let wordCount = 0;
            const parsedLines = cleanRaw.split('\n').map(line => {
                const spacedLine = line.replace(/(['’])/g, "$1 ");
                const rawWords = spacedLine.split(/\s+/);

                const processedWords = rawWords.map(word => {
                    const normalized = word
                        .toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]/g, "");

                    if (normalized.length > 0) wordCount++;

                    return {
                        original: word,
                        normalized: normalized,
                        isFound: false
                    };
                }).filter(w => w.original.length > 0);

                return processedWords;
            }).filter(line => line.length > 0);

            setLyricsData(parsedLines);
            setTotalWords(wordCount);

            // TOUT EST PRÊT : ON LANCE LE CHRONO !
            setTimeLeft(300);
            setGameStatus('playing');

        } catch (error) {
            console.error("Erreur paroles :", error);
            alert("Erreur de connexion lors de la récupération des paroles.");
            setSelectedSong(null);
        } finally {
            setIsFetchingLyrics(false);
        }
    }

    // ==========================================
    // MOTEUR DE JEU (VALIDATION DES MOTS)
    // ==========================================
    const handleInputChange = (e) => {
        if (gameStatus !== 'playing') return; // Bloque la saisie si le jeu est fini

        const val = e.target.value;
        const normalizedInput = val
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");

        if (!normalizedInput) {
            setCurrentInput(val);
            return;
        }

        let isMatch = false;
        let newWordsFoundCount = 0;

        const newLyricsData = lyricsData.map(line => {
            return line.map(word => {
                if (!word.isFound && word.normalized === normalizedInput) {
                    isMatch = true;
                    newWordsFoundCount++;
                    return { ...word, isFound: true };
                }
                return word;
            });
        });

        if (isMatch) {
            setLyricsData(newLyricsData);
            const updatedFoundCount = foundWordsCount + newWordsFoundCount;
            setFoundWordsCount(updatedFoundCount);
            setCurrentInput('');

            // VÉRIFICATION DE LA VICTOIRE
            if (updatedFoundCount === totalWords) {
                setGameStatus('won');
            }
        } else {
            setCurrentInput(val);
        }
    };

    const scorePercentage = totalWords > 0 ? Math.round((foundWordsCount / totalWords) * 100) : 0;

    // ==========================================
    // RENDUS VISUELS
    // ==========================================

    // --- VUE 2 : L'INTERFACE DE JEU ---
    if (selectedSong) {
        return (
            <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-pink-500 selection:text-white flex flex-col">
                <header className="p-6 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900/95 backdrop-blur z-20">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSelectedSong(null)}
                            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            ← Retour
                        </button>
                        <div className="flex items-center gap-4">
                            <img src={selectedSong.album.cover_small} alt="Pochette" className="w-12 h-12 rounded-lg shadow-md" />
                            <div>
                                <h2 className="font-bold text-xl leading-tight">{selectedSong.title}</h2>
                                <p className="text-pink-400 text-sm">{selectedSong.artist.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bouton Abandonner / Rejouer */}
                    {!isFetchingLyrics && (
                        <button
                            onClick={() => {
                                if (gameStatus === 'playing') setGameStatus('lost');
                                else handleSelectSong(selectedSong); // Relance la même musique
                            }}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                gameStatus === 'playing'
                                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                    : 'bg-pink-600 text-white hover:bg-pink-500 shadow-lg'
                            }`}
                        >
                            {gameStatus === 'playing' ? 'Abandonner' : 'Rejouer'}
                        </button>
                    )}
                </header>

                <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col gap-8">

                    {/* Bandeau de fin de partie */}
                    {gameStatus === 'won' && (
                        <div className="bg-green-600/20 border border-green-500 text-green-400 p-4 rounded-xl text-center font-bold text-lg animate-pulse">
                            🎉 Félicitations ! Tu as trouvé toutes les paroles !
                        </div>
                    )}
                    {gameStatus === 'lost' && (
                        <div className="bg-red-600/20 border border-red-500 text-red-400 p-4 rounded-xl text-center font-bold text-lg">
                            Temps écoulé (ou partie abandonnée). Regarde les mots en rouge !
                        </div>
                    )}

                    {/* Section Saisie & Stats */}
                    <div className={`flex justify-between items-center bg-neutral-800 p-6 rounded-2xl shadow-xl sticky top-[88px] z-10 border transition-colors ${gameStatus === 'won' ? 'border-green-500' : gameStatus === 'lost' ? 'border-red-500' : 'border-neutral-700'}`}>
                        <div className="text-center w-24">
                            <p className="text-neutral-400 text-xs uppercase tracking-wider font-semibold mb-1">Score</p>
                            <p className="text-3xl font-bold text-pink-500">{scorePercentage}%</p>
                            <p className="text-neutral-500 text-sm">{foundWordsCount} / {totalWords}</p>
                        </div>

                        <div className="flex-1 max-w-sm mx-8 flex justify-center">
                            {gameStatus === 'playing' ? (
                                <input
                                    type="text"
                                    placeholder="Tape un mot ici..."
                                    disabled={isFetchingLyrics || gameStatus !== 'playing'}
                                    value={currentInput}
                                    onChange={handleInputChange}
                                    autoFocus
                                    className="w-full bg-neutral-700 text-white px-6 py-4 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all text-2xl text-center placeholder:text-neutral-500 shadow-inner font-semibold"
                                />
                            ) : (
                                <div className="text-2xl font-bold text-neutral-300">
                                    {gameStatus === 'won' ? 'Score Parfait !' : 'Partie terminée'}
                                </div>
                            )}
                        </div>

                        <div className="text-center w-24">
                            <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-red-400 animate-pulse' : 'text-neutral-400'}`}>Temps</p>
                            <p className={`text-3xl font-bold font-mono ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-red-400' : ''}`}>
                                {formatTime(timeLeft)}
                            </p>
                        </div>
                    </div>

                    {/* Grille des paroles */}
                    <div className="bg-neutral-800 p-8 rounded-2xl shadow-lg border border-neutral-700 min-h-[400px]">
                        {isFetchingLyrics ? (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-4 py-20">
                                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                <p>Création du jeu en cours...</p>
                            </div>
                        ) : lyricsData ? (
                            <div className="space-y-6 text-center text-lg leading-relaxed select-none">
                                {lyricsData.map((line, lineIndex) => (
                                    <div key={lineIndex} className="flex flex-wrap justify-center gap-x-2 gap-y-2">
                                        {line.map((word, wordIndex) => {

                                            // Détermination de la couleur du mot selon l'état du jeu
                                            let styleClass = 'bg-neutral-700 text-transparent min-w-[3rem] border-b-2 border-neutral-600'; // Par défaut : caché

                                            if (word.isFound) {
                                                styleClass = 'text-white bg-transparent font-medium'; // Trouvé pendant le jeu
                                            } else if (gameStatus === 'lost' || gameStatus === 'won') {
                                                styleClass = 'text-red-400 bg-transparent font-medium opacity-80'; // Raté (révélé à la fin)
                                            }

                                            return (
                                                <span
                                                    key={wordIndex}
                                                    className={`inline-block px-2 py-1 rounded transition-all duration-300 ${styleClass}`}
                                                >
                          {word.original}
                        </span>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </main>
            </div>
        )
    }

    // --- VUE 1 : LA RECHERCHE (inchangée) ---
    const totalPages = Math.ceil(totalResults / limit);
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        if (endPage - startPage < maxVisiblePages - 1) startPage = Math.max(1, endPage - maxVisiblePages + 1);
        for (let i = startPage; i <= endPage; i++) pages.push(i);
        return pages;
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-pink-500 selection:text-white pb-12">
            <header className="pt-16 pb-8 px-6 flex flex-col items-center border-b border-neutral-800">
                <h1 className="text-4xl font-bold mb-8 tracking-tight">Trouve les paroles.</h1>
                <form onSubmit={handleSearch} className="w-full max-w-xl flex gap-3">
                    <input
                        type="text"
                        placeholder="Rechercher un artiste, un titre..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-neutral-800 text-white px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 transition-all text-lg placeholder:text-neutral-500 shadow-inner"
                    />
                    <button
                        type="submit"
                        className="bg-pink-600 hover:bg-pink-500 px-8 py-4 rounded-2xl font-semibold transition-colors disabled:opacity-50 shadow-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? '...' : 'Chercher'}
                    </button>
                </form>
            </header>

            <main className="p-6 max-w-7xl mx-auto">
                {totalResults > 0 && (
                    <p className="text-neutral-400 mb-6 text-sm">
                        {totalResults} résultats trouvés (Page {currentPage} sur {totalPages})
                    </p>
                )}

                {results.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {results.map((song) => (
                            <div
                                key={song.id}
                                onClick={() => handleSelectSong(song)}
                                className="group cursor-pointer flex flex-col gap-3"
                            >
                                <div className="aspect-square overflow-hidden rounded-xl bg-neutral-800 shadow-lg">
                                    <img src={song.album.cover_xl} alt="Pochette" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg truncate group-hover:text-pink-400 transition-colors">{song.title}</h3>
                                    <p className="text-neutral-400 text-sm truncate">{song.artist.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex flex-col items-center mt-12 gap-4">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 transition-colors font-medium">Précédent</button>
                            <div className="flex gap-1">
                                {getPageNumbers().map(num => (
                                    <button key={num} onClick={() => handlePageChange(num)} disabled={isLoading} className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === num ? 'bg-pink-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}>{num}</button>
                                ))}
                            </div>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 transition-colors font-medium">Suivant</button>
                        </div>
                        <p className="text-neutral-500 text-sm">Page {currentPage} / {totalPages}</p>
                    </div>
                )}
            </main>
        </div>
    )
}

export default App