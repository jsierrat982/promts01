/**
 * Lógica modular usando ES6+
 * Implementa LocalStorage para persistencia estática
 */

// --- 1. ESTADO DE LA APLICACIÓN ---
const STORAGE_KEY = 'my_ai_prompts';
let prompts = [];
let currentFilter = 'Todas';

// --- 2. SELECCIÓN DE ELEMENTOS DOM ---
const DOM = {
  grid: document.getElementById('prompts-grid'),
  categoryList: document.getElementById('category-list'),
  categoryTitle: document.getElementById('current-category'),
  promptCount: document.getElementById('prompt-count'),
  emptyState: document.getElementById('empty-state'),
  searchInput: document.getElementById('search-input'),
  modal: document.getElementById('prompt-modal'),
  form: document.getElementById('prompt-form'),
  datalist: document.getElementById('category-options'),
  btnNew: document.getElementById('btn-new-prompt'),
  btnClose: document.getElementById('btn-close-modal'),
  btnCancel: document.getElementById('btn-cancel-modal'),
  btnExport: document.getElementById('btn-export'),
  fileImport: document.getElementById('file-import')
};

// --- 3. FUNCIONES DE PERSISTENCIA (LocalStorage) ---
const loadData = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  prompts = data ? JSON.parse(data) : [];
};

const saveData = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
};

// --- 4. RENDERIZADO Y DOM ---
const getCategories = () => {
  const cats = new Set(prompts.map(p => p.category));
  return ['Todas', ...Array.from(cats).sort()];
};

const renderCategories = () => {
  const categories = getCategories();
  
  // Actualizar Sidebar
  DOM.categoryList.innerHTML = categories.map(cat => `
    <li class="${cat === currentFilter ? 'active' : ''}" data-category="${cat}">
      ${cat}
    </li>
  `).join('');

  // Actualizar Datalist para el formulario (autocompletado)
  DOM.datalist.innerHTML = categories
    .filter(cat => cat !== 'Todas')
    .map(cat => `<option value="${cat}">`)
    .join('');
};

const renderPrompts = (query = '') => {
  const filtered = prompts.filter(p => {
    const matchCategory = currentFilter === 'Todas' || p.category === currentFilter;
    const matchQuery = p.title.toLowerCase().includes(query.toLowerCase()) || 
                       p.text.toLowerCase().includes(query.toLowerCase());
    return matchCategory && matchQuery;
  });

  DOM.categoryTitle.textContent = currentFilter;
  DOM.promptCount.textContent = `${filtered.length} prompt(s)`;

  if (filtered.length === 0) {
    DOM.grid.innerHTML = '';
    DOM.emptyState.classList.remove('hidden');
    return;
  }

  DOM.emptyState.classList.add('hidden');
  DOM.grid.innerHTML = filtered.map(p => `
    <article class="prompt-card">
      <h3>${p.title}</h3>
      <span class="badge">${p.category}</span>
      <div class="prompt-text">${p.text}</div>
      <div class="tags">${p.tags.map(t => `#${t.trim()}`).join(' ')}</div>
      <div class="card-actions">
        <button class="btn btn-secondary copy-btn" data-text="${encodeURIComponent(p.text)}">📋 Copiar</button>
        <button class="btn btn-secondary delete-btn" data-id="${p.id}">🗑️</button>
      </div>
    </article>
  `).join('');
};

// --- 5. MANEJADORES DE EVENTOS (Arrow Functions + Asincronía) ---

// Guardar nuevo prompt
DOM.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const newPrompt = {
    id: Date.now().toString(),
    title: document.getElementById('prompt-title').value.trim(),
    category: document.getElementById('prompt-category').value.trim(),
    tags: document.getElementById('prompt-tags').value.split(',').filter(t => t.trim() !== ''),
    text: document.getElementById('prompt-text').value.trim()
  };

  prompts.unshift(newPrompt);
  saveData();
  DOM.form.reset();
  DOM.modal.close();
  
  renderCategories();
  renderPrompts(DOM.searchInput.value);
});

// Delegación de eventos para botones dinámicos (Copiar/Eliminar/Filtrar)
document.body.addEventListener('click', async (e) => {
  // Filtrar por categoría
  if (e.target.matches('#category-list li')) {
    currentFilter = e.target.dataset.category;
    renderCategories();
    renderPrompts(DOM.searchInput.value);
  }

  // Copiar al portapapeles usando API Moderna (Async/Await)
  if (e.target.matches('.copy-btn')) {
    try {
      const text = decodeURIComponent(e.target.dataset.text);
      await navigator.clipboard.writeText(text);
      e.target.textContent = '✅ Copiado';
      setTimeout(() => e.target.textContent = '📋 Copiar', 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  }

  // Eliminar prompt
  if (e.target.matches('.delete-btn')) {
    if (confirm('¿Eliminar este prompt?')) {
      prompts = prompts.filter(p => p.id !== e.target.dataset.id);
      saveData();
      renderCategories();
      renderPrompts(DOM.searchInput.value);
    }
  }
});

// Búsqueda en tiempo real
DOM.searchInput.addEventListener('input', (e) => renderPrompts(e.target.value));

// Controles del Modal nativo
DOM.btnNew.addEventListener('click', () => DOM.modal.showModal());
DOM.btnClose.addEventListener('click', () => DOM.modal.close());
DOM.btnCancel.addEventListener('click', () => DOM.modal.close());

// Exportar datos (JSON)
DOM.btnExport.addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "mis_prompts.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
});

// Importar datos (JSON)
DOM.fileImport.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported)) {
        prompts = imported;
        saveData();
        renderCategories();
        renderPrompts();
        alert('Datos importados con éxito');
      }
    } catch (err) {
      alert('Error: Archivo JSON no válido');
    }
  };
  reader.readAsText(file);
});

// --- 6. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderCategories();
  renderPrompts();
});
