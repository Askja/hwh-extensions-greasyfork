// ==UserScript==
// @name           HWH Titan Trainer Lite
// @name:en        HWH Titan Trainer Lite
// @namespace      http://tampermonkey.net/
// @version        1.4.226-lite.1
// @homepage       https://ext-askja.zingery.ru
// @updateURL      https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhtitanartifact-lite.meta.js
// @downloadURL    https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhtitanartifact-lite.user.js
// @supportURL     https://t.me/+ppLK1qqObB43NjMy
// @description    Облегчённый Titan Trainer без Vue, анимаций, тем, иконок и игровой графики.
// @description:en Lightweight Titan Trainer without Vue, animations, themes, icons, or game artwork.
// @author         Askja
// @match          https://www.hero-wars.com/*
// @match          https://www.hero-wars.cn/*
// @match          https://apps-1701433570146040.apps.fbsbx.com/*
// @icon           https://ext-askja.zingery.ru/script-icons/titanTrainer.webp
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
	* Глубокое клонирование: structuredClone с JSON.stringify fallback для старых браузеров.
	*/
	function cloneData(value) {
		if (globalThis.structuredClone) try {
			return globalThis.structuredClone(value);
		} catch (_unused) {}
		if (value == null) return value;
		return JSON.parse(JSON.stringify(value));
	}
	/**
	* Проверяет, является ли значение простым объектом (не null, не массив).
	*/
	function isPlainObject(value) {
		return value !== null && typeof value === "object" && !Array.isArray(value);
	}
	/**
	* Клонирует простой объект, для не-объектов возвращает {}.
	*/
	function clonePlainObject(value) {
		return isPlainObject(value) ? cloneData(value) : {};
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
	* Читает поле по ключу из значения неизвестной формы. Массив тоже считается
	* контейнером: игровые данные часто приходят списком там, где ожидался словарь.
	*/
	function getRecordValue$1(container, key) {
		return asObjectRecord(container)[String(key)];
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
	function buildCssVariableStyleMarkup(variables = {}) {
		const styleText = Object.entries(variables).filter(([name, value]) => /^--[a-z0-9_-]+$/i.test(name) && value !== void 0 && value !== null && value !== "").map(([name, value]) => `${name}:${String(value).replaceAll(";", "")}`).join(";");
		return styleText ? ` style="${escapeHtml(styleText)}"` : "";
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
	/**
	* Создаёт функцию-форматтер с предустановленными параметрами для formatSignedNumber.
	*/
	function createSignedNumberFormatter(options = {}) {
		var _options$locale3;
		const formatter = getNumberFormatter((_options$locale3 = options.locale) !== null && _options$locale3 !== void 0 ? _options$locale3 : getDocumentLocale());
		return function formatConfiguredSignedNumber(value) {
			const normalizedValue = Number(value) || 0;
			return `${normalizedValue > 0 ? "+" : ""}${formatter.format(normalizedValue)}`;
		};
	}
	/**
	* Достаёт человекочитаемое сообщение из ошибки любой формы: Error, строка,
	* ответ игрового API с description/message. Заменяет пять локальных вариантов.
	*/
	function getErrorMessage(error, fallbackMessage = "") {
		if (error instanceof Error) return error.message || fallbackMessage;
		if (typeof error === "string") return error || fallbackMessage;
		if (error !== null && typeof error === "object") {
			var _ref, _record$description;
			const record = error;
			const message = (_ref = (_record$description = record.description) !== null && _record$description !== void 0 ? _record$description : record.message) !== null && _ref !== void 0 ? _ref : record.name;
			return typeof message === "string" && message ? message : fallbackMessage;
		}
		return error === null || error === void 0 ? fallbackMessage : String(error) || fallbackMessage;
	}
	//#endregion
	//#region src/shared/expiring-async-cache.ts
	function createExpiringAsyncCache({ load, ttlMs, now = Date.now }) {
		let cached;
		let pending;
		let revision = 0;
		function invalidate() {
			cached = void 0;
			pending = void 0;
			revision += 1;
		}
		async function get() {
			var _pending;
			if (cached && cached.expiresAt > now()) return cached.value;
			const currentRevision = revision;
			(_pending = pending) !== null && _pending !== void 0 || (pending = load().then((value) => {
				if (currentRevision === revision) cached = {
					expiresAt: now() + Math.max(0, ttlMs),
					value
				};
				return value;
			}));
			const currentPending = pending;
			try {
				return await currentPending;
			} finally {
				if (pending === currentPending) pending = void 0;
			}
		}
		return {
			get,
			invalidate
		};
	}
	//#endregion
	//#region src/shared/game/api-calls.ts
	/**
	* Возвращает Promise, который разрешится через указанное количество миллисекунд.
	* @param {number} [milliseconds=0]
	* @returns {Promise<void>}
	*/
	function delay(milliseconds = 0) {
		const timeoutMs = Math.max(0, Math.floor(Number(milliseconds) || 0));
		return new Promise((resolve) => {
			globalThis.setTimeout(resolve, timeoutMs);
		});
	}
	/**
	* Отправляет массив вызовов через transport-функцию и нормализует результаты.
	* @param {{calls?: Array, transport?: Function, mapCall?: Function, normalizeResults?: Function, onAfterSend?: Function, fallbackErrorMessage?: string}} [options]
	* @returns {Promise<Array>}
	*/
	async function sendCallsWithTransport({ calls, transport, mapCall = (call) => call, normalizeResults = (value) => Array.isArray(value) ? value : [value], onAfterSend, fallbackErrorMessage = "Request failed." }) {
		const normalizedCalls = Array.isArray(calls) ? calls : [];
		const mappedCalls = normalizedCalls.map((call) => mapCall(call));
		const response = await transport(mappedCalls);
		if (response.error) throw new Error(getErrorMessage(response.error, fallbackErrorMessage));
		const rawResults = Array.isArray(response.results) ? response.results : normalizeResults(response);
		const results = Array.isArray(rawResults) ? rawResults : [];
		await (onAfterSend === null || onAfterSend === void 0 ? void 0 : onAfterSend({
			calls: normalizedCalls,
			mappedCalls,
			response,
			results
		}));
		return results;
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
			return normalizeDoYourBestPlacement(value, options);
		};
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
	/**
	* Строит сообщение пост-ран синхронизации, если syncAfterRun включён.
	*/
	function buildPostRunSyncMessage({ settings, options = void 0, skipSource = "checklist", runSync = runGameSynchronization, buildSuccessMessage, buildFailureMessage = () => "", logPrefix = "[HWHShared]" } = {}) {
		if (!(settings === null || settings === void 0 ? void 0 : settings.syncAfterRun) || (options === null || options === void 0 ? void 0 : options.source) === skipSource) return "";
		try {
			return runSync({ buildMessage: buildSuccessMessage });
		} catch (error) {
			console.error(`${logPrefix} post-run sync failed`, error);
			return buildFailureMessage(error);
		}
	}
	/**
	* Создаёт функцию для построения сообщения синхронизации с предустановленными опциями.
	*/
	function createPostRunSyncMessageBuilder(defaultOptions = {}) {
		return function buildConfiguredPostRunSyncMessage(options = {}) {
			return buildPostRunSyncMessage({
				...defaultOptions,
				...options
			});
		};
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
			var _hwhtitanartifactLit;
			const buildId = String((_hwhtitanartifactLit = "hwhtitanartifact-lite") !== null && _hwhtitanartifactLit !== void 0 ? _hwhtitanartifactLit : "").trim();
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
	var russianCollator;
	function compareRussianText(left, right) {
		var _russianCollator;
		(_russianCollator = russianCollator) !== null && _russianCollator !== void 0 || (russianCollator = new Intl.Collator("ru"));
		return russianCollator.compare(String(left !== null && left !== void 0 ? left : ""), String(right !== null && right !== void 0 ? right : ""));
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/i18n/index.ts
	var builtinEnDictionary = {
		HWHTITANART_START_LOG: "Starting extension {name} by {author} (v.{version})",
		HWHTITANART_RUNTIME_WAIT_ERROR: "Game runtime is still missing. The code is pretending not to exist again.",
		HWHTITANART_USER_ID_WAIT_ERROR: "userId still did not show up. The game decided to stay mysterious.",
		HWHTITANART_BUTTON: "Titan artifacts",
		HWHTITANART_BUTTON_TITLE: "Levels selected titan artifacts by the configured titan and artifact priority.",
		HWHTITANTRAINER_BUTTON: "Titans",
		HWHTITANTRAINER_BUTTON_TITLE: "Opens titan level, artifact and skin tools.",
		HWHTITANTRAINER_TAB_GENERAL: "General",
		HWHTITANTRAINER_TAB_ARTIFACTS: "Artifacts",
		HWHTITANTRAINER_TAB_LEVELS: "Levels",
		HWHTITANTRAINER_TAB_SKINS: "Skins",
		HWHTITANTRAINER_TECH_SECTION: "Additional",
		HWHTITANTRAINER_DONATE_TITLE: "Project support",
		HWHTITANTRAINER_DONATE_TEXT: "Direct transfer to an Alfa Bank card. No wallet relay, no mystery payment circus.",
		HWHTITANTRAINER_DONATE_WALLET: "Alfa Bank card: {wallet}",
		HWHTITANTRAINER_DONATE_QR_ALT: "Donation QR code",
		HWHTITANTRAINER_DONATE_QR_LABEL: "Bank transfer",
		HWHTITANTRAINER_STATUS_READY: "Ready",
		HWHTITANTRAINER_FEEDBACK_TEXT: "If you have problems not covered in the documentation, or a suggestion, please message me in",
		HWHTITANTRAINER_DOCS_TITLE: "Documentation",
		HWHTITANTRAINER_DOCS_TEXT: "Useful links for setup, mirrors and the shared UI kit.",
		HWHTITANTRAINER_DOCS_PRIMARY: "Documentation",
		HWHTITANTRAINER_DOCS_MIRROR: "Mirror {number}",
		HWHTITANTRAINER_DUMP_LIBRARY: "Game library",
		HWHTITANTRAINER_DUMP_LIBRARY_TITLE: "Print Hero Wars runtime and library objects to the console.",
		HWHTITANTRAINER_EXPORT_SETTINGS: "Export settings",
		HWHTITANTRAINER_IMPORT_SETTINGS: "Import settings",
		HWHTITANTRAINER_RUN_ACTIVE: "Run current tab",
		HWHTITANTRAINER_RUN_SELECT_TAB: "Open Artifacts, Levels or Skins to start a run.",
		HWHTITANTRAINER_RUN_SELECTION_REQUIRED: "Selection required",
		HWHTITANTRAINER_RUN_NOTHING_TO_DO: "Nothing to do",
		HWHTITANTRAINER_INTERFACE_SECTION: "Interface and information panel",
		HWHTITANTRAINER_UI_THEME_LABEL: "Interface theme",
		HWHTITANTRAINER_UI_THEME_DARK: "Dark",
		HWHTITANTRAINER_UI_THEME_LIGHT: "Light",
		HWHTITANTRAINER_UI_THEME_AUTO: "Auto (System)",
		HWHTITANTRAINER_UI_TOOLTIPS: "Show interface tooltips",
		HWHTITANTRAINER_ACCORDION_AUTO_SCROLL: "Accordion auto-scroll",
		HWHTITANTRAINER_ACCORDION_AUTO_SCROLL_HINT: "Controls whether opened accordions scroll into view automatically.",
		HWHTITANTRAINER_REORDER_LIST_VARIANT: "Reorder controls",
		HWHTITANTRAINER_REORDER_LIST_VARIANT_FULL: "Full",
		HWHTITANTRAINER_REORDER_LIST_VARIANT_MINIMAL: "Minimal",
		HWHTITANTRAINER_UPGRADE_MODE: "Upgrade distribution",
		HWHTITANTRAINER_UPGRADE_MODE_SEQUENTIAL: "Sequential",
		HWHTITANTRAINER_UPGRADE_MODE_PARALLEL: "Parallel by cost",
		HWHTITANTRAINER_PARALLEL_REORDER_HINT: "Priority order is disabled in parallel mode: the cheapest available next upgrade is selected automatically.",
		HWHTITANTRAINER_HOTKEYS_SECTION: "Hotkeys",
		HWHTITANTRAINER_HOTKEY_OPEN_SETTINGS: "Open settings",
		HWHTITANTRAINER_HOTKEY_RUN_ALL: "Run all modules",
		HWHTITANTRAINER_HOTKEY_RUN_ARTIFACTS: "Level artifacts",
		HWHTITANTRAINER_HOTKEY_RUN_LEVELS: "Level titans",
		HWHTITANTRAINER_HOTKEY_RUN_SKINS: "Level skins",
		HWHTITANTRAINER_HOTKEY_EMPTY: "Not assigned",
		HWHTITANTRAINER_HOTKEY_CAPTURE: "Record shortcut",
		HWHTITANTRAINER_HOTKEY_RECORDING: "Press a shortcut",
		HWHTITANTRAINER_HOTKEY_CLEAR: "Clear shortcut",
		HWHTITANTRAINER_HOTKEY_CONFLICT: "Shortcut is already assigned",
		HWHTITANTRAINER_PROGRESS_AUTO_HIDE_RESULT: "Hide result window by timeout",
		HWHTITANTRAINER_PROGRESS_AUTO_HIDE_TIMEOUT: "Result timeout, ms",
		HWHTITANTRAINER_PROGRESS_WINDOW_SECTION: "Information panel",
		HWHTITANTRAINER_PROGRESS_POSITION: "Result window position",
		HWHTITANTRAINER_PROGRESS_POSITION_TOP_CENTER: "Top center",
		HWHTITANTRAINER_PROGRESS_POSITION_TOP_RIGHT: "Top right",
		HWHTITANTRAINER_PROGRESS_POSITION_BOTTOM_RIGHT: "Bottom right",
		HWHTITANTRAINER_PROGRESS_STYLE: "Result window style",
		HWHTITANTRAINER_PROGRESS_STYLE_DEFAULT: "Default",
		HWHTITANTRAINER_PROGRESS_STYLE_COMPACT: "Compact",
		HWHTITANTRAINER_PROGRESS_STYLE_DASHBOARD: "Panel",
		HWHTITANTRAINER_SETTINGS_EXPORT_DONE: "Settings exported to JSON.",
		HWHTITANTRAINER_SETTINGS_IMPORT_DONE: "Settings imported.",
		HWHTITANTRAINER_SETTINGS_IMPORT_INVALID: "This JSON is not a HWH Titan Trainer settings export.",
		HWHTITANTRAINER_SETTINGS_IMPORT_PARSE_ERROR: "Could not parse JSON settings.",
		HWHTITANTRAINER_SETTINGS_IMPORT_ERROR: "Settings import failed: {message}",
		HWHTITANART_TITLE: "Titan artifact settings",
		HWHTITANART_DESCRIPTION: "Select titans for artifact leveling and set artifact priority with a level limit inside each titan.",
		HWHTITANART_SELECTED: "Selected titans",
		HWHTITANART_TITAN_LIST_HEADER: "Titan list",
		HWHTITANART_PRIORITY_HEADER: "Artifact priority",
		HWHTITANART_PRIORITY_HINT: "Titan order is read from top to bottom. Inside each titan, selected artifacts are leveled in their own order up to their own level limit.",
		HWHTITANART_ARTIFACT_ORDER: "Artifact order",
		HWHTITANART_LEVEL_GAIN: "+{amount} levels",
		HWHTITANART_CALCULATOR_HEADER: "Cost calculator",
		HWHTITANART_CALC_TITAN: "Titan",
		HWHTITANART_CALC_ARTIFACT: "Artifact",
		HWHTITANART_CALC_SKIN: "Skin",
		HWHTITANART_CALC_FROM_LEVEL: "From level",
		HWHTITANART_CALC_TO_LEVEL: "To level",
		HWHTITANART_CALC_TOTAL: "Total",
		HWHTITANART_CALC_TABLE_HEADER: "Per level",
		HWHTITANART_CALC_EMPTY: "Select a higher end level.",
		HWHTITANART_CALC_ENOUGH: "Enough: {amount}",
		HWHTITANART_CALC_MISSING: "Missing: {amount}",
		HWHTITANART_CALC_LEVEL_SHORT: "Lv. {level}",
		HWHTITANART_CALC_LEVEL: "Level",
		HWHTITANART_CALC_COST: "Cost",
		HWHTITANART_RESOURCE: "Resource",
		HWHTITANART_ESSENCE_RESERVE: "Essence reserve",
		HWHTITANART_SLOT_FILTER: "Artifacts to level",
		HWHTITANART_SLOT_FILTER_HINT: "Only the selected artifact slots are included in leveling. The third one spends gold, because of course it does.",
		HWHTITANART_LEVELING_SECTION: "Leveling",
		HWHTITANART_RESOURCES_SECTION: "Resources",
		HWHTITANART_AUTOMATION_SECTION: "Automation",
		HWHTITANART_EVOLUTION_SECTION: "Evolution",
		HWHTITANART_EVOLVE_ARTIFACTS: "Evolve selected artifacts",
		HWHTITANART_BUY_ARTIFACT_FRAGMENTS: "Buy missing fragments",
		HWHTITANART_EVOLVE_TARGETS: "Artifacts to evolve",
		HWHTITANART_FRAGMENT_BUY_TARGETS: "Artifacts to buy fragments for",
		HWHTITANART_EVOLUTION_MAX_STAR: "Maximum artifact star",
		HWHTITANART_MULTISELECT_PLACEHOLDER: "Nothing selected",
		HWHTITANART_MULTISELECT_SELECTED: "{count} selected",
		HWHTITANART_MULTISELECT_SEARCH: "Search",
		HWHTITANART_MULTISELECT_SELECT_ALL: "All",
		HWHTITANART_MULTISELECT_CLEAR: "Reset",
		HWHTITANART_SELECT_EMPTY: "No matching options",
		HWHTITANART_FRAGMENT_COIN_RESERVE: "Element tournament coin reserve",
		HWHTITANART_FRAGMENT_COIN_RESOURCE: "Element tournament coins",
		HWHTITANART_LEVEL_CAP_SHORT: "Limit",
		HWHTITANSKIN_LEVEL_CAP_SHORT: "Limit",
		HWHTITAN_TOOLTIP_LEVELING_MODE: "Max mode spends the available budget up to limits. Amount mode asks for a run cap.",
		HWHTITAN_TOOLTIP_UPGRADE_MODE: "Sequential mode follows the configured order. Parallel mode selects the cheapest available next upgrade across all selected targets.",
		HWHTITAN_TOOLTIP_CHECKLIST_AMOUNT_BEHAVIOR: "Controls whether Do all skips this module or uses the default amount in Amount mode.",
		HWHTITAN_TOOLTIP_CHECKLIST_LEVELING_AMOUNT: "How many upgrades Do all may perform when Amount mode uses the default.",
		HWHTITAN_TOOLTIP_SYNC_AFTER_RUN: "Refreshes game data after successful work so the UI catches up.",
		HWHTITAN_TOOLTIP_ARTIFACT_SLOT: "Enables this artifact slot for level upgrades.",
		HWHTITAN_TOOLTIP_ARTIFACT_LEVEL_CAP: "The script will not level this artifact slot above this level.",
		HWHTITAN_TOOLTIP_ESSENCE_RESERVE: "Artifact essence that must remain untouched.",
		HWHTITAN_TOOLTIP_GOLD_RESERVE: "Gold that must remain untouched for seal upgrades.",
		HWHTITAN_TOOLTIP_FRAGMENT_COIN_RESERVE: "Element tournament coins that must remain untouched when buying fragments.",
		HWHTITAN_TOOLTIP_EVOLVE_ARTIFACTS: "Allows titan artifact evolution for selected artifacts.",
		HWHTITAN_TOOLTIP_BUY_ARTIFACT_FRAGMENTS: "Allows buying missing fragments from the element tournament shop.",
		HWHTITAN_TOOLTIP_ARTIFACT_EVOLUTION_MAX_STAR: "Upper star limit for artifact evolution and fragment need calculation.",
		HWHTITAN_TOOLTIP_ARTIFACT_EVOLVE_TARGETS: "Artifacts selected here may be evolved if there are enough fragments.",
		HWHTITAN_TOOLTIP_ARTIFACT_FRAGMENT_BUY_TARGETS: "Fragments are bought only for artifacts selected here. Only first and second artifacts are buyable.",
		HWHTITAN_TOOLTIP_SHOW_FULL_COST: "Shows next artifact upgrade costs in the titan list.",
		HWHTITAN_TOOLTIP_TITAN_LEVEL_CAP: "The script will not level selected titans above this level.",
		HWHTITAN_TOOLTIP_POTION_RESERVE: "Titan XP potions that must remain untouched.",
		HWHTITAN_TOOLTIP_BUY_XP_POTIONS: "Buys only the XP potions missing for the current plan from the Titan Soul shop.",
		HWHTITAN_TOOLTIP_SOUL_COIN_RESERVE: "Titan Soul coins that must remain untouched when buying XP potions.",
		HWHTITAN_TOOLTIP_SHOW_LEVEL_COST: "Shows next titan level cost in the titan list.",
		HWHTITAN_TOOLTIP_SHOW_LEVEL_EVOLUTION: "Shows titan star and soul fragment progress in the titan list.",
		HWHTITAN_TOOLTIP_TITAN_EVOLVE_TARGETS: "Titans selected here may be evolved if enough soul fragments exist.",
		HWHTITAN_TOOLTIP_TITAN_EVOLUTION_MAX_STAR: "Upper star limit for titan evolution.",
		HWHTITAN_TOOLTIP_SKIN_FILTER: "Enables this skin type for titan skin upgrades.",
		HWHTITAN_TOOLTIP_SKIN_LEVEL_CAP: "The script will not level this skin type above this level.",
		HWHTITAN_TOOLTIP_SKIN_RESERVE: "Titan skin stones that must remain untouched.",
		HWHTITAN_TOOLTIP_SHOW_SKIN_COST: "Shows next titan skin upgrade costs in the titan list.",
		HWHTITAN_TOOLTIP_CALC_TITAN: "Titan used only for this cost calculation.",
		HWHTITAN_TOOLTIP_CALC_ARTIFACT: "Artifact slot used only for this cost calculation.",
		HWHTITAN_TOOLTIP_CALC_SKIN: "Skin type used only for this cost calculation.",
		HWHTITAN_TOOLTIP_CALC_FROM_LEVEL: "Current level for the calculation.",
		HWHTITAN_TOOLTIP_CALC_TO_LEVEL: "Target level. It is capped by game data.",
		HWHTITAN_TOOLTIP_UI_TOOLTIPS: "Disables or enables custom tooltips inside script windows.",
		HWHTITAN_TOOLTIP_UI_THEME: "Changes only the titan settings window theme. Other scripts keep their own theme.",
		HWHTITANART_SHOW_FULL_COST: "Show next artifact upgrade cost in titan list",
		HWHTITANART_LEVELING_MODE: "Leveling mode",
		HWHTITANART_LEVELING_MODE_MAX: "To maximum",
		HWHTITANART_LEVELING_MODE_AMOUNT: "Ask amount on start",
		HWHTITANART_LEVELING_AMOUNT: "Levels to upgrade",
		HWHTITANART_LEVELING_AMOUNT_PROMPT_TITLE: "Upgrade amount",
		HWHTITANART_LEVELING_AMOUNT_PROMPT_DESCRIPTION: "How many levels should this run upgrade?",
		HWHTITANART_LEVELING_AMOUNT_CONFIRM: "OK",
		HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_LABEL: "Do all amount mode",
		HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_SKIP: "Ignore module",
		HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_DEFAULT: "Use default amount",
		HWHTITANART_CHECKLIST_LEVELING_AMOUNT: "Default levels for Do all",
		HWHTITANART_CHECKLIST_FRAGMENT_BEHAVIOR_LABEL: "Fragments in Do all",
		HWHTITANART_CHECKLIST_FRAGMENT_BEHAVIOR_USE_SETTINGS: "Use artifact settings",
		HWHTITANART_CHECKLIST_FRAGMENT_BEHAVIOR_SKIP: "Do not buy fragments",
		HWHTITANART_CHECKLIST_AMOUNT_SKIPPED: "Do all: module skipped because amount mode needs a level count.",
		HWHTITANART_CHECKLIST_AMOUNT_HINT: "Controls what happens when Do all starts this module while leveling mode is Ask amount on start.",
		HWHTITANART_SYNC_AFTER_RUN: "Run synchronization after work",
		HWHTITANART_POST_SYNC_DONE: "Synchronization done.",
		HWHTITANART_POST_SYNC_FAILED: "Synchronization failed. Details are in the console, naturally.",
		HWHTITANART_FIRST_ARTIFACT: "First artifact",
		HWHTITANART_SECOND_ARTIFACT: "Second artifact",
		HWHTITANART_THIRD_ARTIFACT: "Third artifact",
		HWHTITANART_FIRST_ARTIFACT_CAP: "First artifact limit",
		HWHTITANART_SECOND_ARTIFACT_CAP: "Second artifact limit",
		HWHTITANART_THIRD_ARTIFACT_CAP: "Third artifact limit",
		HWHTITANART_GOLD_RESERVE: "Gold reserve",
		HWHTITANART_GOLD_RESOURCE: "Gold",
		HWHTITANART_ALL_ARTIFACTS_MAXED_TOOLTIP: "All titan artifacts are already at maximum level.",
		HWHTITANART_SETTINGS_ERROR: "Could not save settings. The popup got dramatic again.",
		HWHTITANART_SAVE_SETTINGS: "Save settings",
		HWHTITANART_SETTINGS_SAVED: "Settings saved.",
		HWHTITANART_SELECT_ALL: "Select all",
		HWHTITANART_CLEAR_ALL: "Clear all",
		HWHTITANART_RUN: "Start leveling",
		HWHTITANART_CLOSE: "Close",
		HWHTITANART_NONE_SELECTED: "Nothing is selected yet. Very minimalist strategy, truly.",
		HWHTITANART_NO_OWNED_SUFFIX: "not unlocked",
		HWHTITANART_NO_OWNED_TOOLTIP: "This titan is not unlocked, so there is nothing to level here yet.",
		HWHTITANART_SELECT_TITANS_FIRST: "Select titans first. The script is not guessing your priorities from the void.",
		HWHTITANART_NOTHING_TO_LEVEL: "Nothing to level. Either the resource is gone, or the selected artifacts are already at the useful ceiling.",
		HWHTITANART_PROGRESS_PLAN: "Building the upgrade queue. We are trying to spend the resource with at least some dignity.",
		HWHTITANART_PROGRESS_SHOP: "Loading titan artifact fragment shop. Commerce, sadly, remains undefeated.",
		HWHTITANART_PROGRESS_BUY_FRAGMENT: "Buying {artifactName}: {amount} fragments",
		HWHTITANART_PROGRESS_EVOLVE: "Evolving {titanName} · {slot} · {fromStar} → {toStar}",
		HWHTITANART_PROGRESS_UPGRADE: "Leveling {titanName} · {slot} · {fromLevel} → {toLevel}",
		HWHTITANART_PROGRESS_DONE: "Leveling complete. {count} upgrades were pushed through.",
		HWHTITANART_PROGRESS_ERROR: "Leveling crashed mid-process. The console already has the usual horror story.",
		HWHTITANART_SUMMARY_UPGRADES: "Upgrades",
		HWHTITANART_SUMMARY_EVOLUTIONS: "Evolutions",
		HWHTITANART_SUMMARY_PURCHASES: "Fragment purchases",
		HWHTITANART_SUMMARY_EMPTY_EVOLUTIONS: "No artifact evolutions.",
		HWHTITANART_SUMMARY_EMPTY_PURCHASES: "No fragments were bought.",
		HWHTITANART_SUMMARY_SPENT: "Spent",
		HWHTITANART_SUMMARY_EMPTY: "Nothing was leveled. The resource survived.",
		HWHTITANART_SUMMARY_RESOURCE: "{resourceName}: -{spentAmount} ({leftAmount})",
		HWHTITANART_TITAN_FALLBACK: "Titan {id}",
		HWHTITANART_ARTIFACT_SLOT: "slot {slot}",
		HWHTITANART_ARTIFACT_WEAPON: "Weapon",
		HWHTITANART_ARTIFACT_CROWN: "Crown",
		HWHTITANART_ARTIFACT_SEAL: "Seal",
		HWHTITANART_RESOURCE_FALLBACK: "Artifact resource",
		HWHTITANART_ERROR_GENERIC: "Something went wrong. The console is already collecting evidence.",
		HWHTITANLVL_BUTTON: "Titan levels",
		HWHTITANLVL_BUTTON_TITLE: "Levels selected titans by the cheapest next levels first.",
		HWHTITANLVL_TITLE: "Titan level settings",
		HWHTITANLVL_DESCRIPTION: "Select titans for level-up. The queue is built from the cheapest next levels, not from mindless potion dumping.",
		HWHTITANLVL_RESOURCE: "Potions",
		HWHTITANLVL_POTION_RESERVE: "Potion reserve",
		HWHTITANLVL_SHOW_NEXT_COST: "Show next level cost in titan list",
		HWHTITANLVL_SHOW_EVOLUTION: "Show evolution progress in titan list",
		HWHTITANLVL_MAX_LEVEL: "Titan level limit",
		HWHTITANLVL_TARGET_LEVEL: "Target level",
		HWHTITANLVL_PRIORITY_HEADER: "Titan level priority",
		HWHTITANLVL_PRIORITY_HINT: "In sequential mode titans are leveled from top to bottom. Every titan keeps its own target level.",
		HWHTITANLVL_BUY_XP_POTIONS: "Buy missing XP potions",
		HWHTITANLVL_SOUL_COIN_RESERVE: "Titan Soul coin reserve",
		HWHTITANLVL_EVOLVE_TARGETS: "Titans to evolve",
		HWHTITANLVL_EVOLUTION_MAX_STAR: "Maximum titan star",
		HWHTITANLVL_SUMMARY_EVOLUTIONS: "Titan evolutions",
		HWHTITANLVL_SUMMARY_EMPTY_EVOLUTIONS: "No titan evolutions.",
		HWHTITANLVL_PROGRESS_EVOLVE: "Evolving {titanName}: {fromStar} → {toStar}",
		HWHTITANLVL_RUN: "Start leveling",
		HWHTITANLVL_SELECT_TITANS_FIRST: "Select titans first. The script is still not a fortune teller.",
		HWHTITANLVL_NOTHING_TO_LEVEL: "Nothing to level. Either potions are gone, or selected titans already hit the ceiling.",
		HWHTITANLVL_PROGRESS_PLAN: "Building the titan level queue. We are trying not to waste potions like amateurs.",
		HWHTITAN_PROGRESS_SYNCING: "Refreshing the game state after applying changes.",
		HWHTITANLVL_PROGRESS_UPGRADE: "Leveling {titanName} · {fromLevel} → {toLevel}",
		HWHTITANLVL_PROGRESS_BUY_POTIONS: "Buying {potionAmount} XP potions for {coinAmount} Titan Soul coins",
		HWHTITANLVL_PROGRESS_DONE: "Titan leveling complete. {count} upgrades went through.",
		HWHTITANLVL_PROGRESS_ERROR: "Titan leveling crashed. The console already knows why, probably.",
		HWHTITANLVL_SUMMARY_LEVELS: "Titan levels",
		HWHTITANLVL_SUMMARY_SPENT: "Spent",
		HWHTITANLVL_SUMMARY_EMPTY: "Nothing was leveled. The potion stash survives for another day.",
		HWHTITANLVL_SUMMARY_RESOURCE: "{resourceName}: -{spentAmount} ({leftAmount})",
		HWHTITANLVL_SUMMARY_POTION_PURCHASE: "Bought potions: +{potionAmount}; Titan Soul coins: -{coinSpentAmount} ({coinLeftAmount})",
		HWHTITANLVL_RESOURCE_FALLBACK: "Titan potion",
		HWHTITANLVL_EVOLUTION_ABSOLUTE: "ABS",
		HWHTITANSKIN_BUTTON: "Titan skins",
		HWHTITANSKIN_BUTTON_TITLE: "Levels selected titan skins by the configured titan and skin priority.",
		HWHTITANSKIN_TITLE: "Titan skin settings",
		HWHTITANSKIN_DESCRIPTION: "Select titans for skin leveling and set skin priority with a level limit inside each titan.",
		HWHTITANSKIN_RESOURCE: "Skin stones",
		HWHTITANSKIN_RESERVE: "Skin stone reserve",
		HWHTITANSKIN_FILTER: "Skins to level",
		HWHTITANSKIN_PRIORITY_HEADER: "Skin priority",
		HWHTITANSKIN_PRIORITY_HINT: "Titan order is read from top to bottom. Inside each titan, selected skins are leveled in their own order up to their own level limit.",
		HWHTITANSKIN_SKIN_ORDER: "Skin order",
		HWHTITANSKIN_FILTER_HINT: "Filters are grouped by shared localeKey so the per-titan config clones do not turn the popup into a landfill.",
		HWHTITANSKIN_LEVEL_CAP: "Skin level limit",
		HWHTITANSKIN_SHOW_NEXT_COST: "Show next skin upgrade cost in titan list",
		HWHTITANSKIN_RUN: "Start leveling",
		HWHTITANSKIN_SELECT_TITANS_FIRST: "Select titans first. The script is still not supposed to guess your priorities.",
		HWHTITANSKIN_NOTHING_TO_LEVEL: "Nothing to level. Either skin stones are gone, or the selected skins already hit the ceiling.",
		HWHTITANSKIN_PROGRESS_PLAN: "Building the titan skin queue. We are trying not to burn stones like total savages.",
		HWHTITANSKIN_PROGRESS_UPGRADE: "Leveling {titanName} · {skinName} · {fromLevel} → {toLevel}",
		HWHTITANSKIN_PROGRESS_DONE: "Titan skin leveling complete. {count} upgrades went through.",
		HWHTITANSKIN_PROGRESS_ERROR: "Titan skin leveling crashed. The console already wrote the obituary.",
		HWHTITANSKIN_SUMMARY_SKINS: "Titan skins",
		HWHTITANSKIN_SUMMARY_SPENT: "Spent",
		HWHTITANSKIN_SUMMARY_EMPTY: "Nothing was leveled. The skin stones remain unmolested.",
		HWHTITANSKIN_SUMMARY_RESOURCE: "{resourceName}: -{spentAmount} ({leftAmount})",
		HWHTITANSKIN_RESOURCE_FALLBACK: "Titan skin stone",
		HWHTITANSKIN_SKIN_FALLBACK: "Skin {id}",
		HWHTITANSKIN_CONFIG_EMPTY: "Titan skin config is empty. The game hid the skins again.",
		HWHTITANART_FEEDBACK_BUTTON: "Feedback",
		HWHTITANART_FEEDBACK_BUTTON_TITLE: "Opens Telegram. For feedback, bug reports, gratitude, or the usual respectable swearing.",
		HWHTITANART_WHATS_NEW_BUTTON: "What's new",
		HWHTITANART_WHATS_NEW_BUTTON_TITLE: "Opens the version history page for this script.",
		HWHTITANART_CLOSE_BUTTON: "Close",
		HWHTITANART_CLOSE_BUTTON_TITLE: "Closes the popup without inventing extra drama.",
		HWHTITANART_TASK_AUTO_LEVELS: "Titans: levels",
		HWHTITANART_TASK_AUTO_ARTIFACTS: "Titans: artifacts",
		HWHTITANART_TASK_AUTO_SKINS: "Titans: skins",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_HEADER: "Do all checkbox",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_LABEL: "Titan checkboxes position",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_NONE: "Do not add",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_START: "At the top",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_END: "At the bottom",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_BEFORE: "Before: {label}",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_AFTER: "After: {label}",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_HINT: "Choose where the script inserts its titan checkboxes inside the Do all list.",
		HWHTITANTRAINER_BUTTON_PLACEMENT_LABEL: "Titans button",
		HWHTITANTRAINER_BUTTON_PLACEMENT_MAIN: "Main menu",
		HWHTITANTRAINER_BUTTON_PLACEMENT_OTHER: "Other menu",
		HWHTITAN_TOOLTIP_BUTTON_PLACEMENT: "Moves the Titans button between the main menu and the Other menu."
	};
	var builtinRuDictionary = {
		HWHTITANART_START_LOG: "Старт расширения {name} от {author} (v.{version})",
		HWHTITANART_RUNTIME_WAIT_ERROR: "Игровой рантайм ещё не загрузился. Код снова делает вид, что его нет.",
		HWHTITANART_USER_ID_WAIT_ERROR: "userId так и не появился. Игра решила поиграть в загадочность.",
		HWHTITANART_BUTTON: "Артефакты титанов",
		HWHTITANART_BUTTON_TITLE: "Качает артефакты выбранных титанов по заданному порядку титанов и артефактов.",
		HWHTITANTRAINER_BUTTON: "Титаны",
		HWHTITANTRAINER_BUTTON_TITLE: "Открывает прокачку уровней, артефактов и обликов титанов.",
		HWHTITANTRAINER_TAB_GENERAL: "Общее",
		HWHTITANTRAINER_TAB_ARTIFACTS: "Артефакты",
		HWHTITANTRAINER_TAB_LEVELS: "Уровни",
		HWHTITANTRAINER_TAB_SKINS: "Облики",
		HWHTITANTRAINER_TECH_SECTION: "Дополнительно",
		HWHTITANTRAINER_DONATE_TITLE: "Поддержка проекта",
		HWHTITANTRAINER_DONATE_TEXT: "Прямой перевод на карту Альфа-Банка. Без старого кошелька и платежного цирка.",
		HWHTITANTRAINER_DONATE_WALLET: "Карта Альфа-Банка: {wallet}",
		HWHTITANTRAINER_DONATE_QR_ALT: "QR-код для доната",
		HWHTITANTRAINER_DONATE_QR_LABEL: "Банковский перевод",
		HWHTITANTRAINER_STATUS_READY: "Готов к работе",
		HWHTITANTRAINER_FEEDBACK_TEXT: "Если у Вас возникли проблемы не описанные в документации, или же есть пожелание, просьба отписать мне в",
		HWHTITANTRAINER_DOCS_TITLE: "Документация",
		HWHTITANTRAINER_DOCS_TEXT: "Полезные ссылки по установке, зеркалам и общему UI kit.",
		HWHTITANTRAINER_DOCS_PRIMARY: "Документация",
		HWHTITANTRAINER_DOCS_MIRROR: "Зеркало {number}",
		HWHTITANTRAINER_DUMP_LIBRARY: "Игровая библиотека",
		HWHTITANTRAINER_DUMP_LIBRARY_TITLE: "Вывести runtime Hero Wars и игровые библиотеки в консоль.",
		HWHTITANTRAINER_EXPORT_SETTINGS: "Экспорт настроек",
		HWHTITANTRAINER_IMPORT_SETTINGS: "Импорт настроек",
		HWHTITANTRAINER_RUN_ACTIVE: "Запустить вкладку",
		HWHTITANTRAINER_RUN_SELECT_TAB: "Открой вкладку артефактов, уровней или обликов для запуска.",
		HWHTITANTRAINER_RUN_SELECTION_REQUIRED: "Требуется выбор",
		HWHTITANTRAINER_RUN_NOTHING_TO_DO: "Выполнять нечего",
		HWHTITANTRAINER_INTERFACE_SECTION: "Интерфейс и информационная панель",
		HWHTITANTRAINER_UI_THEME_LABEL: "Тема интерфейса",
		HWHTITANTRAINER_UI_THEME_DARK: "Тёмная",
		HWHTITANTRAINER_UI_THEME_LIGHT: "Светлая",
		HWHTITANTRAINER_UI_THEME_AUTO: "Авто (системная)",
		HWHTITANTRAINER_UI_TOOLTIPS: "Показывать всплывающие подсказки",
		HWHTITANTRAINER_ACCORDION_AUTO_SCROLL: "Прокрутка аккордеонов",
		HWHTITANTRAINER_ACCORDION_AUTO_SCROLL_HINT: "Управляет автопрокруткой открытого аккордеона в видимую область.",
		HWHTITANTRAINER_REORDER_LIST_VARIANT: "Кнопки сортировки списков",
		HWHTITANTRAINER_REORDER_LIST_VARIANT_FULL: "Полный",
		HWHTITANTRAINER_REORDER_LIST_VARIANT_MINIMAL: "Минимальный",
		HWHTITANTRAINER_UPGRADE_MODE: "Распределение прокачки",
		HWHTITANTRAINER_UPGRADE_MODE_SEQUENTIAL: "Последовательно",
		HWHTITANTRAINER_UPGRADE_MODE_PARALLEL: "Параллельно по цене",
		HWHTITANTRAINER_PARALLEL_REORDER_HINT: "В параллельном режиме порядок отключен: скрипт сам выбирает самое дешевое доступное следующее улучшение.",
		HWHTITANTRAINER_HOTKEYS_SECTION: "Горячие клавиши",
		HWHTITANTRAINER_HOTKEY_OPEN_SETTINGS: "Открыть настройки",
		HWHTITANTRAINER_HOTKEY_RUN_ALL: "Запустить все модули",
		HWHTITANTRAINER_HOTKEY_RUN_ARTIFACTS: "Прокачать артефакты",
		HWHTITANTRAINER_HOTKEY_RUN_LEVELS: "Прокачать уровни",
		HWHTITANTRAINER_HOTKEY_RUN_SKINS: "Прокачать облики",
		HWHTITANTRAINER_HOTKEY_EMPTY: "Не назначено",
		HWHTITANTRAINER_HOTKEY_CAPTURE: "Записать сочетание",
		HWHTITANTRAINER_HOTKEY_RECORDING: "Нажми сочетание",
		HWHTITANTRAINER_HOTKEY_CLEAR: "Очистить сочетание",
		HWHTITANTRAINER_HOTKEY_CONFLICT: "Сочетание уже назначено",
		HWHTITANTRAINER_PROGRESS_AUTO_HIDE_RESULT: "Скрывать окно результата по таймауту",
		HWHTITANTRAINER_PROGRESS_AUTO_HIDE_TIMEOUT: "Таймаут результата, мс",
		HWHTITANTRAINER_PROGRESS_WINDOW_SECTION: "Информационная панель",
		HWHTITANTRAINER_PROGRESS_POSITION: "Положение окна результата",
		HWHTITANTRAINER_PROGRESS_POSITION_TOP_CENTER: "Сверху по центру",
		HWHTITANTRAINER_PROGRESS_POSITION_TOP_RIGHT: "Правый верхний угол",
		HWHTITANTRAINER_PROGRESS_POSITION_BOTTOM_RIGHT: "Правый нижний угол",
		HWHTITANTRAINER_PROGRESS_STYLE: "Стиль окна результата",
		HWHTITANTRAINER_PROGRESS_STYLE_DEFAULT: "Обычный",
		HWHTITANTRAINER_PROGRESS_STYLE_COMPACT: "Компактный",
		HWHTITANTRAINER_PROGRESS_STYLE_DASHBOARD: "Панель",
		HWHTITANTRAINER_SETTINGS_EXPORT_DONE: "Настройки выгружены в JSON.",
		HWHTITANTRAINER_SETTINGS_IMPORT_DONE: "Настройки импортированы.",
		HWHTITANTRAINER_SETTINGS_IMPORT_INVALID: "Этот JSON не похож на экспорт HWH Titan Trainer.",
		HWHTITANTRAINER_SETTINGS_IMPORT_PARSE_ERROR: "Не удалось прочитать JSON настроек.",
		HWHTITANTRAINER_SETTINGS_IMPORT_ERROR: "Импорт настроек упал: {message}",
		HWHTITANART_TITLE: "Настройки артефактов титанов",
		HWHTITANART_DESCRIPTION: "Выбери титанов для прокачки артефактов и задай внутри каждого порядок артефактов с отдельным лимитом уровня.",
		HWHTITANART_SELECTED: "Выбрано титанов",
		HWHTITANART_TITAN_LIST_HEADER: "Список титанов",
		HWHTITANART_PRIORITY_HEADER: "Приоритет артефактов",
		HWHTITANART_PRIORITY_HINT: "Порядок титанов читается сверху вниз. Внутри титана выбранные артефакты качаются в своём порядке и до своего лимита уровня.",
		HWHTITANART_ARTIFACT_ORDER: "Порядок артефактов",
		HWHTITANART_LEVEL_GAIN: "+{amount} ур.",
		HWHTITANART_CALCULATOR_HEADER: "Калькулятор стоимости",
		HWHTITANART_CALC_TITAN: "Титан",
		HWHTITANART_CALC_ARTIFACT: "Артефакт",
		HWHTITANART_CALC_SKIN: "Облик",
		HWHTITANART_CALC_FROM_LEVEL: "С уровня",
		HWHTITANART_CALC_TO_LEVEL: "До уровня",
		HWHTITANART_CALC_TOTAL: "Итого",
		HWHTITANART_CALC_TABLE_HEADER: "По уровням",
		HWHTITANART_CALC_EMPTY: "Выбери конечный уровень выше начального.",
		HWHTITANART_CALC_ENOUGH: "Хватает: {amount}",
		HWHTITANART_CALC_MISSING: "Не хватает: {amount}",
		HWHTITANART_CALC_LEVEL_SHORT: "Ур. {level}",
		HWHTITANART_CALC_LEVEL: "Уровень",
		HWHTITANART_CALC_COST: "Цена",
		HWHTITANART_RESOURCE: "Ресурс",
		HWHTITANART_ESSENCE_RESERVE: "Остаток эссенции",
		HWHTITANART_SLOT_FILTER: "Какие артефакты качать",
		HWHTITANART_SLOT_FILTER_HINT: "В прокачку идут только отмеченные слоты артефактов. Третий жрёт золото, ну конечно же.",
		HWHTITANART_LEVELING_SECTION: "Прокачка",
		HWHTITANART_RESOURCES_SECTION: "Ресурсы",
		HWHTITANART_AUTOMATION_SECTION: "Автоматизация",
		HWHTITANART_EVOLUTION_SECTION: "Эволюция",
		HWHTITANART_EVOLVE_ARTIFACTS: "Эволюционировать выбранные артефакты",
		HWHTITANART_BUY_ARTIFACT_FRAGMENTS: "Докупать недостающие фрагменты",
		HWHTITANART_EVOLVE_TARGETS: "Какие артефакты эволюционировать",
		HWHTITANART_FRAGMENT_BUY_TARGETS: "Для каких артефактов докупать фрагменты",
		HWHTITANART_EVOLUTION_MAX_STAR: "Максимальная звезда артефакта",
		HWHTITANART_MULTISELECT_PLACEHOLDER: "Ничего не выбрано",
		HWHTITANART_MULTISELECT_SELECTED: "Выбрано: {count}",
		HWHTITANART_MULTISELECT_SEARCH: "Поиск",
		HWHTITANART_MULTISELECT_SELECT_ALL: "Все",
		HWHTITANART_MULTISELECT_CLEAR: "Сброс",
		HWHTITANART_SELECT_EMPTY: "Ничего не найдено",
		HWHTITANART_FRAGMENT_COIN_RESERVE: "Остаток монет турнира стихий",
		HWHTITANART_FRAGMENT_COIN_RESOURCE: "Монеты турнира стихий",
		HWHTITANART_LEVEL_CAP_SHORT: "Лимит",
		HWHTITANSKIN_LEVEL_CAP_SHORT: "Лимит",
		HWHTITAN_TOOLTIP_LEVELING_MODE: "Максимум тратит доступный бюджет до лимитов. N-уровни спрашивают ограничение на запуск.",
		HWHTITAN_TOOLTIP_UPGRADE_MODE: "Последовательный режим идет по заданному порядку. Параллельный выбирает самое дешевое следующее улучшение среди всех выбранных целей.",
		HWHTITAN_TOOLTIP_CHECKLIST_AMOUNT_BEHAVIOR: "Что делать в «Сделать всё», если у модуля выбран режим N-уровней.",
		HWHTITAN_TOOLTIP_CHECKLIST_LEVELING_AMOUNT: "Сколько улучшений разрешено модулю при запуске из «Сделать всё».",
		HWHTITAN_TOOLTIP_SYNC_AFTER_RUN: "Обновляет данные игры после успешной работы, чтобы интерфейс не врал.",
		HWHTITAN_TOOLTIP_ARTIFACT_SLOT: "Разрешает прокачивать этот слот артефакта.",
		HWHTITAN_TOOLTIP_ARTIFACT_LEVEL_CAP: "Выше этого уровня скрипт этот слот артефакта не качает.",
		HWHTITAN_TOOLTIP_ESSENCE_RESERVE: "Сколько эссенции артефактов надо оставить нетронутой.",
		HWHTITAN_TOOLTIP_GOLD_RESERVE: "Сколько золота надо оставить нетронутым для прокачки печатей.",
		HWHTITAN_TOOLTIP_FRAGMENT_COIN_RESERVE: "Сколько монет турнира стихий нельзя тратить на фрагменты.",
		HWHTITAN_TOOLTIP_EVOLVE_ARTIFACTS: "Разрешает эволюционировать выбранные артефакты титанов.",
		HWHTITAN_TOOLTIP_BUY_ARTIFACT_FRAGMENTS: "Разрешает докупать недостающие фрагменты в магазине турнира стихий.",
		HWHTITAN_TOOLTIP_ARTIFACT_EVOLUTION_MAX_STAR: "Потолок звёзд для эволюции артефактов и расчёта нужных фрагментов.",
		HWHTITAN_TOOLTIP_ARTIFACT_EVOLVE_TARGETS: "Только выбранные здесь артефакты будут эволюционировать.",
		HWHTITAN_TOOLTIP_ARTIFACT_FRAGMENT_BUY_TARGETS: "Фрагменты покупаются только для выбранных здесь артефактов. Купить можно только 1 и 2 артефакт.",
		HWHTITAN_TOOLTIP_SHOW_FULL_COST: "Показывает цену следующей прокачки артефактов в списке титанов.",
		HWHTITAN_TOOLTIP_TITAN_LEVEL_CAP: "Выше этого уровня скрипт выбранных титанов не качает.",
		HWHTITAN_TOOLTIP_POTION_RESERVE: "Сколько зелий опыта титанов надо оставить нетронутыми.",
		HWHTITAN_TOOLTIP_BUY_XP_POTIONS: "Докупает в магазине душ титанов только те зелья опыта, которых не хватает текущему плану.",
		HWHTITAN_TOOLTIP_SOUL_COIN_RESERVE: "Сколько монет душ титанов нельзя тратить на покупку зелий опыта.",
		HWHTITAN_TOOLTIP_SHOW_LEVEL_COST: "Показывает цену следующего уровня в списке титанов.",
		HWHTITAN_TOOLTIP_SHOW_LEVEL_EVOLUTION: "Показывает звёзды титана и прогресс фрагментов душ в списке.",
		HWHTITAN_TOOLTIP_TITAN_EVOLVE_TARGETS: "Только выбранные здесь титаны будут эволюционировать.",
		HWHTITAN_TOOLTIP_TITAN_EVOLUTION_MAX_STAR: "Потолок звёзд для эволюции титанов.",
		HWHTITAN_TOOLTIP_SKIN_FILTER: "Разрешает прокачивать этот тип облика.",
		HWHTITAN_TOOLTIP_SKIN_LEVEL_CAP: "Выше этого уровня скрипт этот тип облика не качает.",
		HWHTITAN_TOOLTIP_SKIN_RESERVE: "Сколько монет обликов титанов надо оставить нетронутыми.",
		HWHTITAN_TOOLTIP_SHOW_SKIN_COST: "Показывает цену следующей прокачки обликов в списке титанов.",
		HWHTITAN_TOOLTIP_CALC_TITAN: "Титан только для расчёта стоимости.",
		HWHTITAN_TOOLTIP_CALC_ARTIFACT: "Слот артефакта только для расчёта стоимости.",
		HWHTITAN_TOOLTIP_CALC_SKIN: "Тип облика только для расчёта стоимости.",
		HWHTITAN_TOOLTIP_CALC_FROM_LEVEL: "Текущий уровень для расчёта.",
		HWHTITAN_TOOLTIP_CALC_TO_LEVEL: "Целевой уровень. Ограничен данными игры.",
		HWHTITAN_TOOLTIP_UI_TOOLTIPS: "Включает или отключает кастомные подсказки внутри окон скрипта.",
		HWHTITAN_TOOLTIP_UI_THEME: "Меняет тему только у окон титанов. Остальные скрипты не трогаем, хватит уже этого балагана.",
		HWHTITANART_SHOW_FULL_COST: "Показывать цену следующего уровня в списке титанов",
		HWHTITANART_LEVELING_MODE: "Режим прокачки",
		HWHTITANART_LEVELING_MODE_MAX: "На максимум",
		HWHTITANART_LEVELING_MODE_AMOUNT: "Спросить при запуске",
		HWHTITANART_LEVELING_AMOUNT: "Сколько уровней качать",
		HWHTITANART_LEVELING_AMOUNT_PROMPT_TITLE: "Сколько уровней качать",
		HWHTITANART_LEVELING_AMOUNT_PROMPT_DESCRIPTION: "Сколько уровней прокачать именно в этом запуске?",
		HWHTITANART_LEVELING_AMOUNT_CONFIRM: "Ок",
		HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_LABEL: "N-уровни в «Сделать всё»",
		HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_SKIP: "Пропускать модуль",
		HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_DEFAULT: "Брать значение по умолчанию",
		HWHTITANART_CHECKLIST_LEVELING_AMOUNT: "Уровни по умолчанию для «Сделать всё»",
		HWHTITANART_CHECKLIST_FRAGMENT_BEHAVIOR_LABEL: "Фрагменты за монеты в «Сделать всё»",
		HWHTITANART_CHECKLIST_FRAGMENT_BEHAVIOR_USE_SETTINGS: "Как в настройках артефактов",
		HWHTITANART_CHECKLIST_FRAGMENT_BEHAVIOR_SKIP: "Не докупать фрагменты",
		HWHTITANART_CHECKLIST_AMOUNT_SKIPPED: "«Сделать всё»: модуль пропущен, потому что режим N-уровней требует количество.",
		HWHTITANART_CHECKLIST_AMOUNT_HINT: "Что делать, когда «Сделать всё» запускает этот модуль, а режим прокачки стоит «Спросить при запуске».",
		HWHTITANART_SYNC_AFTER_RUN: "Запускать синхронизацию после работы",
		HWHTITANART_POST_SYNC_DONE: "Синхронизация выполнена.",
		HWHTITANART_POST_SYNC_FAILED: "Синхронизация упала. Подробности, как обычно, в консоли.",
		HWHTITANART_FIRST_ARTIFACT: "Первый артефакт",
		HWHTITANART_SECOND_ARTIFACT: "Второй артефакт",
		HWHTITANART_THIRD_ARTIFACT: "Третий артефакт",
		HWHTITANART_FIRST_ARTIFACT_CAP: "Лимит первого артефакта",
		HWHTITANART_SECOND_ARTIFACT_CAP: "Лимит второго артефакта",
		HWHTITANART_THIRD_ARTIFACT_CAP: "Лимит третьего артефакта",
		HWHTITANART_GOLD_RESERVE: "Остаток золота",
		HWHTITANART_GOLD_RESOURCE: "Золото",
		HWHTITANART_ALL_ARTIFACTS_MAXED_TOOLTIP: "У титана все артефакты уже максимального уровня.",
		HWHTITANART_SETTINGS_ERROR: "Настройки не сохранились. Попап опять решил покапризничать.",
		HWHTITANART_SAVE_SETTINGS: "Сохранить настройки",
		HWHTITANART_SETTINGS_SAVED: "Настройки сохранены.",
		HWHTITANART_SELECT_ALL: "Выбрать всё",
		HWHTITANART_CLEAR_ALL: "Снять всё",
		HWHTITANART_RUN: "Запустить прокачку",
		HWHTITANART_CLOSE: "Закрыть",
		HWHTITANART_NONE_SELECTED: "Пока ничего не выбрано. Стратегия уровня «ну и ладно».",
		HWHTITANART_NO_OWNED_SUFFIX: "не открыт",
		HWHTITANART_NO_OWNED_TOOLTIP: "Этот титан у тебя не открыт, так что качать там пока особо нечего.",
		HWHTITANART_SELECT_TITANS_FIRST: "Сначала выбери титанов. Скрипт не обязан угадывать твои планы по звёздам.",
		HWHTITANART_NOTHING_TO_LEVEL: "Качать нечего. Либо ресурс закончился, либо выбранные арты уже упёрлись в потолок.",
		HWHTITANART_PROGRESS_PLAN: "Строим очередь прокачки. Пытаемся слить ресурс хотя бы без откровенного позора.",
		HWHTITANART_PROGRESS_SHOP: "Загружаем магазин фрагментов артефактов титанов. Без торговли никуда, ага.",
		HWHTITANART_PROGRESS_BUY_FRAGMENT: "Покупаем {artifactName}: {amount} фрагм.",
		HWHTITANART_PROGRESS_EVOLVE: "Эволюция {titanName} · {slot} · {fromStar} → {toStar}",
		HWHTITANART_PROGRESS_UPGRADE: "Качаем {titanName} · {slot} · {fromLevel} → {toLevel}",
		HWHTITANART_PROGRESS_DONE: "Прокачка закончена. Протолкнули {count} улучшений.",
		HWHTITANART_PROGRESS_ERROR: "Прокачка рухнула посреди процесса. В консоли уже лежит весь привычный цирк.",
		HWHTITANART_SUMMARY_UPGRADES: "Прокачали",
		HWHTITANART_SUMMARY_EVOLUTIONS: "Эволюция",
		HWHTITANART_SUMMARY_PURCHASES: "Покупка фрагментов",
		HWHTITANART_SUMMARY_EMPTY_EVOLUTIONS: "Эволюции артефактов не было.",
		HWHTITANART_SUMMARY_EMPTY_PURCHASES: "Фрагменты не покупали.",
		HWHTITANART_SUMMARY_SPENT: "Потратили",
		HWHTITANART_SUMMARY_EMPTY: "Ничего не прокачали. Ресурс пока выжил.",
		HWHTITANART_SUMMARY_RESOURCE: "{resourceName}: -{spentAmount} ({leftAmount})",
		HWHTITANART_TITAN_FALLBACK: "Титан {id}",
		HWHTITANART_ARTIFACT_SLOT: "слот {slot}",
		HWHTITANART_ARTIFACT_WEAPON: "Оружие",
		HWHTITANART_ARTIFACT_CROWN: "Корона",
		HWHTITANART_ARTIFACT_SEAL: "Печать",
		HWHTITANART_RESOURCE_FALLBACK: "Ресурс артефактов",
		HWHTITANART_ERROR_GENERIC: "Что-то опять пошло не так. Консоль, как обычно, всё видела.",
		HWHTITANLVL_BUTTON: "Уровни титанов",
		HWHTITANLVL_BUTTON_TITLE: "Качает уровни выбранных титанов, начиная с самых дешёвых следующих уровней.",
		HWHTITANLVL_TITLE: "Настройки уровней титанов",
		HWHTITANLVL_DESCRIPTION: "Выбери титанов для прокачки уровней. Очередь строится по самым дешёвым следующим уровням, а не по тупому сливу зелий в первого попавшегося.",
		HWHTITANLVL_RESOURCE: "Зелья",
		HWHTITANLVL_POTION_RESERVE: "Остаток зелий",
		HWHTITANLVL_SHOW_NEXT_COST: "Показывать цену следующего уровня в списке титанов",
		HWHTITANLVL_SHOW_EVOLUTION: "Показывать прогресс эволюции в списке титанов",
		HWHTITANLVL_MAX_LEVEL: "Лимит уровня титана",
		HWHTITANLVL_TARGET_LEVEL: "До уровня",
		HWHTITANLVL_PRIORITY_HEADER: "Приоритет уровней титанов",
		HWHTITANLVL_PRIORITY_HINT: "В последовательном режиме титаны качаются сверху вниз. У каждого титана остается свой целевой уровень.",
		HWHTITANLVL_BUY_XP_POTIONS: "Докупать недостающие зелья опыта",
		HWHTITANLVL_SOUL_COIN_RESERVE: "Остаток монет душ титанов",
		HWHTITANLVL_EVOLVE_TARGETS: "Каких титанов эволюционировать",
		HWHTITANLVL_EVOLUTION_MAX_STAR: "Максимальная звезда титана",
		HWHTITANLVL_SUMMARY_EVOLUTIONS: "Эволюция титанов",
		HWHTITANLVL_SUMMARY_EMPTY_EVOLUTIONS: "Эволюции титанов не было.",
		HWHTITANLVL_PROGRESS_EVOLVE: "Эволюция {titanName}: {fromStar} → {toStar}",
		HWHTITANLVL_RUN: "Запустить прокачку",
		HWHTITANLVL_SELECT_TITANS_FIRST: "Сначала выбери титанов. Скрипт всё ещё не обязан угадывать твои планы.",
		HWHTITANLVL_NOTHING_TO_LEVEL: "Качать нечего. Либо зелья закончились, либо выбранные титаны уже упёрлись в потолок.",
		HWHTITANLVL_PROGRESS_PLAN: "Строим очередь уровней титанов. Пытаемся не сливать зелья как последние варвары.",
		HWHTITAN_PROGRESS_SYNCING: "Обновляем состояние игры после применения изменений.",
		HWHTITANLVL_PROGRESS_UPGRADE: "Качаем {titanName} · {fromLevel} → {toLevel}",
		HWHTITANLVL_PROGRESS_BUY_POTIONS: "Покупаем {potionAmount} зелий опыта за {coinAmount} монет душ титанов",
		HWHTITANLVL_PROGRESS_DONE: "Прокачка титанов закончена. Протолкнули {count} улучшений.",
		HWHTITANLVL_PROGRESS_ERROR: "Прокачка титанов рухнула. Консоль, как обычно, уже всё знает.",
		HWHTITANLVL_SUMMARY_LEVELS: "Уровни титанов",
		HWHTITANLVL_SUMMARY_SPENT: "Потратили",
		HWHTITANLVL_SUMMARY_EMPTY: "Ничего не прокачали. Склад зелий пока жив.",
		HWHTITANLVL_SUMMARY_RESOURCE: "{resourceName}: -{spentAmount} ({leftAmount})",
		HWHTITANLVL_SUMMARY_POTION_PURCHASE: "Купили зелий: +{potionAmount}; монеты душ титанов: -{coinSpentAmount} ({coinLeftAmount})",
		HWHTITANLVL_RESOURCE_FALLBACK: "Зелье титанов",
		HWHTITANLVL_EVOLUTION_ABSOLUTE: "ABS",
		HWHTITANSKIN_BUTTON: "Облики титанов",
		HWHTITANSKIN_BUTTON_TITLE: "Качает облики выбранных титанов по заданному порядку титанов и обликов.",
		HWHTITANSKIN_TITLE: "Настройки обликов титанов",
		HWHTITANSKIN_DESCRIPTION: "Выбери титанов для прокачки обликов и задай внутри каждого порядок обликов с отдельным лимитом уровня.",
		HWHTITANSKIN_RESOURCE: "Монеты обликов",
		HWHTITANSKIN_RESERVE: "Остаток монет обликов",
		HWHTITANSKIN_FILTER: "Какие облики качать",
		HWHTITANSKIN_PRIORITY_HEADER: "Приоритет обликов",
		HWHTITANSKIN_PRIORITY_HINT: "Порядок титанов читается сверху вниз. Внутри титана выбранные облики качаются в своём порядке и до своего лимита уровня.",
		HWHTITANSKIN_SKIN_ORDER: "Порядок обликов",
		HWHTITANSKIN_FILTER_HINT: "Фильтры сгруппированы по общему localeKey, чтобы одинаковые конфиги для каждого титана не превращали попап в помойку.",
		HWHTITANSKIN_LEVEL_CAP: "Лимит уровня облика",
		HWHTITANSKIN_SHOW_NEXT_COST: "Показывать цену следующего уровня облика в списке титанов",
		HWHTITANSKIN_RUN: "Запустить прокачку",
		HWHTITANSKIN_SELECT_TITANS_FIRST: "Сначала выбери титанов. Скрипт всё ещё не обязан угадывать твои хотелки.",
		HWHTITANSKIN_NOTHING_TO_LEVEL: "Качать нечего. Либо монеты обликов закончились, либо выбранные облики уже упёрлись в потолок.",
		HWHTITANSKIN_PROGRESS_PLAN: "Строим очередь обликов титанов. Пытаемся не спалить монеты как пещерные люди.",
		HWHTITANSKIN_PROGRESS_UPGRADE: "Качаем {titanName} · {skinName} · {fromLevel} → {toLevel}",
		HWHTITANSKIN_PROGRESS_DONE: "Прокачка обликов титанов закончена. Протолкнули {count} улучшений.",
		HWHTITANSKIN_PROGRESS_ERROR: "Прокачка обликов титанов рухнула. Консоль уже привычно хранит весь кринж.",
		HWHTITANSKIN_SUMMARY_SKINS: "Облики титанов",
		HWHTITANSKIN_SUMMARY_SPENT: "Потратили",
		HWHTITANSKIN_SUMMARY_EMPTY: "Ничего не прокачали. Монеты обликов пока не пострадали.",
		HWHTITANSKIN_SUMMARY_RESOURCE: "{resourceName}: -{spentAmount} ({leftAmount})",
		HWHTITANSKIN_RESOURCE_FALLBACK: "Монета облика титана",
		HWHTITANSKIN_SKIN_FALLBACK: "Облик {id}",
		HWHTITANSKIN_CONFIG_EMPTY: "Конфиг обликов титанов пустой. Игра опять решила спрятать данные.",
		HWHTITANART_FEEDBACK_BUTTON: "Обратная связь",
		HWHTITANART_FEEDBACK_BUTTON_TITLE: "Открывает Telegram. Для фидбэка, багов, благодарностей и умеренно культурного мата.",
		HWHTITANART_WHATS_NEW_BUTTON: "Что нового",
		HWHTITANART_WHATS_NEW_BUTTON_TITLE: "Открывает страницу истории версий этого скрипта.",
		HWHTITANART_CLOSE_BUTTON: "Закрыть",
		HWHTITANART_CLOSE_BUTTON_TITLE: "Закрывает попап без лишней драмы.",
		HWHTITANART_TASK_AUTO_LEVELS: "Титаны: уровни",
		HWHTITANART_TASK_AUTO_ARTIFACTS: "Титаны: артефакты",
		HWHTITANART_TASK_AUTO_SKINS: "Титаны: облики",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_HEADER: "Галочка «Сделать всё»",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_LABEL: "Куда поставить галочку",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_NONE: "Не добавлять",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_START: "В начало",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_END: "В конец",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_BEFORE: "Перед: {label}",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_AFTER: "После: {label}",
		HWHTITANART_DO_YOUR_BEST_PLACEMENT_HINT: "Выбирает, куда скрипт вставит свои титановые галочки внутри списка «Сделать всё».",
		HWHTITANTRAINER_BUTTON_PLACEMENT_LABEL: "Кнопка «Титаны»",
		HWHTITANTRAINER_BUTTON_PLACEMENT_MAIN: "Главное меню",
		HWHTITANTRAINER_BUTTON_PLACEMENT_OTHER: "Разное",
		HWHTITAN_TOOLTIP_BUTTON_PLACEMENT: "Переносит кнопку «Титаны» между главным меню и разделом «Разное»."
	};
	//#endregion
	//#region src/scripts/hwhtitanartifact/i18n/runtime.ts
	function getTitanArtifactTranslations() {
		return getScriptTranslations({
			en: builtinEnDictionary,
			ru: builtinRuDictionary
		}, { scriptId: resolveCurrentUserscriptId("hwhtitanartifact") });
	}
	//#endregion
	//#region src/shared/game/runtime-ready.ts
	/**
	* Ждёт, пока условие isReady не вернёт truthy, с таймаутом и поллингом.
	* @param {{isReady?: Function, timeoutMs?: number, pollDelayMs?: number, errorMessage?: string|Function}} [options]
	* @returns {Promise<*|undefined>}
	*/
	async function waitForRuntimeCondition({ isReady, timeoutMs = 5e3, pollDelayMs = 100, errorMessage = "Runtime is not ready." } = {}) {
		if (typeof isReady !== "function") throw new Error("Runtime wait requires isReady predicate.");
		const startedAt = Date.now();
		const normalizedTimeoutMs = Math.max(0, Number(timeoutMs) || 0);
		const normalizedPollDelayMs = Math.max(0, Number(pollDelayMs) || 0);
		while (Date.now() - startedAt < normalizedTimeoutMs) {
			const readyValue = await isReady();
			if (readyValue) return readyValue === true ? void 0 : readyValue;
			await delay(normalizedPollDelayMs);
		}
		throw new Error(typeof errorMessage === "function" ? errorMessage() : String(errorMessage));
	}
	/**
	* Создаёт контроллер готовности runtime с отложенной инициализацией и сбросом.
	* @param {{isReady?: Function, timeoutMs?: number, pollDelayMs?: number, errorMessage?: string, resetOnError?: boolean}} [options]
	* @returns {{ensureReady: Function, reset: Function, waitReady: Function}}
	*/
	function createRuntimeReadinessController({ isReady, timeoutMs = 5e3, pollDelayMs = 100, errorMessage = "Runtime is not ready.", resetOnError = true } = {}) {
		let readyPromise;
		async function waitReady(nextTimeoutMs = timeoutMs) {
			return waitForRuntimeCondition({
				isReady,
				timeoutMs: nextTimeoutMs,
				pollDelayMs,
				errorMessage
			});
		}
		async function ensureReady() {
			var _readyPromise;
			(_readyPromise = readyPromise) !== null && _readyPromise !== void 0 || (readyPromise = waitReady().catch((error) => {
				if (resetOnError) readyPromise = void 0;
				throw error;
			}));
			return readyPromise;
		}
		function reset() {
			readyPromise = void 0;
		}
		return {
			ensureReady,
			reset,
			waitReady
		};
	}
	/**
	* Создаёт контроллер готовности userId с кешированием значения.
	* @param {{timeoutMs?: number, pollDelayMs?: number, errorMessage?: string, getUserId?: Function, resetOnError?: boolean}} [options]
	* @returns {{ensureReady: Function, reset: Function, waitReady: Function, value: *}}
	*/
	function createUserIdReadinessController({ timeoutMs = 5e3, pollDelayMs = 100, errorMessage = "User id is not ready.", getUserId = () => globalThis.userId, resetOnError = true } = {}) {
		let userId;
		const runtime = createRuntimeReadinessController({
			timeoutMs,
			pollDelayMs,
			errorMessage,
			resetOnError,
			isReady: () => {
				const readyUserId = getUserId();
				if (readyUserId == null || readyUserId === "") return false;
				userId = readyUserId;
				return readyUserId;
			}
		});
		async function ensureReady() {
			if (userId != null && userId !== "") return userId;
			const currentUserId = getUserId();
			if (currentUserId != null && currentUserId !== "") {
				userId = currentUserId;
				return userId;
			}
			const readyUserId = await runtime.ensureReady();
			if (readyUserId == null || readyUserId === "") throw new Error(typeof errorMessage === "function" ? errorMessage() : errorMessage);
			userId = readyUserId;
			return userId;
		}
		function reset() {
			userId = void 0;
			runtime.reset();
		}
		return {
			ensureReady,
			reset,
			waitReady: runtime.waitReady,
			get value() {
				return userId;
			}
		};
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
	var _NativeStorage_brand = /* @__PURE__ */ new WeakSet();
	var NativeStorage = class {
		constructor({ name, schemaVersion, migrations = {}, store } = {}) {
			_classPrivateMethodInitSpec(this, _NativeStorage_brand);
			_defineProperty(this, "store", void 0);
			_defineProperty(this, "schemaVersion", void 0);
			_defineProperty(this, "migrations", void 0);
			this.store = store !== null && store !== void 0 ? store : new NativeKeyValueStore({
				databaseName: `hwh_${name !== null && name !== void 0 ? name : "hwh"}`,
				storeName: "settings"
			});
			this.schemaVersion = schemaVersion !== null && schemaVersion !== void 0 ? schemaVersion : 1;
			this.migrations = migrations;
		}
		async read(key, fallbackValue) {
			try {
				const raw = await this.store.getItem(String(key));
				if (raw == null) return fallbackValue;
				return _assertClassBrand(_NativeStorage_brand, this, _migrate$1).call(this, raw);
			} catch (_unused9) {
				return fallbackValue;
			}
		}
		async write(key, value) {
			const envelope = {
				schemaVersion: this.schemaVersion,
				value
			};
			await this.store.setItem(String(key), envelope);
		}
		async remove(key) {
			await this.store.removeItem(String(key));
		}
		async clear() {
			await this.store.clear();
		}
		async keys() {
			return this.store.keys();
		}
	};
	function _migrate$1(data) {
		var _current$schemaVersio, _current$value;
		let current = data;
		for (let version = ((_current$schemaVersio = current === null || current === void 0 ? void 0 : current.schemaVersion) !== null && _current$schemaVersio !== void 0 ? _current$schemaVersio : 0) + 1; version <= this.schemaVersion; version++) {
			const migration = this.migrations[version];
			if (typeof migration === "function") current = migration(current);
		}
		return (_current$value = current === null || current === void 0 ? void 0 : current.value) !== null && _current$value !== void 0 ? _current$value : current;
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
	function renderInlineIcon(name, options = {}) {
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
	function patchNativeModalAction(result, patch) {
		if (!activeModal) return;
		activeModal.actions = activeModal.actions.map((action) => action.result === result ? {
			...action,
			...patch,
			result
		} : action);
		renderFooter(activeModal);
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
	* Строит имя файла экспорта настроек на основе userId.
	*/
	function buildSettingsExportFileName(userIdValue, suffix) {
		return `${String(userIdValue !== null && userIdValue !== void 0 ? userIdValue : "unknown").trim().replaceAll(/[^\w.-]+/g, "_") || "unknown"}.${String(suffix !== null && suffix !== void 0 ? suffix : "settings.json").trim().replace(/^\.*/, "")}`;
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
	function getSharedUiRuntime$1() {
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
		const sharedUi = getSharedUiRuntime$1();
		if (sharedUi) sharedUi.accordionAutoScrollMode = accordionAutoScrollMode;
		return accordionAutoScrollMode;
	}
	/**
	* Возвращает текущий режим автопрокрутки.
	* @returns {string}
	*/
	function getAccordionAutoScrollMode() {
		var _getSharedUiRuntime;
		const sharedUiMode = (_getSharedUiRuntime = getSharedUiRuntime$1()) === null || _getSharedUiRuntime === void 0 ? void 0 : _getSharedUiRuntime.accordionAutoScrollMode;
		if (sharedUiMode !== void 0) accordionAutoScrollMode = normalizeAccordionAutoScrollMode(sharedUiMode, accordionAutoScrollMode);
		return accordionAutoScrollMode;
	}
	function getAccordionAutoScrollOptions(labels = {}) {
		var _labels$off, _labels$instant, _labels$smooth;
		return [
			{
				value: "off",
				label: (_labels$off = labels.off) !== null && _labels$off !== void 0 ? _labels$off : "Off",
				icon: "eye-off"
			},
			{
				value: ACCORDION_AUTO_SCROLL_MODE_INSTANT,
				label: (_labels$instant = labels.instant) !== null && _labels$instant !== void 0 ? _labels$instant : "Instant",
				icon: "arrow-down"
			},
			{
				value: ACCORDION_AUTO_SCROLL_MODE_SMOOTH,
				label: (_labels$smooth = labels.smooth) !== null && _labels$smooth !== void 0 ? _labels$smooth : "Smooth",
				icon: "scroll"
			}
		];
	}
	//#endregion
	//#region src/shared/ui/preferences.ts
	function getSharedUiRuntime() {
		return globalThis.HWHSharedUI && typeof globalThis.HWHSharedUI === "object" ? globalThis.HWHSharedUI : void 0;
	}
	var tooltipsEnabled = true;
	function setTooltipsEnabled(value) {
		tooltipsEnabled = value !== false;
		const sharedUi = getSharedUiRuntime();
		if (sharedUi) sharedUi.tooltipsEnabled = tooltipsEnabled;
		return tooltipsEnabled;
	}
	//#endregion
	//#region src/shared/ui/reorder-list-variant.ts
	var REORDER_LIST_VARIANT_FULL = "full";
	var REORDER_LIST_VARIANT_MINIMAL = "minimal";
	var REORDER_LIST_ACTIONS_BY_VARIANT = {
		[REORDER_LIST_VARIANT_FULL]: [
			"top",
			"up",
			"down",
			"bottom"
		],
		[REORDER_LIST_VARIANT_MINIMAL]: ["up", "down"]
	};
	function normalizeReorderListVariant(value, fallback = REORDER_LIST_VARIANT_FULL) {
		return value === "minimal" || value === "full" ? value : fallback === "minimal" || fallback === "full" ? fallback : REORDER_LIST_VARIANT_FULL;
	}
	function getReorderListActionValues(value) {
		return REORDER_LIST_ACTIONS_BY_VARIANT[normalizeReorderListVariant(value)];
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
	//#region src/scripts/hwhtitanartifact/runtime/lite/ui-port.ts
	var RuntimeResultSummary = defineNativeView("titan-result-summary", renderNativeResultSummary);
	var RuntimeTextPanel = defineNativeView("titan-text-panel", renderNativeTextPanel);
	var createRuntimeProgressController = createNativeProgressController;
	var initializeRuntimeUi = initializeNativeUi;
	var isRuntimeModalVisible = isNativeModalVisible;
	var patchRuntimeAction = patchNativeModalAction;
	function createRuntimeGameIconResolvers(_runtime) {
		return {
			gameEntityIconResolver: void 0,
			gameItemIconResolver: void 0
		};
	}
	function createRuntimeReactiveState(value) {
		return value;
	}
	function createRuntimeShallowReactiveState(value) {
		return value;
	}
	function buildRuntimeModalHeader(title) {
		return {
			title: title || "HWH Titan Trainer Lite",
			badges: [{
				label: `v1.4.226-lite.1`,
				tone: "blue"
			}, {
				label: "Lite",
				tone: "gray"
			}]
		};
	}
	function buildRuntimeTrainerHeaderActions(translate) {
		return [
			buildAction("exportSettings", translate("HWHTITANTRAINER_EXPORT_SETTINGS")),
			buildAction("importSettings", translate("HWHTITANTRAINER_IMPORT_SETTINGS"), true),
			buildAction("dumpGameLibrary", translate("HWHTITANTRAINER_DUMP_LIBRARY_TITLE")),
			buildAction("help", translate("HWHTITANTRAINER_DOCS_TITLE"), true)
		];
	}
	async function openRuntimeDocumentationModal(translate, _uiTheme) {
		await openNativeComponentModal({
			kind: "documentation",
			title: translate("HWHTITANTRAINER_DOCS_TITLE"),
			header: buildRuntimeModalHeader(translate("HWHTITANTRAINER_DOCS_TITLE")),
			component: RuntimeTextPanel,
			props: {
				note: translate("HWHTITANTRAINER_DOCS_TEXT"),
				links: SUPPORT_DOCUMENTATION_LINKS.map((link, index) => ({
					label: translate(index === 0 ? "HWHTITANTRAINER_DOCS_PRIMARY" : "HWHTITANTRAINER_DOCS_MIRROR"),
					url: link.url
				}))
			},
			actions: [{
				result: "close",
				label: translate("HWHTITANART_CLOSE")
			}]
		});
	}
	async function openRuntimeDonateModal(translate, _uiTheme) {
		await openNativeComponentModal({
			kind: "donate",
			title: translate("HWHTITANTRAINER_DONATE_TITLE"),
			header: buildRuntimeModalHeader(translate("HWHTITANTRAINER_DONATE_TITLE")),
			component: RuntimeTextPanel,
			props: {
				note: `${translate("HWHTITANTRAINER_DONATE_TEXT")}\n${translate("HWHTITANTRAINER_DONATE_WALLET", { wallet: SUPPORT_DONATE_WALLET })}`,
				links: SUPPORT_DONATE_PROVIDERS
			},
			actions: [{
				result: "close",
				label: translate("HWHTITANART_CLOSE")
			}]
		});
	}
	function buildAction(result, title, closeOnClick = false) {
		return {
			result,
			label: title,
			title,
			iconOnly: true,
			closeOnClick
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/runtime/progress-stages.ts
	function createTitanProgressWriter({ setProgress, setStageProgress }) {
		return (content, context) => {
			if (!context) {
				setProgress(content);
				return;
			}
			const detail = stripMarkup(content);
			if (typeof context === "string") {
				setStageProgress({
					phase: context,
					detail,
					explainSingleBatch: false
				});
				return;
			}
			const { event, requestName } = context;
			setStageProgress({
				phase: event.phase === "processed" ? "processing" : "sending",
				current: event.requestIndex,
				total: event.totalRequests,
				itemCount: event.chunkSize,
				requestName,
				detail
			});
		};
	}
	function stripMarkup(value) {
		return String(value !== null && value !== void 0 ? value : "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/settings/transfer.ts
	function buildTitanTrainerSettingsExportFileName(userIdValue) {
		return buildSettingsExportFileName(userIdValue, "hwhtitantrainer.json");
	}
	function getTitanTrainerTransferOptions(translate) {
		return [
			{
				key: "artifactSettings",
				label: translate("HWHTITANTRAINER_TAB_ARTIFACTS"),
				icon: "hammer"
			},
			{
				key: "levelSettings",
				label: translate("HWHTITANTRAINER_TAB_LEVELS"),
				icon: "arrow-up"
			},
			{
				key: "skinSettings",
				label: translate("HWHTITANTRAINER_TAB_SKINS"),
				icon: "shirt"
			},
			{
				key: "doYourBestPlacement",
				label: translate("HWHTITANART_DO_YOUR_BEST_PLACEMENT_HEADER"),
				icon: "list-checks"
			}
		];
	}
	function getTitanTrainerImportData(value, deps) {
		const { translate, normalizeSettings, normalizeLevelSettings, normalizeSkinSettings, normalizeDoYourBestPlacementMap } = deps;
		const payloadRecord = isPlainObject(value) ? value : {};
		if (!isPlainObject(value)) throw new Error(translate("HWHTITANTRAINER_SETTINGS_IMPORT_INVALID"));
		if (payloadRecord.scriptId !== "hwhtitantrainer" && payloadRecord.scriptId !== "hwhtitanartifact") throw new Error(translate("HWHTITANTRAINER_SETTINGS_IMPORT_INVALID"));
		const dataValue = isPlainObject(payloadRecord.data) ? payloadRecord.data : {};
		if (!isPlainObject(payloadRecord.data)) throw new Error(translate("HWHTITANTRAINER_SETTINGS_IMPORT_INVALID"));
		return {
			artifactSettings: dataValue.artifactSettings != null ? normalizeSettings(dataValue.artifactSettings) : void 0,
			levelSettings: dataValue.levelSettings != null ? normalizeLevelSettings(dataValue.levelSettings) : void 0,
			skinSettings: dataValue.skinSettings != null ? normalizeSkinSettings(dataValue.skinSettings) : void 0,
			doYourBestPlacement: dataValue.doYourBestPlacement != null ? normalizeDoYourBestPlacementMap(dataValue.doYourBestPlacement) : void 0
		};
	}
	async function applyTitanTrainerImportData(importData, deps) {
		const normalizedImportData = getTitanTrainerImportData({
			scriptId: "hwhtitantrainer",
			data: importData
		}, deps);
		if (normalizedImportData.artifactSettings) await deps.writeSettings(normalizedImportData.artifactSettings);
		if (normalizedImportData.levelSettings) await deps.writeLevelSettings(normalizedImportData.levelSettings);
		if (normalizedImportData.skinSettings) await deps.writeSkinSettings(normalizedImportData.skinSettings);
		if (normalizedImportData.doYourBestPlacement !== void 0) {
			var _deps$afterDoYourBest;
			await deps.writeDoYourBestPlacement(normalizedImportData.doYourBestPlacement);
			await ((_deps$afterDoYourBest = deps.afterDoYourBestPlacementImport) === null || _deps$afterDoYourBest === void 0 ? void 0 : _deps$afterDoYourBest.call(deps));
		}
		return normalizedImportData;
	}
	function createTitanTrainerSettingsTransferFlow([translate, normalizeSettings, normalizeLevelSettings, normalizeSkinSettings, normalizeDoYourBestPlacementMap, getUserId, getScriptInfo, readSettings, readLevelSettings, readSkinSettings, readDoYourBestPlacement, writeSettings, writeLevelSettings, writeSkinSettings, writeDoYourBestPlacement, afterDoYourBestPlacementImport, showNotice, storageSchemaVersion]) {
		const importDataOptions = {
			translate,
			normalizeSettings,
			normalizeLevelSettings,
			normalizeSkinSettings,
			normalizeDoYourBestPlacementMap
		};
		async function buildExportPayload() {
			var _scriptInfo$name, _scriptInfo$version;
			const userIdValue = await getUserId();
			const scriptInfo = getScriptInfo();
			return buildSettingsExportPayload({
				scriptId: "hwhtitantrainer",
				scriptName: String((_scriptInfo$name = scriptInfo.name) !== null && _scriptInfo$name !== void 0 ? _scriptInfo$name : "HWH Titan Trainer"),
				scriptVersion: String((_scriptInfo$version = scriptInfo.version) !== null && _scriptInfo$version !== void 0 ? _scriptInfo$version : ""),
				storageSchemaVersion,
				userId: String(userIdValue),
				data: {
					artifactSettings: normalizeSettings(await readSettings()),
					levelSettings: normalizeLevelSettings(await readLevelSettings()),
					skinSettings: normalizeSkinSettings(await readSkinSettings()),
					doYourBestPlacement: readDoYourBestPlacement()
				}
			});
		}
		const transferOptions = getTitanTrainerTransferOptions(translate);
		const exportController = createSettingsTransferController({
			buildPayload: buildExportPayload,
			buildFileName: (payload) => {
				return buildTitanTrainerSettingsExportFileName((isPlainObject(payload) ? payload : {}).userId);
			},
			showNotice,
			exportOptions: transferOptions,
			labels: { exportDone: translate("HWHTITANTRAINER_SETTINGS_EXPORT_DONE") }
		});
		const importController = createSettingsTransferController({
			parseImport: (value) => getTitanTrainerImportData(value, importDataOptions),
			applyImport: (importData) => applyTitanTrainerImportData(importData, {
				...importDataOptions,
				writeSettings,
				writeLevelSettings,
				writeSkinSettings,
				writeDoYourBestPlacement,
				afterDoYourBestPlacementImport
			}),
			showNotice,
			importOptions: transferOptions,
			labels: {
				parseError: translate("HWHTITANTRAINER_SETTINGS_IMPORT_PARSE_ERROR"),
				importDone: translate("HWHTITANTRAINER_SETTINGS_IMPORT_DONE")
			}
		});
		return [
			buildExportPayload,
			exportController.exportToJson,
			importController.importFromJson
		];
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
	var UI_THEME_DEFINITIONS$1 = Object.freeze([
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
	var UI_THEME_DESCRIPTORS$1 = Object.freeze(UI_THEME_DEFINITIONS$1.map((def) => {
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
	function normalizeUiTheme$1(value) {
		if (typeof value === "string") {
			const normalized = value.trim().toLowerCase();
			if (UI_THEME_VALUE_SET.has(normalized)) return normalized;
		}
		return UI_THEME_DARK;
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/core/constants.ts
	var SETTINGS_STORAGE_PREFIX = "hwhtitanartifact_settings_";
	var DO_YOUR_BEST_PLACEMENT_STORAGE_KEY = "hwhtitanartifact_do_your_best_placement";
	var TITAN_TRAINER_BUTTON_PLACEMENT_STORAGE_KEY = "hwhtitantrainer_button_placement";
	var LEVEL_SETTINGS_STORAGE_PREFIX = "hwhtitanlevel_settings_";
	var SKIN_SETTINGS_STORAGE_PREFIX = "hwhtitanskin_settings_";
	var USER_ID_WAIT_TIMEOUT_MS = 6e4;
	var ARTIFACT_SLOT_IDS = [
		0,
		1,
		2
	];
	var ARTIFACT_SLOT_ID_SET = new Set(ARTIFACT_SLOT_IDS);
	var LEVELING_MODE_AMOUNT = "amount";
	var UPGRADE_MODE_SEQUENTIAL = "sequential";
	var UPGRADE_MODE_PARALLEL = "parallel";
	var CHECKLIST_AMOUNT_BEHAVIOR_SKIP = "skip";
	var CHECKLIST_AMOUNT_BEHAVIOR_DEFAULT = "default";
	var CHECKLIST_FRAGMENT_BEHAVIOR_USE_SETTINGS = "use-settings";
	var TITAN_TRAINER_BUTTON_PLACEMENT_MAIN = "main";
	var TITAN_TRAINER_BUTTON_PLACEMENT_OTHER = "other";
	var TITAN_TRAINER_ACTION_KEY = "hwhTitanTrainerAction";
	var TITAN_TRAINER_TAB_INPUT_ID = "hwhtitantrainer-active-tab";
	var TITAN_TRAINER_TAB_GENERAL = "general";
	var TITAN_TRAINER_TAB_ARTIFACTS = "artifacts";
	var TITAN_TRAINER_TAB_LEVELS = "levels";
	var TITAN_TRAINER_TAB_SKINS = "skins";
	var DO_YOUR_BEST_TITAN_ARTIFACT_TASK_NAME = "runTitanArtifactChecklistTask";
	var DO_YOUR_BEST_TITAN_LEVEL_TASK_NAME = "runTitanLevelChecklistTask";
	var DO_YOUR_BEST_TITAN_SKIN_TASK_NAME = "runTitanSkinChecklistTask";
	var ACCORDION_AUTO_SCROLL_MODE_INPUT_ID = "hwhtitantrainer-accordion-auto-scroll-mode";
	var REORDER_LIST_VARIANT_INPUT_ID = "hwhtitantrainer-reorder-list-variant";
	var TITAN_TRAINER_BUTTON_PLACEMENT_INPUT_ID = "hwhtitantrainer-button-placement";
	var UI_TOOLTIPS_INPUT_ID = "hwhtitantrainer-ui-tooltips";
	var HOTKEY_OPEN_SETTINGS_INPUT_ID = "hwhtitantrainer-hotkey-open-settings";
	var HOTKEY_RUN_ALL_INPUT_ID = "hwhtitantrainer-hotkey-run-all";
	var HOTKEY_RUN_ARTIFACTS_INPUT_ID = "hwhtitantrainer-hotkey-run-artifacts";
	var HOTKEY_RUN_LEVELS_INPUT_ID = "hwhtitantrainer-hotkey-run-levels";
	var HOTKEY_RUN_SKINS_INPUT_ID = "hwhtitantrainer-hotkey-run-skins";
	Object.freeze(UI_THEME_DEFINITIONS$1.map((definition) => ({
		value: definition.value,
		labelKey: `HWHTITANTRAINER_UI_THEME_${definition.value.toUpperCase().replace(/-/g, "_")}`,
		icon: definition.icon
	})));
	Object.freeze(UI_THEME_DESCRIPTORS$1.map((theme) => ({
		...theme,
		definition: {
			...theme.definition,
			labelKey: `HWHTITANTRAINER_UI_THEME_${theme.definition.value.toUpperCase().replace(/-/g, "_")}`
		}
	})));
	var TITAN_SELECTION_INPUT_PREFIX = "hwhtitan-selection-";
	var SLOT_FILTER_INPUT_PREFIX = "hwhtitanartifact-slot-filter-";
	var ARTIFACT_LEVEL_CAP_INPUT_PREFIX = "hwhtitanartifact-level-cap-";
	var ARTIFACT_TITAN_REORDER_ACTION_ATTRIBUTE = "data-hwhtitanartifact-titan-reorder";
	var ARTIFACT_SLOT_REORDER_ACTION_ATTRIBUTE = "data-hwhtitanartifact-slot-reorder";
	var ESSENCE_RESERVE_INPUT_ID = "hwhtitanartifact-essence-reserve";
	var ARTIFACT_GOLD_RESERVE_INPUT_ID = "hwhtitanartifact-gold-reserve";
	var ARTIFACT_FRAGMENT_COIN_RESERVE_INPUT_ID = "hwhtitanartifact-fragment-coin-reserve";
	var ARTIFACT_EVOLVE_INPUT_ID = "hwhtitanartifact-evolve-artifacts";
	var ARTIFACT_BUY_FRAGMENTS_INPUT_ID = "hwhtitanartifact-buy-fragments";
	var ARTIFACT_EVOLVE_TARGETS_INPUT_ID = "hwhtitanartifact-evolve-targets";
	var ARTIFACT_FRAGMENT_BUY_TARGETS_INPUT_ID = "hwhtitanartifact-fragment-buy-targets";
	var ARTIFACT_EVOLUTION_MAX_STAR_INPUT_ID = "hwhtitanartifact-evolution-max-star";
	var ARTIFACT_LEVELING_MODE_SELECT_ID = "hwhtitanartifact-leveling-mode";
	var ARTIFACT_UPGRADE_MODE_SELECT_ID = "hwhtitanartifact-upgrade-mode";
	var ARTIFACT_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID = "hwhtitanartifact-checklist-amount-behavior";
	var ARTIFACT_CHECKLIST_AMOUNT_INPUT_ID = "hwhtitanartifact-checklist-amount";
	var ARTIFACT_CHECKLIST_FRAGMENT_BEHAVIOR_SELECT_ID = "hwhtitanartifact-checklist-fragment-behavior";
	var SHOW_FULL_COST_INPUT_ID = "hwhtitanartifact-show-full-cost";
	var POTION_RESERVE_INPUT_ID = "hwhtitanlevel-potion-reserve";
	var TITAN_XP_POTION_BUY_INPUT_ID = "hwhtitanlevel-buy-xp-potions";
	var TITAN_XP_POTION_COIN_RESERVE_INPUT_ID = "hwhtitanlevel-xp-potion-coin-reserve";
	var TITAN_LEVELING_MODE_SELECT_ID = "hwhtitanlevel-leveling-mode";
	var TITAN_LEVEL_UPGRADE_MODE_SELECT_ID = "hwhtitanlevel-upgrade-mode";
	var TITAN_LEVEL_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID = "hwhtitanlevel-checklist-amount-behavior";
	var TITAN_LEVEL_CHECKLIST_AMOUNT_INPUT_ID = "hwhtitanlevel-checklist-amount";
	var TITAN_LEVEL_CAP_INPUT_PREFIX = "hwhtitanlevel-cap-";
	var TITAN_LEVEL_REORDER_ACTION_ATTRIBUTE = "data-hwhtitanlevel-titan-reorder";
	var TITAN_EVOLVE_TARGETS_INPUT_ID = "hwhtitanlevel-evolve-targets";
	var TITAN_EVOLUTION_MAX_STAR_INPUT_ID = "hwhtitanlevel-evolution-max-star";
	var SHOW_LEVEL_COST_INPUT_ID = "hwhtitanlevel-show-next-cost";
	var SHOW_LEVEL_EVOLUTION_INPUT_ID = "hwhtitanlevel-show-evolution";
	var SKIN_RESERVE_INPUT_ID = "hwhtitanskin-reserve";
	var SKIN_LEVELING_MODE_SELECT_ID = "hwhtitanskin-leveling-mode";
	var SKIN_UPGRADE_MODE_SELECT_ID = "hwhtitanskin-upgrade-mode";
	var SKIN_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID = "hwhtitanskin-checklist-amount-behavior";
	var SKIN_CHECKLIST_AMOUNT_INPUT_ID = "hwhtitanskin-checklist-amount";
	var SKIN_FILTER_INPUT_PREFIX = "hwhtitanskin-filter-";
	var SKIN_LEVEL_CAP_INPUT_PREFIX = "hwhtitanskin-level-cap-";
	var SKIN_TITAN_REORDER_ACTION_ATTRIBUTE = "data-hwhtitanskin-titan-reorder";
	var SKIN_REORDER_ACTION_ATTRIBUTE = "data-hwhtitanskin-skin-reorder";
	var SHOW_SKIN_COST_INPUT_ID = "hwhtitanskin-show-next-cost";
	var ARTIFACT_CALC_INPUT_PREFIX = "hwhtitanartifact-calc-";
	var LEVEL_CALC_INPUT_PREFIX = "hwhtitanlevel-calc-";
	var SKIN_CALC_INPUT_PREFIX = "hwhtitanskin-calc-";
	var ARTIFACT_CALC_TITAN_SELECT_ID = `${ARTIFACT_CALC_INPUT_PREFIX}titan`;
	var ARTIFACT_CALC_SLOT_SELECT_ID = `${ARTIFACT_CALC_INPUT_PREFIX}slot`;
	var ARTIFACT_CALC_START_INPUT_ID = `${ARTIFACT_CALC_INPUT_PREFIX}start`;
	var ARTIFACT_CALC_END_INPUT_ID = `${ARTIFACT_CALC_INPUT_PREFIX}end`;
	var LEVEL_CALC_TITAN_SELECT_ID = `${LEVEL_CALC_INPUT_PREFIX}titan`;
	var LEVEL_CALC_START_INPUT_ID = `${LEVEL_CALC_INPUT_PREFIX}start`;
	var LEVEL_CALC_END_INPUT_ID = `${LEVEL_CALC_INPUT_PREFIX}end`;
	var SKIN_CALC_TITAN_SELECT_ID = `${SKIN_CALC_INPUT_PREFIX}titan`;
	var SKIN_CALC_GROUP_SELECT_ID = `${SKIN_CALC_INPUT_PREFIX}group`;
	var SKIN_CALC_START_INPUT_ID = `${SKIN_CALC_INPUT_PREFIX}start`;
	var SKIN_CALC_END_INPUT_ID = `${SKIN_CALC_INPUT_PREFIX}end`;
	var DEFAULT_SETTINGS = {
		selectedTitanIds: [],
		selectedArtifactSlotIds: [0, 1],
		levelingMode: "max",
		upgradeMode: UPGRADE_MODE_SEQUENTIAL,
		checklistAmountBehavior: CHECKLIST_AMOUNT_BEHAVIOR_SKIP,
		checklistLevelingAmount: 1,
		checklistFragmentPurchaseBehavior: CHECKLIST_FRAGMENT_BEHAVIOR_USE_SETTINGS,
		essenceReserve: 0,
		artifactGoldReserve: 0,
		artifactFragmentCoinReserve: 0,
		evolveArtifacts: false,
		buyArtifactFragments: false,
		selectedArtifactEvolutionKeys: [],
		selectedArtifactFragmentBuyKeys: [],
		artifactEvolutionMaxStar: void 0,
		showFullCosts: false,
		syncAfterRun: false,
		uiTheme: UI_THEME_CLASSIC,
		uiTooltipsEnabled: true,
		progressAutoHideResult: false,
		progressAutoHideResultTimeoutMs: 5e3,
		progressWindowPosition: "top-right",
		progressWindowStyle: "default",
		accordionAutoScrollMode: "smooth",
		reorderListVariant: REORDER_LIST_VARIANT_FULL,
		titanTrainerButtonPlacement: TITAN_TRAINER_BUTTON_PLACEMENT_MAIN,
		hotkeys: {
			openSettings: "",
			runAll: "",
			runArtifacts: "",
			runLevels: "",
			runSkins: ""
		},
		artifactLevelCaps: [],
		artifactRules: {}
	};
	var DEFAULT_LEVEL_SETTINGS = {
		selectedTitanIds: [],
		levelingMode: "max",
		upgradeMode: UPGRADE_MODE_PARALLEL,
		checklistAmountBehavior: CHECKLIST_AMOUNT_BEHAVIOR_SKIP,
		checklistLevelingAmount: 1,
		potionReserve: 0,
		buyXpPotions: false,
		xpPotionCoinReserve: 0,
		showNextCosts: false,
		showEvolutionProgress: true,
		syncAfterRun: false,
		titanLevelCaps: {},
		selectedTitanEvolutionIds: [],
		titanEvolutionMaxStar: void 0
	};
	var DEFAULT_SKIN_SETTINGS = {
		selectedTitanIds: [],
		selectedSkinLocaleKeys: [],
		levelingMode: "max",
		upgradeMode: UPGRADE_MODE_SEQUENTIAL,
		checklistAmountBehavior: CHECKLIST_AMOUNT_BEHAVIOR_SKIP,
		checklistLevelingAmount: 1,
		skinStoneReserve: 0,
		showNextCosts: false,
		syncAfterRun: false,
		skinLevelCaps: {},
		skinRules: {}
	};
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
	//#region src/scripts/hwhtitanartifact/settings/trainer-stores.ts
	async function loadTitanTrainerStores({ normalizers, repository }) {
		const { useStore: useArtifactSettingsStore } = createLocalforageSettingsStore("hwhtitanartifact-artifacts", DEFAULT_SETTINGS, normalizers.artifact, {
			read: repository.readArtifact,
			write: repository.writeArtifact
		});
		const { useStore: useLevelSettingsStore } = createLocalforageSettingsStore("hwhtitanartifact-levels", DEFAULT_LEVEL_SETTINGS, normalizers.level, {
			read: repository.readLevel,
			write: repository.writeLevel
		});
		const { useStore: useSkinSettingsStore } = createLocalforageSettingsStore("hwhtitanartifact-skins", DEFAULT_SKIN_SETTINGS, normalizers.skin, {
			read: repository.readSkin,
			write: repository.writeSkin
		});
		const artifactStore = useArtifactSettingsStore();
		const levelStore = useLevelSettingsStore();
		const skinStore = useSkinSettingsStore();
		const stores = {
			artifactStore,
			levelStore,
			skinStore
		};
		await artifactStore.load();
		await levelStore.load();
		await skinStore.load();
		return {
			stores,
			artifactSettings: normalizers.artifact(artifactStore.state),
			levelSettings: normalizers.level(levelStore.state),
			skinSettings: normalizers.skin(skinStore.state)
		};
	}
	async function writeAllTitanTrainerSettings({ artifactSettings, levelSettings, skinSettings, stores, normalizers, repository }) {
		const normalizedArtifactSettings = normalizers.artifact(artifactSettings);
		const normalizedLevelSettings = normalizers.level(levelSettings);
		const normalizedSkinSettings = normalizers.skin(skinSettings);
		if (stores) {
			replaceSettingsStoreState(stores.artifactStore, normalizedArtifactSettings);
			replaceSettingsStoreState(stores.levelStore, normalizedLevelSettings);
			replaceSettingsStoreState(stores.skinStore, normalizedSkinSettings);
			await stores.artifactStore.save();
			await stores.levelStore.save();
			await stores.skinStore.save();
			return;
		}
		await repository.writeArtifact(normalizedArtifactSettings);
		await repository.writeLevel(normalizedLevelSettings);
		await repository.writeSkin(normalizedSkinSettings);
	}
	function replaceSettingsStoreState(store, settings) {
		if (!(store === null || store === void 0 ? void 0 : store.state)) return;
		replaceSettingsState(store.state, settings);
	}
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
	//#region src/scripts/hwhtitanartifact/core/helpers.ts
	function normalizeUnknownArray(value, fallbackValue = []) {
		return Array.isArray(value) ? value : fallbackValue;
	}
	function getCollectionValue(collection, key) {
		if (Array.isArray(collection)) {
			const index = Number(key);
			return Number.isInteger(index) ? collection[index] : void 0;
		}
		return getRecordValue$1(collection, key);
	}
	function normalizeUiTheme(value) {
		return normalizeUiTheme$1(value);
	}
	function getArtifactLevelColor(colorName) {
		const normalizedColorName = String(colorName !== null && colorName !== void 0 ? colorName : "").toLowerCase();
		if (/(brown|корич)/.test(normalizedColorName)) return "#8d6e63";
		if (/(red|крас)/.test(normalizedColorName)) return "#d9534f";
		if (/(orange|gold|yellow|оранж|желт)/.test(normalizedColorName)) return "#f0ad4e";
		if (/(violet|purple|фиол|пурп)/.test(normalizedColorName)) return "#b388ff";
		if (/(blue|син)/.test(normalizedColorName)) return "#67c7ff";
		if (/(green|зел)/.test(normalizedColorName)) return "#7fe3ba";
		return "#f0d59f";
	}
	function getTitanToneByColor(color) {
		const normalizedColor = String(color !== null && color !== void 0 ? color : "").toLowerCase();
		if (normalizedColor.includes("8f7a68")) return "muted";
		if (normalizedColor.includes("9fe0a8")) return "green";
		if (normalizedColor.includes("8fd3ff")) return "blue";
		if (normalizedColor.includes("d7b2ff")) return "purple";
		if (normalizedColor.includes("b388ff")) return "violet";
		if (normalizedColor.includes("ffd36e") || normalizedColor.includes("f0d59f")) return "gold";
		if (normalizedColor.includes("f0ad4e")) return "orange";
		if (normalizedColor.includes("d9534f")) return "red";
		if (normalizedColor.includes("8d6e63")) return "brown";
		if (normalizedColor.includes("ff9f9f")) return "danger";
		return "gold";
	}
	function getTitanDoYourBestModuleDefinitions() {
		return [
			{
				key: "levels",
				taskName: "runTitanLevelChecklistTask",
				labelKey: "HWHTITANART_TASK_AUTO_LEVELS"
			},
			{
				key: "artifacts",
				taskName: "runTitanArtifactChecklistTask",
				labelKey: "HWHTITANART_TASK_AUTO_ARTIFACTS"
			},
			{
				key: "skins",
				taskName: "runTitanSkinChecklistTask",
				labelKey: "HWHTITANART_TASK_AUTO_SKINS"
			}
		];
	}
	function getDoYourBestPlacementSelectId(moduleKey) {
		return `hwhtitanartifact-do-your-best-placement-${String(moduleKey !== null && moduleKey !== void 0 ? moduleKey : "all")}`;
	}
	function getMaxArtifactLevelFromConfig(levelConfigMap) {
		if (Array.isArray(levelConfigMap)) return levelConfigMap.length;
		return Object.keys(levelConfigMap && typeof levelConfigMap === "object" ? levelConfigMap : {}).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0).reduce((maxValue, value) => Math.max(maxValue, value), 0);
	}
	function normalizeCapValue(rawValue, fallbackValue) {
		const normalizedFallback = Math.max(0, Math.floor(Number(fallbackValue) || 0));
		const parsedValue = parseNumberInputText(rawValue, normalizedFallback);
		if (!Number.isFinite(parsedValue)) return normalizedFallback;
		return Math.max(0, Math.floor(parsedValue));
	}
	function normalizeLevelingMode(value) {
		return value === "amount" ? "amount" : "max";
	}
	function normalizeUpgradeMode(value, fallback = "sequential") {
		if (value === "sequential" || value === "parallel") return value;
		return fallback === "parallel" ? "parallel" : "sequential";
	}
	function normalizeChecklistAmountBehavior(value) {
		return value === "default" ? "default" : "skip";
	}
	function normalizeChecklistFragmentPurchaseBehavior(value) {
		return value === "skip" ? "skip" : "use-settings";
	}
	function normalizeTitanTrainerButtonPlacement(value) {
		return value === "other" ? "other" : "main";
	}
	function parseJsonValue(value, fallbackValue = void 0) {
		if (value == null || value === "") return fallbackValue;
		try {
			return JSON.parse(String(value));
		} catch (_unused) {
			return fallbackValue;
		}
	}
	function buildTitanArtifactKey(titanId, slotId) {
		return `${Math.max(0, Number(titanId) || 0)}:${Math.max(0, Number(slotId) || 0)}`;
	}
	function parseTitanArtifactKey(value) {
		const [titanIdText, slotIdText] = String(value !== null && value !== void 0 ? value : "").split(":");
		const titanId = Number(titanIdText);
		const slotId = Number(slotIdText);
		if (!Number.isFinite(titanId) || !Number.isFinite(slotId) || !ARTIFACT_SLOT_ID_SET.has(slotId)) return;
		return {
			titanId,
			slotId
		};
	}
	function normalizeTitanArtifactKeys(values, allowedSlotIds = ARTIFACT_SLOT_IDS) {
		const allowedSlotIdSet = new Set(normalizeUnknownArray(allowedSlotIds, ARTIFACT_SLOT_IDS).map((slotId) => Number(slotId)).filter((slotId) => ARTIFACT_SLOT_ID_SET.has(slotId)));
		return [...new Set(normalizeUnknownArray(values))].map(parseTitanArtifactKey).filter((entry) => entry != null && Number.isFinite(entry.titanId) && allowedSlotIdSet.has(Number(entry.slotId))).map((entry) => buildTitanArtifactKey(entry.titanId, entry.slotId));
	}
	function normalizeTitanIdValues(values) {
		return [...new Set(normalizeUnknownArray(values))].map((value) => Number(value)).filter((value) => Number.isFinite(value));
	}
	function normalizeArtifactSlotIds(values, fallbackValues = [0, 1]) {
		const sourceValues = normalizeUnknownArray(values, fallbackValues);
		return [...new Set(sourceValues)].map((value) => Number(value)).filter((value) => ARTIFACT_SLOT_ID_SET.has(value));
	}
	function normalizeSkinLocaleKeys(values, allowedLocaleKeySet, fallbackValues = []) {
		const sourceValues = normalizeUnknownArray(values, fallbackValues);
		return [...new Set(sourceValues)].map((value) => String(value !== null && value !== void 0 ? value : "").trim()).filter((value) => value && allowedLocaleKeySet.has(value));
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/settings/schema.ts
	function normalizeReserve(value) {
		return Math.max(0, Math.floor(Number(value) || 0));
	}
	function getChecklistLevelingAmount(settings) {
		return normalizeCapValue(asPlainRecord(settings).checklistLevelingAmount, 1);
	}
	function createTitanSettingsSchema(deps) {
		function normalizeTitanArtifactRule(rule, settings = DEFAULT_SETTINGS) {
			const source = asPlainRecord(rule);
			const sourceLevelCaps = asPlainRecord(source.levelCaps);
			const fallbackSlotIds = normalizeArtifactSlotIds(settings.selectedArtifactSlotIds, [0, 1]);
			return {
				slotIds: normalizeArtifactSlotIds(Array.isArray(source.slotIds) ? source.slotIds : fallbackSlotIds, fallbackSlotIds),
				levelCaps: Object.fromEntries(ARTIFACT_SLOT_IDS.map((slotId) => {
					var _ref, _sourceLevelCaps$slot, _settings$artifactLev;
					return [slotId, normalizeCapValue((_ref = (_sourceLevelCaps$slot = sourceLevelCaps[slotId]) !== null && _sourceLevelCaps$slot !== void 0 ? _sourceLevelCaps$slot : sourceLevelCaps[String(slotId)]) !== null && _ref !== void 0 ? _ref : (_settings$artifactLev = settings.artifactLevelCaps) === null || _settings$artifactLev === void 0 ? void 0 : _settings$artifactLev[slotId], deps.getDefaultArtifactLevelCap(slotId))];
				}))
			};
		}
		function normalizeArtifactRules(settings = DEFAULT_SETTINGS) {
			const sourceRules = asPlainRecord(settings.artifactRules);
			return Object.fromEntries(deps.getConfigTitanIds().map((titanId) => {
				var _sourceRules$titanId;
				return [titanId, normalizeTitanArtifactRule((_sourceRules$titanId = sourceRules[titanId]) !== null && _sourceRules$titanId !== void 0 ? _sourceRules$titanId : sourceRules[String(titanId)], settings)];
			}));
		}
		function getArtifactRuleForTitan(settings, titanId) {
			var _artifactRules$normal;
			const normalizedTitanId = Number(titanId);
			const artifactRules = asPlainRecord(settings.artifactRules);
			return normalizeTitanArtifactRule((_artifactRules$normal = artifactRules[normalizedTitanId]) !== null && _artifactRules$normal !== void 0 ? _artifactRules$normal : artifactRules[String(normalizedTitanId)], settings);
		}
		function getArtifactSlotIdsForTitan(settings, titanId) {
			return getArtifactRuleForTitan(settings, titanId).slotIds;
		}
		function getArtifactLevelCapForTitan(settings, titanId, slotId) {
			var _rule$levelCaps$norma, _rule$levelCaps, _settings$artifactLev2;
			const normalizedSlotId = Number(slotId);
			return normalizeCapValue((_rule$levelCaps$norma = (_rule$levelCaps = getArtifactRuleForTitan(settings, titanId).levelCaps) === null || _rule$levelCaps === void 0 ? void 0 : _rule$levelCaps[normalizedSlotId]) !== null && _rule$levelCaps$norma !== void 0 ? _rule$levelCaps$norma : (_settings$artifactLev2 = settings.artifactLevelCaps) === null || _settings$artifactLev2 === void 0 ? void 0 : _settings$artifactLev2[normalizedSlotId], deps.getDefaultArtifactLevelCap(normalizedSlotId));
		}
		function getSelectedArtifactSlotIdsFromRules(settings, selectedTitanIds = []) {
			const slotIds = [];
			normalizeTitanIdValues(selectedTitanIds).forEach((titanId) => {
				getArtifactSlotIdsForTitan(settings, titanId).forEach((slotId) => {
					if (!slotIds.includes(slotId)) slotIds.push(slotId);
				});
			});
			return slotIds.length > 0 ? slotIds : normalizeArtifactSlotIds(settings === null || settings === void 0 ? void 0 : settings.selectedArtifactSlotIds, [0, 1]);
		}
		function normalizeTitanSkinRule(rule, settings = DEFAULT_SKIN_SETTINGS, skinGroups = deps.getTitanSkinGroups()) {
			const source = asPlainRecord(rule);
			const sourceLevelCaps = asPlainRecord(source.levelCaps);
			const allowedLocaleKeySet = new Set(skinGroups.map((group) => group.localeKey));
			const fallbackLocaleKeys = Array.isArray(settings.selectedSkinLocaleKeys) && settings.selectedSkinLocaleKeys.length > 0 ? settings.selectedSkinLocaleKeys : skinGroups.map((group) => group.localeKey);
			return {
				localeKeys: normalizeSkinLocaleKeys(Array.isArray(source.localeKeys) ? source.localeKeys : fallbackLocaleKeys, allowedLocaleKeySet, fallbackLocaleKeys),
				levelCaps: Object.fromEntries(skinGroups.map((group) => {
					var _sourceLevelCaps$grou, _settings$skinLevelCa;
					return [group.localeKey, normalizeCapValue((_sourceLevelCaps$grou = sourceLevelCaps[group.localeKey]) !== null && _sourceLevelCaps$grou !== void 0 ? _sourceLevelCaps$grou : (_settings$skinLevelCa = settings.skinLevelCaps) === null || _settings$skinLevelCa === void 0 ? void 0 : _settings$skinLevelCa[group.localeKey], deps.getDefaultTitanSkinLevelCap(group.localeKey))];
				}))
			};
		}
		function normalizeSkinRules(settings = DEFAULT_SKIN_SETTINGS) {
			const skinGroups = deps.getTitanSkinGroups();
			const sourceRules = asPlainRecord(settings.skinRules);
			return Object.fromEntries(deps.getConfigTitanIds().map((titanId) => {
				var _sourceRules$titanId2;
				return [titanId, normalizeTitanSkinRule((_sourceRules$titanId2 = sourceRules[titanId]) !== null && _sourceRules$titanId2 !== void 0 ? _sourceRules$titanId2 : sourceRules[String(titanId)], settings, skinGroups)];
			}));
		}
		function getSkinRuleForTitan(settings, titanId) {
			var _skinRules$normalized;
			const normalizedTitanId = Number(titanId);
			const skinRules = asPlainRecord(settings.skinRules);
			return normalizeTitanSkinRule((_skinRules$normalized = skinRules[normalizedTitanId]) !== null && _skinRules$normalized !== void 0 ? _skinRules$normalized : skinRules[String(normalizedTitanId)], settings);
		}
		function getSkinLevelCapForTitan(settings, titanId, localeKey) {
			var _rule$levelCaps$norma2, _rule$levelCaps2, _settings$skinLevelCa2;
			const normalizedLocaleKey = String(localeKey !== null && localeKey !== void 0 ? localeKey : "").trim();
			return normalizeCapValue((_rule$levelCaps$norma2 = (_rule$levelCaps2 = getSkinRuleForTitan(settings, titanId).levelCaps) === null || _rule$levelCaps2 === void 0 ? void 0 : _rule$levelCaps2[normalizedLocaleKey]) !== null && _rule$levelCaps$norma2 !== void 0 ? _rule$levelCaps$norma2 : (_settings$skinLevelCa2 = settings.skinLevelCaps) === null || _settings$skinLevelCa2 === void 0 ? void 0 : _settings$skinLevelCa2[normalizedLocaleKey], deps.getDefaultTitanSkinLevelCap(normalizedLocaleKey));
		}
		function getSelectedSkinLocaleKeysFromRules(settings, selectedTitanIds = []) {
			const localeKeys = [];
			normalizeTitanIdValues(selectedTitanIds).forEach((titanId) => {
				getSkinRuleForTitan(settings, titanId).localeKeys.forEach((localeKey) => {
					if (!localeKeys.includes(localeKey)) localeKeys.push(localeKey);
				});
			});
			return localeKeys.length > 0 ? localeKeys : deps.getTitanSkinGroups().map((group) => group.localeKey);
		}
		function normalizeSettings(settings) {
			var _settingsRecord$check, _ref2, _settingsRecord$titan;
			const settingsRecord = asPlainRecord(settings);
			const progressSettings = normalizeProgressWindowSettings(settingsRecord, DEFAULT_SETTINGS);
			const selectedTitanIds = normalizeTitanIdValues(settingsRecord.selectedTitanIds);
			const selectedArtifactSlotIds = normalizeArtifactSlotIds(settingsRecord.selectedArtifactSlotIds, [0, 1]).sort((left, right) => left - right);
			const artifactLevelCaps = ARTIFACT_SLOT_IDS.map((slotId) => normalizeCapValue(asPlainRecord(settingsRecord.artifactLevelCaps)[slotId], deps.getDefaultArtifactLevelCap(slotId)));
			const normalizedSelectedArtifactSlotIds = selectedArtifactSlotIds.length > 0 ? selectedArtifactSlotIds : [0, 1];
			const artifactRules = normalizeArtifactRules({
				...DEFAULT_SETTINGS,
				...settingsRecord,
				selectedArtifactSlotIds: normalizedSelectedArtifactSlotIds,
				artifactLevelCaps
			});
			return {
				selectedTitanIds,
				selectedArtifactSlotIds: normalizedSelectedArtifactSlotIds,
				levelingMode: normalizeLevelingMode(settingsRecord.levelingMode),
				upgradeMode: normalizeUpgradeMode(settingsRecord.upgradeMode, DEFAULT_SETTINGS.upgradeMode),
				checklistAmountBehavior: normalizeChecklistAmountBehavior(settingsRecord.checklistAmountBehavior),
				checklistLevelingAmount: getChecklistLevelingAmount(settings),
				checklistFragmentPurchaseBehavior: normalizeChecklistFragmentPurchaseBehavior((_settingsRecord$check = settingsRecord.checklistFragmentPurchaseBehavior) !== null && _settingsRecord$check !== void 0 ? _settingsRecord$check : CHECKLIST_FRAGMENT_BEHAVIOR_USE_SETTINGS),
				essenceReserve: normalizeReserve(settingsRecord.essenceReserve),
				artifactGoldReserve: normalizeReserve(settingsRecord.artifactGoldReserve),
				artifactFragmentCoinReserve: normalizeReserve(settingsRecord.artifactFragmentCoinReserve),
				evolveArtifacts: !!settingsRecord.evolveArtifacts,
				buyArtifactFragments: !!settingsRecord.buyArtifactFragments,
				selectedArtifactEvolutionKeys: normalizeTitanArtifactKeys(settingsRecord.selectedArtifactEvolutionKeys),
				selectedArtifactFragmentBuyKeys: normalizeTitanArtifactKeys(settingsRecord.selectedArtifactFragmentBuyKeys, [0, 1]),
				artifactEvolutionMaxStar: normalizeCapValue(settingsRecord.artifactEvolutionMaxStar, deps.getMaxKnownTitanArtifactStar()),
				showFullCosts: !!settingsRecord.showFullCosts,
				syncAfterRun: !!settingsRecord.syncAfterRun,
				uiTheme: normalizeUiTheme(settingsRecord.uiTheme),
				uiTooltipsEnabled: settingsRecord.uiTooltipsEnabled !== false,
				...progressSettings,
				accordionAutoScrollMode: normalizeAccordionAutoScrollMode(settingsRecord.accordionAutoScrollMode, DEFAULT_SETTINGS.accordionAutoScrollMode),
				reorderListVariant: normalizeReorderListVariant(settingsRecord.reorderListVariant, DEFAULT_SETTINGS.reorderListVariant),
				titanTrainerButtonPlacement: normalizeTitanTrainerButtonPlacement((_ref2 = (_settingsRecord$titan = settingsRecord.titanTrainerButtonPlacement) !== null && _settingsRecord$titan !== void 0 ? _settingsRecord$titan : deps.getTitanTrainerButtonPlacementFallback()) !== null && _ref2 !== void 0 ? _ref2 : TITAN_TRAINER_BUTTON_PLACEMENT_MAIN),
				hotkeys: normalizeHotkeyMap(settingsRecord.hotkeys, DEFAULT_SETTINGS.hotkeys),
				artifactLevelCaps,
				artifactRules
			};
		}
		function normalizeLevelSettings(settings) {
			const settingsRecord = asPlainRecord(settings);
			const selectedTitanIds = normalizeTitanIdValues(settingsRecord.selectedTitanIds);
			const sourceLevelCaps = asPlainRecord(settingsRecord.titanLevelCaps);
			const legacyLevelCap = normalizeCapValue(settingsRecord.maxTitanLevel, deps.getMaxTitanLevel());
			const titanLevelCaps = Object.fromEntries(deps.getConfigTitanIds().map((titanId) => {
				var _sourceLevelCaps$tita;
				return [titanId, normalizeCapValue((_sourceLevelCaps$tita = sourceLevelCaps[titanId]) !== null && _sourceLevelCaps$tita !== void 0 ? _sourceLevelCaps$tita : sourceLevelCaps[String(titanId)], legacyLevelCap)];
			}));
			return {
				selectedTitanIds,
				levelingMode: normalizeLevelingMode(settingsRecord.levelingMode),
				upgradeMode: normalizeUpgradeMode(settingsRecord.upgradeMode, DEFAULT_LEVEL_SETTINGS.upgradeMode),
				checklistAmountBehavior: normalizeChecklistAmountBehavior(settingsRecord.checklistAmountBehavior),
				checklistLevelingAmount: getChecklistLevelingAmount(settings),
				potionReserve: normalizeReserve(settingsRecord.potionReserve),
				buyXpPotions: !!settingsRecord.buyXpPotions,
				xpPotionCoinReserve: normalizeReserve(settingsRecord.xpPotionCoinReserve),
				showNextCosts: !!settingsRecord.showNextCosts,
				showEvolutionProgress: settingsRecord.showEvolutionProgress !== false,
				syncAfterRun: !!settingsRecord.syncAfterRun,
				titanLevelCaps,
				selectedTitanEvolutionIds: [...new Set(Array.isArray(settingsRecord.selectedTitanEvolutionIds) ? settingsRecord.selectedTitanEvolutionIds : [])].map((value) => Number(value)).filter((value) => Number.isFinite(value)),
				titanEvolutionMaxStar: normalizeCapValue(settingsRecord.titanEvolutionMaxStar, deps.getMaxTitanEvolutionStar())
			};
		}
		function getTitanLevelCapForTitan(settings, titanId) {
			var _ref3, _levelCaps$normalized;
			const normalizedTitanId = Number(titanId);
			const levelCaps = asPlainRecord(settings.titanLevelCaps);
			return normalizeCapValue((_ref3 = (_levelCaps$normalized = levelCaps[normalizedTitanId]) !== null && _levelCaps$normalized !== void 0 ? _levelCaps$normalized : levelCaps[String(normalizedTitanId)]) !== null && _ref3 !== void 0 ? _ref3 : settings.maxTitanLevel, deps.getMaxTitanLevel());
		}
		function normalizeSkinSettings(settings) {
			const settingsRecord = asPlainRecord(settings);
			const selectedTitanIds = normalizeTitanIdValues(settingsRecord.selectedTitanIds);
			const skinGroups = deps.getTitanSkinGroups();
			const allowedLocaleKeySet = new Set(skinGroups.map((group) => group.localeKey));
			const selectedSkinLocaleKeys = normalizeSkinLocaleKeys(settingsRecord.selectedSkinLocaleKeys, allowedLocaleKeySet);
			const defaultSelectedSkinLocaleKeys = selectedSkinLocaleKeys.length > 0 ? selectedSkinLocaleKeys : skinGroups.map((group) => group.localeKey);
			const skinLevelCaps = Object.fromEntries(skinGroups.map((group) => [group.localeKey, normalizeCapValue(asPlainRecord(settingsRecord.skinLevelCaps)[group.localeKey], deps.getDefaultTitanSkinLevelCap(group.localeKey))]));
			const skinRules = normalizeSkinRules({
				...DEFAULT_SKIN_SETTINGS,
				...settingsRecord,
				selectedSkinLocaleKeys: defaultSelectedSkinLocaleKeys,
				skinLevelCaps
			});
			return {
				selectedTitanIds,
				selectedSkinLocaleKeys: defaultSelectedSkinLocaleKeys,
				levelingMode: normalizeLevelingMode(settingsRecord.levelingMode),
				upgradeMode: normalizeUpgradeMode(settingsRecord.upgradeMode, DEFAULT_SKIN_SETTINGS.upgradeMode),
				checklistAmountBehavior: normalizeChecklistAmountBehavior(settingsRecord.checklistAmountBehavior),
				checklistLevelingAmount: getChecklistLevelingAmount(settings),
				skinStoneReserve: normalizeReserve(settingsRecord.skinStoneReserve),
				showNextCosts: !!settingsRecord.showNextCosts,
				syncAfterRun: !!settingsRecord.syncAfterRun,
				skinLevelCaps,
				skinRules
			};
		}
		return {
			getArtifactLevelCapForTitan,
			getArtifactRuleForTitan,
			getArtifactSlotIdsForTitan,
			getChecklistLevelingAmount,
			getSelectedArtifactSlotIdsFromRules,
			getSelectedSkinLocaleKeysFromRules,
			getSkinLevelCapForTitan,
			getSkinRuleForTitan,
			getTitanLevelCapForTitan,
			normalizeArtifactRules,
			normalizeLevelSettings,
			normalizeSettings,
			normalizeSkinRules,
			normalizeSkinSettings,
			normalizeTitanArtifactRule,
			normalizeTitanSkinRule
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/settings/button-placement.ts
	var warnButtonPlacementStorageError = (message, error) => {
		console.warn(message, error);
	};
	function getDefaultStorage() {
		return getBrowserLocalStorage();
	}
	function readStoredTitanTrainerButtonPlacementSync({ storage = getDefaultStorage(), warn = warnButtonPlacementStorageError } = {}) {
		try {
			return normalizeTitanTrainerButtonPlacement(parseJsonValue(storage === null || storage === void 0 ? void 0 : storage.getItem(TITAN_TRAINER_BUTTON_PLACEMENT_STORAGE_KEY), TITAN_TRAINER_BUTTON_PLACEMENT_MAIN));
		} catch (error) {
			warn("[TitanTrainer] button placement read failed", error);
			return TITAN_TRAINER_BUTTON_PLACEMENT_MAIN;
		}
	}
	function persistTitanTrainerButtonPlacementSync(placement, { storage = getDefaultStorage(), warn = warnButtonPlacementStorageError } = {}) {
		try {
			storage === null || storage === void 0 || storage.setItem("hwhtitantrainer_button_placement", JSON.stringify(normalizeTitanTrainerButtonPlacement(placement)));
		} catch (error) {
			warn("[TitanTrainer] button placement write failed", error);
		}
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/runtime/snapshot.ts
	var TITAN_INVENTORY_RECORD_KEYS = [
		"coin",
		"consumable",
		"fragmentTitan",
		"fragmentTitanArtifact"
	];
	var TITAN_SNAPSHOT_CALLS = {
		titans: {
			name: "titanGetAll",
			args: {},
			ident: "titanGetAll"
		},
		inventory: {
			name: "inventoryGet",
			args: {},
			ident: "inventoryGet"
		},
		userInfo: {
			name: "userGetInfo",
			args: {},
			ident: "userGetInfo"
		}
	};
	function getCallResponseRecord$1(results, index) {
		var _nestedResult$respons;
		const callResult = results[index];
		return asPlainRecord((_nestedResult$respons = asPlainRecord(callResult === null || callResult === void 0 ? void 0 : callResult.result).response) !== null && _nestedResult$respons !== void 0 ? _nestedResult$respons : callResult === null || callResult === void 0 ? void 0 : callResult.response);
	}
	function normalizeTitanInventory(value) {
		const inventory = {};
		Object.entries(asPlainRecord(value)).forEach(([key, entryValue]) => {
			inventory[key] = TITAN_INVENTORY_RECORD_KEYS.includes(key) ? asPlainRecord(entryValue) : entryValue;
		});
		return inventory;
	}
	function buildTitanSnapshotCalls(includeInventory = true, includeUserInfo = false) {
		const calls = [TITAN_SNAPSHOT_CALLS.titans];
		if (includeInventory) calls.push(TITAN_SNAPSHOT_CALLS.inventory);
		if (includeUserInfo) calls.push(TITAN_SNAPSHOT_CALLS.userInfo);
		return calls;
	}
	function normalizeTitanSnapshotResponse(results, includeInventory = true, includeUserInfo = false) {
		const resultList = Array.isArray(results) ? results : [];
		let resultIndex = 0;
		return {
			titans: getCallResponseRecord$1(resultList, resultIndex++),
			inventory: includeInventory ? normalizeTitanInventory(getCallResponseRecord$1(resultList, resultIndex++)) : {},
			userInfo: includeUserInfo ? asPlainRecord(getCallResponseRecord$1(resultList, resultIndex)) : {}
		};
	}
	async function fetchTitanSnapshot(sendCalls, includeInventory = true, includeUserInfo = false) {
		return normalizeTitanSnapshotResponse(await sendCalls(buildTitanSnapshotCalls(includeInventory, includeUserInfo)), includeInventory, includeUserInfo);
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/runtime/transport.ts
	function getPlainRecord(value) {
		return isPlainObject(value) ? value : {};
	}
	function getRecordValue(record, key) {
		return getPlainRecord(record)[String(key)];
	}
	function getRecordEntry(record, key) {
		return getPlainRecord(getRecordValue(record, key));
	}
	function getCollectionEntry(collection, key) {
		return getPlainRecord(getCollectionValue(collection, key));
	}
	function getGameDataRecord(section) {
		var _globalThis$lib;
		return getPlainRecord(getPlainRecord((_globalThis$lib = globalThis.lib) === null || _globalThis$lib === void 0 ? void 0 : _globalThis$lib.data)[section]);
	}
	function normalizeCallResult(value) {
		return isPlainObject(value) ? value : { response: value };
	}
	function normalizeTransportError(value) {
		if (!value) return null;
		if (isPlainObject(value)) return value;
		return { message: String(value) };
	}
	function normalizeTitanTransportResponse(value) {
		const responseRecord = getPlainRecord(value);
		return {
			error: normalizeTransportError(responseRecord.error),
			results: Array.isArray(responseRecord.results) ? responseRecord.results.map(normalizeCallResult) : void 0
		};
	}
	function getCallResponseRecord(results, index) {
		var _nestedResult$respons;
		const callResult = results[index];
		return getPlainRecord((_nestedResult$respons = getPlainRecord(callResult === null || callResult === void 0 ? void 0 : callResult.result).response) !== null && _nestedResult$respons !== void 0 ? _nestedResult$respons : callResult === null || callResult === void 0 ? void 0 : callResult.response);
	}
	function createTitanCallSender([getSend, translate]) {
		return async function sendCalls(calls) {
			const send = getSend();
			if (typeof send !== "function") throw new Error(String(translate("HWHTITANART_RUNTIME_WAIT_ERROR")));
			return sendCallsWithTransport({
				calls: [...calls],
				transport: async (mappedCalls) => normalizeTitanTransportResponse(await send({ calls: mappedCalls })),
				normalizeResults: (response) => {
					var _response$results;
					return (_response$results = response.results) !== null && _response$results !== void 0 ? _response$results : [];
				},
				fallbackErrorMessage: String(translate("HWHTITANART_ERROR_GENERIC"))
			});
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/domain/dyb-placement.ts
	var DO_YOUR_BEST_NORMALIZE_OPTIONS = { allowStart: true };
	function normalizeDoYourBestPlacementMap(value) {
		const stringPlacement = typeof value === "string" ? normalizeDoYourBestPlacement(value, DO_YOUR_BEST_NORMALIZE_OPTIONS) : void 0;
		const source = isPlainObject(value) ? value : {};
		return Object.fromEntries(getTitanDoYourBestModuleDefinitions().map((definition) => {
			var _ref, _ref2, _source$definition$ke;
			return [definition.key, normalizeDoYourBestPlacement((_ref = (_ref2 = (_source$definition$ke = source[definition.key]) !== null && _source$definition$ke !== void 0 ? _source$definition$ke : source[definition.taskName]) !== null && _ref2 !== void 0 ? _ref2 : stringPlacement) !== null && _ref !== void 0 ? _ref : "end", DO_YOUR_BEST_NORMALIZE_OPTIONS)];
		}));
	}
	function getTitanDoYourBestTaskNameSet() {
		return /* @__PURE__ */ new Set([
			DO_YOUR_BEST_TITAN_LEVEL_TASK_NAME,
			DO_YOUR_BEST_TITAN_ARTIFACT_TASK_NAME,
			DO_YOUR_BEST_TITAN_SKIN_TASK_NAME
		]);
	}
	function isTitanDoYourBestTask(task) {
		return getTitanDoYourBestTaskNameSet().has(getDoYourBestTaskName(task));
	}
	function buildTitanDoYourBestTaskDefinitions({ handlers, translate }) {
		return getTitanDoYourBestModuleDefinitions().map((definition) => {
			const handler = handlers[definition.key];
			if (typeof handler !== "function") throw new Error(`Missing Titan DoYourBest handler for ${definition.key}`);
			return {
				moduleKey: definition.key,
				name: definition.taskName,
				label: translate(definition.labelKey),
				handler
			};
		});
	}
	function isDoYourBestTaskObject(task) {
		return Boolean(task) && typeof task === "object" && !Array.isArray(task);
	}
	function buildTitanDoYourBestRegistrationState({ currentFunctions = {}, currentTaskList, readPlacement, taskDefinitions }) {
		const currentTasks = currentTaskList.filter(isDoYourBestTaskObject);
		const existingTaskByName = new Map(currentTasks.filter(isTitanDoYourBestTask).map((task) => [getDoYourBestTaskName(task), task]));
		const baseTaskList = currentTasks.filter((task) => !isTitanDoYourBestTask(task));
		taskDefinitions.forEach((taskDefinition) => {
			var _existingTaskByName$g;
			const placement = readPlacement(taskDefinition.moduleKey);
			if (placement === "none") return;
			const checklistTask = {
				name: taskDefinition.name,
				label: taskDefinition.label,
				checked: !!((_existingTaskByName$g = existingTaskByName.get(taskDefinition.name)) === null || _existingTaskByName$g === void 0 ? void 0 : _existingTaskByName$g.checked)
			};
			let insertionIndex = getDoYourBestInsertionIndex(baseTaskList, placement, { allowStart: true });
			if (String(placement).startsWith("after:")) while (insertionIndex < baseTaskList.length && isTitanDoYourBestTask(baseTaskList[insertionIndex])) insertionIndex += 1;
			baseTaskList.splice(insertionIndex, 0, checklistTask);
		});
		const currentTaskOrder = currentTasks.map(getDoYourBestTaskName).join("");
		const nextTaskOrder = baseTaskList.map(getDoYourBestTaskName).join("");
		const hasAllHandlers = taskDefinitions.every((taskDefinition) => typeof currentFunctions[taskDefinition.name] === "function");
		const functions = {
			...currentFunctions,
			...Object.fromEntries(taskDefinitions.map((taskDefinition) => [taskDefinition.name, taskDefinition.handler]))
		};
		return {
			changed: currentTaskOrder !== nextTaskOrder || !hasAllHandlers,
			functions,
			taskList: baseTaskList
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/domain/artifact-evolution-plan.ts
	function getArtifactFragmentShopSlots(shopData, getArtifactName) {
		return Object.entries(asPlainRecord(asPlainRecord(shopData).slots)).map(([slotKey, slotData]) => {
			var _rewardEntries$;
			const slotRecord = asPlainRecord(slotData);
			const rewardRecord = asPlainRecord(slotRecord.reward);
			const costRecord = asPlainRecord(slotRecord.cost);
			const [artifactIdText, fragmentAmount] = (_rewardEntries$ = Object.entries(asPlainRecord(rewardRecord.fragmentTitanArtifact))[0]) !== null && _rewardEntries$ !== void 0 ? _rewardEntries$ : [];
			const artifactId = Number(artifactIdText);
			const coinCost = Math.max(0, Number(asPlainRecord(costRecord.coin)[String(18)]) || 0);
			const rawAmountAvailable = Number(slotRecord.amountAvailable);
			const amountAvailable = Number.isFinite(rawAmountAvailable) && rawAmountAvailable > 0 ? Math.floor(rawAmountAvailable) : Number.POSITIVE_INFINITY;
			if (!Number.isFinite(artifactId) || artifactId <= 0 || Math.max(0, Number(fragmentAmount) || 0) <= 0 || coinCost <= 0) return null;
			return {
				shopId: 13,
				slotId: Number(slotKey),
				artifactId,
				artifactName: getArtifactName(artifactId),
				fragmentAmount: Math.max(0, Number(fragmentAmount) || 0),
				coinCost,
				reward: clonePlainObject(slotRecord.reward),
				cost: clonePlainObject(slotRecord.cost),
				bought: !!slotRecord.bought,
				rawAmountAvailable: slotRecord.amountAvailable,
				amountAvailable
			};
		}).filter((slot) => Boolean(slot));
	}
	function summarizeArtifactFragmentShopSlot(slot) {
		if (!slot) return null;
		return {
			shopId: slot.shopId,
			slotId: slot.slotId,
			artifactId: slot.artifactId,
			artifactName: slot.artifactName,
			fragmentAmount: slot.fragmentAmount,
			coinCost: slot.coinCost,
			bought: !!slot.bought,
			rawAmountAvailable: slot.rawAmountAvailable,
			amountAvailable: Number.isFinite(Number(slot.amountAvailable)) ? slot.amountAvailable : "unlimited"
		};
	}
	function summarizeArtifactFragmentPurchase(purchaseStep) {
		if (!purchaseStep) return null;
		return {
			shopId: purchaseStep.shopId,
			slotId: purchaseStep.slotId,
			artifactId: purchaseStep.artifactId,
			artifactName: purchaseStep.artifactName,
			amount: purchaseStep.amount,
			purchaseCount: purchaseStep.purchaseCount,
			fragmentAmount: purchaseStep.fragmentAmount,
			coinCost: purchaseStep.coinCost,
			coinSpentAmount: purchaseStep.coinSpentAmount,
			missingFragments: purchaseStep.missingFragments
		};
	}
	function appendArtifactFragmentPurchaseSummaryEntry(summaryMap, purchaseStep) {
		const summaryKey = String(purchaseStep.artifactId);
		if (!summaryMap.has(summaryKey)) summaryMap.set(summaryKey, {
			artifactName: purchaseStep.artifactName,
			amount: 0,
			coinSpentAmount: 0
		});
		const summaryEntry = summaryMap.get(summaryKey);
		if (!summaryEntry) return;
		summaryEntry.amount += purchaseStep.amount;
		summaryEntry.coinSpentAmount += Number(purchaseStep.coinSpentAmount) || purchaseStep.coinCost * (purchaseStep.purchaseCount || purchaseStep.amount);
	}
	function appendArtifactEvolutionSummaryEntry(summaryMap, evolutionStep) {
		const summaryKey = `${evolutionStep.titanId}:${evolutionStep.slotId}`;
		if (!summaryMap.has(summaryKey)) summaryMap.set(summaryKey, {
			titanName: evolutionStep.titanName,
			artifactLabel: evolutionStep.artifactLabel,
			startStar: evolutionStep.fromStar,
			endStar: evolutionStep.toStar,
			count: 0
		});
		const summaryEntry = summaryMap.get(summaryKey);
		if (!summaryEntry) return;
		summaryEntry.endStar = evolutionStep.toStar;
		summaryEntry.count += 1;
	}
	function getArtifactEvolutionPlanScore(planOption) {
		return planOption.evolutions.length * 1e3 + planOption.fragmentTargetCount;
	}
	function isBetterArtifactEvolutionPlan(leftPlan, rightPlan) {
		var _leftPlan$fragmentPur, _leftPlan$fragmentPur2, _rightPlan$fragmentPu, _rightPlan$fragmentPu2;
		if (!rightPlan) return true;
		const leftScore = getArtifactEvolutionPlanScore(leftPlan);
		const rightScore = getArtifactEvolutionPlanScore(rightPlan);
		if (leftScore !== rightScore) return leftScore > rightScore;
		const leftCoinSpent = Math.max(0, Number(leftPlan.coinSpentAmount) || 0);
		const rightCoinSpent = Math.max(0, Number(rightPlan.coinSpentAmount) || 0);
		if (leftCoinSpent !== rightCoinSpent) return leftCoinSpent < rightCoinSpent;
		const leftFragments = Math.max(0, Number(leftPlan.fragmentCost) || 0);
		const rightFragments = Math.max(0, Number(rightPlan.fragmentCost) || 0);
		if (leftFragments !== rightFragments) return leftFragments < rightFragments;
		return ((_leftPlan$fragmentPur = (_leftPlan$fragmentPur2 = leftPlan.fragmentPurchases) === null || _leftPlan$fragmentPur2 === void 0 ? void 0 : _leftPlan$fragmentPur2.length) !== null && _leftPlan$fragmentPur !== void 0 ? _leftPlan$fragmentPur : 0) < ((_rightPlan$fragmentPu = (_rightPlan$fragmentPu2 = rightPlan.fragmentPurchases) === null || _rightPlan$fragmentPu2 === void 0 ? void 0 : _rightPlan$fragmentPu2.length) !== null && _rightPlan$fragmentPu !== void 0 ? _rightPlan$fragmentPu : 0);
	}
	function buildArtifactEvolutionPlanFrontier(planOptions) {
		const sortedOptions = Array.from(planOptions);
		sortedOptions.sort((left, right) => Math.max(0, Number(left.coinSpentAmount) || 0) - Math.max(0, Number(right.coinSpentAmount) || 0));
		const result = [];
		let bestScore = -1;
		for (const planOption of sortedOptions) {
			const score = getArtifactEvolutionPlanScore(planOption);
			if (score > bestScore) {
				result.push(planOption);
				bestScore = score;
			}
		}
		return result;
	}
	function combineAndPruneArtifactEvolutionPlanOptions(leftOptions, rightOptions, combine) {
		const bestByCoin = /* @__PURE__ */ new Map();
		for (const leftOption of leftOptions) for (const rightOption of rightOptions) {
			const candidate = combine(leftOption, rightOption);
			if (!candidate) continue;
			const coinSpent = Math.max(0, Number(candidate.coinSpentAmount) || 0);
			if (isBetterArtifactEvolutionPlan(candidate, bestByCoin.get(coinSpent))) bestByCoin.set(coinSpent, candidate);
		}
		return buildArtifactEvolutionPlanFrontier(bestByCoin.values());
	}
	function compareArtifactFragmentFallbackPurchases(left, right) {
		return (Number(left.missingFragments) || 0) - (Number(right.missingFragments) || 0) || left.coinCost - right.coinCost || compareRussianText(left.artifactName, right.artifactName);
	}
	function buildArtifactEvolutionGroupOptions({ artifactId, artifactName, chains, inventory, shopSlot, buyMissingFragments, debugEntries = void 0 }, [getTitanArtifactFragmentAmount]) {
		var _chains$length;
		let fragmentOptions = [{
			fragmentCost: 0,
			fragmentTargetCount: 0,
			evolutions: []
		}];
		chains.forEach((chain) => {
			const chainOptions = [{
				fragmentCost: 0,
				fragmentTargetCount: 0,
				evolutions: []
			}];
			let prefixFragmentCost = 0;
			const prefixEvolutions = [];
			chain.evolutionSteps.forEach((evolutionStep) => {
				prefixFragmentCost += evolutionStep.fragmentCost;
				prefixEvolutions.push(evolutionStep);
				chainOptions.push({
					fragmentCost: prefixFragmentCost,
					fragmentTargetCount: 0,
					evolutions: prefixEvolutions.slice()
				});
			});
			if (chain.evolutionSteps.length <= 0 && chain.nextStarFragmentCost > 0) chainOptions.push({
				fragmentCost: chain.nextStarFragmentCost,
				fragmentTargetCount: 1,
				evolutions: []
			});
			fragmentOptions = combineAndPruneArtifactEvolutionPlanOptions(fragmentOptions, chainOptions, (baseOption, chainOption) => {
				return {
					coinSpentAmount: baseOption.fragmentCost + chainOption.fragmentCost,
					fragmentCost: baseOption.fragmentCost + chainOption.fragmentCost,
					fragmentTargetCount: baseOption.fragmentTargetCount + chainOption.fragmentTargetCount,
					evolutions: [...baseOption.evolutions, ...chainOption.evolutions]
				};
			});
		});
		const availableFragments = getTitanArtifactFragmentAmount(inventory, artifactId);
		const canBuyFragments = chains.some((chain) => chain.canBuyFragments);
		debugEntries === null || debugEntries === void 0 || debugEntries.push({
			stage: "group:init",
			artifactId,
			artifactName,
			availableFragments,
			canBuyFragments,
			buyMissingFragments: !!buyMissingFragments,
			shopSlot: summarizeArtifactFragmentShopSlot(shopSlot),
			chainCount: (_chains$length = chains === null || chains === void 0 ? void 0 : chains.length) !== null && _chains$length !== void 0 ? _chains$length : 0,
			optionCount: fragmentOptions.length
		});
		return fragmentOptions.map((fragmentOption) => {
			const missingFragments = Math.max(0, fragmentOption.fragmentCost - availableFragments);
			if (missingFragments <= 0) {
				debugEntries === null || debugEntries === void 0 || debugEntries.push({
					stage: "purchase:covered",
					artifactId,
					artifactName,
					fragmentCost: fragmentOption.fragmentCost,
					availableFragments
				});
				return {
					...fragmentOption,
					coinSpentAmount: 0,
					fragmentPurchases: []
				};
			}
			const rejectionReasons = [];
			if (!buyMissingFragments) rejectionReasons.push("setting-disabled");
			if (!canBuyFragments) rejectionReasons.push("artifact-not-selected-for-fragment-buy");
			if (!shopSlot) rejectionReasons.push("shop-slot-not-found");
			if (shopSlot && shopSlot.coinCost <= 0) rejectionReasons.push("shop-slot-without-coin-cost");
			if (rejectionReasons.length > 0) {
				debugEntries === null || debugEntries === void 0 || debugEntries.push({
					stage: "purchase:rejected",
					artifactId,
					artifactName,
					fragmentCost: fragmentOption.fragmentCost,
					availableFragments,
					missingFragments,
					reasons: rejectionReasons,
					shopSlot: summarizeArtifactFragmentShopSlot(shopSlot)
				});
				return null;
			}
			if (!shopSlot) return null;
			const targetFragmentAmount = Math.max(10, missingFragments);
			const fragmentsPerPurchase = Math.max(1, Math.floor(Number(shopSlot.fragmentAmount) || 0));
			const purchaseCount = Math.ceil(targetFragmentAmount / fragmentsPerPurchase);
			if (purchaseCount > shopSlot.amountAvailable) {
				debugEntries === null || debugEntries === void 0 || debugEntries.push({
					stage: "purchase:rejected",
					artifactId,
					artifactName,
					fragmentCost: fragmentOption.fragmentCost,
					availableFragments,
					missingFragments,
					targetFragmentAmount,
					fragmentsPerPurchase,
					purchaseCount,
					amountAvailable: shopSlot.amountAvailable,
					reasons: ["not-enough-shop-amount"],
					shopSlot: summarizeArtifactFragmentShopSlot(shopSlot)
				});
				return null;
			}
			const purchasedFragmentAmount = purchaseCount * fragmentsPerPurchase;
			debugEntries === null || debugEntries === void 0 || debugEntries.push({
				stage: "purchase:planned",
				artifactId,
				artifactName,
				fragmentCost: fragmentOption.fragmentCost,
				availableFragments,
				missingFragments,
				targetFragmentAmount,
				fragmentsPerPurchase,
				purchaseCount,
				purchasedFragmentAmount,
				coinSpentAmount: purchaseCount * shopSlot.coinCost,
				shopSlot: summarizeArtifactFragmentShopSlot(shopSlot)
			});
			return {
				...fragmentOption,
				coinSpentAmount: purchaseCount * shopSlot.coinCost,
				fragmentPurchases: purchaseCount > 0 ? [{
					...shopSlot,
					artifactId,
					artifactName,
					amount: purchasedFragmentAmount,
					purchaseCount,
					coinSpentAmount: purchaseCount * shopSlot.coinCost
				}] : []
			};
		}).filter((option) => Boolean(option));
	}
	function createArtifactEvolutionPlanningContext(input, getArtifactName) {
		const fragmentShopSlots = getArtifactFragmentShopSlots(input.shopData, getArtifactName);
		const shopSlotByArtifactId = /* @__PURE__ */ new Map();
		for (const slot of fragmentShopSlots) if (!slot.bought) shopSlotByArtifactId.set(slot.artifactId, slot);
		const totalCoinAmount = Math.max(0, Number(input.coinAmount) || 0);
		const coinReserveAmount = Math.max(0, Number(input.coinReserveAmount) || 0);
		return {
			fragmentShopSlots,
			shopSlotByArtifactId,
			evolutionKeySet: new Set(normalizeTitanArtifactKeys(input.selectedArtifactEvolutionKeys)),
			buyKeySet: new Set(normalizeTitanArtifactKeys(input.selectedArtifactFragmentBuyKeys, [0, 1])),
			maxArtifactStar: Math.max(0, Number(input.maxArtifactStar) || 0),
			totalCoinAmount,
			coinReserveAmount,
			coinBudget: Math.max(0, totalCoinAmount - coinReserveAmount)
		};
	}
	function logArtifactEvolutionPlanStart(input, context) {
		var _input$debugEntries, _input$selectedTitanI;
		(_input$debugEntries = input.debugEntries) === null || _input$debugEntries === void 0 || _input$debugEntries.push({
			stage: "plan:start",
			buyMissingFragments: !!input.buyMissingFragments,
			selectedTitanIds: [...(_input$selectedTitanI = input.selectedTitanIds) !== null && _input$selectedTitanI !== void 0 ? _input$selectedTitanI : []],
			selectedArtifactEvolutionKeys: [...context.evolutionKeySet],
			selectedArtifactFragmentBuyKeys: [...context.buyKeySet],
			coinAmount: context.totalCoinAmount,
			coinReserveAmount: context.coinReserveAmount,
			coinBudget: context.coinBudget,
			shopSlots: context.fragmentShopSlots.map((slot) => summarizeArtifactFragmentShopSlot(slot))
		});
	}
	function collectArtifactEvolutionGroups(input, context, dependencies) {
		var _input$selectedTitanI2;
		const [getArtifactName, getTitanName, getArtifactSlotLabel, getTitanArtifactStates, getTitanArtifactConfig, getMaxTitanArtifactStar, getTitanArtifactEvolutionSteps] = dependencies;
		const ownedTitanRecord = asPlainRecord(input.ownedTitans);
		const groupByArtifactId = /* @__PURE__ */ new Map();
		for (const titanId of (_input$selectedTitanI2 = input.selectedTitanIds) !== null && _input$selectedTitanI2 !== void 0 ? _input$selectedTitanI2 : []) {
			const titanData = ownedTitanRecord[String(titanId)];
			if (!titanData) {
				var _input$debugEntries2;
				(_input$debugEntries2 = input.debugEntries) === null || _input$debugEntries2 === void 0 || _input$debugEntries2.push({
					stage: "target:skipped",
					reason: "titan-not-owned",
					titanId
				});
				continue;
			}
			const titanName = getTitanName(titanId);
			const artifactStates = getTitanArtifactStates(titanData);
			for (const slotId of ARTIFACT_SLOT_IDS) {
				var _artifactStates$slotI, _input$debugEntries5;
				const artifactKey = buildTitanArtifactKey(titanId, slotId);
				const shouldEvolveArtifact = context.evolutionKeySet.has(artifactKey);
				const shouldBuyArtifactFragments = context.buyKeySet.has(artifactKey);
				if (!shouldEvolveArtifact && !shouldBuyArtifactFragments) continue;
				const artifactConfig = getTitanArtifactConfig(titanId, slotId);
				const artifactId = Math.max(0, Number(artifactConfig === null || artifactConfig === void 0 ? void 0 : artifactConfig.artifactId) || 0);
				if (!artifactConfig || artifactId <= 0) {
					var _input$debugEntries3;
					(_input$debugEntries3 = input.debugEntries) === null || _input$debugEntries3 === void 0 || _input$debugEntries3.push({
						stage: "target:skipped",
						reason: "artifact-config-not-found",
						titanId,
						titanName,
						slotId,
						artifactKey,
						shouldEvolveArtifact,
						shouldBuyArtifactFragments
					});
					continue;
				}
				const artifactName = getArtifactName(artifactId);
				const artifactState = (_artifactStates$slotI = artifactStates[slotId]) !== null && _artifactStates$slotI !== void 0 ? _artifactStates$slotI : { star: 0 };
				const currentStar = Math.max(0, Number(artifactState.star) || 0);
				const maxStar = getMaxTitanArtifactStar(titanId, slotId);
				const targetStar = context.maxArtifactStar > 0 ? Math.min(context.maxArtifactStar, maxStar) : maxStar;
				const evolutionSteps = getTitanArtifactEvolutionSteps(titanId, slotId, currentStar, targetStar);
				if (evolutionSteps.length <= 0) {
					var _input$debugEntries4;
					(_input$debugEntries4 = input.debugEntries) === null || _input$debugEntries4 === void 0 || _input$debugEntries4.push({
						stage: "target:skipped",
						reason: "no-evolution-steps",
						titanId,
						titanName,
						slotId,
						artifactKey,
						artifactId,
						artifactName,
						currentStar,
						targetStar,
						shouldEvolveArtifact,
						shouldBuyArtifactFragments
					});
					continue;
				}
				let group = groupByArtifactId.get(artifactId);
				if (!group) {
					group = {
						artifactId,
						artifactName,
						chains: []
					};
					groupByArtifactId.set(artifactId, group);
				}
				const chainEvolutionSteps = [];
				if (shouldEvolveArtifact) {
					let plannedStar = currentStar;
					for (const evolutionStep of evolutionSteps) {
						chainEvolutionSteps.push({
							titanId,
							titanName,
							slotId,
							artifactId,
							artifactLabel: getArtifactSlotLabel(slotId),
							artifactName,
							fromStar: plannedStar,
							toStar: evolutionStep.star,
							fragmentCost: evolutionStep.fragmentCost
						});
						plannedStar = evolutionStep.star;
					}
				}
				const nextEvolutionStep = evolutionSteps[0];
				if (!nextEvolutionStep) continue;
				group.chains.push({
					titanId,
					slotId,
					canBuyFragments: shouldBuyArtifactFragments,
					nextStarFragmentCost: !shouldEvolveArtifact && shouldBuyArtifactFragments ? nextEvolutionStep.fragmentCost : 0,
					evolutionSteps: chainEvolutionSteps
				});
				(_input$debugEntries5 = input.debugEntries) === null || _input$debugEntries5 === void 0 || _input$debugEntries5.push({
					stage: "target:registered",
					titanId,
					titanName,
					slotId,
					artifactKey,
					artifactId,
					artifactName,
					currentStar,
					targetStar,
					nextStarFragmentCost: nextEvolutionStep.fragmentCost,
					evolutionStepCount: chainEvolutionSteps.length,
					shouldEvolveArtifact,
					shouldBuyArtifactFragments,
					shopSlot: summarizeArtifactFragmentShopSlot(context.shopSlotByArtifactId.get(artifactId))
				});
			}
		}
		return groupByArtifactId;
	}
	function createEmptyArtifactEvolutionPlanOption() {
		return {
			coinSpentAmount: 0,
			fragmentCost: 0,
			fragmentTargetCount: 0,
			fragmentPurchases: [],
			evolutions: []
		};
	}
	function selectBestArtifactEvolutionPlan(input, context, groupByArtifactId, getTitanArtifactFragmentAmount) {
		var _plans$;
		let plans = [createEmptyArtifactEvolutionPlanOption()];
		for (const group of groupByArtifactId.values()) {
			const groupOptions = buildArtifactEvolutionGroupOptions({
				...group,
				inventory: input.inventory,
				shopSlot: context.shopSlotByArtifactId.get(group.artifactId),
				buyMissingFragments: !!input.buyMissingFragments,
				debugEntries: input.debugEntries
			}, [getTitanArtifactFragmentAmount]);
			const nextPlans = combineAndPruneArtifactEvolutionPlanOptions(plans, groupOptions, (basePlan, groupOption) => {
				const nextCoinSpent = basePlan.coinSpentAmount + groupOption.coinSpentAmount;
				if (nextCoinSpent > context.coinBudget) {
					var _input$debugEntries6;
					(_input$debugEntries6 = input.debugEntries) === null || _input$debugEntries6 === void 0 || _input$debugEntries6.push({
						stage: "plan:budget-rejected",
						artifactId: group.artifactId,
						artifactName: group.artifactName,
						baseCoinSpentAmount: basePlan.coinSpentAmount,
						groupCoinSpentAmount: groupOption.coinSpentAmount,
						nextCoinSpent,
						coinBudget: context.coinBudget,
						fragmentPurchases: groupOption.fragmentPurchases.map((purchaseStep) => summarizeArtifactFragmentPurchase(purchaseStep))
					});
					return;
				}
				return {
					coinSpentAmount: nextCoinSpent,
					fragmentCost: basePlan.fragmentCost + groupOption.fragmentCost,
					fragmentTargetCount: basePlan.fragmentTargetCount + groupOption.fragmentTargetCount,
					fragmentPurchases: basePlan.fragmentPurchases.concat(groupOption.fragmentPurchases),
					evolutions: basePlan.evolutions.concat(groupOption.evolutions)
				};
			});
			if (nextPlans.length <= 0) {
				var _input$debugEntries7;
				(_input$debugEntries7 = input.debugEntries) === null || _input$debugEntries7 === void 0 || _input$debugEntries7.push({
					stage: "plan:group-skipped",
					artifactId: group.artifactId,
					artifactName: group.artifactName,
					reason: "no-options-inside-budget",
					groupOptionCount: groupOptions.length,
					coinBudget: context.coinBudget
				});
				continue;
			}
			plans = nextPlans;
		}
		let bestPlan = (_plans$ = plans[0]) !== null && _plans$ !== void 0 ? _plans$ : createEmptyArtifactEvolutionPlanOption();
		for (let index = 1; index < plans.length; index += 1) if (isBetterArtifactEvolutionPlan(plans[index], bestPlan)) bestPlan = plans[index];
		return bestPlan;
	}
	function appendFallbackArtifactFragmentPurchase(input, context, groupByArtifactId, bestPlan, getTitanArtifactFragmentAmount) {
		var _input$debugEntries12;
		if (!input.buyMissingFragments || bestPlan.fragmentPurchases.length > 0 || context.coinBudget <= 0) return;
		let fallbackPurchase;
		for (const group of groupByArtifactId.values()) {
			const shopSlot = context.shopSlotByArtifactId.get(group.artifactId);
			if (!shopSlot || shopSlot.coinCost <= 0) {
				var _input$debugEntries8;
				(_input$debugEntries8 = input.debugEntries) === null || _input$debugEntries8 === void 0 || _input$debugEntries8.push({
					stage: "fallback:rejected",
					artifactId: group.artifactId,
					artifactName: group.artifactName,
					reason: shopSlot ? "shop-slot-without-coin-cost" : "shop-slot-not-found",
					shopSlot: summarizeArtifactFragmentShopSlot(shopSlot)
				});
				continue;
			}
			const ownedFragments = getTitanArtifactFragmentAmount(input.inventory, group.artifactId);
			let closestNeed = Number.POSITIVE_INFINITY;
			for (const chain of group.chains) {
				var _chain$evolutionSteps;
				if (!chain.canBuyFragments) continue;
				const nextFragmentCost = Number(chain.nextStarFragmentCost) || Number((_chain$evolutionSteps = chain.evolutionSteps[0]) === null || _chain$evolutionSteps === void 0 ? void 0 : _chain$evolutionSteps.fragmentCost) || 0;
				const missingFragments = Math.max(0, nextFragmentCost - ownedFragments);
				if (missingFragments > 0 && missingFragments < closestNeed) closestNeed = missingFragments;
			}
			if (!Number.isFinite(closestNeed)) {
				var _input$debugEntries9;
				(_input$debugEntries9 = input.debugEntries) === null || _input$debugEntries9 === void 0 || _input$debugEntries9.push({
					stage: "fallback:rejected",
					artifactId: group.artifactId,
					artifactName: group.artifactName,
					reason: "no-missing-fragments",
					availableFragments: ownedFragments,
					shopSlot: summarizeArtifactFragmentShopSlot(shopSlot)
				});
				continue;
			}
			const fragmentsPerPurchase = Math.max(1, Math.floor(Number(shopSlot.fragmentAmount) || 0));
			const maxAffordablePurchaseCount = Math.min(Math.floor(context.coinBudget / shopSlot.coinCost), Number.isFinite(Number(shopSlot.amountAvailable)) ? Math.max(0, Math.floor(Number(shopSlot.amountAvailable))) : Number.POSITIVE_INFINITY);
			const targetFragmentAmount = Math.max(10, closestNeed);
			const neededPurchaseCount = Math.ceil(targetFragmentAmount / fragmentsPerPurchase);
			const purchaseCount = Math.min(neededPurchaseCount, maxAffordablePurchaseCount);
			if (purchaseCount <= 0) {
				var _input$debugEntries10;
				(_input$debugEntries10 = input.debugEntries) === null || _input$debugEntries10 === void 0 || _input$debugEntries10.push({
					stage: "fallback:rejected",
					artifactId: group.artifactId,
					artifactName: group.artifactName,
					reason: "not-affordable",
					closestNeed,
					targetFragmentAmount,
					fragmentsPerPurchase,
					neededPurchaseCount,
					maxAffordablePurchaseCount,
					coinBudget: context.coinBudget,
					shopSlot: summarizeArtifactFragmentShopSlot(shopSlot)
				});
				continue;
			}
			const candidate = {
				...shopSlot,
				artifactId: group.artifactId,
				artifactName: group.artifactName,
				amount: purchaseCount * fragmentsPerPurchase,
				purchaseCount,
				coinSpentAmount: purchaseCount * shopSlot.coinCost,
				missingFragments: closestNeed
			};
			if (!fallbackPurchase || compareArtifactFragmentFallbackPurchases(candidate, fallbackPurchase) < 0) fallbackPurchase = candidate;
		}
		if (!fallbackPurchase) {
			var _input$debugEntries11;
			(_input$debugEntries11 = input.debugEntries) === null || _input$debugEntries11 === void 0 || _input$debugEntries11.push({
				stage: "fallback:empty",
				reason: "no-buyable-candidate",
				coinBudget: context.coinBudget
			});
			return;
		}
		(_input$debugEntries12 = input.debugEntries) === null || _input$debugEntries12 === void 0 || _input$debugEntries12.push({
			stage: "fallback:planned",
			purchase: summarizeArtifactFragmentPurchase(fallbackPurchase)
		});
		bestPlan.fragmentPurchases.push(fallbackPurchase);
		bestPlan.coinSpentAmount += fallbackPurchase.coinSpentAmount;
	}
	function applyArtifactEvolutionOperationLimit(bestPlan, maxOperationCount, debugEntries) {
		const normalizedMaxOperationCount = Number.isFinite(Number(maxOperationCount)) ? Math.max(0, Math.floor(Number(maxOperationCount))) : void 0;
		if (normalizedMaxOperationCount === void 0) return;
		const initialPurchaseCount = bestPlan.fragmentPurchases.length;
		const initialEvolutionCount = bestPlan.evolutions.length;
		bestPlan.fragmentPurchases = bestPlan.fragmentPurchases.slice(0, normalizedMaxOperationCount);
		const remainingOperationCount = Math.max(0, normalizedMaxOperationCount - bestPlan.fragmentPurchases.length);
		bestPlan.evolutions = bestPlan.evolutions.slice(0, remainingOperationCount);
		let coinSpentAmount = 0;
		for (const purchaseStep of bestPlan.fragmentPurchases) coinSpentAmount += Number(purchaseStep.coinSpentAmount) || 0;
		bestPlan.coinSpentAmount = coinSpentAmount;
		debugEntries === null || debugEntries === void 0 || debugEntries.push({
			stage: "plan:operation-limit",
			maxOperationCount: normalizedMaxOperationCount,
			initialPurchaseCount,
			initialEvolutionCount,
			limitedPurchaseCount: bestPlan.fragmentPurchases.length,
			limitedEvolutionCount: bestPlan.evolutions.length
		});
	}
	function finalizeArtifactEvolutionPlan(bestPlan, context, debugEntries) {
		debugEntries === null || debugEntries === void 0 || debugEntries.push({
			stage: "plan:result",
			coinSpentAmount: bestPlan.coinSpentAmount,
			fragmentPurchaseCount: bestPlan.fragmentPurchases.length,
			evolutionCount: bestPlan.evolutions.length,
			fragmentPurchases: bestPlan.fragmentPurchases.map((purchaseStep) => summarizeArtifactFragmentPurchase(purchaseStep))
		});
		const purchaseSummary = /* @__PURE__ */ new Map();
		const evolutionSummary = /* @__PURE__ */ new Map();
		for (const purchaseStep of bestPlan.fragmentPurchases) appendArtifactFragmentPurchaseSummaryEntry(purchaseSummary, purchaseStep);
		for (const evolutionStep of bestPlan.evolutions) appendArtifactEvolutionSummaryEntry(evolutionSummary, evolutionStep);
		return {
			fragmentPurchases: bestPlan.fragmentPurchases,
			evolutions: bestPlan.evolutions,
			purchaseSummary,
			evolutionSummary,
			coinSpentAmount: bestPlan.coinSpentAmount,
			coinLeftAmount: Math.max(0, context.totalCoinAmount - bestPlan.coinSpentAmount),
			coinReserveAmount: context.coinReserveAmount
		};
	}
	function createArtifactEvolutionPlanBuilder(dependencies) {
		return (input) => buildArtifactEvolutionPlan(input, dependencies);
	}
	function buildArtifactEvolutionPlan(input, dependencies) {
		const context = createArtifactEvolutionPlanningContext(input, dependencies[0]);
		logArtifactEvolutionPlanStart(input, context);
		const groupByArtifactId = collectArtifactEvolutionGroups(input, context, dependencies);
		const bestPlan = selectBestArtifactEvolutionPlan(input, context, groupByArtifactId, dependencies[7]);
		appendFallbackArtifactFragmentPurchase(input, context, groupByArtifactId, bestPlan, dependencies[7]);
		applyArtifactEvolutionOperationLimit(bestPlan, input.maxOperationCount, input.debugEntries);
		return finalizeArtifactEvolutionPlan(bestPlan, context, input.debugEntries);
	}
	//#endregion
	//#region src/shared/min-priority-queue.ts
	var _compare = /* @__PURE__ */ new WeakMap();
	var _values = /* @__PURE__ */ new WeakMap();
	var _MinPriorityQueue_brand = /* @__PURE__ */ new WeakSet();
	var MinPriorityQueue = class {
		constructor(compare, values = []) {
			_classPrivateMethodInitSpec(this, _MinPriorityQueue_brand);
			_classPrivateFieldInitSpec(this, _compare, void 0);
			_classPrivateFieldInitSpec(this, _values, void 0);
			_classPrivateFieldSet2(_compare, this, compare);
			_classPrivateFieldSet2(_values, this, Array.from(values));
			for (let index = Math.floor(_classPrivateFieldGet2(_values, this).length / 2) - 1; index >= 0; index -= 1) _assertClassBrand(_MinPriorityQueue_brand, this, _sink).call(this, index);
		}
		get size() {
			return _classPrivateFieldGet2(_values, this).length;
		}
		push(value) {
			const values = _classPrivateFieldGet2(_values, this);
			values.push(value);
			let index = values.length - 1;
			while (index > 0) {
				const parentIndex = Math.floor((index - 1) / 2);
				if (_classPrivateFieldGet2(_compare, this).call(this, values[index], values[parentIndex]) >= 0) break;
				[values[index], values[parentIndex]] = [values[parentIndex], values[index]];
				index = parentIndex;
			}
		}
		pop() {
			const values = _classPrivateFieldGet2(_values, this);
			if (values.length === 0) return void 0;
			const first = values[0];
			const last = values.pop();
			if (values.length > 0 && last !== void 0) {
				values[0] = last;
				_assertClassBrand(_MinPriorityQueue_brand, this, _sink).call(this, 0);
			}
			return first;
		}
	};
	function _sink(startIndex) {
		const values = _classPrivateFieldGet2(_values, this);
		let index = startIndex;
		while (true) {
			const leftIndex = index * 2 + 1;
			if (leftIndex >= values.length) return;
			const rightIndex = leftIndex + 1;
			const childIndex = rightIndex < values.length && _classPrivateFieldGet2(_compare, this).call(this, values[rightIndex], values[leftIndex]) < 0 ? rightIndex : leftIndex;
			if (_classPrivateFieldGet2(_compare, this).call(this, values[childIndex], values[index]) >= 0) return;
			[values[index], values[childIndex]] = [values[childIndex], values[index]];
			index = childIndex;
		}
	}
	function takeFirstMatching(queue, predicate, restoreSkipped = true) {
		const skipped = [];
		let match;
		while (queue.size > 0) {
			const value = queue.pop();
			if (value === void 0) break;
			if (predicate(value)) {
				match = value;
				break;
			}
			skipped.push(value);
		}
		if (restoreSkipped) for (const value of skipped) queue.push(value);
		return match;
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/domain/artifact-execution.ts
	function compareTitanArtifactUpgradeCandidates(left, right, upgradeMode = "sequential") {
		if (upgradeMode === "parallel") {
			const costDelta = left.cost - right.cost;
			if (costDelta !== 0) return costDelta;
		}
		return left.titanPriority - right.titanPriority || left.slotPriority - right.slotPriority || left.nextLevel - right.nextLevel || left.cost - right.cost || left.titanId - right.titanId || left.slotId - right.slotId;
	}
	function appendTitanArtifactUpgradeSummaryEntry(summaryMap, step) {
		const summaryKey = `${step.titanId}:${step.slotId}`;
		if (!summaryMap.has(summaryKey)) summaryMap.set(summaryKey, {
			titanName: step.titanName,
			artifactLabel: step.artifactLabel,
			startLevel: step.fromLevel,
			endLevel: step.toLevel,
			count: 0
		});
		const summaryEntry = summaryMap.get(summaryKey);
		if (!summaryEntry) return;
		summaryEntry.endLevel = step.toLevel;
		summaryEntry.count += 1;
	}
	function createTitanArtifactUpgradePlanBuilder([getTitanArtifactLevels, getArtifactSlotIdsForTitan, getArtifactLevelCapForTitan, getTitanArtifactNextUpgrade, getTitanName, getArtifactSlotLabel]) {
		return function buildTitanArtifactUpgradePlan([selectedTitanIds, settings, ownedTitans, resourceAmount, reserveAmount, goldAmount, goldReserveAmount, maxUpgradeCount = void 0]) {
			var _asPlainRecord$upgrad;
			const ownedTitanRecord = asPlainRecord(ownedTitans);
			const candidates = [];
			let usesGoldBudget = false;
			selectedTitanIds.forEach((titanId, titanPriority) => {
				const titanData = ownedTitanRecord[String(titanId)];
				const artifactLevels = getTitanArtifactLevels(titanData);
				getArtifactSlotIdsForTitan(settings, titanId).forEach((slotId, slotPriority) => {
					if (!ARTIFACT_SLOT_ID_SET.has(Number(slotId))) return;
					const normalizedSlotId = Number(slotId);
					usesGoldBudget || (usesGoldBudget = normalizedSlotId === 2);
					const artifactLevel = Math.max(0, Number(artifactLevels[normalizedSlotId]) || 0);
					const levelCap = getArtifactLevelCapForTitan(settings, titanId, normalizedSlotId);
					if (levelCap > 0 && artifactLevel >= levelCap) return;
					const nextUpgrade = getTitanArtifactNextUpgrade(titanId, normalizedSlotId, artifactLevel);
					if (!nextUpgrade) return;
					candidates.push({
						titanId,
						titanName: getTitanName(titanId),
						slotId: normalizedSlotId,
						artifactLabel: getArtifactSlotLabel(normalizedSlotId),
						currentLevel: artifactLevel,
						nextLevel: nextUpgrade.nextLevel,
						cost: nextUpgrade.cost,
						resourceCost: nextUpgrade.resourceCost,
						goldCost: nextUpgrade.goldCost,
						titanPriority,
						slotPriority,
						targetLevel: levelCap
					});
				});
			});
			const queue = [];
			const summary = /* @__PURE__ */ new Map();
			const totalResourceAmount = Math.max(0, Number(resourceAmount) || 0);
			const normalizedReserveAmount = Math.max(0, Number(reserveAmount) || 0);
			const totalGoldAmount = Math.max(0, Number(goldAmount) || 0);
			const normalizedGoldReserveAmount = Math.max(0, Number(goldReserveAmount) || 0);
			let resourceLeft = Math.max(0, totalResourceAmount - normalizedReserveAmount);
			let goldLeft = Math.max(0, totalGoldAmount - normalizedGoldReserveAmount);
			const normalizedMaxUpgradeCount = Number.isFinite(Number(maxUpgradeCount)) ? Math.max(0, Math.floor(Number(maxUpgradeCount))) : Number.POSITIVE_INFINITY;
			const upgradeMode = String((_asPlainRecord$upgrad = asPlainRecord(settings).upgradeMode) !== null && _asPlainRecord$upgrad !== void 0 ? _asPlainRecord$upgrad : "sequential");
			const candidateQueue = new MinPriorityQueue((left, right) => compareTitanArtifactUpgradeCandidates(left, right, upgradeMode), candidates.filter((candidate) => candidate.cost > 0));
			while (candidateQueue.size > 0 && queue.length < normalizedMaxUpgradeCount) {
				const candidate = takeFirstMatching(candidateQueue, (entry) => entry.resourceCost <= resourceLeft && entry.goldCost <= goldLeft, false);
				if (!candidate) break;
				const step = {
					titanId: candidate.titanId,
					titanName: candidate.titanName,
					slotId: candidate.slotId,
					artifactLabel: candidate.artifactLabel,
					fromLevel: candidate.currentLevel,
					toLevel: candidate.nextLevel,
					cost: candidate.cost,
					resourceCost: candidate.resourceCost,
					goldCost: candidate.goldCost
				};
				queue.push(step);
				appendTitanArtifactUpgradeSummaryEntry(summary, step);
				resourceLeft -= candidate.resourceCost;
				goldLeft -= candidate.goldCost;
				candidate.currentLevel = candidate.nextLevel;
				if (candidate.targetLevel > 0 && candidate.currentLevel >= candidate.targetLevel) continue;
				const nextUpgrade = getTitanArtifactNextUpgrade(candidate.titanId, candidate.slotId, candidate.currentLevel);
				if (!nextUpgrade) continue;
				candidate.nextLevel = nextUpgrade.nextLevel;
				candidate.cost = nextUpgrade.cost;
				candidate.resourceCost = nextUpgrade.resourceCost;
				candidate.goldCost = nextUpgrade.goldCost;
				candidateQueue.push(candidate);
			}
			const spentAmount = Math.max(0, totalResourceAmount - normalizedReserveAmount) - resourceLeft;
			const goldSpentAmount = Math.max(0, totalGoldAmount - normalizedGoldReserveAmount) - goldLeft;
			return {
				queue,
				summary,
				spentAmount,
				leftAmount: Math.max(0, totalResourceAmount - spentAmount),
				reserveAmount: normalizedReserveAmount,
				goldSpentAmount,
				goldLeftAmount: Math.max(0, totalGoldAmount - goldSpentAmount),
				goldReserveAmount: normalizedGoldReserveAmount,
				usesGoldBudget
			};
		};
	}
	function createTitanArtifactFinalSummaryPlan({ resourceAmount, goldAmount, fragmentCoinAmount, usesGoldBudget }) {
		return {
			summary: /* @__PURE__ */ new Map(),
			evolutionSummary: /* @__PURE__ */ new Map(),
			purchaseSummary: /* @__PURE__ */ new Map(),
			spentAmount: 0,
			leftAmount: Math.max(0, Number(resourceAmount) || 0),
			goldSpentAmount: 0,
			goldLeftAmount: Math.max(0, Number(goldAmount) || 0),
			fragmentCoinSpentAmount: 0,
			fragmentCoinLeftAmount: Math.max(0, Number(fragmentCoinAmount) || 0),
			usesGoldBudget
		};
	}
	function buildTitanArtifactFragmentPurchaseCalls(fragmentPurchases) {
		return fragmentPurchases.map((step, index) => {
			var _step$purchaseCount;
			return {
				name: "shopBuy",
				args: {
					shopId: step.shopId,
					slot: step.slotId,
					cost: step.cost,
					reward: step.reward,
					amount: (_step$purchaseCount = step.purchaseCount) !== null && _step$purchaseCount !== void 0 ? _step$purchaseCount : step.amount
				},
				ident: `shopBuyTitanArtifactFragment_${step.artifactId}_${index}`
			};
		});
	}
	function buildTitanArtifactEvolutionCalls(evolutions) {
		return evolutions.map((step, index) => ({
			name: "titanArtifactEvolve",
			args: {
				titanId: step.titanId,
				slotId: step.slotId
			},
			ident: `titanArtifactEvolve_${step.titanId}_${step.slotId}_${index}`
		}));
	}
	function buildTitanArtifactUpgradeCalls(queue) {
		return queue.map((step, index) => ({
			name: "titanArtifactLevelUp",
			args: {
				titanId: step.titanId,
				slotId: step.slotId
			},
			ident: `titanArtifactLevelUp_${step.titanId}_${step.slotId}_${index}`
		}));
	}
	function applyTitanArtifactFragmentPurchaseExecution(executedPlan, step, fragmentCoinAmount) {
		var _step$purchaseCount2;
		appendArtifactFragmentPurchaseSummaryEntry(executedPlan.purchaseSummary, step);
		executedPlan.fragmentCoinSpentAmount += Number(step.coinSpentAmount) || step.coinCost * ((_step$purchaseCount2 = step.purchaseCount) !== null && _step$purchaseCount2 !== void 0 ? _step$purchaseCount2 : step.amount);
		executedPlan.fragmentCoinLeftAmount = Math.max(0, Math.max(0, Number(fragmentCoinAmount) || 0) - executedPlan.fragmentCoinSpentAmount);
	}
	function applyTitanArtifactEvolutionExecution(executedPlan, evolutionStep) {
		appendArtifactEvolutionSummaryEntry(executedPlan.evolutionSummary, evolutionStep);
	}
	function applyTitanArtifactUpgradeExecution(executedPlan, step, resourceAmount, goldAmount) {
		appendTitanArtifactUpgradeSummaryEntry(executedPlan.summary, step);
		executedPlan.spentAmount += step.resourceCost;
		executedPlan.leftAmount = Math.max(0, Math.max(0, Number(resourceAmount) || 0) - executedPlan.spentAmount);
		executedPlan.goldSpentAmount += step.goldCost;
		executedPlan.goldLeftAmount = Math.max(0, Math.max(0, Number(goldAmount) || 0) - executedPlan.goldSpentAmount);
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/runtime/artifact-execution-runner.ts
	function assertTitanArtifactCallResult(result, getGenericErrorMessage) {
		const resultError = result === null || result === void 0 ? void 0 : result.error;
		if (resultError) throw new Error(resultError.description || getGenericErrorMessage());
	}
	function createTitanArtifactExecutionRunner([sendCallsInChunks, showProgressMessage, buildPurchaseProgressHtml, buildEvolutionProgressHtml, buildUpgradeChunkProgressHtml, buildUpgradeProgressHtml, logArtifactFragmentDebug, getGenericErrorMessage]) {
		return async function runTitanArtifactExecutionSequence({ evolutionPlan, upgradePlan, executedPlan, fragmentCoinAmount, resourceAmount, goldAmount, buyArtifactFragments }) {
			const fragmentPurchases = evolutionPlan.fragmentPurchases;
			const evolutions = evolutionPlan.evolutions;
			const upgradeQueue = upgradePlan.queue;
			const purchaseCalls = buildTitanArtifactFragmentPurchaseCalls(fragmentPurchases);
			if (buyArtifactFragments) logArtifactFragmentDebug("purchase calls", purchaseCalls.map((purchaseCall, index) => ({
				index,
				call: purchaseCall
			})));
			const purchaseResults = await sendCallsInChunks(purchaseCalls, 20, async (event) => {
				const { chunkStart, chunkEnd } = event;
				const step = fragmentPurchases[chunkStart - 1];
				if (step) showProgressMessage(buildPurchaseProgressHtml(step, chunkStart, chunkEnd, fragmentPurchases.length), {
					event,
					requestName: "shopBuy"
				});
			});
			for (let index = 0; index < purchaseResults.length; index += 1) {
				if (buyArtifactFragments) logArtifactFragmentDebug("purchase result", {
					index,
					result: purchaseResults[index]
				});
				assertTitanArtifactCallResult(purchaseResults[index], getGenericErrorMessage);
				const step = fragmentPurchases[index];
				if (step) applyTitanArtifactFragmentPurchaseExecution(executedPlan, step, fragmentCoinAmount);
			}
			const evolutionResults = await sendCallsInChunks(buildTitanArtifactEvolutionCalls(evolutions), 20, async (event) => {
				const { chunkStart, chunkEnd } = event;
				const step = evolutions[chunkStart - 1];
				if (step) showProgressMessage(buildEvolutionProgressHtml(step, chunkStart, chunkEnd, evolutions.length), {
					event,
					requestName: "titanArtifactEvolve"
				});
			});
			for (let index = 0; index < evolutionResults.length; index += 1) {
				assertTitanArtifactCallResult(evolutionResults[index], getGenericErrorMessage);
				const evolutionStep = evolutions[index];
				if (evolutionStep) applyTitanArtifactEvolutionExecution(executedPlan, evolutionStep);
			}
			const upgradeResults = await sendCallsInChunks(buildTitanArtifactUpgradeCalls(upgradeQueue), 20, async (event) => {
				const { chunkStart, chunkEnd } = event;
				const step = upgradeQueue[chunkStart - 1];
				if (step) showProgressMessage(buildUpgradeChunkProgressHtml(step, executedPlan, chunkStart, chunkEnd, upgradeQueue.length), {
					event,
					requestName: "titanArtifactLevelUp"
				});
			});
			for (let index = 0; index < upgradeResults.length; index += 1) {
				const step = upgradeQueue[index];
				if (!step) continue;
				showProgressMessage(buildUpgradeProgressHtml(step, index + 1, upgradeQueue.length), "applying");
				assertTitanArtifactCallResult(upgradeResults[index], getGenericErrorMessage);
				applyTitanArtifactUpgradeExecution(executedPlan, step, resourceAmount, goldAmount);
			}
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/runtime/artifact-fragment-run-plan.ts
	function countRawArtifactFragmentShopSlots(shopData) {
		return Object.keys(getPlainRecord(getPlainRecord(shopData).slots)).length;
	}
	function getArtifactFragmentCoinBudget(fragmentCoinAmount, artifactFragmentCoinReserve) {
		return Math.max(0, Number(fragmentCoinAmount) - Math.max(0, Number(artifactFragmentCoinReserve) || 0));
	}
	function shouldBuyArtifactFragments(settings, options) {
		return !!settings.buyArtifactFragments && !((options === null || options === void 0 ? void 0 : options.source) === "checklist" && normalizeChecklistFragmentPurchaseBehavior(settings === null || settings === void 0 ? void 0 : settings.checklistFragmentPurchaseBehavior) === "skip");
	}
	function buildEmptyArtifactEvolutionPlan(fragmentCoinAmount, artifactFragmentCoinReserve) {
		return {
			fragmentPurchases: [],
			evolutions: [],
			purchaseSummary: /* @__PURE__ */ new Map(),
			evolutionSummary: /* @__PURE__ */ new Map(),
			coinSpentAmount: 0,
			coinLeftAmount: Math.max(0, Number(fragmentCoinAmount) || 0),
			coinReserveAmount: Math.max(0, Number(artifactFragmentCoinReserve) || 0)
		};
	}
	function getRemainingArtifactUpgradeCount(maxUpgradeCount, evolutionPlan) {
		return Number.isFinite(Number(maxUpgradeCount)) ? Math.max(0, Math.floor(Number(maxUpgradeCount)) - evolutionPlan.fragmentPurchases.length - evolutionPlan.evolutions.length) : void 0;
	}
	function createTitanArtifactFragmentRunPlanResolver([translate, showProgressMessage, fetchTitanArtifactFragmentShop, buildArtifactEvolutionPlan, logArtifactFragmentDebug]) {
		return async function resolveTitanArtifactFragmentRunPlan([settings, options, selectedTitanIds, selectedArtifactSlotIds, ownedTitans, inventory, fragmentCoinAmount]) {
			const buyArtifactFragments = shouldBuyArtifactFragments(settings, options);
			const coinBudget = getArtifactFragmentCoinBudget(fragmentCoinAmount, settings.artifactFragmentCoinReserve);
			logArtifactFragmentDebug("artifact run started", {
				buyArtifactFragments,
				evolveArtifacts: !!settings.evolveArtifacts,
				selectedTitanIds,
				selectedArtifactSlotIds,
				selectedArtifactEvolutionKeys: settings.evolveArtifacts ? settings.selectedArtifactEvolutionKeys : [],
				selectedArtifactFragmentBuyKeys: settings.selectedArtifactFragmentBuyKeys,
				artifactEvolutionMaxStar: settings.artifactEvolutionMaxStar,
				fragmentCoinAmount,
				artifactFragmentCoinReserve: settings.artifactFragmentCoinReserve,
				coinBudget
			});
			showProgressMessage(translate("HWHTITANART_PROGRESS_PLAN"), "planning");
			let fragmentShopData = {};
			if (buyArtifactFragments) {
				showProgressMessage(translate("HWHTITANART_PROGRESS_SHOP"), "loading");
				try {
					fragmentShopData = await fetchTitanArtifactFragmentShop();
					logArtifactFragmentDebug("shop loaded", { rawShopSlotCount: countRawArtifactFragmentShopSlots(fragmentShopData) });
				} catch (error) {
					logArtifactFragmentDebug("shop load failed", { error });
					throw error;
				}
			}
			const fragmentDebugEntries = [];
			const evolutionPlan = settings.evolveArtifacts || buyArtifactFragments ? buildArtifactEvolutionPlan({
				selectedTitanIds,
				ownedTitans,
				inventory,
				shopData: fragmentShopData,
				coinAmount: fragmentCoinAmount,
				coinReserveAmount: settings.artifactFragmentCoinReserve,
				selectedArtifactEvolutionKeys: settings.evolveArtifacts ? settings.selectedArtifactEvolutionKeys : [],
				selectedArtifactFragmentBuyKeys: settings.selectedArtifactFragmentBuyKeys,
				maxArtifactStar: settings.artifactEvolutionMaxStar,
				buyMissingFragments: buyArtifactFragments,
				maxOperationCount: options === null || options === void 0 ? void 0 : options.maxUpgradeCount,
				debugEntries: fragmentDebugEntries
			}) : buildEmptyArtifactEvolutionPlan(fragmentCoinAmount, settings.artifactFragmentCoinReserve);
			if (buyArtifactFragments) {
				logArtifactFragmentDebug("plan diagnostics", {
					settings: {
						buyArtifactFragments,
						evolveArtifacts: !!settings.evolveArtifacts,
						selectedTitanIds,
						selectedArtifactEvolutionKeys: settings.evolveArtifacts ? settings.selectedArtifactEvolutionKeys : [],
						selectedArtifactFragmentBuyKeys: settings.selectedArtifactFragmentBuyKeys,
						artifactEvolutionMaxStar: settings.artifactEvolutionMaxStar,
						artifactFragmentCoinReserve: settings.artifactFragmentCoinReserve
					},
					fragmentCoinAmount,
					coinBudget,
					rawShopSlotCount: countRawArtifactFragmentShopSlots(fragmentShopData),
					plannedPurchaseCount: evolutionPlan.fragmentPurchases.length,
					plannedEvolutionCount: evolutionPlan.evolutions.length,
					debugEntries: fragmentDebugEntries
				});
				if (evolutionPlan.fragmentPurchases.length <= 0) logArtifactFragmentDebug("no fragment purchases planned", {
					reason: "planner-returned-empty-purchase-list",
					debugEntries: fragmentDebugEntries
				});
			}
			return [
				buyArtifactFragments,
				evolutionPlan,
				fragmentDebugEntries,
				getRemainingArtifactUpgradeCount(options === null || options === void 0 ? void 0 : options.maxUpgradeCount, evolutionPlan)
			];
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/domain/skin-execution.ts
	function appendTitanSkinSummaryEntry(summaryMap, step) {
		const summaryKey = `${step.titanId}:${step.localeKey}`;
		if (!summaryMap.has(summaryKey)) summaryMap.set(summaryKey, {
			titanName: step.titanName,
			skinName: step.name,
			startLevel: step.fromLevel,
			endLevel: step.toLevel,
			count: 0
		});
		const summaryEntry = summaryMap.get(summaryKey);
		if (!summaryEntry) return;
		summaryEntry.endLevel = step.toLevel;
		summaryEntry.count += 1;
	}
	function buildTitanSkinUpgradeCalls(queue) {
		return queue.map((step, index) => ({
			name: "titanSkinUpgrade",
			args: {
				titanId: step.titanId,
				skinId: step.skinId,
				paid: false
			},
			ident: `titanSkinUpgrade_${step.titanId}_${step.skinId}_${index}`
		}));
	}
	function applyTitanSkinUpgradeExecution(executedPlan, step, skinStoneAmount) {
		appendTitanSkinSummaryEntry(executedPlan.summary, step);
		executedPlan.spentAmount += step.cost;
		executedPlan.leftAmount = Math.max(0, Math.max(0, Number(skinStoneAmount) || 0) - executedPlan.spentAmount);
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/domain/skin-planning.ts
	function compareTitanSkinCandidates(left, right, upgradeMode = "sequential") {
		if (upgradeMode === "parallel") {
			const costDelta = left.cost - right.cost;
			if (costDelta !== 0) return costDelta;
		}
		return left.titanPriority - right.titanPriority || left.skinPriority - right.skinPriority || left.nextLevel - right.nextLevel || left.cost - right.cost || left.titanId - right.titanId || compareRussianText(left.name, right.name) || left.skinId - right.skinId;
	}
	function createTitanSkinPlanBuilder([getTitanSkinEntries, getSkinRuleForTitan, getSkinLevelCapForTitan, getTitanSkinNextUpgrade, getTitanName]) {
		return function buildTitanSkinPlan([selectedTitanIds, settings, ownedTitans, skinStoneAmount, reserveAmount, maxUpgradeCount = void 0]) {
			const ownedTitanRecord = asPlainRecord(ownedTitans);
			const candidates = [];
			selectedTitanIds.forEach((titanId, titanPriority) => {
				const skinEntryByLocaleKey = new Map(getTitanSkinEntries(ownedTitanRecord[String(titanId)]).map((skinEntry) => [skinEntry.localeKey, skinEntry]));
				getSkinRuleForTitan(settings, titanId).localeKeys.forEach((localeKey, skinPriority) => {
					const skinEntry = skinEntryByLocaleKey.get(localeKey);
					if (!skinEntry) return;
					const levelCap = getSkinLevelCapForTitan(settings, titanId, skinEntry.localeKey);
					if (levelCap > 0 && skinEntry.currentLevel >= levelCap) return;
					const nextUpgrade = getTitanSkinNextUpgrade(skinEntry.skinId, skinEntry.currentLevel);
					if (!nextUpgrade) return;
					candidates.push({
						titanId,
						titanName: getTitanName(titanId),
						skinId: skinEntry.skinId,
						localeKey: skinEntry.localeKey,
						name: skinEntry.name,
						currentLevel: skinEntry.currentLevel,
						nextLevel: nextUpgrade.nextLevel,
						cost: nextUpgrade.cost,
						titanPriority,
						skinPriority,
						targetLevel: levelCap
					});
				});
			});
			const queue = [];
			const summary = /* @__PURE__ */ new Map();
			const totalSkinStoneAmount = Math.max(0, Number(skinStoneAmount) || 0);
			const normalizedReserveAmount = Math.max(0, Number(reserveAmount) || 0);
			let stonesLeft = Math.max(0, totalSkinStoneAmount - normalizedReserveAmount);
			const normalizedMaxUpgradeCount = Number.isFinite(Number(maxUpgradeCount)) ? Math.max(0, Math.floor(Number(maxUpgradeCount))) : Number.POSITIVE_INFINITY;
			const candidateQueue = new MinPriorityQueue((left, right) => compareTitanSkinCandidates(left, right, settings.upgradeMode), candidates.filter((candidate) => candidate.cost > 0));
			while (candidateQueue.size > 0 && queue.length < normalizedMaxUpgradeCount) {
				const candidate = takeFirstMatching(candidateQueue, (entry) => entry.cost > 0 && entry.cost <= stonesLeft, false);
				if (!candidate) break;
				const step = {
					titanId: candidate.titanId,
					titanName: candidate.titanName,
					skinId: candidate.skinId,
					localeKey: candidate.localeKey,
					name: candidate.name,
					fromLevel: candidate.currentLevel,
					toLevel: candidate.nextLevel,
					cost: candidate.cost
				};
				queue.push(step);
				appendTitanSkinSummaryEntry(summary, step);
				stonesLeft -= candidate.cost;
				candidate.currentLevel = candidate.nextLevel;
				if (candidate.targetLevel > 0 && candidate.currentLevel >= candidate.targetLevel) continue;
				const nextUpgrade = getTitanSkinNextUpgrade(candidate.skinId, candidate.currentLevel);
				if (!nextUpgrade) continue;
				candidate.nextLevel = nextUpgrade.nextLevel;
				candidate.cost = nextUpgrade.cost;
				candidateQueue.push(candidate);
			}
			const spentAmount = Math.max(0, totalSkinStoneAmount - normalizedReserveAmount) - stonesLeft;
			return {
				queue,
				summary,
				spentAmount,
				leftAmount: Math.max(0, totalSkinStoneAmount - spentAmount)
			};
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/runtime/skin-execution-runner.ts
	function assertTitanSkinCallResult(result, getGenericErrorMessage) {
		const resultError = result === null || result === void 0 ? void 0 : result.error;
		if (resultError) throw new Error(resultError.description || getGenericErrorMessage());
	}
	function createTitanSkinExecutionRunner([sendCallsInChunks, showProgressMessage, buildUpgradeChunkProgressHtml, buildUpgradeProgressHtml, getGenericErrorMessage]) {
		return async function runTitanSkinExecutionSequence({ plan, executedPlan, skinStoneAmount }) {
			const upgradeQueue = plan.queue;
			const upgradeResults = await sendCallsInChunks(buildTitanSkinUpgradeCalls(upgradeQueue), 20, async (event) => {
				const { chunkStart, chunkEnd } = event;
				const step = upgradeQueue[chunkStart - 1];
				if (step) showProgressMessage(buildUpgradeChunkProgressHtml(step, executedPlan, chunkStart, chunkEnd, upgradeQueue.length), {
					event,
					requestName: "titanSkinUpgrade"
				});
			});
			for (let index = 0; index < upgradeResults.length; index += 1) {
				const step = upgradeQueue[index];
				if (!step) continue;
				showProgressMessage(buildUpgradeProgressHtml(step, index + 1, upgradeQueue.length), "applying");
				assertTitanSkinCallResult(upgradeResults[index], getGenericErrorMessage);
				applyTitanSkinUpgradeExecution(executedPlan, step, skinStoneAmount);
			}
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/domain/level-execution.ts
	function appendTitanLevelSummaryEntry(summaryMap, step) {
		const summaryKey = String(step.titanId);
		if (!summaryMap.has(summaryKey)) summaryMap.set(summaryKey, {
			titanName: step.titanName,
			startLevel: step.fromLevel,
			endLevel: step.toLevel,
			count: 0
		});
		const summaryEntry = summaryMap.get(summaryKey);
		if (!summaryEntry) return;
		summaryEntry.endLevel = step.toLevel;
		summaryEntry.count += 1;
	}
	function appendTitanEvolutionSummaryEntry(summaryMap, step) {
		const summaryKey = String(step.titanId);
		if (!summaryMap.has(summaryKey)) summaryMap.set(summaryKey, {
			titanName: step.titanName,
			startStar: step.fromStar,
			endStar: step.toStar,
			count: 0
		});
		const summaryEntry = summaryMap.get(summaryKey);
		if (!summaryEntry) return;
		summaryEntry.endStar = step.toStar;
		summaryEntry.count += 1;
	}
	function buildTitanEvolutionCalls(evolutions) {
		return evolutions.map((step, index) => ({
			name: "titanEvolve",
			args: { titanId: step.titanId },
			ident: `titanEvolve_${step.titanId}_${index}`
		}));
	}
	function buildTitanLevelUpgradeCalls(queue) {
		return queue.map((step, index) => ({
			name: "consumableUseTitanXp",
			args: {
				titanId: step.titanId,
				libId: 20,
				amount: step.cost
			},
			ident: `consumableUseTitanXp_${step.titanId}_${index}`
		}));
	}
	function applyTitanEvolutionExecution(executedPlan, step) {
		appendTitanEvolutionSummaryEntry(executedPlan.evolutionSummary, step);
	}
	function applyTitanLevelUpgradeExecution(executedPlan, step, potionAmount) {
		appendTitanLevelSummaryEntry(executedPlan.summary, step);
		executedPlan.spentAmount += step.cost;
		executedPlan.leftAmount = Math.max(0, Math.max(0, Number(potionAmount) || 0) - executedPlan.spentAmount);
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/domain/level-planning.ts
	function compareTitanLevelCandidates(left, right, upgradeMode) {
		if (upgradeMode !== "parallel") {
			const priorityDelta = left.titanPriority - right.titanPriority;
			if (priorityDelta !== 0) return priorityDelta;
		}
		return left.cost - right.cost || left.nextLevel - right.nextLevel || left.titanId - right.titanId;
	}
	function createTitanEvolutionPlanBuilder([getMaxTitanEvolutionStar, getTitanStarCount, getTitanSoulAmount, getTitanEvolutionCost, getTitanName]) {
		return function buildTitanEvolutionPlan([selectedTitanEvolutionIds, ownedTitans, inventory, maxTitanStar = 0]) {
			const ownedTitanRecord = asPlainRecord(ownedTitans);
			const selectedTitanIdSet = new Set(selectedTitanEvolutionIds.map((value) => Number(value)).filter((value) => Number.isFinite(value)));
			const maxKnownStar = getMaxTitanEvolutionStar();
			const targetStar = Math.max(0, Number(maxTitanStar) || 0) > 0 ? Math.min(Math.max(0, Number(maxTitanStar) || 0), maxKnownStar) : maxKnownStar;
			const availableSoulByTitanId = /* @__PURE__ */ new Map();
			const evolutions = [];
			const summary = /* @__PURE__ */ new Map();
			selectedTitanIdSet.forEach((titanId) => {
				const titanData = ownedTitanRecord[String(titanId)];
				if (!titanData || targetStar <= 0) return;
				let currentStar = getTitanStarCount(titanData);
				if (currentStar >= targetStar) return;
				let soulAmount = getTitanSoulAmount(inventory, titanId);
				availableSoulByTitanId.set(titanId, soulAmount);
				while (currentStar < targetStar) {
					const nextStar = currentStar + 1;
					const cost = getTitanEvolutionCost(nextStar);
					if (cost <= 0 || soulAmount < cost) break;
					const step = {
						titanId,
						titanName: getTitanName(titanId),
						fromStar: currentStar,
						toStar: nextStar,
						cost
					};
					evolutions.push(step);
					appendTitanEvolutionSummaryEntry(summary, step);
					soulAmount -= cost;
					availableSoulByTitanId.set(titanId, soulAmount);
					currentStar = nextStar;
				}
			});
			return {
				evolutions,
				summary
			};
		};
	}
	function createTitanLevelPlanBuilder([getTitanLevelUpCost, getTitanName]) {
		return function buildTitanLevelPlan([selectedTitanIds, ownedTitans, potionAmount, reserveAmount, titanLevelCaps, maxUpgradeCount = void 0, upgradeMode = UPGRADE_MODE_PARALLEL]) {
			const ownedTitanRecord = asPlainRecord(ownedTitans);
			const candidates = [];
			const normalizedLevelCaps = asPlainRecord(titanLevelCaps);
			selectedTitanIds.forEach((titanId, titanPriority) => {
				var _normalizedLevelCaps$;
				const titanRecord = asPlainRecord(ownedTitanRecord[String(titanId)]);
				const titanLevel = Math.max(0, Number(titanRecord.level) || 0);
				const targetLevel = Math.max(0, Number((_normalizedLevelCaps$ = normalizedLevelCaps[titanId]) !== null && _normalizedLevelCaps$ !== void 0 ? _normalizedLevelCaps$ : normalizedLevelCaps[String(titanId)]) || 0);
				if (targetLevel > 0 && titanLevel >= targetLevel) return;
				const cost = getTitanLevelUpCost(titanLevel);
				if (!cost) return;
				candidates.push({
					titanId,
					titanName: getTitanName(titanId),
					currentLevel: titanLevel,
					nextLevel: titanLevel + 1,
					targetLevel,
					cost,
					titanPriority
				});
			});
			const queue = [];
			const summary = /* @__PURE__ */ new Map();
			const totalPotionAmount = Math.max(0, Number(potionAmount) || 0);
			const normalizedReserveAmount = Math.max(0, Number(reserveAmount) || 0);
			let potionLeft = Math.max(0, totalPotionAmount - normalizedReserveAmount);
			const normalizedMaxUpgradeCount = Number.isFinite(Number(maxUpgradeCount)) ? Math.max(0, Math.floor(Number(maxUpgradeCount))) : Number.POSITIVE_INFINITY;
			const candidateQueue = new MinPriorityQueue((left, right) => compareTitanLevelCandidates(left, right, upgradeMode), candidates.filter((candidate) => candidate.cost > 0));
			while (candidateQueue.size > 0 && queue.length < normalizedMaxUpgradeCount) {
				const candidate = takeFirstMatching(candidateQueue, (entry) => entry.cost > 0 && entry.cost <= potionLeft, false);
				if (!candidate) break;
				const step = {
					titanId: candidate.titanId,
					titanName: candidate.titanName,
					fromLevel: candidate.currentLevel,
					toLevel: candidate.nextLevel,
					cost: candidate.cost
				};
				queue.push(step);
				appendTitanLevelSummaryEntry(summary, step);
				potionLeft -= candidate.cost;
				candidate.currentLevel = candidate.nextLevel;
				if (candidate.targetLevel > 0 && candidate.currentLevel >= candidate.targetLevel) continue;
				candidate.nextLevel += 1;
				const nextCost = getTitanLevelUpCost(candidate.currentLevel);
				if (!nextCost) continue;
				candidate.cost = nextCost;
				candidateQueue.push(candidate);
			}
			const spentAmount = Math.max(0, totalPotionAmount - normalizedReserveAmount) - potionLeft;
			return {
				queue,
				summary,
				spentAmount,
				leftAmount: Math.max(0, totalPotionAmount - spentAmount)
			};
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/domain/level-potion-purchases.ts
	function readAmount(container, id) {
		return Math.max(0, Number(asPlainRecord(container)[String(id)]) || 0);
	}
	function normalizeAmountAvailable(value) {
		if (value === null || value === void 0 || value === "") return Number.POSITIVE_INFINITY;
		return Math.max(0, Math.floor(Number(value) || 0));
	}
	function parseOffer(shop, slotId) {
		const slot = asPlainRecord(asPlainRecord(shop.slots)[String(slotId)]);
		const cost = asPlainRecord(slot.cost);
		const reward = asPlainRecord(slot.reward);
		const coinCost = readAmount(cost.coin, 15);
		const potionAmount = readAmount(reward.consumable, 20);
		if (coinCost <= 0 || potionAmount <= 0) return;
		return {
			shopId: Math.max(0, Number(shop.id) || 12),
			slotId,
			potionAmount,
			coinCost,
			cost,
			reward,
			amountAvailable: normalizeAmountAvailable(slot.amountAvailable)
		};
	}
	function getTitanXpPotionOffers(shopValue) {
		const shop = asPlainRecord(shopValue);
		return [5, 6].map((slotId) => parseOffer(shop, slotId)).filter((offer) => offer !== void 0).sort((left, right) => left.potionAmount - right.potionAmount);
	}
	function isBetterCandidate(candidate, current, missingPotionAmount) {
		if (!current) return true;
		const candidateFulfilled = Math.min(candidate.potionAmount, missingPotionAmount);
		const currentFulfilled = Math.min(current.potionAmount, missingPotionAmount);
		if (candidateFulfilled !== currentFulfilled) return candidateFulfilled > currentFulfilled;
		const candidateCovers = candidate.potionAmount >= missingPotionAmount;
		if (candidateCovers !== current.potionAmount >= missingPotionAmount) return candidateCovers;
		if (candidateCovers && candidate.coinSpentAmount !== current.coinSpentAmount) return candidate.coinSpentAmount < current.coinSpentAmount;
		if (candidate.potionAmount !== current.potionAmount) return candidateCovers ? candidate.potionAmount < current.potionAmount : candidate.potionAmount > current.potionAmount;
		if (candidate.purchaseCount !== current.purchaseCount) return candidate.purchaseCount < current.purchaseCount;
		return candidate.callCount < current.callCount;
	}
	function buildCandidate(offers, counts) {
		const countMap = /* @__PURE__ */ new Map();
		let potionAmount = 0;
		let coinSpentAmount = 0;
		let callCount = 0;
		let purchaseCount = 0;
		offers.forEach((offer, index) => {
			const count = Math.max(0, Math.floor(Number(counts[index]) || 0));
			if (count <= 0) return;
			countMap.set(offer.slotId, count);
			potionAmount += offer.potionAmount * count;
			coinSpentAmount += offer.coinCost * count;
			callCount += 1;
			purchaseCount += count;
		});
		return {
			counts: countMap,
			potionAmount,
			coinSpentAmount,
			callCount,
			purchaseCount
		};
	}
	function findBestPurchaseCandidate(offers, missingPotionAmount, availableCoinAmount) {
		var _bestCandidate;
		if (offers.length === 0 || missingPotionAmount <= 0 || availableCoinAmount <= 0) return buildCandidate(offers, []);
		const [smallOffer, largeOffer] = offers;
		if (!largeOffer) return buildCandidate(offers, [Math.min(Math.ceil(missingPotionAmount / smallOffer.potionAmount), Math.floor(availableCoinAmount / smallOffer.coinCost), smallOffer.amountAvailable)]);
		const largeLimit = Math.min(Math.ceil(missingPotionAmount / largeOffer.potionAmount), Math.floor(availableCoinAmount / largeOffer.coinCost), largeOffer.amountAvailable);
		let bestCandidate;
		for (let largeCount = 0; largeCount <= largeLimit; largeCount += 1) {
			const largePotionAmount = largeCount * largeOffer.potionAmount;
			const largeCoinCost = largeCount * largeOffer.coinCost;
			const remainingPotionAmount = Math.max(0, missingPotionAmount - largePotionAmount);
			const remainingCoinAmount = Math.max(0, availableCoinAmount - largeCoinCost);
			const candidate = buildCandidate(offers, [Math.min(Math.ceil(remainingPotionAmount / smallOffer.potionAmount), Math.floor(remainingCoinAmount / smallOffer.coinCost), smallOffer.amountAvailable), largeCount]);
			if (isBetterCandidate(candidate, bestCandidate, missingPotionAmount)) bestCandidate = candidate;
		}
		return (_bestCandidate = bestCandidate) !== null && _bestCandidate !== void 0 ? _bestCandidate : buildCandidate(offers, []);
	}
	function buildTitanXpPotionPurchasePlan({ shop, currentPotionAmount, potionReserve, requiredPotionAmount, coinAmount, coinReserve }) {
		const totalPotionAmount = Math.max(0, Math.floor(Number(currentPotionAmount) || 0));
		const reservePotionAmount = Math.max(0, Math.floor(Number(potionReserve) || 0));
		const normalizedRequiredPotionAmount = Math.max(0, Math.floor(Number(requiredPotionAmount) || 0));
		const totalCoinAmount = Math.max(0, Math.floor(Number(coinAmount) || 0));
		const reserveCoinAmount = Math.max(0, Math.floor(Number(coinReserve) || 0));
		const missingPotionAmount = Math.max(0, normalizedRequiredPotionAmount - Math.max(0, totalPotionAmount - reservePotionAmount));
		const availableCoinAmount = Math.max(0, totalCoinAmount - reserveCoinAmount);
		const offers = getTitanXpPotionOffers(shop);
		const candidate = findBestPurchaseCandidate(offers, missingPotionAmount, availableCoinAmount);
		return {
			purchases: offers.map((offer) => {
				var _candidate$counts$get;
				const purchaseCount = (_candidate$counts$get = candidate.counts.get(offer.slotId)) !== null && _candidate$counts$get !== void 0 ? _candidate$counts$get : 0;
				return purchaseCount > 0 ? {
					...offer,
					purchaseCount,
					potionAmountTotal: offer.potionAmount * purchaseCount,
					coinSpentAmount: offer.coinCost * purchaseCount
				} : void 0;
			}).filter((step) => step !== void 0).sort((left, right) => right.potionAmount - left.potionAmount),
			requiredPotionAmount: normalizedRequiredPotionAmount,
			missingPotionAmount,
			potionAmountBought: candidate.potionAmount,
			coinSpentAmount: candidate.coinSpentAmount,
			coinLeftAmount: Math.max(0, totalCoinAmount - candidate.coinSpentAmount),
			coinReserveAmount: reserveCoinAmount
		};
	}
	function buildTitanXpPotionPurchaseCalls(purchases) {
		return purchases.map((step, index) => ({
			name: "shopBuy",
			args: {
				shopId: step.shopId,
				slot: step.slotId,
				cost: step.cost,
				reward: step.reward,
				amount: step.purchaseCount
			},
			ident: `shopBuyTitanXpPotion_${step.slotId}_${index}`
		}));
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/runtime/level-execution-runner.ts
	function assertTitanLevelCallResult(result, getGenericErrorMessage) {
		const resultError = result === null || result === void 0 ? void 0 : result.error;
		if (resultError) throw new Error(resultError.description || getGenericErrorMessage());
	}
	function createTitanLevelExecutionRunner([sendCallsInChunks, showProgressMessage, buildEvolutionProgressHtml, buildUpgradeChunkProgressHtml, buildUpgradeProgressHtml, getGenericErrorMessage, buildPotionPurchaseProgressHtml = (step) => `+${step.potionAmountTotal} / -${step.coinSpentAmount}`]) {
		return async function runTitanLevelExecutionSequence({ evolutionPlan, plan, executedPlan, potionAmount, purchasePlan = { purchases: [] } }) {
			const purchases = purchasePlan.purchases;
			const purchaseResults = purchases.length > 0 ? await sendCallsInChunks(buildTitanXpPotionPurchaseCalls(purchases), 20, async (event) => {
				const { chunkStart } = event;
				const step = purchases[chunkStart - 1];
				if (step) showProgressMessage(buildPotionPurchaseProgressHtml(step, chunkStart, purchases.length), {
					event,
					requestName: "shopBuy"
				});
			}) : [];
			for (let index = 0; index < purchaseResults.length; index += 1) {
				var _executedPlan$potionA, _executedPlan$potionC, _executedPlan$potionC2;
				assertTitanLevelCallResult(purchaseResults[index], getGenericErrorMessage);
				const step = purchases[index];
				if (!step) continue;
				executedPlan.potionAmountBought = ((_executedPlan$potionA = executedPlan.potionAmountBought) !== null && _executedPlan$potionA !== void 0 ? _executedPlan$potionA : 0) + step.potionAmountTotal;
				executedPlan.leftAmount += step.potionAmountTotal;
				executedPlan.potionCoinSpentAmount = ((_executedPlan$potionC = executedPlan.potionCoinSpentAmount) !== null && _executedPlan$potionC !== void 0 ? _executedPlan$potionC : 0) + step.coinSpentAmount;
				executedPlan.potionCoinLeftAmount = Math.max(0, ((_executedPlan$potionC2 = executedPlan.potionCoinLeftAmount) !== null && _executedPlan$potionC2 !== void 0 ? _executedPlan$potionC2 : 0) - step.coinSpentAmount);
			}
			const evolutions = evolutionPlan.evolutions;
			const evolutionCalls = buildTitanEvolutionCalls(evolutions);
			const evolutionResults = evolutionCalls.length > 0 ? await sendCallsInChunks(evolutionCalls, 20, async (event) => {
				const { chunkStart, chunkEnd } = event;
				const step = evolutions[chunkStart - 1];
				if (step) showProgressMessage(buildEvolutionProgressHtml(step, chunkStart, chunkEnd, evolutions.length), {
					event,
					requestName: "titanEvolve"
				});
			}) : [];
			for (let index = 0; index < evolutionResults.length; index += 1) {
				assertTitanLevelCallResult(evolutionResults[index], getGenericErrorMessage);
				const evolutionStep = evolutions[index];
				if (evolutionStep) applyTitanEvolutionExecution(executedPlan, evolutionStep);
			}
			const upgradeQueue = plan.queue;
			const levelCalls = buildTitanLevelUpgradeCalls(upgradeQueue);
			const levelResults = levelCalls.length > 0 ? await sendCallsInChunks(levelCalls, 20, async (event) => {
				const { chunkStart, chunkEnd } = event;
				const step = upgradeQueue[chunkStart - 1];
				if (step) showProgressMessage(buildUpgradeChunkProgressHtml(step, executedPlan, chunkStart, chunkEnd, upgradeQueue.length), {
					event,
					requestName: "consumableUseTitanXp"
				});
			}) : [];
			for (let index = 0; index < levelResults.length; index += 1) {
				const step = upgradeQueue[index];
				if (!step) continue;
				showProgressMessage(buildUpgradeProgressHtml(step, index + 1, upgradeQueue.length), "applying");
				assertTitanLevelCallResult(levelResults[index], getGenericErrorMessage);
				applyTitanLevelUpgradeExecution(executedPlan, step, potionAmount);
			}
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/runtime/run-result.ts
	function buildTitanRunWarningResult(content, label) {
		const normalizedLabel = String(label !== null && label !== void 0 ? label : "").trim();
		return [content, {
			stage: normalizedLabel,
			resultLabel: normalizedLabel,
			resultTone: "warning"
		}];
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/runtime/leveling-run-flow.ts
	function createTitanLevelingRunFlows([translate, sanitizeSelectedTitanIds, showProgressMessage, showFinalProgress, refreshTitanSnapshotAfterRun, logError, getTitanSkinResourceName, getTitanSkinStoneAmount, buildTitanSkinPlan, runTitanSkinExecutionSequence, [buildTitanSkinErrorResult, buildTitanSkinSuccessResult], getTitanXpResourceName, getTitanXpPotionAmount, getTitanSoulCoinAmount, fetchTitanXpPotionShop, buildTitanXpPotionPurchasePlan, buildTitanEvolutionPlan, buildTitanLevelPlan, runTitanLevelExecutionSequence, [buildTitanLevelErrorResult, buildTitanLevelSuccessResult]]) {
		async function runTitanSkinLeveling(settings, ownedTitans, inventory, options = {}) {
			const sanitizedTitanIds = sanitizeSelectedTitanIds(settings.selectedTitanIds, ownedTitans);
			if (sanitizedTitanIds.length <= 0) {
				showFinalProgress(...buildTitanRunWarningResult(translate("HWHTITANSKIN_SELECT_TITANS_FIRST"), translate("HWHTITANTRAINER_RUN_SELECTION_REQUIRED")));
				return;
			}
			const resourceName = getTitanSkinResourceName();
			const skinStoneAmount = getTitanSkinStoneAmount(inventory);
			showProgressMessage(translate("HWHTITANSKIN_PROGRESS_PLAN"), "planning");
			const plan = buildTitanSkinPlan([
				sanitizedTitanIds,
				settings,
				ownedTitans,
				skinStoneAmount,
				settings.skinStoneReserve,
				options === null || options === void 0 ? void 0 : options.maxUpgradeCount
			]);
			if (plan.queue.length <= 0) {
				showFinalProgress(...buildTitanRunWarningResult(translate("HWHTITANSKIN_NOTHING_TO_LEVEL"), translate("HWHTITANTRAINER_RUN_NOTHING_TO_DO")));
				return;
			}
			const executedPlan = {
				summary: /* @__PURE__ */ new Map(),
				spentAmount: 0,
				leftAmount: skinStoneAmount
			};
			try {
				await runTitanSkinExecutionSequence({
					plan,
					executedPlan,
					skinStoneAmount
				});
			} catch (error) {
				logError("[TitanSkin] Error:", error);
				showFinalProgress(...buildTitanSkinErrorResult([
					executedPlan,
					resourceName,
					error
				]));
				return;
			}
			showProgressMessage(translate("HWHTITAN_PROGRESS_SYNCING"), "syncing");
			await refreshTitanSnapshotAfterRun();
			showFinalProgress(...buildTitanSkinSuccessResult([
				executedPlan,
				resourceName,
				plan.queue.length,
				settings,
				options
			]));
		}
		async function runTitanLeveling(settings, ownedTitans, inventory, options = {}) {
			const sanitizedTitanIds = sanitizeSelectedTitanIds(settings.selectedTitanIds, ownedTitans);
			const sanitizedEvolutionTitanIds = sanitizeSelectedTitanIds(settings.selectedTitanEvolutionIds, ownedTitans);
			if (sanitizedTitanIds.length <= 0 && sanitizedEvolutionTitanIds.length <= 0) {
				showFinalProgress(...buildTitanRunWarningResult(translate("HWHTITANLVL_SELECT_TITANS_FIRST"), translate("HWHTITANTRAINER_RUN_SELECTION_REQUIRED")));
				return;
			}
			const resourceName = getTitanXpResourceName();
			const potionAmount = getTitanXpPotionAmount(inventory);
			const soulCoinAmount = getTitanSoulCoinAmount(inventory);
			showProgressMessage(translate("HWHTITANLVL_PROGRESS_PLAN"), "planning");
			const evolutionPlan = buildTitanEvolutionPlan([
				sanitizedEvolutionTitanIds,
				ownedTitans,
				inventory,
				settings.titanEvolutionMaxStar
			]);
			const targetPlan = buildTitanLevelPlan([
				sanitizedTitanIds,
				ownedTitans,
				Number.MAX_SAFE_INTEGER,
				0,
				settings.titanLevelCaps,
				options === null || options === void 0 ? void 0 : options.maxUpgradeCount,
				settings.upgradeMode
			]);
			let purchasePlan = buildTitanXpPotionPurchasePlan({
				shop: {},
				currentPotionAmount: potionAmount,
				potionReserve: settings.potionReserve,
				requiredPotionAmount: targetPlan.spentAmount,
				coinAmount: soulCoinAmount,
				coinReserve: settings.xpPotionCoinReserve
			});
			if (settings.buyXpPotions && targetPlan.spentAmount > 0) try {
				purchasePlan = buildTitanXpPotionPurchasePlan({
					shop: await fetchTitanXpPotionShop(),
					currentPotionAmount: potionAmount,
					potionReserve: settings.potionReserve,
					requiredPotionAmount: targetPlan.spentAmount,
					coinAmount: soulCoinAmount,
					coinReserve: settings.xpPotionCoinReserve
				});
			} catch (error) {
				logError("[TitanLevel] potion shop error:", error);
				showFinalProgress(...buildTitanLevelErrorResult([
					{
						summary: /* @__PURE__ */ new Map(),
						evolutionSummary: /* @__PURE__ */ new Map(),
						spentAmount: 0,
						leftAmount: potionAmount,
						potionAmountBought: 0,
						potionCoinSpentAmount: 0,
						potionCoinLeftAmount: soulCoinAmount
					},
					resourceName,
					error
				]));
				return;
			}
			const effectivePotionAmount = potionAmount + purchasePlan.potionAmountBought;
			const plan = buildTitanLevelPlan([
				sanitizedTitanIds,
				ownedTitans,
				effectivePotionAmount,
				settings.potionReserve,
				settings.titanLevelCaps,
				options === null || options === void 0 ? void 0 : options.maxUpgradeCount,
				settings.upgradeMode
			]);
			if (plan.queue.length <= 0 && evolutionPlan.evolutions.length <= 0 && purchasePlan.purchases.length <= 0) {
				showFinalProgress(...buildTitanRunWarningResult(translate("HWHTITANLVL_NOTHING_TO_LEVEL"), translate("HWHTITANTRAINER_RUN_NOTHING_TO_DO")));
				return;
			}
			const executedPlan = {
				summary: /* @__PURE__ */ new Map(),
				evolutionSummary: /* @__PURE__ */ new Map(),
				spentAmount: 0,
				leftAmount: potionAmount,
				potionAmountBought: 0,
				potionCoinSpentAmount: 0,
				potionCoinLeftAmount: soulCoinAmount
			};
			try {
				await runTitanLevelExecutionSequence({
					evolutionPlan,
					plan,
					executedPlan,
					potionAmount: effectivePotionAmount,
					purchasePlan
				});
			} catch (error) {
				logError("[TitanLevel] Error:", error);
				showFinalProgress(...buildTitanLevelErrorResult([
					executedPlan,
					resourceName,
					error
				]));
				return;
			}
			showProgressMessage(translate("HWHTITAN_PROGRESS_SYNCING"), "syncing");
			await refreshTitanSnapshotAfterRun();
			showFinalProgress(...buildTitanLevelSuccessResult([
				executedPlan,
				resourceName,
				plan.queue.length + evolutionPlan.evolutions.length + purchasePlan.purchases.length,
				settings,
				options
			]));
		}
		return [runTitanSkinLeveling, runTitanLeveling];
	}
	//#endregion
	//#region src/shared/ui/accordion-state.ts
	function normalizeAccordionStateKey(value) {
		return String(value !== null && value !== void 0 ? value : "").trim();
	}
	function normalizeAccordionFilterMode(value) {
		const normalizedMode = normalizeAccordionStateKey(value);
		return normalizedMode === "active" || normalizedMode === "inactive" ? normalizedMode : "";
	}
	function normalizeAccordionStateMap(state) {
		if (!isPlainObject(state)) return {};
		return Object.entries(state).reduce((result, [accordionKey, isOpen]) => {
			const normalizedKey = normalizeAccordionStateKey(accordionKey);
			if (normalizedKey) result[normalizedKey] = !!isOpen;
			return result;
		}, {});
	}
	function normalizeAccordionFilterStateMap(state) {
		if (!isPlainObject(state)) return {};
		return Object.entries(state).reduce((result, [accordionKey, filterMode]) => {
			const normalizedKey = normalizeAccordionStateKey(accordionKey);
			const normalizedFilterMode = normalizeAccordionFilterMode(filterMode);
			if (normalizedKey && normalizedFilterMode) result[normalizedKey] = normalizedFilterMode;
			return result;
		}, {});
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/accordion-state.ts
	function createTitanAccordionStateController(accordionStateStorage, accordionFilterStorage, ensureUserIdReady) {
		let accordionUiStateUserId = "";
		let accordionStateCache = {};
		let accordionFilterStateCache = {};
		function persistTitanAccordionState(accordionKey, isOpen) {
			const normalizedKey = normalizeAccordionStateKey(accordionKey);
			if (!normalizedKey || !accordionUiStateUserId) return;
			accordionStateCache = normalizeAccordionStateMap({
				...accordionStateCache,
				[normalizedKey]: !!isOpen
			});
			accordionStateStorage.write(accordionUiStateUserId, accordionStateCache).catch((error) => console.warn("[TitanArtifact] accordion state write failed", error));
		}
		function persistTitanAccordionFilterState(accordionKey, filterMode) {
			const normalizedKey = normalizeAccordionStateKey(accordionKey);
			if (!normalizedKey || !accordionUiStateUserId) return;
			const nextState = { ...accordionFilterStateCache };
			const normalizedFilterMode = normalizeAccordionFilterMode(filterMode);
			if (normalizedFilterMode) nextState[normalizedKey] = normalizedFilterMode;
			else delete nextState[normalizedKey];
			accordionFilterStateCache = normalizeAccordionFilterStateMap(nextState);
			accordionFilterStorage.write(accordionUiStateUserId, accordionFilterStateCache);
		}
		async function getTitanAccordionUiProps() {
			const userIdValue = String(await ensureUserIdReady());
			if (accordionUiStateUserId !== userIdValue) {
				accordionUiStateUserId = userIdValue;
				accordionStateCache = normalizeAccordionStateMap(await accordionStateStorage.read(userIdValue, {}));
				accordionFilterStateCache = normalizeAccordionFilterStateMap(accordionFilterStorage.read(userIdValue, {}));
			}
			return {
				accordionState: { ...accordionStateCache },
				accordionFilterState: { ...accordionFilterStateCache },
				onAccordionStateChange: persistTitanAccordionState,
				onAccordionFilterChange: persistTitanAccordionFilterState
			};
		}
		return {
			getTitanAccordionUiProps,
			persistTitanAccordionState,
			persistTitanAccordionFilterState
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/trainer-actions.ts
	function normalizeTrainerAction(value) {
		if (value === false || value == null) return "";
		return String(value !== null && value !== void 0 ? value : "").trim();
	}
	function getTitanTrainerRunBlockReason(activeTab, targetCounts) {
		if (activeTab === "artifacts") return targetCounts.artifacts > 0 ? null : "selection";
		if (activeTab === "levels") return targetCounts.levels > 0 || targetCounts.levelEvolutions > 0 ? null : "selection";
		if (activeTab === "skins") return targetCounts.skins > 0 ? null : "selection";
		return "tab";
	}
	function dispatchTitanTrainerToolbarAction(result, handlers) {
		const action = normalizeTrainerAction(result);
		if (action === "exportSettings") {
			handlers.exportSettings();
			return true;
		}
		if (action === "dumpGameLibrary") {
			handlers.dumpGameLibrary();
			return true;
		}
		if (action === "saveSettings") {
			handlers.saveSettings();
			return true;
		}
		if (action === "selectAll") {
			handlers.selectAll();
			return true;
		}
		if (action === "clearAll") {
			handlers.clearAll();
			return true;
		}
		return false;
	}
	function createTitanTrainerToolbarActionHandlers({ saveSettings, persistSettings, exportSettings, dumpGameLibrary, selectAll, clearAll }) {
		return {
			saveSettings: () => {
				saveSettings();
			},
			exportSettings: () => {
				Promise.resolve(persistSettings()).then(() => exportSettings());
			},
			dumpGameLibrary,
			selectAll: () => {
				selectAll();
			},
			clearAll: () => {
				clearAll();
			}
		};
	}
	function createTitanTrainerModalAnswerHandlers({ getActiveTab, getArtifactSettings, setArtifactSettings, setLevelSettings, setSkinSettings, persistSettings, saveSettings, selectAll, clearAll, exportSettings, donate, help, dumpGameLibrary, importSettings, readArtifactSettings, readLevelSettings, readSkinSettings, reportImportError, runArtifact, runLevel, runSkin }) {
		return {
			persistSettings,
			saveSettings,
			selectAll,
			clearAll,
			exportSettings: async () => {
				await persistSettings();
				await exportSettings();
			},
			donate: () => donate(getArtifactSettings()),
			help: () => help(getArtifactSettings()),
			dumpGameLibrary,
			importSettings: async () => {
				try {
					if (await importSettings()) {
						setArtifactSettings(await readArtifactSettings());
						setLevelSettings(await readLevelSettings());
						setSkinSettings(await readSkinSettings());
						await persistSettings();
					}
				} catch (error) {
					reportImportError(error);
				}
			},
			run: async () => {
				await persistSettings();
				const activeTab = getActiveTab();
				if (activeTab === "levels") return runLevel();
				if (activeTab === "skins") return runSkin();
				return runArtifact();
			}
		};
	}
	function createTitanTrainerRunHandler({ getSettings, resolveRunOptions, run }) {
		return async () => {
			const settings = getSettings();
			const runOptions = await resolveRunOptions(settings);
			if (!runOptions.confirmed) return "continue";
			await run(settings, runOptions.options);
			return "return";
		};
	}
	function createTitanTrainerChecklistRunTask({ readSettings, resolveRunOptions, run }) {
		return async () => {
			const settings = await readSettings();
			const runOptions = await resolveRunOptions(settings, { source: "checklist" });
			if (!runOptions.confirmed) return;
			await run(settings, runOptions.options);
		};
	}
	async function processTitanTrainerModalAnswer({ activeTab, answer, handlers }) {
		const normalizedAnswer = normalizeTrainerAction(answer);
		if (!normalizedAnswer) return "return";
		if (activeTab === "general" && [
			"selectAll",
			"clearAll",
			"run"
		].includes(normalizedAnswer)) {
			await handlers.persistSettings();
			return "continue";
		}
		if (normalizedAnswer === "selectAll") {
			await handlers.selectAll();
			return "continue";
		}
		if (normalizedAnswer === "clearAll") {
			await handlers.clearAll();
			return "continue";
		}
		if (normalizedAnswer === "saveSettings") {
			await handlers.saveSettings();
			return "continue";
		}
		if (normalizedAnswer === "exportSettings") {
			await handlers.exportSettings();
			return "continue";
		}
		if (normalizedAnswer === "donate") {
			await handlers.donate();
			return "continue";
		}
		if (normalizedAnswer === "help") {
			await handlers.help();
			return "continue";
		}
		if (normalizedAnswer === "dumpGameLibrary") {
			await handlers.dumpGameLibrary();
			return "continue";
		}
		if (normalizedAnswer === "importSettings") {
			await handlers.importSettings();
			return "continue";
		}
		if (normalizedAnswer === "run") return handlers.run();
		return "continue";
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/trainer-run-action.ts
	function createTitanTrainerRunActionSynchronizer([getActiveTab, getArtifactSettings, getLevelSettings, getSkinSettings, ownedTitans, sanitizeSelectedTitanIds, translate, patchAction]) {
		return () => {
			const activeTab = getActiveTab();
			const artifactSettings = getArtifactSettings();
			const levelSettings = getLevelSettings();
			const skinSettings = getSkinSettings();
			const blockReason = getTitanTrainerRunBlockReason(activeTab, {
				artifacts: sanitizeSelectedTitanIds(artifactSettings.selectedTitanIds, ownedTitans).length,
				levels: sanitizeSelectedTitanIds(levelSettings.selectedTitanIds, ownedTitans).length,
				levelEvolutions: sanitizeSelectedTitanIds(levelSettings.selectedTitanEvolutionIds, ownedTitans).length,
				skins: sanitizeSelectedTitanIds(skinSettings.selectedTitanIds, ownedTitans).length
			});
			patchAction("run", {
				disabled: blockReason !== null,
				tooltip: resolveRunBlockTooltip(activeTab, blockReason, translate)
			});
		};
	}
	function resolveRunBlockTooltip(activeTab, blockReason, translate) {
		if (blockReason === "tab") return translate("HWHTITANTRAINER_RUN_SELECT_TAB");
		if (blockReason !== "selection") return;
		if (activeTab === "levels") return translate("HWHTITANLVL_SELECT_TITANS_FIRST");
		if (activeTab === "skins") return translate("HWHTITANSKIN_SELECT_TITANS_FIRST");
		return translate("HWHTITANART_SELECT_TITANS_FIRST");
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/settings-save-feedback.ts
	function createTitanTrainerSettingsSaveHandler({ persistSettings, showToast, translate, reportError = reportSettingsSaveError }) {
		return async () => {
			try {
				await persistSettings();
				showToast({
					id: "hwhtitanartifact-settings-save",
					title: translate("HWHTITANART_SAVE_SETTINGS"),
					text: translate("HWHTITANART_SETTINGS_SAVED"),
					tone: "success"
				});
			} catch (error) {
				reportError(error);
				showToast({
					id: "hwhtitanartifact-settings-save",
					title: translate("HWHTITANART_SAVE_SETTINGS"),
					text: translate("HWHTITANART_SETTINGS_ERROR"),
					tone: "danger"
				});
			}
		};
	}
	function reportSettingsSaveError(error) {
		console.error("[TitanTrainer] settings save failed", error);
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
	//#region src/scripts/hwhtitanartifact/ui/lite/native-trainer-view.ts
	function renderNativeTitanTrainer(props) {
		var _ref, _props$activeTab, _tabs$;
		const root = document.createElement("div");
		root.className = "hwhx-native-body hwhx-popup hwhx-titan-trainer-lite";
		const tabs = toNativeRecordList(props.tabs);
		let activeTab = String((_ref = (_props$activeTab = props.activeTab) !== null && _props$activeTab !== void 0 ? _props$activeTab : (_tabs$ = tabs[0]) === null || _tabs$ === void 0 ? void 0 : _tabs$.value) !== null && _ref !== void 0 ? _ref : "");
		const navigation = document.createElement("nav");
		navigation.className = "hwhx-tabs__nav";
		const content = document.createElement("div");
		content.className = "hwhx-tabs__panels";
		root.append(navigation, content);
		const renderNavigation = () => {
			for (const tab of tabs) {
				var _tab$value, _tab$label;
				const value = String((_tab$value = tab.value) !== null && _tab$value !== void 0 ? _tab$value : "");
				const button = document.createElement("button");
				button.type = "button";
				button.className = "hwhx-button hwhx-tabs__tab";
				button.classList.toggle("is-active", value === activeTab);
				button.textContent = String((_tab$label = tab.label) !== null && _tab$label !== void 0 ? _tab$label : value);
				button.disabled = !!tab.disabled;
				button.addEventListener("click", () => {
					if (value === activeTab) return;
					activeTab = value;
					call(props.onActiveTabChange, value);
					for (const tabButton of navigation.querySelectorAll(".hwhx-tabs__tab")) tabButton.classList.toggle("is-active", tabButton.dataset.value === activeTab);
					renderContent();
				});
				button.dataset.value = value;
				navigation.appendChild(button);
			}
		};
		const renderContent = () => {
			content.replaceChildren(renderActiveTab());
		};
		let renderQueued = false;
		const scheduleRender = () => {
			if (renderQueued) return;
			renderQueued = true;
			queueMicrotask(() => {
				renderQueued = false;
				renderContent();
			});
		};
		const renderActiveTab = () => {
			var _tabs$find;
			const tab = (_tabs$find = tabs.find((entry) => {
				var _entry$value;
				return String((_entry$value = entry.value) !== null && _entry$value !== void 0 ? _entry$value : "") === activeTab;
			})) !== null && _tabs$find !== void 0 ? _tabs$find : {};
			if (tab.kind === "general") return renderGeneralTab(tab, props, scheduleRender);
			return renderBodyModel(toNativeRecord(toNativeRecord(tab.contentProps).model), props, scheduleRender);
		};
		renderNavigation();
		renderContent();
		return root;
	}
	function renderGeneralTab(tab, rootProps, scheduleRender) {
		var _artifact$progressWin, _artifact$progressWin2;
		const props = toNativeRecord(tab.generalProps);
		const labels = toNativeRecord(props.labels);
		const options = toNativeRecord(props.options);
		const artifact = { ...toNativeRecord(props.artifactSettings) };
		const level = { ...toNativeRecord(props.levelSettings) };
		const skin = { ...toNativeRecord(props.skinSettings) };
		const root = document.createElement("div");
		root.className = "hwhx-settings-grid";
		const behavior = createNativeDetails(text(labels, "interfaceTitle", "Интерфейс"), true);
		behavior.body.append(createNativeSelectRow(text(labels, "buttonPlacement", "Положение кнопки"), artifact.titanTrainerButtonPlacement, toNativeRecordList(options.buttonPlacement), (value) => updateSettings(artifact, "titanTrainerButtonPlacement", value, rootProps.onArtifactSettingsChange)), createNativeCheckboxRow(text(labels, "showFullCost", "Полная стоимость артефактов"), artifact.showFullCosts, (value) => updateSettings(artifact, "showFullCosts", value, rootProps.onArtifactSettingsChange)), createNativeCheckboxRow(text(labels, "showLevelCost", "Стоимость уровней"), level.showNextCosts, (value) => updateSettings(level, "showNextCosts", value, rootProps.onLevelSettingsChange)), createNativeCheckboxRow(text(labels, "showSkinCost", "Стоимость обликов"), skin.showNextCosts, (value) => updateSettings(skin, "showNextCosts", value, rootProps.onSkinSettingsChange)), createNativeCheckboxRow(text(labels, "showLevelEvolution", "Эволюция титанов"), level.showEvolutionProgress, (value) => updateSettings(level, "showEvolutionProgress", value, rootProps.onLevelSettingsChange)));
		root.appendChild(behavior.root);
		root.appendChild(createNativeProgressOptionsSection({
			value: {
				autoHide: !!artifact.progressAutoHideResult,
				autoHideMs: Number(artifact.progressAutoHideResultTimeoutMs) || 5e3,
				position: String((_artifact$progressWin = artifact.progressWindowPosition) !== null && _artifact$progressWin !== void 0 ? _artifact$progressWin : "top-right"),
				style: String((_artifact$progressWin2 = artifact.progressWindowStyle) !== null && _artifact$progressWin2 !== void 0 ? _artifact$progressWin2 : "default")
			},
			labels: {
				title: text(labels, "progressTitle", "Информационная панель"),
				autoHide: text(labels, "progressAutoHide", "Скрывать результат"),
				autoHideMs: text(labels, "progressTimeout", "Таймаут, мс"),
				position: text(labels, "progressPosition", "Положение"),
				style: text(labels, "progressStyle", "Стиль")
			},
			positionOptions: toNativeRecordList(options.progressPosition),
			styleOptions: toNativeRecordList(options.progressStyle),
			onUpdate: (value) => {
				Object.assign(artifact, {
					progressAutoHideResult: value.autoHide,
					progressAutoHideResultTimeoutMs: value.autoHideMs,
					progressWindowPosition: value.position,
					progressWindowStyle: value.style
				});
				call(rootProps.onArtifactSettingsChange, { ...artifact });
			}
		}));
		scheduleRenderAfterInput(root, scheduleRender);
		return root;
	}
	function renderBodyModel(model, rootProps, scheduleRender) {
		var _model$kind;
		const root = document.createElement("div");
		root.className = "hwhx-settings-grid hwhx-titan-body-panel";
		root.dataset.hwhtitanBodyKind = String((_model$kind = model.kind) !== null && _model$kind !== void 0 ? _model$kind : "unknown");
		const header = toNativeRecord(model.header);
		if (header.title || header.description) {
			const panel = document.createElement("section");
			panel.className = "hwhx-panel";
			panel.append(createNativeText("strong", "hwhx-section-title", header.title), createNativeText("p", "", header.description));
			root.appendChild(panel);
		}
		const priority = toNativeRecord(model.priority);
		if (priority.kind) root.appendChild(renderPriority(priority, model, rootProps, scheduleRender));
		for (const section of toNativeRecordList(model.sections)) root.appendChild(renderControlSection(section, model, rootProps, scheduleRender));
		const calculator = toNativeRecord(model.calculator);
		if (calculator.key || calculator.title) {
			const details = renderControlSection(calculator, model, rootProps, scheduleRender);
			const result = toNativeRecord(calculator.result);
			if (Object.keys(result).length > 0) {
				var _details$querySelecto;
				(_details$querySelecto = details.querySelector(".hwhx-accordion__body")) === null || _details$querySelecto === void 0 || _details$querySelecto.appendChild(renderRecordSummary(result));
			}
			root.appendChild(details);
		}
		const doYourBest = toNativeRecord(model.doYourBest);
		if (doYourBest.key || doYourBest.title) root.appendChild(renderControlSection(doYourBest, model, rootProps, scheduleRender));
		return root;
	}
	function renderPriority(model, bodyModel, rootProps, scheduleRender) {
		var _model$title;
		const details = createNativeDetails(String((_model$title = model.title) !== null && _model$title !== void 0 ? _model$title : "Титаны"), model.defaultOpen !== false);
		const badges = toNativeRecordList(model.badges);
		if (badges.length > 0) {
			const badgeRow = document.createElement("div");
			badgeRow.className = "hwhx-badges";
			for (const badge of badges) badgeRow.appendChild(createNativeText("span", "hwhx-badge", badge.text));
			details.body.appendChild(badgeRow);
		}
		if (model.note) details.body.appendChild(createNativeText("p", "hwhx-hint", model.note));
		const rows = toNativeRecordList(model.rows);
		const list = document.createElement("div");
		list.className = "hwhx-reorder-list";
		rows.forEach((row, index) => {
			list.appendChild(renderPriorityRow(row, index, rows, model, bodyModel, rootProps, scheduleRender));
		});
		details.body.appendChild(list);
		return details.root;
	}
	function renderPriorityRow(row, index, rows, priority, bodyModel, rootProps, scheduleRender) {
		var _ref2, _option$name, _ref3, _row$childrenTitle;
		const container = document.createElement("div");
		container.className = "hwhx-checkbox-row hwhx-titan-priority-row";
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.className = "hwhx-checkbox-input";
		checkbox.checked = !!row.checked;
		checkbox.disabled = !!row.disabled;
		const option = toNativeRecord(row.option);
		const label = createNativeText("span", "hwhx-checkbox-label", (_ref2 = (_option$name = option.name) !== null && _option$name !== void 0 ? _option$name : row.label) !== null && _ref2 !== void 0 ? _ref2 : row.key);
		container.append(checkbox, label);
		if (row.capInputId) container.appendChild(createNativeNumberInput(row.capValue, 1, row.capMaxValue, (value) => {
			row.capValue = value;
			emitPriorityChange(priority, bodyModel, rows, rootProps);
			scheduleRender();
		}));
		if (priority.kind === "priority" && !priority.reorderDisabled) container.append(createMoveButton("↑", index <= 0, () => movePriorityRow(rows, index, -1, priority, bodyModel, rootProps, scheduleRender)), createMoveButton("↓", index >= rows.length - 1, () => movePriorityRow(rows, index, 1, priority, bodyModel, rootProps, scheduleRender)));
		checkbox.addEventListener("change", () => {
			row.checked = checkbox.checked;
			emitPriorityChange(priority, bodyModel, rows, rootProps);
			scheduleRender();
		});
		const children = toNativeRecordList(row.children);
		if (children.length === 0) return container;
		const group = document.createElement("details");
		group.className = "hwhx-accordion hwhx-accordion--nested";
		const summary = document.createElement("summary");
		summary.className = "hwhx-accordion__summary";
		summary.textContent = String((_ref3 = (_row$childrenTitle = row.childrenTitle) !== null && _row$childrenTitle !== void 0 ? _row$childrenTitle : option.name) !== null && _ref3 !== void 0 ? _ref3 : row.key);
		const body = document.createElement("div");
		body.className = "hwhx-accordion__body";
		body.appendChild(container);
		children.forEach((child) => {
			var _child$label;
			const childRow = document.createElement("label");
			childRow.className = "hwhx-checkbox-row";
			const childCheckbox = document.createElement("input");
			childCheckbox.type = "checkbox";
			childCheckbox.className = "hwhx-checkbox-input";
			childCheckbox.checked = !!child.checked;
			childCheckbox.disabled = !!child.disabled;
			childCheckbox.addEventListener("change", () => {
				child.checked = childCheckbox.checked;
				emitPriorityChange(priority, bodyModel, rows, rootProps);
				scheduleRender();
			});
			childRow.append(childCheckbox, createNativeText("span", "hwhx-checkbox-label", (_child$label = child.label) !== null && _child$label !== void 0 ? _child$label : child.key), createNativeNumberInput(child.capValue, 1, child.capMaxValue, (value) => {
				child.capValue = value;
				emitPriorityChange(priority, bodyModel, rows, rootProps);
				scheduleRender();
			}));
			body.appendChild(childRow);
		});
		group.append(summary, body);
		return group;
	}
	function renderControlSection(section, bodyModel, rootProps, scheduleRender) {
		var _ref4, _section$title;
		const details = createNativeDetails(String((_ref4 = (_section$title = section.title) !== null && _section$title !== void 0 ? _section$title : section.key) !== null && _ref4 !== void 0 ? _ref4 : "Настройки"), section.defaultOpen !== false);
		for (const control of toNativeRecordList(section.controls)) if (control.kind === "group") {
			var _control$className;
			const group = document.createElement("div");
			group.className = String((_control$className = control.className) !== null && _control$className !== void 0 ? _control$className : "hwhx-stack");
			for (const nested of toNativeRecordList(control.controls)) group.appendChild(renderControl(nested, bodyModel, rootProps, scheduleRender));
			details.body.appendChild(group);
		} else details.body.appendChild(renderControl(control, bodyModel, rootProps, scheduleRender));
		return details.root;
	}
	function renderControl(control, bodyModel, rootProps, scheduleRender) {
		var _control$inputId;
		if (control.kind === "hint") return createNativeText("div", "hwhx-hint", control.text);
		const inputId = String((_control$inputId = control.inputId) !== null && _control$inputId !== void 0 ? _control$inputId : "");
		const notify = (value) => {
			var _bodyModel$kind, _control$kind;
			control.value = value;
			control.checked = value;
			control.values = value;
			call(rootProps.onControlChange, {
				panelKind: String((_bodyModel$kind = bodyModel.kind) !== null && _bodyModel$kind !== void 0 ? _bodyModel$kind : ""),
				inputId,
				controlKind: String((_control$kind = control.kind) !== null && _control$kind !== void 0 ? _control$kind : ""),
				value
			});
			scheduleRender();
		};
		if (control.kind === "checkbox") return createNativeCheckboxRow(control.label, control.checked, notify, !!control.disabled);
		if (control.kind === "number") return createNativeNumberRow(control.label, control.value, control.minValue, control.maxValue, notify);
		if (control.kind === "multiSelect") {
			const options = toNativeRecordList(control.groups).flatMap((group) => toNativeRecordList(group.options));
			return createMultiSelectRow(control.label, control.values, options, notify);
		}
		return createNativeSelectRow(control.label, control.value, flattenOptions(control.options), notify);
	}
	function emitPriorityChange(priority, bodyModel, rows, rootProps) {
		var _bodyModel$kind2, _priority$stateKey, _priority$accordionKe, _priority$optionVaria;
		call(rootProps.onPriorityChange, {
			panelKind: String((_bodyModel$kind2 = bodyModel.kind) !== null && _bodyModel$kind2 !== void 0 ? _bodyModel$kind2 : ""),
			kind: priority.kind,
			stateKey: String((_priority$stateKey = priority.stateKey) !== null && _priority$stateKey !== void 0 ? _priority$stateKey : ""),
			accordionKey: String((_priority$accordionKe = priority.accordionKey) !== null && _priority$accordionKe !== void 0 ? _priority$accordionKe : ""),
			optionVariant: String((_priority$optionVaria = priority.optionVariant) !== null && _priority$optionVaria !== void 0 ? _priority$optionVaria : ""),
			changedInputId: "lite-priority",
			selectedTitanIds: rows.filter((row) => row.checked && !row.disabled).map((row) => Number(row.titanId)).filter(Number.isFinite),
			rows: rows.map((row) => {
				var _row$key, _ref5, _row$orderKey;
				return {
					key: String((_row$key = row.key) !== null && _row$key !== void 0 ? _row$key : ""),
					orderKey: String((_ref5 = (_row$orderKey = row.orderKey) !== null && _row$orderKey !== void 0 ? _row$orderKey : row.key) !== null && _ref5 !== void 0 ? _ref5 : ""),
					titanId: Number(row.titanId),
					checked: !!row.checked,
					disabled: !!row.disabled,
					capValue: Math.max(0, Number(row.capValue) || 0),
					children: toNativeRecordList(row.children).map((child) => {
						var _child$key, _ref6, _child$orderKey;
						return {
							key: String((_child$key = child.key) !== null && _child$key !== void 0 ? _child$key : ""),
							orderKey: String((_ref6 = (_child$orderKey = child.orderKey) !== null && _child$orderKey !== void 0 ? _child$orderKey : child.key) !== null && _ref6 !== void 0 ? _ref6 : ""),
							checked: !!child.checked,
							disabled: !!child.disabled,
							capValue: Math.max(0, Number(child.capValue) || 0)
						};
					})
				};
			})
		});
	}
	function movePriorityRow(rows, index, delta, priority, bodyModel, rootProps, scheduleRender) {
		const targetIndex = index + delta;
		if (targetIndex < 0 || targetIndex >= rows.length) return;
		[rows[index], rows[targetIndex]] = [rows[targetIndex], rows[index]];
		emitPriorityChange(priority, bodyModel, rows, rootProps);
		scheduleRender();
	}
	function createMultiSelectRow(label, values, options, onChange) {
		const selected = new Set(Array.isArray(values) ? values.map(String) : []);
		const row = createNativeFieldRow(label);
		const select = document.createElement("select");
		select.className = "hwhx-field hwhx-select";
		select.multiple = true;
		select.size = Math.min(8, Math.max(3, options.length));
		for (const option of options) {
			var _option$value, _option$label;
			const element = document.createElement("option");
			element.value = String((_option$value = option.value) !== null && _option$value !== void 0 ? _option$value : "");
			element.textContent = stripNativeMarkup((_option$label = option.label) !== null && _option$label !== void 0 ? _option$label : option.value);
			element.selected = selected.has(element.value);
			element.disabled = !!option.disabled;
			select.appendChild(element);
		}
		select.addEventListener("change", () => onChange([...select.selectedOptions].map((option) => option.value)));
		row.appendChild(select);
		return row;
	}
	function createMoveButton(label, disabled, action) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "hwhx-button";
		button.textContent = label;
		button.disabled = disabled;
		button.addEventListener("click", action);
		return button;
	}
	function renderRecordSummary(value) {
		const root = document.createElement("div");
		root.className = "hwhx-info-list";
		for (const [key, entry] of Object.entries(value)) {
			if (entry === null || typeof entry === "object") continue;
			const row = document.createElement("div");
			row.className = "hwhx-info-list__row";
			row.append(createNativeText("span", "hwhx-info-list__label", key), createNativeText("strong", "hwhx-info-list__value", entry));
			root.appendChild(row);
		}
		return root;
	}
	function updateSettings(draft, key, value, callback) {
		draft[key] = value;
		call(callback, { ...draft });
	}
	function scheduleRenderAfterInput(root, scheduleRender) {
		root.addEventListener("change", scheduleRender, { once: true });
	}
	function flattenOptions(value) {
		return toNativeRecordList(value).flatMap((entry) => Array.isArray(entry.options) ? toNativeRecordList(entry.options) : [entry]);
	}
	function text(labels, key, fallback) {
		var _labels$key;
		return String((_labels$key = labels[key]) !== null && _labels$key !== void 0 ? _labels$key : fallback);
	}
	function call(callback, ...args) {
		return typeof callback === "function" ? callback(...args) : void 0;
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/lite/trainer-popup.ts
	var NativeTitanTrainer = defineNativeView("titan-trainer", renderNativeTitanTrainer);
	var TITAN_TRAINER_POPUP_KIND = "titan-trainer";
	var TITAN_TRAINER_MODAL_CLASS_NAME = "hwhx-popup--xwide";
	function createTitanTrainerSelectionCommandState() {
		return {
			serial: 0,
			panelKind: "",
			checked: false
		};
	}
	function createTitanTrainerSelectionPreviewState() {
		return {
			serial: 0,
			panelKind: "",
			gainText: ""
		};
	}
	function issueTitanTrainerSelectionCommand(command, activeTab, checked) {
		const panelKind = getTitanTrainerPanelKindForTab(activeTab);
		if (!panelKind) return false;
		command.serial += 1;
		command.panelKind = panelKind;
		command.checked = !!checked;
		return true;
	}
	function issueTitanTrainerSelectionPreview(preview, activeTab, gainText) {
		const panelKind = getTitanTrainerPanelKindForTab(activeTab);
		if (!panelKind) return false;
		preview.serial += 1;
		preview.panelKind = panelKind;
		preview.gainText = String(gainText !== null && gainText !== void 0 ? gainText : "");
		return true;
	}
	function getTitanTrainerPanelKindForTab(activeTab) {
		if (activeTab === "levels") return "level";
		if (activeTab === "skins") return "skin";
		return activeTab === "artifacts" ? "artifact" : "";
	}
	function buildTitanTrainerRootAttrs() {
		return { "data-hwhtitan-lite-settings-panel": "" };
	}
	function buildTitanTrainerTabsProps(options) {
		return {
			activeTab: options.activeTab,
			tabInputId: TITAN_TRAINER_TAB_INPUT_ID,
			tabs: options.tabs,
			selectionCommand: options.selectionCommand,
			selectionPreview: options.selectionPreview,
			rootAttrs: buildTitanTrainerRootAttrs(),
			onActiveTabChange: options.onActiveTabChange,
			onArtifactSettingsChange: options.onArtifactSettingsChange,
			onLevelSettingsChange: options.onLevelSettingsChange,
			onSkinSettingsChange: options.onSkinSettingsChange,
			onControlChange: options.onControlChange,
			onPriorityChange: options.onPriorityChange
		};
	}
	function buildTitanTrainerTabsModel(activeTab, translate) {
		return {
			activeTab,
			tabs: [
				createTab(TITAN_TRAINER_TAB_GENERAL, "HWHTITANTRAINER_TAB_GENERAL", "general"),
				createTab(TITAN_TRAINER_TAB_ARTIFACTS, "HWHTITANTRAINER_TAB_ARTIFACTS"),
				createTab(TITAN_TRAINER_TAB_LEVELS, "HWHTITANTRAINER_TAB_LEVELS"),
				createTab(TITAN_TRAINER_TAB_SKINS, "HWHTITANTRAINER_TAB_SKINS")
			]
		};
		function createTab(value, key, kind) {
			return {
				value,
				label: translate(key),
				kind
			};
		}
	}
	function buildTitanTrainerModalActions(translate) {
		return [
			{
				result: "donate",
				label: translate("HWHTITANTRAINER_DONATE_TITLE"),
				tone: "secondary",
				placement: "left"
			},
			{
				result: "saveSettings",
				label: translate("HWHTITANART_SAVE_SETTINGS"),
				tone: "success",
				closeOnClick: false
			},
			{
				result: "run",
				label: translate("HWHTITANTRAINER_RUN_ACTIVE"),
				tone: "primary"
			}
		];
	}
	function openTitanTrainerTabsModal(options) {
		return openNativeComponentModal({
			kind: TITAN_TRAINER_POPUP_KIND,
			title: options.title,
			header: options.header,
			headerActions: options.headerActions,
			component: NativeTitanTrainer,
			props: buildTitanTrainerTabsProps(options),
			actions: buildTitanTrainerModalActions(options.translate),
			className: TITAN_TRAINER_MODAL_CLASS_NAME,
			closeLabel: options.closeLabel,
			onBeforeClose: options.onBeforeClose,
			onAction: options.onAction
		});
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/trainer-general-tab.ts
	function buildTitanTrainerGeneralTabProps([translate, artifactSettings, levelSettings, skinSettings]) {
		return {
			artifactSettings,
			levelSettings,
			skinSettings,
			ids: {
				uiTooltips: UI_TOOLTIPS_INPUT_ID,
				buttonPlacement: TITAN_TRAINER_BUTTON_PLACEMENT_INPUT_ID,
				accordionAutoScroll: ACCORDION_AUTO_SCROLL_MODE_INPUT_ID,
				reorderListVariant: REORDER_LIST_VARIANT_INPUT_ID,
				showFullCost: SHOW_FULL_COST_INPUT_ID,
				showLevelCost: SHOW_LEVEL_COST_INPUT_ID,
				showSkinCost: SHOW_SKIN_COST_INPUT_ID,
				showLevelEvolution: SHOW_LEVEL_EVOLUTION_INPUT_ID,
				hotkeyOpenSettings: HOTKEY_OPEN_SETTINGS_INPUT_ID,
				hotkeyRunAll: HOTKEY_RUN_ALL_INPUT_ID,
				hotkeyRunArtifacts: HOTKEY_RUN_ARTIFACTS_INPUT_ID,
				hotkeyRunLevels: HOTKEY_RUN_LEVELS_INPUT_ID,
				hotkeyRunSkins: HOTKEY_RUN_SKINS_INPUT_ID
			},
			labels: {
				interfaceTitle: translate("HWHTITANTRAINER_INTERFACE_SECTION"),
				selectSearch: translate("HWHTITANART_MULTISELECT_SEARCH"),
				selectEmpty: translate("HWHTITANART_SELECT_EMPTY"),
				uiTooltips: translate("HWHTITANTRAINER_UI_TOOLTIPS"),
				uiTooltipsTooltip: translate("HWHTITAN_TOOLTIP_UI_TOOLTIPS"),
				buttonPlacement: translate("HWHTITANTRAINER_BUTTON_PLACEMENT_LABEL"),
				buttonPlacementTooltip: translate("HWHTITAN_TOOLTIP_BUTTON_PLACEMENT"),
				accordionAutoScroll: translate("HWHTITANTRAINER_ACCORDION_AUTO_SCROLL"),
				accordionAutoScrollTooltip: translate("HWHTITANTRAINER_ACCORDION_AUTO_SCROLL_HINT"),
				reorderListVariant: translate("HWHTITANTRAINER_REORDER_LIST_VARIANT"),
				showFullCost: translate("HWHTITANART_SHOW_FULL_COST"),
				showFullCostTooltip: translate("HWHTITAN_TOOLTIP_SHOW_FULL_COST"),
				showLevelCost: translate("HWHTITANLVL_SHOW_NEXT_COST"),
				showLevelCostTooltip: translate("HWHTITAN_TOOLTIP_SHOW_LEVEL_COST"),
				showSkinCost: translate("HWHTITANSKIN_SHOW_NEXT_COST"),
				showSkinCostTooltip: translate("HWHTITAN_TOOLTIP_SHOW_SKIN_COST"),
				showLevelEvolution: translate("HWHTITANLVL_SHOW_EVOLUTION"),
				showLevelEvolutionTooltip: translate("HWHTITAN_TOOLTIP_SHOW_LEVEL_EVOLUTION"),
				progressAutoHide: translate("HWHTITANTRAINER_PROGRESS_AUTO_HIDE_RESULT"),
				progressTimeout: translate("HWHTITANTRAINER_PROGRESS_AUTO_HIDE_TIMEOUT"),
				progressPosition: translate("HWHTITANTRAINER_PROGRESS_POSITION"),
				progressStyle: translate("HWHTITANTRAINER_PROGRESS_STYLE"),
				progressTitle: translate("HWHTITANTRAINER_PROGRESS_WINDOW_SECTION"),
				hotkeysTitle: translate("HWHTITANTRAINER_HOTKEYS_SECTION"),
				hotkeyOpenSettings: translate("HWHTITANTRAINER_HOTKEY_OPEN_SETTINGS"),
				hotkeyRunAll: translate("HWHTITANTRAINER_HOTKEY_RUN_ALL"),
				hotkeyRunArtifacts: translate("HWHTITANTRAINER_HOTKEY_RUN_ARTIFACTS"),
				hotkeyRunLevels: translate("HWHTITANTRAINER_HOTKEY_RUN_LEVELS"),
				hotkeyRunSkins: translate("HWHTITANTRAINER_HOTKEY_RUN_SKINS"),
				hotkeyEmpty: translate("HWHTITANTRAINER_HOTKEY_EMPTY"),
				hotkeyCapture: translate("HWHTITANTRAINER_HOTKEY_CAPTURE"),
				hotkeyRecording: translate("HWHTITANTRAINER_HOTKEY_RECORDING"),
				hotkeyClear: translate("HWHTITANTRAINER_HOTKEY_CLEAR"),
				hotkeyConflict: translate("HWHTITANTRAINER_HOTKEY_CONFLICT")
			},
			options: {
				buttonPlacement: [{
					value: TITAN_TRAINER_BUTTON_PLACEMENT_MAIN,
					label: translate("HWHTITANTRAINER_BUTTON_PLACEMENT_MAIN"),
					icon: "play"
				}, {
					value: TITAN_TRAINER_BUTTON_PLACEMENT_OTHER,
					label: translate("HWHTITANTRAINER_BUTTON_PLACEMENT_OTHER"),
					icon: "settings"
				}],
				accordionAutoScroll: getAccordionAutoScrollOptions(),
				reorderListVariant: [{
					value: "full",
					label: translate("HWHTITANTRAINER_REORDER_LIST_VARIANT_FULL"),
					icon: "list-checks"
				}, {
					value: "minimal",
					label: translate("HWHTITANTRAINER_REORDER_LIST_VARIANT_MINIMAL"),
					icon: "list"
				}],
				progressPosition: getProgressPositionOptions({
					topRight: translate("HWHTITANTRAINER_PROGRESS_POSITION_TOP_RIGHT"),
					topCenter: translate("HWHTITANTRAINER_PROGRESS_POSITION_TOP_CENTER"),
					bottomRight: translate("HWHTITANTRAINER_PROGRESS_POSITION_BOTTOM_RIGHT")
				}),
				progressStyle: getProgressStyleOptions({
					default: translate("HWHTITANTRAINER_PROGRESS_STYLE_DEFAULT"),
					compact: translate("HWHTITANTRAINER_PROGRESS_STYLE_COMPACT"),
					dashboard: translate("HWHTITANTRAINER_PROGRESS_STYLE_DASHBOARD")
				})
			}
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/trainer-tab-content.ts
	function createTitanTrainerTabContentBuilder({ translate, buildArtifactSettingsModel, buildLevelSettingsModel, buildSkinSettingsModel, getResourceAmount, getXpPotionAmount, getSkinStoneAmount, getSoulCoinAmount, getFragmentCoinAmount, getGoldAmount }) {
		return function buildTitanTrainerTabContent(tabValue, { artifactSettings, levelSettings, skinSettings, artifactTitanOptions, levelTitanOptions, skinTitanOptions, ownedTitans, inventory, userInfo, skinGroups, accordionUiProps = {} }) {
			if (tabValue === "general") return { generalProps: buildTitanTrainerGeneralTabProps([
				translate,
				artifactSettings,
				levelSettings,
				skinSettings
			]) };
			const skinPrioritySettings = {
				...skinSettings,
				reorderListVariant: artifactSettings.reorderListVariant
			};
			const commonRenderOptions = {
				includeHeader: false,
				includeDisplaySettings: false,
				includeSupportPanels: false
			};
			if (tabValue === "levels") return { contentProps: {
				...accordionUiProps,
				model: buildLevelSettingsModel(levelSettings, levelTitanOptions, getXpPotionAmount(inventory), getSoulCoinAmount(inventory), inventory, {
					...commonRenderOptions,
					titanAccordionKey: "titan-list-levels"
				})
			} };
			if (tabValue === "skins") return { contentProps: {
				...accordionUiProps,
				model: buildSkinSettingsModel(skinPrioritySettings, skinTitanOptions, skinGroups, getSkinStoneAmount(inventory), {
					...commonRenderOptions,
					titanAccordionKey: "titan-list-skins"
				})
			} };
			return { contentProps: {
				...accordionUiProps,
				model: buildArtifactSettingsModel(artifactSettings, artifactTitanOptions, ownedTitans, getResourceAmount(inventory), getGoldAmount(userInfo), getFragmentCoinAmount(inventory), inventory, {
					...commonRenderOptions,
					titanAccordionKey: "titan-list-artifacts"
				})
			} };
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/trainer-mode-controls.ts
	function buildLevelingModeControlInput(inputId, settings, translate) {
		return {
			label: translate("HWHTITANART_LEVELING_MODE"),
			inputId,
			value: normalizeLevelingMode(settings === null || settings === void 0 ? void 0 : settings.levelingMode),
			icon: "arrow-up",
			widthPx: 168,
			tooltip: translate("HWHTITAN_TOOLTIP_LEVELING_MODE"),
			options: [{
				value: "max",
				label: translate("HWHTITANART_LEVELING_MODE_MAX"),
				icon: "arrow-up"
			}, {
				value: LEVELING_MODE_AMOUNT,
				label: translate("HWHTITANART_LEVELING_MODE_AMOUNT"),
				icon: "calculator"
			}]
		};
	}
	function buildUpgradeModeControlInput(inputId, settings, translate) {
		return {
			label: translate("HWHTITANTRAINER_UPGRADE_MODE"),
			inputId,
			value: normalizeUpgradeMode(settings === null || settings === void 0 ? void 0 : settings.upgradeMode),
			icon: "route",
			widthPx: 210,
			tooltip: translate("HWHTITAN_TOOLTIP_UPGRADE_MODE"),
			options: [{
				value: UPGRADE_MODE_SEQUENTIAL,
				label: translate("HWHTITANTRAINER_UPGRADE_MODE_SEQUENTIAL"),
				icon: "list-ordered"
			}, {
				value: UPGRADE_MODE_PARALLEL,
				label: translate("HWHTITANTRAINER_UPGRADE_MODE_PARALLEL"),
				icon: "shuffle"
			}]
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/titan-trainer-controls.ts
	function buildTitanControlText(translate, mode = "select") {
		const selectText = {
			searchPlaceholder: translate("HWHTITANART_MULTISELECT_SEARCH"),
			emptyLabel: translate("HWHTITANART_SELECT_EMPTY")
		};
		return mode === "multiSelect" ? {
			placeholder: translate("HWHTITANART_MULTISELECT_PLACEHOLDER"),
			selectedLabel: translate("HWHTITANART_MULTISELECT_SELECTED"),
			...selectText,
			selectAllLabel: translate("HWHTITANART_MULTISELECT_SELECT_ALL"),
			clearLabel: translate("HWHTITANART_MULTISELECT_CLEAR")
		} : selectText;
	}
	function buildTitanNumberControl({ inputId, label, value, icon = "coins", gameItemType = "", gameItemId = 0, minValue = 0, maxValue = void 0, widthPx = 112, tooltip = "", sideText = "", sideColor = "", key = inputId, inputAttrs = void 0 }) {
		return {
			kind: "number",
			key,
			inputId,
			label,
			value,
			icon,
			gameItemType,
			gameItemId,
			minValue,
			maxValue,
			widthPx,
			tooltip,
			sideText,
			sideColor,
			inputAttrs
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/titan-trainer-priority.ts
	function buildTitanPriorityToolbarText(translate) {
		return {
			searchPlaceholder: translate("HWHTITANART_MULTISELECT_SEARCH"),
			clearAllLabel: translate("HWHTITANART_CLEAR_ALL"),
			selectAllLabel: translate("HWHTITANART_SELECT_ALL")
		};
	}
	function buildTargetInlineIcon(iconName, className = "hwhx-title-accent") {
		return renderInlineIcon(iconName, { className });
	}
	function buildTitanArtifactTargetOptionLabel(artifactName, slotMeta, currentStar, maxStar, levelColor, formatNumber, fragmentAmount = void 0, requiredFragmentAmount = void 0) {
		const metaMarkup = fragmentAmount === void 0 || requiredFragmentAmount === void 0 ? `${buildTargetInlineIcon("star", "hwhx-gold")}${escapeHtml(`${formatNumber(currentStar)}/${formatNumber(maxStar)}`)}` : `${buildTargetInlineIcon("package", "hwhx-gold")}${escapeHtml(`${formatNumber(fragmentAmount)}/${formatNumber(requiredFragmentAmount)}`)}`;
		return `<span class="hwhx-multi-option-label"><span class="hwhx-multi-option-label__main">${buildTargetInlineIcon(slotMeta.icon, slotMeta.className)}<span class="hwhx-title-accent"${buildCssVariableStyleMarkup({ "--hwhx-label-color": String(levelColor !== null && levelColor !== void 0 ? levelColor : "") })}>${escapeHtml(artifactName)}</span></span><span class="hwhx-multi-option-label__meta">${metaMarkup}</span></span>`;
	}
	function buildTitanEvolutionTargetOptionLabel(titanName, currentStar, maxStar, soulAmount, nextCost, formatNumber) {
		return `<span class="hwhx-multi-option-label"><span class="hwhx-multi-option-label__main">${buildTargetInlineIcon("users", "hwhx-blue")}<span class="hwhx-title-accent">${escapeHtml(titanName)}</span></span><span class="hwhx-multi-option-label__meta">${buildTargetInlineIcon("star", "hwhx-gold")}${escapeHtml(`${formatNumber(currentStar)}/${formatNumber(maxStar)}`)} · ${buildTargetInlineIcon("sparkles", "hwhx-purple")}${escapeHtml(`${formatNumber(soulAmount)}/${formatNumber(nextCost)}`)}</span></span>`;
	}
	function countSelectedOwnedTitanOptions(titanOptions, selectedTitanIdSet) {
		let selectedCount = 0;
		let ownedCount = 0;
		for (const titanOption of titanOptions) {
			if (!titanOption.owned) continue;
			ownedCount += 1;
			if (selectedTitanIdSet.has(Number(titanOption.id))) selectedCount += 1;
		}
		return [selectedCount, ownedCount];
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
	function buildResultAccordionModel({ key, title, icon, rows, count, tone = "technical", rowKind = "technical", wrapRows = true, defaultOpen = true, formatCount = (value) => String(value), normalizeRows = defaultNormalizeRows } = {}) {
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
			return buildResultAccordionModel({
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
	//#region src/scripts/hwhtitanartifact/ui/titan-final-summary.ts
	function buildTitanResultLabel(message) {
		return String(message !== null && message !== void 0 ? message : "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
	}
	function createTitanFinalSummaryBuilders({ translate, formatNumber, getFragmentCoinResourceName }) {
		const { buildAccordionModel: buildTitanResultAccordionModel } = createResultSummaryBuilder({
			kind: "technical",
			tone: "technical",
			rowKind: "technical",
			formatCount: formatNumber
		});
		const buildTitanLevelSummaryRows = (summaryMap) => {
			if (!summaryMap || summaryMap.size <= 0) return [translate("HWHTITANLVL_SUMMARY_EMPTY")];
			return [...summaryMap.values()].map((entry) => `+ ${escapeHtml(entry.titanName)} ${escapeHtml(String(entry.startLevel))}→${escapeHtml(String(entry.endLevel))} (+${escapeHtml(String(entry.count))})`);
		};
		const buildTitanEvolutionSummaryRows = (summaryMap) => {
			if (!summaryMap || summaryMap.size <= 0) return [translate("HWHTITANLVL_SUMMARY_EMPTY_EVOLUTIONS")];
			return [...summaryMap.values()].map((entry) => `★ ${escapeHtml(entry.titanName)} ${escapeHtml(String(entry.startStar))}→${escapeHtml(String(entry.endStar))} (+${escapeHtml(String(entry.count))})`);
		};
		const buildTitanSkinSummaryRows = (summaryMap) => {
			if (!summaryMap || summaryMap.size <= 0) return [translate("HWHTITANSKIN_SUMMARY_EMPTY")];
			return [...summaryMap.values()].map((entry) => `+ ${escapeHtml(entry.titanName)} · ${escapeHtml(entry.skinName)} ${escapeHtml(String(entry.startLevel))}→${escapeHtml(String(entry.endLevel))} (+${escapeHtml(String(entry.count))})`);
		};
		const buildUpgradeSummaryRows = (summaryMap) => {
			if (!summaryMap || summaryMap.size <= 0) return [translate("HWHTITANART_SUMMARY_EMPTY")];
			return [...summaryMap.values()].map((entry) => `+ ${escapeHtml(entry.titanName)} · ${escapeHtml(entry.artifactLabel)} ${escapeHtml(String(entry.startLevel))}→${escapeHtml(String(entry.endLevel))} (+${escapeHtml(String(entry.count))})`);
		};
		const buildArtifactEvolutionSummaryRows = (summaryMap) => {
			if (!summaryMap || summaryMap.size <= 0) return [translate("HWHTITANART_SUMMARY_EMPTY_EVOLUTIONS")];
			return [...summaryMap.values()].map((entry) => `★ ${escapeHtml(entry.titanName)} · ${escapeHtml(entry.artifactLabel)} ${escapeHtml(String(entry.startStar))}→${escapeHtml(String(entry.endStar))} (+${escapeHtml(String(entry.count))})`);
		};
		const buildArtifactFragmentPurchaseSummaryRows = (summaryMap) => {
			if (!summaryMap || summaryMap.size <= 0) return [translate("HWHTITANART_SUMMARY_EMPTY_PURCHASES")];
			return [...summaryMap.values()].map((entry) => `+ ${escapeHtml(entry.artifactName)}: ${escapeHtml(formatNumber(entry.amount))} [${escapeHtml(formatNumber(entry.coinSpentAmount))}]`);
		};
		const buildTitanResultMessageHtml = (...messageParts) => messageParts.map(normalizeTitanResultMessagePart).filter((messagePart) => messagePart !== "").join("<br>");
		const compactTitanResultAccordions = (accordions) => accordions.filter((accordion) => accordion !== null);
		const buildFinalTitanLevelSummaryProps = (plan, resourceName, messageHtml = "", postRunSyncMessageHtml = "") => {
			const resourceRows = [escapeHtml(translate("HWHTITANLVL_SUMMARY_RESOURCE", {
				resourceName,
				spentAmount: formatNumber(plan.spentAmount),
				leftAmount: formatNumber(plan.leftAmount)
			}))];
			if (Number(plan.potionAmountBought) > 0) resourceRows.push(escapeHtml(translate("HWHTITANLVL_SUMMARY_POTION_PURCHASE", {
				potionAmount: formatNumber(plan.potionAmountBought),
				coinSpentAmount: formatNumber(plan.potionCoinSpentAmount),
				coinLeftAmount: formatNumber(plan.potionCoinLeftAmount)
			})));
			return {
				messageHtml: buildTitanResultMessageHtml(messageHtml, postRunSyncMessageHtml),
				accordions: compactTitanResultAccordions([
					buildTitanResultAccordionModel({
						title: translate("HWHTITANLVL_SUMMARY_LEVELS"),
						icon: "arrow-up",
						rows: buildTitanLevelSummaryRows(plan === null || plan === void 0 ? void 0 : plan.summary),
						tone: "farm",
						rowKind: "farm"
					}),
					plan.evolutionSummary && plan.evolutionSummary.size > 0 ? buildTitanResultAccordionModel({
						title: translate("HWHTITANLVL_SUMMARY_EVOLUTIONS"),
						icon: "sparkles",
						rows: buildTitanEvolutionSummaryRows(plan === null || plan === void 0 ? void 0 : plan.evolutionSummary),
						tone: "craft",
						rowKind: "craft"
					}) : null,
					buildTitanResultAccordionModel({
						title: translate("HWHTITANLVL_SUMMARY_SPENT"),
						icon: "flask",
						rows: resourceRows
					})
				])
			};
		};
		const buildFinalTitanSkinSummaryProps = (plan, resourceName, messageHtml = "", postRunSyncMessageHtml = "") => ({
			messageHtml: buildTitanResultMessageHtml(messageHtml, postRunSyncMessageHtml),
			accordions: compactTitanResultAccordions([buildTitanResultAccordionModel({
				title: translate("HWHTITANSKIN_SUMMARY_SKINS"),
				icon: "shirt",
				rows: buildTitanSkinSummaryRows(plan === null || plan === void 0 ? void 0 : plan.summary),
				tone: "farm",
				rowKind: "farm"
			}), buildTitanResultAccordionModel({
				title: translate("HWHTITANSKIN_SUMMARY_SPENT"),
				icon: "coins",
				rows: [escapeHtml(translate("HWHTITANSKIN_SUMMARY_RESOURCE", {
					resourceName,
					spentAmount: formatNumber(plan.spentAmount),
					leftAmount: formatNumber(plan.leftAmount)
				}))]
			})])
		});
		const buildFinalSummaryProps = (plan, resourceName, messageHtml = "", postRunSyncMessageHtml = "", goldResourceName) => {
			const spentRows = [escapeHtml(translate("HWHTITANART_SUMMARY_RESOURCE", {
				resourceName,
				spentAmount: formatNumber(plan.spentAmount),
				leftAmount: formatNumber(plan.leftAmount)
			}))];
			if (plan.usesGoldBudget || Number(plan.goldSpentAmount) > 0) spentRows.push(escapeHtml(translate("HWHTITANART_SUMMARY_RESOURCE", {
				resourceName: goldResourceName,
				spentAmount: formatNumber(plan.goldSpentAmount),
				leftAmount: formatNumber(plan.goldLeftAmount)
			})));
			if (Number(plan.fragmentCoinSpentAmount) > 0) spentRows.push(escapeHtml(translate("HWHTITANART_SUMMARY_RESOURCE", {
				resourceName: getFragmentCoinResourceName(),
				spentAmount: formatNumber(plan.fragmentCoinSpentAmount),
				leftAmount: formatNumber(plan.fragmentCoinLeftAmount)
			})));
			const hasEvolutionDetails = plan.evolutionSummary && plan.evolutionSummary.size > 0 || plan.purchaseSummary && plan.purchaseSummary.size > 0;
			return {
				messageHtml: buildTitanResultMessageHtml(messageHtml, postRunSyncMessageHtml),
				accordions: compactTitanResultAccordions([
					buildTitanResultAccordionModel({
						title: translate("HWHTITANART_SUMMARY_UPGRADES"),
						icon: "hammer",
						rows: buildUpgradeSummaryRows(plan.summary),
						tone: "farm",
						rowKind: "farm"
					}),
					hasEvolutionDetails ? buildTitanResultAccordionModel({
						title: translate("HWHTITANART_SUMMARY_EVOLUTIONS"),
						icon: "sparkles",
						rows: buildArtifactEvolutionSummaryRows(plan === null || plan === void 0 ? void 0 : plan.evolutionSummary),
						tone: "craft",
						rowKind: "craft"
					}) : null,
					hasEvolutionDetails ? buildTitanResultAccordionModel({
						title: translate("HWHTITANART_SUMMARY_PURCHASES"),
						icon: "shopping-bag",
						rows: buildArtifactFragmentPurchaseSummaryRows(plan === null || plan === void 0 ? void 0 : plan.purchaseSummary),
						tone: "shop",
						rowKind: "shop"
					}) : null,
					buildTitanResultAccordionModel({
						title: translate("HWHTITANART_SUMMARY_SPENT"),
						icon: "flask",
						rows: spentRows
					})
				])
			};
		};
		return {
			buildFinalSummaryProps,
			buildFinalTitanLevelSummaryProps,
			buildFinalTitanSkinSummaryProps
		};
	}
	function normalizeTitanResultMessagePart(messagePart) {
		return String(messagePart !== null && messagePart !== void 0 ? messagePart : "").trim().replace(/^(<br\s*\/?>)+/i, "");
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/artifact-run-result.ts
	function createTitanArtifactRunResultBuilders([translate, formatNumber, buildFinalSummaryProps, buildPostRunSyncMessage, resultSummaryComponent]) {
		const buildArtifactRunResultPayload = (plan, resourceName, goldResourceName, resultMessage, postRunSyncMessage = "") => ["", {
			component: resultSummaryComponent,
			props: buildFinalSummaryProps(plan, resourceName, resultMessage, postRunSyncMessage, goldResourceName),
			resultLabel: buildTitanResultLabel(resultMessage)
		}];
		const buildArtifactErrorResult = ([plan, resourceName, goldResourceName, error]) => {
			const errorMessage = error instanceof Error ? error.message : translate("HWHTITANART_ERROR_GENERIC");
			const resultMessage = escapeHtml(`${translate("HWHTITANART_PROGRESS_ERROR")} ${errorMessage}`);
			return buildArtifactRunResultPayload(plan, resourceName, goldResourceName, resultMessage);
		};
		const buildArtifactSuccessResult = ([plan, resourceName, goldResourceName, completedActionCount, settings, options]) => {
			const resultMessage = escapeHtml(translate("HWHTITANART_PROGRESS_DONE", { count: formatNumber(completedActionCount) }));
			return buildArtifactRunResultPayload(plan, resourceName, goldResourceName, resultMessage, buildPostRunSyncMessage({
				settings,
				options
			}));
		};
		return [buildArtifactErrorResult, buildArtifactSuccessResult];
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/leveling-run-result.ts
	function createTitanLevelingRunResultBuilders([translate, formatNumber, buildFinalTitanSkinSummaryProps, buildFinalTitanLevelSummaryProps, buildPostRunSyncMessage, resultSummaryComponent]) {
		const buildRunResultPayload = (props, resultMessage) => ["", {
			component: resultSummaryComponent,
			props,
			resultLabel: buildTitanResultLabel(resultMessage)
		}];
		const buildTitanSkinErrorResult = ([plan, resourceName, error]) => {
			const errorMessage = error instanceof Error ? error.message : translate("HWHTITANART_ERROR_GENERIC");
			const resultMessage = escapeHtml(`${translate("HWHTITANSKIN_PROGRESS_ERROR")} ${errorMessage}`);
			return buildRunResultPayload(buildFinalTitanSkinSummaryProps(plan, resourceName, resultMessage), resultMessage);
		};
		const buildTitanSkinSuccessResult = ([plan, resourceName, completedActionCount, settings, options]) => {
			const resultMessage = escapeHtml(translate("HWHTITANSKIN_PROGRESS_DONE", { count: formatNumber(completedActionCount) }));
			return buildRunResultPayload(buildFinalTitanSkinSummaryProps(plan, resourceName, resultMessage, buildPostRunSyncMessage({
				settings,
				options
			})), resultMessage);
		};
		const buildTitanLevelErrorResult = ([plan, resourceName, error]) => {
			const errorMessage = error instanceof Error ? error.message : translate("HWHTITANART_ERROR_GENERIC");
			const resultMessage = escapeHtml(`${translate("HWHTITANLVL_PROGRESS_ERROR")} ${errorMessage}`);
			return buildRunResultPayload(buildFinalTitanLevelSummaryProps(plan, resourceName, resultMessage), resultMessage);
		};
		const buildTitanLevelSuccessResult = ([plan, resourceName, completedActionCount, settings, options]) => {
			const resultMessage = escapeHtml(translate("HWHTITANLVL_PROGRESS_DONE", { count: formatNumber(completedActionCount) }));
			return buildRunResultPayload(buildFinalTitanLevelSummaryProps(plan, resourceName, resultMessage, buildPostRunSyncMessage({
				settings,
				options
			})), resultMessage);
		};
		return [
			buildTitanSkinErrorResult,
			buildTitanSkinSuccessResult,
			buildTitanLevelErrorResult,
			buildTitanLevelSuccessResult
		];
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/artifact-progress.ts
	function buildProgressActivityLabel$2(currentText, total, formatNumber, buildIconLabel) {
		return buildIconLabel("activity", `${currentText}/${formatNumber(total)}`);
	}
	function createTitanArtifactProgressBuilders([translate, formatNumber, buildIconLabel]) {
		function buildUpgradeProgressMessage(step) {
			return escapeHtml(translate("HWHTITANART_PROGRESS_UPGRADE", {
				titanName: step.titanName,
				slot: step.artifactLabel,
				fromLevel: String(step.fromLevel),
				toLevel: String(step.toLevel)
			}));
		}
		return [
			function buildPurchaseProgressHtml(step, chunkStart, chunkEnd, total) {
				return `${escapeHtml(translate("HWHTITANART_PROGRESS_BUY_FRAGMENT", {
					artifactName: step.artifactName,
					amount: formatNumber(step.amount)
				}))}<br>${buildProgressActivityLabel$2(`${formatNumber(chunkStart)}-${formatNumber(chunkEnd)}`, total, formatNumber, buildIconLabel)}`;
			},
			function buildEvolutionProgressHtml(step, chunkStart, chunkEnd, total) {
				return `${escapeHtml(translate("HWHTITANART_PROGRESS_EVOLVE", {
					titanName: step.titanName,
					slot: step.artifactLabel,
					fromStar: String(step.fromStar),
					toStar: String(step.toStar)
				}))}<br>${buildProgressActivityLabel$2(`${formatNumber(chunkStart)}-${formatNumber(chunkEnd)}`, total, formatNumber, buildIconLabel)}`;
			},
			function buildUpgradeChunkProgressHtml(step, executedPlan, chunkStart, chunkEnd, total) {
				const spentParts = [buildIconLabel("flask", `-${formatNumber(executedPlan.spentAmount)} (${formatNumber(executedPlan.leftAmount)})`)];
				if (executedPlan.usesGoldBudget) spentParts.push(buildIconLabel("coins", `-${formatNumber(executedPlan.goldSpentAmount)} (${formatNumber(executedPlan.goldLeftAmount)})`, "hwhx-gold"));
				return `${buildUpgradeProgressMessage(step)}<br>${spentParts.join("<br>")}<br>${buildProgressActivityLabel$2(`${formatNumber(chunkStart)}-${formatNumber(chunkEnd)}`, total, formatNumber, buildIconLabel)}`;
			},
			function buildUpgradeProgressHtml(step, current, total) {
				return `${buildUpgradeProgressMessage(step)}<br>${buildProgressActivityLabel$2(formatNumber(current), total, formatNumber, buildIconLabel)}`;
			}
		];
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/skin-progress.ts
	function buildProgressActivityLabel$1(currentText, total, formatNumber, buildIconLabel) {
		return buildIconLabel("activity", `${currentText}/${formatNumber(total)}`);
	}
	function createTitanSkinProgressBuilders([translate, formatNumber, buildIconLabel]) {
		function buildUpgradeProgressMessage(step) {
			return escapeHtml(translate("HWHTITANSKIN_PROGRESS_UPGRADE", {
				titanName: step.titanName,
				skinName: step.name,
				fromLevel: String(step.fromLevel),
				toLevel: String(step.toLevel)
			}));
		}
		return [function buildUpgradeChunkProgressHtml(step, executedPlan, chunkStart, chunkEnd, total) {
			return `${buildUpgradeProgressMessage(step)}<br>${buildIconLabel("coins", `-${formatNumber(executedPlan.spentAmount)} (${formatNumber(executedPlan.leftAmount)})`)}<br>${buildProgressActivityLabel$1(`${formatNumber(chunkStart)}-${formatNumber(chunkEnd)}`, total, formatNumber, buildIconLabel)}`;
		}, function buildUpgradeProgressHtml(step, current, total) {
			return `${buildUpgradeProgressMessage(step)}<br>${buildProgressActivityLabel$1(formatNumber(current), total, formatNumber, buildIconLabel)}`;
		}];
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/level-progress.ts
	function buildProgressActivityLabel(currentText, total, formatNumber, buildIconLabel) {
		return buildIconLabel("activity", `${currentText}/${formatNumber(total)}`);
	}
	function createTitanLevelProgressBuilders([translate, formatNumber, buildIconLabel]) {
		function buildUpgradeProgressMessage(step) {
			return escapeHtml(translate("HWHTITANLVL_PROGRESS_UPGRADE", {
				titanName: step.titanName,
				fromLevel: String(step.fromLevel),
				toLevel: String(step.toLevel)
			}));
		}
		return [
			function buildEvolutionProgressHtml(step, chunkStart, chunkEnd, total) {
				return `${escapeHtml(translate("HWHTITANLVL_PROGRESS_EVOLVE", {
					titanName: step.titanName,
					fromStar: String(step.fromStar),
					toStar: String(step.toStar)
				}))}<br>${buildProgressActivityLabel(`${formatNumber(chunkStart)}-${formatNumber(chunkEnd)}`, total, formatNumber, buildIconLabel)}`;
			},
			function buildUpgradeChunkProgressHtml(step, executedPlan, chunkStart, chunkEnd, total) {
				return `${buildUpgradeProgressMessage(step)}<br>${buildIconLabel("flask", `-${formatNumber(executedPlan.spentAmount)} (${formatNumber(executedPlan.leftAmount)})`)}<br>${buildProgressActivityLabel(`${formatNumber(chunkStart)}-${formatNumber(chunkEnd)}`, total, formatNumber, buildIconLabel)}`;
			},
			function buildUpgradeProgressHtml(step, current, total) {
				return `${buildUpgradeProgressMessage(step)}<br>${buildProgressActivityLabel(formatNumber(current), total, formatNumber, buildIconLabel)}`;
			},
			function buildPotionPurchaseProgressHtml(step, current, total) {
				return `${escapeHtml(translate("HWHTITANLVL_PROGRESS_BUY_POTIONS", {
					potionAmount: formatNumber(step.potionAmountTotal),
					coinAmount: formatNumber(step.coinSpentAmount)
				}))}<br>${buildProgressActivityLabel(formatNumber(current), total, formatNumber, buildIconLabel)}`;
			}
		];
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/trainer-calculator-controls.ts
	function getCalculatorControl(calculator, inputId) {
		var _calculator$controls;
		const normalizedInputId = String(inputId !== null && inputId !== void 0 ? inputId : "");
		return ((_calculator$controls = calculator === null || calculator === void 0 ? void 0 : calculator.controls) !== null && _calculator$controls !== void 0 ? _calculator$controls : []).find((control) => {
			var _control$inputId;
			return String((_control$inputId = control === null || control === void 0 ? void 0 : control.inputId) !== null && _control$inputId !== void 0 ? _control$inputId : "") === normalizedInputId;
		});
	}
	function readCalculatorControlString(calculator, inputId, fallbackValue = "") {
		var _ref, _control$value;
		const control = getCalculatorControl(calculator, inputId);
		return String((_ref = (_control$value = control === null || control === void 0 ? void 0 : control.value) !== null && _control$value !== void 0 ? _control$value : fallbackValue) !== null && _ref !== void 0 ? _ref : "");
	}
	function readCalculatorControlNumber(calculator, inputId, fallbackValue = 0) {
		return Math.max(0, Math.floor(Number(readCalculatorControlString(calculator, inputId, fallbackValue)) || 0));
	}
	function setCalculatorControlValue(calculator, inputId, value) {
		const control = getCalculatorControl(calculator, inputId);
		if (!control || !("value" in control)) return false;
		control.value = control.kind === "number" ? Math.max(0, Math.floor(Number(value) || 0)) : String(value !== null && value !== void 0 ? value : "");
		return true;
	}
	function setCalculatorNumberControlDefaults(calculator, inputId, value, maxValue = void 0) {
		const control = getCalculatorControl(calculator, inputId);
		if (!control || control.kind !== "number") return;
		control.value = Math.max(0, Math.floor(Number(value) || 0));
		const normalizedMaxValue = Math.max(0, Math.floor(Number(maxValue) || 0));
		control.maxValue = normalizedMaxValue > 0 ? normalizedMaxValue : void 0;
	}
	function syncCalculatorControlDefaults(calculator) {
		if (calculator) calculator.syncSerial = Math.max(0, Number(calculator.syncSerial) || 0) + 1;
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/trainer-calculator-defaults.ts
	function buildNextLevelRange(currentLevel, maxLevel) {
		const normalizedCurrentLevel = Math.max(1, Number(currentLevel) || 1);
		const normalizedMaxLevel = Math.max(0, Number(maxLevel) || 0);
		const targetLevel = normalizedMaxLevel > 0 ? Math.min(normalizedMaxLevel, normalizedCurrentLevel + 1) : normalizedCurrentLevel + 1;
		return {
			startLevel: normalizedCurrentLevel,
			endLevel: Math.max(normalizedCurrentLevel, targetLevel)
		};
	}
	function findCalculatorTitanOption(titanOptions, titanId) {
		return titanOptions.find((titanOption) => Number(titanOption === null || titanOption === void 0 ? void 0 : titanOption.id) === Number(titanId));
	}
	function createTitanTrainerCalculatorDefaults([getArtifactMaxLevel, getMaxTitanLevel]) {
		function getCalculatorTitanSelectOptions(titanOptions) {
			const ownedTitanOptions = titanOptions.filter((titanOption) => Boolean(titanOption === null || titanOption === void 0 ? void 0 : titanOption.owned));
			return (ownedTitanOptions.length > 0 ? ownedTitanOptions : titanOptions).map((titanOption) => ({
				value: String(titanOption.id),
				label: titanOption.name,
				icon: "users"
			}));
		}
		function getPreferredCalculatorTitanId(titanOptions, selectedTitanIds) {
			var _ref, _ownedTitanOptions$fi;
			const selectedTitanIdSet = new Set((Array.isArray(selectedTitanIds) ? selectedTitanIds : []).map((titanId) => Number(titanId)));
			const ownedTitanOptions = titanOptions.filter((titanOption) => Boolean(titanOption === null || titanOption === void 0 ? void 0 : titanOption.owned));
			const preferredTitanOption = (_ref = (_ownedTitanOptions$fi = ownedTitanOptions.find((titanOption) => selectedTitanIdSet.has(Number(titanOption.id)))) !== null && _ownedTitanOptions$fi !== void 0 ? _ownedTitanOptions$fi : ownedTitanOptions[0]) !== null && _ref !== void 0 ? _ref : titanOptions[0];
			return Number(preferredTitanOption === null || preferredTitanOption === void 0 ? void 0 : preferredTitanOption.id) || 0;
		}
		function getArtifactCalculatorDefaultLevels(titanOptions, titanId, slotId) {
			const titanOption = findCalculatorTitanOption(titanOptions, titanId);
			return buildNextLevelRange(getCollectionValue(titanOption === null || titanOption === void 0 ? void 0 : titanOption.levels, slotId), getArtifactMaxLevel(titanId, slotId));
		}
		function getLevelCalculatorDefaultLevels(titanOptions, titanId) {
			const titanOption = findCalculatorTitanOption(titanOptions, titanId);
			return buildNextLevelRange(titanOption === null || titanOption === void 0 ? void 0 : titanOption.level, getMaxTitanLevel());
		}
		function findSkinCalculatorEntry(titanOptions, skinGroups, titanId, localeKey) {
			var _titanOption$skinEntr, _skinGroup$skinIds$;
			const normalizedLocaleKey = String(localeKey !== null && localeKey !== void 0 ? localeKey : "");
			const titanOption = findCalculatorTitanOption(titanOptions, titanId);
			const skinEntry = ((_titanOption$skinEntr = titanOption === null || titanOption === void 0 ? void 0 : titanOption.skinEntries) !== null && _titanOption$skinEntr !== void 0 ? _titanOption$skinEntr : []).find((entry) => entry.localeKey === normalizedLocaleKey);
			if (skinEntry) return skinEntry;
			const skinGroup = skinGroups.find((group) => group.localeKey === normalizedLocaleKey);
			return skinGroup ? {
				...skinGroup,
				skinId: (_skinGroup$skinIds$ = skinGroup.skinIds[0]) !== null && _skinGroup$skinIds$ !== void 0 ? _skinGroup$skinIds$ : 0,
				localeKey: skinGroup.localeKey,
				name: skinGroup.name,
				currentLevel: 1,
				maxLevel: skinGroup.maxLevel
			} : void 0;
		}
		function getSkinCalculatorDefaultLevels(titanOptions, skinGroups, titanId, localeKey) {
			const skinEntry = findSkinCalculatorEntry(titanOptions, skinGroups, titanId, localeKey);
			return buildNextLevelRange(skinEntry === null || skinEntry === void 0 ? void 0 : skinEntry.currentLevel, skinEntry === null || skinEntry === void 0 ? void 0 : skinEntry.maxLevel);
		}
		return [
			getCalculatorTitanSelectOptions,
			getPreferredCalculatorTitanId,
			getArtifactCalculatorDefaultLevels,
			getLevelCalculatorDefaultLevels,
			findSkinCalculatorEntry,
			getSkinCalculatorDefaultLevels
		];
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/calculator-result.ts
	function buildTitanCalculatorResourceViews(costParts, formatNumber) {
		return costParts.filter((part) => Number(part.amount) > 0).map((part, index) => {
			var _part$icon, _part$className;
			return {
				key: `${part.name}:${String((_part$icon = part.icon) !== null && _part$icon !== void 0 ? _part$icon : "")}:${index}`,
				icon: part.icon,
				...part.itemType ? {
					itemType: part.itemType,
					itemId: part.itemId
				} : {},
				className: (_part$className = part.className) !== null && _part$className !== void 0 ? _part$className : "hwhx-title-accent",
				name: part.name,
				amountText: formatNumber(part.amount)
			};
		});
	}
	function buildTitanCalculatorAvailabilityViews({ totals, availableParts = [], formatNumber, translate }) {
		const availabilityByName = new Map(availableParts.map((part) => [String(part.name), part]));
		return totals.filter((part) => Number(part.amount) > 0).flatMap((part) => {
			const availablePart = availabilityByName.get(String(part.name));
			if (!availablePart) return [];
			const delta = Math.max(0, Number(availablePart.amount) || 0) - Math.max(0, Number(part.amount) || 0);
			const enough = delta >= 0;
			const label = translate(enough ? "HWHTITANART_CALC_ENOUGH" : "HWHTITANART_CALC_MISSING", { amount: formatNumber(Math.abs(delta)) });
			return [{
				key: String(part.name),
				state: enough ? "ok" : "bad",
				icon: enough ? "check" : "alert-triangle",
				iconClassName: enough ? "hwhx-green" : "hwhx-danger",
				name: part.name,
				label
			}];
		});
	}
	function buildTitanCalculatorResultModel({ rows, totals, availableParts = [], formatNumber, translate }) {
		return {
			emptyText: translate("HWHTITANART_CALC_EMPTY"),
			emptyDash: "—",
			totalLabel: translate("HWHTITANART_CALC_TOTAL"),
			totals: buildTitanCalculatorResourceViews(totals, formatNumber),
			availability: buildTitanCalculatorAvailabilityViews({
				totals,
				availableParts,
				formatNumber,
				translate
			}),
			rows: rows.map((row, index) => ({
				key: `${row.fromLevel}:${row.toLevel}:${index}`,
				title: `${row.fromLevel} → ${row.toLevel}`,
				levelLabel: translate("HWHTITANART_CALC_LEVEL_SHORT", { level: row.toLevel }),
				costParts: buildTitanCalculatorResourceViews(row.costParts, formatNumber)
			}))
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/trainer-calculator-results.ts
	function normalizeCalculatorLevelRange(startLevel, endLevel, maxLevel = 0) {
		const normalizedMaxLevel = Math.max(0, Math.floor(Number(maxLevel) || 0));
		const rawStartLevel = Math.max(1, Math.floor(Number(startLevel) || 1));
		const normalizedStartLevel = normalizedMaxLevel > 0 ? Math.min(rawStartLevel, normalizedMaxLevel) : rawStartLevel;
		const rawEndLevel = Math.max(normalizedStartLevel, Math.floor(Number(endLevel) || normalizedStartLevel));
		return {
			startLevel: normalizedStartLevel,
			endLevel: Math.max(normalizedStartLevel, normalizedMaxLevel > 0 ? Math.min(rawEndLevel, normalizedMaxLevel) : rawEndLevel)
		};
	}
	function createTitanTrainerCalculatorResultBuilders([formatNumber, translate, getArtifactResourceName, getGoldResourceName, getTitanXpResourceName, getTitanSkinResourceName, getTitanArtifactMaxLevel, getMaxTitanLevel, getTitanArtifactNextUpgrade, getTitanLevelUpCost, getTitanSkinNextUpgrade, findSkinCalculatorEntry]) {
		function buildCalculatorResultModel(rows, totals, availableParts = []) {
			return buildTitanCalculatorResultModel({
				rows,
				totals,
				availableParts,
				formatNumber,
				translate
			});
		}
		function buildArtifactCalculatorPlan(titanId, slotId, startLevel, endLevel) {
			const rows = [];
			const resourceTotal = {
				icon: "flask",
				itemType: "consumable",
				itemId: 53,
				name: getArtifactResourceName(),
				amount: 0
			};
			const goldTotal = {
				icon: "coins",
				itemType: "pseudo",
				itemId: 2,
				className: "hwhx-gold",
				name: getGoldResourceName(),
				amount: 0
			};
			const totals = [resourceTotal, goldTotal];
			const { startLevel: normalizedStartLevel, endLevel: normalizedEndLevel } = normalizeCalculatorLevelRange(startLevel, endLevel, getTitanArtifactMaxLevel(titanId, slotId));
			for (let currentLevel = normalizedStartLevel; currentLevel < normalizedEndLevel; currentLevel += 1) {
				const nextUpgrade = getTitanArtifactNextUpgrade(titanId, slotId, currentLevel);
				if (!nextUpgrade) break;
				resourceTotal.amount += nextUpgrade.resourceCost;
				goldTotal.amount += nextUpgrade.goldCost;
				rows.push({
					fromLevel: currentLevel,
					toLevel: nextUpgrade.nextLevel,
					costParts: [{
						...resourceTotal,
						amount: nextUpgrade.resourceCost
					}, {
						...goldTotal,
						amount: nextUpgrade.goldCost
					}]
				});
			}
			return {
				rows,
				totals
			};
		}
		function buildTitanLevelCalculatorPlan(startLevel, endLevel) {
			const rows = [];
			const potionTotal = {
				icon: "flask",
				itemType: "consumable",
				itemId: 20,
				name: getTitanXpResourceName(),
				amount: 0
			};
			const totals = [potionTotal];
			const { startLevel: normalizedStartLevel, endLevel: normalizedEndLevel } = normalizeCalculatorLevelRange(startLevel, endLevel, getMaxTitanLevel());
			for (let currentLevel = normalizedStartLevel; currentLevel < normalizedEndLevel; currentLevel += 1) {
				const cost = getTitanLevelUpCost(currentLevel);
				if (!cost) break;
				potionTotal.amount += cost;
				rows.push({
					fromLevel: currentLevel,
					toLevel: currentLevel + 1,
					costParts: [{
						...potionTotal,
						amount: cost
					}]
				});
			}
			return {
				rows,
				totals
			};
		}
		function buildTitanSkinCalculatorPlan(skinId, startLevel, endLevel, maxLevel = 0) {
			const rows = [];
			const skinStoneTotal = {
				icon: "coins",
				itemType: "coin",
				itemId: 24,
				name: getTitanSkinResourceName(),
				amount: 0
			};
			const totals = [skinStoneTotal];
			const { startLevel: normalizedStartLevel, endLevel: normalizedEndLevel } = normalizeCalculatorLevelRange(startLevel, endLevel, maxLevel);
			for (let currentLevel = normalizedStartLevel; currentLevel < normalizedEndLevel; currentLevel += 1) {
				const nextUpgrade = getTitanSkinNextUpgrade(skinId, currentLevel);
				if (!nextUpgrade) break;
				skinStoneTotal.amount += nextUpgrade.cost;
				rows.push({
					fromLevel: currentLevel,
					toLevel: nextUpgrade.nextLevel,
					costParts: [{
						...skinStoneTotal,
						amount: nextUpgrade.cost
					}]
				});
			}
			return {
				rows,
				totals
			};
		}
		function buildArtifactCalculatorResultModel({ titanId, slotId, startLevel, endLevel, resourceAmount, essenceReserve, goldAmount, goldReserve }) {
			const plan = buildArtifactCalculatorPlan(titanId, slotId, startLevel, endLevel);
			return buildCalculatorResultModel(plan.rows, plan.totals, [{
				name: getArtifactResourceName(),
				amount: Math.max(0, Number(resourceAmount) || 0) - Math.max(0, Number(essenceReserve) || 0)
			}, {
				name: getGoldResourceName(),
				amount: Math.max(0, Number(goldAmount) || 0) - Math.max(0, Number(goldReserve) || 0)
			}]);
		}
		function buildLevelCalculatorResultModel({ startLevel, endLevel, potionAmount, potionReserve }) {
			const plan = buildTitanLevelCalculatorPlan(startLevel, endLevel);
			return buildCalculatorResultModel(plan.rows, plan.totals, [{
				name: getTitanXpResourceName(),
				amount: Math.max(0, Number(potionAmount) || 0) - Math.max(0, Number(potionReserve) || 0)
			}]);
		}
		function buildSkinCalculatorResultModel({ titanOptions, skinGroups, titanId, localeKey, startLevel, endLevel, skinStoneAmount, skinStoneReserve }) {
			const skinEntry = findSkinCalculatorEntry(titanOptions, skinGroups, titanId, localeKey);
			const plan = buildTitanSkinCalculatorPlan(skinEntry === null || skinEntry === void 0 ? void 0 : skinEntry.skinId, startLevel, endLevel, skinEntry === null || skinEntry === void 0 ? void 0 : skinEntry.maxLevel);
			return buildCalculatorResultModel(plan.rows, plan.totals, [{
				name: getTitanSkinResourceName(),
				amount: Math.max(0, Number(skinStoneAmount) || 0) - Math.max(0, Number(skinStoneReserve) || 0)
			}]);
		}
		return [
			buildArtifactCalculatorResultModel,
			buildLevelCalculatorResultModel,
			buildSkinCalculatorResultModel
		];
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/trainer-calculator-state.ts
	function getTitanTrainerCalculatorPanelKind(inputId) {
		const normalizedInputId = String(inputId !== null && inputId !== void 0 ? inputId : "");
		if (normalizedInputId.startsWith("hwhtitanartifact-calc-")) return "artifact";
		if (normalizedInputId.startsWith("hwhtitanlevel-calc-")) return "level";
		return normalizedInputId.startsWith("hwhtitanskin-calc-") ? "skin" : void 0;
	}
	function createTitanTrainerCalculatorStateCoordinator([defaults, resultBuilders, getTitanArtifactMaxLevel, getMaxTitanLevel]) {
		const [, , getArtifactCalculatorDefaultLevels, getLevelCalculatorDefaultLevels, findSkinCalculatorEntry, getSkinCalculatorDefaultLevels] = defaults;
		const [buildArtifactCalculatorResultModel, buildLevelCalculatorResultModel, buildSkinCalculatorResultModel] = resultBuilders;
		function refreshArtifactCalculatorResult(calculator, titanOptions, settings, resourceAmount, goldAmount) {
			if (!calculator) return;
			const titanId = Number(readCalculatorControlString(calculator, ARTIFACT_CALC_TITAN_SELECT_ID, "0"));
			const slotId = Number(readCalculatorControlString(calculator, ARTIFACT_CALC_SLOT_SELECT_ID, "0"));
			const defaultLevels = getArtifactCalculatorDefaultLevels(titanOptions, titanId, slotId);
			const startLevel = readCalculatorControlNumber(calculator, ARTIFACT_CALC_START_INPUT_ID, defaultLevels.startLevel);
			const endLevel = readCalculatorControlNumber(calculator, ARTIFACT_CALC_END_INPUT_ID, defaultLevels.endLevel);
			calculator.result = buildArtifactCalculatorResultModel({
				titanId,
				slotId,
				startLevel,
				endLevel,
				resourceAmount,
				essenceReserve: settings.essenceReserve,
				goldAmount,
				goldReserve: settings.artifactGoldReserve
			});
		}
		function refreshLevelCalculatorResult(calculator, titanOptions, settings, potionAmount) {
			if (!calculator) return;
			const titanId = Number(readCalculatorControlString(calculator, LEVEL_CALC_TITAN_SELECT_ID, "0"));
			const defaultLevels = getLevelCalculatorDefaultLevels(titanOptions, titanId);
			const startLevel = readCalculatorControlNumber(calculator, LEVEL_CALC_START_INPUT_ID, defaultLevels.startLevel);
			const endLevel = readCalculatorControlNumber(calculator, LEVEL_CALC_END_INPUT_ID, defaultLevels.endLevel);
			calculator.result = buildLevelCalculatorResultModel({
				startLevel,
				endLevel,
				potionAmount,
				potionReserve: settings.potionReserve
			});
		}
		function refreshSkinCalculatorResult(calculator, titanOptions, skinGroups, settings, skinStoneAmount) {
			if (!calculator) return;
			const titanId = Number(readCalculatorControlString(calculator, SKIN_CALC_TITAN_SELECT_ID, "0"));
			const localeKey = readCalculatorControlString(calculator, SKIN_CALC_GROUP_SELECT_ID, "");
			const defaultLevels = getSkinCalculatorDefaultLevels(titanOptions, skinGroups, titanId, localeKey);
			const startLevel = readCalculatorControlNumber(calculator, SKIN_CALC_START_INPUT_ID, defaultLevels.startLevel);
			const endLevel = readCalculatorControlNumber(calculator, SKIN_CALC_END_INPUT_ID, defaultLevels.endLevel);
			calculator.result = buildSkinCalculatorResultModel({
				titanOptions,
				skinGroups,
				titanId,
				localeKey,
				startLevel,
				endLevel,
				skinStoneAmount,
				skinStoneReserve: settings.skinStoneReserve
			});
		}
		function applyArtifactCalculatorDefaults(calculator, titanOptions) {
			const titanId = Number(readCalculatorControlString(calculator, ARTIFACT_CALC_TITAN_SELECT_ID, "0"));
			const slotId = Number(readCalculatorControlString(calculator, ARTIFACT_CALC_SLOT_SELECT_ID, "0"));
			const levels = getArtifactCalculatorDefaultLevels(titanOptions, titanId, slotId);
			const maxLevel = getTitanArtifactMaxLevel(titanId, slotId);
			setCalculatorNumberControlDefaults(calculator, ARTIFACT_CALC_START_INPUT_ID, levels.startLevel, maxLevel);
			setCalculatorNumberControlDefaults(calculator, ARTIFACT_CALC_END_INPUT_ID, levels.endLevel, maxLevel);
			syncCalculatorControlDefaults(calculator);
		}
		function applyLevelCalculatorDefaults(calculator, titanOptions) {
			const titanId = Number(readCalculatorControlString(calculator, LEVEL_CALC_TITAN_SELECT_ID, "0"));
			const levels = getLevelCalculatorDefaultLevels(titanOptions, titanId);
			const maxLevel = getMaxTitanLevel();
			setCalculatorNumberControlDefaults(calculator, LEVEL_CALC_START_INPUT_ID, levels.startLevel, maxLevel);
			setCalculatorNumberControlDefaults(calculator, LEVEL_CALC_END_INPUT_ID, levels.endLevel, maxLevel);
			syncCalculatorControlDefaults(calculator);
		}
		function applySkinCalculatorDefaults(calculator, titanOptions, skinGroups) {
			var _findSkinCalculatorEn;
			const titanId = Number(readCalculatorControlString(calculator, SKIN_CALC_TITAN_SELECT_ID, "0"));
			const localeKey = readCalculatorControlString(calculator, SKIN_CALC_GROUP_SELECT_ID, "");
			const levels = getSkinCalculatorDefaultLevels(titanOptions, skinGroups, titanId, localeKey);
			const maxLevel = (_findSkinCalculatorEn = findSkinCalculatorEntry(titanOptions, skinGroups, titanId, localeKey)) === null || _findSkinCalculatorEn === void 0 ? void 0 : _findSkinCalculatorEn.maxLevel;
			setCalculatorNumberControlDefaults(calculator, SKIN_CALC_START_INPUT_ID, levels.startLevel, maxLevel);
			setCalculatorNumberControlDefaults(calculator, SKIN_CALC_END_INPUT_ID, levels.endLevel, maxLevel);
			syncCalculatorControlDefaults(calculator);
		}
		function refreshCalculatorModels([changedInputId, artifactCalculator, levelCalculator, skinCalculator, artifactTitanOptions, levelTitanOptions, skinTitanOptions, skinGroups, artifactSettings, levelSettings, skinSettings, resourceAmount, goldAmount, potionAmount, skinStoneAmount]) {
			if (changedInputId === ARTIFACT_CALC_TITAN_SELECT_ID || changedInputId === ARTIFACT_CALC_SLOT_SELECT_ID) applyArtifactCalculatorDefaults(artifactCalculator, artifactTitanOptions);
			if (changedInputId === LEVEL_CALC_TITAN_SELECT_ID) applyLevelCalculatorDefaults(levelCalculator, levelTitanOptions);
			if (changedInputId === SKIN_CALC_TITAN_SELECT_ID || changedInputId === SKIN_CALC_GROUP_SELECT_ID) applySkinCalculatorDefaults(skinCalculator, skinTitanOptions, skinGroups);
			refreshArtifactCalculatorResult(artifactCalculator, artifactTitanOptions, artifactSettings, resourceAmount, goldAmount);
			refreshLevelCalculatorResult(levelCalculator, levelTitanOptions, levelSettings, potionAmount);
			refreshSkinCalculatorResult(skinCalculator, skinTitanOptions, skinGroups, skinSettings, skinStoneAmount);
		}
		return [refreshCalculatorModels];
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/lite/leveling-run-options.ts
	var NativeAmountPrompt = defineNativeView("titan-leveling-amount", (props) => {
		var _props$description, _props$amountLabel;
		const root = document.createElement("div");
		root.className = "hwhx-native-body hwhx-popup";
		const description = document.createElement("p");
		description.className = "hwhx-hint";
		description.textContent = String((_props$description = props.description) !== null && _props$description !== void 0 ? _props$description : "");
		const row = document.createElement("label");
		row.className = "hwhx-field-row";
		const label = document.createElement("span");
		label.textContent = String((_props$amountLabel = props.amountLabel) !== null && _props$amountLabel !== void 0 ? _props$amountLabel : "Количество");
		const input = document.createElement("input");
		input.type = "number";
		input.min = "0";
		input.className = "hwhx-field";
		const state = asPlainRecord(props.state);
		input.value = String(Math.max(0, Number(state.amount) || 0));
		input.addEventListener("input", () => {
			state.amount = Math.max(0, Math.trunc(Number(input.value) || 0));
		});
		row.append(label, input);
		root.append(description, row);
		return root;
	});
	function createTitanLevelingRunOptionsResolver(deps) {
		return async function resolve(settings, runOptions = {}) {
			var _settings$lastLevelin;
			if (normalizeLevelingMode(settings.levelingMode) !== "amount") return {
				confirmed: true,
				options: { source: runOptions.source }
			};
			if (runOptions.source === "checklist") {
				if (normalizeChecklistAmountBehavior(settings.checklistAmountBehavior) !== "default") {
					deps.showChecklistAmountSkipped();
					return {
						confirmed: false,
						options: {}
					};
				}
				return {
					confirmed: true,
					options: {
						source: runOptions.source,
						maxUpgradeCount: deps.getChecklistLevelingAmount(settings)
					}
				};
			}
			const state = { amount: (_settings$lastLevelin = settings.lastLevelingAmount) !== null && _settings$lastLevelin !== void 0 ? _settings$lastLevelin : deps.getChecklistLevelingAmount(settings) };
			const title = deps.translate("HWHTITANART_LEVELING_AMOUNT_PROMPT_TITLE");
			let selectedAmount;
			return {
				confirmed: await openNativeComponentModal({
					kind: "amount",
					title,
					header: deps.buildHeader(title),
					component: NativeAmountPrompt,
					props: {
						state,
						description: deps.translate("HWHTITANART_LEVELING_AMOUNT_PROMPT_DESCRIPTION"),
						amountLabel: deps.translate("HWHTITANART_LEVELING_AMOUNT")
					},
					actions: [{
						result: "confirm",
						label: deps.translate("HWHTITANART_LEVELING_AMOUNT_CONFIRM"),
						tone: "success"
					}],
					closeLabel: deps.translate("HWHTITANART_CLOSE"),
					onBeforeClose: (result) => {
						if (result === "confirm") selectedAmount = Math.max(0, Math.trunc(Number(state.amount) || 0));
						return result;
					}
				}) === "confirm",
				options: {
					source: runOptions.source,
					maxUpgradeCount: selectedAmount
				}
			};
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/trainer-selection-actions.ts
	function createTitanTrainerSelectionActions({ getActiveTab, artifactTitanOptions, levelTitanOptions, skinTitanOptions, getArtifactSettings, setArtifactSettings, normalizeArtifactSettings, getLevelSettings, setLevelSettings, normalizeLevelSettings, getSkinSettings, setSkinSettings, normalizeSkinSettings, persistSettings }) {
		const updateActiveSelection = async (selectedTitanIds) => {
			const activeTab = getActiveTab();
			if (activeTab === "levels") setLevelSettings(normalizeLevelSettings({
				...getLevelSettings(),
				selectedTitanIds
			}));
			else if (activeTab === "skins") setSkinSettings(normalizeSkinSettings({
				...getSkinSettings(),
				selectedTitanIds
			}));
			else setArtifactSettings(normalizeArtifactSettings({
				...getArtifactSettings(),
				selectedTitanIds
			}));
			await persistSettings();
		};
		return {
			selectAll: () => updateActiveSelection(getOwnedTitanIds(getOptionsForTab())),
			clearAll: () => updateActiveSelection([])
		};
		function getOptionsForTab() {
			const activeTab = getActiveTab();
			if (activeTab === "levels") return levelTitanOptions;
			if (activeTab === "skins") return skinTitanOptions;
			return artifactTitanOptions;
		}
	}
	function getOwnedTitanIds(options) {
		return options.filter((titanOption) => titanOption.owned).map((titanOption) => titanOption.id);
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
	//#region src/scripts/hwhtitanartifact/ui/trainer-dyb-placement.ts
	function normalizeRequestedModuleKeys(moduleKeys, moduleDefinitions) {
		if (Array.isArray(moduleKeys)) return moduleKeys.map((moduleKey) => String(moduleKey !== null && moduleKey !== void 0 ? moduleKey : "")).filter(Boolean);
		return moduleKeys ? [String(moduleKeys)] : moduleDefinitions.map((definition) => definition.key);
	}
	function createTitanTrainerDoYourBestPlacementFlow([translate, getTaskListSnapshot, readPlacement, persistPlacement, afterPersist, buildSelectControl]) {
		const buildPlacementOptionsFromTasks = createDoYourBestPlacementOptionsBuilder({
			translate,
			keys: {
				none: "HWHTITANART_DO_YOUR_BEST_PLACEMENT_NONE",
				start: "HWHTITANART_DO_YOUR_BEST_PLACEMENT_START",
				end: "HWHTITANART_DO_YOUR_BEST_PLACEMENT_END",
				before: "HWHTITANART_DO_YOUR_BEST_PLACEMENT_BEFORE",
				after: "HWHTITANART_DO_YOUR_BEST_PLACEMENT_AFTER"
			},
			includeStart: true
		});
		function getExternalTaskList() {
			return getTaskListSnapshot().filter((task) => !isTitanDoYourBestTask(task));
		}
		function buildPlacementModel(moduleKeys = void 0) {
			const placementOptions = buildPlacementOptionsFromTasks(getExternalTaskList());
			const moduleDefinitions = getTitanDoYourBestModuleDefinitions();
			const requestedModuleKeys = normalizeRequestedModuleKeys(moduleKeys, moduleDefinitions);
			const moduleDefinitionMap = new Map(moduleDefinitions.map((definition) => [definition.key, definition]));
			return {
				key: "do-your-best",
				stateKey: requestedModuleKeys.length === 1 ? `trainer:do-your-best:${requestedModuleKeys[0]}` : "trainer:do-your-best",
				title: translate("HWHTITANART_DO_YOUR_BEST_PLACEMENT_HEADER"),
				icon: "list-checks",
				accentColor: "#4d5770",
				defaultOpen: false,
				controls: requestedModuleKeys.map((moduleKey) => moduleDefinitionMap.get(moduleKey)).filter((definition) => definition !== void 0).map((definition) => {
					var _placementOptions$at$, _placementOptions$at;
					const storedPlacement = readPlacement(definition.key);
					const selectedPlacement = placementOptions.some((option) => option.value === storedPlacement) ? storedPlacement : (_placementOptions$at$ = (_placementOptions$at = placementOptions.at(-1)) === null || _placementOptions$at === void 0 ? void 0 : _placementOptions$at.value) !== null && _placementOptions$at$ !== void 0 ? _placementOptions$at$ : "end";
					return buildSelectControl({
						label: `${translate("HWHTITANART_DO_YOUR_BEST_PLACEMENT_LABEL")} · ${translate(definition.labelKey)}`,
						inputId: getDoYourBestPlacementSelectId(definition.key),
						value: selectedPlacement,
						options: placementOptions,
						icon: "list-checks",
						widthPx: 360,
						tooltip: translate("HWHTITANART_DO_YOUR_BEST_PLACEMENT_HINT")
					});
				})
			};
		}
		function persistPlacementFromControl(inputId, placement) {
			const normalizedInputId = String(inputId !== null && inputId !== void 0 ? inputId : "");
			const definition = getTitanDoYourBestModuleDefinitions().find((item) => getDoYourBestPlacementSelectId(item.key) === normalizedInputId);
			if (!definition) return false;
			const allowedValues = new Set(buildPlacementOptionsFromTasks(getExternalTaskList()).map((option) => option.value));
			const normalizedPlacement = String(placement !== null && placement !== void 0 ? placement : "");
			const nextPlacement = allowedValues.has(normalizedPlacement) ? normalizedPlacement : readPlacement(definition.key);
			persistPlacement(definition.key, nextPlacement);
			afterPersist();
			return true;
		}
		return [buildPlacementModel, persistPlacementFromControl];
	}
	//#endregion
	//#region src/shared/exclusive-task.ts
	function createExclusiveTaskRunner(onBusy) {
		let activeTask = null;
		return async function runExclusiveTask(task) {
			if (activeTask) {
				onBusy === null || onBusy === void 0 || onBusy();
				return false;
			}
			const currentTask = Promise.resolve().then(task);
			activeTask = currentTask;
			try {
				await currentTask;
				return true;
			} finally {
				if (activeTask === currentTask) activeTask = null;
			}
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/hotkey-bindings.ts
	function buildTitanTrainerHotkeyBindings({ readSettings, translate, openSettings, runAll, runArtifacts, runLevels, runSkins, isAvailable = () => !isRuntimeModalVisible() }) {
		const source = readSettings();
		const hotkeys = normalizeHotkeyMap((source && typeof source === "object" && !Array.isArray(source) ? source : {}).hotkeys, DEFAULT_SETTINGS.hotkeys);
		return [
			{
				id: "hwhtitantrainer:open-settings",
				label: translate("HWHTITANTRAINER_HOTKEY_OPEN_SETTINGS"),
				shortcut: hotkeys.openSettings,
				enabled: isAvailable,
				handler: openSettings
			},
			{
				id: "hwhtitantrainer:run-all",
				label: translate("HWHTITANTRAINER_HOTKEY_RUN_ALL"),
				shortcut: hotkeys.runAll,
				enabled: isAvailable,
				handler: runAll
			},
			{
				id: "hwhtitantrainer:run-artifacts",
				label: translate("HWHTITANTRAINER_HOTKEY_RUN_ARTIFACTS"),
				shortcut: hotkeys.runArtifacts,
				enabled: isAvailable,
				handler: runArtifacts
			},
			{
				id: "hwhtitantrainer:run-levels",
				label: translate("HWHTITANTRAINER_HOTKEY_RUN_LEVELS"),
				shortcut: hotkeys.runLevels,
				enabled: isAvailable,
				handler: runLevels
			},
			{
				id: "hwhtitantrainer:run-skins",
				label: translate("HWHTITANTRAINER_HOTKEY_RUN_SKINS"),
				shortcut: hotkeys.runSkins,
				enabled: isAvailable,
				handler: runSkins
			}
		];
	}
	function registerTitanTrainerHotkeys(options) {
		const runExclusive = createExclusiveTaskRunner();
		const wrap = (command) => () => runExclusive(command);
		return registerHotkeyScope("hwhtitantrainer", { getBindings: () => buildTitanTrainerHotkeyBindings({
			...options,
			openSettings: wrap(options.openSettings),
			runAll: wrap(options.runAll),
			runArtifacts: wrap(options.runArtifacts),
			runLevels: wrap(options.runLevels),
			runSkins: wrap(options.runSkins)
		}) });
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/titan-level-priority-model.ts
	function buildTitanLevelPriorityModel({ titanOptions, settings, inventory, levelGainAmount = 0, accordionKey = "level-priority", translate, buildOption, buildBadges, buildActions, getLevelCap, getMaxLevel }) {
		const selectedTitanIdSet = new Set(normalizeTitanIdValues(settings.selectedTitanIds));
		const [selectedCount, ownedCount] = countSelectedOwnedTitanOptions(titanOptions, selectedTitanIdSet);
		return {
			kind: "priority",
			accordionKey,
			stateKey: `titan-list:${accordionKey}`,
			defaultOpen: true,
			accentColor: "#4d5770",
			icon: "list-ordered",
			title: translate("HWHTITANLVL_PRIORITY_HEADER"),
			note: translate("HWHTITANLVL_PRIORITY_HINT"),
			reorderDisabled: normalizeUpgradeMode(settings.upgradeMode, UPGRADE_MODE_PARALLEL) === UPGRADE_MODE_PARALLEL,
			reorderDisabledHint: translate("HWHTITANTRAINER_PARALLEL_REORDER_HINT"),
			...buildTitanPriorityToolbarText(translate),
			optionVariant: "level",
			badges: buildBadges(selectedCount, ownedCount, levelGainAmount),
			rows: titanOptions.map((titanOption, index) => {
				const titanId = Number(titanOption.id);
				return {
					key: String(titanId),
					index,
					orderKey: String(titanId),
					checked: selectedTitanIdSet.has(titanId),
					disabled: !titanOption.owned,
					inputId: `${TITAN_SELECTION_INPUT_PREFIX}level-${titanId}`,
					titanId,
					option: buildOption(titanOption, settings, inventory),
					capInputId: `${TITAN_LEVEL_CAP_INPUT_PREFIX}${titanId}`,
					capLabel: translate("HWHTITANLVL_TARGET_LEVEL"),
					capTitle: translate("HWHTITAN_TOOLTIP_TITAN_LEVEL_CAP"),
					capValue: getLevelCap(settings, titanId),
					capMaxValue: getMaxLevel(),
					actionAttribute: TITAN_LEVEL_REORDER_ACTION_ATTRIBUTE,
					actions: buildActions(),
					childrenTitle: "",
					childrenIcon: "",
					childrenId: `hwhtitan-priority-children-level-${titanId}`,
					children: [],
					filterRow: titanOption.owned,
					searchText: `${titanOption.name} ${titanOption.level}`
				};
			})
		};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/ui/trainer-state.ts
	function sanitizeSelectedTitanIds(selectedTitanIds, ownedTitans) {
		const ownedTitanMap = toPlainRecord(ownedTitans);
		const ownedTitanIdSet = new Set(Object.keys(ownedTitanMap).map((value) => Number(value)).filter((value) => Number.isFinite(value)));
		const seenTitanIds = /* @__PURE__ */ new Set();
		return (Array.isArray(selectedTitanIds) ? selectedTitanIds : []).map((value) => Number(value)).filter((value) => {
			if (!Number.isFinite(value) || !ownedTitanIdSet.has(value)) return false;
			if (seenTitanIds.has(value)) return false;
			seenTitanIds.add(value);
			return true;
		});
	}
	function sanitizeTitanTrainerSettingsForSnapshot({ artifactSettings, levelSettings, skinSettings, ownedTitans, normalizeArtifactSettings, normalizeLevelSettings, normalizeSkinSettings }) {
		return {
			artifactSettings: normalizeArtifactSettings({
				...artifactSettings,
				selectedTitanIds: sanitizeSelectedTitanIds(artifactSettings.selectedTitanIds, ownedTitans)
			}),
			levelSettings: normalizeLevelSettings({
				...levelSettings,
				selectedTitanIds: sanitizeSelectedTitanIds(levelSettings.selectedTitanIds, ownedTitans),
				selectedTitanEvolutionIds: sanitizeSelectedTitanIds(levelSettings.selectedTitanEvolutionIds, ownedTitans)
			}),
			skinSettings: normalizeSkinSettings({
				...skinSettings,
				selectedTitanIds: sanitizeSelectedTitanIds(skinSettings.selectedTitanIds, ownedTitans)
			})
		};
	}
	function toPlainRecord(value) {
		return value && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	//#endregion
	//#region src/scripts/hwhtitanartifact/runtime/index.ts
	function initializeTitanArtifactLeveler(attempt) {
		"use strict";
		if (!retryHwhRuntimeInitialization({
			attempt: Number(attempt) || 0,
			maxAttempts: 120,
			delayMs: 500,
			requiredKeys: [
				"HWHClasses",
				"HWHFuncs",
				"HWHData"
			],
			retry: initializeTitanArtifactLeveler,
			logPrefix: "[TitanArtifact]",
			scriptName: "HWH Titan Trainer"
		})) return;
		installSettingsDownloadBridge();
		const runtimeGlobal = globalThis;
		const HWHFuncs = getPlainRecord(runtimeGlobal.HWHFuncs);
		const HWHData = getPlainRecord(runtimeGlobal.HWHData);
		const HWHClasses = getPlainRecord(runtimeGlobal.HWHClasses);
		const addExtensionName = typeof HWHFuncs.addExtentionName === "function" ? HWHFuncs.addExtentionName : () => void 0;
		const { I18N } = HWHFuncs;
		const { setProgress, setStageProgress, showResult, configure: configureProgress } = createRuntimeProgressController({
			scriptId: "hwhtitanartifact",
			title: GM_info.script.name
		});
		const i18nLangData = getTitanArtifactTranslations();
		const mainMenuButtons = isPlainObject(HWHData.buttons) ? HWHData.buttons : HWHData.buttons = {};
		const othersPopupButtons = Array.isArray(HWHData.othersPopupButtons) ? HWHData.othersPopupButtons : HWHData.othersPopupButtons = [];
		const translate = createTranslator({
			I18N,
			i18nLangData,
			preferGameI18N: false,
			fallbackLanguage: "en",
			cacheMissingTranslations: true
		});
		const formatNumber = createNumberFormatter({ locale: "ru-RU" });
		const formatSignedNumber = createSignedNumberFormatter({ locale: "ru-RU" });
		const buildIconLabel = (iconName, label, className = "hwhx-title-accent", title = "") => renderIconLabel(iconName, label, {
			className,
			iconClassName: className,
			title
		});
		const { getArtifactLevelCapForTitan, getArtifactRuleForTitan, getArtifactSlotIdsForTitan, getChecklistLevelingAmount, getSelectedArtifactSlotIdsFromRules, getSelectedSkinLocaleKeysFromRules, getSkinLevelCapForTitan, getSkinRuleForTitan, getTitanLevelCapForTitan, normalizeArtifactRules, normalizeLevelSettings, normalizeSettings, normalizeSkinRules, normalizeSkinSettings } = createTitanSettingsSchema({
			getConfigTitanIds,
			getDefaultArtifactLevelCap,
			getDefaultTitanSkinLevelCap,
			getMaxKnownTitanArtifactStar,
			getMaxTitanEvolutionStar,
			getMaxTitanLevel,
			getTitanSkinGroups,
			getTitanTrainerButtonPlacementFallback: readStoredTitanTrainerButtonPlacementSync
		});
		const titanFinalSummaryBuilders = createTitanFinalSummaryBuilders({
			translate,
			formatNumber,
			getFragmentCoinResourceName: getTitanArtifactFragmentCoinResourceName
		});
		const [buildArtifactPurchaseProgressHtml, buildArtifactEvolutionProgressHtml, buildArtifactUpgradeChunkProgressHtml, buildArtifactUpgradeProgressHtml] = createTitanArtifactProgressBuilders([
			translate,
			formatNumber,
			buildIconLabel
		]);
		const [buildSkinUpgradeChunkProgressHtml, buildSkinUpgradeProgressHtml] = createTitanSkinProgressBuilders([
			translate,
			formatNumber,
			buildIconLabel
		]);
		const [buildTitanEvolutionProgressHtml, buildTitanLevelUpgradeChunkProgressHtml, buildTitanLevelUpgradeProgressHtml, buildTitanXpPotionPurchaseProgressHtml] = createTitanLevelProgressBuilders([
			translate,
			formatNumber,
			buildIconLabel
		]);
		const resolveTitanLevelingRunOptions = createTitanLevelingRunOptionsResolver({
			translate,
			buildHeader: buildRuntimeModalHeader,
			getChecklistLevelingAmount,
			showChecklistAmountSkipped: () => {
				showProgressMessage(translate("HWHTITANART_CHECKLIST_AMOUNT_SKIPPED"));
			}
		});
		let currentTitanTrainerUiTheme = UI_THEME_CLASSIC;
		const artifactSettingsStorage = new VersionedStorage({
			keyPrefix: SETTINGS_STORAGE_PREFIX,
			schemaVersion: 3
		});
		const levelSettingsStorage = new VersionedStorage({
			keyPrefix: LEVEL_SETTINGS_STORAGE_PREFIX,
			schemaVersion: 3
		});
		const skinSettingsStorage = new VersionedStorage({
			keyPrefix: SKIN_SETTINGS_STORAGE_PREFIX,
			schemaVersion: 3
		});
		const doYourBestPlacementStorage = new VersionedStorage({
			keyPrefix: DO_YOUR_BEST_PLACEMENT_STORAGE_KEY,
			schemaVersion: 3
		});
		const gameRuntimeReadiness = createRuntimeReadinessController({
			timeoutMs: USER_ID_WAIT_TIMEOUT_MS,
			pollDelayMs: 250,
			errorMessage: () => translate("HWHTITANART_RUNTIME_WAIT_ERROR"),
			isReady: () => {
				var _globalThis$cheats, _globalThis$lib, _globalThis$lib2, _globalThis$lib3;
				return typeof globalThis.Send === "function" && typeof ((_globalThis$cheats = globalThis.cheats) === null || _globalThis$cheats === void 0 ? void 0 : _globalThis$cheats.translate) === "function" && !!((_globalThis$lib = globalThis.lib) === null || _globalThis$lib === void 0 || (_globalThis$lib = _globalThis$lib.data) === null || _globalThis$lib === void 0 ? void 0 : _globalThis$lib.titan) && !!((_globalThis$lib2 = globalThis.lib) === null || _globalThis$lib2 === void 0 || (_globalThis$lib2 = _globalThis$lib2.data) === null || _globalThis$lib2 === void 0 ? void 0 : _globalThis$lib2.titanArtifact) && !!((_globalThis$lib3 = globalThis.lib) === null || _globalThis$lib3 === void 0 || (_globalThis$lib3 = _globalThis$lib3.data) === null || _globalThis$lib3 === void 0 ? void 0 : _globalThis$lib3.skin);
			}
		});
		const userIdReadiness = createUserIdReadinessController({
			timeoutMs: USER_ID_WAIT_TIMEOUT_MS,
			pollDelayMs: 250,
			errorMessage: () => translate("HWHTITANART_USER_ID_WAIT_ERROR")
		});
		const ensureGameRuntimeReady = gameRuntimeReadiness.ensureReady;
		const ensureUserIdReady = userIdReadiness.ensureReady;
		const accordionStateController = createTitanAccordionStateController(new NativeStorage({
			name: "hwhtitantrainer-accordions",
			schemaVersion: 3
		}), new VersionedStorage({
			keyPrefix: "hwhtitantrainer_accordion_filters_",
			schemaVersion: 3
		}), ensureUserIdReady);
		let configTitanIdsCache = void 0;
		let maxTitanLevelCache = void 0;
		let maxTitanEvolutionStarCache = void 0;
		let maxKnownTitanArtifactStarCache = void 0;
		let titanSkinGroupsCache = void 0;
		const titanSkinInfoCache = /* @__PURE__ */ new Map();
		const defaultTitanSkinLevelCapCache = /* @__PURE__ */ new Map();
		const titanArtifactConfigCache = /* @__PURE__ */ new Map();
		const titanArtifactEvolutionRowsCache = /* @__PURE__ */ new Map();
		const titanArtifactMaxStarCache = /* @__PURE__ */ new Map();
		const defaultArtifactLevelCapCache = /* @__PURE__ */ new Map();
		const gameTranslationCache = /* @__PURE__ */ new Map();
		const normalizeDoYourBestPlacement = createDoYourBestPlacementNormalizer({ allowStart: true });
		const getDoYourBestTaskListSnapshot = createDoYourBestTaskListSnapshotReader({
			getDoYourBestClass: () => getHeroWarsDoYourBestClass(HWHClasses),
			logPrefix: "[TitanArtifact]"
		});
		const buildPostRunSyncMessage = createPostRunSyncMessageBuilder({
			buildSuccessMessage: () => `<br>${buildIconLabel("refresh-cw", translate("HWHTITANART_POST_SYNC_DONE"))}`,
			buildFailureMessage: () => `<br>${buildIconLabel("refresh-cw", translate("HWHTITANART_POST_SYNC_FAILED"), "hwhx-gold")}`,
			logPrefix: "[TitanArtifact]"
		});
		const [buildArtifactErrorResult, buildArtifactSuccessResult] = createTitanArtifactRunResultBuilders([
			translate,
			formatNumber,
			titanFinalSummaryBuilders.buildFinalSummaryProps,
			buildPostRunSyncMessage,
			RuntimeResultSummary
		]);
		const [buildTitanSkinErrorResult, buildTitanSkinSuccessResult, buildTitanLevelErrorResult, buildTitanLevelSuccessResult] = createTitanLevelingRunResultBuilders([
			translate,
			formatNumber,
			titanFinalSummaryBuilders.buildFinalTitanSkinSummaryProps,
			titanFinalSummaryBuilders.buildFinalTitanLevelSummaryProps,
			buildPostRunSyncMessage,
			RuntimeResultSummary
		]);
		function logArtifactFragmentDebug(message, data = void 0) {
			if (data === void 0) {
				console.log("[hwhtitanartifact:fragments]", message);
				return;
			}
			console.log("[hwhtitanartifact:fragments]", message, data);
		}
		const showProgressMessage = createTitanProgressWriter({
			setProgress,
			setStageProgress
		});
		function showFinalProgress(content, options = {}) {
			showResult(content, options);
		}
		function applyTitanTrainerUiTheme(settingsOrTheme = DEFAULT_SETTINGS) {
			var _settingsRecord$uiThe;
			const settingsRecord = getPlainRecord(settingsOrTheme);
			currentTitanTrainerUiTheme = typeof settingsOrTheme === "string" ? normalizeUiTheme(settingsOrTheme) : normalizeUiTheme((_settingsRecord$uiThe = settingsRecord.uiTheme) !== null && _settingsRecord$uiThe !== void 0 ? _settingsRecord$uiThe : currentTitanTrainerUiTheme);
		}
		function applyTitanTrainerUiPreferences(settings = DEFAULT_SETTINGS) {
			applyTitanTrainerUiTheme(settings);
			const tooltipsEnabled = setTooltipsEnabled((settings === null || settings === void 0 ? void 0 : settings.uiTooltipsEnabled) !== false);
			setAccordionAutoScrollMode(normalizeAccordionAutoScrollMode(settings === null || settings === void 0 ? void 0 : settings.accordionAutoScrollMode, getAccordionAutoScrollMode()));
			configureProgress(settings);
			syncTitanTrainerActionPlacement(settings);
			return tooltipsEnabled;
		}
		async function refreshTitanSnapshotAfterRun() {
			try {
				titanSnapshotCache.invalidate();
				await titanSnapshotCache.get();
			} catch (error) {
				console.error("[TitanArtifact] post-run snapshot refresh failed", error);
			}
		}
		function getArtifactSlotMeta(slotId) {
			const numericSlotId = Number(slotId);
			if (numericSlotId === 0) return {
				icon: "swords",
				className: "hwhx-gold",
				label: translate("HWHTITANART_ARTIFACT_WEAPON")
			};
			if (numericSlotId === 1) return {
				icon: "trophy",
				className: "hwhx-purple",
				label: translate("HWHTITANART_ARTIFACT_CROWN")
			};
			return {
				icon: "gem",
				className: "hwhx-gold",
				label: translate("HWHTITANART_ARTIFACT_SEAL")
			};
		}
		function readStoredDoYourBestPlacementMapSync() {
			try {
				return normalizeDoYourBestPlacementMap(doYourBestPlacementStorage.read("", "end"));
			} catch (error) {
				console.warn("[TitanArtifact] checklist placement read failed", error);
				return normalizeDoYourBestPlacementMap("end");
			}
		}
		function readStoredDoYourBestPlacementSync(moduleKey = void 0) {
			var _placementMap$String;
			const placementMap = readStoredDoYourBestPlacementMapSync();
			if (moduleKey === void 0) return placementMap;
			return (_placementMap$String = placementMap[String(moduleKey)]) !== null && _placementMap$String !== void 0 ? _placementMap$String : normalizeDoYourBestPlacement("end");
		}
		function persistDoYourBestPlacementMapSync(placementMap) {
			try {
				doYourBestPlacementStorage.write("", normalizeDoYourBestPlacementMap(placementMap));
			} catch (error) {
				console.warn("[TitanArtifact] checklist placement write failed", error);
			}
		}
		function persistDoYourBestPlacementSync(moduleKey, placement) {
			const placementMap = readStoredDoYourBestPlacementMapSync();
			placementMap[String(moduleKey)] = normalizeDoYourBestPlacement(placement);
			persistDoYourBestPlacementMapSync(placementMap);
		}
		const getTitanAccordionUiProps = accordionStateController.getTitanAccordionUiProps;
		let titanTrainerHotkeySettings = DEFAULT_SETTINGS;
		const artifactSettingsRepository = createSettingsRepository({
			storage: artifactSettingsStorage,
			defaultValue: DEFAULT_SETTINGS,
			normalize: normalizeSettings,
			getScopeKey: ensureUserIdReady,
			beforeRead: ensureGameRuntimeReady,
			beforeWrite: ensureGameRuntimeReady,
			afterRead: (settings) => {
				titanTrainerHotkeySettings = settings;
				applyTitanTrainerUiPreferences(settings);
			},
			afterWrite: (settings) => {
				titanTrainerHotkeySettings = settings;
				applyTitanTrainerUiPreferences(settings);
			}
		});
		const levelSettingsRepository = createSettingsRepository({
			storage: levelSettingsStorage,
			defaultValue: DEFAULT_LEVEL_SETTINGS,
			normalize: normalizeLevelSettings,
			getScopeKey: ensureUserIdReady,
			beforeRead: ensureGameRuntimeReady,
			beforeWrite: ensureGameRuntimeReady
		});
		const skinSettingsRepository = createSettingsRepository({
			storage: skinSettingsStorage,
			defaultValue: DEFAULT_SKIN_SETTINGS,
			normalize: normalizeSkinSettings,
			getScopeKey: ensureUserIdReady,
			beforeRead: ensureGameRuntimeReady,
			beforeWrite: ensureGameRuntimeReady
		});
		const readSettings = artifactSettingsRepository.read;
		const writeSettings = artifactSettingsRepository.write;
		const readLevelSettings = levelSettingsRepository.read;
		const writeLevelSettings = levelSettingsRepository.write;
		const readSkinSettings = skinSettingsRepository.read;
		const writeSkinSettings = skinSettingsRepository.write;
		function showSettingsNotice(message, iconName = "check", className = "hwhx-green") {
			showFinalProgress(buildIconLabel(iconName, String(message !== null && message !== void 0 ? message : ""), className));
		}
		const [, exportSettingsToJson, importSettingsFromJson] = createTitanTrainerSettingsTransferFlow([
			translate,
			normalizeSettings,
			normalizeLevelSettings,
			normalizeSkinSettings,
			normalizeDoYourBestPlacementMap,
			ensureUserIdReady,
			() => {
				var _GM_info$script, _GM_info;
				return (_GM_info$script = (_GM_info = GM_info) === null || _GM_info === void 0 ? void 0 : _GM_info.script) !== null && _GM_info$script !== void 0 ? _GM_info$script : {};
			},
			readSettings,
			readLevelSettings,
			readSkinSettings,
			readStoredDoYourBestPlacementSync,
			writeSettings,
			writeLevelSettings,
			writeSkinSettings,
			persistDoYourBestPlacementMapSync,
			registerDoYourBestTitanTasks,
			(message) => showSettingsNotice(message),
			3
		]);
		function getMaxTitanLevel() {
			var _globalThis$lib$data$, _globalThis$lib4;
			if (maxTitanLevelCache !== void 0) return maxTitanLevelCache;
			maxTitanLevelCache = Object.keys((_globalThis$lib$data$ = (_globalThis$lib4 = globalThis.lib) === null || _globalThis$lib4 === void 0 || (_globalThis$lib4 = _globalThis$lib4.data) === null || _globalThis$lib4 === void 0 || (_globalThis$lib4 = _globalThis$lib4.level) === null || _globalThis$lib4 === void 0 ? void 0 : _globalThis$lib4.titan) !== null && _globalThis$lib$data$ !== void 0 ? _globalThis$lib$data$ : {}).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0).reduce((maxValue, value) => Math.max(maxValue, value), 0);
			return maxTitanLevelCache;
		}
		function getDefaultArtifactLevelCap(slotId) {
			const normalizedSlotId = Number(slotId);
			if (defaultArtifactLevelCapCache.has(normalizedSlotId)) {
				var _defaultArtifactLevel;
				return (_defaultArtifactLevel = defaultArtifactLevelCapCache.get(normalizedSlotId)) !== null && _defaultArtifactLevel !== void 0 ? _defaultArtifactLevel : 999;
			}
			const maxLevel = getConfigTitanIds().reduce((bestLevel, titanId) => {
				var _getTitanArtifactConf, _getTitanArtifactConf2;
				const titanMaxLevel = getMaxArtifactLevelFromConfig((_getTitanArtifactConf = (_getTitanArtifactConf2 = getTitanArtifactConfig(titanId, normalizedSlotId)) === null || _getTitanArtifactConf2 === void 0 ? void 0 : _getTitanArtifactConf2.levelConfigMap) !== null && _getTitanArtifactConf !== void 0 ? _getTitanArtifactConf : {});
				return Math.max(bestLevel, titanMaxLevel);
			}, 0);
			const levelCap = maxLevel > 0 ? maxLevel : 999;
			defaultArtifactLevelCapCache.set(normalizedSlotId, levelCap);
			return levelCap;
		}
		function getTitanArtifactMaxLevel(titanId, slotId) {
			var _getTitanArtifactConf3, _getTitanArtifactConf4;
			const maxLevel = getMaxArtifactLevelFromConfig((_getTitanArtifactConf3 = (_getTitanArtifactConf4 = getTitanArtifactConfig(titanId, slotId)) === null || _getTitanArtifactConf4 === void 0 ? void 0 : _getTitanArtifactConf4.levelConfigMap) !== null && _getTitanArtifactConf3 !== void 0 ? _getTitanArtifactConf3 : {});
			return maxLevel > 0 ? maxLevel : getDefaultArtifactLevelCap(slotId);
		}
		const sendCalls = createTitanCallSender([() => globalThis.Send, translate]);
		const titanSnapshotCache = createExpiringAsyncCache({
			ttlMs: 5e3,
			load: () => fetchTitanSnapshot(sendCalls, true, true)
		});
		const sendCallsInChunks = createChunkedCallSender({ sendChunk: (chunk) => sendCalls(chunk) });
		const runTitanArtifactExecutionSequence = createTitanArtifactExecutionRunner([
			sendCallsInChunks,
			showProgressMessage,
			buildArtifactPurchaseProgressHtml,
			buildArtifactEvolutionProgressHtml,
			buildArtifactUpgradeChunkProgressHtml,
			buildArtifactUpgradeProgressHtml,
			logArtifactFragmentDebug,
			() => translate("HWHTITANART_ERROR_GENERIC")
		]);
		const runTitanSkinExecutionSequence = createTitanSkinExecutionRunner([
			sendCallsInChunks,
			showProgressMessage,
			buildSkinUpgradeChunkProgressHtml,
			buildSkinUpgradeProgressHtml,
			() => translate("HWHTITANART_ERROR_GENERIC")
		]);
		const runTitanLevelExecutionSequence = createTitanLevelExecutionRunner([
			sendCallsInChunks,
			showProgressMessage,
			buildTitanEvolutionProgressHtml,
			buildTitanLevelUpgradeChunkProgressHtml,
			buildTitanLevelUpgradeProgressHtml,
			() => translate("HWHTITANART_ERROR_GENERIC"),
			buildTitanXpPotionPurchaseProgressHtml
		]);
		async function fetchTitanShop(shopId, ident) {
			return getCallResponseRecord(await sendCalls([{
				name: "shopGet",
				args: { shopId },
				ident
			}]), 0);
		}
		const fetchTitanArtifactFragmentShop = () => fetchTitanShop(13, "titanArtifactFragmentShop");
		const fetchTitanXpPotionShop = () => fetchTitanShop(12, "titanXpPotionShop");
		function getTitanName(titanId) {
			return getCachedGameTranslation(`LIB_HERO_NAME_${titanId}`, "HWHTITANART_TITAN_FALLBACK", { id: titanId });
		}
		function getCachedGameTranslation(translationKey, fallbackKey, fallbackParams) {
			var _globalThis$cheats2, _globalThis$cheats2$t;
			const cachedName = gameTranslationCache.get(translationKey);
			if (cachedName) return cachedName;
			const translatedName = (_globalThis$cheats2 = globalThis.cheats) === null || _globalThis$cheats2 === void 0 || (_globalThis$cheats2$t = _globalThis$cheats2.translate) === null || _globalThis$cheats2$t === void 0 ? void 0 : _globalThis$cheats2$t.call(_globalThis$cheats2, translationKey);
			const name = translatedName && translatedName !== translationKey ? String(translatedName) : translate(fallbackKey, fallbackParams);
			gameTranslationCache.set(translationKey, name);
			return name;
		}
		function getArtifactResourceName() {
			return getCachedGameTranslation(`LIB_CONSUMABLE_NAME_53`, "HWHTITANART_RESOURCE_FALLBACK");
		}
		function getGoldResourceName() {
			return translate("HWHTITANART_GOLD_RESOURCE");
		}
		function getTitanArtifactFragmentCoinResourceName() {
			return getCachedGameTranslation(`LIB_COIN_NAME_18`, "HWHTITANART_FRAGMENT_COIN_RESOURCE");
		}
		function getTitanXpResourceName() {
			return getCachedGameTranslation(`LIB_CONSUMABLE_NAME_20`, "HWHTITANLVL_RESOURCE_FALLBACK");
		}
		function getTitanSkinResourceName() {
			return getCachedGameTranslation(`LIB_COIN_NAME_24`, "HWHTITANSKIN_RESOURCE_FALLBACK");
		}
		function getResourceAmount(inventory) {
			const consumable = getPlainRecord(getPlainRecord(inventory).consumable);
			return Math.max(0, Number(consumable[String(53)]) || 0);
		}
		function getTitanXpPotionAmount(inventory) {
			const consumable = getPlainRecord(getPlainRecord(inventory).consumable);
			return Math.max(0, Number(consumable[String(20)]) || 0);
		}
		function getTitanSoulAmount(inventory, titanId) {
			const fragmentTitan = getPlainRecord(getPlainRecord(inventory).fragmentTitan);
			return Math.max(0, Number(fragmentTitan[String(Math.max(0, Number(titanId) || 0))]) || 0);
		}
		function getTitanSkinStoneAmount(inventory) {
			const coin = getPlainRecord(getPlainRecord(inventory).coin);
			return Math.max(0, Number(coin[String(24)]) || 0);
		}
		function getTitanSoulCoinAmount(inventory) {
			const coin = getPlainRecord(getPlainRecord(inventory).coin);
			return Math.max(0, Number(coin[String(15)]) || 0);
		}
		function getTitanArtifactFragmentCoinAmount(inventory) {
			const coin = getPlainRecord(getPlainRecord(inventory).coin);
			return Math.max(0, Number(coin[String(18)]) || 0);
		}
		function getTitanArtifactFragmentAmount(inventory, artifactId) {
			const fragmentTitanArtifact = getPlainRecord(getPlainRecord(inventory).fragmentTitanArtifact);
			return Math.max(0, Number(fragmentTitanArtifact[String(Math.max(0, Number(artifactId) || 0))]) || 0);
		}
		function getGoldAmount(userInfo) {
			return Math.max(0, Number(getPlainRecord(userInfo).gold) || 0);
		}
		function getConfigTitanIds() {
			if (Array.isArray(configTitanIdsCache)) return configTitanIdsCache;
			const titanConfigMap = getGameDataRecord("titan");
			configTitanIdsCache = Object.keys(titanConfigMap).map((value) => Number(value)).filter((value) => Number.isFinite(value)).filter((value) => Number(getRecordEntry(titanConfigMap, value).isPlayable) === 1).sort((left, right) => left - right);
			return configTitanIdsCache;
		}
		function getTitanSkinDisplayName(localeKey, skinId) {
			var _globalThis$cheats3, _globalThis$cheats3$t;
			const normalizedLocaleKey = String(localeKey !== null && localeKey !== void 0 ? localeKey : "").trim();
			const translatedName = normalizedLocaleKey ? (_globalThis$cheats3 = globalThis.cheats) === null || _globalThis$cheats3 === void 0 || (_globalThis$cheats3$t = _globalThis$cheats3.translate) === null || _globalThis$cheats3$t === void 0 ? void 0 : _globalThis$cheats3$t.call(_globalThis$cheats3, normalizedLocaleKey) : "";
			if (translatedName && translatedName !== normalizedLocaleKey) return translatedName;
			return normalizedLocaleKey || translate("HWHTITANSKIN_SKIN_FALLBACK", { id: skinId });
		}
		function getTitanSkinMaxLevelFromConfig(levelConfigMap) {
			return Object.keys(levelConfigMap !== null && levelConfigMap !== void 0 ? levelConfigMap : {}).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0).reduce((maxValue, value) => Math.max(maxValue, value), 0);
		}
		function getTitanSkinInfo(skinId) {
			var _skinConfig$localeKey, _getPlainRecord$level;
			const numericSkinId = Math.max(0, Number(skinId) || 0);
			if (numericSkinId <= 1e4) return;
			if (titanSkinInfoCache.has(numericSkinId)) return titanSkinInfoCache.get(numericSkinId);
			const skinConfigValue = getRecordValue(getGameDataRecord("skin"), numericSkinId);
			if (!isPlainObject(skinConfigValue)) return;
			const skinConfig = skinConfigValue;
			const localeKey = String((_skinConfig$localeKey = skinConfig.localeKey) !== null && _skinConfig$localeKey !== void 0 ? _skinConfig$localeKey : "").trim();
			const levelConfigMap = (_getPlainRecord$level = getPlainRecord(skinConfig.statData).levels) !== null && _getPlainRecord$level !== void 0 ? _getPlainRecord$level : {};
			const skinInfo = {
				skinId: numericSkinId,
				localeKey,
				name: getTitanSkinDisplayName(localeKey, numericSkinId),
				levelConfigMap,
				maxLevel: getTitanSkinMaxLevelFromConfig(levelConfigMap)
			};
			titanSkinInfoCache.set(numericSkinId, skinInfo);
			return skinInfo;
		}
		function getTitanSkinGroups() {
			if (Array.isArray(titanSkinGroupsCache)) return titanSkinGroupsCache;
			const groups = /* @__PURE__ */ new Map();
			Object.keys(getGameDataRecord("skin")).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 1e4).sort((left, right) => left - right).forEach((skinId) => {
				const skinInfo = getTitanSkinInfo(skinId);
				if (!(skinInfo === null || skinInfo === void 0 ? void 0 : skinInfo.localeKey)) return;
				if (!groups.has(skinInfo.localeKey)) {
					groups.set(skinInfo.localeKey, {
						localeKey: skinInfo.localeKey,
						name: skinInfo.name,
						skinIds: [skinInfo.skinId],
						maxLevel: skinInfo.maxLevel,
						sortId: skinInfo.skinId
					});
					return;
				}
				const group = groups.get(skinInfo.localeKey);
				if (!group) return;
				group.skinIds.push(skinInfo.skinId);
				group.maxLevel = Math.max(group.maxLevel, skinInfo.maxLevel);
				group.sortId = Math.min(group.sortId, skinInfo.skinId);
			});
			titanSkinGroupsCache = [...groups.values()].sort((left, right) => {
				const localeCompareResult = compareRussianText(left.name, right.name);
				if (localeCompareResult !== 0) return localeCompareResult;
				return left.sortId - right.sortId;
			});
			return titanSkinGroupsCache;
		}
		function getDefaultTitanSkinLevelCap(localeKey) {
			const normalizedLocaleKey = String(localeKey !== null && localeKey !== void 0 ? localeKey : "").trim();
			if (defaultTitanSkinLevelCapCache.has(normalizedLocaleKey)) {
				var _defaultTitanSkinLeve;
				return (_defaultTitanSkinLeve = defaultTitanSkinLevelCapCache.get(normalizedLocaleKey)) !== null && _defaultTitanSkinLeve !== void 0 ? _defaultTitanSkinLeve : 999;
			}
			const matchedGroup = getTitanSkinGroups().find((group) => group.localeKey === normalizedLocaleKey);
			const levelCap = matchedGroup && matchedGroup.maxLevel > 0 ? matchedGroup.maxLevel : 999;
			defaultTitanSkinLevelCapCache.set(normalizedLocaleKey, levelCap);
			return levelCap;
		}
		function getTitanSkinEntries(titanData) {
			const entriesByLocaleKey = /* @__PURE__ */ new Map();
			const skinLevelMap = getPlainRecord(getPlainRecord(titanData).skins);
			Object.entries(skinLevelMap).forEach(([skinId, level]) => {
				const skinInfo = getTitanSkinInfo(skinId);
				if (!(skinInfo === null || skinInfo === void 0 ? void 0 : skinInfo.localeKey)) return;
				const entry = {
					...skinInfo,
					currentLevel: Math.max(0, Number(level) || 0)
				};
				const existingEntry = entriesByLocaleKey.get(skinInfo.localeKey);
				if (!existingEntry || entry.currentLevel > existingEntry.currentLevel || entry.currentLevel === existingEntry.currentLevel && entry.skinId < existingEntry.skinId) entriesByLocaleKey.set(skinInfo.localeKey, entry);
			});
			return [...entriesByLocaleKey.values()].sort((left, right) => {
				const localeCompareResult = compareRussianText(left.name, right.name);
				if (localeCompareResult !== 0) return localeCompareResult;
				return left.skinId - right.skinId;
			});
		}
		function getTitanSkinLevelData(skinId, level) {
			var _getTitanSkinInfo;
			const levelConfigMap = (_getTitanSkinInfo = getTitanSkinInfo(skinId)) === null || _getTitanSkinInfo === void 0 ? void 0 : _getTitanSkinInfo.levelConfigMap;
			const normalizedLevel = Math.max(0, Number(level) || 0);
			let levelData;
			if (Array.isArray(levelConfigMap)) levelData = levelConfigMap[normalizedLevel];
			else levelData = getPlainRecord(levelConfigMap)[String(normalizedLevel)];
			return isPlainObject(levelData) ? levelData : void 0;
		}
		function getTitanArtifactLevels(titanData) {
			const artifacts = getPlainRecord(titanData).artifacts;
			return Array.isArray(artifacts) ? artifacts.map((artifact) => Math.max(0, Number(getPlainRecord(artifact).level) || 0)) : [];
		}
		function getTitanArtifactStates(titanData) {
			const artifacts = getPlainRecord(titanData).artifacts;
			return ARTIFACT_SLOT_IDS.map((slotId) => {
				const artifactData = getCollectionEntry(artifacts, slotId);
				return {
					level: Math.max(0, Number(artifactData.level) || 0),
					star: Math.max(0, Number(artifactData.star) || 0)
				};
			});
		}
		function getTitanArtifactConfig(titanId, slotId) {
			var _artifactConfig$type, _getRecordEntry$level;
			const normalizedTitanId = Math.max(0, Number(titanId) || 0);
			const normalizedSlotId = Math.max(0, Number(slotId) || 0);
			const cacheKey = `${normalizedTitanId}:${normalizedSlotId}`;
			if (titanArtifactConfigCache.has(cacheKey)) return titanArtifactConfigCache.get(cacheKey);
			const titanConfig = getRecordEntry(getGameDataRecord("titan"), normalizedTitanId);
			const artifactId = Number(getCollectionValue(titanConfig.artifacts, normalizedSlotId));
			if (!Number.isFinite(artifactId) || artifactId <= 0) return;
			const titanArtifactData = getGameDataRecord("titanArtifact");
			const artifactConfig = getRecordEntry(getPlainRecord(titanArtifactData.id), artifactId);
			const artifactType = normalizedSlotId === 2 ? "amulet" : String((_artifactConfig$type = artifactConfig.type) !== null && _artifactConfig$type !== void 0 ? _artifactConfig$type : "");
			const artifactConfigData = {
				artifactId,
				artifactType,
				levelConfigMap: (_getRecordEntry$level = getRecordEntry(getPlainRecord(titanArtifactData.type), artifactType).levels) !== null && _getRecordEntry$level !== void 0 ? _getRecordEntry$level : {}
			};
			titanArtifactConfigCache.set(cacheKey, artifactConfigData);
			return artifactConfigData;
		}
		function getArtifactLevelConfigData(levelConfigMap, level) {
			const normalizedLevel = Math.max(0, Number(level) || 0);
			let levelData;
			if (Array.isArray(levelConfigMap)) {
				var _levelConfigMap$zeroB;
				levelData = (_levelConfigMap$zeroB = levelConfigMap[Math.max(0, normalizedLevel - 1)]) !== null && _levelConfigMap$zeroB !== void 0 ? _levelConfigMap$zeroB : levelConfigMap[normalizedLevel];
			} else levelData = getPlainRecord(levelConfigMap)[String(normalizedLevel)];
			return isPlainObject(levelData) ? levelData : void 0;
		}
		function getArtifactLevelData(titanId, slotId, level) {
			const artifactConfig = getTitanArtifactConfig(titanId, slotId);
			if (!artifactConfig) return;
			return getArtifactLevelConfigData(artifactConfig.levelConfigMap, level);
		}
		function getArtifactName(artifactId) {
			const normalizedArtifactId = Math.max(0, Number(artifactId) || 0);
			return getCachedGameTranslation(`LIB_TITAN_ARTIFACT_NAME_${normalizedArtifactId}`, "HWHTITANART_ARTIFACT_SLOT", { slot: normalizedArtifactId });
		}
		function getTitanArtifactEvolutionRows(titanId, slotId) {
			const normalizedTitanId = Math.max(0, Number(titanId) || 0);
			const normalizedSlotId = Math.max(0, Number(slotId) || 0);
			const cacheKey = `${normalizedTitanId}:${normalizedSlotId}`;
			const cachedRows = titanArtifactEvolutionRowsCache.get(cacheKey);
			if (cachedRows) return cachedRows;
			const artifactConfig = getTitanArtifactConfig(normalizedTitanId, normalizedSlotId);
			if (!artifactConfig) return [];
			const evolutionMap = getPlainRecord(getRecordEntry(getPlainRecord(getGameDataRecord("titanArtifact").type), artifactConfig.artifactType).evolution);
			const rows = Object.values(evolutionMap).map((evolutionValue) => {
				const evolutionData = getPlainRecord(evolutionValue);
				return {
					star: Math.max(0, Number(evolutionData.star) || 0),
					fragmentCost: Math.max(0, Number(evolutionData.costFragmentsAmount) || 0)
				};
			}).filter((evolutionData) => evolutionData.star > 0).sort((left, right) => left.star - right.star);
			titanArtifactEvolutionRowsCache.set(cacheKey, rows);
			return rows;
		}
		function getMaxTitanArtifactStar(titanId, slotId) {
			const cacheKey = `${Math.max(0, Number(titanId) || 0)}:${Math.max(0, Number(slotId) || 0)}`;
			const cachedMaxStar = titanArtifactMaxStarCache.get(cacheKey);
			if (cachedMaxStar !== void 0) return cachedMaxStar;
			const maxStar = getTitanArtifactEvolutionRows(titanId, slotId).reduce((currentMaxStar, evolutionData) => Math.max(currentMaxStar, evolutionData.star), 0);
			titanArtifactMaxStarCache.set(cacheKey, maxStar);
			return maxStar;
		}
		function getMaxKnownTitanArtifactStar() {
			if (maxKnownTitanArtifactStarCache !== void 0) return maxKnownTitanArtifactStarCache;
			maxKnownTitanArtifactStarCache = getConfigTitanIds().reduce((knownMax, titanId) => {
				return Math.max(knownMax, ...ARTIFACT_SLOT_IDS.map((slotId) => getMaxTitanArtifactStar(titanId, slotId)));
			}, 0);
			return maxKnownTitanArtifactStarCache;
		}
		function getTitanArtifactEvolutionSteps(titanId, slotId, fromStar, toStar) {
			const normalizedFromStar = Math.max(0, Number(fromStar) || 0);
			const maxStar = getMaxTitanArtifactStar(titanId, slotId);
			const normalizedToStar = Math.max(normalizedFromStar, Math.min(Math.max(0, Number(toStar) || maxStar), maxStar));
			return getTitanArtifactEvolutionRows(titanId, slotId).filter((evolutionData) => evolutionData.star > normalizedFromStar && evolutionData.star <= normalizedToStar);
		}
		function isTitanArtifactSlotMaxed(titanId, slotId, currentLevel) {
			const maxLevel = getTitanArtifactMaxLevel(titanId, slotId);
			if (maxLevel <= 0 || maxLevel >= 999) return !getTitanArtifactNextUpgrade(titanId, slotId, currentLevel);
			return Math.max(0, Number(currentLevel) || 0) >= maxLevel;
		}
		function areTitanArtifactsMaxed(titanId, levels) {
			const knownSlotIds = ARTIFACT_SLOT_IDS.filter((slotId) => !!getTitanArtifactConfig(titanId, slotId));
			if (knownSlotIds.length <= 0) return false;
			return knownSlotIds.every((slotId) => {
				var _getCollectionValue;
				return isTitanArtifactSlotMaxed(titanId, slotId, (_getCollectionValue = getCollectionValue(levels, slotId)) !== null && _getCollectionValue !== void 0 ? _getCollectionValue : 0);
			});
		}
		function getTitanArtifactNextEvolutionFragmentCost(titanId, slotId, currentStar, targetStar = 0) {
			const maxStar = getMaxTitanArtifactStar(titanId, slotId);
			const nextEvolutionStep = getTitanArtifactEvolutionSteps(titanId, slotId, currentStar, Math.max(0, Number(targetStar) || 0) > 0 ? Math.min(Math.max(0, Number(targetStar) || 0), maxStar) : maxStar)[0];
			return Math.max(0, Number(nextEvolutionStep === null || nextEvolutionStep === void 0 ? void 0 : nextEvolutionStep.fragmentCost) || 0);
		}
		function buildArtifactTargetGroups(ownedTitans, { buyableOnly = false, mode = "stars", inventory = {}, maxArtifactStar = 0 } = {}) {
			const normalizedMaxArtifactStar = Math.max(0, Number(maxArtifactStar) || 0);
			const groups = [];
			for (const [titanIdText, titanData] of Object.entries(getPlainRecord(ownedTitans))) {
				const titanId = Number(titanIdText);
				if (!Number.isFinite(titanId) || !titanData) continue;
				const titanName = getTitanName(titanId);
				const artifactStates = getTitanArtifactStates(titanData);
				const options = [];
				for (const slotId of ARTIFACT_SLOT_IDS) {
					var _artifactStates$slotI, _getArtifactLevelData;
					if (buyableOnly && Number(slotId) === 2) continue;
					const artifactConfig = getTitanArtifactConfig(titanId, slotId);
					if (!artifactConfig) continue;
					const artifactState = (_artifactStates$slotI = artifactStates[slotId]) !== null && _artifactStates$slotI !== void 0 ? _artifactStates$slotI : {
						level: 0,
						star: 0
					};
					const currentStar = Math.max(0, Number(artifactState.star) || 0);
					const maxStar = getMaxTitanArtifactStar(titanId, slotId);
					const targetStar = normalizedMaxArtifactStar > 0 ? Math.min(normalizedMaxArtifactStar, maxStar) : maxStar;
					const artifactName = getArtifactName(artifactConfig.artifactId);
					const fragmentAmount = getTitanArtifactFragmentAmount(inventory, artifactConfig.artifactId);
					const requiredFragmentAmount = getTitanArtifactNextEvolutionFragmentCost(titanId, slotId, currentStar, normalizedMaxArtifactStar);
					const levelColor = getArtifactLevelColor((_getArtifactLevelData = getArtifactLevelData(titanId, slotId, artifactState.level)) === null || _getArtifactLevelData === void 0 ? void 0 : _getArtifactLevelData.color);
					const disabled = targetStar > 0 && currentStar >= targetStar || mode === "fragments" && requiredFragmentAmount <= 0;
					const title = disabled ? translate("HWHTITANLVL_EVOLUTION_ABSOLUTE") : `${titanName} · ${artifactName}`;
					options.push({
						value: buildTitanArtifactKey(titanId, slotId),
						label: `${titanName} - ${artifactName} ${currentStar}/${maxStar}`,
						htmlLabel: buildTitanArtifactTargetOptionLabel(artifactName, getArtifactSlotMeta(slotId), currentStar, maxStar, levelColor, formatNumber, mode === "fragments" ? fragmentAmount : void 0, mode === "fragments" ? requiredFragmentAmount : void 0),
						searchText: `${titanName} ${artifactName} ${currentStar}/${maxStar} ${fragmentAmount}/${requiredFragmentAmount}`,
						disabled,
						title
					});
				}
				if (options.length > 0) groups.push({
					label: titanName,
					options
				});
			}
			return groups;
		}
		function buildTitanEvolutionTargetGroups(ownedTitans, inventory) {
			const maxStar = getMaxTitanEvolutionStar();
			const options = [];
			for (const [titanIdText, titanData] of Object.entries(getPlainRecord(ownedTitans))) {
				const titanId = Number(titanIdText);
				if (!Number.isFinite(titanId) || !titanData) continue;
				const titanName = getTitanName(titanId);
				const currentStar = getTitanStarCount(titanData);
				const soulAmount = getTitanSoulAmount(inventory, titanId);
				const nextCost = getTitanEvolutionCost(currentStar + 1);
				const disabled = maxStar > 0 && currentStar >= maxStar || nextCost <= 0;
				const label = `${titanName} ${currentStar}/${maxStar}`;
				const htmlLabel = buildTitanEvolutionTargetOptionLabel(titanName, currentStar, maxStar, soulAmount, nextCost, formatNumber);
				options.push({
					value: String(titanId),
					label,
					htmlLabel,
					searchText: `${titanName} ${currentStar}/${maxStar}`,
					disabled,
					title: disabled ? translate("HWHTITANLVL_EVOLUTION_ABSOLUTE") : titanName
				});
			}
			return [{
				label: translate("HWHTITANART_TITAN_LIST_HEADER"),
				options
			}];
		}
		function sortTitanOptionsBySelectionOrder(titanOptions, selectedTitanIds = []) {
			const selectedOrder = new Map(normalizeTitanIdValues(selectedTitanIds).map((titanId, index) => [titanId, index]));
			return [...titanOptions !== null && titanOptions !== void 0 ? titanOptions : []].sort((left, right) => {
				const leftSelected = selectedOrder.has(Number(left.id));
				const rightSelected = selectedOrder.has(Number(right.id));
				if (leftSelected !== rightSelected) return leftSelected ? -1 : 1;
				if (leftSelected && rightSelected) {
					var _selectedOrder$get, _selectedOrder$get2;
					return ((_selectedOrder$get = selectedOrder.get(Number(left.id))) !== null && _selectedOrder$get !== void 0 ? _selectedOrder$get : 0) - ((_selectedOrder$get2 = selectedOrder.get(Number(right.id))) !== null && _selectedOrder$get2 !== void 0 ? _selectedOrder$get2 : 0);
				}
				if (left.owned !== right.owned) return left.owned ? -1 : 1;
				return compareRussianText(left.name, right.name);
			});
		}
		function buildTitanOptions(ownedTitans, settings = DEFAULT_SETTINGS) {
			const ownedTitanMap = getPlainRecord(ownedTitans);
			const ownedTitanIdSet = new Set(Object.keys(ownedTitanMap).map((value) => Number(value)).filter((value) => Number.isFinite(value)));
			return sortTitanOptionsBySelectionOrder(getConfigTitanIds().map((titanId) => {
				const titanData = getRecordValue(ownedTitanMap, titanId);
				const owned = ownedTitanIdSet.has(titanId);
				const artifactStates = getTitanArtifactStates(titanData);
				const levels = artifactStates.map((artifactState) => artifactState.level);
				const maxed = owned && areTitanArtifactsMaxed(titanId, levels);
				return {
					id: titanId,
					name: getTitanName(titanId),
					owned,
					maxed,
					levels,
					artifactStates
				};
			}), settings === null || settings === void 0 ? void 0 : settings.selectedTitanIds);
		}
		function buildTitanLevelOptions(ownedTitans, settings = DEFAULT_LEVEL_SETTINGS, _inventory = {}) {
			const ownedTitanMap = getPlainRecord(ownedTitans);
			const ownedTitanIdSet = new Set(Object.keys(ownedTitanMap).map((value) => Number(value)).filter((value) => Number.isFinite(value)));
			return sortTitanOptionsBySelectionOrder(getConfigTitanIds().map((titanId) => {
				const titanData = getRecordValue(ownedTitanMap, titanId);
				const titanRecord = getPlainRecord(titanData);
				const owned = ownedTitanIdSet.has(titanId);
				return {
					id: titanId,
					name: getTitanName(titanId),
					owned,
					titanData,
					level: Math.max(0, Number(titanRecord.level) || 0)
				};
			}), settings === null || settings === void 0 ? void 0 : settings.selectedTitanIds);
		}
		function buildTitanSkinOptions(ownedTitans, settings = DEFAULT_SKIN_SETTINGS) {
			const ownedTitanMap = getPlainRecord(ownedTitans);
			const ownedTitanIdSet = new Set(Object.keys(ownedTitanMap).map((value) => Number(value)).filter((value) => Number.isFinite(value)));
			return sortTitanOptionsBySelectionOrder(getConfigTitanIds().map((titanId) => {
				const titanData = getRecordValue(ownedTitanMap, titanId);
				const owned = ownedTitanIdSet.has(titanId);
				const skinEntries = getTitanSkinEntries(titanData);
				return {
					id: titanId,
					name: getTitanName(titanId),
					owned,
					titanData,
					skinEntries
				};
			}), settings === null || settings === void 0 ? void 0 : settings.selectedTitanIds);
		}
		function getArtifactCostColor(slotId) {
			if (Number(slotId) === 0) return "#f0d59f";
			if (Number(slotId) === 1) return "#d7b2ff";
			return "#ffd36e";
		}
		function formatArtifactUpgradeCost(nextUpgrade) {
			const upgradeRecord = getPlainRecord(nextUpgrade);
			if (!nextUpgrade || Object.keys(upgradeRecord).length <= 0) return "—";
			if (Number(upgradeRecord.goldCost) > 0) return formatNumber(upgradeRecord.goldCost);
			return formatNumber(upgradeRecord.resourceCost || upgradeRecord.cost);
		}
		const calculatorDefaults = createTitanTrainerCalculatorDefaults([(titanId, slotId) => {
			var _getTitanArtifactConf5, _getTitanArtifactConf6;
			return getMaxArtifactLevelFromConfig((_getTitanArtifactConf5 = (_getTitanArtifactConf6 = getTitanArtifactConfig(titanId, slotId)) === null || _getTitanArtifactConf6 === void 0 ? void 0 : _getTitanArtifactConf6.levelConfigMap) !== null && _getTitanArtifactConf5 !== void 0 ? _getTitanArtifactConf5 : {});
		}, getMaxTitanLevel]);
		const [getCalculatorTitanSelectOptions, getPreferredCalculatorTitanId, getArtifactCalculatorDefaultLevels, getLevelCalculatorDefaultLevels, findSkinCalculatorEntry, getSkinCalculatorDefaultLevels] = calculatorDefaults;
		function buildTitanValueToken(text, tone = "muted", icon = "") {
			return {
				text: String(text !== null && text !== void 0 ? text : ""),
				tone: String(tone || "muted"),
				icon: String(icon || "")
			};
		}
		function buildTitanEmptyValueTokens() {
			return [buildTitanValueToken("—", "muted")];
		}
		function buildArtifactLevelTokens(titanId, levels) {
			if (!Array.isArray(levels) || levels.length <= 0) return buildTitanEmptyValueTokens();
			return ARTIFACT_SLOT_IDS.map((slotId) => {
				var _getArtifactLevelData2;
				const levelValue = getCollectionValue(levels, slotId);
				const artifactState = isPlainObject(levelValue) ? getPlainRecord(levelValue) : {
					level: levelValue !== null && levelValue !== void 0 ? levelValue : 0,
					star: void 0
				};
				const level = Math.max(0, Number(artifactState.level) || 0);
				const star = Math.max(0, Number(artifactState.star) || 0);
				const levelColor = getArtifactLevelColor((_getArtifactLevelData2 = getArtifactLevelData(titanId, slotId, level)) === null || _getArtifactLevelData2 === void 0 ? void 0 : _getArtifactLevelData2.color);
				return buildTitanValueToken(star > 0 ? `${formatNumber(level)} ★ ${formatNumber(star)}` : formatNumber(level), getTitanToneByColor(levelColor));
			});
		}
		function buildArtifactCostTokens(titanId, levels, settings = DEFAULT_SETTINGS) {
			if (!(settings === null || settings === void 0 ? void 0 : settings.showFullCosts)) return [];
			const enabledSlotIdSet = new Set(getArtifactSlotIdsForTitan(settings, titanId));
			return ARTIFACT_SLOT_IDS.map((slotId) => {
				const currentLevel = Math.max(0, Number(getCollectionValue(levels, slotId)) || 0);
				const levelCap = getArtifactLevelCapForTitan(settings, titanId, slotId);
				const costColor = getArtifactCostColor(slotId);
				if (!enabledSlotIdSet.has(slotId) || levelCap > 0 && currentLevel >= levelCap) return buildTitanValueToken("—", getTitanToneByColor(costColor));
				return buildTitanValueToken(formatArtifactUpgradeCost(getTitanArtifactNextUpgrade(titanId, slotId, currentLevel)), getTitanToneByColor(costColor));
			});
		}
		function buildTitanLevelCostTokens(titanOption, settings = DEFAULT_LEVEL_SETTINGS) {
			if (!(settings === null || settings === void 0 ? void 0 : settings.showNextCosts) || !(titanOption === null || titanOption === void 0 ? void 0 : titanOption.owned)) return [];
			const maxTitanLevel = getTitanLevelCapForTitan(settings, titanOption === null || titanOption === void 0 ? void 0 : titanOption.id);
			const level = Math.max(0, Number(titanOption === null || titanOption === void 0 ? void 0 : titanOption.level) || 0);
			if (maxTitanLevel > 0 && level >= maxTitanLevel) return [buildTitanValueToken("—", "muted")];
			const nextLevelCost = getTitanLevelUpCost(level);
			return [buildTitanValueToken(nextLevelCost ? formatNumber(nextLevelCost) : "—", nextLevelCost ? "green" : "muted")];
		}
		function buildTitanEvolutionViewModel(titanId, titanData, inventory) {
			const currentStars = getTitanStarCount(titanData);
			const soulAmount = getTitanSoulAmount(inventory, titanId);
			const maxEvolutionStar = getMaxTitanEvolutionStar();
			const evolveCost = getTitanEvolutionCost(currentStars + 1);
			const isAbsolute = maxEvolutionStar > 0 ? currentStars >= maxEvolutionStar : evolveCost <= 0 && currentStars > 0;
			const hasKnownCost = evolveCost > 0;
			const delta = isAbsolute ? soulAmount : hasKnownCost ? soulAmount - evolveCost : void 0;
			const currentSoulColor = isAbsolute ? soulAmount > 0 ? "#d7b2ff" : "#8f7a68" : hasKnownCost && soulAmount >= evolveCost ? "#9fe0a8" : "#f0d59f";
			const deltaColor = isAbsolute ? soulAmount > 0 ? "#d7b2ff" : "#8f7a68" : (delta !== null && delta !== void 0 ? delta : 0) >= 0 ? "#9fe0a8" : "#ff9f9f";
			return {
				currentStars,
				soulToken: buildTitanValueToken(formatNumber(soulAmount), getTitanToneByColor(currentSoulColor)),
				needText: isAbsolute ? translate("HWHTITANLVL_EVOLUTION_ABSOLUTE") : hasKnownCost ? formatNumber(evolveCost) : "?",
				deltaToken: typeof delta === "number" ? buildTitanValueToken(formatSignedNumber(delta), getTitanToneByColor(deltaColor)) : void 0
			};
		}
		function buildTitanSkinLevelTokens(skinEntries) {
			if (!Array.isArray(skinEntries) || skinEntries.length <= 0) return buildTitanEmptyValueTokens();
			return skinEntries.map((entry) => buildTitanValueToken(formatNumber(getPlainRecord(entry).currentLevel), "gold"));
		}
		function buildTitanSkinCostTokens(titanId, titanSkinEntries, settings = DEFAULT_SKIN_SETTINGS) {
			if (!(settings === null || settings === void 0 ? void 0 : settings.showNextCosts)) return [];
			const enabledLocaleKeySet = new Set(getSkinRuleForTitan(settings, titanId).localeKeys);
			const tokens = titanSkinEntries.map((entry) => {
				const levelCap = getSkinLevelCapForTitan(settings, titanId, entry.localeKey);
				const nextUpgrade = getTitanSkinNextUpgrade(entry.skinId, entry.currentLevel);
				return buildTitanValueToken(!enabledLocaleKeySet.has(entry.localeKey) || levelCap > 0 && entry.currentLevel >= levelCap ? "—" : nextUpgrade ? formatNumber(nextUpgrade.cost) : "—", "gold");
			});
			return tokens.length > 0 ? tokens : buildTitanEmptyValueTokens();
		}
		function buildArtifactTitanOptionViewModel(titanOption, settings) {
			var _titanOption$name;
			const titanId = Number(titanOption === null || titanOption === void 0 ? void 0 : titanOption.id);
			return {
				entityId: titanId,
				name: (_titanOption$name = titanOption === null || titanOption === void 0 ? void 0 : titanOption.name) !== null && _titanOption$name !== void 0 ? _titanOption$name : "",
				owned: !!(titanOption === null || titanOption === void 0 ? void 0 : titanOption.owned),
				maxed: !!(titanOption === null || titanOption === void 0 ? void 0 : titanOption.maxed),
				missingSuffix: translate("HWHTITANART_NO_OWNED_SUFFIX"),
				levelTokens: buildArtifactLevelTokens(titanId, titanOption === null || titanOption === void 0 ? void 0 : titanOption.artifactStates),
				costTokens: buildArtifactCostTokens(titanId, titanOption === null || titanOption === void 0 ? void 0 : titanOption.levels, settings)
			};
		}
		function buildLevelTitanOptionViewModel(titanOption, settings, inventory) {
			var _titanOption$name2;
			return {
				entityId: Number(titanOption === null || titanOption === void 0 ? void 0 : titanOption.id),
				name: (_titanOption$name2 = titanOption === null || titanOption === void 0 ? void 0 : titanOption.name) !== null && _titanOption$name2 !== void 0 ? _titanOption$name2 : "",
				owned: !!(titanOption === null || titanOption === void 0 ? void 0 : titanOption.owned),
				missingSuffix: translate("HWHTITANART_NO_OWNED_SUFFIX"),
				levelTokens: [buildTitanValueToken(formatNumber(titanOption === null || titanOption === void 0 ? void 0 : titanOption.level), "blue")],
				costTokens: buildTitanLevelCostTokens(titanOption, settings),
				evolution: (titanOption === null || titanOption === void 0 ? void 0 : titanOption.owned) && (settings === null || settings === void 0 ? void 0 : settings.showEvolutionProgress) ? buildTitanEvolutionViewModel(Number(titanOption === null || titanOption === void 0 ? void 0 : titanOption.id), titanOption === null || titanOption === void 0 ? void 0 : titanOption.titanData, inventory) : void 0
			};
		}
		function buildSkinTitanOptionViewModel(titanOption, settings) {
			var _titanOption$name3;
			return {
				entityId: Number(titanOption === null || titanOption === void 0 ? void 0 : titanOption.id),
				name: (_titanOption$name3 = titanOption === null || titanOption === void 0 ? void 0 : titanOption.name) !== null && _titanOption$name3 !== void 0 ? _titanOption$name3 : "",
				owned: !!(titanOption === null || titanOption === void 0 ? void 0 : titanOption.owned),
				missingSuffix: translate("HWHTITANART_NO_OWNED_SUFFIX"),
				levelTokens: buildTitanSkinLevelTokens(titanOption === null || titanOption === void 0 ? void 0 : titanOption.skinEntries),
				costTokens: buildTitanSkinCostTokens(Number(titanOption === null || titanOption === void 0 ? void 0 : titanOption.id), titanOption === null || titanOption === void 0 ? void 0 : titanOption.skinEntries, settings)
			};
		}
		function buildTrainerSelectControl({ inputId, label, value, options, icon = "settings", widthPx = 240, tooltip = "", key = inputId, searchable = true }) {
			return {
				kind: "select",
				key,
				inputId,
				label,
				value: String(value !== null && value !== void 0 ? value : ""),
				options: options !== null && options !== void 0 ? options : [],
				icon,
				widthPx,
				tooltip,
				searchable,
				...buildTitanControlText(translate)
			};
		}
		const [buildDoYourBestPlacementModel, persistTitanDoYourBestPlacementFromControl] = createTitanTrainerDoYourBestPlacementFlow([
			translate,
			getDoYourBestTaskListSnapshot,
			readStoredDoYourBestPlacementSync,
			persistDoYourBestPlacementSync,
			registerDoYourBestTitanTasks,
			buildTrainerSelectControl
		]);
		function buildTrainerCheckboxControl({ inputId, label, checked, icon = "check", tooltip = "", key = inputId }) {
			return {
				kind: "checkbox",
				key,
				inputId,
				label,
				checked: !!checked,
				icon,
				tooltip
			};
		}
		function buildTrainerMultiSelectControl({ inputId, label, values, groups, tooltip = "", key = inputId }) {
			return {
				kind: "multiSelect",
				key,
				inputId,
				label,
				values,
				groups,
				tooltip,
				...buildTitanControlText(translate, "multiSelect")
			};
		}
		function buildTrainerHintControl(text, key = `hint:${text}`) {
			return {
				kind: "hint",
				key,
				text
			};
		}
		function buildTrainerGroupControl(key, controls, className = "hwhx-control-group") {
			return {
				kind: "group",
				key,
				className,
				controls
			};
		}
		function buildTrainerSectionModel({ key, title, icon, controls, accentColor = "#6e4a24", defaultOpen = true }) {
			return {
				key,
				stateKey: key,
				title,
				icon,
				controls: controls.filter((control) => Boolean(control)),
				accentColor,
				defaultOpen
			};
		}
		function buildLevelingModeControl(inputId, settings) {
			return buildTrainerSelectControl(buildLevelingModeControlInput(inputId, settings, translate));
		}
		function buildUpgradeModeControl(inputId, settings) {
			return buildTrainerSelectControl(buildUpgradeModeControlInput(inputId, settings, translate));
		}
		function buildChecklistAmountControlModels(behaviorInputId, amountInputId, settings) {
			const settingsRecord = getPlainRecord(settings);
			return [
				buildTrainerSelectControl({
					label: translate("HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_LABEL"),
					inputId: behaviorInputId,
					value: normalizeChecklistAmountBehavior(settingsRecord.checklistAmountBehavior),
					icon: "list-checks",
					widthPx: 260,
					tooltip: translate("HWHTITAN_TOOLTIP_CHECKLIST_AMOUNT_BEHAVIOR"),
					options: [{
						value: CHECKLIST_AMOUNT_BEHAVIOR_SKIP,
						label: translate("HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_SKIP"),
						icon: "x"
					}, {
						value: CHECKLIST_AMOUNT_BEHAVIOR_DEFAULT,
						label: translate("HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_DEFAULT"),
						icon: "list-checks"
					}]
				}),
				buildTitanNumberControl({
					label: translate("HWHTITANART_CHECKLIST_LEVELING_AMOUNT"),
					inputId: amountInputId,
					value: getChecklistLevelingAmount(settings),
					icon: "list-checks",
					tooltip: translate("HWHTITAN_TOOLTIP_CHECKLIST_LEVELING_AMOUNT")
				}),
				buildTrainerHintControl(translate("HWHTITANART_CHECKLIST_AMOUNT_HINT"), `${amountInputId}:hint`)
			];
		}
		function buildTitanBadgeModels(selectedCount, ownedCount, levelGainAmount) {
			const normalizedSelectedCount = Math.max(0, Number(selectedCount) || 0);
			const normalizedOwnedCount = Math.max(0, Number(ownedCount) || 0);
			return [
				{
					key: "gain",
					className: "hwhx-badge--gain",
					gain: true,
					text: translate("HWHTITANART_LEVEL_GAIN", { amount: formatNumber(levelGainAmount) })
				},
				{
					key: "active",
					className: "hwhx-badge--filter hwhx-badge--filter-active",
					filterOption: "active",
					text: formatNumber(normalizedSelectedCount)
				},
				{
					key: "inactive",
					className: "hwhx-badge--filter hwhx-badge--filter-inactive",
					filterOption: "inactive",
					text: formatNumber(Math.max(0, normalizedOwnedCount - normalizedSelectedCount))
				},
				{
					key: "total",
					className: "hwhx-badge--total",
					text: formatNumber(normalizedOwnedCount)
				}
			];
		}
		function buildPriorityActions(variant = "full") {
			return getReorderListActionValues(variant).map((value) => ({ value }));
		}
		function buildArtifactPriorityChildRows(titanOption, settings) {
			const titanId = Number(titanOption.id);
			const selectedSlotIdSet = new Set(getArtifactSlotIdsForTitan(settings, titanId));
			const disabled = !titanOption.owned;
			return buildOrderedArtifactSlotIdsForEditor(settings, titanId).map((slotId, index) => {
				const slotMeta = getArtifactSlotMeta(slotId);
				const artifactConfig = getTitanArtifactConfig(titanId, slotId);
				const artifactName = artifactConfig ? getArtifactName(artifactConfig.artifactId) : slotMeta.label;
				const key = String(slotId);
				const inputId = `${SLOT_FILTER_INPUT_PREFIX}${titanId}-${slotId}`;
				const capInputId = `${ARTIFACT_LEVEL_CAP_INPUT_PREFIX}${titanId}-${slotId}`;
				const levelCap = getArtifactLevelCapForTitan(settings, titanId, slotId);
				const maxLevel = getTitanArtifactMaxLevel(titanId, slotId);
				return {
					key,
					index,
					orderKey: key,
					searchText: `${artifactName} ${slotMeta.label}`,
					checked: selectedSlotIdSet.has(slotId),
					disabled,
					inputId,
					icon: slotMeta.icon,
					iconClassName: slotMeta.className,
					label: artifactName,
					capLabel: translate("HWHTITANART_LEVEL_CAP_SHORT"),
					capTitle: getArtifactLevelCapLabel(slotId),
					capInputId,
					capValue: levelCap,
					capMaxValue: maxLevel,
					actionAttribute: ARTIFACT_SLOT_REORDER_ACTION_ATTRIBUTE,
					actions: buildPriorityActions(settings === null || settings === void 0 ? void 0 : settings.reorderListVariant)
				};
			});
		}
		function buildTitanArtifactPriorityModel(titanOptions, settings, levelGainAmount = 0, accordionKey = "artifact-priority") {
			const selectedTitanIdSet = new Set(normalizeTitanIdValues(settings === null || settings === void 0 ? void 0 : settings.selectedTitanIds));
			const [selectedCount, ownedCount] = countSelectedOwnedTitanOptions(titanOptions, selectedTitanIdSet);
			const reorderDisabled = normalizeUpgradeMode(settings === null || settings === void 0 ? void 0 : settings.upgradeMode) === UPGRADE_MODE_PARALLEL;
			return {
				kind: "priority",
				accordionKey,
				stateKey: `titan-list:${accordionKey}`,
				defaultOpen: true,
				accentColor: "#4d5770",
				icon: "shuffle",
				title: translate("HWHTITANART_PRIORITY_HEADER"),
				note: translate("HWHTITANART_PRIORITY_HINT"),
				reorderDisabled,
				reorderDisabledHint: translate("HWHTITANTRAINER_PARALLEL_REORDER_HINT"),
				...buildTitanPriorityToolbarText(translate),
				optionVariant: "artifact",
				badges: buildTitanBadgeModels(selectedCount, ownedCount, levelGainAmount),
				rows: titanOptions.map((titanOption, index) => {
					var _titanOption$levels;
					const titanId = Number(titanOption.id);
					const checked = selectedTitanIdSet.has(titanId);
					return {
						key: String(titanId),
						index,
						orderKey: String(titanId),
						checked,
						disabled: !titanOption.owned,
						inputId: `${TITAN_SELECTION_INPUT_PREFIX}artifact-${titanId}`,
						titanId,
						option: buildArtifactTitanOptionViewModel(titanOption, settings),
						actionAttribute: ARTIFACT_TITAN_REORDER_ACTION_ATTRIBUTE,
						actions: buildPriorityActions(settings === null || settings === void 0 ? void 0 : settings.reorderListVariant),
						childrenTitle: translate("HWHTITANART_ARTIFACT_ORDER"),
						childrenIcon: "hammer",
						childrenId: `hwhtitan-priority-children-artifact-${titanId}`,
						children: buildArtifactPriorityChildRows(titanOption, settings),
						filterRow: titanOption.owned,
						searchText: `${titanOption.name} ${((_titanOption$levels = titanOption.levels) !== null && _titanOption$levels !== void 0 ? _titanOption$levels : []).join(" ")}`
					};
				})
			};
		}
		function buildSkinPriorityChildRows(titanOption, settings) {
			const titanId = Number(titanOption.id);
			const selectedLocaleKeySet = new Set(getSkinRuleForTitan(settings, titanId).localeKeys);
			const disabled = !titanOption.owned;
			return getOrderedSkinEntriesForEditor(titanOption, settings).map((entry, index) => {
				const key = buildSafeDomKey(entry.localeKey);
				const inputId = `${SKIN_FILTER_INPUT_PREFIX}${titanId}-${key}`;
				const capInputId = `${SKIN_LEVEL_CAP_INPUT_PREFIX}${titanId}-${key}`;
				const levelCap = getSkinLevelCapForTitan(settings, titanId, entry.localeKey);
				return {
					key: entry.localeKey,
					index,
					orderKey: entry.localeKey,
					searchText: `${entry.name} ${entry.localeKey}`,
					checked: selectedLocaleKeySet.has(entry.localeKey),
					disabled,
					inputId,
					icon: "shirt",
					iconClassName: "hwhx-blue",
					label: entry.name,
					capLabel: translate("HWHTITANSKIN_LEVEL_CAP_SHORT"),
					capTitle: translate("HWHTITANSKIN_LEVEL_CAP"),
					capInputId,
					capValue: levelCap,
					capMaxValue: entry.maxLevel || getDefaultTitanSkinLevelCap(entry.localeKey),
					actionAttribute: SKIN_REORDER_ACTION_ATTRIBUTE,
					actions: buildPriorityActions(settings === null || settings === void 0 ? void 0 : settings.reorderListVariant)
				};
			});
		}
		function buildTitanSkinPriorityModel(titanOptions, settings, levelGainAmount = 0, accordionKey = "skin-priority") {
			const selectedTitanIdSet = new Set(normalizeTitanIdValues(settings === null || settings === void 0 ? void 0 : settings.selectedTitanIds));
			const [selectedCount, ownedCount] = countSelectedOwnedTitanOptions(titanOptions, selectedTitanIdSet);
			const reorderDisabled = normalizeUpgradeMode(settings === null || settings === void 0 ? void 0 : settings.upgradeMode) === UPGRADE_MODE_PARALLEL;
			return {
				kind: "priority",
				accordionKey,
				stateKey: `titan-list:${accordionKey}`,
				defaultOpen: true,
				accentColor: "#4d5770",
				icon: "shuffle",
				title: translate("HWHTITANSKIN_PRIORITY_HEADER"),
				note: translate("HWHTITANSKIN_PRIORITY_HINT"),
				reorderDisabled,
				reorderDisabledHint: translate("HWHTITANTRAINER_PARALLEL_REORDER_HINT"),
				...buildTitanPriorityToolbarText(translate),
				optionVariant: "skin",
				badges: buildTitanBadgeModels(selectedCount, ownedCount, levelGainAmount),
				rows: titanOptions.map((titanOption, index) => {
					var _titanOption$skinEntr;
					const titanId = Number(titanOption.id);
					const checked = selectedTitanIdSet.has(titanId);
					return {
						key: String(titanId),
						index,
						orderKey: String(titanId),
						checked,
						disabled: !titanOption.owned,
						inputId: `${TITAN_SELECTION_INPUT_PREFIX}skin-${titanId}`,
						titanId,
						option: buildSkinTitanOptionViewModel(titanOption, settings),
						actionAttribute: SKIN_TITAN_REORDER_ACTION_ATTRIBUTE,
						actions: buildPriorityActions(settings === null || settings === void 0 ? void 0 : settings.reorderListVariant),
						childrenTitle: translate("HWHTITANSKIN_SKIN_ORDER"),
						childrenIcon: "shirt",
						childrenId: `hwhtitan-priority-children-skin-${titanId}`,
						children: buildSkinPriorityChildRows(titanOption, settings),
						filterRow: titanOption.owned,
						searchText: `${titanOption.name} ${((_titanOption$skinEntr = titanOption.skinEntries) !== null && _titanOption$skinEntr !== void 0 ? _titanOption$skinEntr : []).map((entry) => entry.name).join(" ")}`
					};
				})
			};
		}
		function buildArtifactCalculatorModel(titanOptions, settings, resourceAmount, goldAmount) {
			var _settings$selectedArt;
			const titanId = getPreferredCalculatorTitanId(titanOptions, settings === null || settings === void 0 ? void 0 : settings.selectedTitanIds);
			const slotId = Number(settings === null || settings === void 0 || (_settings$selectedArt = settings.selectedArtifactSlotIds) === null || _settings$selectedArt === void 0 ? void 0 : _settings$selectedArt[0]) || 0;
			const levels = getArtifactCalculatorDefaultLevels(titanOptions, titanId, slotId);
			const maxLevel = getTitanArtifactMaxLevel(titanId, slotId);
			return {
				key: "artifact:calculator",
				stateKey: "artifact:calculator",
				defaultOpen: false,
				accentColor: "#5f4528",
				icon: "calculator",
				title: translate("HWHTITANART_CALCULATOR_HEADER"),
				syncSerial: 0,
				result: buildArtifactCalculatorResultModel({
					titanId,
					slotId,
					startLevel: levels.startLevel,
					endLevel: levels.endLevel,
					resourceAmount,
					essenceReserve: settings.essenceReserve,
					goldAmount,
					goldReserve: settings.artifactGoldReserve
				}),
				controls: [
					buildTrainerSelectControl({
						label: translate("HWHTITANART_CALC_TITAN"),
						inputId: ARTIFACT_CALC_TITAN_SELECT_ID,
						value: String(titanId),
						options: getCalculatorTitanSelectOptions(titanOptions),
						icon: "users",
						widthPx: 260,
						tooltip: translate("HWHTITAN_TOOLTIP_CALC_TITAN")
					}),
					buildTrainerSelectControl({
						label: translate("HWHTITANART_CALC_ARTIFACT"),
						inputId: ARTIFACT_CALC_SLOT_SELECT_ID,
						value: String(slotId),
						options: ARTIFACT_SLOT_IDS.map((artifactSlotId) => {
							const slotMeta = getArtifactSlotMeta(artifactSlotId);
							return {
								value: String(artifactSlotId),
								label: slotMeta.label,
								icon: "hammer"
							};
						}),
						icon: "hammer",
						widthPx: 220,
						tooltip: translate("HWHTITAN_TOOLTIP_CALC_ARTIFACT")
					}),
					buildTitanNumberControl({
						label: translate("HWHTITANART_CALC_FROM_LEVEL"),
						inputId: ARTIFACT_CALC_START_INPUT_ID,
						value: levels.startLevel,
						minValue: 1,
						maxValue: maxLevel,
						icon: "arrow-up",
						widthPx: 110,
						tooltip: translate("HWHTITAN_TOOLTIP_CALC_FROM_LEVEL")
					}),
					buildTitanNumberControl({
						label: translate("HWHTITANART_CALC_TO_LEVEL"),
						inputId: ARTIFACT_CALC_END_INPUT_ID,
						value: levels.endLevel,
						minValue: 1,
						maxValue: maxLevel,
						icon: "target",
						widthPx: 110,
						tooltip: translate("HWHTITAN_TOOLTIP_CALC_TO_LEVEL")
					})
				]
			};
		}
		function buildTitanLevelCalculatorModel(titanOptions, settings, potionAmount) {
			const titanId = getPreferredCalculatorTitanId(titanOptions, settings === null || settings === void 0 ? void 0 : settings.selectedTitanIds);
			const levels = getLevelCalculatorDefaultLevels(titanOptions, titanId);
			const maxLevel = getMaxTitanLevel();
			return {
				key: "level:calculator",
				stateKey: "level:calculator",
				defaultOpen: false,
				accentColor: "#3f5a49",
				icon: "calculator",
				title: translate("HWHTITANART_CALCULATOR_HEADER"),
				syncSerial: 0,
				result: buildLevelCalculatorResultModel({
					startLevel: levels.startLevel,
					endLevel: levels.endLevel,
					potionAmount,
					potionReserve: settings.potionReserve
				}),
				controls: [
					buildTrainerSelectControl({
						label: translate("HWHTITANART_CALC_TITAN"),
						inputId: LEVEL_CALC_TITAN_SELECT_ID,
						value: String(titanId),
						options: getCalculatorTitanSelectOptions(titanOptions),
						icon: "users",
						widthPx: 260,
						tooltip: translate("HWHTITAN_TOOLTIP_CALC_TITAN")
					}),
					buildTitanNumberControl({
						label: translate("HWHTITANART_CALC_FROM_LEVEL"),
						inputId: LEVEL_CALC_START_INPUT_ID,
						value: levels.startLevel,
						minValue: 1,
						maxValue: maxLevel,
						icon: "arrow-up",
						widthPx: 110,
						tooltip: translate("HWHTITAN_TOOLTIP_CALC_FROM_LEVEL")
					}),
					buildTitanNumberControl({
						label: translate("HWHTITANART_CALC_TO_LEVEL"),
						inputId: LEVEL_CALC_END_INPUT_ID,
						value: levels.endLevel,
						minValue: 1,
						maxValue: maxLevel,
						icon: "target",
						widthPx: 110,
						tooltip: translate("HWHTITAN_TOOLTIP_CALC_TO_LEVEL")
					})
				]
			};
		}
		function buildTitanSkinCalculatorModel(titanOptions, skinGroups, settings, skinStoneAmount) {
			var _ref, _find, _settings$selectedSki, _skinGroups$, _findSkinCalculatorEn;
			const titanId = getPreferredCalculatorTitanId(titanOptions, settings === null || settings === void 0 ? void 0 : settings.selectedTitanIds);
			const selectedLocaleKey = (_ref = (_find = ((_settings$selectedSki = settings === null || settings === void 0 ? void 0 : settings.selectedSkinLocaleKeys) !== null && _settings$selectedSki !== void 0 ? _settings$selectedSki : []).find((localeKey) => skinGroups.some((group) => group.localeKey === localeKey))) !== null && _find !== void 0 ? _find : (_skinGroups$ = skinGroups[0]) === null || _skinGroups$ === void 0 ? void 0 : _skinGroups$.localeKey) !== null && _ref !== void 0 ? _ref : "";
			const levels = getSkinCalculatorDefaultLevels(titanOptions, skinGroups, titanId, selectedLocaleKey);
			const maxLevel = (_findSkinCalculatorEn = findSkinCalculatorEntry(titanOptions, skinGroups, titanId, selectedLocaleKey)) === null || _findSkinCalculatorEn === void 0 ? void 0 : _findSkinCalculatorEn.maxLevel;
			return {
				key: "skin:calculator",
				stateKey: "skin:calculator",
				defaultOpen: false,
				accentColor: "#4d5770",
				icon: "calculator",
				title: translate("HWHTITANART_CALCULATOR_HEADER"),
				syncSerial: 0,
				result: buildSkinCalculatorResultModel({
					titanOptions,
					skinGroups,
					titanId,
					localeKey: selectedLocaleKey,
					startLevel: levels.startLevel,
					endLevel: levels.endLevel,
					skinStoneAmount,
					skinStoneReserve: settings.skinStoneReserve
				}),
				controls: [
					buildTrainerSelectControl({
						label: translate("HWHTITANART_CALC_TITAN"),
						inputId: SKIN_CALC_TITAN_SELECT_ID,
						value: String(titanId),
						options: getCalculatorTitanSelectOptions(titanOptions),
						icon: "users",
						widthPx: 260,
						tooltip: translate("HWHTITAN_TOOLTIP_CALC_TITAN")
					}),
					buildTrainerSelectControl({
						label: translate("HWHTITANART_CALC_SKIN"),
						inputId: SKIN_CALC_GROUP_SELECT_ID,
						value: selectedLocaleKey,
						options: skinGroups.map((skinGroup) => ({
							value: skinGroup.localeKey,
							label: skinGroup.name,
							icon: "shirt"
						})),
						icon: "shirt",
						widthPx: 260,
						tooltip: translate("HWHTITAN_TOOLTIP_CALC_SKIN")
					}),
					buildTitanNumberControl({
						label: translate("HWHTITANART_CALC_FROM_LEVEL"),
						inputId: SKIN_CALC_START_INPUT_ID,
						value: levels.startLevel,
						minValue: 1,
						maxValue: maxLevel,
						icon: "arrow-up",
						widthPx: 110,
						tooltip: translate("HWHTITAN_TOOLTIP_CALC_FROM_LEVEL")
					}),
					buildTitanNumberControl({
						label: translate("HWHTITANART_CALC_TO_LEVEL"),
						inputId: SKIN_CALC_END_INPUT_ID,
						value: levels.endLevel,
						minValue: 1,
						maxValue: maxLevel,
						icon: "target",
						widthPx: 110,
						tooltip: translate("HWHTITAN_TOOLTIP_CALC_TO_LEVEL")
					})
				]
			};
		}
		function buildArtifactSettingsModel(settings, titanOptions, ownedTitans, resourceAmount, goldAmount, fragmentCoinAmount, inventory = {}, renderOptions = {}) {
			var _renderOptions$titanA;
			const artifactLevelGain = calculateArtifactLevelGain(settings, ownedTitans, resourceAmount, goldAmount);
			const sections = [
				buildTrainerSectionModel({
					key: "artifact:leveling",
					title: translate("HWHTITANART_LEVELING_SECTION"),
					icon: "arrow-up",
					accentColor: "#4d5770",
					controls: [
						buildUpgradeModeControl(ARTIFACT_UPGRADE_MODE_SELECT_ID, settings),
						buildLevelingModeControl(ARTIFACT_LEVELING_MODE_SELECT_ID, settings),
						...buildChecklistAmountControlModels(ARTIFACT_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID, ARTIFACT_CHECKLIST_AMOUNT_INPUT_ID, settings),
						buildTrainerCheckboxControl({
							inputId: "hwhtitanartifact-sync-after-run",
							checked: settings.syncAfterRun,
							label: translate("HWHTITANART_SYNC_AFTER_RUN"),
							icon: "refresh-cw",
							tooltip: translate("HWHTITAN_TOOLTIP_SYNC_AFTER_RUN")
						})
					]
				}),
				buildTrainerSectionModel({
					key: "artifact:resources",
					title: translate("HWHTITANART_RESOURCES_SECTION"),
					icon: "coins",
					accentColor: "#6b4f29",
					controls: [
						buildTitanNumberControl({
							label: translate("HWHTITANART_ESSENCE_RESERVE"),
							inputId: ESSENCE_RESERVE_INPUT_ID,
							value: settings.essenceReserve,
							gameItemType: "consumable",
							gameItemId: 53,
							sideText: formatNumber(resourceAmount),
							tooltip: translate("HWHTITAN_TOOLTIP_ESSENCE_RESERVE")
						}),
						buildTitanNumberControl({
							label: translate("HWHTITANART_GOLD_RESERVE"),
							inputId: ARTIFACT_GOLD_RESERVE_INPUT_ID,
							value: settings.artifactGoldReserve,
							gameItemType: "pseudo",
							gameItemId: 2,
							sideText: formatNumber(goldAmount),
							tooltip: translate("HWHTITAN_TOOLTIP_GOLD_RESERVE")
						}),
						buildTitanNumberControl({
							label: translate("HWHTITANART_FRAGMENT_COIN_RESERVE"),
							inputId: ARTIFACT_FRAGMENT_COIN_RESERVE_INPUT_ID,
							value: settings.artifactFragmentCoinReserve,
							gameItemType: "coin",
							gameItemId: 18,
							sideText: formatNumber(fragmentCoinAmount),
							tooltip: translate("HWHTITAN_TOOLTIP_FRAGMENT_COIN_RESERVE")
						})
					]
				}),
				buildTrainerSectionModel({
					key: "artifact:evolution",
					title: translate("HWHTITANART_EVOLUTION_SECTION"),
					icon: "sparkles",
					accentColor: "#5b3f70",
					controls: [
						buildTrainerGroupControl("artifact:evolution:toggles", [buildTrainerCheckboxControl({
							inputId: ARTIFACT_EVOLVE_INPUT_ID,
							checked: settings.evolveArtifacts,
							label: translate("HWHTITANART_EVOLVE_ARTIFACTS"),
							icon: "sparkles",
							tooltip: translate("HWHTITAN_TOOLTIP_EVOLVE_ARTIFACTS")
						}), buildTrainerCheckboxControl({
							inputId: ARTIFACT_BUY_FRAGMENTS_INPUT_ID,
							checked: settings.buyArtifactFragments,
							label: translate("HWHTITANART_BUY_ARTIFACT_FRAGMENTS"),
							icon: "shopping-bag",
							tooltip: translate("HWHTITAN_TOOLTIP_BUY_ARTIFACT_FRAGMENTS")
						})], "hwhx-control-stack"),
						buildTitanNumberControl({
							label: translate("HWHTITANART_EVOLUTION_MAX_STAR"),
							inputId: ARTIFACT_EVOLUTION_MAX_STAR_INPUT_ID,
							value: settings.artifactEvolutionMaxStar || getMaxKnownTitanArtifactStar(),
							maxValue: getMaxKnownTitanArtifactStar(),
							icon: "star",
							tooltip: translate("HWHTITAN_TOOLTIP_ARTIFACT_EVOLUTION_MAX_STAR")
						}),
						buildTrainerMultiSelectControl({
							label: translate("HWHTITANART_EVOLVE_TARGETS"),
							inputId: ARTIFACT_EVOLVE_TARGETS_INPUT_ID,
							values: settings.selectedArtifactEvolutionKeys,
							groups: buildArtifactTargetGroups(ownedTitans, {
								inventory,
								maxArtifactStar: settings.artifactEvolutionMaxStar
							}),
							tooltip: translate("HWHTITAN_TOOLTIP_ARTIFACT_EVOLVE_TARGETS")
						}),
						buildTrainerMultiSelectControl({
							label: translate("HWHTITANART_FRAGMENT_BUY_TARGETS"),
							inputId: ARTIFACT_FRAGMENT_BUY_TARGETS_INPUT_ID,
							values: settings.selectedArtifactFragmentBuyKeys,
							groups: buildArtifactTargetGroups(ownedTitans, {
								buyableOnly: true,
								mode: "fragments",
								inventory,
								maxArtifactStar: settings.artifactEvolutionMaxStar
							}),
							tooltip: translate("HWHTITAN_TOOLTIP_ARTIFACT_FRAGMENT_BUY_TARGETS")
						})
					]
				})
			];
			return {
				kind: "artifact",
				header: renderOptions.includeHeader === false ? void 0 : {
					title: translate("HWHTITANART_TITLE"),
					description: translate("HWHTITANART_DESCRIPTION")
				},
				priority: buildTitanArtifactPriorityModel(titanOptions, settings, artifactLevelGain, (_renderOptions$titanA = renderOptions.titanAccordionKey) !== null && _renderOptions$titanA !== void 0 ? _renderOptions$titanA : "titan-list"),
				sections,
				calculator: buildArtifactCalculatorModel(titanOptions, settings, resourceAmount, goldAmount),
				doYourBest: renderOptions.includeDoYourBest === false ? void 0 : buildDoYourBestPlacementModel(TITAN_TRAINER_TAB_ARTIFACTS)
			};
		}
		function buildTitanLevelSettingsModel(settings, titanOptions, potionAmount, soulCoinAmount, inventory = {}, renderOptions = {}) {
			var _renderOptions$titanA2;
			const levelGain = calculateTitanLevelGain(titanOptions, settings, potionAmount);
			const ownedTitans = Object.fromEntries(titanOptions.filter((titanOption) => titanOption.owned).map((titanOption) => {
				var _titanOption$titanDat;
				return [titanOption.id, (_titanOption$titanDat = titanOption.titanData) !== null && _titanOption$titanDat !== void 0 ? _titanOption$titanDat : {}];
			}));
			return {
				kind: "level",
				header: renderOptions.includeHeader === false ? void 0 : {
					title: translate("HWHTITANLVL_TITLE"),
					description: translate("HWHTITANLVL_DESCRIPTION")
				},
				priority: buildTitanLevelPriorityModel({
					titanOptions,
					settings,
					inventory,
					levelGainAmount: levelGain,
					accordionKey: (_renderOptions$titanA2 = renderOptions.titanAccordionKey) !== null && _renderOptions$titanA2 !== void 0 ? _renderOptions$titanA2 : "titan-list",
					translate,
					buildOption: buildLevelTitanOptionViewModel,
					buildBadges: buildTitanBadgeModels,
					buildActions: () => buildPriorityActions(DEFAULT_SETTINGS.reorderListVariant),
					getLevelCap: getTitanLevelCapForTitan,
					getMaxLevel: getMaxTitanLevel
				}),
				sections: [buildTrainerSectionModel({
					key: "level:leveling",
					title: translate("HWHTITANART_LEVELING_SECTION"),
					icon: "arrow-up",
					accentColor: "#4d5770",
					controls: [
						buildUpgradeModeControl(TITAN_LEVEL_UPGRADE_MODE_SELECT_ID, settings),
						buildLevelingModeControl(TITAN_LEVELING_MODE_SELECT_ID, settings),
						buildTitanNumberControl({
							label: translate("HWHTITANLVL_POTION_RESERVE"),
							inputId: POTION_RESERVE_INPUT_ID,
							value: settings.potionReserve,
							gameItemType: "consumable",
							gameItemId: 20,
							sideText: formatNumber(potionAmount),
							icon: "flask",
							tooltip: translate("HWHTITAN_TOOLTIP_POTION_RESERVE")
						}),
						buildTrainerCheckboxControl({
							inputId: TITAN_XP_POTION_BUY_INPUT_ID,
							checked: settings.buyXpPotions,
							label: translate("HWHTITANLVL_BUY_XP_POTIONS"),
							icon: "shopping-cart",
							tooltip: translate("HWHTITAN_TOOLTIP_BUY_XP_POTIONS")
						}),
						buildTitanNumberControl({
							label: translate("HWHTITANLVL_SOUL_COIN_RESERVE"),
							inputId: TITAN_XP_POTION_COIN_RESERVE_INPUT_ID,
							value: settings.xpPotionCoinReserve,
							gameItemType: "coin",
							gameItemId: 15,
							sideText: formatNumber(soulCoinAmount),
							icon: "coins",
							tooltip: translate("HWHTITAN_TOOLTIP_SOUL_COIN_RESERVE")
						}),
						...buildChecklistAmountControlModels(TITAN_LEVEL_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID, TITAN_LEVEL_CHECKLIST_AMOUNT_INPUT_ID, settings),
						buildTrainerCheckboxControl({
							inputId: "hwhtitanlevel-sync-after-run",
							checked: settings.syncAfterRun,
							label: translate("HWHTITANART_SYNC_AFTER_RUN"),
							icon: "refresh-cw",
							tooltip: translate("HWHTITAN_TOOLTIP_SYNC_AFTER_RUN")
						})
					]
				}), buildTrainerSectionModel({
					key: "level:evolution",
					title: translate("HWHTITANART_EVOLUTION_SECTION"),
					icon: "sparkles",
					accentColor: "#5b3f70",
					controls: [buildTrainerMultiSelectControl({
						label: translate("HWHTITANLVL_EVOLVE_TARGETS"),
						inputId: TITAN_EVOLVE_TARGETS_INPUT_ID,
						values: settings.selectedTitanEvolutionIds,
						groups: buildTitanEvolutionTargetGroups(ownedTitans, inventory),
						tooltip: translate("HWHTITAN_TOOLTIP_TITAN_EVOLVE_TARGETS")
					}), buildTitanNumberControl({
						label: translate("HWHTITANLVL_EVOLUTION_MAX_STAR"),
						inputId: TITAN_EVOLUTION_MAX_STAR_INPUT_ID,
						value: settings.titanEvolutionMaxStar || getMaxTitanEvolutionStar(),
						maxValue: getMaxTitanEvolutionStar(),
						icon: "star",
						tooltip: translate("HWHTITAN_TOOLTIP_TITAN_EVOLUTION_MAX_STAR")
					})]
				})],
				calculator: buildTitanLevelCalculatorModel(titanOptions, settings, potionAmount),
				doYourBest: renderOptions.includeDoYourBest === false ? void 0 : buildDoYourBestPlacementModel(TITAN_TRAINER_TAB_LEVELS)
			};
		}
		function buildTitanSkinSettingsModel(settings, titanOptions, skinGroups, skinStoneAmount, renderOptions = {}) {
			var _renderOptions$titanA3;
			const skinLevelGain = calculateTitanSkinLevelGain(titanOptions, settings, skinStoneAmount);
			return {
				kind: "skin",
				header: renderOptions.includeHeader === false ? void 0 : {
					title: translate("HWHTITANSKIN_TITLE"),
					description: translate("HWHTITANSKIN_DESCRIPTION")
				},
				priority: buildTitanSkinPriorityModel(titanOptions, settings, skinLevelGain, (_renderOptions$titanA3 = renderOptions.titanAccordionKey) !== null && _renderOptions$titanA3 !== void 0 ? _renderOptions$titanA3 : "titan-list"),
				sections: [buildTrainerSectionModel({
					key: "skin:leveling",
					title: translate("HWHTITANART_LEVELING_SECTION"),
					icon: "arrow-up",
					accentColor: "#4d5770",
					controls: [
						buildUpgradeModeControl(SKIN_UPGRADE_MODE_SELECT_ID, settings),
						buildLevelingModeControl(SKIN_LEVELING_MODE_SELECT_ID, settings),
						buildTitanNumberControl({
							label: translate("HWHTITANSKIN_RESERVE"),
							inputId: SKIN_RESERVE_INPUT_ID,
							value: settings.skinStoneReserve,
							gameItemType: "coin",
							gameItemId: 24,
							sideText: formatNumber(skinStoneAmount),
							tooltip: translate("HWHTITAN_TOOLTIP_SKIN_RESERVE")
						}),
						...buildChecklistAmountControlModels(SKIN_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID, SKIN_CHECKLIST_AMOUNT_INPUT_ID, settings),
						buildTrainerCheckboxControl({
							inputId: "hwhtitanskin-sync-after-run",
							checked: settings.syncAfterRun,
							label: translate("HWHTITANART_SYNC_AFTER_RUN"),
							icon: "refresh-cw",
							tooltip: translate("HWHTITAN_TOOLTIP_SYNC_AFTER_RUN")
						})
					]
				})],
				calculator: buildTitanSkinCalculatorModel(titanOptions, skinGroups, settings, skinStoneAmount),
				doYourBest: renderOptions.includeDoYourBest === false ? void 0 : buildDoYourBestPlacementModel(TITAN_TRAINER_TAB_SKINS)
			};
		}
		function getArtifactPreviewMaxUpgradeCount(settings) {
			return normalizeLevelingMode(settings === null || settings === void 0 ? void 0 : settings.levelingMode) === "amount" ? getChecklistLevelingAmount(settings) : void 0;
		}
		function buildOwnedTitansFromOptions(titanOptions) {
			return Object.fromEntries(titanOptions.filter((titanOption) => titanOption === null || titanOption === void 0 ? void 0 : titanOption.owned).map((titanOption) => {
				var _titanOption$titanDat2;
				return [Number(titanOption.id), (_titanOption$titanDat2 = titanOption.titanData) !== null && _titanOption$titanDat2 !== void 0 ? _titanOption$titanDat2 : {
					level: titanOption.level,
					skins: titanOption.skinEntries
				}];
			}).filter(([titanId]) => Number.isFinite(titanId)));
		}
		function calculateArtifactLevelGain(settings, ownedTitans, resourceAmount, goldAmount) {
			return buildArtifactUpgradePlan([
				sanitizeSelectedTitanIds(settings === null || settings === void 0 ? void 0 : settings.selectedTitanIds, ownedTitans),
				settings,
				ownedTitans,
				resourceAmount,
				settings === null || settings === void 0 ? void 0 : settings.essenceReserve,
				goldAmount,
				settings === null || settings === void 0 ? void 0 : settings.artifactGoldReserve,
				getArtifactPreviewMaxUpgradeCount(settings)
			]).queue.length;
		}
		function calculateTitanLevelGain(titanOptions, settings, potionAmount) {
			const ownedTitans = buildOwnedTitansFromOptions(titanOptions);
			return buildTitanLevelPlan([
				sanitizeSelectedTitanIds(settings === null || settings === void 0 ? void 0 : settings.selectedTitanIds, ownedTitans),
				ownedTitans,
				potionAmount,
				settings === null || settings === void 0 ? void 0 : settings.potionReserve,
				settings === null || settings === void 0 ? void 0 : settings.titanLevelCaps,
				getArtifactPreviewMaxUpgradeCount(settings),
				settings === null || settings === void 0 ? void 0 : settings.upgradeMode
			]).queue.length;
		}
		function calculateTitanSkinLevelGain(titanOptions, settings, skinStoneAmount) {
			const ownedTitans = buildOwnedTitansFromOptions(titanOptions);
			return buildTitanSkinPlan([
				sanitizeSelectedTitanIds(settings === null || settings === void 0 ? void 0 : settings.selectedTitanIds, ownedTitans),
				settings,
				ownedTitans,
				skinStoneAmount,
				settings === null || settings === void 0 ? void 0 : settings.skinStoneReserve,
				getArtifactPreviewMaxUpgradeCount(settings)
			]).queue.length;
		}
		function buildSafeDomKey(value) {
			return String(value !== null && value !== void 0 ? value : "").trim().replace(/[^a-zA-Z0-9_-]/g, "-");
		}
		function buildOrderedArtifactSlotIdsForEditor(settings, titanId) {
			const seenSlotIds = /* @__PURE__ */ new Set();
			return [...getArtifactSlotIdsForTitan(settings, titanId), ...ARTIFACT_SLOT_IDS].filter((slotId) => {
				const normalizedSlotId = Number(slotId);
				if (!ARTIFACT_SLOT_ID_SET.has(normalizedSlotId) || seenSlotIds.has(normalizedSlotId)) return false;
				seenSlotIds.add(normalizedSlotId);
				return true;
			});
		}
		function getArtifactLevelCapLabel(slotId) {
			if (Number(slotId) === 0) return translate("HWHTITANART_FIRST_ARTIFACT_CAP");
			if (Number(slotId) === 1) return translate("HWHTITANART_SECOND_ARTIFACT_CAP");
			return translate("HWHTITANART_THIRD_ARTIFACT_CAP");
		}
		function getOrderedSkinEntriesForEditor(titanOption, settings) {
			const entries = Array.isArray(titanOption === null || titanOption === void 0 ? void 0 : titanOption.skinEntries) ? titanOption.skinEntries : getTitanSkinEntries(titanOption === null || titanOption === void 0 ? void 0 : titanOption.titanData);
			const entryByLocaleKey = new Map(entries.map((entry) => [String(entry.localeKey), entry]));
			const seenLocaleKeys = /* @__PURE__ */ new Set();
			return [...getSkinRuleForTitan(settings, titanOption === null || titanOption === void 0 ? void 0 : titanOption.id).localeKeys, ...entries.map((entry) => entry.localeKey)].map((localeKey) => String(localeKey !== null && localeKey !== void 0 ? localeKey : "").trim()).filter((localeKey) => {
				if (!localeKey || seenLocaleKeys.has(localeKey)) return false;
				seenLocaleKeys.add(localeKey);
				return entryByLocaleKey.has(localeKey);
			}).map((localeKey) => entryByLocaleKey.get(localeKey)).filter((entry) => entry !== void 0);
		}
		function getTitanTrainerTitleText() {
			var _GM_info$script$name, _GM_info2, _GM_info$script$versi, _GM_info3, _GM_info$script$autho, _GM_info4;
			const scriptName = String((_GM_info$script$name = (_GM_info2 = GM_info) === null || _GM_info2 === void 0 || (_GM_info2 = _GM_info2.script) === null || _GM_info2 === void 0 ? void 0 : _GM_info2.name) !== null && _GM_info$script$name !== void 0 ? _GM_info$script$name : "HWH Titan Trainer");
			const scriptVersion = String((_GM_info$script$versi = (_GM_info3 = GM_info) === null || _GM_info3 === void 0 || (_GM_info3 = _GM_info3.script) === null || _GM_info3 === void 0 ? void 0 : _GM_info3.version) !== null && _GM_info$script$versi !== void 0 ? _GM_info$script$versi : "");
			const scriptAuthor = String((_GM_info$script$autho = (_GM_info4 = GM_info) === null || _GM_info4 === void 0 || (_GM_info4 = _GM_info4.script) === null || _GM_info4 === void 0 ? void 0 : _GM_info4.author) !== null && _GM_info$script$autho !== void 0 ? _GM_info$script$autho : "");
			return `${scriptName}${scriptVersion ? ` v${scriptVersion}` : ""}${scriptAuthor ? ` · ${scriptAuthor}` : ""}`;
		}
		const buildTitanTrainerTabContent = createTitanTrainerTabContentBuilder({
			translate,
			buildArtifactSettingsModel,
			buildLevelSettingsModel: buildTitanLevelSettingsModel,
			buildSkinSettingsModel: buildTitanSkinSettingsModel,
			getResourceAmount,
			getXpPotionAmount: getTitanXpPotionAmount,
			getSkinStoneAmount: getTitanSkinStoneAmount,
			getSoulCoinAmount: getTitanSoulCoinAmount,
			getFragmentCoinAmount: getTitanArtifactFragmentCoinAmount,
			getGoldAmount
		});
		function calculateActiveTrainerSelectionGain({ activeTab, levelTitanOptions, skinTitanOptions, artifactSettings, levelSettings, skinSettings, ownedTitans, resourceAmount, goldAmount, potionAmount, skinStoneAmount }) {
			if (activeTab === "general") return 0;
			if (activeTab === "levels") return calculateTitanLevelGain(levelTitanOptions, levelSettings, potionAmount);
			if (activeTab === "skins") return calculateTitanSkinLevelGain(skinTitanOptions, {
				...skinSettings,
				reorderListVariant: artifactSettings.reorderListVariant
			}, skinStoneAmount);
			return calculateArtifactLevelGain(artifactSettings, ownedTitans, resourceAmount, goldAmount);
		}
		const calculatorResultBuilders = createTitanTrainerCalculatorResultBuilders([
			formatNumber,
			translate,
			getArtifactResourceName,
			getGoldResourceName,
			getTitanXpResourceName,
			getTitanSkinResourceName,
			getTitanArtifactMaxLevel,
			getMaxTitanLevel,
			getTitanArtifactNextUpgrade,
			getTitanLevelUpCost,
			getTitanSkinNextUpgrade,
			findSkinCalculatorEntry
		]);
		const [buildArtifactCalculatorResultModel, buildLevelCalculatorResultModel, buildSkinCalculatorResultModel] = calculatorResultBuilders;
		const [refreshCalculatorModels] = createTitanTrainerCalculatorStateCoordinator([
			calculatorDefaults,
			calculatorResultBuilders,
			getTitanArtifactMaxLevel,
			getMaxTitanLevel
		]);
		function getTitanArtifactNextUpgrade(titanId, slotId, currentLevel) {
			var _levelData$cost, _levelData$cost2;
			const normalizedTitanId = Math.max(0, Number(titanId) || 0);
			const normalizedSlotId = Math.max(0, Number(slotId) || 0);
			const artifactConfig = getTitanArtifactConfig(normalizedTitanId, normalizedSlotId);
			if (!artifactConfig) return;
			const normalizedCurrentLevel = Math.max(0, Number(currentLevel) || 0);
			const nextLevel = Math.max(0, Number(currentLevel) || 0) + 1;
			const levelData = [
				nextLevel,
				normalizedCurrentLevel,
				Math.max(0, nextLevel - 1)
			].filter((level, index, levels) => levels.indexOf(level) === index).map((level) => getArtifactLevelConfigData(artifactConfig.levelConfigMap, level)).filter(Boolean).find((candidateLevelData) => {
				var _candidateLevelData$c, _candidateLevelData$c2;
				const candidateResourceCost = normalizedSlotId === 2 ? 0 : Math.max(0, Number(candidateLevelData === null || candidateLevelData === void 0 || (_candidateLevelData$c = candidateLevelData.cost) === null || _candidateLevelData$c === void 0 || (_candidateLevelData$c = _candidateLevelData$c.consumable) === null || _candidateLevelData$c === void 0 ? void 0 : _candidateLevelData$c[53]) || 0);
				const candidateGoldCost = normalizedSlotId === 2 ? Math.max(0, Number(candidateLevelData === null || candidateLevelData === void 0 || (_candidateLevelData$c2 = candidateLevelData.cost) === null || _candidateLevelData$c2 === void 0 ? void 0 : _candidateLevelData$c2.gold) || 0) : 0;
				return candidateResourceCost > 0 || candidateGoldCost > 0;
			});
			const resourceCost = normalizedSlotId === 2 ? 0 : Math.max(0, Number(levelData === null || levelData === void 0 || (_levelData$cost = levelData.cost) === null || _levelData$cost === void 0 || (_levelData$cost = _levelData$cost.consumable) === null || _levelData$cost === void 0 ? void 0 : _levelData$cost[53]) || 0);
			const goldCost = normalizedSlotId === 2 ? Math.max(0, Number(levelData === null || levelData === void 0 || (_levelData$cost2 = levelData.cost) === null || _levelData$cost2 === void 0 ? void 0 : _levelData$cost2.gold) || 0) : 0;
			const cost = resourceCost > 0 ? resourceCost : goldCost;
			if (cost <= 0) return;
			return {
				titanId: normalizedTitanId,
				slotId: normalizedSlotId,
				nextLevel,
				cost,
				resourceCost,
				goldCost
			};
		}
		const resolveTitanArtifactFragmentRunPlan = createTitanArtifactFragmentRunPlanResolver([
			translate,
			showProgressMessage,
			fetchTitanArtifactFragmentShop,
			createArtifactEvolutionPlanBuilder([
				getArtifactName,
				getTitanName,
				(slotId) => getArtifactSlotMeta(slotId).label,
				getTitanArtifactStates,
				getTitanArtifactConfig,
				getMaxTitanArtifactStar,
				getTitanArtifactEvolutionSteps,
				getTitanArtifactFragmentAmount
			]),
			logArtifactFragmentDebug
		]);
		const buildArtifactUpgradePlan = createTitanArtifactUpgradePlanBuilder([
			getTitanArtifactLevels,
			(settings, titanId) => getArtifactSlotIdsForTitan(settings, titanId),
			(settings, titanId, slotId) => getArtifactLevelCapForTitan(settings, titanId, slotId),
			getTitanArtifactNextUpgrade,
			getTitanName,
			(slotId) => getArtifactSlotMeta(slotId).label
		]);
		const buildTitanEvolutionPlan = createTitanEvolutionPlanBuilder([
			getMaxTitanEvolutionStar,
			getTitanStarCount,
			getTitanSoulAmount,
			getTitanEvolutionCost,
			getTitanName
		]);
		const buildTitanLevelPlan = createTitanLevelPlanBuilder([getTitanLevelUpCost, getTitanName]);
		const buildTitanSkinPlan = createTitanSkinPlanBuilder([
			getTitanSkinEntries,
			getSkinRuleForTitan,
			getSkinLevelCapForTitan,
			getTitanSkinNextUpgrade,
			getTitanName
		]);
		function getTitanSkinNextUpgrade(skinId, currentLevel) {
			var _levelData$cost3;
			const normalizedCurrentLevel = Math.max(0, Number(currentLevel) || 0);
			const nextLevel = Math.max(0, Number(currentLevel) || 0) + 1;
			const levelData = [
				nextLevel,
				normalizedCurrentLevel,
				Math.max(0, nextLevel - 1)
			].filter((level, index, levels) => levels.indexOf(level) === index).map((level) => getTitanSkinLevelData(skinId, level)).filter(Boolean).find((candidateLevelData) => {
				var _candidateLevelData$c3;
				return Math.max(0, Number(candidateLevelData === null || candidateLevelData === void 0 || (_candidateLevelData$c3 = candidateLevelData.cost) === null || _candidateLevelData$c3 === void 0 || (_candidateLevelData$c3 = _candidateLevelData$c3.coin) === null || _candidateLevelData$c3 === void 0 ? void 0 : _candidateLevelData$c3[24]) || 0) > 0;
			});
			const cost = Math.max(0, Number(levelData === null || levelData === void 0 || (_levelData$cost3 = levelData.cost) === null || _levelData$cost3 === void 0 || (_levelData$cost3 = _levelData$cost3.coin) === null || _levelData$cost3 === void 0 ? void 0 : _levelData$cost3[24]) || 0);
			if (cost <= 0) return;
			return {
				skinId: Math.max(0, Number(skinId) || 0),
				nextLevel,
				cost
			};
		}
		function getTitanLevelConfig(level) {
			const levelData = getCollectionValue(getPlainRecord(getGameDataRecord("level").titan), Math.max(0, Number(level) || 0));
			return isPlainObject(levelData) ? levelData : void 0;
		}
		function getTitanLevelUpCost(currentLevel) {
			const normalizedCurrentLevel = Math.max(0, Number(currentLevel) || 0);
			const currentLevelData = getTitanLevelConfig(normalizedCurrentLevel);
			const nextLevelData = getTitanLevelConfig(normalizedCurrentLevel + 1);
			if (!currentLevelData || !nextLevelData) return;
			const currentExp = Number(currentLevelData.exp);
			const cost = Number(nextLevelData.exp) - currentExp;
			if (!Number.isFinite(cost) || cost <= 0) return;
			return cost;
		}
		function getTitanEvolutionCost(nextStar) {
			const evolutionStarData = getCollectionEntry(getPlainRecord(getGameDataRecord("enum").titanEvolutionStar), Math.max(0, Number(nextStar) || 0));
			return Math.max(0, Number(evolutionStarData.evolveFragmentCost) || 0);
		}
		function getMaxTitanEvolutionStar() {
			var _globalThis$lib$data$2, _globalThis$lib5;
			if (maxTitanEvolutionStarCache !== void 0) return maxTitanEvolutionStarCache;
			maxTitanEvolutionStarCache = Object.keys((_globalThis$lib$data$2 = (_globalThis$lib5 = globalThis.lib) === null || _globalThis$lib5 === void 0 || (_globalThis$lib5 = _globalThis$lib5.data) === null || _globalThis$lib5 === void 0 || (_globalThis$lib5 = _globalThis$lib5.enum) === null || _globalThis$lib5 === void 0 ? void 0 : _globalThis$lib5.titanEvolutionStar) !== null && _globalThis$lib$data$2 !== void 0 ? _globalThis$lib$data$2 : {}).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0).reduce((maxValue, value) => Math.max(maxValue, value), 0);
			return maxTitanEvolutionStarCache;
		}
		function getTitanStarCount(titanData) {
			var _titanRecord$star;
			const titanRecord = getPlainRecord(titanData);
			return Math.max(0, Number((_titanRecord$star = titanRecord.star) !== null && _titanRecord$star !== void 0 ? _titanRecord$star : titanRecord.stars) || 0);
		}
		const [runTitanSkinLeveling, runTitanLeveling] = createTitanLevelingRunFlows([
			translate,
			sanitizeSelectedTitanIds,
			showProgressMessage,
			showFinalProgress,
			refreshTitanSnapshotAfterRun,
			(...args) => console.error(...args),
			getTitanSkinResourceName,
			getTitanSkinStoneAmount,
			buildTitanSkinPlan,
			runTitanSkinExecutionSequence,
			[buildTitanSkinErrorResult, buildTitanSkinSuccessResult],
			getTitanXpResourceName,
			getTitanXpPotionAmount,
			getTitanSoulCoinAmount,
			fetchTitanXpPotionShop,
			buildTitanXpPotionPurchasePlan,
			buildTitanEvolutionPlan,
			buildTitanLevelPlan,
			runTitanLevelExecutionSequence,
			[buildTitanLevelErrorResult, buildTitanLevelSuccessResult]
		]);
		async function runTitanArtifactLeveling(settings, ownedTitans, inventory, userInfo = {}, options = {}) {
			const sanitizedTitanIds = sanitizeSelectedTitanIds(settings.selectedTitanIds, ownedTitans);
			const selectedArtifactSlotIds = getSelectedArtifactSlotIdsFromRules(settings, sanitizedTitanIds);
			if (sanitizedTitanIds.length <= 0) {
				showFinalProgress(...buildTitanRunWarningResult(translate("HWHTITANART_SELECT_TITANS_FIRST"), translate("HWHTITANTRAINER_RUN_SELECTION_REQUIRED")));
				return;
			}
			const resourceName = getArtifactResourceName();
			const goldResourceName = getGoldResourceName();
			const resourceAmount = getResourceAmount(inventory);
			const goldAmount = getGoldAmount(userInfo);
			const fragmentCoinAmount = getTitanArtifactFragmentCoinAmount(inventory);
			const [buyArtifactFragments, evolutionPlan, fragmentDebugEntries, remainingUpgradeCount] = await resolveTitanArtifactFragmentRunPlan([
				settings,
				options,
				sanitizedTitanIds,
				selectedArtifactSlotIds,
				ownedTitans,
				inventory,
				fragmentCoinAmount
			]);
			const plan = buildArtifactUpgradePlan([
				sanitizedTitanIds,
				settings,
				ownedTitans,
				resourceAmount,
				settings.essenceReserve,
				goldAmount,
				settings.artifactGoldReserve,
				remainingUpgradeCount
			]);
			if (plan.queue.length <= 0 && evolutionPlan.evolutions.length <= 0 && evolutionPlan.fragmentPurchases.length <= 0) {
				showFinalProgress(...buildTitanRunWarningResult(translate("HWHTITANART_NOTHING_TO_LEVEL"), translate("HWHTITANTRAINER_RUN_NOTHING_TO_DO")));
				return;
			}
			const executedPlan = createTitanArtifactFinalSummaryPlan({
				resourceAmount,
				goldAmount,
				fragmentCoinAmount,
				usesGoldBudget: plan.usesGoldBudget
			});
			try {
				await runTitanArtifactExecutionSequence({
					evolutionPlan,
					upgradePlan: plan,
					executedPlan,
					fragmentCoinAmount,
					resourceAmount,
					goldAmount,
					buyArtifactFragments
				});
			} catch (error) {
				if (buyArtifactFragments) logArtifactFragmentDebug("run failed", {
					error,
					debugEntries: fragmentDebugEntries
				});
				console.error("[TitanArtifact] Error:", error);
				showFinalProgress(...buildArtifactErrorResult([
					executedPlan,
					resourceName,
					goldResourceName,
					error
				]));
				return;
			}
			showProgressMessage("", "syncing");
			await refreshTitanSnapshotAfterRun();
			showFinalProgress(...buildArtifactSuccessResult([
				executedPlan,
				resourceName,
				goldResourceName,
				plan.queue.length + evolutionPlan.evolutions.length + evolutionPlan.fragmentPurchases.length,
				settings,
				options
			]));
		}
		function createTitanTrainerStoreBridge() {
			return {
				normalizers: {
					artifact: normalizeSettings,
					level: normalizeLevelSettings,
					skin: normalizeSkinSettings
				},
				repository: {
					readArtifact: readSettings,
					writeArtifact: writeSettings,
					readLevel: readLevelSettings,
					writeLevel: writeLevelSettings,
					readSkin: readSkinSettings,
					writeSkin: writeSkinSettings
				}
			};
		}
		async function openTitanTrainerMenu() {
			await ensureGameRuntimeReady();
			const { gameEntityIconResolver, gameItemIconResolver } = createRuntimeGameIconResolvers(globalThis.lib);
			const snapshotPromise = titanSnapshotCache.get();
			const accordionUiPropsPromise = getTitanAccordionUiProps();
			initializeRuntimeUi();
			const trainerStoreBridge = createTitanTrainerStoreBridge();
			const [trainerStoreState, snapshot, accordionUiProps] = await Promise.all([
				loadTitanTrainerStores(trainerStoreBridge),
				snapshotPromise,
				accordionUiPropsPromise
			]);
			const trainerStores = trainerStoreState.stores;
			let { artifactSettings, levelSettings, skinSettings } = trainerStoreState;
			let activeTab = TITAN_TRAINER_TAB_ARTIFACTS;
			const persistTrainerSettings = () => writeAllTitanTrainerSettings({
				...trainerStoreBridge,
				artifactSettings,
				levelSettings,
				skinSettings,
				stores: trainerStores
			});
			const saveTrainerSettings = createTitanTrainerSettingsSaveHandler({
				persistSettings: persistTrainerSettings,
				showToast: showRuntimeFeedbackToast,
				translate
			});
			while (true) {
				const sanitizedTrainerSettings = sanitizeTitanTrainerSettingsForSnapshot({
					artifactSettings,
					levelSettings,
					skinSettings,
					ownedTitans: snapshot.titans,
					normalizeArtifactSettings: normalizeSettings,
					normalizeLevelSettings,
					normalizeSkinSettings
				});
				artifactSettings = sanitizedTrainerSettings.artifactSettings;
				levelSettings = sanitizedTrainerSettings.levelSettings;
				skinSettings = sanitizedTrainerSettings.skinSettings;
				const artifactTitanOptions = [];
				const levelTitanOptions = [];
				const skinTitanOptions = [];
				const skinGroups = [];
				let artifactTitanOptionsReady = false;
				let levelTitanOptionsReady = false;
				let skinTitanOptionsReady = false;
				const ensureTrainerTabData = (tabValue) => {
					if (tabValue === "artifacts" && !artifactTitanOptionsReady) {
						artifactTitanOptions.push(...buildTitanOptions(snapshot.titans, artifactSettings));
						artifactTitanOptionsReady = true;
						return;
					}
					if (tabValue === "levels" && !levelTitanOptionsReady) {
						levelTitanOptions.push(...buildTitanLevelOptions(snapshot.titans, levelSettings));
						levelTitanOptionsReady = true;
						return;
					}
					if (tabValue === "skins" && !skinTitanOptionsReady) {
						skinGroups.push(...getTitanSkinGroups());
						skinTitanOptions.push(...buildTitanSkinOptions(snapshot.titans, skinSettings));
						skinTitanOptionsReady = true;
					}
				};
				const titanTrainerTabsModel = createRuntimeShallowReactiveState(buildTitanTrainerTabsModel(activeTab, translate));
				const trainerTabs = Array.isArray(titanTrainerTabsModel.tabs) ? titanTrainerTabsModel.tabs.map((tab) => getPlainRecord(tab)) : [];
				const trainerTabByValue = new Map(trainerTabs.map((tab) => {
					var _tab$value;
					return [String((_tab$value = tab.value) !== null && _tab$value !== void 0 ? _tab$value : ""), tab];
				}));
				let activeTrainerBodyModel;
				const hydrateTrainerTab = (nextActiveTab) => {
					for (const tab of trainerTabs) {
						delete tab.contentProps;
						delete tab.generalProps;
					}
					const activeTabModel = trainerTabByValue.get(nextActiveTab);
					if (!activeTabModel) {
						activeTrainerBodyModel = void 0;
						return;
					}
					ensureTrainerTabData(nextActiveTab);
					const tabContent = buildTitanTrainerTabContent(nextActiveTab, {
						artifactSettings,
						levelSettings,
						skinSettings,
						artifactTitanOptions,
						levelTitanOptions,
						skinTitanOptions,
						ownedTitans: snapshot.titans,
						inventory: snapshot.inventory,
						userInfo: snapshot.userInfo,
						skinGroups,
						accordionUiProps
					});
					const contentProps = getPlainRecord(tabContent.contentProps);
					const bodyModel = getPlainRecord(contentProps.model);
					const reactiveBodyModel = bodyModel.kind ? createRuntimeReactiveState(bodyModel) : void 0;
					Object.assign(activeTabModel, tabContent, { ...reactiveBodyModel ? { contentProps: {
						...contentProps,
						model: reactiveBodyModel
					} } : {} });
					titanTrainerTabsModel.activeTab = nextActiveTab;
					activeTrainerBodyModel = reactiveBodyModel;
				};
				hydrateTrainerTab(activeTab);
				const selectionPreview = createTitanTrainerSelectionPreviewState();
				const syncTrainerRunAction = createTitanTrainerRunActionSynchronizer([
					() => activeTab,
					() => artifactSettings,
					() => levelSettings,
					() => skinSettings,
					snapshot.titans,
					sanitizeSelectedTitanIds,
					translate,
					patchRuntimeAction
				]);
				const getTrainerCalculatorModel = (panelKind) => {
					var _activeTrainerBodyMod;
					if (String((_activeTrainerBodyMod = activeTrainerBodyModel === null || activeTrainerBodyModel === void 0 ? void 0 : activeTrainerBodyModel.kind) !== null && _activeTrainerBodyMod !== void 0 ? _activeTrainerBodyMod : "") !== panelKind) return;
					const calculator = activeTrainerBodyModel === null || activeTrainerBodyModel === void 0 ? void 0 : activeTrainerBodyModel.calculator;
					return isPlainObject(calculator) ? calculator : void 0;
				};
				const updateTrainerCalculatorControlValue = (inputId, value) => {
					const panelKind = getTitanTrainerCalculatorPanelKind(inputId);
					if (!panelKind) return false;
					return setCalculatorControlValue(getTrainerCalculatorModel(panelKind), inputId, value);
				};
				const updateTrainerSelectionPreviewState = () => {
					const levelGainAmount = calculateActiveTrainerSelectionGain({
						activeTab,
						artifactTitanOptions,
						levelTitanOptions,
						skinTitanOptions,
						skinGroups,
						artifactSettings,
						levelSettings,
						skinSettings,
						ownedTitans: snapshot.titans,
						resourceAmount: getResourceAmount(snapshot.inventory),
						goldAmount: getGoldAmount(snapshot.userInfo),
						potionAmount: getTitanXpPotionAmount(snapshot.inventory),
						skinStoneAmount: getTitanSkinStoneAmount(snapshot.inventory)
					});
					issueTitanTrainerSelectionPreview(selectionPreview, activeTab, translate("HWHTITANART_LEVEL_GAIN", { amount: formatNumber(levelGainAmount) }));
				};
				let pendingTrainerRefreshInputId = "";
				let trainerRefreshScheduled = false;
				const scheduleTrainerInteractiveRefresh = (changedInputId) => {
					pendingTrainerRefreshInputId = changedInputId;
					if (trainerRefreshScheduled) return;
					trainerRefreshScheduled = true;
					const flush = () => {
						trainerRefreshScheduled = false;
						const pendingInputId = pendingTrainerRefreshInputId;
						pendingTrainerRefreshInputId = "";
						refreshTitanTrainerCalculators(pendingInputId);
						updateTrainerSelectionPreviewState();
						syncTrainerRunAction();
					};
					queueMicrotask(flush);
				};
				const refreshTitanTrainerCalculators = (changedInputId) => {
					const artifactCalculator = getTrainerCalculatorModel("artifact");
					const levelCalculator = getTrainerCalculatorModel("level");
					const skinCalculator = getTrainerCalculatorModel("skin");
					refreshCalculatorModels([
						changedInputId,
						artifactCalculator,
						levelCalculator,
						skinCalculator,
						artifactTitanOptions,
						levelTitanOptions,
						skinTitanOptions,
						skinGroups,
						artifactSettings,
						levelSettings,
						skinSettings,
						getResourceAmount(snapshot.inventory),
						getGoldAmount(snapshot.userInfo),
						getTitanXpPotionAmount(snapshot.inventory),
						getTitanSkinStoneAmount(snapshot.inventory)
					]);
				};
				const updateArtifactSettingsFromControl = (patch) => {
					artifactSettings = normalizeSettings({
						...artifactSettings,
						...patch
					});
				};
				const updateLevelSettingsFromControl = (patch) => {
					levelSettings = normalizeLevelSettings({
						...levelSettings,
						...patch
					});
				};
				const updateSkinSettingsFromControl = (patch) => {
					skinSettings = normalizeSkinSettings({
						...skinSettings,
						...patch
					});
				};
				const getPrioritySelectedTitanIds = (change) => sanitizeSelectedTitanIds(change.selectedTitanIds, snapshot.titans);
				const updateArtifactPriorityFromChange = (change) => {
					const selectedTitanIds = getPrioritySelectedTitanIds(change);
					const artifactRules = normalizeArtifactRules(artifactSettings);
					change.rows.forEach((row) => {
						const titanId = Number(row.titanId);
						if (!Number.isFinite(titanId)) return;
						const fallbackRule = getArtifactRuleForTitan(artifactSettings, titanId);
						const slotIds = [];
						const levelCaps = { ...fallbackRule.levelCaps };
						row.children.forEach((child) => {
							var _fallbackRule$levelCa, _fallbackRule$levelCa2;
							const slotId = Number(child.orderKey || child.key);
							if (!ARTIFACT_SLOT_ID_SET.has(slotId)) return;
							if (child.checked && !child.disabled) slotIds.push(slotId);
							levelCaps[slotId] = normalizeCapValue(child.capValue, (_fallbackRule$levelCa = (_fallbackRule$levelCa2 = fallbackRule.levelCaps) === null || _fallbackRule$levelCa2 === void 0 ? void 0 : _fallbackRule$levelCa2[slotId]) !== null && _fallbackRule$levelCa !== void 0 ? _fallbackRule$levelCa : getDefaultArtifactLevelCap(slotId));
						});
						artifactRules[titanId] = {
							slotIds: row.children.length > 0 ? slotIds : fallbackRule.slotIds,
							levelCaps
						};
					});
					updateArtifactSettingsFromControl({
						selectedTitanIds,
						artifactRules,
						selectedArtifactSlotIds: getSelectedArtifactSlotIdsFromRules({
							...artifactSettings,
							selectedTitanIds,
							artifactRules
						}, selectedTitanIds)
					});
				};
				const updateSkinPriorityFromChange = (change) => {
					const selectedTitanIds = getPrioritySelectedTitanIds(change);
					const skinRules = normalizeSkinRules(skinSettings);
					change.rows.forEach((row) => {
						const titanId = Number(row.titanId);
						if (!Number.isFinite(titanId)) return;
						const fallbackRule = getSkinRuleForTitan(skinSettings, titanId);
						const localeKeys = [];
						const levelCaps = { ...fallbackRule.levelCaps };
						row.children.forEach((child) => {
							var _fallbackRule$levelCa3, _fallbackRule$levelCa4;
							const localeKey = String(child.orderKey || child.key || "").trim();
							if (!localeKey) return;
							if (child.checked && !child.disabled) localeKeys.push(localeKey);
							levelCaps[localeKey] = normalizeCapValue(child.capValue, (_fallbackRule$levelCa3 = (_fallbackRule$levelCa4 = fallbackRule.levelCaps) === null || _fallbackRule$levelCa4 === void 0 ? void 0 : _fallbackRule$levelCa4[localeKey]) !== null && _fallbackRule$levelCa3 !== void 0 ? _fallbackRule$levelCa3 : getDefaultTitanSkinLevelCap(localeKey));
						});
						skinRules[titanId] = {
							localeKeys: row.children.length > 0 ? localeKeys : fallbackRule.localeKeys,
							levelCaps
						};
					});
					updateSkinSettingsFromControl({
						selectedTitanIds,
						skinRules,
						selectedSkinLocaleKeys: getSelectedSkinLocaleKeysFromRules({
							...skinSettings,
							selectedTitanIds,
							skinRules
						}, selectedTitanIds)
					});
				};
				const handleTitanTrainerPriorityChange = (change) => {
					if (change.panelKind === "artifact") updateArtifactPriorityFromChange(change);
					else if (change.panelKind === "level") {
						const titanLevelCaps = { ...levelSettings.titanLevelCaps };
						change.rows.forEach((row) => {
							const titanId = Number(row.titanId);
							if (!Number.isFinite(titanId)) return;
							titanLevelCaps[titanId] = normalizeCapValue(row.capValue, getTitanLevelCapForTitan(levelSettings, titanId));
						});
						updateLevelSettingsFromControl({
							selectedTitanIds: getPrioritySelectedTitanIds(change),
							titanLevelCaps
						});
					} else if (change.panelKind === "skin") updateSkinPriorityFromChange(change);
					scheduleTrainerInteractiveRefresh(change.changedInputId);
				};
				const applyArtifactTrainerControlChange = ({ inputId, value, textValue, numberValue, stringListValue }) => {
					switch (inputId) {
						case ARTIFACT_UPGRADE_MODE_SELECT_ID:
							updateArtifactSettingsFromControl({ upgradeMode: textValue });
							break;
						case ARTIFACT_LEVELING_MODE_SELECT_ID:
							updateArtifactSettingsFromControl({ levelingMode: textValue });
							break;
						case ARTIFACT_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID:
							updateArtifactSettingsFromControl({ checklistAmountBehavior: textValue });
							break;
						case ARTIFACT_CHECKLIST_AMOUNT_INPUT_ID:
							updateArtifactSettingsFromControl({ checklistLevelingAmount: numberValue });
							break;
						case ARTIFACT_CHECKLIST_FRAGMENT_BEHAVIOR_SELECT_ID:
							updateArtifactSettingsFromControl({ checklistFragmentPurchaseBehavior: textValue });
							break;
						case ESSENCE_RESERVE_INPUT_ID:
							updateArtifactSettingsFromControl({ essenceReserve: numberValue });
							break;
						case ARTIFACT_GOLD_RESERVE_INPUT_ID:
							updateArtifactSettingsFromControl({ artifactGoldReserve: numberValue });
							break;
						case ARTIFACT_FRAGMENT_COIN_RESERVE_INPUT_ID:
							updateArtifactSettingsFromControl({ artifactFragmentCoinReserve: numberValue });
							break;
						case ARTIFACT_EVOLVE_INPUT_ID:
							updateArtifactSettingsFromControl({ evolveArtifacts: !!value });
							break;
						case ARTIFACT_BUY_FRAGMENTS_INPUT_ID:
							updateArtifactSettingsFromControl({ buyArtifactFragments: !!value });
							break;
						case ARTIFACT_EVOLVE_TARGETS_INPUT_ID:
							updateArtifactSettingsFromControl({ selectedArtifactEvolutionKeys: stringListValue });
							break;
						case ARTIFACT_FRAGMENT_BUY_TARGETS_INPUT_ID:
							updateArtifactSettingsFromControl({ selectedArtifactFragmentBuyKeys: stringListValue });
							break;
						case ARTIFACT_EVOLUTION_MAX_STAR_INPUT_ID:
							updateArtifactSettingsFromControl({ artifactEvolutionMaxStar: numberValue });
							break;
						case SHOW_FULL_COST_INPUT_ID:
							updateArtifactSettingsFromControl({ showFullCosts: !!value });
							break;
						case "hwhtitanartifact-sync-after-run":
							updateArtifactSettingsFromControl({ syncAfterRun: !!value });
							break;
					}
				};
				const applyLevelTrainerControlChange = ({ inputId, value, textValue, numberValue, stringListValue }) => {
					switch (inputId) {
						case TITAN_LEVEL_UPGRADE_MODE_SELECT_ID:
							updateLevelSettingsFromControl({ upgradeMode: textValue });
							break;
						case TITAN_LEVELING_MODE_SELECT_ID:
							updateLevelSettingsFromControl({ levelingMode: textValue });
							break;
						case TITAN_LEVEL_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID:
							updateLevelSettingsFromControl({ checklistAmountBehavior: textValue });
							break;
						case TITAN_LEVEL_CHECKLIST_AMOUNT_INPUT_ID:
							updateLevelSettingsFromControl({ checklistLevelingAmount: numberValue });
							break;
						case POTION_RESERVE_INPUT_ID:
							updateLevelSettingsFromControl({ potionReserve: numberValue });
							break;
						case TITAN_XP_POTION_BUY_INPUT_ID:
							updateLevelSettingsFromControl({ buyXpPotions: !!value });
							break;
						case TITAN_XP_POTION_COIN_RESERVE_INPUT_ID:
							updateLevelSettingsFromControl({ xpPotionCoinReserve: numberValue });
							break;
						case TITAN_EVOLVE_TARGETS_INPUT_ID:
							updateLevelSettingsFromControl({ selectedTitanEvolutionIds: stringListValue.map((entry) => Number(entry)) });
							break;
						case TITAN_EVOLUTION_MAX_STAR_INPUT_ID:
							updateLevelSettingsFromControl({ titanEvolutionMaxStar: numberValue });
							break;
						case SHOW_LEVEL_COST_INPUT_ID:
							updateLevelSettingsFromControl({ showNextCosts: !!value });
							break;
						case SHOW_LEVEL_EVOLUTION_INPUT_ID:
							updateLevelSettingsFromControl({ showEvolutionProgress: !!value });
							break;
						case "hwhtitanlevel-sync-after-run":
							updateLevelSettingsFromControl({ syncAfterRun: !!value });
							break;
					}
				};
				const applySkinTrainerControlChange = ({ inputId, value, textValue, numberValue }) => {
					switch (inputId) {
						case SKIN_UPGRADE_MODE_SELECT_ID:
							updateSkinSettingsFromControl({ upgradeMode: textValue });
							break;
						case SKIN_LEVELING_MODE_SELECT_ID:
							updateSkinSettingsFromControl({ levelingMode: textValue });
							break;
						case SKIN_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID:
							updateSkinSettingsFromControl({ checklistAmountBehavior: textValue });
							break;
						case SKIN_CHECKLIST_AMOUNT_INPUT_ID:
							updateSkinSettingsFromControl({ checklistLevelingAmount: numberValue });
							break;
						case SKIN_RESERVE_INPUT_ID:
							updateSkinSettingsFromControl({ skinStoneReserve: numberValue });
							break;
						case SHOW_SKIN_COST_INPUT_ID:
							updateSkinSettingsFromControl({ showNextCosts: !!value });
							break;
						case "hwhtitanskin-sync-after-run":
							updateSkinSettingsFromControl({ syncAfterRun: !!value });
							break;
					}
				};
				const handleTitanTrainerBodyControlChange = (change) => {
					var _change$inputId;
					const inputId = String((_change$inputId = change.inputId) !== null && _change$inputId !== void 0 ? _change$inputId : "");
					const value = change.value;
					const textValue = String(value !== null && value !== void 0 ? value : "");
					const numberValue = Math.max(0, Math.floor(Number(value) || 0));
					const stringListValue = Array.isArray(value) ? value.map((entry) => String(entry !== null && entry !== void 0 ? entry : "")).filter(Boolean) : [];
					if (persistTitanDoYourBestPlacementFromControl(inputId, textValue)) {
						scheduleTrainerInteractiveRefresh(inputId);
						return;
					}
					if (updateTrainerCalculatorControlValue(inputId, value)) {
						scheduleTrainerInteractiveRefresh(inputId);
						return;
					}
					const normalizedChange = {
						inputId,
						value,
						textValue,
						numberValue,
						stringListValue
					};
					applyArtifactTrainerControlChange(normalizedChange);
					applyLevelTrainerControlChange(normalizedChange);
					applySkinTrainerControlChange(normalizedChange);
					scheduleTrainerInteractiveRefresh(inputId);
				};
				const selectionCommand = createTitanTrainerSelectionCommandState();
				const issueActiveTrainerSelectionCommand = (checked) => {
					issueTitanTrainerSelectionCommand(selectionCommand, activeTab, checked);
				};
				updateTrainerSelectionPreviewState();
				const answerPromise = openTitanTrainerTabsModal({
					title: getTitanTrainerTitleText(),
					header: buildRuntimeModalHeader(),
					headerActions: buildRuntimeTrainerHeaderActions(translate),
					activeTab: titanTrainerTabsModel.activeTab,
					tabs: titanTrainerTabsModel.tabs,
					selectionCommand,
					selectionPreview,
					translate,
					uiTheme: artifactSettings === null || artifactSettings === void 0 ? void 0 : artifactSettings.uiTheme,
					closeLabel: translate("HWHTITANART_CLOSE"),
					gameEntityIconResolver,
					gameItemIconResolver,
					onActiveTabChange: (nextActiveTab) => {
						hydrateTrainerTab(nextActiveTab);
						activeTab = nextActiveTab;
						updateTrainerSelectionPreviewState();
						syncTrainerRunAction();
					},
					onArtifactSettingsChange: (nextSettings) => {
						artifactSettings = normalizeSettings({
							...artifactSettings,
							...getPlainRecord(nextSettings)
						});
						applyTitanTrainerUiPreferences(artifactSettings);
						syncTrainerRunAction();
					},
					onLevelSettingsChange: (nextSettings) => {
						levelSettings = normalizeLevelSettings({
							...levelSettings,
							...getPlainRecord(nextSettings)
						});
						syncTrainerRunAction();
					},
					onSkinSettingsChange: (nextSettings) => {
						skinSettings = normalizeSkinSettings({
							...skinSettings,
							...getPlainRecord(nextSettings)
						});
						syncTrainerRunAction();
					},
					onThemeChange: (nextTheme) => {
						artifactSettings = normalizeSettings({
							...artifactSettings,
							uiTheme: nextTheme
						});
						applyTitanTrainerUiTheme(artifactSettings);
					},
					onControlChange: handleTitanTrainerBodyControlChange,
					onPriorityChange: handleTitanTrainerPriorityChange,
					onAction: (result) => {
						dispatchTitanTrainerToolbarAction(result, createTitanTrainerToolbarActionHandlers({
							saveSettings: saveTrainerSettings,
							persistSettings: persistTrainerSettings,
							exportSettings: exportSettingsToJson,
							dumpGameLibrary: () => dumpGameLibraryToConsole("hwhtitanartifact"),
							selectAll: () => issueActiveTrainerSelectionCommand(true),
							clearAll: () => issueActiveTrainerSelectionCommand(false)
						}));
					}
				});
				syncTrainerRunAction();
				const modal = { answerPromise };
				const selectionActions = createTitanTrainerSelectionActions({
					getActiveTab: () => activeTab,
					artifactTitanOptions,
					levelTitanOptions,
					skinTitanOptions,
					getArtifactSettings: () => artifactSettings,
					setArtifactSettings: (nextSettings) => {
						artifactSettings = nextSettings;
					},
					normalizeArtifactSettings: normalizeSettings,
					getLevelSettings: () => levelSettings,
					setLevelSettings: (nextSettings) => {
						levelSettings = nextSettings;
					},
					normalizeLevelSettings,
					getSkinSettings: () => skinSettings,
					setSkinSettings: (nextSettings) => {
						skinSettings = nextSettings;
					},
					normalizeSkinSettings,
					persistSettings: persistTrainerSettings
				});
				const answerHandlers = createTitanTrainerModalAnswerHandlers({
					getActiveTab: () => activeTab,
					getArtifactSettings: () => artifactSettings,
					setArtifactSettings: (nextSettings) => {
						artifactSettings = nextSettings;
					},
					setLevelSettings: (nextSettings) => {
						levelSettings = nextSettings;
					},
					setSkinSettings: (nextSettings) => {
						skinSettings = nextSettings;
					},
					persistSettings: persistTrainerSettings,
					saveSettings: saveTrainerSettings,
					selectAll: selectionActions.selectAll,
					clearAll: selectionActions.clearAll,
					exportSettings: exportSettingsToJson,
					donate: (settings) => openRuntimeDonateModal(translate, settings.uiTheme),
					help: (settings) => openRuntimeDocumentationModal(translate, settings.uiTheme),
					dumpGameLibrary: () => {
						dumpGameLibraryToConsole("hwhtitanartifact");
					},
					importSettings: importSettingsFromJson,
					readArtifactSettings: readSettings,
					readLevelSettings,
					readSkinSettings,
					reportImportError: (error) => {
						const message = error instanceof Error ? error.message : translate("HWHTITANART_ERROR_GENERIC");
						console.error("[TitanTrainer] import failed", error);
						showSettingsNotice(translate("HWHTITANTRAINER_SETTINGS_IMPORT_ERROR", { message }), "alert-triangle", "hwhx-danger");
					},
					runLevel: createTitanTrainerRunHandler({
						getSettings: () => levelSettings,
						resolveRunOptions: resolveTitanLevelingRunOptions,
						run: (settings, runOptions) => runTitanLeveling(settings, snapshot.titans, snapshot.inventory, runOptions)
					}),
					runSkin: createTitanTrainerRunHandler({
						getSettings: () => skinSettings,
						resolveRunOptions: resolveTitanLevelingRunOptions,
						run: (settings, runOptions) => runTitanSkinLeveling(settings, snapshot.titans, snapshot.inventory, runOptions)
					}),
					runArtifact: createTitanTrainerRunHandler({
						getSettings: () => artifactSettings,
						resolveRunOptions: resolveTitanLevelingRunOptions,
						run: (settings, runOptions) => runTitanArtifactLeveling(settings, snapshot.titans, snapshot.inventory, snapshot.userInfo, runOptions)
					})
				});
				if (await processTitanTrainerModalAnswer({
					activeTab,
					answer: await modal.answerPromise,
					handlers: answerHandlers
				}) === "return") return;
				continue;
			}
		}
		const runTitanArtifactChecklistTask = createTitanTrainerChecklistRunTask({
			readSettings,
			resolveRunOptions: resolveTitanLevelingRunOptions,
			run: async (settings, runOptions) => {
				const snapshot = await fetchTitanSnapshot(sendCalls, true, true);
				await runTitanArtifactLeveling(settings, snapshot.titans, snapshot.inventory, snapshot.userInfo, runOptions);
			}
		});
		const runTitanLevelChecklistTask = createTitanTrainerChecklistRunTask({
			readSettings: readLevelSettings,
			resolveRunOptions: resolveTitanLevelingRunOptions,
			run: async (settings, runOptions) => {
				const snapshot = await fetchTitanSnapshot(sendCalls, true);
				await runTitanLeveling(settings, snapshot.titans, snapshot.inventory, runOptions);
			}
		});
		const runTitanSkinChecklistTask = createTitanTrainerChecklistRunTask({
			readSettings: readSkinSettings,
			resolveRunOptions: resolveTitanLevelingRunOptions,
			run: async (settings, runOptions) => {
				const snapshot = await fetchTitanSnapshot(sendCalls, true);
				await runTitanSkinLeveling(settings, snapshot.titans, snapshot.inventory, runOptions);
			}
		});
		async function runTitanArtifactHotkeyTask() {
			const settings = await readSettings();
			const resolved = await resolveTitanLevelingRunOptions(settings, { source: "hotkey" });
			if (!resolved.confirmed) return;
			const snapshot = await fetchTitanSnapshot(sendCalls, true, true);
			await runTitanArtifactLeveling(settings, snapshot.titans, snapshot.inventory, snapshot.userInfo, resolved.options);
		}
		async function runTitanLevelHotkeyTask() {
			const settings = await readLevelSettings();
			const resolved = await resolveTitanLevelingRunOptions(settings, { source: "hotkey" });
			if (!resolved.confirmed) return;
			const snapshot = await fetchTitanSnapshot(sendCalls, true);
			await runTitanLeveling(settings, snapshot.titans, snapshot.inventory, resolved.options);
		}
		async function runTitanSkinHotkeyTask() {
			const settings = await readSkinSettings();
			const resolved = await resolveTitanLevelingRunOptions(settings, { source: "hotkey" });
			if (!resolved.confirmed) return;
			const snapshot = await fetchTitanSnapshot(sendCalls, true);
			await runTitanSkinLeveling(settings, snapshot.titans, snapshot.inventory, resolved.options);
		}
		async function runAllTitanTrainerHotkeyTasks() {
			await runTitanArtifactHotkeyTask();
			await runTitanLevelHotkeyTask();
			await runTitanSkinHotkeyTask();
		}
		function registerDoYourBestTitanTasks() {
			const DoYourBestClass = getHeroWarsDoYourBestClass(HWHClasses);
			if (!DoYourBestClass) return;
			const RootDoYourBestClass = getDoYourBestRootBaseClass(DoYourBestClass);
			const doYourBestInstance = new DoYourBestClass();
			const currentTaskList = Array.isArray(doYourBestInstance.funcList) ? [...doYourBestInstance.funcList] : [];
			const taskDefinitions = buildTitanDoYourBestTaskDefinitions({
				handlers: {
					[TITAN_TRAINER_TAB_LEVELS]: runTitanLevelChecklistTask,
					[TITAN_TRAINER_TAB_ARTIFACTS]: runTitanArtifactChecklistTask,
					[TITAN_TRAINER_TAB_SKINS]: runTitanSkinChecklistTask
				},
				translate
			});
			const registrationState = buildTitanDoYourBestRegistrationState({
				currentFunctions: doYourBestInstance.functions,
				currentTaskList,
				readPlacement: (moduleKey) => readStoredDoYourBestPlacementSync(moduleKey),
				taskDefinitions
			});
			if (!registrationState.changed) return;
			class TitanDoYourBestExtension extends RootDoYourBestClass {
				constructor(...args) {
					super(...args);
					this.funcList = registrationState.taskList.map((task) => ({ ...task }));
					this.functions = { ...registrationState.functions };
				}
			}
			HWHClasses.doYourBest = TitanDoYourBestExtension;
		}
		async function openTitanTrainerSafely() {
			try {
				await openTitanTrainerMenu();
			} catch (error) {
				console.error("[TitanTrainer] Error:", error);
				const errorMessage = error instanceof Error ? error.message : translate("HWHTITANART_ERROR_GENERIC");
				showFinalProgress(`${translate("HWHTITANART_PROGRESS_ERROR")}<br>${escapeHtml(errorMessage)}`);
			}
		}
		const titanTrainerMenuButtonFactory = createScriptMenuButtonFactory({
			actionKey: TITAN_TRAINER_ACTION_KEY,
			color: "pink",
			icon: "hammer",
			getLabel: () => translate("HWHTITANTRAINER_BUTTON"),
			getTitle: () => translate("HWHTITANTRAINER_BUTTON_TITLE"),
			onClick: openTitanTrainerSafely,
			buildIconLabel
		});
		function createTitanTrainerMainMenuButton() {
			return titanTrainerMenuButtonFactory.createMainButton();
		}
		function createTitanTrainerOtherMenuButton() {
			return titanTrainerMenuButtonFactory.createOtherButton();
		}
		function syncTitanTrainerActionPlacement(settings = void 0) {
			syncStoredScriptMenuActionPlacement({
				HWHData,
				mainMenuButtons,
				othersPopupButtons,
				settings,
				settingsKey: "titanTrainerButtonPlacement",
				readStoredPlacement: readStoredTitanTrainerButtonPlacementSync,
				normalizePlacement: normalizeTitanTrainerButtonPlacement,
				persistPlacement: persistTitanTrainerButtonPlacementSync,
				mainKey: "hwhtitantrainer",
				actionKey: TITAN_TRAINER_ACTION_KEY,
				createMainButton: createTitanTrainerMainMenuButton,
				createOtherButton: createTitanTrainerOtherMenuButton,
				mainPlacementValue: TITAN_TRAINER_BUTTON_PLACEMENT_MAIN,
				otherPlacementValue: TITAN_TRAINER_BUTTON_PLACEMENT_OTHER
			});
		}
		function registerTitanTrainerAction() {
			syncTitanTrainerActionPlacement();
		}
		registerTitanTrainerHotkeys({
			readSettings: () => titanTrainerHotkeySettings,
			translate,
			openSettings: openTitanTrainerSafely,
			runAll: runAllTitanTrainerHotkeyTasks,
			runArtifacts: runTitanArtifactHotkeyTask,
			runLevels: runTitanLevelHotkeyTask,
			runSkins: runTitanSkinHotkeyTask
		});
		readSettings().catch((error) => {
			console.warn("[TitanTrainer] hotkey settings preload failed", error);
		});
		console.log(`%c${translate("HWHTITANART_START_LOG", {
			name: GM_info.script.name,
			author: GM_info.script.author,
			version: GM_info.script.version
		})}`, "color: #7fe3ba");
		addExtensionName(GM_info.script.name, GM_info.script.version, GM_info.script.author);
		registerDoYourBestTitanTasks();
		registerTitanTrainerAction();
	}
	//#endregion
	//#region src/entries/hwhtitanartifact-lite.user.ts
	initializeTitanArtifactLeveler(0);
	//#endregion
})();
