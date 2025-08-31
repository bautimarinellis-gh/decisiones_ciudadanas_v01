document.addEventListener('DOMContentLoaded', function() {
    // Verificar si tenemos un token de reset en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // Si tenemos un token, mostrar el formulario de reset de contraseña
        showStep('resetPasswordStep');
        initResetPasswordForm(token);
    } else {
        // Mostrar el formulario de solicitud de reset
        showStep('requestStep');
        initRequestResetForm();
    }
    
    // Inicializar funcionalidad de alternar contraseña
    initPasswordToggles();
});

let resendCountdown = 300; // 5 minutos
let countdownInterval;

function initRequestResetForm() {
    const form = document.getElementById('requestResetForm');
    const emailInput = document.getElementById('email');
    const submitBtn = document.getElementById('requestResetBtn');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        if (!email) {
            showError('emailError', 'Por favor ingresa tu email');
            return;
        }
        
        if (!isValidEmail(email)) {
            showError('emailError', 'Por favor ingresa un email válido');
            return;
        }
        
        try {
            showLoading('Enviando email de recuperación...');
            
            const response = await fetch('/api/auth/request-password-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                hideLoading();
                document.getElementById('sentToEmail').textContent = email;
                showStep('emailSentStep');
                startResendCountdown();
            } else {
                throw new Error(data.message || 'Error al enviar el email');
            }
        } catch (error) {
            hideLoading();
            if (error.message.includes('rate limit') || error.message.includes('límite')) {
                showError('emailError', 'Has alcanzado el límite de solicitudes. Intenta de nuevo en 15 minutos.');
            } else if (error.message.includes('not found') || error.message.includes('no encontrado')) {
                showError('emailError', 'No existe una cuenta con este email.');
            } else {
                showError('emailError', error.message);
            }
        }
    });
    
    // Clear errors on input
    emailInput.addEventListener('input', function() {
        clearError('emailError');
        this.classList.remove('error');
    });
}

function initResetPasswordForm(token) {
    const form = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmNewPassword');
    const submitBtn = document.getElementById('resetPasswordBtn');
    
    // Password requirements elements
    const requirements = {
        length: document.getElementById('req-length'),
        uppercase: document.getElementById('req-uppercase'),
        lowercase: document.getElementById('req-lowercase'),
        number: document.getElementById('req-number'),
        special: document.getElementById('req-special')
    };
    
    // Real-time password validation
    newPasswordInput.addEventListener('input', function() {
        const password = this.value;
        validatePassword(password, requirements);
        validateForm();
    });
    
    confirmPasswordInput.addEventListener('input', function() {
        validatePasswordMatch();
        validateForm();
    });
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        try {
            showLoading('Restableciendo contraseña...');
            
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    newPassword,
                    confirmPassword
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                hideLoading();
                showStep('successStep');
            } else {
                throw new Error(data.message || 'Error al restablecer la contraseña');
            }
        } catch (error) {
            hideLoading();
            if (error.message.includes('token') || error.message.includes('expired') || error.message.includes('invalid')) {
                alert('El enlace de recuperación ha expirado o es inválido. Por favor solicita uno nuevo.');
                window.location.href = '/reset-password.html';
            } else {
                showError('newPasswordError', error.message);
            }
        }
    });
    
    function validatePasswordMatch() {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword && newPassword !== confirmPassword) {
            showError('confirmPasswordError', 'Las contraseñas no coinciden');
            confirmPasswordInput.classList.add('error');
            return false;
        } else {
            clearError('confirmPasswordError');
            confirmPasswordInput.classList.remove('error');
            return true;
        }
    }
    
    function validateForm() {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        const isPasswordValid = validatePassword(newPassword, requirements);
        const isMatchValid = validatePasswordMatch();
        const isFormValid = isPasswordValid && isMatchValid && confirmPassword.length > 0;
        
        submitBtn.disabled = !isFormValid;
        return isFormValid;
    }
    
    // Clear errors on input
    newPasswordInput.addEventListener('input', function() {
        clearError('newPasswordError');
        this.classList.remove('error');
    });
    
    confirmPasswordInput.addEventListener('input', function() {
        clearError('confirmPasswordError');
        this.classList.remove('error');
    });
    
    // Initial validation
    validateForm();
}

function startResendCountdown() {
    const resendBtn = document.getElementById('resendBtn');
    const countdownSpan = document.getElementById('countdown');
    const resendText = document.getElementById('resendText');
    
    resendCountdown = 300; // Reset to 5 minutes
    
    countdownInterval = setInterval(function() {
        resendCountdown--;
        
        const minutes = Math.floor(resendCountdown / 60);
        const seconds = resendCountdown % 60;
        countdownSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (resendCountdown <= 0) {
            clearInterval(countdownInterval);
            resendText.textContent = 'Reenviar Email';
            resendBtn.disabled = false;
            
            resendBtn.onclick = function() {
                const email = document.getElementById('sentToEmail').textContent;
                resendResetEmail(email);
            };
        }
    }, 1000);
}

async function resendResetEmail(email) {
    const resendBtn = document.getElementById('resendBtn');
    const originalText = resendBtn.innerHTML;
    
    try {
        resendBtn.disabled = true;
        resendBtn.innerHTML = 'Enviando...';
        
        const response = await fetch('/api/auth/request-password-reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            resendBtn.innerHTML = '✓ Enviado';
            setTimeout(() => {
                startResendCountdown();
            }, 2000);
        } else {
            throw new Error(data.message || 'Error al reenviar el email');
        }
    } catch (error) {
        resendBtn.disabled = false;
        resendBtn.innerHTML = originalText;
        alert('Error al reenviar el email: ' + error.message);
    }
}

function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const isPassword = input.type === 'password';
            
            input.type = isPassword ? 'text' : 'password';
            
            // Update icon
            const icon = this.querySelector('svg path');
            if (isPassword) {
                // Eye with slash (hidden)
                icon.setAttribute('d', 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92 1.41-1.41L3.51 1.93 2.1 3.34l2.36 2.36C4.06 6.71 3.5 7.81 3 9c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l2.42 2.42 1.41-1.41-2.28-2.28C20.84 13.3 21 12.68 21 12c0-2.76-2.24-5-5-5-.68 0-1.32.16-1.89.44l-1.78-1.78C13.32 5.16 12.68 5 12 5c-1.55 0-3.03.3-4.38.84L5.7 3.92C7.68 2.72 9.75 2 12 2c5 0 9.27 3.11 11 7.5-.34.87-.81 1.69-1.38 2.43L20.49 13.06C20.82 12.43 21 11.74 21 11c0-2.76-2.24-5-5-5z');
            } else {
                // Regular eye
                icon.setAttribute('d', 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z');
            }
        });
    });
}

function validatePassword(password, requirements) {
    const validations = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Update visual indicators
    Object.keys(validations).forEach(key => {
        const element = requirements[key];
        if (element) {
            if (validations[key]) {
                element.classList.add('valid');
            } else {
                element.classList.remove('valid');
            }
        }
    });
    
    return Object.values(validations).every(valid => valid);
}

function showStep(stepId) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show the requested step
    document.getElementById(stepId).classList.add('active');
}

function showLoading(message) {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    loadingText.textContent = message;
    overlay.classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function goToLogin() {
    window.location.href = '/login.html';
}
