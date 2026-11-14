/* Grove — Step 1 extraction. Relocated as-is from the original single-file artifact.
   No logic changed in this step; persistence still uses window.storage (Claude artifact API)
   pending Step 2 (IndexedDB migration). */

/* ================= BOOT ================= */
(async function init(){
  await loadAll();
  await dailyRollover();
  if(!location.hash) location.hash = '#dashboard';
  route();
})();
