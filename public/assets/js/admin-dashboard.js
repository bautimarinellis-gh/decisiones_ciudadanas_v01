document.addEventListener('DOMContentLoaded', function() {
    initAdminDashboard();
    loadMetrics();
    loadPropuestasTable();
    setupFilters();
});

let propuestasData = [];
let currentPropuestaId = null;

function initAdminDashboard() {
    const userData = getUserData();
    
    if (!userData) {
        window.location.href = '/login.html';
        return;
    }

    if (userData.rol !== 'admin') {
        alert('Acceso denegado. Solo administradores pueden acceder a esta página.');
        window.location.href = '/ciudadano/dashboard.html';
        return;
    }

    updateAdminInfo(userData);
}

function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

function updateAdminInfo(userData) {
    const adminName = document.getElementById('adminName');
    const adminInitials = document.getElementById('adminInitials');

    if (adminName) adminName.textContent = userData.nombreCompleto;
    
    if (adminInitials) {
        const initials = userData.nombreCompleto
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
        adminInitials.textContent = initials;
    }
}

async function loadMetrics() {
    try {
        const token = localStorage.getItem('authToken');
        let propuestas = [];
        let usuarios = [];
        let totalVotos = 0;
        
        // Cargar propuestas para calcular métricas
        const propuestasResponse = await fetch('/api/propuestas', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (propuestasResponse.ok) {
            const propuestasData = await propuestasResponse.json();
            propuestas = propuestasData.data || [];
        }

        // Cargar usuarios para métricas de participación
        const usuariosResponse = await fetch('/api/usuarios', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (usuariosResponse.ok) {
            const usuariosData = await usuariosResponse.json();
            usuarios = usuariosData.data || [];
        }

        // Cargar total de votos de todas las propuestas
        for (const propuesta of propuestas) {
            try {
                const votosResponse = await fetch(`/api/votos/propuesta/${propuesta._id}/stats`);
                if (votosResponse.ok) {
                    const votosData = await votosResponse.json();
                    totalVotos += votosData.data.totalVotos || 0;
                }
            } catch (error) {
                console.error(`Error al cargar votos de propuesta ${propuesta._id}:`, error);
            }
        }

        // Actualizar métricas con todos los datos
        updateMetrics(propuestas, usuarios, totalVotos);

    } catch (error) {
        console.error('Error al cargar métricas:', error);
    }
}

function updateMetrics(propuestas, usuarios, totalVotos) {
    const totalPropuestas = propuestas.length;
    const proyectosCompletados = propuestas.filter(p => p.estado === 'Completada').length;
    const usuariosActivos = usuarios.filter(u => u.activo).length;
    
    // Solo contar ciudadanos para el cálculo de participación (admins no votan)
    const ciudadanosActivos = usuarios.filter(u => u.activo && u.rol === 'ciudadano').length;
    
    // Calcular participación real: usuarios ciudadanos que han votado vs ciudadanos activos
    let participacion = 0;
    if (ciudadanosActivos > 0) {
        // Para una estimación más precisa, usamos la proporción directa
        // En el futuro, esto debería ser una query específica de usuarios únicos que votaron
        const estimacionUsuariosQueVotaron = Math.min(totalVotos, ciudadanosActivos);
        participacion = Math.round((estimacionUsuariosQueVotaron / ciudadanosActivos) * 100);
        
        // Debug para verificar cálculo
        console.log('Debug participación:', {
            ciudadanosActivos,
            totalVotos,
            estimacionUsuariosQueVotaron,
            participacion
        });
        
       
    }

    document.getElementById('totalPropuestas').textContent = totalPropuestas;
    document.getElementById('proyectosCompletados').textContent = proyectosCompletados;
    document.getElementById('usuariosActivos').textContent = usuariosActivos; // Total de usuarios (incluye admins)
    document.getElementById('participacion').textContent = `${participacion}%`;
}

async function loadPropuestasTable() {
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
            renderPropuestasTable(propuestasData);
        } else {
            console.error('Error al cargar propuestas:', response.status);
            showTableError('Error al cargar las propuestas');
        }
    } catch (error) {
        console.error('Error:', error);
        showTableError('Error de conexión');
    }
}

function renderPropuestasTable(propuestas) {
    const tbody = document.getElementById('propuestasTableBody');
    
    if (!propuestas || propuestas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-row">No hay propuestas disponibles</td></tr>';
        return;
    }

    tbody.innerHTML = propuestas.map(propuesta => createTableRow(propuesta)).join('');
}

function createTableRow(propuesta) {
    const fechaCreacion = new Date(propuesta.fechaCreacion).toLocaleDateString('es-ES');
    const estadoClass = propuesta.estado.toLowerCase().replace(/\s+/g, '-');
    
    return `
        <tr>
            <td>
                <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${propuesta.titulo}
                </div>
            </td>
            <td>${propuesta.categoria}</td>
            <td>${propuesta.barrio}</td>
            <td>
                <span class="estado-badge estado-${estadoClass}">
                    ${propuesta.estado}
                </span>
            </td>
            <td>${fechaCreacion}</td>
            <td>
                <button class="btn-change-status" onclick="openEstadoModal('${propuesta._id}', '${propuesta.titulo}', '${propuesta.estado}')">
                    Cambiar Estado
                </button>
            </td>
        </tr>
    `;
}

function showTableError(message) {
    const tbody = document.getElementById('propuestasTableBody');
    tbody.innerHTML = `<tr><td colspan="6" class="loading-row">${message}</td></tr>`;
}

// Función simplificada - ya no necesitamos sistema de tabs

function setupFilters() {
    const estadoFilter = document.getElementById('estadoFilterAdmin');
    
    if (estadoFilter) {
        estadoFilter.addEventListener('change', filterPropuestas);
    }
}

