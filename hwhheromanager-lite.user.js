// ==UserScript==
// @name           HWH Hero Manager Lite
// @name:en        HWH Hero Manager Lite
// @namespace      http://tampermonkey.net/
// @version        1.1.191-lite.1
// @homepage       https://ext-askja.zingery.ru
// @updateURL      https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhheromanager-lite.meta.js
// @downloadURL    https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhheromanager-lite.user.js
// @supportURL     https://t.me/+ppLK1qqObB43NjMy
// @description    Облегчённый менеджер героев: без Vue, тяжёлой графики и фризов при перестановке очередей.
// @description:en Lightweight Hero Manager without Vue, heavy artwork, or laggy queue reordering.
// @author         Askja
// @match          https://www.hero-wars.com/*
// @match          https://www.hero-wars.cn/*
// @match          https://apps-1701433570146040.apps.fbsbx.com/*
// @icon           https://ext-askja.zingery.ru/script-icons/heroManager.webp
// @grant          none
// @license        MIT
// ==/UserScript==
/*
 * Читаемая сборка для GreasyFork: минификация кода и сжатие имён отключены.
 * Встроенные сторонние runtime-библиотеки: отсутствуют.
 */
(function() {
	//#region src/shared/normalize.ts
	/**
	* Разбирает текстовое значение как число, заменяя запятую на точку и убирая мусор.
	*/
	function parseNumberInputText(value, fallbackValue = 0) {
		if (value == null) return fallbackValue;
		const rawText = String(value !== null && value !== void 0 ? value : "").trim();
		if (!rawText) return 0;
		const normalizedText = rawText.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
		const isNegative = normalizedText.startsWith("-");
		const [wholePart = "", ...fractionParts] = normalizedText.replaceAll("-", "").split(".");
		const numericText = `${isNegative ? "-" : ""}${wholePart}${fractionParts.length > 0 ? `.${fractionParts.join("")}` : ""}`;
		const numericValue = Number(numericText);
		return Number.isFinite(numericValue) ? numericValue : fallbackValue;
	}
	/**
	* Приводит значение к числу, обрезая по minValue/maxValue.
	*/
	function normalizeNumber$1(value, { minValue = Number.NEGATIVE_INFINITY, maxValue = Number.POSITIVE_INFINITY, fallbackValue = 0 } = {}) {
		const numericValue = parseNumberInputText(value, fallbackValue);
		if (!Number.isFinite(numericValue)) return fallbackValue;
		return Math.min(Math.max(numericValue, minValue), maxValue);
	}
	/**
	* Приводит значение к неотрицательному числу.
	*/
	function normalizeNonNegativeNumber(value, fallbackValue = 0) {
		return normalizeNumber$1(value, {
			minValue: 0,
			fallbackValue
		});
	}
	/**
	* Приводит значение к неотрицательному целому числу.
	*/
	function normalizeNonNegativeInteger(value, fallbackValue = 0) {
		return Math.trunc(normalizeNonNegativeNumber(value, fallbackValue));
	}
	/**
	* Приводит значение к булевому: true/false/1/«1»/«true» и обратные варианты.
	*/
	function normalizeBoolean$1(value, fallbackValue = false) {
		if (value === true || value === 1 || value === "1" || value === "true") return true;
		if (value === false || value === 0 || value === "0" || value === "false") return false;
		return !!fallbackValue;
	}
	/**
	* Проверяет, является ли значение простым объектом (не null, не массив).
	*/
	function isPlainObject(value) {
		return value !== null && typeof value === "object" && !Array.isArray(value);
	}
	/**
	* Приводит значение к простому объекту, для остального возвращает пустую запись.
	* Заменяет самодельные `getPlainRecord`/`toRecord`, которые каждый скрипт писал сам.
	*/
	function asPlainRecord$2(value) {
		return isPlainObject(value) ? value : {};
	}
	/**
	* Вариант для грязного runtime игры, где массив тоже используется как запись:
	* проверяется только `typeof === "object"`.
	*/
	function asObjectRecord(value) {
		return value !== null && typeof value === "object" ? value : {};
	}
	/**
	* Читает поле по ключу из значения неизвестной формы. Массив тоже считается
	* контейнером: игровые данные часто приходят списком там, где ожидался словарь.
	*/
	function getRecordValue(container, key) {
		return asObjectRecord(container)[String(key)];
	}
	/**
	* Nullable-вариант: часть runtime-кода отличает «не запись» от «пустая запись».
	*/
	function asRecordOrNull(value) {
		return value !== null && typeof value === "object" ? value : null;
	}
	/**
	* Проверка «объект в широком смысле»: массив тоже считается записью.
	* Нужна там, где игровой runtime отдаёт список под видом словаря.
	*/
	function isObjectLike(value) {
		return value !== null && typeof value === "object";
	}
	/**
	* Nullable-вариант с исключением массивов: «это точно словарь или ничего».
	*/
	function asPlainRecordOrNull(value) {
		return isPlainObject(value) ? value : null;
	}
	//#endregion
	//#region src/shared/storage/browser-storage.ts
	function getBrowserLocalStorage() {
		try {
			var _globalThis$localStor;
			return (_globalThis$localStor = globalThis.localStorage) !== null && _globalThis$localStor !== void 0 ? _globalThis$localStor : null;
		} catch (_unused) {
			return null;
		}
	}
	function warnBrowserStorageError(message, error) {
		console.warn(message, error);
	}
	function createBrowserStorageNamespace(prefix, storage = getBrowserLocalStorage()) {
		return {
			clear() {
				try {
					if (!storage) return;
					for (let index = storage.length - 1; index >= 0; index--) {
						const key = storage.key(index);
						if (key === null || key === void 0 ? void 0 : key.startsWith(prefix)) storage.removeItem(key);
					}
				} catch (_unused2) {}
			},
			getItem(key) {
				try {
					var _storage$getItem;
					return (_storage$getItem = storage === null || storage === void 0 ? void 0 : storage.getItem(`${prefix}${key}`)) !== null && _storage$getItem !== void 0 ? _storage$getItem : null;
				} catch (_unused3) {
					return null;
				}
			},
			keys() {
				const keys = [];
				try {
					if (!storage) return keys;
					for (let index = 0; index < storage.length; index++) {
						const key = storage.key(index);
						if (key === null || key === void 0 ? void 0 : key.startsWith(prefix)) keys.push(key.slice(prefix.length));
					}
				} catch (_unused4) {
					return keys;
				}
				return keys;
			},
			removeItem(key) {
				try {
					storage === null || storage === void 0 || storage.removeItem(`${prefix}${key}`);
				} catch (_unused5) {}
			},
			setItem(key, value) {
				try {
					if (!storage) return false;
					storage.setItem(`${prefix}${key}`, value);
					return true;
				} catch (_unused6) {
					return false;
				}
			}
		};
	}
	//#endregion
	//#region src/shared/dom.ts
	var sharedUiLanguageCache = /* @__PURE__ */ new Map();
	function escapeHtml(value) {
		return String(value !== null && value !== void 0 ? value : "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#39;");
	}
	function getSharedUiLanguage(defaultLanguage = "en") {
		var _globalThis$document$, _globalThis$document, _globalThis$navigator, _globalThis$navigator2, _globalThis$HWHFuncs, _globalThis$HWHFuncs$;
		const cachedLanguage = sharedUiLanguageCache.get(defaultLanguage);
		if (cachedLanguage) return cachedLanguage;
		const documentLanguage = String((_globalThis$document$ = (_globalThis$document = globalThis.document) === null || _globalThis$document === void 0 || (_globalThis$document = _globalThis$document.documentElement) === null || _globalThis$document === void 0 ? void 0 : _globalThis$document.lang) !== null && _globalThis$document$ !== void 0 ? _globalThis$document$ : "").toLowerCase().trim();
		const navigatorLanguages = [...Array.isArray((_globalThis$navigator = globalThis.navigator) === null || _globalThis$navigator === void 0 ? void 0 : _globalThis$navigator.languages) ? globalThis.navigator.languages : [], (_globalThis$navigator2 = globalThis.navigator) === null || _globalThis$navigator2 === void 0 ? void 0 : _globalThis$navigator2.language].map((language) => String(language !== null && language !== void 0 ? language : "").toLowerCase().trim()).filter(Boolean);
		const okText = typeof ((_globalThis$HWHFuncs = globalThis.HWHFuncs) === null || _globalThis$HWHFuncs === void 0 ? void 0 : _globalThis$HWHFuncs.I18N) === "function" ? String((_globalThis$HWHFuncs$ = globalThis.HWHFuncs.I18N("AF_COMMON_OK")) !== null && _globalThis$HWHFuncs$ !== void 0 ? _globalThis$HWHFuncs$ : "") : "";
		if (documentLanguage.startsWith("ru") || navigatorLanguages.some((lang) => lang.startsWith("ru")) || okText.trim().toLowerCase() === "ок") {
			sharedUiLanguageCache.set(defaultLanguage, "ru");
			return "ru";
		}
		if (documentLanguage.startsWith("en") || navigatorLanguages.some((lang) => lang.startsWith("en")) || okText.trim().toLowerCase() === "ok") {
			sharedUiLanguageCache.set(defaultLanguage, "en");
			return "en";
		}
		sharedUiLanguageCache.set(defaultLanguage, defaultLanguage);
		return defaultLanguage;
	}
	var SHARED_STYLE_CACHE_KEY = "injectedStyleCacheV1";
	var localInjectedStyleCache = /* @__PURE__ */ new Map();
	function getInjectedStyleCache() {
		const sharedUi = globalThis.HWHSharedUI && typeof globalThis.HWHSharedUI === "object" ? globalThis.HWHSharedUI : globalThis.HWHSharedUI = {};
		const sharedCache = sharedUi[SHARED_STYLE_CACHE_KEY];
		if (sharedCache instanceof Map) return sharedCache;
		sharedUi[SHARED_STYLE_CACHE_KEY] = localInjectedStyleCache;
		return localInjectedStyleCache;
	}
	function injectStyle(styleId, cssText) {
		var _document$head;
		const existingStyleElement = document.getElementById(styleId);
		const injectedStyleCache = getInjectedStyleCache();
		const cachedStyle = injectedStyleCache.get(styleId);
		if ((cachedStyle === null || cachedStyle === void 0 ? void 0 : cachedStyle.source) === cssText && existingStyleElement === cachedStyle.element) return;
		if ((existingStyleElement === null || existingStyleElement === void 0 ? void 0 : existingStyleElement.tagName) === "STYLE") {
			if (existingStyleElement.textContent !== cssText) existingStyleElement.textContent = cssText;
			injectedStyleCache.set(styleId, {
				source: cssText,
				normalized: cssText,
				element: existingStyleElement
			});
			return;
		}
		const styleElement = document.createElement("style");
		styleElement.id = styleId;
		styleElement.textContent = cssText;
		((_document$head = document.head) !== null && _document$head !== void 0 ? _document$head : document.documentElement).appendChild(styleElement);
		injectedStyleCache.set(styleId, {
			source: cssText,
			normalized: cssText,
			element: styleElement
		});
	}
	/**
	* Чистит внутренний HTML от скриптов, обработчиков и javascript:-ссылок.
	* Единая реализация для native- и Vue-путей: раньше её копировали в каждый рендерер.
	*/
	function sanitizeInternalHtml(content) {
		return String(content !== null && content !== void 0 ? content : "").replace(/<(script|style|iframe|object|embed|link|meta)\b[\s\S]*?<\/\1>/gi, "").replace(/<(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "").replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/\s+(href|src|xlink:href)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "");
	}
	//#endregion
	//#region src/shared/ui/lite/styles.ts
	var LITE_STYLE_ID = "hwhx-shared-ui-lite-style";
	var LITE_CSS = `.hwhx-build-lite.hwhx-modal {
  z-index: 10000;
  color: #eee;
  box-sizing: border-box;
  background: #000000b8;
  justify-content: center;
  align-items: center;
  padding: 8px;
  font: 14px / 1.35 Arial, sans-serif;
  display: flex;
  position: fixed;
  inset: 0;
}

.hwhx-build-lite.hwhx-modal .hwhx-modal__dialog {
  color: #eee;
  box-sizing: border-box;
  background: #181818;
  border: 1px solid #777;
  border-radius: 3px;
  flex-direction: column;
  align-items: stretch;
  display: flex;
  position: relative;
  overflow: hidden;
  width: min(1040px, 100vw - 16px) !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: calc(100vh - 16px) !important;
}

.hwhx-build-lite.hwhx-modal[data-hwhx-modal-kind="hero-selection"] .hwhx-modal__dialog, .hwhx-build-lite.hwhx-modal[data-hwhx-modal-kind="tier-selection"] .hwhx-modal__dialog {
  width: min(1160px, 100vw - 16px) !important;
}

.hwhx-build-lite.hwhx-modal .hwhx-modal__header {
  box-sizing: border-box;
  background: #222;
  border-bottom: 1px solid #555;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 7px 10px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-modal__identity, .hwhx-build-lite.hwhx-modal .hwhx-modal__brand, .hwhx-build-lite.hwhx-modal .hwhx-modal__meta, .hwhx-build-lite.hwhx-modal .hwhx-modal__toolbar, .hwhx-build-lite.hwhx-modal .hwhx-button-group, .hwhx-build-lite.hwhx-modal .hwhx-icon-label {
  align-items: center;
  gap: 7px;
  min-width: 0;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-avatar-group {
  align-items: center;
  display: inline-flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-avatar {
  color: #fff;
  box-sizing: border-box;
  background: #354b3b;
  border: 1px solid #777;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
  width: 26px;
  height: 26px;
  margin-left: -5px;
  font: 800 12px / 1 Arial, sans-serif;
  text-decoration: none;
  display: inline-flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-avatar:first-child {
  margin-left: 0;
}

.hwhx-build-lite.hwhx-modal .hwhx-avatar--helper {
  background: #30485d;
}

.hwhx-build-lite.hwhx-modal .hwhx-modal__title {
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 700;
  overflow: hidden;
}

.hwhx-build-lite.hwhx-modal .hwhx-modal__body {
  scrollbar-gutter: stable;
  box-sizing: border-box;
  align-self: stretch;
  min-width: 0;
  min-height: 0;
  max-height: calc(100vh - 116px);
  padding: 10px;
  flex: 0 auto !important;
  width: 100% !important;
  overflow: hidden scroll !important;
}

.hwhx-build-lite.hwhx-modal .hwhx-modal__body > .hwhx-native-body, .hwhx-build-lite.hwhx-modal .hwhx-modal__body > .hwhx-popup, .hwhx-build-lite.hwhx-modal .hwhx-hwhauto-managed-popup-panel, .hwhx-build-lite.hwhx-modal .hwhx-hwhauto-managed-popup-panel__body, .hwhx-build-lite.hwhx-modal .hwhx-settings-summary, .hwhx-build-lite.hwhx-modal .hwhx-settings-summary__scroll, .hwhx-build-lite.hwhx-modal .hwhx-selection-body, .hwhx-build-lite.hwhx-modal .hwhx-selection-groups {
  box-sizing: border-box;
  align-self: stretch;
  width: 100% !important;
  min-width: 0 !important;
  max-width: none !important;
}

.hwhx-build-lite.hwhx-modal .hwhx-modal__actions {
  background: #202020;
  border-top: 1px solid #555;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-modal__actions-side {
  flex-wrap: wrap;
  gap: 6px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-button, .hwhx-build-lite.hwhx-modal button.hwhx-button, .hwhx-build-lite.hwhx-modal .hwhx-icon-button, .hwhx-build-lite.hwhx-modal .hwhx-custom-select__button, .hwhx-build-lite.hwhx-progress .hwhx-button, .hwhx-build-lite.hwhx-progress .hwhx-icon-button, .hwhx-build-lite.hwhx-toast-stack .hwhx-button {
  color: #eee;
  cursor: pointer;
  box-sizing: border-box;
  background: #292929;
  border: 1px solid #777;
  border-radius: 2px;
  min-height: 32px;
  margin: 0;
  padding: 5px 10px;
  font: 700 14px / 1.2 Arial, sans-serif;
}

.hwhx-build-lite.hwhx-modal .hwhx-button:hover, .hwhx-build-lite.hwhx-modal .hwhx-button:focus, .hwhx-build-lite.hwhx-modal .hwhx-icon-button:hover, .hwhx-build-lite.hwhx-modal .hwhx-custom-select__button:hover {
  background: #333;
  border-color: #bbb;
  outline: 1px solid #bbb;
}

.hwhx-build-lite.hwhx-modal .hwhx-button--icon-only {
  justify-content: center;
  width: 34px;
  min-width: 34px;
  max-width: 34px;
  padding: 5px;
}

.hwhx-build-lite.hwhx-modal .hwhx-button:disabled, .hwhx-build-lite.hwhx-modal .hwhx-button.is-disabled, .hwhx-build-lite.hwhx-modal .hwhx-icon-button:disabled {
  cursor: not-allowed;
  opacity: .55;
}

.hwhx-build-lite.hwhx-modal .hwhx-lite-glyph, .hwhx-build-lite.hwhx-progress .hwhx-lite-glyph, .hwhx-build-lite.hwhx-toast-stack .hwhx-lite-glyph {
  text-align: center;
  min-width: 1em;
  font: 700 14px / 1 Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif;
  display: inline-block;
}

.hwhx-build-lite.hwhx-modal .hwhx-field, .hwhx-build-lite.hwhx-modal .hwhx-input, .hwhx-build-lite.hwhx-modal .hwhx-number-input, .hwhx-build-lite.hwhx-modal input.hwhx-field, .hwhx-build-lite.hwhx-modal select.hwhx-field, .hwhx-build-lite.hwhx-modal textarea.hwhx-field {
  color: #eee;
  box-sizing: border-box;
  background: #111;
  border: 1px solid #777;
  border-radius: 2px;
  width: 100%;
  min-height: 32px;
  padding: 5px 8px;
  font: 14px / 1.2 Arial, sans-serif;
}

.hwhx-build-lite.hwhx-modal .hwhx-field:focus, .hwhx-build-lite.hwhx-modal .hwhx-input:focus {
  border-color: #ccc;
  outline: 1px solid #ccc;
}

.hwhx-build-lite.hwhx-modal .hwhx-settings-search, .hwhx-build-lite.hwhx-modal .hwhx-selection-head, .hwhx-build-lite.hwhx-modal .hwhx-search-toolbar {
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0 0 8px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-settings-search .hwhx-field, .hwhx-build-lite.hwhx-modal .hwhx-search-toolbar .hwhx-field {
  flex: auto;
}

.hwhx-build-lite.hwhx-modal .hwhx-hero-manager-lite__queue-toolbar {
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0 0 8px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-hero-manager-lite__queue-search {
  flex: auto;
  min-width: 0;
}

.hwhx-build-lite.hwhx-modal .hwhx-hero-manager-lite__queue-toolbar > .hwhx-button-group {
  flex: none;
}

.hwhx-build-lite.hwhx-modal .hwhx-settings-grid, .hwhx-build-lite.hwhx-modal .hwhx-selection-groups, .hwhx-build-lite.hwhx-modal .hwhx-stack, .hwhx-build-lite.hwhx-modal .hwhx-checkbox-list, .hwhx-build-lite.hwhx-modal .hwhx-native-checkboxes {
  box-sizing: border-box;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  width: 100%;
  min-width: 0;
  max-width: none;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-accordion {
  box-sizing: border-box;
  background: #1e1e1e;
  border: 1px solid #555;
  border-radius: 2px;
  flex: none;
  align-self: stretch;
  margin: 0 0 6px;
  padding: 0;
  display: block;
  overflow: hidden;
  inline-size: 100% !important;
  width: 100% !important;
  min-inline-size: 0 !important;
  max-inline-size: none !important;
}

.hwhx-build-lite.hwhx-modal .hwhx-accordion__summary {
  inline-size: 100%;
  color: #eee;
  cursor: pointer;
  box-sizing: border-box;
  background: #252525;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  min-height: 36px;
  padding: 7px 9px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-accordion__summary:focus {
  outline: 1px solid #aaa;
}

.hwhx-build-lite.hwhx-modal .hwhx-accordion__heading {
  flex: auto;
  align-items: center;
  gap: 7px;
  min-width: 0;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-accordion__title {
  text-overflow: ellipsis;
  min-width: 0;
  overflow: hidden;
}

.hwhx-build-lite.hwhx-modal .hwhx-accordion__arrow:empty:before {
  content: "+";
  font-weight: 700;
}

.hwhx-build-lite.hwhx-modal .hwhx-accordion[data-open="1"] > .hwhx-accordion__summary .hwhx-accordion__arrow:empty:before {
  content: "−";
}

.hwhx-build-lite.hwhx-modal .hwhx-accordion__body {
  inline-size: 100%;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 8px 9px;
}

.hwhx-build-lite.hwhx-modal .hwhx-accordion__body > * {
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
}

.hwhx-build-lite.hwhx-modal .hwhx-accordion--nested {
  margin: 0 0 5px;
}

.hwhx-build-lite.hwhx-modal .hwhx-checkbox-row, .hwhx-build-lite.hwhx-modal .hwhx-checkbox-list__item, .hwhx-build-lite.hwhx-modal .hwhx-custom-row {
  color: #eee;
  box-sizing: border-box;
  background: #202020;
  border: 1px solid #444;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  min-height: 32px;
  margin: 0;
  padding: 5px 7px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhrewards-settings__option {
  flex-direction: column;
  gap: 0;
  width: 100%;
  min-width: 0;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhrewards-settings__help {
  margin-left: auto;
}

.hwhx-build-lite.hwhx-modal .hwhrewards-settings__help-text {
  color: #bbb;
  background: #181818;
  border: 1px solid #444;
  border-top: 0;
  margin: 0;
  padding: 6px 9px;
  font-size: 12px;
  line-height: 1.35;
}

.hwhx-build-lite.hwhx-modal .hwhrewards-settings__help-text[hidden] {
  display: none;
}

.hwhx-build-lite.hwhx-modal .hwhx-checkbox-input {
  -webkit-appearance: none;
  appearance: none;
  outline-offset: 1px;
  box-sizing: border-box;
  cursor: pointer;
  outline: 1px solid #aaa;
  flex: 0 0 18px;
  justify-content: center;
  align-items: center;
  margin: 0;
  display: inline-flex;
  position: relative;
  opacity: 1 !important;
  background: #fff !important;
  border: 1px solid #000 !important;
  border-radius: 0 !important;
  width: 18px !important;
  height: 18px !important;
}

.hwhx-build-lite.hwhx-modal .hwhx-checkbox-input:checked {
  background: #fff !important;
  border-color: #000 !important;
}

.hwhx-build-lite.hwhx-modal .hwhx-checkbox-input:checked:after {
  content: "" !important;
  clip-path: polygon(14% 52%, 0 66%, 38% 100%, 100% 18%, 84% 4%, 35% 70%) !important;
  background: #000 !important;
  border: 0 !important;
  width: 12px !important;
  height: 12px !important;
  display: block !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
}

.hwhx-build-lite.hwhx-modal .hwhx-checkbox-input:focus-visible {
  outline-offset: 2px;
  outline: 2px solid #fff !important;
}

.hwhx-build-lite.hwhx-modal .hwhx-checkbox-input:disabled {
  cursor: not-allowed;
  opacity: .55 !important;
}

.hwhx-build-lite.hwhx-modal .hwhx-checkbox-label {
  flex: auto;
  align-items: center;
  min-width: 0;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-checkbox-list__toolbar, .hwhx-build-lite.hwhx-modal .hwhx-selection-modes, .hwhx-build-lite.hwhx-modal .hwhx-selection-mode, .hwhx-build-lite.hwhx-modal .hwhx-selection-mode__control {
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-custom-select {
  min-width: 0;
  position: relative;
}

.hwhx-build-lite.hwhx-modal .hwhx-custom-select__menu {
  z-index: 11000;
  color: #eee;
  background: #191919;
  border: 1px solid #888;
  max-height: 260px;
  position: fixed;
  overflow: auto;
}

.hwhx-build-lite.hwhx-modal .hwhx-custom-select__option {
  cursor: pointer;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 5px 8px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-custom-select__option:hover, .hwhx-build-lite.hwhx-modal .hwhx-custom-select__option.is-selected {
  background: #353535;
}

.hwhx-build-lite.hwhx-modal .hwhx-settings-row, .hwhx-build-lite.hwhx-modal .hwhx-settings-field, .hwhx-build-lite.hwhx-modal .hwhx-field-row {
  box-sizing: border-box;
  grid-template-columns: minmax(180px, 1fr) minmax(120px, auto);
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 0;
  display: grid;
}

.hwhx-build-lite.hwhx-modal .hwhx-settings-label, .hwhx-build-lite.hwhx-modal .hwhx-selection-label, .hwhx-build-lite.hwhx-modal .hwhx-selection-label__lead, .hwhx-build-lite.hwhx-modal .hwhx-selection-label__identity, .hwhx-build-lite.hwhx-modal .hwhx-selection-label__main {
  align-items: center;
  gap: 6px;
  min-width: 0;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-selection-label__identity {
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}

.hwhx-build-lite.hwhx-modal .hwhx-selection-label__details {
  color: #bbb;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-badges, .hwhx-build-lite.hwhx-modal .hwhx-selection-badges, .hwhx-build-lite.hwhx-modal .hwhx-token-list {
  align-items: center;
  gap: 5px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-badge, .hwhx-build-lite.hwhx-modal .hwhx-selection-badge, .hwhx-build-lite.hwhx-modal .hwhx-token, .hwhx-build-lite.hwhx-modal .hwhx-modal-badge {
  color: #ddd;
  background: #292929;
  border: 1px solid #666;
  border-radius: 2px;
  padding: 2px 6px;
  font-size: 12px;
}

.hwhx-build-lite.hwhx-modal .hwhx-data-table {
  border-collapse: collapse;
  color: #eee;
  width: 100%;
}

.hwhx-build-lite.hwhx-modal .hwhx-data-table th, .hwhx-build-lite.hwhx-modal .hwhx-data-table td {
  text-align: left;
  border: 1px solid #555;
  padding: 5px 7px;
}

.hwhx-build-lite.hwhx-modal .hwhx-panel, .hwhx-build-lite.hwhx-modal .hwhx-ui-panel, .hwhx-build-lite.hwhx-modal .hwhx-popup {
  color: #eee;
  box-sizing: border-box;
  background: #202020;
  border: 1px solid #555;
  border-radius: 2px;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
  min-width: 0;
  margin: 0 0 8px;
  padding: 9px 10px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-hero-manager-lite__control-group--inline {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px 10px;
  display: grid;
}

.hwhx-build-lite.hwhx-modal .hwhx-hero-manager-lite__control-group--inline > .hwhx-checkbox-row {
  background: none;
  border: 0;
  width: auto;
  min-width: 0;
  min-height: 32px;
  margin: 0;
  padding: 0;
}

.hwhx-build-lite.hwhx-modal .hwhx-hero-manager-lite__control-group--inline > .hwhx-field-row {
  width: auto;
  margin: 0;
  padding: 0;
  display: block;
}

.hwhx-build-lite.hwhx-modal .hwhx-hero-manager-lite__control-group--inline > .hwhx-field-row > .hwhx-settings-label {
  display: none;
}

.hwhx-build-lite.hwhx-modal .hwhx-hero-manager-lite__control-group--inline > .hwhx-field-row > .hwhx-number {
  width: 92px;
}

.hwhx-build-lite.hwhx-modal .hwhx-popup > .hwhx-panel:last-child, .hwhx-build-lite.hwhx-modal .hwhx-popup > .hwhx-ui-panel:last-child, .hwhx-build-lite.hwhx-modal .hwhx-panel:last-child, .hwhx-build-lite.hwhx-modal .hwhx-ui-panel:last-child {
  margin-bottom: 0;
}

.hwhx-build-lite.hwhx-modal .hwhx-ui-panel__head {
  border-bottom: 1px solid #444;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding-bottom: 6px;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-ui-panel__title, .hwhx-build-lite.hwhx-modal .hwhx-ui-panel__actions {
  align-items: center;
  gap: 6px;
  min-width: 0;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-ui-panel__title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
}

.hwhx-build-lite.hwhx-modal .hwhx-ui-panel__description {
  color: #bbb;
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
}

.hwhx-build-lite.hwhx-modal .hwhx-ui-panel__body {
  flex-direction: column;
  gap: 7px;
  width: 100%;
  min-width: 0;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-ui-panel__body > p, .hwhx-build-lite.hwhx-modal .hwhx-popup > p {
  margin: 0;
  line-height: 1.4;
}

.hwhx-build-lite.hwhx-modal .hwhx-info-list {
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-info-list__row {
  box-sizing: border-box;
  background: #1b1b1b;
  border: 1px solid #444;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 7px 9px;
  display: grid;
}

.hwhx-build-lite.hwhx-modal .hwhx-info-list__label, .hwhx-build-lite.hwhx-modal .hwhx-info-list__value, .hwhx-build-lite.hwhx-modal .hwhx-info-line__label, .hwhx-build-lite.hwhx-modal .hwhx-info-line__value {
  align-items: center;
  gap: 6px;
  min-width: 0;
  line-height: 1.3;
  display: flex;
}

.hwhx-build-lite.hwhx-modal .hwhx-info-list__value, .hwhx-build-lite.hwhx-modal .hwhx-info-line__value {
  text-align: right;
  justify-content: flex-end;
  font-weight: 700;
}

.hwhx-build-lite.hwhx-modal .hwhx-form-row, .hwhx-build-lite.hwhx-modal .hwhx-info-line {
  box-sizing: border-box;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 5px 0;
  display: grid;
}

.hwhx-build-lite.hwhx-modal .hwhx-hint, .hwhx-build-lite.hwhx-modal .hwhx-note, .hwhx-build-lite.hwhx-modal .hwhx-empty-state {
  color: #ddd;
  box-sizing: border-box;
  background: #242424;
  border: 1px solid #666;
  width: 100%;
  margin: 0 0 8px;
  padding: 8px 9px;
  line-height: 1.4;
}

.hwhx-build-lite.hwhx-modal .hwhx-hint {
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px;
}

.hwhx-build-lite.hwhx-modal [class^="hwhx-"][class*="__icon"]:empty, .hwhx-build-lite.hwhx-modal [class*=" hwhx-"][class*="__icon"]:empty, .hwhx-build-lite.hwhx-modal .hwhx-modal__script-logo, .hwhx-build-lite.hwhx-modal .hwhx-modal__forum-link, .hwhx-build-lite.hwhx-modal .hwhx-brand-icon, .hwhx-build-lite.hwhx-modal .hwhx-help-button, .hwhx-build-lite.hwhx-modal .hwhx-motion-icon:empty {
  display: none !important;
}

.hwhx-build-lite.hwhx-modal .hwhx-empty-state, .hwhx-build-lite.hwhx-modal .hwhx-help-links-panel__card, .hwhx-build-lite.hwhx-modal .hwhx-link-list__item, .hwhx-build-lite.hwhx-modal .hwhx-release-card, .hwhx-build-lite.hwhx-modal .hwhx-daily-resource-metric {
  grid-template-columns: minmax(0, 1fr) !important;
}

.hwhx-build-lite.hwhx-progress {
  z-index: 10002;
  color: #eee;
  box-sizing: border-box;
  background: #181818;
  border: 1px solid #777;
  border-radius: 3px;
  flex-direction: column;
  gap: 7px;
  max-height: calc(100vh - 16px);
  padding: 9px;
  font: 14px / 1.35 Arial, sans-serif;
  display: none;
  position: fixed;
  overflow: auto;
  width: min(620px, 100vw - 16px) !important;
}

.hwhx-build-lite.hwhx-progress.is-visible {
  display: flex;
}

.hwhx-build-lite.hwhx-progress .hwhx-progress__header, .hwhx-build-lite.hwhx-progress .hwhx-progress__body, .hwhx-build-lite.hwhx-progress .hwhx-progress__content {
  min-width: 0;
}

.hwhx-build-lite.hwhx-progress .hwhx-progress__header {
  border-bottom: 1px solid #555;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding-bottom: 7px;
  display: grid;
}

.hwhx-build-lite.hwhx-progress .hwhx-progress__stage {
  color: #dff8e5;
  white-space: normal;
  background: #202923;
  border: 1px solid #5d826e;
  padding: 6px 8px;
  font-weight: 700;
}

.hwhx-build-lite.hwhx-progress .hwhx-progress__content {
  white-space: pre-line;
}

.hwhx-build-lite.hwhx-progress .hwhx-progress__title {
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;
}

.hwhx-build-lite.hwhx-progress .hwhx-progress__header-actions {
  align-items: center;
  gap: 6px;
  min-width: 0;
  display: flex;
}

.hwhx-build-lite.hwhx-progress .hwhx-status-badge {
  color: #ccc;
  white-space: nowrap;
  box-sizing: border-box;
  background: #242424;
  border: 1px solid #777;
  border-radius: 2px;
  align-items: center;
  min-height: 30px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
}

.hwhx-build-lite.hwhx-progress .hwhx-status-badge[data-tone="active"] {
  color: #a8d3fa;
  border-color: #6684a0;
}

.hwhx-build-lite.hwhx-progress .hwhx-status-badge[data-tone="success"] {
  color: #a8d9a8;
  border-color: #5d865d;
}

.hwhx-build-lite.hwhx-progress .hwhx-status-badge[data-tone="warning"] {
  color: #ead48f;
  border-color: #8e7a46;
}

.hwhx-build-lite.hwhx-progress .hwhx-status-badge[data-tone="danger"] {
  color: #efaaa6;
  border-color: #965b58;
}

.hwhx-build-lite.hwhx-progress[data-hwhx-progress-style="compact"] {
  width: min(360px, 100vw - 16px) !important;
}

.hwhx-build-lite.hwhx-progress[data-hwhx-progress-style="compact"] .hwhx-status-badge__label {
  font-size: 0;
}

.hwhx-build-lite.hwhx-progress[data-hwhx-progress-style="compact"] .hwhx-status-badge__label:before {
  content: "•";
  font-size: 18px;
  line-height: 1;
}

.hwhx-build-lite.hwhx-progress[data-hwhx-progress-style="dashboard"] {
  padding: 0;
  width: min(800px, 100vw - 16px) !important;
}

.hwhx-build-lite.hwhx-progress[data-hwhx-progress-style="dashboard"] .hwhx-progress__header {
  min-height: 46px;
  padding: 7px 9px;
}

.hwhx-build-lite.hwhx-progress[data-hwhx-progress-style="dashboard"] .hwhx-progress__body {
  padding: 9px;
}

.hwhx-build-lite[data-hwhx-progress-style="dashboard"] > .hwhx-progress__stage {
  margin: 9px 9px 0;
}

.hwhx-build-lite.hwhx-progress [class^="hwhx-"][class*="__icon"]:empty, .hwhx-build-lite.hwhx-progress [class*=" hwhx-"][class*="__icon"]:empty, .hwhx-build-lite.hwhx-progress .hwhx-progress__title-marker:empty {
  display: none !important;
}

.hwhx-build-lite.hwhx-progress .hwhx-result-message {
  grid-template-columns: minmax(0, 1fr) !important;
  min-height: 0 !important;
}

.hwhx-build-lite.hwhx-progress .hwhx-progress-bar {
  background: #111;
  border: 1px solid #666;
  height: 8px;
}

.hwhx-build-lite.hwhx-progress .hwhx-progress-bar__fill {
  background: #7abf7a;
  height: 100%;
}

.hwhx-build-lite.hwhx-toast-stack {
  z-index: 12000;
  flex-direction: column;
  gap: 5px;
  width: min(340px, 100vw - 16px);
  font: 14px / 1.35 Arial, sans-serif;
  display: flex;
  position: fixed;
  top: 8px;
  right: 8px;
}

.hwhx-build-lite.hwhx-toast-stack .hwhx-toast {
  color: #eee;
  box-sizing: border-box;
  background: #202020;
  border: 1px solid #777;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  display: flex;
  position: relative;
}

.hwhx-build-lite.hwhx-toast-stack .hwhx-toast__icon:empty {
  display: none;
}

.hwhx-build-lite.hwhx-toast-stack .hwhx-toast__content {
  flex: auto;
  min-width: 0;
}

.hwhx-build-lite.hwhx-toast-stack .hwhx-toast__title {
  font-weight: 700;
}

.hwhx-build-lite.hwhx-toast-stack .hwhx-toast__actions {
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
  display: flex;
}

.hwhx-build-lite.hwhx-tooltip {
  z-index: 13000;
  color: #eee;
  background: #202020;
  border: 1px solid #777;
  border-radius: 2px;
  max-width: min(320px, 100vw - 16px);
  padding: 5px 7px;
  font: 12px / 1.3 Arial, sans-serif;
  position: fixed;
}

.hwhx-build-lite.hwhx-splash {
  font-family: Arial, sans-serif;
}

.hwhx-build-lite.hwhx-modal, .hwhx-build-lite.hwhx-modal *, .hwhx-build-lite.hwhx-progress, .hwhx-build-lite.hwhx-progress *, .hwhx-build-lite.hwhx-toast-stack, .hwhx-build-lite.hwhx-toast-stack *, .hwhx-build-lite.hwhx-tooltip, .hwhx-build-lite.hwhx-splash, .hwhx-build-lite.hwhx-splash * {
  scroll-behavior: auto !important;
  filter: none !important;
  backdrop-filter: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
  transition: none !important;
  animation: none !important;
}

@media (width <= 640px) {
  .hwhx-build-lite.hwhx-modal {
    padding: 0;
  }

  .hwhx-build-lite.hwhx-modal .hwhx-modal__dialog {
    border-radius: 0;
    width: 100vw !important;
    max-height: 100vh !important;
  }

  .hwhx-build-lite.hwhx-modal .hwhx-settings-row, .hwhx-build-lite.hwhx-modal .hwhx-settings-field, .hwhx-build-lite.hwhx-modal .hwhx-field-row, .hwhx-build-lite.hwhx-modal .hwhx-info-line {
    grid-template-columns: 1fr;
  }

  .hwhx-build-lite.hwhx-modal .hwhx-modal__actions {
    flex-direction: column;
  }

  .hwhx-build-lite.hwhx-modal .hwhx-selection-label__details {
    display: none;
  }
}
`;
	function ensureLiteStyles() {
		injectStyle(LITE_STYLE_ID, LITE_CSS);
	}
	function ensureSharedUiBaseStyles() {
		ensureLiteStyles();
	}
	function ensureSharedUiComponentStyles() {
		ensureLiteStyles();
	}
	function ensureSharedUiFeedbackStyles() {
		ensureLiteStyles();
	}
	var TOAST_POSITIONS = [
		"top-right",
		"bottom-right",
		"top-left",
		"bottom-left"
	];
	var DEFAULT_TOAST_POSITION = "top-right";
	var DEFAULT_TOAST_TIMEOUT_MS = 1e4;
	var MAX_TOAST_TIMEOUT_MS = 12e4;
	var DEFAULT_TOAST_PREFERENCES = Object.freeze({
		position: DEFAULT_TOAST_POSITION,
		stackSize: 3,
		timeoutMs: DEFAULT_TOAST_TIMEOUT_MS
	});
	var toastPositionSet = new Set(TOAST_POSITIONS);
	function normalizeToastPosition(value) {
		const position = String(value !== null && value !== void 0 ? value : "");
		return toastPositionSet.has(position) ? position : DEFAULT_TOAST_POSITION;
	}
	function normalizeToastStackSize(value) {
		const stackSize = Math.trunc(Number(value));
		return Number.isFinite(stackSize) ? Math.min(6, Math.max(1, stackSize)) : 3;
	}
	function normalizeToastTimeoutMs(value) {
		const timeoutMs = Math.trunc(Number(value));
		return Number.isFinite(timeoutMs) ? Math.min(MAX_TOAST_TIMEOUT_MS, Math.max(0, timeoutMs)) : DEFAULT_TOAST_TIMEOUT_MS;
	}
	function normalizeToastPreferences(value) {
		const source = isPlainObject(value) ? value : {};
		return {
			position: normalizeToastPosition(source.position),
			stackSize: normalizeToastStackSize(source.stackSize),
			timeoutMs: normalizeToastTimeoutMs(source.timeoutMs)
		};
	}
	function readToastPreferences(storage = getBrowserLocalStorage()) {
		try {
			var _storage$getItem;
			return normalizeToastPreferences(JSON.parse((_storage$getItem = storage === null || storage === void 0 ? void 0 : storage.getItem("hwhx_toast_preferences")) !== null && _storage$getItem !== void 0 ? _storage$getItem : "null"));
		} catch (error) {
			console.warn("[hwhx] Не удалось прочитать настройки уведомлений:", error);
			return { ...DEFAULT_TOAST_PREFERENCES };
		}
	}
	//#endregion
	//#region src/shared/ui/native/toast.ts
	var preferences = readToastPreferences();
	var toastSequence = 0;
	var stack = null;
	var entries = /* @__PURE__ */ new Map();
	function showNativeToast(options) {
		var _options$id, _options$timeoutMs;
		ensureSharedUiFeedbackStyles();
		const id = String((_options$id = options.id) !== null && _options$id !== void 0 ? _options$id : createToastId());
		dismissNativeToast(id, "overflow");
		const root = ensureStack();
		const element = buildToastElement(id, options);
		const timeoutMs = normalizeToastPreferences({ timeoutMs: (_options$timeoutMs = options.timeoutMs) !== null && _options$timeoutMs !== void 0 ? _options$timeoutMs : preferences.timeoutMs }).timeoutMs;
		const entry = {
			element,
			onClose: options.onClose,
			timeoutId: timeoutMs > 0 ? globalThis.setTimeout(() => dismissNativeToast(id, "timeout"), timeoutMs) : null
		};
		entries.set(id, entry);
		root.appendChild(element);
		trimOverflow();
		return id;
	}
	function dismissNativeToast(id, reason = "close") {
		var _entry$onClose;
		const entry = entries.get(id);
		if (!entry) return;
		entries.delete(id);
		if (entry.timeoutId !== null) globalThis.clearTimeout(entry.timeoutId);
		entry.element.remove();
		(_entry$onClose = entry.onClose) === null || _entry$onClose === void 0 || _entry$onClose.call(entry, reason);
		if (entries.size === 0) {
			stack === null || stack === void 0 || stack.remove();
			stack = null;
		}
	}
	function ensureStack() {
		if (stack === null || stack === void 0 ? void 0 : stack.isConnected) return stack;
		stack = document.createElement("div");
		stack.className = "hwhx-toast-stack hwhx-build-lite";
		syncStackPosition();
		document.body.appendChild(stack);
		return stack;
	}
	function syncStackPosition() {
		if (!stack) return;
		stack.dataset.position = preferences.position;
		stack.style.inset = "auto";
		const bottom = preferences.position.startsWith("bottom");
		const left = preferences.position.endsWith("left");
		stack.style[bottom ? "bottom" : "top"] = "8px";
		stack.style[left ? "left" : "right"] = "8px";
		stack.style.flexDirection = bottom ? "column-reverse" : "column";
	}
	function buildToastElement(id, options) {
		var _options$tone;
		const element = document.createElement("article");
		element.className = "hwhx-toast";
		element.dataset.tone = (_options$tone = options.tone) !== null && _options$tone !== void 0 ? _options$tone : "info";
		const content = document.createElement("div");
		content.className = "hwhx-toast__content";
		if (options.title) {
			const title = document.createElement("div");
			title.className = "hwhx-toast__title";
			title.textContent = options.title;
			content.appendChild(title);
		}
		if (options.text) {
			const text = document.createElement("div");
			text.className = "hwhx-toast__text";
			text.textContent = options.text;
			content.appendChild(text);
		}
		appendToastActions(content, id, options.actions);
		element.appendChild(content);
		if (options.closable !== false) {
			const close = document.createElement("button");
			close.type = "button";
			close.className = "hwhx-icon-button";
			close.textContent = "×";
			close.ariaLabel = options.closeLabel || "Закрыть";
			close.addEventListener("click", () => dismissNativeToast(id, "close"));
			element.appendChild(close);
		}
		return element;
	}
	function appendToastActions(container, toastId, actions) {
		if (!Array.isArray(actions) || actions.length === 0) return;
		const root = document.createElement("div");
		root.className = "hwhx-toast__actions";
		for (const action of actions) {
			var _action$tone;
			if (!(action === null || action === void 0 ? void 0 : action.id) || !action.label) continue;
			const button = document.createElement(action.href ? "a" : "button");
			button.className = "hwhx-button hwhx-button--mini";
			button.textContent = action.label;
			button.dataset.tone = (_action$tone = action.tone) !== null && _action$tone !== void 0 ? _action$tone : "secondary";
			if (button instanceof HTMLAnchorElement) {
				button.href = String(action.href);
				button.target = "_blank";
				button.rel = "noopener noreferrer";
			} else button.type = "button";
			button.addEventListener("click", () => {
				try {
					var _action$onClick;
					Promise.resolve((_action$onClick = action.onClick) === null || _action$onClick === void 0 ? void 0 : _action$onClick.call(action)).catch((error) => console.error("[hwhx] Ошибка действия уведомления:", error));
				} catch (error) {
					console.error("[hwhx] Ошибка действия уведомления:", error);
				}
				if (action.closeOnClick !== false) dismissNativeToast(toastId, "action");
			});
			root.appendChild(button);
		}
		if (root.childElementCount > 0) container.appendChild(root);
	}
	function trimOverflow() {
		while (entries.size > preferences.stackSize) {
			const oldestId = entries.keys().next().value;
			if (typeof oldestId !== "string") break;
			dismissNativeToast(oldestId, "overflow");
		}
	}
	function createToastId() {
		toastSequence += 1;
		return `hwhx-toast-${Date.now()}-${toastSequence}`;
	}
	//#endregion
	//#region src/shared/game/lite/runtime-feedback.ts
	function showRuntimeFeedbackToast(options) {
		return showNativeToast(options);
	}
	async function withRuntimeFeedbackSplash(_options, task) {
		return await task();
	}
	var ALLOWED_PROTOCOL_SET = /* @__PURE__ */ new Set(["https:", "http:"]);
	function normalizeExternalHref(value) {
		const text = String(value !== null && value !== void 0 ? value : "").trim();
		if (!text) return "";
		try {
			const url = new URL(text);
			return ALLOWED_PROTOCOL_SET.has(url.protocol) ? url.href : "";
		} catch (_unused) {
			return "";
		}
	}
	//#endregion
	//#region src/shared/game/helper-install.ts
	var HERO_WARS_HELPER_INSTALL_URL = "https://greasyfork.org/ru/scripts/450693-herowarshelper";
	var helperInstallNoticeOpen = false;
	function readSafeText(value) {
		if (value == null) return "";
		const text = String(value).trim();
		return text.length > 0 ? text : "";
	}
	function readSafeUrl(value, fallbackUrl = HERO_WARS_HELPER_INSTALL_URL) {
		return normalizeExternalHref(value) || fallbackUrl;
	}
	/**
	* Показывает пользователю установочную подсказку, если HeroWarsHelper runtime не появился.
	*/
	function showHeroWarsHelperInstallNotice({ scriptName = "", installUrl = HERO_WARS_HELPER_INSTALL_URL } = {}) {
		if (typeof document === "undefined" || helperInstallNoticeOpen) return;
		if (!document.body) {
			globalThis.setTimeout(() => showHeroWarsHelperInstallNotice({
				scriptName,
				installUrl
			}), 0);
			return;
		}
		const normalizedInstallUrl = readSafeUrl(installUrl);
		const cleanScriptName = readSafeText(scriptName);
		helperInstallNoticeOpen = true;
		showRuntimeFeedbackToast({
			id: "hero-wars-helper-install",
			title: "Нужен HeroWarsHelper",
			text: `${cleanScriptName ? `${cleanScriptName}: ` : ""}runtime игры не найден. Установите HeroWarsHelper и обновите вкладку.`,
			tone: "warning",
			icon: "plug-zap",
			actions: [{
				id: "install",
				label: "Установить на GreasyFork",
				icon: "download",
				tone: "success",
				href: normalizedInstallUrl
			}],
			closeLabel: "Закрыть",
			onClose: () => {
				helperInstallNoticeOpen = false;
			}
		});
	}
	//#endregion
	//#region src/shared/game/bootstrap.ts
	/**
	* Проверяет, доступен ли runtime расширения (HWHClasses, HWHFuncs, HWHData).
	* @param {string[]} [requiredKeys=["HWHClasses", "HWHFuncs", "HWHData"]]
	* @returns {boolean}
	*/
	function isHwhRuntimeReady(requiredKeys = [
		"HWHClasses",
		"HWHFuncs",
		"HWHData"
	], readyWhen) {
		const runtimeRoot = globalThis;
		if (!requiredKeys.every((key) => !!runtimeRoot[key])) return false;
		if (!readyWhen) return true;
		try {
			return readyWhen();
		} catch (_unused) {
			return false;
		}
	}
	/**
	* Пытается дождаться инициализации runtime расширения с ретраями через setTimeout.
	* @param {{attempt?: number, maxAttempts?: number, delayMs?: number, requiredKeys?: string[], retry?: Function, readyWhen?: Function, logPrefix?: string, scriptName?: string, showInstallNotice?: boolean}} [options]
	* @returns {boolean}
	*/
	function retryHwhRuntimeInitialization({ attempt = 0, maxAttempts = 120, delayMs = 500, requiredKeys = [
		"HWHClasses",
		"HWHFuncs",
		"HWHData"
	], retry, readyWhen, logPrefix = "[HWH]", scriptName = "", showInstallNotice = true } = {}) {
		const initAttempt = Number(attempt) || 0;
		if (isHwhRuntimeReady(requiredKeys, readyWhen)) return true;
		if (initAttempt < maxAttempts && typeof retry === "function") {
			globalThis.setTimeout(() => retry(initAttempt + 1), delayMs);
			return false;
		}
		console.log(`%c${logPrefix} Объект расширения не найден`, "color: red");
		if (showInstallNotice) showHeroWarsHelperInstallNotice({ scriptName });
		return false;
	}
	//#endregion
	//#region src/shared/game/caller.ts
	function hasFunctionProperty(source, propertyName) {
		return source !== null && (typeof source === "object" || typeof source === "function") && typeof source[propertyName] === "function";
	}
	/**
	* Проверяет форму Caller из HeroWarsHelper по фактическому helper.js.
	*/
	function isHeroWarsCallerConstructor(value) {
		if (typeof value !== "function" || !hasFunctionProperty(value, "send")) return false;
		const prototype = value.prototype;
		return hasFunctionProperty(prototype, "addCall") && hasFunctionProperty(prototype, "add") && hasFunctionProperty(prototype, "send") && hasFunctionProperty(prototype, "result") && hasFunctionProperty(prototype, "sideResult") && hasFunctionProperty(prototype, "execute") && hasFunctionProperty(prototype, "clear") && hasFunctionProperty(prototype, "isEmpty");
	}
	/**
	* Безопасно читает Caller из runtime root.
	*/
	function getHeroWarsCaller(runtimeRoot = globalThis) {
		return isHeroWarsCallerConstructor(runtimeRoot.Caller) ? runtimeRoot.Caller : null;
	}
	/**
	* Возвращает Caller или бросает понятную ошибку на runtime boundary.
	*/
	function requireHeroWarsCaller(runtimeRoot = globalThis) {
		const caller = getHeroWarsCaller(runtimeRoot);
		if (!caller) throw new Error("HeroWarsHelper Caller runtime is not available.");
		return caller;
	}
	//#endregion
	//#region src/shared/format.ts
	var numberFormatters = /* @__PURE__ */ new Map();
	function getNumberFormatter(locale) {
		let formatter = numberFormatters.get(locale);
		if (!formatter) {
			formatter = new Intl.NumberFormat(locale);
			numberFormatters.set(locale, formatter);
		}
		return formatter;
	}
	/**
	* Определяет язык документа по атрибуту lang у html.
	*/
	function getDocumentLocale(fallbackLocale = "en-US") {
		var _globalThis$document$, _globalThis$document;
		const language = String((_globalThis$document$ = (_globalThis$document = globalThis.document) === null || _globalThis$document === void 0 || (_globalThis$document = _globalThis$document.documentElement) === null || _globalThis$document === void 0 ? void 0 : _globalThis$document.lang) !== null && _globalThis$document$ !== void 0 ? _globalThis$document$ : "").trim();
		if (language) return language.toLowerCase().startsWith("ru") ? "ru-RU" : language;
		return fallbackLocale;
	}
	/**
	* Создаёт функцию-форматтер с предустановленными параметрами.
	*/
	function createNumberFormatter(options = {}) {
		var _options$locale, _options$minimum;
		const locale = (_options$locale = options.locale) !== null && _options$locale !== void 0 ? _options$locale : getDocumentLocale();
		const minimum = (_options$minimum = options.minimum) !== null && _options$minimum !== void 0 ? _options$minimum : 0;
		const formatter = getNumberFormatter(locale);
		return function formatConfiguredNumber(value) {
			return formatter.format(Math.max(minimum, Number(value) || 0));
		};
	}
	//#endregion
	//#region src/shared/game/api-calls.ts
	function delay(milliseconds = 0) {
		const timeoutMs = Math.max(0, Math.floor(Number(milliseconds) || 0));
		return new Promise((resolve) => {
			globalThis.setTimeout(resolve, timeoutMs);
		});
	}
	/**
	* Отправляет вызовы пачками с опциональной задержкой между чанками.
	* @param {{calls?: Array, chunkSize?: number, delayMs?: number, sendChunk?: Function, onChunk?: Function}} [options]
	* @returns {Promise<Array>}
	*/
	async function sendCallsInChunks({ calls, chunkSize = 20, delayMs = 0, sendChunk, onChunk }) {
		const normalizedCalls = Array.isArray(calls) ? calls : [];
		const normalizedChunkSize = Math.max(1, Math.floor(Number(chunkSize) || 1));
		const normalizedDelayMs = Math.max(0, Math.floor(Number(delayMs) || 0));
		const totalRequests = Math.max(1, Math.ceil(normalizedCalls.length / normalizedChunkSize));
		const combinedResults = [];
		for (let index = 0; index < normalizedCalls.length; index += normalizedChunkSize) {
			const currentChunk = normalizedCalls.slice(index, index + normalizedChunkSize);
			const chunkMeta = {
				requestIndex: Math.floor(index / normalizedChunkSize) + 1,
				totalRequests,
				chunkStart: index + 1,
				chunkEnd: index + currentChunk.length,
				chunkSize: currentChunk.length
			};
			await (onChunk === null || onChunk === void 0 ? void 0 : onChunk({
				phase: "sending",
				...chunkMeta
			}));
			try {
				const chunkResults = await sendChunk(currentChunk, chunkMeta);
				if (Array.isArray(chunkResults)) combinedResults.push(...chunkResults);
				else combinedResults.push(chunkResults);
			} catch (error) {
				if (error && typeof error === "object") {
					const errorRecord = error;
					const nestedPartialResults = errorRecord.partialResults;
					const currentPartialResults = Array.isArray(nestedPartialResults) ? nestedPartialResults : [];
					errorRecord.partialResults = [...combinedResults, ...currentPartialResults];
				}
				throw error;
			}
			await (onChunk === null || onChunk === void 0 ? void 0 : onChunk({
				phase: "processed",
				...chunkMeta
			}));
			if (index + normalizedChunkSize < normalizedCalls.length && normalizedDelayMs > 0) await delay(normalizedDelayMs);
		}
		return combinedResults;
	}
	/**
	* Создаёт предварительно настроенную функцию для отправки вызовов пачками.
	* @param {{chunkSize?: number, delayMs?: number, sendChunk?: Function, mapOnChunk?: Function}} [options]
	* @returns {Function}
	*/
	function createChunkedCallSender({ chunkSize: defaultChunkSize = 20, delayMs: defaultDelayMs = 0, sendChunk, mapOnChunk = (onChunk) => onChunk }) {
		if (typeof sendChunk !== "function") throw new Error("Chunked call sender requires sendChunk.");
		return function sendConfiguredCallsInChunks(calls, chunkSize = defaultChunkSize, onChunk = void 0, delayMs = defaultDelayMs) {
			return sendCallsInChunks({
				calls,
				chunkSize,
				delayMs,
				sendChunk,
				onChunk: mapOnChunk(onChunk)
			});
		};
	}
	//#endregion
	//#region src/shared/game/do-your-best.ts
	/** Константа: не добавлять задачу в DoYourBest. */
	var DO_YOUR_BEST_PLACEMENT_NONE$1 = "none";
	/** Константа: разместить задачу в начале списка. */
	var DO_YOUR_BEST_PLACEMENT_START = "start";
	/** Константа: префикс для размещения перед конкретной задачей. */
	var DO_YOUR_BEST_PLACEMENT_BEFORE_PREFIX = "before:";
	/** Константа: префикс для размещения после конкретной задачи. */
	var DO_YOUR_BEST_PLACEMENT_AFTER_PREFIX = "after:";
	function hasPrototypeFunction(source, propertyName) {
		return source !== null && typeof source === "object" && typeof source[propertyName] === "function";
	}
	function asDoYourBestTask(task) {
		return task && typeof task === "object" && !Array.isArray(task) ? task : null;
	}
	/**
	* Проверяет форму класса doYourBest из HeroWarsHelper.
	*/
	function isDoYourBestClass(value) {
		if (typeof value !== "function") return false;
		const prototype = value.prototype;
		return hasPrototypeFunction(prototype, "start") && hasPrototypeFunction(prototype, "end") && hasPrototypeFunction(prototype, "errorHandling");
	}
	/**
	* Безопасно сужает unknown к классу doYourBest.
	*/
	function asDoYourBestClass(value) {
		return isDoYourBestClass(value) ? value : null;
	}
	/**
	* Читает HWHClasses.doYourBest без прямой привязки к глобалу.
	*/
	function getHeroWarsDoYourBestClass(classes) {
		return asDoYourBestClass(classes === null || classes === void 0 ? void 0 : classes.doYourBest);
	}
	/**
	* Возвращает имя задачи Do Your Best, очищенное от пробелов.
	*/
	function getDoYourBestTaskName(task) {
		var _taskRecord$name;
		const taskRecord = asDoYourBestTask(task);
		return String((_taskRecord$name = taskRecord === null || taskRecord === void 0 ? void 0 : taskRecord.name) !== null && _taskRecord$name !== void 0 ? _taskRecord$name : "").trim();
	}
	/**
	* Возвращает метку задачи (label > title > name) или пустую строку.
	*/
	function getDoYourBestTaskLabel(task) {
		const taskRecord = asDoYourBestTask(task);
		return String((taskRecord === null || taskRecord === void 0 ? void 0 : taskRecord.label) || (taskRecord === null || taskRecord === void 0 ? void 0 : taskRecord.title) || (taskRecord === null || taskRecord === void 0 ? void 0 : taskRecord.name) || "").trim();
	}
	/**
	* Нормализует placement DoYourBest: none/end/start/before:X/after:X.
	*/
	function normalizeDoYourBestPlacement$1(value, { allowStart = false, fallbackValue = "end" } = {}) {
		const placement = String(value !== null && value !== void 0 ? value : "").trim();
		if (placement === "none" || placement === "end" || allowStart && placement === "start") return placement;
		if (placement.startsWith("before:") && placement.length > 7) return placement;
		if (placement.startsWith("after:") && placement.length > 6) return placement;
		return fallbackValue;
	}
	/**
	* Находит корневой базовый класс в цепочке наследования DoYourBest.
	*/
	function getDoYourBestRootBaseClass(MaybeDerived) {
		if (typeof MaybeDerived !== "function") return MaybeDerived;
		let currentClass = MaybeDerived;
		while (true) {
			const parentPrototype = Object.getPrototypeOf(currentClass.prototype);
			if (!parentPrototype || parentPrototype === Object.prototype) return currentClass;
			const parentClass = parentPrototype.constructor;
			if (typeof parentClass !== "function" || parentClass === currentClass) return currentClass;
			currentClass = parentClass;
		}
	}
	/**
	* Делает снепшот списка задач DoYourBest через временный инстанс класса.
	*/
	function getDoYourBestTaskListSnapshot(DoYourBestClass, { logPrefix = "[HWH]" } = {}) {
		const DoYourBestCtor = asDoYourBestClass(DoYourBestClass);
		if (!DoYourBestCtor) return [];
		try {
			const doYourBestInstance = new DoYourBestCtor();
			return Array.isArray(doYourBestInstance.funcList) ? doYourBestInstance.funcList.filter(Boolean) : [];
		} catch (error) {
			console.warn(`${logPrefix} checklist snapshot failed`, error);
			return [];
		}
	}
	/**
	* Создаёт функцию для повторного чтения снепшота списка задач DoYourBest.
	*/
	function createDoYourBestTaskListSnapshotReader({ getDoYourBestClass, logPrefix = "[HWH]" } = {}) {
		return function readDoYourBestTaskListSnapshot() {
			return getDoYourBestTaskListSnapshot(getDoYourBestClass === null || getDoYourBestClass === void 0 ? void 0 : getDoYourBestClass(), { logPrefix });
		};
	}
	/**
	* Создаёт функцию нормализации placement с предустановленными параметрами.
	*/
	function createDoYourBestPlacementNormalizer(options = {}) {
		return function normalizeConfiguredDoYourBestPlacement(value) {
			return normalizeDoYourBestPlacement$1(value, options);
		};
	}
	/**
	* Определяет индекс вставки задачи в список на основе placement.
	*/
	function getDoYourBestInsertionIndex(taskList, placement, { allowStart = false, normalizePlacement = void 0 } = {}) {
		const normalizedPlacement = typeof normalizePlacement === "function" ? normalizePlacement(placement) : normalizeDoYourBestPlacement$1(placement, { allowStart });
		if (allowStart && normalizedPlacement === "start") return 0;
		if (normalizedPlacement === "end") return taskList.length;
		const isAfter = normalizedPlacement.startsWith(DO_YOUR_BEST_PLACEMENT_AFTER_PREFIX);
		const anchorName = normalizedPlacement.slice(isAfter ? 6 : 7);
		const anchorIndex = taskList.findIndex((task) => getDoYourBestTaskName(task) === anchorName);
		if (anchorIndex < 0) return taskList.length;
		return anchorIndex + (isAfter ? 1 : 0);
	}
	/**
	* Строит массив опций для выбора placement DoYourBest (с учётом задач-якорей).
	*/
	function buildDoYourBestPlacementOptions({ taskList = [], translate, keys, includeStart = false } = {}) {
		var _keys$none, _keys$before;
		const t = typeof translate === "function" ? translate : (key) => key;
		const placementTasks = (taskList !== null && taskList !== void 0 ? taskList : []).filter((task) => getDoYourBestTaskName(task));
		const options = [{
			value: DO_YOUR_BEST_PLACEMENT_NONE$1,
			label: t((_keys$none = keys === null || keys === void 0 ? void 0 : keys.none) !== null && _keys$none !== void 0 ? _keys$none : "DO_YOUR_BEST_PLACEMENT_NONE"),
			icon: "x"
		}];
		if (includeStart) {
			var _keys$start;
			options.push({
				value: DO_YOUR_BEST_PLACEMENT_START,
				label: t((_keys$start = keys === null || keys === void 0 ? void 0 : keys.start) !== null && _keys$start !== void 0 ? _keys$start : "DO_YOUR_BEST_PLACEMENT_START"),
				icon: "arrow-up-to-line"
			});
		}
		if (placementTasks.length <= 0) {
			var _keys$end;
			options.push({
				value: "end",
				label: t((_keys$end = keys === null || keys === void 0 ? void 0 : keys.end) !== null && _keys$end !== void 0 ? _keys$end : "DO_YOUR_BEST_PLACEMENT_END"),
				icon: "arrow-down"
			});
			return options;
		}
		const firstTask = placementTasks[0];
		const firstTaskName = getDoYourBestTaskName(firstTask);
		const firstTaskLabel = getDoYourBestTaskLabel(firstTask) || firstTaskName;
		options.push({
			value: `${DO_YOUR_BEST_PLACEMENT_BEFORE_PREFIX}${firstTaskName}`,
			label: t((_keys$before = keys === null || keys === void 0 ? void 0 : keys.before) !== null && _keys$before !== void 0 ? _keys$before : "DO_YOUR_BEST_PLACEMENT_BEFORE", { label: firstTaskLabel }),
			icon: "arrow-up"
		});
		placementTasks.forEach((task) => {
			var _keys$after;
			const taskName = getDoYourBestTaskName(task);
			const taskLabel = getDoYourBestTaskLabel(task) || taskName;
			options.push({
				value: `${DO_YOUR_BEST_PLACEMENT_AFTER_PREFIX}${taskName}`,
				label: t((_keys$after = keys === null || keys === void 0 ? void 0 : keys.after) !== null && _keys$after !== void 0 ? _keys$after : "DO_YOUR_BEST_PLACEMENT_AFTER", { label: taskLabel }),
				icon: "arrow-down"
			});
		});
		return options;
	}
	//#endregion
	//#region src/shared/game/do-your-best-settings.ts
	/**
	* Создаёт функцию сборки опций placement с предустановленными translate/keys.
	*/
	function createDoYourBestPlacementOptionsBuilder({ translate, keys, includeStart = false } = {}) {
		return function buildPlacementOptions(taskList) {
			return buildDoYourBestPlacementOptions({
				taskList,
				translate,
				keys,
				includeStart
			});
		};
	}
	//#endregion
	//#region src/shared/game/menu-buttons.ts
	function getSplashTone(color) {
		if (color === "gold") return "gold";
		if (color === "blue") return "blue";
		if (color === "pink" || color === "purple") return "purple";
		return "green";
	}
	/**
	* Создаёт фабрику кнопок меню скрипта (main и other) с динамическими label/title.
	*/
	function createScriptMenuButtonFactory({ actionKey, color = "pink", icon = "", getLabel, getTitle, onClick, buildIconLabel = (_icon, label) => String(label !== null && label !== void 0 ? label : ""), splash = true } = {}) {
		const readLabel = () => typeof getLabel === "function" ? getLabel() : String(getLabel !== null && getLabel !== void 0 ? getLabel : "");
		const readTitle = () => typeof getTitle === "function" ? getTitle() : String(getTitle !== null && getTitle !== void 0 ? getTitle : "");
		const runAction = onClick ? (...args) => {
			if (!splash) return onClick(...args);
			return withRuntimeFeedbackSplash({
				title: String(readLabel()),
				status: String(readTitle()),
				icon: icon || "settings-2",
				tone: getSplashTone(color)
			}, () => onClick(...args));
		} : void 0;
		function createMainButton() {
			return {
				get name() {
					return String(readLabel());
				},
				get title() {
					return String(readTitle());
				},
				color,
				onClick: runAction
			};
		}
		function createOtherButton() {
			return {
				actionKey,
				get msg() {
					return String(buildIconLabel(icon, readLabel()));
				},
				get title() {
					return String(readTitle());
				},
				color,
				result: runAction
			};
		}
		return {
			createMainButton,
			createOtherButton
		};
	}
	//#endregion
	//#region src/shared/game/game-icon-catalog.ts
	var STARMONEY_TYPES = /* @__PURE__ */ new Set([
		"starmoney",
		"emerald",
		"emeralds",
		"gem",
		"gems"
	]);
	function getCurrencyGameItemReference(currencyKey) {
		const [rawType, rawId = ""] = String(currencyKey !== null && currencyKey !== void 0 ? currencyKey : "").split(":");
		const itemType = rawType.trim();
		if (itemType === "gold") return {
			itemType: "pseudo",
			itemId: 2
		};
		if (STARMONEY_TYPES.has(itemType)) return {
			itemType: "starmoney",
			itemId: 0
		};
		const numericId = Number(rawId);
		return {
			itemType,
			itemId: Number.isFinite(numericId) && rawId.trim() !== "" ? numericId : rawId
		};
	}
	//#endregion
	//#region src/shared/game/menu-actions.ts
	/** Константа: размещение действия в главном меню. */
	var MENU_ACTION_PLACEMENT_MAIN = "main";
	/** Константа: размещение действия в попапе «Другие». */
	var MENU_ACTION_PLACEMENT_OTHER = "other";
	/**
	* Гарантирует существование HWHData.buttons как объекта.
	*/
	function ensureMainMenuButtons(HWHData) {
		return (HWHData === null || HWHData === void 0 ? void 0 : HWHData.buttons) && typeof HWHData.buttons === "object" ? HWHData.buttons : HWHData.buttons = {};
	}
	/**
	* Гарантирует существование HWHData.othersPopupButtons как массива.
	*/
	function ensureOtherPopupButtons(HWHData) {
		return Array.isArray(HWHData === null || HWHData === void 0 ? void 0 : HWHData.othersPopupButtons) ? HWHData.othersPopupButtons : HWHData.othersPopupButtons = [];
	}
	/**
	* Нормализует placement действия меню: только main или other.
	*/
	function normalizeMenuActionPlacement(value, fallbackValue = MENU_ACTION_PLACEMENT_MAIN) {
		return value === "other" || value === "main" ? value : fallbackValue;
	}
	/**
	* Читает placement из settings/raw value/storage fallback и нормализует его.
	*/
	function resolveStoredScriptMenuActionPlacement({ normalizePlacement = normalizeMenuActionPlacement, readStoredPlacement, settings, settingsKey }) {
		const settingsRecord = isPlainObject(settings) ? settings : {};
		const rawPlacement = isPlainObject(settings) && settingsKey ? Object.prototype.hasOwnProperty.call(settingsRecord, settingsKey) ? settingsRecord[settingsKey] : readStoredPlacement === null || readStoredPlacement === void 0 ? void 0 : readStoredPlacement() : settings;
		return normalizePlacement(rawPlacement === void 0 ? readStoredPlacement === null || readStoredPlacement === void 0 ? void 0 : readStoredPlacement() : rawPlacement);
	}
	/**
	* Синхронизирует placement действия меню: перемещает кнопку между main и other.
	*/
	function syncScriptMenuActionPlacement({ HWHData, mainMenuButtons, othersPopupButtons, placement, mainKey, actionKey, createMainButton, createOtherButton, mainPlacementValue = MENU_ACTION_PLACEMENT_MAIN, otherPlacementValue = MENU_ACTION_PLACEMENT_OTHER }) {
		const menuData = HWHData !== null && HWHData !== void 0 ? HWHData : {};
		const mainButtons = mainMenuButtons !== null && mainMenuButtons !== void 0 ? mainMenuButtons : ensureMainMenuButtons(menuData);
		const otherButtons = othersPopupButtons !== null && othersPopupButtons !== void 0 ? othersPopupButtons : ensureOtherPopupButtons(menuData);
		const existingOtherIndex = otherButtons.findIndex((button) => (button === null || button === void 0 ? void 0 : button.actionKey) === actionKey);
		if (existingOtherIndex >= 0) otherButtons.splice(existingOtherIndex, 1);
		if (mainKey) delete mainButtons[mainKey];
		if (placement === otherPlacementValue && typeof createOtherButton === "function") otherButtons.push(createOtherButton());
		else if (mainKey && placement === mainPlacementValue && typeof createMainButton === "function") mainButtons[mainKey] = createMainButton();
		menuData.buttons = mainButtons;
		return {
			mainMenuButtons: mainButtons,
			othersPopupButtons: otherButtons
		};
	}
	/**
	* Синхронизирует placement действия меню, предварительно прочитав и сохранив его.
	*/
	function syncStoredScriptMenuActionPlacement({ normalizePlacement = normalizeMenuActionPlacement, persistPlacement, readStoredPlacement, settings, settingsKey, ...syncOptions }) {
		const placement = resolveStoredScriptMenuActionPlacement({
			normalizePlacement,
			readStoredPlacement,
			settings,
			settingsKey
		});
		persistPlacement === null || persistPlacement === void 0 || persistPlacement(placement);
		return {
			...syncScriptMenuActionPlacement({
				...syncOptions,
				placement
			}),
			placement
		};
	}
	//#endregion
	//#region src/shared/game/library-dump.ts
	function dumpGameLibraryToConsole(scriptId = "hwh") {
		if (typeof console === "undefined") return;
		const runtimeRoot = globalThis;
		const payload = {
			HWHClasses: runtimeRoot.HWHClasses,
			HWHFuncs: runtimeRoot.HWHFuncs,
			HWHData: runtimeRoot.HWHData,
			lib: runtimeRoot.lib,
			cheats: runtimeRoot.cheats,
			userId: runtimeRoot.userId
		};
		const title = `[${scriptId}] game library dump`;
		const openGroup = typeof console.groupCollapsed === "function" ? console.groupCollapsed.bind(console) : typeof console.group === "function" ? console.group.bind(console) : null;
		const closeGroup = typeof console.groupEnd === "function" ? console.groupEnd.bind(console) : null;
		if (openGroup && closeGroup) {
			openGroup(title);
			Object.entries(payload).forEach(([key, value]) => console.log(key, value));
			closeGroup();
			return;
		}
		console.log(title, payload);
	}
	//#endregion
	//#region src/shared/i18n/locale-catalog.ts
	var heroWarsLocaleCodes = [
		"de",
		"en",
		"es",
		"fr",
		"it",
		"ru",
		"zh-cn",
		"zh-tw",
		"ja",
		"ko",
		"th",
		"pt"
	];
	var localeAliases = {
		"de-de": "de",
		"en-gb": "en",
		"en-us": "en",
		"es-es": "es",
		"fr-fr": "fr",
		"it-it": "it",
		"ja-jp": "ja",
		"ko-kr": "ko",
		"pt-br": "pt",
		"pt-pt": "pt",
		"ru-ru": "ru",
		"th-th": "th",
		"zh-hans": "zh-cn",
		"zh-hans-cn": "zh-cn",
		"zh-hant": "zh-tw",
		"zh-hant-tw": "zh-tw"
	};
	var knownLocales = new Set(heroWarsLocaleCodes);
	function normalizeHeroWarsLocale(value) {
		const normalized = String(value !== null && value !== void 0 ? value : "").trim().toLowerCase().replaceAll("_", "-");
		if (!normalized) return;
		if (knownLocales.has(normalized)) return normalized;
		return localeAliases[normalized];
	}
	//#endregion
	//#region src/shared/i18n.ts
	function resolveCurrentUserscriptId(fallbackId = "") {
		var _globalThis$__HWHX_US;
		{
			var _hwhheromanagerLite;
			const buildId = String((_hwhheromanagerLite = "hwhheromanager-lite") !== null && _hwhheromanagerLite !== void 0 ? _hwhheromanagerLite : "").trim();
			if (buildId) return buildId;
		}
		return String((_globalThis$__HWHX_US = globalThis.__HWHX_USERSCRIPT_ID__) !== null && _globalThis$__HWHX_US !== void 0 ? _globalThis$__HWHX_US : "").trim() || fallbackId;
	}
	/**
	* Определяет текущий код языка из NXFlashVars, navigator.language или i18nLangData.
	* @param {Object} [i18nLangData]
	* @returns {string}
	*/
	function getCurrentLanguageCode(i18nLangData = void 0) {
		var _globalThis$NXFlashVa, _globalThis$document, _globalThis$navigator, _globalThis$navigator2, _globalThis$navigator3, _availableLanguages$;
		const availableLanguages = Object.keys(i18nLangData !== null && i18nLangData !== void 0 ? i18nLangData : {});
		const candidateLanguages = [
			(_globalThis$NXFlashVa = globalThis.NXFlashVars) === null || _globalThis$NXFlashVa === void 0 ? void 0 : _globalThis$NXFlashVa.interface_lang,
			(_globalThis$document = globalThis.document) === null || _globalThis$document === void 0 || (_globalThis$document = _globalThis$document.documentElement) === null || _globalThis$document === void 0 ? void 0 : _globalThis$document.lang,
			...(_globalThis$navigator = (_globalThis$navigator2 = globalThis.navigator) === null || _globalThis$navigator2 === void 0 ? void 0 : _globalThis$navigator2.languages) !== null && _globalThis$navigator !== void 0 ? _globalThis$navigator : [],
			(_globalThis$navigator3 = globalThis.navigator) === null || _globalThis$navigator3 === void 0 ? void 0 : _globalThis$navigator3.language
		];
		for (const candidate of candidateLanguages) {
			var _rawLanguage$split$;
			const rawLanguage = String(candidate !== null && candidate !== void 0 ? candidate : "").trim().toLowerCase();
			if (availableLanguages.includes(rawLanguage)) return rawLanguage;
			const normalizedLanguage = normalizeHeroWarsLocale(rawLanguage);
			if (normalizedLanguage && availableLanguages.includes(normalizedLanguage)) return normalizedLanguage;
			const shortLanguage = (_rawLanguage$split$ = rawLanguage.split(/[-_]/u)[0]) !== null && _rawLanguage$split$ !== void 0 ? _rawLanguage$split$ : "";
			if (availableLanguages.includes(shortLanguage)) return shortLanguage;
		}
		return availableLanguages.includes("en") ? "en" : (_availableLanguages$ = availableLanguages[0]) !== null && _availableLanguages$ !== void 0 ? _availableLanguages$ : "en";
	}
	/**
	* Проверяет, является ли перевод осмысленным: не пуст, не равен ключу и не содержит «undefined».
	* @param {*} text
	* @param {*} key
	* @returns {boolean}
	*/
	function isUsefulTranslation(text, key) {
		const value = String(text !== null && text !== void 0 ? text : "").trim();
		const normalizedKey = String(key !== null && key !== void 0 ? key : "").trim();
		return !!value && value !== normalizedKey && value !== `% ${normalizedKey} %` && value !== `%${normalizedKey}%` && !value.includes("undefined");
	}
	/**
	* Собирает отдельную таблицу перевода userscript-а без мутации общей таблицы
	* HeroWarsHelper. Она нужна виджетам, которые не должны перетирать ключи
	* соседнего userscript-а при обычной загрузке игры.
	*/
	function getScriptTranslations(translationsByLanguage = {}, { scriptId = "" } = {}) {
		return mergeTranslationTables(isCustomBuildEnabled() ? getCustomBuildTranslations(scriptId) : translationsByLanguage, getRuntimeTranslations(scriptId));
	}
	function getRuntimeTranslationRegistry() {
		var _root$__HWHX_RUNTIME_;
		const root = globalThis;
		return (_root$__HWHX_RUNTIME_ = root.__HWHX_RUNTIME_TRANSLATIONS__) !== null && _root$__HWHX_RUNTIME_ !== void 0 ? _root$__HWHX_RUNTIME_ : root.__HWHX_RUNTIME_TRANSLATIONS__ = Object.create(null);
	}
	function getRuntimeTranslations(scriptId) {
		var _getRuntimeTranslatio;
		const normalizedId = String(scriptId !== null && scriptId !== void 0 ? scriptId : "").trim();
		return normalizedId ? (_getRuntimeTranslatio = getRuntimeTranslationRegistry()[normalizedId]) !== null && _getRuntimeTranslatio !== void 0 ? _getRuntimeTranslatio : {} : {};
	}
	function mergeTranslationTables(base, overrides) {
		const languages = /* @__PURE__ */ new Set([...Object.keys(base), ...Object.keys(overrides)]);
		return Object.fromEntries([...languages].map((language) => {
			var _base$language, _overrides$language;
			return [language, {
				...(_base$language = base[language]) !== null && _base$language !== void 0 ? _base$language : {},
				...(_overrides$language = overrides[language]) !== null && _overrides$language !== void 0 ? _overrides$language : {}
			}];
		}));
	}
	function isCustomBuildEnabled() {
		return false;
	}
	function getCustomBuildTranslations(scriptId) {
		var _payload$scriptId;
		if (!scriptId) return {};
		const builds = globalThis.__HWHX_CUSTOM_BUILDS__;
		const payload = builds === null || builds === void 0 ? void 0 : builds[scriptId];
		if (!payload || String((_payload$scriptId = payload.scriptId) !== null && _payload$scriptId !== void 0 ? _payload$scriptId : "") !== scriptId || !Array.isArray(payload.locales) || !payload.translations || typeof payload.translations !== "object") return {};
		const selectedLocales = new Set(payload.locales.map((locale) => String(locale !== null && locale !== void 0 ? locale : "").trim()).filter(Boolean));
		return Object.fromEntries(Object.entries(payload.translations).filter(([locale, dictionary]) => selectedLocales.has(locale) && dictionary !== null && typeof dictionary === "object" && !Array.isArray(dictionary)));
	}
	/**
	* Создаёт функцию перевода с поддержкой game I18N, cheats и встроенных словарей.
	* @param {{I18N?: Function, cheats?: {translate?: Function}, i18nLangData?: Object, defaultLanguage?: string, fallbackLanguage?: string, preferGameI18N?: boolean, forceLanguage?: string}} [options]
	* @returns {(key: string, replacements?: Object) => string}
	*/
	function createTranslator({ I18N, cheats, i18nLangData, defaultLanguage = "en", fallbackLanguage = "en", preferGameI18N = true, forceLanguage = void 0, cacheMissingTranslations = false } = {}) {
		var _ref;
		const resolvedTextCache = /* @__PURE__ */ new Map();
		const language = (_ref = forceLanguage !== null && forceLanguage !== void 0 ? forceLanguage : getCurrentLanguageCode(i18nLangData)) !== null && _ref !== void 0 ? _ref : defaultLanguage;
		const readDictionary = (key) => {
			var _ref2, _ref3, _i18nLangData$languag2, _i18nLangData$languag3, _i18nLangData$fallbac, _i18nLangData$default;
			return String((_ref2 = (_ref3 = (_i18nLangData$languag2 = i18nLangData === null || i18nLangData === void 0 || (_i18nLangData$languag3 = i18nLangData[language]) === null || _i18nLangData$languag3 === void 0 ? void 0 : _i18nLangData$languag3[key]) !== null && _i18nLangData$languag2 !== void 0 ? _i18nLangData$languag2 : i18nLangData === null || i18nLangData === void 0 || (_i18nLangData$fallbac = i18nLangData[fallbackLanguage]) === null || _i18nLangData$fallbac === void 0 ? void 0 : _i18nLangData$fallbac[key]) !== null && _ref3 !== void 0 ? _ref3 : i18nLangData === null || i18nLangData === void 0 || (_i18nLangData$default = i18nLangData[defaultLanguage]) === null || _i18nLangData$default === void 0 ? void 0 : _i18nLangData$default[key]) !== null && _ref2 !== void 0 ? _ref2 : "");
		};
		return function translate(key, replacements) {
			const normalizedKey = String(key !== null && key !== void 0 ? key : "");
			const cachedText = resolvedTextCache.get(normalizedKey);
			let text = cachedText !== null && cachedText !== void 0 ? cachedText : "";
			if (cachedText === void 0) {
				if (!preferGameI18N) text = readDictionary(normalizedKey);
				if (!isUsefulTranslation(text, normalizedKey) && typeof I18N === "function") try {
					var _I18N;
					text = String((_I18N = I18N(normalizedKey)) !== null && _I18N !== void 0 ? _I18N : "");
				} catch (_unused) {
					text = "";
				}
				if (!isUsefulTranslation(text, normalizedKey) && typeof (cheats === null || cheats === void 0 ? void 0 : cheats.translate) === "function") try {
					var _cheats$translate;
					text = String((_cheats$translate = cheats.translate(normalizedKey)) !== null && _cheats$translate !== void 0 ? _cheats$translate : "");
				} catch (_unused2) {
					text = "";
				}
				if (!isUsefulTranslation(text, normalizedKey)) text = readDictionary(normalizedKey);
				if (!isUsefulTranslation(text, normalizedKey)) text = normalizedKey;
				if (cacheMissingTranslations || text !== normalizedKey) resolvedTextCache.set(normalizedKey, text);
			}
			if (replacements) for (const [placeholder, value] of Object.entries(replacements)) text = String(text).split(`{${placeholder}}`).join(String(value));
			return String(text);
		};
	}
	//#endregion
	//#region src/shared/text-collation.ts
	var naturalCollator;
	function compareNaturalText(left, right) {
		var _naturalCollator;
		(_naturalCollator = naturalCollator) !== null && _naturalCollator !== void 0 || (naturalCollator = new Intl.Collator(void 0, {
			numeric: true,
			sensitivity: "base"
		}));
		return naturalCollator.compare(String(left !== null && left !== void 0 ? left : ""), String(right !== null && right !== void 0 ? right : ""));
	}
	//#endregion
	//#region src/shared/storage/settings-repository.ts
	function createSettingsRepository({ storage, defaultValue, normalize, getScopeKey = () => "", beforeRead, afterRead, beforeWrite, afterWrite } = {}) {
		if (!storage || typeof storage.read !== "function" || typeof storage.write !== "function") throw new Error("Settings repository requires storage with read/write methods.");
		const settingsStorage = storage;
		const normalizeValue = typeof normalize === "function" ? normalize : (value) => value === void 0 ? defaultValue : value;
		const resolveScopeKey = async () => {
			var _await$getScopeKey;
			return String((_await$getScopeKey = await getScopeKey()) !== null && _await$getScopeKey !== void 0 ? _await$getScopeKey : "");
		};
		async function read(fallbackValue = defaultValue) {
			await (beforeRead === null || beforeRead === void 0 ? void 0 : beforeRead());
			const scopeKey = await resolveScopeKey();
			const rawValue = settingsStorage.read(scopeKey, fallbackValue);
			const normalizedValue = normalizeValue(rawValue !== null && rawValue !== void 0 ? rawValue : fallbackValue);
			await (afterRead === null || afterRead === void 0 ? void 0 : afterRead(normalizedValue, {
				scopeKey,
				rawValue
			}));
			return normalizedValue;
		}
		async function write(value) {
			const scopeKey = await resolveScopeKey();
			const normalizedValue = normalizeValue(value !== null && value !== void 0 ? value : defaultValue);
			await (beforeWrite === null || beforeWrite === void 0 ? void 0 : beforeWrite(normalizedValue, { scopeKey }));
			settingsStorage.write(scopeKey, normalizedValue);
			await (afterWrite === null || afterWrite === void 0 ? void 0 : afterWrite(normalizedValue, { scopeKey }));
			return normalizedValue;
		}
		function readSync(fallbackValue = defaultValue, scopeKey = "") {
			const rawValue = settingsStorage.read(String(scopeKey !== null && scopeKey !== void 0 ? scopeKey : ""), fallbackValue);
			const normalizedValue = normalizeValue(rawValue !== null && rawValue !== void 0 ? rawValue : fallbackValue);
			afterRead === null || afterRead === void 0 || afterRead(normalizedValue, {
				scopeKey: String(scopeKey !== null && scopeKey !== void 0 ? scopeKey : ""),
				rawValue
			});
			return normalizedValue;
		}
		function writeSync(value, scopeKey = "") {
			const normalizedValue = normalizeValue(value !== null && value !== void 0 ? value : defaultValue);
			beforeWrite === null || beforeWrite === void 0 || beforeWrite(normalizedValue, { scopeKey: String(scopeKey !== null && scopeKey !== void 0 ? scopeKey : "") });
			settingsStorage.write(String(scopeKey !== null && scopeKey !== void 0 ? scopeKey : ""), normalizedValue);
			afterWrite === null || afterWrite === void 0 || afterWrite(normalizedValue, { scopeKey: String(scopeKey !== null && scopeKey !== void 0 ? scopeKey : "") });
			return normalizedValue;
		}
		return {
			read,
			write,
			readSync,
			writeSync,
			normalize: normalizeValue
		};
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/checkPrivateRedeclaration.js
	function _checkPrivateRedeclaration(e, t) {
		if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object");
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/classPrivateMethodInitSpec.js
	function _classPrivateMethodInitSpec(e, a) {
		_checkPrivateRedeclaration(e, a), a.add(e);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/toPrimitive.js
	function toPrimitive(t, r) {
		if ("object" != _typeof(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/assertClassBrand.js
	function _assertClassBrand(e, t, n) {
		if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n;
		throw new TypeError("Private element is not present on this object");
	}
	//#endregion
	//#region src/shared/storage/versioned-storage.ts
	var _VersionedStorage_brand = /* @__PURE__ */ new WeakSet();
	var VersionedStorage = class {
		constructor({ keyPrefix, schemaVersion, migrations = {}, storage = getBrowserLocalStorage(), warn = warnBrowserStorageError }) {
			_classPrivateMethodInitSpec(this, _VersionedStorage_brand);
			_defineProperty(this, "keyPrefix", void 0);
			_defineProperty(this, "schemaVersion", void 0);
			_defineProperty(this, "migrations", void 0);
			_defineProperty(this, "storage", void 0);
			_defineProperty(this, "warn", void 0);
			this.keyPrefix = keyPrefix;
			this.schemaVersion = schemaVersion;
			this.migrations = migrations;
			this.storage = storage;
			this.warn = warn;
		}
		key(userId) {
			return `${this.keyPrefix}${userId}`;
		}
		read(userId, fallbackValue) {
			let rawValue;
			try {
				var _this$storage$getItem, _this$storage;
				rawValue = (_this$storage$getItem = (_this$storage = this.storage) === null || _this$storage === void 0 ? void 0 : _this$storage.getItem(this.key(userId))) !== null && _this$storage$getItem !== void 0 ? _this$storage$getItem : null;
			} catch (error) {
				this.warn("[hwh] versioned storage read failed", error);
				return fallbackValue;
			}
			if (!rawValue) return fallbackValue;
			let parsedValue;
			try {
				parsedValue = JSON.parse(rawValue);
			} catch (_unused) {
				return fallbackValue;
			}
			return _assertClassBrand(_VersionedStorage_brand, this, _migrate).call(this, parsedValue);
		}
		write(userId, value) {
			const envelope = {
				schemaVersion: this.schemaVersion,
				value
			};
			try {
				var _this$storage2;
				(_this$storage2 = this.storage) === null || _this$storage2 === void 0 || _this$storage2.setItem(this.key(userId), JSON.stringify(envelope));
			} catch (error) {
				this.warn("[hwh] versioned storage write failed", error);
			}
		}
		remove(userId) {
			try {
				var _this$storage3;
				(_this$storage3 = this.storage) === null || _this$storage3 === void 0 || _this$storage3.removeItem(this.key(userId));
			} catch (error) {
				this.warn("[hwh] versioned storage remove failed", error);
			}
		}
	};
	function _unwrapValue(value) {
		let currentValue = value;
		for (let index = 0; index < 8; index += 1) {
			if (!currentValue || typeof currentValue !== "object" || !Object.prototype.hasOwnProperty.call(currentValue, "value")) break;
			currentValue = currentValue.value;
		}
		return currentValue;
	}
	function _migrate(rawValue) {
		let currentVersion = Number(rawValue === null || rawValue === void 0 ? void 0 : rawValue.schemaVersion) || 1;
		let currentValue = _assertClassBrand(_VersionedStorage_brand, this, _unwrapValue).call(this, rawValue);
		while (currentVersion < this.schemaVersion) {
			const migration = this.migrations[currentVersion];
			if (typeof migration !== "function") break;
			currentValue = _assertClassBrand(_VersionedStorage_brand, this, _unwrapValue).call(this, migration(currentValue));
			currentVersion += 1;
		}
		return _assertClassBrand(_VersionedStorage_brand, this, _unwrapValue).call(this, currentValue);
	}
	//#endregion
	//#region src/shared/storage/settings-transfer-checklist-contract.ts
	/** Импорт без файла не молча закрывается, а открывает системный picker. */
	function confirmSettingsTransferImport(state, close) {
		if (state.file) {
			close();
			return;
		}
		const requestFile = state.requestFile;
		if (!requestFile) {
			state.submitAfterFileSelection = false;
			return;
		}
		state.submitAfterFileSelection = true;
		requestFile();
	}
	/** Продолжает импорт сразу после файла, выбранного через кнопку подтверждения. */
	function selectSettingsTransferImportFile(state, file, close) {
		state.file = file;
		if (!file) {
			state.submitAfterFileSelection = false;
			return;
		}
		if (!state.submitAfterFileSelection) return;
		state.submitAfterFileSelection = false;
		close();
	}
	function cancelSettingsTransferImportFile(state) {
		state.submitAfterFileSelection = false;
	}
	function normalizeSettingsTransferChecklistOptions(options = []) {
		const normalized = [];
		if (!Array.isArray(options)) return normalized;
		for (const option of options) {
			var _record$label, _record$icon, _record$title;
			if (!option || typeof option !== "object" || Array.isArray(option)) continue;
			const record = option;
			if (record.key == null) continue;
			normalized.push({
				key: String(record.key),
				label: String((_record$label = record.label) !== null && _record$label !== void 0 ? _record$label : record.key),
				icon: String((_record$icon = record.icon) !== null && _record$icon !== void 0 ? _record$icon : "database"),
				checked: record.checked !== false,
				disabled: !!record.disabled,
				title: String((_record$title = record.title) !== null && _record$title !== void 0 ? _record$title : "")
			});
		}
		return normalized;
	}
	//#endregion
	//#region src/shared/ui/lite/icons.ts
	var SYSTEM_EMOJI_BY_ICON = {
		activity: "📈",
		"align-center": "↔️",
		"alert-circle": "⚠️",
		"alert-triangle": "⚠️",
		"arrow-down": "↓",
		"arrow-left": "←",
		"arrow-right": "→",
		"arrow-up": "↑",
		bell: "🔔",
		"bell-ring": "🔔",
		"battery-charging": "🔋",
		"book-open": "📖",
		box: "📦",
		boxes: "🗃️",
		bug: "🐛",
		calculator: "🧮",
		calendar: "📅",
		check: "✓",
		"check-circle": "✅",
		"check-square": "☑️",
		"chevron-down": "⌄",
		"chevron-left": "‹",
		"chevron-right": "›",
		"chevron-up": "⌃",
		"chevrons-down": "⏬",
		"chevrons-up": "⏫",
		"circle-help": "❔",
		"circle-x": "❌",
		clock: "🕒",
		coins: "🪙",
		copy: "📋",
		"corner-right-down": "↳",
		"corner-right-up": "↱",
		download: "⬇️",
		externalLink: "↗",
		"external-link": "↗",
		eye: "👁️",
		"eye-off": "🙈",
		filter: "🔽",
		flask: "🧪",
		"flask-conical": "🧪",
		gem: "💎",
		gear: "⚙️",
		"grip-vertical": "⋮",
		hammer: "🔨",
		help: "❔",
		info: "ℹ️",
		"info-circle": "ℹ️",
		keyboard: "⌨️",
		layers: "🗂️",
		"layers-3": "🗂️",
		library: "📚",
		link: "🔗",
		list: "☷",
		"list-checks": "☑️",
		"list-ordered": "🔢",
		"list-x": "☒",
		mail: "✉️",
		map: "🗺️",
		"map-pin": "📍",
		menu: "☰",
		"message-circle": "💬",
		minus: "−",
		monitor: "🖥️",
		package: "📦",
		"package-check": "📦✅",
		palette: "🎨",
		"panel-top": "🪟",
		"paw-print": "🐾",
		pickaxe: "⛏️",
		play: "▶️",
		plus: "+",
		refresh: "🔄",
		"refresh-cw": "🔄",
		route: "🧭",
		save: "💾",
		search: "🔎",
		scroll: "📜",
		"scroll-text": "📜",
		settings: "⚙️",
		"settings-2": "⚙️",
		shoppingCart: "🛒",
		"shopping-bag": "🛍️",
		"shopping-cart": "🛒",
		shield: "🛡️",
		shirt: "👕",
		shuffle: "🔀",
		sparkles: "✨",
		square: "□",
		star: "⭐",
		swords: "⚔️",
		target: "🎯",
		timer: "⏱️",
		trash: "🗑️",
		"trash-2": "🗑️",
		"triangle-alert": "⚠️",
		upload: "⬆️",
		users: "👥",
		"wallet-cards": "👛",
		x: "✕",
		zap: "⚡"
	};
	function renderIcon(name, options = {}) {
		return renderSystemEmoji(name, options);
	}
	function renderIconLabel(name, label, options = {}) {
		return `<span class="${escapeHtml(["hwhx-icon-label", options.className].filter(Boolean).join(" "))}">${renderSystemEmoji(name, {
			className: options.iconClassName,
			title: options.title
		})} <span>${escapeHtml(label)}</span></span>`;
	}
	function renderSystemEmoji(name, options = {}) {
		var _SYSTEM_EMOJI_BY_ICON, _options$title;
		const emoji = (_SYSTEM_EMOJI_BY_ICON = SYSTEM_EMOJI_BY_ICON[String(name !== null && name !== void 0 ? name : "")]) !== null && _SYSTEM_EMOJI_BY_ICON !== void 0 ? _SYSTEM_EMOJI_BY_ICON : "";
		if (!emoji) return "";
		const className = [
			"hwhx-lite-glyph",
			"hwhx-emoji-icon",
			options.className
		].filter(Boolean).join(" ");
		const title = String((_options$title = options.title) !== null && _options$title !== void 0 ? _options$title : "").trim();
		const titleAttribute = title ? ` data-hwhx-native-title="${escapeHtml(title)}"` : "";
		const size = Math.max(10, Math.min(32, Number(options.size) || 16));
		return `<span class="${escapeHtml(className)}" aria-hidden="true"${titleAttribute} style="font-size:${size}px">${emoji}</span>`;
	}
	//#endregion
	//#region src/shared/ui/native/view.ts
	function defineNativeView(kind, render) {
		return Object.freeze({
			kind,
			render
		});
	}
	function renderNativeView(view, props, context) {
		if (isNativeView(view)) return view.render(asPlainRecord$2(props), context);
		const fallback = document.createElement("div");
		fallback.className = "hwhx-native-body hwhx-empty-state";
		fallback.textContent = "Этот экран недоступен в Lite-сборке.";
		return fallback;
	}
	function isNativeView(value) {
		return value !== null && typeof value === "object" && typeof value.render === "function";
	}
	//#endregion
	//#region src/shared/ui/native/modal.ts
	/** Держит нативную Lite-модалку в том же контракте действий, что и Vue-модалку. */
	function resolveNativeModalActionEffect(action, headerAction) {
		if (headerAction) return action.closeOnClick === true ? {
			notifyAction: false,
			close: true
		} : {
			notifyAction: true,
			close: false
		};
		return {
			notifyAction: true,
			close: action.closeOnClick !== false
		};
	}
	var activeModal = null;
	var nativeModalSequence = 0;
	function initializeNativeUi() {
		ensureSharedUiBaseStyles();
		ensureSharedUiComponentStyles();
	}
	function openNativeComponentModal(options) {
		initializeNativeUi();
		closeNativeModal(false);
		return new Promise((resolve) => {
			var _options$kind, _options$uiTheme;
			const overlay = document.createElement("div");
			overlay.className = [
				"hwhx-modal",
				"hwhx-build-lite",
				options.className
			].filter(Boolean).join(" ");
			overlay.dataset.hwhxBuildProfile = "lite";
			overlay.dataset.hwhxModalKind = (_options$kind = options.kind) !== null && _options$kind !== void 0 ? _options$kind : "generic";
			overlay.dataset.hwhxUiTheme = (_options$uiTheme = options.uiTheme) !== null && _options$uiTheme !== void 0 ? _options$uiTheme : "classic";
			const dialog = document.createElement("section");
			dialog.className = "hwhx-modal__dialog";
			dialog.setAttribute("role", "dialog");
			dialog.setAttribute("aria-modal", "true");
			dialog.tabIndex = -1;
			overlay.appendChild(dialog);
			const state = {
				actions: normalizeActions(options.actions),
				dialog,
				footer: null,
				keydown: () => void 0,
				onAction: options.onAction,
				onBeforeClose: options.onBeforeClose,
				overlay,
				resolve
			};
			activeModal = state;
			dialog.appendChild(buildHeader(options, state));
			const body = document.createElement("div");
			body.className = "hwhx-modal__body";
			body.appendChild(renderNativeView(options.component, options.props, { close: closeNativeModal }));
			dialog.appendChild(body);
			renderFooter(state);
			overlay.addEventListener("pointerdown", (event) => {
				if (event.target === overlay) closeNativeModal(false);
			});
			state.keydown = (event) => {
				if (event.key !== "Escape" || activeModal !== state) return;
				event.preventDefault();
				event.stopPropagation();
				closeNativeModal(false);
			};
			document.addEventListener("keydown", state.keydown, true);
			document.body.appendChild(overlay);
			queueMicrotask(() => dialog.focus({ preventScroll: true }));
		});
	}
	function closeNativeModal(result = false) {
		var _state$onBeforeClose;
		const state = activeModal;
		if (!state) return;
		activeModal = null;
		document.removeEventListener("keydown", state.keydown, true);
		state.overlay.remove();
		const transformedResult = (_state$onBeforeClose = state.onBeforeClose) === null || _state$onBeforeClose === void 0 ? void 0 : _state$onBeforeClose.call(state, result);
		state.resolve(transformedResult === void 0 ? result : transformedResult);
	}
	function buildHeader(options, state) {
		const header = document.createElement("header");
		header.className = "hwhx-modal__header";
		const identity = document.createElement("div");
		identity.className = "hwhx-modal__identity";
		const title = document.createElement("strong");
		title.className = "hwhx-modal__title";
		title.id = `hwhx-native-modal-title-${++nativeModalSequence}`;
		title.textContent = readHeaderTitle(options.header) || options.title || "";
		state.dialog.setAttribute("aria-labelledby", title.id);
		identity.appendChild(title);
		appendHeaderBadges(identity, options.header);
		appendHeaderAuthors(identity, options.header);
		header.appendChild(identity);
		const toolbar = document.createElement("div");
		toolbar.className = "hwhx-modal__toolbar";
		for (const action of normalizeActions(options.headerActions)) toolbar.appendChild(buildActionButton(action, state, true));
		const closeButton = document.createElement("button");
		closeButton.type = "button";
		closeButton.className = "hwhx-button hwhx-modal__close";
		closeButton.dataset.tone = "danger";
		closeButton.textContent = "×";
		closeButton.ariaLabel = options.closeLabel || (getSharedUiLanguage() === "ru" ? "Закрыть" : "Close");
		closeButton.addEventListener("click", () => closeNativeModal(false));
		toolbar.appendChild(closeButton);
		header.appendChild(toolbar);
		return header;
	}
	function appendHeaderBadges(container, header) {
		const badges = asPlainRecord$2(header).badges;
		if (!Array.isArray(badges) || badges.length === 0) return;
		const badgeRoot = document.createElement("div");
		badgeRoot.className = "hwhx-modal__meta";
		for (const value of badges) {
			var _badge$tone, _badge$label;
			const badge = asPlainRecord$2(value);
			const element = document.createElement("span");
			element.className = "hwhx-modal-badge";
			element.dataset.tone = String((_badge$tone = badge.tone) !== null && _badge$tone !== void 0 ? _badge$tone : "gray");
			element.textContent = String((_badge$label = badge.label) !== null && _badge$label !== void 0 ? _badge$label : "");
			if (badge.title) element.dataset.hwhxNativeTitle = String(badge.title);
			badgeRoot.appendChild(element);
		}
		container.appendChild(badgeRoot);
	}
	function appendHeaderAuthors(container, header) {
		const authors = asPlainRecord$2(header).authors;
		if (!Array.isArray(authors) || authors.length === 0) return;
		const group = document.createElement("div");
		group.className = "hwhx-avatar-group hwhx-modal__authors";
		for (const value of authors) {
			var _author$label, _Array$from$0$toLocal, _Array$from$;
			const author = asPlainRecord$2(value);
			const label = String((_author$label = author.label) !== null && _author$label !== void 0 ? _author$label : "?").trim() || "?";
			const href = normalizeExternalUrl(author.href);
			const tone = author.tone === "helper" ? "helper" : "script";
			const avatar = document.createElement(href ? "a" : "span");
			avatar.className = `hwhx-avatar hwhx-avatar--${tone}`;
			avatar.textContent = (_Array$from$0$toLocal = (_Array$from$ = Array.from(label)[0]) === null || _Array$from$ === void 0 ? void 0 : _Array$from$.toLocaleUpperCase()) !== null && _Array$from$0$toLocal !== void 0 ? _Array$from$0$toLocal : "?";
			avatar.ariaLabel = label;
			avatar.dataset.hwhxNativeTitle = label;
			if (href) {
				const link = avatar;
				link.href = href;
				link.target = "_blank";
				link.rel = "noopener noreferrer";
			}
			group.appendChild(avatar);
		}
		container.appendChild(group);
	}
	function renderFooter(state) {
		var _state$footer;
		(_state$footer = state.footer) === null || _state$footer === void 0 || _state$footer.remove();
		state.footer = null;
		if (state.actions.length === 0) return;
		const footer = document.createElement("footer");
		footer.className = "hwhx-modal__actions";
		const left = document.createElement("div");
		left.className = "hwhx-modal__actions-side hwhx-modal__actions-side--left";
		const right = document.createElement("div");
		right.className = "hwhx-modal__actions-side hwhx-modal__actions-side--right";
		for (const action of state.actions) (action.placement === "left" ? left : right).appendChild(buildActionButton(action, state, false));
		footer.append(left, right);
		state.dialog.appendChild(footer);
		state.footer = footer;
	}
	function buildActionButton(action, state, headerAction) {
		var _action$tone;
		const button = document.createElement("button");
		button.type = "button";
		button.className = "hwhx-button hwhx-button--modal";
		button.dataset.action = action.result;
		button.dataset.tone = (_action$tone = action.tone) !== null && _action$tone !== void 0 ? _action$tone : "secondary";
		button.disabled = !!action.disabled || !!action.loading;
		button.classList.toggle("hwhx-button--icon-only", !!action.iconOnly);
		const icon = action.loading ? "refresh-cw" : action.icon;
		if (icon) button.insertAdjacentHTML("beforeend", renderIcon(icon, {
			size: 16,
			className: "hwhx-button__icon"
		}));
		if (!action.iconOnly || !icon) {
			const label = document.createElement("span");
			label.className = "hwhx-button__label";
			label.textContent = action.loading ? "…" : action.label;
			button.appendChild(label);
		}
		const tooltip = action.tooltip || action.title;
		button.ariaLabel = tooltip || action.label;
		if (tooltip) button.dataset.hwhxNativeTitle = tooltip;
		button.addEventListener("click", () => {
			var _state$onAction;
			if (button.disabled || activeModal !== state) return;
			const effect = resolveNativeModalActionEffect(action, headerAction);
			if (effect.notifyAction) (_state$onAction = state.onAction) === null || _state$onAction === void 0 || _state$onAction.call(state, action.result);
			if (effect.close) closeNativeModal(action.result);
		});
		return button;
	}
	function normalizeActions(value) {
		return Array.isArray(value) ? value.filter((action) => action !== null && typeof action === "object" && typeof action.result === "string") : [];
	}
	function readHeaderTitle(header) {
		var _asPlainRecord$title;
		return String((_asPlainRecord$title = asPlainRecord$2(header).title) !== null && _asPlainRecord$title !== void 0 ? _asPlainRecord$title : "").trim();
	}
	function normalizeExternalUrl(value) {
		try {
			const url = new URL(String(value !== null && value !== void 0 ? value : "").trim());
			return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
		} catch (_unused) {
			return "";
		}
	}
	//#endregion
	//#region src/shared/storage/lite/settings-transfer-checklist.ts
	var NativeSettingsTransferChecklist = defineNativeView("settings-transfer-checklist", renderSettingsTransferChecklist);
	async function openSettingsTransferChecklist({ title = "Выберите блоки", options = [], mode = "export", confirmLabel = "Продолжить", cancelLabel = "Отмена", fileLabel = "JSON файл", searchPlaceholder = "Поиск", emptyLabel = "Ничего не найдено" } = {}) {
		const normalizedOptions = normalizeSettingsTransferChecklistOptions(options);
		const state = { selectedKeys: normalizedOptions.filter((option) => option.checked && !option.disabled).map((option) => option.key) };
		state.onFileSelected = (file) => selectSettingsTransferImportFile(state, file, () => closeNativeModal("confirm"));
		state.onFileSelectionCanceled = () => cancelSettingsTransferImportFile(state);
		return await openNativeComponentModal({
			title,
			kind: "checklist",
			className: "hwhx-modal--checklist",
			component: NativeSettingsTransferChecklist,
			props: {
				state,
				mode,
				fileLabel,
				searchPlaceholder,
				emptyLabel,
				options: normalizedOptions
			},
			actions: [{
				result: "cancel",
				label: cancelLabel,
				tone: "danger"
			}, {
				result: "confirm",
				label: confirmLabel,
				tone: "success",
				closeOnClick: mode !== "import"
			}],
			onAction: (result) => {
				if (mode === "import" && result === "confirm") confirmSettingsTransferImport(state, () => closeNativeModal("confirm"));
			}
		}) === "confirm" ? {
			confirmed: true,
			selectedKeys: state.selectedKeys,
			file: state.file
		} : {
			confirmed: false,
			selectedKeys: []
		};
	}
	function renderSettingsTransferChecklist(props) {
		var _props$searchPlacehol;
		const state = props.state;
		const options = props.options;
		const root = document.createElement("div");
		root.className = "hwhx-settings-transfer-checklist";
		if (props.mode === "import") {
			var _props$fileLabel;
			root.appendChild(buildFilePicker(state, String((_props$fileLabel = props.fileLabel) !== null && _props$fileLabel !== void 0 ? _props$fileLabel : "JSON файл")));
		}
		const search = document.createElement("input");
		search.type = "search";
		search.className = "hwhx-input hwhx-settings-transfer-checklist__search";
		search.placeholder = String((_props$searchPlacehol = props.searchPlaceholder) !== null && _props$searchPlacehol !== void 0 ? _props$searchPlacehol : "Поиск");
		root.appendChild(search);
		const list = document.createElement("div");
		list.className = "hwhx-checkbox-list";
		root.appendChild(list);
		const renderList = () => {
			const query = search.value.trim().toLocaleLowerCase();
			list.replaceChildren();
			let visibleCount = 0;
			for (const option of options) {
				if (query && !option.label.toLocaleLowerCase().includes(query)) continue;
				list.appendChild(buildChecklistRow(option, state));
				visibleCount += 1;
			}
			if (visibleCount === 0) {
				var _props$emptyLabel;
				const empty = document.createElement("div");
				empty.className = "hwhx-empty-state";
				empty.textContent = String((_props$emptyLabel = props.emptyLabel) !== null && _props$emptyLabel !== void 0 ? _props$emptyLabel : "Ничего не найдено");
				list.appendChild(empty);
			}
		};
		search.addEventListener("input", renderList);
		renderList();
		return root;
	}
	function buildFilePicker(state, label) {
		const field = document.createElement("label");
		field.className = "hwhx-settings-field";
		const caption = document.createElement("span");
		caption.textContent = label;
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "application/json,.json";
		input.addEventListener("change", () => {
			var _state$onFileSelected, _input$files;
			(_state$onFileSelected = state.onFileSelected) === null || _state$onFileSelected === void 0 || _state$onFileSelected.call(state, (_input$files = input.files) === null || _input$files === void 0 ? void 0 : _input$files[0]);
		});
		input.addEventListener("cancel", () => {
			var _state$onFileSelectio;
			return (_state$onFileSelectio = state.onFileSelectionCanceled) === null || _state$onFileSelectio === void 0 ? void 0 : _state$onFileSelectio.call(state);
		});
		state.requestFile = () => {
			if (typeof input.showPicker === "function") try {
				input.showPicker();
				return;
			} catch (_unused) {}
			input.click();
		};
		field.append(caption, input);
		return field;
	}
	function buildChecklistRow(option, state) {
		const row = document.createElement("label");
		row.className = "hwhx-checkbox-list__item";
		if (option.title) row.dataset.hwhxNativeTitle = option.title;
		const input = document.createElement("input");
		input.type = "checkbox";
		input.disabled = !!option.disabled;
		input.checked = state.selectedKeys.includes(option.key);
		input.addEventListener("change", () => {
			const selected = new Set(state.selectedKeys);
			if (input.checked) selected.add(option.key);
			else selected.delete(option.key);
			state.selectedKeys = [...selected];
		});
		const label = document.createElement("span");
		label.textContent = option.label;
		row.append(input, label);
		return row;
	}
	//#endregion
	//#region src/shared/storage/settings-transfer.ts
	var SETTINGS_DOWNLOAD_MESSAGE_TYPE = "hwhx:settings-transfer:download-json";
	var SETTINGS_DOWNLOAD_BRIDGE_FLAG = "__hwhxSettingsDownloadBridgeInstalled";
	var SETTINGS_DOWNLOAD_MAX_CONTENT_LENGTH = 10 * 1024 * 1024;
	var OPAQUE_ORIGIN = "null";
	function textOrFallback(value, fallback) {
		return value == null ? fallback : String(value);
	}
	/**
	* Строит payload для экспорта настроек с метаданными.
	*/
	function buildSettingsExportPayload({ scriptId, scriptName, scriptVersion = "", exportVersion, storageSchemaVersion, userId = void 0, data, extra = {} }) {
		return {
			scriptId: String(scriptId !== null && scriptId !== void 0 ? scriptId : ""),
			scriptName: String(scriptName !== null && scriptName !== void 0 ? scriptName : ""),
			scriptVersion: String(scriptVersion !== null && scriptVersion !== void 0 ? scriptVersion : ""),
			exportVersion,
			storageSchemaVersion,
			exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
			...userId === void 0 ? {} : { userId: String(userId) },
			...extra,
			data
		};
	}
	/**
	* Проверяет, что текущий документ работает внутри iframe.
	*/
	function isNestedWindow() {
		try {
			return globalThis.self !== globalThis.top;
		} catch (_unused) {
			return true;
		}
	}
	function normalizeOrigin(value) {
		const text = String(value !== null && value !== void 0 ? value : "").trim();
		if (!text || text === OPAQUE_ORIGIN) return "";
		try {
			const origin = new URL(text).origin;
			return origin === OPAQUE_ORIGIN ? "" : origin;
		} catch (_unused2) {
			return "";
		}
	}
	function getCurrentWindowOrigin() {
		var _globalThis$location, _globalThis$location2;
		return normalizeOrigin((_globalThis$location = globalThis.location) === null || _globalThis$location === void 0 ? void 0 : _globalThis$location.origin) || normalizeOrigin((_globalThis$location2 = globalThis.location) === null || _globalThis$location2 === void 0 ? void 0 : _globalThis$location2.href);
	}
	function getAncestorOrigins() {
		const locationWithAncestors = globalThis.location;
		const ancestorOrigins = locationWithAncestors === null || locationWithAncestors === void 0 ? void 0 : locationWithAncestors.ancestorOrigins;
		if (!ancestorOrigins) return [];
		return Array.from({ length: ancestorOrigins.length }, (_, index) => normalizeOrigin(ancestorOrigins[index])).filter(Boolean);
	}
	function getReferrerOrigin() {
		try {
			return normalizeOrigin(document.referrer);
		} catch (_unused3) {
			return "";
		}
	}
	function getTrustedAncestorOrigin() {
		return getAncestorOrigins()[0] || getReferrerOrigin();
	}
	function isTrustedSettingsDownloadOrigin(origin) {
		const normalizedOrigin = normalizeOrigin(origin);
		return !!(normalizedOrigin && [
			getCurrentWindowOrigin(),
			getReferrerOrigin(),
			...getAncestorOrigins()
		].includes(normalizedOrigin));
	}
	function isKnownChildWindow(source) {
		if (!source) return false;
		try {
			for (const frame of document.querySelectorAll("iframe")) if (frame.contentWindow === source) return true;
		} catch (_unused4) {}
		return false;
	}
	/**
	* Нормализует имя скачиваемого JSON, чтобы postMessage не протащил путь.
	*/
	function normalizeDownloadFileName(fileName) {
		const safeName = String(fileName !== null && fileName !== void 0 ? fileName : "settings.json").trim().replaceAll(/[\\/:*?"<>|]+/g, "_") || "settings.json";
		return safeName.toLowerCase().endsWith(".json") ? safeName : `${safeName}.json`;
	}
	/**
	* Скачивает текстовый файл через временный <a>-элемент.
	*/
	function downloadTextFile(fileName, content, mimeType) {
		const blob = new globalThis.Blob([content], { type: mimeType });
		const url = globalThis.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = normalizeDownloadFileName(fileName);
		link.style.display = "none";
		document.body.appendChild(link);
		link.click();
		link.remove();
		globalThis.setTimeout(() => globalThis.URL.revokeObjectURL(url), 1e3);
	}
	/**
	* Проверяет, что bridge несет именно JSON, а не произвольный текст.
	*/
	function isSafeSettingsDownloadContent(value) {
		if (typeof value !== "string" || value.length === 0 || value.length > SETTINGS_DOWNLOAD_MAX_CONTENT_LENGTH) return false;
		try {
			JSON.parse(value);
			return true;
		} catch (_unused5) {
			return false;
		}
	}
	/**
	* Проверяет сообщение bridge-а экспорта настроек.
	*/
	function isSettingsDownloadMessage(value) {
		const message = value;
		return !!message && message.hwhx === "settings-transfer" && message.type === SETTINGS_DOWNLOAD_MESSAGE_TYPE && isSafeSettingsDownloadContent(message.content);
	}
	function isTrustedSettingsDownloadEvent(event) {
		if (!isSettingsDownloadMessage(event.data)) return false;
		const source = event.source;
		if (!source || source === globalThis) return false;
		if (isKnownChildWindow(source)) return true;
		return isTrustedSettingsDownloadOrigin(event.origin);
	}
	/**
	* Ставит bridge для скачивания из top-window. В sandboxed iframe браузер режет
	* <a download>, поэтому сам файл должен скачать несандбоксенный родитель.
	*/
	function installSettingsDownloadBridge() {
		if (isNestedWindow()) return;
		const state = globalThis;
		if (state[SETTINGS_DOWNLOAD_BRIDGE_FLAG]) return;
		state[SETTINGS_DOWNLOAD_BRIDGE_FLAG] = true;
		globalThis.addEventListener("message", (event) => {
			if (isNestedWindow() || !isTrustedSettingsDownloadEvent(event)) return;
			downloadTextFile(event.data.fileName, event.data.content, "application/json;charset=utf-8");
		});
	}
	/**
	* Просит top-window скачать JSON-файл, если текущий документ в iframe.
	*/
	function requestTopWindowJsonDownload(fileName, content) {
		if (!isNestedWindow()) return false;
		const targetOrigin = getTrustedAncestorOrigin();
		if (!targetOrigin) return false;
		try {
			var _globalThis$top;
			(_globalThis$top = globalThis.top) === null || _globalThis$top === void 0 || _globalThis$top.postMessage({
				hwhx: "settings-transfer",
				type: SETTINGS_DOWNLOAD_MESSAGE_TYPE,
				fileName,
				content
			}, targetOrigin);
			return true;
		} catch (_unused6) {
			return false;
		}
	}
	/**
	* Скачивает JSON-файл напрямую или через top-window bridge для sandboxed iframe.
	*/
	function downloadJsonFile(fileName, value) {
		const content = `${JSON.stringify(value, null, 2)}\n`;
		installSettingsDownloadBridge();
		if (requestTopWindowJsonDownload(fileName, content)) return;
		downloadTextFile(fileName, content, "application/json;charset=utf-8");
	}
	/**
	* Читает содержимое File как текст через file.text() или FileReader.
	*/
	function readFileText(file) {
		if (!file) return Promise.resolve(void 0);
		if (typeof file.text === "function") return file.text();
		return new Promise((resolve, reject) => {
			const reader = new globalThis.FileReader();
			reader.addEventListener("load", () => {
				var _reader$result;
				return resolve(String((_reader$result = reader.result) !== null && _reader$result !== void 0 ? _reader$result : ""));
			});
			reader.addEventListener("error", () => reject(reader.error));
			reader.readAsText(file);
		});
	}
	function normalizeTransferOptions(options = []) {
		return (Array.isArray(options) ? options : []).flatMap((option) => {
			var _optionRecord$label, _optionRecord$icon, _optionRecord$title;
			const optionRecord = asPlainRecordOrNull(option);
			if (!optionRecord || optionRecord.key == null) return [];
			return [{
				key: String(optionRecord.key),
				label: String((_optionRecord$label = optionRecord.label) !== null && _optionRecord$label !== void 0 ? _optionRecord$label : optionRecord.key),
				icon: String((_optionRecord$icon = optionRecord.icon) !== null && _optionRecord$icon !== void 0 ? _optionRecord$icon : "database"),
				checked: optionRecord.checked !== false,
				title: String((_optionRecord$title = optionRecord.title) !== null && _optionRecord$title !== void 0 ? _optionRecord$title : "")
			}];
		});
	}
	function getPayloadDataKeys(payload) {
		const payloadRecord = asPlainRecordOrNull(payload);
		const dataRecord = asPlainRecordOrNull(payloadRecord === null || payloadRecord === void 0 ? void 0 : payloadRecord.data);
		return dataRecord ? Object.keys(dataRecord) : [];
	}
	function buildFallbackTransferOptions(keys) {
		return (Array.isArray(keys) ? keys : []).map((key) => ({
			key: String(key),
			label: String(key),
			icon: "database",
			checked: true,
			title: ""
		}));
	}
	function filterSettingsTransferPayloadData(payload, selectedKeys = []) {
		const payloadRecord = asPlainRecordOrNull(payload);
		const dataRecord = asPlainRecordOrNull(payloadRecord === null || payloadRecord === void 0 ? void 0 : payloadRecord.data);
		if (!payloadRecord || !dataRecord) return payload;
		return {
			...payloadRecord,
			data: Object.fromEntries(Object.entries(dataRecord).filter(([key]) => selectedKeys.includes(key)))
		};
	}
	function getTransferLabels(labels = {}, mode = "export") {
		var _labels$searchPlaceho, _labels$empty;
		const isExport = mode === "export";
		return {
			title: textOrFallback(labels[isExport ? "exportSelectTitle" : "importSelectTitle"], isExport ? "Выберите блоки для экспорта" : "Выберите блоки для импорта"),
			confirmLabel: textOrFallback(labels[isExport ? "exportSelectConfirm" : "importSelectConfirm"], isExport ? "Экспортировать" : "Импортировать"),
			cancelLabel: textOrFallback(labels.cancel, "Отмена"),
			fileLabel: textOrFallback(labels.importFileLabel, "JSON файл"),
			searchPlaceholder: textOrFallback((_labels$searchPlaceho = labels.searchPlaceholder) !== null && _labels$searchPlaceho !== void 0 ? _labels$searchPlaceho : labels.search, "Поиск"),
			clearSearchLabel: textOrFallback(labels.clearSearch, "Очистить поиск"),
			emptyLabel: textOrFallback((_labels$empty = labels.empty) !== null && _labels$empty !== void 0 ? _labels$empty : labels.noOptions, "Ничего не найдено"),
			selectAllLabel: textOrFallback(labels.selectAll, "Выбрать все"),
			clearAllLabel: textOrFallback(labels.clearAll, "Снять все"),
			sortLabel: textOrFallback(labels.sort, "Сортировка"),
			sortByLabelLabel: textOrFallback(labels.sortByLabel, "По названию"),
			sortSelectedLabel: textOrFallback(labels.sortSelected, "Выбранные сверху"),
			sortAscendingLabel: textOrFallback(labels.sortAsc, "По возрастанию"),
			sortDescendingLabel: textOrFallback(labels.sortDesc, "По убыванию")
		};
	}
	function buildTransferChecklistProps(modalLabels, uiTheme) {
		return {
			uiTheme,
			searchPlaceholder: modalLabels.searchPlaceholder,
			clearSearchLabel: modalLabels.clearSearchLabel,
			emptyLabel: modalLabels.emptyLabel,
			selectAllLabel: modalLabels.selectAllLabel,
			clearAllLabel: modalLabels.clearAllLabel,
			sortLabel: modalLabels.sortLabel,
			sortAscendingLabel: modalLabels.sortAscendingLabel,
			sortDescendingLabel: modalLabels.sortDescendingLabel,
			sortOptions: [{
				value: "label",
				label: modalLabels.sortByLabelLabel,
				icon: "align-center"
			}, {
				value: "selected",
				label: modalLabels.sortSelectedLabel,
				icon: "check"
			}],
			sortWidthPx: 210
		};
	}
	async function selectExportKeys(payload, options = [], labels = {}, uiTheme = void 0, alwaysShowChecklist = false) {
		const normalizedOptions = normalizeTransferOptions(options);
		const checklistOptions = normalizedOptions.length > 0 ? normalizedOptions : buildFallbackTransferOptions(getPayloadDataKeys(payload));
		if (!alwaysShowChecklist && checklistOptions.length <= 1) return checklistOptions.map((option) => option.key);
		const modalLabels = getTransferLabels(labels, "export");
		const result = await openSettingsTransferChecklist({
			title: modalLabels.title,
			options: checklistOptions,
			mode: "export",
			confirmLabel: modalLabels.confirmLabel,
			cancelLabel: modalLabels.cancelLabel,
			...buildTransferChecklistProps(modalLabels, uiTheme)
		});
		return result.confirmed ? result.selectedKeys : void 0;
	}
	async function pickImportTextAndKeys({ parsedValue, options = [], labels = {}, uiTheme = void 0, alwaysShowChecklist = false }) {
		const dataKeys = getPayloadDataKeys(parsedValue);
		const availableKeySet = new Set(dataKeys);
		const normalizedOptions = normalizeTransferOptions(options);
		const checklistOptions = normalizedOptions.length > 0 ? normalizedOptions.map((option) => ({
			...option,
			checked: option.checked !== false && availableKeySet.has(option.key),
			disabled: !availableKeySet.has(option.key)
		})) : buildFallbackTransferOptions(dataKeys);
		if (!alwaysShowChecklist && checklistOptions.length <= 1) return dataKeys;
		const modalLabels = getTransferLabels(labels, "import");
		const result = await openSettingsTransferChecklist({
			title: modalLabels.title,
			options: checklistOptions,
			mode: "export",
			confirmLabel: modalLabels.confirmLabel,
			cancelLabel: modalLabels.cancelLabel,
			...buildTransferChecklistProps(modalLabels, uiTheme)
		});
		return result.confirmed ? result.selectedKeys : void 0;
	}
	async function pickImportFileTextAndKeys(options = [], labels = {}, uiTheme = void 0) {
		const normalizedOptions = normalizeTransferOptions(options);
		const modalLabels = getTransferLabels(labels, "import");
		const result = await openSettingsTransferChecklist({
			title: modalLabels.title,
			options: normalizedOptions,
			mode: "import",
			confirmLabel: modalLabels.confirmLabel,
			cancelLabel: modalLabels.cancelLabel,
			fileLabel: modalLabels.fileLabel,
			...buildTransferChecklistProps(modalLabels, uiTheme)
		});
		if (!result.confirmed || result.selectedKeys.length === 0) return {
			fileText: void 0,
			selectedKeys: void 0
		};
		return {
			fileText: await readFileText(result.file),
			selectedKeys: result.selectedKeys
		};
	}
	/**
	* Парсит JSON-текст, бросает ошибку через errorFactory при неудаче.
	*/
	function parseJsonText(fileText, errorFactory) {
		try {
			return JSON.parse(String(fileText !== null && fileText !== void 0 ? fileText : ""));
		} catch (_unused7) {
			if (typeof errorFactory === "function") throw errorFactory();
			throw new Error("Invalid JSON.");
		}
	}
	/**
	* Создаёт контроллер экспорта/импорта настроек с чеклистом выбора блоков.
	*/
	function createSettingsTransferController({ buildPayload, buildFileName, parseImport, applyImport, showNotice = () => {}, labels = {}, exportOptions = [], importOptions = exportOptions, filterImportPayload = filterSettingsTransferPayloadData, uiTheme = void 0, alwaysShowChecklist = false } = {}) {
		async function exportToJson(...args) {
			if (typeof buildPayload !== "function" || typeof buildFileName !== "function") throw new Error("Settings export requires buildPayload and buildFileName.");
			const exportPayload = await buildPayload(...args);
			const selectedKeys = await selectExportKeys(exportPayload, exportOptions, labels, uiTheme, alwaysShowChecklist);
			if (!(selectedKeys === null || selectedKeys === void 0 ? void 0 : selectedKeys.length)) return false;
			const filteredPayload = filterSettingsTransferPayloadData(exportPayload, selectedKeys);
			downloadJsonFile(buildFileName(filteredPayload), filteredPayload);
			await showNotice(labels.exportDone, { phase: "export" });
			return filteredPayload;
		}
		async function importFromJson(...args) {
			var _importPick$selectedK;
			if (typeof parseImport !== "function" || typeof applyImport !== "function") throw new Error("Settings import requires parseImport and applyImport.");
			const importPick = await pickImportFileTextAndKeys(importOptions, labels, uiTheme);
			const fileText = importPick.fileText;
			if (fileText === void 0 || fileText === "") return false;
			const parsedValue = parseJsonText(fileText, labels.parseError ? () => new Error(String(labels.parseError)) : void 0);
			const selectedKeys = (_importPick$selectedK = importPick.selectedKeys) !== null && _importPick$selectedK !== void 0 ? _importPick$selectedK : await pickImportTextAndKeys({
				parsedValue,
				options: importOptions,
				labels,
				uiTheme,
				alwaysShowChecklist
			});
			if (!(selectedKeys === null || selectedKeys === void 0 ? void 0 : selectedKeys.length)) return false;
			await applyImport(await parseImport(filterImportPayload(parsedValue, selectedKeys), ...args), ...args);
			await showNotice(labels.importDone, { phase: "import" });
			return true;
		}
		return {
			exportToJson,
			importFromJson
		};
	}
	//#endregion
	//#region src/shared/ui/preferences.ts
	function getSharedUiRuntime$1() {
		return globalThis.HWHSharedUI && typeof globalThis.HWHSharedUI === "object" ? globalThis.HWHSharedUI : void 0;
	}
	var tooltipsEnabled = true;
	function setTooltipsEnabled(value) {
		tooltipsEnabled = value !== false;
		const sharedUi = getSharedUiRuntime$1();
		if (sharedUi) sharedUi.tooltipsEnabled = tooltipsEnabled;
		return tooltipsEnabled;
	}
	/** Константа: мгновенная автопрокрутка (без анимации). */
	var ACCORDION_AUTO_SCROLL_MODE_INSTANT = "instant";
	/** Константа: плавная автопрокрутка. */
	var ACCORDION_AUTO_SCROLL_MODE_SMOOTH = "smooth";
	var ACCORDION_AUTO_SCROLL_MODES = /* @__PURE__ */ new Set([
		"off",
		ACCORDION_AUTO_SCROLL_MODE_INSTANT,
		ACCORDION_AUTO_SCROLL_MODE_SMOOTH
	]);
	var accordionAutoScrollMode = ACCORDION_AUTO_SCROLL_MODE_SMOOTH;
	function isAccordionAutoScrollMode(value) {
		return ACCORDION_AUTO_SCROLL_MODES.has(value);
	}
	function getSharedUiRuntime() {
		return globalThis.HWHSharedUI && typeof globalThis.HWHSharedUI === "object" ? globalThis.HWHSharedUI : void 0;
	}
	/**
	* Нормализует значение режима автопрокрутки: off/instant/smooth, включая булевы и строковые синонимы.
	* @param {*} value
	* @param {string} [fallbackValue="smooth"]
	* @returns {string}
	*/
	function normalizeAccordionAutoScrollMode(value, fallbackValue = ACCORDION_AUTO_SCROLL_MODE_SMOOTH) {
		if (value === false) return "off";
		if (value === true) return ACCORDION_AUTO_SCROLL_MODE_SMOOTH;
		const normalizedValue = String(value !== null && value !== void 0 ? value : "").trim().toLowerCase();
		if (isAccordionAutoScrollMode(normalizedValue)) return normalizedValue;
		if ([
			"0",
			"disabled",
			"false",
			"none",
			"no"
		].includes(normalizedValue)) return "off";
		if ([
			"1",
			"auto",
			"enabled",
			"on",
			"true",
			"yes"
		].includes(normalizedValue)) return ACCORDION_AUTO_SCROLL_MODE_SMOOTH;
		const normalizedFallback = String(fallbackValue !== null && fallbackValue !== void 0 ? fallbackValue : "").trim().toLowerCase();
		return isAccordionAutoScrollMode(normalizedFallback) ? normalizedFallback : ACCORDION_AUTO_SCROLL_MODE_SMOOTH;
	}
	/**
	* Устанавливает режим автопрокрутки аккордеона.
	* @param {*} value
	* @returns {string}
	*/
	function setAccordionAutoScrollMode(value) {
		accordionAutoScrollMode = normalizeAccordionAutoScrollMode(value);
		const sharedUi = getSharedUiRuntime();
		if (sharedUi) sharedUi.accordionAutoScrollMode = accordionAutoScrollMode;
		return accordionAutoScrollMode;
	}
	//#endregion
	//#region src/shared/ui/reorder-list-variant.ts
	var REORDER_LIST_VARIANT_FULL = "full";
	function normalizeReorderListVariant(value, fallback = REORDER_LIST_VARIANT_FULL) {
		return value === "minimal" || value === "full" ? value : fallback === "minimal" || fallback === "full" ? fallback : REORDER_LIST_VARIANT_FULL;
	}
	//#endregion
	//#region src/shared/ui/progress-settings.ts
	var PROGRESS_WINDOW_POSITIONS = [
		"top-center",
		"top-right",
		"bottom-right"
	];
	var PROGRESS_WINDOW_STYLES = [
		"default",
		"compact",
		"dashboard"
	];
	var DEFAULT_PROGRESS_WINDOW_SETTINGS = {
		progressWindowPosition: "top-right",
		progressWindowStyle: "default",
		progressAutoHideResult: false,
		progressAutoHideResultTimeoutMs: 5e3
	};
	function normalizeProgressWindowSettings(value, fallback = DEFAULT_PROGRESS_WINDOW_SETTINGS) {
		const source = asPlainRecord$2(value);
		const defaults = {
			...DEFAULT_PROGRESS_WINDOW_SETTINGS,
			...fallback
		};
		return {
			progressWindowPosition: normalizeEnum(source.progressWindowPosition, PROGRESS_WINDOW_POSITIONS, defaults.progressWindowPosition),
			progressWindowStyle: normalizeEnum(source.progressWindowStyle, PROGRESS_WINDOW_STYLES, defaults.progressWindowStyle),
			progressAutoHideResult: normalizeBoolean(source.progressAutoHideResult, defaults.progressAutoHideResult),
			progressAutoHideResultTimeoutMs: normalizePositiveInteger(source.progressAutoHideResultTimeoutMs, defaults.progressAutoHideResultTimeoutMs, 1e3)
		};
	}
	function normalizeEnum(value, allowedValues, fallback) {
		return allowedValues.includes(value) ? value : fallback;
	}
	function normalizeBoolean(value, fallback) {
		if (value === true || value === 1 || value === "1" || value === "true") return true;
		if (value === false || value === 0 || value === "0" || value === "false") return false;
		return fallback;
	}
	function normalizePositiveInteger(value, fallback, minimum = 1) {
		const numericValue = Math.trunc(Number(value));
		return Number.isFinite(numericValue) ? Math.max(minimum, numericValue) : Math.max(minimum, fallback);
	}
	//#endregion
	//#region src/shared/ui/progress-escape.ts
	var PROGRESS_ESCAPE_BLOCKER_SELECTOR = ".hwhx-modal,.hwhx-custom-select.is-open,.hwhx-multiselect.is-open,.hwhx-hotkey-input.is-recording";
	/** Проверяет, принадлежит ли Escape верхнему окну прогресса, а не вложенному контролу. */
	function shouldCloseProgressOnEscape(event, progressElement, ownerDocument = document) {
		var _target$closest;
		if (!progressElement || event.key !== "Escape" || event.defaultPrevented || ownerDocument.querySelector(".hwhx-modal")) return false;
		const target = event.target;
		if (target === null || target === void 0 || (_target$closest = target.closest) === null || _target$closest === void 0 ? void 0 : _target$closest.call(target, PROGRESS_ESCAPE_BLOCKER_SELECTOR)) return false;
		const visibleProgress = ownerDocument.querySelectorAll(".hwhx-progress.is-visible");
		return visibleProgress.item(visibleProgress.length - 1) === progressElement;
	}
	//#endregion
	//#region src/shared/ui/progress-position.ts
	var PROGRESS_POSITION_STORAGE_PREFIX = "hwhx:progress-position:v1:";
	function normalizeProgressWindowPoint(value) {
		if (!value || typeof value !== "object" || Array.isArray(value)) return null;
		const source = value;
		const left = Number(source.left);
		const top = Number(source.top);
		if (!Number.isFinite(left) || !Number.isFinite(top) || left < 0 || top < 0) return null;
		return {
			left: Math.round(left),
			top: Math.round(top)
		};
	}
	function readProgressWindowPoint(progressId, storage = getBrowserLocalStorage()) {
		const key = getProgressPositionStorageKey(progressId);
		if (!key || !storage) return null;
		try {
			var _storage$getItem;
			return normalizeProgressWindowPoint(JSON.parse((_storage$getItem = storage.getItem(key)) !== null && _storage$getItem !== void 0 ? _storage$getItem : "null"));
		} catch (_unused) {
			return null;
		}
	}
	function writeProgressWindowPoint(progressId, point, storage = getBrowserLocalStorage()) {
		const key = getProgressPositionStorageKey(progressId);
		const normalizedPoint = normalizeProgressWindowPoint(point);
		if (!key || !normalizedPoint || !storage) return normalizedPoint;
		try {
			storage.setItem(key, JSON.stringify(normalizedPoint));
		} catch (_unused2) {}
		return normalizedPoint;
	}
	function clearProgressWindowPoint(progressId, storage = getBrowserLocalStorage()) {
		const key = getProgressPositionStorageKey(progressId);
		if (!key || !storage) return;
		try {
			storage.removeItem(key);
		} catch (_unused3) {}
	}
	function getProgressPositionStorageKey(progressId) {
		const normalizedId = String(progressId !== null && progressId !== void 0 ? progressId : "").trim();
		return normalizedId ? `${PROGRESS_POSITION_STORAGE_PREFIX}${normalizedId}` : "";
	}
	function didProgressWindowAnchorChange(previousAnchor, nextAnchor) {
		const previous = String(previousAnchor !== null && previousAnchor !== void 0 ? previousAnchor : "").trim();
		const next = String(nextAnchor !== null && nextAnchor !== void 0 ? nextAnchor : "").trim();
		return !!previous && !!next && previous !== next;
	}
	//#endregion
	//#region src/shared/ui/progress-stage.ts
	var RUSSIAN_PHASES = {
		preparing: {
			emoji: "🚦",
			label: "Подготавливаем запуск",
			description: "Проверяем настройки и доступные ресурсы."
		},
		loading: {
			emoji: "📥",
			label: "Получаем данные игры",
			description: "Загружаем актуальное состояние с игрового сервера."
		},
		planning: {
			emoji: "🧭",
			label: "Строим план действий",
			description: "Считаем цели, ограничения и оптимальный порядок операций."
		},
		batching: {
			emoji: "🧩",
			label: "Формируем пакет команд",
			description: "Объединяем совместимые операции в серверный пакет."
		},
		sending: {
			emoji: "🌐",
			label: "Отправляем пакет на сервер",
			description: "Передаём подготовленные команды игровому серверу."
		},
		waiting: {
			emoji: "⏳",
			label: "Ждём ответ сервера",
			description: "Сервер выполняет отправленные команды."
		},
		processing: {
			emoji: "⚙️",
			label: "Обрабатываем ответ сервера",
			description: "Проверяем результаты и изменения ресурсов."
		},
		applying: {
			emoji: "📦",
			label: "Применяем изменения",
			description: "Обновляем локальный план по подтверждённым результатам."
		},
		syncing: {
			emoji: "🔄",
			label: "Синхронизируем состояние",
			description: "Сверяем локальные данные с состоянием игры."
		},
		finalizing: {
			emoji: "✅",
			label: "Подводим итог",
			description: "Собираем итоговые результаты запуска."
		}
	};
	var ENGLISH_PHASES = {
		preparing: {
			emoji: "🚦",
			label: "Preparing the run",
			description: "Checking settings and available resources."
		},
		loading: {
			emoji: "📥",
			label: "Loading game data",
			description: "Fetching the latest state from the game server."
		},
		planning: {
			emoji: "🧭",
			label: "Building the action plan",
			description: "Calculating goals, limits, and operation order."
		},
		batching: {
			emoji: "🧩",
			label: "Building a command batch",
			description: "Combining compatible operations into a server batch."
		},
		sending: {
			emoji: "🌐",
			label: "Sending the batch",
			description: "Sending prepared commands to the game server."
		},
		waiting: {
			emoji: "⏳",
			label: "Waiting for the server",
			description: "The game server is executing the submitted commands."
		},
		processing: {
			emoji: "⚙️",
			label: "Processing the server response",
			description: "Checking results and resource changes."
		},
		applying: {
			emoji: "📦",
			label: "Applying changes",
			description: "Updating the local plan with confirmed results."
		},
		syncing: {
			emoji: "🔄",
			label: "Synchronizing state",
			description: "Reconciling local data with the game state."
		},
		finalizing: {
			emoji: "✅",
			label: "Finalizing results",
			description: "Building the final run summary."
		}
	};
	var REQUEST_PHASES = /* @__PURE__ */ new Set([
		"batching",
		"sending",
		"waiting",
		"processing"
	]);
	function buildRuntimeProgressStage(input) {
		const isRussian = normalizeLanguage(input.language) === "ru";
		const copy = (isRussian ? RUSSIAN_PHASES : ENGLISH_PHASES)[input.phase];
		const current = toPositiveInteger(input.current);
		const total = toPositiveInteger(input.total);
		const itemCount = toNonNegativeInteger(input.itemCount);
		const details = [copy.description];
		if (current !== void 0 && total !== void 0) {
			const counterLabel = cleanText(input.counterLabel) || (isRussian ? "Пакет" : "Batch");
			details.push(isRussian ? `${counterLabel} ${Math.min(current, total)} из ${total}.` : `${counterLabel} ${Math.min(current, total)} of ${total}.`);
		}
		if (itemCount !== void 0) {
			const itemLabel = cleanText(input.itemLabel) || (isRussian ? "Команд в пакете" : "Commands in this batch");
			details.push(`${itemLabel}: ${itemCount}.`);
		}
		const requestName = cleanText(input.requestName);
		if (requestName) details.push(`${isRussian ? "Команда сервера" : "Server command"}: ${requestName}.`);
		const detail = cleanText(input.detail);
		if (detail) details.push(detail);
		if (total === 1 && REQUEST_PHASES.has(input.phase) && input.explainSingleBatch !== false) details.push(isRussian ? "Один пакет может содержать много объединённых команд — это не объём потраченной энергии." : "One batch may contain many combined commands; it is not the amount of energy spent.");
		return {
			stageLabel: `${copy.emoji} ${copy.label}`,
			content: details.join("\n"),
			percent: normalizePercent(input.percent, current, total),
			intermediate: true
		};
	}
	function normalizeLanguage(value) {
		const language = cleanText(value).toLowerCase();
		if (language.startsWith("ru")) return "ru";
		if (language.startsWith("en")) return "en";
		return getSharedUiLanguage() === "ru" ? "ru" : "en";
	}
	function normalizePercent(value, current, total) {
		const explicit = Number(value);
		if (Number.isFinite(explicit)) return clampPercent$1(explicit);
		if (current === void 0 || total === void 0 || total <= 0) return void 0;
		return clampPercent$1(current / total * 100);
	}
	function clampPercent$1(value) {
		return Math.max(0, Math.min(100, value));
	}
	function toPositiveInteger(value) {
		const normalized = Math.trunc(Number(value));
		return Number.isFinite(normalized) && normalized > 0 ? normalized : void 0;
	}
	function toNonNegativeInteger(value) {
		const normalized = Math.trunc(Number(value));
		return Number.isFinite(normalized) && normalized >= 0 ? normalized : void 0;
	}
	function cleanText(value) {
		return String(value !== null && value !== void 0 ? value : "").trim();
	}
	//#endregion
	//#region src/shared/ui/native/progress.ts
	var progressElements = /* @__PURE__ */ new Map();
	var keydownTracking = false;
	function createNativeProgressController({ scriptId, title, settings }) {
		const progressId = `hwhx-progress-${normalizeDomId(scriptId)}`;
		let progressSettings = normalizeSettings$1(settings);
		let progressUiTheme = readUiTheme(settings);
		let hideTimeoutId = null;
		function hideProgress(delayMs = 0) {
			clearHideTimeout();
			const delay = Math.max(0, Number(delayMs) || 0);
			if (delay > 0) hideTimeoutId = globalThis.setTimeout(() => hideNativeProgress(progressId), delay);
			else hideNativeProgress(progressId);
		}
		function setProgress(content, autoHide = false, options = void 0) {
			var _ref, _normalizedOptions$re, _normalizedOptions$re2, _normalizedOptions$st, _normalizedOptions$st2;
			clearHideTimeout();
			const normalizedOptions = asPlainRecord$2(options);
			if (options === void 0) normalizedOptions.autoHide = autoHide;
			const contentText = String(content !== null && content !== void 0 ? content : "");
			const explicitPercent = Number(normalizedOptions.percent);
			const inferredPercent = Number.isFinite(explicitPercent) ? clampPercent(explicitPercent) : parseProgressPercent(contentText);
			const autoHideValue = normalizedOptions.autoHide;
			showNativeProgress({
				id: progressId,
				title: String(title !== null && title !== void 0 ? title : ""),
				content: contentText,
				contentHtml: containsHtmlMarkup(contentText) ? sanitizeInternalHtml(contentText) : "",
				component: normalizedOptions.component,
				props: asPlainRecord$2(normalizedOptions.props),
				isResult: !!normalizedOptions.result,
				resultLabel: String((_ref = (_normalizedOptions$re = normalizedOptions.resultLabel) !== null && _normalizedOptions$re !== void 0 ? _normalizedOptions$re : normalizedOptions.completeText) !== null && _ref !== void 0 ? _ref : ""),
				resultTone: String((_normalizedOptions$re2 = normalizedOptions.resultTone) !== null && _normalizedOptions$re2 !== void 0 ? _normalizedOptions$re2 : "success"),
				statusLabel: String((_normalizedOptions$st = normalizedOptions.statusLabel) !== null && _normalizedOptions$st !== void 0 ? _normalizedOptions$st : ""),
				percent: Number.isFinite(inferredPercent) ? inferredPercent : null,
				intermediate: !normalizedOptions.result && normalizedOptions.intermediate !== false,
				position: progressSettings.progressWindowPosition,
				style: progressSettings.progressWindowStyle,
				stageLabel: String((_normalizedOptions$st2 = normalizedOptions.stage) !== null && _normalizedOptions$st2 !== void 0 ? _normalizedOptions$st2 : ""),
				uiTheme: progressUiTheme
			});
			if (autoHideValue) hideProgress(typeof autoHideValue === "number" ? Math.max(0, autoHideValue) : 3e3);
		}
		function showResult(content, options = void 0) {
			var _normalizedOptions$au;
			const normalizedOptions = {
				...asPlainRecord$2(options),
				result: true
			};
			const autoHide = (_normalizedOptions$au = normalizedOptions.autoHide) !== null && _normalizedOptions$au !== void 0 ? _normalizedOptions$au : progressSettings.progressAutoHideResult ? progressSettings.progressAutoHideResultTimeoutMs : false;
			setProgress(content, autoHide, {
				...normalizedOptions,
				autoHide
			});
		}
		function setStageProgress(input, autoHide = false, options = void 0) {
			var _normalizedOptions$pe, _normalizedOptions$st3;
			const stage = buildRuntimeProgressStage(input);
			const normalizedOptions = asPlainRecord$2(options);
			setProgress(stage.content, autoHide, {
				...normalizedOptions,
				percent: (_normalizedOptions$pe = normalizedOptions.percent) !== null && _normalizedOptions$pe !== void 0 ? _normalizedOptions$pe : stage.percent,
				stage: (_normalizedOptions$st3 = normalizedOptions.stage) !== null && _normalizedOptions$st3 !== void 0 ? _normalizedOptions$st3 : stage.stageLabel
			});
		}
		function configure(nextSettings) {
			progressUiTheme = readUiTheme(nextSettings, progressUiTheme);
			progressSettings = normalizeSettings$1({
				...progressSettings,
				...asPlainRecord$2(nextSettings)
			});
		}
		function clearHideTimeout() {
			if (hideTimeoutId === null) return;
			globalThis.clearTimeout(hideTimeoutId);
			hideTimeoutId = null;
		}
		return {
			configure,
			setProgress,
			setStageProgress,
			showResult,
			hideProgress
		};
	}
	function showNativeProgress(options) {
		var _options$uiTheme, _options$style, _options$position, _options$stageLabel;
		ensureSharedUiFeedbackStyles();
		let view = progressElements.get(options.id);
		if (!view) {
			view = createNativeProgressElements(options.id);
			progressElements.set(options.id, view);
			document.body.appendChild(view.root);
			startKeydownTracking();
		}
		const element = view.root;
		element.className = "hwhx-progress hwhx-build-lite is-visible";
		element.dataset.hwhxUiTheme = (_options$uiTheme = options.uiTheme) !== null && _options$uiTheme !== void 0 ? _options$uiTheme : "classic";
		element.dataset.hwhxProgressStyle = (_options$style = options.style) !== null && _options$style !== void 0 ? _options$style : "default";
		element.dataset.hwhxProgressResult = options.isResult ? "1" : "0";
		element.dataset.hwhxProgressResultTone = normalizeResultTone(options.resultTone);
		const nextPosition = String((_options$position = options.position) !== null && _options$position !== void 0 ? _options$position : "top-right");
		if (didProgressWindowAnchorChange(view.position, nextPosition)) clearProgressWindowPoint(options.id);
		view.position = nextPosition;
		applyProgressPosition(element, nextPosition, options.id);
		view.title.textContent = options.title;
		view.status.dataset.tone = options.isResult ? normalizeResultTone(options.resultTone) : "active";
		view.statusLabel.textContent = options.isResult && options.statusLabel || getStatusLabel(options.isResult, options.resultTone);
		view.stage.textContent = (_options$stageLabel = options.stageLabel) !== null && _options$stageLabel !== void 0 ? _options$stageLabel : "";
		view.stage.hidden = !options.stageLabel || !!options.component;
		if (options.component) {
			view.body.replaceChildren(renderNativeView(options.component, options.props, { close: () => hideNativeProgress(options.id) }));
			view.mode = "component";
		} else {
			if (view.mode !== "content") {
				view.body.replaceChildren(view.content);
				view.mode = "content";
			}
			updateNativeProgressContent(view.content, options.content, options.contentHtml);
		}
		updateNativeProgressBar(view, options.percent, options.intermediate);
		if (options.isResult && options.resultLabel) {
			var _options$resultTone;
			view.result.dataset.tone = (_options$resultTone = options.resultTone) !== null && _options$resultTone !== void 0 ? _options$resultTone : "success";
			view.result.textContent = options.resultLabel;
			view.body.appendChild(view.result);
		} else view.result.remove();
	}
	function hideNativeProgress(id) {
		const view = progressElements.get(id);
		if (!view) return;
		progressElements.delete(id);
		view.root.remove();
		if (progressElements.size === 0) stopKeydownTracking();
	}
	function onDocumentKeydown(event) {
		var _topProgress$id, _progressElements$get;
		const visibleProgress = document.querySelectorAll(".hwhx-progress.is-visible");
		const topProgress = visibleProgress.item(visibleProgress.length - 1);
		if (!shouldCloseProgressOnEscape(event, topProgress)) return;
		const progressId = (_topProgress$id = topProgress === null || topProgress === void 0 ? void 0 : topProgress.id) !== null && _topProgress$id !== void 0 ? _topProgress$id : "";
		if (((_progressElements$get = progressElements.get(progressId)) === null || _progressElements$get === void 0 ? void 0 : _progressElements$get.root) !== topProgress) return;
		event.preventDefault();
		event.stopPropagation();
		hideNativeProgress(progressId);
	}
	function startKeydownTracking() {
		if (keydownTracking) return;
		keydownTracking = true;
		document.addEventListener("keydown", onDocumentKeydown, true);
	}
	function stopKeydownTracking() {
		if (!keydownTracking) return;
		keydownTracking = false;
		document.removeEventListener("keydown", onDocumentKeydown, true);
	}
	function createNativeProgressElements(id) {
		const root = document.createElement("section");
		root.id = id;
		const header = document.createElement("header");
		header.className = "hwhx-progress__header";
		const title = document.createElement("strong");
		title.className = "hwhx-progress__title";
		const actions = document.createElement("div");
		actions.className = "hwhx-progress__header-actions";
		const status = document.createElement("span");
		status.className = "hwhx-status-badge hwhx-progress__state";
		const statusLabel = document.createElement("span");
		statusLabel.className = "hwhx-status-badge__label";
		status.appendChild(statusLabel);
		const close = document.createElement("button");
		close.type = "button";
		close.className = "hwhx-icon-button";
		close.textContent = "×";
		close.ariaLabel = "Закрыть";
		close.addEventListener("click", () => hideNativeProgress(id));
		actions.append(status, close);
		header.append(title, actions);
		enableNativeProgressDrag(root, header, id);
		const stage = document.createElement("div");
		stage.className = "hwhx-progress__stage";
		stage.hidden = true;
		const body = document.createElement("div");
		body.className = "hwhx-progress__body";
		const content = document.createElement("div");
		content.className = "hwhx-progress__content";
		const bar = document.createElement("div");
		bar.className = "hwhx-progress-bar";
		const fill = document.createElement("div");
		fill.className = "hwhx-progress-bar__fill";
		bar.appendChild(fill);
		const result = document.createElement("strong");
		result.className = "hwhx-progress__result";
		body.appendChild(content);
		root.append(header, stage, body);
		return {
			root,
			title,
			status,
			statusLabel,
			stage,
			body,
			content,
			progressBar: bar,
			progressFill: fill,
			result,
			mode: "content",
			position: ""
		};
	}
	function updateNativeProgressContent(element, content, contentHtml) {
		if (contentHtml) {
			if (element.innerHTML !== contentHtml) element.innerHTML = contentHtml;
			return;
		}
		const nextContent = content !== null && content !== void 0 ? content : "";
		if (element.textContent !== nextContent) element.textContent = nextContent;
	}
	function readUiTheme(value, fallback = "classic") {
		var _asPlainRecord$uiThem;
		return String((_asPlainRecord$uiThem = asPlainRecord$2(value).uiTheme) !== null && _asPlainRecord$uiThem !== void 0 ? _asPlainRecord$uiThem : "").trim() || fallback;
	}
	function updateNativeProgressBar(view, percent, intermediate = false) {
		if ((percent === null || percent === void 0) && !intermediate) {
			view.progressBar.remove();
			return;
		}
		view.progressBar.dataset.indeterminate = intermediate ? "1" : "0";
		view.progressBar.dataset.intermediate = intermediate ? "1" : "0";
		view.progressFill.style.width = intermediate ? "" : `${clampPercent(Number(percent))}%`;
		view.body.appendChild(view.progressBar);
	}
	function applyProgressPosition(element, value, progressId) {
		element.style.inset = "auto";
		element.style.transform = "";
		const savedPoint = readProgressWindowPoint(progressId);
		if (savedPoint) {
			element.style.left = `${savedPoint.left}px`;
			element.style.top = `${savedPoint.top}px`;
			return;
		}
		element.style.top = "8px";
		if (value === "bottom-right") {
			element.style.top = "auto";
			element.style.bottom = "8px";
			element.style.right = "8px";
		} else if (value === "top-center") {
			element.style.left = "50%";
			element.style.transform = "translateX(-50%)";
		} else element.style.right = "8px";
	}
	function enableNativeProgressDrag(root, handle, progressId) {
		let dragState;
		handle.addEventListener("pointerdown", (event) => {
			var _root$setPointerCaptu;
			if (event.button !== 0 || !(event.target instanceof Element) || event.target.closest("button, a, input, select, textarea")) return;
			const rect = root.getBoundingClientRect();
			dragState = {
				pointerId: event.pointerId,
				offsetX: event.clientX - rect.left,
				offsetY: event.clientY - rect.top
			};
			root.style.inset = "auto";
			root.style.left = `${rect.left}px`;
			root.style.top = `${rect.top}px`;
			root.style.transform = "none";
			root.dataset.hwhxProgressDragging = "1";
			(_root$setPointerCaptu = root.setPointerCapture) === null || _root$setPointerCaptu === void 0 || _root$setPointerCaptu.call(root, event.pointerId);
			event.preventDefault();
		});
		root.addEventListener("pointermove", (event) => {
			if (!dragState || dragState.pointerId !== event.pointerId) return;
			const rect = root.getBoundingClientRect();
			const margin = 8;
			const left = Math.min(Math.max(margin, event.clientX - dragState.offsetX), Math.max(margin, window.innerWidth - rect.width - margin));
			const top = Math.min(Math.max(margin, event.clientY - dragState.offsetY), Math.max(margin, window.innerHeight - rect.height - margin));
			root.style.left = `${left}px`;
			root.style.top = `${top}px`;
			event.preventDefault();
		});
		const finishDrag = (event) => {
			var _root$releasePointerC;
			if (!dragState || dragState.pointerId !== event.pointerId) return;
			(_root$releasePointerC = root.releasePointerCapture) === null || _root$releasePointerC === void 0 || _root$releasePointerC.call(root, event.pointerId);
			dragState = void 0;
			delete root.dataset.hwhxProgressDragging;
			writeProgressWindowPoint(progressId, {
				left: Number.parseFloat(root.style.left),
				top: Number.parseFloat(root.style.top)
			});
		};
		root.addEventListener("pointerup", finishDrag);
		root.addEventListener("pointercancel", finishDrag);
	}
	var normalizeSettings$1 = normalizeProgressWindowSettings;
	function normalizeResultTone(value) {
		const tone = String(value !== null && value !== void 0 ? value : "success");
		return tone === "danger" || tone === "warning" ? tone : "success";
	}
	function getStatusLabel(isResult, tone) {
		if (!isResult) return "Выполняется";
		if (tone === "danger") return "Ошибка";
		if (tone === "warning") return "Остановлено";
		return "Завершено";
	}
	function normalizeDomId(value) {
		return String(value !== null && value !== void 0 ? value : "script").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
	}
	function parseProgressPercent(text) {
		const match = String(text !== null && text !== void 0 ? text : "").match(/(?:^|\D)(\d+)\s*\/\s*(\d+)(?:\D|$)/);
		if (!match) return void 0;
		const current = Number(match[1]);
		const total = Number(match[2]);
		return total > 0 ? clampPercent(current / total * 100) : void 0;
	}
	function clampPercent(value) {
		return Math.max(0, Math.min(100, value));
	}
	function containsHtmlMarkup(content) {
		return /<\/?[a-z][\s\S]*>/i.test(String(content !== null && content !== void 0 ? content : ""));
	}
	//#endregion
	//#region src/shared/ui/native/reactive-state.ts
	var NATIVE_STATE_CHANGE_EVENT = "hwhx-native-state-change";
	/**
	* Lite не тянет Vue, но асинхронный снимок игры всё равно должен дорисовать
	* очередь. Прокси шлёт один дешёвый сигнал, а конкретный экран сам решает,
	* относится ли изменение к нему.
	*/
	function createNativeShallowReactiveState(value) {
		const proxy = new Proxy(value, {
			set(target, key, nextValue, receiver) {
				const changed = Reflect.get(target, key, receiver) !== nextValue;
				const result = Reflect.set(target, key, nextValue, receiver);
				if (changed && result) dispatchNativeStateChange(proxy);
				return result;
			},
			deleteProperty(target, key) {
				const existed = Reflect.has(target, key);
				const result = Reflect.deleteProperty(target, key);
				if (existed && result) dispatchNativeStateChange(proxy);
				return result;
			}
		});
		return proxy;
	}
	function dispatchNativeStateChange(state) {
		document.dispatchEvent(new CustomEvent(NATIVE_STATE_CHANGE_EVENT, { detail: state }));
	}
	//#endregion
	//#region src/shared/ui/native/result-summary.ts
	function renderNativeResultSummary(props) {
		var _props$resultTone;
		const root = document.createElement("div");
		root.className = "hwhx-result-summary";
		root.dataset.resultTone = String((_props$resultTone = props.resultTone) !== null && _props$resultTone !== void 0 ? _props$resultTone : "success");
		const stack = document.createElement("div");
		stack.className = "hwhx-result-stack";
		if (props.messageHtml) {
			const message = document.createElement("div");
			message.className = "hwhx-result-message";
			message.innerHTML = sanitizeInternalHtml(props.messageHtml);
			stack.appendChild(message);
		}
		const accordions = Array.isArray(props.accordions) ? props.accordions : [];
		for (const accordion of accordions) stack.appendChild(renderAccordion(accordion));
		root.appendChild(stack);
		return root;
	}
	function renderAccordion(accordion) {
		const root = document.createElement("details");
		root.className = "hwhx-result-accordion";
		root.dataset.tone = accordion.tone;
		root.open = accordion.defaultOpen !== false;
		const summary = document.createElement("summary");
		summary.className = "hwhx-result-accordion__summary";
		summary.textContent = `${accordion.title} (${accordion.countText})`;
		const body = document.createElement("div");
		body.className = "hwhx-result-accordion__body";
		for (const row of accordion.rows) body.appendChild(renderRow(row));
		root.append(summary, body);
		return root;
	}
	function renderRow(row) {
		const element = document.createElement("div");
		element.className = "hwhx-result-row";
		element.dataset.kind = row.kind;
		element.innerHTML = sanitizeInternalHtml(row.html);
		return element;
	}
	//#endregion
	//#region src/shared/ui/native/settings-controls.ts
	function createNativeDetails(title, open = false) {
		const root = document.createElement("details");
		root.className = "hwhx-accordion";
		root.open = open;
		const summary = document.createElement("summary");
		summary.className = "hwhx-accordion__summary";
		summary.textContent = stripNativeMarkup(title);
		const body = document.createElement("div");
		body.className = "hwhx-accordion__body";
		root.append(summary, body);
		return {
			root,
			body
		};
	}
	function createNativeCheckboxRow(label, checked, onChange, disabled = false) {
		const row = document.createElement("label");
		row.className = "hwhx-checkbox-row";
		const input = document.createElement("input");
		input.type = "checkbox";
		input.className = "hwhx-checkbox-input";
		input.checked = !!checked;
		input.disabled = disabled;
		input.addEventListener("change", () => onChange(input.checked));
		row.append(input, createNativeText("span", "hwhx-checkbox-label", label));
		return row;
	}
	function createNativeNumberRow(label, value, min, max, onChange) {
		const row = createNativeFieldRow(label);
		row.appendChild(createNativeNumberInput$1(value, min, max, onChange));
		return row;
	}
	function createNativeNumberInput$1(value, min, max, onChange) {
		const input = document.createElement("input");
		input.type = "number";
		input.className = "hwhx-field hwhx-number";
		input.value = String(Math.max(0, Number(value) || 0));
		if (Number.isFinite(Number(min))) input.min = String(min);
		if (Number.isFinite(Number(max))) input.max = String(max);
		input.addEventListener("change", () => {
			onChange(Math.max(0, Math.trunc(Number(input.value) || 0)));
		});
		return input;
	}
	function createNativeSelectRow(label, value, options, onChange) {
		const row = createNativeFieldRow(label);
		const select = document.createElement("select");
		select.className = "hwhx-field hwhx-select";
		for (const option of options) {
			var _option$value, _option$label;
			const element = document.createElement("option");
			element.value = String((_option$value = option.value) !== null && _option$value !== void 0 ? _option$value : "");
			element.textContent = stripNativeMarkup((_option$label = option.label) !== null && _option$label !== void 0 ? _option$label : option.value);
			element.disabled = !!option.disabled;
			select.appendChild(element);
		}
		select.value = String(value !== null && value !== void 0 ? value : "");
		select.addEventListener("change", () => onChange(select.value));
		row.appendChild(select);
		return row;
	}
	function createNativeButton(label, action, tone = "secondary") {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "hwhx-button";
		button.dataset.tone = tone;
		button.textContent = stripNativeMarkup(label);
		button.addEventListener("click", action);
		return button;
	}
	function createNativeText(tag, className, value) {
		const element = document.createElement(tag);
		element.className = className;
		element.textContent = stripNativeMarkup(value);
		return element;
	}
	function toNativeRecord(value) {
		return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	function toNativeRecordList(value) {
		return Array.isArray(value) ? value.map(toNativeRecord) : [];
	}
	function stripNativeMarkup(value) {
		return String(value !== null && value !== void 0 ? value : "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
	}
	function createNativeFieldRow(label) {
		const row = document.createElement("label");
		row.className = "hwhx-field-row";
		row.appendChild(createNativeText("span", "hwhx-settings-label", label));
		return row;
	}
	/**
	* Native-вьюхи получают translate через props неизвестной формы: если его нет,
	* показываем ключ, а не падаем.
	*/
	function readNativeTranslate(value) {
		return typeof value === "function" ? value : (key) => String(key !== null && key !== void 0 ? key : "");
	}
	//#endregion
	//#region src/scripts/hwhheromanager/ui/lite/native-level-limits-view.ts
	function renderNativeHeroManagerLevelLimits(props) {
		const translate = readNativeTranslate(props.translate);
		const limits = toNativeRecord(props.limits);
		const modules = toNativeRecordList(props.modules);
		const root = document.createElement("div");
		root.className = "hwhx-native-body hwhx-popup hwhx-popup--compact hwhx-popup--padded";
		root.appendChild(createNativeText("div", "hwhx-hint", translate("HWHHM_LEVEL_LIMIT_HINT")));
		const section = createNativeDetails(translate("HWHHM_LEVEL_LIMIT_TITLE"), true);
		for (const module of modules) {
			var _module$key, _module$label;
			const key = String((_module$key = module.key) !== null && _module$key !== void 0 ? _module$key : "");
			if (!key) continue;
			section.body.appendChild(createNativeNumberRow(translate("HWHHM_LEVEL_LIMIT_FIELD", { module: String((_module$label = module.label) !== null && _module$label !== void 0 ? _module$label : key) }), limits[key], 0, 999, (value) => {
				limits[key] = value;
			}));
		}
		root.appendChild(section.root);
		return root;
	}
	//#endregion
	//#region src/shared/ui/lite/theme.ts
	var UI_THEME_DARK = "dark";
	var UI_THEME_LIGHT = "light";
	var UI_THEME_AUTO = "auto";
	var UI_THEME_CLASSIC = UI_THEME_DARK;
	var UI_THEME_VALUES = Object.freeze([
		UI_THEME_DARK,
		UI_THEME_LIGHT,
		UI_THEME_AUTO
	]);
	var UI_THEME_VALUE_SET = new Set(UI_THEME_VALUES);
	var UI_THEME_DEFINITIONS = Object.freeze([
		{
			value: UI_THEME_DARK,
			labelKey: "HWHX_UI_THEME_DARK",
			icon: "moon",
			label: "Dark"
		},
		{
			value: UI_THEME_LIGHT,
			labelKey: "HWHX_UI_THEME_LIGHT",
			icon: "sun",
			label: "Light"
		},
		{
			value: UI_THEME_AUTO,
			labelKey: "HWHX_UI_THEME_AUTO",
			icon: "monitor",
			label: "Auto"
		}
	]);
	var UI_THEME_PREVIEWS = Object.freeze({
		dark: [],
		light: [],
		auto: [],
		classic: []
	});
	var UI_THEME_PREVIEW_FONTS = Object.freeze({
		dark: "Arial, sans-serif",
		light: "Arial, sans-serif",
		auto: "Arial, sans-serif",
		classic: "Arial, sans-serif"
	});
	var UI_THEME_PREVIEW_GEOMETRY = Object.freeze({
		dark: [
			"1px",
			"2px",
			"solid"
		],
		light: [
			"1px",
			"2px",
			"solid"
		],
		auto: [
			"1px",
			"2px",
			"solid"
		],
		classic: [
			"1px",
			"2px",
			"solid"
		]
	});
	Object.freeze(UI_THEME_DEFINITIONS.map((def) => {
		var _UI_THEME_PREVIEWS$de, _UI_THEME_PREVIEW_FON, _UI_THEME_PREVIEW_GEO;
		return {
			definition: def,
			preview: (_UI_THEME_PREVIEWS$de = UI_THEME_PREVIEWS[def.value]) !== null && _UI_THEME_PREVIEWS$de !== void 0 ? _UI_THEME_PREVIEWS$de : [],
			previewFont: (_UI_THEME_PREVIEW_FON = UI_THEME_PREVIEW_FONTS[def.value]) !== null && _UI_THEME_PREVIEW_FON !== void 0 ? _UI_THEME_PREVIEW_FON : "Arial, sans-serif",
			previewGeometry: (_UI_THEME_PREVIEW_GEO = UI_THEME_PREVIEW_GEOMETRY[def.value]) !== null && _UI_THEME_PREVIEW_GEO !== void 0 ? _UI_THEME_PREVIEW_GEO : [
				"1px",
				"2px",
				"solid"
			],
			css: ""
		};
	}));
	function normalizeUiTheme(value) {
		if (typeof value === "string") {
			const normalized = value.trim().toLowerCase();
			if (UI_THEME_VALUE_SET.has(normalized)) return normalized;
		}
		return UI_THEME_DARK;
	}
	//#endregion
	//#region src/scripts/hwhheromanager/core/constants.ts
	var SETTINGS_STORAGE_KEY = "hwhheromanager_settings";
	var ACTION_KEY = "hwhHeroManagerAction";
	var DO_YOUR_BEST_TASK_NAME = "hwhheromanagerRunQueues";
	var BUTTON_PLACEMENT_MAIN = "main";
	var BUTTON_PLACEMENT_OTHER = "other";
	var UPGRADE_MODE_LEVELS = "levels";
	var HERO_MANAGER_EXECUTION_MODE_SEQUENTIAL = "sequential";
	var HERO_MANAGER_EXECUTION_MODE_PARALLEL = "parallel";
	var HERO_MANAGER_GENERAL_TAB_KEY = "general";
	var HERO_MANAGER_INTERFACE_TAB_KEY = "interface";
	var HERO_MANAGER_MODULE_KEY = {
		SKILLS: "skills",
		EVOLUTIONS: "evolutions",
		SKINS: "skins",
		RUNES: "runes",
		GIFTS: "gifts",
		ARTIFACTS: "artifacts",
		ASGARD: "asgard"
	};
	var HERO_MANAGER_MODULE_DEFINITIONS = [
		{
			key: HERO_MANAGER_MODULE_KEY.SKILLS,
			labelKey: "HWHHM_SECTION_SKILLS",
			icon: "zap",
			resultTone: "craft"
		},
		{
			key: HERO_MANAGER_MODULE_KEY.EVOLUTIONS,
			labelKey: "HWHHM_SECTION_EVOLUTION",
			icon: "sparkles",
			resultTone: "shop"
		},
		{
			key: HERO_MANAGER_MODULE_KEY.SKINS,
			labelKey: "HWHHM_SECTION_SKINS",
			icon: "shirt",
			resultTone: "craft"
		},
		{
			key: HERO_MANAGER_MODULE_KEY.RUNES,
			labelKey: "HWHHM_SECTION_RUNES",
			icon: "gem",
			resultTone: "farm"
		},
		{
			key: HERO_MANAGER_MODULE_KEY.GIFTS,
			labelKey: "HWHHM_SECTION_TITAN_GIFT",
			icon: "sparkles",
			resultTone: "shop"
		},
		{
			key: HERO_MANAGER_MODULE_KEY.ARTIFACTS,
			labelKey: "HWHHM_SECTION_ARTIFACTS",
			icon: "hammer",
			resultTone: "craft"
		},
		{
			key: HERO_MANAGER_MODULE_KEY.ASGARD,
			labelKey: "HWHHM_SECTION_ASGARD",
			icon: "shield",
			resultTone: "technical"
		}
	];
	var HERO_MANAGER_MODULE_KEYS = HERO_MANAGER_MODULE_DEFINITIONS.map((definition) => definition.key);
	var HERO_MANAGER_SETTINGS_TAB_KEYS = [
		HERO_MANAGER_GENERAL_TAB_KEY,
		...HERO_MANAGER_MODULE_KEYS,
		HERO_MANAGER_INTERFACE_TAB_KEY
	];
	var RUNE_ITEM_IDS = [
		1,
		2,
		3,
		4
	];
	var SKIN_STONE_CHEST_IDS = [51, 65];
	var SKIN_STONE_CHEST_YIELDS = {
		51: 10,
		65: 150
	};
	var SKILL_TIER_IDS = [
		1,
		2,
		3,
		4
	];
	var RUNE_TIER_IDS = [
		0,
		1,
		2,
		3,
		4
	];
	var RUNE_UNLOCK_COLORS = [
		4,
		4,
		7,
		8,
		9
	];
	var ARTIFACT_SLOT_IDS = [
		0,
		1,
		2
	];
	var SKILL_UNLOCK_COLORS = [
		1,
		2,
		4,
		7
	];
	var createDefaultUpgradeLevelLimits = (value = 1) => Object.fromEntries(HERO_MANAGER_MODULE_KEYS.map((moduleKey) => [moduleKey, value]));
	var createDefaultModuleExecutionModes = (value = HERO_MANAGER_EXECUTION_MODE_SEQUENTIAL) => Object.fromEntries(HERO_MANAGER_MODULE_KEYS.map((moduleKey) => [moduleKey, value]));
	var DEFAULT_PROGRESS_SETTINGS = { ...DEFAULT_PROGRESS_WINDOW_SETTINGS };
	var DEFAULT_SETTINGS = {
		activeSettingsTab: HERO_MANAGER_GENERAL_TAB_KEY,
		uiTheme: UI_THEME_CLASSIC,
		showUiTooltips: true,
		showGameEntityIcons: true,
		buttonPlacement: BUTTON_PLACEMENT_MAIN,
		hideMaxedRows: false,
		upgradeMode: "max",
		executionMode: HERO_MANAGER_EXECUTION_MODE_SEQUENTIAL,
		moduleExecutionModes: createDefaultModuleExecutionModes(),
		upgradeLevelLimits: createDefaultUpgradeLevelLimits(),
		doYourBestPlacement: "end",
		doYourBestActionTypes: [...HERO_MANAGER_MODULE_KEYS],
		reorderListVariant: REORDER_LIST_VARIANT_FULL,
		accordionAutoScrollMode: ACCORDION_AUTO_SCROLL_MODE_SMOOTH,
		...DEFAULT_PROGRESS_SETTINGS,
		skillHeroOrder: [],
		skillHeroIds: [],
		skillTierOrder: [...SKILL_TIER_IDS],
		skillHeroTierOrder: {},
		skillTierTargets: {},
		skillTierEnabled: {},
		buySkillPointsForEmeralds: false,
		maxSkillPointPurchases: 0,
		skillTargets: {},
		skillGoldReserve: 0,
		evolutionHeroOrder: [],
		evolutionHeroIds: [],
		evolutionStarCaps: {},
		evolutionGoldReserve: 0,
		evolutionShopIds: [],
		evolutionCoinReserves: {},
		skinHeroOrder: [],
		skinTargetOrder: [],
		skinKeys: [],
		skinLevelCaps: {},
		skinCoinReserves: {},
		skinChestIds: [],
		skinChestReserves: {},
		runeHeroOrder: [],
		runeHeroIds: [],
		runeTierOrder: [...RUNE_TIER_IDS],
		runeLevelCaps: {},
		runeReserves: {},
		runeGoldReserve: 0,
		titanGiftHeroOrder: [],
		titanGiftHeroIds: [],
		titanGiftLevelCaps: {},
		titanGiftReserve: 0,
		titanGiftGoldReserve: 0,
		artifactHeroOrder: [],
		artifactHeroIds: [],
		artifactSlotOrder: [...ARTIFACT_SLOT_IDS],
		artifactSlots: [
			0,
			1,
			2
		],
		artifactLevelCaps: {
			0: 100,
			1: 100,
			2: 100
		},
		artifactTargets: {},
		artifactReserves: {},
		ascensionHeroOrder: [],
		ascensionHeroIds: [],
		ascensionGlobalRankCap: 5,
		ascensionRankCaps: {},
		ascensionResourceReserves: {}
	};
	//#endregion
	//#region src/shared/ui/progress-options.ts
	function getLabel(labels, key, fallback) {
		var _labels$key;
		return String((_labels$key = labels[key]) !== null && _labels$key !== void 0 ? _labels$key : fallback);
	}
	function getProgressPositionOptions(labels = {}) {
		const descriptors = {
			"top-center": {
				key: "topCenter",
				fallback: "Top center",
				icon: "align-center"
			},
			"top-right": {
				key: "topRight",
				fallback: "Top right",
				icon: "corner-right-up"
			},
			"bottom-right": {
				key: "bottomRight",
				fallback: "Bottom right",
				icon: "corner-right-down"
			}
		};
		return PROGRESS_WINDOW_POSITIONS.map((value) => ({
			value,
			label: getLabel(labels, descriptors[value].key, descriptors[value].fallback),
			icon: descriptors[value].icon
		}));
	}
	function getProgressStyleOptions(labels = {}) {
		const descriptors = {
			default: {
				fallback: "Default",
				icon: "panel-top"
			},
			compact: {
				fallback: "Compact",
				icon: "minus"
			},
			dashboard: {
				fallback: "Dashboard",
				icon: "boxes"
			}
		};
		return PROGRESS_WINDOW_STYLES.map((value) => ({
			value,
			label: getLabel(labels, value, descriptors[value].fallback),
			icon: descriptors[value].icon
		}));
	}
	//#endregion
	//#region src/shared/ui/native/progress-options-section.ts
	function createNativeProgressOptionsSection({ value, labels, positionOptions, styleOptions, open = false, onUpdate }) {
		const current = { ...value };
		const section = createNativeDetails(labels.title, open);
		const timeoutRow = createNativeNumberRow(labels.autoHideMs, current.autoHideMs, 1e3, void 0, (nextValue) => update("autoHideMs", Math.max(1e3, nextValue)));
		timeoutRow.hidden = !current.autoHide;
		section.body.append(createNativeCheckboxRow(labels.autoHide, current.autoHide, (nextValue) => {
			timeoutRow.hidden = !nextValue;
			update("autoHide", nextValue);
		}), timeoutRow, createNativeSelectRow(labels.position, current.position, positionOptions !== null && positionOptions !== void 0 ? positionOptions : getProgressPositionOptions(labels), (nextValue) => update("position", nextValue)), createNativeSelectRow(labels.style, current.style, styleOptions !== null && styleOptions !== void 0 ? styleOptions : getProgressStyleOptions(labels), (nextValue) => update("style", nextValue)));
		return section.root;
		function update(key, nextValue) {
			current[key] = nextValue;
			onUpdate({ ...current });
		}
	}
	//#endregion
	//#region src/scripts/hwhheromanager/ui/lite/native-settings-view.ts
	var TARGET_ORDER_SETTING_KEYS = {
		"skins:target-order": "skinTargetOrder",
		"runes:target-order": "runeTierOrder",
		"artifacts:target-order": "artifactSlotOrder"
	};
	function renderNativeHeroManagerSettings(props) {
		const state = toNativeRecord(props.state);
		const translate = readNativeTranslate(props.translate);
		const modules = toNativeRecordList(props.modules);
		const root = document.createElement("div");
		root.className = "hwhx-native-body hwhx-hero-manager-lite";
		let activeModuleTab = "settings";
		let rerenderQueued = false;
		const queueSearches = /* @__PURE__ */ new Map();
		const rerender = () => {
			root.replaceChildren(renderNavigation(state, modules, translate, (tabKey) => {
				state.activeSettingsTab = tabKey;
				activeModuleTab = "settings";
				rerender();
			}), renderActiveTab(state, modules, props, translate, activeModuleTab, (tabKey) => {
				activeModuleTab = tabKey;
				rerender();
			}, rerender, queueSearches));
		};
		const scheduleRerender = () => {
			if (rerenderQueued) return;
			rerenderQueued = true;
			queueMicrotask(() => {
				rerenderQueued = false;
				if (root.isConnected) rerender();
			});
		};
		const stateChangeListener = (event) => {
			if (!(event instanceof CustomEvent) || event.detail !== props.modules) return;
			scheduleRerender();
		};
		document.addEventListener(NATIVE_STATE_CHANGE_EVENT, stateChangeListener);
		disposeWhenDetached(root, () => {
			document.removeEventListener(NATIVE_STATE_CHANGE_EVENT, stateChangeListener);
		});
		rerender();
		return root;
	}
	function renderNavigation(state, modules, translate, onSelect) {
		var _state$activeSettings;
		const root = document.createElement("nav");
		root.className = "hwhx-button-group hwhx-hero-manager-lite__navigation";
		const activeTab = String((_state$activeSettings = state.activeSettingsTab) !== null && _state$activeSettings !== void 0 ? _state$activeSettings : HERO_MANAGER_GENERAL_TAB_KEY);
		const definitions = [
			{
				key: HERO_MANAGER_GENERAL_TAB_KEY,
				label: translate("HWHHM_SECTION_GENERAL")
			},
			...modules.map((module) => {
				var _module$key, _ref, _module$title;
				return {
					key: String((_module$key = module.key) !== null && _module$key !== void 0 ? _module$key : ""),
					label: String((_ref = (_module$title = module.title) !== null && _module$title !== void 0 ? _module$title : module.key) !== null && _ref !== void 0 ? _ref : "")
				};
			}),
			{
				key: HERO_MANAGER_INTERFACE_TAB_KEY,
				label: translate("HWHHM_SECTION_INTERFACE")
			}
		].filter((tab) => tab.key);
		for (const tab of definitions) {
			const button = createNativeButton(tab.label, () => onSelect(tab.key));
			button.classList.toggle("is-active", tab.key === activeTab);
			root.appendChild(button);
		}
		return root;
	}
	function renderActiveTab(state, modules, props, translate, activeModuleTab, setActiveModuleTab, rerender, queueSearches) {
		var _state$activeSettings2;
		const activeTab = String((_state$activeSettings2 = state.activeSettingsTab) !== null && _state$activeSettings2 !== void 0 ? _state$activeSettings2 : HERO_MANAGER_GENERAL_TAB_KEY);
		if (activeTab === "general") return renderGeneralSettings(state, props, translate);
		if (activeTab === "interface") return renderInterfaceSettings(state, translate);
		const module = modules.find((candidate) => {
			var _candidate$key;
			return String((_candidate$key = candidate.key) !== null && _candidate$key !== void 0 ? _candidate$key : "") === activeTab;
		});
		return module ? renderModule(state, module, translate, activeModuleTab, setActiveModuleTab, rerender, queueSearches) : createNativeText("div", "hwhx-empty-state", translate("HWHHM_MODULE_LOADING"));
	}
	function renderGeneralSettings(state, props, translate) {
		const section = createNativeDetails(translate("HWHHM_SECTION_UPGRADE_COMMON"), true);
		section.body.append(createNativeSelectRow(translate("HWHHM_UPGRADE_MODE"), state.upgradeMode, [{
			value: "max",
			label: translate("HWHHM_UPGRADE_MODE_MAX")
		}, {
			value: UPGRADE_MODE_LEVELS,
			label: translate("HWHHM_UPGRADE_MODE_LEVELS")
		}], (value) => {
			state.upgradeMode = value;
		}), createNativeSelectRow(translate("HWHHM_DO_YOUR_BEST_PLACEMENT_LABEL"), state.doYourBestPlacement, toNativeRecordList(props.doYourBestOptions), (value) => {
			state.doYourBestPlacement = value;
		}));
		const actionValues = new Set(toStringList(state.doYourBestActionTypes));
		const actionSection = createNativeDetails(translate("HWHHM_DO_YOUR_BEST_ACTIONS"), true);
		for (const definition of HERO_MANAGER_MODULE_DEFINITIONS) actionSection.body.appendChild(createNativeCheckboxRow(translate(definition.labelKey), actionValues.has(definition.key), (enabled) => {
			if (enabled) actionValues.add(definition.key);
			else actionValues.delete(definition.key);
			state.doYourBestActionTypes = [...actionValues];
		}));
		const root = document.createElement("section");
		root.className = "hwhx-stack";
		root.append(section.root, actionSection.root);
		return root;
	}
	function renderInterfaceSettings(state, translate) {
		var _state$progressWindow, _state$progressWindow2;
		const interfaceSection = createNativeDetails(translate("HWHHM_INTERFACE_APPEARANCE"), true);
		interfaceSection.body.append(createNativeSelectRow(translate("HWHHM_BUTTON_PLACEMENT"), state.buttonPlacement, [{
			value: "main",
			label: translate("HWHHM_BUTTON_PLACEMENT_MAIN")
		}, {
			value: "other",
			label: translate("HWHHM_BUTTON_PLACEMENT_OTHER")
		}], (value) => {
			state.buttonPlacement = value;
		}), createNativeCheckboxRow(translate("HWHHM_UI_TOOLTIPS"), state.showUiTooltips !== false, (value) => {
			state.showUiTooltips = value;
		}), createNativeCheckboxRow(translate("HWHHM_GAME_ICONS"), state.showGameEntityIcons !== false, (value) => {
			state.showGameEntityIcons = value;
		}), createNativeCheckboxRow(translate("HWHHM_HIDE_MAXED_ROWS"), state.hideMaxedRows, (value) => {
			state.hideMaxedRows = value;
		}));
		const listSection = createNativeDetails(translate("HWHHM_INTERFACE_LISTS"), true);
		listSection.body.append(createNativeSelectRow(translate("HWHHM_REORDER_LIST_VARIANT"), state.reorderListVariant, ["full", "minimal"].map((value) => ({
			value,
			label: translate(`HWHHM_REORDER_LIST_VARIANT_${value.toUpperCase()}`)
		})), (value) => {
			state.reorderListVariant = value;
		}), createNativeSelectRow(translate("HWHHM_ACCORDION_AUTO_SCROLL"), state.accordionAutoScrollMode, [
			"off",
			"instant",
			"smooth"
		].map((value) => ({
			value,
			label: translate(`HWHHM_ACCORDION_AUTO_SCROLL_${value.toUpperCase()}`)
		})), (value) => {
			state.accordionAutoScrollMode = value;
		}));
		const progress = createNativeProgressOptionsSection({
			value: {
				autoHide: !!state.progressAutoHideResult,
				autoHideMs: Number(state.progressAutoHideResultTimeoutMs) || 5e3,
				position: String((_state$progressWindow = state.progressWindowPosition) !== null && _state$progressWindow !== void 0 ? _state$progressWindow : "top-right"),
				style: String((_state$progressWindow2 = state.progressWindowStyle) !== null && _state$progressWindow2 !== void 0 ? _state$progressWindow2 : "default")
			},
			labels: {
				title: translate("HWHHM_SECTION_INFO_PANEL"),
				autoHide: translate("HWHHM_PROGRESS_AUTO_HIDE"),
				autoHideMs: translate("HWHHM_PROGRESS_TIMEOUT"),
				position: translate("HWHHM_PROGRESS_POSITION"),
				style: translate("HWHHM_PROGRESS_STYLE")
			},
			positionOptions: [
				"top-center",
				"top-right",
				"bottom-right"
			].map((value) => ({
				value,
				label: translate(`HWHHM_PROGRESS_${value.replaceAll("-", "_").toUpperCase()}`)
			})),
			styleOptions: [
				"default",
				"compact",
				"dashboard"
			].map((value) => ({
				value,
				label: translate(`HWHHM_PROGRESS_STYLE_${value.toUpperCase()}`)
			})),
			onUpdate: (value) => {
				state.progressAutoHideResult = value.autoHide;
				state.progressAutoHideResultTimeoutMs = value.autoHideMs;
				state.progressWindowPosition = value.position;
				state.progressWindowStyle = value.style;
			}
		});
		const root = document.createElement("section");
		root.className = "hwhx-stack";
		root.append(interfaceSection.root, listSection.root, progress);
		return root;
	}
	function renderModule(state, module, translate, activeModuleTab, setActiveModuleTab, rerender, queueSearches) {
		var _ref2, _tabs$find, _ref3, _activeTab$contentKin, _module$key2, _module$key3;
		const tabs = toNativeRecordList(resolveModule(module).tabs);
		const root = document.createElement("section");
		root.className = "hwhx-stack";
		const tabsBar = document.createElement("div");
		tabsBar.className = "hwhx-button-group";
		for (const tab of tabs) {
			var _tab$value, _tab$label;
			const value = String((_tab$value = tab.value) !== null && _tab$value !== void 0 ? _tab$value : "settings");
			const button = createNativeButton((_tab$label = tab.label) !== null && _tab$label !== void 0 ? _tab$label : value, () => setActiveModuleTab(value));
			button.classList.toggle("is-active", value === activeModuleTab);
			tabsBar.appendChild(button);
		}
		root.appendChild(tabsBar);
		const activeTab = (_ref2 = (_tabs$find = tabs.find((tab) => {
			var _tab$value2;
			return String((_tab$value2 = tab.value) !== null && _tab$value2 !== void 0 ? _tab$value2 : "") === activeModuleTab;
		})) !== null && _tabs$find !== void 0 ? _tabs$find : tabs[0]) !== null && _ref2 !== void 0 ? _ref2 : {};
		const contentKind = String((_ref3 = (_activeTab$contentKin = activeTab.contentKind) !== null && _activeTab$contentKin !== void 0 ? _activeTab$contentKin : module.key) !== null && _ref3 !== void 0 ? _ref3 : "");
		const view = toNativeRecord(activeTab.contentView);
		const executionControl = toNativeRecord(view.executionControl);
		if (Object.keys(executionControl).length > 0) {
			var _executionControl$lab;
			root.appendChild(createNativeSelectRow(String((_executionControl$lab = executionControl.label) !== null && _executionControl$lab !== void 0 ? _executionControl$lab : translate("HWHHM_EXECUTION_MODE")), executionControl.value, toNativeRecordList(executionControl.options), (value) => {
				var _ref4, _executionControl$mod;
				const moduleKey = String((_ref4 = (_executionControl$mod = executionControl.moduleKey) !== null && _executionControl$mod !== void 0 ? _executionControl$mod : module.key) !== null && _ref4 !== void 0 ? _ref4 : "");
				if (!moduleKey) return;
				state.moduleExecutionModes = {
					...toNativeRecord(state.moduleExecutionModes),
					[moduleKey]: value
				};
				view.executionMode = value;
				view.executionControl = {
					...executionControl,
					value
				};
				rerender();
			}));
		}
		root.appendChild(contentKind === "skills" ? renderSkillsModule(state, view, activeModuleTab, translate, rerender, queueSearches, String((_module$key2 = module.key) !== null && _module$key2 !== void 0 ? _module$key2 : "")) : renderGenericModule(state, view, activeModuleTab, translate, rerender, queueSearches, String((_module$key3 = module.key) !== null && _module$key3 !== void 0 ? _module$key3 : "")));
		return root;
	}
	function renderGenericModule(state, view, tabKey, translate, rerender, queueSearches, moduleKey) {
		if (tabKey === "settings") return renderGenericSettings(state, toNativeRecordList(view.settingsSections), rerender);
		return renderGenericQueue(state, toNativeRecordList(view.queueRows), translate, rerender, queueSearches, `${moduleKey}:${tabKey}`);
	}
	function renderGenericSettings(state, sections, rerender) {
		const root = document.createElement("section");
		root.className = "hwhx-stack";
		for (const sectionData of sections) {
			const section = createNativeDetails(sectionData.title, true);
			if (sectionData.kind === "target-order") renderTargetOrderSection(state, section.body, sectionData, rerender);
			else for (const control of toNativeRecordList(sectionData.controls)) section.body.appendChild(renderControl(state, control, rerender));
			root.appendChild(section.root);
		}
		return root;
	}
	function renderTargetOrderSection(state, root, section, rerender) {
		var _section$key;
		const settingKey = TARGET_ORDER_SETTING_KEYS[String((_section$key = section.key) !== null && _section$key !== void 0 ? _section$key : "")];
		const rows = toNativeRecordList(section.rows);
		const values = rows.map((row) => {
			var _row$value;
			return String((_row$value = row.value) !== null && _row$value !== void 0 ? _row$value : "");
		});
		for (const row of rows) {
			const item = document.createElement("div");
			item.className = "hwhx-custom-row";
			item.appendChild(createNativeText("span", "hwhx-checkbox-label", row.label));
			if (settingKey) item.append(createOrderButton("↑", () => {
				moveOrderedValue(state, settingKey, values, row.value, -1);
				rerender();
			}), createOrderButton("↓", () => {
				moveOrderedValue(state, settingKey, values, row.value, 1);
				rerender();
			}));
			for (const control of toNativeRecordList(row.controls)) item.appendChild(renderControl(state, control, rerender));
			root.appendChild(item);
		}
	}
	function renderGenericQueue(state, rows, translate, rerender, queueSearches, queueKey) {
		if (rows.length === 0) return createNativeText("div", "hwhx-empty-state", translate("HWHHM_NOTHING"));
		const root = document.createElement("section");
		root.className = "hwhx-stack";
		const visibleRows = rows.filter((row) => {
			var _queueSearches$get;
			return matchesGenericQueueRow(row, (_queueSearches$get = queueSearches.get(queueKey)) !== null && _queueSearches$get !== void 0 ? _queueSearches$get : "");
		});
		root.appendChild(createQueueToolbar(queueSearches, queueKey, translate, () => {
			applyGenericQueueSelection(state, visibleRows, true);
			rerender();
		}, () => {
			applyGenericQueueSelection(state, visibleRows, false);
			rerender();
		}, rerender));
		if (visibleRows.length === 0) {
			root.appendChild(createNativeText("div", "hwhx-empty-state", translate("HWHHM_NOTHING")));
			return root;
		}
		const visibleIds = rows.map((row) => {
			var _row$heroId;
			return String((_row$heroId = row.heroId) !== null && _row$heroId !== void 0 ? _row$heroId : "");
		});
		for (const row of visibleRows) {
			var _row$orderPatchKey;
			const section = createNativeDetails(row.heroName, false);
			const patch = toNativeRecord(row.patch);
			if (Object.keys(patch).length > 0) section.body.appendChild(createNativeCheckboxRow(row.heroName, row.checked, (enabled) => {
				applyControlValue(state, { patch }, enabled);
				rerender();
			}, Boolean(row.disabled)));
			section.body.appendChild(renderMetrics(row.metrics));
			const orderKey = String((_row$orderPatchKey = row.orderPatchKey) !== null && _row$orderPatchKey !== void 0 ? _row$orderPatchKey : "");
			if (orderKey) section.body.appendChild(renderOrderControls(state, orderKey, visibleIds, row.heroId, rerender));
			const childRows = toNativeRecordList(row.children);
			if (childRows.length > 0) renderGenericQueueChildren(state, section.body, childRows, rerender);
			for (const control of toNativeRecordList(row.controls)) section.body.appendChild(renderControl(state, control, rerender));
			if (row.emptyControlsText) section.body.appendChild(createNativeText("div", "hwhx-hint", row.emptyControlsText));
			root.appendChild(section.root);
		}
		return root;
	}
	function createQueueToolbar(searches, queueKey, translate, onSelectAll, onClearAll, rerender) {
		var _searches$get;
		const root = document.createElement("div");
		root.className = "hwhx-hero-manager-lite__queue-toolbar";
		const input = document.createElement("input");
		input.className = "hwhx-field hwhx-hero-manager-lite__queue-search";
		input.type = "search";
		input.value = (_searches$get = searches.get(queueKey)) !== null && _searches$get !== void 0 ? _searches$get : "";
		input.placeholder = translate("HWHHM_TRANSFER_SEARCH");
		input.setAttribute("aria-label", input.placeholder);
		input.addEventListener("input", () => {
			searches.set(queueKey, input.value);
			rerender();
		});
		const actions = document.createElement("div");
		actions.className = "hwhx-button-group";
		const clearSearch = createNativeButton("×", () => {
			searches.set(queueKey, "");
			rerender();
		});
		clearSearch.hidden = !input.value;
		clearSearch.setAttribute("aria-label", translate("HWHHM_TRANSFER_CLEAR_SEARCH"));
		actions.append(clearSearch, createNativeButton(translate("HWHHM_TRANSFER_CLEAR_ALL"), onClearAll), createNativeButton(translate("HWHHM_TRANSFER_SELECT_ALL"), onSelectAll));
		root.append(input, actions);
		return root;
	}
	function matchesGenericQueueRow(row, query) {
		const normalizedQuery = normalizeQueueSearch(query);
		if (!normalizedQuery) return true;
		const childLabels = toNativeRecordList(row.children).flatMap((child) => [child.label, toNativeRecord(child.checkbox).label]).map((value) => String(value !== null && value !== void 0 ? value : ""));
		return [row.heroName, ...childLabels].some((value) => normalizeQueueSearch(value).includes(normalizedQuery));
	}
	function applyGenericQueueSelection(state, rows, enabled) {
		rows.forEach((row) => {
			if (row.disabled) return;
			const patch = toNativeRecord(row.patch);
			if (Object.keys(patch).length) applyControlValue(state, { patch }, enabled);
			toNativeRecordList(row.children).forEach((child) => {
				const checkbox = toNativeRecord(child.checkbox);
				if (child.disabled || checkbox.disabled || Object.keys(checkbox).length === 0) return;
				applyControlValue(state, checkbox, enabled);
			});
		});
	}
	function normalizeQueueSearch(value) {
		return String(value !== null && value !== void 0 ? value : "").trim().toLocaleLowerCase();
	}
	function renderGenericQueueChildren(state, root, rows, rerender) {
		const orderValues = rows.map((row) => {
			var _ref5, _row$orderValue;
			return String((_ref5 = (_row$orderValue = row.orderValue) !== null && _row$orderValue !== void 0 ? _row$orderValue : row.key) !== null && _ref5 !== void 0 ? _ref5 : "");
		});
		for (const row of rows) {
			var _row$orderPatchKey2;
			const item = document.createElement("div");
			item.className = "hwhx-custom-row";
			const checkbox = toNativeRecord(row.checkbox);
			const number = toNativeRecord(row.number);
			const disabled = Boolean(row.disabled || checkbox.disabled || number.disabled);
			if (Object.keys(checkbox).length > 0) {
				const label = document.createElement("label");
				label.className = "hwhx-checkbox-label";
				const input = document.createElement("input");
				input.className = "hwhx-checkbox-input";
				input.type = "checkbox";
				input.checked = Boolean(checkbox.checked);
				input.disabled = disabled;
				input.addEventListener("change", () => {
					applyControlValue(state, checkbox, input.checked);
					rerender();
				});
				label.append(input, createNativeText("span", "", checkbox.label || row.label));
				item.appendChild(label);
			} else item.appendChild(createNativeText("span", "hwhx-checkbox-label", row.label));
			if (Object.keys(number).length > 0) {
				const input = createNativeNumberInput(number.value, number.minValue, number.maxValue, (value) => {
					applyControlValue(state, number, value);
					rerender();
				});
				input.disabled = disabled;
				item.appendChild(input);
			}
			const orderKey = String((_row$orderPatchKey2 = row.orderPatchKey) !== null && _row$orderPatchKey2 !== void 0 ? _row$orderPatchKey2 : "");
			if (orderKey) {
				var _row$orderValue2;
				item.appendChild(renderOrderControls(state, orderKey, orderValues, (_row$orderValue2 = row.orderValue) !== null && _row$orderValue2 !== void 0 ? _row$orderValue2 : row.key, rerender));
			}
			root.appendChild(item);
		}
	}
	function renderSkillsModule(state, view, tabKey, translate, rerender, queueSearches, moduleKey) {
		return tabKey === "settings" ? renderSkillSettings(state, toNativeRecord(view.settings), translate) : renderSkillQueue(state, toNativeRecord(view.queue), view, translate, rerender, queueSearches, `${moduleKey}:${tabKey}`);
	}
	function renderSkillSettings(state, settings, translate) {
		const root = document.createElement("section");
		root.className = "hwhx-stack";
		const section = createNativeDetails(translate("HWHHM_SECTION_SKILLS"), true);
		const goldReserve = toNativeRecord(settings.goldReserve);
		const buySkillPoints = toNativeRecord(settings.buySkillPoints);
		const skillPointLimit = toNativeRecord(settings.skillPointLimit);
		section.body.append(createNativeNumberRow(goldReserve.label, state.skillGoldReserve, 0, void 0, (value) => {
			state.skillGoldReserve = value;
		}), createNativeCheckboxRow(buySkillPoints.label, state.buySkillPointsForEmeralds, (value) => {
			state.buySkillPointsForEmeralds = value;
		}), createNativeNumberRow(skillPointLimit.label, state.maxSkillPointPurchases, skillPointLimit.minValue, skillPointLimit.maxValue, (value) => {
			state.maxSkillPointPurchases = value;
		}));
		root.appendChild(section.root);
		return root;
	}
	function renderSkillQueue(state, queue, view, translate, rerender, queueSearches, queueKey) {
		var _view$executionMode;
		const rows = toNativeRecordList(queue.rows);
		if (rows.length === 0) return createNativeText("div", "hwhx-empty-state", translate("HWHHM_NOTHING"));
		const root = document.createElement("section");
		root.className = "hwhx-stack";
		const canReorder = String((_view$executionMode = view.executionMode) !== null && _view$executionMode !== void 0 ? _view$executionMode : HERO_MANAGER_EXECUTION_MODE_SEQUENTIAL) !== HERO_MANAGER_EXECUTION_MODE_PARALLEL;
		const visibleRows = rows.filter((hero) => {
			var _queueSearches$get2;
			return matchesSkillsQueueRow(hero, (_queueSearches$get2 = queueSearches.get(queueKey)) !== null && _queueSearches$get2 !== void 0 ? _queueSearches$get2 : "");
		});
		root.appendChild(createQueueToolbar(queueSearches, queueKey, translate, () => {
			visibleRows.forEach((hero) => {
				var _hero$heroId;
				const heroId = String((_hero$heroId = hero.heroId) !== null && _hero$heroId !== void 0 ? _hero$heroId : "");
				if (heroId && !hero.disabled) setStringArrayValue(state, "skillHeroIds", heroId, true);
			});
			rerender();
		}, () => {
			visibleRows.forEach((hero) => {
				var _hero$heroId2;
				const heroId = String((_hero$heroId2 = hero.heroId) !== null && _hero$heroId2 !== void 0 ? _hero$heroId2 : "");
				if (heroId && !hero.disabled) setStringArrayValue(state, "skillHeroIds", heroId, false);
			});
			rerender();
		}, rerender));
		if (visibleRows.length === 0) {
			root.appendChild(createNativeText("div", "hwhx-empty-state", translate("HWHHM_NOTHING")));
			return root;
		}
		const visibleHeroIds = rows.map((row) => {
			var _row$heroId2;
			return String((_row$heroId2 = row.heroId) !== null && _row$heroId2 !== void 0 ? _row$heroId2 : "");
		});
		for (const hero of visibleRows) {
			var _hero$heroId3;
			const heroId = String((_hero$heroId3 = hero.heroId) !== null && _hero$heroId3 !== void 0 ? _hero$heroId3 : "");
			const section = createNativeDetails(hero.heroName, false);
			section.body.appendChild(createNativeCheckboxRow(hero.heroName, hero.checked, (enabled) => {
				setStringArrayValue(state, "skillHeroIds", heroId, enabled && !hero.disabled);
				rerender();
			}, Boolean(hero.disabled)));
			section.body.appendChild(renderMetrics(hero.metrics));
			if (canReorder) section.body.appendChild(renderOrderControls(state, "skillHeroOrder", visibleHeroIds, heroId, rerender));
			const skills = toNativeRecordList(hero.skills);
			const visibleTiers = skills.map((skill) => {
				var _skill$tier;
				return String((_skill$tier = skill.tier) !== null && _skill$tier !== void 0 ? _skill$tier : "");
			});
			for (const skill of skills) {
				var _skill$label, _skill$currentLevel, _skill$maxLevel;
				const skillSection = document.createElement("div");
				skillSection.className = "hwhx-custom-row";
				const label = `${String((_skill$label = skill.label) !== null && _skill$label !== void 0 ? _skill$label : "")} · ${String((_skill$currentLevel = skill.currentLevel) !== null && _skill$currentLevel !== void 0 ? _skill$currentLevel : 0)}/${String((_skill$maxLevel = skill.maxLevel) !== null && _skill$maxLevel !== void 0 ? _skill$maxLevel : 0)}`;
				skillSection.appendChild(createNativeText("span", "hwhx-checkbox-label", label));
				const targetInput = createNativeNumberInput(skill.targetLevel, skill.currentLevel, skill.maxLevel, (value) => {
					setSkillTarget(state, heroId, skill, value);
					rerender();
				});
				targetInput.disabled = Boolean(skill.disabled) || skill.unlocked === false;
				skillSection.appendChild(targetInput);
				if (canReorder) skillSection.appendChild(renderOrderControls(state, "skillHeroTierOrder", visibleTiers, skill.tier, rerender, heroId));
				section.body.appendChild(skillSection);
			}
			root.appendChild(section.root);
		}
		return root;
	}
	function matchesSkillsQueueRow(hero, query) {
		const normalizedQuery = normalizeQueueSearch(query);
		if (!normalizedQuery) return true;
		return [hero.heroName, ...toNativeRecordList(hero.skills).map((skill) => skill.label)].some((value) => normalizeQueueSearch(value).includes(normalizedQuery));
	}
	function renderControl(state, control, rerender) {
		var _control$kind, _control$kind2;
		if (String((_control$kind = control.kind) !== null && _control$kind !== void 0 ? _control$kind : "") === "card") {
			const childControls = toNativeRecordList(control.controls);
			const root = document.createElement("div");
			root.className = "hwhx-panel";
			if (isCompactControlGroup(childControls)) root.classList.add("hwhx-hero-manager-lite__control-group--inline");
			for (const child of childControls) root.appendChild(renderControl(state, child, rerender));
			return root;
		}
		if (String((_control$kind2 = control.kind) !== null && _control$kind2 !== void 0 ? _control$kind2 : "") === "checkbox") return createNativeCheckboxRow(control.label, control.checked, (enabled) => {
			applyControlValue(state, control, enabled);
			rerender();
		}, Boolean(control.disabled));
		const row = createNativeNumberRow(buildControlLabel(control), control.value, control.minValue, control.maxValue, (value) => {
			applyControlValue(state, control, value);
			rerender();
		});
		const input = row.querySelector("input");
		if (input) input.disabled = Boolean(control.disabled);
		return row;
	}
	function isCompactControlGroup(controls) {
		return controls.length === 2 && controls.some((control) => {
			var _control$kind3;
			return String((_control$kind3 = control.kind) !== null && _control$kind3 !== void 0 ? _control$kind3 : "") === "checkbox";
		}) && controls.some((control) => {
			var _control$kind4;
			return String((_control$kind4 = control.kind) !== null && _control$kind4 !== void 0 ? _control$kind4 : "") === "number" && control.compact === true;
		});
	}
	function applyControlValue(state, control, value) {
		var _patch$kind, _patch$key;
		const patch = toNativeRecord(control.patch);
		const kind = String((_patch$kind = patch.kind) !== null && _patch$kind !== void 0 ? _patch$kind : "");
		const key = String((_patch$key = patch.key) !== null && _patch$key !== void 0 ? _patch$key : "");
		if (!key) return;
		if (kind === "number") {
			state[key] = normalizeNumber(value, control.minValue, control.maxValue);
			return;
		}
		if (kind === "number-map") {
			var _patch$entryKey;
			ensureRecord(state, key)[String((_patch$entryKey = patch.entryKey) !== null && _patch$entryKey !== void 0 ? _patch$entryKey : "")] = normalizeNumber(value, control.minValue, control.maxValue);
			return;
		}
		if (kind === "nested-number-map") {
			var _patch$entryKey2, _patch$nestedKey;
			const entryKey = String((_patch$entryKey2 = patch.entryKey) !== null && _patch$entryKey2 !== void 0 ? _patch$entryKey2 : "");
			const nestedKey = String((_patch$nestedKey = patch.nestedKey) !== null && _patch$nestedKey !== void 0 ? _patch$nestedKey : "");
			ensureNestedRecord(state, key, entryKey)[nestedKey] = normalizeNumber(value, control.minValue, control.maxValue);
			ensureRelatedSelection(state, patch.relatedStringArray);
			return;
		}
		if (kind === "string-array-toggle") {
			setStringArrayValue(state, key, patch.value, Boolean(value));
			return;
		}
		if (kind === "string-array-group-toggle") {
			setStringArrayGroup(state, key, patch.groupPrefix, patch.values, Boolean(value));
			return;
		}
		if (kind === "nested-number-map-toggle") {
			var _patch$entryKey3, _patch$nestedKey2;
			const entryKey = String((_patch$entryKey3 = patch.entryKey) !== null && _patch$entryKey3 !== void 0 ? _patch$entryKey3 : "");
			const nestedKey = String((_patch$nestedKey2 = patch.nestedKey) !== null && _patch$nestedKey2 !== void 0 ? _patch$nestedKey2 : "");
			const target = ensureNestedRecord(state, key, entryKey);
			if (value) {
				target[nestedKey] = normalizeNumber(patch.value, 0, void 0);
				ensureRelatedSelection(state, patch.relatedStringArray);
			} else {
				delete target[nestedKey];
				if (Object.keys(target).length === 0) delete ensureRecord(state, key)[entryKey];
			}
		}
	}
	function renderMetrics(value) {
		const metrics = toNativeRecordList(value);
		const root = document.createElement("div");
		root.className = "hwhx-hint";
		root.textContent = metrics.map((metric) => {
			var _metric$label, _metric$value;
			return `${String((_metric$label = metric.label) !== null && _metric$label !== void 0 ? _metric$label : "")}: ${String((_metric$value = metric.value) !== null && _metric$value !== void 0 ? _metric$value : "")}`;
		}).filter(Boolean).join(" · ");
		root.hidden = !root.textContent;
		return root;
	}
	function renderOrderControls(state, settingKey, visibleValues, value, rerender, nestedKey = "") {
		const root = document.createElement("div");
		root.className = "hwhx-button-group";
		root.append(createOrderButton("↑", () => {
			moveOrderedValue(state, settingKey, visibleValues, value, -1, nestedKey);
			rerender();
		}), createOrderButton("↓", () => {
			moveOrderedValue(state, settingKey, visibleValues, value, 1, nestedKey);
			rerender();
		}));
		return root;
	}
	function createOrderButton(label, onClick) {
		return createNativeButton(label, onClick);
	}
	function moveOrderedValue(state, key, visibleValues, value, direction, nestedKey = "") {
		const nestedSource = nestedKey ? ensureRecord(state, key) : null;
		const current = toStringList(nestedKey ? nestedSource === null || nestedSource === void 0 ? void 0 : nestedSource[nestedKey] : state[key]);
		const visibleSet = new Set(visibleValues);
		const ordered = [...current.filter((entry) => visibleSet.has(entry)), ...visibleValues.filter((entry) => !current.includes(entry))];
		const index = ordered.indexOf(String(value !== null && value !== void 0 ? value : ""));
		const targetIndex = index + direction;
		if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;
		const [moved] = ordered.splice(index, 1);
		ordered.splice(targetIndex, 0, moved);
		const outside = current.filter((entry) => !visibleSet.has(entry));
		if (nestedKey) nestedSource[nestedKey] = [...ordered, ...outside];
		else state[key] = [...ordered, ...outside];
	}
	function setSkillTarget(state, heroId, skill, value) {
		var _skill$tier2;
		const currentLevel = normalizeNumber(skill.currentLevel, 0, void 0);
		const maxLevel = normalizeNumber(skill.maxLevel, currentLevel, void 0);
		const targetLevel = Math.max(currentLevel, Math.min(maxLevel, value));
		ensureNestedRecord(state, "skillTargets", heroId)[String((_skill$tier2 = skill.tier) !== null && _skill$tier2 !== void 0 ? _skill$tier2 : "")] = targetLevel;
		if (targetLevel > currentLevel) setStringArrayValue(state, "skillHeroIds", heroId, true);
	}
	function ensureRelatedSelection(state, value) {
		var _patch$key2;
		const patch = toNativeRecord(value);
		const key = String((_patch$key2 = patch.key) !== null && _patch$key2 !== void 0 ? _patch$key2 : "");
		if (key) setStringArrayValue(state, key, patch.value, true);
	}
	function setStringArrayGroup(state, key, prefix, values, enabled) {
		const group = toStringList(values);
		const groupSet = new Set(group);
		const normalizedPrefix = String(prefix !== null && prefix !== void 0 ? prefix : "");
		const outside = toStringList(state[key]).filter((entry) => normalizedPrefix ? !entry.startsWith(normalizedPrefix) : !groupSet.has(entry));
		state[key] = enabled ? [.../* @__PURE__ */ new Set([...outside, ...group])] : outside;
	}
	function setStringArrayValue(state, key, value, enabled) {
		const normalizedValue = String(value !== null && value !== void 0 ? value : "").trim();
		if (!normalizedValue) return;
		const current = toStringList(state[key]);
		state[key] = enabled ? [.../* @__PURE__ */ new Set([...current, normalizedValue])] : current.filter((entry) => entry !== normalizedValue);
	}
	function ensureRecord(state, key) {
		const value = toNativeRecord(state[key]);
		state[key] = value;
		return value;
	}
	function ensureNestedRecord(state, key, nestedKey) {
		const root = ensureRecord(state, key);
		const value = toNativeRecord(root[nestedKey]);
		root[nestedKey] = value;
		return value;
	}
	function resolveModule(module) {
		const build = module.build;
		return typeof build === "function" ? toNativeRecord(build()) : module;
	}
	function buildControlLabel(control) {
		var _control$label, _control$sideText;
		const label = String((_control$label = control.label) !== null && _control$label !== void 0 ? _control$label : "");
		const sideText = String((_control$sideText = control.sideText) !== null && _control$sideText !== void 0 ? _control$sideText : "").trim();
		return sideText ? `${label} [${sideText}]` : label;
	}
	function createNativeNumberInput(value, min, max, onChange) {
		const input = document.createElement("input");
		input.className = "hwhx-field hwhx-number";
		input.type = "number";
		input.inputMode = "numeric";
		input.value = String(normalizeNumber(value, min, max));
		if (Number.isFinite(Number(min))) input.min = String(min);
		if (Number.isFinite(Number(max))) input.max = String(max);
		input.addEventListener("change", () => onChange(normalizeNumber(input.value, min, max)));
		return input;
	}
	function normalizeNumber(value, min, max) {
		const minimum = Number.isFinite(Number(min)) ? Number(min) : 0;
		const maximum = Number.isFinite(Number(max)) ? Number(max) : Number.POSITIVE_INFINITY;
		return Math.max(minimum, Math.min(maximum, Math.trunc(Number(value) || 0)));
	}
	function toStringList(value) {
		return [...new Set((Array.isArray(value) ? value : []).map((entry) => String(entry !== null && entry !== void 0 ? entry : "").trim()).filter(Boolean))];
	}
	function disposeWhenDetached(root, dispose) {
		const observer = new MutationObserver(() => {
			if (root.isConnected) return;
			observer.disconnect();
			dispose();
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	}
	//#endregion
	//#region src/scripts/hwhheromanager/runtime/lite/ui-port.ts
	var RuntimeResultSummary = defineNativeView("hero-manager-result-summary", renderNativeResultSummary);
	var RuntimeLevelLimitsPanel = defineNativeView("hero-manager-level-limits", renderNativeHeroManagerLevelLimits);
	var RuntimeSettingsPanel = defineNativeView("hero-manager-settings", renderNativeHeroManagerSettings);
	var createRuntimeProgressController = createNativeProgressController;
	var initializeRuntimeUi = initializeNativeUi;
	var openRuntimeComponentModal = openNativeComponentModal;
	function createRuntimeGameIconResolvers(_runtime) {
		return {
			gameEntityIconResolver: void 0,
			gameItemIconResolver: void 0
		};
	}
	function createRuntimeShallowReactiveState(value) {
		return createNativeShallowReactiveState(value);
	}
	//#endregion
	//#region src/scripts/hwhheromanager/runtime/progress-stages.ts
	function createHeroManagerProgressReporter({ setStageProgress }) {
		const chunk = (calls) => (event) => {
			const requestNames = new Set(calls.slice(event.chunkStart - 1, event.chunkEnd).map((call) => {
				var _call$name;
				return String((_call$name = call.name) !== null && _call$name !== void 0 ? _call$name : "");
			}).filter(Boolean));
			setStageProgress({
				phase: event.phase === "processed" ? "processing" : "sending",
				current: event.requestIndex,
				total: event.totalRequests,
				itemCount: event.chunkSize,
				requestName: [...requestNames].join(", ")
			});
		};
		return {
			loading: (detail) => setStageProgress({
				phase: "loading",
				detail
			}),
			batching: (itemCount, detail) => setStageProgress({
				phase: "batching",
				itemCount,
				detail,
				explainSingleBatch: false
			}),
			chunk,
			applying: (itemCount) => setStageProgress({
				phase: "applying",
				itemCount,
				explainSingleBatch: false
			})
		};
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/classPrivateFieldInitSpec.js
	function _classPrivateFieldInitSpec(e, t, a) {
		_checkPrivateRedeclaration(e, t), t.set(e, a);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/classPrivateFieldSet2.js
	function _classPrivateFieldSet2(s, a, r) {
		return s.set(_assertClassBrand(s, a), r), r;
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/classPrivateFieldGet2.js
	function _classPrivateFieldGet2(s, a) {
		return s.get(_assertClassBrand(s, a));
	}
	//#endregion
	//#region src/shared/storage/native-storage.ts
	var DEFAULT_DATABASE_NAME = "localforage";
	var DEFAULT_STORE_NAME = "keyvaluepairs";
	var memoryStores = /* @__PURE__ */ new Map();
	function getBrowserIndexedDb() {
		try {
			var _globalThis$indexedDB;
			return (_globalThis$indexedDB = globalThis.indexedDB) !== null && _globalThis$indexedDB !== void 0 ? _globalThis$indexedDB : null;
		} catch (_unused) {
			return null;
		}
	}
	function createStorageError(message) {
		return new Error(message);
	}
	function openDatabase(factory, databaseName, storeName, version) {
		return new Promise((resolve, reject) => {
			let settled = false;
			const request = version === void 0 ? factory.open(databaseName) : factory.open(databaseName, version);
			request.addEventListener("upgradeneeded", () => {
				if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName);
			});
			request.addEventListener("error", () => {
				var _request$error;
				settled = true;
				reject((_request$error = request.error) !== null && _request$error !== void 0 ? _request$error : createStorageError("IndexedDB open failed"));
			});
			request.addEventListener("blocked", () => {
				settled = true;
				reject(createStorageError("IndexedDB open blocked"));
			});
			request.addEventListener("success", () => {
				if (settled) {
					request.result.close();
					return;
				}
				settled = true;
				resolve(request.result);
			});
		});
	}
	function requestResult(request) {
		return new Promise((resolve, reject) => {
			request.addEventListener("error", () => {
				var _request$error2;
				return reject((_request$error2 = request.error) !== null && _request$error2 !== void 0 ? _request$error2 : createStorageError("IndexedDB request failed"));
			});
			request.addEventListener("success", () => resolve(request.result));
		});
	}
	function transactionComplete(transaction) {
		return new Promise((resolve, reject) => {
			transaction.addEventListener("abort", () => {
				var _transaction$error;
				return reject((_transaction$error = transaction.error) !== null && _transaction$error !== void 0 ? _transaction$error : createStorageError("IndexedDB transaction aborted"));
			});
			transaction.addEventListener("error", () => {
				var _transaction$error2;
				return reject((_transaction$error2 = transaction.error) !== null && _transaction$error2 !== void 0 ? _transaction$error2 : createStorageError("IndexedDB transaction failed"));
			});
			transaction.addEventListener("complete", () => resolve());
		});
	}
	function readCursorKeys(store) {
		return new Promise((resolve, reject) => {
			const keys = [];
			const request = store.openKeyCursor();
			request.addEventListener("error", () => {
				var _request$error3;
				return reject((_request$error3 = request.error) !== null && _request$error3 !== void 0 ? _request$error3 : createStorageError("IndexedDB cursor failed"));
			});
			request.addEventListener("success", () => {
				const cursor = request.result;
				if (!cursor) {
					resolve(keys);
					return;
				}
				keys.push(String(cursor.key));
				cursor.continue();
			});
		});
	}
	function normalizeStoredValue(value) {
		return value === void 0 ? null : value;
	}
	function parseLocalValue(value) {
		return JSON.parse(value);
	}
	function serializeLocalValue(value) {
		return JSON.stringify(normalizeStoredValue(value));
	}
	var _databaseName = /* @__PURE__ */ new WeakMap();
	var _fallbackStorage = /* @__PURE__ */ new WeakMap();
	var _indexedDb = /* @__PURE__ */ new WeakMap();
	var _memory = /* @__PURE__ */ new WeakMap();
	var _storagePrefix = /* @__PURE__ */ new WeakMap();
	var _storeName = /* @__PURE__ */ new WeakMap();
	var _database = /* @__PURE__ */ new WeakMap();
	var _databasePromise = /* @__PURE__ */ new WeakMap();
	var _NativeKeyValueStore_brand = /* @__PURE__ */ new WeakSet();
	/**
	* Минимальный асинхронный KV-адаптер без библиотечного рантайма. Имена БД,
	* object store и localStorage-префиксы совпадают с localforage 1.x, поэтому
	* существующие данные читаются на месте без отдельной миграции.
	*/
	var NativeKeyValueStore = class {
		constructor({ databaseName = DEFAULT_DATABASE_NAME, indexedDb = getBrowserIndexedDb(), localStorage = getBrowserLocalStorage(), storeName = DEFAULT_STORE_NAME } = {}) {
			var _memoryStores$get;
			_classPrivateMethodInitSpec(this, _NativeKeyValueStore_brand);
			_classPrivateFieldInitSpec(this, _databaseName, void 0);
			_classPrivateFieldInitSpec(this, _fallbackStorage, void 0);
			_classPrivateFieldInitSpec(this, _indexedDb, void 0);
			_classPrivateFieldInitSpec(this, _memory, void 0);
			_classPrivateFieldInitSpec(this, _storagePrefix, void 0);
			_classPrivateFieldInitSpec(this, _storeName, void 0);
			_classPrivateFieldInitSpec(this, _database, null);
			_classPrivateFieldInitSpec(this, _databasePromise, null);
			_classPrivateFieldSet2(_databaseName, this, databaseName);
			_classPrivateFieldSet2(_indexedDb, this, indexedDb);
			_classPrivateFieldSet2(_storeName, this, storeName);
			_classPrivateFieldSet2(_storagePrefix, this, `${databaseName}/${storeName === DEFAULT_STORE_NAME ? "" : `${storeName}/`}`);
			_classPrivateFieldSet2(_fallbackStorage, this, createBrowserStorageNamespace(_classPrivateFieldGet2(_storagePrefix, this), localStorage));
			const memoryKey = `${databaseName}/${storeName}`;
			_classPrivateFieldSet2(_memory, this, (_memoryStores$get = memoryStores.get(memoryKey)) !== null && _memoryStores$get !== void 0 ? _memoryStores$get : /* @__PURE__ */ new Map());
			memoryStores.set(memoryKey, _classPrivateFieldGet2(_memory, this));
		}
		async getItem(key) {
			const normalizedKey = String(key);
			const database = await _assertClassBrand(_NativeKeyValueStore_brand, this, _getDatabase).call(this);
			if (database) try {
				const value = await requestResult(database.transaction(_classPrivateFieldGet2(_storeName, this), "readonly").objectStore(_classPrivateFieldGet2(_storeName, this)).get(normalizedKey));
				if (value !== void 0) return value;
			} catch (_unused2) {
				_assertClassBrand(_NativeKeyValueStore_brand, this, _resetDatabase).call(this);
			}
			const localValue = _assertClassBrand(_NativeKeyValueStore_brand, this, _readLocalValue).call(this, normalizedKey);
			if (localValue.found) {
				if (database) await _assertClassBrand(_NativeKeyValueStore_brand, this, _writeIndexedDb).call(this, database, normalizedKey, localValue.value).catch(() => void 0);
				return localValue.value;
			}
			return _classPrivateFieldGet2(_memory, this).has(normalizedKey) ? _classPrivateFieldGet2(_memory, this).get(normalizedKey) : null;
		}
		async setItem(key, value) {
			const normalizedKey = String(key);
			const normalizedValue = normalizeStoredValue(value);
			const database = await _assertClassBrand(_NativeKeyValueStore_brand, this, _getDatabase).call(this);
			if (database) try {
				await _assertClassBrand(_NativeKeyValueStore_brand, this, _writeIndexedDb).call(this, database, normalizedKey, normalizedValue);
				_assertClassBrand(_NativeKeyValueStore_brand, this, _removeLocalValue).call(this, normalizedKey);
				_classPrivateFieldGet2(_memory, this).delete(normalizedKey);
				return normalizedValue;
			} catch (_unused3) {
				_assertClassBrand(_NativeKeyValueStore_brand, this, _resetDatabase).call(this);
			}
			if (_assertClassBrand(_NativeKeyValueStore_brand, this, _writeLocalValue).call(this, normalizedKey, normalizedValue)) {
				_classPrivateFieldGet2(_memory, this).delete(normalizedKey);
				return normalizedValue;
			}
			_classPrivateFieldGet2(_memory, this).set(normalizedKey, normalizedValue);
			return normalizedValue;
		}
		async removeItem(key) {
			const normalizedKey = String(key);
			const database = await _assertClassBrand(_NativeKeyValueStore_brand, this, _getDatabase).call(this);
			if (database) try {
				const transaction = database.transaction(_classPrivateFieldGet2(_storeName, this), "readwrite");
				transaction.objectStore(_classPrivateFieldGet2(_storeName, this)).delete(normalizedKey);
				await transactionComplete(transaction);
			} catch (_unused4) {
				_assertClassBrand(_NativeKeyValueStore_brand, this, _resetDatabase).call(this);
			}
			_assertClassBrand(_NativeKeyValueStore_brand, this, _removeLocalValue).call(this, normalizedKey);
			_classPrivateFieldGet2(_memory, this).delete(normalizedKey);
		}
		async clear() {
			const database = await _assertClassBrand(_NativeKeyValueStore_brand, this, _getDatabase).call(this);
			if (database) try {
				const transaction = database.transaction(_classPrivateFieldGet2(_storeName, this), "readwrite");
				transaction.objectStore(_classPrivateFieldGet2(_storeName, this)).clear();
				await transactionComplete(transaction);
			} catch (_unused5) {
				_assertClassBrand(_NativeKeyValueStore_brand, this, _resetDatabase).call(this);
			}
			_assertClassBrand(_NativeKeyValueStore_brand, this, _clearLocalValues).call(this);
			_classPrivateFieldGet2(_memory, this).clear();
		}
		async keys() {
			const keys = /* @__PURE__ */ new Set();
			const database = await _assertClassBrand(_NativeKeyValueStore_brand, this, _getDatabase).call(this);
			if (database) try {
				const transaction = database.transaction(_classPrivateFieldGet2(_storeName, this), "readonly");
				for (const key of await readCursorKeys(transaction.objectStore(_classPrivateFieldGet2(_storeName, this)))) keys.add(key);
			} catch (_unused6) {
				_assertClassBrand(_NativeKeyValueStore_brand, this, _resetDatabase).call(this);
			}
			for (const key of _assertClassBrand(_NativeKeyValueStore_brand, this, _readLocalKeys).call(this)) keys.add(key);
			for (const key of _classPrivateFieldGet2(_memory, this).keys()) keys.add(key);
			return [...keys];
		}
	};
	async function _getDatabase() {
		if (!_classPrivateFieldGet2(_indexedDb, this)) return null;
		if (_classPrivateFieldGet2(_database, this)) return _classPrivateFieldGet2(_database, this);
		if (!_classPrivateFieldGet2(_databasePromise, this)) _classPrivateFieldSet2(_databasePromise, this, _assertClassBrand(_NativeKeyValueStore_brand, this, _openDatabase).call(this).catch(() => null));
		const database = await _classPrivateFieldGet2(_databasePromise, this);
		_classPrivateFieldSet2(_databasePromise, this, null);
		if (!database) return null;
		_classPrivateFieldSet2(_database, this, database);
		database.addEventListener("versionchange", () => {
			database.close();
			if (_classPrivateFieldGet2(_database, this) === database) _classPrivateFieldSet2(_database, this, null);
		});
		return database;
	}
	async function _openDatabase() {
		const database = await openDatabase(_classPrivateFieldGet2(_indexedDb, this), _classPrivateFieldGet2(_databaseName, this), _classPrivateFieldGet2(_storeName, this));
		if (database.objectStoreNames.contains(_classPrivateFieldGet2(_storeName, this))) return database;
		const nextVersion = database.version + 1;
		database.close();
		return openDatabase(_classPrivateFieldGet2(_indexedDb, this), _classPrivateFieldGet2(_databaseName, this), _classPrivateFieldGet2(_storeName, this), nextVersion);
	}
	function _resetDatabase() {
		var _classPrivateFieldGet2$1;
		(_classPrivateFieldGet2$1 = _classPrivateFieldGet2(_database, this)) === null || _classPrivateFieldGet2$1 === void 0 || _classPrivateFieldGet2$1.close();
		_classPrivateFieldSet2(_database, this, null);
		_classPrivateFieldSet2(_databasePromise, this, null);
	}
	async function _writeIndexedDb(database, key, value) {
		const transaction = database.transaction(_classPrivateFieldGet2(_storeName, this), "readwrite");
		transaction.objectStore(_classPrivateFieldGet2(_storeName, this)).put(value, key);
		await transactionComplete(transaction);
	}
	function _readLocalValue(key) {
		try {
			const raw = _classPrivateFieldGet2(_fallbackStorage, this).getItem(key);
			return raw === null ? {
				found: false,
				value: void 0
			} : {
				found: true,
				value: parseLocalValue(raw)
			};
		} catch (_unused7) {
			return {
				found: false,
				value: void 0
			};
		}
	}
	function _writeLocalValue(key, value) {
		try {
			return _classPrivateFieldGet2(_fallbackStorage, this).setItem(key, serializeLocalValue(value));
		} catch (_unused8) {
			return false;
		}
	}
	function _removeLocalValue(key) {
		_classPrivateFieldGet2(_fallbackStorage, this).removeItem(key);
	}
	function _readLocalKeys() {
		return _classPrivateFieldGet2(_fallbackStorage, this).keys();
	}
	function _clearLocalValues() {
		_classPrivateFieldGet2(_fallbackStorage, this).clear();
	}
	var defaultStore;
	function getDefaultNativeKeyValueStore() {
		var _defaultStore;
		return (_defaultStore = defaultStore) !== null && _defaultStore !== void 0 ? _defaultStore : defaultStore = new NativeKeyValueStore();
	}
	//#endregion
	//#region src/shared/storage/lite/localforage-settings.ts
	function replaceSettingsState(state, value) {
		for (const key of Object.keys(state)) delete state[key];
		Object.assign(state, value);
	}
	function createLocalforageSettingsStore(storeName, defaults, normalize, options = {}) {
		var _options$storage;
		const storageKey = `hwhx-settings-${storeName}`;
		const storage = (_options$storage = options.storage) !== null && _options$storage !== void 0 ? _options$storage : getDefaultNativeKeyValueStore();
		const state = { ...defaults };
		const loadedValues = /* @__PURE__ */ new Map();
		const pendingLoads = /* @__PURE__ */ new Map();
		async function resolveStorageKey() {
			var _await$options$getSto, _options$getStorageSc;
			const scopeKey = String((_await$options$getSto = await ((_options$getStorageSc = options.getStorageScopeKey) === null || _options$getStorageSc === void 0 ? void 0 : _options$getStorageSc.call(options))) !== null && _await$options$getSto !== void 0 ? _await$options$getSto : "").trim();
			return scopeKey ? `${storageKey}:${encodeURIComponent(scopeKey)}` : storageKey;
		}
		function normalizeValue(raw) {
			return normalize ? normalize(raw) : raw && typeof raw === "object" ? raw : { ...defaults };
		}
		async function load({ force = false, preferSource = false } = {}) {
			const resolvedKey = await resolveStorageKey();
			const cached = loadedValues.get(resolvedKey);
			if (!force && cached) {
				replaceSettingsState(state, { ...cached });
				return;
			}
			const pendingKey = `${resolvedKey}:${preferSource ? "source" : "cache"}`;
			let pending = pendingLoads.get(pendingKey);
			if (!pending) {
				pending = loadResolved(resolvedKey, preferSource);
				pendingLoads.set(pendingKey, pending);
			}
			try {
				const value = await pending;
				loadedValues.set(resolvedKey, value);
				replaceSettingsState(state, { ...value });
			} finally {
				if (pendingLoads.get(pendingKey) === pending) pendingLoads.delete(pendingKey);
			}
		}
		async function loadResolved(resolvedKey, preferSource) {
			try {
				var _options$read;
				if (!preferSource) {
					const stored = await storage.getItem(resolvedKey);
					if (stored !== null && stored !== void 0) return normalizeValue(stored);
				}
				const source = await ((_options$read = options.read) === null || _options$read === void 0 ? void 0 : _options$read.call(options));
				if (source !== void 0) {
					const value = normalizeValue(source);
					await storage.setItem(resolvedKey, value);
					return value;
				}
			} catch (_unused) {}
			return { ...defaults };
		}
		async function save() {
			var _options$write;
			const value = normalizeValue({ ...state });
			replaceSettingsState(state, value);
			const resolvedKey = await resolveStorageKey();
			await storage.setItem(resolvedKey, value);
			await ((_options$write = options.write) === null || _options$write === void 0 ? void 0 : _options$write.call(options, value));
			loadedValues.set(resolvedKey, value);
		}
		function reset() {
			replaceSettingsState(state, { ...defaults });
		}
		const store = {
			state,
			load,
			save,
			reset
		};
		return {
			storageKey,
			resolveStorageKey,
			useStore: () => store
		};
	}
	//#endregion
	//#region src/scripts/hwhheromanager/i18n/index.ts
	var I18N_EN = {
		HWHHM_START_LOG: "Starting extension {name} by {author} (v.{version})",
		HWHHM_BUTTON: "Hero Manager",
		HWHHM_BUTTON_TITLE: "Opens hero upgrade queues and resource limits.",
		HWHHM_TITLE: "Hero manager settings",
		HWHHM_SAVE: "Save",
		HWHHM_RUN: "Run",
		HWHHM_CLOSE: "Close",
		HWHHM_EXPORT_SETTINGS: "Export settings",
		HWHHM_IMPORT_SETTINGS: "Import settings",
		HWHHM_SETTINGS_SAVED: "Settings saved.",
		HWHHM_SETTINGS_EXPORT_DONE: "Settings exported to JSON.",
		HWHHM_SETTINGS_IMPORT_DONE: "Settings imported.",
		HWHHM_SETTINGS_IMPORT_INVALID: "This JSON is not a HWH Hero Manager settings export.",
		HWHHM_SETTINGS_IMPORT_PARSE_ERROR: "Could not parse JSON settings.",
		HWHHM_TRANSFER_EXPORT_TITLE: "Choose sections to export",
		HWHHM_TRANSFER_IMPORT_TITLE: "Choose sections to import",
		HWHHM_TRANSFER_EXPORT_CONFIRM: "Export selected",
		HWHHM_TRANSFER_IMPORT_CONFIRM: "Import selected",
		HWHHM_TRANSFER_FILE_LABEL: "Hero Manager JSON file",
		HWHHM_TRANSFER_SEARCH: "Search sections",
		HWHHM_TRANSFER_CLEAR_SEARCH: "Clear search",
		HWHHM_TRANSFER_EMPTY: "No matching sections",
		HWHHM_TRANSFER_SELECT_ALL: "Select all",
		HWHHM_TRANSFER_CLEAR_ALL: "Clear all",
		HWHHM_TRANSFER_SORT: "Sort",
		HWHHM_TRANSFER_SORT_BY_NAME: "By name",
		HWHHM_TRANSFER_SORT_SELECTED: "Selected first",
		HWHHM_TRANSFER_SORT_ASC: "Ascending",
		HWHHM_TRANSFER_SORT_DESC: "Descending",
		HWHHM_TRANSFER_SECTION_TITLE: "Settings from the “{section}” section.",
		HWHHM_ERROR_GENERIC: "Something went wrong. Check the console.",
		HWHHM_SECTION_INTERFACE: "Interface",
		HWHHM_NAV_LABEL: "Hero upgrade sections",
		HWHHM_INTERFACE_APPEARANCE: "Appearance and behavior",
		HWHHM_INTERFACE_LISTS: "Queues and lists",
		HWHHM_UI_TOOLTIPS: "Show interface tooltips",
		HWHHM_UI_TOOLTIPS_HINT: "Shows styled explanations for controls when hovering or using the keyboard.",
		HWHHM_GAME_ICONS: "Show game icons",
		HWHHM_GAME_ICONS_HINT: "Loads hero portraits and resource icons from the game. Text icons remain as fallback.",
		HWHHM_MODULE_LOADING: "Loading hero and resource data…",
		HWHHM_UI_THEME: "Interface theme",
		HWHHM_UI_THEME_HINT: "Applies to the Hero Manager window.",
		HWHHM_SECTION_INFO_PANEL: "Information panel",
		HWHHM_SECTION_GENERAL: "General",
		HWHHM_SECTION_UPGRADE_COMMON: "Upgrade settings",
		HWHHM_SECTION_SKILLS: "Skills",
		HWHHM_SECTION_EVOLUTION: "Evolution",
		HWHHM_SECTION_SKINS: "Skins",
		HWHHM_SECTION_RUNES: "Glyphs",
		HWHHM_SECTION_TITAN_GIFT: "Gift of the Elements",
		HWHHM_SECTION_ARTIFACTS: "Artifacts",
		HWHHM_SECTION_ASGARD: "Asgard",
		HWHHM_DONATE_TITLE: "Project support",
		HWHHM_DONATE_TEXT: "Direct transfer to an Alfa Bank card. No wallet relay, no mystery payment circus.",
		HWHHM_DONATE_WALLET: "Alfa Bank card: {wallet}",
		HWHHM_DONATE_QR_ALT: "Donation QR code",
		HWHHM_DONATE_QR_LABEL: "Bank transfer",
		HWHHM_DOCS_TITLE: "Documentation",
		HWHHM_DOCS_TEXT: "Useful links for setup, mirrors and the shared UI kit.",
		HWHHM_DOCS_PRIMARY: "Documentation",
		HWHHM_DOCS_MIRROR: "Mirror {number}",
		HWHHM_DUMP_LIBRARY: "Game library",
		HWHHM_DUMP_LIBRARY_TITLE: "Print Hero Wars runtime and library objects to the console.",
		HWHHM_BUTTON_PLACEMENT: "Hero manager button",
		HWHHM_BUTTON_PLACEMENT_MAIN: "Main menu",
		HWHHM_BUTTON_PLACEMENT_OTHER: "Other menu",
		HWHHM_HIDE_MAXED_ROWS: "Hide maxed heroes and targets",
		HWHHM_PROGRESS_AUTO_HIDE: "Hide result window by timeout",
		HWHHM_PROGRESS_TIMEOUT: "Result timeout, ms",
		HWHHM_PROGRESS_POSITION: "Result window position",
		HWHHM_PROGRESS_TOP_CENTER: "Top center",
		HWHHM_PROGRESS_TOP_RIGHT: "Top right",
		HWHHM_PROGRESS_BOTTOM_RIGHT: "Bottom right",
		HWHHM_PROGRESS_STYLE: "Result window style",
		HWHHM_PROGRESS_STYLE_DEFAULT: "Default",
		HWHHM_PROGRESS_STYLE_COMPACT: "Compact",
		HWHHM_PROGRESS_STYLE_DASHBOARD: "Dashboard",
		HWHHM_GOLD_RESERVE: "Gold reserve",
		HWHHM_RESOURCE_EMERALDS: "Emeralds",
		HWHHM_RESULT_TITLE: "Hero Manager result",
		HWHHM_RESULT_TOTAL: "Completed {success}/{total} planned actions.",
		HWHHM_RESULT_SPENT: "Spent: {spent}",
		HWHHM_RESULT_NO_SPENT: "No tracked spend.",
		HWHHM_RESOURCE_GOLD: "Gold",
		HWHHM_RESOURCE_COIN: "Coin {id}",
		HWHHM_RESOURCE_CONSUMABLE: "Consumable {id}",
		HWHHM_RESOURCE_ASCENSION_GEAR: "Ascension nugget {id}",
		HWHHM_RESOURCE_HERO_SOULS: "{name} soul stones",
		HWHHM_EVOLUTION_TARGET: "Target star",
		HWHHM_ARTIFACT_TARGETS: "Artifact targets",
		HWHHM_ASCENSION_RANK_CAP: "Upgrade through branch",
		HWHHM_SKILL_POINTS: "Skill points",
		HWHHM_REORDER_MOVE_TOP: "Move to top",
		HWHHM_REORDER_MOVE_UP: "Move up",
		HWHHM_REORDER_MOVE_DOWN: "Move down",
		HWHHM_REORDER_MOVE_BOTTOM: "Move to bottom",
		HWHHM_REORDER_LIST_VARIANT: "Reorder buttons",
		HWHHM_REORDER_LIST_VARIANT_FULL: "Full",
		HWHHM_REORDER_LIST_VARIANT_MINIMAL: "Minimal",
		HWHHM_ACCORDION_AUTO_SCROLL: "Accordion auto-scroll",
		HWHHM_ACCORDION_AUTO_SCROLL_HINT: "Controls whether opening a long section brings it into view.",
		HWHHM_ACCORDION_AUTO_SCROLL_OFF: "Off",
		HWHHM_ACCORDION_AUTO_SCROLL_INSTANT: "Instant",
		HWHHM_ACCORDION_AUTO_SCROLL_SMOOTH: "Smooth",
		HWHHM_EVOLUTION_SHOPS: "Soul stone shops",
		HWHHM_SKIN_COINS: "Skin coin reserves",
		HWHHM_RUNE_RESERVES: "Rune reserves",
		HWHHM_SPARK_RESERVE: "Spark reserve",
		HWHHM_ARTIFACT_RESERVES: "Artifact resource reserves",
		HWHHM_ASGARD_RESERVES: "Asgard resource reserves",
		HWHHM_MODULE_SETTINGS: "Module settings",
		HWHHM_HERO_LIST: "Heroes",
		HWHHM_UPGRADE_MODE: "Upgrade mode",
		HWHHM_UPGRADE_MODE_MAX: "To target / maximum",
		HWHHM_UPGRADE_MODE_LEVELS: "Only N levels",
		HWHHM_EXECUTION_MODE: "Queue execution",
		HWHHM_EXECUTION_MODE_HINT: "Sequential mode respects the order of heroes and targets. Parallel mode ignores it and chooses available upgrades.",
		HWHHM_EXECUTION_MODE_SEQUENTIAL: "Sequential (use queue order)",
		HWHHM_EXECUTION_MODE_PARALLEL: "Parallel (ignore queue order)",
		HWHHM_LEVEL_LIMIT_TITLE: "Levels per module",
		HWHHM_LEVEL_LIMIT_HINT: "These limits are applied to this launch. Shop purchases needed for evolution are kept only when the evolution module has a positive limit.",
		HWHHM_LEVEL_LIMIT_FIELD: "{module}",
		HWHHM_LEVEL_LIMIT_RUN: "Run",
		HWHHM_LEVEL_LIMIT_CANCEL: "Cancel",
		HWHHM_DO_YOUR_BEST_PLACEMENT_LABEL: "Checkbox position",
		HWHHM_DO_YOUR_BEST_PLACEMENT_NONE: "Do not add",
		HWHHM_DO_YOUR_BEST_PLACEMENT_END: "At the bottom",
		HWHHM_DO_YOUR_BEST_PLACEMENT_BEFORE: "Before: {label}",
		HWHHM_DO_YOUR_BEST_PLACEMENT_AFTER: "After: {label}",
		HWHHM_DO_YOUR_BEST_ACTIONS: "Actions in Do all",
		HWHHM_DO_YOUR_BEST: "Hero manager",
		HWHHM_CURRENT_STAR: "Stars",
		HWHHM_SOUL_STONES: "Soul stones",
		HWHHM_CURRENT_SKINS: "Skins",
		HWHHM_RUNE_LEVELS: "Glyphs",
		HWHHM_ARTIFACT_LEVELS: "Artifacts",
		HWHHM_ASCENSION_PROGRESS: "Branches",
		HWHHM_ASCENSION_GLOBAL_RANK_CAP: "Global max branch",
		HWHHM_CURRENCY_LIMIT: "Limit {currency}",
		HWHHM_BUY_SOULS_IN_SHOP: "Buy soul stones in {shop}",
		HWHHM_SKILL_POINT_BUY_ENABLE: "Buy skill points for emeralds",
		HWHHM_SKILL_POINT_BUY_LIMIT: "Skill point buy limit",
		HWHHM_SKILL_POINTS_BOUGHT_TODAY: "Bought today",
		HWHHM_SKILL_POINT_BUY_ACTION: "Buy skill points",
		HWHHM_SKILL_POINT_BUY_RESULT: "Skill points +{amount}",
		HWHHM_RESULT_ACTION: "Action",
		HWHHM_RESULT_STAGE: "Stage",
		HWHHM_SKILL_LABEL: "Skill {tier}",
		HWHHM_RUNE_LABEL: "Glyph {tier}",
		HWHHM_ARTIFACT_SLOT: "Artifact {slot}",
		HWHHM_RUNNING: "Running hero manager queues.",
		HWHHM_NOTHING: "Nothing to upgrade with the current settings.",
		HWHHM_HERO_FALLBACK: "Hero {id}",
		HWHHM_SHOP_FALLBACK: "Shop {id}",
		HWHHM_LIMITS: "Limits",
		HWHHM_FINAL_LEVEL: "Final level",
		HWHHM_SKIN_CHESTS: "Skin stone chests",
		HWHHM_USE_SKIN_CHEST: "Open {chest}",
		HWHHM_SETTING_HINT: "Configures “{setting}” for this module."
	};
	var I18N_RU = {
		HWHHM_START_LOG: "Старт расширения {name} от {author} (v.{version})",
		HWHHM_BUTTON: "Менеджер героев",
		HWHHM_BUTTON_TITLE: "Открывает очереди прокачки героев и лимиты ресурсов.",
		HWHHM_TITLE: "Настройки менеджера героев",
		HWHHM_SAVE: "Сохранить",
		HWHHM_RUN: "Запустить",
		HWHHM_CLOSE: "Закрыть",
		HWHHM_EXPORT_SETTINGS: "Экспорт настроек",
		HWHHM_IMPORT_SETTINGS: "Импорт настроек",
		HWHHM_SETTINGS_SAVED: "Настройки сохранены.",
		HWHHM_SETTINGS_EXPORT_DONE: "Настройки выгружены в JSON.",
		HWHHM_SETTINGS_IMPORT_DONE: "Настройки импортированы.",
		HWHHM_SETTINGS_IMPORT_INVALID: "Этот JSON не похож на экспорт HWH Hero Manager.",
		HWHHM_SETTINGS_IMPORT_PARSE_ERROR: "Не удалось прочитать JSON настроек.",
		HWHHM_TRANSFER_EXPORT_TITLE: "Выберите разделы для экспорта",
		HWHHM_TRANSFER_IMPORT_TITLE: "Выберите разделы для импорта",
		HWHHM_TRANSFER_EXPORT_CONFIRM: "Экспортировать выбранное",
		HWHHM_TRANSFER_IMPORT_CONFIRM: "Импортировать выбранное",
		HWHHM_TRANSFER_FILE_LABEL: "JSON-файл Hero Manager",
		HWHHM_TRANSFER_SEARCH: "Поиск разделов",
		HWHHM_TRANSFER_CLEAR_SEARCH: "Очистить поиск",
		HWHHM_TRANSFER_EMPTY: "Подходящих разделов нет",
		HWHHM_TRANSFER_SELECT_ALL: "Выбрать всё",
		HWHHM_TRANSFER_CLEAR_ALL: "Снять всё",
		HWHHM_TRANSFER_SORT: "Сортировка",
		HWHHM_TRANSFER_SORT_BY_NAME: "По названию",
		HWHHM_TRANSFER_SORT_SELECTED: "Выбранные сверху",
		HWHHM_TRANSFER_SORT_ASC: "По возрастанию",
		HWHHM_TRANSFER_SORT_DESC: "По убыванию",
		HWHHM_TRANSFER_SECTION_TITLE: "Настройки раздела «{section}».",
		HWHHM_ERROR_GENERIC: "Что-то пошло не так. Подробности в консоли.",
		HWHHM_SECTION_INTERFACE: "Интерфейс",
		HWHHM_NAV_LABEL: "Разделы прокачки героев",
		HWHHM_INTERFACE_APPEARANCE: "Внешний вид и поведение",
		HWHHM_INTERFACE_LISTS: "Очереди и списки",
		HWHHM_UI_TOOLTIPS: "Показывать подсказки интерфейса",
		HWHHM_UI_TOOLTIPS_HINT: "Показывает оформленные пояснения к элементам при наведении и работе с клавиатуры.",
		HWHHM_GAME_ICONS: "Показывать игровые иконки",
		HWHHM_GAME_ICONS_HINT: "Загружает портреты героев и иконки ресурсов из игры. Текстовые иконки остаются fallback-ом.",
		HWHHM_MODULE_LOADING: "Загружаем героев и игровые ресурсы…",
		HWHHM_UI_THEME: "Тема интерфейса",
		HWHHM_UI_THEME_HINT: "Применяется к окну Менеджера героев.",
		HWHHM_SECTION_INFO_PANEL: "Настройка информационной панели",
		HWHHM_SECTION_GENERAL: "Общее",
		HWHHM_SECTION_UPGRADE_COMMON: "Общие настройки прокачки",
		HWHHM_SECTION_SKILLS: "Умения",
		HWHHM_SECTION_EVOLUTION: "Эволюция",
		HWHHM_SECTION_SKINS: "Облики",
		HWHHM_SECTION_RUNES: "Символы",
		HWHHM_SECTION_TITAN_GIFT: "Дар стихии",
		HWHHM_SECTION_ARTIFACTS: "Артефакты",
		HWHHM_SECTION_ASGARD: "Асгард",
		HWHHM_DONATE_TITLE: "Поддержка проекта",
		HWHHM_DONATE_TEXT: "Прямой перевод на карту Альфа-Банка. Без старого кошелька и платежного цирка.",
		HWHHM_DONATE_WALLET: "Карта Альфа-Банка: {wallet}",
		HWHHM_DONATE_QR_ALT: "QR-код для доната",
		HWHHM_DONATE_QR_LABEL: "Банковский перевод",
		HWHHM_DOCS_TITLE: "Документация",
		HWHHM_DOCS_TEXT: "Полезные ссылки по установке, зеркалам и общему UI kit.",
		HWHHM_DOCS_PRIMARY: "Документация",
		HWHHM_DOCS_MIRROR: "Зеркало {number}",
		HWHHM_DUMP_LIBRARY: "Игровая библиотека",
		HWHHM_DUMP_LIBRARY_TITLE: "Вывести runtime Hero Wars и игровые библиотеки в консоль.",
		HWHHM_BUTTON_PLACEMENT: "Кнопка «Менеджер героев»",
		HWHHM_BUTTON_PLACEMENT_MAIN: "Основное меню",
		HWHHM_BUTTON_PLACEMENT_OTHER: "Разное",
		HWHHM_HIDE_MAXED_ROWS: "Скрывать максимальных героев и цели",
		HWHHM_PROGRESS_AUTO_HIDE: "Скрывать окно результата по таймауту",
		HWHHM_PROGRESS_TIMEOUT: "Таймаут результата, мс",
		HWHHM_PROGRESS_POSITION: "Положение окна результата",
		HWHHM_PROGRESS_TOP_CENTER: "Сверху по центру",
		HWHHM_PROGRESS_TOP_RIGHT: "Правый верхний угол",
		HWHHM_PROGRESS_BOTTOM_RIGHT: "Правый нижний угол",
		HWHHM_PROGRESS_STYLE: "Стиль окна результата",
		HWHHM_PROGRESS_STYLE_DEFAULT: "Обычный",
		HWHHM_PROGRESS_STYLE_COMPACT: "Компактный",
		HWHHM_PROGRESS_STYLE_DASHBOARD: "Панель",
		HWHHM_GOLD_RESERVE: "Лимит золота",
		HWHHM_RESOURCE_EMERALDS: "Изумруды",
		HWHHM_RESULT_TITLE: "Результат Hero Manager",
		HWHHM_RESULT_TOTAL: "Выполнено {success}/{total} запланированных действий.",
		HWHHM_RESULT_SPENT: "Потрачено: {spent}",
		HWHHM_RESULT_NO_SPENT: "Расходы не зафиксированы.",
		HWHHM_RESOURCE_GOLD: "Золото",
		HWHHM_RESOURCE_COIN: "Монета {id}",
		HWHHM_RESOURCE_CONSUMABLE: "Расходник {id}",
		HWHHM_RESOURCE_ASCENSION_GEAR: "Самородок вознесения {id}",
		HWHHM_RESOURCE_HERO_SOULS: "Души героя {name}",
		HWHHM_EVOLUTION_TARGET: "Целевая звезда",
		HWHHM_ARTIFACT_TARGETS: "Цели артефактов",
		HWHHM_ASCENSION_RANK_CAP: "Качать до ветки",
		HWHHM_SKILL_POINTS: "Очки умений",
		HWHHM_REORDER_MOVE_TOP: "В начало",
		HWHHM_REORDER_MOVE_UP: "Выше",
		HWHHM_REORDER_MOVE_DOWN: "Ниже",
		HWHHM_REORDER_MOVE_BOTTOM: "В конец",
		HWHHM_REORDER_LIST_VARIANT: "Кнопки очередей",
		HWHHM_REORDER_LIST_VARIANT_FULL: "Полный",
		HWHHM_REORDER_LIST_VARIANT_MINIMAL: "Минимальный",
		HWHHM_ACCORDION_AUTO_SCROLL: "Автопрокрутка аккордеонов",
		HWHHM_ACCORDION_AUTO_SCROLL_HINT: "Определяет, нужно ли прокручивать длинный раздел к открытому содержимому.",
		HWHHM_ACCORDION_AUTO_SCROLL_OFF: "Отключена",
		HWHHM_ACCORDION_AUTO_SCROLL_INSTANT: "Мгновенно",
		HWHHM_ACCORDION_AUTO_SCROLL_SMOOTH: "Плавно",
		HWHHM_EVOLUTION_SHOPS: "Магазины душ",
		HWHHM_SKIN_COINS: "Лимиты монет обликов",
		HWHHM_RUNE_RESERVES: "Лимиты рун",
		HWHHM_SPARK_RESERVE: "Лимит искр",
		HWHHM_ARTIFACT_RESERVES: "Лимиты ресурсов артефактов",
		HWHHM_ASGARD_RESERVES: "Лимиты ресурсов асгарда",
		HWHHM_MODULE_SETTINGS: "Настройки модуля",
		HWHHM_HERO_LIST: "Герои",
		HWHHM_UPGRADE_MODE: "Режим прокачки",
		HWHHM_UPGRADE_MODE_MAX: "До цели / максимума",
		HWHHM_UPGRADE_MODE_LEVELS: "Только N уровней",
		HWHHM_EXECUTION_MODE: "Выполнение очередей",
		HWHHM_EXECUTION_MODE_HINT: "Последовательный режим соблюдает порядок героев и целей. Параллельный игнорирует его и выбирает доступные улучшения.",
		HWHHM_EXECUTION_MODE_SEQUENTIAL: "Последовательно (по очереди)",
		HWHHM_EXECUTION_MODE_PARALLEL: "Параллельно (без порядка очереди)",
		HWHHM_LEVEL_LIMIT_TITLE: "Уровни по модулям",
		HWHHM_LEVEL_LIMIT_HINT: "Эти лимиты применяются только к текущему запуску. Покупки душ для эволюции сохраняются только если у эволюции положительный лимит.",
		HWHHM_LEVEL_LIMIT_FIELD: "{module}",
		HWHHM_LEVEL_LIMIT_RUN: "Запустить",
		HWHHM_LEVEL_LIMIT_CANCEL: "Отмена",
		HWHHM_DO_YOUR_BEST_PLACEMENT_LABEL: "Куда поставить галочку",
		HWHHM_DO_YOUR_BEST_PLACEMENT_NONE: "Не добавлять",
		HWHHM_DO_YOUR_BEST_PLACEMENT_END: "В конец",
		HWHHM_DO_YOUR_BEST_PLACEMENT_BEFORE: "Перед: {label}",
		HWHHM_DO_YOUR_BEST_PLACEMENT_AFTER: "После: {label}",
		HWHHM_DO_YOUR_BEST_ACTIONS: "Действия в «Сделать всё»",
		HWHHM_DO_YOUR_BEST: "Менеджер героев",
		HWHHM_CURRENT_STAR: "Звезды",
		HWHHM_SOUL_STONES: "Камни душ",
		HWHHM_CURRENT_SKINS: "Облики",
		HWHHM_RUNE_LEVELS: "Символы",
		HWHHM_ARTIFACT_LEVELS: "Артефакты",
		HWHHM_ASCENSION_PROGRESS: "Ветки",
		HWHHM_ASCENSION_GLOBAL_RANK_CAP: "Общий потолок ветки",
		HWHHM_CURRENCY_LIMIT: "Лимит {currency}",
		HWHHM_BUY_SOULS_IN_SHOP: "Покупать души в {shop}",
		HWHHM_SKILL_POINT_BUY_ENABLE: "Покупать очки умений за изумруды",
		HWHHM_SKILL_POINT_BUY_LIMIT: "Лимит покупок очков умений",
		HWHHM_SKILL_POINTS_BOUGHT_TODAY: "Куплено сегодня",
		HWHHM_SKILL_POINT_BUY_ACTION: "Покупка очков умений",
		HWHHM_SKILL_POINT_BUY_RESULT: "Очки умений +{amount}",
		HWHHM_RESULT_ACTION: "Действие",
		HWHHM_RESULT_STAGE: "Стадия",
		HWHHM_SKILL_LABEL: "Умение {tier}",
		HWHHM_RUNE_LABEL: "Символ {tier}",
		HWHHM_ARTIFACT_SLOT: "Артефакт {slot}",
		HWHHM_RUNNING: "Запускаем очереди менеджера героев.",
		HWHHM_NOTHING: "При текущих настройках прокачивать нечего.",
		HWHHM_HERO_FALLBACK: "Герой {id}",
		HWHHM_SHOP_FALLBACK: "Магазин {id}",
		HWHHM_LIMITS: "Лимиты",
		HWHHM_FINAL_LEVEL: "Конечный уровень",
		HWHHM_SKIN_CHESTS: "Сундуки с камнями обликов",
		HWHHM_USE_SKIN_CHEST: "Вскрывать {chest}",
		HWHHM_SETTING_HINT: "Настраивает параметр «{setting}» этого модуля."
	};
	//#endregion
	//#region src/scripts/hwhheromanager/i18n/runtime.ts
	function getHeroManagerTranslations() {
		return getScriptTranslations({
			en: I18N_EN,
			ru: I18N_RU
		}, { scriptId: resolveCurrentUserscriptId("hwhheromanager") });
	}
	//#endregion
	//#region src/scripts/hwhheromanager/ui/module-view.ts
	function buildHeroManagerNumberControl({ key, id = "", label, icon = "coins", gameItemType = "", gameItemId = 0, value = 0, minValue = 0, maxValue = void 0, sideText = "", tooltip = "", compact = false, disabled = false, patch = void 0 }) {
		return {
			key: String(key || id || label),
			kind: "number",
			id,
			label,
			icon,
			gameItemType,
			gameItemId,
			value: normalizeNonNegativeInteger(value, 0),
			minValue,
			maxValue,
			sideText,
			tooltip,
			compact,
			disabled,
			patch
		};
	}
	function asPlainControlRecord(value) {
		return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
	}
	/** Настройки получают подсказку по умолчанию, строки очереди — только явную. */
	function decorateHeroManagerSettingsControls(controls, createTooltip) {
		return controls.map((control) => {
			var _source$label;
			const source = asPlainControlRecord(control);
			if (!source) return control;
			const label = String((_source$label = source.label) !== null && _source$label !== void 0 ? _source$label : "").trim();
			const nestedControls = Array.isArray(source.controls) ? decorateHeroManagerSettingsControls(source.controls, createTooltip) : void 0;
			return {
				...source,
				...nestedControls ? { controls: nestedControls } : {},
				tooltip: source.tooltip || (label ? createTooltip(label) : "")
			};
		});
	}
	//#endregion
	//#region src/scripts/hwhheromanager/core/helpers.ts
	function cloneWorkingInventory(value) {
		if (!isObjectLike(value)) return {};
		const inventory = {};
		Object.entries(value).forEach(([key, nestedValue]) => {
			inventory[key] = isObjectLike(nestedValue) ? cloneWorkingInventory(nestedValue) : nestedValue;
		});
		return inventory;
	}
	function createHeroManagerWorkingState(snapshot) {
		var _asRecordOrNull;
		return {
			inventory: cloneWorkingInventory(snapshot.inventory),
			gold: Number((_asRecordOrNull = asRecordOrNull(snapshot.userInfo)) === null || _asRecordOrNull === void 0 ? void 0 : _asRecordOrNull.gold) || 0
		};
	}
	function normalizeAmount(value) {
		return Math.max(0, Number(value) || 0);
	}
	function normalizeStringArray(values) {
		const sourceValues = Array.isArray(values) ? values : String(values !== null && values !== void 0 ? values : "").split(",").map((value) => value.trim());
		return [...new Set(sourceValues.map((value) => String(value !== null && value !== void 0 ? value : "").trim()))].filter(Boolean);
	}
	function normalizeOrderedValues(values, allowedValues, fallbackValues = allowedValues) {
		const allowedValueSet = new Set(allowedValues.map(String));
		const normalizedValues = normalizeStringArray(values).filter((value) => allowedValueSet.has(String(value)));
		const normalizedValueSet = new Set(normalizedValues);
		const fallback = normalizeStringArray(fallbackValues).filter((value) => allowedValueSet.has(String(value)));
		return [...normalizedValues, ...fallback.filter((value) => !normalizedValueSet.has(String(value)))];
	}
	function deriveSkillHeroIdsFromStoredTargets(skillTargets) {
		var _asRecordOrNull2;
		return Object.entries((_asRecordOrNull2 = asRecordOrNull(skillTargets)) !== null && _asRecordOrNull2 !== void 0 ? _asRecordOrNull2 : {}).filter(([, targets]) => {
			var _asRecordOrNull3;
			return Object.values((_asRecordOrNull3 = asRecordOrNull(targets)) !== null && _asRecordOrNull3 !== void 0 ? _asRecordOrNull3 : {}).some((value) => normalizeNonNegativeInteger(value, 0) > 0);
		}).map(([heroId]) => String(heroId));
	}
	function deriveSkillTierTargetsFromStoredTargets(skillTargets) {
		var _asRecordOrNull4;
		const targets = {};
		Object.values((_asRecordOrNull4 = asRecordOrNull(skillTargets)) !== null && _asRecordOrNull4 !== void 0 ? _asRecordOrNull4 : {}).forEach((heroTargets) => {
			var _asRecordOrNull5;
			Object.entries((_asRecordOrNull5 = asRecordOrNull(heroTargets)) !== null && _asRecordOrNull5 !== void 0 ? _asRecordOrNull5 : {}).forEach(([tier, value]) => {
				var _targets$tier;
				const normalizedValue = normalizeNonNegativeInteger(value, 0);
				if (normalizedValue > ((_targets$tier = targets[tier]) !== null && _targets$tier !== void 0 ? _targets$tier : 0)) targets[tier] = normalizedValue;
			});
		});
		return targets;
	}
	function normalizeBooleanMap(value, allowedValues, fallbackMap = {}) {
		var _asRecordOrNull6;
		const source = (_asRecordOrNull6 = asRecordOrNull(value)) !== null && _asRecordOrNull6 !== void 0 ? _asRecordOrNull6 : {};
		const values = {};
		allowedValues.forEach((key) => {
			const normalizedKey = String(key);
			values[normalizedKey] = source[normalizedKey] !== void 0 ? !!source[normalizedKey] : !!fallbackMap[normalizedKey];
		});
		return values;
	}
	function normalizeNumberMap(value) {
		const source = asRecordOrNull(value);
		if (!source) return {};
		const values = {};
		Object.entries(source).forEach(([key, amount]) => {
			if (key !== "") values[String(key)] = normalizeNonNegativeInteger(amount, 0);
		});
		return values;
	}
	function normalizeNestedNumberMap(value) {
		const source = asRecordOrNull(value);
		if (!source) return {};
		const values = {};
		Object.entries(source).forEach(([key, nestedValue]) => {
			if (key !== "") values[String(key)] = normalizeNumberMap(nestedValue);
		});
		return values;
	}
	function getNestedAmount(container, type, id) {
		const source = asRecordOrNull(container);
		const typeKey = String(type);
		const idKey = String(id);
		const direct = getRecordValue(source === null || source === void 0 ? void 0 : source[typeKey], idKey);
		if (direct !== void 0) return Number(direct) || 0;
		if (typeKey === "coin") return Number(getRecordValue(source === null || source === void 0 ? void 0 : source.coins, idKey)) || 0;
		return 0;
	}
	function setNestedAmount(container, type, id, amount) {
		var _asRecordOrNull7;
		const source = asRecordOrNull(container);
		if (!source) return;
		const typeKey = String(type);
		const key = String(id);
		const nested = (_asRecordOrNull7 = asRecordOrNull(source[typeKey])) !== null && _asRecordOrNull7 !== void 0 ? _asRecordOrNull7 : {};
		source[typeKey] = nested;
		nested[key] = normalizeAmount(amount);
	}
	function getCurrencyAmount(inventory, userInfo, currencyKey) {
		const [type, id] = String(currencyKey).split(":");
		if (type === "gold") {
			var _asRecordOrNull8;
			return Number((_asRecordOrNull8 = asRecordOrNull(userInfo)) === null || _asRecordOrNull8 === void 0 ? void 0 : _asRecordOrNull8.gold) || 0;
		}
		return getNestedAmount(inventory, type, id);
	}
	function spendCurrency(working, currencyKey, amount) {
		var _working$inventory;
		const [type, id] = String(currencyKey).split(":");
		const normalizedAmount = Number(amount) || 0;
		if (type === "gold") {
			working.gold = Math.max(0, (Number(working.gold) || 0) - normalizedAmount);
			return;
		}
		(_working$inventory = working.inventory) !== null && _working$inventory !== void 0 || (working.inventory = {});
		const current = getNestedAmount(working.inventory, type, id);
		setNestedAmount(working.inventory, type, id, current - normalizedAmount);
	}
	/** Зачисление нужно для промежуточного планирования наград до свежего снимка сервера. */
	function addCurrency(working, currencyKey, amount) {
		var _working$inventory2;
		const [type, id] = String(currencyKey).split(":");
		const normalizedAmount = Math.max(0, Number(amount) || 0);
		if (type === "gold") {
			working.gold = Math.max(0, (Number(working.gold) || 0) + normalizedAmount);
			return;
		}
		(_working$inventory2 = working.inventory) !== null && _working$inventory2 !== void 0 || (working.inventory = {});
		const current = getNestedAmount(working.inventory, type, id);
		setNestedAmount(working.inventory, type, id, current + normalizedAmount);
	}
	function canSpendCurrency(working, currencyKey, amount, reserve = 0) {
		return (currencyKey === "gold:0" ? Number(working.gold) || 0 : getCurrencyAmount(working.inventory, { gold: working.gold }, currencyKey)) - (Number(amount) || 0) >= Math.max(0, Number(reserve) || 0);
	}
	function parseCosts(cost) {
		var _asRecordOrNull9;
		const entries = [];
		for (const [type, values] of Object.entries((_asRecordOrNull9 = asRecordOrNull(cost)) !== null && _asRecordOrNull9 !== void 0 ? _asRecordOrNull9 : {})) {
			var _asRecordOrNull10;
			if (typeof values === "number") {
				entries.push({
					currencyKey: `${type}:0`,
					amount: Number(values) || 0
				});
				continue;
			}
			Object.entries((_asRecordOrNull10 = asRecordOrNull(values)) !== null && _asRecordOrNull10 !== void 0 ? _asRecordOrNull10 : {}).forEach(([id, amount]) => {
				entries.push({
					currencyKey: `${type}:${id}`,
					amount: Number(amount) || 0
				});
			});
		}
		return entries.filter((entry) => entry.amount > 0);
	}
	function parseCost(cost) {
		var _parseCosts$;
		return (_parseCosts$ = parseCosts(cost)[0]) !== null && _parseCosts$ !== void 0 ? _parseCosts$ : null;
	}
	function getHeroCurrentStar(hero) {
		var _ref, _ref2, _source$star;
		const source = asRecordOrNull(hero);
		return Math.max(1, Number((_ref = (_ref2 = (_source$star = source === null || source === void 0 ? void 0 : source.star) !== null && _source$star !== void 0 ? _source$star : source === null || source === void 0 ? void 0 : source.stars) !== null && _ref2 !== void 0 ? _ref2 : source === null || source === void 0 ? void 0 : source.evolution) !== null && _ref !== void 0 ? _ref : 1) || 1);
	}
	/** У артефактов героя slotId — индекс массива, а не поле level элемента. */
	function getHeroArtifactRecord(heroArtifacts, slotId) {
		var _asRecordOrNull12, _asRecordOrNull13;
		if (Array.isArray(heroArtifacts)) {
			var _asRecordOrNull11;
			const index = Number(slotId);
			return Number.isInteger(index) && index >= 0 ? (_asRecordOrNull11 = asRecordOrNull(heroArtifacts[index])) !== null && _asRecordOrNull11 !== void 0 ? _asRecordOrNull11 : {} : {};
		}
		return (_asRecordOrNull12 = asRecordOrNull((_asRecordOrNull13 = asRecordOrNull(heroArtifacts)) === null || _asRecordOrNull13 === void 0 ? void 0 : _asRecordOrNull13[String(slotId)])) !== null && _asRecordOrNull12 !== void 0 ? _asRecordOrNull12 : {};
	}
	function shouldHideRow(settings, disabled) {
		var _asRecordOrNull14;
		return !!((_asRecordOrNull14 = asRecordOrNull(settings)) === null || _asRecordOrNull14 === void 0 ? void 0 : _asRecordOrNull14.hideMaxedRows) && !!disabled;
	}
	function getSkillLevelValue(value) {
		var _ref3, _ref4, _ref5, _ref6, _record$level;
		const record = asRecordOrNull(value);
		const numericValue = Number((_ref3 = (_ref4 = (_ref5 = (_ref6 = (_record$level = record === null || record === void 0 ? void 0 : record.level) !== null && _record$level !== void 0 ? _record$level : record === null || record === void 0 ? void 0 : record.currentLevel) !== null && _ref6 !== void 0 ? _ref6 : record === null || record === void 0 ? void 0 : record.skillLevel) !== null && _ref5 !== void 0 ? _ref5 : record === null || record === void 0 ? void 0 : record.value) !== null && _ref4 !== void 0 ? _ref4 : record === null || record === void 0 ? void 0 : record.amount) !== null && _ref3 !== void 0 ? _ref3 : value);
		return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
	}
	function findSkillLevelInList(skills, skillId, tier) {
		const bySkillId = skills.find((entry) => {
			var _ref7, _ref8, _record$id;
			const record = asRecordOrNull(entry);
			return String((_ref7 = (_ref8 = (_record$id = record === null || record === void 0 ? void 0 : record.id) !== null && _record$id !== void 0 ? _record$id : record === null || record === void 0 ? void 0 : record.skillId) !== null && _ref8 !== void 0 ? _ref8 : record === null || record === void 0 ? void 0 : record.typeId) !== null && _ref7 !== void 0 ? _ref7 : "") === skillId;
		});
		if (bySkillId !== void 0) return bySkillId;
		return skills.find((entry) => {
			var _ref9, _record$tier;
			const record = asRecordOrNull(entry);
			return Number((_ref9 = (_record$tier = record === null || record === void 0 ? void 0 : record.tier) !== null && _record$tier !== void 0 ? _record$tier : record === null || record === void 0 ? void 0 : record.slot) !== null && _ref9 !== void 0 ? _ref9 : record === null || record === void 0 ? void 0 : record.position) === tier;
		});
	}
	function getCurrentSkillLevel(skills, skillId, tier) {
		var _ref10, _ref11;
		if (Array.isArray(skills)) {
			var _skills;
			const listedValue = findSkillLevelInList(skills, skillId, tier);
			if (listedValue !== void 0) return getSkillLevelValue(listedValue);
			return getSkillLevelValue((_skills = skills[tier - 1]) !== null && _skills !== void 0 ? _skills : skills[tier]);
		}
		const source = asRecordOrNull(skills);
		return getSkillLevelValue((_ref10 = (_ref11 = skillId ? source === null || source === void 0 ? void 0 : source[skillId] : void 0) !== null && _ref11 !== void 0 ? _ref11 : source === null || source === void 0 ? void 0 : source[String(tier)]) !== null && _ref10 !== void 0 ? _ref10 : source === null || source === void 0 ? void 0 : source[String(tier - 1)]);
	}
	function getSkillTierState(hero, tier, maxLevelLimit = 0, skillId) {
		const tierNumber = Number(tier);
		const normalizedSkillId = String(skillId !== null && skillId !== void 0 ? skillId : "").trim();
		const currentLevel = getCurrentSkillLevel(hero.skills, normalizedSkillId, tierNumber);
		const heroMaxLevel = Math.max(currentLevel, Number(hero.level) || currentLevel);
		const configuredMax = normalizeNonNegativeInteger(maxLevelLimit, 0);
		const maxLevel = Math.max(currentLevel, configuredMax > 0 ? configuredMax : heroMaxLevel);
		const unlocked = Number(hero.color) >= Number(SKILL_UNLOCK_COLORS[tierNumber - 1]);
		return {
			currentLevel,
			maxLevel,
			unlocked,
			disabled: !unlocked || currentLevel >= maxLevel
		};
	}
	function findRefillableEntry(refillableSource, refillableId, identCandidates = []) {
		var _asRecordOrNull15, _refillEntries$find;
		const refillEntries = Array.isArray(refillableSource) ? refillableSource : Object.values((_asRecordOrNull15 = asRecordOrNull(refillableSource)) !== null && _asRecordOrNull15 !== void 0 ? _asRecordOrNull15 : {});
		const identSet = new Set(identCandidates.map(String));
		return (_refillEntries$find = refillEntries.find((entry) => {
			var _source$ident;
			const source = asRecordOrNull(entry);
			return !!(source && (Number(source.id) === Number(refillableId) || identSet.has(String((_source$ident = source.ident) !== null && _source$ident !== void 0 ? _source$ident : ""))));
		})) !== null && _refillEntries$find !== void 0 ? _refillEntries$find : null;
	}
	function getSkillPointRefillState(userInfo) {
		var _asRecordOrNull16;
		return findRefillableEntry((_asRecordOrNull16 = asRecordOrNull(userInfo)) === null || _asRecordOrNull16 === void 0 ? void 0 : _asRecordOrNull16.refillable, 2, [
			"skillpoints",
			"skillPoints",
			"skillPoint"
		]);
	}
	function getSkillPointAmount(userInfo) {
		var _getSkillPointRefillS;
		const userInfoRecord = asRecordOrNull(userInfo);
		const refillable = asRecordOrNull(userInfoRecord === null || userInfoRecord === void 0 ? void 0 : userInfoRecord.refillable);
		const indexedEntry = asRecordOrNull(refillable === null || refillable === void 0 ? void 0 : refillable["1"]);
		return Number(indexedEntry === null || indexedEntry === void 0 ? void 0 : indexedEntry.amount) || Number((_getSkillPointRefillS = getSkillPointRefillState(userInfo)) === null || _getSkillPointRefillS === void 0 ? void 0 : _getSkillPointRefillS.amount) || 0;
	}
	function extractRefillCost(costValue) {
		var _map$find;
		if (Number.isFinite(Number(costValue)) && Number(costValue) > 0) return Number(costValue);
		const source = asRecordOrNull(costValue);
		if (!source) return 0;
		return (_map$find = [
			"starmoney",
			"emerald",
			"emeralds",
			"gem",
			"gems",
			"value",
			"amount",
			"cost",
			"price"
		].map((key) => Number(source[key]) || 0).find((candidate) => candidate > 0)) !== null && _map$find !== void 0 ? _map$find : 0;
	}
	function isCallSucceeded(result) {
		const source = asRecordOrNull(result);
		const nestedResult = asRecordOrNull(source === null || source === void 0 ? void 0 : source.result);
		return !!source && !source.error && !(nestedResult === null || nestedResult === void 0 ? void 0 : nestedResult.error);
	}
	function mergeSpent(spent = []) {
		const summary = /* @__PURE__ */ new Map();
		spent.forEach((entry) => {
			var _source$currencyKey;
			const source = asRecordOrNull(entry);
			const currencyKey = String((_source$currencyKey = source === null || source === void 0 ? void 0 : source.currencyKey) !== null && _source$currencyKey !== void 0 ? _source$currencyKey : "");
			const amount = Number(source === null || source === void 0 ? void 0 : source.amount) || 0;
			if (!currencyKey || amount <= 0) return;
			summary.set(currencyKey, (summary.get(currencyKey) || 0) + amount);
		});
		return [...summary.entries()].map(([currencyKey, amount]) => ({
			currencyKey,
			amount
		}));
	}
	function toTransportCall(call) {
		return {
			name: call.name,
			args: call.args,
			ident: call.ident
		};
	}
	function isHeroManagerDoYourBestTask(task) {
		return getDoYourBestTaskName(task) === DO_YOUR_BEST_TASK_NAME;
	}
	function collectCostKeysFromObject(value, keys = /* @__PURE__ */ new Set()) {
		const source = asRecordOrNull(value);
		if (!source) return keys;
		parseCosts(source.cost).forEach((cost) => keys.add(cost.currencyKey));
		Object.values(source).forEach((entry) => collectCostKeysFromObject(entry, keys));
		return keys;
	}
	function getAscensionCurrentMaxRank(hero) {
		var _asRecordOrNull17;
		const ascensions = asRecordOrNull((_asRecordOrNull17 = asRecordOrNull(hero)) === null || _asRecordOrNull17 === void 0 ? void 0 : _asRecordOrNull17.ascensions);
		const ranks = Object.keys(ascensions !== null && ascensions !== void 0 ? ascensions : {}).map((rank) => Number(rank) || 0);
		return Math.max(1, ...ranks);
	}
	function getAscensionHeroConfig(ascensionLib, heroId) {
		var _ref12, _asRecordOrNull18, _asRecordOrNull19;
		const source = asRecordOrNull(ascensionLib);
		const heroIdKey = String(heroId);
		return (_ref12 = (_asRecordOrNull18 = asRecordOrNull((_asRecordOrNull19 = asRecordOrNull(source === null || source === void 0 ? void 0 : source.id)) === null || _asRecordOrNull19 === void 0 ? void 0 : _asRecordOrNull19[heroIdKey])) !== null && _asRecordOrNull18 !== void 0 ? _asRecordOrNull18 : asRecordOrNull(source === null || source === void 0 ? void 0 : source[heroIdKey])) !== null && _ref12 !== void 0 ? _ref12 : null;
	}
	function getAscensionNodeConfig(ascensionLib, nodeId) {
		var _ref13, _asRecordOrNull20, _asRecordOrNull21, _asRecordOrNull22;
		const source = asRecordOrNull(ascensionLib);
		const nodeIdKey = String(nodeId);
		return (_ref13 = (_asRecordOrNull20 = asRecordOrNull((_asRecordOrNull21 = asRecordOrNull(source === null || source === void 0 ? void 0 : source.node)) === null || _asRecordOrNull21 === void 0 ? void 0 : _asRecordOrNull21[nodeIdKey])) !== null && _asRecordOrNull20 !== void 0 ? _asRecordOrNull20 : asRecordOrNull((_asRecordOrNull22 = asRecordOrNull(source === null || source === void 0 ? void 0 : source.nodes)) === null || _asRecordOrNull22 === void 0 ? void 0 : _asRecordOrNull22[nodeIdKey])) !== null && _ref13 !== void 0 ? _ref13 : null;
	}
	function getAscensionRankConfigs(heroConfig) {
		var _asRecordOrNull23;
		const source = asRecordOrNull(heroConfig);
		if (Array.isArray(source === null || source === void 0 ? void 0 : source.nodes)) return source.nodes.filter(isPlainObject).sort((left, right) => Number(left.rank) - Number(right.rank));
		return Object.entries((_asRecordOrNull23 = asRecordOrNull(source === null || source === void 0 ? void 0 : source.ranks)) !== null && _asRecordOrNull23 !== void 0 ? _asRecordOrNull23 : {}).map(([rank, config]) => {
			var _asRecordOrNull24;
			return {
				...(_asRecordOrNull24 = asRecordOrNull(config)) !== null && _asRecordOrNull24 !== void 0 ? _asRecordOrNull24 : {},
				rank: Number(rank)
			};
		});
	}
	function getAscensionRankGraph(heroConfig, rank) {
		const source = asRecordOrNull(heroConfig);
		return (Array.isArray(source === null || source === void 0 ? void 0 : source.graphData) ? source.graphData : []).filter(isPlainObject).find((entry) => Number(entry.rank) === Number(rank));
	}
	function getAscensionCost(node) {
		var _ref14, _source$cost;
		const source = asRecordOrNull(node);
		const requirements = asRecordOrNull(source === null || source === void 0 ? void 0 : source.requirements);
		return parseCosts((_ref14 = (_source$cost = source === null || source === void 0 ? void 0 : source.cost) !== null && _source$cost !== void 0 ? _source$cost : source === null || source === void 0 ? void 0 : source.price) !== null && _ref14 !== void 0 ? _ref14 : requirements === null || requirements === void 0 ? void 0 : requirements.cost);
	}
	function cloneUnlockedAscensionSet(hero, rank) {
		var _asRecordOrNull25;
		const ascensions = asRecordOrNull((_asRecordOrNull25 = asRecordOrNull(hero)) === null || _asRecordOrNull25 === void 0 ? void 0 : _asRecordOrNull25.ascensions);
		const nodes = ascensions === null || ascensions === void 0 ? void 0 : ascensions[String(rank)];
		return new Set((Array.isArray(nodes) ? nodes : []).map(Number));
	}
	function orderSkinEntries(entries, settings = void 0) {
		var _asRecordOrNull26;
		const orderValues = normalizeStringArray((_asRecordOrNull26 = asRecordOrNull(settings)) === null || _asRecordOrNull26 === void 0 ? void 0 : _asRecordOrNull26.skinTargetOrder);
		const entryByKey = new Map(entries.map((entry) => [getSkinOrderEntryKey(entry), entry]));
		const entryByLegacyId = new Map(entries.map((entry) => [String(entry.skinId), entry]));
		const usedEntryKeys = /* @__PURE__ */ new Set();
		return [...orderValues.map((value) => {
			var _entryByKey$get;
			return (_entryByKey$get = entryByKey.get(value)) !== null && _entryByKey$get !== void 0 ? _entryByKey$get : entryByLegacyId.get(String(value));
		}).filter((entry) => {
			if (!entry) return false;
			const key = getSkinOrderEntryKey(entry);
			if (usedEntryKeys.has(key)) return false;
			usedEntryKeys.add(key);
			return true;
		}), ...entries.filter((entry) => !usedEntryKeys.has(getSkinOrderEntryKey(entry)))];
	}
	function getSkinOrderEntryKey(entry) {
		var _entry$heroId, _entry$skinId;
		const heroId = String((_entry$heroId = entry.heroId) !== null && _entry$heroId !== void 0 ? _entry$heroId : "").trim();
		const skinId = String((_entry$skinId = entry.skinId) !== null && _entry$skinId !== void 0 ? _entry$skinId : "").trim();
		return heroId ? `${heroId}:${skinId}` : skinId;
	}
	//#endregion
	//#region src/scripts/hwhheromanager/settings/schema.ts
	var normalizeDoYourBestPlacement = createDoYourBestPlacementNormalizer();
	function normalizeHeroManagerActionTypes(values, fallbackValues = HERO_MANAGER_MODULE_KEYS) {
		const sourceValues = values === void 0 ? fallbackValues : normalizeStringArray(values);
		const allowedValueSet = new Set(HERO_MANAGER_MODULE_KEYS);
		return [...new Set(sourceValues)].map((value) => String(value !== null && value !== void 0 ? value : "").trim()).filter((value) => allowedValueSet.has(value));
	}
	function normalizeUpgradeLevelLimits(value) {
		const normalized = normalizeNumberMap(value);
		return Object.fromEntries(HERO_MANAGER_MODULE_KEYS.map((moduleKey) => {
			var _DEFAULT_SETTINGS$upg;
			return [moduleKey, normalizeNonNegativeInteger(normalized[moduleKey], (_DEFAULT_SETTINGS$upg = DEFAULT_SETTINGS.upgradeLevelLimits[moduleKey]) !== null && _DEFAULT_SETTINGS$upg !== void 0 ? _DEFAULT_SETTINGS$upg : 1)];
		}));
	}
	function normalizeUpgradeMode(value) {
		return value === "max" || value === "levels" ? value : "max";
	}
	function normalizeHeroManagerExecutionMode(value) {
		return value === "parallel" ? HERO_MANAGER_EXECUTION_MODE_PARALLEL : HERO_MANAGER_EXECUTION_MODE_SEQUENTIAL;
	}
	function normalizeHeroManagerModuleExecutionModes(value, legacyValue = DEFAULT_SETTINGS.executionMode) {
		const source = asPlainRecord$2(value);
		const legacyMode = normalizeHeroManagerExecutionMode(legacyValue);
		return Object.fromEntries(HERO_MANAGER_MODULE_KEYS.map((moduleKey) => {
			var _source$moduleKey;
			return [moduleKey, normalizeHeroManagerExecutionMode((_source$moduleKey = source[moduleKey]) !== null && _source$moduleKey !== void 0 ? _source$moduleKey : legacyMode)];
		}));
	}
	function normalizeHeroManagerSettingsTab(value) {
		const normalizedValue = String(value !== null && value !== void 0 ? value : "").trim();
		return HERO_MANAGER_SETTINGS_TAB_KEYS.includes(normalizedValue) ? normalizedValue : HERO_MANAGER_GENERAL_TAB_KEY;
	}
	function normalizeSettings(value) {
		var _raw$skillHeroIds;
		const raw = asPlainRecord$2(value);
		const progressSettings = normalizeProgressWindowSettings(raw, DEFAULT_SETTINGS);
		const storedSkillTargets = normalizeNestedNumberMap(raw.skillTargets);
		const skillTierTargets = {
			...deriveSkillTierTargetsFromStoredTargets(storedSkillTargets),
			...normalizeNumberMap(raw.skillTierTargets)
		};
		const skillTierEnabledFallback = Object.fromEntries(SKILL_TIER_IDS.map((tier) => {
			var _skillTierTargets$tie;
			return [String(tier), normalizeNonNegativeInteger((_skillTierTargets$tie = skillTierTargets[tier]) !== null && _skillTierTargets$tie !== void 0 ? _skillTierTargets$tie : skillTierTargets[String(tier)], 0) > 0];
		}));
		return {
			activeSettingsTab: normalizeHeroManagerSettingsTab(raw.activeSettingsTab),
			buttonPlacement: raw.buttonPlacement === "other" ? BUTTON_PLACEMENT_OTHER : BUTTON_PLACEMENT_MAIN,
			hideMaxedRows: normalizeBoolean$1(raw.hideMaxedRows, DEFAULT_SETTINGS.hideMaxedRows),
			showUiTooltips: normalizeBoolean$1(raw.showUiTooltips, DEFAULT_SETTINGS.showUiTooltips),
			showGameEntityIcons: normalizeBoolean$1(raw.showGameEntityIcons, DEFAULT_SETTINGS.showGameEntityIcons),
			uiTheme: normalizeUiTheme(raw.uiTheme),
			upgradeMode: normalizeUpgradeMode(raw.upgradeMode),
			executionMode: normalizeHeroManagerExecutionMode(raw.executionMode),
			moduleExecutionModes: normalizeHeroManagerModuleExecutionModes(raw.moduleExecutionModes, raw.executionMode),
			upgradeLevelLimits: normalizeUpgradeLevelLimits(raw.upgradeLevelLimits),
			doYourBestPlacement: normalizeDoYourBestPlacement(raw.doYourBestPlacement),
			doYourBestActionTypes: normalizeHeroManagerActionTypes(raw.doYourBestActionTypes, DEFAULT_SETTINGS.doYourBestActionTypes),
			reorderListVariant: normalizeReorderListVariant(raw.reorderListVariant, DEFAULT_SETTINGS.reorderListVariant),
			accordionAutoScrollMode: normalizeAccordionAutoScrollMode(raw.accordionAutoScrollMode, DEFAULT_SETTINGS.accordionAutoScrollMode),
			...progressSettings,
			skillHeroOrder: normalizeStringArray(raw.skillHeroOrder),
			skillHeroIds: normalizeStringArray((_raw$skillHeroIds = raw.skillHeroIds) !== null && _raw$skillHeroIds !== void 0 ? _raw$skillHeroIds : deriveSkillHeroIdsFromStoredTargets(storedSkillTargets)),
			skillTierOrder: normalizeOrderedValues(raw.skillTierOrder, SKILL_TIER_IDS, DEFAULT_SETTINGS.skillTierOrder),
			skillHeroTierOrder: Object.fromEntries(Object.entries(asPlainRecord$2(raw.skillHeroTierOrder)).map(([heroId, order]) => [String(heroId), normalizeOrderedValues(order, SKILL_TIER_IDS, DEFAULT_SETTINGS.skillTierOrder)])),
			skillTierTargets,
			skillTierEnabled: normalizeBooleanMap(raw.skillTierEnabled, SKILL_TIER_IDS, skillTierEnabledFallback),
			buySkillPointsForEmeralds: normalizeBoolean$1(raw.buySkillPointsForEmeralds, DEFAULT_SETTINGS.buySkillPointsForEmeralds),
			maxSkillPointPurchases: normalizeNonNegativeInteger(raw.maxSkillPointPurchases, 0),
			skillTargets: storedSkillTargets,
			skillGoldReserve: normalizeNonNegativeInteger(raw.skillGoldReserve, 0),
			evolutionHeroOrder: normalizeStringArray(raw.evolutionHeroOrder),
			evolutionHeroIds: normalizeStringArray(raw.evolutionHeroIds),
			evolutionStarCaps: normalizeNumberMap(raw.evolutionStarCaps),
			evolutionGoldReserve: normalizeNonNegativeInteger(raw.evolutionGoldReserve, 0),
			evolutionShopIds: normalizeStringArray(raw.evolutionShopIds),
			evolutionCoinReserves: normalizeNumberMap(raw.evolutionCoinReserves),
			skinHeroOrder: normalizeStringArray(raw.skinHeroOrder),
			skinTargetOrder: normalizeStringArray(raw.skinTargetOrder),
			skinKeys: normalizeStringArray(raw.skinKeys),
			skinLevelCaps: normalizeNumberMap(raw.skinLevelCaps),
			skinCoinReserves: normalizeNumberMap(raw.skinCoinReserves),
			skinChestIds: normalizeStringArray(raw.skinChestIds).filter((chestId) => SKIN_STONE_CHEST_IDS.includes(Number(chestId))),
			skinChestReserves: normalizeNumberMap(raw.skinChestReserves),
			runeHeroOrder: normalizeStringArray(raw.runeHeroOrder),
			runeHeroIds: normalizeStringArray(raw.runeHeroIds),
			runeTierOrder: normalizeOrderedValues(raw.runeTierOrder, RUNE_TIER_IDS, DEFAULT_SETTINGS.runeTierOrder),
			runeLevelCaps: normalizeNestedNumberMap(raw.runeLevelCaps),
			runeReserves: normalizeNumberMap(raw.runeReserves),
			runeGoldReserve: normalizeNonNegativeInteger(raw.runeGoldReserve, 0),
			titanGiftHeroOrder: normalizeStringArray(raw.titanGiftHeroOrder),
			titanGiftHeroIds: normalizeStringArray(raw.titanGiftHeroIds),
			titanGiftLevelCaps: normalizeNumberMap(raw.titanGiftLevelCaps),
			titanGiftReserve: normalizeNonNegativeInteger(raw.titanGiftReserve, 0),
			titanGiftGoldReserve: normalizeNonNegativeInteger(raw.titanGiftGoldReserve, 0),
			artifactHeroOrder: normalizeStringArray(raw.artifactHeroOrder),
			artifactHeroIds: normalizeStringArray(raw.artifactHeroIds),
			artifactSlotOrder: normalizeOrderedValues(raw.artifactSlotOrder, ARTIFACT_SLOT_IDS, DEFAULT_SETTINGS.artifactSlotOrder),
			artifactSlots: normalizeStringArray(raw.artifactSlots).filter((slotId) => ARTIFACT_SLOT_IDS.includes(Number(slotId))),
			artifactLevelCaps: {
				...DEFAULT_SETTINGS.artifactLevelCaps,
				...normalizeNumberMap(raw.artifactLevelCaps)
			},
			artifactTargets: normalizeNestedNumberMap(raw.artifactTargets),
			artifactReserves: normalizeNumberMap(raw.artifactReserves),
			ascensionHeroOrder: normalizeStringArray(raw.ascensionHeroOrder),
			ascensionHeroIds: normalizeStringArray(raw.ascensionHeroIds),
			ascensionGlobalRankCap: Math.max(1, normalizeNonNegativeInteger(raw.ascensionGlobalRankCap, DEFAULT_SETTINGS.ascensionGlobalRankCap)),
			ascensionRankCaps: normalizeNumberMap(raw.ascensionRankCaps),
			ascensionResourceReserves: normalizeNumberMap(raw.ascensionResourceReserves)
		};
	}
	var DEFAULT_NORMALIZED_HERO_MANAGER_SETTINGS = normalizeSettings(DEFAULT_SETTINGS);
	//#endregion
	//#region src/scripts/hwhheromanager/settings/transfer.ts
	var HERO_MANAGER_SETTINGS_TRANSFER_GROUPS = [
		{
			key: HERO_MANAGER_GENERAL_TAB_KEY,
			labelKey: "HWHHM_SECTION_UPGRADE_COMMON",
			icon: "target",
			settingsKeys: [
				"upgradeMode",
				"executionMode",
				"moduleExecutionModes",
				"upgradeLevelLimits",
				"doYourBestPlacement",
				"doYourBestActionTypes"
			]
		},
		{
			key: "skills",
			labelKey: "HWHHM_SECTION_SKILLS",
			icon: "zap",
			settingsKeys: [
				"skillHeroOrder",
				"skillHeroIds",
				"skillTierOrder",
				"skillHeroTierOrder",
				"skillTierTargets",
				"skillTierEnabled",
				"buySkillPointsForEmeralds",
				"maxSkillPointPurchases",
				"skillTargets",
				"skillGoldReserve"
			]
		},
		{
			key: "evolutions",
			labelKey: "HWHHM_SECTION_EVOLUTION",
			icon: "sparkles",
			settingsKeys: [
				"evolutionHeroOrder",
				"evolutionHeroIds",
				"evolutionStarCaps",
				"evolutionGoldReserve",
				"evolutionShopIds",
				"evolutionCoinReserves"
			]
		},
		{
			key: "skins",
			labelKey: "HWHHM_SECTION_SKINS",
			icon: "shirt",
			settingsKeys: [
				"skinHeroOrder",
				"skinTargetOrder",
				"skinKeys",
				"skinLevelCaps",
				"skinCoinReserves",
				"skinChestIds",
				"skinChestReserves"
			]
		},
		{
			key: "runes",
			labelKey: "HWHHM_SECTION_RUNES",
			icon: "gem",
			settingsKeys: [
				"runeHeroOrder",
				"runeHeroIds",
				"runeTierOrder",
				"runeLevelCaps",
				"runeReserves",
				"runeGoldReserve"
			]
		},
		{
			key: "gifts",
			labelKey: "HWHHM_SECTION_TITAN_GIFT",
			icon: "sparkles",
			settingsKeys: [
				"titanGiftHeroOrder",
				"titanGiftHeroIds",
				"titanGiftLevelCaps",
				"titanGiftReserve",
				"titanGiftGoldReserve"
			]
		},
		{
			key: "artifacts",
			labelKey: "HWHHM_SECTION_ARTIFACTS",
			icon: "hammer",
			settingsKeys: [
				"artifactHeroOrder",
				"artifactHeroIds",
				"artifactSlotOrder",
				"artifactSlots",
				"artifactLevelCaps",
				"artifactTargets",
				"artifactReserves"
			]
		},
		{
			key: "asgard",
			labelKey: "HWHHM_SECTION_ASGARD",
			icon: "shield",
			settingsKeys: [
				"ascensionHeroOrder",
				"ascensionHeroIds",
				"ascensionGlobalRankCap",
				"ascensionRankCaps",
				"ascensionResourceReserves"
			]
		},
		{
			key: HERO_MANAGER_INTERFACE_TAB_KEY,
			labelKey: "HWHHM_SECTION_INTERFACE",
			icon: "monitor",
			settingsKeys: [
				"activeSettingsTab",
				"uiTheme",
				"showUiTooltips",
				"showGameEntityIcons",
				"buttonPlacement",
				"hideMaxedRows",
				"reorderListVariant",
				"accordionAutoScrollMode",
				"progressWindowPosition",
				"progressWindowStyle",
				"progressAutoHideResult",
				"progressAutoHideResultTimeoutMs"
			]
		}
	];
	function pickSettingsKeys(settings, keys) {
		return Object.fromEntries(keys.map((key) => [key, settings[key]]));
	}
	function splitHeroManagerSettings(settings) {
		const normalizedSettings = normalizeSettings(settings);
		return Object.fromEntries(HERO_MANAGER_SETTINGS_TRANSFER_GROUPS.map((group) => [group.key, pickSettingsKeys(normalizedSettings, group.settingsKeys)]));
	}
	function buildHeroManagerSettingsTransferOptions(translate) {
		return HERO_MANAGER_SETTINGS_TRANSFER_GROUPS.map((group) => {
			const label = translate(group.labelKey);
			return {
				key: group.key,
				label,
				icon: group.icon,
				checked: true,
				title: translate("HWHHM_TRANSFER_SECTION_TITLE", { section: label })
			};
		});
	}
	function buildHeroManagerSettingsTransferLabels(translate) {
		return {
			exportSelectTitle: translate("HWHHM_TRANSFER_EXPORT_TITLE"),
			importSelectTitle: translate("HWHHM_TRANSFER_IMPORT_TITLE"),
			exportSelectConfirm: translate("HWHHM_TRANSFER_EXPORT_CONFIRM"),
			importSelectConfirm: translate("HWHHM_TRANSFER_IMPORT_CONFIRM"),
			cancel: translate("HWHHM_CLOSE"),
			importFileLabel: translate("HWHHM_TRANSFER_FILE_LABEL"),
			searchPlaceholder: translate("HWHHM_TRANSFER_SEARCH"),
			clearSearch: translate("HWHHM_TRANSFER_CLEAR_SEARCH"),
			noOptions: translate("HWHHM_TRANSFER_EMPTY"),
			selectAll: translate("HWHHM_TRANSFER_SELECT_ALL"),
			clearAll: translate("HWHHM_TRANSFER_CLEAR_ALL"),
			sort: translate("HWHHM_TRANSFER_SORT"),
			sortByLabel: translate("HWHHM_TRANSFER_SORT_BY_NAME"),
			sortSelected: translate("HWHHM_TRANSFER_SORT_SELECTED"),
			sortAsc: translate("HWHHM_TRANSFER_SORT_ASC"),
			sortDesc: translate("HWHHM_TRANSFER_SORT_DESC"),
			exportDone: translate("HWHHM_SETTINGS_EXPORT_DONE"),
			importDone: translate("HWHHM_SETTINGS_IMPORT_DONE"),
			parseError: translate("HWHHM_SETTINGS_IMPORT_PARSE_ERROR")
		};
	}
	function buildHeroManagerSettingsExportPayload(settings, scriptInfo) {
		var _scriptInfo$name, _scriptInfo$version;
		return buildSettingsExportPayload({
			scriptId: "hwhheromanager",
			scriptName: String((_scriptInfo$name = scriptInfo.name) !== null && _scriptInfo$name !== void 0 ? _scriptInfo$name : "HWH Hero Manager"),
			scriptVersion: String((_scriptInfo$version = scriptInfo.version) !== null && _scriptInfo$version !== void 0 ? _scriptInfo$version : ""),
			exportVersion: 2,
			storageSchemaVersion: 1,
			data: splitHeroManagerSettings(settings)
		});
	}
	function filterHeroManagerSettingsImportPayload(payload, selectedKeys) {
		if (!isPlainObject(payload) || !isPlainObject(payload.data)) return payload;
		const data = isPlainObject(payload.data.settings) ? splitHeroManagerSettings(payload.data.settings) : payload.data;
		return filterSettingsTransferPayloadData({
			...payload,
			data
		}, selectedKeys);
	}
	function getHeroManagerSettingsImportData(payload, currentSettings, invalidMessage) {
		if (!isPlainObject(payload) || payload.scriptId !== "hwhheromanager" || !isPlainObject(payload.data)) throw new Error(invalidMessage);
		const mergedSettings = { ...normalizeSettings(currentSettings) };
		let importedGroupCount = 0;
		for (const group of HERO_MANAGER_SETTINGS_TRANSFER_GROUPS) {
			const groupData = payload.data[group.key];
			if (!isPlainObject(groupData)) continue;
			importedGroupCount += 1;
			for (const key of group.settingsKeys) if (Object.hasOwn(groupData, key)) mergedSettings[key] = groupData[key];
		}
		if (importedGroupCount === 0) throw new Error(invalidMessage);
		return normalizeSettings(mergedSettings);
	}
	function createHeroManagerSettingsTransferController({ translate, getScriptInfo, readSettings, writeSettings, showNotice, uiTheme = void 0 }) {
		const transferOptions = buildHeroManagerSettingsTransferOptions(translate);
		const labels = buildHeroManagerSettingsTransferLabels(translate);
		const invalidMessage = translate("HWHHM_SETTINGS_IMPORT_INVALID");
		return createSettingsTransferController({
			buildPayload: (settings) => buildHeroManagerSettingsExportPayload(settings, getScriptInfo()),
			buildFileName: () => "hwhheromanager.settings.json",
			parseImport: (payload) => getHeroManagerSettingsImportData(payload, readSettings(), invalidMessage),
			applyImport: async (settings) => {
				const normalizedSettings = normalizeSettings(settings);
				await writeSettings(normalizedSettings);
				return normalizedSettings;
			},
			showNotice,
			labels,
			exportOptions: transferOptions,
			importOptions: transferOptions,
			filterImportPayload: filterHeroManagerSettingsImportPayload,
			uiTheme,
			alwaysShowChecklist: true
		});
	}
	//#endregion
	//#region src/scripts/hwhheromanager/core/skill-config.ts
	function getCollectionEntry$1(collection, key) {
		const record = asPlainRecord$2(collection);
		const normalizedKey = String(key);
		if (record[normalizedKey] !== void 0) return record[normalizedKey];
		if (Array.isArray(collection)) {
			var _collection$find;
			const numericKey = Number(key);
			return (_collection$find = collection.find((entry) => {
				var _ref, _ref2, _ref3, _source$id;
				const source = asPlainRecord$2(entry);
				return String((_ref = (_ref2 = (_ref3 = (_source$id = source.id) !== null && _source$id !== void 0 ? _source$id : source.skillId) !== null && _ref3 !== void 0 ? _ref3 : source.typeId) !== null && _ref2 !== void 0 ? _ref2 : source.level) !== null && _ref !== void 0 ? _ref : "") === normalizedKey;
			})) !== null && _collection$find !== void 0 ? _collection$find : collection[numericKey];
		}
	}
	function getSkillDefinition(skillLibrary, id) {
		var _library$normalizedId;
		const normalizedId = String(id !== null && id !== void 0 ? id : "");
		const library = asPlainRecord$2(skillLibrary);
		const direct = (_library$normalizedId = library[normalizedId]) !== null && _library$normalizedId !== void 0 ? _library$normalizedId : asPlainRecord$2(library.id)[normalizedId];
		if (direct !== void 0) return asPlainRecord$2(direct);
		if (Array.isArray(skillLibrary)) {
			var _skillLibrary$map$fin;
			return (_skillLibrary$map$fin = skillLibrary.map(asPlainRecord$2).find((entry) => {
				var _ref4, _ref5, _entry$id;
				return String((_ref4 = (_ref5 = (_entry$id = entry.id) !== null && _entry$id !== void 0 ? _entry$id : entry.skillId) !== null && _ref5 !== void 0 ? _ref5 : entry.typeId) !== null && _ref4 !== void 0 ? _ref4 : "") === normalizedId;
			})) !== null && _skillLibrary$map$fin !== void 0 ? _skillLibrary$map$fin : {};
		}
		return {};
	}
	function getSkillId(value) {
		var _ref6, _ref7, _source$id2;
		const source = asPlainRecord$2(value);
		const id = (_ref6 = (_ref7 = (_source$id2 = source.id) !== null && _source$id2 !== void 0 ? _source$id2 : source.skillId) !== null && _ref7 !== void 0 ? _ref7 : source.typeId) !== null && _ref6 !== void 0 ? _ref6 : value;
		const normalizedId = String(id !== null && id !== void 0 ? id : "").trim();
		return normalizedId === "[object Object]" ? "" : normalizedId;
	}
	function collectSkillIds(source, skillLibrary, strategy) {
		const sourceRecord = asPlainRecord$2(source);
		const values = Array.isArray(source) ? source : strategy === "keys" ? Object.keys(sourceRecord) : strategy === "values" ? Object.values(sourceRecord) : [...Object.values(sourceRecord), ...Object.keys(sourceRecord)];
		const ids = /* @__PURE__ */ new Set();
		values.forEach((value) => {
			const id = getSkillId(value);
			if (id && Object.keys(getSkillDefinition(skillLibrary, id)).length > 0) ids.add(id);
		});
		return [...ids];
	}
	function getSkillTier(definition) {
		var _ref8, _ref9, _ref10, _definition$tier;
		const tier = Number((_ref8 = (_ref9 = (_ref10 = (_definition$tier = definition.tier) !== null && _definition$tier !== void 0 ? _definition$tier : definition.skillTier) !== null && _ref10 !== void 0 ? _ref10 : definition.levelTier) !== null && _ref9 !== void 0 ? _ref9 : definition.position) !== null && _ref8 !== void 0 ? _ref8 : definition.slot);
		return Number.isFinite(tier) ? tier : -1;
	}
	function getLevelCandidates(source) {
		var _ref11, _ref12, _ref13, _record$skillLevelCos;
		if (Array.isArray(source)) return source;
		const record = asPlainRecord$2(source);
		const nested = (_ref11 = (_ref12 = (_ref13 = (_record$skillLevelCos = record.skillLevelCost) !== null && _record$skillLevelCos !== void 0 ? _record$skillLevelCos : record.levels) !== null && _ref13 !== void 0 ? _ref13 : record.level) !== null && _ref12 !== void 0 ? _ref12 : record.data) !== null && _ref11 !== void 0 ? _ref11 : source;
		return Array.isArray(nested) ? nested : Object.values(asPlainRecord$2(nested));
	}
	/**
	* Достаёт последний реальный уровень навыка из конфига. Если конфиг приехал в другом
	* виде, берём только очевидные ключи/поля level — не выдумываем потолок из воздуха.
	*/
	function getConfiguredSkillMaxLevel(config) {
		var _record$skillLevelCos2;
		const source = (_record$skillLevelCos2 = asPlainRecord$2(config).skillLevelCost) !== null && _record$skillLevelCos2 !== void 0 ? _record$skillLevelCos2 : config;
		const sourceRecord = asPlainRecord$2(source);
		const keyLevels = Object.keys(sourceRecord).map((key) => Number(key)).filter((level) => Number.isFinite(level) && level > 0);
		const valueLevels = getLevelCandidates(source).flatMap((entry) => {
			const value = asPlainRecord$2(entry);
			return [
				value.level,
				value.id,
				value.requiredLevel
			].map((level) => Number(level)).filter((level) => Number.isFinite(level) && level > 0);
		});
		return Math.max(0, ...keyLevels, ...valueLevels);
	}
	/**
	* У разных умений разный сдвиг в enum.skillTier. Потолок всегда берём из него,
	* иначе герой с уровнем 130 честно пытается выкачать уже закрытый навык ещё раз.
	*/
	function getSkillTierMaxLevel(skillDefinition, skillTierConfig, hardLimit = 130, fallbackTier = 0) {
		var _getCollectionEntry;
		const limit = normalizeNonNegativeInteger(hardLimit, 130);
		const configuredTier = getSkillTier(asPlainRecord$2(skillDefinition));
		const skillTier = configuredTier >= 0 ? configuredTier : normalizeNonNegativeInteger(fallbackTier, 0);
		const skillLevel = normalizeNonNegativeInteger(asPlainRecord$2((_getCollectionEntry = getCollectionEntry$1(skillTierConfig, skillTier)) !== null && _getCollectionEntry !== void 0 ? _getCollectionEntry : getCollectionEntry$1(asPlainRecord$2(skillTierConfig).id, skillTier)).skillLevel, 0);
		return Math.max(0, limit - skillLevel);
	}
	function getSkillUpgradeGoldCost(config, level, tier) {
		var _asPlainRecord$skillL, _asPlainRecord$gold;
		const tierCost = asPlainRecord$2(getCollectionEntry$1((_asPlainRecord$skillL = asPlainRecord$2(config).skillLevelCost) !== null && _asPlainRecord$skillL !== void 0 ? _asPlainRecord$skillL : config, level)).tierCost;
		const tierIndex = Number(tier);
		const rawCost = Array.isArray(tierCost) ? tierCost[tierIndex] : asPlainRecord$2(tierCost)[String(tierIndex)];
		const cost = Number((_asPlainRecord$gold = asPlainRecord$2(rawCost).gold) !== null && _asPlainRecord$gold !== void 0 ? _asPlainRecord$gold : rawCost);
		return Number.isFinite(cost) && cost >= 0 ? cost : null;
	}
	function getHeroSkillReference(heroDefinition, skillLibrary, tier, playerSkills) {
		const hero = asPlainRecord$2(heroDefinition);
		const expectedTier = normalizeNonNegativeInteger(tier, 0);
		const candidates = [
			...collectSkillIds(hero.skill, skillLibrary, "values"),
			...collectSkillIds(hero.skillIds, skillLibrary, "values-and-keys"),
			...collectSkillIds(hero.skills, skillLibrary, "values-and-keys"),
			...collectSkillIds(hero.abilities, skillLibrary, "values-and-keys"),
			...collectSkillIds(playerSkills, skillLibrary, "keys")
		].filter((id, index, source) => source.indexOf(id) === index).map((id, index) => ({
			id,
			definition: getSkillDefinition(skillLibrary, id),
			index
		}));
		const byTier = candidates.find(({ definition }) => getSkillTier(definition) === expectedTier);
		const hasConfiguredTier = candidates.some(({ definition }) => getSkillTier(definition) >= 0);
		const byOrder = candidates[expectedTier - 1];
		const reference = byTier !== null && byTier !== void 0 ? byTier : hasConfiguredTier ? void 0 : byOrder;
		return reference ? {
			id: reference.id,
			definition: reference.definition
		} : null;
	}
	//#endregion
	//#region src/scripts/hwhheromanager/core/rune-config.ts
	function getCollectionEntry(collection, key) {
		if (Array.isArray(collection)) {
			const index = Number(key);
			return Number.isInteger(index) && index >= 0 ? collection[index] : void 0;
		}
		return asPlainRecord$2(collection)[String(key)];
	}
	function getRuneDefinition(runeLibrary, runeId) {
		var _getCollectionEntry;
		return asPlainRecord$2((_getCollectionEntry = getCollectionEntry(runeLibrary, runeId)) !== null && _getCollectionEntry !== void 0 ? _getCollectionEntry : getCollectionEntry(asPlainRecord$2(runeLibrary).id, runeId));
	}
	function normalizeRuneId(value) {
		var _ref, _ref2, _record$id;
		const record = asPlainRecord$2(value);
		const candidate = (_ref = (_ref2 = (_record$id = record.id) !== null && _record$id !== void 0 ? _record$id : record.runeId) !== null && _ref2 !== void 0 ? _ref2 : record.typeId) !== null && _ref !== void 0 ? _ref : value;
		const normalized = String(candidate !== null && candidate !== void 0 ? candidate : "").trim();
		return normalized && normalized !== "[object Object]" ? normalized : null;
	}
	function getStringValue(record, keys) {
		for (const key of keys) {
			var _record$key;
			const value = String((_record$key = record[key]) !== null && _record$key !== void 0 ? _record$key : "").trim();
			if (value && value !== "[object Object]") return value;
		}
		return "";
	}
	function getRuneStatToken(definition) {
		var _ref3, _definition$effect, _Object$keys$find;
		const direct = getStringValue(definition, [
			"battleStat",
			"battle_stat",
			"stat",
			"statType",
			"mainStat",
			"attribute",
			"bonusType"
		]);
		if (direct) return direct;
		const effect = asPlainRecord$2((_ref3 = (_definition$effect = definition.effect) !== null && _definition$effect !== void 0 ? _definition$effect : definition.bonus) !== null && _ref3 !== void 0 ? _ref3 : definition.stats);
		return (_Object$keys$find = Object.keys(effect).find(Boolean)) !== null && _Object$keys$find !== void 0 ? _Object$keys$find : "";
	}
	function formatRuneFallbackLabel(definition) {
		var _normalized$;
		const direct = getStringValue(definition, [
			"name",
			"title",
			"label"
		]);
		if (direct) return direct;
		const normalized = getRuneStatToken(definition).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();
		return normalized ? `${(_normalized$ = normalized[0]) === null || _normalized$ === void 0 ? void 0 : _normalized$.toUpperCase()}${normalized.slice(1)}` : "";
	}
	function getRuneStatTranslationTokens(stat) {
		const compact = stat.toUpperCase();
		const snakeCase = stat.replace(/([a-z])([A-Z])/g, "$1_$2").replace(/[\s-]+/g, "_").toUpperCase();
		return [...new Set([compact, snakeCase].filter(Boolean))];
	}
	/** Связывает слот руны героя с её игровым id, именем и иконкой из библиотеки. */
	function getHeroRuneReference(heroDefinition, runeLibrary, tier) {
		const runeId = normalizeRuneId(getCollectionEntry(asPlainRecord$2(heroDefinition).runes, tier));
		if (runeId === null) return null;
		const definition = getRuneDefinition(runeLibrary, runeId);
		const statTranslationTokens = getRuneStatTranslationTokens(getRuneStatToken(definition));
		const translationKeys = [
			getStringValue(definition, [
				"localeKey",
				"nameKey",
				"localeId",
				"locale_id",
				"locale_id_name",
				"locale_id_title"
			]),
			`LIB_RUNE_${runeId}`,
			`LIB_RUNE_NAME_${runeId}`,
			`LIB_RUNE_${runeId}_NAME`,
			...statTranslationTokens.flatMap((token) => [
				`LIB_BATTLESTATDATA_${token}`,
				`LIB_STAT_${token}`,
				`LIB_STAT_NAME_${token}`,
				`LIB_HERO_STAT_${token}`
			])
		].filter(Boolean);
		return {
			id: runeId,
			definition,
			fallbackLabel: formatRuneFallbackLabel(definition),
			translationKeys: [...new Set(translationKeys)]
		};
	}
	//#endregion
	//#region src/scripts/hwhheromanager/core/target-level.ts
	/**
	* Возвращает безопасную цель прокачки. Пустые и старые нулевые значения означают
	* «до максимума»: выключение очереди хранится отдельной галочкой, а не нулём в цели.
	*/
	function resolveHeroManagerTargetLevel(currentValue, maximumValue, configuredValue) {
		const current = normalizeNonNegativeInteger(currentValue, 0);
		const maximum = Math.max(current, normalizeNonNegativeInteger(maximumValue, current));
		const requested = normalizeNonNegativeInteger(configuredValue, 0);
		return Math.min(maximum, Math.max(current, requested > 0 ? requested : maximum));
	}
	//#endregion
	//#region src/scripts/hwhheromanager/core/execution-mode.ts
	function orderExecutionIds(selectedValues, orderedValues, mode) {
		const selectedIds = normalizeStringArray(selectedValues);
		const selectedSet = new Set(selectedIds);
		if (mode === "parallel") return [...selectedIds].sort(compareStableIds);
		const orderedIds = normalizeStringArray(orderedValues).filter((id) => selectedSet.has(id));
		const orderedSet = new Set(orderedIds);
		return [...orderedIds, ...selectedIds.filter((id) => !orderedSet.has(id))];
	}
	function compareStableIds(left, right) {
		const leftNumber = Number(left);
		const rightNumber = Number(right);
		if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
		return left.localeCompare(right, void 0, { numeric: true });
	}
	//#endregion
	//#region src/scripts/hwhheromanager/domain/skill-point-refill.ts
	function createSkillPointRefillModel(readRefillable) {
		let cachedConfig;
		const getConfig = () => {
			if (cachedConfig) return cachedConfig;
			const refill = findRefillableEntry(readRefillable(), 2, [
				"skillpoints",
				"skillPoints",
				"skillPoint"
			]);
			const costSequence = extractOrderedSequence(refill === null || refill === void 0 ? void 0 : refill.refillCost, extractRefillCost);
			cachedConfig = {
				costSequence: costSequence.length > 0 ? costSequence : [50],
				refillAmount: normalizeNonNegativeInteger(refill === null || refill === void 0 ? void 0 : refill.refillAmount) || 10
			};
			return cachedConfig;
		};
		const getPurchaseCost = (purchaseIndex = 0) => {
			var _ref, _costs$normalizeNonNe;
			const costs = getConfig().costSequence;
			return (_ref = (_costs$normalizeNonNe = costs[normalizeNonNegativeInteger(purchaseIndex)]) !== null && _costs$normalizeNonNe !== void 0 ? _costs$normalizeNonNe : costs[costs.length - 1]) !== null && _ref !== void 0 ? _ref : 50;
		};
		const getPurchaseSummaryCost = (purchaseLimit, startPurchaseIndex = 0) => {
			var _costs;
			const limit = normalizeNonNegativeInteger(purchaseLimit);
			const start = normalizeNonNegativeInteger(startPurchaseIndex);
			const costs = getConfig().costSequence;
			const fallback = (_costs = costs[costs.length - 1]) !== null && _costs !== void 0 ? _costs : 50;
			let total = 0;
			for (let index = start; index < start + limit; index += 1) {
				var _costs$index;
				total += (_costs$index = costs[index]) !== null && _costs$index !== void 0 ? _costs$index : fallback;
			}
			return total;
		};
		return {
			getPurchaseCost,
			getPurchaseSummaryCost,
			getPurchaseSummaryAmount: (count) => normalizeNonNegativeInteger(count) * getConfig().refillAmount,
			getRefillAmount: () => getConfig().refillAmount
		};
	}
	function extractOrderedSequence(value, extract) {
		return (Array.isArray(value) ? value.map((entry, index) => [String(index), entry]) : value && typeof value === "object" ? Object.entries(value).filter(([key]) => /^\d+$/.test(key)) : []).sort((left, right) => Number(left[0]) - Number(right[0])).map(([, entry]) => extract(entry)).filter((entry) => entry > 0);
	}
	//#endregion
	//#region src/scripts/hwhheromanager/runtime/snapshot.ts
	var HERO_MANAGER_SNAPSHOT_CALLS = [
		"heroGetAll",
		"inventoryGet",
		"userGetInfo",
		"shopGetAll"
	];
	function normalizeHeroManagerSnapshotResponse(response) {
		const [heroes, inventory, userInfo, shops] = Array.isArray(response) ? response : [];
		return {
			heroes: asPlainRecord$2(heroes),
			inventory: asPlainRecord$2(inventory),
			userInfo: asPlainRecord$2(userInfo),
			shops: asPlainRecord$2(shops)
		};
	}
	async function fetchHeroManagerSnapshot(caller) {
		return normalizeHeroManagerSnapshotResponse(await caller.send(HERO_MANAGER_SNAPSHOT_CALLS));
	}
	function getSnapshotHero(snapshot, heroId) {
		const hero = getRecordValue(snapshot.heroes, heroId);
		return isPlainObject(hero) ? hero : null;
	}
	function getSnapshotHeroes(snapshot) {
		return Object.values(snapshot.heroes).filter(isPlainObject).map((hero) => hero);
	}
	function getSnapshotShops(snapshot) {
		return Object.values(snapshot.shops).filter(isPlainObject).map((shop) => shop);
	}
	function getShopSlots(shop) {
		return Object.values(asPlainRecord$2(shop.slots)).filter(isPlainObject).map((slot) => slot);
	}
	//#endregion
	//#region src/shared/ui/result-summary-model.ts
	function defaultNormalizeRows(rowsValue) {
		if (Array.isArray(rowsValue)) return rowsValue;
		return rowsValue == null ? [] : [rowsValue];
	}
	function normalizeRowHtml(row) {
		return String(row !== null && row !== void 0 ? row : "").trim().replace(/^(<br\s*\/?>)+/i, "");
	}
	function normalizeRowOptions(options) {
		return typeof options === "string" ? { kind: options } : options;
	}
	function buildResultRowModel(contentHtml, options = {}, index = 0) {
		const { kind = "technical" } = normalizeRowOptions(options);
		return {
			key: `${kind}-${index}`,
			html: String(contentHtml !== null && contentHtml !== void 0 ? contentHtml : ""),
			kind
		};
	}
	function buildResultAccordionModel$1({ key, title, icon, rows, count, tone = "technical", rowKind = "technical", wrapRows = true, defaultOpen = true, formatCount = (value) => String(value), normalizeRows = defaultNormalizeRows } = {}) {
		const sourceRows = normalizeRows(rows);
		const normalizedRows = [];
		for (let index = 0; index < sourceRows.length; index += 1) {
			const rowHtml = normalizeRowHtml(sourceRows[index]);
			if (rowHtml) normalizedRows.push(buildResultRowModel(rowHtml, { kind: rowKind }, index));
		}
		if (normalizedRows.length === 0) return null;
		const normalizedTitle = String(title !== null && title !== void 0 ? title : "");
		const normalizedTone = String(tone !== null && tone !== void 0 ? tone : "technical");
		const countValue = count !== null && count !== void 0 ? count : normalizedRows.length;
		return {
			key: String(key !== null && key !== void 0 ? key : "").trim().replace(/\s+/g, "-") || `${normalizedTone}-${normalizedTitle}`,
			title: normalizedTitle,
			icon: String(icon !== null && icon !== void 0 ? icon : ""),
			rows: normalizedRows,
			countText: formatCount(countValue),
			tone: normalizedTone,
			wrapRows,
			defaultOpen
		};
	}
	function createResultSummaryBuilder({ kind = "technical", tone = "technical", rowKind = kind, wrapRows = true, defaultOpen = true, formatCount = (value) => String(value), normalizeRows = defaultNormalizeRows } = {}) {
		return { buildAccordionModel(options = {}) {
			return buildResultAccordionModel$1({
				tone,
				rowKind,
				wrapRows,
				defaultOpen,
				formatCount,
				normalizeRows,
				...options
			});
		} };
	}
	//#endregion
	//#region src/scripts/hwhheromanager/ui/result-summary.ts
	var { buildAccordionModel: buildResultAccordionModel } = createResultSummaryBuilder({ wrapRows: false });
	function createHeroManagerResultSummaryBuilders([translate, formatNumber, getResourceName, isCallSucceeded, buildIconLabel]) {
		const resultModuleConfigs = HERO_MANAGER_MODULE_DEFINITIONS.map((definition) => ({
			key: definition.key,
			label: translate(definition.labelKey),
			icon: definition.icon,
			tone: definition.resultTone
		}));
		function getResultModuleConfig(moduleKey) {
			var _resultModuleConfigs$;
			const normalizedModuleKey = String(moduleKey !== null && moduleKey !== void 0 ? moduleKey : "technical");
			return (_resultModuleConfigs$ = resultModuleConfigs.find((config) => config.key === normalizedModuleKey)) !== null && _resultModuleConfigs$ !== void 0 ? _resultModuleConfigs$ : {
				label: normalizedModuleKey,
				icon: "check",
				tone: "technical"
			};
		}
		function formatSpentList(spent = []) {
			const mergedSpent = mergeSpent(spent);
			if (mergedSpent.length <= 0) return translate("HWHHM_RESULT_NO_SPENT");
			return mergedSpent.map((entry) => `${getResourceName(entry.currencyKey)}: ${formatNumber(entry.amount)}`).join(", ");
		}
		function buildResultRow(plannedCall, result, index) {
			var _meta$from, _meta$to, _meta$action;
			const meta = plannedCall.__hwhhm;
			const success = isCallSucceeded(result);
			const stageMarkup = meta.from !== void 0 || meta.to !== void 0 ? `<span class="hwhx-result-stage"><span class="hwhx-result-stage__label">${escapeHtml(translate("HWHHM_RESULT_STAGE"))}</span><span class="hwhx-result-stage__from">${escapeHtml((_meta$from = meta.from) !== null && _meta$from !== void 0 ? _meta$from : "")}</span><span class="hwhx-result-stage__arrow">→</span><span class="hwhx-result-stage__to">${escapeHtml((_meta$to = meta.to) !== null && _meta$to !== void 0 ? _meta$to : "")}</span></span>` : "";
			const spent = formatSpentList(success ? meta.spent : []);
			const moduleTone = getResultModuleConfig(meta.module).tone;
			const rowTitle = meta.heroName || meta.action || plannedCall.name;
			return `<div class="hwhx-result-row" data-kind="${success ? escapeHtml(moduleTone) : "technical"}"><div class="hwhx-result-row__head">${buildIconLabel(success ? "check" : "alert-triangle", `${index + 1}. ${rowTitle}`)}</div><div class="hwhx-result-row__body"><span class="hwhx-result-action"><span class="hwhx-result-action__label">${escapeHtml(translate("HWHHM_RESULT_ACTION"))}</span><span class="hwhx-result-action__value">${escapeHtml((_meta$action = meta.action) !== null && _meta$action !== void 0 ? _meta$action : plannedCall.name)}</span></span>${stageMarkup}<span class="hwhx-result-spent">${escapeHtml(translate("HWHHM_RESULT_SPENT", { spent }))}</span></div></div>`;
		}
		function buildHeroManagerResult(plannedCalls, results) {
			const successCount = results.filter(isCallSucceeded).length;
			const successfulSpent = plannedCalls.flatMap((plannedCall, index) => {
				var _plannedCall$__hwhhm$, _plannedCall$__hwhhm;
				return isCallSucceeded(results[index]) ? (_plannedCall$__hwhhm$ = (_plannedCall$__hwhhm = plannedCall.__hwhhm) === null || _plannedCall$__hwhhm === void 0 ? void 0 : _plannedCall$__hwhhm.spent) !== null && _plannedCall$__hwhhm$ !== void 0 ? _plannedCall$__hwhhm$ : [] : [];
			});
			const grouped = /* @__PURE__ */ new Map();
			plannedCalls.forEach((plannedCall, index) => {
				var _plannedCall$__hwhhm$2, _plannedCall$__hwhhm2, _grouped$get, _results$index;
				const moduleKey = (_plannedCall$__hwhhm$2 = (_plannedCall$__hwhhm2 = plannedCall.__hwhhm) === null || _plannedCall$__hwhhm2 === void 0 ? void 0 : _plannedCall$__hwhhm2.module) !== null && _plannedCall$__hwhhm$2 !== void 0 ? _plannedCall$__hwhhm$2 : "technical";
				if (!grouped.has(moduleKey)) grouped.set(moduleKey, []);
				(_grouped$get = grouped.get(moduleKey)) === null || _grouped$get === void 0 || _grouped$get.push({
					plannedCall,
					result: (_results$index = results[index]) !== null && _results$index !== void 0 ? _results$index : {},
					index
				});
			});
			const accordions = HERO_MANAGER_MODULE_KEYS.filter((moduleKey) => grouped.has(moduleKey)).flatMap((moduleKey) => {
				var _grouped$get2;
				const config = getResultModuleConfig(moduleKey);
				const entries = (_grouped$get2 = grouped.get(moduleKey)) !== null && _grouped$get2 !== void 0 ? _grouped$get2 : [];
				const successfulEntries = entries.filter((entry) => isCallSucceeded(entry.result));
				const rows = entries.map((entry) => buildResultRow(entry.plannedCall, entry.result, entry.index)).join("");
				const accordion = buildResultAccordionModel({
					title: config.label,
					icon: config.icon,
					rows,
					count: `${successfulEntries.length}/${entries.length}`,
					tone: config.tone
				});
				return accordion ? [accordion] : [];
			}).filter((accordion) => accordion !== null);
			return {
				messageHtml: `${buildIconLabel("check", translate("HWHHM_RESULT_TITLE"))}<br>${escapeHtml(translate("HWHHM_RESULT_TOTAL", {
					success: successCount,
					total: plannedCalls.length
				}))}<br>${escapeHtml(translate("HWHHM_RESULT_SPENT", { spent: formatSpentList(successfulSpent) }))}`,
				accordions
			};
		}
		return [getResultModuleConfig, buildHeroManagerResult];
	}
	//#endregion
	//#region src/scripts/hwhheromanager/ui/skills-view.ts
	/** Собирает модель дерева умений, не размазывая игровую логику по runtime. */
	function createHeroManagerSkillsViewBuilder(dependencies) {
		const skillNameCache = /* @__PURE__ */ new Map();
		const getSkillLevelCostConfig = () => {
			var _dependencies$getReco;
			return (_dependencies$getReco = dependencies.getRecordValue(dependencies.getLibraryData("level"), "skillLevelCost")) !== null && _dependencies$getReco !== void 0 ? _dependencies$getReco : dependencies.getLibraryData("skillLevelCost");
		};
		const getConfiguredMaxLevel = () => getConfiguredSkillMaxLevel(getSkillLevelCostConfig());
		const getSkillTierConfig = () => dependencies.getRecordValue(dependencies.getLibraryData("enum"), "skillTier");
		const getHeroSkillDefinition = (heroId, tier, playerSkills) => {
			var _dependencies$getReco2;
			const heroLibrary = dependencies.getLibraryData("hero");
			return getHeroSkillReference((_dependencies$getReco2 = dependencies.getRecordValue(heroLibrary, heroId)) !== null && _dependencies$getReco2 !== void 0 ? _dependencies$getReco2 : dependencies.getNestedRecord(heroLibrary, "id", heroId), dependencies.getLibraryData("skill"), tier, playerSkills);
		};
		const getSkillName = (heroId, tier, playerSkills) => {
			var _translationKeys$map$;
			const cacheKey = `${String(heroId)}:${String(tier)}`;
			const cachedName = skillNameCache.get(cacheKey);
			if (cachedName) return cachedName;
			const reference = getHeroSkillDefinition(heroId, tier, playerSkills);
			const translationKeys = [
				reference === null || reference === void 0 ? void 0 : reference.definition.localeKey,
				reference === null || reference === void 0 ? void 0 : reference.definition.nameKey,
				(reference === null || reference === void 0 ? void 0 : reference.id) ? `LIB_SKILL_${reference.id}` : "",
				(reference === null || reference === void 0 ? void 0 : reference.id) ? `LIB_SKILL_NAME_${reference.id}` : "",
				`LIB_HERO_SKILL_${heroId}_${tier}`,
				`LIB_HERO_SKILL_NAME_${heroId}_${tier}`
			].map((key) => String(key !== null && key !== void 0 ? key : "").trim()).filter(Boolean);
			const name = (_translationKeys$map$ = translationKeys.map((key) => dependencies.translateGame(key)).find((value, index) => value && value !== translationKeys[index])) !== null && _translationKeys$map$ !== void 0 ? _translationKeys$map$ : dependencies.translate("HWHHM_SKILL_LABEL", { tier: Number(tier) || 0 });
			const normalizedName = String(name);
			skillNameCache.set(cacheKey, normalizedName);
			return normalizedName;
		};
		const getSkillMaxLevel = (heroId, tier, playerSkills) => {
			const reference = getHeroSkillDefinition(heroId, tier, playerSkills);
			return getSkillTierMaxLevel(reference === null || reference === void 0 ? void 0 : reference.definition, getSkillTierConfig(), 130, tier);
		};
		const getSkillTierOrder = (settings, heroId) => {
			var _settings$skillHeroTi, _settings$skillHeroTi2;
			return normalizeOrderedValues((_settings$skillHeroTi = (_settings$skillHeroTi2 = settings.skillHeroTierOrder) === null || _settings$skillHeroTi2 === void 0 ? void 0 : _settings$skillHeroTi2[String(heroId)]) !== null && _settings$skillHeroTi !== void 0 ? _settings$skillHeroTi : settings.skillTierOrder, SKILL_TIER_IDS, SKILL_TIER_IDS);
		};
		const getSkillTargetLevel = (settings, heroId, tier, currentLevel, maxLevel) => {
			var _settings$skillTierEn, _settings$skillTierEn2, _settings$skillTierTa, _settings$skillTierTa2, _settings$skillTierTa3;
			const current = normalizeNonNegativeInteger(currentLevel, 0);
			const max = Math.max(current, normalizeNonNegativeInteger(maxLevel, current));
			const heroTargets = dependencies.getNestedRecord(settings.skillTargets, heroId);
			const key = String(tier);
			const legacyTarget = ((_settings$skillTierEn = settings.skillTierEnabled) === null || _settings$skillTierEn === void 0 ? void 0 : _settings$skillTierEn[key]) || ((_settings$skillTierEn2 = settings.skillTierEnabled) === null || _settings$skillTierEn2 === void 0 ? void 0 : _settings$skillTierEn2[Number(tier)]) ? (_settings$skillTierTa = (_settings$skillTierTa2 = settings.skillTierTargets) === null || _settings$skillTierTa2 === void 0 ? void 0 : _settings$skillTierTa2[key]) !== null && _settings$skillTierTa !== void 0 ? _settings$skillTierTa : (_settings$skillTierTa3 = settings.skillTierTargets) === null || _settings$skillTierTa3 === void 0 ? void 0 : _settings$skillTierTa3[Number(tier)] : max;
			return Math.min(max, Math.max(current, normalizeNonNegativeInteger(Object.hasOwn(heroTargets, key) ? heroTargets[key] : legacyTarget, max)));
		};
		const buildSkillsSettingsView = (settings, userInfo) => {
			var _getSkillPointRefillS;
			const userInfoRecord = dependencies.getPlainRecord(userInfo);
			const boughtToday = Math.max(0, normalizeNonNegativeInteger((_getSkillPointRefillS = getSkillPointRefillState(userInfo)) === null || _getSkillPointRefillS === void 0 ? void 0 : _getSkillPointRefillS.boughtToday, 0));
			return {
				goldReserve: {
					id: "hwhhm-skill-gold-reserve",
					label: `${dependencies.translate("HWHHM_GOLD_RESERVE")} [${dependencies.formatNumber(userInfoRecord.gold)}]`,
					icon: "coins",
					...dependencies.getResourceIconControlProps("gold:0"),
					value: normalizeNonNegativeInteger(settings.skillGoldReserve, 0),
					tooltip: dependencies.translate("HWHHM_SETTING_HINT", { setting: dependencies.translate("HWHHM_GOLD_RESERVE") })
				},
				buySkillPoints: {
					id: "hwhhm-buy-skill-points",
					checked: !!settings.buySkillPointsForEmeralds,
					label: dependencies.translate("HWHHM_SKILL_POINT_BUY_ENABLE"),
					icon: "gem",
					...dependencies.getResourceIconControlProps("starmoney:0"),
					tooltip: dependencies.translate("HWHHM_SETTING_HINT", { setting: dependencies.translate("HWHHM_SKILL_POINT_BUY_ENABLE") })
				},
				skillPointLimit: {
					id: "hwhhm-skill-point-buy-limit",
					label: dependencies.translate("HWHHM_SKILL_POINT_BUY_LIMIT"),
					icon: "gem",
					...dependencies.getResourceIconControlProps("starmoney:0"),
					value: normalizeNonNegativeInteger(settings.maxSkillPointPurchases, 0),
					minValue: 0,
					maxValue: 999,
					tooltip: dependencies.translate("HWHHM_SETTING_HINT", { setting: dependencies.translate("HWHHM_SKILL_POINT_BUY_LIMIT") }),
					metrics: dependencies.buildSkillPointPurchaseMetrics(settings.maxSkillPointPurchases)
				},
				boughtToday: {
					label: dependencies.translate("HWHHM_SKILL_POINTS_BOUGHT_TODAY"),
					metrics: dependencies.buildSkillPointPurchaseMetrics(boughtToday, true)
				},
				skillPoints: {
					label: dependencies.translate("HWHHM_SKILL_POINTS"),
					value: dependencies.formatNumber(getSkillPointAmount(userInfo))
				}
			};
		};
		const buildSkillsQueueView = (heroes, settings) => {
			const selectedHeroSet = new Set(settings.skillHeroIds.map(String));
			let visibleIndex = 0;
			return {
				rows: dependencies.getOrderedHeroes(heroes, settings.skillHeroOrder).map((hero) => {
					const states = getSkillTierOrder(settings, hero.id).map((tier, index) => {
						var _reference$id;
						const numericTier = Number(tier);
						const reference = getHeroSkillDefinition(hero.id, numericTier, hero.skills);
						const state = getSkillTierState(hero, numericTier, getSkillMaxLevel(hero.id, numericTier, hero.skills), reference === null || reference === void 0 ? void 0 : reference.id);
						const targetLevel = getSkillTargetLevel(settings, hero.id, numericTier, state.currentLevel, state.maxLevel);
						return {
							...state,
							tier: numericTier,
							index,
							skillId: (_reference$id = reference === null || reference === void 0 ? void 0 : reference.id) !== null && _reference$id !== void 0 ? _reference$id : "",
							label: getSkillName(hero.id, numericTier, hero.skills),
							targetLevel,
							enabled: targetLevel > state.currentLevel && !state.disabled
						};
					});
					const heroDisabled = states.every((state) => state.disabled);
					if (shouldHideRow(settings, heroDisabled)) return null;
					const rowIndex = visibleIndex++;
					return {
						heroId: hero.id,
						heroName: dependencies.getHeroName(hero.id),
						index: rowIndex,
						checked: selectedHeroSet.has(String(hero.id)),
						disabled: heroDisabled,
						icon: "zap",
						metrics: [],
						skills: states
					};
				}).filter(Boolean),
				selectedHeroIds: [...settings.skillHeroIds],
				heroOrder: [...settings.skillHeroOrder]
			};
		};
		return {
			buildSkillsModuleView(heroes, settings, userInfo) {
				return {
					settings: buildSkillsSettingsView(settings, userInfo),
					queue: buildSkillsQueueView(heroes, settings),
					actionTitles: {
						top: dependencies.translate("HWHHM_REORDER_MOVE_TOP"),
						up: dependencies.translate("HWHHM_REORDER_MOVE_UP"),
						down: dependencies.translate("HWHHM_REORDER_MOVE_DOWN"),
						bottom: dependencies.translate("HWHHM_REORDER_MOVE_BOTTOM")
					},
					reorderListVariant: normalizeReorderListVariant(settings.reorderListVariant),
					executionMode: dependencies.getExecutionMode(settings, HERO_MANAGER_MODULE_KEY.SKILLS),
					executionControl: dependencies.buildExecutionControl(HERO_MANAGER_MODULE_KEY.SKILLS, dependencies.getExecutionMode(settings, HERO_MANAGER_MODULE_KEY.SKILLS)),
					moduleSettingsTitle: dependencies.translate("HWHHM_MODULE_SETTINGS"),
					heroListTitle: dependencies.translate("HWHHM_HERO_LIST"),
					emptyText: dependencies.translate("HWHHM_NOTHING"),
					queueSearchPlaceholder: dependencies.translate("HWHHM_TRANSFER_SEARCH"),
					queueSearchClearLabel: dependencies.translate("HWHHM_TRANSFER_CLEAR_SEARCH"),
					queueSelectAllLabel: dependencies.translate("HWHHM_TRANSFER_SELECT_ALL"),
					queueClearAllLabel: dependencies.translate("HWHHM_TRANSFER_CLEAR_ALL")
				};
			},
			getConfiguredSkillMaxLevel: getConfiguredMaxLevel,
			getHeroSkillDefinition,
			getSkillMaxLevel,
			getSkillLevelCostConfig,
			getSkillName,
			getSkillTargetLevel,
			getSkillTierOrder
		};
	}
	//#endregion
	//#region src/scripts/hwhheromanager/ui/skins-view.ts
	/**
	* Дерево обликов живёт отдельно от runtime: ему нужны снимок и игровые адаптеры,
	* но ни один Vue-компонент не обязан разбираться в lib.data и запасах игрока.
	*/
	function createHeroManagerSkinsViewBuilder(dependencies) {
		const skinLabelCache = /* @__PURE__ */ new Map();
		const skinCostCurrencyKeysCache = /* @__PURE__ */ new Map();
		function getSkinLabel(skinId) {
			var _skinRecord$localeKey;
			const cacheKey = String(skinId !== null && skinId !== void 0 ? skinId : "");
			const cachedLabel = skinLabelCache.get(cacheKey);
			if (cachedLabel) return cachedLabel;
			const skinRecord = dependencies.getSkinRecord(skinId);
			const translationKey = String((_skinRecord$localeKey = skinRecord.localeKey) !== null && _skinRecord$localeKey !== void 0 ? _skinRecord$localeKey : `LIB_HERO_SKIN_NAME_${skinId}`);
			const translatedLabel = dependencies.translateGame(translationKey);
			const label = translatedLabel ? String(translatedLabel) : `Skin ${skinId}`;
			skinLabelCache.set(cacheKey, label);
			return label;
		}
		function getHeroSkinEntries(hero, settings = void 0) {
			const heroRecord = asPlainRecord$1(hero);
			const skins = asPlainRecord$1(heroRecord.skins);
			return orderSkinEntries(Object.keys(skins).map((skinId) => ({
				heroId: heroRecord.id,
				skinId,
				level: Number(skins[skinId]) || 0,
				maxLevel: dependencies.getMaxSkinLevel(skinId),
				label: getSkinLabel(skinId)
			})), settings);
		}
		function getSkinCostCurrencyKeys(heroes) {
			const keys = /* @__PURE__ */ new Set();
			heroes.forEach((hero) => {
				getHeroSkinEntries(hero).forEach((entry) => {
					getSkinCostCurrencyKeysBySkinId(entry.skinId).forEach((currencyKey) => keys.add(currencyKey));
				});
			});
			return [...keys];
		}
		function getSkinCostCurrencyKeysBySkinId(skinId) {
			const cacheKey = String(skinId !== null && skinId !== void 0 ? skinId : "");
			const cachedKeys = skinCostCurrencyKeysCache.get(cacheKey);
			if (cachedKeys) return cachedKeys;
			const keys = /* @__PURE__ */ new Set();
			dependencies.getSkinLevelEntries(skinId).forEach(([, level]) => {
				const cost = dependencies.parseCost(asPlainRecord$1(level).cost);
				if (cost) keys.add(cost.currencyKey);
			});
			const result = [...keys];
			if (result.length > 0) skinCostCurrencyKeysCache.set(cacheKey, result);
			return result;
		}
		function buildSkinQueueView(heroes, settings) {
			const selectedSet = new Set(settings.skinKeys.map(String));
			let visibleIndex = 0;
			return dependencies.getOrderedHeroes(heroes, settings.skinHeroOrder).map((hero) => {
				const skinEntries = getHeroSkinEntries(hero, settings);
				const heroDisabled = skinEntries.every((entry) => entry.maxLevel <= entry.level);
				if (dependencies.shouldHideRow(settings, heroDisabled)) return null;
				const rowIndex = visibleIndex++;
				const heroChecked = skinEntries.some((entry) => selectedSet.has(`${entry.heroId}:${entry.skinId}`));
				const selectableSkinKeys = skinEntries.filter((entry) => entry.maxLevel > entry.level).map((entry) => `${entry.heroId}:${entry.skinId}`);
				return dependencies.heroQueueRow({
					orderPatchKey: "skinHeroOrder",
					hero,
					index: rowIndex,
					checked: heroChecked,
					icon: "shirt",
					disabled: heroDisabled,
					patch: {
						kind: "string-array-group-toggle",
						key: "skinKeys",
						groupPrefix: `${hero.id}:`,
						values: selectableSkinKeys,
						currentValues: settings.skinKeys
					},
					metrics: [{
						icon: "shirt",
						label: dependencies.translate("HWHHM_CURRENT_SKINS"),
						value: skinEntries.slice(0, 4).map((entry) => `${entry.label}: ${entry.level}/${entry.maxLevel}`).join("; ") || dependencies.translate("HWHHM_NOTHING"),
						tone: heroDisabled ? "max" : ""
					}],
					children: skinEntries.map((entry, childIndex) => {
						var _settings$skinLevelCa;
						const key = `${entry.heroId}:${entry.skinId}`;
						const disabled = entry.maxLevel <= entry.level;
						const value = resolveHeroManagerTargetLevel(entry.level, entry.maxLevel, (_settings$skinLevelCa = settings.skinLevelCaps) === null || _settings$skinLevelCa === void 0 ? void 0 : _settings$skinLevelCa[key]);
						return {
							key: `skin:${key}`,
							index: childIndex,
							label: entry.label,
							icon: "shirt",
							gameItemType: "skin",
							gameItemId: entry.skinId,
							orderPatchKey: "skinTargetOrder",
							orderValue: key,
							orderScope: "parent",
							disabled,
							checkbox: dependencies.checkboxControl({
								key: `skin-enabled:${key}`,
								checked: selectedSet.has(key) && !disabled,
								label: entry.label,
								icon: "shirt",
								gameItemType: "skin",
								gameItemId: entry.skinId,
								disabled,
								patch: {
									kind: "string-array-toggle",
									key: "skinKeys",
									value: key,
									currentValues: settings.skinKeys
								}
							}),
							number: dependencies.numberControl({
								key: `skin-cap:${key}`,
								label: "",
								value,
								minValue: entry.level,
								maxValue: entry.maxLevel,
								icon: "target",
								gameItemType: "skin",
								gameItemId: entry.skinId,
								compact: true,
								disabled,
								patch: {
									kind: "number-map",
									key: "skinLevelCaps",
									entryKey: key
								}
							})
						};
					}),
					emptyControlsText: skinEntries.length <= 0 ? dependencies.translate("HWHHM_NOTHING") : ""
				});
			}).filter(Boolean);
		}
		function buildSkinChestControls(settings, inventory) {
			return SKIN_STONE_CHEST_IDS.map((chestId) => {
				var _settings$skinChestRe, _settings$skinChestRe2;
				const currencyKey = `consumable:${chestId}`;
				const amount = dependencies.getNestedAmount(inventory, "consumable", chestId);
				const chestName = dependencies.getResourceName(currencyKey);
				return dependencies.cardControl(`skin-chest:${chestId}`, [dependencies.checkboxControl({
					key: `skin-chest-enabled:${chestId}`,
					id: `hwhhm-skin-chest-${chestId}`,
					checked: settings.skinChestIds.includes(String(chestId)),
					label: dependencies.translate("HWHHM_USE_SKIN_CHEST", { chest: chestName }),
					icon: "gift",
					...dependencies.getResourceIconControlProps(currencyKey),
					patch: {
						kind: "string-array-toggle",
						key: "skinChestIds",
						value: String(chestId),
						currentValues: settings.skinChestIds
					}
				}), dependencies.numberControl({
					key: `skin-chest-reserve:${chestId}`,
					id: `hwhhm-skin-chest-reserve-${chestId}`,
					label: dependencies.translate("HWHHM_CURRENCY_LIMIT", { currency: dependencies.formatResourceSettingLabel(chestName, amount) }),
					value: (_settings$skinChestRe = (_settings$skinChestRe2 = settings.skinChestReserves) === null || _settings$skinChestRe2 === void 0 ? void 0 : _settings$skinChestRe2[chestId]) !== null && _settings$skinChestRe !== void 0 ? _settings$skinChestRe : 0,
					icon: "gift",
					...dependencies.getResourceIconControlProps(currencyKey),
					patch: {
						kind: "number-map",
						key: "skinChestReserves",
						entryKey: String(chestId)
					}
				})]);
			});
		}
		return {
			getHeroSkinEntries,
			buildSkinsModuleView(heroes, settings, snapshot) {
				return dependencies.genericModuleView({
					moduleKey: HERO_MANAGER_MODULE_KEY.SKINS,
					settingsSections: [dependencies.resourceReserveSection({
						key: "skins:reserves",
						title: dependencies.translate("HWHHM_SKIN_COINS"),
						icon: "coins",
						keys: getSkinCostCurrencyKeys(heroes),
						values: settings.skinCoinReserves,
						inventory: snapshot.inventory,
						userInfo: snapshot.userInfo,
						dataName: "skin-coin-reserve"
					}), dependencies.settingsSection({
						key: "skins:chests",
						title: dependencies.translate("HWHHM_SKIN_CHESTS"),
						icon: "gift",
						controls: buildSkinChestControls(settings, snapshot.inventory)
					})],
					queueRows: buildSkinQueueView(heroes, settings),
					reorderListVariant: settings.reorderListVariant,
					executionMode: dependencies.getExecutionMode(settings, HERO_MANAGER_MODULE_KEY.SKINS)
				});
			}
		};
	}
	function asPlainRecord$1(value) {
		return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	//#endregion
	//#region src/scripts/hwhheromanager/domain/skin-chest-planner.ts
	/**
	* Сундуки открываются только под рассчитанный дефицит камней и никогда не трогают
	* заданный игроком резерв. После отправки этих вызовов runtime обязан взять свежий
	* snapshot сервера — лут всё-таки выдаёт сервер, а не наша фантазия.
	*/
	function createHeroManagerSkinChestPlanner(dependencies) {
		return (settings, snapshot, working) => {
			const requiredByChoice = /* @__PURE__ */ new Map();
			dependencies.getExecutionSkinKeys(settings).forEach((key) => {
				var _settings$skinLevelCa;
				const [heroId, skinId] = String(key).split(":");
				const hero = dependencies.getSnapshotHero(snapshot, heroId);
				const choiceIndex = getSkinStoneChoiceIndex(skinId, dependencies);
				if (!hero || choiceIndex === null) return;
				let level = Number(dependencies.getRecordValue(hero.skins, skinId)) || 0;
				const targetLevel = resolveHeroManagerTargetLevel(level, dependencies.getMaxSkinLevel(skinId), (_settings$skinLevelCa = settings.skinLevelCaps) === null || _settings$skinLevelCa === void 0 ? void 0 : _settings$skinLevelCa[key]);
				while (level < targetLevel) {
					var _requiredByChoice$get;
					const cost = dependencies.parseCost(dependencies.getSkinLevelRecord(skinId, level + 1).cost);
					if (!cost) return;
					const mapKey = `${choiceIndex}:${cost.currencyKey}`;
					const current = (_requiredByChoice$get = requiredByChoice.get(mapKey)) !== null && _requiredByChoice$get !== void 0 ? _requiredByChoice$get : {
						choiceIndex,
						currencyKey: cost.currencyKey,
						amount: 0
					};
					current.amount += cost.amount;
					requiredByChoice.set(mapKey, current);
					level += 1;
				}
			});
			const availableChests = new Map(SKIN_STONE_CHEST_IDS.map((chestId) => {
				var _settings$skinChestRe, _settings$skinChestRe2;
				return [chestId, Math.max(0, dependencies.getNestedAmount(working.inventory, "consumable", chestId) - ((_settings$skinChestRe = (_settings$skinChestRe2 = settings.skinChestReserves) === null || _settings$skinChestRe2 === void 0 ? void 0 : _settings$skinChestRe2[chestId]) !== null && _settings$skinChestRe !== void 0 ? _settings$skinChestRe : 0))];
			}));
			const enabledChestIds = SKIN_STONE_CHEST_IDS.filter((chestId) => settings.skinChestIds.includes(String(chestId))).sort((left, right) => {
				var _SKIN_STONE_CHEST_YIE, _SKIN_STONE_CHEST_YIE2;
				return ((_SKIN_STONE_CHEST_YIE = SKIN_STONE_CHEST_YIELDS[right]) !== null && _SKIN_STONE_CHEST_YIE !== void 0 ? _SKIN_STONE_CHEST_YIE : 0) - ((_SKIN_STONE_CHEST_YIE2 = SKIN_STONE_CHEST_YIELDS[left]) !== null && _SKIN_STONE_CHEST_YIE2 !== void 0 ? _SKIN_STONE_CHEST_YIE2 : 0);
			});
			const calls = [];
			requiredByChoice.forEach(({ choiceIndex, currencyKey, amount }) => {
				var _settings$skinCoinRes, _settings$skinCoinRes2;
				let deficit = Math.max(0, amount + ((_settings$skinCoinRes = (_settings$skinCoinRes2 = settings.skinCoinReserves) === null || _settings$skinCoinRes2 === void 0 ? void 0 : _settings$skinCoinRes2[currencyKey]) !== null && _settings$skinCoinRes !== void 0 ? _settings$skinCoinRes : 0) - dependencies.getCurrencyAmount(working.inventory, { gold: working.gold }, currencyKey));
				enabledChestIds.forEach((chestId) => {
					var _SKIN_STONE_CHEST_YIE3, _availableChests$get;
					if (deficit <= 0) return;
					const chestYield = (_SKIN_STONE_CHEST_YIE3 = SKIN_STONE_CHEST_YIELDS[chestId]) !== null && _SKIN_STONE_CHEST_YIE3 !== void 0 ? _SKIN_STONE_CHEST_YIE3 : 0;
					const available = (_availableChests$get = availableChests.get(chestId)) !== null && _availableChests$get !== void 0 ? _availableChests$get : 0;
					if (chestYield <= 0 || available <= 0) return;
					const count = Math.min(available, Math.ceil(deficit / chestYield));
					if (count <= 0) return;
					const chestCurrencyKey = `consumable:${chestId}`;
					const chestName = dependencies.getResourceName(chestCurrencyKey);
					availableChests.set(chestId, available - count);
					dependencies.setNestedAmount(working.inventory, "consumable", chestId, dependencies.getNestedAmount(working.inventory, "consumable", chestId) - count);
					dependencies.addCurrency(working, currencyKey, count * chestYield);
					calls.push(dependencies.createPlannedCall({
						name: "consumableUseLootBox",
						args: {
							libId: chestId,
							amount: count,
							playerRewardChoiceIndex: choiceIndex
						},
						ident: `hwhhm_skin_chest_${chestId}_${choiceIndex}_${calls.length}`
					}, {
						module: "skins",
						action: dependencies.translate("HWHHM_USE_SKIN_CHEST", { chest: chestName }),
						from: dependencies.getNestedAmount(snapshot.inventory, "consumable", chestId),
						to: Math.max(0, dependencies.getNestedAmount(snapshot.inventory, "consumable", chestId) - count),
						countsAsLevel: false,
						spent: [{
							currencyKey: chestCurrencyKey,
							amount: count
						}]
					}));
					deficit = Math.max(0, deficit - count * chestYield);
				});
			});
			return calls;
		};
	}
	function getSkinStoneChoiceIndex(skinId, dependencies) {
		const skinRecord = dependencies.getSkinRecord(skinId);
		const statData = dependencies.getPlainRecord(skinRecord.statData);
		const candidates = [
			skinRecord.stat,
			skinRecord.statType,
			skinRecord.mainStat,
			skinRecord.heroStat,
			statData.stat,
			statData.statType,
			statData.mainStat,
			...Object.keys(statData),
			...Object.values(statData).filter((value) => typeof value === "string")
		].map((value) => String(value !== null && value !== void 0 ? value : "").toLowerCase()).filter(Boolean);
		if (candidates.some((value) => value.includes("intellect") || value.includes("intelligence"))) return 0;
		if (candidates.some((value) => value.includes("strength"))) return 1;
		if (candidates.some((value) => value.includes("agility"))) return 2;
		return null;
	}
	//#endregion
	//#region src/scripts/hwhheromanager/domain/skin-catalog.ts
	/** Библиотека обликов у игры встречается и в виде map, и в виде массива. */
	function createHeroManagerSkinCatalog(dependencies) {
		const maxLevelCache = /* @__PURE__ */ new Map();
		function getSkinLevels(skinId) {
			var _ref, _dependencies$getReco;
			const statData = asPlainRecord(dependencies.getSkinRecord(skinId).statData);
			return (_ref = (_dependencies$getReco = dependencies.getRecordValue(statData, "levels")) !== null && _dependencies$getReco !== void 0 ? _dependencies$getReco : dependencies.getRecordValue(statData, "level")) !== null && _ref !== void 0 ? _ref : {};
		}
		function getSkinLevelEntries(skinId) {
			return dependencies.getCollectionEntries(getSkinLevels(skinId));
		}
		return {
			getSkinLevelEntries,
			getMaxSkinLevel(skinId) {
				const cacheKey = String(skinId !== null && skinId !== void 0 ? skinId : "");
				const cachedLevel = maxLevelCache.get(cacheKey);
				if (cachedLevel !== void 0) return cachedLevel;
				const maxLevel = Math.max(0, ...getSkinLevelEntries(skinId).map(([key, entry]) => {
					var _ref2, _record$level;
					const record = asPlainRecord(entry);
					return Number((_ref2 = (_record$level = record.level) !== null && _record$level !== void 0 ? _record$level : record.id) !== null && _ref2 !== void 0 ? _ref2 : key) || 0;
				}));
				if (maxLevel > 0) maxLevelCache.set(cacheKey, maxLevel);
				return maxLevel;
			},
			getSkinLevelRecord(skinId, level) {
				return asPlainRecord(dependencies.getRecordValue(getSkinLevels(skinId), level));
			}
		};
	}
	function asPlainRecord(value) {
		return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	//#endregion
	//#region src/shared/ui/native/text-panel.ts
	function renderNativeTextPanel(props) {
		const root = document.createElement("div");
		root.className = "hwhx-native-body hwhx-popup";
		if (props.note) {
			const note = document.createElement("p");
			note.className = "hwhx-hint";
			note.textContent = String(props.note);
			root.appendChild(note);
		}
		const links = Array.isArray(props.links) ? props.links : [];
		for (const value of links) {
			var _ref, _link$label, _link$url;
			const link = asPlainRecord$2(value);
			const anchor = document.createElement("a");
			anchor.className = "hwhx-button";
			anchor.textContent = String((_ref = (_link$label = link.label) !== null && _link$label !== void 0 ? _link$label : link.url) !== null && _ref !== void 0 ? _ref : "");
			anchor.href = String((_link$url = link.url) !== null && _link$url !== void 0 ? _link$url : "#");
			anchor.target = "_blank";
			anchor.rel = "noopener noreferrer";
			root.appendChild(anchor);
		}
		return root;
	}
	var support_config_default = {
		donate: {
			"wallet": "2200154655410578",
			"icon": "alfabank",
			"accentColor": "#ef3124",
			"qrDataUrl": "",
			"providers": [{
				"key": "donatepay",
				"label": "DonatePay",
				"url": "https://new.donatepay.ru/@1498534",
				"icon": "wallet-cards",
				"primary": true
			}, {
				"key": "boosty",
				"label": "Boosty",
				"url": "https://boosty.to/hwhx_askja/donate",
				"icon": "heart",
				"primary": false
			}]
		},
		contacts: [{
			"key": "askja",
			"displayName": "Askja",
			"telegramUsername": "askja_tlgrm",
			"qrPath": "/contacts/telegram-askja.png"
		}, {
			"key": "zingery",
			"displayName": "ZingerY",
			"telegramUsername": "AlysonWi",
			"qrPath": "/contacts/telegram-zingery.png"
		}],
		feedback: { "contact": "askja" },
		community: { "forumUrl": "https://t.me/+ppLK1qqObB43NjMy" },
		documentation: { "links": [{
			"key": "primary",
			"url": "https://ext-askja.zingery.ru"
		}, {
			"key": "mirror-1",
			"url": "https://hwhx-askja.h0w.top/"
		}] }
	};
	//#endregion
	//#region src/shared/ui/support-config.ts
	var _donateConfig$wallet;
	var _donateConfig$icon;
	var _donateConfig$accentC;
	var _donateConfig$qrDataU;
	var _communityConfig$foru;
	var _supportConfig$feedba;
	var donateConfig = support_config_default.donate;
	var communityConfig = support_config_default.community;
	var SUPPORT_DONATE_WALLET = String((_donateConfig$wallet = donateConfig.wallet) !== null && _donateConfig$wallet !== void 0 ? _donateConfig$wallet : "");
	String((_donateConfig$icon = donateConfig.icon) !== null && _donateConfig$icon !== void 0 ? _donateConfig$icon : "wallet-cards");
	String((_donateConfig$accentC = donateConfig.accentColor) !== null && _donateConfig$accentC !== void 0 ? _donateConfig$accentC : "#ef3124");
	String((_donateConfig$qrDataU = donateConfig.qrDataUrl) !== null && _donateConfig$qrDataU !== void 0 ? _donateConfig$qrDataU : "");
	var SUPPORT_DONATE_PROVIDERS = Object.freeze((Array.isArray(donateConfig.providers) ? donateConfig.providers : []).map(parseSupportDonateProvider).filter((provider) => provider !== null));
	String((_communityConfig$foru = communityConfig.forumUrl) !== null && _communityConfig$foru !== void 0 ? _communityConfig$foru : "");
	var SUPPORT_CONTACTS = Object.freeze(support_config_default.contacts.map((contact) => {
		const telegramUsername = String(contact.telegramUsername).replace(/^@/, "");
		return Object.freeze({
			key: String(contact.key),
			displayName: String(contact.displayName),
			telegramUsername,
			telegramUrl: `https://t.me/${telegramUsername}`,
			qrPath: String(contact.qrPath)
		});
	}));
	function sanitizeTelegramUsername(value) {
		return String(value !== null && value !== void 0 ? value : "").replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, "");
	}
	function normalizeTelegramIdentity(value) {
		return sanitizeTelegramUsername(value).toLocaleLowerCase("en");
	}
	function findSupportContact(identity) {
		const normalizedIdentity = normalizeTelegramIdentity(identity);
		return SUPPORT_CONTACTS.find((contact) => normalizeTelegramIdentity(contact.key) === normalizedIdentity || normalizeTelegramIdentity(contact.displayName) === normalizedIdentity || normalizeTelegramIdentity(contact.telegramUsername) === normalizedIdentity);
	}
	function resolveSupportTelegramUrl(author, fallbackIdentity = "askja") {
		const authorContact = findSupportContact(author);
		if (authorContact) return authorContact.telegramUrl;
		const fallbackContact = findSupportContact(fallbackIdentity);
		return `https://t.me/${sanitizeTelegramUsername(author) || (fallbackContact === null || fallbackContact === void 0 ? void 0 : fallbackContact.telegramUsername) || sanitizeTelegramUsername(fallbackIdentity)}`;
	}
	resolveSupportTelegramUrl(String((_supportConfig$feedba = support_config_default.feedback.contact) !== null && _supportConfig$feedba !== void 0 ? _supportConfig$feedba : "askja"), "askja");
	var SUPPORT_DOCUMENTATION_LINKS = Object.freeze(support_config_default.documentation.links.map((link) => ({
		key: String(link.key),
		url: String(link.url)
	})));
	function parseSupportDonateProvider(value) {
		var _config$key, _config$label, _config$icon;
		if (!value || typeof value !== "object" || Array.isArray(value)) return null;
		const config = value;
		const key = String((_config$key = config.key) !== null && _config$key !== void 0 ? _config$key : "").trim();
		const label = String((_config$label = config.label) !== null && _config$label !== void 0 ? _config$label : "").trim();
		const url = normalizeHttpsUrl(config.url);
		if (!key || !label || !url) return null;
		return Object.freeze({
			key,
			label,
			url,
			icon: String((_config$icon = config.icon) !== null && _config$icon !== void 0 ? _config$icon : "heart").trim() || "heart",
			primary: config.primary === true
		});
	}
	function normalizeHttpsUrl(value) {
		try {
			const url = new URL(String(value !== null && value !== void 0 ? value : "").trim());
			if (url.protocol !== "https:" || url.username || url.password) return "";
			return url.href;
		} catch (_unused) {
			return "";
		}
	}
	//#endregion
	//#region src/scripts/hwhheromanager/ui/lite/modal-header.ts
	var HERO_MANAGER_SCRIPT_NAME = "HWH Hero Manager Lite";
	var RuntimeTextPanel = defineNativeView("hero-manager-text-panel", renderNativeTextPanel);
	function readHeroManagerUserscriptInfo() {
		return {
			name: readGlobalString("HWH Hero Manager Lite", HERO_MANAGER_SCRIPT_NAME),
			version: readGlobalString("1.1.191-lite.1", "?"),
			author: readGlobalString("Askja", "Askja")
		};
	}
	function buildHeroManagerModalHeader() {
		const script = readHeroManagerUserscriptInfo();
		return {
			title: script.name,
			badges: [{
				label: `v${script.version}`,
				tone: "blue"
			}, {
				label: "Lite",
				tone: "gray"
			}]
		};
	}
	function buildHeroManagerSettingsHeaderActions(translate) {
		return [
			createAction("exportSettings", translate("HWHHM_EXPORT_SETTINGS")),
			createAction("importSettings", translate("HWHHM_IMPORT_SETTINGS"), true),
			createAction("dumpGameLibrary", translate("HWHHM_DUMP_LIBRARY_TITLE")),
			createAction("help", translate("HWHHM_DOCS_TITLE"), true)
		];
	}
	function buildHeroManagerSettingsModalActions(translate) {
		return [
			{
				result: "donate",
				label: translate("HWHHM_DONATE_TITLE"),
				tone: "secondary",
				placement: "left"
			},
			{
				result: "save",
				label: translate("HWHHM_SAVE"),
				tone: "success",
				closeOnClick: false
			},
			{
				result: "run",
				label: translate("HWHHM_RUN"),
				tone: "primary"
			}
		];
	}
	async function openHeroManagerDocumentationModal(translate, _uiTheme) {
		await openNativeComponentModal({
			kind: "documentation",
			title: translate("HWHHM_DOCS_TITLE"),
			header: buildHeroManagerModalHeader(),
			component: RuntimeTextPanel,
			props: {
				note: translate("HWHHM_DOCS_TEXT"),
				links: SUPPORT_DOCUMENTATION_LINKS.map((link, index) => ({
					label: translate(index === 0 ? "HWHHM_DOCS_PRIMARY" : "HWHHM_DOCS_MIRROR", index === 0 ? void 0 : { number: index + 1 }),
					url: link.url
				}))
			},
			actions: [{
				result: "close",
				label: translate("HWHHM_CLOSE")
			}]
		});
	}
	async function openHeroManagerDonateModal(translate, _uiTheme) {
		await openNativeComponentModal({
			kind: "donate",
			title: translate("HWHHM_DONATE_TITLE"),
			header: buildHeroManagerModalHeader(),
			component: RuntimeTextPanel,
			props: {
				note: `${translate("HWHHM_DONATE_TEXT")}\n${translate("HWHHM_DONATE_WALLET", { wallet: SUPPORT_DONATE_WALLET })}`,
				links: SUPPORT_DONATE_PROVIDERS
			},
			actions: [{
				result: "close",
				label: translate("HWHHM_CLOSE")
			}]
		});
	}
	function createAction(result, label, closeOnClick = false) {
		return {
			result,
			label,
			title: label,
			iconOnly: true,
			closeOnClick
		};
	}
	function readGlobalString(value, fallback) {
		return String(value !== null && value !== void 0 ? value : "").trim() || fallback;
	}
	//#endregion
	//#region src/scripts/hwhheromanager/runtime/index.ts
	function initializeHeroManagerExtension(attempt = 0) {
		if (!retryHwhRuntimeInitialization({
			attempt: Number(attempt) || 0,
			maxAttempts: 100,
			delayMs: 250,
			requiredKeys: [
				"HWHClasses",
				"HWHFuncs",
				"HWHData",
				"Caller"
			],
			retry: initializeHeroManagerExtension,
			logPrefix: "[HeroManager]",
			scriptName: "HWH Hero Manager"
		})) return;
		installSettingsDownloadBridge();
		const { HWHClasses, HWHFuncs, HWHData, cheats } = globalThis;
		const userscriptInfo = readHeroManagerUserscriptInfo();
		const Caller = requireHeroWarsCaller(globalThis);
		const { addExtentionName: addExtensionName, I18N } = HWHFuncs;
		const progressController = createRuntimeProgressController({
			scriptId: "hwhheromanager",
			title: userscriptInfo.name
		});
		const { setProgress, showResult, configure: configureProgress } = progressController;
		const heroManagerProgress = createHeroManagerProgressReporter(progressController);
		const mainMenuButtons = HWHData.buttons && typeof HWHData.buttons === "object" ? HWHData.buttons : HWHData.buttons = {};
		const othersPopupButtons = Array.isArray(HWHData.othersPopupButtons) ? HWHData.othersPopupButtons : HWHData.othersPopupButtons = [];
		const translate = createTranslator({
			I18N,
			i18nLangData: getHeroManagerTranslations(),
			preferGameI18N: false,
			fallbackLanguage: "en",
			cacheMissingTranslations: true
		});
		const formatNumber = createNumberFormatter();
		const gameIconResolvers = createRuntimeGameIconResolvers(globalThis.lib);
		function isPlainRecord(value) {
			return value !== null && typeof value === "object" && !Array.isArray(value);
		}
		function getPlainRecord(value) {
			return isPlainRecord(value) ? value : {};
		}
		function getRecordValue(container, key) {
			if (Array.isArray(container)) {
				const numericKey = Number(key);
				const matchedValue = container.find((entry) => {
					var _ref, _ref2, _ref3, _entryRecord$id;
					const entryRecord = getPlainRecord(entry);
					return String((_ref = (_ref2 = (_ref3 = (_entryRecord$id = entryRecord.id) !== null && _entryRecord$id !== void 0 ? _entryRecord$id : entryRecord.slotId) !== null && _ref3 !== void 0 ? _ref3 : entryRecord.skillId) !== null && _ref2 !== void 0 ? _ref2 : entryRecord.level) !== null && _ref !== void 0 ? _ref : "") === String(key);
				});
				return matchedValue !== null && matchedValue !== void 0 ? matchedValue : Number.isInteger(numericKey) && numericKey >= 0 ? container[numericKey] : void 0;
			}
			return getPlainRecord(container)[String(key)];
		}
		function getCollectionEntries(collection) {
			return Array.isArray(collection) ? collection.map((entry, index) => [String(index), entry]) : Object.entries(getPlainRecord(collection));
		}
		function getNestedRecord(container, ...keys) {
			return getPlainRecord(keys.reduce((currentValue, key) => getRecordValue(currentValue, key), container));
		}
		function getErrorMessage(error, fallback = "") {
			var _errorRecord$message;
			if (error instanceof Error) return error.message || fallback;
			const errorRecord = getPlainRecord(error);
			const message = (_errorRecord$message = errorRecord.message) !== null && _errorRecord$message !== void 0 ? _errorRecord$message : errorRecord.description;
			return typeof message === "string" && message ? message : fallback;
		}
		const buildIconLabel = (iconName, label, className = "", title = "") => renderIconLabel(iconName, label, {
			className,
			iconClassName: className,
			title
		});
		const [getResultModuleConfig, buildHeroManagerResult] = createHeroManagerResultSummaryBuilders([
			translate,
			formatNumber,
			getResourceName,
			isCallSucceeded,
			buildIconLabel
		]);
		const settingsStorage = new VersionedStorage({
			keyPrefix: SETTINGS_STORAGE_KEY,
			schemaVersion: 1
		});
		const buildDoYourBestPlacementOptionsFromTasks = createDoYourBestPlacementOptionsBuilder({
			translate,
			keys: {
				none: "HWHHM_DO_YOUR_BEST_PLACEMENT_NONE",
				end: "HWHHM_DO_YOUR_BEST_PLACEMENT_END",
				before: "HWHHM_DO_YOUR_BEST_PLACEMENT_BEFORE",
				after: "HWHHM_DO_YOUR_BEST_PLACEMENT_AFTER"
			}
		});
		const getDoYourBestTaskListSnapshot = createDoYourBestTaskListSnapshotReader({
			getDoYourBestClass: () => getHeroWarsDoYourBestClass(HWHClasses),
			logPrefix: "[HeroManager]"
		});
		const settingsRepository = createSettingsRepository({
			storage: settingsStorage,
			defaultValue: DEFAULT_NORMALIZED_HERO_MANAGER_SETTINGS,
			normalize: normalizeSettings,
			afterRead: (settings) => {
				configureProgress(settings);
				setTooltipsEnabled(settings.showUiTooltips);
				setAccordionAutoScrollMode(settings.accordionAutoScrollMode);
			},
			afterWrite: (settings) => {
				configureProgress(settings);
				setTooltipsEnabled(settings.showUiTooltips);
				setAccordionAutoScrollMode(settings.accordionAutoScrollMode);
				syncHeroManagerActionPlacement(settings);
				registerDoYourBestHeroManagerTask();
			}
		});
		const readSettings = settingsRepository.readSync;
		const writeSettings = settingsRepository.writeSync;
		const { useStore: useHeroManagerSettingsStore } = createLocalforageSettingsStore("hwhheromanager", DEFAULT_NORMALIZED_HERO_MANAGER_SETTINGS, normalizeSettings, {
			read: () => readSettings(),
			write: (settings) => writeSettings(settings)
		});
		const heroNameCache = /* @__PURE__ */ new Map();
		const shopNameCache = /* @__PURE__ */ new Map();
		const artifactNameCache = /* @__PURE__ */ new Map();
		const runeNameCache = /* @__PURE__ */ new Map();
		const artifactCostCurrencyKeysCache = /* @__PURE__ */ new Map();
		const libraryDataCache = /* @__PURE__ */ new Map();
		let skinLibraryCache;
		let runeLevelConfigCache;
		function getExecutionMode(settings, moduleKey = "") {
			var _settings$moduleExecu, _moduleExecutionModes;
			return normalizeHeroManagerExecutionMode((_moduleExecutionModes = ((_settings$moduleExecu = settings.moduleExecutionModes) !== null && _settings$moduleExecu !== void 0 ? _settings$moduleExecu : {})[String(moduleKey)]) !== null && _moduleExecutionModes !== void 0 ? _moduleExecutionModes : settings.executionMode) === "parallel" ? HERO_MANAGER_EXECUTION_MODE_PARALLEL : HERO_MANAGER_EXECUTION_MODE_SEQUENTIAL;
		}
		function getExecutionHeroIds(settings, selectedValues, orderedValues, moduleKey = "") {
			return orderExecutionIds(selectedValues, orderedValues, getExecutionMode(settings, moduleKey));
		}
		function getExecutionHeroes(settings, snapshot, selectedValues, orderedValues, moduleKey = "") {
			return getExecutionHeroIds(settings, selectedValues, orderedValues, moduleKey).map((heroId) => getSnapshotHero(snapshot, heroId)).filter((hero) => hero !== null);
		}
		const numberControl = buildHeroManagerNumberControl;
		const skillsViewBuilder = createHeroManagerSkillsViewBuilder({
			buildExecutionControl: buildModuleExecutionControl,
			buildSkillPointPurchaseMetrics,
			formatNumber,
			getExecutionMode,
			getHeroName,
			getLibraryData,
			getNestedRecord,
			getOrderedHeroes,
			getPlainRecord,
			getRecordValue,
			getResourceIconControlProps,
			translate,
			translateGame: (key) => {
				var _cheats$translate;
				return cheats === null || cheats === void 0 || (_cheats$translate = cheats.translate) === null || _cheats$translate === void 0 ? void 0 : _cheats$translate.call(cheats, key);
			}
		});
		const skinCatalog = createHeroManagerSkinCatalog({
			getCollectionEntries,
			getRecordValue,
			getSkinRecord
		});
		const skinsViewBuilder = createHeroManagerSkinsViewBuilder({
			cardControl,
			checkboxControl,
			formatResourceSettingLabel,
			genericModuleView,
			getExecutionMode,
			getMaxSkinLevel: skinCatalog.getMaxSkinLevel,
			getNestedAmount,
			getOrderedHeroes,
			getResourceIconControlProps,
			getResourceName,
			getSkinLevelEntries: skinCatalog.getSkinLevelEntries,
			getSkinRecord,
			heroQueueRow,
			numberControl,
			parseCost,
			resourceReserveSection,
			settingsSection,
			shouldHideRow,
			translate,
			translateGame: (key) => {
				var _cheats$translate2;
				return cheats === null || cheats === void 0 || (_cheats$translate2 = cheats.translate) === null || _cheats$translate2 === void 0 ? void 0 : _cheats$translate2.call(cheats, key);
			}
		});
		const planSkinChestCalls = createHeroManagerSkinChestPlanner({
			addCurrency,
			createPlannedCall,
			getCurrencyAmount,
			getExecutionSkinKeys,
			getMaxSkinLevel: skinCatalog.getMaxSkinLevel,
			getNestedAmount,
			getPlainRecord,
			getRecordValue,
			getResourceName,
			getSkinLevelRecord: skinCatalog.getSkinLevelRecord,
			getSkinRecord,
			getSnapshotHero,
			parseCost,
			setNestedAmount,
			translate
		});
		function getLibraryData(name) {
			var _ref4, _ref5, _globalThis$lib$getDa, _globalThis$lib, _globalThis$lib$getDa2, _globalThis$lib2, _globalThis$lib3;
			const key = String(name !== null && name !== void 0 ? name : "");
			const cached = libraryDataCache.get(key);
			if (cached) return cached;
			const data = getPlainRecord((_ref4 = (_ref5 = (_globalThis$lib$getDa = (_globalThis$lib = globalThis.lib) === null || _globalThis$lib === void 0 || (_globalThis$lib$getDa2 = _globalThis$lib.getData) === null || _globalThis$lib$getDa2 === void 0 ? void 0 : _globalThis$lib$getDa2.call(_globalThis$lib, name)) !== null && _globalThis$lib$getDa !== void 0 ? _globalThis$lib$getDa : (_globalThis$lib2 = globalThis.lib) === null || _globalThis$lib2 === void 0 || (_globalThis$lib2 = _globalThis$lib2.data) === null || _globalThis$lib2 === void 0 ? void 0 : _globalThis$lib2[key]) !== null && _ref5 !== void 0 ? _ref5 : (_globalThis$lib3 = globalThis.lib) === null || _globalThis$lib3 === void 0 ? void 0 : _globalThis$lib3[key]) !== null && _ref4 !== void 0 ? _ref4 : {});
			if (Object.keys(data).length > 0) libraryDataCache.set(key, data);
			return data;
		}
		function getLibraryEntry(library, id) {
			const directEntry = getPlainRecord(getRecordValue(library, id));
			return Object.keys(directEntry).length > 0 ? directEntry : getNestedRecord(library, "id", id);
		}
		function getHeroArtifactId(heroId, slotId, heroArtifacts = void 0) {
			var _ref6, _ref7, _ref8, _ref9, _configuredRecord$id;
			const configuredArtifact = getRecordValue(getLibraryEntry(getLibraryData("hero"), heroId).artifacts, slotId);
			const configuredRecord = getPlainRecord(configuredArtifact);
			const equippedArtifact = getHeroArtifactRecord(heroArtifacts, slotId);
			return (_ref6 = (_ref7 = (_ref8 = (_ref9 = (_configuredRecord$id = configuredRecord.id) !== null && _configuredRecord$id !== void 0 ? _configuredRecord$id : configuredRecord.artifactId) !== null && _ref9 !== void 0 ? _ref9 : configuredArtifact) !== null && _ref8 !== void 0 ? _ref8 : equippedArtifact.id) !== null && _ref7 !== void 0 ? _ref7 : equippedArtifact.artifactId) !== null && _ref6 !== void 0 ? _ref6 : "";
		}
		function getArtifactDefinition(artifactId) {
			return getLibraryEntry(getLibraryData("artifact"), artifactId);
		}
		function getArtifactName(artifactId, slotId) {
			const normalizedArtifactId = String(artifactId !== null && artifactId !== void 0 ? artifactId : "").trim();
			if (!normalizedArtifactId) return translate("HWHHM_ARTIFACT_SLOT", { slot: Number(slotId) + 1 });
			const cachedName = artifactNameCache.get(normalizedArtifactId);
			if (cachedName) return cachedName;
			const definition = getArtifactDefinition(normalizedArtifactId);
			const name = getTranslatedLibraryName(definition.localeKey, definition.nameKey, `LIB_ARTIFACT_NAME_${normalizedArtifactId}`, `LIB_ARTIFACT_${normalizedArtifactId}`) || translate("HWHHM_ARTIFACT_SLOT", { slot: Number(slotId) + 1 });
			artifactNameCache.set(normalizedArtifactId, name);
			return name;
		}
		function getSkinLibrary() {
			var _globalThis$lib$skins, _globalThis$lib4, _globalThis$lib5;
			if (skinLibraryCache) return skinLibraryCache;
			const skinData = getLibraryData("skin");
			if (Object.keys(skinData !== null && skinData !== void 0 ? skinData : {}).length > 0) {
				skinLibraryCache = skinData;
				return skinLibraryCache;
			}
			skinLibraryCache = getPlainRecord((_globalThis$lib$skins = (_globalThis$lib4 = globalThis.lib) === null || _globalThis$lib4 === void 0 ? void 0 : _globalThis$lib4.skins) !== null && _globalThis$lib$skins !== void 0 ? _globalThis$lib$skins : (_globalThis$lib5 = globalThis.lib) === null || _globalThis$lib5 === void 0 || (_globalThis$lib5 = _globalThis$lib5.data) === null || _globalThis$lib5 === void 0 ? void 0 : _globalThis$lib5.skins);
			return skinLibraryCache;
		}
		function getSkinRecord(skinId) {
			return getLibraryEntry(getSkinLibrary(), skinId);
		}
		function getHeroName(heroId) {
			var _cheats$translate3;
			const id = Number(heroId);
			const cachedName = heroNameCache.get(id);
			if (cachedName) return cachedName;
			const name = (cheats === null || cheats === void 0 || (_cheats$translate3 = cheats.translate) === null || _cheats$translate3 === void 0 ? void 0 : _cheats$translate3.call(cheats, `LIB_HERO_NAME_${id}`)) || translate("HWHHM_HERO_FALLBACK", { id });
			heroNameCache.set(id, name);
			return name;
		}
		function getShopName(shopId) {
			var _cheats$translate4;
			const id = Number(shopId);
			const cachedName = shopNameCache.get(id);
			if (cachedName) return cachedName;
			const name = (cheats === null || cheats === void 0 || (_cheats$translate4 = cheats.translate) === null || _cheats$translate4 === void 0 ? void 0 : _cheats$translate4.call(cheats, `LIB_SHOP_NAME_${id}`)) || translate("HWHHM_SHOP_FALLBACK", { id });
			shopNameCache.set(id, name);
			return name;
		}
		function getOwnedHeroes(heroes) {
			return Object.values(getPlainRecord(heroes)).filter((hero) => Number(getPlainRecord(hero).id) > 0).sort((left, right) => compareNaturalText(getHeroName(left.id), getHeroName(right.id)));
		}
		const { getPurchaseCost: getSkillPointPurchaseEmeraldCost, getPurchaseSummaryAmount: getSkillPointPurchaseSummaryAmount, getPurchaseSummaryCost: getSkillPointPurchaseSummaryCost, getRefillAmount: getSkillPointRefillAmount } = createSkillPointRefillModel(() => getLibraryData("refillable"));
		function buildSkillPointMetricView(icon, value, className = "", gameItemType = "", gameItemId = 0) {
			const normalizedIcon = String(icon !== null && icon !== void 0 ? icon : "");
			return {
				key: `${normalizedIcon}:${className || "default"}`,
				icon: normalizedIcon,
				value: formatNumber(value),
				className,
				gameItemType,
				gameItemId
			};
		}
		function buildSkillPointPurchaseMetrics(purchaseCount, includeCount = false) {
			const normalizedPurchaseCount = normalizeNonNegativeInteger(purchaseCount, 0);
			const metrics = [];
			if (includeCount) metrics.push(buildSkillPointMetricView("activity", normalizedPurchaseCount, "hwhx-stamina-metric--count"));
			metrics.push(buildSkillPointMetricView("gem", getSkillPointPurchaseSummaryCost(normalizedPurchaseCount), "hwhx-stamina-metric--gem", "starmoney", 0), buildSkillPointMetricView("zap", getSkillPointPurchaseSummaryAmount(normalizedPurchaseCount), "hwhx-stamina-metric--energy"));
			return metrics;
		}
		function buildSettingsModule({ key, title, icon, buildContent, accentColor = "#6e4a24" }) {
			const descriptor = {
				key,
				title,
				icon,
				accentColor
			};
			return {
				...descriptor,
				build: () => ({
					...descriptor,
					...buildContent()
				})
			};
		}
		function getTranslatedLibraryName(...translationKeys) {
			for (const translationKey of translationKeys) {
				const translatedName = translationKey && typeof (cheats === null || cheats === void 0 ? void 0 : cheats.translate) === "function" ? cheats.translate(translationKey) : "";
				if (translatedName && translatedName !== translationKey) return translatedName;
			}
			return "";
		}
		function getResourceName(currencyKey) {
			const [type, id] = String(currencyKey).split(":");
			if (type === "gold") return translate("HWHHM_RESOURCE_GOLD");
			if ([
				"starmoney",
				"emerald",
				"emeralds",
				"gem",
				"gems"
			].includes(type)) return translate("HWHHM_RESOURCE_EMERALDS");
			if (type === "fragmentHero") return translate("HWHHM_RESOURCE_HERO_SOULS", { name: getHeroName(id) });
			if (type === "ascensionGear") return getTranslatedLibraryName(`LIB_ASCENSION_NAME_${id}`, `LIB_ASCENSION_GEAR_NAME_${id}`, `LIB_ASCENSION_GEAR_${id}`) || translate("HWHHM_RESOURCE_ASCENSION_GEAR", { id });
			const upperType = type === "coin" ? "COIN" : type.toUpperCase();
			return getTranslatedLibraryName(`LIB_${upperType}_NAME_${id}`, `LIB_${upperType}_${id}`) || (type === "coin" ? translate("HWHHM_RESOURCE_COIN", { id }) : type === "consumable" ? translate("HWHHM_RESOURCE_CONSUMABLE", { id }) : `${type}:${id}`);
		}
		function formatResourceSettingLabel(label, amount) {
			return `${String(label !== null && label !== void 0 ? label : "")} [${formatNumber(amount)}]`;
		}
		function getResourceIconControlProps(currencyKey) {
			const { itemType, itemId } = getCurrencyGameItemReference(currencyKey);
			return {
				gameItemType: itemType,
				gameItemId: itemId
			};
		}
		function getOrderedHeroes(heroes, order = []) {
			const heroById = new Map(heroes.map((hero) => [String(hero.id), hero]));
			const orderValues = normalizeStringArray(order);
			const orderedHeroIdSet = new Set(orderValues);
			return [...orderValues.map((heroId) => heroById.get(String(heroId))).filter(Boolean), ...heroes.filter((hero) => !orderedHeroIdSet.has(String(hero.id)))].filter((hero) => Boolean(hero));
		}
		function getReorderActionTitles() {
			return {
				top: translate("HWHHM_REORDER_MOVE_TOP"),
				up: translate("HWHHM_REORDER_MOVE_UP"),
				down: translate("HWHHM_REORDER_MOVE_DOWN"),
				bottom: translate("HWHHM_REORDER_MOVE_BOTTOM")
			};
		}
		function checkboxControl({ key, id = "", label, icon = "check", gameItemType = "", gameItemId = 0, checked = false, disabled = false, tooltip = "", patch = void 0 }) {
			return {
				key: key || id || label,
				kind: "checkbox",
				id,
				label,
				icon,
				gameItemType,
				gameItemId,
				checked,
				disabled,
				tooltip,
				patch
			};
		}
		function cardControl(key, controls) {
			return {
				key,
				kind: "card",
				controls: controls !== null && controls !== void 0 ? controls : []
			};
		}
		function settingsSection({ key, title = "", icon = "", controls = [], className = "hwhx-settings-list" }) {
			return {
				key,
				kind: "controls",
				title,
				icon,
				controls: decorateHeroManagerSettingsControls(controls, (setting) => translate("HWHHM_SETTING_HINT", { setting })),
				className
			};
		}
		function heroMetric(icon, label, value, tone = "") {
			return {
				icon: String(icon !== null && icon !== void 0 ? icon : ""),
				label: String(label !== null && label !== void 0 ? label : ""),
				value: String(value !== null && value !== void 0 ? value : ""),
				tone
			};
		}
		function heroQueueRow({ orderPatchKey, hero, index, checked, disabled, icon, metrics = [], children = [], controls = [], emptyControlsText = "", patch = void 0 }) {
			return {
				orderPatchKey,
				heroId: hero.id,
				heroName: getHeroName(hero.id),
				index,
				checked,
				disabled,
				icon,
				metrics,
				children,
				controls,
				emptyControlsText,
				patch
			};
		}
		function getResourceReservePatchKey(dataName) {
			return {
				"artifact-reserve": "artifactReserves",
				"ascension-reserve": "ascensionResourceReserves",
				"evolution-coin-reserve": "evolutionCoinReserves",
				"skin-coin-reserve": "skinCoinReserves"
			}[dataName];
		}
		function resourceReserveControls({ keys, values, inventory, userInfo, dataName }) {
			const patchKey = getResourceReservePatchKey(dataName);
			return [...new Set(keys)].sort().map((currencyKey) => {
				var _values$String;
				return numberControl({
					key: `${dataName}:${currencyKey}`,
					id: `hwhhm-${dataName}-${String(currencyKey).replaceAll(":", "-")}`,
					label: formatResourceSettingLabel(getResourceName(currencyKey), getCurrencyAmount(inventory, userInfo, currencyKey)),
					value: (_values$String = values === null || values === void 0 ? void 0 : values[String(currencyKey)]) !== null && _values$String !== void 0 ? _values$String : 0,
					icon: currencyKey === "gold:0" ? "coins" : "gem",
					...getResourceIconControlProps(currencyKey),
					patch: patchKey ? {
						kind: "number-map",
						key: patchKey,
						entryKey: String(currencyKey)
					} : void 0
				});
			});
		}
		function resourceReserveSection({ key, title, icon = "coins", keys, values, inventory, userInfo, dataName }) {
			return settingsSection({
				key,
				title,
				icon,
				controls: resourceReserveControls({
					keys,
					values,
					inventory,
					userInfo,
					dataName
				})
			});
		}
		function genericModuleView({ moduleKey = "", settingsSections, queueRows, reorderListVariant, executionMode }) {
			const resolvedModuleKey = String(moduleKey !== null && moduleKey !== void 0 ? moduleKey : "");
			const resolvedExecutionMode = normalizeHeroManagerExecutionMode(executionMode) === "parallel" ? HERO_MANAGER_EXECUTION_MODE_PARALLEL : HERO_MANAGER_EXECUTION_MODE_SEQUENTIAL;
			return {
				settingsSections,
				queueRows,
				actionTitles: getReorderActionTitles(),
				reorderListVariant: normalizeReorderListVariant(reorderListVariant),
				executionMode: resolvedExecutionMode,
				executionControl: resolvedModuleKey ? buildModuleExecutionControl(resolvedModuleKey, resolvedExecutionMode) : void 0,
				moduleSettingsTitle: translate("HWHHM_MODULE_SETTINGS"),
				heroListTitle: translate("HWHHM_HERO_LIST"),
				emptyText: translate("HWHHM_NOTHING"),
				queueSearchPlaceholder: translate("HWHHM_TRANSFER_SEARCH"),
				queueSearchClearLabel: translate("HWHHM_TRANSFER_CLEAR_SEARCH"),
				queueSelectAllLabel: translate("HWHHM_TRANSFER_SELECT_ALL"),
				queueClearAllLabel: translate("HWHHM_TRANSFER_CLEAR_ALL")
			};
		}
		function buildModuleExecutionControl(moduleKey, executionMode) {
			const value = normalizeHeroManagerExecutionMode(executionMode) === "parallel" ? HERO_MANAGER_EXECUTION_MODE_PARALLEL : HERO_MANAGER_EXECUTION_MODE_SEQUENTIAL;
			return {
				moduleKey,
				label: translate("HWHHM_EXECUTION_MODE"),
				tooltip: translate("HWHHM_EXECUTION_MODE_HINT"),
				value,
				options: [{
					value: HERO_MANAGER_EXECUTION_MODE_SEQUENTIAL,
					label: translate("HWHHM_EXECUTION_MODE_SEQUENTIAL"),
					icon: "list-ordered"
				}, {
					value: HERO_MANAGER_EXECUTION_MODE_PARALLEL,
					label: translate("HWHHM_EXECUTION_MODE_PARALLEL"),
					icon: "shuffle"
				}]
			};
		}
		function buildSkillsSettingsModule(heroes, settings, userInfo) {
			return buildSettingsModule({
				key: HERO_MANAGER_MODULE_KEY.SKILLS,
				title: translate("HWHHM_SECTION_SKILLS"),
				icon: "zap",
				accentColor: "#5b3f70",
				buildContent: () => {
					const skillsView = skillsViewBuilder.buildSkillsModuleView(heroes, settings, userInfo);
					return {
						contentKind: HERO_MANAGER_MODULE_KEY.SKILLS,
						contentView: skillsView
					};
				}
			});
		}
		function getShopSoulCurrencyKeys(shop) {
			const keys = /* @__PURE__ */ new Set();
			getShopSlots(shop).forEach((slot) => {
				if (!isPlainRecord(getPlainRecord(slot.reward).fragmentHero)) return;
				parseCosts(slot.cost).forEach((cost) => keys.add(cost.currencyKey));
			});
			return [...keys];
		}
		function shopHasHeroSoulRewards(shop) {
			return getShopSlots(shop).some((slot) => isPlainRecord(getPlainRecord(slot.reward).fragmentHero));
		}
		function buildEvolutionShopControls(shops, settings, inventory, userInfo) {
			return Object.values(getPlainRecord(shops)).filter(isPlainRecord).map((shop) => shop).filter((shop) => Number(shop === null || shop === void 0 ? void 0 : shop.id) > 0 && shopHasHeroSoulRewards(shop)).sort((left, right) => Number(left.id) - Number(right.id)).map((shop) => {
				const shopName = getShopName(shop.id);
				const reserveControls = getShopSoulCurrencyKeys(shop).map((currencyKey) => {
					var _settings$evolutionCo, _settings$evolutionCo2;
					return numberControl({
						key: `evolution-shop:${shop.id}:${currencyKey}`,
						id: `hwhhm-evolution-coin-reserve-${shop.id}-${currencyKey.replaceAll(":", "-")}`,
						label: translate("HWHHM_CURRENCY_LIMIT", { currency: formatResourceSettingLabel(getResourceName(currencyKey), getCurrencyAmount(inventory, userInfo, currencyKey)) }),
						value: (_settings$evolutionCo = (_settings$evolutionCo2 = settings.evolutionCoinReserves) === null || _settings$evolutionCo2 === void 0 ? void 0 : _settings$evolutionCo2[currencyKey]) !== null && _settings$evolutionCo !== void 0 ? _settings$evolutionCo : 0,
						icon: currencyKey === "gold:0" ? "coins" : "gem",
						...getResourceIconControlProps(currencyKey),
						patch: {
							kind: "number-map",
							key: "evolutionCoinReserves",
							entryKey: currencyKey
						}
					});
				});
				return cardControl(`evolution-shop:${shop.id}`, [checkboxControl({
					key: `evolution-shop-toggle:${shop.id}`,
					id: `hwhhm-evolution-shop-${shop.id}`,
					checked: settings.evolutionShopIds.includes(String(shop.id)),
					label: translate("HWHHM_BUY_SOULS_IN_SHOP", { shop: shopName }),
					icon: "shopping-cart",
					patch: {
						kind: "string-array-toggle",
						key: "evolutionShopIds",
						value: String(shop.id),
						currentValues: settings.evolutionShopIds
					}
				}), ...reserveControls]);
			});
		}
		function buildEvolutionQueueView(heroes, settings, inventory) {
			const selectedSet = new Set(settings.evolutionHeroIds.map(String));
			let visibleIndex = 0;
			return getOrderedHeroes(heroes, settings.evolutionHeroOrder).map((hero) => {
				const currentStar = getHeroCurrentStar(hero);
				const disabled = currentStar >= 6;
				if (shouldHideRow(settings, disabled)) return null;
				const rowIndex = visibleIndex++;
				const soulStones = getNestedAmount(inventory, "fragmentHero", hero.id);
				const nextCost = getEvolutionCost(Math.min(6, currentStar + 1));
				const targetStar = getEvolutionTargetStar(settings, hero);
				return heroQueueRow({
					orderPatchKey: "evolutionHeroOrder",
					hero,
					index: rowIndex,
					checked: selectedSet.has(String(hero.id)),
					icon: "sparkles",
					disabled,
					patch: {
						kind: "string-array-toggle",
						key: "evolutionHeroIds",
						value: String(hero.id),
						currentValues: settings.evolutionHeroIds
					},
					metrics: [heroMetric("star", translate("HWHHM_CURRENT_STAR"), `${currentStar}/6`, disabled ? "max" : ""), heroMetric("package", translate("HWHHM_SOUL_STONES"), `${formatNumber(soulStones)}/${formatNumber(nextCost.fragments)}`)],
					children: [{
						key: `evolution:${hero.id}`,
						index: 0,
						label: translate("HWHHM_EVOLUTION_TARGET"),
						icon: "star",
						number: numberControl({
							key: `evolution-cap:${hero.id}`,
							id: `hwhhm-evolution-cap-${hero.id}`,
							label: "",
							value: targetStar,
							minValue: currentStar,
							maxValue: 6,
							icon: "star",
							disabled,
							patch: {
								kind: "number-map",
								key: "evolutionStarCaps",
								entryKey: String(hero.id)
							}
						})
					}]
				});
			}).filter(Boolean);
		}
		function getEvolutionTargetStar(settings, hero) {
			var _settings$evolutionSt;
			return resolveHeroManagerTargetLevel(getHeroCurrentStar(hero), 6, (_settings$evolutionSt = settings.evolutionStarCaps) === null || _settings$evolutionSt === void 0 ? void 0 : _settings$evolutionSt[String(hero.id)]);
		}
		function buildEvolutionModuleView(heroes, settings, snapshot) {
			var _snapshot$userInfo;
			return genericModuleView({
				moduleKey: HERO_MANAGER_MODULE_KEY.EVOLUTIONS,
				settingsSections: [settingsSection({
					key: "evolution:limits",
					title: translate("HWHHM_LIMITS"),
					icon: "scale",
					controls: [numberControl({
						key: "evolution-gold-reserve",
						id: "hwhhm-evolution-gold-reserve",
						label: formatResourceSettingLabel(translate("HWHHM_GOLD_RESERVE"), (_snapshot$userInfo = snapshot.userInfo) === null || _snapshot$userInfo === void 0 ? void 0 : _snapshot$userInfo.gold),
						value: settings.evolutionGoldReserve,
						icon: "coins",
						...getResourceIconControlProps("gold:0"),
						patch: {
							kind: "number",
							key: "evolutionGoldReserve"
						}
					})]
				}), settingsSection({
					key: "evolution:shops",
					title: translate("HWHHM_EVOLUTION_SHOPS"),
					icon: "shopping-cart",
					className: "hwhx-control-stack",
					controls: buildEvolutionShopControls(snapshot.shops, settings, snapshot.inventory, snapshot.userInfo)
				})],
				queueRows: buildEvolutionQueueView(heroes, settings, snapshot.inventory),
				reorderListVariant: settings.reorderListVariant,
				executionMode: getExecutionMode(settings, HERO_MANAGER_MODULE_KEY.EVOLUTIONS)
			});
		}
		function buildEvolutionSettingsModule(heroes, settings, snapshot) {
			return buildSettingsModule({
				key: HERO_MANAGER_MODULE_KEY.EVOLUTIONS,
				title: translate("HWHHM_SECTION_EVOLUTION"),
				icon: "sparkles",
				accentColor: "#4d5770",
				buildContent: () => {
					return {
						contentKind: "generic",
						contentView: buildEvolutionModuleView(heroes, settings, snapshot)
					};
				}
			});
		}
		function buildSkinsSettingsModule(heroes, settings, snapshot) {
			return buildSettingsModule({
				key: HERO_MANAGER_MODULE_KEY.SKINS,
				title: translate("HWHHM_SECTION_SKINS"),
				icon: "shirt",
				accentColor: "#5b3f70",
				buildContent: () => {
					return {
						contentKind: "generic",
						contentView: skinsViewBuilder.buildSkinsModuleView(heroes, settings, snapshot)
					};
				}
			});
		}
		function getRuneLevelConfig() {
			var _ref10, _ref11, _ref12, _getRecordValue, _globalThis$lib6;
			const runeLibrary = getLibraryData("rune");
			const source = (_ref10 = (_ref11 = (_ref12 = (_getRecordValue = getRecordValue(getLibraryData("level"), "rune")) !== null && _getRecordValue !== void 0 ? _getRecordValue : getRecordValue(getPlainRecord((_globalThis$lib6 = globalThis.lib) === null || _globalThis$lib6 === void 0 || (_globalThis$lib6 = _globalThis$lib6.data) === null || _globalThis$lib6 === void 0 ? void 0 : _globalThis$lib6.level), "rune")) !== null && _ref12 !== void 0 ? _ref12 : getRecordValue(runeLibrary, "level")) !== null && _ref11 !== void 0 ? _ref11 : getRecordValue(runeLibrary, "levels")) !== null && _ref10 !== void 0 ? _ref10 : runeLibrary;
			if ((runeLevelConfigCache === null || runeLevelConfigCache === void 0 ? void 0 : runeLevelConfigCache.source) === source) return runeLevelConfigCache;
			const entries = getCollectionEntries(source).map(([key, entry]) => {
				var _record$level;
				const record = getPlainRecord(entry);
				return Object.keys(record).length > 0 ? {
					...record,
					level: (_record$level = record.level) !== null && _record$level !== void 0 ? _record$level : Number(key)
				} : null;
			}).filter((entry) => entry !== null).sort((left, right) => (Number(left.level) || 0) - (Number(right.level) || 0));
			let maxLevel = 0;
			for (const entry of entries) maxLevel = Math.max(maxLevel, Number(entry.level) || 0);
			runeLevelConfigCache = {
				source,
				entries,
				maxLevel
			};
			return runeLevelConfigCache;
		}
		function getRuneMaxLevel() {
			return getRuneLevelConfig().maxLevel;
		}
		function getRuneLevelRecord(level) {
			return getPlainRecord(getRecordValue(getRuneLevelConfig().source, level));
		}
		function getRuneLevelFromHeroValue(value) {
			const numericValue = Number(value) || 0;
			const runeLevelConfig = getRuneLevelConfig();
			if (numericValue <= runeLevelConfig.maxLevel) return numericValue;
			let level = 0;
			runeLevelConfig.entries.forEach((entry) => {
				if (numericValue >= (Number(entry.enchantValue) || 0)) level = Number(entry.level) || level;
			});
			return level;
		}
		function getRuneTierUnlockColor(tier) {
			var _RUNE_UNLOCK_COLORS$n;
			const normalizedTier = Number(tier);
			const configuredColor = Number(getPlainRecord(getRecordValue(getRecordValue(getLibraryData("rune"), "tier"), normalizedTier)).color);
			return configuredColor > 0 ? configuredColor : (_RUNE_UNLOCK_COLORS$n = RUNE_UNLOCK_COLORS[normalizedTier]) !== null && _RUNE_UNLOCK_COLORS$n !== void 0 ? _RUNE_UNLOCK_COLORS$n : 0;
		}
		function getRuneReference(heroId, tier) {
			return getHeroRuneReference(getLibraryEntry(getLibraryData("hero"), heroId), getLibraryData("rune"), tier);
		}
		function getRuneName(heroId, tier) {
			var _reference$translatio;
			const cacheKey = `${String(heroId)}:${String(tier)}`;
			const cachedName = runeNameCache.get(cacheKey);
			if (cachedName) return cachedName;
			const reference = getRuneReference(heroId, tier);
			const name = getTranslatedLibraryName(...(_reference$translatio = reference === null || reference === void 0 ? void 0 : reference.translationKeys) !== null && _reference$translatio !== void 0 ? _reference$translatio : []) || (reference === null || reference === void 0 ? void 0 : reference.fallbackLabel) || translate("HWHHM_RUNE_LABEL", { tier: Number(tier) + 1 });
			runeNameCache.set(cacheKey, name);
			return name;
		}
		function buildRuneQueueView(heroes, settings) {
			const configuredMaxLevel = getRuneMaxLevel();
			const selectedHeroSet = new Set(settings.runeHeroIds.map(String));
			const tierOrder = normalizeOrderedValues(settings.runeTierOrder, RUNE_TIER_IDS, RUNE_TIER_IDS).map(Number);
			let visibleIndex = 0;
			return getOrderedHeroes(heroes, settings.runeHeroOrder).map((hero) => {
				const heroRunes = hero.runes;
				const heroDisabled = RUNE_TIER_IDS.every((tier) => {
					var _getRecordValue2;
					const currentLevel = getRuneLevelFromHeroValue((_getRecordValue2 = getRecordValue(heroRunes, tier)) !== null && _getRecordValue2 !== void 0 ? _getRecordValue2 : 0);
					return configuredMaxLevel > 0 && currentLevel >= configuredMaxLevel || Number(hero.color) < getRuneTierUnlockColor(tier);
				});
				if (shouldHideRow(settings, heroDisabled)) return null;
				return heroQueueRow({
					orderPatchKey: "runeHeroOrder",
					hero,
					index: visibleIndex++,
					checked: selectedHeroSet.has(String(hero.id)),
					icon: "gem",
					disabled: heroDisabled,
					patch: {
						kind: "string-array-toggle",
						key: "runeHeroIds",
						value: String(hero.id),
						currentValues: settings.runeHeroIds
					},
					metrics: [heroMetric("gem", translate("HWHHM_RUNE_LEVELS"), RUNE_TIER_IDS.map((tier) => {
						var _getRecordValue3;
						const currentLevel = getRuneLevelFromHeroValue((_getRecordValue3 = getRecordValue(heroRunes, tier)) !== null && _getRecordValue3 !== void 0 ? _getRecordValue3 : 0);
						return Number(hero.color) < getRuneTierUnlockColor(tier) ? `${tier + 1}:x` : `${tier + 1}:${currentLevel}/${configuredMaxLevel || "—"}`;
					}).join(" "), heroDisabled ? "max" : "")],
					children: tierOrder.map((tier, childIndex) => {
						var _getRecordValue4, _runeReference$id, _runeReference$id2;
						const runeReference = getRuneReference(hero.id, tier);
						const currentLevel = getRuneLevelFromHeroValue((_getRecordValue4 = getRecordValue(heroRunes, tier)) !== null && _getRecordValue4 !== void 0 ? _getRecordValue4 : 0);
						const disabled = configuredMaxLevel > 0 && currentLevel >= configuredMaxLevel || Number(hero.color) < getRuneTierUnlockColor(tier);
						const value = resolveHeroManagerTargetLevel(currentLevel, configuredMaxLevel || currentLevel, getNestedRecord(settings.runeLevelCaps, hero.id)[String(tier)]);
						return {
							key: `rune:${hero.id}:${tier}`,
							index: childIndex,
							label: getRuneName(hero.id, tier),
							icon: "gem",
							gameItemType: "rune",
							gameItemId: (_runeReference$id = runeReference === null || runeReference === void 0 ? void 0 : runeReference.id) !== null && _runeReference$id !== void 0 ? _runeReference$id : tier,
							orderPatchKey: "runeTierOrder",
							orderValue: tier,
							orderScope: "global",
							disabled,
							number: numberControl({
								key: `rune-cap:${hero.id}:${tier}`,
								label: "",
								value,
								minValue: currentLevel,
								maxValue: configuredMaxLevel || void 0,
								icon: "gem",
								gameItemType: "rune",
								gameItemId: (_runeReference$id2 = runeReference === null || runeReference === void 0 ? void 0 : runeReference.id) !== null && _runeReference$id2 !== void 0 ? _runeReference$id2 : tier,
								disabled,
								patch: {
									kind: "nested-number-map",
									key: "runeLevelCaps",
									entryKey: String(hero.id),
									nestedKey: String(tier)
								}
							})
						};
					})
				});
			}).filter(Boolean);
		}
		function buildRunesModuleView(heroes, settings, snapshot) {
			var _snapshot$userInfo2;
			return genericModuleView({
				moduleKey: HERO_MANAGER_MODULE_KEY.RUNES,
				settingsSections: [settingsSection({
					key: "runes:general",
					controls: [numberControl({
						key: "rune-gold-reserve",
						id: "hwhhm-rune-gold-reserve",
						label: formatResourceSettingLabel(translate("HWHHM_GOLD_RESERVE"), (_snapshot$userInfo2 = snapshot.userInfo) === null || _snapshot$userInfo2 === void 0 ? void 0 : _snapshot$userInfo2.gold),
						value: settings.runeGoldReserve,
						icon: "coins",
						...getResourceIconControlProps("gold:0"),
						patch: {
							kind: "number",
							key: "runeGoldReserve"
						}
					})]
				}), settingsSection({
					key: "runes:reserves",
					title: translate("HWHHM_RUNE_RESERVES"),
					controls: RUNE_ITEM_IDS.map((itemId) => {
						var _settings$runeReserve, _settings$runeReserve2;
						return numberControl({
							key: `rune-reserve:${itemId}`,
							id: `hwhhm-rune-reserve-${itemId}`,
							label: formatResourceSettingLabel(getResourceName(`consumable:${itemId}`), getNestedAmount(snapshot.inventory, "consumable", itemId)),
							value: (_settings$runeReserve = (_settings$runeReserve2 = settings.runeReserves) === null || _settings$runeReserve2 === void 0 ? void 0 : _settings$runeReserve2[itemId]) !== null && _settings$runeReserve !== void 0 ? _settings$runeReserve : 0,
							icon: "gem",
							...getResourceIconControlProps(`consumable:${itemId}`),
							patch: {
								kind: "number-map",
								key: "runeReserves",
								entryKey: String(itemId)
							}
						});
					})
				})],
				queueRows: buildRuneQueueView(heroes, settings),
				reorderListVariant: settings.reorderListVariant,
				executionMode: getExecutionMode(settings, HERO_MANAGER_MODULE_KEY.RUNES)
			});
		}
		function buildRunesSettingsModule(heroes, settings, snapshot) {
			return buildSettingsModule({
				key: HERO_MANAGER_MODULE_KEY.RUNES,
				title: translate("HWHHM_SECTION_RUNES"),
				icon: "gem",
				accentColor: "#4d5770",
				buildContent: () => {
					return {
						contentKind: "generic",
						contentView: buildRunesModuleView(heroes, settings, snapshot)
					};
				}
			});
		}
		function buildTitanGiftSettingsModule(heroes, settings, snapshot) {
			return buildSettingsModule({
				key: HERO_MANAGER_MODULE_KEY.GIFTS,
				title: translate("HWHHM_SECTION_TITAN_GIFT"),
				icon: "sparkles",
				accentColor: "#6b4f29",
				buildContent: () => {
					return {
						contentKind: "generic",
						contentView: buildTitanGiftModuleView(heroes, settings, snapshot)
					};
				}
			});
		}
		function buildTitanGiftQueueView(heroes, settings) {
			const selectedHeroSet = new Set(settings.titanGiftHeroIds.map(String));
			let visibleIndex = 0;
			return getOrderedHeroes(heroes, settings.titanGiftHeroOrder).map((hero) => {
				var _settings$titanGiftLe;
				const currentLevel = Number(hero.titanGiftLevel) || 0;
				const disabled = currentLevel >= 30;
				if (shouldHideRow(settings, disabled)) return null;
				return heroQueueRow({
					orderPatchKey: "titanGiftHeroOrder",
					hero,
					index: visibleIndex++,
					checked: selectedHeroSet.has(String(hero.id)),
					icon: "sparkles",
					disabled,
					patch: {
						kind: "string-array-toggle",
						key: "titanGiftHeroIds",
						value: String(hero.id),
						currentValues: settings.titanGiftHeroIds
					},
					metrics: [heroMetric("sparkles", translate("HWHHM_FINAL_LEVEL"), `${currentLevel}/30`, disabled ? "max" : "")],
					children: [{
						key: `titan-gift:${hero.id}`,
						index: 0,
						label: translate("HWHHM_FINAL_LEVEL"),
						icon: "sparkles",
						number: numberControl({
							key: `titan-gift-cap:${hero.id}`,
							id: `hwhhm-titan-gift-cap-${hero.id}`,
							label: "",
							value: resolveHeroManagerTargetLevel(currentLevel, 30, (_settings$titanGiftLe = settings.titanGiftLevelCaps) === null || _settings$titanGiftLe === void 0 ? void 0 : _settings$titanGiftLe[String(hero.id)]),
							minValue: currentLevel,
							maxValue: 30,
							icon: "sparkles",
							disabled,
							patch: {
								kind: "number-map",
								key: "titanGiftLevelCaps",
								entryKey: String(hero.id)
							}
						})
					}]
				});
			}).filter(Boolean);
		}
		function buildTitanGiftModuleView(heroes, settings, snapshot) {
			var _snapshot$userInfo3;
			return genericModuleView({
				moduleKey: HERO_MANAGER_MODULE_KEY.GIFTS,
				settingsSections: [settingsSection({
					key: "gift:general",
					controls: [numberControl({
						key: "titan-gift-reserve",
						id: "hwhhm-titan-gift-reserve",
						label: formatResourceSettingLabel(translate("HWHHM_SPARK_RESERVE"), getNestedAmount(snapshot.inventory, "consumable", 24)),
						value: settings.titanGiftReserve,
						icon: "sparkles",
						...getResourceIconControlProps(`consumable:24`),
						patch: {
							kind: "number",
							key: "titanGiftReserve"
						}
					}), numberControl({
						key: "titan-gift-gold-reserve",
						id: "hwhhm-titan-gift-gold-reserve",
						label: formatResourceSettingLabel(translate("HWHHM_GOLD_RESERVE"), (_snapshot$userInfo3 = snapshot.userInfo) === null || _snapshot$userInfo3 === void 0 ? void 0 : _snapshot$userInfo3.gold),
						value: settings.titanGiftGoldReserve,
						icon: "coins",
						...getResourceIconControlProps("gold:0"),
						patch: {
							kind: "number",
							key: "titanGiftGoldReserve"
						}
					})]
				})],
				queueRows: buildTitanGiftQueueView(heroes, settings),
				reorderListVariant: settings.reorderListVariant,
				executionMode: getExecutionMode(settings, HERO_MANAGER_MODULE_KEY.GIFTS)
			});
		}
		function getArtifactCostCurrencyKeys(heroes) {
			const artifactLib = getLibraryData("artifact");
			const keys = /* @__PURE__ */ new Set();
			heroes.forEach((hero) => {
				ARTIFACT_SLOT_IDS.forEach((slotId) => {
					const artifactType = getArtifactDefinition(getHeroArtifactId(hero.id, slotId, hero.artifacts)).type;
					getArtifactCostCurrencyKeysByType(artifactLib, artifactType).forEach((currencyKey) => keys.add(currencyKey));
				});
			});
			if (keys.size <= 0) getCollectionEntries(getRecordValue(artifactLib, "type")).forEach(([key, typeDefinition]) => {
				var _ref13, _getPlainRecord$id;
				const artifactType = (_ref13 = (_getPlainRecord$id = getPlainRecord(typeDefinition).id) !== null && _getPlainRecord$id !== void 0 ? _getPlainRecord$id : getPlainRecord(typeDefinition).type) !== null && _ref13 !== void 0 ? _ref13 : key;
				getArtifactCostCurrencyKeysByType(artifactLib, artifactType).forEach((currencyKey) => keys.add(currencyKey));
			});
			return [...keys];
		}
		function getArtifactCostCurrencyKeysByType(artifactLibrary, artifactType) {
			const cacheKey = String(artifactType !== null && artifactType !== void 0 ? artifactType : "");
			const cachedKeys = artifactCostCurrencyKeysCache.get(cacheKey);
			if (cachedKeys) return cachedKeys;
			const levels = getArtifactLevelCollection(artifactLibrary, artifactType);
			const keys = /* @__PURE__ */ new Set();
			getCollectionEntries(levels).forEach(([, level]) => {
				const cost = parseCost(getPlainRecord(level).cost);
				if (cost) keys.add(cost.currencyKey);
			});
			const result = [...keys];
			if (result.length > 0) artifactCostCurrencyKeysCache.set(cacheKey, result);
			return result;
		}
		function getArtifactLevelCollection(artifactLibrary, artifactType) {
			var _ref14, _getRecordValue5;
			const artifactTypeDefinition = getPlainRecord(getRecordValue(getRecordValue(artifactLibrary, "type"), artifactType));
			return (_ref14 = (_getRecordValue5 = getRecordValue(artifactTypeDefinition, "levels")) !== null && _getRecordValue5 !== void 0 ? _getRecordValue5 : getRecordValue(artifactTypeDefinition, "level")) !== null && _ref14 !== void 0 ? _ref14 : {};
		}
		function getArtifactLevelRecord(artifactLibrary, artifactType, level) {
			return getPlainRecord(getRecordValue(getArtifactLevelCollection(artifactLibrary, artifactType), level));
		}
		function buildArtifactQueueView(heroes, settings) {
			const selectedHeroSet = new Set(settings.artifactHeroIds.map(String));
			const slotOrder = normalizeOrderedValues(settings.artifactSlotOrder, ARTIFACT_SLOT_IDS, ARTIFACT_SLOT_IDS).map(Number);
			let visibleIndex = 0;
			return getOrderedHeroes(heroes, settings.artifactHeroOrder).map((hero) => {
				const heroArtifacts = hero.artifacts;
				const heroDisabled = ARTIFACT_SLOT_IDS.every((slotId) => {
					const artifact = getHeroArtifactRecord(heroArtifacts, slotId);
					return !(artifact === null || artifact === void 0 ? void 0 : artifact.star) || (Number(artifact.level) || 0) >= 100;
				});
				if (shouldHideRow(settings, heroDisabled)) return null;
				return heroQueueRow({
					orderPatchKey: "artifactHeroOrder",
					hero,
					index: visibleIndex++,
					checked: selectedHeroSet.has(String(hero.id)),
					icon: "hammer",
					disabled: heroDisabled,
					patch: {
						kind: "string-array-toggle",
						key: "artifactHeroIds",
						value: String(hero.id),
						currentValues: settings.artifactHeroIds
					},
					metrics: [heroMetric("hammer", translate("HWHHM_ARTIFACT_LEVELS"), slotOrder.map((slotId) => {
						const artifact = getHeroArtifactRecord(heroArtifacts, slotId);
						return (artifact === null || artifact === void 0 ? void 0 : artifact.star) ? `${slotId + 1}:${Number(artifact.level) || 0}/100` : `${slotId + 1}:x`;
					}).join(" "), heroDisabled ? "max" : "")],
					children: slotOrder.map((slotId, childIndex) => {
						var _ref15, _getNestedRecord$Stri;
						const artifact = getHeroArtifactRecord(heroArtifacts, slotId);
						const artifactId = getHeroArtifactId(hero.id, slotId, heroArtifacts);
						const artifactIconId = String(artifactId !== null && artifactId !== void 0 ? artifactId : "");
						const artifactLabel = getArtifactName(artifactId, slotId);
						const currentLevel = Number(artifact === null || artifact === void 0 ? void 0 : artifact.level) || 0;
						const hasArtifact = !!(artifact === null || artifact === void 0 ? void 0 : artifact.star);
						const disabled = !hasArtifact || currentLevel >= 100;
						const artifactTargetValue = resolveHeroManagerTargetLevel(currentLevel, 100, (_ref15 = (_getNestedRecord$Stri = getNestedRecord(settings.artifactTargets, hero.id)[String(slotId)]) !== null && _getNestedRecord$Stri !== void 0 ? _getNestedRecord$Stri : getRecordValue(settings.artifactLevelCaps, slotId)) !== null && _ref15 !== void 0 ? _ref15 : 100);
						const checked = hasArtifact && (getNestedRecord(settings.artifactTargets, hero.id)[String(slotId)] !== void 0 || selectedHeroSet.has(String(hero.id)) && settings.artifactSlots.includes(String(slotId)));
						return {
							key: `artifact:${hero.id}:${slotId}`,
							index: childIndex,
							label: artifactLabel,
							icon: "hammer",
							gameItemType: "artifact",
							gameItemId: artifactIconId,
							orderPatchKey: "artifactSlotOrder",
							orderValue: slotId,
							orderScope: "global",
							disabled,
							checkbox: checkboxControl({
								key: `artifact-enabled:${hero.id}:${slotId}`,
								checked: checked && !disabled,
								label: artifactLabel,
								icon: "hammer",
								gameItemType: "artifact",
								gameItemId: artifactIconId,
								disabled,
								patch: {
									kind: "nested-number-map-toggle",
									key: "artifactTargets",
									entryKey: String(hero.id),
									nestedKey: String(slotId),
									value: artifactTargetValue,
									currentValue: settings.artifactTargets,
									relatedStringArray: {
										key: "artifactHeroIds",
										value: String(hero.id),
										currentValues: settings.artifactHeroIds
									}
								}
							}),
							number: numberControl({
								key: `artifact-target:${hero.id}:${slotId}`,
								label: "",
								value: artifactTargetValue,
								minValue: currentLevel,
								maxValue: 100,
								icon: "target",
								gameItemType: "artifact",
								gameItemId: artifactIconId,
								compact: true,
								disabled,
								patch: {
									kind: "nested-number-map",
									key: "artifactTargets",
									entryKey: String(hero.id),
									nestedKey: String(slotId),
									currentValue: settings.artifactTargets,
									relatedStringArray: {
										key: "artifactHeroIds",
										value: String(hero.id),
										currentValues: settings.artifactHeroIds
									}
								}
							})
						};
					})
				});
			}).filter(Boolean);
		}
		function buildArtifactsModuleView(heroes, settings, snapshot) {
			return {
				...genericModuleView({
					moduleKey: HERO_MANAGER_MODULE_KEY.ARTIFACTS,
					settingsSections: [resourceReserveSection({
						key: "artifacts:reserves",
						title: translate("HWHHM_ARTIFACT_RESERVES"),
						keys: getArtifactCostCurrencyKeys(heroes),
						values: settings.artifactReserves,
						inventory: snapshot.inventory,
						userInfo: snapshot.userInfo,
						dataName: "artifact-reserve"
					})],
					queueRows: buildArtifactQueueView(heroes, settings),
					reorderListVariant: settings.reorderListVariant,
					executionMode: getExecutionMode(settings, HERO_MANAGER_MODULE_KEY.ARTIFACTS)
				}),
				queueSearchText: translate("HWHHM_ARTIFACT_TARGETS")
			};
		}
		function buildArtifactsSettingsModule(heroes, settings, snapshot) {
			return buildSettingsModule({
				key: HERO_MANAGER_MODULE_KEY.ARTIFACTS,
				title: translate("HWHHM_SECTION_ARTIFACTS"),
				icon: "hammer",
				accentColor: "#5f4528",
				buildContent: () => {
					return {
						contentKind: "generic",
						contentView: buildArtifactsModuleView(heroes, settings, snapshot)
					};
				}
			});
		}
		function getAscensionMaxRank(heroId) {
			const heroConfig = getAscensionHeroConfig(getLibraryData("heroAscension"), heroId);
			return Math.max(1, ...getAscensionRankConfigs(heroConfig).map((rankConfig) => Number(rankConfig.rank) || 0));
		}
		function isAscensionHeroMaxed(hero) {
			const ascensionLib = getLibraryData("heroAscension");
			const heroConfig = getAscensionHeroConfig(ascensionLib, hero.id);
			if (!heroConfig) return true;
			return getAscensionRankConfigs(heroConfig).every((rankConfig) => {
				var _rankConfig$minHeroCo;
				const rank = Number(rankConfig === null || rankConfig === void 0 ? void 0 : rankConfig.rank);
				if ((Number(hero.color) || 0) < Number((_rankConfig$minHeroCo = rankConfig === null || rankConfig === void 0 ? void 0 : rankConfig.minHeroColor) !== null && _rankConfig$minHeroCo !== void 0 ? _rankConfig$minHeroCo : 0)) return true;
				const nodeIds = Array.isArray(rankConfig === null || rankConfig === void 0 ? void 0 : rankConfig.nodes) ? rankConfig.nodes : [];
				const unlockedSet = cloneUnlockedAscensionSet(hero, rank);
				return nodeIds.every((nodeId, nodeIndex) => {
					const node = getAscensionNodeConfig(ascensionLib, nodeId);
					return !node || node.isEmptySkillNode || unlockedSet.has(nodeIndex);
				});
			});
		}
		function buildAsgardSettingsModule(heroes, settings, snapshot) {
			return buildSettingsModule({
				key: HERO_MANAGER_MODULE_KEY.ASGARD,
				title: translate("HWHHM_SECTION_ASGARD"),
				icon: "shield",
				accentColor: "#4d5770",
				buildContent: () => {
					return {
						contentKind: "generic",
						contentView: buildAsgardModuleView(heroes, settings, snapshot)
					};
				}
			});
		}
		function buildAscensionQueueView(heroes, settings) {
			const selectedHeroSet = new Set(settings.ascensionHeroIds.map(String));
			let visibleIndex = 0;
			return getOrderedHeroes(heroes, settings.ascensionHeroOrder).map((hero) => {
				var _settings$ascensionRa;
				const currentRank = getAscensionCurrentMaxRank(hero);
				const maxRank = getAscensionMaxRank(hero.id);
				const disabled = isAscensionHeroMaxed(hero);
				if (shouldHideRow(settings, disabled)) return null;
				const rowIndex = visibleIndex++;
				const effectiveMaxRank = Math.max(currentRank, Math.min(maxRank, settings.ascensionGlobalRankCap || maxRank));
				const value = resolveHeroManagerTargetLevel(currentRank, effectiveMaxRank, (_settings$ascensionRa = settings.ascensionRankCaps) === null || _settings$ascensionRa === void 0 ? void 0 : _settings$ascensionRa[String(hero.id)]);
				const branchSummary = Object.entries(getPlainRecord(hero.ascensions)).sort((left, right) => Number(left[0]) - Number(right[0])).map(([rank, nodes]) => `${rank}:${Array.isArray(nodes) ? nodes.length : 0}`).join(" ");
				return heroQueueRow({
					orderPatchKey: "ascensionHeroOrder",
					hero,
					index: rowIndex,
					checked: selectedHeroSet.has(String(hero.id)),
					icon: "shield",
					disabled,
					patch: {
						kind: "string-array-toggle",
						key: "ascensionHeroIds",
						value: String(hero.id),
						currentValues: settings.ascensionHeroIds
					},
					metrics: [heroMetric("shield", translate("HWHHM_ASCENSION_PROGRESS"), branchSummary || `${currentRank}:0`, disabled ? "max" : "")],
					children: [{
						key: `ascension:${hero.id}`,
						index: 0,
						label: translate("HWHHM_ASCENSION_RANK_CAP"),
						icon: "shield",
						number: numberControl({
							key: `ascension-rank-cap:${hero.id}`,
							id: `hwhhm-ascension-rank-cap-${hero.id}`,
							label: "",
							value,
							minValue: currentRank,
							maxValue: effectiveMaxRank,
							icon: "shield",
							disabled,
							patch: {
								kind: "number-map",
								key: "ascensionRankCaps",
								entryKey: String(hero.id)
							}
						})
					}]
				});
			}).filter(Boolean);
		}
		function buildAsgardModuleView(heroes, settings, snapshot) {
			const ascensionKeys = [...collectCostKeysFromObject(getLibraryData("heroAscension"))];
			const globalMaxRank = Math.max(1, ...heroes.map((hero) => getAscensionMaxRank(hero.id)));
			return genericModuleView({
				moduleKey: HERO_MANAGER_MODULE_KEY.ASGARD,
				settingsSections: [settingsSection({
					key: "asgard:general",
					controls: [numberControl({
						key: "ascension-global-rank-cap",
						id: "hwhhm-ascension-global-rank-cap",
						label: translate("HWHHM_ASCENSION_GLOBAL_RANK_CAP"),
						value: Math.min(globalMaxRank, settings.ascensionGlobalRankCap || globalMaxRank),
						icon: "shield",
						minValue: 1,
						maxValue: globalMaxRank,
						patch: {
							kind: "number",
							key: "ascensionGlobalRankCap"
						}
					})]
				}), resourceReserveSection({
					key: "asgard:reserves",
					title: translate("HWHHM_ASGARD_RESERVES"),
					keys: ascensionKeys,
					values: settings.ascensionResourceReserves,
					inventory: snapshot.inventory,
					userInfo: snapshot.userInfo,
					dataName: "ascension-reserve"
				})],
				queueRows: buildAscensionQueueView(heroes, settings),
				reorderListVariant: settings.reorderListVariant,
				executionMode: getExecutionMode(settings, HERO_MANAGER_MODULE_KEY.ASGARD)
			});
		}
		const sendCallsInChunks = createChunkedCallSender({
			chunkSize: 20,
			sendChunk: (chunk) => Caller.send(chunk.map(toTransportCall))
		});
		function createPlannedCall(call, meta) {
			var _meta$module, _meta$heroName, _meta$countsAsLevel;
			const heroId = meta.heroId;
			const moduleKey = String((_meta$module = meta.module) !== null && _meta$module !== void 0 ? _meta$module : "technical");
			return {
				...call,
				__hwhhm: {
					module: moduleKey,
					heroId,
					heroName: (_meta$heroName = meta.heroName) !== null && _meta$heroName !== void 0 ? _meta$heroName : heroId !== void 0 ? getHeroName(heroId) : "",
					action: meta.action,
					from: meta.from,
					to: meta.to,
					countsAsLevel: (_meta$countsAsLevel = meta.countsAsLevel) !== null && _meta$countsAsLevel !== void 0 ? _meta$countsAsLevel : true,
					spent: mergeSpent(meta.spent)
				}
			};
		}
		function getSkillUpgradeCalls(settings, snapshot, working, moduleLimit = Number.POSITIVE_INFINITY) {
			var _getSkillPointRefillS;
			const calls = [];
			const maxCalls = Number.isFinite(Number(moduleLimit)) ? normalizeNonNegativeInteger(moduleLimit, 0) : Number.POSITIVE_INFINITY;
			if (maxCalls <= 0) return calls;
			const heroById = new Map(getSnapshotHeroes(snapshot).map((hero) => [String(hero.id), hero]));
			let skillPoints = getSkillPointAmount(snapshot.userInfo);
			let skillPointPurchasesLeft = settings.buySkillPointsForEmeralds ? Math.max(0, settings.maxSkillPointPurchases - normalizeNonNegativeInteger((_getSkillPointRefillS = getSkillPointRefillState(snapshot.userInfo)) === null || _getSkillPointRefillS === void 0 ? void 0 : _getSkillPointRefillS.boughtToday, 0)) : 0;
			const skillPointRefillAmount = getSkillPointRefillAmount();
			const skillConfig = skillsViewBuilder.getSkillLevelCostConfig();
			let upgradeCount = 0;
			const tryBuySkillPoints = () => {
				var _getSkillPointRefillS2;
				if (skillPoints > 0 || skillPointPurchasesLeft <= 0 || upgradeCount >= maxCalls) return false;
				const boughtIndex = normalizeNonNegativeInteger((_getSkillPointRefillS2 = getSkillPointRefillState(snapshot.userInfo)) === null || _getSkillPointRefillS2 === void 0 ? void 0 : _getSkillPointRefillS2.boughtToday, 0) + (settings.maxSkillPointPurchases - skillPointPurchasesLeft);
				const emeraldCost = getSkillPointPurchaseEmeraldCost(boughtIndex);
				calls.push(createPlannedCall({
					name: "refillableBuySkillpoints",
					args: {},
					ident: "group_1_body"
				}, {
					module: "skills",
					action: translate("HWHHM_SKILL_POINT_BUY_ACTION"),
					to: translate("HWHHM_SKILL_POINT_BUY_RESULT", { amount: formatNumber(skillPointRefillAmount) }),
					countsAsLevel: false,
					spent: [{
						currencyKey: "starmoney:0",
						amount: emeraldCost
					}]
				}));
				skillPointPurchasesLeft -= 1;
				skillPoints += skillPointRefillAmount;
				return true;
			};
			getExecutionHeroIds(settings, settings.skillHeroIds, settings.skillHeroOrder, HERO_MANAGER_MODULE_KEY.SKILLS).forEach((heroId) => {
				const hero = heroById.get(String(heroId));
				if (!hero || upgradeCount >= maxCalls) return;
				skillsViewBuilder.getSkillTierOrder(settings, heroId).forEach((tierValue) => {
					const tier = Number(tierValue);
					if (upgradeCount >= maxCalls) return;
					const skillReference = skillsViewBuilder.getHeroSkillDefinition(heroId, tier, hero.skills);
					const tierState = getSkillTierState(hero, tier, skillsViewBuilder.getSkillMaxLevel(heroId, tier, hero.skills), skillReference === null || skillReference === void 0 ? void 0 : skillReference.id);
					let currentLevel = tierState.currentLevel;
					const targetLevel = skillsViewBuilder.getSkillTargetLevel(settings, heroId, tier, currentLevel, tierState.maxLevel);
					if (targetLevel <= currentLevel || currentLevel >= tierState.maxLevel || !tierState.unlocked) return;
					if (skillPoints <= 0 && !tryBuySkillPoints()) return;
					while (skillPoints > 0 && currentLevel < targetLevel && currentLevel < tierState.maxLevel && upgradeCount < maxCalls) {
						if (!tryBuySkillPoints() && skillPoints <= 0) return;
						const cost = getSkillUpgradeGoldCost(skillConfig, currentLevel + 1, tier);
						if (cost === null) {
							console.warn(`[HeroManager] Не найдено золото для умения ${tier} на уровне ${currentLevel + 1}.`, {
								heroId,
								tier,
								currentLevel,
								skillConfig
							});
							return;
						}
						if (working.gold - cost < settings.skillGoldReserve) return;
						working.gold -= cost;
						skillPoints -= 1;
						currentLevel += 1;
						upgradeCount += 1;
						calls.push(createPlannedCall({
							name: "heroUpgradeSkill",
							args: {
								heroId: Number(heroId),
								skill: tier
							},
							ident: `hwhhm_skill_${heroId}_${tier}_${currentLevel}`
						}, {
							module: "skills",
							heroId,
							action: skillsViewBuilder.getSkillName(heroId, tier, hero.skills),
							from: currentLevel - 1,
							to: currentLevel,
							spent: [{
								currencyKey: "gold:0",
								amount: cost
							}]
						}));
					}
				});
			});
			return calls;
		}
		function getEvolutionCost(nextStar) {
			var _globalThis$lib7, _map$find, _ref16, _evolutionStarRecord$, _ref17, _ref18, _ref19, _evolutionStarRecord$2, _ref20, _ref21, _fragmentRecord$amoun, _ref22, _ref23, _evolutionStarRecord$3;
			const enumData = getLibraryData("enum");
			const directEnumData = getPlainRecord((_globalThis$lib7 = globalThis.lib) === null || _globalThis$lib7 === void 0 || (_globalThis$lib7 = _globalThis$lib7.data) === null || _globalThis$lib7 === void 0 ? void 0 : _globalThis$lib7.enum);
			const evolutionStarRecord = (_map$find = [
				getRecordValue(getRecordValue(enumData, "evolutionStar"), nextStar),
				getRecordValue(getRecordValue(enumData, "heroEvolutionStar"), nextStar),
				getRecordValue(getRecordValue(directEnumData, "evolutionStar"), nextStar),
				getRecordValue(getRecordValue(directEnumData, "heroEvolutionStar"), nextStar)
			].map(getPlainRecord).find((entry) => Object.keys(entry).length > 0)) !== null && _map$find !== void 0 ? _map$find : {};
			const evolveCost = getPlainRecord((_ref16 = (_evolutionStarRecord$ = evolutionStarRecord.evolveCost) !== null && _evolutionStarRecord$ !== void 0 ? _evolutionStarRecord$ : evolutionStarRecord.cost) !== null && _ref16 !== void 0 ? _ref16 : evolutionStarRecord.evolvePrice);
			const fragmentSource = (_ref17 = (_ref18 = (_ref19 = (_evolutionStarRecord$2 = evolutionStarRecord.evolveFragmentCost) !== null && _evolutionStarRecord$2 !== void 0 ? _evolutionStarRecord$2 : evolutionStarRecord.fragmentCount) !== null && _ref19 !== void 0 ? _ref19 : evolutionStarRecord.fragments) !== null && _ref18 !== void 0 ? _ref18 : evolveCost.fragmentHero) !== null && _ref17 !== void 0 ? _ref17 : evolveCost.fragments;
			const fragmentRecord = getPlainRecord(fragmentSource);
			const fragments = Number(fragmentSource) || Number((_ref20 = (_ref21 = (_fragmentRecord$amoun = fragmentRecord.amount) !== null && _fragmentRecord$amoun !== void 0 ? _fragmentRecord$amoun : fragmentRecord.count) !== null && _ref21 !== void 0 ? _ref21 : fragmentRecord.value) !== null && _ref20 !== void 0 ? _ref20 : Object.values(fragmentRecord).find((value) => Number(value) > 0)) || 0;
			return {
				gold: Number((_ref22 = (_ref23 = (_evolutionStarRecord$3 = evolutionStarRecord.evolveGoldCost) !== null && _evolutionStarRecord$3 !== void 0 ? _evolutionStarRecord$3 : evolveCost.gold) !== null && _ref23 !== void 0 ? _ref23 : evolveCost.coins) !== null && _ref22 !== void 0 ? _ref22 : evolutionStarRecord.gold) || 0,
				fragments
			};
		}
		function buildHeroSoulPurchases(settings, snapshot, working, allowedHeroIds = void 0) {
			const selectedHeroIds = allowedHeroIds !== null && allowedHeroIds !== void 0 ? allowedHeroIds : new Set(settings.evolutionHeroIds.map(String));
			const enabledShopIds = new Set(settings.evolutionShopIds.map(String));
			const calls = [];
			getSnapshotShops(snapshot).forEach((shop) => {
				if (!enabledShopIds.has(String(shop === null || shop === void 0 ? void 0 : shop.id))) return;
				getShopSlots(shop).forEach((slot) => {
					var _settings$evolutionCo3, _settings$evolutionCo4;
					const reward = getPlainRecord(slot.reward);
					const fragmentHero = getPlainRecord(reward.fragmentHero);
					const heroId = Object.keys(fragmentHero)[0];
					if (!heroId || !selectedHeroIds.has(String(heroId)) || (slot === null || slot === void 0 ? void 0 : slot.bought)) return;
					const cost = parseCost(slot.cost);
					if (!cost) return;
					const reserve = (_settings$evolutionCo3 = (_settings$evolutionCo4 = settings.evolutionCoinReserves) === null || _settings$evolutionCo4 === void 0 ? void 0 : _settings$evolutionCo4[cost.currencyKey]) !== null && _settings$evolutionCo3 !== void 0 ? _settings$evolutionCo3 : 0;
					if (!canSpendCurrency(working, cost.currencyKey, cost.amount, reserve)) return;
					spendCurrency(working, cost.currencyKey, cost.amount);
					const rewardAmount = Number(fragmentHero[heroId]) || 0;
					setNestedAmount(working.inventory, "fragmentHero", heroId, getNestedAmount(working.inventory, "fragmentHero", heroId) + rewardAmount);
					calls.push(createPlannedCall({
						name: "shopBuy",
						args: {
							shopId: Number(shop.id),
							slot: Number(slot.id),
							cost: slot.cost,
							reward
						},
						ident: `hwhhm_soul_shop_${shop.id}_${slot.id}`
					}, {
						module: "evolutions",
						heroId,
						action: `${getShopName(shop.id)}: +${formatNumber(rewardAmount)}`,
						countsAsLevel: false,
						spent: [cost]
					}));
				});
			});
			return calls;
		}
		function getEvolutionCalls(settings, snapshot, working, moduleLimit = Number.POSITIVE_INFINITY) {
			const maxEvolutions = Number.isFinite(Number(moduleLimit)) ? normalizeNonNegativeInteger(moduleLimit, 0) : Number.POSITIVE_INFINITY;
			if (maxEvolutions <= 0) return [];
			const evolutionHeroIds = getExecutionHeroIds(settings, settings.evolutionHeroIds, settings.evolutionHeroOrder, HERO_MANAGER_MODULE_KEY.EVOLUTIONS).filter((heroId) => {
				const hero = getSnapshotHero(snapshot, heroId);
				if (!hero) return false;
				const currentStar = getHeroCurrentStar(hero);
				return Math.min(6, getEvolutionTargetStar(settings, hero)) > currentStar;
			});
			const calls = buildHeroSoulPurchases(settings, snapshot, working, Number.isFinite(maxEvolutions) ? new Set(evolutionHeroIds.slice(0, maxEvolutions).map(String)) : void 0);
			let evolutionCount = 0;
			evolutionHeroIds.forEach((heroId) => {
				const hero = getSnapshotHero(snapshot, heroId);
				if (!hero || evolutionCount >= maxEvolutions) return;
				let currentStar = getHeroCurrentStar(hero);
				const targetStar = Math.min(6, getEvolutionTargetStar(settings, hero));
				while (currentStar < targetStar && evolutionCount < maxEvolutions) {
					const nextStar = currentStar + 1;
					const cost = getEvolutionCost(nextStar);
					const fragments = getNestedAmount(working.inventory, "fragmentHero", heroId);
					if (fragments < cost.fragments || (Number(working.gold) || 0) - cost.gold < settings.evolutionGoldReserve) return;
					setNestedAmount(working.inventory, "fragmentHero", heroId, fragments - cost.fragments);
					working.gold -= cost.gold;
					calls.push(createPlannedCall({
						name: "heroEvolve",
						args: { heroId: Number(heroId) },
						ident: `hwhhm_evolve_${heroId}_${nextStar}`
					}, {
						module: "evolutions",
						heroId,
						action: translate("HWHHM_SECTION_EVOLUTION"),
						from: currentStar,
						to: nextStar,
						spent: [{
							currencyKey: "gold:0",
							amount: cost.gold
						}, {
							currencyKey: `fragmentHero:${heroId}`,
							amount: cost.fragments
						}]
					}));
					currentStar = nextStar;
					evolutionCount += 1;
				}
			});
			return calls;
		}
		function getSkinUpgradeCalls(settings, snapshot, working, moduleLimit = Number.POSITIVE_INFINITY) {
			const calls = [];
			const maxCalls = Number.isFinite(Number(moduleLimit)) ? normalizeNonNegativeInteger(moduleLimit, 0) : Number.POSITIVE_INFINITY;
			if (maxCalls <= 0) return calls;
			getExecutionSkinKeys(settings).forEach((key) => {
				var _skinsViewBuilder$get, _skinsViewBuilder$get2, _settings$skinLevelCa;
				const [heroId, skinId] = String(key).split(":");
				const hero = getSnapshotHero(snapshot, heroId);
				if (!hero || calls.length >= maxCalls) return;
				let level = Number(getRecordValue(hero.skins, skinId)) || 0;
				const skinLabel = (_skinsViewBuilder$get = (_skinsViewBuilder$get2 = skinsViewBuilder.getHeroSkinEntries(hero).find((entry) => String(entry.skinId) === String(skinId))) === null || _skinsViewBuilder$get2 === void 0 ? void 0 : _skinsViewBuilder$get2.label) !== null && _skinsViewBuilder$get !== void 0 ? _skinsViewBuilder$get : `Skin ${skinId}`;
				const targetLevel = resolveHeroManagerTargetLevel(level, skinCatalog.getMaxSkinLevel(skinId), (_settings$skinLevelCa = settings.skinLevelCaps) === null || _settings$skinLevelCa === void 0 ? void 0 : _settings$skinLevelCa[key]);
				while (level < targetLevel && calls.length < maxCalls) {
					var _settings$skinCoinRes, _settings$skinCoinRes2;
					const cost = parseCost(skinCatalog.getSkinLevelRecord(skinId, level + 1).cost);
					if (!cost) return;
					const reserve = (_settings$skinCoinRes = (_settings$skinCoinRes2 = settings.skinCoinReserves) === null || _settings$skinCoinRes2 === void 0 ? void 0 : _settings$skinCoinRes2[cost.currencyKey]) !== null && _settings$skinCoinRes !== void 0 ? _settings$skinCoinRes : 0;
					if (!canSpendCurrency(working, cost.currencyKey, cost.amount, reserve)) return;
					spendCurrency(working, cost.currencyKey, cost.amount);
					level += 1;
					calls.push(createPlannedCall({
						name: "heroSkinUpgrade",
						args: {
							heroId: Number(heroId),
							skinId: Number(skinId)
						},
						ident: `hwhhm_skin_${heroId}_${skinId}_${level}`
					}, {
						module: "skins",
						heroId,
						action: skinLabel,
						from: level - 1,
						to: level,
						spent: [cost]
					}));
				}
			});
			return calls;
		}
		function getExecutionSkinKeys(settings) {
			const skinKeys = normalizeStringArray(settings.skinKeys);
			if (getExecutionMode(settings, HERO_MANAGER_MODULE_KEY.SKINS) === "parallel") return orderExecutionIds(skinKeys, [], HERO_MANAGER_EXECUTION_MODE_PARALLEL);
			const skinKeysByHero = /* @__PURE__ */ new Map();
			skinKeys.forEach((key) => {
				var _skinKeysByHero$get;
				const [heroId] = key.split(":");
				if (!heroId) return;
				const heroKeys = (_skinKeysByHero$get = skinKeysByHero.get(heroId)) !== null && _skinKeysByHero$get !== void 0 ? _skinKeysByHero$get : [];
				heroKeys.push(key);
				skinKeysByHero.set(heroId, heroKeys);
			});
			const targetSkinIds = normalizeOrderedValues(settings.skinTargetOrder, [...new Set(skinKeys.map((key) => key.split(":")[1]).filter(Boolean))], []);
			const targetIndex = new Map(targetSkinIds.map((skinId, index) => [skinId, index]));
			return getExecutionHeroIds(settings, [...skinKeysByHero.keys()], settings.skinHeroOrder, HERO_MANAGER_MODULE_KEY.SKINS).flatMap((heroId) => {
				var _skinKeysByHero$get2;
				return ((_skinKeysByHero$get2 = skinKeysByHero.get(heroId)) !== null && _skinKeysByHero$get2 !== void 0 ? _skinKeysByHero$get2 : []).sort((left, right) => {
					var _left$split$, _right$split$, _targetIndex$get, _targetIndex$get2;
					const leftSkinId = (_left$split$ = left.split(":")[1]) !== null && _left$split$ !== void 0 ? _left$split$ : "";
					const rightSkinId = (_right$split$ = right.split(":")[1]) !== null && _right$split$ !== void 0 ? _right$split$ : "";
					return ((_targetIndex$get = targetIndex.get(leftSkinId)) !== null && _targetIndex$get !== void 0 ? _targetIndex$get : Number.MAX_SAFE_INTEGER) - ((_targetIndex$get2 = targetIndex.get(rightSkinId)) !== null && _targetIndex$get2 !== void 0 ? _targetIndex$get2 : Number.MAX_SAFE_INTEGER) || compareNaturalText(leftSkinId, rightSkinId);
				});
			});
		}
		function getRuneItemPower(itemId) {
			var _ref24, _ref25, _consumable$runePoint;
			const numericItemId = Number(itemId);
			const consumable = getPlainRecord(getRecordValue(getLibraryData("consumable"), itemId));
			return Number((_ref24 = (_ref25 = (_consumable$runePoint = consumable.runePoints) !== null && _consumable$runePoint !== void 0 ? _consumable$runePoint : consumable.enchantValue) !== null && _ref25 !== void 0 ? _ref25 : consumable.exp) !== null && _ref24 !== void 0 ? _ref24 : consumable.value) || {
				1: 1,
				2: 5,
				3: 10,
				4: 50
			}[numericItemId] || 1;
		}
		function getRuneEnchantValue(level) {
			return Number(getRuneLevelRecord(level).enchantValue) || 0;
		}
		function buildRuneItems(working, settings, requiredExp) {
			let expLeft = Math.max(0, Number(requiredExp) || 0);
			const items = {};
			[...RUNE_ITEM_IDS].reverse().forEach((itemId) => {
				var _settings$runeReserve3, _settings$runeReserve4;
				if (expLeft <= 0) return;
				const power = getRuneItemPower(itemId);
				const available = Math.max(0, getNestedAmount(working.inventory, "consumable", itemId) - ((_settings$runeReserve3 = (_settings$runeReserve4 = settings.runeReserves) === null || _settings$runeReserve4 === void 0 ? void 0 : _settings$runeReserve4[itemId]) !== null && _settings$runeReserve3 !== void 0 ? _settings$runeReserve3 : 0));
				const amount = Math.min(available, Math.ceil(expLeft / power));
				if (amount <= 0) return;
				items[itemId] = amount;
				expLeft -= amount * power;
				setNestedAmount(working.inventory, "consumable", itemId, getNestedAmount(working.inventory, "consumable", itemId) - amount);
			});
			return expLeft <= 0 ? items : null;
		}
		function getRuneUpgradeCalls(settings, snapshot, working, moduleLimit = Number.POSITIVE_INFINITY) {
			const calls = [];
			const maxCalls = Number.isFinite(Number(moduleLimit)) ? normalizeNonNegativeInteger(moduleLimit, 0) : Number.POSITIVE_INFINITY;
			if (maxCalls <= 0) return calls;
			const tierOrder = normalizeOrderedValues(settings.runeTierOrder, RUNE_TIER_IDS, RUNE_TIER_IDS).map(Number);
			getExecutionHeroes(settings, snapshot, settings.runeHeroIds, settings.runeHeroOrder, HERO_MANAGER_MODULE_KEY.RUNES).forEach((hero) => {
				if (calls.length >= maxCalls) return;
				tierOrder.forEach((tier) => {
					var _getRecordValue6, _settings$runeLevelCa;
					if (calls.length >= maxCalls) return;
					const heroIdKey = String(hero.id);
					let currentLevel = getRuneLevelFromHeroValue((_getRecordValue6 = getRecordValue(hero.runes, tier)) !== null && _getRecordValue6 !== void 0 ? _getRecordValue6 : 0);
					const targetLevel = resolveHeroManagerTargetLevel(currentLevel, getRuneMaxLevel() || currentLevel, (_settings$runeLevelCa = settings.runeLevelCaps) === null || _settings$runeLevelCa === void 0 || (_settings$runeLevelCa = _settings$runeLevelCa[heroIdKey]) === null || _settings$runeLevelCa === void 0 ? void 0 : _settings$runeLevelCa[tier]);
					if (targetLevel <= currentLevel || Number(hero.color) < getRuneTierUnlockColor(tier)) return;
					while (currentLevel < targetLevel && calls.length < maxCalls) {
						const nextLevel = currentLevel + 1;
						const requiredExp = getRuneEnchantValue(nextLevel) - getRuneEnchantValue(currentLevel);
						const goldCost = requiredExp * (Number(getRuneLevelRecord(nextLevel).goldPerEnchantPoint) || 0);
						if ((Number(working.gold) || 0) - goldCost < settings.runeGoldReserve) return;
						const items = buildRuneItems(working, settings, requiredExp);
						if (!items) return;
						working.gold -= goldCost;
						calls.push(createPlannedCall({
							name: "heroEnchantRune",
							args: {
								heroId: Number(hero.id),
								tier,
								items: { consumable: items }
							},
							ident: `hwhhm_rune_${hero.id}_${tier}_${nextLevel}`
						}, {
							module: "runes",
							heroId: hero.id,
							action: translate("HWHHM_RUNE_LABEL", { tier: tier + 1 }),
							from: currentLevel,
							to: nextLevel,
							spent: [{
								currencyKey: "gold:0",
								amount: goldCost
							}, ...Object.entries(items).map(([itemId, amount]) => ({
								currencyKey: `consumable:${itemId}`,
								amount
							}))]
						}));
						currentLevel = nextLevel;
					}
				});
			});
			return calls;
		}
		function getTitanGiftCalls(settings, snapshot, working, moduleLimit = Number.POSITIVE_INFINITY) {
			const calls = [];
			const maxCalls = Number.isFinite(Number(moduleLimit)) ? normalizeNonNegativeInteger(moduleLimit, 0) : Number.POSITIVE_INFINITY;
			if (maxCalls <= 0) return calls;
			const titanGiftLib = getLibraryData("titanGift");
			getExecutionHeroIds(settings, settings.titanGiftHeroIds, settings.titanGiftHeroOrder, HERO_MANAGER_MODULE_KEY.GIFTS).forEach((heroId) => {
				var _settings$titanGiftLe2;
				const hero = getSnapshotHero(snapshot, heroId);
				if (!hero || calls.length >= maxCalls) return;
				let level = Number(hero.titanGiftLevel) || 0;
				const targetLevel = resolveHeroManagerTargetLevel(level, 30, (_settings$titanGiftLe2 = settings.titanGiftLevelCaps) === null || _settings$titanGiftLe2 === void 0 ? void 0 : _settings$titanGiftLe2[heroId]);
				while (level < targetLevel && calls.length < maxCalls) {
					const cost = getPlainRecord(getRecordValue(titanGiftLib, level + 1)).cost;
					const costRecord = getPlainRecord(cost);
					const sparkCost = Number(getPlainRecord(costRecord.consumable)[String(24)]) || 0;
					const goldCost = Number(costRecord.gold) || 0;
					const sparks = getNestedAmount(working.inventory, "consumable", 24);
					if (sparks - sparkCost < settings.titanGiftReserve || (Number(working.gold) || 0) - goldCost < settings.titanGiftGoldReserve) return;
					setNestedAmount(working.inventory, "consumable", 24, sparks - sparkCost);
					working.gold -= goldCost;
					level += 1;
					calls.push(createPlannedCall({
						name: "heroTitanGiftLevelUp",
						args: { heroId: Number(heroId) },
						ident: `hwhhm_titan_gift_${heroId}_${level}`
					}, {
						module: "gifts",
						heroId,
						action: translate("HWHHM_SECTION_TITAN_GIFT"),
						from: level - 1,
						to: level,
						spent: [{
							currencyKey: `consumable:24`,
							amount: sparkCost
						}, {
							currencyKey: "gold:0",
							amount: goldCost
						}]
					}));
				}
			});
			return calls;
		}
		function getArtifactUpgradeCalls(settings, snapshot, working, moduleLimit = Number.POSITIVE_INFINITY) {
			const calls = [];
			const maxCalls = Number.isFinite(Number(moduleLimit)) ? normalizeNonNegativeInteger(moduleLimit, 0) : Number.POSITIVE_INFINITY;
			if (maxCalls <= 0) return calls;
			const artifactLib = getLibraryData("artifact");
			const slotOrder = normalizeOrderedValues(settings.artifactSlotOrder, ARTIFACT_SLOT_IDS, ARTIFACT_SLOT_IDS).map(Number);
			getExecutionHeroes(settings, snapshot, settings.artifactHeroIds, settings.artifactHeroOrder, HERO_MANAGER_MODULE_KEY.ARTIFACTS).forEach((hero) => {
				if (calls.length >= maxCalls) return;
				slotOrder.forEach((slotId) => {
					var _ref26, _settings$artifactTar, _settings$artifactTar2, _settings$artifactTar3;
					if (calls.length >= maxCalls) return;
					const artifact = getHeroArtifactRecord(hero.artifacts, slotId);
					if (!(artifact === null || artifact === void 0 ? void 0 : artifact.star)) return;
					let level = Number(artifact.level) || 0;
					const heroIdKey = String(hero.id);
					const targetLevel = resolveHeroManagerTargetLevel(level, 100, (_ref26 = (_settings$artifactTar = (_settings$artifactTar2 = settings.artifactTargets) === null || _settings$artifactTar2 === void 0 || (_settings$artifactTar2 = _settings$artifactTar2[heroIdKey]) === null || _settings$artifactTar2 === void 0 ? void 0 : _settings$artifactTar2[slotId]) !== null && _settings$artifactTar !== void 0 ? _settings$artifactTar : (_settings$artifactTar3 = settings.artifactTargets) === null || _settings$artifactTar3 === void 0 || (_settings$artifactTar3 = _settings$artifactTar3[heroIdKey]) === null || _settings$artifactTar3 === void 0 ? void 0 : _settings$artifactTar3[String(slotId)]) !== null && _ref26 !== void 0 ? _ref26 : getRecordValue(settings.artifactLevelCaps, slotId));
					const type = getArtifactDefinition(getHeroArtifactId(hero.id, slotId, hero.artifacts)).type;
					while (level < targetLevel && calls.length < maxCalls) {
						var _settings$artifactRes, _settings$artifactRes2;
						const cost = parseCost(getArtifactLevelRecord(artifactLib, type, level + 1).cost);
						if (!cost) return;
						const reserve = (_settings$artifactRes = (_settings$artifactRes2 = settings.artifactReserves) === null || _settings$artifactRes2 === void 0 ? void 0 : _settings$artifactRes2[cost.currencyKey]) !== null && _settings$artifactRes !== void 0 ? _settings$artifactRes : 0;
						if (!canSpendCurrency(working, cost.currencyKey, cost.amount, reserve)) return;
						spendCurrency(working, cost.currencyKey, cost.amount);
						level += 1;
						calls.push(createPlannedCall({
							name: "heroArtifactLevelUp",
							args: {
								heroId: Number(hero.id),
								slotId
							},
							ident: `hwhhm_artifact_${hero.id}_${slotId}_${level}`
						}, {
							module: "artifacts",
							heroId: hero.id,
							action: translate("HWHHM_ARTIFACT_SLOT", { slot: slotId + 1 }),
							from: level - 1,
							to: level,
							spent: [cost]
						}));
					}
				});
			});
			return calls;
		}
		function getAscensionCalls(settings, snapshot, working, moduleLimit = Number.POSITIVE_INFINITY) {
			const ascensionLib = getLibraryData("heroAscension");
			const calls = [];
			const maxCalls = Number.isFinite(Number(moduleLimit)) ? normalizeNonNegativeInteger(moduleLimit, 0) : Number.POSITIVE_INFINITY;
			if (maxCalls <= 0) return calls;
			getExecutionHeroIds(settings, settings.ascensionHeroIds, settings.ascensionHeroOrder, HERO_MANAGER_MODULE_KEY.ASGARD).forEach((heroId) => {
				var _settings$ascensionRa2;
				const hero = getSnapshotHero(snapshot, heroId);
				if (!hero || calls.length >= maxCalls) return;
				const heroConfig = getAscensionHeroConfig(ascensionLib, heroId);
				if (!heroConfig) return;
				const currentMaxRank = getAscensionCurrentMaxRank(hero);
				const configuredRankCap = resolveHeroManagerTargetLevel(currentMaxRank, Math.min(getAscensionMaxRank(heroId), settings.ascensionGlobalRankCap || Number.MAX_SAFE_INTEGER), (_settings$ascensionRa2 = settings.ascensionRankCaps) === null || _settings$ascensionRa2 === void 0 ? void 0 : _settings$ascensionRa2[heroId]);
				getAscensionRankConfigs(heroConfig).forEach((rankConfig) => {
					var _rankConfig$minHeroCo2;
					if (calls.length >= maxCalls) return;
					const rank = Number(rankConfig === null || rankConfig === void 0 ? void 0 : rankConfig.rank);
					const rankCap = Math.max(currentMaxRank, configuredRankCap);
					const nodeIds = Array.isArray(rankConfig === null || rankConfig === void 0 ? void 0 : rankConfig.nodes) ? rankConfig.nodes : [];
					if (!Number.isFinite(rank) || rank > rankCap || !nodeIds.length || (Number(hero.color) || 0) < Number((_rankConfig$minHeroCo2 = rankConfig === null || rankConfig === void 0 ? void 0 : rankConfig.minHeroColor) !== null && _rankConfig$minHeroCo2 !== void 0 ? _rankConfig$minHeroCo2 : 0)) return;
					const graph = getAscensionRankGraph(heroConfig, rank);
					const nodeParents = Array.isArray(graph === null || graph === void 0 ? void 0 : graph.nodeParents) ? graph.nodeParents : [];
					const unlockedSet = cloneUnlockedAscensionSet(hero, rank);
					let hasProgress = true;
					while (hasProgress && calls.length < maxCalls) {
						hasProgress = false;
						const nextNodeIndex = nodeIds.findIndex((_nodeId, nodeIndex) => {
							var _nodeParents$nodeInde;
							if (unlockedSet.has(nodeIndex)) return false;
							const parentIndex = Number((_nodeParents$nodeInde = nodeParents[nodeIndex]) !== null && _nodeParents$nodeInde !== void 0 ? _nodeParents$nodeInde : -1);
							return parentIndex < 0 || unlockedSet.has(parentIndex);
						});
						if (nextNodeIndex < 0) return;
						const nodeId = Number(nodeIds[nextNodeIndex]);
						const node = getAscensionNodeConfig(ascensionLib, nodeId);
						if (!node || node.isEmptySkillNode) {
							unlockedSet.add(nextNodeIndex);
							hasProgress = true;
							continue;
						}
						const costs = getAscensionCost(node);
						if (!costs.length) {
							unlockedSet.add(nextNodeIndex);
							hasProgress = true;
							continue;
						}
						if (!costs.every((cost) => {
							var _settings$ascensionRe, _settings$ascensionRe2;
							return canSpendCurrency(working, cost.currencyKey, cost.amount, (_settings$ascensionRe = (_settings$ascensionRe2 = settings.ascensionResourceReserves) === null || _settings$ascensionRe2 === void 0 ? void 0 : _settings$ascensionRe2[cost.currencyKey]) !== null && _settings$ascensionRe !== void 0 ? _settings$ascensionRe : 0);
						})) continue;
						costs.forEach((cost) => spendCurrency(working, cost.currencyKey, cost.amount));
						calls.push(createPlannedCall({
							name: "heroAscension_unlock",
							args: {
								heroId: Number(heroId),
								nodeIndex: nextNodeIndex,
								ascensionRank: rank
							},
							ident: `hwhhm_ascension_${heroId}_${rank}_${nextNodeIndex}`
						}, {
							module: "asgard",
							heroId,
							action: `${translate("HWHHM_SECTION_ASGARD")} ${rank}.${nextNodeIndex + 1}`,
							to: `${rank}.${nextNodeIndex + 1}`,
							spent: costs
						}));
						unlockedSet.add(nextNodeIndex);
						hasProgress = true;
					}
				});
			});
			return calls;
		}
		function getModuleRunLimits(settings, options = {}) {
			if (options.moduleLevelLimits && typeof options.moduleLevelLimits === "object") return normalizeUpgradeLevelLimits(options.moduleLevelLimits);
			if (settings.upgradeMode !== "levels") return null;
			return normalizeUpgradeLevelLimits(settings.upgradeLevelLimits);
		}
		async function runHeroManager(settings, options = {}) {
			heroManagerProgress.loading(translate("HWHHM_RUNNING"));
			const normalizedSettings = normalizeSettings(settings);
			const enabledModuleSet = new Set(options.actionTypes === void 0 ? HERO_MANAGER_MODULE_KEYS : normalizeHeroManagerActionTypes(options.actionTypes, []));
			const moduleLimits = getModuleRunLimits(normalizedSettings, options);
			let snapshot = await fetchHeroManagerSnapshot(Caller);
			const getModuleLimit = (moduleKey) => moduleLimits ? moduleLimits[moduleKey] : Number.POSITIVE_INFINITY;
			let working = createHeroManagerWorkingState(snapshot);
			const skinChestCalls = enabledModuleSet.has(HERO_MANAGER_MODULE_KEY.SKINS) ? planSkinChestCalls(normalizedSettings, snapshot, working) : [];
			const skinChestResults = [];
			if (skinChestCalls.length > 0) {
				heroManagerProgress.batching(skinChestCalls.length, translate("HWHHM_RUNNING"));
				skinChestResults.push(...await sendCallsInChunks(skinChestCalls, void 0, heroManagerProgress.chunk(skinChestCalls)));
				try {
					snapshot = await fetchHeroManagerSnapshot(Caller);
					working = createHeroManagerWorkingState(snapshot);
				} catch (error) {
					console.warn("[HeroManager] Не удалось обновить снимок после вскрытия сундуков обликов.", error);
					working = createHeroManagerWorkingState(snapshot);
				}
			}
			const groups = {
				skills: enabledModuleSet.has("skills") ? getSkillUpgradeCalls(normalizedSettings, snapshot, working, getModuleLimit("skills")) : [],
				evolutions: enabledModuleSet.has("evolutions") ? getEvolutionCalls(normalizedSettings, snapshot, working, getModuleLimit("evolutions")) : [],
				skins: enabledModuleSet.has("skins") ? getSkinUpgradeCalls(normalizedSettings, snapshot, working, getModuleLimit("skins")) : [],
				runes: enabledModuleSet.has("runes") ? getRuneUpgradeCalls(normalizedSettings, snapshot, working, getModuleLimit("runes")) : [],
				gifts: enabledModuleSet.has("gifts") ? getTitanGiftCalls(normalizedSettings, snapshot, working, getModuleLimit("gifts")) : [],
				artifacts: enabledModuleSet.has("artifacts") ? getArtifactUpgradeCalls(normalizedSettings, snapshot, working, getModuleLimit("artifacts")) : [],
				asgard: enabledModuleSet.has("asgard") ? getAscensionCalls(normalizedSettings, snapshot, working, getModuleLimit("asgard")) : []
			};
			const upgradeCalls = HERO_MANAGER_MODULE_KEYS.flatMap((moduleKey) => {
				var _groups$moduleKey;
				return (_groups$moduleKey = groups[moduleKey]) !== null && _groups$moduleKey !== void 0 ? _groups$moduleKey : [];
			});
			const allCalls = [...skinChestCalls, ...upgradeCalls];
			if (allCalls.length <= 0) {
				showResult(buildIconLabel("check", translate("HWHHM_NOTHING")));
				return snapshot;
			}
			const results = [...skinChestResults];
			if (upgradeCalls.length > 0) {
				heroManagerProgress.batching(upgradeCalls.length, translate("HWHHM_RUNNING"));
				results.push(...await sendCallsInChunks(upgradeCalls, void 0, heroManagerProgress.chunk(upgradeCalls)));
			}
			heroManagerProgress.applying(results.length);
			const successCount = results.filter(isCallSucceeded).length;
			showResult("", {
				component: RuntimeResultSummary,
				props: buildHeroManagerResult(allCalls, results),
				resultLabel: `${successCount}/${allCalls.length}`
			});
			try {
				return await fetchHeroManagerSnapshot(Caller);
			} catch (error) {
				console.warn("[HeroManager] Не удалось обновить снимок после прокачки, оставляю предыдущий.", error);
				return snapshot;
			}
		}
		function createSettingsTransfer(settings) {
			return createHeroManagerSettingsTransferController({
				translate,
				getScriptInfo: () => userscriptInfo,
				readSettings,
				writeSettings,
				uiTheme: normalizeSettings(settings).uiTheme,
				showNotice: (message, { phase }) => showResult(buildIconLabel(phase === "export" ? "download" : "upload", message))
			});
		}
		async function exportSettings(settings) {
			await createSettingsTransfer(settings).exportToJson(settings);
		}
		async function importSettings() {
			return createSettingsTransfer(readSettings()).importFromJson();
		}
		async function requestUpgradeLevelLimits(settings) {
			initializeRuntimeUi();
			const limits = normalizeUpgradeLevelLimits(settings.upgradeLevelLimits);
			if (await openRuntimeComponentModal({
				title: translate("HWHHM_LEVEL_LIMIT_TITLE"),
				header: buildHeroManagerModalHeader(),
				component: RuntimeLevelLimitsPanel,
				props: {
					limits,
					modules: HERO_MANAGER_MODULE_KEYS.map((moduleKey) => {
						const config = getResultModuleConfig(moduleKey);
						return {
							key: moduleKey,
							label: config.label,
							icon: config.icon
						};
					}),
					translate
				},
				actions: [{
					label: translate("HWHHM_LEVEL_LIMIT_CANCEL"),
					result: "cancel",
					icon: "x",
					tone: "danger"
				}, {
					label: translate("HWHHM_LEVEL_LIMIT_RUN"),
					result: "run",
					icon: "play",
					tone: "primary"
				}],
				className: "hwhx-popup--compact",
				uiTheme: normalizeUiTheme(settings === null || settings === void 0 ? void 0 : settings.uiTheme),
				closeLabel: translate("HWHHM_CLOSE")
			}) !== "run") return null;
			return normalizeUpgradeLevelLimits(limits);
		}
		function registerDoYourBestHeroManagerTask() {
			var _doYourBestInstance$f, _doYourBestInstance$f2;
			const DoYourBestCtor = getHeroWarsDoYourBestClass(HWHClasses);
			if (!DoYourBestCtor) return;
			const RootDoYourBestClass = getDoYourBestRootBaseClass(DoYourBestCtor);
			const doYourBestInstance = new DoYourBestCtor();
			const currentTaskList = Array.isArray(doYourBestInstance.funcList) ? doYourBestInstance.funcList.filter(Boolean) : [];
			const existingTask = currentTaskList.find(isHeroManagerDoYourBestTask);
			const baseTaskList = currentTaskList.filter((task) => !isHeroManagerDoYourBestTask(task));
			const settings = readSettings();
			const actionTypes = normalizeHeroManagerActionTypes(settings.doYourBestActionTypes, []);
			const checklistTask = {
				name: DO_YOUR_BEST_TASK_NAME,
				label: translate("HWHHM_DO_YOUR_BEST"),
				checked: !!(existingTask === null || existingTask === void 0 ? void 0 : existingTask.checked) && actionTypes.length > 0
			};
			if (settings.doYourBestPlacement !== "none") {
				const insertionIndex = getDoYourBestInsertionIndex(baseTaskList, settings.doYourBestPlacement);
				baseTaskList.splice(insertionIndex, 0, checklistTask);
			}
			const currentFunctions = {
				...(_doYourBestInstance$f = doYourBestInstance.functions) !== null && _doYourBestInstance$f !== void 0 ? _doYourBestInstance$f : {},
				[DO_YOUR_BEST_TASK_NAME]: async () => {
					const storedSettings = readSettings();
					const storedActionTypes = normalizeHeroManagerActionTypes(storedSettings.doYourBestActionTypes, []);
					if (storedActionTypes.length <= 0) return;
					await runHeroManager(storedSettings, {
						source: "checklist",
						actionTypes: storedActionTypes
					});
				}
			};
			const buildTaskSignature = (taskList) => taskList.map((task) => `${getDoYourBestTaskName(task)}:${task.checked ? "1" : "0"}`).join("");
			const currentTaskOrder = buildTaskSignature(currentTaskList);
			const nextTaskOrder = buildTaskSignature(baseTaskList);
			const handlerPresent = typeof ((_doYourBestInstance$f2 = doYourBestInstance.functions) === null || _doYourBestInstance$f2 === void 0 ? void 0 : _doYourBestInstance$f2[DO_YOUR_BEST_TASK_NAME]) === "function";
			if (currentTaskOrder === nextTaskOrder && handlerPresent) return;
			class HeroManagerDoYourBestExtension extends RootDoYourBestClass {
				constructor(...args) {
					super(...args);
					this.funcList = baseTaskList.map((task) => ({ ...task }));
					this.functions = { ...currentFunctions };
				}
			}
			HWHClasses.doYourBest = HeroManagerDoYourBestExtension;
		}
		async function openHeroManagerMenuVue() {
			const snapshotResultPromise = fetchHeroManagerSnapshot(Caller).then((snapshot) => ({
				snapshot,
				error: null
			}), (error) => ({
				snapshot: null,
				error
			}));
			initializeRuntimeUi();
			const store = useHeroManagerSettingsStore();
			await store.load();
			configureProgress(store.state);
			const snapshot = createRuntimeShallowReactiveState({
				heroes: {},
				inventory: {},
				userInfo: {},
				shops: {}
			});
			const modules = createRuntimeShallowReactiveState([]);
			const applySnapshot = (loadedSnapshot) => {
				Object.assign(snapshot, loadedSnapshot);
				const heroes = getOwnedHeroes(snapshot.heroes);
				modules.splice(0, modules.length, buildSkillsSettingsModule(heroes, store.state, snapshot.userInfo), buildEvolutionSettingsModule(heroes, store.state, snapshot), buildSkinsSettingsModule(heroes, store.state, snapshot), buildRunesSettingsModule(heroes, store.state, snapshot), buildTitanGiftSettingsModule(heroes, store.state, snapshot), buildArtifactsSettingsModule(heroes, store.state, snapshot), buildAsgardSettingsModule(heroes, store.state, snapshot));
			};
			snapshotResultPromise.then(({ snapshot: loadedSnapshot, error }) => {
				if (loadedSnapshot) {
					applySnapshot(loadedSnapshot);
					return;
				}
				console.error("[HeroManager] snapshot failed", error);
				showResult(buildIconLabel("alert-triangle", getErrorMessage(error, translate("HWHHM_ERROR_GENERIC")), "hwhx-danger"));
			});
			const syncStoreStateFromHybridPopup = () => {
				replaceSettingsState(store.state, normalizeSettings(store.state));
			};
			const doYourBestOptions = buildDoYourBestPlacementOptionsFromTasks(getDoYourBestTaskListSnapshot().filter((task) => !isHeroManagerDoYourBestTask(task))).map((option) => {
				var _option$label;
				return {
					value: option.value,
					label: String((_option$label = option.label) !== null && _option$label !== void 0 ? _option$label : option.value)
				};
			});
			while (true) {
				const result = await openRuntimeComponentModal({
					title: translate("HWHHM_TITLE"),
					header: buildHeroManagerModalHeader(),
					headerActions: buildHeroManagerSettingsHeaderActions(translate),
					component: RuntimeSettingsPanel,
					props: {
						state: store.state,
						translate,
						modules,
						doYourBestOptions,
						...gameIconResolvers
					},
					actions: buildHeroManagerSettingsModalActions(translate),
					kind: "hero-manager",
					className: "hwhx-popup--xwide hwhx-modal--settings hwhx-modal--workspace hwhx-modal--hero-manager",
					uiTheme: store.state.uiTheme,
					onBeforeClose: (result) => {
						if (result === "save" || result === "run" || result === "exportSettings") syncStoreStateFromHybridPopup();
					},
					onAction: async (actionResult) => {
						if (actionResult === "exportSettings") {
							syncStoreStateFromHybridPopup();
							await exportSettings(store.state);
							return;
						}
						if (actionResult === "dumpGameLibrary") dumpGameLibraryToConsole("hwhheromanager");
					},
					closeLabel: translate("HWHHM_CLOSE")
				});
				if (!result) return;
				if (result === "exportSettings") {
					await exportSettings(store.state);
					continue;
				}
				if (result === "donate") {
					await openHeroManagerDonateModal(translate, store.state.uiTheme);
					continue;
				}
				if (result === "help") {
					await openHeroManagerDocumentationModal(translate, store.state.uiTheme);
					continue;
				}
				if (result === "dumpGameLibrary") {
					dumpGameLibraryToConsole("hwhheromanager");
					continue;
				}
				if (result === "importSettings") {
					try {
						if (await importSettings()) await store.load({
							force: true,
							preferSource: true
						});
					} catch (error) {
						console.error("[HeroManager] import failed", error);
						showResult(buildIconLabel("alert-triangle", getErrorMessage(error, translate("HWHHM_ERROR_GENERIC")), "hwhx-danger"));
					}
					continue;
				}
				if (result !== "save" && result !== "run") continue;
				await store.save();
				configureProgress(store.state);
				if (result === "save") {
					syncHeroManagerActionPlacement(store.state);
					registerDoYourBestHeroManagerTask();
					showResult(buildIconLabel("save", translate("HWHHM_SETTINGS_SAVED")));
					return;
				}
				if (result === "run") {
					syncHeroManagerActionPlacement(store.state);
					registerDoYourBestHeroManagerTask();
					const runOptions = {};
					if (store.state.upgradeMode === "levels") {
						const moduleLevelLimits = await requestUpgradeLevelLimits(store.state);
						if (!moduleLevelLimits) continue;
						store.state.upgradeLevelLimits = moduleLevelLimits;
						await store.save();
						runOptions.moduleLevelLimits = moduleLevelLimits;
					}
					applySnapshot(await runHeroManager(store.state, runOptions));
					continue;
				}
			}
		}
		async function openHeroManagerSafely() {
			try {
				await openHeroManagerMenuVue();
			} catch (error) {
				console.error("[HeroManager] Error:", error);
				setProgress(`${escapeHtml(translate("HWHHM_ERROR_GENERIC"))}<br>${escapeHtml(getErrorMessage(error))}`, true);
			}
		}
		const heroManagerMenuButtonFactory = createScriptMenuButtonFactory({
			actionKey: ACTION_KEY,
			color: "pink",
			icon: "users",
			getLabel: () => translate("HWHHM_BUTTON"),
			getTitle: () => translate("HWHHM_BUTTON_TITLE"),
			onClick: openHeroManagerSafely,
			buildIconLabel
		});
		function createHeroManagerMainButton() {
			return heroManagerMenuButtonFactory.createMainButton();
		}
		function createHeroManagerOtherButton() {
			return heroManagerMenuButtonFactory.createOtherButton();
		}
		function syncHeroManagerActionPlacement(settings = void 0) {
			syncStoredScriptMenuActionPlacement({
				HWHData,
				mainMenuButtons,
				othersPopupButtons,
				settings,
				settingsKey: "buttonPlacement",
				readStoredPlacement: () => readSettings().buttonPlacement,
				normalizePlacement: (value) => value === "other" ? BUTTON_PLACEMENT_OTHER : BUTTON_PLACEMENT_MAIN,
				mainKey: "hwhheromanager",
				actionKey: ACTION_KEY,
				createMainButton: createHeroManagerMainButton,
				createOtherButton: createHeroManagerOtherButton,
				mainPlacementValue: BUTTON_PLACEMENT_MAIN,
				otherPlacementValue: BUTTON_PLACEMENT_OTHER
			});
		}
		console.log(`%c${translate("HWHHM_START_LOG", {
			name: userscriptInfo.name,
			author: userscriptInfo.author,
			version: userscriptInfo.version
		})}`, "color: red");
		addExtensionName(userscriptInfo.name, userscriptInfo.version, userscriptInfo.author);
		syncHeroManagerActionPlacement(readSettings());
		registerDoYourBestHeroManagerTask();
	}
	//#endregion
	//#region src/entries/hwhheromanager-lite.user.ts
	initializeHeroManagerExtension(0);
	//#endregion
})();
