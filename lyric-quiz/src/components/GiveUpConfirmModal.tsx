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
            {/* NOUVEAU : w-[95vw] max-w-md et p-6 pour prendre tout l'écran sur mobile mais rester propre sur PC */}
            <AlertDialogContent className="glass-modal w-[95vw] max-w-md p-6 sm:p-8 rounded-[2rem]">

                <AlertDialogHeader>
                    <AlertDialogTitle className="titre-neon-primary text-2xl sm:text-3xl text-center">
                        Abandonner ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground text-base sm:text-lg text-center mt-2">
                        Es-tu sûr de vouloir abandonner cette partie en cours ? Ton score actuel sera enregistré.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex flex-col gap-3 mt-6 sm:mt-8">
                    {/* Boutons plus hauts (h-12 ou h-14) pour être facilement cliquables */}
                    <AlertDialogAction
                        onClick={onConfirm}
                        variant={"destructive"}
                        className="h-12 sm:h-14 text-base sm:text-lg rounded-xl"
                    >
                        Oui, abandonner
                    </AlertDialogAction>

                    <AlertDialogCancel
                        onClick={onCancel}
                        variant={"secondary"}
                        className="h-12 sm:h-14 text-base sm:text-lg rounded-xl mt-0"
                    >
                        Non, continuer à jouer
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}