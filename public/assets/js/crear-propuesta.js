document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('propuestaForm');
    const tituloInput = document.getElementById('titulo');
    const descripcionTextarea = document.getElementById('descripcion');
    const tituloCounter = document.getElementById('tituloCounter');
    const descripcionCounter = document.getElementById('descripcionCounter');
    const submitBtn = form?.querySelector('button[type="submit"]');

    if (tituloInput && tituloCounter) {
        tituloInput.addEventListener('input', function() {
            const length = this.value.length;
            tituloCounter.textContent = length;
            
            if (length > 100) {
                tituloCounter.style.color = '#dc3545';
                this.classList.add('error');
            } else {
                tituloCounter.style.color = '#666';
                this.classList.remove('error');
            }
        });
    }

    if (descripcionTextarea && descripcionCounter) {
        descripcionTextarea.addEventListener('input', function() {
            const length = this.value.length;
            descripcionCounter.textContent = length;
            
            if (length > 1000) {
                descripcionCounter.style.color = '#dc3545';
                this.classList.add('error');
            } else {
                descripcionCounter.style.color = '#666';
                this.classList.remove('error');
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validateForm()) {
                return;
            }

            const formData = new FormData(form);
            const propuestaData = {
                titulo: formData.get('titulo'),
                descripcion: formData.get('descripcion'),
                barrio: formData.get('barrio'),
                categoria: formData.get('categoria')
            };

            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Enviando...';
                }

                const response = await fetch('/api/propuestas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(propuestaData)
                });

                if (response.ok) {
                    showSuccessMessage('¡Propuesta creada exitosamente!');
                    form.reset();
                    updateCounters();
                    
                    setTimeout(() => {
                        window.location.href = '/admin/dashboard.html';
                    }, 2000);
                } else {
                    const errorData = await response.json();
                    showErrorMessage(errorData.message || 'Error al crear la propuesta');
                }
            } catch (error) {
                console.error('Error:', error);
                showErrorMessage('Error de conexión. Intenta nuevamente.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Publicar propuesta';
                }
            }
        });
    }

    function validateForm() {
        let isValid = true;
        const requiredFields = ['titulo', 'descripcion', 'barrio', 'categoria'];
        
        clearErrors();

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field && !field.value.trim()) {
                showFieldError(field, 'Este campo es obligatorio');
                isValid = false;
            }
        });

        if (tituloInput && tituloInput.value.length > 100) {
            showFieldError(tituloInput, 'El título no puede exceder 100 caracteres');
            isValid = false;
        }

        if (descripcionTextarea && descripcionTextarea.value.length > 1000) {
            showFieldError(descripcionTextarea, 'La descripción no puede exceder 1000 caracteres');
            isValid = false;
        }

        return isValid;
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
        
        const formCard = document.querySelector('.form-card');
        if (formCard) {
            formCard.insertBefore(messageDiv, formCard.firstChild);
        }
    }

    function showErrorMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'error-alert';
        messageDiv.style.cssText = `
            background-color: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid #dc3545;
            margin-bottom: 20px;
        `;
        messageDiv.textContent = message;
        
        const formCard = document.querySelector('.form-card');
        if (formCard) {
            formCard.insertBefore(messageDiv, formCard.firstChild);
        }
    }

    function updateCounters() {
        if (tituloCounter) tituloCounter.textContent = '0';
        if (descripcionCounter) descripcionCounter.textContent = '0';
    }
});

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/admin/';
    }
}
