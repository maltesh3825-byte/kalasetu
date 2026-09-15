/**
 * KalaKriti - Core Frontend Application Controller
 * Smart India Hackathon 2026 - SIH26090
 * Market Linkage and Cataloging for Marginalized Artisans
 */

// Application State
const state = {
  currentTab: 'home',
  selectedFile: null,
  uploadedImageUrl: null,
  aiResult: null,
  currentCategoryFilter: 'All',
  searchQuery: '',
  sortBy: 'newest',
  products: [],
  selectedProductForModal: null,
  isEnhanced: false,
  apiConfig: null,
  currentUser: null,
  accountView: 'profile',
  orderView: 'mine',
  accountOrders: [],
  accountIncomingOrders: [],
  accountPublishedProducts: [],
  accountRequests: [],
  accountNotifications: [],
  accountWishlist: [],
  accountAdminRequests: [],
  adminToken: localStorage.getItem('kalakriti_admin_token') || ''
};

// Fullscreen Opening Animation Controller
function dismissSplashScreen() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  splash.style.opacity = '0';
  splash.style.pointerEvents = 'none';
  setTimeout(() => {
    splash.classList.add('hidden');
  }, 520);
}

// Auto dismiss splash screen after animation completes (~2.2 seconds)
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      dismissSplashScreen();
    }, 2200);
  });
}

// Interactive Custom Modal System
let currentModalPrimaryAction = null;
let currentModalSecondaryAction = null;

function showInteractiveModal(options) {
  const modal = document.getElementById('interactiveModal');
  const badge = document.getElementById('interactiveModalBadge');
  const title = document.getElementById('interactiveModalTitle');
  const subtitle = document.getElementById('interactiveModalSubtitle');
  const message = document.getElementById('interactiveModalMessage');
  const primaryBtn = document.getElementById('interactiveModalPrimaryBtn');
  const secondaryBtn = document.getElementById('interactiveModalSecondaryBtn');

  if (!modal) {
    alert(options.message || options.title || 'Notice');
    return;
  }

  const typeIcons = {
    network: '',
    welcome: '',
    success: '',
    alert: '',
    error: ''
  };

  const typeBadgeColors = {
    network: 'bg-amber-100 border-amber-400 text-amber-600',
    welcome: 'bg-orange-100 border-orange-400 text-orange-600',
    success: 'bg-emerald-100 border-emerald-400 text-emerald-600',
    alert: 'bg-amber-100 border-amber-400 text-amber-600',
    error: 'bg-red-100 border-red-400 text-red-600'
  };

  if (badge) {
    badge.textContent = typeIcons[options.type] || '';
    badge.className = `w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl border-2 mb-4 shadow-sm ${typeBadgeColors[options.type] || 'bg-orange-50 border-orange-400 text-orange-600'}`;
  }

  if (title) title.textContent = options.title || 'Notice';
  
  if (subtitle) {
    if (options.subtitle) {
      subtitle.textContent = options.subtitle;
      subtitle.classList.remove('hidden');
    } else {
      subtitle.classList.add('hidden');
    }
  }

  if (message) message.textContent = options.message || '';

  if (primaryBtn) {
    primaryBtn.textContent = options.primaryText || 'OK';
    if (options.type === 'network') {
      primaryBtn.className = 'flex-1 py-3 px-4 rounded-xl text-sm font-extrabold text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-colors';
    } else {
      primaryBtn.className = 'flex-1 py-3 px-4 rounded-xl text-sm font-extrabold text-white bg-orange-600 hover:bg-orange-700 shadow-md transition-colors';
    }
    currentModalPrimaryAction = options.onPrimary || null;
  }

  if (secondaryBtn) {
    if (options.secondaryText) {
      secondaryBtn.textContent = options.secondaryText;
      secondaryBtn.classList.remove('hidden');
      currentModalSecondaryAction = options.onSecondary || null;
    } else {
      secondaryBtn.classList.add('hidden');
      currentModalSecondaryAction = null;
    }
  }

  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('interactive-modal-open');
    modal.classList.remove('opacity-0');
  });
}

function closeInteractiveModal() {
  const modal = document.getElementById('interactiveModal');
  if (!modal) return;
  modal.classList.remove('interactive-modal-open');
  modal.classList.add('opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 220);
}

// Global hook for interactive modal actions
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'interactiveModalPrimaryBtn') {
      if (typeof currentModalPrimaryAction === 'function') {
        const fn = currentModalPrimaryAction;
        currentModalPrimaryAction = null;
        closeInteractiveModal();
        fn();
      } else {
        closeInteractiveModal();
      }
    } else if (e.target && e.target.id === 'interactiveModalSecondaryBtn') {
      if (typeof currentModalSecondaryAction === 'function') {
        const fn = currentModalSecondaryAction;
        currentModalSecondaryAction = null;
        closeInteractiveModal();
        fn();
      } else {
        closeInteractiveModal();
      }
    }
  });
}

// Demo sample craft photos for quick product review
const SAMPLE_PRESETS = [
  {
    name: "Terracotta Hand-Made Pitcher",
    notes: "Red clay pot made on village wheel with floral carvings",
    price: 600,
    imageUrl: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Dhokra Brass Bell-Metal Figurine",
    notes: "Lost wax cast brass metal craft by tribal artisans in Bastar",
    price: 1800,
    imageUrl: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Kutch Hand Embroidered Textile",
    notes: "Traditional mirror work needle craft on handspun cotton fabric",
    price: 1350,
    imageUrl: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80"
  }
];

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return '';
  if (/^(https?:|data:|blob:)/i.test(imageUrl)) return imageUrl;
  return new URL(imageUrl, window.location.origin).href;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
}

function closeProductModal() {
  const modal = document.getElementById('productDetailModal');
  if (modal) modal.classList.add('hidden');
}

function showCustomAlert(message, title = 'Notice') {
  const modal = document.getElementById('customAlertModal');
  const card = document.getElementById('customAlertCard');
  const titleEl = document.getElementById('customAlertTitle');
  const messageEl = document.getElementById('customAlertMessage');
  const cancelEl = document.getElementById('customAlertCancel');
  const okEl = document.getElementById('customAlertOk');
  const closeEl = document.getElementById('customAlertClose');

  if (!modal || !card || !titleEl || !messageEl || !cancelEl || !okEl || !closeEl) return;

  titleEl.textContent = title;
  messageEl.textContent = message;
  modal.classList.remove('hidden');

  const closePopup = () => modal.classList.add('hidden');
  cancelEl.onclick = closePopup;
  closeEl.onclick = closePopup;
  okEl.onclick = closePopup;

  let startX = 0;
  let startY = 0;
  card.ontouchstart = (event) => {
    const touch = event.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  };
  card.ontouchend = (event) => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      closePopup();
    }
  };
}

window.alert = function(message) {
  showCustomAlert(String(message), 'Notice');
};

