
function openBlock () {
    this.onContext('example')
    this.process((parent, reader, attrs) => {
        this.createBlock(parent, 'open', attrs)
    });
}


module.exports.register = (registry, context) => {
    registry.block('open', openBlock)
}
  
  