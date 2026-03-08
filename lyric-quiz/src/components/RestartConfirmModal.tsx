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
            <AlertDialogContent className="glass-modal w-[95vw] max-w-md p-6 sm:p-8 rounded-[2rem]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="titre-neon-secondary text-2xl sm:text-3xl text-center">
                        Recommencer ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground text-base sm:text-lg text-center mt-2">
                        Es-tu sûr de vouloir recommencer ? La partie en cours sera comptabilisée comme une défaite.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex flex-col gap-3 mt-6 sm:mt-8">
                    <AlertDialogAction
                        onClick={onConfirm}
                        variant="destructive"
                        className="h-12 sm:h-14 text-base sm:text-lg rounded-xl"
                    >
                        Oui, recommencer
                    </AlertDialogAction>

                    <AlertDialogCancel
                        onClick={onCancel}
                        variant="secondary"
                        className="h-12 sm:h-14 text-base sm:text-lg rounded-xl mt-0"
                    >
                        Non, continuer la partie
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}