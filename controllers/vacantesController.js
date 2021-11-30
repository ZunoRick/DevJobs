// const Vacante = require('../models/Vacantes');
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const { validationResult } = require('express-validator');
const { validarFormVacante } = require('./../helpers/funciones');

exports.formularioNuevaVacante = (req, res) => {
	res.render('nueva-vacante', {
		nombrePagina: 'Nueva Vacante',
		tagline: 'Llena el formulario y publica tu vacante',
		cerrarSesion: true,
		nombre: req.user.nombre,
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
	});

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
