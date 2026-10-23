// ==UserScript==
// @name           HWH Rewards Manager Lite
// @name:en        HWH Rewards Manager Lite
// @namespace      http://tampermonkey.net/
// @version        0.1.175-lite.1
// @homepage       https://ext-askja.zingery.ru
// @updateURL      https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhrewards-lite.meta.js
// @downloadURL    https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhrewards-lite.user.js
// @supportURL     https://t.me/+ppLK1qqObB43NjMy
// @description    Облегчённый менеджер выбранных наград HeroWarsHelper без Vue и тяжёлого интерфейса.
// @description:en Lightweight HeroWarsHelper reward selection manager without Vue or a heavy interface.
// @author         Askja
// @match          https://www.hero-wars.com/*
// @match          https://www.hero-wars.cn/*
// @match          https://apps-1701433570146040.apps.fbsbx.com/*
// @icon           https://ext-askja.zingery.ru/script-icons/rewardsManager.webp
// @grant          none
// @license        MIT
// ==/UserScript==
/*
 * Читаемая сборка для GreasyFork: минификация кода и сжатие имён отключены.
 * Встроенные сторонние runtime-библиотеки: отсутствуют.
 */
(function() {
	//#region \0rolldown/runtime.js
	var __esmMin = (fn, res, err) => () => {
		if (err) throw err[0];
		try {
			return fn && (res = fn(fn = 0)), res;
		} catch (e) {
			throw err = [e], e;
		}
	};
	//#endregion
	//#region src/shared/game/live-library.ts
	/**
	* Игра подменяет объект `lib` целиком после загрузки данных: живой замер — кнопки
	* скриптов уже есть, а через ~8 с `globalThis.lib` указывает на новый объект с
	* 9471 уровнем пропусков вместо пустого. Ссылка, взятая при старте, навсегда
	* остаётся пустой. Прокси читает текущий `lib` на каждом обращении.
	*/
	function createLiveGameLibrary(readLibrary = () => globalThis.lib) {
		const current = () => {
			const value = readLibrary();
			return value && typeof value === "object" ? value : {};
		};
		return new Proxy({}, {
			get: (_target, key) => {
				const library = current();
				const value = Reflect.get(library, key);
				return typeof value === "function" ? value.bind(library) : value;
			},
			has: (_target, key) => Reflect.has(current(), key),
			ownKeys: () => Reflect.ownKeys(current()),
			getOwnPropertyDescriptor: (_target, key) => {
				const descriptor = Reflect.getOwnPropertyDescriptor(current(), key);
				return descriptor ? {
					...descriptor,
					configurable: true
				} : void 0;
			}
		});
	}
	/**
	* Ждёт, пока в lib появятся нужные разделы данных. Кнопки скриптов появляются раньше,
	* чем игра загружает конфиг, и снимок, снятый в эту секунду, пуст.
	*/
	async function waitForGameLibrary(sections, { readLibrary = () => globalThis.lib, timeoutMs = 3e4, intervalMs = 250 } = {}) {
		const ready = () => {
			var _readLibrary;
			const data = (_readLibrary = readLibrary()) === null || _readLibrary === void 0 ? void 0 : _readLibrary.data;
			return sections.every((section) => {
				const value = data === null || data === void 0 ? void 0 : data[section];
				return !!value && typeof value === "object" && Object.keys(value).length > 0;
			});
		};
		const deadline = Date.now() + timeoutMs;
		while (!ready()) {
			if (Date.now() >= deadline) return false;
			await new Promise((resolve) => setTimeout(resolve, intervalMs));
		}
		return true;
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
	//#endregion
	//#region src/shared/normalize.ts
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
	function asPlainRecord(value) {
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
	* Nullable-вариант с исключением массивов: «это точно словарь или ничего».
	*/
	function asPlainRecordOrNull(value) {
		return isPlainObject(value) ? value : null;
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
	var HWH_RUNTIME_KEYS = [
		"HWHClasses",
		"HWHFuncs",
		"HWHData"
	];
	var helperInstallNoticeOpen = false;
	function getGlobalValue(key) {
		return globalThis[key];
	}
	function readSafeText(value) {
		if (value == null) return "";
		const text = String(value).trim();
		return text.length > 0 ? text : "";
	}
	function readSafeUrl(value, fallbackUrl = HERO_WARS_HELPER_INSTALL_URL) {
		return normalizeExternalHref(value) || fallbackUrl;
	}
	function readHeroWarsHelperScriptInfo(source = void 0) {
		const scriptInfo = source && typeof source === "object" ? source : getGlobalValue("scriptInfo");
		const info = scriptInfo && typeof scriptInfo === "object" && !Array.isArray(scriptInfo) ? scriptInfo : {};
		return {
			version: readSafeText(info.version),
			author: readSafeText(info.author),
			homepage: readSafeUrl(info.homepage)
		};
	}
	function readHeroWarsHelperRuntimeStatus(requiredKeys = HWH_RUNTIME_KEYS) {
		return {
			available: requiredKeys.every((key) => !!getGlobalValue(key)),
			...readHeroWarsHelperScriptInfo()
		};
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
	//#region src/shared/game/do-your-best.ts
	/** Константа: не добавлять задачу в DoYourBest. */
	var DO_YOUR_BEST_PLACEMENT_NONE = "none";
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
	function normalizeDoYourBestPlacement(value, { allowStart = false, fallbackValue = "end" } = {}) {
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
	* Определяет индекс вставки задачи в список на основе placement.
	*/
	function getDoYourBestInsertionIndex(taskList, placement, { allowStart = false, normalizePlacement = void 0 } = {}) {
		const normalizedPlacement = typeof normalizePlacement === "function" ? normalizePlacement(placement) : normalizeDoYourBestPlacement(placement, { allowStart });
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
			value: DO_YOUR_BEST_PLACEMENT_NONE,
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
	//#region src/shared/game/post-run-sync.ts
	/**
	* Запускает синхронизацию игры через cheats.refreshGame.
	*/
	function runGameSynchronization({ cheats = globalThis.cheats, buildMessage = () => "" } = {}) {
		const refreshGame = cheats === null || cheats === void 0 ? void 0 : cheats.refreshGame;
		if (typeof refreshGame !== "function") return "";
		refreshGame.call(cheats);
		return buildMessage();
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
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/classPrivateFieldInitSpec.js
	function _classPrivateFieldInitSpec(e, t, a) {
		_checkPrivateRedeclaration(e, t), t.set(e, a);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/assertClassBrand.js
	function _assertClassBrand(e, t, n) {
		if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n;
		throw new TypeError("Private element is not present on this object");
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
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	var init_typeof = __esmMin((() => {}));
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
	var init_toPrimitive = __esmMin((() => {
		init_typeof();
	}));
	//#endregion
	//#region \0@oxc-project+runtime@0.139.0/helpers/esm/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	var init_toPropertyKey = __esmMin((() => {
		init_typeof();
		init_toPrimitive();
	}));
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
	var init_defineProperty = __esmMin((() => {
		init_toPropertyKey();
	}));
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
		if (isNativeView(view)) return view.render(asPlainRecord(props), context);
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
	function isNativeModalVisible() {
		return activeModal !== null;
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
		const badges = asPlainRecord(header).badges;
		if (!Array.isArray(badges) || badges.length === 0) return;
		const badgeRoot = document.createElement("div");
		badgeRoot.className = "hwhx-modal__meta";
		for (const value of badges) {
			var _badge$tone, _badge$label;
			const badge = asPlainRecord(value);
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
		const authors = asPlainRecord(header).authors;
		if (!Array.isArray(authors) || authors.length === 0) return;
		const group = document.createElement("div");
		group.className = "hwhx-avatar-group hwhx-modal__authors";
		for (const value of authors) {
			var _author$label, _Array$from$0$toLocal, _Array$from$;
			const author = asPlainRecord(value);
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
		return String((_asPlainRecord$title = asPlainRecord(header).title) !== null && _asPlainRecord$title !== void 0 ? _asPlainRecord$title : "").trim();
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
	* Проверяет готовый import payload перед записью, чтобы мусор не превращался
	* нормализатором в валидные дефолты.
	*/
	async function applyPlainSettingsImportPayload({ payload, normalize, write, invalidMessage = "Invalid settings import payload." }) {
		if (!asPlainRecordOrNull(payload)) throw new Error(String(invalidMessage !== null && invalidMessage !== void 0 ? invalidMessage : "Invalid settings import payload."));
		const normalizedSettings = normalize(payload);
		await write(normalizedSettings);
		return normalizedSettings;
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
	//#region src/shared/game/reward-icons.ts
	/**
	* Скалярная награда — псевдо-предмет lib, но имена расходятся: золото в ответе `gold`,
	* а в lib `COIN` (icon_gold_coin), изумруды — `starmoney`/`STARMONEY`, опыт — `XP`.
	*/
	var PSEUDO_ALIASES = {
		gold: "COIN",
		starmoney: "STARMONEY",
		starmoneypayed: "STARMONEY",
		stamina: "STAMINA",
		experience: "XP",
		xp: "XP"
	};
	function findPseudoItem(data, name) {
		var _PSEUDO_ALIASES$name$;
		const snake = name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
		const wanted = /* @__PURE__ */ new Set([
			((_PSEUDO_ALIASES$name$ = PSEUDO_ALIASES[name.toLowerCase()]) !== null && _PSEUDO_ALIASES$name$ !== void 0 ? _PSEUDO_ALIASES$name$ : name).toUpperCase(),
			snake,
			snake.replace(/S$/, "")
		]);
		const pseudo = asObjectRecord(asObjectRecord(asObjectRecord(data).inventoryItem).pseudo);
		for (const [id, definition] of Object.entries(pseudo)) {
			var _record$constName, _record$id, _record$id2;
			const record = asObjectRecord(definition);
			const constName = String((_record$constName = record.constName) !== null && _record$constName !== void 0 ? _record$constName : "").toUpperCase();
			if (!wanted.has(constName)) continue;
			return {
				itemType: "pseudo",
				itemId: Number((_record$id = record.id) !== null && _record$id !== void 0 ? _record$id : id),
				textures: itemTextures(data, "pseudo", Number((_record$id2 = record.id) !== null && _record$id2 !== void 0 ? _record$id2 : id)),
				constName
			};
		}
		return null;
	}
	function itemTextures(data, itemType, itemId) {
		const record = asObjectRecord(asObjectRecord(asObjectRecord(asObjectRecord(data).inventoryItem)[itemType])[String(itemId)]);
		return [record.iconAssetTexture, record.assetTexture].filter((value) => typeof value === "string" && !!value).map((value) => value.trim());
	}
	//#endregion
	//#region src/scripts/hwhrewards/i18n/translations.generated.ts
	var keys = [
		"HWHREWARDS_BUTTON",
		"HWHREWARDS_BUTTON_TITLE",
		"HWHREWARDS_CANCEL",
		"HWHREWARDS_CATEGORY_ARTIFACTS",
		"HWHREWARDS_CATEGORY_ARTIFACTS_DETAIL",
		"HWHREWARDS_CATEGORY_CONQUEST_BOOSTERS",
		"HWHREWARDS_CATEGORY_CONQUEST_BOOSTERS_DETAIL",
		"HWHREWARDS_CATEGORY_CONSUMABLES",
		"HWHREWARDS_CATEGORY_CONSUMABLES_DETAIL",
		"HWHREWARDS_CATEGORY_COSMETICS",
		"HWHREWARDS_CATEGORY_COSMETICS_DETAIL",
		"HWHREWARDS_CATEGORY_CURRENCY",
		"HWHREWARDS_CATEGORY_CURRENCY_DETAIL",
		"HWHREWARDS_CATEGORY_ENERGY_BOOST",
		"HWHREWARDS_CATEGORY_ENERGY_BOOST_DETAIL",
		"HWHREWARDS_CATEGORY_ENERGY_LARGE",
		"HWHREWARDS_CATEGORY_ENERGY_LARGE_DETAIL",
		"HWHREWARDS_CATEGORY_ENERGY_SMALL",
		"HWHREWARDS_CATEGORY_ENERGY_SMALL_DETAIL",
		"HWHREWARDS_CATEGORY_EQUIPMENT",
		"HWHREWARDS_CATEGORY_EQUIPMENT_DETAIL",
		"HWHREWARDS_CATEGORY_HERO_SOULS",
		"HWHREWARDS_CATEGORY_HERO_SOULS_DETAIL",
		"HWHREWARDS_CATEGORY_PET_SOULS",
		"HWHREWARDS_CATEGORY_PET_SOULS_DETAIL",
		"HWHREWARDS_CATEGORY_PORTAL",
		"HWHREWARDS_CATEGORY_PORTAL_DETAIL",
		"HWHREWARDS_CATEGORY_POWER_TOURNAMENT",
		"HWHREWARDS_CATEGORY_POWER_TOURNAMENT_DETAIL",
		"HWHREWARDS_CATEGORY_PROGRESS",
		"HWHREWARDS_CATEGORY_PROGRESS_DETAIL",
		"HWHREWARDS_CATEGORY_REFILLABLES",
		"HWHREWARDS_CATEGORY_REFILLABLES_DETAIL",
		"HWHREWARDS_CATEGORY_SKINS",
		"HWHREWARDS_CATEGORY_SKINS_DETAIL",
		"HWHREWARDS_CATEGORY_TITAN_SOULS",
		"HWHREWARDS_CATEGORY_TITAN_SOULS_DETAIL",
		"HWHREWARDS_CATEGORY_UNKNOWN",
		"HWHREWARDS_CATEGORY_UNKNOWN_DETAIL",
		"HWHREWARDS_CATEGORY_VIP",
		"HWHREWARDS_CATEGORY_VIP_DETAIL",
		"HWHREWARDS_CLEAR_ALL",
		"HWHREWARDS_CLOSE",
		"HWHREWARDS_COLLECT",
		"HWHREWARDS_CONFIRM_BEFORE_COLLECT",
		"HWHREWARDS_CONFIRM_NOTE",
		"HWHREWARDS_CONFIRM_TITLE",
		"HWHREWARDS_DO_YOUR_BEST_AFTER",
		"HWHREWARDS_DO_YOUR_BEST_BEFORE",
		"HWHREWARDS_DO_YOUR_BEST_END",
		"HWHREWARDS_DO_YOUR_BEST_NONE",
		"HWHREWARDS_DO_YOUR_BEST_POSITION",
		"HWHREWARDS_DO_YOUR_BEST_START",
		"HWHREWARDS_DO_YOUR_BEST_TASK",
		"HWHREWARDS_DOCS_MIRROR",
		"HWHREWARDS_DOCS_PRIMARY",
		"HWHREWARDS_DOCS_TEXT",
		"HWHREWARDS_DOCS_TITLE",
		"HWHREWARDS_DONATE_QR_ALT",
		"HWHREWARDS_DONATE_QR_LABEL",
		"HWHREWARDS_DONATE_TEXT",
		"HWHREWARDS_DONATE_TITLE",
		"HWHREWARDS_DONATE_WALLET",
		"HWHREWARDS_EMPTY",
		"HWHREWARDS_ERROR",
		"HWHREWARDS_EXPIRING_MAIL",
		"HWHREWARDS_EXPIRING_MAIL_DETAIL",
		"HWHREWARDS_EXPIRING_MAIL_HOURS",
		"HWHREWARDS_EXPORT_SETTINGS",
		"HWHREWARDS_HOTKEY_CAPTURE",
		"HWHREWARDS_HOTKEY_CLEAR",
		"HWHREWARDS_HOTKEY_COLLECT",
		"HWHREWARDS_HOTKEY_CONFLICT",
		"HWHREWARDS_HOTKEY_EMPTY",
		"HWHREWARDS_HOTKEY_OPEN_SETTINGS",
		"HWHREWARDS_HOTKEY_RECORDING",
		"HWHREWARDS_IMPORT_SETTINGS",
		"HWHREWARDS_MAX_QUEST_PASSES",
		"HWHREWARDS_NOTHING",
		"HWHREWARDS_PATCH_FAILED",
		"HWHREWARDS_PLAN_NEEDS_CHOICE",
		"HWHREWARDS_PLAN_REQUIREMENT",
		"HWHREWARDS_PLAN_REWARDS",
		"HWHREWARDS_PLAN_SELECTED",
		"HWHREWARDS_PLAN_SKIPPED",
		"HWHREWARDS_PLAN_SOURCE_BATTLE_PASS",
		"HWHREWARDS_PLAN_SOURCE_EVENT_QUEST",
		"HWHREWARDS_PLAN_SOURCE_MAIL",
		"HWHREWARDS_PLAN_SOURCE_PRESTIGE",
		"HWHREWARDS_PLAN_SOURCE_REGULAR_QUEST",
		"HWHREWARDS_PLAN_SOURCE_STAGE_OFFER",
		"HWHREWARDS_PLAN_UNKNOWN",
		"HWHREWARDS_POLICY_HINT",
		"HWHREWARDS_PROGRESS_AUTO_HIDE",
		"HWHREWARDS_PROGRESS_AUTO_HIDE_TIMEOUT",
		"HWHREWARDS_PROGRESS_BOTTOM_RIGHT",
		"HWHREWARDS_PROGRESS_COLLECT",
		"HWHREWARDS_PROGRESS_COMPACT",
		"HWHREWARDS_PROGRESS_DASHBOARD",
		"HWHREWARDS_PROGRESS_DEFAULT",
		"HWHREWARDS_PROGRESS_POSITION",
		"HWHREWARDS_PROGRESS_QUEST_PASS",
		"HWHREWARDS_PROGRESS_SCAN",
		"HWHREWARDS_PROGRESS_STYLE",
		"HWHREWARDS_PROGRESS_TOP_CENTER",
		"HWHREWARDS_PROGRESS_TOP_RIGHT",
		"HWHREWARDS_RESULT",
		"HWHREWARDS_SAVE",
		"HWHREWARDS_SAVE_AND_RUN",
		"HWHREWARDS_SEARCH",
		"HWHREWARDS_SELECT_ALL",
		"HWHREWARDS_SETTINGS_AUTOMATION",
		"HWHREWARDS_SETTINGS_BEHAVIOR",
		"HWHREWARDS_SETTINGS_BUTTON",
		"HWHREWARDS_SETTINGS_EVENT_POLICY",
		"HWHREWARDS_SETTINGS_EXPORT_DONE",
		"HWHREWARDS_SETTINGS_IMPORT_DONE",
		"HWHREWARDS_SETTINGS_IMPORT_INVALID",
		"HWHREWARDS_SETTINGS_IMPORT_PARSE_ERROR",
		"HWHREWARDS_SETTINGS_INTRO",
		"HWHREWARDS_SETTINGS_MAIL_POLICY",
		"HWHREWARDS_SETTINGS_PROGRESS",
		"HWHREWARDS_SETTINGS_QUEST_POLICY",
		"HWHREWARDS_SETTINGS_SAVED",
		"HWHREWARDS_SETTINGS_SOURCES",
		"HWHREWARDS_SETTINGS_TITLE",
		"HWHREWARDS_SOURCE_BATTLE_PASS",
		"HWHREWARDS_SOURCE_BATTLE_PASS_DETAIL",
		"HWHREWARDS_SOURCE_EVENT_QUESTS",
		"HWHREWARDS_SOURCE_EVENT_QUESTS_DETAIL",
		"HWHREWARDS_SOURCE_MAIL",
		"HWHREWARDS_SOURCE_MAIL_DETAIL",
		"HWHREWARDS_SOURCE_PRESTIGE",
		"HWHREWARDS_SOURCE_PRESTIGE_DETAIL",
		"HWHREWARDS_SOURCE_REGULAR_QUESTS",
		"HWHREWARDS_SOURCE_REGULAR_QUESTS_DETAIL",
		"HWHREWARDS_SOURCE_STAGE_OFFERS",
		"HWHREWARDS_SOURCE_STAGE_OFFERS_DETAIL",
		"HWHREWARDS_START_LOG",
		"HWHREWARDS_STATUS_NOTHING",
		"HWHREWARDS_SYNC_AFTER_COLLECT",
		"HWHREWARDS_THEME",
		"HWHREWARDS_TRANSFER_CLEAR_ALL",
		"HWHREWARDS_TRANSFER_CLEAR_SEARCH",
		"HWHREWARDS_TRANSFER_EMPTY",
		"HWHREWARDS_TRANSFER_FILE_LABEL",
		"HWHREWARDS_TRANSFER_SEARCH",
		"HWHREWARDS_TRANSFER_SELECT_ALL",
		"HWHREWARDS_TRANSFER_SETTINGS",
		"HWHREWARDS_TRANSFER_SETTINGS_TITLE",
		"HWHREWARDS_TRANSFER_SORT",
		"HWHREWARDS_TRANSFER_SORT_ASC",
		"HWHREWARDS_TRANSFER_SORT_BY_NAME",
		"HWHREWARDS_TRANSFER_SORT_DESC",
		"HWHREWARDS_TRANSFER_SORT_SELECTED"
	];
	var rewardsManagerI18nGenerated = Object.fromEntries(Object.entries({
		de: [
			"Belohnungen",
			"Nur die im HWH Rewards Manager erlaubten Belohnungen einsammeln",
			"Abbrechen",
			"Artefaktressourcen",
			"Helden- und Titanenartefaktfragmente, einschließlich fragmentArtifact und fragmentTitanArtifact.",
			"GdE-Booster und Heilung",
			"Die Verbrauchsgegenstände 401, 470, 494 und 495 für das Gebiet der Eroberung.",
			"Gewöhnliche Verbrauchsgegenstände",
			"Alle Verbrauchsgegenstände außer den separat gesteuerten Gebiet-der-Eroberung-Boostern.",
			"Kosmetik",
			"Avatare, Rahmen, Sticker, Gildenbanner und Bannersteine.",
			"Währungen",
			"Gold, Münzen und starmoney. Währungspakete bleiben unteilbar.",
			"Beschleunigte Energieregeneration",
			"Belohnungen mit dem Feld buff.",
			"Energie über 60",
			"Große Energiemengen, die für später aufgehoben werden können.",
			"Energie bis einschließlich 60",
			"Kleine Energiemengen, die Goodwin normalerweise ebenfalls einsammelt.",
			"Ausrüstungsgegenstände",
			"Ausrüstung, Schriftrollen und deren Fragmente: gear, scroll, fragmentGear, fragmentScroll.",
			"Heldenseelen und -pakete",
			"fragmentHero und bundleHeroReward. Haustier- und Titanenseelen werden separat gesteuert.",
			"Haustierseelen",
			"fragmentPet und kompatible Schlüssel für Haustierseelensteine.",
			"Portalladungen",
			"Auffüllbare Ressource refillable[45].",
			"Punkte des Turniers der Macht",
			"Belohnungen mit powerTournamentCoins.",
			"Erfahrung und Fortschritt",
			"Erfahrung, Aktivität, Battle Pass, Prestige und technische Fortschrittsressourcen.",
			"Auffüllbare Ressourcen",
			"Alle auffüllbaren Ressourcen außer den separat gesteuerten Portalladungen.",
			"Skin-Ressourcen",
			"In fragmentSkin gespeicherte Skin-Ressourcen.",
			"Titanenseelen",
			"Titanenfragmente in fragmentTitan.",
			"Unbekannte Belohnungstypen",
			"Neue oder leere Belohnungen, deren Vertrag das Skript noch nicht kennt. Aktivierung auf eigenes Risiko.",
			"VIP-Punkte",
			"Belohnungen mit vipPoints.",
			"Alles sperren",
			"Schließen",
			"Einsammeln",
			"Plan vor dem Einsammeln anzeigen",
			"Statusändernde Anfragen werden niemals automatisch wiederholt. Prüfe den Plan vor dem Einsammeln.",
			"Plan zum Einsammeln der Belohnungen",
			"Nachher: {label}",
			"Vorher: {label}",
			"Am Boden",
			"Nicht hinzufügen",
			"Position in Do Everything",
			"Oben",
			"Sammle Belohnungen mit HWH Rewards Manager",
			"Dokumentationsspiegel {number}",
			"Projektdokumentation",
			"Anleitung, Filterverhalten und aktuelle Builds des HWH Rewards Manager.",
			"Dokumentation",
			"QR-Code zur Unterstützung des HWH Rewards Manager",
			"QR-Code scannen",
			"Wenn der Manager eine Belohnung und ein paar Nervenzellen gerettet hat, kannst du das Projekt unterstützen.",
			"Projekt unterstützen",
			"Wallet: {wallet}",
			"Nichts gefunden",
			"Das Einsammeln der Belohnungen ist fehlgeschlagen: {message}",
			"Ablaufende Briefe trotz Filter einsammeln",
			"Expliziter Notfallmodus: Ein bald ablaufender Brief wird vollständig abgeholt, auch wenn er deaktivierte Ressourcen enthält.",
			"Ablaufschwelle in Stunden",
			"Einstellungen exportieren",
			"Aufzeichnungsabkürzung",
			"Klare Abkürzung",
			"Prämien sammeln",
			"Shortcut ist bereits zugewiesen",
			"Nicht zugeteilt",
			"Offene Einstellungen",
			"Drücken Sie eine Abkürzung",
			"Einstellungen importieren",
			"Maximale Durchläufe verketteter Aufgaben",
			"Mit den aktuellen Filtern gibt es nichts einzusammeln.",
			"Die HeroWarsHelper-Schaltfläche konnte nicht ersetzt werden. Der Laufzeitvertrag des Helpers hat sich möglicherweise geändert.",
			"Pass-Stufen mit Belohnungsauswahl: {count}. Hole sie im Pass-Fenster ab.",
			"Pass-Aufgaben, die der Server nicht auszahlt (Ticket oder Stufe nötig oder Pass beendet): {count}.",
			"Du erhältst",
			"Wird eingesammelt: {count}",
			"Bleibt liegen: {count}",
			"Saisonpfade",
			"Event-Aufgaben",
			"Briefe",
			"Prestige",
			"Reguläre Aufgaben",
			"Angebotsstufen",
			"Neue Belohnungstypen sind vorerst gesperrt: {keys}. Aktiviere die Kategorie „Unbekannte Belohnungstypen“, um sie einzusammeln.",
			"Ausgewählte Typen sind erlaubt. Ein gemischtes Paket wird nur eingesammelt, wenn alle enthaltenen Typen erlaubt sind.",
			"Ergebnis automatisch ausblenden",
			"Verzögerung bis zum Ausblenden, ms",
			"Unten rechts",
			"Belohnungen werden eingesammelt: {current}/{total}",
			"Kompakt",
			"Übersicht",
			"Standard",
			"Fensterposition",
			"Aufgabenketten werden geprüft: Durchlauf {pass}",
			"Verfügbare Belohnungen werden gelesen…",
			"Fensterstil",
			"Oben mittig",
			"Oben rechts",
			"Eingesammelt: {collected}; durch Filter übersprungen: {skipped}; Fehler: {failed}.",
			"Speichern",
			"Einsammeln",
			"Belohnungstyp suchen",
			"Alles erlauben",
			"Automatisierung",
			"Verhalten und Sicherheit",
			"Belohnungseinstellungen",
			"In Events erlaubt",
			"Einstellungen exportiert.",
			"Einstellungen importiert.",
			"Dies ist kein Export des HWH Rewards Manager oder er enthält keine Einstellungen.",
			"Die Einstellungs-JSON ist beschädigt.",
			"Der Filter prüft das gesamte Belohnungspaket. Enthält es auch nur einen deaktivierten Typ, bleibt das komplette Paket unangetastet.",
			"In Briefen erlaubt",
			"Informationsfenster",
			"In regulären Aufgaben erlaubt",
			"Belohnungseinstellungen gespeichert.",
			"Quellen",
			"HWH Rewards Manager",
			"Saisonpfade",
			"Verfügbare kostenlose und gekaufte Battle-Pass-Belohnungen.",
			"Event-Aufgaben",
			"Special, Battle Pass, Invasionen und Saisonketten.",
			"Post",
			"Briefe aus mailGetAll → mailFarm.",
			"Gildenprestige",
			"Verfügbare Stufen des Prestigepfads.",
			"Reguläre Aufgaben",
			"Tägliche, wöchentliche, Gilden- und gewöhnliche Aufgaben.",
			"Kostenlose Angebotsstufen",
			"Nur aufeinanderfolgende kostenlose Stufen vor der ersten kostenpflichtigen Stufe.",
			"{name} v{version} wurde mit HeroWarsHelper verbunden.",
			"Nichts einzusammeln",
			"Spiel nach dem Einsammeln synchronisieren",
			"Oberflächenthema",
			"Auswahl aufheben",
			"Suche löschen",
			"Keine passenden Blöcke",
			"JSON-Einstellungsdatei",
			"Block suchen",
			"Alles auswählen",
			"Einstellungen des Belohnungsmanagers",
			"Quellen, Filter, Verhalten, Thema und Informationsfenster.",
			"Sortierung",
			"Aufsteigend",
			"Nach Name",
			"Absteigend",
			"Ausgewählte zuerst"
		],
		es: [
			"Recompensas",
			"Recoger solo las recompensas permitidas por HWH Rewards Manager",
			"Cancelar",
			"Recursos de artefactos",
			"Fragmentos de artefactos de héroes y titanes, incluidos fragmentArtifact y fragmentTitanArtifact.",
			"Potenciadores y curación de AdC",
			"Consumibles 401, 470, 494 y 495 usados en Área de Conquista.",
			"Consumibles normales",
			"Todos los consumibles salvo los potenciadores de Área de Conquista controlados por separado.",
			"Cosméticos",
			"Avatares, marcos, pegatinas, estandartes del gremio y piedras de estandarte.",
			"Monedas",
			"Oro, monedas y starmoney. Los lotes de moneda siguen siendo indivisibles.",
			"Aceleración de regeneración de energía",
			"Recompensas que contienen el campo buff.",
			"Energía superior a 60",
			"Grandes cantidades de energía que pueden guardarse para más tarde.",
			"Energía hasta 60 inclusive",
			"Pequeñas cantidades de energía que Goodwin también suele recoger.",
			"Objetos de equipo",
			"Equipo, pergaminos y sus fragmentos: gear, scroll, fragmentGear, fragmentScroll.",
			"Almas y lotes de héroes",
			"fragmentHero y bundleHeroReward. Las almas de mascotas y titanes se controlan por separado.",
			"Almas de mascotas",
			"fragmentPet y claves compatibles de piedras de alma de mascotas.",
			"Cargas de portal",
			"Recurso recargable refillable[45].",
			"Puntos del Torneo de Poder",
			"Recompensas que contienen powerTournamentCoins.",
			"Experiencia y progreso",
			"Experiencia, actividad, Battle Pass, prestigio y recursos técnicos de progreso.",
			"Recursos recargables",
			"Todos los recursos recargables salvo las cargas de portal controladas por separado.",
			"Recursos de aspectos",
			"Recursos de aspectos almacenados en fragmentSkin.",
			"Almas de titanes",
			"Fragmentos de titán en fragmentTitan.",
			"Tipos de recompensa desconocidos",
			"Recompensas nuevas o vacías cuyo contrato aún desconoce el script. Actívalas bajo tu responsabilidad.",
			"Puntos VIP",
			"Recompensas que contienen vipPoints.",
			"Bloquear todo",
			"Cerrar",
			"Recoger",
			"Mostrar el plan antes de recoger",
			"Las solicitudes que cambian el estado nunca se reintentan automáticamente. Revisa el plan antes de recoger.",
			"Plan de recogida de recompensas",
			"Después: {label}",
			"Antes: {label}",
			"En la parte inferior",
			"No añadir",
			"Posición en hacer todo",
			"En la parte superior",
			"Recoger recompensas con HWH Rewards Manager",
			"Espejo de documentación {number}",
			"Documentación del proyecto",
			"Guía, comportamiento del filtro y versiones actuales de HWH Rewards Manager.",
			"Documentación",
			"Código QR de apoyo a HWH Rewards Manager",
			"Escanear el código QR",
			"Si el gestor salvó una recompensa y unas cuantas neuronas, puedes apoyar el proyecto.",
			"Apoyar el proyecto",
			"Cartera: {wallet}",
			"No se encontró nada",
			"La recogida de recompensas falló: {message}",
			"Recoger correo próximo a caducar pese a los filtros",
			"Modo de emergencia explícito: una carta próxima a caducar se reclama completa aunque contenga recursos desactivados.",
			"Umbral de caducidad, horas",
			"Exportar ajustes",
			"Ataque de grabación",
			"Ataque claro",
			"Recoger recompensas",
			"El acceso directo ya está asignado",
			"No asignado",
			"Configuración abierta",
			"Presiona un atajo",
			"Importar ajustes",
			"Máximo de pasadas por cadenas de misiones",
			"No hay nada que recoger con los filtros actuales.",
			"No se pudo sustituir el botón de HeroWarsHelper. Es posible que haya cambiado el contrato de ejecución de Helper.",
			"Niveles del pase con recompensa a elegir: {count}. Recógelos en la ventana del pase.",
			"Tareas del pase que el servidor no pagará (se necesita ticket o nivel, o el pase terminó): {count}.",
			"Recibirás",
			"Se recogerán: {count}",
			"Quedarán: {count}",
			"Rutas de temporada",
			"Misiones de evento",
			"Cartas",
			"Prestigio",
			"Misiones normales",
			"Etapas de ofertas",
			"Los nuevos tipos de recompensa están bloqueados por ahora: {keys}. Activa la categoría «Tipos de recompensa desconocidos» para recogerlos.",
			"Los tipos seleccionados están permitidos. Un lote mixto solo se recoge cuando todos sus tipos están permitidos.",
			"Ocultar el resultado automáticamente",
			"Retraso para ocultar, ms",
			"Abajo a la derecha",
			"Recogiendo recompensas: {current}/{total}",
			"Compacta",
			"Panel",
			"Normal",
			"Posición de la ventana",
			"Comprobando cadenas de misiones: pasada {pass}",
			"Leyendo recompensas disponibles…",
			"Estilo de la ventana",
			"Arriba, centrada",
			"Arriba a la derecha",
			"Recogidas: {collected}; omitidas por los filtros: {skipped}; errores: {failed}.",
			"Guardar",
			"Recoger",
			"Buscar tipo de recompensa",
			"Permitir todo",
			"Automatización",
			"Comportamiento y seguridad",
			"Ajustes de recompensas",
			"Permitido en eventos",
			"Ajustes exportados.",
			"Ajustes importados.",
			"Esto no es una exportación de HWH Rewards Manager o no contiene ajustes.",
			"El JSON de ajustes está dañado.",
			"El filtro evalúa el lote de recompensa completo. Si contiene un solo tipo desactivado, el lote entero queda sin reclamar.",
			"Permitido en el correo",
			"Ventana de información",
			"Permitido en misiones normales",
			"Ajustes de recompensas guardados.",
			"Fuentes",
			"HWH Rewards Manager",
			"Rutas de temporada",
			"Recompensas disponibles, gratuitas y compradas, del Battle Pass.",
			"Misiones de evento",
			"Special, Battle Pass, invasiones y cadenas de temporada.",
			"Correo",
			"Cartas de mailGetAll → mailFarm.",
			"Prestigio del gremio",
			"Niveles disponibles de la ruta de prestigio.",
			"Misiones normales",
			"Misiones diarias, semanales, de gremio y ordinarias.",
			"Etapas gratuitas de ofertas",
			"Solo etapas gratuitas consecutivas antes de la primera etapa de pago.",
			"{name} v{version} se conectó a HeroWarsHelper.",
			"Nada que recoger",
			"Sincronizar el juego después de recoger",
			"Tema de la interfaz",
			"Quitar selección",
			"Borrar búsqueda",
			"No hay bloques coincidentes",
			"Archivo JSON de ajustes",
			"Buscar un bloque",
			"Seleccionar todo",
			"Ajustes del gestor de recompensas",
			"Fuentes, filtros, comportamiento, tema y ventana de información.",
			"Orden",
			"Ascendente",
			"Por nombre",
			"Descendente",
			"Seleccionados primero"
		],
		fr: [
			"Récompenses",
			"Récupérer uniquement les récompenses autorisées par HWH Rewards Manager",
			"Annuler",
			"Ressources d'artefacts",
			"Fragments d'artefacts de héros et de titans, dont fragmentArtifact et fragmentTitanArtifact.",
			"Bonus et soins de ZdC",
			"Consommables 401, 470, 494 et 495 utilisés dans la Zone de conquête.",
			"Consommables ordinaires",
			"Tous les consommables sauf les bonus de Zone de conquête contrôlés séparément.",
			"Cosmétiques",
			"Avatars, cadres, autocollants, bannières de guilde et pierres de bannière.",
			"Monnaies",
			"Or, pièces et starmoney. Les lots de monnaie restent indivisibles.",
			"Accélération de régénération d'énergie",
			"Récompenses contenant le champ buff.",
			"Énergie supérieure à 60",
			"Grandes quantités d'énergie pouvant être conservées pour plus tard.",
			"Énergie jusqu'à 60 inclus",
			"Petites quantités d'énergie que Goodwin récupère habituellement lui aussi.",
			"Objets d'équipement",
			"Équipement, parchemins et leurs fragments : gear, scroll, fragmentGear, fragmentScroll.",
			"Âmes et lots de héros",
			"fragmentHero et bundleHeroReward. Les âmes de familiers et de titans sont contrôlées séparément.",
			"Âmes de familiers",
			"fragmentPet et clés compatibles de pierres d'âme de familiers.",
			"Charges de portail",
			"Ressource rechargeable refillable[45].",
			"Points du Tournoi de puissance",
			"Récompenses contenant powerTournamentCoins.",
			"Expérience et progression",
			"Expérience, activité, Battle Pass, prestige et ressources techniques de progression.",
			"Ressources rechargeables",
			"Toutes les ressources rechargeables sauf les charges de portail contrôlées séparément.",
			"Ressources d'apparence",
			"Ressources d'apparence stockées dans fragmentSkin.",
			"Âmes de titans",
			"Fragments de titans dans fragmentTitan.",
			"Types de récompenses inconnus",
			"Récompenses nouvelles ou vides dont le contrat n'est pas encore connu du script. Activation à vos risques.",
			"Points VIP",
			"Récompenses contenant vipPoints.",
			"Tout bloquer",
			"Fermer",
			"Récupérer",
			"Afficher le plan avant la collecte",
			"Les requêtes qui modifient l'état ne sont jamais relancées automatiquement. Vérifiez le plan avant la collecte.",
			"Plan de collecte des récompenses",
			"Après : {label}",
			"Avant: {label}",
			"En bas",
			"Ne pas ajouter",
			"Position dans Tout faire",
			"En haut",
			"Recueillir des récompenses avec HWH Gestionnaire de récompenses",
			"Miroir de documentation {number}",
			"Documentation du projet",
			"Guide, fonctionnement du filtre et versions actuelles de HWH Rewards Manager.",
			"Documentation",
			"Code QR de soutien à HWH Rewards Manager",
			"Scanner le code QR",
			"Si le gestionnaire a sauvé une récompense et quelques neurones, vous pouvez soutenir le projet.",
			"Soutenir le projet",
			"Portefeuille : {wallet}",
			"Aucun résultat",
			"Échec de la collecte des récompenses : {message}",
			"Récupérer le courrier expirant malgré les filtres",
			"Mode d'urgence explicite : une lettre proche de l'expiration est réclamée en entier même si elle contient des ressources désactivées.",
			"Seuil d'expiration, heures",
			"Exporter les réglages",
			"Enregistrez le raccourci",
			"Effacer le raccourci",
			"Recueillir des récompenses",
			"Le raccourci est déjà assigné",
			"Non attribué",
			"Ouvrir les paramètres",
			"Appuyez sur un raccourci",
			"Importer les réglages",
			"Nombre maximal de passages dans les chaînes de quêtes",
			"Il n'y a rien à récupérer avec les filtres actuels.",
			"Impossible de remplacer le bouton HeroWarsHelper. Le contrat d'exécution de Helper a peut-être changé.",
			"Niveaux du pass avec récompense au choix : {count}. Récupérez-les dans la fenêtre du pass.",
			"Tâches du pass que le serveur ne versera pas (ticket ou niveau requis, ou pass terminé) : {count}.",
			"Vous recevrez",
			"À récupérer : {count}",
			"Restera : {count}",
			"Parcours saisonniers",
			"Quêtes d'événement",
			"Lettres",
			"Prestige",
			"Quêtes normales",
			"Étapes des offres",
			"Les nouveaux types de récompenses sont bloqués pour l’instant : {keys}. Activez la catégorie «Types de récompenses inconnus» pour les récupérer.",
			"Les types sélectionnés sont autorisés. Un lot mixte n'est récupéré que si tous ses types sont autorisés.",
			"Masquer automatiquement le résultat",
			"Délai avant masquage, ms",
			"En bas à droite",
			"Collecte des récompenses : {current}/{total}",
			"Compact",
			"Tableau de bord",
			"Normal",
			"Position de la fenêtre",
			"Vérification des chaînes de quêtes : passage {pass}",
			"Lecture des récompenses disponibles…",
			"Style de la fenêtre",
			"En haut au centre",
			"En haut à droite",
			"Récupérées : {collected} ; ignorées par les filtres : {skipped} ; erreurs : {failed}.",
			"Enregistrer",
			"Récupérer",
			"Rechercher un type de récompense",
			"Tout autoriser",
			"Automatisation",
			"Comportement et sécurité",
			"Réglages des récompenses",
			"Autorisé dans les événements",
			"Réglages exportés.",
			"Réglages importés.",
			"Ceci n'est pas un export de HWH Rewards Manager ou il ne contient aucun réglage.",
			"Le JSON des réglages est endommagé.",
			"Le filtre évalue le lot de récompenses entier. S'il contient un seul type désactivé, tout le lot reste non réclamé.",
			"Autorisé dans le courrier",
			"Fenêtre d'information",
			"Autorisé dans les quêtes normales",
			"Réglages des récompenses enregistrés.",
			"Sources",
			"HWH Rewards Manager",
			"Parcours saisonniers",
			"Récompenses Battle Pass gratuites et achetées disponibles.",
			"Quêtes d'événement",
			"Special, Battle Pass, invasions et chaînes saisonnières.",
			"Courrier",
			"Lettres de mailGetAll → mailFarm.",
			"Prestige de guilde",
			"Niveaux disponibles du parcours de prestige.",
			"Quêtes normales",
			"Quêtes quotidiennes, hebdomadaires, de guilde et ordinaires.",
			"Étapes gratuites des offres",
			"Uniquement les étapes gratuites consécutives avant la première étape payante.",
			"{name} v{version} est connecté à HeroWarsHelper.",
			"Rien à récupérer",
			"Synchroniser le jeu après la collecte",
			"Thème de l'interface",
			"Tout désélectionner",
			"Effacer la recherche",
			"Aucun bloc correspondant",
			"Fichier JSON des réglages",
			"Rechercher un bloc",
			"Tout sélectionner",
			"Réglages du gestionnaire de récompenses",
			"Sources, filtres, comportement, thème et fenêtre d'information.",
			"Tri",
			"Croissant",
			"Par nom",
			"Décroissant",
			"Sélectionnés en premier"
		],
		it: [
			"Ricompense",
			"Riscatta solo le ricompense consentite da HWH Rewards Manager",
			"Annulla",
			"Risorse artefatto",
			"Frammenti di artefatti di eroi e titani, inclusi fragmentArtifact e fragmentTitanArtifact.",
			"Potenziamenti e cure AdC",
			"Consumabili 401, 470, 494 e 495 usati nell'Area di Conquista.",
			"Consumabili normali",
			"Tutti i consumabili tranne i potenziamenti dell'Area di Conquista controllati separatamente.",
			"Estetica",
			"Avatar, cornici, adesivi, stendardi di gilda e pietre degli stendardi.",
			"Valute",
			"Oro, monete e starmoney. I pacchetti di valuta restano indivisibili.",
			"Accelerazione rigenerazione energia",
			"Ricompense contenenti il campo buff.",
			"Energia oltre 60",
			"Grandi quantità di energia che possono essere conservate per dopo.",
			"Energia fino a 60 inclusa",
			"Piccole quantità di energia che di solito raccoglie anche Goodwin.",
			"Oggetti di equipaggiamento",
			"Equipaggiamento, pergamene e relativi frammenti: gear, scroll, fragmentGear, fragmentScroll.",
			"Anime e pacchetti eroe",
			"fragmentHero e bundleHeroReward. Le anime di famigli e titani sono controllate separatamente.",
			"Anime dei famigli",
			"fragmentPet e chiavi compatibili delle pietre dell'anima dei famigli.",
			"Cariche portale",
			"Risorsa ricaricabile refillable[45].",
			"Punti del Torneo del Potere",
			"Ricompense contenenti powerTournamentCoins.",
			"Esperienza e progresso",
			"Esperienza, attività, Battle Pass, prestigio e risorse tecniche di progresso.",
			"Risorse ricaricabili",
			"Tutte le risorse ricaricabili tranne le cariche portale controllate separatamente.",
			"Risorse per aspetti",
			"Risorse per aspetti memorizzate in fragmentSkin.",
			"Anime dei titani",
			"Frammenti di titano in fragmentTitan.",
			"Tipi di ricompensa sconosciuti",
			"Ricompense nuove o vuote il cui contratto non è ancora noto allo script. Abilitale a tuo rischio.",
			"Punti VIP",
			"Ricompense contenenti vipPoints.",
			"Blocca tutto",
			"Chiudi",
			"Raccogli",
			"Mostra il piano prima della raccolta",
			"Le richieste che modificano lo stato non vengono mai ripetute automaticamente. Controlla il piano prima della raccolta.",
			"Piano di raccolta delle ricompense",
			"Dopo: {label}",
			"Prima: {label}",
			"In fondo",
			"Non aggiungere",
			"Posizione in Do Everything",
			"In alto",
			"Raccogliere ricompense con HWH Rewards Manager",
			"Mirror della documentazione {number}",
			"Documentazione del progetto",
			"Guida, comportamento del filtro e build attuali di HWH Rewards Manager.",
			"Documentazione",
			"Codice QR per sostenere HWH Rewards Manager",
			"Scansiona il codice QR",
			"Se il gestore ha salvato una ricompensa e qualche neurone, puoi sostenere il progetto.",
			"Sostieni il progetto",
			"Portafoglio: {wallet}",
			"Nessun risultato",
			"Raccolta delle ricompense non riuscita: {message}",
			"Riscatta la posta in scadenza nonostante i filtri",
			"Modalità di emergenza esplicita: una lettera in scadenza viene riscossa per intero anche se contiene risorse disattivate.",
			"Soglia di scadenza, ore",
			"Esporta impostazioni",
			"Scorciatoia record",
			"Scorciatoia chiara",
			"Raccogliere ricompense",
			"La scorciatoia è già assegnata",
			"Non assegnato",
			"Impostazioni aperte",
			"Premere un tasto",
			"Importa impostazioni",
			"Numero massimo di passaggi nelle catene di missioni",
			"Non c'è nulla da raccogliere con i filtri attuali.",
			"Impossibile sostituire il pulsante HeroWarsHelper. Il contratto runtime di Helper potrebbe essere cambiato.",
			"Livelli del pass con ricompensa a scelta: {count}. Riscattali nella finestra del pass.",
			"Compiti del pass che il server non pagherà (serve il biglietto o il livello, o il pass è finito): {count}.",
			"Riceverai",
			"Da raccogliere: {count}",
			"Resteranno: {count}",
			"Percorsi stagionali",
			"Missioni evento",
			"Lettere",
			"Prestigio",
			"Missioni normali",
			"Fasi delle offerte",
			"I nuovi tipi di ricompensa sono per ora bloccati: {keys}. Attiva la categoria «Tipi di ricompensa sconosciuti» per raccoglierli.",
			"I tipi selezionati sono consentiti. Un pacchetto misto viene riscosso solo quando tutti i tipi contenuti sono consentiti.",
			"Nascondi automaticamente il risultato",
			"Ritardo prima di nascondere, ms",
			"In basso a destra",
			"Raccolta ricompense: {current}/{total}",
			"Compatto",
			"Pannello",
			"Normale",
			"Posizione della finestra",
			"Controllo delle catene di missioni: passaggio {pass}",
			"Lettura delle ricompense disponibili…",
			"Stile della finestra",
			"In alto al centro",
			"In alto a destra",
			"Raccolte: {collected}; ignorate dai filtri: {skipped}; errori: {failed}.",
			"Salva",
			"Raccogli",
			"Cerca tipo di ricompensa",
			"Consenti tutto",
			"Automazione",
			"Comportamento e sicurezza",
			"Impostazioni ricompense",
			"Consentito negli eventi",
			"Impostazioni esportate.",
			"Impostazioni importate.",
			"Questo non è un file esportato da HWH Rewards Manager oppure non contiene impostazioni.",
			"Il JSON delle impostazioni è danneggiato.",
			"Il filtro valuta l'intero pacchetto di ricompense. Se contiene anche un solo tipo disattivato, tutto il pacchetto resta non riscosso.",
			"Consentito nella posta",
			"Finestra informativa",
			"Consentito nelle missioni normali",
			"Impostazioni delle ricompense salvate.",
			"Fonti",
			"HWH Rewards Manager",
			"Percorsi stagionali",
			"Ricompense Battle Pass gratuite e acquistate disponibili.",
			"Missioni evento",
			"Special, Battle Pass, invasioni e catene stagionali.",
			"Posta",
			"Lettere da mailGetAll → mailFarm.",
			"Prestigio della gilda",
			"Livelli disponibili del percorso prestigio.",
			"Missioni normali",
			"Missioni giornaliere, settimanali, di gilda e ordinarie.",
			"Fasi gratuite delle offerte",
			"Solo fasi gratuite consecutive prima della prima fase a pagamento.",
			"{name} v{version} è connesso a HeroWarsHelper.",
			"Niente da raccogliere",
			"Sincronizza il gioco dopo la raccolta",
			"Tema dell'interfaccia",
			"Deseleziona tutto",
			"Cancella ricerca",
			"Nessun blocco corrispondente",
			"File JSON delle impostazioni",
			"Cerca un blocco",
			"Seleziona tutto",
			"Impostazioni del gestore ricompense",
			"Fonti, filtri, comportamento, tema e finestra informativa.",
			"Ordinamento",
			"Crescente",
			"Per nome",
			"Decrescente",
			"Selezionati prima"
		],
		ja: [
			"報酬",
			"HWH Rewards Managerで許可された報酬だけを受け取る",
			"キャンセル",
			"アーティファクト素材",
			"fragmentArtifactとfragmentTitanArtifactを含む、ヒーローおよびタイタンのアーティファクト欠片。",
			"征服エリアのブースターと回復",
			"征服エリアで使用する消耗品401、470、494、495。",
			"通常の消耗品",
			"個別に管理する征服エリア用ブースターを除く、すべての消耗品。",
			"装飾",
			"アバター、フレーム、ステッカー、ギルドの旗と旗の石。",
			"通貨",
			"ゴールド、コイン、starmoney。通貨セットは分割せずに扱います。",
			"エネルギー回復加速",
			"buffフィールドを含む報酬。",
			"60を超えるエネルギー",
			"後で受け取るために残せる大量のエネルギー報酬。",
			"60以下のエネルギー",
			"Goodwinも通常受け取る少量のエネルギー報酬。",
			"装備アイテム",
			"装備、巻物、およびその欠片：gear、scroll、fragmentGear、fragmentScroll。",
			"ヒーローのソウルとパック",
			"fragmentHeroとbundleHeroReward。ペットとタイタンのソウルは個別に管理します。",
			"ペットのソウル",
			"fragmentPetおよび互換性のあるペットソウルストーンのキー。",
			"ポータルチャージ",
			"補充可能なリソース refillable[45]。",
			"パワートーナメントポイント",
			"powerTournamentCoinsを含む報酬。",
			"経験値と進行",
			"経験値、アクティビティ、Battle Pass、名声、およびシステム進行用の素材。",
			"補充可能なリソース",
			"個別に管理するポータルチャージを除く、すべての補充可能なリソース。",
			"スキン素材",
			"fragmentSkinに格納されたスキン素材。",
			"タイタンのソウル",
			"fragmentTitan内のタイタン欠片。",
			"不明な報酬種類",
			"スクリプトがまだデータ仕様を把握していない新規または空の報酬です。有効化は自己責任で行ってください。",
			"VIPポイント",
			"vipPointsを含む報酬。",
			"すべて禁止",
			"閉じる",
			"受け取る",
			"受取前に計画を表示",
			"状態を変更するリクエストは自動的に再試行されません。受取前に計画を確認してください。",
			"報酬受取計画",
			"後: {label}",
			"前: {label}",
			"一番下にある",
			"追加しない",
			"すべてを行う位置",
			"トップに",
			"HWH で報酬を受け取る リワードマネージャー",
			"ドキュメントミラー {number}",
			"プロジェクトドキュメント",
			"HWH Rewards Managerのガイド、フィルタ動作、最新ビルド。",
			"ドキュメント",
			"HWH Rewards Manager支援用QRコード",
			"QRコードをスキャン",
			"マネージャーが報酬と神経を少し守ってくれたなら、プロジェクトを支援できます。",
			"プロジェクトを支援",
			"ウォレット：{wallet}",
			"該当なし",
			"報酬の受取に失敗しました：{message}",
			"フィルタを無視して期限切れ間近のメールを受け取る",
			"明示的な緊急モードです。期限切れ間近のメールは、無効なリソースを含んでいてもすべて受け取ります。",
			"期限切れ判定（時間）",
			"設定をエクスポート",
			"レコードショートカット",
			"明確なショートカット",
			"報酬を集める",
			"ショートカットは既に割り当てられます",
			"指定なし",
			"オープン設定",
			"ショートカットを押す",
			"設定をインポート",
			"クエストチェーンの最大確認回数",
			"現在のフィルタでは受け取る報酬がありません。",
			"HeroWarsHelperのボタンを置き換えられませんでした。Helperのランタイム仕様が変更された可能性があります。",
			"報酬を選べるパスのレベル: {count}。パス画面で受け取ってください。",
			"サーバーが報酬を渡さないパス任務（チケットかレベルが必要、またはパス終了）: {count}。",
			"獲得予定",
			"受取予定：{count}",
			"残す予定：{count}",
			"シーズントラック",
			"イベントクエスト",
			"メール",
			"名声",
			"通常クエスト",
			"オファーステージ",
			"新しい報酬タイプは現在ブロックされています: {keys}。受け取るには「不明な報酬種類」カテゴリを有効にしてください。",
			"選択した種類を許可します。混合報酬セットは、含まれるすべての種類が許可されている場合だけ受け取ります。",
			"結果を自動的に隠す",
			"非表示までの時間（ms）",
			"右下",
			"報酬を受け取っています：{current}/{total}",
			"コンパクト",
			"ダッシュボード",
			"標準",
			"ウィンドウ位置",
			"クエストチェーンを確認しています：{pass}回目",
			"受取可能な報酬を読み込んでいます…",
			"ウィンドウスタイル",
			"上部中央",
			"右上",
			"受取済み：{collected}、フィルタで除外：{skipped}、エラー：{failed}。",
			"保存",
			"受け取る",
			"報酬種類を検索",
			"すべて許可",
			"オートメーション",
			"動作と安全性",
			"報酬設定",
			"イベントで許可する報酬",
			"設定をエクスポートしました。",
			"設定をインポートしました。",
			"HWH Rewards Managerのエクスポートではないか、設定が含まれていません。",
			"設定JSONが破損しています。",
			"フィルタは報酬セット全体を判定します。無効な種類が1つでも含まれている場合、セット全体を受け取りません。",
			"メールで許可する報酬",
			"情報ウィンドウ",
			"通常クエストで許可する報酬",
			"報酬設定を保存しました。",
			"受取元",
			"HWH Rewards Manager",
			"シーズントラック",
			"受取可能な無料および購入済みのBattle Pass報酬。",
			"イベントクエスト",
			"Special、Battle Pass、侵攻、シーズンのクエストチェーン。",
			"メール",
			"mailGetAll → mailFarm のメール。",
			"ギルド名声",
			"名声トラックの受取可能なレベル。",
			"通常クエスト",
			"デイリー、ウィークリー、ギルド、および通常クエスト。",
			"無料の段階式オファー",
			"最初の有料ステージより前に連続する無料ステージだけを対象にします。",
			"{name} v{version}をHeroWarsHelperに接続しました。",
			"受け取るものなし",
			"受取後にゲームを同期",
			"インターフェーステーマ",
			"すべて選択解除",
			"検索をクリア",
			"一致するブロックはありません",
			"設定JSONファイル",
			"ブロックを検索",
			"すべて選択",
			"報酬マネージャー設定",
			"受取元、フィルタ、動作、テーマ、情報ウィンドウ。",
			"並び順",
			"昇順",
			"名前順",
			"降順",
			"選択済みを先頭"
		],
		ko: [
			"보상",
			"HWH Rewards Manager에서 허용한 보상만 수령",
			"취소",
			"유물 자원",
			"fragmentArtifact와 fragmentTitanArtifact를 포함한 영웅 및 타이탄 유물 조각.",
			"정복 지역 강화 및 치유",
			"정복 지역에서 사용하는 소모품 401, 470, 494, 495.",
			"일반 소모품",
			"별도로 제어하는 정복 지역 강화 아이템을 제외한 모든 소모품.",
			"꾸미기",
			"아바타, 테두리, 스티커, 길드 깃발과 깃발석.",
			"화폐",
			"골드, 코인 및 starmoney. 화폐 묶음은 분리하지 않습니다.",
			"에너지 회복 가속",
			"buff 필드를 포함하는 보상.",
			"60 초과 에너지",
			"나중을 위해 남겨 둘 수 있는 대량 에너지 보상.",
			"60 이하 에너지",
			"Goodwin도 보통 수령하는 소량의 에너지 보상.",
			"장비 아이템",
			"장비, 두루마리 및 조각: gear, scroll, fragmentGear, fragmentScroll.",
			"영웅 영혼 및 묶음",
			"fragmentHero와 bundleHeroReward. 펫과 타이탄 영혼은 별도로 제어합니다.",
			"펫 영혼",
			"fragmentPet 및 호환되는 펫 영혼석 키.",
			"포털 충전",
			"충전형 자원 refillable[45].",
			"파워 토너먼트 포인트",
			"powerTournamentCoins를 포함하는 보상.",
			"경험치 및 진행도",
			"경험치, 활동, Battle Pass, 명성 및 시스템 진행 자원.",
			"충전형 자원",
			"별도로 제어하는 포털 충전을 제외한 모든 충전형 자원.",
			"스킨 자원",
			"fragmentSkin에 저장된 스킨 자원.",
			"타이탄 영혼",
			"fragmentTitan의 타이탄 조각.",
			"알 수 없는 보상 유형",
			"스크립트가 아직 데이터 구조를 알지 못하는 신규 또는 빈 보상입니다. 활성화에 따른 책임은 사용자에게 있습니다.",
			"VIP 포인트",
			"vipPoints를 포함하는 보상.",
			"모두 차단",
			"닫기",
			"수령",
			"수령 전 계획 표시",
			"상태를 변경하는 요청은 자동으로 다시 시도하지 않습니다. 수령 전에 계획을 확인하세요.",
			"보상 수령 계획",
			"이후: {label}",
			"이전: {label}",
			"맨 위로",
			"추가하지 않음",
			"모든 것",
			"맨 위로",
			"HWH로 보상을 수집 보상 관리자",
			"문서 미러 {number}",
			"프로젝트 문서",
			"HWH Rewards Manager 사용 안내, 필터 동작 및 최신 빌드.",
			"문서",
			"HWH Rewards Manager 후원 QR 코드",
			"QR 코드 스캔",
			"관리자가 보상과 신경 몇 가닥을 지켜 줬다면 프로젝트를 후원할 수 있습니다.",
			"프로젝트 후원",
			"지갑: {wallet}",
			"검색 결과 없음",
			"보상 수령 실패: {message}",
			"필터를 무시하고 만료 임박 우편 수령",
			"명시적 긴급 모드입니다. 만료가 임박한 우편은 비활성화된 자원이 포함되어도 전체를 수령합니다.",
			"만료 기준(시간)",
			"설정 내보내기",
			"기록 단축키",
			"빠른 링크",
			"보상 수집",
			"Shortcut는 이미 할당됩니다.",
			"할당되지 않음",
			"설정 열기",
			"바로가기",
			"설정 가져오기",
			"퀘스트 연계 최대 확인 횟수",
			"현재 필터로 수령할 보상이 없습니다.",
			"HeroWarsHelper 버튼을 교체하지 못했습니다. Helper의 런타임 규약이 변경되었을 수 있습니다.",
			"보상을 선택하는 패스 레벨: {count}. 패스 창에서 받으세요.",
			"서버가 보상을 주지 않는 패스 과제(티켓이나 레벨 필요 또는 패스 종료): {count}.",
			"받게 될 보상",
			"수령 예정: {count}",
			"남겨 둘 항목: {count}",
			"시즌 트랙",
			"이벤트 퀘스트",
			"우편",
			"명성",
			"일반 퀘스트",
			"상품 단계",
			"새 보상 유형은 현재 차단되어 있습니다: {keys}. 수집하려면 「알 수 없는 보상 유형」 범주를 켜세요.",
			"선택한 유형을 허용합니다. 혼합 보상 묶음은 포함된 모든 유형이 허용된 경우에만 수령합니다.",
			"결과 자동 숨김",
			"숨김 지연 시간(ms)",
			"오른쪽 하단",
			"보상 수령 중: {current}/{total}",
			"간단히",
			"대시보드",
			"기본",
			"창 위치",
			"퀘스트 연계 확인 중: {pass}회차",
			"수령 가능한 보상을 읽는 중…",
			"창 스타일",
			"상단 중앙",
			"오른쪽 상단",
			"수령: {collected}; 필터로 건너뜀: {skipped}; 오류: {failed}.",
			"저장",
			"수령",
			"보상 유형 검색",
			"모두 허용",
			"회사연혁",
			"동작 및 안전",
			"보상 설정",
			"이벤트에서 허용",
			"설정을 내보냈습니다.",
			"설정을 가져왔습니다.",
			"HWH Rewards Manager 내보내기 파일이 아니거나 설정이 없습니다.",
			"설정 JSON이 손상되었습니다.",
			"필터는 보상 묶음 전체를 검사합니다. 비활성화된 유형이 하나라도 포함되면 전체 묶음을 수령하지 않습니다.",
			"우편에서 허용",
			"정보 창",
			"일반 퀘스트에서 허용",
			"보상 설정을 저장했습니다.",
			"소스",
			"HWH Rewards Manager",
			"시즌 트랙",
			"수령 가능한 무료 및 구매 완료 Battle Pass 보상.",
			"이벤트 퀘스트",
			"Special, Battle Pass, 침공 및 시즌 퀘스트 연계.",
			"우편",
			"mailGetAll → mailFarm의 우편.",
			"길드 명성",
			"명성 트랙에서 수령 가능한 레벨.",
			"일반 퀘스트",
			"일일, 주간, 길드 및 일반 퀘스트.",
			"무료 단계형 상품",
			"첫 유료 단계 전까지 연속된 무료 단계만 수령합니다.",
			"{name} v{version}이(가) HeroWarsHelper에 연결되었습니다.",
			"받을 보상 없음",
			"수령 후 게임 동기화",
			"인터페이스 테마",
			"모두 선택 해제",
			"검색 지우기",
			"일치하는 블록 없음",
			"설정 JSON 파일",
			"블록 검색",
			"모두 선택",
			"보상 관리자 설정",
			"소스, 필터, 동작, 테마 및 정보 창.",
			"정렬",
			"오름차순",
			"이름순",
			"내림차순",
			"선택 항목 우선"
		],
		pt: [
			"Recompensas",
			"Coletar apenas as recompensas permitidas pelo HWH Rewards Manager",
			"Cancelar",
			"Recursos de artefato",
			"Fragmentos de artefatos de heróis e titãs, incluindo fragmentArtifact e fragmentTitanArtifact.",
			"Reforços e cura da AdC",
			"Consumíveis 401, 470, 494 e 495 usados na Área de Conquista.",
			"Consumíveis comuns",
			"Todos os consumíveis, exceto os reforços da Área de Conquista controlados separadamente.",
			"Cosméticos",
			"Avatares, molduras, adesivos, estandartes da guilda e pedras de estandarte.",
			"Moedas",
			"Ouro, moedas e starmoney. Os pacotes de moeda permanecem indivisíveis.",
			"Aceleração da regeneração de energia",
			"Recompensas que contêm o campo buff.",
			"Energia acima de 60",
			"Grandes quantidades de energia que podem ser guardadas para depois.",
			"Energia até 60 inclusive",
			"Pequenas quantidades de energia que o Goodwin normalmente também coleta.",
			"Itens de equipamento",
			"Equipamentos, pergaminhos e seus fragmentos: gear, scroll, fragmentGear, fragmentScroll.",
			"Almas e pacotes de heróis",
			"fragmentHero e bundleHeroReward. Almas de mascotes e titãs são controladas separadamente.",
			"Almas de mascotes",
			"fragmentPet e chaves compatíveis de pedras da alma de mascotes.",
			"Cargas de portal",
			"Recurso recarregável refillable[45].",
			"Pontos do Torneio do Poder",
			"Recompensas que contêm powerTournamentCoins.",
			"Experiência e progresso",
			"Experiência, atividade, Battle Pass, prestígio e recursos técnicos de progresso.",
			"Recursos recarregáveis",
			"Todos os recursos recarregáveis, exceto as cargas de portal controladas separadamente.",
			"Recursos de visuais",
			"Recursos de visuais armazenados em fragmentSkin.",
			"Almas de titãs",
			"Fragmentos de titã em fragmentTitan.",
			"Tipos de recompensa desconhecidos",
			"Recompensas novas ou vazias cujo contrato o script ainda não conhece. Ative por sua conta e risco.",
			"Pontos VIP",
			"Recompensas que contêm vipPoints.",
			"Bloquear tudo",
			"Fechar",
			"Coletar",
			"Mostrar o plano antes da coleta",
			"Solicitações que alteram o estado nunca são repetidas automaticamente. Confira o plano antes da coleta.",
			"Plano de coleta de recompensas",
			"Após: {label}",
			"Antes: {label}",
			"No fundo",
			"Não adicionar",
			"Posição em Fazer Tudo",
			"No topo",
			"Recolher recompensas com HWH Gerenciador de recompensas",
			"Espelho da documentação {number}",
			"Documentação do projeto",
			"Guia, funcionamento do filtro e versões atuais do HWH Rewards Manager.",
			"Documentação",
			"Código QR de apoio ao HWH Rewards Manager",
			"Escanear o código QR",
			"Se o gerenciador salvou uma recompensa e alguns neurônios, você pode apoiar o projeto.",
			"Apoiar o projeto",
			"Carteira: {wallet}",
			"Nada encontrado",
			"Falha ao coletar recompensas: {message}",
			"Coletar correio prestes a expirar apesar dos filtros",
			"Modo de emergência explícito: uma carta prestes a expirar é resgatada por inteiro mesmo que contenha recursos desativados.",
			"Limite de expiração, horas",
			"Exportar configurações",
			"Gravar o atalho",
			"Limpar atalho",
			"Recolher recompensas",
			"Atalho já está atribuído",
			"Não atribuído",
			"Abrir configurações",
			"Pressione um atalho",
			"Importar configurações",
			"Máximo de passagens em sequências de missões",
			"Não há nada para coletar com os filtros atuais.",
			"Não foi possível substituir o botão do HeroWarsHelper. O contrato de execução do Helper pode ter mudado.",
			"Níveis do passe com recompensa à escolha: {count}. Resgate-os na janela do passe.",
			"Tarefas do passe que o servidor não pagará (precisa de ingresso ou nível, ou o passe terminou): {count}.",
			"Você receberá",
			"Será coletado: {count}",
			"Permanecerá: {count}",
			"Trilhas sazonais",
			"Missões de evento",
			"Cartas",
			"Prestígio",
			"Missões normais",
			"Etapas de ofertas",
			"Novos tipos de recompensa estão bloqueados por enquanto: {keys}. Ative a categoria «Tipos de recompensa desconhecidos» para coletá-los.",
			"Os tipos selecionados são permitidos. Um pacote misto só é coletado quando todos os tipos nele contidos são permitidos.",
			"Ocultar o resultado automaticamente",
			"Atraso para ocultar, ms",
			"Inferior direito",
			"Coletando recompensas: {current}/{total}",
			"Compacto",
			"Painel",
			"Normal",
			"Posição da janela",
			"Verificando sequências de missões: passagem {pass}",
			"Lendo as recompensas disponíveis…",
			"Estilo da janela",
			"Superior central",
			"Superior direito",
			"Coletadas: {collected}; ignoradas pelos filtros: {skipped}; erros: {failed}.",
			"Salvar",
			"Coletar",
			"Buscar tipo de recompensa",
			"Permitir tudo",
			"Automação",
			"Comportamento e segurança",
			"Configurações de recompensas",
			"Permitido em eventos",
			"Configurações exportadas.",
			"Configurações importadas.",
			"Este não é um arquivo exportado pelo HWH Rewards Manager ou não contém configurações.",
			"O JSON de configurações está danificado.",
			"O filtro avalia o pacote de recompensas inteiro. Se houver um único tipo desativado, todo o pacote permanecerá sem resgate.",
			"Permitido no correio",
			"Janela de informações",
			"Permitido em missões normais",
			"Configurações de recompensas salvas.",
			"Fontes",
			"HWH Rewards Manager",
			"Trilhas sazonais",
			"Recompensas gratuitas e compradas disponíveis no Battle Pass.",
			"Missões de evento",
			"Special, Battle Pass, invasões e sequências sazonais.",
			"Correio",
			"Cartas de mailGetAll → mailFarm.",
			"Prestígio da guilda",
			"Níveis disponíveis da trilha de prestígio.",
			"Missões normais",
			"Missões diárias, semanais, de guilda e comuns.",
			"Etapas gratuitas de ofertas",
			"Somente etapas gratuitas consecutivas antes da primeira etapa paga.",
			"{name} v{version} foi conectado ao HeroWarsHelper.",
			"Nada para coletar",
			"Sincronizar o jogo após a coleta",
			"Tema da interface",
			"Limpar seleção",
			"Limpar busca",
			"Nenhum bloco correspondente",
			"Arquivo JSON de configurações",
			"Buscar um bloco",
			"Selecionar tudo",
			"Configurações do gerenciador de recompensas",
			"Fontes, filtros, comportamento, tema e janela de informações.",
			"Ordenação",
			"Crescente",
			"Por nome",
			"Decrescente",
			"Selecionados primeiro"
		],
		th: [
			"รางวัล",
			"รับเฉพาะรางวัลที่ HWH Rewards Manager อนุญาต",
			"ยกเลิก",
			"ทรัพยากรอาร์ติแฟกต์",
			"ชิ้นส่วนอาร์ติแฟกต์ของฮีโร่และไททัน รวมถึง fragmentArtifact และ fragmentTitanArtifact",
			"บูสเตอร์และการรักษาในพื้นที่พิชิต",
			"ของใช้สิ้นเปลือง 401, 470, 494 และ 495 สำหรับพื้นที่พิชิต",
			"ของใช้สิ้นเปลืองทั่วไป",
			"ของใช้สิ้นเปลืองทั้งหมด ยกเว้นบูสเตอร์พื้นที่พิชิตที่ควบคุมแยกต่างหาก",
			"ของตกแต่ง",
			"อวาตาร์ กรอบ สติกเกอร์ ธงกิลด์ และหินธง",
			"สกุลเงิน",
			"ทอง เหรียญ และ starmoney ชุดสกุลเงินจะไม่ถูกแยก",
			"เร่งการฟื้นฟูพลังงาน",
			"รางวัลที่มีฟิลด์ buff",
			"พลังงานมากกว่า 60",
			"รางวัลพลังงานจำนวนมากที่สามารถเก็บไว้รับภายหลัง",
			"พลังงานไม่เกิน 60",
			"รางวัลพลังงานจำนวนเล็กน้อยที่ Goodwin มักจะรับเช่นกัน",
			"ไอเทมอุปกรณ์",
			"อุปกรณ์ ม้วนคัมภีร์ และชิ้นส่วน: gear, scroll, fragmentGear, fragmentScroll",
			"วิญญาณและชุดฮีโร่",
			"fragmentHero และ bundleHeroReward วิญญาณสัตว์เลี้ยงและไททันควบคุมแยกกัน",
			"วิญญาณสัตว์เลี้ยง",
			"fragmentPet และคีย์หินวิญญาณสัตว์เลี้ยงที่รองรับ",
			"ชาร์จพอร์ทัล",
			"ทรัพยากรที่เติมได้ refillable[45]",
			"คะแนนทัวร์นาเมนต์พลัง",
			"รางวัลที่มี powerTournamentCoins",
			"ค่าประสบการณ์และความคืบหน้า",
			"ค่าประสบการณ์ กิจกรรม Battle Pass เกียรติยศ และทรัพยากรความคืบหน้าของระบบ",
			"ทรัพยากรที่เติมได้",
			"ทรัพยากรที่เติมได้ทั้งหมด ยกเว้นชาร์จพอร์ทัลที่ควบคุมแยกต่างหาก",
			"ทรัพยากรสกิน",
			"ทรัพยากรสกินที่เก็บใน fragmentSkin",
			"วิญญาณไททัน",
			"ชิ้นส่วนไททันใน fragmentTitan",
			"ประเภทรางวัลที่ไม่รู้จัก",
			"รางวัลใหม่หรือว่างที่สคริปต์ยังไม่รู้โครงสร้างข้อมูล เปิดใช้งานโดยรับความเสี่ยงเอง",
			"คะแนน VIP",
			"รางวัลที่มี vipPoints",
			"บล็อกทั้งหมด",
			"ปิด",
			"รับรางวัล",
			"แสดงแผนก่อนรับ",
			"คำขอที่เปลี่ยนสถานะจะไม่ถูกลองซ้ำโดยอัตโนมัติ โปรดตรวจสอบแผนก่อนรับ",
			"แผนการรับรางวัล",
			"หลัง: {label}",
			"ก่อน: {label}",
			"ที่ด้านล่าง",
			"ไม่ต้องเพิ่ม",
			"ตําแหน่ง ใน การ ทํา ทุก สิ่ง",
			"ที่ด้านบน",
			"สะสมรางวัลด้วย HWH ตัวจัดการรางวัล",
			"เว็บไซต์สำรองเอกสาร {number}",
			"เอกสารโครงการ",
			"คู่มือ การทำงานของตัวกรอง และรุ่นปัจจุบันของ HWH Rewards Manager",
			"เอกสาร",
			"คิวอาร์โค้ดสนับสนุน HWH Rewards Manager",
			"สแกนคิวอาร์โค้ด",
			"หากตัวจัดการช่วยรักษารางวัลและเซลล์ประสาทไว้ได้บ้าง คุณสามารถสนับสนุนโครงการได้",
			"สนับสนุนโครงการ",
			"กระเป๋าเงิน: {wallet}",
			"ไม่พบรายการ",
			"รับรางวัลไม่สำเร็จ: {message}",
			"รับจดหมายที่ใกล้หมดอายุโดยไม่สนตัวกรอง",
			"โหมดฉุกเฉินแบบชัดเจน: จดหมายที่ใกล้หมดอายุจะถูกรับทั้งฉบับแม้มีทรัพยากรที่ปิดใช้งาน",
			"เกณฑ์หมดอายุ (ชั่วโมง)",
			"ส่งออกการตั้งค่า",
			"บันทึกปุ่มพิมพ์ลัด",
			"ล้างปุ่มพิมพ์ลัด",
			"สะสมรางวัล",
			"ปุ่มพิมพ์ลัดมีการกําหนดอยู่แล้ว",
			"ยังไม่ได้กําหนด",
			"เปิดการตั้งค่า",
			"กดปุ่มพิมพ์ลัด",
			"นำเข้าการตั้งค่า",
			"จำนวนรอบตรวจสอบชุดเควสต์สูงสุด",
			"ไม่มีรางวัลให้รับตามตัวกรองปัจจุบัน",
			"ไม่สามารถแทนที่ปุ่ม HeroWarsHelper ได้ สัญญารันไทม์ของ Helper อาจเปลี่ยนไป",
			"เลเวลพาสที่ต้องเลือกรางวัล: {count} รับได้ในหน้าต่างพาส",
			"ภารกิจพาสที่เซิร์ฟเวอร์จะไม่จ่ายรางวัล (ต้องมีตั๋วหรือเลเวล หรือพาสจบแล้ว): {count}",
			"สิ่งที่จะได้รับ",
			"จะรับ: {count}",
			"จะเหลือไว้: {count}",
			"เส้นทางฤดูกาล",
			"เควสต์กิจกรรม",
			"จดหมาย",
			"เกียรติยศ",
			"เควสต์ปกติ",
			"ขั้นข้อเสนอ",
			"ประเภทรางวัลใหม่ถูกบล็อกไว้ก่อน: {keys} เปิดหมวด “ประเภทรางวัลที่ไม่รู้จัก” เพื่อเก็บรางวัลเหล่านี้",
			"ประเภทที่เลือกจะได้รับอนุญาต ชุดรางวัลแบบผสมจะถูกรับก็ต่อเมื่ออนุญาตทุกประเภทในชุด",
			"ซ่อนผลลัพธ์อัตโนมัติ",
			"เวลาหน่วงก่อนซ่อน (มิลลิวินาที)",
			"ด้านล่างขวา",
			"กำลังรับรางวัล: {current}/{total}",
			"กะทัดรัด",
			"แดชบอร์ด",
			"ปกติ",
			"ตำแหน่งหน้าต่าง",
			"กำลังตรวจสอบชุดเควสต์: รอบที่ {pass}",
			"กำลังอ่านรางวัลที่พร้อมรับ…",
			"รูปแบบหน้าต่าง",
			"ด้านบนตรงกลาง",
			"ด้านบนขวา",
			"รับแล้ว: {collected}; ข้ามตามตัวกรอง: {skipped}; ข้อผิดพลาด: {failed}",
			"บันทึก",
			"รับรางวัล",
			"ค้นหาประเภทรางวัล",
			"อนุญาตทั้งหมด",
			"อัตโนมัติ",
			"การทำงานและความปลอดภัย",
			"การตั้งค่ารางวัล",
			"ประเภทที่อนุญาตในกิจกรรม",
			"ส่งออกการตั้งค่าแล้ว",
			"นำเข้าการตั้งค่าแล้ว",
			"ไฟล์นี้ไม่ใช่ไฟล์ส่งออกของ HWH Rewards Manager หรือไม่มีการตั้งค่า",
			"JSON การตั้งค่าเสียหาย",
			"ตัวกรองจะตรวจสอบชุดรางวัลทั้งชุด หากมีประเภทที่ปิดใช้งานแม้แต่ประเภทเดียว ระบบจะไม่รับรางวัลทั้งชุด",
			"ประเภทที่อนุญาตในจดหมาย",
			"หน้าต่างข้อมูล",
			"ประเภทที่อนุญาตในเควสต์ปกติ",
			"บันทึกการตั้งค่ารางวัลแล้ว",
			"แหล่งรางวัล",
			"HWH Rewards Manager",
			"เส้นทางฤดูกาล",
			"รางวัล Battle Pass ฟรีและที่ซื้อแล้วซึ่งพร้อมรับ",
			"เควสต์กิจกรรม",
			"Special, Battle Pass, การบุกรุก และชุดเควสต์ฤดูกาล",
			"จดหมาย",
			"จดหมายจาก mailGetAll → mailFarm",
			"เกียรติยศกิลด์",
			"ระดับในเส้นทางเกียรติยศที่พร้อมรับ",
			"เควสต์ปกติ",
			"เควสต์รายวัน รายสัปดาห์ กิลด์ และเควสต์ทั่วไป",
			"ขั้นข้อเสนอฟรี",
			"เฉพาะขั้นฟรีที่ต่อเนื่องก่อนถึงขั้นชำระเงินขั้นแรก",
			"เชื่อมต่อ {name} v{version} กับ HeroWarsHelper แล้ว",
			"ไม่มีอะไรให้เก็บ",
			"ซิงค์เกมหลังรับรางวัล",
			"ธีมส่วนติดต่อ",
			"ยกเลิกการเลือกทั้งหมด",
			"ล้างการค้นหา",
			"ไม่มีกลุ่มที่ตรงกัน",
			"ไฟล์ JSON การตั้งค่า",
			"ค้นหากลุ่ม",
			"เลือกทั้งหมด",
			"การตั้งค่าตัวจัดการรางวัล",
			"แหล่งรางวัล ตัวกรอง การทำงาน ธีม และหน้าต่างข้อมูล",
			"การเรียงลำดับ",
			"จากน้อยไปมาก",
			"ตามชื่อ",
			"จากมากไปน้อย",
			"รายการที่เลือกก่อน"
		],
		"zh-cn": [
			"奖励",
			"仅领取 HWH Rewards Manager 允许的奖励",
			"取消",
			"神器资源",
			"英雄和泰坦神器碎片，包括 fragmentArtifact 和 fragmentTitanArtifact。",
			"征服区域增益与治疗",
			"征服区域使用的消耗品 401、470、494 和 495。",
			"普通消耗品",
			"除单独控制的征服区域增益道具外的所有消耗品。",
			"装饰",
			"头像、头像框、贴纸、公会旗帜和旗帜石。",
			"货币",
			"金币、代币和 starmoney。货币奖励包保持不可拆分。",
			"能量恢复加速",
			"包含 buff 字段的奖励。",
			"超过 60 点的能量",
			"可留到以后领取的大额能量奖励。",
			"60 点及以下能量",
			"Goodwin 通常也会领取的小额能量奖励。",
			"装备物品",
			"装备、卷轴及其碎片：gear、scroll、fragmentGear、fragmentScroll。",
			"英雄灵魂与英雄包",
			"fragmentHero 和 bundleHeroReward。宠物与泰坦灵魂将单独控制。",
			"宠物灵魂",
			"fragmentPet 以及兼容的宠物灵魂石键。",
			"传送门充能",
			"可补充资源 refillable[45]。",
			"力量锦标赛点数",
			"包含 powerTournamentCoins 的奖励。",
			"经验与进度",
			"经验、活跃度、Battle Pass、声望及系统进度资源。",
			"可补充资源",
			"除单独控制的传送门充能外的所有可补充资源。",
			"外观资源",
			"存储在 fragmentSkin 中的外观资源。",
			"泰坦灵魂",
			"fragmentTitan 中的泰坦碎片。",
			"未知奖励类型",
			"脚本尚不了解其数据结构的新奖励或空奖励。启用需自行承担风险。",
			"VIP 点数",
			"包含 vipPoints 的奖励。",
			"全部禁止",
			"关闭",
			"领取",
			"领取前显示计划",
			"更改状态的请求绝不会自动重试。领取前请检查计划。",
			"奖励领取计划",
			"之后: {label}",
			"在此之前: {label}",
			"在底边",
			"不添加",
			"做一切时的位置",
			"在顶上",
			"以 HWH 奖励管理器",
			"文档镜像 {number}",
			"项目文档",
			"HWH Rewards Manager 的使用说明、筛选规则和当前版本。",
			"文档",
			"支持 HWH Rewards Manager 的二维码",
			"扫描二维码",
			"如果管理器帮你保住了奖励和几根神经，可以考虑支持本项目。",
			"支持项目",
			"钱包：{wallet}",
			"未找到内容",
			"奖励领取失败：{message}",
			"忽略筛选器领取即将过期的邮件",
			"明确的紧急模式：即将过期的邮件会被完整领取，即使其中含有已禁用资源。",
			"过期阈值（小时）",
			"导出设置",
			"记录快捷键",
			"清除快捷键",
			"收集奖励",
			"快捷键已经指定",
			"未分配",
			"打开设置",
			"按一个快捷键",
			"导入设置",
			"任务链最大检查轮数",
			"按当前筛选条件没有可领取的内容。",
			"无法替换 HeroWarsHelper 按钮。Helper 的运行时接口可能已发生变化。",
			"需要选择奖励的通行证等级：{count}。请在通行证窗口中领取。",
			"服务器不会发放奖励的通行证任务（需要门票或等级，或通行证已结束）：{count}。",
			"将获得",
			"将领取：{count}",
			"将保留：{count}",
			"赛季路线",
			"活动任务",
			"邮件",
			"声望",
			"普通任务",
			"优惠阶段",
			"新的奖励类型暂被阻止：{keys}。启用“未知奖励类型”类别即可领取。",
			"已选类型将被允许。只有混合奖励包中的所有类型都被允许时，才会领取该奖励包。",
			"自动隐藏结果",
			"隐藏延迟（毫秒）",
			"右下角",
			"正在领取奖励：{current}/{total}",
			"紧凑",
			"面板",
			"默认",
			"窗口位置",
			"正在检查任务链：第 {pass} 轮",
			"正在读取可用奖励…",
			"窗口样式",
			"顶部居中",
			"右上角",
			"已领取：{collected}；被筛选器跳过：{skipped}；错误：{failed}。",
			"保存",
			"领取",
			"查找奖励类型",
			"全部允许",
			"自动化",
			"行为与安全",
			"奖励设置",
			"活动中允许的类型",
			"设置已导出。",
			"设置已导入。",
			"这不是 HWH Rewards Manager 导出文件，或文件中没有设置。",
			"设置 JSON 已损坏。",
			"筛选器会检查整个奖励包。只要其中包含一种已禁用类型，整个奖励包都会保持未领取。",
			"邮件中允许的类型",
			"信息窗口",
			"普通任务中允许的类型",
			"奖励设置已保存。",
			"来源",
			"HWH Rewards Manager",
			"赛季路线",
			"当前可领取的免费及已购买 Battle Pass 奖励。",
			"活动任务",
			"Special、Battle Pass、入侵和赛季任务链。",
			"邮件",
			"来自 mailGetAll → mailFarm 的邮件。",
			"公会声望",
			"声望路线中当前可领取的等级。",
			"普通任务",
			"每日、每周、公会及普通任务。",
			"免费分阶段优惠",
			"仅领取首个付费阶段之前连续出现的免费阶段。",
			"{name} v{version} 已连接到 HeroWarsHelper。",
			"无可领取",
			"领取后同步游戏",
			"界面主题",
			"全部取消选择",
			"清除搜索",
			"没有匹配的设置块",
			"设置 JSON 文件",
			"查找设置块",
			"全选",
			"奖励管理器设置",
			"来源、筛选器、行为、主题和信息窗口。",
			"排序",
			"升序",
			"按名称",
			"降序",
			"已选项优先"
		],
		"zh-tw": [
			"獎勵",
			"僅領取 HWH Rewards Manager 允許的獎勵",
			"取消",
			"神器資源",
			"英雄和泰坦神器碎片，包括 fragmentArtifact 和 fragmentTitanArtifact。",
			"征服區域增益與治療",
			"征服區域使用的消耗品 401、470、494 和 495。",
			"普通消耗品",
			"除單獨控制的征服區域增益道具外的所有消耗品。",
			"裝飾",
			"頭像、頭像框、貼紙、公會旗幟和旗幟石。",
			"貨幣",
			"金幣、代幣和 starmoney。貨幣獎勵包保持不可拆分。",
			"能量恢復加速",
			"包含 buff 欄位的獎勵。",
			"超過 60 點的能量",
			"可留到以後領取的大額能量獎勵。",
			"60 點及以下能量",
			"Goodwin 通常也會領取的小額能量獎勵。",
			"裝備物品",
			"裝備、卷軸及其碎片：gear、scroll、fragmentGear、fragmentScroll。",
			"英雄靈魂與英雄包",
			"fragmentHero 和 bundleHeroReward。寵物與泰坦靈魂將單獨控制。",
			"寵物靈魂",
			"fragmentPet 以及相容的寵物靈魂石鍵。",
			"傳送門充能",
			"可補充資源 refillable[45]。",
			"力量錦標賽點數",
			"包含 powerTournamentCoins 的獎勵。",
			"經驗與進度",
			"經驗、活躍度、Battle Pass、聲望及系統進度資源。",
			"可補充資源",
			"除單獨控制的傳送門充能外的所有可補充資源。",
			"外觀資源",
			"儲存在 fragmentSkin 中的外觀資源。",
			"泰坦靈魂",
			"fragmentTitan 中的泰坦碎片。",
			"未知獎勵類型",
			"指令碼尚不瞭解其資料結構的新獎勵或空獎勵。啟用需自行承擔風險。",
			"VIP 點數",
			"包含 vipPoints 的獎勵。",
			"全部禁止",
			"關閉",
			"領取",
			"領取前顯示計劃",
			"更改狀態的請求絕不會自動重試。領取前請檢查計劃。",
			"獎勵領取計劃",
			"后: {label}",
			"在: {label}",
			"在地底",
			"不要添加",
			"在做所有事中的位置",
			"在最上",
			"收取回報 HWH 酬勞管理員",
			"文件映象 {number}",
			"專案文件",
			"HWH Rewards Manager 的使用說明、篩選規則和當前版本。",
			"文件",
			"支援 HWH Rewards Manager 的二維碼",
			"掃描二維碼",
			"如果管理器幫你保住了獎勵和幾根神經，可以考慮支援本專案。",
			"支援專案",
			"錢包：{wallet}",
			"未找到內容",
			"獎勵領取失敗：{message}",
			"忽略篩選器領取即將過期的郵件",
			"明確的緊急模式：即將過期的郵件會被完整領取，即使其中含有已停用資源。",
			"過期閾值（小時）",
			"匯出設定",
			"錄取捷徑",
			"清除捷徑",
			"收取獎勵",
			"已指定捷徑",
			"未被指定",
			"開啟設定值",
			"按下捷徑",
			"匯入設定",
			"任務鏈最大檢查輪數",
			"按當前篩選條件沒有可領取的內容。",
			"無法替換 HeroWarsHelper 按鈕。Helper 的執行時介面可能已發生變化。",
			"需要選擇獎勵的通行證等級：{count}。請在通行證視窗中領取。",
			"伺服器不會發放獎勵的通行證任務（需要門票或等級，或通行證已結束）：{count}。",
			"將獲得",
			"將領取：{count}",
			"將保留：{count}",
			"賽季路線",
			"活動任務",
			"郵件",
			"聲望",
			"一般任務",
			"優惠階段",
			"新的獎勵類型暫被封鎖：{keys}。啟用「未知獎勵類型」類別即可領取。",
			"已選類型將被允許。只有混合獎勵包中的所有類型都被允許時，才會領取該獎勵包。",
			"自動隱藏結果",
			"隱藏延遲（毫秒）",
			"右下角",
			"正在領取獎勵：{current}/{total}",
			"緊湊",
			"面板",
			"預設",
			"視窗位置",
			"正在檢查任務鏈：第 {pass} 輪",
			"正在讀取可用獎勵…",
			"視窗樣式",
			"頂部居中",
			"右上角",
			"已領取：{collected}；被篩選器跳過：{skipped}；錯誤：{failed}。",
			"儲存",
			"領取",
			"查詢獎勵類型",
			"全部允許",
			"自动化",
			"行為與安全",
			"獎勵設定",
			"活動中允許的類型",
			"設定已匯出。",
			"設定已匯入。",
			"這不是 HWH Rewards Manager 匯出檔案，或檔案中沒有設定。",
			"設定 JSON 已損壞。",
			"篩選器會檢查整個獎勵包。只要其中包含一種已停用類型，整個獎勵包都會保持未領取。",
			"郵件中允許的類型",
			"資訊視窗",
			"一般任務中允許的類型",
			"獎勵設定已儲存。",
			"來源",
			"HWH Rewards Manager",
			"賽季路線",
			"當前可領取的免費及已購買 Battle Pass 獎勵。",
			"活動任務",
			"Special、Battle Pass、入侵和賽季任務鏈。",
			"郵件",
			"來自 mailGetAll → mailFarm 的郵件。",
			"公會聲望",
			"聲望路線中當前可領取的等級。",
			"一般任務",
			"每日、每週、公會及一般任務。",
			"免費分階段優惠",
			"僅領取首個付費階段之前連續出現的免費階段。",
			"{name} v{version} 已連線到 HeroWarsHelper。",
			"無可領取",
			"領取後同步遊戲",
			"介面主題",
			"全部取消選擇",
			"清除搜尋",
			"沒有匹配的設定塊",
			"設定 JSON 檔案",
			"查詢設定塊",
			"全選",
			"獎勵管理器設定",
			"來源、篩選器、行為、主題和資訊視窗。",
			"排序",
			"升序",
			"按名稱",
			"降序",
			"已選項優先"
		]
	}).map(([locale, values]) => [locale, Object.fromEntries(keys.map((key, index) => {
		var _values$index;
		return [key, (_values$index = values[index]) !== null && _values$index !== void 0 ? _values$index : ""];
	}))]));
	//#endregion
	//#region src/scripts/hwhrewards/i18n/index.ts
	var HWH_REWARDS_I18N_RU = {
		HWHREWARDS_BUTTON: "Награды",
		HWHREWARDS_BUTTON_TITLE: "Собрать только награды, разрешённые в HWH Rewards Manager",
		HWHREWARDS_SETTINGS_BUTTON: "Настройки наград",
		HWHREWARDS_SETTINGS_TITLE: "HWH Rewards Manager",
		HWHREWARDS_SETTINGS_INTRO: "Фильтр проверяет награду целиком. Если в одном наборе есть хотя бы один отключённый тип, весь набор останется несобранным.",
		HWHREWARDS_SETTINGS_SOURCES: "Что собирать",
		HWHREWARDS_SETTINGS_MAIL_POLICY: "Что разрешено в письмах",
		HWHREWARDS_SETTINGS_QUEST_POLICY: "Что разрешено в обычных заданиях",
		HWHREWARDS_SETTINGS_EVENT_POLICY: "Что разрешено в событиях",
		HWHREWARDS_SETTINGS_BEHAVIOR: "Поведение и безопасность",
		HWHREWARDS_SETTINGS_AUTOMATION: "Автоматизация",
		HWHREWARDS_SETTINGS_PROGRESS: "Информационное окно",
		HWHREWARDS_POLICY_HINT: "Выбранные типы разрешены. Смешанная награда собирается только тогда, когда разрешены все её типы.",
		HWHREWARDS_SOURCE_MAIL: "Почта",
		HWHREWARDS_SOURCE_MAIL_DETAIL: "Письма из mailGetAll → mailFarm.",
		HWHREWARDS_SOURCE_REGULAR_QUESTS: "Обычные задания",
		HWHREWARDS_SOURCE_REGULAR_QUESTS_DETAIL: "Ежедневные, недельные, гильдейские и обычные задания.",
		HWHREWARDS_SOURCE_EVENT_QUESTS: "Событийные задания",
		HWHREWARDS_SOURCE_EVENT_QUESTS_DETAIL: "Special, Battle Pass, вторжения и сезонные цепочки.",
		HWHREWARDS_SOURCE_BATTLE_PASS: "Линейки сезонов",
		HWHREWARDS_SOURCE_BATTLE_PASS_DETAIL: "Доступные бесплатные и купленные награды Battle Pass.",
		HWHREWARDS_SOURCE_PRESTIGE: "Престиж гильдии",
		HWHREWARDS_SOURCE_PRESTIGE_DETAIL: "Доступные уровни шкалы престижа.",
		HWHREWARDS_SOURCE_STAGE_OFFERS: "Бесплатные этапы предложений",
		HWHREWARDS_SOURCE_STAGE_OFFERS_DETAIL: "Только последовательные бесплатные этапы до первого платного.",
		HWHREWARDS_CATEGORY_CURRENCY: "Валюты",
		HWHREWARDS_CATEGORY_CURRENCY_DETAIL: "Золото, монеты и starmoney. Изумруды внутри общих валютных наборов тоже остаются атомарными.",
		HWHREWARDS_CATEGORY_EQUIPMENT: "Предметы экипировки",
		HWHREWARDS_CATEGORY_EQUIPMENT_DETAIL: "Экипировка, свитки и их фрагменты: gear, scroll, fragmentGear, fragmentScroll.",
		HWHREWARDS_CATEGORY_ARTIFACTS: "Артефактные ресурсы",
		HWHREWARDS_CATEGORY_ARTIFACTS_DETAIL: "Фрагменты артефактов героев и титанов, включая fragmentArtifact и fragmentTitanArtifact.",
		HWHREWARDS_CATEGORY_SKINS: "Ресурсы обликов",
		HWHREWARDS_CATEGORY_SKINS_DETAIL: "Камни и фрагменты обликов fragmentSkin.",
		HWHREWARDS_CATEGORY_COSMETICS: "Оформление",
		HWHREWARDS_CATEGORY_COSMETICS_DETAIL: "Аватары, рамки, стикеры, знамёна и камни знамён гильдии.",
		HWHREWARDS_CATEGORY_PROGRESS: "Опыт и прогресс",
		HWHREWARDS_CATEGORY_PROGRESS_DETAIL: "Опыт, очки активности, Battle Pass, престиж и служебные ресурсы прогресса.",
		HWHREWARDS_CATEGORY_CONSUMABLES: "Обычные расходники",
		HWHREWARDS_CATEGORY_CONSUMABLES_DETAIL: "Все consumable, кроме отдельно вынесенных ускорителей Территории завоеваний.",
		HWHREWARDS_CATEGORY_REFILLABLES: "Перезаряжаемые ресурсы",
		HWHREWARDS_CATEGORY_REFILLABLES_DETAIL: "Все refillable, кроме отдельно вынесенных зарядов портала.",
		HWHREWARDS_CATEGORY_ENERGY_SMALL: "Энергия до 60 включительно",
		HWHREWARDS_CATEGORY_ENERGY_SMALL_DETAIL: "Небольшие порции энергии, которые Goodwin обычно тоже собирает.",
		HWHREWARDS_CATEGORY_ENERGY_LARGE: "Энергия больше 60",
		HWHREWARDS_CATEGORY_ENERGY_LARGE_DETAIL: "Крупные порции энергии — можно оставить в письме или событии на потом.",
		HWHREWARDS_CATEGORY_ENERGY_BOOST: "Ускорение восстановления энергии",
		HWHREWARDS_CATEGORY_ENERGY_BOOST_DETAIL: "Награды с полем buff.",
		HWHREWARDS_CATEGORY_PORTAL: "Заряды портала",
		HWHREWARDS_CATEGORY_PORTAL_DETAIL: "Перезаряжаемый ресурс refillable[45].",
		HWHREWARDS_CATEGORY_HERO_SOULS: "Души и наборы героев",
		HWHREWARDS_CATEGORY_HERO_SOULS_DETAIL: "fragmentHero и bundleHeroReward. Питомцы и титаны сюда больше не свалены.",
		HWHREWARDS_CATEGORY_PET_SOULS: "Души питомцев",
		HWHREWARDS_CATEGORY_PET_SOULS_DETAIL: "fragmentPet и совместимые ключи камней душ питомцев.",
		HWHREWARDS_CATEGORY_TITAN_SOULS: "Души титанов",
		HWHREWARDS_CATEGORY_TITAN_SOULS_DETAIL: "Фрагменты титанов fragmentTitan.",
		HWHREWARDS_CATEGORY_VIP: "VIP-очки",
		HWHREWARDS_CATEGORY_VIP_DETAIL: "Награды с vipPoints.",
		HWHREWARDS_CATEGORY_POWER_TOURNAMENT: "Очки Турнира мощи",
		HWHREWARDS_CATEGORY_POWER_TOURNAMENT_DETAIL: "Награды с powerTournamentCoins.",
		HWHREWARDS_CATEGORY_CONQUEST_BOOSTERS: "Ускорители и лечение в ТЗ",
		HWHREWARDS_CATEGORY_CONQUEST_BOOSTERS_DETAIL: "Расходники 401, 470, 494 и 495 для Территории завоеваний.",
		HWHREWARDS_CATEGORY_UNKNOWN: "Неизвестные типы",
		HWHREWARDS_CATEGORY_UNKNOWN_DETAIL: "Новые или пустые награды, контракт которых скрипт ещё не знает. Включать на свой страх и цирк.",
		HWHREWARDS_EXPIRING_MAIL: "Собирать истекающие письма вопреки фильтрам",
		HWHREWARDS_EXPIRING_MAIL_DETAIL: "Явный аварийный режим: если письмо скоро исчезнет, его заберут целиком даже с отключёнными ресурсами.",
		HWHREWARDS_EXPIRING_MAIL_HOURS: "Порог истечения, часов",
		HWHREWARDS_CONFIRM_BEFORE_COLLECT: "Показывать план перед сбором",
		HWHREWARDS_SYNC_AFTER_COLLECT: "Синхронизировать игру после сбора",
		HWHREWARDS_MAX_QUEST_PASSES: "Максимум проходов цепочки заданий",
		HWHREWARDS_DO_YOUR_BEST_TASK: "Сбор наград HWH Rewards Manager",
		HWHREWARDS_DO_YOUR_BEST_POSITION: "Позиция в «Сделать всё»",
		HWHREWARDS_DO_YOUR_BEST_NONE: "Не добавлять",
		HWHREWARDS_DO_YOUR_BEST_START: "В начало",
		HWHREWARDS_DO_YOUR_BEST_END: "В конец",
		HWHREWARDS_DO_YOUR_BEST_BEFORE: "Перед: {label}",
		HWHREWARDS_DO_YOUR_BEST_AFTER: "После: {label}",
		HWHREWARDS_HOTKEY_OPEN_SETTINGS: "Открыть настройки",
		HWHREWARDS_HOTKEY_COLLECT: "Собрать награды",
		HWHREWARDS_HOTKEY_EMPTY: "Не назначено",
		HWHREWARDS_HOTKEY_CAPTURE: "Записать сочетание",
		HWHREWARDS_HOTKEY_RECORDING: "Нажмите сочетание",
		HWHREWARDS_HOTKEY_CLEAR: "Очистить сочетание",
		HWHREWARDS_HOTKEY_CONFLICT: "Сочетание уже назначено",
		HWHREWARDS_THEME: "Тема интерфейса",
		HWHREWARDS_PROGRESS_AUTO_HIDE: "Скрывать результат автоматически",
		HWHREWARDS_PROGRESS_AUTO_HIDE_TIMEOUT: "Задержка скрытия, мс",
		HWHREWARDS_PROGRESS_POSITION: "Позиция окна",
		HWHREWARDS_PROGRESS_STYLE: "Стиль окна",
		HWHREWARDS_PROGRESS_TOP_CENTER: "Сверху по центру",
		HWHREWARDS_PROGRESS_TOP_RIGHT: "Сверху справа",
		HWHREWARDS_PROGRESS_BOTTOM_RIGHT: "Снизу справа",
		HWHREWARDS_PROGRESS_DEFAULT: "Обычный",
		HWHREWARDS_PROGRESS_COMPACT: "Компактный",
		HWHREWARDS_PROGRESS_DASHBOARD: "Панель",
		HWHREWARDS_EXPORT_SETTINGS: "Экспорт настроек",
		HWHREWARDS_IMPORT_SETTINGS: "Импорт настроек",
		HWHREWARDS_DOCS_TITLE: "Документация",
		HWHREWARDS_DOCS_TEXT: "Инструкция, устройство фильтра и актуальные сборки HWH Rewards Manager.",
		HWHREWARDS_DOCS_PRIMARY: "Документация проекта",
		HWHREWARDS_DOCS_MIRROR: "Зеркало документации {number}",
		HWHREWARDS_DONATE_TITLE: "Поддержать проект",
		HWHREWARDS_DONATE_TEXT: "Если менеджер сберёг нужную награду и пару нервных клеток — проект можно поддержать.",
		HWHREWARDS_DONATE_WALLET: "Кошелёк: {wallet}",
		HWHREWARDS_DONATE_QR_ALT: "QR-код поддержки HWH Rewards Manager",
		HWHREWARDS_DONATE_QR_LABEL: "Отсканировать QR-код",
		HWHREWARDS_SAVE: "Сохранить",
		HWHREWARDS_SAVE_AND_RUN: "Собрать",
		HWHREWARDS_COLLECT: "Собрать",
		HWHREWARDS_CANCEL: "Отмена",
		HWHREWARDS_CLOSE: "Закрыть",
		HWHREWARDS_SELECT_ALL: "Разрешить всё",
		HWHREWARDS_CLEAR_ALL: "Запретить всё",
		HWHREWARDS_SEARCH: "Найти тип награды",
		HWHREWARDS_EMPTY: "Ничего не найдено",
		HWHREWARDS_SETTINGS_SAVED: "Настройки наград сохранены.",
		HWHREWARDS_TRANSFER_SETTINGS: "Настройки менеджера наград",
		HWHREWARDS_TRANSFER_SETTINGS_TITLE: "Источники, фильтры, поведение, тема и информационное окно.",
		HWHREWARDS_TRANSFER_FILE_LABEL: "JSON-файл настроек",
		HWHREWARDS_TRANSFER_SEARCH: "Найти блок",
		HWHREWARDS_TRANSFER_CLEAR_SEARCH: "Очистить поиск",
		HWHREWARDS_TRANSFER_EMPTY: "Подходящих блоков нет",
		HWHREWARDS_TRANSFER_SELECT_ALL: "Выбрать всё",
		HWHREWARDS_TRANSFER_CLEAR_ALL: "Снять всё",
		HWHREWARDS_TRANSFER_SORT: "Сортировка",
		HWHREWARDS_TRANSFER_SORT_BY_NAME: "По названию",
		HWHREWARDS_TRANSFER_SORT_SELECTED: "Выбранные сверху",
		HWHREWARDS_TRANSFER_SORT_ASC: "По возрастанию",
		HWHREWARDS_TRANSFER_SORT_DESC: "По убыванию",
		HWHREWARDS_SETTINGS_EXPORT_DONE: "Настройки экспортированы.",
		HWHREWARDS_SETTINGS_IMPORT_DONE: "Настройки импортированы.",
		HWHREWARDS_SETTINGS_IMPORT_PARSE_ERROR: "JSON настроек повреждён.",
		HWHREWARDS_SETTINGS_IMPORT_INVALID: "Это не экспорт HWH Rewards Manager или в нём нет настроек.",
		HWHREWARDS_CONFIRM_TITLE: "План сбора наград",
		HWHREWARDS_CONFIRM_NOTE: "Запросы изменения состояния не повторяются автоматически. Проверьте план и запускайте сбор.",
		HWHREWARDS_PLAN_SELECTED: "Будет собрано: {count}",
		HWHREWARDS_PLAN_SKIPPED: "Останется: {count}",
		HWHREWARDS_PLAN_REWARDS: "Что придёт",
		HWHREWARDS_PLAN_REQUIREMENT: "Заданий пропуска, которые сервер не отдаст (нужен билет или уровень, либо пропуск закончился): {count}.",
		HWHREWARDS_PLAN_NEEDS_CHOICE: "Уровней пропуска с выбором награды: {count}. Заберите их в окне пропуска.",
		HWHREWARDS_PLAN_UNKNOWN: "Новые типы наград пока запрещены: {keys}. Включите категорию «Неизвестные типы», чтобы собирать их.",
		HWHREWARDS_PLAN_SOURCE_MAIL: "Письма",
		HWHREWARDS_PLAN_SOURCE_REGULAR_QUEST: "Обычные задания",
		HWHREWARDS_PLAN_SOURCE_EVENT_QUEST: "Событийные задания",
		HWHREWARDS_PLAN_SOURCE_BATTLE_PASS: "Линейки сезонов",
		HWHREWARDS_PLAN_SOURCE_PRESTIGE: "Престиж",
		HWHREWARDS_PLAN_SOURCE_STAGE_OFFER: "Этапы предложений",
		HWHREWARDS_PROGRESS_SCAN: "Читаю доступные награды…",
		HWHREWARDS_PROGRESS_COLLECT: "Собираю награды: {current}/{total}",
		HWHREWARDS_PROGRESS_QUEST_PASS: "Проверяю продолжение цепочек: проход {pass}",
		HWHREWARDS_NOTHING: "По текущим фильтрам собирать нечего.",
		HWHREWARDS_STATUS_NOTHING: "Нечего собирать",
		HWHREWARDS_RESULT: "Собрано: {collected}; пропущено фильтром: {skipped}; ошибок: {failed}.",
		HWHREWARDS_ERROR: "Сбор наград сломался: {message}",
		HWHREWARDS_PATCH_FAILED: "Не удалось заменить кнопку HeroWarsHelper. Версия Helper могла поменять контракт.",
		HWHREWARDS_START_LOG: "{name} v{version} подключён к HeroWarsHelper."
	};
	var HWH_REWARDS_I18N_EN = {
		HWHREWARDS_BUTTON: "Rewards",
		HWHREWARDS_BUTTON_TITLE: "Collect only rewards allowed by HWH Rewards Manager",
		HWHREWARDS_SETTINGS_BUTTON: "Reward settings",
		HWHREWARDS_SETTINGS_TITLE: "HWH Rewards Manager",
		HWHREWARDS_SETTINGS_INTRO: "The filter evaluates the whole reward bundle. If one disabled type is present, the entire bundle stays unclaimed.",
		HWHREWARDS_SETTINGS_SOURCES: "Sources",
		HWHREWARDS_SETTINGS_MAIL_POLICY: "Allowed in mail",
		HWHREWARDS_SETTINGS_QUEST_POLICY: "Allowed in regular quests",
		HWHREWARDS_SETTINGS_EVENT_POLICY: "Allowed in events",
		HWHREWARDS_SETTINGS_BEHAVIOR: "Behavior and safety",
		HWHREWARDS_SETTINGS_AUTOMATION: "Automation",
		HWHREWARDS_SETTINGS_PROGRESS: "Information window",
		HWHREWARDS_POLICY_HINT: "Selected types are allowed. A mixed bundle is collected only when every type in it is allowed.",
		HWHREWARDS_SOURCE_MAIL: "Mail",
		HWHREWARDS_SOURCE_MAIL_DETAIL: "Letters from mailGetAll → mailFarm.",
		HWHREWARDS_SOURCE_REGULAR_QUESTS: "Regular quests",
		HWHREWARDS_SOURCE_REGULAR_QUESTS_DETAIL: "Daily, weekly, guild, and ordinary quests.",
		HWHREWARDS_SOURCE_EVENT_QUESTS: "Event quests",
		HWHREWARDS_SOURCE_EVENT_QUESTS_DETAIL: "Special, Battle Pass, invasion, and seasonal chains.",
		HWHREWARDS_SOURCE_BATTLE_PASS: "Season tracks",
		HWHREWARDS_SOURCE_BATTLE_PASS_DETAIL: "Available free and purchased Battle Pass rewards.",
		HWHREWARDS_SOURCE_PRESTIGE: "Guild prestige",
		HWHREWARDS_SOURCE_PRESTIGE_DETAIL: "Available prestige track levels.",
		HWHREWARDS_SOURCE_STAGE_OFFERS: "Free staged offers",
		HWHREWARDS_SOURCE_STAGE_OFFERS_DETAIL: "Only consecutive free stages before the first paid stage.",
		HWHREWARDS_CATEGORY_CURRENCY: "Currencies",
		HWHREWARDS_CATEGORY_CURRENCY_DETAIL: "Gold, coins, and starmoney. Currency bundles remain atomic.",
		HWHREWARDS_CATEGORY_EQUIPMENT: "Equipment items",
		HWHREWARDS_CATEGORY_EQUIPMENT_DETAIL: "Equipment, scrolls, and their fragments: gear, scroll, fragmentGear, fragmentScroll.",
		HWHREWARDS_CATEGORY_ARTIFACTS: "Artifact resources",
		HWHREWARDS_CATEGORY_ARTIFACTS_DETAIL: "Hero and titan artifact fragments, including fragmentArtifact and fragmentTitanArtifact.",
		HWHREWARDS_CATEGORY_SKINS: "Skin resources",
		HWHREWARDS_CATEGORY_SKINS_DETAIL: "Skin resources stored in fragmentSkin.",
		HWHREWARDS_CATEGORY_COSMETICS: "Cosmetics",
		HWHREWARDS_CATEGORY_COSMETICS_DETAIL: "Avatars, frames, stickers, guild banners and banner stones.",
		HWHREWARDS_CATEGORY_PROGRESS: "Experience and progress",
		HWHREWARDS_CATEGORY_PROGRESS_DETAIL: "Experience, activity, Battle Pass, prestige, and service progress resources.",
		HWHREWARDS_CATEGORY_CONSUMABLES: "Regular consumables",
		HWHREWARDS_CATEGORY_CONSUMABLES_DETAIL: "All consumables except the separately controlled Area of Conquest boosters.",
		HWHREWARDS_CATEGORY_REFILLABLES: "Refillable resources",
		HWHREWARDS_CATEGORY_REFILLABLES_DETAIL: "All refillables except the separately controlled portal charges.",
		HWHREWARDS_CATEGORY_ENERGY_SMALL: "Energy up to 60",
		HWHREWARDS_CATEGORY_ENERGY_SMALL_DETAIL: "Small energy rewards that Goodwin normally collects too.",
		HWHREWARDS_CATEGORY_ENERGY_LARGE: "Energy above 60",
		HWHREWARDS_CATEGORY_ENERGY_LARGE_DETAIL: "Large energy rewards that can be kept for later.",
		HWHREWARDS_CATEGORY_ENERGY_BOOST: "Energy regeneration boost",
		HWHREWARDS_CATEGORY_ENERGY_BOOST_DETAIL: "Rewards containing buff.",
		HWHREWARDS_CATEGORY_PORTAL: "Portal charges",
		HWHREWARDS_CATEGORY_PORTAL_DETAIL: "Refillable resource refillable[45].",
		HWHREWARDS_CATEGORY_HERO_SOULS: "Hero souls and bundles",
		HWHREWARDS_CATEGORY_HERO_SOULS_DETAIL: "fragmentHero and bundleHeroReward. Pet and titan souls are controlled separately.",
		HWHREWARDS_CATEGORY_PET_SOULS: "Pet souls",
		HWHREWARDS_CATEGORY_PET_SOULS_DETAIL: "fragmentPet and compatible pet soul-stone keys.",
		HWHREWARDS_CATEGORY_TITAN_SOULS: "Titan souls",
		HWHREWARDS_CATEGORY_TITAN_SOULS_DETAIL: "Titan fragments in fragmentTitan.",
		HWHREWARDS_CATEGORY_VIP: "VIP points",
		HWHREWARDS_CATEGORY_VIP_DETAIL: "Rewards containing vipPoints.",
		HWHREWARDS_CATEGORY_POWER_TOURNAMENT: "Tournament of Power points",
		HWHREWARDS_CATEGORY_POWER_TOURNAMENT_DETAIL: "Rewards containing powerTournamentCoins.",
		HWHREWARDS_CATEGORY_CONQUEST_BOOSTERS: "AoC boosters and healing",
		HWHREWARDS_CATEGORY_CONQUEST_BOOSTERS_DETAIL: "Consumables 401, 470, 494, and 495 used in Area of Conquest.",
		HWHREWARDS_CATEGORY_UNKNOWN: "Unknown reward types",
		HWHREWARDS_CATEGORY_UNKNOWN_DETAIL: "New or empty rewards whose contract is not known yet. Enable at your own risk.",
		HWHREWARDS_EXPIRING_MAIL: "Collect expiring mail despite filters",
		HWHREWARDS_EXPIRING_MAIL_DETAIL: "Explicit emergency mode: an expiring letter is claimed in full even when it contains disabled resources.",
		HWHREWARDS_EXPIRING_MAIL_HOURS: "Expiry threshold, hours",
		HWHREWARDS_CONFIRM_BEFORE_COLLECT: "Show plan before collection",
		HWHREWARDS_SYNC_AFTER_COLLECT: "Synchronize the game after collection",
		HWHREWARDS_MAX_QUEST_PASSES: "Maximum chained quest passes",
		HWHREWARDS_DO_YOUR_BEST_TASK: "Collect rewards with HWH Rewards Manager",
		HWHREWARDS_DO_YOUR_BEST_POSITION: "Position in Do Everything",
		HWHREWARDS_DO_YOUR_BEST_NONE: "Do not add",
		HWHREWARDS_DO_YOUR_BEST_START: "At the top",
		HWHREWARDS_DO_YOUR_BEST_END: "At the bottom",
		HWHREWARDS_DO_YOUR_BEST_BEFORE: "Before: {label}",
		HWHREWARDS_DO_YOUR_BEST_AFTER: "After: {label}",
		HWHREWARDS_HOTKEY_OPEN_SETTINGS: "Open settings",
		HWHREWARDS_HOTKEY_COLLECT: "Collect rewards",
		HWHREWARDS_HOTKEY_EMPTY: "Not assigned",
		HWHREWARDS_HOTKEY_CAPTURE: "Record shortcut",
		HWHREWARDS_HOTKEY_RECORDING: "Press a shortcut",
		HWHREWARDS_HOTKEY_CLEAR: "Clear shortcut",
		HWHREWARDS_HOTKEY_CONFLICT: "Shortcut is already assigned",
		HWHREWARDS_THEME: "Interface theme",
		HWHREWARDS_PROGRESS_AUTO_HIDE: "Hide the result automatically",
		HWHREWARDS_PROGRESS_AUTO_HIDE_TIMEOUT: "Hide delay, ms",
		HWHREWARDS_PROGRESS_POSITION: "Window position",
		HWHREWARDS_PROGRESS_STYLE: "Window style",
		HWHREWARDS_PROGRESS_TOP_CENTER: "Top center",
		HWHREWARDS_PROGRESS_TOP_RIGHT: "Top right",
		HWHREWARDS_PROGRESS_BOTTOM_RIGHT: "Bottom right",
		HWHREWARDS_PROGRESS_DEFAULT: "Default",
		HWHREWARDS_PROGRESS_COMPACT: "Compact",
		HWHREWARDS_PROGRESS_DASHBOARD: "Dashboard",
		HWHREWARDS_EXPORT_SETTINGS: "Export settings",
		HWHREWARDS_IMPORT_SETTINGS: "Import settings",
		HWHREWARDS_DOCS_TITLE: "Documentation",
		HWHREWARDS_DOCS_TEXT: "User guide, filter behavior, and current HWH Rewards Manager builds.",
		HWHREWARDS_DOCS_PRIMARY: "Project documentation",
		HWHREWARDS_DOCS_MIRROR: "Documentation mirror {number}",
		HWHREWARDS_DONATE_TITLE: "Support the project",
		HWHREWARDS_DONATE_TEXT: "If the manager saved a reward and a few nerve cells, you can support the project.",
		HWHREWARDS_DONATE_WALLET: "Wallet: {wallet}",
		HWHREWARDS_DONATE_QR_ALT: "HWH Rewards Manager support QR code",
		HWHREWARDS_DONATE_QR_LABEL: "Scan the QR code",
		HWHREWARDS_SAVE: "Save",
		HWHREWARDS_SAVE_AND_RUN: "Collect",
		HWHREWARDS_COLLECT: "Collect",
		HWHREWARDS_CANCEL: "Cancel",
		HWHREWARDS_CLOSE: "Close",
		HWHREWARDS_SELECT_ALL: "Allow all",
		HWHREWARDS_CLEAR_ALL: "Block all",
		HWHREWARDS_SEARCH: "Find reward type",
		HWHREWARDS_EMPTY: "Nothing found",
		HWHREWARDS_SETTINGS_SAVED: "Reward settings saved.",
		HWHREWARDS_TRANSFER_SETTINGS: "Reward manager settings",
		HWHREWARDS_TRANSFER_SETTINGS_TITLE: "Sources, filters, behavior, theme, and information window.",
		HWHREWARDS_TRANSFER_FILE_LABEL: "Settings JSON file",
		HWHREWARDS_TRANSFER_SEARCH: "Find a block",
		HWHREWARDS_TRANSFER_CLEAR_SEARCH: "Clear search",
		HWHREWARDS_TRANSFER_EMPTY: "No matching blocks",
		HWHREWARDS_TRANSFER_SELECT_ALL: "Select all",
		HWHREWARDS_TRANSFER_CLEAR_ALL: "Clear all",
		HWHREWARDS_TRANSFER_SORT: "Sort",
		HWHREWARDS_TRANSFER_SORT_BY_NAME: "By name",
		HWHREWARDS_TRANSFER_SORT_SELECTED: "Selected first",
		HWHREWARDS_TRANSFER_SORT_ASC: "Ascending",
		HWHREWARDS_TRANSFER_SORT_DESC: "Descending",
		HWHREWARDS_SETTINGS_EXPORT_DONE: "Settings exported.",
		HWHREWARDS_SETTINGS_IMPORT_DONE: "Settings imported.",
		HWHREWARDS_SETTINGS_IMPORT_PARSE_ERROR: "The settings JSON is damaged.",
		HWHREWARDS_SETTINGS_IMPORT_INVALID: "This is not an HWH Rewards Manager export or it has no settings.",
		HWHREWARDS_CONFIRM_TITLE: "Reward collection plan",
		HWHREWARDS_CONFIRM_NOTE: "State-changing requests are never retried automatically. Review the plan before collection.",
		HWHREWARDS_PLAN_SELECTED: "Will collect: {count}",
		HWHREWARDS_PLAN_SKIPPED: "Will remain: {count}",
		HWHREWARDS_PLAN_REWARDS: "You will get",
		HWHREWARDS_PLAN_REQUIREMENT: "Pass tasks the server will not pay out (ticket or level required, or the pass has ended): {count}.",
		HWHREWARDS_PLAN_NEEDS_CHOICE: "Pass levels with a reward choice: {count}. Claim them in the pass window.",
		HWHREWARDS_PLAN_UNKNOWN: "New reward types are blocked for now: {keys}. Enable the “Unknown reward types” category to collect them.",
		HWHREWARDS_PLAN_SOURCE_MAIL: "Letters",
		HWHREWARDS_PLAN_SOURCE_REGULAR_QUEST: "Regular quests",
		HWHREWARDS_PLAN_SOURCE_EVENT_QUEST: "Event quests",
		HWHREWARDS_PLAN_SOURCE_BATTLE_PASS: "Season tracks",
		HWHREWARDS_PLAN_SOURCE_PRESTIGE: "Prestige",
		HWHREWARDS_PLAN_SOURCE_STAGE_OFFER: "Offer stages",
		HWHREWARDS_PROGRESS_SCAN: "Reading available rewards…",
		HWHREWARDS_PROGRESS_COLLECT: "Collecting rewards: {current}/{total}",
		HWHREWARDS_PROGRESS_QUEST_PASS: "Checking chained quests: pass {pass}",
		HWHREWARDS_NOTHING: "There is nothing to collect with the current filters.",
		HWHREWARDS_STATUS_NOTHING: "Nothing to collect",
		HWHREWARDS_RESULT: "Collected: {collected}; skipped by filters: {skipped}; errors: {failed}.",
		HWHREWARDS_ERROR: "Reward collection failed: {message}",
		HWHREWARDS_PATCH_FAILED: "Could not replace the HeroWarsHelper button. The Helper runtime contract may have changed.",
		HWHREWARDS_START_LOG: "{name} v{version} connected to HeroWarsHelper."
	};
	function getRewardsManagerTranslations(scriptId = "hwhrewards-lite") {
		return getScriptTranslations({
			ru: HWH_REWARDS_I18N_RU,
			en: HWH_REWARDS_I18N_EN,
			...rewardsManagerI18nGenerated
		}, { scriptId });
	}
	//#endregion
	//#region src/scripts/hwhrewards/core/constants.ts
	var REWARDS_SETTINGS_KEY = "hwhrewards-settings-";
	var REWARDS_HELPER_BUTTON_KEY = "rewardsAndMailFarm";
	var REWARDS_PATCH_MARKER = "hwhRewardsManager";
	var REWARDS_DO_YOUR_BEST_TASK_NAME = "hwhRewardsManagerCollect";
	var CONQUEST_BOOSTER_CONSUMABLE_IDS = /* @__PURE__ */ new Set([
		401,
		470,
		494,
		495
	]);
	var REWARD_CATEGORY_IDS = [
		"currency",
		"equipment",
		"artifacts",
		"skins",
		"cosmetics",
		"progressResources",
		"consumables",
		"refillables",
		"energySmall",
		"energyLarge",
		"energyBoost",
		"portalCharge",
		"heroSoul",
		"petSoul",
		"titanSoul",
		"vipPoints",
		"powerTournamentPoints",
		"conquestBoosters",
		"unknown"
	];
	var REWARD_SOURCE_IDS = [
		"mail",
		"regularQuest",
		"eventQuest",
		"battlePass",
		"prestige",
		"stageOffer"
	];
	var REWARD_CATEGORY_DESCRIPTORS = [
		{
			id: "currency",
			labelKey: "HWHREWARDS_CATEGORY_CURRENCY",
			detailKey: "HWHREWARDS_CATEGORY_CURRENCY_DETAIL",
			icon: "coins"
		},
		{
			id: "equipment",
			labelKey: "HWHREWARDS_CATEGORY_EQUIPMENT",
			detailKey: "HWHREWARDS_CATEGORY_EQUIPMENT_DETAIL",
			icon: "package-check"
		},
		{
			id: "artifacts",
			labelKey: "HWHREWARDS_CATEGORY_ARTIFACTS",
			detailKey: "HWHREWARDS_CATEGORY_ARTIFACTS_DETAIL",
			icon: "gem"
		},
		{
			id: "skins",
			labelKey: "HWHREWARDS_CATEGORY_SKINS",
			detailKey: "HWHREWARDS_CATEGORY_SKINS_DETAIL",
			icon: "sparkles"
		},
		{
			id: "cosmetics",
			labelKey: "HWHREWARDS_CATEGORY_COSMETICS",
			detailKey: "HWHREWARDS_CATEGORY_COSMETICS_DETAIL",
			icon: "palette"
		},
		{
			id: "progressResources",
			labelKey: "HWHREWARDS_CATEGORY_PROGRESS",
			detailKey: "HWHREWARDS_CATEGORY_PROGRESS_DETAIL",
			icon: "chart-no-axes-combined"
		},
		{
			id: "consumables",
			labelKey: "HWHREWARDS_CATEGORY_CONSUMABLES",
			detailKey: "HWHREWARDS_CATEGORY_CONSUMABLES_DETAIL",
			icon: "flask-conical"
		},
		{
			id: "refillables",
			labelKey: "HWHREWARDS_CATEGORY_REFILLABLES",
			detailKey: "HWHREWARDS_CATEGORY_REFILLABLES_DETAIL",
			icon: "repeat-2"
		},
		{
			id: "energySmall",
			labelKey: "HWHREWARDS_CATEGORY_ENERGY_SMALL",
			detailKey: "HWHREWARDS_CATEGORY_ENERGY_SMALL_DETAIL",
			icon: "battery-charging"
		},
		{
			id: "energyLarge",
			labelKey: "HWHREWARDS_CATEGORY_ENERGY_LARGE",
			detailKey: "HWHREWARDS_CATEGORY_ENERGY_LARGE_DETAIL",
			icon: "battery-full"
		},
		{
			id: "energyBoost",
			labelKey: "HWHREWARDS_CATEGORY_ENERGY_BOOST",
			detailKey: "HWHREWARDS_CATEGORY_ENERGY_BOOST_DETAIL",
			icon: "zap"
		},
		{
			id: "portalCharge",
			labelKey: "HWHREWARDS_CATEGORY_PORTAL",
			detailKey: "HWHREWARDS_CATEGORY_PORTAL_DETAIL",
			icon: "orbit"
		},
		{
			id: "heroSoul",
			labelKey: "HWHREWARDS_CATEGORY_HERO_SOULS",
			detailKey: "HWHREWARDS_CATEGORY_HERO_SOULS_DETAIL",
			icon: "users-round"
		},
		{
			id: "petSoul",
			labelKey: "HWHREWARDS_CATEGORY_PET_SOULS",
			detailKey: "HWHREWARDS_CATEGORY_PET_SOULS_DETAIL",
			icon: "paw-print"
		},
		{
			id: "titanSoul",
			labelKey: "HWHREWARDS_CATEGORY_TITAN_SOULS",
			detailKey: "HWHREWARDS_CATEGORY_TITAN_SOULS_DETAIL",
			icon: "shield"
		},
		{
			id: "vipPoints",
			labelKey: "HWHREWARDS_CATEGORY_VIP",
			detailKey: "HWHREWARDS_CATEGORY_VIP_DETAIL",
			icon: "crown"
		},
		{
			id: "powerTournamentPoints",
			labelKey: "HWHREWARDS_CATEGORY_POWER_TOURNAMENT",
			detailKey: "HWHREWARDS_CATEGORY_POWER_TOURNAMENT_DETAIL",
			icon: "trophy"
		},
		{
			id: "conquestBoosters",
			labelKey: "HWHREWARDS_CATEGORY_CONQUEST_BOOSTERS",
			detailKey: "HWHREWARDS_CATEGORY_CONQUEST_BOOSTERS_DETAIL",
			icon: "flask-conical"
		},
		{
			id: "unknown",
			labelKey: "HWHREWARDS_CATEGORY_UNKNOWN",
			detailKey: "HWHREWARDS_CATEGORY_UNKNOWN_DETAIL",
			icon: "circle-help"
		}
	];
	var REWARD_SOURCE_DESCRIPTORS = [
		{
			id: "mail",
			labelKey: "HWHREWARDS_SOURCE_MAIL",
			detailKey: "HWHREWARDS_SOURCE_MAIL_DETAIL",
			icon: "mail"
		},
		{
			id: "regularQuests",
			labelKey: "HWHREWARDS_SOURCE_REGULAR_QUESTS",
			detailKey: "HWHREWARDS_SOURCE_REGULAR_QUESTS_DETAIL",
			icon: "list-checks"
		},
		{
			id: "eventQuests",
			labelKey: "HWHREWARDS_SOURCE_EVENT_QUESTS",
			detailKey: "HWHREWARDS_SOURCE_EVENT_QUESTS_DETAIL",
			icon: "calendar-days"
		},
		{
			id: "battlePass",
			labelKey: "HWHREWARDS_SOURCE_BATTLE_PASS",
			detailKey: "HWHREWARDS_SOURCE_BATTLE_PASS_DETAIL",
			icon: "trophy"
		},
		{
			id: "prestige",
			labelKey: "HWHREWARDS_SOURCE_PRESTIGE",
			detailKey: "HWHREWARDS_SOURCE_PRESTIGE_DETAIL",
			icon: "crown"
		},
		{
			id: "stageOffers",
			labelKey: "HWHREWARDS_SOURCE_STAGE_OFFERS",
			detailKey: "HWHREWARDS_SOURCE_STAGE_OFFERS_DETAIL",
			icon: "gift"
		}
	];
	var EVENT_QUEST_LIBRARY_BRANCHES = [
		"battlePass",
		"invasion",
		"samurai",
		"special"
	];
	//#endregion
	//#region src/shared/ui/hotkeys.ts
	var MODIFIER_CODES = /* @__PURE__ */ new Set([
		"AltLeft",
		"AltRight",
		"ControlLeft",
		"ControlRight",
		"MetaLeft",
		"MetaRight",
		"ShiftLeft",
		"ShiftRight"
	]);
	var MODIFIER_ALIASES = {
		alt: "Alt",
		cmd: "Meta",
		command: "Meta",
		control: "Ctrl",
		ctrl: "Ctrl",
		meta: "Meta",
		option: "Alt",
		shift: "Shift",
		win: "Meta",
		windows: "Meta"
	};
	var CODE_LABELS = {
		ArrowDown: "Down",
		ArrowLeft: "Left",
		ArrowRight: "Right",
		ArrowUp: "Up",
		Backquote: "`",
		Backslash: "\\",
		BracketLeft: "[",
		BracketRight: "]",
		Comma: ",",
		Equal: "=",
		Minus: "-",
		Period: ".",
		Quote: "'",
		Semicolon: ";",
		Slash: "/",
		Space: "Space"
	};
	var HOTKEY_NORMALIZATION_CACHE_LIMIT = 256;
	var normalizedHotkeyCache = /* @__PURE__ */ new Map();
	function normalizeCode(value) {
		const code = String(value !== null && value !== void 0 ? value : "").trim();
		if (!code || MODIFIER_CODES.has(code)) return "";
		if (/^Key[A-Z]$/.test(code) || /^Digit\d$/.test(code) || /^F(?:[1-9]|1[0-2])$/.test(code)) return code;
		return /^[A-Za-z][A-Za-z0-9]*$/.test(code) ? code : "";
	}
	function normalizeHotkey(value) {
		const source = String(value !== null && value !== void 0 ? value : "").trim();
		const cachedValue = normalizedHotkeyCache.get(source);
		if (cachedValue !== void 0) return cachedValue;
		const parts = source.split("+").map((part) => part.trim()).filter(Boolean);
		if (parts.length === 0) return cacheNormalizedHotkey(source, "");
		const modifiers = /* @__PURE__ */ new Set();
		let code = "";
		for (const part of parts) {
			const modifier = MODIFIER_ALIASES[part.toLowerCase()];
			if (modifier) {
				modifiers.add(modifier);
				continue;
			}
			code = normalizeCode(part);
		}
		if (!code) return cacheNormalizedHotkey(source, "");
		return cacheNormalizedHotkey(source, [
			"Ctrl",
			"Alt",
			"Shift",
			"Meta"
		].filter((modifier) => modifiers.has(modifier)).concat(code).join("+"));
	}
	function cacheNormalizedHotkey(source, normalized) {
		if (normalizedHotkeyCache.size >= HOTKEY_NORMALIZATION_CACHE_LIMIT) normalizedHotkeyCache.clear();
		normalizedHotkeyCache.set(source, normalized);
		return normalized;
	}
	function normalizeHotkeyMap(value, defaults = {}) {
		const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
		const result = {};
		for (const key of /* @__PURE__ */ new Set([...Object.keys(defaults), ...Object.keys(source)])) {
			var _source$normalizedKey;
			const normalizedKey = String(key).trim();
			if (!normalizedKey) continue;
			result[normalizedKey] = normalizeHotkey((_source$normalizedKey = source[normalizedKey]) !== null && _source$normalizedKey !== void 0 ? _source$normalizedKey : defaults[key]);
		}
		return result;
	}
	function hotkeyFromKeyboardEvent(event) {
		var _event$getModifierSta;
		if (event.isComposing || ((_event$getModifierSta = event.getModifierState) === null || _event$getModifierSta === void 0 ? void 0 : _event$getModifierSta.call(event, "AltGraph"))) return "";
		const code = normalizeCode(event.code || event.key);
		if (!code) return "";
		const modifiers = [
			event.ctrlKey ? "Ctrl" : "",
			event.altKey ? "Alt" : "",
			event.shiftKey ? "Shift" : "",
			event.metaKey ? "Meta" : ""
		].filter(Boolean);
		if (modifiers.length === 0 && !/^F(?:[1-9]|1[0-2])$/.test(code)) return "";
		return [...modifiers, code].join("+");
	}
	function formatHotkey(value) {
		const hotkey = normalizeHotkey(value);
		if (!hotkey) return "";
		return hotkey.split("+").map((part) => {
			var _CODE_LABELS$part;
			if (/^Key[A-Z]$/.test(part)) return part.slice(3);
			if (/^Digit\d$/.test(part)) return part.slice(5);
			return (_CODE_LABELS$part = CODE_LABELS[part]) !== null && _CODE_LABELS$part !== void 0 ? _CODE_LABELS$part : part;
		}).join(" + ");
	}
	function isEditableHotkeyTarget(target) {
		if (typeof Element === "undefined" || !(target instanceof Element)) return false;
		return !!target.closest("input,select,textarea,[contenteditable=\"true\"],[data-hwhx-hotkey-capture=\"1\"]");
	}
	function isBindingEnabled(binding) {
		return typeof binding.enabled === "function" ? binding.enabled() : binding.enabled !== false;
	}
	function createRegistry() {
		const registry = { scopes: /* @__PURE__ */ new Map() };
		globalThis.addEventListener("keydown", (event) => {
			const keyboardEvent = event;
			if (keyboardEvent.defaultPrevented || keyboardEvent.repeat || keyboardEvent.isComposing || isEditableHotkeyTarget(keyboardEvent.target)) return;
			const pressedHotkey = hotkeyFromKeyboardEvent(keyboardEvent);
			if (!pressedHotkey) return;
			let match = null;
			let conflictIds = null;
			for (const scope of registry.scopes.values()) for (const binding of scope.getBindings()) {
				if (normalizeHotkey(binding.shortcut) !== pressedHotkey || !isBindingEnabled(binding)) continue;
				if (match) {
					var _conflictIds;
					(_conflictIds = conflictIds) !== null && _conflictIds !== void 0 || (conflictIds = [match.id]);
					conflictIds.push(binding.id);
				} else match = binding;
			}
			if (!match || conflictIds) {
				if (conflictIds) console.warn(`[hwhx] hotkey conflict: ${pressedHotkey}`, conflictIds);
				return;
			}
			keyboardEvent.preventDefault();
			keyboardEvent.stopPropagation();
			Promise.resolve(match.handler(keyboardEvent)).catch((error) => {
				console.error(`[hwhx] hotkey failed: ${match.id}`, error);
			});
		}, true);
		return registry;
	}
	function getRegistry() {
		var _host$__hwhxHotkeyReg;
		const host = globalThis;
		(_host$__hwhxHotkeyReg = host.__hwhxHotkeyRegistryV1) !== null && _host$__hwhxHotkeyReg !== void 0 || (host.__hwhxHotkeyRegistryV1 = createRegistry());
		return host.__hwhxHotkeyRegistryV1;
	}
	function registerHotkeyScope(scopeId, scope) {
		const normalizedScopeId = String(scopeId !== null && scopeId !== void 0 ? scopeId : "").trim();
		if (!normalizedScopeId) throw new Error("Hotkey scope id is required");
		const registry = getRegistry();
		registry.scopes.set(normalizedScopeId, scope);
		return () => {
			if (registry.scopes.get(normalizedScopeId) === scope) registry.scopes.delete(normalizedScopeId);
		};
	}
	//#endregion
	//#region src/shared/ui/lite/theme.ts
	var UI_THEME_DARK = "dark";
	var UI_THEME_LIGHT = "light";
	var UI_THEME_AUTO = "auto";
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
		const source = asPlainRecord(value);
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
	//#region src/scripts/hwhrewards/settings/schema.ts
	var DEFAULT_ALLOWED_CATEGORIES = [
		"currency",
		"equipment",
		"artifacts",
		"skins",
		"cosmetics",
		"progressResources",
		"consumables",
		"refillables",
		"energySmall"
	];
	var LEGACY_REGULAR_CATEGORIES = DEFAULT_ALLOWED_CATEGORIES.filter((category) => category !== "energySmall" && category !== "cosmetics");
	var LEGACY_SOUL_CATEGORIES = [
		"heroSoul",
		"petSoul",
		"titanSoul"
	];
	var categoryIds = new Set(REWARD_CATEGORY_IDS);
	var DEFAULT_REWARDS_SOURCE_SETTINGS = {
		mail: true,
		regularQuests: true,
		eventQuests: true,
		battlePass: true,
		prestige: true,
		stageOffers: true
	};
	var DEFAULT_REWARDS_POLICY_SETTINGS = {
		mail: [...DEFAULT_ALLOWED_CATEGORIES],
		quest: [...DEFAULT_ALLOWED_CATEGORIES],
		event: [...DEFAULT_ALLOWED_CATEGORIES]
	};
	var DEFAULT_REWARDS_HOTKEY_SETTINGS = {
		openSettings: "",
		collectRewards: ""
	};
	var DEFAULT_REWARDS_MANAGER_SETTINGS = {
		rewardPolicyVersion: 3,
		uiTheme: "dominion",
		sources: { ...DEFAULT_REWARDS_SOURCE_SETTINGS },
		policies: {
			mail: [...DEFAULT_REWARDS_POLICY_SETTINGS.mail],
			quest: [...DEFAULT_REWARDS_POLICY_SETTINGS.quest],
			event: [...DEFAULT_REWARDS_POLICY_SETTINGS.event]
		},
		collectExpiringMail: false,
		expiringMailHours: 24,
		confirmBeforeCollect: true,
		syncAfterCollect: false,
		maxQuestPasses: 5,
		doYourBestPlacement: "end",
		hotkeys: { ...DEFAULT_REWARDS_HOTKEY_SETTINGS },
		...DEFAULT_PROGRESS_WINDOW_SETTINGS
	};
	function normalizeRewardsManagerSettings(value) {
		var _source$uiTheme;
		const source = asPlainRecord(value);
		const rawSources = asPlainRecord(source.sources);
		const rawPolicies = asPlainRecord(source.policies);
		const policyVersion = Number(source.rewardPolicyVersion) || 0;
		const legacyPolicy = policyVersion < 2;
		const addCosmetics = policyVersion < 3;
		const progress = normalizeProgressWindowSettings(source);
		return {
			rewardPolicyVersion: 3,
			uiTheme: normalizeUiTheme((_source$uiTheme = source.uiTheme) !== null && _source$uiTheme !== void 0 ? _source$uiTheme : "dominion"),
			sources: normalizeSources(rawSources),
			policies: {
				mail: normalizeCategories(rawPolicies.mail, DEFAULT_REWARDS_POLICY_SETTINGS.mail, legacyPolicy, addCosmetics),
				quest: normalizeCategories(rawPolicies.quest, DEFAULT_REWARDS_POLICY_SETTINGS.quest, legacyPolicy, addCosmetics),
				event: normalizeCategories(rawPolicies.event, DEFAULT_REWARDS_POLICY_SETTINGS.event, legacyPolicy, addCosmetics)
			},
			collectExpiringMail: source.collectExpiringMail === true,
			expiringMailHours: clampInteger(source.expiringMailHours, 1, 168, 24),
			confirmBeforeCollect: source.confirmBeforeCollect !== false,
			syncAfterCollect: source.syncAfterCollect === true,
			maxQuestPasses: clampInteger(source.maxQuestPasses, 1, 10, 5),
			doYourBestPlacement: normalizeDoYourBestPlacement(source.doYourBestPlacement, { allowStart: true }),
			hotkeys: normalizeHotkeyMap(source.hotkeys, DEFAULT_REWARDS_HOTKEY_SETTINGS),
			...progress
		};
	}
	function normalizeSources(source) {
		return Object.fromEntries(Object.entries(DEFAULT_REWARDS_SOURCE_SETTINGS).map(([key, fallback]) => [key, source[key] === void 0 ? fallback : source[key] === true]));
	}
	function normalizeCategories(value, fallback, legacyPolicy, addCosmetics) {
		const migratedCategories = (Array.isArray(value) ? value : fallback).flatMap((category) => {
			const normalized = String(category !== null && category !== void 0 ? category : "");
			if (!legacyPolicy) return [normalized];
			if (normalized === "regular") return [...LEGACY_REGULAR_CATEGORIES];
			if (normalized === "heroSoul") return [...LEGACY_SOUL_CATEGORIES];
			return [normalized];
		});
		if (addCosmetics && Array.isArray(value)) migratedCategories.push("cosmetics");
		return [...new Set(migratedCategories.filter((category) => categoryIds.has(category)))];
	}
	function clampInteger(value, minimum, maximum, fallback) {
		const numericValue = Number(value);
		if (!Number.isFinite(numericValue)) return fallback;
		return Math.min(maximum, Math.max(minimum, Math.trunc(numericValue)));
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
	//#region src/shared/storage/versioned-storage.ts
	init_defineProperty();
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
	//#region src/scripts/hwhrewards/settings/storage.ts
	function createRewardsSettingsRepository() {
		const repository = createSettingsRepository({
			storage: new VersionedStorage({
				keyPrefix: REWARDS_SETTINGS_KEY,
				schemaVersion: 2
			}),
			defaultValue: DEFAULT_REWARDS_MANAGER_SETTINGS,
			normalize: normalizeRewardsManagerSettings,
			getScopeKey: getPlayerScopeKey
		});
		return {
			...repository,
			readSync: (fallbackValue = DEFAULT_REWARDS_MANAGER_SETTINGS, scopeKey = getPlayerScopeKey()) => repository.readSync(fallbackValue, scopeKey),
			writeSync: (value, scopeKey = getPlayerScopeKey()) => repository.writeSync(value, scopeKey)
		};
	}
	function getPlayerScopeKey() {
		var _ref, _ref2, _ref3, _ref4, _runtime$userId;
		const runtime = globalThis;
		const hwhData = asPlainRecord(runtime.HWHData);
		const user = asPlainRecord(hwhData.user);
		const flashVars = asPlainRecord(runtime.NXFlashVars);
		return String((_ref = (_ref2 = (_ref3 = (_ref4 = (_runtime$userId = runtime.userId) !== null && _runtime$userId !== void 0 ? _runtime$userId : hwhData.userId) !== null && _ref4 !== void 0 ? _ref4 : user.id) !== null && _ref3 !== void 0 ? _ref3 : flashVars.user_id) !== null && _ref2 !== void 0 ? _ref2 : flashVars.uid) !== null && _ref !== void 0 ? _ref : "").trim();
	}
	//#endregion
	//#region src/scripts/hwhrewards/settings/transfer.ts
	function createRewardsSettingsTransferController({ translate, getScriptInfo, getUiTheme, writeSettings, showNotice }) {
		const transferOptions = [{
			key: "settings",
			label: translate("HWHREWARDS_TRANSFER_SETTINGS"),
			title: translate("HWHREWARDS_TRANSFER_SETTINGS_TITLE"),
			icon: "settings",
			checked: true
		}];
		const labels = {
			exportSelectTitle: translate("HWHREWARDS_EXPORT_SETTINGS"),
			importSelectTitle: translate("HWHREWARDS_IMPORT_SETTINGS"),
			exportSelectConfirm: translate("HWHREWARDS_EXPORT_SETTINGS"),
			importSelectConfirm: translate("HWHREWARDS_IMPORT_SETTINGS"),
			cancel: translate("HWHREWARDS_CLOSE"),
			importFileLabel: translate("HWHREWARDS_TRANSFER_FILE_LABEL"),
			searchPlaceholder: translate("HWHREWARDS_TRANSFER_SEARCH"),
			clearSearch: translate("HWHREWARDS_TRANSFER_CLEAR_SEARCH"),
			noOptions: translate("HWHREWARDS_TRANSFER_EMPTY"),
			selectAll: translate("HWHREWARDS_TRANSFER_SELECT_ALL"),
			clearAll: translate("HWHREWARDS_TRANSFER_CLEAR_ALL"),
			sort: translate("HWHREWARDS_TRANSFER_SORT"),
			sortByLabel: translate("HWHREWARDS_TRANSFER_SORT_BY_NAME"),
			sortSelected: translate("HWHREWARDS_TRANSFER_SORT_SELECTED"),
			sortAsc: translate("HWHREWARDS_TRANSFER_SORT_ASC"),
			sortDesc: translate("HWHREWARDS_TRANSFER_SORT_DESC"),
			exportDone: translate("HWHREWARDS_SETTINGS_EXPORT_DONE"),
			importDone: translate("HWHREWARDS_SETTINGS_IMPORT_DONE"),
			parseError: translate("HWHREWARDS_SETTINGS_IMPORT_PARSE_ERROR")
		};
		const buildController = () => createSettingsTransferController({
			buildPayload: (settings) => {
				var _scriptInfo$name, _scriptInfo$version;
				const scriptInfo = getScriptInfo();
				return buildSettingsExportPayload({
					scriptId: "hwhrewards",
					scriptName: (_scriptInfo$name = scriptInfo.name) !== null && _scriptInfo$name !== void 0 ? _scriptInfo$name : "HWH Rewards Manager",
					scriptVersion: (_scriptInfo$version = scriptInfo.version) !== null && _scriptInfo$version !== void 0 ? _scriptInfo$version : "",
					exportVersion: 1,
					storageSchemaVersion: 2,
					data: { settings: normalizeRewardsManagerSettings(settings) }
				});
			},
			buildFileName: () => "hwhrewards.settings.json",
			parseImport: (value) => getRewardsSettingsImportData(value, translate),
			applyImport: (settingsData) => applyPlainSettingsImportPayload({
				payload: settingsData,
				normalize: normalizeRewardsManagerSettings,
				write: writeSettings,
				invalidMessage: translate("HWHREWARDS_SETTINGS_IMPORT_INVALID")
			}),
			showNotice,
			labels,
			exportOptions: transferOptions,
			importOptions: transferOptions,
			uiTheme: getUiTheme(),
			alwaysShowChecklist: true
		});
		return {
			exportToJson(settings) {
				return buildController().exportToJson(settings);
			},
			importFromJson() {
				return buildController().importFromJson();
			}
		};
	}
	function getRewardsSettingsImportData(value, translate) {
		const payload = isPlainObject(value) ? value : {};
		const data = isPlainObject(payload.data) ? payload.data : {};
		if (payload.scriptId !== "hwhrewards" || !isPlainObject(data.settings)) throw new Error(translate("HWHREWARDS_SETTINGS_IMPORT_INVALID"));
		return data.settings;
	}
	//#endregion
	//#region src/scripts/hwhrewards/domain/candidate-builder.ts
	function buildRewardCandidates({ snapshot, library }) {
		return [
			...buildMailCandidates(snapshot.mail),
			...buildQuestCandidates(snapshot.quests, library, readBattlePassStates(snapshot.battlePassInfo, snapshot.battlePassSpecial, library)),
			...buildBattlePassCandidates({
				info: snapshot.battlePassInfo,
				special: snapshot.battlePassSpecial,
				library
			}),
			...buildPrestigeCandidates(snapshot.prestigeInfo, library),
			...buildStageOfferCandidates(snapshot.specialOffers)
		];
	}
	function buildMailCandidates(mailResponse) {
		var _response$letters;
		return normalizeRecordEntries((_response$letters = asPlainRecord(mailResponse).letters) !== null && _response$letters !== void 0 ? _response$letters : mailResponse).flatMap(([fallbackId, value]) => {
			var _letter$id, _ref, _ref2, _letter$availableUnti;
			const letter = asPlainRecord(value);
			const id = String((_letter$id = letter.id) !== null && _letter$id !== void 0 ? _letter$id : fallbackId).trim();
			if (!id) return [];
			return [{
				key: `mail:${id}`,
				id,
				source: "mail",
				policyScope: "mail",
				claimKind: "mail",
				reward: letter.reward,
				args: { letterId: normalizeNumericId(id) },
				expiresAt: normalizeTimestamp((_ref = (_ref2 = (_letter$availableUnti = letter.availableUntil) !== null && _letter$availableUnti !== void 0 ? _letter$availableUnti : letter.expireTime) !== null && _ref2 !== void 0 ? _ref2 : letter.expiresAt) !== null && _ref !== void 0 ? _ref : letter.endTime)
			}];
		});
	}
	function buildQuestCandidates(questResponse, library, battlePasses = /* @__PURE__ */ new Map()) {
		const questLibrary = getLibraryRecord(library, "quest");
		const clanQuests = asPlainRecord(questLibrary.clan);
		const eventQuestIds = buildEventQuestIdSet(questLibrary);
		const passQuests = asPlainRecord(questLibrary.battlePass);
		const questChains = asPlainRecord(getLibraryRecord(library, "battlePass").questChain);
		return normalizeRecordEntries(questResponse).flatMap(([fallbackId, value]) => {
			var _quest$id;
			const quest = asPlainRecord(value);
			if (Number(quest.state) !== 2) return [];
			const id = String((_quest$id = quest.id) !== null && _quest$id !== void 0 ? _quest$id : fallbackId).trim();
			if (!id) return [];
			const isEvent = eventQuestIds.has(id);
			const isClanQuest = Object.hasOwn(clanQuests, id);
			const chain = asPlainRecord(passQuests[id]).chain;
			const unmet = unmetChainRequirement(asPlainRecord(questChains[String(chain !== null && chain !== void 0 ? chain : "")]).requirement, battlePasses);
			return [{
				key: `quest:${id}`,
				id,
				source: isEvent ? "eventQuest" : "regularQuest",
				policyScope: isEvent ? "event" : "quest",
				claimKind: isClanQuest ? "clanQuest" : "quest",
				reward: quest.reward,
				args: { questId: normalizeNumericId(id) },
				metadata: {
					createTime: quest.createTime,
					state: quest.state,
					...unmet ? { unmetRequirement: unmet } : {}
				}
			}];
		});
	}
	/** Живые пропуска игрока: id → билет и уровень по опыту. Закончившихся здесь нет. */
	function readBattlePassStates(info, special, library) {
		const levels = normalizeRecordEntries(getLibraryRecord(library, "battlePass").level).map(([, value]) => asPlainRecord(value));
		const states = /* @__PURE__ */ new Map();
		const add = (pass) => {
			var _pass$id, _pass$exp;
			const id = String((_pass$id = pass.id) !== null && _pass$id !== void 0 ? _pass$id : "").trim();
			if (!id) return;
			const experience = toFiniteNumber((_pass$exp = pass.exp) !== null && _pass$exp !== void 0 ? _pass$exp : pass.experience);
			const level = levels.filter((entry) => {
				var _entry$battlePass;
				return String((_entry$battlePass = entry.battlePass) !== null && _entry$battlePass !== void 0 ? _entry$battlePass : "") === id && toFiniteNumber(entry.experience) <= experience;
			}).length;
			states.set(id, {
				ticket: hasBattlePassTicket(pass.ticket),
				level
			});
		};
		add(asPlainRecord(asPlainRecord(info).battlePass));
		for (const [, value] of normalizeRecordEntries(special)) add(asPlainRecord(value));
		return states;
	}
	/**
	* Условие цепочки заданий пропуска (battlePass.questChain[].requirement). Живой замер:
	* 59 «выполненных» заданий платной линейки без билета давали «not pass farm requirements»
	* на каждом сборе. Пропуск, которого нет среди живых, условие не выполняет.
	*/
	function unmetChainRequirement(requirement, passes) {
		var _rule$battlePassId;
		const rule = asPlainRecord(requirement);
		if (Object.keys(rule).length === 0) return null;
		const ticketRule = rule.battlePassTicket;
		const ticketPasses = ticketRule && typeof ticketRule === "object" ? Object.keys(asPlainRecord(ticketRule)) : ticketRule ? [String((_rule$battlePassId = rule.battlePassId) !== null && _rule$battlePassId !== void 0 ? _rule$battlePassId : "")] : [];
		for (const id of ticketPasses) {
			const pass = passes.get(id);
			if (!pass) return "passEnded";
			if (!pass.ticket) return "ticket";
		}
		const levelRule = asPlainRecord(rule.battlePassLevel);
		if (Object.keys(levelRule).length > 0) {
			var _rule$battlePassId2, _levelRule$operator;
			const pass = passes.get(String((_rule$battlePassId2 = rule.battlePassId) !== null && _rule$battlePassId2 !== void 0 ? _rule$battlePassId2 : ""));
			if (!pass) return "passEnded";
			const need = toFiniteNumber(levelRule.value);
			const operator = String((_levelRule$operator = levelRule.operator) !== null && _levelRule$operator !== void 0 ? _levelRule$operator : "ge");
			if (!(operator === "gt" ? pass.level > need : operator === "eq" ? pass.level === need : pass.level >= need)) return "level";
		}
		return null;
	}
	function buildBattlePassCandidates({ info, special, library }) {
		var _ref3, _mainPass$id;
		const levels = normalizeRecordEntries(getLibraryRecord(library, "battlePass").level).map(([, value]) => asPlainRecord(value));
		const infoRecord = asPlainRecord(info);
		const passes = [];
		const mainPass = asPlainRecord(infoRecord.battlePass);
		const mainId = String((_ref3 = (_mainPass$id = mainPass.id) !== null && _mainPass$id !== void 0 ? _mainPass$id : infoRecord.id) !== null && _ref3 !== void 0 ? _ref3 : "").trim();
		if (mainId && Object.keys(mainPass).length > 0) passes.push({
			id: mainId,
			pass: mainPass,
			main: true
		});
		for (const [fallbackId, value] of normalizeRecordEntries(special)) {
			var _pass$id2;
			const pass = asPlainRecord(value);
			const id = String((_pass$id2 = pass.id) !== null && _pass$id2 !== void 0 ? _pass$id2 : fallbackId).trim();
			if (id) passes.push({
				id,
				pass,
				main: false
			});
		}
		const candidates = [];
		for (const { id, pass, main } of passes) {
			var _pass$exp2;
			const passLevels = levels.filter((level) => {
				var _level$battlePass;
				return String((_level$battlePass = level.battlePass) !== null && _level$battlePass !== void 0 ? _level$battlePass : "") === id;
			}).sort((left, right) => toFiniteNumber(left.experience) - toFiniteNumber(right.experience));
			const experience = toFiniteNumber((_pass$exp2 = pass.exp) !== null && _pass$exp2 !== void 0 ? _pass$exp2 : pass.experience);
			const rewardState = pass.rewards;
			for (let index = 0; index < passLevels.length; index += 1) {
				const level = passLevels[index];
				if (toFiniteNumber(level.experience) > experience) break;
				const levelNumber = Math.max(1, toInteger(level.level, index + 1));
				const collectedState = asPlainRecord(readIndexedValue(rewardState, levelNumber));
				appendBattlePassCandidate({
					candidates,
					passId: id,
					main,
					level: levelNumber,
					free: true,
					collected: Boolean(collectedState.free),
					reward: level.freeReward,
					choice: Boolean(level.freeRewardChoice)
				});
				if (hasBattlePassTicket(pass.ticket)) appendBattlePassCandidate({
					candidates,
					passId: id,
					main,
					level: levelNumber,
					free: false,
					collected: Boolean(collectedState.paid),
					reward: level.paidReward,
					choice: Boolean(level.paidRewardChoice)
				});
			}
		}
		return candidates;
	}
	function buildPrestigeCandidates(prestigeInfo, library) {
		var _ref4, _info$prestigeId, _info$prestigeCount, _info$userPrestigeCou;
		const info = asPlainRecord(prestigeInfo);
		const prestigeId = String((_ref4 = (_info$prestigeId = info.prestigeId) !== null && _info$prestigeId !== void 0 ? _info$prestigeId : info.id) !== null && _ref4 !== void 0 ? _ref4 : "").trim();
		if (!prestigeId) return [];
		const levels = normalizeRecordEntries(getLibraryRecord(library, "clanPrestige").level).map(([, value]) => asPlainRecord(value)).filter((level) => {
			var _level$prestigeId;
			return String((_level$prestigeId = level.prestigeId) !== null && _level$prestigeId !== void 0 ? _level$prestigeId : "") === prestigeId;
		}).sort((left, right) => toFiniteNumber(left.prestige) - toFiniteNumber(right.prestige));
		const prestigeCount = toFiniteNumber((_info$prestigeCount = info.prestigeCount) !== null && _info$prestigeCount !== void 0 ? _info$prestigeCount : info.prestige);
		const userPrestigeCount = toFiniteNumber((_info$userPrestigeCou = info.userPrestigeCount) !== null && _info$userPrestigeCou !== void 0 ? _info$userPrestigeCou : info.userPrestige);
		const farmed = (value) => new Set((Array.isArray(value) ? value : []).map((level) => Number(level)));
		const farmedFree = farmed(info.farmedPrestigeLevels);
		const farmedPaid = farmed(info.farmedPrestigeLevelsPaid);
		const hasTicket = info.hasTicket === true || Number(info.hasTicket) === 1;
		return levels.flatMap((level, index) => {
			const levelNumber = Math.max(1, toInteger(level.level, index + 1));
			if (toFiniteNumber(level.prestige) > prestigeCount || toFiniteNumber(level.userPrestige) > userPrestigeCount) return [];
			const candidate = (paid) => ({
				key: `prestige:${prestigeId}:${paid ? "paid" : "free"}:${levelNumber}`,
				id: String(levelNumber),
				source: "prestige",
				policyScope: "event",
				claimKind: "prestige",
				reward: paid ? level.paidReward : level.reward,
				args: {
					level: levelNumber,
					free: !paid
				},
				metadata: {
					prestigeId,
					paid
				}
			});
			return [...farmedFree.has(levelNumber) ? [] : [candidate(false)], ...hasTicket && level.paidReward && !farmedPaid.has(levelNumber) ? [candidate(true)] : []];
		});
	}
	function buildStageOfferCandidates(offerResponse) {
		const candidates = [];
		for (const [fallbackId, value] of normalizeRecordEntries(offerResponse)) {
			var _ref5, _offer$offerType, _offer$id;
			const offer = asPlainRecord(value);
			if (String((_ref5 = (_offer$offerType = offer.offerType) !== null && _offer$offerType !== void 0 ? _offer$offerType : offer.type) !== null && _ref5 !== void 0 ? _ref5 : "") !== "stagesOffer") continue;
			const offerId = String((_offer$id = offer.id) !== null && _offer$id !== void 0 ? _offer$id : fallbackId).trim();
			if (!offerId) continue;
			const offerData = asPlainRecord(offer.offerData);
			const stages = Array.isArray(offerData.stages) ? offerData.stages : [];
			const firstPendingStage = Math.max(0, toInteger(offer.farmedStage, -1) + 1);
			for (let index = firstPendingStage; index < stages.length; index += 1) {
				var _stage$reward;
				const stage = asPlainRecord(stages[index]);
				if (stage.billingId) break;
				candidates.push({
					key: `stageOffer:${offerId}:${index}`,
					id: offerId,
					source: "stageOffer",
					policyScope: "event",
					claimKind: "stageOffer",
					reward: (_stage$reward = stage.reward) !== null && _stage$reward !== void 0 ? _stage$reward : stage.freeReward,
					args: { offerId: normalizeNumericId(offerId) },
					sequenceKey: `stageOffer:${offerId}`,
					sequenceIndex: index,
					metadata: { stage: index }
				});
			}
		}
		return candidates;
	}
	function appendBattlePassCandidate({ candidates, passId, main, level, free, collected, reward, choice }) {
		if (collected) return;
		const rewardType = free ? "free" : "paid";
		candidates.push({
			key: `battlePass:${passId}:${rewardType}:${level}`,
			id: `${passId}:${rewardType}:${level}`,
			source: "battlePass",
			policyScope: "event",
			claimKind: "battlePass",
			reward,
			args: {
				level,
				free,
				...main ? {} : { id: normalizeNumericId(passId) }
			},
			metadata: {
				passId,
				level,
				free,
				...choice ? { needsChoice: true } : {}
			}
		});
	}
	function buildEventQuestIdSet(questLibrary) {
		const ids = /* @__PURE__ */ new Set();
		for (const branch of EVENT_QUEST_LIBRARY_BRANCHES) for (const [fallbackId, value] of normalizeRecordEntries(questLibrary[branch])) {
			var _definition$id;
			const definition = asPlainRecord(value);
			const id = String((_definition$id = definition.id) !== null && _definition$id !== void 0 ? _definition$id : fallbackId).trim();
			if (id) ids.add(id);
		}
		return ids;
	}
	function getLibraryRecord(library, key) {
		var _data$key;
		const root = asPlainRecord(library);
		return asPlainRecord((_data$key = asPlainRecord(root.data)[key]) !== null && _data$key !== void 0 ? _data$key : root[key]);
	}
	function normalizeRecordEntries(value) {
		if (Array.isArray(value)) return value.map((entry, index) => [String(index), entry]);
		return Object.entries(asPlainRecord(value));
	}
	function readIndexedValue(value, index) {
		return Array.isArray(value) ? value[index] : asPlainRecord(value)[String(index)];
	}
	function normalizeTimestamp(value) {
		const timestamp = Number(value);
		if (!Number.isFinite(timestamp) || timestamp <= 0) return;
		return timestamp < 1e10 ? timestamp * 1e3 : timestamp;
	}
	function hasBattlePassTicket(value) {
		if (value === true || value === 1 || value === "1" || value === "true") return true;
		if (value === false || value === 0 || value === "0" || value === "false") return false;
		return Object.values(asPlainRecord(value)).some(Boolean);
	}
	function normalizeNumericId(value) {
		const numericValue = Number(value);
		return Number.isSafeInteger(numericValue) && String(numericValue) === value ? numericValue : value;
	}
	function toFiniteNumber(value) {
		const number = Number(value);
		return Number.isFinite(number) ? number : 0;
	}
	function toInteger(value, fallback) {
		const number = Number(value);
		return Number.isFinite(number) ? Math.trunc(number) : fallback;
	}
	//#endregion
	//#region src/scripts/hwhrewards/domain/reward-types.ts
	/**
	* Типы наград по коду игры (октябрь 2026): InventoryItemType — предметы с id внутри,
	* RewardData — скалярные и особые ключи. Новые ключи игры, которых здесь нет,
	* разбирает `classifyRewardKey` по семействам имени, а не отправляет сразу в «неизвестное».
	*/
	var KNOWN_REWARD_KEYS = {
		coin: "currency",
		gold: "currency",
		starmoney: "currency",
		starmoneyPayed: "currency",
		gear: "equipment",
		fragmentGear: "equipment",
		scroll: "equipment",
		fragmentScroll: "equipment",
		ascensionGear: "equipment",
		petGear: "equipment",
		artifact: "artifacts",
		fragmentArtifact: "artifacts",
		fragmentHeroArtifact: "artifacts",
		artifactFragment: "artifacts",
		titanArtifact: "artifacts",
		fragmentTitanArtifact: "artifacts",
		skin: "skins",
		fragmentSkin: "skins",
		avatar: "cosmetics",
		avatarFrame: "cosmetics",
		sticker: "cosmetics",
		banner: "cosmetics",
		bannerStone: "cosmetics",
		clanIconFrame: "cosmetics",
		iconShape: "cosmetics",
		iconColor: "cosmetics",
		flagShape: "cosmetics",
		campaignStory: "cosmetics",
		experience: "progressResources",
		teamLevel: "progressResources",
		skill_point: "progressResources",
		heroXp: "progressResources",
		titanXp: "progressResources",
		petXp: "progressResources",
		battlePassExp: "progressResources",
		battlePassLevel: "progressResources",
		battlePassTicket: "progressResources",
		clanPrestigeTicket: "progressResources",
		clanActivity: "progressResources",
		clanQuestsPoints: "progressResources",
		clanGifts: "progressResources",
		dungeonActivity: "progressResources",
		prestige: "progressResources",
		farmSubscription: "progressResources",
		subscription: "progressResources",
		pointEventXp: "progressResources",
		quizPoints: "progressResources",
		nyRatingPoints: "progressResources",
		adventTicket: "progressResources",
		coopBundlePath: "progressResources",
		epicBrawlAttemptsInfinity: "progressResources",
		idleResource: "progressResources",
		hero: "heroSoul",
		fragmentHero: "heroSoul",
		heroCard: "heroSoul",
		bundleHeroReward: "heroSoul",
		titan: "titanSoul",
		fragmentTitan: "titanSoul",
		titanCard: "titanSoul",
		pet: "petSoul",
		fragmentPet: "petSoul",
		petCard: "petSoul",
		petSoulStone: "petSoul",
		petStone: "petSoul",
		petFragment: "petSoul",
		fragmentPetStone: "petSoul",
		lootBox: "consumables",
		eventBox: "consumables",
		buff: "energyBoost",
		invasionBuff: "energyBoost",
		adventureMapBuff: "energyBoost",
		vipPoints: "vipPoints",
		powerTournamentCoins: "powerTournamentPoints"
	};
	/** Ключи, у которых категория зависит от id внутри: портал и бустеры Завоевания. */
	var INDEXED_REWARD_KEYS = /* @__PURE__ */ new Set([
		"consumable",
		"refillable",
		"stamina"
	]);
	/**
	* Семейства по имени ключа — для типов, которые игра добавит позже.
	* Порядок важен: fragment* сводится к базовому типу раньше общих суффиксов.
	*/
	var FAMILY_RULES = [
		[/(Xp|Exp|Experience|Points|Activity|Ticket|Level)$/, "progressResources"],
		[/(Box|Chest)$/, "consumables"],
		[/Buff$/, "energyBoost"],
		[/(Coins?|Money|Payed)$/, "currency"],
		[/Gear$/, "equipment"],
		[/Artifact$/, "artifacts"],
		[/Skin$/, "skins"],
		[/^(avatar|sticker|banner|frame|icon|flag)/i, "cosmetics"],
		[/^hero/, "heroSoul"],
		[/^titan/, "titanSoul"],
		[/^pet/, "petSoul"]
	];
	function classifyRewardKey(key) {
		const known = KNOWN_REWARD_KEYS[key];
		if (known) return known;
		const fragment = /^fragment([A-Z]\w*)$/.exec(key);
		if (fragment) {
			const category = classifyRewardKey(fragment[1].charAt(0).toLowerCase() + fragment[1].slice(1));
			if (category !== "unknown") return category;
		}
		for (const [pattern, category] of FAMILY_RULES) if (pattern.test(key)) return category;
		return "unknown";
	}
	//#endregion
	//#region src/scripts/hwhrewards/domain/reward-policy.ts
	var sourceSettingKey = {
		mail: "mail",
		regularQuest: "regularQuests",
		eventQuest: "eventQuests",
		battlePass: "battlePass",
		prestige: "prestige",
		stageOffer: "stageOffers"
	};
	function classifyRewardCategories(reward) {
		const source = asPlainRecord(reward);
		const keys = Object.keys(source);
		if (keys.length === 0) return ["unknown"];
		const categories = /* @__PURE__ */ new Set();
		for (const key of keys) {
			const value = source[key];
			if (key === "stamina") categories.add(Number(value) > 60 ? "energyLarge" : "energySmall");
			else if (key === "refillable") classifyIndexedReward({
				value,
				sensitiveIds: /* @__PURE__ */ new Set([45]),
				sensitiveCategory: "portalCharge",
				ordinaryCategory: "refillables",
				categories
			});
			else if (key === "consumable") classifyIndexedReward({
				value,
				sensitiveIds: CONQUEST_BOOSTER_CONSUMABLE_IDS,
				sensitiveCategory: "conquestBoosters",
				ordinaryCategory: "consumables",
				categories
			});
			else categories.add(classifyRewardKey(key));
		}
		return [...categories];
	}
	function evaluateRewardCandidate(candidate, settings, now = Date.now()) {
		var _candidate$metadata, _candidate$metadata2;
		const categories = classifyRewardCategories(candidate.reward);
		if (!settings.sources[sourceSettingKey[candidate.source]]) return {
			candidate,
			collect: false,
			categories,
			blockedCategories: categories,
			reason: "disabledSource"
		};
		if ((_candidate$metadata = candidate.metadata) === null || _candidate$metadata === void 0 ? void 0 : _candidate$metadata.unmetRequirement) return {
			candidate,
			collect: false,
			categories,
			blockedCategories: [],
			reason: "requirementNotMet"
		};
		if (((_candidate$metadata2 = candidate.metadata) === null || _candidate$metadata2 === void 0 ? void 0 : _candidate$metadata2.needsChoice) === true) return {
			candidate,
			collect: false,
			categories,
			blockedCategories: [],
			reason: "needsChoice"
		};
		if (shouldUseExpiringMailOverride(candidate, settings, now)) return {
			candidate,
			collect: true,
			categories,
			blockedCategories: [],
			reason: "expiringOverride"
		};
		const enabledCategories = new Set(settings.policies[resolvePolicyScope(candidate)]);
		const blockedCategories = categories.filter((category) => !enabledCategories.has(category));
		return {
			candidate,
			collect: blockedCategories.length === 0,
			categories,
			blockedCategories,
			reason: blockedCategories.length === 0 ? "allowed" : "blockedCategory"
		};
	}
	function resolvePolicyScope(candidate) {
		return candidate.policyScope;
	}
	function shouldUseExpiringMailOverride(candidate, settings, now) {
		if (candidate.source !== "mail" || !settings.collectExpiringMail || !candidate.expiresAt) return false;
		const deadline = now + settings.expiringMailHours * 60 * 60 * 1e3;
		return candidate.expiresAt > 0 && candidate.expiresAt <= deadline;
	}
	function classifyIndexedReward({ value, sensitiveIds, sensitiveCategory, ordinaryCategory, categories }) {
		const entries = Object.entries(asPlainRecord(value));
		if (entries.length === 0) {
			categories.add("unknown");
			return;
		}
		let hasRegular = false;
		let hasSensitive = false;
		for (const [id, amount] of entries) {
			if (!amount) continue;
			if (sensitiveIds.has(Number(id))) hasSensitive = true;
			else hasRegular = true;
		}
		if (hasSensitive) categories.add(sensitiveCategory);
		if (hasRegular) categories.add(ordinaryCategory);
		if (!hasSensitive && !hasRegular) categories.add("unknown");
	}
	//#endregion
	//#region src/scripts/hwhrewards/domain/collection-plan.ts
	function buildRewardCollectionPlan({ candidates, settings, now = Date.now() }) {
		const blockedSequences = /* @__PURE__ */ new Set();
		const decisions = candidates.map((candidate) => {
			const sequenceKey = candidate.sequenceKey;
			if (sequenceKey && blockedSequences.has(sequenceKey)) {
				const categories = evaluateRewardCandidate(candidate, settings, now).categories;
				return {
					candidate,
					collect: false,
					categories,
					blockedCategories: categories,
					reason: "blockedSequence"
				};
			}
			const decision = evaluateRewardCandidate(candidate, settings, now);
			if (sequenceKey && !decision.collect) blockedSequences.add(sequenceKey);
			return decision;
		});
		const selected = decisions.filter((decision) => decision.collect);
		const skipped = decisions.filter((decision) => !decision.collect);
		return {
			decisions,
			selected,
			skipped,
			selectedBySource: countBySource(selected),
			skippedBySource: countBySource(skipped)
		};
	}
	function countBySource(decisions) {
		const result = Object.fromEntries(REWARD_SOURCE_IDS.map((source) => [source, 0]));
		for (const decision of decisions) result[decision.candidate.source] += 1;
		return result;
	}
	//#endregion
	//#region src/scripts/hwhrewards/runtime/collector.ts
	function createHeroWarsRewardsGateway({ Caller }) {
		async function execute(call) {
			return Caller.send(call);
		}
		return {
			async fetchSnapshot(settings) {
				const calls = [];
				const fields = [];
				const add = (field, call) => {
					fields.push(field);
					calls.push(execute(call));
				};
				if (settings.sources.regularQuests || settings.sources.eventQuests) add("quests", "questGetAll");
				if (settings.sources.mail) add("mail", "mailGetAll");
				if (settings.sources.stageOffers) add("specialOffers", "specialOffer_getAll");
				if (settings.sources.battlePass || settings.sources.eventQuests) {
					add("battlePassInfo", "battlePass_getInfo");
					add("battlePassSpecial", "battlePass_getSpecial");
				}
				if (settings.sources.prestige) add("prestigeInfo", "clan_prestigeGetInfo");
				const settled = await Promise.allSettled(calls);
				const snapshot = createEmptySnapshot();
				settled.forEach((result, index) => {
					const field = fields[index];
					if (result.status === "fulfilled") snapshot[field] = result.value;
					else console.warn(`[HWH Rewards] read-only ${field} request failed`, result.reason);
				});
				return snapshot;
			},
			claimBatch: (candidates) => claimWithIsolation(candidates, execute)
		};
	}
	function createRewardsCollector({ gateway, library, onProgress = () => void 0 }) {
		async function preparePlan(settings, selection = {}) {
			onProgress({
				current: 0,
				total: 0,
				pass: 0,
				stage: "scan"
			});
			const effectiveSettings = applySourceSelection(settings, selection);
			return buildRewardCollectionPlan({
				candidates: buildRewardCandidates({
					snapshot: await gateway.fetchSnapshot(effectiveSettings),
					library
				}),
				settings: effectiveSettings
			});
		}
		async function collectPlan({ plan, settings, selection = {} }) {
			const effectiveSettings = applySourceSelection(settings, selection);
			const result = createEmptyResult(plan);
			const claimedKeys = /* @__PURE__ */ new Set();
			const skippedKeys = new Set(plan.skipped.map((decision) => decision.candidate.key));
			await executeDecisions(plan.selected, result, claimedKeys, 0);
			const followUpSettings = {
				...effectiveSettings,
				sources: {
					...effectiveSettings.sources,
					mail: false,
					prestige: false,
					stageOffers: false
				}
			};
			const followUpSources = /* @__PURE__ */ new Set([
				...effectiveSettings.sources.regularQuests ? ["regularQuest"] : [],
				...effectiveSettings.sources.eventQuests ? ["eventQuest"] : [],
				...effectiveSettings.sources.battlePass ? ["battlePass"] : []
			]);
			const passLimit = Math.min(10, Math.max(1, effectiveSettings.maxQuestPasses));
			if (followUpSources.size === 0) return result;
			for (let pass = 1; pass < passLimit; pass += 1) {
				onProgress({
					current: 0,
					total: 0,
					pass,
					stage: "questPass"
				});
				const nextPlan = buildRewardCollectionPlan({
					candidates: buildRewardCandidates({
						snapshot: await gateway.fetchSnapshot(followUpSettings),
						library
					}).filter((candidate) => followUpSources.has(candidate.source) && !claimedKeys.has(candidate.key)),
					settings: effectiveSettings
				});
				for (const decision of nextPlan.skipped) {
					if (skippedKeys.has(decision.candidate.key)) continue;
					skippedKeys.add(decision.candidate.key);
					result.skipped += 1;
				}
				if (nextPlan.selected.length === 0) {
					result.passes = pass;
					break;
				}
				await executeDecisions(nextPlan.selected, result, claimedKeys, pass);
				result.passes = pass + 1;
			}
			return result;
		}
		async function executeDecisions(decisions, result, claimedKeys, pass) {
			let current = 0;
			const failedSequences = /* @__PURE__ */ new Set();
			let pending = [...decisions];
			while (pending.length > 0) {
				const batch = [];
				const deferred = [];
				const batchSequences = /* @__PURE__ */ new Set();
				for (const decision of pending) {
					const sequenceKey = decision.candidate.sequenceKey;
					if (sequenceKey && failedSequences.has(sequenceKey)) {
						result.skipped += 1;
						continue;
					}
					if (batch.length >= 25 || sequenceKey && batchSequences.has(sequenceKey)) {
						deferred.push(decision);
						continue;
					}
					batch.push(decision);
					if (sequenceKey) batchSequences.add(sequenceKey);
				}
				pending = deferred;
				if (batch.length === 0) break;
				current += batch.length;
				onProgress({
					current,
					total: decisions.length,
					pass,
					stage: "collect"
				});
				const candidates = batch.map((decision) => decision.candidate);
				candidates.forEach((candidate) => claimedKeys.add(candidate.key));
				try {
					const settled = await gateway.claimBatch(candidates);
					for (const [index, candidate] of candidates.entries()) {
						const claimResult = settled[index];
						if ((claimResult === null || claimResult === void 0 ? void 0 : claimResult.status) === "fulfilled") {
							result.collected += 1;
							result.collectedBySource[candidate.source] += 1;
							continue;
						}
						recordClaimFailure(candidate, (claimResult === null || claimResult === void 0 ? void 0 : claimResult.status) === "rejected" ? claimResult.reason : /* @__PURE__ */ new Error("Reward batch returned an incomplete result."), result, failedSequences);
					}
				} catch (error) {
					console.error("[HWH Rewards] claim batch failed", candidates, error);
					for (const candidate of candidates) recordClaimFailure(candidate, error, result, failedSequences);
				}
			}
		}
		return {
			preparePlan,
			collectPlan
		};
	}
	function applySourceSelection(settings, selection) {
		if (Object.keys(selection).length === 0) return settings;
		const allowedSources = new Set(REWARD_SOURCE_IDS.filter((source) => selection[source] !== false));
		return {
			...settings,
			sources: {
				mail: settings.sources.mail && allowedSources.has("mail"),
				regularQuests: settings.sources.regularQuests && allowedSources.has("regularQuest"),
				eventQuests: settings.sources.eventQuests && allowedSources.has("eventQuest"),
				battlePass: settings.sources.battlePass && allowedSources.has("battlePass"),
				prestige: settings.sources.prestige && allowedSources.has("prestige"),
				stageOffers: settings.sources.stageOffers && allowedSources.has("stageOffer")
			}
		};
	}
	function buildClaimCall(candidate) {
		switch (candidate.claimKind) {
			case "mail": return {
				name: "mailFarm",
				args: { letterIds: [candidate.args.letterId] }
			};
			case "clanQuest": return {
				name: "quest_questsFarm",
				args: { questIds: [candidate.args.questId] }
			};
			case "battlePass": return {
				name: "battlePass_farmReward",
				args: candidate.args
			};
			case "prestige": return {
				name: "clan_prestigeFarmReward",
				args: candidate.args
			};
			case "stageOffer": return {
				name: "offerFarmReward",
				args: candidate.args
			};
			default: return {
				name: "questFarm",
				args: candidate.args
			};
		}
	}
	/**
	* Сервер отклоняет пакет целиком: живая проверка — годный questFarm рядом с
	* невыполненным не применился. Поэтому одна «битая» награда раньше роняла ещё 24 и
	* так на каждом повторном сборе. Серверная ошибка называет вызов и его Args:
	* выкидываем только его (групповой вызов дробим) и переотправляем остальное.
	* Ошибка без ответа сервера (сеть, тайм-аут) не повторяется: применилось ли — неизвестно.
	*/
	async function claimWithIsolation(candidates, execute) {
		const results = candidates.map(() => ({
			status: "rejected",
			reason: /* @__PURE__ */ new Error("Reward was not sent.")
		}));
		let groups = buildClaimGroups(candidates);
		for (let attempt = 0; groups.length > 0 && attempt <= candidates.length * 2; attempt += 1) try {
			const response = await execute(groups.map((group) => group.call));
			for (const group of groups) for (const index of group.members) results[index] = {
				status: "fulfilled",
				value: response
			};
			return results;
		} catch (reason) {
			const failed = findFailedGroup(groups, reason);
			if (failed < 0) {
				for (const group of groups) for (const index of group.members) results[index] = {
					status: "rejected",
					reason
				};
				return results;
			}
			const group = groups[failed];
			const rest = groups.filter((_, index) => index !== failed);
			if (group.members.length > 1) groups = [...rest, ...group.members.map((index) => ({
				call: buildClaimCall(candidates[index]),
				members: [index]
			}))];
			else {
				results[group.members[0]] = {
					status: "rejected",
					reason
				};
				groups = rest;
			}
		}
		return results;
	}
	/** «NotEnough in questFarm: … Args: {"questId":785}» — так HWH Caller отдаёт отказ сервера. */
	function parseServerClaimError(reason) {
		const message = reason instanceof Error ? reason.message : String(reason !== null && reason !== void 0 ? reason : "");
		const match = /^\w+ in (\w+):[\s\S]*?Args: (\{[\s\S]*\})\s*$/.exec(message.trim());
		if (!match) return null;
		try {
			return {
				call: match[1],
				args: JSON.parse(match[2])
			};
		} catch (_unused) {
			return {
				call: match[1],
				args: void 0
			};
		}
	}
	function findFailedGroup(groups, reason) {
		const failure = parseServerClaimError(reason);
		if (!failure) return -1;
		const sameName = groups.map((group, index) => ({
			group,
			index
		})).filter(({ group }) => group.call.name === failure.call);
		if (sameName.length === 1) return sameName[0].index;
		const args = JSON.stringify(failure.args);
		const exact = sameName.filter(({ group }) => JSON.stringify(group.call.args) === args);
		return exact.length === 1 ? exact[0].index : -1;
	}
	function buildClaimGroups(candidates) {
		const mail = [];
		const clanQuests = [];
		const groups = [];
		candidates.forEach((candidate, index) => {
			if (candidate.claimKind === "mail") mail.push(index);
			else if (candidate.claimKind === "clanQuest") clanQuests.push(index);
			else groups.push({
				call: buildClaimCall(candidate),
				members: [index]
			});
		});
		if (mail.length > 0) groups.unshift({
			call: {
				name: "mailFarm",
				args: { letterIds: mail.map((index) => candidates[index].args.letterId) }
			},
			members: mail
		});
		if (clanQuests.length > 0) groups.unshift({
			call: {
				name: "quest_questsFarm",
				args: { questIds: clanQuests.map((index) => candidates[index].args.questId) }
			},
			members: clanQuests
		});
		return groups;
	}
	function createEmptySnapshot() {
		return {
			quests: [],
			mail: { letters: [] },
			specialOffers: [],
			battlePassInfo: {},
			battlePassSpecial: {},
			prestigeInfo: {}
		};
	}
	function createEmptyResult(plan) {
		return {
			selected: plan.selected.length,
			collected: 0,
			failed: 0,
			skipped: plan.skipped.length,
			passes: 1,
			collectedBySource: Object.fromEntries(REWARD_SOURCE_IDS.map((source) => [source, 0])),
			errors: []
		};
	}
	function recordClaimFailure(candidate, error, result, failedSequences) {
		result.failed += 1;
		result.errors.push(formatError(candidate, error));
		console.error("[HWH Rewards] claim failed", candidate, error);
		if (candidate.sequenceKey) failedSequences.add(candidate.sequenceKey);
	}
	function formatError(candidate, error) {
		const message = error instanceof Error ? error.message : String(error !== null && error !== void 0 ? error : "");
		return `${candidate.key}: ${message || "Unknown error"}`;
	}
	//#endregion
	//#region src/scripts/hwhrewards/runtime/helper-patch.ts
	function isRewardsHelperButtonReady(helperData, helperClasses) {
		const data = asPlainRecord(helperData);
		const classes = asPlainRecord(helperClasses);
		const descriptor = asPlainRecord(asPlainRecord(data.buttons)[REWARDS_HELPER_BUTTON_KEY]);
		const ScriptMenu = classes.ScriptMenu;
		return descriptor.button instanceof HTMLElement && typeof (ScriptMenu === null || ScriptMenu === void 0 ? void 0 : ScriptMenu.getInst) === "function";
	}
	function installRewardsHelperButtonPatch({ helperData, helperClasses, collectButton, settingsButton }) {
		const data = asPlainRecord(helperData);
		const classes = asPlainRecord(helperClasses);
		const buttons = asPlainRecord(data.buttons);
		const currentDescriptor = asPlainRecord(buttons[REWARDS_HELPER_BUTTON_KEY]);
		if (currentDescriptor["hwhRewardsManager"] === true) return true;
		const oldButton = currentDescriptor.button;
		const oldRow = oldButton instanceof HTMLElement ? oldButton.closest(".scriptMenu_btnRow") : null;
		const ScriptMenu = classes.ScriptMenu;
		if (!oldRow || typeof (ScriptMenu === null || ScriptMenu === void 0 ? void 0 : ScriptMenu.getInst) !== "function") return false;
		const menu = ScriptMenu.getInst();
		if (!menu || typeof menu.addCombinedButton !== "function") return false;
		const combineList = [cloneButton(collectButton), cloneButton(settingsButton)];
		const newRow = menu.addCombinedButton(combineList);
		if (!(newRow instanceof HTMLElement)) return false;
		newRow.dataset.hwhRewardsManager = "1";
		oldRow.replaceWith(newRow);
		buttons[REWARDS_HELPER_BUTTON_KEY] = {
			isCombine: true,
			combineList,
			button: newRow,
			[REWARDS_PATCH_MARKER]: true
		};
		data.buttons = buttons;
		return true;
	}
	function installRewardsDoYourBestPatch({ helperClasses, collectAll, collectMail, collectQuests, placement, taskLabel }) {
		var _instance$functions;
		const classes = asPlainRecord(helperClasses);
		const DoYourBestCtor = getHeroWarsDoYourBestClass(classes);
		if (!DoYourBestCtor) return false;
		const RootDoYourBestClass = getDoYourBestRootBaseClass(DoYourBestCtor);
		const instance = new DoYourBestCtor();
		const currentTaskList = Array.isArray(instance.funcList) ? instance.funcList.filter(Boolean) : [];
		const existingTask = currentTaskList.find(isRewardsDoYourBestTask);
		const nextTaskList = currentTaskList.filter((task) => !isRewardsDoYourBestTask(task));
		if (placement !== "none") {
			const insertionIndex = getDoYourBestInsertionIndex(nextTaskList, placement, { allowStart: true });
			nextTaskList.splice(insertionIndex, 0, {
				...existingTask,
				name: REWARDS_DO_YOUR_BEST_TASK_NAME,
				label: taskLabel,
				checked: (existingTask === null || existingTask === void 0 ? void 0 : existingTask.checked) === true
			});
		}
		const functions = {
			...(_instance$functions = instance.functions) !== null && _instance$functions !== void 0 ? _instance$functions : {},
			mailGetAll: collectMail,
			questAllFarm: collectQuests,
			[REWARDS_DO_YOUR_BEST_TASK_NAME]: collectAll
		};
		class RewardsDoYourBestExtension extends RootDoYourBestClass {
			constructor(...args) {
				super(...args);
				this.funcList = nextTaskList.map((task) => ({ ...task }));
				this.functions = { ...functions };
			}
		}
		Object.defineProperty(RewardsDoYourBestExtension, REWARDS_PATCH_MARKER, { value: true });
		classes.doYourBest = RewardsDoYourBestExtension;
		return true;
	}
	function isRewardsDoYourBestTask(task) {
		return getDoYourBestTaskName(task) === REWARDS_DO_YOUR_BEST_TASK_NAME;
	}
	function cloneButton(button) {
		return {
			...button,
			classes: []
		};
	}
	//#endregion
	//#region src/scripts/hwhrewards/ui/hotkey-bindings.ts
	function buildRewardsHotkeyBindings({ readSettings, translate, openSettings, collectRewards, isAvailable = () => true }) {
		const hotkeys = normalizeRewardsManagerSettings(readSettings()).hotkeys;
		return [{
			id: "hwhrewards:open-settings",
			label: translate("HWHREWARDS_HOTKEY_OPEN_SETTINGS"),
			shortcut: hotkeys.openSettings,
			enabled: isAvailable,
			handler: openSettings
		}, {
			id: "hwhrewards:collect",
			label: translate("HWHREWARDS_HOTKEY_COLLECT"),
			shortcut: hotkeys.collectRewards,
			enabled: isAvailable,
			handler: collectRewards
		}];
	}
	function registerRewardsHotkeys(options) {
		return registerHotkeyScope("hwhrewards", { getBindings: () => buildRewardsHotkeyBindings(options) });
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
		let progressSettings = normalizeSettings(settings);
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
			const normalizedOptions = asPlainRecord(options);
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
				props: asPlainRecord(normalizedOptions.props),
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
				...asPlainRecord(options),
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
			const normalizedOptions = asPlainRecord(options);
			setProgress(stage.content, autoHide, {
				...normalizedOptions,
				percent: (_normalizedOptions$pe = normalizedOptions.percent) !== null && _normalizedOptions$pe !== void 0 ? _normalizedOptions$pe : stage.percent,
				stage: (_normalizedOptions$st3 = normalizedOptions.stage) !== null && _normalizedOptions$st3 !== void 0 ? _normalizedOptions$st3 : stage.stageLabel
			});
		}
		function configure(nextSettings) {
			progressUiTheme = readUiTheme(nextSettings, progressUiTheme);
			progressSettings = normalizeSettings({
				...progressSettings,
				...asPlainRecord(nextSettings)
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
		return String((_asPlainRecord$uiThem = asPlainRecord(value).uiTheme) !== null && _asPlainRecord$uiThem !== void 0 ? _asPlainRecord$uiThem : "").trim() || fallback;
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
	var normalizeSettings = normalizeProgressWindowSettings;
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
	//#region src/scripts/hwhrewards/ui/lite/themes.ts
	var REWARDS_LITE_THEME_OPTIONS = [
		{
			value: "classic",
			labelKey: "HWHX_UI_THEME_CLASSIC",
			label: "Classic"
		},
		{
			value: "dominion",
			labelKey: "HWHX_UI_THEME_DOMINION",
			label: "Dominion"
		},
		{
			value: "astral-premiere",
			labelKey: "HWHX_UI_THEME_ASTRAL_PREMIERE",
			label: "Astral Premiere"
		},
		{
			value: "emerald-crown",
			labelKey: "HWHX_UI_THEME_EMERALD_CROWN",
			label: "Emerald Crown"
		},
		{
			value: "storm-workshop",
			labelKey: "HWHX_UI_THEME_STORM_WORKSHOP",
			label: "Storm Workshop"
		},
		{
			value: "flat-graphite",
			labelKey: "HWHX_UI_THEME_FLAT_GRAPHITE",
			label: "Flat Graphite"
		},
		{
			value: "fluent-2-dark",
			labelKey: "HWHX_UI_THEME_FLUENT_2_DARK",
			label: "Fluent 2 Dark"
		},
		{
			value: "material-3-expressive",
			labelKey: "HWHX_UI_THEME_MATERIAL_3_EXPRESSIVE",
			label: "Material 3 Expressive"
		},
		{
			value: "contrast-amber",
			labelKey: "HWHX_UI_THEME_CONTRAST_AMBER",
			label: "Contrast Amber"
		}
	];
	var REWARDS_LITE_THEME_CSS = `.hwhx-build-lite[data-hwhx-ui-theme="classic"] {
  --rw-overlay: #000000b8;
  --rw-dialog: linear-gradient(180deg,#211307,#0b0805);
  --rw-header: linear-gradient(180deg,#3a230e,#1b1008);
  --rw-actions: #100a06;
  --rw-panel: #211307;
  --rw-control: linear-gradient(180deg,#392316,#1d120c);
  --rw-control-hover: #452b18;
  --rw-border: #b87824;
  --rw-text: #f4efe5;
  --rw-muted: #c9b28a;
  --rw-primary: #9fe0a8;
  --rw-accent: #f0d59f;
  --rw-font: Arial,sans-serif;
  --rw-radius: 7px;
}

.hwhx-build-lite[data-hwhx-ui-theme="dominion"] {
  --rw-overlay: #010603b8;
  --rw-dialog: linear-gradient(180deg,#18301e,#080d09);
  --rw-header: linear-gradient(90deg,#315f37,#614219);
  --rw-actions: #0b120d;
  --rw-panel: #192b1d;
  --rw-control: linear-gradient(180deg,#31563a,#132119);
  --rw-control-hover: #3c6947;
  --rw-border: #8db35e;
  --rw-text: #f3f4db;
  --rw-muted: #c0c99a;
  --rw-primary: #8ee369;
  --rw-accent: #f3c966;
  --rw-font: Verdana,Arial,sans-serif;
  --rw-radius: 9px;
}

.hwhx-build-lite[data-hwhx-ui-theme="astral-premiere"] {
  --rw-overlay: #050316c2;
  --rw-dialog: linear-gradient(180deg,#231246,#08091f);
  --rw-header: linear-gradient(90deg,#953db2,#a86313);
  --rw-actions: #0a091f;
  --rw-panel: #251449;
  --rw-control: linear-gradient(180deg,#471e60,#120e31);
  --rw-control-hover: #60277e;
  --rw-border: #c651e0;
  --rw-text: #fbf2ff;
  --rw-muted: #c5a8d4;
  --rw-primary: #ff7ee6;
  --rw-accent: #f4c86a;
  --rw-font: "Trebuchet MS",Arial,sans-serif;
  --rw-radius: 12px;
}

.hwhx-build-lite[data-hwhx-ui-theme="emerald-crown"] {
  --rw-overlay: #010903c2;
  --rw-dialog: linear-gradient(180deg,#0f3212,#070e09);
  --rw-header: linear-gradient(90deg,#2a6f1b,#805810);
  --rw-actions: #070f08;
  --rw-panel: #123815;
  --rw-control: linear-gradient(180deg,#265e1b,#0a1b0c);
  --rw-control-hover: #337923;
  --rw-border: #71cd46;
  --rw-text: #f2ffe9;
  --rw-muted: #b8ce9a;
  --rw-primary: #75f04f;
  --rw-accent: #ffd866;
  --rw-font: Verdana,Arial,sans-serif;
  --rw-radius: 13px;
}

.hwhx-build-lite[data-hwhx-ui-theme="storm-workshop"] {
  --rw-overlay: #03070ac2;
  --rw-dialog: linear-gradient(180deg,#14232b,#070c10);
  --rw-header: linear-gradient(90deg,#264452,#6b4e1a);
  --rw-actions: #080d10;
  --rw-panel: #172932;
  --rw-control: linear-gradient(180deg,#274450,#0b141a);
  --rw-control-hover: #345866;
  --rw-border: #699db4;
  --rw-text: #eef8ff;
  --rw-muted: #9db6c5;
  --rw-primary: #79d8ff;
  --rw-accent: #ffcf5b;
  --rw-font: Consolas,"Segoe UI",monospace;
  --rw-radius: 4px;
}

.hwhx-build-lite[data-hwhx-ui-theme="flat-graphite"] {
  --rw-overlay: #080a0cad;
  --rw-dialog: #181c20;
  --rw-header: #22282e;
  --rw-actions: #15191d;
  --rw-panel: #232930;
  --rw-control: #2b3138;
  --rw-control-hover: #343c44;
  --rw-border: #5d6874;
  --rw-text: #f2f5f7;
  --rw-muted: #b6c0ca;
  --rw-primary: #45c486;
  --rw-accent: #8fb8d8;
  --rw-font: "Segoe UI",Arial,sans-serif;
  --rw-radius: 0;
}

.hwhx-build-lite[data-hwhx-ui-theme="fluent-2-dark"] {
  --rw-overlay: #080c14b8;
  --rw-dialog: #20252d;
  --rw-header: #292f39;
  --rw-actions: #181c22;
  --rw-panel: #252b34;
  --rw-control: #303844;
  --rw-control-hover: #394453;
  --rw-border: #64748b;
  --rw-text: #f5f7fa;
  --rw-muted: #b9c2cf;
  --rw-primary: #60cdff;
  --rw-accent: #a7d8f3;
  --rw-font: "Segoe UI Variable","Segoe UI",Arial,sans-serif;
  --rw-radius: 8px;
}

.hwhx-build-lite[data-hwhx-ui-theme="material-3-expressive"] {
  --rw-overlay: #141218c2;
  --rw-dialog: #141218;
  --rw-header: #211f26;
  --rw-actions: #1d1b20;
  --rw-panel: #211f26;
  --rw-control: #36343b;
  --rw-control-hover: #3f3c45;
  --rw-border: #938f99;
  --rw-text: #e6e0e9;
  --rw-muted: #cac4d0;
  --rw-primary: #d0bcff;
  --rw-accent: #efb8c8;
  --rw-font: "Google Sans Text",Roboto,Arial,sans-serif;
  --rw-radius: 18px;
}

.hwhx-build-lite[data-hwhx-ui-theme="contrast-amber"] {
  --rw-overlay: #160f00c7;
  --rw-dialog: #160f00;
  --rw-header: #2a1e00;
  --rw-actions: #100a00;
  --rw-panel: #241900;
  --rw-control: #000;
  --rw-control-hover: #352700;
  --rw-border: #ffd54a;
  --rw-text: #fff8db;
  --rw-muted: #ffeaa0;
  --rw-primary: #00d4ff;
  --rw-accent: #ffd54a;
  --rw-font: "Arial Black",Arial,sans-serif;
  --rw-radius: 3px;
}

.hwhx-build-lite[data-hwhx-ui-theme] {
  --hwhx-theme-control-bg: var(--rw-control);
  --hwhx-theme-control-bg-hover: var(--rw-control-hover);
  --hwhx-theme-control-border: var(--rw-border);
  --hwhx-theme-control-border-hover: var(--rw-accent);
  --hwhx-theme-control-text: var(--rw-text);
  --hwhx-theme-muted: var(--rw-muted);
  --hwhx-theme-primary: var(--rw-primary);
  --hwhx-theme-text: var(--rw-text);
  color: var(--rw-text);
  font-family: var(--rw-font);
}

.hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] {
  background: var(--rw-overlay);
  color: var(--rw-text);
  font-family: var(--rw-font);
}

.hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-modal__dialog {
  border-color: var(--rw-border);
  border-radius: var(--rw-radius);
  background: var(--rw-dialog);
  color: var(--rw-text);
}

.hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-modal__header {
  border-color: var(--rw-border);
  background: var(--rw-header);
}

.hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-modal__actions {
  border-color: var(--rw-border);
  background: var(--rw-actions);
}

.hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-accordion {
  border-color: var(--rw-border);
  border-radius: var(--rw-radius);
  background: var(--rw-panel);
}

.hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-accordion__summary {
  background: var(--rw-control);
  color: var(--rw-text);
}

.hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-checkbox-row, .hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-checkbox-list__item, .hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-custom-row {
  border-color: var(--rw-border);
  background: var(--rw-panel);
  color: var(--rw-text);
}

.hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-field, .hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-input, .hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-button, .hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-icon-button {
  border-color: var(--rw-border);
  border-radius: var(--rw-radius);
  background: var(--rw-control);
  color: var(--rw-text);
  font-family: var(--rw-font);
}

.hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-button:hover, .hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-icon-button:hover {
  border-color: var(--rw-accent);
  background: var(--rw-control-hover);
}

.hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-hint, .hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhx-note, .hwhx-build-lite.hwhx-modal[data-hwhx-ui-theme] .hwhrewards-settings__help-text {
  border-color: var(--rw-border);
  background: var(--rw-panel);
  color: var(--rw-muted);
}

.hwhx-build-lite.hwhx-progress[data-hwhx-ui-theme] {
  border-color: var(--rw-border);
  border-radius: var(--rw-radius);
  background: var(--rw-dialog);
  color: var(--rw-text);
  font-family: var(--rw-font);
}

.hwhx-build-lite.hwhx-progress[data-hwhx-ui-theme] .hwhx-progress__header {
  border-color: var(--rw-border);
}

.hwhx-build-lite.hwhx-progress[data-hwhx-ui-theme] .hwhx-progress-bar {
  border-color: var(--rw-border);
  background: var(--rw-control);
}

.hwhx-build-lite.hwhx-progress[data-hwhx-ui-theme] .hwhx-progress-bar__fill {
  background: var(--rw-primary);
}
`;
	//#endregion
	//#region src/scripts/hwhrewards/domain/plan-rewards.ts
	/**
	* Типы с id предмета внутри (InventoryItemType игры). У остальных объектных наград
	* внутренний ключ — не предмет: battlePassExp хранит id пропуска, его суммируем как скаляр.
	*/
	var ITEM_REWARD_TYPES = /* @__PURE__ */ new Set([
		"gear",
		"fragmentGear",
		"petGear",
		"scroll",
		"fragmentScroll",
		"consumable",
		"coin",
		"ascensionGear",
		"bannerStone",
		"hero",
		"fragmentHero",
		"titan",
		"fragmentTitan",
		"pet",
		"fragmentPet",
		"artifact",
		"fragmentArtifact",
		"titanArtifact",
		"fragmentTitanArtifact",
		"skin",
		"fragmentSkin",
		"refillable",
		"clanIconFrame",
		"avatar",
		"avatarFrame",
		"sticker"
	]);
	/** Суммарные награды выбранных решений: что именно придёт в инвентарь. */
	function summarizePlanRewards(decisions) {
		const totals = /* @__PURE__ */ new Map();
		const add = (itemType, itemId, amount) => {
			var _totals$get;
			if (!(amount > 0)) return;
			const key = `${itemType}:${itemId}`;
			const entry = (_totals$get = totals.get(key)) !== null && _totals$get !== void 0 ? _totals$get : {
				key,
				itemType,
				itemId,
				amount: 0
			};
			entry.amount += amount;
			totals.set(key, entry);
		};
		for (const decision of decisions) for (const [type, value] of Object.entries(asPlainRecord(decision.candidate.reward))) if (value !== null && typeof value === "object") {
			const inner = Object.entries(asPlainRecord(value));
			if (ITEM_REWARD_TYPES.has(type)) for (const [id, amount] of inner) add(type, id, Number(amount));
			else add(type, "", inner.reduce((sum, [, amount]) => sum + (Number(amount) || 0), 0));
		} else add(type, "", Number(value));
		return [...totals.values()].sort((a, b) => a.key.localeCompare(b.key));
	}
	/** Ключи наград, которые классификатор не узнал: план показывает их, а не молчит. */
	function unknownRewardKeys(decisions) {
		const keys = /* @__PURE__ */ new Set();
		for (const decision of decisions) for (const key of Object.keys(asPlainRecord(decision.candidate.reward))) if (!INDEXED_REWARD_KEYS.has(key) && classifyRewardKey(key) === "unknown") keys.add(key);
		return [...keys].sort();
	}
	//#endregion
	//#region src/shared/ui/styles-hotkeys.ts
	var HOTKEY_STYLE_ID = "hwh-shared-ui-hotkey-style";
	var HOTKEY_CSS = `.hwhx-hotkey-input {
  width: var(--hwhx-field-width, 280px);
  gap: 5px;
  max-width: 100%;
  display: grid;
}

.hwhx-hotkey-input__control {
  border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid)
    var(--hwhx-theme-control-border, #8d6133e6);
  border-radius: var(--hwhx-theme-radius-control, 7px);
  background: var(--hwhx-theme-control-bg, #24160f);
  min-width: 0;
  min-height: 36px;
  box-shadow: var(--hwhx-theme-control-shadow, inset 0 1px 0 #ffffff0f);
  box-sizing: border-box;
  align-items: stretch;
  display: flex;
  overflow: hidden;
}

.hwhx-hotkey-input__capture, .hwhx-hotkey-input__clear {
  appearance: none;
  color: var(--hwhx-theme-control-text, #f7e0bc);
  cursor: pointer;
  font: inherit;
  letter-spacing: 0;
  background: none;
  border: 0;
}

.hwhx-hotkey-input__capture {
  text-align: left;
  flex: auto;
  justify-content: flex-start;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 7px 11px;
  font-size: 13px;
  font-weight: 800;
  display: inline-flex;
}

.hwhx-hotkey-input__capture span {
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;
}

.hwhx-hotkey-input__clear {
  border-left: 1px solid
    color-mix(in srgb, var(--hwhx-theme-control-border-hover, #c68739) 54%, transparent);
  width: 36px;
  color: var(--hwhx-theme-muted, #b89f78);
  flex: 0 0 36px;
  place-items: center;
  display: inline-grid;
}

.hwhx-hotkey-input__capture:hover, .hwhx-hotkey-input__clear:hover {
  background: var(--hwhx-theme-control-bg-hover, #2d1b11);
  color: var(--hwhx-theme-control-text-hover, #fff);
}

.hwhx-hotkey-input.is-recording .hwhx-hotkey-input__control {
  border-color: var(--hwhx-theme-primary, #7fe3ba);
  box-shadow: var(--hwhx-theme-control-focus-shadow, 0 0 0 2px #7fe3ba29);
}

.hwhx-hotkey-input.is-recording .hwhx-hotkey-input__capture {
  color: var(--hwhx-theme-primary, #7fe3ba);
}

.hwhx-hotkey-input.is-conflicting .hwhx-hotkey-input__control {
  border-color: var(--hwhx-theme-semantic-red, #ef6560);
}

.hwhx-hotkey-input__error {
  color: var(--hwhx-theme-semantic-red, #ff8f8b);
  font-size: 11px;
  font-weight: 750;
  line-height: 1.25;
}

.hwhx-hotkey-input.is-disabled {
  opacity: .55;
}

.hwhx-hotkey-input button:disabled {
  cursor: not-allowed;
}
`;
	function ensureSharedUiHotkeyStyles() {
		injectStyle(HOTKEY_STYLE_ID, HOTKEY_CSS);
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
		row.appendChild(createNativeNumberInput(value, min, max, onChange));
		return row;
	}
	function createNativeNumberInput(value, min, max, onChange) {
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
	function createNativeHotkeyRow(label, value, labels, onChange) {
		ensureSharedUiHotkeyStyles();
		const row = document.createElement("div");
		row.className = "hwhx-field-row";
		row.appendChild(createNativeText("span", "hwhx-settings-label", label));
		const root = document.createElement("span");
		root.className = "hwhx-hotkey-input";
		const control = document.createElement("span");
		control.className = "hwhx-hotkey-input__control";
		const capture = document.createElement("button");
		capture.type = "button";
		capture.className = "hwhx-hotkey-input__capture";
		capture.dataset.hwhxHotkeyCapture = "1";
		const icon = document.createElement("span");
		icon.innerHTML = renderIcon("keyboard", { size: 17 });
		const display = document.createElement("span");
		const clear = document.createElement("button");
		clear.type = "button";
		clear.className = "hwhx-hotkey-input__clear";
		clear.innerHTML = renderIcon("x", { size: 15 });
		clear.ariaLabel = labels.clear;
		clear.dataset.hwhxNativeTitle = labels.clear;
		let current = normalizeHotkey(value);
		let recording = false;
		function render() {
			root.classList.toggle("is-recording", recording);
			capture.ariaPressed = recording ? "true" : "false";
			capture.ariaLabel = recording ? labels.recording : labels.capture;
			capture.dataset.hwhxNativeTitle = labels.capture;
			display.textContent = recording ? labels.recording : formatHotkey(current) || labels.empty;
			clear.hidden = !current;
		}
		capture.addEventListener("click", () => {
			recording = true;
			render();
			capture.focus();
		});
		capture.addEventListener("blur", () => {
			recording = false;
			render();
		});
		capture.addEventListener("keydown", (event) => {
			if (!recording) return;
			event.preventDefault();
			event.stopPropagation();
			if (event.code === "Escape") {
				recording = false;
				render();
				return;
			}
			if (event.code === "Backspace" || event.code === "Delete") {
				current = "";
				recording = false;
				onChange(current);
				render();
				return;
			}
			const nextValue = hotkeyFromKeyboardEvent(event);
			if (!nextValue) return;
			current = nextValue;
			recording = false;
			onChange(current);
			render();
		});
		clear.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			current = "";
			recording = false;
			onChange(current);
			render();
		});
		capture.append(icon, display);
		control.append(capture, clear);
		root.appendChild(control);
		row.appendChild(root);
		render();
		return row;
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
	//#region src/scripts/hwhrewards/ui/lite/native-settings-view.ts
	function renderNativeRewardsSettings(props) {
		const state = toNativeRecord(props.state);
		const translate = readNativeTranslate(props.translate);
		const root = document.createElement("form");
		root.className = "hwhx-native-body hwhrewards-settings hwhrewards-settings--lite";
		root.addEventListener("submit", (event) => event.preventDefault());
		root.appendChild(createHint(translate("HWHREWARDS_SETTINGS_INTRO")));
		const sources = createNativeDetails(translate("HWHREWARDS_SETTINGS_SOURCES"), true);
		for (const descriptor of REWARD_SOURCE_DESCRIPTORS) sources.body.appendChild(createRewardCheckbox(translate(descriptor.labelKey), translate(descriptor.detailKey), state.sources[descriptor.id], (checked) => {
			state.sources[descriptor.id] = checked;
		}));
		root.appendChild(sources.root);
		for (const [index, group] of [
			{
				scope: "mail",
				key: "HWHREWARDS_SETTINGS_MAIL_POLICY"
			},
			{
				scope: "quest",
				key: "HWHREWARDS_SETTINGS_QUEST_POLICY"
			},
			{
				scope: "event",
				key: "HWHREWARDS_SETTINGS_EVENT_POLICY"
			}
		].entries()) {
			const section = createNativeDetails(translate(group.key), index === 0);
			section.body.appendChild(createPolicyNote(translate("HWHREWARDS_POLICY_HINT")));
			for (const descriptor of REWARD_CATEGORY_DESCRIPTORS) section.body.appendChild(createRewardCheckbox(translate(descriptor.labelKey), translate(descriptor.detailKey), state.policies[group.scope].includes(descriptor.id), (checked) => {
				state.policies[group.scope] = updateCategoryList(state.policies[group.scope], descriptor.id, checked);
			}));
			root.appendChild(section.root);
		}
		root.appendChild(renderBehavior(state, translate));
		root.appendChild(renderAutomation(state, translate, toNativeRecordList(props.doYourBestPlacementOptions)));
		root.appendChild(renderProgress(state, translate));
		return root;
	}
	function renderNativeRewardsPlan(props) {
		var _decisions$selected, _decisions$skipped, _decisions$skipped2;
		const plan = toNativeRecord(props.plan);
		const translate = readNativeTranslate(props.translate);
		const root = document.createElement("section");
		root.className = "hwhx-native-body hwhrewards-plan hwhrewards-plan--lite";
		const heading = createNativeText("h2", "hwhrewards-plan__heading", translate("HWHREWARDS_CONFIRM_TITLE"));
		const headingId = "hwhrewards-lite-plan-heading";
		heading.id = headingId;
		root.setAttribute("aria-labelledby", headingId);
		const selectedCount = Array.isArray(plan.selected) ? plan.selected.length : 0;
		const skippedCount = Array.isArray(plan.skipped) ? plan.skipped.length : 0;
		root.append(heading, createHint(translate("HWHREWARDS_CONFIRM_NOTE")), createNativeText("p", "hwhx-summary", translate("HWHREWARDS_PLAN_SELECTED", { count: selectedCount })));
		if (skippedCount > 0) root.appendChild(createNativeText("p", "hwhx-summary", translate("HWHREWARDS_PLAN_SKIPPED", { count: skippedCount })));
		const decisions = plan;
		const rewards = summarizePlanRewards((_decisions$selected = decisions.selected) !== null && _decisions$selected !== void 0 ? _decisions$selected : []);
		if (rewards.length > 0) root.appendChild(renderLitePlanRewards(rewards, props));
		const requirementNotMet = ((_decisions$skipped = decisions.skipped) !== null && _decisions$skipped !== void 0 ? _decisions$skipped : []).filter((decision) => decision.reason === "requirementNotMet").length;
		if (requirementNotMet > 0) root.appendChild(createNativeText("p", "hwhx-summary", translate("HWHREWARDS_PLAN_REQUIREMENT", { count: requirementNotMet })));
		const unknown = unknownRewardKeys((_decisions$skipped2 = decisions.skipped) !== null && _decisions$skipped2 !== void 0 ? _decisions$skipped2 : []);
		if (unknown.length > 0) root.appendChild(createNativeText("p", "hwhx-summary", translate("HWHREWARDS_PLAN_UNKNOWN", { keys: unknown.join(", ") })));
		return root;
	}
	/** Те же игровые иконки, что в Vue-редакции: картинка подставляется, когда атлас прогрузится. */
	function renderLitePlanRewards(rewards, props) {
		const resolveIcon = props.rewardIcon;
		const resolveName = props.rewardName;
		const list = document.createElement("ul");
		list.className = "hwhrewards-plan__lite-rewards";
		list.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none";
		for (const item of rewards) {
			var _resolveName;
			const entry = document.createElement("li");
			entry.style.cssText = "display:grid;justify-items:center;gap:2px;min-width:44px";
			entry.dataset.hwhxNativeTitle = (_resolveName = resolveName === null || resolveName === void 0 ? void 0 : resolveName(item.itemType, item.itemId)) !== null && _resolveName !== void 0 ? _resolveName : item.itemType;
			const image = document.createElement("img");
			image.width = 32;
			image.height = 32;
			image.alt = entry.dataset.hwhxNativeTitle;
			image.style.visibility = "hidden";
			resolveIcon === null || resolveIcon === void 0 || resolveIcon(item.itemType, item.itemId).then((url) => {
				if (!url) return;
				image.src = url;
				image.style.visibility = "visible";
			}).catch(() => void 0);
			entry.append(image, createNativeText("span", "", String(item.amount)));
			list.appendChild(entry);
		}
		return list;
	}
	function renderBehavior(state, translate) {
		const section = createNativeDetails(translate("HWHREWARDS_SETTINGS_BEHAVIOR"));
		section.body.append(createRewardCheckbox(translate("HWHREWARDS_EXPIRING_MAIL"), translate("HWHREWARDS_EXPIRING_MAIL_DETAIL"), state.collectExpiringMail, (checked) => {
			state.collectExpiringMail = checked;
		}), createNativeNumberRow(translate("HWHREWARDS_EXPIRING_MAIL_HOURS"), state.expiringMailHours, 1, 168, (value) => {
			state.expiringMailHours = value;
		}), createNativeCheckboxRow(translate("HWHREWARDS_CONFIRM_BEFORE_COLLECT"), state.confirmBeforeCollect, (checked) => {
			state.confirmBeforeCollect = checked;
		}), createNativeCheckboxRow(translate("HWHREWARDS_SYNC_AFTER_COLLECT"), state.syncAfterCollect, (checked) => {
			state.syncAfterCollect = checked;
		}), createNativeNumberRow(translate("HWHREWARDS_MAX_QUEST_PASSES"), state.maxQuestPasses, 1, 10, (value) => {
			state.maxQuestPasses = value;
		}));
		return section.root;
	}
	function renderProgress(state, translate) {
		var _root$querySelector;
		const root = createNativeProgressOptionsSection({
			value: {
				autoHide: state.progressAutoHideResult,
				autoHideMs: state.progressAutoHideResultTimeoutMs,
				position: state.progressWindowPosition,
				style: state.progressWindowStyle
			},
			labels: {
				title: translate("HWHREWARDS_SETTINGS_PROGRESS"),
				autoHide: translate("HWHREWARDS_PROGRESS_AUTO_HIDE"),
				autoHideMs: translate("HWHREWARDS_PROGRESS_AUTO_HIDE_TIMEOUT"),
				position: translate("HWHREWARDS_PROGRESS_POSITION"),
				style: translate("HWHREWARDS_PROGRESS_STYLE")
			},
			positionOptions: [
				"top-center",
				"top-right",
				"bottom-right"
			].map((value) => ({
				value,
				label: translate(`HWHREWARDS_PROGRESS_${value.replaceAll("-", "_").toUpperCase()}`)
			})),
			styleOptions: [
				"default",
				"compact",
				"dashboard"
			].map((value) => ({
				value,
				label: translate(`HWHREWARDS_PROGRESS_${value.toUpperCase()}`)
			})),
			onUpdate: (value) => {
				state.progressAutoHideResult = value.autoHide;
				state.progressAutoHideResultTimeoutMs = value.autoHideMs;
				state.progressWindowPosition = value.position;
				state.progressWindowStyle = value.style;
			}
		});
		(_root$querySelector = root.querySelector(".hwhx-accordion__body")) === null || _root$querySelector === void 0 || _root$querySelector.appendChild(createNativeSelectRow(translate("HWHREWARDS_THEME"), state.uiTheme, REWARDS_LITE_THEME_OPTIONS.map((theme) => ({
			value: theme.value,
			label: resolveThemeLabel(theme.labelKey, theme.label)
		})), (value) => {
			state.uiTheme = value;
			const modal = root.closest(".hwhx-modal");
			if (modal) modal.dataset.hwhxUiTheme = value;
		}));
		return root;
		function resolveThemeLabel(key, fallback) {
			const translated = translate(key);
			return translated && translated !== key ? translated : fallback;
		}
	}
	function renderAutomation(state, translate, placementOptions) {
		const section = createNativeDetails(translate("HWHREWARDS_SETTINGS_AUTOMATION"));
		const hotkeyLabels = {
			empty: translate("HWHREWARDS_HOTKEY_EMPTY"),
			capture: translate("HWHREWARDS_HOTKEY_CAPTURE"),
			recording: translate("HWHREWARDS_HOTKEY_RECORDING"),
			clear: translate("HWHREWARDS_HOTKEY_CLEAR")
		};
		section.body.append(createNativeSelectRow(translate("HWHREWARDS_DO_YOUR_BEST_POSITION"), state.doYourBestPlacement, placementOptions, (value) => {
			state.doYourBestPlacement = value;
		}), createNativeHotkeyRow(translate("HWHREWARDS_HOTKEY_OPEN_SETTINGS"), state.hotkeys.openSettings, hotkeyLabels, (value) => {
			state.hotkeys.openSettings = value;
		}), createNativeHotkeyRow(translate("HWHREWARDS_HOTKEY_COLLECT"), state.hotkeys.collectRewards, hotkeyLabels, (value) => {
			state.hotkeys.collectRewards = value;
		}));
		return section.root;
	}
	function createRewardCheckbox(label, detail, checked, onChange) {
		const root = document.createElement("div");
		root.className = "hwhrewards-settings__option";
		const row = createNativeCheckboxRow(label, checked, onChange);
		row.dataset.hwhxNativeTitle = detail;
		const helpText = createNativeText("p", "hwhrewards-settings__help-text", detail);
		helpText.hidden = true;
		const help = document.createElement("button");
		help.type = "button";
		help.className = "hwhx-button hwhx-button--mini hwhrewards-settings__help";
		help.textContent = "?";
		help.ariaLabel = detail;
		help.ariaExpanded = "false";
		help.dataset.hwhxNativeTitle = detail;
		help.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			helpText.hidden = !helpText.hidden;
			help.ariaExpanded = helpText.hidden ? "false" : "true";
		});
		row.appendChild(help);
		root.append(row, helpText);
		return root;
	}
	function createHint(text) {
		const hint = createNativeText("p", "hwhx-hint", text);
		hint.setAttribute("role", "note");
		return hint;
	}
	function createPolicyNote(text) {
		const note = createNativeText("p", "hwhx-note", text);
		note.setAttribute("role", "note");
		return note;
	}
	function updateCategoryList(categories, category, enabled) {
		const values = new Set(categories);
		if (enabled) values.add(category);
		else values.delete(category);
		return [...values];
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
	//#region src/shared/ui/vue/modal-header.ts
	function buildTelegramUrl(author, fallbackUsername = "askja") {
		return resolveSupportTelegramUrl(author, fallbackUsername);
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
			const link = asPlainRecord(value);
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
	//#endregion
	//#region src/scripts/hwhrewards/ui/lite/modal-header.ts
	var REWARDS_MANAGER_NAME = "HWH Rewards Manager";
	var RuntimeTextPanel = defineNativeView("rewards-manager-text-panel", renderNativeTextPanel);
	function buildRewardsManagerModalHeader() {
		const script = readRewardsManagerUserscriptInfo();
		const helper = readHeroWarsHelperRuntimeStatus();
		const helperAuthor = helper.author || "zingery";
		return {
			title: REWARDS_MANAGER_NAME,
			badges: [
				{
					key: "script-version",
					label: `v${script.version}`,
					tone: "blue"
				},
				{
					key: "helper-version",
					label: `HWH v${helper.version || "?"}`,
					tone: helper.available ? "green" : "red"
				},
				{
					key: "release-channel",
					label: "Lite",
					tone: "gray"
				}
			],
			authors: [{
				id: "script-author",
				label: script.author,
				href: buildTelegramUrl(script.author, "askja"),
				tone: "script"
			}, {
				id: "helper-author",
				label: helperAuthor,
				href: buildTelegramUrl(helperAuthor, "zingery"),
				tone: "helper"
			}]
		};
	}
	function buildRewardsManagerHeaderActions(translate) {
		return [
			createAction("exportSettings", translate("HWHREWARDS_EXPORT_SETTINGS"), "download"),
			createAction("importSettings", translate("HWHREWARDS_IMPORT_SETTINGS"), "upload", true),
			createAction("help", translate("HWHREWARDS_DOCS_TITLE"), "circle-help", true)
		];
	}
	function buildRewardsManagerModalActions(translate) {
		return [
			{
				result: "donate",
				label: translate("HWHREWARDS_DONATE_TITLE"),
				title: translate("HWHREWARDS_DONATE_TITLE"),
				icon: "coins",
				tone: "secondary",
				placement: "left",
				iconOnly: true
			},
			{
				result: "save",
				label: translate("HWHREWARDS_SAVE"),
				icon: "save",
				tone: "success",
				closeOnClick: false
			},
			{
				result: "run",
				label: translate("HWHREWARDS_SAVE_AND_RUN"),
				icon: "play",
				tone: "primary"
			}
		];
	}
	async function openRewardsManagerDocumentationModal(translate, uiTheme) {
		await openNativeComponentModal({
			kind: "documentation",
			title: translate("HWHREWARDS_DOCS_TITLE"),
			header: buildRewardsManagerModalHeader(),
			component: RuntimeTextPanel,
			props: {
				note: translate("HWHREWARDS_DOCS_TEXT"),
				links: SUPPORT_DOCUMENTATION_LINKS.map((link, index) => ({
					label: translate(index === 0 ? "HWHREWARDS_DOCS_PRIMARY" : "HWHREWARDS_DOCS_MIRROR", index === 0 ? void 0 : { number: index }),
					url: link.url
				}))
			},
			actions: [{
				result: "close",
				label: translate("HWHREWARDS_CLOSE")
			}],
			uiTheme: String(uiTheme !== null && uiTheme !== void 0 ? uiTheme : "classic")
		});
	}
	async function openRewardsManagerDonateModal(translate, uiTheme) {
		await openNativeComponentModal({
			kind: "donate",
			title: translate("HWHREWARDS_DONATE_TITLE"),
			header: buildRewardsManagerModalHeader(),
			component: RuntimeTextPanel,
			props: {
				note: `${translate("HWHREWARDS_DONATE_TEXT")}\n${translate("HWHREWARDS_DONATE_WALLET", { wallet: SUPPORT_DONATE_WALLET })}`,
				links: SUPPORT_DONATE_PROVIDERS
			},
			actions: [{
				result: "close",
				label: translate("HWHREWARDS_CLOSE")
			}],
			uiTheme: String(uiTheme !== null && uiTheme !== void 0 ? uiTheme : "classic")
		});
	}
	function createAction(result, label, icon, closeOnClick = false) {
		return {
			result,
			label,
			title: label,
			icon,
			iconOnly: true,
			closeOnClick
		};
	}
	function readRewardsManagerUserscriptInfo() {
		var _1175Lite, _Askja;
		return {
			version: String((_1175Lite = "0.1.175-lite.1") !== null && _1175Lite !== void 0 ? _1175Lite : "").trim() || "?",
			author: String((_Askja = "Askja") !== null && _Askja !== void 0 ? _Askja : "").trim() || "Askja"
		};
	}
	//#endregion
	//#region src/scripts/hwhrewards/runtime/lite/ui-port.ts
	var RuntimeRewardsSettingsPanel = defineNativeView("rewards-settings", renderNativeRewardsSettings);
	var RuntimeRewardsPlanPanel = defineNativeView("rewards-plan", renderNativeRewardsPlan);
	var createRuntimeProgressController = createNativeProgressController;
	var showRuntimeToast = showNativeToast;
	var openRuntimeComponentModal = openNativeComponentModal;
	var isRuntimeModalVisible = isNativeModalVisible;
	/** Lite без загрузчика атласов: план показывает названия и количества без картинок. */
	var createRuntimeRewardIcons = (_readLibrary) => null;
	var REWARDS_LITE_THEME_STYLE_ID = "hwhrewards-lite-theme-style";
	function initializeRuntimeUi() {
		initializeNativeUi();
		injectStyle(REWARDS_LITE_THEME_STYLE_ID, REWARDS_LITE_THEME_CSS);
	}
	function setRuntimeUiTheme(theme) {
		const normalizedTheme = normalizeUiTheme(theme, "dominion");
		document.querySelectorAll(".hwhx-build-lite").forEach((element) => {
			element.dataset.hwhxUiTheme = normalizedTheme;
		});
	}
	//#endregion
	//#region src/scripts/hwhrewards/runtime/index.ts
	var MAIL_ONLY_SELECTION = {
		mail: true,
		regularQuest: false,
		eventQuest: false,
		battlePass: false,
		prestige: false,
		stageOffer: false
	};
	var QUEST_ONLY_SELECTION = {
		mail: false,
		regularQuest: true,
		eventQuest: true,
		battlePass: true,
		prestige: true,
		stageOffer: true
	};
	function initializeRewardsManagerExtension(attempt = 0) {
		var _GM_info$script$name, _GM_info, _GM_info$script$versi, _GM_info2, _GM_info$script$autho, _GM_info3;
		if (!retryHwhRuntimeInitialization({
			attempt,
			maxAttempts: 120,
			delayMs: 500,
			requiredKeys: [
				"HWHFuncs",
				"HWHData",
				"HWHClasses",
				"Caller",
				"lib"
			],
			readyWhen: () => isRewardsHelperButtonReady(globalThis.HWHData, globalThis.HWHClasses),
			retry: initializeRewardsManagerExtension,
			logPrefix: "[HWH Rewards]",
			scriptName: "HWH Rewards Manager"
		})) return;
		const { HWHFuncs, HWHData, HWHClasses, cheats } = globalThis;
		const lib = createLiveGameLibrary();
		installSettingsDownloadBridge();
		initializeRuntimeUi();
		const Caller = requireHeroWarsCaller(globalThis);
		const scriptInfo = {
			name: String((_GM_info$script$name = (_GM_info = GM_info) === null || _GM_info === void 0 || (_GM_info = _GM_info.script) === null || _GM_info === void 0 ? void 0 : _GM_info.name) !== null && _GM_info$script$name !== void 0 ? _GM_info$script$name : "HWH Rewards Manager"),
			version: String((_GM_info$script$versi = (_GM_info2 = GM_info) === null || _GM_info2 === void 0 || (_GM_info2 = _GM_info2.script) === null || _GM_info2 === void 0 ? void 0 : _GM_info2.version) !== null && _GM_info$script$versi !== void 0 ? _GM_info$script$versi : "?"),
			author: String((_GM_info$script$autho = (_GM_info3 = GM_info) === null || _GM_info3 === void 0 || (_GM_info3 = _GM_info3.script) === null || _GM_info3 === void 0 ? void 0 : _GM_info3.author) !== null && _GM_info$script$autho !== void 0 ? _GM_info$script$autho : "?")
		};
		const translate = createTranslator({
			I18N: HWHFuncs.I18N,
			cheats,
			i18nLangData: getRewardsManagerTranslations(),
			preferGameI18N: false,
			fallbackLanguage: "en",
			cacheMissingTranslations: true
		});
		const settingsRepository = createRewardsSettingsRepository();
		const readSettings = () => settingsRepository.readSync();
		const writeSettings = (value) => settingsRepository.writeSync(value);
		const { useStore: useRewardsSettingsStore } = createLocalforageSettingsStore("hwhrewards", DEFAULT_REWARDS_MANAGER_SETTINGS, normalizeRewardsManagerSettings, {
			getStorageScopeKey: () => globalThis.userId,
			read: () => settingsRepository.read(),
			write: (settings) => settingsRepository.write(settings)
		});
		const progress = createRuntimeProgressController({
			scriptId: "hwhrewards",
			title: scriptInfo.name,
			settings: readSettings()
		});
		setRuntimeUiTheme(readSettings().uiTheme);
		const settingsTransfer = createRewardsSettingsTransferController({
			translate,
			getScriptInfo: () => scriptInfo,
			getUiTheme: () => readSettings().uiTheme,
			writeSettings: (settings) => writeSettings(settings),
			showNotice: (message) => {
				progress.showResult(String(message !== null && message !== void 0 ? message : ""), {
					resultTone: "success",
					autoHide: 2500
				});
			}
		});
		const collector = createRewardsCollector({
			gateway: createHeroWarsRewardsGateway({ Caller }),
			library: lib,
			onProgress: (event) => {
				if (event.stage === "scan") {
					progress.setProgress(translate("HWHREWARDS_PROGRESS_SCAN"));
					return;
				}
				if (event.stage === "questPass") {
					progress.setProgress(translate("HWHREWARDS_PROGRESS_QUEST_PASS", { pass: event.pass + 1 }));
					return;
				}
				progress.setProgress(translate("HWHREWARDS_PROGRESS_COLLECT", {
					current: event.current,
					total: event.total
				}), false, { percent: event.total > 0 ? Math.round(event.current / event.total * 100) : 0 });
			}
		});
		let activeRun = null;
		const rewardIcon = createRuntimeRewardIcons(() => globalThis.lib);
		/** LIB_<TYPE>_NAME_<ID>; у фрагментов — имя базового предмета, у скаляров — LIB_PSEUDO_<CONST>. */
		const rewardName = (itemType, itemId) => {
			var _pseudo$constName;
			const base = itemType.replace(/^fragment([A-Z])/, (_, letter) => letter.toLowerCase());
			const pseudo = itemId ? null : findPseudoItem(asLibraryData(), itemType);
			const keys = pseudo ? [`LIB_PSEUDO_${(_pseudo$constName = pseudo.constName) !== null && _pseudo$constName !== void 0 ? _pseudo$constName : ""}`] : [`LIB_${base.toUpperCase()}_NAME_${itemId}`];
			for (const key of keys) {
				var _cheats$translate, _cheats$translate2;
				const text = String((_cheats$translate = cheats === null || cheats === void 0 || (_cheats$translate2 = cheats.translate) === null || _cheats$translate2 === void 0 ? void 0 : _cheats$translate2.call(cheats, key)) !== null && _cheats$translate !== void 0 ? _cheats$translate : "");
				if (text && text !== key) return text;
			}
			return itemId ? `${itemType} ${itemId}` : itemType;
		};
		HWHFuncs.addExtentionName(scriptInfo.name, scriptInfo.version, scriptInfo.author);
		console.log(`[HWH Rewards] ${translate("HWHREWARDS_START_LOG", scriptInfo)}`);
		async function openSettings() {
			const store = useRewardsSettingsStore();
			await store.load({ preferSource: true });
			setRuntimeUiTheme(store.state.uiTheme);
			progress.configure(store.state);
			let settingsSavePromise = null;
			function saveCurrentSettings(showNotice) {
				if (settingsSavePromise) return settingsSavePromise;
				settingsSavePromise = (async () => {
					await store.save();
					writeSettings(store.state);
					setRuntimeUiTheme(store.state.uiTheme);
					progress.configure(store.state);
					installDoYourBestPatch();
					if (showNotice) showRuntimeToast({
						id: "hwhrewards-settings-saved",
						title: scriptInfo.name,
						text: translate("HWHREWARDS_SETTINGS_SAVED"),
						tone: "success",
						timeoutMs: 2500
					});
				})().finally(() => {
					settingsSavePromise = null;
				});
				return settingsSavePromise;
			}
			while (true) {
				const result = await openRuntimeComponentModal({
					title: translate("HWHREWARDS_SETTINGS_TITLE"),
					header: buildRewardsManagerModalHeader(),
					headerActions: buildRewardsManagerHeaderActions(translate),
					component: RuntimeRewardsSettingsPanel,
					props: {
						state: store.state,
						translate,
						doYourBestPlacementOptions: getDoYourBestPlacementOptions()
					},
					actions: buildRewardsManagerModalActions(translate),
					className: "hwhx-popup--wide hwhrewards-modal",
					uiTheme: store.state.uiTheme,
					closeLabel: translate("HWHREWARDS_CLOSE"),
					onAction: async (actionResult) => {
						try {
							if (actionResult === "exportSettings") await settingsTransfer.exportToJson(store.state);
							else if (actionResult === "save") await saveCurrentSettings(true);
						} catch (error) {
							showSettingsError(error);
						}
					}
				});
				if (!result) return;
				if (result === "exportSettings") {
					await settingsTransfer.exportToJson(store.state);
					continue;
				}
				if (result === "importSettings") {
					try {
						if (await settingsTransfer.importFromJson()) {
							await store.load({
								force: true,
								preferSource: true
							});
							setRuntimeUiTheme(store.state.uiTheme);
							progress.configure(store.state);
							installDoYourBestPatch();
						}
					} catch (error) {
						showSettingsError(error);
					}
					continue;
				}
				if (result === "help") {
					await openRewardsManagerDocumentationModal(translate, store.state.uiTheme);
					continue;
				}
				if (result === "donate") {
					await openRewardsManagerDonateModal(translate, store.state.uiTheme);
					continue;
				}
				if (result !== "run") continue;
				try {
					await saveCurrentSettings(false);
				} catch (error) {
					showSettingsError(error);
					continue;
				}
				await runCollection({ source: "settings" });
				return;
			}
		}
		function showSettingsError(error) {
			const message = error instanceof Error ? error.message : String(error !== null && error !== void 0 ? error : "");
			console.error("[HWH Rewards] settings action failed", error);
			showRuntimeToast({
				id: "hwhrewards-settings-error",
				title: scriptInfo.name,
				text: translate("HWHREWARDS_ERROR", { message: message || "Unknown error" }),
				tone: "danger",
				timeoutMs: 6e3
			});
		}
		async function confirmPlan(plan, settings) {
			if (!settings.confirmBeforeCollect) return true;
			initializeRuntimeUi();
			setRuntimeUiTheme(settings.uiTheme);
			return await openRuntimeComponentModal({
				title: translate("HWHREWARDS_CONFIRM_TITLE"),
				header: buildRewardsManagerModalHeader(),
				component: RuntimeRewardsPlanPanel,
				props: {
					plan,
					translate,
					...rewardIcon ? { rewardIcon } : {},
					rewardName
				},
				actions: [{
					label: translate("HWHREWARDS_CANCEL"),
					result: "cancel",
					icon: "x",
					tone: "secondary",
					placement: "left"
				}, {
					label: translate("HWHREWARDS_COLLECT"),
					result: "collect",
					icon: "package-check",
					tone: "success"
				}],
				className: "hwhrewards-plan-modal",
				uiTheme: settings.uiTheme,
				closeLabel: translate("HWHREWARDS_CLOSE")
			}) === "collect";
		}
		async function runCollection({ source, selection = {} }) {
			if (activeRun) return activeRun;
			activeRun = (async () => {
				try {
					initializeRuntimeUi();
					const storedSettings = readSettings();
					const settings = source.startsWith("doYourBest") ? {
						...storedSettings,
						confirmBeforeCollect: false
					} : storedSettings;
					progress.configure(settings);
					await waitForGameLibrary(["quest", "battlePass"]);
					const plan = await collector.preparePlan(settings, selection);
					if (plan.selected.length === 0) {
						progress.showResult(translate("HWHREWARDS_NOTHING"), {
							resultTone: "success",
							statusLabel: translate("HWHREWARDS_STATUS_NOTHING")
						});
						return null;
					}
					if (!await confirmPlan(plan, settings)) {
						progress.hideProgress();
						return null;
					}
					const result = await collector.collectPlan({
						plan,
						settings,
						selection
					});
					if (settings.syncAfterCollect && !source.startsWith("doYourBest")) runGameSynchronization({ cheats });
					progress.showResult(translate("HWHREWARDS_RESULT", {
						collected: result.collected,
						skipped: result.skipped,
						failed: result.failed
					}), {
						resultTone: result.failed > 0 ? result.collected > 0 ? "warning" : "danger" : "success",
						...result.failed > 0 ? { autoHide: false } : {}
					});
					return result;
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error !== null && error !== void 0 ? error : "");
					console.error("[HWH Rewards] run failed", error);
					progress.showResult(translate("HWHREWARDS_ERROR", { message: message || "Unknown error" }), {
						resultTone: "danger",
						autoHide: false
					});
					return null;
				} finally {
					activeRun = null;
				}
			})();
			return activeRun;
		}
		function installDoYourBestPatch() {
			const settings = readSettings();
			installRewardsDoYourBestPatch({
				helperClasses: HWHClasses,
				collectAll: () => runCollection({ source: "doYourBestAll" }),
				collectMail: () => runCollection({
					source: "doYourBestMail",
					selection: MAIL_ONLY_SELECTION
				}),
				collectQuests: () => runCollection({
					source: "doYourBestQuests",
					selection: QUEST_ONLY_SELECTION
				}),
				placement: settings.doYourBestPlacement,
				taskLabel: translate("HWHREWARDS_DO_YOUR_BEST_TASK")
			});
		}
		function getDoYourBestPlacementOptions() {
			return buildDoYourBestPlacementOptions({
				taskList: getDoYourBestTaskListSnapshot(getHeroWarsDoYourBestClass(HWHClasses), { logPrefix: "[HWH Rewards]" }).filter((task) => !isRewardsDoYourBestTask(task)),
				includeStart: true,
				translate: (key, variables) => translate(key, variables),
				keys: {
					none: "HWHREWARDS_DO_YOUR_BEST_NONE",
					start: "HWHREWARDS_DO_YOUR_BEST_START",
					end: "HWHREWARDS_DO_YOUR_BEST_END",
					before: "HWHREWARDS_DO_YOUR_BEST_BEFORE",
					after: "HWHREWARDS_DO_YOUR_BEST_AFTER"
				}
			});
		}
		if (!installRewardsHelperButtonPatch({
			helperData: HWHData,
			helperClasses: HWHClasses,
			collectButton: {
				name: translate("HWHREWARDS_BUTTON"),
				title: translate("HWHREWARDS_BUTTON_TITLE"),
				color: "green",
				onClick: () => runCollection({ source: "button" })
			},
			settingsButton: {
				name: renderIcon("settings", {
					size: 18,
					title: translate("HWHREWARDS_SETTINGS_BUTTON")
				}),
				title: translate("HWHREWARDS_SETTINGS_BUTTON"),
				color: "green",
				onClick: openSettings
			}
		})) {
			console.error("[HWH Rewards]", translate("HWHREWARDS_PATCH_FAILED"));
			return;
		}
		installDoYourBestPatch();
		registerRewardsHotkeys({
			readSettings,
			translate: (key) => translate(key),
			openSettings,
			collectRewards: () => runCollection({ source: "hotkey" }),
			isAvailable: () => !isRuntimeModalVisible()
		});
	}
	function asLibraryData() {
		const library = globalThis.lib;
		return library === null || library === void 0 ? void 0 : library.data;
	}
	//#endregion
	//#region src/entries/hwhrewards-lite.user.ts
	initializeRewardsManagerExtension();
	//#endregion
})();
