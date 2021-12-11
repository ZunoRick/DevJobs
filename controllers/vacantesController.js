// const Vacante = require('../models/Vacantes');
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const { validationResult } = require('express-validator');
const { validarFormVacante } = require('./../helpers/funciones');
const multer = require('multer');
const shortid = require('shortid');

exports.formularioNuevaVacante = (req, res) => {
	res.render('nueva-vacante', {
		nombrePagina: 'Nueva Vacante',
		tagline: 'Llena el formulario y publica tu vacante',
		cerrarSesion: true,
		nombre: req.user.nombre,
		imagen: req.user.imagen
	});
};

//Agregar las vacantes a la base de datos
exports.agregarVacante = async (req, res) => {
	const vacante = new Vacante(req.body);

	//Usuario autor de la vacante
	vacante.autor = req.user._id;

	//Crear arreglo de skills
	vacante.skills = req.body.skills.split(',');

    //validar el formulario
	const rules = validarFormVacante();
	await Promise.all(rules.map((validation) => validation.run(req)));
	const errores = validationResult(req);

	if (!errores.isEmpty()) {
        req.flash(
			'error',
			errores.array().map((error) => error.msg)
		);
		res.render('nueva-vacante', {
            vacante,
			nombrePagina: 'Nueva Vacante',
			tagline: 'Llena el formulario y publica tu vacante',
			cerrarSesion: true,
			nombre: req.user.nombre,
			mensajes: req.flash(),
			imagen: req.user.imagen
		});
		return;
	}
	//Almacenarlo en la BD
	const nuevaVacante = await vacante.save();

	//Redireccionar
	res.redirect(`/vacantes/${nuevaVacante.url}`);	
};

//Muestra una vacante
exports.mostrarVacante = async (req, res, next) => {
	const vacante = await Vacante.findOne({
		url: req.params.url,
	})
	.populate('autor');

	//Si no hay resultados
	if (!vacante) return next();

	res.render('vacante', {
		vacante,
		nombrePagina: vacante.titulo,
		barra: true,
	});
};

exports.formEditarVacante = async (req, res, next) => {
	const vacante = await Vacante.findOne({
		url: req.params.url,
	});

	//Si no hay resultados
	if (!vacante) return next();

	res.render('editar-vacante', {
		vacante,
		nombrePagina: `Editar - ${vacante.titulo}`,
		cerrarSesion: true,
		nombre: req.user.nombre,
		imagen: req.user.imagen
	});
};

exports.editarVacante = async (req, res) => {
    let vacante = await Vacante.findOne({
		url: req.params.url
	});

    //validar el formulario
	const rules = validarFormVacante();
	await Promise.all(rules.map((validation) => validation.run(req)));
	const errores = validationResult(req);

	if (!errores.isEmpty()) {
        req.flash(
			'error',
			errores.array().map((error) => error.msg)
		);
		res.render('editar-vacante', {
			vacante,
            nombrePagina: `Editar - ${vacante.titulo}`,
			cerrarSesion: true,
			nombre: req.user.nombre,
			mensajes: req.flash(),
			imagen: req.user.imagen
		});
        return; 
	}

    const vacanteActualizada = req.body;

	vacanteActualizada.skills = req.body.skills.split(',');
    
    vacante = await Vacante.findOneAndUpdate({
        url: req.params.url
    }, 
    vacanteActualizada,{
        new: true,
        runValidators: true
    });
    res.redirect(`/vacantes/${vacante.url}`);
};

exports.eliminarVacante = async (req, res) => {
	const { id } = req.params;
	const vacante = await Vacante.findById(id);

	if(verificarAutor(vacante, req.user)){
		//Todo bien, si es el usuario, eliminar
		vacante.remove();
		res.status(200).send('Vacante Eliminada Correctamente');
	}else {
		//No permitido
		res.status(403).send('Error');
	}

}

const verificarAutor = (vacante = {}, usuario = {}) => {
	return ((!vacante.autor.equals(usuario._id)) ? false : true);
}

//Subir archivos en PDF
exports.subirCV = (req, res, next) => {
	upload(req, res, function(error){
		if(error){
			// console.log(error);
			if(error instanceof multer.MulterError){
				if (error.code === 'LIMIT_FILE_SIZE') {
					req.flash('error', 'El archivo es muy grande: Máximo 100kb');
				} else {
					req.flash('error', error.MulterError);
				}
			} else{
				req.flash('error', error.message);
			}
			res.redirect('back');
			return;
		}else{
			return next();
		}
	});
}

//opciones de Multer
const configuracionMulter = {
	limits: { fileSize: 100000}, // 1000 kbytes
	storage: fileStorage = multer.diskStorage({
		destination: (req, file, cb) =>{
			cb(null, __dirname+'../../public/uploads/cv');
		},
		filename: (req, file, cb) => {
			// console.log(file);
			const extension = file.mimetype.split('/')[1];
			cb(null, `${shortid.generate()}.${extension}`);
		}
	}),
	fileFilter(req, file, cb){
		if(file.mimetype === 'application/pdf'){
			//el callback se ejecuta como true o false: true cuando la imagen se acepta
			cb(null, true);
		}else{
			cb(new Error('Formato No Válido'));
		}
	}
}

const upload = multer(configuracionMulter).single('cv');

//Almacenar los candidatos en la BD
exports.contactar = async (req, res, next) =>{
	const vacante = await Vacante.findOne({ url: req.params.url});

	//No existe la vacante
	if (!vacante) return next();

	//Todo bien, construir el nuevo objeto
	const nuevoCandidato = {
		nombre: req.body.nombre,
		email: req.body.email,
		cv: req.file.filename
	}

	//Almacenar la vacante
	vacante.candidatos.push(nuevoCandidato);
	await vacante.save();

	//mensaje flash y redirección
	req.flash('correcto', 'Se envió tu CV correcctamente');
	res.redirect('/');
}

exports.mostrarCandidatos = async (req, res, next) =>{
	const vacante = await Vacante.findById(req.params.id);

	if(vacante.autor != req.user._id.toString())
		return next();
	
	if (!vacante) return next();
	
	res.render('candidatos', {
		nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
		cerrarSesion: true,
		nombre: req.user.nombre,
		imagen: req.user.imagen,
		candidatos: vacante.candidatos
	});
}

exports.buscarVacantes = async (req, res) =>{
	const vacantes = await Vacante.find({
		$text: {
			$search: req.body.q
		}
	});

	//mostrar las vacantes
	res.render('home', {
		nombrePagina: `Resultados para la búsqueda: ${req.body.q}`,
		barra: true,
		vacantes
	});
}
