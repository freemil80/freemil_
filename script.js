(function () {
    "use strict";

    var THEME_STORAGE_KEY = "portfolio-theme";
    var LANGUAGE_STORAGE_KEY = "portfolio-language";
    var validThemes = ["default", "dark", "midnight", "forest"];
    var validLanguages = ["en", "fr", "de", "es", "pt", "zh-CN", "zh-TW"];
    var languageLabels = {
        en: "English (English)",
        fr: "Français (French)",
        de: "Deutsch (German)",
        es: "Español (Spanish)",
        pt: "Português (Portuguese)",
        "zh-CN": "简体中文 (Chinese Simplified)",
        "zh-TW": "繁體中文 (Chinese Traditional)"
    };
    var currentLanguage = "en";
    var localeStrings = {};
    var translatedTextSources = new WeakMap();
    var translatedAttributeSources = new WeakMap();
    var sidebar;
    var backdrop;
    var menuButton;
    var closeButton;
    var lightbox;
    var lastLightboxFocus;

    var navItems = [
        { href: "index.html", label: "Home" },
        { href: "about.html", label: "About" },
        { href: "projects.html", label: "Projects" },
        { href: "services.html", label: "Services" },
        { href: "contact.html", label: "Contact" },
        { href: "help.html", label: "Help" },
        { href: "terms.html", label: "Terms" },
        { href: "privacy.html", label: "Privacy" }
    ];

    /* Replace the X and Instagram URLs when the correct profiles are available. */
    var socialLinks = [
        {
            label: "GitHub",
            href: "https://github.com/freemil80",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.76.84 1.23 1.91 1.23 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z"></path></svg>'
        },
        {
            label: "LinkedIn",
            href: "https://www.linkedin.com/in/theophilus-ofori-agyekum-1a16a0193/",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5.16 3.25a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0ZM.91 8.1h4.49V22H.91V8.1Zm7.3 0h4.3v1.9h.06c.6-1.1 2.07-2.26 4.25-2.26 4.55 0 5.39 2.99 5.39 6.88V22h-4.48v-6.54c0-1.56-.03-3.57-2.18-3.57-2.18 0-2.51 1.7-2.51 3.46V22H8.21V8.1Z"></path></svg>'
        },
        {
            label: "X",
            href: "https://x.com/freemil_",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.49 22H3.38l7.24-8.28L2.8 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.83h1.73L8.27 4.06H6.41L17.8 19.83Z"></path></svg>'
        },
        {
            label: "Instagram",
            href: "https://www.instagram.com/freemil_/",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm9.75 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"></path></svg>'
        }
    ];

    function getSavedTheme() {
        var savedTheme;

        try {
            savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        } catch (error) {
            savedTheme = null;
        }

        return validThemes.indexOf(savedTheme) !== -1 ? savedTheme : "default";
    }

    function normalizeI18nText(value) {
        return value.replace(/\s+/g, " ").trim();
    }

    function normalizeLanguageTag(languageTag) {
        var tag = (languageTag || "en").toLowerCase();

        if (tag.indexOf("zh-tw") === 0 || tag.indexOf("zh-hk") === 0 || tag.indexOf("zh-mo") === 0) {
            return "zh-TW";
        }

        if (tag.indexOf("zh") === 0) {
            return "zh-CN";
        }

        return tag.split("-")[0];
    }

    function getSavedLanguage() {
        var savedLanguage;

        try {
            savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        } catch (error) {
            savedLanguage = null;
        }

        var pathLanguage = getPathLanguage();
        if (pathLanguage) {
            return pathLanguage;
        }

        if (validLanguages.indexOf(savedLanguage) !== -1) {
            return savedLanguage;
        }

        var browserLanguages = navigator.languages || [navigator.language || navigator.userLanguage || "en"];

        for (var index = 0; index < browserLanguages.length; index += 1) {
            var languageFamily = normalizeLanguageTag(browserLanguages[index]);

            if (validLanguages.indexOf(languageFamily) !== -1) {
                return languageFamily;
            }
        }

        return "en";
    }

    function translate(key) {
        return localeStrings[key] || key;
    }

    function preserveWhitespace(original, translated) {
        var leading = original.match(/^\s*/)[0];
        var trailing = original.match(/\s*$/)[0];
        return leading + translated + trailing;
    }

    function translateDocument() {
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        var node;

        while ((node = walker.nextNode())) {
            var parent = node.parentElement;

            if (!parent || parent.closest("script, style, svg")) {
                continue;
            }

            var source = translatedTextSources.get(node);
            if (!source) {
                source = normalizeI18nText(node.nodeValue);
                if (source) {
                    translatedTextSources.set(node, source);
                }
            }

            if (source) {
                node.nodeValue = preserveWhitespace(node.nodeValue, translate(source));
            }
        }

        document.querySelectorAll("[data-i18n-key]").forEach(function (element) {
            var key = element.getAttribute("data-i18n-key");
            element.textContent = translate(key);
        });

        document.querySelectorAll(".service-request-trigger").forEach(function (trigger) {
            var card = trigger.closest(".service-card");
            trigger.textContent = translate(card && card.classList.contains("is-open") ? "Close request" : "Request this service");
        });

        refreshCharacterCounters();

        document.querySelectorAll("[aria-label], [title], [placeholder]").forEach(function (element) {
            ["aria-label", "title", "placeholder"].forEach(function (attribute) {
                if (!element.hasAttribute(attribute)) {
                    return;
                }

                var sources = translatedAttributeSources.get(element) || {};
                var source = sources[attribute] || element.getAttribute(attribute);
                sources[attribute] = source;
                translatedAttributeSources.set(element, sources);
                element.setAttribute(attribute, translate(source));
            });
        });

        var titleSource = document.documentElement.getAttribute("data-title-source");
        if (!titleSource) {
            titleSource = document.title;
            document.documentElement.setAttribute("data-title-source", titleSource);
        }
        document.title = translate(titleSource);
        document.documentElement.lang = currentLanguage;
        document.documentElement.dir = ["fa", "he"].indexOf(currentLanguage) !== -1 ? "rtl" : "ltr";
    }

    function applyI18nCssLabels() {
        document.documentElement.style.setProperty("--service-request-label", JSON.stringify(translate("Request this service")));
        document.documentElement.style.setProperty("--service-close-label", JSON.stringify(translate("Close request")));
        document.documentElement.style.setProperty("--service-deliverables-label", JSON.stringify(translate("Typical deliverables")));
    }

    function loadLocale(language) {
        var selectedLanguage = validLanguages.indexOf(language) !== -1 ? language : "en";

        function useLocale(strings) {
            currentLanguage = selectedLanguage;
            localeStrings = strings || {};

            try {
                window.localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
            } catch (error) {
                /* The language still works when localStorage is unavailable. */
            }
        }

        if (window.PortfolioLocales && window.PortfolioLocales[selectedLanguage]) {
            useLocale(window.PortfolioLocales[selectedLanguage]);
            return Promise.resolve();
        }

        return new Promise(function (resolve, reject) {
            var localeScript = document.createElement("script");
            localeScript.src = siteRelativePath("locales/" + selectedLanguage + ".js");
            localeScript.onload = function () {
                if (window.PortfolioLocales && window.PortfolioLocales[selectedLanguage]) {
                    useLocale(window.PortfolioLocales[selectedLanguage]);
                    resolve();
                } else {
                    reject(new Error("Locale data was not found"));
                }
            };
            localeScript.onerror = reject;
            document.head.appendChild(localeScript);
        }).catch(function () {
            if (selectedLanguage !== "en") {
                return loadLocale("en");
            }
            currentLanguage = "en";
            localeStrings = {};
        });
    }

    function updateLanguageSelectors() {
        document.querySelectorAll(".language-select").forEach(function (select) {
            select.value = currentLanguage;
            select.setAttribute("aria-label", translate("Language"));
        });
    }

    function languageOptionsMarkup() {
        return validLanguages.map(function (language) {
            return '<option value="' + language + '">' + languageLabels[language] + "</option>";
        }).join("");
    }

    function languagePickerMarkup(id, className) {
        return '<div class="language-picker ' + className + '">' +
            '<label for="' + id + '" data-i18n-key="Language">' + translate("Language") + '</label>' +
            '<select id="' + id + '" class="language-select" aria-label="' + translate("Language") + '">' + languageOptionsMarkup() + '</select>' +
        '</div>';
    }

    function initLanguageSelectors() {
        var navbar = document.querySelector(".navbar");
        var home = document.querySelector(".landing-page .home");

        if (navbar && !navbar.querySelector(".language-picker-nav")) {
            var navPicker = document.createElement("div");
            navPicker.innerHTML = languagePickerMarkup("language-select-nav", "language-picker-nav");
            navbar.insertBefore(navPicker.firstElementChild, navbar.querySelector("ul"));
        }

        if (home && !home.querySelector(".language-picker-landing")) {
            var landingPicker = document.createElement("div");
            landingPicker.innerHTML = languagePickerMarkup("language-select-landing", "language-picker-landing");
            home.insertBefore(landingPicker.firstElementChild, home.firstChild);
        }

        bindLanguageSelectors();
        updateLanguageSelectors();
    }

    function bindLanguageSelectors() {
        document.querySelectorAll(".language-select").forEach(function (select) {
            select.value = currentLanguage;
            select.addEventListener("change", function () {
                var selectedLanguage = select.value;
                var currentPathLanguage = getPathLanguage();

                if (selectedLanguage !== currentPathLanguage && (currentPathLanguage || selectedLanguage !== "en")) {
                    window.location.assign(getLocalizedPageUrl(selectedLanguage));
                    return;
                }

                loadLocale(selectedLanguage).then(function () {
                    translateDocument();
                    applyI18nCssLabels();
                    updateLanguageSelectors();
                    document.dispatchEvent(new Event("portfolio-language-change"));
                    showToast(translate("Language updated to {{language}}").replace("{{language}}", languageLabels[currentLanguage]));
                });
            });
        });
    }

    function updateThemeOptions(selectedTheme) {
        document.querySelectorAll(".theme-option").forEach(function (option) {
            option.setAttribute(
                "aria-pressed",
                option.getAttribute("data-theme") === selectedTheme ? "true" : "false"
            );
        });
    }

    function applyTheme(theme) {
        var selectedTheme = validThemes.indexOf(theme) !== -1 ? theme : "default";

        document.documentElement.setAttribute("data-theme", selectedTheme);
        updateThemeOptions(selectedTheme);

        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
        } catch (error) {
            /* The theme still works when localStorage is unavailable. */
        }
    }

    function getScriptBasePath() {
        var script = document.querySelector('script[src$="script.js"], script[src*="/script.js?"]');
        var source = script ? script.getAttribute("src") : "script.js";
        return source.replace(/script\.js(?:\?.*)?$/, "");
    }

    function siteRelativePath(path) {
        return getScriptBasePath() + path;
    }

    function getPathLanguage() {
        var pathParts = window.location.pathname.split("/");
        return pathParts.find(function (part) {
            return validLanguages.indexOf(part) !== -1 && part !== "en";
        }) || null;
    }

    function getLocalizedPageUrl(language) {
        var page = getCurrentPage();
        var currentLanguageFromPath = getPathLanguage();

        if (language === "en") {
            return currentLanguageFromPath ? "../" + page : page;
        }

        return currentLanguageFromPath ? "../" + language + "/" + page : language + "/" + page;
    }

    function getCurrentPage() {
        var page = window.location.pathname.split("/").pop().toLowerCase();
        return page || "index.html";
    }

    function createSidebar() {
        var currentPage = getCurrentPage();
        var navMarkup = navItems.map(function (item) {
            var activeClass = currentPage === item.href ? " active" : "";
            var currentAttribute = currentPage === item.href ? ' aria-current="page"' : "";
            return '<li><a class="sidebar-link' + activeClass + '" href="' + item.href + '"' + currentAttribute + '><span data-i18n-key="' + item.label + '">' + translate(item.label) + "</span></a></li>";
        }).join("");

        var socialMarkup = socialLinks.map(function (item) {
            return '<a class="sidebar-social-link" href="' + item.href + '" target="_blank" rel="noopener noreferrer" aria-label="Open ' + item.label + ' in a new tab">' + item.icon + '<span data-i18n-key="' + item.label + '">' + translate(item.label) + "</span></a>";
        }).join("");

        var menu = document.createElement("button");
        menu.type = "button";
        menu.className = "sidebar-toggle";
        menu.setAttribute("aria-label", translate("Open site menu"));
        menu.setAttribute("aria-controls", "site-sidebar");
        menu.setAttribute("aria-expanded", "false");
        menu.innerHTML = '<img class="hamburger-icon-image" src="' + siteRelativePath("hamburger.png") + '" alt="" aria-hidden="true">';

        var shade = document.createElement("div");
        shade.className = "sidebar-backdrop";
        shade.setAttribute("aria-hidden", "true");

        var drawer = document.createElement("aside");
        drawer.className = "site-sidebar";
        drawer.id = "site-sidebar";
        drawer.setAttribute("role", "dialog");
        drawer.setAttribute("aria-modal", "true");
        drawer.setAttribute("aria-labelledby", "sidebar-title");
        drawer.setAttribute("aria-hidden", "true");
        drawer.setAttribute("inert", "");
        drawer.innerHTML =
            '<div class="sidebar-header">' +
                '<div><p class="section-label" data-i18n-key="Portfolio">' + translate("Portfolio") + '</p><h2 id="sidebar-title" data-i18n-key="Site menu">' + translate("Site menu") + '</h2></div>' +
                '<button type="button" class="sidebar-close" aria-label="' + translate("Close site menu") + '">&times;</button>' +
            '</div>' +
            '<nav class="sidebar-nav" aria-label="' + translate("Primary navigation") + '"><ul>' + navMarkup + "</ul></nav>" +
            '<section class="sidebar-section sidebar-language" aria-labelledby="language-title">' +
                '<h3 id="language-title" data-i18n-key="Language">' + translate("Language") + '</h3>' +
                '<div data-language-mount>' + languagePickerMarkup("language-select-sidebar", "language-picker-sidebar") + '</div>' +
            '</section>' +
            '<section class="sidebar-section sidebar-theme" aria-labelledby="theme-title">' +
                '<h3 id="theme-title" data-i18n-key="Theme">' + translate("Theme") + '</h3>' +
                '<div class="theme-options" role="group" aria-label="Choose a color theme">' +
                    '<button type="button" class="theme-option" data-theme="default" aria-pressed="false"><span class="theme-swatch theme-swatch-default" aria-hidden="true"></span><span data-i18n-key="Default">' + translate("Default") + '</span></button>' +
                    '<button type="button" class="theme-option" data-theme="dark" aria-pressed="false"><span class="theme-swatch theme-swatch-dark" aria-hidden="true"></span><span data-i18n-key="Dark">' + translate("Dark") + '</span></button>' +
                    '<button type="button" class="theme-option" data-theme="midnight" aria-pressed="false"><span class="theme-swatch theme-swatch-midnight" aria-hidden="true"></span><span data-i18n-key="Midnight Blue">' + translate("Midnight Blue") + '</span></button>' +
                    '<button type="button" class="theme-option" data-theme="forest" aria-pressed="false"><span class="theme-swatch theme-swatch-forest" aria-hidden="true"></span><span data-i18n-key="Forest Green">' + translate("Forest Green") + '</span></button>' +
                '</div>' +
            '</section>' +
            '<section class="sidebar-section" aria-labelledby="connect-title">' +
                '<h3 id="connect-title" data-i18n-key="Connect">' + translate("Connect") + '</h3>' +
                '<div class="sidebar-socials">' + socialMarkup + "</div>" +
            '</section>';

        document.body.insertBefore(menu, document.body.firstChild);
        document.body.insertBefore(shade, menu.nextSibling);
        document.body.insertBefore(drawer, shade.nextSibling);

        menuButton = menu;
        backdrop = shade;
        sidebar = drawer;
        closeButton = drawer.querySelector(".sidebar-close");
        updateThemeOptions(getSavedTheme());

        menu.addEventListener("click", function () {
            if (menu.getAttribute("aria-expanded") === "true") {
                closeSidebar(true);
            } else {
                openSidebar();
            }
        });

        closeButton.addEventListener("click", function () {
            closeSidebar(true);
        });

        backdrop.addEventListener("click", function () {
            closeSidebar(true);
        });

        drawer.addEventListener("click", function (event) {
            var link = event.target.closest("a");

            if (!link) {
                return;
            }

            if (link.target === "_blank") {
                closeSidebar(true);
                return;
            }

            event.preventDefault();
            navigateAfterSidebarClose(link);
        });

        drawer.querySelectorAll(".theme-option").forEach(function (option) {
            option.addEventListener("click", function () {
                applyTheme(option.getAttribute("data-theme"));
            });
        });

        document.addEventListener("keydown", handleSidebarKeydown);
    }

    function getFocusableElements(container) {
        return Array.prototype.slice.call(container.querySelectorAll(
            'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(function (element) {
            return element.offsetWidth > 0 || element.offsetHeight > 0;
        });
    }

    function openSidebar() {
        if (!sidebar) {
            return;
        }

        sidebar.removeAttribute("inert");
        sidebar.setAttribute("aria-hidden", "false");
        sidebar.classList.add("is-open");
        backdrop.classList.add("is-visible");
        menuButton.setAttribute("aria-expanded", "true");
        menuButton.setAttribute("aria-label", translate("Close site menu"));
        document.body.classList.add("sidebar-open");
        closeButton.focus();
    }

    function closeSidebar(restoreFocus) {
        if (!sidebar) {
            return;
        }

        sidebar.classList.remove("is-open");
        sidebar.setAttribute("aria-hidden", "true");
        sidebar.setAttribute("inert", "");
        backdrop.classList.remove("is-visible");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", translate("Open site menu"));
        document.body.classList.remove("sidebar-open");

        if (restoreFocus && menuButton && typeof menuButton.focus === "function") {
            menuButton.focus();
        }
    }

    function navigateAfterSidebarClose(link) {
        var destination = link.href;
        var delay = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 250;

        closeSidebar(false);
        window.setTimeout(function () {
            window.location.assign(destination);
        }, delay);
    }

    function handleSidebarKeydown(event) {
        if (!sidebar || menuButton.getAttribute("aria-expanded") !== "true") {
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            closeSidebar(true);
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        var focusableElements = getFocusableElements(sidebar);
        var firstElement = focusableElements[0];
        var lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) {
            event.preventDefault();
            closeButton.focus();
        } else if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }

    function getLightbox() {
        if (lightbox) {
            return lightbox;
        }

        lightbox = document.createElement("div");
        lightbox.className = "profile-lightbox";
        lightbox.setAttribute("role", "dialog");
        lightbox.setAttribute("aria-modal", "true");
        lightbox.setAttribute("aria-label", "Profile photo");
        lightbox.hidden = true;
        lightbox.innerHTML =
            '<button type="button" class="profile-lightbox-close" aria-label="Close profile photo">&times;</button>' +
            '<img src="" alt="Theophilus Ofori Agyekum">';
        document.body.appendChild(lightbox);

        lightbox.addEventListener("click", function (event) {
            if (event.target === lightbox || event.target.classList.contains("profile-lightbox-close")) {
                closeLightbox();
            }
        });

        return lightbox;
    }

    function openLightbox(src, trigger) {
        var box = getLightbox();
        var image = box.querySelector("img");

        lastLightboxFocus = trigger;
        image.src = src;
        box.hidden = false;
        box.classList.add("is-open");
        box.querySelector(".profile-lightbox-close").focus();
    }

    function closeLightbox() {
        if (!lightbox) {
            return;
        }

        lightbox.classList.remove("is-open");
        lightbox.hidden = true;
        lightbox.querySelector("img").removeAttribute("src");

        if (lastLightboxFocus && typeof lastLightboxFocus.focus === "function") {
            lastLightboxFocus.focus();
        }
    }

    function handleLightboxKeydown(event) {
        if (!lightbox || lightbox.hidden) {
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            closeLightbox();
            return;
        }

        if (event.key === "Tab") {
            event.preventDefault();
            lightbox.querySelector(".profile-lightbox-close").focus();
        }
    }

    function initRotatingHero() {
        var rotatingText = document.querySelector("[data-rotating-hero]");
        var phrases = [
            "Using data to bridge science, sustainability, and innovation.",
            "Research through data.",
            "Science with practical impact.",
            "Analytics for sustainable innovation."
        ];
        var phraseIndex = 0;
        var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (!rotatingText || prefersReducedMotion) {
            return;
        }

        window.setInterval(function () {
            rotatingText.classList.add("is-changing");

            window.setTimeout(function () {
                phraseIndex = (phraseIndex + 1) % phrases.length;
                rotatingText.textContent = translate(phrases[phraseIndex]);
                rotatingText.classList.remove("is-changing");
            }, 350);
        }, 4200);
    }

    function showToast(message) {
        var toast = document.querySelector(".site-toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.className = "site-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add("is-visible");
        window.clearTimeout(toast.hideTimer);
        toast.hideTimer = window.setTimeout(function () {
            toast.classList.remove("is-visible");
        }, 2200);
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }

        return new Promise(function (resolve, reject) {
            var helper = document.createElement("textarea");
            helper.value = text;
            helper.setAttribute("readonly", "");
            helper.style.position = "fixed";
            helper.style.opacity = "0";
            document.body.appendChild(helper);
            helper.select();

            try {
                document.execCommand("copy");
                resolve();
            } catch (error) {
                reject(error);
            } finally {
                helper.remove();
            }
        });
    }

    function refreshCharacterCounters() {
        document.querySelectorAll(".character-count").forEach(function (counter) {
            var textarea = document.getElementById(counter.getAttribute("data-for"));

            if (!textarea) {
                return;
            }

            var remaining = Math.max(0, Number(textarea.getAttribute("maxlength")) - textarea.value.length);
            counter.textContent = translate("{{count}} characters remaining").replace("{{count}}", remaining);
            counter.classList.toggle("is-near-limit", remaining <= 50);
        });
    }

    function initCharacterCounters() {
        document.querySelectorAll("textarea[maxlength]").forEach(function (textarea) {
            if (!textarea.id) {
                return;
            }

            var counter = document.querySelector('.character-count[data-for="' + textarea.id + '"]');

            if (!counter) {
                counter = document.createElement("span");
                counter.className = "character-count";
                counter.id = textarea.id + "-counter";
                counter.setAttribute("data-for", textarea.id);
                counter.setAttribute("role", "status");
                counter.setAttribute("aria-live", "polite");
                textarea.setAttribute("aria-describedby", counter.id);
                textarea.insertAdjacentElement("afterend", counter);
            }

            textarea.setAttribute("aria-describedby", counter.id);
            textarea.addEventListener("input", refreshCharacterCounters);
        });

        refreshCharacterCounters();
    }

    function initAccessibility() {
        var main = document.querySelector("main");

        if (!main) {
            return;
        }

        if (!main.id) {
            main.id = "main-content";
        }

        if (!document.querySelector(".skip-link")) {
            var skipLink = document.createElement("a");
            skipLink.className = "skip-link";
            skipLink.href = "#" + main.id;
            skipLink.setAttribute("data-i18n-key", "Skip to content");
            skipLink.textContent = translate("Skip to content");
            document.body.insertBefore(skipLink, document.body.firstChild);
        }
    }

    function initScrollReveal() {
        var revealTargets = document.querySelectorAll(
            "main > .page-header, main > .section, main > .newsletter-page, .publication-card, .service-card, .timeline article, .proof-item, .research-dock, .research-dock-item, .support-cta, .service-process-step"
        );
        var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (!revealTargets.length) {
            return;
        }

        revealTargets.forEach(function (element, index) {
            element.classList.add("reveal-on-scroll");
            element.style.setProperty("--reveal-delay", Math.min(index * 55, 330) + "ms");
        });

        if (reduceMotion || !("IntersectionObserver" in window)) {
            revealTargets.forEach(function (element) {
                element.classList.add("is-visible");
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries, revealObserver) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -36px" });

        revealTargets.forEach(function (element) {
            observer.observe(element);
        });
    }

    function initBackToTop() {
        if (document.body.classList.contains("landing-page")) {
            return;
        }

        var button = document.createElement("button");
        button.type = "button";
        button.className = "back-to-top";
        button.setAttribute("aria-label", translate("Back to top"));
        button.textContent = "↑";
        document.body.appendChild(button);

        function updateVisibility() {
            button.classList.toggle("is-visible", window.scrollY > 400);
        }

        button.addEventListener("click", function () {
            var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });

        window.addEventListener("scroll", updateVisibility, { passive: true });
        updateVisibility();
    }

    function initRequestForms() {
        document.querySelectorAll('form[action*="formsubmit.co"]').forEach(function (form) {
            form.addEventListener("submit", function () {
                if (!form.checkValidity()) {
                    return;
                }

                var submitButton = form.querySelector('button[type="submit"]');
                if (!submitButton) {
                    return;
                }

                submitButton.disabled = true;
                submitButton.setAttribute("aria-busy", "true");
                submitButton.textContent = translate("Sending request...");
                form.classList.add("is-submitting");

                var status = form.querySelector(".form-status");
                if (!status) {
                    status = document.createElement("p");
                    status.className = "form-status";
                    status.setAttribute("role", "status");
                    status.setAttribute("aria-live", "polite");
                    form.appendChild(status);
                }
                status.textContent = translate("Sending request...");
            });
        });
    }

    function initContactInteractions() {
        var emailLink = document.querySelector("[data-copy-email]");

        if (!emailLink) {
            return;
        }

        emailLink.addEventListener("click", function () {
            copyText(emailLink.getAttribute("data-copy-email"))
                .then(function () {
                    showToast(translate("Email address copied"));
                })
                .catch(function () {
                    /* The mailto link remains available if copying is blocked. */
                });
        });
    }

    function initCaseStudyAccordions() {
        document.querySelectorAll(".publication-card").forEach(function (card) {
            var accordions = card.querySelectorAll(".case-study-accordion");

            accordions.forEach(function (accordion) {
                accordion.addEventListener("toggle", function () {
                    if (!accordion.open) {
                        return;
                    }

                    accordions.forEach(function (otherAccordion) {
                        if (otherAccordion !== accordion) {
                            otherAccordion.open = false;
                        }
                    });
                });
            });
        });
    }

    function initProjectFilters() {
        var filters = document.querySelectorAll(".project-filter");
        var cards = document.querySelectorAll(".publication-card");

        if (!filters.length || !cards.length) {
            return;
        }

        filters.forEach(function (filterButton) {
            filterButton.addEventListener("click", function () {
                var selectedFilter = filterButton.getAttribute("data-filter");

                filters.forEach(function (button) {
                    var isActive = button === filterButton;
                    button.classList.toggle("is-active", isActive);
                    button.setAttribute("aria-pressed", isActive ? "true" : "false");
                });

                cards.forEach(function (card) {
                    var topics = (card.getAttribute("data-topics") || "").split(" ");
                    card.hidden = selectedFilter !== "all" && topics.indexOf(selectedFilter) === -1;
                });
            });
        });
    }

    function initScrollProgress() {
        if (document.body.classList.contains("landing-page")) {
            return;
        }

        var progressBar = document.createElement("div");
        progressBar.className = "scroll-progress";
        progressBar.setAttribute("aria-hidden", "true");
        document.body.appendChild(progressBar);

        var framePending = false;

        function updateProgress() {
            var scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            var progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
            progressBar.style.transform = "scaleX(" + Math.min(progress, 1) + ")";
            framePending = false;
        }

        function requestProgressUpdate() {
            if (!framePending) {
                framePending = true;
                window.requestAnimationFrame(updateProgress);
            }
        }

        window.addEventListener("scroll", requestProgressUpdate, { passive: true });
        window.addEventListener("resize", requestProgressUpdate);
        updateProgress();
    }

    function initFooterEnhancement() {
        var footer = document.querySelector(".site-footer");

        if (!footer || document.body.classList.contains("landing-page") || footer.getAttribute("data-enhanced") === "true") {
            return;
        }

        var socialMarkup = socialLinks.map(function (item) {
            return '<a class="footer-social-link" href="' + item.href + '" target="_blank" rel="noopener noreferrer" aria-label="Open ' + item.label + ' in a new tab" title="' + item.label + '">' + item.icon + '<span data-i18n-key="' + item.label + '">' + translate(item.label) + '</span></a>';
        }).join("");

        footer.setAttribute("data-enhanced", "true");
        footer.innerHTML =
            '<div class="footer-grid">' +
                '<div class="footer-brand">' +
                    '<p class="eyebrow" data-i18n-key="Portfolio">' + translate("Portfolio") + '</p>' +
                    '<h2 data-i18n-key="Theophilus Ofori Agyekum">Theophilus Ofori Agyekum</h2>' +
                    '<p data-i18n-key="Research Data Analyst">' + translate("Research Data Analyst") + '</p>' +
                '</div>' +
                '<div class="footer-column">' +
                    '<h3 data-i18n-key="About">' + translate("About") + '</h3>' +
                    '<a href="about.html" data-i18n-key="About">' + translate("About") + '</a>' +
                    '<a href="projects.html" data-i18n-key="Projects">' + translate("Projects") + '</a>' +
                    '<a href="help.html" data-i18n-key="Help">' + translate("Help") + '</a>' +
                '</div>' +
                '<div class="footer-column">' +
                    '<h3 data-i18n-key="Services">' + translate("Services") + '</h3>' +
                    '<a href="services.html" data-i18n-key="Services">' + translate("Services") + '</a>' +
                    '<a href="contact.html" data-i18n-key="Contact">' + translate("Contact") + '</a>' +
                    '<a href="newsletter.html" data-i18n-key="Request a Service">' + translate("Request a Service") + '</a>' +
                '</div>' +
                '<div class="footer-column footer-connect">' +
                    '<h3 data-i18n-key="Connect">' + translate("Connect") + '</h3>' +
                    '<div class="footer-socials">' + socialMarkup + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="footer-bottom">' +
                '<nav class="footer-nav" aria-label="Legal and help">' +
                    '<a href="help.html" data-i18n-key="Help">' + translate("Help") + '</a>' +
                    '<a href="terms.html" data-i18n-key="Terms">' + translate("Terms") + '</a>' +
                    '<a href="privacy.html" data-i18n-key="Privacy">' + translate("Privacy") + '</a>' +
                '</nav>' +
                '<p class="footer-copyright"><img class="footer-logo" src="' + siteRelativePath("footer.png") + '" alt="Theophilus Ofori Agyekum logo" width="64" height="32"><span data-i18n-key="© 2026 Theophilus Ofori Agyekum. All rights reserved.">' + translate("© 2026 Theophilus Ofori Agyekum. All rights reserved.") + '</span></p>' +
            '</div>';
    }

    function initSupportCta() {
        var supportPages = ["about.html", "projects.html", "services.html", "newsletter.html", "help.html"];
        var footer = document.querySelector(".site-footer");

        if (!footer || supportPages.indexOf(getCurrentPage()) === -1) {
            return;
        }

        var cta = document.createElement("section");
        cta.className = "support-cta";
        cta.setAttribute("aria-labelledby", "support-cta-title");
        cta.innerHTML =
            '<div class="support-cta-copy">' +
                '<p class="eyebrow" data-i18n-key="Support the Work">' + translate("Support the Work") + '</p>' +
                '<h2 id="support-cta-title" data-i18n-key="Help turn scientific research and data into practical impact.">' + translate("Help turn scientific research and data into practical impact.") + '</h2>' +
                '<p data-i18n-key="Work with me, share an opportunity, or connect me with a project.">' + translate("Work with me, share an opportunity, or connect me with a project.") + '</p>' +
            '</div>' +
            '<div class="support-cta-actions">' +
                '<a class="btn primary" href="contact.html" data-i18n-key="Request a Service">' + translate("Request a Service") + '</a>' +
                '<a class="btn secondary" href="mailto:theophylls80@gmail.com?subject=Research%20Collaboration" data-i18n-key="Start a Collaboration">' + translate("Start a Collaboration") + '</a>' +
            '</div>';

        footer.parentNode.insertBefore(cta, footer);
    }

    function initServiceCards() {
        var serviceCards = Array.prototype.slice.call(document.querySelectorAll(".service-card"));
        var serviceGrid = document.querySelector(".service-grid");
        var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var focusDelay = prefersReducedMotion ? 0 : 350;
        var activeCard = null;

        if (!serviceCards.length || !serviceGrid) {
            return;
        }

        serviceCards.forEach(function (card, index) {
            var trigger = card.querySelector(".service-request-trigger");
            var form = card.querySelector(".service-card-form");

            if (!trigger || !form) {
                return;
            }

            if (!form.id) {
                form.id = "service-request-form-" + (index + 1);
            }
            trigger.setAttribute("aria-controls", form.id);
            trigger.textContent = translate("Request this service");

            trigger.addEventListener("click", function () {
                if (activeCard === card) {
                    activeCard = null;
                    card.classList.remove("is-open");
                    trigger.setAttribute("aria-expanded", "false");
                    trigger.textContent = translate("Request this service");
                    serviceGrid.classList.remove("has-active-card");
                    serviceCards.forEach(function (otherCard) {
                        otherCard.hidden = false;
                    });
                    return;
                }

                activeCard = card;
                serviceGrid.classList.add("has-active-card");
                card.classList.add("is-open");
                trigger.setAttribute("aria-expanded", "true");
                trigger.textContent = translate("Close request");

                serviceCards.forEach(function (otherCard) {
                    if (otherCard !== card) {
                        otherCard.hidden = true;
                        otherCard.classList.remove("is-open");
                        var otherTrigger = otherCard.querySelector(".service-request-trigger");
                        if (otherTrigger) {
                            otherTrigger.setAttribute("aria-expanded", "false");
                            otherTrigger.textContent = translate("Request this service");
                        }
                    }
                });

                window.setTimeout(function () {
                    if (activeCard !== card) {
                        return;
                    }

                    var firstField = form.querySelector("input:not([type=hidden]), select, textarea, button");
                    if (firstField) {
                        firstField.focus();
                    }
                }, focusDelay);
            });
        });
    }

    function initPrimaryNavigation() {
        var currentPage = getCurrentPage();

        document.querySelectorAll(".navbar ul a").forEach(function (link) {
            var href = link.getAttribute("href") || "";
            var linkPage = href.split("/").pop().split("#")[0].toLowerCase() || "index.html";
            var isCurrent = linkPage === currentPage;

            link.classList.toggle("active", isCurrent);
            if (isCurrent) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    function initResponsiveNavigation() {
        var navbar = document.querySelector(".navbar");

        if (!navbar) {
            return;
        }

        function checkNavigationSpace() {
            var navigationLinks = navbar.querySelector("ul");
            var linksVisible = navigationLinks && window.getComputedStyle(navigationLinks).display !== "none";

            navbar.classList.remove("nav-overflow");

            if (linksVisible && navbar.scrollWidth > navbar.clientWidth + 1) {
                navbar.classList.add("nav-overflow");
            }
        }

        window.addEventListener("resize", checkNavigationSpace);
        document.addEventListener("portfolio-language-change", checkNavigationSpace);
        window.setTimeout(checkNavigationSpace, 0);
    }

    function registerServiceWorker() {
        if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
            return;
        }

        navigator.serviceWorker.register(siteRelativePath("sw.js"), { scope: getScriptBasePath() || "./" }).catch(function () {
            /* Offline caching is an enhancement; the site remains fully usable without it. */
        });
    }

    function initializeSite() {
        initAccessibility();
        translateDocument();
        initCharacterCounters();
        initRequestForms();
        applyI18nCssLabels();
        applyTheme(getSavedTheme());
        initRotatingHero();
        initServiceCards();
        initCaseStudyAccordions();
        initProjectFilters();
        initContactInteractions();
        initFooterEnhancement();
        initSupportCta();
        initScrollReveal();
        initBackToTop();
        initScrollProgress();

        if (getCurrentPage() !== "index.html") {
            createSidebar();
        }

        initLanguageSelectors();
        initPrimaryNavigation();
        initResponsiveNavigation();
        registerServiceWorker();
        document.addEventListener("keydown", handleLightboxKeydown);

        document.querySelectorAll(".profile-photo-btn").forEach(function (button) {
            button.addEventListener("click", function () {
                openLightbox(button.getAttribute("data-full-src"), button);
            });
        });
    }

    loadLocale(getSavedLanguage()).then(initializeSite);
})();
