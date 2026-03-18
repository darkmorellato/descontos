// ============================================================
// FIREBASE.JS — Configuração e helpers do Firestore
// ============================================================

// As credenciais do Firebase foram movidas para 'firebase-config.js'.
// Certifique-se de que este arquivo existe e está preenchido corretamente.

let db;
let auth;
let COLLECTION_REF;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  COLLECTION_REF = db.collection('descontos');
} catch (e) {
  console.error("Erro ao inicializar o Firebase. Verifique se o arquivo 'firebase-config.js' está correto e se as credenciais são válidas.", e);
  // Opcional: Mostrar um erro visível para o usuário na tela
  document.body.innerHTML = '<div style="text-align: center; padding: 40px; font-family: sans-serif; color: #d32f2f;"><h1>Erro de Configuração</h1><p>Não foi possível conectar ao Firebase. Verifique o console para mais detalhes e contate o administrador.</p></div>';
}

/**
 * Carrega os dados do Firestore.
 * Retorna o array de descontos ou null se não existir ainda.
 */
async function fbLoad() {
  const snap = await COLLECTION_REF.get();
  if (snap.empty) return null;
  return snap.docs.map(doc => doc.data());
}

/**
 * Salva ou atualiza um único desconto.
 */
async function fbSaveItem(desconto) {
  await COLLECTION_REF.doc(desconto.id).set({
    ...desconto,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Exclui um desconto pelo ID.
 */
async function fbDeleteItem(id) {
  await COLLECTION_REF.doc(id).delete();
}

/**
 * Salva todo o array em lotes (usado na migração e importação de JSON).
 */
async function fbSaveAll(descontos) {
  const chunks = [];
  for (let i = 0; i < descontos.length; i += 500) {
    chunks.push(descontos.slice(i, i + 500));
  }
  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach(d => {
      batch.set(COLLECTION_REF.doc(d.id), {
        ...d,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
  }
}

/**
 * Listener em tempo real — dispara quando outro dispositivo altera os dados.
 */
function fbListen(onChange) {
  return COLLECTION_REF.onSnapshot(snap => {
    const descontos = snap.docs.map(doc => doc.data());
    onChange(descontos);
  }, err => {
    console.error('Firebase listener error:', err);
  });
}

/**
 * Busca a senha administrativa segura no Firestore (Cofre)
 */
async function fbGetAdminPassword() {
  try {
    const snap = await db.collection('config').doc('segurança').get();
    if (snap.exists) {
      const data = snap.data();
      // Retorna a senha, aceitando variações de maiúsculas/minúsculas caso tenha digitado diferente no Firebase
      return data.adminPassword || data.adminpassword || data.senha || null;
    }
    return null;
  } catch (err) {
    throw err;
  }
}
