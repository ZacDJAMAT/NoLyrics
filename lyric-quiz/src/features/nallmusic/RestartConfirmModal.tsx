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

interface RestartConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function RestartConfirmModal({ onConfirm, onCancel }: RestartConfirmModalProps) {
    return (
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <AlertDialogContent className="glass-modal w-[95vw] max-w-md rounded-[2rem] p-6 sm:p-8">
                <AlertDialogHeader>
                    <AlertDialogTitle className="titre-neon-secondary text-center text-2xl sm:text-3xl">
                        Recommencer ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground mt-2 text-center text-base sm:text-lg">
                        Es-tu sûr de vouloir recommencer ? La partie en cours sera comptabilisée
                        comme une défaite.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-6 flex flex-col gap-3 sm:mt-8">
                    <AlertDialogAction
                        onClick={onConfirm}
                        variant="destructive"
                        className="h-12 rounded-xl text-base sm:h-14 sm:text-lg"
                    >
                        Oui, recommencer
                    </AlertDialogAction>

                    <AlertDialogCancel
                        onClick={onCancel}
                        variant="secondary"
                        className="mt-0 h-12 rounded-xl text-base sm:h-14 sm:text-lg"
                    >
                        Non, continuer la partie
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
