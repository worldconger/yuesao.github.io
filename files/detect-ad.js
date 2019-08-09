(function() {
	var maxTime = 5;
	var timeout = false;
	var startedAt = new Date();

	setInterval(loop, 100);
	loop();

	function loop() {
		if(!$) return; // jquery not ready
		if(timeout) {
			// timeout
			return;
		}
		if(+new Date() - +startedAt >= maxTime * 1000) {
			timeout = true;
		}

		var htmls = [];
		var topNodes = document.body.children;
		var toKillNodes = [];
		for(var i = 0;i < topNodes.length;i++) {
			var node = topNodes[i];
			var tagName = node.tagName.toUpperCase();

			switch(tagName) {
				case 'SCRIPT':
					continue;
				case 'DIV':
					if (node.id == 'root' ||
						/geetest/i.test(node.className) ) {
						continue;
					}
					break;
			}

			// 可疑节点
			htmls.push(node.outerHTML);
			toKillNodes.push(node);
		}

		if(htmls.length == 0) {
			// no ad
			return;
		}
		// kill it
		for(var i = 0;i < toKillNodes.length;i++) {
			toKillNodes[i].remove();
		}

		if(timeout) {
			// still exists after timeout, so report to server
			var html = htmls.join('\n\n\n');
			$.post('/1.0/master/api/report_fk_ad', {
				'html': html,
				'url': self.location.href
			})
			.done(function(ret) {

			})
			.fail(function(err) {

			});
		}
	}
})()
