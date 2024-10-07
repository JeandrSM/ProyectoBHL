/*cargarPublicaciones se ejecuta al activar al buscar publicaciones por el nombre binomial de las especies, esta funcion obtiene el 
nombre de la barra de busqueda y muestra en la pagina todas las publicaciones con dicha especie, el como lo hace es agarrar una lista vacia
y regresarla con los datos encontrados*/  

function cargarPublicaciones(event) {
    event.preventDefault();
    const lista = document.getElementById('pus');
    const binomialName = document.getElementById('nombreC').value;

    lista.innerHTML = '';
    lista.style.display = 'block';
    lista.classList.add('resultados'); 

    fetch(`http://localhost:3000/api/binomial?binomial_name=${encodeURIComponent(binomialName)}`)
        .then(response => {
            if (!response.ok) throw new Error('Error en la red');
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                lista.innerHTML = '<li>No se encontraron resultados.</li>';
            } else {
                data.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>Titulo:</strong> ${item.head}<br>`;
                    
                    // Botón para extender los detalles de la publicación
                    const ver = document.createElement('button');
                    ver.innerText = 'Ver Detalles';
                    ver.onclick = () => detallesNF(lista,li, item); // llama a la funcion que muestra los demas datos
                    
                    li.appendChild(ver);
                    lista.appendChild(li);
                });
            }
        })
        .catch(error => console.error('Error:', error));
}

/*Realiza el mismo procedimiento que el cargarPublicaciones, la diferencia es que busca por nombre de publicacion.
Esto es un añadido para agilizar la seccion de la Actualizar y ver mejor los detalles modificados*/ 
function cargarPublicaciones2(event) {
    event.preventDefault();
    const lista = document.getElementById('pus2');
    const headP = document.getElementById('nombreC2').value;

    lista.innerHTML = '';
    lista.style.display = 'block';
    lista.classList.add('resultados'); 

    fetch(`http://localhost:3000/api/titulo?head=${encodeURIComponent(headP)}`)
        .then(response => {
            if (!response.ok) throw new Error(`Error en la red: ${response.statusText}`);
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                lista.innerHTML = '<li>No se encontraron resultados.</li>';
            } else {
                data.forEach(item => {
                    const li = document.createElement('li');
                    
                    li.innerHTML = `<strong>ID:</strong> ${item.id}<br> <strong>Titulo:</strong> ${item.head}<br><strong>DOI:</strong> ${item.doi}<br><strong>ISBN:</strong> ${item.isbn}`;

                    // Botón para ver detalles de la publicación
                    const ver = document.createElement('button');
                    ver.innerText = 'Ver Detalles';
                    ver.onclick = () => {detallesNF(lista, li, item)}; // Muestra detalles al hacer clic

                    li.appendChild(ver);
                    lista.appendChild(li);
                });
            }
        })
        .catch(error => console.error('Error:', error.message));
}


/*Funcion llamada por cargarPublicaciones y cargarpublicacines2, recibe la lista a modificar y el objeto que contiene la publicacion,
al iniciarla, mostrara los datos faltantes de la publicacion*/ 
function detallesNF(lista, li, item) {
    if (li.innerHTML.includes('Fecha de publicación')) {
        // Ocultar detalles si ya están presentes
        li.innerHTML = `<strong>Titulo:</strong> ${item.head}<br>`;
        
        const ver = document.createElement('button');
        ver.innerText = 'Ver Detalles';
        ver.onclick = () => detallesNF(lista, li, item);
        li.appendChild(ver);
    } else {
        // Mostrar los detalles si no se están mostrando
        li.innerHTML = `
            <strong>Titulo:</strong> ${item.head}<br>
            <strong>Fecha de publicación:</strong> ${item.public_date}<br>
            <strong>DOI:</strong> ${item.doi}<br>
            <strong>ISBN:</strong> ${item.isbn}<br>
            <strong>País de publicación:</strong> ${item.public_country}<br>
            <strong>Editorial:</strong> ${item.edito}<br>
            <strong>Institución:</strong> ${item.inst_name}<br>
            <strong>Colecciones:</strong> <br> ---${item.col.map(colo => colo).join('<br>---')} <br>
        `;

        
        const especiesDiv = document.createElement('div');
        especiesDiv.innerHTML = `<strong>Especies:</strong> <br>`;
        
        item.binomial_name.forEach(name => {
            const espDiv = document.createElement('div');
            const ver2 = document.createElement('button');
            ver2.innerText = `---${name}`;
            ver2.classList.add('BotonEspecie');
            ver2.onclick = () => {
                extenderDatosEspecie(ver2, espDiv, name); // La misma lógica de cargarColecciones, solo que con especies
            };

            espDiv.appendChild(ver2);
            especiesDiv.appendChild(espDiv);
        });

        li.appendChild(especiesDiv); // Añadir especies

        // Crear y agregar el contenedor para autores
        const autoresDiv = document.createElement('div');
        autoresDiv.innerHTML = `<strong>Autores:</strong> <br>`;

        // Agregar botones para cada autor
        item.authors.forEach(author => {
            const autorDiv = document.createElement('div');
            const verAutor = document.createElement('button');
            verAutor.innerText = author;
            verAutor.classList.add('boton-detalles');
            verAutor.onclick = () => {
                extenderDatosAutor(verAutor, autorDiv, author);
            };
            autorDiv.appendChild(verAutor);
            autoresDiv.appendChild(autorDiv);
        });
        
        li.appendChild(autoresDiv); // Añadir autores a la lista
    


        // Botón para ocultar detalles
        const ocultar = document.createElement('button');
        ocultar.innerText = 'Ocultar Detalles';
        ocultar.onclick = () => detallesNF(lista, li, item); // Llama otra vez a la funcion, esto para ocultar los detalles
        li.appendChild(ocultar);
    }
}

/*Logica similar a detallesNF, pero con la diferencia que los datos a extender no estan en el objeto, esto porque el objeto a extender 
es diferente al original (publicaciones => especies) por lo que busca los datos de las especies por medio de la funcion 
especie de server.js, que por medio de codigo sql, extiende los datos*/ 
function extenderDatosEspecie(ver2, espDiv, name) {
    const detallesVisibles = espDiv.querySelector('.detalles-especie'); //Agarra el primer objeto de la lista
    
    if (detallesVisibles) {
        // Si los detalles están visibles, ocultarlos
        detallesVisibles.remove();
        ver2.innerText = '---' + name; //
    } else {
        // Si no están visibles, obtener los detalles
        fetch(`http://localhost:3000/api/especie?nombre=${encodeURIComponent(name)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Especie no encontrada');
                }
                return response.json();
            })
            .then(data => {
                const detallesDiv = document.createElement('div');
                detallesDiv.classList.add('detalles-especie');
                
                if (data.length === 0) {
                    detallesDiv.innerHTML = 'No se encontraron detalles.';
                } else {
                    data.forEach(item => {
                        detallesDiv.innerHTML += ` <strong>-----Nombres Comunes:</strong> <br>______ ${item.common_name.map(esp => esp).join('<br>______')}<br> <br>`;
                    });
                    
                }

                espDiv.appendChild(detallesDiv); // Mostrar los detalles
                ver2.innerText = '---' + name; 
            })
            .catch(error => console.error('Error:', error));
    }
}




/*Esta funcion se activa al presionar el boton de mostrar todas las publicaciones, similiar a las funciones anteriores,
muestra las publicaciones  y permite extender los datos*/ 

function cargarColecciones() {
    const lista = document.getElementById('datos');
    lista.classList.add('colecciones'); 

    if (lista.style.display === 'none' || !lista.style.display) {
        fetch('http://localhost:3000/api/collection')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta de la red');
                }
                return response.json();
            })
            .then(data => {
                lista.innerHTML = ''; // Limpiar la lista antes de agregar nuevos datos
                for (const key in data) {
                    const item = data[key];
                    const li = document.createElement('li');
                    li.innerHTML = `ID: ${item.id} <br> Nombre: ${item.name}<br>Descripción: ${item.description}<br><br>Publicaciones:<br>`;

                    // Crear un botón "Ver Detalles" por cada publicación
                    item.head.forEach(publicacion => {
                        const pubDiv = document.createElement('div');
                        const ver = document.createElement('button');
                        ver.innerText = `${publicacion} `;
                        ver.classList.add('boton-detalles');
                        
                        // Cambiar la lógica para mostrar/ocultar detalles
                        ver.onclick = () => {
                            if (ver.innerText === ' -') {
                                // Ocultar detalles si ya están visibles
                                pubDiv.innerHTML = ''; // Limpiar los detalles
                                ver.innerText = `${publicacion} `; // Cambiar el texto de vuelta
                            } else {
                                // Mostrar detalles si no están visibles
                                extenderDatos(ver, pubDiv, publicacion); // Pasa el botón, div y título de la publicación
                                ver.innerText = ' -'; // Cambiar el texto a '-'
                            }
                        };
                        
                        pubDiv.appendChild(ver);
                        li.appendChild(pubDiv);
                    });

                    lista.appendChild(li);
                }

                lista.style.display = 'block'; // Mostrar la lista
            })
            .catch(error => console.error('Error:', error));
    } else {
        lista.style.display = 'none'; // Ocultar la lista
    }
}


/*Extiende los datos de cargarColecciones, recibe el nombre de la publicacion y muestra los detalles de la publicacion
relacionada con la coleccion*/ 
function extenderDatos(boton, div, publicacion) {
    // Crear un botón para ocultar detalles
    const ocultar = document.createElement('button');
    ocultar.innerText = 'Ocultar';
    const mas = document.createElement('button');
    mas.innerText = publicacion;
    mas.classList.add('boton-detalles');
    mas.onclick = () => {
        extenderDatos(mas, div, publicacion);
    }

    // Cambiar el texto del botón al hacer clic
    if (boton.innerText === ' -') {
        div.innerHTML = ''; // Limpiar los detalles si ya están visibles
        boton.innerText = publicacion; // Cambiar el texto de vuelta al titulo
        return;
    }

    fetch(`http://localhost:3000/api/publi?head=${encodeURIComponent(publicacion)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la red');
            }
            return response.json();
        })
        .then(data => {
            div.innerHTML = `<strong>${publicacion}</strong>`; // Limpiar el div antes de agregar nuevos detalles
            if (data.length === 0) {
                div.innerHTML += '<div>No se encontraron detalles.</div>';
            } else {
                div.classList.add('masDatos');
                data.forEach(item => {
                    div.innerHTML += `<br><br>
                                       <strong>Fecha de publicación:</strong> ${item.public_date}<br>
                                       <strong>DOI:</strong> ${item.doi}<br>
                                       <strong>ISBN:</strong> ${item.isbn}<br>
                                       <strong>País de publicación:</strong> ${item.public_country}<br>
                                       <strong>Editorial:</strong> ${item.edito}<br>
                                       <strong>Institución:</strong> ${item.inst_name}<br>
                                       <strong>Colecciones:</strong> <br> ---${item.col.map(colo => colo).join('<br>---')} <br>
                    `;

                    // Agregar botones para cada especie
                    const especiesDiv = document.createElement('div');
                    especiesDiv.innerHTML = `<strong>Especies:</strong> <br>`;
        
                    item.binomial_name.forEach(name => {
                        const espDiv = document.createElement('div');
                        const verEspecie = document.createElement('button');
                        verEspecie.innerText = '---' + name; 
                        verEspecie.classList.add('BotonEspecie');
                        verEspecie.onclick = () => {
                            extenderDatosEspecie(verEspecie, espDiv, name);
                        };
                        espDiv.appendChild(verEspecie);
                        especiesDiv.appendChild(espDiv);
                    });
                    

                    div.appendChild(especiesDiv); // Añadir especies al div

                    // Crear y agregar el contenedor para autores
                    const autoresDiv = document.createElement('div');
                    autoresDiv.innerHTML = `<strong>Autores:</strong> <br>`;

                    // Agregar botones para cada autor
                    item.authors.forEach(author => {
                        const autorDiv = document.createElement('div');
                        const verAutor = document.createElement('button');
                        verAutor.innerText = author;
                        verAutor.onclick = () => {
                            extenderDatosAutor(verAutor, autorDiv, author);
                        };
                        autorDiv.appendChild(verAutor);
                        autoresDiv.appendChild(autorDiv);
                    });
                    
                    div.appendChild(autoresDiv); // Añadir autores al div
                });
            }
            div.appendChild(ocultar); // Agregar el botón de ocultar al div
            
            // Agregar funcionalidad al botón de ocultar
            ocultar.onclick = () => {
                div.innerHTML = ''; // Limpiar los detalles
                div.appendChild(mas);
            };

            // Cambiar el texto del botón original a '-'
            boton.innerText = ' -'; //ya no deberia estra funcionando de la misma manera
        })
        .catch(error => console.error('Error:', error));
}