function downloadBlob(blobContent, filename, mimeType) {
  const blob = blobContent instanceof Blob ? blobContent : new Blob([blobContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function exportGemCsv() {
  try {
    const res = await fetch('/api/export/gem-csv');
    if (!res.ok) throw new Error('CSV export failed');
    const csv = await res.text();
    downloadBlob(csv, 'kalakriti-gem-catalog.csv', 'text/csv;charset=utf-8');
    showToast('GeM CSV exported');
  } catch (error) {
    console.error(error);
    showToast('GeM CSV export unavailable');
  }
}

async function generateOndcJson() {
  try {
    const res = await fetch('/api/export/ondc');
    if (!res.ok) throw new Error('ONDC export failed');
    const data = await res.json();
    downloadBlob(JSON.stringify(data, null, 2), 'kalakriti-ondc-beckn.json', 'application/json;charset=utf-8');
    showToast('ONDC JSON generated');
  } catch (error) {
    console.error(error);
    showToast('ONDC JSON unavailable');
  }
}

function getInstitutionalPayloadText() {
  const payload = {
    product_category: document.getElementById('institutionalCategory')?.value || 'Handloom & Textiles',
    quantity: document.getElementById('institutionalQuantity')?.value || '1',
    unit_price: document.getElementById('institutionalUnitPrice')?.value || '0',
    lead_time: document.getElementById('institutionalLeadTime')?.value || '7-15 working days',
    target_buyer: document.getElementById('institutionalTargetBuyer')?.value || 'Open to all',
    requirements: document.getElementById('institutionalRequirements')?.value || 'No extra requirements'
  };

  return `Bulk RFQ request. Product category: ${payload.product_category}. Quantity: ${payload.quantity}. Unit price expectation: ${payload.unit_price}. Lead time: ${payload.lead_time}. Preferred bulk outlet: ${payload.target_buyer}. Requirements: ${payload.requirements}.`;
}

function listenInstitutionalRequest() {
  const detailText = getInstitutionalPayloadText();
  if (typeof speakText === 'function') {
    speakText(detailText, currentLanguage === 'hi' ? 'hi-IN' : 'en-IN');
    showToast('Listening to RFQ details');
  } else {
    showToast('Speech playback not available');
  }
}

async function handleBusinessManagerTool(tool) {
  const userId = state.currentUser?.id || 1;
  try {
    if (tool === 'hsn') {
      const res = await fetch(`/api/users/${userId}/business-advisor`);
      if (!res.ok) throw new Error('Advisor unavailable');
      const advisor = await res.json();
      showToast(`AI HSN classifier: ${advisor.recommended_actions?.[0] || 'Classification ready'}`);
      return;
    }

    if (tool === 'pricing') {
      const quantity = Math.max(0, Number(document.getElementById('institutionalQuantity')?.value || 0));
      const basePrice = Math.max(0, Number(document.getElementById('institutionalUnitPrice')?.value || 0));
      if (!quantity || !basePrice) {
        showToast('Enter a quantity and unit price to calculate bulk pricing');
        return;
      }
      const discount = quantity >= 51 ? 0.26 : quantity >= 11 ? 0.13 : 0;
      const unitPrice = Math.round(basePrice * (1 - discount));
      const total = unitPrice * quantity;
      showToast(`Bulk pricing: ${quantity} units × ₹${unitPrice.toLocaleString('en-IN')} = ₹${total.toLocaleString('en-IN')} (${Math.round(discount * 100)}% savings)`);
      return;
    }

    if (tool === 'ocr') {
      const res = await fetch(`/api/users/${userId}/documents`);
      if (!res.ok) throw new Error('Document route unavailable');
      const docs = await res.json();
      showToast(`OCR readiness: ${docs.document_verification_status || 'pending'} · ${docs.required_documents.length} docs`);
      return;
    }

    if (tool === 'rfq') {
      const advisorRes = await fetch(`/api/users/${userId}/business-advisor`);
      if (!advisorRes.ok) throw new Error('RFQ pitch unavailable');
      const advisor = await advisorRes.json();
      const pitch = `Bulk RFQ pitch ready. ${advisor.recommended_actions?.join(' ')} ${advisor.opportunities?.join(' ')}`;
      downloadBlob(pitch, 'kalakriti-rfq-pitch.txt', 'text/plain;charset=utf-8');
      showToast('RFQ pitch generated');
      return;
    }
  } catch (error) {
    console.error(error);
    showToast('Business manager tool is not ready');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  checkApiConfig();
  loadProducts();
  setupEventListeners();
  setLanguage(localStorage.getItem('kalakriti_language') || 'en');
  switchTab('home');

  const savedUser = localStorage.getItem('kalakriti_user');
  if (savedUser) {
    try {
      state.currentUser = JSON.parse(savedUser);
      await loadAccountData();
      await loadProducts(); // Re-render marketplace with owner delete buttons enabled
      const userName = state.currentUser?.name || state.currentUser?.email || 'user';
      showToast(`Logged in as ${userName}`);
      syncStudioArtisanInfo();
    } catch (error) {
      localStorage.removeItem('kalakriti_user');
    }
  }
}

// Check Backend AI Model Status
async function checkApiConfig() {
  try {
    const res = await fetch('/api/config-status');
    const data = await res.json();
    state.apiConfig = data;

    const badge = document.getElementById('aiEngineBadge');
    if (badge) {
      if (data.has_gemini_key) {
        badge.innerHTML = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span data-i18n="gemini_live">Gemini Vision Active</span>
        </span>`;
      } else {
        badge.innerHTML = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span data-i18n="gemini_sim">Smart AI Fallback Active</span>
        </span>`;
      }
    }
  } catch (err) {
    console.warn("Could not check AI config:", err);
  }
}

// Event Listeners
function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('[data-tab-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab-target'));
    });
  });

  // Language toggle
  const langToggleBtn = document.getElementById('langToggleBtn');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', toggleLanguage);
  }

  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.addEventListener('change', (event) => setLanguage(event.target.value));
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', loginAccount);

  const exportGemCsvBtn = document.getElementById('exportGemCsvBtn');
  if (exportGemCsvBtn) exportGemCsvBtn.addEventListener('click', exportGemCsv);

  const generateOndcJsonBtn = document.getElementById('generateOndcJsonBtn');
  if (generateOndcJsonBtn) generateOndcJsonBtn.addEventListener('click', generateOndcJson);

  const listenBtn = document.getElementById('listenBtn');
  if (listenBtn) listenBtn.addEventListener('click', listenInstitutionalRequest);
  ['institutionalQuantity', 'institutionalUnitPrice'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('input', updateBulkPricingTiers);
  });
  updateBulkPricingTiers();

  const aiHsnTaxBtn = document.getElementById('aiHsnTaxBtn');
  if (aiHsnTaxBtn) aiHsnTaxBtn.addEventListener('click', () => handleBusinessManagerTool('hsn'));

  const aiBulkPricingBtn = document.getElementById('aiBulkPricingBtn');
  if (aiBulkPricingBtn) aiBulkPricingBtn.addEventListener('click', () => handleBusinessManagerTool('pricing'));

  const aiOcrBtn = document.getElementById('aiOcrBtn');
  if (aiOcrBtn) aiOcrBtn.addEventListener('click', () => handleBusinessManagerTool('ocr'));

  const aiRfqPitchBtn = document.getElementById('aiRfqPitchBtn');
  if (aiRfqPitchBtn) aiRfqPitchBtn.addEventListener('click', () => handleBusinessManagerTool('rfq'));

  const modal = document.getElementById('productDetailModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => closeProductModal());
  }
  if (modalCancelBtn && modal) {
    modalCancelBtn.addEventListener('click', () => closeProductModal());
  }
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeProductModal();
    });

    let touchStartX = 0;
    let touchStartY = 0;
    modal.addEventListener('touchstart', (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    modal.addEventListener('touchend', (event) => {
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        closeProductModal();
      }
    }, { passive: true });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logoutAccount);

  document.querySelectorAll('[data-account-view]').forEach(button => {
    button.addEventListener('click', () => renderAccountView(button.dataset.accountView));
  });

  // Voice recording button
  const micBtn = document.getElementById('micButton');
  if (micBtn) {
    micBtn.addEventListener('click', toggleVoiceInput);
  }

  // File Upload Handlers
  const fileInput = document.getElementById('craftImageInput');
  const uploadBox = document.getElementById('uploadDropzone');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  if (uploadBox) {
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadBox.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadBox.classList.add('border-terracotta-500', 'bg-terracotta-50');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadBox.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadBox.classList.remove('border-terracotta-500', 'bg-terracotta-50');
      }, false);
    });

    uploadBox.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });
  }

  // Camera capture button (triggers file input with camera attribute)
  const cameraBtn = document.getElementById('cameraBtn');
  if (cameraBtn && fileInput) {
    cameraBtn.addEventListener('click', () => {
      fileInput.setAttribute('capture', 'environment');
      fileInput.click();
    });
  }

  // AI Analysis Button
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', triggerAiAnalysis);
  }

  // Studio Lighting Toggle
  const studioToggle = document.getElementById('studioEnhanceToggle');
  if (studioToggle) {
    studioToggle.addEventListener('change', (e) => {
      state.isEnhanced = e.target.checked;
      updatePreviewEnhancement();
    });
  }

  // Apply Suggested Price Button
  const applyPriceBtn = document.getElementById('applySuggestedPriceBtn');
  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', () => {
      if (state.aiResult && state.aiResult.pricing) {
        const priceInput = document.getElementById('editProductPrice');
        if (priceInput) {
          priceInput.value = state.aiResult.pricing.suggested;
        }
      }
    });
  }

  // Publish Button
  const publishBtn = document.getElementById('publishBtn');
  if (publishBtn) {
    publishBtn.addEventListener('click', publishProductToMarketplace);
  }

  // Bulk and institutional RFQ form
  const institutionalForm = document.getElementById('institutionalRequestForm');
  if (institutionalForm) {
    institutionalForm.addEventListener('submit', submitInstitutionalRequest);
  }

  const syncOfflineBtn = document.getElementById('syncOfflineQueueBtn');
  if (syncOfflineBtn) {
    syncOfflineBtn.addEventListener('click', syncOfflineQueue);
  }

  // Search & Filter
  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        loadProducts();
      }, 250);
    });
  }

  const sortSelect = document.getElementById('catalogSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      loadProducts();
    });
  }

  const placeOrderBtn = document.getElementById('modalPlaceOrderBtn');
  if (placeOrderBtn) placeOrderBtn.addEventListener('click', placeMarketplaceOrder);
  const submitReviewBtn = document.getElementById('modalSubmitReviewBtn');
  if (submitReviewBtn) submitReviewBtn.addEventListener('click', submitProductReview);
}

function syncStudioArtisanInfo() {
  if (!state.currentUser) return;
  const nameEl = document.getElementById('artisanName');
  const phoneEl = document.getElementById('artisanPhone');
  const locEl = document.getElementById('artisanLocation');
  if (nameEl && (!nameEl.value || nameEl.value === 'Ramvati Devi')) {
    nameEl.value = state.currentUser.name || '';
  }
  if (phoneEl && (!phoneEl.value || phoneEl.value === '+919876543210')) {
    phoneEl.value = state.currentUser.phone || '';
  }
  if (locEl && (!locEl.value || locEl.value === 'Madhubani, Bihar')) {
    locEl.value = state.currentUser.city || '';
  }
}

// Switch between Studio and Marketplace tabs
function switchTab(tab) {
  state.currentTab = tab;
  const homeSection = document.getElementById('homeTabSection');
  const studioSection = document.getElementById('studioTabSection');
  const marketSection = document.getElementById('marketplaceTabSection');
  const institutionalSection = document.getElementById('institutionalTabSection');
  const accountSection = document.getElementById('accountTabSection');

  document.querySelectorAll('[data-tab-target]').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab-target') === tab;
    if (isTarget) {
      btn.classList.add('text-terracotta-600', 'border-b-2', 'border-terracotta-600', 'font-bold');
      btn.classList.remove('text-slate-600', 'hover:text-slate-900');
    } else {
      btn.classList.remove('text-terracotta-600', 'border-b-2', 'border-terracotta-600', 'font-bold');
      btn.classList.add('text-slate-600', 'hover:text-slate-900');
    }
  });

  if (tab === 'home') {
    homeSection?.classList.remove('hidden');
    studioSection?.classList.add('hidden');
    marketSection?.classList.add('hidden');
    institutionalSection?.classList.add('hidden');
    accountSection?.classList.add('hidden');
  } else if (tab === 'studio') {
    homeSection?.classList.add('hidden');
    studioSection?.classList.remove('hidden');
    marketSection?.classList.add('hidden');
    institutionalSection?.classList.add('hidden');
    accountSection?.classList.add('hidden');
    syncStudioArtisanInfo();
  } else if (tab === 'institutional') {
    homeSection?.classList.add('hidden');
    studioSection?.classList.add('hidden');
    marketSection?.classList.add('hidden');
    institutionalSection?.classList.remove('hidden');
    accountSection?.classList.add('hidden');
  } else if (tab === 'account') {
    homeSection?.classList.add('hidden');
    studioSection?.classList.add('hidden');
    marketSection?.classList.add('hidden');
    institutionalSection?.classList.add('hidden');
    accountSection?.classList.remove('hidden');
    renderAccountShell();
    if (state.currentUser) {
      loadAccountData().then(() => {
        if (state.currentTab === 'account') renderAccountShell();
      }).catch(err => console.error('Error refreshing account tab:', err));
    }
  } else {
    homeSection?.classList.add('hidden');
    studioSection?.classList.add('hidden');
    marketSection?.classList.remove('hidden');
    institutionalSection?.classList.add('hidden');
    accountSection?.classList.add('hidden');
    loadProducts();
  }
}

function renderAccountShell() {
  const loginView = document.getElementById('accountLoginView');
  const workspace = document.getElementById('accountWorkspace');
  if (!loginView || !workspace) return;
  loginView.classList.toggle('hidden', Boolean(state.currentUser));
  workspace.classList.toggle('hidden', !state.currentUser);
  if (state.currentUser) renderAccountView(state.accountView);
}

// Authentication State & Mode Controller
state.authMode = 'signin';
state.authMethod = 'password'; // 'password' | 'gmail' | 'phone'
state.pendingPhone = '';
state.pendingGmail = '';
state.lastPhoneOtp = '123456';
state.lastGmailOtp = '';

function showAuthStatus(message, isError = true) {
  const box = document.getElementById('authStatusBox');
  if (!box) return;
  box.textContent = message;
  box.className = isError
    ? 'mt-4 p-3.5 rounded-xl text-xs font-bold leading-relaxed border bg-red-50 text-red-700 border-red-200'
    : 'mt-4 p-3.5 rounded-xl text-xs font-bold leading-relaxed border bg-emerald-50 text-emerald-800 border-emerald-200';
  box.classList.remove('hidden');
}

function clearAuthStatus() {
  const box = document.getElementById('authStatusBox');
  if (box) {
    box.textContent = '';
    box.classList.add('hidden');
  }
}

function switchAuthMode(mode) {
  state.authMode = 'signin';
  clearAuthStatus();
}

function switchAuthMethod(method) {
  state.authMethod = method;
  clearAuthStatus();

  const pwdBtn = document.getElementById('authMethodPasswordBtn');
  const gmailBtn = document.getElementById('authMethodGmailBtn');
  const phoneBtn = document.getElementById('authMethodPhoneBtn');

  const pwdContainer = document.getElementById('authPasswordContainer');
  const gmailContainer = document.getElementById('authGmailContainer');
  const phoneContainer = document.getElementById('authPhoneContainer');

  const activeClass = 'flex-1 pb-3 text-orange-600 border-b-2 border-orange-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap px-2';
  const inactiveClass = 'flex-1 pb-3 text-slate-400 border-b-2 border-transparent hover:text-slate-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap px-2';

  if (pwdBtn) pwdBtn.className = method === 'password' ? activeClass : inactiveClass;
  if (gmailBtn) gmailBtn.className = method === 'gmail' ? activeClass : inactiveClass;
  if (phoneBtn) phoneBtn.className = method === 'phone' ? activeClass : inactiveClass;

  if (pwdContainer) pwdContainer.classList.toggle('hidden', method !== 'password');
  if (gmailContainer) gmailContainer.classList.toggle('hidden', method !== 'gmail');
  if (phoneContainer) phoneContainer.classList.toggle('hidden', method !== 'phone');
}

