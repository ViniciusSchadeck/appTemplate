// alert("This is a message!");

const URL_API_ADDRESS = 'http://dr-vecserver.ddns.net';
const URL_API_PORT = '30555';

// ==================== FUNÇÃO PARA CARREGAR HTML EXTERNO ====================
async function loadPage(page) {
  const app = document.getElementById('app');
  
  try {
    // Mostra loading enquanto carrega (opcional)
    app.innerHTML = `<div style="text-align:center; padding:50px;">Carregando...</div>`;

    const response = await fetch(`pages/${page}.html`);
    
    if (!response.ok) {
      throw new Error(`Página ${page} não encontrada`);
    }

    const html = await response.text();
    app.innerHTML = html;

    // Re-inicializa eventos específicos da página (ex: formulários)
    initializePageEvents(page);

  } catch (error) {
    console.error(error);
    app.innerHTML = `<div class="container"><p style="color:red; text-align:center;">Erro ao carregar a página: ${page}</p></div>`;
  }
}

// Função para inicializar eventos após carregar a página
function initializePageEvents(page) {
  if (page === 'login') {
    const form = document.getElementById('loginForm');
    if (form) form.addEventListener('submit', handleLogin);
  }
  
  if (page === 'register') {
    const form = document.getElementById('userRegistrationForm');
    if (form) form.addEventListener('submit', handleRegister);
  }
  
  // Adicione mais páginas conforme necessário
}

// ==================== CONFIGURAÇÃO ====================
// const API_URL = 'http://localhost:30555';   // sua porta
const API_URL = URL_API_ADDRESS + ':' + URL_API_PORT;   // sua porta
// const API_URL = ''; // Era para funcionar com qualquer url, não deu certo

let currentUser = null;