// Función para extender detalles de autor de la publicacion, reciber el autor y extiende la informacion
function extenderDatosAutor(boton, div, autor) {
    const ocultar = document.createElement('button');
    ocultar.innerText = 'Ocultar';
    const mas = document.createElement('button');
    mas.innerText = autor;
    mas.classList.add('boton-detalles');
    mas.onclick = () => {
        extenderDatosAutor(mas, div, autor);
    }

    // Cambiar el texto del botón al hacer clic
    if (boton.innerText === ' -') {
        div.innerHTML = ''; // Limpiar los detalles si ya están visibles
        boton.innerText = autor; 
        return;
    }

    // Si los detalles no están visibles, los carga y los muestra
    fetch(`http://localhost:3000/api/autor?nombre=${encodeURIComponent(autor)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la red');
            }
            return response.json();
        })
        .then(data => {
            div.innerHTML = `<strong>${autor}</strong>`; // Limpiar el div antes de agregar nuevos detalles
            if (data.length === 0) {
                div.innerHTML += '<div>No se encontraron detalles.</div>';
            } else {
                div.classList.add('masDatos');
                data.forEach(item => {
                    div.innerHTML += `<br><br>
                                       <strong>DNI:</strong> ${item.dni}<br>
                                       <strong>Teléfono:</strong> ${item.phone_number}<br>
                                       <strong>Email:</strong> ${item.email}<br>
                                       <strong>País Actual:</strong> ${item.current_country}<br>
                    `;
                });
            }
            div.appendChild(ocultar); // Agregar el botón de ocultar al div
            
            // Agregar funcionalidad al botón de ocultar
            ocultar.onclick = () => {
                div.innerHTML = ''; // Limpiar los detalles
                div.appendChild(mas);
            };

            boton.innerText = ' -'; 
        })
        .catch(error => console.error('Error:', error));
}


/*Funcion de ayuda a la hora de ingresar una nueva publicaion, muestra el nombre y el id de cada publicacion existente*/ 

function mostrarInstituciones() {
    const lista = document.getElementById('institucionesList'); 

    // Verifica si la lista está oculta
    if (lista.style.display === 'none' || !lista.style.display) {
        fetch(`http://localhost:3000/api/institu`) 
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la red');
            }
            return response.json();
        })
        .then(data => {
            // Limpiar el contenido anterior
            lista.innerHTML = ''; 
            
            if (data.length === 0) {
                lista.innerHTML += '<li>No se encontraron instituciones.</li>'; // Mensaje si no hay instituciones
            } else {
                data.forEach(item => {
                    lista.innerHTML += `<li>
                                        <strong>ID:</strong>${item.id} <strong>__Nombre:</strong> <br>${item.name}<br>
                                        
                                        </li>`;
                });
            }
            // Mostrar la lista después de llenarla con los datos
            lista.style.display = 'block'; 
        })
        .catch(error => console.error('Error:', error));
    } else {
        // Ocultar la lista si ya está visible
        lista.style.display = 'none'; 
    }
}