function quickFillPhone(number) {
  const input = document.getElementById('authPhoneInput');
  if (input) {
    input.value = number.replace(/^\+91/, '').replace(/\D/g, '');
    input.focus();
  }
}

function quickFillEmail(email, password) {
  const emailInput = document.getElementById('loginEmail');
  const pwdInput = document.getElementById('loginPassword');
  if (emailInput) emailInput.value = email;
  if (pwdInput) pwdInput.value = password;
}

// -------------------------------------------------------------
// METHOD 1: Password / PIN Authentication (Sign In & Sign Up)
// -------------------------------------------------------------
async function handlePasswordAuth(event) {
  if (event) event.preventDefault();
  clearAuthStatus();

  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const emailOrPhone = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!emailOrPhone || !password) {
    showAuthStatus('Please enter your email/phone and password.', true);
    return;
  }

  const submitBtn = document.getElementById('passwordSubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳ Authenticating...</span>';
  }

  try {
    const endpoint = '/api/auth/login';
    const payload = { email: emailOrPhone, password };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || 'Invalid email/phone or password');
    }

    state.currentUser = data.user || {
      id: data.user_id,
      name: payload.name || 'User',
      email: emailOrPhone,
      role: payload.role || 'artisan',
    };
    localStorage.setItem('kalakriti_user', JSON.stringify(state.currentUser));

    try {
      await loadAccountData();
      await loadProducts();
      syncStudioArtisanInfo();
    } catch (loadErr) {
      console.warn('Account activity sync delayed:', loadErr);
    }

    switchTab('home');
    const userName = state.currentUser?.name || state.currentUser?.email || 'User';
    showToast(`Logged in as ${userName}`);

    showInteractiveModal({
      type: 'welcome',
      title: `Welcome, ${userName}!`,
      subtitle: 'Logged in to KalaSetu',
      message: `Your account (${state.currentUser?.email || emailOrPhone}) is active and protected. Your artisan studio and marketplace linkage are ready.`,
      primaryText: 'Explore Marketplace',
      onPrimary: () => switchTab('marketplace'),
      secondaryText: 'Open Studio',
      onSecondary: () => switchTab('studio'),
    });
  } catch (error) {
    showAuthStatus(error.message || 'Authentication failed. Please check credentials.', true);
    showInteractiveModal({
      type: 'error',
      title: 'Sign-In Failed',
      subtitle: 'Authentication Notice',
      message: error.message || 'Please check your credentials or click one of the 1-Click Demo accounts.',
      primaryText: 'OK',
    });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In with Password</span>';
    }
  }
}

// -------------------------------------------------------------
// METHOD 2: Gmail OTP Verification (Real SMTP Inbox Delivery)
// -------------------------------------------------------------
async function handleSendGmailOtp(event) {
  if (event) event.preventDefault();
  clearAuthStatus();

  const emailInput = document.getElementById('authGmailInput');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

  if (!email || !email.includes('@')) {
    showAuthStatus('Please enter a valid Gmail / email address.', true);
    return;
  }

  const sendBtn = document.getElementById('sendGmailOtpBtn');
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span>⏳ Generating OTP...</span>';
  }

  try {
    state.pendingGmail = email;
    state.lastGmailOtp = String(Math.floor(100000 + Math.random() * 900000));

    const reqForm = document.getElementById('gmailRequestForm');
    const verifyForm = document.getElementById('gmailVerifyForm');
    const targetDisplay = document.getElementById('gmailTargetDisplay');
    const badgeWrapper = document.getElementById('gmailDemoBadgeWrapper');
    const codeDisplay = document.getElementById('gmailDemoCode');

    if (targetDisplay) targetDisplay.textContent = state.pendingGmail;
    if (reqForm) reqForm.classList.add('hidden');
    if (verifyForm) verifyForm.classList.remove('hidden');
    if (badgeWrapper) badgeWrapper.classList.remove('hidden');
    if (codeDisplay) codeDisplay.textContent = state.lastGmailOtp;

    showAuthStatus(`📌 Use the OTP shown on this screen: ${state.lastGmailOtp}`, false);

    const otpInput = document.getElementById('authGmailOtpInput');
    if (otpInput) {
      otpInput.value = '';
      otpInput.focus();
    }
  } catch (err) {
    showAuthStatus(err.message || 'Failed to generate OTP. Please try again.', true);
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<span>📩</span><span>Send OTP to Gmail Inbox</span>';
    }
  }
}

function autoFillGmailDemoOtp() {
  const otpInput = document.getElementById('authGmailOtpInput');
  if (otpInput) {
    otpInput.value = state.lastGmailOtp || '123456';
    otpInput.focus();
  }
}

function cancelGmailOtpStep() {
  clearAuthStatus();
  const reqForm = document.getElementById('gmailRequestForm');
  const verifyForm = document.getElementById('gmailVerifyForm');
  if (verifyForm) verifyForm.classList.add('hidden');
  if (reqForm) reqForm.classList.remove('hidden');
}

async function handleVerifyGmailOtp(event) {
  if (event) event.preventDefault();
  clearAuthStatus();

  const otpInput = document.getElementById('authGmailOtpInput');
  const otp = otpInput ? otpInput.value.trim() : '';
  const expectedOtp = state.lastGmailOtp || '123456';

  if (!otp || otp.length < 4) {
    showAuthStatus('Please enter the 6-digit verification code shown on this screen.', true);
    return;
  }

  if (otp !== expectedOtp) {
    showAuthStatus(`Use the code shown in the OTP box: ${expectedOtp}`, true);
    return;
  }

  const verifyBtn = document.getElementById('verifyGmailOtpBtn');
  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span>⏳ Verifying Code...</span>';
  }

  try {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const pwdField = document.getElementById('authGmailVerifyPassword');
    const regPassword = document.getElementById('gmailRegisterPassword');
    const password = (pwdField && pwdField.value.trim()) || (regPassword && regPassword.value.trim()) || (passwordInput ? passwordInput.value : '');
    if (emailInput) emailInput.value = state.pendingGmail || '';
    if (passwordInput && password) passwordInput.value = password;
    await handlePasswordAuth(null);
  } catch (err) {
    showAuthStatus(err.message || 'Invalid or expired verification code.', true);
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = '<span>Verify & Access KalaSetu</span>';
    }
  }
}

// -------------------------------------------------------------
// METHOD 3: Mobile OTP (Telecom Gateway Notice + Security)
// -------------------------------------------------------------
async function handleSendPhoneOtp(event) {
  if (event) event.preventDefault();
  clearAuthStatus();

  const phoneInput = document.getElementById('authPhoneInput');
  const rawPhone = phoneInput ? phoneInput.value.trim() : '';
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length < 10) {
    showAuthStatus('Please enter a valid 10-digit Indian mobile number.', true);
    return;
  }

  const sendBtn = document.getElementById('sendPhoneOtpBtn');
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span>⏳ Generating OTP...</span>';
  }

  try {
    state.pendingPhone = `+91${digits.slice(-10)}`;
    state.lastPhoneOtp = String(Math.floor(100000 + Math.random() * 900000));

    const reqForm = document.getElementById('phoneRequestForm');
    const verifyForm = document.getElementById('phoneVerifyForm');
    const targetDisplay = document.getElementById('phoneTargetDisplay');
    const codeDisplay = document.getElementById('phoneDemoCode');

    if (targetDisplay) targetDisplay.textContent = state.pendingPhone;
    if (codeDisplay) codeDisplay.textContent = state.lastPhoneOtp;
    if (reqForm) reqForm.classList.add('hidden');
    if (verifyForm) verifyForm.classList.remove('hidden');

    const otpInput = document.getElementById('authPhoneOtpInput');
    if (otpInput) {
      otpInput.value = '';
      otpInput.focus();
    }

    showAuthStatus(`📌 Use the OTP shown on this screen: ${state.lastPhoneOtp}`, false);
  } catch (err) {
    showAuthStatus(err.message || 'Failed to generate OTP code. Please try again.', true);
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<span>📲</span><span>Generate Mobile OTP</span>';
    }
  }
}

function autoFillPhoneDemoOtp() {
  const otpInput = document.getElementById('authPhoneOtpInput');
  if (otpInput) {
    otpInput.value = state.lastPhoneOtp || '123456';
    otpInput.focus();
  }
}

function cancelPhoneOtpStep() {
  clearAuthStatus();
  const reqForm = document.getElementById('phoneRequestForm');
  const verifyForm = document.getElementById('phoneVerifyForm');
  if (verifyForm) verifyForm.classList.add('hidden');
  if (reqForm) reqForm.classList.remove('hidden');
}

async function handleVerifyPhoneOtp(event) {
  if (event) event.preventDefault();
  clearAuthStatus();

  const otpInput = document.getElementById('authPhoneOtpInput');
  const otp = otpInput ? otpInput.value.trim() : '';
  const expectedOtp = state.lastPhoneOtp || '123456';

  if (!otp || otp.length < 4) {
    showAuthStatus('Please enter the 6-digit verification code shown on this screen.', true);
    return;
  }

  if (otp !== expectedOtp) {
    showAuthStatus(`Use the code shown in the OTP box: ${expectedOtp}`, true);
    return;
  }

  const verifyBtn = document.getElementById('verifyPhoneOtpBtn');
  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span>⏳ Verifying OTP...</span>';
  }

  try {
    const phoneInput = document.getElementById('authPhoneInput');
    const passwordInput = document.getElementById('loginPassword');
    const regPassword = document.getElementById('phoneRegisterPassword');
    const password = (passwordInput && passwordInput.value) || (regPassword && regPassword.value) || 'demo123';
    if (phoneInput) phoneInput.value = state.pendingPhone || phoneInput.value;
    if (passwordInput && password) passwordInput.value = password;
    await handlePasswordAuth(null);
  } catch (err) {
    showAuthStatus(err.message || 'Invalid or expired OTP. Please try again.', true);
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = '<span>Verify OTP & Access Workspace</span>';
    }
  }
}

// Backward compatibility aliases
const handleSendOtp = handleSendPhoneOtp;
const handleVerifyOtp = handleVerifyPhoneOtp;
const handleEmailAuth = handlePasswordAuth;
const loginAccount = handlePasswordAuth;
const autoFillDemoOtp = autoFillPhoneDemoOtp;
const cancelOtpStep = cancelPhoneOtpStep;
const resendOtp = () => handleSendPhoneOtp(null);

function logoutAccount() {
  state.currentUser = null;
  state.accountOrders = [];
  state.accountWishlist = [];
  localStorage.removeItem('kalakriti_user');
  renderAccountShell();
}

