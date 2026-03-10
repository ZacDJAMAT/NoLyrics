import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog";
import { TimerOff } from "lucide-react";

interface DisableTimerModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DisableTimerModal({ onConfirm, onCancel }: DisableTimerModalProps) {
    return (
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <AlertDialogContent className="glass-modal w-[95vw] max-w-md p-6 sm:p-8 rounded-[2rem]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="titre-neon-primary text-2xl sm:text-3xl flex items-center justify-center gap-3">
                        <TimerOff className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" strokeWidth={2.5} />
                        <span>Mode Zen</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground text-base sm:text-lg text-center mt-2">
                        Veux-tu désactiver le chronomètre ? Tu pourras chercher les mots à ton rythme, sans limite de temps.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex flex-col gap-3 mt-6 sm:mt-8">
                    {/* Confirmation avec le variant par défaut (Primary) */}
                    <AlertDialogAction
                        onClick={onConfirm}
                        variant="default"
                        className="h-12 sm:h-14 text-base sm:text-lg rounded-xl"
                    >
                        Oui, désactiver le chrono
                    </AlertDialogAction>

                    {/* Annulation avec le variant Secondary (Verre) */}
                    <AlertDialogCancel
                        onClick={onCancel}
                        variant="secondary"
                        className="h-12 sm:h-14 text-base sm:text-lg rounded-xl mt-0"
                    >
                        Non, je garde le temps
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}