/*Funcion de ayuda a la hora de ingresar una nueva publicaion, muestra el nombre y el id de cada editorial existente*/ 

function mostrarEditoriales() {
    const lista = document.getElementById('editorialesList'); 

    // Verifica si la lista está oculta
    if (lista.style.display === 'none' || !lista.style.display) {
        fetch(`http://localhost:3000/api/editu`) // URL para obtener instituciones
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la red');
            }
            return response.json();
        })
        .then(data => {
            // Limpiar el contenido anterior
            lista.innerHTML = ''; 
            
            if (data.length === 0) {
                lista.innerHTML += '<li>No se encontraron instituciones.</li>'; // Mensaje si no hay instituciones
            } else {
                data.forEach(item => {
                    // Acumula el contenido en la lista
                    lista.innerHTML += `<li>
                                        <strong>ID:</strong>${item.id} <strong>__Nombre:</strong> <br>${item.name}<br>
                                        </li>`;
                });
            }
            // Mostrar la lista después de llenarla con los datos
            lista.style.display = 'block'; 
        })
        .catch(error => console.error('Error:', error));
    } else {
        // Ocultar la lista si ya está visible
        lista.style.display = 'none'; 
    }
}


/*Funcion de ayuda a la hora de ingresar una nueva publicaion, muestra el nombre y el id de cada autor existente*/ 

