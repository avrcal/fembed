// Helper to get query param string
function paramsToQuery(params) {
  const esc = encodeURIComponent;
  return Object.entries(params)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        // For fields
        return v.map(item => `${esc(k)}=${esc(item)}`).join('&');
      }
      return `${esc(k)}=${esc(v)}`;
    })
    .join('&');
}

function getEmbedParams() {
  const title = document.getElementById('embed-title').value.trim();
  const author = document.getElementById('embed-author').value.trim();
  const description = document.getElementById('embed-description').value.trim();
  // Fields
  const fieldNames = Array.from(document.querySelectorAll('.field-name')).map(el => el.value.trim());
  const fieldValues = Array.from(document.querySelectorAll('.field-value')).map(el => el.value.trim());
  const fields = [];
  for (let i = 0; i < fieldNames.length; i++) {
    if (fieldNames[i] || fieldValues[i]) {
      fields.push({ name: fieldNames[i], value: fieldValues[i] });
    }
  }
  return { title, author, description, fields };
}

function renderPreview() {
  const { title, author, description, fields } = getEmbedParams();
  const preview = document.getElementById('embed-preview');
  preview.innerHTML = '';
  if (author) {
    const authorDiv = document.createElement('div');
    authorDiv.className = 'embed-author';
    authorDiv.textContent = author;
    preview.appendChild(authorDiv);
  }
  if (title) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'embed-title';
    titleDiv.textContent = title;
    preview.appendChild(titleDiv);
  }
  if (description) {
    const descDiv = document.createElement('div');
    descDiv.className = 'embed-description';
    descDiv.textContent = description;
    preview.appendChild(descDiv);
  }
  if (fields.length > 0) {
    const fieldsDiv = document.createElement('div');
    fieldsDiv.className = 'embed-fields';
    fields.forEach(field => {
      if (!field.name && !field.value) return;
      const fieldDiv = document.createElement('div');
      fieldDiv.className = 'embed-field';
      if (field.name) {
        const nameDiv = document.createElement('div');
        nameDiv.className = 'embed-field-name';
        nameDiv.textContent = field.name;
        fieldDiv.appendChild(nameDiv);
      }
      if (field.value) {
        const valueDiv = document.createElement('div');
        valueDiv.className = 'embed-field-value';
        valueDiv.textContent = field.value;
        fieldDiv.appendChild(valueDiv);
      }
      fieldsDiv.appendChild(fieldDiv);
    });
    preview.appendChild(fieldsDiv);
  }
  if (!author && !title && !description && fields.length === 0) {
    preview.innerHTML = '<span style="color:#72767d;">Nothing to preview yet.</span>';
  }
}

// Dynamically update meta tags in head (for human preview only)
function updateMetaTags({ title, author, description }) {
  // Fallback image
  const image = "https://i.imgur.com/8Km9tLL.png";
  function setMeta(name, value, isProperty = true) {
    let tag = document.querySelector(`${isProperty ? 'meta[property' : 'meta[name]'}="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(isProperty ? "property" : "name", name);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", value);
  }

  setMeta("og:title", title || "Fake Discord Embed Generator");
  setMeta("og:description", description || "Create a fake Discord embed and preview it.");
  setMeta("og:image", image);
  setMeta("og:type", "website");
  setMeta("twitter:title", title || "Fake Discord Embed Generator", false);
  setMeta("twitter:description", description || "Create a fake Discord embed and preview it.", false);
  setMeta("twitter:image", image, false);
  setMeta("twitter:card", "summary_large_image", false);
  if (author) setMeta("og:author", author);
}

function updateFieldsList() {
  const fieldsList = document.getElementById('fields-list');
  const fieldRows = Array.from(document.querySelectorAll('.field-row'));
  fieldsList.innerHTML = '';
  fieldRows.forEach(row => fieldsList.appendChild(row));
}

function addField(name = '', value = '') {
  const row = document.createElement('div');
  row.className = 'field-row';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Field Name';
  nameInput.className = 'field-name';
  nameInput.value = name;
  nameInput.maxLength = 256;

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.placeholder = 'Field Value';
  valueInput.className = 'field-value';
  valueInput.value = value;
  valueInput.maxLength = 1024;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-field-btn';
  removeBtn.title = 'Remove Field';
  removeBtn.textContent = '×';
  removeBtn.onclick = () => {
    row.remove();
    renderPreview();
  };

  nameInput.addEventListener('input', renderPreview);
  valueInput.addEventListener('input', renderPreview);

  row.appendChild(nameInput);
  row.appendChild(valueInput);
  row.appendChild(removeBtn);

  document.getElementById('fields-list').appendChild(row);
}

document.getElementById('add-field-btn').onclick = () => {
  addField();
};

['embed-title', 'embed-author', 'embed-description'].forEach(id => {
  document.getElementById(id).addEventListener('input', renderPreview);
});

document.getElementById('embed-form').addEventListener('submit', e => {
  e.preventDefault();
});

// On page load, add an initial empty field row
addField();
renderPreview();

document.getElementById('create-btn').onclick = function() {
  const { title, author, description, fields } = getEmbedParams();
  // Build query
  let params = {};
  if (title) params.title = title;
  if (author) params.author = author;
  if (description) params.description = description;
  if (fields.length > 0) {
    // Save as fields[]=name|value
    params.fields = fields.map(f => `${f.name}|${f.value}`);
  }
  // Use current site as the base link
  const baseLink = `${window.location.origin}${window.location.pathname}`;
  const url = `${baseLink}?${paramsToQuery(params)}`;

  document.getElementById('embed-link').value = url;
  document.getElementById('link-section').style.display = '';
};

document.getElementById('copy-link-btn').onclick = function() {
  const link = document.getElementById('embed-link');
  link.select();
  link.setSelectionRange(0, 99999);
  document.execCommand('copy');
  this.textContent = 'Copied!';
  setTimeout(() => this.textContent = 'Copy Link', 1200);
};

// On page load, if there are query params, show preview and update meta tags
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const title = params.get('title') || '';
  const author = params.get('author') || '';
  const description = params.get('description') || '';
  const fieldsArr = params.getAll('fields');
  document.getElementById('embed-title').value = title;
  document.getElementById('embed-author').value = author;
  document.getElementById('embed-description').value = description;
  // Remove existing fields
  document.querySelectorAll('.field-row').forEach(row => row.remove());
  if (fieldsArr.length > 0) {
    fieldsArr.forEach(f => {
      const [name, value] = f.split('|');
      addField(name || '', value || '');
    });
  } else {
    addField();
  }
  renderPreview();
  updateMetaTags({ title, author, description });
});
