from models import Publ


class Messages:
    # ========== START MESSAGE ========== #

    @staticmethod
    def start(first_name: str) -> str:
        return (
            f"Здравствуйте, {first_name}\n"
            "Я - телеграм-бот проекта "
            '<a href="https://vk.com/data_web">Паутина данных</a>, '
            "очень рад, что Вы им заинтересовались. "
            "С удовольствием зарегистрирую вас как нового участника "
            "и дам пароль для входа на "
            '<a href="https://faunistica.ru/">наш сайт научного волонтерства</a>.\n\n'
            "Если хотите начать регистрацию, вызовите /register.\n"
            "Если хотите ознакомиться со списком команд, вызовите /menu."
        )

    # ========== REGISTER MESSAGE ========== #

    @staticmethod
    def registration_start() -> str:
        return (
            "Давайте начнем регистрацию!\n\n"
            "Напоминаем, что регистрироваться и участвовать в нашем проекте "
            "могут совершеннолетние.\n"
            "Несовершеннолетние от 14 до 18 лет тоже могут участвовать, "
            "но должны регистрироваться с согласия и в присутствии родителей.\n\n"
            '<a href="https://sozontov.cc/user_agreement">'
            "Пользовательское соглашение</a> принимаете?\n(да/нет)"
        )

    @staticmethod
    def already_registered(first_name: str) -> str:
        return f"Вы уже зарегистрированы под именем {first_name}!"

    @staticmethod
    def old_user(first_name: str) -> str:
        return (
            f"Привет, {first_name}!\n"
            "Странно... Помню ваше имя, но все остальные данные "
            "как-будто кто-то обнулил 😅\n\n"
            "Чтобы я снова вспомнил вас, попрошу пройти регистрацию снова. "
            "Начнем прямо сейчас!"
        )

    @staticmethod
    def started_registered() -> str:
        return (
            "Я так и не познакомился с вами 😭. "
            "Вернитесь к процессу регистрации с помощью команды /register"
        )

    @staticmethod
    def consent_taken() -> str:
        return "Ваше согласие учтено 👌"

    @staticmethod
    def maybe_later() -> str:
        return "Ничего, может быть позже... 😌"

    @staticmethod
    def ask_name() -> str:
        return "Пожалуйста, напишите как мне к вам обращаться 🙃"

    @staticmethod
    def registration_complete() -> str:
        return (
            "Спасибо за ответ, ваша регистрация закончена!\n\n"
            "В дальнейшем вы можете изменить имя командой /rename\n\n"
            "Также будет очень любезно с вашей стороны пройти небольшой опрос. "
            "Он поможет понять социологию и мотивацию участников-волонтёров. "
            'Для того, чтобы начать его, напишите "Опрос" или нажмите на /sociology'
        )

    @staticmethod
    def name_already_exists() -> str:
        return (
            "Ой-ой... кто-то уже выбрал такое имя 🥺\n\n"
            "Попробуйте добавить фамилию, цифру или любимое животное."
        )

    @staticmethod
    def no_publication() -> str:
        return (
            "К сожалению, публикаций для выбранного языка пока нет. "
            "Я уже созваниваюсь с разработчиками, чтобы это исправить 🥺"
        )

    @staticmethod
    def not_registered() -> str:
        return (
            "Увы, вас пока нет среди зарегистрированных пользователей.\n"
            "Желаете зарегистрироваться?\n"
            "/register ← Нажмите сюда"
        )

    @staticmethod
    def greeting(name: str) -> str:
        return f"Приятно познакомиться, {name}! 🤗"

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

    # ========== AUTH MESSAGE ========== #

    @staticmethod
    def auth_success() -> str:
        return (
            "<b>Вы успешно авторизованы!</b>\n"
            "Уже готовлю новый пароль специально для вас! 🤭"
        )

    @staticmethod
    def no_publications_left() -> str:
        return (
            "Ой-ой... ваша очередь публикаций подошла к концу.\n"
            "Я уже в курсе и работаю над этим изо всех своих цифровых сил 🥺"
        )

    @staticmethod
    def current_publication(publ_info: Publ) -> str:
        return (
            f"<b>Ваша текущая публикация</b>\n\n"
            f"Статья: {publ_info.name}\n"
            f"Автор(ы): {publ_info.author}\n\n"
            f'<a href="https://faunistica.ru/files/{publ_info.pdf_file}">'
            "Ссылка на статью</a>\n\n"
            "Пожалуйста, не забудьте ознакомиться с инструкцией: "
            '<a href="https://faunistica.ru/instruction/">веб-страница</a>'
        )

    @staticmethod
    def new_password(temp: str, username: str) -> str:
        return (
            "Ваш **новый пароль** для [сервиса](https://faunistica.ru/) 🥳\n\n"
            f"P.S. ваш никнейм 🤫: {username}\n\n"
            "Действует бессрочно (пока не забудете):\n"
            f"```{temp}```"
        )

    # ========== NEXT PUBLICATION MESSAGE ========== #
    @staticmethod
    def not_finished_publ(name: str) -> str:
        return (
            f"Простите, {name}, боюсь вы ещё не закончили с текущей публикацией ☹️\n"
            "Как только закончите с ней, возвращайтесь ко мне!\n\n"
            "Если вы считаете, что произошла ошибка, напишите в поддержку /support, "
            "указав название текущей статьи."
        )

    @staticmethod
    def accept_next_publ() -> str:
        return (
            "Уже приготовил для вас новую публикацию! 😋\n\n"
            "Скорее знакомьтесь с ней с помощью /auth"
        )

    @staticmethod
    def not_authorization() -> str:
        return "Для начала вызовите /auth, а потом возвращайтесь. Жду с нетерпением! 🥹"

    # ========== RENAME MESSAGE ========== #

    @staticmethod
    def rename_prompt() -> str:
        return (
            "Понял, вы хотите изменить имя, указанное при регистрации. "
            "Введите новый вариант, пожалуйста.\n👇👇👇 "
        )

    @staticmethod
    def rename_success(name: str) -> str:
        return f"Классный выбор! Приятно познакомиться, {name}! 🤗"

    @staticmethod
    def same_name(name: str) -> str:
        return f"Извините, но у вас уже установлено имя {name}"

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

    # ========== STATS MESSAGE ========== #

    @staticmethod
    def statistics(general_stats: dict, personal_stats: dict | None = None) -> str:
        stats_text = (
            "<b>Общая статистика: </b>\n\n"
            f"Всего зарегистрированных участников: {general_stats['total_users']} "
            f"Средний возраст участника: {general_stats['avg_age']} "
            f"Всего публикаций на очереди в оцифровку: {general_stats['total_publs']}, "
            f"из них на русском языке {general_stats['rus_publs']}, "
            f"на английском языке {general_stats['eng_publs']}.\n"
            f"Всего записей внесено волонтерами: {general_stats['rec_ok']}. "
            f"На одну успешную запись приходится {general_stats['rec_fail_ratio']} "
            f"неудачных попыток, а также {general_stats['check_ratio']} проверок. "
            f"Эти записи содержат информацию о {general_stats['species_count']} видах, "
            f"относящихся к {general_stats['families_count']} семействам.\n"
            "Это очень хорошая статистика! Надеемся, ваш вклад ее улучшит ^_^ "
        )

        if personal_stats is not None:
            stats_text += (
                "\n\n<b>Персональная статистика:</b>\n"
                f"Вы полностью обработали "
                f"{personal_stats['processed_publs']} публикаций, "
                "в процессе обработки: 1 публикация. "
                f"Вы внесли {personal_stats['rec_ok']} записей.\n"
                f"На каждую успешную запись приходится "
                f"{personal_stats['check_ratio']} проверок.\n"
                f"Вашими стараниями в базе оказалось "
                f"{personal_stats['species_count']} видов.\n"
                f"Чаще всего вы встречали вид: "
                f"<i>{personal_stats['most_common_species']}</i>\n"
                "Это очень хорошая статистика! "
                "Надеемся, вы сможете сделать ещё лучше ^_^ "
            )

        return stats_text

    # ========== SOCIOLOGY MESSAGE ========== #

    @staticmethod
    def any_question(missing_fields: list) -> str:
        return f"Для вас имеется вопросов: <b>{len(missing_fields)}</b>"

    @staticmethod
    def go_back_to_sociology() -> str:
        return "Вернуться к ответам на вопросы вы можете по команде /sociology"

    @staticmethod
    def not_email() -> str:
        return "Вы уверены, что это email? Я вот не очень 🙃"

    @staticmethod
    def ask_age() -> str:
        return "Пожалуйста, укажите ваш возраст (цифрой)."

    @staticmethod
    def ask_publication_preferences() -> str:
        return (
            "Какие публикации вы хотели бы получать и в каком порядке?\n"
            "Быть может у вас есть какие-то предпочтения по региону, "
            "автору или семейству? "
            "По сложности, объему, по наличию описаний новых для науки видов? "
            "Сообщите о них и мы постараемся это учесть.\n\n"
            "В противном случае напишите случайную цифру от 0 до 9 "
            "и мы поймём, что вы предпочитаете сюрпризы🥳"
        )

    @staticmethod
    def ask_language() -> str:
        return (
            "Значительная часть публикаций написана на английском языке. "
            "Вы владеете им и готовы обрабатывать такие публикации?\n\n"
            "Ответьте цифрой, пожалуйста (1/2/3):\n"
            "1 - Владею, хочу получать публикации на обоих языках\n"
            "2 - Владею, хочу получать публикации только на английском языке\n"
            "3 - Не владею, хочу получать публикации только на русском языке\n"
        )

    @staticmethod
    def age_too_high() -> str:
        return (
            "??? Вы не шутите? "
            "Старейший человек на Земле это "
            "[Мария Браньяс Морера](https://www.fontanka.ru/2023/01/26/72007319). "
            "Если вы не она, то введите корректный возраст, пожалуйста\n☺️"
        )

    @staticmethod
    def age_accepted() -> str:
        return "Возраст учтен, спасибо!"

    @staticmethod
    def region_accepted() -> str:
        return "Ваш регион учтен, спасибо!"

    @staticmethod
    def email_accepted() -> str:
        return "Теперь знаю кому писать смски (шучу), спасибо!"

    @staticmethod
    def publication_preferences_accepted(preferences: str) -> str:
        return f"Вы указали следующие пожелания: {preferences}"

    @staticmethod
    def language_selection_accepted() -> str:
        return (
            "Спасибо за ответ!\n"
            "Все следующие публикации будут выданы с учетом вашего выбора"
        )

    @staticmethod
    def sociology_question(question_num: int) -> str:
        questions = {
            1: "Укажите ваш пол, пожалуйста (мужской/женский)",
            2: "Согласны ли вы на отображение вашего имени "
            "в публичной таблице рейтинга?",
        }
        return questions.get(question_num, "Вопрос не найден 😱")

    @staticmethod
    def sociology_completed() -> str:
        return (
            "Вы ответили на все имеющиеся вопросы! Спасибо вам!\n\n "
            "Возможно, позже появятся новые. \nОставайтесь с нами!"
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
    def available_log_dates(dates: set) -> str:
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
            "<b>/register</b> — поможет зарегистрироваться, "
            "чтобы получить доступ к нашему сервису 🕸\n"
            "<b>/auth</b> — если вы ещё не получили пароль и статью "
            "(или забыли), жмите, но только после регистрации 🔒\n"
            "<b>/next_publ</b> — если вы очень уверены в том, что оцифровали "
            "текущую публикацию, дадим новую 😇\n"
            "<b>/sociology</b> — небольшой опросник, "
            "который поможет нам побольше познакомиться 🕷\n"
            "<b>/stats</b> — если хотите посмотреть статистику проекта, "
            "ну и собственную, конечно же 📈\n"
            "<b>/rename</b> — хотите, чтобы я обращался к вам по-другому? Жмите! ↺\n"
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
    def support_call_not_finished() -> str:
        return (
            "Вы начали обращение в поддержку 🙌. "
            "Пожалуйста, завершите его или отмените командой /cancel"
        )

    @staticmethod
    def sociology_not_finished() -> str:
        return (
            "Вы не закончили прохождение опроса 🙁. "
            "Пожалуйста, завершите его или отмените командой /cancel"
        )

    @staticmethod
    def registration_not_finished() -> str:
        return (
            "Извините, но вы не завершили начатую ранее регистрацию 👉🏻👈🏻\n"
            "Может вернемся к этому?"
        )

    @staticmethod
    def message_too_short() -> str:
        return "Ответ слишком короткий, не могу такое принять 🙁"

    @staticmethod
    def message_too_long() -> str:
        return "У меня плохая память, я точно не смогу запомнить такой длинный ответ 🫣"

    @staticmethod
    def invalid_characters() -> str:
        return (
            "В ответе содержатся недопустимые символы, "
            "пожалуйста, используйте только буквы русского и латинского "
            "алфавита и цифры 🚫"
        )

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
    def started_unidentified_action() -> str:
        return (
            "Вы начали и не закончили какое-то другое действие. "
            "Завершите это действие, пожалуйста, или отмените "
            "его с помощью команды /cancel"
        )

    @staticmethod
    def gratitude() -> str:
        return "Спасибо за ответ!"

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
            "Я помню, что вы уже знаете меня, но попрошу выполнить команду /register"
        )

    @staticmethod
    def unexpected_error() -> str:
        return (
            "⚠️ Мне жаль, но вы столкнулись с непредвиденной ошибкой.\n"
            "Сообщите в поддержку: /support"
        )
