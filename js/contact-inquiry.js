/**
 * 联系表单询盘处理：支持 URL 预填产品与市场、mailto 邮件唤起、
 * WhatsApp 预填直达及一键复制报价简报，降低纯静态站询盘流失。
 */
(function () {
    'use strict';

    const WHATSAPP_NUMBER = '85254452984';

    function buildMailtoUrl(recipient, subject, body) {
        return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    function getFieldValue(formData, key) {
        return String(formData.get(key) || '').trim();
    }

    function collectBrief(form) {
        const formData = new FormData(form);
        const name = getFieldValue(formData, 'name');
        const email = getFieldValue(formData, 'email');
        const product = getFieldValue(formData, 'product');
        const market = getFieldValue(formData, 'market');
        const volume = getFieldValue(formData, 'volume');
        const packaging = getFieldValue(formData, 'packaging');
        const message = getFieldValue(formData, 'message');

        const subjectParts = ['Website Inquiry'];
        if (product) {
            subjectParts.push(product);
        }
        if (market) {
            subjectParts.push(market);
        }

        const bodyLines = [
            'Hello Yame Team,',
            '',
            'I would like to request a quotation with the details below:',
            `Name: ${name || 'Not specified'}`,
            `Email: ${email || 'Not specified'}`,
            `Product Type: ${product || 'Not specified'}`,
            `Target Market: ${market || 'Not specified'}`,
            `Monthly Volume: ${volume || 'Not specified'}`,
            `Packaging / OEM Requirements: ${packaging || 'Not specified'}`,
            '',
            'Additional Requirements:',
            message || 'Please share pricing, MOQ and lead time options.',
            '',
            'Best regards'
        ];

        return {
            subject: subjectParts.join(' - '),
            body: bodyLines.join('\n')
        };
    }

    function applyParamsFromQuery(form) {
        if (typeof URLSearchParams !== 'function') {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const product = params.get('product');
        const market = params.get('market');

        const productSelect = form.querySelector('[data-inquiry-product]');
        if (productSelect && product) {
            const option = Array.from(productSelect.options).find(function (item) {
                return item.value.toLowerCase() === product.toLowerCase();
            });
            if (option) {
                productSelect.value = option.value;
            }
        }

        const marketInput = form.querySelector('input[name="market"]');
        if (marketInput && market && !marketInput.value) {
            marketInput.value = market;
        }
    }

    function copyTextToClipboard(text) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            return navigator.clipboard.writeText(text);
        }

        return new Promise(function (resolve, reject) {
            try {
                const area = document.createElement('textarea');
                area.value = text;
                area.setAttribute('readonly', 'readonly');
                area.style.position = 'fixed';
                area.style.opacity = '0';
                document.body.appendChild(area);
                area.select();
                document.execCommand('copy');
                document.body.removeChild(area);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    function showStatus(statusEl, message) {
        if (!statusEl) {
            return;
        }
        statusEl.textContent = message;
        window.clearTimeout(statusEl._timerId);
        statusEl._timerId = window.setTimeout(function () {
            statusEl.textContent = '';
        }, 4200);
    }

    function getLocalizedText(key, fallback) {
        if (window.SiteI18n && typeof window.SiteI18n.getText === 'function') {
            return window.SiteI18n.getText(key, fallback);
        }
        return fallback;
    }

    function handleInquirySubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const inquiryEmail = form.getAttribute('data-inquiry-email') || 'penny.liao@yametissue.com';
        const brief = collectBrief(form);
        window.location.href = buildMailtoUrl(inquiryEmail, brief.subject, brief.body);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const form = document.getElementById('contact-form');
        const statusEl = document.querySelector('[data-inquiry-status]');

        if (form) {
            applyParamsFromQuery(form);
            form.addEventListener('submit', handleInquirySubmit);

            const whatsappBtn = form.querySelector('[data-inquiry-whatsapp]');
            if (whatsappBtn) {
                whatsappBtn.addEventListener('click', function () {
                    const brief = collectBrief(form);
                    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(brief.body)}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                });
            }

            const copyBtn = form.querySelector('[data-inquiry-copy]');
            if (copyBtn) {
                copyBtn.addEventListener('click', function () {
                    const brief = collectBrief(form);
                    const text = `Subject: ${brief.subject}\n\n${brief.body}`;
                    copyTextToClipboard(text).then(function () {
                        showStatus(statusEl, getLocalizedText('contact_copied_tip', 'Quote brief copied. You can paste it into Gmail, Outlook or WhatsApp.'));
                    }).catch(function () {
                        showStatus(statusEl, getLocalizedText('contact_copy_fallback', 'Copy failed. Please use Email or WhatsApp directly.'));
                    });
                });
            }
        }

        const copyAddressBtn = document.querySelector('[data-copy-address]');
        if (copyAddressBtn) {
            copyAddressBtn.addEventListener('click', function () {
                const address = getLocalizedText(
                    'footer_address',
                    'B-1306, Fortune Plaza, Zhengyang Road, Zhoucun Dist, Zibo, Shandong, China'
                );
                copyTextToClipboard(address).then(function () {
                    const original = copyAddressBtn.textContent;
                    copyAddressBtn.textContent = getLocalizedText('contact_address_copied', 'Address Copied');
                    window.setTimeout(function () {
                        copyAddressBtn.textContent = original;
                    }, 2400);
                });
            });
        }
    });
})();
