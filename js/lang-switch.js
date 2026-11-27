// Translation system: embedded first-paint + on-demand per-language JSON refresh
(function (window, document) {
    'use strict';

    const shared = (window.SiteLayout && window.SiteLayout.i18n) || {};
    const SUPPORTED_LANGS = shared.SUPPORTED_LANGS || ['en', 'zh', 'es'];
    const translations = {};
    const fetchedRemote = {};
    let currentLang = 'en';
    let languageMenuBound = false;

    function flattenTranslationSections(data) {
        if (typeof shared.flattenTranslationSections === 'function') {
            return shared.flattenTranslationSections(data);
        }
        const flat = {};
        for (const section in data) {
            if (!Object.prototype.hasOwnProperty.call(data, section)) {
                continue;
            }
            for (const key in data[section]) {
                if (Object.prototype.hasOwnProperty.call(data[section], key)) {
                    flat[key] = data[section][key];
                }
            }
        }
        return flat;
    }

    function resolveInitialLanguage() {
        if (typeof shared.resolveInitialLanguage === 'function') {
            const resolved = shared.resolveInitialLanguage();
            if (translations[resolved]) {
                return resolved;
            }
        }

        try {
            const savedLang = localStorage.getItem('site-lang');
            if (savedLang && SUPPORTED_LANGS.includes(savedLang)) {
                return savedLang;
            }
        } catch (error) {
            // Ignore storage restrictions
        }

        return 'en';
    }

    function setupLanguageMenu() {
        if (languageMenuBound) {
            return;
        }

        document.addEventListener('click', function (e) {
            const langButton = e.target.closest('.header-top-lang .lang-option');
            if (!langButton) {
                return;
            }

            e.preventDefault();
            const targetLang = langButton.getAttribute('data-lang');
            if (!targetLang || !SUPPORTED_LANGS.includes(targetLang)) {
                return;
            }

            switchLang(targetLang);
        });

        languageMenuBound = true;
    }

    function setActiveLanguageItem(lang) {
        document.querySelectorAll('.header-top-lang .lang-option').forEach(function (item) {
            const isActive = item.getAttribute('data-lang') === lang;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-pressed', String(isActive));
            item.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
    }

    function updatePageMetadata(t) {
        const page = document.body ? document.body.getAttribute('data-page') : '';
        if (!page) {
            return;
        }

        const titleKey = `meta_title_${page}`;
        if (t[titleKey]) {
            document.title = t[titleKey];
        }

        const descKey = `meta_desc_${page}`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && t[descKey]) {
            metaDesc.setAttribute('content', t[descKey]);
        }
    }

    function applyTranslations(lang) {
        const t = translations[lang];
        if (!t) {
            return;
        }

        const callUs = document.querySelector('.header-top-info a[href^="tel"]');
        if (callUs) {
            const numberNode = callUs.querySelector('span');
            const number = numberNode ? numberNode.textContent.trim() : '+86 18678139489';
            const callUsLabel = t.call_us ? `${t.call_us}: ${number}` : number;
            callUs.setAttribute('aria-label', callUsLabel);
            callUs.setAttribute('title', callUsLabel);
        }

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            const key = el.getAttribute('data-i18n');
            if (!Object.prototype.hasOwnProperty.call(t, key)) {
                return;
            }

            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t[key];
                return;
            }

            if (el.tagName === 'OPTION') {
                el.textContent = t[key];
                return;
            }

            const icon = el.querySelector('i');
            if (icon && el.children.length === 1) {
                el.innerHTML = t[key] + icon.outerHTML;
            } else {
                el.textContent = t[key];
            }
        });

        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-aria');
            if (Object.prototype.hasOwnProperty.call(t, key)) {
                el.setAttribute('aria-label', t[key]);
            }
        });

        updatePageMetadata(t);

        window.dispatchEvent(new CustomEvent('site:langchange', {
            detail: { lang: lang, translations: t }
        }));
    }

    async function refreshLanguageFromRemote(lang) {
        if (window.location.protocol === 'file:' || fetchedRemote[lang]) {
            return;
        }

        fetchedRemote[lang] = true;
        try {
            const response = await fetch(`translations/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${lang}.json`);
            }
            const data = await response.json();
            translations[lang] = flattenTranslationSections(data);
            if (currentLang === lang) {
                applyTranslations(lang);
            }
        } catch (error) {
            fetchedRemote[lang] = false;
            if (!translations[lang]) {
                console.error(`Failed to load translations for "${lang}".`, error);
            }
        }
    }

    function switchLang(lang) {
        const normalizedLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en';
        currentLang = normalizedLang;

        try {
            localStorage.setItem('site-lang', normalizedLang);
        } catch (error) {
            // Ignore storage restrictions
        }

        document.documentElement.lang = normalizedLang;
        setActiveLanguageItem(normalizedLang);

        if (translations[normalizedLang]) {
            applyTranslations(normalizedLang);
        }

        refreshLanguageFromRemote(normalizedLang);
    }

    function loadFromEmbeddedTranslations() {
        const embedded = window.__EMBEDDED_TRANSLATIONS__ || {};
        SUPPORTED_LANGS.forEach(function (lang) {
            if (embedded[lang]) {
                translations[lang] = flattenTranslationSections(embedded[lang]);
            }
        });
        return SUPPORTED_LANGS.every(function (lang) {
            return Boolean(translations[lang]);
        });
    }

    function initializeLanguageSystem() {
        setupLanguageMenu();
        loadFromEmbeddedTranslations();
        switchLang(resolveInitialLanguage());
    }

    window.SiteI18n = {
        switchLang: switchLang,
        getCurrentLang: function () {
            return currentLang;
        },
        getText: function (key, fallback) {
            const t = translations[currentLang] || translations.en || {};
            return Object.prototype.hasOwnProperty.call(t, key) ? t[key] : (fallback || '');
        }
    };
    window.switchLang = switchLang;

    if (document.body) {
        initializeLanguageSystem();
    } else {
        document.addEventListener('DOMContentLoaded', initializeLanguageSystem, { once: true });
    }
})(window, document);
