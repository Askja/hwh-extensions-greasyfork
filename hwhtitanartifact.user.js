// ==UserScript==
// @name           HWH Titan Trainer
// @name:en        HWH Titan Trainer
// @namespace      http://tampermonkey.net/
// @version        1.3.3
// @updateURL      https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhtitanartifact.meta.js
// @downloadURL    https://raw.githubusercontent.com/Askja/hwh-extensions-greasyfork/main/hwhtitanartifact.user.js
// @description    Качает уровни, артефакты и облики выбранных титанов с лимитами ресурсов и настройками очередей.
// @description:en Levels selected titan levels, artifacts, and skins with resource reserves and configurable queues.
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
    label,
    icon = "",
    tone = "graphite",
    title = "",
    className = ""
  } = {}) {
    return `<button type="button" class="${escapeHtml$1(["hwhx-button", className].filter(Boolean).join(" "))}" data-action="${escapeHtml$1(result)}" data-tone="${escapeHtml$1(tone)}"${buildTooltipAttributeMarkup(title)}>${icon ? buildIconText(icon, label) : escapeHtml$1(label)}</button>`;
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
      buildSettingsAccordion,
      buildSettingsActionButton,
      buildSettingsCheckboxRow,
      buildSettingsField,
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
  function initializeTitanArtifactLeveler(attempt) {
    const initAttempt = Number(attempt) || 0;
    if (!retryHwhRuntimeInitialization({
      attempt: initAttempt,
      maxAttempts: 120,
      delayMs: 500,
      requiredKeys: ["HWHClasses", "HWHFuncs", "HWHData"],
      retry: initializeTitanArtifactLeveler,
      logPrefix: "[TitanArtifact]"
    })) {
      return;
    }
    const { HWHFuncs, HWHData, HWHClasses } = globalThis;
    const { addExtentionName: addExtensionName, I18N } = HWHFuncs;
    const progressController = globalThis.HWHSharedUI?.createProgressController?.({
      scriptId: "hwhtitanartifact",
      title: GM_info.script.name
    }) ?? null;
    if (!progressController) {
      throw new Error(
        "[hwhtitanartifact] HWHSharedUI.createProgressController is required."
      );
    }
    const {
      setProgress,
      showResult,
      configure: configureProgress
    } = progressController;
    const nativePopupBridge = globalThis.HWHSharedUI?.createNativePopupBridge?.({
      namespace: "hwhtitan"
    }) ?? null;
    const i18nLangData = HWHData.i18nLangData ?? (HWHData.i18nLangData = {});
    i18nLangData.en ?? (i18nLangData.en = {});
    i18nLangData.ru ?? (i18nLangData.ru = {});
    const mainMenuButtons = HWHData.buttons && typeof HWHData.buttons === "object" ? HWHData.buttons : HWHData.buttons = {};
    const othersPopupButtons = Array.isArray(HWHData.othersPopupButtons) ? HWHData.othersPopupButtons : HWHData.othersPopupButtons = [];
    const i18nLangDataEn = {
      HWHTITANART_START_LOG: "Starting extension {name} by {author} (v.{version})",
      HWHTITANART_RUNTIME_WAIT_ERROR: "Game runtime is still missing. The code is pretending not to exist again.",
      HWHTITANART_USER_ID_WAIT_ERROR: "userId still did not show up. The game decided to stay mysterious.",
      HWHTITANART_BUTTON: "Titan artifacts",
      HWHTITANART_BUTTON_TITLE: "Levels selected titan artifacts by the cheapest next upgrades first.",
      HWHTITANTRAINER_BUTTON: "Titans",
      HWHTITANTRAINER_BUTTON_TITLE: "Opens titan level, artifact and skin tools.",
      HWHTITANTRAINER_TAB_GENERAL: "General",
      HWHTITANTRAINER_TAB_ARTIFACTS: "Artifacts",
      HWHTITANTRAINER_TAB_LEVELS: "Levels",
      HWHTITANTRAINER_TAB_SKINS: "Skins",
      HWHTITANTRAINER_TECH_SECTION: "Additional",
      HWHTITANTRAINER_DONATE_TITLE: "Project support",
      HWHTITANTRAINER_DONATE_TEXT: "If the script saves you time, you can support the project with a coin.",
      HWHTITANTRAINER_DONATE_WALLET: "YooMoney wallet: {wallet}",
      HWHTITANTRAINER_EXPORT_SETTINGS: "Export settings",
      HWHTITANTRAINER_IMPORT_SETTINGS: "Import settings",
      HWHTITANTRAINER_RUN_ACTIVE: "Run current tab",
      HWHTITANTRAINER_INTERFACE_SECTION: "Interface and information panel",
      HWHTITANTRAINER_UI_TOOLTIPS: "Show interface tooltips",
      HWHTITANTRAINER_PROGRESS_AUTO_HIDE_RESULT: "Hide result window by timeout",
      HWHTITANTRAINER_PROGRESS_AUTO_HIDE_TIMEOUT: "Result timeout, sec.",
      HWHTITANTRAINER_PROGRESS_POSITION: "Result window position",
      HWHTITANTRAINER_PROGRESS_POSITION_TOP_CENTER: "Top center",
      HWHTITANTRAINER_PROGRESS_POSITION_TOP_RIGHT: "Top right",
      HWHTITANTRAINER_PROGRESS_POSITION_BOTTOM_RIGHT: "Bottom right",
      HWHTITANTRAINER_PROGRESS_STYLE: "Result window style",
      HWHTITANTRAINER_PROGRESS_STYLE_DEFAULT: "Default",
      HWHTITANTRAINER_PROGRESS_STYLE_COMPACT: "Compact",
      HWHTITANTRAINER_PROGRESS_THEME: "Result window theme",
      HWHTITANTRAINER_PROGRESS_THEME_DEFAULT: "Default",
      HWHTITANTRAINER_PROGRESS_THEME_GRAPHITE: "Graphite",
      HWHTITANTRAINER_PROGRESS_THEME_GREEN: "Green",
      HWHTITANTRAINER_PROGRESS_THEME_GOLD: "Gold",
      HWHTITANTRAINER_PROGRESS_THEME_DANGER: "Danger",
      HWHTITANTRAINER_SETTINGS_EXPORT_DONE: "Settings exported to JSON.",
      HWHTITANTRAINER_SETTINGS_IMPORT_DONE: "Settings imported.",
      HWHTITANTRAINER_SETTINGS_IMPORT_INVALID: "This JSON is not a HWH Titan Trainer settings export.",
      HWHTITANTRAINER_SETTINGS_IMPORT_PARSE_ERROR: "Could not parse JSON settings.",
      HWHTITANTRAINER_SETTINGS_IMPORT_ERROR: "Settings import failed: {message}",
      HWHTITANART_TITLE: "Titan artifact settings",
      HWHTITANART_DESCRIPTION: "Select titans for artifact leveling. The queue is built from the cheapest next levels, not from random blind enthusiasm.",
      HWHTITANART_SELECTED: "Selected titans",
      HWHTITANART_TITAN_LIST_HEADER: "Titan list",
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
      HWHTITANART_FRAGMENT_COIN_RESERVE: "Element tournament coin reserve",
      HWHTITANART_FRAGMENT_COIN_RESOURCE: "Element tournament coins",
      HWHTITAN_TOOLTIP_LEVELING_MODE: "Max mode spends the available budget up to limits. Amount mode asks for a run cap.",
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
      HWHTITANART_SETTINGS_SAVED: "saved",
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
      HWHTITANLVL_EVOLVE_TARGETS: "Titans to evolve",
      HWHTITANLVL_EVOLUTION_MAX_STAR: "Maximum titan star",
      HWHTITANLVL_SUMMARY_EVOLUTIONS: "Titan evolutions",
      HWHTITANLVL_SUMMARY_EMPTY_EVOLUTIONS: "No titan evolutions.",
      HWHTITANLVL_PROGRESS_EVOLVE: "Evolving {titanName}: {fromStar} → {toStar}",
      HWHTITANLVL_RUN: "Start leveling",
      HWHTITANLVL_SELECT_TITANS_FIRST: "Select titans first. The script is still not a fortune teller.",
      HWHTITANLVL_NOTHING_TO_LEVEL: "Nothing to level. Either potions are gone, or selected titans already hit the ceiling.",
      HWHTITANLVL_PROGRESS_PLAN: "Building the titan level queue. We are trying not to waste potions like amateurs.",
      HWHTITANLVL_PROGRESS_UPGRADE: "Leveling {titanName} · {fromLevel} → {toLevel}",
      HWHTITANLVL_PROGRESS_DONE: "Titan leveling complete. {count} upgrades went through.",
      HWHTITANLVL_PROGRESS_ERROR: "Titan leveling crashed. The console already knows why, probably.",
      HWHTITANLVL_SUMMARY_LEVELS: "Titan levels",
      HWHTITANLVL_SUMMARY_SPENT: "Spent",
      HWHTITANLVL_SUMMARY_EMPTY: "Nothing was leveled. The potion stash survives for another day.",
      HWHTITANLVL_SUMMARY_RESOURCE: "{resourceName}: -{spentAmount} ({leftAmount})",
      HWHTITANLVL_RESOURCE_FALLBACK: "Titan potion",
      HWHTITANLVL_EVOLUTION_ABSOLUTE: "ABS",
      HWHTITANSKIN_BUTTON: "Titan skins",
      HWHTITANSKIN_BUTTON_TITLE: "Levels selected titan skins by the cheapest next upgrades first.",
      HWHTITANSKIN_TITLE: "Titan skin settings",
      HWHTITANSKIN_DESCRIPTION: "Select titans for skin leveling. The queue is built from the cheapest next upgrades, not from panic spending into the first shiny thing.",
      HWHTITANSKIN_RESOURCE: "Skin stones",
      HWHTITANSKIN_RESERVE: "Skin stone reserve",
      HWHTITANSKIN_FILTER: "Skins to level",
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
    const i18nLangDataRu = {
      HWHTITANART_START_LOG: "Старт расширения {name} от {author} (v.{version})",
      HWHTITANART_RUNTIME_WAIT_ERROR: "Игровой рантайм ещё не загрузился. Код снова делает вид, что его нет.",
      HWHTITANART_USER_ID_WAIT_ERROR: "userId так и не появился. Игра решила поиграть в загадочность.",
      HWHTITANART_BUTTON: "Артефакты титанов",
      HWHTITANART_BUTTON_TITLE: "Качает артефакты выбранных титанов, начиная с самых дешевых следующих уровней.",
      HWHTITANTRAINER_BUTTON: "Титаны",
      HWHTITANTRAINER_BUTTON_TITLE: "Открывает прокачку уровней, артефактов и обликов титанов.",
      HWHTITANTRAINER_TAB_GENERAL: "Общее",
      HWHTITANTRAINER_TAB_ARTIFACTS: "Артефакты",
      HWHTITANTRAINER_TAB_LEVELS: "Уровни",
      HWHTITANTRAINER_TAB_SKINS: "Облики",
      HWHTITANTRAINER_TECH_SECTION: "Дополнительно",
      HWHTITANTRAINER_DONATE_TITLE: "Поддержка проекта",
      HWHTITANTRAINER_DONATE_TEXT: "Если скрипт экономит время и нервы, проект можно поддержать монетой.",
      HWHTITANTRAINER_DONATE_WALLET: "ЮMoney: {wallet}",
      HWHTITANTRAINER_EXPORT_SETTINGS: "Экспорт настроек",
      HWHTITANTRAINER_IMPORT_SETTINGS: "Импорт настроек",
      HWHTITANTRAINER_RUN_ACTIVE: "Запустить вкладку",
      HWHTITANTRAINER_INTERFACE_SECTION: "Интерфейс и информационная панель",
      HWHTITANTRAINER_UI_TOOLTIPS: "Показывать всплывающие подсказки",
      HWHTITANTRAINER_PROGRESS_AUTO_HIDE_RESULT: "Скрывать окно результата по таймауту",
      HWHTITANTRAINER_PROGRESS_AUTO_HIDE_TIMEOUT: "Таймаут результата, сек.",
      HWHTITANTRAINER_PROGRESS_POSITION: "Положение окна результата",
      HWHTITANTRAINER_PROGRESS_POSITION_TOP_CENTER: "Сверху по центру",
      HWHTITANTRAINER_PROGRESS_POSITION_TOP_RIGHT: "Правый верхний угол",
      HWHTITANTRAINER_PROGRESS_POSITION_BOTTOM_RIGHT: "Правый нижний угол",
      HWHTITANTRAINER_PROGRESS_STYLE: "Стиль окна результата",
      HWHTITANTRAINER_PROGRESS_STYLE_DEFAULT: "Обычный",
      HWHTITANTRAINER_PROGRESS_STYLE_COMPACT: "Компактный",
      HWHTITANTRAINER_PROGRESS_THEME: "Тема окна результата",
      HWHTITANTRAINER_PROGRESS_THEME_DEFAULT: "Обычная",
      HWHTITANTRAINER_PROGRESS_THEME_GRAPHITE: "Графит",
      HWHTITANTRAINER_PROGRESS_THEME_GREEN: "Зеленая",
      HWHTITANTRAINER_PROGRESS_THEME_GOLD: "Золотая",
      HWHTITANTRAINER_PROGRESS_THEME_DANGER: "Опасная",
      HWHTITANTRAINER_SETTINGS_EXPORT_DONE: "Настройки выгружены в JSON.",
      HWHTITANTRAINER_SETTINGS_IMPORT_DONE: "Настройки импортированы.",
      HWHTITANTRAINER_SETTINGS_IMPORT_INVALID: "Этот JSON не похож на экспорт HWH Titan Trainer.",
      HWHTITANTRAINER_SETTINGS_IMPORT_PARSE_ERROR: "Не удалось прочитать JSON настроек.",
      HWHTITANTRAINER_SETTINGS_IMPORT_ERROR: "Импорт настроек упал: {message}",
      HWHTITANART_TITLE: "Настройки артефактов титанов",
      HWHTITANART_DESCRIPTION: "Выбери титанов для прокачки. Очередь строится по самым дешёвым следующим уровням, а не по рандомному «ну давай сольём всё в одного».",
      HWHTITANART_SELECTED: "Выбрано титанов",
      HWHTITANART_TITAN_LIST_HEADER: "Список титанов",
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
      HWHTITANART_FRAGMENT_COIN_RESERVE: "Остаток монет турнира стихий",
      HWHTITANART_FRAGMENT_COIN_RESOURCE: "Монеты турнира стихий",
      HWHTITAN_TOOLTIP_LEVELING_MODE: "Максимум тратит доступный бюджет до лимитов. N-уровни спрашивают ограничение на запуск.",
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
      HWHTITANART_SETTINGS_SAVED: "сохранено",
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
      HWHTITANLVL_EVOLVE_TARGETS: "Каких титанов эволюционировать",
      HWHTITANLVL_EVOLUTION_MAX_STAR: "Максимальная звезда титана",
      HWHTITANLVL_SUMMARY_EVOLUTIONS: "Эволюция титанов",
      HWHTITANLVL_SUMMARY_EMPTY_EVOLUTIONS: "Эволюции титанов не было.",
      HWHTITANLVL_PROGRESS_EVOLVE: "Эволюция {titanName}: {fromStar} → {toStar}",
      HWHTITANLVL_RUN: "Запустить прокачку",
      HWHTITANLVL_SELECT_TITANS_FIRST: "Сначала выбери титанов. Скрипт всё ещё не обязан угадывать твои планы.",
      HWHTITANLVL_NOTHING_TO_LEVEL: "Качать нечего. Либо зелья закончились, либо выбранные титаны уже упёрлись в потолок.",
      HWHTITANLVL_PROGRESS_PLAN: "Строим очередь уровней титанов. Пытаемся не сливать зелья как последние варвары.",
      HWHTITANLVL_PROGRESS_UPGRADE: "Качаем {titanName} · {fromLevel} → {toLevel}",
      HWHTITANLVL_PROGRESS_DONE: "Прокачка титанов закончена. Протолкнули {count} улучшений.",
      HWHTITANLVL_PROGRESS_ERROR: "Прокачка титанов рухнула. Консоль, как обычно, уже всё знает.",
      HWHTITANLVL_SUMMARY_LEVELS: "Уровни титанов",
      HWHTITANLVL_SUMMARY_SPENT: "Потратили",
      HWHTITANLVL_SUMMARY_EMPTY: "Ничего не прокачали. Склад зелий пока жив.",
      HWHTITANLVL_SUMMARY_RESOURCE: "{resourceName}: -{spentAmount} ({leftAmount})",
      HWHTITANLVL_RESOURCE_FALLBACK: "Зелье титанов",
      HWHTITANLVL_EVOLUTION_ABSOLUTE: "ABS",
      HWHTITANSKIN_BUTTON: "Облики титанов",
      HWHTITANSKIN_BUTTON_TITLE: "Качает облики выбранных титанов, начиная с самых дешёвых следующих уровней.",
      HWHTITANSKIN_TITLE: "Настройки обликов титанов",
      HWHTITANSKIN_DESCRIPTION: "Выбери титанов для прокачки обликов. Очередь строится по самым дешёвым следующим апам, а не по паническому сливу монет в первую блестяшку.",
      HWHTITANSKIN_RESOURCE: "Монеты обликов",
      HWHTITANSKIN_RESERVE: "Остаток монет обликов",
      HWHTITANSKIN_FILTER: "Какие облики качать",
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
    installScriptTranslations(i18nLangData, {
      en: i18nLangDataEn,
      ru: i18nLangDataRu
    });
    const SETTINGS_STORAGE_PREFIX = "hwhtitanartifact_settings_";
    const ACCORDION_STATE_STORAGE_PREFIX = "hwhtitantrainer_accordions_";
    const DO_YOUR_BEST_PLACEMENT_STORAGE_KEY = "hwhtitanartifact_do_your_best_placement";
    const TITAN_TRAINER_BUTTON_PLACEMENT_STORAGE_KEY = "hwhtitantrainer_button_placement";
    const STORAGE_SCHEMA_VERSION = 2;
    const USER_ID_WAIT_TIMEOUT_MS = 6e4;
    const USER_ID_POLL_DELAY_MS = 250;
    const TITAN_RESOURCE_CONSUMABLE_ID = 53;
    const TITAN_ARTIFACT_FRAGMENT_SHOP_ID = 13;
    const TITAN_ARTIFACT_FRAGMENT_COIN_ID = 18;
    const TITAN_ARTIFACT_FRAGMENT_MIN_PURCHASE_AMOUNT = 10;
    const ARTIFACT_SLOT_IDS = [0, 1, 2];
    const ARTIFACT_SLOT_ID_SET = new Set(ARTIFACT_SLOT_IDS);
    const TITAN_UPGRADE_REQUEST_CHUNK_SIZE = 20;
    const LEVELING_MODE_MAX = "max";
    const LEVELING_MODE_AMOUNT = "amount";
    const CHECKLIST_AMOUNT_BEHAVIOR_SKIP = "skip";
    const CHECKLIST_AMOUNT_BEHAVIOR_DEFAULT = "default";
    const CHECKLIST_FRAGMENT_BEHAVIOR_USE_SETTINGS = "use-settings";
    const CHECKLIST_FRAGMENT_BEHAVIOR_SKIP = "skip";
    const TITAN_TRAINER_BUTTON_PLACEMENT_MAIN = "main";
    const TITAN_TRAINER_BUTTON_PLACEMENT_OTHER = "other";
    const TITAN_TRAINER_ACTION_KEY = "hwhTitanTrainerAction";
    const TITAN_TRAINER_TAB_INPUT_ID = "hwhtitantrainer-active-tab";
    const PROGRESS_AUTO_HIDE_RESULT_INPUT_ID = "hwhtitantrainer-progress-auto-hide-result";
    const PROGRESS_AUTO_HIDE_TIMEOUT_INPUT_ID = "hwhtitantrainer-progress-auto-hide-timeout";
    const PROGRESS_POSITION_INPUT_ID = "hwhtitantrainer-progress-position";
    const PROGRESS_STYLE_INPUT_ID = "hwhtitantrainer-progress-style";
    const PROGRESS_THEME_INPUT_ID = "hwhtitantrainer-progress-theme";
    const TITAN_TRAINER_BUTTON_PLACEMENT_INPUT_ID = "hwhtitantrainer-button-placement";
    const TITAN_TRAINER_TAB_GENERAL = "general";
    const TITAN_TRAINER_TAB_ARTIFACTS = "artifacts";
    const TITAN_TRAINER_TAB_LEVELS = "levels";
    const TITAN_TRAINER_TAB_SKINS = "skins";
    const TITAN_XP_RESOURCE_CONSUMABLE_ID = 20;
    const TITAN_SKIN_RESOURCE_COIN_ID = 24;
    const DO_YOUR_BEST_TITAN_ARTIFACT_TASK_NAME = "runTitanArtifactChecklistTask";
    const DO_YOUR_BEST_TITAN_LEVEL_TASK_NAME = "runTitanLevelChecklistTask";
    const DO_YOUR_BEST_TITAN_SKIN_TASK_NAME = "runTitanSkinChecklistTask";
    const DO_YOUR_BEST_PLACEMENT_NONE2 = "none";
    const DO_YOUR_BEST_PLACEMENT_END2 = "end";
    const DO_YOUR_BEST_PLACEMENT_AFTER_PREFIX2 = "after:";
    const DO_YOUR_BEST_PLACEMENT_SELECT_ID_PREFIX = "hwhtitanartifact-do-your-best-placement";
    const ESSENCE_RESERVE_INPUT_ID = "hwhtitanartifact-essence-reserve";
    const ARTIFACT_GOLD_RESERVE_INPUT_ID = "hwhtitanartifact-gold-reserve";
    const ARTIFACT_FRAGMENT_COIN_RESERVE_INPUT_ID = "hwhtitanartifact-fragment-coin-reserve";
    const ARTIFACT_EVOLVE_INPUT_ID = "hwhtitanartifact-evolve-artifacts";
    const ARTIFACT_BUY_FRAGMENTS_INPUT_ID = "hwhtitanartifact-buy-fragments";
    const ARTIFACT_EVOLVE_TARGETS_INPUT_ID = "hwhtitanartifact-evolve-targets";
    const ARTIFACT_FRAGMENT_BUY_TARGETS_INPUT_ID = "hwhtitanartifact-fragment-buy-targets";
    const ARTIFACT_EVOLUTION_MAX_STAR_INPUT_ID = "hwhtitanartifact-evolution-max-star";
    const UI_TOOLTIPS_INPUT_ID = "hwhtitantrainer-ui-tooltips";
    const ARTIFACT_LEVELING_MODE_SELECT_ID = "hwhtitanartifact-leveling-mode";
    const ARTIFACT_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID = "hwhtitanartifact-checklist-amount-behavior";
    const ARTIFACT_CHECKLIST_AMOUNT_INPUT_ID = "hwhtitanartifact-checklist-amount";
    const ARTIFACT_CHECKLIST_FRAGMENT_BEHAVIOR_SELECT_ID = "hwhtitanartifact-checklist-fragment-behavior";
    const LEVELING_AMOUNT_PROMPT_INPUT_ID = "hwhtitanartifact-leveling-amount-prompt";
    const SHOW_FULL_COST_INPUT_ID = "hwhtitanartifact-show-full-cost";
    const SHOW_LEVEL_COST_INPUT_ID = "hwhtitanlevel-show-next-cost";
    const SHOW_LEVEL_EVOLUTION_INPUT_ID = "hwhtitanlevel-show-evolution";
    const SHOW_SKIN_COST_INPUT_ID = "hwhtitanskin-show-next-cost";
    const TITAN_SELECTION_INPUT_PREFIX = "hwhtitan-selection-";
    const SLOT_FILTER_INPUT_PREFIX = "hwhtitanartifact-slot-filter-";
    const ARTIFACT_LEVEL_CAP_INPUT_PREFIX = "hwhtitanartifact-level-cap-";
    const LEVEL_SETTINGS_STORAGE_PREFIX = "hwhtitanlevel_settings_";
    const POTION_RESERVE_INPUT_ID = "hwhtitanlevel-potion-reserve";
    const TITAN_LEVELING_MODE_SELECT_ID = "hwhtitanlevel-leveling-mode";
    const TITAN_LEVEL_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID = "hwhtitanlevel-checklist-amount-behavior";
    const TITAN_LEVEL_CHECKLIST_AMOUNT_INPUT_ID = "hwhtitanlevel-checklist-amount";
    const TITAN_LEVEL_CAP_INPUT_ID = "hwhtitanlevel-max-level";
    const TITAN_EVOLVE_TARGETS_INPUT_ID = "hwhtitanlevel-evolve-targets";
    const TITAN_EVOLUTION_MAX_STAR_INPUT_ID = "hwhtitanlevel-evolution-max-star";
    const SKIN_SETTINGS_STORAGE_PREFIX = "hwhtitanskin_settings_";
    const artifactSettingsStorage = new VersionedStorage({
      keyPrefix: SETTINGS_STORAGE_PREFIX,
      schemaVersion: STORAGE_SCHEMA_VERSION
    });
    const levelSettingsStorage = new VersionedStorage({
      keyPrefix: LEVEL_SETTINGS_STORAGE_PREFIX,
      schemaVersion: STORAGE_SCHEMA_VERSION
    });
    const skinSettingsStorage = new VersionedStorage({
      keyPrefix: SKIN_SETTINGS_STORAGE_PREFIX,
      schemaVersion: STORAGE_SCHEMA_VERSION
    });
    const doYourBestPlacementStorage = new VersionedStorage({
      keyPrefix: DO_YOUR_BEST_PLACEMENT_STORAGE_KEY,
      schemaVersion: STORAGE_SCHEMA_VERSION
    });
    const accordionStateStorage = new VersionedStorage({
      keyPrefix: ACCORDION_STATE_STORAGE_PREFIX,
      schemaVersion: STORAGE_SCHEMA_VERSION
    });
    const SKIN_RESERVE_INPUT_ID = "hwhtitanskin-reserve";
    const SKIN_LEVELING_MODE_SELECT_ID = "hwhtitanskin-leveling-mode";
    const SKIN_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID = "hwhtitanskin-checklist-amount-behavior";
    const SKIN_CHECKLIST_AMOUNT_INPUT_ID = "hwhtitanskin-checklist-amount";
    const SKIN_FILTER_INPUT_PREFIX = "hwhtitanskin-filter-";
    const SKIN_LEVEL_CAP_INPUT_PREFIX = "hwhtitanskin-level-cap-";
    const ARTIFACT_CALC_TITAN_SELECT_ID = "hwhtitanartifact-calc-titan";
    const ARTIFACT_CALC_SLOT_SELECT_ID = "hwhtitanartifact-calc-slot";
    const ARTIFACT_CALC_START_INPUT_ID = "hwhtitanartifact-calc-start";
    const ARTIFACT_CALC_END_INPUT_ID = "hwhtitanartifact-calc-end";
    const ARTIFACT_CALC_RESULT_ID = "hwhtitanartifact-calc-result";
    const LEVEL_CALC_TITAN_SELECT_ID = "hwhtitanlevel-calc-titan";
    const LEVEL_CALC_START_INPUT_ID = "hwhtitanlevel-calc-start";
    const LEVEL_CALC_END_INPUT_ID = "hwhtitanlevel-calc-end";
    const LEVEL_CALC_RESULT_ID = "hwhtitanlevel-calc-result";
    const SKIN_CALC_TITAN_SELECT_ID = "hwhtitanskin-calc-titan";
    const SKIN_CALC_GROUP_SELECT_ID = "hwhtitanskin-calc-group";
    const SKIN_CALC_START_INPUT_ID = "hwhtitanskin-calc-start";
    const SKIN_CALC_END_INPUT_ID = "hwhtitanskin-calc-end";
    const SKIN_CALC_RESULT_ID = "hwhtitanskin-calc-result";
    const FEEDBACK_URL = "https://t.me/askja_tlgrm";
    const TITAN_TRAINER_VERSIONS_URL = "https://greasyfork.org/ru/scripts/571808-hwh-titan-trainer/versions";
    const runtimeState = {
      gameRuntimePromise: void 0,
      userIdPromise: void 0,
      userId: void 0,
      accordionState: void 0,
      accordionStateLoaded: false
    };
    const titanAccordionStateController = createAccordionStateController({
      storage: accordionStateStorage,
      getUserId: ensureUserIdReady,
      runtimeState,
      loadedKey: "accordionStateLoaded",
      keyAttributeName: "data-hwhtitan-accordion-key",
      defaultOpenAttributeName: "data-hwhtitan-accordion-default-open",
      boundAttributeName: "data-hwhtitan-accordion-bound",
      selector: "details[data-hwhtitan-accordion-key]"
    });
    let configTitanIdsCache = void 0;
    let maxTitanLevelCache = void 0;
    let titanSkinGroupsCache = void 0;
    const titanSkinInfoCache = /* @__PURE__ */ new Map();
    const defaultTitanSkinLevelCapCache = /* @__PURE__ */ new Map();
    const titanArtifactConfigCache = /* @__PURE__ */ new Map();
    const defaultArtifactLevelCapCache = /* @__PURE__ */ new Map();
    const DEFAULT_SETTINGS = {
      selectedTitanIds: [],
      selectedArtifactSlotIds: [0, 1],
      levelingMode: LEVELING_MODE_MAX,
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
      uiTooltipsEnabled: true,
      progressAutoHideResult: false,
      progressAutoHideResultTimeoutMs: 5e3,
      progressWindowPosition: "top-right",
      progressWindowStyle: "default",
      progressWindowTheme: "default",
      titanTrainerButtonPlacement: TITAN_TRAINER_BUTTON_PLACEMENT_MAIN,
      artifactLevelCaps: []
    };
    const DEFAULT_LEVEL_SETTINGS = {
      selectedTitanIds: [],
      levelingMode: LEVELING_MODE_MAX,
      checklistAmountBehavior: CHECKLIST_AMOUNT_BEHAVIOR_SKIP,
      checklistLevelingAmount: 1,
      potionReserve: 0,
      showNextCosts: false,
      showEvolutionProgress: true,
      syncAfterRun: false,
      maxTitanLevel: void 0,
      selectedTitanEvolutionIds: [],
      titanEvolutionMaxStar: void 0
    };
    const DEFAULT_SKIN_SETTINGS = {
      selectedTitanIds: [],
      selectedSkinLocaleKeys: [],
      levelingMode: LEVELING_MODE_MAX,
      checklistAmountBehavior: CHECKLIST_AMOUNT_BEHAVIOR_SKIP,
      checklistLevelingAmount: 1,
      skinStoneReserve: 0,
      showNextCosts: false,
      syncAfterRun: false,
      skinLevelCaps: {}
    };
    function translate(key, replacements = {}) {
      let text = typeof I18N === "function" && I18N(key) || i18nLangData.ru?.[key] || i18nLangData.en?.[key] || key;
      Object.entries(replacements).forEach(([placeholder, value]) => {
        text = text.replace(new RegExp(`\\{${placeholder}\\}`, "g"), String(value));
      });
      return text;
    }
    function delay(milliseconds) {
      return new Promise((resolve) => {
        globalThis.setTimeout(resolve, milliseconds);
      });
    }
    function buildInlineIcon(iconName, className = "hwhx-title-accent", title = "") {
      return buildInlineIconMarkup(iconName, { className, title });
    }
    function buildIconLabel(iconName, label, className = "hwhx-title-accent", title = "") {
      return buildIconLabelMarkup(iconName, label, {
        iconClassName: className,
        title
      });
    }
    function formatNumber$1(value) {
      return formatNumber(value, { locale: "ru-RU" });
    }
    function formatSignedNumber$1(value) {
      return formatSignedNumber(value, { locale: "ru-RU" });
    }
    function logArtifactFragmentDebug(message, data = void 0) {
      if (data === void 0) {
        console.log("[hwhtitanartifact:fragments]", message);
        return;
      }
      console.log("[hwhtitanartifact:fragments]", message, data);
    }
    function showProgressMessage(content) {
      setProgress(content);
    }
    function showFinalProgress(content) {
      showResult(content);
    }
    function applyTitanTrainerUiPreferences(settings = DEFAULT_SETTINGS) {
      const sharedUi = globalThis.HWHSharedUI;
      if (!sharedUi) {
        return;
      }
      sharedUi.tooltipsEnabled = settings?.uiTooltipsEnabled !== false;
      configureProgress(settings);
      syncTitanTrainerActionPlacement(settings);
      if (sharedUi.tooltipsEnabled) {
        return;
      }
      document.querySelectorAll(".hwhx-tooltip").forEach((tooltipNode) => tooltipNode.remove());
    }
    function runGameSynchronization() {
      const refreshGame = globalThis.cheats?.refreshGame;
      if (typeof refreshGame !== "function") {
        return "";
      }
      refreshGame.call(globalThis.cheats);
      return `<br>${buildIconLabel("refresh-cw", translate("HWHTITANART_POST_SYNC_DONE"))}`;
    }
    function buildPostRunSyncMessage(settings, options = void 0) {
      if (!settings?.syncAfterRun || options?.source === "checklist") {
        return "";
      }
      try {
        return runGameSynchronization();
      } catch (error) {
        console.error("[TitanArtifact] post-run sync failed", error);
        return `<br>${buildIconLabel("refresh-cw", translate("HWHTITANART_POST_SYNC_FAILED"), "hwhx-gold")}`;
      }
    }
    async function refreshTitanSnapshotAfterRun() {
      try {
        await fetchTitanSnapshot(true, true);
      } catch (error) {
        console.error("[TitanArtifact] post-run snapshot refresh failed", error);
      }
    }
    function openTitanNativePopup({
      popupKind = "generic",
      title = void 0,
      bodyHtml,
      actions = [],
      checkboxOptions = [],
      includeNativeClose = true
    }) {
      if (!nativePopupBridge) {
        throw new Error(
          "[hwhtitanartifact] HWHSharedUI.createNativePopupBridge is required (shared UI kit)."
        );
      }
      return nativePopupBridge.open({
        popupKind,
        title,
        bodyHtml,
        actions,
        checkboxOptions,
        includeNativeClose
      });
    }
    async function bindTitanAccordionUi(rootNode) {
      if (!(rootNode instanceof HTMLElement)) {
        return;
      }
      await titanAccordionStateController.bind(rootNode);
      const controllerFactory = globalThis.HWHSharedUI?.createAccordionFilterController;
      if (typeof controllerFactory !== "function") {
        return;
      }
      const controller = controllerFactory({
        storageKeyPrefix: "hwhtitantrainer_accordion_filters_",
        schemaVersion: STORAGE_SCHEMA_VERSION,
        getUserId: ensureUserIdReady,
        formatNumber: formatNumber$1,
        labels: {
          active: "Активные: {count}",
          inactive: "Неактивные: {count}",
          empty: "Вхождений нет"
        },
        rowSelector: "[data-hwhx-accordion-filter-row]"
      });
      await controller.load();
      controller.sync(rootNode);
    }
    function getArtifactSlotMeta(slotId) {
      const numericSlotId = Number(slotId);
      if (numericSlotId === 0) {
        return {
          icon: "swords",
          className: "hwhx-gold",
          label: translate("HWHTITANART_ARTIFACT_WEAPON")
        };
      }
      if (numericSlotId === 1) {
        return {
          icon: "trophy",
          className: "hwhx-purple",
          label: translate("HWHTITANART_ARTIFACT_CROWN")
        };
      }
      return {
        icon: "gem",
        className: "hwhx-gold",
        label: translate("HWHTITANART_ARTIFACT_SEAL")
      };
    }
    function getArtifactLevelColor(colorName) {
      const normalizedColorName = String(colorName ?? "").toLowerCase();
      if (/(brown|корич)/.test(normalizedColorName)) {
        return "#8d6e63";
      }
      if (/(red|крас)/.test(normalizedColorName)) {
        return "#d9534f";
      }
      if (/(orange|gold|yellow|оранж|желт)/.test(normalizedColorName)) {
        return "#f0ad4e";
      }
      if (/(violet|purple|фиол|пурп)/.test(normalizedColorName)) {
        return "#b388ff";
      }
      if (/(blue|син)/.test(normalizedColorName)) {
        return "#67c7ff";
      }
      if (/(green|зел)/.test(normalizedColorName)) {
        return "#7fe3ba";
      }
      return "#f0d59f";
    }
    function getTitanToneByColor(color) {
      const normalizedColor = String(color ?? "").toLowerCase();
      if (normalizedColor.includes("8f7a68")) {
        return "muted";
      }
      if (normalizedColor.includes("9fe0a8")) {
        return "green";
      }
      if (normalizedColor.includes("8fd3ff")) {
        return "blue";
      }
      if (normalizedColor.includes("d7b2ff")) {
        return "purple";
      }
      if (normalizedColor.includes("b388ff")) {
        return "violet";
      }
      if (normalizedColor.includes("ffd36e") || normalizedColor.includes("f0d59f")) {
        return "gold";
      }
      if (normalizedColor.includes("f0ad4e")) {
        return "orange";
      }
      if (normalizedColor.includes("d9534f")) {
        return "red";
      }
      if (normalizedColor.includes("8d6e63")) {
        return "brown";
      }
      if (normalizedColor.includes("ff9f9f")) {
        return "danger";
      }
      return "gold";
    }
    function buildTitanValueMarkup(value, tone = "gold") {
      return `<span class="hwhx-titan-value" data-tone="${escapeHtml$1(tone)}">${escapeHtml$1(value)}</span>`;
    }
    function buildTitanSeparatorMarkup() {
      return '<span class="hwhx-titan-sep"> / </span>';
    }
    function getTitanDoYourBestModuleDefinitions() {
      return [
        {
          key: TITAN_TRAINER_TAB_LEVELS,
          taskName: DO_YOUR_BEST_TITAN_LEVEL_TASK_NAME,
          labelKey: "HWHTITANART_TASK_AUTO_LEVELS"
        },
        {
          key: TITAN_TRAINER_TAB_ARTIFACTS,
          taskName: DO_YOUR_BEST_TITAN_ARTIFACT_TASK_NAME,
          labelKey: "HWHTITANART_TASK_AUTO_ARTIFACTS"
        },
        {
          key: TITAN_TRAINER_TAB_SKINS,
          taskName: DO_YOUR_BEST_TITAN_SKIN_TASK_NAME,
          labelKey: "HWHTITANART_TASK_AUTO_SKINS"
        }
      ];
    }
    function getDoYourBestPlacementSelectId(moduleKey) {
      return `${DO_YOUR_BEST_PLACEMENT_SELECT_ID_PREFIX}-${String(moduleKey ?? "all")}`;
    }
    function normalizeDoYourBestPlacement$1(value) {
      return normalizeDoYourBestPlacement(value, { allowStart: true });
    }
    function normalizeDoYourBestPlacementMap(value) {
      const legacyPlacement = typeof value === "string" ? normalizeDoYourBestPlacement$1(value) : void 0;
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      return Object.fromEntries(
        getTitanDoYourBestModuleDefinitions().map((definition) => [
          definition.key,
          normalizeDoYourBestPlacement$1(
            source[definition.key] ?? source[definition.taskName] ?? legacyPlacement ?? DO_YOUR_BEST_PLACEMENT_END2
          )
        ])
      );
    }
    function readStoredDoYourBestPlacementMapSync() {
      try {
        return normalizeDoYourBestPlacementMap(
          doYourBestPlacementStorage.read("", DO_YOUR_BEST_PLACEMENT_END2)
        );
      } catch (error) {
        console.warn("[TitanArtifact] checklist placement read failed", error);
        return normalizeDoYourBestPlacementMap(DO_YOUR_BEST_PLACEMENT_END2);
      }
    }
    function readStoredDoYourBestPlacementSync(moduleKey = void 0) {
      const placementMap = readStoredDoYourBestPlacementMapSync();
      if (moduleKey === void 0) {
        return placementMap;
      }
      return placementMap[String(moduleKey)] ?? normalizeDoYourBestPlacement$1(DO_YOUR_BEST_PLACEMENT_END2);
    }
    function persistDoYourBestPlacementMapSync(placementMap) {
      try {
        doYourBestPlacementStorage.write(
          "",
          normalizeDoYourBestPlacementMap(placementMap)
        );
      } catch (error) {
        console.warn("[TitanArtifact] checklist placement write failed", error);
      }
    }
    function persistDoYourBestPlacementSync(moduleKey, placement) {
      const placementMap = readStoredDoYourBestPlacementMapSync();
      placementMap[String(moduleKey)] = normalizeDoYourBestPlacement$1(placement);
      persistDoYourBestPlacementMapSync(placementMap);
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
    function getDoYourBestTaskListSnapshot$1() {
      return getDoYourBestTaskListSnapshot(HWHClasses?.doYourBest, {
        logPrefix: "[TitanArtifact]"
      });
    }
    async function waitForGameRuntime(timeoutMs = USER_ID_WAIT_TIMEOUT_MS) {
      const startedAt = Date.now();
      while (Date.now() - startedAt < timeoutMs) {
        const hasRuntimeData = typeof globalThis.Send === "function" && typeof globalThis.cheats?.translate === "function" && !!globalThis.lib?.data?.titan && !!globalThis.lib?.data?.titanArtifact && !!globalThis.lib?.data?.skin;
        if (hasRuntimeData) {
          return;
        }
        await delay(USER_ID_POLL_DELAY_MS);
      }
      throw new Error(translate("HWHTITANART_RUNTIME_WAIT_ERROR"));
    }
    async function ensureGameRuntimeReady() {
      runtimeState.gameRuntimePromise ?? (runtimeState.gameRuntimePromise = waitForGameRuntime());
      await runtimeState.gameRuntimePromise;
    }
    async function waitForUserId(timeoutMs = USER_ID_WAIT_TIMEOUT_MS) {
      const startedAt = Date.now();
      while (Date.now() - startedAt < timeoutMs) {
        const readyUserId = globalThis.userId;
        if (readyUserId != null && readyUserId !== "") {
          return readyUserId;
        }
        await delay(USER_ID_POLL_DELAY_MS);
      }
      throw new Error(translate("HWHTITANART_USER_ID_WAIT_ERROR"));
    }
    async function ensureUserIdReady() {
      if (runtimeState.userId != null && runtimeState.userId !== "") {
        return runtimeState.userId;
      }
      runtimeState.userIdPromise ?? (runtimeState.userIdPromise = waitForUserId());
      runtimeState.userId = await runtimeState.userIdPromise;
      return runtimeState.userId;
    }
    function buildTitanAccordionStateAttributes(accordionKey, defaultOpen = true) {
      return titanAccordionStateController.buildStateAttributes(
        accordionKey,
        defaultOpen
      );
    }
    async function readSettings() {
      await ensureGameRuntimeReady();
      const userIdValue = await ensureUserIdReady();
      const savedSettings = artifactSettingsStorage.read(userIdValue, DEFAULT_SETTINGS);
      const settings = normalizeSettings(savedSettings);
      applyTitanTrainerUiPreferences(settings);
      return settings;
    }
    async function writeSettings(settings) {
      await ensureGameRuntimeReady();
      const userIdValue = await ensureUserIdReady();
      const normalizedSettings = normalizeSettings(settings);
      artifactSettingsStorage.write(userIdValue, normalizedSettings);
      applyTitanTrainerUiPreferences(normalizedSettings);
    }
    async function readLevelSettings() {
      await ensureGameRuntimeReady();
      const userIdValue = await ensureUserIdReady();
      const savedSettings = levelSettingsStorage.read(
        userIdValue,
        DEFAULT_LEVEL_SETTINGS
      );
      return normalizeLevelSettings(savedSettings);
    }
    async function writeLevelSettings(settings) {
      await ensureGameRuntimeReady();
      const userIdValue = await ensureUserIdReady();
      levelSettingsStorage.write(userIdValue, normalizeLevelSettings(settings));
    }
    async function readSkinSettings() {
      await ensureGameRuntimeReady();
      const userIdValue = await ensureUserIdReady();
      const savedSettings = skinSettingsStorage.read(userIdValue, DEFAULT_SKIN_SETTINGS);
      return normalizeSkinSettings(savedSettings);
    }
    async function writeSkinSettings(settings) {
      await ensureGameRuntimeReady();
      const userIdValue = await ensureUserIdReady();
      skinSettingsStorage.write(userIdValue, normalizeSkinSettings(settings));
    }
    async function buildTitanTrainerSettingsExportPayload() {
      const userIdValue = await ensureUserIdReady();
      return buildSettingsExportPayload({
        scriptId: "hwhtitantrainer",
        scriptName: String(GM_info?.script?.name ?? "HWH Titan Trainer"),
        scriptVersion: String(GM_info?.script?.version ?? ""),
        storageSchemaVersion: STORAGE_SCHEMA_VERSION,
        userId: String(userIdValue),
        data: {
          artifactSettings: normalizeSettings(await readSettings()),
          levelSettings: normalizeLevelSettings(await readLevelSettings()),
          skinSettings: normalizeSkinSettings(await readSkinSettings()),
          doYourBestPlacement: readStoredDoYourBestPlacementSync()
        }
      });
    }
    function buildTitanTrainerSettingsExportFileName(userIdValue) {
      return buildSettingsExportFileName(userIdValue, "hwhtitantrainer.json");
    }
    function showSettingsNotice(message, iconName = "check", className = "hwhx-green") {
      showFinalProgress(buildIconLabel(iconName, String(message ?? ""), className));
    }
    async function exportSettingsToJson() {
      const exportPayload = await buildTitanTrainerSettingsExportPayload();
      downloadJsonFile(
        buildTitanTrainerSettingsExportFileName(exportPayload.userId),
        exportPayload
      );
      showSettingsNotice(translate("HWHTITANTRAINER_SETTINGS_EXPORT_DONE"));
    }
    function getTitanTrainerImportData(value) {
      if (!value || typeof value !== "object") {
        throw new Error(translate("HWHTITANTRAINER_SETTINGS_IMPORT_INVALID"));
      }
      if (value.scriptId !== "hwhtitantrainer" && value.scriptId !== "hwhtitanartifact") {
        throw new Error(translate("HWHTITANTRAINER_SETTINGS_IMPORT_INVALID"));
      }
      const dataValue = value.data;
      if (!dataValue || typeof dataValue !== "object") {
        throw new Error(translate("HWHTITANTRAINER_SETTINGS_IMPORT_INVALID"));
      }
      return {
        artifactSettings: dataValue.artifactSettings != null ? normalizeSettings(dataValue.artifactSettings) : void 0,
        levelSettings: dataValue.levelSettings != null ? normalizeLevelSettings(dataValue.levelSettings) : void 0,
        skinSettings: dataValue.skinSettings != null ? normalizeSkinSettings(dataValue.skinSettings) : void 0,
        doYourBestPlacement: dataValue.doYourBestPlacement != null ? normalizeDoYourBestPlacementMap(dataValue.doYourBestPlacement) : void 0
      };
    }
    async function importSettingsFromJson() {
      const fileText = await pickJsonFileText();
      if (fileText === void 0) {
        return false;
      }
      const parsedValue = parseJsonText(
        fileText,
        () => new Error(translate("HWHTITANTRAINER_SETTINGS_IMPORT_PARSE_ERROR"))
      );
      const importData = getTitanTrainerImportData(parsedValue);
      if (importData.artifactSettings) {
        await writeSettings(importData.artifactSettings);
      }
      if (importData.levelSettings) {
        await writeLevelSettings(importData.levelSettings);
      }
      if (importData.skinSettings) {
        await writeSkinSettings(importData.skinSettings);
      }
      if (importData.doYourBestPlacement !== void 0) {
        persistDoYourBestPlacementMapSync(importData.doYourBestPlacement);
        registerDoYourBestTitanTasks();
      }
      showSettingsNotice(translate("HWHTITANTRAINER_SETTINGS_IMPORT_DONE"));
      return true;
    }
    function getMaxTitanLevel() {
      if (maxTitanLevelCache !== void 0) {
        return maxTitanLevelCache;
      }
      maxTitanLevelCache = Object.keys(globalThis.lib?.data?.level?.titan ?? {}).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0).reduce((maxValue, value) => Math.max(maxValue, value), 0);
      return maxTitanLevelCache;
    }
    function getMaxArtifactLevelFromConfig(levelConfigMap) {
      if (Array.isArray(levelConfigMap)) {
        return levelConfigMap.length;
      }
      return Object.keys(levelConfigMap ?? {}).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0).reduce((maxValue, value) => Math.max(maxValue, value), 0);
    }
    function getDefaultArtifactLevelCap(slotId) {
      const normalizedSlotId = Number(slotId);
      if (defaultArtifactLevelCapCache.has(normalizedSlotId)) {
        return defaultArtifactLevelCapCache.get(normalizedSlotId);
      }
      const playableTitanIds = getConfigTitanIds();
      const maxLevel = playableTitanIds.reduce((bestLevel, titanId) => {
        const levelConfigMap = getTitanArtifactConfig(titanId, normalizedSlotId)?.levelConfigMap ?? {};
        const titanMaxLevel = getMaxArtifactLevelFromConfig(levelConfigMap);
        return Math.max(bestLevel, titanMaxLevel);
      }, 0);
      const levelCap = maxLevel > 0 ? maxLevel : 999;
      defaultArtifactLevelCapCache.set(normalizedSlotId, levelCap);
      return levelCap;
    }
    function getTitanArtifactMaxLevel(titanId, slotId) {
      const levelConfigMap = getTitanArtifactConfig(titanId, slotId)?.levelConfigMap ?? {};
      const maxLevel = getMaxArtifactLevelFromConfig(levelConfigMap);
      return maxLevel > 0 ? maxLevel : getDefaultArtifactLevelCap(slotId);
    }
    function parseNumberInputText$1(value, fallbackValue = 0) {
      return parseNumberInputText(value, fallbackValue);
    }
    function normalizeCapValue(rawValue, fallbackValue) {
      const parsedValue = parseNumberInputText$1(rawValue, fallbackValue);
      if (!Number.isFinite(parsedValue)) {
        return Math.max(0, Math.floor(Number(fallbackValue) || 0));
      }
      return Math.max(0, Math.floor(parsedValue));
    }
    function normalizeLevelingMode(value) {
      return value === LEVELING_MODE_AMOUNT ? LEVELING_MODE_AMOUNT : LEVELING_MODE_MAX;
    }
    function normalizeChecklistAmountBehavior(value) {
      return value === CHECKLIST_AMOUNT_BEHAVIOR_DEFAULT ? CHECKLIST_AMOUNT_BEHAVIOR_DEFAULT : CHECKLIST_AMOUNT_BEHAVIOR_SKIP;
    }
    function normalizeChecklistFragmentPurchaseBehavior(value) {
      return value === CHECKLIST_FRAGMENT_BEHAVIOR_SKIP ? CHECKLIST_FRAGMENT_BEHAVIOR_SKIP : CHECKLIST_FRAGMENT_BEHAVIOR_USE_SETTINGS;
    }
    function normalizeTitanTrainerButtonPlacement(value) {
      return value === TITAN_TRAINER_BUTTON_PLACEMENT_OTHER ? TITAN_TRAINER_BUTTON_PLACEMENT_OTHER : TITAN_TRAINER_BUTTON_PLACEMENT_MAIN;
    }
    function parseJsonValue(value, fallbackValue = void 0) {
      if (value == null || value === "") {
        return fallbackValue;
      }
      try {
        return JSON.parse(value);
      } catch {
        return fallbackValue;
      }
    }
    function readStoredTitanTrainerButtonPlacementSync() {
      try {
        return normalizeTitanTrainerButtonPlacement(
          parseJsonValue(
            localStorage.getItem(TITAN_TRAINER_BUTTON_PLACEMENT_STORAGE_KEY),
            TITAN_TRAINER_BUTTON_PLACEMENT_MAIN
          )
        );
      } catch (error) {
        console.warn("[TitanTrainer] button placement read failed", error);
        return TITAN_TRAINER_BUTTON_PLACEMENT_MAIN;
      }
    }
    function persistTitanTrainerButtonPlacementSync(placement) {
      try {
        localStorage.setItem(
          TITAN_TRAINER_BUTTON_PLACEMENT_STORAGE_KEY,
          JSON.stringify(normalizeTitanTrainerButtonPlacement(placement))
        );
      } catch (error) {
        console.warn("[TitanTrainer] button placement write failed", error);
      }
    }
    function getChecklistLevelingAmount(settings) {
      return normalizeCapValue(settings?.checklistLevelingAmount, 1);
    }
    function buildTitanArtifactKey(titanId, slotId) {
      return `${Math.max(0, Number(titanId) || 0)}:${Math.max(0, Number(slotId) || 0)}`;
    }
    function parseTitanArtifactKey(value) {
      const [titanIdText, slotIdText] = String(value ?? "").split(":");
      const titanId = Number(titanIdText);
      const slotId = Number(slotIdText);
      if (!Number.isFinite(titanId) || !Number.isFinite(slotId) || !ARTIFACT_SLOT_ID_SET.has(slotId)) {
        return void 0;
      }
      return {
        titanId,
        slotId
      };
    }
    function normalizeTitanArtifactKeys(values, allowedSlotIds = ARTIFACT_SLOT_IDS) {
      const allowedSlotIdSet = new Set(
        (allowedSlotIds ?? ARTIFACT_SLOT_IDS).map((slotId) => Number(slotId)).filter((slotId) => ARTIFACT_SLOT_ID_SET.has(slotId))
      );
      return [...new Set(values ?? [])].map(parseTitanArtifactKey).filter(
        (entry) => entry && Number.isFinite(entry.titanId) && allowedSlotIdSet.has(Number(entry.slotId))
      ).map((entry) => buildTitanArtifactKey(entry.titanId, entry.slotId));
    }
    function normalizeSettings(settings) {
      const selectedTitanIds = [...new Set(settings?.selectedTitanIds ?? [])].map((value) => Number(value)).filter((value) => Number.isFinite(value));
      const selectedArtifactSlotIds = [
        ...new Set(settings?.selectedArtifactSlotIds ?? [0, 1])
      ].map((value) => Number(value)).filter((value) => ARTIFACT_SLOT_ID_SET.has(value)).sort((left, right) => left - right);
      const artifactLevelCaps = ARTIFACT_SLOT_IDS.map(
        (slotId) => normalizeCapValue(
          settings?.artifactLevelCaps?.[slotId],
          getDefaultArtifactLevelCap(slotId)
        )
      );
      return {
        selectedTitanIds,
        selectedArtifactSlotIds: selectedArtifactSlotIds.length > 0 ? selectedArtifactSlotIds : [0, 1],
        levelingMode: normalizeLevelingMode(settings?.levelingMode),
        checklistAmountBehavior: normalizeChecklistAmountBehavior(
          settings?.checklistAmountBehavior
        ),
        checklistLevelingAmount: getChecklistLevelingAmount(settings),
        checklistFragmentPurchaseBehavior: normalizeChecklistFragmentPurchaseBehavior(
          settings?.checklistFragmentPurchaseBehavior
        ),
        essenceReserve: Math.max(0, Math.floor(Number(settings?.essenceReserve) || 0)),
        artifactGoldReserve: Math.max(
          0,
          Math.floor(Number(settings?.artifactGoldReserve) || 0)
        ),
        artifactFragmentCoinReserve: Math.max(
          0,
          Math.floor(Number(settings?.artifactFragmentCoinReserve) || 0)
        ),
        evolveArtifacts: !!settings?.evolveArtifacts,
        buyArtifactFragments: !!settings?.buyArtifactFragments,
        selectedArtifactEvolutionKeys: normalizeTitanArtifactKeys(
          settings?.selectedArtifactEvolutionKeys
        ),
        selectedArtifactFragmentBuyKeys: normalizeTitanArtifactKeys(
          settings?.selectedArtifactFragmentBuyKeys,
          [0, 1]
        ),
        artifactEvolutionMaxStar: normalizeCapValue(
          settings?.artifactEvolutionMaxStar,
          getMaxKnownTitanArtifactStar()
        ),
        showFullCosts: !!settings?.showFullCosts,
        syncAfterRun: !!settings?.syncAfterRun,
        uiTooltipsEnabled: settings?.uiTooltipsEnabled !== false,
        progressAutoHideResult: !!settings?.progressAutoHideResult,
        progressAutoHideResultTimeoutMs: Math.max(
          1e3,
          Math.floor(Number(settings?.progressAutoHideResultTimeoutMs) || 5e3)
        ),
        progressWindowPosition: [
          "top-center",
          "top-right",
          "bottom-right"
        ].includes(settings?.progressWindowPosition) ? settings.progressWindowPosition : "top-right",
        progressWindowStyle: settings?.progressWindowStyle === "compact" ? "compact" : "default",
        progressWindowTheme: String(settings?.progressWindowTheme ?? "default").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || "default",
        titanTrainerButtonPlacement: normalizeTitanTrainerButtonPlacement(
          settings?.titanTrainerButtonPlacement ?? readStoredTitanTrainerButtonPlacementSync()
        ),
        artifactLevelCaps
      };
    }
    function normalizeLevelSettings(settings) {
      const selectedTitanIds = [...new Set(settings?.selectedTitanIds ?? [])].map((value) => Number(value)).filter((value) => Number.isFinite(value));
      return {
        selectedTitanIds,
        levelingMode: normalizeLevelingMode(settings?.levelingMode),
        checklistAmountBehavior: normalizeChecklistAmountBehavior(
          settings?.checklistAmountBehavior
        ),
        checklistLevelingAmount: getChecklistLevelingAmount(settings),
        potionReserve: Math.max(0, Math.floor(Number(settings?.potionReserve) || 0)),
        showNextCosts: !!settings?.showNextCosts,
        showEvolutionProgress: settings?.showEvolutionProgress !== false,
        syncAfterRun: !!settings?.syncAfterRun,
        maxTitanLevel: normalizeCapValue(settings?.maxTitanLevel, getMaxTitanLevel()),
        selectedTitanEvolutionIds: [...new Set(settings?.selectedTitanEvolutionIds ?? [])].map((value) => Number(value)).filter((value) => Number.isFinite(value)),
        titanEvolutionMaxStar: normalizeCapValue(
          settings?.titanEvolutionMaxStar,
          getMaxTitanEvolutionStar()
        )
      };
    }
    function normalizeSkinSettings(settings) {
      const selectedTitanIds = [...new Set(settings?.selectedTitanIds ?? [])].map((value) => Number(value)).filter((value) => Number.isFinite(value));
      const skinGroups = getTitanSkinGroups();
      const allowedLocaleKeySet = new Set(skinGroups.map((group) => group.localeKey));
      const selectedSkinLocaleKeys = [...new Set(settings?.selectedSkinLocaleKeys ?? [])].map((value) => String(value ?? "").trim()).filter((value) => value && allowedLocaleKeySet.has(value));
      const defaultSelectedSkinLocaleKeys = selectedSkinLocaleKeys.length > 0 ? selectedSkinLocaleKeys : skinGroups.map((group) => group.localeKey);
      const skinLevelCaps = Object.fromEntries(
        skinGroups.map((group) => [
          group.localeKey,
          normalizeCapValue(
            settings?.skinLevelCaps?.[group.localeKey],
            getDefaultTitanSkinLevelCap(group.localeKey)
          )
        ])
      );
      return {
        selectedTitanIds,
        selectedSkinLocaleKeys: defaultSelectedSkinLocaleKeys,
        levelingMode: normalizeLevelingMode(settings?.levelingMode),
        checklistAmountBehavior: normalizeChecklistAmountBehavior(
          settings?.checklistAmountBehavior
        ),
        checklistLevelingAmount: getChecklistLevelingAmount(settings),
        skinStoneReserve: Math.max(
          0,
          Math.floor(Number(settings?.skinStoneReserve) || 0)
        ),
        showNextCosts: !!settings?.showNextCosts,
        syncAfterRun: !!settings?.syncAfterRun,
        skinLevelCaps
      };
    }
    async function sendCalls(calls) {
      const response = await Send({ calls });
      if (response?.error) {
        throw new Error(
          response.error.description || translate("HWHTITANART_ERROR_GENERIC")
        );
      }
      return response?.results ?? [];
    }
    async function sendCallsInChunks(calls, chunkSize, onChunk = void 0) {
      const normalizedCalls = Array.isArray(calls) ? calls : [];
      const normalizedChunkSize = Math.max(1, Math.floor(Number(chunkSize) || 1));
      const totalRequests = Math.max(
        1,
        Math.ceil(normalizedCalls.length / normalizedChunkSize)
      );
      const combinedResults = [];
      for (let index = 0; index < normalizedCalls.length; index += normalizedChunkSize) {
        const currentChunk = normalizedCalls.slice(index, index + normalizedChunkSize);
        const requestIndex = Math.floor(index / normalizedChunkSize) + 1;
        await onChunk?.({
          requestIndex,
          totalRequests,
          chunkStart: index + 1,
          chunkEnd: index + currentChunk.length
        });
        try {
          combinedResults.push(...await sendCalls(currentChunk));
        } catch (error) {
          if (error && typeof error === "object") {
            error.partialResults = [...combinedResults];
          }
          throw error;
        }
      }
      return combinedResults;
    }
    async function fetchTitanSnapshot(includeInventory = true, includeUserInfo = false) {
      const calls = [{ name: "titanGetAll", args: {}, ident: "titanGetAll" }];
      if (includeInventory) {
        calls.push({ name: "inventoryGet", args: {}, ident: "inventoryGet" });
      }
      if (includeUserInfo) {
        calls.push({ name: "userGetInfo", args: {}, ident: "userGetInfo" });
      }
      const results = await sendCalls(calls);
      let resultIndex = 0;
      return {
        titans: results[resultIndex++]?.result?.response ?? {},
        inventory: includeInventory ? results[resultIndex++]?.result?.response ?? {} : {},
        userInfo: includeUserInfo ? results[resultIndex++]?.result?.response ?? {} : {}
      };
    }
    async function fetchTitanArtifactFragmentShop() {
      const results = await sendCalls([
        {
          name: "shopGet",
          args: { shopId: TITAN_ARTIFACT_FRAGMENT_SHOP_ID },
          ident: "titanArtifactFragmentShop"
        }
      ]);
      return results[0]?.result?.response ?? {};
    }
    function getTitanName(titanId) {
      const translationKey = `LIB_HERO_NAME_${titanId}`;
      const translatedName = globalThis.cheats?.translate?.(translationKey);
      return translatedName && translatedName !== translationKey ? translatedName : translate("HWHTITANART_TITAN_FALLBACK", { id: titanId });
    }
    function getArtifactResourceName() {
      const translationKey = `LIB_CONSUMABLE_NAME_${TITAN_RESOURCE_CONSUMABLE_ID}`;
      const translatedName = globalThis.cheats?.translate?.(translationKey);
      return translatedName && translatedName !== translationKey ? translatedName : translate("HWHTITANART_RESOURCE_FALLBACK");
    }
    function getGoldResourceName() {
      return translate("HWHTITANART_GOLD_RESOURCE");
    }
    function getTitanArtifactFragmentCoinResourceName() {
      const translationKey = `LIB_COIN_NAME_${TITAN_ARTIFACT_FRAGMENT_COIN_ID}`;
      const translatedName = globalThis.cheats?.translate?.(translationKey);
      return translatedName && translatedName !== translationKey ? translatedName : translate("HWHTITANART_FRAGMENT_COIN_RESOURCE");
    }
    function getTitanXpResourceName() {
      const translationKey = `LIB_CONSUMABLE_NAME_${TITAN_XP_RESOURCE_CONSUMABLE_ID}`;
      const translatedName = globalThis.cheats?.translate?.(translationKey);
      return translatedName && translatedName !== translationKey ? translatedName : translate("HWHTITANLVL_RESOURCE_FALLBACK");
    }
    function getTitanSkinResourceName() {
      const translationKey = `LIB_COIN_NAME_${TITAN_SKIN_RESOURCE_COIN_ID}`;
      const translatedName = globalThis.cheats?.translate?.(translationKey);
      return translatedName && translatedName !== translationKey ? translatedName : translate("HWHTITANSKIN_RESOURCE_FALLBACK");
    }
    function getResourceAmount(inventory) {
      return Math.max(
        0,
        Number(inventory?.consumable?.[TITAN_RESOURCE_CONSUMABLE_ID]) || 0
      );
    }
    function getTitanXpPotionAmount(inventory) {
      return Math.max(
        0,
        Number(inventory?.consumable?.[TITAN_XP_RESOURCE_CONSUMABLE_ID]) || 0
      );
    }
    function getTitanSoulAmount(inventory, titanId) {
      return Math.max(
        0,
        Number(inventory?.fragmentTitan?.[Math.max(0, Number(titanId) || 0)]) || 0
      );
    }
    function getTitanSkinStoneAmount(inventory) {
      return Math.max(0, Number(inventory?.coin?.[TITAN_SKIN_RESOURCE_COIN_ID]) || 0);
    }
    function getTitanArtifactFragmentCoinAmount(inventory) {
      return Math.max(
        0,
        Number(inventory?.coin?.[TITAN_ARTIFACT_FRAGMENT_COIN_ID]) || 0
      );
    }
    function getTitanArtifactFragmentAmount(inventory, artifactId) {
      return Math.max(
        0,
        Number(inventory?.fragmentTitanArtifact?.[Math.max(0, Number(artifactId) || 0)]) || 0
      );
    }
    function getGoldAmount(userInfo) {
      return Math.max(0, Number(userInfo?.gold) || 0);
    }
    function getConfigTitanIds() {
      if (Array.isArray(configTitanIdsCache)) {
        return configTitanIdsCache;
      }
      configTitanIdsCache = Object.keys(globalThis.lib?.data?.titan ?? {}).map((value) => Number(value)).filter((value) => Number.isFinite(value)).filter((value) => Number(globalThis.lib?.data?.titan?.[value]?.isPlayable) === 1).sort((left, right) => left - right);
      return configTitanIdsCache;
    }
    function getTitanSkinDisplayName(localeKey, skinId) {
      const normalizedLocaleKey = String(localeKey ?? "").trim();
      const translatedName = normalizedLocaleKey ? globalThis.cheats?.translate?.(normalizedLocaleKey) : "";
      if (translatedName && translatedName !== normalizedLocaleKey) {
        return translatedName;
      }
      return normalizedLocaleKey || translate("HWHTITANSKIN_SKIN_FALLBACK", { id: skinId });
    }
    function getTitanSkinMaxLevelFromConfig(levelConfigMap) {
      return Object.keys(levelConfigMap ?? {}).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0).reduce((maxValue, value) => Math.max(maxValue, value), 0);
    }
    function getTitanSkinInfo(skinId) {
      const numericSkinId = Math.max(0, Number(skinId) || 0);
      if (numericSkinId <= 1e4) {
        return void 0;
      }
      if (titanSkinInfoCache.has(numericSkinId)) {
        return titanSkinInfoCache.get(numericSkinId);
      }
      const skinConfig = globalThis.lib?.data?.skin?.[numericSkinId];
      if (!skinConfig) {
        return void 0;
      }
      const localeKey = String(skinConfig.localeKey ?? "").trim();
      const levelConfigMap = skinConfig.statData?.levels ?? {};
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
      if (Array.isArray(titanSkinGroupsCache)) {
        return titanSkinGroupsCache;
      }
      const groups = /* @__PURE__ */ new Map();
      Object.keys(globalThis.lib?.data?.skin ?? {}).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 1e4).sort((left, right) => left - right).forEach((skinId) => {
        const skinInfo = getTitanSkinInfo(skinId);
        if (!skinInfo?.localeKey) {
          return;
        }
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
        group.skinIds.push(skinInfo.skinId);
        group.maxLevel = Math.max(group.maxLevel, skinInfo.maxLevel);
        group.sortId = Math.min(group.sortId, skinInfo.skinId);
      });
      titanSkinGroupsCache = [...groups.values()].sort((left, right) => {
        const localeCompareResult = left.name.localeCompare(right.name, "ru");
        if (localeCompareResult !== 0) {
          return localeCompareResult;
        }
        return left.sortId - right.sortId;
      });
      return titanSkinGroupsCache;
    }
    function getDefaultTitanSkinLevelCap(localeKey) {
      const normalizedLocaleKey = String(localeKey ?? "").trim();
      if (defaultTitanSkinLevelCapCache.has(normalizedLocaleKey)) {
        return defaultTitanSkinLevelCapCache.get(normalizedLocaleKey);
      }
      const matchedGroup = getTitanSkinGroups().find(
        (group) => group.localeKey === normalizedLocaleKey
      );
      const levelCap = matchedGroup?.maxLevel > 0 ? matchedGroup.maxLevel : 999;
      defaultTitanSkinLevelCapCache.set(normalizedLocaleKey, levelCap);
      return levelCap;
    }
    function getTitanSkinEntries(titanData) {
      const entriesByLocaleKey = /* @__PURE__ */ new Map();
      Object.entries(titanData?.skins ?? {}).forEach(([skinId, level]) => {
        const skinInfo = getTitanSkinInfo(skinId);
        if (!skinInfo?.localeKey) {
          return;
        }
        const entry = {
          ...skinInfo,
          currentLevel: Math.max(0, Number(level) || 0)
        };
        const existingEntry = entriesByLocaleKey.get(skinInfo.localeKey);
        if (!existingEntry || entry.currentLevel > existingEntry.currentLevel || entry.currentLevel === existingEntry.currentLevel && entry.skinId < existingEntry.skinId) {
          entriesByLocaleKey.set(skinInfo.localeKey, entry);
        }
      });
      return [...entriesByLocaleKey.values()].sort((left, right) => {
        const localeCompareResult = left.name.localeCompare(right.name, "ru");
        if (localeCompareResult !== 0) {
          return localeCompareResult;
        }
        return left.skinId - right.skinId;
      });
    }
    function getTitanSkinLevelData(skinId, level) {
      return getTitanSkinInfo(skinId)?.levelConfigMap?.[Math.max(0, Number(level) || 0)];
    }
    function getTitanArtifactLevels(titanData) {
      return Array.isArray(titanData?.artifacts) ? titanData.artifacts.map((artifact) => Math.max(0, Number(artifact?.level) || 0)) : [];
    }
    function getTitanArtifactStates(titanData) {
      return ARTIFACT_SLOT_IDS.map((slotId) => {
        const artifactData = titanData?.artifacts?.[slotId];
        return {
          level: Math.max(0, Number(artifactData?.level) || 0),
          star: Math.max(0, Number(artifactData?.star) || 0)
        };
      });
    }
    function getTitanArtifactConfig(titanId, slotId) {
      const cacheKey = `${Number(titanId)}:${Number(slotId)}`;
      if (titanArtifactConfigCache.has(cacheKey)) {
        return titanArtifactConfigCache.get(cacheKey);
      }
      const titanConfig = globalThis.lib?.data?.titan?.[titanId];
      const artifactId = Number(titanConfig?.artifacts?.[slotId]);
      if (!Number.isFinite(artifactId) || artifactId <= 0) {
        return void 0;
      }
      const artifactConfig = globalThis.lib?.data?.titanArtifact?.id?.[artifactId];
      const artifactType = Number(slotId) === 2 ? "amulet" : artifactConfig?.type;
      const levelConfigMap = globalThis.lib?.data?.titanArtifact?.type?.[artifactType]?.levels ?? {};
      const artifactConfigData = {
        artifactId,
        artifactType,
        levelConfigMap
      };
      titanArtifactConfigCache.set(cacheKey, artifactConfigData);
      return artifactConfigData;
    }
    function getArtifactLevelConfigData(levelConfigMap, level) {
      const normalizedLevel = Math.max(0, Number(level) || 0);
      if (Array.isArray(levelConfigMap)) {
        const zeroBasedIndex = Math.max(0, normalizedLevel - 1);
        return levelConfigMap[zeroBasedIndex] ?? levelConfigMap[normalizedLevel];
      }
      return levelConfigMap?.[normalizedLevel];
    }
    function getArtifactLevelData(titanId, slotId, level) {
      const artifactConfig = getTitanArtifactConfig(titanId, slotId);
      if (!artifactConfig) {
        return void 0;
      }
      return getArtifactLevelConfigData(artifactConfig.levelConfigMap, level);
    }
    function getArtifactName(artifactId) {
      const normalizedArtifactId = Math.max(0, Number(artifactId) || 0);
      const translationKey = `LIB_TITAN_ARTIFACT_NAME_${normalizedArtifactId}`;
      const translatedName = globalThis.cheats?.translate?.(translationKey);
      return translatedName && translatedName !== translationKey ? translatedName : translate("HWHTITANART_ARTIFACT_SLOT", { slot: normalizedArtifactId });
    }
    function getTitanArtifactEvolutionRows(titanId, slotId) {
      const artifactConfig = getTitanArtifactConfig(titanId, slotId);
      const evolutionMap = globalThis.lib?.data?.titanArtifact?.type?.[artifactConfig?.artifactType]?.evolution ?? {};
      return Object.values(evolutionMap).map((evolutionData) => ({
        star: Math.max(0, Number(evolutionData?.star) || 0),
        fragmentCost: Math.max(0, Number(evolutionData?.costFragmentsAmount) || 0)
      })).filter((evolutionData) => evolutionData.star > 0).sort((left, right) => left.star - right.star);
    }
    function getMaxTitanArtifactStar(titanId, slotId) {
      return getTitanArtifactEvolutionRows(titanId, slotId).reduce(
        (maxStar, evolutionData) => Math.max(maxStar, evolutionData.star),
        0
      );
    }
    function getMaxKnownTitanArtifactStar() {
      return getConfigTitanIds().reduce((maxStar, titanId) => {
        return Math.max(
          maxStar,
          ...ARTIFACT_SLOT_IDS.map((slotId) => getMaxTitanArtifactStar(titanId, slotId))
        );
      }, 0);
    }
    function getTitanArtifactEvolutionSteps(titanId, slotId, fromStar, toStar) {
      const normalizedFromStar = Math.max(0, Number(fromStar) || 0);
      const maxStar = getMaxTitanArtifactStar(titanId, slotId);
      const normalizedToStar = Math.max(
        normalizedFromStar,
        Math.min(Math.max(0, Number(toStar) || maxStar), maxStar)
      );
      return getTitanArtifactEvolutionRows(titanId, slotId).filter(
        (evolutionData) => evolutionData.star > normalizedFromStar && evolutionData.star <= normalizedToStar
      );
    }
    function buildArtifactLevelsMarkup(titanId, levels) {
      if (!Array.isArray(levels) || levels.length <= 0) {
        return "—";
      }
      return ARTIFACT_SLOT_IDS.map((slotId) => {
        const artifactState = typeof levels?.[slotId] === "object" ? levels?.[slotId] : { level: levels?.[slotId] ?? 0, star: void 0 };
        const level = Math.max(0, Number(artifactState?.level) || 0);
        const star = Math.max(0, Number(artifactState?.star) || 0);
        const levelColor = getArtifactLevelColor(
          getArtifactLevelData(titanId, slotId, level)?.color
        );
        return buildTitanValueMarkup(
          star > 0 ? `${formatNumber$1(level)} ★ ${formatNumber$1(star)}` : formatNumber$1(level),
          getTitanToneByColor(levelColor)
        );
      }).join(buildTitanSeparatorMarkup());
    }
    function isTitanArtifactSlotMaxed(titanId, slotId, currentLevel) {
      const maxLevel = getTitanArtifactMaxLevel(titanId, slotId);
      if (maxLevel <= 0 || maxLevel >= 999) {
        return !getTitanArtifactNextUpgrade(titanId, slotId, currentLevel);
      }
      return Math.max(0, Number(currentLevel) || 0) >= maxLevel;
    }
    function areTitanArtifactsMaxed(titanId, levels) {
      const knownSlotIds = ARTIFACT_SLOT_IDS.filter(
        (slotId) => !!getTitanArtifactConfig(titanId, slotId)
      );
      if (knownSlotIds.length <= 0) {
        return false;
      }
      return knownSlotIds.every(
        (slotId) => isTitanArtifactSlotMaxed(titanId, slotId, levels?.[slotId] ?? 0)
      );
    }
    function buildTitanOptionLabel(titanOption) {
      const suffixMarkup = titanOption.owned ? "" : ` <span class="hwhx-titan-option__suffix">(${escapeHtml$1(translate("HWHTITANART_NO_OWNED_SUFFIX"))})</span>`;
      const titleText = titanOption.owned ? titanOption.maxed ? translate("HWHTITANART_ALL_ARTIFACTS_MAXED_TOOLTIP") : titanOption.name : translate("HWHTITANART_NO_OWNED_TOOLTIP");
      return `<span class="hwhx-titan-option" data-hwhx-native-title="${escapeHtml$1(titleText)}"><span class="hwhx-titan-option__name${titanOption.owned ? "" : " is-missing"}${titanOption.maxed ? " is-maxed" : ""}">${escapeHtml$1(titanOption.name)}${suffixMarkup}</span><span class="hwhx-titan-option__levels">( ${titanOption.levelsMarkup} )</span>${titanOption.costMarkup ? `<span class="hwhx-titan-option__cost">[ ${titanOption.costMarkup} ]</span>` : ""}</span>`;
    }
    function buildTitanLevelOptionLabel(titanOption) {
      const suffixMarkup = titanOption.owned ? "" : ` <span class="hwhx-titan-option__suffix">(${escapeHtml$1(translate("HWHTITANART_NO_OWNED_SUFFIX"))})</span>`;
      const titleText = titanOption.owned ? titanOption.name : translate("HWHTITANART_NO_OWNED_TOOLTIP");
      return `<span class="hwhx-titan-option hwhx-titan-option--nowrap" data-hwhx-native-title="${escapeHtml$1(titleText)}"><span class="hwhx-titan-option__name${titanOption.owned ? "" : " is-missing"}">${escapeHtml$1(titanOption.name)}${suffixMarkup}</span><span class="hwhx-titan-option__levels">( ${buildTitanValueMarkup(formatNumber$1(titanOption.level), "blue")} )</span>${titanOption.costMarkup ? `<span class="hwhx-titan-option__cost">[ ${titanOption.costMarkup} ]</span>` : ""}${titanOption.evolutionMarkup ? `<span>${titanOption.evolutionMarkup}</span>` : ""}</span>`;
    }
    function buildTitanSkinOptionLabel(titanOption) {
      const suffixMarkup = titanOption.owned ? "" : ` <span class="hwhx-titan-option__suffix">(${escapeHtml$1(translate("HWHTITANART_NO_OWNED_SUFFIX"))})</span>`;
      const titleText = titanOption.owned ? titanOption.name : translate("HWHTITANART_NO_OWNED_TOOLTIP");
      return `<span class="hwhx-titan-option" data-hwhx-native-title="${escapeHtml$1(titleText)}"><span class="hwhx-titan-option__name${titanOption.owned ? "" : " is-missing"}">${escapeHtml$1(titanOption.name)}${suffixMarkup}</span><span class="hwhx-titan-option__levels">( ${titanOption.skinsMarkup} )</span>${titanOption.costMarkup ? `<span class="hwhx-titan-option__cost">[ ${titanOption.costMarkup} ]</span>` : ""}</span>`;
    }
    function buildArtifactTargetOptionLabel({
      artifactName,
      slotId,
      currentStar,
      maxStar,
      levelColor,
      fragmentAmount = void 0,
      requiredFragmentAmount = void 0
    }) {
      const slotMeta = getArtifactSlotMeta(slotId);
      const metaMarkup = fragmentAmount === void 0 || requiredFragmentAmount === void 0 ? `${buildInlineIcon("star", "hwhx-gold")}${escapeHtml$1(`${formatNumber$1(currentStar)}/${formatNumber$1(maxStar)}`)}` : `${buildInlineIcon("package", "hwhx-gold")}${escapeHtml$1(`${formatNumber$1(fragmentAmount)}/${formatNumber$1(requiredFragmentAmount)}`)}`;
      return `<span class="hwhx-multi-option-label"><span class="hwhx-multi-option-label__main">${buildInlineIcon(slotMeta.icon, slotMeta.className)}<span class="hwhx-title-accent"${buildCssVariableStyleMarkup({ "--hwhx-label-color": levelColor })}>${escapeHtml$1(artifactName)}</span></span><span class="hwhx-multi-option-label__meta">${metaMarkup}</span></span>`;
    }
    function getTitanArtifactNextEvolutionFragmentCost(titanId, slotId, currentStar, targetStar = 0) {
      const maxStar = getMaxTitanArtifactStar(titanId, slotId);
      const normalizedTargetStar = Math.max(0, Number(targetStar) || 0) > 0 ? Math.min(Math.max(0, Number(targetStar) || 0), maxStar) : maxStar;
      const nextEvolutionStep = getTitanArtifactEvolutionSteps(
        titanId,
        slotId,
        currentStar,
        normalizedTargetStar
      )[0];
      return Math.max(0, Number(nextEvolutionStep?.fragmentCost) || 0);
    }
    function buildArtifactTargetGroups(ownedTitans, {
      buyableOnly = false,
      mode = "stars",
      inventory = {},
      maxArtifactStar = 0
    } = {}) {
      return Object.entries(ownedTitans ?? {}).map(([titanIdText, titanData]) => {
        const titanId = Number(titanIdText);
        if (!Number.isFinite(titanId) || !titanData) {
          return null;
        }
        const titanName = getTitanName(titanId);
        const artifactStates = getTitanArtifactStates(titanData);
        const options = ARTIFACT_SLOT_IDS.filter(
          (slotId) => !buyableOnly || Number(slotId) !== 2
        ).map((slotId) => {
          const artifactConfig = getTitanArtifactConfig(titanId, slotId);
          if (!artifactConfig) {
            return null;
          }
          const artifactState = artifactStates[slotId] ?? { level: 0, star: 0 };
          const currentStar = Math.max(0, Number(artifactState.star) || 0);
          const maxStar = getMaxTitanArtifactStar(titanId, slotId);
          const targetStar = Math.max(0, Number(maxArtifactStar) || 0) > 0 ? Math.min(Math.max(0, Number(maxArtifactStar) || 0), maxStar) : maxStar;
          const artifactName = getArtifactName(artifactConfig.artifactId);
          const fragmentAmount = getTitanArtifactFragmentAmount(
            inventory,
            artifactConfig.artifactId
          );
          const requiredFragmentAmount = getTitanArtifactNextEvolutionFragmentCost(
            titanId,
            slotId,
            currentStar,
            maxArtifactStar
          );
          const levelColor = getArtifactLevelColor(
            getArtifactLevelData(titanId, slotId, artifactState.level)?.color
          );
          const disabled = targetStar > 0 && currentStar >= targetStar || mode === "fragments" && requiredFragmentAmount <= 0;
          const title = disabled ? translate("HWHTITANLVL_EVOLUTION_ABSOLUTE") : `${titanName} · ${artifactName}`;
          return {
            value: buildTitanArtifactKey(titanId, slotId),
            label: `${titanName} - ${artifactName} ${currentStar}/${maxStar}`,
            htmlLabel: buildArtifactTargetOptionLabel({
              artifactName,
              slotId,
              currentStar,
              maxStar,
              levelColor,
              fragmentAmount: mode === "fragments" ? fragmentAmount : void 0,
              requiredFragmentAmount: mode === "fragments" ? requiredFragmentAmount : void 0
            }),
            searchText: `${titanName} ${artifactName} ${currentStar}/${maxStar} ${fragmentAmount}/${requiredFragmentAmount}`,
            disabled,
            title
          };
        }).filter(Boolean);
        return options.length > 0 ? { label: titanName, options } : null;
      }).filter(Boolean);
    }
    function buildTitanEvolutionTargetGroups(ownedTitans, inventory) {
      const maxStar = getMaxTitanEvolutionStar();
      const options = Object.entries(ownedTitans ?? {}).map(([titanIdText, titanData]) => {
        const titanId = Number(titanIdText);
        if (!Number.isFinite(titanId) || !titanData) {
          return null;
        }
        const titanName = getTitanName(titanId);
        const currentStar = getTitanStarCount(titanData);
        const soulAmount = getTitanSoulAmount(inventory, titanId);
        const nextCost = getTitanEvolutionCost(currentStar + 1);
        const disabled = maxStar > 0 && currentStar >= maxStar || nextCost <= 0;
        const label = `${titanName} ${currentStar}/${maxStar}`;
        const htmlLabel = `<span class="hwhx-multi-option-label"><span class="hwhx-multi-option-label__main">${buildInlineIcon("users", "hwhx-blue")}<span class="hwhx-title-accent">${escapeHtml$1(titanName)}</span></span><span class="hwhx-multi-option-label__meta">${buildInlineIcon("star", "hwhx-gold")}${escapeHtml$1(`${formatNumber$1(currentStar)}/${formatNumber$1(maxStar)}`)} · ${buildInlineIcon("sparkles", "hwhx-purple")}${escapeHtml$1(`${formatNumber$1(soulAmount)}/${formatNumber$1(nextCost)}`)}</span></span>`;
        return {
          value: String(titanId),
          label,
          htmlLabel,
          searchText: `${titanName} ${currentStar}/${maxStar}`,
          disabled,
          title: disabled ? translate("HWHTITANLVL_EVOLUTION_ABSOLUTE") : titanName
        };
      }).filter(Boolean);
      return [
        {
          label: translate("HWHTITANART_TITAN_LIST_HEADER"),
          options
        }
      ];
    }
    function buildTrainerMultiSelect(inputId, values, groups) {
      return buildMultiSelectMarkup({
        id: inputId,
        values,
        groups,
        placeholder: translate("HWHTITANART_MULTISELECT_PLACEHOLDER"),
        selectedLabel: translate("HWHTITANART_MULTISELECT_SELECTED"),
        searchPlaceholder: translate("HWHTITANART_MULTISELECT_SEARCH"),
        selectAllLabel: translate("HWHTITANART_MULTISELECT_SELECT_ALL"),
        clearLabel: translate("HWHTITANART_MULTISELECT_CLEAR")
      });
    }
    function buildTitanOptions(ownedTitans, settings) {
      const ownedTitanIdSet = new Set(
        Object.keys(ownedTitans ?? {}).map((value) => Number(value)).filter((value) => Number.isFinite(value))
      );
      const titanOptions = getConfigTitanIds().map((titanId) => {
        const titanData = ownedTitans?.[titanId];
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
          artifactStates,
          levelsMarkup: buildArtifactLevelsMarkup(titanId, artifactStates),
          costMarkup: owned && settings?.showFullCosts ? buildArtifactNextCostMarkup(titanId, levels, settings) : ""
        };
      });
      return titanOptions.sort((left, right) => {
        if (left.owned !== right.owned) {
          return left.owned ? -1 : 1;
        }
        return left.name.localeCompare(right.name, "ru");
      });
    }
    function buildTitanLevelCostMarkup(level, settings = DEFAULT_LEVEL_SETTINGS) {
      const maxTitanLevel = Math.max(0, Number(settings?.maxTitanLevel) || 0);
      if (maxTitanLevel > 0 && Math.max(0, Number(level) || 0) >= maxTitanLevel) {
        return buildTitanValueMarkup("—", "muted");
      }
      const nextLevelCost = getTitanLevelUpCost(level);
      if (!nextLevelCost) {
        return buildTitanValueMarkup("—", "muted");
      }
      return buildTitanValueMarkup(formatNumber$1(nextLevelCost), "green");
    }
    function buildTitanLevelOptions(ownedTitans, settings = DEFAULT_LEVEL_SETTINGS, inventory = {}) {
      const ownedTitanIdSet = new Set(
        Object.keys(ownedTitans ?? {}).map((value) => Number(value)).filter((value) => Number.isFinite(value))
      );
      return getConfigTitanIds().map((titanId) => {
        const titanData = ownedTitans?.[titanId];
        const owned = ownedTitanIdSet.has(titanId);
        return {
          id: titanId,
          name: getTitanName(titanId),
          owned,
          titanData,
          level: Math.max(0, Number(titanData?.level) || 0),
          costMarkup: owned && settings?.showNextCosts ? buildTitanLevelCostMarkup(titanData?.level, settings) : "",
          evolutionMarkup: owned && settings?.showEvolutionProgress ? buildTitanEvolutionMarkup(titanId, titanData, inventory) : ""
        };
      }).sort((left, right) => {
        if (left.owned !== right.owned) {
          return left.owned ? -1 : 1;
        }
        return left.name.localeCompare(right.name, "ru");
      });
    }
    function buildTitanSkinLevelsMarkup(skinEntries) {
      if (!Array.isArray(skinEntries) || skinEntries.length <= 0) {
        return "—";
      }
      return skinEntries.map((entry) => buildTitanValueMarkup(formatNumber$1(entry.currentLevel), "gold")).join(buildTitanSeparatorMarkup());
    }
    function buildTitanSkinNextCostMarkup(titanSkinEntries, settings = DEFAULT_SKIN_SETTINGS) {
      const markupParts = titanSkinEntries.map((entry) => {
        const levelCap = Math.max(
          0,
          Number(settings?.skinLevelCaps?.[entry.localeKey]) || 0
        );
        const nextUpgrade = getTitanSkinNextUpgrade(entry.skinId, entry.currentLevel);
        const costText = levelCap > 0 && entry.currentLevel >= levelCap ? "—" : nextUpgrade ? formatNumber$1(nextUpgrade.cost) : "—";
        return buildTitanValueMarkup(costText, "gold");
      });
      return markupParts.length > 0 ? markupParts.join(buildTitanSeparatorMarkup()) : buildTitanValueMarkup("—", "muted");
    }
    function buildTitanSkinOptions(ownedTitans, settings = DEFAULT_SKIN_SETTINGS) {
      const ownedTitanIdSet = new Set(
        Object.keys(ownedTitans ?? {}).map((value) => Number(value)).filter((value) => Number.isFinite(value))
      );
      return getConfigTitanIds().map((titanId) => {
        const titanData = ownedTitans?.[titanId];
        const owned = ownedTitanIdSet.has(titanId);
        const skinEntries = getTitanSkinEntries(titanData);
        return {
          id: titanId,
          name: getTitanName(titanId),
          owned,
          titanData,
          skinEntries,
          skinsMarkup: buildTitanSkinLevelsMarkup(skinEntries),
          costMarkup: owned && settings?.showNextCosts ? buildTitanSkinNextCostMarkup(skinEntries, settings) : ""
        };
      }).sort((left, right) => {
        if (left.owned !== right.owned) {
          return left.owned ? -1 : 1;
        }
        return left.name.localeCompare(right.name, "ru");
      });
    }
    function getArtifactCostColor(slotId) {
      if (Number(slotId) === 0) {
        return "#f0d59f";
      }
      if (Number(slotId) === 1) {
        return "#d7b2ff";
      }
      return "#ffd36e";
    }
    function formatArtifactUpgradeCost(nextUpgrade) {
      if (!nextUpgrade) {
        return "—";
      }
      if (Number(nextUpgrade.goldCost) > 0) {
        return formatNumber$1(nextUpgrade.goldCost);
      }
      return formatNumber$1(nextUpgrade.resourceCost || nextUpgrade.cost);
    }
    function buildArtifactNextCostMarkup(titanId, levels, settings = DEFAULT_SETTINGS) {
      return ARTIFACT_SLOT_IDS.map((slotId) => {
        const currentLevel = Math.max(0, Number(levels?.[slotId]) || 0);
        const levelCap = Math.max(0, Number(settings?.artifactLevelCaps?.[slotId]) || 0);
        if (levelCap > 0 && currentLevel >= levelCap) {
          const costColor2 = getArtifactCostColor(slotId);
          return buildTitanValueMarkup("—", getTitanToneByColor(costColor2));
        }
        const nextUpgrade = getTitanArtifactNextUpgrade(titanId, slotId, currentLevel);
        const costText = formatArtifactUpgradeCost(nextUpgrade);
        const costColor = getArtifactCostColor(slotId);
        return buildTitanValueMarkup(costText, getTitanToneByColor(costColor));
      }).join(buildTitanSeparatorMarkup());
    }
    function sanitizeSelectedTitanIds(selectedTitanIds, ownedTitans) {
      const ownedTitanIdSet = new Set(
        Object.keys(ownedTitans ?? {}).map((value) => Number(value)).filter((value) => Number.isFinite(value))
      );
      return [...new Set(selectedTitanIds ?? [])].map((value) => Number(value)).filter((value) => Number.isFinite(value) && ownedTitanIdSet.has(value)).sort((left, right) => left - right);
    }
    function buildSettingsCard(content, accentColor = "#6e4a24") {
      return buildSettingsPanel(content, { accentColor });
    }
    function buildTooltipAttribute(tooltip = "") {
      return buildTooltipAttributeMarkup(tooltip);
    }
    function buildSettingsSection(title, iconName, content, accentColor = "#6e4a24", accordionKey = "", defaultOpen = true) {
      return `<details class="hwhx-accordion"${buildTitanAccordionStateAttributes(accordionKey, defaultOpen)}${buildCssVariableStyleMarkup({ "--hwhx-accent": accentColor })}><summary class="hwhx-accordion__summary"><span class="hwhx-accordion__heading">${buildAccordionArrowMarkup()}${buildInlineIcon(iconName)}<span>${escapeHtml$1(title)}</span></span></summary><div class="hwhx-accordion__body">${content}</div></details>`;
    }
    function buildSettingsField2(label, inputId, value, sideText = "", tooltip = "", maxValue = void 0) {
      const sideMarkup = sideText ? ` <span class="hwhx-side-value">[<span class="hwhx-side-value__main">${escapeHtml$1(sideText)}</span>]</span>` : "";
      const inputMarkup = buildNumberInputMarkup({
        id: inputId,
        value,
        minValue: 0,
        maxValue,
        title: tooltip
      });
      return `<label class="hwhx-form-row"${buildTooltipAttribute(tooltip)}><span class="hwhx-form-label">${escapeHtml$1(label)}${sideMarkup}</span><span class="hwhx-form-control">${inputMarkup}</span></label>`;
    }
    function buildSettingsSelect(label, inputId, value, options, widthPx = 168, tooltip = "") {
      const selectMarkup = buildCustomSelectMarkup({
        id: inputId,
        value,
        options,
        widthPx,
        title: tooltip
      });
      return `<label class="hwhx-form-row"${buildTooltipAttribute(tooltip)}${buildCssVariableStyleMarkup({ "--hwhx-field-width": `${widthPx}px` })}><span class="hwhx-form-label">${escapeHtml$1(label)}</span><span class="hwhx-form-control">${selectMarkup}</span></label>`;
    }
    function buildDoYourBestPlacementOptions$1(taskList) {
      return buildDoYourBestPlacementOptions({
        taskList,
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
    }
    function buildDoYourBestPlacementAccordion(moduleKeys = void 0) {
      const taskList = getDoYourBestTaskListSnapshot$1().filter(
        (task) => !isTitanDoYourBestTask(task)
      );
      const placementOptions = buildDoYourBestPlacementOptions$1(taskList);
      const hint = translate("HWHTITANART_DO_YOUR_BEST_PLACEMENT_HINT");
      const requestedModuleKeys = Array.isArray(moduleKeys) ? moduleKeys : moduleKeys ? [moduleKeys] : getTitanDoYourBestModuleDefinitions().map((definition) => definition.key);
      const accordionKey = requestedModuleKeys.length === 1 ? `trainer:do-your-best:${requestedModuleKeys[0]}` : "trainer:do-your-best";
      const moduleDefinitionMap = new Map(
        getTitanDoYourBestModuleDefinitions().map((definition) => [
          definition.key,
          definition
        ])
      );
      const selectMarkup = requestedModuleKeys.map((moduleKey) => moduleDefinitionMap.get(moduleKey)).filter(Boolean).map((definition) => {
        const storedPlacement = readStoredDoYourBestPlacementSync(definition.key);
        const selectedPlacement = placementOptions.some(
          (option) => option.value === storedPlacement
        ) ? storedPlacement : placementOptions.at(-1)?.value ?? DO_YOUR_BEST_PLACEMENT_END2;
        return buildSettingsSelect(
          `${translate("HWHTITANART_DO_YOUR_BEST_PLACEMENT_LABEL")} · ${translate(definition.labelKey)}`,
          getDoYourBestPlacementSelectId(definition.key),
          selectedPlacement,
          placementOptions,
          360,
          hint
        );
      }).join("");
      return `<details class="hwhx-accordion" data-hwhx-native-title="${escapeHtml$1(hint)}"${buildTitanAccordionStateAttributes(accordionKey, false)}${buildCssVariableStyleMarkup({ "--hwhx-accent": "#4d5770" })}><summary class="hwhx-accordion__summary"><span class="hwhx-accordion__heading">${buildAccordionArrowMarkup()}${buildInlineIcon("list-checks", "hwhx-blue")}<span>${escapeHtml$1(translate("HWHTITANART_DO_YOUR_BEST_PLACEMENT_HEADER"))}</span></span></summary><div class="hwhx-accordion__body">${selectMarkup}<div class="hwhx-hint">${escapeHtml$1(hint)}</div></div></details>`;
    }
    function buildTitanTrainerTechAccordion() {
      const donateMarkup = buildSettingsCard(
        `<div class="hwhx-info-line"${buildCssVariableStyleMarkup({
          "--hwhx-label-color": "#ffd36e",
          "--hwhx-value-color": "#f7e0bc"
        })}><span class="hwhx-info-line__label">${buildIconLabel("gift", translate("HWHTITANTRAINER_DONATE_TITLE"))}</span><span class="hwhx-info-line__value">${escapeHtml$1(translate("HWHTITANTRAINER_DONATE_WALLET", { wallet: "410011617614156" }))}</span></div><div class="hwhx-hint">${escapeHtml$1(translate("HWHTITANTRAINER_DONATE_TEXT"))}</div>`,
        "#6b4f29"
      );
      const actionMarkup = [
        {
          action: "exportSettings",
          label: translate("HWHTITANTRAINER_EXPORT_SETTINGS"),
          icon: "download",
          tone: "graphite"
        },
        {
          action: "importSettings",
          label: translate("HWHTITANTRAINER_IMPORT_SETTINGS"),
          icon: "upload",
          tone: "graphite"
        },
        {
          action: "feedback",
          label: translate("HWHTITANART_FEEDBACK_BUTTON"),
          icon: "message-circle",
          tone: "graphite"
        },
        {
          action: "whatsNew",
          label: translate("HWHTITANART_WHATS_NEW_BUTTON"),
          icon: "file-text",
          tone: "graphite"
        }
      ].map(
        (action) => `<button type="button" class="hwhx-button" data-tone="${escapeHtml$1(action.tone)}" data-action="${escapeHtml$1(action.action)}">${buildIconLabel(action.icon, action.label)}</button>`
      ).join("");
      return `<details class="hwhx-accordion"${buildTitanAccordionStateAttributes("trainer:tech", false)}${buildCssVariableStyleMarkup({ "--hwhx-accent": "#5f4528" })}><summary class="hwhx-accordion__summary"><span class="hwhx-accordion__heading">${buildAccordionArrowMarkup()}${buildInlineIcon("settings-2", "hwhx-gold")}<span>${escapeHtml$1(translate("HWHTITANTRAINER_TECH_SECTION"))}</span></span></summary><div class="hwhx-accordion__body">${donateMarkup}<div class="hwhx-native-actions hwhx-native-actions--left">${actionMarkup}</div></div></details>`;
    }
    function buildTitanTrainerInterfaceAccordion(artifactSettings, levelSettings, skinSettings) {
      const content = [
        buildPopupStyleCheckbox(
          UI_TOOLTIPS_INPUT_ID,
          artifactSettings?.uiTooltipsEnabled !== false,
          `${buildInlineIcon("message-circle", "hwhx-blue")}<span>${escapeHtml$1(translate("HWHTITANTRAINER_UI_TOOLTIPS"))}</span>`,
          translate("HWHTITAN_TOOLTIP_UI_TOOLTIPS")
        ),
        buildSettingsSelect(
          translate("HWHTITANTRAINER_BUTTON_PLACEMENT_LABEL"),
          TITAN_TRAINER_BUTTON_PLACEMENT_INPUT_ID,
          normalizeTitanTrainerButtonPlacement(
            artifactSettings?.titanTrainerButtonPlacement
          ),
          [
            {
              value: TITAN_TRAINER_BUTTON_PLACEMENT_MAIN,
              label: translate("HWHTITANTRAINER_BUTTON_PLACEMENT_MAIN"),
              icon: "play"
            },
            {
              value: TITAN_TRAINER_BUTTON_PLACEMENT_OTHER,
              label: translate("HWHTITANTRAINER_BUTTON_PLACEMENT_OTHER"),
              icon: "settings"
            }
          ],
          220,
          translate("HWHTITAN_TOOLTIP_BUTTON_PLACEMENT")
        ),
        buildPopupStyleCheckbox(
          SHOW_FULL_COST_INPUT_ID,
          !!artifactSettings?.showFullCosts,
          `${buildInlineIcon("coins", "hwhx-gold")}<span>${escapeHtml$1(translate("HWHTITANART_SHOW_FULL_COST"))}</span>`,
          translate("HWHTITAN_TOOLTIP_SHOW_FULL_COST")
        ),
        buildPopupStyleCheckbox(
          SHOW_LEVEL_COST_INPUT_ID,
          !!levelSettings?.showNextCosts,
          `${buildInlineIcon("coins", "hwhx-gold")}<span>${escapeHtml$1(translate("HWHTITANLVL_SHOW_NEXT_COST"))}</span>`,
          translate("HWHTITAN_TOOLTIP_SHOW_LEVEL_COST")
        ),
        buildPopupStyleCheckbox(
          SHOW_SKIN_COST_INPUT_ID,
          !!skinSettings?.showNextCosts,
          `${buildInlineIcon("coins", "hwhx-gold")}<span>${escapeHtml$1(translate("HWHTITANSKIN_SHOW_NEXT_COST"))}</span>`,
          translate("HWHTITAN_TOOLTIP_SHOW_SKIN_COST")
        ),
        buildPopupStyleCheckbox(
          SHOW_LEVEL_EVOLUTION_INPUT_ID,
          !!levelSettings?.showEvolutionProgress,
          `${buildInlineIcon("trophy", "hwhx-gold")}<span>${escapeHtml$1(translate("HWHTITANLVL_SHOW_EVOLUTION"))}</span>`,
          translate("HWHTITAN_TOOLTIP_SHOW_LEVEL_EVOLUTION")
        ),
        buildPopupStyleCheckbox(
          PROGRESS_AUTO_HIDE_RESULT_INPUT_ID,
          !!artifactSettings?.progressAutoHideResult,
          `${buildInlineIcon("clock", "hwhx-blue")}<span>${escapeHtml$1(translate("HWHTITANTRAINER_PROGRESS_AUTO_HIDE_RESULT"))}</span>`
        ),
        buildSettingsField2(
          translate("HWHTITANTRAINER_PROGRESS_AUTO_HIDE_TIMEOUT"),
          PROGRESS_AUTO_HIDE_TIMEOUT_INPUT_ID,
          Math.round(
            (artifactSettings?.progressAutoHideResultTimeoutMs ?? 5e3) / 1e3
          ),
          "",
          "",
          3600
        ),
        buildSettingsSelect(
          translate("HWHTITANTRAINER_PROGRESS_POSITION"),
          PROGRESS_POSITION_INPUT_ID,
          artifactSettings?.progressWindowPosition ?? "top-right",
          getProgressPositionOptions({
            topRight: translate("HWHTITANTRAINER_PROGRESS_POSITION_TOP_RIGHT"),
            topCenter: translate("HWHTITANTRAINER_PROGRESS_POSITION_TOP_CENTER"),
            bottomRight: translate("HWHTITANTRAINER_PROGRESS_POSITION_BOTTOM_RIGHT")
          }),
          240
        ),
        buildSettingsSelect(
          translate("HWHTITANTRAINER_PROGRESS_STYLE"),
          PROGRESS_STYLE_INPUT_ID,
          artifactSettings?.progressWindowStyle ?? "default",
          getProgressStyleOptions({
            default: translate("HWHTITANTRAINER_PROGRESS_STYLE_DEFAULT"),
            compact: translate("HWHTITANTRAINER_PROGRESS_STYLE_COMPACT")
          }),
          180
        ),
        buildSettingsSelect(
          translate("HWHTITANTRAINER_PROGRESS_THEME"),
          PROGRESS_THEME_INPUT_ID,
          artifactSettings?.progressWindowTheme ?? "default",
          getProgressThemeOptions({
            default: translate("HWHTITANTRAINER_PROGRESS_THEME_DEFAULT"),
            graphite: translate("HWHTITANTRAINER_PROGRESS_THEME_GRAPHITE"),
            green: translate("HWHTITANTRAINER_PROGRESS_THEME_GREEN"),
            gold: translate("HWHTITANTRAINER_PROGRESS_THEME_GOLD"),
            danger: translate("HWHTITANTRAINER_PROGRESS_THEME_DANGER")
          }),
          200
        )
      ].join("");
      return `<details class="hwhx-accordion"${buildTitanAccordionStateAttributes("trainer:interface", false)}${buildCssVariableStyleMarkup({ "--hwhx-accent": "#4d5770" })}><summary class="hwhx-accordion__summary"><span class="hwhx-accordion__heading">${buildAccordionArrowMarkup()}${buildInlineIcon("monitor", "hwhx-blue")}<span>${escapeHtml$1(translate("HWHTITANTRAINER_INTERFACE_SECTION"))}</span></span></summary><div class="hwhx-accordion__body">${content}</div></details>`;
    }
    function buildTitanTrainerGeneralSettingsHtml(artifactSettings, levelSettings, skinSettings) {
      return `<div class="hwhx-popup">${buildTitanTrainerInterfaceAccordion(artifactSettings, levelSettings, skinSettings)}${buildTitanTrainerTechAccordion()}</div>`;
    }
    function getScopedTitanElementById(elementId, rootNode = document) {
      return getScopedElementById(elementId, rootNode);
    }
    function readDoYourBestPlacementFromPopup(rootNode = document, moduleKey = void 0) {
      const allowedValues = buildDoYourBestPlacementOptions$1(
        getDoYourBestTaskListSnapshot$1().filter((task) => !isTitanDoYourBestTask(task))
      ).map((option) => option.value);
      const definitions = moduleKey === void 0 ? getTitanDoYourBestModuleDefinitions() : getTitanDoYourBestModuleDefinitions().filter(
        (definition) => definition.key === moduleKey
      );
      let didReadAnyPlacement = false;
      definitions.forEach((definition) => {
        const inputId = getDoYourBestPlacementSelectId(definition.key);
        const inputNode = getScopedTitanElementById(inputId, rootNode);
        if (!(inputNode instanceof HTMLInputElement || inputNode instanceof HTMLSelectElement)) {
          return;
        }
        const selectedValue = readSelectInputValue(
          inputId,
          readStoredDoYourBestPlacementSync(definition.key),
          rootNode
        );
        const normalizedValue = allowedValues.includes(selectedValue) ? selectedValue : readStoredDoYourBestPlacementSync(definition.key);
        persistDoYourBestPlacementSync(definition.key, normalizedValue);
        didReadAnyPlacement = true;
      });
      if (!didReadAnyPlacement) {
        return;
      }
      registerDoYourBestTitanTasks();
    }
    function buildLevelingModeSelect(inputId, settings) {
      return buildSettingsSelect(
        translate("HWHTITANART_LEVELING_MODE"),
        inputId,
        normalizeLevelingMode(settings?.levelingMode),
        [
          {
            value: LEVELING_MODE_MAX,
            label: translate("HWHTITANART_LEVELING_MODE_MAX"),
            icon: "arrow-up"
          },
          {
            value: LEVELING_MODE_AMOUNT,
            label: translate("HWHTITANART_LEVELING_MODE_AMOUNT"),
            icon: "calculator"
          }
        ],
        168,
        translate("HWHTITAN_TOOLTIP_LEVELING_MODE")
      );
    }
    function buildChecklistAmountControls(behaviorInputId, amountInputId, settings) {
      const hint = translate("HWHTITANART_CHECKLIST_AMOUNT_HINT");
      return [
        buildSettingsSelect(
          translate("HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_LABEL"),
          behaviorInputId,
          normalizeChecklistAmountBehavior(settings?.checklistAmountBehavior),
          [
            {
              value: CHECKLIST_AMOUNT_BEHAVIOR_SKIP,
              label: translate("HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_SKIP"),
              icon: "x"
            },
            {
              value: CHECKLIST_AMOUNT_BEHAVIOR_DEFAULT,
              label: translate("HWHTITANART_CHECKLIST_AMOUNT_BEHAVIOR_DEFAULT"),
              icon: "list-checks"
            }
          ],
          260,
          translate("HWHTITAN_TOOLTIP_CHECKLIST_AMOUNT_BEHAVIOR")
        ),
        buildSettingsField2(
          translate("HWHTITANART_CHECKLIST_LEVELING_AMOUNT"),
          amountInputId,
          getChecklistLevelingAmount(settings),
          "",
          translate("HWHTITAN_TOOLTIP_CHECKLIST_LEVELING_AMOUNT")
        ),
        `<div class="hwhx-hint">${escapeHtml$1(hint)}</div>`
      ].join("");
    }
    function buildCalculatorNumberField(label, inputId, value, maxValue = void 0, tooltip = "") {
      return `<label class="hwhx-form-row"${buildTooltipAttribute(tooltip)}><span class="hwhx-form-label">${escapeHtml$1(label)}</span><span class="hwhx-form-control">${buildNumberInputMarkup({ id: inputId, value, minValue: 1, maxValue, widthPx: 110, title: tooltip })}</span></label>`;
    }
    function getCalculatorTitanSelectOptions(titanOptions) {
      const ownedTitanOptions = (titanOptions ?? []).filter(
        (titanOption) => Boolean(titanOption?.owned)
      );
      const sourceOptions = ownedTitanOptions.length > 0 ? ownedTitanOptions : titanOptions ?? [];
      return sourceOptions.map((titanOption) => ({
        value: String(titanOption.id),
        label: titanOption.name,
        icon: "users"
      }));
    }
    function getPreferredCalculatorTitanId(titanOptions, selectedTitanIds) {
      const selectedTitanIdSet = new Set(
        (selectedTitanIds ?? []).map((titanId) => Number(titanId))
      );
      const ownedTitanOptions = (titanOptions ?? []).filter(
        (titanOption) => Boolean(titanOption?.owned)
      );
      const preferredTitanOption = ownedTitanOptions.find(
        (titanOption) => selectedTitanIdSet.has(Number(titanOption.id))
      ) ?? ownedTitanOptions[0] ?? (titanOptions ?? [])[0];
      return Number(preferredTitanOption?.id) || 0;
    }
    function findCalculatorTitanOption(titanOptions, titanId) {
      return (titanOptions ?? []).find(
        (titanOption) => Number(titanOption?.id) === Number(titanId)
      );
    }
    function getArtifactCalculatorDefaultLevels(titanOptions, titanId, slotId) {
      const titanOption = findCalculatorTitanOption(titanOptions, titanId);
      const currentLevel = Math.max(1, Number(titanOption?.levels?.[slotId]) || 1);
      const maxLevel = getMaxArtifactLevelFromConfig(
        getTitanArtifactConfig(titanId, slotId)?.levelConfigMap ?? {}
      );
      const targetLevel = maxLevel > 0 ? Math.min(maxLevel, currentLevel + 1) : currentLevel + 1;
      return {
        startLevel: currentLevel,
        endLevel: Math.max(currentLevel, targetLevel)
      };
    }
    function getLevelCalculatorDefaultLevels(titanOptions, titanId) {
      const titanOption = findCalculatorTitanOption(titanOptions, titanId);
      const currentLevel = Math.max(1, Number(titanOption?.level) || 1);
      const maxLevel = getMaxTitanLevel();
      const targetLevel = maxLevel > 0 ? Math.min(maxLevel, currentLevel + 1) : currentLevel + 1;
      return {
        startLevel: currentLevel,
        endLevel: Math.max(currentLevel, targetLevel)
      };
    }
    function findSkinCalculatorEntry(titanOptions, skinGroups, titanId, localeKey) {
      const titanOption = findCalculatorTitanOption(titanOptions, titanId);
      const skinEntry = (titanOption?.skinEntries ?? []).find(
        (entry) => entry.localeKey === localeKey
      );
      if (skinEntry) {
        return skinEntry;
      }
      const skinGroup = (skinGroups ?? []).find((group) => group.localeKey === localeKey);
      return skinGroup ? {
        skinId: skinGroup.skinIds?.[0],
        localeKey: skinGroup.localeKey,
        name: skinGroup.name,
        currentLevel: 1,
        maxLevel: skinGroup.maxLevel
      } : void 0;
    }
    function getSkinCalculatorDefaultLevels(titanOptions, skinGroups, titanId, localeKey) {
      const skinEntry = findSkinCalculatorEntry(
        titanOptions,
        skinGroups,
        titanId,
        localeKey
      );
      const currentLevel = Math.max(1, Number(skinEntry?.currentLevel) || 1);
      const maxLevel = Math.max(0, Number(skinEntry?.maxLevel) || 0);
      const targetLevel = maxLevel > 0 ? Math.min(maxLevel, currentLevel + 1) : currentLevel + 1;
      return {
        startLevel: currentLevel,
        endLevel: Math.max(currentLevel, targetLevel)
      };
    }
    function buildArtifactCostCalculatorAccordion(titanOptions, settings) {
      const titanId = getPreferredCalculatorTitanId(
        titanOptions,
        settings?.selectedTitanIds
      );
      const slotId = Number(settings?.selectedArtifactSlotIds?.[0]) || 0;
      const levels = getArtifactCalculatorDefaultLevels(titanOptions, titanId, slotId);
      const maxLevel = getTitanArtifactMaxLevel(titanId, slotId);
      const slotOptions = ARTIFACT_SLOT_IDS.map((artifactSlotId) => {
        const slotMeta = getArtifactSlotMeta(artifactSlotId);
        return {
          value: String(artifactSlotId),
          label: slotMeta.label,
          icon: "hammer"
        };
      });
      const content = [
        buildSettingsSelect(
          translate("HWHTITANART_CALC_TITAN"),
          ARTIFACT_CALC_TITAN_SELECT_ID,
          String(titanId),
          getCalculatorTitanSelectOptions(titanOptions),
          260,
          translate("HWHTITAN_TOOLTIP_CALC_TITAN")
        ),
        buildSettingsSelect(
          translate("HWHTITANART_CALC_ARTIFACT"),
          ARTIFACT_CALC_SLOT_SELECT_ID,
          String(slotId),
          slotOptions,
          220,
          translate("HWHTITAN_TOOLTIP_CALC_ARTIFACT")
        ),
        buildCalculatorNumberField(
          translate("HWHTITANART_CALC_FROM_LEVEL"),
          ARTIFACT_CALC_START_INPUT_ID,
          levels.startLevel,
          maxLevel,
          translate("HWHTITAN_TOOLTIP_CALC_FROM_LEVEL")
        ),
        buildCalculatorNumberField(
          translate("HWHTITANART_CALC_TO_LEVEL"),
          ARTIFACT_CALC_END_INPUT_ID,
          levels.endLevel,
          maxLevel,
          translate("HWHTITAN_TOOLTIP_CALC_TO_LEVEL")
        ),
        `<div id="${escapeHtml$1(ARTIFACT_CALC_RESULT_ID)}" class="hwhx-calc-result"></div>`
      ].join("");
      return `<details class="hwhx-accordion"${buildTitanAccordionStateAttributes("artifact:calculator", false)}${buildCssVariableStyleMarkup({ "--hwhx-accent": "#5f4528" })}><summary class="hwhx-accordion__summary"><span class="hwhx-accordion__heading">${buildAccordionArrowMarkup()}${buildInlineIcon("calculator", "hwhx-gold")}<span>${escapeHtml$1(translate("HWHTITANART_CALCULATOR_HEADER"))}</span></span></summary><div class="hwhx-accordion__body"><div class="hwhx-calc-grid">${content}</div></div></details>`;
    }
    function buildTitanLevelCostCalculatorAccordion(titanOptions, settings) {
      const titanId = getPreferredCalculatorTitanId(
        titanOptions,
        settings?.selectedTitanIds
      );
      const levels = getLevelCalculatorDefaultLevels(titanOptions, titanId);
      const maxLevel = getMaxTitanLevel();
      const content = [
        buildSettingsSelect(
          translate("HWHTITANART_CALC_TITAN"),
          LEVEL_CALC_TITAN_SELECT_ID,
          String(titanId),
          getCalculatorTitanSelectOptions(titanOptions),
          260,
          translate("HWHTITAN_TOOLTIP_CALC_TITAN")
        ),
        buildCalculatorNumberField(
          translate("HWHTITANART_CALC_FROM_LEVEL"),
          LEVEL_CALC_START_INPUT_ID,
          levels.startLevel,
          maxLevel,
          translate("HWHTITAN_TOOLTIP_CALC_FROM_LEVEL")
        ),
        buildCalculatorNumberField(
          translate("HWHTITANART_CALC_TO_LEVEL"),
          LEVEL_CALC_END_INPUT_ID,
          levels.endLevel,
          maxLevel,
          translate("HWHTITAN_TOOLTIP_CALC_TO_LEVEL")
        ),
        `<div id="${escapeHtml$1(LEVEL_CALC_RESULT_ID)}" class="hwhx-calc-result"></div>`
      ].join("");
      return `<details class="hwhx-accordion"${buildTitanAccordionStateAttributes("level:calculator", false)}${buildCssVariableStyleMarkup({ "--hwhx-accent": "#3f5a49" })}><summary class="hwhx-accordion__summary"><span class="hwhx-accordion__heading">${buildAccordionArrowMarkup()}${buildInlineIcon("calculator", "hwhx-gold")}<span>${escapeHtml$1(translate("HWHTITANART_CALCULATOR_HEADER"))}</span></span></summary><div class="hwhx-accordion__body"><div class="hwhx-calc-grid">${content}</div></div></details>`;
    }
    function buildTitanSkinCostCalculatorAccordion(titanOptions, skinGroups, settings) {
      const titanId = getPreferredCalculatorTitanId(
        titanOptions,
        settings?.selectedTitanIds
      );
      const selectedLocaleKey = (settings?.selectedSkinLocaleKeys ?? []).find(
        (localeKey) => (skinGroups ?? []).some((group) => group.localeKey === localeKey)
      ) ?? skinGroups?.[0]?.localeKey ?? "";
      const levels = getSkinCalculatorDefaultLevels(
        titanOptions,
        skinGroups,
        titanId,
        selectedLocaleKey
      );
      const maxLevel = findSkinCalculatorEntry(
        titanOptions,
        skinGroups,
        titanId,
        selectedLocaleKey
      )?.maxLevel;
      const skinOptions = (skinGroups ?? []).map((skinGroup) => ({
        value: skinGroup.localeKey,
        label: skinGroup.name,
        icon: "shirt"
      }));
      const content = [
        buildSettingsSelect(
          translate("HWHTITANART_CALC_TITAN"),
          SKIN_CALC_TITAN_SELECT_ID,
          String(titanId),
          getCalculatorTitanSelectOptions(titanOptions),
          260,
          translate("HWHTITAN_TOOLTIP_CALC_TITAN")
        ),
        buildSettingsSelect(
          translate("HWHTITANART_CALC_SKIN"),
          SKIN_CALC_GROUP_SELECT_ID,
          selectedLocaleKey,
          skinOptions,
          260,
          translate("HWHTITAN_TOOLTIP_CALC_SKIN")
        ),
        buildCalculatorNumberField(
          translate("HWHTITANART_CALC_FROM_LEVEL"),
          SKIN_CALC_START_INPUT_ID,
          levels.startLevel,
          maxLevel,
          translate("HWHTITAN_TOOLTIP_CALC_FROM_LEVEL")
        ),
        buildCalculatorNumberField(
          translate("HWHTITANART_CALC_TO_LEVEL"),
          SKIN_CALC_END_INPUT_ID,
          levels.endLevel,
          maxLevel,
          translate("HWHTITAN_TOOLTIP_CALC_TO_LEVEL")
        ),
        `<div id="${escapeHtml$1(SKIN_CALC_RESULT_ID)}" class="hwhx-calc-result"></div>`
      ].join("");
      return `<details class="hwhx-accordion"${buildTitanAccordionStateAttributes("skin:calculator", false)}${buildCssVariableStyleMarkup({ "--hwhx-accent": "#4d5770" })}><summary class="hwhx-accordion__summary"><span class="hwhx-accordion__heading">${buildAccordionArrowMarkup()}${buildInlineIcon("calculator", "hwhx-gold")}<span>${escapeHtml$1(translate("HWHTITANART_CALCULATOR_HEADER"))}</span></span></summary><div class="hwhx-accordion__body"><div class="hwhx-calc-grid">${content}</div></div></details>`;
    }
    function buildPopupStyleCheckbox(inputId, checked, labelMarkup, tooltip = "") {
      return `<label class="hwhx-checkbox-row" for="${escapeHtml$1(inputId)}"${buildTooltipAttribute(tooltip)}><span class="hwhx-checkbox-box"><input id="${escapeHtml$1(inputId)}" type="checkbox" class="hwhx-checkbox-input"${checked ? " checked" : ""}></span><span class="hwhx-checkbox-label hwhx-inline-label">${labelMarkup}</span></label>`;
    }
    function buildLevelGainBadge(levelGainAmount) {
      return `<span class="hwhx-badge hwhx-badge--gain" data-hwhtitan-level-gain-badge="1">${escapeHtml$1(translate("HWHTITANART_LEVEL_GAIN", { amount: formatNumber$1(levelGainAmount) }))}</span>`;
    }
    function getArtifactPreviewMaxUpgradeCount(settings) {
      return normalizeLevelingMode(settings?.levelingMode) === LEVELING_MODE_AMOUNT ? getChecklistLevelingAmount(settings) : void 0;
    }
    function buildOwnedTitansFromOptions(titanOptions) {
      return Object.fromEntries(
        (titanOptions ?? []).filter((titanOption) => titanOption?.owned).map((titanOption) => [
          Number(titanOption.id),
          titanOption.titanData ?? {
            level: titanOption.level,
            skins: titanOption.skinEntries
          }
        ]).filter(([titanId]) => Number.isFinite(titanId))
      );
    }
    function calculateArtifactLevelGain(settings, ownedTitans, resourceAmount, goldAmount) {
      const plan = buildUpgradePlan(
        sanitizeSelectedTitanIds(settings?.selectedTitanIds, ownedTitans),
        settings?.selectedArtifactSlotIds,
        settings?.artifactLevelCaps,
        ownedTitans,
        resourceAmount,
        settings?.essenceReserve,
        goldAmount,
        settings?.artifactGoldReserve,
        getArtifactPreviewMaxUpgradeCount(settings)
      );
      return plan.queue.length;
    }
    function calculateTitanLevelGain(titanOptions, settings, potionAmount) {
      const ownedTitans = buildOwnedTitansFromOptions(titanOptions);
      const plan = buildTitanLevelPlan(
        sanitizeSelectedTitanIds(settings?.selectedTitanIds, ownedTitans),
        ownedTitans,
        potionAmount,
        settings?.potionReserve,
        settings?.maxTitanLevel,
        getArtifactPreviewMaxUpgradeCount(settings)
      );
      return plan.queue.length;
    }
    function calculateTitanSkinLevelGain(titanOptions, settings, skinStoneAmount) {
      const ownedTitans = buildOwnedTitansFromOptions(titanOptions);
      const plan = buildTitanSkinPlan(
        sanitizeSelectedTitanIds(settings?.selectedTitanIds, ownedTitans),
        settings?.selectedSkinLocaleKeys,
        settings?.skinLevelCaps,
        ownedTitans,
        skinStoneAmount,
        settings?.skinStoneReserve,
        getArtifactPreviewMaxUpgradeCount(settings)
      );
      return plan.queue.length;
    }
    function buildTitanSelectionAccordion(titanOptions, selectedTitanIds, labelBuilder, levelGainAmount = 0, accordionKey = "titan-list") {
      const selectedTitanIdSet = new Set(
        (selectedTitanIds ?? []).map((titanId) => Number(titanId))
      );
      const ownedCount = titanOptions.filter((titanOption) => titanOption.owned).length;
      const selectedCount = titanOptions.filter(
        (titanOption) => titanOption.owned && selectedTitanIdSet.has(Number(titanOption.id))
      ).length;
      const rowMarkup = titanOptions.map((titanOption) => {
        const inputId = `${TITAN_SELECTION_INPUT_PREFIX}${titanOption.id}`;
        const checked = selectedTitanIdSet.has(Number(titanOption.id));
        const titleText = titanOption.owned ? titanOption.maxed ? translate("HWHTITANART_ALL_ARTIFACTS_MAXED_TOOLTIP") : titanOption.name : translate("HWHTITANART_NO_OWNED_TOOLTIP");
        const fullTitleText = `${titleText} · ID: ${titanOption.id}`;
        return `<label class="hwhx-titan-row${checked ? " is-checked" : ""}${titanOption.owned ? "" : " is-disabled"}" data-hwhtitan-titan-row="1"${titanOption.owned ? ' data-hwhx-accordion-filter-row="1"' : ""} data-hwhx-native-title="${escapeHtml$1(fullTitleText)}"><input class="hwhx-checkbox-input" id="${escapeHtml$1(inputId)}" type="checkbox" data-hwhtitan-titan-checkbox="1" data-name="${escapeHtml$1(String(titanOption.id))}" value="${escapeHtml$1(String(titanOption.id))}"${checked ? " checked" : ""}${titanOption.owned ? "" : " disabled"}><span class="hwhx-titan-label" data-hwhtitan-titan-label="1">${labelBuilder(titanOption)}</span></label>`;
      }).join("");
      const selectedBadge = `<span class="hwhx-badge hwhx-badge--filter hwhx-badge--filter-active" role="button" tabindex="0" data-hwhx-accordion-filter-option="active">${escapeHtml$1(formatNumber$1(selectedCount))}</span>`;
      const inactiveBadge = `<span class="hwhx-badge hwhx-badge--filter hwhx-badge--filter-inactive" role="button" tabindex="0" data-hwhx-accordion-filter-option="inactive">${escapeHtml$1(formatNumber$1(Math.max(0, ownedCount - selectedCount)))}</span>`;
      const totalBadge = `<span class="hwhx-badge hwhx-badge--total">${escapeHtml$1(formatNumber$1(ownedCount))}</span>`;
      const levelGainBadge = buildLevelGainBadge(levelGainAmount);
      return `<details class="hwhx-accordion" data-hwhx-accordion-key="${escapeHtml$1(accordionKey)}"${buildTitanAccordionStateAttributes(`titan-list:${accordionKey}`, true)}${buildCssVariableStyleMarkup({ "--hwhx-accent": "#4d5770" })}><summary class="hwhx-accordion__summary"><span class="hwhx-accordion__heading">${buildAccordionArrowMarkup()}${buildInlineIcon("users", "hwhx-blue")}<span>${escapeHtml$1(translate("HWHTITANART_TITAN_LIST_HEADER"))}</span></span><span class="hwhx-badges">${levelGainBadge}${selectedBadge}${inactiveBadge}${totalBadge}</span></summary><div class="hwhx-scroll-list hwhx-accordion__body">${rowMarkup}</div></details>`;
    }
    function buildSettingsHtml(settings, titanOptions, ownedTitans, resourceAmount, goldAmount, fragmentCoinAmount, inventory = {}, actionBarMarkup = "", renderOptions = {}) {
      const slotMetas = ARTIFACT_SLOT_IDS.map((slotId) => getArtifactSlotMeta(slotId));
      const slotLabels = [
        translate("HWHTITANART_FIRST_ARTIFACT"),
        translate("HWHTITANART_SECOND_ARTIFACT"),
        translate("HWHTITANART_THIRD_ARTIFACT")
      ];
      const slotCapLabels = [
        translate("HWHTITANART_FIRST_ARTIFACT_CAP"),
        translate("HWHTITANART_SECOND_ARTIFACT_CAP"),
        translate("HWHTITANART_THIRD_ARTIFACT_CAP")
      ];
      const slotControls = ARTIFACT_SLOT_IDS.map((slotId) => {
        const slotMeta = slotMetas[slotId];
        return `<div class="hwhx-settings-slot-card">${buildPopupStyleCheckbox(`${SLOT_FILTER_INPUT_PREFIX}${slotId}`, settings.selectedArtifactSlotIds.includes(slotId), `${buildInlineIcon(slotMeta.icon, slotMeta.className)}<span>${escapeHtml$1(slotLabels[slotId])}</span>`, translate("HWHTITAN_TOOLTIP_ARTIFACT_SLOT"))}${buildSettingsField2(slotCapLabels[slotId], `${ARTIFACT_LEVEL_CAP_INPUT_PREFIX}${slotId}`, settings.artifactLevelCaps?.[slotId], "", translate("HWHTITAN_TOOLTIP_ARTIFACT_LEVEL_CAP"), getDefaultArtifactLevelCap(slotId))}</div>`;
      }).join("");
      const levelingSection = [
        buildLevelingModeSelect(ARTIFACT_LEVELING_MODE_SELECT_ID, settings),
        `<div class="hwhx-section-label">${escapeHtml$1(translate("HWHTITANART_SLOT_FILTER"))}</div>`,
        `<div class="hwhx-settings-slot-grid">${slotControls}</div>`
      ].join("");
      const resourceSection = [
        buildSettingsField2(
          translate("HWHTITANART_ESSENCE_RESERVE"),
          ESSENCE_RESERVE_INPUT_ID,
          settings.essenceReserve,
          formatNumber$1(resourceAmount),
          translate("HWHTITAN_TOOLTIP_ESSENCE_RESERVE")
        ),
        buildSettingsField2(
          translate("HWHTITANART_GOLD_RESERVE"),
          ARTIFACT_GOLD_RESERVE_INPUT_ID,
          settings.artifactGoldReserve,
          formatNumber$1(goldAmount),
          translate("HWHTITAN_TOOLTIP_GOLD_RESERVE")
        ),
        buildSettingsField2(
          translate("HWHTITANART_FRAGMENT_COIN_RESERVE"),
          ARTIFACT_FRAGMENT_COIN_RESERVE_INPUT_ID,
          settings.artifactFragmentCoinReserve,
          formatNumber$1(fragmentCoinAmount),
          translate("HWHTITAN_TOOLTIP_FRAGMENT_COIN_RESERVE")
        )
      ].join("");
      const evolutionSection = [
        `<div class="hwhx-control-stack">${buildPopupStyleCheckbox(ARTIFACT_EVOLVE_INPUT_ID, !!settings.evolveArtifacts, `${buildInlineIcon("sparkles", "hwhx-purple")}<span>${escapeHtml$1(translate("HWHTITANART_EVOLVE_ARTIFACTS"))}</span>`, translate("HWHTITAN_TOOLTIP_EVOLVE_ARTIFACTS"))}${buildPopupStyleCheckbox(ARTIFACT_BUY_FRAGMENTS_INPUT_ID, !!settings.buyArtifactFragments, `${buildInlineIcon("shopping-bag", "hwhx-gold")}<span>${escapeHtml$1(translate("HWHTITANART_BUY_ARTIFACT_FRAGMENTS"))}</span>`, translate("HWHTITAN_TOOLTIP_BUY_ARTIFACT_FRAGMENTS"))}</div>`,
        buildSettingsField2(
          translate("HWHTITANART_EVOLUTION_MAX_STAR"),
          ARTIFACT_EVOLUTION_MAX_STAR_INPUT_ID,
          settings.artifactEvolutionMaxStar || getMaxKnownTitanArtifactStar(),
          "",
          translate("HWHTITAN_TOOLTIP_ARTIFACT_EVOLUTION_MAX_STAR"),
          getMaxKnownTitanArtifactStar()
        ),
        `<label class="hwhx-form-row hwhx-form-row--stack"${buildTooltipAttribute(translate("HWHTITAN_TOOLTIP_ARTIFACT_EVOLVE_TARGETS"))}><span class="hwhx-form-label">${escapeHtml$1(translate("HWHTITANART_EVOLVE_TARGETS"))}</span><span class="hwhx-form-control">${buildTrainerMultiSelect(ARTIFACT_EVOLVE_TARGETS_INPUT_ID, settings.selectedArtifactEvolutionKeys, buildArtifactTargetGroups(ownedTitans, { inventory, maxArtifactStar: settings.artifactEvolutionMaxStar }))}</span></label>`,
        `<label class="hwhx-form-row hwhx-form-row--stack"${buildTooltipAttribute(translate("HWHTITAN_TOOLTIP_ARTIFACT_FRAGMENT_BUY_TARGETS"))}><span class="hwhx-form-label">${escapeHtml$1(translate("HWHTITANART_FRAGMENT_BUY_TARGETS"))}</span><span class="hwhx-form-control">${buildTrainerMultiSelect(ARTIFACT_FRAGMENT_BUY_TARGETS_INPUT_ID, settings.selectedArtifactFragmentBuyKeys, buildArtifactTargetGroups(ownedTitans, { buyableOnly: true, mode: "fragments", inventory, maxArtifactStar: settings.artifactEvolutionMaxStar }))}</span></label>`
      ].join("");
      const automationSection = [
        buildChecklistAmountControls(
          ARTIFACT_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID,
          ARTIFACT_CHECKLIST_AMOUNT_INPUT_ID,
          settings
        ),
        buildSettingsSelect(
          translate("HWHTITANART_CHECKLIST_FRAGMENT_BEHAVIOR_LABEL"),
          ARTIFACT_CHECKLIST_FRAGMENT_BEHAVIOR_SELECT_ID,
          normalizeChecklistFragmentPurchaseBehavior(
            settings?.checklistFragmentPurchaseBehavior
          ),
          [
            {
              value: CHECKLIST_FRAGMENT_BEHAVIOR_USE_SETTINGS,
              label: translate("HWHTITANART_CHECKLIST_FRAGMENT_BEHAVIOR_USE_SETTINGS"),
              icon: "shopping-bag"
            },
            {
              value: CHECKLIST_FRAGMENT_BEHAVIOR_SKIP,
              label: translate("HWHTITANART_CHECKLIST_FRAGMENT_BEHAVIOR_SKIP"),
              icon: "x"
            }
          ],
          260,
          translate("HWHTITAN_TOOLTIP_BUY_ARTIFACT_FRAGMENTS")
        ),
        renderOptions.includeDisplaySettings === false ? "" : `<div class="hwhx-control-group">${buildPopupStyleCheckbox(SHOW_FULL_COST_INPUT_ID, !!settings.showFullCosts, `${buildInlineIcon("coins")}<span>${escapeHtml$1(translate("HWHTITANART_SHOW_FULL_COST"))}</span>`, translate("HWHTITAN_TOOLTIP_SHOW_FULL_COST"))}</div>`,
        `<div class="hwhx-control-group">${buildPopupStyleCheckbox("hwhtitanartifact-sync-after-run", !!settings.syncAfterRun, `${buildInlineIcon("refresh-cw")}<span>${escapeHtml$1(translate("HWHTITANART_SYNC_AFTER_RUN"))}</span>`, translate("HWHTITAN_TOOLTIP_SYNC_AFTER_RUN"))}</div>`
      ].join("");
      const settingsContent = `<div class="hwhx-settings-grid">${buildSettingsSection(translate("HWHTITANART_LEVELING_SECTION"), "arrow-up", levelingSection, "#4d5770", "artifact:leveling")}${buildSettingsSection(translate("HWHTITANART_RESOURCES_SECTION"), "coins", resourceSection, "#6b4f29", "artifact:resources")}${buildSettingsSection(translate("HWHTITANART_EVOLUTION_SECTION"), "sparkles", evolutionSection, "#5b3f70", "artifact:evolution")}${buildSettingsSection(translate("HWHTITANART_AUTOMATION_SECTION"), "settings", automationSection, "#3f5a49", "artifact:automation")}</div>`;
      const headerMarkup = renderOptions.includeHeader === false ? "" : `<div class="hwhx-title">${escapeHtml$1(translate("HWHTITANART_TITLE"))}</div>${buildSettingsCard(`<div class="hwhx-text">${escapeHtml$1(translate("HWHTITANART_DESCRIPTION"))}</div>`, "#5f4528")}`;
      const doYourBestMarkup = renderOptions.includeDoYourBest === false ? "" : buildDoYourBestPlacementAccordion(TITAN_TRAINER_TAB_ARTIFACTS);
      return `<div class="hwhx-popup">${headerMarkup}${buildTitanSelectionAccordion(titanOptions, settings.selectedTitanIds, buildTitanOptionLabel, calculateArtifactLevelGain(settings, ownedTitans, resourceAmount, goldAmount), renderOptions.titanAccordionKey ?? "titan-list")}${settingsContent}${buildArtifactCostCalculatorAccordion(titanOptions, settings)}${doYourBestMarkup}${actionBarMarkup}</div>`;
    }
    function buildTitanLevelSettingsHtml(settings, titanOptions, potionAmount, inventory = {}, actionBarMarkup = "", renderOptions = {}) {
      const levelingSection = [
        buildLevelingModeSelect(TITAN_LEVELING_MODE_SELECT_ID, settings),
        buildSettingsField2(
          translate("HWHTITANLVL_MAX_LEVEL"),
          TITAN_LEVEL_CAP_INPUT_ID,
          settings.maxTitanLevel,
          "",
          translate("HWHTITAN_TOOLTIP_TITAN_LEVEL_CAP"),
          getMaxTitanLevel()
        )
      ].join("");
      const resourceSection = buildSettingsField2(
        translate("HWHTITANLVL_POTION_RESERVE"),
        POTION_RESERVE_INPUT_ID,
        settings.potionReserve,
        formatNumber$1(potionAmount),
        translate("HWHTITAN_TOOLTIP_POTION_RESERVE")
      );
      const evolutionSection = [
        `<label class="hwhx-form-row hwhx-form-row--stack"${buildTooltipAttribute(translate("HWHTITAN_TOOLTIP_TITAN_EVOLVE_TARGETS"))}><span class="hwhx-form-label">${escapeHtml$1(translate("HWHTITANLVL_EVOLVE_TARGETS"))}</span><span class="hwhx-form-control">${buildTrainerMultiSelect(TITAN_EVOLVE_TARGETS_INPUT_ID, settings.selectedTitanEvolutionIds, buildTitanEvolutionTargetGroups(Object.fromEntries((titanOptions ?? []).filter((titanOption) => titanOption.owned).map((titanOption) => [titanOption.id, titanOption.titanData ?? {}])), inventory))}</span></label>`,
        buildSettingsField2(
          translate("HWHTITANLVL_EVOLUTION_MAX_STAR"),
          TITAN_EVOLUTION_MAX_STAR_INPUT_ID,
          settings.titanEvolutionMaxStar || getMaxTitanEvolutionStar(),
          "",
          translate("HWHTITAN_TOOLTIP_TITAN_EVOLUTION_MAX_STAR"),
          getMaxTitanEvolutionStar()
        )
      ].join("");
      const automationSection = [
        buildChecklistAmountControls(
          TITAN_LEVEL_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID,
          TITAN_LEVEL_CHECKLIST_AMOUNT_INPUT_ID,
          settings
        ),
        renderOptions.includeDisplaySettings === false ? "" : `<div class="hwhx-control-group">${buildPopupStyleCheckbox(SHOW_LEVEL_COST_INPUT_ID, !!settings.showNextCosts, `${buildInlineIcon("coins")}<span>${escapeHtml$1(translate("HWHTITANLVL_SHOW_NEXT_COST"))}</span>`, translate("HWHTITAN_TOOLTIP_SHOW_LEVEL_COST"))}${buildPopupStyleCheckbox(SHOW_LEVEL_EVOLUTION_INPUT_ID, !!settings.showEvolutionProgress, `${buildInlineIcon("trophy", "hwhx-gold")}<span>${escapeHtml$1(translate("HWHTITANLVL_SHOW_EVOLUTION"))}</span>`, translate("HWHTITAN_TOOLTIP_SHOW_LEVEL_EVOLUTION"))}</div>`,
        `<div class="hwhx-control-group">${buildPopupStyleCheckbox("hwhtitanlevel-sync-after-run", !!settings.syncAfterRun, `${buildInlineIcon("refresh-cw")}<span>${escapeHtml$1(translate("HWHTITANART_SYNC_AFTER_RUN"))}</span>`, translate("HWHTITAN_TOOLTIP_SYNC_AFTER_RUN"))}</div>`
      ].join("");
      const settingsContent = `<div class="hwhx-settings-grid">${buildSettingsSection(translate("HWHTITANART_LEVELING_SECTION"), "arrow-up", levelingSection, "#4d5770", "level:leveling")}${buildSettingsSection(translate("HWHTITANART_RESOURCES_SECTION"), "flask", resourceSection, "#6b4f29", "level:resources")}${buildSettingsSection(translate("HWHTITANART_EVOLUTION_SECTION"), "sparkles", evolutionSection, "#5b3f70", "level:evolution")}${buildSettingsSection(translate("HWHTITANART_AUTOMATION_SECTION"), "settings", automationSection, "#3f5a49", "level:automation")}</div>`;
      const headerMarkup = renderOptions.includeHeader === false ? "" : `<div class="hwhx-title">${escapeHtml$1(translate("HWHTITANLVL_TITLE"))}</div>${buildSettingsCard(`<div class="hwhx-text">${escapeHtml$1(translate("HWHTITANLVL_DESCRIPTION"))}</div>`, "#5f4528")}`;
      const doYourBestMarkup = renderOptions.includeDoYourBest === false ? "" : buildDoYourBestPlacementAccordion(TITAN_TRAINER_TAB_LEVELS);
      return `<div class="hwhx-popup">${headerMarkup}${buildTitanSelectionAccordion(titanOptions, settings.selectedTitanIds, buildTitanLevelOptionLabel, calculateTitanLevelGain(titanOptions, settings, potionAmount), renderOptions.titanAccordionKey ?? "titan-list")}${settingsContent}${buildTitanLevelCostCalculatorAccordion(titanOptions, settings)}${doYourBestMarkup}${actionBarMarkup}</div>`;
    }
    function buildTitanSkinFilterRows(settings, skinGroups) {
      if (!Array.isArray(skinGroups) || skinGroups.length <= 0) {
        return `<div class="hwhx-muted">${escapeHtml$1(translate("HWHTITANSKIN_CONFIG_EMPTY"))}</div>`;
      }
      return skinGroups.map((group, index) => {
        const filterInputId = `${SKIN_FILTER_INPUT_PREFIX}${index}`;
        const capInputId = `${SKIN_LEVEL_CAP_INPUT_PREFIX}${index}`;
        const levelCap = settings?.skinLevelCaps?.[group.localeKey] ?? getDefaultTitanSkinLevelCap(group.localeKey);
        return `<div class="hwhx-form-row"${buildTooltipAttribute(translate("HWHTITAN_TOOLTIP_SKIN_FILTER"))}><div class="hwhx-form-label">${buildPopupStyleCheckbox(filterInputId, settings.selectedSkinLocaleKeys.includes(group.localeKey), `${buildInlineIcon("shirt", "hwhx-blue")}<span>${escapeHtml$1(group.name)}</span>`, translate("HWHTITAN_TOOLTIP_SKIN_FILTER"))}</div><label class="hwhx-form-control"${buildTooltipAttribute(translate("HWHTITAN_TOOLTIP_SKIN_LEVEL_CAP"))}><span class="hwhx-form-label">${escapeHtml$1(translate("HWHTITANSKIN_LEVEL_CAP"))}</span>${buildNumberInputMarkup({ id: capInputId, value: levelCap, minValue: 0, maxValue: getDefaultTitanSkinLevelCap(group.localeKey), widthPx: 110, title: translate("HWHTITAN_TOOLTIP_SKIN_LEVEL_CAP") })}</label></div>`;
      }).join("");
    }
    function buildTitanSkinSettingsHtml(settings, titanOptions, skinGroups, skinStoneAmount, actionBarMarkup = "", renderOptions = {}) {
      const levelingSection = buildLevelingModeSelect(SKIN_LEVELING_MODE_SELECT_ID, settings);
      const filterSection = buildTitanSkinFilterRows(settings, skinGroups);
      const resourceSection = buildSettingsField2(
        translate("HWHTITANSKIN_RESERVE"),
        SKIN_RESERVE_INPUT_ID,
        settings.skinStoneReserve,
        formatNumber$1(skinStoneAmount),
        translate("HWHTITAN_TOOLTIP_SKIN_RESERVE")
      );
      const automationSection = [
        buildChecklistAmountControls(
          SKIN_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID,
          SKIN_CHECKLIST_AMOUNT_INPUT_ID,
          settings
        ),
        renderOptions.includeDisplaySettings === false ? "" : `<div class="hwhx-control-group">${buildPopupStyleCheckbox(SHOW_SKIN_COST_INPUT_ID, !!settings.showNextCosts, `${buildInlineIcon("coins")}<span>${escapeHtml$1(translate("HWHTITANSKIN_SHOW_NEXT_COST"))}</span>`, translate("HWHTITAN_TOOLTIP_SHOW_SKIN_COST"))}</div>`,
        `<div class="hwhx-control-group">${buildPopupStyleCheckbox("hwhtitanskin-sync-after-run", !!settings.syncAfterRun, `${buildInlineIcon("refresh-cw")}<span>${escapeHtml$1(translate("HWHTITANART_SYNC_AFTER_RUN"))}</span>`, translate("HWHTITAN_TOOLTIP_SYNC_AFTER_RUN"))}</div>`
      ].join("");
      const settingsContent = `<div class="hwhx-settings-grid">${buildSettingsSection(translate("HWHTITANART_LEVELING_SECTION"), "arrow-up", levelingSection, "#4d5770", "skin:leveling")}${buildSettingsSection(translate("HWHTITANSKIN_FILTER"), "shirt", filterSection, "#5b3f70", "skin:filter")}${buildSettingsSection(translate("HWHTITANART_RESOURCES_SECTION"), "coins", resourceSection, "#6b4f29", "skin:resources")}${buildSettingsSection(translate("HWHTITANART_AUTOMATION_SECTION"), "settings", automationSection, "#3f5a49", "skin:automation")}</div>`;
      const headerMarkup = renderOptions.includeHeader === false ? "" : `<div class="hwhx-title">${escapeHtml$1(translate("HWHTITANSKIN_TITLE"))}</div>${buildSettingsCard(`<div class="hwhx-text">${escapeHtml$1(translate("HWHTITANSKIN_DESCRIPTION"))}</div>`, "#5f4528")}`;
      const doYourBestMarkup = renderOptions.includeDoYourBest === false ? "" : buildDoYourBestPlacementAccordion(TITAN_TRAINER_TAB_SKINS);
      return `<div class="hwhx-popup">${headerMarkup}${buildTitanSelectionAccordion(titanOptions, settings.selectedTitanIds, buildTitanSkinOptionLabel, calculateTitanSkinLevelGain(titanOptions, settings, skinStoneAmount), renderOptions.titanAccordionKey ?? "titan-list")}${settingsContent}${buildTitanSkinCostCalculatorAccordion(titanOptions, skinGroups, settings)}${doYourBestMarkup}${actionBarMarkup}</div>`;
    }
    function getTitanTrainerTitleText() {
      const scriptName = String(GM_info?.script?.name ?? "HWH Titan Trainer");
      const scriptVersion = String(GM_info?.script?.version ?? "");
      const scriptAuthor = String(GM_info?.script?.author ?? "");
      return `${scriptName}${scriptVersion ? ` v${scriptVersion}` : ""}${scriptAuthor ? ` · ${scriptAuthor}` : ""}`;
    }
    function buildTitanTrainerTabsHtml({
      activeTab,
      artifactSettings,
      levelSettings,
      skinSettings,
      artifactTitanOptions,
      levelTitanOptions,
      skinTitanOptions,
      ownedTitans,
      inventory,
      userInfo,
      skinGroups
    }) {
      const commonRenderOptions = {
        includeHeader: false,
        includeDisplaySettings: false
      };
      const tabsMarkup = buildTabsMarkup({
        id: TITAN_TRAINER_TAB_INPUT_ID,
        value: activeTab,
        tabs: [
          {
            value: TITAN_TRAINER_TAB_GENERAL,
            label: translate("HWHTITANTRAINER_TAB_GENERAL"),
            icon: "settings",
            content: buildTitanTrainerGeneralSettingsHtml(
              artifactSettings,
              levelSettings,
              skinSettings
            )
          },
          {
            value: TITAN_TRAINER_TAB_ARTIFACTS,
            label: translate("HWHTITANTRAINER_TAB_ARTIFACTS"),
            icon: "hammer",
            content: buildSettingsHtml(
              artifactSettings,
              artifactTitanOptions,
              ownedTitans,
              getResourceAmount(inventory),
              getGoldAmount(userInfo),
              getTitanArtifactFragmentCoinAmount(inventory),
              inventory,
              "",
              {
                ...commonRenderOptions,
                titanAccordionKey: "titan-list-artifacts"
              }
            )
          },
          {
            value: TITAN_TRAINER_TAB_LEVELS,
            label: translate("HWHTITANTRAINER_TAB_LEVELS"),
            icon: "arrow-up",
            content: buildTitanLevelSettingsHtml(
              levelSettings,
              levelTitanOptions,
              getTitanXpPotionAmount(inventory),
              inventory,
              "",
              {
                ...commonRenderOptions,
                titanAccordionKey: "titan-list-levels"
              }
            )
          },
          {
            value: TITAN_TRAINER_TAB_SKINS,
            label: translate("HWHTITANTRAINER_TAB_SKINS"),
            icon: "shirt",
            content: buildTitanSkinSettingsHtml(
              skinSettings,
              skinTitanOptions,
              skinGroups,
              getTitanSkinStoneAmount(inventory),
              "",
              {
                ...commonRenderOptions,
                titanAccordionKey: "titan-list-skins"
              }
            )
          }
        ]
      });
      return `<div class="hwhx-popup hwhx-popup--titan-trainer">${tabsMarkup}</div>`;
    }
    function readTitanSelectionFromPopup(titanOptions, rootNode = document) {
      const allowedTitanIdSet = new Set(
        (titanOptions ?? []).map((titanOption) => Number(titanOption.id))
      );
      const customTitanInputs = [
        ...rootNode instanceof Document || rootNode instanceof Element ? rootNode.querySelectorAll("[data-hwhtitan-titan-checkbox]") : []
      ].filter((node) => node instanceof HTMLInputElement);
      if (customTitanInputs.length > 0) {
        return {
          selectedTitanIds: customTitanInputs.filter((inputElement) => inputElement.checked && !inputElement.disabled).map(
            (inputElement) => Number(inputElement.dataset.name || inputElement.value)
          ).filter(
            (titanId) => Number.isFinite(titanId) && allowedTitanIdSet.has(titanId)
          )
        };
      }
      return { selectedTitanIds: [] };
    }
    function readIntegerInputValue(inputId, fallbackValue, rootNode = document) {
      const rawValue = getScopedTitanElementById(inputId, rootNode)?.value;
      const parsedValue = parseNumberInputText$1(rawValue, fallbackValue);
      if (!Number.isFinite(parsedValue)) {
        return Math.max(0, Number(fallbackValue) || 0);
      }
      return Math.max(0, Math.floor(parsedValue));
    }
    function readCheckboxInputValue(inputId, fallbackValue = false, rootNode = document) {
      return readCheckboxInput(inputId, fallbackValue, rootNode);
    }
    function readSelectInputValue(inputId, fallbackValue, rootNode = document) {
      return readSelectInput(inputId, fallbackValue, void 0, rootNode);
    }
    function readMultiSelectInputValues(inputId, fallbackValues = [], rootNode = document) {
      const inputElement = getScopedTitanElementById(inputId, rootNode);
      if (!(inputElement instanceof HTMLInputElement)) {
        return Array.isArray(fallbackValues) ? fallbackValues : [];
      }
      return readMultiSelectValues(inputElement);
    }
    function buildLevelingAmountPromptHtml(settings, actionBarMarkup = "") {
      const fieldMarkup = buildSettingsField2(
        translate("HWHTITANART_LEVELING_AMOUNT"),
        LEVELING_AMOUNT_PROMPT_INPUT_ID,
        settings?.lastLevelingAmount ?? getChecklistLevelingAmount(settings)
      );
      return `<div class="hwhx-popup hwhx-popup--compact"><div class="hwhx-popup-heading">${buildInlineIcon("arrow-up")}<span>${escapeHtml$1(translate("HWHTITANART_LEVELING_AMOUNT_PROMPT_TITLE"))}</span></div>${buildSettingsCard(`<div class="hwhx-text">${escapeHtml$1(translate("HWHTITANART_LEVELING_AMOUNT_PROMPT_DESCRIPTION"))}</div>`, "#5f4528")}${buildSettingsCard(`<div class="hwhx-stack">${fieldMarkup}<div class="hwhx-hint">${escapeHtml$1(translate("HWHTITANART_CHECKLIST_AMOUNT_HINT"))}</div></div>`, "#3f5a49")}${actionBarMarkup}</div>`;
    }
    async function promptLevelingAmount(settings) {
      const modalActions = [
        {
          result: "confirm",
          label: translate("HWHTITANART_LEVELING_AMOUNT_CONFIRM"),
          icon: "check",
          tone: "blue"
        }
      ];
      const { answerPromise } = openTitanNativePopup({
        popupKind: "amount",
        bodyHtml: buildLevelingAmountPromptHtml(settings),
        actions: modalActions
      });
      const answer = await answerPromise;
      if (answer !== "confirm") {
        return void 0;
      }
      return readIntegerInputValue(LEVELING_AMOUNT_PROMPT_INPUT_ID, 0);
    }
    async function resolveLevelingRunOptions(settings, runOptions = {}) {
      if (normalizeLevelingMode(settings?.levelingMode) !== LEVELING_MODE_AMOUNT) {
        return { confirmed: true, options: { source: runOptions?.source } };
      }
      let maxUpgradeCount;
      if (runOptions?.source === "checklist") {
        if (normalizeChecklistAmountBehavior(settings?.checklistAmountBehavior) !== CHECKLIST_AMOUNT_BEHAVIOR_DEFAULT) {
          showProgressMessage(translate("HWHTITANART_CHECKLIST_AMOUNT_SKIPPED"));
          return { confirmed: false, options: {} };
        }
        maxUpgradeCount = getChecklistLevelingAmount(settings);
      } else {
        maxUpgradeCount = await promptLevelingAmount(settings);
      }
      return {
        confirmed: maxUpgradeCount !== void 0,
        options: { maxUpgradeCount, source: runOptions?.source }
      };
    }
    function readPopupSettings(titanOptions, fallbackSettings, rootNode = document) {
      const titanSelection = readTitanSelectionFromPopup(titanOptions, rootNode);
      readDoYourBestPlacementFromPopup(rootNode, TITAN_TRAINER_TAB_ARTIFACTS);
      const selectedArtifactSlotIds = ARTIFACT_SLOT_IDS.filter(
        (slotId) => readCheckboxInputValue(
          `${SLOT_FILTER_INPUT_PREFIX}${slotId}`,
          fallbackSettings?.selectedArtifactSlotIds?.includes(slotId),
          rootNode
        )
      );
      const artifactLevelCaps = ARTIFACT_SLOT_IDS.map(
        (slotId) => readIntegerInputValue(
          `${ARTIFACT_LEVEL_CAP_INPUT_PREFIX}${slotId}`,
          fallbackSettings?.artifactLevelCaps?.[slotId] ?? getDefaultArtifactLevelCap(slotId),
          rootNode
        )
      );
      return normalizeSettings({
        ...fallbackSettings,
        ...titanSelection,
        selectedArtifactSlotIds: selectedArtifactSlotIds.length > 0 ? selectedArtifactSlotIds : fallbackSettings?.selectedArtifactSlotIds ?? [0, 1],
        levelingMode: readSelectInputValue(
          ARTIFACT_LEVELING_MODE_SELECT_ID,
          fallbackSettings?.levelingMode ?? LEVELING_MODE_MAX,
          rootNode
        ),
        checklistAmountBehavior: readSelectInputValue(
          ARTIFACT_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID,
          fallbackSettings?.checklistAmountBehavior ?? CHECKLIST_AMOUNT_BEHAVIOR_SKIP,
          rootNode
        ),
        checklistLevelingAmount: readIntegerInputValue(
          ARTIFACT_CHECKLIST_AMOUNT_INPUT_ID,
          fallbackSettings?.checklistLevelingAmount ?? 1,
          rootNode
        ),
        checklistFragmentPurchaseBehavior: readSelectInputValue(
          ARTIFACT_CHECKLIST_FRAGMENT_BEHAVIOR_SELECT_ID,
          fallbackSettings?.checklistFragmentPurchaseBehavior ?? CHECKLIST_FRAGMENT_BEHAVIOR_USE_SETTINGS,
          rootNode
        ),
        essenceReserve: readIntegerInputValue(
          ESSENCE_RESERVE_INPUT_ID,
          fallbackSettings?.essenceReserve ?? 0,
          rootNode
        ),
        artifactGoldReserve: readIntegerInputValue(
          ARTIFACT_GOLD_RESERVE_INPUT_ID,
          fallbackSettings?.artifactGoldReserve ?? 0,
          rootNode
        ),
        artifactFragmentCoinReserve: readIntegerInputValue(
          ARTIFACT_FRAGMENT_COIN_RESERVE_INPUT_ID,
          fallbackSettings?.artifactFragmentCoinReserve ?? 0,
          rootNode
        ),
        evolveArtifacts: readCheckboxInputValue(
          ARTIFACT_EVOLVE_INPUT_ID,
          fallbackSettings?.evolveArtifacts ?? false,
          rootNode
        ),
        buyArtifactFragments: readCheckboxInputValue(
          ARTIFACT_BUY_FRAGMENTS_INPUT_ID,
          fallbackSettings?.buyArtifactFragments ?? false,
          rootNode
        ),
        selectedArtifactEvolutionKeys: readMultiSelectInputValues(
          ARTIFACT_EVOLVE_TARGETS_INPUT_ID,
          fallbackSettings?.selectedArtifactEvolutionKeys ?? [],
          rootNode
        ),
        selectedArtifactFragmentBuyKeys: readMultiSelectInputValues(
          ARTIFACT_FRAGMENT_BUY_TARGETS_INPUT_ID,
          fallbackSettings?.selectedArtifactFragmentBuyKeys ?? [],
          rootNode
        ),
        artifactEvolutionMaxStar: readIntegerInputValue(
          ARTIFACT_EVOLUTION_MAX_STAR_INPUT_ID,
          fallbackSettings?.artifactEvolutionMaxStar ?? 0,
          rootNode
        ),
        showFullCosts: readCheckboxInputValue(
          SHOW_FULL_COST_INPUT_ID,
          fallbackSettings?.showFullCosts ?? false,
          rootNode
        ),
        syncAfterRun: readCheckboxInputValue(
          "hwhtitanartifact-sync-after-run",
          fallbackSettings?.syncAfterRun ?? false,
          rootNode
        ),
        uiTooltipsEnabled: readCheckboxInputValue(
          UI_TOOLTIPS_INPUT_ID,
          fallbackSettings?.uiTooltipsEnabled !== false,
          rootNode
        ),
        ...readProgressSettingsFromPopup({
          rootNode,
          fallbackSettings,
          inputIds: {
            autoHide: PROGRESS_AUTO_HIDE_RESULT_INPUT_ID,
            timeout: PROGRESS_AUTO_HIDE_TIMEOUT_INPUT_ID,
            position: PROGRESS_POSITION_INPUT_ID,
            style: PROGRESS_STYLE_INPUT_ID,
            theme: PROGRESS_THEME_INPUT_ID
          },
          readCheckbox: readCheckboxInputValue,
          readNumber: readIntegerInputValue,
          readSelect: (inputId, fallbackValue, allowedValues, root) => {
            const value = readSelectInputValue(inputId, fallbackValue, root);
            return allowedValues.includes(value) ? value : fallbackValue;
          }
        }),
        artifactLevelCaps
      });
    }
    function readLevelPopupSettings(titanOptions, fallbackSettings, rootNode = document) {
      const titanSelection = readTitanSelectionFromPopup(titanOptions, rootNode);
      readDoYourBestPlacementFromPopup(rootNode, TITAN_TRAINER_TAB_LEVELS);
      return normalizeLevelSettings({
        ...fallbackSettings,
        ...titanSelection,
        levelingMode: readSelectInputValue(
          TITAN_LEVELING_MODE_SELECT_ID,
          fallbackSettings?.levelingMode ?? LEVELING_MODE_MAX,
          rootNode
        ),
        checklistAmountBehavior: readSelectInputValue(
          TITAN_LEVEL_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID,
          fallbackSettings?.checklistAmountBehavior ?? CHECKLIST_AMOUNT_BEHAVIOR_SKIP,
          rootNode
        ),
        checklistLevelingAmount: readIntegerInputValue(
          TITAN_LEVEL_CHECKLIST_AMOUNT_INPUT_ID,
          fallbackSettings?.checklistLevelingAmount ?? 1,
          rootNode
        ),
        potionReserve: readIntegerInputValue(
          POTION_RESERVE_INPUT_ID,
          fallbackSettings?.potionReserve ?? 0,
          rootNode
        ),
        showNextCosts: readCheckboxInputValue(
          SHOW_LEVEL_COST_INPUT_ID,
          fallbackSettings?.showNextCosts ?? false,
          rootNode
        ),
        showEvolutionProgress: readCheckboxInputValue(
          SHOW_LEVEL_EVOLUTION_INPUT_ID,
          fallbackSettings?.showEvolutionProgress ?? true,
          rootNode
        ),
        syncAfterRun: readCheckboxInputValue(
          "hwhtitanlevel-sync-after-run",
          fallbackSettings?.syncAfterRun ?? false,
          rootNode
        ),
        selectedTitanEvolutionIds: readMultiSelectInputValues(
          TITAN_EVOLVE_TARGETS_INPUT_ID,
          fallbackSettings?.selectedTitanEvolutionIds ?? [],
          rootNode
        ),
        titanEvolutionMaxStar: readIntegerInputValue(
          TITAN_EVOLUTION_MAX_STAR_INPUT_ID,
          fallbackSettings?.titanEvolutionMaxStar ?? getMaxTitanEvolutionStar(),
          rootNode
        )
      });
    }
    function readSkinPopupSettings(titanOptions, skinGroups, fallbackSettings, rootNode = document) {
      const titanSelection = readTitanSelectionFromPopup(titanOptions, rootNode);
      readDoYourBestPlacementFromPopup(rootNode, TITAN_TRAINER_TAB_SKINS);
      const selectedSkinLocaleKeys = skinGroups.filter(
        (group, index) => readCheckboxInputValue(
          `${SKIN_FILTER_INPUT_PREFIX}${index}`,
          fallbackSettings?.selectedSkinLocaleKeys?.includes(group.localeKey),
          rootNode
        )
      ).map((group) => group.localeKey);
      const skinLevelCaps = Object.fromEntries(
        skinGroups.map((group, index) => [
          group.localeKey,
          readIntegerInputValue(
            `${SKIN_LEVEL_CAP_INPUT_PREFIX}${index}`,
            fallbackSettings?.skinLevelCaps?.[group.localeKey] ?? getDefaultTitanSkinLevelCap(group.localeKey),
            rootNode
          )
        ])
      );
      return normalizeSkinSettings({
        ...fallbackSettings,
        ...titanSelection,
        selectedSkinLocaleKeys: selectedSkinLocaleKeys.length > 0 ? selectedSkinLocaleKeys : fallbackSettings?.selectedSkinLocaleKeys ?? skinGroups.map((group) => group.localeKey),
        levelingMode: readSelectInputValue(
          SKIN_LEVELING_MODE_SELECT_ID,
          fallbackSettings?.levelingMode ?? LEVELING_MODE_MAX,
          rootNode
        ),
        checklistAmountBehavior: readSelectInputValue(
          SKIN_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID,
          fallbackSettings?.checklistAmountBehavior ?? CHECKLIST_AMOUNT_BEHAVIOR_SKIP,
          rootNode
        ),
        checklistLevelingAmount: readIntegerInputValue(
          SKIN_CHECKLIST_AMOUNT_INPUT_ID,
          fallbackSettings?.checklistLevelingAmount ?? 1,
          rootNode
        ),
        skinStoneReserve: readIntegerInputValue(
          SKIN_RESERVE_INPUT_ID,
          fallbackSettings?.skinStoneReserve ?? 0,
          rootNode
        ),
        showNextCosts: readCheckboxInputValue(
          SHOW_SKIN_COST_INPUT_ID,
          fallbackSettings?.showNextCosts ?? false,
          rootNode
        ),
        syncAfterRun: readCheckboxInputValue(
          "hwhtitanskin-sync-after-run",
          fallbackSettings?.syncAfterRun ?? false,
          rootNode
        ),
        skinLevelCaps
      });
    }
    function readTrainerActiveTab(rootNode, fallbackTab = TITAN_TRAINER_TAB_ARTIFACTS) {
      const value = readSelectInputValue(TITAN_TRAINER_TAB_INPUT_ID, fallbackTab, rootNode);
      return [
        TITAN_TRAINER_TAB_GENERAL,
        TITAN_TRAINER_TAB_ARTIFACTS,
        TITAN_TRAINER_TAB_LEVELS,
        TITAN_TRAINER_TAB_SKINS
      ].includes(value) ? value : fallbackTab;
    }
    function getTrainerTabPanel(rootNode, tabValue) {
      if (!(rootNode instanceof Document || rootNode instanceof Element)) {
        return document;
      }
      const panelNode = rootNode.querySelector(
        `[data-hwhx-tab-panel="${String(tabValue).replaceAll('"', '\\"')}"]`
      );
      return panelNode instanceof HTMLElement ? panelNode : rootNode;
    }
    function readTrainerPopupSettings({
      rootNode,
      artifactTitanOptions,
      levelTitanOptions,
      skinTitanOptions,
      skinGroups,
      artifactSettings,
      levelSettings,
      skinSettings
    }) {
      readDoYourBestPlacementFromPopup(rootNode);
      const artifactPanel = getTrainerTabPanel(rootNode, TITAN_TRAINER_TAB_ARTIFACTS);
      const levelPanel = getTrainerTabPanel(rootNode, TITAN_TRAINER_TAB_LEVELS);
      const skinPanel = getTrainerTabPanel(rootNode, TITAN_TRAINER_TAB_SKINS);
      const nextArtifactSettings = readPopupSettings(
        artifactTitanOptions,
        artifactSettings,
        artifactPanel
      );
      const nextSettings = {
        artifactSettings: normalizeSettings({
          ...nextArtifactSettings,
          uiTooltipsEnabled: readCheckboxInputValue(
            UI_TOOLTIPS_INPUT_ID,
            nextArtifactSettings.uiTooltipsEnabled,
            rootNode
          ),
          showFullCosts: readCheckboxInputValue(
            SHOW_FULL_COST_INPUT_ID,
            nextArtifactSettings.showFullCosts,
            rootNode
          ),
          ...readProgressSettingsFromPopup({
            rootNode,
            fallbackSettings: nextArtifactSettings,
            inputIds: {
              autoHide: PROGRESS_AUTO_HIDE_RESULT_INPUT_ID,
              timeout: PROGRESS_AUTO_HIDE_TIMEOUT_INPUT_ID,
              position: PROGRESS_POSITION_INPUT_ID,
              style: PROGRESS_STYLE_INPUT_ID,
              theme: PROGRESS_THEME_INPUT_ID
            },
            readCheckbox: readCheckboxInputValue,
            readNumber: readIntegerInputValue,
            readSelect: (inputId, fallbackValue, allowedValues, root) => {
              const value = readSelectInputValue(inputId, fallbackValue, root);
              return allowedValues.includes(value) ? value : fallbackValue;
            }
          }),
          titanTrainerButtonPlacement: readSelectInputValue(
            TITAN_TRAINER_BUTTON_PLACEMENT_INPUT_ID,
            nextArtifactSettings.titanTrainerButtonPlacement,
            rootNode
          )
        }),
        levelSettings: normalizeLevelSettings({
          ...readLevelPopupSettings(levelTitanOptions, levelSettings, levelPanel),
          showNextCosts: readCheckboxInputValue(
            SHOW_LEVEL_COST_INPUT_ID,
            levelSettings.showNextCosts,
            rootNode
          ),
          showEvolutionProgress: readCheckboxInputValue(
            SHOW_LEVEL_EVOLUTION_INPUT_ID,
            levelSettings.showEvolutionProgress,
            rootNode
          )
        }),
        skinSettings: normalizeSkinSettings({
          ...readSkinPopupSettings(skinTitanOptions, skinGroups, skinSettings, skinPanel),
          showNextCosts: readCheckboxInputValue(
            SHOW_SKIN_COST_INPUT_ID,
            skinSettings.showNextCosts,
            rootNode
          )
        })
      };
      applyTitanTrainerUiPreferences(nextSettings.artifactSettings);
      return nextSettings;
    }
    function syncTitanSelectionRowStates(rootNode) {
      if (!(rootNode instanceof Document || rootNode instanceof Element)) {
        return;
      }
      [...rootNode.querySelectorAll("[data-hwhtitan-titan-checkbox]")].forEach(
        (inputNode) => {
          if (!(inputNode instanceof HTMLInputElement)) {
            return;
          }
          inputNode.closest("[data-hwhtitan-titan-row]")?.classList.toggle("is-checked", inputNode.checked);
        }
      );
    }
    function updateTitanSelectionBadges(panelNode, levelGainAmount) {
      if (!(panelNode instanceof Document || panelNode instanceof Element)) {
        return;
      }
      const inputs = [
        ...panelNode.querySelectorAll("[data-hwhtitan-titan-checkbox]")
      ].filter((inputNode) => inputNode instanceof HTMLInputElement);
      const ownedInputs = inputs.filter((inputNode) => !inputNode.disabled);
      const selectedCount = ownedInputs.filter((inputNode) => inputNode.checked).length;
      const accordionNode = ownedInputs[0]?.closest(".hwhx-accordion");
      const summaryNode = accordionNode?.querySelector(".hwhx-accordion__summary");
      const levelGainBadge = summaryNode?.querySelector(
        "[data-hwhtitan-level-gain-badge]"
      );
      const activeBadge = summaryNode?.querySelector(
        '[data-hwhx-accordion-filter-option="active"]'
      );
      const inactiveBadge = summaryNode?.querySelector(
        '[data-hwhx-accordion-filter-option="inactive"]'
      );
      if (levelGainBadge instanceof HTMLElement) {
        levelGainBadge.textContent = translate("HWHTITANART_LEVEL_GAIN", {
          amount: formatNumber$1(levelGainAmount)
        });
      }
      if (activeBadge instanceof HTMLElement) {
        activeBadge.textContent = formatNumber$1(selectedCount);
      }
      if (inactiveBadge instanceof HTMLElement) {
        inactiveBadge.textContent = formatNumber$1(
          Math.max(0, ownedInputs.length - selectedCount)
        );
      }
    }
    function calculateActiveTrainerSelectionGain({
      rootNode,
      activeTab,
      artifactTitanOptions,
      levelTitanOptions,
      skinTitanOptions,
      skinGroups,
      artifactSettings,
      levelSettings,
      skinSettings,
      ownedTitans,
      resourceAmount,
      goldAmount,
      potionAmount,
      skinStoneAmount
    }) {
      if (activeTab === TITAN_TRAINER_TAB_GENERAL) {
        return 0;
      }
      if (activeTab === TITAN_TRAINER_TAB_LEVELS) {
        const levelPanel = getTrainerTabPanel(rootNode, TITAN_TRAINER_TAB_LEVELS);
        const nextLevelSettings = readLevelPopupSettings(
          levelTitanOptions,
          levelSettings,
          levelPanel
        );
        return calculateTitanLevelGain(
          levelTitanOptions,
          nextLevelSettings,
          potionAmount
        );
      }
      if (activeTab === TITAN_TRAINER_TAB_SKINS) {
        const skinPanel = getTrainerTabPanel(rootNode, TITAN_TRAINER_TAB_SKINS);
        const nextSkinSettings = readSkinPopupSettings(
          skinTitanOptions,
          skinGroups,
          skinSettings,
          skinPanel
        );
        return calculateTitanSkinLevelGain(
          skinTitanOptions,
          nextSkinSettings,
          skinStoneAmount
        );
      }
      const artifactPanel = getTrainerTabPanel(rootNode, TITAN_TRAINER_TAB_ARTIFACTS);
      const nextArtifactSettings = readPopupSettings(
        artifactTitanOptions,
        artifactSettings,
        artifactPanel
      );
      return calculateArtifactLevelGain(
        nextArtifactSettings,
        ownedTitans,
        resourceAmount,
        goldAmount
      );
    }
    function updateActiveTrainerSelectionPreview(rootNode, context) {
      if (!(rootNode instanceof HTMLElement)) {
        return;
      }
      const activeTab = readTrainerActiveTab(rootNode, context.activeTab);
      const panelNode = getTrainerTabPanel(rootNode, activeTab);
      syncTitanSelectionRowStates(panelNode);
      updateTitanSelectionBadges(
        panelNode,
        calculateActiveTrainerSelectionGain({
          ...context,
          rootNode,
          activeTab
        })
      );
    }
    function setActiveTrainerTitanSelection(rootNode, activeTab, checked) {
      const panelNode = getTrainerTabPanel(rootNode, activeTab);
      const inputs = [
        ...panelNode.querySelectorAll("[data-hwhtitan-titan-checkbox]")
      ].filter(
        (inputNode) => inputNode instanceof HTMLInputElement && !inputNode.disabled
      );
      inputs.forEach((inputNode) => {
        inputNode.checked = !!checked;
        inputNode.closest("[data-hwhtitan-titan-row]")?.classList.toggle("is-checked", inputNode.checked);
      });
      inputs[0]?.dispatchEvent(new globalThis.Event("change", { bubbles: true }));
    }
    function isTrainerSelectionPreviewTarget(target) {
      if (!(target instanceof HTMLInputElement)) {
        return false;
      }
      if (target.matches("[data-hwhtitan-titan-checkbox]") || target.id === TITAN_TRAINER_TAB_INPUT_ID) {
        return true;
      }
      const targetId = String(target.id ?? "");
      return [
        ARTIFACT_LEVELING_MODE_SELECT_ID,
        ARTIFACT_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID,
        ARTIFACT_CHECKLIST_AMOUNT_INPUT_ID,
        ARTIFACT_CHECKLIST_FRAGMENT_BEHAVIOR_SELECT_ID,
        ESSENCE_RESERVE_INPUT_ID,
        ARTIFACT_GOLD_RESERVE_INPUT_ID,
        TITAN_LEVELING_MODE_SELECT_ID,
        TITAN_LEVEL_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID,
        TITAN_LEVEL_CHECKLIST_AMOUNT_INPUT_ID,
        TITAN_LEVEL_CAP_INPUT_ID,
        POTION_RESERVE_INPUT_ID,
        SKIN_LEVELING_MODE_SELECT_ID,
        SKIN_CHECKLIST_AMOUNT_BEHAVIOR_SELECT_ID,
        SKIN_CHECKLIST_AMOUNT_INPUT_ID,
        SKIN_RESERVE_INPUT_ID
      ].includes(targetId) || targetId.startsWith(SLOT_FILTER_INPUT_PREFIX) || targetId.startsWith(ARTIFACT_LEVEL_CAP_INPUT_PREFIX) || targetId.startsWith(SKIN_FILTER_INPUT_PREFIX) || targetId.startsWith(SKIN_LEVEL_CAP_INPUT_PREFIX);
    }
    function bindTitanTrainerLiveSelection(rootNode, actionRootNode, context) {
      if (!(rootNode instanceof HTMLElement) || rootNode.dataset.hwhtitanLiveSelectionBound === "1") {
        return;
      }
      rootNode.dataset.hwhtitanLiveSelectionBound = "1";
      const updatePreview = () => updateActiveTrainerSelectionPreview(rootNode, {
        ...context,
        activeTab: readTrainerActiveTab(rootNode, context.activeTab)
      });
      rootNode.addEventListener("change", (event) => {
        if (isTrainerSelectionPreviewTarget(event.target)) {
          updatePreview();
        }
      });
      rootNode.addEventListener("input", (event) => {
        if (isTrainerSelectionPreviewTarget(event.target)) {
          updatePreview();
        }
      });
      actionRootNode?.addEventListener?.("hwhx:modal-action", (event) => {
        const action = String(event.detail?.action ?? "");
        if (action !== "selectAll" && action !== "clearAll") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        setActiveTrainerTitanSelection(
          rootNode,
          readTrainerActiveTab(rootNode, context.activeTab),
          action === "selectAll"
        );
      });
      updatePreview();
    }
    function readCalculatorSelectValue(rootNode, inputId, fallbackValue = "") {
      const inputNode = getScopedTitanElementById(inputId, rootNode);
      return String(inputNode?.value ?? fallbackValue);
    }
    function setCalculatorInputValue(rootNode, inputId, value) {
      const inputNode = getScopedTitanElementById(inputId, rootNode);
      if (inputNode instanceof HTMLInputElement) {
        inputNode.value = String(value);
      }
    }
    function setCalculatorInputMaxValue(rootNode, inputId, maxValue = void 0) {
      const inputNode = getScopedTitanElementById(inputId, rootNode);
      if (!(inputNode instanceof HTMLInputElement)) {
        return;
      }
      const normalizedMaxValue = Math.max(0, Math.floor(Number(maxValue) || 0));
      if (normalizedMaxValue > 0) {
        inputNode.max = String(normalizedMaxValue);
        return;
      }
      inputNode.removeAttribute("max");
    }
    function buildCalculatorCostMarkup(costParts) {
      const visibleParts = (costParts ?? []).filter((part) => Number(part.amount) > 0);
      if (visibleParts.length <= 0) {
        return `<span class="hwhx-muted">—</span>`;
      }
      return visibleParts.map(
        (part) => `<span class="hwhx-calc-resource"${buildTooltipAttribute(part.name)}>${buildInlineIcon(part.icon, part.className ?? "hwhx-title-accent")}<strong>${escapeHtml$1(formatNumber$1(part.amount))}</strong></span>`
      ).join("");
    }
    function buildCalculatorAvailabilityMarkup(totals, availableParts = []) {
      const availabilityByName = new Map(
        (availableParts ?? []).map((part) => [String(part.name), part])
      );
      const rows = (totals ?? []).filter((part) => Number(part.amount) > 0).map((part) => {
        const availablePart = availabilityByName.get(String(part.name));
        if (!availablePart) {
          return "";
        }
        const availableAmount = Math.max(0, Number(availablePart.amount) || 0);
        const requiredAmount = Math.max(0, Number(part.amount) || 0);
        const delta = availableAmount - requiredAmount;
        const enough = delta >= 0;
        const label = translate(
          enough ? "HWHTITANART_CALC_ENOUGH" : "HWHTITANART_CALC_MISSING",
          { amount: formatNumber$1(Math.abs(delta)) }
        );
        return `<span class="hwhx-calc-availability__row" data-state="${enough ? "ok" : "bad"}">${buildInlineIcon(enough ? "check" : "alert-triangle", enough ? "hwhx-green" : "hwhx-danger")}<span>${escapeHtml$1(part.name)}:</span><strong>${escapeHtml$1(label)}</strong></span>`;
      }).filter(Boolean).join("");
      return rows ? `<div class="hwhx-calc-availability">${rows}</div>` : "";
    }
    function buildCalculatorResultHtml(rows, totals, availableParts = []) {
      if (!Array.isArray(rows) || rows.length <= 0) {
        return `<div class="hwhx-muted">${escapeHtml$1(translate("HWHTITANART_CALC_EMPTY"))}</div>`;
      }
      const levelCells = rows.map(
        (row) => `<div class="hwhx-calc-level-cell"${buildTooltipAttribute(`${row.fromLevel} → ${row.toLevel}`)}><div class="hwhx-calc-level-cell__range">${escapeHtml$1(translate("HWHTITANART_CALC_LEVEL_SHORT", { level: row.toLevel }))}</div><div class="hwhx-calc-level-cell__cost">${buildCalculatorCostMarkup(row.costParts)}</div></div>`
      ).join("");
      return `<div class="hwhx-calc-total"><span>${buildIconLabel("coins", translate("HWHTITANART_CALC_TOTAL"), "hwhx-gold")}</span><span class="hwhx-calc-total__value">${buildCalculatorCostMarkup(totals)}</span></div>${buildCalculatorAvailabilityMarkup(totals, availableParts)}<div class="hwhx-calc-level-grid">${levelCells}</div>`;
    }
    function normalizeCalculatorLevelRange(startLevel, endLevel, maxLevel = 0) {
      const normalizedMaxLevel = Math.max(0, Math.floor(Number(maxLevel) || 0));
      const rawStartLevel = Math.max(1, Math.floor(Number(startLevel) || 1));
      const normalizedStartLevel = normalizedMaxLevel > 0 ? Math.min(rawStartLevel, normalizedMaxLevel) : rawStartLevel;
      const rawEndLevel = Math.max(
        normalizedStartLevel,
        Math.floor(Number(endLevel) || normalizedStartLevel)
      );
      const normalizedEndLevel = normalizedMaxLevel > 0 ? Math.min(rawEndLevel, normalizedMaxLevel) : rawEndLevel;
      return {
        startLevel: normalizedStartLevel,
        endLevel: Math.max(normalizedStartLevel, normalizedEndLevel)
      };
    }
    function buildArtifactCalculatorPlan(titanId, slotId, startLevel, endLevel) {
      const rows = [];
      const totals = [
        {
          icon: "flask",
          name: getArtifactResourceName(),
          amount: 0
        },
        {
          icon: "coins",
          className: "hwhx-gold",
          name: getGoldResourceName(),
          amount: 0
        }
      ];
      const { startLevel: normalizedStartLevel, endLevel: normalizedEndLevel } = normalizeCalculatorLevelRange(
        startLevel,
        endLevel,
        getTitanArtifactMaxLevel(titanId, slotId)
      );
      for (let currentLevel = normalizedStartLevel; currentLevel < normalizedEndLevel; currentLevel += 1) {
        const nextUpgrade = getTitanArtifactNextUpgrade(titanId, slotId, currentLevel);
        if (!nextUpgrade) {
          break;
        }
        totals[0].amount += nextUpgrade.resourceCost;
        totals[1].amount += nextUpgrade.goldCost;
        rows.push({
          fromLevel: currentLevel,
          toLevel: nextUpgrade.nextLevel,
          costParts: [
            { ...totals[0], amount: nextUpgrade.resourceCost },
            { ...totals[1], amount: nextUpgrade.goldCost }
          ]
        });
      }
      return { rows, totals };
    }
    function buildTitanLevelCalculatorPlan(startLevel, endLevel) {
      const rows = [];
      const totals = [
        {
          icon: "flask",
          name: getTitanXpResourceName(),
          amount: 0
        }
      ];
      const { startLevel: normalizedStartLevel, endLevel: normalizedEndLevel } = normalizeCalculatorLevelRange(startLevel, endLevel, getMaxTitanLevel());
      for (let currentLevel = normalizedStartLevel; currentLevel < normalizedEndLevel; currentLevel += 1) {
        const cost = getTitanLevelUpCost(currentLevel);
        if (!cost) {
          break;
        }
        totals[0].amount += cost;
        rows.push({
          fromLevel: currentLevel,
          toLevel: currentLevel + 1,
          costParts: [{ ...totals[0], amount: cost }]
        });
      }
      return { rows, totals };
    }
    function buildTitanSkinCalculatorPlan(skinId, startLevel, endLevel, maxLevel = 0) {
      const rows = [];
      const totals = [
        {
          icon: "coins",
          name: getTitanSkinResourceName(),
          amount: 0
        }
      ];
      const { startLevel: normalizedStartLevel, endLevel: normalizedEndLevel } = normalizeCalculatorLevelRange(startLevel, endLevel, maxLevel);
      for (let currentLevel = normalizedStartLevel; currentLevel < normalizedEndLevel; currentLevel += 1) {
        const nextUpgrade = getTitanSkinNextUpgrade(skinId, currentLevel);
        if (!nextUpgrade) {
          break;
        }
        totals[0].amount += nextUpgrade.cost;
        rows.push({
          fromLevel: currentLevel,
          toLevel: nextUpgrade.nextLevel,
          costParts: [{ ...totals[0], amount: nextUpgrade.cost }]
        });
      }
      return { rows, totals };
    }
    function renderArtifactCalculator(rootNode, titanOptions, resourceAmount, goldAmount) {
      const resultNode = getScopedTitanElementById(ARTIFACT_CALC_RESULT_ID, rootNode);
      if (!(resultNode instanceof HTMLElement)) {
        return;
      }
      const titanId = Number(
        readCalculatorSelectValue(rootNode, ARTIFACT_CALC_TITAN_SELECT_ID, "0")
      );
      const slotId = Number(
        readCalculatorSelectValue(rootNode, ARTIFACT_CALC_SLOT_SELECT_ID, "0")
      );
      const startLevel = readIntegerInputValue(
        ARTIFACT_CALC_START_INPUT_ID,
        getArtifactCalculatorDefaultLevels(titanOptions, titanId, slotId).startLevel,
        rootNode
      );
      const endLevel = readIntegerInputValue(
        ARTIFACT_CALC_END_INPUT_ID,
        getArtifactCalculatorDefaultLevels(titanOptions, titanId, slotId).endLevel,
        rootNode
      );
      const plan = buildArtifactCalculatorPlan(titanId, slotId, startLevel, endLevel);
      resultNode.innerHTML = buildCalculatorResultHtml(plan.rows, plan.totals, [
        {
          name: getArtifactResourceName(),
          amount: Math.max(0, Number(resourceAmount) || 0) - readIntegerInputValue(ESSENCE_RESERVE_INPUT_ID, 0, rootNode)
        },
        {
          name: getGoldResourceName(),
          amount: Math.max(0, Number(goldAmount) || 0) - readIntegerInputValue(ARTIFACT_GOLD_RESERVE_INPUT_ID, 0, rootNode)
        }
      ]);
    }
    function renderLevelCalculator(rootNode, titanOptions, potionAmount) {
      const resultNode = getScopedTitanElementById(LEVEL_CALC_RESULT_ID, rootNode);
      if (!(resultNode instanceof HTMLElement)) {
        return;
      }
      const titanId = Number(
        readCalculatorSelectValue(rootNode, LEVEL_CALC_TITAN_SELECT_ID, "0")
      );
      const defaultLevels = getLevelCalculatorDefaultLevels(titanOptions, titanId);
      const startLevel = readIntegerInputValue(
        LEVEL_CALC_START_INPUT_ID,
        defaultLevels.startLevel,
        rootNode
      );
      const endLevel = readIntegerInputValue(
        LEVEL_CALC_END_INPUT_ID,
        defaultLevels.endLevel,
        rootNode
      );
      const plan = buildTitanLevelCalculatorPlan(startLevel, endLevel);
      resultNode.innerHTML = buildCalculatorResultHtml(plan.rows, plan.totals, [
        {
          name: getTitanXpResourceName(),
          amount: Math.max(0, Number(potionAmount) || 0) - readIntegerInputValue(POTION_RESERVE_INPUT_ID, 0, rootNode)
        }
      ]);
    }
    function renderSkinCalculator(rootNode, titanOptions, skinGroups, skinStoneAmount) {
      const resultNode = getScopedTitanElementById(SKIN_CALC_RESULT_ID, rootNode);
      if (!(resultNode instanceof HTMLElement)) {
        return;
      }
      const titanId = Number(
        readCalculatorSelectValue(rootNode, SKIN_CALC_TITAN_SELECT_ID, "0")
      );
      const localeKey = readCalculatorSelectValue(rootNode, SKIN_CALC_GROUP_SELECT_ID, "");
      const skinEntry = findSkinCalculatorEntry(
        titanOptions,
        skinGroups,
        titanId,
        localeKey
      );
      const defaultLevels = getSkinCalculatorDefaultLevels(
        titanOptions,
        skinGroups,
        titanId,
        localeKey
      );
      const startLevel = readIntegerInputValue(
        SKIN_CALC_START_INPUT_ID,
        defaultLevels.startLevel,
        rootNode
      );
      const endLevel = readIntegerInputValue(
        SKIN_CALC_END_INPUT_ID,
        defaultLevels.endLevel,
        rootNode
      );
      const plan = buildTitanSkinCalculatorPlan(
        skinEntry?.skinId,
        startLevel,
        endLevel,
        skinEntry?.maxLevel
      );
      resultNode.innerHTML = buildCalculatorResultHtml(plan.rows, plan.totals, [
        {
          name: getTitanSkinResourceName(),
          amount: Math.max(0, Number(skinStoneAmount) || 0) - readIntegerInputValue(SKIN_RESERVE_INPUT_ID, 0, rootNode)
        }
      ]);
    }
    function applyArtifactCalculatorDefaults(rootNode, titanOptions) {
      const titanId = Number(
        readCalculatorSelectValue(rootNode, ARTIFACT_CALC_TITAN_SELECT_ID, "0")
      );
      const slotId = Number(
        readCalculatorSelectValue(rootNode, ARTIFACT_CALC_SLOT_SELECT_ID, "0")
      );
      const levels = getArtifactCalculatorDefaultLevels(titanOptions, titanId, slotId);
      const maxLevel = getTitanArtifactMaxLevel(titanId, slotId);
      setCalculatorInputMaxValue(rootNode, ARTIFACT_CALC_START_INPUT_ID, maxLevel);
      setCalculatorInputMaxValue(rootNode, ARTIFACT_CALC_END_INPUT_ID, maxLevel);
      setCalculatorInputValue(rootNode, ARTIFACT_CALC_START_INPUT_ID, levels.startLevel);
      setCalculatorInputValue(rootNode, ARTIFACT_CALC_END_INPUT_ID, levels.endLevel);
    }
    function applyLevelCalculatorDefaults(rootNode, titanOptions) {
      const titanId = Number(
        readCalculatorSelectValue(rootNode, LEVEL_CALC_TITAN_SELECT_ID, "0")
      );
      const levels = getLevelCalculatorDefaultLevels(titanOptions, titanId);
      const maxLevel = getMaxTitanLevel();
      setCalculatorInputMaxValue(rootNode, LEVEL_CALC_START_INPUT_ID, maxLevel);
      setCalculatorInputMaxValue(rootNode, LEVEL_CALC_END_INPUT_ID, maxLevel);
      setCalculatorInputValue(rootNode, LEVEL_CALC_START_INPUT_ID, levels.startLevel);
      setCalculatorInputValue(rootNode, LEVEL_CALC_END_INPUT_ID, levels.endLevel);
    }
    function applySkinCalculatorDefaults(rootNode, titanOptions, skinGroups) {
      const titanId = Number(
        readCalculatorSelectValue(rootNode, SKIN_CALC_TITAN_SELECT_ID, "0")
      );
      const localeKey = readCalculatorSelectValue(rootNode, SKIN_CALC_GROUP_SELECT_ID, "");
      const levels = getSkinCalculatorDefaultLevels(
        titanOptions,
        skinGroups,
        titanId,
        localeKey
      );
      const maxLevel = findSkinCalculatorEntry(
        titanOptions,
        skinGroups,
        titanId,
        localeKey
      )?.maxLevel;
      setCalculatorInputMaxValue(rootNode, SKIN_CALC_START_INPUT_ID, maxLevel);
      setCalculatorInputMaxValue(rootNode, SKIN_CALC_END_INPUT_ID, maxLevel);
      setCalculatorInputValue(rootNode, SKIN_CALC_START_INPUT_ID, levels.startLevel);
      setCalculatorInputValue(rootNode, SKIN_CALC_END_INPUT_ID, levels.endLevel);
    }
    function bindTitanCostCalculator(rootNode, calculatorKind, {
      titanOptions = [],
      skinGroups = [],
      resourceAmount = 0,
      goldAmount = 0,
      potionAmount = 0,
      skinStoneAmount = 0
    } = {}) {
      if (!(rootNode instanceof HTMLElement)) {
        return;
      }
      const render = () => {
        if (calculatorKind === "artifact") {
          renderArtifactCalculator(rootNode, titanOptions, resourceAmount, goldAmount);
          return;
        }
        if (calculatorKind === "level") {
          renderLevelCalculator(rootNode, titanOptions, potionAmount);
          return;
        }
        if (calculatorKind === "skin") {
          renderSkinCalculator(rootNode, titanOptions, skinGroups, skinStoneAmount);
        }
      };
      const handleChange = (event) => {
        const targetId = String(event.target?.id ?? "");
        if (calculatorKind === "artifact" && (targetId === ARTIFACT_CALC_TITAN_SELECT_ID || targetId === ARTIFACT_CALC_SLOT_SELECT_ID)) {
          applyArtifactCalculatorDefaults(rootNode, titanOptions);
        }
        if (calculatorKind === "level" && targetId === LEVEL_CALC_TITAN_SELECT_ID) {
          applyLevelCalculatorDefaults(rootNode, titanOptions);
        }
        if (calculatorKind === "skin" && (targetId === SKIN_CALC_TITAN_SELECT_ID || targetId === SKIN_CALC_GROUP_SELECT_ID)) {
          applySkinCalculatorDefaults(rootNode, titanOptions, skinGroups);
        }
        render();
      };
      rootNode.addEventListener("input", handleChange, true);
      rootNode.addEventListener("change", handleChange, true);
      render();
    }
    function getTitanArtifactNextUpgrade(titanId, slotId, currentLevel) {
      const artifactConfig = getTitanArtifactConfig(titanId, slotId);
      if (!artifactConfig) {
        return void 0;
      }
      const normalizedCurrentLevel = Math.max(0, Number(currentLevel) || 0);
      const nextLevel = Math.max(0, Number(currentLevel) || 0) + 1;
      const normalizedSlotId = Number(slotId);
      const levelDataCandidates = [
        nextLevel,
        normalizedCurrentLevel,
        Math.max(0, nextLevel - 1)
      ].filter((level, index, levels) => levels.indexOf(level) === index).map((level) => getArtifactLevelConfigData(artifactConfig.levelConfigMap, level)).filter(Boolean);
      const levelData = levelDataCandidates.find((candidateLevelData) => {
        const candidateResourceCost = normalizedSlotId === 2 ? 0 : Math.max(
          0,
          Number(
            candidateLevelData?.cost?.consumable?.[TITAN_RESOURCE_CONSUMABLE_ID]
          ) || 0
        );
        const candidateGoldCost = normalizedSlotId === 2 ? Math.max(0, Number(candidateLevelData?.cost?.gold) || 0) : 0;
        return candidateResourceCost > 0 || candidateGoldCost > 0;
      });
      const resourceCost = normalizedSlotId === 2 ? 0 : Math.max(
        0,
        Number(levelData?.cost?.consumable?.[TITAN_RESOURCE_CONSUMABLE_ID]) || 0
      );
      const goldCost = normalizedSlotId === 2 ? Math.max(0, Number(levelData?.cost?.gold) || 0) : 0;
      const cost = resourceCost > 0 ? resourceCost : goldCost;
      if (cost <= 0) {
        return void 0;
      }
      return {
        titanId,
        slotId,
        artifactId: artifactConfig.artifactId,
        nextLevel,
        cost,
        resourceCost,
        goldCost
      };
    }
    function canAffordArtifactCandidate(candidate, resourceLeft, goldLeft) {
      if (!candidate) {
        return false;
      }
      return Number(candidate.resourceCost) <= resourceLeft && Number(candidate.goldCost) <= goldLeft;
    }
    function pickCheapestCandidateIndex(candidates, resourceLeft = Number.POSITIVE_INFINITY, goldLeft = Number.POSITIVE_INFINITY) {
      let bestIndex = -1;
      candidates.forEach((candidate, index) => {
        if (!candidate || candidate.cost <= 0 || !canAffordArtifactCandidate(candidate, resourceLeft, goldLeft)) {
          return;
        }
        if (bestIndex < 0) {
          bestIndex = index;
          return;
        }
        const bestCandidate = candidates[bestIndex];
        if (candidate.cost !== bestCandidate.cost) {
          if (candidate.cost < bestCandidate.cost) {
            bestIndex = index;
          }
          return;
        }
        if (candidate.nextLevel !== bestCandidate.nextLevel) {
          if (candidate.nextLevel < bestCandidate.nextLevel) {
            bestIndex = index;
          }
          return;
        }
        if (candidate.titanId !== bestCandidate.titanId) {
          if (candidate.titanId < bestCandidate.titanId) {
            bestIndex = index;
          }
          return;
        }
        if (candidate.slotId < bestCandidate.slotId) {
          bestIndex = index;
        }
      });
      return bestIndex;
    }
    function appendUpgradeSummaryEntry(summaryMap, step) {
      const summaryKey = `${step.titanId}:${step.slotId}`;
      if (!summaryMap.has(summaryKey)) {
        summaryMap.set(summaryKey, {
          titanName: step.titanName,
          artifactLabel: step.artifactLabel,
          startLevel: step.fromLevel,
          endLevel: step.toLevel,
          count: 0
        });
      }
      const summaryEntry = summaryMap.get(summaryKey);
      summaryEntry.endLevel = step.toLevel;
      summaryEntry.count += 1;
    }
    function clonePlainObject2(value) {
      if (!value || typeof value !== "object") {
        return {};
      }
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (_error) {
        return { ...value };
      }
    }
    function getArtifactFragmentShopSlots(shopData) {
      return Object.entries(shopData?.slots ?? {}).map(([slotKey, slotData]) => {
        const rewardEntries = Object.entries(
          slotData?.reward?.fragmentTitanArtifact ?? {}
        );
        const [artifactIdText, fragmentAmount] = rewardEntries[0] ?? [];
        const artifactId = Number(artifactIdText);
        const coinCost = Math.max(
          0,
          Number(slotData?.cost?.coin?.[TITAN_ARTIFACT_FRAGMENT_COIN_ID]) || 0
        );
        const rawAmountAvailable = Number(slotData?.amountAvailable);
        const amountAvailable = Number.isFinite(rawAmountAvailable) && rawAmountAvailable > 0 ? Math.floor(rawAmountAvailable) : Number.POSITIVE_INFINITY;
        if (!Number.isFinite(artifactId) || artifactId <= 0 || Math.max(0, Number(fragmentAmount) || 0) <= 0 || coinCost <= 0) {
          return null;
        }
        return {
          shopId: TITAN_ARTIFACT_FRAGMENT_SHOP_ID,
          slotId: Number(slotKey),
          artifactId,
          artifactName: getArtifactName(artifactId),
          fragmentAmount: Math.max(0, Number(fragmentAmount) || 0),
          coinCost,
          reward: clonePlainObject2(slotData.reward),
          cost: clonePlainObject2(slotData.cost),
          bought: !!slotData.bought,
          rawAmountAvailable: slotData?.amountAvailable,
          amountAvailable
        };
      }).filter(Boolean);
    }
    function summarizeArtifactFragmentShopSlot(slot) {
      if (!slot) {
        return null;
      }
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
      if (!purchaseStep) {
        return null;
      }
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
      if (!summaryMap.has(summaryKey)) {
        summaryMap.set(summaryKey, {
          artifactName: purchaseStep.artifactName,
          amount: 0,
          coinSpentAmount: 0
        });
      }
      const summaryEntry = summaryMap.get(summaryKey);
      summaryEntry.amount += purchaseStep.amount;
      summaryEntry.coinSpentAmount += Number(purchaseStep.coinSpentAmount) || purchaseStep.coinCost * (purchaseStep.purchaseCount || purchaseStep.amount);
    }
    function appendArtifactEvolutionSummaryEntry(summaryMap, evolutionStep) {
      const summaryKey = `${evolutionStep.titanId}:${evolutionStep.slotId}`;
      if (!summaryMap.has(summaryKey)) {
        summaryMap.set(summaryKey, {
          titanName: evolutionStep.titanName,
          artifactLabel: evolutionStep.artifactLabel,
          startStar: evolutionStep.fromStar,
          endStar: evolutionStep.toStar,
          count: 0
        });
      }
      const summaryEntry = summaryMap.get(summaryKey);
      summaryEntry.endStar = evolutionStep.toStar;
      summaryEntry.count += 1;
    }
    function getArtifactEvolutionPlanScore(planOption) {
      return (planOption?.evolutions?.length ?? 0) * 1e3 + (planOption?.fragmentTargetCount ?? 0);
    }
    function isBetterArtifactEvolutionPlan(leftPlan, rightPlan) {
      if (!rightPlan) {
        return true;
      }
      const leftScore = getArtifactEvolutionPlanScore(leftPlan);
      const rightScore = getArtifactEvolutionPlanScore(rightPlan);
      if (leftScore !== rightScore) {
        return leftScore > rightScore;
      }
      const leftCoinSpent = Math.max(0, Number(leftPlan?.coinSpentAmount) || 0);
      const rightCoinSpent = Math.max(0, Number(rightPlan?.coinSpentAmount) || 0);
      if (leftCoinSpent !== rightCoinSpent) {
        return leftCoinSpent < rightCoinSpent;
      }
      const leftFragments = Math.max(0, Number(leftPlan?.fragmentCost) || 0);
      const rightFragments = Math.max(0, Number(rightPlan?.fragmentCost) || 0);
      if (leftFragments !== rightFragments) {
        return leftFragments < rightFragments;
      }
      return (leftPlan?.fragmentPurchases?.length ?? 0) < (rightPlan?.fragmentPurchases?.length ?? 0);
    }
    function pruneArtifactEvolutionPlanOptions(planOptions) {
      const bestByCoin = /* @__PURE__ */ new Map();
      (planOptions ?? []).forEach((planOption) => {
        const coinSpent = Math.max(0, Number(planOption?.coinSpentAmount) || 0);
        const currentOption = bestByCoin.get(coinSpent);
        if (isBetterArtifactEvolutionPlan(planOption, currentOption)) {
          bestByCoin.set(coinSpent, planOption);
        }
      });
      const result = [];
      let bestScore = -1;
      [...bestByCoin.values()].sort(
        (left, right) => Math.max(0, Number(left.coinSpentAmount) || 0) - Math.max(0, Number(right.coinSpentAmount) || 0)
      ).forEach((planOption) => {
        const score = getArtifactEvolutionPlanScore(planOption);
        if (score > bestScore) {
          result.push(planOption);
          bestScore = score;
        }
      });
      return result;
    }
    function buildArtifactEvolutionGroupOptions({
      artifactId,
      artifactName,
      chains,
      inventory,
      shopSlot,
      buyMissingFragments,
      debugEntries = void 0
    }) {
      let fragmentOptions = [
        {
          fragmentCost: 0,
          fragmentTargetCount: 0,
          evolutions: []
        }
      ];
      (chains ?? []).forEach((chain) => {
        const chainOptions = [
          {
            fragmentCost: 0,
            fragmentTargetCount: 0,
            evolutions: []
          }
        ];
        let prefixFragmentCost = 0;
        let prefixEvolutions = [];
        (chain.evolutionSteps ?? []).forEach((evolutionStep) => {
          prefixFragmentCost += evolutionStep.fragmentCost;
          prefixEvolutions = [...prefixEvolutions, evolutionStep];
          chainOptions.push({
            fragmentCost: prefixFragmentCost,
            fragmentTargetCount: 0,
            evolutions: prefixEvolutions
          });
        });
        if (chain.evolutionSteps.length <= 0 && chain.nextStarFragmentCost > 0) {
          chainOptions.push({
            fragmentCost: chain.nextStarFragmentCost,
            fragmentTargetCount: 1,
            evolutions: []
          });
        }
        const nextOptions = [];
        fragmentOptions.forEach((baseOption) => {
          chainOptions.forEach((chainOption) => {
            nextOptions.push({
              fragmentCost: baseOption.fragmentCost + chainOption.fragmentCost,
              fragmentTargetCount: baseOption.fragmentTargetCount + chainOption.fragmentTargetCount,
              evolutions: [...baseOption.evolutions, ...chainOption.evolutions]
            });
          });
        });
        fragmentOptions = pruneArtifactEvolutionPlanOptions(
          nextOptions.map((option) => ({
            ...option,
            coinSpentAmount: option.fragmentCost
          }))
        ).map((option) => ({
          fragmentCost: option.fragmentCost,
          fragmentTargetCount: option.fragmentTargetCount,
          evolutions: option.evolutions
        }));
      });
      const availableFragments = getTitanArtifactFragmentAmount(inventory, artifactId);
      const canBuyFragments = (chains ?? []).some((chain) => chain.canBuyFragments);
      debugEntries?.push({
        stage: "group:init",
        artifactId,
        artifactName,
        availableFragments,
        canBuyFragments,
        buyMissingFragments: !!buyMissingFragments,
        shopSlot: summarizeArtifactFragmentShopSlot(shopSlot),
        chainCount: chains?.length ?? 0,
        optionCount: fragmentOptions.length
      });
      return fragmentOptions.map((fragmentOption) => {
        const missingFragments = Math.max(
          0,
          fragmentOption.fragmentCost - availableFragments
        );
        if (missingFragments <= 0) {
          debugEntries?.push({
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
        if (!buyMissingFragments) {
          rejectionReasons.push("setting-disabled");
        }
        if (!canBuyFragments) {
          rejectionReasons.push("artifact-not-selected-for-fragment-buy");
        }
        if (!shopSlot) {
          rejectionReasons.push("shop-slot-not-found");
        }
        if (shopSlot && shopSlot.coinCost <= 0) {
          rejectionReasons.push("shop-slot-without-coin-cost");
        }
        if (rejectionReasons.length > 0) {
          debugEntries?.push({
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
        const targetFragmentAmount = Math.max(
          TITAN_ARTIFACT_FRAGMENT_MIN_PURCHASE_AMOUNT,
          missingFragments
        );
        const fragmentsPerPurchase = Math.max(
          1,
          Math.floor(Number(shopSlot.fragmentAmount) || 0)
        );
        const purchaseCount = Math.ceil(targetFragmentAmount / fragmentsPerPurchase);
        if (purchaseCount > shopSlot.amountAvailable) {
          debugEntries?.push({
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
        debugEntries?.push({
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
          fragmentPurchases: purchaseCount > 0 ? [
            {
              ...shopSlot,
              artifactId,
              artifactName,
              amount: purchasedFragmentAmount,
              purchaseCount,
              coinSpentAmount: purchaseCount * shopSlot.coinCost
            }
          ] : []
        };
      }).filter(Boolean);
    }
    function buildArtifactEvolutionPlan({
      selectedTitanIds,
      ownedTitans,
      inventory,
      shopData,
      coinAmount,
      coinReserveAmount,
      selectedArtifactEvolutionKeys = [],
      selectedArtifactFragmentBuyKeys = [],
      maxArtifactStar = 0,
      buyMissingFragments = false,
      maxOperationCount = void 0,
      debugEntries = void 0
    }) {
      const fragmentShopSlots = getArtifactFragmentShopSlots(shopData);
      const shopSlotByArtifactId = new Map(
        fragmentShopSlots.filter((slot) => !slot.bought).map((slot) => [slot.artifactId, slot])
      );
      const evolutionKeySet = new Set(
        normalizeTitanArtifactKeys(selectedArtifactEvolutionKeys)
      );
      const buyKeySet = new Set(
        normalizeTitanArtifactKeys(selectedArtifactFragmentBuyKeys, [0, 1])
      );
      const normalizedMaxArtifactStar = Math.max(0, Number(maxArtifactStar) || 0);
      const totalCoinAmount = Math.max(0, Number(coinAmount) || 0);
      const normalizedCoinReserveAmount = Math.max(
        0,
        Number(coinReserveAmount) || 0
      );
      const coinBudget = Math.max(0, totalCoinAmount - normalizedCoinReserveAmount);
      const groupByArtifactId = /* @__PURE__ */ new Map();
      debugEntries?.push({
        stage: "plan:start",
        buyMissingFragments: !!buyMissingFragments,
        selectedTitanIds: [...selectedTitanIds ?? []],
        selectedArtifactEvolutionKeys: [
          ...normalizeTitanArtifactKeys(selectedArtifactEvolutionKeys)
        ],
        selectedArtifactFragmentBuyKeys: [
          ...normalizeTitanArtifactKeys(selectedArtifactFragmentBuyKeys, [0, 1])
        ],
        coinAmount: totalCoinAmount,
        coinReserveAmount: normalizedCoinReserveAmount,
        coinBudget,
        shopSlots: fragmentShopSlots.map(
          (slot) => summarizeArtifactFragmentShopSlot(slot)
        )
      });
      selectedTitanIds.forEach((titanId) => {
        const titanData = ownedTitans?.[titanId];
        if (!titanData) {
          debugEntries?.push({
            stage: "target:skipped",
            reason: "titan-not-owned",
            titanId
          });
          return;
        }
        const artifactStates = getTitanArtifactStates(titanData);
        ARTIFACT_SLOT_IDS.forEach((slotId) => {
          const artifactKey = buildTitanArtifactKey(titanId, slotId);
          const shouldEvolveArtifact = evolutionKeySet.has(artifactKey);
          const shouldBuyArtifactFragments = buyKeySet.has(artifactKey);
          if (!shouldEvolveArtifact && !shouldBuyArtifactFragments) {
            return;
          }
          const artifactConfig = getTitanArtifactConfig(titanId, slotId);
          if (!artifactConfig) {
            debugEntries?.push({
              stage: "target:skipped",
              reason: "artifact-config-not-found",
              titanId,
              titanName: getTitanName(titanId),
              slotId,
              artifactKey,
              shouldEvolveArtifact,
              shouldBuyArtifactFragments
            });
            return;
          }
          const artifactState = artifactStates[slotId] ?? { star: 0 };
          const currentStar = Math.max(0, Number(artifactState.star) || 0);
          const maxStar = getMaxTitanArtifactStar(titanId, slotId);
          const targetStar = normalizedMaxArtifactStar > 0 ? Math.min(normalizedMaxArtifactStar, maxStar) : maxStar;
          const evolutionSteps = getTitanArtifactEvolutionSteps(
            titanId,
            slotId,
            currentStar,
            targetStar
          );
          if (evolutionSteps.length <= 0) {
            debugEntries?.push({
              stage: "target:skipped",
              reason: "no-evolution-steps",
              titanId,
              titanName: getTitanName(titanId),
              slotId,
              artifactKey,
              artifactId: artifactConfig.artifactId,
              artifactName: getArtifactName(artifactConfig.artifactId),
              currentStar,
              targetStar,
              shouldEvolveArtifact,
              shouldBuyArtifactFragments
            });
            return;
          }
          if (!groupByArtifactId.has(artifactConfig.artifactId)) {
            groupByArtifactId.set(artifactConfig.artifactId, {
              artifactId: artifactConfig.artifactId,
              artifactName: getArtifactName(artifactConfig.artifactId),
              chains: []
            });
          }
          let plannedStar = currentStar;
          const chainEvolutionSteps = shouldEvolveArtifact ? evolutionSteps.map((evolutionStep) => {
            const step = {
              titanId,
              titanName: getTitanName(titanId),
              slotId,
              artifactId: artifactConfig.artifactId,
              artifactLabel: getArtifactSlotMeta(slotId).label,
              artifactName: getArtifactName(artifactConfig.artifactId),
              fromStar: plannedStar,
              toStar: evolutionStep.star,
              fragmentCost: evolutionStep.fragmentCost
            };
            plannedStar = evolutionStep.star;
            return step;
          }) : [];
          groupByArtifactId.get(artifactConfig.artifactId).chains.push({
            titanId,
            slotId,
            canBuyFragments: shouldBuyArtifactFragments,
            nextStarFragmentCost: !shouldEvolveArtifact && shouldBuyArtifactFragments ? evolutionSteps[0].fragmentCost : 0,
            evolutionSteps: chainEvolutionSteps
          });
          debugEntries?.push({
            stage: "target:registered",
            titanId,
            titanName: getTitanName(titanId),
            slotId,
            artifactKey,
            artifactId: artifactConfig.artifactId,
            artifactName: getArtifactName(artifactConfig.artifactId),
            currentStar,
            targetStar,
            nextStarFragmentCost: evolutionSteps[0]?.fragmentCost ?? 0,
            evolutionStepCount: chainEvolutionSteps.length,
            shouldEvolveArtifact,
            shouldBuyArtifactFragments,
            shopSlot: summarizeArtifactFragmentShopSlot(
              shopSlotByArtifactId.get(artifactConfig.artifactId)
            )
          });
        });
      });
      let plans = [
        {
          coinSpentAmount: 0,
          fragmentCost: 0,
          fragmentTargetCount: 0,
          fragmentPurchases: [],
          evolutions: []
        }
      ];
      [...groupByArtifactId.values()].forEach((group) => {
        const groupOptions = buildArtifactEvolutionGroupOptions({
          ...group,
          inventory,
          shopSlot: shopSlotByArtifactId.get(group.artifactId),
          buyMissingFragments,
          debugEntries
        });
        const nextPlans = [];
        plans.forEach((basePlan) => {
          groupOptions.forEach((groupOption) => {
            const nextCoinSpent = basePlan.coinSpentAmount + groupOption.coinSpentAmount;
            if (nextCoinSpent > coinBudget) {
              debugEntries?.push({
                stage: "plan:budget-rejected",
                artifactId: group.artifactId,
                artifactName: group.artifactName,
                baseCoinSpentAmount: basePlan.coinSpentAmount,
                groupCoinSpentAmount: groupOption.coinSpentAmount,
                nextCoinSpent,
                coinBudget,
                fragmentPurchases: (groupOption.fragmentPurchases ?? []).map(
                  (purchaseStep) => summarizeArtifactFragmentPurchase(purchaseStep)
                )
              });
              return;
            }
            nextPlans.push({
              coinSpentAmount: nextCoinSpent,
              fragmentCost: basePlan.fragmentCost + groupOption.fragmentCost,
              fragmentTargetCount: basePlan.fragmentTargetCount + groupOption.fragmentTargetCount,
              fragmentPurchases: [
                ...basePlan.fragmentPurchases,
                ...groupOption.fragmentPurchases
              ],
              evolutions: [...basePlan.evolutions, ...groupOption.evolutions]
            });
          });
        });
        if (nextPlans.length <= 0) {
          debugEntries?.push({
            stage: "plan:group-skipped",
            artifactId: group.artifactId,
            artifactName: group.artifactName,
            reason: "no-options-inside-budget",
            groupOptionCount: groupOptions.length,
            coinBudget
          });
          return;
        }
        plans = pruneArtifactEvolutionPlanOptions(nextPlans);
      });
      const bestPlan = plans.reduce(
        (bestOption, planOption) => isBetterArtifactEvolutionPlan(planOption, bestOption) ? planOption : bestOption,
        plans[0]
      );
      if (buyMissingFragments && bestPlan.fragmentPurchases.length <= 0 && coinBudget > 0) {
        const fallbackPurchase = [...groupByArtifactId.values()].map((group) => {
          const shopSlot = shopSlotByArtifactId.get(group.artifactId);
          if (!shopSlot || shopSlot.coinCost <= 0) {
            debugEntries?.push({
              stage: "fallback:rejected",
              artifactId: group.artifactId,
              artifactName: group.artifactName,
              reason: shopSlot ? "shop-slot-without-coin-cost" : "shop-slot-not-found",
              shopSlot: summarizeArtifactFragmentShopSlot(shopSlot)
            });
            return null;
          }
          const closestNeed = (group.chains ?? []).filter((chain) => chain.canBuyFragments).map((chain) => {
            const nextFragmentCost = Number(chain.nextStarFragmentCost) || Number(chain.evolutionSteps?.[0]?.fragmentCost) || 0;
            const ownedFragments = getTitanArtifactFragmentAmount(
              inventory,
              group.artifactId
            );
            return Math.max(0, nextFragmentCost - ownedFragments);
          }).filter((missingFragments) => missingFragments > 0).sort((left, right) => left - right)[0];
          if (!Number.isFinite(closestNeed) || closestNeed <= 0) {
            debugEntries?.push({
              stage: "fallback:rejected",
              artifactId: group.artifactId,
              artifactName: group.artifactName,
              reason: "no-missing-fragments",
              availableFragments: getTitanArtifactFragmentAmount(
                inventory,
                group.artifactId
              ),
              shopSlot: summarizeArtifactFragmentShopSlot(shopSlot)
            });
            return null;
          }
          const fragmentsPerPurchase = Math.max(
            1,
            Math.floor(Number(shopSlot.fragmentAmount) || 0)
          );
          const maxAffordablePurchaseCount = Math.min(
            Math.floor(coinBudget / shopSlot.coinCost),
            Number.isFinite(Number(shopSlot.amountAvailable)) ? Math.max(0, Math.floor(Number(shopSlot.amountAvailable))) : Number.POSITIVE_INFINITY
          );
          const targetFragmentAmount = Math.max(
            TITAN_ARTIFACT_FRAGMENT_MIN_PURCHASE_AMOUNT,
            closestNeed
          );
          const neededPurchaseCount = Math.ceil(
            targetFragmentAmount / fragmentsPerPurchase
          );
          const purchaseCount = Math.min(
            neededPurchaseCount,
            maxAffordablePurchaseCount
          );
          if (purchaseCount <= 0) {
            debugEntries?.push({
              stage: "fallback:rejected",
              artifactId: group.artifactId,
              artifactName: group.artifactName,
              reason: "not-affordable",
              closestNeed,
              targetFragmentAmount,
              fragmentsPerPurchase,
              neededPurchaseCount,
              maxAffordablePurchaseCount,
              coinBudget,
              shopSlot: summarizeArtifactFragmentShopSlot(shopSlot)
            });
            return null;
          }
          return {
            ...shopSlot,
            artifactId: group.artifactId,
            artifactName: group.artifactName,
            amount: purchaseCount * fragmentsPerPurchase,
            purchaseCount,
            coinSpentAmount: purchaseCount * shopSlot.coinCost,
            missingFragments: closestNeed
          };
        }).filter(Boolean).sort(
          (left, right) => left.missingFragments - right.missingFragments || left.coinCost - right.coinCost || left.artifactName.localeCompare(right.artifactName, "ru")
        )[0];
        if (fallbackPurchase) {
          debugEntries?.push({
            stage: "fallback:planned",
            purchase: summarizeArtifactFragmentPurchase(fallbackPurchase)
          });
          bestPlan.fragmentPurchases.push(fallbackPurchase);
          bestPlan.coinSpentAmount += fallbackPurchase.coinSpentAmount;
        } else {
          debugEntries?.push({
            stage: "fallback:empty",
            reason: "no-buyable-candidate",
            coinBudget
          });
        }
      }
      const normalizedMaxOperationCount = Number.isFinite(Number(maxOperationCount)) ? Math.max(0, Math.floor(Number(maxOperationCount))) : void 0;
      if (normalizedMaxOperationCount !== void 0) {
        const initialPurchaseCount = bestPlan.fragmentPurchases.length;
        const initialEvolutionCount = bestPlan.evolutions.length;
        bestPlan.fragmentPurchases = bestPlan.fragmentPurchases.slice(
          0,
          normalizedMaxOperationCount
        );
        const remainingOperationCount = Math.max(
          0,
          normalizedMaxOperationCount - bestPlan.fragmentPurchases.length
        );
        bestPlan.evolutions = bestPlan.evolutions.slice(0, remainingOperationCount);
        bestPlan.coinSpentAmount = bestPlan.fragmentPurchases.reduce(
          (total, purchaseStep) => total + (Number(purchaseStep.coinSpentAmount) || 0),
          0
        );
        debugEntries?.push({
          stage: "plan:operation-limit",
          maxOperationCount: normalizedMaxOperationCount,
          initialPurchaseCount,
          initialEvolutionCount,
          limitedPurchaseCount: bestPlan.fragmentPurchases.length,
          limitedEvolutionCount: bestPlan.evolutions.length
        });
      }
      debugEntries?.push({
        stage: "plan:result",
        coinSpentAmount: bestPlan.coinSpentAmount,
        fragmentPurchaseCount: bestPlan.fragmentPurchases.length,
        evolutionCount: bestPlan.evolutions.length,
        fragmentPurchases: bestPlan.fragmentPurchases.map(
          (purchaseStep) => summarizeArtifactFragmentPurchase(purchaseStep)
        )
      });
      const purchaseSummary = /* @__PURE__ */ new Map();
      const evolutionSummary = /* @__PURE__ */ new Map();
      bestPlan.fragmentPurchases.forEach(
        (purchaseStep) => appendArtifactFragmentPurchaseSummaryEntry(purchaseSummary, purchaseStep)
      );
      bestPlan.evolutions.forEach(
        (evolutionStep) => appendArtifactEvolutionSummaryEntry(evolutionSummary, evolutionStep)
      );
      return {
        fragmentPurchases: bestPlan.fragmentPurchases,
        evolutions: bestPlan.evolutions,
        purchaseSummary,
        evolutionSummary,
        coinSpentAmount: bestPlan.coinSpentAmount,
        coinLeftAmount: Math.max(0, totalCoinAmount - bestPlan.coinSpentAmount),
        coinReserveAmount: normalizedCoinReserveAmount
      };
    }
    function buildUpgradePlan(selectedTitanIds, selectedArtifactSlotIds, artifactLevelCaps, ownedTitans, resourceAmount, reserveAmount, goldAmount, goldReserveAmount, maxUpgradeCount = void 0) {
      const candidates = [];
      const allowedSlotIdSet = new Set(
        (selectedArtifactSlotIds ?? [0, 1]).filter(
          (slotId) => ARTIFACT_SLOT_ID_SET.has(Number(slotId))
        )
      );
      selectedTitanIds.forEach((titanId) => {
        const titanData = ownedTitans?.[titanId];
        const artifactLevels = getTitanArtifactLevels(titanData);
        artifactLevels.forEach((artifactLevel, slotId) => {
          if (!allowedSlotIdSet.has(Number(slotId))) {
            return;
          }
          const levelCap = Math.max(0, Number(artifactLevelCaps?.[slotId]) || 0);
          if (levelCap > 0 && artifactLevel >= levelCap) {
            return;
          }
          const nextUpgrade = getTitanArtifactNextUpgrade(titanId, slotId, artifactLevel);
          if (!nextUpgrade) {
            return;
          }
          candidates.push({
            titanId,
            titanName: getTitanName(titanId),
            slotId,
            artifactLabel: getArtifactSlotMeta(slotId).label,
            currentLevel: artifactLevel,
            nextLevel: nextUpgrade.nextLevel,
            cost: nextUpgrade.cost,
            resourceCost: nextUpgrade.resourceCost,
            goldCost: nextUpgrade.goldCost
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
      while (candidates.length > 0 && queue.length < normalizedMaxUpgradeCount) {
        const cheapestCandidateIndex = pickCheapestCandidateIndex(
          candidates,
          resourceLeft,
          goldLeft
        );
        if (cheapestCandidateIndex < 0) {
          break;
        }
        const candidate = candidates[cheapestCandidateIndex];
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
        appendUpgradeSummaryEntry(summary, step);
        resourceLeft -= candidate.resourceCost;
        goldLeft -= candidate.goldCost;
        candidate.currentLevel = candidate.nextLevel;
        const levelCap = Math.max(0, Number(artifactLevelCaps?.[candidate.slotId]) || 0);
        if (levelCap > 0 && candidate.currentLevel >= levelCap) {
          candidates.splice(cheapestCandidateIndex, 1);
          continue;
        }
        const nextUpgrade = getTitanArtifactNextUpgrade(
          candidate.titanId,
          candidate.slotId,
          candidate.currentLevel
        );
        if (!nextUpgrade) {
          candidates.splice(cheapestCandidateIndex, 1);
          continue;
        }
        candidate.nextLevel = nextUpgrade.nextLevel;
        candidate.cost = nextUpgrade.cost;
        candidate.resourceCost = nextUpgrade.resourceCost;
        candidate.goldCost = nextUpgrade.goldCost;
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
        usesGoldBudget: allowedSlotIdSet.has(2)
      };
    }
    function getTitanSkinNextUpgrade(skinId, currentLevel) {
      const normalizedCurrentLevel = Math.max(0, Number(currentLevel) || 0);
      const nextLevel = Math.max(0, Number(currentLevel) || 0) + 1;
      const levelData = [nextLevel, normalizedCurrentLevel, Math.max(0, nextLevel - 1)].filter((level, index, levels) => levels.indexOf(level) === index).map((level) => getTitanSkinLevelData(skinId, level)).filter(Boolean).find(
        (candidateLevelData) => Math.max(
          0,
          Number(
            candidateLevelData?.cost?.coin?.[TITAN_SKIN_RESOURCE_COIN_ID]
          ) || 0
        ) > 0
      );
      const cost = Math.max(
        0,
        Number(levelData?.cost?.coin?.[TITAN_SKIN_RESOURCE_COIN_ID]) || 0
      );
      if (cost <= 0) {
        return void 0;
      }
      return {
        skinId: Math.max(0, Number(skinId) || 0),
        nextLevel,
        cost
      };
    }
    function pickCheapestTitanSkinCandidateIndex(candidates) {
      let bestIndex = -1;
      candidates.forEach((candidate, index) => {
        if (!candidate || candidate.cost <= 0) {
          return;
        }
        if (bestIndex < 0) {
          bestIndex = index;
          return;
        }
        const bestCandidate = candidates[bestIndex];
        if (candidate.cost !== bestCandidate.cost) {
          if (candidate.cost < bestCandidate.cost) {
            bestIndex = index;
          }
          return;
        }
        if (candidate.nextLevel !== bestCandidate.nextLevel) {
          if (candidate.nextLevel < bestCandidate.nextLevel) {
            bestIndex = index;
          }
          return;
        }
        if (candidate.titanId !== bestCandidate.titanId) {
          if (candidate.titanId < bestCandidate.titanId) {
            bestIndex = index;
          }
          return;
        }
        if (candidate.name.localeCompare(bestCandidate.name, "ru") < 0) {
          bestIndex = index;
          return;
        }
        if (candidate.skinId < bestCandidate.skinId) {
          bestIndex = index;
        }
      });
      return bestIndex;
    }
    function appendTitanSkinSummaryEntry(summaryMap, step) {
      const summaryKey = `${step.titanId}:${step.localeKey}`;
      if (!summaryMap.has(summaryKey)) {
        summaryMap.set(summaryKey, {
          titanName: step.titanName,
          skinName: step.name,
          startLevel: step.fromLevel,
          endLevel: step.toLevel,
          count: 0
        });
      }
      const summaryEntry = summaryMap.get(summaryKey);
      summaryEntry.endLevel = step.toLevel;
      summaryEntry.count += 1;
    }
    function buildTitanSkinPlan(selectedTitanIds, selectedSkinLocaleKeys, skinLevelCaps, ownedTitans, skinStoneAmount, reserveAmount, maxUpgradeCount = void 0) {
      const allowedLocaleKeySet = new Set(selectedSkinLocaleKeys ?? []);
      const candidates = [];
      selectedTitanIds.forEach((titanId) => {
        getTitanSkinEntries(ownedTitans?.[titanId]).forEach((skinEntry) => {
          if (!allowedLocaleKeySet.has(skinEntry.localeKey)) {
            return;
          }
          const levelCap = Math.max(0, Number(skinLevelCaps?.[skinEntry.localeKey]) || 0);
          if (levelCap > 0 && skinEntry.currentLevel >= levelCap) {
            return;
          }
          const nextUpgrade = getTitanSkinNextUpgrade(
            skinEntry.skinId,
            skinEntry.currentLevel
          );
          if (!nextUpgrade) {
            return;
          }
          candidates.push({
            titanId,
            titanName: getTitanName(titanId),
            skinId: skinEntry.skinId,
            localeKey: skinEntry.localeKey,
            name: skinEntry.name,
            currentLevel: skinEntry.currentLevel,
            nextLevel: nextUpgrade.nextLevel,
            cost: nextUpgrade.cost
          });
        });
      });
      const queue = [];
      const summary = /* @__PURE__ */ new Map();
      const totalSkinStoneAmount = Math.max(0, Number(skinStoneAmount) || 0);
      const normalizedReserveAmount = Math.max(0, Number(reserveAmount) || 0);
      let stonesLeft = Math.max(0, totalSkinStoneAmount - normalizedReserveAmount);
      const normalizedMaxUpgradeCount = Number.isFinite(Number(maxUpgradeCount)) ? Math.max(0, Math.floor(Number(maxUpgradeCount))) : Number.POSITIVE_INFINITY;
      while (candidates.length > 0 && queue.length < normalizedMaxUpgradeCount) {
        const cheapestCandidateIndex = pickCheapestTitanSkinCandidateIndex(candidates);
        if (cheapestCandidateIndex < 0) {
          break;
        }
        const candidate = candidates[cheapestCandidateIndex];
        if (candidate.cost > stonesLeft) {
          break;
        }
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
        const levelCap = Math.max(0, Number(skinLevelCaps?.[candidate.localeKey]) || 0);
        if (levelCap > 0 && candidate.currentLevel >= levelCap) {
          candidates.splice(cheapestCandidateIndex, 1);
          continue;
        }
        const nextUpgrade = getTitanSkinNextUpgrade(
          candidate.skinId,
          candidate.currentLevel
        );
        if (!nextUpgrade) {
          candidates.splice(cheapestCandidateIndex, 1);
          continue;
        }
        candidate.nextLevel = nextUpgrade.nextLevel;
        candidate.cost = nextUpgrade.cost;
      }
      const spentAmount = Math.max(0, totalSkinStoneAmount - normalizedReserveAmount) - stonesLeft;
      return {
        queue,
        summary,
        spentAmount,
        leftAmount: Math.max(0, totalSkinStoneAmount - spentAmount)
      };
    }
    function getTitanLevelConfig(level) {
      return globalThis.lib?.data?.level?.titan?.[Math.max(0, Number(level) || 0)];
    }
    function getTitanLevelUpCost(currentLevel) {
      const normalizedCurrentLevel = Math.max(0, Number(currentLevel) || 0);
      const currentLevelData = getTitanLevelConfig(normalizedCurrentLevel);
      const nextLevelData = getTitanLevelConfig(normalizedCurrentLevel + 1);
      if (!currentLevelData || !nextLevelData) {
        return void 0;
      }
      const currentExp = Number(currentLevelData.exp);
      const nextExp = Number(nextLevelData.exp);
      const cost = nextExp - currentExp;
      if (!Number.isFinite(cost) || cost <= 0) {
        return void 0;
      }
      return cost;
    }
    function getTitanEvolutionCost(nextStar) {
      return Math.max(
        0,
        Number(
          globalThis.lib?.data?.enum?.titanEvolutionStar?.[Math.max(0, Number(nextStar) || 0)]?.evolveFragmentCost
        ) || 0
      );
    }
    function getMaxTitanEvolutionStar() {
      return Object.keys(globalThis.lib?.data?.enum?.titanEvolutionStar ?? {}).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0).reduce((maxValue, value) => Math.max(maxValue, value), 0);
    }
    function getTitanStarCount(titanData) {
      return Math.max(0, Number(titanData?.star ?? titanData?.stars) || 0);
    }
    function buildTitanEvolutionMarkup(titanId, titanData, inventory) {
      const currentStars = getTitanStarCount(titanData);
      const soulAmount = getTitanSoulAmount(inventory, titanId);
      const maxEvolutionStar = getMaxTitanEvolutionStar();
      const nextStar = currentStars + 1;
      const evolveCost = getTitanEvolutionCost(nextStar);
      const isAbsolute = maxEvolutionStar > 0 ? currentStars >= maxEvolutionStar : evolveCost <= 0 && currentStars > 0;
      const hasKnownCost = evolveCost > 0;
      const delta = isAbsolute ? soulAmount : hasKnownCost ? soulAmount - evolveCost : void 0;
      const currentSoulColor = isAbsolute ? soulAmount > 0 ? "#d7b2ff" : "#8f7a68" : hasKnownCost && soulAmount >= evolveCost ? "#9fe0a8" : "#f0d59f";
      const deltaColor = isAbsolute ? soulAmount > 0 ? "#d7b2ff" : "#8f7a68" : (delta ?? 0) >= 0 ? "#9fe0a8" : "#ff9f9f";
      const needText = isAbsolute ? translate("HWHTITANLVL_EVOLUTION_ABSOLUTE") : hasKnownCost ? formatNumber$1(evolveCost) : "?";
      return `<span class="hwhx-titan-evolution"><span class="hwhx-titan-value" data-tone="gold">${buildInlineIcon("trophy", "hwhx-gold")}${escapeHtml$1(String(currentStars))}</span><span>(</span>${buildTitanValueMarkup(formatNumber$1(soulAmount), getTitanToneByColor(currentSoulColor))}<span>/${escapeHtml$1(needText)}</span>${typeof delta === "number" ? `<span>,</span>${buildTitanValueMarkup(formatSignedNumber$1(delta), getTitanToneByColor(deltaColor))}` : ""}<span>)</span></span>`;
    }
    function pickCheapestTitanLevelCandidateIndex(candidates) {
      let bestIndex = -1;
      candidates.forEach((candidate, index) => {
        if (!candidate || candidate.cost <= 0) {
          return;
        }
        if (bestIndex < 0) {
          bestIndex = index;
          return;
        }
        const bestCandidate = candidates[bestIndex];
        if (candidate.cost !== bestCandidate.cost) {
          if (candidate.cost < bestCandidate.cost) {
            bestIndex = index;
          }
          return;
        }
        if (candidate.nextLevel !== bestCandidate.nextLevel) {
          if (candidate.nextLevel < bestCandidate.nextLevel) {
            bestIndex = index;
          }
          return;
        }
        if (candidate.titanId < bestCandidate.titanId) {
          bestIndex = index;
        }
      });
      return bestIndex;
    }
    function appendTitanLevelSummaryEntry(summaryMap, step) {
      const summaryKey = String(step.titanId);
      if (!summaryMap.has(summaryKey)) {
        summaryMap.set(summaryKey, {
          titanName: step.titanName,
          startLevel: step.fromLevel,
          endLevel: step.toLevel,
          count: 0
        });
      }
      const summaryEntry = summaryMap.get(summaryKey);
      summaryEntry.endLevel = step.toLevel;
      summaryEntry.count += 1;
    }
    function appendTitanEvolutionSummaryEntry(summaryMap, step) {
      const summaryKey = String(step.titanId);
      if (!summaryMap.has(summaryKey)) {
        summaryMap.set(summaryKey, {
          titanName: step.titanName,
          startStar: step.fromStar,
          endStar: step.toStar,
          count: 0
        });
      }
      const summaryEntry = summaryMap.get(summaryKey);
      summaryEntry.endStar = step.toStar;
      summaryEntry.count += 1;
    }
    function buildTitanEvolutionPlan(selectedTitanEvolutionIds, ownedTitans, inventory, maxTitanStar = 0) {
      const selectedTitanIdSet = new Set(
        (selectedTitanEvolutionIds ?? []).map((value) => Number(value)).filter((value) => Number.isFinite(value))
      );
      const maxKnownStar = getMaxTitanEvolutionStar();
      const targetStar = Math.max(0, Number(maxTitanStar) || 0) > 0 ? Math.min(Math.max(0, Number(maxTitanStar) || 0), maxKnownStar) : maxKnownStar;
      const availableSoulByTitanId = /* @__PURE__ */ new Map();
      const evolutions = [];
      const summary = /* @__PURE__ */ new Map();
      selectedTitanIdSet.forEach((titanId) => {
        const titanData = ownedTitans?.[titanId];
        if (!titanData || targetStar <= 0) {
          return;
        }
        let currentStar = getTitanStarCount(titanData);
        if (currentStar >= targetStar) {
          return;
        }
        let soulAmount = getTitanSoulAmount(inventory, titanId);
        availableSoulByTitanId.set(titanId, soulAmount);
        while (currentStar < targetStar) {
          const nextStar = currentStar + 1;
          const cost = getTitanEvolutionCost(nextStar);
          if (cost <= 0 || soulAmount < cost) {
            break;
          }
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
    }
    function buildTitanLevelPlan(selectedTitanIds, ownedTitans, potionAmount, reserveAmount, maxTitanLevel, maxUpgradeCount = void 0) {
      const candidates = [];
      const normalizedMaxTitanLevel = Math.max(0, Number(maxTitanLevel) || 0);
      selectedTitanIds.forEach((titanId) => {
        const titanLevel = Math.max(0, Number(ownedTitans?.[titanId]?.level) || 0);
        if (normalizedMaxTitanLevel > 0 && titanLevel >= normalizedMaxTitanLevel) {
          return;
        }
        const cost = getTitanLevelUpCost(titanLevel);
        if (!cost) {
          return;
        }
        candidates.push({
          titanId,
          titanName: getTitanName(titanId),
          currentLevel: titanLevel,
          nextLevel: titanLevel + 1,
          cost
        });
      });
      const queue = [];
      const summary = /* @__PURE__ */ new Map();
      const totalPotionAmount = Math.max(0, Number(potionAmount) || 0);
      const normalizedReserveAmount = Math.max(0, Number(reserveAmount) || 0);
      let potionLeft = Math.max(0, totalPotionAmount - normalizedReserveAmount);
      const normalizedMaxUpgradeCount = Number.isFinite(Number(maxUpgradeCount)) ? Math.max(0, Math.floor(Number(maxUpgradeCount))) : Number.POSITIVE_INFINITY;
      while (candidates.length > 0 && queue.length < normalizedMaxUpgradeCount) {
        const cheapestCandidateIndex = pickCheapestTitanLevelCandidateIndex(candidates);
        if (cheapestCandidateIndex < 0) {
          break;
        }
        const candidate = candidates[cheapestCandidateIndex];
        if (candidate.cost > potionLeft) {
          break;
        }
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
        if (normalizedMaxTitanLevel > 0 && candidate.currentLevel >= normalizedMaxTitanLevel) {
          candidates.splice(cheapestCandidateIndex, 1);
          continue;
        }
        candidate.nextLevel += 1;
        const nextCost = getTitanLevelUpCost(candidate.currentLevel);
        if (!nextCost) {
          candidates.splice(cheapestCandidateIndex, 1);
          continue;
        }
        candidate.cost = nextCost;
      }
      const spentAmount = Math.max(0, totalPotionAmount - normalizedReserveAmount) - potionLeft;
      return {
        queue,
        summary,
        spentAmount,
        leftAmount: Math.max(0, totalPotionAmount - spentAmount)
      };
    }
    function buildTitanLevelSummaryRows(summaryMap) {
      if (!summaryMap || summaryMap.size <= 0) {
        return [translate("HWHTITANLVL_SUMMARY_EMPTY")];
      }
      return [...summaryMap.values()].map(
        (entry) => `+ ${escapeHtml$1(entry.titanName)} ${escapeHtml$1(String(entry.startLevel))}→${escapeHtml$1(String(entry.endLevel))} (+${escapeHtml$1(String(entry.count))})`
      );
    }
    function buildTitanEvolutionSummaryRows(summaryMap) {
      if (!summaryMap || summaryMap.size <= 0) {
        return [translate("HWHTITANLVL_SUMMARY_EMPTY_EVOLUTIONS")];
      }
      return [...summaryMap.values()].map(
        (entry) => `★ ${escapeHtml$1(entry.titanName)} ${escapeHtml$1(String(entry.startStar))}→${escapeHtml$1(String(entry.endStar))} (+${escapeHtml$1(String(entry.count))})`
      );
    }
    function buildResultAccordionHtml(title, iconName, rows, tone = "technical") {
      const safeRows = (rows ?? []).filter((row) => String(row ?? "").trim() !== "");
      const bodyMarkup = safeRows.map((row) => `<div class="hwhx-line">${row}</div>`).join("");
      return `<details class="hwhx-result-accordion" data-tone="${escapeHtml$1(tone)}" open><summary><span class="hwhx-result-accordion__title"><span class="hwhx-result-accordion__arrow">▸</span>${buildInlineIcon(iconName)}<span>${escapeHtml$1(title)}</span></span><span class="hwhx-result-accordion__count">${escapeHtml$1(formatNumber$1(safeRows.length))}</span></summary><div class="hwhx-result-accordion__body">${bodyMarkup}</div></details>`;
    }
    function buildTitanSkinSummaryRows(summaryMap) {
      if (!summaryMap || summaryMap.size <= 0) {
        return [translate("HWHTITANSKIN_SUMMARY_EMPTY")];
      }
      return [...summaryMap.values()].map(
        (entry) => `+ ${escapeHtml$1(entry.titanName)} · ${escapeHtml$1(entry.skinName)} ${escapeHtml$1(String(entry.startLevel))}→${escapeHtml$1(String(entry.endLevel))} (+${escapeHtml$1(String(entry.count))})`
      );
    }
    function buildFinalTitanLevelSummaryHtml(plan, resourceName, errorMessage = "") {
      const lines = [];
      if (errorMessage) {
        lines.push(escapeHtml$1(errorMessage));
      }
      lines.push(
        buildResultAccordionHtml(
          translate("HWHTITANLVL_SUMMARY_LEVELS"),
          "arrow-up",
          buildTitanLevelSummaryRows(plan?.summary),
          "farm"
        )
      );
      if (plan?.evolutionSummary?.size > 0) {
        lines.push(
          buildResultAccordionHtml(
            translate("HWHTITANLVL_SUMMARY_EVOLUTIONS"),
            "sparkles",
            buildTitanEvolutionSummaryRows(plan?.evolutionSummary),
            "craft"
          )
        );
      }
      lines.push(
        buildResultAccordionHtml(
          translate("HWHTITANLVL_SUMMARY_SPENT"),
          "flask",
          [
            escapeHtml$1(
              translate("HWHTITANLVL_SUMMARY_RESOURCE", {
                resourceName,
                spentAmount: formatNumber$1(plan?.spentAmount),
                leftAmount: formatNumber$1(plan?.leftAmount)
              })
            )
          ],
          "technical"
        )
      );
      return lines.join("<br>");
    }
    function buildFinalTitanSkinSummaryHtml(plan, resourceName, errorMessage = "") {
      const lines = [];
      if (errorMessage) {
        lines.push(escapeHtml$1(errorMessage));
      }
      lines.push(
        buildResultAccordionHtml(
          translate("HWHTITANSKIN_SUMMARY_SKINS"),
          "shirt",
          buildTitanSkinSummaryRows(plan?.summary),
          "farm"
        )
      );
      lines.push(
        buildResultAccordionHtml(
          translate("HWHTITANSKIN_SUMMARY_SPENT"),
          "coins",
          [
            escapeHtml$1(
              translate("HWHTITANSKIN_SUMMARY_RESOURCE", {
                resourceName,
                spentAmount: formatNumber$1(plan?.spentAmount),
                leftAmount: formatNumber$1(plan?.leftAmount)
              })
            )
          ],
          "technical"
        )
      );
      return lines.join("<br>");
    }
    function buildUpgradeSummaryRows(summaryMap) {
      if (!summaryMap || summaryMap.size <= 0) {
        return [translate("HWHTITANART_SUMMARY_EMPTY")];
      }
      return [...summaryMap.values()].map(
        (entry) => `+ ${escapeHtml$1(entry.titanName)} · ${escapeHtml$1(entry.artifactLabel)} ${escapeHtml$1(String(entry.startLevel))}→${escapeHtml$1(String(entry.endLevel))} (+${escapeHtml$1(String(entry.count))})`
      );
    }
    function buildArtifactEvolutionSummaryRows(summaryMap) {
      if (!summaryMap || summaryMap.size <= 0) {
        return [translate("HWHTITANART_SUMMARY_EMPTY_EVOLUTIONS")];
      }
      return [...summaryMap.values()].map(
        (entry) => `★ ${escapeHtml$1(entry.titanName)} · ${escapeHtml$1(entry.artifactLabel)} ${escapeHtml$1(String(entry.startStar))}→${escapeHtml$1(String(entry.endStar))} (+${escapeHtml$1(String(entry.count))})`
      );
    }
    function buildArtifactFragmentPurchaseSummaryRows(summaryMap) {
      if (!summaryMap || summaryMap.size <= 0) {
        return [translate("HWHTITANART_SUMMARY_EMPTY_PURCHASES")];
      }
      return [...summaryMap.values()].map(
        (entry) => `+ ${escapeHtml$1(entry.artifactName)}: ${escapeHtml$1(formatNumber$1(entry.amount))} [${escapeHtml$1(formatNumber$1(entry.coinSpentAmount))}]`
      );
    }
    function buildFinalSummaryHtml(plan, resourceName, errorMessage = "", goldResourceName = getGoldResourceName()) {
      const lines = [];
      if (errorMessage) {
        lines.push(escapeHtml$1(errorMessage));
      }
      lines.push(
        buildResultAccordionHtml(
          translate("HWHTITANART_SUMMARY_UPGRADES"),
          "hammer",
          buildUpgradeSummaryRows(plan?.summary),
          "farm"
        )
      );
      if (plan?.evolutionSummary?.size > 0 || plan?.purchaseSummary?.size > 0) {
        lines.push(
          buildResultAccordionHtml(
            translate("HWHTITANART_SUMMARY_EVOLUTIONS"),
            "sparkles",
            buildArtifactEvolutionSummaryRows(plan?.evolutionSummary),
            "craft"
          )
        );
        lines.push(
          buildResultAccordionHtml(
            translate("HWHTITANART_SUMMARY_PURCHASES"),
            "shopping-bag",
            buildArtifactFragmentPurchaseSummaryRows(plan?.purchaseSummary),
            "shop"
          )
        );
      }
      const spentRows = [
        escapeHtml$1(
          translate("HWHTITANART_SUMMARY_RESOURCE", {
            resourceName,
            spentAmount: formatNumber$1(plan?.spentAmount),
            leftAmount: formatNumber$1(plan?.leftAmount)
          })
        )
      ];
      if (plan?.usesGoldBudget || Number(plan?.goldSpentAmount) > 0) {
        spentRows.push(
          escapeHtml$1(
            translate("HWHTITANART_SUMMARY_RESOURCE", {
              resourceName: goldResourceName,
              spentAmount: formatNumber$1(plan?.goldSpentAmount),
              leftAmount: formatNumber$1(plan?.goldLeftAmount)
            })
          )
        );
      }
      if (Number(plan?.fragmentCoinSpentAmount) > 0) {
        spentRows.push(
          escapeHtml$1(
            translate("HWHTITANART_SUMMARY_RESOURCE", {
              resourceName: getTitanArtifactFragmentCoinResourceName(),
              spentAmount: formatNumber$1(plan?.fragmentCoinSpentAmount),
              leftAmount: formatNumber$1(plan?.fragmentCoinLeftAmount)
            })
          )
        );
      }
      lines.push(
        buildResultAccordionHtml(
          translate("HWHTITANART_SUMMARY_SPENT"),
          "flask",
          spentRows,
          "technical"
        )
      );
      return lines.join("<br>");
    }
    async function runTitanArtifactLeveling(settings, ownedTitans, inventory, userInfo = {}, options = void 0) {
      const sanitizedTitanIds = sanitizeSelectedTitanIds(
        settings.selectedTitanIds,
        ownedTitans
      );
      const selectedArtifactSlotIds = [
        ...new Set(settings.selectedArtifactSlotIds ?? [0, 1])
      ].map((slotId) => Number(slotId)).filter((slotId) => ARTIFACT_SLOT_ID_SET.has(slotId));
      if (sanitizedTitanIds.length <= 0) {
        showFinalProgress(translate("HWHTITANART_SELECT_TITANS_FIRST"));
        return;
      }
      const resourceName = getArtifactResourceName();
      const goldResourceName = getGoldResourceName();
      const resourceAmount = getResourceAmount(inventory);
      const goldAmount = getGoldAmount(userInfo);
      const fragmentCoinAmount = getTitanArtifactFragmentCoinAmount(inventory);
      const buyArtifactFragments = !!settings.buyArtifactFragments && !(options?.source === "checklist" && normalizeChecklistFragmentPurchaseBehavior(
        settings?.checklistFragmentPurchaseBehavior
      ) === CHECKLIST_FRAGMENT_BEHAVIOR_SKIP);
      logArtifactFragmentDebug("artifact run started", {
        buyArtifactFragments,
        evolveArtifacts: !!settings.evolveArtifacts,
        selectedTitanIds: sanitizedTitanIds,
        selectedArtifactSlotIds,
        selectedArtifactEvolutionKeys: settings.evolveArtifacts ? settings.selectedArtifactEvolutionKeys : [],
        selectedArtifactFragmentBuyKeys: settings.selectedArtifactFragmentBuyKeys,
        artifactEvolutionMaxStar: settings.artifactEvolutionMaxStar,
        fragmentCoinAmount,
        artifactFragmentCoinReserve: settings.artifactFragmentCoinReserve,
        coinBudget: Math.max(
          0,
          fragmentCoinAmount - Math.max(0, Number(settings.artifactFragmentCoinReserve) || 0)
        )
      });
      showProgressMessage(translate("HWHTITANART_PROGRESS_PLAN"));
      let fragmentShopData = {};
      if (buyArtifactFragments) {
        showProgressMessage(translate("HWHTITANART_PROGRESS_SHOP"));
        try {
          fragmentShopData = await fetchTitanArtifactFragmentShop();
          logArtifactFragmentDebug("shop loaded", {
            rawShopSlotCount: Object.keys(fragmentShopData?.slots ?? {}).length,
            parsedShopSlots: getArtifactFragmentShopSlots(fragmentShopData).map(
              (slot) => summarizeArtifactFragmentShopSlot(slot)
            )
          });
        } catch (error) {
          logArtifactFragmentDebug("shop load failed", { error });
          throw error;
        }
      }
      const fragmentDebugEntries = [];
      const shouldProcessArtifactEvolution = settings.evolveArtifacts || buyArtifactFragments;
      const evolutionPlan = shouldProcessArtifactEvolution ? buildArtifactEvolutionPlan({
        selectedTitanIds: sanitizedTitanIds,
        ownedTitans,
        inventory,
        shopData: fragmentShopData,
        coinAmount: fragmentCoinAmount,
        coinReserveAmount: settings.artifactFragmentCoinReserve,
        selectedArtifactEvolutionKeys: settings.evolveArtifacts ? settings.selectedArtifactEvolutionKeys : [],
        selectedArtifactFragmentBuyKeys: settings.selectedArtifactFragmentBuyKeys,
        maxArtifactStar: settings.artifactEvolutionMaxStar,
        buyMissingFragments: buyArtifactFragments,
        maxOperationCount: options?.maxUpgradeCount,
        debugEntries: fragmentDebugEntries
      }) : {
        fragmentPurchases: [],
        evolutions: [],
        purchaseSummary: /* @__PURE__ */ new Map(),
        evolutionSummary: /* @__PURE__ */ new Map(),
        coinSpentAmount: 0,
        coinLeftAmount: fragmentCoinAmount
      };
      const remainingUpgradeCount = Number.isFinite(Number(options?.maxUpgradeCount)) ? Math.max(
        0,
        Math.floor(Number(options.maxUpgradeCount)) - evolutionPlan.fragmentPurchases.length - evolutionPlan.evolutions.length
      ) : void 0;
      if (buyArtifactFragments) {
        logArtifactFragmentDebug("plan diagnostics", {
          settings: {
            buyArtifactFragments,
            evolveArtifacts: !!settings.evolveArtifacts,
            selectedTitanIds: sanitizedTitanIds,
            selectedArtifactEvolutionKeys: settings.evolveArtifacts ? settings.selectedArtifactEvolutionKeys : [],
            selectedArtifactFragmentBuyKeys: settings.selectedArtifactFragmentBuyKeys,
            artifactEvolutionMaxStar: settings.artifactEvolutionMaxStar,
            artifactFragmentCoinReserve: settings.artifactFragmentCoinReserve
          },
          fragmentCoinAmount,
          coinBudget: Math.max(
            0,
            fragmentCoinAmount - Math.max(0, Number(settings.artifactFragmentCoinReserve) || 0)
          ),
          rawShopSlotCount: Object.keys(fragmentShopData?.slots ?? {}).length,
          parsedShopSlots: getArtifactFragmentShopSlots(fragmentShopData).map(
            (slot) => summarizeArtifactFragmentShopSlot(slot)
          ),
          plannedPurchases: evolutionPlan.fragmentPurchases.map(
            (purchaseStep) => summarizeArtifactFragmentPurchase(purchaseStep)
          ),
          plannedEvolutions: evolutionPlan.evolutions.map((evolutionStep) => ({
            titanId: evolutionStep.titanId,
            titanName: evolutionStep.titanName,
            slotId: evolutionStep.slotId,
            artifactId: evolutionStep.artifactId,
            artifactName: evolutionStep.artifactName,
            fromStar: evolutionStep.fromStar,
            toStar: evolutionStep.toStar,
            fragmentCost: evolutionStep.fragmentCost
          })),
          debugEntries: fragmentDebugEntries
        });
        if (evolutionPlan.fragmentPurchases.length <= 0) {
          logArtifactFragmentDebug("no fragment purchases planned", {
            reason: "planner-returned-empty-purchase-list",
            debugEntries: fragmentDebugEntries
          });
        }
      }
      const plan = buildUpgradePlan(
        sanitizedTitanIds,
        selectedArtifactSlotIds,
        settings.artifactLevelCaps,
        ownedTitans,
        resourceAmount,
        settings.essenceReserve,
        goldAmount,
        settings.artifactGoldReserve,
        remainingUpgradeCount
      );
      if (plan.queue.length <= 0 && evolutionPlan.evolutions.length <= 0 && evolutionPlan.fragmentPurchases.length <= 0) {
        showFinalProgress(translate("HWHTITANART_NOTHING_TO_LEVEL"));
        return;
      }
      const executedPlan = {
        summary: /* @__PURE__ */ new Map(),
        evolutionSummary: /* @__PURE__ */ new Map(),
        purchaseSummary: /* @__PURE__ */ new Map(),
        spentAmount: 0,
        leftAmount: resourceAmount,
        goldSpentAmount: 0,
        goldLeftAmount: goldAmount,
        fragmentCoinSpentAmount: 0,
        fragmentCoinLeftAmount: fragmentCoinAmount,
        usesGoldBudget: plan.usesGoldBudget
      };
      try {
        const purchaseCalls = evolutionPlan.fragmentPurchases.map((step, index) => ({
          name: "shopBuy",
          args: {
            shopId: step.shopId,
            slot: step.slotId,
            cost: step.cost,
            reward: step.reward,
            amount: step.purchaseCount ?? step.amount
          },
          ident: `shopBuyTitanArtifactFragment_${step.artifactId}_${index}`
        }));
        if (buyArtifactFragments) {
          logArtifactFragmentDebug(
            "purchase calls",
            purchaseCalls.map((purchaseCall, index) => ({
              index,
              purchase: summarizeArtifactFragmentPurchase(
                evolutionPlan.fragmentPurchases[index]
              ),
              call: purchaseCall
            }))
          );
        }
        const purchaseResults = await sendCallsInChunks(
          purchaseCalls,
          TITAN_UPGRADE_REQUEST_CHUNK_SIZE,
          async ({ chunkStart, chunkEnd }) => {
            const step = evolutionPlan.fragmentPurchases[chunkStart - 1];
            if (!step) {
              return;
            }
            showProgressMessage(
              `${escapeHtml$1(
                translate("HWHTITANART_PROGRESS_BUY_FRAGMENT", {
                  artifactName: step.artifactName,
                  amount: formatNumber$1(step.amount)
                })
              )}<br>${buildIconLabel(
                "activity",
                `${formatNumber$1(chunkStart)}-${formatNumber$1(chunkEnd)}/${formatNumber$1(evolutionPlan.fragmentPurchases.length)}`
              )}`
            );
          }
        );
        for (let index = 0; index < purchaseResults.length; index += 1) {
          const resultError = purchaseResults[index]?.error;
          if (buyArtifactFragments) {
            logArtifactFragmentDebug("purchase result", {
              index,
              purchase: summarizeArtifactFragmentPurchase(
                evolutionPlan.fragmentPurchases[index]
              ),
              result: purchaseResults[index]
            });
          }
          if (resultError) {
            throw new Error(
              resultError.description || translate("HWHTITANART_ERROR_GENERIC")
            );
          }
          const step = evolutionPlan.fragmentPurchases[index];
          appendArtifactFragmentPurchaseSummaryEntry(executedPlan.purchaseSummary, step);
          executedPlan.fragmentCoinSpentAmount += Number(step.coinSpentAmount) || step.coinCost * (step.purchaseCount ?? step.amount);
          executedPlan.fragmentCoinLeftAmount = Math.max(
            0,
            fragmentCoinAmount - executedPlan.fragmentCoinSpentAmount
          );
        }
        const evolutionCalls = evolutionPlan.evolutions.map((step, index) => ({
          name: "titanArtifactEvolve",
          args: {
            titanId: step.titanId,
            slotId: step.slotId
          },
          ident: `titanArtifactEvolve_${step.titanId}_${step.slotId}_${index}`
        }));
        const evolutionResults = await sendCallsInChunks(
          evolutionCalls,
          TITAN_UPGRADE_REQUEST_CHUNK_SIZE,
          async ({ chunkStart, chunkEnd }) => {
            const step = evolutionPlan.evolutions[chunkStart - 1];
            if (!step) {
              return;
            }
            showProgressMessage(
              `${escapeHtml$1(
                translate("HWHTITANART_PROGRESS_EVOLVE", {
                  titanName: step.titanName,
                  slot: step.artifactLabel,
                  fromStar: String(step.fromStar),
                  toStar: String(step.toStar)
                })
              )}<br>${buildIconLabel(
                "activity",
                `${formatNumber$1(chunkStart)}-${formatNumber$1(chunkEnd)}/${formatNumber$1(evolutionPlan.evolutions.length)}`
              )}`
            );
          }
        );
        for (let index = 0; index < evolutionResults.length; index += 1) {
          const resultError = evolutionResults[index]?.error;
          if (resultError) {
            throw new Error(
              resultError.description || translate("HWHTITANART_ERROR_GENERIC")
            );
          }
          appendArtifactEvolutionSummaryEntry(
            executedPlan.evolutionSummary,
            evolutionPlan.evolutions[index]
          );
        }
        const upgradeCalls = plan.queue.map((step, index) => ({
          name: "titanArtifactLevelUp",
          args: {
            titanId: step.titanId,
            slotId: step.slotId
          },
          ident: `titanArtifactLevelUp_${step.titanId}_${step.slotId}_${index}`
        }));
        const upgradeResults = await sendCallsInChunks(
          upgradeCalls,
          TITAN_UPGRADE_REQUEST_CHUNK_SIZE,
          async ({ chunkStart, chunkEnd }) => {
            const step = plan.queue[chunkStart - 1];
            if (!step) {
              return;
            }
            const spentParts = [
              buildIconLabel(
                "flask",
                `-${formatNumber$1(executedPlan.spentAmount)} (${formatNumber$1(executedPlan.leftAmount)})`
              )
            ];
            if (plan.usesGoldBudget) {
              spentParts.push(
                buildIconLabel(
                  "coins",
                  `-${formatNumber$1(executedPlan.goldSpentAmount)} (${formatNumber$1(executedPlan.goldLeftAmount)})`,
                  "hwhx-gold"
                )
              );
            }
            showProgressMessage(
              `${escapeHtml$1(
                translate("HWHTITANART_PROGRESS_UPGRADE", {
                  titanName: step.titanName,
                  slot: step.artifactLabel,
                  fromLevel: String(step.fromLevel),
                  toLevel: String(step.toLevel)
                })
              )}<br>${spentParts.join("<br>")}<br>${buildIconLabel(
                "activity",
                `${formatNumber$1(chunkStart)}-${formatNumber$1(chunkEnd)}/${formatNumber$1(plan.queue.length)}`
              )}`
            );
          }
        );
        for (let index = 0; index < upgradeResults.length; index += 1) {
          const step = plan.queue[index];
          showProgressMessage(
            `${escapeHtml$1(
              translate("HWHTITANART_PROGRESS_UPGRADE", {
                titanName: step.titanName,
                slot: step.artifactLabel,
                fromLevel: String(step.fromLevel),
                toLevel: String(step.toLevel)
              })
            )}<br>${buildIconLabel(
              "activity",
              `${formatNumber$1(index + 1)}/${formatNumber$1(plan.queue.length)}`
            )}`
          );
          const resultError = upgradeResults[index]?.error;
          if (resultError) {
            throw new Error(
              resultError.description || translate("HWHTITANART_ERROR_GENERIC")
            );
          }
          appendUpgradeSummaryEntry(executedPlan.summary, step);
          executedPlan.spentAmount += step.resourceCost;
          executedPlan.leftAmount = Math.max(
            0,
            resourceAmount - executedPlan.spentAmount
          );
          executedPlan.goldSpentAmount += step.goldCost;
          executedPlan.goldLeftAmount = Math.max(
            0,
            goldAmount - executedPlan.goldSpentAmount
          );
        }
      } catch (error) {
        if (buyArtifactFragments) {
          logArtifactFragmentDebug("run failed", {
            error,
            plannedPurchases: evolutionPlan.fragmentPurchases.map(
              (purchaseStep) => summarizeArtifactFragmentPurchase(purchaseStep)
            ),
            debugEntries: fragmentDebugEntries
          });
        }
        console.error("[TitanArtifact] Error:", error);
        showFinalProgress(
          buildFinalSummaryHtml(
            executedPlan,
            resourceName,
            `${translate("HWHTITANART_PROGRESS_ERROR")} ${error?.message || translate("HWHTITANART_ERROR_GENERIC")}`,
            goldResourceName
          )
        );
        return;
      }
      await refreshTitanSnapshotAfterRun();
      showFinalProgress(
        `${escapeHtml$1(
          translate("HWHTITANART_PROGRESS_DONE", {
            count: formatNumber$1(
              plan.queue.length + evolutionPlan.evolutions.length + evolutionPlan.fragmentPurchases.length
            )
          })
        )}<br>${buildFinalSummaryHtml(executedPlan, resourceName, "", goldResourceName)}${buildPostRunSyncMessage(settings, options)}`
      );
    }
    async function runTitanSkinLeveling(settings, ownedTitans, inventory, options = void 0) {
      const sanitizedTitanIds = sanitizeSelectedTitanIds(
        settings.selectedTitanIds,
        ownedTitans
      );
      if (sanitizedTitanIds.length <= 0) {
        showFinalProgress(translate("HWHTITANSKIN_SELECT_TITANS_FIRST"));
        return;
      }
      const resourceName = getTitanSkinResourceName();
      const skinStoneAmount = getTitanSkinStoneAmount(inventory);
      showProgressMessage(translate("HWHTITANSKIN_PROGRESS_PLAN"));
      const plan = buildTitanSkinPlan(
        sanitizedTitanIds,
        settings.selectedSkinLocaleKeys,
        settings.skinLevelCaps,
        ownedTitans,
        skinStoneAmount,
        settings.skinStoneReserve,
        options?.maxUpgradeCount
      );
      if (plan.queue.length <= 0) {
        showFinalProgress(translate("HWHTITANSKIN_NOTHING_TO_LEVEL"));
        return;
      }
      const executedPlan = {
        summary: /* @__PURE__ */ new Map(),
        spentAmount: 0,
        leftAmount: skinStoneAmount
      };
      try {
        const upgradeCalls = plan.queue.map((step, index) => ({
          name: "titanSkinUpgrade",
          args: {
            titanId: step.titanId,
            skinId: step.skinId,
            paid: false
          },
          ident: `titanSkinUpgrade_${step.titanId}_${step.skinId}_${index}`
        }));
        const upgradeResults = await sendCallsInChunks(
          upgradeCalls,
          TITAN_UPGRADE_REQUEST_CHUNK_SIZE,
          async ({ chunkStart, chunkEnd }) => {
            const step = plan.queue[chunkStart - 1];
            if (!step) {
              return;
            }
            showProgressMessage(
              `${escapeHtml$1(
                translate("HWHTITANSKIN_PROGRESS_UPGRADE", {
                  titanName: step.titanName,
                  skinName: step.name,
                  fromLevel: String(step.fromLevel),
                  toLevel: String(step.toLevel)
                })
              )}<br>${buildIconLabel(
                "coins",
                `-${formatNumber$1(executedPlan.spentAmount)} (${formatNumber$1(executedPlan.leftAmount)})`
              )}<br>${buildIconLabel(
                "activity",
                `${formatNumber$1(chunkStart)}-${formatNumber$1(chunkEnd)}/${formatNumber$1(plan.queue.length)}`
              )}`
            );
          }
        );
        for (let index = 0; index < upgradeResults.length; index += 1) {
          const step = plan.queue[index];
          showProgressMessage(
            `${escapeHtml$1(
              translate("HWHTITANSKIN_PROGRESS_UPGRADE", {
                titanName: step.titanName,
                skinName: step.name,
                fromLevel: String(step.fromLevel),
                toLevel: String(step.toLevel)
              })
            )}<br>${buildIconLabel(
              "activity",
              `${formatNumber$1(index + 1)}/${formatNumber$1(plan.queue.length)}`
            )}`
          );
          const resultError = upgradeResults[index]?.error;
          if (resultError) {
            throw new Error(
              resultError.description || translate("HWHTITANART_ERROR_GENERIC")
            );
          }
          appendTitanSkinSummaryEntry(executedPlan.summary, step);
          executedPlan.spentAmount += step.cost;
          executedPlan.leftAmount = Math.max(
            0,
            skinStoneAmount - executedPlan.spentAmount
          );
        }
      } catch (error) {
        console.error("[TitanSkin] Error:", error);
        showFinalProgress(
          buildFinalTitanSkinSummaryHtml(
            executedPlan,
            resourceName,
            `${translate("HWHTITANSKIN_PROGRESS_ERROR")} ${error?.message || translate("HWHTITANART_ERROR_GENERIC")}`
          )
        );
        return;
      }
      await refreshTitanSnapshotAfterRun();
      showFinalProgress(
        `${escapeHtml$1(
          translate("HWHTITANSKIN_PROGRESS_DONE", {
            count: formatNumber$1(plan.queue.length)
          })
        )}<br>${buildFinalTitanSkinSummaryHtml(executedPlan, resourceName)}${buildPostRunSyncMessage(settings, options)}`
      );
    }
    async function runTitanLeveling(settings, ownedTitans, inventory, options = void 0) {
      const sanitizedTitanIds = sanitizeSelectedTitanIds(
        settings.selectedTitanIds,
        ownedTitans
      );
      const sanitizedEvolutionTitanIds = sanitizeSelectedTitanIds(
        settings.selectedTitanEvolutionIds,
        ownedTitans
      );
      if (sanitizedTitanIds.length <= 0 && sanitizedEvolutionTitanIds.length <= 0) {
        showFinalProgress(translate("HWHTITANLVL_SELECT_TITANS_FIRST"));
        return;
      }
      const resourceName = getTitanXpResourceName();
      const potionAmount = getTitanXpPotionAmount(inventory);
      showProgressMessage(translate("HWHTITANLVL_PROGRESS_PLAN"));
      const evolutionPlan = buildTitanEvolutionPlan(
        sanitizedEvolutionTitanIds,
        ownedTitans,
        inventory,
        settings.titanEvolutionMaxStar
      );
      const plan = buildTitanLevelPlan(
        sanitizedTitanIds,
        ownedTitans,
        potionAmount,
        settings.potionReserve,
        settings.maxTitanLevel,
        options?.maxUpgradeCount
      );
      if (plan.queue.length <= 0 && evolutionPlan.evolutions.length <= 0) {
        showFinalProgress(translate("HWHTITANLVL_NOTHING_TO_LEVEL"));
        return;
      }
      const executedPlan = {
        summary: /* @__PURE__ */ new Map(),
        evolutionSummary: /* @__PURE__ */ new Map(),
        spentAmount: 0,
        leftAmount: potionAmount
      };
      try {
        const evolutionCalls = evolutionPlan.evolutions.map((step, index) => ({
          name: "titanEvolve",
          args: {
            titanId: step.titanId
          },
          ident: `titanEvolve_${step.titanId}_${index}`
        }));
        const evolutionResults = await sendCallsInChunks(
          evolutionCalls,
          TITAN_UPGRADE_REQUEST_CHUNK_SIZE,
          async ({ chunkStart, chunkEnd }) => {
            const step = evolutionPlan.evolutions[chunkStart - 1];
            if (!step) {
              return;
            }
            showProgressMessage(
              `${escapeHtml$1(
                translate("HWHTITANLVL_PROGRESS_EVOLVE", {
                  titanName: step.titanName,
                  fromStar: String(step.fromStar),
                  toStar: String(step.toStar)
                })
              )}<br>${buildIconLabel(
                "activity",
                `${formatNumber$1(chunkStart)}-${formatNumber$1(chunkEnd)}/${formatNumber$1(evolutionPlan.evolutions.length)}`
              )}`
            );
          }
        );
        for (let index = 0; index < evolutionResults.length; index += 1) {
          const resultError = evolutionResults[index]?.error;
          if (resultError) {
            throw new Error(
              resultError.description || translate("HWHTITANART_ERROR_GENERIC")
            );
          }
          appendTitanEvolutionSummaryEntry(
            executedPlan.evolutionSummary,
            evolutionPlan.evolutions[index]
          );
        }
        const levelCalls = plan.queue.map((step, index) => ({
          name: "consumableUseTitanXp",
          args: {
            titanId: step.titanId,
            libId: TITAN_XP_RESOURCE_CONSUMABLE_ID,
            amount: step.cost
          },
          ident: `consumableUseTitanXp_${step.titanId}_${index}`
        }));
        const levelResults = await sendCallsInChunks(
          levelCalls,
          TITAN_UPGRADE_REQUEST_CHUNK_SIZE,
          async ({ chunkStart, chunkEnd }) => {
            const step = plan.queue[chunkStart - 1];
            if (!step) {
              return;
            }
            showProgressMessage(
              `${escapeHtml$1(
                translate("HWHTITANLVL_PROGRESS_UPGRADE", {
                  titanName: step.titanName,
                  fromLevel: String(step.fromLevel),
                  toLevel: String(step.toLevel)
                })
              )}<br>${buildIconLabel(
                "flask",
                `-${formatNumber$1(executedPlan.spentAmount)} (${formatNumber$1(executedPlan.leftAmount)})`
              )}<br>${buildIconLabel(
                "activity",
                `${formatNumber$1(chunkStart)}-${formatNumber$1(chunkEnd)}/${formatNumber$1(plan.queue.length)}`
              )}`
            );
          }
        );
        for (let index = 0; index < levelResults.length; index += 1) {
          const step = plan.queue[index];
          showProgressMessage(
            `${escapeHtml$1(
              translate("HWHTITANLVL_PROGRESS_UPGRADE", {
                titanName: step.titanName,
                fromLevel: String(step.fromLevel),
                toLevel: String(step.toLevel)
              })
            )}<br>${buildIconLabel(
              "activity",
              `${formatNumber$1(index + 1)}/${formatNumber$1(plan.queue.length)}`
            )}`
          );
          const resultError = levelResults[index]?.error;
          if (resultError) {
            throw new Error(
              resultError.description || translate("HWHTITANART_ERROR_GENERIC")
            );
          }
          appendTitanLevelSummaryEntry(executedPlan.summary, step);
          executedPlan.spentAmount += step.cost;
          executedPlan.leftAmount = Math.max(0, potionAmount - executedPlan.spentAmount);
        }
      } catch (error) {
        console.error("[TitanLevel] Error:", error);
        showFinalProgress(
          buildFinalTitanLevelSummaryHtml(
            executedPlan,
            resourceName,
            `${translate("HWHTITANLVL_PROGRESS_ERROR")} ${error?.message || translate("HWHTITANART_ERROR_GENERIC")}`
          )
        );
        return;
      }
      await refreshTitanSnapshotAfterRun();
      showFinalProgress(
        `${escapeHtml$1(
          translate("HWHTITANLVL_PROGRESS_DONE", {
            count: formatNumber$1(plan.queue.length + evolutionPlan.evolutions.length)
          })
        )}<br>${buildFinalTitanLevelSummaryHtml(executedPlan, resourceName)}${buildPostRunSyncMessage(settings, options)}`
      );
    }
    async function writeAllTrainerSettings(artifactSettings, levelSettings, skinSettings) {
      await writeSettings(artifactSettings);
      await writeLevelSettings(levelSettings);
      await writeSkinSettings(skinSettings);
    }
    async function openTitanTrainerMenu() {
      await ensureGameRuntimeReady();
      let artifactSettings = await readSettings();
      let levelSettings = await readLevelSettings();
      let skinSettings = await readSkinSettings();
      let activeTab = TITAN_TRAINER_TAB_ARTIFACTS;
      while (true) {
        const snapshot = await fetchTitanSnapshot(true, true);
        const skinGroups = getTitanSkinGroups();
        artifactSettings = normalizeSettings({
          ...artifactSettings,
          selectedTitanIds: sanitizeSelectedTitanIds(
            artifactSettings.selectedTitanIds,
            snapshot.titans
          )
        });
        levelSettings = normalizeLevelSettings({
          ...levelSettings,
          selectedTitanIds: sanitizeSelectedTitanIds(
            levelSettings.selectedTitanIds,
            snapshot.titans
          ),
          selectedTitanEvolutionIds: sanitizeSelectedTitanIds(
            levelSettings.selectedTitanEvolutionIds,
            snapshot.titans
          )
        });
        skinSettings = normalizeSkinSettings({
          ...skinSettings,
          selectedTitanIds: sanitizeSelectedTitanIds(
            skinSettings.selectedTitanIds,
            snapshot.titans
          )
        });
        const artifactTitanOptions = buildTitanOptions(snapshot.titans, artifactSettings);
        const levelTitanOptions = buildTitanLevelOptions(
          snapshot.titans,
          levelSettings,
          snapshot.inventory
        );
        const skinTitanOptions = buildTitanSkinOptions(snapshot.titans, skinSettings);
        const modalActions = [
          {
            result: "clearAll",
            label: translate("HWHTITANART_CLEAR_ALL"),
            icon: "trash-2",
            tone: "graphite",
            closeOnClick: false
          },
          {
            result: "selectAll",
            label: translate("HWHTITANART_SELECT_ALL"),
            icon: "check",
            tone: "green",
            closeOnClick: false
          },
          {
            result: "saveSettings",
            label: translate("HWHTITANART_SAVE_SETTINGS"),
            icon: "save",
            tone: "graphite"
          },
          {
            result: "run",
            label: translate("HWHTITANTRAINER_RUN_ACTIVE"),
            icon: "play",
            tone: "blue"
          }
        ];
        const modal = openTitanNativePopup({
          popupKind: "titan-trainer",
          title: getTitanTrainerTitleText(),
          bodyHtml: buildTitanTrainerTabsHtml({
            activeTab,
            artifactSettings,
            levelSettings,
            skinSettings,
            artifactTitanOptions,
            levelTitanOptions,
            skinTitanOptions,
            ownedTitans: snapshot.titans,
            inventory: snapshot.inventory,
            userInfo: snapshot.userInfo,
            skinGroups
          }),
          actions: modalActions
        });
        await bindTitanAccordionUi(modal.bodyNode);
        modal.bodyNode?.addEventListener?.("change", (event) => {
          const target = event.target;
          if (target instanceof HTMLInputElement && target.id === UI_TOOLTIPS_INPUT_ID) {
            applyTitanTrainerUiPreferences({ uiTooltipsEnabled: target.checked });
          }
        });
        bindTitanCostCalculator(modal.bodyNode, "artifact", {
          titanOptions: artifactTitanOptions,
          resourceAmount: getResourceAmount(snapshot.inventory),
          goldAmount: getGoldAmount(snapshot.userInfo)
        });
        bindTitanCostCalculator(modal.bodyNode, "level", {
          titanOptions: levelTitanOptions,
          potionAmount: getTitanXpPotionAmount(snapshot.inventory)
        });
        bindTitanCostCalculator(modal.bodyNode, "skin", {
          titanOptions: skinTitanOptions,
          skinGroups,
          skinStoneAmount: getTitanSkinStoneAmount(snapshot.inventory)
        });
        bindTitanTrainerLiveSelection(modal.bodyNode, modal.modal?.root, {
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
        const answer = await modal.answerPromise;
        if (!answer) {
          return;
        }
        activeTab = readTrainerActiveTab(modal.bodyNode, activeTab);
        const nextSettings = readTrainerPopupSettings({
          rootNode: modal.bodyNode,
          artifactTitanOptions,
          levelTitanOptions,
          skinTitanOptions,
          skinGroups,
          artifactSettings,
          levelSettings,
          skinSettings
        });
        artifactSettings = nextSettings.artifactSettings;
        levelSettings = nextSettings.levelSettings;
        skinSettings = nextSettings.skinSettings;
        if (activeTab === TITAN_TRAINER_TAB_GENERAL && ["selectAll", "clearAll", "run"].includes(answer)) {
          await writeAllTrainerSettings(artifactSettings, levelSettings, skinSettings);
          continue;
        }
        if (answer === "selectAll") {
          if (activeTab === TITAN_TRAINER_TAB_LEVELS) {
            levelSettings = normalizeLevelSettings({
              ...levelSettings,
              selectedTitanIds: levelTitanOptions.filter((titanOption) => titanOption.owned).map((titanOption) => titanOption.id)
            });
          } else if (activeTab === TITAN_TRAINER_TAB_SKINS) {
            skinSettings = normalizeSkinSettings({
              ...skinSettings,
              selectedTitanIds: skinTitanOptions.filter((titanOption) => titanOption.owned).map((titanOption) => titanOption.id)
            });
          } else {
            artifactSettings = normalizeSettings({
              ...artifactSettings,
              selectedTitanIds: artifactTitanOptions.filter((titanOption) => titanOption.owned).map((titanOption) => titanOption.id)
            });
          }
          await writeAllTrainerSettings(artifactSettings, levelSettings, skinSettings);
          continue;
        }
        if (answer === "clearAll") {
          if (activeTab === TITAN_TRAINER_TAB_LEVELS) {
            levelSettings = normalizeLevelSettings({
              ...levelSettings,
              selectedTitanIds: []
            });
          } else if (activeTab === TITAN_TRAINER_TAB_SKINS) {
            skinSettings = normalizeSkinSettings({
              ...skinSettings,
              selectedTitanIds: []
            });
          } else {
            artifactSettings = normalizeSettings({
              ...artifactSettings,
              selectedTitanIds: []
            });
          }
          await writeAllTrainerSettings(artifactSettings, levelSettings, skinSettings);
          continue;
        }
        if (answer === "saveSettings") {
          await writeAllTrainerSettings(artifactSettings, levelSettings, skinSettings);
          continue;
        }
        if (answer === "exportSettings") {
          await writeAllTrainerSettings(artifactSettings, levelSettings, skinSettings);
          await exportSettingsToJson();
          continue;
        }
        if (answer === "importSettings") {
          try {
            if (await importSettingsFromJson()) {
              artifactSettings = await readSettings();
              levelSettings = await readLevelSettings();
              skinSettings = await readSkinSettings();
            }
          } catch (error) {
            const message = error?.message || translate("HWHTITANART_ERROR_GENERIC");
            console.error("[TitanTrainer] import failed", error);
            showSettingsNotice(
              translate("HWHTITANTRAINER_SETTINGS_IMPORT_ERROR", { message }),
              "alert-triangle",
              "hwhx-danger"
            );
          }
          continue;
        }
        if (answer === "feedback") {
          await writeAllTrainerSettings(artifactSettings, levelSettings, skinSettings);
          openExternalUrl(FEEDBACK_URL);
          continue;
        }
        if (answer === "whatsNew") {
          await writeAllTrainerSettings(artifactSettings, levelSettings, skinSettings);
          openExternalUrl(TITAN_TRAINER_VERSIONS_URL);
          continue;
        }
        if (answer === "run") {
          await writeAllTrainerSettings(artifactSettings, levelSettings, skinSettings);
          if (activeTab === TITAN_TRAINER_TAB_LEVELS) {
            const runOptions2 = await resolveLevelingRunOptions(levelSettings);
            if (!runOptions2.confirmed) {
              continue;
            }
            await runTitanLeveling(
              levelSettings,
              snapshot.titans,
              snapshot.inventory,
              runOptions2.options
            );
            return;
          }
          if (activeTab === TITAN_TRAINER_TAB_SKINS) {
            const runOptions2 = await resolveLevelingRunOptions(skinSettings);
            if (!runOptions2.confirmed) {
              continue;
            }
            await runTitanSkinLeveling(
              skinSettings,
              snapshot.titans,
              snapshot.inventory,
              runOptions2.options
            );
            return;
          }
          const runOptions = await resolveLevelingRunOptions(artifactSettings);
          if (!runOptions.confirmed) {
            continue;
          }
          await runTitanArtifactLeveling(
            artifactSettings,
            snapshot.titans,
            snapshot.inventory,
            snapshot.userInfo,
            runOptions.options
          );
          return;
        }
      }
    }
    async function runTitanArtifactChecklistTask() {
      const settings = await readSettings();
      const runOptions = await resolveLevelingRunOptions(settings, {
        source: "checklist"
      });
      if (!runOptions.confirmed) {
        return;
      }
      const snapshot = await fetchTitanSnapshot(true, true);
      await runTitanArtifactLeveling(
        settings,
        snapshot.titans,
        snapshot.inventory,
        snapshot.userInfo,
        runOptions.options
      );
    }
    async function runTitanLevelChecklistTask() {
      const settings = await readLevelSettings();
      const runOptions = await resolveLevelingRunOptions(settings, {
        source: "checklist"
      });
      if (!runOptions.confirmed) {
        return;
      }
      const snapshot = await fetchTitanSnapshot(true);
      await runTitanLeveling(
        settings,
        snapshot.titans,
        snapshot.inventory,
        runOptions.options
      );
    }
    async function runTitanSkinChecklistTask() {
      const settings = await readSkinSettings();
      const runOptions = await resolveLevelingRunOptions(settings, {
        source: "checklist"
      });
      if (!runOptions.confirmed) {
        return;
      }
      const snapshot = await fetchTitanSnapshot(true);
      await runTitanSkinLeveling(
        settings,
        snapshot.titans,
        snapshot.inventory,
        runOptions.options
      );
    }
    function registerDoYourBestTitanTasks() {
      const DoYourBestClass = HWHClasses?.doYourBest;
      if (typeof DoYourBestClass !== "function") {
        return;
      }
      const RootDoYourBestClass = getDoYourBestRootBaseClass(DoYourBestClass);
      const doYourBestInstance = new DoYourBestClass();
      const currentTaskList = Array.isArray(doYourBestInstance.funcList) ? [...doYourBestInstance.funcList] : [];
      const taskDefinitions = [
        {
          moduleKey: TITAN_TRAINER_TAB_LEVELS,
          name: DO_YOUR_BEST_TITAN_LEVEL_TASK_NAME,
          label: translate("HWHTITANART_TASK_AUTO_LEVELS"),
          handler: runTitanLevelChecklistTask
        },
        {
          moduleKey: TITAN_TRAINER_TAB_ARTIFACTS,
          name: DO_YOUR_BEST_TITAN_ARTIFACT_TASK_NAME,
          label: translate("HWHTITANART_TASK_AUTO_ARTIFACTS"),
          handler: runTitanArtifactChecklistTask
        },
        {
          moduleKey: TITAN_TRAINER_TAB_SKINS,
          name: DO_YOUR_BEST_TITAN_SKIN_TASK_NAME,
          label: translate("HWHTITANART_TASK_AUTO_SKINS"),
          handler: runTitanSkinChecklistTask
        }
      ];
      const existingTaskByName = new Map(
        currentTaskList.filter(isTitanDoYourBestTask).map((task) => [getDoYourBestTaskName(task), task])
      );
      const baseTaskList = currentTaskList.filter((task) => !isTitanDoYourBestTask(task));
      taskDefinitions.forEach((task) => {
        const placement = readStoredDoYourBestPlacementSync(task.moduleKey);
        if (placement === DO_YOUR_BEST_PLACEMENT_NONE2) {
          return;
        }
        const checklistTask = {
          name: task.name,
          label: task.label,
          checked: !!existingTaskByName.get(task.name)?.checked
        };
        let insertionIndex = getDoYourBestInsertionIndex(baseTaskList, placement, {
          allowStart: true
        });
        if (placement.startsWith(DO_YOUR_BEST_PLACEMENT_AFTER_PREFIX2)) {
          while (insertionIndex < baseTaskList.length && isTitanDoYourBestTask(baseTaskList[insertionIndex])) {
            insertionIndex += 1;
          }
        }
        baseTaskList.splice(insertionIndex, 0, checklistTask);
      });
      const currentTaskOrder = currentTaskList.map(getDoYourBestTaskName).join("");
      const nextTaskOrder = baseTaskList.map(getDoYourBestTaskName).join("");
      const hasAllHandlers = taskDefinitions.every(
        (task) => typeof doYourBestInstance.functions?.[task.name] === "function"
      );
      if (currentTaskOrder === nextTaskOrder && hasAllHandlers) {
        return;
      }
      const currentFunctions = {
        ...doYourBestInstance.functions ?? {},
        ...Object.fromEntries(taskDefinitions.map((task) => [task.name, task.handler]))
      };
      class TitanDoYourBestExtension extends RootDoYourBestClass {
        constructor(resolve, reject, questInfo) {
          super(resolve, reject, questInfo);
          this.funcList = baseTaskList.map((task) => ({ ...task }));
          this.functions = { ...currentFunctions };
        }
      }
      HWHClasses.doYourBest = TitanDoYourBestExtension;
    }
    async function openTitanTrainerSafely() {
      try {
        await openTitanTrainerMenu();
      } catch (error) {
        console.error("[TitanTrainer] Error:", error);
        showFinalProgress(
          `${translate("HWHTITANART_PROGRESS_ERROR")}<br>${escapeHtml$1(error?.message || translate("HWHTITANART_ERROR_GENERIC"))}`
        );
      }
    }
    function createTitanTrainerMainMenuButton() {
      return {
        get name() {
          return translate("HWHTITANTRAINER_BUTTON");
        },
        get title() {
          return translate("HWHTITANTRAINER_BUTTON_TITLE");
        },
        color: "pink",
        onClick: openTitanTrainerSafely
      };
    }
    function createTitanTrainerOtherMenuButton() {
      return {
        actionKey: TITAN_TRAINER_ACTION_KEY,
        get msg() {
          return buildIconLabel("hammer", translate("HWHTITANTRAINER_BUTTON"));
        },
        get title() {
          return translate("HWHTITANTRAINER_BUTTON_TITLE");
        },
        color: "pink",
        result: openTitanTrainerSafely
      };
    }
    function syncTitanTrainerActionPlacement(settings = void 0) {
      const rawPlacement = settings && typeof settings === "object" ? Object.prototype.hasOwnProperty.call(
        settings,
        "titanTrainerButtonPlacement"
      ) ? settings.titanTrainerButtonPlacement : readStoredTitanTrainerButtonPlacementSync() : settings;
      const placement = rawPlacement === void 0 ? readStoredTitanTrainerButtonPlacementSync() : normalizeTitanTrainerButtonPlacement(rawPlacement);
      persistTitanTrainerButtonPlacementSync(placement);
      syncScriptMenuActionPlacement({
        HWHData,
        mainMenuButtons,
        othersPopupButtons,
        placement,
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
    console.log(
      `%c${translate("HWHTITANART_START_LOG", {
        name: GM_info.script.name,
        author: GM_info.script.author,
        version: GM_info.script.version
      })}`,
      "color: #7fe3ba"
    );
    addExtensionName(GM_info.script.name, GM_info.script.version, GM_info.script.author);
    registerDoYourBestTitanTasks();
    registerTitanTrainerAction();
  }
  installHwhSharedRuntime({
    scriptId: "hwhtitanartifact",
    scriptName: "HWH Titan Trainer"
  });
  initializeTitanArtifactLeveler(0);
})();
