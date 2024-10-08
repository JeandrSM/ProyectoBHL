const express = require('express'); 
const { Pool } = require('pg'); //Ayuda para conectar con las bases de datos
const cors = require('cors'); //Interactuar entre distintos archivos 

const app = express();   //De esta manera ahora puedo crear las funciones a sql 
const port = 3000; // Cambiado a 3000 para evitar conflicto con PostgreSQL

app.use(cors());
app.use(express.json()); // Para parsear cuerpos de solicitudes JSON, para recibir y enviar datos   

// Mi base de datos
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'BHL',
    password: '1234',
    port: 5432,
});


//Busca publicaciones con ese nombre binomial
app.get('/api/binomial', async (req, res) => {
    const binomialName = req.query.binomial_name; // Obtener el nombre binomial desde la query string

    try {
        const result = await pool.query(`
            SELECT S.binomial_name, P.head, P.public_date, P.doi, P.isbn, P.public_country, 
                   E.name as edito, S.binomial_name, I.name as inst_name, 
                   C.name as col, A.first_name AS f_name, 
                   A.second_name AS s_name, A.first_surname AS f_sname, 
                   A.second_surname AS s_sname
            FROM publication P
            JOIN editorial E ON P.editorial_id = E.id
            JOIN institution I ON P.id_inst = I.id
            LEFT JOIN public_species PS ON P.id = PS.id_public
            LEFT JOIN species S ON S.id = PS.id_species
            LEFT JOIN public_author PA ON P.id = PA.id_public
            LEFT JOIN author A ON A.id = PA.id_author
            LEFT JOIN public_collect PC ON P.id = PC.id_public
            LEFT JOIN collection C ON C.id = PC.id_collect
            WHERE P.id IN (
                SELECT PS.id_public
                FROM public_species PS
                JOIN species S ON S.id = PS.id_species
                WHERE S.binomial_name = $1
            )
        `, [binomialName]);  // $1 es el valor del parámetro que se pasa a la consulta

        // Agrupar autores por publicación
        const publicaciones = {};

        result.rows.forEach(item => {
            const head = item.head;
            if (!publicaciones[head]) {
                publicaciones[head] = {
                    binomialName: item.binomialName,
                    head: item.head,
                    public_date: null,
                    doi: item.doi,
                    isbn: item.isbn,
                    public_country: item.public_country,
                    edito: item.edito,
                    inst_name: item.inst_name,
                    col: [],
                    binomial_name: [],
                    authors: []
                };
            }

            const fecha = new Date(item.public_date);
            const dia = String(fecha.getDate()).padStart(2, '0'); // Día con dos dígitos
            const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Mes con dos dígitos
            const año = fecha.getFullYear(); // Año
            const fechaFormateada = `${año}/${mes}/${dia}`;
            publicaciones[head].public_date = fechaFormateada;

            // Agregar colecciones, nombres binomiales y autores
            if (item.col && !publicaciones[head].col.includes(item.col)) {
                publicaciones[head].col.push(item.col);
            }
            if (item.binomial_name && !publicaciones[head].binomial_name.includes(item.binomial_name)) {
                publicaciones[head].binomial_name.push(item.binomial_name);
            }

            const authorFullName = `${item.f_name || ''} ${item.s_name || ''} ${item.f_sname || ''} ${item.s_sname || ''}`.trim();
            if (authorFullName && !publicaciones[head].authors.includes(authorFullName)) {
                publicaciones[head].authors.push(authorFullName);
            }
        });

        // Asegurar que cada publicación tenga al menos un mensaje si no hay colecciones, especies o autores
        Object.values(publicaciones).forEach(item => {
            if (item.col.length === 0) {
                item.col = ['No tiene colecciones'];
            }
            if (item.binomial_name.length === 0) {
                item.binomial_name = ['No tiene nombres binomiales'];
            }
            if (item.authors.length === 0) {
                item.authors = ['No tiene autores'];
            }
        });

        res.json(Object.values(publicaciones));
    } catch (err) {
        console.error('Error en la base de datos:', err);
        res.status(500).send('Error en la base de datos');
    }
});


