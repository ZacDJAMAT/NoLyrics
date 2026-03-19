import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog.tsx'; // ou "@/components/ui/alert-dialog" si l'alias fonctionne bien

interface LogoutConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function LogoutConfirmModal({ onConfirm, onCancel }: LogoutConfirmModalProps) {
    return (
        // On force open={true} car c'est ton composant parent (ProfileScreen) qui décide quand l'afficher
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <AlertDialogContent className="glass-modal">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-titre text-primary text-center text-2xl">
                        Déconnexion
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground mt-2 text-center text-lg">
                        Es-tu sûr de vouloir te déconnecter de ton compte ?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-6 flex-col gap-3 sm:flex-col">
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="font-texte bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full rounded-xl text-lg"
                    >
                        Oui, me déconnecter
                    </AlertDialogAction>
                    <AlertDialogCancel
                        onClick={onCancel}
                        className="font-texte bg-muted text-foreground hover:bg-muted/80 mt-0 w-full rounded-xl border-none text-lg"
                    >
                        Annuler
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
