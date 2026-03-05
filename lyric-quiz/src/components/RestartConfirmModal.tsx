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

interface RestartConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function RestartConfirmModal({ onConfirm, onCancel }: RestartConfirmModalProps) {
    return (
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <AlertDialogContent className="glass-modal">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-neon-secondary text-3xl text-center">
                        Recommencer ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground text-lg text-center mt-2">
                        Es-tu sûr de vouloir recommencer ? La partie en cours sera comptabilisée comme une défaite.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-6">
                    <AlertDialogAction
                        onClick={onConfirm}
                        variant="destructive"
                    >
                        Oui, recommencer
                    </AlertDialogAction>

                    <AlertDialogCancel
                        onClick={onCancel}
                        variant="secondary"
                    >
                        Non, continuer la partie
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}