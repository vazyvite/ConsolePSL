/*jslint eqeq: true, plusplus: true, indent: 4*/
/*globals app, require, jQuery, console, alert*/

(function ($) {
	'use strict';

	var DIR_BATCH = "./bat",
		WORKSPACE = "D:\\projetsDILA\\src",
		deploy = {
			services: "",
			demarches: []
		};

	/**
	 * Objet informations de Démarche.
	 */
	function Demarche() {
		var that = this;
		that.code = "";
		that.versionServices = "";
		that.versionFramework = "";
	}

	/**
	 * création d'un élément de formulaire form-group-static
	 * @param   {string} label     le label
	 * @param   {string} text      le texte
	 * @param   {string} id        l'identifiant du champ
	 * @param   {string} className la classe associée au champ
	 * @returns {object} l'objet form-group-static
	 */
	function createFormGroupStatic(label, text, id, className) {
		var $formGroup = $("<div>").addClass("form-group row"),
			$groupField = $("<div>").addClass("col-xs-7");
		$("<label>").addClass("control-label col-xs-5").text(label).attr("for", "input_" + id).appendTo($formGroup);
		$groupField.appendTo($formGroup);
		$("<span>").addClass("form-control-static " + className).text(text).appendTo($groupField);
		return $formGroup;
	}

	/**
	 * Création de la table des démarches
	 */
	function creerTableDemarches() {
		var $table = $("#listeProjets tbody"),
			$ligne = null,
			$cel2 = null,
			i = 0,
			idDemarche = null,
			demarche = null,
			$cel1 = null,
			$contentInfosDemarche = null,
			$infosDemarche = null;
		$table.children().remove();
		for (i; i < app.data.listeDemarches.length; i++) {
			demarche = app.data.listeDemarches[i];
			idDemarche = "lblDemarche_" + demarche.name;
			$ligne = $("<tr>");

			$cel1 = $("<td>").attr("id", "lblDemarche_" + demarche.name);
			$infosDemarche = $("<details>").appendTo($cel1);
			$("<summary>").text(demarche.name).appendTo($infosDemarche);
			$contentInfosDemarche = $("<div>").addClass("container").appendTo($infosDemarche);
			createFormGroupStatic("version services : ", "", demarche.name, "infosDemarche-vServices").appendTo($contentInfosDemarche);
			createFormGroupStatic("version framework : ", "", demarche.name, "infosDemarche-vFramework").appendTo($contentInfosDemarche);
			$cel1.appendTo($ligne);

			$cel2 = $("<td>");
			$("<button>").attr({
				title: "builder et déployer la démarche " + demarche.name,
				id: "build" + demarche.code,
				'aria-describedby': idDemarche
			}).addClass("btn btn-default build glyphicon glyphicon-send").data({demarche: demarche}).appendTo($cel2);
			$("<button>").attr({
				title: "voir les logs de la démarche " + demarche.name,
				id: "logs" + demarche.code,
				'aria-describedby': idDemarche
			}).addClass("btn btn-default showLogs glyphicon glyphicon-modal-window").data({demarche: demarche}).appendTo($cel2);
			$cel2.appendTo($ligne);
			$ligne.appendTo($table);
		}
	}

	/**
	 * Ajoute un loader sur un élément cible
	 * @param {object} $cible la cible du loader
	 */
	function addLoader($cible) {
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
			$cible.data("loader", id);
		}
	}

	function isStubbed() {
		return ($("#isStubbed").is(":checked")) ? true : false;
	}

	/**
	 * Supprime un loader de l'élément cible
	 * @param {object} $cible la cible du loader
	 */
	function removeLoader($cible) {
		if ($cible != null) {
			var loader = $("#" + $cible.data("loader"));
			loader.remove();
			$cible.data("loader", null);
		}
	}

	function avanceLoader($cible, avancement) {
		if ($cible != null) {
			var loader = $("#" + $cible.data("loader")),
				progressbar = loader.find(".progressbar");
			if (!progressbar.size()) {
				$("<div>").addClass("progressbar").appendTo(loader);
				progressbar = loader.find(".progressbar");
			}
			progressbar.css("width", avancement + "%");
//			progressbar.text(avancement + " %");
		}
	}

	function isSnapshot(version) {
		return (version.match(/SNAPSHOT/ig)) ? true : false;
	}

	function isBranche(version) {
		return (version.match(/^1\.0/ig)) ? true : false;
	}

	function buildStubbedService(infosDemarche, $that, callback) {
		var fs = require("fs");
		fs.readFile(WORKSPACE + "\\bouchons\\psl-teledossier-service-stubbed-ejb\\pom.xml", "utf8", function (err, data) {
			if (err) {
				$that.parents("tr:first").data("logs", $that.data("logs") + err + "\n").removeClass("success").addClass("danger");
				removeLoader($that.parents("tr:first"));
			} else {
				var result = data.replace(/<version>([0-9a-zA-Z\.\-]+)<\/version>/i, "<version>" + infosDemarche.versionServices + "<\/version>");
				fs.writeFile(WORKSPACE + "\\bouchons\\psl-teledossier-service-stubbed-ejb\\pom.xml", result, 'utf8', function (err) {
					if (err) {
						$that.parents("tr:first").data("logs", $that.data("logs") + err + "\n").removeClass("success").addClass("danger");
						removeLoader($that.parents("tr:first"));
					} else {
						if ($.isFunction(callback)) {
							callback();
						}
					}
				});
			}
		});
	}

	function getInfosPOM(infosDemarche, $that, callback) {
		var fs = require("fs");
		fs.readFile(WORKSPACE + '\\' + infosDemarche.code + '\\pom.xml', 'utf8', function (err, data) {
			var patternVersionServices = /<version\.services\-PSL>([a-zA-Z0-9\.\-]*)<\/version\.services\-PSL>/ig,
				patternVersionFramework = /<version\.framework\-PSL>([a-zA-Z0-9\.\-]*)<\/version\.framework\-PSL>/ig,
				matchVersionServices = 0,
				matchVersionFramework = 0;
			if (err) {
				$that.parents("tr:first").data("logs", $that.data("logs") + err + "\n").removeClass("success").addClass("danger");
				removeLoader($that.parents("tr:first"));
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
	}

	function buildServices(infosDemarche, $that, callback) {
		if (infosDemarche.versionServices != deploy.services) {
			require('child_process').exec('cmd /c build-services.bat ' + infosDemarche.versionServices + " " + isSnapshot(infosDemarche.versionServices) + " " + isBranche(infosDemarche.versionServices) + " " + isStubbed(), {
				cwd: DIR_BATCH,
				maxBuffer: 1024 * 500
			}, function (err, stdout, stderr) {
				if (err) {
					$that.parents("tr:first").data("logs", $that.data("logs") + "\n" + stdout).removeClass("success").addClass("danger");
					removeLoader($that.parents("tr:first"));
				} else {
					deploy.services = infosDemarche.versionServices;
					$("#deploy-info-services").text(deploy.services);
					if ($.isFunction(callback)) {
						callback();
					}
				}
			});
		} else {
			if ($.isFunction(callback)) {
				callback();
			}
		}
	}

	function buildFramework(infosDemarche, $that, callback) {
		require('child_process').exec('cmd /c build-framework.bat ' + infosDemarche.versionFramework + " " + isSnapshot(infosDemarche.versionFramework) + " " + isBranche(infosDemarche.versionFramework), {
			cwd: DIR_BATCH,
			maxBuffer: 1024 * 500
		}, function (err, stdout, stderr) {
			if (err) {
				$that.parents("tr:first").data("logs", $that.data("logs") + "\n" + stdout).removeClass("success").addClass("danger");
				removeLoader($that.parents("tr:first"));
			} else {
				if ($.isFunction(callback)) {
					callback();
				}
			}
		});
	}

	function drawDeployInfosDemarche(infosDemarche) {
		var $ul = $("#deploy-info-demarches");
		if (!$ul.find("." + infosDemarche.code).size()) {
			$("<li>").addClass("list-group-item " + infosDemarche.code).text(infosDemarche.code).appendTo($ul);
		}
	}

	function buildDemarche(infosDemarche, $that, callback) {
		require('child_process').exec('cmd /c build.bat ' + infosDemarche.code, {
			cwd: DIR_BATCH,
			maxBuffer: 1024 * 500
		}, function (err, stdout, stderr) {
			var stateClass = null;
			if (err) {
				stateClass = "danger";
			} else {
				stateClass = "success";
				if ($.inArray(infosDemarche.code, deploy.demarches) == -1) {
					deploy.demarches.push(infosDemarche.code);
					drawDeployInfosDemarche(infosDemarche);
				}
			}
			$that.parents("tr:first").data("logs", $that.data("logs") + "\n" + stdout).removeClass("success danger").addClass(stateClass);
			removeLoader($that.parents("tr:first"));

			if ($.isFunction(callback)) {
				callback();
			}
		});
	}

	$(function () {
		// initialisation de la page
		if (app != null && app.data != null && app.data.listeDemarches != null && app.data.listeDemarches.length) {
			creerTableDemarches();
		}

		// mise en place des évènements
		$("body").on("click", "#listeProjets .build", function () {
			var $that = $(this),
				demarche = $that.data("demarche"),
				infosDemarche = new Demarche(),
				pasAvancement = 100 / (isStubbed() ? 5 : 4);

			if (demarche != null) {
				addLoader($that.parents("tr:first"));
				infosDemarche.code = demarche.dir;
				getInfosPOM(infosDemarche, $that, function () {
					avanceLoader($that.parents("tr:first"), pasAvancement);
					if (isStubbed()) {
						buildStubbedService(infosDemarche, $that, function () {
							avanceLoader($that.parents("tr:first"), pasAvancement * 2);
							buildServices(infosDemarche, $that, function () {
								avanceLoader($that.parents("tr:first"), pasAvancement * 3);
								buildFramework(infosDemarche, $that, function () {
									avanceLoader($that.parents("tr:first"), pasAvancement * 4);
									buildDemarche(infosDemarche, $that, function () {
										avanceLoader($that.parents("tr:first"), pasAvancement * 5);
									});
								});
							});
						});
					} else {
						buildServices(infosDemarche, $that, function () {
							avanceLoader($that.parents("tr:first"), pasAvancement * 2);
							buildFramework(infosDemarche, $that, function () {
								avanceLoader($that.parents("tr:first"), pasAvancement * 3);
								buildDemarche(infosDemarche, $that, function () {
									avanceLoader($that.parents("tr:first"), pasAvancement * 4);
								});
							});
						});
					}
				});
			} else {
				alert("La démarche n'existe pas");
			}
		}).on("click", "#listeProjets .showLogs", function () {
			var $that = $(this),
				logs = $that.parents("tr:first").data("logs");
			$("#modalLogs").data("cible", $that.parents("tr:first")).find(".modal-body").html(logs);
			$("#modalLogs").modal("show");
		}).on("click", "#cleanLogs", function () {
			var $ligneDemarche = $("#modalLogs").data("cible");
			if ($ligneDemarche != null) {
				$ligneDemarche.data("logs", null);
			}
			$("#modalLogs").modal("hide");
			$("#modalLogs").data("cible", null);
		}).on("click", "[data-dismiss='modal']", function () {
			$("#modalLogs").data("cible", null);
		}).on("click", "summary", function () {
			var $that = $(this),
				demarche = $that.parents("tr").find(".build").data("demarche"),
				infosDemarche = new Demarche();
			if (demarche != null) {
				infosDemarche.code = demarche.dir;
				getInfosPOM(infosDemarche, $that, function () {
					$that.parents("details").find(".infosDemarche-vServices").text(infosDemarche.versionServices);
					$that.parents("details").find(".infosDemarche-vFramework").text(infosDemarche.versionFramework);
				});
			}
		});

		$(document).on("resize", function () {
			$(".loader").each(function () {
				var $cible = $(this).data("cible");
				if ($cible != null) {
					removeLoader($cible);
					addLoader($cible);
				}
			});
		});
	});
}(jQuery));
