'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CHARS = '!@#$%^&*():{};|,.<>/?';
const CYCLES_PER_LETTER = 2;
const SHUFFLE_TIME = 50;

type EncryptedTextProps = {
    text: string;
    className?: string;
};

export default function EncryptedText({ text, className }: EncryptedTextProps) {
    const [displayText, setDisplayText] = useState(text);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        let iteration = 0;

        const startScramble = () => {
            interval = setInterval(() => {
                setDisplayText((prev) =>
                    text
                        .split('')
                        .map((letter, index) => {
                            if (index < iteration) {
                                return text[index];
                            }
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        })
                        .join('')
                );

                if (iteration >= text.length) {
                    clearInterval(interval);
                }

                iteration += 1 / CYCLES_PER_LETTER;
            }, SHUFFLE_TIME);
        };

        startScramble();

        return () => clearInterval(interval);
    }, [text]);

    return <span className={className}>{displayText}</span>;
}
