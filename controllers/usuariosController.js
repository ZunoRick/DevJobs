const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');
const { validationResult } = require('express-validator');
const { validarFormRegistro, formEditarPerfil } = require('./../helpers/funciones');

exports.formCrearCuenta = (req, res) => {
	res.render('crear-cuenta', {
		nombrePagina: 'Crea tu cuenta en devJobs',
		tagline:
			'Comienza a publicar tus vacantes gratis, sólo debes crear una cuenta.',
	});
};

exports.validarRegistro = async (req, res, next) => {
	//sanitizar los campos
	const rules = validarFormRegistro(req);

	await Promise.all(rules.map((validation) => validation.run(req)));
	const errores = validationResult(req);
    
	//si hay errores
    // console.log(errores);
	if (!errores.isEmpty()) {
		req.flash(
			'error',
			errores.array().map((error) => error.msg)
		);
		res.render('crear-cuenta', {
			nombrePagina: 'Crea una cuenta en Devjobs',
			tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
			mensajes: req.flash(),
		});
		return;
	}

	//si toda la validacion es correcta
	next();
};

exports.crearUsuario = async (req, res, next) => {
	// Crear usuario
	const usuario = new Usuarios(req.body);

	try {
		await usuario.save();
		res.redirect('/iniciar-sesión');
	} catch (error) {
		req.flash('error', error);
		res.redirect('/crear-cuenta');
	}
};

//formulario para iniciar sesión
exports.formIniciarSesion = (req, res) => {
	res.render('iniciar-sesion', {
		nombrePagina: 'Iniciar Sesión devJobs'
	});
}

exports.formEditarPerfil = async (req, res) =>{
	const usuario = await Usuarios.findOne({ email: req.user.email });
	res.render('editar-perfil', {
		nombrePagina: 'Edita tu Perfil de devJobs',
		usuario,
		cerrarSesion: true,
        nombre: req.user.nombre,
	});
}

//Guardar cambios editar perfil
exports.editarPerfil = async (req, res) =>{
	const usuario = await Usuarios.findById(req.user._id);

	//sanitizar los campos
	const rules = formEditarPerfil();

	await Promise.all(rules.map((validation) => validation.run(req)));
	const errores = validationResult(req);
	if (!errores.isEmpty()) {
		req.flash(
			'error',
			errores.array().map((error) => error.msg)
		);
		res.render('editar-perfil', {
			nombrePagina: 'Edita tu Perfil de devJobs',
			usuario: req.user,
			cerrarSesion: true,
			nombre: req.user.nombre,
			mensajes: req.flash(),
		});
		return;
	}

	usuario.nombre = req.body.nombre;
	usuario.email = req.body.email;

	if(req.body.password){
		usuario.password = req.body.password;
	}

	await usuario.save();

	req.flash('correcto', 'Cambios guardados Correctamente');
	res.redirect('/administracion');
}
