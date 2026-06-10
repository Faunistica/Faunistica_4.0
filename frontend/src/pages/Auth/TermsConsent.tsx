import { Link } from 'react-router';

const TermsConsent = () => (
    <p className="px-4 text-center text-sm/relaxed text-slate-500">
        {'Продолжая, вы соглашаетесь с нашими '}
        <Link
            to="/terms-of-service"
            className="underline underline-offset-4 transition-colors hover:text-slate-900"
        >
            Условиями обслуживания
        </Link>
        {' и '}
        <Link
            to="/privacy-policy"
            className="underline underline-offset-4 transition-colors hover:text-slate-900"
        >
            Политикой конфиденциальности
        </Link>
        {'.'}
    </p>
);

export default TermsConsent;
