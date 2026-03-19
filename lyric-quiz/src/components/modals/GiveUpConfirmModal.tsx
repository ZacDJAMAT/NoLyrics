import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog.tsx';

interface GiveUpConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function GiveUpConfirmModal({ onConfirm, onCancel }: GiveUpConfirmModalProps) {
    return (
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            {/* NOUVEAU : w-[95vw] max-w-md et p-6 pour prendre tout l'écran sur mobile mais rester propre sur PC */}
            <AlertDialogContent className="glass-modal w-[95vw] max-w-md rounded-[2rem] p-6 sm:p-8">
                <AlertDialogHeader>
                    <AlertDialogTitle className="titre-neon-primary text-center text-2xl sm:text-3xl">
                        Abandonner ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground mt-2 text-center text-base sm:text-lg">
                        Es-tu sûr de vouloir abandonner cette partie en cours ? Ton score actuel
                        sera enregistré.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-6 flex flex-col gap-3 sm:mt-8">
                    {/* Boutons plus hauts (h-12 ou h-14) pour être facilement cliquables */}
                    <AlertDialogAction
                        onClick={onConfirm}
                        variant={'destructive'}
                        className="h-12 rounded-xl text-base sm:h-14 sm:text-lg"
                    >
                        Oui, abandonner
                    </AlertDialogAction>

                    <AlertDialogCancel
                        onClick={onCancel}
                        variant={'secondary'}
                        className="mt-0 h-12 rounded-xl text-base sm:h-14 sm:text-lg"
                    >
                        Non, continuer à jouer
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