function mostrarActores() {
    const lista = document.getElementById('autoresList'); 

    // Verifica si la lista está oculta
    if (lista.style.display === 'none' || !lista.style.display) {
        fetch(`http://localhost:3000/api/acto`) // URL para obtener instituciones
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la red');
            }
            return response.json();
        })
        .then(data => {
            // Limpiar el contenido anterior
            lista.innerHTML = ''; 
            
            if (data.length === 0) {
                lista.innerHTML += '<li>No se encontraron instituciones.</li>'; // Mensaje si no hay instituciones
            } else {
                data.forEach(item => {
                    // Acumula el contenido en la lista
                    lista.innerHTML += `<li>
                                        <strong>ID:</strong>${item.id} <strong>__Nombre:</strong>  <br> ${item.first_name} ${item.first_surname} ${item.second_surname}
                                        
                                        </li>`;
                });
            }
            // Mostrar la lista después de llenarla con los datos
            lista.style.display = 'block'; 
        })
        .catch(error => console.error('Error:', error));
    } else {
        // Ocultar la lista si ya está visible
        lista.style.display = 'none'; 
    }
}


/*Funcion de ayuda a la hora de ingresar una nueva publicaion, muestra el nombre y el id de cada especie existente*/ 

function mostrarEspecies() {
    const lista = document.getElementById('especiesList'); 

    // Verifica si la lista está oculta
    if (lista.style.display === 'none' || !lista.style.display) {
        fetch(`http://localhost:3000/api/espe`) // URL para obtener instituciones
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la red');
            }
            return response.json();
        })
        .then(data => {
            // Limpiar el contenido anterior
            lista.innerHTML = ''; 
            
            if (data.length === 0) {
                lista.innerHTML += '<li>No se encontraron especies.</li>'; // Mensaje si no hay instituciones
            } else {
                data.forEach(item => {
                    // Acumula el contenido en la lista
                    lista.innerHTML += `<li>
                                        <strong>ID:</strong>${item.id} <strong>__Nombre:</strong>  <br> ${item.binomial_name}
                                        
                                        </li>`;
                });
            }
            // Mostrar la lista después de llenarla con los datos
            lista.style.display = 'block'; 
        })
        .catch(error => console.error('Error:', error));
    } else {
        // Ocultar la lista si ya está visible
        lista.style.display = 'none'; 
    }
}

