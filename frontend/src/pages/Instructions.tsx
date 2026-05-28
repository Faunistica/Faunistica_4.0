import { type FC, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const InstructionImage = ({
    src,
    alt,
    className,
}: {
    src: string;
    alt: string;
    className?: string;
}) => {
    return (
        <div
            className={`my-4 overflow-hidden rounded-md border border-border bg-muted/30 ${className}`}
        >
            <img
                src={`/assets/instruction/${src}`}
                alt={alt}
                className="w-full h-auto object-contain"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                        target.parentElement.innerHTML = `
                            <div class="p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                    <circle cx="9" cy="9" r="2"/>
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                </svg>
                                <span>Изображение загружается: ${src}</span>
                            </div>
                        `;
                    }
                }}
            />
        </div>
    );
};

const SECTIONS = [
    { id: 'about', title: 'Подробнее о проекте' },
    { id: 'start', title: 'Начало работы' },
    { id: 'admin', title: 'Административное расположение' },
    { id: 'geo', title: 'Географическое расположение' },
    { id: 'collection', title: 'Сбор материала' },
    { id: 'taxonomy', title: 'Таксономия' },
    { id: 'quantity', title: 'Количество' },
    { id: 'check', title: 'Проверка и запись данных' },
    { id: 'extra', title: 'Дополнительные возможности' },
    { id: 'finish', title: 'Завершение работы' },
];

