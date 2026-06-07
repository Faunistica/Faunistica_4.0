import { Database } from 'lucide-react';
import { Link } from 'react-router';

export default function Footer() {
    return (
        <footer className="w-full border-t border-slate-800 bg-slate-900 py-10 text-slate-400">
            <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 md:grid-cols-4 md:px-6">
                <div className="space-y-4 md:col-span-2">
                    <div className="flex items-center gap-2">
                        <Database className="size-6 text-white" />
                        <span className="text-lg font-bold tracking-tight text-white">
                            Faunistics
                        </span>
                    </div>
                    <p className="max-w-sm text-sm">
                        Платформа для оцифровки литературных данных по биоразнообразию. Сохраняем
                        научное наследие вместе.
                    </p>
                </div>
                <div className="space-y-4">
                    <h4 className="font-semibold text-white">Навигация</h4>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <a href="#about" className="transition-colors hover:text-white">
                                О проекте
                            </a>
                        </li>
                        <li>
                            <a href="#volunteers" className="transition-colors hover:text-white">
                                Для волонтеров
                            </a>
                        </li>
                        <li>
                            <a href="#science" className="transition-colors hover:text-white">
                                Научная база
                            </a>
                        </li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="font-semibold text-white">Связь</h4>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <a
                                href="https://vk.ru/data_web"
                                className="flex items-center gap-2 transition-colors hover:text-[#229ED9]"
                            >
                                ВКонтакте
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://faunistics.international/arachnolibrary/"
                                className="transition-colors hover:text-white"
                            >
                                Arachnolibrary
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="mx-auto mt-10 flex w-full max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-800 px-4 pt-6 text-center text-sm md:flex-row md:px-6 md:text-left">
                <p>© {new Date().getFullYear()} Проект «Паутина данных». Все права защищены.</p>
                <div className="flex gap-4">
                    <Link to="/privacy-policy" className="hover:text-white">
                        Политика конфиденциальности
                    </Link>
                    <Link to="/terms-of-service" className="hover:text-white">
                        Пользовательское соглашение
                    </Link>
                </div>
            </div>
        </footer>
    );
}
