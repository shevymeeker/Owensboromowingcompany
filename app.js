const STORAGE_KEY = 'greentask-pro-state-v1';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const generateId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
};

const deepClone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const defaultState = {
  clients: [],
  schedule: DAYS.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {}),
  notes: [],
  invoices: []
};

let state = loadState();

const dashboardButtons = document.querySelectorAll('.dashboard-card');
const panels = document.querySelectorAll('.panel');
const panelNav = document.getElementById('panel-nav');
const panelNavButtons = panelNav ? Array.from(panelNav.querySelectorAll('[data-target]')) : [];
const clientForm = document.getElementById('client-form');
const clientsList = document.getElementById('clients-list');
const scheduleForm = document.getElementById('schedule-form');
const calendarGrid = document.getElementById('calendar-grid');
const notesForm = document.getElementById('note-form');
const notesList = document.getElementById('notes-list');
const invoiceForm = document.getElementById('invoice-form');
const invoiceHistory = document.getElementById('invoice-history');
const invoicePreview = document.getElementById('invoice-preview');
const invoiceTotals = document.getElementById('invoice-totals');
const lineItemsContainer = document.getElementById('line-items-container');
const printButton = document.getElementById('print-invoice');
const smsButton = document.getElementById('sms-invoice');

setupDashboard();
setupForms();
renderAll();
registerServiceWorker();

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return deepClone(defaultState);
    const parsed = JSON.parse(stored);
    return {
      clients: parsed.clients || [],
      schedule: { ...deepClone(defaultState.schedule), ...(parsed.schedule || {}) },
      notes: parsed.notes || [],
      invoices: parsed.invoices || []
    };
  } catch (error) {
    console.warn('Unable to load saved data, starting fresh.', error);
    return deepClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setupDashboard() {
  const navButtons = [...dashboardButtons, ...panelNavButtons];
  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      showPanel(targetId);
    });
  });
}

function showPanel(panelId) {
  if (!panelId) return;

  if (panelId === 'dashboard-home') {
    updatePanelNav(panelId);
    panels.forEach((panel) => {
      panel.hidden = true;
      panel.classList.remove('active');
    });
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  updatePanelNav(panelId);

  panels.forEach((panel) => {
    if (panel.id === panelId) {
      panel.hidden = false;
      panel.classList.add('active');
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      panel.hidden = true;
      panel.classList.remove('active');
    }
  });
}

function updatePanelNav(panelId) {
  if (!panelNav) return;

  const isDashboard = panelId === 'dashboard-home';
  panelNav.hidden = isDashboard;

  panelNavButtons.forEach((button) => {
    const isActive = button.dataset.target === panelId;
    button.classList.toggle('is-active', isActive);
    if (isActive) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

function setupForms() {
  clientForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const newClient = {
      id: generateId(),
      name: document.getElementById('client-name').value.trim(),
      address: document.getElementById('client-address').value.trim(),
      phone: document.getElementById('client-phone').value.trim(),
      email: document.getElementById('client-email').value.trim(),
      notes: document.getElementById('client-notes').value.trim(),
      createdAt: new Date().toISOString()
    };

    if (!newClient.name || !newClient.address || !newClient.phone) {
      alert('Name, address, and phone are required.');
      return;
    }

    state.clients.push(newClient);
    saveState();
    clientForm.reset();
    renderClients();
    refreshClientOptions();
    alert('Client saved.');
  });

  scheduleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const scheduleEntry = {
      id: generateId(),
      clientId: document.getElementById('schedule-client').value,
      day: document.getElementById('schedule-day').value,
      time: document.getElementById('schedule-time').value,
      duration: Number(document.getElementById('schedule-duration').value),
      summary: document.getElementById('schedule-summary').value.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    if (!scheduleEntry.clientId) {
      alert('Please choose a client.');
      return;
    }

    state.schedule[scheduleEntry.day].push(scheduleEntry);
    state.schedule[scheduleEntry.day].sort((a, b) => a.time.localeCompare(b.time));
    saveState();
    scheduleForm.reset();
    populateScheduleDays();
    renderCalendar();
    alert('Task added to calendar.');
  });

  notesForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fileInput = document.getElementById('note-file');
    const file = fileInput.files?.[0];
    let mediaData = null;

    if (file) {
      mediaData = await fileToDataUrl(file);
    }

    const note = {
      id: generateId(),
      title: document.getElementById('note-title').value.trim(),
      body: document.getElementById('note-body').value.trim(),
      createdAt: new Date().toISOString(),
      media: mediaData ? { name: file.name, type: file.type, data: mediaData } : null
    };

    state.notes.unshift(note);
    saveState();
    notesForm.reset();
    renderNotes();
  });

  invoiceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const invoice = collectInvoiceData();
    if (!invoice) return;
    state.invoices.unshift(invoice);
    saveState();
    renderInvoiceHistory();
    renderInvoicePreview(invoice);
    alert('Invoice saved.');
  });

  printButton.addEventListener('click', () => {
    const invoice = collectInvoiceData();
    if (!invoice) return;
    renderInvoicePreview(invoice);
    window.print();
  });

  smsButton.addEventListener('click', () => {
    const invoice = collectInvoiceData();
    if (!invoice) return;
    const client = findClient(invoice.clientId);
    if (!client?.phone) {
      alert('The selected client needs a phone number on file.');
      return;
    }
    const smsBody = encodeURIComponent(buildSmsBody(invoice, client));
    window.location.href = `sms:${client.phone}?&body=${smsBody}`;
  });

  document.getElementById('add-line-item').addEventListener('click', () => {
    addLineItem();
  });

  ['invoice-client', 'invoice-tax'].forEach((id) => {
    document.getElementById(id).addEventListener('change', () => renderInvoiceTotals());
    document.getElementById(id).addEventListener('input', () => renderInvoiceTotals());
  });
  document.getElementById('discount-senior').addEventListener('change', () => renderInvoiceTotals());
  document.getElementById('discount-veteran').addEventListener('change', () => renderInvoiceTotals());
}

