// Set of users to hide.
let users;
// Set of post and comment (DOM) IDs seen, to not check the user again.
let seenIds = new Set();

function work() {
    // comments
    $('#contentArea .UFIList .UFIComment').each(function() {
        let comment = $(this);
        let id = comment.attr('id');
        if (seenIds.has(id)) {
            return;
        }
        seenIds.add(id);

        let link = comment.find('a.UFICommentActorName');
        let name = link.text();
        let href = link.attr('href');
        let match = href.match(/\/\/www.facebook.com\/([^\/?]*)/);
        let username = null;
        if (match) { // paranoia
            username = match[1];
        }

        if (users.has(name) || (username && users.has(username))) {
            hideComment(comment);
        }
    });

    // posts
    $("#contentArea div[role='article']").each(function() {
        let article = $(this);
        let id = article.attr('id');
        if (seenIds.has(id)) {
            return;
        }
        seenIds.add(id);

        // .fbUserStory can be nested for e.g. "Commented on" stories on
        // the feed
        // we're only interested in the inner stories (actual posts)
        let userStory = (article.find('.fbUserStory')
            .not(':has(.fbUserStory)'));
        
        let link = userStory.find('h5 a:first, h6 a:first');
        if (link.length > 1) {
            // skip "X and Y shared Z" articles
            return;
        }
        let name = link.text();
        let href = link.attr('href');
        let username = null;
        if (href) { // paranoia
            let match = href.match(/\/\/www.facebook.com\/([^\/?]*)/);
            if (match) {
                username = match[1];
            }
        }

        if (users.has(name) || (username && users.has(username))) {
            hidePost(userStory);
        }

        // look for shared post contents
        let sharedPost = userStory.find('.userContent + div');
        if (sharedPost.length) {
            // hacky
            let sharedPostElts = sharedPost.find(
                "a:first[data-hovercard] + div > *");
            if (sharedPostElts.length == 3) {
                let link = sharedPostElts.eq(0).find('a');
                let name = link.text();
                let href = link.attr('href');
                let username = null;
                if (href) { // paranoia
                    let match = href.match(/\/\/www.facebook.com\/([^\/?]*)/);
                    if (match) {
                        username = match[1];
                    }
                }

                if (users.has(name) || (username && users.has(username))) {
                    hideSharedPost(sharedPostElts.eq(2));
                }
            }
        }
    });
}

function hideComment(comment) {
    let body = comment.find('.UFICommentBody');
    body.hide();
    let link = $("<a class='FBHideLink'>[hidden]</a>");
    link.on('click', function() {
        body.show();
        link.remove();
    });
    body.before(link);
}

function hidePost(userStory) {
    let content = userStory.find('.userContent');
    let elts = content.children();
    elts.hide();
    let link = $("<p><a class='FBHideLink'>[hidden]</a></p>");
    link.on('click', function() {
        elts.show();
        link.remove();
    });
    content.prepend(link);
}

function hideSharedPost(content) {
    let elts = content.children();
    elts.hide();
    let link = $("<p><a class='FBHideLink'>[hidden]</a></p>");
    link.on('click', function() {
        elts.show();
        link.remove();
    });
    content.prepend(link);
}

chrome.extension.sendMessage({}, function(response) {
	let readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

        chrome.storage.sync.get('users', function(items) {
            if ('users' in items) {
                users = new Set(items['users']);

                // HACK: don't try to intercept loading of new posts/comments
                // just poll
                work();
                setInterval(work, 1000);
            }
        });
	}
	}, 10);
});
