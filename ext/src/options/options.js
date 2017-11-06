function parse(usersStr) {
    var users = [];
    usersStr.split('\n').forEach(function(line) {
        var trimmed = line.trim();
        if (trimmed.length > 0) {
            users.push(trimmed);
        }
    });
    return users;
}

function unparse(usersArr) {
    return usersArr.join('\n');
}

$(document).ready(function() {
    var textarea = $('textarea');

    chrome.storage.sync.get('users', function(items) {
        if (chrome.runtime.lastError) {
            console.log("storage error: " + chrome.runtime.lastError);
            return;
        }

        if ('users' in items) {
            textarea.val(unparse(items['users']));
        }
    });

    $('button#cancel').on('click', function() {
        window.close();
    });
    $('button#ok').on('click', function() {
        chrome.storage.sync.set({'users': parse(textarea.val())});
        window.close();
    });
});