function filterPropuestas() {
    const estadoFilter = document.getElementById('estadoFilterAdmin').value;
    
    let filteredData = propuestasData;
    
    if (estadoFilter) {
        filteredData = filteredData.filter(p => p.estado === estadoFilter);
    }
    
    renderPropuestasTable(filteredData);
}

function openEstadoModal(propuestaId, titulo, estadoActual) {
    currentPropuestaId = propuestaId;
    
    document.getElementById('modalPropuestaTitulo').textContent = titulo;
    document.getElementById('nuevoEstado').value = estadoActual;
    
    const modal = document.getElementById('estadoModal');
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('estadoModal');
    modal.classList.remove('show');
    currentPropuestaId = null;
}

async function updateEstado() {
    if (!currentPropuestaId) return;
    
    const nuevoEstado = document.getElementById('nuevoEstado').value;
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`/api/propuestas/${currentPropuestaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (response.ok) {
            // Actualizar la propuesta en el array local
            const propuestaIndex = propuestasData.findIndex(p => p._id === currentPropuestaId);
            if (propuestaIndex !== -1) {
                propuestasData[propuestaIndex].estado = nuevoEstado;
            }
            
            // Re-renderizar tabla
            filterPropuestas();
            
            // Recargar métricas completas
            loadMetrics();
            
            closeModal();
            
            // Mostrar mensaje de éxito
            showNotification('Estado actualizado correctamente', 'success');
        } else {
            const errorData = await response.json();
            showNotification(errorData.message || 'Error al actualizar el estado', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión', 'error');
    }
}

function showNotification(message, type = 'info') {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        font-size: 14px;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

function crearNuevaPropuesta() {
    window.location.href = '/admin/crear-propuesta.html';
}

function exportarDatos() {
    try {
        // Obtener el filtro actual
        const estadoFilter = document.getElementById('estadoFilterAdmin').value;
        
        // Filtrar datos según el estado seleccionado
        let datosParaExportar = propuestasData;
        if (estadoFilter) {
            datosParaExportar = propuestasData.filter(p => p.estado === estadoFilter);
        }

        if (datosParaExportar.length === 0) {
            showNotification('No hay propuestas para exportar con el filtro seleccionado', 'error');
            return;
        }

        generarPDF(datosParaExportar, estadoFilter);
        
    } catch (error) {
        console.error('Error al exportar:', error);
        showNotification('Error al generar el PDF', 'error');
    }
}

function generarPDF(propuestas, filtroEstado = '') {
    // Crear nuevo documento PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configuración del documento
    const fechaActual = new Date().toLocaleDateString('es-ES');
    const horaActual = new Date().toLocaleTimeString('es-ES');
    
    // Título del documento
    const tituloFiltro = filtroEstado ? ` - ${filtroEstado}` : '';
    const titulo = `Gestión de Propuestas${tituloFiltro}`;
    
    // Header del PDF
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Decisiones Ciudadanas', 20, 20);
    
    doc.setFontSize(16);
    doc.text(titulo, 20, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el ${fechaActual} a las ${horaActual}`, 20, 45);
    doc.text(`Total de propuestas: ${propuestas.length}`, 20, 52);

    // Preparar datos para la tabla
    const columnas = [
        { header: 'Título', dataKey: 'titulo' },
        { header: 'Categoría', dataKey: 'categoria' },
        { header: 'Barrio', dataKey: 'barrio' },
        { header: 'Estado', dataKey: 'estado' },
        { header: 'Fecha', dataKey: 'fecha' }
    ];

    const filas = propuestas.map(propuesta => ({
        titulo: propuesta.titulo,
        categoria: propuesta.categoria,
        barrio: propuesta.barrio,
        estado: propuesta.estado,
        fecha: new Date(propuesta.fechaCreacion).toLocaleDateString('es-ES')
    }));

    // Generar tabla con autoTable
    doc.autoTable({
        columns: columnas,
        body: filas,
        startY: 60,
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [66, 133, 244], // Color azul del tema
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [248, 249, 250] // Gris claro alternado
        },
        columnStyles: {
            titulo: { cellWidth: 60 },
            categoria: { cellWidth: 35 },
            barrio: { cellWidth: 25 },
            estado: { cellWidth: 30 },
            fecha: { cellWidth: 25 }
        },
        margin: { top: 60, left: 20, right: 20 }
    });

    // Nombre del archivo
    const nombreArchivo = filtroEstado 
        ? `propuestas_${filtroEstado.toLowerCase().replace(/\s+/g, '_')}_${fechaActual.replace(/\//g, '-')}.pdf`
        : `propuestas_todas_${fechaActual.replace(/\//g, '-')}.pdf`;

    // Descargar el PDF
    doc.save(nombreArchivo);
    
    showNotification(`PDF exportado exitosamente: ${propuestas.length} propuestas`, 'success');
}

function toggleUserMenu() {
    const userMenu = document.getElementById('adminUserMenu');
    if (userMenu) {
        userMenu.classList.toggle('show');
    }
}

// Ya no necesitamos checkUrlHash porque todo está en una vista

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/login.html';
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(event) {
    const modal = document.getElementById('estadoModal');
    if (event.target === modal) {
        closeModal();
    }
    
    // Cerrar menú de usuario al hacer clic fuera
    const userMenu = document.getElementById('adminUserMenu');
    const userMenuBtn = document.querySelector('.user-menu-btn');
    
    if (userMenu && userMenuBtn && 
        !userMenuBtn.contains(event.target) && 
        !userMenu.contains(event.target)) {
        userMenu.classList.remove('show');
    }
});
