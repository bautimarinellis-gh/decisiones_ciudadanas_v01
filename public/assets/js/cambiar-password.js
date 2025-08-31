document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('changePasswordForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const successModal = document.getElementById('successModal');

    // Elementos de requisitos de contraseña
    const requirements = {
        length: document.getElementById('req-length'),
        uppercase: document.getElementById('req-uppercase'),
        lowercase: document.getElementById('req-lowercase'),
        number: document.getElementById('req-number'),
        special: document.getElementById('req-special')
    };

    // Alternar visibilidad de contraseña
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const isPassword = input.type === 'password';
            
            input.type = isPassword ? 'text' : 'password';
            
            // Actualizar icono
            const icon = this.querySelector('svg path');
            if (isPassword) {
                // Ojo con barra (oculto)
                icon.setAttribute('d', 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92 1.41-1.41L3.51 1.93 2.1 3.34l2.36 2.36C4.06 6.71 3.5 7.81 3 9c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l2.42 2.42 1.41-1.41-2.28-2.28C20.84 13.3 21 12.68 21 12c0-2.76-2.24-5-5-5-.68 0-1.32.16-1.89.44l-1.78-1.78C13.32 5.16 12.68 5 12 5c-1.55 0-3.03.3-4.38.84L5.7 3.92C7.68 2.72 9.75 2 12 2c5 0 9.27 3.11 11 7.5-.34.87-.81 1.69-1.38 2.43L20.49 13.06C20.82 12.43 21 11.74 21 11c0-2.76-2.24-5-5-5z');
            } else {
                // Ojo normal
                icon.setAttribute('d', 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z');
            }
        });
    });

    // Validación de contraseña
    function validatePassword(password) {
        const validations = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        // Actualizar indicadores visuales
        Object.keys(validations).forEach(key => {
            const element = requirements[key];
            if (validations[key]) {
                element.classList.add('valid');
            } else {
                element.classList.remove('valid');
            }
        });

        return Object.values(validations).every(valid => valid);
    }

    // Validación de contraseña en tiempo real
    newPasswordInput.addEventListener('input', function() {
        const password = this.value;
        validatePassword(password);
        validateForm();
    });

    // Validación de confirmación de contraseña
    confirmPasswordInput.addEventListener('input', function() {
        validatePasswordMatch();
        validateForm();
    });

    // Validación de contraseña actual
    currentPasswordInput.addEventListener('input', function() {
        validateForm();
    });

    function validatePasswordMatch() {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const errorElement = document.getElementById('confirmPasswordError');
        
        if (confirmPassword && newPassword !== confirmPassword) {
            errorElement.textContent = 'Las contraseñas no coinciden';
            errorElement.classList.add('show');
            confirmPasswordInput.classList.add('error');
            return false;
        } else {
            errorElement.classList.remove('show');
            confirmPasswordInput.classList.remove('error');
            return true;
        }
    }

    function validateForm() {
        const currentPassword = currentPasswordInput.value.trim();
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        const isCurrentPasswordValid = currentPassword.length > 0;
        const isNewPasswordValid = validatePassword(newPassword);
        const isPasswordMatchValid = validatePasswordMatch();
        const isFormValid = isCurrentPasswordValid && isNewPasswordValid && isPasswordMatchValid && confirmPassword.length > 0;
        
        changePasswordBtn.disabled = !isFormValid;
        
        return isFormValid;
    }

    // Envío del formulario
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const formData = {
            currentPassword: currentPasswordInput.value,
            newPassword: newPasswordInput.value,
            confirmPassword: confirmPasswordInput.value
        };

        try {
            showLoading(true);
            
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showLoading(false);
                showSuccessModal();
            } else {
                throw new Error(data.message || 'Error al cambiar la contraseña');
            }
        } catch (error) {
            showLoading(false);
            handleError(error.message);
        }
    });

    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.add('show');
            changePasswordBtn.disabled = true;
        } else {
            loadingOverlay.classList.remove('show');
            changePasswordBtn.disabled = false;
        }
    }

    function showSuccessModal() {
        successModal.classList.add('show');
    }

    function handleError(message) {
        // Check if it's a current password error
        if (message.toLowerCase().includes('contraseña actual') || message.toLowerCase().includes('current password')) {
            const errorElement = document.getElementById('currentPasswordError');
            errorElement.textContent = message;
            errorElement.classList.add('show');
            currentPasswordInput.classList.add('error');
        } else {
            // General error
            alert('Error: ' + message);
        }
    }

    // Limpiar errores cuando el usuario empieza a escribir
    currentPasswordInput.addEventListener('input', function() {
        const errorElement = document.getElementById('currentPasswordError');
        errorElement.classList.remove('show');
        this.classList.remove('error');
    });

    newPasswordInput.addEventListener('input', function() {
        const errorElement = document.getElementById('newPasswordError');
        errorElement.classList.remove('show');
        this.classList.remove('error');
    });

    // Validación inicial
    validateForm();
});

// Funciones globales
function goBack() {
    // Verificar si hay un referrer, de lo contrario ir al dashboard apropiado
    const userData = localStorage.getItem('userData');
    
    if (document.referrer && document.referrer !== window.location.href) {
        window.history.back();
    } else {
        // Fallback al dashboard apropiado basado en el rol del usuario
        if (userData) {
            const user = JSON.parse(userData);
            if (user.rol === 'admin') {
                window.location.href = '/admin/dashboard.html';
            } else {
                window.location.href = '/ciudadano/dashboard.html';
            }
        } else {
            // Si no hay datos de usuario, ir al login
            window.location.href = '/login.html';
        }
    }
}

function redirectToLogin() {
    // Limpiar datos de autenticación
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Redireccionar al login
    window.location.href = '/login.html';
}

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    // Verificar que el token siga siendo válido (simplificado por ahora hasta que el backend esté listo)
    // TODO: Implementar verificación adecuada del token cuando el backend esté listo
    const userData = localStorage.getItem('userData');
    if (!userData) {
        localStorage.removeItem('authToken');
        window.location.href = '/login.html';
        return;
    }
    
    // Por ahora, solo verificar si tenemos datos de usuario válidos
    try {
        JSON.parse(userData);
    } catch (e) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login.html';
    }
});
