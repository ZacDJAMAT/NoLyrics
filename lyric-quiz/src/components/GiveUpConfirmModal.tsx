interface GiveUpConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function GiveUpConfirmModal({ onConfirm, onCancel }: GiveUpConfirmModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-neutral-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-neutral-700 text-center animate-fade-in-up">

                <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold mb-3 text-white">Abandonner ?</h2>
                <p className="text-neutral-400 mb-8 leading-relaxed">
                    Es-tu sûr de vouloir abandonner cette partie en cours ? Ton score actuel sera enregistré.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className="w-full bg-red-600/10 text-red-500 hover:bg-red-500 hover:text-white px-6 py-4 rounded-xl font-bold transition-all border border-red-600/20 hover:border-red-500 active:scale-95"
                    >
                        Oui, abandonner
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-4 rounded-xl font-bold transition-all active:scale-95"
                    >
                        Non, continuer à jouer
                    </button>
                </div>
            </div>
        </div>
    );
}