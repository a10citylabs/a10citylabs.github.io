/**
 * A10city - Accessible JavaScript
 * WCAG 2.1 AA Compliant Navigation and Interaction Handling
 */

(function() {
    'use strict';

    // ===== Reduced Motion Detection =====
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    function handleReducedMotion() {
        document.documentElement.classList.toggle('reduce-motion', prefersReducedMotion.matches);
    }
    
    prefersReducedMotion.addEventListener('change', handleReducedMotion);
    handleReducedMotion();

    // ===== Skip Link Focus Management =====
    function initSkipLinks() {
        const skipLinks = document.querySelectorAll('.skip-link');
        
        skipLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    e.preventDefault();
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                    
                    // Remove tabindex after blur to maintain natural tab order
                    target.addEventListener('blur', function() {
                        this.removeAttribute('tabindex');
                    }, { once: true });
                }
            });
        });
    }

    // ===== Active Navigation State =====
    function setActiveNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const isActive = currentPath.endsWith(href) || 
                           (currentPath === '/' && href === 'index.html') ||
                           (currentPath.endsWith('/') && href === 'index.html');
            
            if (isActive) {
                link.setAttribute('aria-current', 'page');
                link.classList.add('active');
            } else {
                link.removeAttribute('aria-current');
                link.classList.remove('active');
            }
        });
    }

    // ===== External Link Management =====
    function initExternalLinks() {
        const links = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])');
        
        links.forEach(link => {
            // Add security attributes
            link.setAttribute('rel', 'noopener noreferrer');
            
            // If opens in new tab, add screen reader warning
            if (link.getAttribute('target') === '_blank') {
                // Check if warning already exists
                if (!link.querySelector('.sr-only')) {
                    const warning = document.createElement('span');
                    warning.className = 'sr-only';
                    warning.textContent = ' (opens in new tab)';
                    link.appendChild(warning);
                }
            }
        });
    }

    // ===== Focus Trap for Modals =====
    function createFocusTrap(element) {
        const focusableElements = element.querySelectorAll(
            'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        function handleKeydown(e) {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
        
        element.addEventListener('keydown', handleKeydown);
        
        return {
            activate: () => firstFocusable?.focus(),
            deactivate: () => element.removeEventListener('keydown', handleKeydown)
        };
    }

    // ===== Announce Page Changes for Screen Readers =====
    function announcePageChange(message) {
        let announcer = document.getElementById('page-announcer');
        
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'page-announcer';
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            document.body.appendChild(announcer);
        }
        
        // Clear and set new message (triggers announcement)
        announcer.textContent = '';
        setTimeout(() => {
            announcer.textContent = message;
        }, 100);
    }

    // ===== Mobile Navigation Toggle =====
    function initMobileNav() {
        const navToggle = document.querySelector('.nav-toggle');
        const nav = document.querySelector('.main-nav');
        
        if (!navToggle || !nav) return;
        
        navToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            nav.classList.toggle('is-open');
            
            // Announce state change
            announcePageChange(isExpanded ? 'Navigation menu closed' : 'Navigation menu opened');
        });
        
        // Close on escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && nav.classList.contains('is-open')) {
                navToggle.setAttribute('aria-expanded', 'false');
                nav.classList.remove('is-open');
                navToggle.focus();
                announcePageChange('Navigation menu closed');
            }
        });
    }

    // ===== Smooth Scroll with Reduced Motion Support =====
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    e.preventDefault();
                    
                    if (prefersReducedMotion.matches) {
                        target.scrollIntoView();
                    } else {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                    
                    // Set focus for accessibility
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                }
            });
        });
    }

    // ===== Form Validation Announcements =====
    function initFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                const invalidFields = this.querySelectorAll(':invalid');
                
                if (invalidFields.length > 0) {
                    e.preventDefault();
                    
                    // Focus first invalid field
                    invalidFields[0].focus();
                    
                    // Announce error count
                    announcePageChange(`Form has ${invalidFields.length} error${invalidFields.length > 1 ? 's' : ''}. Please correct and try again.`);
                }
            });
            
            // Real-time validation feedback
            form.querySelectorAll('input, textarea, select').forEach(field => {
                field.addEventListener('blur', function() {
                    if (!this.validity.valid) {
                        this.setAttribute('aria-invalid', 'true');
                    } else {
                        this.removeAttribute('aria-invalid');
                    }
                });
            });
        });
    }

    // ===== Keyboard Navigation Helpers =====
    function initKeyboardHelpers() {
        // Add visible focus for keyboard users only
        document.body.addEventListener('mousedown', () => {
            document.body.classList.add('using-mouse');
        });
        
        document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.remove('using-mouse');
            }
        });
    }

    // ===== Initialize All Features =====
    function init() {
        initSkipLinks();
        setActiveNavigation();
        initExternalLinks();
        initMobileNav();
        initSmoothScroll();
        initFormValidation();
        initKeyboardHelpers();
        
        // Announce page load for SPA-like navigation
        const pageTitle = document.title;
        if (pageTitle) {
            announcePageChange(`Page loaded: ${pageTitle}`);
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose utility functions for external use
    window.A10city = {
        announcePageChange,
        createFocusTrap,
        prefersReducedMotion: () => prefersReducedMotion.matches
    };

})();