module.exports = SkinSpider;

var handlebars = require("handlebars");
var fs = require("fs");
var path = require("path");
var jsext = require("jsext");

function SkinSpider (options) {
    var self = this;
    self.options = Object.assign({}, self.DEFAULTOPTIONS, options);
    self.resetcache();
}

SkinSpider.prototype.DEFAULTOPTIONS = {
    path : "views",
    ext : "html"
};

SkinSpider.prototype.resetcache = function () {
    var self = this;
    self.views = {};
}

SkinSpider.prototype.render = function(template, data, force) {
    var self = this;
    if(!template)
        return;

    var templateCompiled = self.views && self.views[template];
    if(force || !templateCompiled) {
        var templateFile = path.join(self.options.path, template) + "." + self.options.ext;
        if(!jsext.fileExists(templateFile)) return "NOTEMPLATE";

        var templateRaw = fs.readFileSync(templateFile, 'utf8');
        templateCompiled = self.views[template] = handlebars.compile(templateRaw);
        if(!templateCompiled) return "TEMPLATEERROR";
    }

    try {
        var html = templateCompiled(data);
    } catch(e) {
        return;
    }
    return html;
}