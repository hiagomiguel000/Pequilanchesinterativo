/* Configuração e funções compartilhadas pelas três páginas. */
window.APP = (function () {
  // Projeto Supabase (a chave publicável é feita para ficar no site; a segurança está nas regras do banco).
  var SUPABASE_URL = 'https://czyvckoqxoyzgqhqluwt.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_jAuXfCr_OYiel6NBnkPJNA_7UmedRk8';
  var LOJA_PADRAO = 'pequi-lanches';

  var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  function $(id) { return document.getElementById(id); }
  function fmt(v) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function semAcento(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function slugAtual() {
    var p = new URLSearchParams(location.search).get('loja');
    return p && /^[a-z0-9-]{3,40}$/.test(p) ? p : LOJA_PADRAO;
  }
  function iniciais(nome) {
    var p = String(nome || '').trim().split(/\s+/);
    return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }
  function numBonito(d) {
    d = String(d || '').replace(/\D/g, '');
    if (d.length === 13 && d.indexOf('55') === 0) return '(' + d.slice(2, 4) + ') ' + d.slice(4, 5) + ' ' + d.slice(5, 9) + '-' + d.slice(9);
    if (d.length === 12 && d.indexOf('55') === 0) return '(' + d.slice(2, 4) + ') ' + d.slice(4, 8) + '-' + d.slice(8);
    if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 3) + ' ' + d.slice(3, 7) + '-' + d.slice(7);
    return d;
  }
  function linkWhats(numero, texto) {
    var d = String(numero || '').replace(/\D/g, '');
    if (d.length === 10 || d.length === 11) d = '55' + d;
    return 'https://wa.me/' + d + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }

  // ---------- Pix (padrão BR Code do Banco Central) ----------
  function tlv(id, valor) { return id + String(valor.length).padStart(2, '0') + valor; }
  function crc16(s) {
    var crc = 0xFFFF;
    for (var i = 0; i < s.length; i++) {
      crc ^= s.charCodeAt(i) << 8;
      for (var j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  function limpaPix(s, max) { return semAcento(s).toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().slice(0, max); }
  function pixPayload(loja, valor, txid) {
    var conta = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', loja.pix_chave);
    var p = tlv('00', '01') + tlv('26', conta) + tlv('52', '0000') + tlv('53', '986') +
      tlv('54', Number(valor).toFixed(2)) + tlv('58', 'BR') +
      tlv('59', limpaPix(loja.pix_nome || loja.nome, 25) || 'LOJA') +
      tlv('60', limpaPix(loja.pix_cidade || 'BRASIL', 15) || 'BRASIL') +
      tlv('62', tlv('05', String(txid || '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***')) + '6304';
    return p + crc16(p);
  }
  function qrSvg(texto) {
    if (typeof window.qrcode !== 'function') return '';
    var qr = window.qrcode(0, 'M');
    qr.addData(texto);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true });
  }

  // ---------- Aviso rápido na tela ----------
  var timer;
  function aviso(texto) {
    var el = $('toast');
    if (!el) return;
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(function () { el.hidden = true; }, 3400);
  }
  function copiar(texto, campoReserva, msgOk) {
    var reserva = function () {
      if (!campoReserva) return;
      campoReserva.hidden = false;
      campoReserva.value = texto;
      campoReserva.focus();
      campoReserva.select();
      aviso('Texto selecionado. Toque e segure para copiar.');
    };
    try {
      navigator.clipboard.writeText(texto).then(function () { aviso(msgOk || 'Copiado.'); }, reserva);
    } catch (e) { reserva(); }
  }

  function guardar(chave, valor) { try { localStorage.setItem(chave, valor); } catch (e) {} }
  function ler(chave) { try { return localStorage.getItem(chave); } catch (e) { return null; } }

  var STATUS = {
    recebido: 'Recebido', preparo: 'Em preparo', saiu: 'Saiu para entrega',
    pronto: 'Pronto para retirar', concluido: 'Concluído', cancelado: 'Cancelado'
  };
  var PAGAMENTO = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão (maquininha)' };

  return {
    db: db, $: $, fmt: fmt, esc: esc, semAcento: semAcento, slugAtual: slugAtual, iniciais: iniciais,
    numBonito: numBonito, linkWhats: linkWhats, pixPayload: pixPayload, qrSvg: qrSvg,
    aviso: aviso, copiar: copiar, guardar: guardar, ler: ler, STATUS: STATUS, PAGAMENTO: PAGAMENTO
  };
})();
