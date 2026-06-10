// ======================
// ABRIR MODALES
// ======================

function mostrar(modal) {
    document.getElementById(modal).classList.remove("oculto");
}

// ======================
// CERRAR MODALES
// ======================

function volver() {
    document.getElementById("ingreso").classList.add("oculto");
    document.getElementById("egreso").classList.add("oculto");
}

// ======================
// MOSTRAR PERSONA SI ES EXTRA
// ======================

function toggleExtra() {

    const tipo = document.getElementById("tipoIngreso").value;
    const persona = document.getElementById("persona");

    if (tipo === "extra") {
        persona.classList.remove("oculto");
    } else {
        persona.classList.add("oculto");
    }

}

// ======================
// GUARDAR INGRESO
// ======================

function guardarIngreso() {

    const data = {
        fecha: document.getElementById("fechaIngreso").value,
        turno: document.getElementById("turno").value,
        monto: document.getElementById("montoIngreso").value,
        tipo: document.getElementById("tipoIngreso").value,
        persona: document.getElementById("persona").value
    };

    console.log("Ingreso:", data);

    alert("Ingreso guardado");

    volver();
}

// ======================
// GUARDAR EGRESO
// ======================

function guardarEgreso() {

    const data = {
        fecha: document.getElementById("fechaEgreso").value,
        descripcion: document.getElementById("descEgreso").value,
        monto: document.getElementById("montoEgreso").value,
        categoria: document.getElementById("categoria").value
    };

    console.log("Egreso:", data);

    alert("Egreso guardado");

    volver();
}

// ======================
// CERRAR MODAL AL TOCAR EL FONDO
// ======================

document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", function (e) {

        if (e.target === modal) {
            modal.classList.add("oculto");
        }

    });

});
