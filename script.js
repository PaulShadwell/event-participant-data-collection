/**
 * Event Participant Registration Form
 * Aquis Capital - events.aquis-capital.com
 */

(function () {
    'use strict';

    const form = document.getElementById('registration-form');
    const submitBtn = document.getElementById('submit-btn');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');

    // Email validation regex (RFC 5322 compliant, simplified)
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const companyInput = document.getElementById('company');
    const privateCheckbox = document.getElementById('privateIndividual');

    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // "Private Individual" checkbox toggles the company text field
    privateCheckbox.addEventListener('change', function () {
        if (this.checked) {
            companyInput.value = 'Private Individual';
            companyInput.disabled = true;
            companyInput.classList.remove('invalid');
            companyInput.classList.add('valid');
            document.getElementById('company-error').textContent = '';
        } else {
            companyInput.value = '';
            companyInput.disabled = false;
            companyInput.classList.remove('valid');
            companyInput.focus();
        }
    });

    /**
     * Validate email address
     */
    function isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const trimmed = email.trim();
        if (trimmed.length > 254) return false;
        return EMAIL_REGEX.test(trimmed);
    }

    /**
     * Validate form fields
     */
    function validateForm() {
        let isValid = true;

        const fullName = document.getElementById('fullName');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        const company = document.getElementById('company');

        const fullNameError = document.getElementById('fullName-error');
        const emailError = document.getElementById('email-error');
        const phoneError = document.getElementById('phone-error');
        const companyError = document.getElementById('company-error');

        // Reset states
        [fullName, email, phone, company].forEach(el => {
            el.classList.remove('invalid', 'valid');
        });
        [fullNameError, emailError, phoneError, companyError].forEach(el => {
            el.textContent = '';
        });

        // Full name validation
        const fullNameValue = fullName.value.trim();
        if (!fullNameValue) {
            fullNameError.textContent = 'Please enter your full name';
            fullName.classList.add('invalid');
            isValid = false;
        } else {
            fullName.classList.add('valid');
        }

        // Email validation
        const emailValue = email.value.trim();
        if (!emailValue) {
            emailError.textContent = 'Please enter your email address';
            email.classList.add('invalid');
            isValid = false;
        } else if (!isValidEmail(emailValue)) {
            emailError.textContent = 'Please enter a valid email address';
            email.classList.add('invalid');
            isValid = false;
        } else {
            email.classList.add('valid');
        }

        // Phone validation
        const phoneValue = phone.value.trim();
        if (!phoneValue) {
            phoneError.textContent = 'Please enter your phone number';
            phone.classList.add('invalid');
            isValid = false;
        } else {
            phone.classList.add('valid');
        }

        // Company validation
        const companyValue = company.value.trim();
        if (!companyValue) {
            companyError.textContent = 'Please enter your company name or select Private Individual';
            company.classList.add('invalid');
            isValid = false;
        } else {
            company.classList.add('valid');
        }

        return isValid;
    }

    /**
     * Show/hide messages
     */
    function showSuccess() {
        successMessage.hidden = false;
        errorMessage.hidden = true;
    }

    function showError() {
        successMessage.hidden = true;
        errorMessage.hidden = false;
    }

    function hideMessages() {
        successMessage.hidden = true;
        errorMessage.hidden = true;
    }

    /**
     * Submit form data to API
     */
    async function submitForm(formData) {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const msg = errorData.detail
                ? `${errorData.error}: ${errorData.detail}`
                : (errorData.error || `Server error: ${response.status}`);
            throw new Error(msg);
        }

        return response.json();
    }

    /**
     * Handle form submission
     */
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        hideMessages();

        if (!validateForm()) {
            return;
        }

        const formData = {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            company: document.getElementById('company').value.trim(),
        };

        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        try {
            await submitForm(formData);
            showSuccess();
            form.reset();
            companyInput.disabled = false;
            privateCheckbox.checked = false;
            document.querySelectorAll('.form-group input').forEach(el => {
                el.classList.remove('valid', 'invalid');
            });
        } catch (err) {
            console.error('Submission error:', err);
            errorMessage.textContent = err.message || 'An error occurred. Please try again later.';
            showError();
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    });

    // Real-time email validation on blur
    document.getElementById('email').addEventListener('blur', function () {
        const email = this.value.trim();
        const errorEl = document.getElementById('email-error');
        if (email && !isValidEmail(email)) {
            errorEl.textContent = 'Please enter a valid email address';
            this.classList.add('invalid');
        } else if (email) {
            errorEl.textContent = '';
            this.classList.remove('invalid');
            this.classList.add('valid');
        }
    });

    // Clear error on input
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function () {
            this.classList.remove('invalid');
            document.getElementById(this.id + '-error').textContent = '';
        });
    });
})();
