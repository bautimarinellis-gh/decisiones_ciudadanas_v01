document.addEventListener('DOMContentLoaded', function() {
    initVerDetalles();
});

let currentPropuestaId = null;
let userHasVoted = false;

function initVerDetalles() {
    // Verificar autenticación
    const userData = getUserData();
    if (!userData) {
        window.location.href = '/login.html';
        return;
    }

    // Obtener ID de la propuesta desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    currentPropuestaId = urlParams.get('id');

    if (!currentPropuestaId) {
        showError('ID de propuesta no encontrado');
        return;
    }

    loadPropuesta();
}

function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

async function loadPropuesta() {
    try {
        showLoading();
        
        const token = localStorage.getItem('authToken');
        
        // Cargar propuesta
        const propuestaResponse = await fetch(`/api/propuestas/${currentPropuestaId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!propuestaResponse.ok) {
            throw new Error('Propuesta no encontrada');
        }

        const propuestaData = await propuestaResponse.json();
        const propuesta = propuestaData.data;

        // Cargar estadísticas de votos
        const statsResponse = await fetch(`/api/votos/propuesta/${currentPropuestaId}/stats`);
        let votosStats = { data: { totalVotos: 0 } };
        
        if (statsResponse.ok) {
            votosStats = await statsResponse.json();
        }

        // Cargar estadísticas de comentarios
        const comentariosStatsResponse = await fetch(`/api/comentarios/propuesta/${currentPropuestaId}/stats`);
        let comentariosStats = { data: { totalComentarios: 0 } };
        
        if (comentariosStatsResponse.ok) {
            comentariosStats = await comentariosStatsResponse.json();
        }

        // Verificar si el usuario ya votó
        const votoResponse = await fetch(`/api/votos/propuesta/${currentPropuestaId}/mi-voto`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        let yaVoto = false;
        if (votoResponse.ok) {
            const votoData = await votoResponse.json();
            yaVoto = votoData.data.yaVoto;
        }

        renderPropuesta(propuesta, votosStats.data.totalVotos, comentariosStats.data.totalComentarios, yaVoto);
        loadComentarios();
        setupCommentForm();
        hideLoading();

    } catch (error) {
        console.error('Error al cargar propuesta:', error);
        showError(error.message || 'Error al cargar la propuesta');
        hideLoading();
    }
}

function renderPropuesta(propuesta, totalVotos, totalComentarios, yaVoto) {
    // Información básica
    document.getElementById('propuestaTitulo').textContent = propuesta.titulo;
    document.getElementById('propuestaDescripcion').innerHTML = `<p>${propuesta.descripcion}</p>`;
    document.getElementById('propuestaCategoria').textContent = propuesta.categoria;
    document.getElementById('propuestaBarrio').textContent = propuesta.barrio;
    
    // Estado
    const estadoElement = document.getElementById('propuestaEstado');
    const estadoClass = propuesta.estado.toLowerCase().replace(/\s+/g, '-');
    estadoElement.textContent = propuesta.estado;
    estadoElement.className = `propuesta-estado estado-${estadoClass}`;

    // Estadísticas
    document.getElementById('totalVotos').textContent = totalVotos;
    document.getElementById('totalComentarios').textContent = totalComentarios;
    document.getElementById('comentariosTitle').textContent = `Comentarios (${totalComentarios})`;

    // Verificar si se puede votar según el estado de la propuesta
    const puedeVotar = canVoteOnPropuesta(propuesta.estado);
    
    // Estado del voto
    updateVoteButton(yaVoto, puedeVotar, propuesta.estado);
    userHasVoted = yaVoto;

    // Mostrar contenido principal
    document.getElementById('mainContent').style.display = 'block';
}

function updateVoteButton(yaVoto, puedeVotar = true, estadoPropuesta = '') {
    const voteBtn = document.getElementById('voteBtn');
    const voteBtnText = document.getElementById('voteBtnText');
    const voteStatusText = document.getElementById('voteStatusText');

    // Si ya votó
    if (yaVoto) {
        voteBtn.classList.add('voted');
        voteBtn.disabled = true;
        voteBtnText.textContent = 'Voto enviado';
        voteStatusText.textContent = 'Ya has votado a favor de esta propuesta';
        return;
    }

    // Si no puede votar por el estado de la propuesta
    if (!puedeVotar) {
        voteBtn.classList.remove('voted');
        voteBtn.classList.add('disabled-vote');
        voteBtn.disabled = true;
        voteBtnText.textContent = 'Votación cerrada';
        
        // Mensaje específico según el estado
        const mensajesEstado = {
            'Aprobada': 'Esta propuesta ya fue aprobada y no acepta más votos',
            'Rechazada': 'Esta propuesta fue rechazada y no acepta más votos',
            'En Ejecucion': 'Esta propuesta está en ejecución y no acepta más votos',
            'Completada': 'Esta propuesta ya fue completada y no acepta más votos'
        };
        
        voteStatusText.textContent = mensajesEstado[estadoPropuesta] || 'Esta propuesta no acepta votos en su estado actual';
        return;
    }

    // Estado normal: puede votar
    voteBtn.classList.remove('voted', 'disabled-vote');
    voteBtn.disabled = false;
    voteBtnText.textContent = 'Votar a favor';
    voteStatusText.textContent = 'Apoya esta propuesta con tu voto';
}

async function handleVote() {
    if (userHasVoted) {
        return;
    }

    // Verificar si la propuesta permite votación
    const urlParams = new URLSearchParams(window.location.search);
    const propuestaId = urlParams.get('id');
    
    try {
        const token = localStorage.getItem('authToken');
        const propuestaResponse = await fetch(`/api/propuestas/${propuestaId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (propuestaResponse.ok) {
            const propuestaData = await propuestaResponse.json();
            const propuesta = propuestaData.data;
            
            if (!canVoteOnPropuesta(propuesta.estado)) {
                showToast('No se puede votar en esta propuesta debido a su estado actual', 'error');
                return;
            }
        }
    } catch (error) {
        console.error('Error al verificar estado de propuesta:', error);
    }

    try {
        const token = localStorage.getItem('authToken');
        const voteBtn = document.getElementById('voteBtn');
        
        // Deshabilitar botón temporalmente
        voteBtn.disabled = true;
        const voteBtnText = document.getElementById('voteBtnText');
        const originalText = voteBtnText.textContent;
        voteBtnText.textContent = 'Enviando voto...';

        const response = await fetch('/api/votos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                propuestaId: currentPropuestaId
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Voto exitoso
            userHasVoted = true;
            updateVoteButton(true);
            
            // Actualizar contador de votos
            const currentVotes = parseInt(document.getElementById('totalVotos').textContent);
            document.getElementById('totalVotos').textContent = currentVotes + 1;
            
            showToast('¡Voto registrado exitosamente!', 'success');
        } else {
            // Error en el voto - restaurar estado original
            voteBtn.disabled = false;
            voteBtnText.textContent = originalText;
            showToast(data.message || 'Error al registrar el voto', 'error');
        }

    } catch (error) {
        console.error('Error al votar:', error);
        
        // Restaurar botón en caso de error
        const voteBtn = document.getElementById('voteBtn');
        const voteBtnText = document.getElementById('voteBtnText');
        voteBtn.disabled = false;
        voteBtnText.textContent = 'Votar a favor';
        
        showToast('Error de conexión. Intenta nuevamente.', 'error');
    }
}

function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function canVoteOnPropuesta(estado) {
    // Solo se puede votar en propuestas Pendientes o En Revisión
    const estadosVotables = ['Pendiente', 'En Revision'];
    return estadosVotables.includes(estado);
}

async function loadComentarios() {
    try {
        const response = await fetch(`/api/comentarios/propuesta/${currentPropuestaId}`);
        
        if (response.ok) {
            const data = await response.json();
            const comentarios = data.data || [];
            renderComentarios(comentarios);
        } else {
            console.error('Error al cargar comentarios:', response.status);
            showNoComments('Error al cargar comentarios');
        }
    } catch (error) {
        console.error('Error:', error);
        showNoComments('Error de conexión');
    }
}

function renderComentarios(comentarios) {
    const comentariosList = document.getElementById('comentariosList');
    
    if (!comentarios || comentarios.length === 0) {
        showNoComments('Aún no hay comentarios. ¡Sé el primero en comentar!');
        return;
    }

    comentariosList.innerHTML = comentarios.map(comentario => createComentarioItem(comentario)).join('');
}

function createComentarioItem(comentario) {
    const fechaRelativa = getTimeAgo(comentario.fechaCreacion);
    const iniciales = comentario.usuarioId.nombreCompleto
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const userData = getUserData();
    const esPropio = userData && comentario.usuarioId._id === userData._id;

    return `
        <div class="comentario-item">
            <div class="comentario-avatar">
                <span>${iniciales}</span>
            </div>
            <div class="comentario-content">
                <div class="comentario-header">
                    <strong>${comentario.usuarioId.nombreCompleto}</strong>
                    <span class="comentario-fecha">${fechaRelativa}</span>
                    ${esPropio ? `<button class="btn-delete-comment" onclick="openDeleteModal('${comentario._id}', '${comentario.usuarioId.nombreCompleto}', '${comentario.contenido.replace(/'/g, "&#39;")}')" title="Eliminar comentario">×</button>` : ''}
                </div>
                <p class="comentario-texto">${comentario.contenido}</p>
            </div>
        </div>
    `;
}

function showNoComments(message) {
    const comentariosList = document.getElementById('comentariosList');
    comentariosList.innerHTML = `
        <div class="no-comments">
            <p>${message}</p>
        </div>
    `;
}

function setupCommentForm() {
    const textarea = document.getElementById('nuevoComentario');
    const counter = document.getElementById('comentarioCounter');
    
    if (textarea && counter) {
        textarea.addEventListener('input', function() {
            const length = this.value.length;
            counter.textContent = length;
            
            if (length > 500) {
                counter.style.color = '#dc3545';
                textarea.classList.add('error');
            } else {
                counter.style.color = '#666';
                textarea.classList.remove('error');
            }
        });
    }
}

async function enviarComentario() {
    const textarea = document.getElementById('nuevoComentario');
    const btnComentar = document.getElementById('btnComentar');
    const contenido = textarea.value.trim();

    if (!contenido) {
        showToast('Escribe un comentario antes de enviar', 'error');
        return;
    }

    if (contenido.length > 500) {
        showToast('El comentario no puede exceder 500 caracteres', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        
        btnComentar.disabled = true;
        btnComentar.textContent = 'Enviando...';

        const response = await fetch('/api/comentarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                propuestaId: currentPropuestaId,
                contenido: contenido
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Limpiar formulario
            textarea.value = '';
            document.getElementById('comentarioCounter').textContent = '0';
            
            // Recargar comentarios
            await loadComentarios();
            
            // Actualizar contador en estadísticas
            const currentCount = parseInt(document.getElementById('totalComentarios').textContent);
            document.getElementById('totalComentarios').textContent = currentCount + 1;
            document.getElementById('comentariosTitle').textContent = `Comentarios (${currentCount + 1})`;
            
            showToast('¡Comentario enviado exitosamente!', 'success');
        } else {
            showToast(data.message || 'Error al enviar el comentario', 'error');
        }

    } catch (error) {
        console.error('Error al enviar comentario:', error);
        showToast('Error de conexión. Intenta nuevamente.', 'error');
    } finally {
        btnComentar.disabled = false;
        btnComentar.textContent = 'Comentar';
    }
}

let comentarioAEliminar = null;

function openDeleteModal(comentarioId, autorNombre, contenido) {
    comentarioAEliminar = comentarioId;
    
    // Mostrar preview del comentario
    const commentPreview = document.getElementById('commentPreview');
    commentPreview.innerHTML = `
        <div class="preview-author">${autorNombre}</div>
        <div class="preview-content">"${contenido}"</div>
    `;
    
    // Mostrar modal
    const modal = document.getElementById('deleteCommentModal');
    modal.classList.add('show');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteCommentModal');
    modal.classList.remove('show');
    comentarioAEliminar = null;
}

async function confirmarEliminacion() {
    if (!comentarioAEliminar) return;

    try {
        const token = localStorage.getItem('authToken');
        const btnEliminar = document.querySelector('.btn-danger');
        
        btnEliminar.disabled = true;
        btnEliminar.textContent = 'Eliminando...';
        
        const response = await fetch(`/api/comentarios/${comentarioAEliminar}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Cerrar modal
            closeDeleteModal();
            
            // Recargar comentarios
            await loadComentarios();
            
            // Actualizar contador
            const currentCount = parseInt(document.getElementById('totalComentarios').textContent);
            document.getElementById('totalComentarios').textContent = Math.max(0, currentCount - 1);
            document.getElementById('comentariosTitle').textContent = `Comentarios (${Math.max(0, currentCount - 1)})`;
            
            showToast('Comentario eliminado exitosamente', 'success');
        } else {
            showToast(data.message || 'Error al eliminar el comentario', 'error');
        }

    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        showToast('Error de conexión. Intenta nuevamente.', 'error');
    } finally {
        const btnEliminar = document.querySelector('.btn-danger');
        if (btnEliminar) {
            btnEliminar.disabled = false;
            btnEliminar.textContent = 'Eliminar comentario';
        }
    }
}

function getTimeAgo(fechaCreacion) {
    const ahora = new Date();
    const fecha = new Date(fechaCreacion);
    const diffMs = ahora - fecha;
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutos < 1) return 'Hace un momento';
    if (diffMinutos < 60) return `Hace ${diffMinutos} ${diffMinutos === 1 ? 'minuto' : 'minutos'}`;
    if (diffHoras < 24) return `Hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`;
    if (diffDias < 7) return `Hace ${diffDias} ${diffDias === 1 ? 'día' : 'días'}`;
    
    return fecha.toLocaleDateString('es-ES');
}

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/ciudadano/dashboard.html';
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(event) {
    const modal = document.getElementById('deleteCommentModal');
    if (event.target === modal) {
        closeDeleteModal();
    }
});
