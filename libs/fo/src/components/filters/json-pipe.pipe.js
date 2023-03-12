
Service({
    name: 'JsonPipe'
})
export function JsonXPipe() {
    this.compile = function(value, type){
        if(value){
            if (Array.isArray(value)){
                if (type === 'c'){
                    value = value.toString();
                } else if(type === 's'){
                    value = value.join(' ')
                }
            } else if (typeof value === 'object'){
                switch(type){
                    case('e'):
                        value = this.stripToEqual(value);
                    break;
                 /**
                 * Any type pattern = | {}
                 *  if (value.style) return as json string
                 */
                    case('a'):
                    if (value.style)
                        value = JSON.stringify(value, null, 2)
                    else
                        value =  this.stripToEqual(value);
                    break;
                }
            }
        }
        return value;
    }
}

JsonXPipe.prototype.stripToEqual = function(value){
    return Object.keys(value)
        .map(key => key +'='+value[key])
        .join(' ');
}