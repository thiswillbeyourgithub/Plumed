import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { formatElapsed } from './rec-area.helpers';

interface RecAreaProps {
    isRecording: boolean;
    micLevel: number;
    onToggleRec: () => void;
    onCancelRec: () => void;
}

export const RecArea = ({ isRecording, micLevel, onToggleRec, onCancelRec }: RecAreaProps) => {
    const recBtnRef = useRef<HTMLDivElement>(null);
    const cancelBtnRef = useRef<HTMLDivElement>(null);
    const [elapsedSec, setElapsedSec] = useState(0);
    const startedAtRef = useRef<number>(0);

    // Stop/Send touch handler (active when recording OR idle).
    useEffect(() => {
        const el = recBtnRef.current;
        if (el === null) return;

        const handleTouch = (e: TouchEvent) => {
            e.preventDefault();
            onToggleRec();
        };

        el.addEventListener('touchstart', handleTouch, { passive: false });
        return () => {
            el.removeEventListener('touchstart', handleTouch);
        };
    }, [onToggleRec, isRecording]);

    // Cancel touch handler (active only when recording).
    useEffect(() => {
        const el = cancelBtnRef.current;
        if (el === null || !isRecording) return;

        const handleTouch = (e: TouchEvent) => {
            e.preventDefault();
            onCancelRec();
        };

        el.addEventListener('touchstart', handleTouch, { passive: false });
        return () => {
            el.removeEventListener('touchstart', handleTouch);
        };
    }, [isRecording, onCancelRec]);

    // Chrono: increments every second while recording.
    useEffect(() => {
        if (!isRecording) {
            setElapsedSec(0);
            return;
        }
        startedAtRef.current = Date.now();
        setElapsedSec(0);
        const interval = setInterval(() => {
            setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [isRecording]);

    if (isRecording) {
        return (
            <div className="flex items-center p-2 h-[72px] shrink-0 gap-1.5">
                <div
                    ref={cancelBtnRef}
                    className="flex-[3] h-14 rounded-xl bg-[#4a1a1a] border-2 border-[#666] text-[#fca5a5] text-sm font-semibold flex items-center justify-center cursor-pointer select-none"
                    style={{ touchAction: 'none' }}
                >
                    &#10005; {t('remote.rec.cancel')}
                </div>
                <div
                    ref={recBtnRef}
                    className="flex-[6] h-14 rounded-xl bg-[#7f1d1d] border-2 border-[#dc2626] text-[#fca5a5] text-base font-semibold flex items-center justify-center gap-2 relative cursor-pointer select-none"
                    style={{ touchAction: 'none' }}
                >
                    <span className="w-3 h-3 bg-[#fca5a5] rounded-sm" aria-hidden="true" />
                    <span>{t('remote.rec.stop')}</span>
                    <span className="text-sm font-normal tabular-nums">{formatElapsed(elapsedSec)}</span>
                    <div
                        className="absolute bottom-0 left-0 h-[3px] bg-[#dc2626] rounded-b-[10px] transition-[width] duration-100"
                        style={{ width: `${Math.round(micLevel * 100)}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center p-2 h-[72px] shrink-0">
            <div
                ref={recBtnRef}
                className="flex-1 h-14 rounded-xl text-base font-semibold flex items-center justify-center gap-2 cursor-pointer relative transition-all duration-150 bg-[#1a1a2e] border-2 border-[#444] text-[#e5e5e5]"
                style={{ touchAction: 'none' }}
            >
                &#9679; REC
                <div
                    className="absolute bottom-0 left-0 h-[3px] bg-[#dc2626] rounded-b-[10px] transition-[width] duration-100"
                    style={{ width: `${Math.round(micLevel * 100)}%` }}
                />
            </div>
        </div>
    );
};
