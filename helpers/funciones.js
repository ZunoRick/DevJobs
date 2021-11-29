const { body } = require('express-validator');

exports.validarFormVacante = () =>{
    const rules = [
		body('titulo')
			.not()
			.isEmpty()
            .trim()
			.withMessage('Agrega un título a la vacante')
			.escape(),
		body('empresa')
            .not()
            .isEmpty()
            .trim()
			.withMessage('Agrega una empresa')
            .escape(),
		body('ubicacion')
            .not()
            .isEmpty()
            .trim()
			.withMessage('Agrega una ubicación')
			.escape(),
        body('salario')
            .escape(),
		body('contrato')
			.not()
			.isEmpty()
			.withMessage('Selecciona el tipo de contrato')
			.escape(),
		body('skills')
            .notEmpty()
			.withMessage('Agrega al menos una habilidad')
            .escape(),
	];
    return rules;
}

exports.validarFormRegistro = (req) => {
    const rules = [
		body('nombre')
			.not()
			.isEmpty()
            .trim()
			.withMessage('El nombre es obligatorio')
			.escape(),
		body('email')
			.isEmail()
			.withMessage('El email es obligatorio')
			.normalizeEmail(),
		body('password')
			.not()
			.isEmpty()
			.withMessage('El password es obligatorio')
			.escape(),
		body('confirmar')
			.not()
			.isEmpty()
			.withMessage('Confirmar password es obligatorio')
			.escape(),
		body('confirmar')
			.equals(req.body.password)
			.withMessage('Los passwords no son iguales'),
	];
    return rules;
};

exports.formEditarPerfil = () =>{
    const rules = [
        body('nombre')
			.not()
			.isEmpty()
            .trim()
			.withMessage('El nombre no puede ir vacío')
			.escape(),
		body('email')
			.isEmail()
			.withMessage('El email no puede ir vacío')
			.normalizeEmail(),
		body('password')
            .trim()
			.escape()
    ];
    return rules;
}