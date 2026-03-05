import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog"; // ou "@/components/ui/alert-dialog" si l'alias fonctionne bien

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
                <AlertDialogTitle className="font-titre text-2xl text-primary text-center">
                    Déconnexion
                </AlertDialogTitle>
                <AlertDialogDescription className="font-texte text-muted-foreground text-lg text-center mt-2">
                    Es-tu sûr de vouloir te déconnecter de ton compte ?
                </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-6">
                <AlertDialogAction
                    onClick={onConfirm}
                    className="w-full font-texte text-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                >
                    Oui, me déconnecter
                </AlertDialogAction>
                <AlertDialogCancel
                    onClick={onCancel}
                    className="w-full font-texte text-lg bg-muted text-foreground hover:bg-muted/80 border-none rounded-xl mt-0"
                >
                    Annuler
                </AlertDialogCancel>
            </AlertDialogFooter>

        </AlertDialogContent>
    </AlertDialog>
);
}