// ==================== FUNÇÕES DE RENDER ====================
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="container">
      <h1>Login</h1>
      <form id="loginForm">
        <input type="email" id="email" placeholder="E-mail" required>
        <input type="password" id="password" placeholder="Senha" required>
        <button type="submit" id="btnLogin">Entrar</button>
      </form>
      <p class="center">
        Não tem conta? 
        <a href="#" onclick="navigateTo('register')">Cadastre-se</a>
      </p>
      <div id="errorMessage" class="error"></div>
    </div>
  `;

  // Adiciona evento após renderizar
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

function renderRegister() {
  document.getElementById('app').innerHTML = `
    <div class="container">
      <h1>Cadastro</h1>
      <form id="registerForm">
        <input type="text" id="name" placeholder="Nome" required>
        <input type="email" id="email" placeholder="E-mail" required>
        <input type="password" id="password" placeholder="Senha" required>
        <button type="submit" id="btnRegister">Cadastrar</button>
      </form>
      <p class="center">
        Já tem conta? 
        <a href="#" onclick="navigateTo('login')">Faça login</a>
      </p>
      <div id="errorMessage" class="error"></div>
    </div>
  `;

  document.getElementById('userRegistrationForm').addEventListener('submit', handleRegister);
}

function renderDashboard() {
  document.getElementById('app').innerHTML = `
    <div class="container" style="max-width: 700px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h1>Dashboard</h1>
        <button onclick="logout()" style="background-color: #d32f2f;">Sair</button>
      </div>
      <p style="font-size: 18px;">Bem-vindo, <strong id="userName"></strong>!</p>
      
      <div style="margin-top: 40px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
        <p id="userInfo">Carregando...</p>
      </div>
    </div>
  `;

  loadUserData();
}

// ==================== NAVEGAÇÃO ====================
// function navigateTo(page) {
//   if (page === 'login') renderLogin();
//   else if (page === 'register') renderRegister();
//   else if (page === 'dashboard') renderDashboard();
// }
// Navegação simples
function navigateTo(page) {
  let route = '';

  switch(page) {
    case 'login':
      route = '/login';
      break;
    case 'register':
      route = '/register';
      break;
    case 'dashboard':
      route = '/dashboard';
      break;
    default:
      route = '/login';
  }

  // Atualiza a URL sem recarregar a página
  history.pushState({ page }, '', route);
  loadPage(page);
}

// ==================== AUTH FUNCTIONS ====================
async function handleLogin(e) {
  e.preventDefault();
  // ... mesmo código de login que você já tinha, mas no final:
  // if success → navigateTo('dashboard')

  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const btn = document.getElementById('btnLogin');
      const errorDiv = document.getElementById('errorMessage');

      btn.disabled = true;
      errorDiv.textContent = '';

      try {
        const response = await fetch(API_URL + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include'        // ← importante para cookies
        });

        if (response.ok) {
          // window.location.href = 'dashboard.html';
          navigateTo('dashboard');
        } else {
          const data = await response.json().catch(() => ({}));
          errorDiv.textContent = data.message || 'E-mail ou senha incorretos.';
        }
      } catch (err) {
        errorDiv.textContent = 'Erro de conexão com o servidor.';
      } finally {
        btn.disabled = false;
      }
    });
  }
}

async function handleRegister(e) {
  e.preventDefault();
  // código de registro...

const userRegistrationForm = document.getElementById('userRegistrationForm');

if (userRegistrationForm) {
  userRegistrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('btnRegister');
    const errorDiv = document.getElementById('errorMessage');

    btn.disabled = true;
    errorDiv.textContent = '';

    try {
      const response = await fetch(API_URL + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include'        // ← importante para cookies
      });

      if (response.ok) {
        // window.location.href = 'dashboard.html';
          navigateTo('dashboard');
      } else {
        const data = await response.json().catch(() => ({}));
        errorDiv.textContent = data.message || 'Erro ao cadastrar conta.';
      }
    } catch (err) {
      errorDiv.textContent = 'Erro de conexão com o servidor.';
    } finally {
      btn.disabled = false;
    }
  });
}
}

// ==================== CHECK AUTH (para páginas protegidas) ====================
// async function checkAuth() {
//   const loading = document.getElementById('loading');
//   const mainContent = document.getElementById('mainContent');
//   try {
//     const res = await fetch(API_URL + '/auth/me', {
//       method: 'GET',
//       credentials: 'include'
//     });

//     if (res.ok) {
//       // Usuário autenticado → mostra o conteúdo
//       loading.style.display = 'none';
//       mainContent.style.display = 'block';
//       document.body.style.visibility = 'visible';
//     } else {
//       window.location.href = 'login.html';
//     }
//   } catch (err) {
//     window.location.href = 'login.html';
//   }
// }
async function checkAuth() {
  // Não verifica em páginas públicas
  const currentPath = window.location.pathname;
  if (currentPath === '/login' || currentPath === '/register') {
    return; // sai sem fazer nada
  }

  try {
    // const res = await fetch(`${API_URL}/auth/me`, {
    const res = await fetch(API_URL + '/auth/me', {
    // const res = await fetch('/auth/me', { // Era para funcionar com qualquer url, não deu certo
      credentials: 'include'
    });

    if (res.ok) {
      currentUser = await res.json();
      navigateTo('dashboard');
    } else {
      navigateTo('login');
    }
  } catch {
    navigateTo('login');
  }
}

// ==================== LOGOUT ====================
// async function logout() {
//   try {
//     await fetch(API_URL + '/auth/logout', {
//       method: 'POST',
//       credentials: 'include'
//     });
//   } catch (err) {
//     console.error(err);
//   }
//   window.location.href = 'login.html';
// }

async function logout() {
  // await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  await fetch(API_URL + '/auth/logout', { method: 'POST', credentials: 'include' });
  // await fetch('/auth/logout', { method: 'POST', credentials: 'include' }); // Era para funcionar com qualquer url, não deu certo
  currentUser = null;
  navigateTo('login');
}

// ==================== GERENCIAR BOTÃO VOLTAR DO NAVEGADOR ====================
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.page) {
    loadPage(event.state.page);
  } else {
    // Se não tiver estado, verifica autenticação novamente
    checkAuth();
  }
});

// ==================== INICIALIZAÇÃO ====================
// document.addEventListener('DOMContentLoaded', () => {
//   checkAuth();
// });
// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
  // Verifica qual URL o usuário acessou
  const path = window.location.pathname;

  if (path === '/dashboard') {
    checkAuth();                    // vai redirecionar se não estiver logado
  } 
  else if (path === '/register') {
    loadPage('register');
  } 
  else if (path === '/login') {
    loadPage('login');
  } 
  else {
    // Qualquer outra URL → vai para login
    // navigateTo('login');
    checkAuth();
  }
});