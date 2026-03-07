import { useState, useEffect, useRef } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';

export const useWakeLock = () => {
    const [isAwake, setIsAwake] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    const requestWakeLock = async () => {
        try {
            await KeepAwake.keepAwake();
            setIsAwake(true);

            // Auto-release after 5 minutes (300000ms)
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
            // @ts-ignore
            timeoutRef.current = window.setTimeout(async () => {
                await releaseWakeLock();
            }, 5 * 60 * 1000);

        } catch (err) {
            console.error('Failed to request wake lock:', err);
            // Fallback for non-capacitor environments (like standard browser)
            try {
                if ('wakeLock' in navigator) {
                    // @ts-ignore
                    const wakeLock = await navigator.wakeLock.request('screen');
                    setIsAwake(true);

                    if (timeoutRef.current) {
                        window.clearTimeout(timeoutRef.current);
                    }
                    // @ts-ignore
                    timeoutRef.current = window.setTimeout(async () => {
                        await wakeLock.release();
                        setIsAwake(false);
                    }, 5 * 60 * 1000);
                }
            } catch (e) {
                console.error('Browser wake lock also failed:', e);
            }
        }
    };

    const releaseWakeLock = async () => {
        try {
            await KeepAwake.allowSleep();
            setIsAwake(false);
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        } catch (err) {
            console.error('Failed to release wake lock:', err);
        }
    };

    const toggleWakeLock = async () => {
        if (isAwake) {
            await releaseWakeLock();
        } else {
            await requestWakeLock();
        }
    };

    useEffect(() => {
        return () => {
            if (isAwake) {
                releaseWakeLock();
            }
        };
    }, [isAwake]);

    return { isAwake, toggleWakeLock };
};
