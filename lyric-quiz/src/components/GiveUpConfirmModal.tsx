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

interface GiveUpConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function GiveUpConfirmModal({ onConfirm, onCancel }: GiveUpConfirmModalProps) {
    return (
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <AlertDialogContent className="glass-modal">

                <AlertDialogHeader>
                    <AlertDialogTitle className="text-neon-primary text-3xl text-center">
                        Abandonner ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground text-lg text-center mt-2">
                        Es-tu sûr de vouloir abandonner cette partie en cours ? Ton score actuel sera enregistré.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-6">
                    {/* Le bouton "Oui, abandonner" repasse en Destructive (Rouge Néon) */}
                    <AlertDialogAction
                        onClick={onConfirm}
                        variant={"destructive"}
                    >
                        Oui, abandonner
                    </AlertDialogAction>

                    {/* Bouton d'annulation neutre */}
                    <AlertDialogCancel
                        onClick={onCancel}
                        variant={"secondary"}
                    >
                        Non, continuer à jouer
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}