function renderAll() {
  refreshClientOptions();
  renderClients();
  renderCalendar();
  renderNotes();
  ensureLineItems();
  renderInvoiceTotals();
  renderInvoiceHistory();
  setDefaultInvoiceDate();
  populateScheduleDays();
}

function refreshClientOptions() {
  const clientSelects = [document.getElementById('schedule-client'), document.getElementById('invoice-client')];
  clientSelects.forEach((select) => {
    select.innerHTML = '<option value="">Select client…</option>';
    state.clients.forEach((client) => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      select.append(option);
    });
    select.disabled = state.clients.length === 0;
  });
}

function renderClients() {
  clientsList.innerHTML = '';
  if (state.clients.length === 0) {
    clientsList.innerHTML = '<p class="empty-state">No clients yet. Add your first client above.</p>';
    return;
  }

  state.clients
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((client) => {
      const card = document.createElement('article');
      card.className = 'client-card';
      const created = new Date(client.createdAt).toLocaleDateString();
      card.innerHTML = `
        <header>
          <div>
            <h3>${client.name}</h3>
            <div class="client-meta">Added ${created}</div>
          </div>
          <span class="badge">${client.phone}</span>
        </header>
        <p>${client.address}</p>
        <p>${client.email || ''}</p>
        <p>${client.notes || ''}</p>
        <div class="client-actions">
          <button type="button" class="secondary" data-action="call">Call</button>
          <button type="button" class="secondary" data-action="text">Text</button>
          <button type="button" class="secondary" data-action="remove">Remove</button>
        </div>
      `;

      card.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => handleClientAction(client.id, btn.dataset.action));
      });

      clientsList.append(card);
    });
}

function handleClientAction(clientId, action) {
  const client = findClient(clientId);
  if (!client) return;

  if (action === 'call') {
    window.location.href = `tel:${client.phone}`;
  } else if (action === 'text') {
    window.location.href = `sms:${client.phone}`;
  } else if (action === 'remove') {
    const confirmed = confirm(`Remove ${client.name}? Their schedule entries will stay for reference.`);
    if (!confirmed) return;
    state.clients = state.clients.filter((item) => item.id !== clientId);
    saveState();
    refreshClientOptions();
    renderClients();
  }
}

