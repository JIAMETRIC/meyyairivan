/* ==========================================================================
   MEYYARIVAN — Vanilla JavaScript (Zero Dependencies)
   - Scroll header state
   - Accessible mobile nav drawer
   - Scroll-triggered fade reveals
   - Scroll-spy active nav indicator
   - Enquiry form validation & Formspree-ready JSON submission
   ========================================================================== */

(() => {
  'use strict';

  document.documentElement.classList.add('js');

  // 1. Header scroll state
  const header = document.querySelector('.header');
  const syncHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  // 2. Mobile menu drawer
  const menuBtn = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  const closeMenu = () => {
    if (!menuBtn || !mobileNav) return;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
  };

  const toggleMenu = () => {
    if (!menuBtn || !mobileNav) return;
    const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMenu();
    } else {
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'Close menu');
      mobileNav.classList.add('open');
      mobileNav.setAttribute('aria-hidden', 'false');
    }
  };

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', toggleMenu);
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 961) closeMenu();
    });
  }

  // 3. Scroll reveal animations
  const fadeEls = document.querySelectorAll('.fade');
  if ('IntersectionObserver' in window && fadeEls.length > 0) {
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            fadeObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    fadeEls.forEach((el) => fadeObserver.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add('in'));
  }

  // 4. Scroll-spy for desktop navigation links
  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const observedSections = navLinks
    .map((link) => {
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && observedSections.length > 0) {
    const setActiveLink = (activeSectionId) => {
      navLinks.forEach((link) => {
        const match = link.getAttribute('href') === `#${activeSectionId}`;
        if (match) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    observedSections.forEach(({ section }) => spyObserver.observe(section));
  }

  // 5. Enquiry form validation + submission
  const form = document.getElementById('enquiry-form');
  if (form) {
    const statusBox = document.getElementById('form-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    const defaultBtnHtml = submitBtn ? submitBtn.innerHTML : '';

    const showStatus = (type, message) => {
      if (!statusBox) return;
      statusBox.textContent = message;
      statusBox.className = `form-status show ${type}`;
    };

    const clearStatus = () => {
      if (!statusBox) return;
      statusBox.textContent = '';
      statusBox.className = 'form-status';
    };

    const validateField = (input) => {
      const wrap = input.closest('.field');
      if (!wrap) return true;
      const errEl = wrap.querySelector('.field-error');
      let msg = '';

      if (input.type === 'checkbox') {
        if (input.required && !input.checked) {
          msg = 'Please confirm your consent so we can respond to your enquiry.';
        }
      } else {
        const val = input.value.trim();
        if (input.required && !val) {
          msg = 'This field is required.';
        } else if (input.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          msg = 'Please enter a valid work email address.';
        } else if (input.minLength > 0 && val && val.length < input.minLength) {
          msg = `Please provide at least ${input.minLength} characters so we can understand your enquiry.`;
        }
      }

      if (msg) {
        wrap.classList.add('invalid');
        if (errEl) errEl.textContent = msg;
        return false;
      } else {
        wrap.classList.remove('invalid');
        if (errEl) errEl.textContent = '';
        return true;
      }
    };

    const inputs = form.querySelectorAll('input:not(.hp):not([type="hidden"]), select, textarea');
    inputs.forEach((input) => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.closest('.field')?.classList.contains('invalid')) {
          validateField(input);
        }
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearStatus();

      // Honeypot check
      const hp = form.querySelector('input[name="_honey"], input[name="_gotcha"]');
      if (hp && hp.value.trim() !== '') {
        showStatus('success', 'Thank you. Your enquiry has been received.');
        form.reset();
        return;
      }

      let allValid = true;
      inputs.forEach((input) => {
        if (!validateField(input)) allValid = false;
      });

      if (!allValid) {
        const firstInvalid = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
        if (firstInvalid) firstInvalid.focus();
        showStatus('error', 'Please review the highlighted fields before sending your enquiry.');
        return;
      }

      const actionUrl = (form.getAttribute('action') || '').trim();
      const targetEmail = (form.getAttribute('data-email') || 'meyyairivan@protonmail.com').trim();

      const buildMailtoUrl = () => {
        const name = form.querySelector('#f-name')?.value.trim() || '';
        const email = form.querySelector('#f-email')?.value.trim() || '';
        const company = form.querySelector('#f-company')?.value.trim() || 'N/A';
        const interest = form.querySelector('#f-interest')?.value.trim() || '';
        const message = form.querySelector('#f-message')?.value.trim() || '';
        const subject = encodeURIComponent(`Website Enquiry: ${interest || 'MEYYARIVAN'}`);
        const body = encodeURIComponent(
          `Name: ${name}\nWork Email: ${email}\nCompany: ${company}\nArea of Interest: ${interest}\n\nMessage:\n${message}`
        );
        return `mailto:${targetEmail}?subject=${subject}&body=${body}`;
      };

      if (!actionUrl) {
        window.location.href = buildMailtoUrl();
        showStatus('success', `Opening your email client to send directly to ${targetEmail}.`);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending...';
      }

      try {
        const res = await fetch(actionUrl, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });

        if (res.ok) {
          showStatus('success', `Thank you for reaching out. Your enquiry has been sent to ${targetEmail} and our team will respond shortly.`);
          form.reset();
        } else {
          showStatus('error', `Direct delivery unavailable right now — opening email draft to ${targetEmail}.`);
          window.location.href = buildMailtoUrl();
        }
      } catch (err) {
        showStatus('error', `Could not reach mail relay — opening email draft to ${targetEmail}.`);
        window.location.href = buildMailtoUrl();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = defaultBtnHtml;
        }
      }
    });
  }
})();
