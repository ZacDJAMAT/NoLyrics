import { SVGProps } from 'react';

interface ContractIconProps extends SVGProps<SVGSVGElement> {
    className?: string;
}

export function ContractIcon({ className, ...props }: ContractIconProps) {
    return (
        <svg
            viewBox="0 0 200 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            {/* 1. Le fond du papier (Jauni/Vintage) avec une légère ombre interne */}
            <rect x="10" y="10" width="180" height="260" rx="8" fill="#F4E4BC" />
            <rect x="10" y="10" width="180" height="260" rx="8" stroke="#D1B88A" strokeWidth="4" />

            {/* 2. Le cadre photo en haut (Polaroid/Dossier) */}
            <rect x="30" y="30" width="140" height="100" fill="#2C2C2C" />

            {/* 3. Le ciel couchant (Dégradé GTA SA : Orange vers Rose) */}
            <defs>
                <linearGradient
                    id="gta-sunset"
                    x1="100"
                    y1="30"
                    x2="100"
                    y2="130"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#FF7B00" />
                    <stop offset="50%" stopColor="#FF3366" />
                    <stop offset="100%" stopColor="#662288" />
                </linearGradient>
            </defs>
            <rect x="34" y="34" width="132" height="92" fill="url(#gta-sunset)" />

            {/* 4. Le Soleil de Los Santos */}
            <circle cx="100" cy="80" r="25" fill="#FFE87C" opacity="0.9" />

            {/* 5. Le Palmier (Silhouette noire) */}
            <path d="M85 126 C90 100, 95 80, 100 65 C105 80, 103 100, 105 126 Z" fill="#1A1A1A" />
            {/* Feuilles du palmier */}
            <path d="M100 65 Q80 70 70 90 Q85 75 100 65 Z" fill="#1A1A1A" />
            <path d="M100 65 Q70 50 60 60 Q80 55 100 65 Z" fill="#1A1A1A" />
            <path d="M100 65 Q90 40 85 30 Q95 45 100 65 Z" fill="#1A1A1A" />
            <path d="M100 65 Q115 40 125 35 Q110 50 100 65 Z" fill="#1A1A1A" />
            <path d="M100 65 Q130 55 140 70 Q120 60 100 65 Z" fill="#1A1A1A" />
            <path d="M100 65 Q115 75 125 95 Q105 75 100 65 Z" fill="#1A1A1A" />

            {/* 6. Les lignes de texte du contrat */}
            <rect x="30" y="150" width="140" height="8" rx="4" fill="#A89470" opacity="0.6" />
            <rect x="30" y="170" width="110" height="8" rx="4" fill="#A89470" opacity="0.6" />
            <rect x="30" y="190" width="130" height="8" rx="4" fill="#A89470" opacity="0.6" />
            <rect x="30" y="210" width="90" height="8" rx="4" fill="#A89470" opacity="0.6" />

            {/* 7. Le tampon rouge "MISSION" */}
            <g transform="translate(130, 230) rotate(-15)">
                <rect
                    x="-35"
                    y="-12"
                    width="70"
                    height="24"
                    rx="4"
                    fill="none"
                    stroke="#D32F2F"
                    strokeWidth="3"
                    opacity="0.8"
                />
                <text
                    x="0"
                    y="4"
                    fontFamily="sans-serif"
                    fontSize="12"
                    fontWeight="900"
                    fill="#D32F2F"
                    textAnchor="middle"
                    opacity="0.8"
                >
                    CONTRACT
                </text>
            </g>
        </svg>
    );
}
