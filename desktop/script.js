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
  configurarMicrofone();
});

function solicitarPermissoes() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(() => {}, () => {});
  }
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(() => console.log("Permissão de áudio concedida."))
    .catch(err => console.warn("Permissão de áudio negada:", err));
}

async function carregarSintomas() {
  try {
    const resposta = await fetch('data.json');
    symptomsData = await resposta.json();
  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
  }
}

function iniciarAplicacao() {
  symptomInput.value = "";
  configurarMenu();
  exibirSintomas();
  configurarEventos();
  if (typeof google !== 'undefined' && google.maps) initMap();
}

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

function exibirSintomas() {
  symptomList.innerHTML = "";
  const todosSintomas = Object.values(symptomsData.symptoms || {}).flat();
  todosSintomas.forEach(sintoma => {
    const item = document.createElement("div");
    item.className = "symptom";
    if (sintoma.length > 21) item.classList.add("full-width");
    item.textContent = sintoma;
    item.onclick = () => {
      analisarSintoma(sintoma);
      scrollToTop();
    };
    symptomList.appendChild(item);
  });
}

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
    // Filtra apenas sintomas principais (ignora aliases)
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
  // Passo 1: Verifica se o texto é um alias
  const aliasCorrespondente = Object.entries(symptomsData.aliases || {})
    .find(([alias, sintomaPrincipal]) => texto.includes(alias.toLowerCase()))?.[1];

  // Passo 2: Se for alias, usa o sintoma principal correspondente
  const sintomaParaBusca = aliasCorrespondente || texto;

  // Passo 3: Busca na lista de sintomas principais
  const destino = Object.entries(symptomsData.symptoms)
    .find(([categoria, lista]) =>
      lista.some(s => sintomaParaBusca.includes(s.split(" ")[0]) || s.toLowerCase().includes(sintomaParaBusca))
    )?.[0];

  exibirResultado(destino || "Não identificado. Tente ser mais específico.");
}

function analisarSintoma(sintoma) {
  // Verifica se o sintoma é um alias
  const sintomaPrincipal = symptomsData.aliases?.[sintoma] || sintoma;
  
  const destino = Object.entries(symptomsData.symptoms)
    .find(([categoria, lista]) => lista.includes(sintomaPrincipal))?.[0];
  
  exibirResultado(destino || "Não identificado");
}

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

function iniciarTimerNavegacao(termo) {
  let segundos = 15;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(termo + " perto de mim")}`;
  timerDiv.innerHTML = `Abrindo mapa em ${segundos}s... `;
  const botaoCancelar = criarBotaoCancelar();
  timerDiv.appendChild(botaoCancelar);
  currentTimer = setInterval(() => {
    segundos--;
    timerDiv.innerHTML = `Abrindo mapa em ${segundos}s... `;
    timerDiv.appendChild(botaoCancelar);
    if (segundos <= 0) {
      limparTimer();


      const novaJanela = window.open("", "_blank"); // abre a aba já aqui
currentTimer = setInterval(() => {
  segundos--;
  timerDiv.innerHTML = `Abrindo mapa em ${segundos}s... `;
  timerDiv.appendChild(botaoCancelar);
  if (segundos <= 0) {
    limparTimer();
    if (novaJanela) novaJanela.location.href = url; // redireciona
    timerDiv.innerHTML = "Mapa aberto!";
  }
}, 1000);

      timerDiv.innerHTML = "Mapa aberto!";
    }
  }, 1000);
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

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -23.5505, lng: -46.6333 },
    zoom: 12
  });
  checkLocation();
}

function checkLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const geo = new google.maps.Geocoder();
      geo.geocode({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude } },
        (res, status) => {
          if (status === "OK" && res[0]) {
            const isCampinas = res[0].address_components.some(c =>
              c.types.includes("administrative_area_level_2") &&
              c.long_name.toLowerCase().includes("campinas")
            );
            if (isCampinas) anaAjudaContainer.style.display = "block";
          }
        });
    }, erro => console.error("Erro na geolocalização:", erro));
  }
}

function callNumber(numero) {
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    window.location.href = `tel:${numero}`;
  } else {
    alert(`Número: ${numero}\n(No celular, iniciaria uma chamada)`);
  }
}

function openWhatsApp() {
  const url = `https://wa.me/5519998990903?text=${encodeURIComponent("Preciso de ajuda pelo Ana Ajuda!")}`;
  window.open(url, "_blank");
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function configurarMicrofone() {
  if (!micButton || !symptomInput) {
    console.warn("Elementos do microfone não encontrados.");
    return;
  }
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
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
    try {
      recognition.start();
      resultDiv.textContent = "Ouvindo...";
      resultDiv.style.color = "blue";
    } catch (err) {
      console.warn("Erro ao iniciar reconhecimento:", err);
    }
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
