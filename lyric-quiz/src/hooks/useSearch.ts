import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom'; // NOUVEAU : Pour lire/écrire dans l'URL
import { searchSongs } from '../utils/api';
import { Song } from '../types';

export const useSearch = (limit: number = 12) => {
    // 1. La source de vérité devient l'URL
    const [searchParams, setSearchParams] = useSearchParams();
    const urlQuery = searchParams.get('q') || '';
    const urlPage = parseInt(searchParams.get('page') || '1', 10);

    // 2. L'état local pour la barre de recherche (en direct)
    const [query, setQuery] = useState<string>(urlQuery);

    const [results, setResults] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [totalResults, setTotalResults] = useState<number>(0);

    // Pour éviter de faire la requête 2 fois si l'URL ne change pas vraiment
    const lastFetched = useRef({ query: '', page: 1 });

    const fetchResults = async (searchQuery: string, pageNumber: number) => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        try {
            const data = await searchSongs(searchQuery, pageNumber, limit);
            setResults(data.results);
            setTotalResults(data.total);
            lastFetched.current = { query: searchQuery, page: pageNumber };
        } catch (error) {
            console.error(error);
            alert('Une erreur est survenue lors de la recherche.');
        } finally {
            setIsLoading(false);
        }
    };

    // 3. On écoute l'URL. Si elle change (bouton précédent, ou nouvelle recherche), on met à jour.
    useEffect(() => {
        if (!urlQuery) {
            // Retour à l'accueil (plus de paramètre ?q=)
            setResults([]);
            setTotalResults(0);
            setQuery(''); // On vide la barre de recherche
            lastFetched.current = { query: '', page: 1 };
            return;
        }

        // Synchronise l'input avec l'URL (très utile si on fait "Précédent" dans le navigateur)
        setQuery(urlQuery);

        // Fetch uniquement si c'est une nouvelle recherche ou nouvelle page
        if (lastFetched.current.query !== urlQuery || lastFetched.current.page !== urlPage) {
            fetchResults(urlQuery, urlPage);
        }
    }, [urlQuery, urlPage]);

    // 4. Validation du formulaire
    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setSearchParams({}); // Nettoie l'URL totalement (enlève le ?q=)
        } else {
            // Modifie l'URL, ce qui va déclencher le useEffect !
            setSearchParams({ q: trimmedQuery, page: '1' });
        }
    };

    // 5. Changement de page
    const handlePageChange = (newPage: number) => {
        // Met à jour la page dans l'URL
        setSearchParams({ q: urlQuery, page: newPage.toString() });

        setTimeout(() => {
            const resultsContainer = document.getElementById('results-top');
            if (resultsContainer) {
                resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 50);
    };

    const totalPages = Math.ceil(totalResults / limit);

    return {
        query,
        setQuery,
        activeQuery: urlQuery, // L'activeQuery est maintenant directement lue depuis l'URL !
        results,
        isLoading,
        currentPage: urlPage,
        totalResults,
        totalPages,
        handleSearch,
        handlePageChange,
    };
};
