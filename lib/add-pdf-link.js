/*
 * The contents of this file are subject to the terms of the Common Development and
 * Distribution License (the License). You may not use this file except in compliance with the
 * License.
 *
 * You can obtain a copy of the License at legal/CDDLv1.0.txt. See the License for the
 * specific language governing permission and limitations under the License.
 *
 * When distributing Covered Software, include this CDDL Header Notice in each file and include
 * the License file at legal/CDDLv1.0.txt. If applicable, add the following below the CDDL
 * Header, with the fields enclosed by brackets [] replaced by your own identifying
 * information: "Portions copyright [year] [name of copyright owner]".
 *
 * Copyright 2024-2026 3A Systems, LLC.
 */

module.exports.register = function () {
    this.on('navigationBuilt', ({contentCatalog}) => {
        const compomentsPdfs = {}
        contentCatalog.getComponents().forEach((component) => {
            if(component.latest?.asciidoc?.attributes?.pdfs) {
                compomentsPdfs[component.name] = component.latest.asciidoc.attributes.pdfs;
            }            
        });            
        
        contentCatalog.getFiles().forEach((file) => {
            // the PDFs are built from the current sources, so older versions get no PDF link
            if(file.asciidoc && file.asciidoc.attributes && file.src.version === contentCatalog.getComponent(file.src.component)?.latest?.version) {
                if(compomentsPdfs[file.src.component] && compomentsPdfs[file.src.component][file.src.module]) {
                    const pdfLink =  compomentsPdfs[file.src.component][file.src.module];
                    file.asciidoc.attributes['page-pdflink'] = pdfLink;
                }            
            }
        })
    })
}