function populateScheduleDays() {
  const scheduleDay = document.getElementById('schedule-day');
  scheduleDay.innerHTML = '';
  DAYS.forEach((day) => {
    const option = document.createElement('option');
    option.value = day;
    option.textContent = day;
    scheduleDay.append(option);
  });
  const today = new Date().getDay();
  scheduleDay.value = DAYS[today];
}

function renderCalendar() {
  calendarGrid.innerHTML = '';

  DAYS.forEach((day) => {
    const dayColumn = document.createElement('section');
    dayColumn.className = 'calendar-day';

    const header = document.createElement('header');
    const title = document.createElement('h3');
    title.textContent = day;
    const count = document.createElement('span');
    count.className = 'badge';
    count.textContent = `${state.schedule[day]?.length || 0} jobs`;
    header.append(title, count);
    dayColumn.append(header);

    const list = document.createElement('ul');
    const entries = state.schedule[day] || [];

    if (entries.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'No work scheduled.';
      list.append(empty);
    } else {
      entries
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time))
        .forEach((entry) => {
          const item = document.createElement('li');
          item.className = 'schedule-item';
          if (entry.completed) {
            item.classList.add('completed');
          }
          const client = findClient(entry.clientId);
          const clientName = client ? client.name : 'Unknown client';
          item.innerHTML = `
            <strong>${clientName}</strong>
            <div class="meta">${formatTime(entry.time)} · ${entry.duration}h</div>
            <p>${entry.summary}</p>
            <div class="schedule-actions">
              <button type="button" class="secondary" data-action="complete">${entry.completed ? 'Undo' : 'Complete'}</button>
              <button type="button" class="secondary" data-action="move">Reschedule</button>
              <button type="button" class="secondary" data-action="remove">Remove</button>
            </div>
          `;

          item.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', () => handleScheduleAction(day, entry.id, btn.dataset.action));
          });

          list.append(item);
        });
    }

    dayColumn.append(list);
    calendarGrid.append(dayColumn);
  });
}

function handleScheduleAction(day, entryId, action) {
  const entries = state.schedule[day];
  const index = entries.findIndex((item) => item.id === entryId);
  if (index === -1) return;
  const entry = entries[index];

  if (action === 'complete') {
    entry.completed = !entry.completed;
  } else if (action === 'remove') {
    const confirmed = confirm('Remove this scheduled job?');
    if (!confirmed) return;
    entries.splice(index, 1);
  } else if (action === 'move') {
    const newDay = prompt('Move to which day? (e.g., Monday)', entry.day);
    if (!newDay || !DAYS.includes(newDay)) {
      alert('Please enter a valid day name (Sunday - Saturday).');
    } else {
      const newTime = prompt('New start time? (HH:MM)', entry.time);
      if (!newTime) return;
      const durationInput = prompt('New duration in hours?', entry.duration);
      const newDuration = Number(durationInput);
      if (!durationInput || Number.isNaN(newDuration)) {
        alert('Duration must be a number.');
        return;
      }
      entries.splice(index, 1);
      entry.day = newDay;
      entry.time = newTime;
      entry.duration = newDuration;
      state.schedule[newDay].push(entry);
      state.schedule[newDay].sort((a, b) => a.time.localeCompare(b.time));
    }
  }

  saveState();
  renderCalendar();
}