//Busca publicaciones por titulo
app.get('/api/titulo', async (req, res) => {
    const headP = req.query.head; 

    try {
        const result = await pool.query(`
            SELECT P.id, P.head, P.public_date, P.doi, P.isbn, P.public_country, 
                   E.name AS edito, S.binomial_name, I.name AS inst_name, 
                   C.name AS col_name, A.first_name AS f_name, 
                   A.second_name AS s_name, A.first_surname AS f_sname, 
                   A.second_surname AS s_sname
            FROM publication P
            JOIN editorial E ON P.editorial_id = E.id
            JOIN institution I ON P.id_inst = I.id
            LEFT JOIN public_species PS ON P.id = PS.id_public
            LEFT JOIN species S ON S.id = PS.id_species
            LEFT JOIN public_author PA ON P.id = PA.id_public
            LEFT JOIN author A ON A.id = PA.id_author
            LEFT JOIN public_collect PC ON P.id = PC.id_public
            LEFT JOIN collection C ON C.id = PC.id_collect
            WHERE P.head = $1
        `, [headP]); 

        const publicacionesPorTitulo = {};

        result.rows.forEach(item => {
            const head = item.head;
            if (!publicacionesPorTitulo[head]) {
                publicacionesPorTitulo[head] = {
                    id: item.id,
                    head: item.head,
                    public_date: null,
                    doi: item.doi,
                    isbn: item.isbn,
                    public_country: item.public_country,
                    edito: item.edito,
                    inst_name: item.inst_name,
                    col: [],
                    binomial_name: [],
                    authors: []
                };
            }

            const fecha = new Date(item.public_date);
            const dia = String(fecha.getDate()).padStart(2, '0'); // Día con dos dígitos
            const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Mes con dos dígitos
            const año = fecha.getFullYear(); // Año
            const fechaFormateada = `${año}/${mes}/${dia}`;
            publicacionesPorTitulo[head].public_date = fechaFormateada;

            // Agregar colecciones, especies y autores
            if (item.col_name && !publicacionesPorTitulo[head].col.includes(item.col_name)) {
                publicacionesPorTitulo[head].col.push(item.col_name);
            }
            if (item.binomial_name && !publicacionesPorTitulo[head].binomial_name.includes(item.binomial_name)) {
                publicacionesPorTitulo[head].binomial_name.push(item.binomial_name);
            }

            const authorFullName = `${item.f_name || ''} ${item.s_name || ''} ${item.f_sname || ''} ${item.s_sname || ''}`.trim();
            if (authorFullName && !publicacionesPorTitulo[head].authors.includes(authorFullName)) {
                publicacionesPorTitulo[head].authors.push(authorFullName);
            }
        });

        // Asegurar que cada publicación tenga al menos un mensaje si no hay colecciones, especies o autores
        Object.values(publicacionesPorTitulo).forEach(item => {
            if (item.col.length === 0) {
                item.col = ['No tiene colecciones'];
            }
            if (item.binomial_name.length === 0) {
                item.binomial_name = ['No tiene especies'];
            }
            if (item.authors.length === 0) {
                item.authors = ['No tiene autores'];
            }
        });

        res.json(Object.values(publicacionesPorTitulo));
    } catch (err) {
        console.error('Error en la base de datos:', err);
        res.status(500).send('Error en la base de datos');
    }
});

