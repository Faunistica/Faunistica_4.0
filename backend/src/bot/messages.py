class Messages:
    # ========== START MESSAGE ========== #

    @staticmethod
    def start(first_name: str) -> str:
        return (
            f"Здравствуйте, {first_name}\n"
            "Я - телеграм-бот проекта "
            '<a href="https://vk.com/data_web">Паутина данных</a>, '
            "очень рад, что Вы им заинтересовались. "
            "Для регистрации заполните форму на "
            '<a href="https://faunistica.ru/">нашем сайте</a> '
            "и подтвердите код в этом боте командой /confirm.\n\n"
            "Если хотите ознакомиться со списком команд, вызовите /menu."
        )

    # ========== REGISTER MESSAGE ========== #

    @staticmethod
    def registration_via_site() -> str:
        return (
            "Регистрация теперь проходит через сайт. "
            "Заполните форму на https://faunistica.ru/ и отправьте "
            "код подтверждения командой /confirm <код>"
        )

    @staticmethod
    def request_confirmation_code() -> str:
        return "Пожалуйста, отправьте код подтверждения"

    @staticmethod
    def confirmation_code_invalid() -> str:
        return "Не удалось найти такой код. Проверьте его и попробуйте снова."

    @staticmethod
    def confirmation_code_expired() -> str:
        return "Срок действия кода истек. Запросите новый код на сайте."

    @staticmethod
    def confirmation_code_used() -> str:
        return "Этот код уже был использован."

    @staticmethod
    def registration_confirmed() -> str:
        return "Пройдите анкету на сайте https://faunistica.ru/\n"

    @staticmethod
    def auth_confirmed() -> str:
        return "Вход подтвержден!"

    @staticmethod
    def maybe_later() -> str:
        return "Ничего, может быть позже... 😌"

    @staticmethod
    def username_already_exists() -> str:
        return (
            "Ой-ой... кто-то уже выбрал такое имя пользователя 🥺\n\n"
            "Попробуйте добавить фамилию, цифру или любимое животное."
        )

    @staticmethod
    def not_registered() -> str:
        return (
            "Увы, вас пока нет среди зарегистрированных пользователей.\n"
            "Зарегистрируйтесь на сайте https://faunistica.ru/ "
            "и подтвердите код в этом боте командой /confirm."
        )

    @staticmethod
    def age_too_low() -> str:
        return "Сожалею, участие возможно только с 14 лет 😞"

    @staticmethod
    def age_under_18_warning() -> str:
        return (
            "Напоминаю, что участие с 14 до 18 лет возможно только "
            "при регистрации с родителями! "
            "Продолжайте только если они находятся рядом."
        )

    # ========== SUPPORT MESSAGE ========== #

    @staticmethod
    def support_for_admins() -> str:
        # FIXME: Это вообще корректно?
        return (
            "Камон, люди из этого чата должны оказывать "
            "техподдержку, а не просить её 😡"
        )

    @staticmethod
    def support_request() -> str:
        return (
            "Понял, вам нужна помощь.\n"
            "Напишите мне в чем ваше затруднение и я соединю вас "
            "с администрацией проекта\n "
            'Отменить обращение можно, написав "cancel" или "отмена"\n 👇👇👇'
        )

    @staticmethod
    def support_request_received() -> str:
        return (
            "Ваша просьба о помощи получена. "
            "С вами свяжется первый освободившийся "
            "организатор / администратор проекта 🤗"
        )

    @staticmethod
    def support_request_too_short() -> str:
        return (
            "Извините, но по такому короткому описанию будет трудно "
            "понять как вам помочь 😅"
        )

    @staticmethod
    def cancellation_support_request() -> str:
        return "Обращение в поддержку отменено 🫡"

    @staticmethod
    def request_for_support(username: str, user_id: int, text: str) -> str:
        return (
            f"Пользователь @{username}, ID: {user_id} обратился в поддержку:\n\n{text}"
        )

    # ========== SOCIOLOGY MESSAGE ========== #

    @staticmethod
    def not_email() -> str:
        return "Вы уверены, что это email? Я вот не очень 🙃"

    @staticmethod
    def age_too_high() -> str:
        return (
            "??? Вы не шутите? "
            "Старейший человек на Земле это "
            "[Мария Браньяс Морера](https://www.fontanka.ru/2023/01/26/72007319). "
            "Если вы не она, то введите корректный возраст, пожалуйста\n☺️"
        )

    # ========== REPLY MESSAGE ========== #

    @staticmethod
    def using_command_reply() -> str:
        return (
            "Команду /reply нужно использовать в ответ на обращение пользователя, "
            "чтобы я понял кому отвечать 🤓"
        )

    @staticmethod
    def empty_response_to_user() -> str:
        return (
            "Пользователю не поможет этот ответ. "
            "Используй /reply еще раз и ответь нормально."
        )

    @staticmethod
    def could_not_extract_id() -> str:
        return "Не удалось извлечь ID пользователя из сообщения."

    @staticmethod
    def response_sent() -> str:
        return "Ответ отправлен пользователю ✅"

    @staticmethod
    def response_from_support(reply_text: str) -> str:
        return f"🛠️ Ответ от поддержки:\n\n{reply_text}"

    # ========== LOGS MESSAGE ========== #

    @staticmethod
    def incorrect_date() -> str:
        return (
            '❌ Неверный формат даты. Укажите дату в формате ГГГГ-ММ-ДД или "сегодня"'
        )

    @staticmethod
    def available_log_dates(dates: set[str]) -> str:
        return f"🥹 Доступные даты логов:\n{''.join(dates)}"

    @staticmethod
    def logs_not_found(date_str: str) -> str:
        return f"🤯 Лог-файлы за {date_str} не найдены"

    # ========== MENU MESSAGE ========== #

    @staticmethod
    def called_menu() -> str:
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

    # ========== CANCEL MESSAGE ========== #

    @staticmethod
    def rollback_completed() -> str:
        return "Понял, откат выполнен 😉"

    # ========== GENERAL MESSAGE ========== #

    @staticmethod
    def support_flow_not_finished() -> str:
        return (
            "Вы начали обращение в поддержку 🙌. "
            "Пожалуйста, завершите его или отмените командой /cancel"
        )

    @staticmethod
    def sociology_flow_not_finished() -> str:
        return (
            "Вы не закончили прохождение опроса 🙁. "
            "Пожалуйста, завершите его или отмените командой /cancel"
        )

    @staticmethod
    def rename_flow_not_finished() -> str:
        return (
            "Вы не ввели свое новое имя. "
            "Пожалуйста, введите его или отмените командой /cancel"
        )

    @staticmethod
    def registration_not_finished() -> str:
        return (
            "Извините, но вы не завершили регистрацию на сайте 👉🏻👈🏻\n"
            "Пожалуйста, завершите ее и подтвердите код в этом боте."
        )

    @staticmethod
    def message_too_short() -> str:
        return "Ответ слишком короткий, не могу такое принять 🙁"

    @staticmethod
    def invalid_sex() -> str:
        return "Недопустимое значение пола"

    @staticmethod
    def invalid_lang() -> str:
        return "Недопустимое значение языка"

    @staticmethod
    def message_too_long() -> str:
        return "У меня плохая память, я точно не смогу запомнить такой длинный ответ 🫣"

    @staticmethod
    def invalid_characters() -> str:
        return "В ответе содержатся недопустимые символы"

    @staticmethod
    def message_no_digits() -> str:
        return (
            "Мои искусственные глаза не могут разглядеть здесь цифру 😞\n"
            "Попробуйте ещё раз"
        )

    @staticmethod
    def no_access_to_command() -> str:
        return "Простите, не могу позволить вам воспользоваться данной командой 😔"

    @staticmethod
    def unknown_content() -> str:
        return (
            "Извините, обрабатывать контент такого типа мне пока сложно 😅\n"
            "Попробуйте вызывать меню: /menu"
        )

    @staticmethod
    def selection_not_recognized() -> str:
        return "Извините, не могу распознать ваш выбор 😬"

    @staticmethod
    def unavailable_during_registration() -> str:
        return (
            "Простите, но по техническим причинам не могу вам дать "
            "воспользоваться данной командой на этапе регистрации. 😔\n\n"
            "Если вы столкнулись с проблемой, "
            "напишите в [форму](https://faunistica.ru/feedback)"
        )

    @staticmethod
    def register_for_old() -> str:
        return (
            "Здравствуйте, тут такая проблемка...\n"
            "Я помню, что вы уже знаете меня, но для доступа "
            "нужно снова зарегистрироваться на сайте и подтвердить код в этом боте."
        )
    @staticmethod
    def registration_failed() -> str:
        return (
            "Здравствуйте, тут такая проблемка...\n"
            "Мы не смогли сохранить данные о вас в базу. "
            "Попробуйте снова 😔"
        )
    
    @staticmethod
    def unexpected_error() -> str:
        return (
            "⚠️ Мне жаль, но вы столкнулись с непредвиденной ошибкой.\n"
            "Сообщите в поддержку: /support"
        )
