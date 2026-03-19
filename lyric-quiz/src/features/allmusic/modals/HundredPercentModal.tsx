import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../../components/ui/alert-dialog.tsx';

import { Target, Trophy, Search } from 'lucide-react';

interface HundredPercentModalProps {
    onFinish: () => void;
    onContinue: () => void;
}

export default function HundredPercentModal({ onFinish, onContinue }: HundredPercentModalProps) {
    return (
        <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onContinue()}>
            <AlertDialogContent className="glass-modal w-[95vw] max-w-md rounded-[2rem] p-6 sm:p-8">
                <AlertDialogHeader>
                    {/* Utilisation de Flexbox pour aligner l'icône et le texte proprement */}
                    <AlertDialogTitle className="titre-neon-primary flex items-center justify-center gap-3 text-2xl sm:text-3xl">
                        <Target className="text-primary h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.5} />
                        <span>Objectif Atteint !</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-texte text-muted-foreground mt-2 text-center text-base sm:text-lg">
                        Bravo ! Tu as atteint 100% de score. Tu peux valider ta victoire maintenant,
                        ou continuer à jouer pour tenter de trouver absolument tous les mots !
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-6 flex flex-col gap-3 sm:mt-8">
                    <AlertDialogAction
                        onClick={onFinish}
                        className="bg-primary hover:bg-primary/80 flex h-12 items-center gap-2 rounded-xl text-base sm:h-14 sm:text-lg"
                    >
                        <Trophy className="h-5 w-5" strokeWidth={2.5} />
                        <span>Terminer et Gagner</span>
                    </AlertDialogAction>

                    <AlertDialogCancel
                        onClick={onContinue}
                        variant="secondary"
                        className="mt-0 flex h-12 items-center gap-2 rounded-xl text-base sm:h-14 sm:text-lg"
                    >
                        <Search className="h-5 w-5" strokeWidth={2.5} />
                        <span>Continuer la partie</span>
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
