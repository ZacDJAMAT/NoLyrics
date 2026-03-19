import { Button } from '../ui/button.tsx';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (newPage: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    isLoading,
    onPageChange,
}: PaginationProps) {
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
        <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="font-texte border-border hover:bg-muted text-base"
                >
                    Précédent
                </Button>

                <div className="mx-2 flex gap-2">
                    {getPageNumbers().map((num) => (
                        <Button
                            key={num}
                            variant={currentPage === num ? 'default' : 'outline'}
                            onClick={() => onPageChange(num)}
                            disabled={isLoading}
                            className={`font-texte h-10 w-10 p-0 text-lg ${
                                currentPage === num
                                    ? 'bg-secondary text-secondary-foreground shadow-[0_0_10px_rgba(64,201,255,0.4)]'
                                    : 'border-border text-foreground hover:bg-muted'
                            }`}
                        >
                            {num}
                        </Button>
                    ))}
                </div>

                <Button
                    variant="outline"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="font-texte border-border hover:bg-muted text-base"
                >
                    Suivant
                </Button>
            </div>
            <p className="text-muted-foreground font-texte mt-2 text-base">
                Page {currentPage} / {totalPages}
            </p>
        </div>
    );
}
