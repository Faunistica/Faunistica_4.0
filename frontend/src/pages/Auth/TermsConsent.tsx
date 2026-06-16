import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

const TermsConsent = () => {
    const { t } = useTranslation();
    return (
        <p className="px-4 text-center text-sm/relaxed text-slate-500">
            {t('auth.terms.consent') + ' '}
            <Link
                to="/terms-of-service"
                className="underline underline-offset-4 transition-colors hover:text-slate-900"
            >
                {t('auth.terms.termsOfService')}
            </Link>
            {' ' + t('auth.terms.and') + ' '}
            <Link
                to="/privacy-policy"
                className="underline underline-offset-4 transition-colors hover:text-slate-900"
            >
                {t('auth.terms.privacyPolicy')}
            </Link>
            {'.'}
        </p>
    );
};

export default TermsConsent;
