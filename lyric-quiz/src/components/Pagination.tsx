interface PaginationProps {
    currentPage: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (newPage: number) => void;
}

export default function Pagination({ currentPage, totalPages, isLoading, onPageChange }: PaginationProps) {
    // Si on a qu'une seule page ou zéro, on n'affiche pas la pagination
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: number[] = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        for (let i = startPage; i <= endPage; i++) pages.push(i);
        return pages;
    };

    return (
        <div className="flex flex-col items-center mt-12 gap-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 transition-colors font-medium"
                >
                    Précédent
                </button>

                <div className="flex gap-1">
                    {getPageNumbers().map(num => (
                        <button
                            key={num}
                            onClick={() => onPageChange(num)}
                            disabled={isLoading}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === num ? 'bg-pink-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}
                        >
                            {num}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 transition-colors font-medium"
                >
                    Suivant
                </button>
            </div>
            <p className="text-neutral-500 text-sm">Page {currentPage} / {totalPages}</p>
        </div>
    );
}