module.exports = SkinSpider;

var fs = require("fs");
var path = require("path");
var handlebars = require("handlebars");
var htmlminify = require("html-minifier").minify;
var jsext = require("jsext");

function SkinSpider (options) {
    var self = this;
    self.options = Object.assign({}, self.DEFAULTOPTIONS, options);
    self.reset();
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
    ext : "html",
    htmlcompression : {
        removeComments:            true,
        collapseWhitespace:        true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes:     true,
        removeEmptyAttributes:     true,
        minifyJS:                  true
    }
};

SkinSpider.prototype.reset = function () {
    var self = this;
    self.skins = {};
}

SkinSpider.prototype.render = function(template, data, forceload) {
    var self = this;
    var skin = self.skin(template, forceload);
    if(skin.error || !skin.bin) return skin;

    try {
        var html = skin.bin(data);
        var minifiedhtml = htmlminify(html, self.options.compression);
        return {html:minifiedhtml};
    } catch(e) {
        return {error:SkinSpider.ERROR.RENDER, internalerror:e && e.toString()};
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
    handlebars.registerHelper("skin", function(skin, context) {
        context = assertContext(context);
        var rendered = self.render(skin, context);
        var error = rendered && rendered.error;
        var content = rendered && rendered.html;
        if(content == undefined || error)
            content = error && error + " (" + (skin || "") + ")" || "ERROR(" + skin + ")" || "ERROR(" + skin + ")";

        return new handlebars.SafeString(content);
    });

    if(self.options.helpers) {
        Object.keys(self.options.helpers).forEach(function(helperKey) {
            handlebars.registerHelper(helperKey, function() {
                var helper = self.options.helpers[helperKey];
                if(!helper) return;

                var content = helper.apply(null, arguments);
                if(!content) return;

                return new handlebars.SafeString(content);
            })
        });
    }
}

function assertContext (context) {
    if(!context) return;

    return context && context.data && context.data.root || context;
}