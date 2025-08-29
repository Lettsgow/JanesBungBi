// Front-end logic for hoeshik Flask app

const tbody = document.getElementById("tbody");

// Hide 'preserveTotal' UI if present, since totals no longer need to match
const preserveEl = document.getElementById("preserveTotal");
if (preserveEl) {
  const wrap = preserveEl.closest('label') || preserveEl.closest('.row') || preserveEl.parentElement;
  if (wrap) wrap.style.display = "none";
}

const resultBody = document.getElementById("resultBody");
const summary = document.getElementById("summary");

document.getElementById("btnInit").addEventListener("click", ()=>{
  const n = prompt("총 참석자 수를 입력하세요 (예: 40)");
  const cnt = parseInt(n, 10);
  if(!n || isNaN(cnt) || cnt<=0){ return; }
  buildRows(cnt);
});

function buildRows(cnt){
  tbody.innerHTML = "";
  for(let i=0;i<cnt;i++){
    const tr = document.createElement("tr");
    const tdName = document.createElement("td"); const nameInput = document.createElement("input");
    nameInput.type = "text"; nameInput.value = `참가자${i+1}`; nameInput.style.width = "100%";
    nameInput.addEventListener('focus', ()=>{
      if(/^참가자\d+$/.test(nameInput.value||'')) nameInput.value='';
    });
    tdName.appendChild(nameInput); tr.appendChild(tdName);
    for(let j=0;j<4;j++){ const td = document.createElement("td"); td.className = "center";
      const cb = document.createElement("input"); cb.type = "checkbox"; cb.dataset.round = String(j+1);
      td.appendChild(cb); tr.appendChild(td); }
    tbody.appendChild(tr);
  }
}

function getRoundAmounts(){
  const a1 = parseInt(document.getElementById("amt1").value || "0",10) || 0;
  const a2 = parseInt(document.getElementById("amt2").value || "0",10) || 0;
  const a3 = parseInt(document.getElementById("amt3").value || "0",10) || 0;
  const a4 = parseInt(document.getElementById("amt4").value || "0",10) || 0;
  return [a1,a2,a3,a4];
}

document.getElementById("btnCalc").addEventListener("click", async ()=>{
  const unit = parseInt(document.getElementById("roundUnit").value,10) || 1;
const amounts = getRoundAmounts();

  const people = [];
  [...tbody.querySelectorAll("tr")].forEach(tr=>{
    const name = tr.querySelector("input[type='text']")?.value?.trim() || "";
    const cbs = tr.querySelectorAll("input[type='checkbox']");
    people.push({ name, attend: [...cbs].map(cb => cb.checked) });
  });

  const payload = { unit: unit, round_amounts: amounts, people: people };

  const res = await fetch("/calculate", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  if(!res.ok){ alert("계산 중 오류가 발생했습니다."); return; }
  const data = await res.json();
  renderResult(data);
});

function renderResult(data){
  const parts = data.per_round.map(r => `${r.round_label}: ${r.count}명 / ${formatNum(r.amount)}원`);
  summary.innerHTML = `총 회식비: <strong>${formatNum(data.grand_total)}</strong>원 · 총 정산금액: <strong>${formatNum(data.grand_final_total||0)}</strong>원 · ${parts.join(" · ")}`;
  resultBody.innerHTML = "";
  data.results.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.attended)}</td>
      <td class="num">${formatNum(row.raw_sum)}</td>
      <td class="num"><strong>${formatNum(row.final_sum)}</strong></td>
    `;
    resultBody.appendChild(tr);
  });
}

document.getElementById("btnAll1").onclick = ()=>bulkSet(0,true);
document.getElementById("btnNone1").onclick = ()=>bulkSet(0,false);
document.getElementById("btnAll2").onclick = ()=>bulkSet(1,true);
document.getElementById("btnNone2").onclick = ()=>bulkSet(1,false);
document.getElementById("btnAll3").onclick = ()=>bulkSet(2,true);
document.getElementById("btnNone3").onclick = ()=>bulkSet(2,false);
document.getElementById("btnAll4").onclick = ()=>bulkSet(3,true);
document.getElementById("btnNone4").onclick = ()=>bulkSet(3,false);

function bulkSet(roundIdx, val){
  [...tbody.querySelectorAll("tr")].forEach(tr=>{
    const cbs = tr.querySelectorAll("input[type='checkbox']");
    if(cbs[roundIdx]) cbs[roundIdx].checked = val;
  });
}

function formatNum(n){ return (n||0).toLocaleString("ko-KR"); }
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }


document.addEventListener("DOMContentLoaded", ()=>{
  const originalBtn = document.getElementById("btnCalc");
  if (originalBtn) {
    // Create a new prominent button next to the unit input if available
    const unitEl = document.getElementById("roundUnit") || originalBtn.parentElement;
    const newBtn = document.createElement("button");
    newBtn.id = "btnCalcPrimary";
    newBtn.className = "primary";
    newBtn.textContent = "정산하기";
    if (unitEl && unitEl.parentElement) {
      unitEl.parentElement.insertBefore(newBtn, unitEl.nextSibling);
    } else {
      originalBtn.parentElement.appendChild(newBtn);
    }
    // Hide original button
    originalBtn.style.display = "none";
    // Wire the same click behavior by triggering original
    newBtn.addEventListener("click", ()=> originalBtn.click());
  }
});

