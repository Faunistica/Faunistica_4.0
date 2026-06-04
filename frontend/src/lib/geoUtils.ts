export type CoordinateAxis = 'lat' | 'lon';
export type CoordinateMode = 'dm' | 'dms';

export type CoordinateParts<A extends CoordinateAxis> = {
    degrees: number | '';
    minutes: number | '';
    seconds: number | '';
    direction: A extends 'lat' ? 'N' | 'S' : 'E' | 'W';
};

export function convertToDM(dd: number, axis: 'lat'): CoordinateParts<'lat'>;
export function convertToDM(dd: number, axis: 'lon'): CoordinateParts<'lon'>;
export function convertToDM(dd: number, axis: CoordinateAxis): CoordinateParts<CoordinateAxis>;
export function convertToDM(dd: number, axis: CoordinateAxis): CoordinateParts<CoordinateAxis> {
    const absDd = Math.abs(dd);
    const degrees = Math.floor(absDd);
    const minutes = Number(((absDd - degrees) * 60).toFixed(4));

    if (axis == 'lat') {
        return {
            degrees,
            minutes,
            seconds: '',
            direction: dd >= 0 ? 'N' : 'S',
        };
    }

    return {
        degrees,
        minutes,
        seconds: '',
        direction: dd >= 0 ? 'E' : 'W',
    };
}

export function convertToDMS(dd: number, axis: 'lat'): CoordinateParts<'lat'>;
export function convertToDMS(dd: number, axis: 'lon'): CoordinateParts<'lon'>;
export function convertToDMS(dd: number, axis: CoordinateAxis): CoordinateParts<CoordinateAxis>;
export function convertToDMS(dd: number, axis: CoordinateAxis): CoordinateParts<CoordinateAxis> {
    const absDd = Math.abs(dd);
    const degrees = Math.floor(absDd);
    const totalMinutes = (absDd - degrees) * 60;
    const minutes = Math.floor(totalMinutes);
    const seconds = Number(((totalMinutes - minutes) * 60).toFixed(4));

    if (axis == 'lat') {
        return {
            degrees,
            minutes,
            seconds,
            direction: dd >= 0 ? 'N' : 'S',
        };
    }

    return {
        degrees,
        minutes,
        seconds,
        direction: dd >= 0 ? 'E' : 'W',
    };
}

export function convertToDD<A extends CoordinateAxis>(
    coordinates: CoordinateParts<A>,
    mode: CoordinateMode,
): number {
    let dd =
        Math.abs(coordinates.degrees !== '' ? coordinates.degrees : 0) +
        Math.abs(coordinates.minutes !== '' ? coordinates.minutes : 0) / 60;
    if (mode === 'dms') {
        dd += Math.abs(coordinates.seconds !== '' ? coordinates.seconds : 0) / 3600;
    }
    if (coordinates.direction === 'S' || coordinates.direction === 'W') dd *= -1;
    return Number(dd.toFixed(6));
}

export function formatCoordinatesVerbatim(
    latitude: CoordinateParts<'lat'>,
    longtitude: CoordinateParts<'lon'>,
    mode: CoordinateMode,
): string {
    if (mode === 'dm') {
        return (
            `${latitude.degrees}° ${latitude.minutes}' ${latitude.direction}, ` +
            `${longtitude.degrees}° ${longtitude.minutes}' ${longtitude.direction}`
        );
    }
    return (
        `${latitude.degrees}° ${latitude.minutes}' ${latitude.seconds}'' ${latitude.direction}, ` +
        `${longtitude.degrees}° ${longtitude.minutes}' ${longtitude.seconds}'' ${longtitude.direction}`
    );
}