//Muestra los detalles de las especies con el nombre binomial dado
app.get('/api/especie', async (req, res) => {
    const nombreEspecie = req.query.nombre; // Obtener el valor de la publicación desde el query string

    try {
        const result = await pool.query(`
            SELECT S.binomial_name, CN.c_name AS common_name
            FROM species S
            LEFT JOIN common_name CN ON CN.id_species = S.id
            WHERE S.binomial_name = $1
        `, [nombreEspecie]);

        const publicaciones = {};

        result.rows.forEach(item => {
            const binomial_name = item.binomialName;
            if (!publicaciones[binomial_name]) {
                publicaciones[binomial_name] = {
                    binomialName: item.binomialName,
                    common_name: []
                };
            }

            // Agregar colecciones, nombres binomiales y autores
            if (item.common_name && !publicaciones[binomial_name].common_name.includes(item.common_name)) {
                publicaciones[binomial_name].common_name.push(item.common_name);
            }
        });

        // Asegurar que cada publicación tenga al menos un mensaje si no hay colecciones, especies o autores
        Object.values(publicaciones).forEach(item => {
            if (item.common_name.length === 0) {
                item.common_name = ['No tiene nombres comunes'];
            }
        });

        res.json(Object.values(publicaciones));
    } catch (err) {
        console.error('Error en la base de datos:', err);
        res.status(500).send('Error en la base de datos');
    }
});
//Muestra los detalles de un autor por medio de su nombre
app.get('/api/autor', async (req, res) => {
    const nombreAutor = req.query.nombre; // Obtener el valor de la publicación desde el query string

    try {
        const result = await pool.query(`
            SELECT A.dni, A.phone_number, A.email, A.current_country, 
                   A.first_name, A.second_name, A.first_surname, A.second_surname
            FROM author A
            WHERE (A.first_name || ' ' || A.second_name || ' ' || A.first_surname || ' ' || A.second_surname) = $1;
        `, [nombreAutor]);

        const autores = [];

        result.rows.forEach(item => {
            autores.push({
                dni: item.dni,
                phone_number: item.phone_number,
                email: item.email,
                current_country: item.current_country,
                // Agregar el nombre completo
                full_name: `${item.first_name} ${item.second_name} ${item.first_surname} ${item.second_surname}`
            });
        });

        // Asegurar que cada autor tenga al menos un mensaje si no hay detalles
        if (autores.length === 0) {
            res.json([{ message: 'No se encontraron detalles para este autor.' }]);
        } else {
            res.json(autores);
        }
    } catch (err) {
        console.error('Error en la base de datos:', err);
        res.status(500).send('Error en la base de datos');
    }
});


//Muestra todas las colecciones junto a sus publicaciones asociadas
app.get('/api/collection', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT C.id, C.name, C.description, P.head
            FROM collection C
            LEFT JOIN public_collect PC ON C.id = PC.id_collect
            LEFT JOIN publication P ON P.id = PC.id_public
        `);

        const colecciones = {};

        result.rows.forEach(item => {
            const name = item.name;
            if (!colecciones[name]) {
                colecciones[name] = {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    head: [] // Lista de publicaciones
                };
            }
            // Agregar publicación solo si existe
            if (item.head) {
                colecciones[name].head.push(item.head);
            }
        });

        // Verificar si las colecciones están vacías
        for (const key in colecciones) {
            if (colecciones[key].head.length === 0) {
                colecciones[key].head = ['No tiene publicaciones'];
            }
        }

        res.json(colecciones);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en la base de datos');
    }
});

//Muestra las instituciones junto su id

app.get('/api/institu', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT I.name, I.id
            FROM institution I
        `);

        const instituciones = result.rows.map(item => ({
            name: item.name,
            id: item.id,
        }));

        res.json(instituciones); // Envía el arreglo de instituciones
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en la base de datos');
    }
});
//Muestra las editoriales junto su id
app.get('/api/editu', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT E.name, E.id
            FROM editorial E
        `);

        const editoriales = result.rows.map(item => ({
            name: item.name,
            id: item.id,
        }));

        res.json(editoriales); // Envía el arreglo de instituciones
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en la base de datos');
    }
});
//Muestra los autores junto su id
app.get('/api/acto', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT A.first_name, A.first_surname, A.second_surname, A.id
            FROM author A
        `);

        // Aquí se utiliza un arreglo en lugar de un objeto
        const editoriales = result.rows.map(item => ({
            first_name: item.first_name,
            first_surname: item.first_surname,
            second_surname: item.second_surname,
            id: item.id,
        }));

        res.json(editoriales); // Envía el arreglo de instituciones
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en la base de datos');
    }
});

//Muestra las especies junto su id
app.get('/api/espe', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT S.binomial_name, S.id
            FROM species S
        `);

        // Aquí se utiliza un arreglo en lugar de un objeto
        const species = result.rows.map(item => ({
            binomial_name: item.binomial_name,
            id: item.id,
        }));

        res.json(species); // Envía el arreglo de instituciones
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en la base de datos');
    }
});

//Muestra las publicaciones junto su id
app.get('/api/pu', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT P.head, P.id
            FROM publication P
            order by (P.id)

        `);
        const publicas = result.rows.map(item => ({
            head: item.head,
            id: item.id,
        }));

        res.json(publicas); // Envía el arreglo de instituciones
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en la base de datos');
    }
});