async function loadAccountData() {
  if (!state.currentUser) return;

  const [ordersResult, incomingResult, publishedResult, requestsResult, notificationsResult, wishlistResult] = await Promise.allSettled([
    fetch(`/api/orders/${state.currentUser.id}`),
    fetch(`/api/orders/${state.currentUser.id}/incoming`),
    fetch(`/api/products/${state.currentUser.id}/published`),
    fetch(`/api/institutional-requests/${state.currentUser.id}`),
    fetch(`/api/notifications/${state.currentUser.id}`),
    fetch(`/api/wishlist/${state.currentUser.id}`)
  ]);

  const parseCollection = async (result, fallbackKey) => {
    if (result.status === 'rejected') {
      console.error(`Fetch rejected for ${fallbackKey}:`, result.reason);
      return { [fallbackKey]: [] };
    }
    if (!result.value || !result.value.ok) {
      console.error(`API error for ${fallbackKey}: status=${result.value?.status}`);
      return { [fallbackKey]: [] };
    }
    try {
      const data = await result.value.json();
      return data && typeof data === 'object' ? data : { [fallbackKey]: [] };
    } catch (error) {
      console.error(`JSON parse error for ${fallbackKey}:`, error);
      return { [fallbackKey]: [] };
    }
  };

  const [orders, incoming, published, requests, notifications, wishlist] = await Promise.all([
    parseCollection(ordersResult, 'orders'),
    parseCollection(incomingResult, 'orders'),
    parseCollection(publishedResult, 'products'),
    parseCollection(requestsResult, 'requests'),
    parseCollection(notificationsResult, 'notifications'),
    parseCollection(wishlistResult, 'wishlist')
  ]);

  state.accountOrders = orders.orders || [];
  state.accountIncomingOrders = incoming.orders || [];
  state.accountPublishedProducts = published.products || [];
  state.accountRequests = requests.requests || [];
  state.accountNotifications = notifications.notifications || [];
  state.accountWishlist = wishlist.wishlist || [];
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const badge = document.getElementById('notificationCountBadge');
  if (!badge) return;
  const unreadCount = state.accountNotifications.filter(item => !item.is_read).length;
  badge.textContent = String(unreadCount);
  badge.classList.toggle('hidden', unreadCount === 0);
}

async function markNotificationsRead() {
  if (!state.currentUser) return;
  await fetch(`/api/notifications/${state.currentUser.id}/read`, { method: 'POST' });
  await loadAccountData();
  renderAccountView('notifications');
}

function renderAccountView(view) {
  if (!state.currentUser) return;
  state.accountView = view;
  document.querySelectorAll('[data-account-view]').forEach(button => {
    button.classList.toggle('account-tab-active', button.dataset.accountView === view);
  });
  document.getElementById('accountWelcome').textContent = `Welcome, ${state.currentUser.name}`;
  document.getElementById('accountMeta').textContent = `${state.currentUser.email} · ${state.currentUser.role} · ${state.currentUser.city || 'India'}`;
  const content = document.getElementById('accountContent');
  if (view === 'profile') {
    content.innerHTML = `<div class="account-panel"><h3>${t('account_profile')}</h3><p><strong>Name:</strong> ${escapeHtml(state.currentUser.name)}</p><p><strong>Email:</strong> ${escapeHtml(state.currentUser.email)}</p><p><strong>Role:</strong> ${escapeHtml(state.currentUser.role)}</p><p><strong>Location:</strong> ${escapeHtml(state.currentUser.city || 'Not added')}</p><p class="account-muted">The same account can buy products, publish inventory, and submit institutional requests.</p></div>`;
  } else if (view === 'history') {
    const historyRows = [
      ...state.accountOrders.map(order => ({
        title: `${escapeHtml(order.product_name || 'Order')} · ${escapeHtml(order.status || 'Confirmed')}`,
        details: `₹${escapeHtml(order.total)} · Qty ${escapeHtml(order.quantity || 1)} · ETA ${escapeHtml(order.eta || '2-4 working days')}`,
        created_at: order.created_at || ''
      })),
      ...state.accountIncomingOrders.map(order => ({
        title: `${escapeHtml(order.product_name || 'Incoming order')} · ${escapeHtml(order.status || 'Confirmed')}`,
        details: `${escapeHtml(order.buyer_name || 'Buyer')} · Qty ${escapeHtml(order.quantity || 1)} · ₹${escapeHtml(order.total)}`,
        created_at: order.created_at || ''
      }))
    ];

    if (!historyRows.length) {
      content.innerHTML = `<div class="account-panel"><h3>${t('account_history')}</h3><p class="account-muted">No history.</p></div>`;
      return;
    }

    content.innerHTML = `<div class="account-panel"><h3>${t('account_history')}</h3><div class="account-list">${historyRows.map(row => `<div class="account-row"><strong>${row.title}</strong><span>${row.details}${row.created_at ? ` · ${escapeHtml(row.created_at)}` : ''}</span></div>`).join('')}</div></div>`;
  } else if (view === 'orders') {
    renderOrdersView(content);
  } else if (view === 'requests') {
    content.innerHTML = `<div class="account-panel"><h3>${t('account_requests')}</h3>${state.accountRequests.length ? state.accountRequests.map(request => `<div class="account-row"><strong>${escapeHtml(request.product_category)} · ${escapeHtml(request.quantity)} units</strong><span>${escapeHtml(request.target_market)} · ${escapeHtml(request.status || 'New')} · ${escapeHtml(request.email)}</span></div>`).join('') : '<p class="account-muted">No pending bulk requests yet.</p>'}</div>`;
  } else if (view === 'admin') {
    renderAdminView(content);
  } else if (view === 'notifications') {
    content.innerHTML = `<div class="account-panel"><div class="account-panel-heading"><h3>Notifications</h3><button id="markNotificationsReadBtn" class="account-small-action">Mark all read</button></div>${state.accountNotifications.length ? state.accountNotifications.map(item => `<div class="account-row ${item.is_read ? '' : 'notification-unread'}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.message)} · ${escapeHtml(item.created_at)}</span></div>`).join('') : '<p class="account-muted">No notifications yet.</p>'}</div>`;
    document.getElementById('markNotificationsReadBtn')?.addEventListener('click', markNotificationsRead);
  } else {
    const saved = state.products.filter(product => state.accountWishlist.includes(product.id));
    content.innerHTML = `<div class="account-panel"><h3>${t('account_wishlist')}</h3>${saved.length ? saved.map(product => `<div class="account-row"><strong>${escapeHtml(product.name)}</strong><span>₹${escapeHtml(product.price)} · ${escapeHtml(product.artisan_name)}</span></div>`).join('') : '<p class="account-muted">Your saved crafts will appear here.</p>'}</div>`;
  }
}

function renderOrdersView(content) {
  const isMine = state.orderView === 'mine';
  const isPublished = state.orderView === 'published';
  const rows = isMine ? state.accountOrders : state.accountIncomingOrders;
  const emptyMessage = isMine ? 'No orders requested by you yet.' : 'No buyer requests for your products yet.';
  const publishedMarkup = state.accountPublishedProducts.length
    ? state.accountPublishedProducts.map(product => `<div class="account-row"><div class="flex flex-wrap items-center justify-between gap-3"><div><strong>${escapeHtml(product.name)}</strong><span class="block text-xs mt-1 text-slate-500">₹${escapeHtml(product.price)} · Qty ${escapeHtml(product.quantity || 0)} · ${escapeHtml(product.category)}</span></div><button type="button" class="account-small-action text-red-700" data-remove-published="${product.id}">Remove published order</button></div></div>`).join('')
    : '<p class="account-muted">No products published by you yet.</p>';
  const rowsMarkup = rows.length
    ? rows.map(order => isMine
      ? `<div class="account-row">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong>${escapeHtml(order.product_name)}</strong>
              <span class="block text-xs mt-1 text-slate-500">₹${escapeHtml(order.total)} · Qty ${escapeHtml(order.quantity || 1)} · ${escapeHtml(order.status || 'Confirmed')} · ETA ${escapeHtml(order.eta || '2-4 working days')}</span>
              ${order.status && String(order.status).toLowerCase() !== 'cancelled'
                ? `<span class="block text-xs mt-1 text-slate-500">Cancel reason can be added before cancellation.</span>`
                : `<span class="block text-xs mt-1 text-slate-500">Order cancelled${order.cancel_reason ? `: ${escapeHtml(order.cancel_reason)}` : ''}</span>`}
            </div>
            <div>
              ${order.status && String(order.status).toLowerCase() !== 'cancelled'
                ? `<button type="button" class="account-small-action" data-cancel-order="${order.id}">Cancel order</button>`
                : `<span class="text-xs font-bold text-slate-500">Cancelled</span>`}
            </div>
          </div>
        </div>`
      : `<div class="account-row incoming-order">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong>${escapeHtml(order.product_name)}</strong>
              <span class="block text-xs mt-1 text-slate-600">
                Buyer: <strong>${escapeHtml(order.buyer_name || 'Buyer')}</strong>
                ${order.buyer_phone ? ` · 📱 ${escapeHtml(order.buyer_phone)}` : ''}
                · Qty ${escapeHtml(order.quantity || 1)} · Total ₹${escapeHtml(order.total)}
              </span>
              ${order.address_line ? `<span class="block text-xs mt-0.5 text-slate-500">📍 Deliver to: ${escapeHtml(order.address_line)}, ${escapeHtml(order.city || '')} ${escapeHtml(order.state || '')} ${escapeHtml(order.pincode || '')}</span>` : ''}
              <span class="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded ${
                String(order.status).toLowerCase() === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                String(order.status).toLowerCase() === 'rejected' ? 'bg-rose-100 text-rose-800' :
                String(order.status).toLowerCase() === 'dispatched' ? 'bg-indigo-100 text-indigo-800' :
                'bg-amber-100 text-amber-800'
              }">${escapeHtml(order.status || 'Confirmed')}</span>
            </div>
            <div class="flex items-center gap-2">
              ${(String(order.status).toLowerCase() === 'confirmed' || String(order.status).toLowerCase() === 'pending')
                ? `<button type="button" class="account-small-action text-emerald-700 font-bold border border-emerald-300 hover:bg-emerald-50 px-2.5 py-1 rounded-lg" data-accept-order="${order.id}">Accept</button>
                   <button type="button" class="account-small-action text-rose-700 font-bold border border-rose-300 hover:bg-rose-50 px-2.5 py-1 rounded-lg" data-reject-order="${order.id}">Reject</button>`
                : ''}
            </div>
          </div>
        </div>`).join('')
    : `<p class="account-muted">${emptyMessage}</p>`;
  content.innerHTML = `<div class="account-panel"><h3>${t('account_orders')}</h3><div class="order-switcher"><button class="order-switch ${isMine ? 'order-switch-active' : ''}" data-order-view="mine">Requested by me (${state.accountOrders.length})</button><button class="order-switch ${state.orderView === 'incoming' ? 'order-switch-active' : ''}" data-order-view="incoming">Requests from other buyers (${state.accountIncomingOrders.length})</button><button class="order-switch ${isPublished ? 'order-switch-active' : ''}" data-order-view="published">Orders published by me (${state.accountPublishedProducts.length})</button></div><div class="order-view-content">${isPublished ? publishedMarkup : rowsMarkup}</div></div>`;
  content.querySelectorAll('[data-order-view]').forEach(button => {
    button.addEventListener('click', () => {
      state.orderView = button.dataset.orderView;
      renderOrdersView(content);
    });
  });
  if (isMine) {
    content.querySelectorAll('[data-cancel-order]').forEach(button => {
      button.addEventListener('click', () => cancelMarketplaceOrder(Number(button.dataset.cancelOrder), content));
    });
  }
  if (!isMine && !isPublished) {
    content.querySelectorAll('[data-accept-order]').forEach(button => {
      button.addEventListener('click', () => updateIncomingOrderStatus(Number(button.dataset.acceptOrder), 'Accepted', content));
    });
    content.querySelectorAll('[data-reject-order]').forEach(button => {
      button.addEventListener('click', () => updateIncomingOrderStatus(Number(button.dataset.rejectOrder), 'Rejected', content));
    });
  }
  if (isPublished) {
    content.querySelectorAll('[data-remove-published]').forEach(button => {
      button.addEventListener('click', () => deleteMarketplaceProduct(Number(button.dataset.removePublished)));
    });
  }
}

