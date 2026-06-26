/**
 * fundraiser-create-form.js
 * Campaign form builder logic (moved from shared fundraiser-form.js).
 */
(function(){
  "use strict";

  const MAX_FIELDS = 20;
  const MIN_FIELDS = 5;
  const FIELDS_PER_QUADRANT = 5;

  const FIELD_TYPES = [
    { value: 'text',     label: 'Text' },
    { value: 'email',    label: 'Email' },
    { value: 'number',   label: 'Number' },
    { value: 'date',     label: 'Date' },
    { value: 'time',     label: 'Time' },
    { value: 'file',     label: 'File Upload' },
    { value: 'tel',      label: 'Phone Number' }
  ];

  let fields = [];
  let flatpickrInstances = [];

  const quadrant1 = document.getElementById('quadrant1');
  const quadrant2 = document.getElementById('quadrant2');
  const quadrant3 = document.getElementById('quadrant3');
  const quadrant4 = document.getElementById('quadrant4');
  const verticalDivider1 = document.getElementById('verticalDivider1');
  const verticalDivider2 = document.getElementById('verticalDivider2');
  const horizontalDivider = document.getElementById('horizontalDivider');
  const addButton = document.getElementById('addFieldBtn');
  const confirmButton = document.getElementById('confirmFormBtn');
  const countDisplay = document.getElementById('fieldCountDisplay');
  const targetNumberInput = document.getElementById('requestersTargetNumber');

  const quadrants = [quadrant1, quadrant2, quadrant3, quadrant4];

  function getFundraiserId() {
    const el = document.getElementById('page-data');
    return el?.dataset.fundraiserId || '';
  }

  function initFlatpickr(input, type) {
    if (type === 'date') {
      const fp = flatpickr(input, {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        allowInput: true,
        placeholder: "Select date..."
      });
      flatpickrInstances.push(fp);
      return fp;
    } else if (type === 'time') {
      const fp = flatpickr(input, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        allowInput: true,
        placeholder: "Select time..."
      });
      flatpickrInstances.push(fp);
      return fp;
    }
    return null;
  }

  function applyInputBoxListeners() {
    const wrapper = document.getElementById('quadrantsWrapper');
    if (!wrapper) return;
    const boxes = wrapper.querySelectorAll('.input-box');
    boxes.forEach(box => {
      const inputField = box.querySelector('input, select');
      if (!inputField) return;
      if (inputField.value === '') box.classList.remove('field-is-filled');
      else box.classList.add('field-is-filled');

      inputField.addEventListener('focus', () => box.classList.add('input-box-active'));
      inputField.addEventListener('blur', () => {
        setTimeout(() => box.classList.remove('input-box-active'), 300);
      });
      inputField.addEventListener('input', () => {
        box.classList.toggle('field-is-filled', inputField.value !== '');
        const row = box.closest('.field-row');
        if (row) {
          const index = parseInt(row.dataset.index);
          if (fields[index]) {
            fields[index][inputField.dataset.property] = inputField.value;
          }
        }
        updateButtonsAndCounter();
        updateDividersVisibility();
      });
      if ((inputField.dataset.fieldType === 'date' || inputField.dataset.fieldType === 'time') && !inputField._flatpickr) {
        initFlatpickr(inputField, inputField.dataset.fieldType);
      }
    });
  }

  function updateButtonsAndCounter() {
    const total = fields.length;
    countDisplay.textContent = `${total} / ${MAX_FIELDS} fields · min ${MIN_FIELDS}`;
    let canAdd = total < MAX_FIELDS;
    if (total > 0) {
      const last = fields[total - 1];
      if (!last.name || last.name.trim() === '' || !last.type || last.type.trim() === '') canAdd = false;
    }
    addButton.disabled = !canAdd;
    const allFilled = fields.every(f => f.name && f.name.trim() !== '' && f.type && f.type.trim() !== '');
    const meetsMin = total >= MIN_FIELDS;
    const hasTarget = targetNumberInput.value && parseInt(targetNumberInput.value) > 0;
    confirmButton.disabled = !(meetsMin && allFilled && hasTarget);
  }

  function updateDividersVisibility() {
    const total = fields.length;
    verticalDivider1?.classList.toggle('visible', total > 5);
    horizontalDivider?.classList.toggle('visible', total > 10);
    verticalDivider2?.classList.toggle('visible', total > 15);
  }

  function renderFields() {
    quadrants.forEach(q => { if (q) q.innerHTML = ''; });
    for (let qIndex = 0; qIndex < 4; qIndex++) {
      const start = qIndex * FIELDS_PER_QUADRANT;
      const quadrantFields = fields.slice(start, start + FIELDS_PER_QUADRANT);
      const quadrantEl = quadrants[qIndex];
      quadrantFields.forEach((field, idx) => {
        const globalIndex = start + idx;
        const row = createFieldRow(field, globalIndex);
        quadrantEl.appendChild(row);
      });
    }
    document.querySelectorAll('#quadrantsWrapper input[data-field-type="date"]').forEach(input => {
      if (!input._flatpickr) initFlatpickr(input, 'date');
    });
    document.querySelectorAll('#quadrantsWrapper input[data-field-type="time"]').forEach(input => {
      if (!input._flatpickr) initFlatpickr(input, 'time');
    });
    applyInputBoxListeners();
    updateDividersVisibility();
    updateButtonsAndCounter();
  }

  function createFieldRow(field, index) {
    const row = document.createElement('div');
    row.className = 'field-row';
    row.dataset.index = index;

    const nameBox = document.createElement('div');
    nameBox.className = 'input-box';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Field name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = field.name || '';
    nameInput.dataset.fieldIndex = index;
    nameInput.dataset.property = 'name';
    nameBox.appendChild(nameLabel);
    nameBox.appendChild(nameInput);

    const typeBox = document.createElement('div');
    typeBox.className = 'input-box';
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Field type';
    const typeSelect = document.createElement('select');
    typeSelect.dataset.fieldIndex = index;
    typeSelect.dataset.property = 'type';
    FIELD_TYPES.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (field.type === opt.value) option.selected = true;
      typeSelect.appendChild(option);
    });
    typeBox.appendChild(typeLabel);
    typeBox.appendChild(typeSelect);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-field-btn';
    removeBtn.innerHTML = '−';
    removeBtn.dataset.index = index;
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fields.splice(parseInt(removeBtn.dataset.index), 1);
      renderFields();
    });

    row.appendChild(nameBox);
    row.appendChild(typeBox);
    row.appendChild(removeBtn);
    return row;
  }

  function addNewField() {
    if (fields.length >= MAX_FIELDS) return;
    if (fields.length > 0) {
      const last = fields[fields.length - 1];
      if (!last.name || last.name.trim() === '' || !last.type) {
        showFlashMessage('Please complete the previous field (name and type) before adding a new one.');
        return;
      }
    }
    fields.push({ name: '', type: 'text' });
    renderFields();
  }

  async function confirmForm() {
    if (fields.length < MIN_FIELDS) {
      showFlashMessage(`Minimum ${MIN_FIELDS} fields required.`);
      return;
    }
    const allFilled = fields.every(f => f.name.trim() && f.type);
    if (!allFilled) {
      showFlashMessage('Please fill all field names and types.');
      return;
    }
    const targetNumber = parseInt(targetNumberInput.value) || 1;
    const fundraiserId = getFundraiserId();

    try {
      confirmButton.disabled = true;
      confirmButton.textContent = 'Creating...';
      const response = await fetch(`/fundraiser-form/${fundraiserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema: fields,
          targetRequestersNumber: targetNumber
        })
      });
      const data = await response.json();
      if (data.success) {
        showFlashMessage('✅ Form created successfully!');
        window.location.href = '/userPanelIndigent?success=Form created successfully';
      } else {
        showFlashMessage('❌ ' + (data.error || 'Failed to create form'));
        confirmButton.disabled = false;
        confirmButton.textContent = '✓ Create form';
      }
    } catch (err) {
      console.error(err);
      showFlashMessage('❌ Error creating form');
      confirmButton.disabled = false;
      confirmButton.textContent = '✓ Create form';
    }
  }

  targetNumberInput.addEventListener('input', updateButtonsAndCounter);

  function init() {
    fields = Array.from({ length: MIN_FIELDS }, () => ({ name: '', type: 'text' }));
    renderFields();
    addButton.addEventListener('click', addNewField);
    confirmButton.addEventListener('click', confirmForm);
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('beforeunload', () => {
    flatpickrInstances.forEach(fp => fp.destroy());
  });
})();