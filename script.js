// ======================
// ESTADO GLOBAL
// ======================
let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
let mesActual = new Date(); // mes que se está viendo

// ======================
// INICIALIZACIÓN
// ======================
document.addEventListener("DOMContentLoaded", () => {
    // Poner fecha de hoy por defecto
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
    renderizar();
}

// ======================
// RENDER PRINCIPAL
// ======================
function renderizar() {
    const anio = mesActual.getFullYear();
    const mes = mesActual.getMonth(); // 0-11

    // Nombre del mes
    const nombres = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                     "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    document.getElementById("mesActual").textContent = `${nombres[mes]} ${anio}`;

    // Filtrar movimientos del mes actual
    const delMes = movimientos.filter(m => {
        const f = new Date(m.fecha + "T12:00:00");
        return f.getFullYear() === anio && f.getMonth() === mes;
    });

    // Calcular totales
    let ingresos = 0;
    let egresos = 0;
    let soloTaxi = 0;
    let extras = 0;

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

    // Actualizar UI
    document.getElementById("saldoMes").textContent = formato(saldo);
    document.getElementById("ingresosMes").textContent = formato(ingresos);
    document.getElementById("egresosMes").textContent = formato(egresos);
    document.getElementById("soloTaxi").textContent = formato(soloTaxi);
    document.getElementById("totalExtras").textContent = formato(extras);

    // Color del saldo
    const saldoEl = document.getElementById("saldoMes");
    saldoEl.style.color = saldo >= 0 ? "#22c55e" : "#ef4444";

    // Lista de movimientos
    const lista = document.getElementById("listaMovimientos");
    lista.innerHTML = "";

    if (delMes.length === 0) {
        lista.innerHTML = `<div class="vacio">No hay movimientos este mes</div>`;
        return;
    }

    // Ordenar por fecha (más reciente primero)
    delMes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    delMes.forEach(m => {
        const div = document.createElement("div");
        div.className = "movimiento";

        let descripcion = "";
        if (m.tipo === "ingreso") {
            if (m.esExtra) {
                descripcion = `Extra - ${m.persona}`;
            } else {
                descripcion = `Taxi - Turno ${m.turno === "dia" ? "Día" : "Noche"}`;
            }
        } else {
            descripcion = m.descripcion || m.categoria;
        }

        const fechaFormateada = formatearFecha(m.fecha);

        div.innerHTML = `
            <div class="movimiento-info">
                <span class="desc">${descripcion}</span>
                <span class="fecha">${fechaFormateada}</span>
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
// GUARDAR INGRESO
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

    const nuevo = {
        id: Date.now(),
        tipo: "ingreso",
        fecha,
        monto,
        esExtra: tipo === "extra",
        turno: tipo === "taxi" ? turno : null,
        persona: tipo === "extra" ? persona : null
    };

    movimientos.push(nuevo);
    guardar();
    volver();
    renderizar();

    // Limpiar monto
    document.getElementById("montoIngreso").value = "";
}

// ======================
// GUARDAR EGRESO
// ======================
function guardarEgreso() {
    const fecha = document.getElementById("fechaEgreso").value;
    const descripcion = document.getElementById("descEgreso").value.trim();
    const categoria = document.getElementById("categoria").value;
    const monto = parseFloat(document.getElementById("montoEgreso").value);

    if (!fecha || isNaN(monto) || monto <= 0) {
        alert("Completa todos los campos correctamente");
        return;
    }

    const nuevo = {
        id: Date.now(),
        tipo: "egreso",
        fecha,
        monto,
        descripcion: descripcion || categoria,
        categoria
    };

    movimientos.push(nuevo);
    guardar();
    volver();
    renderizar();

    document.getElementById("descEgreso").value = "";
    document.getElementById("montoEgreso").value = "";
}

// ======================
// ELIMINAR
// ======================
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
    return f.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short"
    });
}

function toggleExtra() {
    const tipo = document.getElementById("tipoIngreso").value;
    const persona = document.getElementById("persona");
    const turno = document.getElementById("turno");

    if (tipo === "extra") {
        persona.classList.remove("oculto");
        turno.classList.add("oculto");
    } else {
        persona.classList.add("oculto");
        turno.classList.remove("oculto");
    }
}

function mostrar(modal) {
    document.getElementById(modal).classList.remove("oculto");
}

function volver() {
    document.getElementById("ingreso").classList.add("oculto");
    document.getElementById("egreso").classList.add("oculto");
}

// Cerrar modal al tocar fondo
document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
        if (e.target === modal) modal.classList.add("oculto");
    });
});
