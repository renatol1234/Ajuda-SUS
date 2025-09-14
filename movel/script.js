// ===== Variáveis globais =====
let map;
let currentTimer;
let symptomsData = {};
let recognition;

// ===== Seletores =====
const symptomInput = document.getElementById("symptomInput");
const resultDiv = document.getElementById("result");
const timerDiv = document.getElementById("timer");
const symptomList = document.getElementById("symptomList");
const menuButton = document.getElementById("menuButton");
const emergencyMenu = document.getElementById("emergencyMenu");
const anaAjudaContainer = document.getElementById("anaAjudaContainer");
const suggestions = document.getElementById("symptomSuggestions");
const micButton = document.getElementById("micButton");

// ===== Inicialização =====
document.addEventListener('DOMContentLoaded', async () => {
    await carregarSintomas();
    solicitarPermissoes();
    iniciarAplicacao();
});

// ===== Permissões iniciais =====
function solicitarPermissoes() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
    }
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => console.log("Permissão de áudio concedida."))
        .catch(err => console.warn("Permissão de áudio negada:", err));
}

// ===== Carregamento de dados =====
async function carregarSintomas() {
    try {
        const resposta = await fetch('data.json');
        symptomsData = await resposta.json();
    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
    }
}

function iniciarAplicacao() {
    configurarMenu();
    exibirSintomas();
    configurarEventos();
    configurarMicrofone();

    if (typeof google !== 'undefined' && google.maps) {
        inicializarMapa();
    }
}

// ===== Menu Emergência =====
function configurarMenu() {
    menuButton.addEventListener("click", () => {
        emergencyMenu.style.display = emergencyMenu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".menu-button") && !event.target.closest(".emergency-btn")) {
            emergencyMenu.style.display = "none";
        }
    });
}

// ===== Rolar tela =====
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Sintomas =====
function exibirSintomas() {
    symptomList.innerHTML = "";

    const todosSintomas = Object.values(symptomsData.symptoms || {}).flat();

    todosSintomas.forEach(sintoma => {
        const item = document.createElement("div");
        item.className = "symptom";
        if (sintoma.length > 21) {
            item.classList.add("full-width");
        }

        item.textContent = sintoma;
        item.onclick = () => {
            analisarSintoma(sintoma);
            scrollToTop();
        };
        symptomList.appendChild(item);
    });
}

// ===== Eventos de entrada =====
function configurarEventos() {
    symptomInput.addEventListener("input", mostrarSugestoes);

    symptomInput.addEventListener("change", () => {
        const texto = symptomInput.value.toLowerCase();
        if (texto) processarTextoFalado(texto);
    });

    symptomInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            const texto = symptomInput.value.toLowerCase();
            if (texto) processarTextoFalado(texto);
        }
    });
}

function mostrarSugestoes() {
    const texto = symptomInput.value.toLowerCase();
    suggestions.innerHTML = "";
    if (texto && symptomsData.symptoms) {
        const todosSintomas = Object.values(symptomsData.symptoms).flat();
        todosSintomas
            .filter(s => s.toLowerCase().includes(texto))
            .forEach(s => {
                const opcao = document.createElement("option");
                opcao.value = s;
                suggestions.appendChild(opcao);
            });
    }
}

function processarTextoFalado(texto) {
    const aliasCorrespondente = Object.entries(symptomsData.aliases || {})
        .find(([alias, sintomaPrincipal]) => texto.includes(alias.toLowerCase()))?.[1];

    const sintomaParaBusca = aliasCorrespondente || texto;
    const destino = Object.entries(symptomsData.symptoms)
        .find(([categoria, lista]) =>
            lista.some(s => sintomaParaBusca.includes(s.split(" ")[0]) || s.toLowerCase().includes(sintomaParaBusca))
        )?.[0];

    exibirResultado(destino || "Não identificado. Tente ser mais específico.");
}

function analisarSintoma(sintoma) {
    const sintomaPrincipal = symptomsData.aliases?.[sintoma] || sintoma;
    const destino = Object.entries(symptomsData.symptoms)
        .find(([categoria, lista]) => lista.includes(sintomaPrincipal))?.[0];
    exibirResultado(destino || "Não identificado");
}