//Muestra la publicacione con el nombre filtrado junto todos sus datos
app.get('/api/publi', async (req, res) => {
    const encabezado = req.query.head; // Obtener el valor de la publicación desde el query string

    try {
        const result = await pool.query(`
            SELECT P.public_date, P.doi, P.isbn, P.public_country, 
                   E.name as edito, S.binomial_name, I.name, 
                   C.name as col, A.first_name AS f_name, 
                   A.second_name AS s_name, A.first_surname AS f_sname, 
                   A.second_surname AS s_sname
            FROM publication P
            JOIN editorial E ON P.editorial_id = E.id
            JOIN institution I ON P.id_inst = I.id
            LEFT JOIN public_species PS ON P.id = PS.id_public
            LEFT JOIN species S ON S.id = PS.id_species
            LEFT JOIN public_author PA ON P.id = PA.id_public
            LEFT JOIN author A ON A.id = PA.id_author
            LEFT JOIN public_collect PC ON P.id = PC.id_public
            LEFT JOIN collection C ON C.id = PC.id_collect
            WHERE P.head = $1
        `, [encabezado]);

        const publicaciones = {};

        result.rows.forEach(item => {
            const doi = item.doi;
            if (!publicaciones[doi]) {
                publicaciones[doi] = {
                    public_date: null,
                    doi: item.doi,
                    isbn: item.isbn,
                    public_country: item.public_country,
                    edito: item.edito,
                    name: item.name,
                    col: [],
                    binomial_name: [],
                    authors: []
                };
            }

            const fecha = new Date(item.public_date);
            const dia = String(fecha.getDate()).padStart(2, '0'); // Día con dos dígitos
            const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Mes con dos dígitos
            const año = fecha.getFullYear(); // Año
            const fechaFormateada = `${año}/${mes}/${dia}`;
            publicaciones[doi].public_date = fechaFormateada;

            // Agregar colecciones, nombres binomiales y autores
            if (item.col && !publicaciones[doi].col.includes(item.col)) {
                publicaciones[doi].col.push(item.col);
            }
            if (item.binomial_name && !publicaciones[doi].binomial_name.includes(item.binomial_name)) {
                publicaciones[doi].binomial_name.push(item.binomial_name);
            }

            const authorFullName = `${item.f_name || ''} ${item.s_name || ''} ${item.f_sname || ''} ${item.s_sname || ''}`.trim();
            if (authorFullName && !publicaciones[doi].authors.includes(authorFullName)) {
                publicaciones[doi].authors.push(authorFullName);
            }
        });

        // Asegurar que cada publicación tenga al menos un mensaje si no hay colecciones, especies o autores
        Object.values(publicaciones).forEach(item => {
            if (item.col.length === 0) {
                item.col = ['No tiene colecciones'];
            }
            if (item.binomial_name.length === 0) {
                item.binomial_name = ['No tiene nombres binomiales'];
            }
            if (item.authors.length === 0) {
                item.authors = ['No tiene autores'];
            }
        });

        res.json(Object.values(publicaciones));
    } catch (err) {
        console.error('Error en la base de datos:', err);
        res.status(500).send('Error en la base de datos');
    }
});

