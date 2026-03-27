/**
 * PoB Codec — Path of Building build code encoder/decoder
 * Handles base64url + deflate encoding used by PoB build codes
 * and pobb.in URL fetching.
 */
const PobCodec = (() => {

  /** Decode a PoB build code (base64url + deflate) → XML string */
  async function decode(pobCode) {
    const b64 = _toBase64(pobCode.trim());
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return _decompress(bytes);
  }

  /** Encode XML string → PoB build code (base64url) */
  async function encode(xmlString) {
    const compressed = await _compress(xmlString);
    const b64 = btoa(String.fromCharCode(...compressed));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /** Fetch raw PoB code from a pobb.in URL */
  async function fetchFromPobbIn(url) {
    const clean = url.split('?')[0].replace(/\/+$/, '');
    const rawUrl = clean.endsWith('/raw') ? clean : `${clean}/raw`;
    const resp = await fetch(rawUrl);
    if (!resp.ok) throw new Error(`pobb.in fetch failed: ${resp.status}`);
    return (await resp.text()).trim();
  }

  /**
   * Swap an item in a PoB build code.
   * Decodes the code, replaces the item in the given slot, re-encodes.
   * @param {string} pobCode - Current base64url build code
   * @param {string} slotName - PoB slot name
   * @param {string} newItemText - PoB-format item text
   * @returns {Promise<string>} New base64url build code
   */
  async function swapItemInBuild(pobCode, slotName, newItemText) {
    const xml = await decode(pobCode);
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('Failed to parse PoB XML');

    const itemsEl = doc.querySelector('Items');
    if (!itemsEl) throw new Error('PoB XML missing Items section');

    const activeSetId = itemsEl.getAttribute('activeItemSet') || '1';
    let activeSet = itemsEl.querySelector(`ItemSet[id="${activeSetId}"]`) || itemsEl.querySelector('ItemSet');

    const sel = `Slot[name="${slotName.replace(/"/g, '\\"')}"]`;
    let slotEl = (activeSet && activeSet.querySelector(sel)) || itemsEl.querySelector(sel);
    const itemId = slotEl ? parseInt(slotEl.getAttribute('itemId') || '0') : 0;

    if (itemId > 0) {
      const itemEl = itemsEl.querySelector(`Item[id="${itemId}"]`);
      if (itemEl) {
        while (itemEl.firstChild) itemEl.removeChild(itemEl.firstChild);
        itemEl.appendChild(doc.createTextNode('\n' + newItemText + '\n'));
      }
    } else {
      const allItems = itemsEl.querySelectorAll('Item');
      const maxId = Array.from(allItems).reduce((m, el) => Math.max(m, parseInt(el.getAttribute('id') || '0')), 0);
      const newId = maxId + 1;
      const newItemEl = doc.createElement('Item');
      newItemEl.setAttribute('id', String(newId));
      newItemEl.appendChild(doc.createTextNode('\n' + newItemText + '\n'));
      const firstSet = itemsEl.querySelector('ItemSet');
      itemsEl.insertBefore(newItemEl, firstSet || null);

      if (slotEl) {
        slotEl.setAttribute('itemId', String(newId));
      } else if (activeSet) {
        const newSlot = doc.createElement('Slot');
        newSlot.setAttribute('name', slotName);
        newSlot.setAttribute('itemId', String(newId));
        activeSet.appendChild(newSlot);
      }
    }

    return encode(new XMLSerializer().serializeToString(doc));
  }

  // ── Private helpers ──

  function _toBase64(code) {
    let b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    return b64;
  }

  async function _decompress(bytes) {
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const reader = ds.readable.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const total = chunks.reduce((a, c) => a + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) { result.set(c, offset); offset += c.length; }
    return new TextDecoder().decode(result);
  }

  async function _compress(str) {
    const bytes = new TextEncoder().encode(str);
    const cs = new CompressionStream('deflate');
    const writer = cs.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const reader = cs.readable.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const total = chunks.reduce((a, c) => a + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) { result.set(c, offset); offset += c.length; }
    return result;
  }

  return { decode, encode, fetchFromPobbIn, swapItemInBuild };
})();

if (typeof module !== 'undefined') module.exports = PobCodec;