// ===== Resultado e Timer =====
function exibirResultado(destino) {
    limparTimer();

    const agora = new Date();
    const hora = agora.getHours();
    const diaSemana = agora.getDay();

    let mensagem, busca;

    if (destino === "UBS") {
        const fimDeSemana = (diaSemana === 0 || diaSemana === 6);
        const foraDoHorario = (hora < 7 || hora >= 19);

        if (fimDeSemana || foraDoHorario) {
            mensagem = "A UBS está fechada agora. Vá à UPA mais próxima.";
            busca = "UPA";
        } else {
            mensagem = "Você deve se direcionar à UBS mais próxima.";
            busca = "UBS";
        }
    } else if (destino.includes("Não identificado")) {
        mensagem = destino;
    } else {
        mensagem = `Você deve se direcionar ao ${destino} mais próximo.`;
        busca = destino;
    }

    resultDiv.textContent = mensagem;
    if (busca) iniciarTimerNavegacao(busca);
}

function limparTimer() {
    if (currentTimer) {
        clearInterval(currentTimer);
        currentTimer = null;
    }
}


// Carregar chave do Google Maps a partir de config.json
fetch('config.json')
    .then(response => response.json())
    .then(config => {
        const apiKey = config.googleMapsApiKey;
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    })
    .catch(error => console.error("Erro ao carregar config.json:", error));



// ===== Função principal de navegação (MOBILE-ONLY) =====
function iniciarTimerNavegacao(termo) {
    let segundos = 5;
    timerDiv.innerHTML = `Abrindo mapa em ${segundos}s... `;
    const botaoCancelar = criarBotaoCancelar();
    timerDiv.appendChild(botaoCancelar);

    currentTimer = setInterval(() => {
        segundos--;
        timerDiv.innerHTML = `Abrindo mapa em ${segundos}s... `;
        timerDiv.appendChild(botaoCancelar);

        if (segundos <= 0) {
            limparTimer();
            abrirMapaNativo(termo);
            timerDiv.innerHTML = "Redirecionando...";
        }
    }, 1000);
}

function abrirMapaNativo(termo) {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isAndroid) {
        window.location.href = `https://www.google.com/maps/search/${encodeURIComponent(termo)}`;
    } else if (isIOS) {
        window.location.href = `http://maps.apple.com/?q=${encodeURIComponent(termo)}`;
    } else {
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(termo)}`, "_blank");
    }

    
     // ✅ Salvar log somente aqui, quando realmente abre o mapa
    salvarLogSintoma(termo);

}

function criarBotaoCancelar() {
    const btn = document.createElement("button");
    btn.textContent = "Cancelar";
    btn.className = "cancel-button";
    btn.onclick = () => {
        limparTimer();
        timerDiv.innerHTML = "Navegação cancelada.";
    };
    return btn;
}

// ===== Mapa e Geolocalização =====
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -23.5505, lng: -46.6333 },
        zoom: 12
    });
    checkLocation();
}

function checkLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                }, (results, status) => {
                    if (status === "OK" && results[0]) {
                        const isCampinas = results[0].address_components.some(
                            c => c.types.includes("administrative_area_level_2") && 
                                 c.long_name.toLowerCase().includes("campinas")
                        );
                        if (isCampinas) anaAjudaContainer.style.display = "block";
                    }
                });
            },
            (error) => console.error("Erro na geolocalização:", error)
        );
    }
}

// ===== Microfone e Reconhecimento de Voz =====
function configurarMicrofone() {
    if (!micButton || !symptomInput) {
        console.warn("Elementos do microfone não encontrados.");
        return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        resultDiv.textContent = "Reconhecimento de voz não suportado neste navegador.";
        resultDiv.style.color = "red";
        micButton.disabled = true;
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    micButton.addEventListener("click", () => {
        recognition.start();
        resultDiv.textContent = "Ouvindo...";
        resultDiv.style.color = "blue";
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        symptomInput.value = transcript;
        resultDiv.textContent = "Transcrição concluída!";
        resultDiv.style.color = "green";
        processarTextoFalado(transcript.toLowerCase());
    };

    recognition.onerror = (event) => {
        resultDiv.textContent = "Erro de reconhecimento: " + event.error;
        resultDiv.style.color = "red";
    };
}

// ===== Funções de Emergência (Mobile-Only) =====
function callNumber(numero) {
    window.location.href = `tel:${numero}`;
}

function openWhatsApp() {
    const url = `https://wa.me/5519998990903?text=${encodeURIComponent("Preciso de ajuda pelo Ana Ajuda!")}`;
    window.open(url, "_blank");
}