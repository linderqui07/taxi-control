// ======================
// ESTADO GLOBAL
// ======================
let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
let mesActual = new Date();
let semanaActual = 0; // índice de la semana dentro del mes (0,1,2,3,4)
let vistaActual = "lista"; // "lista" o "semana"

// ======================
// INICIALIZACIÓN
// ======================
document.addEventListener("DOMContentLoaded", () => {
    const hoy = new Date().toISOString().split("T")[0];
    document.getElementById("fechaIngreso").value = hoy;
    document.getElementById("fechaEgreso").value = hoy;
    renderizar();
});

// ======================
// CAMBIAR MES
// ======================
function cambiarMes(delta) {
    mesActual.setMonth(mesActual.getMonth() + delta);
    semanaActual = 0;
    renderizar();
}

// ======================
// CAMBIAR VISTA
// ======================
function cambiarVista(vista) {
    vistaActual = vista;
    document.getElementById("tabLista").classList.toggle("active", vista === "lista");
    document.getElementById("tabSemana").classList.toggle("active", vista === "semana");
    document.getElementById("vistaLista").classList.toggle("oculto", vista !== "lista");
    document.getElementById("vistaSemana").classList.toggle("oculto", vista !== "semana");
    renderizar();
}

// ======================
// CAMBIAR SEMANA
// ======================
function cambiarSemana(delta) {
    semanaActual += delta;
    if (semanaActual < 0) semanaActual = 0;
    renderizar();
}

// ======================
// OBTENER SEMANAS DEL MES
// ======================
function obtenerSemanasDelMes(anio, mes) {
    const semanas = [];
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);

    let inicio = new Date(primerDia);
    // Retroceder hasta el lunes de esa semana
    const diaSemana = inicio.getDay(); // 0=Dom, 1=Lun...
    const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
    inicio.setDate(inicio.getDate() + diff);

    while (inicio <= ultimoDia) {
        const fin = new Date(inicio);
        fin.setDate(fin.getDate() + 6);
        semanas.push({ inicio: new Date(inicio), fin: new Date(fin) });
        inicio.setDate(inicio.getDate() + 7);
    }
    return semanas;
}

// ======================
// RENDER PRINCIPAL
// ======================
function renderizar() {
    const anio = mesActual.getFullYear();
    const mes = mesActual.getMonth();

    const nombres = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                     "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    document.getElementById("mesActual").textContent = `${nombres[mes]} ${anio}`;

    // Filtrar movimientos del mes
    const delMes = movimientos.filter(m => {
        const f = new Date(m.fecha + "T12:00:00");
        return f.getFullYear() === anio && f.getMonth() === mes;
    });

    // Totales del mes
    let ingresos = 0, egresos = 0, soloTaxi = 0, extras = 0;
    delMes.forEach(m => {
        if (m.tipo === "ingreso") {
            ingresos += m.monto;
            if (m.esExtra) extras += m.monto;
            else soloTaxi += m.monto;
        } else {
            egresos += m.monto;
        }
    });

    const saldo = ingresos - egresos;
    document.getElementById("saldoMes").textContent = formato(saldo);
    document.getElementById("ingresosMes").textContent = formato(ingresos);
    document.getElementById("egresosMes").textContent = formato(egresos);
    document.getElementById("soloTaxi").textContent = formato(soloTaxi);
    document.getElementById("totalExtras").textContent = formato(extras);
    document.getElementById("saldoMes").style.color = saldo >= 0 ? "#22c55e" : "#ef4444";

    // Render según vista
    if (vistaActual === "lista") {
        renderLista(delMes);
    } else {
        renderSemana(anio, mes, delMes);
    }
}

