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

interface SaveScoreModalProps {
    onAccept: () => void;
    onDecline: () => void;
}

export default function SaveScoreModal({ onAccept, onDecline }: SaveScoreModalProps) {
    return (
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onDecline()}>
            <AlertDialogContent className="glass-modal shadow-[0_0_50px_rgba(64,201,255,0.15)]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-titre text-secondary text-center text-2xl">
                        Sauvegarder ton score ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground mt-2 text-center text-lg">
                        Connecte-toi avec Google en un clic pour enregistrer tes statistiques et
                        figurer dans le classement !
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-6 flex-col gap-3 sm:flex-col">
                    <AlertDialogAction
                        onClick={onAccept}
                        className="font-texte bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full rounded-xl text-lg"
                    >
                        Se connecter avec Google
                    </AlertDialogAction>
                    <AlertDialogCancel
                        onClick={onDecline}
                        className="font-texte bg-muted text-foreground hover:bg-muted/80 mt-0 w-full rounded-xl border-none text-lg"
                    >
                        Continuer en tant qu'invité
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
