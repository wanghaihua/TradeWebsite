/**
 * 站点轻量交互：负责移动端导航、返回顶部、计数动画、评价轮播、
 * 首页首屏产品交互样册与快捷询盘、产品页渠道筛选与原生灯箱。
 */
(function () {
    'use strict';

    const DESKTOP_BREAKPOINT = 992;
    const TESTIMONIAL_INTERVAL = 5200;
    const prefersReducedMotion = typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function onReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
            return;
        }

        callback();
    }

    function initNavToggle() {
        const toggle = document.querySelector('.navbar-toggler');
        const panel = document.getElementById('navbarsExample09');

        if (!toggle || !panel) {
            return;
        }

        function closeMenu() {
            panel.classList.remove('show');
            toggle.classList.add('collapsed');
            toggle.setAttribute('aria-expanded', 'false');
        }

        function openMenu() {
            panel.classList.add('show');
            toggle.classList.remove('collapsed');
            toggle.setAttribute('aria-expanded', 'true');
        }

        toggle.addEventListener('click', function () {
            if (panel.classList.contains('show')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        panel.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                if (window.innerWidth < DESKTOP_BREAKPOINT) {
                    closeMenu();
                }
            });
        });

        document.addEventListener('click', function (event) {
            if (window.innerWidth >= DESKTOP_BREAKPOINT) {
                return;
            }

            if (!panel.classList.contains('show')) {
                return;
            }

            if (panel.contains(event.target) || toggle.contains(event.target)) {
                return;
            }

            closeMenu();
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth >= DESKTOP_BREAKPOINT) {
                closeMenu();
            }
        });
    }

    function initScrollToTop() {
        const button = document.getElementById('scroll-to-top');

        if (!button) {
            return;
        }

        function syncVisibility() {
            const isVisible = window.scrollY >= 220;
            button.classList.toggle('is-visible', isVisible);
        }

        window.addEventListener('scroll', syncVisibility, { passive: true });
        syncVisibility();

        button.addEventListener('click', function (event) {
            event.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
    }

    function animateValue(element, target) {
        if (!Number.isFinite(target)) {
            return;
        }

        if (prefersReducedMotion || target <= 0) {
            element.textContent = target.toLocaleString();
            return;
        }

        const duration = 1200;
        const startTime = performance.now();

        function frame(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = Math.round(target * eased).toLocaleString();

            if (progress < 1) {
                window.requestAnimationFrame(frame);
            }
        }

        window.requestAnimationFrame(frame);
    }

    function initCounters() {
        const counters = Array.from(document.querySelectorAll('.counter-stat'));

        if (!counters.length) {
            return;
        }

        const observer = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }

                const element = entry.target;
                const target = Number((element.textContent || '').replace(/[^\d.]/g, ''));
                animateValue(element, target);
                observer.unobserve(element);
            });
        }, {
            threshold: 0.4
        }) : null;

        counters.forEach(function (counter) {
            if (observer) {
                observer.observe(counter);
                return;
            }

            const target = Number((counter.textContent || '').replace(/[^\d.]/g, ''));
            animateValue(counter, target);
        });
    }

    function initTestimonialCarousels() {
        const wraps = Array.from(document.querySelectorAll('.testimonial-wrap'));

        wraps.forEach(function (wrap) {
            const slides = Array.from(wrap.querySelectorAll('.testimonial-slide'));
            if (slides.length <= 1) {
                return;
            }

            let activeIndex = 0;
            let timerId = null;
            const dots = document.createElement('div');
            dots.className = 'testimonial-dots';

            function showSlide(nextIndex) {
                activeIndex = (nextIndex + slides.length) % slides.length;

                slides.forEach(function (slide, index) {
                    slide.classList.toggle('is-active', index === activeIndex);
                    slide.setAttribute('aria-hidden', String(index !== activeIndex));
                });

                dots.querySelectorAll('button').forEach(function (button, index) {
                    const isActive = index === activeIndex;
                    button.classList.toggle('is-active', isActive);
                    button.setAttribute('aria-current', isActive ? 'true' : 'false');
                });
            }

            function stopAutoplay() {
                if (timerId) {
                    window.clearInterval(timerId);
                    timerId = null;
                }
            }

            function startAutoplay() {
                if (prefersReducedMotion) {
                    return;
                }

                stopAutoplay();
                timerId = window.setInterval(function () {
                    showSlide(activeIndex + 1);
                }, TESTIMONIAL_INTERVAL);
            }

            slides.forEach(function (_, index) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'testimonial-dot';
                dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
                dot.addEventListener('click', function () {
                    showSlide(index);
                    startAutoplay();
                });
                dots.appendChild(dot);
            });

            wrap.parentNode.appendChild(dots);
            wrap.addEventListener('mouseenter', stopAutoplay);
            wrap.addEventListener('mouseleave', startAutoplay);
            wrap.addEventListener('focusin', stopAutoplay);
            wrap.addEventListener('focusout', startAutoplay);

            showSlide(0);
            startAutoplay();
        });
    }

    function initHeroShowcase() {
        const heroVisual = document.querySelector('[data-hero-showcase]');
        if (!heroVisual) {
            return;
        }

        const mainImg = heroVisual.querySelector('[data-hero-main-img]');
        const captionTitle = heroVisual.querySelector('[data-hero-caption-title]');
        const captionUse = heroVisual.querySelector('[data-hero-caption-use]');
        const captionMoq = heroVisual.querySelector('[data-hero-caption-moq]');
        const thumbs = Array.from(heroVisual.querySelectorAll('.home-hero-thumb'));
        const productSelect = heroVisual.querySelector('[data-hero-product-select]');
        const channelPills = Array.from(heroVisual.querySelectorAll('.home-quote-pill'));
        const submitLink = heroVisual.querySelector('[data-hero-quote-submit]');
        const leadEl = heroVisual.querySelector('[data-hero-lead-time]');

        let selectedChannel = 'Retail';

        function syncBriefLink() {
            if (!submitLink) {
                return;
            }
            const productVal = productSelect ? productSelect.value : 'Bath Tissue';
            const params = new URLSearchParams();
            if (productVal) {
                params.set('product', productVal);
            }
            if (selectedChannel) {
                params.set('market', selectedChannel);
            }
            submitLink.setAttribute('href', `contact.html?${params.toString()}`);
        }

        function activateThumb(thumb) {
            if (!thumb) {
                return;
            }

            thumbs.forEach(function (btn) {
                const isActive = btn === thumb;
                btn.classList.toggle('is-active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });

            const src = thumb.getAttribute('data-img');
            const alt = thumb.getAttribute('data-alt') || '';
            const nameKey = thumb.getAttribute('data-name-key');
            const useKey = thumb.getAttribute('data-use-key');
            const moq = thumb.getAttribute('data-moq') || '';
            const lead = thumb.getAttribute('data-lead') || '';
            const productValue = thumb.getAttribute('data-product') || '';

            if (mainImg && src) {
                mainImg.src = src;
                mainImg.alt = alt;
            }

            if (captionTitle && nameKey) {
                captionTitle.setAttribute('data-i18n', nameKey);
                if (window.SiteI18n) {
                    captionTitle.textContent = window.SiteI18n.getText(nameKey, captionTitle.textContent);
                }
            }

            if (captionUse && useKey) {
                captionUse.setAttribute('data-i18n', useKey);
                if (window.SiteI18n) {
                    captionUse.textContent = window.SiteI18n.getText(useKey, captionUse.textContent);
                }
            }

            if (captionMoq && moq) {
                captionMoq.textContent = moq;
            }

            if (leadEl && lead) {
                leadEl.textContent = lead;
            }

            if (productSelect && productValue) {
                productSelect.value = productValue;
            }

            syncBriefLink();
        }

        thumbs.forEach(function (thumb) {
            thumb.addEventListener('click', function () {
                activateThumb(thumb);
            });
        });

        if (productSelect) {
            productSelect.addEventListener('change', function () {
                const match = thumbs.find(function (btn) {
                    return btn.getAttribute('data-product') === productSelect.value;
                });
                if (match) {
                    activateThumb(match);
                } else {
                    syncBriefLink();
                }
            });
        }

        channelPills.forEach(function (pill) {
            pill.addEventListener('click', function () {
                selectedChannel = pill.getAttribute('data-channel') || 'Retail';
                channelPills.forEach(function (btn) {
                    const isActive = btn === pill;
                    btn.classList.toggle('is-active', isActive);
                    btn.setAttribute('aria-pressed', String(isActive));
                });
                syncBriefLink();
            });
        });

        syncBriefLink();
    }

    function initProductFilters() {
        const filterBar = document.querySelector('[data-product-filters]');
        if (!filterBar) {
            return;
        }

        const buttons = Array.from(filterBar.querySelectorAll('.product-filter-btn'));
        const items = Array.from(document.querySelectorAll('[data-product-channels]'));

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                const target = button.getAttribute('data-filter') || 'all';

                buttons.forEach(function (btn) {
                    const isActive = btn === button;
                    btn.classList.toggle('is-active', isActive);
                    btn.setAttribute('aria-pressed', String(isActive));
                });

                items.forEach(function (item) {
                    const channels = (item.getAttribute('data-product-channels') || '').split(/\s+/);
                    const matches = target === 'all' || channels.includes(target);
                    item.classList.toggle('is-hidden', !matches);
                });
            });
        });
    }

    function initPortfolioLightbox() {
        const galleryLinks = Array.from(document.querySelectorAll('[data-lightbox]'));

        if (!galleryLinks.length) {
            return;
        }

        const groups = {};

        galleryLinks.forEach(function (link) {
            const groupName = link.getAttribute('data-lightbox') || 'default';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(link);
        });

        const overlay = document.createElement('div');
        overlay.className = 'site-lightbox';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = [
            '<div class="site-lightbox__backdrop" data-lightbox-close></div>',
            '<div class="site-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Image viewer">',
            '  <button type="button" class="site-lightbox__close" data-lightbox-close aria-label="Close image viewer">&times;</button>',
            '  <button type="button" class="site-lightbox__nav site-lightbox__nav--prev" data-lightbox-prev aria-label="Previous image">&#8249;</button>',
            '  <figure class="site-lightbox__figure">',
            '    <img class="site-lightbox__image" alt="">',
            '    <figcaption class="site-lightbox__caption"></figcaption>',
            '  </figure>',
            '  <button type="button" class="site-lightbox__nav site-lightbox__nav--next" data-lightbox-next aria-label="Next image">&#8250;</button>',
            '</div>'
        ].join('');
        document.body.appendChild(overlay);

        const image = overlay.querySelector('.site-lightbox__image');
        const caption = overlay.querySelector('.site-lightbox__caption');
        const closeButtons = overlay.querySelectorAll('[data-lightbox-close]');
        const prevButton = overlay.querySelector('[data-lightbox-prev]');
        const nextButton = overlay.querySelector('[data-lightbox-next]');
        const closeButton = overlay.querySelector('.site-lightbox__close');
        let activeGroup = [];
        let activeIndex = 0;
        let lastTrigger = null;

        function syncLightbox() {
            const currentLink = activeGroup[activeIndex];
            if (!currentLink) {
                return;
            }

            image.src = currentLink.getAttribute('href') || '';
            image.alt = currentLink.querySelector('img') ? currentLink.querySelector('img').getAttribute('alt') || '' : '';

            const card = currentLink.closest('.portflio-item');
            const content = currentLink.querySelector('.portfolio-item-content')
                || (card ? card.querySelector('.portfolio-item-content') : null);
            caption.innerHTML = content ? content.innerHTML : '';

            const showNav = activeGroup.length > 1;
            prevButton.hidden = !showNav;
            nextButton.hidden = !showNav;
        }

        function closeLightbox() {
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
            image.removeAttribute('src');
            caption.innerHTML = '';
            document.body.classList.remove('site-lightbox-open');
            if (lastTrigger && typeof lastTrigger.focus === 'function') {
                lastTrigger.focus();
            }
        }

        function openLightbox(groupName, index, trigger) {
            lastTrigger = trigger || null;
            activeGroup = (groups[groupName] || []).filter(function (link) {
                const col = link.closest('.product-col');
                return !col || !col.classList.contains('is-hidden');
            });
            const resolvedIndex = activeGroup.indexOf(trigger);
            activeIndex = resolvedIndex >= 0 ? resolvedIndex : Math.min(index, Math.max(activeGroup.length - 1, 0));
            syncLightbox();
            overlay.classList.add('is-open');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('site-lightbox-open');
            closeButton.focus();
        }

        function step(direction) {
            if (!activeGroup.length) {
                return;
            }

            activeIndex = (activeIndex + direction + activeGroup.length) % activeGroup.length;
            syncLightbox();
        }

        galleryLinks.forEach(function (link) {
            link.addEventListener('click', function (event) {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
                    return;
                }

                event.preventDefault();
                const groupName = link.getAttribute('data-lightbox') || 'default';
                openLightbox(groupName, groups[groupName].indexOf(link), link);
            });
        });

        closeButtons.forEach(function (button) {
            button.addEventListener('click', closeLightbox);
        });

        prevButton.addEventListener('click', function () {
            step(-1);
        });

        nextButton.addEventListener('click', function () {
            step(1);
        });

        document.addEventListener('keydown', function (event) {
            if (!overlay.classList.contains('is-open')) {
                return;
            }

            if (event.key === 'Escape') {
                closeLightbox();
            }

            if (event.key === 'ArrowLeft') {
                step(-1);
            }

            if (event.key === 'ArrowRight') {
                step(1);
            }
        });
    }

    onReady(function () {
        initNavToggle();
        initScrollToTop();
        initCounters();
        initTestimonialCarousels();
        initHeroShowcase();
        initProductFilters();
        initPortfolioLightbox();
    });
})();
