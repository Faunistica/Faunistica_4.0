import { FileText, Languages, UserCheck, Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function Onboarding() {
    return (
        <main className="flex flex-1 flex-col items-center px-4 py-8 md:py-12">
            <div className="w-full max-w-2xl space-y-8">
                <Card className="overflow-hidden border-slate-200 shadow-sm">
                    <CardHeader className="space-y-4">
                        <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
                            Анкета участника
                        </CardTitle>
                        <div className="space-y-4 leading-relaxed text-slate-900">
                            <p>
                                Благодарим вас за регистрацию в системе. Перед началом работы нам
                                необходимо уточнить несколько организационных вопросов для
                                оптимизации вашего взаимодействия с проектом.
                            </p>
                            <div className="rounded-lg border-l-4 border-slate-400 bg-slate-100 p-4 text-sm">
                                Напоминаем, что регистрироваться и участвовать в нашем проекте могут{' '}
                                <strong>совершеннолетние лица</strong>. Несовершеннолетние в
                                возрасте от 14 до 18 лет также могут принимать участие, однако
                                регистрация должна осуществляться
                                <strong> с согласия и в присутствии родителей</strong> или законных
                                представителей.
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-10">
                        {/* Секция 1: Подтверждение соглашения */}
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                                <Checkbox id="agreement" className="mt-1" />
                                <div className="grid gap-1.5 leading-none">
                                    <Label
                                        htmlFor="agreement"
                                        className="cursor-pointer text-sm/snug font-semibold"
                                    >
                                        Я подтверждаю, что соблюдаю условия пользовательского
                                        соглашения и соответствую возрастным критериям проекта
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Секция 2: Демография */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                <UserCheck className="size-5" />
                                <h3>Личные данные</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="age">Ваш возраст</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        placeholder="Укажите возраст"
                                        min="14"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Пол</Label>
                                    <Select>
                                        <SelectTrigger id="gender">
                                            <SelectValue placeholder="Не выбрано" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Мужской</SelectItem>
                                            <SelectItem value="female">Женский</SelectItem>
                                            <SelectItem value="other">Другой</SelectItem>
                                            <SelectItem value="prefer-not">
                                                Предпочитаю не указывать
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Секция 3: Языки */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                <Languages className="size-5" />
                                <h3>Языковые компетенции</h3>
                            </div>
                            <p className="text-sm text-slate-900">
                                На каких языках вы готовы обрабатывать научные публикации? (можно
                                выбрать несколько)
                            </p>
                            <div className="flex flex-wrap gap-6 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="lang-ru" />
                                    <Label htmlFor="lang-ru" className="cursor-pointer font-medium">
                                        Русский
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="lang-en" />
                                    <Label htmlFor="lang-en" className="cursor-pointer font-medium">
                                        Английский
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Секция 4: Предпочтения */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                <Settings2 className="size-5" />
                                <h3>Профессиональные предпочтения</h3>
                            </div>
                            <div className="space-y-3 text-sm/relaxed text-slate-900">
                                <p>
                                    Какие публикации вы хотели бы получать и в каком порядке?
                                    Возможно, у вас имеются предпочтения по{' '}
                                    <strong>
                                        географическому региону, автору или конкретному семейству
                                    </strong>
                                    ?
                                </p>
                                <p>
                                    Укажите пожелания по сложности материала, объему или наличию
                                    описаний новых для науки видов (sp. n.). Сообщите о них, и мы
                                    постараемся учесть это при распределении задач.
                                </p>
                            </div>
                            <div className="pt-2">
                                <Label
                                    htmlFor="preferences"
                                    className="mb-2 block text-xs font-bold tracking-wider text-slate-400 uppercase"
                                >
                                    Дополнительная информация (по желанию)
                                </Label>
                                <Textarea
                                    id="preferences"
                                    placeholder="Например: предпочтительно семейство Lycosidae, публикации на английском языке, Южный Урал..."
                                    className="min-h-[150px] resize-y"
                                />
                            </div>
                        </div>

                        {/* Секция 5: Публичный рейтинг */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-900">
                                <FileText className="size-5" />
                                <h3>Публичность данных</h3>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-base">
                                    Согласны ли вы на отображение вашего имени в публичной таблице
                                    рейтинга?
                                </Label>
                                <RadioGroup defaultValue="no" className="flex flex-col space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="yes" id="rating-yes" />
                                        <Label
                                            htmlFor="rating-yes"
                                            className="cursor-pointer font-normal"
                                        >
                                            Да, я согласен на публичное отображение
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no" id="rating-no" />
                                        <Label
                                            htmlFor="rating-no"
                                            className="cursor-pointer font-normal"
                                        >
                                            Нет, использовать анонимный идентификатор
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 border-t border-slate-100 bg-white p-6 sm:flex-row">
                        <Button className="w-full bg-slate-900 px-10 font-bold text-white shadow-md hover:bg-slate-800 sm:w-auto">
                            Завершить регистрацию
                        </Button>
                        {/* <Button variant="destructive" className="w-full sm:w-auto font-bold px-10 shadow-md">
    Отменить регистрацию
  </Button> */}
                    </CardFooter>
                </Card>
            </div>
        </main>
    );
}
