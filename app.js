/**
 * NutriTrack - Personal Calorie & Macro Tracker
 * Pure Vanilla JavaScript (ES6) with LocalStorage persistence.
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY_ENTRIES = 'nutritrack_entries_v1';
  const STORAGE_KEY_SETTINGS = 'nutritrack_settings_v1';
  const RING_CIRCUMFERENCE = 502.65; // 2 * Math.PI * 80

  const DEFAULT_SETTINGS = {
    dailyGoal: 2000,
    proteinGoal: 140,
    carbsGoal: 220,
    fatGoal: 65,
  };

  // --- Application State ---
  let currentDate = getFormattedDate(new Date());
  let settings = loadSettings();
  let entries = loadEntries();
  let currentFilter = 'all';
  let searchQuery = '';

  // --- DOM Elements ---
  const elDateLabel = document.getElementById('current-date-label');
  const elDatePicker = document.getElementById('date-picker-input');
  const elPrevDateBtn = document.getElementById('prev-date-btn');
  const elNextDateBtn = document.getElementById('next-date-btn');

  // Hero Stats Elements
  const elRemainingCalories = document.getElementById('remaining-calories');
  const elRemainingLabel = document.getElementById('remaining-label');
  const elGoalCaloriesDisplay = document.getElementById('goal-calories-display');
  const elConsumedCaloriesDisplay = document.getElementById('consumed-calories-display');
  const elPercentageDisplay = document.getElementById('percentage-calories-display');
  const elProgressCircle = document.getElementById('calorie-progress-circle');
  const elCalorieStatusBadge = document.getElementById('calorie-status-badge');

  // Macro Stats Elements
  const elMacroCaloriesCalc = document.getElementById('macro-calories-calc');
  const elProteinConsumed = document.getElementById('protein-consumed');
  const elProteinTarget = document.getElementById('protein-target');
  const elProteinPct = document.getElementById('protein-pct');
  const elProteinBar = document.getElementById('protein-bar');

  const elCarbsConsumed = document.getElementById('carbs-consumed');
  const elCarbsTarget = document.getElementById('carbs-target');
  const elCarbsPct = document.getElementById('carbs-pct');
  const elCarbsBar = document.getElementById('carbs-bar');

  const elFatConsumed = document.getElementById('fat-consumed');
  const elFatTarget = document.getElementById('fat-target');
  const elFatPct = document.getElementById('fat-pct');
  const elFatBar = document.getElementById('fat-bar');

  const elRatioProtein = document.getElementById('ratio-protein');
  const elRatioCarbs = document.getElementById('ratio-carbs');
  const elRatioFat = document.getElementById('ratio-fat');
  const elRatioProteinText = document.getElementById('ratio-protein-text');
  const elRatioCarbsText = document.getElementById('ratio-carbs-text');
  const elRatioFatText = document.getElementById('ratio-fat-text');

  // Toolbar Elements
  const elFoodSearchInput = document.getElementById('food-search-input');
  const elClearSearchBtn = document.getElementById('clear-search-btn');
  const elFilterTabs = document.querySelectorAll('.filter-tab');

  // Meal Block Containers
  const mealBlocks = {
    Breakfast: {
      block: document.getElementById('block-breakfast'),
      items: document.getElementById('breakfast-items'),
      count: document.getElementById('breakfast-count'),
      calories: document.getElementById('breakfast-calories'),
    },
    Lunch: {
      block: document.getElementById('block-lunch'),
      items: document.getElementById('lunch-items'),
      count: document.getElementById('lunch-count'),
      calories: document.getElementById('lunch-calories'),
    },
    Dinner: {
      block: document.getElementById('block-dinner'),
      items: document.getElementById('dinner-items'),
      count: document.getElementById('dinner-count'),
      calories: document.getElementById('dinner-calories'),
    },
    Snacks: {
      block: document.getElementById('block-snacks'),
      items: document.getElementById('snacks-items'),
      count: document.getElementById('snacks-count'),
      calories: document.getElementById('snacks-calories'),
    },
  };

  const elDayEmptyState = document.getElementById('day-empty-state');
  const elEmptyStateAddBtn = document.getElementById('empty-state-add-btn');

  // Modals & Forms
  const elFoodModal = document.getElementById('food-modal');
  const elFoodForm = document.getElementById('food-form');
  const elModalTitle = document.getElementById('modal-title');
  const elOpenAddFoodBtn = document.getElementById('open-add-food-btn');
  const elCloseFoodModal = document.getElementById('close-food-modal');
  const elCancelFoodBtn = document.getElementById('cancel-food-btn');

  // Food Form Inputs
  const elEntryIdInput = document.getElementById('entry-id-input');
  const elFoodNameInput = document.getElementById('food-name-input');
  const elFoodMealSelect = document.getElementById('food-meal-select');
  const elFoodCaloriesInput = document.getElementById('food-calories-input');
  const elFoodProteinInput = document.getElementById('food-protein-input');
  const elFoodCarbsInput = document.getElementById('food-carbs-input');
  const elFoodFatInput = document.getElementById('food-fat-input');

  // Quick Add Modal
  const elQuickAddModal = document.getElementById('quick-add-modal');
  const elQuickAddBtn = document.getElementById('quick-add-btn');
  const elCloseQuickModal = document.getElementById('close-quick-modal');
  const elCancelQuickBtn = document.getElementById('cancel-quick-btn');
  const elQuickAddForm = document.getElementById('quick-add-form');
  const elQuickCaloriesInput = document.getElementById('quick-calories-input');
  const elQuickMealSelect = document.getElementById('quick-meal-select');
  const elQuickNoteInput = document.getElementById('quick-note-input');

  // Settings Modal
  const elSettingsModal = document.getElementById('settings-modal');
  const elOpenSettingsBtn = document.getElementById('open-settings-btn');
  const elCloseSettingsModal = document.getElementById('close-settings-modal');
  const elCancelSettingsBtn = document.getElementById('cancel-settings-btn');
  const elSettingsForm = document.getElementById('settings-form');
  const elSettingsGoalInput = document.getElementById('settings-goal-input');
  const elSettingsProteinInput = document.getElementById('settings-protein-input');
  const elSettingsCarbsInput = document.getElementById('settings-carbs-input');
  const elSettingsFatInput = document.getElementById('settings-fat-input');

  // Backup & Storage Buttons
  const elExportDataBtn = document.getElementById('export-data-btn');
  const elImportDataInput = document.getElementById('import-data-input');
  const elClearAllDataBtn = document.getElementById('clear-all-data-btn');

  // Toast Container
  const elToastContainer = document.getElementById('toast-container');

  // --- Initializer ---
  function init() {
    setupInitialDataIfEmpty();
    bindEvents();
    updateDateDisplay();
    renderAll();
  }

  // Seed sample data on first visit so user gets an immediate feel for the UI
  function setupInitialDataIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEY_ENTRIES)) {
      const today = getFormattedDate(new Date());
      const sampleEntries = [
        {
          id: generateId(),
          date: today,
          name: 'Greek Yogurt with Blueberries & Honey',
          calories: 280,
          protein: 22,
          carbs: 36,
          fat: 5,
          mealType: 'Breakfast',
          time: '08:15 AM'
        },
        {
          id: generateId(),
          date: today,
          name: 'Grilled Chicken Salad with Olive Oil',
          calories: 520,
          protein: 48,
          carbs: 18,
          fat: 26,
          mealType: 'Lunch',
          time: '12:45 PM'
        },
        {
          id: generateId(),
          date: today,
          name: 'Handful of Almonds & Green Apple',
          calories: 230,
          protein: 6,
          carbs: 25,
          fat: 14,
          mealType: 'Snacks',
          time: '04:00 PM'
        }
      ];
      entries = sampleEntries;
      saveEntries();
    }
  }

  // --- Event Bindings ---
  function bindEvents() {
    // Date Navigation
    elPrevDateBtn.addEventListener('click', () => changeDate(-1));
    elNextDateBtn.addEventListener('click', () => changeDate(1));
    elDateLabel.addEventListener('click', () => {
      if (typeof elDatePicker.showPicker === 'function') {
        elDatePicker.showPicker();
      } else {
        elDatePicker.focus();
      }
    });
    elDatePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        currentDate = e.target.value;
        updateDateDisplay();
        renderAll();
      }
    });

    // Toolbar Filter & Search
    elFilterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elFilterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-filter');
        renderMealBlocks();
      });
    });

    elFoodSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (searchQuery.length > 0) {
        elClearSearchBtn.classList.remove('hidden');
      } else {
        elClearSearchBtn.classList.add('hidden');
      }
      renderMealBlocks();
    });

    elClearSearchBtn.addEventListener('click', () => {
      elFoodSearchInput.value = '';
      searchQuery = '';
      elClearSearchBtn.classList.add('hidden');
      renderMealBlocks();
      elFoodSearchInput.focus();
    });

    // Add Food Buttons
    elOpenAddFoodBtn.addEventListener('click', () => openFoodModal());
    elEmptyStateAddBtn.addEventListener('click', () => openFoodModal());
    document.querySelectorAll('.btn-meal-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const meal = e.currentTarget.getAttribute('data-meal');
        openFoodModal(null, meal);
      });
    });

    // Quick Add Button
    elQuickAddBtn.addEventListener('click', openQuickAddModal);

    // Settings Button
    elOpenSettingsBtn.addEventListener('click', openSettingsModal);

    // Modal Close buttons
    elCloseFoodModal.addEventListener('click', closeFoodModal);
    elCancelFoodBtn.addEventListener('click', closeFoodModal);

    elCloseQuickModal.addEventListener('click', closeQuickAddModal);
    elCancelQuickBtn.addEventListener('click', closeQuickAddModal);

    elCloseSettingsModal.addEventListener('click', closeSettingsModal);
    elCancelSettingsBtn.addEventListener('click', closeSettingsModal);

    // Close on overlay backdrop click
    [elFoodModal, elQuickAddModal, elSettingsModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });

    // Escape key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        elFoodModal.classList.add('hidden');
        elQuickAddModal.classList.add('hidden');
        elSettingsModal.classList.add('hidden');
      }
    });

    // Preset food suggestion buttons in modal
    document.querySelectorAll('.presets-container .preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        elFoodNameInput.value = chip.dataset.name || '';
        elFoodCaloriesInput.value = chip.dataset.cal || '';
        elFoodProteinInput.value = chip.dataset.p || '';
        elFoodCarbsInput.value = chip.dataset.c || '';
        elFoodFatInput.value = chip.dataset.f || '';
      });
    });

    // Quick add increment buttons (+50, +100, etc.)
    document.querySelectorAll('.btn-quick-val').forEach(btn => {
      btn.addEventListener('click', () => {
        const add = parseInt(btn.dataset.cal, 10) || 0;
        const current = parseInt(elQuickCaloriesInput.value, 10) || 0;
        elQuickCaloriesInput.value = current + add;
      });
    });

    // Settings Macro Presets
    document.getElementById('preset-weight-loss').addEventListener('click', () => {
      setSettingsFormValues(1600, 140, 140, 50);
    });
    document.getElementById('preset-maintenance').addEventListener('click', () => {
      setSettingsFormValues(2000, 140, 220, 65);
    });
    document.getElementById('preset-muscle-gain').addEventListener('click', () => {
      setSettingsFormValues(2600, 180, 310, 75);
    });
    document.getElementById('preset-keto').addEventListener('click', () => {
      setSettingsFormValues(1800, 120, 35, 130);
    });

    // Form Submissions
    elFoodForm.addEventListener('submit', handleFoodFormSubmit);
    elQuickAddForm.addEventListener('submit', handleQuickAddSubmit);
    elSettingsForm.addEventListener('submit', handleSettingsFormSubmit);

    // Data Storage Tools
    elExportDataBtn.addEventListener('click', exportData);
    elImportDataInput.addEventListener('change', importData);
    elClearAllDataBtn.addEventListener('click', clearAllData);
  }

  // --- Date Helpers ---
  function getFormattedDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseDateString(str) {
    const parts = str.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function changeDate(delta) {
    const d = parseDateString(currentDate);
    d.setDate(d.getDate() + delta);
    currentDate = getFormattedDate(d);
    updateDateDisplay();
    renderAll();
  }

  function updateDateDisplay() {
    elDatePicker.value = currentDate;
    const selectedDate = parseDateString(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((checkDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      elDateLabel.textContent = 'Today';
    } else if (diffDays === -1) {
      elDateLabel.textContent = 'Yesterday';
    } else if (diffDays === 1) {
      elDateLabel.textContent = 'Tomorrow';
    } else {
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      elDateLabel.textContent = selectedDate.toLocaleDateString(undefined, options);
    }
  }

  function getCurrentTimeString() {
    const d = new Date();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  function generateId() {
    return 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  // --- Storage Functions ---
  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return raw ? Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw)) : Object.assign({}, DEFAULT_SETTINGS);
    } catch (e) {
      console.error('Error loading settings', e);
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }

  function loadEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ENTRIES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error loading entries', e);
      return [];
    }
  }

  function saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Error saving entries', e);
    }
  }

  // --- Core Rendering Functions ---
  function renderAll() {
    renderDashboardSummary();
    renderMealBlocks();
  }

  function getEntriesForCurrentDate() {
    return entries.filter(item => item.date === currentDate);
  }

  function renderDashboardSummary() {
    const dayEntries = getEntriesForCurrentDate();

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    dayEntries.forEach(item => {
      totalCalories += Number(item.calories) || 0;
      totalProtein += Number(item.protein) || 0;
      totalCarbs += Number(item.carbs) || 0;
      totalFat += Number(item.fat) || 0;
    });

    const goal = settings.dailyGoal || 2000;
    const remaining = goal - totalCalories;
    const burnPct = Math.round((totalCalories / goal) * 100);

    // Update Calorie Display Numbers
    elGoalCaloriesDisplay.textContent = goal.toLocaleString();
    elConsumedCaloriesDisplay.textContent = totalCalories.toLocaleString();
    elPercentageDisplay.textContent = `${burnPct}%`;

    if (remaining >= 0) {
      elRemainingCalories.textContent = remaining.toLocaleString();
      elRemainingLabel.textContent = 'kcal left';
      elCalorieStatusBadge.textContent = burnPct >= 85 ? 'Near Target' : 'On Track';
      elCalorieStatusBadge.className = burnPct >= 85 ? 'badge badge-warning' : 'badge badge-normal';
      elProgressCircle.style.stroke = burnPct >= 85 ? '#f59e0b' : '#10b981';
    } else {
      elRemainingCalories.textContent = Math.abs(remaining).toLocaleString();
      elRemainingLabel.textContent = 'kcal over budget';
      elCalorieStatusBadge.textContent = 'Over Budget';
      elCalorieStatusBadge.className = 'badge badge-over';
      elProgressCircle.style.stroke = '#ef4444';
    }

    // Circular Gauge Animation
    const strokeRatio = Math.min(totalCalories / goal, 1);
    const strokeOffset = RING_CIRCUMFERENCE - (strokeRatio * RING_CIRCUMFERENCE);
    elProgressCircle.style.strokeDashoffset = strokeOffset;

    // Macros Calculation
    const proteinTarget = settings.proteinGoal || 140;
    const carbsTarget = settings.carbsGoal || 220;
    const fatTarget = settings.fatGoal || 65;

    elProteinConsumed.textContent = Math.round(totalProtein);
    elProteinTarget.textContent = proteinTarget;
    const pPct = Math.min(Math.round((totalProtein / proteinTarget) * 100), 100);
    elProteinPct.textContent = `${pPct}%`;
    elProteinBar.style.width = `${pPct}%`;

    elCarbsConsumed.textContent = Math.round(totalCarbs);
    elCarbsTarget.textContent = carbsTarget;
    const cPct = Math.min(Math.round((totalCarbs / carbsTarget) * 100), 100);
    elCarbsPct.textContent = `${cPct}%`;
    elCarbsBar.style.width = `${cPct}%`;

    elFatConsumed.textContent = Math.round(totalFat);
    elFatTarget.textContent = fatTarget;
    const fPct = Math.min(Math.round((totalFat / fatTarget) * 100), 100);
    elFatPct.textContent = `${fPct}%`;
    elFatBar.style.width = `${fPct}%`;

    // Macro Energy Distribution
    const proteinKcal = totalProtein * 4;
    const carbsKcal = totalCarbs * 4;
    const fatKcal = totalFat * 9;
    const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

    elMacroCaloriesCalc.textContent = `${Math.round(totalMacroKcal).toLocaleString()} kcal from macros`;

    if (totalMacroKcal > 0) {
      const pRatio = Math.round((proteinKcal / totalMacroKcal) * 100);
      const cRatio = Math.round((carbsKcal / totalMacroKcal) * 100);
      const fRatio = Math.max(0, 100 - pRatio - cRatio);

      elRatioProtein.style.width = `${pRatio}%`;
      elRatioCarbs.style.width = `${cRatio}%`;
      elRatioFat.style.width = `${fRatio}%`;

      elRatioProteinText.textContent = `Protein: ${pRatio}%`;
      elRatioCarbsText.textContent = `Carbs: ${cRatio}%`;
      elRatioFatText.textContent = `Fats: ${fRatio}%`;
    } else {
      elRatioProtein.style.width = '33.3%';
      elRatioCarbs.style.width = '33.3%';
      elRatioFat.style.width = '33.4%';

      elRatioProteinText.textContent = 'Protein: 0%';
      elRatioCarbsText.textContent = 'Carbs: 0%';
      elRatioFatText.textContent = 'Fats: 0%';
    }
  }

  function renderMealBlocks() {
    const dayEntries = getEntriesForCurrentDate();
    let totalVisibleItems = 0;

    const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

    meals.forEach(mealType => {
      const config = mealBlocks[mealType];
      if (!config) return;

      // Filter by meal tab
      const isVisibleCategory = (currentFilter === 'all' || currentFilter === mealType);
      config.block.style.display = isVisibleCategory ? 'block' : 'none';

      // Meal items for this day
      let mealItems = dayEntries.filter(item => item.mealType === mealType);

      // Search query filtering
      if (searchQuery) {
        mealItems = mealItems.filter(item => item.name.toLowerCase().includes(searchQuery));
      }

      // Calculations for this meal
      let mealCalories = 0;
      mealItems.forEach(i => {
        mealCalories += Number(i.calories) || 0;
      });

      config.count.textContent = `${mealItems.length} ${mealItems.length === 1 ? 'item' : 'items'}`;
      config.calories.textContent = mealCalories.toLocaleString();

      // Render Item Rows
      config.items.innerHTML = '';
      if (mealItems.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'empty-meal-placeholder';
        placeholder.textContent = searchQuery ? 'No items match your search.' : `No items logged for ${mealType.toLowerCase()} yet.`;
        config.items.appendChild(placeholder);
      } else {
        totalVisibleItems += mealItems.length;
        mealItems.forEach(item => {
          config.items.appendChild(createMealItemRow(item));
        });
      }
    });

    // Check Day Empty State
    if (dayEntries.length === 0 && !searchQuery) {
      elDayEmptyState.classList.remove('hidden');
    } else {
      elDayEmptyState.classList.add('hidden');
    }
  }

  function createMealItemRow(item) {
    const row = document.createElement('div');
    row.className = 'meal-item-row';
    row.dataset.id = item.id;

    // Macro tags markup if provided
    let macroTagsHtml = '';
    const p = Number(item.protein) || 0;
    const c = Number(item.carbs) || 0;
    const f = Number(item.fat) || 0;

    if (p > 0) macroTagsHtml += `<span class="macro-tag tag-protein">P: ${p}g</span>`;
    if (c > 0) macroTagsHtml += `<span class="macro-tag tag-carbs">C: ${c}g</span>`;
    if (f > 0) macroTagsHtml += `<span class="macro-tag tag-fat">F: ${f}g</span>`;

    row.innerHTML = `
      <div class="item-left">
        <span class="item-name">${escapeHtml(item.name)}</span>
        <div class="item-macros-tags">
          ${macroTagsHtml}
          <span class="item-time">${escapeHtml(item.time || '')}</span>
        </div>
      </div>
      <div class="item-right">
        <span class="item-calories-badge">${Number(item.calories).toLocaleString()} kcal</span>
        <div class="item-action-btns">
          <button class="btn-item-action btn-item-edit" title="Edit food entry">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-item-action btn-item-delete" title="Delete entry">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Event listeners on item action buttons
    row.querySelector('.btn-item-edit').addEventListener('click', () => {
      openFoodModal(item);
    });

    row.querySelector('.btn-item-delete').addEventListener('click', () => {
      deleteFoodItem(item.id);
    });

    return row;
  }

  // --- Food Modal Handling ---
  function openFoodModal(entryToEdit = null, defaultMeal = null) {
    elFoodForm.reset();

    if (entryToEdit) {
      elModalTitle.textContent = 'Edit Food Item';
      elEntryIdInput.value = entryToEdit.id;
      elFoodNameInput.value = entryToEdit.name;
      elFoodMealSelect.value = entryToEdit.mealType;
      elFoodCaloriesInput.value = entryToEdit.calories;
      elFoodProteinInput.value = entryToEdit.protein || '';
      elFoodCarbsInput.value = entryToEdit.carbs || '';
      elFoodFatInput.value = entryToEdit.fat || '';
    } else {
      elModalTitle.textContent = 'Log Food Item';
      elEntryIdInput.value = '';
      if (defaultMeal) {
        elFoodMealSelect.value = defaultMeal;
      }
    }

    elFoodModal.classList.remove('hidden');
    elFoodNameInput.focus();
  }

  function closeFoodModal() {
    elFoodModal.classList.add('hidden');
    elFoodForm.reset();
  }

  function handleFoodFormSubmit(e) {
    e.preventDefault();

    const id = elEntryIdInput.value;
    const name = elFoodNameInput.value.trim();
    const mealType = elFoodMealSelect.value;
    const calories = Math.max(0, parseInt(elFoodCaloriesInput.value, 10) || 0);
    const protein = Math.max(0, parseFloat(elFoodProteinInput.value) || 0);
    const carbs = Math.max(0, parseFloat(elFoodCarbsInput.value) || 0);
    const fat = Math.max(0, parseFloat(elFoodFatInput.value) || 0);

    if (!name) {
      showToast('Please provide a food name', 'danger');
      return;
    }

    if (id) {
      // Edit existing entry
      const index = entries.findIndex(i => i.id === id);
      if (index !== -1) {
        entries[index].name = name;
        entries[index].mealType = mealType;
        entries[index].calories = calories;
        entries[index].protein = protein;
        entries[index].carbs = carbs;
        entries[index].fat = fat;
        showToast(`Updated "${name}"`, 'success');
      }
    } else {
      // Add new entry
      const newEntry = {
        id: generateId(),
        date: currentDate,
        name: name,
        mealType: mealType,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        time: getCurrentTimeString()
      };
      entries.unshift(newEntry);
      showToast(`Logged "${name}" (${calories} kcal)`, 'success');
    }

    saveEntries();
    closeFoodModal();
    renderAll();
  }

  function deleteFoodItem(id) {
    const itemToDelete = entries.find(i => i.id === id);
    if (!itemToDelete) return;

    entries = entries.filter(i => i.id !== id);
    saveEntries();
    renderAll();
    showToast(`Removed "${itemToDelete.name}"`, 'info');
  }

  // --- Quick Add Modal Handling ---
  function openQuickAddModal() {
    elQuickAddForm.reset();
    elQuickAddModal.classList.remove('hidden');
    elQuickCaloriesInput.focus();
  }

  function closeQuickAddModal() {
    elQuickAddModal.classList.add('hidden');
    elQuickAddForm.reset();
  }

  function handleQuickAddSubmit(e) {
    e.preventDefault();
    const calories = parseInt(elQuickCaloriesInput.value, 10) || 0;
    const meal = elQuickMealSelect.value || 'Snacks';
    const note = elQuickNoteInput.value.trim();
    const name = note ? `Quick Calorie (${note})` : 'Quick Calorie Entry';

    if (calories <= 0) {
      showToast('Please enter a valid calorie amount', 'danger');
      return;
    }

    const newEntry = {
      id: generateId(),
      date: currentDate,
      name: name,
      mealType: meal,
      calories: calories,
      protein: 0,
      carbs: 0,
      fat: 0,
      time: getCurrentTimeString()
    };

    entries.unshift(newEntry);
    saveEntries();
    closeQuickAddModal();
    renderAll();
    showToast(`Added +${calories} kcal to ${meal}`, 'success');
  }

  // --- Settings Modal Handling ---
  function openSettingsModal() {
    elSettingsGoalInput.value = settings.dailyGoal;
    elSettingsProteinInput.value = settings.proteinGoal;
    elSettingsCarbsInput.value = settings.carbsGoal;
    elSettingsFatInput.value = settings.fatGoal;
    elSettingsModal.classList.remove('hidden');
  }

  function closeSettingsModal() {
    elSettingsModal.classList.add('hidden');
  }

  function setSettingsFormValues(goal, p, c, f) {
    elSettingsGoalInput.value = goal;
    elSettingsProteinInput.value = p;
    elSettingsCarbsInput.value = c;
    elSettingsFatInput.value = f;
  }

  function handleSettingsFormSubmit(e) {
    e.preventDefault();
    const goal = parseInt(elSettingsGoalInput.value, 10);
    const p = parseInt(elSettingsProteinInput.value, 10);
    const c = parseInt(elSettingsCarbsInput.value, 10);
    const f = parseInt(elSettingsFatInput.value, 10);

    if (isNaN(goal) || goal < 500) {
      showToast('Please specify a daily goal of at least 500 kcal', 'danger');
      return;
    }

    settings.dailyGoal = goal;
    if (!isNaN(p) && p > 0) settings.proteinGoal = p;
    if (!isNaN(c) && c > 0) settings.carbsGoal = c;
    if (!isNaN(f) && f > 0) settings.fatGoal = f;

    saveSettings();
    closeSettingsModal();
    renderAll();
    showToast('Nutritional targets updated successfully!', 'success');
  }

  // --- Export, Import, & Reset ---
  function exportData() {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: settings,
      entries: entries
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutritrack-backup-${currentDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Backup data exported to file', 'success');
  }

  function importData(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && Array.isArray(imported.entries)) {
          entries = imported.entries;
          if (imported.settings && imported.settings.dailyGoal) {
            settings = Object.assign({}, DEFAULT_SETTINGS, imported.settings);
            saveSettings();
          }
          saveEntries();
          renderAll();
          closeSettingsModal();
          showToast(`Successfully imported ${entries.length} entries!`, 'success');
        } else {
          showToast('Invalid backup file format.', 'danger');
        }
      } catch (err) {
        console.error('Import parse error', err);
        showToast('Could not parse JSON file.', 'danger');
      }
      elImportDataInput.value = ''; // Reset input
    };
    reader.readAsText(file);
  }

  function clearAllData() {
    const confirmed = window.confirm('Are you sure you want to clear all your tracked meals and reset settings? This action cannot be undone.');
    if (confirmed) {
      localStorage.removeItem(STORAGE_KEY_ENTRIES);
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
      entries = [];
      settings = Object.assign({}, DEFAULT_SETTINGS);
      renderAll();
      closeSettingsModal();
      showToast('All data has been reset.', 'info');
    }
  }

  // --- Toast Notification Helper ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    elToastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3200);
  }

  // --- HTML Escaping Helper ---
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start the application
  document.addEventListener('DOMContentLoaded', init);

})();
