
'use strict';

var db = module.parent.require('./database');


(function(plugin) {


	plugin.init = function(params, callback) {

		var router = params.router;

		router.get('/admin/plugins/threaded-replies', params.middleware.applyCSRF, params.middleware.admin.buildHeader, renderAdmin);
		router.get('/api/admin/plugins/threaded-replies', params.middleware.applyCSRF, renderAdmin);

		callback();
	}

	function renderAdmin(req, res, next) {
		res.render('admin/plugins/threaded-replies', {});
	}

	var admin = {};

	admin.menu = function(menu, callback) {
		menu.plugins.push({
			route: '/plugins/threaded-replies',
			icon: 'fa-indent',
			name: 'Threaded Replies'
		});

		callback(null, menu);
	};


	plugin.admin = admin;

}(module.exports));