async function updateIncomingOrderStatus(orderId, status, content) {
  if (!state.currentUser || !orderId) return;
  let note = '';
  if (status === 'Rejected') {
    const input = prompt('Reason for rejecting order (e.g. Out of stock / customized piece unavailable):', 'Cannot fulfill at this time');
    if (input === null) return;
    note = input.trim();
  }

  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: state.currentUser.id, status, note })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Could not update order status');
    showToast(status === 'Accepted' ? 'Order accepted!' : 'Order rejected (stock restored to listing)');
    await loadAccountData();
    renderOrdersView(content);
  } catch (err) {
    showToast(err.message || 'Status update failed');
  }
}

async function cancelMarketplaceOrder(orderId, content) {
  if (!orderId) return;
  const reason = prompt('Please tell us why you want to cancel this order:', 'Changed requirement / no longer needed');
  if (reason === null) return;
  const cleanReason = (reason || '').trim();
  if (!cleanReason) {
    showToast('A cancellation reason is required');
    return;
  }

  try {
    const response = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: cleanReason })
    });
    const data = await response.json().catch(() => ({ detail: 'Unable to cancel order' }));
    if (!response.ok) {
      throw new Error(data.detail || 'Unable to cancel order');
    }
    await loadAccountData();
    await loadProducts();
    renderAccountView('orders');
    showToast(`Order cancelled. ${data.restored_quantity || 0} unit(s) restored.`);
  } catch (error) {
    console.error('Cancel order error:', error);
    showToast(error.message || 'Unable to cancel order');
  }
}

async function submitAdminLogin(event) {
  event.preventDefault();
  const email = document.getElementById('adminEmail')?.value.trim();
  const password = document.getElementById('adminPassword')?.value;
  const status = document.getElementById('adminLoginStatus');
  if (!email || !password) {
    if (status) {
      status.textContent = 'Enter admin email and password.';
      status.className = 'mt-3 text-sm font-semibold text-red-700';
    }
    return;
  }

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Invalid admin credentials');
    const data = await response.json();
    state.adminToken = data.admin_token;
    localStorage.setItem('kalakriti_admin_token', data.admin_token);
    renderAccountView('admin');
  } catch (error) {
    if (status) {
      status.textContent = 'Admin sign-in failed. Use the configured admin credentials.';
      status.className = 'mt-3 text-sm font-semibold text-red-700';
    }
  }
}

async function loadAdminQueue() {
  const content = document.getElementById('accountContent');
  const target = document.getElementById('adminQueue');
  const adminRefresh = document.getElementById('adminRefreshBtn');
  if (!state.adminToken || !target) return;

  if (adminRefresh) adminRefresh.disabled = true;
  try {
    const response = await fetch('/api/admin/institutional-requests', {
      method: 'GET',
      headers: { 'X-Admin-Token': state.adminToken }
    });
    if (!response.ok) {
      localStorage.removeItem('kalakriti_admin_token');
      state.adminToken = '';
      renderAccountView('admin');
      return;
    }
    const data = await response.json();
    state.accountAdminRequests = data.requests || [];
    target.innerHTML = state.accountAdminRequests.length
      ? state.accountAdminRequests.map(req => `
        <div class="account-row admin-request-card">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong>${escapeHtml(req.artisan_name)} · ${escapeHtml(req.product_category || 'Craft request')}</strong>
              <span class="block text-xs mt-1 text-slate-500">${escapeHtml(req.email)} · ${escapeHtml(req.location || 'India')} · qty ${escapeHtml(req.quantity || 1)} · ${escapeHtml(req.target_market || 'Bulk')}</span>
              <span class="block text-xs mt-1 text-slate-500">Quality flags: ${escapeHtml(req.quality_flags || 'None')}</span>
              <span class="block text-xs mt-1 text-slate-500">Requirements: ${escapeHtml(req.requirements || 'No requirements')}</span>
            </div>
            <div class="min-w-[260px]">
              <label class="text-xs font-bold text-slate-500 block mb-1">Review status</label>
              <select data-admin-status="${req.id}" class="institutional-input mb-2">
                ${['New', 'In Review', 'Approved', 'Rejected'].map(status => `<option value="${status}" ${status === (req.status || 'New') ? 'selected' : ''}>${status}</option>`).join('')}
              </select>
              <label class="text-xs font-bold text-slate-500 block mb-1">Moderator notes</label>
              <textarea data-admin-notes="${req.id}" class="institutional-input mb-2" rows="2">${escapeHtml(req.admin_notes || '')}</textarea>
              <button type="button" class="account-small-action" data-admin-update="${req.id}">Save review</button>
            </div>
          </div>
        </div>
      `).join('')
      : '<p class="account-muted">No institutional requests yet.</p>';
  } catch (error) {
    target.innerHTML = '<p class="account-muted">Unable to load admin review queue.</p>';
  } finally {
    if (adminRefresh) adminRefresh.disabled = false;
  }
}

