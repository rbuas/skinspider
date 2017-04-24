module.exports = SkinSpider;

var handlebars = require("handlebars");
var fs = require("fs");
var path = require("path");
var jsext = require("jsext");

function SkinSpider (options) {
    var self = this;
    self.options = Object.assign({}, self.DEFAULTOPTIONS, options);
    self.resetcache();
    registerHelpers(self);
}

SkinSpider.ERROR = {
    MISSING_PARAMS : "Missing function parameters",
    NOTEMPLATE : "Can not found the template",
    TEMPLATE_COMPILATION : "Template compilation error",
    RENDER : "Error during the render"
};

SkinSpider.prototype.DEFAULTOPTIONS = {
    path : "views",
    ext : "html"
};

SkinSpider.prototype.resetcache = function () {
    var self = this;
    self.skins = {};
}

SkinSpider.prototype.render = function(template, data, forceload) {
    var self = this;
    var skin = self.skin(template, forceload);
    if(skin.error || !skin.bin) return skin;

    try {
        var html = skin.bin(data);
        return {html:html};
    } catch(e) {
        return {error:SkinSpider.ERROR.RENDER};
    }
}

SkinSpider.prototype.skin = function(template, forceload) {
    var self = this;
    if(!template) return {error:SkinSpider.ERROR.MISSING_PARAMS};

    var skin = !forceload && self.skins && self.skins[template] ? self.skins[template] : self.load(template);
    return skin;
}

SkinSpider.prototype.load = function(template) {
    var self = this;
    if(!template) return {error:SkinSpider.ERROR.MISSING_PARAMS};

    var templatePath = self.options.path || "";
    var ext = self.options.ext && "." + self.options.ext || "";
    var templatefile = path.join(templatePath, template) + ext;
    if(!jsext.fileExists(templatefile)) return {error:SkinSpider.ERROR.NOTEMPLATE, template:template, ext:self.options.ext};

    var templateContent = fs.readFileSync(templatefile, 'utf8');
    var skin = handlebars.compile(templateContent);
    if(!skin) return {error:SkinSpider.ERROR.TEMPLATE_COMPILATION};

    self.skins[template] = {bin:skin};
    return self.skins[template];
}



// PRIVATE

function registerHelpers (self) {
    handlebars.registerHelper("skin", function(options, context) {
        var skin = options && options.hash && options.hash["skin"] || null;
        var rendered = self.render(skin, context);
        return new handlebars.SafeString(rendered && rendered.html || rendered.error || ":(");
    });
}