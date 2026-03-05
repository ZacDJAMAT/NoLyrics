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
            <AlertDialogContent className="bg-popover/95 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(232,28,255,0.15)] rounded-3xl">

                <AlertDialogHeader>
                    {/* Le Titre reste en Rose (Primary) */}
                    <AlertDialogTitle className="font-titre text-3xl text-primary text-center drop-shadow-[0_0_8px_rgba(232,28,255,0.4)]">
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