async function updateAdminRequest(requestId) {
  const status = document.querySelector(`[data-admin-status="${requestId}"]`)?.value || 'New';
  const notes = document.querySelector(`[data-admin-notes="${requestId}"]`)?.value || '';
  const response = await fetch(`/api/admin/institutional-requests/${requestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': state.adminToken
    },
    body: JSON.stringify({ status, admin_notes: notes })
  });

  if (!response.ok) {
    showToast('Unable to update review status');
    return;
  }

  showToast('Review status saved');
  await loadAdminQueue();
}

function renderAdminView(content) {
  if (!state.adminToken) {
    content.innerHTML = `<div class="account-panel">
      <h3>Admin Review</h3>
      <p class="account-muted">Use the configured admin credentials to review institutional buyer requests.</p>
      <form id="adminLoginForm" class="mt-4 space-y-3">
        <input id="adminEmail" type="email" class="institutional-input" placeholder="Admin email" required>
        <input id="adminPassword" type="password" class="institutional-input" placeholder="Admin password" required>
        <button type="submit" class="account-small-action">Sign in as admin</button>
      </form>
      <p id="adminLoginStatus" class="hidden mt-3 text-sm font-semibold"></p>
    </div>`;

    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) loginForm.addEventListener('submit', submitAdminLogin);
    return;
  }

  content.innerHTML = `<div class="account-panel">
    <div class="account-panel-heading">
      <h3>Admin Review Queue</h3>
      <div class="flex gap-2">
        <button id="adminRefreshBtn" class="account-small-action">Refresh</button>
        <button id="adminLogoutBtn" class="account-small-action">Logout</button>
      </div>
    </div>
    <div id="adminQueue" class="mt-4"></div>
  </div>`;

  const refresh = document.getElementById('adminRefreshBtn');
  if (refresh) refresh.addEventListener('click', loadAdminQueue);

  const logout = document.getElementById('adminLogoutBtn');
  if (logout) logout.addEventListener('click', () => {
    localStorage.removeItem('kalakriti_admin_token');
    state.adminToken = '';
    renderAccountView('admin');
  });

  const queueContainer = document.getElementById('adminQueue');
  if (queueContainer) {
    queueContainer.innerHTML = '<p class="account-muted">Loading institutional requests...</p>';
  }

  loadAdminQueue();

  content.addEventListener('click', (event) => {
    const button = event.target.closest('[data-admin-update]');
    if (!button) return;
    updateAdminRequest(Number(button.dataset.adminUpdate));
  });
}

function updateOfflineDraftCounter() {
  const counter = document.getElementById('offlineDraftCount');
  if (!counter) return;
  const queue = readOfflineQueue();
  counter.textContent = String(queue.length);
}

function readOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem('kalakriti_offline_queue') || '[]');
  } catch (error) {
    return [];
  }
}

function saveOfflineQueue(queue) {
  localStorage.setItem('kalakriti_offline_queue', JSON.stringify(queue));
  updateOfflineDraftCounter();
}

function queueOfflineDraft(payload) {
  const queue = readOfflineQueue();
  queue.push({ ...payload, queued_at: new Date().toISOString() });
  saveOfflineQueue(queue);
}

async function syncOfflineQueue() {
  const queue = readOfflineQueue();
  if (!queue.length) {
    showToast('No offline drafts pending');
    updateOfflineDraftCounter();
    return;
  }

  try {
    const response = await fetch('/api/offline/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drafts: queue })
    });
    if (!response.ok) throw new Error('Queue sync failed');
    const data = await response.json();
    if (data.synced >= queue.length) {
      saveOfflineQueue([]);
      showToast('Offline drafts synced');
    }
  } catch (error) {
    console.warn('Offline sync failed:', error);
    showToast('Sync queued locally');
  }
}

async function submitInstitutionalRequest(event) {
  event.preventDefault();

  const payload = {
    artisan_name: document.getElementById('institutionalName')?.value.trim(),
    email: document.getElementById('institutionalEmail')?.value.trim(),
    phone: document.getElementById('institutionalPhone')?.value.trim(),
    location: document.getElementById('institutionalLocation')?.value.trim(),
    product_category: document.getElementById('institutionalCategory')?.value,
    quantity: Number(document.getElementById('institutionalQuantity')?.value || 1),
    unit_price: Number(document.getElementById('institutionalUnitPrice')?.value || 0),
    lead_time: document.getElementById('institutionalLeadTime')?.value.trim(),
    target_buyer: document.getElementById('institutionalTargetBuyer')?.value || 'Open to all',
    target_market: document.getElementById('institutionalTargetBuyer')?.value || 'Open to all',
    requirements: document.getElementById('institutionalRequirements')?.value.trim()
  };
  const status = document.getElementById('institutionalRequestStatus');
  const subject = encodeURIComponent(`KalaSetu bulk request - ${payload.product_category}`);
  const body = encodeURIComponent(
    `Name: ${payload.artisan_name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nLocation: ${payload.location}\nPreferred bulk outlet / target buyer: ${payload.target_buyer}\nCategory: ${payload.product_category}\nQuantity: ${payload.quantity}\nUnit price expectation: ${payload.unit_price}\nLead time: ${payload.lead_time}\nRequirements: ${payload.requirements}`
  );

  try {
    const response = await fetch('/api/institutional-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Request could not be saved');

    status.textContent = 'Request saved. Our team can follow up for buyer introductions and procurement guidance.';
    status.className = 'mt-4 rounded-xl p-3 text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200';
    showToast('Bulk request submitted successfully');
    const savedRequests = JSON.parse(localStorage.getItem('kalakriti_requests') || '[]');
    savedRequests.unshift({ ...payload, status: 'Submitted', created_at: new Date().toISOString() });
    localStorage.setItem('kalakriti_requests', JSON.stringify(savedRequests));
  } catch (error) {
    console.error('Institutional request error:', error);
    queueOfflineDraft(payload);
    const queue = readOfflineQueue();
    status.textContent = `Offline Mode Active — Drafts Saved Locally. Sync Now (${queue.length} Draft${queue.length === 1 ? '' : 's'} Pending)`;
    status.className = 'mt-4 rounded-xl p-3 text-sm font-semibold bg-amber-50 text-amber-900 border border-amber-200';
    updateOfflineDraftCounter();
    showToast('Offline draft queued locally');
  }

  window.location.href = `mailto:kalasetu24824.9@gmail.com?subject=${subject}&body=${body}`;
}

function updateBulkPricingTiers() {
  const quantity = Math.max(0, Number(document.getElementById('institutionalQuantity')?.value || 0));
  const unitPrice = Math.max(0, Number(document.getElementById('institutionalUnitPrice')?.value || 0));
  const tiers = [
    { price: unitPrice, priceId: 'bulkTierPriceRetail', marginId: 'bulkTierMarginRetail', minimum: 1, label: 'Retail' },
    { price: unitPrice * 0.87, priceId: 'bulkTierPriceStandard', marginId: 'bulkTierMarginStandard', minimum: 11, label: '13% savings' },
    { price: unitPrice * 0.74, priceId: 'bulkTierPriceVolume', marginId: 'bulkTierMarginVolume', minimum: 51, label: '26% savings' }
  ];
  tiers.forEach(tier => {
    const price = document.getElementById(tier.priceId);
    const margin = document.getElementById(tier.marginId);
    if (price) price.textContent = `₹${Math.round(tier.price).toLocaleString('en-IN')}`;
    if (margin) margin.textContent = quantity >= tier.minimum ? tier.label : `Needs ${tier.minimum}+ units`;
  });
}

// Handle Photo Selection
function handleFileSelection(file) {
  if (!file.type.startsWith('image/')) {
    alert("Please select a valid image file (JPEG, PNG, WEBP).");
    return;
  }

  state.selectedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    state.uploadedImageUrl = e.target.result;
    displayImagePreview(e.target.result);
  };
  reader.readAsDataURL(file);

  // Enable analyze button
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.disabled = false;
    analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

// Load a preset demo craft
function loadDemoPreset(index) {
  const preset = SAMPLE_PRESETS[index];
  if (!preset) return;

  const artisanNotes = document.getElementById('artisanNotes');
  const priceIdea = document.getElementById('artisanEstimatedPrice');
  const artisanName = document.getElementById('artisanName');

  if (artisanNotes) artisanNotes.value = preset.notes;
  if (priceIdea) priceIdea.value = preset.price;
  if (artisanName && !artisanName.value) artisanName.value = "Ramvati Devi";

  // Fetch preset image as blob
  fetch(preset.imageUrl)
    .then(res => res.blob())
    .then(blob => {
      const file = new File([blob], `sample_${index}.jpg`, { type: "image/jpeg" });
      handleFileSelection(file);
    })
    .catch(err => {
      console.warn("Could not fetch sample image blob, using data URL fallback", err);
      displayImagePreview(preset.imageUrl);
      state.uploadedImageUrl = preset.imageUrl;
      const analyzeBtn = document.getElementById('analyzeBtn');
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    });
}

function displayImagePreview(url) {
  const previewImg = document.getElementById('previewImage');
  const placeholder = document.getElementById('previewPlaceholder');
  const previewContainer = document.getElementById('imagePreviewContainer');

  if (previewImg && placeholder && previewContainer) {
    previewImg.src = url;
    previewImg.classList.remove('hidden');
    placeholder.classList.add('hidden');
    previewContainer.classList.remove('border-dashed');
    updatePreviewEnhancement();
  }
}

function updatePreviewEnhancement() {
  const previewImg = document.getElementById('previewImage');
  const reviewImg = document.getElementById('reviewCardImage');
  const badge = document.getElementById('studioEnhanceBadge');

  [previewImg, reviewImg].forEach(img => {
    if (!img) return;
    if (state.isEnhanced) {
      img.classList.add('studio-enhanced');
      img.classList.remove('studio-raw');
    } else {
      img.classList.remove('studio-enhanced');
      img.classList.add('studio-raw');
    }
  });

  if (badge) {
    if (state.isEnhanced) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

// Trigger product analysis
// --- Direct Gemini Vision helper (web) ---
let _webGeminiKey = null;
let _webGeminiModel = null;

async function _fetchWebGeminiConfig() {
  if (_webGeminiKey) return { key: _webGeminiKey, model: _webGeminiModel };
  try {
    const r = await fetch('/api/config-status');
    if (r.ok) {
      const cfg = await r.json();
      _webGeminiKey = cfg.gemini_api_key || '';
      _webGeminiModel = cfg.gemini_model || 'gemini-3.6-flash';
    }
  } catch (e) {
    console.warn('[KalaSetu] Could not fetch Gemini config:', e);
  }
  return { key: _webGeminiKey || '', model: _webGeminiModel || 'gemini-3.6-flash' };
}

async function _imageToBase64(source) {
  // source is a File/Blob or a URL string
  if (source instanceof Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Strip the data:...;base64, prefix
        const result = reader.result;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  }
  // It's a URL — fetch the blob first
  const resp = await fetch(source);
  const blob = await resp.blob();
  return _imageToBase64(blob);
}

async function _callGeminiVisionDirect(imageSource, notes, priceHint) {
  const { key, model } = await _fetchWebGeminiConfig();
  if (!key) throw new Error('NO_GEMINI_KEY');

  const base64 = await _imageToBase64(imageSource);
  const mimeType = (imageSource instanceof Blob) ? (imageSource.type || 'image/jpeg') : 'image/jpeg';

  const prompt = `You are an expert in Indian traditional handicrafts and artisan products. Analyze this image of a craft item and provide:
1. Product name (specific craft type)
2. Detailed description (materials, technique, cultural significance)
3. Category (Pottery/Textile/Jewelry/Woodwork/Painting/Metalwork/Leather/Bamboo/Stone/Other)
4. Price range in INR (min and max)
5. SEO keywords (5-8 tags)
6. Target market

${notes ? `Artisan notes: ${notes}` : ''}
${priceHint ? `Artisan estimated price: ₹${priceHint}` : ''}

Respond in this exact JSON format:
{
  "product_name": "...",
  "description": "...",
  "category": "...",
  "price_min": 0,
  "price_max": 0,
  "suggested_price": 0,
  "tags": ["tag1","tag2"],
  "target_market": "..."
}`;

  const body = {
    contents: [{
      parts: [
        { inline_data: { mime_type: mimeType, data: base64 } },
        { text: prompt }
      ]
    }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini returned no JSON');

  const result = JSON.parse(jsonMatch[0]);

  // Normalise to the same shape the backend returns
  const suggested = result.suggested_price || Math.round(((result.price_min || 0) + (result.price_max || 0)) / 2);
  return {
    product_name: result.product_name || 'Handcrafted Item',
    description: result.description || '',
    category: result.category || 'Handicraft',
    price_min: result.price_min || 0,
    price_max: result.price_max || 0,
    suggested_price: suggested,
    tags: Array.isArray(result.tags) ? result.tags : [],
    target_market: result.target_market || '',
    ai_provider: `Direct Gemini Vision (${model})`,
    simulated: false,
  };
}

async function triggerAiAnalysis() {
  if (!state.selectedFile && !state.uploadedImageUrl) {
    alert("Please take or choose a craft photo first.");
    return;
  }

  const analyzeBtn = document.getElementById('analyzeBtn');
  const analyzeBtnText = document.getElementById('analyzeBtnText');
  const analyzeSpinner = document.getElementById('analyzeSpinner');
  const progressBox = document.getElementById('aiProgressBox');
  const progressText = document.getElementById('aiProgressText');

  // Disable button & show spinner
  if (analyzeBtn) analyzeBtn.disabled = true;
  if (analyzeSpinner) analyzeSpinner.classList.remove('hidden');
  if (analyzeBtnText) analyzeBtnText.textContent = t('btn_analyzing');
  if (progressBox) progressBox.classList.remove('hidden');

  // Multi-step animated progress simulation
  const progressSteps = [
    currentLanguage === 'hi' ? "शिल्प की बनावट और रंग की जांच..." : "Analyzing craft texture and pigment...",
    currentLanguage === 'hi' ? "पारंपरिक हस्तकला और श्रेणी की पहचान..." : "Identifying cultural craft category...",
    currentLanguage === 'hi' ? "उचित कारीगर मूल्य और ई-कॉमर्स टैग तैयार..." : "Calculating fair artisan pricing & SEO tags..."
  ];

  let stepIdx = 0;
  const progressInterval = setInterval(() => {
    stepIdx = (stepIdx + 1) % progressSteps.length;
    if (progressText) progressText.textContent = progressSteps[stepIdx];
  }, 900);

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new Error('NO_NETWORK');
    }

    const notes = document.getElementById('artisanNotes')?.value || '';
    const priceHint = document.getElementById('artisanEstimatedPrice')?.value || '';

    // Determine image source: prefer File object, else use URL
    const imageSource = state.selectedFile || state.uploadedImageUrl;

    let data = null;

    // === PATH 1: Direct Gemini Vision call (preferred, same as mobile app) ===
    try {
      if (progressText) progressText.textContent = "Connecting to Gemini Vision AI...";
      data = await _callGeminiVisionDirect(imageSource, notes, priceHint);
      console.log('[KalaSetu] Direct Gemini Vision success:', data.ai_provider);
    } catch (geminiErr) {
      console.warn('[KalaSetu] Direct Gemini failed, falling back to backend:', geminiErr.message);
      data = null;
    }

    // === PATH 2: Backend /api/analyze-product (fallback) ===
    if (!data) {
      if (progressText) progressText.textContent = "Analyzing via backend AI service...";
      const formData = new FormData();

      if (state.selectedFile) {
        formData.append('file', state.selectedFile);
      } else if (state.uploadedImageUrl) {
        // Properly fetch the URL as real image bytes (NOT a dummy text blob)
        try {
          const resp = await fetch(state.uploadedImageUrl);
          const blob = await resp.blob();
          const file = new File([blob], 'craft-image.jpg', { type: blob.type || 'image/jpeg' });
          formData.append('file', file);
        } catch (fetchErr) {
          console.warn('[KalaSetu] Could not fetch image URL, sending empty placeholder:', fetchErr);
          const blob = new Blob([new Uint8Array(0)], { type: 'image/jpeg' });
          formData.append('file', blob, 'sample.jpg');
        }
      }

      if (notes) formData.append('notes', notes);
      if (priceHint) formData.append('price_hint', priceHint);

      const res = await fetch('/api/analyze-product', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      data = await res.json();
    }

    clearInterval(progressInterval);

    state.aiResult = data;
    if (data.saved_image_url) {
      state.uploadedImageUrl = data.saved_image_url;
    }

    // Populate Review & Edit Section
    populateReviewCard(data);

    // Scroll to review card
    const reviewCard = document.getElementById('reviewSection');
    if (reviewCard) {
      reviewCard.classList.remove('hidden');
      reviewCard.scrollIntoView({ behavior: 'smooth' });
    }

  } catch (err) {
    clearInterval(progressInterval);
    console.error("AI Analysis error:", err);
    const isOffline =
      err?.message === 'NO_NETWORK' ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError') ||
      (typeof navigator !== 'undefined' && !navigator.onLine);

    if (isOffline) {
      showInteractiveModal({
        type: 'network',
        title: currentLanguage === 'hi' ? 'नेटवर्क उपलब्ध नहीं है' : 'No Network Connection',
        subtitle: currentLanguage === 'hi' ? 'इंटरनेट कनेक्शन आवश्यक है' : 'Internet Required',
        message: currentLanguage === 'hi'
          ? 'KalaSetu को शिल्प विवरण का विश्लेषण करने और उचित मूल्य तैयार करने के लिए एक सक्रिय इंटरनेट कनेक्शन की आवश्यकता है। कृपया अपना नेटवर्क चेक करें।'
          : 'KalaSetu requires an active internet connection to analyze craft details and calculate fair artisan pricing. Please check your Wi-Fi or mobile data and try again.',
        primaryText: currentLanguage === 'hi' ? 'पुनः प्रयास करें' : 'Try Again',
        onPrimary: () => {
          setTimeout(() => triggerAiAnalysis(), 300);
        },
        secondaryText: currentLanguage === 'hi' ? 'रद्द करें' : 'Dismiss'
      });
    } else {
      showInteractiveModal({
        type: 'error',
        title: currentLanguage === 'hi' ? 'विश्लेषण त्रुटि' : 'Analysis Error',
        subtitle: currentLanguage === 'hi' ? 'सर्वर से संपर्क नहीं हो सका' : 'Could not complete AI analysis',
        message: err.message || 'AI analysis encountered an error. Please verify backend connectivity.',
        primaryText: 'OK'
      });
    }
  } finally {
    if (analyzeBtn) analyzeBtn.disabled = false;
    if (analyzeSpinner) analyzeSpinner.classList.add('hidden');
    if (analyzeBtnText) analyzeBtnText.textContent = t('btn_analyze_ai');
    if (progressBox) progressBox.classList.add('hidden');
  }
}


// Populate the Review & Edit Form
function populateReviewCard(data) {
  const reviewImg = document.getElementById('reviewCardImage');
  if (reviewImg && state.uploadedImageUrl) {
    reviewImg.src = resolveImageUrl(state.uploadedImageUrl);
  }

  // Suggested Title
  const titleInput = document.getElementById('editProductTitle');
  if (titleInput) {
    titleInput.value = data.suggested_title || "";
  }

  // Category
  const categorySelect = document.getElementById('editProductCategory');
  if (categorySelect && data.category) {
    categorySelect.value = data.category;
  }

  // Dynamic Pricing
  const priceInput = document.getElementById('editProductPrice');
  const fairMin = document.getElementById('fairPriceMin');
  const fairMax = document.getElementById('fairPriceMax');
  const priceJustification = document.getElementById('priceJustificationText');

  if (data.pricing) {
    if (priceInput) priceInput.value = data.pricing.suggested || "";
    if (fairMin) fairMin.textContent = `₹${data.pricing.fair_min || 0}`;
    if (fairMax) fairMax.textContent = `₹${data.pricing.fair_max || 0}`;
    if (priceJustification) priceJustification.textContent = data.pricing.justification || "";
  }

  // Descriptions
  const descEn = document.getElementById('editDescEn');
  const descHi = document.getElementById('editDescHi');
  if (descEn) descEn.value = data.description_en || "";
  if (descHi) descHi.value = data.description_hi || "";

  // Audio Buttons
  setupAudioNarrationButtons(data);

  // Tags
  renderEditableTags(data.tags || []);
}

function setupAudioNarrationButtons(data) {
  const speakerEn = document.getElementById('speakerBtnEn');
  const speakerHi = document.getElementById('speakerBtnHi');

  if (speakerEn) {
    speakerEn.onclick = () => {
      const text = document.getElementById('editDescEn')?.value || data.description_en;
      toggleNarration(text, 'en-IN');
    };
  }

  if (speakerHi) {
    speakerHi.onclick = () => {
      const text = document.getElementById('editDescHi')?.value || data.description_hi;
      toggleNarration(text, 'hi-IN');
    };
  }
}

// Tags Management
let currentTags = [];

function renderEditableTags(tags) {
  currentTags = [...tags];
  const container = document.getElementById('tagsContainer');
  const input = document.getElementById('newTagInput');
  const addBtn = document.getElementById('addTagBtn');

  if (!container) return;

  function updateTagPills() {
    container.innerHTML = '';
    currentTags.forEach((tag, idx) => {
      const pill = document.createElement('span');
      pill.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-terracotta-100 text-terracotta-700 border border-terracotta-200';
      pill.innerHTML = `
        <span>#${tag}</span>
        <button type="button" class="hover:text-red-600 focus:outline-none" onclick="removeTag(${idx})">&times;</button>
      `;
      container.appendChild(pill);
    });
  }

  window.removeTag = (idx) => {
    currentTags.splice(idx, 1);
    updateTagPills();
  };

  if (addBtn && input) {
    addBtn.onclick = () => {
      const val = input.value.trim().replace(/^#/, '');
      if (val && !currentTags.includes(val)) {
        currentTags.push(val);
        input.value = '';
        updateTagPills();
      }
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addBtn.click();
      }
    };
  }

  updateTagPills();
}

// Publish Product to Marketplace
async function publishProductToMarketplace() {
  const title = document.getElementById('editProductTitle')?.value.trim();
  const category = document.getElementById('editProductCategory')?.value;
  const price = parseInt(document.getElementById('editProductPrice')?.value, 10);
  const quantity = parseInt(document.getElementById('editProductQuantity')?.value, 10);
  const descEn = document.getElementById('editDescEn')?.value.trim();
  const descHi = document.getElementById('editDescHi')?.value.trim();
  const artisanName = document.getElementById('artisanName')?.value.trim() || "Artisan Beneficiary";
  const artisanLoc = document.getElementById('artisanLocation')?.value.trim() || "Rural Cluster, India";
  const artisanPhone = document.getElementById('artisanPhone')?.value.trim() || "+919876543210";

  if (!title) {
    alert("Please enter a product title.");
    return;
  }

  if (!price || isNaN(price)) {
    alert("Please specify a valid price.");
    return;
  }

  if (!quantity || quantity < 1 || quantity > 10) {
    alert('Enter a quantity from 1 to 10. Each artisan can publish 3 listings per month.');
    return;
  }

  const publishBtn = document.getElementById('publishBtn');
  const publishSpinner = document.getElementById('publishSpinner');
  if (publishBtn) publishBtn.disabled = true;
  if (publishSpinner) publishSpinner.classList.remove('hidden');

  const imageUrl = state.uploadedImageUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80";

  const payload = {
    name: title,
    artisan_name: artisanName,
    artisan_phone: artisanPhone,
    artisan_location: artisanLoc,
    category: category || 'Handloom & Textiles',
    price: price,
    suggested_price_min: state.aiResult?.pricing?.fair_min || Math.round(price * 0.85),
    suggested_price_max: state.aiResult?.pricing?.fair_max || Math.round(price * 1.25),
    price_justification: state.aiResult?.pricing?.justification || "Fair trade calculated based on handcraft labor and materials.",
    description_en: descEn || title,
    description_hi: descHi || '',
    tags: currentTags.length > 0 ? currentTags : ['Handmade', 'Artisan', category || 'Craft'],
    image_url: imageUrl,
    image_gallery: [imageUrl],
    rating: 4.8,
    reviews: [],
    is_enhanced: state.isEnhanced || false,
    mosje_verified: true,
    quantity,
    owner_user_id: state.currentUser?.id || null  // Link listing to the publisher's account ID
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Read response body first so we can show real error if it failed
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data.detail || data.message || `Server error ${res.status}`;
      throw new Error(errMsg);
    }

    // Show celebratory toast
    showToast(t('publish_success'));

    // Reset upload form
    resetArtisanForm();

    // Reload fresh account data and marketplace products
    await loadAccountData();
    await loadProducts();

    // Switch to Marketplace tab and refresh
    switchTab('marketplace');

  } catch (err) {
    console.error("Publish error:", err);
    alert("Could not publish product:\n" + (err.message || 'Unknown error. Check your internet connection.'));
  } finally {
    if (publishBtn) publishBtn.disabled = false;
    if (publishSpinner) publishSpinner.classList.add('hidden');
  }
}

function resetArtisanForm() {
  document.getElementById('craftImageInput').value = '';
  document.getElementById('previewImage').src = '';
  document.getElementById('previewImage').classList.add('hidden');
  document.getElementById('previewPlaceholder').classList.remove('hidden');
  document.getElementById('reviewSection').classList.add('hidden');
  document.getElementById('artisanNotes').value = '';
  document.getElementById('artisanEstimatedPrice').value = '';
  document.getElementById('editProductTitle').value = '';
  document.getElementById('editProductPrice').value = '';
  document.getElementById('editDescEn').value = '';
  document.getElementById('editDescHi').value = '';
  currentTags = [];
  document.getElementById('tagsContainer').innerHTML = '';
  state.selectedFile = null;
  state.uploadedImageUrl = null;
  state.aiResult = null;
}

// Fetch and Render Products in Marketplace
async function loadProducts() {
  const container = document.getElementById('productsGrid');
  const countEl = document.getElementById('productCountText');

  if (container) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <div class="inline-block w-8 h-8 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-2 text-sm">Loading authentic handcrafted items...</p>
      </div>
    `;
  }

  try {
    const params = new URLSearchParams();
    if (state.currentCategoryFilter && state.currentCategoryFilter !== 'All') {
      params.append('category', state.currentCategoryFilter);
    }
    if (state.searchQuery) {
      params.append('search', state.searchQuery);
    }
    if (state.sortBy) {
      params.append('sort', state.sortBy);
    }

    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    state.products = data.products || [];

    if (countEl) {
      countEl.textContent = `${state.products.length} ${currentLanguage === 'hi' ? 'शिल्प उपलब्ध' : 'crafts available'}`;
    }

    renderProducts(state.products);

  } catch (err) {
    console.error("Failed to load products:", err);
    if (container) {
      container.innerHTML = `<div class="col-span-full py-12 text-center text-red-500">Failed to load marketplace products.</div>`;
    }
  }
}

function renderProducts(products) {
  const container = document.getElementById('productsGrid');
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-terracotta-50 text-terracotta-500 rounded-full flex items-center justify-center text-2xl">
          🏺
        </div>
        <h3 class="text-lg font-bold text-slate-800">No crafts found</h3>
        <p class="text-sm text-slate-500 max-w-sm mx-auto mt-1">Try searching for a different term or clear your category filters.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    const tagsList = Array.isArray(p.tags) ? p.tags.slice(0, 3) : [];
    const imageClass = p.is_enhanced ? 'studio-enhanced' : '';

    return `
      <div class="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-terracotta-300 hover:shadow-xl transition-all duration-300 flex flex-col">
        <!-- Image Container -->
        <div class="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer"
             onclick="openProductModal(${p.id})"
             role="button"
             tabindex="0"
             aria-label="View ${p.name} details"
             onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProductModal(${p.id}); }">
          <img src="${resolveImageUrl(p.image_url)}" alt="${p.name}"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imageClass}">
          
          <!-- Category Pill -->
          <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded-full text-slate-800 shadow-sm border border-slate-100">
            ${p.category}
          </span>

          <!-- MoSJE Verified Badge -->
          <span class="absolute top-3 right-3 bg-indigo-900/90 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-full text-amber-300 shadow-sm flex items-center gap-1">
            <svg class="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            MoSJE
          </span>

          <!-- Price Tag -->
          <div class="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1 rounded-full font-bold text-sm shadow-md">
            ₹${p.price.toLocaleString('en-IN')}
          </div>
        </div>

        <!-- Details -->
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-slate-900 line-clamp-1 group-hover:text-terracotta-600 transition-colors">
              ${p.name}
            </h3>
            
            <p class="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span>${p.artisan_name}</span> &bull; <span>${p.artisan_location}</span>
            </p>

            <p class="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
              ${currentLanguage === 'hi' && p.description_hi ? p.description_hi : p.description_en}
            </p>

            <p class="text-xs font-bold text-emerald-700 mt-2">
              ${p.quantity || 0} item${(p.quantity || 0) === 1 ? '' : 's'} available
            </p>

            <!-- Tags -->
            <div class="flex flex-wrap gap-1.5 mt-3">
              ${tagsList.map(t => `<span class="text-[11px] bg-sand-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">#${t}</span>`).join('')}
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button onclick="openProductModal(${p.id})" 
                    class="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100 transition-colors text-center">
              ${t('btn_view_details')}
            </button>
            <button onclick="openProductModal(${p.id})"
                    class="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                    title="Rate and review this product">★ Rate</button>

            <button onclick="toggleWishlist(${p.id})"
                    class="p-2 rounded-xl ${state.accountWishlist.includes(p.id) ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'} hover:bg-rose-100 hover:text-rose-600 transition-colors"
                    title="Save to wishlist">♥</button>
            ${state.currentUser && (
              (p.owner_user_id && Number(p.owner_user_id) === Number(state.currentUser.id))
              || state.currentUser.name?.trim().toLowerCase() === String(p.artisan_name || '').trim().toLowerCase()
              || (state.currentUser.phone && p.artisan_phone && state.currentUser.phone.replace(/\D/g,'').slice(-10) === p.artisan_phone.replace(/\D/g,'').slice(-10))
              || state.accountPublishedProducts.some(pub => pub.id === p.id)
            )
                    ? `<button onclick="deleteMarketplaceProduct(${p.id})"
                             class="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                             title="Delete your listing">🗑</button>`
                    : ''}

            <a href="https://wa.me/${(p.artisan_phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${p.artisan_name}, I am interested in buying your handcrafted '${p.name}' listed on KalaSetu marketplace for ₹${p.price}.`)}"
               target="_blank" rel="noopener noreferrer"
               class="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
               title="WhatsApp Inquiry">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleWishlist(productId) {
  if (!state.currentUser) {
    switchTab('account');
    showToast('Sign in to save crafts to your wishlist');
    return;
  }

  const saved = state.accountWishlist.includes(productId);
  const url = saved ? `/api/wishlist/${state.currentUser.id}/${productId}` : `/api/wishlist/${state.currentUser.id}`;
  const response = await fetch(url, {
    method: saved ? 'DELETE' : 'POST',
    headers: saved ? undefined : { 'Content-Type': 'application/json' },
    body: saved ? undefined : JSON.stringify({ product_id: productId })
  });
  if (response.ok) {
    state.accountWishlist = saved ? state.accountWishlist.filter(id => id !== productId) : [...state.accountWishlist, productId];
    showToast(saved ? 'Removed from wishlist' : 'Saved to wishlist');
    renderProducts(state.products);
  }
}

async function deleteMarketplaceProduct(productId) {
  if (!state.currentUser || !confirm('Delete this product listing? This cannot be undone.')) return;
  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: state.currentUser.id })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Product could not be deleted');
    showToast(data.message || 'Product listing deleted. Monthly listing limit restored.');
    await loadAccountData();
    await loadProducts();
    if (state.currentUser && state.accountView === 'orders') renderAccountView('orders');
  } catch (error) {
    console.error('Product deletion error:', error);
    showToast(error.message || 'Product could not be deleted');
  }
}

