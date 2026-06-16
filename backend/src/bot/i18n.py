from collections.abc import Mapping
from typing import Literal

from core.config import settings

type BotLanguage = Literal["ru", "en"]

_DEFAULT_LANG: BotLanguage = "en"


def detect_language(tg_language_code: str | None) -> BotLanguage:
    """Detect bot language from Telegram user's language_code."""
    if tg_language_code and tg_language_code.startswith("ru"):
        return "ru"
    return _DEFAULT_LANG


def _resolve_lang(
    tg_language_code: str | None,
    user_lng: str | None,
) -> BotLanguage:
    """Resolve preferred language from user DB field, fallback to TG language code."""
    if user_lng == "rus":
        return "ru"
    if user_lng == "eng":
        return "en"
    return detect_language(tg_language_code)


def resolve_lang(
    tg_language_code: str | None,
    user_lng: str | None,
) -> BotLanguage:
    """Public wrapper: resolve preferred language from user DB field, fallback to TG language code."""
    return _resolve_lang(tg_language_code, user_lng)


class Messages:
    # ========== START MESSAGE ========== #

    @staticmethod
    def start(first_name: str, lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                f"Здравствуйте, {first_name}\n"
                "Я - телеграм-бот проекта "
                '<a href="https://vk.com/data_web">Паутина данных</a>, '
                "очень рад, что Вы им заинтересовались. "
                "Для регистрации заполните форму на "
                f'<a href="{settings.SITE_URL}">нашем сайте</a> '
                "и подтвердите код в этом боте командой /confirm.\n\n"
                "Если хотите ознакомиться со списком команд, вызовите /menu."
            )
        return (
            f"Hello, {first_name}\n"
            "I am the Telegram bot of the "
            '<a href="https://vk.com/data_web">Data Web</a> project. '
            "I am glad you are interested. "
            "To register, fill out the form on "
            f'<a href="{settings.SITE_URL}">our website</a> '
            "and confirm the code in this bot with the /confirm command.\n\n"
            "To see the list of commands, type /menu."
        )

    # ========== REGISTER MESSAGE ========== #

    @staticmethod
    def registration_via_site(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Регистрация теперь проходит через сайт. "
                f"Заполните форму на {settings.SITE_URL}/ и отправьте "
                "код подтверждения командой /confirm <код>"
            )
        return (
            "Registration is now done through the website. "
            f"Fill out the form at {settings.SITE_URL}/ and send "
            "the confirmation code with the command /confirm <code>"
        )

    @staticmethod
    def request_confirmation_code(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Пожалуйста, отправьте код подтверждения"
        return "Please send the confirmation code"

    @staticmethod
    def confirmation_code_invalid(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Не удалось найти такой код. Проверьте его и попробуйте снова."
        return "Code not found. Please check it and try again."

    @staticmethod
    def confirmation_code_expired(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Срок действия кода истек. Запросите новый код на сайте."
        return "The code has expired. Please request a new code on the website."

    @staticmethod
    def confirmation_code_used(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Этот код уже был использован."
        return "This code has already been used."

    @staticmethod
    def registration_confirmed(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return f"Пройдите анкету на сайте {settings.SITE_URL}/\n"
        return f"Please complete the profile at {settings.SITE_URL}/\n"

    @staticmethod
    def auth_confirmed(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Вход подтвержден!"
        return "Login confirmed!"

    @staticmethod
    def maybe_later(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Ничего, может быть позже... 😌"
        return "No worries, maybe later... 😌"

    @staticmethod
    def username_already_exists(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Ой-ой... кто-то уже выбрал такое имя пользователя 🥺\n\n"
                "Попробуйте добавить фамилию, цифру или любимое животное."
            )
        return (
            "Oops... someone already chose that username 🥺\n\n"
            "Try adding a last name, a number, or a favorite animal."
        )

    @staticmethod
    def not_registered(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Увы, вас пока нет среди зарегистрированных пользователей.\n"
                f"Зарегистрируйтесь на сайте {settings.SITE_URL}/ "
                "и подтвердите код в этом боте командой /confirm."
            )
        return (
            "Unfortunately, you are not among the registered users yet.\n"
            f"Register at {settings.SITE_URL}/ "
            "and confirm the code in this bot with the /confirm command."
        )

    @staticmethod
    def age_too_low(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Сожалею, участие возможно только с 14 лет 😞"
        return "Sorry, participation is only available from age 14 😞"

    @staticmethod
    def age_under_18_warning(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Напоминаю, что участие с 14 до 18 лет возможно только "
                "при регистрации с родителями! "
                "Продолжайте только если они находятся рядом."
            )
        return (
            "Reminder: participation from age 14 to 18 is only possible "
            "when registered with parents! "
            "Continue only if they are nearby."
        )

    # ========== SUPPORT MESSAGE ========== #

    @staticmethod
    def support_for_admins(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Камон, люди из этого чата должны оказывать "
                "техподдержку, а не просить её 😡"
            )
        return (
            "Come on, people in this chat should provide "
            "technical support, not ask for it 😡"
        )

    @staticmethod
    def support_request(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Понял, вам нужна помощь.\n"
                "Напишите мне в чем ваше затруднение и я соединю вас "
                "с администрацией проекта\n "
                'Отменить обращение можно, написав "cancel" или "отмена"\n 👇👇👇'
            )
        return (
            "Got it, you need help.\n"
            "Tell me what problem you are having and I will connect you "
            "with the project administration.\n "
            'You can cancel by typing "cancel"\n 👇👇👇'
        )

    @staticmethod
    def support_request_received(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Ваша просьба о помощи получена. "
                "С вами свяжется первый освободившийся "
                "организатор / администратор проекта 🤗"
            )
        return (
            "Your support request has been received. "
            "The first available organizer / project administrator "
            "will contact you 🤗"
        )

    @staticmethod
    def support_request_too_short(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Извините, но по такому короткому описанию будет трудно "
                "понять как вам помочь 😅"
            )
        return (
            "Sorry, but with such a short description it will be difficult "
            "to understand how to help you 😅"
        )

    @staticmethod
    def cancellation_support_request(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Обращение в поддержку отменено 🫡"
        return "Support request cancelled 🫡"

    @staticmethod
    def request_for_support(username: str, user_id: int, text: str) -> str:
        return (
            f"Пользователь @{username}, ID: {user_id} обратился в поддержку:\n\n{text}"
        )

    @staticmethod
    def statistics(
        general_stats: Mapping[str, object],
        personal_stats: Mapping[str, object] | None = None,
        lang: BotLanguage = _DEFAULT_LANG,
    ) -> str:
        if lang == "ru":
            stats_text = (
                "<b>Общая статистика: </b>\n\n"
                f"Всего зарегистрированных участников: {general_stats['total_users']}"
                f"\nСредний возраст участника: {general_stats['avg_age']}"
                "\nВсего публикаций на очереди в оцифровку: "
                f"{general_stats['total_publs']},\n"
                f"из них на русском языке {general_stats['rus_publs']}, "
                f"на английском языке {general_stats['eng_publs']}."
                f"\nВсего записей внесено волонтерами: {general_stats['rec_ok']}."
                f"\nНа одну успешную запись приходится "
                f"{general_stats.get('rec_fail_ratio', 0) or 0} неудачных попыток, "
                f"а также {general_stats.get('check_ratio', 0) or 0} проверок."
                f"\nЭти записи содержат информацию о {general_stats['species_count']} "
                f"видах, относящихся к {general_stats['families_count']} семействам."
                "\nЭто очень хорошая статистика!\nНадеемся, ваш вклад ее улучшит ^_^"
            )

            if personal_stats is not None:
                stats_text += (
                    "\n\n<b>Персональная статистика:</b>\n"
                    f"Вы полностью обработали "
                    f"{personal_stats['processed_publs']} публикаций, "
                    "в процессе обработки: 1 публикация. "
                    f"Вы внесли {personal_stats['rec_ok']} записей.\n"
                    f"На каждую успешную запись приходится "
                    f"{personal_stats.get('check_ratio', 0) or 0} проверок.\n"
                    f"Вашими стараниями в базе оказалось "
                    f"{personal_stats['species_count']} видов.\n"
                    f"Чаще всего вы встречали вид: "
                    f"<i>{personal_stats['most_common_species']}</i>\n"
                    "Это очень хорошая статистика! "
                    "Надеемся, вы сможете сделать ещё лучше ^_^ "
                )
        else:
            stats_text = (
                "<b>General Statistics: </b>\n\n"
                f"Total registered participants: {general_stats['total_users']}"
                f"\nAverage participant age: {general_stats['avg_age']}"
                "\nTotal publications in digitization queue: "
                f"{general_stats['total_publs']},\n"
                f"in Russian: {general_stats['rus_publs']}, "
                f"in English: {general_stats['eng_publs']}."
                f"\nTotal records submitted by volunteers: {general_stats['rec_ok']}."
                f"\nFailed attempts per successful record: "
                f"{general_stats.get('rec_fail_ratio', 0) or 0}, "
                f"and {general_stats.get('check_ratio', 0) or 0} checks."
                f"\nThese records contain information about {general_stats['species_count']} "
                f"species belonging to {general_stats['families_count']} families."
                "\nThis is great statistics!\nWe hope your contribution will improve it ^_^"
            )

            if personal_stats is not None:
                stats_text += (
                    "\n\n<b>Personal Statistics:</b>\n"
                    f"You fully processed "
                    f"{personal_stats['processed_publs']} publications, "
                    "1 publication in progress. "
                    f"You submitted {personal_stats['rec_ok']} records.\n"
                    f"Checks per successful record: "
                    f"{personal_stats.get('check_ratio', 0) or 0}.\n"
                    f"Your efforts added "
                    f"{personal_stats['species_count']} species to the database.\n"
                    f"Most commonly encountered species: "
                    f"<i>{personal_stats['most_common_species']}</i>\n"
                    "This is great statistics! "
                    "We hope you can do even better ^_^ "
                )

        return stats_text

    # ========== SOCIOLOGY MESSAGE ========== #

    @staticmethod
    def not_email(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Вы уверены, что это email? Я вот не очень 🙃"
        return "Are you sure that's an email? I'm not so sure 🙃"

    @staticmethod
    def age_too_high(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "??? Вы не шутите? "
                "Старейший человек на Земле это "
                "[Мария Браньяс Морера](https://www.fontanka.ru/2023/01/26/72007319). "
                "Если вы не она, то введите корректный возраст, пожалуйста\n☺️"
            )
        return (
            "??? Are you kidding? "
            "The oldest person on Earth is "
            "[Maria Branyas Morera](https://www.fontanka.ru/2023/01/26/72007319). "
            "If you are not her, please enter a valid age\n☺️"
        )

    # ========== REPLY MESSAGE ========== #

    @staticmethod
    def using_command_reply(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Команду /reply нужно использовать в ответ на обращение пользователя, "
                "чтобы я понял кому отвечать 🤓"
            )
        return (
            "Use the /reply command in response to a user's message "
            "so I know who to reply to 🤓"
        )

    @staticmethod
    def empty_response_to_user(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Пользователю не поможет этот ответ. "
                "Используй /reply еще раз и ответь нормально."
            )
        return (
            "This response won't help the user. "
            "Use /reply again and respond properly."
        )

    @staticmethod
    def could_not_extract_id(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Не удалось извлечь ID пользователя из сообщения."
        return "Could not extract user ID from the message."

    @staticmethod
    def response_sent(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Ответ отправлен пользователю ✅"
        return "Response sent to the user ✅"

    @staticmethod
    def response_from_support(reply_text: str) -> str:
        return f"🛠️ Ответ от поддержки:\n\n{reply_text}"

    # ========== LOGS MESSAGE ========== #

    @staticmethod
    def incorrect_date(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                '❌ Неверный формат даты. Укажите дату в формате ГГГГ-ММ-ДД или "сегодня"'
            )
        return (
            '❌ Invalid date format. Please enter the date as YYYY-MM-DD or "today"'
        )

    @staticmethod
    def available_log_dates(dates: set[str]) -> str:
        return f"🥹 Доступные даты логов:\n{''.join(dates)}"

    @staticmethod
    def logs_not_found(date_str: str) -> str:
        return f"🤯 Лог-файлы за {date_str} не найдены"

    # ========== MENU MESSAGE ========== #

    @staticmethod
    def called_menu(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Вы вызвали меню 🥳\n\n"
                "<b>/start</b> — общая информация о проекте 🚀\n"
                "<b>/confirm</b> — подтвердить код регистрации с сайта 🧾\n"
                "<b>/support</b> — как только заметите что-то неработающее, "
                "нажимайте (чайник починить не смогу) 🛠\n"
                "<b>/menu</b> — вы это читаете 😱\n"
                "<b>/cancel</b> — отменяет действие ❤️‍🩹\n\n"
                "Ну как-то так... 😎\n"
                '<span class="tg-spoiler">'
                "Поставьте моей команде 5 звезд, пожалуйста 🥹</span>"
            )
        return (
            "You called the menu 🥳\n\n"
            "<b>/start</b> — general project information 🚀\n"
            "<b>/confirm</b> — confirm registration code from the website 🧾\n"
            "<b>/support</b> — when you notice something not working, "
            "press this (I can't fix a kettle) 🛠\n"
            "<b>/menu</b> — you are reading this 😱\n"
            "<b>/cancel</b> — cancels the current action ❤️‍🩹\n\n"
            "That's about it... 😎\n"
            '<span class="tg-spoiler">'
            "Please give my command 5 stars 🥹</span>"
        )

    # ========== CANCEL MESSAGE ========== #

    @staticmethod
    def rollback_completed(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Понял, откат выполнен 😉"
        return "Got it, rollback completed 😉"

    # ========== GENERAL MESSAGE ========== #

    @staticmethod
    def support_flow_not_finished(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Вы начали обращение в поддержку 🙌. "
                "Пожалуйста, завершите его или отмените командой /cancel"
            )
        return (
            "You started a support request 🙌. "
            "Please complete it or cancel with the /cancel command"
        )

    @staticmethod
    def sociology_flow_not_finished(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Вы не закончили прохождение опроса 🙁. "
                "Пожалуйста, завершите его или отмените командой /cancel"
            )
        return (
            "You haven't completed the survey 🙁. "
            "Please finish it or cancel with the /cancel command"
        )

    @staticmethod
    def rename_flow_not_finished(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Вы не ввели свое новое имя. "
                "Пожалуйста, введите его или отмените командой /cancel"
            )
        return (
            "You haven't entered your new name. "
            "Please enter it or cancel with the /cancel command"
        )

    @staticmethod
    def registration_not_finished(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Извините, но вы не завершили регистрацию на сайте 👉🏻👈🏻\n"
                "Пожалуйста, завершите ее и подтвердите код в этом боте."
            )
        return (
            "Sorry, but you haven't completed registration on the website 👉🏻👈🏻\n"
            "Please complete it and confirm the code in this bot."
        )

    @staticmethod
    def message_too_short(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Ответ слишком короткий, не могу такое принять 🙁"
        return "The response is too short, I can't accept that 🙁"

    @staticmethod
    def invalid_sex(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Недопустимое значение пола"
        return "Invalid sex value"

    @staticmethod
    def invalid_lang(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Недопустимое значение языка"
        return "Invalid language value"

    @staticmethod
    def message_too_long(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "У меня плохая память, я точно не смогу запомнить такой длинный ответ 🫣"
        return "I have a bad memory, I definitely can't remember such a long answer 🫣"

    @staticmethod
    def invalid_characters(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "В ответе содержатся недопустимые символы"
        return "The response contains invalid characters"

    @staticmethod
    def message_no_digits(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Мои искусственные глаза не могут разглядеть здесь цифру 😞\n"
                "Попробуйте ещё раз"
            )
        return (
            "My artificial eyes can't see a number here 😞\n"
            "Please try again"
        )

    @staticmethod
    def no_access_to_command(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Простите, не могу позволить вам воспользоваться данной командой 😔"
        return "Sorry, I can't allow you to use this command 😔"

    @staticmethod
    def unknown_content(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Извините, обрабатывать контент такого типа мне пока сложно 😅\n"
                "Попробуйте вызывать меню: /menu"
            )
        return (
            "Sorry, processing this type of content is difficult for me for now 😅\n"
            "Try calling the menu: /menu"
        )

    @staticmethod
    def selection_not_recognized(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return "Извините, не могу распознать ваш выбор 😬"
        return "Sorry, I can't recognize your choice 😬"

    @staticmethod
    def unavailable_during_registration(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Простите, но по техническим причинам не могу вам дать "
                "воспользоваться данной командой на этапе регистрации. 😔\n\n"
                "Если вы столкнулись с проблемой, "
                f"напишите в [форму]({settings.SITE_URL}/feedback)"
            )
        return (
            "Sorry, due to technical reasons I can't allow you to "
            "use this command during the registration stage. 😔\n\n"
            "If you encountered a problem, "
            f"please write to the [form]({settings.SITE_URL}/feedback)"
        )

    @staticmethod
    def register_for_old(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Здравствуйте, тут такая проблемка...\n"
                "Я помню, что вы уже знаете меня, но для доступа "
                "нужно снова зарегистрироваться на сайте и подтвердить код в этом боте."
            )
        return (
            "Hello, there's a small issue...\n"
            "I remember that you already know me, but for access "
            "you need to register on the website again and confirm the code in this bot."
        )

    @staticmethod
    def registration_failed(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "Здравствуйте, тут такая проблемка...\n"
                "Мы не смогли сохранить данные о вас в базу. "
                "Попробуйте снова 😔"
            )
        return (
            "Hello, there's a small issue...\n"
            "We couldn't save your data to the database. "
            "Please try again 😔"
        )

    @staticmethod
    def unexpected_error(lang: BotLanguage = _DEFAULT_LANG) -> str:
        if lang == "ru":
            return (
                "⚠️ Мне жаль, но вы столкнулись с непредвиденной ошибкой.\n"
                "Сообщите в поддержку: /support"
            )
        return (
            "⚠️ I'm sorry, but you've encountered an unexpected error.\n"
            "Report to support: /support"
        )