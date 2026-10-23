// ==UserScript==
// @name           HWH Shop Vacuum Lite
// @name:en        HWH Shop Vacuum Lite
// @namespace      http://tampermonkey.net/
// @version        1.3.226-lite.1
// @homepage       https://ext-askja.zingery.ru
// @updateURL      https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhvacuum-lite.meta.js
// @downloadURL    https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhvacuum-lite.user.js
// @supportURL     https://t.me/+ppLK1qqObB43NjMy
// @description    Облегчённый Shop Vacuum без Vue, анимаций, тем, иконок и игровой графики.
// @description:en Lightweight Shop Vacuum without Vue, animations, themes, icons, or game artwork.
// @author         Askja
// @match          https://www.hero-wars.com/*
// @match          https://www.hero-wars.cn/*
// @match          https://apps-1701433570146040.apps.fbsbx.com/*
// @icon           https://ext-askja.zingery.ru/script-icons/shopVacuum.webp
// @grant          none
// @license        MIT
// ==/UserScript==
/*
 * Читаемая сборка для GreasyFork: минификация кода и сжатие имён отключены.
 * Встроенные сторонние runtime-библиотеки: отсутствуют.
 */
(function() {
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
	function normalizeNumber(value, { minValue = Number.NEGATIVE_INFINITY, maxValue = Number.POSITIVE_INFINITY, fallbackValue = 0 } = {}) {
		const numericValue = parseNumberInputText(value, fallbackValue);
		if (!Number.isFinite(numericValue)) return fallbackValue;
		return Math.min(Math.max(numericValue, minValue), maxValue);
	}
	/**
	* Приводит значение к неотрицательному числу.
	*/
	function normalizeNonNegativeNumber(value, fallbackValue = 0) {
		return normalizeNumber(value, {
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
	function readCallError(callResult) {
		var _callResult$error;
		if (!isObjectLike(callResult)) return;
		const nestedResult = isObjectLike(callResult.result) ? callResult.result : void 0;
		return (_callResult$error = callResult.error) !== null && _callResult$error !== void 0 ? _callResult$error : nestedResult === null || nestedResult === void 0 ? void 0 : nestedResult.error;
	}
	function readCallPayload(callResult) {
		var _ref, _nestedResult$respons;
		if (!isObjectLike(callResult)) return callResult;
		const nestedResult = isObjectLike(callResult.result) ? callResult.result : void 0;
		return (_ref = (_nestedResult$respons = nestedResult === null || nestedResult === void 0 ? void 0 : nestedResult.response) !== null && _nestedResult$respons !== void 0 ? _nestedResult$respons : callResult.response) !== null && _ref !== void 0 ? _ref : callResult;
	}
	/**
	* Извлекает сообщение об ошибке из результата вызова API.
	* @param {Object} callResult
	* @param {string} [fallbackMessage=""]
	* @returns {string}
	*/
	function getCallResultErrorMessage(callResult, fallbackMessage = "") {
		return getErrorMessage(readCallError(callResult), fallbackMessage);
	}
	/**
	* Проверяет, успешен ли результат вызова API (нет ошибки, есть payload).
	* @param {Object} callResult
	* @param {{requirePayload?: boolean}} [options]
	* @returns {boolean}
	*/
	function isCallResultSucceeded(callResult, { requirePayload = true } = {}) {
		if (!callResult || readCallError(callResult)) return false;
		if (!requirePayload) return true;
		const payload = readCallPayload(callResult);
		return payload !== false && payload != null;
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
			var _hwhvacuumLite;
			const buildId = String((_hwhvacuumLite = "hwhvacuum-lite") !== null && _hwhvacuumLite !== void 0 ? _hwhvacuumLite : "").trim();
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
			progressSettings = normalizeSettings$1({
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
	//#region src/scripts/hwhvacuum/core/constants.ts
	var SETTINGS_KEY = "hwhVacuumSettings";
	var DO_YOUR_BEST_TASK_NAME = "hwhvacuumRunSelectedShops";
	var PET_COIN_BALANCE_KEYS = /* @__PURE__ */ new Set([`coin:25`, `petcoin:25`]);
	var SOUL_EXCHANGE_TYPES = [
		"titans",
		"heroes",
		"pets"
	];
	var ARTIFACT_FRAGMENT_SALE_TYPES = ["heroArtifactFragments", "titanArtifactFragments"];
	var EXCESS_EXCHANGE_TYPES = [...SOUL_EXCHANGE_TYPES, ...ARTIFACT_FRAGMENT_SALE_TYPES];
	var VACUUM_BUTTON_PLACEMENT_MAIN = "main";
	var VACUUM_BUTTON_PLACEMENT_OTHER = "other";
	var VACUUM_ACTION_KEY = "hwhShopVacuumAction";
	var CHECKLIST_ACTION_SHOPS = "shopPurchases";
	var CHECKLIST_ACTION_TYPES = [CHECKLIST_ACTION_SHOPS, ...EXCESS_EXCHANGE_TYPES];
	var HERO_ARTIFACT_FRAGMENT_INVENTORY_TYPES = [
		"fragmentArtifact",
		"fragmentHeroArtifact",
		"artifactFragment"
	];
	var TITAN_ARTIFACT_FRAGMENT_INVENTORY_TYPES = ["fragmentTitanArtifact"];
	var TITAN_ARTIFACT_SLOT_IDS = [
		0,
		1,
		2
	];
	var SHOP_IDS = [
		10,
		17,
		1,
		8,
		9,
		4,
		5,
		6
	];
	var CURRENCY_LIMIT_ORDER = [
		"gold:0",
		"coin:4",
		"coin:25",
		"coin:5",
		"coin:6",
		"coin:1",
		"coin:2",
		"coin:3"
	];
	var GEAR_REWARD_TYPES = /* @__PURE__ */ new Set([
		"gear",
		"scroll",
		"fragmentGear",
		"fragmentScroll"
	]);
	var SHOP_DEFINITIONS = {
		1: {
			nameKey: "HWHVACUUM_SHOP_CITY",
			currencyKey: "gold:0",
			icon: "shopping-bag",
			accentColor: "#ffd36e"
		},
		4: {
			nameKey: "HWHVACUUM_SHOP_ARENA",
			currencyKey: "coin:1",
			icon: "swords",
			accentColor: "#67c7ff"
		},
		5: {
			nameKey: "HWHVACUUM_SHOP_GRAND_ARENA",
			currencyKey: "coin:2",
			icon: "trophy",
			accentColor: "#ff8fd5"
		},
		6: {
			nameKey: "HWHVACUUM_SHOP_TOWER",
			currencyKey: "coin:3",
			icon: "shield",
			accentColor: "#8fdd7c"
		},
		8: {
			nameKey: "HWHVACUUM_SHOP_SOULS",
			currencyKey: "coin:5",
			icon: "sparkles",
			accentColor: "#d9a0ff"
		},
		9: {
			nameKey: "HWHVACUUM_SHOP_FRIENDSHIP",
			currencyKey: "coin:6",
			icon: "users",
			accentColor: "#ff7db8"
		},
		10: {
			nameKey: "HWHVACUUM_SHOP_OUTLAND",
			currencyKey: "coin:4",
			icon: "gem",
			accentColor: "#ff9c57"
		},
		17: {
			nameKey: "HWHVACUUM_SHOP_PETS",
			currencyKey: "coin:25",
			icon: "paw-print",
			accentColor: "#7fe3ba"
		}
	};
	var CURRENCY_DEFINITIONS = {
		"gold:0": {
			nameKey: "HWHVACUUM_CURRENCY_GOLD",
			icon: "coins",
			accentColor: "#ffd36e"
		},
		"coin:1": {
			nameKey: "HWHVACUUM_CURRENCY_ARENA",
			icon: "swords",
			accentColor: "#67c7ff"
		},
		"coin:2": {
			nameKey: "HWHVACUUM_CURRENCY_GRAND_ARENA",
			icon: "trophy",
			accentColor: "#ff8fd5"
		},
		"coin:3": {
			nameKey: "HWHVACUUM_CURRENCY_TOWER",
			icon: "shield",
			accentColor: "#8fdd7c"
		},
		"coin:4": {
			nameKey: "HWHVACUUM_CURRENCY_OUTLAND",
			icon: "gem",
			accentColor: "#ff9c57"
		},
		"coin:5": {
			nameKey: "HWHVACUUM_CURRENCY_SOULS",
			icon: "sparkles",
			accentColor: "#d9a0ff"
		},
		"coin:6": {
			nameKey: "HWHVACUUM_CURRENCY_FRIENDSHIP",
			icon: "users",
			accentColor: "#ff7db8"
		},
		"coin:25": {
			nameKey: "HWHVACUUM_CURRENCY_PETS",
			icon: "paw-print",
			accentColor: "#7fe3ba"
		}
	};
	var SHOP_OPTION_DEFINITIONS = {
		gear: {
			labelKey: "HWHVACUUM_BUY_GEAR",
			icon: "shirt",
			accentColor: "#f3d69f",
			defaultValue: true
		},
		soulStones: {
			labelKey: "HWHVACUUM_BUY_SOUL_STONES",
			icon: "sparkles",
			accentColor: "#d7b2ff",
			defaultValue: false
		},
		skinStoneChests: {
			labelKey: "HWHVACUUM_BUY_OUTLAND_SKIN_CHESTS",
			icon: "box",
			accentColor: "#ff9c57",
			defaultValue: false
		},
		xpSlot: {
			labelKey: "HWHVACUUM_BUY_SOUL_EXP_SLOT",
			icon: "flask",
			accentColor: "#9fd3ff",
			defaultValue: false
		},
		petPotionGold: {
			labelKey: "HWHVACUUM_BUY_PET_POTIONS_GOLD",
			icon: "flask",
			accentColor: "#7fe3ba",
			defaultValue: false
		},
		petSparkGold: {
			labelKey: "HWHVACUUM_BUY_PET_SPARKS_GOLD",
			icon: "sparkles",
			accentColor: "#ffd36e",
			defaultValue: false
		},
		petPotionCoins: {
			labelKey: "HWHVACUUM_BUY_PET_POTIONS_COINS",
			icon: "flask",
			accentColor: "#7fe3ba",
			defaultValue: false
		},
		petSparkCoins: {
			labelKey: "HWHVACUUM_BUY_PET_SPARKS_COINS",
			icon: "sparkles",
			accentColor: "#ffd36e",
			defaultValue: false
		}
	};
	var SOUL_EXCHANGE_DEFINITIONS = {
		heroes: {
			labelKey: "HWHVACUUM_EXCHANGE_HERO_SOULS",
			shortLabelKey: "HWHVACUUM_SOUL_TYPE_HEROES",
			infoLineKey: "HWHVACUUM_SOUL_EXCHANGE_INFO_LINE",
			infoTotalKey: "HWHVACUUM_SOUL_EXCHANGE_INFO_TOTAL",
			icon: "users",
			accentColor: "#d7b2ff",
			coinKey: `coin:5`,
			coinId: 5,
			call: {
				name: "inventoryExchangeStones",
				args: {},
				ident: "group_1_body"
			}
		},
		titans: {
			labelKey: "HWHVACUUM_EXCHANGE_TITAN_SOULS",
			shortLabelKey: "HWHVACUUM_SOUL_TYPE_TITANS",
			infoLineKey: "HWHVACUUM_SOUL_EXCHANGE_INFO_LINE",
			infoTotalKey: "HWHVACUUM_SOUL_EXCHANGE_INFO_TOTAL",
			icon: "shield",
			accentColor: "#9fd3ff",
			coinKey: `coin:15`,
			coinId: 15,
			call: {
				name: "inventoryExchangeTitanStones",
				args: {},
				ident: "body"
			}
		},
		pets: {
			labelKey: "HWHVACUUM_EXCHANGE_PET_SOULS",
			shortLabelKey: "HWHVACUUM_SOUL_TYPE_PETS",
			infoLineKey: "HWHVACUUM_SOUL_EXCHANGE_INFO_LINE",
			infoTotalKey: "HWHVACUUM_SOUL_EXCHANGE_INFO_TOTAL",
			icon: "paw-print",
			accentColor: "#7fe3ba",
			coinKey: `coin:25`,
			coinId: 25,
			executeWithoutCandidates: true,
			call: {
				name: "inventoryExchangePetStones",
				args: {},
				ident: "body"
			}
		}
	};
	var ARTIFACT_FRAGMENT_SALE_DEFINITIONS = {
		heroArtifactFragments: {
			labelKey: "HWHVACUUM_SELL_HERO_ARTIFACT_FRAGMENTS",
			shortLabelKey: "HWHVACUUM_ARTIFACT_FRAGMENT_TYPE_HEROES",
			infoLineKey: "HWHVACUUM_ARTIFACT_FRAGMENT_SALE_INFO_LINE",
			infoTotalKey: "HWHVACUUM_ARTIFACT_FRAGMENT_SALE_INFO_TOTAL",
			icon: "package",
			accentColor: "#f7c873",
			inventorySellType: "artifact",
			inventoryTypes: HERO_ARTIFACT_FRAGMENT_INVENTORY_TYPES
		},
		titanArtifactFragments: {
			labelKey: "HWHVACUUM_SELL_TITAN_ARTIFACT_FRAGMENTS",
			shortLabelKey: "HWHVACUUM_ARTIFACT_FRAGMENT_TYPE_TITANS",
			infoLineKey: "HWHVACUUM_ARTIFACT_FRAGMENT_SALE_INFO_LINE",
			infoTotalKey: "HWHVACUUM_ARTIFACT_FRAGMENT_SALE_INFO_TOTAL",
			icon: "shield",
			accentColor: "#9fd3ff",
			inventorySellType: "titanArtifact",
			inventoryTypes: TITAN_ARTIFACT_FRAGMENT_INVENTORY_TYPES
		}
	};
	var I18N_EN = {
		HWHVACUUM_START_LOG: "Starting extension {name} by {author} (v.{version})",
		HWHVACUUM_BUTTON: "Shop Vacuum",
		HWHVACUUM_BUTTON_TITLE: "Buys configured shop slots so you can skip the evening click marathon.",
		HWHVACUUM_TITLE: "Shop vacuum settings",
		HWHVACUUM_SETTINGS_HEADER_META: "v.{version} · {author}",
		HWHVACUUM_SETTINGS_STATUS_READY: "Ready",
		HWHVACUUM_RUN: "Start vacuum",
		HWHVACUUM_SAVE: "Save",
		HWHVACUUM_CLOSE: "Close",
		HWHVACUUM_ENABLE_ALL_SHOPS: "Enable shops",
		HWHVACUUM_DISABLE_ALL_SHOPS: "Disable shops",
		HWHVACUUM_SYNC_AFTER_RUN: "Run synchronization after work",
		HWHVACUUM_SYNC_AFTER_RUN_HINT: "Refreshes game data after the run, so balances and shop shelves are current.",
		HWHVACUUM_CURRENCY_LIMITS: "Currency limits",
		HWHVACUUM_CURRENCY_LIMIT_HINT: "Minimum balance to keep. Set 0 to let the Vacuum spend all of this currency.",
		HWHVACUUM_SHOP_FILTERS: "Available shops",
		HWHVACUUM_ENABLED_SHOP_HINT: "Lets the Vacuum process this shop. The shop section controls what it may buy.",
		HWHVACUUM_SHOP_PURCHASE_HINT: "Buys this category only in an enabled shop and only above the currency limit.",
		HWHVACUUM_TECH_SECTION: "Additional",
		HWHVACUUM_DONATE_TITLE: "Project support",
		HWHVACUUM_DONATE_TEXT: "Direct transfer to an Alfa Bank card. No wallet relay, no mystery payment circus.",
		HWHVACUUM_DONATE_WALLET: "Alfa Bank card: {wallet}",
		HWHVACUUM_DONATE_QR_ALT: "Donation QR code",
		HWHVACUUM_DONATE_QR_LABEL: "Bank transfer",
		HWHVACUUM_DOCS_TITLE: "Documentation",
		HWHVACUUM_DOCS_TEXT: "Useful links for setup, mirrors and the shared UI kit.",
		HWHVACUUM_DOCS_PRIMARY: "Documentation",
		HWHVACUUM_DOCS_MIRROR: "Mirror {number}",
		HWHVACUUM_DUMP_LIBRARY: "Game library",
		HWHVACUUM_DUMP_LIBRARY_TITLE: "Print Hero Wars runtime and library objects to the console.",
		HWHVACUUM_INTERFACE_SECTION: "Information panel",
		HWHVACUUM_INTERFACE_SETTINGS_SECTION: "Interface settings",
		HWHVACUUM_UI_THEME: "Interface theme",
		HWHVACUUM_UI_THEME_HINT: "Changes the Vacuum window theme and previews it before applying.",
		HWHVACUUM_BUTTON_PLACEMENT_LABEL: "Vacuum button",
		HWHVACUUM_BUTTON_PLACEMENT_HINT: "Chooses the Hero Wars Helper menu that contains the Vacuum button.",
		HWHVACUUM_BUTTON_PLACEMENT_MAIN: "Main menu",
		HWHVACUUM_BUTTON_PLACEMENT_OTHER: "Other menu",
		HWHVACUUM_SOUL_EXCHANGE_SECTION: "Excess exchange",
		HWHVACUUM_SOUL_EXCHANGE_GROUP: "Soul exchange",
		HWHVACUUM_EXCHANGE_HERO_SOULS: "Exchange excess hero souls for coins",
		HWHVACUUM_EXCHANGE_TITAN_SOULS: "Exchange excess titan souls for coins",
		HWHVACUUM_EXCHANGE_PET_SOULS: "Exchange excess pet souls for coins",
		HWHVACUUM_SOUL_EXCHANGE_HINT: "Exchanges soul stones only for fully evolved heroes, titans or pets.",
		HWHVACUUM_ARTIFACT_FRAGMENT_SALE_SECTION: "Artifact fragment sale",
		HWHVACUUM_SELL_HERO_ARTIFACT_FRAGMENTS: "Sell surplus hero artifact fragments",
		HWHVACUUM_SELL_TITAN_ARTIFACT_FRAGMENTS: "Sell surplus titan artifact fragments",
		HWHVACUUM_ARTIFACT_FRAGMENT_SALE_HINT: "Sells only fragments that are not needed for the next artifact evolution steps.",
		HWHVACUUM_ARTIFACT_FRAGMENT_TYPE_HEROES: "Hero artifacts",
		HWHVACUUM_ARTIFACT_FRAGMENT_TYPE_TITANS: "Titan artifacts",
		HWHVACUUM_SOUL_EXCHANGE_CHECKLIST_TYPES: "Exchange/sale in Do all",
		HWHVACUUM_SOUL_EXCHANGE_INFO_EMPTY: "No exchangeable excess found right now.",
		HWHVACUUM_SOUL_EXCHANGE_INFO_LINE: "{name}: {amount} stones",
		HWHVACUUM_SOUL_EXCHANGE_INFO_TOTAL: "{count} targets, {amount} stones",
		HWHVACUUM_ARTIFACT_FRAGMENT_SALE_INFO_LINE: "{name}: {amount} fragments",
		HWHVACUUM_ARTIFACT_FRAGMENT_SALE_INFO_TOTAL: "{count} types, {amount} surplus",
		HWHVACUUM_SOUL_EXCHANGE_MULTI_PLACEHOLDER: "Nothing selected",
		HWHVACUUM_SOUL_EXCHANGE_MULTI_SELECTED: "{count} selected",
		HWHVACUUM_SOUL_EXCHANGE_MULTI_SEARCH: "Search",
		HWHVACUUM_SOUL_EXCHANGE_MULTI_ALL: "All",
		HWHVACUUM_SOUL_EXCHANGE_MULTI_CLEAR: "Reset",
		HWHVACUUM_CHECKLIST_ACTIONS: "Actions in Do all",
		HWHVACUUM_CHECKLIST_ACTION_SHOPS: "Buy selected shop slots",
		HWHVACUUM_SOUL_EXCHANGE_PROGRESS: "Processing exchange and sale.",
		HWHVACUUM_SUMMARY_SOUL_EXCHANGE: "Exchange and sale",
		HWHVACUUM_SUMMARY_SOUL_EXCHANGE_ROW: "{name}: +{amount} coins",
		HWHVACUUM_SUMMARY_ARTIFACT_FRAGMENT_SALE_ROW: "{group}: {name} x{amount}{reward}",
		HWHVACUUM_SUMMARY_REWARD_SUFFIX: " (+{reward})",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_HEADER: "Do all checkbox",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_LABEL: "Checkbox position",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_NONE: "Do not add",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_END: "At the bottom",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_BEFORE: "Before: {label}",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_AFTER: "After: {label}",
		HWHVACUUM_EXPORT_SETTINGS: "Export settings",
		HWHVACUUM_IMPORT_SETTINGS: "Import settings",
		HWHVACUUM_TRANSFER_SETTINGS: "Settings",
		HWHVACUUM_TRANSFER_SETTINGS_TITLE: "Shop Vacuum settings block.",
		HWHVACUUM_TRANSFER_SHOPS: "Shops and limits",
		HWHVACUUM_TRANSFER_SHOPS_TITLE: "Enabled shops, purchase filters and currency limits.",
		HWHVACUUM_TRANSFER_EXCHANGE: "Exchange and sale",
		HWHVACUUM_TRANSFER_EXCHANGE_TITLE: "Soul exchange and artifact fragment sale options.",
		HWHVACUUM_TRANSFER_INTERFACE: "Interface and actions",
		HWHVACUUM_TRANSFER_INTERFACE_TITLE: "Interface, progress window and Do all settings.",
		HWHVACUUM_TRANSFER_FILE_LABEL: "JSON file",
		HWHVACUUM_TRANSFER_SEARCH: "Search",
		HWHVACUUM_TRANSFER_CLEAR_SEARCH: "Clear search",
		HWHVACUUM_TRANSFER_EMPTY: "Nothing found",
		HWHVACUUM_TRANSFER_SELECT_ALL: "Select all",
		HWHVACUUM_TRANSFER_CLEAR_ALL: "Clear all",
		HWHVACUUM_TRANSFER_SORT: "Sort",
		HWHVACUUM_TRANSFER_SORT_BY_NAME: "By name",
		HWHVACUUM_TRANSFER_SORT_SELECTED: "Selected first",
		HWHVACUUM_TRANSFER_SORT_ASC: "Ascending",
		HWHVACUUM_TRANSFER_SORT_DESC: "Descending",
		HWHVACUUM_FEEDBACK: "Feedback",
		HWHVACUUM_FEEDBACK_TEXT: "If you have problems not covered in the documentation, or a suggestion, please message me in",
		HWHVACUUM_PROGRESS_AUTO_HIDE_RESULT: "Hide result window by timeout",
		HWHVACUUM_PROGRESS_AUTO_HIDE_TIMEOUT: "Result timeout, ms",
		HWHVACUUM_PROGRESS_WINDOW_SECTION: "Information panel",
		HWHVACUUM_PROGRESS_HINT: "Changes only the result window display; it does not affect Vacuum actions.",
		HWHVACUUM_PROGRESS_POSITION: "Result window position",
		HWHVACUUM_PROGRESS_POSITION_TOP_CENTER: "Top center",
		HWHVACUUM_PROGRESS_POSITION_TOP_RIGHT: "Top right",
		HWHVACUUM_PROGRESS_POSITION_BOTTOM_RIGHT: "Bottom right",
		HWHVACUUM_PROGRESS_STYLE: "Result window style",
		HWHVACUUM_PROGRESS_STYLE_DEFAULT: "Default",
		HWHVACUUM_PROGRESS_STYLE_COMPACT: "Compact",
		HWHVACUUM_PROGRESS_STYLE_DASHBOARD: "Panel",
		HWHVACUUM_ACCORDION_AUTO_SCROLL_MODE: "Accordion auto-scroll",
		HWHVACUUM_INTERFACE_CONTROL_HINT: "Changes only how the settings interface behaves and looks, not purchases.",
		HWHVACUUM_ACCORDION_AUTO_SCROLL_OFF: "Off",
		HWHVACUUM_ACCORDION_AUTO_SCROLL_INSTANT: "Instant",
		HWHVACUUM_ACCORDION_AUTO_SCROLL_SMOOTH: "Smooth",
		HWHVACUUM_REORDER_LIST_VARIANT: "Reorder controls",
		HWHVACUUM_REORDER_LIST_VARIANT_FULL: "Full",
		HWHVACUUM_REORDER_LIST_VARIANT_MINIMAL: "Minimal",
		HWHVACUUM_POST_SYNC_DONE: "Synchronization done.",
		HWHVACUUM_POST_SYNC_FAILED: "Synchronization did not finish. The console has the useful details.",
		HWHVACUUM_DO_YOUR_BEST: "Shop vacuum",
		HWHVACUUM_DO_YOUR_BEST_HINT: "Configures the Vacuum checkbox and available actions in Do all.",
		HWHVACUUM_PROGRESS_PREPARE: "Checking shop shelves and balances before spending anything.",
		HWHVACUUM_PROGRESS_RUNNING: "Buying {count} shop slots and counting coins.",
		HWHVACUUM_PROGRESS_DONE: "Done. Bought {count} slots and left the rest alone.",
		HWHVACUUM_PROGRESS_NOTHING: "Nothing to buy in selected shops. The settings did their job.",
		HWHVACUUM_PROGRESS_ERROR: "Purchases failed. The console has the reason.",
		HWHVACUUM_SUMMARY_PURCHASES: "Purchases by shop",
		HWHVACUUM_SUMMARY_SPENT: "Spent",
		HWHVACUUM_SUMMARY_FAILED: "Failed purchases",
		HWHVACUUM_SUMMARY_EMPTY_PURCHASES: "Nothing was bought. No impulse shopping today.",
		HWHVACUUM_SUMMARY_EMPTY_SPENT: "Nothing spent. The wallet can breathe.",
		HWHVACUUM_SUMMARY_SPENT_CURRENCY: "{name} -{spent} ({left})",
		HWHVACUUM_SETTINGS_EXPORT_DONE: "Settings exported to JSON.",
		HWHVACUUM_SETTINGS_IMPORT_DONE: "Settings imported.",
		HWHVACUUM_SETTINGS_IMPORT_INVALID: "This JSON is not a HWH Shop Vacuum settings export.",
		HWHVACUUM_SETTINGS_IMPORT_PARSE_ERROR: "Could not parse settings JSON.",
		HWHVACUUM_SETTINGS_IMPORT_ERROR: "Import failed: {message}",
		HWHVACUUM_SETTINGS_SAVED: "Settings saved.",
		HWHVACUUM_ACCORDION_FILTER_ACTIVE: "On: {count}",
		HWHVACUUM_ACCORDION_FILTER_INACTIVE: "Off: {count}",
		HWHVACUUM_ACCORDION_FILTER_EMPTY: "No matches.",
		HWHVACUUM_BUY_GEAR: "Buy gear",
		HWHVACUUM_BUY_SOUL_STONES: "Buy soul stones",
		HWHVACUUM_BUY_OUTLAND_SKIN_CHESTS: "Buy skin stone chests",
		HWHVACUUM_BUY_SOUL_EXP_SLOT: "Buy experience slot",
		HWHVACUUM_BUY_PET_POTIONS_GOLD: "Buy pet potions for gold",
		HWHVACUUM_BUY_PET_SPARKS_GOLD: "Buy sparks for gold",
		HWHVACUUM_BUY_PET_POTIONS_COINS: "Buy pet potions for pet coins",
		HWHVACUUM_BUY_PET_SPARKS_COINS: "Buy sparks for pet coins",
		HWHVACUUM_CURRENCY_GOLD: "Gold",
		HWHVACUUM_CURRENCY_ARENA: "Arena coins",
		HWHVACUUM_CURRENCY_GRAND_ARENA: "Grand Arena coins",
		HWHVACUUM_CURRENCY_TOWER: "Tower coins",
		HWHVACUUM_CURRENCY_SOULS: "Soul coins",
		HWHVACUUM_CURRENCY_FRIENDSHIP: "Friendship coins",
		HWHVACUUM_CURRENCY_OUTLAND: "Outland coins",
		HWHVACUUM_CURRENCY_PETS: "Pet coins",
		HWHVACUUM_CURRENCY_GENERIC: "Currency {id}",
		HWHVACUUM_SHOP_CITY: "City Shop",
		HWHVACUUM_SHOP_ARENA: "Arena Shop",
		HWHVACUUM_SHOP_GRAND_ARENA: "Grand Arena Shop",
		HWHVACUUM_SHOP_TOWER: "Tower Shop",
		HWHVACUUM_SHOP_SOULS: "Soul Shop",
		HWHVACUUM_SHOP_FRIENDSHIP: "Friendship Shop",
		HWHVACUUM_SHOP_OUTLAND: "Outland Shop",
		HWHVACUUM_SHOP_PETS: "Pet Shop",
		HWHVACUUM_SOUL_TYPE_HEROES: "Hero souls",
		HWHVACUUM_SOUL_TYPE_TITANS: "Titan souls",
		HWHVACUUM_SOUL_TYPE_PETS: "Pet souls",
		HWHVACUUM_ITEM_GEAR: "Gear",
		HWHVACUUM_ITEM_SCROLL: "Scroll",
		HWHVACUUM_ITEM_CONSUMABLE: "Consumable",
		HWHVACUUM_ITEM_FRAGMENT_TEMPLATE: "Fragment {name}",
		HWHVACUUM_ITEM_HERO_SOUL_TEMPLATE: "{name} Soul Stone",
		HWHVACUUM_ITEM_SKIN_STONE_CHEST: "Skin stone chest",
		HWHVACUUM_ITEM_GENERIC: "Item {id}",
		HWHVACUUM_ERROR_GENERIC: "Something went wrong. Check the console for the reason."
	};
	var I18N_RU = {
		HWHVACUUM_START_LOG: "Старт расширения {name} от {author} (v.{version})",
		HWHVACUUM_BUTTON: "Пылесос",
		HWHVACUUM_BUTTON_TITLE: "Скупает настроенные слоты магазинов, чтобы ты не устраивал вечерний кликер-марафон.",
		HWHVACUUM_TITLE: "Настройки пылесоса",
		HWHVACUUM_SETTINGS_HEADER_META: "v.{version} · {author}",
		HWHVACUUM_SETTINGS_STATUS_READY: "Готов к работе",
		HWHVACUUM_RUN: "Запустить пылесос",
		HWHVACUUM_SAVE: "Сохранить",
		HWHVACUUM_CLOSE: "Закрыть",
		HWHVACUUM_ENABLE_ALL_SHOPS: "Включить магазины",
		HWHVACUUM_DISABLE_ALL_SHOPS: "Отключить магазины",
		HWHVACUUM_SYNC_AFTER_RUN: "Запускать синхронизацию после работы",
		HWHVACUUM_SYNC_AFTER_RUN_HINT: "После выполнения обновляет данные игры, чтобы остатки и витрины были актуальны.",
		HWHVACUUM_CURRENCY_LIMITS: "Лимиты валют",
		HWHVACUUM_CURRENCY_LIMIT_HINT: "Минимум этой валюты, который Пылесос не тратит. 0 — разрешить тратить всё.",
		HWHVACUUM_SHOP_FILTERS: "Доступные магазины",
		HWHVACUUM_ENABLED_SHOP_HINT: "Разрешает обрабатывать этот магазин. Что покупать, задаётся в его разделе.",
		HWHVACUUM_SHOP_PURCHASE_HINT: "Покупает эту категорию только во включённом магазине и выше лимита валюты.",
		HWHVACUUM_TECH_SECTION: "Дополнительно",
		HWHVACUUM_DONATE_TITLE: "Поддержка проекта",
		HWHVACUUM_DONATE_TEXT: "Прямой перевод на карту Альфа-Банка. Без старого кошелька и платежного цирка.",
		HWHVACUUM_DONATE_WALLET: "Карта Альфа-Банка: {wallet}",
		HWHVACUUM_DONATE_QR_ALT: "QR-код для доната",
		HWHVACUUM_DONATE_QR_LABEL: "Банковский перевод",
		HWHVACUUM_DOCS_TITLE: "Документация",
		HWHVACUUM_DOCS_TEXT: "Полезные ссылки по установке, зеркалам и общему UI kit.",
		HWHVACUUM_DOCS_PRIMARY: "Документация",
		HWHVACUUM_DOCS_MIRROR: "Зеркало {number}",
		HWHVACUUM_DUMP_LIBRARY: "Игровая библиотека",
		HWHVACUUM_DUMP_LIBRARY_TITLE: "Вывести runtime Hero Wars и игровые библиотеки в консоль.",
		HWHVACUUM_INTERFACE_SECTION: "Информационная панель",
		HWHVACUUM_INTERFACE_SETTINGS_SECTION: "Настройки интерфейса",
		HWHVACUUM_UI_THEME: "Тема интерфейса",
		HWHVACUUM_UI_THEME_HINT: "Меняет тему окна Пылесоса и показывает её до применения.",
		HWHVACUUM_BUTTON_PLACEMENT_LABEL: "Кнопка «Пылесос»",
		HWHVACUUM_BUTTON_PLACEMENT_HINT: "Выбирает меню Hero Wars Helper, в котором будет кнопка «Пылесос».",
		HWHVACUUM_BUTTON_PLACEMENT_MAIN: "Основное меню",
		HWHVACUUM_BUTTON_PLACEMENT_OTHER: "Разное",
		HWHVACUUM_SOUL_EXCHANGE_SECTION: "Обмен лишнего",
		HWHVACUUM_SOUL_EXCHANGE_GROUP: "Обмен душ",
		HWHVACUUM_EXCHANGE_HERO_SOULS: "Обменивать лишние души героев на монеты",
		HWHVACUUM_EXCHANGE_TITAN_SOULS: "Обменивать лишние души титанов на монеты",
		HWHVACUUM_EXCHANGE_PET_SOULS: "Обменивать лишние души питомцев на монеты",
		HWHVACUUM_SOUL_EXCHANGE_HINT: "Обменивает души только у героев, титанов или питомцев с максимальной эволюцией.",
		HWHVACUUM_ARTIFACT_FRAGMENT_SALE_SECTION: "Продажа фрагментов артефактов",
		HWHVACUUM_SELL_HERO_ARTIFACT_FRAGMENTS: "Продавать лишние фрагменты артефактов героев",
		HWHVACUUM_SELL_TITAN_ARTIFACT_FRAGMENTS: "Продавать лишние фрагменты артефактов титанов",
		HWHVACUUM_ARTIFACT_FRAGMENT_SALE_HINT: "Продаёт только фрагменты, которые не нужны для следующих шагов эволюции артефактов.",
		HWHVACUUM_ARTIFACT_FRAGMENT_TYPE_HEROES: "Артефакты героев",
		HWHVACUUM_ARTIFACT_FRAGMENT_TYPE_TITANS: "Артефакты титанов",
		HWHVACUUM_SOUL_EXCHANGE_CHECKLIST_TYPES: "Обмен/продажа в «Сделать всё»",
		HWHVACUUM_SOUL_EXCHANGE_INFO_EMPTY: "Сейчас лишнего для обмена или продажи не нашли.",
		HWHVACUUM_SOUL_EXCHANGE_INFO_LINE: "{name}: {amount} камней",
		HWHVACUUM_SOUL_EXCHANGE_INFO_TOTAL: "{count} целей, {amount} камней",
		HWHVACUUM_ARTIFACT_FRAGMENT_SALE_INFO_LINE: "{name}: {amount} фрагм.",
		HWHVACUUM_ARTIFACT_FRAGMENT_SALE_INFO_TOTAL: "{count} типов, лишних {amount}",
		HWHVACUUM_SOUL_EXCHANGE_MULTI_PLACEHOLDER: "Ничего не выбрано",
		HWHVACUUM_SOUL_EXCHANGE_MULTI_SELECTED: "Выбрано: {count}",
		HWHVACUUM_SOUL_EXCHANGE_MULTI_SEARCH: "Поиск",
		HWHVACUUM_SOUL_EXCHANGE_MULTI_ALL: "Все",
		HWHVACUUM_SOUL_EXCHANGE_MULTI_CLEAR: "Сброс",
		HWHVACUUM_CHECKLIST_ACTIONS: "Действия в «Сделать всё»",
		HWHVACUUM_CHECKLIST_ACTION_SHOPS: "Скупать выбранные слоты магазинов",
		HWHVACUUM_SOUL_EXCHANGE_PROGRESS: "Обрабатываем обмен и продажу.",
		HWHVACUUM_SUMMARY_SOUL_EXCHANGE: "Обмен и продажа",
		HWHVACUUM_SUMMARY_SOUL_EXCHANGE_ROW: "{name}: +{amount} монет",
		HWHVACUUM_SUMMARY_ARTIFACT_FRAGMENT_SALE_ROW: "{group}: {name} x{amount}{reward}",
		HWHVACUUM_SUMMARY_REWARD_SUFFIX: " (+{reward})",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_HEADER: "Галочка «Сделать всё»",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_LABEL: "Куда поставить галочку",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_NONE: "Не добавлять",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_END: "В конец",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_BEFORE: "Перед: {label}",
		HWHVACUUM_DO_YOUR_BEST_PLACEMENT_AFTER: "После: {label}",
		HWHVACUUM_EXPORT_SETTINGS: "Экспорт настроек",
		HWHVACUUM_IMPORT_SETTINGS: "Импорт настроек",
		HWHVACUUM_TRANSFER_SETTINGS: "Настройки",
		HWHVACUUM_TRANSFER_SETTINGS_TITLE: "Блок настроек Shop Vacuum.",
		HWHVACUUM_TRANSFER_SHOPS: "Магазины и лимиты",
		HWHVACUUM_TRANSFER_SHOPS_TITLE: "Включённые магазины, фильтры покупок и лимиты валют.",
		HWHVACUUM_TRANSFER_EXCHANGE: "Обмен и продажа",
		HWHVACUUM_TRANSFER_EXCHANGE_TITLE: "Обмен душ и продажа фрагментов артефактов.",
		HWHVACUUM_TRANSFER_INTERFACE: "Интерфейс и действия",
		HWHVACUUM_TRANSFER_INTERFACE_TITLE: "Интерфейс, окно результата и настройки «Сделать всё».",
		HWHVACUUM_TRANSFER_FILE_LABEL: "JSON файл",
		HWHVACUUM_TRANSFER_SEARCH: "Поиск",
		HWHVACUUM_TRANSFER_CLEAR_SEARCH: "Очистить поиск",
		HWHVACUUM_TRANSFER_EMPTY: "Ничего не найдено",
		HWHVACUUM_TRANSFER_SELECT_ALL: "Выбрать всё",
		HWHVACUUM_TRANSFER_CLEAR_ALL: "Снять всё",
		HWHVACUUM_TRANSFER_SORT: "Сортировка",
		HWHVACUUM_TRANSFER_SORT_BY_NAME: "По названию",
		HWHVACUUM_TRANSFER_SORT_SELECTED: "Выбранные сверху",
		HWHVACUUM_TRANSFER_SORT_ASC: "По возрастанию",
		HWHVACUUM_TRANSFER_SORT_DESC: "По убыванию",
		HWHVACUUM_FEEDBACK: "Обратная связь",
		HWHVACUUM_FEEDBACK_TEXT: "Если у Вас возникли проблемы не описанные в документации, или же есть пожелание, просьба отписать мне в",
		HWHVACUUM_PROGRESS_AUTO_HIDE_RESULT: "Скрывать окно результата по таймауту",
		HWHVACUUM_PROGRESS_AUTO_HIDE_TIMEOUT: "Таймаут результата, мс",
		HWHVACUUM_PROGRESS_WINDOW_SECTION: "Информационная панель",
		HWHVACUUM_PROGRESS_HINT: "Меняет только показ окна результата и не влияет на действия Пылесоса.",
		HWHVACUUM_PROGRESS_POSITION: "Положение окна результата",
		HWHVACUUM_PROGRESS_POSITION_TOP_CENTER: "Сверху по центру",
		HWHVACUUM_PROGRESS_POSITION_TOP_RIGHT: "Правый верхний угол",
		HWHVACUUM_PROGRESS_POSITION_BOTTOM_RIGHT: "Правый нижний угол",
		HWHVACUUM_PROGRESS_STYLE: "Стиль окна результата",
		HWHVACUUM_PROGRESS_STYLE_DEFAULT: "Обычный",
		HWHVACUUM_PROGRESS_STYLE_COMPACT: "Компактный",
		HWHVACUUM_PROGRESS_STYLE_DASHBOARD: "Панель",
		HWHVACUUM_ACCORDION_AUTO_SCROLL_MODE: "Автоскролл аккордеонов",
		HWHVACUUM_INTERFACE_CONTROL_HINT: "Меняет только поведение и вид интерфейса, не влияет на покупки.",
		HWHVACUUM_ACCORDION_AUTO_SCROLL_OFF: "Выключен",
		HWHVACUUM_ACCORDION_AUTO_SCROLL_INSTANT: "Мгновенный",
		HWHVACUUM_ACCORDION_AUTO_SCROLL_SMOOTH: "Плавный",
		HWHVACUUM_REORDER_LIST_VARIANT: "Кнопки сортировки списков",
		HWHVACUUM_REORDER_LIST_VARIANT_FULL: "Полный",
		HWHVACUUM_REORDER_LIST_VARIANT_MINIMAL: "Минимальный",
		HWHVACUUM_POST_SYNC_DONE: "Синхронизация выполнена.",
		HWHVACUUM_POST_SYNC_FAILED: "Синхронизация не доехала. Подробности в консоли, без гадания по скриншотам.",
		HWHVACUUM_DO_YOUR_BEST: "Пылесос",
		HWHVACUUM_DO_YOUR_BEST_HINT: "Настраивает галочку Пылесоса и доступные действия в «Сделать всё».",
		HWHVACUUM_PROGRESS_PREPARE: "Проверяем витрины и остатки. Сейчас поймём, где игра снова просит лишнего.",
		HWHVACUUM_PROGRESS_RUNNING: "Покупаем {count} лотов. Монеты считаем, паники не устраиваем.",
		HWHVACUUM_PROGRESS_DONE: "Готово: купили {count} лотов, лишнего не трогали.",
		HWHVACUUM_PROGRESS_NOTHING: "Покупать нечего: либо всё уже взято, либо настройки наконец-то сдержали аппетит.",
		HWHVACUUM_PROGRESS_ERROR: "Покупки сорвались. Консоль уже держит детали.",
		HWHVACUUM_SUMMARY_PURCHASES: "Покупки по магазинам",
		HWHVACUUM_SUMMARY_SPENT: "Потратили",
		HWHVACUUM_SUMMARY_FAILED: "Не купилось",
		HWHVACUUM_SUMMARY_EMPTY_PURCHASES: "Покупок нет. Значит, сегодня без импульсивного шопинга.",
		HWHVACUUM_SUMMARY_EMPTY_SPENT: "Траты ноль. Кошелёк выдохнул.",
		HWHVACUUM_SUMMARY_SPENT_CURRENCY: "{name} -{spent} ({left})",
		HWHVACUUM_SETTINGS_EXPORT_DONE: "Настройки выгружены в JSON.",
		HWHVACUUM_SETTINGS_IMPORT_DONE: "Настройки импортированы.",
		HWHVACUUM_SETTINGS_IMPORT_INVALID: "Этот JSON не похож на экспорт настроек HWH Shop Vacuum.",
		HWHVACUUM_SETTINGS_IMPORT_PARSE_ERROR: "JSON с настройками не читается.",
		HWHVACUUM_SETTINGS_IMPORT_ERROR: "Импорт упал: {message}",
		HWHVACUUM_SETTINGS_SAVED: "Настройки сохранены.",
		HWHVACUUM_ACCORDION_FILTER_ACTIVE: "Вкл: {count}",
		HWHVACUUM_ACCORDION_FILTER_INACTIVE: "Выкл: {count}",
		HWHVACUUM_ACCORDION_FILTER_EMPTY: "По фильтру ничего не нашлось.",
		HWHVACUUM_BUY_GEAR: "Покупать шмот",
		HWHVACUUM_BUY_SOUL_STONES: "Покупать камни душ",
		HWHVACUUM_BUY_OUTLAND_SKIN_CHESTS: "Покупать ящики камней облика",
		HWHVACUUM_BUY_SOUL_EXP_SLOT: "Покупать слот с опытом",
		HWHVACUUM_BUY_PET_POTIONS_GOLD: "Покупать зелья питомцев за золото",
		HWHVACUUM_BUY_PET_SPARKS_GOLD: "Покупать искры за золото",
		HWHVACUUM_BUY_PET_POTIONS_COINS: "Покупать зелья питомцев за монеты питомцев",
		HWHVACUUM_BUY_PET_SPARKS_COINS: "Покупать искры за монеты питомцев",
		HWHVACUUM_CURRENCY_GOLD: "Золото",
		HWHVACUUM_CURRENCY_ARENA: "Монеты арены",
		HWHVACUUM_CURRENCY_GRAND_ARENA: "Монеты гранд-арены",
		HWHVACUUM_CURRENCY_TOWER: "Монеты башни",
		HWHVACUUM_CURRENCY_SOULS: "Монеты душ",
		HWHVACUUM_CURRENCY_FRIENDSHIP: "Монеты дружбы",
		HWHVACUUM_CURRENCY_OUTLAND: "Монеты Запределья",
		HWHVACUUM_CURRENCY_PETS: "Монеты питомцев",
		HWHVACUUM_CURRENCY_GENERIC: "Валюта {id}",
		HWHVACUUM_SHOP_CITY: "Городская лавка",
		HWHVACUUM_SHOP_ARENA: "Лавка арены",
		HWHVACUUM_SHOP_GRAND_ARENA: "Лавка гранд-арены",
		HWHVACUUM_SHOP_TOWER: "Лавка башни",
		HWHVACUUM_SHOP_SOULS: "Лавка душ",
		HWHVACUUM_SHOP_FRIENDSHIP: "Лавка дружбы",
		HWHVACUUM_SHOP_OUTLAND: "Лавка Запределья",
		HWHVACUUM_SHOP_PETS: "Лавка питомцев",
		HWHVACUUM_SOUL_TYPE_HEROES: "Души героев",
		HWHVACUUM_SOUL_TYPE_TITANS: "Души титанов",
		HWHVACUUM_SOUL_TYPE_PETS: "Души питомцев",
		HWHVACUUM_ITEM_GEAR: "Шмотка",
		HWHVACUUM_ITEM_SCROLL: "Свиток",
		HWHVACUUM_ITEM_CONSUMABLE: "Расходник",
		HWHVACUUM_ITEM_FRAGMENT_TEMPLATE: "Фрагмент {name}",
		HWHVACUUM_ITEM_HERO_SOUL_TEMPLATE: "Камень души: {name}",
		HWHVACUUM_ITEM_SKIN_STONE_CHEST: "Ящик камней облика",
		HWHVACUUM_ITEM_GENERIC: "Предмет {id}",
		HWHVACUUM_ERROR_GENERIC: "Что-то пошло не так. В консоли будет причина."
	};
	//#endregion
	//#region src/scripts/hwhvacuum/core/helpers.ts
	var artifactEvolutionRowsCache = /* @__PURE__ */ new WeakMap();
	var shopStateIndexCache = /* @__PURE__ */ new WeakMap();
	var entityMapCache = /* @__PURE__ */ new WeakMap();
	var ALLOWED_EXCESS_EXCHANGE_TYPES = new Set(EXCESS_EXCHANGE_TYPES);
	var ALLOWED_CHECKLIST_ACTION_TYPES = new Set(CHECKLIST_ACTION_TYPES);
	var SOUL_EXCHANGE_TYPE_SET = new Set(SOUL_EXCHANGE_TYPES);
	var ARTIFACT_FRAGMENT_SALE_TYPE_SET = new Set(ARTIFACT_FRAGMENT_SALE_TYPES);
	function hasOwnEntry(record, key) {
		return Object.prototype.hasOwnProperty.call(record, key);
	}
	function normalizeStringList(values, fallbackValues = []) {
		const sourceValues = values === void 0 ? fallbackValues : Array.isArray(values) ? values : String(values !== null && values !== void 0 ? values : "").split(",");
		const result = [];
		const seen = /* @__PURE__ */ new Set();
		for (const value of sourceValues) {
			const normalizedValue = String(value !== null && value !== void 0 ? value : "").trim();
			if (!normalizedValue || seen.has(normalizedValue)) continue;
			seen.add(normalizedValue);
			result.push(normalizedValue);
		}
		return result;
	}
	function getShopDefinition(shopId) {
		var _SHOP_DEFINITIONS$Num;
		return (_SHOP_DEFINITIONS$Num = SHOP_DEFINITIONS[Number(shopId)]) !== null && _SHOP_DEFINITIONS$Num !== void 0 ? _SHOP_DEFINITIONS$Num : {
			nameKey: "HWHVACUUM_ITEM_GENERIC",
			currencyKey: "",
			icon: "shopping-cart",
			accentColor: "#d8c39a"
		};
	}
	function getCurrencyDefinition(currencyKey) {
		var _CURRENCY_DEFINITIONS;
		return (_CURRENCY_DEFINITIONS = CURRENCY_DEFINITIONS[String(currencyKey)]) !== null && _CURRENCY_DEFINITIONS !== void 0 ? _CURRENCY_DEFINITIONS : {
			nameKey: "HWHVACUUM_CURRENCY_GENERIC",
			icon: "coins",
			accentColor: "#d8c39a"
		};
	}
	function getShopOptionKeys(shopId) {
		const normalizedShopId = Number(shopId);
		if (normalizedShopId === 17) return [
			"petPotionGold",
			"petSparkGold",
			"petPotionCoins",
			"petSparkCoins"
		];
		const keys = ["gear", "soulStones"];
		if (normalizedShopId === 10) keys.push("skinStoneChests");
		if (normalizedShopId === 8) keys.push("xpSlot");
		return keys;
	}
	function isPetCoinCost(costDetails) {
		var _asRecordOrNull;
		return isPetCoinBalanceKey((_asRecordOrNull = asRecordOrNull(costDetails)) === null || _asRecordOrNull === void 0 ? void 0 : _asRecordOrNull.balanceKey);
	}
	function isPetCoinBalanceKey(balanceKey) {
		return PET_COIN_BALANCE_KEYS.has(String(balanceKey !== null && balanceKey !== void 0 ? balanceKey : ""));
	}
	function hasSoulCoinRewardBalance(rewardBalances, expectedCoinKey) {
		const expectedKey = String(expectedCoinKey !== null && expectedCoinKey !== void 0 ? expectedCoinKey : "");
		return rewardBalances.some((entry) => {
			var _asRecordOrNull$key, _asRecordOrNull2;
			const rewardKey = String((_asRecordOrNull$key = (_asRecordOrNull2 = asRecordOrNull(entry)) === null || _asRecordOrNull2 === void 0 ? void 0 : _asRecordOrNull2.key) !== null && _asRecordOrNull$key !== void 0 ? _asRecordOrNull$key : "");
			return rewardKey === expectedKey || isPetCoinBalanceKey(expectedKey) && isPetCoinBalanceKey(rewardKey);
		});
	}
	function createEnabledShopMap(defaultValue) {
		return Object.fromEntries(SHOP_IDS.map((shopId) => [shopId, !!defaultValue]));
	}
	function createDefaultShopPurchases() {
		return Object.fromEntries(SHOP_IDS.map((shopId) => [shopId, Object.fromEntries(getShopOptionKeys(shopId).map((optionKey) => {
			var _SHOP_OPTION_DEFINITI;
			return [optionKey, !!((_SHOP_OPTION_DEFINITI = SHOP_OPTION_DEFINITIONS[optionKey]) === null || _SHOP_OPTION_DEFINITI === void 0 ? void 0 : _SHOP_OPTION_DEFINITI.defaultValue)];
		}))]));
	}
	function createDefaultCurrencyLimits() {
		return Object.fromEntries(CURRENCY_LIMIT_ORDER.map((currencyKey) => [currencyKey, 0]));
	}
	function createDefaultSoulExchangeSettings(defaultValue = false) {
		return Object.fromEntries(SOUL_EXCHANGE_TYPES.map((exchangeType) => [exchangeType, !!defaultValue]));
	}
	function createDefaultArtifactFragmentSaleSettings(defaultValue = false) {
		return Object.fromEntries(ARTIFACT_FRAGMENT_SALE_TYPES.map((saleType) => [saleType, !!defaultValue]));
	}
	function normalizeSoulExchangeTypeList(values) {
		return normalizeStringList(values).filter((value) => ALLOWED_EXCESS_EXCHANGE_TYPES.has(value));
	}
	function normalizeChecklistActionTypes(values, fallbackValues = [CHECKLIST_ACTION_SHOPS]) {
		return normalizeStringList(values, fallbackValues).filter((value) => ALLOWED_CHECKLIST_ACTION_TYPES.has(value));
	}
	function normalizeVacuumButtonPlacement(value) {
		return value === "main" ? VACUUM_BUTTON_PLACEMENT_MAIN : VACUUM_BUTTON_PLACEMENT_OTHER;
	}
	function getAvailableShopIds(shopsState) {
		const source = asRecordOrNull(shopsState);
		if (!source) return [...SHOP_IDS];
		const shopIndex = getShopStateIndex(source);
		const availableShopIds = SHOP_IDS.filter((shopId) => shopIndex.has(shopId));
		return availableShopIds.length > 0 ? availableShopIds : [...SHOP_IDS];
	}
	function getShopState(shopsState, shopId) {
		var _getShopStateIndex$ge;
		const source = asRecordOrNull(shopsState);
		if (!source) return null;
		return (_getShopStateIndex$ge = getShopStateIndex(source).get(Number(shopId))) !== null && _getShopStateIndex$ge !== void 0 ? _getShopStateIndex$ge : null;
	}
	function getOrderedShopSlots(shop) {
		var _asRecordOrNull3;
		const slots = [];
		let previousId = Number.NEGATIVE_INFINITY;
		let alreadySorted = true;
		const slotRecord = asRecordOrNull((_asRecordOrNull3 = asRecordOrNull(shop)) === null || _asRecordOrNull3 === void 0 ? void 0 : _asRecordOrNull3.slots);
		if (!slotRecord) return slots;
		for (const slotKey in slotRecord) {
			if (hasOwnEntry(slotRecord, slotKey) === false) continue;
			const slot = asRecordOrNull(slotRecord[slotKey]);
			if (!slot) continue;
			const slotId = Number(slot.id);
			alreadySorted && (alreadySorted = slotId >= previousId);
			previousId = slotId;
			slots.push(slot);
		}
		if (!alreadySorted) slots.sort((left, right) => Number(left.id) - Number(right.id));
		return slots;
	}
	function collectRewardItems(reward, getItemName) {
		const result = [];
		const rewardRecord = asRecordOrNull(reward);
		if (!rewardRecord) return result;
		for (const rewardType in rewardRecord) {
			if (hasOwnEntry(rewardRecord, rewardType) === false) continue;
			const rewardData = asRecordOrNull(rewardRecord[rewardType]);
			if (!rewardData) continue;
			for (const itemId in rewardData) {
				if (hasOwnEntry(rewardData, itemId) === false) continue;
				const amount = Number(rewardData[itemId]) || 0;
				if (amount <= 0) continue;
				result.push({
					key: `${rewardType}:${itemId}`,
					label: getItemName(rewardType, itemId),
					amount
				});
			}
		}
		return result;
	}
	function getShopStateIndex(source) {
		const cached = shopStateIndexCache.get(source);
		if (cached) return cached;
		const index = /* @__PURE__ */ new Map();
		for (const sourceKey in source) {
			var _shop$id;
			if (hasOwnEntry(source, sourceKey) === false) continue;
			const value = source[sourceKey];
			const shop = asRecordOrNull(value);
			if (!shop) continue;
			const shopId = Number((_shop$id = shop.id) !== null && _shop$id !== void 0 ? _shop$id : sourceKey);
			if (Number.isFinite(shopId)) index.set(shopId, shop);
		}
		shopStateIndexCache.set(source, index);
		return index;
	}
	function getEntityMap(collection) {
		const source = asRecordOrNull(collection);
		if (!source) return {};
		if (!Array.isArray(collection)) return source;
		const cached = entityMapCache.get(collection);
		if (cached) return cached;
		const result = {};
		for (const entry of collection) {
			var _ref, _entity$id;
			const entity = asRecordOrNull(entry);
			const entityId = Number((_ref = (_entity$id = entity === null || entity === void 0 ? void 0 : entity.id) !== null && _entity$id !== void 0 ? _entity$id : entity === null || entity === void 0 ? void 0 : entity.petId) !== null && _ref !== void 0 ? _ref : 0);
			if (Number.isFinite(entityId) && entityId > 0) result[entityId] = entry;
		}
		entityMapCache.set(collection, result);
		return result;
	}
	function getEntityStarCount(entityData) {
		var _ref2, _ref3, _source$star;
		const source = asRecordOrNull(entityData);
		return Math.max(0, Number((_ref2 = (_ref3 = (_source$star = source === null || source === void 0 ? void 0 : source.star) !== null && _source$star !== void 0 ? _source$star : source === null || source === void 0 ? void 0 : source.stars) !== null && _ref3 !== void 0 ? _ref3 : source === null || source === void 0 ? void 0 : source.evolution) !== null && _ref2 !== void 0 ? _ref2 : source === null || source === void 0 ? void 0 : source.evolutionLevel) || 0);
	}
	function getInventoryAmountByTypes(inventory, typeNames, entityId) {
		const normalizedId = String(Math.max(0, Number(entityId) || 0));
		let amount = 0;
		for (const typeName of typeNames) amount += Number(getRecordValue(getRecordValue(inventory, typeName), normalizedId)) || 0;
		return amount;
	}
	function getArtifactEvolutionRowsFromTypeConfig(typeConfig) {
		var _asRecordOrNull4;
		const configRecord = asRecordOrNull(typeConfig);
		if (configRecord) {
			const cachedRows = artifactEvolutionRowsCache.get(configRecord);
			if (cachedRows) return cachedRows;
		}
		const rows = [];
		const evolution = (_asRecordOrNull4 = asRecordOrNull(configRecord === null || configRecord === void 0 ? void 0 : configRecord.evolution)) !== null && _asRecordOrNull4 !== void 0 ? _asRecordOrNull4 : {};
		for (const key in evolution) {
			if (hasOwnEntry(evolution, key) === false) continue;
			const source = asRecordOrNull(evolution[key]);
			const star = Math.max(0, Number(source === null || source === void 0 ? void 0 : source.star) || 0);
			if (star <= 0) continue;
			rows.push({
				star,
				fragmentCost: Math.max(0, Number(source === null || source === void 0 ? void 0 : source.costFragmentsAmount) || 0)
			});
		}
		rows.sort((left, right) => left.star - right.star);
		if (configRecord) artifactEvolutionRowsCache.set(configRecord, rows);
		return rows;
	}
	function getRemainingArtifactFragmentCost(evolutionRows, currentStar) {
		const normalizedCurrentStar = Math.max(0, Number(currentStar) || 0);
		let total = 0;
		for (const evolutionData of evolutionRows) if (evolutionData.star > normalizedCurrentStar) total += Number(evolutionData.fragmentCost) || 0;
		return total;
	}
	function appendArtifactFragmentUsage(usageByArtifactId, artifactId, artifactName, requiredFragments) {
		const normalizedArtifactId = Math.max(0, Number(artifactId) || 0);
		if (normalizedArtifactId <= 0) return;
		let usage = usageByArtifactId.get(normalizedArtifactId);
		if (!usage) {
			usage = {
				id: normalizedArtifactId,
				name: String(artifactName !== null && artifactName !== void 0 ? artifactName : ""),
				requiredFragments: 0,
				usageCount: 0
			};
			usageByArtifactId.set(normalizedArtifactId, usage);
		}
		usage.requiredFragments += Math.max(0, Number(requiredFragments) || 0);
		usage.usageCount += 1;
	}
	function collectSurplusArtifactFragmentEntries({ inventory, inventoryTypes, usageByArtifactId, blockedArtifactIds }) {
		var _usageByArtifactId$va;
		const result = [];
		for (const usage of (_usageByArtifactId$va = usageByArtifactId === null || usageByArtifactId === void 0 ? void 0 : usageByArtifactId.values()) !== null && _usageByArtifactId$va !== void 0 ? _usageByArtifactId$va : []) {
			if (blockedArtifactIds === null || blockedArtifactIds === void 0 ? void 0 : blockedArtifactIds.has(usage.id)) continue;
			const ownedAmount = getInventoryAmountByTypes(inventory, inventoryTypes !== null && inventoryTypes !== void 0 ? inventoryTypes : [], usage.id);
			const requiredAmount = Math.max(0, Math.floor(Number(usage.requiredFragments) || 0));
			const surplusAmount = Math.max(0, ownedAmount - requiredAmount);
			if (surplusAmount <= 0) continue;
			result.push({
				id: usage.id,
				name: usage.name,
				amount: surplusAmount,
				ownedAmount,
				requiredAmount,
				usageCount: usage.usageCount
			});
		}
		result.sort((left, right) => right.amount - left.amount || compareRussianText(left.name, right.name));
		return result;
	}
	function appendAmount(summaryMap, key, label, amount, extra = {}) {
		const numericAmount = Number(amount) || 0;
		if (numericAmount <= 0) return;
		let summary = summaryMap.get(key);
		if (!summary) {
			summary = {
				label,
				amount: 0,
				...extra
			};
			summaryMap.set(key, summary);
		}
		summary.amount += numericAmount;
		Object.assign(summary, extra);
	}
	function getRewardCoinAmount(callResult, coinId) {
		var _ref4, _ref5, _result$response, _asRecordOrNull$rewar, _asRecordOrNull5;
		const source = asRecordOrNull(callResult);
		const result = asRecordOrNull(source === null || source === void 0 ? void 0 : source.result);
		const payload = (_ref4 = (_ref5 = (_result$response = result === null || result === void 0 ? void 0 : result.response) !== null && _result$response !== void 0 ? _result$response : source === null || source === void 0 ? void 0 : source.response) !== null && _ref5 !== void 0 ? _ref5 : source) !== null && _ref4 !== void 0 ? _ref4 : {};
		const reward = asRecordOrNull((_asRecordOrNull$rewar = (_asRecordOrNull5 = asRecordOrNull(payload)) === null || _asRecordOrNull5 === void 0 ? void 0 : _asRecordOrNull5.reward) !== null && _asRecordOrNull$rewar !== void 0 ? _asRecordOrNull$rewar : payload);
		return (Number(getRecordValue(reward === null || reward === void 0 ? void 0 : reward.coin, coinId)) || 0) + (Number(getRecordValue(reward === null || reward === void 0 ? void 0 : reward.petcoin, coinId)) || 0);
	}
	function shouldExecuteSoulExchange(definition, candidateAmount) {
		var _asRecordOrNull6;
		return Number(candidateAmount) > 0 || ((_asRecordOrNull6 = asRecordOrNull(definition)) === null || _asRecordOrNull6 === void 0 ? void 0 : _asRecordOrNull6.executeWithoutCandidates) === true;
	}
	function isExcessExchangeTypeEnabled(settings, exchangeType) {
		const exchangeKey = String(exchangeType);
		const source = asRecordOrNull(settings);
		if (SOUL_EXCHANGE_TYPE_SET.has(exchangeKey)) return !!getRecordValue(source === null || source === void 0 ? void 0 : source.soulExchange, exchangeKey);
		if (ARTIFACT_FRAGMENT_SALE_TYPE_SET.has(exchangeKey)) return !!getRecordValue(source === null || source === void 0 ? void 0 : source.artifactFragmentSale, exchangeKey);
		return false;
	}
	function getEnabledExcessExchangeTypes(settings, options = void 0) {
		const source = asRecordOrNull(settings);
		const optionSource = asRecordOrNull(options);
		const checklistTypeSet = (optionSource === null || optionSource === void 0 ? void 0 : optionSource.source) === "checklist" ? new Set(normalizeChecklistActionTypes(source === null || source === void 0 ? void 0 : source.checklistActionTypes, [])) : void 0;
		const enabledTypes = [];
		for (const exchangeType of EXCESS_EXCHANGE_TYPES) if (isExcessExchangeTypeEnabled(settings, exchangeType) && (!checklistTypeSet || checklistTypeSet.has(exchangeType))) enabledTypes.push(exchangeType);
		return enabledTypes;
	}
	function shouldRunShopPurchases(settings, options = void 0) {
		var _asRecordOrNull7;
		const optionSource = asRecordOrNull(options);
		if ((optionSource === null || optionSource === void 0 ? void 0 : optionSource.source) !== "checklist") return true;
		return normalizeChecklistActionTypes((_asRecordOrNull7 = asRecordOrNull(settings)) === null || _asRecordOrNull7 === void 0 ? void 0 : _asRecordOrNull7.checklistActionTypes, []).includes(CHECKLIST_ACTION_SHOPS);
	}
	function buildExchangeSnapshotOptions(settings, options = void 0) {
		const enabledTypeSet = new Set(getEnabledExcessExchangeTypes(settings, options));
		const includeShopData = shouldRunShopPurchases(settings, options);
		return {
			includeShops: includeShopData,
			includeUserInfo: includeShopData,
			includeHeroes: enabledTypeSet.has("heroes") || enabledTypeSet.has("heroArtifactFragments"),
			includeTitans: enabledTypeSet.has("titans") || enabledTypeSet.has("titanArtifactFragments"),
			includePets: enabledTypeSet.has("pets")
		};
	}
	function isGearReward(reward) {
		var _asRecordOrNull8;
		const source = (_asRecordOrNull8 = asRecordOrNull(reward)) !== null && _asRecordOrNull8 !== void 0 ? _asRecordOrNull8 : {};
		let hasReward = false;
		for (const rewardType in source) {
			if (hasOwnEntry(source, rewardType) === false) continue;
			hasReward = true;
			if (!GEAR_REWARD_TYPES.has(rewardType)) return false;
		}
		return hasReward;
	}
	function isSoulStoneReward(reward) {
		var _asRecordOrNull9;
		const source = (_asRecordOrNull9 = asRecordOrNull(reward)) !== null && _asRecordOrNull9 !== void 0 ? _asRecordOrNull9 : {};
		let hasReward = false;
		for (const rewardType in source) {
			if (hasOwnEntry(source, rewardType) === false) continue;
			hasReward = true;
			if (rewardType !== "fragmentHero") return false;
		}
		return hasReward;
	}
	function getOutlandSkinChestAmount(reward) {
		var _asRecordOrNull10;
		return Number(getRecordValue((_asRecordOrNull10 = asRecordOrNull(reward)) === null || _asRecordOrNull10 === void 0 ? void 0 : _asRecordOrNull10.consumable, 65)) || 0;
	}
	function isOutlandSkinChestSlot(slot) {
		var _asRecordOrNull11;
		return getOutlandSkinChestAmount((_asRecordOrNull11 = asRecordOrNull(slot)) === null || _asRecordOrNull11 === void 0 ? void 0 : _asRecordOrNull11.reward) > 0;
	}
	function isSoulExperienceSlot(slot) {
		var _asRecordOrNull12;
		return Number((_asRecordOrNull12 = asRecordOrNull(slot)) === null || _asRecordOrNull12 === void 0 ? void 0 : _asRecordOrNull12.id) === 2;
	}
	function resolveSlotPurchaseOption(settings, shopId, slot, costDetails) {
		var _asRecordOrNull13, _asRecordOrNull14, _asRecordOrNull16, _asRecordOrNull17;
		const optionSource = (_asRecordOrNull13 = asRecordOrNull(getRecordValue((_asRecordOrNull14 = asRecordOrNull(settings)) === null || _asRecordOrNull14 === void 0 ? void 0 : _asRecordOrNull14.shopPurchases, shopId))) !== null && _asRecordOrNull13 !== void 0 ? _asRecordOrNull13 : {};
		if (Number(shopId) === 17) {
			var _asRecordOrNull15;
			const slotId = Number((_asRecordOrNull15 = asRecordOrNull(slot)) === null || _asRecordOrNull15 === void 0 ? void 0 : _asRecordOrNull15.id);
			if (costDetails.balanceKey === "gold:0" && slotId === 1 && optionSource.petPotionGold) return "petPotionGold";
			if (costDetails.balanceKey === "gold:0" && slotId === 2 && optionSource.petSparkGold) return "petSparkGold";
			if (isPetCoinCost(costDetails) && slotId === 3 && optionSource.petPotionCoins) return "petPotionCoins";
			if (isPetCoinCost(costDetails) && slotId === 4 && optionSource.petSparkCoins) return "petSparkCoins";
			return "";
		}
		if (Number(shopId) === 10 && optionSource.skinStoneChests && isOutlandSkinChestSlot(slot)) return "skinStoneChests";
		if (Number(shopId) === 8 && optionSource.xpSlot && isSoulExperienceSlot(slot)) return "xpSlot";
		if (optionSource.gear && isGearReward((_asRecordOrNull16 = asRecordOrNull(slot)) === null || _asRecordOrNull16 === void 0 ? void 0 : _asRecordOrNull16.reward)) return "gear";
		if (optionSource.soulStones && isSoulStoneReward((_asRecordOrNull17 = asRecordOrNull(slot)) === null || _asRecordOrNull17 === void 0 ? void 0 : _asRecordOrNull17.reward)) return "soulStones";
		return "";
	}
	function getCurrencyLimit(settings, currencyKey) {
		var _asRecordOrNull18;
		return normalizeNonNegativeInteger(getRecordValue((_asRecordOrNull18 = asRecordOrNull(settings)) === null || _asRecordOrNull18 === void 0 ? void 0 : _asRecordOrNull18.currencyLimits, currencyKey), 0);
	}
	function buildBalances(inventory, userInfo) {
		var _asRecordOrNull19, _asRecordOrNull20, _asRecordOrNull21, _asRecordOrNull22, _asRecordOrNull23;
		const balances = { "gold:0": Number((_asRecordOrNull19 = asRecordOrNull(userInfo)) === null || _asRecordOrNull19 === void 0 ? void 0 : _asRecordOrNull19.gold) || 0 };
		const coin = (_asRecordOrNull20 = asRecordOrNull((_asRecordOrNull21 = asRecordOrNull(inventory)) === null || _asRecordOrNull21 === void 0 ? void 0 : _asRecordOrNull21.coin)) !== null && _asRecordOrNull20 !== void 0 ? _asRecordOrNull20 : {};
		for (const currencyId in coin) {
			if (hasOwnEntry(coin, currencyId) === false) continue;
			const amount = coin[currencyId];
			balances[`coin:${currencyId}`] = Number(amount) || 0;
		}
		const petcoin = (_asRecordOrNull22 = asRecordOrNull((_asRecordOrNull23 = asRecordOrNull(inventory)) === null || _asRecordOrNull23 === void 0 ? void 0 : _asRecordOrNull23.petcoin)) !== null && _asRecordOrNull22 !== void 0 ? _asRecordOrNull22 : {};
		for (const currencyId in petcoin) {
			if (hasOwnEntry(petcoin, currencyId) === false) continue;
			const amount = petcoin[currencyId];
			balances[`petcoin:${currencyId}`] = Number(amount) || 0;
		}
		return balances;
	}
	function applyExchangeRewardsToBalances(balances, exchangeSummary) {
		const result = { ...balances !== null && balances !== void 0 ? balances : {} };
		for (const entry of exchangeSummary) {
			const source = asRecordOrNull(entry);
			if (!(source === null || source === void 0 ? void 0 : source.success)) continue;
			const rewardBalances = Array.isArray(source.rewardBalances) ? source.rewardBalances : [];
			for (const rewardEntry of rewardBalances) {
				var _rewardSource$key;
				const rewardSource = asRecordOrNull(rewardEntry);
				const key = String((_rewardSource$key = rewardSource === null || rewardSource === void 0 ? void 0 : rewardSource.key) !== null && _rewardSource$key !== void 0 ? _rewardSource$key : "");
				if (!key) continue;
				result[key] = (Number(result[key]) || 0) + (Number(rewardSource === null || rewardSource === void 0 ? void 0 : rewardSource.amount) || 0);
			}
		}
		return result;
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
	//#region src/scripts/hwhvacuum/ui/lite/native-settings-view.ts
	var shopOptionDefinitions = SHOP_OPTION_DEFINITIONS;
	var soulExchangeDefinitions = SOUL_EXCHANGE_DEFINITIONS;
	var artifactSaleDefinitions = ARTIFACT_FRAGMENT_SALE_DEFINITIONS;
	function renderNativeVacuumSettings(props) {
		const state = toNativeRecord(props.state);
		const snapshot = toNativeRecord(props.snapshot);
		const translate = readNativeTranslate(props.translate);
		const shopIds = getAvailableShopIds(snapshot.shops);
		const root = document.createElement("div");
		root.className = "hwhx-native-body hwhx-popup hwhx-vacuum-lite";
		root.append(renderToolbar(state, shopIds, translate, props.saveSettings), renderCurrencyLimits(state, translate), renderShopFilters(state, shopIds, translate));
		for (const shopId of shopIds) root.appendChild(renderShop(state, shopId, translate));
		root.append(renderExchanges(state, translate), renderInterface(state, translate), renderProgress(state, translate), renderDoYourBest(state, translate, props.doYourBestPlacementOptions));
		return root;
	}
	function renderToolbar(state, shopIds, translate, saveSettings) {
		const root = document.createElement("div");
		root.className = "hwhx-button-group";
		root.append(createNativeButton(translate("HWHVACUUM_ENABLE_ALL_SHOPS"), () => {
			setAllShops(state, shopIds, true);
			call(saveSettings);
		}, "success"), createNativeButton(translate("HWHVACUUM_DISABLE_ALL_SHOPS"), () => {
			setAllShops(state, shopIds, false);
			call(saveSettings);
		}));
		return root;
	}
	function renderCurrencyLimits(state, translate) {
		const section = createNativeDetails(translate("HWHVACUUM_CURRENCY_LIMITS"), true);
		const limits = ensureRecord(state, "currencyLimits");
		for (const currencyKey of CURRENCY_LIMIT_ORDER) {
			const definition = getCurrencyDefinition(currencyKey);
			section.body.appendChild(createNativeNumberRow(translate(definition.nameKey), limits[currencyKey], 0, void 0, (value) => {
				limits[currencyKey] = value;
			}));
		}
		return section.root;
	}
	function renderShopFilters(state, shopIds, translate) {
		const section = createNativeDetails(translate("HWHVACUUM_SHOP_FILTERS"), true);
		const enabledShops = ensureRecord(state, "enabledShops");
		for (const shopId of shopIds) section.body.appendChild(createNativeCheckboxRow(translate(getShopDefinition(shopId).nameKey), enabledShops[shopId], (value) => {
			enabledShops[shopId] = value;
		}));
		return section.root;
	}
	function renderShop(state, shopId, translate) {
		const section = createNativeDetails(translate(getShopDefinition(shopId).nameKey));
		const purchases = ensureNestedRecord(state, "shopPurchases", shopId);
		for (const optionKey of getShopOptionKeys(shopId)) {
			const definition = shopOptionDefinitions[optionKey];
			if (!definition) continue;
			section.body.appendChild(createNativeCheckboxRow(translate(definition.labelKey), purchases[optionKey], (value) => {
				purchases[optionKey] = value;
			}));
		}
		return section.root;
	}
	function renderExchanges(state, translate) {
		const section = createNativeDetails(translate("HWHVACUUM_SOUL_EXCHANGE_SECTION"));
		const soulExchange = ensureRecord(state, "soulExchange");
		for (const exchangeType of SOUL_EXCHANGE_TYPES) section.body.appendChild(createNativeCheckboxRow(translate(soulExchangeDefinitions[exchangeType].labelKey), soulExchange[exchangeType], (value) => {
			soulExchange[exchangeType] = value;
		}));
		const artifactSale = ensureRecord(state, "artifactFragmentSale");
		for (const saleType of ARTIFACT_FRAGMENT_SALE_TYPES) section.body.appendChild(createNativeCheckboxRow(translate(artifactSaleDefinitions[saleType].labelKey), artifactSale[saleType], (value) => {
			artifactSale[saleType] = value;
		}));
		return section.root;
	}
	function renderInterface(state, translate) {
		const section = createNativeDetails(translate("HWHVACUUM_INTERFACE_SETTINGS_SECTION"));
		section.body.append(createNativeSelectRow(translate("HWHVACUUM_BUTTON_PLACEMENT_LABEL"), state.vacuumButtonPlacement, [{
			value: VACUUM_BUTTON_PLACEMENT_MAIN,
			label: translate("HWHVACUUM_BUTTON_PLACEMENT_MAIN")
		}, {
			value: VACUUM_BUTTON_PLACEMENT_OTHER,
			label: translate("HWHVACUUM_BUTTON_PLACEMENT_OTHER")
		}], (value) => {
			state.vacuumButtonPlacement = value;
		}), createNativeCheckboxRow(translate("HWHVACUUM_SYNC_AFTER_RUN"), state.syncAfterRun, (value) => {
			state.syncAfterRun = value;
		}), createNativeSelectRow(translate("HWHVACUUM_ACCORDION_AUTO_SCROLL_MODE"), state.accordionAutoScrollMode, [
			"off",
			"instant",
			"smooth"
		].map((value) => ({
			value,
			label: translate(`HWHVACUUM_ACCORDION_AUTO_SCROLL_${value.toUpperCase()}`)
		})), (value) => {
			state.accordionAutoScrollMode = value;
		}), createNativeSelectRow(translate("HWHVACUUM_REORDER_LIST_VARIANT"), state.reorderListVariant, ["full", "minimal"].map((value) => ({
			value,
			label: translate(`HWHVACUUM_REORDER_LIST_VARIANT_${value.toUpperCase()}`)
		})), (value) => {
			state.reorderListVariant = value;
		}));
		return section.root;
	}
	function renderProgress(state, translate) {
		var _state$progressWindow, _state$progressWindow2;
		return createNativeProgressOptionsSection({
			value: {
				autoHide: !!state.progressAutoHideResult,
				autoHideMs: Number(state.progressAutoHideResultTimeoutMs) || 5e3,
				position: String((_state$progressWindow = state.progressWindowPosition) !== null && _state$progressWindow !== void 0 ? _state$progressWindow : "top-right"),
				style: String((_state$progressWindow2 = state.progressWindowStyle) !== null && _state$progressWindow2 !== void 0 ? _state$progressWindow2 : "default")
			},
			labels: {
				title: translate("HWHVACUUM_PROGRESS_WINDOW_SECTION"),
				autoHide: translate("HWHVACUUM_PROGRESS_AUTO_HIDE_RESULT"),
				autoHideMs: translate("HWHVACUUM_PROGRESS_AUTO_HIDE_TIMEOUT"),
				position: translate("HWHVACUUM_PROGRESS_POSITION"),
				style: translate("HWHVACUUM_PROGRESS_STYLE")
			},
			positionOptions: [
				"top-center",
				"top-right",
				"bottom-right"
			].map((value) => ({
				value,
				label: translate(`HWHVACUUM_PROGRESS_POSITION_${value.replaceAll("-", "_").toUpperCase()}`)
			})),
			styleOptions: [
				"default",
				"compact",
				"dashboard"
			].map((value) => ({
				value,
				label: translate(`HWHVACUUM_PROGRESS_STYLE_${value.toUpperCase()}`)
			})),
			onUpdate: (value) => {
				state.progressAutoHideResult = value.autoHide;
				state.progressAutoHideResultTimeoutMs = value.autoHideMs;
				state.progressWindowPosition = value.position;
				state.progressWindowStyle = value.style;
			}
		});
	}
	function renderDoYourBest(state, translate, placementOptions) {
		const section = createNativeDetails(translate("HWHVACUUM_DO_YOUR_BEST"));
		section.body.appendChild(createNativeSelectRow(translate("HWHVACUUM_DO_YOUR_BEST_PLACEMENT_LABEL"), state.doYourBestPlacement, toNativeRecordList(placementOptions), (value) => {
			state.doYourBestPlacement = value;
		}));
		const actions = new Set(Array.isArray(state.checklistActionTypes) ? state.checklistActionTypes.map(String) : []);
		const definitions = [
			{
				value: CHECKLIST_ACTION_SHOPS,
				label: translate("HWHVACUUM_CHECKLIST_ACTION_SHOPS")
			},
			...SOUL_EXCHANGE_TYPES.map((value) => ({
				value,
				label: translate(soulExchangeDefinitions[value].labelKey)
			})),
			...ARTIFACT_FRAGMENT_SALE_TYPES.map((value) => ({
				value,
				label: translate(artifactSaleDefinitions[value].labelKey)
			}))
		];
		for (const definition of definitions) section.body.appendChild(createNativeCheckboxRow(definition.label, actions.has(definition.value), (value) => {
			if (value) actions.add(definition.value);
			else actions.delete(definition.value);
			state.checklistActionTypes = [...actions];
		}));
		return section.root;
	}
	function setAllShops(state, shopIds, value) {
		const enabledShops = ensureRecord(state, "enabledShops");
		for (const shopId of shopIds) enabledShops[shopId] = value;
	}
	function ensureRecord(state, key) {
		const value = toNativeRecord(state[key]);
		state[key] = value;
		return value;
	}
	function ensureNestedRecord(state, key, nestedKey) {
		const parent = ensureRecord(state, key);
		const value = toNativeRecord(parent[String(nestedKey)]);
		parent[String(nestedKey)] = value;
		return value;
	}
	function call(callback) {
		if (typeof callback === "function") callback();
	}
	//#endregion
	//#region src/scripts/hwhvacuum/runtime/lite/ui-port.ts
	var RuntimeResultSummary = defineNativeView("vacuum-result-summary", renderNativeResultSummary);
	var RuntimeSettingsPanel = defineNativeView("vacuum-settings", renderNativeVacuumSettings);
	var RuntimeTextPanel = defineNativeView("vacuum-text-panel", renderNativeTextPanel);
	var createRuntimeProgressController = createNativeProgressController;
	var initializeRuntimeUi = initializeNativeUi;
	var openRuntimeComponentModal = openNativeComponentModal;
	function createRuntimeShallowReactiveState(value) {
		return value;
	}
	function buildRuntimeModalHeader(title) {
		return {
			title: title || "HWH Shop Vacuum Lite",
			badges: [{
				label: `v1.3.226-lite.1`,
				tone: "blue"
			}, {
				label: "Lite",
				tone: "gray"
			}]
		};
	}
	function readRuntimeUserscriptInfo(script) {
		var _source$name, _source$version, _source$author;
		const source = script !== null && typeof script === "object" && !Array.isArray(script) ? script : {};
		return {
			name: String((_source$name = source.name) !== null && _source$name !== void 0 ? _source$name : "HWH Shop Vacuum Lite").trim(),
			version: String((_source$version = source.version) !== null && _source$version !== void 0 ? _source$version : "?").trim(),
			author: String((_source$author = source.author) !== null && _source$author !== void 0 ? _source$author : "?").trim()
		};
	}
	function buildRuntimeSettingsModalTitle(scriptInfo, translate) {
		return `${scriptInfo.name} · ${translate("HWHVACUUM_SETTINGS_HEADER_META", {
			version: scriptInfo.version || "?",
			author: scriptInfo.author || "?"
		})}`;
	}
	function buildRuntimeSettingsHeaderActions(translate) {
		return [
			buildAction("exportSettings", translate("HWHVACUUM_EXPORT_SETTINGS")),
			buildAction("importSettings", translate("HWHVACUUM_IMPORT_SETTINGS"), true),
			buildAction("dumpGameLibrary", translate("HWHVACUUM_DUMP_LIBRARY_TITLE")),
			buildAction("help", translate("HWHVACUUM_DOCS_TITLE"), true)
		];
	}
	async function openRuntimeDocumentationModal(translate) {
		await openNativeComponentModal({
			kind: "documentation",
			title: translate("HWHVACUUM_DOCS_TITLE"),
			header: buildRuntimeModalHeader(translate("HWHVACUUM_DOCS_TITLE")),
			component: RuntimeTextPanel,
			props: {
				note: translate("HWHVACUUM_DOCS_TEXT"),
				links: SUPPORT_DOCUMENTATION_LINKS.map((link, index) => ({
					label: translate(index === 0 ? "HWHVACUUM_DOCS_PRIMARY" : "HWHVACUUM_DOCS_MIRROR"),
					url: link.url
				}))
			},
			actions: [{
				result: "close",
				label: translate("HWHVACUUM_CLOSE")
			}]
		});
	}
	async function openRuntimeDonateModal(translate) {
		await openNativeComponentModal({
			kind: "donate",
			title: translate("HWHVACUUM_DONATE_TITLE"),
			header: buildRuntimeModalHeader(translate("HWHVACUUM_DONATE_TITLE")),
			component: RuntimeTextPanel,
			props: {
				note: `${translate("HWHVACUUM_DONATE_TEXT")}\n${translate("HWHVACUUM_DONATE_WALLET", { wallet: SUPPORT_DONATE_WALLET })}`,
				links: SUPPORT_DONATE_PROVIDERS
			},
			actions: [{
				result: "close",
				label: translate("HWHVACUUM_CLOSE")
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
	//#region src/scripts/hwhvacuum/runtime/progress-stages.ts
	function createVacuumProgressReporter({ setStageProgress, sendCallsInChunks }) {
		const chunks = (calls, detail) => (event) => {
			const requestNames = new Set(calls.slice(event.chunkStart - 1, event.chunkEnd).map((call) => {
				var _call$name;
				return String((_call$name = call.name) !== null && _call$name !== void 0 ? _call$name : "");
			}).filter(Boolean));
			setStageProgress({
				phase: event.phase === "processed" ? "processing" : "sending",
				current: event.requestIndex,
				total: event.totalRequests,
				itemCount: event.chunkSize,
				requestName: [...requestNames].join(", "),
				detail
			});
		};
		return {
			chunks,
			batching: (itemCount, requestName, detail) => setStageProgress({
				phase: "batching",
				itemCount,
				requestName,
				detail
			}),
			send: (calls, detail) => {
				var _calls$0$name, _calls$;
				const requestName = String((_calls$0$name = (_calls$ = calls[0]) === null || _calls$ === void 0 ? void 0 : _calls$.name) !== null && _calls$0$name !== void 0 ? _calls$0$name : "serverCall");
				setStageProgress({
					phase: "batching",
					itemCount: calls.length,
					requestName,
					detail
				});
				return sendCallsInChunks([...calls], void 0, chunks(calls, detail));
			}
		};
	}
	//#endregion
	//#region src/scripts/hwhvacuum/i18n/runtime.ts
	function getVacuumTranslations() {
		return getScriptTranslations({
			en: I18N_EN,
			ru: I18N_RU
		}, { scriptId: resolveCurrentUserscriptId("hwhvacuum") });
	}
	//#endregion
	//#region src/scripts/hwhvacuum/domain/run-summary.ts
	function summarizeSuccessfulPurchases({ plannedPurchases, purchaseResults, balances, finalBalances = {}, exchangeActions = [], isCallResultSucceeded, getCallResultErrorMessage }) {
		const purchasesByShop = /* @__PURE__ */ new Map();
		const spentByCurrency = /* @__PURE__ */ new Map();
		const failures = [];
		const remainingByCurrency = { ...balances !== null && balances !== void 0 ? balances : {} };
		let successCount = 0;
		purchaseResults.forEach((purchaseResult, index) => {
			var _finalBalances$curren;
			const plannedPurchase = plannedPurchases[index];
			if (!plannedPurchase) return;
			if (!isCallResultSucceeded(purchaseResult)) {
				const errorMessage = getCallResultErrorMessage(purchaseResult);
				failures.push(`${plannedPurchase.shopName}, slot ${plannedPurchase.slotId}${errorMessage ? `: ${errorMessage}` : ""}`);
				return;
			}
			const currencyKey = plannedPurchase.cost.balanceKey;
			remainingByCurrency[currencyKey] = Math.max(0, (Number(remainingByCurrency[currencyKey]) || 0) - plannedPurchase.cost.amount);
			appendAmount(spentByCurrency, currencyKey, plannedPurchase.cost.currencyLabel, plannedPurchase.cost.amount, { remainingAmount: (_finalBalances$curren = finalBalances[currencyKey]) !== null && _finalBalances$curren !== void 0 ? _finalBalances$curren : remainingByCurrency[currencyKey] });
			if (!purchasesByShop.has(plannedPurchase.shopId)) purchasesByShop.set(plannedPurchase.shopId, {
				shopId: plannedPurchase.shopId,
				shopName: plannedPurchase.shopName,
				items: /* @__PURE__ */ new Map(),
				slots: 0
			});
			const shopSummary = purchasesByShop.get(plannedPurchase.shopId);
			if (!shopSummary) return;
			shopSummary.slots += 1;
			successCount += 1;
			plannedPurchase.rewardItems.forEach((item) => {
				appendAmount(shopSummary.items, item.key, item.label, item.amount);
			});
		});
		return {
			purchasesByShop: [...purchasesByShop.values()],
			spentByCurrency: [...spentByCurrency.values()],
			failures,
			successCount,
			exchangeActions: [...exchangeActions]
		};
	}
	//#endregion
	//#region src/shared/ui/reorder-list-variant.ts
	var REORDER_LIST_VARIANT_FULL = "full";
	function normalizeReorderListVariant(value, fallback = REORDER_LIST_VARIANT_FULL) {
		return value === "minimal" || value === "full" ? value : fallback === "minimal" || fallback === "full" ? fallback : REORDER_LIST_VARIANT_FULL;
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
	//#region src/scripts/hwhvacuum/settings/schema.ts
	function getNestedRecord(container, ...keys) {
		return asPlainRecord(keys.reduce((currentValue, key) => getRecordValue(currentValue, key), container));
	}
	var normalizeDoYourBestPlacement = createDoYourBestPlacementNormalizer();
	var DEFAULT_VACUUM_SETTINGS = {
		uiTheme: "dominion",
		enabledShops: createEnabledShopMap(true),
		shopPurchases: createDefaultShopPurchases(),
		currencyLimits: createDefaultCurrencyLimits(),
		soulExchange: createDefaultSoulExchangeSettings(false),
		artifactFragmentSale: createDefaultArtifactFragmentSaleSettings(false),
		checklistSoulExchangeTypes: [],
		checklistActionTypes: [CHECKLIST_ACTION_SHOPS],
		vacuumButtonPlacement: VACUUM_BUTTON_PLACEMENT_OTHER,
		doYourBestPlacement: "end",
		syncAfterRun: false,
		...DEFAULT_PROGRESS_WINDOW_SETTINGS,
		accordionAutoScrollMode: "smooth",
		reorderListVariant: "full"
	};
	function normalizeSettings(value) {
		const rawSettings = asPlainRecord(value);
		const progressSettings = normalizeProgressWindowSettings(rawSettings, DEFAULT_PROGRESS_WINDOW_SETTINGS);
		progressSettings.progressAutoHideResultTimeoutMs = Math.max(1e3, progressSettings.progressAutoHideResultTimeoutMs);
		const rawEnabledShops = asPlainRecord(rawSettings.enabledShops);
		const rawShopPurchases = asPlainRecord(rawSettings.shopPurchases);
		const rawCurrencyLimits = asPlainRecord(rawSettings.currencyLimits);
		const rawSoulExchange = asPlainRecord(rawSettings.soulExchange);
		const rawArtifactFragmentSale = asPlainRecord(rawSettings.artifactFragmentSale);
		const enabledShops = createEnabledShopMap(true);
		const defaultShopPurchases = createDefaultShopPurchases();
		const shopPurchases = createDefaultShopPurchases();
		const currencyLimits = createDefaultCurrencyLimits();
		const soulExchange = createDefaultSoulExchangeSettings(false);
		const artifactFragmentSale = createDefaultArtifactFragmentSaleSettings(false);
		SHOP_IDS.forEach((shopId) => {
			enabledShops[shopId] = getRecordValue(rawEnabledShops, shopId) !== false;
			getShopOptionKeys(shopId).forEach((optionKey) => {
				var _defaultShopPurchases;
				const savedValue = getRecordValue(getNestedRecord(rawShopPurchases, shopId), optionKey);
				shopPurchases[shopId][optionKey] = typeof savedValue === "boolean" ? savedValue : !!((_defaultShopPurchases = defaultShopPurchases[shopId]) === null || _defaultShopPurchases === void 0 ? void 0 : _defaultShopPurchases[optionKey]);
			});
		});
		CURRENCY_LIMIT_ORDER.forEach((currencyKey) => {
			currencyLimits[currencyKey] = normalizeNonNegativeInteger(getRecordValue(rawCurrencyLimits, currencyKey), 0);
		});
		SOUL_EXCHANGE_TYPES.forEach((exchangeType) => {
			soulExchange[exchangeType] = !!getRecordValue(rawSoulExchange, exchangeType);
		});
		ARTIFACT_FRAGMENT_SALE_TYPES.forEach((saleType) => {
			artifactFragmentSale[saleType] = !!getRecordValue(rawArtifactFragmentSale, saleType);
		});
		return {
			uiTheme: normalizeUiTheme(rawSettings.uiTheme, DEFAULT_VACUUM_SETTINGS.uiTheme),
			enabledShops,
			shopPurchases,
			currencyLimits,
			soulExchange,
			artifactFragmentSale,
			checklistSoulExchangeTypes: normalizeSoulExchangeTypeList(rawSettings.checklistSoulExchangeTypes),
			checklistActionTypes: normalizeChecklistActionTypes(rawSettings.checklistActionTypes, rawSettings.checklistSoulExchangeTypes === void 0 ? DEFAULT_VACUUM_SETTINGS.checklistActionTypes : [CHECKLIST_ACTION_SHOPS, ...normalizeSoulExchangeTypeList(rawSettings.checklistSoulExchangeTypes)]),
			vacuumButtonPlacement: normalizeVacuumButtonPlacement(rawSettings.vacuumButtonPlacement),
			doYourBestPlacement: normalizeDoYourBestPlacement(rawSettings.doYourBestPlacement),
			syncAfterRun: !!rawSettings.syncAfterRun,
			...progressSettings,
			accordionAutoScrollMode: normalizeAccordionAutoScrollMode(rawSettings.accordionAutoScrollMode, DEFAULT_VACUUM_SETTINGS.accordionAutoScrollMode),
			reorderListVariant: normalizeReorderListVariant(rawSettings.reorderListVariant, DEFAULT_VACUUM_SETTINGS.reorderListVariant)
		};
	}
	var DEFAULT_NORMALIZED_VACUUM_SETTINGS = normalizeSettings(DEFAULT_VACUUM_SETTINGS);
	//#endregion
	//#region src/scripts/hwhvacuum/settings/transfer.ts
	var VACUUM_TRANSFER_BLOCK_KEYS = {
		shops: [
			"enabledShops",
			"shopPurchases",
			"currencyLimits"
		],
		exchange: ["soulExchange", "artifactFragmentSale"],
		interface: [
			"uiTheme",
			"checklistSoulExchangeTypes",
			"checklistActionTypes",
			"vacuumButtonPlacement",
			"doYourBestPlacement",
			"syncAfterRun",
			"progressAutoHideResult",
			"progressAutoHideResultTimeoutMs",
			"progressWindowPosition",
			"progressWindowStyle",
			"accordionAutoScrollMode",
			"reorderListVariant"
		]
	};
	function asVacuumSettingsStore(value) {
		if (!isPlainObject(value) || !isPlainObject(value.state)) throw new Error("Invalid HWH Shop Vacuum settings store.");
		return {
			state: value.state,
			save: typeof value.save === "function" ? value.save.bind(value) : () => {}
		};
	}
	function buildVacuumSettingsExportFileName(userIdValue) {
		return buildSettingsExportFileName(userIdValue, "hwhvacuum.json");
	}
	function buildVacuumSettingsExportPayload(settings, userInfo, { scriptName, scriptVersion, getUserId }) {
		return buildSettingsExportPayload({
			scriptId: "hwhvacuum",
			scriptName: String(scriptName !== null && scriptName !== void 0 ? scriptName : "HWH Shop Vacuum"),
			scriptVersion: String(scriptVersion !== null && scriptVersion !== void 0 ? scriptVersion : ""),
			exportVersion: 1,
			storageSchemaVersion: 4,
			userId: getUserId(userInfo),
			data: splitVacuumSettingsForTransfer(settings)
		});
	}
	function buildVacuumSettingsTransferOptions(translate) {
		return [
			{
				key: "shops",
				label: translate("HWHVACUUM_TRANSFER_SHOPS"),
				icon: "shopping-cart",
				checked: true,
				title: translate("HWHVACUUM_TRANSFER_SHOPS_TITLE")
			},
			{
				key: "exchange",
				label: translate("HWHVACUUM_TRANSFER_EXCHANGE"),
				icon: "refresh-cw",
				checked: true,
				title: translate("HWHVACUUM_TRANSFER_EXCHANGE_TITLE")
			},
			{
				key: "interface",
				label: translate("HWHVACUUM_TRANSFER_INTERFACE"),
				icon: "monitor",
				checked: true,
				title: translate("HWHVACUUM_TRANSFER_INTERFACE_TITLE")
			}
		];
	}
	function buildVacuumSettingsTransferLabels(translate) {
		return {
			exportSelectTitle: translate("HWHVACUUM_EXPORT_SETTINGS"),
			importSelectTitle: translate("HWHVACUUM_IMPORT_SETTINGS"),
			exportSelectConfirm: translate("HWHVACUUM_EXPORT_SETTINGS"),
			importSelectConfirm: translate("HWHVACUUM_IMPORT_SETTINGS"),
			cancel: translate("HWHVACUUM_CLOSE"),
			importFileLabel: translate("HWHVACUUM_TRANSFER_FILE_LABEL"),
			searchPlaceholder: translate("HWHVACUUM_TRANSFER_SEARCH"),
			clearSearch: translate("HWHVACUUM_TRANSFER_CLEAR_SEARCH"),
			noOptions: translate("HWHVACUUM_TRANSFER_EMPTY"),
			selectAll: translate("HWHVACUUM_TRANSFER_SELECT_ALL"),
			clearAll: translate("HWHVACUUM_TRANSFER_CLEAR_ALL"),
			sort: translate("HWHVACUUM_TRANSFER_SORT"),
			sortByLabel: translate("HWHVACUUM_TRANSFER_SORT_BY_NAME"),
			sortSelected: translate("HWHVACUUM_TRANSFER_SORT_SELECTED"),
			sortAsc: translate("HWHVACUUM_TRANSFER_SORT_ASC"),
			sortDesc: translate("HWHVACUUM_TRANSFER_SORT_DESC"),
			exportDone: translate("HWHVACUUM_SETTINGS_EXPORT_DONE"),
			importDone: translate("HWHVACUUM_SETTINGS_IMPORT_DONE"),
			parseError: translate("HWHVACUUM_SETTINGS_IMPORT_PARSE_ERROR")
		};
	}
	function getVacuumSettingsImportData(value, translate) {
		const payloadRecord = isPlainObject(value) ? value : {};
		const dataRecord = isPlainObject(payloadRecord.data) ? payloadRecord.data : {};
		if (payloadRecord.scriptId !== "hwhvacuum" || !isPlainObject(payloadRecord.data)) throw new Error(translate("HWHVACUUM_SETTINGS_IMPORT_INVALID"));
		if (isPlainObject(dataRecord.settings)) return dataRecord.settings;
		const importedSettings = mergeVacuumTransferBlocks(dataRecord);
		if (Object.keys(importedSettings).length === 0) throw new Error(translate("HWHVACUUM_SETTINGS_IMPORT_INVALID"));
		return importedSettings;
	}
	async function applyVacuumSettingsImportData(settingsData, store, translate) {
		return applyPlainSettingsImportPayload({
			payload: {
				...store.state,
				...isPlainObject(settingsData) ? settingsData : {}
			},
			normalize: normalizeSettings,
			write: async (normalized) => {
				replaceSettingsState(store.state, normalized);
				await store.save();
			},
			invalidMessage: translate("HWHVACUUM_SETTINGS_IMPORT_INVALID")
		});
	}
	function createVacuumSettingsTransferController({ translate, getUserId, getScriptInfo, showNotice }) {
		const transferOptions = buildVacuumSettingsTransferOptions(translate);
		return createSettingsTransferController({
			buildPayload: (settings, userInfo) => {
				const scriptInfo = getScriptInfo();
				return buildVacuumSettingsExportPayload(settings, userInfo, {
					scriptName: scriptInfo.name,
					scriptVersion: scriptInfo.version,
					getUserId
				});
			},
			buildFileName: (payload) => {
				return buildVacuumSettingsExportFileName((isPlainObject(payload) ? payload : {}).userId);
			},
			parseImport: (value) => getVacuumSettingsImportData(value, translate),
			applyImport: (settingsData, store) => applyVacuumSettingsImportData(settingsData, asVacuumSettingsStore(store), translate),
			showNotice,
			labels: buildVacuumSettingsTransferLabels(translate),
			exportOptions: transferOptions,
			importOptions: transferOptions,
			filterImportPayload: filterVacuumSettingsTransferPayload,
			alwaysShowChecklist: true
		});
	}
	function splitVacuumSettingsForTransfer(settings) {
		const normalized = normalizeSettings(settings);
		return {
			shops: pickVacuumTransferBlock(normalized, "shops"),
			exchange: pickVacuumTransferBlock(normalized, "exchange"),
			interface: pickVacuumTransferBlock(normalized, "interface")
		};
	}
	function filterVacuumSettingsTransferPayload(payload, selectedKeys = []) {
		const payloadRecord = isPlainObject(payload) ? payload : {};
		const dataRecord = isPlainObject(payloadRecord.data) ? payloadRecord.data : {};
		if (isPlainObject(dataRecord.settings)) {
			const selectedBlocks = selectedKeys.filter((key) => key in VACUUM_TRANSFER_BLOCK_KEYS);
			if (selectedBlocks.length === 0) return payload;
			return filterSettingsTransferPayloadData({
				...payloadRecord,
				data: splitVacuumSettingsForTransfer(dataRecord.settings)
			}, selectedBlocks);
		}
		return filterSettingsTransferPayloadData(payload, selectedKeys);
	}
	function pickVacuumTransferBlock(settings, blockKey) {
		const source = settings;
		const block = {};
		for (const key of VACUUM_TRANSFER_BLOCK_KEYS[blockKey]) block[key] = source[key];
		return block;
	}
	function mergeVacuumTransferBlocks(data) {
		const settings = {};
		Object.keys(VACUUM_TRANSFER_BLOCK_KEYS).forEach((blockKey) => {
			const block = data[blockKey];
			if (!isPlainObject(block)) return;
			for (const key of VACUUM_TRANSFER_BLOCK_KEYS[blockKey]) if (Object.hasOwn(block, key)) settings[key] = block[key];
		});
		return settings;
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
	//#region src/scripts/hwhvacuum/ui/result-summary.ts
	function createVacuumResultSummaryPropsBuilder({ translate, formatNumber }) {
		const buildResultAccordionModel = createResultSummaryBuilder({
			kind: "shop",
			tone: "shop",
			rowKind: "shop",
			formatCount: formatNumber
		}).buildAccordionModel;
		const buildInlineIcon = (iconName, className = "hwhx-blue", title = "") => renderInlineIcon(iconName, {
			className,
			title
		});
		const buildIconLabel = (iconName, label, className = "hwhx-blue", title = "") => renderIconLabel(iconName, label, {
			className,
			iconClassName: className,
			title
		});
		function buildSummaryItemLine(label, amountText, icon = "package") {
			return `<span class="hwhx-summary-item" data-kind="shop">${buildInlineIcon(icon, "", String(label !== null && label !== void 0 ? label : ""))}<span class="hwhx-summary-item__name">${escapeHtml(label)}</span><span class="hwhx-summary-item__amount">${escapeHtml(amountText)}</span></span>`;
		}
		function formatRewardBalanceSummary(rewardBalances) {
			return (rewardBalances !== null && rewardBalances !== void 0 ? rewardBalances : []).filter((entry) => Number(entry.amount) > 0).map((entry) => `${formatNumber(entry.amount)} ${entry.label}`).join(", ");
		}
		function buildRewardSuffix(rewardBalances) {
			const rewardText = formatRewardBalanceSummary(rewardBalances);
			return rewardText ? translate("HWHVACUUM_SUMMARY_REWARD_SUFFIX", { reward: rewardText }) : "";
		}
		function buildResultProgressProps(summary, messageHtml = "") {
			var _summary$exchangeActi;
			const exchangeRows = ((_summary$exchangeActi = summary.exchangeActions) !== null && _summary$exchangeActi !== void 0 ? _summary$exchangeActi : []).map((entry) => {
				if (!entry.success) {
					const label = entry.actionKind === "artifactFragmentSale" ? `${entry.groupLabel}: ${entry.label}` : entry.label;
					return buildIconLabel("alert-triangle", `${label}${entry.errorMessage ? `: ${entry.errorMessage}` : ""}`, "hwhx-danger");
				}
				if (entry.actionKind === "artifactFragmentSale") return buildIconLabel(entry.icon, translate("HWHVACUUM_SUMMARY_ARTIFACT_FRAGMENT_SALE_ROW", {
					group: entry.groupLabel,
					name: entry.label,
					amount: formatNumber(entry.fragmentAmount),
					reward: buildRewardSuffix(entry.rewardBalances)
				}), "");
				return buildIconLabel(entry.icon, translate("HWHVACUUM_SUMMARY_SOUL_EXCHANGE_ROW", {
					name: entry.label,
					amount: formatNumber(entry.coinAmount)
				}), "");
			});
			const shopAccordions = summary.purchasesByShop.flatMap((shopSummary, index) => {
				const definition = getShopDefinition(shopSummary.shopId);
				const rows = [...shopSummary.items.values()].map((item) => buildSummaryItemLine(item.label, `x${formatNumber(item.amount)}`));
				const accordion = buildResultAccordionModel({
					title: shopSummary.shopName,
					icon: definition.icon,
					rows,
					tone: "shop",
					rowKind: "shop",
					defaultOpen: index === 0
				});
				return accordion ? [accordion] : [];
			});
			const purchaseAccordions = shopAccordions.length > 0 ? shopAccordions : [buildResultAccordionModel({
				title: translate("HWHVACUUM_SUMMARY_PURCHASES"),
				icon: "shopping-cart",
				rows: [`<span class="hwhx-muted">${escapeHtml(translate("HWHVACUUM_SUMMARY_EMPTY_PURCHASES"))}</span>`],
				tone: "technical",
				rowKind: "technical",
				defaultOpen: true
			})].filter((accordion) => accordion !== null);
			const spentRows = summary.spentByCurrency.map((entry) => {
				var _entry$label;
				return buildIconLabel("coins", translate("HWHVACUUM_SUMMARY_SPENT_CURRENCY", {
					name: String((_entry$label = entry.label) !== null && _entry$label !== void 0 ? _entry$label : ""),
					spent: formatNumber(entry.amount),
					left: formatNumber(entry.remainingAmount)
				}), "");
			});
			const failedRows = summary.failures.map((message) => buildIconLabel("alert-triangle", message, "hwhx-danger"));
			return {
				className: "hwhx-popup hwhx-popup--compact",
				messageHtml,
				accordions: [
					buildResultAccordionModel({
						title: translate("HWHVACUUM_SUMMARY_SOUL_EXCHANGE"),
						icon: "sparkles",
						rows: exchangeRows,
						tone: "technical",
						rowKind: "technical",
						defaultOpen: true
					}),
					...purchaseAccordions,
					buildResultAccordionModel({
						title: translate("HWHVACUUM_SUMMARY_SPENT"),
						icon: "coins",
						rows: spentRows.length > 0 ? spentRows : [escapeHtml(translate("HWHVACUUM_SUMMARY_EMPTY_SPENT"))],
						tone: "technical",
						rowKind: "spent",
						defaultOpen: true
					}),
					buildResultAccordionModel({
						title: translate("HWHVACUUM_SUMMARY_FAILED"),
						icon: "alert-triangle",
						rows: failedRows,
						tone: "technical",
						rowKind: "technical",
						defaultOpen: true
					})
				].filter((accordion) => accordion !== null)
			};
		}
		return buildResultProgressProps;
	}
	//#endregion
	//#region src/scripts/hwhvacuum/runtime/snapshot.ts
	var VACUUM_BASE_SNAPSHOT_CALLS = [
		"shopGetAll",
		"inventoryGet",
		"userGetInfo"
	];
	var VACUUM_PET_SNAPSHOT_CALL = {
		name: "pet_getAll",
		args: {},
		ident: "pet_getAll"
	};
	function normalizeVacuumSnapshotOptions(options = {}) {
		const includeExchangeData = !!options.includeExchangeData;
		return {
			includeShops: options.includeShops !== false,
			includeUserInfo: options.includeUserInfo !== false,
			includeHeroes: includeExchangeData || !!options.includeHeroes,
			includeTitans: includeExchangeData || !!options.includeTitans,
			includePets: includeExchangeData || !!options.includePets
		};
	}
	function buildVacuumSnapshotCalls(options = {}) {
		const normalizedOptions = normalizeVacuumSnapshotOptions(options);
		const calls = [];
		if (normalizedOptions.includeShops) calls.push(VACUUM_BASE_SNAPSHOT_CALLS[0]);
		calls.push(VACUUM_BASE_SNAPSHOT_CALLS[1]);
		if (normalizedOptions.includeUserInfo) calls.push(VACUUM_BASE_SNAPSHOT_CALLS[2]);
		if (normalizedOptions.includeHeroes) calls.push("heroGetAll");
		if (normalizedOptions.includeTitans) calls.push("titanGetAll");
		if (normalizedOptions.includePets) calls.push(VACUUM_PET_SNAPSHOT_CALL);
		return calls;
	}
	function normalizeVacuumSnapshotResponse(response, options = {}) {
		var _ref, _ref2, _petsResultRecord$res;
		const normalizedOptions = normalizeVacuumSnapshotOptions(options);
		const resultList = Array.isArray(response) ? response : [];
		let resultIndex = 0;
		const shops = normalizedOptions.includeShops ? resultList[resultIndex++] : {};
		const inventory = resultList[resultIndex++];
		const userInfo = normalizedOptions.includeUserInfo ? resultList[resultIndex++] : {};
		const heroes = normalizedOptions.includeHeroes ? resultList[resultIndex++] : {};
		const titans = normalizedOptions.includeTitans ? resultList[resultIndex++] : {};
		const pets = normalizedOptions.includePets ? resultList[resultIndex] : {};
		const petsRecord = asPlainRecord(pets);
		const petsResultRecord = asPlainRecord(petsRecord.result);
		return {
			shops: asPlainRecord(shops),
			inventory: asPlainRecord(inventory),
			userInfo: asPlainRecord(userInfo),
			heroes: asPlainRecord(heroes),
			titans: asPlainRecord(titans),
			pets: asPlainRecord((_ref = (_ref2 = (_petsResultRecord$res = petsResultRecord.response) !== null && _petsResultRecord$res !== void 0 ? _petsResultRecord$res : petsRecord.response) !== null && _ref2 !== void 0 ? _ref2 : pets) !== null && _ref !== void 0 ? _ref : {})
		};
	}
	async function fetchVacuumSnapshot(caller, options = {}) {
		return normalizeVacuumSnapshotResponse(await caller.send(buildVacuumSnapshotCalls(options)), options);
	}
	//#endregion
	//#region src/scripts/hwhvacuum/runtime/runner.ts
	function createVacuumRunner([normalizeSettings, buildSnapshotOptions, fetchSnapshot, getSnapshotBalances, getSnapshotShops, buildExchangePlan, executeExchangeActions, applyExchangeRewardsToBalances, shouldRunShopPurchases, buildPurchasePlan, sendPurchaseCalls, summarizePurchases, buildPostRunSyncMessage, showRunResult, translate, setProgress, setStageProgress, formatErrorProgress]) {
		return async function runShopVacuum(settings, options = {}) {
			try {
				const normalizedSettings = normalizeSettings(settings);
				setStageProgress({
					phase: "loading",
					detail: translate("HWHVACUUM_PROGRESS_PREPARE")
				});
				const runShopPurchases = shouldRunShopPurchases(normalizedSettings, options);
				const snapshot = await fetchSnapshot(buildSnapshotOptions(normalizedSettings, options));
				const initialBalances = runShopPurchases ? getSnapshotBalances(snapshot) : {};
				const exchangePlan = buildExchangePlan(normalizedSettings, snapshot, options);
				setStageProgress({
					phase: "planning",
					itemCount: exchangePlan.length,
					detail: translate("HWHVACUUM_SOUL_EXCHANGE_PROGRESS"),
					explainSingleBatch: false
				});
				const exchangeActions = await executeExchangeActions(exchangePlan);
				const balances = runShopPurchases ? applyExchangeRewardsToBalances(initialBalances, exchangeActions) : initialBalances;
				const { calls, plannedPurchases } = runShopPurchases ? buildPurchasePlan(normalizedSettings, getSnapshotShops(snapshot), balances) : {
					calls: [],
					plannedPurchases: []
				};
				const purchaseCallCount = calls.length;
				if (purchaseCallCount === 0 && exchangeActions.length === 0) {
					setProgress(translate("HWHVACUUM_PROGRESS_NOTHING"), true);
					return;
				}
				let purchaseResults = [];
				if (purchaseCallCount > 0) purchaseResults = await sendPurchaseCalls(calls);
				setStageProgress({
					phase: "applying",
					itemCount: purchaseResults.length + exchangeActions.length,
					detail: translate("HWHVACUUM_PROGRESS_DONE", { count: purchaseResults.length }),
					explainSingleBatch: false
				});
				showRunResult(summarizePurchases(plannedPurchases, purchaseResults, balances, exchangeActions), buildPostRunSyncMessage({
					settings: normalizedSettings,
					options
				}));
			} catch (error) {
				console.error("[Vacuum] Error:", error);
				setProgress(formatErrorProgress(error), true);
			}
		};
	}
	//#endregion
	//#region src/scripts/hwhvacuum/runtime/index.ts
	function initializeShopVacuumExtension(attempt) {
		"use strict";
		var _GM_info;
		if (!retryHwhRuntimeInitialization({
			attempt: Number(attempt) || 0,
			maxAttempts: 120,
			delayMs: 500,
			requiredKeys: [
				"HWHFuncs",
				"HWHData",
				"HWHClasses",
				"Caller"
			],
			retry: initializeShopVacuumExtension,
			logPrefix: "[Vacuum]",
			scriptName: "HWH Shop Vacuum"
		})) return;
		installSettingsDownloadBridge();
		const { HWHFuncs, HWHData, HWHClasses, cheats } = globalThis;
		const Caller = requireHeroWarsCaller(globalThis);
		const { addExtentionName: addExtensionName, I18N } = HWHFuncs;
		const progressController = createRuntimeProgressController({
			scriptId: "hwhvacuum",
			title: GM_info.script.name
		});
		const { setProgress, showResult, configure: configureProgress } = progressController;
		const i18nLangData = getVacuumTranslations();
		const mainMenuButtons = HWHData.buttons && typeof HWHData.buttons === "object" ? HWHData.buttons : HWHData.buttons = {};
		const othersPopupButtons = Array.isArray(HWHData.othersPopupButtons) ? HWHData.othersPopupButtons : HWHData.othersPopupButtons = [];
		const translate = createTranslator({
			I18N,
			i18nLangData,
			preferGameI18N: false,
			fallbackLanguage: "en",
			cacheMissingTranslations: true
		});
		const formatNumber = createNumberFormatter({ locale: "ru-RU" });
		const gameItemIconResolver = void 0;
		function isPlainRecord(value) {
			return value !== null && typeof value === "object" && !Array.isArray(value);
		}
		function getPlainRecord(value) {
			return isPlainRecord(value) ? value : {};
		}
		function getRecordValue(container, key) {
			return getPlainRecord(container)[String(key)];
		}
		function hasOwnRecordKey(record, key) {
			return Object.prototype.hasOwnProperty.call(record, key);
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
		const buildIconLabel = (iconName, label, className = "hwhx-blue", title = "") => renderIconLabel(iconName, label, {
			className,
			iconClassName: className,
			title
		});
		const settingsStorage = new VersionedStorage({
			keyPrefix: SETTINGS_KEY,
			schemaVersion: 4
		});
		const buildDoYourBestPlacementOptionsFromTasks = createDoYourBestPlacementOptionsBuilder({
			translate,
			keys: {
				none: "HWHVACUUM_DO_YOUR_BEST_PLACEMENT_NONE",
				end: "HWHVACUUM_DO_YOUR_BEST_PLACEMENT_END",
				before: "HWHVACUUM_DO_YOUR_BEST_PLACEMENT_BEFORE",
				after: "HWHVACUUM_DO_YOUR_BEST_PLACEMENT_AFTER"
			}
		});
		const getDoYourBestTaskListSnapshot = createDoYourBestTaskListSnapshotReader({
			getDoYourBestClass: () => getHeroWarsDoYourBestClass(HWHClasses),
			logPrefix: "[Vacuum]"
		});
		const buildPostRunSyncMessage = createPostRunSyncMessageBuilder({
			buildSuccessMessage: () => `<br>${buildIconLabel("refresh-cw", translate("HWHVACUUM_POST_SYNC_DONE"), "")}`,
			buildFailureMessage: () => `<br>${buildIconLabel("refresh-cw", translate("HWHVACUUM_POST_SYNC_FAILED"), "hwhx-gold")}`,
			logPrefix: "[Vacuum]"
		});
		console.log(`%c${translate("HWHVACUUM_START_LOG", {
			name: GM_info.script.name,
			author: GM_info.script.author,
			version: GM_info.script.version
		})}`, "color: #ff9c57");
		addExtensionName(GM_info.script.name, GM_info.script.version, GM_info.script.author);
		const scriptInfo = readRuntimeUserscriptInfo((_GM_info = GM_info) === null || _GM_info === void 0 ? void 0 : _GM_info.script);
		const libraryTranslationCache = /* @__PURE__ */ new Map();
		const libraryDataCache = /* @__PURE__ */ new Map();
		const libraryEntityConfigCache = /* @__PURE__ */ new Map();
		const libraryTypeConfigCache = /* @__PURE__ */ new Map();
		const soulExchangeTypeSet = new Set(SOUL_EXCHANGE_TYPES);
		const soulExchangeRuntimeDescriptors = {
			heroes: {
				collectionKey: "heroes",
				inventoryTypes: ["fragmentHero"],
				translationKeyPrefix: "LIB_HERO_NAME_"
			},
			titans: {
				collectionKey: "titans",
				inventoryTypes: ["fragmentTitan"],
				translationKeyPrefix: "LIB_TITAN_NAME_"
			},
			pets: {
				collectionKey: "pets",
				inventoryTypes: [
					"fragmentPet",
					"petSoulStone",
					"petStone",
					"petFragment",
					"fragmentPetStone"
				],
				translationKeyPrefix: "LIB_PET_NAME_"
			}
		};
		async function openDocumentationModal() {
			await openRuntimeDocumentationModal(translate);
		}
		async function openDonateModal() {
			await openRuntimeDonateModal(translate);
		}
		function getShopName(shopId) {
			return translate(getShopDefinition(shopId).nameKey, { id: shopId });
		}
		function getCurrencyName(currencyKey) {
			var _normalizedKey$split$;
			const normalizedKey = String(currencyKey !== null && currencyKey !== void 0 ? currencyKey : "");
			const definition = getCurrencyDefinition(normalizedKey);
			const currencyId = (_normalizedKey$split$ = normalizedKey.split(":")[1]) !== null && _normalizedKey$split$ !== void 0 ? _normalizedKey$split$ : "?";
			return translate(definition.nameKey, { id: currencyId });
		}
		const settingsRepository = createSettingsRepository({
			storage: settingsStorage,
			defaultValue: DEFAULT_NORMALIZED_VACUUM_SETTINGS,
			normalize: normalizeSettings,
			afterRead: (settings) => {
				configureProgress(settings);
				setAccordionAutoScrollMode(settings.accordionAutoScrollMode);
			},
			afterWrite: (settings) => {
				configureProgress(settings);
				setAccordionAutoScrollMode(settings.accordionAutoScrollMode);
				syncVacuumActionPlacement(settings);
				registerDoYourBestVacuumTask();
			}
		});
		const readSettings = settingsRepository.readSync;
		const writeSettings = settingsRepository.writeSync;
		const { useStore: useVacuumSettingsStore } = createLocalforageSettingsStore("hwhvacuum", DEFAULT_NORMALIZED_VACUUM_SETTINGS, normalizeSettings, {
			read: () => readSettings(),
			write: (settings) => writeSettings(settings)
		});
		function isVacuumDoYourBestTask(task) {
			return getDoYourBestTaskName(task) === DO_YOUR_BEST_TASK_NAME;
		}
		function parseCostDetails(cost) {
			for (const [costType, amounts] of Object.entries(getPlainRecord(cost))) {
				if (costType === "gold") {
					const amountRecord = getPlainRecord(amounts);
					const numericAmount = Number(amounts) || Number(getRecordValue(amountRecord, 0)) || Number(getRecordValue(amountRecord, "0")) || Number(amountRecord.gold) || 0;
					if (numericAmount > 0) return {
						costType,
						currencyId: "0",
						amount: numericAmount,
						balanceKey: "gold:0",
						currencyLabel: getCurrencyName("gold:0")
					};
					continue;
				}
				for (const [currencyId, amount] of Object.entries(getPlainRecord(amounts))) {
					const numericAmount = Number(amount) || 0;
					if (numericAmount <= 0) continue;
					const balanceKey = `${costType}:${currencyId}`;
					return {
						costType,
						currencyId: String(currencyId),
						amount: numericAmount,
						balanceKey,
						currencyLabel: getCurrencyName(balanceKey)
					};
				}
			}
			return null;
		}
		function getTranslatedLibraryName(translationKey) {
			const normalizedKey = String(translationKey !== null && translationKey !== void 0 ? translationKey : "").trim();
			if (libraryTranslationCache.has(normalizedKey)) {
				var _libraryTranslationCa;
				return (_libraryTranslationCa = libraryTranslationCache.get(normalizedKey)) !== null && _libraryTranslationCa !== void 0 ? _libraryTranslationCa : "";
			}
			const translatedName = normalizedKey && typeof (cheats === null || cheats === void 0 ? void 0 : cheats.translate) === "function" ? cheats.translate(normalizedKey) : "";
			const name = translatedName && translatedName !== normalizedKey ? translatedName : "";
			libraryTranslationCache.set(normalizedKey, name);
			return name;
		}
		function getLibraryData(sectionName) {
			const normalizedSectionName = String(sectionName !== null && sectionName !== void 0 ? sectionName : "").trim();
			const libObject = getPlainRecord(globalThis.lib);
			if (!normalizedSectionName || !libObject) return {};
			const cachedData = libraryDataCache.get(normalizedSectionName);
			if (cachedData) return cachedData;
			const nestedData = getPlainRecord(getPlainRecord(libObject.data)[normalizedSectionName]);
			if (Object.keys(nestedData).length > 0) {
				libraryDataCache.set(normalizedSectionName, nestedData);
				return nestedData;
			}
			const directData = getPlainRecord(libObject[normalizedSectionName]);
			if (Object.keys(directData).length > 0) {
				libraryDataCache.set(normalizedSectionName, directData);
				return directData;
			}
			if (typeof libObject.getData === "function") try {
				const loadedData = getPlainRecord(libObject.getData(normalizedSectionName));
				libraryDataCache.set(normalizedSectionName, loadedData);
				return loadedData;
			} catch (_unused) {
				return {};
			}
			return {};
		}
		function getLibraryEntityConfig(sectionName, entityId) {
			var _getRecordValue;
			const normalizedId = Math.max(0, Number(entityId) || 0);
			if (normalizedId <= 0) return;
			const cacheKey = `${String(sectionName !== null && sectionName !== void 0 ? sectionName : "")}:${normalizedId}`;
			if (libraryEntityConfigCache.has(cacheKey)) return libraryEntityConfigCache.get(cacheKey);
			const sectionData = getLibraryData(sectionName);
			const config = (_getRecordValue = getRecordValue(sectionData, normalizedId)) !== null && _getRecordValue !== void 0 ? _getRecordValue : getRecordValue(getPlainRecord(sectionData.id), normalizedId);
			const normalizedConfig = isPlainRecord(config) ? config : void 0;
			libraryEntityConfigCache.set(cacheKey, normalizedConfig);
			return normalizedConfig;
		}
		function getLibraryTypeConfig(sectionName, typeName) {
			const normalizedTypeName = String(typeName !== null && typeName !== void 0 ? typeName : "").trim();
			if (!normalizedTypeName) return;
			const cacheKey = `${String(sectionName !== null && sectionName !== void 0 ? sectionName : "")}:${normalizedTypeName}`;
			if (libraryTypeConfigCache.has(cacheKey)) return libraryTypeConfigCache.get(cacheKey);
			const config = getRecordValue(getPlainRecord(getLibraryData(sectionName).type), normalizedTypeName);
			const normalizedConfig = isPlainRecord(config) ? config : void 0;
			libraryTypeConfigCache.set(cacheKey, normalizedConfig);
			return normalizedConfig;
		}
		function getHeroArtifactName(artifactId) {
			return getTranslatedLibraryName(`LIB_ARTIFACT_NAME_${artifactId}`) || translate("HWHVACUUM_ITEM_GENERIC", { id: artifactId });
		}
		function getTitanArtifactName(artifactId) {
			return getTranslatedLibraryName(`LIB_TITAN_ARTIFACT_NAME_${artifactId}`) || translate("HWHVACUUM_ITEM_GENERIC", { id: artifactId });
		}
		function getHeroArtifactEvolutionRows(artifactId) {
			const artifactConfig = getLibraryEntityConfig("artifact", artifactId);
			return getArtifactEvolutionRowsFromTypeConfig(getLibraryTypeConfig("artifact", artifactConfig === null || artifactConfig === void 0 ? void 0 : artifactConfig.type));
		}
		function getTitanArtifactEvolutionRows(artifactId, slotId) {
			const artifactConfig = getLibraryEntityConfig("titanArtifact", artifactId);
			return getArtifactEvolutionRowsFromTypeConfig(getLibraryTypeConfig("titanArtifact", Number(slotId) === 2 ? "amulet" : artifactConfig === null || artifactConfig === void 0 ? void 0 : artifactConfig.type));
		}
		function collectHeroArtifactFragmentSaleEntries(snapshot) {
			const inventory = snapshot.inventory;
			const usageByArtifactId = /* @__PURE__ */ new Map();
			const blockedArtifactIds = /* @__PURE__ */ new Set();
			const heroMap = getEntityMap(snapshot.heroes);
			for (const heroId in heroMap) {
				if (hasOwnRecordKey(heroMap, heroId) === false) continue;
				const heroData = heroMap[heroId];
				const heroRecord = getPlainRecord(heroData);
				const heroConfig = getLibraryEntityConfig("hero", heroId);
				const artifactIds = Array.isArray(heroConfig === null || heroConfig === void 0 ? void 0 : heroConfig.artifacts) ? heroConfig.artifacts : [];
				for (let slotId = 0; slotId < artifactIds.length; slotId += 1) {
					const artifactIdValue = artifactIds[slotId];
					const artifactId = Math.max(0, Number(artifactIdValue) || 0);
					if (artifactId <= 0) continue;
					const evolutionRows = getHeroArtifactEvolutionRows(artifactId);
					if (evolutionRows.length <= 0) {
						blockedArtifactIds.add(artifactId);
						continue;
					}
					appendArtifactFragmentUsage(usageByArtifactId, artifactId, getHeroArtifactName(artifactId), getRemainingArtifactFragmentCost(evolutionRows, getNestedRecord(heroRecord.artifacts, slotId).star));
				}
			}
			return collectSurplusArtifactFragmentEntries({
				inventory,
				inventoryTypes: HERO_ARTIFACT_FRAGMENT_INVENTORY_TYPES,
				usageByArtifactId,
				blockedArtifactIds
			});
		}
		function collectTitanArtifactFragmentSaleEntries(snapshot) {
			const inventory = snapshot.inventory;
			const usageByArtifactId = /* @__PURE__ */ new Map();
			const blockedArtifactIds = /* @__PURE__ */ new Set();
			const titanMap = getEntityMap(snapshot.titans);
			for (const titanId in titanMap) {
				if (hasOwnRecordKey(titanMap, titanId) === false) continue;
				const titanData = titanMap[titanId];
				const titanRecord = getPlainRecord(titanData);
				const titanConfig = getLibraryEntityConfig("titan", titanId);
				const artifactIds = Array.isArray(titanConfig === null || titanConfig === void 0 ? void 0 : titanConfig.artifacts) ? titanConfig.artifacts : [];
				for (const slotId of TITAN_ARTIFACT_SLOT_IDS) {
					const artifactId = Math.max(0, Number(artifactIds[slotId]) || 0);
					if (artifactId <= 0) continue;
					const evolutionRows = getTitanArtifactEvolutionRows(artifactId, slotId);
					if (evolutionRows.length <= 0) {
						blockedArtifactIds.add(artifactId);
						continue;
					}
					appendArtifactFragmentUsage(usageByArtifactId, artifactId, getTitanArtifactName(artifactId), getRemainingArtifactFragmentCost(evolutionRows, getNestedRecord(titanRecord.artifacts, slotId).star));
				}
			}
			return collectSurplusArtifactFragmentEntries({
				inventory,
				inventoryTypes: TITAN_ARTIFACT_FRAGMENT_INVENTORY_TYPES,
				usageByArtifactId,
				blockedArtifactIds
			});
		}
		function collectExchangeableSoulEntries(snapshot, exchangeType) {
			var _soulExchangeRuntimeD;
			const inventory = snapshot.inventory;
			const descriptor = (_soulExchangeRuntimeD = soulExchangeRuntimeDescriptors[String(exchangeType)]) !== null && _soulExchangeRuntimeD !== void 0 ? _soulExchangeRuntimeD : soulExchangeRuntimeDescriptors.heroes;
			const collection = snapshot[descriptor.collectionKey];
			const entries = [];
			const entityMap = getEntityMap(collection);
			for (const entityId in entityMap) {
				if (hasOwnRecordKey(entityMap, entityId) === false) continue;
				const entityData = entityMap[entityId];
				const numericEntityId = Number(entityId);
				if (!Number.isFinite(numericEntityId) || numericEntityId <= 0) continue;
				const stars = getEntityStarCount(entityData);
				if (stars < 6) continue;
				const amount = getInventoryAmountByTypes(inventory, descriptor.inventoryTypes, numericEntityId);
				if (amount <= 0) continue;
				entries.push({
					id: numericEntityId,
					name: getTranslatedLibraryName(`${descriptor.translationKeyPrefix}${numericEntityId}`) || translate("HWHVACUUM_ITEM_GENERIC", { id: numericEntityId }),
					stars,
					amount
				});
			}
			entries.sort((left, right) => right.amount - left.amount || compareRussianText(left.name, right.name));
			return entries;
		}
		function getItemName(rewardType, itemIdValue) {
			const normalizedRewardType = String(rewardType !== null && rewardType !== void 0 ? rewardType : "");
			const itemId = String(itemIdValue !== null && itemIdValue !== void 0 ? itemIdValue : "");
			if (!itemId) return translate("HWHVACUUM_ITEM_GENERIC", { id: "?" });
			if (normalizedRewardType === "consumable" && Number(itemId) === 65) return translate("HWHVACUUM_ITEM_SKIN_STONE_CHEST");
			if (normalizedRewardType === "fragmentHero") {
				const heroName = getTranslatedLibraryName(`LIB_HERO_NAME_${itemId}`) || translate("HWHVACUUM_ITEM_GENERIC", { id: itemId });
				return translate("HWHVACUUM_ITEM_HERO_SOUL_TEMPLATE", { name: heroName });
			}
			const baseType = normalizedRewardType === "fragmentGear" ? "gear" : normalizedRewardType === "fragmentScroll" ? "scroll" : normalizedRewardType;
			const baseName = getTranslatedLibraryName(baseType === "gear" ? `LIB_GEAR_NAME_${itemId}` : baseType === "scroll" ? `LIB_SCROLL_NAME_${itemId}` : baseType === "consumable" ? `LIB_CONSUMABLE_NAME_${itemId}` : "") || translate(baseType === "gear" ? "HWHVACUUM_ITEM_GEAR" : baseType === "scroll" ? "HWHVACUUM_ITEM_SCROLL" : baseType === "consumable" ? "HWHVACUUM_ITEM_CONSUMABLE" : "HWHVACUUM_ITEM_GENERIC", { id: itemId });
			return normalizedRewardType.startsWith("fragment") ? translate("HWHVACUUM_ITEM_FRAGMENT_TEMPLATE", { name: baseName }) : baseName;
		}
		function buildVacuumPlan(settings, shopsState, balances) {
			const calls = [];
			const plannedPurchases = [];
			const workingBalances = { ...balances !== null && balances !== void 0 ? balances : {} };
			for (const shopId of SHOP_IDS) {
				if (!settings.enabledShops[shopId]) continue;
				const shopRecord = getPlainRecord(getShopState(shopsState, shopId));
				const slots = getOrderedShopSlots(shopRecord);
				for (const slot of slots) {
					var _shopRecord$id, _shopRecord$id2;
					if ((slot === null || slot === void 0 ? void 0 : slot.bought) || !(slot === null || slot === void 0 ? void 0 : slot.reward) || !(slot === null || slot === void 0 ? void 0 : slot.cost)) continue;
					const costDetails = parseCostDetails(slot.cost);
					if (!costDetails) continue;
					const purchaseOption = resolveSlotPurchaseOption(settings, shopId, slot, costDetails);
					if (!purchaseOption) continue;
					const currentBalance = Number(workingBalances[costDetails.balanceKey]) || 0;
					const currencyLimit = getCurrencyLimit(settings, costDetails.balanceKey);
					if (currentBalance - costDetails.amount < currencyLimit) continue;
					const call = {
						name: "shopBuy",
						args: {
							shopId: Number((_shopRecord$id = shopRecord.id) !== null && _shopRecord$id !== void 0 ? _shopRecord$id : shopId),
							slot: Number(slot.id),
							cost: slot.cost,
							reward: slot.reward
						},
						ident: `vacuum_${(_shopRecord$id2 = shopRecord.id) !== null && _shopRecord$id2 !== void 0 ? _shopRecord$id2 : shopId}_${slot.id}`
					};
					workingBalances[costDetails.balanceKey] = currentBalance - costDetails.amount;
					calls.push(call);
					plannedPurchases.push({
						call,
						shopId,
						shopName: getShopName(shopId),
						slotId: Number(slot.id),
						purchaseOption,
						cost: costDetails,
						rewardItems: collectRewardItems(slot.reward, getItemName)
					});
				}
			}
			return {
				calls,
				plannedPurchases
			};
		}
		function buildExcessExchangePlan(settings, snapshot, options = void 0) {
			const plan = [];
			for (const exchangeType of getEnabledExcessExchangeTypes(settings, options)) {
				if (soulExchangeTypeSet.has(exchangeType)) {
					const definition = getPlainRecord(SOUL_EXCHANGE_DEFINITIONS[exchangeType]);
					const entries = collectExchangeableSoulEntries(snapshot, exchangeType);
					let amount = 0;
					for (const entry of entries) amount += Number(entry.amount) || 0;
					if (shouldExecuteSoulExchange(definition, amount)) plan.push({
						exchangeType,
						actionKind: "soulExchange",
						definition,
						entries,
						amount,
						call: getPlainRecord(definition.call)
					});
					continue;
				}
				const definition = getPlainRecord(ARTIFACT_FRAGMENT_SALE_DEFINITIONS[exchangeType]);
				const entries = exchangeType === "heroArtifactFragments" ? collectHeroArtifactFragmentSaleEntries(snapshot) : collectTitanArtifactFragmentSaleEntries(snapshot);
				for (const entry of entries) plan.push({
					exchangeType,
					actionKind: "artifactFragmentSale",
					definition,
					entry,
					amount: entry.amount,
					call: {
						name: "inventorySell",
						args: {
							type: definition.inventorySellType,
							libId: entry.id,
							amount: entry.amount,
							fragment: true
						},
						ident: "body"
					}
				});
			}
			return plan;
		}
		function collectRewardBalanceEntries(callResult) {
			var _ref, _resultRecord$respons, _getPlainRecord$rewar;
			const callResultRecord = getPlainRecord(callResult);
			const payload = (_ref = (_resultRecord$respons = getPlainRecord(callResultRecord.result).response) !== null && _resultRecord$respons !== void 0 ? _resultRecord$respons : callResultRecord.response) !== null && _ref !== void 0 ? _ref : callResultRecord;
			const reward = getPlainRecord((_getPlainRecord$rewar = getPlainRecord(payload).reward) !== null && _getPlainRecord$rewar !== void 0 ? _getPlainRecord$rewar : payload);
			const entries = [];
			const goldAmount = Number(reward.gold) || 0;
			if (goldAmount > 0) entries.push({
				key: "gold:0",
				label: getCurrencyName("gold:0"),
				amount: goldAmount
			});
			const coinRewards = getPlainRecord(reward.coin);
			for (const currencyId in coinRewards) {
				if (hasOwnRecordKey(coinRewards, currencyId) === false) continue;
				const numericAmount = Number(coinRewards[currencyId]) || 0;
				if (numericAmount <= 0) continue;
				const key = `coin:${currencyId}`;
				entries.push({
					key,
					label: getCurrencyName(key),
					amount: numericAmount
				});
			}
			const petCoinRewards = getPlainRecord(reward.petcoin);
			for (const currencyId in petCoinRewards) {
				if (hasOwnRecordKey(petCoinRewards, currencyId) === false) continue;
				const numericAmount = Number(petCoinRewards[currencyId]) || 0;
				if (numericAmount <= 0) continue;
				const key = `petcoin:${currencyId}`;
				entries.push({
					key,
					label: getCurrencyName(key),
					amount: numericAmount
				});
			}
			return entries;
		}
		function ensureSoulCoinRewardBalance(rewardBalances, definition, coinAmount) {
			const normalizedCoinAmount = Number(coinAmount) || 0;
			if (normalizedCoinAmount <= 0 || !definition.coinKey) return rewardBalances;
			if (hasSoulCoinRewardBalance(rewardBalances, definition.coinKey)) return rewardBalances;
			rewardBalances.push({
				key: String(definition.coinKey),
				label: getCurrencyName(definition.coinKey),
				amount: normalizedCoinAmount
			});
			return rewardBalances;
		}
		function summarizeExcessExchangeResults(exchangePlan, exchangeResults) {
			const summary = [];
			for (let index = 0; index < exchangePlan.length; index += 1) {
				var _entry$entry$name, _entry$entry, _entry$definition$sho, _entry$definition$sho2;
				const entry = exchangePlan[index];
				if (!entry) continue;
				const result = exchangeResults === null || exchangeResults === void 0 ? void 0 : exchangeResults[index];
				const success = isCallResultSucceeded$1(result);
				const coinAmount = success ? getRewardCoinAmount(result, entry.definition.coinId) : 0;
				const rewardBalances = success ? ensureSoulCoinRewardBalance(collectRewardBalanceEntries(result), entry.definition, coinAmount) : [];
				const isArtifactFragmentSale = entry.actionKind === "artifactFragmentSale";
				summary.push({
					exchangeType: entry.exchangeType,
					actionKind: entry.actionKind,
					label: isArtifactFragmentSale ? String((_entry$entry$name = (_entry$entry = entry.entry) === null || _entry$entry === void 0 ? void 0 : _entry$entry.name) !== null && _entry$entry$name !== void 0 ? _entry$entry$name : "") : translate(String((_entry$definition$sho = entry.definition.shortLabelKey) !== null && _entry$definition$sho !== void 0 ? _entry$definition$sho : "")),
					groupLabel: translate(String((_entry$definition$sho2 = entry.definition.shortLabelKey) !== null && _entry$definition$sho2 !== void 0 ? _entry$definition$sho2 : "")),
					icon: entry.definition.icon,
					coinKey: entry.definition.coinKey,
					coinAmount,
					rewardBalances,
					amount: entry.amount,
					fragmentAmount: isArtifactFragmentSale ? entry.amount : 0,
					success,
					errorMessage: success ? "" : getCallResultErrorMessage$1(result)
				});
			}
			return summary;
		}
		async function executeExcessExchangeActions(exchangePlan) {
			if (!Array.isArray(exchangePlan) || exchangePlan.length <= 0) return [];
			const calls = Array.from({ length: exchangePlan.length });
			for (let index = 0; index < exchangePlan.length; index += 1) calls[index] = exchangePlan[index].call;
			return summarizeExcessExchangeResults(exchangePlan, await vacuumProgress.send(calls, translate("HWHVACUUM_SOUL_EXCHANGE_PROGRESS")));
		}
		const sendCallsInChunks = createChunkedCallSender({
			chunkSize: 20,
			sendChunk: (chunk) => Caller.send(chunk)
		});
		const vacuumProgress = createVacuumProgressReporter({
			...progressController,
			sendCallsInChunks
		});
		const isCallResultSucceeded$1 = isCallResultSucceeded;
		const getCallResultErrorMessage$1 = getCallResultErrorMessage;
		const buildResultProgressProps = createVacuumResultSummaryPropsBuilder({
			translate,
			formatNumber
		});
		const menuSnapshotCache = createExpiringAsyncCache({
			ttlMs: 5e3,
			load: () => fetchVacuumSnapshot(Caller)
		});
		const executeShopVacuum = createVacuumRunner([
			normalizeSettings,
			buildExchangeSnapshotOptions,
			(options) => fetchVacuumSnapshot(Caller, options),
			(snapshot) => buildBalances(snapshot.inventory, snapshot.userInfo),
			(snapshot) => snapshot.shops,
			buildExcessExchangePlan,
			executeExcessExchangeActions,
			applyExchangeRewardsToBalances,
			shouldRunShopPurchases,
			buildVacuumPlan,
			(calls) => vacuumProgress.send(calls, translate("HWHVACUUM_PROGRESS_RUNNING", { count: calls.length })),
			(plannedPurchases, purchaseResults, balances, exchangeActions) => summarizeSuccessfulPurchases({
				plannedPurchases,
				purchaseResults,
				balances,
				exchangeActions,
				isCallResultSucceeded: isCallResultSucceeded$1,
				getCallResultErrorMessage: getCallResultErrorMessage$1
			}),
			buildPostRunSyncMessage,
			(summary, postRunSyncMessage) => showResult("", {
				component: RuntimeResultSummary,
				props: buildResultProgressProps(summary, postRunSyncMessage),
				resultLabel: translate("HWHVACUUM_PROGRESS_DONE", { count: summary.successCount })
			}),
			translate,
			setProgress,
			progressController.setStageProgress,
			(error) => `${translate("HWHVACUUM_PROGRESS_ERROR")}<br>${escapeHtml(getErrorMessage(error, translate("HWHVACUUM_ERROR_GENERIC")))}`
		]);
		const runShopVacuum = async (settings, options = {}) => {
			menuSnapshotCache.invalidate();
			try {
				await executeShopVacuum(settings, options);
			} finally {
				menuSnapshotCache.invalidate();
			}
		};
		function getCurrentUserId(userInfo = void 0) {
			var _ref2, _ref3, _ref4, _userInfoRecord$id, _globalThis$NXFlashVa;
			const userInfoRecord = getPlainRecord(userInfo);
			const hwhDataRecord = getPlainRecord(HWHData);
			const hwhUserRecord = getPlainRecord(hwhDataRecord.user);
			return String((_ref2 = (_ref3 = (_ref4 = (_userInfoRecord$id = userInfoRecord.id) !== null && _userInfoRecord$id !== void 0 ? _userInfoRecord$id : hwhUserRecord.id) !== null && _ref4 !== void 0 ? _ref4 : hwhDataRecord.userId) !== null && _ref3 !== void 0 ? _ref3 : (_globalThis$NXFlashVa = globalThis.NXFlashVars) === null || _globalThis$NXFlashVa === void 0 ? void 0 : _globalThis$NXFlashVa.user_id) !== null && _ref2 !== void 0 ? _ref2 : "").trim() || "unknown";
		}
		function showSettingsNotice(message, iconName = "check", className = "hwhx-green") {
			showResult(buildIconLabel(iconName, String(message !== null && message !== void 0 ? message : ""), className));
		}
		const settingsTransferController = createVacuumSettingsTransferController({
			translate,
			getUserId: getCurrentUserId,
			getScriptInfo: () => {
				var _GM_info2, _GM_info3;
				return {
					name: (_GM_info2 = GM_info) === null || _GM_info2 === void 0 || (_GM_info2 = _GM_info2.script) === null || _GM_info2 === void 0 ? void 0 : _GM_info2.name,
					version: (_GM_info3 = GM_info) === null || _GM_info3 === void 0 || (_GM_info3 = _GM_info3.script) === null || _GM_info3 === void 0 ? void 0 : _GM_info3.version
				};
			},
			showNotice: (message) => showSettingsNotice(message)
		});
		async function exportSettingsVue(store, userInfo) {
			await settingsTransferController.exportToJson({ ...store.state }, userInfo);
		}
		async function importSettingsVue(store) {
			return settingsTransferController.importFromJson(store);
		}
		async function openVacuumMenuVue() {
			const snapshot = createRuntimeShallowReactiveState({
				shops: {},
				inventory: {},
				userInfo: {},
				heroes: {},
				titans: {},
				pets: {}
			});
			const snapshotPromise = menuSnapshotCache.get().then((loadedSnapshot) => {
				Object.assign(snapshot, loadedSnapshot);
				return loadedSnapshot;
			}, (error) => {
				const message = getErrorMessage(error, translate("HWHVACUUM_ERROR_GENERIC"));
				console.error("[Vacuum] snapshot failed", error);
				showSettingsNotice(message, "alert-triangle", "hwhx-danger");
				return snapshot;
			});
			initializeRuntimeUi();
			const store = useVacuumSettingsStore();
			await store.load();
			configureProgress(store.state);
			setAccordionAutoScrollMode(store.state.accordionAutoScrollMode);
			while (true) {
				const currentTasks = getDoYourBestTaskListSnapshot().filter((task) => !isVacuumDoYourBestTask(task));
				const placementOptions = buildDoYourBestPlacementOptionsFromTasks(currentTasks).map((option) => {
					var _option$label;
					return {
						...option,
						label: String((_option$label = option.label) !== null && _option$label !== void 0 ? _option$label : option.value)
					};
				});
				const settingsModalTitle = buildRuntimeSettingsModalTitle(scriptInfo, translate);
				const result = await openRuntimeComponentModal({
					title: settingsModalTitle,
					header: buildRuntimeModalHeader(settingsModalTitle, scriptInfo),
					headerActions: buildRuntimeSettingsHeaderActions(translate),
					component: RuntimeSettingsPanel,
					props: {
						state: store.state,
						snapshot,
						translate,
						doYourBestPlacementOptions: placementOptions,
						saveSettings: () => store.save(),
						gameItemIconResolver
					},
					actions: [
						{
							label: translate("HWHVACUUM_DONATE_TITLE"),
							result: "donate",
							icon: "coins",
							tone: "secondary",
							placement: "left",
							iconOnly: true
						},
						{
							label: translate("HWHVACUUM_SAVE"),
							result: "save",
							icon: "save",
							tone: "success"
						},
						{
							label: translate("HWHVACUUM_RUN"),
							result: "run",
							icon: "play",
							tone: "primary"
						}
					],
					className: "hwhx-popup--wide",
					uiTheme: store.state.uiTheme,
					closeLabel: translate("HWHVACUUM_CLOSE"),
					onAction: async (actionResult) => {
						if (actionResult === "exportSettings") {
							await snapshotPromise;
							await exportSettingsVue(store, snapshot.userInfo);
							return;
						}
						if (actionResult === "dumpGameLibrary") dumpGameLibraryToConsole("hwhvacuum");
					}
				});
				if (!result) return;
				if (result === "enableAllShops") {
					getAvailableShopIds(snapshot === null || snapshot === void 0 ? void 0 : snapshot.shops).forEach((id) => {
						store.state.enabledShops[id] = true;
					});
					continue;
				}
				if (result === "disableAllShops") {
					getAvailableShopIds(snapshot === null || snapshot === void 0 ? void 0 : snapshot.shops).forEach((id) => {
						store.state.enabledShops[id] = false;
					});
					continue;
				}
				if (result === "exportSettings") {
					await snapshotPromise;
					await exportSettingsVue(store, snapshot.userInfo);
					continue;
				}
				if (result === "donate") {
					await openDonateModal();
					continue;
				}
				if (result === "help") {
					await openDocumentationModal();
					continue;
				}
				if (result === "dumpGameLibrary") {
					dumpGameLibraryToConsole("hwhvacuum");
					continue;
				}
				if (result === "importSettings") {
					try {
						await importSettingsVue(store);
					} catch (error) {
						const message = getErrorMessage(error, translate("HWHVACUUM_ERROR_GENERIC"));
						console.error("[Vacuum] import failed", error);
						showSettingsNotice(translate("HWHVACUUM_SETTINGS_IMPORT_ERROR", { message }), "alert-triangle", "hwhx-danger");
					}
					continue;
				}
				await store.save();
				configureProgress(store.state);
				setAccordionAutoScrollMode(store.state.accordionAutoScrollMode);
				if (result === "save") {
					syncVacuumActionPlacement(store.state);
					registerDoYourBestVacuumTask();
					showSettingsNotice(translate("HWHVACUUM_SETTINGS_SAVED"));
					return;
				}
				if (result === "run") {
					syncVacuumActionPlacement(store.state);
					registerDoYourBestVacuumTask();
					await runShopVacuum(store.state);
					return;
				}
			}
		}
		function registerDoYourBestVacuumTask() {
			var _doYourBestInstance$f, _doYourBestInstance$f2;
			const DoYourBestCtor = getHeroWarsDoYourBestClass(HWHClasses);
			if (!DoYourBestCtor) return;
			const RootDoYourBestClass = getDoYourBestRootBaseClass(DoYourBestCtor);
			const doYourBestInstance = new DoYourBestCtor();
			const currentTaskList = Array.isArray(doYourBestInstance.funcList) ? doYourBestInstance.funcList.filter(Boolean) : [];
			const existingTask = currentTaskList.find(isVacuumDoYourBestTask);
			const baseTaskList = currentTaskList.filter((task) => !isVacuumDoYourBestTask(task));
			const settings = readSettings();
			const checklistActionTypes = normalizeChecklistActionTypes(settings.checklistActionTypes, []);
			const checklistTask = {
				name: DO_YOUR_BEST_TASK_NAME,
				label: translate("HWHVACUUM_DO_YOUR_BEST"),
				checked: !!(existingTask === null || existingTask === void 0 ? void 0 : existingTask.checked) && checklistActionTypes.length > 0
			};
			if (settings.doYourBestPlacement !== "none") {
				const insertionIndex = getDoYourBestInsertionIndex(baseTaskList, settings.doYourBestPlacement);
				baseTaskList.splice(insertionIndex, 0, checklistTask);
			}
			const currentFunctions = {
				...(_doYourBestInstance$f = doYourBestInstance.functions) !== null && _doYourBestInstance$f !== void 0 ? _doYourBestInstance$f : {},
				[DO_YOUR_BEST_TASK_NAME]: async () => {
					if (normalizeChecklistActionTypes(readSettings().checklistActionTypes, []).length <= 0) return;
					await runShopVacuum(readSettings(), { source: "checklist" });
				}
			};
			const currentTaskOrder = currentTaskList.map(getDoYourBestTaskName).join("");
			const nextTaskOrder = baseTaskList.map(getDoYourBestTaskName).join("");
			const handlerPresent = typeof ((_doYourBestInstance$f2 = doYourBestInstance.functions) === null || _doYourBestInstance$f2 === void 0 ? void 0 : _doYourBestInstance$f2[DO_YOUR_BEST_TASK_NAME]) === "function";
			if (currentTaskOrder === nextTaskOrder && handlerPresent) return;
			class VacuumDoYourBestExtension extends RootDoYourBestClass {
				constructor(...args) {
					super(...args);
					this.funcList = baseTaskList.map((task) => ({ ...task }));
					this.functions = { ...currentFunctions };
				}
			}
			HWHClasses.doYourBest = VacuumDoYourBestExtension;
		}
		async function openVacuumSafely() {
			await openVacuumMenuVue();
		}
		const vacuumMenuButtonFactory = createScriptMenuButtonFactory({
			actionKey: VACUUM_ACTION_KEY,
			color: "pink",
			icon: "shopping-cart",
			getLabel: () => translate("HWHVACUUM_BUTTON"),
			getTitle: () => translate("HWHVACUUM_BUTTON_TITLE"),
			onClick: openVacuumSafely,
			buildIconLabel: (icon, label) => buildIconLabel(icon, label, "")
		});
		function createVacuumMainMenuButton() {
			return vacuumMenuButtonFactory.createMainButton();
		}
		function createVacuumOtherMenuButton() {
			return vacuumMenuButtonFactory.createOtherButton();
		}
		function syncVacuumActionPlacement(settings = void 0) {
			syncStoredScriptMenuActionPlacement({
				HWHData,
				mainMenuButtons,
				othersPopupButtons,
				settings,
				settingsKey: "vacuumButtonPlacement",
				readStoredPlacement: () => readSettings().vacuumButtonPlacement,
				normalizePlacement: normalizeVacuumButtonPlacement,
				mainKey: "hwhvacuum",
				actionKey: VACUUM_ACTION_KEY,
				createMainButton: createVacuumMainMenuButton,
				createOtherButton: createVacuumOtherMenuButton,
				mainPlacementValue: VACUUM_BUTTON_PLACEMENT_MAIN,
				otherPlacementValue: VACUUM_BUTTON_PLACEMENT_OTHER
			});
		}
		function registerVacuumAction() {
			syncVacuumActionPlacement();
		}
		registerDoYourBestVacuumTask();
		registerVacuumAction();
	}
	//#endregion
	//#region src/entries/hwhvacuum-lite.user.ts
	initializeShopVacuumExtension(0);
	//#endregion
})();
