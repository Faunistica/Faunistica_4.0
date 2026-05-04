export function convertDMToDD(degrees: number, minutes: number, direction: 'N' | 'S' | 'E' | 'W'): number {
    let dd = Math.abs(degrees) + (Math.abs(minutes) / 60);
    if (direction === 'S' || direction === 'W') dd *= -1;
    return Number(dd.toFixed(6));
}

export function convertDMSToDD(degrees: number, minutes: number, seconds: number, direction: 'N' | 'S' | 'E' | 'W'): number {
    let dd = Math.abs(degrees) + (Math.abs(minutes) / 60) + (Math.abs(seconds) / 3600);
    if (direction === 'S' || direction === 'W') dd *= -1;
    return Number(dd.toFixed(6));
}

// Новые утилиты для сборки оригинальной строки
export function formatDMVerbatim(latD: number, latM: number, latDir: string, lonD: number, lonM: number, lonDir: string): string {
    return `${latD}° ${latM}' ${latDir}, ${lonD}° ${lonM}' ${lonDir}`;
}

export function formatDMSVerbatim(latD: number, latM: number, latS: number, latDir: string, lonD: number, lonM: number, lonS: number, lonDir: string): string {
    return `${latD}° ${latM}' ${latS}'' ${latDir}, ${lonD}° ${lonM}' ${lonS}'' ${lonDir}`;
}