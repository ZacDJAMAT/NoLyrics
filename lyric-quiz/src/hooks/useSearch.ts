import { useState, useEffect } from 'react';
import { searchSongs } from '../utils/api';
import { Song } from '../types';

export const useSearch = (limit: number = 12) => {
    // 1. On initialise les états en lisant le sessionStorage (s'il y a déjà des données)
    const [query, setQuery] = useState<string>(() => sessionStorage.getItem('search_query') || '');
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

    // 2. À chaque fois qu'une de ces données change, on met à jour le sessionStorage
    useEffect(() => {
        sessionStorage.setItem('search_query', query);
        sessionStorage.setItem('search_results', JSON.stringify(results));
        sessionStorage.setItem('search_page', currentPage.toString());
        sessionStorage.setItem('search_total', totalResults.toString());
    }, [query, results, currentPage, totalResults]);

    const fetchResults = async (searchQuery: string, pageNumber: number) => {
        if (!searchQuery) return;
        setIsLoading(true);
        try {
            const data = await searchSongs(searchQuery, pageNumber, limit);
            setResults(data.results);
            setTotalResults(data.total);
        } catch (error) {
            console.error(error);
            alert("Une erreur est survenue lors de la recherche.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchResults(query, 1);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        fetchResults(query, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const totalPages = Math.ceil(totalResults / limit);

    return {
        query, setQuery, results, isLoading, currentPage, totalResults, totalPages, handleSearch, handlePageChange
    };
};