/*Funcion de ayuda a la hora de eliminar una publicaion, muestra el nombre y el id de cada publicacion existente*/ 

function mostrarPublicaciones() {
    const lista = document.getElementById('publicacionesList'); 

    // Verifica si la lista está oculta
    if (lista.style.display === 'none' || !lista.style.display) {
        fetch(`http://localhost:3000/api/pu`) // URL para obtener instituciones
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la red');
            }
            return response.json();
        })
        .then(data => {
            // Limpiar el contenido anterior
            lista.innerHTML = ''; 
            
            if (data.length === 0) {
                lista.innerHTML += '<li>No se encontraron especies.</li>'; // Mensaje si no hay instituciones
            } else {
                data.forEach(item => {
                    // Acumula el contenido en la lista
                    lista.innerHTML += `<li>
                                       <strong>ID:</strong> ${item.id} <strong>__Nombre: <br> </strong> ${item.head} 
                                        
                                        </li>`;
                });
            }
            // Mostrar la lista después de llenarla con los datos
            lista.style.display = 'block'; 
        })
        .catch(error => console.error('Error:', error));
    } else {
        // Ocultar la lista si ya está visible
        lista.style.display = 'none'; 
    }
}

//Funcion que reciber los datos de una publicacion y la ingresa a la base de datos, en la conexion con server.js valida cada dato
function agregarPubli(event) {
    event.preventDefault(); 
    
    const head = document.getElementById('Titulo').value;
    const public_date = document.getElementById('Fecha').value;
    const doi = document.getElementById('DOI').value;
    const isbn = document.getElementById('ISBN').value;
    const public_country = document.getElementById('Pais').value;
    const editorial_id = document.getElementById('edit').value;
    const id_inst = document.getElementById('inst').value;

    const species_ids = document.getElementById('espe').value.split(',').map(id => id.trim());
    const author_ids = document.getElementById('autos').value.split(',').map(id => id.trim());
    const colects_ids = document.getElementById('colectas').value.split(',').map(id => id.trim());

    const data = {
        head,
        public_date,
        doi,
        isbn,
        public_country,
        editorial_id,
        id_inst,
        species_ids,
        author_ids,
        colects_ids
    };

    fetch('http://localhost:3000/api/InserPubli', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error); // Maneja el mensaje de error específico
        }
        return response.json();
    })
    .then(data => {
        alert(data.message); // Mostrar mensaje de éxito
    })
    .catch(error => {
        console.error('Error al insertar publicación:', error);
        alert('No se pudo insertar la publicación: ' + error.message); // Muestra el mensaje de error
    });
}