//valida e inserta los datos para crear una nueva publicacion
app.post('/api/InserPubli', async (req, res) => {
    const {
        head,
        public_date, 
        doi, 
        isbn, 
        public_country, 
        editorial_id, 
        id_inst, 
        species_ids = [], 
        author_ids = [],
        colects_ids = []
    } = req.body; // Obtener los datos del cuerpo de la solicitud

    try {
        // Verificar si el título ya existe
        const existeTitulo = await pool.query(`
            SELECT id FROM publication WHERE head = $1
        `, [head]);

        if (existeTitulo.rows.length > 0) {
            return res.status(400).json({ error: 'El título ya existe.' });
        }

        // Verificar si el ISBN ya existe
        const existeISBN = await pool.query(`
            SELECT id FROM publication WHERE isbn = $1
        `, [isbn]);

        if (existeISBN.rows.length > 0) {
            return res.status(400).json({ error: 'El ISBN ya existe.' });
        }

        // Verificar si el DOI ya existe
        const existeDOI = await pool.query(`
            SELECT id FROM publication WHERE doi = $1
        `, [doi]);  

        if (existeDOI.rows.length > 0) {
            return res.status(400).json({ error: 'El DOI ya existe.' });
        }

        const existeInst = await pool.query(`
            SELECT name FROM institution WHERE id = $1
        `, [id_inst]);  

        if (existeInst.rows.length === 0) {
            return res.status(400).json({ error: 'El Instituto no existe.' });
        }
        

        const existeEdito = await pool.query(`
            SELECT id FROM editorial WHERE id = $1
        `, [editorial_id]);  

        if (existeEdito.rows.length === 0) {
            return res.status(400).json({ error: 'La Editorial no existe.' });
        }

        // Verificar si todos los species_ids existen
        if (species_ids.length > 0) {
            const speciesQuery = `
                SELECT id FROM species WHERE id = ANY($1::int[])
            `;
            // Convertir species_ids a enteros
            const speciesIdsInt = species_ids.map(id => parseInt(id, 10));
        
            const { rows: speciesExistentes } = await pool.query(speciesQuery, [speciesIdsInt]);
        
            const speciesIdsValidos = speciesExistentes.map(row => row.id);
            const speciesIdsInvalidos = speciesIdsInt.filter(id => !speciesIdsValidos.includes(id));
        
        
            if (speciesIdsInvalidos.length > 0) {
                return res.status(400).json({ error: 'Uno o más species_ids no existen: ' + speciesIdsInvalidos.join(', ') });
            }
        }

        // Verificar si todos los author_ids existen
        if (author_ids.length > 0) {
            const authorsQuery = `
                SELECT id FROM author WHERE id = ANY($1::int[])
            `;
        
            // Convertir author_ids a enteros
            const authorIdsInt = author_ids.map(id => parseInt(id, 10));
        
            const { rows: authorsExistentes } = await pool.query(authorsQuery, [authorIdsInt]);
        
            const authorIdsValidos = authorsExistentes.map(row => row.id);
            const authorIdsInvalidos = authorIdsInt.filter(id => !authorIdsValidos.includes(id));
        
        
            if (authorIdsInvalidos.length > 0) {
                return res.status(400).json({ error: 'Uno o más author_ids no existen: ' + authorIdsInvalidos.join(', ') });
            }
        }
        

        // Verificar si todos los colects_ids existen
        if (colects_ids.length > 0) {
            const colectsQuery = `
                SELECT id FROM collection WHERE id = ANY($1::int[])
            `;
        
            // Convertir colects_ids a enteros
            const colectsIdsInt = colects_ids.map(id => parseInt(id, 10));
        
            const { rows: colectsExistentes } = await pool.query(colectsQuery, [colectsIdsInt]);
        
            const colectIdsValidos = colectsExistentes.map(row => row.id);
            const colectIdsInvalidos = colectsIdsInt.filter(id => !colectIdsValidos.includes(id));
        
     
        
            if (colectIdsInvalidos.length > 0) {
                return res.status(400).json({ error: 'Uno o más colects_ids no existen: ' + colectIdsInvalidos.join(', ') });
            }
        }
        

        await pool.query('BEGIN');

        // Insertar la nueva publicación en la tabla "publication"
        const result = await pool.query(`
            INSERT INTO publication (head, public_date, doi, isbn, public_country, id_inst, editorial_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `, [head, public_date, doi, isbn, public_country, id_inst, editorial_id]);

        const publicationId = result.rows[0].id; // Obtener el ID de la nueva publicación insertada

        // Insertar especies asociadas, si las hay
        if (species_ids.length > 0) {
            const speciesQuery = `
                INSERT INTO public_species (id_public, id_species)
                SELECT $1, UNNEST($2::int[])
                ON CONFLICT (id_public, id_species) DO NOTHING
            `;
            await pool.query(speciesQuery, [publicationId, species_ids]);
        }

        // Insertar autores asociados, si los hay
        if (author_ids.length > 0) {
            const authorsQuery = `
                INSERT INTO public_author (id_public, id_author)
                SELECT $1, UNNEST($2::int[])
                ON CONFLICT (id_public, id_author) DO NOTHING
            `;
            await pool.query(authorsQuery, [publicationId, author_ids]);
            await pool.query('COMMIT');  // Confirmar la transacción
        }

        // Insertar colecciones asociadas, si las hay
        if (colects_ids.length > 0) {
            const colectsQuery = `
                INSERT INTO public_collect (id_public, id_collect)
                SELECT $1, UNNEST($2::int[])
                ON CONFLICT (id_public, id_collect) DO NOTHING
            `;
            await pool.query(colectsQuery, [publicationId, colects_ids]);
        }

    
        res.status(201).json({ message: 'Publicación insertada con éxito' });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});


//Elimina una publicacion por medio de su id
app.post('/api/EliminaPubli', async (req, res) => {
    const { id } = req.body; // Obtener los datos del cuerpo de la solicitud

    if (!id) {
        return res.status(400).send('ID es requerido');
    }

    try {
        // Crear un array de promesas para cada DELETE
        const queries = [
            pool.query('DELETE FROM public_author WHERE id_public = $1;', [id]),
            pool.query('DELETE FROM public_collect WHERE id_public = $1;', [id]),
            pool.query('DELETE FROM public_species WHERE id_public = $1;', [id]),
            pool.query('DELETE FROM publication WHERE id = $1;', [id])
        ];

        // Ejecutar todas las consultas
        await Promise.all(queries);

        res.status(204).send(); //
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en la base de datos');
    }
});

//Cambia el nombre si es que no está en uso
app.post('/api/cambianombre', async (req, res) => {
    const { id, tituloNuevo } = req.body;
  
    try {
        const existeTitulo = await pool.query(`
            SELECT id FROM publication WHERE head = $1
        `, [tituloNuevo]);

        if (existeTitulo.rows.length > 0) {
            return res.status(400).json({ error: 'El título ya existe.' });
        }

      const result = await pool.query('UPDATE publication SET head = $1 WHERE id = $2', [tituloNuevo, id]);
  
      if (result.rowCount > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'No se encontró la publicación' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  });
//Valida y cambia la institucion
  app.post('/api/cambiainsti', async (req, res) => {
    const { id, insti } = req.body;
    let client;
    try {
        client = await pool.connect();

        // Verificar si la institución existe
        const queryInst = await client.query('SELECT name FROM institution WHERE id = $1', [insti]);
        
        if (queryInst.rows.length === 0) {
            return res.status(400).json({ error: 'El instituto no existe' });
        }

        // Actualizar la publicación con la nueva institución
        const result = await client.query('UPDATE publication SET id_inst = $2 WHERE id = $1', [id, insti]);

        if (result.rowCount > 0) {
            return res.json({ success: true });
        } else {
            return res.status(404).json({ success: false, message: 'No se encontró la publicación' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error del servidor' });
    } finally {
        if (client) client.release(); // Asegurar que la conexión se libere
    }
});


//Valida y cambia la editorial
  app.post('/api/cambiaedito', async (req, res) => {
    const { id, etorial } = req.body;
    
    try {
      const result = await pool.query('UPDATE publication SET editorial_id = $2 WHERE id = $1', [id, etorial]);
  
      if (result.rowCount > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'No se encontró la publicación' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  });
  //Valida y cambia la isbn
  app.post('/api/cambiaIsbn', async (req, res) => {
    const { id, isbnN } = req.body;
    
    try {
        const existeTitulo = await pool.query(`
            SELECT id FROM publication WHERE isbn = $1
        `, [isbnN]);

        if (existeTitulo.rows.length > 0) {
            return res.status(400).json({ error: 'El ISBN ya existe.' });
        }

      const result = await pool.query('UPDATE publication SET isbn = $2 WHERE id = $1', [id, isbnN]);
  
      if (result.rowCount > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'No se encontró la publicación' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  });
//Cambia la fecha
  app.post('/api/cambiafecha', async (req, res) => {
    const { id, fechaN } = req.body;
    
    try {
      const result = await pool.query('UPDATE publication SET public_date = $2 WHERE id = $1', [id, fechaN]);
  
      if (result.rowCount > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'No se encontró la publicación' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  });
//Asocia colecciones a una publicacion
  app.post('/api/agregar-colecciones', async (req, res) => {
    const { publicacionId, coleccionIds } = req.body;

    if (!publicacionId || !coleccionIds || coleccionIds.length === 0) {
        return res.status(400).json({ error: 'Faltan datos o son inválidos' });
    }

    const client = await pool.connect();

    try {
        // Verificar si las colecciones existen
        const queryColeccion = `
            SELECT id FROM collection 
            WHERE id = ANY($1::int[])
        `;
        const { rows: coleccionesExistentes } = await client.query(queryColeccion, [coleccionIds]);

        // Identificar las colecciones existentes y las no existentes
        const coleccionesExistentesIds = coleccionesExistentes.map(coleccion => coleccion.id);
        const coleccionesNoExistentes = coleccionIds.filter(coleccionId => !coleccionesExistentesIds.includes(Number(coleccionId)));

        // Si hay colecciones no existentes, devolver un error
        if (coleccionesNoExistentes.length > 0) {
            return res.status(400).json({ error: 'Una o más colecciones no existen, no se realizará ninguna inserción.' });
        }

        // Iniciar una transacción para garantizar consistencia
        await client.query('BEGIN');

        const queryInsert = `
            INSERT INTO public_collect (id_public, id_collect)
            VALUES ($1, $2)
            ON CONFLICT (id_public, id_collect) DO NOTHING
        `;

        // Insertar las colecciones existentes
        for (const coleccionId of coleccionesExistentesIds) {
            await client.query(queryInsert, [publicacionId, coleccionId]);
        }

        // Finalizar la transacción
        await client.query('COMMIT');
        res.json({ message: 'Colecciones agregadas correctamente o ya existentes.' });

    } catch (err) {
        console.error(err);
        await client.query('ROLLBACK');  // Revertir si hay un error
        res.status(500).json({ error: 'Error en la base de datos' });
    } finally {
        client.release();  // Liberar la conexión en cualquier caso
    }
});


//Elimina una publicacion de una coleccion
app.post('/api/eliminar-colecciones', async (req, res) => {
    const { publicacionId, coleccionIds } = req.body;

    // Validar entrada
    if (!publicacionId || !Array.isArray(coleccionIds) || coleccionIds.length === 0) {
        return res.status(400).json({ error: 'Faltan datos o son inválidos' });
    }

    const client = await pool.connect(); // Mover la conexión aquí para asegurar su liberación en el finally

    try {
        // Iniciar una transacción
        await client.query('BEGIN');

        const query = `
            DELETE FROM public_collect WHERE id_public = $1 AND id_collect = $2
        `;

        // Eliminar colecciones
        for (const coleccionId of coleccionIds) {
            await client.query(query, [publicacionId, coleccionId]);
        }

        // Finalizar la transacción
        await client.query('COMMIT');
        res.json({ message: 'Colecciones eliminadas correctamente o no existentes' });
    } catch (err) {
        console.error(err);
        await client.query('ROLLBACK');  // Revertir si hay un error
        res.status(500).json({ error: 'Error en la base de datos' });
    } finally {
        client.release();  // Liberar el cliente en el bloque finally
    }
});

//Agrega autores a una publicacion
app.post('/api/agregar-autores', async (req, res) => {
    const { publicacionId, autoresIds } = req.body;
    if (!publicacionId || !autoresIds || autoresIds.length === 0) {
        return res.status(400).json({ error: 'Faltan datos o son inválidos' });
    }

    const client = await pool.connect();  // Obtener la conexión

    try {
        // Verificar si los autores existen en una sola consulta
        const queryAutor = `
            SELECT id FROM author 
            WHERE id = ANY($1::int[])
        `;
        const { rows: autoresExistentes } = await client.query(queryAutor, [autoresIds]);
        
        // Identificar autores no existentes
        const autoresExistentesIds = autoresExistentes.map(autor => autor.id);
        const autoresNoExistentes = autoresIds.filter(autorId => !autoresExistentesIds.includes(Number(autorId)));
        console.log(autoresNoExistentes);
        if (autoresNoExistentes.length > 0) {
            return res.status(400).json({ error: 'Uno o más autores no existen, no se realizará ninguna inserción.' });
        }

        // Iniciar una transacción
        await client.query('BEGIN');

        const query = `
            INSERT INTO public_author (id_public, id_author)
            VALUES ($1, $2)
            ON CONFLICT (id_public, id_author) DO NOTHING
        `;

        // Insertar todos los autores existentes
        for (const autorId of autoresExistentesIds) {
            await client.query(query, [publicacionId, autorId]);
        }

        // Finalizar la transacción
        await client.query('COMMIT');
        res.json({ message: 'Autores agregados correctamente.' });

    } catch (err) {
        console.error(err);
        await client.query('ROLLBACK');  // Revertir si hay un error
        res.status(500).json({ error: 'Error en la base de datos' });

    } finally {
        client.release();  // Liberar la conexión en cualquier caso
    }
});

//Eliminar un autor de una publicacion

app.post('/api/eliminar-autores', async (req, res) => {
    const { publicacionId, autoresIds } = req.body;

    if (!publicacionId || !autoresIds || autoresIds.length === 0) {
        return res.status(400).json({ error: 'Faltan datos o son inválidos' });
    }

    try {
        const client = await pool.connect();

        // Iniciar una transacción
        await client.query('BEGIN');

        const query = `
            DELETE FROM public_author WHERE id_public = $1 AND id_author = $2
        `;

        for (const autorId of autoresIds) {
            await client.query(query, [publicacionId, autorId]);
        }

        // Finalizar la transacción
        await client.query('COMMIT');
        client.release();

        res.json({ message: 'Autores elimandos correctamente o no existentes' });
    } catch (err) {
        console.error(err);
        await client.query('ROLLBACK');  // Revertir si hay un error
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});

//Valida y cambia el doi
app.post('/api/cambiaDoi', async (req, res) => {
    const { id, DoiN } = req.body;
    
    try {

        const existeTitulo = await pool.query(`
            SELECT id FROM publication WHERE doi = $1
        `, [DoiN]);

        if (existeTitulo.rows.length > 0) {
            return res.status(400).json({ error: 'El DOI ya existe.' });
        }

      const result = await pool.query('UPDATE publication SET doi = $2 WHERE id = $1', [id, DoiN]);
  
      if (result.rowCount > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'No se encontró la publicación' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  });

//cambia el pais de publicacion de una publicacion
app.post('/api/cambiarPais', async (req, res) => {
    const { id, NP } = req.body; 
    
    try {
        const result = await pool.query('UPDATE publication SET public_country = $2 WHERE id = $1', [id, NP]);
  
        if (result.rowCount > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'No se encontró la publicación' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});
app.post('/api/agregar-especies', async (req, res) => {
    const { publicacionId, speciesIds } = req.body;

    if (!publicacionId || !speciesIds || speciesIds.length === 0) {
        return res.status(400).json({ error: 'Faltan datos o son inválidos' });
    }

    const client = await pool.connect();

    try {
        // Verificar si las especies existen en una sola consulta
        const queryEspecie = `
            SELECT id FROM species 
            WHERE id = ANY($1::int[])
        `;
        const { rows: especiesExistentes } = await client.query(queryEspecie, [speciesIds]);
        
        // Identificar las especies existentes y las no existentes
        const especiesExistentesIds = especiesExistentes.map(especie => especie.id);
        const especiesNoExistentes = speciesIds.filter(speciesId => !especiesExistentesIds.includes(Number(speciesId)));


        // Si hay especies no existentes, devolver un error
        if (especiesNoExistentes.length > 0) {
            return res.status(400).json({ error: 'Uno o más especies no existen, no se realizará ninguna inserción.' });
        }

        // Iniciar una transacción para garantizar consistencia
        await client.query('BEGIN');

        const queryInsert = `
            INSERT INTO public_species (id_public, id_species)
            VALUES ($1, $2)
            ON CONFLICT (id_public, id_species) DO NOTHING
        `;

        // Insertar las especies existentes
        for (const speciesId of especiesExistentesIds) {
            await client.query(queryInsert, [publicacionId, speciesId]);
        }

        // Finalizar la transacción
        await client.query('COMMIT');
        res.json({ message: 'Especies agregadas correctamente o ya existentes.' });
    } catch (err) {
        console.error(err);
        await client.query('ROLLBACK');  // Revertir si hay un error
        res.status(500).json({ error: 'Error en la base de datos' });
    } finally {
        client.release();  // Liberar la conexión en cualquier caso
    }
});


//Elimianar especies de una publicacion
app.post('/api/eliminar-especies', async (req, res) => {
    const { publicacionId, speciesIds } = req.body;

    if (!publicacionId || !speciesIds || speciesIds.length === 0) {
        return res.status(400).json({ error: 'Faltan datos o son inválidos' });
    }

    try {
        const client = await pool.connect();

        // Iniciar una transacción para garantizar consistencia
        await client.query('BEGIN');

        const query = `
           DELETE FROM public_species WHERE id_public = $1 AND id_species = $2
        `;

        for (const speciesId of speciesIds) {
            await client.query(query, [publicacionId, speciesId]);
        }

        // Finalizar la transacción
        await client.query('COMMIT');
        client.release();

        res.json({ message: 'Especies eliminadas correctamente o no existentes' });
    } catch (err) {
        console.error(err);
        await client.query('ROLLBACK');  // Revertir si hay un error
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});
//Asegurar la conexion
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