function renderNotes() {
  notesList.innerHTML = '';
  if (state.notes.length === 0) {
    notesList.innerHTML = '<p class="empty-state">No notes saved yet.</p>';
    return;
  }

  state.notes.forEach((note) => {
    const card = document.createElement('article');
    card.className = 'note-card';
    const timestamp = new Date(note.createdAt).toLocaleString();
    card.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.body.replace(/\n/g, '<br />')}</p>
      <div class="note-meta">Saved ${timestamp}</div>
      <div class="inline-actions">
        <button type="button" class="secondary" data-action="remove">Remove</button>
      </div>
    `;

    if (note.media) {
      const container = document.createElement('div');
      container.className = 'note-media';
      if (note.media.type.startsWith('video')) {
        const video = document.createElement('video');
        video.controls = true;
        video.src = note.media.data;
        container.append(video);
      } else {
        const img = document.createElement('img');
        img.src = note.media.data;
        img.alt = note.media.name;
        img.style.width = '100%';
        container.append(img);
      }
      card.append(container);
    }

    card.querySelector('[data-action="remove"]').addEventListener('click', () => {
      const confirmed = confirm('Remove this note?');
      if (!confirmed) return;
      state.notes = state.notes.filter((item) => item.id !== note.id);
      saveState();
      renderNotes();
    });

    notesList.append(card);
  });
}

function ensureLineItems() {
  if (!lineItemsContainer.children.length) {
    addLineItem();
  }
}

function addLineItem(data = null) {
  const id = generateId();
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.dataset.id = id;
  wrapper.innerHTML = `
    <div class="form-grid">
      <label>
        Description
        <input type="text" data-field="description" placeholder="Service description" required value="${data?.description || ''}" />
      </label>
      <label>
        Quantity
        <input type="number" min="0" step="0.25" data-field="quantity" value="${data?.quantity ?? 1}" />
      </label>
      <label>
        Rate ($)
        <input type="number" min="0" step="0.01" data-field="rate" value="${data?.rate ?? 0}" />
      </label>
      <label>
        Type
        <select data-field="type">
          <option value="labor" ${data?.type === 'labor' ? 'selected' : ''}>Labor</option>
          <option value="materials" ${data?.type === 'materials' ? 'selected' : ''}>Materials</option>
        </select>
      </label>
    </div>
    <div class="inline-actions">
      <button type="button" class="secondary" data-action="duplicate">Duplicate</button>
      <button type="button" class="secondary" data-action="remove">Remove</button>
    </div>
  `;

  wrapper.querySelector('[data-action="remove"]').addEventListener('click', () => {
    if (lineItemsContainer.children.length === 1) {
      alert('At least one line item is required.');
      return;
    }
    wrapper.remove();
    renderInvoiceTotals();
  });

  wrapper.querySelector('[data-action="duplicate"]').addEventListener('click', () => {
    const values = readLineItem(wrapper);
    addLineItem(values);
  });

  wrapper.querySelectorAll('input, select').forEach((element) => {
    element.addEventListener('input', renderInvoiceTotals);
    element.addEventListener('change', renderInvoiceTotals);
  });

  lineItemsContainer.append(wrapper);
  renderInvoiceTotals();
}

function readLineItem(wrapper) {
  return {
    description: wrapper.querySelector('[data-field="description"]').value.trim(),
    quantity: Number(wrapper.querySelector('[data-field="quantity"]').value) || 0,
    rate: Number(wrapper.querySelector('[data-field="rate"]').value) || 0,
    type: wrapper.querySelector('[data-field="type"]').value
  };
}

function collectInvoiceData() {
  const clientId = document.getElementById('invoice-client').value;
  if (!clientId) {
    alert('Choose a client to generate an invoice.');
    return null;
  }
  const client = findClient(clientId);
  if (!client) {
    alert('Client not found.');
    return null;
  }

  const date = document.getElementById('invoice-date').value;
  if (!date) {
    alert('Please select an invoice date.');
    return null;
  }

  const taxRate = Number(document.getElementById('invoice-tax').value) / 100;
  const invoiceNumber = document.getElementById('invoice-number').value.trim() || generateInvoiceNumber();
  const notes = document.getElementById('invoice-notes').value.trim();
  const seniorDiscount = document.getElementById('discount-senior').checked;
  const veteranDiscount = document.getElementById('discount-veteran').checked;

  const items = Array.from(lineItemsContainer.children).map(readLineItem).filter((item) => item.description);

  if (!items.length) {
    alert('Add at least one service.');
    return null;
  }
  const totals = calculateTotals(items, taxRate, seniorDiscount, veteranDiscount);

  const invoice = {
    id: generateId(),
    clientId,
    invoiceNumber,
    date,
    notes,
    items,
    totals,
    createdAt: new Date().toISOString()
  };

  renderInvoiceTotals(totals);
  renderInvoicePreview(invoice);

  return invoice;
}

function renderInvoiceTotals(totals = null) {
  const clientId = document.getElementById('invoice-client').value;
  const client = clientId ? findClient(clientId) : null;

  const data =
    totals ||
    calculateTotals(
      Array.from(lineItemsContainer.children).map(readLineItem).filter((item) => item.description),
      Number(document.getElementById('invoice-tax').value) / 100,
      document.getElementById('discount-senior').checked,
      document.getElementById('discount-veteran').checked
    );

  invoiceTotals.innerHTML = `
    <div>Labor total <strong>$${data.laborTotal.toFixed(2)}</strong></div>
    <div>Materials total <strong>$${data.materialsTotal?.toFixed(2) ?? '0.00'}</strong></div>
    <div>Subtotal <strong>$${data.subtotal?.toFixed(2) ?? '0.00'}</strong></div>
    <div>Sales tax (${((data.taxRate || 0) * 100).toFixed(1)}%) <strong>$${data.tax?.toFixed(2) ?? '0.00'}</strong></div>
    <div>Senior discount <strong>−$${data.seniorSavings?.toFixed(2) ?? '0.00'}</strong></div>
    <div>Veteran labor discount <strong>−$${data.veteranSavings?.toFixed(2) ?? '0.00'}</strong></div>
    <div class="badge">Total due $${data.totalDue?.toFixed(2) ?? '0.00'}</div>
  `;

  if (client?.name) {
    invoiceTotals.insertAdjacentHTML('afterbegin', `<div>Billing <strong>${client.name}</strong></div>`);
  }
}

function renderInvoicePreview(invoice) {
  if (!invoice) {
    invoicePreview.hidden = true;
    return;
  }
  const client = findClient(invoice.clientId);
  const fields = invoicePreview.querySelectorAll('[data-field]');
  fields.forEach((element) => {
    const field = element.dataset.field;
    if (field === 'items') {
      element.innerHTML = invoice.items
        .map((item) => {
          const amount = (item.quantity * item.rate).toFixed(2);
          return `<tr><td>${item.description}</td><td>${item.quantity}</td><td>$${item.rate.toFixed(2)}</td><td>${item.type}</td><td>$${amount}</td></tr>`;
        })
        .join('');
    } else if (field === 'summary') {
      element.innerHTML = `
        <div><span>Labor</span><span>$${invoice.totals.laborTotal.toFixed(2)}</span></div>
        <div><span>Materials</span><span>$${invoice.totals.materialsTotal.toFixed(2)}</span></div>
        <div><span>Subtotal</span><span>$${invoice.totals.subtotal.toFixed(2)}</span></div>
        <div><span>Sales tax</span><span>$${invoice.totals.tax.toFixed(2)}</span></div>
        <div><span>Senior discount</span><span>−$${invoice.totals.seniorSavings.toFixed(2)}</span></div>
        <div><span>Veteran discount</span><span>−$${invoice.totals.veteranSavings.toFixed(2)}</span></div>
        <div><strong>Total Due</strong><strong>$${invoice.totals.totalDue.toFixed(2)}</strong></div>
      `;
    } else if (field === 'notes') {
      element.textContent = invoice.notes || 'Thank you for your business!';
    } else if (field === 'client-name') {
      element.textContent = client?.name || '';
    } else if (field === 'client-address') {
      element.textContent = client?.address || '';
    } else if (field === 'client-phone') {
      element.textContent = client?.phone || '';
    } else if (field === 'client-email') {
      element.textContent = client?.email || '';
    } else if (field === 'number') {
      element.textContent = invoice.invoiceNumber;
    } else if (field === 'date') {
      element.textContent = new Date(invoice.date).toLocaleDateString();
    }
  });

  invoicePreview.hidden = false;
}

function calculateTotals(items, taxRate, seniorDiscount, veteranDiscount) {
  const safeTaxRate = Number.isFinite(taxRate) ? taxRate : 0;
  if (!items?.length) {
    return {
      laborTotal: 0,
      materialsTotal: 0,
      subtotal: 0,
      taxRate: safeTaxRate,
      tax: 0,
      totalBeforeDiscounts: 0,
      seniorSavings: 0,
      veteranSavings: 0,
      totalDue: 0
    };
  }

  const laborTotal = items
    .filter((item) => item.type === 'labor')
    .reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const materialsTotal = items
    .filter((item) => item.type === 'materials')
    .reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const subtotal = laborTotal + materialsTotal;
  const tax = subtotal * safeTaxRate;
  const totalBeforeDiscounts = subtotal + tax;
  const seniorSavings = seniorDiscount ? totalBeforeDiscounts * 0.1 : 0;
  const veteranSavings = veteranDiscount ? laborTotal * 0.15 : 0;
  const totalDue = Math.max(0, totalBeforeDiscounts - seniorSavings - veteranSavings);

  return {
    laborTotal,
    materialsTotal,
    subtotal,
    taxRate: safeTaxRate,
    tax,
    totalBeforeDiscounts,
    seniorSavings,
    veteranSavings,
    totalDue
  };
}

function renderInvoiceHistory() {
  invoiceHistory.innerHTML = '';
  if (state.invoices.length === 0) {
    invoiceHistory.innerHTML = '<p class="empty-state">No invoices created yet.</p>';
    return;
  }

  state.invoices.slice(0, 5).forEach((invoice) => {
    const client = findClient(invoice.clientId);
    const card = document.createElement('article');
    card.className = 'invoice-card';
    card.innerHTML = `
      <header>
        <div>
          <h3>#${invoice.invoiceNumber}</h3>
          <div class="invoice-meta">${new Date(invoice.date).toLocaleDateString()} • ${client?.name || 'Unknown client'}</div>
        </div>
        <span class="badge">$${invoice.totals.totalDue.toFixed(2)}</span>
      </header>
      <div class="invoice-actions">
        <button type="button" class="secondary" data-action="load">Load</button>
      </div>
    `;

    card.querySelector('[data-action="load"]').addEventListener('click', () => {
      loadInvoice(invoice);
    });

    invoiceHistory.append(card);
  });
}

function loadInvoice(invoice) {
  document.getElementById('invoice-client').value = invoice.clientId;
  document.getElementById('invoice-number').value = invoice.invoiceNumber;
  document.getElementById('invoice-date').value = invoice.date;
  document.getElementById('invoice-tax').value = (invoice.totals.taxRate * 100).toFixed(2);
  document.getElementById('discount-senior').checked = invoice.totals.seniorSavings > 0;
  document.getElementById('discount-veteran').checked = invoice.totals.veteranSavings > 0;
  document.getElementById('invoice-notes').value = invoice.notes;

  lineItemsContainer.innerHTML = '';
  invoice.items.forEach((item) => addLineItem(item));
  renderInvoiceTotals(invoice.totals);
  renderInvoicePreview(invoice);
  showPanel('invoicing-section');
}

function setDefaultInvoiceDate() {
  const input = document.getElementById('invoice-date');
  if (!input.value) {
    const today = new Date().toISOString().slice(0, 10);
    input.value = today;
  }
}

function buildSmsBody(invoice, client) {
  const lines = [
    `Invoice #${invoice.invoiceNumber}`,
    `Client: ${client.name}`,
    `Total Due: $${invoice.totals.totalDue.toFixed(2)}`,
    '',
    ...invoice.items.map((item) => `${item.description} - $${(item.quantity * item.rate).toFixed(2)}`),
    '',
    'Thank you for choosing Owensboro Mowing Co.!'
  ];
  return lines.join('\n');
}

function generateInvoiceNumber() {
  const prefix = 'INV';
  const random = Math.floor(Math.random() * 90000 + 10000);
  return `${prefix}-${random}`;
}

function findClient(id) {
  return state.clients.find((client) => client.id === id);
}

function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./service-worker.js')
        .catch((error) => console.warn('Service worker registration failed', error));
    });
  }
}
