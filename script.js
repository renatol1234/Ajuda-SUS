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

  setTimeout(redirecionar, 2500);