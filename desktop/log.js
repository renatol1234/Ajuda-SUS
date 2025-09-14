// ===== Configuração do Firebase =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRYR48P8M8E6-OxOdhJPS5DffAnHjpWpY",
  authDomain: "tcc-ajuda-sus.firebaseapp.com",
  projectId: "tcc-ajuda-sus",
  storageBucket: "tcc-ajuda-sus.firebasestorage.app",
  messagingSenderId: "257850974368",
  appId: "1:257850974368:web:9f97356bdbd9a6f20ba9c5"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Autenticação anônima automática
signInAnonymously(auth)
  .then(() => console.log("✅ Usuário autenticado anonimamente"))
  .catch((err) => console.error("❌ Erro na autenticação anônima:", err));


  // ===== Função para salvar logs =====
window.salvarLogSintoma = async function(sintoma) {
  // Verifica se o navegador suporta geolocalização
  if (!navigator.geolocation) {
    console.warn("Geolocalização não suportada.");
    return;
  }

  // Obtém a posição do usuário
  navigator.geolocation.getCurrentPosition(async (position) => {
    const log = {
      symptom: sintoma,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date().toISOString()
    };

    try {
      // Salva o log no Firestore
      await addDoc(collection(db, "logs"), log);
      console.log("✅ Log salvo com sucesso:", log);
    } catch (error) {
      console.error("❌ Erro ao salvar log:", error);
    }
  }, (error) => {
    // Caso o usuário negue a permissão ou ocorra algum erro
    console.error("❌ Erro ao obter localização:", error);
  });
};




