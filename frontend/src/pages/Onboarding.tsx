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
        <main className="flex-1 flex flex-col items-center py-8 px-4 md:py-12">
            <div className="w-full max-w-2xl space-y-8">
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="space-y-4">
                        <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
                            Анкета участника
                        </CardTitle>
                        <div className="space-y-4 text-slate-900 leading-relaxed">
                            <p>
                                Благодарим вас за регистрацию в системе. Перед началом работы нам
                                необходимо уточнить несколько организационных вопросов для
                                оптимизации вашего взаимодействия с проектом.
                            </p>
                            <div className="bg-slate-100 p-4 rounded-lg border-l-4 border-slate-400 text-sm">
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
                            <div className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                                <Checkbox id="agreement" className="mt-1" />
                                <div className="grid gap-1.5 leading-none">
                                    <Label
                                        htmlFor="agreement"
                                        className="text-sm font-semibold leading-snug cursor-pointer"
                                    >
                                        Я подтверждаю, что соблюдаю условия пользовательского
                                        соглашения и соответствую возрастным критериям проекта
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Секция 2: Демография */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                                <UserCheck className="h-5 w-5" />
                                <h3>Личные данные</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                                <Languages className="h-5 w-5" />
                                <h3>Языковые компетенции</h3>
                            </div>
                            <p className="text-sm text-slate-900">
                                На каких языках вы готовы обрабатывать научные публикации? (можно
                                выбрать несколько)
                            </p>
                            <div className="flex flex-wrap gap-6 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="lang-ru" />
                                    <Label htmlFor="lang-ru" className="font-medium cursor-pointer">
                                        Русский
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="lang-en" />
                                    <Label htmlFor="lang-en" className="font-medium cursor-pointer">
                                        Английский
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Секция 4: Предпочтения */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                                <Settings2 className="h-5 w-5" />
                                <h3>Профессиональные предпочтения</h3>
                            </div>
                            <div className="space-y-3 text-sm text-slate-900 leading-relaxed">
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
                                    className="text-slate-400 mb-2 block text-xs uppercase tracking-wider font-bold"
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
                            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                                <FileText className="h-5 w-5" />
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
                                            className="font-normal cursor-pointer"
                                        >
                                            Да, я согласен на публичное отображение
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no" id="rating-no" />
                                        <Label
                                            htmlFor="rating-no"
                                            className="font-normal cursor-pointer"
                                        >
                                            Нет, использовать анонимный идентификатор
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="bg-white border-t border-slate-100 p-6 flex flex-col sm:flex-row gap-4">
                        <Button className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 font-bold px-10 shadow-md">
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
