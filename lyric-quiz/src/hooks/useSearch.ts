// src/hooks/useSearch.ts
import { useState } from 'react';
import { searchSongs } from '../utils/api';
import { Song } from '../types';

export const useSearch = (limit: number = 12) => {
    const [query, setQuery] = useState<string>('');
    const [results, setResults] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalResults, setTotalResults] = useState<number>(0);

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

    // Le hook renvoie uniquement les données et fonctions dont l'interface aura besoin
    return {
        query,
        setQuery,
        results,
        isLoading,
        currentPage,
        totalResults,
        totalPages,
        handleSearch,
        handlePageChange
    };
};