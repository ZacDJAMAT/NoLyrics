import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../../components/ui/alert-dialog.tsx';
import { TimerOff } from 'lucide-react';

interface DisableTimerModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DisableTimerModal({ onConfirm, onCancel }: DisableTimerModalProps) {
    return (
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <AlertDialogContent className="glass-modal w-[95vw] max-w-md rounded-[2rem] p-6 sm:p-8">
                <AlertDialogHeader>
                    <AlertDialogTitle className="titre-neon-primary flex items-center justify-center gap-3 text-2xl sm:text-3xl">
                        <TimerOff
                            className="text-foreground h-6 w-6 sm:h-8 sm:w-8"
                            strokeWidth={2.5}
                        />
                        <span>Mode Zen</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground mt-2 text-center text-base sm:text-lg">
                        Veux-tu désactiver le chronomètre ? Tu pourras chercher les mots à ton
                        rythme, sans limite de temps.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-6 flex flex-col gap-3 sm:mt-8">
                    {/* Confirmation avec le variant par défaut (Primary) */}
                    <AlertDialogAction
                        onClick={onConfirm}
                        variant="default"
                        className="h-12 rounded-xl text-base sm:h-14 sm:text-lg"
                    >
                        Oui, désactiver le chrono
                    </AlertDialogAction>

                    {/* Annulation avec le variant Secondary (Verre) */}
                    <AlertDialogCancel
                        onClick={onCancel}
                        variant="secondary"
                        className="mt-0 h-12 rounded-xl text-base sm:h-14 sm:text-lg"
                    >
                        Non, je garde le temps
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
