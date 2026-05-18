// ==UserScript==
// @name           HWH Shop Vacuum
// @name:en        HWH Shop Vacuum
// @namespace      http://tampermonkey.net/
// @version        1.3.3
// @updateURL      https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhvacuum.meta.js
// @downloadURL    https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhvacuum.user.js
// @description    Скупает выбранные товары, продает лишние фрагменты и запускается из нужного меню или «Сделать всё».
// @description:en Buys configured shop slots, sells surplus fragments, and can run from the chosen menu or Do all.
// @author         Askja
// @match          https://www.hero-wars.com/*
// @match          https://apps-1701433570146040.apps.fbsbx.com/*
// @grant          none
// @license        MIT
// ==/UserScript==
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
(function() {
  "use strict";
  var _rows, _onAfterFilter, _root, _dialog, _body, _actions, _resolve, _isClosed, _searchRegistry, _tooltipNode, _tooltipTarget, _tooltipPendingTarget, _tooltipShowTimer, _tooltipAutoHideTimer, _tooltipHideTimer, _tooltipPendingClientX, _tooltipPendingClientY, _tooltipWidth, _tooltipHeight, _onDocumentKeydown, _ModalRenderer_instances, bindEvents_fn, prepareClearableInputs_fn, syncClearableInput_fn, clearTextInput_fn, dispatchActionEvent_fn, getScrollContainer_fn, bindAccordionAutoScroll_fn, scrollAccordionIntoView_fn, dispatchDomEvent_fn, clearTooltipTimers_fn, prepareTitles_fn, getTooltipTarget_fn, getTooltipDescriptor_fn, clampTooltipCoordinate_fn, getAutoTooltipPlacement_fn, positionTooltip_fn, showTooltip_fn, hideTooltip_fn, scheduleTooltip_fn, moveTooltip_fn, areTooltipsEnabled_fn, bindTooltips_fn, makeDraggable_fn, _VersionedStorage_instances, unwrapValue_fn, migrate_fn, _factory, _value, _revision;
  function getDocumentLocale(fallbackLocale = "en-US") {
    const language = String(globalThis.document?.documentElement?.lang ?? "").trim();
    if (language) {
      return language.toLowerCase().startsWith("ru") ? "ru-RU" : language;
    }
    return fallbackLocale;
  }
  function formatNumber(value, { locale = getDocumentLocale(), minimum = 0 } = {}) {
    return Math.max(minimum, Number(value) || 0).toLocaleString(locale);
  }
  function formatSignedNumber(value, { locale = getDocumentLocale() } = {}) {
    const normalizedValue = Number(value) || 0;
    const prefix = normalizedValue > 0 ? "+" : "";
    return `${prefix}${normalizedValue.toLocaleString(locale)}`;
  }
  function formatPercent(value, { locale = getDocumentLocale(), digits = 1 } = {}) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "0%";
    }
    return `${numericValue.toLocaleString(locale, {
      maximumFractionDigits: Math.max(0, Number(digits) || 0)
    })}%`;
  }
  function parseNumberInputText(value, fallbackValue = 0) {
    if (value == null) {
      return fallbackValue;
    }
    const rawText = String(value ?? "").trim();
    if (!rawText) {
      return 0;
    }
    const normalizedText = rawText.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
    const isNegative = normalizedText.startsWith("-");
    const unsignedText = normalizedText.replaceAll("-", "");
    const [wholePart = "", ...fractionParts] = unsignedText.split(".");
    const numericText = `${isNegative ? "-" : ""}${wholePart}${fractionParts.length > 0 ? `.${fractionParts.join("")}` : ""}`;
    const numericValue = Number(numericText);
    return Number.isFinite(numericValue) ? numericValue : fallbackValue;
  }
  function normalizeNumber(value, {
    minValue = Number.NEGATIVE_INFINITY,
    maxValue = Number.POSITIVE_INFINITY,
    fallbackValue = 0
  } = {}) {
    const numericValue = parseNumberInputText(value, fallbackValue);
    if (!Number.isFinite(numericValue)) {
      return fallbackValue;
    }
    return Math.min(Math.max(numericValue, minValue), maxValue);
  }
  function normalizeInteger(value, options = {}) {
    return Math.trunc(normalizeNumber(value, options));
  }
  function normalizeNonNegativeNumber(value, fallbackValue = 0) {
    return normalizeNumber(value, { minValue: 0, fallbackValue });
  }
  function normalizeNonNegativeInteger(value, fallbackValue = 0) {
    return Math.trunc(normalizeNonNegativeNumber(value, fallbackValue));
  }
  function normalizeBoolean$1(value, fallbackValue = false) {
    if (value === true || value === 1 || value === "1" || value === "true") {
      return true;
    }
    if (value === false || value === 0 || value === "0" || value === "false") {
      return false;
    }
    return !!fallbackValue;
  }
  function normalizeEnum$1(value, allowedValues, fallbackValue) {
    return Array.isArray(allowedValues) && allowedValues.includes(value) ? value : fallbackValue;
  }
  function normalizeBooleanMap(value, allowedKeys = void 0, fallbackMap = {}) {
    const allowedSet = Array.isArray(allowedKeys) ? new Set(allowedKeys.map((key) => String(key))) : null;
    const result = { ...fallbackMap ?? {} };
    Object.entries(value && typeof value === "object" ? value : {}).forEach(
      ([key, isEnabled]) => {
        const normalizedKey = String(key);
        if (allowedSet && !allowedSet.has(normalizedKey)) {
          return;
        }
        result[normalizedKey] = !!isEnabled;
      }
    );
    return result;
  }
  function normalizeNumberMap(value, fallbackMap = {}) {
    const result = { ...fallbackMap ?? {} };
    Object.entries(value && typeof value === "object" ? value : {}).forEach(
      ([key, amount]) => {
        result[String(key)] = normalizeNonNegativeInteger(amount, 0);
      }
    );
    return result;
  }
  function cloneData(value) {
    if (globalThis.structuredClone) {
      try {
        return globalThis.structuredClone(value);
      } catch {
      }
    }
    if (value == null) {
      return value;
    }
    return JSON.parse(JSON.stringify(value));
  }
  function clonePlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value) ? cloneData(value) : {};
  }
  function escapeRegExp$1(value) {
    return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function getCurrentLanguageCode(i18nLangData = void 0) {
    const gameLang = String(globalThis.NXFlashVars?.interface_lang ?? "").slice(0, 2);
    const browserLang = String(globalThis.navigator?.language ?? "").slice(0, 2);
    const lang = gameLang || browserLang || "en";
    return i18nLangData?.[lang] ? lang : "en";
  }
  function isUsefulTranslation(text, key) {
    const value = String(text ?? "").trim();
    const normalizedKey = String(key ?? "").trim();
    return !!value && value !== normalizedKey && !value.includes("undefined");
  }
  function installScriptTranslations(i18nLangData, translationsByLanguage = {}) {
    if (!i18nLangData || typeof i18nLangData !== "object") {
      return;
    }
    Object.entries(translationsByLanguage).forEach(([language, translations]) => {
      i18nLangData[language] = Object.assign(
        i18nLangData[language] ?? {},
        translations ?? {}
      );
    });
  }
  function createTranslator({
    I18N,
    cheats,
    i18nLangData,
    defaultLanguage = "en",
    fallbackLanguage = "en",
    preferGameI18N = true,
    forceLanguage = void 0
  } = {}) {
    return function translate(key, replacements = {}) {
      const normalizedKey = String(key ?? "");
      let text = "";
      if (preferGameI18N && typeof I18N === "function") {
        try {
          text = I18N(normalizedKey);
        } catch {
          text = "";
        }
      }
      if (!isUsefulTranslation(text, normalizedKey) && typeof cheats?.translate === "function") {
        try {
          text = cheats.translate(normalizedKey);
        } catch {
          text = "";
        }
      }
      if (!isUsefulTranslation(text, normalizedKey)) {
        const language = forceLanguage ?? getCurrentLanguageCode(i18nLangData) ?? defaultLanguage;
        text = i18nLangData?.[language]?.[normalizedKey] ?? i18nLangData?.[fallbackLanguage]?.[normalizedKey] ?? i18nLangData?.[defaultLanguage]?.[normalizedKey] ?? "";
      }
      if (!isUsefulTranslation(text, normalizedKey)) {
        text = normalizedKey;
      }
      Object.entries(replacements ?? {}).forEach(([placeholder, value]) => {
        text = String(text).replace(
          new RegExp(`\\{${escapeRegExp$1(placeholder)}\\}`, "g"),
          String(value)
        );
      });
      return String(text);
    };
  }
  function isHwhRuntimeReady(requiredKeys = ["HWHClasses", "HWHFuncs", "HWHData"]) {
    return requiredKeys.every((key) => !!globalThis[key]);
  }
  function retryHwhRuntimeInitialization({
    attempt = 0,
    maxAttempts = 120,
    delayMs = 500,
    requiredKeys = ["HWHClasses", "HWHFuncs", "HWHData"],
    retry,
    logPrefix = "[HWH]"
  } = {}) {
    const initAttempt = Number(attempt) || 0;
    if (isHwhRuntimeReady(requiredKeys)) {
      return true;
    }
    if (initAttempt < maxAttempts && typeof retry === "function") {
      globalThis.setTimeout(() => retry(initAttempt + 1), delayMs);
      return false;
    }
    console.log(`%c${logPrefix} Объект расширения не найден`, "color: red");
    return false;
  }
  const MENU_ACTION_PLACEMENT_MAIN = "main";
  const MENU_ACTION_PLACEMENT_OTHER = "other";
  function ensureMainMenuButtons(HWHData) {
    return HWHData?.buttons && typeof HWHData.buttons === "object" ? HWHData.buttons : HWHData.buttons = {};
  }
  function ensureOtherPopupButtons(HWHData) {
    return Array.isArray(HWHData?.othersPopupButtons) ? HWHData.othersPopupButtons : HWHData.othersPopupButtons = [];
  }
  function normalizeMenuActionPlacement(value, fallbackValue = MENU_ACTION_PLACEMENT_MAIN) {
    return value === MENU_ACTION_PLACEMENT_OTHER || value === MENU_ACTION_PLACEMENT_MAIN ? value : fallbackValue;
  }
  function syncScriptMenuActionPlacement({
    HWHData,
    mainMenuButtons,
    othersPopupButtons,
    placement,
    mainKey,
    actionKey,
    createMainButton,
    createOtherButton,
    mainPlacementValue = MENU_ACTION_PLACEMENT_MAIN,
    otherPlacementValue = MENU_ACTION_PLACEMENT_OTHER
  }) {
    const mainButtons = mainMenuButtons ?? ensureMainMenuButtons(HWHData);
    const otherButtons = othersPopupButtons ?? ensureOtherPopupButtons(HWHData);
    const existingOtherIndex = otherButtons.findIndex(
      (button) => button?.actionKey === actionKey
    );
    if (existingOtherIndex >= 0) {
      otherButtons.splice(existingOtherIndex, 1);
    }
    delete mainButtons[mainKey];
    if (placement === otherPlacementValue) {
      otherButtons.push(createOtherButton());
    } else if (placement === mainPlacementValue) {
      mainButtons[mainKey] = createMainButton();
    }
    HWHData.buttons = mainButtons;
    return { mainMenuButtons: mainButtons, othersPopupButtons: otherButtons };
  }
  const DO_YOUR_BEST_PLACEMENT_NONE = "none";
  const DO_YOUR_BEST_PLACEMENT_START = "start";
  const DO_YOUR_BEST_PLACEMENT_END = "end";
  const DO_YOUR_BEST_PLACEMENT_BEFORE_PREFIX = "before:";
  const DO_YOUR_BEST_PLACEMENT_AFTER_PREFIX = "after:";
  function getDoYourBestTaskName(task) {
    return String(task?.name ?? "").trim();
  }
  function getDoYourBestTaskLabel(task) {
    return String(task?.label || task?.title || task?.name || "").trim();
  }
  function normalizeDoYourBestPlacement(value, { allowStart = false, fallbackValue = DO_YOUR_BEST_PLACEMENT_END } = {}) {
    const placement = String(value ?? "").trim();
    if (placement === DO_YOUR_BEST_PLACEMENT_NONE || placement === DO_YOUR_BEST_PLACEMENT_END || allowStart && placement === DO_YOUR_BEST_PLACEMENT_START) {
      return placement;
    }
    if (placement.startsWith(DO_YOUR_BEST_PLACEMENT_BEFORE_PREFIX) && placement.length > DO_YOUR_BEST_PLACEMENT_BEFORE_PREFIX.length) {
      return placement;
    }
    if (placement.startsWith(DO_YOUR_BEST_PLACEMENT_AFTER_PREFIX) && placement.length > DO_YOUR_BEST_PLACEMENT_AFTER_PREFIX.length) {
      return placement;
    }
    return fallbackValue;
  }
  function getDoYourBestRootBaseClass(MaybeDerived) {
    if (typeof MaybeDerived !== "function") {
      return MaybeDerived;
    }
    let currentClass = MaybeDerived;
    while (true) {
      const parentPrototype = Object.getPrototypeOf(currentClass.prototype);
      if (!parentPrototype || parentPrototype === Object.prototype) {
        return currentClass;
      }
      const parentClass = parentPrototype.constructor;
      if (typeof parentClass !== "function" || parentClass === currentClass) {
        return currentClass;
      }
      currentClass = parentClass;
    }
  }
  function getDoYourBestTaskListSnapshot(DoYourBestClass, { logPrefix = "[HWH]" } = {}) {
    if (typeof DoYourBestClass !== "function") {
      return [];
    }
    try {
      const doYourBestInstance = new DoYourBestClass();
      return Array.isArray(doYourBestInstance.funcList) ? [...doYourBestInstance.funcList] : [];
    } catch (error) {
      console.warn(`${logPrefix} checklist snapshot failed`, error);
      return [];
    }
  }
  function getDoYourBestInsertionIndex(taskList, placement, { allowStart = false, normalizePlacement = void 0 } = {}) {
    const normalizedPlacement = typeof normalizePlacement === "function" ? normalizePlacement(placement) : normalizeDoYourBestPlacement(placement, { allowStart });
    if (allowStart && normalizedPlacement === DO_YOUR_BEST_PLACEMENT_START) {
      return 0;
    }
    if (normalizedPlacement === DO_YOUR_BEST_PLACEMENT_END) {
      return taskList.length;
    }
    const isAfter = normalizedPlacement.startsWith(DO_YOUR_BEST_PLACEMENT_AFTER_PREFIX);
    const anchorName = normalizedPlacement.slice(
      isAfter ? DO_YOUR_BEST_PLACEMENT_AFTER_PREFIX.length : DO_YOUR_BEST_PLACEMENT_BEFORE_PREFIX.length
    );
    const anchorIndex = taskList.findIndex(
      (task) => getDoYourBestTaskName(task) === anchorName
    );
    if (anchorIndex < 0) {
      return taskList.length;
    }
    return anchorIndex + (isAfter ? 1 : 0);
  }
  function buildDoYourBestPlacementOptions({
    taskList = [],
    translate,
    keys,
    includeStart = false
  } = {}) {
    const t = typeof translate === "function" ? translate : (key) => key;
    const placementTasks = (taskList ?? []).filter((task) => getDoYourBestTaskName(task));
    const options = [
      {
        value: DO_YOUR_BEST_PLACEMENT_NONE,
        label: t(keys?.none ?? "DO_YOUR_BEST_PLACEMENT_NONE"),
        icon: "x"
      }
    ];
    if (includeStart) {
      options.push({
        value: DO_YOUR_BEST_PLACEMENT_START,
        label: t(keys?.start ?? "DO_YOUR_BEST_PLACEMENT_START"),
        icon: "arrow-up-to-line"
      });
    }
    if (placementTasks.length <= 0) {
      options.push({
        value: DO_YOUR_BEST_PLACEMENT_END,
        label: t(keys?.end ?? "DO_YOUR_BEST_PLACEMENT_END"),
        icon: "arrow-down"
      });
      return options;
    }
    const firstTask = placementTasks[0];
    const firstTaskName = getDoYourBestTaskName(firstTask);
    const firstTaskLabel = getDoYourBestTaskLabel(firstTask) || firstTaskName;
    options.push({
      value: `${DO_YOUR_BEST_PLACEMENT_BEFORE_PREFIX}${firstTaskName}`,
      label: t(keys?.before ?? "DO_YOUR_BEST_PLACEMENT_BEFORE", {
        label: firstTaskLabel
      }),
      icon: "arrow-up"
    });
    placementTasks.forEach((task) => {
      const taskName = getDoYourBestTaskName(task);
      const taskLabel = getDoYourBestTaskLabel(task) || taskName;
      options.push({
        value: `${DO_YOUR_BEST_PLACEMENT_AFTER_PREFIX}${taskName}`,
        label: t(keys?.after ?? "DO_YOUR_BEST_PLACEMENT_AFTER", {
          label: taskLabel
        }),
        icon: "arrow-down"
      });
    });
    return options;
  }
  function escapeHtml$1(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }
  function buildHtmlAttributeMarkup(attributes = {}) {
    return Object.entries(attributes).filter(([, value]) => value !== void 0 && value !== null && value !== false).map(([name, value]) => ` ${name}="${escapeHtml$1(value === true ? name : value)}"`).join("");
  }
  function buildCssVariableStyleMarkup(variables = {}) {
    const styleText = Object.entries(variables).filter(
      ([name, value]) => /^--[a-z0-9_-]+$/i.test(name) && value !== void 0 && value !== null && value !== ""
    ).map(([name, value]) => `${name}:${String(value).replaceAll(";", "")}`).join(";");
    return styleText ? ` style="${escapeHtml$1(styleText)}"` : "";
  }
  function getSharedUiLanguage(defaultLanguage = "en") {
    const documentLanguage = String(globalThis.document?.documentElement?.lang ?? "").toLowerCase().trim();
    const navigatorLanguages = [
      ...Array.isArray(globalThis.navigator?.languages) ? globalThis.navigator.languages : [],
      globalThis.navigator?.language
    ].map(
      (language) => String(language ?? "").toLowerCase().trim()
    ).filter(Boolean);
    const okText = typeof globalThis.HWHFuncs?.I18N === "function" ? String(globalThis.HWHFuncs.I18N("HWHAUTO_COMMON_OK") ?? "") : "";
    if (documentLanguage.startsWith("ru") || navigatorLanguages.some((language) => language.startsWith("ru")) || okText.trim().toLowerCase() === "ок") {
      return "ru";
    }
    if (documentLanguage.startsWith("en") || navigatorLanguages.some((language) => language.startsWith("en")) || okText.trim().toLowerCase() === "ok") {
      return "en";
    }
    return defaultLanguage;
  }
  function injectStyle(styleId, cssText) {
    const existingStyleElement = document.getElementById(styleId);
    if (existingStyleElement?.tagName === "STYLE") {
      if (existingStyleElement.textContent !== cssText) {
        existingStyleElement.textContent = cssText;
      }
      return;
    }
    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = cssText;
    (document.head ?? document.documentElement).appendChild(styleElement);
  }
  const SELECT_SAVE_DEBUG_STORAGE_KEY = "hwhxDebugSelectSave";
  let selectSaveDebugFromSettings = false;
  function isSelectSaveDebugEnabled() {
    try {
      if (globalThis.localStorage?.getItem(SELECT_SAVE_DEBUG_STORAGE_KEY) === "1") {
        return true;
      }
    } catch {
    }
    return selectSaveDebugFromSettings;
  }
  function logSelectSaveDebug(message, detail) {
    if (!isSelectSaveDebugEnabled()) {
      return;
    }
    if (detail === void 0) {
      console.warn(`[hwhx:select-save] ${message}`);
    } else {
      console.warn(`[hwhx:select-save] ${message}`, detail);
    }
  }
  const DEFAULT_TONES = /* @__PURE__ */ new Set([
    "default",
    "items",
    "energy",
    "success",
    "warning",
    "danger",
    "info",
    "intermediate"
  ]);
  function clampPercent(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.max(0, Math.min(100, numericValue)) : 0;
  }
  function normalizeTone(value) {
    const tone = String(value ?? "default").trim().toLowerCase();
    return DEFAULT_TONES.has(tone) ? tone : "default";
  }
  function normalizeOrientation(value) {
    return String(value ?? "").toLowerCase() === "vertical" ? "vertical" : "horizontal";
  }
  function normalizeVariant(value) {
    return String(value ?? "").toLowerCase() === "circle" ? "circle" : "bar";
  }
  function getProgressPercent({ value, max, percent } = {}) {
    if (Number.isFinite(Number(percent))) {
      return clampPercent(Number(percent));
    }
    const safeMax = Math.max(1, Number(max) || 1);
    return clampPercent(Math.max(0, Number(value) || 0) / safeMax * 100);
  }
  function buildProgressBarMarkup({
    value = 0,
    max = 100,
    percent = void 0,
    tone = "default",
    orientation = "horizontal",
    variant = "bar",
    widthPx = void 0,
    heightPx = void 0,
    sizePx = void 0,
    striped = false,
    animated = false,
    indeterminate = false,
    intermediate = false,
    label = "",
    showLabel = false,
    className = "",
    attributes = {}
  } = {}) {
    const normalizedVariant = normalizeVariant(variant);
    const normalizedOrientation = normalizeOrientation(orientation);
    const isIntermediate = !!intermediate;
    const isIndeterminate = !!indeterminate || isIntermediate;
    const normalizedPercent = getProgressPercent({ value, max, percent });
    const renderedPercent = isIntermediate && normalizedVariant === "circle" ? 68 : normalizedPercent;
    const valueText = `${renderedPercent}%`;
    const rootClassName = ["hwhx-progress-bar", className].filter(Boolean).join(" ");
    const styleVariables = normalizedVariant === "circle" ? {
      "--hwhx-progress-size": sizePx ? `${Math.max(12, Number(sizePx))}px` : void 0,
      "--hwhx-progress-value": valueText
    } : {
      "--hwhx-progress-width": widthPx ? `${Math.max(1, Number(widthPx))}px` : void 0,
      "--hwhx-progress-height": heightPx ? `${Math.max(1, Number(heightPx))}px` : void 0,
      "--hwhx-progress-value": valueText
    };
    const labelMarkup = showLabel || label ? `<span class="hwhx-progress-bar__label">${escapeHtml$1(
      label || `${Math.round(normalizedPercent)}%`
    )}</span>` : "";
    return `<div${buildHtmlAttributeMarkup({
      class: rootClassName,
      role: "progressbar",
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-valuenow": isIndeterminate ? void 0 : Math.round(normalizedPercent),
      "data-tone": normalizeTone(tone),
      "data-variant": normalizedVariant,
      "data-orientation": normalizedOrientation,
      "data-striped": striped ? "1" : void 0,
      "data-animated": animated ? "1" : void 0,
      "data-indeterminate": isIndeterminate ? "1" : void 0,
      "data-intermediate": isIntermediate ? "1" : void 0,
      ...attributes
    })}${buildCssVariableStyleMarkup(styleVariables)}><div class="hwhx-progress-bar__fill"></div>${normalizedVariant === "circle" ? '<div class="hwhx-progress-bar__core"></div>' : ""}${labelMarkup}</div>`;
  }
  const STYLE_ID = "hwh-shared-ui-style";
  function ensureSharedUiStyles() {
    injectStyle(
      STYLE_ID,
      `
      :root,
      :root[data-hwhx-ui-theme="classic"] {
        --hwhx-theme-overlay: rgba(0, 0, 0, .28);
        --hwhx-theme-dialog-border: rgba(198, 135, 57, .86);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(34, 21, 12, .98), rgba(16, 10, 7, .98)), rgba(22, 14, 10, .98);
        --hwhx-theme-header-bg: rgba(42, 25, 13, .78);
        --hwhx-theme-actions-bg: rgba(18, 11, 7, .82);
        --hwhx-theme-surface-bg: #24160f;
        --hwhx-theme-panel-bg: #24160f;
        --hwhx-theme-accordion-bg: rgba(36, 22, 15, .92);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(55, 35, 22, .98), rgba(29, 18, 12, .98)), #24160f;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(68, 43, 24, .98), rgba(33, 20, 12, .98)), #2d1b11;
        --hwhx-theme-control-border: rgba(141, 97, 51, .9);
        --hwhx-theme-control-border-hover: rgba(198, 135, 57, .95);
        --hwhx-theme-text: #f4efe5;
        --hwhx-theme-control-text: #f7e0bc;
        --hwhx-theme-title: #f5d18b;
        --hwhx-theme-muted: #b89f78;
        --hwhx-theme-primary: #9fe0a8;
        --hwhx-theme-accent: #f0d59f;
        --hwhx-theme-hint-bg: rgba(19, 13, 9, .52);
        --hwhx-theme-hint-border: rgba(240, 213, 159, .58);
        --hwhx-theme-hint-text: #c9b28a;
        --hwhx-theme-shadow: 0 18px 46px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,236,180,.1);
        --hwhx-theme-progress-border: rgba(126, 190, 171, .48);
        --hwhx-theme-progress-bg: rgba(15, 18, 20, .96);
        --hwhx-theme-progress-header-border: rgba(126, 190, 171, .22);
        --hwhx-theme-button-bg: rgba(36, 40, 43, .92);
        --hwhx-theme-button-bg-hover: rgba(54, 60, 64, .98);
        --hwhx-theme-button-border: rgba(160, 171, 184, .42);
        --hwhx-theme-font-family: Arial, sans-serif;
        --hwhx-theme-border-style: solid;
        --hwhx-theme-border-width: 1px;
        --hwhx-theme-radius-dialog: 12px;
        --hwhx-theme-radius-panel: 8px;
        --hwhx-theme-radius-control: 7px;
        --hwhx-theme-radius-small: 5px;
        --hwhx-theme-radius-pill: 999px;
        --hwhx-theme-dialog-title-shadow: 0 1px 0 rgba(0,0,0,.65);
        --hwhx-theme-progress-shadow: 0 18px 44px rgba(0,0,0,.46), inset 0 1px 0 rgba(255,255,255,.05);
        --hwhx-theme-progress-drag-shadow: 0 22px 52px rgba(0,0,0,.54), inset 0 1px 0 rgba(255,255,255,.06);
        --hwhx-theme-panel-shadow: inset 0 1px 0 rgba(255,255,255,.04);
        --hwhx-theme-control-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px rgba(0,0,0,.16);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(127, 227, 186, .13), inset 0 1px 0 rgba(255,255,255,.08);
        --hwhx-theme-button-shadow: inset 0 1px 0 rgba(255,255,255,.05);
        --hwhx-theme-menu-shadow: 0 14px 34px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.06);
        --hwhx-theme-hint-shadow: none;
        --hwhx-theme-counter-shadow: none;
        --hwhx-theme-control-padding-y: 7px;
        --hwhx-theme-control-padding-x: 10px;
        --hwhx-theme-panel-padding-y: 10px;
        --hwhx-theme-panel-padding-x: 12px;
        --hwhx-theme-accordion-padding-y: 12px;
        --hwhx-theme-accordion-padding-x: 14px;
        --hwhx-theme-menu-padding: 8px;
        --hwhx-theme-option-padding-y: 6px;
        --hwhx-theme-option-padding-x: 7px;
      }

      :root[data-hwhx-ui-theme="dominion"] {
        --hwhx-theme-overlay: rgba(3, 2, 1, .42);
        --hwhx-theme-dialog-border: rgba(224, 173, 78, .9);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(27, 18, 9, .99), rgba(7, 10, 8, .99)), #0b0d0a;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(71, 47, 16, .86), rgba(18, 38, 25, .78));
        --hwhx-theme-actions-bg: rgba(9, 11, 8, .88);
        --hwhx-theme-surface-bg: #181009;
        --hwhx-theme-panel-bg: rgba(23, 16, 9, .96);
        --hwhx-theme-accordion-bg: rgba(24, 17, 10, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(61, 43, 18, .98), rgba(15, 17, 11, .98)), #181009;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(79, 57, 23, .98), rgba(21, 28, 17, .98)), #21150b;
        --hwhx-theme-control-border: rgba(190, 139, 48, .88);
        --hwhx-theme-control-border-hover: rgba(238, 186, 78, .96);
        --hwhx-theme-text: #f5f0df;
        --hwhx-theme-control-text: #ffe1a3;
        --hwhx-theme-title: #ffd36e;
        --hwhx-theme-muted: #c2a46d;
        --hwhx-theme-primary: #8fe7af;
        --hwhx-theme-accent: #f1c25d;
        --hwhx-theme-hint-bg: rgba(27, 21, 10, .68);
        --hwhx-theme-hint-border: rgba(241, 194, 93, .68);
        --hwhx-theme-hint-text: #dec88e;
        --hwhx-theme-shadow: 0 22px 52px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,220,128,.16);
        --hwhx-theme-progress-border: rgba(143, 231, 175, .48);
        --hwhx-theme-progress-bg: rgba(9, 13, 10, .96);
        --hwhx-theme-progress-header-border: rgba(241, 194, 93, .28);
        --hwhx-theme-button-bg: rgba(45, 47, 31, .94);
        --hwhx-theme-button-bg-hover: rgba(64, 66, 39, .98);
        --hwhx-theme-button-border: rgba(210, 165, 64, .54);
        --hwhx-theme-font-family: Georgia, "Times New Roman", serif;
        --hwhx-theme-border-style: double;
        --hwhx-theme-border-width: 2px;
        --hwhx-theme-radius-dialog: 10px;
        --hwhx-theme-radius-panel: 6px;
        --hwhx-theme-radius-control: 5px;
        --hwhx-theme-radius-small: 4px;
        --hwhx-theme-radius-pill: 5px;
        --hwhx-theme-dialog-title-shadow: 0 2px 0 rgba(0,0,0,.75);
        --hwhx-theme-progress-shadow: 0 22px 54px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,223,122,.14);
        --hwhx-theme-progress-drag-shadow: 0 26px 64px rgba(0,0,0,.66), inset 0 1px 0 rgba(255,223,122,.18);
        --hwhx-theme-panel-shadow: inset 0 1px 0 rgba(255,223,122,.12), 0 4px 0 rgba(0,0,0,.2);
        --hwhx-theme-control-shadow: inset 0 1px 0 rgba(255,223,122,.12), 0 2px 0 rgba(0,0,0,.28);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(241, 194, 93, .2), inset 0 1px 0 rgba(255,223,122,.16);
        --hwhx-theme-button-shadow: inset 0 1px 0 rgba(255,223,122,.12), 0 2px 0 rgba(0,0,0,.28);
        --hwhx-theme-menu-shadow: 0 18px 42px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,223,122,.12);
        --hwhx-theme-hint-shadow: inset 0 1px 0 rgba(255,223,122,.1);
        --hwhx-theme-counter-shadow: inset 0 1px 0 rgba(255,223,122,.12);
        --hwhx-theme-control-padding-y: 8px;
        --hwhx-theme-control-padding-x: 12px;
        --hwhx-theme-panel-padding-y: 12px;
        --hwhx-theme-panel-padding-x: 14px;
        --hwhx-theme-accordion-padding-y: 13px;
        --hwhx-theme-accordion-padding-x: 15px;
        --hwhx-theme-menu-padding: 10px;
        --hwhx-theme-option-padding-y: 7px;
        --hwhx-theme-option-padding-x: 9px;
      }

      :root[data-hwhx-ui-theme="infernal-forge"] {
        --hwhx-theme-overlay: rgba(8, 2, 1, .44);
        --hwhx-theme-dialog-border: rgba(220, 103, 54, .9);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(38, 12, 7, .99), rgba(13, 8, 7, .99)), #150905;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(91, 27, 13, .9), rgba(38, 20, 11, .84));
        --hwhx-theme-actions-bg: rgba(18, 8, 6, .9);
        --hwhx-theme-surface-bg: #210d08;
        --hwhx-theme-panel-bg: rgba(33, 13, 8, .96);
        --hwhx-theme-accordion-bg: rgba(37, 14, 8, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(73, 30, 16, .98), rgba(28, 11, 7, .98)), #210d08;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(98, 39, 18, .98), rgba(39, 14, 8, .98)), #2c1008;
        --hwhx-theme-control-border: rgba(178, 82, 39, .88);
        --hwhx-theme-control-border-hover: rgba(238, 121, 61, .96);
        --hwhx-theme-text: #fff1df;
        --hwhx-theme-control-text: #ffd0a3;
        --hwhx-theme-title: #ffba70;
        --hwhx-theme-muted: #c38a64;
        --hwhx-theme-primary: #ff8d68;
        --hwhx-theme-accent: #ffd36e;
        --hwhx-theme-hint-bg: rgba(38, 14, 8, .68);
        --hwhx-theme-hint-border: rgba(255, 141, 104, .68);
        --hwhx-theme-hint-text: #e9b28f;
        --hwhx-theme-shadow: 0 22px 54px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,160,92,.16);
        --hwhx-theme-progress-border: rgba(255, 141, 104, .5);
        --hwhx-theme-progress-bg: rgba(19, 8, 6, .96);
        --hwhx-theme-progress-header-border: rgba(238, 121, 61, .28);
        --hwhx-theme-button-bg: rgba(58, 27, 21, .94);
        --hwhx-theme-button-bg-hover: rgba(77, 35, 24, .98);
        --hwhx-theme-button-border: rgba(220, 103, 54, .56);
        --hwhx-theme-font-family: "Trebuchet MS", Arial, sans-serif;
        --hwhx-theme-border-style: ridge;
        --hwhx-theme-border-width: 2px;
        --hwhx-theme-radius-dialog: 4px;
        --hwhx-theme-radius-panel: 3px;
        --hwhx-theme-radius-control: 2px;
        --hwhx-theme-radius-small: 2px;
        --hwhx-theme-radius-pill: 2px;
        --hwhx-theme-dialog-title-shadow: 0 2px 0 rgba(0,0,0,.8), 0 0 10px rgba(255,120,64,.28);
        --hwhx-theme-progress-shadow: 0 20px 48px rgba(0,0,0,.64), inset 0 1px 0 rgba(255,141,104,.16);
        --hwhx-theme-progress-drag-shadow: 0 24px 58px rgba(0,0,0,.72), inset 0 1px 0 rgba(255,141,104,.2);
        --hwhx-theme-panel-shadow: inset 0 1px 0 rgba(255,141,104,.12), inset 0 -2px 0 rgba(0,0,0,.32);
        --hwhx-theme-control-shadow: inset 0 1px 0 rgba(255,141,104,.12), inset 0 -2px 0 rgba(0,0,0,.36);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(255,141,104,.22), inset 0 1px 0 rgba(255,141,104,.16);
        --hwhx-theme-button-shadow: inset 0 1px 0 rgba(255,141,104,.14), inset 0 -2px 0 rgba(0,0,0,.36);
        --hwhx-theme-menu-shadow: 0 16px 38px rgba(0,0,0,.66), inset 0 1px 0 rgba(255,141,104,.14);
        --hwhx-theme-hint-shadow: inset 0 0 0 1px rgba(255,141,104,.08);
        --hwhx-theme-counter-shadow: inset 0 1px 0 rgba(255,141,104,.12);
        --hwhx-theme-control-padding-y: 6px;
        --hwhx-theme-control-padding-x: 9px;
        --hwhx-theme-panel-padding-y: 9px;
        --hwhx-theme-panel-padding-x: 10px;
        --hwhx-theme-accordion-padding-y: 10px;
        --hwhx-theme-accordion-padding-x: 12px;
        --hwhx-theme-menu-padding: 7px;
        --hwhx-theme-option-padding-y: 5px;
        --hwhx-theme-option-padding-x: 7px;
      }

      :root[data-hwhx-ui-theme="celestial-citadel"] {
        --hwhx-theme-overlay: rgba(2, 4, 14, .44);
        --hwhx-theme-dialog-border: rgba(119, 158, 255, .82);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(17, 23, 48, .99), rgba(6, 9, 22, .99)), #080c1c;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(26, 39, 91, .88), rgba(48, 28, 76, .8));
        --hwhx-theme-actions-bg: rgba(7, 9, 21, .9);
        --hwhx-theme-surface-bg: #101735;
        --hwhx-theme-panel-bg: rgba(16, 23, 53, .96);
        --hwhx-theme-accordion-bg: rgba(17, 25, 57, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(31, 44, 90, .98), rgba(10, 15, 35, .98)), #101735;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(43, 59, 116, .98), rgba(13, 20, 48, .98)), #14204a;
        --hwhx-theme-control-border: rgba(105, 143, 228, .88);
        --hwhx-theme-control-border-hover: rgba(151, 183, 255, .96);
        --hwhx-theme-text: #eef4ff;
        --hwhx-theme-control-text: #d8e5ff;
        --hwhx-theme-title: #f6d889;
        --hwhx-theme-muted: #a9b8de;
        --hwhx-theme-primary: #91d7ff;
        --hwhx-theme-accent: #f6d889;
        --hwhx-theme-hint-bg: rgba(15, 22, 48, .72);
        --hwhx-theme-hint-border: rgba(145, 215, 255, .64);
        --hwhx-theme-hint-text: #c8d7f0;
        --hwhx-theme-shadow: 0 24px 56px rgba(0,0,0,.62), inset 0 1px 0 rgba(188,210,255,.15);
        --hwhx-theme-progress-border: rgba(145, 215, 255, .48);
        --hwhx-theme-progress-bg: rgba(7, 10, 24, .96);
        --hwhx-theme-progress-header-border: rgba(151, 183, 255, .28);
        --hwhx-theme-button-bg: rgba(31, 39, 68, .94);
        --hwhx-theme-button-bg-hover: rgba(42, 54, 91, .98);
        --hwhx-theme-button-border: rgba(119, 158, 255, .52);
        --hwhx-theme-font-family: "Segoe UI", Arial, sans-serif;
        --hwhx-theme-border-style: solid;
        --hwhx-theme-border-width: 1px;
        --hwhx-theme-radius-dialog: 18px;
        --hwhx-theme-radius-panel: 12px;
        --hwhx-theme-radius-control: 11px;
        --hwhx-theme-radius-small: 8px;
        --hwhx-theme-radius-pill: 999px;
        --hwhx-theme-dialog-title-shadow: 0 0 12px rgba(145,215,255,.3);
        --hwhx-theme-progress-shadow: 0 24px 60px rgba(0,0,0,.56), 0 0 28px rgba(119,158,255,.1), inset 0 1px 0 rgba(188,210,255,.16);
        --hwhx-theme-progress-drag-shadow: 0 28px 70px rgba(0,0,0,.64), 0 0 34px rgba(119,158,255,.14), inset 0 1px 0 rgba(188,210,255,.18);
        --hwhx-theme-panel-shadow: 0 8px 20px rgba(0,0,0,.18), inset 0 1px 0 rgba(188,210,255,.12);
        --hwhx-theme-control-shadow: 0 4px 14px rgba(0,0,0,.18), inset 0 1px 0 rgba(188,210,255,.12);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(145,215,255,.18), 0 4px 14px rgba(0,0,0,.2);
        --hwhx-theme-button-shadow: 0 4px 14px rgba(0,0,0,.2), inset 0 1px 0 rgba(188,210,255,.12);
        --hwhx-theme-menu-shadow: 0 18px 44px rgba(0,0,0,.54), 0 0 24px rgba(119,158,255,.1), inset 0 1px 0 rgba(188,210,255,.12);
        --hwhx-theme-hint-shadow: 0 6px 16px rgba(0,0,0,.16);
        --hwhx-theme-counter-shadow: 0 2px 10px rgba(0,0,0,.18);
        --hwhx-theme-control-padding-y: 8px;
        --hwhx-theme-control-padding-x: 12px;
        --hwhx-theme-panel-padding-y: 12px;
        --hwhx-theme-panel-padding-x: 14px;
        --hwhx-theme-accordion-padding-y: 13px;
        --hwhx-theme-accordion-padding-x: 15px;
        --hwhx-theme-menu-padding: 10px;
        --hwhx-theme-option-padding-y: 7px;
        --hwhx-theme-option-padding-x: 9px;
      }

      :root[data-hwhx-ui-theme="grove-shrine"] {
        --hwhx-theme-overlay: rgba(1, 7, 4, .42);
        --hwhx-theme-dialog-border: rgba(119, 176, 88, .86);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(14, 32, 18, .99), rgba(6, 13, 9, .99)), #07110a;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(32, 67, 35, .9), rgba(55, 43, 18, .78));
        --hwhx-theme-actions-bg: rgba(7, 13, 8, .9);
        --hwhx-theme-surface-bg: #0f2012;
        --hwhx-theme-panel-bg: rgba(15, 32, 18, .96);
        --hwhx-theme-accordion-bg: rgba(16, 35, 19, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(33, 64, 31, .98), rgba(9, 20, 11, .98)), #0f2012;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(45, 84, 41, .98), rgba(13, 29, 15, .98)), #132a16;
        --hwhx-theme-control-border: rgba(107, 156, 74, .88);
        --hwhx-theme-control-border-hover: rgba(157, 214, 105, .96);
        --hwhx-theme-text: #edf6e5;
        --hwhx-theme-control-text: #d8efbd;
        --hwhx-theme-title: #e6cd83;
        --hwhx-theme-muted: #a8bd7d;
        --hwhx-theme-primary: #9dd669;
        --hwhx-theme-accent: #e6cd83;
        --hwhx-theme-hint-bg: rgba(16, 35, 19, .72);
        --hwhx-theme-hint-border: rgba(157, 214, 105, .66);
        --hwhx-theme-hint-text: #c9d8a6;
        --hwhx-theme-shadow: 0 22px 52px rgba(0,0,0,.6), inset 0 1px 0 rgba(198,235,150,.14);
        --hwhx-theme-progress-border: rgba(157, 214, 105, .48);
        --hwhx-theme-progress-bg: rgba(7, 14, 8, .96);
        --hwhx-theme-progress-header-border: rgba(230, 205, 131, .26);
        --hwhx-theme-button-bg: rgba(31, 52, 29, .94);
        --hwhx-theme-button-bg-hover: rgba(41, 69, 36, .98);
        --hwhx-theme-button-border: rgba(119, 176, 88, .54);
        --hwhx-theme-font-family: Verdana, Arial, sans-serif;
        --hwhx-theme-border-style: solid;
        --hwhx-theme-border-width: 1px;
        --hwhx-theme-radius-dialog: 16px;
        --hwhx-theme-radius-panel: 10px;
        --hwhx-theme-radius-control: 9px;
        --hwhx-theme-radius-small: 7px;
        --hwhx-theme-radius-pill: 18px;
        --hwhx-theme-dialog-title-shadow: 0 1px 0 rgba(0,0,0,.72);
        --hwhx-theme-progress-shadow: 0 20px 48px rgba(0,0,0,.54), inset 0 1px 0 rgba(198,235,150,.14);
        --hwhx-theme-progress-drag-shadow: 0 24px 58px rgba(0,0,0,.62), inset 0 1px 0 rgba(198,235,150,.18);
        --hwhx-theme-panel-shadow: 0 6px 0 rgba(0,0,0,.14), inset 0 1px 0 rgba(198,235,150,.12);
        --hwhx-theme-control-shadow: 0 2px 0 rgba(0,0,0,.18), inset 0 1px 0 rgba(198,235,150,.12);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(157,214,105,.18), inset 0 1px 0 rgba(198,235,150,.14);
        --hwhx-theme-button-shadow: 0 2px 0 rgba(0,0,0,.2), inset 0 1px 0 rgba(198,235,150,.12);
        --hwhx-theme-menu-shadow: 0 16px 38px rgba(0,0,0,.54), inset 0 1px 0 rgba(198,235,150,.12);
        --hwhx-theme-hint-shadow: inset 0 1px 0 rgba(198,235,150,.1);
        --hwhx-theme-counter-shadow: inset 0 1px 0 rgba(198,235,150,.12);
        --hwhx-theme-control-padding-y: 8px;
        --hwhx-theme-control-padding-x: 11px;
        --hwhx-theme-panel-padding-y: 11px;
        --hwhx-theme-panel-padding-x: 13px;
        --hwhx-theme-accordion-padding-y: 12px;
        --hwhx-theme-accordion-padding-x: 15px;
        --hwhx-theme-menu-padding: 9px;
        --hwhx-theme-option-padding-y: 7px;
        --hwhx-theme-option-padding-x: 8px;
      }

      :root[data-hwhx-ui-theme="ice-bastion"] {
        --hwhx-theme-overlay: rgba(3, 8, 13, .43);
        --hwhx-theme-dialog-border: rgba(126, 210, 232, .84);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(14, 31, 42, .99), rgba(6, 12, 18, .99)), #071018;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(23, 58, 75, .9), rgba(35, 48, 66, .82));
        --hwhx-theme-actions-bg: rgba(6, 12, 17, .9);
        --hwhx-theme-surface-bg: #0e1f2a;
        --hwhx-theme-panel-bg: rgba(14, 31, 42, .96);
        --hwhx-theme-accordion-bg: rgba(15, 35, 47, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(26, 61, 76, .98), rgba(8, 18, 27, .98)), #0e1f2a;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(35, 78, 96, .98), rgba(11, 27, 39, .98)), #122a38;
        --hwhx-theme-control-border: rgba(105, 177, 202, .88);
        --hwhx-theme-control-border-hover: rgba(154, 230, 246, .96);
        --hwhx-theme-text: #eefaff;
        --hwhx-theme-control-text: #d5f3ff;
        --hwhx-theme-title: #ccefff;
        --hwhx-theme-muted: #9db9c4;
        --hwhx-theme-primary: #8fe8ff;
        --hwhx-theme-accent: #e8d38a;
        --hwhx-theme-hint-bg: rgba(14, 34, 46, .72);
        --hwhx-theme-hint-border: rgba(143, 232, 255, .64);
        --hwhx-theme-hint-text: #c6e0e8;
        --hwhx-theme-shadow: 0 24px 56px rgba(0,0,0,.62), inset 0 1px 0 rgba(176,236,255,.15);
        --hwhx-theme-progress-border: rgba(143, 232, 255, .48);
        --hwhx-theme-progress-bg: rgba(7, 13, 18, .96);
        --hwhx-theme-progress-header-border: rgba(154, 230, 246, .27);
        --hwhx-theme-button-bg: rgba(29, 51, 61, .94);
        --hwhx-theme-button-bg-hover: rgba(39, 68, 82, .98);
        --hwhx-theme-button-border: rgba(126, 210, 232, .52);
        --hwhx-theme-font-family: Tahoma, Arial, sans-serif;
        --hwhx-theme-border-style: groove;
        --hwhx-theme-border-width: 1px;
        --hwhx-theme-radius-dialog: 6px;
        --hwhx-theme-radius-panel: 4px;
        --hwhx-theme-radius-control: 4px;
        --hwhx-theme-radius-small: 3px;
        --hwhx-theme-radius-pill: 4px;
        --hwhx-theme-dialog-title-shadow: 0 0 10px rgba(143,232,255,.26);
        --hwhx-theme-progress-shadow: 0 22px 54px rgba(0,0,0,.6), inset 0 1px 0 rgba(176,236,255,.16);
        --hwhx-theme-progress-drag-shadow: 0 26px 64px rgba(0,0,0,.68), inset 0 1px 0 rgba(176,236,255,.18);
        --hwhx-theme-panel-shadow: inset 0 1px 0 rgba(176,236,255,.14);
        --hwhx-theme-control-shadow: inset 0 1px 0 rgba(176,236,255,.12);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(143,232,255,.18), inset 0 1px 0 rgba(176,236,255,.16);
        --hwhx-theme-button-shadow: inset 0 1px 0 rgba(176,236,255,.12);
        --hwhx-theme-menu-shadow: 0 16px 40px rgba(0,0,0,.58), inset 0 1px 0 rgba(176,236,255,.12);
        --hwhx-theme-hint-shadow: inset 0 1px 0 rgba(176,236,255,.1);
        --hwhx-theme-counter-shadow: inset 0 1px 0 rgba(176,236,255,.12);
        --hwhx-theme-control-padding-y: 6px;
        --hwhx-theme-control-padding-x: 10px;
        --hwhx-theme-panel-padding-y: 9px;
        --hwhx-theme-panel-padding-x: 11px;
        --hwhx-theme-accordion-padding-y: 10px;
        --hwhx-theme-accordion-padding-x: 12px;
        --hwhx-theme-menu-padding: 8px;
        --hwhx-theme-option-padding-y: 6px;
        --hwhx-theme-option-padding-x: 7px;
      }

      :root[data-hwhx-ui-theme="titan-ceremony"] {
        --hwhx-theme-overlay: rgba(0, 10, 8, .48);
        --hwhx-theme-dialog-border: rgba(226, 174, 70, .92);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(16, 42, 31, .99), rgba(7, 14, 14, .99)), #07100f;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(98, 69, 18, .9), rgba(14, 63, 49, .84));
        --hwhx-theme-actions-bg: rgba(7, 16, 14, .9);
        --hwhx-theme-surface-bg: #10271f;
        --hwhx-theme-panel-bg: rgba(15, 38, 30, .96);
        --hwhx-theme-accordion-bg: rgba(18, 44, 34, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(75, 54, 19, .98), rgba(11, 31, 27, .98)), #10271f;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(97, 72, 23, .98), rgba(14, 42, 37, .98)), #16362d;
        --hwhx-theme-control-border: rgba(194, 142, 48, .9);
        --hwhx-theme-control-border-hover: rgba(248, 202, 93, .96);
        --hwhx-theme-text: #f2f8e9;
        --hwhx-theme-control-text: #ffe0a4;
        --hwhx-theme-title: #ffd56c;
        --hwhx-theme-muted: #b7c69a;
        --hwhx-theme-primary: #63e6d1;
        --hwhx-theme-accent: #f2c66b;
        --hwhx-theme-hint-bg: rgba(12, 34, 30, .72);
        --hwhx-theme-hint-border: rgba(99, 230, 209, .62);
        --hwhx-theme-hint-text: #cfe6ce;
        --hwhx-theme-shadow: 0 24px 58px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,224,129,.16);
        --hwhx-theme-progress-border: rgba(99, 230, 209, .5);
        --hwhx-theme-progress-bg: rgba(6, 15, 14, .96);
        --hwhx-theme-progress-header-border: rgba(242, 198, 107, .28);
        --hwhx-theme-button-bg: rgba(35, 48, 31, .94);
        --hwhx-theme-button-bg-hover: rgba(51, 66, 39, .98);
        --hwhx-theme-button-border: rgba(226, 174, 70, .56);
        --hwhx-theme-font-family: Georgia, "Times New Roman", serif;
        --hwhx-theme-border-style: double;
        --hwhx-theme-border-width: 2px;
        --hwhx-theme-radius-dialog: 9px;
        --hwhx-theme-radius-panel: 6px;
        --hwhx-theme-radius-control: 5px;
        --hwhx-theme-radius-small: 4px;
        --hwhx-theme-radius-pill: 6px;
        --hwhx-theme-dialog-title-shadow: 0 2px 0 rgba(0,0,0,.78), 0 0 12px rgba(99,230,209,.18);
        --hwhx-theme-progress-shadow: 0 24px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,224,129,.15);
        --hwhx-theme-progress-drag-shadow: 0 28px 70px rgba(0,0,0,.68), inset 0 1px 0 rgba(255,224,129,.18);
        --hwhx-theme-panel-shadow: inset 0 1px 0 rgba(255,224,129,.12), 0 3px 0 rgba(0,0,0,.24);
        --hwhx-theme-control-shadow: inset 0 1px 0 rgba(255,224,129,.12), 0 2px 0 rgba(0,0,0,.3);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(99,230,209,.18), inset 0 1px 0 rgba(255,224,129,.14);
        --hwhx-theme-button-shadow: inset 0 1px 0 rgba(255,224,129,.12), 0 2px 0 rgba(0,0,0,.3);
        --hwhx-theme-menu-shadow: 0 18px 44px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,224,129,.12);
        --hwhx-theme-hint-shadow: inset 0 1px 0 rgba(255,224,129,.1);
        --hwhx-theme-counter-shadow: 0 0 12px rgba(99,230,209,.22);
        --hwhx-theme-control-padding-y: 8px;
        --hwhx-theme-control-padding-x: 12px;
        --hwhx-theme-panel-padding-y: 12px;
        --hwhx-theme-panel-padding-x: 14px;
        --hwhx-theme-accordion-padding-y: 13px;
        --hwhx-theme-accordion-padding-x: 15px;
        --hwhx-theme-menu-padding: 10px;
        --hwhx-theme-option-padding-y: 7px;
        --hwhx-theme-option-padding-x: 9px;
      }

      :root[data-hwhx-ui-theme="astral-premiere"] {
        --hwhx-theme-overlay: rgba(5, 3, 22, .5);
        --hwhx-theme-dialog-border: rgba(198, 81, 224, .88);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(35, 18, 70, .99), rgba(8, 9, 31, .99)), #0a0a20;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(149, 61, 178, .88), rgba(168, 99, 19, .82));
        --hwhx-theme-actions-bg: rgba(10, 9, 31, .9);
        --hwhx-theme-surface-bg: #1c123a;
        --hwhx-theme-panel-bg: rgba(30, 18, 61, .96);
        --hwhx-theme-accordion-bg: rgba(37, 20, 73, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(71, 30, 96, .98), rgba(18, 14, 49, .98)), #1c123a;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(96, 39, 126, .98), rgba(25, 17, 65, .98)), #24184b;
        --hwhx-theme-control-border: rgba(175, 74, 204, .88);
        --hwhx-theme-control-border-hover: rgba(255, 126, 230, .96);
        --hwhx-theme-text: #fbf2ff;
        --hwhx-theme-control-text: #ffd6fb;
        --hwhx-theme-title: #fff0a6;
        --hwhx-theme-muted: #c5a8d4;
        --hwhx-theme-primary: #ff7ee6;
        --hwhx-theme-accent: #f4c86a;
        --hwhx-theme-hint-bg: rgba(37, 20, 73, .72);
        --hwhx-theme-hint-border: rgba(255, 126, 230, .62);
        --hwhx-theme-hint-text: #dec5e8;
        --hwhx-theme-shadow: 0 24px 58px rgba(0,0,0,.64), 0 0 32px rgba(198,81,224,.12), inset 0 1px 0 rgba(255,214,251,.13);
        --hwhx-theme-progress-border: rgba(255, 126, 230, .48);
        --hwhx-theme-progress-bg: rgba(9, 8, 30, .96);
        --hwhx-theme-progress-header-border: rgba(244, 200, 106, .28);
        --hwhx-theme-button-bg: rgba(47, 32, 67, .94);
        --hwhx-theme-button-bg-hover: rgba(64, 42, 88, .98);
        --hwhx-theme-button-border: rgba(198, 81, 224, .54);
        --hwhx-theme-font-family: "Trebuchet MS", Arial, sans-serif;
        --hwhx-theme-border-style: solid;
        --hwhx-theme-border-width: 1px;
        --hwhx-theme-radius-dialog: 15px;
        --hwhx-theme-radius-panel: 10px;
        --hwhx-theme-radius-control: 9px;
        --hwhx-theme-radius-small: 7px;
        --hwhx-theme-radius-pill: 999px;
        --hwhx-theme-dialog-title-shadow: 0 0 14px rgba(255,126,230,.32);
        --hwhx-theme-progress-shadow: 0 24px 60px rgba(0,0,0,.58), 0 0 28px rgba(198,81,224,.12), inset 0 1px 0 rgba(255,214,251,.12);
        --hwhx-theme-progress-drag-shadow: 0 28px 70px rgba(0,0,0,.66), 0 0 36px rgba(198,81,224,.16), inset 0 1px 0 rgba(255,214,251,.15);
        --hwhx-theme-panel-shadow: 0 8px 18px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,214,251,.1);
        --hwhx-theme-control-shadow: 0 4px 14px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,214,251,.1);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(255,126,230,.18), 0 4px 14px rgba(0,0,0,.22);
        --hwhx-theme-button-shadow: 0 4px 14px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,214,251,.1);
        --hwhx-theme-menu-shadow: 0 18px 44px rgba(0,0,0,.56), 0 0 24px rgba(198,81,224,.12), inset 0 1px 0 rgba(255,214,251,.1);
        --hwhx-theme-hint-shadow: 0 6px 16px rgba(0,0,0,.18);
        --hwhx-theme-counter-shadow: 0 0 12px rgba(255,126,230,.28);
        --hwhx-theme-control-padding-y: 8px;
        --hwhx-theme-control-padding-x: 12px;
        --hwhx-theme-panel-padding-y: 12px;
        --hwhx-theme-panel-padding-x: 14px;
        --hwhx-theme-accordion-padding-y: 13px;
        --hwhx-theme-accordion-padding-x: 15px;
        --hwhx-theme-menu-padding: 10px;
        --hwhx-theme-option-padding-y: 7px;
        --hwhx-theme-option-padding-x: 9px;
      }

      :root[data-hwhx-ui-theme="relic-vault"] {
        --hwhx-theme-overlay: rgba(12, 7, 4, .48);
        --hwhx-theme-dialog-border: rgba(181, 126, 67, .9);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(43, 25, 12, .99), rgba(17, 10, 7, .99)), #160c07;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(88, 54, 20, .9), rgba(48, 22, 61, .78));
        --hwhx-theme-actions-bg: rgba(18, 11, 7, .9);
        --hwhx-theme-surface-bg: #2a180c;
        --hwhx-theme-panel-bg: rgba(42, 24, 12, .96);
        --hwhx-theme-accordion-bg: rgba(48, 27, 13, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(79, 46, 20, .98), rgba(28, 15, 9, .98)), #2a180c;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(99, 59, 25, .98), rgba(39, 20, 11, .98)), #351e0f;
        --hwhx-theme-control-border: rgba(166, 112, 59, .9);
        --hwhx-theme-control-border-hover: rgba(219, 161, 85, .96);
        --hwhx-theme-text: #fff3df;
        --hwhx-theme-control-text: #f5d2a4;
        --hwhx-theme-title: #f3d28a;
        --hwhx-theme-muted: #c3a077;
        --hwhx-theme-primary: #c66dff;
        --hwhx-theme-accent: #d8a35c;
        --hwhx-theme-hint-bg: rgba(38, 20, 10, .72);
        --hwhx-theme-hint-border: rgba(198, 109, 255, .56);
        --hwhx-theme-hint-text: #e0c29c;
        --hwhx-theme-shadow: 0 22px 54px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,214,154,.14);
        --hwhx-theme-progress-border: rgba(198, 109, 255, .44);
        --hwhx-theme-progress-bg: rgba(17, 10, 7, .96);
        --hwhx-theme-progress-header-border: rgba(216, 163, 92, .3);
        --hwhx-theme-button-bg: rgba(53, 34, 23, .94);
        --hwhx-theme-button-bg-hover: rgba(70, 44, 29, .98);
        --hwhx-theme-button-border: rgba(181, 126, 67, .56);
        --hwhx-theme-font-family: Georgia, "Times New Roman", serif;
        --hwhx-theme-border-style: groove;
        --hwhx-theme-border-width: 2px;
        --hwhx-theme-radius-dialog: 7px;
        --hwhx-theme-radius-panel: 5px;
        --hwhx-theme-radius-control: 4px;
        --hwhx-theme-radius-small: 3px;
        --hwhx-theme-radius-pill: 4px;
        --hwhx-theme-dialog-title-shadow: 0 2px 0 rgba(0,0,0,.78);
        --hwhx-theme-progress-shadow: 0 22px 54px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,214,154,.13);
        --hwhx-theme-progress-drag-shadow: 0 26px 64px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,214,154,.16);
        --hwhx-theme-panel-shadow: inset 0 1px 0 rgba(255,214,154,.12), inset 0 -2px 0 rgba(0,0,0,.28);
        --hwhx-theme-control-shadow: inset 0 1px 0 rgba(255,214,154,.12), inset 0 -2px 0 rgba(0,0,0,.32);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(198,109,255,.18), inset 0 1px 0 rgba(255,214,154,.14);
        --hwhx-theme-button-shadow: inset 0 1px 0 rgba(255,214,154,.12), inset 0 -2px 0 rgba(0,0,0,.32);
        --hwhx-theme-menu-shadow: 0 16px 38px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,214,154,.12);
        --hwhx-theme-hint-shadow: inset 0 1px 0 rgba(255,214,154,.1);
        --hwhx-theme-counter-shadow: inset 0 1px 0 rgba(255,214,154,.1);
        --hwhx-theme-control-padding-y: 7px;
        --hwhx-theme-control-padding-x: 11px;
        --hwhx-theme-panel-padding-y: 10px;
        --hwhx-theme-panel-padding-x: 12px;
        --hwhx-theme-accordion-padding-y: 11px;
        --hwhx-theme-accordion-padding-x: 13px;
        --hwhx-theme-menu-padding: 8px;
        --hwhx-theme-option-padding-y: 6px;
        --hwhx-theme-option-padding-x: 8px;
      }

      :root[data-hwhx-ui-theme="arena-standard"] {
        --hwhx-theme-overlay: rgba(8, 5, 4, .46);
        --hwhx-theme-dialog-border: rgba(190, 125, 67, .9);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(37, 19, 9, .99), rgba(12, 8, 7, .99)), #120907;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(74, 43, 15, .88), rgba(83, 23, 21, .8));
        --hwhx-theme-actions-bg: rgba(14, 9, 7, .9);
        --hwhx-theme-surface-bg: #231209;
        --hwhx-theme-panel-bg: rgba(35, 18, 9, .96);
        --hwhx-theme-accordion-bg: rgba(42, 22, 10, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(67, 38, 15, .98), rgba(25, 12, 8, .98)), #231209;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(88, 50, 18, .98), rgba(36, 16, 10, .98)), #2f180b;
        --hwhx-theme-control-border: rgba(174, 105, 51, .9);
        --hwhx-theme-control-border-hover: rgba(231, 151, 76, .96);
        --hwhx-theme-text: #fff1df;
        --hwhx-theme-control-text: #ffd5a4;
        --hwhx-theme-title: #ffd86e;
        --hwhx-theme-muted: #c09673;
        --hwhx-theme-primary: #98e85f;
        --hwhx-theme-accent: #ff625f;
        --hwhx-theme-hint-bg: rgba(37, 20, 10, .7);
        --hwhx-theme-hint-border: rgba(255, 98, 95, .58);
        --hwhx-theme-hint-text: #dfb895;
        --hwhx-theme-shadow: 0 22px 52px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,203,116,.13);
        --hwhx-theme-progress-border: rgba(152, 232, 95, .44);
        --hwhx-theme-progress-bg: rgba(14, 9, 7, .96);
        --hwhx-theme-progress-header-border: rgba(255, 98, 95, .25);
        --hwhx-theme-button-bg: rgba(53, 29, 18, .94);
        --hwhx-theme-button-bg-hover: rgba(73, 38, 22, .98);
        --hwhx-theme-button-border: rgba(190, 125, 67, .56);
        --hwhx-theme-font-family: Tahoma, Arial, sans-serif;
        --hwhx-theme-border-style: ridge;
        --hwhx-theme-border-width: 2px;
        --hwhx-theme-radius-dialog: 5px;
        --hwhx-theme-radius-panel: 3px;
        --hwhx-theme-radius-control: 3px;
        --hwhx-theme-radius-small: 2px;
        --hwhx-theme-radius-pill: 3px;
        --hwhx-theme-dialog-title-shadow: 0 2px 0 rgba(0,0,0,.82);
        --hwhx-theme-progress-shadow: 0 20px 48px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,203,116,.13);
        --hwhx-theme-progress-drag-shadow: 0 24px 58px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,203,116,.16);
        --hwhx-theme-panel-shadow: inset 0 1px 0 rgba(255,203,116,.1), inset 0 -2px 0 rgba(0,0,0,.36);
        --hwhx-theme-control-shadow: inset 0 1px 0 rgba(255,203,116,.12), inset 0 -2px 0 rgba(0,0,0,.38);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(152,232,95,.16), inset 0 1px 0 rgba(255,203,116,.14);
        --hwhx-theme-button-shadow: inset 0 1px 0 rgba(255,203,116,.12), inset 0 -2px 0 rgba(0,0,0,.38);
        --hwhx-theme-menu-shadow: 0 16px 38px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,203,116,.11);
        --hwhx-theme-hint-shadow: inset 0 1px 0 rgba(255,203,116,.09);
        --hwhx-theme-counter-shadow: inset 0 1px 0 rgba(255,203,116,.1);
        --hwhx-theme-control-padding-y: 6px;
        --hwhx-theme-control-padding-x: 10px;
        --hwhx-theme-panel-padding-y: 9px;
        --hwhx-theme-panel-padding-x: 11px;
        --hwhx-theme-accordion-padding-y: 10px;
        --hwhx-theme-accordion-padding-x: 12px;
        --hwhx-theme-menu-padding: 7px;
        --hwhx-theme-option-padding-y: 5px;
        --hwhx-theme-option-padding-x: 7px;
      }

      :root[data-hwhx-ui-theme="emerald-crown"] {
        --hwhx-theme-overlay: rgba(1, 9, 3, .45);
        --hwhx-theme-dialog-border: rgba(113, 205, 70, .88);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(15, 50, 18, .99), rgba(7, 14, 9, .99)), #071009;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(42, 111, 27, .9), rgba(128, 88, 16, .78));
        --hwhx-theme-actions-bg: rgba(7, 15, 8, .9);
        --hwhx-theme-surface-bg: #0e2c11;
        --hwhx-theme-panel-bg: rgba(15, 45, 18, .96);
        --hwhx-theme-accordion-bg: rgba(18, 56, 21, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(38, 94, 27, .98), rgba(10, 27, 12, .98)), #0e2c11;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(51, 121, 35, .98), rgba(13, 38, 15, .98)), #133817;
        --hwhx-theme-control-border: rgba(96, 190, 68, .88);
        --hwhx-theme-control-border-hover: rgba(142, 245, 92, .96);
        --hwhx-theme-text: #f2ffe9;
        --hwhx-theme-control-text: #dcffd0;
        --hwhx-theme-title: #fff0a8;
        --hwhx-theme-muted: #b8ce9a;
        --hwhx-theme-primary: #75f04f;
        --hwhx-theme-accent: #ffd866;
        --hwhx-theme-hint-bg: rgba(17, 46, 18, .72);
        --hwhx-theme-hint-border: rgba(117, 240, 79, .64);
        --hwhx-theme-hint-text: #d3e8bc;
        --hwhx-theme-shadow: 0 24px 56px rgba(0,0,0,.6), 0 0 22px rgba(117,240,79,.1), inset 0 1px 0 rgba(255,232,124,.14);
        --hwhx-theme-progress-border: rgba(117, 240, 79, .48);
        --hwhx-theme-progress-bg: rgba(7, 15, 8, .96);
        --hwhx-theme-progress-header-border: rgba(255, 216, 102, .28);
        --hwhx-theme-button-bg: rgba(30, 58, 26, .94);
        --hwhx-theme-button-bg-hover: rgba(41, 78, 33, .98);
        --hwhx-theme-button-border: rgba(113, 205, 70, .54);
        --hwhx-theme-font-family: Verdana, Arial, sans-serif;
        --hwhx-theme-border-style: solid;
        --hwhx-theme-border-width: 1px;
        --hwhx-theme-radius-dialog: 20px;
        --hwhx-theme-radius-panel: 14px;
        --hwhx-theme-radius-control: 12px;
        --hwhx-theme-radius-small: 9px;
        --hwhx-theme-radius-pill: 999px;
        --hwhx-theme-dialog-title-shadow: 0 0 12px rgba(117,240,79,.24);
        --hwhx-theme-progress-shadow: 0 24px 60px rgba(0,0,0,.56), 0 0 24px rgba(117,240,79,.1), inset 0 1px 0 rgba(255,232,124,.12);
        --hwhx-theme-progress-drag-shadow: 0 28px 70px rgba(0,0,0,.64), 0 0 32px rgba(117,240,79,.14), inset 0 1px 0 rgba(255,232,124,.15);
        --hwhx-theme-panel-shadow: 0 8px 18px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,232,124,.1);
        --hwhx-theme-control-shadow: 0 4px 14px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,232,124,.1);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(117,240,79,.18), 0 4px 14px rgba(0,0,0,.2);
        --hwhx-theme-button-shadow: 0 4px 14px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,232,124,.1);
        --hwhx-theme-menu-shadow: 0 18px 44px rgba(0,0,0,.54), inset 0 1px 0 rgba(255,232,124,.1);
        --hwhx-theme-hint-shadow: 0 6px 16px rgba(0,0,0,.16);
        --hwhx-theme-counter-shadow: 0 0 12px rgba(117,240,79,.28);
        --hwhx-theme-control-padding-y: 8px;
        --hwhx-theme-control-padding-x: 12px;
        --hwhx-theme-panel-padding-y: 12px;
        --hwhx-theme-panel-padding-x: 14px;
        --hwhx-theme-accordion-padding-y: 13px;
        --hwhx-theme-accordion-padding-x: 15px;
        --hwhx-theme-menu-padding: 10px;
        --hwhx-theme-option-padding-y: 7px;
        --hwhx-theme-option-padding-x: 9px;
      }

      :root[data-hwhx-ui-theme="shadow-circus"] {
        --hwhx-theme-overlay: rgba(3, 3, 15, .5);
        --hwhx-theme-dialog-border: rgba(255, 79, 216, .84);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(31, 13, 58, .99), rgba(7, 8, 27, .99)), #08091b;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(117, 35, 143, .88), rgba(18, 72, 98, .82));
        --hwhx-theme-actions-bg: rgba(8, 8, 27, .9);
        --hwhx-theme-surface-bg: #180f32;
        --hwhx-theme-panel-bg: rgba(27, 15, 54, .96);
        --hwhx-theme-accordion-bg: rgba(33, 17, 66, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(58, 23, 88, .98), rgba(12, 13, 43, .98)), #180f32;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(80, 30, 118, .98), rgba(17, 20, 58, .98)), #201442;
        --hwhx-theme-control-border: rgba(211, 67, 197, .88);
        --hwhx-theme-control-border-hover: rgba(255, 93, 226, .96);
        --hwhx-theme-text: #f8f2ff;
        --hwhx-theme-control-text: #ffd8f6;
        --hwhx-theme-title: #ffd86b;
        --hwhx-theme-muted: #bba8d6;
        --hwhx-theme-primary: #ff4fd8;
        --hwhx-theme-accent: #5ee7ff;
        --hwhx-theme-hint-bg: rgba(29, 17, 60, .72);
        --hwhx-theme-hint-border: rgba(94, 231, 255, .6);
        --hwhx-theme-hint-text: #d7c7e9;
        --hwhx-theme-shadow: 0 24px 58px rgba(0,0,0,.64), 0 0 30px rgba(94,231,255,.08), inset 0 1px 0 rgba(255,216,246,.12);
        --hwhx-theme-progress-border: rgba(255, 79, 216, .48);
        --hwhx-theme-progress-bg: rgba(8, 8, 27, .96);
        --hwhx-theme-progress-header-border: rgba(94, 231, 255, .28);
        --hwhx-theme-button-bg: rgba(41, 31, 65, .94);
        --hwhx-theme-button-bg-hover: rgba(55, 40, 86, .98);
        --hwhx-theme-button-border: rgba(255, 79, 216, .5);
        --hwhx-theme-font-family: "Segoe UI", Arial, sans-serif;
        --hwhx-theme-border-style: solid;
        --hwhx-theme-border-width: 1px;
        --hwhx-theme-radius-dialog: 16px;
        --hwhx-theme-radius-panel: 9px;
        --hwhx-theme-radius-control: 8px;
        --hwhx-theme-radius-small: 6px;
        --hwhx-theme-radius-pill: 999px;
        --hwhx-theme-dialog-title-shadow: 0 0 14px rgba(255,79,216,.32);
        --hwhx-theme-progress-shadow: 0 24px 60px rgba(0,0,0,.58), 0 0 26px rgba(255,79,216,.12), inset 0 1px 0 rgba(255,216,246,.1);
        --hwhx-theme-progress-drag-shadow: 0 28px 70px rgba(0,0,0,.66), 0 0 34px rgba(255,79,216,.16), inset 0 1px 0 rgba(255,216,246,.13);
        --hwhx-theme-panel-shadow: 0 8px 20px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,216,246,.09);
        --hwhx-theme-control-shadow: 0 4px 14px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,216,246,.09);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(94,231,255,.18), 0 4px 14px rgba(0,0,0,.22);
        --hwhx-theme-button-shadow: 0 4px 14px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,216,246,.09);
        --hwhx-theme-menu-shadow: 0 18px 44px rgba(0,0,0,.56), 0 0 24px rgba(94,231,255,.1), inset 0 1px 0 rgba(255,216,246,.09);
        --hwhx-theme-hint-shadow: 0 6px 16px rgba(0,0,0,.18);
        --hwhx-theme-counter-shadow: 0 0 12px rgba(94,231,255,.26);
        --hwhx-theme-control-padding-y: 8px;
        --hwhx-theme-control-padding-x: 12px;
        --hwhx-theme-panel-padding-y: 12px;
        --hwhx-theme-panel-padding-x: 14px;
        --hwhx-theme-accordion-padding-y: 13px;
        --hwhx-theme-accordion-padding-x: 15px;
        --hwhx-theme-menu-padding: 10px;
        --hwhx-theme-option-padding-y: 7px;
        --hwhx-theme-option-padding-x: 9px;
      }

      :root[data-hwhx-ui-theme="ruby-canyon"] {
        --hwhx-theme-overlay: rgba(12, 2, 2, .48);
        --hwhx-theme-dialog-border: rgba(217, 106, 69, .9);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(52, 14, 11, .99), rgba(15, 7, 7, .99)), #140707;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(118, 33, 22, .9), rgba(87, 58, 17, .78));
        --hwhx-theme-actions-bg: rgba(17, 7, 7, .9);
        --hwhx-theme-surface-bg: #2f0d0a;
        --hwhx-theme-panel-bg: rgba(46, 13, 10, .96);
        --hwhx-theme-accordion-bg: rgba(55, 16, 12, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(90, 29, 17, .98), rgba(29, 10, 8, .98)), #2f0d0a;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(119, 38, 21, .98), rgba(42, 13, 9, .98)), #3d110b;
        --hwhx-theme-control-border: rgba(199, 86, 58, .88);
        --hwhx-theme-control-border-hover: rgba(255, 120, 87, .96);
        --hwhx-theme-text: #fff2e7;
        --hwhx-theme-control-text: #ffd4bc;
        --hwhx-theme-title: #ffd08a;
        --hwhx-theme-muted: #d09578;
        --hwhx-theme-primary: #ff6a5f;
        --hwhx-theme-accent: #62dfd3;
        --hwhx-theme-hint-bg: rgba(49, 15, 12, .72);
        --hwhx-theme-hint-border: rgba(98, 223, 211, .56);
        --hwhx-theme-hint-text: #e5b7a1;
        --hwhx-theme-shadow: 0 24px 56px rgba(0,0,0,.64), inset 0 1px 0 rgba(255,178,115,.14);
        --hwhx-theme-progress-border: rgba(255, 106, 95, .5);
        --hwhx-theme-progress-bg: rgba(17, 7, 7, .96);
        --hwhx-theme-progress-header-border: rgba(98, 223, 211, .24);
        --hwhx-theme-button-bg: rgba(61, 25, 19, .94);
        --hwhx-theme-button-bg-hover: rgba(82, 32, 23, .98);
        --hwhx-theme-button-border: rgba(217, 106, 69, .56);
        --hwhx-theme-font-family: "Trebuchet MS", Arial, sans-serif;
        --hwhx-theme-border-style: ridge;
        --hwhx-theme-border-width: 2px;
        --hwhx-theme-radius-dialog: 8px;
        --hwhx-theme-radius-panel: 5px;
        --hwhx-theme-radius-control: 4px;
        --hwhx-theme-radius-small: 3px;
        --hwhx-theme-radius-pill: 4px;
        --hwhx-theme-dialog-title-shadow: 0 2px 0 rgba(0,0,0,.82), 0 0 10px rgba(255,106,95,.22);
        --hwhx-theme-progress-shadow: 0 22px 54px rgba(0,0,0,.64), inset 0 1px 0 rgba(255,178,115,.13);
        --hwhx-theme-progress-drag-shadow: 0 26px 64px rgba(0,0,0,.72), inset 0 1px 0 rgba(255,178,115,.16);
        --hwhx-theme-panel-shadow: inset 0 1px 0 rgba(255,178,115,.12), inset 0 -2px 0 rgba(0,0,0,.34);
        --hwhx-theme-control-shadow: inset 0 1px 0 rgba(255,178,115,.12), inset 0 -2px 0 rgba(0,0,0,.36);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(98,223,211,.17), inset 0 1px 0 rgba(255,178,115,.14);
        --hwhx-theme-button-shadow: inset 0 1px 0 rgba(255,178,115,.12), inset 0 -2px 0 rgba(0,0,0,.36);
        --hwhx-theme-menu-shadow: 0 16px 40px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,178,115,.12);
        --hwhx-theme-hint-shadow: inset 0 1px 0 rgba(255,178,115,.1);
        --hwhx-theme-counter-shadow: 0 0 12px rgba(98,223,211,.2);
        --hwhx-theme-control-padding-y: 7px;
        --hwhx-theme-control-padding-x: 10px;
        --hwhx-theme-panel-padding-y: 10px;
        --hwhx-theme-panel-padding-x: 12px;
        --hwhx-theme-accordion-padding-y: 11px;
        --hwhx-theme-accordion-padding-x: 13px;
        --hwhx-theme-menu-padding: 8px;
        --hwhx-theme-option-padding-y: 6px;
        --hwhx-theme-option-padding-x: 7px;
      }

      :root[data-hwhx-ui-theme="storm-workshop"] {
        --hwhx-theme-overlay: rgba(3, 7, 10, .48);
        --hwhx-theme-dialog-border: rgba(105, 157, 180, .86);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(20, 35, 43, .99), rgba(7, 12, 16, .99)), #081015;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(38, 68, 82, .9), rgba(107, 78, 26, .78));
        --hwhx-theme-actions-bg: rgba(8, 13, 16, .9);
        --hwhx-theme-surface-bg: #14232b;
        --hwhx-theme-panel-bg: rgba(20, 35, 43, .96);
        --hwhx-theme-accordion-bg: rgba(23, 41, 50, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(39, 68, 80, .98), rgba(11, 20, 26, .98)), #14232b;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(52, 88, 102, .98), rgba(15, 28, 36, .98)), #1a2e38;
        --hwhx-theme-control-border: rgba(93, 145, 168, .88);
        --hwhx-theme-control-border-hover: rgba(132, 215, 244, .96);
        --hwhx-theme-text: #eef8ff;
        --hwhx-theme-control-text: #d5f0ff;
        --hwhx-theme-title: #d7f5ff;
        --hwhx-theme-muted: #9db6c5;
        --hwhx-theme-primary: #79d8ff;
        --hwhx-theme-accent: #ffcf5b;
        --hwhx-theme-hint-bg: rgba(20, 36, 45, .72);
        --hwhx-theme-hint-border: rgba(255, 207, 91, .58);
        --hwhx-theme-hint-text: #c8dde8;
        --hwhx-theme-shadow: 0 24px 56px rgba(0,0,0,.62), inset 0 1px 0 rgba(180,232,255,.13);
        --hwhx-theme-progress-border: rgba(121, 216, 255, .48);
        --hwhx-theme-progress-bg: rgba(8, 13, 16, .96);
        --hwhx-theme-progress-header-border: rgba(255, 207, 91, .26);
        --hwhx-theme-button-bg: rgba(34, 50, 58, .94);
        --hwhx-theme-button-bg-hover: rgba(45, 66, 76, .98);
        --hwhx-theme-button-border: rgba(105, 157, 180, .52);
        --hwhx-theme-font-family: Consolas, "Segoe UI", monospace;
        --hwhx-theme-border-style: solid;
        --hwhx-theme-border-width: 1px;
        --hwhx-theme-radius-dialog: 6px;
        --hwhx-theme-radius-panel: 4px;
        --hwhx-theme-radius-control: 4px;
        --hwhx-theme-radius-small: 3px;
        --hwhx-theme-radius-pill: 4px;
        --hwhx-theme-dialog-title-shadow: 0 0 12px rgba(121,216,255,.26);
        --hwhx-theme-progress-shadow: 0 22px 54px rgba(0,0,0,.6), inset 0 1px 0 rgba(180,232,255,.14);
        --hwhx-theme-progress-drag-shadow: 0 26px 64px rgba(0,0,0,.68), inset 0 1px 0 rgba(180,232,255,.16);
        --hwhx-theme-panel-shadow: inset 0 1px 0 rgba(180,232,255,.1), 0 1px 0 rgba(255,207,91,.08);
        --hwhx-theme-control-shadow: inset 0 1px 0 rgba(180,232,255,.1), 0 1px 0 rgba(0,0,0,.24);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(121,216,255,.18), inset 0 1px 0 rgba(180,232,255,.13);
        --hwhx-theme-button-shadow: inset 0 1px 0 rgba(180,232,255,.1), 0 1px 0 rgba(0,0,0,.24);
        --hwhx-theme-menu-shadow: 0 16px 40px rgba(0,0,0,.58), inset 0 1px 0 rgba(180,232,255,.1);
        --hwhx-theme-hint-shadow: inset 0 1px 0 rgba(180,232,255,.08);
        --hwhx-theme-counter-shadow: 0 0 12px rgba(121,216,255,.22);
        --hwhx-theme-control-padding-y: 6px;
        --hwhx-theme-control-padding-x: 10px;
        --hwhx-theme-panel-padding-y: 9px;
        --hwhx-theme-panel-padding-x: 11px;
        --hwhx-theme-accordion-padding-y: 10px;
        --hwhx-theme-accordion-padding-x: 12px;
        --hwhx-theme-menu-padding: 8px;
        --hwhx-theme-option-padding-y: 6px;
        --hwhx-theme-option-padding-x: 7px;
      }

      :root[data-hwhx-ui-theme="lunar-oracle"] {
        --hwhx-theme-overlay: rgba(4, 4, 16, .48);
        --hwhx-theme-dialog-border: rgba(172, 157, 222, .86);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(25, 22, 49, .99), rgba(9, 10, 24, .99)), #0a0b18;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(65, 54, 112, .88), rgba(25, 91, 86, .78));
        --hwhx-theme-actions-bg: rgba(10, 10, 24, .9);
        --hwhx-theme-surface-bg: #191631;
        --hwhx-theme-panel-bg: rgba(25, 22, 49, .96);
        --hwhx-theme-accordion-bg: rgba(30, 26, 58, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(51, 43, 89, .98), rgba(15, 16, 38, .98)), #191631;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(67, 56, 115, .98), rgba(20, 22, 51, .98)), #211c41;
        --hwhx-theme-control-border: rgba(152, 137, 202, .88);
        --hwhx-theme-control-border-hover: rgba(207, 190, 255, .96);
        --hwhx-theme-text: #f7f2ff;
        --hwhx-theme-control-text: #e6dcff;
        --hwhx-theme-title: #f2e7ff;
        --hwhx-theme-muted: #b4a6d7;
        --hwhx-theme-primary: #c9b9ff;
        --hwhx-theme-accent: #83f1df;
        --hwhx-theme-hint-bg: rgba(27, 24, 54, .72);
        --hwhx-theme-hint-border: rgba(131, 241, 223, .58);
        --hwhx-theme-hint-text: #d5c9ee;
        --hwhx-theme-shadow: 0 24px 56px rgba(0,0,0,.6), inset 0 1px 0 rgba(226,218,255,.13);
        --hwhx-theme-progress-border: rgba(201, 185, 255, .48);
        --hwhx-theme-progress-bg: rgba(10, 10, 24, .96);
        --hwhx-theme-progress-header-border: rgba(131, 241, 223, .26);
        --hwhx-theme-button-bg: rgba(40, 35, 63, .94);
        --hwhx-theme-button-bg-hover: rgba(53, 46, 83, .98);
        --hwhx-theme-button-border: rgba(172, 157, 222, .52);
        --hwhx-theme-font-family: "Segoe UI", Arial, sans-serif;
        --hwhx-theme-border-style: solid;
        --hwhx-theme-border-width: 1px;
        --hwhx-theme-radius-dialog: 18px;
        --hwhx-theme-radius-panel: 12px;
        --hwhx-theme-radius-control: 11px;
        --hwhx-theme-radius-small: 8px;
        --hwhx-theme-radius-pill: 999px;
        --hwhx-theme-dialog-title-shadow: 0 0 12px rgba(201,185,255,.28);
        --hwhx-theme-progress-shadow: 0 24px 60px rgba(0,0,0,.56), 0 0 26px rgba(131,241,223,.08), inset 0 1px 0 rgba(226,218,255,.12);
        --hwhx-theme-progress-drag-shadow: 0 28px 70px rgba(0,0,0,.64), 0 0 32px rgba(131,241,223,.12), inset 0 1px 0 rgba(226,218,255,.15);
        --hwhx-theme-panel-shadow: 0 8px 20px rgba(0,0,0,.18), inset 0 1px 0 rgba(226,218,255,.1);
        --hwhx-theme-control-shadow: 0 4px 14px rgba(0,0,0,.18), inset 0 1px 0 rgba(226,218,255,.1);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(131,241,223,.18), 0 4px 14px rgba(0,0,0,.2);
        --hwhx-theme-button-shadow: 0 4px 14px rgba(0,0,0,.2), inset 0 1px 0 rgba(226,218,255,.1);
        --hwhx-theme-menu-shadow: 0 18px 44px rgba(0,0,0,.54), inset 0 1px 0 rgba(226,218,255,.1);
        --hwhx-theme-hint-shadow: 0 6px 16px rgba(0,0,0,.16);
        --hwhx-theme-counter-shadow: 0 0 12px rgba(131,241,223,.22);
        --hwhx-theme-control-padding-y: 8px;
        --hwhx-theme-control-padding-x: 12px;
        --hwhx-theme-panel-padding-y: 12px;
        --hwhx-theme-panel-padding-x: 14px;
        --hwhx-theme-accordion-padding-y: 13px;
        --hwhx-theme-accordion-padding-x: 15px;
        --hwhx-theme-menu-padding: 10px;
        --hwhx-theme-option-padding-y: 7px;
        --hwhx-theme-option-padding-x: 9px;
      }

      :root[data-hwhx-ui-theme="void-portal"] {
        --hwhx-theme-overlay: rgba(0, 0, 0, .54);
        --hwhx-theme-dialog-border: rgba(123, 85, 199, .9);
        --hwhx-theme-dialog-bg: linear-gradient(180deg, rgba(19, 10, 42, .99), rgba(3, 5, 8, .99)), #040508;
        --hwhx-theme-header-bg: linear-gradient(90deg, rgba(65, 33, 116, .88), rgba(27, 58, 16, .82));
        --hwhx-theme-actions-bg: rgba(4, 5, 8, .92);
        --hwhx-theme-surface-bg: #100824;
        --hwhx-theme-panel-bg: rgba(16, 8, 36, .96);
        --hwhx-theme-accordion-bg: rgba(21, 10, 46, .94);
        --hwhx-theme-control-bg: linear-gradient(180deg, rgba(43, 22, 77, .98), rgba(6, 8, 13, .98)), #100824;
        --hwhx-theme-control-bg-hover: linear-gradient(180deg, rgba(58, 28, 103, .98), rgba(10, 13, 18, .98)), #170b33;
        --hwhx-theme-control-border: rgba(105, 69, 178, .88);
        --hwhx-theme-control-border-hover: rgba(177, 120, 255, .96);
        --hwhx-theme-text: #f5ffe8;
        --hwhx-theme-control-text: #e7ffd0;
        --hwhx-theme-title: #f2ffb0;
        --hwhx-theme-muted: #aaa7ba;
        --hwhx-theme-primary: #b7ff4a;
        --hwhx-theme-accent: #b178ff;
        --hwhx-theme-hint-bg: rgba(16, 8, 36, .74);
        --hwhx-theme-hint-border: rgba(183, 255, 74, .58);
        --hwhx-theme-hint-text: #d3dfc3;
        --hwhx-theme-shadow: 0 26px 62px rgba(0,0,0,.7), 0 0 28px rgba(177,120,255,.12), inset 0 1px 0 rgba(183,255,74,.1);
        --hwhx-theme-progress-border: rgba(183, 255, 74, .46);
        --hwhx-theme-progress-bg: rgba(4, 5, 8, .96);
        --hwhx-theme-progress-header-border: rgba(177, 120, 255, .28);
        --hwhx-theme-button-bg: rgba(25, 24, 35, .94);
        --hwhx-theme-button-bg-hover: rgba(35, 33, 48, .98);
        --hwhx-theme-button-border: rgba(123, 85, 199, .54);
        --hwhx-theme-font-family: Arial, sans-serif;
        --hwhx-theme-border-style: solid;
        --hwhx-theme-border-width: 1px;
        --hwhx-theme-radius-dialog: 4px;
        --hwhx-theme-radius-panel: 3px;
        --hwhx-theme-radius-control: 2px;
        --hwhx-theme-radius-small: 2px;
        --hwhx-theme-radius-pill: 2px;
        --hwhx-theme-dialog-title-shadow: 0 0 14px rgba(183,255,74,.28);
        --hwhx-theme-progress-shadow: 0 24px 60px rgba(0,0,0,.68), 0 0 26px rgba(177,120,255,.12), inset 0 1px 0 rgba(183,255,74,.09);
        --hwhx-theme-progress-drag-shadow: 0 28px 70px rgba(0,0,0,.76), 0 0 34px rgba(177,120,255,.16), inset 0 1px 0 rgba(183,255,74,.12);
        --hwhx-theme-panel-shadow: inset 0 1px 0 rgba(183,255,74,.08), inset 0 -2px 0 rgba(0,0,0,.4);
        --hwhx-theme-control-shadow: inset 0 1px 0 rgba(183,255,74,.08), inset 0 -2px 0 rgba(0,0,0,.42);
        --hwhx-theme-control-focus-shadow: 0 0 0 2px rgba(183,255,74,.18), inset 0 1px 0 rgba(183,255,74,.1);
        --hwhx-theme-button-shadow: inset 0 1px 0 rgba(183,255,74,.08), inset 0 -2px 0 rgba(0,0,0,.42);
        --hwhx-theme-menu-shadow: 0 18px 44px rgba(0,0,0,.68), 0 0 24px rgba(177,120,255,.12), inset 0 1px 0 rgba(183,255,74,.08);
        --hwhx-theme-hint-shadow: inset 0 1px 0 rgba(183,255,74,.08);
        --hwhx-theme-counter-shadow: 0 0 12px rgba(183,255,74,.24);
        --hwhx-theme-control-padding-y: 6px;
        --hwhx-theme-control-padding-x: 9px;
        --hwhx-theme-panel-padding-y: 9px;
        --hwhx-theme-panel-padding-x: 10px;
        --hwhx-theme-accordion-padding-y: 10px;
        --hwhx-theme-accordion-padding-x: 12px;
        --hwhx-theme-menu-padding: 7px;
        --hwhx-theme-option-padding-y: 5px;
        --hwhx-theme-option-padding-x: 7px;
      }

      .hwhx-progress {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 10002;
        width: min(640px, calc(100vw - 32px));
        max-height: min(72vh, 620px);
        display: none;
        flex-direction: column;
        gap: 10px;
        padding: var(--hwhx-theme-panel-padding-y, 12px) var(--hwhx-theme-panel-padding-x, 12px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-progress-border, rgba(126, 190, 171, .48));
        border-radius: var(--hwhx-theme-radius-panel, 10px);
        background: var(--hwhx-theme-progress-bg, rgba(15, 18, 20, .96));
        color: var(--hwhx-theme-text, #f4efe5);
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
        font-size: 16px;
        line-height: 1.22;
        letter-spacing: 0;
        box-sizing: border-box;
        box-shadow: var(--hwhx-theme-progress-shadow, 0 18px 44px rgba(0,0,0,.46), inset 0 1px 0 rgba(255,255,255,.05));
        backdrop-filter: blur(2px);
      }

      .hwhx-progress[data-hwhx-progress-position="top-center"] {
        top: 16px;
        right: auto;
        left: 50%;
        bottom: auto;
        transform: translateX(-50%);
      }

      .hwhx-progress[data-hwhx-progress-position="top-right"] {
        top: 16px;
        right: 16px;
        left: auto;
        bottom: auto;
        transform: none;
      }

      .hwhx-progress[data-hwhx-progress-position="bottom-right"] {
        top: auto;
        right: 16px;
        left: auto;
        bottom: 16px;
        transform: none;
      }

      .hwhx-progress[data-hwhx-progress-dragging="1"] {
        transform: none;
      }

      .hwhx-progress[data-hwhx-progress-theme="graphite"] {
        --hwhx-theme-progress-border: rgba(156, 172, 191, .5);
        --hwhx-theme-progress-bg: rgba(19, 23, 31, .97);
        --hwhx-theme-progress-header-border: rgba(156, 172, 191, .26);
        --hwhx-theme-primary: #b8c7db;
        --hwhx-theme-accent: #d9e2ef;
      }

      .hwhx-progress[data-hwhx-progress-theme="green"],
      .hwhx-progress[data-hwhx-progress-theme="success"] {
        --hwhx-theme-progress-border: rgba(127, 227, 186, .58);
        --hwhx-theme-progress-bg: rgba(16, 35, 26, .97);
        --hwhx-theme-progress-header-border: rgba(127, 227, 186, .3);
        --hwhx-theme-primary: #7fe3ba;
        --hwhx-theme-accent: #d9ffe9;
      }

      .hwhx-progress[data-hwhx-progress-theme="gold"],
      .hwhx-progress[data-hwhx-progress-theme="warning"] {
        --hwhx-theme-progress-border: rgba(244, 212, 149, .62);
        --hwhx-theme-progress-bg: rgba(45, 31, 14, .97);
        --hwhx-theme-progress-header-border: rgba(244, 212, 149, .28);
        --hwhx-theme-primary: #ffd36e;
        --hwhx-theme-accent: #ffe8b0;
      }

      .hwhx-progress[data-hwhx-progress-theme="danger"] {
        --hwhx-theme-progress-border: rgba(239, 101, 96, .62);
        --hwhx-theme-progress-bg: rgba(43, 17, 17, .97);
        --hwhx-theme-progress-header-border: rgba(239, 101, 96, .28);
        --hwhx-theme-primary: #ff8f8b;
        --hwhx-theme-accent: #ffd7d5;
      }

      .hwhx-progress[data-hwhx-progress-style="compact"] {
        width: min(360px, calc(100vw - 32px));
        max-height: none;
        padding: var(--hwhx-theme-panel-padding-y, 10px) var(--hwhx-theme-panel-padding-x, 10px);
      }

      .hwhx-progress[data-hwhx-progress-style="compact"] .hwhx-progress__header {
        padding-bottom: 7px;
      }

      .hwhx-progress[data-hwhx-progress-style="compact"] .hwhx-progress__body {
        max-height: none;
        overflow: hidden;
        padding-right: 0;
      }

      .hwhx-progress.is-visible {
        display: flex;
      }

      .hwhx-progress__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding-bottom: 9px;
        border-bottom: 1px solid var(--hwhx-theme-progress-header-border, rgba(126, 190, 171, .22));
        cursor: move;
        user-select: none;
        touch-action: none;
      }

      .hwhx-progress[data-hwhx-progress-dragging="1"] {
        opacity: .96;
        box-shadow: var(--hwhx-theme-progress-drag-shadow, 0 22px 52px rgba(0,0,0,.54), inset 0 1px 0 rgba(255,255,255,.06));
      }

      .hwhx-progress__title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        color: var(--hwhx-theme-primary, #7fe3ba);
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .hwhx-progress__title::before {
        content: "";
        width: 8px;
        height: 8px;
        flex: 0 0 auto;
        border-radius: 3px;
        background: var(--hwhx-theme-primary, #7fe3ba);
        box-shadow: var(--hwhx-theme-counter-shadow, 0 0 12px color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 76%, transparent));
      }

      .hwhx-progress__close,
      .hwhx-button {
        appearance: none;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-button-border, var(--hwhx-theme-button-border, rgba(160, 171, 184, .42)));
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: var(--hwhx-button-bg, var(--hwhx-theme-button-bg, rgba(36, 40, 43, .92)));
        color: var(--hwhx-button-text, var(--hwhx-theme-text, #f4efe5));
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
        font-weight: 700;
        line-height: 1.15;
        letter-spacing: 0;
        cursor: pointer;
        box-sizing: border-box;
        box-shadow: var(--hwhx-theme-button-shadow, inset 0 1px 0 rgba(255,255,255,.05));
      }

      .hwhx-progress__close {
        width: 26px;
        height: 26px;
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--hwhx-theme-control-text, #cfd8dc);
        font-size: 13px;
      }

      .hwhx-progress__close:hover,
      .hwhx-button:hover {
        background: var(--hwhx-button-bg-hover, var(--hwhx-theme-button-bg-hover, rgba(54, 60, 64, .98)));
        color: #ffffff;
      }

      .hwhx-progress__body {
        max-height: calc(min(72vh, 620px) - 62px);
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 4px;
        scrollbar-width: thin;
        scrollbar-color: #4a8171 transparent;
      }

      .hwhx-progress__content {
        max-width: 100%;
        font-size: 16px;
        line-height: 1.18;
        overflow-wrap: anywhere;
        text-align: left;
        white-space: normal;
        word-break: break-word;
      }

      .hwhx-progress__waiting {
        margin-top: 10px;
        padding-top: 2px;
      }

      .hwhx-progress-content {
        font-size: 16px;
        line-height: 1.18;
        overflow-wrap: anywhere;
        text-align: left;
        white-space: normal;
        word-break: break-word;
      }

      .hwhx-progress-compact {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .hwhx-progress-compact__stage {
        color: #f4efe5;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hwhx-progress-compact__bar {
        position: relative;
        height: 9px;
        overflow: hidden;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 36%, transparent);
        border-radius: var(--hwhx-theme-radius-pill, 999px);
        background: rgba(255,255,255,.08);
      }

      .hwhx-progress-compact__fill {
        width: var(--hwhx-compact-progress, 0%);
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #7fe3ba 0%, #ffd36e 100%);
        transition: width .18s ease;
      }

      .hwhx-progress-compact__bar[data-indeterminate="1"] .hwhx-progress-compact__fill {
        position: absolute;
        width: 42%;
        animation: hwhx-compact-progress-run 1.15s ease-in-out infinite;
      }

      .hwhx-progress-compact-result {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #9fe0a8;
        font-size: 15px;
        font-weight: 800;
        line-height: 1.2;
      }

      .hwhx-progress-compact-result__icon {
        display: inline-flex;
        width: 22px;
        height: 22px;
        align-items: center;
        justify-content: center;
        border-radius: var(--hwhx-theme-radius-pill, 999px);
        background: rgba(127,227,186,.16);
        color: #9fe0a8;
      }

      @keyframes hwhx-compact-progress-run {
        0% { left: -45%; }
        50% { left: 38%; }
        100% { left: 105%; }
      }

      .hwhx-result-stack {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .hwhx-result-message,
      .hwhx-result-accordion {
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-result-border, rgba(126,190,171,.32));
        border-radius: var(--hwhx-theme-radius-panel, 8px);
        background: var(--hwhx-result-bg, rgba(32,36,38,.68));
        box-shadow: var(--hwhx-theme-panel-shadow, inset 0 1px 0 rgba(255,255,255,.04));
        box-sizing: border-box;
      }

      .hwhx-result-message {
        padding: var(--hwhx-theme-option-padding-y, 8px) var(--hwhx-theme-control-padding-x, 10px);
        color: #f4efe5;
        overflow-wrap: anywhere;
        white-space: normal;
        word-break: break-word;
      }

      .hwhx-result-accordion {
        overflow: hidden;
      }

      .hwhx-result-accordion > summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: var(--hwhx-theme-option-padding-y, 8px) var(--hwhx-theme-control-padding-x, 10px);
        color: var(--hwhx-result-accent, #9fe0a8);
        font-weight: 700;
        cursor: pointer;
        list-style: none;
      }

      .hwhx-result-accordion > summary::-webkit-details-marker {
        display: none;
      }

      .hwhx-result-accordion__title {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
      }

      .hwhx-result-accordion__arrow {
        display: inline-flex;
        width: 16px;
        height: 16px;
        align-items: center;
        justify-content: center;
        color: var(--hwhx-result-accent, #9fe0a8);
        transition: transform .16s ease;
      }

      .hwhx-result-accordion[open] .hwhx-result-accordion__arrow {
        transform: rotate(90deg);
      }

      .hwhx-result-accordion__count {
        flex: 0 0 auto;
        padding: 2px var(--hwhx-theme-option-padding-x, 7px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-result-border, rgba(126,190,171,.32));
        border-radius: var(--hwhx-theme-radius-pill, 999px);
        background: rgba(0,0,0,.16);
        color: #f4efe5;
        font-size: 12px;
        font-weight: 700;
        box-shadow: var(--hwhx-theme-counter-shadow, none);
      }

      .hwhx-result-accordion__body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 0 8px 8px;
      }

      .hwhx-result-row {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 6px 8px;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-result-row-border, rgba(255,255,255,.08));
        border-radius: var(--hwhx-theme-radius-small, 6px);
        background: var(--hwhx-result-row-bg, rgba(255,255,255,.045));
        color: #f4efe5;
        box-sizing: border-box;
        overflow-wrap: anywhere;
        white-space: normal;
        word-break: break-word;
      }

      .hwhx-result-row__head {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--hwhx-result-accent, #9fe0a8);
        font-weight: 800;
      }

      .hwhx-result-row__body {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        min-width: 0;
      }

      .hwhx-result-action,
      .hwhx-result-stage,
      .hwhx-result-spent {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        max-width: 100%;
        padding: 3px var(--hwhx-theme-option-padding-x, 7px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) rgba(255,255,255,.1);
        border-radius: var(--hwhx-theme-radius-pill, 999px);
        background: rgba(0,0,0,.18);
        font-size: 12px;
        font-weight: 700;
        line-height: 1.15;
        box-shadow: var(--hwhx-theme-counter-shadow, none);
      }

      .hwhx-result-action {
        border-color: var(--hwhx-result-row-border, rgba(255,255,255,.12));
        color: #f4efe5;
      }

      .hwhx-result-action__label,
      .hwhx-result-stage__label {
        color: rgba(244,239,229,.68);
      }

      .hwhx-result-action__value,
      .hwhx-result-stage__to {
        color: var(--hwhx-result-accent, #9fe0a8);
      }

      .hwhx-result-stage {
        border-color: rgba(255,211,110,.24);
        background: rgba(85,57,19,.3);
      }

      .hwhx-result-stage__from {
        color: #c9b58e;
      }

      .hwhx-result-stage__arrow {
        color: #ffd36e;
      }

      .hwhx-result-spent {
        color: #b89f78;
      }

      .hwhx-result-accordion[data-tone="farm"],
      .hwhx-result-row[data-kind="farm"] {
        --hwhx-result-accent: #8ee6b5;
        --hwhx-result-border: rgba(142,230,181,.34);
        --hwhx-result-bg: rgba(27,57,45,.42);
        --hwhx-result-row-bg: rgba(42,91,67,.28);
        --hwhx-result-row-border: rgba(142,230,181,.2);
      }

      .hwhx-result-accordion[data-tone="shop"],
      .hwhx-result-row[data-kind="shop"] {
        --hwhx-result-accent: #f2d18b;
        --hwhx-result-border: rgba(242,209,139,.34);
        --hwhx-result-bg: rgba(67,48,26,.42);
        --hwhx-result-row-bg: rgba(98,67,29,.26);
        --hwhx-result-row-border: rgba(242,209,139,.2);
      }

      .hwhx-result-accordion[data-tone="craft"],
      .hwhx-result-row[data-kind="craft"],
      .hwhx-result-row[data-kind="equip"],
      .hwhx-result-row[data-kind="promote"] {
        --hwhx-result-accent: #9fc7ff;
        --hwhx-result-border: rgba(159,199,255,.32);
        --hwhx-result-bg: rgba(31,49,75,.42);
        --hwhx-result-row-bg: rgba(45,70,106,.25);
        --hwhx-result-row-border: rgba(159,199,255,.18);
      }

      .hwhx-result-accordion[data-tone="technical"],
      .hwhx-result-row[data-kind="technical"],
      .hwhx-result-row[data-kind="spent"] {
        --hwhx-result-accent: #c1c8d2;
        --hwhx-result-border: rgba(193,200,210,.26);
        --hwhx-result-bg: rgba(42,45,50,.42);
        --hwhx-result-row-bg: rgba(70,74,82,.22);
        --hwhx-result-row-border: rgba(193,200,210,.16);
      }

      .hwhx-ellipsis {
        display: inline-block;
        max-width: var(--hwhx-ellipsis-width, 560px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: bottom;
      }

      .hwhx-progress .hwhx-ellipsis,
      .hwhx-progress-content .hwhx-ellipsis {
        display: inline;
        max-width: 100%;
        overflow: visible;
        overflow-wrap: anywhere;
        text-overflow: clip;
        white-space: normal;
        word-break: break-word;
      }

      .hwhx-icon-line {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        max-width: 100%;
        min-width: 0;
        vertical-align: bottom;
      }

      .hwhx-icon-line .hwhx-ellipsis {
        flex: 1 1 auto;
        min-width: 0;
      }

      .hwhx-summary-item {
        display: inline-flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        max-width: 100%;
      }

      .hwhx-summary-item__prefix {
        color: #d8c39a;
        font-weight: 700;
      }

      .hwhx-summary-item__name {
        min-width: 0;
        color: #f4efe5;
      }

      .hwhx-summary-item__amount {
        flex: 0 0 auto;
        color: #9fe0a8;
        font-weight: 700;
      }

      .hwhx-summary-item[data-kind="shop"] .hwhx-summary-item__name {
        color: #efd29f;
      }

      .hwhx-summary-item[data-kind="shop"] .hwhx-summary-item__amount {
        color: #ffd06a;
      }

      .hwhx-progress-bar {
        --hwhx-progress-value: 0%;
        --hwhx-progress-start: var(--hwhx-theme-primary, #78d07f);
        --hwhx-progress-end: var(--hwhx-theme-accent, #e6b85c);
        position: relative;
        width: var(--hwhx-progress-width, 320px);
        max-width: 100%;
        height: var(--hwhx-progress-height, 9px);
        margin-top: 4px;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-progress-start) 24%, transparent);
        border-radius: var(--hwhx-theme-radius-pill, 999px);
        background: rgba(255,255,255,.12);
        box-shadow: var(--hwhx-theme-control-shadow, none);
        overflow: hidden;
        box-sizing: border-box;
      }

      .hwhx-progress-bar[data-orientation="vertical"] {
        width: var(--hwhx-progress-width, 12px);
        height: var(--hwhx-progress-height, 120px);
        display: flex;
        align-items: flex-end;
      }

      .hwhx-progress-bar[data-variant="circle"] {
        width: var(--hwhx-progress-size, 48px);
        height: var(--hwhx-progress-size, 48px);
        display: inline-grid;
        place-items: center;
        border-radius: 50%;
        background:
          conic-gradient(var(--hwhx-progress-start) 0 var(--hwhx-progress-value), rgba(255,255,255,.12) var(--hwhx-progress-value) 100%);
      }

      .hwhx-progress-bar__fill {
        position: relative;
        width: var(--hwhx-progress-value, 0%);
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--hwhx-progress-start) 0%, var(--hwhx-progress-end) 100%);
        transition: width .18s ease, height .18s ease;
      }

      .hwhx-progress-bar[data-orientation="vertical"] .hwhx-progress-bar__fill {
        width: 100%;
        height: var(--hwhx-progress-value, 0%);
        background: linear-gradient(0deg, var(--hwhx-progress-start) 0%, var(--hwhx-progress-end) 100%);
      }

      .hwhx-progress-bar[data-variant="circle"] .hwhx-progress-bar__fill {
        display: none;
      }

      .hwhx-progress-bar__core {
        position: absolute;
        inset: max(5px, calc(var(--hwhx-progress-size, 48px) * .14));
        z-index: 1;
        border-radius: 50%;
        background: var(--hwhx-theme-progress-bg, rgba(15, 18, 20, .96));
        box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
      }

      .hwhx-progress-bar__label {
        position: relative;
        z-index: 2;
        padding: 0 4px;
        color: var(--hwhx-theme-text, #f4efe5);
        font-size: 11px;
        font-weight: 800;
        line-height: 1;
      }

      .hwhx-progress-bar[data-striped="1"] .hwhx-progress-bar__fill::after,
      .hwhx-progress-bar[data-variant="circle"][data-striped="1"]::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0;
        border-radius: inherit;
        background: repeating-linear-gradient(45deg, rgba(255,255,255,.2) 0 6px, transparent 6px 12px);
        background-size: 18px 18px;
        mix-blend-mode: screen;
        opacity: .72;
      }

      .hwhx-progress-bar[data-animated="1"] .hwhx-progress-bar__fill::after,
      .hwhx-progress-bar[data-variant="circle"][data-animated="1"]::after {
        animation: hwhx-progress-stripes .75s linear infinite;
      }

      .hwhx-progress-bar[data-indeterminate="1"] .hwhx-progress-bar__fill {
        position: absolute;
        width: 42%;
        animation: hwhx-progress-indeterminate 1.15s ease-in-out infinite;
      }

      .hwhx-progress-bar[data-intermediate="1"] {
        --hwhx-progress-start: #8fd3ff;
        --hwhx-progress-end: #7fe3ba;
        box-shadow:
          0 0 0 1px color-mix(in srgb, var(--hwhx-progress-start) 14%, transparent),
          0 6px 18px color-mix(in srgb, var(--hwhx-progress-end) 12%, transparent);
      }

      .hwhx-progress-bar[data-variant="circle"][data-intermediate="1"] {
        animation: hwhx-progress-spin 1.05s linear infinite;
      }

      .hwhx-progress-bar[data-tone="energy"] {
        --hwhx-progress-start: #8fd3ff;
        --hwhx-progress-end: #b47cff;
      }

      .hwhx-progress-bar[data-tone="items"],
      .hwhx-progress-bar[data-tone="success"] {
        --hwhx-progress-start: #78d07f;
        --hwhx-progress-end: #e6b85c;
      }

      .hwhx-progress-bar[data-tone="warning"] {
        --hwhx-progress-start: #ffd36e;
        --hwhx-progress-end: #f08d52;
      }

      .hwhx-progress-bar[data-tone="danger"] {
        --hwhx-progress-start: #ff8f8b;
        --hwhx-progress-end: #d64f5a;
      }

      .hwhx-progress-bar[data-tone="info"] {
        --hwhx-progress-start: #8fd3ff;
        --hwhx-progress-end: #7fe3ba;
      }

      .hwhx-progress-bar[data-tone="intermediate"] {
        --hwhx-progress-start: #8fd3ff;
        --hwhx-progress-end: #7fe3ba;
      }

      .hwhx-progress-bar--compact {
        width: 100%;
        margin-top: 0;
      }

      .hwhx-progress-bar--panel {
        width: 100%;
        margin-top: 0;
      }

      @keyframes hwhx-progress-stripes {
        from { background-position: 0 0; }
        to { background-position: 18px 0; }
      }

      @keyframes hwhx-progress-indeterminate {
        0% { left: -45%; }
        50% { left: 38%; }
        100% { left: 105%; }
      }

      @keyframes hwhx-progress-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .hwhx-modal {
        position: fixed;
        inset: 0;
        z-index: 10003;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 14px;
        background: var(--hwhx-theme-overlay, rgba(0, 0, 0, .28));
        box-sizing: border-box;
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
      }

      .hwhx-modal__dialog {
        width: min(1080px, calc(100vw - 28px));
        height: min(86vh, 820px);
        min-height: min(620px, calc(100vh - 28px));
        max-height: calc(100vh - 28px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-dialog-border, rgba(198, 135, 57, .86));
        border-radius: var(--hwhx-theme-radius-dialog, 12px);
        background: var(--hwhx-theme-dialog-bg, linear-gradient(180deg, rgba(34, 21, 12, .98), rgba(16, 10, 7, .98)), rgba(22, 14, 10, .98));
        color: var(--hwhx-theme-text, #f4efe5);
        box-shadow: var(--hwhx-theme-shadow, 0 18px 46px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,236,180,.1));
        box-sizing: border-box;
      }

      .hwhx-modal__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 48px;
        padding: 10px 14px 10px 18px;
        border-bottom: 1px solid var(--hwhx-theme-dialog-border, rgba(198, 135, 57, .34));
        background: var(--hwhx-theme-header-bg, rgba(42, 25, 13, .78));
        cursor: grab;
        touch-action: none;
        user-select: none;
        box-sizing: border-box;
      }

      .hwhx-modal__dialog.is-dragging {
        will-change: left, top;
      }

      .hwhx-modal__title {
        min-width: 0;
        flex: 1 1 auto;
        overflow: hidden;
        color: var(--hwhx-theme-title, #f5d18b);
        font-size: 18px;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-shadow: var(--hwhx-theme-dialog-title-shadow, 0 1px 0 rgba(0,0,0,.65));
      }

      .hwhx-modal__body {
        width: 100%;
        min-height: 0;
        flex: 1 1 auto;
        overflow: auto;
        padding: 18px 18px 34px;
        scrollbar-width: thin;
        scrollbar-color: var(--hwhx-theme-control-border-hover, #a66a26) transparent;
        box-sizing: border-box;
      }

      .hwhx-modal__actions {
        display: flex;
        justify-content: flex-end;
        align-items: stretch;
        flex-wrap: wrap;
        gap: 10px;
        width: 100%;
        flex: 0 0 auto;
        padding: 10px 18px 14px;
        border-top: 1px solid var(--hwhx-theme-dialog-border, rgba(198, 135, 57, .28));
        background: var(--hwhx-theme-actions-bg, rgba(18, 11, 7, .82));
        box-sizing: border-box;
      }

      @media (max-width: 640px) {
        .hwhx-modal__actions .hwhx-button {
          flex: 1 1 calc(50% - 10px);
          min-width: 0;
          max-width: none;
        }
      }

      .hwhx-modal__close {
        appearance: none;
        width: 34px;
        height: 34px;
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border-hover, rgba(255, 210, 118, .48));
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: rgba(83, 27, 23, .86);
        color: var(--hwhx-theme-title, #ffe6a5);
        cursor: pointer;
        box-sizing: border-box;
        box-shadow: var(--hwhx-theme-button-shadow, inset 0 1px 0 rgba(255,255,255,.08));
      }

      .hwhx-modal__close:hover {
        background: rgba(128, 42, 34, .96);
        color: #ffffff;
      }

      .hwhx-modal--hero-selection .hwhx-modal__dialog,
      .hwhx-modal--tier-selection .hwhx-modal__dialog,
      .hwhx-modal--custom-gear .hwhx-modal__dialog {
        width: min(1040px, calc(100vw - 28px));
      }

      .hwhx-modal--item-map .hwhx-modal__dialog {
        width: min(1120px, calc(100vw - 28px));
      }

      .hwhx-modal--hero-selection .hwhx-modal__body,
      .hwhx-modal--tier-selection .hwhx-modal__body,
      .hwhx-modal--custom-gear .hwhx-modal__body,
      .hwhx-modal--item-map .hwhx-modal__body {
        overflow: hidden;
      }

      .hwhx-native-body {
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }

      .hwhx-modal--hero-selection .hwhx-native-body,
      .hwhx-modal--tier-selection .hwhx-native-body,
      .hwhx-modal--custom-gear .hwhx-native-body,
      .hwhx-modal--item-map .hwhx-native-body {
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
      }

      .hwhx-modal--hero-selection .hwhx-native-body > .hwhx-popup,
      .hwhx-modal--tier-selection .hwhx-native-body > .hwhx-popup,
      .hwhx-modal--custom-gear .hwhx-native-body > .hwhx-popup,
      .hwhx-modal--item-map .hwhx-native-body > .hwhx-popup {
        flex: 1 1 auto;
        min-height: 0;
      }

      .hwhx-modal--hero-selection .hwhx-native-checkboxes,
      .hwhx-modal--tier-selection .hwhx-native-checkboxes {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding-right: 6px;
      }

      .hwhx-native-checkboxes {
        width: 100%;
        margin-top: 14px;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-sizing: border-box;
      }

      .hwhx-native-checkbox-row {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 36px;
        margin: 0;
        padding: var(--hwhx-theme-option-padding-y, 8px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(126, 80, 38, .48)) 72%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 8px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 88%, transparent);
        box-shadow: var(--hwhx-theme-control-shadow, inset 0 1px 0 rgba(255,255,255,.04));
        cursor: pointer;
        box-sizing: border-box;
      }

      .hwhx-native-checkbox-row:hover {
        border-color: rgba(231, 167, 73, .6);
        background: rgba(45, 27, 16, .94);
      }

      .hwhx-native-checkbox-row.is-disabled {
        opacity: .68;
        cursor: not-allowed;
      }

      .hwhx-native-checkbox-label {
        min-width: 0;
        flex: 1 1 auto;
      }

      .hwhx-tooltip {
        position: fixed;
        z-index: 10006;
        max-width: min(360px, calc(100vw - 24px));
        padding: var(--hwhx-theme-option-padding-y, 8px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border-hover, rgba(198, 135, 57, .72));
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: var(--hwhx-theme-dialog-bg, rgba(26, 17, 12, .98));
        color: var(--hwhx-theme-control-text, #f7e0bc);
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
        font-size: 13px;
        font-weight: 600;
        line-height: 1.25;
        letter-spacing: 0;
        box-shadow: var(--hwhx-theme-menu-shadow, 0 10px 24px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.06));
        pointer-events: none;
        user-select: none;
        opacity: 0;
        transform: translate3d(0, -4px, 0) scale(.98);
        transform-origin: 50% 100%;
        transition:
          opacity .14s ease,
          transform .14s ease;
        will-change: left, top, opacity, transform;
        box-sizing: border-box;
      }

      .hwhx-tooltip.is-visible {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }

      .hwhx-tooltip.is-hiding {
        opacity: 0;
        transform: translate3d(0, -3px, 0) scale(.98);
      }

      .hwhx-tooltip[data-placement="bottom"],
      .hwhx-tooltip[data-placement="cursor"] {
        transform-origin: 50% 0;
      }

      .hwhx-tooltip[data-placement="left"] {
        transform-origin: 100% 50%;
      }

      .hwhx-tooltip[data-placement="right"] {
        transform-origin: 0 50%;
      }

      .hwhx-tooltip[data-theme="graphite"] {
        border-color: rgba(156, 172, 191, .64);
        background: rgba(20, 24, 32, .98);
        color: #e6edf7;
      }

      .hwhx-tooltip[data-theme="green"],
      .hwhx-tooltip[data-theme="success"] {
        border-color: rgba(127, 227, 186, .68);
        background: rgba(23, 45, 33, .98);
        color: #d9ffe9;
      }

      .hwhx-tooltip[data-theme="gold"],
      .hwhx-tooltip[data-theme="warning"] {
        border-color: rgba(244, 212, 149, .72);
        background: rgba(48, 34, 16, .98);
        color: #ffe2a6;
      }

      .hwhx-tooltip[data-theme="danger"] {
        border-color: rgba(239, 101, 96, .7);
        background: rgba(47, 20, 20, .98);
        color: #ffd7d5;
      }

      .hwhx-tooltip b,
      .hwhx-tooltip strong {
        color: #ffffff;
      }

      .hwhx-tooltip ul,
      .hwhx-tooltip ol {
        margin: 6px 0 0 18px;
        padding: 0;
      }

      .hwhx-tooltip p {
        margin: 0;
      }

      .hwhx-tooltip p + p {
        margin-top: 6px;
      }

      .hwhx-native-actions {
        display: flex;
        align-items: stretch;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 6px;
        width: 100%;
        margin-top: 12px;
        box-sizing: border-box;
      }

      .hwhx-native-actions--left {
        justify-content: flex-start;
      }

      .hwhx-button {
        min-height: 32px;
        min-width: 132px;
        flex: 0 1 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        padding: var(--hwhx-theme-control-padding-y, 6px) var(--hwhx-theme-control-padding-x, 12px);
        font-size: 14px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .hwhx-button--modal {
        flex: 0 1 auto;
      }

      .hwhx-button--mini {
        min-width: 0;
        min-height: 28px;
        padding: 5px 8px;
        gap: 6px;
        font-size: 12px;
      }

      .hwhx-button__icon,
      .hwhx-lucide {
        width: 16px;
        height: 16px;
        flex: 0 0 auto;
      }

      .hwhx-button__label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hwhx-modal__actions .hwhx-button {
        max-width: min(260px, 100%);
      }

      .hwhx-button[data-tone="green"] {
        --hwhx-button-border: rgba(101, 200, 120, .72);
        --hwhx-button-bg: rgba(31, 58, 38, .94);
        --hwhx-button-bg-hover: rgba(39, 76, 48, .98);
      }

      .hwhx-button[data-tone="blue"] {
        --hwhx-button-border: rgba(88, 174, 232, .72);
        --hwhx-button-bg: rgba(27, 51, 69, .94);
        --hwhx-button-bg-hover: rgba(34, 65, 88, .98);
      }

      .hwhx-button[data-tone="graphite"] {
        --hwhx-button-border: rgba(160, 171, 184, .52);
        --hwhx-button-bg: rgba(38, 40, 43, .96);
        --hwhx-button-bg-hover: rgba(50, 53, 57, .98);
      }

      .hwhx-field {
        width: 100%;
        min-height: 34px;
        padding: var(--hwhx-theme-control-padding-y, 7px) var(--hwhx-theme-control-padding-x, 11px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border, rgba(141, 97, 51, .9));
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: var(--hwhx-theme-control-bg, linear-gradient(180deg, rgba(55, 35, 22, .98), rgba(29, 18, 12, .98)), rgba(31, 20, 14, .98));
        color: var(--hwhx-theme-control-text, #f7e0bc);
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
        font-size: 15px;
        line-height: 1.2;
        letter-spacing: 0;
        box-sizing: border-box;
        outline: none;
        box-shadow: var(--hwhx-theme-control-shadow, inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px rgba(0,0,0,.16));
      }

      .hwhx-field:focus {
        border-color: var(--hwhx-theme-primary, #7fe3ba);
        box-shadow: var(--hwhx-theme-control-focus-shadow, 0 0 0 2px rgba(127, 227, 186, .13), inset 0 1px 0 rgba(255,255,255,.08));
      }

      .hwhx-field::placeholder {
        color: color-mix(in srgb, var(--hwhx-theme-muted, #d8c39a) 62%, transparent);
      }

      .hwhx-clearable-field {
        position: relative;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        display: inline-flex;
        align-items: stretch;
        flex: 1 1 auto;
      }

      .hwhx-clearable-field > .hwhx-field {
        padding-right: 35px;
      }

      .hwhx-clearable-field__clear {
        position: absolute;
        top: 50%;
        right: 5px;
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 0;
        border-radius: var(--hwhx-theme-radius-small, 6px);
        background: transparent;
        color: rgba(240, 213, 159, .78);
        cursor: pointer;
        transform: translateY(-50%);
        box-sizing: border-box;
      }

      .hwhx-clearable-field__clear:hover,
      .hwhx-clearable-field__clear:focus-visible {
        background: rgba(255, 218, 145, .1);
        color: #ffffff;
        outline: none;
      }

      .hwhx-clearable-field__clear[hidden] {
        display: none;
      }

      .hwhx-panel {
        margin: 12px 0 0;
        padding: var(--hwhx-theme-panel-padding-y, 10px) var(--hwhx-theme-panel-padding-x, 12px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-accent, #6e4a24);
        border-radius: var(--hwhx-theme-radius-panel, 8px);
        background: var(--hwhx-theme-panel-bg, #24160f);
        box-shadow: var(--hwhx-theme-panel-shadow, inset 0 1px 0 rgba(255,255,255,.04));
      }

      .hwhx-popup {
        width: 100%;
        min-width: 0;
        max-width: none;
        height: 100%;
        padding: 8px 0 14px;
        overflow-wrap: anywhere;
        color: var(--hwhx-theme-text, #f4efe5);
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
        font-size: 16px;
        line-height: 1.28;
        letter-spacing: 0;
        text-align: left;
        box-sizing: border-box;
      }

      .hwhx-modal--settings .hwhx-native-body > .hwhx-popup {
        padding: 10px var(--hwhx-theme-panel-padding-x, 12px) 38px;
      }

      .hwhx-native-body > .hwhx-popup::after {
        content: "";
        display: block;
        height: 28px;
        flex: 0 0 28px;
      }

      .hwhx-settings-search {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 10px;
        padding: 8px;
        border: 1px solid rgba(159, 217, 255, .34);
        border-radius: var(--hwhx-theme-radius-panel, 8px);
        background: color-mix(in srgb, var(--hwhx-theme-panel-bg, #24160f) 92%, black);
        box-shadow: 0 8px 16px rgba(0, 0, 0, .18);
      }

      .hwhx-settings-search__icon {
        display: inline-flex;
        color: var(--hwhx-theme-muted, #d8c39a);
      }

      .hwhx-settings-search__input {
        min-width: 0;
        flex: 1 1 auto;
      }

      .hwhx-settings-search__clear {
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 0;
        border-radius: var(--hwhx-theme-radius-small, 6px);
        background: transparent;
        color: rgba(240, 213, 159, .78);
        cursor: pointer;
      }

      .hwhx-settings-search__clear:hover,
      .hwhx-settings-search__clear:focus-visible {
        background: rgba(255, 218, 145, .1);
        color: #ffffff;
        outline: none;
      }

      .hwhx-settings-search-empty {
        margin: 12px 0;
        padding: 12px;
        border: 1px dashed rgba(216, 195, 154, .38);
        border-radius: var(--hwhx-theme-radius-panel, 8px);
        color: var(--hwhx-theme-muted, #d8c39a);
        text-align: center;
      }

      [data-hwhx-settings-search-hidden="1"] {
        display: none !important;
      }

      mark[data-hwhx-settings-search-mark] {
        padding: 0 2px;
        border-radius: 3px;
        background: rgba(255, 222, 92, .34);
        color: #fff7b0;
        box-shadow: inset 0 -1px 0 rgba(255, 222, 92, .45);
      }

      .hwhx-modal--settings .hwhx-native-body > .hwhx-popup > .hwhx-accordion:last-of-type {
        margin-bottom: 10px;
      }

      .hwhx-save-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: min(190px, 36vw);
        min-height: 26px;
        flex: 0 0 auto;
        margin: 0;
        padding: calc(var(--hwhx-theme-control-padding-y, 6px) - 1px) var(--hwhx-theme-option-padding-x, 9px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) rgba(122, 210, 133, .68);
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: rgba(21, 58, 34, .94);
        color: #b8f7c4;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
        white-space: nowrap;
        box-shadow: var(--hwhx-theme-counter-shadow, none);
        opacity: 0;
        transform: translateY(-4px);
        transition: opacity .16s ease, transform .16s ease, border-color .16s ease, background .16s ease, color .16s ease;
        pointer-events: none;
      }

      .hwhx-save-status[hidden] {
        display: none !important;
      }

      .hwhx-save-status.is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      .hwhx-save-status[data-state="saved"] {
        border-color: rgba(122, 210, 133, .74);
        background: rgba(21, 58, 34, .96);
        color: #b8f7c4;
      }

      .hwhx-save-status[data-state="error"] {
        border-color: rgba(255, 112, 112, .76);
        background: rgba(78, 24, 24, .96);
        color: #ffc0c0;
      }

      .hwhx-save-status .hwhx-label-icon {
        color: currentColor;
      }

      .hwhx-save-status [data-hwhauto-save-status-text] {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .hwhx-popup--compact {
        min-width: 0;
        max-width: min(520px, calc(100vw - 48px));
      }

      .hwhx-popup--narrow {
        max-width: none;
      }

      .hwhx-popup--wide {
        max-width: none;
      }

      .hwhx-popup--xwide {
        max-width: none;
      }

      .hwhx-popup--padded,
      .hwhx-modal--hero-manager .hwhx-native-body > .hwhx-popup,
      .hwhx-modal--hero-manager-level-limits .hwhx-native-body > .hwhx-popup {
        padding-top: 10px;
        padding-bottom: 38px;
      }

      .hwhx-modal--custom-gear .hwhx-popup {
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }

      .hwhx-selection-head {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        min-width: 0;
        max-width: none;
        text-align: left;
        box-sizing: border-box;
      }

      .hwhx-selection-head__title {
        color: #9fe0a8;
        font-weight: 700;
      }

      .hwhx-title {
        margin-bottom: 10px;
        color: #9fe0a8;
        font-size: 18px;
        font-weight: 700;
      }

      .hwhx-title small {
        color: #b89f78;
        font-size: 13px;
        font-weight: 700;
      }

      .hwhx-tabs {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
      }

      .hwhx-tabs__nav {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        padding: calc(var(--hwhx-theme-menu-padding, 8px) / 2);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(141, 97, 51, .56)) 76%, transparent);
        border-radius: var(--hwhx-theme-radius-panel, 8px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 72%, transparent);
        box-shadow: var(--hwhx-theme-panel-shadow, inset 0 1px 0 rgba(255,255,255,.04));
        box-sizing: border-box;
      }

      .hwhx-tabs__tab,
      button.hwhx-tabs__tab {
        appearance: none;
        -webkit-appearance: none;
        min-width: 0;
        min-height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: var(--hwhx-theme-control-padding-y, 7px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) transparent;
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: transparent;
        color: var(--hwhx-theme-muted, #d8c39a);
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
        font-size: 14px;
        font-weight: 700;
        line-height: 1.15;
        letter-spacing: 0;
        cursor: pointer;
        box-sizing: border-box;
      }

      .hwhx-tabs__tab > span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hwhx-tabs__tab:hover,
      .hwhx-tabs__tab:focus-visible {
        border-color: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 34%, transparent);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 18%, var(--hwhx-theme-surface-bg, #24160f));
        color: #ffffff;
        outline: none;
      }

      .hwhx-tabs__tab.is-active {
        border-color: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 52%, transparent);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 28%, var(--hwhx-theme-surface-bg, #24160f));
        color: var(--hwhx-theme-primary, #9fe0a8);
        box-shadow: var(--hwhx-theme-button-shadow, inset 0 1px 0 rgba(255,255,255,.06));
      }

      .hwhx-tabs__panels,
      .hwhx-tabs__panel {
        min-width: 0;
      }

      .hwhx-tabs__panel[hidden] {
        display: none !important;
      }

      .hwhx-module-tabs .hwhx-tabs__nav {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .hwhx-module-tab-content {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
        padding: 4px 0 6px;
      }

      @media (max-width: 640px) {
        .hwhx-tabs__nav {
          grid-template-columns: 1fr;
        }
      }

      .hwhx-muted {
        color: #b89f78;
      }

      .hwhx-muted-strong {
        color: #b89f78;
        opacity: .9;
      }

      .hwhx-text {
        color: #f4efe5;
      }

      .hwhx-title-accent {
        color: var(--hwhx-label-color, #9fe0a8);
        font-weight: 700;
      }

      .hwhx-gold {
        color: #ffd36e;
        font-weight: 700;
      }

      .hwhx-blue {
        color: #9fd3ff;
        font-weight: 700;
      }

      .hwhx-green {
        color: #9fe0a8;
        font-weight: 700;
      }

      .hwhx-purple {
        color: #d7b2ff;
        font-weight: 700;
      }

      .hwhx-danger {
        color: #ff9f9f;
        font-weight: 700;
      }

      .hwhx-stack {
        width: 100%;
        box-sizing: border-box;
      }

      .hwhx-stack--spaced {
        margin-top: 18px;
      }

      .hwhx-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        flex: 0 0 auto;
      }

      .hwhx-popup-heading {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: #9fe0a8;
        font-size: 16px;
        font-weight: 700;
      }

      .hwhx-app-header {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 6px;
      }

      .hwhx-app-header__title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #9fe0a8;
        font-weight: 700;
      }

      .hwhx-app-header__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        flex: 0 0 auto;
      }

      .hwhx-app-header__meta {
        padding-left: 26px;
        color: #b89f78;
        opacity: .95;
      }

      .hwhx-form-row,
      .hwhx-info-line {
        display: flex;
        justify-content: space-between;
        gap: 8px 12px;
        align-items: center;
        max-width: 100%;
        margin: 4px 0;
        box-sizing: border-box;
      }

      .hwhx-form-row {
        flex-wrap: wrap;
      }

      .hwhx-form-row.is-disabled {
        opacity: .58;
      }

      .hwhx-info-line {
        padding: 2px 0;
      }

      .hwhx-form-label-group {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        flex: 1 1 240px;
      }

      .hwhx-form-label,
      .hwhx-info-line__label {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
        color: var(--hwhx-label-color, #d8c39a);
      }

      .hwhx-icon-label {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
        max-width: 100%;
      }

      .hwhx-icon-label > span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .hwhx-label-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        flex: 0 0 auto;
        color: var(--hwhx-label-color, #d8c39a);
      }

      .hwhx-form-row > .hwhx-form-label {
        flex: 1 1 240px;
      }

      .hwhx-info-line__value {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 0;
        color: var(--hwhx-value-color, #9fe0a8);
        text-align: right;
      }

      .hwhx-summary-inline {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        white-space: nowrap;
      }

      .hwhx-stamina-limit-title {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        min-width: 0;
      }

      .hwhx-stamina-limit-title__label {
        display: inline-flex;
        align-items: center;
        min-width: 0;
      }

      .hwhx-stamina-limit-metrics,
      .hwhx-stamina-purchase-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        white-space: nowrap;
      }

      .hwhx-stamina-purchase-status {
        justify-content: flex-end;
        color: #d8c39a;
      }

      .hwhx-stamina-limit-metrics {
        color: #cdb88e;
      }

      .hwhx-stamina-metric {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        color: var(--hwhx-stamina-metric-color, #d8c39a);
      }

      .hwhx-stamina-metric--count {
        --hwhx-stamina-metric-color: #f0d59f;
        font-weight: 700;
      }

      .hwhx-stamina-metric--gem {
        --hwhx-stamina-metric-color: #c998ff;
      }

      .hwhx-stamina-metric--energy {
        --hwhx-stamina-metric-color: #d8c5ff;
      }

      .hwhx-form-control {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        flex: 0 0 auto;
      }

      .hwhx-number,
      .hwhx-select {
        max-width: 100%;
        min-height: 34px;
        padding: var(--hwhx-theme-control-padding-y, 7px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border, rgba(141, 97, 51, .9));
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: var(--hwhx-theme-control-bg, linear-gradient(180deg, rgba(55, 35, 22, .98), rgba(29, 18, 12, .98)), #24160f);
        color: var(--hwhx-theme-control-text, #f7e0bc);
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
        font-size: 15px;
        line-height: 1.2;
        letter-spacing: 0;
        box-sizing: border-box;
        box-shadow: var(--hwhx-theme-control-shadow, inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px rgba(0,0,0,.16));
      }

      .hwhx-number-stepper {
        width: var(--hwhx-field-width, 112px);
        max-width: 100%;
        display: inline-flex;
        align-items: stretch;
        flex: 0 0 auto;
        border-radius: var(--hwhx-theme-radius-control, 7px);
        box-sizing: border-box;
        touch-action: manipulation;
      }

      input.hwhx-number[type="number"] {
        width: 100%;
        min-width: 0;
        flex: 1 1 auto;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        border-right-width: 0;
        text-align: right;
        -moz-appearance: textfield;
        appearance: textfield;
      }

      .hwhx-number::-webkit-outer-spin-button,
      .hwhx-number::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .hwhx-number-buttons {
        width: 24px;
        flex: 0 0 24px;
        display: inline-flex;
        flex-direction: column;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border, rgba(141, 97, 51, .9));
        border-left: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border-hover, rgba(198, 135, 57, .42));
        border-radius: 0 var(--hwhx-theme-radius-control, 7px) var(--hwhx-theme-radius-control, 7px) 0;
        background: var(--hwhx-theme-control-bg-hover, linear-gradient(180deg, rgba(66, 42, 24, .98), rgba(30, 18, 12, .98)));
        overflow: hidden;
        pointer-events: auto;
        box-sizing: border-box;
      }

      .hwhx-number-step {
        appearance: none;
        -webkit-appearance: none;
        width: 100%;
        min-width: 0;
        height: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--hwhx-theme-accent, #f0d59f);
        cursor: pointer;
        line-height: 1;
        touch-action: manipulation;
        user-select: none;
      }

      .hwhx-number-step:first-child {
        border-bottom: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border-hover, rgba(198, 135, 57, .28));
      }

      .hwhx-number-step:hover {
        background: rgba(255, 218, 145, .1);
        color: #ffffff;
      }

      .hwhx-number-step svg {
        width: 11px;
        height: 11px;
      }

      .hwhx-select {
        width: var(--hwhx-field-width, 168px);
        padding-right: 28px;
        appearance: none;
        background:
          linear-gradient(45deg, transparent 50%, var(--hwhx-theme-accent, #f0d59f) 50%) right 14px center / 6px 6px no-repeat,
          linear-gradient(135deg, var(--hwhx-theme-accent, #f0d59f) 50%, transparent 50%) right 8px center / 6px 6px no-repeat,
          var(--hwhx-theme-control-bg, linear-gradient(180deg, rgba(55, 35, 22, .98), rgba(29, 18, 12, .98)));
        text-align: left;
      }

      .hwhx-select option,
      .hwhx-select optgroup {
        background: var(--hwhx-theme-surface-bg, #24160f);
        color: var(--hwhx-theme-control-text, #f7e0bc);
      }

      .hwhx-select:focus,
      .hwhx-number:focus,
      .hwhx-custom-select__button:focus {
        border-color: var(--hwhx-theme-primary, #7fe3ba);
        box-shadow: var(--hwhx-theme-control-focus-shadow, 0 0 0 2px rgba(127, 227, 186, .13), inset 0 1px 0 rgba(255,255,255,.08));
        outline: none;
      }

      .hwhx-custom-select {
        position: relative;
        width: var(--hwhx-field-width, 168px);
        max-width: 100%;
        display: inline-flex;
        flex: 0 0 auto;
        color: var(--hwhx-theme-control-text, #f7e0bc);
        box-sizing: border-box;
      }

      .hwhx-custom-select__button {
        appearance: none;
        -webkit-appearance: none;
        width: 100%;
        min-width: 0;
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: var(--hwhx-theme-control-padding-y, 7px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border, rgba(141, 97, 51, .9));
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: var(--hwhx-theme-control-bg, linear-gradient(180deg, rgba(55, 35, 22, .98), rgba(29, 18, 12, .98)), #24160f);
        color: var(--hwhx-theme-control-text, #f7e0bc);
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
        font-size: 15px;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: 0;
        cursor: pointer;
        box-sizing: border-box;
        box-shadow: var(--hwhx-theme-control-shadow, inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px rgba(0,0,0,.16));
      }

      .hwhx-custom-select__button:hover,
      .hwhx-custom-select.is-open .hwhx-custom-select__button {
        border-color: var(--hwhx-theme-control-border-hover, rgba(198, 135, 57, .95));
        background: var(--hwhx-theme-control-bg-hover, linear-gradient(180deg, rgba(68, 43, 24, .98), rgba(33, 20, 12, .98)), #2d1b11);
        color: #ffffff;
      }

      .hwhx-custom-select__label {
        min-width: 0;
        flex: 1 1 auto;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        overflow: hidden;
      }

      .hwhx-custom-select__menu {
        position: absolute;
        left: 0;
        right: 0;
        top: calc(100% + 4px);
        z-index: 12;
        display: none;
        max-height: min(280px, 44vh);
        overflow-y: auto;
        overflow-x: hidden;
        padding: calc(var(--hwhx-theme-menu-padding, 8px) / 2);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border-hover, rgba(198, 135, 57, .86));
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: var(--hwhx-theme-dialog-bg, linear-gradient(180deg, rgba(42, 25, 13, .99), rgba(20, 12, 8, .99)), #1d120c);
        box-shadow: var(--hwhx-theme-menu-shadow, 0 14px 34px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.06));
        scrollbar-width: thin;
        scrollbar-color: var(--hwhx-theme-control-border-hover, #a66a26) transparent;
        box-sizing: border-box;
      }

      .hwhx-custom-select.is-open .hwhx-custom-select__menu {
        display: flex;
        flex-direction: column;
        gap: calc(var(--hwhx-theme-option-padding-y, 6px) / 3);
      }

      .hwhx-custom-select.is-open-up .hwhx-custom-select__menu {
        top: auto;
        bottom: calc(100% + 4px);
      }

      .hwhx-multiselect {
        position: relative;
        width: var(--hwhx-field-width, 100%);
        max-width: 100%;
        display: inline-flex;
        flex: 1 1 auto;
        min-width: 0;
        color: var(--hwhx-theme-control-text, #f7e0bc);
        box-sizing: border-box;
      }

      .hwhx-multiselect__button,
      button.hwhx-multiselect__button {
        appearance: none;
        -webkit-appearance: none;
        width: 100%;
        min-width: 0;
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: var(--hwhx-theme-control-padding-y, 7px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border, rgba(141, 97, 51, .9));
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: var(--hwhx-theme-control-bg, linear-gradient(180deg, rgba(55, 35, 22, .98), rgba(29, 18, 12, .98)), #24160f);
        color: var(--hwhx-theme-control-text, #f7e0bc);
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
        font-size: 14px;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: 0;
        cursor: pointer;
        box-sizing: border-box;
        box-shadow: var(--hwhx-theme-control-shadow, inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px rgba(0,0,0,.16));
      }

      .hwhx-multiselect.is-open .hwhx-multiselect__button,
      .hwhx-multiselect__button:hover {
        border-color: var(--hwhx-theme-control-border-hover, rgba(198, 135, 57, .95));
        background: var(--hwhx-theme-control-bg-hover, linear-gradient(180deg, rgba(68, 43, 24, .98), rgba(33, 20, 12, .98)), #2d1b11);
        color: #ffffff;
      }

      .hwhx-multiselect__button-label {
        min-width: 0;
        flex: 1 1 auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
      }

      .hwhx-multiselect__count {
        flex: 0 0 auto;
        padding: 1px 6px;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 38%, transparent);
        border-radius: var(--hwhx-theme-radius-small, 6px);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 22%, var(--hwhx-theme-surface-bg, #24160f));
        color: var(--hwhx-theme-primary, #9fe0a8);
        font-size: 12px;
        box-shadow: var(--hwhx-theme-counter-shadow, none);
      }

      .hwhx-multiselect__menu {
        position: fixed;
        left: var(--hwhx-multiselect-menu-left, 8px);
        top: var(--hwhx-multiselect-menu-top, 8px);
        right: auto;
        width: var(--hwhx-multiselect-menu-width, 320px);
        z-index: 10030;
        display: none;
        flex-direction: column;
        gap: var(--hwhx-theme-option-padding-y, 7px);
        max-height: var(--hwhx-multiselect-menu-max-height, min(440px, 58vh));
        padding: var(--hwhx-theme-menu-padding, 8px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border-hover, rgba(198, 135, 57, .86));
        border-radius: var(--hwhx-theme-radius-panel, 8px);
        background: var(--hwhx-theme-dialog-bg, linear-gradient(180deg, rgba(42, 25, 13, .99), rgba(20, 12, 8, .99)), #1d120c);
        color: var(--hwhx-theme-text, #f4efe5);
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
        font-size: 14px;
        box-shadow: var(--hwhx-theme-menu-shadow, 0 14px 34px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.06));
        box-sizing: border-box;
      }

      .hwhx-multiselect.is-open .hwhx-multiselect__menu,
      .hwhx-multiselect__menu[data-hwhx-multiselect-open="1"] {
        display: flex;
      }

      .hwhx-multiselect__toolbar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
      }

      .hwhx-multiselect__actions {
        display: inline-flex;
        align-items: stretch;
        gap: 6px;
      }

      .hwhx-multiselect__list {
        min-height: 0;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-right: 2px;
        scrollbar-width: thin;
        scrollbar-color: var(--hwhx-theme-control-border-hover, #a66a26) transparent;
      }

      .hwhx-multiselect__group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .hwhx-multiselect__group[hidden] {
        display: none !important;
      }

      .hwhx-multiselect__group-title {
        color: var(--hwhx-theme-primary, #9fe0a8);
        font-size: 12px;
        font-weight: 700;
      }

      .hwhx-multiselect__options {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .hwhx-multiselect__option {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        min-width: 0;
        padding: var(--hwhx-theme-option-padding-y, 6px) var(--hwhx-theme-option-padding-x, 7px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(141, 97, 51, .34)) 44%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 74%, transparent);
        cursor: pointer;
        box-sizing: border-box;
      }

      .hwhx-multiselect__option--with-control {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        cursor: default;
      }

      .hwhx-multiselect__option-check {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        min-width: 0;
        cursor: pointer;
      }

      .hwhx-multiselect__option:hover {
        border-color: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 34%, transparent);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 20%, var(--hwhx-theme-surface-bg, #24160f));
      }

      .hwhx-multiselect__option[hidden] {
        display: none !important;
      }

      .hwhx-multiselect__option.is-disabled {
        opacity: .55;
        cursor: not-allowed;
      }

      .hwhx-multiselect__option-label {
        min-width: 0;
        flex: 1 1 auto;
      }

      .hwhx-multiselect__option-control {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        min-width: 0;
      }

      .hwhx-multi-option-label {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
      }

      .hwhx-multi-option-label__main,
      .hwhx-multi-option-label__meta {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        max-width: 100%;
      }

      .hwhx-multi-option-label__main > span,
      .hwhx-multi-option-label__meta > span {
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .hwhx-multi-option-label__meta {
        color: #b89f78;
        font-size: 12px;
        font-weight: 700;
      }

      @media (max-width: 640px) {
        .hwhx-multiselect__toolbar {
          grid-template-columns: 1fr;
        }

        .hwhx-multiselect__actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      .hwhx-custom-select__option {
        appearance: none;
        -webkit-appearance: none;
        width: 100%;
        min-height: 30px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: var(--hwhx-theme-option-padding-y, 6px) var(--hwhx-theme-option-padding-x, 7px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) transparent;
        border-radius: var(--hwhx-theme-radius-small, 6px);
        background: transparent;
        color: var(--hwhx-theme-muted, #d8c39a);
        font-family: var(--hwhx-theme-font-family, Arial, sans-serif);
        font-size: 14px;
        font-weight: 700;
        line-height: 1.18;
        letter-spacing: 0;
        text-align: left;
        cursor: pointer;
        box-sizing: border-box;
      }

      .hwhx-custom-select__option-main {
        min-width: 0;
        flex: 1 1 auto;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        overflow: hidden;
      }

      .hwhx-custom-select__text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hwhx-custom-select__icon {
        width: 15px;
        height: 15px;
        flex: 0 0 auto;
        color: var(--hwhx-theme-accent, #f0d59f);
      }

      .hwhx-custom-select__option:hover,
      .hwhx-custom-select__option:focus {
        border-color: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 34%, transparent);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 22%, var(--hwhx-theme-surface-bg, #24160f));
        color: #ffffff;
        outline: none;
      }

      .hwhx-custom-select__option.is-selected {
        border-color: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 46%, transparent);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 30%, var(--hwhx-theme-surface-bg, #24160f));
        color: var(--hwhx-theme-primary, #9fe0a8);
      }

      .hwhx-custom-select__option.is-selected .hwhx-custom-select__icon {
        color: var(--hwhx-theme-primary, #9fe0a8);
      }

      .hwhx-custom-select__option:disabled {
        cursor: not-allowed;
        opacity: .55;
      }

      .hwhx-custom-select__check {
        flex: 0 0 auto;
        color: var(--hwhx-theme-primary, #9fe0a8);
      }

      .hwhx-side-value {
        display: inline-flex;
        align-items: center;
        gap: 1px;
        color: var(--hwhx-side-color, #b89f78);
        white-space: nowrap;
        opacity: .96;
      }

      .hwhx-side-value__main {
        color: #ffffff;
        font-weight: 700;
      }

      .hwhx-section-title {
        margin: 0 0 6px;
        color: var(--hwhx-theme-primary, #9fe0a8);
        font-weight: 700;
      }

      .hwhx-section-label {
        color: var(--hwhx-theme-muted, #d8c39a);
        font-weight: 700;
      }

      .hwhx-hint {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        align-items: start;
        gap: 8px;
        margin: 8px 0 4px;
        padding: var(--hwhx-theme-option-padding-y, 8px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-hint-border, rgba(240, 213, 159, .58)) 34%, transparent);
        border-left: calc(var(--hwhx-theme-border-width, 1px) + 2px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-hint-border, rgba(240, 213, 159, .58));
        border-radius: var(--hwhx-theme-radius-panel, 7px);
        background: var(--hwhx-theme-hint-bg, rgba(19, 13, 9, .52));
        color: var(--hwhx-theme-hint-text, #c9b28a);
        font-size: 13px;
        font-weight: 600;
        line-height: 1.35;
        opacity: 1;
        box-sizing: border-box;
        box-shadow: var(--hwhx-theme-hint-shadow, none);
      }

      .hwhx-hint::before {
        content: "i";
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        margin-top: 1px;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-hint-border, rgba(240, 213, 159, .45));
        border-radius: 50%;
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 70%, transparent);
        color: var(--hwhx-theme-accent, #f0d59f);
        font-size: 11px;
        font-weight: 800;
        line-height: 1;
      }

      .hwhx-hint + .hwhx-form-row,
      .hwhx-hint + .hwhx-info-line {
        margin-top: 8px;
      }

      .hwhx-control-stack {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0;
      }

      .hwhx-control-group {
        display: flex;
        flex-wrap: wrap;
        gap: 0;
      }

      .hwhx-card-stack {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .hwhx-settings-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        margin-top: 12px;
      }

      .hwhx-settings-grid > .hwhx-accordion {
        margin: 0;
      }

      .hwhx-settings-grid .hwhx-accordion__body {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }

      .hwhx-settings-cap-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .hwhx-settings-cap-grid .hwhx-form-row {
        align-items: flex-start;
      }

      .hwhx-settings-slot-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .hwhx-module-grid {
        display: grid;
        grid-template-columns: minmax(260px, .82fr) minmax(360px, 1.18fr);
        gap: 12px;
        align-items: start;
      }

      .hwhx-module-column {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .hwhx-module-column__title {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        color: #9fe0a8;
        font-weight: 700;
      }

      .hwhx-module-column--queue .hwhx-reorder-list {
        max-height: min(58vh, 680px);
        overflow: auto;
        padding-right: 3px;
      }

      .hwhx-hero-target-row {
        grid-template-columns: 22px 28px minmax(150px, 1fr) auto;
      }

      .hwhx-hero-target-row.is-disabled {
        opacity: .58;
        border-color: rgba(160,171,184,.28);
        background: rgba(31,24,20,.58);
      }

      .hwhx-hero-target-row__controls {
        grid-column: 1 / -1;
      }

      .hwhx-hero-target-row__meta {
        grid-column: 1 / -1;
        min-width: 0;
      }

      .hwhx-hero-metrics {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        min-width: 0;
      }

      .hwhx-hero-metric {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        max-width: 100%;
        padding: 3px var(--hwhx-theme-option-padding-x, 7px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 26%, transparent);
        border-radius: var(--hwhx-theme-radius-pill, 999px);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 14%, var(--hwhx-theme-surface-bg, #24160f));
        color: var(--hwhx-theme-muted, #d8c39a);
        font-size: 12px;
        font-weight: 700;
        line-height: 1.15;
        box-shadow: var(--hwhx-theme-counter-shadow, none);
        box-sizing: border-box;
      }

      .hwhx-hero-metric.is-max {
        border-color: rgba(159, 224, 168, .36);
        background: rgba(44, 74, 48, .45);
        color: #9fe0a8;
      }

      .hwhx-hero-metric.is-bad {
        border-color: rgba(215, 122, 103, .4);
        background: rgba(75, 31, 24, .45);
        color: #ffad9a;
      }

      .hwhx-hero-metric__icon {
        flex: 0 0 auto;
        color: currentColor;
      }

      .hwhx-hero-metric__label {
        color: rgba(244, 239, 229, .72);
        white-space: nowrap;
      }

      .hwhx-hero-metric__value {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: currentColor;
      }

      .hwhx-hero-control-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(178px, 1fr));
        gap: 8px;
        min-width: 0;
      }

      .hwhx-hero-control-grid .hwhx-form-row {
        min-width: 0;
        margin: 0;
        padding: var(--hwhx-theme-option-padding-y, 6px) var(--hwhx-theme-option-padding-x, 7px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(141,97,51,.28)) 42%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 62%, transparent);
        box-shadow: var(--hwhx-theme-control-shadow, none);
      }

      .hwhx-hero-control-grid .hwhx-form-row > .hwhx-form-label {
        flex: 1 1 96px;
      }

      .hwhx-hero-control-grid .hwhx-form-control {
        flex: 0 0 auto;
      }

      .hwhx-settings-slot-card {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: var(--hwhx-theme-menu-padding, 8px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(141, 97, 51, .28)) 42%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 68%, transparent);
        box-shadow: var(--hwhx-theme-control-shadow, none);
        box-sizing: border-box;
      }

      .hwhx-settings-pair {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .hwhx-settings-pair > .hwhx-stack--spaced {
        margin-top: 0;
      }

      .hwhx-form-row--stack {
        flex-direction: column;
        align-items: stretch;
        gap: 6px;
      }

      .hwhx-form-row--stack > .hwhx-form-label,
      .hwhx-form-row--stack > .hwhx-form-control {
        width: 100%;
        flex: 1 1 auto;
      }

      .hwhx-range-control {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        width: 100%;
      }

      .hwhx-range {
        width: 100%;
        height: 18px;
        accent-color: #9fe0a8;
      }

      .hwhx-range-value {
        min-width: 88px;
        padding: var(--hwhx-theme-option-padding-y, 6px) var(--hwhx-theme-control-padding-x, 9px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) rgba(127, 227, 186, .24);
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: rgba(18, 42, 29, .55);
        color: #9fe0a8;
        font-size: 16px;
        font-weight: 700;
        line-height: 1;
        text-align: right;
      }

      .hwhx-form-row--range {
        gap: 8px;
        margin: 8px 0 4px;
      }

      .hwhx-form-row--range > .hwhx-form-label-group,
      .hwhx-form-row--range > .hwhx-form-control {
        width: 100%;
        flex: 0 0 auto;
      }

      .hwhx-form-row--range .hwhx-form-label {
        font-size: 16px;
        font-weight: 700;
      }

      @media (max-width: 760px) {
        .hwhx-settings-grid,
        .hwhx-settings-cap-grid,
        .hwhx-settings-slot-grid,
        .hwhx-module-grid {
          grid-template-columns: 1fr;
        }
      }

      .hwhx-accordion {
        width: 100%;
        margin: 12px 0 0;
        padding: var(--hwhx-theme-accordion-padding-y, 12px) var(--hwhx-theme-accordion-padding-x, 14px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-accent, #6e4a24);
        border-radius: var(--hwhx-theme-radius-panel, 8px);
        background: var(--hwhx-theme-accordion-bg, rgba(36, 22, 15, .92));
        font-size: 16px;
        line-height: 1.28;
        box-shadow: var(--hwhx-theme-panel-shadow, inset 0 1px 0 rgba(255,255,255,.04));
        box-sizing: border-box;
      }

      .hwhx-accordion__summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        width: 100%;
        color: var(--hwhx-theme-primary, #9fe0a8);
        font-weight: 700;
        cursor: pointer;
        list-style: none;
        box-sizing: border-box;
      }

      .hwhx-accordion__summary::-webkit-details-marker {
        display: none;
      }

      .hwhx-accordion__heading {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        flex: 1 1 260px;
      }

      .hwhx-accordion__arrow {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        color: var(--hwhx-theme-accent, #f0d59f);
        flex: 0 0 auto;
        transition: transform .16s ease;
      }

      .hwhx-accordion[open] > .hwhx-accordion__summary .hwhx-accordion__arrow,
      .hwhx-accordion[open] > summary .hwhx-accordion__arrow {
        transform: rotate(90deg);
      }

      .hwhx-accordion__body {
        width: 100%;
        margin-top: 8px;
        box-sizing: border-box;
      }

      .hwhx-badges {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        justify-content: flex-end;
        flex: 1 1 220px;
        flex-wrap: wrap;
        min-width: 0;
      }

      .hwhx-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin: 0 6px 6px 0;
        padding: 2px var(--hwhx-theme-option-padding-x, 8px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) rgba(255,255,255,.08);
        border-radius: var(--hwhx-theme-radius-small, 6px);
        background: var(--hwhx-theme-surface-bg, #2d1b11);
        box-shadow: var(--hwhx-theme-counter-shadow, none);
      }

      .hwhx-line {
        margin-top: 4px;
      }

      .hwhx-badge {
        display: inline-flex;
        align-items: center;
        padding: 1px var(--hwhx-theme-option-padding-x, 8px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-primary, #79ff90) 42%, transparent);
        border-radius: var(--hwhx-theme-radius-small, 6px);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #79ff90) 26%, var(--hwhx-theme-surface-bg, #24160f));
        color: var(--hwhx-theme-primary, #79ff90);
        font-weight: 700;
        font-size: 13px;
        box-shadow: var(--hwhx-theme-counter-shadow, none);
      }

      .hwhx-badge--filter {
        cursor: pointer;
        user-select: none;
        transition:
          border-color .14s ease,
          box-shadow .14s ease,
          filter .14s ease,
          transform .14s ease;
      }

      .hwhx-badge--filter:hover,
      .hwhx-badge--filter:focus-visible {
        filter: brightness(1.1);
        outline: none;
        transform: translateY(-1px);
      }

      .hwhx-badge--filter.is-active {
        box-shadow: var(--hwhx-theme-counter-shadow, 0 0 0 2px rgba(127, 227, 186, .18), inset 0 1px 0 rgba(255,255,255,.08));
      }

      .hwhx-badge--filter-inactive {
        border-color: var(--hwhx-theme-control-border, #644223);
        background: var(--hwhx-theme-surface-bg, #2d1b11);
        color: var(--hwhx-theme-accent, #f0d59f);
      }

      .hwhx-badge--total {
        border-color: var(--hwhx-theme-control-border, #644223);
        background: var(--hwhx-theme-surface-bg, #2d1b11);
        color: var(--hwhx-theme-accent, #f0d59f);
      }

      .hwhx-badge--gain {
        border-color: rgba(103, 199, 255, .42);
        background: rgba(27, 58, 79, .86);
        color: #8fd3ff;
      }

      .hwhx-accordion-filter-empty {
        min-height: 46px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--hwhx-theme-option-padding-y, 10px) var(--hwhx-theme-control-padding-x, 12px);
        border: var(--hwhx-theme-border-width, 1px) dashed color-mix(in srgb, var(--hwhx-theme-muted, #d8c39a) 34%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 72%, transparent);
        color: var(--hwhx-theme-muted, #d8c39a);
        font-weight: 700;
        text-align: center;
        box-sizing: border-box;
      }

      [data-hwhx-accordion-filter-hidden="1"],
      [data-hwhauto-checkbox-filter-hidden="1"] {
        display: none !important;
      }

      .hwhx-calc-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px 14px;
      }

      .hwhx-calc-result {
        grid-column: 1 / -1;
        min-width: 0;
        margin-top: 4px;
      }

      .hwhx-calc-grid .hwhx-form-row {
        flex-wrap: nowrap;
      }

      .hwhx-calc-grid .hwhx-form-row > .hwhx-form-label {
        flex: 1 1 auto;
      }

      .hwhx-calc-total {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        padding: var(--hwhx-theme-option-padding-y, 8px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 26%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 16%, var(--hwhx-theme-surface-bg, #24160f));
        box-shadow: var(--hwhx-theme-control-shadow, none);
        box-sizing: border-box;
      }

      .hwhx-calc-total__value,
      .hwhx-calc-resource {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        min-width: 0;
      }

      .hwhx-calc-total__value {
        justify-content: flex-end;
      }

      .hwhx-calc-resource {
        margin-left: 8px;
        color: #d8c39a;
      }

      .hwhx-calc-resource strong {
        color: #ffffff;
      }

      .hwhx-calc-availability {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }

      .hwhx-calc-availability__row {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        padding: calc(var(--hwhx-theme-option-padding-y, 6px) - 1px) var(--hwhx-theme-option-padding-x, 8px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 28%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 14%, var(--hwhx-theme-surface-bg, #24160f));
        color: var(--hwhx-theme-primary, #9fe0a8);
        font-size: 12px;
        font-weight: 700;
        box-shadow: var(--hwhx-theme-counter-shadow, none);
      }

      .hwhx-calc-availability__row[data-state="bad"] {
        border-color: rgba(255, 112, 112, .38);
        background: rgba(78, 24, 24, .46);
        color: #ffb4b4;
      }

      .hwhx-calc-level-title {
        margin: 10px 0 4px;
        color: #b89f78;
        font-size: 13px;
        font-weight: 700;
      }

      .hwhx-calc-level-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 6px;
      }

      .hwhx-calc-level-cell {
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: var(--hwhx-theme-option-padding-y, 6px) var(--hwhx-theme-option-padding-x, 7px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(141,97,51,.24)) 38%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 72%, transparent);
        box-shadow: var(--hwhx-theme-control-shadow, none);
        box-sizing: border-box;
      }

      .hwhx-calc-level-cell__range {
        margin-bottom: 0;
        color: #9fe0a8;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.16;
        white-space: nowrap;
      }

      .hwhx-calc-level-cell__cost {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        min-width: 0;
        font-size: 12px;
        line-height: 1.16;
      }

      .hwhx-calc-level-cell__cost .hwhx-calc-resource {
        margin-left: 0;
      }

      @media (max-width: 980px) {
        .hwhx-calc-level-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 720px) {
        .hwhx-calc-total {
          flex-direction: column;
        }

        .hwhx-calc-total__value {
          justify-content: flex-start;
        }
      }

      @media (max-width: 560px) {
        .hwhx-calc-level-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      .hwhx-checkbox-input {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
        width: 18px;
        height: 18px;
        flex: 0 0 auto;
        margin: 0;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-theme-control-border-hover, rgba(198, 135, 57, .78));
        border-radius: var(--hwhx-theme-radius-small, 5px);
        background: var(--hwhx-theme-control-bg, linear-gradient(180deg, #362216 0%, #20130d 100%));
        cursor: pointer;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto;
        box-sizing: border-box;
      }

      .hwhx-checkbox-input:checked {
        border-color: var(--hwhx-theme-primary, rgba(127, 227, 186, .88));
        background: color-mix(in srgb, var(--hwhx-theme-primary, #7fe3ba) 34%, var(--hwhx-theme-surface-bg, #24160f));
      }

      .hwhx-checkbox-input:checked::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 47%;
        width: 8px;
        height: 4px;
        border-left: 2px solid #f4efe5;
        border-bottom: 2px solid #f4efe5;
        transform: translate(-50%, -50%) rotate(-45deg);
        transform-origin: center;
      }

      .hwhx-checkbox-input:focus {
        outline: none;
        box-shadow: var(--hwhx-theme-control-focus-shadow, 0 0 0 2px rgba(127, 227, 186, .16));
      }

      .hwhx-checkbox-input:disabled {
        cursor: not-allowed;
        opacity: .55 !important;
      }

      .hwhx-checkbox-row {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        margin: 6px 0;
        padding: 3px 0;
        cursor: pointer;
        box-sizing: border-box;
      }

      .hwhx-checkbox-row.is-disabled {
        cursor: not-allowed;
        opacity: .72;
      }

      .hwhx-checkbox-box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        flex: 0 0 24px;
      }

      .hwhx-checkbox-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        flex: 1 1 auto;
      }

      .hwhx-technical-checks {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .hwhx-technical-actions {
        display: flex;
        align-items: stretch;
        justify-content: flex-start;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
      }

      .hwhx-technical-button {
        flex: 0 1 auto;
        min-width: 168px;
      }

      .hwhx-popup-checkbox {
        display: inline-block;
        margin: 0 18px 8px 0;
      }

      .hwhx-inline-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 520px;
      }

      .hwhx-titan-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        width: 100%;
        margin: 0;
        padding: var(--hwhx-theme-option-padding-y, 7px) var(--hwhx-theme-option-padding-x, 8px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(141,97,51,.34)) 54%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 8px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 78%, transparent);
        box-shadow: var(--hwhx-theme-control-shadow, none);
        cursor: pointer;
        box-sizing: border-box;
      }

      .hwhx-titan-row.is-checked {
        border-color: rgba(127,227,130,.38);
        background: rgba(39,77,43,.42);
      }

      .hwhx-titan-row.is-disabled {
        cursor: not-allowed;
        opacity: .64;
      }

      .hwhx-titan-label {
        min-width: 0;
        flex: 1 1 auto;
      }

      .hwhx-titan-value {
        color: #f0d59f;
        font-weight: 700;
      }

      .hwhx-titan-value[data-tone="muted"] { color: #8f7a68; }
      .hwhx-titan-value[data-tone="green"] { color: #9fe0a8; }
      .hwhx-titan-value[data-tone="blue"] { color: #8fd3ff; }
      .hwhx-titan-value[data-tone="purple"] { color: #d7b2ff; }
      .hwhx-titan-value[data-tone="violet"] { color: #b388ff; }
      .hwhx-titan-value[data-tone="gold"] { color: #ffd36e; }
      .hwhx-titan-value[data-tone="orange"] { color: #f0ad4e; }
      .hwhx-titan-value[data-tone="red"] { color: #d9534f; }
      .hwhx-titan-value[data-tone="brown"] { color: #8d6e63; }
      .hwhx-titan-value[data-tone="danger"] { color: #ff9f9f; }

      .hwhx-titan-sep {
        color: #8f7a68;
        opacity: .8;
      }

      .hwhx-titan-option {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        max-width: 560px;
        min-width: 0;
        flex-wrap: wrap;
      }

      .hwhx-titan-option--nowrap {
        white-space: nowrap;
      }

      .hwhx-titan-option__name {
        color: #f0d59f;
        font-weight: 700;
        min-width: 0;
      }

      .hwhx-titan-option__name.is-missing {
        color: #8f7a68;
        text-decoration: line-through;
        opacity: .8;
      }

      .hwhx-titan-option__name.is-maxed {
        text-decoration: line-through;
        opacity: .82;
      }

      .hwhx-titan-option__suffix {
        opacity: .74;
      }

      .hwhx-titan-option__levels {
        color: #9bb0c8;
      }

      .hwhx-titan-option__cost {
        color: #d8c39a;
        white-space: nowrap;
      }

      .hwhx-titan-evolution {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #8f7a68;
        font-size: 12px;
        white-space: nowrap;
      }

      .hwhx-scroll-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: none;
        overflow: auto;
        margin-top: 8px;
        padding: 8px 4px 2px 0;
        box-sizing: border-box;
      }

      .hwhx-scroll-area {
        width: 100%;
        height: calc(100% - 74px);
        min-height: 0;
        max-height: none;
        overflow: auto;
        margin-top: 10px;
        padding-right: 6px;
        box-sizing: border-box;
      }

      .hwhx-modal--custom-gear .hwhx-scroll-area {
        flex: 1 1 auto;
        height: auto;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: #a66a26 transparent;
      }

      .hwhx-custom-row {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        margin: 6px 0;
        padding: var(--hwhx-theme-option-padding-y, 8px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(122,83,40,.45)) 62%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 8px);
        background: var(--hwhx-theme-surface-bg, #23160f);
        box-shadow: var(--hwhx-theme-control-shadow, inset 0 1px 0 rgba(255,255,255,.02));
        box-sizing: border-box;
      }

      .hwhx-custom-row[data-checked="true"] {
        border-color: rgba(121,255,144,.55);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #79ff90) 18%, var(--hwhx-theme-surface-bg, #2a1b12));
        box-shadow: var(--hwhx-theme-control-focus-shadow, 0 0 0 1px rgba(121,255,144,.14), inset 0 1px 0 rgba(255,255,255,.04));
      }

      .hwhx-custom-row__name {
        min-width: 0;
        flex: 1 1 auto;
        overflow: hidden;
        color: #f4efe5;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hwhx-custom-row .hwhx-number-stepper {
        width: 92px;
      }

      .hwhx-custom-row__amount {
        width: 100%;
        opacity: .88;
      }

      .hwhx-custom-row[data-checked="true"] .hwhx-custom-row__amount {
        opacity: 1;
      }

      .hwhx-empty {
        color: #8f7b60;
      }

      .hwhx-soft-sep {
        opacity: .42;
      }

      .hwhx-more {
        color: #b89f78;
        opacity: .92;
      }

      .hwhx-summary-token {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .hwhx-summary-token__name {
        color: var(--hwhx-label-color, #f0d59f);
      }

      .hwhx-summary-token[data-tone="purple"] .hwhx-summary-token__name {
        color: #e0c2ff;
      }

      .hwhx-summary-token[data-tone="purple"] .hwhx-amount-token {
        color: #d7b2ff;
      }

      .hwhx-summary-token[data-tone="gold"] .hwhx-summary-token__name {
        color: #f7d98f;
      }

      .hwhx-summary-token[data-tone="gold"] .hwhx-amount-token {
        color: #f0d59f;
      }

      .hwhx-amount-token,
      .hwhx-row-count {
        display: inline-flex;
        align-items: center;
        padding: 2px var(--hwhx-theme-option-padding-x, 9px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-primary, #79ff90) 45%, transparent);
        border-radius: var(--hwhx-theme-radius-small, 6px);
        background: color-mix(in srgb, var(--hwhx-theme-primary, #79ff90) 24%, var(--hwhx-theme-surface-bg, #24160f));
        color: var(--hwhx-theme-primary, #8fe39b);
        font-weight: 700;
        line-height: 1.2;
        box-shadow: var(--hwhx-theme-counter-shadow, none);
      }

      .hwhx-amount-token {
        padding: 0 6px;
      }

      .hwhx-item-map-badge {
        min-width: 0;
        padding: var(--hwhx-theme-panel-padding-y, 10px) var(--hwhx-theme-panel-padding-x, 12px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(123,83,40,.38)) 54%, transparent);
        border-radius: var(--hwhx-theme-radius-panel, 8px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 90%, transparent);
        box-shadow: var(--hwhx-theme-panel-shadow, inset 0 1px 0 rgba(255,255,255,.03));
      }

      .hwhx-item-map-badge__label {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #c3a171;
        font-size: 12px;
        line-height: 1.2;
      }

      .hwhx-item-map-badge__icon {
        opacity: .92;
      }

      .hwhx-item-map-badge__value {
        margin-top: 6px;
        color: var(--hwhx-value-color, #8fe39b);
        font-size: 18px;
        font-weight: 700;
        line-height: 1;
      }

      .hwhx-metric-pill,
      .hwhx-item-type {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px var(--hwhx-theme-option-padding-x, 8px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(100,66,35,.62)) 74%, transparent);
        border-radius: var(--hwhx-theme-radius-small, 6px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 86%, transparent);
        font-size: 12px;
        line-height: 1.2;
        box-shadow: var(--hwhx-theme-counter-shadow, none);
      }

      .hwhx-metric-pill__label,
      .hwhx-item-type {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #f0d59f;
        font-weight: 700;
      }

      .hwhx-metric-pill__value {
        color: #8fe39b;
        font-weight: 700;
      }

      .hwhx-metric-pill[data-tone="gold"] .hwhx-metric-pill__label,
      .hwhx-metric-pill[data-tone="gold"] .hwhx-metric-pill__value {
        color: #ffd36e;
      }

      .hwhx-metric-pill[data-tone="purple"] .hwhx-metric-pill__label,
      .hwhx-metric-pill[data-tone="purple"] .hwhx-metric-pill__value {
        color: #d7b2ff;
      }

      .hwhx-metric-pill[data-tone="blue"] .hwhx-metric-pill__label,
      .hwhx-metric-pill[data-tone="blue"] .hwhx-metric-pill__value {
        color: #9fd9ff;
      }

      .hwhx-item-type {
        padding: 1px 8px;
      }

      .hwhx-item-type[data-type="gear"] {
        border-color: rgba(137,95,49,.6);
        background: rgba(55,35,22,.88);
        color: #f3d69f;
      }

      .hwhx-item-type[data-type="fragmentGear"] {
        border-color: rgba(116,82,164,.58);
        background: rgba(45,29,61,.82);
        color: #d8c2ff;
      }

      .hwhx-item-type[data-type="scroll"] {
        border-color: rgba(62,108,138,.58);
        background: rgba(22,39,49,.84);
        color: #9fd9ff;
      }

      .hwhx-item-type[data-type="fragmentScroll"] {
        border-color: rgba(76,91,155,.58);
        background: rgba(31,34,66,.84);
        color: #c0d8ff;
      }

      .hwhx-item-map-section {
        min-width: 0;
        padding: var(--hwhx-theme-panel-padding-y, 12px) var(--hwhx-theme-panel-padding-x, 14px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(123,83,40,.52)) 70%, transparent);
        border-radius: var(--hwhx-theme-radius-panel, 8px);
        background: var(--hwhx-theme-panel-bg, rgba(26,17,12,.96));
        box-shadow: var(--hwhx-theme-panel-shadow, inset 0 1px 0 rgba(255,255,255,.03));
      }

      .hwhx-item-map-section[data-tone="queue"] {
        border-color: rgba(77,87,112,.84);
      }

      .hwhx-item-map-section__head {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .hwhx-item-map-section__icon {
        color: #f0d59f;
        font-size: 15px;
        line-height: 1;
      }

      .hwhx-item-map-section__title {
        color: #f7e0bc;
        font-weight: 700;
        line-height: 1.2;
      }

      .hwhx-item-map-section__subtitle {
        margin-top: 4px;
        color: #a98761;
        line-height: 1.25;
      }

      .hwhx-item-map-section__body {
        margin-top: 10px;
      }

      .hwhx-item-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 6px 10px;
        align-items: start;
        padding: 0;
      }

      .hwhx-item-row.is-separated {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(111,71,33,.28);
      }

      .hwhx-item-row__main,
      .hwhx-item-row__amounts,
      .hwhx-item-row__meta {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        min-width: 0;
      }

      .hwhx-item-row__main {
        gap: 8px;
      }

      .hwhx-item-row__amounts {
        justify-content: flex-end;
      }

      .hwhx-item-row__meta,
      .hwhx-item-row__line {
        grid-column: 1 / -1;
      }

      .hwhx-item-row__title {
        min-width: 0;
        color: #f7e0bc;
        font-weight: 700;
      }

      .hwhx-item-list {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .hwhx-item-list__overflow {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(111,71,33,.28);
        color: #b89f78;
        text-align: right;
      }

      .hwhx-hero-chip-grid {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .hwhx-hero-chip {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
        padding: var(--hwhx-theme-option-padding-y, 8px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(123,83,40,.38)) 54%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 8px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 92%, transparent);
        box-shadow: var(--hwhx-theme-control-shadow, none);
      }

      .hwhx-hero-chip__title {
        min-width: 0;
        font-weight: 700;
      }

      .hwhx-hero-name {
        color: var(--hwhx-hero-name-color, #9fe0a8);
        font-weight: 800;
        text-shadow: 0 0 10px color-mix(in srgb, var(--hwhx-hero-name-color, #9fe0a8) 18%, transparent);
      }

      .hwhx-tier-chip-list {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .hwhx-tier-chip {
        display: inline-flex;
        align-items: center;
        padding: 1px var(--hwhx-theme-option-padding-x, 8px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(111,71,33,.55)) 70%, transparent);
        border-radius: var(--hwhx-theme-radius-small, 6px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 90%, transparent);
        color: #f0d59f;
        font-weight: 700;
        line-height: 1.2;
        box-shadow: var(--hwhx-theme-counter-shadow, none);
      }

      .hwhx-tier-text,
      .hwhx-tier-chip[data-family="white"] { color: #ded9cf; }
      .hwhx-tier-text { font-weight: 700; }
      .hwhx-tier-text[data-family="green"],
      .hwhx-tier-chip[data-family="green"] { color: #65c878; }
      .hwhx-tier-text[data-family="blue"],
      .hwhx-tier-chip[data-family="blue"] { color: #58aee8; }
      .hwhx-tier-text[data-family="violet"],
      .hwhx-tier-chip[data-family="violet"] { color: #b47cff; }
      .hwhx-tier-text[data-family="orange"],
      .hwhx-tier-chip[data-family="orange"] { color: #f4a950; }
      .hwhx-tier-text[data-family="red"],
      .hwhx-tier-chip[data-family="red"] { color: #ef6560; }
      .hwhx-tier-text[data-family="brown"],
      .hwhx-tier-chip[data-family="brown"] { color: #b47b58; }

      .hwhx-selection-label {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hwhx-selection-label.is-disabled {
        opacity: .66;
        text-decoration: line-through;
      }

      .hwhx-selection-label__main {
        font-weight: 700;
      }

      .hwhx-selection-label__muted {
        opacity: .72;
      }

      .hwhx-selection-label__gold,
      .hwhx-selection-label__gold .hwhx-icon-label {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        vertical-align: bottom;
      }

      .hwhx-selection-label__soft {
        opacity: .65;
      }

      .hwhx-selection-label__warn {
        color: #f6b26b;
        opacity: .72;
      }

      .hwhx-selection-mode {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        width: 100%;
        margin: 0 0 10px;
        padding: var(--hwhx-theme-option-padding-y, 8px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(123,83,40,.5)) 70%, transparent);
        border-radius: var(--hwhx-theme-radius-panel, 8px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 76%, transparent);
        box-shadow: var(--hwhx-theme-panel-shadow, none);
        box-sizing: border-box;
      }

      .hwhx-selection-mode__label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        color: #d8c39a;
        font-weight: 700;
      }

      .hwhx-reorder-note {
        margin: 0 0 10px;
        color: #b89f78;
        font-size: 13px;
        line-height: 1.3;
      }

      .hwhx-reorder-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
      }

      .hwhx-reorder-row {
        display: grid;
        grid-template-columns: 22px minmax(28px, auto) minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        min-height: 40px;
        padding: var(--hwhx-theme-option-padding-y, 7px) var(--hwhx-theme-option-padding-x, 8px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(141,97,51,.48)) 70%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 8px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 82%, transparent);
        box-shadow: var(--hwhx-theme-control-shadow, none);
        box-sizing: border-box;
      }

      .hwhx-reorder-row.is-dragging {
        opacity: .58;
        border-color: rgba(127,227,186,.62);
        background: rgba(42,75,52,.58);
      }

      .hwhx-reorder-row__drag-handle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 28px;
        color: rgba(216, 195, 154, .72);
        cursor: grab;
      }

      .hwhx-reorder-row.is-dragging .hwhx-reorder-row__drag-handle {
        cursor: grabbing;
      }

      .hwhx-reorder-row__index {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-accent, #f0d59f) 46%, transparent);
        border-radius: var(--hwhx-theme-radius-small, 6px);
        color: #f0d59f;
        font-size: 12px;
        font-weight: 700;
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 90%, transparent);
        box-shadow: var(--hwhx-theme-counter-shadow, none);
      }

      .hwhx-reorder-row__index--manual {
        width: 42px;
        padding: 0;
      }

      .hwhx-reorder-row__index-input {
        appearance: textfield;
        -moz-appearance: textfield;
        width: 100%;
        height: 100%;
        padding: 0 2px;
        border: 0;
        outline: 0;
        border-radius: inherit;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: center;
        box-sizing: border-box;
      }

      .hwhx-reorder-row__index-input::-webkit-outer-spin-button,
      .hwhx-reorder-row__index-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .hwhx-reorder-row__index-input:focus {
        background: rgba(127, 227, 186, .12);
        box-shadow: inset 0 0 0 1px rgba(127, 227, 186, .5);
      }

      .hwhx-reorder-row__main {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #f4efe5;
        font-weight: 700;
      }

      .hwhx-reorder-row__label-icon {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        color: #9fe0a8;
      }

      .hwhx-reorder-row__label-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hwhx-reorder-row__actions {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .hwhx-reorder-button {
        appearance: none;
        -webkit-appearance: none;
        width: 30px;
        height: 30px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-muted, #9cacbf) 42%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 7px);
        background: var(--hwhx-theme-control-bg, rgba(36,25,18,.92));
        color: var(--hwhx-theme-text, #f4efe5);
        box-shadow: var(--hwhx-theme-button-shadow, none);
        cursor: pointer;
      }

      .hwhx-reorder-button:hover {
        border-color: rgba(127,227,186,.55);
        color: #ffffff;
        background: rgba(42,75,52,.62);
      }

      .hwhx-reorder-button:disabled {
        cursor: not-allowed;
        opacity: .42;
      }

      @media (max-width: 560px) {
        .hwhx-reorder-row {
          grid-template-columns: 22px minmax(28px, auto) minmax(0, 1fr);
        }

        .hwhx-reorder-row__actions {
          grid-column: 1 / -1;
          justify-content: flex-end;
        }
      }

      .hwhx-more-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--hwhx-theme-option-padding-y, 8px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) color-mix(in srgb, var(--hwhx-theme-control-border, rgba(123,83,40,.52)) 70%, transparent);
        border-radius: var(--hwhx-theme-radius-control, 8px);
        background: color-mix(in srgb, var(--hwhx-theme-surface-bg, #24160f) 94%, transparent);
        color: var(--hwhx-theme-muted, #b89f78);
        font-weight: 700;
        box-shadow: var(--hwhx-theme-counter-shadow, none);
      }

      .hwhx-item-card {
        padding: 10px 0;
        border-top: 1px solid rgba(111,71,33,.28);
      }

      .hwhx-recipe-line {
        color: #d8b88d;
        line-height: 1.35;
      }

      .hwhx-fragment-line {
        color: #ccb5f3;
        line-height: 1.35;
      }

      .hwhx-item-map-hero-section {
        min-width: 0;
      }

      .hwhx-item-map-hero-head {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 8px;
        color: #f0d59f;
        font-weight: 700;
      }

      .hwhx-item-map-scroll {
        max-height: 58vh;
        overflow: auto;
        padding-right: 6px;
      }

      .hwhx-modal--item-map .hwhx-popup,
      .hwhx-modal--item-map .hwhx-item-map-hero-section {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .hwhx-modal--item-map .hwhx-popup {
        overflow: hidden;
      }

      .hwhx-modal--item-map .hwhx-item-map-hero-section {
        flex: 1 1 auto;
      }

      .hwhx-modal--item-map .hwhx-item-map-scroll {
        flex: 1 1 auto;
        max-height: none;
        min-height: 0;
      }

      .hwhx-summary {
        margin-top: 10px;
        padding: var(--hwhx-theme-option-padding-y, 8px) var(--hwhx-theme-control-padding-x, 10px);
        border: var(--hwhx-theme-border-width, 1px) var(--hwhx-theme-border-style, solid) var(--hwhx-accent, #6e4a24);
        border-radius: var(--hwhx-theme-radius-panel, 8px);
        background: var(--hwhx-theme-panel-bg, #2a1a11);
        box-shadow: var(--hwhx-theme-panel-shadow, none);
      }

      .hwhx-summary__title {
        margin-bottom: 4px;
        font-weight: 700;
      }

      .hwhx-shop-1 { color: #ffd36e; }
      .hwhx-shop-4 { color: #67c7ff; }
      .hwhx-shop-5 { color: #ff8fd5; }
      .hwhx-shop-6 { color: #8fdd7c; }
      .hwhx-shop-8 { color: #d9a0ff; }
      .hwhx-shop-9 { color: #ff7db8; }
      .hwhx-shop-10 { color: #ff9c57; }
      .hwhx-shop-17 { color: #7fe3ba; }

      [data-hwhauto-popup-body] [data-hwhx-search-hidden="1"],
      [data-hwhauto-popup-body] [data-hwhauto-search-hidden="1"],
      [data-hwhauto-popup-body] details[data-hwhx-search-hidden="1"],
      [data-hwhauto-popup-body] details[data-hwhauto-search-hidden="1"] {
        display: none !important;
      }
    `
    );
  }
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Activity = [
    [
      "path",
      {
        d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const ArrowDown = [
    ["path", { d: "M12 5v14" }],
    ["path", { d: "m19 12-7 7-7-7" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const ArrowLeft = [
    ["path", { d: "m12 19-7-7 7-7" }],
    ["path", { d: "M19 12H5" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const ArrowUp = [
    ["path", { d: "m5 12 7-7 7 7" }],
    ["path", { d: "M12 19V5" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Axe = [
    ["path", { d: "m14 12-8.381 8.38a1 1 0 0 1-3.001-3L11 9" }],
    [
      "path",
      {
        d: "M15 15.5a.5.5 0 0 0 .5.5A6.5 6.5 0 0 0 22 9.5a.5.5 0 0 0-.5-.5h-1.672a2 2 0 0 1-1.414-.586l-5.062-5.062a1.205 1.205 0 0 0-1.704 0L9.352 5.648a1.205 1.205 0 0 0 0 1.704l5.062 5.062A2 2 0 0 1 15 13.828z"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const BatteryCharging = [
    ["path", { d: "m11 7-3 5h4l-3 5" }],
    ["path", { d: "M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" }],
    ["path", { d: "M22 14v-4" }],
    ["path", { d: "M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const BookOpen = [
    ["path", { d: "M12 7v14" }],
    [
      "path",
      {
        d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Box = [
    [
      "path",
      {
        d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
      }
    ],
    ["path", { d: "m3.3 7 8.7 5 8.7-5" }],
    ["path", { d: "M12 22V12" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Boxes = [
    [
      "path",
      {
        d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"
      }
    ],
    ["path", { d: "m7 16.5-4.74-2.85" }],
    ["path", { d: "m7 16.5 5-3" }],
    ["path", { d: "M7 16.5v5.17" }],
    [
      "path",
      {
        d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"
      }
    ],
    ["path", { d: "m17 16.5-5-3" }],
    ["path", { d: "m17 16.5 4.74-2.85" }],
    ["path", { d: "M17 16.5v5.17" }],
    [
      "path",
      {
        d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"
      }
    ],
    ["path", { d: "M12 8 7.26 5.15" }],
    ["path", { d: "m12 8 4.74-2.85" }],
    ["path", { d: "M12 13.5V8" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Bug = [
    ["path", { d: "M12 20v-9" }],
    ["path", { d: "M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z" }],
    ["path", { d: "M14.12 3.88 16 2" }],
    ["path", { d: "M21 21a4 4 0 0 0-3.81-4" }],
    ["path", { d: "M21 5a4 4 0 0 1-3.55 3.97" }],
    ["path", { d: "M22 13h-4" }],
    ["path", { d: "M3 21a4 4 0 0 1 3.81-4" }],
    ["path", { d: "M3 5a4 4 0 0 0 3.55 3.97" }],
    ["path", { d: "M6 13H2" }],
    ["path", { d: "m8 2 1.88 1.88" }],
    ["path", { d: "M9 7.13V6a3 3 0 1 1 6 0v1.13" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Calculator = [
    ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2" }],
    ["line", { x1: "8", x2: "16", y1: "6", y2: "6" }],
    ["line", { x1: "16", x2: "16", y1: "14", y2: "18" }],
    ["path", { d: "M16 10h.01" }],
    ["path", { d: "M12 10h.01" }],
    ["path", { d: "M8 10h.01" }],
    ["path", { d: "M12 14h.01" }],
    ["path", { d: "M8 14h.01" }],
    ["path", { d: "M12 18h.01" }],
    ["path", { d: "M8 18h.01" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const CalendarDays = [
    ["path", { d: "M8 2v4" }],
    ["path", { d: "M16 2v4" }],
    ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
    ["path", { d: "M3 10h18" }],
    ["path", { d: "M8 14h.01" }],
    ["path", { d: "M12 14h.01" }],
    ["path", { d: "M16 14h.01" }],
    ["path", { d: "M8 18h.01" }],
    ["path", { d: "M12 18h.01" }],
    ["path", { d: "M16 18h.01" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Check = [["path", { d: "M20 6 9 17l-5-5" }]];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const ChevronDown = [["path", { d: "m6 9 6 6 6-6" }]];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const ChevronRight = [["path", { d: "m9 18 6-6-6-6" }]];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const ChevronsDown = [
    ["path", { d: "m7 6 5 5 5-5" }],
    ["path", { d: "m7 13 5 5 5-5" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const ChevronsUp = [
    ["path", { d: "m17 11-5-5-5 5" }],
    ["path", { d: "m17 18-5-5-5 5" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Clock = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6l4 2" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Coins = [
    ["path", { d: "M13.744 17.736a6 6 0 1 1-7.48-7.48" }],
    ["path", { d: "M15 6h1v4" }],
    ["path", { d: "m6.134 14.768.866-.5 2 3.464" }],
    ["circle", { cx: "16", cy: "8", r: "6" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const CornerRightDown = [
    ["path", { d: "m10 15 5 5 5-5" }],
    ["path", { d: "M4 4h7a4 4 0 0 1 4 4v12" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const CornerRightUp = [
    ["path", { d: "m10 9 5-5 5 5" }],
    ["path", { d: "M4 20h7a4 4 0 0 0 4-4V4" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Database = [
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5" }],
    ["path", { d: "M3 12A9 3 0 0 0 21 12" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Download = [
    ["path", { d: "M12 15V3" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["path", { d: "m7 10 5 5 5-5" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const EyeOff = [
    [
      "path",
      {
        d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
      }
    ],
    ["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242" }],
    [
      "path",
      {
        d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
      }
    ],
    ["path", { d: "m2 2 20 20" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const FileText = [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
    ["path", { d: "M10 9H8" }],
    ["path", { d: "M16 13H8" }],
    ["path", { d: "M16 17H8" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Flag = [
    [
      "path",
      {
        d: "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const FlaskConical = [
    [
      "path",
      {
        d: "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"
      }
    ],
    ["path", { d: "M6.453 15h11.094" }],
    ["path", { d: "M8.5 2h7" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Funnel = [
    [
      "path",
      {
        d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Gem = [
    ["path", { d: "M10.5 3 8 9l4 13 4-13-2.5-6" }],
    [
      "path",
      {
        d: "M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"
      }
    ],
    ["path", { d: "M2 9h20" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Gift = [
    ["path", { d: "M12 7v14" }],
    ["path", { d: "M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" }],
    ["path", { d: "M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" }],
    ["rect", { x: "3", y: "7", width: "18", height: "4", rx: "1" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const GripVertical = [
    ["circle", { cx: "9", cy: "12", r: "1" }],
    ["circle", { cx: "9", cy: "5", r: "1" }],
    ["circle", { cx: "9", cy: "19", r: "1" }],
    ["circle", { cx: "15", cy: "12", r: "1" }],
    ["circle", { cx: "15", cy: "5", r: "1" }],
    ["circle", { cx: "15", cy: "19", r: "1" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Hammer = [
    ["path", { d: "m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" }],
    ["path", { d: "m18 15 4-4" }],
    [
      "path",
      {
        d: "m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Library = [
    ["path", { d: "m16 6 4 14" }],
    ["path", { d: "M12 6v14" }],
    ["path", { d: "M8 8v12" }],
    ["path", { d: "M4 4v16" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const ListChecks = [
    ["path", { d: "M13 5h8" }],
    ["path", { d: "M13 12h8" }],
    ["path", { d: "M13 19h8" }],
    ["path", { d: "m3 17 2 2 4-4" }],
    ["path", { d: "m3 7 2 2 4-4" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Mail = [
    ["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" }],
    ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const MapPin = [
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      }
    ],
    ["circle", { cx: "12", cy: "10", r: "3" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Map$1 = [
    [
      "path",
      {
        d: "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"
      }
    ],
    ["path", { d: "M15 5.764v15" }],
    ["path", { d: "M9 3.236v15" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const MessageCircle = [
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Minus = [["path", { d: "M5 12h14" }]];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Monitor = [
    ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }],
    ["line", { x1: "8", x2: "16", y1: "21", y2: "21" }],
    ["line", { x1: "12", x2: "12", y1: "17", y2: "21" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const PackageCheck = [
    ["path", { d: "M12 22V12" }],
    ["path", { d: "m16 17 2 2 4-4" }],
    [
      "path",
      {
        d: "M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753"
      }
    ],
    ["path", { d: "M3.29 7 12 12l8.71-5" }],
    ["path", { d: "m7.5 4.27 8.997 5.148" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Package = [
    [
      "path",
      {
        d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
      }
    ],
    ["path", { d: "M12 22V12" }],
    ["polyline", { points: "3.29 7 12 12 20.71 7" }],
    ["path", { d: "m7.5 4.27 9 5.15" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const PanelTop = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["path", { d: "M3 9h18" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const PawPrint = [
    ["circle", { cx: "11", cy: "4", r: "2" }],
    ["circle", { cx: "18", cy: "8", r: "2" }],
    ["circle", { cx: "20", cy: "16", r: "2" }],
    [
      "path",
      {
        d: "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Pickaxe = [
    ["path", { d: "m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999" }],
    [
      "path",
      {
        d: "M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024"
      }
    ],
    [
      "path",
      {
        d: "M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069"
      }
    ],
    [
      "path",
      {
        d: "M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Play = [
    [
      "path",
      { d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const RefreshCcw = [
    ["path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
    ["path", { d: "M3 3v5h5" }],
    ["path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }],
    ["path", { d: "M16 16h5v5" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Save = [
    [
      "path",
      {
        d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const ScrollText = [
    ["path", { d: "M15 12h-5" }],
    ["path", { d: "M15 8h-5" }],
    ["path", { d: "M19 17V5a2 2 0 0 0-2-2H4" }],
    [
      "path",
      {
        d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Scroll = [
    ["path", { d: "M19 17V5a2 2 0 0 0-2-2H4" }],
    [
      "path",
      {
        d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Search = [
    ["path", { d: "m21 21-4.34-4.34" }],
    ["circle", { cx: "11", cy: "11", r: "8" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Settings2 = [
    ["path", { d: "M14 17H5" }],
    ["path", { d: "M19 7h-9" }],
    ["circle", { cx: "17", cy: "17", r: "3" }],
    ["circle", { cx: "7", cy: "7", r: "3" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Settings = [
    [
      "path",
      {
        d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "3" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Shield = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Shirt = [
    [
      "path",
      {
        d: "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const ShoppingBag = [
    ["path", { d: "M16 10a4 4 0 0 1-8 0" }],
    ["path", { d: "M3.103 6.034h17.794" }],
    [
      "path",
      {
        d: "M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const ShoppingCart = [
    ["circle", { cx: "8", cy: "21", r: "1" }],
    ["circle", { cx: "19", cy: "21", r: "1" }],
    [
      "path",
      { d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Shuffle = [
    ["path", { d: "m18 14 4 4-4 4" }],
    ["path", { d: "m18 2 4 4-4 4" }],
    ["path", { d: "M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" }],
    ["path", { d: "M2 6h1.972a4 4 0 0 1 3.6 2.2" }],
    ["path", { d: "M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Sparkles = [
    [
      "path",
      {
        d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
      }
    ],
    ["path", { d: "M20 2v4" }],
    ["path", { d: "M22 4h-4" }],
    ["circle", { cx: "4", cy: "20", r: "2" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Star = [
    [
      "path",
      {
        d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
      }
    ]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Swords = [
    ["polyline", { points: "14.5 17.5 3 6 3 3 6 3 17.5 14.5" }],
    ["line", { x1: "13", x2: "19", y1: "19", y2: "13" }],
    ["line", { x1: "16", x2: "20", y1: "16", y2: "20" }],
    ["line", { x1: "19", x2: "21", y1: "21", y2: "19" }],
    ["polyline", { points: "14.5 6.5 18 3 21 3 21 6 17.5 9.5" }],
    ["line", { x1: "5", x2: "9", y1: "14", y2: "18" }],
    ["line", { x1: "7", x2: "4", y1: "17", y2: "20" }],
    ["line", { x1: "3", x2: "5", y1: "19", y2: "21" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Target = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["circle", { cx: "12", cy: "12", r: "6" }],
    ["circle", { cx: "12", cy: "12", r: "2" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Terminal = [
    ["path", { d: "M12 19h8" }],
    ["path", { d: "m4 17 6-6-6-6" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const TextAlignCenter = [
    ["path", { d: "M21 5H3" }],
    ["path", { d: "M17 12H7" }],
    ["path", { d: "M19 19H5" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Trash2 = [
    ["path", { d: "M10 11v6" }],
    ["path", { d: "M14 11v6" }],
    ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }],
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const TriangleAlert = [
    ["path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }],
    ["path", { d: "M12 9v4" }],
    ["path", { d: "M12 17h.01" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Trophy = [
    ["path", { d: "M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" }],
    ["path", { d: "M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" }],
    ["path", { d: "M18 9h1.5a1 1 0 0 0 0-5H18" }],
    ["path", { d: "M4 22h16" }],
    ["path", { d: "M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" }],
    ["path", { d: "M6 9H4.5a1 1 0 0 1 0-5H6" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Upload = [
    ["path", { d: "M12 3v12" }],
    ["path", { d: "m17 8-5-5-5 5" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Users = [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["circle", { cx: "9", cy: "7", r: "4" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const X = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  /**
   * @license lucide v1.16.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const Zap = [
    [
      "path",
      {
        d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
      }
    ]
  ];
  const ICONS = {
    activity: Activity,
    "align-center": TextAlignCenter,
    "arrow-down": ArrowDown,
    "arrow-left": ArrowLeft,
    "arrow-up": ArrowUp,
    axe: Axe,
    "battery-charging": BatteryCharging,
    "book-open": BookOpen,
    box: Box,
    boxes: Boxes,
    bug: Bug,
    calendar: CalendarDays,
    calculator: Calculator,
    check: Check,
    "chevron-down": ChevronDown,
    "chevron-right": ChevronRight,
    "chevrons-down": ChevronsDown,
    "chevrons-up": ChevronsUp,
    clock: Clock,
    coins: Coins,
    "corner-right-down": CornerRightDown,
    "corner-right-up": CornerRightUp,
    database: Database,
    download: Download,
    "eye-off": EyeOff,
    "file-text": FileText,
    filter: Funnel,
    flag: Flag,
    flask: FlaskConical,
    gem: Gem,
    gift: Gift,
    "grip-vertical": GripVertical,
    hammer: Hammer,
    library: Library,
    "list-checks": ListChecks,
    mail: Mail,
    map: Map$1,
    "map-pin": MapPin,
    "message-circle": MessageCircle,
    minus: Minus,
    monitor: Monitor,
    package: Package,
    "package-check": PackageCheck,
    "panel-top": PanelTop,
    "paw-print": PawPrint,
    pickaxe: Pickaxe,
    play: Play,
    "refresh-cw": RefreshCcw,
    save: Save,
    scroll: Scroll,
    "scroll-text": ScrollText,
    search: Search,
    settings: Settings,
    "settings-2": Settings2,
    shield: Shield,
    "shopping-bag": ShoppingBag,
    "shopping-cart": ShoppingCart,
    shirt: Shirt,
    shuffle: Shuffle,
    sparkles: Sparkles,
    star: Star,
    swords: Swords,
    target: Target,
    terminal: Terminal,
    "trash-2": Trash2,
    "alert-triangle": TriangleAlert,
    trophy: Trophy,
    upload: Upload,
    users: Users,
    x: X,
    zap: Zap
  };
  function buildAttributeMarkup(attributes) {
    return Object.entries(attributes).filter(([, value]) => value !== void 0 && value !== null && value !== false).map(([name, value]) => ` ${name}="${escapeHtml$1(value === true ? name : value)}"`).join("");
  }
  function renderIconNode(node) {
    if (!Array.isArray(node) || node.length < 2) {
      return "";
    }
    const [tagName, attributes = {}, children = []] = node;
    const childMarkup = Array.isArray(children) ? children.map((child) => renderIconNode(child)).join("") : "";
    return `<${tagName}${buildAttributeMarkup(attributes)}>${childMarkup}</${tagName}>`;
  }
  function renderIcon(name, options = {}) {
    const iconNode = ICONS[String(name ?? "")];
    if (!iconNode) {
      return "";
    }
    const size = Math.max(10, Number(options.size) || 16);
    const className = String(options.className ?? "hwhx-lucide").trim();
    const title = String(options.title ?? "").trim();
    const titleMarkup = title ? `<title>${escapeHtml$1(title)}</title>` : "";
    const ariaAttributes = title ? { role: "img", "aria-label": title } : { "aria-hidden": "true" };
    return `<svg${buildAttributeMarkup({
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": options.strokeWidth ?? 2,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: className,
      ...ariaAttributes
    })}>${titleMarkup}${iconNode.map((node) => renderIconNode(node)).join("")}</svg>`;
  }
  function buildIconText(iconName, text, options = {}) {
    const iconMarkup = renderIcon(iconName, {
      className: options.iconClassName ?? "hwhx-lucide hwhx-button__icon",
      size: options.size ?? 16
    });
    const labelMarkup = `<span class="${escapeHtml$1(options.labelClassName ?? "hwhx-button__label")}">${escapeHtml$1(text)}</span>`;
    return `${iconMarkup}${labelMarkup}`;
  }
  function normalizeDomId(value) {
    return String(value ?? "script").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  }
  const HWHAUTO_PROGRESS_FALLBACK_ID = "hwhauto-progress-root";
  const PROGRESS_POSITION_TOP_CENTER = "top-center";
  const PROGRESS_POSITION_TOP_RIGHT = "top-right";
  const PROGRESS_POSITION_BOTTOM_RIGHT = "bottom-right";
  const PROGRESS_STYLE_DEFAULT = "default";
  const PROGRESS_STYLE_COMPACT = "compact";
  const PROGRESS_THEME_DEFAULT = "default";
  const DEFAULT_RESULT_AUTO_HIDE_TIMEOUT_MS = 5e3;
  function normalizeEnum(value, allowedValues, fallbackValue) {
    return allowedValues.includes(value) ? value : fallbackValue;
  }
  function normalizeBoolean(value, fallbackValue = false) {
    if (value === true || value === 1 || value === "1" || value === "true") {
      return true;
    }
    if (value === false || value === 0 || value === "0" || value === "false") {
      return false;
    }
    return !!fallbackValue;
  }
  function normalizePositiveInteger(value, fallbackValue) {
    const numericValue = Math.floor(Number(value) || 0);
    return numericValue > 0 ? numericValue : fallbackValue;
  }
  function normalizeProgressWindowSettings(settings = void 0) {
    return {
      progressWindowPosition: normalizeEnum(
        settings?.progressWindowPosition,
        [
          PROGRESS_POSITION_TOP_CENTER,
          PROGRESS_POSITION_TOP_RIGHT,
          PROGRESS_POSITION_BOTTOM_RIGHT
        ],
        PROGRESS_POSITION_TOP_RIGHT
      ),
      progressWindowStyle: normalizeEnum(
        settings?.progressWindowStyle,
        [PROGRESS_STYLE_DEFAULT, PROGRESS_STYLE_COMPACT],
        PROGRESS_STYLE_DEFAULT
      ),
      progressWindowTheme: String(
        settings?.progressWindowTheme ?? settings?.uiTheme ?? PROGRESS_THEME_DEFAULT
      ).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || PROGRESS_THEME_DEFAULT,
      progressAutoHideResult: normalizeBoolean(settings?.progressAutoHideResult, false),
      progressAutoHideResultTimeoutMs: normalizePositiveInteger(
        settings?.progressAutoHideResultTimeoutMs,
        DEFAULT_RESULT_AUTO_HIDE_TIMEOUT_MS
      )
    };
  }
  function stripHtml(content) {
    const template = document.createElement("template");
    template.innerHTML = String(content ?? "");
    return (template.content.textContent ?? "").replace(/\s+/g, " ").trim();
  }
  function parseProgressPercent(text) {
    const match = String(text ?? "").match(
      /(?:^|\D)(\d+)(?:\s*-\s*\d+)?\s*\/\s*(\d+)(?:\D|$)/
    );
    if (!match) {
      return void 0;
    }
    const current = Number(match[1]);
    const total = Number(match[2]);
    if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
      return void 0;
    }
    return Math.max(0, Math.min(100, current / total * 100));
  }
  function getCompactStageLabels(text) {
    const isRussian = /[а-яё]/i.test(String(text ?? ""));
    return {
      plan: isRussian ? "План фарма" : "Farming plan",
      energy: isRussian ? "Трата энергии" : "Energy spend",
      gear: isRussian ? "Сборка шмота" : "Gear crafting",
      mail: isRussian ? "Сбор писем" : "Mail collection",
      shops: isRussian ? "Покупки в магазинах" : "Shop purchases",
      preparation: isRussian ? "Подготовка энергии" : "Energy preparation",
      settings: isRussian ? "Настройки" : "Settings",
      sync: isRussian ? "Синхронизация" : "Synchronization",
      work: isRussian ? "Выполнение" : "Working"
    };
  }
  function inferCompactStageLabel(text) {
    const normalizedText = String(text ?? "").toLocaleLowerCase("ru");
    const labels = getCompactStageLabels(normalizedText);
    if (/письм|почт|mail|letter/.test(normalizedText)) {
      return labels.mail;
    }
    if (/магаз|покуп|shop|buy|purchase/.test(normalizedText)) {
      return labels.shops;
    }
    if (/сбор|крафт|надев|экип|повыш|ранг|шмот|craft|equip|promot|gear/.test(normalizedText)) {
      return labels.gear;
    }
    if (/рейд|мисси|raid|mission/.test(normalizedText)) {
      return labels.energy;
    }
    if (/ежеднев|гильд|банк|бутыл|изумруд|энерг|энк|daily|guild|bottle|emerald|energy|stamina/.test(
      normalizedText
    )) {
      return labels.preparation;
    }
    if (/план|провер|готов|plan|check|prepar/.test(normalizedText)) {
      return labels.plan;
    }
    if (/настрой|settings|saved/.test(normalizedText)) {
      return labels.settings;
    }
    if (/синхрон|sync|refresh/.test(normalizedText)) {
      return labels.sync;
    }
    return labels.work;
  }
  function buildCompactProgressHtml(content, options = void 0) {
    const text = stripHtml(content);
    const stageLabel = String(options?.stage ?? options?.compactStage ?? "").trim() || inferCompactStageLabel(text);
    const percent = Number.isFinite(Number(options?.percent)) ? Math.max(0, Math.min(100, Number(options.percent))) : parseProgressPercent(text);
    const progressMarkup = buildProgressBarMarkup({
      percent,
      tone: Number.isFinite(percent) ? "success" : "intermediate",
      heightPx: 9,
      striped: true,
      animated: !Number.isFinite(percent),
      intermediate: !Number.isFinite(percent),
      className: "hwhx-progress-bar--compact"
    });
    return `<div class="hwhx-progress-compact"><div class="hwhx-progress-compact__stage">${escapeHtml$1(stageLabel)}</div>${progressMarkup}</div>`;
  }
  function shouldRenderIntermediateProgress(text, options = void 0) {
    if (options?.progressBar === false || options?.intermediate === false) {
      return false;
    }
    if (options?.intermediate === true || options?.indeterminate === true) {
      return true;
    }
    if (options?.autoHide || options?.result) {
      return false;
    }
    const normalizedText = String(text ?? "").toLocaleLowerCase("ru");
    if (/ошиб|error|failed|ничего|nothing|готов|заверш|saved|сохран|останов|stop/.test(
      normalizedText
    )) {
      return false;
    }
    return /progress|running|starting|prepare|wait|sync|refresh|request|processed|выполн|запуск|подготов|ожидан|синхрон|обнов|запрос|обработ|фарм|рейд|мисси|сбор|крафт|покуп/.test(
      normalizedText
    );
  }
  function buildProgressContentHtml(content, options = void 0) {
    const text = stripHtml(content);
    const percent = Number.isFinite(Number(options?.percent)) ? Math.max(0, Math.min(100, Number(options.percent))) : parseProgressPercent(text);
    const hasPercent = Number.isFinite(percent);
    const shouldRenderBar = options?.progressBar === true || hasPercent || shouldRenderIntermediateProgress(text, options);
    if (!shouldRenderBar) {
      return String(content ?? "");
    }
    const isIntermediate = !hasPercent || options?.intermediate === true || options?.indeterminate === true;
    const progressMarkup = buildProgressBarMarkup({
      percent: hasPercent ? percent : void 0,
      tone: isIntermediate ? "intermediate" : "success",
      heightPx: 8,
      striped: true,
      animated: isIntermediate || options?.animated === true,
      intermediate: isIntermediate,
      className: "hwhx-progress-bar--panel"
    });
    return `${String(content ?? "")}<div class="hwhx-progress__waiting">${progressMarkup}</div>`;
  }
  function buildCompactResultHtml(label) {
    return `<div class="hwhx-progress-compact-result"><span class="hwhx-progress-compact-result__icon">${renderIcon("check", { size: 18 })}</span><span>${escapeHtml$1(label)}</span></div>`;
  }
  function collectVisibleFloatingInfoPanels() {
    return [
      ...document.querySelectorAll(".hwhx-progress.is-visible"),
      ...document.querySelectorAll(
        `#${HWHAUTO_PROGRESS_FALLBACK_ID}[data-hwhauto-visible="1"]`
      )
    ].filter((node) => node instanceof HTMLElement && node.isConnected).sort((a, b) => {
      if (a === b) {
        return 0;
      }
      const rel = a.compareDocumentPosition(b);
      if (rel & 4) {
        return -1;
      }
      if (rel & 2) {
        return 1;
      }
      return 0;
    });
  }
  function createProgressController({ scriptId, title, settings = void 0 }) {
    ensureSharedUiStyles();
    const normalizedScriptId = normalizeDomId(scriptId);
    const rootId = `hwhx-progress-${normalizedScriptId}`;
    const bodyId = `${rootId}-body`;
    let hideTimeoutId = 0;
    let escapeListenerAttached = false;
    let progressSettings = normalizeProgressWindowSettings(settings);
    function applyProgressSettings(root) {
      if (!(root instanceof HTMLElement)) {
        return;
      }
      root.dataset.hwhxProgressPosition = progressSettings.progressWindowPosition;
      root.dataset.hwhxProgressStyle = progressSettings.progressWindowStyle;
      root.dataset.hwhxProgressTheme = progressSettings.progressWindowTheme || PROGRESS_THEME_DEFAULT;
      if (root.dataset.hwhxProgressDragging === "1") {
        return;
      }
      root.style.left = "";
      root.style.top = "";
      root.style.right = "";
      root.style.bottom = "";
      root.style.transform = "";
    }
    function detachProgressEscapeListener() {
      if (!escapeListenerAttached) {
        return;
      }
      document.removeEventListener("keydown", onDocumentKeydownEscape);
      escapeListenerAttached = false;
    }
    function onDocumentKeydownEscape(event) {
      if (event.key !== "Escape" || event.defaultPrevented) {
        return;
      }
      if (document.querySelector(".hwhx-modal")) {
        return;
      }
      const root = document.getElementById(rootId);
      if (!(root instanceof HTMLElement) || !root.classList.contains("is-visible")) {
        detachProgressEscapeListener();
        return;
      }
      const stack = collectVisibleFloatingInfoPanels();
      if (stack.length === 0 || stack[stack.length - 1] !== root) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      hideProgress();
    }
    function attachProgressEscapeListener() {
      if (escapeListenerAttached) {
        return;
      }
      document.addEventListener("keydown", onDocumentKeydownEscape);
      escapeListenerAttached = true;
    }
    function bindDrag(root) {
      if (!(root instanceof HTMLElement) || root.dataset.hwhxProgressDragBound === "1") {
        return;
      }
      root.dataset.hwhxProgressDragBound = "1";
      const header = root.querySelector(".hwhx-progress__header");
      if (!(header instanceof HTMLElement)) {
        return;
      }
      let dragState = null;
      const keepInsideViewport = (left, top) => {
        const rect = root.getBoundingClientRect();
        const margin = 8;
        const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
        const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
        return {
          left: Math.min(Math.max(margin, left), maxLeft),
          top: Math.min(Math.max(margin, top), maxTop)
        };
      };
      header.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || event.target?.closest?.("button, a, input, select, textarea")) {
          return;
        }
        const rect = root.getBoundingClientRect();
        dragState = {
          pointerId: event.pointerId,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top
        };
        root.style.left = `${rect.left}px`;
        root.style.top = `${rect.top}px`;
        root.style.right = "auto";
        root.style.bottom = "auto";
        root.style.transform = "none";
        root.dataset.hwhxProgressDragging = "1";
        header.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      });
      header.addEventListener("pointermove", (event) => {
        if (!dragState || event.pointerId !== dragState.pointerId) {
          return;
        }
        const nextPosition = keepInsideViewport(
          event.clientX - dragState.offsetX,
          event.clientY - dragState.offsetY
        );
        root.style.left = `${nextPosition.left}px`;
        root.style.top = `${nextPosition.top}px`;
        event.preventDefault();
      });
      const endDrag = (event) => {
        if (!dragState || event.pointerId !== dragState.pointerId) {
          return;
        }
        header.releasePointerCapture?.(event.pointerId);
        dragState = null;
        delete root.dataset.hwhxProgressDragging;
      };
      header.addEventListener("pointerup", endDrag);
      header.addEventListener("pointercancel", endDrag);
    }
    function ensureRoot() {
      let root = document.getElementById(rootId);
      if (root instanceof HTMLElement) {
        applyProgressSettings(root);
        bindDrag(root);
        return root;
      }
      root = document.createElement("div");
      root.id = rootId;
      root.className = "hwhx-progress";
      root.setAttribute("role", "status");
      root.setAttribute("aria-live", "polite");
      root.innerHTML = `
      <div class="hwhx-progress__header">
        <div class="hwhx-progress__title">${escapeHtml$1(title)}</div>
        <button class="hwhx-progress__close" type="button" data-hwhx-native-title="Close" aria-label="Close">${renderIcon("x", { size: 16 })}</button>
      </div>
      <div id="${bodyId}" class="hwhx-progress__body"></div>
    `;
      root.querySelector(".hwhx-progress__close")?.addEventListener("click", () => hideProgress());
      applyProgressSettings(root);
      bindDrag(root);
      (document.body ?? document.documentElement).appendChild(root);
      return root;
    }
    function hideProgress(delayMs = 0) {
      clearTimeout(hideTimeoutId);
      const normalizedDelayMs = Math.max(0, Number(delayMs) || 0);
      const hide = () => {
        document.getElementById(rootId)?.classList.remove("is-visible");
        detachProgressEscapeListener();
      };
      if (normalizedDelayMs > 0) {
        hideTimeoutId = globalThis.setTimeout(hide, normalizedDelayMs);
        return;
      }
      hide();
    }
    function normalizeSetProgressOptions(autoHide, options) {
      if (options && typeof options === "object") {
        return options;
      }
      return {
        autoHide
      };
    }
    function setProgress(content, autoHide = false, options = void 0) {
      const normalizedOptions = normalizeSetProgressOptions(autoHide, options);
      const root = ensureRoot();
      const body = document.getElementById(bodyId);
      if (!(body instanceof HTMLElement)) {
        return;
      }
      clearTimeout(hideTimeoutId);
      const isCompact = progressSettings.progressWindowStyle === PROGRESS_STYLE_COMPACT;
      const isResult = !!normalizedOptions.result;
      const contentHtml = isCompact && isResult ? buildCompactResultHtml(
        normalizedOptions.resultLabel || normalizedOptions.completeText || "Работа завершена"
      ) : isCompact ? buildCompactProgressHtml(content, normalizedOptions) : buildProgressContentHtml(content, normalizedOptions);
      root.dataset.hwhxProgressResult = isResult ? "1" : "0";
      root.dataset.hwhxProgressIntermediate = !isResult && contentHtml.includes("hwhx-progress__waiting") ? "1" : "0";
      body.innerHTML = `<div class="hwhx-progress__content">${contentHtml}</div>`;
      root.classList.add("is-visible");
      attachProgressEscapeListener();
      if (normalizedOptions.autoHide) {
        hideProgress(
          typeof normalizedOptions.autoHide === "number" ? normalizedOptions.autoHide : 3e3
        );
      }
    }
    function showResult(content, options = void 0) {
      const normalizedOptions = {
        ...options ?? {},
        result: true
      };
      const autoHide = normalizedOptions.autoHide ?? (progressSettings.progressAutoHideResult ? progressSettings.progressAutoHideResultTimeoutMs : false);
      setProgress(content, autoHide, {
        ...normalizedOptions,
        autoHide
      });
    }
    function configure(settings2) {
      progressSettings = normalizeProgressWindowSettings({
        ...progressSettings,
        ...settings2 ?? {}
      });
      applyProgressSettings(document.getElementById(rootId));
    }
    return {
      configure,
      setProgress,
      showResult,
      hideProgress
    };
  }
  const PROGRESS_THEME_OPTIONS = [
    { value: "default", icon: "panel-top" },
    { value: "graphite", icon: "panel-top" },
    { value: "green", icon: "check" },
    { value: "gold", icon: "coins" },
    { value: "danger", icon: "triangle-alert" }
  ];
  function getProgressPositionOptions(labels = {}) {
    return [
      {
        value: "top-right",
        label: labels.topRight ?? "Top right",
        icon: "corner-right-up"
      },
      {
        value: "top-center",
        label: labels.topCenter ?? "Top center",
        icon: "align-center"
      },
      {
        value: "bottom-right",
        label: labels.bottomRight ?? "Bottom right",
        icon: "corner-right-down"
      }
    ];
  }
  function getProgressStyleOptions(labels = {}) {
    return [
      {
        value: "default",
        label: labels.default ?? "Default",
        icon: "panel-top"
      },
      {
        value: "compact",
        label: labels.compact ?? "Compact",
        icon: "minus"
      }
    ];
  }
  function getProgressThemeOptions(labels = {}) {
    return PROGRESS_THEME_OPTIONS.map((option) => ({
      ...option,
      label: labels[option.value] ?? option.value
    }));
  }
  function buildProgressSettingsFields({
    settings,
    inputIds,
    labels,
    buildCheckboxRow,
    buildField,
    buildSelectField,
    color = "#9fd3ff",
    includeTheme = true
  } = {}) {
    const normalizedSettings = normalizeProgressWindowSettings(settings);
    const fields = [
      buildCheckboxRow({
        inputId: inputIds.autoHide,
        checked: normalizedSettings.progressAutoHideResult,
        label: labels.autoHide,
        icon: "clock",
        color
      }),
      buildField({
        label: labels.timeout,
        inputId: inputIds.timeout,
        value: Math.round(normalizedSettings.progressAutoHideResultTimeoutMs / 1e3),
        icon: "clock",
        color,
        minValue: 1,
        maxValue: 3600,
        widthPx: 96
      }),
      buildSelectField({
        label: labels.position,
        inputId: inputIds.position,
        value: normalizedSettings.progressWindowPosition,
        options: getProgressPositionOptions(labels.positionOptions),
        icon: "monitor",
        color,
        widthPx: 260
      }),
      buildSelectField({
        label: labels.style,
        inputId: inputIds.style,
        value: normalizedSettings.progressWindowStyle,
        options: getProgressStyleOptions(labels.styleOptions),
        icon: "panel-top",
        color,
        widthPx: 210
      })
    ];
    if (includeTheme && inputIds.theme) {
      fields.push(
        buildSelectField({
          label: labels.theme,
          inputId: inputIds.theme,
          value: normalizedSettings.progressWindowTheme,
          options: getProgressThemeOptions(labels.themeOptions),
          icon: "palette",
          color,
          widthPx: 220
        })
      );
    }
    return fields.join("");
  }
  function readProgressSettingsFromPopup({
    rootNode,
    fallbackSettings,
    inputIds,
    readCheckbox,
    readNumber,
    readSelect
  } = {}) {
    const fallback = normalizeProgressWindowSettings(fallbackSettings);
    return normalizeProgressWindowSettings({
      ...fallback,
      progressAutoHideResult: readCheckbox(
        inputIds.autoHide,
        fallback.progressAutoHideResult,
        rootNode
      ),
      progressAutoHideResultTimeoutMs: Math.max(1, readNumber(inputIds.timeout, 5, rootNode)) * 1e3,
      progressWindowPosition: readSelect(
        inputIds.position,
        fallback.progressWindowPosition,
        ["top-right", "top-center", "bottom-right"],
        rootNode
      ),
      progressWindowStyle: readSelect(
        inputIds.style,
        fallback.progressWindowStyle,
        ["default", "compact"],
        rootNode
      ),
      progressWindowTheme: inputIds.theme ? readSelect(
        inputIds.theme,
        fallback.progressWindowTheme,
        PROGRESS_THEME_OPTIONS.map((option) => option.value),
        rootNode
      ) : fallback.progressWindowTheme
    });
  }
  function buildResultRowMarkup(contentHtml, { kind = "technical" } = {}) {
    return `<div class="hwhx-result-row" data-kind="${escapeHtml$1(kind)}">${contentHtml}</div>`;
  }
  function buildResultRowsMarkup(rows, { kind = "technical" } = {}) {
    return (rows ?? []).map((row) => buildResultRowMarkup(row, { kind })).join("");
  }
  function buildResultAccordionMarkup({
    title,
    icon,
    rows,
    tone = "technical",
    rowKind = "technical",
    defaultOpen = true,
    formatCount = (value) => String(value),
    buildInlineIcon = () => ""
  } = {}) {
    const normalizedRows = (rows ?? []).filter((row) => String(row ?? "").trim() !== "");
    if (normalizedRows.length <= 0) {
      return "";
    }
    const openAttribute = defaultOpen ? " open" : "";
    return `<details class="hwhx-result-accordion" data-tone="${escapeHtml$1(tone)}"${openAttribute}><summary><span class="hwhx-result-accordion__title"><span class="hwhx-result-accordion__arrow">▸</span>${buildInlineIcon(icon, title)}<span>${escapeHtml$1(title)}</span></span><span class="hwhx-result-accordion__count">${escapeHtml$1(formatCount(normalizedRows.length))}</span></summary><div class="hwhx-result-accordion__body">${buildResultRowsMarkup(normalizedRows, { kind: rowKind })}</div></details>`;
  }
  const MENU_GAP = 4;
  const MENU_MARGIN = 8;
  const MENU_MAX_HEIGHT = 280;
  const MENU_MIN_HEIGHT = 96;
  const MENU_Z_INDEX = "10040";
  function dispatchDomEvent$3(node, eventName) {
    if (!node || !eventName) {
      return;
    }
    try {
      node.dispatchEvent(new globalThis.Event(eventName, { bubbles: true }));
      return;
    } catch {
      const legacyEvent = document.createEvent("Event");
      legacyEvent.initEvent(eventName, true, false);
      node.dispatchEvent(legacyEvent);
    }
  }
  function clampNumber(value, minValue, maxValue) {
    if (maxValue < minValue) {
      return minValue;
    }
    return Math.min(Math.max(value, minValue), maxValue);
  }
  function buildCustomSelectLabelMarkup(label, icon = "") {
    const iconName = String(icon ?? "").trim();
    const iconMarkup = iconName ? renderIcon(iconName, {
      size: 15,
      className: "hwhx-lucide hwhx-custom-select__icon"
    }) : "";
    return `${iconMarkup}<span class="hwhx-custom-select__text">${escapeHtml$1(label)}</span>`;
  }
  function getCustomSelectOptions(selectNode) {
    return [
      ...selectNode?.querySelectorAll?.("[data-hwhx-select-option]") ?? []
    ].filter((optionNode) => optionNode instanceof HTMLButtonElement);
  }
  function resetCustomSelectMenuPosition(selectNode) {
    const menuNode = selectNode?.querySelector?.("[data-hwhx-select-menu]");
    if (!(menuNode instanceof HTMLElement)) {
      return;
    }
    menuNode.style.position = "";
    menuNode.style.left = "";
    menuNode.style.right = "";
    menuNode.style.top = "";
    menuNode.style.bottom = "";
    menuNode.style.width = "";
    menuNode.style.maxHeight = "";
    menuNode.style.zIndex = "";
  }
  function positionCustomSelectMenu(selectNode) {
    if (!(selectNode instanceof HTMLElement)) {
      return;
    }
    const buttonNode = selectNode.querySelector("[data-hwhx-select-button]");
    const menuNode = selectNode.querySelector("[data-hwhx-select-menu]");
    if (!(buttonNode instanceof HTMLElement) || !(menuNode instanceof HTMLElement)) {
      return;
    }
    const buttonRect = buttonNode.getBoundingClientRect();
    const viewportWidth = Number(globalThis.innerWidth) || Number(document.documentElement?.clientWidth) || Math.ceil(buttonRect.right + MENU_MARGIN);
    const viewportHeight = Number(globalThis.innerHeight) || Number(document.documentElement?.clientHeight) || Math.ceil(buttonRect.bottom + MENU_MARGIN);
    const menuWidth = Math.max(120, Math.ceil(buttonRect.width));
    const maxLeft = viewportWidth - menuWidth - MENU_MARGIN;
    const left = clampNumber(Math.floor(buttonRect.left), MENU_MARGIN, maxLeft);
    const topSpace = Math.max(0, Math.floor(buttonRect.top - MENU_MARGIN));
    const bottomSpace = Math.max(
      0,
      Math.floor(viewportHeight - buttonRect.bottom - MENU_MARGIN)
    );
    const desiredHeight = Math.min(
      menuNode.scrollHeight || MENU_MAX_HEIGHT,
      MENU_MAX_HEIGHT
    );
    const openUp = bottomSpace < Math.min(desiredHeight, 180) && topSpace > bottomSpace;
    const availableHeight = Math.max(
      MENU_MIN_HEIGHT,
      (openUp ? topSpace : bottomSpace) - MENU_GAP
    );
    const maxHeight = Math.min(MENU_MAX_HEIGHT, availableHeight);
    const top = openUp ? Math.max(MENU_MARGIN, Math.floor(buttonRect.top - maxHeight - MENU_GAP)) : Math.min(
      viewportHeight - MENU_MARGIN - Math.min(maxHeight, desiredHeight),
      Math.floor(buttonRect.bottom + MENU_GAP)
    );
    selectNode.classList.toggle("is-open-up", openUp);
    menuNode.style.position = "fixed";
    menuNode.style.left = `${left}px`;
    menuNode.style.right = "auto";
    menuNode.style.top = `${top}px`;
    menuNode.style.bottom = "auto";
    menuNode.style.width = `${menuWidth}px`;
    menuNode.style.maxHeight = `${maxHeight}px`;
    menuNode.style.zIndex = MENU_Z_INDEX;
  }
  function syncOpenCustomSelectMenus(rootNode) {
    [...rootNode?.querySelectorAll?.("[data-hwhx-select].is-open") ?? []].filter((selectNode) => selectNode instanceof HTMLElement).forEach((selectNode) => positionCustomSelectMenu(selectNode));
  }
  function setCustomSelectOpen(selectNode, isOpen, options = void 0) {
    if (!(selectNode instanceof HTMLElement)) {
      return;
    }
    selectNode.classList.toggle("is-open", !!isOpen);
    const buttonNode = selectNode.querySelector("[data-hwhx-select-button]");
    if (buttonNode instanceof HTMLButtonElement) {
      buttonNode.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }
    if (isOpen) {
      positionCustomSelectMenu(selectNode);
      if (options?.focusSearch !== false) {
        const searchNode = selectNode.querySelector("[data-hwhx-select-search]");
        if (searchNode instanceof HTMLInputElement) {
          globalThis.setTimeout(() => searchNode.focus(), 0);
        }
      }
      return;
    }
    selectNode.classList.remove("is-open-up");
    resetCustomSelectMenuPosition(selectNode);
  }
  function closeCustomSelects(rootNode, exceptNode = void 0) {
    [...rootNode?.querySelectorAll?.("[data-hwhx-select].is-open") ?? []].filter((selectNode) => selectNode instanceof HTMLElement).forEach((selectNode) => {
      if (selectNode !== exceptNode) {
        setCustomSelectOpen(selectNode, false);
      }
    });
  }
  function toggleCustomSelect(rootNode, selectNode) {
    if (!(selectNode instanceof HTMLElement)) {
      return;
    }
    const shouldOpen = !selectNode.classList.contains("is-open");
    closeCustomSelects(rootNode, selectNode);
    setCustomSelectOpen(selectNode, shouldOpen);
  }
  function focusCustomSelectOption(selectNode, direction = 1) {
    const options = getCustomSelectOptions(selectNode).filter(
      (optionNode) => !optionNode.disabled
    );
    if (options.length <= 0) {
      return;
    }
    const activeIndex = options.findIndex(
      (optionNode) => optionNode === document.activeElement
    );
    const selectedIndex = options.findIndex(
      (optionNode) => optionNode.classList.contains("is-selected")
    );
    const baseIndex = activeIndex >= 0 ? activeIndex : Math.max(0, selectedIndex);
    const nextIndex = (baseIndex + direction + options.length) % options.length;
    options[nextIndex]?.focus();
  }
  function selectCustomOption(optionNode, options = void 0) {
    if (!(optionNode instanceof HTMLButtonElement) || optionNode.disabled) {
      return;
    }
    const selectNode = optionNode.closest("[data-hwhx-select]");
    if (!(selectNode instanceof HTMLElement)) {
      return;
    }
    const inputNode = selectNode.querySelector("[data-hwhx-select-input]");
    const labelNode = selectNode.querySelector("[data-hwhx-select-label]");
    const nextValue = String(optionNode.dataset.value ?? "");
    const nextLabel = String(
      optionNode.dataset.label ?? optionNode.textContent ?? ""
    ).trim();
    if (inputNode instanceof HTMLInputElement) {
      inputNode.value = nextValue;
      inputNode.setAttribute("value", nextValue);
      logSelectSaveDebug("custom select option chosen", {
        inputId: inputNode.id || null,
        nextValue,
        nextLabel
      });
      dispatchDomEvent$3(inputNode, "input");
      dispatchDomEvent$3(inputNode, "change");
    }
    if (labelNode instanceof HTMLElement) {
      labelNode.innerHTML = buildCustomSelectLabelMarkup(
        nextLabel,
        optionNode.dataset.icon
      );
    }
    getCustomSelectOptions(selectNode).forEach((currentOptionNode) => {
      const isSelected = currentOptionNode === optionNode;
      currentOptionNode.classList.toggle("is-selected", isSelected);
      currentOptionNode.setAttribute("aria-selected", isSelected ? "true" : "false");
      currentOptionNode.querySelector(".hwhx-custom-select__check")?.remove();
      if (isSelected) {
        currentOptionNode.insertAdjacentHTML(
          "beforeend",
          renderIcon("check", {
            size: 14,
            className: "hwhx-lucide hwhx-custom-select__check"
          })
        );
      }
    });
    setCustomSelectOpen(selectNode, false);
    if (options?.focusButton !== false) {
      const buttonNode = selectNode.querySelector("[data-hwhx-select-button]");
      if (buttonNode instanceof HTMLButtonElement) {
        buttonNode.focus();
      }
    }
  }
  function clearCustomSelect(selectNode) {
    const inputNode = selectNode?.querySelector?.("[data-hwhx-select-input]");
    const labelNode = selectNode?.querySelector?.("[data-hwhx-select-label]");
    if (!(selectNode instanceof HTMLElement) || !(inputNode instanceof HTMLInputElement)) {
      return;
    }
    inputNode.value = "";
    inputNode.setAttribute("value", "");
    getCustomSelectOptions(selectNode).forEach((optionNode) => {
      optionNode.classList.remove("is-selected");
      optionNode.setAttribute("aria-selected", "false");
      optionNode.querySelector(".hwhx-custom-select__check")?.remove();
    });
    if (labelNode instanceof HTMLElement) {
      labelNode.textContent = String(selectNode.dataset.hwhxSelectEmptyLabel ?? "");
    }
    dispatchDomEvent$3(inputNode, "input");
    dispatchDomEvent$3(inputNode, "change");
  }
  function applyCustomSelectSearch(selectNode) {
    const searchNode = selectNode?.querySelector?.("[data-hwhx-select-search]");
    if (!(selectNode instanceof HTMLElement) || !(searchNode instanceof HTMLInputElement)) {
      return;
    }
    const query = searchNode.value.trim().toLocaleLowerCase("ru-RU");
    getCustomSelectOptions(selectNode).forEach((optionNode) => {
      const haystack = String(
        optionNode.dataset.hwhxSearchText ?? optionNode.textContent ?? ""
      ).toLocaleLowerCase("ru-RU");
      optionNode.hidden = query !== "" && !haystack.includes(query);
    });
    [...selectNode.querySelectorAll("[data-hwhx-select-group]")].forEach((groupNode) => {
      if (!(groupNode instanceof HTMLElement)) {
        return;
      }
      groupNode.hidden = ![
        ...groupNode.querySelectorAll("[data-hwhx-select-option]")
      ].some((optionNode) => optionNode instanceof HTMLElement && !optionNode.hidden);
    });
  }
  function handleCustomSelectKeydown(rootNode, event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return false;
    }
    const selectButton = target.closest("[data-hwhx-select-button]");
    if (selectButton instanceof HTMLButtonElement) {
      const selectNode = selectButton.closest("[data-hwhx-select]");
      if (!(selectNode instanceof HTMLElement)) {
        return false;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleCustomSelect(rootNode, selectNode);
        return true;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        closeCustomSelects(rootNode, selectNode);
        setCustomSelectOpen(selectNode, true, { focusSearch: false });
        focusCustomSelectOption(selectNode, event.key === "ArrowDown" ? 1 : -1);
        return true;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setCustomSelectOpen(selectNode, false);
        return true;
      }
      return false;
    }
    const selectOption = target.closest("[data-hwhx-select-option]");
    if (selectOption instanceof HTMLButtonElement) {
      const selectNode = selectOption.closest("[data-hwhx-select]");
      if (!(selectNode instanceof HTMLElement)) {
        return false;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCustomOption(selectOption);
        return true;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        focusCustomSelectOption(selectNode, event.key === "ArrowDown" ? 1 : -1);
        return true;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setCustomSelectOpen(selectNode, false);
        const buttonNode = selectNode.querySelector("[data-hwhx-select-button]");
        if (buttonNode instanceof HTMLButtonElement) {
          buttonNode.focus();
        }
        return true;
      }
    }
    return false;
  }
  function bindCustomSelectControls(rootNode) {
    if (!(rootNode instanceof HTMLElement) || rootNode.dataset.hwhxSelectBound === "1") {
      return;
    }
    rootNode.dataset.hwhxSelectBound = "1";
    let syncTimer = 0;
    const scheduleMenuSync = () => {
      if (syncTimer) {
        return;
      }
      syncTimer = globalThis.setTimeout(() => {
        syncTimer = 0;
        syncOpenCustomSelectMenus(rootNode);
      }, 0);
    };
    rootNode.addEventListener(
      "click",
      (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const selectNode = target?.closest("[data-hwhx-select]");
        if (!(selectNode instanceof HTMLElement)) {
          closeCustomSelects(rootNode);
          return;
        }
        if (target.closest("[data-hwhx-select-clear]")) {
          event.preventDefault();
          event.stopPropagation();
          clearCustomSelect(selectNode);
          return;
        }
        const optionNode = target.closest("[data-hwhx-select-option]");
        if (optionNode instanceof HTMLButtonElement) {
          event.preventDefault();
          event.stopPropagation();
          selectCustomOption(optionNode);
          return;
        }
        if (target.closest("[data-hwhx-select-button]")) {
          event.preventDefault();
          event.stopPropagation();
          toggleCustomSelect(rootNode, selectNode);
          return;
        }
        if (target.closest("[data-hwhx-select-menu]")) {
          event.stopPropagation();
        }
      },
      true
    );
    rootNode.addEventListener(
      "input",
      (event) => {
        const searchNode = event.target instanceof Element ? event.target.closest("[data-hwhx-select-search]") : null;
        const selectNode = searchNode?.closest?.("[data-hwhx-select]");
        if (selectNode instanceof HTMLElement) {
          applyCustomSelectSearch(selectNode);
        }
      },
      true
    );
    rootNode.addEventListener(
      "keydown",
      (event) => {
        handleCustomSelectKeydown(rootNode, event);
      },
      true
    );
    rootNode.addEventListener("scroll", scheduleMenuSync, true);
    globalThis.addEventListener?.("resize", scheduleMenuSync);
  }
  const TOOLTIP_TEXT_ATTRIBUTE = "data-hwhx-native-title";
  const TOOLTIP_HTML_ATTRIBUTE = "data-hwhx-native-title-html";
  const TOOLTIP_THEME_ATTRIBUTE = "data-hwhx-tooltip-theme";
  const TOOLTIP_PLACEMENT_ATTRIBUTE = "data-hwhx-tooltip-placement";
  const TOOLTIP_DELAY_ATTRIBUTE = "data-hwhx-tooltip-delay";
  const TOOLTIP_TARGET_SELECTOR = [
    `[${TOOLTIP_HTML_ATTRIBUTE}]`,
    `[${TOOLTIP_TEXT_ATTRIBUTE}]`,
    "[title]"
  ].join(",");
  function normalizeTooltipDelay(value, fallbackValue = 260) {
    const delayMs = Math.floor(Number(value));
    if (!Number.isFinite(delayMs)) {
      return fallbackValue;
    }
    return Math.max(0, Math.min(3e3, delayMs));
  }
  function normalizeTooltipPlacement(value) {
    const placement = String(value ?? "").trim().toLowerCase();
    return ["auto", "top", "right", "bottom", "left", "cursor"].includes(placement) ? placement : "auto";
  }
  function normalizeTooltipTheme(value) {
    return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  }
  function getTooltipDescriptor(target, { defaultDelayMs = 260 } = {}) {
    if (!(target instanceof HTMLElement)) {
      return null;
    }
    const html = String(target.dataset.hwhxNativeTitleHtml ?? "").trim();
    const text = String(target.dataset.hwhxNativeTitle ?? "").trim();
    if (!html && !text) {
      return null;
    }
    return {
      html,
      text,
      isHtml: !!html,
      theme: normalizeTooltipTheme(
        target.dataset.hwhxTooltipTheme ?? target.dataset.hwhxTooltipTone
      ),
      placement: normalizeTooltipPlacement(target.dataset.hwhxTooltipPlacement),
      delayMs: normalizeTooltipDelay(target.dataset.hwhxTooltipDelay, defaultDelayMs)
    };
  }
  function buildTooltipAttributeMarkup(tooltip, options = {}) {
    const text = typeof tooltip === "object" && tooltip !== null ? String(tooltip.text ?? "") : String(tooltip ?? "");
    const html = typeof tooltip === "object" && tooltip !== null ? String(tooltip.html ?? "") : "";
    const theme = normalizeTooltipTheme(options.theme ?? tooltip?.theme);
    const placement = normalizeTooltipPlacement(options.placement ?? tooltip?.placement);
    const delayMs = options.delayMs ?? options.delay ?? tooltip?.delayMs ?? tooltip?.delay ?? void 0;
    return buildHtmlAttributeMarkup({
      [TOOLTIP_TEXT_ATTRIBUTE]: text.trim() || void 0,
      [TOOLTIP_HTML_ATTRIBUTE]: html.trim() || void 0,
      [TOOLTIP_THEME_ATTRIBUTE]: theme || void 0,
      [TOOLTIP_PLACEMENT_ATTRIBUTE]: placement !== "auto" ? placement : void 0,
      [TOOLTIP_DELAY_ATTRIBUTE]: delayMs !== void 0 ? normalizeTooltipDelay(delayMs) : void 0
    });
  }
  function applyTooltipAttributes(node, tooltip, options = {}) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    const text = typeof tooltip === "object" && tooltip !== null ? String(tooltip.text ?? "") : String(tooltip ?? "");
    const html = typeof tooltip === "object" && tooltip !== null ? String(tooltip.html ?? "") : "";
    const theme = normalizeTooltipTheme(options.theme ?? tooltip?.theme);
    const placement = normalizeTooltipPlacement(options.placement ?? tooltip?.placement);
    const delayMs = options.delayMs ?? options.delay ?? tooltip?.delayMs ?? tooltip?.delay ?? void 0;
    if (text.trim()) {
      node.dataset.hwhxNativeTitle = text.trim();
    } else {
      delete node.dataset.hwhxNativeTitle;
    }
    if (html.trim()) {
      node.dataset.hwhxNativeTitleHtml = html.trim();
    } else {
      delete node.dataset.hwhxNativeTitleHtml;
    }
    if (theme) {
      node.dataset.hwhxTooltipTheme = theme;
    } else {
      delete node.dataset.hwhxTooltipTheme;
    }
    if (placement !== "auto") {
      node.dataset.hwhxTooltipPlacement = placement;
    } else {
      delete node.dataset.hwhxTooltipPlacement;
    }
    if (delayMs !== void 0) {
      node.dataset.hwhxTooltipDelay = String(normalizeTooltipDelay(delayMs));
    } else {
      delete node.dataset.hwhxTooltipDelay;
    }
    node.removeAttribute("title");
  }
  let nonPassiveEventOptions;
  function getNonPassiveEventOptions() {
    if (nonPassiveEventOptions !== void 0) {
      return nonPassiveEventOptions;
    }
    let supportsPassive = false;
    const noop = () => {
    };
    try {
      const options = Object.defineProperty({}, "passive", {
        get() {
          supportsPassive = true;
          return false;
        }
      });
      globalThis.addEventListener("hwhx-passive-test", noop, options);
      globalThis.removeEventListener("hwhx-passive-test", noop, options);
    } catch {
      supportsPassive = false;
    }
    nonPassiveEventOptions = supportsPassive ? { passive: false, capture: true } : true;
    return nonPassiveEventOptions;
  }
  function parseNumberInputValue(value, fallbackValue = 0) {
    if (value == null) {
      return fallbackValue;
    }
    const rawText = String(value ?? "").trim();
    if (!rawText) {
      return 0;
    }
    const normalizedText = rawText.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
    const isNegative = normalizedText.startsWith("-");
    const unsignedText = normalizedText.replaceAll("-", "");
    const [wholePart = "", ...fractionParts] = unsignedText.split(".");
    const numericText = `${isNegative ? "-" : ""}${wholePart}${fractionParts.length > 0 ? `.${fractionParts.join("")}` : ""}`;
    const numericValue = Number(numericText);
    return Number.isFinite(numericValue) ? numericValue : fallbackValue;
  }
  function dispatchDomEvent$2(node, eventName) {
    if (!node || !eventName) {
      return;
    }
    try {
      node.dispatchEvent(new globalThis.Event(eventName, { bubbles: true }));
      return;
    } catch {
      const legacyEvent = document.createEvent("Event");
      legacyEvent.initEvent(eventName, true, false);
      node.dispatchEvent(legacyEvent);
    }
  }
  function normalizeControlSize(size) {
    const normalizedSize = String(size ?? "").trim();
    return ["xs", "sm", "md", "lg"].includes(normalizedSize) ? normalizedSize : "";
  }
  function normalizeControlVariant(variant) {
    const normalizedVariant = String(variant ?? "").trim();
    return ["ghost", "solid", "soft", "outline"].includes(normalizedVariant) ? normalizedVariant : "";
  }
  function getOptionalNumberAttribute(inputNode, attributeName) {
    if (!inputNode.hasAttribute(attributeName)) {
      return void 0;
    }
    const value = Number(inputNode.getAttribute(attributeName));
    return Number.isFinite(value) ? value : void 0;
  }
  function stepNumberInput(inputNode, direction) {
    if (!(inputNode instanceof HTMLInputElement) || inputNode.disabled || inputNode.readOnly || direction === 0) {
      return;
    }
    const minValue = getOptionalNumberAttribute(inputNode, "min");
    const maxValue = getOptionalNumberAttribute(inputNode, "max");
    const stepValue = Math.max(1, Number(inputNode.getAttribute("step")) || 1);
    const fallbackValue = minValue ?? 0;
    const currentValue = Number.isFinite(inputNode.valueAsNumber) ? inputNode.valueAsNumber : parseNumberInputValue(inputNode.value, fallbackValue);
    let nextValue = (Number.isFinite(currentValue) ? currentValue : fallbackValue) + direction * stepValue;
    if (minValue !== void 0) {
      nextValue = Math.max(minValue, nextValue);
    }
    if (maxValue !== void 0) {
      nextValue = Math.min(maxValue, nextValue);
    }
    inputNode.value = String(Math.trunc(nextValue));
    dispatchDomEvent$2(inputNode, "input");
    dispatchDomEvent$2(inputNode, "change");
  }
  function getNumberInputFromEventTarget(target) {
    if (!(target instanceof Element)) {
      return null;
    }
    if (target.matches("[data-hwhx-number-input]")) {
      return target instanceof HTMLInputElement ? target : null;
    }
    const inputNode = target.closest(".hwhx-number-stepper")?.querySelector("[data-hwhx-number-input]");
    return inputNode instanceof HTMLInputElement ? inputNode : null;
  }
  const NUMBER_STEP_HOLD_DELAY_MS = 340;
  const NUMBER_STEP_HOLD_INTERVAL_MS = 65;
  function clearNumberStepHoldTimers(stepButton) {
    if (!(stepButton instanceof HTMLElement)) {
      return;
    }
    const timeoutId = Number(stepButton.dataset.hwhxNumberHoldTimeoutId);
    const intervalId = Number(stepButton.dataset.hwhxNumberHoldIntervalId);
    if (Number.isFinite(timeoutId) && timeoutId > 0) {
      globalThis.clearTimeout(timeoutId);
    }
    if (Number.isFinite(intervalId) && intervalId > 0) {
      globalThis.clearInterval(intervalId);
    }
    delete stepButton.dataset.hwhxNumberHoldTimeoutId;
    delete stepButton.dataset.hwhxNumberHoldIntervalId;
  }
  function bindNumberStepHold(stepButton, inputNode, direction) {
    clearNumberStepHoldTimers(stepButton);
    let didRepeatStep = false;
    const doc = stepButton.ownerDocument ?? inputNode.ownerDocument ?? document;
    const stopHold = () => {
      clearNumberStepHoldTimers(stepButton);
      doc.removeEventListener("mouseup", stopHold, true);
      if (didRepeatStep) {
        stepButton.dataset.hwhxNumberSuppressClick = "1";
        globalThis.requestAnimationFrame(() => {
          delete stepButton.dataset.hwhxNumberSuppressClick;
        });
      }
    };
    const timeoutId = globalThis.setTimeout(() => {
      didRepeatStep = true;
      stepNumberInput(inputNode, direction);
      const intervalId = globalThis.setInterval(() => {
        didRepeatStep = true;
        stepNumberInput(inputNode, direction);
      }, NUMBER_STEP_HOLD_INTERVAL_MS);
      stepButton.dataset.hwhxNumberHoldIntervalId = String(intervalId);
      delete stepButton.dataset.hwhxNumberHoldTimeoutId;
    }, NUMBER_STEP_HOLD_DELAY_MS);
    stepButton.dataset.hwhxNumberHoldTimeoutId = String(timeoutId);
    doc.addEventListener("mouseup", stopHold, true);
  }
  function bindNumberInputControls(rootNode) {
    if (!(rootNode instanceof HTMLElement) || rootNode.dataset.hwhxNumberBound === "1") {
      return;
    }
    rootNode.dataset.hwhxNumberBound = "1";
    rootNode.addEventListener(
      "mousedown",
      (event) => {
        const stepButton = event.target instanceof Element ? event.target.closest("[data-hwhx-number-step]") : null;
        if (!(stepButton instanceof HTMLElement)) {
          return;
        }
        if (event.button !== 0) {
          return;
        }
        event.preventDefault();
        const inputNode = getNumberInputFromEventTarget(stepButton);
        if (!(inputNode instanceof HTMLInputElement)) {
          return;
        }
        const direction = Number(stepButton.getAttribute("data-hwhx-number-step")) || 0;
        if (direction === 0) {
          return;
        }
        bindNumberStepHold(stepButton, inputNode, direction);
      },
      true
    );
    rootNode.addEventListener(
      "click",
      (event) => {
        const clearButton = event.target instanceof Element ? event.target.closest("[data-hwhx-number-clear]") : null;
        if (clearButton instanceof HTMLElement) {
          const inputNode2 = getNumberInputFromEventTarget(clearButton);
          if (inputNode2 instanceof HTMLInputElement) {
            event.preventDefault();
            event.stopPropagation();
            inputNode2.value = "";
            dispatchDomEvent$2(inputNode2, "input");
            dispatchDomEvent$2(inputNode2, "change");
            inputNode2.focus();
          }
          return;
        }
        const stepButton = event.target instanceof Element ? event.target.closest("[data-hwhx-number-step]") : null;
        if (!(stepButton instanceof HTMLElement)) {
          return;
        }
        if (stepButton.dataset.hwhxNumberSuppressClick === "1") {
          event.preventDefault();
          event.stopPropagation();
          delete stepButton.dataset.hwhxNumberSuppressClick;
          return;
        }
        const inputNode = getNumberInputFromEventTarget(stepButton);
        if (!(inputNode instanceof HTMLInputElement)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        stepNumberInput(
          inputNode,
          Number(stepButton.getAttribute("data-hwhx-number-step")) || 0
        );
      },
      true
    );
    rootNode.addEventListener(
      "wheel",
      (event) => {
        const inputNode = getNumberInputFromEventTarget(event.target);
        if (!(inputNode instanceof HTMLInputElement)) {
          return;
        }
        const deltaY = Number(event.deltaY);
        if (deltaY === 0 || !Number.isFinite(deltaY)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        stepNumberInput(inputNode, deltaY < 0 ? 1 : -1);
      },
      getNonPassiveEventOptions()
    );
    rootNode.addEventListener(
      "keydown",
      (event) => {
        if (!(event.target instanceof HTMLInputElement)) {
          return;
        }
        if (!event.target.matches("[data-hwhx-number-input]")) {
          return;
        }
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        stepNumberInput(event.target, event.key === "ArrowUp" ? 1 : -1);
      },
      true
    );
  }
  function buildNumberInputMarkup({
    id = "",
    value = 0,
    minValue = 0,
    maxValue = void 0,
    step = 1,
    title = "",
    className = "",
    widthPx = void 0,
    size = "",
    clearable = false,
    clearTitle = "Clear",
    extraAttributes = {}
  } = {}) {
    const numericMinValue = Number(minValue);
    const normalizedMinValue = Number.isFinite(numericMinValue) ? numericMinValue : 0;
    const normalizedMaxValue = Number(maxValue);
    const inputAttributes = {
      id: id ? String(id) : void 0,
      class: ["hwhx-number", className].filter(Boolean).join(" "),
      type: "number",
      inputmode: "numeric",
      min: normalizedMinValue,
      max: Number.isFinite(normalizedMaxValue) && normalizedMaxValue >= normalizedMinValue ? normalizedMaxValue : void 0,
      step: Math.max(1, Number(step) || 1),
      value: String(value ?? ""),
      title: title || void 0,
      "data-hwhx-number-input": "1",
      ...extraAttributes
    };
    const normalizedSize = normalizeControlSize(size);
    const widthStyle = Number.isFinite(Number(widthPx)) && Number(widthPx) > 0 ? ` style="${escapeHtml$1(`--hwhx-field-width:${Math.floor(Number(widthPx))}px`)}"` : "";
    return `<span class="${["hwhx-number-stepper", normalizedSize ? `hwhx-number-stepper--${normalizedSize}` : ""].filter(Boolean).join(" ")}"${widthStyle}><input${buildHtmlAttributeMarkup(inputAttributes)} />${clearable ? `<button class="hwhx-number-clear" type="button" tabindex="-1" aria-label="${escapeHtml$1(clearTitle)}" title="${escapeHtml$1(clearTitle)}" data-hwhx-number-clear="1">${renderIcon("x", { size: 11 })}</button>` : ""}<span class="hwhx-number-buttons"><button class="hwhx-number-step" type="button" tabindex="-1" aria-label="Increase" data-hwhx-number-step="1">${renderIcon("arrow-up", { size: 11 })}</button><button class="hwhx-number-step" type="button" tabindex="-1" aria-label="Decrease" data-hwhx-number-step="-1">${renderIcon("arrow-down", { size: 11 })}</button></span></span>`;
  }
  function getOptionLabelLength(option) {
    return Array.from(String(option?.label ?? option?.value ?? "")).length;
  }
  function resolveSelectWidthPx(options, selectedOption, widthPx) {
    const requestedWidth = Number(widthPx);
    const longestLabelLength = Math.max(
      getOptionLabelLength(selectedOption),
      ...options.map((option) => getOptionLabelLength(option))
    );
    const hasIcons = options.some((option) => String(option?.icon ?? "").trim() !== "");
    const estimatedWidth = Math.min(
      420,
      Math.max(168, 54 + (hasIcons ? 24 : 0) + longestLabelLength * 7)
    );
    if (Number.isFinite(requestedWidth) && requestedWidth > 0) {
      return Math.max(Math.floor(requestedWidth), Math.floor(estimatedWidth));
    }
    return Math.floor(estimatedWidth);
  }
  function normalizeSelectGroups(options) {
    const sourceOptions = Array.isArray(options) ? options : [];
    const groups = [];
    sourceOptions.forEach((entry) => {
      if (Array.isArray(entry?.options)) {
        groups.push({
          label: String(entry.label ?? entry.title ?? ""),
          icon: String(entry.icon ?? ""),
          options: entry.options,
          collapsed: !!entry.collapsed
        });
        return;
      }
      if (groups.length === 0 || groups[groups.length - 1].label !== "") {
        groups.push({ label: "", icon: "", options: [], collapsed: false });
      }
      groups[groups.length - 1].options.push(entry);
    });
    return groups.filter(
      (group) => Array.isArray(group.options) && group.options.length > 0
    );
  }
  function buildCustomSelectMarkup({
    id = "",
    value = "",
    options = [],
    title = "",
    widthPx = void 0,
    className = "",
    size = "",
    variant = "",
    tone = "",
    searchable = void 0,
    searchPlaceholder = "Search",
    clearable = false,
    clearLabel = "Clear",
    emptyLabel = "No options",
    groupAccordions = false,
    extraAttributes = {}
  } = {}) {
    const normalizedGroups = normalizeSelectGroups(options);
    const normalizedOptions = normalizedGroups.flatMap((group) => group.options);
    const selectedValue = String(value ?? "");
    const selectedOption = normalizedOptions.find((option) => String(option?.value ?? "") === selectedValue) ?? normalizedOptions.find((option) => !option?.disabled) ?? normalizedOptions[0] ?? void 0;
    const resolvedValue = String(selectedOption?.value ?? selectedValue);
    const resolvedLabel = String(selectedOption?.label ?? selectedValue);
    const resolvedIcon = String(selectedOption?.icon ?? "").trim();
    const resolvedWidthPx = resolveSelectWidthPx(
      normalizedOptions,
      selectedOption,
      widthPx
    );
    const widthStyle = ` style="${escapeHtml$1(`--hwhx-field-width:${resolvedWidthPx}px`)}"`;
    const shouldRenderSearch = searchable === true || searchable === void 0 && normalizedOptions.length > 8;
    const optionMarkup = normalizedGroups.map((group) => {
      const groupOptionsMarkup = group.options.map((option) => {
        const optionValue = String(option?.value ?? "");
        const optionLabel = String(option?.label ?? optionValue);
        const optionIcon = String(option?.icon ?? "").trim();
        const selected = optionValue === resolvedValue;
        const disabled = !!option?.disabled;
        const searchText = String(
          option?.searchText ?? `${optionLabel} ${optionValue}`
        );
        return `<button type="button" class="hwhx-custom-select__option${selected ? " is-selected" : ""}" role="option" data-hwhx-select-option="1" data-value="${escapeHtml$1(optionValue)}" data-label="${escapeHtml$1(optionLabel)}" data-hwhx-search-text="${escapeHtml$1(searchText)}"${optionIcon ? ` data-icon="${escapeHtml$1(optionIcon)}"` : ""} aria-selected="${selected ? "true" : "false"}"${disabled ? ' disabled aria-disabled="true"' : ""} tabindex="-1"><span class="hwhx-custom-select__option-main">${buildCustomSelectLabelMarkup(optionLabel, optionIcon)}</span>${selected ? renderIcon("check", { size: 14, className: "hwhx-lucide hwhx-custom-select__check" }) : ""}</button>`;
      }).join("");
      const groupLabel = String(group.label ?? "");
      if (!groupLabel) {
        return groupOptionsMarkup;
      }
      const openAttribute = group.collapsed && groupAccordions ? "" : " open";
      const headingMarkup = `${group.icon ? renderIcon(group.icon, { size: 14 }) : ""}<span>${escapeHtml$1(groupLabel)}</span>`;
      return groupAccordions ? `<details class="hwhx-custom-select__group" data-hwhx-select-group="1"${openAttribute}><summary class="hwhx-custom-select__group-title">${headingMarkup}</summary>${groupOptionsMarkup}</details>` : `<span class="hwhx-custom-select__group" data-hwhx-select-group="1"><span class="hwhx-custom-select__group-title">${headingMarkup}</span>${groupOptionsMarkup}</span>`;
    }).join("");
    const inputAttributes = {
      id: id ? String(id) : void 0,
      type: "hidden",
      value: resolvedValue,
      "data-hwhx-select-input": "1",
      ...extraAttributes
    };
    const normalizedSize = normalizeControlSize(size);
    const normalizedVariant = normalizeControlVariant(variant);
    const rootClassName = [
      "hwhx-custom-select",
      className,
      normalizedSize ? `hwhx-custom-select--${normalizedSize}` : "",
      normalizedVariant ? `hwhx-custom-select--${normalizedVariant}` : ""
    ].filter(Boolean).join(" ");
    return `<span class="${escapeHtml$1(rootClassName)}" data-hwhx-select="1" data-hwhx-select-empty-label="${escapeHtml$1(emptyLabel)}"${widthStyle}><input${buildHtmlAttributeMarkup(inputAttributes)} /><button type="button" class="hwhx-custom-select__button" data-hwhx-select-button="1" aria-haspopup="listbox" aria-expanded="false"${tone ? ` data-tone="${escapeHtml$1(tone)}"` : ""}${buildTooltipAttributeMarkup(title)}><span class="hwhx-custom-select__label" data-hwhx-select-label="1">${buildCustomSelectLabelMarkup(resolvedLabel, resolvedIcon)}</span>${clearable ? `<span class="hwhx-custom-select__clear" role="button" tabindex="-1" aria-label="${escapeHtml$1(clearLabel)}" title="${escapeHtml$1(clearLabel)}" data-hwhx-select-clear="1">${renderIcon("x", { size: 13 })}</span>` : ""}${renderIcon("chevron-down", { size: 15 })}</button><span class="hwhx-custom-select__menu" data-hwhx-select-menu="1" role="listbox">${shouldRenderSearch ? `<span class="hwhx-custom-select__toolbar"><input class="hwhx-field hwhx-custom-select__search" type="search" placeholder="${escapeHtml$1(searchPlaceholder)}" data-hwhx-select-search="1" data-hwhx-clearable="false"></span>` : ""}<span class="hwhx-custom-select__options">${optionMarkup || `<span class="hwhx-muted">${escapeHtml$1(emptyLabel)}</span>`}</span></span></span>`;
  }
  let multiselectIdCounter = 0;
  function normalizeSelectedValues(values) {
    const sourceValues = Array.isArray(values) ? values : String(values ?? "").split(",").map((value) => value.trim());
    return [...new Set(sourceValues.map((value) => String(value ?? "").trim()))].filter(
      Boolean
    );
  }
  function serializeValues(values) {
    return JSON.stringify(normalizeSelectedValues(values));
  }
  function parseValues(value) {
    try {
      const parsedValue = JSON.parse(String(value ?? "[]"));
      return normalizeSelectedValues(Array.isArray(parsedValue) ? parsedValue : []);
    } catch {
      return normalizeSelectedValues(value);
    }
  }
  function dispatchDomEvent$1(node, eventName) {
    if (!node || !eventName) {
      return;
    }
    try {
      node.dispatchEvent(new globalThis.Event(eventName, { bubbles: true }));
      return;
    } catch {
      const legacyEvent = document.createEvent("Event");
      legacyEvent.initEvent(eventName, true, false);
      node.dispatchEvent(legacyEvent);
    }
  }
  function ensureMultiselectId(rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return "";
    }
    const currentId = String(rootNode.dataset.hwhxMultiselectId ?? "").trim();
    if (currentId) {
      return currentId;
    }
    multiselectIdCounter += 1;
    const nextId = `hwhx-multiselect-${multiselectIdCounter}`;
    rootNode.dataset.hwhxMultiselectId = nextId;
    return nextId;
  }
  function findPortaledMultiselectMenu(ownerId) {
    const normalizedOwnerId = String(ownerId ?? "").trim();
    const bodyNode = globalThis.document?.body;
    if (!normalizedOwnerId || !(bodyNode instanceof HTMLElement)) {
      return null;
    }
    return [...bodyNode.querySelectorAll("[data-hwhx-multiselect-menu]")].find(
      (node) => node instanceof HTMLElement && String(node.dataset.hwhxMultiselectOwner ?? "") === normalizedOwnerId
    ) ?? null;
  }
  function getMultiselectMenuNode(rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return null;
    }
    const inlineMenuNode = rootNode.querySelector("[data-hwhx-multiselect-menu]");
    if (inlineMenuNode instanceof HTMLElement) {
      return inlineMenuNode;
    }
    return findPortaledMultiselectMenu(rootNode.dataset.hwhxMultiselectId);
  }
  function getOptions(rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return [];
    }
    const menuNode = getMultiselectMenuNode(rootNode);
    const sourceNode = menuNode instanceof HTMLElement ? menuNode : rootNode;
    return [...sourceNode.querySelectorAll("[data-hwhx-multiselect-option]")].filter(
      (node) => node instanceof HTMLInputElement
    );
  }
  function getEnabledOptions(rootNode) {
    return getOptions(rootNode).filter((inputNode) => !inputNode.disabled);
  }
  function getSelectedOptions(rootNode) {
    return getEnabledOptions(rootNode).filter((inputNode) => inputNode.checked);
  }
  function updateMultiselectState(rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return;
    }
    const inputNode = rootNode.querySelector("[data-hwhx-multiselect-input]");
    const labelNode = rootNode.querySelector("[data-hwhx-multiselect-label]");
    const counterNode = rootNode.querySelector("[data-hwhx-multiselect-count]");
    const selectedOptions = getSelectedOptions(rootNode);
    const selectedValues = selectedOptions.map((optionNode) => String(optionNode.value));
    const selectedCount = selectedOptions.length;
    const totalCount = getEnabledOptions(rootNode).length;
    const emptyText = String(
      rootNode.dataset.hwhxMultiselectEmptyLabel ?? "Not selected"
    );
    const selectedTextTemplate = String(
      rootNode.dataset.hwhxMultiselectSelectedLabel ?? "{count} selected"
    );
    const nextLabel = selectedCount > 0 ? selectedTextTemplate.replaceAll("{count}", String(selectedCount)) : emptyText;
    if (inputNode instanceof HTMLInputElement) {
      const nextValue = serializeValues(selectedValues);
      if (inputNode.value !== nextValue) {
        inputNode.value = nextValue;
        inputNode.setAttribute("value", nextValue);
        dispatchDomEvent$1(inputNode, "input");
        dispatchDomEvent$1(inputNode, "change");
      }
    }
    if (labelNode instanceof HTMLElement) {
      labelNode.textContent = nextLabel;
    }
    if (counterNode instanceof HTMLElement) {
      counterNode.textContent = `${selectedCount}/${totalCount}`;
    }
  }
  function bindPortaledMultiselectMenu(rootNode, menuNode) {
    if (!(rootNode instanceof HTMLElement) || !(menuNode instanceof HTMLElement) || menuNode.dataset.hwhxMultiselectMenuBound === "1") {
      return;
    }
    menuNode.dataset.hwhxMultiselectMenuBound = "1";
    menuNode.addEventListener(
      "click",
      (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) {
          return;
        }
        if (target.closest("[data-hwhx-multiselect-select-all]")) {
          event.preventDefault();
          event.stopPropagation();
          toggleOptions(rootNode, true);
          return;
        }
        if (target.closest("[data-hwhx-multiselect-clear]")) {
          event.preventDefault();
          event.stopPropagation();
          toggleOptions(rootNode, false);
          return;
        }
        event.stopPropagation();
      },
      true
    );
    menuNode.addEventListener(
      "change",
      (event) => {
        const optionNode = event.target instanceof Element ? event.target.closest("[data-hwhx-multiselect-option]") : null;
        if (optionNode instanceof HTMLInputElement) {
          updateMultiselectState(rootNode);
        }
      },
      true
    );
    menuNode.addEventListener(
      "input",
      (event) => {
        const searchNode = event.target instanceof Element ? event.target.closest("[data-hwhx-multiselect-search]") : null;
        if (searchNode instanceof HTMLInputElement) {
          applySearch(rootNode);
        }
      },
      true
    );
    menuNode.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        setMultiselectOpen(rootNode, false);
        const buttonNode = rootNode.querySelector("[data-hwhx-multiselect-button]");
        if (buttonNode instanceof HTMLButtonElement) {
          buttonNode.focus();
        }
      },
      true
    );
  }
  function attachMultiselectMenuPortal(rootNode) {
    const bodyNode = globalThis.document?.body;
    if (!(rootNode instanceof HTMLElement) || !(bodyNode instanceof HTMLElement)) {
      return;
    }
    const menuNode = getMultiselectMenuNode(rootNode);
    if (!(menuNode instanceof HTMLElement)) {
      return;
    }
    const ownerId = ensureMultiselectId(rootNode);
    menuNode.dataset.hwhxMultiselectOwner = ownerId;
    menuNode.dataset.hwhxMultiselectOpen = "1";
    bindPortaledMultiselectMenu(rootNode, menuNode);
    if (menuNode.parentElement !== bodyNode) {
      bodyNode.appendChild(menuNode);
    }
  }
  function detachMultiselectMenuPortal(rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return;
    }
    const menuNode = getMultiselectMenuNode(rootNode);
    if (!(menuNode instanceof HTMLElement)) {
      return;
    }
    delete menuNode.dataset.hwhxMultiselectOpen;
    if (rootNode.contains(menuNode)) {
      return;
    }
    const buttonNode = rootNode.querySelector("[data-hwhx-multiselect-button]");
    if (buttonNode instanceof HTMLElement) {
      buttonNode.after(menuNode);
      return;
    }
    rootNode.appendChild(menuNode);
  }
  function setMultiselectOpen(rootNode, isOpen) {
    if (!(rootNode instanceof HTMLElement)) {
      return;
    }
    rootNode.classList.toggle("is-open", !!isOpen);
    const buttonNode = rootNode.querySelector("[data-hwhx-multiselect-button]");
    if (buttonNode instanceof HTMLButtonElement) {
      buttonNode.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }
    if (isOpen) {
      attachMultiselectMenuPortal(rootNode);
      updateMultiselectMenuPosition(rootNode);
      applySearch(rootNode);
      const menuNode = getMultiselectMenuNode(rootNode);
      const searchNode = menuNode?.querySelector("[data-hwhx-multiselect-search]");
      if (searchNode instanceof HTMLInputElement) {
        globalThis.setTimeout(() => searchNode.focus(), 0);
      }
      return;
    }
    detachMultiselectMenuPortal(rootNode);
  }
  function updateMultiselectMenuPosition(rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return;
    }
    const buttonNode = rootNode.querySelector("[data-hwhx-multiselect-button]");
    const menuNode = getMultiselectMenuNode(rootNode);
    if (!(buttonNode instanceof HTMLElement) || !(menuNode instanceof HTMLElement)) {
      return;
    }
    const rect = buttonNode.getBoundingClientRect();
    const viewportWidth = Math.max(0, globalThis.innerWidth || 0);
    const viewportHeight = Math.max(0, globalThis.innerHeight || 0);
    const availableWidth = Math.max(160, viewportWidth - 16);
    const width = Math.min(Math.max(260, rect.width || 0), availableWidth);
    const left = Math.max(8, Math.min(rect.left, viewportWidth - width - 8));
    const bottomSpace = viewportHeight - rect.bottom - 8;
    const topSpace = rect.top - 8;
    const shouldOpenUp = bottomSpace < 240 && topSpace > bottomSpace;
    const maxHeight = Math.max(180, Math.min(440, shouldOpenUp ? topSpace : bottomSpace));
    const top = shouldOpenUp ? Math.max(8, rect.top - maxHeight - 4) : rect.bottom + 4;
    rootNode.classList.toggle("is-open-up", shouldOpenUp);
    menuNode.style.setProperty("--hwhx-multiselect-menu-left", `${Math.round(left)}px`);
    menuNode.style.setProperty("--hwhx-multiselect-menu-top", `${Math.round(top)}px`);
    menuNode.style.setProperty("--hwhx-multiselect-menu-width", `${Math.round(width)}px`);
    menuNode.style.setProperty(
      "--hwhx-multiselect-menu-max-height",
      `${Math.round(maxHeight)}px`
    );
  }
  function updateOpenMultiselectPositions(rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return;
    }
    [...rootNode.querySelectorAll("[data-hwhx-multiselect].is-open")].filter((node) => node instanceof HTMLElement).forEach(updateMultiselectMenuPosition);
  }
  function closeAllMultiselects(rootNode, exceptNode = void 0) {
    if (!(rootNode instanceof HTMLElement)) {
      return;
    }
    [...rootNode.querySelectorAll("[data-hwhx-multiselect].is-open")].filter((node) => node instanceof HTMLElement).forEach((node) => {
      if (node !== exceptNode) {
        setMultiselectOpen(node, false);
      }
    });
  }
  function toggleOptions(rootNode, checked) {
    getEnabledOptions(rootNode).forEach((inputNode) => {
      inputNode.checked = !!checked;
    });
    updateMultiselectState(rootNode);
  }
  function applySearch(rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      return;
    }
    const menuNode = getMultiselectMenuNode(rootNode);
    const sourceNode = menuNode instanceof HTMLElement ? menuNode : rootNode;
    const searchNode = sourceNode.querySelector("[data-hwhx-multiselect-search]");
    const query = String(searchNode instanceof HTMLInputElement ? searchNode.value : "").trim().toLocaleLowerCase("ru-RU");
    [...sourceNode.querySelectorAll("[data-hwhx-multiselect-option-row]")].forEach(
      (rowNode) => {
        if (!(rowNode instanceof HTMLElement)) {
          return;
        }
        const haystack = String(
          rowNode.dataset.hwhxSearchText ?? rowNode.textContent ?? ""
        ).toLocaleLowerCase("ru-RU").replace(/\s+/g, " ");
        rowNode.hidden = query !== "" && !haystack.includes(query);
      }
    );
    [...sourceNode.querySelectorAll("[data-hwhx-multiselect-group]")].forEach(
      (groupNode) => {
        if (!(groupNode instanceof HTMLElement)) {
          return;
        }
        const visibleOption = [
          ...groupNode.querySelectorAll("[data-hwhx-multiselect-option-row]")
        ].some((rowNode) => rowNode instanceof HTMLElement && !rowNode.hidden);
        groupNode.hidden = !visibleOption;
      }
    );
    applyMultiselectVirtualization(rootNode);
  }
  function applyMultiselectVirtualization(rootNode) {
    const limit = Number(rootNode?.dataset?.hwhxMultiselectVirtualLimit);
    if (!Number.isFinite(limit) || limit <= 0) {
      return;
    }
    const menuNode = getMultiselectMenuNode(rootNode);
    const sourceNode = menuNode instanceof HTMLElement ? menuNode : rootNode;
    [...sourceNode.querySelectorAll("[data-hwhx-multiselect-option-row]")].filter((rowNode) => rowNode instanceof HTMLElement && !rowNode.hidden).forEach((rowNode, index) => {
      rowNode.classList.toggle("is-virtual-hidden", index >= limit);
      rowNode.style.display = index >= limit ? "none" : "";
    });
  }
  function buildOptionLabelMarkup(option) {
    if (option?.htmlLabel != null) {
      return String(option.htmlLabel);
    }
    return escapeHtml$1(option?.label ?? option?.value ?? "");
  }
  function buildOptionMarkup(option, selectedValueSet, groupIndex, optionIndex) {
    const optionValue = String(option?.value ?? "").trim();
    if (!optionValue) {
      return "";
    }
    const disabled = !!option?.disabled;
    const checked = selectedValueSet.has(optionValue) && !disabled;
    const title = String(option?.title ?? "").trim();
    const labelText = String(option?.label ?? optionValue);
    const searchText = String(option?.searchText ?? labelText);
    const controlMarkup = option?.controlHtml != null ? `<span class="hwhx-multiselect__option-control" data-hwhx-multiselect-option-control="1">${String(option.controlHtml)}</span>` : "";
    const inputId = `hwhx-multiselect-${groupIndex}-${optionIndex}-${optionValue.replace(/[^a-z0-9_-]+/gi, "-")}`;
    return `<span class="hwhx-multiselect__option${disabled ? " is-disabled" : ""}${controlMarkup ? " hwhx-multiselect__option--with-control" : ""}" data-hwhx-multiselect-option-row="1" data-hwhx-search-text="${escapeHtml$1(searchText)}"${buildTooltipAttributeMarkup(title)}><label class="hwhx-multiselect__option-check" for="${escapeHtml$1(inputId)}"><span class="hwhx-checkbox-box"><input${buildHtmlAttributeMarkup(
      {
        id: inputId,
        class: "hwhx-checkbox-input",
        type: "checkbox",
        value: optionValue,
        "data-hwhx-multiselect-option": "1",
        checked,
        disabled
      }
    )}></span><span class="hwhx-multiselect__option-label">${buildOptionLabelMarkup(option)}</span></label>${controlMarkup}</span>`;
  }
  function buildMultiSelectMarkup({
    id = "",
    values = [],
    groups = [],
    placeholder = "Not selected",
    selectedLabel = "{count} selected",
    searchPlaceholder = "Search",
    selectAllLabel = "Select all",
    clearLabel = "Clear",
    className = "",
    widthPx = void 0,
    size = "",
    buttonTone = "",
    groupAccordions = false,
    virtualLimit = 0,
    extraAttributes = {}
  } = {}) {
    const selectedValues = normalizeSelectedValues(values);
    const selectedValueSet = new Set(selectedValues);
    const normalizedGroups = (Array.isArray(groups) ? groups : []).filter(
      (group) => Array.isArray(group?.options) && group.options.length > 0
    );
    const enabledSelectedValues = normalizedGroups.flatMap(
      (group) => group.options.filter(
        (option) => selectedValueSet.has(String(option?.value ?? "").trim()) && !option?.disabled
      ).map((option) => String(option?.value ?? "").trim()).filter(Boolean)
    );
    const enabledOptionCount = normalizedGroups.reduce(
      (total, group) => total + group.options.filter((option) => !option?.disabled).length,
      0
    );
    const selectedCount = normalizedGroups.reduce(
      (total, group) => total + group.options.filter(
        (option) => selectedValueSet.has(String(option?.value ?? "")) && !option?.disabled
      ).length,
      0
    );
    const labelText = selectedCount > 0 ? String(selectedLabel).replaceAll("{count}", String(selectedCount)) : String(placeholder);
    const groupMarkup = normalizedGroups.map((group, groupIndex) => {
      const optionMarkup = group.options.map(
        (option, optionIndex) => buildOptionMarkup(option, selectedValueSet, groupIndex, optionIndex)
      ).join("");
      const groupTitle = String(group.label ?? "");
      const groupIcon = String(group.icon ?? "");
      const headingMarkup = `${groupIcon ? renderIcon(groupIcon, { size: 14 }) : ""}<span>${escapeHtml$1(groupTitle)}</span>`;
      return groupAccordions ? `<details class="hwhx-multiselect__group" data-hwhx-multiselect-group="1"${group.collapsed ? "" : " open"}><summary class="hwhx-multiselect__group-title">${headingMarkup}</summary><div class="hwhx-multiselect__options">${optionMarkup}</div></details>` : `<div class="hwhx-multiselect__group" data-hwhx-multiselect-group="1"><div class="hwhx-multiselect__group-title">${headingMarkup}</div><div class="hwhx-multiselect__options">${optionMarkup}</div></div>`;
    }).join("");
    const widthStyle = Number.isFinite(Number(widthPx)) && Number(widthPx) > 0 ? `--hwhx-field-width:${Math.floor(Number(widthPx))}px` : "";
    const rootAttributes = {
      class: ["hwhx-multiselect", size ? `hwhx-multiselect--${size}` : "", className].filter(Boolean).join(" "),
      "data-hwhx-multiselect": "1",
      "data-hwhx-multiselect-empty-label": placeholder,
      "data-hwhx-multiselect-selected-label": selectedLabel,
      "data-hwhx-multiselect-virtual-limit": Number(virtualLimit) > 0 ? Math.floor(Number(virtualLimit)) : void 0,
      style: widthStyle || void 0,
      ...extraAttributes
    };
    return `<span${buildHtmlAttributeMarkup(rootAttributes)}><input${buildHtmlAttributeMarkup(
      {
        id: id ? String(id) : void 0,
        type: "hidden",
        value: serializeValues(enabledSelectedValues),
        "data-hwhx-multiselect-input": "1"
      }
    )}><button type="button" class="hwhx-multiselect__button" data-hwhx-multiselect-button="1" aria-haspopup="listbox" aria-expanded="false"${buttonTone ? ` data-tone="${escapeHtml$1(buttonTone)}"` : ""}><span class="hwhx-multiselect__button-label" data-hwhx-multiselect-label="1">${escapeHtml$1(labelText)}</span><span class="hwhx-multiselect__count" data-hwhx-multiselect-count="1">${escapeHtml$1(`${selectedCount}/${enabledOptionCount}`)}</span>${renderIcon("chevron-down", { size: 15 })}</button><span class="hwhx-multiselect__menu" data-hwhx-multiselect-menu="1"><span class="hwhx-multiselect__toolbar"><input class="hwhx-field hwhx-multiselect__search" type="search" placeholder="${escapeHtml$1(searchPlaceholder)}" data-hwhx-multiselect-search="1" data-hwhx-clearable="false"><span class="hwhx-multiselect__actions"><button type="button" class="hwhx-button hwhx-button--mini" data-tone="green" data-hwhx-multiselect-select-all="1">${renderIcon("check", { size: 14 })}<span>${escapeHtml$1(selectAllLabel)}</span></button><button type="button" class="hwhx-button hwhx-button--mini" data-tone="graphite" data-hwhx-multiselect-clear="1">${renderIcon("x", { size: 14 })}<span>${escapeHtml$1(clearLabel)}</span></button></span></span><span class="hwhx-multiselect__list">${groupMarkup || `<span class="hwhx-muted">${escapeHtml$1(placeholder)}</span>`}</span></span></span>`;
  }
  function readMultiSelectValues(inputNodeOrValue) {
    if (inputNodeOrValue instanceof HTMLInputElement) {
      return parseValues(inputNodeOrValue.value);
    }
    return parseValues(inputNodeOrValue);
  }
  function closeMultiSelectControls(rootNode) {
    closeAllMultiselects(rootNode);
  }
  function bindMultiSelectControls(rootNode) {
    if (!(rootNode instanceof HTMLElement) || rootNode.dataset.hwhxMultiselectBound === "1") {
      return;
    }
    rootNode.dataset.hwhxMultiselectBound = "1";
    rootNode.addEventListener(
      "click",
      (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) {
          return;
        }
        const multiselectNode = target.closest("[data-hwhx-multiselect]");
        if (!(multiselectNode instanceof HTMLElement)) {
          closeAllMultiselects(rootNode);
          return;
        }
        if (target.closest("[data-hwhx-multiselect-button]")) {
          event.preventDefault();
          event.stopPropagation();
          const shouldOpen = !multiselectNode.classList.contains("is-open");
          closeAllMultiselects(rootNode, multiselectNode);
          setMultiselectOpen(multiselectNode, shouldOpen);
          return;
        }
        if (target.closest("[data-hwhx-multiselect-select-all]")) {
          event.preventDefault();
          event.stopPropagation();
          toggleOptions(multiselectNode, true);
          return;
        }
        if (target.closest("[data-hwhx-multiselect-clear]")) {
          event.preventDefault();
          event.stopPropagation();
          toggleOptions(multiselectNode, false);
          return;
        }
        if (target.closest("[data-hwhx-multiselect-menu]")) {
          event.stopPropagation();
        }
      },
      true
    );
    rootNode.addEventListener(
      "change",
      (event) => {
        const optionNode = event.target instanceof Element ? event.target.closest("[data-hwhx-multiselect-option]") : null;
        if (!(optionNode instanceof HTMLInputElement)) {
          return;
        }
        const multiselectNode = optionNode.closest("[data-hwhx-multiselect]");
        if (multiselectNode instanceof HTMLElement) {
          updateMultiselectState(multiselectNode);
        }
      },
      true
    );
    rootNode.addEventListener(
      "input",
      (event) => {
        const searchNode = event.target instanceof Element ? event.target.closest("[data-hwhx-multiselect-search]") : null;
        if (!(searchNode instanceof HTMLInputElement)) {
          return;
        }
        const multiselectNode = searchNode.closest("[data-hwhx-multiselect]");
        if (multiselectNode instanceof HTMLElement) {
          applySearch(multiselectNode);
        }
      },
      true
    );
    rootNode.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") {
          return;
        }
        const multiselectNode = event.target instanceof Element ? event.target.closest("[data-hwhx-multiselect]") : null;
        if (!(multiselectNode instanceof HTMLElement)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        setMultiselectOpen(multiselectNode, false);
        const buttonNode = multiselectNode.querySelector(
          "[data-hwhx-multiselect-button]"
        );
        if (buttonNode instanceof HTMLButtonElement) {
          buttonNode.focus();
        }
      },
      true
    );
    rootNode.addEventListener(
      "scroll",
      () => updateOpenMultiselectPositions(rootNode),
      true
    );
    globalThis.addEventListener?.(
      "resize",
      () => updateOpenMultiselectPositions(rootNode)
    );
  }
  function dispatchDomEvent(node, eventName) {
    if (!node || !eventName) {
      return;
    }
    try {
      node.dispatchEvent(new globalThis.Event(eventName, { bubbles: true }));
      return;
    } catch {
      const legacyEvent = document.createEvent("Event");
      legacyEvent.initEvent(eventName, true, false);
      node.dispatchEvent(legacyEvent);
    }
  }
  function getAllowedTabs(tabsNode) {
    return [...tabsNode.querySelectorAll("[data-hwhx-tab-button]")].filter((node) => node instanceof HTMLButtonElement && !node.disabled).map((node) => String(node.dataset.hwhxTabValue ?? "")).filter(Boolean);
  }
  function setActiveTab(tabsNode, nextValue) {
    if (!(tabsNode instanceof HTMLElement)) {
      return;
    }
    const allowedValues = getAllowedTabs(tabsNode);
    const normalizedValue = allowedValues.includes(String(nextValue)) ? String(nextValue) : allowedValues[0] ?? "";
    if (!normalizedValue) {
      return;
    }
    const inputNode = tabsNode.querySelector("[data-hwhx-tabs-input]");
    if (inputNode instanceof HTMLInputElement && inputNode.value !== normalizedValue) {
      inputNode.value = normalizedValue;
      inputNode.setAttribute("value", normalizedValue);
      dispatchDomEvent(inputNode, "input");
      dispatchDomEvent(inputNode, "change");
    }
    [...tabsNode.querySelectorAll("[data-hwhx-tab-button]")].forEach((buttonNode) => {
      if (!(buttonNode instanceof HTMLButtonElement)) {
        return;
      }
      const isActive = String(buttonNode.dataset.hwhxTabValue ?? "") === normalizedValue;
      buttonNode.classList.toggle("is-active", isActive);
      buttonNode.setAttribute("aria-selected", isActive ? "true" : "false");
      buttonNode.tabIndex = isActive ? 0 : -1;
    });
    [...tabsNode.querySelectorAll("[data-hwhx-tab-panel]")].forEach((panelNode) => {
      if (!(panelNode instanceof HTMLElement)) {
        return;
      }
      const isActive = String(panelNode.dataset.hwhxTabPanel ?? "") === normalizedValue;
      panelNode.classList.toggle("is-active", isActive);
      panelNode.hidden = !isActive;
    });
  }
  function focusAdjacentTab(buttonNode, direction) {
    const tabsNode = buttonNode.closest("[data-hwhx-tabs]");
    if (!(tabsNode instanceof HTMLElement)) {
      return;
    }
    const buttons = [...tabsNode.querySelectorAll("[data-hwhx-tab-button]")].filter(
      (node) => node instanceof HTMLButtonElement && !node.disabled
    );
    if (buttons.length <= 0) {
      return;
    }
    const currentIndex = buttons.indexOf(buttonNode);
    const nextIndex = (Math.max(0, currentIndex) + direction + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
    setActiveTab(tabsNode, buttons[nextIndex]?.dataset.hwhxTabValue);
  }
  function buildTabsMarkup({
    id = "",
    value = "",
    tabs = [],
    className = "",
    size = "",
    variant = "",
    orientation = "horizontal",
    navLabel = "",
    extraAttributes = {}
  } = {}) {
    const normalizedTabs = (Array.isArray(tabs) ? tabs : []).filter(
      (tab) => String(tab?.value ?? "").trim() !== ""
    );
    const enabledTabs = normalizedTabs.filter((tab) => !tab.disabled);
    const activeValue = enabledTabs.some((tab) => String(tab.value) === String(value)) ? String(value) : String(enabledTabs[0]?.value ?? normalizedTabs[0]?.value ?? "");
    const normalizedId = String(id ?? "").trim() || `hwhx-tabs-${Math.random().toString(36).slice(2)}`;
    const inputMarkup = `<input${buildHtmlAttributeMarkup({
      id: normalizedId,
      type: "hidden",
      value: activeValue,
      "data-hwhx-tabs-input": "1"
    })}>`;
    const navMarkup = normalizedTabs.map((tab) => {
      const tabValue = String(tab.value);
      const isActive = tabValue === activeValue;
      const iconName = String(tab.icon ?? "").trim();
      const badge = String(tab.badge ?? tab.count ?? "").trim();
      const iconMarkup = iconName ? renderIcon(iconName, {
        size: 16,
        className: "hwhx-lucide hwhx-tabs__icon"
      }) : "";
      return `<button${buildHtmlAttributeMarkup({
        type: "button",
        class: `hwhx-tabs__tab${isActive ? " is-active" : ""}`,
        role: "tab",
        "data-hwhx-tab-button": "1",
        "data-hwhx-tab-value": tabValue,
        "aria-selected": isActive ? "true" : "false",
        "aria-disabled": tab.disabled ? "true" : void 0,
        tabindex: isActive && !tab.disabled ? "0" : "-1",
        disabled: !!tab.disabled,
        title: tab.title || void 0
      })}>${iconMarkup}<span>${escapeHtml$1(tab.label ?? tabValue)}</span>${badge ? `<span class="hwhx-tabs__badge">${escapeHtml$1(badge)}</span>` : ""}</button>`;
    }).join("");
    const panelMarkup = normalizedTabs.map((tab) => {
      const tabValue = String(tab.value);
      const isActive = tabValue === activeValue;
      return `<section class="hwhx-tabs__panel${isActive ? " is-active" : ""}" role="tabpanel" data-hwhx-tab-panel="${escapeHtml$1(tabValue)}"${isActive ? "" : " hidden"}>${String(tab.content ?? "")}</section>`;
    }).join("");
    const rootAttributes = {
      class: [
        "hwhx-tabs",
        size ? `hwhx-tabs--${size}` : "",
        variant ? `hwhx-tabs--${variant}` : "",
        orientation === "vertical" ? "hwhx-tabs--vertical" : "",
        className
      ].filter(Boolean).join(" "),
      "data-hwhx-tabs": "1",
      "data-hwhx-tabs-orientation": orientation === "vertical" ? "vertical" : "horizontal",
      ...extraAttributes
    };
    return `<div${buildHtmlAttributeMarkup(rootAttributes)}>${inputMarkup}<div class="hwhx-tabs__nav" role="tablist"${navLabel ? ` aria-label="${escapeHtml$1(navLabel)}"` : ""}>${navMarkup}</div><div class="hwhx-tabs__panels">${panelMarkup}</div></div>`;
  }
  function bindTabsControls(rootNode) {
    if (!(rootNode instanceof HTMLElement) || rootNode.dataset.hwhxTabsBound === "1") {
      return;
    }
    rootNode.dataset.hwhxTabsBound = "1";
    rootNode.addEventListener(
      "click",
      (event) => {
        const buttonNode = event.target instanceof Element ? event.target.closest("[data-hwhx-tab-button]") : null;
        if (!(buttonNode instanceof HTMLButtonElement)) {
          return;
        }
        if (buttonNode.disabled) {
          return;
        }
        const tabsNode = buttonNode.closest("[data-hwhx-tabs]");
        if (!(tabsNode instanceof HTMLElement)) {
          return;
        }
        event.preventDefault();
        setActiveTab(tabsNode, buttonNode.dataset.hwhxTabValue);
      },
      true
    );
    rootNode.addEventListener(
      "keydown",
      (event) => {
        const buttonNode = event.target instanceof Element ? event.target.closest("[data-hwhx-tab-button]") : null;
        if (!(buttonNode instanceof HTMLButtonElement)) {
          return;
        }
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          focusAdjacentTab(buttonNode, 1);
          return;
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          focusAdjacentTab(buttonNode, -1);
        }
      },
      true
    );
  }
  function debounce(callback, delayMs = 75) {
    let timeoutId = 0;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = globalThis.setTimeout(() => callback(...args), delayMs);
    };
  }
  function normalizeSearchText(value) {
    return String(value ?? "").toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/[()[\]{}.,;:·|/\\_+-]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function setSearchElementVisible(element, isVisible) {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    element.hidden = !isVisible;
    if (isVisible) {
      element.removeAttribute("data-hwhx-search-hidden");
      element.style.removeProperty("display");
    } else {
      element.setAttribute("data-hwhx-search-hidden", "1");
      element.style.setProperty("display", "none", "important");
    }
  }
  class SearchRegistry {
    constructor({ onAfterFilter } = {}) {
      __privateAdd(this, _rows, /* @__PURE__ */ new Map());
      __privateAdd(this, _onAfterFilter);
      __privateSet(this, _onAfterFilter, onAfterFilter);
    }
    register(row) {
      const id = String(row?.id ?? "").trim();
      if (!id || !(row?.element instanceof HTMLElement)) {
        return;
      }
      __privateGet(this, _rows).set(id, {
        id,
        element: row.element,
        groupElement: row.groupElement instanceof HTMLElement ? row.groupElement : null,
        searchText: normalizeSearchText(row.searchText)
      });
    }
    clear() {
      __privateGet(this, _rows).clear();
    }
    filter(query) {
      var _a;
      const tokens = normalizeSearchText(query).split(" ").filter((token) => token !== "");
      const visibleGroups = /* @__PURE__ */ new Set();
      for (const row of __privateGet(this, _rows).values()) {
        const isVisible = tokens.length === 0 || tokens.every((token) => row.searchText.includes(token));
        setSearchElementVisible(row.element, isVisible);
        if (isVisible && row.groupElement) {
          visibleGroups.add(row.groupElement);
        }
      }
      for (const row of __privateGet(this, _rows).values()) {
        if (!row.groupElement) {
          continue;
        }
        const isVisible = visibleGroups.has(row.groupElement);
        setSearchElementVisible(row.groupElement, isVisible);
        if (isVisible && tokens.length > 0 && row.groupElement instanceof HTMLDetailsElement) {
          row.groupElement.open = true;
        }
      }
      (_a = __privateGet(this, _onAfterFilter)) == null ? void 0 : _a.call(this, { query, visibleGroups });
    }
    createInputHandler(delayMs = 75) {
      return debounce((event) => {
        if (event?.target instanceof HTMLInputElement) {
          this.filter(event.target.value);
        }
      }, delayMs);
    }
  }
  _rows = new WeakMap();
  _onAfterFilter = new WeakMap();
  function cssEscape(value) {
    const normalizedValue = String(value ?? "");
    if (typeof globalThis.CSS?.escape === "function") {
      return globalThis.CSS.escape(normalizedValue);
    }
    return normalizedValue.replaceAll(/[^a-zA-Z0-9_-]/g, "\\$&");
  }
  function getScopedElementById(inputId, rootNode = document) {
    const normalizedInputId = String(inputId ?? "").trim();
    if (!normalizedInputId) {
      return null;
    }
    if (rootNode instanceof Document) {
      return rootNode.getElementById(normalizedInputId);
    }
    if (!(rootNode instanceof Element)) {
      return document.getElementById(normalizedInputId);
    }
    try {
      return rootNode.querySelector(`#${cssEscape(normalizedInputId)}`);
    } catch {
      try {
        return rootNode.querySelector(
          `[id="${normalizedInputId.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"]`
        );
      } catch {
        return [...rootNode.querySelectorAll("[id]")].find(
          (node) => node instanceof HTMLElement && node.id === normalizedInputId
        ) ?? null;
      }
    }
  }
  function readCheckboxInput(inputId, fallbackValue = false, rootNode = document) {
    const input = getScopedElementById(inputId, rootNode);
    return input instanceof HTMLInputElement ? input.checked : !!fallbackValue;
  }
  function readTextInput(inputId, fallbackValue = "", rootNode = document) {
    const input = getScopedElementById(inputId, rootNode);
    const isSelect = typeof globalThis.HTMLSelectElement === "function" && input instanceof globalThis.HTMLSelectElement;
    const isTextarea = typeof globalThis.HTMLTextAreaElement === "function" && input instanceof globalThis.HTMLTextAreaElement;
    return input instanceof HTMLInputElement || isSelect || isTextarea ? input.value : fallbackValue;
  }
  function readNumberInput(inputId, fallbackValue = 0, rootNode = document, { minValue = void 0, maxValue = void 0, integer = true } = {}) {
    const input = getScopedElementById(inputId, rootNode);
    const numericValue = Number(
      input instanceof HTMLInputElement ? input.value : fallbackValue
    );
    let nextValue = Number.isFinite(numericValue) ? numericValue : Number(fallbackValue) || 0;
    if (integer) {
      nextValue = Math.trunc(nextValue);
    }
    if (Number.isFinite(Number(minValue))) {
      nextValue = Math.max(Number(minValue), nextValue);
    }
    if (Number.isFinite(Number(maxValue))) {
      nextValue = Math.min(Number(maxValue), nextValue);
    }
    return nextValue;
  }
  function readSelectInput(inputId, fallbackValue, allowedValues = void 0, rootNode = document) {
    const value = String(readTextInput(inputId, fallbackValue, rootNode) ?? "").trim();
    return Array.isArray(allowedValues) && !allowedValues.includes(value) ? fallbackValue : value;
  }
  function buildInlineIconMarkup(iconName, { className = "", title = "", size = 16 } = {}) {
    const titleAttribute = buildTooltipAttributeMarkup(title);
    return `<span class="${escapeHtml$1(["hwhx-label-icon", className].filter(Boolean).join(" "))}"${titleAttribute}>${renderIcon(iconName, { size })}</span>`;
  }
  function buildIconLabelMarkup(iconName, label, { className = "", iconClassName = "", title = "" } = {}) {
    return `<span class="${escapeHtml$1(["hwhx-icon-label", className].filter(Boolean).join(" "))}">${buildInlineIconMarkup(iconName, { className: iconClassName, title, size: 15 })}<span>${escapeHtml$1(label)}</span></span>`;
  }
  function buildAccordionArrowMarkup({ size = 16 } = {}) {
    return `<span class="hwhx-accordion__arrow">${renderIcon("chevron-right", { size })}</span>`;
  }
  function buildSettingsPanel(content, { className = "", accentColor = "" } = {}) {
    return `<div class="${escapeHtml$1(["hwhx-panel", className].filter(Boolean).join(" "))}"${buildCssVariableStyleMarkup({ "--hwhx-accent": accentColor })}>${content}</div>`;
  }
  function buildInfoLineMarkup({
    label = "",
    labelHtml = "",
    value = "",
    valueHtml = "",
    icon = "",
    title = "",
    labelColor = "",
    valueColor = "",
    className = "",
    lineId = "",
    valueId = "",
    attributes = {}
  } = {}) {
    const labelMarkup = labelHtml || (icon ? buildIconLabelMarkup(icon, label, { title }) : escapeHtml$1(label));
    const valueMarkup = valueHtml || escapeHtml$1(value);
    return `<div${buildHtmlAttributeMarkup({
      id: lineId || void 0,
      class: ["hwhx-info-line", className].filter(Boolean).join(" "),
      "data-hwhx-native-title": title || void 0,
      ...attributes
    })}${buildTooltipAttributeMarkup(title)}${buildCssVariableStyleMarkup({
      "--hwhx-label-color": labelColor,
      "--hwhx-value-color": valueColor
    })}><span class="hwhx-info-line__label">${labelMarkup}</span><span${buildHtmlAttributeMarkup(
      {
        id: valueId || void 0,
        class: "hwhx-info-line__value"
      }
    )}>${valueMarkup}</span></div>`;
  }
  function buildSettingsHintMarkup(text, { title = "", className = "" } = {}) {
    return `<div${buildHtmlAttributeMarkup({
      class: ["hwhx-hint", className].filter(Boolean).join(" "),
      role: "note",
      "data-hwhx-native-title": title || void 0
    })}${buildTooltipAttributeMarkup(title)}>${escapeHtml$1(text)}</div>`;
  }
  function buildDonatePanelMarkup({
    title = "",
    text = "",
    wallet = "",
    icon = "gift",
    accentColor = "#6b4f29",
    labelColor = "#ffd36e",
    valueColor = "#f7e0bc"
  } = {}) {
    return buildSettingsPanel(
      `${buildInfoLineMarkup({
        label: title,
        value: wallet,
        icon,
        labelColor,
        valueColor
      })}${buildSettingsHintMarkup(text)}`,
      { accentColor }
    );
  }
  function buildSettingsAccordion({
    key = "",
    title = "",
    icon = "settings",
    content = "",
    accentColor = "#6e4a24",
    defaultOpen = false,
    badges = "",
    titleText = "",
    attributes = {}
  } = {}) {
    const keyAttributes = key ? {
      "data-hwhx-settings-accordion-key": key,
      "data-hwhx-search-text": `${title} ${titleText}`
    } : { "data-hwhx-search-text": `${title} ${titleText}` };
    return `<details${buildHtmlAttributeMarkup({
      class: "hwhx-accordion",
      open: !!defaultOpen,
      ...keyAttributes,
      ...attributes
    })}${buildCssVariableStyleMarkup({ "--hwhx-accent": accentColor })}><summary class="hwhx-accordion__summary"${buildTooltipAttributeMarkup(titleText)}><span class="hwhx-accordion__heading"><span class="hwhx-accordion__arrow">▸</span>${buildIconLabelMarkup(icon, title)}</span>${badges ? `<span class="hwhx-badges">${badges}</span>` : ""}</summary><div class="hwhx-accordion__body">${content}</div></details>`;
  }
  function buildSettingsField({
    label,
    labelHtml = "",
    inputId,
    value,
    icon = "coins",
    minValue = 0,
    maxValue = void 0,
    widthPx = 112,
    title = "",
    sideText = "",
    color = "",
    extraAttributes = {},
    className = "",
    rowAttributes = {}
  } = {}) {
    const inputMarkup = buildNumberInputMarkup({
      id: inputId,
      value,
      minValue,
      maxValue,
      widthPx,
      title,
      extraAttributes
    });
    const sideMarkup = sideText ? `<span class="hwhx-side-value">[<span class="hwhx-side-value__main">${escapeHtml$1(sideText)}</span>]</span>` : "";
    return `<label${buildHtmlAttributeMarkup({
      class: ["hwhx-form-row", className].filter(Boolean).join(" "),
      "data-hwhx-native-title": title || void 0,
      ...rowAttributes
    })}${buildCssVariableStyleMarkup({ "--hwhx-label-color": color, "--hwhx-field-width": `${widthPx}px` })}><span class="hwhx-form-label">${labelHtml || buildIconLabelMarkup(icon, label, { title })}${sideMarkup}</span><span class="hwhx-form-control">${inputMarkup}</span></label>`;
  }
  function buildSettingsSelectField({
    label,
    inputId,
    value,
    options,
    icon = "settings",
    widthPx = 240,
    title = "",
    color = "",
    className = "",
    selectOptions = {},
    rowAttributes = {}
  } = {}) {
    return `<label${buildHtmlAttributeMarkup({
      class: ["hwhx-form-row", className].filter(Boolean).join(" "),
      "data-hwhx-native-title": title || void 0,
      ...rowAttributes
    })}${buildCssVariableStyleMarkup({ "--hwhx-label-color": color, "--hwhx-field-width": `${widthPx}px` })}><span class="hwhx-form-label">${buildIconLabelMarkup(icon, label, { title })}</span><span class="hwhx-form-control">${buildCustomSelectMarkup(
      {
        id: inputId,
        value,
        options,
        widthPx,
        title,
        ...selectOptions
      }
    )}</span></label>`;
  }
  function buildSettingsCheckboxRow({
    inputId,
    checked,
    label,
    labelHtml = "",
    icon = "check",
    title = "",
    color = "",
    className = "",
    extraAttributes = {},
    rowAttributes = {}
  } = {}) {
    return `<label${buildHtmlAttributeMarkup({
      class: ["hwhx-checkbox-row", className].filter(Boolean).join(" "),
      "data-hwhx-native-title": title || void 0,
      ...rowAttributes
    })}${buildCssVariableStyleMarkup({ "--hwhx-label-color": color })}><span class="hwhx-checkbox-box"><input${buildHtmlAttributeMarkup(
      {
        id: inputId,
        class: "hwhx-checkbox-input",
        type: "checkbox",
        checked: !!checked,
        ...extraAttributes
      }
    )}></span><span class="hwhx-checkbox-label">${labelHtml || buildIconLabelMarkup(icon, label, { title })}</span></label>`;
  }
  function buildSettingsActionButton({
    result,
    action,
    label,
    icon = "",
    tone = "graphite",
    title = "",
    className = ""
  } = {}) {
    const actionValue = result ?? action ?? "";
    return `<button type="button" class="${escapeHtml$1(["hwhx-button", className].filter(Boolean).join(" "))}" data-action="${escapeHtml$1(actionValue)}" data-tone="${escapeHtml$1(tone)}"${buildTooltipAttributeMarkup(title)}>${icon ? buildIconText(icon, label) : escapeHtml$1(label)}</button>`;
  }
  function buildSettingsActionBarMarkup(actions = [], { className = "hwhx-native-actions--left" } = {}) {
    const actionMarkup = actions.map((action) => buildSettingsActionButton(action)).join("");
    return `<div class="${escapeHtml$1(["hwhx-native-actions", className].filter(Boolean).join(" "))}">${actionMarkup}</div>`;
  }
  function buildSettingsSearchMarkup({
    placeholder = getDefaultSettingsSearchText().placeholder,
    clearLabel = getDefaultSettingsSearchText().clearLabel
  } = {}) {
    return `<div class="hwhx-settings-search" data-hwhx-settings-search="1"><span class="hwhx-settings-search__icon">${renderIcon("search", { size: 15 })}</span><input class="hwhx-field hwhx-settings-search__input" type="text" placeholder="${escapeHtml$1(placeholder)}" aria-label="${escapeHtml$1(placeholder)}" data-hwhx-settings-search-input="1" data-hwhx-clearable="false" autocomplete="off" spellcheck="false"><button type="button" class="hwhx-settings-search__clear" aria-label="${escapeHtml$1(clearLabel)}" title="${escapeHtml$1(clearLabel)}" data-hwhx-settings-search-clear="1">${renderIcon("x", { size: 14 })}</button></div>`;
  }
  function getDefaultSettingsSearchText() {
    return getSharedUiLanguage() === "ru" ? {
      placeholder: "Поиск по настройкам",
      clearLabel: "Очистить",
      emptyLabel: "Ничего не найдено"
    } : {
      placeholder: "Search settings",
      clearLabel: "Clear",
      emptyLabel: "Nothing found"
    };
  }
  function getSearchableText(node) {
    return normalizeSearchText(node?.dataset?.hwhxSearchText ?? node?.textContent ?? "");
  }
  function getContainerHeadingText(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    return normalizeSearchText(
      node.dataset.hwhxSearchText ?? node.querySelector(
        ":scope > summary, :scope > .hwhx-title, :scope > .hwhx-section-title"
      )?.textContent ?? ""
    );
  }
  function getSettingsSearchRoot(node) {
    return node?.closest?.("[data-hwhx-settings-search-root]") ?? node;
  }
  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function clearSettingsSearchHighlights(root) {
    [...root.querySelectorAll("mark[data-hwhx-settings-search-mark]")].forEach(
      (markNode) => {
        const parentNode = markNode.parentNode;
        if (!parentNode) {
          return;
        }
        parentNode.replaceChild(
          document.createTextNode(markNode.textContent ?? ""),
          markNode
        );
        parentNode.normalize();
      }
    );
  }
  function shouldSkipHighlightNode(node) {
    const parentElement = node.parentElement;
    return !parentElement || !!parentElement.closest(
      [
        "[data-hwhx-settings-search]",
        "script",
        "style",
        "input",
        "textarea",
        "select",
        "button",
        "svg",
        "mark[data-hwhx-settings-search-mark]"
      ].join(",")
    );
  }
  function highlightSettingsSearchMatches(root, query) {
    const tokens = getSettingsSearchTokens(query);
    if (tokens.length === 0) {
      return;
    }
    const pattern = new RegExp(tokens.map(escapeRegExp).join("|"), "giu");
    const nodeFilter = globalThis.NodeFilter;
    if (!nodeFilter) {
      return;
    }
    const walker = document.createTreeWalker(root, nodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (shouldSkipHighlightNode(node)) {
          return nodeFilter.FILTER_REJECT;
        }
        if (node.parentElement?.closest('[hidden], [data-hwhx-settings-search-hidden="1"]')) {
          return nodeFilter.FILTER_REJECT;
        }
        pattern.lastIndex = 0;
        return pattern.test(node.nodeValue ?? "") ? nodeFilter.FILTER_ACCEPT : nodeFilter.FILTER_REJECT;
      }
    });
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    textNodes.forEach((textNode) => {
      const text = textNode.nodeValue ?? "";
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      pattern.lastIndex = 0;
      text.replace(pattern, (match, offset) => {
        if (offset > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }
        const markNode = document.createElement("mark");
        markNode.dataset.hwhxSettingsSearchMark = "1";
        markNode.textContent = match;
        fragment.appendChild(markNode);
        lastIndex = offset + match.length;
        return match;
      });
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      textNode.parentNode?.replaceChild(fragment, textNode);
    });
  }
  function getSettingsSearchTokens(query) {
    return normalizeSearchText(query).split(" ").filter((token) => token !== "");
  }
  function matchesSettingsSearchText(text, tokens) {
    return tokens.length === 0 || tokens.every((token) => text.includes(token));
  }
  function setSettingsSearchVisible(node, isVisible, hasQuery) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    const nextVisible = !hasQuery && node.matches("[data-hwhx-tab-panel]") ? node.classList.contains("is-active") : isVisible;
    node.dataset.hwhxSettingsSearchHidden = nextVisible ? "0" : "1";
    setSearchElementVisible(node, nextVisible);
  }
  function applySettingsSearch(rootNode) {
    const root = getSettingsSearchRoot(rootNode);
    if (!(root instanceof HTMLElement)) {
      return;
    }
    const searchInput = root.querySelector("[data-hwhx-settings-search-input]");
    const rawQuery = String(
      searchInput instanceof HTMLInputElement ? searchInput.value : ""
    ).trim();
    const tokens = getSettingsSearchTokens(rawQuery);
    const hasQuery = tokens.length > 0;
    clearSettingsSearchHighlights(root);
    root.classList.toggle("has-settings-search", hasQuery);
    const rowSelector = [
      ".hwhx-form-row",
      ".hwhx-checkbox-row",
      ".hwhx-native-checkbox-row",
      ".hwhx-info-line",
      ".hwhx-control-group",
      ".hwhx-popup-checkbox",
      ".hwhx-settings-slot-card",
      ".hwhx-settings-searchable"
    ].join(",");
    const containerSelector = [
      ".hwhx-accordion",
      ".hwhx-panel",
      ".hwhx-settings-list",
      ".hwhx-control-stack",
      ".hwhx-settings-grid",
      ".hwhx-native-checkboxes",
      ".hwhx-tabs__panel"
    ].join(",");
    [...root.querySelectorAll(rowSelector)].forEach((rowNode) => {
      if (!(rowNode instanceof HTMLElement) || rowNode.closest("[data-hwhx-settings-search]")) {
        return;
      }
      setSettingsSearchVisible(
        rowNode,
        matchesSettingsSearchText(getSearchableText(rowNode), tokens),
        hasQuery
      );
    });
    [...root.querySelectorAll(containerSelector)].filter((containerNode) => containerNode instanceof HTMLElement).sort((left, right) => {
      if (left.contains(right)) {
        return 1;
      }
      if (right.contains(left)) {
        return -1;
      }
      return 0;
    }).forEach((containerNode) => {
      if (!(containerNode instanceof HTMLElement)) {
        return;
      }
      const directMatch = hasQuery && matchesSettingsSearchText(getContainerHeadingText(containerNode), tokens);
      const visibleChild = [...containerNode.querySelectorAll(rowSelector)].some(
        (rowNode) => rowNode instanceof HTMLElement && rowNode.dataset.hwhxSettingsSearchHidden !== "1"
      ) || [...containerNode.querySelectorAll(containerSelector)].some(
        (childContainer) => childContainer instanceof HTMLElement && childContainer.dataset.hwhxSettingsSearchHidden !== "1"
      );
      const isVisible = !hasQuery || directMatch || visibleChild;
      setSettingsSearchVisible(containerNode, isVisible, hasQuery);
      if (containerNode instanceof HTMLDetailsElement) {
        if (hasQuery && isVisible) {
          if (!containerNode.hasAttribute("open")) {
            containerNode.dataset.hwhxSettingsSearchOpened = "1";
            containerNode.open = true;
          }
        } else if (!hasQuery && containerNode.dataset.hwhxSettingsSearchOpened === "1") {
          containerNode.open = false;
          delete containerNode.dataset.hwhxSettingsSearchOpened;
        }
      }
    });
    const visibleRows = [...root.querySelectorAll(rowSelector)].filter(
      (rowNode) => rowNode instanceof HTMLElement && rowNode.dataset.hwhxSettingsSearchHidden !== "1"
    );
    let emptyNode = root.querySelector("[data-hwhx-settings-search-empty]");
    if (hasQuery && visibleRows.length === 0) {
      if (!(emptyNode instanceof HTMLElement)) {
        emptyNode = document.createElement("div");
        emptyNode.className = "hwhx-settings-search-empty";
        emptyNode.dataset.hwhxSettingsSearchEmpty = "1";
        emptyNode.textContent = getDefaultSettingsSearchText().emptyLabel;
        root.appendChild(emptyNode);
      }
      emptyNode.hidden = false;
    } else if (emptyNode instanceof HTMLElement) {
      emptyNode.hidden = true;
    }
    highlightSettingsSearchMatches(root, rawQuery);
  }
  function bindSettingsSearchControls(rootNode) {
    if (!(rootNode instanceof HTMLElement) || rootNode.dataset.hwhxSettingsSearchBound === "1") {
      return;
    }
    rootNode.dataset.hwhxSettingsSearchBound = "1";
    rootNode.addEventListener(
      "input",
      (event) => {
        const input = event.target instanceof Element ? event.target.closest("[data-hwhx-settings-search-input]") : null;
        if (input instanceof HTMLInputElement) {
          applySettingsSearch(input);
        }
      },
      true
    );
    rootNode.addEventListener(
      "click",
      (event) => {
        const clearButton = event.target instanceof Element ? event.target.closest("[data-hwhx-settings-search-clear]") : null;
        if (!(clearButton instanceof HTMLElement)) {
          return;
        }
        const root = getSettingsSearchRoot(clearButton);
        const input = root?.querySelector?.("[data-hwhx-settings-search-input]");
        if (input instanceof HTMLInputElement) {
          event.preventDefault();
          input.value = "";
          applySettingsSearch(input);
          input.focus();
        }
      },
      true
    );
  }
  const TOOLTIP_SHOW_DELAY_MS = 260;
  const TOOLTIP_TOUCH_SHOW_DELAY_MS = 120;
  const TOOLTIP_TOUCH_HIDE_MS = 1800;
  const TOOLTIP_CURSOR_OFFSET_X = 14;
  const TOOLTIP_CURSOR_OFFSET_Y = 18;
  const TOOLTIP_VIEWPORT_MARGIN = 8;
  const TOOLTIP_TARGET_GAP = 10;
  const TOOLTIP_HIDE_ANIMATION_MS = 140;
  class ModalRenderer {
    constructor({ title = "", className = "", kind = "generic" } = {}) {
      __privateAdd(this, _ModalRenderer_instances);
      __privateAdd(this, _root);
      __privateAdd(this, _dialog);
      __privateAdd(this, _body);
      __privateAdd(this, _actions);
      __privateAdd(this, _resolve);
      __privateAdd(this, _isClosed, false);
      __privateAdd(this, _searchRegistry, new SearchRegistry());
      __privateAdd(this, _tooltipNode);
      __privateAdd(this, _tooltipTarget);
      __privateAdd(this, _tooltipPendingTarget);
      __privateAdd(this, _tooltipShowTimer, 0);
      __privateAdd(this, _tooltipAutoHideTimer, 0);
      __privateAdd(this, _tooltipHideTimer, 0);
      __privateAdd(this, _tooltipPendingClientX);
      __privateAdd(this, _tooltipPendingClientY);
      __privateAdd(this, _tooltipWidth, 0);
      __privateAdd(this, _tooltipHeight, 0);
      /** Закрытие по Escape (в фазе bubbling — после обработки селектов на корне). */
      __privateAdd(this, _onDocumentKeydown, (event) => {
        if (__privateGet(this, _isClosed)) {
          return;
        }
        if (event.key !== "Escape") {
          return;
        }
        if (event.defaultPrevented) {
          return;
        }
        const modals = [...document.querySelectorAll(".hwhx-modal")].filter(
          (node) => node instanceof HTMLElement && node.isConnected
        );
        if (modals.length === 0 || modals[modals.length - 1] !== __privateGet(this, _root)) {
          return;
        }
        const openSelect = __privateGet(this, _root).querySelector("[data-hwhx-select].is-open");
        if (openSelect instanceof HTMLElement) {
          event.preventDefault();
          event.stopPropagation();
          setCustomSelectOpen(openSelect, false);
          const buttonNode = openSelect.querySelector("[data-hwhx-select-button]");
          if (buttonNode instanceof HTMLButtonElement) {
            buttonNode.focus();
          }
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.close(false);
      });
      ensureSharedUiStyles();
      __privateSet(this, _root, document.createElement("div"));
      __privateGet(this, _root).className = ["hwhx-modal", className].filter(Boolean).join(" ");
      __privateGet(this, _root).dataset.hwhxModalKind = String(kind ?? "generic");
      __privateGet(this, _root).innerHTML = `
      <div class="hwhx-modal__dialog">
        <div class="hwhx-modal__header" data-hwhx-drag-handle>
          <div class="hwhx-modal__title">${escapeHtml$1(title)}</div>
          <button class="hwhx-modal__close" type="button" data-hwhx-close data-hwhx-native-title="Close" aria-label="Close">${renderIcon("x", { size: 18 })}</button>
        </div>
        <div class="hwhx-modal__body"></div>
        <div class="hwhx-modal__actions"></div>
      </div>
    `;
      __privateSet(this, _dialog, __privateGet(this, _root).querySelector(".hwhx-modal__dialog"));
      __privateSet(this, _body, __privateGet(this, _root).querySelector(".hwhx-modal__body"));
      __privateSet(this, _actions, __privateGet(this, _root).querySelector(".hwhx-modal__actions"));
      __privateMethod(this, _ModalRenderer_instances, bindEvents_fn).call(this);
    }
    get root() {
      return __privateGet(this, _root);
    }
    get dialog() {
      return __privateGet(this, _dialog);
    }
    get body() {
      return __privateGet(this, _body);
    }
    get searchRegistry() {
      return __privateGet(this, _searchRegistry);
    }
    setBody(content) {
      if (content instanceof HTMLElement) {
        __privateGet(this, _body).replaceChildren(content);
        __privateMethod(this, _ModalRenderer_instances, prepareClearableInputs_fn).call(this, __privateGet(this, _body));
        __privateMethod(this, _ModalRenderer_instances, prepareTitles_fn).call(this, __privateGet(this, _body));
        __privateMethod(this, _ModalRenderer_instances, bindAccordionAutoScroll_fn).call(this, __privateGet(this, _body));
        return;
      }
      __privateGet(this, _body).innerHTML = String(content ?? "");
      __privateMethod(this, _ModalRenderer_instances, prepareClearableInputs_fn).call(this, __privateGet(this, _body));
      __privateMethod(this, _ModalRenderer_instances, prepareTitles_fn).call(this, __privateGet(this, _body));
      __privateMethod(this, _ModalRenderer_instances, bindAccordionAutoScroll_fn).call(this, __privateGet(this, _body));
    }
    setActions(actions = []) {
      __privateGet(this, _actions).replaceChildren(
        ...actions.map((action) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "hwhx-button hwhx-button--modal";
          button.dataset.action = String(action.result ?? "");
          button.dataset.tone = String(action.tone ?? "graphite");
          if (action.closeOnClick === false) {
            button.dataset.hwhxActionClose = "false";
          }
          if (action.icon) {
            button.innerHTML = buildIconText(action.icon, String(action.label ?? ""));
          } else {
            button.textContent = String(action.label ?? "");
          }
          if (action.title) {
            button.dataset.hwhxNativeTitle = String(action.title);
          }
          return button;
        })
      );
      __privateMethod(this, _ModalRenderer_instances, prepareTitles_fn).call(this, __privateGet(this, _actions));
    }
    open() {
      __privateSet(this, _isClosed, false);
      document.body.appendChild(__privateGet(this, _root));
      document.addEventListener("keydown", __privateGet(this, _onDocumentKeydown));
      __privateMethod(this, _ModalRenderer_instances, prepareTitles_fn).call(this, __privateGet(this, _root));
      return new Promise((resolve) => {
        __privateSet(this, _resolve, resolve);
      });
    }
    close(result = false) {
      var _a;
      if (__privateGet(this, _isClosed)) {
        return;
      }
      __privateSet(this, _isClosed, true);
      document.removeEventListener("keydown", __privateGet(this, _onDocumentKeydown));
      __privateMethod(this, _ModalRenderer_instances, clearTooltipTimers_fn).call(this);
      __privateMethod(this, _ModalRenderer_instances, hideTooltip_fn).call(this, { immediate: true });
      closeCustomSelects(__privateGet(this, _root));
      closeMultiSelectControls(__privateGet(this, _root));
      (_a = __privateGet(this, _resolve)) == null ? void 0 : _a.call(this, result);
      __privateSet(this, _resolve, void 0);
      globalThis.setTimeout(() => __privateGet(this, _root).remove(), 0);
    }
  }
  _root = new WeakMap();
  _dialog = new WeakMap();
  _body = new WeakMap();
  _actions = new WeakMap();
  _resolve = new WeakMap();
  _isClosed = new WeakMap();
  _searchRegistry = new WeakMap();
  _tooltipNode = new WeakMap();
  _tooltipTarget = new WeakMap();
  _tooltipPendingTarget = new WeakMap();
  _tooltipShowTimer = new WeakMap();
  _tooltipAutoHideTimer = new WeakMap();
  _tooltipHideTimer = new WeakMap();
  _tooltipPendingClientX = new WeakMap();
  _tooltipPendingClientY = new WeakMap();
  _tooltipWidth = new WeakMap();
  _tooltipHeight = new WeakMap();
  _onDocumentKeydown = new WeakMap();
  _ModalRenderer_instances = new WeakSet();
  bindEvents_fn = function() {
    __privateGet(this, _root).addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const clearButton = target?.closest("[data-hwhx-clearable-clear]");
      if (clearButton instanceof HTMLButtonElement) {
        event.preventDefault();
        event.stopPropagation();
        __privateMethod(this, _ModalRenderer_instances, clearTextInput_fn).call(this, clearButton);
        return;
      }
      if (target?.closest("[data-hwhx-close]")) {
        this.close(false);
        return;
      }
      const actionButton = target?.closest("[data-action]");
      if (actionButton instanceof HTMLElement) {
        if (actionButton.dataset.hwhxActionClose === "false") {
          event.preventDefault();
          event.stopPropagation();
          __privateMethod(this, _ModalRenderer_instances, dispatchActionEvent_fn).call(this, actionButton);
          return;
        }
        this.close(actionButton.dataset.action);
        return;
      }
    });
    __privateGet(this, _root).addEventListener("input", __privateGet(this, _searchRegistry).createInputHandler(75));
    __privateGet(this, _root).addEventListener("input", (event) => {
      if (event.target instanceof HTMLInputElement) {
        __privateMethod(this, _ModalRenderer_instances, syncClearableInput_fn).call(this, event.target);
      }
    });
    __privateGet(this, _root).addEventListener("change", (event) => {
      if (event.target instanceof HTMLInputElement) {
        __privateMethod(this, _ModalRenderer_instances, syncClearableInput_fn).call(this, event.target);
      }
    });
    bindNumberInputControls(__privateGet(this, _root));
    bindCustomSelectControls(__privateGet(this, _root));
    bindTabsControls(__privateGet(this, _root));
    bindMultiSelectControls(__privateGet(this, _root));
    bindSettingsSearchControls(__privateGet(this, _root));
    __privateMethod(this, _ModalRenderer_instances, makeDraggable_fn).call(this);
    __privateMethod(this, _ModalRenderer_instances, bindTooltips_fn).call(this);
  };
  prepareClearableInputs_fn = function(rootNode) {
    if (!(rootNode instanceof Element || rootNode instanceof Document)) {
      return;
    }
    [
      ...rootNode.querySelectorAll(
        'input.hwhx-field[type="text"], input.hwhx-field[type="search"]'
      )
    ].filter((inputNode) => inputNode instanceof HTMLInputElement).forEach((inputNode) => {
      if (inputNode.dataset.hwhxClearable === "false" || inputNode.closest("[data-hwhx-clearable-field]")) {
        return;
      }
      const wrapperNode = document.createElement("span");
      wrapperNode.className = "hwhx-clearable-field";
      wrapperNode.dataset.hwhxClearableField = "1";
      inputNode.before(wrapperNode);
      wrapperNode.appendChild(inputNode);
      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "hwhx-clearable-field__clear";
      clearButton.dataset.hwhxClearableClear = "1";
      clearButton.dataset.hwhxNativeTitle = "Clear";
      clearButton.setAttribute("aria-label", "Clear");
      clearButton.innerHTML = renderIcon("x", {
        size: 14,
        className: "hwhx-lucide"
      });
      wrapperNode.appendChild(clearButton);
      __privateMethod(this, _ModalRenderer_instances, syncClearableInput_fn).call(this, inputNode);
    });
  };
  syncClearableInput_fn = function(inputNode) {
    if (!(inputNode instanceof HTMLInputElement)) {
      return;
    }
    const wrapperNode = inputNode.closest("[data-hwhx-clearable-field]");
    const clearButton = wrapperNode?.querySelector("[data-hwhx-clearable-clear]");
    if (!(wrapperNode instanceof HTMLElement) || !(clearButton instanceof HTMLElement)) {
      return;
    }
    const hasValue = String(inputNode.value ?? "") !== "";
    const isDisabled = inputNode.disabled || inputNode.readOnly;
    wrapperNode.classList.toggle("has-value", hasValue && !isDisabled);
    clearButton.hidden = !hasValue || isDisabled;
    if (clearButton instanceof HTMLButtonElement) {
      clearButton.disabled = isDisabled;
    }
  };
  clearTextInput_fn = function(clearButton) {
    const wrapperNode = clearButton?.closest?.("[data-hwhx-clearable-field]");
    const inputNode = wrapperNode?.querySelector(
      'input.hwhx-field[type="text"], input.hwhx-field[type="search"]'
    );
    if (!(inputNode instanceof HTMLInputElement)) {
      return;
    }
    if (inputNode.disabled || inputNode.readOnly) {
      return;
    }
    if (inputNode.value !== "") {
      inputNode.value = "";
      __privateMethod(this, _ModalRenderer_instances, syncClearableInput_fn).call(this, inputNode);
      __privateMethod(this, _ModalRenderer_instances, dispatchDomEvent_fn).call(this, inputNode, "input");
      __privateMethod(this, _ModalRenderer_instances, dispatchDomEvent_fn).call(this, inputNode, "change");
      __privateMethod(this, _ModalRenderer_instances, dispatchDomEvent_fn).call(this, inputNode, "search");
    }
    inputNode.focus();
  };
  dispatchActionEvent_fn = function(actionButton) {
    const detail = { action: actionButton.dataset.action ?? "" };
    try {
      actionButton.dispatchEvent(
        new globalThis.CustomEvent("hwhx:modal-action", {
          bubbles: true,
          cancelable: true,
          detail
        })
      );
      return;
    } catch {
      const legacyEvent = document.createEvent("CustomEvent");
      legacyEvent.initCustomEvent("hwhx:modal-action", true, true, detail);
      actionButton.dispatchEvent(legacyEvent);
    }
  };
  getScrollContainer_fn = function(node) {
    let currentNode = node?.parentElement;
    while (currentNode instanceof HTMLElement && currentNode !== document.body) {
      const style = typeof globalThis.getComputedStyle === "function" ? globalThis.getComputedStyle(currentNode) : null;
      const overflowText = `${style?.overflowY ?? ""} ${style?.overflow ?? ""}`;
      if (/(auto|scroll|overlay)/i.test(overflowText) && currentNode.scrollHeight > currentNode.clientHeight + 1) {
        return currentNode;
      }
      currentNode = currentNode.parentElement;
    }
    return __privateGet(this, _body) instanceof HTMLElement ? __privateGet(this, _body) : null;
  };
  bindAccordionAutoScroll_fn = function(rootNode) {
    if (!(rootNode instanceof Element || rootNode instanceof Document)) {
      return;
    }
    [
      ...rootNode.querySelectorAll(
        [
          "details.hwhx-accordion",
          "details.hwhx-result-accordion",
          "details[data-hwhx-accordion-key]",
          "details[data-hwhauto-accordion]",
          "details[data-hwhauto-settings-accordion]"
        ].join(",")
      )
    ].filter((accordionNode) => accordionNode instanceof HTMLDetailsElement).forEach((accordionNode) => {
      if (accordionNode.dataset.hwhxAccordionAutoScrollBound === "1") {
        return;
      }
      accordionNode.dataset.hwhxAccordionAutoScrollBound = "1";
      accordionNode.addEventListener("toggle", () => {
        if (!accordionNode.open) {
          return;
        }
        const scroll = () => __privateMethod(this, _ModalRenderer_instances, scrollAccordionIntoView_fn).call(this, accordionNode);
        if (typeof globalThis.requestAnimationFrame === "function") {
          globalThis.requestAnimationFrame(scroll);
        } else {
          globalThis.setTimeout(scroll, 0);
        }
      });
    });
  };
  scrollAccordionIntoView_fn = function(accordionNode) {
    if (!(accordionNode instanceof HTMLElement) || !(__privateGet(this, _body) instanceof HTMLElement) || !__privateGet(this, _body).contains(accordionNode)) {
      return;
    }
    const scrollContainer = __privateMethod(this, _ModalRenderer_instances, getScrollContainer_fn).call(this, accordionNode);
    if (!(scrollContainer instanceof HTMLElement)) {
      accordionNode.scrollIntoView({ block: "nearest", inline: "nearest" });
      return;
    }
    const containerRect = scrollContainer.getBoundingClientRect();
    const accordionRect = accordionNode.getBoundingClientRect();
    const topGap = 12;
    const bottomGap = 18;
    const topOverflow = accordionRect.top - containerRect.top - topGap;
    const bottomOverflow = accordionRect.bottom - containerRect.bottom + bottomGap;
    if (topOverflow < 0) {
      scrollContainer.scrollTop += topOverflow;
      return;
    }
    if (bottomOverflow > 0) {
      scrollContainer.scrollTop += bottomOverflow;
    }
  };
  dispatchDomEvent_fn = function(node, eventName) {
    if (!node || !eventName) {
      return;
    }
    try {
      node.dispatchEvent(new globalThis.Event(eventName, { bubbles: true }));
      return;
    } catch {
      const legacyEvent = document.createEvent("Event");
      legacyEvent.initEvent(eventName, true, false);
      node.dispatchEvent(legacyEvent);
    }
  };
  clearTooltipTimers_fn = function() {
    if (__privateGet(this, _tooltipShowTimer)) {
      globalThis.clearTimeout(__privateGet(this, _tooltipShowTimer));
      __privateSet(this, _tooltipShowTimer, 0);
    }
    if (__privateGet(this, _tooltipAutoHideTimer)) {
      globalThis.clearTimeout(__privateGet(this, _tooltipAutoHideTimer));
      __privateSet(this, _tooltipAutoHideTimer, 0);
    }
    if (__privateGet(this, _tooltipHideTimer)) {
      globalThis.clearTimeout(__privateGet(this, _tooltipHideTimer));
      __privateSet(this, _tooltipHideTimer, 0);
    }
  };
  prepareTitles_fn = function(rootNode = __privateGet(this, _root)) {
    const nodes = [];
    if (rootNode instanceof HTMLElement && rootNode.hasAttribute("title")) {
      nodes.push(rootNode);
    }
    if (rootNode instanceof Element || rootNode instanceof Document) {
      nodes.push(
        ...[...rootNode.querySelectorAll("[title]")].filter(
          (node) => node instanceof HTMLElement
        )
      );
    }
    nodes.forEach((node) => {
      const titleText = String(node.getAttribute("title") ?? "").trim();
      if (!titleText) {
        node.removeAttribute("title");
        return;
      }
      if (!node.dataset.hwhxNativeTitle) {
        node.dataset.hwhxNativeTitle = titleText;
      }
      node.removeAttribute("title");
    });
  };
  getTooltipTarget_fn = function(eventTarget) {
    if (!__privateMethod(this, _ModalRenderer_instances, areTooltipsEnabled_fn).call(this)) {
      __privateMethod(this, _ModalRenderer_instances, hideTooltip_fn).call(this);
      return null;
    }
    const target = eventTarget instanceof Element ? eventTarget.closest(TOOLTIP_TARGET_SELECTOR) : null;
    if (target instanceof HTMLElement && __privateGet(this, _root).contains(target)) {
      __privateMethod(this, _ModalRenderer_instances, prepareTitles_fn).call(this, target);
      return target;
    }
    return null;
  };
  getTooltipDescriptor_fn = function(target) {
    if (!(target instanceof HTMLElement)) {
      return null;
    }
    __privateMethod(this, _ModalRenderer_instances, prepareTitles_fn).call(this, target);
    return getTooltipDescriptor(target, { defaultDelayMs: TOOLTIP_SHOW_DELAY_MS });
  };
  clampTooltipCoordinate_fn = function(value, minValue, maxValue) {
    if (maxValue < minValue) {
      return minValue;
    }
    return Math.min(Math.max(value, minValue), maxValue);
  };
  getAutoTooltipPlacement_fn = function(targetRect, tooltipWidth, tooltipHeight) {
    const viewportWidth = Number(globalThis.innerWidth) || 0;
    const viewportHeight = Number(globalThis.innerHeight) || 0;
    const spaces = {
      bottom: viewportHeight - targetRect.bottom,
      top: targetRect.top,
      right: viewportWidth - targetRect.right,
      left: targetRect.left
    };
    const preferredPlacement = ["bottom", "top", "right", "left"].find((placement) => {
      const requiredSpace = placement === "left" || placement === "right" ? tooltipWidth + TOOLTIP_TARGET_GAP : tooltipHeight + TOOLTIP_TARGET_GAP;
      return spaces[placement] >= requiredSpace;
    });
    return preferredPlacement ?? Object.entries(spaces).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "bottom";
  };
  positionTooltip_fn = function(target, clientX = void 0, clientY = void 0, descriptor = void 0) {
    if (!(target instanceof HTMLElement) || !(__privateGet(this, _tooltipNode) instanceof HTMLElement)) {
      return;
    }
    const tooltipWidth = __privateGet(this, _tooltipWidth) || __privateGet(this, _tooltipNode).offsetWidth || 0;
    const tooltipHeight = __privateGet(this, _tooltipHeight) || __privateGet(this, _tooltipNode).offsetHeight || 0;
    const viewportWidth = Number(globalThis.innerWidth) || 0;
    const viewportHeight = Number(globalThis.innerHeight) || 0;
    const targetRect = target.getBoundingClientRect();
    const requestedPlacement = descriptor?.placement ?? "auto";
    let placement = requestedPlacement === "auto" ? __privateMethod(this, _ModalRenderer_instances, getAutoTooltipPlacement_fn).call(this, targetRect, tooltipWidth, tooltipHeight) : requestedPlacement;
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    let top = targetRect.bottom + TOOLTIP_TARGET_GAP;
    if (placement === "cursor") {
      const anchorX = Number(clientX);
      const anchorY = Number(clientY);
      const nextLeft = Number.isFinite(anchorX) && anchorX + TOOLTIP_CURSOR_OFFSET_X + tooltipWidth + TOOLTIP_VIEWPORT_MARGIN <= viewportWidth ? anchorX + TOOLTIP_CURSOR_OFFSET_X : anchorX - tooltipWidth - TOOLTIP_CURSOR_OFFSET_X;
      const nextTop = Number.isFinite(anchorY) && anchorY + TOOLTIP_CURSOR_OFFSET_Y + tooltipHeight + TOOLTIP_VIEWPORT_MARGIN <= viewportHeight ? anchorY + TOOLTIP_CURSOR_OFFSET_Y : anchorY - tooltipHeight - TOOLTIP_CURSOR_OFFSET_Y;
      left = Number.isFinite(nextLeft) ? nextLeft : left;
      top = Number.isFinite(nextTop) ? nextTop : top;
    } else if (placement === "top") {
      top = targetRect.top - tooltipHeight - TOOLTIP_TARGET_GAP;
    } else if (placement === "right") {
      left = targetRect.right + TOOLTIP_TARGET_GAP;
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
    } else if (placement === "left") {
      left = targetRect.left - tooltipWidth - TOOLTIP_TARGET_GAP;
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
    } else {
      placement = "bottom";
    }
    __privateGet(this, _tooltipNode).dataset.placement = placement;
    __privateGet(this, _tooltipNode).style.left = `${__privateMethod(this, _ModalRenderer_instances, clampTooltipCoordinate_fn).call(this, left, TOOLTIP_VIEWPORT_MARGIN, viewportWidth - tooltipWidth - TOOLTIP_VIEWPORT_MARGIN)}px`;
    __privateGet(this, _tooltipNode).style.top = `${__privateMethod(this, _ModalRenderer_instances, clampTooltipCoordinate_fn).call(this, top, TOOLTIP_VIEWPORT_MARGIN, viewportHeight - tooltipHeight - TOOLTIP_VIEWPORT_MARGIN)}px`;
  };
  showTooltip_fn = function(target, clientX = void 0, clientY = void 0) {
    if (!__privateMethod(this, _ModalRenderer_instances, areTooltipsEnabled_fn).call(this)) {
      __privateMethod(this, _ModalRenderer_instances, hideTooltip_fn).call(this);
      return;
    }
    const descriptor = __privateMethod(this, _ModalRenderer_instances, getTooltipDescriptor_fn).call(this, target);
    if (!descriptor) {
      return;
    }
    if (__privateGet(this, _tooltipHideTimer)) {
      globalThis.clearTimeout(__privateGet(this, _tooltipHideTimer));
      __privateSet(this, _tooltipHideTimer, 0);
      __privateGet(this, _tooltipNode)?.remove();
      __privateSet(this, _tooltipNode, void 0);
    }
    if (!(__privateGet(this, _tooltipNode) instanceof HTMLElement)) {
      __privateSet(this, _tooltipNode, document.createElement("div"));
      __privateGet(this, _tooltipNode).className = "hwhx-tooltip";
      __privateGet(this, _tooltipNode).setAttribute("role", "tooltip");
      document.body.appendChild(__privateGet(this, _tooltipNode));
    }
    __privateSet(this, _tooltipTarget, target);
    __privateGet(this, _tooltipNode).classList.remove("is-visible", "is-hiding");
    __privateGet(this, _tooltipNode).dataset.theme = descriptor.theme || "default";
    if (descriptor.isHtml) {
      __privateGet(this, _tooltipNode).innerHTML = descriptor.html;
    } else {
      __privateGet(this, _tooltipNode).textContent = descriptor.text;
    }
    __privateSet(this, _tooltipWidth, __privateGet(this, _tooltipNode).offsetWidth);
    __privateSet(this, _tooltipHeight, __privateGet(this, _tooltipNode).offsetHeight);
    __privateMethod(this, _ModalRenderer_instances, positionTooltip_fn).call(this, target, clientX, clientY, descriptor);
    const showNode = () => {
      if (__privateGet(this, _tooltipNode) instanceof HTMLElement && __privateGet(this, _tooltipTarget) === target) {
        __privateGet(this, _tooltipNode).classList.add("is-visible");
      }
    };
    if (typeof globalThis.requestAnimationFrame === "function") {
      globalThis.requestAnimationFrame(showNode);
    } else {
      globalThis.setTimeout(showNode, 0);
    }
  };
  hideTooltip_fn = function({ immediate = false } = {}) {
    if (__privateGet(this, _tooltipShowTimer)) {
      globalThis.clearTimeout(__privateGet(this, _tooltipShowTimer));
      __privateSet(this, _tooltipShowTimer, 0);
    }
    __privateSet(this, _tooltipTarget, void 0);
    __privateSet(this, _tooltipPendingTarget, void 0);
    __privateSet(this, _tooltipPendingClientX, void 0);
    __privateSet(this, _tooltipPendingClientY, void 0);
    __privateSet(this, _tooltipWidth, 0);
    __privateSet(this, _tooltipHeight, 0);
    if (!(__privateGet(this, _tooltipNode) instanceof HTMLElement)) {
      return;
    }
    if (__privateGet(this, _tooltipHideTimer)) {
      globalThis.clearTimeout(__privateGet(this, _tooltipHideTimer));
      __privateSet(this, _tooltipHideTimer, 0);
    }
    if (immediate) {
      __privateGet(this, _tooltipNode).remove();
      __privateSet(this, _tooltipNode, void 0);
      return;
    }
    const tooltipNode = __privateGet(this, _tooltipNode);
    tooltipNode.classList.remove("is-visible");
    tooltipNode.classList.add("is-hiding");
    __privateSet(this, _tooltipHideTimer, globalThis.setTimeout(() => {
      if (__privateGet(this, _tooltipNode) === tooltipNode) {
        __privateGet(this, _tooltipNode).remove();
        __privateSet(this, _tooltipNode, void 0);
      } else {
        tooltipNode.remove();
      }
      __privateSet(this, _tooltipHideTimer, 0);
    }, TOOLTIP_HIDE_ANIMATION_MS));
  };
  scheduleTooltip_fn = function(target, clientX = void 0, clientY = void 0, delayMs = void 0) {
    if (!__privateMethod(this, _ModalRenderer_instances, areTooltipsEnabled_fn).call(this)) {
      __privateMethod(this, _ModalRenderer_instances, hideTooltip_fn).call(this);
      return;
    }
    const descriptor = __privateMethod(this, _ModalRenderer_instances, getTooltipDescriptor_fn).call(this, target);
    if (!(target instanceof HTMLElement) || !descriptor) {
      return;
    }
    if (__privateGet(this, _tooltipTarget) === target && __privateGet(this, _tooltipNode) instanceof HTMLElement) {
      __privateMethod(this, _ModalRenderer_instances, positionTooltip_fn).call(this, target, clientX, clientY, descriptor);
      return;
    }
    __privateSet(this, _tooltipPendingClientX, Number.isFinite(clientX) ? clientX : void 0);
    __privateSet(this, _tooltipPendingClientY, Number.isFinite(clientY) ? clientY : void 0);
    __privateSet(this, _tooltipTarget, target);
    if (__privateGet(this, _tooltipShowTimer) && __privateGet(this, _tooltipPendingTarget) === target) {
      return;
    }
    if (__privateGet(this, _tooltipShowTimer)) {
      globalThis.clearTimeout(__privateGet(this, _tooltipShowTimer));
      __privateSet(this, _tooltipShowTimer, 0);
    }
    __privateSet(this, _tooltipPendingTarget, target);
    __privateSet(this, _tooltipShowTimer, globalThis.setTimeout(() => {
      __privateSet(this, _tooltipShowTimer, 0);
      if (__privateMethod(this, _ModalRenderer_instances, areTooltipsEnabled_fn).call(this) && __privateGet(this, _tooltipTarget) === target && __privateGet(this, _tooltipPendingTarget) === target) {
        __privateMethod(this, _ModalRenderer_instances, showTooltip_fn).call(this, target, __privateGet(this, _tooltipPendingClientX), __privateGet(this, _tooltipPendingClientY));
      }
    }, delayMs ?? descriptor.delayMs));
  };
  moveTooltip_fn = function(event) {
    if (!__privateMethod(this, _ModalRenderer_instances, areTooltipsEnabled_fn).call(this)) {
      __privateMethod(this, _ModalRenderer_instances, hideTooltip_fn).call(this);
      return;
    }
    if (!(__privateGet(this, _tooltipTarget) instanceof HTMLElement)) {
      return;
    }
    const eventTarget = typeof globalThis.Node === "function" && event.target instanceof globalThis.Node ? event.target : null;
    if (!eventTarget || !__privateGet(this, _tooltipTarget).contains(eventTarget)) {
      return;
    }
    __privateSet(this, _tooltipPendingClientX, event.clientX);
    __privateSet(this, _tooltipPendingClientY, event.clientY);
    if (__privateGet(this, _tooltipNode) instanceof HTMLElement) {
      __privateMethod(this, _ModalRenderer_instances, positionTooltip_fn).call(this, __privateGet(this, _tooltipTarget), event.clientX, event.clientY, __privateMethod(this, _ModalRenderer_instances, getTooltipDescriptor_fn).call(this, __privateGet(this, _tooltipTarget)));
    }
  };
  areTooltipsEnabled_fn = function() {
    return globalThis.HWHSharedUI?.tooltipsEnabled !== false;
  };
  bindTooltips_fn = function() {
    __privateGet(this, _root).addEventListener("mouseover", (event) => {
      const target = __privateMethod(this, _ModalRenderer_instances, getTooltipTarget_fn).call(this, event.target);
      if (target) {
        __privateMethod(this, _ModalRenderer_instances, scheduleTooltip_fn).call(this, target, event.clientX, event.clientY);
      }
    });
    __privateGet(this, _root).addEventListener("mousemove", (event) => {
      __privateMethod(this, _ModalRenderer_instances, moveTooltip_fn).call(this, event);
    });
    __privateGet(this, _root).addEventListener("mouseout", (event) => {
      if (!(__privateGet(this, _tooltipTarget) instanceof HTMLElement)) {
        return;
      }
      const relatedTarget = typeof globalThis.Node === "function" && event.relatedTarget instanceof globalThis.Node ? event.relatedTarget : null;
      if (relatedTarget && __privateGet(this, _tooltipTarget).contains(relatedTarget)) {
        return;
      }
      __privateMethod(this, _ModalRenderer_instances, hideTooltip_fn).call(this);
    });
    __privateGet(this, _root).addEventListener("focusin", (event) => {
      const target = __privateMethod(this, _ModalRenderer_instances, getTooltipTarget_fn).call(this, event.target);
      if (target) {
        __privateMethod(this, _ModalRenderer_instances, scheduleTooltip_fn).call(this, target);
      }
    });
    __privateGet(this, _root).addEventListener("focusout", () => __privateMethod(this, _ModalRenderer_instances, hideTooltip_fn).call(this));
    __privateGet(this, _root).addEventListener("touchstart", (event) => {
      const target = __privateMethod(this, _ModalRenderer_instances, getTooltipTarget_fn).call(this, event.target);
      const touch = event.touches?.[0];
      if (target) {
        __privateMethod(this, _ModalRenderer_instances, scheduleTooltip_fn).call(this, target, touch?.clientX, touch?.clientY, TOOLTIP_TOUCH_SHOW_DELAY_MS);
        if (__privateGet(this, _tooltipAutoHideTimer)) {
          globalThis.clearTimeout(__privateGet(this, _tooltipAutoHideTimer));
        }
        __privateSet(this, _tooltipAutoHideTimer, globalThis.setTimeout(() => {
          __privateSet(this, _tooltipAutoHideTimer, 0);
          __privateMethod(this, _ModalRenderer_instances, hideTooltip_fn).call(this);
        }, TOOLTIP_TOUCH_HIDE_MS));
      }
    });
  };
  makeDraggable_fn = function() {
    const handle = __privateGet(this, _root).querySelector("[data-hwhx-drag-handle]");
    if (!(handle instanceof HTMLElement) || !(__privateGet(this, _dialog) instanceof HTMLElement)) {
      return;
    }
    let dragState = null;
    const finishDrag = (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }
      dragState = null;
      __privateGet(this, _dialog).classList.remove("is-dragging");
      document.body.style.userSelect = "";
      if (handle.hasPointerCapture?.(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
    };
    handle.addEventListener("pointerdown", (event) => {
      if (event.target?.closest?.("[data-hwhx-close]")) {
        return;
      }
      event.preventDefault();
      const rect = __privateGet(this, _dialog).getBoundingClientRect();
      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
      handle.setPointerCapture(event.pointerId);
      document.body.style.userSelect = "none";
      __privateGet(this, _dialog).style.position = "fixed";
      __privateGet(this, _dialog).style.left = `${rect.left}px`;
      __privateGet(this, _dialog).style.top = `${rect.top}px`;
      __privateGet(this, _dialog).style.margin = "0";
      __privateGet(this, _dialog).style.transform = "none";
      __privateGet(this, _dialog).classList.add("is-dragging");
    });
    handle.addEventListener("pointermove", (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      const nextLeft = dragState.left + event.clientX - dragState.startX;
      const nextTop = dragState.top + event.clientY - dragState.startY;
      const maxLeft = Math.max(8, globalThis.innerWidth - dragState.width - 8);
      const maxTop = Math.max(8, globalThis.innerHeight - dragState.height - 8);
      __privateGet(this, _dialog).style.left = `${Math.min(Math.max(8, nextLeft), maxLeft)}px`;
      __privateGet(this, _dialog).style.top = `${Math.min(Math.max(8, nextTop), maxTop)}px`;
    });
    handle.addEventListener("pointerup", finishDrag);
    handle.addEventListener("pointercancel", finishDrag);
    handle.addEventListener("lostpointercapture", finishDrag);
  };
  let fallbackPopupToken = 0;
  const activeModalByNamespace = /* @__PURE__ */ new Map();
  function getDataAttributeName(namespace, suffix) {
    return `data-${namespace}-${suffix}`;
  }
  function getActionResultKey(actionResult) {
    return String(actionResult ?? "");
  }
  function getFirstTextFromHtml(html, selectors) {
    const container = document.createElement("div");
    container.innerHTML = String(html ?? "");
    for (const selector of selectors) {
      const node = container.querySelector(selector);
      const text = String(node?.textContent ?? "").trim();
      if (text) {
        return text.replace(/\s+/g, " ");
      }
    }
    return "";
  }
  function getModalTitle(bodyHtml, popupKind) {
    const title = getFirstTextFromHtml(bodyHtml, [
      ".hwhx-modal-title-source",
      ".hwhx-selection-head__title",
      ".hwhx-popup-heading",
      ".hwhx-title",
      ".hwhx-app-header__title"
    ]);
    if (title) {
      return title;
    }
    const normalizedKind = String(popupKind ?? "generic");
    return normalizedKind === "generic" ? "HWH Tools" : normalizedKind;
  }
  function shouldInjectSettingsSearch(bodyHtml, popupKind) {
    const normalizedKind = String(popupKind ?? "").toLowerCase();
    const normalizedBodyHtml = String(bodyHtml ?? "");
    if (String(bodyHtml ?? "").includes('data-hwhx-settings-search="0"')) {
      return false;
    }
    return normalizedKind === "settings" || normalizedKind === "hero-manager" || normalizedKind === "titan-trainer" || normalizedKind === "artifact" || normalizedKind === "skin" || normalizedKind === "level" || normalizedBodyHtml.includes('data-hwhx-settings-search="1"') || normalizedBodyHtml.includes("hwhx-form-row") || normalizedBodyHtml.includes("hwhx-checkbox-row") || normalizedBodyHtml.includes("hwhx-settings-grid");
  }
  function buildCheckboxMarkup(options = [], namespace, popupToken, popupKind) {
    const rows = (options ?? []).filter((option) => option && option.name != null).map((option, index) => {
      const name = String(option.name);
      const inputId = `${namespace}-${popupKind}-${popupToken}-checkbox-${index}`;
      const title = String(option.title || option.disabledTooltip || "").trim();
      const searchText = String(option.searchText ?? "").trim();
      const labelMarkup = option.label == null || option.label === "" ? escapeHtml$1(name) : String(option.label);
      return `<label class="hwhx-native-checkbox-row${option.disabled ? " is-disabled" : ""}" data-hwhx-checkbox-key="${escapeHtml$1(name)}"${searchText ? ` data-hwhx-search-text="${escapeHtml$1(searchText)}"` : ""}${buildTooltipAttributeMarkup(title)}><input${buildHtmlAttributeMarkup(
        {
          id: inputId,
          class: "hwhx-checkbox-input",
          type: "checkbox",
          name,
          value: name,
          "data-name": name,
          "data-hwhx-checkbox": "1",
          checked: !!option.checked,
          disabled: !!option.disabled
        }
      )}><span class="hwhx-native-checkbox-label">${labelMarkup}</span></label>`;
    }).join("");
    return rows ? `<div class="hwhx-native-checkboxes" data-hwhx-native-checkboxes="1">${rows}</div>` : "";
  }
  function createNativePopupBridge({ namespace, beginSession, afterOpen } = {}) {
    ensureSharedUiStyles();
    const normalizedNamespace = String(namespace ?? "hwhx").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    function getPopupToken() {
      return typeof beginSession === "function" ? beginSession() : ++fallbackPopupToken;
    }
    function wrapBody(content, popupKind = "generic", popupToken = void 0) {
      const tokenAttribute = popupToken == null ? "" : ` ${getDataAttributeName(normalizedNamespace, "popup-token")}="${escapeHtml$1(String(popupToken))}"`;
      const searchMarkup = shouldInjectSettingsSearch(content, popupKind) ? buildSettingsSearchMarkup() : "";
      return `<div class="hwhx-native-body" ${getDataAttributeName(normalizedNamespace, "popup-body")}="1" ${getDataAttributeName(normalizedNamespace, "style-scope")}="1" ${getDataAttributeName(normalizedNamespace, "popup-kind")}="${escapeHtml$1(String(popupKind ?? "generic"))}" data-hwhx-settings-search-root="1"${tokenAttribute}>${searchMarkup}${content}</div>`;
    }
    function buildActionBar(actions = []) {
      const buttonMarkup = actions.filter((action) => action && action.result != null && action.label).map((action) => {
        const titleAttribute = buildTooltipAttributeMarkup(action.title);
        const tone = String(action.tone ?? "graphite");
        const content = action.icon ? buildIconText(action.icon, action.label) : escapeHtml$1(action.label);
        return `<button type="button" class="hwhx-button" ${getDataAttributeName(normalizedNamespace, "ui")}="button" data-tone="${escapeHtml$1(tone)}" ${getDataAttributeName(normalizedNamespace, "tone")}="${escapeHtml$1(tone)}" ${getDataAttributeName(normalizedNamespace, "action-result")}="${escapeHtml$1(getActionResultKey(action.result))}"${titleAttribute}>${content}</button>`;
      }).join("");
      return buttonMarkup ? `<div class="hwhx-native-actions" ${getDataAttributeName(normalizedNamespace, "ui")}="action-bar" role="group">${buttonMarkup}</div>` : "";
    }
    function open({
      popupKind = "generic",
      bodyHtml,
      actions = [],
      checkboxOptions = [],
      includeNativeClose: _includeNativeClose = true,
      popupToken: providedPopupToken = void 0,
      title = void 0
    }) {
      const popupToken = providedPopupToken ?? getPopupToken();
      const modalTitle = String(title || getModalTitle(bodyHtml, popupKind));
      const previousModal = activeModalByNamespace.get(normalizedNamespace);
      if (previousModal instanceof ModalRenderer) {
        previousModal.close(false);
      }
      const modal = new ModalRenderer({
        title: modalTitle,
        kind: popupKind,
        className: `hwhx-modal--${String(popupKind ?? "generic").replace(/[^a-z0-9_-]+/gi, "-")}`
      });
      const answerPromise = modal.open().finally(() => {
        if (activeModalByNamespace.get(normalizedNamespace) === modal) {
          activeModalByNamespace.delete(normalizedNamespace);
        }
      });
      activeModalByNamespace.set(normalizedNamespace, modal);
      modal.setBody(
        wrapBody(
          `${bodyHtml}${buildCheckboxMarkup(
            checkboxOptions,
            normalizedNamespace,
            popupToken,
            popupKind
          )}`,
          popupKind,
          popupToken
        )
      );
      modal.setActions(actions);
      afterOpen?.({ popupToken, popupRenderToken: popupToken, popupKind });
      return {
        popupToken,
        popupRenderToken: popupToken,
        answerPromise,
        modal,
        bodyNode: modal.body
      };
    }
    return {
      namespace: normalizedNamespace,
      wrapBody,
      buildActionBar,
      open
    };
  }
  const DEFAULT_ACTIONS = ["up", "down"];
  const DEFAULT_ACTION_ICONS = {
    top: "chevrons-up",
    up: "arrow-up",
    down: "arrow-down",
    bottom: "chevrons-down"
  };
  const DEFAULT_TEXT = {
    en: {
      actions: {
        top: "Move to top",
        up: "Move up",
        down: "Move down",
        bottom: "Move to bottom"
      },
      index: "Position",
      search: "Search"
    },
    ru: {
      actions: {
        top: "В начало",
        up: "Выше",
        down: "Ниже",
        bottom: "В конец"
      },
      index: "Позиция",
      search: "Поиск"
    }
  };
  function getDefaultText() {
    return DEFAULT_TEXT[getSharedUiLanguage()] ?? DEFAULT_TEXT.en;
  }
  function getActionTitle(action, actionTitles = {}) {
    return String(
      action?.title || actionTitles?.[action?.value] || getDefaultText().actions[action?.value] || action?.value || ""
    );
  }
  function normalizeActions(actions = DEFAULT_ACTIONS) {
    return (Array.isArray(actions) ? actions : DEFAULT_ACTIONS).map(
      (action) => typeof action === "string" ? { value: action, icon: DEFAULT_ACTION_ICONS[action] } : {
        value: String(action?.value ?? ""),
        icon: String(action?.icon ?? DEFAULT_ACTION_ICONS[action?.value] ?? ""),
        title: String(action?.title ?? "")
      }
    ).filter((action) => action.value && action.icon);
  }
  function getRows(listNode, rowSelector) {
    return [...listNode?.querySelectorAll?.(rowSelector) ?? []].filter(
      (node) => node instanceof HTMLElement
    );
  }
  function getVisibleRows(listNode, rowSelector) {
    return getRows(listNode, rowSelector).filter((rowNode) => !rowNode.hidden);
  }
  function getRowKey(rowNode, keyAttributes) {
    for (const attributeName of keyAttributes) {
      const value = rowNode?.getAttribute?.(attributeName);
      if (String(value ?? "").trim() !== "") {
        return value;
      }
    }
    return "";
  }
  function buildReorderDragHandleMarkup({ title = "", iconSize = 16 } = {}) {
    return `<span class="hwhx-reorder-row__drag-handle"${title ? ` title="${escapeHtml$1(title)}"` : ""}>${renderIcon("grip-vertical", { size: iconSize })}</span>`;
  }
  function buildReorderActionsMarkup({
    actionAttribute = "data-hwhx-reorder-action",
    actions = DEFAULT_ACTIONS,
    actionTitles = {},
    size = "",
    variant = "",
    tone = ""
  } = {}) {
    const extraClassName = [
      size ? `hwhx-reorder-button--${escapeHtml$1(size)}` : "",
      variant ? `hwhx-reorder-button--${escapeHtml$1(variant)}` : ""
    ].filter(Boolean).join(" ");
    return `<span class="hwhx-reorder-row__actions">${normalizeActions(actions).map((action) => {
      const title = getActionTitle(action, actionTitles);
      return `<button type="button" class="${["hwhx-reorder-button", extraClassName].filter(Boolean).join(" ")}"${buildHtmlAttributeMarkup(
        {
          [actionAttribute]: action.value,
          title,
          "aria-label": title,
          "data-hwhx-native-title": title,
          "data-tone": tone || void 0
        }
      )}>${renderIcon(action.icon, { size: 15 })}</button>`;
    }).join("")}</span>`;
  }
  function buildReorderRowMarkup({
    index,
    mainHtml,
    className = "",
    rowAttributes = {},
    keyAttributes = {},
    mainAttributes = {},
    draggable = false,
    disabled = false,
    dragTitle = "",
    indexAttribute = "",
    manualIndex = false,
    indexInputAttribute = "data-hwhx-reorder-index-input",
    indexTitle = getDefaultText().index,
    searchText = "",
    groupKey = "",
    actionsHtml = "",
    extraHtml = ""
  } = {}) {
    const rowClassName = [
      "hwhx-reorder-row",
      manualIndex ? "hwhx-reorder-row--manual-index" : "",
      className,
      disabled ? "is-disabled" : ""
    ].filter(Boolean).join(" ");
    const indexAttributes = indexAttribute ? { [indexAttribute]: "1" } : {};
    return [
      `<div${buildHtmlAttributeMarkup({
        class: rowClassName,
        draggable: draggable ? "true" : void 0,
        ...rowAttributes,
        ...keyAttributes,
        "data-hwhx-search-text": searchText || void 0,
        "data-hwhx-reorder-group-key": groupKey || void 0
      })}>`,
      buildReorderDragHandleMarkup({ title: dragTitle }),
      manualIndex ? `<span class="hwhx-reorder-row__index hwhx-reorder-row__index--manual"${buildHtmlAttributeMarkup(indexAttributes)}><input class="hwhx-reorder-row__index-input" type="number" min="1" step="1" inputmode="numeric" value="${escapeHtml$1(String(Number(index) + 1))}"${buildHtmlAttributeMarkup({ [indexInputAttribute]: "1", title: indexTitle, "aria-label": indexTitle, "data-hwhx-native-title": indexTitle, draggable: "false" })}></span>` : `<span class="hwhx-reorder-row__index"${buildHtmlAttributeMarkup(indexAttributes)}>${escapeHtml$1(String(Number(index) + 1))}</span>`,
      `<span${buildHtmlAttributeMarkup({
        class: "hwhx-reorder-row__main",
        ...mainAttributes
      })}>${mainHtml ?? ""}</span>`,
      actionsHtml,
      extraHtml,
      "</div>"
    ].join("");
  }
  function buildReorderListMarkup({
    rows = [],
    groups = [],
    listAttributes = {},
    className = "",
    searchable = false,
    searchPlaceholder = getDefaultText().search,
    virtualLimit = 0,
    emptyLabel = "No items",
    groupAccordions = false
  } = {}) {
    const rowMarkup = (Array.isArray(rows) ? rows : []).join("");
    const groupMarkup = (Array.isArray(groups) ? groups : []).map((group) => {
      const content = Array.isArray(group?.rows) ? group.rows.join("") : "";
      const label = String(group?.label ?? "");
      const icon = String(group?.icon ?? "");
      const groupKey = String(group?.key ?? label);
      const header = `${icon ? renderIcon(icon, { size: 14 }) : ""}<span>${escapeHtml$1(label)}</span>`;
      return groupAccordions ? `<details class="hwhx-reorder-group" data-hwhx-reorder-group="1" data-hwhx-reorder-group-key="${escapeHtml$1(groupKey)}"${group?.collapsed ? "" : " open"}><summary class="hwhx-reorder-group__title">${header}</summary>${content}</details>` : `<div class="hwhx-reorder-group" data-hwhx-reorder-group="1" data-hwhx-reorder-group-key="${escapeHtml$1(groupKey)}"><div class="hwhx-reorder-group__title">${header}</div>${content}</div>`;
    }).join("");
    const bodyMarkup = groupMarkup || rowMarkup || `<div class="hwhx-muted">${escapeHtml$1(emptyLabel)}</div>`;
    return `<div class="${["hwhx-reorder-shell", className].filter(Boolean).join(" ")}"${buildHtmlAttributeMarkup(
      {
        "data-hwhx-reorder-shell": "1",
        "data-hwhx-reorder-virtual-limit": Number(virtualLimit) > 0 ? Math.floor(Number(virtualLimit)) : void 0
      }
    )}>${searchable ? `<div class="hwhx-reorder-toolbar"><input class="hwhx-field hwhx-reorder-search" type="search" placeholder="${escapeHtml$1(searchPlaceholder)}" data-hwhx-reorder-search="1" data-hwhx-clearable="false"></div>` : ""}<div class="hwhx-reorder-list"${buildHtmlAttributeMarkup(
      {
        "data-hwhx-reorder-list": "1",
        ...listAttributes
      }
    )}>${bodyMarkup}</div></div>`;
  }
  function syncReorderListControls(rootNode, {
    rowSelector = "[data-hwhx-reorder-item]",
    actionSelector = "[data-hwhx-reorder-action]",
    actionAttribute = "data-hwhx-reorder-action",
    indexSelector = ".hwhx-reorder-row__index"
  } = {}) {
    const rows = getRows(rootNode, rowSelector);
    rows.forEach((rowNode, index) => {
      const indexNode = rowNode.querySelector(indexSelector);
      if (indexNode instanceof HTMLElement) {
        const inputNode = indexNode.querySelector("[data-hwhx-reorder-index-input]");
        if (inputNode instanceof HTMLInputElement) {
          inputNode.value = String(index + 1);
        } else {
          indexNode.textContent = String(index + 1);
        }
      }
      rowNode.querySelectorAll(actionSelector).forEach((buttonNode) => {
        if (!(buttonNode instanceof HTMLButtonElement)) {
          return;
        }
        const action = String(buttonNode.getAttribute(actionAttribute) ?? "");
        buttonNode.disabled = index === 0 && (action === "top" || action === "up") || index === rows.length - 1 && (action === "down" || action === "bottom");
      });
    });
  }
  function applyReorderSearch(listNode, { rowSelector, groupSelector }) {
    const shellNode = listNode.closest("[data-hwhx-reorder-shell]");
    const searchNode = shellNode?.querySelector?.("[data-hwhx-reorder-search]");
    const query = String(searchNode instanceof HTMLInputElement ? searchNode.value : "").trim().toLocaleLowerCase("ru-RU");
    getRows(listNode, rowSelector).forEach((rowNode) => {
      const haystack = String(
        rowNode.dataset.hwhxSearchText ?? rowNode.textContent ?? ""
      ).toLocaleLowerCase("ru-RU");
      rowNode.hidden = query !== "" && !haystack.includes(query);
    });
    [...listNode.querySelectorAll(groupSelector)].forEach((groupNode) => {
      if (!(groupNode instanceof HTMLElement)) {
        return;
      }
      groupNode.hidden = !getRows(groupNode, rowSelector).some(
        (rowNode) => !rowNode.hidden
      );
    });
  }
  function applyReorderVirtualization(listNode, { rowSelector }) {
    const shellNode = listNode.closest("[data-hwhx-reorder-shell]");
    const limit = Number(shellNode?.dataset.hwhxReorderVirtualLimit);
    if (!Number.isFinite(limit) || limit <= 0) {
      return;
    }
    getVisibleRows(listNode, rowSelector).forEach((rowNode, index) => {
      rowNode.classList.toggle("is-virtual-hidden", index >= limit);
      rowNode.style.display = index >= limit ? "none" : "";
    });
  }
  function moveRowToManualIndex(rowNode, nextIndex, { listSelector, rowSelector }) {
    const listNode = rowNode?.closest?.(listSelector) ?? rowNode?.parentElement;
    if (!(rowNode instanceof HTMLElement) || !(listNode instanceof HTMLElement)) {
      return;
    }
    const rows = getRows(listNode, rowSelector);
    const targetIndex = Math.max(0, Math.min(rows.length - 1, Math.floor(nextIndex) - 1));
    const targetRow = rows[targetIndex];
    if (!(targetRow instanceof HTMLElement) || targetRow === rowNode) {
      return;
    }
    if (rows.indexOf(rowNode) < targetIndex) {
      targetRow.after(rowNode);
      return;
    }
    targetRow.before(rowNode);
  }
  function readReorderListValues(listNode, {
    rowSelector = "[data-hwhx-reorder-item]",
    keyAttributes = ["data-hwhx-order-key", "data-value"]
  } = {}) {
    return getRows(listNode, rowSelector).map((rowNode) => getRowKey(rowNode, keyAttributes)).filter((value) => String(value ?? "").trim() !== "");
  }
  function moveReorderRow(rowNode, action, {
    listSelector = "[data-hwhx-reorder-list]",
    rowSelector = "[data-hwhx-reorder-item]",
    actionSelector = "[data-hwhx-reorder-action]",
    actionAttribute = "data-hwhx-reorder-action",
    indexSelector = ".hwhx-reorder-row__index",
    keyAttributes = ["data-hwhx-order-key", "data-value"]
  } = {}) {
    const listNode = rowNode?.closest?.(listSelector) ?? rowNode?.parentElement;
    if (!(rowNode instanceof HTMLElement) || !(listNode instanceof HTMLElement)) {
      return void 0;
    }
    const rows = getRows(listNode, rowSelector);
    const currentIndex = rows.indexOf(rowNode);
    if (currentIndex < 0) {
      return void 0;
    }
    if (action === "top") {
      listNode.insertBefore(rowNode, rows[0]);
    } else if (action === "up" && currentIndex > 0) {
      listNode.insertBefore(rowNode, rows[currentIndex - 1]);
    } else if (action === "down" && currentIndex < rows.length - 1) {
      listNode.insertBefore(rows[currentIndex + 1], rowNode);
    } else if (action === "bottom") {
      listNode.appendChild(rowNode);
    }
    syncReorderListControls(listNode, {
      rowSelector,
      actionSelector,
      actionAttribute,
      indexSelector
    });
    return readReorderListValues(listNode, { rowSelector, keyAttributes });
  }
  function bindReorderList(rootNode, {
    listSelector = "[data-hwhx-reorder-list]",
    rowSelector = "[data-hwhx-reorder-item]",
    actionSelector = "[data-hwhx-reorder-action]",
    actionAttribute = "data-hwhx-reorder-action",
    indexSelector = ".hwhx-reorder-row__index",
    keyAttributes = ["data-hwhx-order-key", "data-value"],
    onChange = void 0,
    draggable = false,
    manualIndex = false,
    groupSelector = "[data-hwhx-reorder-group]",
    searchSelector = "[data-hwhx-reorder-search]",
    boundDataKey = "hwhxReorderBound"
  } = {}) {
    const listNodes = [...rootNode?.querySelectorAll?.(listSelector) ?? []].filter(
      (node) => node instanceof HTMLElement
    );
    listNodes.forEach((listNode) => {
      if (listNode.dataset[boundDataKey] === "1") {
        syncReorderListControls(listNode, {
          rowSelector,
          actionSelector,
          actionAttribute,
          indexSelector
        });
        applyReorderVirtualization(listNode, { rowSelector });
        return;
      }
      listNode.dataset[boundDataKey] = "1";
      let draggedRow = null;
      const commitChange = () => {
        onChange?.(readReorderListValues(listNode, { rowSelector, keyAttributes }));
      };
      const commitManualIndexChange = (event) => {
        if (!manualIndex) {
          return;
        }
        const indexInput = event.target instanceof Element ? event.target.closest("[data-hwhx-reorder-index-input]") : null;
        const rowNode = indexInput?.closest?.(rowSelector);
        if (!(indexInput instanceof HTMLInputElement) || !(rowNode instanceof HTMLElement)) {
          return;
        }
        const rawValue = String(indexInput.value ?? "").trim();
        const nextIndex = Number(rawValue);
        if (!rawValue || !Number.isFinite(nextIndex)) {
          syncReorderListControls(listNode, {
            rowSelector,
            actionSelector,
            actionAttribute,
            indexSelector
          });
          return;
        }
        moveRowToManualIndex(rowNode, nextIndex, {
          listSelector,
          rowSelector
        });
        syncReorderListControls(listNode, {
          rowSelector,
          actionSelector,
          actionAttribute,
          indexSelector
        });
        applyReorderVirtualization(listNode, { rowSelector });
        onChange?.(readReorderListValues(listNode, { rowSelector, keyAttributes }));
      };
      listNode.addEventListener("click", (event) => {
        const buttonNode = event.target instanceof Element ? event.target.closest(actionSelector) : null;
        if (!(buttonNode instanceof HTMLElement)) {
          return;
        }
        event.preventDefault();
        const nextOrder = moveReorderRow(
          buttonNode.closest(rowSelector),
          buttonNode.getAttribute(actionAttribute),
          {
            listSelector,
            rowSelector,
            actionSelector,
            actionAttribute,
            indexSelector,
            keyAttributes
          }
        );
        if (nextOrder) {
          applyReorderVirtualization(listNode, { rowSelector });
          onChange?.(nextOrder);
        }
      });
      const inputRoot = listNode.closest("[data-hwhx-reorder-shell]") ?? listNode;
      inputRoot.addEventListener("input", (event) => {
        const searchNode = event.target instanceof Element ? event.target.closest(searchSelector) : null;
        if (searchNode instanceof HTMLInputElement) {
          applyReorderSearch(listNode, { rowSelector, groupSelector });
          applyReorderVirtualization(listNode, { rowSelector });
          return;
        }
      });
      inputRoot.addEventListener("change", commitManualIndexChange);
      inputRoot.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
          return;
        }
        const indexInput = event.target instanceof Element ? event.target.closest("[data-hwhx-reorder-index-input]") : null;
        if (indexInput instanceof HTMLInputElement) {
          event.preventDefault();
          commitManualIndexChange(event);
        }
      });
      if (draggable) {
        listNode.addEventListener("dragstart", (event) => {
          const indexInput = event.target instanceof Element ? event.target.closest("[data-hwhx-reorder-index-input]") : null;
          if (indexInput instanceof HTMLInputElement) {
            event.preventDefault();
            return;
          }
          const rowNode = event.target instanceof Element ? event.target.closest(rowSelector) : null;
          if (!(rowNode instanceof HTMLElement)) {
            return;
          }
          draggedRow = rowNode;
          rowNode.classList.add("is-dragging");
          event.dataTransfer?.setData("text/plain", getRowKey(rowNode, keyAttributes));
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
          }
        });
        listNode.addEventListener("dragover", (event) => {
          if (!(draggedRow instanceof HTMLElement)) {
            return;
          }
          const targetRow = event.target instanceof Element ? event.target.closest(rowSelector) : null;
          if (!(targetRow instanceof HTMLElement) || targetRow === draggedRow || !listNode.contains(targetRow)) {
            return;
          }
          event.preventDefault();
          const targetRect = targetRow.getBoundingClientRect();
          const insertAfter = event.clientY > targetRect.top + targetRect.height / 2;
          listNode.insertBefore(
            draggedRow,
            insertAfter ? targetRow.nextSibling : targetRow
          );
          syncReorderListControls(listNode, {
            rowSelector,
            actionSelector,
            actionAttribute,
            indexSelector
          });
          commitChange();
        });
        listNode.addEventListener("drop", (event) => {
          if (draggedRow instanceof HTMLElement) {
            event.preventDefault();
          }
          draggedRow?.classList?.remove("is-dragging");
          draggedRow = null;
          syncReorderListControls(listNode, {
            rowSelector,
            actionSelector,
            actionAttribute,
            indexSelector
          });
          commitChange();
        });
        listNode.addEventListener("dragend", () => {
          draggedRow?.classList?.remove("is-dragging");
          draggedRow = null;
          syncReorderListControls(listNode, {
            rowSelector,
            actionSelector,
            actionAttribute,
            indexSelector
          });
          commitChange();
        });
      }
      syncReorderListControls(listNode, {
        rowSelector,
        actionSelector,
        actionAttribute,
        indexSelector
      });
      applyReorderVirtualization(listNode, { rowSelector });
      commitChange();
    });
  }
  class VersionedStorage {
    constructor({
      keyPrefix,
      schemaVersion,
      migrations = {},
      storage = globalThis.localStorage
    }) {
      __privateAdd(this, _VersionedStorage_instances);
      this.keyPrefix = keyPrefix;
      this.schemaVersion = schemaVersion;
      this.migrations = migrations;
      this.storage = storage;
    }
    key(userId) {
      return `${this.keyPrefix}${userId}`;
    }
    read(userId, fallbackValue = void 0) {
      const rawValue = this.storage.getItem(this.key(userId));
      if (!rawValue) {
        return fallbackValue;
      }
      let parsedValue;
      try {
        parsedValue = JSON.parse(rawValue);
      } catch {
        return fallbackValue;
      }
      return __privateMethod(this, _VersionedStorage_instances, migrate_fn).call(this, parsedValue);
    }
    write(userId, value) {
      const envelope = {
        schemaVersion: this.schemaVersion,
        value
      };
      this.storage.setItem(this.key(userId), JSON.stringify(envelope));
    }
    remove(userId) {
      this.storage.removeItem(this.key(userId));
    }
  }
  _VersionedStorage_instances = new WeakSet();
  unwrapValue_fn = function(value) {
    let currentValue = value;
    for (let index = 0; index < 8; index += 1) {
      if (!currentValue || typeof currentValue !== "object" || !Object.prototype.hasOwnProperty.call(currentValue, "value")) {
        break;
      }
      currentValue = currentValue.value;
    }
    return currentValue;
  };
  migrate_fn = function(rawValue) {
    let currentVersion = Number(rawValue?.schemaVersion) || 1;
    let currentValue = __privateMethod(this, _VersionedStorage_instances, unwrapValue_fn).call(this, rawValue);
    while (currentVersion < this.schemaVersion) {
      const migration = this.migrations[currentVersion];
      if (typeof migration !== "function") {
        break;
      }
      currentValue = __privateMethod(this, _VersionedStorage_instances, unwrapValue_fn).call(this, migration(currentValue));
      currentVersion += 1;
    }
    return __privateMethod(this, _VersionedStorage_instances, unwrapValue_fn).call(this, currentValue);
  };
  const FILTER_ACTIVE = "active";
  const FILTER_INACTIVE = "inactive";
  const FILTER_MODES = /* @__PURE__ */ new Set([FILTER_ACTIVE, FILTER_INACTIVE]);
  const FILTER_OPTION_ATTRIBUTE = "data-hwhx-accordion-filter-option";
  const FILTER_ACTIVE_ATTRIBUTE = "data-hwhx-accordion-filter-active";
  const FILTER_MODE_ATTRIBUTE = "data-hwhx-accordion-filter-mode";
  const FILTER_BOUND_ATTRIBUTE = "data-hwhx-accordion-filter-bound";
  const FILTER_HIDDEN_ATTRIBUTE = "data-hwhx-accordion-filter-hidden";
  const FILTER_EMPTY_ATTRIBUTE = "data-hwhx-accordion-filter-empty";
  const FILTER_EMPTY_VISIBLE_ATTRIBUTE = "data-hwhx-accordion-filter-empty-visible";
  const FILTER_OPTION_SELECTOR = `[${FILTER_OPTION_ATTRIBUTE}]`;
  const FILTER_EMPTY_SELECTOR = `[${FILTER_EMPTY_ATTRIBUTE}="1"]`;
  const DEFAULT_ACCORDION_SELECTOR = "details[data-hwhx-accordion-key], details[data-hwhauto-accordion-key]";
  const DEFAULT_ROW_SELECTOR = "label.hwhx-native-checkbox-row, label.hwhx-checkbox-row, [data-hwhx-accordion-filter-row]";
  const DEFAULT_SEARCH_HIDDEN_ATTRIBUTES = [
    "data-hwhx-search-hidden",
    "data-hwhauto-search-hidden"
  ];
  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function defaultFormatNumber(value) {
    return String(Math.max(0, Number(value) || 0));
  }
  function normalizeFilterMode(value) {
    const normalizedValue = String(value ?? "").trim();
    return FILTER_MODES.has(normalizedValue) ? normalizedValue : "";
  }
  function normalizeFilterState(state) {
    if (!state || typeof state !== "object") {
      return {};
    }
    return Object.fromEntries(
      Object.entries(state).map(([accordionKey, filterMode]) => [
        String(accordionKey ?? "").trim(),
        normalizeFilterMode(filterMode)
      ]).filter(([accordionKey, filterMode]) => accordionKey !== "" && filterMode !== "")
    );
  }
  function getSummaryNode(accordionNode) {
    if (!(accordionNode instanceof HTMLDetailsElement)) {
      return null;
    }
    return [...accordionNode.children].find(
      (node) => node instanceof HTMLElement && node.tagName === "SUMMARY"
    ) ?? null;
  }
  function getBodyNode(accordionNode) {
    if (!(accordionNode instanceof HTMLDetailsElement)) {
      return null;
    }
    return [...accordionNode.children].find(
      (node) => node instanceof HTMLElement && node.classList.contains("hwhx-accordion__body")
    ) ?? [...accordionNode.children].find(
      (node) => node instanceof HTMLElement && node.tagName !== "SUMMARY"
    ) ?? accordionNode;
  }
  function getDefaultAccordionKey(accordionNode) {
    return String(
      accordionNode?.dataset?.hwhxAccordionKey ?? accordionNode?.dataset?.hwhautoAccordionKey ?? accordionNode?.getAttribute?.("data-hwhx-accordion-key") ?? accordionNode?.getAttribute?.("data-hwhauto-accordion-key") ?? ""
    ).trim();
  }
  function getDefaultScopeNode(accordionNode) {
    return accordionNode.closest("[data-hwhx-popup-body]") ?? accordionNode.closest("[data-hwhauto-popup-body]") ?? accordionNode.closest(".hwhx-modal") ?? document;
  }
  function defaultRowActiveGetter(rowNode) {
    if (!(rowNode instanceof HTMLElement)) {
      return false;
    }
    const checkboxNode = rowNode.querySelector('input[type="checkbox"]');
    if (checkboxNode instanceof HTMLInputElement) {
      return checkboxNode.checked;
    }
    return rowNode.dataset.checked === "true";
  }
  function resolveLabelTemplate(label, count, mode, formattedCount) {
    if (typeof label === "function") {
      return label(count, mode, formattedCount);
    }
    return String(label ?? "").replaceAll("{count}", formattedCount);
  }
  function createAccordionFilterController({
    storageKeyPrefix = "",
    schemaVersion = 1,
    migrations = {},
    storage = globalThis.localStorage,
    storageController = void 0,
    getUserId = async () => "",
    accordionSelector = DEFAULT_ACCORDION_SELECTOR,
    rowSelector = DEFAULT_ROW_SELECTOR,
    refreshInputSelector = 'input[type="checkbox"]',
    searchHiddenAttributes = DEFAULT_SEARCH_HIDDEN_ATTRIBUTES,
    formatNumber: formatNumber2 = defaultFormatNumber,
    labels = {},
    getAccordionKey = getDefaultAccordionKey,
    getScopeNode = getDefaultScopeNode,
    isRowActive = defaultRowActiveGetter,
    onAfterSync = void 0
  } = {}) {
    const filterStorage = storageController ?? (storageKeyPrefix ? new VersionedStorage({
      keyPrefix: storageKeyPrefix,
      schemaVersion,
      migrations,
      storage
    }) : null);
    let loadedUserId = "";
    let filterState = void 0;
    function getStateMap() {
      filterState ?? (filterState = {});
      return filterState;
    }
    function getFilterMode(accordionKey) {
      const normalizedKey = String(accordionKey ?? "").trim();
      if (!normalizedKey) {
        return "";
      }
      return normalizeFilterMode(getStateMap()[normalizedKey]);
    }
    function getBadgeTitle(filterMode, count) {
      const normalizedCount = Math.max(0, Number(count) || 0);
      const formattedCount = formatNumber2(normalizedCount);
      const label = filterMode === FILTER_ACTIVE ? labels.active : labels.inactive;
      return resolveLabelTemplate(
        label ?? (filterMode === FILTER_ACTIVE ? "Active: {count}" : "Inactive: {count}"),
        normalizedCount,
        filterMode,
        formattedCount
      );
    }
    function getEmptyText() {
      return resolveLabelTemplate(labels.empty ?? "No entries", 0, "empty", "0");
    }
    function getBadgeClassName(filterMode, isActiveFilter = false) {
      return [
        "hwhx-badge",
        "hwhx-badge--filter",
        filterMode === FILTER_INACTIVE ? "hwhx-badge--filter-inactive" : "hwhx-badge--filter-active",
        isActiveFilter ? "is-active" : ""
      ].filter(Boolean).join(" ");
    }
    function setAccordionFilterModeAttribute(accordionNode, filterMode) {
      const normalizedFilterMode = normalizeFilterMode(filterMode);
      if (normalizedFilterMode) {
        accordionNode.setAttribute(FILTER_MODE_ATTRIBUTE, normalizedFilterMode);
      } else {
        accordionNode.removeAttribute(FILTER_MODE_ATTRIBUTE);
      }
    }
    function getAccordionFilterModeAttribute(accordionNode) {
      return normalizeFilterMode(accordionNode.getAttribute(FILTER_MODE_ATTRIBUTE));
    }
    function persistFilterMode(accordionKey, filterMode) {
      const normalizedKey = String(accordionKey ?? "").trim();
      if (!normalizedKey) {
        return;
      }
      const normalizedFilterMode = normalizeFilterMode(filterMode);
      const nextState = { ...getStateMap() };
      if (normalizedFilterMode) {
        nextState[normalizedKey] = normalizedFilterMode;
      } else {
        delete nextState[normalizedKey];
      }
      filterState = normalizeFilterState(nextState);
      if (filterStorage && loadedUserId !== "") {
        filterStorage.write(loadedUserId, filterState);
      }
    }
    function getRowNodes(accordionNode) {
      if (!(accordionNode instanceof HTMLElement)) {
        return [];
      }
      return [...accordionNode.querySelectorAll(rowSelector)].filter(
        (rowNode) => rowNode instanceof HTMLElement
      );
    }
    function getCounts(accordionNode) {
      const rowNodes = getRowNodes(accordionNode);
      const activeCount = rowNodes.filter((rowNode) => isRowActive(rowNode)).length;
      return {
        total: rowNodes.length,
        checked: activeCount,
        unchecked: Math.max(0, rowNodes.length - activeCount)
      };
    }
    function applyBadgeNode(badgeNode, filterMode, count, activeFilterMode = "") {
      if (!(badgeNode instanceof HTMLElement)) {
        return;
      }
      const normalizedFilterMode = normalizeFilterMode(filterMode);
      if (!normalizedFilterMode) {
        return;
      }
      const normalizedCount = Math.max(0, Number(count) || 0);
      const isActiveFilter = normalizeFilterMode(activeFilterMode) === normalizedFilterMode;
      const title = getBadgeTitle(normalizedFilterMode, normalizedCount);
      badgeNode.className = getBadgeClassName(normalizedFilterMode, isActiveFilter);
      badgeNode.setAttribute(FILTER_OPTION_ATTRIBUTE, normalizedFilterMode);
      badgeNode.setAttribute(FILTER_ACTIVE_ATTRIBUTE, isActiveFilter ? "1" : "0");
      badgeNode.setAttribute("role", "button");
      badgeNode.setAttribute("tabindex", "0");
      badgeNode.setAttribute("aria-pressed", isActiveFilter ? "true" : "false");
      badgeNode.setAttribute("aria-label", title);
      applyTooltipAttributes(badgeNode, title);
      badgeNode.textContent = formatNumber2(normalizedCount);
    }
    function buildBadgeMarkup(filterMode, count, activeFilterMode = "") {
      const normalizedFilterMode = normalizeFilterMode(filterMode);
      if (!normalizedFilterMode) {
        return "";
      }
      const normalizedCount = Math.max(0, Number(count) || 0);
      const isActiveFilter = normalizeFilterMode(activeFilterMode) === normalizedFilterMode;
      const title = getBadgeTitle(normalizedFilterMode, normalizedCount);
      return `<span class="${escapeHtml(getBadgeClassName(normalizedFilterMode, isActiveFilter))}" role="button" tabindex="0" ${FILTER_OPTION_ATTRIBUTE}="${escapeHtml(normalizedFilterMode)}" ${FILTER_ACTIVE_ATTRIBUTE}="${isActiveFilter ? "1" : "0"}" aria-pressed="${isActiveFilter ? "true" : "false"}"${buildTooltipAttributeMarkup(title)} aria-label="${escapeHtml(title)}">${escapeHtml(formatNumber2(normalizedCount))}</span>`;
    }
    function createBadgeNode(filterMode, count, accordionKeyOrFilterMode = "") {
      const activeFilterMode = FILTER_MODES.has(accordionKeyOrFilterMode) ? accordionKeyOrFilterMode : getFilterMode(accordionKeyOrFilterMode);
      const badgeNode = document.createElement("span");
      applyBadgeNode(badgeNode, filterMode, count, activeFilterMode);
      return badgeNode;
    }
    function buildBadgesMarkup(counts, accordionKeyOrFilterMode = "") {
      const totalCount = Math.max(0, Number(counts?.total) || 0);
      const activeCount = Math.max(0, Math.min(totalCount, Number(counts?.checked) || 0));
      const inactiveCount = Math.max(0, totalCount - activeCount);
      const activeFilterMode = FILTER_MODES.has(accordionKeyOrFilterMode) ? accordionKeyOrFilterMode : getFilterMode(accordionKeyOrFilterMode);
      return [
        buildBadgeMarkup(FILTER_ACTIVE, activeCount, activeFilterMode),
        buildBadgeMarkup(FILTER_INACTIVE, inactiveCount, activeFilterMode)
      ].join("");
    }
    function updateBadges(accordionNode) {
      if (!(accordionNode instanceof HTMLDetailsElement)) {
        return;
      }
      const summaryNode = getSummaryNode(accordionNode);
      if (!(summaryNode instanceof HTMLElement)) {
        return;
      }
      const activeFilterMode = getAccordionFilterModeAttribute(accordionNode);
      const counts = getCounts(accordionNode);
      [...summaryNode.querySelectorAll(FILTER_OPTION_SELECTOR)].forEach((badgeNode) => {
        if (!(badgeNode instanceof HTMLElement)) {
          return;
        }
        const filterMode = normalizeFilterMode(
          badgeNode.getAttribute(FILTER_OPTION_ATTRIBUTE)
        );
        if (!filterMode) {
          return;
        }
        applyBadgeNode(
          badgeNode,
          filterMode,
          filterMode === FILTER_ACTIVE ? counts.checked : counts.unchecked,
          activeFilterMode
        );
      });
    }
    function getFilterModesForRow(rowNode) {
      const modes = [];
      let currentNode = rowNode instanceof HTMLElement ? rowNode.parentElement : null;
      while (currentNode instanceof HTMLElement) {
        if (currentNode instanceof HTMLDetailsElement) {
          const filterMode = getAccordionFilterModeAttribute(currentNode);
          if (filterMode) {
            modes.push(filterMode);
          }
        }
        currentNode = currentNode.parentElement;
      }
      return modes;
    }
    function isRowHiddenByFilter(rowNode) {
      const active = isRowActive(rowNode);
      return getFilterModesForRow(rowNode).some(
        (filterMode) => filterMode === FILTER_ACTIVE ? !active : active
      );
    }
    function isRowVisible(rowNode) {
      return rowNode instanceof HTMLElement && !rowNode.hidden && rowNode.style.display !== "none" && searchHiddenAttributes.every(
        (attributeName) => rowNode.getAttribute(attributeName) !== "1"
      ) && rowNode.getAttribute(FILTER_HIDDEN_ATTRIBUTE) !== "1" && rowNode.getAttribute("data-hwhauto-checkbox-filter-hidden") !== "1";
    }
    function syncRows(rootNode = document) {
      const scopeNode = rootNode instanceof Document || rootNode instanceof Element ? rootNode : document;
      [...scopeNode.querySelectorAll(rowSelector)].filter((rowNode) => rowNode instanceof HTMLElement).forEach((rowNode) => {
        if (isRowHiddenByFilter(rowNode)) {
          rowNode.setAttribute(FILTER_HIDDEN_ATTRIBUTE, "1");
        } else {
          rowNode.removeAttribute(FILTER_HIDDEN_ATTRIBUTE);
          rowNode.removeAttribute("data-hwhauto-checkbox-filter-hidden");
        }
      });
    }
    function syncEmptyState(accordionNode) {
      if (!(accordionNode instanceof HTMLDetailsElement)) {
        return;
      }
      const bodyNode = getBodyNode(accordionNode);
      if (!(bodyNode instanceof HTMLElement)) {
        return;
      }
      const hasOwnActiveFilter = getAccordionFilterModeAttribute(accordionNode) !== "";
      const rowNodes = getRowNodes(accordionNode);
      const shouldShow = hasOwnActiveFilter && rowNodes.length > 0 && !rowNodes.some((rowNode) => isRowVisible(rowNode));
      const existingEmptyNode = [...bodyNode.children].find(
        (node) => node instanceof HTMLElement && node.getAttribute(FILTER_EMPTY_ATTRIBUTE) === "1"
      );
      if (!shouldShow) {
        existingEmptyNode?.remove();
        accordionNode.removeAttribute(FILTER_EMPTY_VISIBLE_ATTRIBUTE);
        return;
      }
      const emptyNode = existingEmptyNode instanceof HTMLElement ? existingEmptyNode : document.createElement("div");
      emptyNode.className = "hwhx-accordion-filter-empty";
      emptyNode.setAttribute(FILTER_EMPTY_ATTRIBUTE, "1");
      emptyNode.textContent = getEmptyText();
      if (!existingEmptyNode) {
        bodyNode.appendChild(emptyNode);
      }
      accordionNode.setAttribute(FILTER_EMPTY_VISIBLE_ATTRIBUTE, "1");
    }
    function syncEmptyStates(rootNode = document, accordionNodes = void 0) {
      const scopeNode = rootNode instanceof Document || rootNode instanceof Element ? rootNode : document;
      const nodes = accordionNodes ?? [...scopeNode.querySelectorAll(accordionSelector)].filter(
        (node) => node instanceof HTMLDetailsElement
      );
      nodes.forEach((accordionNode) => syncEmptyState(accordionNode));
    }
    function isAccordionVisible(accordionNode) {
      return accordionNode instanceof HTMLElement && (getRowNodes(accordionNode).some((rowNode) => isRowVisible(rowNode)) || accordionNode.getAttribute(FILTER_EMPTY_VISIBLE_ATTRIBUTE) === "1" || accordionNode.querySelector(FILTER_EMPTY_SELECTOR) instanceof HTMLElement);
    }
    function runAfterSync(rootNode) {
      onAfterSync?.({
        rootNode,
        controller: api,
        isRowVisible,
        isAccordionVisible
      });
    }
    function setFilterMode(accordionNode, filterMode, shouldPersist = true) {
      if (!(accordionNode instanceof HTMLDetailsElement)) {
        return;
      }
      const normalizedFilterMode = normalizeFilterMode(filterMode);
      setAccordionFilterModeAttribute(accordionNode, normalizedFilterMode);
      if (shouldPersist) {
        persistFilterMode(getAccordionKey(accordionNode), normalizedFilterMode);
      }
      const scopeNode = getScopeNode(accordionNode);
      sync(scopeNode);
    }
    function bindAccordion(accordionNode, rootNode) {
      if (accordionNode.getAttribute(FILTER_BOUND_ATTRIBUTE) === "1") {
        return;
      }
      accordionNode.setAttribute(FILTER_BOUND_ATTRIBUTE, "1");
      const summaryNode = getSummaryNode(accordionNode);
      if (!(summaryNode instanceof HTMLElement)) {
        return;
      }
      [...summaryNode.querySelectorAll(FILTER_OPTION_SELECTOR)].forEach((badgeNode) => {
        if (!(badgeNode instanceof HTMLElement)) {
          return;
        }
        const activateFilter = (event) => {
          event.preventDefault();
          event.stopPropagation();
          const requestedFilterMode = normalizeFilterMode(
            badgeNode.getAttribute(FILTER_OPTION_ATTRIBUTE)
          );
          const currentFilterMode = getAccordionFilterModeAttribute(accordionNode);
          setFilterMode(
            accordionNode,
            currentFilterMode === requestedFilterMode ? "" : requestedFilterMode
          );
        };
        badgeNode.addEventListener("click", activateFilter);
        badgeNode.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            activateFilter(event);
          }
        });
      });
      const refreshFilterState = () => {
        globalThis.setTimeout(() => {
          updateBadges(accordionNode);
          syncRows(rootNode);
          syncEmptyStates(rootNode);
          runAfterSync(rootNode);
        }, 0);
      };
      accordionNode.addEventListener("change", (event) => {
        if (event.target instanceof HTMLElement && event.target.matches(refreshInputSelector)) {
          refreshFilterState();
        }
      });
      accordionNode.addEventListener("input", (event) => {
        if (event.target instanceof HTMLElement && event.target.matches(refreshInputSelector)) {
          refreshFilterState();
        }
      });
    }
    function sync(rootNode = document) {
      const scopeNode = rootNode instanceof Document || rootNode instanceof Element ? rootNode : document;
      const accordionNodes = [...scopeNode.querySelectorAll(accordionSelector)].filter(
        (node) => node instanceof HTMLDetailsElement
      );
      accordionNodes.forEach((accordionNode) => {
        if (getRowNodes(accordionNode).length <= 0) {
          return;
        }
        const summaryNode = getSummaryNode(accordionNode);
        if (!(summaryNode instanceof HTMLElement)) {
          return;
        }
        const filterBadgeNodes = [
          ...summaryNode.querySelectorAll(FILTER_OPTION_SELECTOR)
        ].filter((badgeNode) => badgeNode instanceof HTMLElement);
        if (filterBadgeNodes.length <= 0) {
          setAccordionFilterModeAttribute(accordionNode, "");
          return;
        }
        setAccordionFilterModeAttribute(
          accordionNode,
          getFilterMode(getAccordionKey(accordionNode))
        );
        updateBadges(accordionNode);
        bindAccordion(accordionNode, scopeNode);
      });
      syncRows(scopeNode);
      syncEmptyStates(scopeNode, accordionNodes);
      runAfterSync(scopeNode);
    }
    async function load() {
      loadedUserId = String(await getUserId() ?? "").trim();
      filterState = normalizeFilterState(
        filterStorage && loadedUserId !== "" ? filterStorage.read(loadedUserId, {}) : {}
      );
      return filterState;
    }
    const api = {
      FILTER_ACTIVE,
      FILTER_INACTIVE,
      load,
      sync,
      syncRows,
      syncEmptyStates,
      isRowVisible,
      isAccordionVisible,
      getFilterMode,
      setFilterMode,
      buildBadgesMarkup,
      createBadgeNode,
      updateBadges
    };
    return api;
  }
  function isDomScopeNode(node) {
    return node instanceof Document || node instanceof Element;
  }
  function normalizeAttributeName(value, fallbackValue) {
    const normalizedValue = String(value ?? "").trim();
    return normalizedValue || fallbackValue;
  }
  function normalizeSelector(value, keyAttributeName) {
    const normalizedValue = String(value ?? "").trim();
    return normalizedValue || `details[${keyAttributeName}]`;
  }
  function normalizeAccordionState(state) {
    if (!state || typeof state !== "object") {
      return {};
    }
    return Object.fromEntries(
      Object.entries(state).map(([accordionKey, isOpen]) => [String(accordionKey ?? "").trim(), !!isOpen]).filter(([accordionKey]) => accordionKey !== "")
    );
  }
  function createAccordionStateController({
    storage,
    getUserId,
    runtimeState,
    stateKey = "accordionState",
    loadedKey = "",
    keyAttributeName = "data-hwhx-accordion-key",
    defaultOpenAttributeName = "data-hwhx-accordion-default-open",
    boundAttributeName = "data-hwhx-accordion-bound",
    selector = "",
    retryAttempts = 8,
    retryDelayMs = 25
  } = {}) {
    if (!storage || typeof storage.read !== "function" || typeof storage.write !== "function") {
      throw new Error("[accordion-state] storage with read/write is required.");
    }
    if (typeof getUserId !== "function") {
      throw new Error("[accordion-state] getUserId is required.");
    }
    const stateContainer = runtimeState && typeof runtimeState === "object" ? runtimeState : {};
    const normalizedStateKey = String(stateKey || "accordionState");
    const normalizedLoadedKey = String(loadedKey || "");
    const normalizedKeyAttributeName = normalizeAttributeName(
      keyAttributeName,
      "data-hwhx-accordion-key"
    );
    const normalizedDefaultOpenAttributeName = normalizeAttributeName(
      defaultOpenAttributeName,
      "data-hwhx-accordion-default-open"
    );
    const normalizedBoundAttributeName = normalizeAttributeName(
      boundAttributeName,
      "data-hwhx-accordion-bound"
    );
    const normalizedSelector = normalizeSelector(selector, normalizedKeyAttributeName);
    let loadedUserId = "";
    function isLoaded() {
      if (normalizedLoadedKey) {
        return stateContainer[normalizedLoadedKey] === true;
      }
      return stateContainer[normalizedStateKey] !== void 0;
    }
    function markLoaded() {
      if (normalizedLoadedKey) {
        stateContainer[normalizedLoadedKey] = true;
      }
    }
    async function ensureLoaded() {
      const userIdValue = await getUserId();
      const normalizedUserId = String(userIdValue ?? "");
      if (isLoaded() && loadedUserId === normalizedUserId) {
        return getStateMap();
      }
      stateContainer[normalizedStateKey] = normalizeAccordionState(
        storage.read(userIdValue, {})
      );
      loadedUserId = normalizedUserId;
      markLoaded();
      return stateContainer[normalizedStateKey];
    }
    function getStateMap() {
      stateContainer[normalizedStateKey] ?? (stateContainer[normalizedStateKey] = {});
      return stateContainer[normalizedStateKey];
    }
    function getOpenState(accordionKey, defaultOpen = true) {
      const normalizedKey = String(accordionKey ?? "").trim();
      if (!normalizedKey) {
        return defaultOpen;
      }
      const stateValue = getStateMap()[normalizedKey];
      return typeof stateValue === "boolean" ? stateValue : defaultOpen;
    }
    function buildStateAttributes(accordionKey, defaultOpen = true) {
      const normalizedKey = String(accordionKey ?? "").trim();
      const normalizedDefaultOpen = defaultOpen !== false;
      const keyAttribute = normalizedKey ? ` ${normalizedKeyAttributeName}="${escapeHtml$1(normalizedKey)}"` : "";
      const defaultOpenAttribute = ` ${normalizedDefaultOpenAttributeName}="${normalizedDefaultOpen ? "true" : "false"}"`;
      const openAttribute = getOpenState(normalizedKey, normalizedDefaultOpen) ? " open" : "";
      return `${keyAttribute}${defaultOpenAttribute}${openAttribute}`;
    }
    function persistStateValue(accordionKey, isOpen) {
      const normalizedKey = String(accordionKey ?? "").trim();
      if (!normalizedKey) {
        return;
      }
      const normalizedState = normalizeAccordionState({
        ...getStateMap(),
        [normalizedKey]: !!isOpen
      });
      stateContainer[normalizedStateKey] = normalizedState;
      markLoaded();
      const userIdValue = loadedUserId || String(stateContainer.userId ?? stateContainer.userID ?? "");
      if (userIdValue) {
        storage.write(userIdValue, normalizedState);
      }
    }
    async function bind(rootNode = document) {
      const scopeNode = isDomScopeNode(rootNode) ? rootNode : document;
      await ensureLoaded();
      const accordionNodes = [...scopeNode.querySelectorAll(normalizedSelector)].filter(
        (node) => node instanceof HTMLDetailsElement
      );
      accordionNodes.forEach((accordionNode) => {
        const accordionKey = String(
          accordionNode.getAttribute(normalizedKeyAttributeName) ?? ""
        ).trim();
        const defaultOpen = accordionNode.getAttribute(normalizedDefaultOpenAttributeName) !== "false";
        accordionNode.open = getOpenState(accordionKey, defaultOpen);
        if (accordionNode.getAttribute(normalizedBoundAttributeName) === "1") {
          return;
        }
        accordionNode.setAttribute(normalizedBoundAttributeName, "1");
        accordionNode.addEventListener("toggle", () => {
          persistStateValue(accordionKey, accordionNode.open);
        });
      });
      return { scopeNode, accordionNodes };
    }
    function scheduleSync(rootNode = document, attempt = 0, afterBind = void 0) {
      globalThis.setTimeout(
        async () => {
          const scopeNode = isDomScopeNode(rootNode) ? rootNode : document;
          const accordionNodes = [
            ...scopeNode.querySelectorAll(normalizedSelector)
          ].filter((node) => node instanceof HTMLDetailsElement);
          if (accordionNodes.length <= 0 && attempt < retryAttempts) {
            scheduleSync(rootNode, attempt + 1, afterBind);
            return;
          }
          await bind(scopeNode);
          afterBind?.({ scopeNode, accordionNodes });
        },
        attempt === 0 ? 0 : retryDelayMs
      );
    }
    return {
      ensureLoaded,
      getStateMap,
      getOpenState,
      buildStateAttributes,
      persistStateValue,
      bind,
      scheduleSync
    };
  }
  function buildSettingsExportPayload({
    scriptId,
    scriptName,
    scriptVersion = "",
    exportVersion,
    storageSchemaVersion,
    userId = void 0,
    data,
    extra = {}
  }) {
    return {
      scriptId: String(scriptId ?? ""),
      scriptName: String(scriptName ?? ""),
      scriptVersion: String(scriptVersion ?? ""),
      exportVersion,
      storageSchemaVersion,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...userId === void 0 ? {} : { userId: String(userId) },
      ...extra,
      data
    };
  }
  function buildSettingsExportFileName(userIdValue, suffix) {
    const safeUserId = String(userIdValue ?? "unknown").trim().replaceAll(/[^\w.-]+/g, "_") || "unknown";
    const normalizedSuffix = String(suffix ?? "settings.json").trim().replace(/^\.*/, "");
    return `${safeUserId}.${normalizedSuffix}`;
  }
  function downloadJsonFile(fileName, value) {
    const blob = new globalThis.Blob([`${JSON.stringify(value, null, 2)}
`], {
      type: "application/json;charset=utf-8"
    });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.setTimeout(() => globalThis.URL.revokeObjectURL(url), 0);
  }
  function readFileText(file) {
    if (!file) {
      return Promise.resolve(void 0);
    }
    if (typeof file.text === "function") {
      return file.text();
    }
    return new Promise((resolve, reject) => {
      const reader = new globalThis.FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsText(file);
    });
  }
  function pickJsonFileText() {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      let isFinished = false;
      input.type = "file";
      input.accept = "application/json,.json";
      input.style.display = "none";
      const finish = (value) => {
        if (isFinished) {
          return;
        }
        isFinished = true;
        globalThis.removeEventListener?.("focus", handleFocus);
        input.remove();
        resolve(value);
      };
      const handleFocus = () => {
        globalThis.setTimeout(() => {
          if (!input.files || input.files.length === 0) {
            finish(void 0);
          }
        }, 300);
      };
      input.addEventListener("change", async () => {
        try {
          finish(await readFileText(input.files?.[0]));
        } catch (error) {
          input.remove();
          reject(error);
        }
      });
      document.body.appendChild(input);
      globalThis.addEventListener?.("focus", handleFocus, { once: true });
      try {
        input.click();
      } catch (error) {
        input.remove();
        reject(error);
      }
    });
  }
  function parseJsonText(fileText, errorFactory = void 0) {
    try {
      return JSON.parse(String(fileText ?? ""));
    } catch {
      if (typeof errorFactory === "function") {
        throw errorFactory();
      }
      throw new Error("Invalid JSON.");
    }
  }
  function openExternalUrl(url, { logPrefix = "[HWHShared]" } = {}) {
    const normalizedUrl = String(url ?? "").trim();
    if (!normalizedUrl) {
      return;
    }
    try {
      globalThis.open?.(normalizedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(`${logPrefix} Failed to open external URL:`, error);
      globalThis.location.href = normalizedUrl;
    }
  }
  class SnapshotCache {
    constructor(factory) {
      __privateAdd(this, _factory);
      __privateAdd(this, _value);
      __privateAdd(this, _revision, 0);
      __privateSet(this, _factory, factory);
    }
    invalidate() {
      __privateSet(this, _value, void 0);
      __privateSet(this, _revision, __privateGet(this, _revision) + 1);
    }
    async get(options = {}) {
      const revision = __privateGet(this, _revision);
      if (__privateGet(this, _value)) {
        return __privateGet(this, _value);
      }
      const value = await __privateGet(this, _factory).call(this, options);
      if (revision === __privateGet(this, _revision)) {
        __privateSet(this, _value, value);
      }
      return value;
    }
  }
  _factory = new WeakMap();
  _value = new WeakMap();
  _revision = new WeakMap();
  function createMissionContext(missionsState = {}, options = {}) {
    const itemToMissions = /* @__PURE__ */ new Map();
    const missionDropIndex = {};
    const missionRewardIndex = {};
    const getMissionDropProfile = options.getMissionDropProfile;
    const isMissionAvailable = typeof options.isMissionAvailable === "function" ? options.isMissionAvailable : () => true;
    for (const mission of Object.values(missionsState ?? {})) {
      if (!isMissionAvailable(mission)) {
        continue;
      }
      const rewards = mission?.rewards ?? mission?.reward ?? {};
      for (const [rewardType, rewardItems] of Object.entries(rewards)) {
        for (const itemId of Object.keys(rewardItems ?? {})) {
          const key = `${rewardType}:${itemId}`;
          if (!itemToMissions.has(key)) {
            itemToMissions.set(key, []);
          }
          itemToMissions.get(key).push(mission);
        }
      }
      if (typeof getMissionDropProfile !== "function") {
        continue;
      }
      const missionId = Number(mission?.id);
      if (!Number.isFinite(missionId)) {
        continue;
      }
      getMissionDropProfile(missionId).forEach((profileEntry) => {
        var _a, _b;
        const rewardType = profileEntry?.rewardType;
        const rewardId = Number(profileEntry?.rewardId);
        const expectedYield = Number(profileEntry?.expectedYield) || 0;
        if (!rewardType || !Number.isFinite(rewardId) || expectedYield <= 0) {
          return;
        }
        missionDropIndex[rewardType] ?? (missionDropIndex[rewardType] = {});
        (_a = missionDropIndex[rewardType])[rewardId] ?? (_a[rewardId] = []);
        missionRewardIndex[missionId] ?? (missionRewardIndex[missionId] = {});
        (_b = missionRewardIndex[missionId])[rewardType] ?? (_b[rewardType] = {});
        missionRewardIndex[missionId][rewardType][rewardId] = (Number(missionRewardIndex[missionId][rewardType][rewardId]) || 0) + expectedYield;
        const existingMission = missionDropIndex[rewardType][rewardId].find(
          (entry) => entry.id === missionId
        );
        if (existingMission) {
          existingMission.expectedYield += expectedYield;
          return;
        }
        missionDropIndex[rewardType][rewardId].push({
          id: missionId,
          world: Number(profileEntry?.world) || 0,
          index: Number(profileEntry?.index) || 0,
          cost: Number(profileEntry?.cost) || 0,
          expectedYield
        });
      });
    }
    Object.values(missionDropIndex).forEach((missionGroup) => {
      Object.values(missionGroup).forEach((missions) => {
        missions.sort((left, right) => {
          const leftScore = left.cost > 0 ? left.expectedYield / left.cost : left.expectedYield;
          const rightScore = right.cost > 0 ? right.expectedYield / right.cost : right.expectedYield;
          if (rightScore !== leftScore) {
            return rightScore - leftScore;
          }
          if (right.expectedYield !== left.expectedYield) {
            return right.expectedYield - left.expectedYield;
          }
          if (left.cost !== right.cost) {
            return left.cost - right.cost;
          }
          return right.id - left.id;
        });
      });
    });
    return {
      missionsState,
      itemToMissions,
      missionDropIndex,
      missionRewardIndex,
      getMissionsForItem(itemType, itemId) {
        return itemToMissions.get(`${itemType}:${itemId}`) ?? [];
      },
      getDropIndex() {
        return {
          items: missionDropIndex,
          missions: missionRewardIndex
        };
      }
    };
  }
  function installHwhSharedRuntime({ scriptId, scriptName }) {
    const runtime = {
      scriptId,
      scriptName,
      createProgressController,
      normalizeProgressWindowSettings,
      buildProgressSettingsFields,
      getProgressPositionOptions,
      getProgressStyleOptions,
      getProgressThemeOptions,
      readProgressSettingsFromPopup,
      buildProgressBarMarkup,
      getProgressPercent,
      buildResultAccordionMarkup,
      buildResultRowMarkup,
      buildResultRowsMarkup,
      createNativePopupBridge,
      createAccordionFilterController,
      createAccordionStateController,
      normalizeAccordionState,
      ModalRenderer,
      SearchRegistry,
      VersionedStorage,
      SnapshotCache,
      createMissionContext,
      normalizeSearchText,
      buildCustomSelectMarkup,
      bindCustomSelectControls,
      buildMultiSelectMarkup,
      readMultiSelectValues,
      bindReorderList,
      buildReorderActionsMarkup,
      buildReorderDragHandleMarkup,
      buildReorderListMarkup,
      buildReorderRowMarkup,
      moveReorderRow,
      readReorderListValues,
      syncReorderListControls,
      buildNumberInputMarkup,
      buildTabsMarkup,
      bindSettingsSearchControls,
      buildSettingsSearchMarkup,
      buildIconLabelMarkup,
      buildInlineIconMarkup,
      buildDonatePanelMarkup,
      buildInfoLineMarkup,
      buildSettingsAccordion,
      buildSettingsActionButton,
      buildSettingsActionBarMarkup,
      buildSettingsCheckboxRow,
      buildSettingsField,
      buildSettingsHintMarkup,
      buildSettingsPanel,
      buildSettingsSelectField,
      getScopedElementById,
      readCheckboxInput,
      readNumberInput,
      readSelectInput,
      readTextInput,
      applyTooltipAttributes,
      buildTooltipAttributeMarkup,
      formatNumber,
      formatPercent,
      formatSignedNumber,
      getDocumentLocale,
      parseNumberInputText,
      normalizeNumber,
      normalizeInteger,
      normalizeNonNegativeNumber,
      normalizeNonNegativeInteger,
      normalizeBoolean: normalizeBoolean$1,
      normalizeEnum: normalizeEnum$1,
      normalizeBooleanMap,
      normalizeNumberMap,
      cloneData,
      clonePlainObject,
      installScriptTranslations,
      createTranslator,
      getCurrentLanguageCode,
      isUsefulTranslation,
      isHwhRuntimeReady,
      retryHwhRuntimeInitialization,
      ensureMainMenuButtons,
      ensureOtherPopupButtons,
      normalizeMenuActionPlacement,
      syncScriptMenuActionPlacement,
      getDoYourBestTaskName,
      getDoYourBestTaskLabel,
      normalizeDoYourBestPlacement,
      getDoYourBestRootBaseClass,
      getDoYourBestTaskListSnapshot,
      getDoYourBestInsertionIndex,
      buildDoYourBestPlacementOptions,
      buildSettingsExportFileName,
      buildSettingsExportPayload,
      downloadJsonFile,
      openExternalUrl,
      parseJsonText,
      pickJsonFileText,
      readFileText
    };
    globalThis.HWHSharedUI = {
      ...globalThis.HWHSharedUI ?? {},
      ...runtime
    };
    return runtime;
  }
  function initializeShopVacuumExtension(attempt) {
    const initAttempt = Number(attempt) || 0;
    if (!retryHwhRuntimeInitialization({
      attempt: initAttempt,
      maxAttempts: 120,
      delayMs: 500,
      requiredKeys: ["HWHFuncs", "HWHData", "HWHClasses", "Caller"],
      retry: initializeShopVacuumExtension,
      logPrefix: "[Vacuum]"
    })) {
      return;
    }
    const { HWHFuncs, HWHData, HWHClasses, Caller, cheats } = globalThis;
    const { addExtentionName: addExtensionName, I18N } = HWHFuncs;
    const progressController = globalThis.HWHSharedUI?.createProgressController?.({
      scriptId: "hwhvacuum",
      title: GM_info.script.name
    }) ?? null;
    if (!progressController) {
      throw new Error(
        "[hwhvacuum] HWHSharedUI.createProgressController is required."
      );
    }
    const {
      setProgress,
      showResult,
      configure: configureProgress
    } = progressController;
    const nativePopupBridge = globalThis.HWHSharedUI?.createNativePopupBridge?.({
      namespace: "hwhvacuum"
    }) ?? null;
    const i18nLangData = HWHData.i18nLangData ?? (HWHData.i18nLangData = {});
    i18nLangData.en ?? (i18nLangData.en = {});
    i18nLangData.ru ?? (i18nLangData.ru = {});
    const mainMenuButtons = HWHData.buttons && typeof HWHData.buttons === "object" ? HWHData.buttons : HWHData.buttons = {};
    const othersPopupButtons = Array.isArray(HWHData.othersPopupButtons) ? HWHData.othersPopupButtons : HWHData.othersPopupButtons = [];
    const i18nLangDataEn = {
      HWHVACUUM_START_LOG: "Starting extension {name} by {author} (v.{version})",
      HWHVACUUM_BUTTON: "Shop Vacuum",
      HWHVACUUM_BUTTON_TITLE: "Buys configured shop slots so you can skip the evening click marathon.",
      HWHVACUUM_TITLE: "Shop vacuum settings",
      HWHVACUUM_SETTINGS_HEADER_META: "v.{version} · {author}",
      HWHVACUUM_RUN: "Start vacuum",
      HWHVACUUM_SAVE: "Save",
      HWHVACUUM_CLOSE: "Close",
      HWHVACUUM_ENABLE_ALL_SHOPS: "Enable shops",
      HWHVACUUM_DISABLE_ALL_SHOPS: "Disable shops",
      HWHVACUUM_SYNC_AFTER_RUN: "Run synchronization after work",
      HWHVACUUM_CURRENCY_LIMITS: "Currency limits",
      HWHVACUUM_SHOP_FILTERS: "Available shops",
      HWHVACUUM_TECH_SECTION: "Additional",
      HWHVACUUM_DONATE_TITLE: "Project support",
      HWHVACUUM_DONATE_TEXT: "If the script saves you time, you can support the project with a coin.",
      HWHVACUUM_DONATE_WALLET: "YooMoney wallet: {wallet}",
      HWHVACUUM_INTERFACE_SECTION: "Information panel",
      HWHVACUUM_BUTTON_PLACEMENT_LABEL: "Vacuum button",
      HWHVACUUM_BUTTON_PLACEMENT_MAIN: "Main menu",
      HWHVACUUM_BUTTON_PLACEMENT_OTHER: "Other menu",
      HWHVACUUM_SOUL_EXCHANGE_SECTION: "Excess exchange",
      HWHVACUUM_SOUL_EXCHANGE_GROUP: "Soul exchange",
      HWHVACUUM_EXCHANGE_HERO_SOULS: "Exchange excess hero souls for coins",
      HWHVACUUM_EXCHANGE_TITAN_SOULS: "Exchange excess titan souls for coins",
      HWHVACUUM_EXCHANGE_PET_SOULS: "Exchange excess pet souls for coins",
      HWHVACUUM_ARTIFACT_FRAGMENT_SALE_SECTION: "Artifact fragment sale",
      HWHVACUUM_SELL_HERO_ARTIFACT_FRAGMENTS: "Sell surplus hero artifact fragments",
      HWHVACUUM_SELL_TITAN_ARTIFACT_FRAGMENTS: "Sell surplus titan artifact fragments",
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
      HWHVACUUM_FEEDBACK: "Feedback",
      HWHVACUUM_WHATS_NEW: "What's new",
      HWHVACUUM_PROGRESS_AUTO_HIDE_RESULT: "Hide result window by timeout",
      HWHVACUUM_PROGRESS_AUTO_HIDE_TIMEOUT: "Result timeout, sec.",
      HWHVACUUM_PROGRESS_POSITION: "Result window position",
      HWHVACUUM_PROGRESS_POSITION_TOP_CENTER: "Top center",
      HWHVACUUM_PROGRESS_POSITION_TOP_RIGHT: "Top right",
      HWHVACUUM_PROGRESS_POSITION_BOTTOM_RIGHT: "Bottom right",
      HWHVACUUM_PROGRESS_STYLE: "Result window style",
      HWHVACUUM_PROGRESS_STYLE_DEFAULT: "Default",
      HWHVACUUM_PROGRESS_STYLE_COMPACT: "Compact",
      HWHVACUUM_PROGRESS_THEME: "Result window theme",
      HWHVACUUM_PROGRESS_THEME_DEFAULT: "Default",
      HWHVACUUM_PROGRESS_THEME_GRAPHITE: "Graphite",
      HWHVACUUM_PROGRESS_THEME_GREEN: "Green",
      HWHVACUUM_PROGRESS_THEME_GOLD: "Gold",
      HWHVACUUM_PROGRESS_THEME_DANGER: "Danger",
      HWHVACUUM_POST_SYNC_DONE: "Synchronization done.",
      HWHVACUUM_POST_SYNC_FAILED: "Synchronization did not finish. The console has the useful details.",
      HWHVACUUM_DO_YOUR_BEST: "Shop vacuum",
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
    const i18nLangDataRu = {
      HWHVACUUM_START_LOG: "Старт расширения {name} от {author} (v.{version})",
      HWHVACUUM_BUTTON: "Пылесос",
      HWHVACUUM_BUTTON_TITLE: "Скупает настроенные слоты магазинов, чтобы ты не устраивал вечерний кликер-марафон.",
      HWHVACUUM_TITLE: "Настройки пылесоса",
      HWHVACUUM_SETTINGS_HEADER_META: "v.{version} · {author}",
      HWHVACUUM_RUN: "Запустить пылесос",
      HWHVACUUM_SAVE: "Сохранить",
      HWHVACUUM_CLOSE: "Закрыть",
      HWHVACUUM_ENABLE_ALL_SHOPS: "Включить магазины",
      HWHVACUUM_DISABLE_ALL_SHOPS: "Отключить магазины",
      HWHVACUUM_SYNC_AFTER_RUN: "Запускать синхронизацию после работы",
      HWHVACUUM_CURRENCY_LIMITS: "Лимиты валют",
      HWHVACUUM_SHOP_FILTERS: "Доступные магазины",
      HWHVACUUM_TECH_SECTION: "Дополнительно",
      HWHVACUUM_DONATE_TITLE: "Поддержка проекта",
      HWHVACUUM_DONATE_TEXT: "Если скрипт экономит время и нервы, проект можно поддержать монетой.",
      HWHVACUUM_DONATE_WALLET: "ЮMoney: {wallet}",
      HWHVACUUM_INTERFACE_SECTION: "Информационная панель",
      HWHVACUUM_BUTTON_PLACEMENT_LABEL: "Кнопка «Пылесос»",
      HWHVACUUM_BUTTON_PLACEMENT_MAIN: "Основное меню",
      HWHVACUUM_BUTTON_PLACEMENT_OTHER: "Разное",
      HWHVACUUM_SOUL_EXCHANGE_SECTION: "Обмен лишнего",
      HWHVACUUM_SOUL_EXCHANGE_GROUP: "Обмен душ",
      HWHVACUUM_EXCHANGE_HERO_SOULS: "Обменивать лишние души героев на монеты",
      HWHVACUUM_EXCHANGE_TITAN_SOULS: "Обменивать лишние души титанов на монеты",
      HWHVACUUM_EXCHANGE_PET_SOULS: "Обменивать лишние души питомцев на монеты",
      HWHVACUUM_ARTIFACT_FRAGMENT_SALE_SECTION: "Продажа фрагментов артефактов",
      HWHVACUUM_SELL_HERO_ARTIFACT_FRAGMENTS: "Продавать лишние фрагменты артефактов героев",
      HWHVACUUM_SELL_TITAN_ARTIFACT_FRAGMENTS: "Продавать лишние фрагменты артефактов титанов",
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
      HWHVACUUM_FEEDBACK: "Обратная связь",
      HWHVACUUM_WHATS_NEW: "Что нового",
      HWHVACUUM_PROGRESS_AUTO_HIDE_RESULT: "Скрывать окно результата по таймауту",
      HWHVACUUM_PROGRESS_AUTO_HIDE_TIMEOUT: "Таймаут результата, сек.",
      HWHVACUUM_PROGRESS_POSITION: "Положение окна результата",
      HWHVACUUM_PROGRESS_POSITION_TOP_CENTER: "Сверху по центру",
      HWHVACUUM_PROGRESS_POSITION_TOP_RIGHT: "Правый верхний угол",
      HWHVACUUM_PROGRESS_POSITION_BOTTOM_RIGHT: "Правый нижний угол",
      HWHVACUUM_PROGRESS_STYLE: "Стиль окна результата",
      HWHVACUUM_PROGRESS_STYLE_DEFAULT: "Обычный",
      HWHVACUUM_PROGRESS_STYLE_COMPACT: "Компактный",
      HWHVACUUM_PROGRESS_THEME: "Тема окна результата",
      HWHVACUUM_PROGRESS_THEME_DEFAULT: "Обычная",
      HWHVACUUM_PROGRESS_THEME_GRAPHITE: "Графит",
      HWHVACUUM_PROGRESS_THEME_GREEN: "Зеленая",
      HWHVACUUM_PROGRESS_THEME_GOLD: "Золотая",
      HWHVACUUM_PROGRESS_THEME_DANGER: "Опасная",
      HWHVACUUM_POST_SYNC_DONE: "Синхронизация выполнена.",
      HWHVACUUM_POST_SYNC_FAILED: "Синхронизация не доехала. Подробности в консоли, без гадания по скриншотам.",
      HWHVACUUM_DO_YOUR_BEST: "Пылесос",
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
    installScriptTranslations(i18nLangData, {
      en: i18nLangDataEn,
      ru: i18nLangDataRu
    });
    const SETTINGS_KEY = "hwhVacuumSettings";
    const ACCORDION_FILTER_KEY = "hwhVacuumAccordionFilters";
    const STORAGE_SCHEMA_VERSION = 4;
    const SETTINGS_EXPORT_VERSION = 1;
    const DO_YOUR_BEST_TASK_NAME = "hwhvacuumRunSelectedShops";
    const SHOP_REQUEST_CHUNK_SIZE = 20;
    const ABSOLUTE_STAR_COUNT = 6;
    const OUTLAND_SHOP_ID = 10;
    const SOUL_SHOP_ID = 8;
    const PET_SHOP_ID = 17;
    const HERO_SOUL_COIN_ID = 5;
    const TITAN_SOUL_COIN_ID = 15;
    const PET_SOUL_COIN_ID = 25;
    const SOUL_SHOP_XP_SLOT_ID = 2;
    const OUTLAND_SKIN_CHEST_CONSUMABLE_ID = 65;
    const PET_POTION_SLOT_ID = 1;
    const PET_SPARK_SLOT_ID = 2;
    const PET_POTION_COIN_SLOT_ID = 3;
    const PET_SPARK_COIN_SLOT_ID = 4;
    const PET_COIN_BALANCE_KEYS = /* @__PURE__ */ new Set([
      `coin:${PET_SOUL_COIN_ID}`,
      `petcoin:${PET_SOUL_COIN_ID}`
    ]);
    const SOUL_EXCHANGE_TYPES = ["titans", "heroes", "pets"];
    const ARTIFACT_FRAGMENT_SALE_TYPES = [
      "heroArtifactFragments",
      "titanArtifactFragments"
    ];
    const EXCESS_EXCHANGE_TYPES = [
      ...SOUL_EXCHANGE_TYPES,
      ...ARTIFACT_FRAGMENT_SALE_TYPES
    ];
    const VACUUM_BUTTON_PLACEMENT_MAIN = "main";
    const VACUUM_BUTTON_PLACEMENT_OTHER = "other";
    const VACUUM_ACTION_KEY = "hwhShopVacuumAction";
    const CHECKLIST_ACTION_SHOPS = "shopPurchases";
    const CHECKLIST_ACTION_TYPES = [CHECKLIST_ACTION_SHOPS, ...EXCESS_EXCHANGE_TYPES];
    const HERO_ARTIFACT_FRAGMENT_INVENTORY_TYPES = [
      "fragmentArtifact",
      "fragmentHeroArtifact",
      "artifactFragment"
    ];
    const TITAN_ARTIFACT_FRAGMENT_INVENTORY_TYPES = ["fragmentTitanArtifact"];
    const TITAN_ARTIFACT_SLOT_IDS = [0, 1, 2];
    const DO_YOUR_BEST_PLACEMENT_NONE2 = "none";
    const DO_YOUR_BEST_PLACEMENT_END2 = "end";
    const FEEDBACK_URL = "https://t.me/askja_tlgrm";
    const VACUUM_VERSIONS_URL = "https://greasyfork.org/ru/scripts?q=HWH%20Shop%20Vacuum";
    const SHOP_IDS = [10, 17, 1, 8, 9, 4, 5, 6];
    const CURRENCY_LIMIT_ORDER = [
      "gold:0",
      "coin:4",
      "coin:25",
      "coin:5",
      "coin:6",
      "coin:1",
      "coin:2",
      "coin:3"
    ];
    const GEAR_REWARD_TYPES = /* @__PURE__ */ new Set([
      "gear",
      "scroll",
      "fragmentGear",
      "fragmentScroll"
    ]);
    const SHOP_DEFINITIONS = {
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
    const CURRENCY_DEFINITIONS = {
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
    const SHOP_OPTION_DEFINITIONS = {
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
    const SOUL_EXCHANGE_DEFINITIONS = {
      heroes: {
        labelKey: "HWHVACUUM_EXCHANGE_HERO_SOULS",
        shortLabelKey: "HWHVACUUM_SOUL_TYPE_HEROES",
        infoLineKey: "HWHVACUUM_SOUL_EXCHANGE_INFO_LINE",
        infoTotalKey: "HWHVACUUM_SOUL_EXCHANGE_INFO_TOTAL",
        icon: "users",
        accentColor: "#d7b2ff",
        coinKey: `coin:${HERO_SOUL_COIN_ID}`,
        coinId: HERO_SOUL_COIN_ID,
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
        coinKey: `coin:${TITAN_SOUL_COIN_ID}`,
        coinId: TITAN_SOUL_COIN_ID,
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
        coinKey: `coin:${PET_SOUL_COIN_ID}`,
        coinId: PET_SOUL_COIN_ID,
        call: {
          name: "inventoryExchangePetStones",
          args: {},
          ident: "body"
        }
      }
    };
    const ARTIFACT_FRAGMENT_SALE_DEFINITIONS = {
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
    const settingsStorage = new VersionedStorage({
      keyPrefix: SETTINGS_KEY,
      schemaVersion: STORAGE_SCHEMA_VERSION
    });
    const accordionFilterController = createAccordionFilterController({
      storageKeyPrefix: ACCORDION_FILTER_KEY,
      schemaVersion: STORAGE_SCHEMA_VERSION,
      rowSelector: "label.hwhx-checkbox-row[data-hwhx-accordion-filter-row]",
      refreshInputSelector: 'input[type="checkbox"]',
      formatNumber: formatNumber$1,
      labels: {
        active: (_count, _mode, formattedCount) => translate("HWHVACUUM_ACCORDION_FILTER_ACTIVE", {
          count: formattedCount
        }),
        inactive: (_count, _mode, formattedCount) => translate("HWHVACUUM_ACCORDION_FILTER_INACTIVE", {
          count: formattedCount
        }),
        empty: () => translate("HWHVACUUM_ACCORDION_FILTER_EMPTY")
      },
      getScopeNode: (accordionNode) => accordionNode.closest("[data-hwhvacuum-popup-body]") ?? accordionNode.closest(".hwhx-modal") ?? document
    });
    let accordionFiltersLoaded = false;
    function translate(key, replacements = {}) {
      let text = typeof I18N === "function" && I18N(key) || i18nLangData.ru?.[key] || i18nLangData.en?.[key] || key;
      Object.entries(replacements).forEach(([placeholder, value]) => {
        text = text.replace(new RegExp(`\\{${placeholder}\\}`, "g"), String(value));
      });
      return text;
    }
    console.log(
      `%c${translate("HWHVACUUM_START_LOG", {
        name: GM_info.script.name,
        author: GM_info.script.author,
        version: GM_info.script.version
      })}`,
      "color: #ff9c57"
    );
    addExtensionName(GM_info.script.name, GM_info.script.version, GM_info.script.author);
    function formatNumber$1(value) {
      return formatNumber(value, { locale: "ru-RU" });
    }
    function buildInlineIcon(iconName, className = "hwhx-blue", title = "") {
      return buildInlineIconMarkup(iconName, { className, title });
    }
    function buildIconLabel(iconName, label, className = "hwhx-blue", title = "") {
      return buildIconLabelMarkup(iconName, label, {
        iconClassName: className,
        title
      });
    }
    function buildSettingsModalTitle() {
      const scriptName = String(GM_info?.script?.name ?? "HWH Shop Vacuum").trim();
      const scriptVersion = String(GM_info?.script?.version ?? "?").trim();
      const scriptAuthor = String(GM_info?.script?.author ?? "?").trim();
      return `${scriptName} · ${translate("HWHVACUUM_SETTINGS_HEADER_META", {
        version: scriptVersion,
        author: scriptAuthor
      })}`;
    }
    function buildSettingsAccordion2({
      key,
      title,
      icon,
      accentColor = "#6e4a24",
      content,
      defaultOpen = false,
      badges = "",
      tooltip = ""
    }) {
      const titleAttribute = buildTooltipAttributeMarkup(tooltip);
      const openAttribute = defaultOpen ? " open" : "";
      const keyAttribute = key ? ` data-hwhx-accordion-key="${escapeHtml$1(key)}"` : "";
      return `<details class="hwhx-accordion"${keyAttribute}${openAttribute}${buildCssVariableStyleMarkup({ "--hwhx-accent": accentColor })}><summary class="hwhx-accordion__summary"${titleAttribute}><span class="hwhx-accordion__heading">${buildAccordionArrowMarkup()}${buildInlineIcon(icon, "", tooltip)}<span>${escapeHtml$1(title)}</span></span>${badges ? `<span class="hwhx-badges">${badges}</span>` : ""}</summary><div class="hwhx-accordion__body">${content}</div></details>`;
    }
    function buildDonateCard() {
      const wallet = "410011617614156";
      return buildDonatePanelMarkup({
        title: translate("HWHVACUUM_DONATE_TITLE"),
        wallet: translate("HWHVACUUM_DONATE_WALLET", { wallet }),
        text: translate("HWHVACUUM_DONATE_TEXT")
      });
    }
    function getShopDefinition(shopId) {
      return SHOP_DEFINITIONS[Number(shopId)] ?? {
        nameKey: "HWHVACUUM_ITEM_GENERIC",
        currencyKey: "",
        icon: "shopping-cart",
        accentColor: "#d8c39a"
      };
    }
    function getShopName(shopId) {
      return translate(
        SHOP_DEFINITIONS[Number(shopId)]?.nameKey ?? "HWHVACUUM_ITEM_GENERIC",
        { id: shopId }
      );
    }
    function getCurrencyDefinition(currencyKey) {
      return CURRENCY_DEFINITIONS[String(currencyKey)] ?? {
        nameKey: "HWHVACUUM_CURRENCY_GENERIC",
        icon: "coins",
        accentColor: "#d8c39a"
      };
    }
    function getCurrencyName(currencyKey) {
      const normalizedKey = String(currencyKey ?? "");
      const definition = getCurrencyDefinition(normalizedKey);
      const currencyId = normalizedKey.split(":")[1] ?? "?";
      return translate(definition.nameKey, { id: currencyId });
    }
    function getShopOptionKeys(shopId) {
      const normalizedShopId = Number(shopId);
      if (normalizedShopId === PET_SHOP_ID) {
        return [
          "petPotionGold",
          "petSparkGold",
          "petPotionCoins",
          "petSparkCoins"
        ];
      }
      const keys = ["gear", "soulStones"];
      if (normalizedShopId === OUTLAND_SHOP_ID) {
        keys.push("skinStoneChests");
      }
      if (normalizedShopId === SOUL_SHOP_ID) {
        keys.push("xpSlot");
      }
      return keys;
    }
    function isPetCoinCost(costDetails) {
      return PET_COIN_BALANCE_KEYS.has(costDetails?.balanceKey);
    }
    function createEnabledShopMap(defaultValue) {
      return Object.fromEntries(SHOP_IDS.map((shopId) => [shopId, !!defaultValue]));
    }
    function createDefaultShopPurchases() {
      return Object.fromEntries(
        SHOP_IDS.map((shopId) => [
          shopId,
          Object.fromEntries(
            getShopOptionKeys(shopId).map((optionKey) => [
              optionKey,
              !!SHOP_OPTION_DEFINITIONS[optionKey]?.defaultValue
            ])
          )
        ])
      );
    }
    function createDefaultCurrencyLimits() {
      return Object.fromEntries(CURRENCY_LIMIT_ORDER.map((currencyKey) => [currencyKey, 0]));
    }
    function createDefaultSoulExchangeSettings(defaultValue = false) {
      return Object.fromEntries(
        SOUL_EXCHANGE_TYPES.map((exchangeType) => [exchangeType, !!defaultValue])
      );
    }
    function createDefaultArtifactFragmentSaleSettings(defaultValue = false) {
      return Object.fromEntries(
        ARTIFACT_FRAGMENT_SALE_TYPES.map((saleType) => [saleType, !!defaultValue])
      );
    }
    function normalizeSoulExchangeTypeList(values) {
      const allowedTypeSet = new Set(EXCESS_EXCHANGE_TYPES);
      return [...new Set(values ?? [])].map((value) => String(value ?? "").trim()).filter((value) => allowedTypeSet.has(value));
    }
    function normalizeChecklistActionTypes(values, fallbackValues = [CHECKLIST_ACTION_SHOPS]) {
      const sourceValues = values === void 0 ? fallbackValues : Array.isArray(values) ? values : String(values ?? "").split(",").map((value) => value.trim());
      const allowedTypeSet = new Set(CHECKLIST_ACTION_TYPES);
      return [...new Set(sourceValues)].map((value) => String(value ?? "").trim()).filter((value) => allowedTypeSet.has(value));
    }
    function normalizeVacuumButtonPlacement(value) {
      return value === VACUUM_BUTTON_PLACEMENT_MAIN ? VACUUM_BUTTON_PLACEMENT_MAIN : VACUUM_BUTTON_PLACEMENT_OTHER;
    }
    function normalizeDoYourBestPlacement$1(value) {
      return normalizeDoYourBestPlacement(value);
    }
    const DEFAULT_SETTINGS = {
      enabledShops: createEnabledShopMap(true),
      shopPurchases: createDefaultShopPurchases(),
      currencyLimits: createDefaultCurrencyLimits(),
      soulExchange: createDefaultSoulExchangeSettings(false),
      artifactFragmentSale: createDefaultArtifactFragmentSaleSettings(false),
      checklistSoulExchangeTypes: [],
      checklistActionTypes: [CHECKLIST_ACTION_SHOPS],
      vacuumButtonPlacement: VACUUM_BUTTON_PLACEMENT_OTHER,
      doYourBestPlacement: DO_YOUR_BEST_PLACEMENT_END2,
      syncAfterRun: false,
      progressAutoHideResult: false,
      progressAutoHideResultTimeoutMs: 5e3,
      progressWindowPosition: "top-right",
      progressWindowStyle: "default",
      progressWindowTheme: "default"
    };
    function normalizeSettings(value) {
      const rawSettings = value && typeof value === "object" ? value : {};
      const enabledShops = createEnabledShopMap(true);
      const defaultShopPurchases = createDefaultShopPurchases();
      const shopPurchases = createDefaultShopPurchases();
      const currencyLimits = createDefaultCurrencyLimits();
      const soulExchange = createDefaultSoulExchangeSettings(false);
      const artifactFragmentSale = createDefaultArtifactFragmentSaleSettings(false);
      SHOP_IDS.forEach((shopId) => {
        enabledShops[shopId] = rawSettings?.enabledShops?.[shopId] !== false;
        getShopOptionKeys(shopId).forEach((optionKey) => {
          const savedValue = rawSettings?.shopPurchases?.[shopId]?.[optionKey];
          shopPurchases[shopId][optionKey] = typeof savedValue === "boolean" ? savedValue : !!defaultShopPurchases[shopId]?.[optionKey];
        });
      });
      CURRENCY_LIMIT_ORDER.forEach((currencyKey) => {
        currencyLimits[currencyKey] = normalizeNonNegativeInteger(
          rawSettings?.currencyLimits?.[currencyKey],
          0
        );
      });
      SOUL_EXCHANGE_TYPES.forEach((exchangeType) => {
        soulExchange[exchangeType] = !!rawSettings?.soulExchange?.[exchangeType];
      });
      ARTIFACT_FRAGMENT_SALE_TYPES.forEach((saleType) => {
        artifactFragmentSale[saleType] = !!rawSettings?.artifactFragmentSale?.[saleType];
      });
      return {
        enabledShops,
        shopPurchases,
        currencyLimits,
        soulExchange,
        artifactFragmentSale,
        checklistSoulExchangeTypes: normalizeSoulExchangeTypeList(
          rawSettings?.checklistSoulExchangeTypes
        ),
        checklistActionTypes: normalizeChecklistActionTypes(
          rawSettings?.checklistActionTypes,
          rawSettings?.checklistSoulExchangeTypes === void 0 ? DEFAULT_SETTINGS.checklistActionTypes : [
            CHECKLIST_ACTION_SHOPS,
            ...normalizeSoulExchangeTypeList(rawSettings.checklistSoulExchangeTypes)
          ]
        ),
        vacuumButtonPlacement: normalizeVacuumButtonPlacement(
          rawSettings?.vacuumButtonPlacement
        ),
        doYourBestPlacement: normalizeDoYourBestPlacement$1(
          rawSettings?.doYourBestPlacement
        ),
        syncAfterRun: !!rawSettings?.syncAfterRun,
        progressAutoHideResult: !!rawSettings?.progressAutoHideResult,
        progressAutoHideResultTimeoutMs: Math.max(
          1e3,
          normalizeNonNegativeInteger(
            rawSettings?.progressAutoHideResultTimeoutMs,
            DEFAULT_SETTINGS.progressAutoHideResultTimeoutMs
          )
        ),
        progressWindowPosition: [
          "top-center",
          "top-right",
          "bottom-right"
        ].includes(rawSettings?.progressWindowPosition) ? rawSettings.progressWindowPosition : DEFAULT_SETTINGS.progressWindowPosition,
        progressWindowStyle: rawSettings?.progressWindowStyle === "compact" ? "compact" : "default",
        progressWindowTheme: String(rawSettings?.progressWindowTheme ?? DEFAULT_SETTINGS.progressWindowTheme).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || DEFAULT_SETTINGS.progressWindowTheme
      };
    }
    function readSettings() {
      const settings = normalizeSettings(
        settingsStorage.read("", DEFAULT_SETTINGS) ?? DEFAULT_SETTINGS
      );
      configureProgress(settings);
      return settings;
    }
    function writeSettings(settings) {
      const normalizedSettings = normalizeSettings(settings);
      settingsStorage.write("", normalizedSettings);
      configureProgress(normalizedSettings);
      syncVacuumActionPlacement(normalizedSettings);
      registerDoYourBestVacuumTask();
      return normalizedSettings;
    }
    async function ensureAccordionFiltersLoaded() {
      if (accordionFiltersLoaded) {
        return;
      }
      await accordionFilterController.load();
      accordionFiltersLoaded = true;
    }
    function readCheckboxInputValue(inputId, fallbackValue = false, rootNode = document) {
      return readCheckboxInput(inputId, fallbackValue, rootNode);
    }
    function readNumberInputValue(inputId, fallbackValue = 0, rootNode = document) {
      return readNumberInput(inputId, fallbackValue, rootNode, { minValue: 0 });
    }
    function readSelectInputValue(inputId, fallbackValue, allowedValues, rootNode = document) {
      return readSelectInput(inputId, fallbackValue, allowedValues, rootNode);
    }
    function readMultiSelectInputValues(inputId, fallbackValues = [], rootNode = document) {
      const input = getScopedElementById(inputId, rootNode);
      if (!(input instanceof HTMLInputElement)) {
        return normalizeSoulExchangeTypeList(fallbackValues);
      }
      return normalizeSoulExchangeTypeList(readMultiSelectValues(input));
    }
    function readChecklistActionInputValues(inputId, fallbackValues = [], rootNode = document) {
      const input = getScopedElementById(inputId, rootNode);
      if (!(input instanceof HTMLInputElement)) {
        return normalizeChecklistActionTypes(fallbackValues, []);
      }
      return normalizeChecklistActionTypes(readMultiSelectValues(input), []);
    }
    function buildVacuumMultiSelect(inputId, values, groups) {
      return buildMultiSelectMarkup({
        id: inputId,
        values,
        groups,
        placeholder: translate("HWHVACUUM_SOUL_EXCHANGE_MULTI_PLACEHOLDER"),
        selectedLabel: translate("HWHVACUUM_SOUL_EXCHANGE_MULTI_SELECTED"),
        searchPlaceholder: translate("HWHVACUUM_SOUL_EXCHANGE_MULTI_SEARCH"),
        selectAllLabel: translate("HWHVACUUM_SOUL_EXCHANGE_MULTI_ALL"),
        clearLabel: translate("HWHVACUUM_SOUL_EXCHANGE_MULTI_CLEAR"),
        widthPx: 320
      });
    }
    function getCurrencyLimitInputId(currencyKey) {
      return `hwhvacuum-currency-limit-${String(currencyKey).replaceAll(":", "-")}`;
    }
    function getShopEnabledInputId(shopId) {
      return `hwhvacuum-shop-enabled-${shopId}`;
    }
    function getShopOptionInputId(shopId, optionKey) {
      return `hwhvacuum-shop-${shopId}-${optionKey}`;
    }
    function getSoulExchangeInputId(exchangeType) {
      return `hwhvacuum-soul-exchange-${exchangeType}`;
    }
    function getArtifactFragmentSaleInputId(saleType) {
      return `hwhvacuum-artifact-fragment-sale-${saleType}`;
    }
    const PROGRESS_AUTO_HIDE_INPUT_ID = "hwhvacuum-progress-auto-hide";
    const PROGRESS_TIMEOUT_INPUT_ID = "hwhvacuum-progress-timeout";
    const PROGRESS_POSITION_INPUT_ID = "hwhvacuum-progress-position";
    const PROGRESS_STYLE_INPUT_ID = "hwhvacuum-progress-style";
    const PROGRESS_THEME_INPUT_ID = "hwhvacuum-progress-theme";
    const SYNC_AFTER_RUN_INPUT_ID = "hwhvacuum-sync-after-run";
    const CHECKLIST_SOUL_EXCHANGE_TYPES_INPUT_ID = "hwhvacuum-checklist-soul-exchange-types";
    const CHECKLIST_ACTION_TYPES_INPUT_ID = "hwhvacuum-checklist-action-types";
    const VACUUM_BUTTON_PLACEMENT_INPUT_ID = "hwhvacuum-button-placement";
    const DO_YOUR_BEST_PLACEMENT_SELECT_ID = "hwhvacuum-do-your-best-placement";
    function buildCheckboxRow({
      inputId,
      checked,
      label,
      icon = "check",
      color = "#d8c39a",
      title = "",
      extraAttributes = {},
      filterRow = false
    }) {
      return buildSettingsCheckboxRow({
        inputId,
        checked,
        labelHtml: `<span class="hwhx-form-label">${buildIconLabel(icon, label, "", title)}</span>`,
        title,
        color,
        extraAttributes,
        rowAttributes: filterRow ? { "data-hwhx-accordion-filter-row": "1" } : {}
      });
    }
    function buildSettingsField$1({
      label,
      inputId,
      value,
      icon = "coins",
      color = "#d8c39a",
      minValue = 0,
      maxValue = void 0,
      widthPx = 116,
      title = "",
      sideText = "",
      extraAttributes = {}
    }) {
      return buildSettingsField({
        label,
        labelHtml: buildIconLabel(icon, label, "", title),
        inputId,
        value,
        icon,
        color,
        minValue,
        maxValue,
        widthPx,
        title,
        sideText,
        extraAttributes
      });
    }
    function buildSettingsSelectField$1({
      label,
      inputId,
      value,
      options,
      icon = "monitor",
      color = "#d8c39a",
      widthPx = 220,
      title = ""
    }) {
      return buildSettingsSelectField({
        label,
        inputId,
        value,
        options,
        icon,
        color,
        widthPx,
        title
      });
    }
    function getAvailableShopIds(shopsState) {
      if (!shopsState || typeof shopsState !== "object") {
        return [...SHOP_IDS];
      }
      const availableShopIds = SHOP_IDS.filter(
        (shopId) => !!getShopState(shopsState, shopId)
      );
      return availableShopIds.length > 0 ? availableShopIds : [...SHOP_IDS];
    }
    function getShopState(shopsState, shopId) {
      if (!shopsState || typeof shopsState !== "object") {
        return null;
      }
      const directShop = shopsState?.[shopId] ?? shopsState?.[String(shopId)];
      if (directShop) {
        return directShop;
      }
      return Object.values(shopsState).find(
        (shop) => Number(shop?.id) === Number(shopId)
      ) ?? null;
    }
    function buildCurrencyLimitAccordion(settings, balances) {
      const content = CURRENCY_LIMIT_ORDER.map((currencyKey) => {
        const definition = getCurrencyDefinition(currencyKey);
        const currentAmount = Number(balances?.[currencyKey]) || 0;
        return buildSettingsField$1({
          label: getCurrencyName(currencyKey),
          inputId: getCurrencyLimitInputId(currencyKey),
          value: settings.currencyLimits[currencyKey] ?? 0,
          icon: definition.icon,
          color: definition.accentColor,
          maxValue: 999999999,
          widthPx: 132,
          sideText: formatNumber$1(currentAmount),
          extraAttributes: {
            "data-hwhvacuum-currency-limit": currencyKey
          }
        });
      }).join("");
      return buildSettingsAccordion2({
        key: "vacuum:currency-limits",
        title: translate("HWHVACUUM_CURRENCY_LIMITS"),
        icon: "coins",
        accentColor: "#4d3f2c",
        content,
        defaultOpen: true
      });
    }
    function buildShopFiltersAccordion(settings, availableShopIds) {
      const checkedCount = availableShopIds.filter(
        (shopId) => settings.enabledShops[shopId]
      ).length;
      const badges = accordionFilterController.buildBadgesMarkup(
        {
          total: availableShopIds.length,
          checked: checkedCount
        },
        "vacuum:shop-filters"
      );
      const content = availableShopIds.map((shopId) => {
        const definition = getShopDefinition(shopId);
        return buildCheckboxRow({
          inputId: getShopEnabledInputId(shopId),
          checked: settings.enabledShops[shopId],
          label: getShopName(shopId),
          icon: definition.icon,
          color: definition.accentColor,
          filterRow: true,
          extraAttributes: {
            "data-hwhvacuum-shop-enabled": shopId,
            "data-name": shopId
          }
        });
      }).join("");
      return buildSettingsAccordion2({
        key: "vacuum:shop-filters",
        title: translate("HWHVACUUM_SHOP_FILTERS"),
        icon: "filter",
        accentColor: "#5f4528",
        content,
        defaultOpen: true,
        badges
      });
    }
    function buildShopSettingsAccordion(shopId, settings) {
      const definition = getShopDefinition(shopId);
      const content = getShopOptionKeys(shopId).map((optionKey) => {
        const optionDefinition = SHOP_OPTION_DEFINITIONS[optionKey];
        return buildCheckboxRow({
          inputId: getShopOptionInputId(shopId, optionKey),
          checked: !!settings.shopPurchases?.[shopId]?.[optionKey],
          label: translate(optionDefinition.labelKey),
          icon: optionDefinition.icon,
          color: optionDefinition.accentColor,
          extraAttributes: {
            "data-hwhvacuum-shop-option": optionKey,
            "data-hwhvacuum-shop-id": shopId
          }
        });
      }).join("");
      return buildSettingsAccordion2({
        key: `vacuum:shop:${shopId}`,
        title: getShopName(shopId),
        icon: definition.icon,
        accentColor: definition.accentColor,
        content,
        defaultOpen: Number(shopId) === PET_SHOP_ID
      });
    }
    function buildSoulExchangeInfoRows(exchangeInfo) {
      const rows = EXCESS_EXCHANGE_TYPES.flatMap((exchangeType) => {
        const definition = getExcessExchangeDefinition(exchangeType);
        if (!definition) {
          return [];
        }
        const entries = exchangeInfo?.[exchangeType] ?? [];
        const totalAmount = entries.reduce(
          (total, entry) => total + (Number(entry.amount) || 0),
          0
        );
        if (entries.length <= 0 || totalAmount <= 0) {
          return [];
        }
        const previewText = entries.slice(0, 4).map(
          (entry) => translate(definition.infoLineKey, {
            name: entry.name,
            amount: formatNumber$1(entry.amount)
          })
        ).join("; ");
        return [
          `<div class="hwhx-info-line"${buildCssVariableStyleMarkup({
            "--hwhx-label-color": definition.accentColor,
            "--hwhx-value-color": "#f7e0bc"
          })}><span class="hwhx-info-line__label">${buildIconLabel(
            definition.icon,
            translate(definition.shortLabelKey),
            ""
          )}</span><span class="hwhx-info-line__value" data-hwhx-native-title="${escapeHtml$1(
            previewText
          )}">${escapeHtml$1(
            translate(definition.infoTotalKey, {
              count: formatNumber$1(entries.length),
              amount: formatNumber$1(totalAmount)
            })
          )}</span></div>`
        ];
      });
      return rows.length > 0 ? rows.join("") : `<div class="hwhx-muted">${escapeHtml$1(
        translate("HWHVACUUM_SOUL_EXCHANGE_INFO_EMPTY")
      )}</div>`;
    }
    function buildSoulExchangeChecklistGroups() {
      const buildOptions = (exchangeTypes) => exchangeTypes.map((exchangeType) => {
        const definition = getExcessExchangeDefinition(exchangeType);
        if (!definition) {
          return null;
        }
        return {
          value: exchangeType,
          htmlLabel: buildIconLabel(
            definition.icon,
            translate(definition.shortLabelKey),
            ""
          ),
          searchText: `${translate(definition.shortLabelKey)} ${translate(
            definition.labelKey
          )}`
        };
      }).filter(Boolean);
      return [
        {
          label: translate("HWHVACUUM_SOUL_EXCHANGE_GROUP"),
          options: buildOptions(SOUL_EXCHANGE_TYPES)
        },
        {
          label: translate("HWHVACUUM_ARTIFACT_FRAGMENT_SALE_SECTION"),
          options: buildOptions(ARTIFACT_FRAGMENT_SALE_TYPES)
        }
      ];
    }
    function buildChecklistActionGroups() {
      return [
        {
          label: translate("HWHVACUUM_SHOP_FILTERS"),
          options: [
            {
              value: CHECKLIST_ACTION_SHOPS,
              htmlLabel: buildIconLabel(
                "shopping-cart",
                translate("HWHVACUUM_CHECKLIST_ACTION_SHOPS"),
                ""
              ),
              searchText: translate("HWHVACUUM_CHECKLIST_ACTION_SHOPS")
            }
          ]
        },
        ...buildSoulExchangeChecklistGroups()
      ];
    }
    function buildSoulExchangeAccordion(settings, snapshot) {
      const exchangeInfo = buildExcessExchangeInfo(snapshot);
      const soulCheckboxMarkup = SOUL_EXCHANGE_TYPES.map((exchangeType) => {
        const definition = SOUL_EXCHANGE_DEFINITIONS[exchangeType];
        return buildCheckboxRow({
          inputId: getSoulExchangeInputId(exchangeType),
          checked: !!settings.soulExchange?.[exchangeType],
          label: translate(definition.labelKey),
          icon: definition.icon,
          color: definition.accentColor,
          extraAttributes: {
            "data-hwhvacuum-soul-exchange": exchangeType
          }
        });
      }).join("");
      const artifactFragmentSaleCheckboxMarkup = ARTIFACT_FRAGMENT_SALE_TYPES.map(
        (saleType) => {
          const definition = ARTIFACT_FRAGMENT_SALE_DEFINITIONS[saleType];
          return buildCheckboxRow({
            inputId: getArtifactFragmentSaleInputId(saleType),
            checked: !!settings.artifactFragmentSale?.[saleType],
            label: translate(definition.labelKey),
            icon: definition.icon,
            color: definition.accentColor,
            extraAttributes: {
              "data-hwhvacuum-artifact-fragment-sale": saleType
            }
          });
        }
      ).join("");
      const content = [
        `<div class="hwhx-control-stack">${soulCheckboxMarkup}${artifactFragmentSaleCheckboxMarkup}</div>`,
        `<div class="hwhx-settings-list">${buildSoulExchangeInfoRows(exchangeInfo)}</div>`
      ].join("");
      return buildSettingsAccordion2({
        key: "vacuum:soul-exchange",
        title: translate("HWHVACUUM_SOUL_EXCHANGE_SECTION"),
        icon: "sparkles",
        accentColor: "#5b3f70",
        content,
        defaultOpen: false
      });
    }
    function isVacuumDoYourBestTask(task) {
      return getDoYourBestTaskName(task) === DO_YOUR_BEST_TASK_NAME;
    }
    function getDoYourBestTaskListSnapshot$1() {
      return getDoYourBestTaskListSnapshot(HWHClasses?.doYourBest, {
        logPrefix: "[Vacuum]"
      });
    }
    function buildDoYourBestPlacementOptions$1(taskList) {
      return buildDoYourBestPlacementOptions({
        taskList,
        translate,
        keys: {
          none: "HWHVACUUM_DO_YOUR_BEST_PLACEMENT_NONE",
          end: "HWHVACUUM_DO_YOUR_BEST_PLACEMENT_END",
          before: "HWHVACUUM_DO_YOUR_BEST_PLACEMENT_BEFORE",
          after: "HWHVACUUM_DO_YOUR_BEST_PLACEMENT_AFTER"
        }
      });
    }
    function buildDoYourBestPlacementAccordion(settings) {
      const taskList = getDoYourBestTaskListSnapshot$1().filter(
        (task) => !isVacuumDoYourBestTask(task)
      );
      const placementOptions = buildDoYourBestPlacementOptions$1(taskList);
      const selectedPlacement = placementOptions.some(
        (option) => option.value === settings.doYourBestPlacement
      ) ? settings.doYourBestPlacement : placementOptions.at(-1)?.value ?? DO_YOUR_BEST_PLACEMENT_END2;
      const actionGroups = buildChecklistActionGroups();
      const content = [
        buildSettingsSelectField$1({
          label: translate("HWHVACUUM_DO_YOUR_BEST_PLACEMENT_LABEL"),
          inputId: DO_YOUR_BEST_PLACEMENT_SELECT_ID,
          value: selectedPlacement,
          options: placementOptions,
          icon: "list-checks",
          color: "#9fd3ff",
          widthPx: 360
        }),
        `<label class="hwhx-form-row hwhx-form-row--stack"><span class="hwhx-form-label">${buildIconLabel(
          "list-checks",
          translate("HWHVACUUM_CHECKLIST_ACTIONS"),
          ""
        )}</span><span class="hwhx-form-control">${buildVacuumMultiSelect(
          CHECKLIST_ACTION_TYPES_INPUT_ID,
          settings.checklistActionTypes,
          actionGroups
        )}</span></label>`
      ].join("");
      return buildSettingsAccordion2({
        key: "vacuum:do-your-best",
        title: translate("HWHVACUUM_DO_YOUR_BEST_PLACEMENT_HEADER"),
        icon: "list-checks",
        accentColor: "#4d5770",
        content,
        defaultOpen: false
      });
    }
    function buildProgressInterfaceAccordion(settings) {
      const content = [
        buildSettingsSelectField$1({
          label: translate("HWHVACUUM_BUTTON_PLACEMENT_LABEL"),
          inputId: VACUUM_BUTTON_PLACEMENT_INPUT_ID,
          value: normalizeVacuumButtonPlacement(settings.vacuumButtonPlacement),
          options: [
            {
              value: VACUUM_BUTTON_PLACEMENT_MAIN,
              label: translate("HWHVACUUM_BUTTON_PLACEMENT_MAIN"),
              icon: "play"
            },
            {
              value: VACUUM_BUTTON_PLACEMENT_OTHER,
              label: translate("HWHVACUUM_BUTTON_PLACEMENT_OTHER"),
              icon: "settings"
            }
          ],
          icon: "map-pin",
          color: "#9fd3ff",
          widthPx: 220
        }),
        buildProgressSettingsFields({
          settings,
          inputIds: {
            autoHide: PROGRESS_AUTO_HIDE_INPUT_ID,
            timeout: PROGRESS_TIMEOUT_INPUT_ID,
            position: PROGRESS_POSITION_INPUT_ID,
            style: PROGRESS_STYLE_INPUT_ID,
            theme: PROGRESS_THEME_INPUT_ID
          },
          labels: {
            autoHide: translate("HWHVACUUM_PROGRESS_AUTO_HIDE_RESULT"),
            timeout: translate("HWHVACUUM_PROGRESS_AUTO_HIDE_TIMEOUT"),
            position: translate("HWHVACUUM_PROGRESS_POSITION"),
            style: translate("HWHVACUUM_PROGRESS_STYLE"),
            theme: translate("HWHVACUUM_PROGRESS_THEME"),
            positionOptions: {
              topRight: translate("HWHVACUUM_PROGRESS_POSITION_TOP_RIGHT"),
              topCenter: translate("HWHVACUUM_PROGRESS_POSITION_TOP_CENTER"),
              bottomRight: translate("HWHVACUUM_PROGRESS_POSITION_BOTTOM_RIGHT")
            },
            styleOptions: {
              default: translate("HWHVACUUM_PROGRESS_STYLE_DEFAULT"),
              compact: translate("HWHVACUUM_PROGRESS_STYLE_COMPACT")
            },
            themeOptions: {
              default: translate("HWHVACUUM_PROGRESS_THEME_DEFAULT"),
              graphite: translate("HWHVACUUM_PROGRESS_THEME_GRAPHITE"),
              green: translate("HWHVACUUM_PROGRESS_THEME_GREEN"),
              gold: translate("HWHVACUUM_PROGRESS_THEME_GOLD"),
              danger: translate("HWHVACUUM_PROGRESS_THEME_DANGER")
            }
          },
          buildCheckboxRow,
          buildField: buildSettingsField$1,
          buildSelectField: buildSettingsSelectField$1,
          color: "#9fd3ff"
        })
      ].join("");
      return buildSettingsAccordion2({
        key: "vacuum:info-panel",
        title: translate("HWHVACUUM_INTERFACE_SECTION"),
        icon: "monitor",
        accentColor: "#4d5770",
        content,
        defaultOpen: false
      });
    }
    function buildTechnicalActionButton({ result, label, icon, tone = "graphite" }) {
      return buildSettingsActionButton({
        result,
        label,
        icon,
        tone,
        className: "hwhx-technical-button"
      });
    }
    function buildTechnicalAccordion(settings) {
      const content = [
        buildDonateCard(),
        buildCheckboxRow({
          inputId: SYNC_AFTER_RUN_INPUT_ID,
          checked: settings.syncAfterRun,
          label: translate("HWHVACUUM_SYNC_AFTER_RUN"),
          icon: "refresh-cw",
          color: "#9fe0a8"
        }),
        `<div class="hwhx-technical-actions">${[
          buildTechnicalActionButton({
            result: "exportSettings",
            label: translate("HWHVACUUM_EXPORT_SETTINGS"),
            icon: "download",
            tone: "green"
          }),
          buildTechnicalActionButton({
            result: "importSettings",
            label: translate("HWHVACUUM_IMPORT_SETTINGS"),
            icon: "upload",
            tone: "blue"
          }),
          buildTechnicalActionButton({
            result: "feedback",
            label: translate("HWHVACUUM_FEEDBACK"),
            icon: "message-circle"
          }),
          buildTechnicalActionButton({
            result: "whatsNew",
            label: translate("HWHVACUUM_WHATS_NEW"),
            icon: "file-text"
          })
        ].join("")}</div>`
      ].join("");
      return buildSettingsAccordion2({
        key: "vacuum:technical",
        title: translate("HWHVACUUM_TECH_SECTION"),
        icon: "terminal",
        accentColor: "#4d4f57",
        content,
        defaultOpen: false
      });
    }
    function buildSettingsHtml(settings, snapshot) {
      const balances = buildBalances(snapshot?.inventory, snapshot?.userInfo);
      const availableShopIds = getAvailableShopIds(snapshot?.shops);
      const sections = [
        buildCurrencyLimitAccordion(settings, balances),
        buildShopFiltersAccordion(settings, availableShopIds),
        ...availableShopIds.map((shopId) => buildShopSettingsAccordion(shopId, settings)),
        buildSoulExchangeAccordion(settings, snapshot),
        buildProgressInterfaceAccordion(settings),
        buildDoYourBestPlacementAccordion(settings),
        buildTechnicalAccordion(settings)
      ];
      return `<div class="hwhx-popup hwhx-popup--wide">${sections.join("")}</div>`;
    }
    function openVacuumNativePopup({
      bodyHtml,
      actions = [],
      checkboxOptions = [],
      includeNativeClose = true,
      title = buildSettingsModalTitle()
    }) {
      if (!nativePopupBridge) {
        throw new Error(
          "[hwhvacuum] HWHSharedUI.createNativePopupBridge is required (shared UI kit)."
        );
      }
      return nativePopupBridge.open({
        popupKind: "settings",
        bodyHtml,
        actions,
        checkboxOptions,
        includeNativeClose,
        title
      });
    }
    function readSettingsFromPopup(rootNode = document, fallbackSettings = readSettings()) {
      const root = rootNode instanceof Document || rootNode instanceof Element ? rootNode : document;
      const settings = normalizeSettings(fallbackSettings);
      root.querySelectorAll("[data-hwhvacuum-shop-enabled]").forEach((inputNode) => {
        if (!(inputNode instanceof HTMLInputElement)) {
          return;
        }
        const shopId = Number(inputNode.getAttribute("data-hwhvacuum-shop-enabled"));
        if (SHOP_IDS.includes(shopId)) {
          settings.enabledShops[shopId] = inputNode.checked;
        }
      });
      root.querySelectorAll("[data-hwhvacuum-shop-option]").forEach((inputNode) => {
        if (!(inputNode instanceof HTMLInputElement)) {
          return;
        }
        const shopId = Number(inputNode.getAttribute("data-hwhvacuum-shop-id"));
        const optionKey = String(inputNode.getAttribute("data-hwhvacuum-shop-option"));
        if (!SHOP_IDS.includes(shopId) || !getShopOptionKeys(shopId).includes(optionKey)) {
          return;
        }
        settings.shopPurchases[shopId][optionKey] = inputNode.checked;
      });
      root.querySelectorAll("[data-hwhvacuum-currency-limit]").forEach((inputNode) => {
        if (!(inputNode instanceof HTMLInputElement)) {
          return;
        }
        const currencyKey = String(inputNode.getAttribute("data-hwhvacuum-currency-limit"));
        if (CURRENCY_LIMIT_ORDER.includes(currencyKey)) {
          settings.currencyLimits[currencyKey] = normalizeNonNegativeInteger(
            inputNode.value,
            settings.currencyLimits[currencyKey] ?? 0
          );
        }
      });
      root.querySelectorAll("[data-hwhvacuum-soul-exchange]").forEach((inputNode) => {
        if (!(inputNode instanceof HTMLInputElement)) {
          return;
        }
        const exchangeType = String(
          inputNode.getAttribute("data-hwhvacuum-soul-exchange")
        );
        if (SOUL_EXCHANGE_TYPES.includes(exchangeType)) {
          settings.soulExchange[exchangeType] = inputNode.checked;
        }
      });
      root.querySelectorAll("[data-hwhvacuum-artifact-fragment-sale]").forEach((inputNode) => {
        if (!(inputNode instanceof HTMLInputElement)) {
          return;
        }
        const saleType = String(
          inputNode.getAttribute("data-hwhvacuum-artifact-fragment-sale")
        );
        if (ARTIFACT_FRAGMENT_SALE_TYPES.includes(saleType)) {
          settings.artifactFragmentSale[saleType] = inputNode.checked;
        }
      });
      settings.checklistSoulExchangeTypes = readMultiSelectInputValues(
        CHECKLIST_SOUL_EXCHANGE_TYPES_INPUT_ID,
        settings.checklistSoulExchangeTypes,
        root
      );
      settings.checklistActionTypes = readChecklistActionInputValues(
        CHECKLIST_ACTION_TYPES_INPUT_ID,
        settings.checklistActionTypes,
        root
      );
      settings.vacuumButtonPlacement = readSelectInputValue(
        VACUUM_BUTTON_PLACEMENT_INPUT_ID,
        settings.vacuumButtonPlacement,
        [VACUUM_BUTTON_PLACEMENT_MAIN, VACUUM_BUTTON_PLACEMENT_OTHER],
        root
      );
      settings.doYourBestPlacement = readSelectInputValue(
        DO_YOUR_BEST_PLACEMENT_SELECT_ID,
        settings.doYourBestPlacement,
        buildDoYourBestPlacementOptions$1(
          getDoYourBestTaskListSnapshot$1().filter(
            (task) => !isVacuumDoYourBestTask(task)
          )
        ).map((option) => option.value),
        root
      );
      settings.syncAfterRun = readCheckboxInputValue(
        SYNC_AFTER_RUN_INPUT_ID,
        settings.syncAfterRun,
        root
      );
      Object.assign(
        settings,
        readProgressSettingsFromPopup({
          rootNode: root,
          fallbackSettings: settings,
          inputIds: {
            autoHide: PROGRESS_AUTO_HIDE_INPUT_ID,
            timeout: PROGRESS_TIMEOUT_INPUT_ID,
            position: PROGRESS_POSITION_INPUT_ID,
            style: PROGRESS_STYLE_INPUT_ID,
            theme: PROGRESS_THEME_INPUT_ID
          },
          readCheckbox: readCheckboxInputValue,
          readNumber: readNumberInputValue,
          readSelect: readSelectInputValue
        })
      );
      return normalizeSettings(settings);
    }
    function parseCostDetails(cost) {
      for (const [costType, amounts] of Object.entries(cost ?? {})) {
        if (costType === "gold") {
          const numericAmount = Number(amounts) || Number(amounts?.[0]) || Number(amounts?.["0"]) || Number(amounts?.gold) || 0;
          if (numericAmount > 0) {
            return {
              costType,
              currencyId: "0",
              amount: numericAmount,
              balanceKey: "gold:0",
              currencyLabel: getCurrencyName("gold:0")
            };
          }
          continue;
        }
        for (const [currencyId, amount] of Object.entries(amounts ?? {})) {
          const numericAmount = Number(amount) || 0;
          if (numericAmount <= 0) {
            continue;
          }
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
    function buildBalances(inventory, userInfo) {
      const balances = {
        "gold:0": Number(userInfo?.gold) || 0
      };
      Object.entries(inventory?.coin ?? {}).forEach(([currencyId, amount]) => {
        balances[`coin:${currencyId}`] = Number(amount) || 0;
      });
      Object.entries(inventory?.petcoin ?? {}).forEach(([currencyId, amount]) => {
        balances[`petcoin:${currencyId}`] = Number(amount) || 0;
      });
      return balances;
    }
    function appendAmount(summaryMap, key, label, amount, extra = {}) {
      const numericAmount = Number(amount) || 0;
      if (numericAmount <= 0) {
        return;
      }
      if (!summaryMap.has(key)) {
        summaryMap.set(key, { label, amount: 0, ...extra });
      }
      summaryMap.get(key).amount += numericAmount;
      Object.assign(summaryMap.get(key), extra);
    }
    function getTranslatedLibraryName(translationKey) {
      const translatedName = translationKey && typeof cheats?.translate === "function" ? cheats.translate(translationKey) : "";
      return translatedName && translatedName !== translationKey ? translatedName : "";
    }
    function getEntityMap(collection) {
      if (!collection || typeof collection !== "object") {
        return {};
      }
      return Array.isArray(collection) ? Object.fromEntries(
        collection.map((entry) => [Number(entry?.id ?? entry?.petId ?? 0), entry]).filter(([entityId]) => Number.isFinite(entityId) && entityId > 0)
      ) : collection;
    }
    function getEntityStarCount(entityData) {
      return Math.max(
        0,
        Number(
          entityData?.star ?? entityData?.stars ?? entityData?.evolution ?? entityData?.evolutionLevel
        ) || 0
      );
    }
    function getInventoryAmountByTypes(inventory, typeNames, entityId) {
      const normalizedId = String(Math.max(0, Number(entityId) || 0));
      return (typeNames ?? []).reduce(
        (amount, typeName) => amount + (Number(inventory?.[typeName]?.[normalizedId]) || 0),
        0
      );
    }
    function getExcessExchangeDefinition(exchangeType) {
      return SOUL_EXCHANGE_DEFINITIONS[exchangeType] ?? ARTIFACT_FRAGMENT_SALE_DEFINITIONS[exchangeType];
    }
    function getLibraryData(sectionName) {
      const normalizedSectionName = String(sectionName ?? "").trim();
      const libObject = globalThis.lib;
      if (!normalizedSectionName || !libObject) {
        return {};
      }
      if (libObject.data?.[normalizedSectionName]) {
        return libObject.data[normalizedSectionName];
      }
      if (libObject[normalizedSectionName]) {
        return libObject[normalizedSectionName];
      }
      if (typeof libObject.getData === "function") {
        try {
          return libObject.getData(normalizedSectionName) ?? {};
        } catch {
          return {};
        }
      }
      return {};
    }
    function getLibraryEntityConfig(sectionName, entityId) {
      const normalizedId = Math.max(0, Number(entityId) || 0);
      if (normalizedId <= 0) {
        return void 0;
      }
      const sectionData = getLibraryData(sectionName);
      return sectionData?.[normalizedId] ?? sectionData?.id?.[normalizedId];
    }
    function getLibraryTypeConfig(sectionName, typeName) {
      const normalizedTypeName = String(typeName ?? "").trim();
      if (!normalizedTypeName) {
        return void 0;
      }
      return getLibraryData(sectionName)?.type?.[normalizedTypeName];
    }
    function getArtifactEvolutionRowsFromTypeConfig(typeConfig) {
      return Object.values(typeConfig?.evolution ?? {}).map((evolutionData) => ({
        star: Math.max(0, Number(evolutionData?.star) || 0),
        fragmentCost: Math.max(
          0,
          Number(evolutionData?.costFragmentsAmount) || 0
        )
      })).filter((evolutionData) => evolutionData.star > 0).sort((left, right) => left.star - right.star);
    }
    function getRemainingArtifactFragmentCost(evolutionRows, currentStar) {
      const normalizedCurrentStar = Math.max(0, Number(currentStar) || 0);
      return (evolutionRows ?? []).reduce(
        (total, evolutionData) => evolutionData.star > normalizedCurrentStar ? total + (Number(evolutionData.fragmentCost) || 0) : total,
        0
      );
    }
    function appendArtifactFragmentUsage(usageByArtifactId, artifactId, artifactName, requiredFragments) {
      const normalizedArtifactId = Math.max(0, Number(artifactId) || 0);
      if (normalizedArtifactId <= 0) {
        return;
      }
      if (!usageByArtifactId.has(normalizedArtifactId)) {
        usageByArtifactId.set(normalizedArtifactId, {
          id: normalizedArtifactId,
          name: artifactName,
          requiredFragments: 0,
          usageCount: 0
        });
      }
      const usage = usageByArtifactId.get(normalizedArtifactId);
      usage.requiredFragments += Math.max(0, Number(requiredFragments) || 0);
      usage.usageCount += 1;
    }
    function collectSurplusArtifactFragmentEntries({
      inventory,
      inventoryTypes,
      usageByArtifactId,
      blockedArtifactIds
    }) {
      return [...usageByArtifactId?.values() ?? []].filter((usage) => !blockedArtifactIds?.has(usage.id)).map((usage) => {
        const ownedAmount = getInventoryAmountByTypes(
          inventory,
          inventoryTypes,
          usage.id
        );
        const requiredAmount = Math.max(
          0,
          Math.floor(Number(usage.requiredFragments) || 0)
        );
        const surplusAmount = Math.max(0, ownedAmount - requiredAmount);
        return {
          id: usage.id,
          name: usage.name,
          amount: surplusAmount,
          ownedAmount,
          requiredAmount,
          usageCount: usage.usageCount
        };
      }).filter((entry) => entry.amount > 0).sort(
        (left, right) => right.amount - left.amount || left.name.localeCompare(right.name, "ru")
      );
    }
    function getHeroArtifactName(artifactId) {
      return getTranslatedLibraryName(`LIB_ARTIFACT_NAME_${artifactId}`) || translate("HWHVACUUM_ITEM_GENERIC", { id: artifactId });
    }
    function getTitanArtifactName(artifactId) {
      return getTranslatedLibraryName(`LIB_TITAN_ARTIFACT_NAME_${artifactId}`) || translate("HWHVACUUM_ITEM_GENERIC", { id: artifactId });
    }
    function getHeroArtifactEvolutionRows(artifactId) {
      const artifactConfig = getLibraryEntityConfig("artifact", artifactId);
      const typeConfig = getLibraryTypeConfig("artifact", artifactConfig?.type);
      return getArtifactEvolutionRowsFromTypeConfig(typeConfig);
    }
    function getTitanArtifactEvolutionRows(artifactId, slotId) {
      const artifactConfig = getLibraryEntityConfig("titanArtifact", artifactId);
      const artifactType = Number(slotId) === 2 ? "amulet" : artifactConfig?.type;
      const typeConfig = getLibraryTypeConfig("titanArtifact", artifactType);
      return getArtifactEvolutionRowsFromTypeConfig(typeConfig);
    }
    function collectHeroArtifactFragmentSaleEntries(snapshot) {
      const inventory = snapshot?.inventory ?? {};
      const usageByArtifactId = /* @__PURE__ */ new Map();
      const blockedArtifactIds = /* @__PURE__ */ new Set();
      Object.entries(getEntityMap(snapshot?.heroes)).forEach(([heroId, heroData]) => {
        const heroConfig = getLibraryEntityConfig("hero", heroId);
        const artifactIds = Array.isArray(heroConfig?.artifacts) ? heroConfig.artifacts : [];
        artifactIds.forEach((artifactIdValue, slotId) => {
          const artifactId = Math.max(0, Number(artifactIdValue) || 0);
          if (artifactId <= 0) {
            return;
          }
          const evolutionRows = getHeroArtifactEvolutionRows(artifactId);
          if (evolutionRows.length <= 0) {
            blockedArtifactIds.add(artifactId);
            return;
          }
          appendArtifactFragmentUsage(
            usageByArtifactId,
            artifactId,
            getHeroArtifactName(artifactId),
            getRemainingArtifactFragmentCost(
              evolutionRows,
              heroData?.artifacts?.[slotId]?.star
            )
          );
        });
      });
      return collectSurplusArtifactFragmentEntries({
        inventory,
        inventoryTypes: HERO_ARTIFACT_FRAGMENT_INVENTORY_TYPES,
        usageByArtifactId,
        blockedArtifactIds
      });
    }
    function collectTitanArtifactFragmentSaleEntries(snapshot) {
      const inventory = snapshot?.inventory ?? {};
      const usageByArtifactId = /* @__PURE__ */ new Map();
      const blockedArtifactIds = /* @__PURE__ */ new Set();
      Object.entries(getEntityMap(snapshot?.titans)).forEach(([titanId, titanData]) => {
        const titanConfig = getLibraryEntityConfig("titan", titanId);
        const artifactIds = Array.isArray(titanConfig?.artifacts) ? titanConfig.artifacts : [];
        TITAN_ARTIFACT_SLOT_IDS.forEach((slotId) => {
          const artifactId = Math.max(0, Number(artifactIds[slotId]) || 0);
          if (artifactId <= 0) {
            return;
          }
          const evolutionRows = getTitanArtifactEvolutionRows(artifactId, slotId);
          if (evolutionRows.length <= 0) {
            blockedArtifactIds.add(artifactId);
            return;
          }
          appendArtifactFragmentUsage(
            usageByArtifactId,
            artifactId,
            getTitanArtifactName(artifactId),
            getRemainingArtifactFragmentCost(
              evolutionRows,
              titanData?.artifacts?.[slotId]?.star
            )
          );
        });
      });
      return collectSurplusArtifactFragmentEntries({
        inventory,
        inventoryTypes: TITAN_ARTIFACT_FRAGMENT_INVENTORY_TYPES,
        usageByArtifactId,
        blockedArtifactIds
      });
    }
    function getSoulEntityName(exchangeType, entityId) {
      if (exchangeType === "pets") {
        return getTranslatedLibraryName(`LIB_PET_NAME_${entityId}`) || translate("HWHVACUUM_ITEM_GENERIC", { id: entityId });
      }
      return getTranslatedLibraryName(`LIB_HERO_NAME_${entityId}`) || translate("HWHVACUUM_ITEM_GENERIC", { id: entityId });
    }
    function getSoulStoneAmount(inventory, exchangeType, entityId) {
      if (exchangeType === "titans") {
        return getInventoryAmountByTypes(inventory, ["fragmentTitan"], entityId);
      }
      if (exchangeType === "pets") {
        return getInventoryAmountByTypes(
          inventory,
          [
            "fragmentPet",
            "petSoulStone",
            "petStone",
            "petFragment",
            "fragmentPetStone"
          ],
          entityId
        );
      }
      return getInventoryAmountByTypes(inventory, ["fragmentHero"], entityId);
    }
    function collectExchangeableSoulEntries(snapshot, exchangeType) {
      const inventory = snapshot?.inventory ?? {};
      const collection = exchangeType === "titans" ? snapshot?.titans : exchangeType === "pets" ? snapshot?.pets : snapshot?.heroes;
      return Object.entries(getEntityMap(collection)).map(([entityId, entityData]) => {
        const numericEntityId = Number(entityId);
        const soulAmount = getSoulStoneAmount(
          inventory,
          exchangeType,
          numericEntityId
        );
        return {
          id: numericEntityId,
          name: getSoulEntityName(exchangeType, numericEntityId),
          stars: getEntityStarCount(entityData),
          amount: soulAmount
        };
      }).filter(
        (entry) => Number.isFinite(entry.id) && entry.id > 0 && entry.stars >= ABSOLUTE_STAR_COUNT && entry.amount > 0
      ).sort((left, right) => right.amount - left.amount || left.name.localeCompare(right.name, "ru"));
    }
    function buildExcessExchangeInfo(snapshot) {
      return {
        ...Object.fromEntries(
          SOUL_EXCHANGE_TYPES.map((exchangeType) => [
            exchangeType,
            collectExchangeableSoulEntries(snapshot, exchangeType)
          ])
        ),
        heroArtifactFragments: collectHeroArtifactFragmentSaleEntries(snapshot),
        titanArtifactFragments: collectTitanArtifactFragmentSaleEntries(snapshot)
      };
    }
    function getItemName(rewardType, rewardData) {
      const itemId = Object.keys(rewardData ?? {})[0];
      if (!itemId) {
        return translate("HWHVACUUM_ITEM_GENERIC", { id: "?" });
      }
      if (rewardType === "consumable" && Number(itemId) === OUTLAND_SKIN_CHEST_CONSUMABLE_ID) {
        return translate("HWHVACUUM_ITEM_SKIN_STONE_CHEST");
      }
      if (rewardType === "fragmentHero") {
        const heroName = getTranslatedLibraryName(`LIB_HERO_NAME_${itemId}`) || translate("HWHVACUUM_ITEM_GENERIC", { id: itemId });
        return translate("HWHVACUUM_ITEM_HERO_SOUL_TEMPLATE", { name: heroName });
      }
      const baseType = rewardType === "fragmentGear" ? "gear" : rewardType === "fragmentScroll" ? "scroll" : rewardType;
      const translationKey = baseType === "gear" ? `LIB_GEAR_NAME_${itemId}` : baseType === "scroll" ? `LIB_SCROLL_NAME_${itemId}` : baseType === "consumable" ? `LIB_CONSUMABLE_NAME_${itemId}` : "";
      const translatedName = getTranslatedLibraryName(translationKey);
      const baseName = translatedName || translate(
        baseType === "gear" ? "HWHVACUUM_ITEM_GEAR" : baseType === "scroll" ? "HWHVACUUM_ITEM_SCROLL" : baseType === "consumable" ? "HWHVACUUM_ITEM_CONSUMABLE" : "HWHVACUUM_ITEM_GENERIC",
        { id: itemId }
      );
      return rewardType.startsWith("fragment") ? translate("HWHVACUUM_ITEM_FRAGMENT_TEMPLATE", { name: baseName }) : baseName;
    }
    function collectRewardItems(reward) {
      return Object.entries(reward ?? {}).flatMap(
        ([rewardType, rewardData]) => Object.entries(rewardData ?? {}).map(([itemId, amount]) => ({
          key: `${rewardType}:${itemId}`,
          label: getItemName(rewardType, { [itemId]: amount }),
          amount: Number(amount) || 0
        }))
      );
    }
    function isGearReward(reward) {
      const rewardEntries = Object.entries(reward ?? {});
      return rewardEntries.length > 0 && rewardEntries.every(([rewardType]) => GEAR_REWARD_TYPES.has(rewardType));
    }
    function isSoulStoneReward(reward) {
      const rewardEntries = Object.entries(reward ?? {});
      return rewardEntries.length > 0 && rewardEntries.every(([rewardType]) => rewardType === "fragmentHero");
    }
    function getOutlandSkinChestAmount(reward) {
      return Number(reward?.consumable?.[OUTLAND_SKIN_CHEST_CONSUMABLE_ID]) || 0;
    }
    function isOutlandSkinChestSlot(slot) {
      return getOutlandSkinChestAmount(slot?.reward) > 0;
    }
    function isSoulExperienceSlot(slot) {
      return Number(slot?.id) === SOUL_SHOP_XP_SLOT_ID;
    }
    function resolveSlotPurchaseOption(settings, shopId, slot, costDetails) {
      const options = settings.shopPurchases?.[shopId] ?? {};
      if (Number(shopId) === PET_SHOP_ID) {
        const slotId = Number(slot?.id);
        if (costDetails.balanceKey === "gold:0" && slotId === PET_POTION_SLOT_ID && options.petPotionGold) {
          return "petPotionGold";
        }
        if (costDetails.balanceKey === "gold:0" && slotId === PET_SPARK_SLOT_ID && options.petSparkGold) {
          return "petSparkGold";
        }
        if (isPetCoinCost(costDetails) && slotId === PET_POTION_COIN_SLOT_ID && options.petPotionCoins) {
          return "petPotionCoins";
        }
        if (isPetCoinCost(costDetails) && slotId === PET_SPARK_COIN_SLOT_ID && options.petSparkCoins) {
          return "petSparkCoins";
        }
        return "";
      }
      if (Number(shopId) === OUTLAND_SHOP_ID && options.skinStoneChests && isOutlandSkinChestSlot(slot)) {
        return "skinStoneChests";
      }
      if (Number(shopId) === SOUL_SHOP_ID && options.xpSlot && isSoulExperienceSlot(slot)) {
        return "xpSlot";
      }
      if (options.gear && isGearReward(slot?.reward)) {
        return "gear";
      }
      if (options.soulStones && isSoulStoneReward(slot?.reward)) {
        return "soulStones";
      }
      return "";
    }
    function getCurrencyLimit(settings, currencyKey) {
      return normalizeNonNegativeInteger(settings?.currencyLimits?.[currencyKey], 0);
    }
    function buildVacuumPlan(settings, shopsState, balances) {
      const calls = [];
      const plannedPurchases = [];
      const workingBalances = { ...balances ?? {} };
      SHOP_IDS.forEach((shopId) => {
        if (!settings.enabledShops[shopId]) {
          return;
        }
        const shop = getShopState(shopsState, shopId);
        const slots = Object.values(shop?.slots ?? {}).sort(
          (left, right) => Number(left?.id) - Number(right?.id)
        );
        slots.forEach((slot) => {
          if (slot?.bought || !slot?.reward || !slot?.cost) {
            return;
          }
          const costDetails = parseCostDetails(slot.cost);
          if (!costDetails) {
            return;
          }
          const purchaseOption = resolveSlotPurchaseOption(
            settings,
            shopId,
            slot,
            costDetails
          );
          if (!purchaseOption) {
            return;
          }
          const currentBalance = Number(workingBalances[costDetails.balanceKey]) || 0;
          const currencyLimit = getCurrencyLimit(settings, costDetails.balanceKey);
          if (currentBalance - costDetails.amount < currencyLimit) {
            return;
          }
          const call = {
            name: "shopBuy",
            args: {
              shopId: Number(shop?.id ?? shopId),
              slot: Number(slot.id),
              cost: slot.cost,
              reward: slot.reward
            },
            ident: `vacuum_${shop?.id ?? shopId}_${slot.id}`
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
            rewardItems: collectRewardItems(slot.reward)
          });
        });
      });
      return {
        calls,
        plannedPurchases
      };
    }
    function isExcessExchangeTypeEnabled(settings, exchangeType) {
      if (SOUL_EXCHANGE_TYPES.includes(exchangeType)) {
        return !!settings?.soulExchange?.[exchangeType];
      }
      if (ARTIFACT_FRAGMENT_SALE_TYPES.includes(exchangeType)) {
        return !!settings?.artifactFragmentSale?.[exchangeType];
      }
      return false;
    }
    function getEnabledExcessExchangeTypes(settings, options = void 0) {
      const enabledTypes = EXCESS_EXCHANGE_TYPES.filter(
        (exchangeType) => isExcessExchangeTypeEnabled(settings, exchangeType)
      );
      if (options?.source !== "checklist") {
        return enabledTypes;
      }
      const checklistTypeSet = new Set(
        normalizeChecklistActionTypes(settings?.checklistActionTypes, [])
      );
      return enabledTypes.filter((exchangeType) => checklistTypeSet.has(exchangeType));
    }
    function shouldRunShopPurchases(settings, options = void 0) {
      if (options?.source !== "checklist") {
        return true;
      }
      return normalizeChecklistActionTypes(settings?.checklistActionTypes, []).includes(
        CHECKLIST_ACTION_SHOPS
      );
    }
    function buildExchangeSnapshotOptions(settings, options = void 0) {
      const enabledTypeSet = new Set(getEnabledExcessExchangeTypes(settings, options));
      return {
        includeHeroes: enabledTypeSet.has("heroes") || enabledTypeSet.has("heroArtifactFragments"),
        includeTitans: enabledTypeSet.has("titans") || enabledTypeSet.has("titanArtifactFragments"),
        includePets: enabledTypeSet.has("pets")
      };
    }
    function buildExcessExchangePlan(settings, snapshot, options = void 0) {
      const enabledTypeSet = new Set(getEnabledExcessExchangeTypes(settings, options));
      const exchangeInfo = buildExcessExchangeInfo(snapshot);
      const soulExchangePlan = SOUL_EXCHANGE_TYPES.filter(
        (exchangeType) => enabledTypeSet.has(exchangeType)
      ).map((exchangeType) => {
        const definition = SOUL_EXCHANGE_DEFINITIONS[exchangeType];
        const entries = exchangeInfo[exchangeType] ?? [];
        const stoneAmount = entries.reduce(
          (total, entry) => total + (Number(entry.amount) || 0),
          0
        );
        if (stoneAmount <= 0) {
          return null;
        }
        return {
          exchangeType,
          actionKind: "soulExchange",
          definition,
          entries,
          amount: stoneAmount,
          call: { ...definition.call }
        };
      }).filter(Boolean);
      const artifactFragmentSalePlan = ARTIFACT_FRAGMENT_SALE_TYPES.filter(
        (saleType) => enabledTypeSet.has(saleType)
      ).flatMap((saleType) => {
        const definition = ARTIFACT_FRAGMENT_SALE_DEFINITIONS[saleType];
        return (exchangeInfo[saleType] ?? []).map((entry) => ({
          exchangeType: saleType,
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
        }));
      });
      return [...soulExchangePlan, ...artifactFragmentSalePlan];
    }
    function getRewardCoinAmount(callResult, coinId) {
      const payload = callResult?.result?.response ?? callResult?.response ?? callResult ?? {};
      const reward = payload?.reward ?? payload;
      return Number(reward?.coin?.[coinId]) || 0;
    }
    function collectRewardBalanceEntries(callResult) {
      const payload = callResult?.result?.response ?? callResult?.response ?? callResult ?? {};
      const reward = payload?.reward ?? payload;
      const entries = [];
      const goldAmount = Number(reward?.gold) || 0;
      if (goldAmount > 0) {
        entries.push({
          key: "gold:0",
          label: getCurrencyName("gold:0"),
          amount: goldAmount
        });
      }
      Object.entries(reward?.coin ?? {}).forEach(([currencyId, amount]) => {
        const numericAmount = Number(amount) || 0;
        if (numericAmount <= 0) {
          return;
        }
        const key = `coin:${currencyId}`;
        entries.push({
          key,
          label: getCurrencyName(key),
          amount: numericAmount
        });
      });
      Object.entries(reward?.petcoin ?? {}).forEach(([currencyId, amount]) => {
        const numericAmount = Number(amount) || 0;
        if (numericAmount <= 0) {
          return;
        }
        const key = `petcoin:${currencyId}`;
        entries.push({
          key,
          label: getCurrencyName(key),
          amount: numericAmount
        });
      });
      return entries;
    }
    function ensureSoulCoinRewardBalance(rewardBalances, definition, coinAmount) {
      if (coinAmount <= 0 || !definition?.coinKey) {
        return rewardBalances;
      }
      if (rewardBalances.some((entry) => entry.key === definition.coinKey)) {
        return rewardBalances;
      }
      return [
        ...rewardBalances,
        {
          key: definition.coinKey,
          label: getCurrencyName(definition.coinKey),
          amount: coinAmount
        }
      ];
    }
    function summarizeExcessExchangeResults(exchangePlan, exchangeResults) {
      return (exchangePlan ?? []).map((entry, index) => {
        const result = exchangeResults?.[index];
        const success = isCallResultSucceeded(result);
        const coinAmount = success ? getRewardCoinAmount(result, entry.definition.coinId) : 0;
        const rewardBalances = success ? ensureSoulCoinRewardBalance(
          collectRewardBalanceEntries(result),
          entry.definition,
          coinAmount
        ) : [];
        const isArtifactFragmentSale = entry.actionKind === "artifactFragmentSale";
        return {
          exchangeType: entry.exchangeType,
          actionKind: entry.actionKind,
          label: isArtifactFragmentSale ? entry.entry.name : translate(entry.definition.shortLabelKey),
          groupLabel: translate(entry.definition.shortLabelKey),
          icon: entry.definition.icon,
          coinKey: entry.definition.coinKey,
          coinAmount,
          rewardBalances,
          amount: entry.amount,
          fragmentAmount: isArtifactFragmentSale ? entry.amount : 0,
          success,
          errorMessage: success ? "" : getCallResultErrorMessage(result)
        };
      });
    }
    function applyExchangeRewardsToBalances(balances, exchangeSummary) {
      const result = { ...balances ?? {} };
      (exchangeSummary ?? []).forEach((entry) => {
        if (!entry.success) {
          return;
        }
        (entry.rewardBalances ?? []).forEach((rewardEntry) => {
          result[rewardEntry.key] = (Number(result[rewardEntry.key]) || 0) + Number(rewardEntry.amount);
        });
      });
      return result;
    }
    async function executeExcessExchangeActions(exchangePlan) {
      if (!Array.isArray(exchangePlan) || exchangePlan.length <= 0) {
        return [];
      }
      setProgress(translate("HWHVACUUM_SOUL_EXCHANGE_PROGRESS"));
      const exchangeResults = await sendCallsInChunks(
        exchangePlan.map((entry) => entry.call)
      );
      return summarizeExcessExchangeResults(exchangePlan, exchangeResults);
    }
    async function sendCallsInChunks(calls, chunkSize = SHOP_REQUEST_CHUNK_SIZE) {
      const results = [];
      for (let index = 0; index < calls.length; index += chunkSize) {
        const chunkResults = await Caller.send(calls.slice(index, index + chunkSize));
        if (Array.isArray(chunkResults)) {
          results.push(...chunkResults);
        } else {
          results.push(chunkResults);
        }
      }
      return results;
    }
    function isCallResultSucceeded(callResult) {
      if (callResult?.error || callResult?.result?.error) {
        return false;
      }
      const payload = callResult?.result?.response ?? callResult?.response ?? callResult;
      return payload !== false && payload != null;
    }
    function getCallResultErrorMessage(callResult) {
      return callResult?.error?.description || callResult?.error?.message || callResult?.result?.error?.description || callResult?.result?.error?.message || "";
    }
    function buildResultRow(contentHtml, kind = "shop") {
      return buildResultRowMarkup(contentHtml, { kind });
    }
    function buildResultAccordionHtml({
      title,
      icon,
      rows,
      tone = "shop",
      rowKind = "shop",
      defaultOpen = true
    }) {
      return buildResultAccordionMarkup({
        title,
        icon,
        rows,
        tone,
        rowKind,
        defaultOpen,
        formatCount: formatNumber$1,
        buildInlineIcon: (iconName, tooltip) => buildInlineIcon(iconName, "", tooltip)
      });
    }
    function buildSummaryItemLine(label, amountText, icon = "package") {
      return `<span class="hwhx-summary-item" data-kind="shop">${buildInlineIcon(icon, "", label)}<span class="hwhx-summary-item__name">${escapeHtml$1(label)}</span><span class="hwhx-summary-item__amount">${escapeHtml$1(amountText)}</span></span>`;
    }
    function formatRewardBalanceSummary(rewardBalances) {
      return (rewardBalances ?? []).filter((entry) => Number(entry.amount) > 0).map((entry) => `${formatNumber$1(entry.amount)} ${entry.label}`).join(", ");
    }
    function buildRewardSuffix(rewardBalances) {
      const rewardText = formatRewardBalanceSummary(rewardBalances);
      return rewardText ? translate("HWHVACUUM_SUMMARY_REWARD_SUFFIX", { reward: rewardText }) : "";
    }
    function summarizeSuccessfulPurchases(plannedPurchases, purchaseResults, balances, finalBalances = void 0) {
      const purchasesByShop = /* @__PURE__ */ new Map();
      const spentByCurrency = /* @__PURE__ */ new Map();
      const failures = [];
      const remainingByCurrency = { ...balances ?? {} };
      purchaseResults.forEach((purchaseResult, index) => {
        const plannedPurchase = plannedPurchases[index];
        if (!plannedPurchase) {
          return;
        }
        if (!isCallResultSucceeded(purchaseResult)) {
          const errorMessage = getCallResultErrorMessage(purchaseResult);
          failures.push(
            `${plannedPurchase.shopName}, slot ${plannedPurchase.slotId}${errorMessage ? `: ${errorMessage}` : ""}`
          );
          return;
        }
        const currencyKey = plannedPurchase.cost.balanceKey;
        remainingByCurrency[currencyKey] = Math.max(
          0,
          (Number(remainingByCurrency[currencyKey]) || 0) - plannedPurchase.cost.amount
        );
        appendAmount(
          spentByCurrency,
          currencyKey,
          plannedPurchase.cost.currencyLabel,
          plannedPurchase.cost.amount,
          {
            remainingAmount: finalBalances?.[currencyKey] ?? remainingByCurrency[currencyKey]
          }
        );
        if (!purchasesByShop.has(plannedPurchase.shopId)) {
          purchasesByShop.set(plannedPurchase.shopId, {
            shopId: plannedPurchase.shopId,
            shopName: plannedPurchase.shopName,
            items: /* @__PURE__ */ new Map(),
            slots: 0
          });
        }
        const shopSummary = purchasesByShop.get(plannedPurchase.shopId);
        shopSummary.slots += 1;
        plannedPurchase.rewardItems.forEach((item) => {
          appendAmount(shopSummary.items, item.key, item.label, item.amount);
        });
      });
      return {
        purchasesByShop: [...purchasesByShop.values()],
        spentByCurrency: [...spentByCurrency.values()],
        failures,
        successCount: [...purchasesByShop.values()].reduce(
          (total, shopSummary) => total + shopSummary.slots,
          0
        )
      };
    }
    function buildResultProgressHtml(summary) {
      const exchangeRows = (summary.exchangeActions ?? []).map((entry) => {
        if (!entry.success) {
          const label = entry.actionKind === "artifactFragmentSale" ? `${entry.groupLabel}: ${entry.label}` : entry.label;
          return buildIconLabel(
            "alert-triangle",
            `${label}${entry.errorMessage ? `: ${entry.errorMessage}` : ""}`,
            "hwhx-danger"
          );
        }
        if (entry.actionKind === "artifactFragmentSale") {
          return buildIconLabel(
            entry.icon,
            translate("HWHVACUUM_SUMMARY_ARTIFACT_FRAGMENT_SALE_ROW", {
              group: entry.groupLabel,
              name: entry.label,
              amount: formatNumber$1(entry.fragmentAmount),
              reward: buildRewardSuffix(entry.rewardBalances)
            }),
            ""
          );
        }
        return buildIconLabel(
          entry.icon,
          translate("HWHVACUUM_SUMMARY_SOUL_EXCHANGE_ROW", {
            name: entry.label,
            amount: formatNumber$1(entry.coinAmount)
          }),
          ""
        );
      });
      const shopAccordions = summary.purchasesByShop.map((shopSummary, index) => {
        const definition = getShopDefinition(shopSummary.shopId);
        const rows = [...shopSummary.items.values()].map(
          (item) => buildSummaryItemLine(item.label, `x${formatNumber$1(item.amount)}`)
        );
        return buildResultAccordionHtml({
          title: shopSummary.shopName,
          icon: definition.icon,
          rows,
          tone: "shop",
          rowKind: "shop",
          defaultOpen: index === 0
        });
      }).join("");
      const spentRows = summary.spentByCurrency.map(
        (entry) => buildIconLabel(
          "coins",
          translate("HWHVACUUM_SUMMARY_SPENT_CURRENCY", {
            name: entry.label,
            spent: formatNumber$1(entry.amount),
            left: formatNumber$1(entry.remainingAmount)
          }),
          ""
        )
      );
      const failedRows = summary.failures.map(
        (message) => buildIconLabel("alert-triangle", message, "hwhx-danger")
      );
      return `<div class="hwhx-popup hwhx-popup--compact"><div class="hwhx-result-stack">${buildResultAccordionHtml({
        title: translate("HWHVACUUM_SUMMARY_SOUL_EXCHANGE"),
        icon: "sparkles",
        rows: exchangeRows,
        tone: "technical",
        rowKind: "technical",
        defaultOpen: true
      }) + (shopAccordions || buildResultRow(
        `<span class="hwhx-muted">${escapeHtml$1(translate("HWHVACUUM_SUMMARY_EMPTY_PURCHASES"))}</span>`,
        "technical"
      ))}${buildResultAccordionHtml({
        title: translate("HWHVACUUM_SUMMARY_SPENT"),
        icon: "coins",
        rows: spentRows.length > 0 ? spentRows : [escapeHtml$1(translate("HWHVACUUM_SUMMARY_EMPTY_SPENT"))],
        tone: "technical",
        rowKind: "spent",
        defaultOpen: true
      })}${buildResultAccordionHtml({
        title: translate("HWHVACUUM_SUMMARY_FAILED"),
        icon: "alert-triangle",
        rows: failedRows,
        tone: "technical",
        rowKind: "technical",
        defaultOpen: true
      })}</div></div>`;
    }
    function runGameSynchronization() {
      const refreshGame = globalThis.cheats?.refreshGame;
      if (typeof refreshGame !== "function") {
        return "";
      }
      refreshGame.call(globalThis.cheats);
      return `<br>${buildIconLabel("refresh-cw", translate("HWHVACUUM_POST_SYNC_DONE"), "")}`;
    }
    function buildPostRunSyncMessage(settings, options = void 0) {
      if (!settings?.syncAfterRun || options?.source === "checklist") {
        return "";
      }
      try {
        return runGameSynchronization();
      } catch (error) {
        console.error("[Vacuum] post-run sync failed", error);
        return `<br>${buildIconLabel(
          "refresh-cw",
          translate("HWHVACUUM_POST_SYNC_FAILED"),
          "hwhx-gold"
        )}`;
      }
    }
    async function fetchVacuumSnapshot(options = {}) {
      const includeExchangeData = !!options?.includeExchangeData;
      const includeHeroes = includeExchangeData || !!options?.includeHeroes;
      const includeTitans = includeExchangeData || !!options?.includeTitans;
      const includePets = includeExchangeData || !!options?.includePets;
      const calls = ["shopGetAll", "inventoryGet", "userGetInfo"];
      if (includeHeroes) {
        calls.push("heroGetAll");
      }
      if (includeTitans) {
        calls.push("titanGetAll");
      }
      if (includePets) {
        calls.push({
          name: "pet_getAll",
          args: {},
          ident: "pet_getAll"
        });
      }
      const results = await Caller.send(calls);
      const resultList = Array.isArray(results) ? results : [];
      let resultIndex = 0;
      const shops = resultList[resultIndex++];
      const inventory = resultList[resultIndex++];
      const userInfo = resultList[resultIndex++];
      const heroes = includeHeroes ? resultList[resultIndex++] : {};
      const titans = includeTitans ? resultList[resultIndex++] : {};
      const pets = includePets ? resultList[resultIndex++] : {};
      return {
        shops,
        inventory,
        userInfo,
        heroes: heroes ?? {},
        titans: titans ?? {},
        pets: pets?.result?.response ?? pets?.response ?? pets ?? {}
      };
    }
    async function runShopVacuum(settings, options = void 0) {
      try {
        setProgress(translate("HWHVACUUM_PROGRESS_PREPARE"));
        const snapshot = await fetchVacuumSnapshot(
          buildExchangeSnapshotOptions(settings, options)
        );
        const initialBalances = buildBalances(snapshot.inventory, snapshot.userInfo);
        const exchangePlan = buildExcessExchangePlan(settings, snapshot, options);
        const exchangeActions = await executeExcessExchangeActions(exchangePlan);
        const balances = applyExchangeRewardsToBalances(
          initialBalances,
          exchangeActions
        );
        const plan = shouldRunShopPurchases(settings, options) ? buildVacuumPlan(settings, snapshot.shops, balances) : { calls: [], plannedPurchases: [] };
        if (plan.calls.length === 0 && exchangeActions.length === 0) {
          setProgress(translate("HWHVACUUM_PROGRESS_NOTHING"), true);
          return;
        }
        let purchaseResults = [];
        if (plan.calls.length > 0) {
          setProgress(
            translate("HWHVACUUM_PROGRESS_RUNNING", {
              count: plan.calls.length
            })
          );
          purchaseResults = await sendCallsInChunks(plan.calls);
        }
        const finalSnapshot = plan.calls.length > 0 || exchangeActions.some((entry) => entry.success) ? await fetchVacuumSnapshot() : snapshot;
        const finalBalances = buildBalances(
          finalSnapshot.inventory,
          finalSnapshot.userInfo
        );
        const summary = summarizeSuccessfulPurchases(
          plan.plannedPurchases,
          purchaseResults,
          balances,
          finalBalances
        );
        summary.exchangeActions = exchangeActions;
        showResult(
          `${buildResultProgressHtml(summary)}${buildPostRunSyncMessage(
            settings,
            options
          )}`,
          {
            resultLabel: translate("HWHVACUUM_PROGRESS_DONE", {
              count: summary.successCount
            })
          }
        );
      } catch (error) {
        console.error("[Vacuum] Error:", error);
        setProgress(
          `${translate("HWHVACUUM_PROGRESS_ERROR")}<br>${escapeHtml$1(
            error?.message || translate("HWHVACUUM_ERROR_GENERIC")
          )}`,
          true
        );
      }
    }
    function getCurrentUserId(userInfo = void 0) {
      return String(
        userInfo?.id ?? HWHData?.user?.id ?? HWHData?.userId ?? globalThis.NXFlashVars?.user_id ?? ""
      ).trim() || "unknown";
    }
    function buildSettingsExportPayload$1(settings, userInfo = void 0) {
      return buildSettingsExportPayload({
        scriptId: "hwhvacuum",
        scriptName: String(GM_info?.script?.name ?? "HWH Shop Vacuum"),
        scriptVersion: String(GM_info?.script?.version ?? ""),
        exportVersion: SETTINGS_EXPORT_VERSION,
        storageSchemaVersion: STORAGE_SCHEMA_VERSION,
        userId: getCurrentUserId(userInfo),
        data: {
          settings: normalizeSettings(settings)
        }
      });
    }
    function buildSettingsExportFileName$1(userIdValue) {
      return buildSettingsExportFileName(userIdValue, "hwhvacuum.json");
    }
    function showSettingsNotice(message, iconName = "check", className = "hwhx-green") {
      showResult(buildIconLabel(iconName, String(message ?? ""), className));
    }
    async function exportSettingsToJson(settings, userInfo = void 0) {
      const exportPayload = buildSettingsExportPayload$1(settings, userInfo);
      downloadJsonFile(buildSettingsExportFileName$1(exportPayload.userId), exportPayload);
      showSettingsNotice(translate("HWHVACUUM_SETTINGS_EXPORT_DONE"));
    }
    function readSettingsImportPayload(value) {
      if (!value || typeof value !== "object" || value.scriptId !== "hwhvacuum") {
        throw new Error(translate("HWHVACUUM_SETTINGS_IMPORT_INVALID"));
      }
      if (!value.data || typeof value.data !== "object") {
        throw new Error(translate("HWHVACUUM_SETTINGS_IMPORT_INVALID"));
      }
      return normalizeSettings(value.data.settings);
    }
    async function importSettingsFromJson() {
      const fileText = await pickJsonFileText();
      if (fileText === void 0) {
        return false;
      }
      const parsedValue = parseJsonText(
        fileText,
        () => new Error(translate("HWHVACUUM_SETTINGS_IMPORT_PARSE_ERROR"))
      );
      writeSettings(readSettingsImportPayload(parsedValue));
      showSettingsNotice(translate("HWHVACUUM_SETTINGS_IMPORT_DONE"));
      return true;
    }
    async function openVacuumMenu() {
      await ensureAccordionFiltersLoaded();
      let settings = readSettings();
      while (true) {
        const snapshot = await fetchVacuumSnapshot({
          includeExchangeData: true
        });
        const modalActions = [
          {
            label: translate("HWHVACUUM_DISABLE_ALL_SHOPS"),
            result: "disableAllShops",
            icon: "trash-2",
            tone: "graphite"
          },
          {
            label: translate("HWHVACUUM_ENABLE_ALL_SHOPS"),
            result: "enableAllShops",
            icon: "check",
            tone: "green"
          },
          {
            label: translate("HWHVACUUM_SAVE"),
            result: "save",
            icon: "save",
            tone: "blue"
          },
          {
            label: translate("HWHVACUUM_RUN"),
            result: "run",
            icon: "play",
            tone: "green"
          }
        ];
        const modal = openVacuumNativePopup({
          bodyHtml: buildSettingsHtml(settings, snapshot),
          actions: modalActions,
          checkboxOptions: []
        });
        accordionFilterController.sync(modal.bodyNode ?? document);
        const answer = await modal.answerPromise;
        if (!answer) {
          return;
        }
        settings = readSettingsFromPopup(modal.bodyNode ?? document, settings);
        if (answer === "enableAllShops") {
          settings.enabledShops = createEnabledShopMap(true);
          settings = writeSettings(settings);
          continue;
        }
        if (answer === "disableAllShops") {
          settings.enabledShops = createEnabledShopMap(false);
          settings = writeSettings(settings);
          continue;
        }
        if (answer === "exportSettings") {
          settings = writeSettings(settings);
          await exportSettingsToJson(settings, snapshot.userInfo);
          continue;
        }
        if (answer === "importSettings") {
          try {
            if (await importSettingsFromJson()) {
              settings = readSettings();
            }
          } catch (error) {
            const message = error?.message || translate("HWHVACUUM_ERROR_GENERIC");
            console.error("[Vacuum] import failed", error);
            showSettingsNotice(
              translate("HWHVACUUM_SETTINGS_IMPORT_ERROR", { message }),
              "alert-triangle",
              "hwhx-danger"
            );
          }
          continue;
        }
        if (answer === "feedback") {
          settings = writeSettings(settings);
          openExternalUrl(FEEDBACK_URL);
          continue;
        }
        if (answer === "whatsNew") {
          settings = writeSettings(settings);
          openExternalUrl(VACUUM_VERSIONS_URL);
          continue;
        }
        settings = writeSettings(settings);
        if (answer === "save") {
          showSettingsNotice(translate("HWHVACUUM_SETTINGS_SAVED"));
          return;
        }
        if (answer === "run") {
          await runShopVacuum(settings);
          return;
        }
      }
    }
    function registerDoYourBestVacuumTask() {
      const DoYourBestClass = HWHClasses?.doYourBest;
      if (typeof DoYourBestClass !== "function") {
        return;
      }
      const RootDoYourBestClass = getDoYourBestRootBaseClass(DoYourBestClass);
      const doYourBestInstance = new DoYourBestClass();
      const currentTaskList = Array.isArray(doYourBestInstance.funcList) ? [...doYourBestInstance.funcList] : [];
      const existingTask = currentTaskList.find(isVacuumDoYourBestTask);
      const baseTaskList = currentTaskList.filter(
        (task) => !isVacuumDoYourBestTask(task)
      );
      const settings = readSettings();
      const checklistActionTypes = normalizeChecklistActionTypes(
        settings.checklistActionTypes,
        []
      );
      const checklistTask = {
        name: DO_YOUR_BEST_TASK_NAME,
        label: translate("HWHVACUUM_DO_YOUR_BEST"),
        checked: !!existingTask?.checked && checklistActionTypes.length > 0
      };
      if (settings.doYourBestPlacement !== DO_YOUR_BEST_PLACEMENT_NONE2) {
        const insertionIndex = getDoYourBestInsertionIndex(
          baseTaskList,
          settings.doYourBestPlacement
        );
        baseTaskList.splice(insertionIndex, 0, checklistTask);
      }
      const currentFunctions = {
        ...doYourBestInstance.functions ?? {},
        [DO_YOUR_BEST_TASK_NAME]: async () => {
          if (normalizeChecklistActionTypes(readSettings().checklistActionTypes, []).length <= 0) {
            return;
          }
          await runShopVacuum(readSettings(), { source: "checklist" });
        }
      };
      const currentTaskOrder = currentTaskList.map(getDoYourBestTaskName).join("");
      const nextTaskOrder = baseTaskList.map(getDoYourBestTaskName).join("");
      const handlerPresent = typeof doYourBestInstance.functions?.[DO_YOUR_BEST_TASK_NAME] === "function";
      if (currentTaskOrder === nextTaskOrder && handlerPresent) {
        return;
      }
      class VacuumDoYourBestExtension extends RootDoYourBestClass {
        constructor(resolve, reject, questInfo) {
          super(resolve, reject, questInfo);
          this.funcList = baseTaskList.map((task) => ({ ...task }));
          this.functions = { ...currentFunctions };
        }
      }
      HWHClasses.doYourBest = VacuumDoYourBestExtension;
    }
    async function openVacuumSafely() {
      await openVacuumMenu();
    }
    function createVacuumMainMenuButton() {
      return {
        get name() {
          return translate("HWHVACUUM_BUTTON");
        },
        get title() {
          return translate("HWHVACUUM_BUTTON_TITLE");
        },
        color: "pink",
        onClick: openVacuumSafely
      };
    }
    function createVacuumOtherMenuButton() {
      return {
        actionKey: VACUUM_ACTION_KEY,
        get msg() {
          return buildIconLabel("shopping-cart", translate("HWHVACUUM_BUTTON"), "");
        },
        get title() {
          return translate("HWHVACUUM_BUTTON_TITLE");
        },
        color: "pink",
        result: openVacuumSafely
      };
    }
    function syncVacuumActionPlacement(settings = void 0) {
      const placement = normalizeVacuumButtonPlacement(
        settings?.vacuumButtonPlacement ?? readSettings().vacuumButtonPlacement
      );
      syncScriptMenuActionPlacement({
        HWHData,
        mainMenuButtons,
        othersPopupButtons,
        placement,
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
  installHwhSharedRuntime({
    scriptId: "hwhvacuum",
    scriptName: "HWH Shop Vacuum"
  });
  initializeShopVacuumExtension(0);
})();