//Funcion que elimina una publicacion por medio de su id
function eliminarPubli(event) {
    event.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    const id = document.getElementById('eliminacion').value;


    const data = {
        id
    };

    fetch('http://localhost:3000/api/EliminaPubli', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (response.ok) {
            alert('Publicación eliminada con éxito');
        } else {
            alert('Error al eliminar la publicación. Por favor, inténtalo de nuevo.');
        }
    })
    .catch(err => {
        console.error('Error en la solicitud:', err);
        alert('Error en la conexión. Por favor, inténtalo de nuevo.');
    });
}


//Funcion de ayuda en la seccion de actualizar, cambia el nombre de una publicacion por medio de su id
// y valida que no esté repetido
function cambiarNombre(event) {
    event.preventDefault(); // Evita que el formulario recargue la página
    
    const id = document.getElementById('id1').value;
    const tituloNuevo = document.getElementById('tituloNuevo').value;
    
    fetch('http://localhost:3000/api/cambianombre', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, tituloNuevo: tituloNuevo })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Error desconocido'); 
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Título actualizado correctamente');
        } else {
            alert(data.message || 'Error al actualizar el título');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('No se pudo actualizar el título: ' + error.message); // Muestra el mensaje de error
    });
}
//Funcion de ayuda en la seccion de actualizar, cambia la institucio de una publicacion por medio de su id
// y valida que sea valido
function cambiarInstituto(event) {
    event.preventDefault(); // Evita que el formulario recargue la página
    
    const id = document.getElementById('id3').value;
    const insti = document.getElementById('InstitucionNueva').value;
    
    fetch('http://localhost:3000/api/cambiainsti', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, insti: insti })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Instituto actualizado correctamente');
        } else {
            alert('No se pudo cambiar el Instituto');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

//Funcion de ayuda en la seccion de actualizar, cambia la editorial de una publicacion por medio de su id
// y valida que sea validoi
function cambiarEditorial(event) {
    event.preventDefault(); // Evita que el formulario recargue la página
    const id = document.getElementById('id2').value;
    const etorial = document.getElementById('EditorialNuevo').value;
    
    
    fetch('http://localhost:3000/api/cambiaedito', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, etorial: etorial })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Editorial actualizado correctamente');
        } else {
            alert('Error al actualizar el Editorial');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
//Funcion de ayuda en la seccion de actualizar, cambia el isbn de una publicacion por medio de su id
// y valida que no esté repetido
function cambiarISBN(event) {
    event.preventDefault(); // Evita que el formulario recargue la página
    const id = document.getElementById('id4').value;
    const isbnN = document.getElementById('isbnNuevo').value;
    
    
    fetch('http://localhost:3000/api/cambiaIsbn', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, isbnN: isbnN })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Error desconocido'); 
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('ISBN actualizado correctamente');
        } else {
            alert(data.message || 'Error al actualizar el ISBN');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('No se pudo actualizar el ISBN: ' + error.message); // Muestra el mensaje de error
    });
}

//Funcion de ayuda en la seccion de actualizar, cambia la fecha de una publicacion por medio de su id

function cambiarfecha(event) {
    event.preventDefault(); // Evita que el formulario recargue la página
    const id = document.getElementById('id5').value;
    const fechaN = document.getElementById('FechaNueva').value;
    
    
    fetch('http://localhost:3000/api/cambiafecha', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, fechaN: fechaN })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Fecha actualizada correctamente');
        } else {
            alert('Error al actualizar la Fecha');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
//Funcion de ayuda en la seccion de actualizar, Agrega una publicacion a una coleccion por medio de su id
// y valida que sea valido
function AgregarAcolec(event) {
    event.preventDefault();
    
    const publicacionId = document.getElementById('id8').value;
    const coleccionIds = document.getElementById('AgrCole').value.split(',').map(id => id.trim());

    fetch('http://localhost:3000/api/agregar-colecciones', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            publicacionId: publicacionId,
            coleccionIds: coleccionIds
        }),
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Error en la solicitud');
        }
        alert('Colecciones agregadas correctamente o ya existentes');
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    });
}
//Funcion de ayuda en la seccion de actualizar, Elimina una publicacion de una coleccion por medio de su id
// y valida que sea valido
function EliminarDecolec(event) {
    event.preventDefault();
    
    const publicacionId = document.getElementById('id12').value;
    const coleccionIds = document.getElementById('COE').value.split(',').map(id => id.trim());

    // Validar entradas
    if (!publicacionId || coleccionIds.length === 0) {
        alert('Por favor, ingresa un ID de publicación y al menos un ID de colección.');
        return;
    }

    fetch('http://localhost:3000/api/eliminar-colecciones', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            publicacionId: publicacionId,
            coleccionIds: coleccionIds
        }),
    })
    .then(async response => {
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Error en la solicitud');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message || 'Colecciones eliminadas correctamente o no existentes');
        // Limpiar el formulario si es necesario
        document.getElementById('id12').value = '';
        document.getElementById('COE').value = '';
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    });
}

