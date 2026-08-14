/**
 * StyleAI - 페이지 간 공통 로직
 *
 * 입력 → 업로드 → 결과 세 페이지가 sessionStorage 하나를 공유합니다.
 * 클래식 스크립트로 두어 <script src> 한 줄이면 어느 페이지에서든 쓸 수 있습니다.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'styleai.session';

  // Gemini는 이미지를 768px 타일로 쪼개 타일당 과금합니다.
  // 긴 변 1024px이면 실루엣 판독에는 충분하면서 타일 수를 2~3장으로 묶어둘 수 있습니다.
  var MAX_EDGE = 1024;
  var MAX_FILE_BYTES = 10 * 1024 * 1024;
  var JPEG_QUALITY = 0.85;

  var LIMITS = {
    height: { min: 50, max: 300, required: '키를 입력해 주세요.' },
    weight: { min: 20, max: 300, required: '몸무게를 입력해 주세요.' }
  };

  /* ---------- 세션 ---------- */

  function load() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function save(patch) {
    var next = Object.assign(load(), patch);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      throw new Error('사진을 저장하지 못했습니다. 더 작은 파일로 시도해 주세요.');
    }
    return next;
  }

  function clear() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /* ---------- 검증 ---------- */

  /** 통과하면 null, 실패하면 사람이 읽을 에러 메시지를 돌려줍니다. */
  function validateField(name, raw) {
    var limit = LIMITS[name];
    if (!limit) return null;

    var value = String(raw == null ? '' : raw).trim();
    if (!value) return limit.required;

    var num = Number(value);
    if (!isFinite(num)) return '숫자만 입력할 수 있습니다.';
    if (num < limit.min || num > limit.max) {
      return limit.min + ' ~ ' + limit.max + ' 사이로 입력해 주세요.';
    }
    return null;
  }

  /** 에러 문구를 표시하거나(message) 지웁니다(null). */
  function setError(el, message) {
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('hidden', !message);
  }

  /* ---------- 이미지 ---------- */

  /**
   * 파일을 검증하고 긴 변 1024px JPEG으로 줄여 base64로 돌려줍니다.
   * 실패 시 사용자에게 그대로 보여줄 수 있는 메시지로 reject 합니다.
   */
  function readImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('사진을 선택해 주세요.'));
      if (!/^image\//.test(file.type)) {
        return reject(new Error('이미지 파일만 업로드할 수 있습니다.'));
      }
      if (file.size > MAX_FILE_BYTES) {
        return reject(new Error('10MB 이하의 사진을 올려주세요.'));
      }

      var reader = new FileReader();
      reader.onerror = function () {
        reject(new Error('사진을 읽지 못했습니다.'));
      };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () {
          reject(new Error('사진을 열지 못했습니다. 다른 파일을 시도해 주세요.'));
        };
        img.onload = function () {
          try {
            resolve(toResizedJpeg(img));
          } catch (e) {
            reject(new Error('사진을 처리하지 못했습니다.'));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function toResizedJpeg(img) {
    var scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    var w = Math.max(1, Math.round(img.width * scale));
    var h = Math.max(1, Math.round(img.height * scale));

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    var ctx = canvas.getContext('2d');
    // 투명 PNG가 검게 변하지 않도록 흰 배경을 먼저 깝니다.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    var dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    return {
      // dataUrl은 저장하지 않습니다 — base64와 중복이라 세션 용량이 두 배가 됩니다.
      base64: dataUrl.slice(dataUrl.indexOf(',') + 1),
      mimeType: 'image/jpeg',
      width: w,
      height: h
    };
  }

  /** 저장된 사진을 <img src>에 넣을 수 있는 형태로 되돌립니다. */
  function toDataUrl(photo) {
    if (!photo || !photo.base64) return '';
    return 'data:' + (photo.mimeType || 'image/jpeg') + ';base64,' + photo.base64;
  }

  global.StyleAI = {
    load: load,
    save: save,
    clear: clear,
    validateField: validateField,
    setError: setError,
    readImage: readImage,
    toDataUrl: toDataUrl,
    MAX_FILE_BYTES: MAX_FILE_BYTES
  };
})(window);
