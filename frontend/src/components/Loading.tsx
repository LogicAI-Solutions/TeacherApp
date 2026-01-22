import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
    variant?: 'fullscreen' | 'section' | 'inline';
    text?: string;
    className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
    variant = 'section',
    text,
    className = ''
}) => {
    // Base spinner classes
    const spinnerClasses = "text-primary animate-spin";

    // Container classes based on variant
    const containerClasses = {
        fullscreen: "fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-dark/70 backdrop-blur-xl animate-fade-in",
        section: "w-full py-12 flex flex-col items-center justify-center animate-fade-in",
        inline: "inline-flex items-center gap-2"
    };

    // Spinner size based on variant
    const size = variant === 'inline' ? 18 : 48;

    if (variant === 'inline') {
        return (
            <div className={`${containerClasses.inline} ${className}`}>
                <Loader2 size={size} className={spinnerClasses} />
                {text && <span className="text-sm text-text-muted">{text}</span>}
            </div>
        );
    }

    return (
        <div className={`${containerClasses[variant]} ${className}`}>
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-150" />

                {/* Custom Gradient Spinner */}
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary-light animate-spin shadow-lg shadow-primary/30"></div>
                    {/* Inner glow */}
                    <div className="absolute inset-2 rounded-full bg-primary/10 blur-sm"></div>
                </div>
            </div>

            {text && (
                <p className="mt-4 text-text-muted font-medium animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
};