const Instructions: FC = () => {
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const isClickScrolling = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            if (isClickScrolling.current) return;

            const focusY = window.innerHeight * 0.3;
            let currentId = SECTIONS[0].id;

            for (const section of SECTIONS) {
                const el = document.getElementById(section.id);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    // if top of section is above the focus line
                    if (rect.top <= focusY + 50) {
                        currentId = section.id;
                    }
                }
            }

            // Only override with the last section if we are at the absolute bottom
            // AND the last section is actually visible enough on screen.
            const isBottom =
                Math.ceil(window.innerHeight + window.scrollY) >=
                document.documentElement.scrollHeight - 10;
            if (isBottom) {
                currentId = SECTIONS[SECTIONS.length - 1].id;
            }

            setActiveSection((prev) => (prev !== currentId ? currentId : prev));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        isClickScrolling.current = true;
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Unlock scroll spy after smooth scroll finishes
            setTimeout(() => {
                isClickScrolling.current = false;
            }, 1400);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 max-w-screen-2xl mx-auto p-4 md:p-8">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0">
                <div className="sticky top-24 space-y-1">
                    <h2 className="text-lg font-semibold mb-4 px-3">Инструкция</h2>
                    <nav className="flex flex-col gap-1">
                        {SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                    activeSection === section.id
                                        ? 'bg-primary text-primary-foreground font-medium'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                {section.title}
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 space-y-12 pb-24 min-w-0">
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Инструкция для волонтеров
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Руководство по оцифровке данных о биоразнообразии пауков Урала.
                    </p>
                </div>
                <Separator />

                {/* 1. Подробнее о проекте */}
                <section id="about" className="scroll-mt-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Подробнее о проекте</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                            <p>
                                <strong>
                                    Наш проект направлен на оцифровку данных о биоразнообразии
                                    пауков Урала.
                                </strong>
                            </p>
                            <p>
                                Приветствуем вас на проекте &quot;Паутина данных&quot;, друзья! Вам
                                предстоит перенести данные из разнообразных арахнологических
                                публикаций в цифровой формат: открыть файл с публикацией, найти там
                                информацию и занести ее в форму на сайте. Распознать и
                                структурировать сведения о находках пауков из предложенных научных
                                статей: кого, где, когда и кто нашел?
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* 2. Начало работы */}
                <section id="start" className="scroll-mt-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Начало работы</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
                            <p>
                                Ваша текущая публикация - научная работа, из которой мы будем
                                извлекать данные. По клику на названии мы можем получить полный
                                текст и ознакомиться с ним перед внесением данных.
                            </p>
                            <p>
                                Прочитать подробности про структуру научных публикаций вы можете{' '}
                                <a
                                    href="https://pulpy-rondel-999.notion.site/b1156ce089d44f99a8465ba2b5815469"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    здесь
                                </a>
                                .
                            </p>

                            <InstructionImage src="work1.webp" alt="Окно текущей публикации" />
                            <p>Публикация откроется в новой вкладке.</p>
                            <InstructionImage src="work2.webp" alt="Открытие публикации" />

                            <p>
                                Под Текущей публикацией расположены поля, в которые предстоит
                                заносить информацию по каждой находке пауков. Все поля объединены в
                                5 блоков: <strong>Административное расположение</strong>,{' '}
                                <strong>Географическое расположение</strong>,{' '}
                                <strong>Сбор материала</strong>, <strong>Таксономия</strong>,{' '}
                                <strong>Количество</strong>.
                            </p>

                            <div className="bg-muted p-4 md:p-6 rounded-lg mt-4 border border-border">
                                <h4 className="font-semibold text-lg mt-0 mb-4 text-foreground">
                                    Общие рекомендации по работе с публикацией:
                                </h4>
                                <ol className="mb-0 space-y-3">
                                    <li>
                                        <strong>Для начала прочитайте публикацию целиком.</strong>{' '}
                                        Как показывает наш опыт, предварительное чтение публикации
                                        даст ответ на большинство вопросов, связанных с тем, где
                                        искать информацию о месте сбора, методах сбора и т.п.
                                    </li>
                                    <li>
                                        В рамках проекта мы вносим в форму информацию о{' '}
                                        <strong>НАХОДКАХ</strong> пауков. Одна находка - это один
                                        вид, найденный в одну дату в одном месте и собранный одним
                                        методом. При этом количество особей этого вида может быть
                                        любым. Если один и тот же вид собран в разные даты или в
                                        разных местах или разными методами, то есть если в этих
                                        пунктах есть хоть какие-то отличия, то это{' '}
                                        <strong>РАЗНЫЕ НАХОДКИ</strong>. Соответственно, каждую из
                                        них нам предстоит внести в форму по отдельности.
                                    </li>
                                    <li>
                                        Если возникают вопросы, не стесняйтесь обращаться к нам за
                                        помощью. Для этого можно дать телеграм-боту команду{' '}
                                        <code>/support</code> или написать &quot;поддержка&quot;.
                                    </li>
                                </ol>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 3. Административное расположение */}
                <section id="admin" className="scroll-mt-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Административное расположение</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
                            <p>
                                В блок <strong>Административное расположение</strong> вносится вся
                                информация о месте находки с точки зрения административного деления
                                страны.
                            </p>
                            <p>
                                <strong>Регион</strong> - это область, республика или край, а{' '}
                                <strong>Район</strong> - более мелкие административные единицы, из
                                которых состоят регионы. Форма настроена так, что при вводе региона
                                предлагает только те районы, которые к нему относятся. И наоборот,
                                если выбрать сразу район, то регион подставится автоматически.
                            </p>
                            <p>
                                Если вы не нашли необходимый вариант в предложенном списке, или
                                хотите внести из данной публикации все находки, а не только
                                относящиеся к Уралу, то снимаем галочку{' '}
                                <em>Местоположение относится к Уралу</em> и после этого вводим любые
                                другие административные названия. То же самое касается и названий на
                                английском языке: вводим их вручную.
                            </p>

                            <InstructionImage
                                src="adm.webp"
                                alt="Карта Урала"
                                className="max-w-2xl mx-auto"
                            />

                            <p>
                                <strong>Место сбора</strong> записываем вручную в точности так, как
                                оно указано в работе. Чаще всего это ближайший населенный пункт к
                                тому месту, где была сделана находка, но могут быть названия
                                заповедников, указание направления (4 км к югу от д. Макарово) и
                                другие варианты.
                            </p>

                            <div className="mt-8 space-y-6">
                                <div>
                                    <h4 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                                        <span className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">
                                            Пример 1
                                        </span>
                                    </h4>
                                    <p className="text-sm italic text-muted-foreground border-l-2 border-primary/50 pl-3 py-1">
                                        Статья: Esyunin S.L., Tuneva T.K., Farzalieva G.Sh. 2007.
                                        Remarks on the Ural spider fauna... Spiders of the steppe
                                        zone of Orenburg Region...
                                    </p>
                                    <p>
                                        Поскольку публикация на английском, снимаем галочку{' '}
                                        <em>Вводить административные названия на русском языке</em>.
                                        Местоположение всегда указывается в разделе &quot;Материалы
                                        и методы&quot; публикации. В этой статье информация о
                                        Регионе отражена также в заголовке публикации. Значит, в
                                        качестве региона выбираем Оренбургскую область,
                                        предварительно сменив страну на английское название
                                        (Russia).
                                    </p>
                                    <InstructionImage src="adm2.webp" alt="Ввод региона" />

                                    <p>
                                        В данном примере перечисление конкретных мест сбора
                                        материала дано в разделе &quot;Introduction&quot;
                                        (Введение). Ниже в тексте статьи даются ссылки на
                                        соответствующие локалитеты в виде номеров в квадратных
                                        скобках.
                                    </p>
                                    <InstructionImage
                                        src="adm3.webp"
                                        alt="Поиск локалитетов в статье"
                                    />
                                    <p>
                                        Если мы соотнесем эти номера с теми, что даны во введении,
                                        получится, что и первая, и вторая находки относятся к
                                        Кувандыкскому району. Место сбора вписываем вручную так, как
                                        оно указано в статье.
                                    </p>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                                        <span className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">
                                            Пример 2
                                        </span>
                                    </h4>
                                    <p className="text-sm italic text-muted-foreground border-l-2 border-primary/50 pl-3 py-1">
                                        Статья: Ухова Н.Л., Есюнин С.Л., Семенов В.Б... Численность
                                        почвенных и напочвенных беспозвоночных животных...
                                    </p>
                                    <p>
                                        В тексте публикации не приводятся данные об административном
                                        расположении района исследований. Однако, из выходных данных
                                        мы видим, что исследования проводились на территории
                                        Висимского заповедника. Регион и район выясняем через
                                        интернет. Если указан квартал заповедника, его также
                                        записываем в Место сбора.
                                    </p>
                                    <InstructionImage
                                        src="adm4.webp"
                                        alt="Заполненный блок административного расположения"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 4. Географическое расположение */}
                <section id="geo" className="scroll-mt-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Географическое расположение</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
                            <p>
                                Находим в статье координаты находки конкретного паука и вносим их в
                                том формате, который приведен в публикации.
                            </p>
                            <InstructionImage src="geo.webp" alt="Форматы координат" />

                            <p>
                                Если программа считает, что находка не относится к Уралу, а вы
                                уверены в обратном, или вы вносите все находки, снимите галочку{' '}
                                <em>Местоположение относится к Уралу</em>.
                            </p>
                            <p>
                                Если ввод географических координат затруднен (разница в формате,
                                слишком общие координаты), записываем их с комментарием в поле{' '}
                                <strong>Примечания к расположению</strong>.
                            </p>
                            <InstructionImage src="geo2.webp" alt="Примечания к расположению" />

                            <p>
                                Если в публикации координаты отсутствуют, в{' '}
                                <strong>Происхождении координат</strong> выбираем вариант{' '}
                                <em>Координат нет и не будет</em>. При проверке возникнет
                                предупреждение - нажимаем &quot;Да, все верно&quot;.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                                <InstructionImage src="coord1.webp" alt="Координаты в статье 1" />
                                <InstructionImage src="coord2.webp" alt="Координаты в статье 2" />
                            </div>
                            <p>
                                В этом примере координаты даны в формате градусы-минуты. Вводим их.
                            </p>
                            <InstructionImage src="geo3.webp" alt="Ввод координат" />

                            <p>
                                Поскольку координаты приведены прямо в публикации, выбираем
                                происхождение координат <em>Из публикации как есть</em>.
                            </p>
                            <p>
                                <strong>Радиус неточности координат</strong> - расстояние в метрах,
                                в пределах которого находится локалитет (обычно 30 м для современных
                                GPS). Если значение неизвестно, оставляем поле пустым.
                            </p>

                            <div className="bg-muted p-4 md:p-6 rounded-lg border border-border">
                                <p className="mb-0 text-foreground">
                                    Собственной геопривязкой на данном этапе развития проекта мы не
                                    занимаемся, так что у нас только два варианта: либо вносить
                                    координаты из публикации, либо не вносить. Если вы хотите
                                    заняться поиском координат, обратитесь к нам за инструктажем в
                                    индивидуальном порядке.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 5. Сбор материала */}
                <section id="collection" className="scroll-mt-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Сбор материала</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
                            <p>
                                Здесь вводим даты сбора материала - конкретный день / месяц / год
                                или их интервал - зависит от публикации. Если нужно ввести интервал,
                                ставим галочку <strong>Интервал дат</strong>.
                            </p>
                            <InstructionImage src="eve1.webp" alt="Ввод дат" />

                            <p>
                                Если в публикации отсутствуют день и/или месяц сбора, не забываем
                                снять соответствующие галочки <em>Месяц определён</em> и{' '}
                                <em>День определён</em>, иначе при проверке получим ошибку.
                            </p>
                            <InstructionImage src="eve2.webp" alt="Отсутствие дня или месяца" />

                            <p>
                                <strong>Биотоп</strong> — это небольшой участок территории с
                                однородными природными условиями, который обычно выделяют по
                                преобладающим растениям (например березовый лес, пойменный луг).
                                Вносить в форму следует как можно более полную информацию о
                                площадке.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InstructionImage src="image25.webp" alt="Биотоп пример 1" />
                                <InstructionImage src="image26.webp" alt="Биотоп пример 2" />
                            </div>

                            <p>
                                Иногда вместо краткого названия пишут подробные описания, копируем
                                их в <strong>Примечания к сбору материала</strong>. Информацию о
                                номере квартала вносим в Место сбора, высоту над уровнем моря — в
                                примечания.
                            </p>

                            <p>
                                <strong>Коллектор</strong> - тот, кто собрал паука. Если в статье
                                перечислены инициалы (например ТТК), ищем их расшифровку в тексте
                                (Tuneva T.K.) и вносим полную информацию. Если авторы сбора не
                                указаны, вносим авторов публикации.
                            </p>

                            <p>
                                <strong>Выборочное усилие</strong> исследователя, затраченное на
                                поимку пауков, позволяет понять, насколько их много в данной
                                местности (например, 200 взмахов сачком, 100 ловушко-суток). Метод
                                сбора стоит написать в Примечаниях к сбору материала.
                            </p>
                            <InstructionImage src="eve4.webp" alt="Пример заполнения блока" />

                            <div className="bg-primary/10 border-l-4 border-primary p-4 my-4">
                                <p className="mb-0 font-medium text-primary">
                                    Всю информацию вводим на языке оригинала публикации!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 6. Таксономия */}
                <section id="taxonomy" className="scroll-mt-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Таксономия</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
                            <p>
                                Здесь записываем латинские названия семейства, рода и вида пауков.
                            </p>
                            <p>
                                Мы имеем дело с отрядом Пауки (по-латински <em>Araneae</em> или{' '}
                                <em>Aranei</em>). Отряды разбиваются на семейства, которые
                                оканчиваются на <em>-idae</em> (например, Araneidae, Lycosidae).
                                Семейства делят на рода, а рода на виды. Полное название вида
                                выглядит, например, так: <em>Araneus diadematus Clerck, 1757</em>.
                                Фамилию автора и год описания вносить никуда не надо.
                            </p>

                            <InstructionImage src="tax1.webp" alt="Пример таксономии в статье" />

                            <p>
                                Для облегчения задачи все поля оформлены как выпадающие списки. Если
                                в списке не найден нужный вид, ставим галочку{' '}
                                <strong>Отсутствует в списке</strong> и вводим название вручную.
                                Такое может быть, если вид со времен выхода публикации был
                                переименован.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InstructionImage src="tax2.webp" alt="Выпадающий список" />
                                <InstructionImage src="tax3.webp" alt="Ручной ввод" />
                            </div>

                            <p>
                                В некоторых работах род может быть сокращен до одной буквы. В форму
                                род и вид вносим полностью, без сокращений. Если вид описан как
                                новый для науки, к нему идет приписка <em>sp.n.</em> (species nova).
                                В таком случае ставим галочку <strong>Описан как новый вид</strong>.
                                Если у паука удалось определить только род (указано <em>sp.</em>),
                                снимаем галочку <strong>Вид определен</strong> и видовое название не
                                пишем.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* 7. Количество */}
                <section id="quantity" className="scroll-mt-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Количество</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
                            <p>
                                Данные о количестве пауков вносим с учетом их пола и возраста.
                                Вместо слов самка или самец используются символы:
                            </p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none pl-0">
                                <li className="bg-muted px-4 py-2 rounded-md flex items-center gap-3">
                                    <span className="text-xl font-bold text-blue-500 w-8 text-center">
                                        &#9794;
                                    </span>{' '}
                                    <span>
                                        или <strong>m</strong> - 1 самец
                                    </span>
                                </li>
                                <li className="bg-muted px-4 py-2 rounded-md flex items-center gap-3">
                                    <span className="text-xl font-bold text-blue-500 w-8 text-center">
                                        &#9794;&#9794;
                                    </span>{' '}
                                    <span>- 2 и более самца</span>
                                </li>
                                <li className="bg-muted px-4 py-2 rounded-md flex items-center gap-3">
                                    <span className="text-xl font-bold text-pink-500 w-8 text-center">
                                        &#9792;
                                    </span>{' '}
                                    <span>
                                        или <strong>f</strong> - 1 самка
                                    </span>
                                </li>
                                <li className="bg-muted px-4 py-2 rounded-md flex items-center gap-3">
                                    <span className="text-xl font-bold text-pink-500 w-8 text-center">
                                        &#9792;&#9792;
                                    </span>{' '}
                                    <span>- 2 и более самок</span>
                                </li>
                                <li className="bg-muted px-4 py-2 rounded-md flex items-center gap-3">
                                    <span className="font-mono font-bold text-green-500 w-8 text-center">
                                        juv.
                                    </span>{' '}
                                    <span>- ювенильная (неполовозрелая)</span>
                                </li>
                                <li className="bg-muted px-4 py-2 rounded-md flex items-center gap-3">
                                    <span className="font-mono font-bold text-orange-500 w-8 text-center">
                                        sub.
                                    </span>{' '}
                                    <span>- субвзрослая (станет взрослой скоро)</span>
                                </li>
                            </ul>

                            <p className="mt-6">
                                Количество вносим в форму как есть. Если количество пауков приведено
                                без указания полов, всех особей записываем во взрослых. Если даны
                                самцы и самки - пишем раздельно, не суммируем!
                            </p>
                            <p>
                                Количество экземпляров может быть не указано (например, только
                                плюсик в таблице). По умолчанию в Количество вносим 1 и пишем в
                                Комментарии: &quot;наличие особей, а не их количество&quot;.
                            </p>
                            <p>
                                Если указано не количество особей, а другой показатель численности
                                (экз./100 взм, мг/м2), вносим число в Количество, а в Комментарии
                                вписываем единицу измерения.
                            </p>

                            <InstructionImage src="tax4.webp" alt="Ввод количества" />
                            <p>
                                Бывает, что в публикации приведены несколько показателей. Нам надо
                                выбрать один. Попадаемость на 100 лов.-сут. приоритетнее, чем %, а
                                непосредственное количество особей приоритетнее лов.-сут. Более
                                значимый показатель мы вносим в форму, а в Комментарии пишем менее
                                значимый.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* 8. Проверка и запись данных */}
                <section id="check" className="scroll-mt-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Проверка и запись внесенных данных</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
                            <p>
                                Когда все поля формы заполнены, мы можем убедиться, что ничего не
                                пропустили, для этого нажимаем <strong>Проверить</strong>. Если
                                уверены, что все отлично, нажимаем <strong>Записать</strong>.
                            </p>
                            <p>
                                Если в записи есть ошибки, вы увидите предупреждение. Не стоит его
                                пугаться, вводить все заново не придется: достаточно вернуться к
                                записи и исправить ошибки. После чего запись будет успешно добавлена
                                в базу данных.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* 9. Дополнительные возможности */}
                <section id="extra" className="scroll-mt-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Дополнительные возможности</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
                            <h4 className="mt-0 mb-2 text-foreground font-semibold text-lg">
                                Замочки
                            </h4>
                            <p>
                                Если мы прочитали статью и понимаем, что информация из какого-то
                                блока далее будет повторяться для разных записей, мы можем
                                зафиксировать информацию во всем блоке, нажав на иконку замочка.
                            </p>
                            <p>
                                Информация под закрытым замочком после заполнения всех полей и
                                сохранения записи не очистится. Обязательно попробуйте эту опцию, с
                                ней данные вносятся быстрее и проще!
                            </p>

                            <Separator className="my-6" />

                            <h4 className="mt-6 mb-2 text-foreground font-semibold text-lg">
                                Статистика
                            </h4>
                            <p>
                                На странице Дашборд вы можете посмотреть свою персональную
                                статистику: все внесенные вами данные.
                            </p>

                            <Separator className="my-6" />

                            <h4 className="mt-6 mb-2 text-foreground font-semibold text-lg">
                                Удаление записей
                            </h4>
                            <p>
                                Если вы допустили ошибку и поняли это после внесения записи в базу,
                                вы можете удалить ошибочную запись на той же странице Дашборд.
                                Будьте внимательны, эта возможность доступна только для вашей
                                текущей публикации, и закрывается как только вы ее сменили.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* 10. Завершение работы */}
                <section id="finish" className="scroll-mt-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Завершение работы с публикацией</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
                            <p>
                                Когда вы посчитаете, что взяли из публикации все данные, которые
                                могли, нажмите кнопку{' '}
                                <strong>Публикация обработана, дайте следующую</strong>. Появится
                                диалоговое окно.
                            </p>

                            <p>
                                Выбираем подходящие нам варианты ответа. Если у публикации были
                                особенности (виды за пределами Урала, перечисление видов без
                                находок), стоит об этом написать в комментариях. Эта информация
                                здорово облегчит дальнейшую работу с данными.
                            </p>
                            <p>
                                После нажатия кнопки текущая публикация будет считаться полностью
                                обработанной, а система предложит вам новую.
                            </p>

                            <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg text-center mt-8">
                                <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">
                                    Спасибо за ваш вклад в наше дело!
                                </h3>
                                <p className="mb-0 text-muted-foreground">
                                    Мы очень его ценим! Если у вас остались вопросы - пишите нам в
                                    соцсетях, или в телеграм-бот, и мы на них оперативно ответим!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
};

export default Instructions;