//Funcion de ayuda en la seccion de actualizar, cambia el DOI d una publicacion por medio de su id
// y valida que no este repetido
function cambiarDOI(event) {
    event.preventDefault(); // Evita que el formulario recargue la página
    const id = document.getElementById('id9').value;
    const DoiN = document.getElementById('doy').value;
    
    
    fetch('http://localhost:3000/api/cambiaDoi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, DoiN: DoiN })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Error desconocido'); 
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('DOI actualizado correctamente');
        } else {
            alert(data.message || 'Error al actualizar el DOI');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('No se pudo actualizar el DOI: ' + error.message); // Muestra el mensaje de error
    });
}


//Funcion de ayuda en la seccion de actualizar, Cambie el pasi de publicacion de una publicacion por medio de su id

function NuevoPais(event) {
    event.preventDefault(); // Evita que el formulario recargue la página
    const id = document.getElementById('id13').value;
    const NP = document.getElementById('nuPa').value;
    
    fetch('http://localhost:3000/api/cambiarPais', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, NP: NP }) // JSON con las claves correspondientes
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('País actualizado correctamente');
        } else {
            alert('Error al actualizar el país');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
//Funcion de ayuda en la seccion de actualizar, Agrega una publicacion una especie por medio de su id
// y valida que sea valido
function masEspecie(event) {
    event.preventDefault();

    const publicacionId = document.getElementById('id6').value;
    const speciesIds = document.getElementById('idespe').value.split(',').map(id => id.trim());

    fetch('http://localhost:3000/api/agregar-especies', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            publicacionId: publicacionId,
            speciesIds: speciesIds
        }),
    })
    .then(async response => {
        // Procesar la respuesta del servidor
        const data = await response.json();
        if (!response.ok) {
            // Si hubo un error, lanzar un mensaje con la respuesta del servidor
            throw new Error(data.error || 'Error en la solicitud');
        }
        // Si la solicitud fue exitosa, mostrar el mensaje de éxito
        alert(data.message || 'Especies agregadas correctamente');
    })
    .catch(error => {
        // Mostrar el mensaje de error en caso de que ocurra un problema
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    });
}