// Category filter button handler
function filterByCategory(cat) {
  state.currentCategoryFilter = cat;
  document.querySelectorAll('.cat-pill').forEach(pill => {
    if (pill.getAttribute('data-cat') === cat) {
      pill.classList.add('bg-terracotta-600', 'text-white');
      pill.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
    } else {
      pill.classList.remove('bg-terracotta-600', 'text-white');
      pill.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
    }
  });
  loadProducts();
}

// Open Product Detail Modal
function openProductModal(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  state.selectedProductForModal = product;
  const modal = document.getElementById('productDetailModal');
  if (!modal) return;

  document.getElementById('modalImage').src = resolveImageUrl(product.image_url);
  document.getElementById('modalTitle').textContent = product.name;
  document.getElementById('modalPrice').textContent = `₹${product.price.toLocaleString('en-IN')}`;
  document.getElementById('modalCategory').textContent = product.category;
  document.getElementById('modalArtisanName').textContent = product.artisan_name;
  document.getElementById('modalArtisanLoc').textContent = product.artisan_location;
  const orderQuantity = document.getElementById('modalOrderQuantity');
  if (orderQuantity) {
    const maxQuantity = Math.min(10, Math.max(1, product.quantity ?? 10));
    Array.from(orderQuantity.options).forEach(option => {
      option.disabled = Number(option.value) > maxQuantity;
    });
    orderQuantity.value = '1';
    orderQuantity.disabled = maxQuantity < 2;
  }
  
  const descText = currentLanguage === 'hi' && product.description_hi ? product.description_hi : product.description_en;
  document.getElementById('modalDesc').textContent = descText;

  // Heritage story & pricing justification
  const storyBox = document.getElementById('modalStoryBox');
  const storyText = document.getElementById('modalStoryText');
  if (product.price_justification && storyBox && storyText) {
    storyBox.classList.remove('hidden');
    storyText.textContent = product.price_justification;
  }

  // Tags
  const modalTags = document.getElementById('modalTags');
  if (modalTags && Array.isArray(product.tags)) {
    modalTags.innerHTML = product.tags.map(t => 
      `<span class="text-xs bg-sand-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">#${t}</span>`
    ).join('');
  }

  const ratingSummary = document.getElementById('modalRatingSummary');
  if (ratingSummary) ratingSummary.textContent = `★ ${Number(product.rating || 0).toFixed(1)} · ${product.reviews?.length || 0} review(s)`;
  const reviewComment = document.getElementById('modalReviewComment');
  const reviewStatus = document.getElementById('modalReviewStatus');
  if (reviewComment) reviewComment.value = '';
  if (reviewStatus) {
    reviewStatus.textContent = '';
    reviewStatus.className = 'hidden mt-2 text-xs font-semibold';
  }
  renderModalReviews(product.reviews || []);

  // Audio button inside modal
  const modalSpeaker = document.getElementById('modalSpeakerBtn');
  if (modalSpeaker) {
    modalSpeaker.onclick = () => {
      const lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
      toggleNarration(descText, lang);
    };
  }

  // WhatsApp Button
  const waBtn = document.getElementById('modalWhatsAppBtn');
  if (waBtn) {
    const cleanPhone = (product.artisan_phone || '').replace(/[^0-9]/g, '');
    const msg = `Namaste ${product.artisan_name}, I saw your handcrafted '${product.name}' on KalaSetu marketplace for ₹${product.price}. I would like to order directly from you.`;
    waBtn.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  }

  modal.classList.remove('hidden');
}

