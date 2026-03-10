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

import { Target, Trophy, Search } from "lucide-react";

interface HundredPercentModalProps {
    onFinish: () => void;
    onContinue: () => void;
}

export default function HundredPercentModal({ onFinish, onContinue }: HundredPercentModalProps) {
    return (
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onContinue()}>
            <AlertDialogContent className="glass-modal w-[95vw] max-w-md p-6 sm:p-8 rounded-[2rem]">
                <AlertDialogHeader>
                    {/* Utilisation de Flexbox pour aligner l'icône et le texte proprement */}
                    <AlertDialogTitle className="titre-neon-primary text-2xl sm:text-3xl flex items-center justify-center gap-3">
                        <Target className="w-7 h-7 sm:w-8 sm:h-8 text-primary" strokeWidth={2.5} />
                        <span>Objectif Atteint !</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground text-base sm:text-lg text-center mt-2">
                        Bravo ! Tu as atteint 100% de score. Tu peux valider ta victoire maintenant, ou continuer à jouer pour tenter de trouver absolument tous les mots !
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex flex-col gap-3 mt-6 sm:mt-8">
                    <AlertDialogAction
                        onClick={onFinish}
                        className="h-12 sm:h-14 text-base sm:text-lg rounded-xl bg-primary hover:bg-primary/80 flex items-center gap-2"
                    >
                        <Trophy className="w-5 h-5" strokeWidth={2.5} />
                        <span>Terminer et Gagner</span>
                    </AlertDialogAction>

                    <AlertDialogCancel
                        onClick={onContinue}
                        variant="secondary"
                        className="h-12 sm:h-14 text-base sm:text-lg rounded-xl mt-0 flex items-center gap-2"
                    >
                        <Search className="w-5 h-5" strokeWidth={2.5} />
                        <span>Continuer la partie</span>
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}