//Funcion de ayuda en la seccion de actualizar, Agrega una publicacion un autor por medio de su id
// y valida que sea valido
function masAutores(event) {
    event.preventDefault();
    
    const publicacionId = document.getElementById('id10').value;
    const autoresIds = document.getElementById('AutorNuevo').value.split(',').map(id => id.trim());
    fetch('http://localhost:3000/api/agregar-autores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            publicacionId: publicacionId,
            autoresIds: autoresIds
        }),
    })
    .then(async response => {
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Error en la solicitud');
        }
        return response.json();
    })
    .then(data => {
        // Aquí se debe mostrar el mensaje solo si la operación fue exitosa
        alert(data.message || 'Autores agregados correctamente');
        // Limpiar el formulario después de agregar autores
        document.getElementById('Aato').reset();
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error: ${error.message}`); // Muestra el mensaje de error al usuario
    });
}

//Funcion de ayuda en la seccion de actualizar, Elimina un autor de una publicacion por medio de su id
// y valida que sea valido
function menosAutores(event) {
    event.preventDefault();
    
    const publicacionId = document.getElementById('id11').value;
    const autoresIds = document.getElementById('AutorMenos').value.split(',').map(id => id.trim());

    fetch('http://localhost:3000/api/eliminar-autores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            publicacionId: publicacionId,
            autoresIds: autoresIds
        }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Error en la solicitud');
            });
        }
        return response.json();
    })
    .then(data => {
        alert(data.message || 'Autores eliminados correctamente');
        // Limpiar el formulario después de agregar autores
        document.getElementById('Eato').reset();
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    });
}

//Funcion de ayuda en la seccion de actualizar, Elimina una esoecie de una publicacion por medio de su id
// y valida que sea valido
function menosEspecie(event){
    event.preventDefault();
    
    const publicacionId = document.getElementById('id7').value;
    const speciesIds = document.getElementById('idespeE').value.split(',').map(id => id.trim());

    fetch('http://localhost:3000/api/eliminar-especies', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            publicacionId: publicacionId,
            speciesIds: speciesIds
        }),
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en la solicitud');
        return response.json();
    })
    .then(data => {
        alert('Especies eliminadas correctamente');
    })
    .catch(error => {
        console.error('Error:', error);
    });

}





//Todas estas funciones se activan cuando hay un evento, y solo se ejecuta la funcion que recibe el boton que 
//ocaciono el evento
function iniciarColecciones() {
    document.getElementById('cargarDatos').addEventListener('click', cargarColecciones);
}

function iniciarPublicaciones() {
    document.getElementById('buscar').addEventListener('submit', cargarPublicaciones); 
    
}

function MostrarActualizar() {
    document.getElementById('buscar2').addEventListener('submit', cargarPublicaciones2); 
}

function extender() {
    document.getElementById('buscar').addEventListener('submit', extenderDatos); 
}
function iniciarInstituciones(){
    document.getElementById("I").addEventListener("click",mostrarInstituciones);
}
function iniciarEditoriales(){
    document.getElementById("E").addEventListener("click",mostrarEditoriales); 
}
function iniciarAutores(){
    document.getElementById("A").addEventListener("click",mostrarActores); 
}
function iniciarEspecies(){
    document.getElementById("Es").addEventListener("click",mostrarEspecies);  
}
function agregacion(){
    document.getElementById('AgregarF').addEventListener('submit', agregarPubli);
}
function todasPublicaciones(){
    document.getElementById('P').addEventListener('click', mostrarPublicaciones);
}
function eliminacion(){
    document.getElementById('elim').addEventListener('submit',eliminarPubli );
}

function NuevoNombre(){
    document.getElementById('Cnomb').addEventListener('submit', cambiarNombre); 
}
function NuevoInstitucion(){
    document.getElementById('InP').addEventListener('submit', cambiarInstituto);  
}
function NuevoEditorial(){
    document.getElementById('Cedi').addEventListener('submit', cambiarEditorial); 
}
function NuevoISBN(){
    document.getElementById('ISBNN').addEventListener('submit', cambiarISBN); 
}
function NuevaFecha(){
    document.getElementById('DATE').addEventListener('submit', cambiarfecha); 
}
function AgregarAColecciones(){
    document.getElementById('ColP').addEventListener('submit', AgregarAcolec); 
}
function NuevoDOI(){
    document.getElementById('DOIY').addEventListener('submit', cambiarDOI); 
}
function CambiarPaisN() {
    document.getElementById('PAIS').addEventListener('submit', NuevoPais);  
}

function AgregarEspecie() {
    document.getElementById('Aesp').addEventListener('submit', masEspecie);   
}

function AgregarAutor() {
    document.getElementById('Aato').addEventListener('submit', masAutores);  
}

function EliminarAutor() {
    document.getElementById('Eato').addEventListener('submit', menosAutores);  
}

function EliminarEspecie() {
    document.getElementById('Eesp').addEventListener('submit', menosEspecie);  
}

function EliminarColeccion() {
    document.getElementById('quitarColP').addEventListener('submit', EliminarDecolec);  
}





// Se activa cuando hay un evento
document.addEventListener('DOMContentLoaded', () => {
    iniciarColecciones();
    iniciarPublicaciones();
    iniciarInstituciones();
    iniciarEditoriales();
    iniciarAutores();
    iniciarEspecies();
    agregacion();
    todasPublicaciones();
    eliminacion();
    NuevoNombre();
    NuevoInstitucion();
    NuevoEditorial();
    NuevoISBN();
    NuevaFecha();
    AgregarAColecciones();
    NuevoDOI();
    CambiarPaisN();
    MostrarActualizar();
    AgregarEspecie();
    AgregarAutor();
    EliminarAutor()
    EliminarEspecie();
    EliminarColeccion();
});
