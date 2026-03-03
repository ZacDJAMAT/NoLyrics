interface LogoutConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function LogoutConfirmModal({ onConfirm, onCancel }: LogoutConfirmModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-neutral-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-neutral-700 text-center animate-fade-in-up">

                <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold mb-3 text-white">Déconnexion</h2>
                <p className="text-neutral-400 mb-8 leading-relaxed">
                    Es-tu sûr de vouloir te déconnecter de ton compte ?
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className="w-full bg-red-600/10 text-red-500 hover:bg-red-500 hover:text-white px-6 py-4 rounded-xl font-bold transition-all border border-red-600/20 hover:border-red-500 active:scale-95"
                    >
                        Oui, me déconnecter
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-4 rounded-xl font-bold transition-all active:scale-95"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
}