
module.exports.register = function () {
    this.on('navigationBuilt', ({contentCatalog}) => {
        const compomentsPdfs = {}
        contentCatalog.getComponents().forEach((component) => {
            if(component.latest?.asciidoc?.attributes?.pdfs) {
                compomentsPdfs[component.name] = component.latest.asciidoc.attributes.pdfs;
            }            
        });            
        
        contentCatalog.getFiles().forEach((file) => {
            if(file.asciidoc && file.asciidoc.attributes) {
                if(compomentsPdfs[file.src.component] && compomentsPdfs[file.src.component][file.src.module]) {
                    const pdfLink =  compomentsPdfs[file.src.component][file.src.module];
                    file.asciidoc.attributes['page-pdflink'] = pdfLink;
                }            
            }
        })
    })
}