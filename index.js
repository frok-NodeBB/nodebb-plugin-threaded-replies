
'use strict';

var async = module.parent.require('async'),
	winston = module.parent.require('winston'),

	db = module.parent.require('./database'),
	posts = module.parent.require('./posts'),
	topics = module.parent.require('./topics');


(function(plugin) {


	plugin.init = function(params, callback) {

		var router = params.router;

		router.get('/admin/plugins/threaded-replies', params.middleware.applyCSRF, params.middleware.admin.buildHeader, renderAdmin);
		router.get('/api/admin/plugins/threaded-replies', params.middleware.applyCSRF, renderAdmin);

		callback();
	};

	function renderAdmin(req, res, next) {
		res.render('admin/plugins/threaded-replies', {});
	}

	plugin.onPostSave = function(data, callback) {
		if (parseInt(data.toPid, 10)) {
			db.sortedSetAdd('pid:' + data.toPid + ':replies', data.timestamp, data.pid, function(err) {
				callback(err, data);
			});
		} else {
			callback(null, data);
		}
	};

	plugin.onPostPurge = function(pid) {
		db.getObjectField('post:' + pid, 'toPid', function(err, toPid) {
			if (err) {
				return winston.error(err.stack);
			}
			if (parseInt(toPid, 10)) {
				db.sortedSetRemove('pid:' + toPid + ':replies', pid);
			}
		});
	};

	plugin.onPostMove = function(data) {
		db.getObjectField('post:' + data.post.pid, 'toPid', function(err, toPid) {
			if (err) {
				return winston.error(err.stack);
			}

			if (parseInt(toPid, 10)) {
				db.sortedSetRemove('pid:' + toPid + ':replies', pid);
			}
		});
	};

	plugin.onGetPosts = function(data, callback) {
		async.each(data.posts, function(post, next) {
			getReplies(post, data.uid, next);
		}, function(err) {
			callback(err, data);
		});
	};

	function getReplies(post, uid, callback) {
		db.getSortedSetRange('pid:' + post.pid + ':replies', 0, -1, function(err, pids) {
			if (err) {
				return callback(err);
			}

			if (!Array.isArray(pids) || !pids.length) {
				post.replies = [];
				post.replyCount = 0;
				return callback();
			}

			posts.getPostsByPids(pids, uid, function(err, posts) {
				if (err) {
					return callback(err);
				}

				topics.addPostData(posts, uid, function(err, postData) {
					if (err) {
						return callback(err);
					}
					post.replies = postData;
					post.replyCount = post.replies.length;

					callback();
				});
			});
		});
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

