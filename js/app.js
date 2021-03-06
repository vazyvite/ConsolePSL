/*jslint eqeq: true, plusplus: true, indent: 4*/
/*globals app, require, jQuery, console, alert, Notification*/

(function ($) {
	'use strict';

	window.app = {};

	/**
	 * Objet informations de Démarche.
	 * Contient les informations de déploiement de la démarche
	 */
	function DemarcheInfos() {
		var that = this;
		that.code = "";
		that.codeDemarche = "";
		that.versionServices = "";
		that.versionFramework = "";
	}

	/**
	 * Objet ActionDemarche
	 * Contient les actions secondaires associées à la démarche
	 * @param {string} name        le nom de l'action
	 * @param {string} className   la classe associée à l'action
	 * @param {string} description la description de l'action
	 */
	function ActionDemarche(name, className, description) {
		var that = this;
		that.name = name || "";
		that.className = className || "";
		that.description = description || "";
	}

	/**
	 * incrémentation de l'étape de chargement
	 * @param {object}  $that  l'objet source
	 * @param {boolean} isInit indique si l'étape doit être réinitialisée
	 */
	function incrementEtape($that, isInit) {
		if (isInit) {
			$that.data("etape", 0);
		} else {
			var etapeChargement = parseInt($that.data("etape"), 10) || 0;
			etapeChargement = etapeChargement + 1;
			$that.data("etape", etapeChargement);
		}
	}

	var DIR_BATCH = "./bat",
		CORE_DIR = null,
		deployInfos = {
			services: "",
			demarches: []
		},
		ui = {
			/**
			 * Création de la table des démarches
			 */
			creerTableDemarches: function () {
				var $table = $("#listeProjets tbody"),
					i = 0;
				$table.children().remove();
				if (!app.data.hasOwnProperty("listeDemarches")) {
					app.data.listeDemarches = [];
				}
				for (i; i < app.data.listeDemarches.length; i++) {
					ui.creerTableLineDemarche(app.data.listeDemarches[i], $table);
				}
			},

			createDropdownActions: function (action) {
				var $li = $("<li>");
				$("<a>").attr({
					href: "#",
					title: action.description
				}).text(action.name).addClass(action.className).appendTo($li);
				return $li;
			},

			creerActionsDropDown: function (idDemarche, demarche) {
				var $btnGroup = $("<div>").addClass("btn-group"),
					btnCaret = null,
					listeActions = null,
					i = 0,
					listeActionDD = [
						new ActionDemarche("Déploy complet", "deployFull", "Déploiement complet (démarche + services)"),
						new ActionDemarche("Déploy simple", "deploySimple", "Déploiement de la démarche sans les services et sans build"),
						new ActionDemarche("Build", "buildSimple", "Build de la démarche (sans déploiement)")
					],
					btnPrincipal = $("<button>").attr({
						title: "builder et déployer la démarche " + demarche.name,
						id: "build" + demarche.code,
						'aria-describedby': idDemarche,
						type: "button"
					}).addClass("btn btn-default build").appendTo($btnGroup);
				// glyphicon du bouton principal
				$("<span>").addClass("glyphicon glyphicon-send").appendTo(btnPrincipal);
				// le bouton Caret
				btnCaret = $("<button>").attr({
					type: "button",
					'data-toggle': "dropdown",
					"aria-haspopup": "true",
					"aria-expanded": "false"
				}).addClass("btn btn-default dropdown-toggle").appendTo($btnGroup);
				// l'icone caret
				$("<span>").addClass("caret").appendTo(btnCaret);
				// la liste d'actions
				listeActions = $("<ul>").addClass("dropdown-menu dropdown-menu-right").appendTo($btnGroup);
				for (i; i < listeActionDD.length; i++) {
					ui.createDropdownActions(listeActionDD[i]).appendTo(listeActions);
				}
				return $btnGroup;
			},

			/**
			 * Création d'une ligne de démarche dans la table
			 * @param {object} demarche un objet Demarche
			 * @param {object} $table   la table
			 */
			creerTableLineDemarche: function (demarche, $table) {
				var idDemarche = "lblDemarche_" + demarche.name,
					$ligne = $("<tr>").attr("data-codeDemarche", demarche.name).data({demarche: demarche}),
					$cel1 = $("<td>").attr("id", "lblDemarche_" + demarche.name),
					$infosDemarche = $("<details>").appendTo($cel1),
					$cel2 = $("<td>"),
					$contentInfosDemarche = null,
					btnGroup = null,
					btnCaret = null,
					btnListe = null,
					elementListe = null;
				$("<summary>").text(demarche.name).appendTo($infosDemarche);
				$contentInfosDemarche = $("<div>").addClass("container").appendTo($infosDemarche);
				ui.createFormGroupStatic("version services : ", "", demarche.name, "infosDemarche-vServices", null).appendTo($contentInfosDemarche);
				ui.createFormGroupStatic("version framework : ", "", demarche.name, "infosDemarche-vFramework", null).appendTo($contentInfosDemarche);
				ui.createFormGroupStatic("dernier déploiement : ", "", "", "infosDemarche-lastModified", "glyphicon-time").appendTo($contentInfosDemarche);
				$cel1.appendTo($ligne);
				ui.creerActionsDropDown(idDemarche, demarche).appendTo($cel2);
				$("<button>").attr({
					title: "voir les logs de la démarche " + demarche.name,
					id: "logs" + demarche.code,
					'aria-describedby': idDemarche
				}).addClass("btn btn-default showLogs glyphicon glyphicon-modal-window").data({demarche: demarche}).appendTo($cel2);
				$cel2.appendTo($ligne);
				$ligne.appendTo($table);
			},

			/**
			 * création d'un élément de formulaire form-group-static
			 * @param   {string} label     le label
			 * @param   {string} text      le texte
			 * @param   {string} id        l'identifiant du champ
			 * @param   {string} className la classe associée au champ
			 * @param   {string} icon	   l'icone associée au champ
			 * @returns {object} l'objet form-group-static
			 */
			createFormGroupStatic: function (label, text, id, className, icon) {
				var $formGroup = $("<div>").addClass("form-group row"),
					$groupField = $("<div>").addClass("col-xs-6");
				$("<label>").addClass("control-label col-xs-6").text(label).attr("for", "input_" + id).appendTo($formGroup);
				$groupField.appendTo($formGroup);
				if (icon != null) {
					$("<span>").addClass("glyphicon " + icon).appendTo($groupField);
				}
				$("<span>").addClass("form-control-static " + className).text(text).appendTo($groupField);
				return $formGroup;
			},

			/**
			 * Construit les informations de déploiement des démarches.
			 * @param {object} infosDemarche les informations de la démarche en cours de déploiement
			 */
			drawDeployInfosDemarche: function (infosDemarche) {
				var $ul = $("#deploy-info-demarches");
				if (!$ul.find("." + infosDemarche.code).size()) {
					$("<li>").addClass("list-group-item undeploy " + infosDemarche.code).attr({
						"data-codeDemarche": infosDemarche.code,
						"title": "désinstaller la démarche " + infosDemarche.code
					}).text(infosDemarche.code).appendTo($ul);
				}
			}
		},
		loader = {
			/**
			 * Ajoute un loader sur un élément cible
			 * @param {object} $cible la cible du loader
			 */
			add: function ($cible) {
				if ($cible != null) {
					var id = "loader_" + new Date().getTime(),
						$loader = $("<div>").addClass("loader").attr("id", id).css({
							top: $cible.offset().top,
							left: $cible.offset().left,
							width: $cible.outerWidth(),
							height: $cible.outerHeight()
						}).data({
							cible: $cible
						}).appendTo("body");
					$("<span>").addClass("loader-etape").text("").appendTo($loader);
					$cible.data("loader", id);
					$cible.find(".btn-group button").attr("disabled", "disabled");
				}
			},

			/**
			 * Modifie la position et la taille du loader.
			 * @param {object} $cible la cible du loader
			 */
			reset: function ($cible) {
				if ($cible != null) {
					var $loader = $("#" + $cible.data("loader"));
					$loader.css({
						top: $cible.offset().top,
						left: $cible.offset().left,
						width: $cible.outerWidth(),
						height: $cible.outerHeight()
					});
				}
			},

			/**
			 * Supprime un loader de l'élément cible
			 * @param {object} $cible la cible du loader
			 */
			remove: function ($cible) {
				if ($cible != null) {
					var loader = $("#" + $cible.data("loader"));
					loader.remove();
					$cible.data("loader", null);
					$cible.find(".btn-group button").attr("disabled", false);
				}
			},

			/**
			 * Avance la barre de chargement.
			 * @param {object}  $cible    l'objet correspondant à la ligne pour laquelle le loader doit être avancé
			 * @param {string}  scenario  le nom du scéario
			 * @param {string}  step      le nom de l'étape
			 * @param {number}  nbEtapes	le nombre d'étapes dans le scénario
			 * @param {boolean} increment	si on doit incrémenter le loader
			 */
			update: function ($cible, scenario, step, nbEtapes, increment) {
				if ($cible != null) {
					if (increment) {
						incrementEtape($cible, false);
					}
					var $parent = $cible.parents("tr:first"),
						etape = $cible.data("etape"),
						loader = $("#" + $parent.data("loader")),
						progressbar = loader.find(".progressbar"),
						pasAvancement = 100 / nbEtapes;
					if (!progressbar.size()) {
						$("<div>").addClass("progressbar").appendTo(loader);
						progressbar = loader.find(".progressbar");
					}
					loader.find(".loader-etape").text(scenario + "-" + step);
					progressbar.css("width", (pasAvancement * etape) + "%");
				}
			},

			/**
			 * Réinitialisation de tous les loaders.
			 */
			resetAll: function () {
				$(".loader").each(function () {
					var $cible = $(this).data("cible");
					if ($cible != null) {
						loader.reset($cible);
					}
				});
			}
		},
		utils = {
			/**
			 * Indique si l'option "Déployer le bouchon PREC" a été activé
			 * @returns {boolean}
			 */
			isBouchonPREC: function () {
				return ($("#deployerBouchonPREC").is(":checked")) ? true : false;
			},
			
			/**
			 * Indique si l'option "Générer le service Stubbed" a été activée
			 * @returns {boolean}
			 */
			isStubbed: function () {
				return ($("#isStubbed").is(":checked")) ? true : false;
			},

			/**
			 * Indique si l'option "Générer les données spécifiques.
			 * @returns {boolean}
			 */
			isResetDonneesSpecifiques: function () {
				return ($("#isResetDonneesSpecifiques").is(":checked")) ? true : false;
			},

			/**
			 * Indique si l'option "Déploiement des services obligatoire" a été activée
			 * @returns {boolean}
			 */
			isServicesMandatory: function () {
				return ($("#isServicesMandatory").is(":checked")) ? true : false;
			},

			/**
			 * Indique si la version est une snapshot ou une release
			 * @param   {string}  version la version à tester
			 * @returns {boolean}
			 */
			isSnapshot: function (version) {
				return (version.match(/SNAPSHOT/ig)) ? true : false;
			},

			/**
			 * Indique si on doit aller chercher le projet sur la branche ou sur le tronc
			 * @param   {string}  version la version du projet
			 * @returns {boolean}
			 */
			isBranche: function (version) {
				return (version.match(/^1\.0/ig)) ? true : false;
			},

			/**
			 * Retourne la version des services en faisant la distinction entre les services classiques et les services stubbés.
			 * @param   {object} infosDemarche informations sur la démarche en cours
			 * @returns {string} la version de la démarche suffixé de "S" si la version des services correspond à une version stubbé.
			 */
			getVersionServices: function (infosDemarche) {
				var version = "";
				if (infosDemarche != null) {
					if (utils.isStubbed(infosDemarche)) {
						version = infosDemarche.versionServices + "S";
					} else {
						version = infosDemarche.versionServices;
					}
				}
				return version;
			},

			/**
			 * Créé une erreur et supprime le loader.
			 * @param {object} $that  l'objet sur lequel l'erreur a eu lieu
			 * @param {string} stdout les logs d'erreur
			 */
			createErreur: function ($that, log, description, infosDemarche) {
				var message = $that.data("logs") || "";
				$that.parents("tr:first").data("logs", message + "\n" + log).removeClass("success").addClass("danger");
				loader.remove($that.parents("tr:first"));
				new Notification("Echec", {body: (description) ? "Echec du déploiement de la démarche.\n" + description : "Echec du déploiement de la démarche."});
			},

			/**
			 * Créé un log
			 * @param {object} $that l'objet source
			 * @param {string} logs  les logs à ajouter
			 */
			createLog: function ($that, logs) {
				$that.parents("tr:first").data("logs", $that.data("logs") + "\n" + logs);
			},

			/**
			 * Récupération du chemin des services en fonction de la branche / tronc et snapshot / release
			 * @param   {object} infosDemarche informations sur la démarche à déployer
			 * @returns {string} le chemin du projet services
			 */
			getServicesPath: function (infosDemarche) {
				var path = "";
				if (utils.isSnapshot(infosDemarche.versionServices)) {
					path = (utils.isBranche(infosDemarche.versionServices)) ? app.settings.dir.brancheServices : app.settings.dir.trunkServices;
				} else {
					path = app.settings.dir.versionServices + "\\psl-services-" + infosDemarche.versionServices;
				}
				return path;
			},

			/**
			 * Récupération du chemin du framework en fonction de la branche / tronc et snapshot / release
			 * @param   {object} infosDemarche informations sur la démarche à déployer
			 * @returns {string} le chemin du projet services
			 */
			getFrameworkPath: function (infosDemarche) {
				var path = "";
				if (utils.isSnapshot(infosDemarche.versionFramework)) {
					path = (utils.isBranche(infosDemarche.versionFramework)) ? app.settings.dir.brancheServices + "\\psl-demarche-framework" : app.settings.dir.trunkframework + "\\trunk";
				} else {
					path = (utils.isBranche(infosDemarche.versionFramework)) ? app.settings.dir.versionServices + "\\psl-services-" + infosDemarche.versionFramework + "\\psl-demarche-framework" : app.settings.dir.trunkframework + "\\tags\\psl-demarche-framework-" + infosDemarche.versionFramework;
				}
				return path;
			},

			/**
			 * Calcul le nombre d'étapes nécessaires pour un scénario.
			 * @param   {object}  deployInfos       les informations de déploiement
			 * @param   {number}  base              le nombre d'étapes de base
			 * @param   {boolean} servicesMandatory indique si les services sont requis
			 * @returns {number}  le nombre d'étapes
			 */
			calculerEtapes: function (infosDemarches, nbEtapesBase, servicesMandatory) {
				if (isNaN(nbEtapesBase)) {
					nbEtapesBase = 0;
				}
				var nbEtapes = nbEtapesBase;
				// si les services sont requis
				if (servicesMandatory || (utils.isServicesMandatory() && utils.getVersionServices(infosDemarches) != deployInfos.services)) {
					nbEtapes += 7;
					// si les services stubbés sont requis
					if (utils.isStubbed()) {
						nbEtapes += 3;
					}
				}
				// si la réinitialisation des données spécifiques sont requises
				if (utils.isResetDonneesSpecifiques()) {
					nbEtapes += 1;
				}
				// on ajoute toujours 1 au nombre d'étapes.
				nbEtapes += 1;
				return nbEtapes;
			}
		},
		bat = {
			/**
			 * Joue un maven clean sur le chemin
			 * @param {object}   $that    l'objet source
			 * @param {string}   path     le chemin du projet à cleaner
			 * @callback	callback
			 */
			clean: function ($that, path, callback) {
				require('child_process').exec('cmd /c mvn-clean.bat "' + path + '"', {
					cwd: DIR_BATCH
				}, function (err, stdout, stderr) {
					if (err) {
						utils.createErreur($that, stdout, null);
					} else if ($.isFunction(callback)) {
						utils.createLog($that, stdout);
						callback();
					}
				});
			},

			/**
			 * Joue un maven install sur le chemin
			 * @param {object} $that l'objet source
			 * @param {string} path  le chemin du projet à installer
			 * @callback callback
			 */
			install: function ($that, path, callback) {
				require('child_process').exec('cmd /c mvn-install.bat "' + path + '"', {
					cwd: DIR_BATCH,
					maxBuffer: 1024 * 500
				}, function (err, stdout, stderr) {
					if (err) {
						utils.createErreur($that, stdout, null);
					} else {
						utils.createLog($that, stdout);
						if ($.isFunction(callback)) {
							callback();
						}
					}
				});
			},

			/**
			 * Joue un maven wildfly:undeploy sur le chemin
			 * @param {object} $that l'objet source
			 * @param {string} path  le chemin du projet à undeployer
			 * @callback callback
			 */
			undeploy: function ($that, path, callback) {
				require('child_process').exec('cmd /c mvn-undeploy.bat "' + path + '"', {
					cwd: DIR_BATCH
				}, function (err, stdout, stderr) {
					if (err) {
						utils.createErreur($that, stdout, null);
					} else {
						utils.createLog($that, stdout);
						if ($.isFunction(callback)) {
							callback();
						}
					}
				});
			},

			/**
			 * Joue une maven wildfly:deploy sur le chemin
			 * @param {object} $that l'objet source
			 * @param {string} path  le chemin du projet à déployer
			 * @callback callback
			 */
			deploy: function ($that, path, isEar, callback) {
				require('child_process').exec('cmd /c mvn-deploy.bat "' + path + '" ' + isEar, {
					cwd: DIR_BATCH,
					maxBuffer: 1024 * 500
				}, function (err, stdout, stderr) {
					if (err) {
						utils.createErreur($that, stdout, null);
					} else {
						utils.createLog($that, stdout);
						if ($.isFunction(callback)) {
							callback();
						}
					}
				});
			},

			/**
			 * Modifie le pom du projet stubbed pour le faire correspondre à la version des services à déployer
			 * @param {object} infosDemarche les informations de la démarche
			 * @param {object} $that         objet correspondant à la démarche en cours de déploiement
			 * @param {string} path          le chemin vers le service stubbed
			 * @callback	callback
			 */
			modifyStubbedPom: function (infosDemarche, $that, path, callback) {
				var fs = require("fs");
				fs.readFile(app.settings.workspace + "\\" + path + "\\pom.xml", "utf8", function (err, data) {
					if (err) {
						utils.createErreur($that, err, null);
					} else {
						var result = data.replace(/<version>([0-9a-zA-Z\.\-]+)<\/version>/i, "<version>" + infosDemarche.versionServices + "<\/version>");
						fs.writeFile(app.settings.workspace + "\\" + path + "\\pom.xml", result, 'utf8', function (err) {
							if (err) {
								utils.createErreur($that, err, null);
							} else if ($.isFunction(callback)) {
								callback();
							}
						});
					}
				});
			},

			/**
			 * Joue le traitement de copie et d'intégration du service stubbé dans l'ear des services
			 * @param {object} infosDemarche les informations de la demarche à déployer
			 * @param {object} $that         l'objet source
			 * @callback callback
			 */
			copyStubbedService: function (infosDemarche, $that, nbEtapes, callback) {
				var path = app.settings.dir.stub + "\\psl-teledossier-service-stubbed-ejb",
					pathService = utils.getServicesPath(infosDemarche);
				if (utils.isStubbed()) {
					loader.update($that, "services", "insert-stub", nbEtapes, true);
					require('child_process').exec('cmd /c copyStubbed.bat "' + path + '" "' + pathService + '" "' + infosDemarche.versionServices + '"', {
						cwd: DIR_BATCH
					}, function (err, stdout, stderr) {
						if (err) {
							utils.createErreur($that, stdout, null);
						} else {
							utils.createLog($that, stdout);
							if ($.isFunction(callback)) {
								callback();
							}
						}
					});
				} else if ($.isFunction(callback)) {
					callback();
				}
			},

			/**
			 * Récupère les informations du POM de la démarche pour déterminer les versions des services et du framework
			 * @param {object} infosDemarche les informations de la démarche à déployer
			 * @param {object} $that         l'objet source
			 * @callback  callback
			 */
			getInfosPOM: function (infosDemarche, $that, callback) {
				var fs = require("fs");
				fs.readFile(app.settings.workspace + '\\' + infosDemarche.code + '\\pom.xml', 'utf8', function (err, data) {
					var patternVersionServices = /<version\.services\-PSL>([a-zA-Z0-9\.\-]*)<\/version\.services\-PSL>/ig,
						patternVersionFramework = /<version\.framework\-PSL>([a-zA-Z0-9\.\-]*)<\/version\.framework\-PSL>/ig,
						matchVersionServices = 0,
						matchVersionFramework = 0;
					if (err) {
						utils.createErreur($that, err, null);
					} else {
						matchVersionFramework = patternVersionFramework.exec(data);
						matchVersionServices = patternVersionServices.exec(data);
						infosDemarche.versionFramework = matchVersionFramework[1];
						infosDemarche.versionServices = matchVersionServices[1];
						if ($.isFunction(callback)) {
							callback();
						}
					}
				});
			},

			/**
			 * Sauvegarde des infos démarches dans le data.json
			 * @callback callback
			 */
			sauverDemarches: function (callback) {
				localStorage.setItem("data", JSON.stringify(app.data));
			},

			/**
			 * Sauvegarde des infos démarches dans le data.json
			 * @callback callback
			 */
			sauverSettings: function (callback) {
				localStorage.setItem("workspace", JSON.stringify(app.settings));
			},

			/**
			 * Charge les infos démarches depuis le data.json
			 * @callback callback
			 */
			getDataDemarches: function (callback) {
				var json = JSON.parse(localStorage.getItem("data"));
				if (!json) {
					json = {
						"listeDemarches": []
					};
				}
				if ($.isFunction(callback)) {
					callback(json);
				}
			},

			/**
			 * Charge les infos démarches depuis le data.json
			 * @callback callback
			 */
			getSettings: function (callback) {
				var json = JSON.parse(localStorage.getItem("workspace"));
				if (!json) {
					json = {
						"workspace": "D:\\projetsDILA\\src",
						"pg": {
							"url": "localhost:5432\\psl",
							"username": "psl",
							"password": "demarche_psl"
						},
						"dir": {
							"versionServices": "versions services",
							"brancheServices": "services-branche",
							"trunkServices": "services",
							"trunkframework": "Framework",
							"stub": "bouchons"
						}
					};
				}
				if ($.isFunction(callback)) {
					callback(json);
				}
			},

			/**
			 * Valide l'existance du pom d'un projet à la version requise.
			 * @param   {boolean} isFramework   indique si le projet concerné est le Framework
			 * @param   {object}  infosDemarche les informations de la démarche
			 * @returns {boo}     indique si le pom existe à la bonne version
			 */
			valideExistancePom: function (isFramework, infosDemarche) {
				var isExist = true,
					path = (isFramework) ? utils.getFrameworkPath(infosDemarche) : utils.getServicesPath(infosDemarche),
					version = (isFramework) ? infosDemarche.versionFramework : infosDemarche.versionServices,
					fs = require("fs"),
					data = null,
					pattern = (isFramework && utils.isBranche(version)) ? /<parent>\n(?:\t*<[a-zA-Z0-1]+>.*<\/[a-zA-Z0-1]+>\n)+\t*<version>([a-zA-Z0-9\.\-]+)<\/version>\n\t*<\/parent>/ig : /<version>([0-9a-zA-Z\.\-]+)<\/version>/ig,
					versionDoc = null;
				try {
					if (utils.isSnapshot(version)) {
						data = fs.readFileSync(app.settings.workspace + '\\' + path + '\\pom.xml', "utf-8");
						versionDoc = pattern.exec(data);
						if (versionDoc[1] != version) {
							isExist = false;
						}
					} else {
						fs.accessSync(app.settings.workspace + '\\' + path + '\\pom.xml', fs.F_OK);
					}
				} catch (e) {
					isExist = false;
				}
				return isExist;
			},

			/**
			 * valide le déroulement d'un scénario et validant que tous les services et framework existent bien sous la version requise.
			 * @param   {object}  infosDemarche les informations sur la démarche
			 * @param {boolean} indique       si les services sont requis dans le scénario
			 * @returns {boolean} indique si le scénario est valide.
			 */
			valideScenario: function ($that, infosDemarche, servicesMandatory) {
				var isScenarioValide = true,
					message = "";
				if (!bat.valideExistancePom(true, infosDemarche)) {
					isScenarioValide = false;
					message = (utils.isSnapshot(infosDemarche.versionFramework)) ? "La version " + infosDemarche.versionFramework + " du framework est obsolète." : "La version " + infosDemarche.versionFramework + " du framework n'existe pas dans votre répertoire.";
					utils.createErreur($that, message, message, infosDemarche);
				}
				if (servicesMandatory || (utils.isServicesMandatory() && utils.getVersionServices(infosDemarche) != deployInfos.services)) {
					if (!bat.valideExistancePom(false, infosDemarche)) {
						isScenarioValide = false;
						message = (utils.isSnapshot(infosDemarche.versionServices)) ? "La version " + infosDemarche.versionServices + " des services est obsolète." : "La version " + infosDemarche.versionServices + " des services n'existe pas dans votre répertoire.";
						utils.createErreur($that, message, message, infosDemarche);
					}
				}
				return isScenarioValide;
			}
		},
		form = {
			/**
			 * Valide un champ
			 * @param   {object}  $champ le champ à valider
			 * @returns {boolean} indique si le champ est valide
			 */
			valideChamp: function ($champ) {
				var isValide = true;
				if ($champ != null) {
					if ($champ.is(":required") && ($champ.val() == null || $champ.val().trim() == "")) {
						isValide = false;
					}
				}
				return isValide;
			},

			/**
			 * Créé une erreur sur un champ
			 * @param {object} $champ le champ à marquer en erreur
			 */
			addErreur: function ($champ) {
				if ($champ != null) {
					$champ.attr("aria-invalid", true);
				}
			},

			/**
			 * Supprimer une erreur sur un champ
			 * @param {object} $champ le champ à marquer en correct
			 */
			removeErreur: function ($champ) {
				if ($champ != null) {
					$champ.attr("aria-invalid", false);
				}
			}
		};

	/**
	 * Scénario de traitement du services stubbé
	 * - mvn clean
	 * - mvn install
	 * @param {object}   infosDemarche informations sur la démarche à déployer
	 * @param {object} $that         objet source
	 * @param {boolean} isForced      indique si la génération des services stubbés est forcée
	 * @param {number} nbEtapes      le nombre d'étapes
	 * @callback callback
	 */
	function stubbedService(infosDemarche, $that, isForced, nbEtapes, callback) {
		if (utils.isStubbed() && (isForced || (utils.isServicesMandatory() && utils.getVersionServices(infosDemarche) != deployInfos.services))) {
			var path = app.settings.dir.stub + "\\psl-teledossier-service-stubbed-ejb";
			loader.update($that, "stub", "init", nbEtapes, true);
			bat.modifyStubbedPom(infosDemarche, $that, path, function () {
				loader.update($that, "stub", "clean", nbEtapes, true);
				bat.clean($that, path, function () {
					loader.update($that, "stub", "install", nbEtapes);
					bat.install($that, path, function () {
						if ($.isFunction(callback)) {
							callback();
						}
					});
				});
			});
		} else if ($.isFunction(callback)) {
			callback();
		}
	}

	/**
	 * Joue le scénario de déploiement des services
	 * - mvn clean
	 * - mvn install
	 * - intégration des services stubbés
	 * - mvn wildfly:undeploy
	 * - mvn wildfly:deploy
	 * @param {object}   infosDemarche les informations de la démarche à déployer
	 * @param {object} $that         l'objet source
	 * @param {boolean} isForced      indique si la génération des services est forcée
	 * @param {number} nbEtapes      le nombre d'étapes
	 * @callback callback
	 */
	function services(infosDemarche, $that, isForced, nbEtapes, callback) {
		if (isForced || (utils.isServicesMandatory() && utils.getVersionServices(infosDemarche) != deployInfos.services)) {
			var path = utils.getServicesPath(infosDemarche);
			// mvn clean
			loader.update($that, "services", "clean", nbEtapes, true);
			bat.clean($that, path, function () {
				loader.update($that, "services", "install", nbEtapes, true);
				// mvn install
				bat.install($that, path, function () {
					// traitement de la copie des services stubbed dans l'ear des services
					bat.copyStubbedService(infosDemarche, $that, nbEtapes, function () {
						loader.update($that, "services-ear", "undeploy", nbEtapes, true);
						var pathEAR = path + "\\psl-services-ear";
						// mvn wildfly:undeploy (ear)
						bat.undeploy($that, pathEAR, function () {
							loader.update($that, "services-ear", "deploy", nbEtapes, true);
							// mvn wildfly:deploy (ear)
							var isEARStubbed = (utils.isStubbed()) ? true : false;
							bat.deploy($that, pathEAR, isEARStubbed, function () {
								loader.update($that, "services-war", "undeploy", nbEtapes, true);
								var pathWAR = path + "\\psl-services-war";
								// mvn wildfly:undeploy (war)
								bat.undeploy($that, pathWAR, function () {
									loader.update($that, "services-war", "deploy", nbEtapes, true);
									// mvn wildfly:deploy (war)
									bat.deploy($that, pathWAR, false, function () {
										deployInfos.services = utils.getVersionServices(infosDemarche);
										$("#deploy-info-services").text(deployInfos.services);
										if ($.isFunction(callback)) {
											callback();
										}
									});
								});
							});
						});
					});
				});
			});
		} else if ($.isFunction(callback)) {
			callback();
		}
	}

	/**
	 * Scénario de déploiement du framework
	 * @param {object} infosDemarche les informations de la démarche à déployer
	 * @param {object} $that         l'objet source
	 * @param {number} nbEtapes      le nombre d'étapes dans le scénario
	 * @callback callback
	 */
	function framework(infosDemarche, $that, nbEtapes, callback) {
		var path = utils.getFrameworkPath(infosDemarche);
		loader.update($that, "framework", "clean", nbEtapes, true);
		bat.clean($that, path, function () {
			loader.update($that, "framework", "install", nbEtapes, true);
			bat.install($that, path, function () {
				if ($.isFunction(callback)) {
					callback();
				}
			});
		});
	}

	/**
	 * Récupère le répertoire du projet
	 * @deprecated
	 * @callback callback
	 */
	function getCoreDirectory(callback) {
		require('child_process').exec('cmd /c getDirSettingsName.bat', {
			cwd: DIR_BATCH
		}, function (err, stdout, stderr) {
			if (err) {
				alert("Une erreur s'est produite lors de la récupération du répertoire de l'application " + err);
			} else if ($.isFunction(callback)) {
				CORE_DIR = stdout.replace(/"|\n/g, "");
				callback();
			}
		});
	}

	/**
	 * Initialisation de l'application
	 */
	function start() {
		// récupération des settings
//		getCoreDirectory(function () {
		var fs = require("fs");
		bat.getSettings(function (json) {
			if (json != null) {
				app.settings = json;
				// récupération des informations des démarches
				bat.getDataDemarches(function (json) {
					if (json != null) {
						app.data = json;
						ui.creerTableDemarches();
					}
				});
			}
		});
//		});
	}

	function resetDonneesSpecifiques($that, nbEtapes, infosDemarche, callback) {
		if (utils.isResetDonneesSpecifiques()) {
			loader.update($that, "demarche", "reset-data", nbEtapes, true);
			var pg = require('pg'),
				username = app.settings.pg.username,
				password = app.settings.pg.password,
				url = app.settings.pg.url,
				connectionString = "postgres://" + username + ":" + password + "@" + url,
				client = new pg.Client(connectionString),
				query = null;
			client.connect();
			query = client.query("UPDATE exe_demarche SET initialisation_realisee=FALSE WHERE code_demarche = '" + infosDemarche.codeDemarche + "'");
			query.on('end', callback);
		} else {
			if ($.isFunction(callback)) {
				callback();
			}
		}
	}

	/**
	 * Scénario de déploiement de la démarche
	 * - mvn clean
	 * - mvn install
	 * - mvn wildfly:undeploy
	 * - mvn wildfly:deploy
	 * @param {object}   infosDemarche les informations de la démarche à deployer
	 * @param {object} $that         l'objet source
	 * @param {number} nbEtapes      le nombre d'étapes du scénario
	 * @callback callback
	 */
	function demarche(infosDemarche, $that, nbEtapes, callback) {
		var path = infosDemarche.code;
		// mvn clean
		loader.update($that, "demarche", "clean", nbEtapes, true);
		bat.clean($that, path, function () {
			loader.update($that, "demarche", "install", nbEtapes, true);
			// mvn install
			bat.install($that, path, function () {
				resetDonneesSpecifiques($that, nbEtapes, infosDemarche, function () {
					// mvn wildfly:undeploy
					loader.update($that, "demarche", "undeploy", nbEtapes, true);
					bat.undeploy($that, path, function () {
						loader.update($that, "demarche", "deploy", nbEtapes, true);
						// mvn wildfly:deploy
						bat.deploy($that, path, false, function () {
							if ($.inArray(infosDemarche.code, deployInfos.demarches) == -1) {
								deployInfos.demarches.push(infosDemarche.code);
								ui.drawDeployInfosDemarche(infosDemarche);
							}
							$that.parents("tr:first").removeClass("danger").addClass("success").find("details .infosDemarche-lastModified").data("lastModified", new Date());
							loader.remove($that.parents("tr:first"));
							if ($.isFunction(callback)) {
								callback();
							}
						});
					});
				});
			});
		});
	}

	/**
	 * Scénario de déploiement simple de la démarche sans build de framework ou démarche ni déploiement des services.
	 * - mvn undeploy
	 * - mvn deploy
	 * @param {object}   infosDemarche les informations de la démarche.
	 * @param {object}   $that         l'objet source
	 * @param {number}   nbEtapes      le nombre d'étapes du scénario
	 * @callback callback
	 */
	function demarcheDeploySimple(infosDemarche, $that, nbEtapes, callback) {
		var path = infosDemarche.code;
		// mvn wildfly:undeploy
		resetDonneesSpecifiques($that, nbEtapes, infosDemarche, function () {
			loader.update($that, "demarche", "undeploy", nbEtapes, true);
			bat.undeploy($that, path, function () {
				loader.update($that, "demarche", "deploy", nbEtapes, true);
				// mvn wildfly:deploy
				bat.deploy($that, path, false, function () {
					if ($.inArray(infosDemarche.code, deployInfos.demarches) == -1) {
						deployInfos.demarches.push(infosDemarche.code);
						ui.drawDeployInfosDemarche(infosDemarche);
					}
					$that.parents("tr:first").removeClass("danger").addClass("success").find("details .infosDemarche-lastModified").data("lastModified", new Date());
					loader.remove($that.parents("tr:first"));
					if ($.isFunction(callback)) {
						callback();
					}
				});
			});
		});
	}

	/**
	 * Scénario de build simple de la démarche sans action sur les services ni sur le framework et sans déploiement.
	 * - mvn clean
	 * - mvn install
	 * @param {object}   infosDemarche les informations de la démarche
	 * @param {object}   $that         l'objet source
	 * @param {number}   nbEtapes      le nombre d'étapes du scénario
	 * @callback callback
	 */
	function demarcheBuildSimple(infosDemarche, $that, nbEtapes, callback) {
		var path = infosDemarche.code;
		// mvn clean
		loader.update($that, "demarche", "clean", nbEtapes, true);
		bat.clean($that, path, function () {
			loader.update($that, "demarche", "install", nbEtapes, true);
			// mvn install
			bat.install($that, path, function () {
				$that.parents("tr:first").removeClass("danger").addClass("success");
				loader.remove($that.parents("tr:first"));
				if ($.isFunction(callback)) {
					callback();
				}
			});
		});
	}
	
	function testServerActivity(callback) {
		var http = require('http'),
			options = {method: 'HEAD', host: 'localhost', port: 9990, path: '/console/App.html'},
			req = http.request(options, function (r) {
				$("#start-server").hide();
				$("#stop-server").show();
			});
		req.on("end", function () {
			$("#start-server").hide();
			$("#stop-server").show();
		});
		req.on("error", function () {
			$("#start-server").show();
			$("#stop-server").hide();
		});
	}

	$(function () {
		// initialisation de la page
		start();
		testServerActivity();
		
		// mise en place des évènements
		$("body").on("click", "#listeProjets .build", function () {
			var $that = $(this),
				data_demarche = $that.parents("tr:first").data("demarche"),
				infosDemarche = new DemarcheInfos(),
				nbEtapes = 8;
			if (data_demarche != null) {
				loader.add($that.parents("tr:first"));
				infosDemarche.code = data_demarche.dir;
				infosDemarche.codeDemarche = data_demarche.code;
				incrementEtape($that, true);
				// récupération des informations du POM de la démarche
				/*bat.getInfosPOM(infosDemarche, $that, function () {
					nbEtapes = utils.calculerEtapes(infosDemarche, nbEtapes, false);
					if (bat.valideScenario($that, infosDemarche, false)) {
						loader.update($that, "demarche", "getInfos", nbEtapes, false);
						// traitement des services stubbeds
						stubbedService(infosDemarche, $that, nbEtapes, false, function () {
							// traitement des services
							services(infosDemarche, $that, false, nbEtapes, function () {
								// traitement du framework
								framework(infosDemarche, $that, nbEtapes, function () {
									// traitement de la démarche
									demarche(infosDemarche, $that, nbEtapes, function () {
										new Notification("Succès", {body: "Fin du déploiement de la démarche " + infosDemarche.code});
									});
								});
							});
						});
					}
				});*/
				
				bat.getInfosPOM(infosDemarche, $that, function () {
					if (bat.valideScenario($that, infosDemarche, true)) {
						loader.update($that, "demarche", "getInfos", nbEtapes, false);
						// traitement du framework
						framework(infosDemarche, $that, nbEtapes, function () {
							// traitement de la démarche
							demarche(infosDemarche, $that, nbEtapes, function () {
								new Notification("Succès", {body: "Fin du déploiement de la démarche " + infosDemarche.code});
							});
						});
					}
				});
				
			} else {
				alert("La démarche n'existe pas");
			}
		}).on("click", "#listeProjets .deployFull", function () {
			var $that = $(this),
				data_demarche = $that.parents("tr:first").data("demarche"),
				infosDemarche = new DemarcheInfos(),
				nbEtapes = 8;
			if (data_demarche != null) {
				loader.add($that.parents("tr:first"));
				infosDemarche.code = data_demarche.dir;
				infosDemarche.codeDemarche = data_demarche.code;
				incrementEtape($that, true);
				// récupération des informations du POM de la démarche
				bat.getInfosPOM(infosDemarche, $that, function () {
					nbEtapes = utils.calculerEtapes(infosDemarche, nbEtapes, true);
					if (bat.valideScenario($that, infosDemarche, true)) {
						loader.update($that, "demarche", "getInfos", nbEtapes, false);
						// traitement des services stubbeds
						stubbedService(infosDemarche, $that, true, nbEtapes, function () {
							// traitement des services
							services(infosDemarche, $that, true, nbEtapes, function () {
								// traitement du framework
								framework(infosDemarche, $that, nbEtapes, function () {
									// traitement de la démarche
									demarche(infosDemarche, $that, nbEtapes, function () {
										new Notification("Succès", {body: "Fin du déploiement de la démarche " + infosDemarche.code});
									});
								});
							});
						});
					}
				});
			} else {
				alert("La démarche n'existe pas");
			}
		}).on("click", "#listeProjets .deploySimple", function () {
			var $that = $(this),
				data_demarche = $that.parents("tr:first").data("demarche"),
				infosDemarche = new DemarcheInfos(),
				nbEtapes = 3;
			if (data_demarche != null) {
				loader.add($that.parents("tr:first"));
				infosDemarche.code = data_demarche.dir;
				infosDemarche.codeDemarche = data_demarche.code;
				incrementEtape($that, true);
				// récupération des informations du POM de la démarche
				bat.getInfosPOM(infosDemarche, $that, function () {
					loader.update($that, "demarche", "getInfos", nbEtapes, false);
					// traitement de la démarche
					demarcheDeploySimple(infosDemarche, $that, nbEtapes, function () {
						new Notification("Succès", {body: "Fin du déploiement de la démarche " + infosDemarche.code});
					});
				});
			} else {
				alert("La démarche n'existe pas");
			}
		}).on("click", "#listeProjets .buildSimple", function () {
			var $that = $(this),
				data_demarche = $that.parents("tr:first").data("demarche"),
				infosDemarche = new DemarcheInfos(),
				nbEtapes = 6;
			if (data_demarche != null) {
				loader.add($that.parents("tr:first"));
				infosDemarche.code = data_demarche.dir;
				infosDemarche.codeDemarche = data_demarche.code;
				incrementEtape($that, true);
				// récupération des informations du POM de la démarche
				bat.getInfosPOM(infosDemarche, $that, function () {
					if (bat.valideScenario($that, infosDemarche, true)) {
						loader.update($that, "demarche", "getInfos", nbEtapes, false);
						// traitement du framework
						framework(infosDemarche, $that, nbEtapes, function () {
							// traitement de la démarche
							demarcheBuildSimple(infosDemarche, $that, nbEtapes, function () {
								new Notification("Succès", {body: "Fin du build de la démarche " + infosDemarche.code});
							});
						});
					}
				});
			} else {
				alert("La démarche n'existe pas");
			}
		}).on("click", "#listeProjets .showLogs", function () {
			var $that = $(this),
				logs = $that.parents("tr:first").data("logs") || "";
			$("#modalLogs").data("cible", $that.parents("tr:first")).modal("show");
			// mise en style des logs
			logs = logs.replace(/^((?:\[ERROR\]|Caused by|\tat|\t\.{3}).*)$/gim, function (find) {
				return "<span class='log-error'>" + find + "</span>";
			});
			logs = logs.replace(/^(\[INFO\].*)$/gim, function (find) {
				return "<span class='log-info'>" + find + "</span>";
			});
			logs = logs.replace(/^(\[WARNING\].*)$/gim, function (find) {
				return "<span class='log-warning'>" + find + "</span>";
			});
			$("#modalLogs").find(".modal-body").html(logs);
			$("#modalLogs").modal("show");
		}).on("click", "#cleanLogs", function () {
			var $ligneDemarche = $("#modalLogs").data("cible");
			if ($ligneDemarche != null) {
				$ligneDemarche.data("logs", null);
			}
			$("#modalLogs").modal("hide").data("cible", null);
		}).on("click", "[data-dismiss='modal']", function () {
			$("#modalLogs").data("cible", null);
		}).on("click", "summary", function () {
			var $that = $(this),
				demarche_data = $that.parents("tr").data("demarche"),
				infosDemarche = new DemarcheInfos();
			if (demarche_data != null) {
				infosDemarche.code = demarche_data.dir;
				infosDemarche.codeDemarche = demarche_data.code;
				bat.getInfosPOM(infosDemarche, $that, function () {
					$that.parents("details").find(".infosDemarche-vServices").text(infosDemarche.versionServices);
					$that.parents("details").find(".infosDemarche-vFramework").text(infosDemarche.versionFramework);
					var dateLastModified = $that.parents("details").find(".infosDemarche-lastModified").data("lastModified"),
						stringDateLastModified = null,
						todayRaw = new Date(),
						todayDay = new Date(todayRaw.getFullYear(), todayRaw.getMonth(), todayRaw.getDate()),
						dateDay = null;
					if (dateLastModified != null) {
						dateDay = new Date(dateLastModified.getFullYear(), dateLastModified.getMonth(), dateLastModified.getDate());
						if (todayDay.getTime() == dateDay.getTime()) {
							// c'est aujourd'hui, on affiche l'heure
							stringDateLastModified = dateLastModified.getHours() + ":" + (((dateLastModified.getMinutes()) < 10) ? "0" : "") + dateLastModified.getMinutes();
						} else {
							// on affiche la date
							stringDateLastModified = (((dateDay.getDate() + 1) < 10) ? "0" : "") + "/" + (((dateDay.getMonth() + 1) < 10) ? "0" : "") + (dateDay.getMonth() + 1) + "/" + dateDay.getFullYear();
						}
					}
					$that.parents("tr:first").find("details .infosDemarche-lastModified").text(stringDateLastModified);
				});
			}
			setTimeout(function () {
				loader.resetAll();
			}, 10);
		}).on("click", ".undeploy", function () {
			var codeDemarche = $(this).attr("data-codeDemarche"),
				$that = $("tr[data-codeDemarche='" + codeDemarche + "'] button:first"),
				data_demarche = $that.parents("tr:first").data("demarche"),
				infosDemarche = new DemarcheInfos(),
				nbEtapes = 2;
			if (data_demarche != null) {
				loader.add($that.parents("tr:first"));
				infosDemarche.code = data_demarche.dir;
				infosDemarche.codeDemarche = data_demarche.code;
				incrementEtape($that, true);
				// récupération des informations du POM de la démarche
				bat.getInfosPOM(infosDemarche, $that, function () {
					loader.update($that, "demarche", "undeploy", nbEtapes, false);
					var path = infosDemarche.code;
					bat.undeploy($that, path, function () {
						new Notification("Succès", {body: "Fin du retrait de la démarche " + infosDemarche.code});
						$("li[data-codeDemarche='" + infosDemarche.code + "']").remove();
						$that.parents("tr:first").removeClass("success");
						loader.remove($that.parents("tr:first"));
					});
				});
			} else {
				alert("La démarche n'existe pas");
			}
		});

		// on fait suivre les loaders lors du resize de la page
		$(document).on("resize", function () {
			loader.resetAll();
		});

		// on fait suivre les loader lors du scroll
		$("main").on("scroll", function () {
			loader.resetAll();
		});
		$("#addDemarche").on('click', function () {
			$("#modalAddDemarche :input").val("");
			$("#modalAddDemarche").modal("show");
		});

		$("#validAddDemarche").on("click", function (event) {
			var isValidForm = true,
				nvlleDemarche = null;
			$("#modalAddDemarche input").each(function () {
				var $this = $(this),
					isValidChamp = form.valideChamp($this);
				if (!isValidChamp) {
					form.addErreur($this);
					if (isValidForm) {
						isValidForm = isValidChamp;
					}
				} else {
					form.removeErreur($this);
				}
			});
			if (isValidForm) {
				nvlleDemarche = {
					"name": $("#nomDemarche").val(),
					"code": $("#codeDemarche").val(),
					"dir": $("#dirDemarche").val(),
					"hasAction": false,
					"listeActions": []
				};
				if (!app.data.hasOwnProperty("listeDemarches")) {
					app.data.listeDemarches = [];
				}
				app.data.listeDemarches.push(nvlleDemarche);
				ui.creerTableLineDemarche(nvlleDemarche, $("#listeProjets tbody"));
				bat.sauverDemarches();
				$("#modalAddDemarche").modal("hide");
			}
		});

		$("#settings").on("click", function () {
			if (!app.settings) {
				app.settings = {
					workspace: "",
					wildfly: {
						standalone: ""
					},
					pg: {
						url: "",
						username: "",
						password: ""
					},
					dir: {
						versionServices: "",
						brancheServices: "",
						trunkServices: "",
						trunkframework: "",
						stub: ""
					}
				};
			}
			$("#settingsWorkspace").val(app.settings.workspace);
			if (!app.settings.wildfly) {
				app.settings.wildfly = {
					standalone: ""
				};
			}
			$("#settingsStandalone").val(app.settings.wildfly.standalone);
			if (!app.settings.pg) {
				app.settings.pg = {
					url: "",
					username: "",
					password: ""
				};
			}
			$("#urlPGSQL").val(app.settings.pg.url);
			$("#userPGSQL").val(app.settings.pg.username);
			$("#passwordPGSQL").val(app.settings.pg.password);
			if (!app.settings.dir) {
				app.settings.dir = {
					versionServices: "",
					brancheServices: "",
					trunkServices: "",
					trunkframework: "",
					stub: ""
				};
			}
			$("#dirVersionServices").val(app.settings.dir.versionServices);
			$("#dirServiceBranche").val(app.settings.dir.brancheServices);
			$("#dirServiceTrunk").val(app.settings.dir.trunkServices);
			$("#dirFrameworkTrunk").val(app.settings.dir.trunkframework);
			$("#dirStubBouchon").val(app.settings.dir.stub);
			$("#modalSettings").modal("show");
		});

		$("#validSettings").on("click", function () {
			var isValidForm = true;
			$("#modalSettings input").each(function () {
				var $this = $(this),
					isValidChamp = form.valideChamp($this);
				if (!isValidChamp) {
					form.addErreur($this);
					if (isValidForm) {
						isValidForm = isValidChamp;
					}
				} else {
					form.removeErreur($this);
				}
			});
			if (isValidForm) {
				app.settings.workspace = $("#settingsWorkspace").val();
				app.settings.wildfly.standalone = $("#settingsStandalone").val();
				app.settings.dir.versionServices = $("#dirVersionServices").val();
				app.settings.dir.brancheServices = $("#dirServiceBranche").val();
				app.settings.dir.trunkServices = $("#dirServiceTrunk").val();
				app.settings.dir.trunkframework = $("#dirFrameworkTrunk").val();
				app.settings.pg.url = $("#urlPGSQL").val();
				app.settings.pg.username = $("#userPGSQL").val();
				app.settings.pg.password = $("#passwordPGSQL").val();
				app.settings.dir.stub = $("#dirStubBouchon").val();
				bat.sauverSettings();
				$("#modalSettings").modal("hide");
			}
		});

		$(".form-control").on("change", function () {
			var $this = $(this),
				isValide = form.valideChamp($this);
			if (!isValide) {
				form.addErreur($this);
			} else {
				form.removeErreur($this);
			}
		});
		
		$("#start-server").on("click", function () {
			// on va chercher le fichier bat de lancement du serveur
			// on exécute
			
			var server = require("child_process").spawn("cmd.exe", ["/c", app.settings.wildfly.standalone + 'standalone.bat --debug --server-config=standalone-full.xml'], {
				cwd: app.settings.wildfly.standalone
			});
			
			$(this).find(".glyphicon").removeClass("glyphicon-play").addClass("glyphicon-refresh").attr("disabled", "disabled");
			
			server.stdout.on("data", function (data) {
				data = data.toString("utf8");
				// mise en style des logs
				data = data.replace(/^((?:\[ERROR\]|Caused by|\tat|\t\.{3}).*)$/gim, function (find) {
					return "<span class='log-error'>" + find + "</span>";
				});
				data = data.replace(/^(\[INFO\].*)$/gim, function (find) {
					return "<span class='log-info'>" + find + "</span>";
				});
				data = data.replace(/^(\[WARNING\].*)$/gim, function (find) {
					return "<span class='log-warning'>" + find + "</span>";
				});
				$("<p>").html(data).appendTo("#modalLogsServer .modal-body");
				$("#modalLogsServer .modal-body")[0].scrollTop = $("#modalLogsServer .modal-body")[0].scrollHeight;
				if (data.match("started in [0-9]*ms")) {
					$("#start-server").hide();
					$("#stop-server").find(".glyphicon").addClass("glyphicon-stop").removeClass("glyphicon-refresh").attr("disabled", false).show();
				}
			});
			
			server.stderr.on("data", function (data) {
				$("<p>").html(data.toString("utf8")).appendTo("#modalLogsServer .modal-body");
				$("#modalLogsServer .modal-body")[0].scrollTop = $("#modalLogsServer .modal-body")[0].scrollHeight;
				$("#start-server").hide();
				$("#stop-server").find(".glyphicon").addClass("glyphicon-stop").removeClass("glyphicon-refresh").attr("disabled", false).show();
			});
			
			server.on("exit", function (code) {
				console.log(code);
				$("#start-server").hide();
				$("#stop-server").find(".glyphicon").addClass("glyphicon-stop").removeClass("glyphicon-refresh").attr("disabled", false).show();
			});
		});
		
		$("#stop-server").on("click", function () {
			var server = require("child_process").spawn("cmd.exe", ["/c", app.settings.wildfly.standalone + "jboss-cli.bat -c --command=:shutdown"]);
			
			$(this).find(".glyphicon").removeClass("glyphicon-stop").addClass("glyphicon-refresh").attr("disabled", "disabled");
			
			server.stdout.on("data", function (data) {
				$("<p>").html(data.toString("utf8")).appendTo("#modalLogsServer .modal-body");
				$("#modalLogsServer .modal-body")[0].scrollTop = $("#modalLogsServer .modal-body")[0].scrollHeight;
			});

			server.stderr.on("data", function (data) {
				$("<p>").html(data.toString("utf8")).appendTo("#modalLogsServer .modal-body");
				$("#modalLogsServer .modal-body")[0].scrollTop = $("#modalLogsServer .modal-body")[0].scrollHeight;
			});

			server.on("exit", function (code) {
				console.log(code);
				$("#stop-server").hide();
				$("#start-server").show();
				$("#start-server").find(".glyphicon").addClass("glyphicon-play").removeClass("glyphicon-refresh").attr("disabled", false);
			});
		});
		
		$("#logs-serveur").on("click", function () {
			$("#modalLogsServer").data("cible", $("#logs-serveur")).modal("show");
			$("#modalLogsServer").modal("show");
		});

		$(".infobulle").popover();
	});
}(jQuery));
