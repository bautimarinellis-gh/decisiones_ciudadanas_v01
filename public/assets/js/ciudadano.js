document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
    loadPropuestas();
    setupFilters();
});

// Recargar datos cuando la página vuelve a estar visible (usuario regresa)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // La página volvió a estar visible, recargar datos
        loadPropuestas();
    }
});

// También recargar cuando la ventana vuelve a tener foco
window.addEventListener('focus', function() {
    loadPropuestas();
});

let propuestasData = [];
let filteredPropuestas = [];

function initDashboard() {
    const userData = getUserData();
    
    if (!userData) {
        window.location.href = '/login.html';
        return;
    }

    updateUserInfo(userData);
}

function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

function updateUserInfo(userData) {
    const userName = document.getElementById('userName');
    const userInitials = document.getElementById('userInitials');
    const welcomeMessage = document.getElementById('welcomeMessage');

    if (userName) userName.textContent = userData.nombreCompleto;
    if (welcomeMessage) welcomeMessage.textContent = `¡Bienvenido, ${userData.nombreCompleto.split(' ')[0]}!`;
    
    if (userInitials) {
        const initials = userData.nombreCompleto
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
        userInitials.textContent = initials;
    }
}

async function loadPropuestas() {
    try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch('/api/propuestas', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            propuestasData = data.data || [];
            filteredPropuestas = [...propuestasData];
            await renderPropuestas(filteredPropuestas);
        } else {
            console.error('Error al cargar propuestas:', response.status);
            showNoPropuestas('Error al cargar las propuestas');
        }
    } catch (error) {
        console.error('Error:', error);
        showNoPropuestas('Error de conexión');
    }
}

async function renderPropuestas(propuestas) {
    const grid = document.getElementById('propuestasGrid');
    
    if (!propuestas || propuestas.length === 0) {
        showNoPropuestas('No se encontraron propuestas');
        return;
    }

    // Crear todas las tarjetas con datos reales de votos
    const tarjetasPromises = propuestas.map(propuesta => createPropuestaCard(propuesta));
    const tarjetas = await Promise.all(tarjetasPromises);
    
    grid.innerHTML = tarjetas.join('');
}

async function createPropuestaCard(propuesta) {
    const estadoClass = propuesta.estado.toLowerCase().replace(/\s+/g, '-');
    const fechaCreacion = new Date(propuesta.fechaCreacion).toLocaleDateString('es-ES');
    
    // Obtener votos reales de la API
    let votosPositivos = 0;
    try {
        const votosResponse = await fetch(`/api/votos/propuesta/${propuesta._id}/stats`);
        if (votosResponse.ok) {
            const votosData = await votosResponse.json();
            votosPositivos = votosData.data.totalVotos || 0;
        }
    } catch (error) {
        console.error('Error al cargar votos:', error);
    }
    
    // Obtener comentarios reales de la API
    let comentarios = 0;
    try {
        const comentariosResponse = await fetch(`/api/comentarios/propuesta/${propuesta._id}/stats`);
        if (comentariosResponse.ok) {
            const comentariosData = await comentariosResponse.json();
            comentarios = comentariosData.data.totalComentarios || 0;
        }
    } catch (error) {
        console.error('Error al cargar comentarios:', error);
    }

    return `
        <div class="propuesta-card estado-${estadoClass}">
            <div class="propuesta-header">
                <span class="propuesta-estado estado-${estadoClass}">
                    ${propuesta.estado}
                </span>
            </div>
            
            <h3 class="propuesta-titulo">${propuesta.titulo}</h3>
            
            <p class="propuesta-descripcion">${propuesta.descripcion}</p>
            
            <div class="propuesta-meta">
                <div class="propuesta-autor">
                    <strong>Por:</strong> Municipio de la Ciudad
                </div>
                <div>
                    <span class="propuesta-categoria">${propuesta.categoria}</span>
                    ${propuesta.barrio !== 'Ninguno' ? `<span class="propuesta-categoria">${propuesta.barrio}</span>` : ''}
                </div>
            </div>
            
            <div class="propuesta-footer">
                <div class="propuesta-stats">
                    <div class="stats-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 10v12"/>
                            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
                        </svg>
                        <span>${votosPositivos}</span>
                    </div>
                    <div class="stats-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>${comentarios}</span>
                    </div>
                </div>
                <button class="btn-ver-detalles" onclick="verDetalles('${propuesta._id}')">
                    Ver detalles
                </button>
            </div>
        </div>
    `;
}

function showNoPropuestas(message = 'No hay propuestas disponibles') {
    const grid = document.getElementById('propuestasGrid');
    grid.innerHTML = `
        <div class="no-propuestas">
            <h3>Sin propuestas</h3>
            <p>${message}</p>
        </div>
    `;
}

function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const estadoFilter = document.getElementById('estadoFilter');
    const categoriaFilter = document.getElementById('categoriaFilter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }

    if (estadoFilter) {
        estadoFilter.addEventListener('change', applyFilters);
    }

    if (categoriaFilter) {
        categoriaFilter.addEventListener('change', applyFilters);
    }
}

async function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const estadoFilter = document.getElementById('estadoFilter')?.value || '';
    const categoriaFilter = document.getElementById('categoriaFilter')?.value || '';

    filteredPropuestas = propuestasData.filter(propuesta => {
        const matchesSearch = propuesta.titulo.toLowerCase().includes(searchTerm) ||
                            propuesta.descripcion.toLowerCase().includes(searchTerm);
        
        const matchesEstado = !estadoFilter || propuesta.estado === estadoFilter;
        const matchesCategoria = !categoriaFilter || propuesta.categoria === categoriaFilter;

        return matchesSearch && matchesEstado && matchesCategoria;
    });

    await renderPropuestas(filteredPropuestas);
}

function verDetalles(propuestaId) {
    window.location.href = `/ciudadano/ver-detalles.html?id=${propuestaId}`;
}

function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.classList.toggle('show');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/login.html';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Cerrar menú de usuario al hacer clic fuera
document.addEventListener('click', function(event) {
    const userMenu = document.getElementById('userMenu');
    const userMenuBtn = document.querySelector('.user-menu-btn');
    
    if (userMenu && userMenuBtn && 
        !userMenuBtn.contains(event.target) && 
        !userMenu.contains(event.target)) {
        userMenu.classList.remove('show');
    }
});
