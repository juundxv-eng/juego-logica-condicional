/**
 * ENIGMA CODE - Juego de descifrado de errores lógicos
 * Versión 2.0 - Tema Encriptado
 */

// ==================== CONFIGURACIÓN ====================
const CONFIG = {
    INITIAL_TIME: 60,
    TIME_PENALTY: 5,
    POINTS_PER_LEVEL: 100,
    TOTAL_LEVELS: 5,
    GAME_NAME: 'ENIGMA CODE',
    THEME: 'encriptado'
};

// ==================== BASE DE DATOS DE NIVELES ====================
const levels = [
    {
        id: 1,
        code: `SI edad > 18 ENTONCES\n    puedeVotar = verdadero\nSINO\n    puedeVotar = falso`,
        objective: "Corrige el operador para permitir votar a mayores de edad (18 años inclusive)",
        options: [
            { text: "edad > 18", correct: false },
            { text: "edad >= 18", correct: true },
            { text: "edad < 18", correct: false },
            { text: "edad == 18", correct: false }
        ],
        hint: "Los de 18 también deben poder votar"
    },
    {
        id: 2,
        code: `SI temperatura > 30 ENTONCES\n    encenderAire = falso\nSINO\n    encenderAire = verdadero`,
        objective: "El aire debe encenderse con calor (>30°) y apagarse si no",
        options: [
            { text: "encenderAire = verdadero / falso (invertido)", correct: true },
            { text: "cambiar el operador a <", correct: false },
            { text: "modificar el valor 30", correct: false },
            { text: "el código es correcto", correct: false }
        ],
        hint: "Las acciones están intercambiadas"
    },
    {
        id: 3,
        code: `SI usuario == "admin" O contrasena == "1234" ENTONCES\n    accesoPermitido = verdadero`,
        objective: "Se requieren AMBAS condiciones para el acceso (usuario admin Y contraseña 1234)",
        options: [
            { text: "usuario == 'admin' Y contrasena == '1234'", correct: true },
            { text: "usuario == 'admin' O contrasena == '1234'", correct: false },
            { text: "usuario != 'admin' Y contrasena != '1234'", correct: false },
            { text: "solo usuario == 'admin'", correct: false }
        ],
        hint: "AND requiere que ambas sean verdaderas"
    },
    {
        id: 4,
        code: `int contador = 0\nMIENTRAS contador <= 5 HACER\n    imprimir(contador)\n    contador = contador - 1`,
        objective: "El bucle debe contar del 0 al 5 (inclusive)",
        options: [
            { text: "contador = contador + 1", correct: true },
            { text: "contador = contador - 1", correct: false },
            { text: "contador = 0", correct: false },
            { text: "contador = contador * 2", correct: false }
        ],
        hint: "Para aumentar, hay que sumar"
    },
    {
        id: 5,
        code: `SI numero % 2 == 1 ENTONCES\n    esPar = verdadero\nSINO\n    esPar = falso`,
        objective: "Corrige la condición para números pares",
        options: [
            { text: "numero % 2 == 0", correct: true },
            { text: "numero % 2 == 1", correct: false },
            { text: "numero / 2 == 0", correct: false },
            { text: "numero * 2 == 0", correct: false }
        ],
        hint: "Un número par tiene resto 0"
    }
];

// ==================== ESTADO DEL JUEGO ====================
let gameState = {
    currentLevel: 0,
    score: 0,
    timeLeft: CONFIG.INITIAL_TIME,
    selectedOption: null,
    isGameActive: true,
    timerInterval: null
};

