import { Database } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
            <div className="w-full max-w-7xl px-4 md:px-6 mx-auto grid md:grid-cols-4 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                        <Database className="h-6 w-6 text-white" />
                        <span className="font-bold text-white text-lg tracking-tight">Faunistica</span>
                    </div>
                    <p className="text-sm max-w-sm">
                        Платформа для оцифровки литературных данных по биоразнообразию. Сохраняем научное наследие вместе.
                    </p>
                </div>
                <div className="space-y-4">
                    <h4 className="text-white font-semibold">Навигация</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#about" className="hover:text-white transition-colors">О проекте</a></li>
                        <li><a href="#volunteers" className="hover:text-white transition-colors">Для волонтеров</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Команда</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Контакты</a></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-white font-semibold">Связь</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-[#229ED9] transition-colors flex items-center gap-2">ВКонтакте</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Arachnolibrary</a></li>
                    </ul>
                </div>
            </div>
            <div className="w-full max-w-7xl px-4 md:px-6 mx-auto mt-10 pt-6 border-t border-slate-800 text-sm text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                <p>© 2026 Проект «Паутина данных». Все права защищены.</p>
                <div className="flex gap-4">
                    <a href="#" className="hover:text-white">Политика конфиденциальности</a>
                    <a href="#" className="hover:text-white">Пользовательское соглашение</a>
                </div>
            </div>
        </footer>
    );
}