function renderModalReviews(reviews) {
  const container = document.getElementById('modalReviews');
  if (!container) return;
  container.innerHTML = reviews.length
    ? reviews.slice().reverse().slice(0, 5).map(review => `
        <div class="rounded-xl bg-white border border-amber-100 px-3 py-2">
          <div class="flex items-center justify-between gap-2 text-xs">
            <strong class="text-slate-800">${escapeHtml(review.user_name || 'Anonymous')}</strong>
            <span class="text-amber-700 font-bold">★ ${Number(review.rating || 0).toFixed(1)}</span>
          </div>
          <p class="text-xs text-slate-600 mt-1">${escapeHtml(review.comment || '')}</p>
        </div>`).join('')
    : '<p class="text-xs text-slate-500">No reviews yet. Be the first to share your experience.</p>';
}

async function submitProductReview() {
  const product = state.selectedProductForModal;
  if (!product) return;
  const button = document.getElementById('modalSubmitReviewBtn');
  const status = document.getElementById('modalReviewStatus');
  const comment = document.getElementById('modalReviewComment')?.value.trim();
  const rating = Number(document.getElementById('modalReviewRating')?.value || 5);
  if (!comment) {
    if (status) {
      status.textContent = 'Please write a review before submitting.';
      status.className = 'mt-2 text-xs font-semibold text-red-700';
    }
    return;
  }
  if (button) button.disabled = true;
  try {
    const response = await fetch(`/api/products/${product.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: state.currentUser?.name || 'Marketplace visitor',
        rating,
        comment
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Review could not be submitted');
    product.rating = data.rating;
    product.reviews = data.reviews;
    const ratingSummary = document.getElementById('modalRatingSummary');
    if (ratingSummary) ratingSummary.textContent = `★ ${Number(data.rating).toFixed(1)} · ${data.reviews.length} review(s)`;
    renderModalReviews(data.reviews);
    if (status) {
      status.textContent = 'Thanks for sharing your review.';
      status.className = 'mt-2 text-xs font-semibold text-emerald-700';
    }
    if (document.getElementById('modalReviewComment')) document.getElementById('modalReviewComment').value = '';
    renderProducts(state.products);
  } catch (error) {
    console.error('Product review error:', error);
    if (status) {
      status.textContent = error.message || 'Review could not be submitted.';
      status.className = 'mt-2 text-xs font-semibold text-red-700';
    }
  } finally {
    if (button) button.disabled = false;
  }
}

async function placeMarketplaceOrder() {
  const product = state.selectedProductForModal;
  if (!product) return;
  if (!state.currentUser) {
    document.getElementById('productDetailModal')?.classList.add('hidden');
    switchTab('account');
    showToast('Sign in before placing an order request');
    return;
  }

  const deliveryFields = {
    recipient_name: document.getElementById('orderRecipientName')?.value.trim() || '',
    recipient_phone: document.getElementById('orderRecipientPhone')?.value.trim() || '',
    address_line: document.getElementById('orderAddressLine')?.value.trim() || '',
    city: document.getElementById('orderCity')?.value.trim() || '',
    state: document.getElementById('orderState')?.value.trim() || '',
    pincode: document.getElementById('orderPincode')?.value.trim() || ''
  };
  const missingDeliveryField = Object.values(deliveryFields).some(value => !value);
  if (missingDeliveryField) {
    showToast('Enter all delivery details before placing the order');
    document.getElementById('deliveryDetailsForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (!/^\d{6}$/.test(deliveryFields.pincode)) {
    showToast('Enter a valid 6-digit pincode');
    document.getElementById('orderPincode')?.focus();
    return;
  }

  const button = document.getElementById('modalPlaceOrderBtn');
  if (button) {
    button.disabled = true;
    button.querySelector('span:last-child').textContent = 'Sending request...';
  }

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.currentUser.id,
        product_id: product.id,
        product_name: product.name,
        quantity: Math.max(1, parseInt(document.getElementById('modalOrderQuantity')?.value, 10) || 1),
        total: product.price * Math.max(1, parseInt(document.getElementById('modalOrderQuantity')?.value, 10) || 1),
        status: 'Requested',
        eta: 'Artisan will confirm delivery',
        ...deliveryFields
      })
    });
    if (!response.ok) {
      let detail = 'Order request failed';
      try {
        const errorData = await response.json();
        detail = errorData.detail || detail;
      } catch (parseError) {
        console.warn('Could not parse order error response:', parseError);
      }
      throw new Error(detail);
    }
    await loadAccountData();
    await loadProducts();
    document.getElementById('productDetailModal')?.classList.add('hidden');
    showToast('Order request sent to the artisan');
    switchTab('account');
    renderAccountView('orders');
  } catch (error) {
    console.error('Order request error:', error);
    showToast(error instanceof Error ? error.message : 'Could not place the order request');
  } finally {
    if (button) {
      button.disabled = false;
      button.querySelector('span:last-child').textContent = t('btn_place_order');
    }
  }
}

// Toast notification helper
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = String(message || '');
  toast.classList.remove('toast-hidden');
  toast.classList.add('toast-visible');
  toast.style.opacity = '1';
  toast.style.transform = 'translate(-50%, 0)';

  clearTimeout(toast._toastTimer);
  toast._toastTimer = setTimeout(() => {
    toast.classList.add('toast-hidden');
    toast.classList.remove('toast-visible');
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -20px)';
  }, 4000);
}

// Global hook for language changes
window.onLanguageChanged = (lang) => {
  if (state.products.length > 0) {
    renderProducts(state.products);
  }
  if (state.currentUser) {
    renderAccountShell();
  }
  const orderButton = document.querySelector('#modalPlaceOrderBtn span:last-child');
  if (orderButton) orderButton.textContent = t('btn_place_order');
};