// ==================== ELEMENTOS DEL DOM ====================
const elements = {
    score: document.getElementById('score'),
    level: document.getElementById('level'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerBar: document.getElementById('timerBar'),
    objective: document.getElementById('objective'),
    codeDisplay: document.getElementById('codeDisplay'),
    options: document.getElementById('options'),
    executeBtn: document.getElementById('executeBtn'),
    resetBtn: document.getElementById('resetBtn'),
    gameArea: document.getElementById('gameArea'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    victoryScreen: document.getElementById('victoryScreen'),
    finalScore: document.getElementById('finalScore'),
    feedbackMessage: document.getElementById('feedbackMessage')
};

// ==================== FUNCIONES PRINCIPALES ====================

/**
 * Inicializa el juego
 */
function initGame() {
    gameState.currentLevel = 0;
    gameState.score = 0;
    gameState.timeLeft = CONFIG.INITIAL_TIME;
    gameState.selectedOption = null;
    gameState.isGameActive = true;
    
    updateScore();
    updateLevel();
    startTimer();
    loadLevel(gameState.currentLevel);
    
    // Mostrar área de juego, ocultar pantallas de fin
    elements.gameArea.classList.remove('hidden');
    elements.gameOverScreen.classList.add('hidden');
    elements.victoryScreen.classList.add('hidden');
    
    // Mensaje de bienvenida
    showFeedback('🔐 ENIGMA CODE iniciado · Descifra los errores', 'success');
}

/**
 * Carga un nivel específico
 */
function loadLevel(levelIndex) {
    if (!gameState.isGameActive) return;
    
    const level = levels[levelIndex];
    if (!level) return;
    
    // Efecto de transición
    elements.codeDisplay.style.opacity = '0';
    setTimeout(() => {
        // Actualizar contenido
        elements.objective.textContent = level.objective;
        elements.codeDisplay.textContent = level.code;
        elements.codeDisplay.style.opacity = '1';
        
        // Crear opciones
        renderOptions(level.options);
        
        // Resetear selección
        gameState.selectedOption = null;
    }, 300);
}

/**
 * Renderiza las opciones del nivel actual
 */
function renderOptions(options) {
    elements.options.innerHTML = '';
    
    options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn w-full text-left rounded transition-all';
        button.innerHTML = `
            <span class="flex items-center">
                <span class="w-6 h-6 flex items-center justify-center border border-indigo-500 rounded-full mr-3 text-xs">${String.fromCharCode(65 + index)}</span>
                <span>${option.text}</span>
            </span>
        `;
        button.dataset.index = index;
        button.dataset.correct = option.correct;
        
        button.addEventListener('click', () => selectOption(button, index));
        
        elements.options.appendChild(button);
    });
}

/**
 * Maneja la selección de una opción
 */
function selectOption(button, index) {
    if (!gameState.isGameActive) return;
    
    // Remover selección anterior
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected', 'correct-feedback', 'incorrect-feedback');
    });
    
    // Agregar clase de selección
    button.classList.add('selected');
    gameState.selectedOption = index;
}

/**
 * Verifica la respuesta del jugador
 */
function checkAnswer() {
    if (!gameState.isGameActive) return;
    if (gameState.selectedOption === null) {
        showFeedback('⚠️ Selecciona una opción para descifrar', 'error');
        return;
    }
    
    const selectedButton = document.querySelector(`.option-btn[data-index="${gameState.selectedOption}"]`);
    const isCorrect = selectedButton.dataset.correct === 'true';
    
    if (isCorrect) {
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer(selectedButton);
    }
}

/**
 * Maneja respuestas correctas
 */
function handleCorrectAnswer() {
    // Animación de éxito
    document.querySelectorAll('.option-btn').forEach(btn => {
        if (btn.dataset.correct === 'true') {
            btn.classList.add('correct-feedback');
        }
    });
    
    // Actualizar puntuación
    gameState.score += CONFIG.POINTS_PER_LEVEL;
    updateScore();
    
    showFeedback('✅ ¡Código descifrado! +100 puntos', 'success');
    
    // Avanzar al siguiente nivel
    setTimeout(() => {
        if (gameState.currentLevel < levels.length - 1) {
            gameState.currentLevel++;
            updateLevel();
            loadLevel(gameState.currentLevel);
        } else {
            victory();
        }
    }, 1000);
}

