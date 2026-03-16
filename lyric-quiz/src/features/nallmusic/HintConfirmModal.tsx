import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../components/ui/alert-dialog.tsx';
import { Lightbulb } from 'lucide-react';

interface HintConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function HintConfirmModal({ onConfirm, onCancel }: HintConfirmModalProps) {
    return (
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <AlertDialogContent className="glass-modal w-[95vw] max-w-md rounded-[2rem] p-6 sm:p-8">
                <AlertDialogHeader>
                    <AlertDialogTitle className="titre-neon-primary flex items-center justify-center gap-3 text-2xl sm:text-3xl">
                        <Lightbulb
                            className="text-primary h-6 w-6 sm:h-8 sm:w-8"
                            strokeWidth={2.5}
                        />
                        <span>Coup de pouce</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground mt-2 text-center text-base sm:text-lg">
                        Veux-tu vraiment révéler la première lettre de 75% des mots restants ? Cette
                        aide ne peut être utilisée qu'une seule fois par partie.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-6 flex flex-col gap-3 sm:mt-8">
                    {/* Confirmation avec le variant par défaut (Primary) */}
                    <AlertDialogAction
                        onClick={onConfirm}
                        variant="default"
                        className="h-12 rounded-xl text-base sm:h-14 sm:text-lg"
                    >
                        Oui, révéler les lettres
                    </AlertDialogAction>

                    {/* Annulation avec le variant Secondary (Verre) */}
                    <AlertDialogCancel
                        onClick={onCancel}
                        variant="secondary"
                        className="mt-0 h-12 rounded-xl text-base sm:h-14 sm:text-lg"
                    >
                        Non, je vais chercher
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
