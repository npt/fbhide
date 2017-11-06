// Set of users to hide.
let users;
// Set of post and comment (DOM) IDs seen, to not check the user again.
let seenIds = new Set();

function href2user(href) {
    // extract username from URL if present, ID if not
    // or return null if the URL matches neither or is null
    if (!href) {
        return null;
    }

    // check profile.php URL first
    let match = href.match(/profile\.php\?id=(\d*)/);
    let username = null;
    if (match) { // paranoia
        return match[1];
    } else {
        // username
        match = href.match(/\/\/www.facebook.com\/([^\/?]*)/);
        if (match) {
            return match[1];
        }
    }

    return null;
}

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
        let username = href2user(href);

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

        // .userContentWrapper can be nested for e.g. "Commented on" stories on
        // the feed
        // we're only interested in the inner stories (actual posts)
        let contentWrapper = (article.find('.userContentWrapper')
            .not(':has(.userContentWrapper)'));
        
        let link = contentWrapper.find('h5 a:first, h6 a:first');
        if (link.length > 1) {
            // skip "X and Y shared Z" articles
            return;
        }
        let name = link.text();
        let href = link.attr('href');
        let username = href2user(href);

        if (users.has(name) || (username && users.has(username))) {
            hidePost(contentWrapper);
        }

        // look for shared post contents
        let sharedPost = contentWrapper.find('.userContent + div');
        if (sharedPost.length) {
            // hacky
            let sharedPostElts = sharedPost.find(
                "a:first[data-hovercard] + div > *");
            if (sharedPostElts.length == 3) {
                let link = sharedPostElts.eq(0).find('a');
                let name = link.text();
                let href = link.attr('href');
                let username = href2user(href);

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
    let content = comment.find('.UFICommentActorAndBody ~ *');
    content.hide();
    let link = $("<a class='FBHideLink'>[hidden]</a>");
    link.on('click', function() {
        body.show();
        content.show();
        link.remove();
    });
    body.before(link);
}

function hidePost(contentWrapper) {
    let content = contentWrapper.find('.userContent');
    let elts = content.children().add(content.nextAll());
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
    chrome.storage.sync.get('users', function(items) {
        if ('users' in items) {
            users = new Set(items['users']);

            let readyStateCheckInterval = setInterval(function() {
                work();

                if (document.readyState === "complete") {
                    clearInterval(readyStateCheckInterval);
                    // HACK: don't try to intercept loading of new content
                    // just poll
                    work();
                    setInterval(work, 1000);
                }
            }, 10);
        }
    });
});
