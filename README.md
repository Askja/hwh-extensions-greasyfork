# HWH Extensions для Hero Wars

Набор userscript-ов для браузерной версии Hero Wars. Скрипты автоматизируют рутину,
но не принимают молча опасные решения: расходы ограничиваются настройками и резервами,
а результат каждого запуска выводится в отчёте.

Поддерживаются `hero-wars.com`, `hero-wars.cn` и Facebook Canvas-версия игры. Для установки нужен
Tampermonkey или другой совместимый менеджер userscript-ов.

## Скрипты

| Скрипт                  | Что делает                                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **HWH AutoFarmer**      | Планирует и фармит экипировку героев, расходует энергию по заданным правилам, покупает предметы в магазинах, крафтит и повышает ранги. |
| **HWH Titan Trainer**   | Прокачивает уровни, облики и артефакты выбранных титанов с персональными лимитами, резервами и очередью.                               |
| **HWH Shop Vacuum**     | Покупает выбранные товары, обменивает души и продаёт лишние фрагменты с учётом резервов.                                               |
| **HWH Hero Manager**    | Управляет очередью и модулями прокачки героев.                                                                                         |
| **HWH Season Runner**   | Планирует задания сезонных пропусков и выполняет разрешённые действия с резервами ресурсов.                                            |
| **HWH Rewards Manager** | Собирает выбранные награды из почты, заданий, событий и пропусков.                                                                     |
| **HWH Battle Lab**      | Считает бои, сравнивает составы и сохраняет локальную историю расчётов.                                                                |

## Каналы и варианты

- **Stable** — основной вариант для ежедневного использования.
- **Lite** — облегчённая сборка без Vue, тем, анимаций и игровой графики.

Stable и Lite одного продукта устанавливаются как разные scripts. Одновременно
включать несколько вариантов одного продукта нельзя: два фермера не становятся умнее,
они просто начинают наперегонки тратить ресурсы.

## Артефакты для синхронизации GreasyFork

Публичное зеркало содержит читаемые неминифицированные сборки. URL ниже предназначены
для поля **Sync code from URL** при создании или редактировании страницы скрипта.

| Страница GreasyFork      | Канал  | URL исходника для синхронизации                                                                        |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------------------ |
| HWH AutoFarmer           | Stable | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhauto.user.js`               |
| HWH AutoFarmer Lite      | Lite   | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhauto-lite.user.js`          |
| HWH Titan Trainer        | Stable | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhtitanartifact.user.js`      |
| HWH Titan Trainer Lite   | Lite   | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhtitanartifact-lite.user.js` |
| HWH Shop Vacuum          | Stable | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhvacuum.user.js`             |
| HWH Shop Vacuum Lite     | Lite   | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhvacuum-lite.user.js`        |
| HWH Hero Manager         | Stable | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhheromanager.user.js`        |
| HWH Hero Manager Lite    | Lite   | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhheromanager-lite.user.js`   |
| HWH Season Runner        | Stable | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhseason.user.js`             |
| HWH Rewards Manager      | Stable | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhrewards.user.js`            |
| HWH Rewards Manager Lite | Lite   | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhrewards-lite.user.js`       |
| HWH Battle Lab           | Stable | `https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhbattlelab.user.js`          |

GreasyFork при публикации заменяет `@updateURL` и `@downloadURL` своими адресами, поэтому
установленная оттуда версия дальше обновляется через GreasyFork.

## Что указать в описании страницы

Для каждого скрипта достаточно взять соответствующее описание из таблицы выше и добавить:

> Работает в браузерной версии Hero Wars. Все расходы ограничиваются настройками скрипта.
> После запуска показывается подробный результат. Настройки хранятся локально в браузере.

Для Lite укажи, что в нём сознательно
нет тяжёлой графики и части визуальных возможностей. Название и описание на английском уже
записаны в `@name:en` и `@description:en` каждого артефакта.

## Публикационный чек-лист

1. Выполнить `bun run build:greasyfork`.
2. Убедиться, что каждый файл в `dist-greasyfork/` меньше 2 МБ.
3. Отправить изменения в `main` и дождаться workflow **Синхронизация GreasyFork**.
4. На GreasyFork создать отдельную страницу для каждого URL из таблицы.
5. Включить синхронизацию кода по raw URL и проверить, что GreasyFork принял новую версию.
6. Для немедленной синхронизации настроить в публичном репозитории GitHub вебхук GreasyFork: `push`, `application/json`, проверка TLS и секрет из авторского аккаунта GreasyFork.
7. Не вставлять в описание призывы устанавливать скрипт с другого сайта — это нарушает
   правила площадки. Ссылки на документацию и поддержку разрешены.

Сборка `build:greasyfork` специально отключает минификацию JavaScript, сжатие имён и
компактизацию ключей локализации. Обычный `dist/` предназначен для сайта и GitHub Release,
а не для загрузки на GreasyFork.

## Безопасность и данные

- Каждый скрипт использует `@grant none` и работает в контексте страницы игры.
- Настройки и локальная история остаются в браузере.
- Скрипты обращаются к игровому API от имени уже открытой игровой сессии.
- Перед первым автоматическим запуском стоит проверить резервы, лимиты и выбранные цели.

## Документация и поддержка

- Документация: <https://ext-askja.zingery.ru>
- Зеркало документации: <https://hwhx-askja.h0w.top/>
- Telegram-сообщество: <https://t.me/+ppLK1qqObB43NjMy>

## Правила GreasyFork

- [Требования к публикуемому коду](https://greasyfork.org/en/help/code-rules)
- [Поддерживаемые meta-ключи](https://greasyfork.org/en/help/meta-keys)
- [Как GreasyFork переписывает userscript](https://greasyfork.org/en/help/rewriting)

Лицензия скриптов: MIT.
