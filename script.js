function mostrar(pantalla) {
    document.getElementById("menu").style.display = "none";
    document.getElementById(pantalla).classList.remove("oculto");
}

function volver() {
    document.getElementById("menu").style.display = "block";
    document.getElementById("ingreso").classList.add("oculto");
    document.getElementById("egreso").classList.add("oculto");
}

function toggleExtra() {
    const tipo = document.getElementById("tipoIngreso").value;
    const persona = document.getElementById("persona");

    if (tipo === "extra") {
        persona.classList.remove("oculto");
    } else {
        persona.classList.add("oculto");
    }
}

// Por ahora solo mostramos en consola
function guardarIngreso() {
    const data = {
        fecha: document.getElementById("fechaIngreso").value,
        turno: document.getElementById("turno").value,
        monto: document.getElementById("montoIngreso").value,
        tipo: document.getElementById("tipoIngreso").value,
        persona: document.getElementById("persona").value
    };

    console.log("Ingreso:", data);
    alert("Ingreso guardado (temporal)");
}

function guardarEgreso() {
    const data = {
        fecha: document.getElementById("fechaEgreso").value,
        descripcion: document.getElementById("descEgreso").value,
        monto: document.getElementById("montoEgreso").value,
        categoria: document.getElementById("categoria").value
    };

    console.log("Egreso:", data);
    alert("Egreso guardado (temporal)");
}
