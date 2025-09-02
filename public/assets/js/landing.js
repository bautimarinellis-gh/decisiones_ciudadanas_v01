// Landing page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la aplicación
    initLanding();
});

// Función principal de inicialización
async function initLanding() {
    try {
        // Verificar estado de autenticación
        await checkAuthStatus();
        
        // Configurar navegación
        setupNavigation();
        
        // Configurar FAQ
        setupFAQ();
        
        // Configurar scroll suave
        setupSmoothScroll();
        
        // Configurar navbar sticky
        setupStickyNavbar();
        
        // Configurar responsive design
        setupResponsiveFeatures();
        
    } catch (error) {
        console.error('Error inicializando landing:', error);
    }
}

// Verificar estado de autenticación
async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        // Usuario no autenticado - mostrar botones de login/register
        showUnauthenticatedState();
        return;
    }
    
    try {
        // Validar token con el servidor
        const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            // Usuario autenticado - mostrar botón de dashboard
            showAuthenticatedState(userData.user);
        } else {
            // Token inválido - limpiar y mostrar estado no autenticado
            clearAuthData();
            showUnauthenticatedState();
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        // En caso de error, asumir no autenticado
        showUnauthenticatedState();
    }
}

// Mostrar estado no autenticado
function showUnauthenticatedState() {
    // Navbar
    const navAuthButtons = document.getElementById('auth-buttons');
    const navAuthenticatedUser = document.getElementById('authenticated-user');
    
    if (navAuthButtons) navAuthButtons.style.display = 'flex';
    if (navAuthenticatedUser) navAuthenticatedUser.style.display = 'none';
}

// Mostrar estado autenticado
function showAuthenticatedState(userData) {
    // Navbar
    const navAuthButtons = document.getElementById('auth-buttons');
    const navAuthenticatedUser = document.getElementById('authenticated-user');
    const dashboardBtn = document.getElementById('dashboard-btn');
    
    if (navAuthButtons) navAuthButtons.style.display = 'none';
    if (navAuthenticatedUser) navAuthenticatedUser.style.display = 'block';
    
    // Configurar enlace del dashboard según el rol
    if (dashboardBtn) {
        const dashboardUrl = userData.rol === 'admin' 
            ? '/admin/dashboard.html' 
            : '/ciudadano/dashboard.html';
        dashboardBtn.href = dashboardUrl;
    }
}

// Limpiar datos de autenticación
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
}

// Configurar navegación
function setupNavigation() {
    // Navegación móvil
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const body = document.body;
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            body.classList.toggle('nav-open'); // Prevenir scroll del body
        });
        
        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                body.classList.remove('nav-open');
            }
        });
    }
    
    // Cerrar menú móvil al hacer clic en un enlace
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu) navMenu.classList.remove('active');
            if (navToggle) navToggle.classList.remove('active');
            if (body) body.classList.remove('nav-open');
        });
    });
    
    // Cerrar menú al cambiar tamaño de ventana
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            if (navMenu) navMenu.classList.remove('active');
            if (navToggle) navToggle.classList.remove('active');
            if (body) body.classList.remove('nav-open');
        }
    });
}

// Configurar FAQ
function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', function() {
                toggleFAQ(item);
            });
        }
    });
}

// Alternar FAQ
function toggleFAQ(faqItem) {
    const isActive = faqItem.classList.contains('active');
    
    // Si el FAQ clickeado ya está activo, solo cerrarlo
    if (isActive) {
        faqItem.classList.remove('active');
        return;
    }
    
    // Cerrar todos los FAQ
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Abrir el FAQ clickeado
    faqItem.classList.add('active');
}

// Configurar scroll suave
function setupSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Ajustar por navbar sticky
                
                // Scroll suave con fallback para navegadores que no lo soportan
                if ('scrollBehavior' in document.documentElement.style) {
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback para navegadores antiguos
                    window.scrollTo(0, offsetTop);
                }
            }
        });
    });
}

// Configurar navbar sticky
function setupStickyNavbar() {
    const navbar = document.getElementById('navbar');
    let lastScrollTop = 0;
    let ticking = false;
    
    function updateNavbar() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    });
}

// Configurar características responsive
function setupResponsiveFeatures() {
    // Detectar dispositivo táctil
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
    }
    
    // Optimizar para dispositivos móviles
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-device');
    }
    
    // Escuchar cambios de orientación
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            // Ajustar scroll después del cambio de orientación
            const activeElement = document.querySelector('.faq-item.active');
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'auto', block: 'nearest' });
            }
        }, 100);
    });
    
    // Optimizar scroll para dispositivos móviles
    if (isTouchDevice) {
        let startY = 0;
        let startX = 0;
        
        document.addEventListener('touchstart', function(e) {
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        document.addEventListener('touchmove', function(e) {
            if (!startY || !startX) return;
            
            const deltaY = e.touches[0].clientY - startY;
            const deltaX = e.touches[0].clientX - startX;
            
            // Prevenir scroll horizontal en dispositivos móviles
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault();
            }
        }, { passive: false });
    }
}

// Función para mostrar "próximamente" (usada en footer)
function showComingSoon() {
    // Crear notificación personalizada en lugar de alert
    const notification = document.createElement('div');
    notification.className = 'coming-soon-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span>Esta funcionalidad estará disponible próximamente.</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Estilos inline para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        margin: 0;
        line-height: 1;
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Configurar cierre
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Función para verificar si el usuario está autenticado (para uso externo)
function isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    return token && userData;
}

// Función para obtener datos del usuario (para uso externo)
function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Función para logout (para uso externo)
async function logout() {
    try {
        const token = localStorage.getItem('authToken');
        
        if (token) {
            // Llamar al endpoint de logout para invalidar el token
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('Error al hacer logout:', error);
    } finally {
        // Limpiar datos locales siempre
        clearAuthData();
        // Recargar la página para actualizar el estado
        window.location.reload();
    }
}

// Función para manejar lazy loading de imágenes (si se agregan en el futuro)
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Función para optimizar performance en dispositivos móviles
function optimizeMobilePerformance() {
    if (window.innerWidth <= 768) {
        // Reducir animaciones en móviles para mejor performance
        document.documentElement.style.setProperty('--transition-duration', '0.2s');
        
        // Deshabilitar hover effects en dispositivos táctiles
        if ('ontouchstart' in window) {
            document.body.classList.add('no-hover');
        }
    }
}

// Exportar funciones para uso global
window.showComingSoon = showComingSoon;
window.toggleFAQ = toggleFAQ;
window.isAuthenticated = isAuthenticated;
window.getUserData = getUserData;
window.logout = logout;
