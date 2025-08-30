document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    if (registerForm) {
        initRegisterForm();
    }

    if (loginForm) {
        initLoginForm();
    }
});

function initRegisterForm() {
    const form = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateRegisterForm()) {
            return;
        }

        const formData = new FormData(form);
        const userData = {
            nombreCompleto: formData.get('nombreCompleto'),
            dni: formData.get('dni'),
            email: formData.get('email'),
            barrio: formData.get('barrio'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        try {
            setFormLoading(true);
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showSuccessMessage('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
                
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                showErrorMessage(data.message || 'Error al crear la cuenta');
            }
        } catch (error) {
            console.error('Error:', error);
            showErrorMessage('Error de conexión. Intenta nuevamente.');
        } finally {
            setFormLoading(false);
        }
    });

    confirmPasswordInput.addEventListener('blur', function() {
        validatePasswordMatch();
    });

    passwordInput.addEventListener('input', function() {
        if (confirmPasswordInput.value) {
            validatePasswordMatch();
        }
    });
}

function initLoginForm() {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateLoginForm()) {
            return;
        }

        const formData = new FormData(form);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            setFormLoading(true);
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                showSuccessMessage('¡Inicio de sesión exitoso! Redirigiendo...');
                
                setTimeout(() => {
                    if (data.user.rol === 'admin') {
                        window.location.href = '/admin/dashboard.html';
                    } else {
                        window.location.href = '/ciudadano/dashboard.html';
                    }
                }, 1500);
            } else {
                showErrorMessage(data.message || 'Credenciales inválidas');
            }
        } catch (error) {
            console.error('Error:', error);
            showErrorMessage('Error de conexión. Intenta nuevamente.');
        } finally {
            setFormLoading(false);
        }
    });
}

function validateRegisterForm() {
    let isValid = true;
    clearErrors();

    const nombreCompleto = document.getElementById('nombreCompleto');
    const dni = document.getElementById('dni');
    const email = document.getElementById('email');
    const barrio = document.getElementById('barrio');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    if (!nombreCompleto.value.trim()) {
        showFieldError(nombreCompleto, 'El nombre completo es obligatorio');
        isValid = false;
    } else if (nombreCompleto.value.trim().length < 2) {
        showFieldError(nombreCompleto, 'El nombre debe tener al menos 2 caracteres');
        isValid = false;
    }

    if (!dni.value.trim()) {
        showFieldError(dni, 'El DNI es obligatorio');
        isValid = false;
    } else if (!/^\d{7,8}$/.test(dni.value.trim())) {
        showFieldError(dni, 'El DNI debe tener entre 7 y 8 dígitos');
        isValid = false;
    }

    if (!email.value.trim()) {
        showFieldError(email, 'El email es obligatorio');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showFieldError(email, 'Ingresa un email válido');
        isValid = false;
    }

    if (!barrio.value) {
        showFieldError(barrio, 'Selecciona un barrio');
        isValid = false;
    }

    if (!password.value) {
        showFieldError(password, 'La contraseña es obligatoria');
        isValid = false;
    } else if (password.value.length < 6) {
        showFieldError(password, 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    }

    if (!confirmPassword.value) {
        showFieldError(confirmPassword, 'Confirma tu contraseña');
        isValid = false;
    } else if (password.value !== confirmPassword.value) {
        showFieldError(confirmPassword, 'Las contraseñas no coinciden');
        isValid = false;
    }

    return isValid;
}

function validateLoginForm() {
    let isValid = true;
    clearErrors();

    const email = document.getElementById('email');
    const password = document.getElementById('password');

    if (!email.value.trim()) {
        showFieldError(email, 'El email es obligatorio');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showFieldError(email, 'Ingresa un email válido');
        isValid = false;
    }

    if (!password.value) {
        showFieldError(password, 'La contraseña es obligatoria');
        isValid = false;
    }

    return isValid;
}

function validatePasswordMatch() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
        showFieldError(confirmPassword, 'Las contraseñas no coinciden');
        return false;
    } else {
        clearFieldError(confirmPassword);
        return true;
    }
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        field.parentNode.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function clearErrors() {
    const errorFields = document.querySelectorAll('.error');
    const errorMessages = document.querySelectorAll('.error-message');
    
    errorFields.forEach(field => field.classList.remove('error'));
    errorMessages.forEach(message => message.remove());
    
    const existingMessages = document.querySelectorAll('.success-message, .error-alert');
    existingMessages.forEach(message => message.remove());
}

function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    const form = document.querySelector('.auth-form');
    if (form) {
        form.parentNode.insertBefore(messageDiv, form);
    }
}

function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-alert';
    messageDiv.textContent = message;
    
    const form = document.querySelector('.auth-form');
    if (form) {
        form.parentNode.insertBefore(messageDiv, form);
    }
}

function setFormLoading(loading) {
    const form = document.querySelector('.auth-form');
    const submitBtn = form?.querySelector('button[type="submit"]');
    
    if (loading) {
        form?.classList.add('loading');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Procesando...';
        }
    } else {
        form?.classList.remove('loading');
        if (submitBtn) {
            submitBtn.disabled = false;
            if (submitBtn.closest('#registerForm')) {
                submitBtn.textContent = 'Registrarse';
            } else {
                submitBtn.textContent = 'Iniciar sesión';
            }
        }
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentNode.querySelector('.toggle-password');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
        `;
    } else {
        input.type = 'password';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
        `;
    }
}

function showComingSoon() {
    alert('Función de recuperar contraseña próximamente disponible.');
}

function isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    return token && userData;
}

function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/login.html';
}