// ======================
// RENDER LISTA
// ======================
function renderLista(delMes) {
    const lista = document.getElementById("listaMovimientos");
    lista.innerHTML = "";

    if (delMes.length === 0) {
        lista.innerHTML = `<div class="vacio">No hay movimientos este mes</div>`;
        return;
    }

    delMes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    delMes.forEach(m => {
        const div = document.createElement("div");
        div.className = "movimiento";

        let descripcion = "";
        if (m.tipo === "ingreso") {
            descripcion = m.esExtra ? `Extra - ${m.persona}` : `Taxi - Turno ${m.turno === "dia" ? "Día" : "Noche"}`;
        } else {
            descripcion = m.descripcion || m.categoria;
        }

        div.innerHTML = `
            <div class="movimiento-info">
                <span class="desc">${descripcion}</span>
                <span class="fecha">${formatearFecha(m.fecha)}</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="${m.tipo === 'ingreso' ? 'positivo' : 'negativo'}">
                    ${m.tipo === 'ingreso' ? '+' : '-'}${formato(m.monto)}
                </span>
                <button class="btn-eliminar" onclick="eliminar(${m.id})">🗑️</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// ======================
// RENDER SEMANA
// ======================
function renderSemana(anio, mes, delMes) {
    const semanas = obtenerSemanasDelMes(anio, mes);
    if (semanaActual >= semanas.length) semanaActual = semanas.length - 1;
    if (semanaActual < 0) semanaActual = 0;

    const semana = semanas[semanaActual];
    const diasSemana = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

    // Rango visible
    const opciones = { day: "2-digit", month: "short" };
    document.getElementById("rangoSemana").textContent =
        `${semana.inicio.toLocaleDateString("es-ES", opciones)} - ${semana.fin.toLocaleDateString("es-ES", opciones)}`;

    // Preparar datos por día
    const datos = {};
    diasSemana.forEach((_, i) => {
        const fecha = new Date(semana.inicio);
        fecha.setDate(fecha.getDate() + i);
        const key = fecha.toISOString().split("T")[0];
        datos[key] = { dia: 0, noche: 0, fechaObj: fecha };
    });

    // Llenar ingresos taxi
    delMes.forEach(m => {
        if (m.tipo === "ingreso" && !m.esExtra && datos[m.fecha]) {
            if (m.turno === "dia") datos[m.fecha].dia += m.monto;
            else datos[m.fecha].noche += m.monto;
        }
    });

    // Extras de la semana
    const extrasSemana = { Gatito: 0, "Luis Miguel": 0, Linder: 0 };
    delMes.forEach(m => {
        if (m.tipo === "ingreso" && m.esExtra && datos[m.fecha]) {
            extrasSemana[m.persona] = (extrasSemana[m.persona] || 0) + m.monto;
        }
    });

    // Egresos de la semana
    const egresosSemana = delMes.filter(m => m.tipo === "egreso" && datos[m.fecha]);

    // Construir HTML
    let html = `
        <table class="tabla-semana">
            <thead>
                <tr>
                    <th></th>
                    ${diasSemana.map((d, i) => {
                        const f = new Date(semana.inicio);
                        f.setDate(f.getDate() + i);
                        return `<th>${d}<br><small>${f.getDate()}</small></th>`;
                    }).join("")}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="label">Día</td>
                    ${Object.values(datos).map(d => `<td>${d.dia > 0 ? d.dia.toFixed(2) : "-"}</td>`).join("")}
                </tr>
                <tr>
                    <td class="label">Noche</td>
                    ${Object.values(datos).map(d => `<td>${d.noche > 0 ? d.noche.toFixed(2) : "-"}</td>`).join("")}
                </tr>
                <tr class="total-row">
                    <td class="label">Total</td>
                    ${Object.values(datos).map(d => {
                        const t = d.dia + d.noche;
                        return `<td>${t > 0 ? t.toFixed(2) : "-"}</td>`;
                    }).join("")}
                </tr>
            </tbody>
        </table>
    `;

    // Extras
    html += `<div class="extras-semana"><h4>Ingresos Extras</h4>`;
    Object.entries(extrasSemana).forEach(([persona, monto]) => {
        html += `<div class="extra-item"><span>${persona}</span><strong>${formato(monto)}</strong></div>`;
    });
    html += `</div>`;

    // Egresos
    html += `<div class="egresos-semana"><h4>Egresos de la semana</h4>`;
    if (egresosSemana.length === 0) {
        html += `<div class="vacio" style="padding:15px 0">Sin egresos</div>`;
    } else {
        egresosSemana.forEach(e => {
            html += `
                <div class="egreso-item">
                    <div>
                        <div>${e.descripcion}</div>
                        <small style="color:#94a3b8">${formatearFecha(e.fecha)} · ${e.categoria}</small>
                    </div>
                    <strong class="negativo">-${formato(e.monto)}</strong>
                </div>
            `;
        });
    }
    html += `</div>`;

    // Total de la semana
    let totalIngresosSemana = 0;
    Object.values(datos).forEach(d => totalIngresosSemana += d.dia + d.noche);
    Object.values(extrasSemana).forEach(m => totalIngresosSemana += m);
    const totalEgresosSemana = egresosSemana.reduce((s, e) => s + e.monto, 0);
    const saldoSemana = totalIngresosSemana - totalEgresosSemana;

    html += `
        <div class="total-semana">
            Total Semana: ${formato(saldoSemana)}
            <div style="font-size:12px; color:#94a3b8; margin-top:4px; font-weight:normal">
                Ingresos ${formato(totalIngresosSemana)} − Egresos ${formato(totalEgresosSemana)}
            </div>
        </div>
    `;

    document.getElementById("contenidoSemana").innerHTML = html;
}

// ======================
// EXPORTAR PDF
// ======================
function exportarPDF() {
    const nombres = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                     "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const anio = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const nombreMes = nombres[mes];

    // Crear un contenedor temporal limpio para el PDF
    const elemento = document.createElement("div");
    elemento.style.padding = "20px";
    elemento.style.fontFamily = "Arial, sans-serif";
    elemento.style.color = "#000";
    elemento.style.background = "#fff";

    // Título
    let html = `
        <h1 style="text-align:center; margin-bottom:5px;">🚕 Control Taxi</h1>
        <h2 style="text-align:center; color:#555; margin-top:0;">${nombreMes} ${anio}</h2>
        <hr>
    `;

    // Resumen del mes
    const delMes = movimientos.filter(m => {
        const f = new Date(m.fecha + "T12:00:00");
        return f.getFullYear() === anio && f.getMonth() === mes;
    });

    let ingresos = 0, egresos = 0, soloTaxi = 0, extras = 0;
    delMes.forEach(m => {
        if (m.tipo === "ingreso") {
            ingresos += m.monto;
            if (m.esExtra) extras += m.monto;
            else soloTaxi += m.monto;
        } else egresos += m.monto;
    });

    html += `
        <div style="display:flex; justify-content:space-around; margin:20px 0; text-align:center;">
            <div><strong>Ingresos</strong><br>$${ingresos.toFixed(2)}</div>
            <div><strong>Egresos</strong><br>$${egresos.toFixed(2)}</div>
            <div><strong>Saldo</strong><br>$${(ingresos - egresos).toFixed(2)}</div>
        </div>
        <div style="text-align:center; margin-bottom:20px; font-size:14px;">
            Solo Taxi: $${soloTaxi.toFixed(2)} &nbsp;|&nbsp; Extras: $${extras.toFixed(2)}
        </div>
        <hr>
    `;

    // Tabla de ingresos por día (estilo Excel)
    const diasDelMes = {};
    delMes.forEach(m => {
        if (m.tipo === "ingreso" && !m.esExtra) {
            if (!diasDelMes[m.fecha]) diasDelMes[m.fecha] = { dia: 0, noche: 0 };
            if (m.turno === "dia") diasDelMes[m.fecha].dia += m.monto;
            else diasDelMes[m.fecha].noche += m.monto;
        }
    });

    const fechasOrdenadas = Object.keys(diasDelMes).sort();

    if (fechasOrdenadas.length > 0) {
        html += `<h3>Ingresos Taxi</h3>
        <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px;">
            <thead>
                <tr style="background:#eee;">
                    <th style="border:1px solid #ccc; padding:6px;">Fecha</th>
                    <th style="border:1px solid #ccc; padding:6px;">Día</th>
                    <th style="border:1px solid #ccc; padding:6px;">Noche</th>
                    <th style="border:1px solid #ccc; padding:6px;">Total</th>
                </tr>
            </thead>
            <tbody>`;

        fechasOrdenadas.forEach(f => {
            const d = diasDelMes[f];
            const total = d.dia + d.noche;
            html += `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${formatearFecha(f)}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${d.dia.toFixed(2)}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${d.noche.toFixed(2)}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;"><strong>${total.toFixed(2)}</strong></td>
                </tr>`;
        });

        html += `</tbody></table>`;
    }

    // Extras
    const extrasLista = delMes.filter(m => m.tipo === "ingreso" && m.esExtra);
    if (extrasLista.length > 0) {
        html += `<h3>Ingresos Extras</h3>
        <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px;">
            <thead>
                <tr style="background:#eee;">
                    <th style="border:1px solid #ccc; padding:6px;">Fecha</th>
                    <th style="border:1px solid #ccc; padding:6px;">Persona</th>
                    <th style="border:1px solid #ccc; padding:6px;">Monto</th>
                </tr>
            </thead>
            <tbody>`;
        extrasLista.forEach(e => {
            html += `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${formatearFecha(e.fecha)}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${e.persona}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${e.monto.toFixed(2)}</td>
                </tr>`;
        });
        html += `</tbody></table>`;
    }

    // Egresos
    const egresosLista = delMes.filter(m => m.tipo === "egreso");
    if (egresosLista.length > 0) {
        html += `<h3>Egresos</h3>
        <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px;">
            <thead>
                <tr style="background:#eee;">
                    <th style="border:1px solid #ccc; padding:6px;">Fecha</th>
                    <th style="border:1px solid #ccc; padding:6px;">Descripción</th>
                    <th style="border:1px solid #ccc; padding:6px;">Categoría</th>
                    <th style="border:1px solid #ccc; padding:6px;">Monto</th>
                </tr>
            </thead>
            <tbody>`;
        egresosLista.forEach(e => {
            html += `
                <tr>
                    <td style="border:1px solid #ccc; padding:6px;">${formatearFecha(e.fecha)}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${e.descripcion}</td>
                    <td style="border:1px solid #ccc; padding:6px;">${e.categoria}</td>
                    <td style="border:1px solid #ccc; padding:6px; text-align:right;">${e.monto.toFixed(2)}</td>
                </tr>`;
        });
        html += `</tbody></table>`;
    }

    elemento.innerHTML = html;
    document.body.appendChild(elemento);

    const opt = {
        margin: 10,
        filename: `Control_Taxi_${nombreMes}_${anio}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    html2pdf().set(opt).from(elemento).save().then(() => {
        document.body.removeChild(elemento);
    });
}

// ======================
// GUARDAR / ELIMINAR
// ======================
function guardarIngreso() {
    const fecha = document.getElementById("fechaIngreso").value;
    const tipo = document.getElementById("tipoIngreso").value;
    const turno = document.getElementById("turno").value;
    const persona = document.getElementById("persona").value;
    const monto = parseFloat(document.getElementById("montoIngreso").value);

    if (!fecha || isNaN(monto) || monto <= 0) {
        alert("Completa todos los campos correctamente");
        return;
    }

    movimientos.push({
        id: Date.now(),
        tipo: "ingreso",
        fecha,
        monto,
        esExtra: tipo === "extra",
        turno: tipo === "taxi" ? turno : null,
        persona: tipo === "extra" ? persona : null
    });

    guardar();
    volver();
    renderizar();
    document.getElementById("montoIngreso").value = "";
}

function guardarEgreso() {
    const fecha = document.getElementById("fechaEgreso").value;
    const descripcion = document.getElementById("descEgreso").value.trim();
    const categoria = document.getElementById("categoria").value;
    const monto = parseFloat(document.getElementById("montoEgreso").value);

    if (!fecha || isNaN(monto) || monto <= 0) {
        alert("Completa todos los campos correctamente");
        return;
    }

    movimientos.push({
        id: Date.now(),
        tipo: "egreso",
        fecha,
        monto,
        descripcion: descripcion || categoria,
        categoria
    });

    guardar();
    volver();
    renderizar();
    document.getElementById("descEgreso").value = "";
    document.getElementById("montoEgreso").value = "";
}

function eliminar(id) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    movimientos = movimientos.filter(m => m.id !== id);
    guardar();
    renderizar();
}

// ======================
// UTILIDADES
// ======================
function guardar() {
    localStorage.setItem("movimientos", JSON.stringify(movimientos));
}

function formato(num) {
    return "$" + num.toFixed(2);
}

function formatearFecha(fechaStr) {
    const f = new Date(fechaStr + "T12:00:00");
    return f.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function toggleExtra() {
    const tipo = document.getElementById("tipoIngreso").value;
    document.getElementById("persona").classList.toggle("oculto", tipo !== "extra");
    document.getElementById("turno").classList.toggle("oculto", tipo === "extra");
}

function mostrar(modal) {
    document.getElementById(modal).classList.remove("oculto");
}

function volver() {
    document.getElementById("ingreso").classList.add("oculto");
    document.getElementById("egreso").classList.add("oculto");
}

document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
        if (e.target === modal) modal.classList.add("oculto");
    });
});
