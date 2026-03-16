import { useState, useEffect } from 'react';
import { searchSongs } from '../utils/api';
import { Song } from '../types';

export const useSearch = (limit: number = 12) => {
    const [query, setQuery] = useState<string>(
        () => sessionStorage.getItem('search_query_input') || ''
    );

    const [activeQuery, setActiveQuery] = useState<string>(
        () => sessionStorage.getItem('search_query_active') || ''
    );

    const [results, setResults] = useState<Song[]>(() => {
        const saved = sessionStorage.getItem('search_results');
        return saved ? JSON.parse(saved) : [];
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(() => {
        const saved = sessionStorage.getItem('search_page');
        return saved ? Number(saved) : 1;
    });
    const [totalResults, setTotalResults] = useState<number>(() => {
        const saved = sessionStorage.getItem('search_total');
        return saved ? Number(saved) : 0;
    });

    useEffect(() => {
        sessionStorage.setItem('search_query_input', query);
        sessionStorage.setItem('search_query_active', activeQuery);
        sessionStorage.setItem('search_results', JSON.stringify(results));
        sessionStorage.setItem('search_page', currentPage.toString());
        sessionStorage.setItem('search_total', totalResults.toString());
    }, [query, activeQuery, results, currentPage, totalResults]);

    const fetchResults = async (searchQuery: string, pageNumber: number) => {
        if (!searchQuery) return;
        setIsLoading(true);
        try {
            const data = await searchSongs(searchQuery, pageNumber, limit);
            setResults(data.results);
            setTotalResults(data.total);
        } catch (error) {
            console.error(error);
            alert('Une erreur est survenue lors de la recherche.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setActiveQuery(query);
        setCurrentPage(1);

        // NOUVEAU : Si la recherche est vide, on vide les résultats pour revenir à l'accueil
        if (!query.trim()) {
            setResults([]);
            setTotalResults(0);
            return;
        }

        fetchResults(query, 1);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        fetchResults(activeQuery, newPage);

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
        activeQuery, // NOUVEAU : On l'exporte !
        results,
        isLoading,
        currentPage,
        totalResults,
        totalPages,
        handleSearch,
        handlePageChange,
    };
};