/**
 * Maneja respuestas incorrectas
 */
function handleIncorrectAnswer(selectedButton) {
    // Animación de error
    selectedButton.classList.add('incorrect-feedback');
    
    // Penalización de tiempo
    gameState.timeLeft = Math.max(0, gameState.timeLeft - CONFIG.TIME_PENALTY);
    updateTimer();
    
    showFeedback(`❌ Error en el descifrado -${CONFIG.TIME_PENALTY} segundos`, 'error');
    
    // Verificar game over por tiempo
    if (gameState.timeLeft <= 0) {
        gameOver();
    }
}

/**
 * Inicia el temporizador
 */
function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isGameActive) return;
        
        gameState.timeLeft--;
        updateTimer();
        
        if (gameState.timeLeft <= 0) {
            gameOver();
        }
    }, 1000);
}

/**
 * Actualiza la visualización del temporizador
 */
function updateTimer() {
    const timeLeft = Math.max(0, gameState.timeLeft);
    elements.timerDisplay.textContent = `${timeLeft}s`;
    
    // Actualizar barra de progreso
    const percentage = (timeLeft / CONFIG.INITIAL_TIME) * 100;
    elements.timerBar.style.width = `${percentage}%`;
    
    // Cambiar color basado en tiempo restante
    if (timeLeft <= 10) {
        elements.timerBar.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'via-purple-500', 'to-blue-500');
        elements.timerBar.classList.add('bg-red-500');
    } else if (timeLeft <= 20) {
        elements.timerBar.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'via-purple-500', 'to-blue-500', 'bg-red-500');
        elements.timerBar.classList.add('bg-yellow-500');
    }
}

/**
 * Actualiza la puntuación
 */
function updateScore() {
    elements.score.textContent = gameState.score;
    
    // Animación de cambio
    elements.score.classList.add('scale-110');
    setTimeout(() => {
        elements.score.classList.remove('scale-110');
    }, 200);
}

/**
 * Actualiza el nivel mostrado
 */
function updateLevel() {
    elements.level.textContent = `${gameState.currentLevel + 1}/${levels.length}`;
}

/**
 * Muestra mensajes de feedback
 */
function showFeedback(message, type) {
    elements.feedbackMessage.textContent = message;
    elements.feedbackMessage.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-500 ${
        type === 'success' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'
    }`;
    elements.feedbackMessage.classList.remove('hidden');
    
    setTimeout(() => {
        elements.feedbackMessage.classList.add('hidden');
    }, 2000);
}

/**
 * Maneja la victoria
 */
function victory() {
    gameState.isGameActive = false;
    clearInterval(gameState.timerInterval);
    
    elements.gameArea.classList.add('hidden');
    elements.victoryScreen.classList.remove('hidden');
    elements.finalScore.textContent = gameState.score;
    
    showFeedback('🎉 ¡ENIGMA DESCIFRADO! Victoria total', 'success');
}

/**
 * Maneja el game over
 */
function gameOver() {
    gameState.isGameActive = false;
    clearInterval(gameState.timerInterval);
    
    elements.gameArea.classList.add('hidden');
    elements.gameOverScreen.classList.remove('hidden');
    
    showFeedback('💀 GAME OVER · Sistema bloqueado', 'error');
}

/**
 * Reinicia el juego
 */
function resetGame() {
    clearInterval(gameState.timerInterval);
    initGame();
}

// ==================== EVENT LISTENERS ====================
elements.executeBtn.addEventListener('click', checkAnswer);
elements.resetBtn.addEventListener('click', resetGame);

// Inicializar el juego cuando carga la página
document.addEventListener('DOMContentLoaded', initGame);

// Prevenir selección de texto
document.addEventListener('selectstart', (e) => e.preventDefault());

// Efectos de sonido virtuales (opcional - si hay archivos de audio)
function playSound(soundName) {
    const audio = new Audio(`assets/sounds/${soundName}.mp3`);
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignorar errores si no hay archivos
}