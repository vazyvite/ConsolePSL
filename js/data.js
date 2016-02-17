(function () {
	"use strict";

	function Demarche(name, code, actions, dir) {
		var that = this;
		that.name = name || null;
		that.code = code || null;
		that.dir = dir || null;
		that.hasAction = (actions != null && actions.length ? true : false);
		that.listeActions = actions || [];
	}

	window.app = {
		data: {
			listeDemarches: []
		},
		core: {
			new: {
				demarche: function (name, code, actions, dir) { return new Demarche(name, code, actions, dir); }
			}
		}
	};

	// création des démarches
	window.app.data.listeDemarches.push(new Demarche("ILE", "ILE", [], "ILE"));
	window.app.data.listeDemarches.push(new Demarche("RCO", "recensementCitoyen", [], "RCO"));
	window.app.data.listeDemarches.push(new Demarche("IRF", "INSRegistreFR", ["INSCRIPTION", "MODIFICATION", "RENOUVELLEMENT", "RESILIATION"], "IRF"));
	window.app.data.listeDemarches.push(new Demarche("DICPE", "DICPE", [], "DICPE"));
	window.app.data.listeDemarches.push(new Demarche("eCreation", "CR", [], "ECREA"));
	window.app.data.listeDemarches.push(new Demarche("eModification", "MD", [], "EMODIF"));
	window.app.data.listeDemarches.push(new Demarche("eSubvention", "eSubvention", ["RECHERCHE"], "ESUB"));
}());
