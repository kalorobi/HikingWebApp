import React from 'react';

const styles = `
    @keyframes colorCycle {
        0%   { fill: #C9A78E; }
        33%  { fill: #D4813A; }
        66%  { fill: #3A8D60; }
        100%  { fill: #5B8FA8; }
    }
    .mc { animation: colorCycle 3s ease-in-out infinite; }
`;

export default function Waiting() {
    return (
        <div style={{
            zIndex: 1000,
        }}>
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="80" height="68">
                <style>{styles}</style>
                <path className="mc" d="M 69 67 L 60 67 L 54 51 L 47 63 L 53 63 L 53 67 L 32 67 L 27 64 L 22 64 L 9 45 L 15 27 L 12 22 L 5 25 L 0 17 L 16 0 L 27 0 L 39 15 L 37 29 L 26 43 L 25 57 L 29 53 L 32 45 L 52 29 L 54 7 L 58 13 L 60 5 L 65 14 L 68 16 L 79 26 L 79 28 L 67 35 L 63 48 L 66 62 L 69 64 Z"/>
                <path d="M 69 67 L 60 67 L 66 62 L 69 64 Z" fill="#6f4e37"/>
                <path d="M 9 45 L 15 27 L 12 22 L 5 25 L 0 17 L 15 12 L 25 22 L 17 45 L 22 64 Z" fill="#6f4e37"/>
                <path d="M 79 26 L 79 28 L 77 29 L 76 26 Z" fill="#6f4e37"/>
                <path d="M 67 35 L 63 48 L 58 45 L 61 37 Z" fill="#6f4e37"/>
                <path d="M 32 45 L 52 29 L 54 31 L 40 45 Z" fill="#6f4e37"/>
                <path d="M 33 62 L 35 52 L 42 45 L 47 46 L 54 51 L 51 53 L 44 51 L 38 56 L 35 62 Z" fill="#6f4e37"/>
                <path d="M 54 16 L 55 11 L 57 16 Z" fill="#6f4e37"/>
                <path d="M 53 67 L 53 63 L 45 63 L 40 67 Z" fill="#6f4e37"/>
                <path d="M 67 20 L 69 20 L 70 23 L 66 23 Z" fill="#6f4e37"/>
            </svg>
        </div>
    );
}