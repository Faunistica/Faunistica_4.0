import { type FC, useEffect, useState, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

interface TelegramQRCodeProps {
    code?: string;
    botUrl?: string;
}

const TelegramQRCode: FC<TelegramQRCodeProps> = ({ code, botUrl }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [qrCode] = useState<QRCodeStyling>(
        () =>
            new QRCodeStyling({
                width: 180,
                height: 180,
                type: 'svg',
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzIyOUVEOSIgZD0iTTEyIDBDNS4zNzMgMCAwIDUuMzczIDAgMTJzNS4zNzMgMTIgMTIgMTIgMTItNS4zNzMgMTItMTJTMTguNjI3IDAgMTIgMHptNS44OTQgOC4yMjFsLTEuOTcgOS4yOGMtLjE0NS42NTgtLjUzNy44MTgtMS4wODQuNTA4bC0zLTIuMjEtMS40NDYgMS4zOTRjLS4xNC4xOC0uMzU3LjI5NS0uNi4yOTUtLjAwMiAwLS4wMDMgMC0uMDA1IDBsLjIxMy0zLjA1NCA1LjU2LTUuMDIyYy4yNC0uMjEzLS4wNTQtLjM0NC0uMzczLS4xMjFsLTYuODY5IDQuMzI2LTIuOTYtLjkyNGMtLjY0LS4yMDMtLjY1OC0uNjQuMTM1LS45NTRsMTEuNTY2LTQuNDU4Yy41MzgtLjE5NiAxLjAwNi4xMjguODMyLjk0eiIvPjwvc3ZnPg==',
                dotsOptions: {
                    color: '#1e293b',
                    type: 'classy-rounded',
                },
                cornersSquareOptions: {
                    type: 'extra-rounded',
                    color: '#1e293b',
                },
                cornersDotOptions: {
                    type: 'dot',
                    color: '#1e293b',
                },
                backgroundOptions: {
                    color: 'transparent',
                },
                imageOptions: {
                    crossOrigin: 'anonymous',
                    margin: 4,
                    imageSize: 0.35,
                },
            }),
    );

    useEffect(() => {
        if (ref.current && ref.current.childElementCount === 0) {
            qrCode.append(ref.current);
        }
    }, [qrCode]);

    useEffect(() => {
        if (!botUrl) return;
        const fullUrl = code ? `${botUrl}?start=${code}` : botUrl;
        qrCode.update({ data: fullUrl });
    }, [code, qrCode, botUrl]);

    return <div ref={ref} className="flex items-center justify-center" />;
};

export default TelegramQRCode;
