export function convertDDToDM(
    dd: number,
    isLat: true,
): { degrees: number; minutes: number; direction: 'N' | 'S' };
export function convertDDToDM(
    dd: number,
    isLat: false,
): { degrees: number; minutes: number; direction: 'E' | 'W' };
export function convertDDToDM(
    dd: number,
    isLat: boolean,
): { degrees: number; minutes: number; direction: 'N' | 'S' | 'E' | 'W' } {
    const absDd = Math.abs(dd);
    const degrees = Math.floor(absDd);
    const minutes = Number(((absDd - degrees) * 60).toFixed(4));
    const direction = dd >= 0 ? (isLat ? 'N' : 'E') : isLat ? 'S' : 'W';
    return { degrees, minutes, direction };
}

export function convertDDToDMS(
    dd: number,
    isLat: true,
): { degrees: number; minutes: number; seconds: number; direction: 'N' | 'S' };
export function convertDDToDMS(
    dd: number,
    isLat: false,
): { degrees: number; minutes: number; seconds: number; direction: 'E' | 'W' };
export function convertDDToDMS(
    dd: number,
    isLat: boolean,
): { degrees: number; minutes: number; seconds: number; direction: 'N' | 'S' | 'E' | 'W' } {
    const absDd = Math.abs(dd);
    const degrees = Math.floor(absDd);
    const totalMinutes = (absDd - degrees) * 60;
    const minutes = Math.floor(totalMinutes);
    const seconds = Number(((totalMinutes - minutes) * 60).toFixed(4));
    const direction = dd >= 0 ? (isLat ? 'N' : 'E') : isLat ? 'S' : 'W';
    return { degrees, minutes, seconds, direction };
}

export function convertDMToDD(
    degrees: number,
    minutes: number,
    direction: 'N' | 'S' | 'E' | 'W',
): number {
    let dd = Math.abs(degrees) + Math.abs(minutes) / 60;
    if (direction === 'S' || direction === 'W') dd *= -1;
    return Number(dd.toFixed(6));
}

export function convertDMSToDD(
    degrees: number,
    minutes: number,
    seconds: number,
    direction: 'N' | 'S' | 'E' | 'W',
): number {
    let dd = Math.abs(degrees) + Math.abs(minutes) / 60 + Math.abs(seconds) / 3600;
    if (direction === 'S' || direction === 'W') dd *= -1;
    return Number(dd.toFixed(6));
}

export function formatDMVerbatim(
    latD: number,
    latM: number,
    latDir: string,
    lonD: number,
    lonM: number,
    lonDir: string,
): string {
    return `${latD}° ${latM}' ${latDir}, ${lonD}° ${lonM}' ${lonDir}`;
}

export function formatDMSVerbatim(
    latD: number,
    latM: number,
    latS: number,
    latDir: string,
    lonD: number,
    lonM: number,
    lonS: number,
    lonDir: string,
): string {
    return `${latD}° ${latM}' ${latS}'' ${latDir}, ${lonD}° ${lonM}' ${lonS}'' ${lonDir}`;
}
