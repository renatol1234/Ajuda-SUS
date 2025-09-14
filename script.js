// função pop-up
function showLgpdPopup() {
    const lgpdAccepted = localStorage.getItem('lgpdAccepted');
    if (!lgpdAccepted) {
        document.getElementById('lgpd-popup').style.display = 'block';
        document.getElementById('lgpd-overlay').style.display = 'block';
    } else {
        // Se o LGPD já foi aceito, a aplicação pode iniciar o redirecionamento imediatamente
        // O delay aqui pode ser ajustado para exibir o "Verificando dispositivo" por mais ou menos tempo
        setTimeout(redirecionar, 2500);
    }
}

function aceitarLGPD() {
    localStorage.setItem('lgpdAccepted', 'true');
    document.getElementById('lgpd-popup').style.display = 'none';
    document.getElementById('lgpd-overlay').style.display = 'none';
    // Após aceitar, inicie o redirecionamento com o mesmo delay
    setTimeout(redirecionar, 2500);
}

// Chame esta função na sua inicialização do DOM
document.addEventListener('DOMContentLoaded', () => {
    // ... suas funções de inicialização atuais ...
    showLgpdPopup();
});

async function solicitarPermissoes() {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
      }
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn("Erro ao solicitar permissões:", err);
    }
  }

  function detectarAmbiente() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    const ehMobile = /android|iphone|ipad|ipod/i.test(userAgent);

    return { tipo: ehMobile ? "mobile" : "desktop" };
  }

  async function redirecionar() {
    await solicitarPermissoes();
    const ambiente = detectarAmbiente();
    if (ambiente.tipo === "mobile") {
      window.location.href = "./movel/mobile.html";
    } else {
      window.location.href = "./desktop/desktop.html";
    }
  }