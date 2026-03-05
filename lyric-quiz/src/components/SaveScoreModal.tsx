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

interface SaveScoreModalProps {
    onAccept: () => void;
    onDecline: () => void;
}

export default function SaveScoreModal({ onAccept, onDecline }: SaveScoreModalProps) {
    return (
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onDecline()}>
            <AlertDialogContent className="glass-modal shadow-[0_0_50px_rgba(64,201,255,0.15)]">

                <AlertDialogHeader>
                    <AlertDialogTitle className="font-titre text-2xl text-secondary text-center">
                        Sauvegarder ton score ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground text-lg text-center mt-2">
                        Connecte-toi avec Google en un clic pour enregistrer tes statistiques et figurer dans le classement !
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-6">
                    <AlertDialogAction
                        onClick={onAccept}
                        className="w-full font-texte text-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl"
                    >
                        Se connecter avec Google
                    </AlertDialogAction>
                    <AlertDialogCancel
                        onClick={onDecline}
                        className="w-full font-texte text-lg bg-muted text-foreground hover:bg-muted/80 border-none rounded-xl mt-0"
                    >
                        Continuer en tant qu'invité
                    </AlertDialogCancel>
                </AlertDialogFooter>

            </AlertDialogContent>
        </AlertDialog>
    );
}