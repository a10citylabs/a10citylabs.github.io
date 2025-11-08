/**
 * A10city Labs - Main JavaScript
 * Handles navigation and clean URLs
 */

(function() {
    'use strict';

    // Handle navigation links
    function initNavigation() {
        // Get all internal navigation links
        const navLinks = document.querySelectorAll('a[href^="index.html"], a[href^="courses.html"], a[href^="projects.html"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                const cleanUrl = '/' + href.replace('.html', '');
                
                // Update URL without page reload
                history.pushState(null, '', cleanUrl === '/index' ? '/' : cleanUrl);
                
                // Load the page
                window.location.href = href;
            });
        });
    }

    // Update active navigation state
    function updateActiveNav() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            // Exact match for home page
            if (currentPath === '/' && href === '/') {
                link.classList.add('active');
            } 
            // Match for other pages - must match exactly or start with the path followed by /
            else if (href !== '/' && currentPath !== '/' && 
                     (currentPath === href || currentPath.startsWith(href + '/'))) {
                link.classList.add('active');
            }
        });
    }

    // Clean URLs in navigation
    function cleanNavUrls() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const cleanHref = href.replace('.html', '');
                link.setAttribute('data-page', href); // Store original for loading
                // Keep href as is for fallback, but we'll handle click with JS
            }
        });
    }

    // Smooth scroll to top on navigation
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Add fade-in animation on page load
    function initPageAnimation() {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease-in';
        
        window.addEventListener('load', function() {
            document.body.style.opacity = '1';
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            updateActiveNav();
            cleanNavUrls();
            initPageAnimation();
        });
    } else {
        updateActiveNav();
        cleanNavUrls();
        initPageAnimation();
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', function() {
        updateActiveNav();
    });

})();